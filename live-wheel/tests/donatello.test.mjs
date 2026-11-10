import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { env } from './workers.mjs';
import { POST as callback } from '../app/api/donatello/callback/route.ts';
import { POST as register } from '../app/api/register/route.ts';
import { POST as action } from '../app/api/admin/action/route.ts';
import { GET as state } from '../app/api/state/route.ts';
import { GET as ledger } from '../app/api/admin/donations/route.ts';
import { signature } from '../lib/show.ts';
import { PLAYERS_SQL, START_DRAW_SQL, ticketSnapshot } from '../lib/raffle.ts';
import { amountInMinor } from '../lib/tickets.ts';

let sql;
class Statement {
  constructor(query) { this.query = query; this.params = []; }
  bind(...params) { this.params = params; return this; }
  async first() { return sql.prepare(this.query).get(...this.params) ?? null; }
  async all() { return { results: sql.prepare(this.query).all(...this.params) }; }
  async run() { const r = sql.prepare(this.query).run(...this.params); return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; }
}
beforeEach(() => {
  sql = new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  for (const file of ['0000_nice_gauntlet', '0001_chunky_roxanne_simpson', '0002_donatello_tickets']) sql.exec(readFileSync(new URL('../drizzle/' + file + '.sql', import.meta.url), 'utf8'));
  env.DB = { prepare: q => new Statement(q), batch: async queries => {
    sql.exec('BEGIN'); try { const results=[]; for (const q of queries) results.push(await q.all()); sql.exec('COMMIT'); return results; }
    catch(e) { sql.exec('ROLLBACK'); throw e; }
  } };
  env.SESSION_SECRET = 'test-session-secret';
  env.DONATELLO_CALLBACK_KEY = 'test-callback-key-0123456789-abcdef';
});
afterEach(() => sql.close());
const req = (path, body, headers = {}) => new Request('https://wheel.test'+path, { method:'POST', headers:{ Origin:'https://wheel.test', 'Content-Type':'application/json', ...headers }, body:JSON.stringify(body) });
async function player(nickname) {
  const response = await register(req('/api/register', {nickname}));
  assert.equal(response.status,201);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const info = await (await state(new Request('https://wheel.test/api/state', {headers:{cookie}}))).json();
  return { cookie, code:info.donation.code, id:info.myPlayerId };
}
const event = (p, pubId='D41-100', amount='50') => ({pubId,source:'donatello',currency:'UAH',amount,message:p.code,createdAt:String(Math.floor(Date.now()/1000)),isSubscription:false});
async function donate(payload, key=env.DONATELLO_CALLBACK_KEY) { return callback(req('/api/donatello/callback',payload,{'X-Key':key})); }
async function getState(p) { return (await state(new Request('https://wheel.test/api/state',{headers:{cookie:p?.cookie||''}}))).json(); }
async function host(body) { return action(req('/api/admin/action',body,{cookie:'show_host='+await signature('host')})); }

test('registration grants one free ticket; codes and secrets are private',async()=>{
  const a=await player('Гравець'); const b=await player('Інший');
  assert.notEqual(a.code,b.code); assert.match(a.code,/^PW-[A-F0-9]{32}$/);
  const info=await getState(); assert.equal(info.totalTickets,2); assert.equal(info.donation.code,null);
  assert.ok(!JSON.stringify(info).includes(a.code)); assert.ok(!JSON.stringify(info).includes(env.DONATELLO_CALLBACK_KEY));
  assert.equal((await ledger(new Request('https://wheel.test/api/admin/donations'))).status,401);
});
test('two donations accumulate, decimal amounts stay exact, duplicate delivery adds nothing',async()=>{
  const a=await player('Alice'); await player('Bob');
  await donate(event(a,'D41-101','24.99')); await donate(event(a,'D41-102','25.01'));
  const duplicate=await (await donate(event(a,'D41-102','500'))).json(); assert.equal(duplicate.duplicate,true);
  const info=await getState(a); assert.equal(info.players[0].tickets,2); assert.equal(info.totalTickets,3);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM donations').get().n,2);
});
test('invalid key and missing configuration cannot credit donations',async()=>{
  const a=await player('Alice'); assert.equal((await donate(event(a),'wrong')).status,401);
  delete env.DONATELLO_CALLBACK_KEY; assert.equal((await donate(event(a),'anything')).status,503);
  assert.equal((await getState(a)).donation.enabled,false);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM donations').get().n,0);
});
test('foreign currencies, imported donations and subscriptions never award tickets',async()=>{
  const a=await player('Alice');
  for(const change of [{currency:'USD'},{actualCurrency:'USD'},{source:'customProvider'},{isSubscription:true},{createdAt:'bad'},{amount:'-50'},{amount:'NaN'}]) {
    const response=await (await donate({...event(a),...change})).json(); assert.equal(response.credited,false);
  }
  assert.equal((await getState(a)).totalTickets,1);
});
test('missing, ambiguous or forged participant codes are logged for review without tickets',async()=>{
  const a=await player('Alice'),b=await player('Bob');
  for(const [i,message] of ['Alice',a.code+' '+b.code,'PW-'+ 'F'.repeat(32)].entries())await donate({...event(a,'D41-'+(200+i)),message});
  assert.equal((await getState()).totalTickets,2);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM donations WHERE player_id IS NULL').get().n,3);
});
test('payments predating registration cannot be attached to a new participant',async()=>{
  const a=await player('Alice'); await donate({...event(a),createdAt:String(Math.floor(Date.now()/1000)-60)});
  assert.equal((await getState(a)).totalTickets,1);
});
test('bonus cap and frozen draw are consistent; late callbacks go to the next round',async()=>{
  const a=await player('Alice'); await player('Bob');
  await donate(event(a,'D41-300','1000'));
  assert.equal((await getState(a)).players[0].tickets,10);
  const start=await host({action:'start'}); assert.equal(start.status,200);
  const draw=await start.json(); assert.equal(draw.entries.length,2); assert.deepEqual(draw.weights,[10,1]);
  assert.ok(draw.winnerIndex>=0&&draw.winnerIndex<2);
  await donate(event(a,'D41-301','50'));
  const active=await getState(a); assert.equal(active.active.ticketCount,11); assert.equal(active.totalTickets,3); assert.equal(active.nextRound,2);
  sql.prepare('UPDATE draws SET started_at=?').run(Date.now()-61000);
  const done=await getState(a); assert.equal(done.history[0].ticketCount,11); assert.equal(done.history[0].count,2);
  assert.equal((await host({action:'start'})).status,200);
  assert.equal((await getState(a)).totalTickets,2);
});
test('one donor cannot start a draw alone, and pending paid entries cannot be removed',async()=>{
  const a=await player('Alice'); await donate(event(a,'D41-400','1000'));
  assert.equal((await host({action:'start'})).status,409);
  assert.equal((await host({action:'remove',id:a.id})).status,409);
});
test('a donation racing a draw invalidates the stale candidate instead of losing tickets',async()=>{
  const a=await player('Alice'); await player('Bob');
  const before=ticketSnapshot((await env.DB.prepare(PLAYERS_SQL).all()).results);
  const snapshot=JSON.stringify(before.entries), weights=JSON.stringify(before.weights);
  await donate(event(a));
  const insert=await env.DB.prepare(START_DRAW_SQL).bind(snapshot,weights,0,Date.now(),snapshot,weights).run();
  assert.equal(insert.meta.changes,0); assert.equal(sql.prepare('SELECT COUNT(*) n FROM draws').get().n,0);
  assert.equal((await host({action:'start'})).status,200);
});
test('legacy participants get a code when returning; old draw history remains readable',async()=>{
  sql.exec("INSERT INTO players(nickname,name_key,device_id,created_at) VALUES('Legacy','legacy','device',1)");
  const legacy=await getState({cookie:'show_device=device'});
  assert.match(legacy.donation.code,/^PW-[A-F0-9]{32}$/);
  assert.equal((await getState({cookie:'show_device=device'})).donation.code,legacy.donation.code);
  sql.prepare('INSERT INTO draws(round,entries,winner_index,started_at,finished_at) VALUES(1,?,0,1,60001)').run('["OldA","OldB"]');
  assert.equal((await getState()).history[0].winnerTickets,1);
});
test('money parser rejects coercions and excessive precision',()=>{
  assert.equal(amountInMinor('50.01'),5001);
  for(const value of [null,true,'5e3','50.001',' 50','00.5',Infinity,0])assert.equal(amountInMinor(value),null);
});

test('stream settings survive and bulk removal cannot discard pending donations',async()=>{
  const a=await player('Alice'); await player('Bob');
  assert.equal((await host({action:'stream',url:'https://youtu.be/dQw4w9WgXcQ'})).status,200);
  assert.equal((await getState()).streamVideoId,'dQw4w9WgXcQ');
  await donate(event(a));
  assert.equal((await host({action:'removeAll',confirmed:true})).status,409);
  assert.equal((await getState()).players.length,2);
  await host({action:'start'}); sql.prepare('UPDATE draws SET started_at=?').run(Date.now()-61000);
  await getState();
  assert.equal((await host({action:'removeAll',confirmed:true})).status,200);
  assert.equal((await getState()).players.length,0);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM donations').get().n,1);
});
test('legacy weighted history keeps its original odds',async()=>{
  sql.prepare('INSERT INTO draws(round,entries,weights,winner_index,started_at,finished_at) VALUES(1,?,?,0,1,60001)').run('["OldA","OldB"]','[6,5]');
  const old=(await getState()).history[0]; assert.equal(old.winnerTickets,6);assert.equal(old.ticketCount,11);
});
