import assert from 'node:assert/strict';
import {beforeEach,after,test} from 'node:test';
import {fixture,resetFixture,action,state,actionRequest,addActiveDraw} from './admin-test-fixture.mjs';
const tap=await import('../app/api/tap/route.ts');
const {weightFor,weightedIndex,sectors,parseVideoId}=await import('../lib/odds.ts');
const device='00000000-0000-0000-0000-000000000000';
const request=(target,headers={})=>new Request('http://127.0.0.1/api/tap',{method:'POST',headers:{origin:'http://127.0.0.1',cookie:'show_device='+device,...headers},body:JSON.stringify({target})});
const current=()=>fixture.sqlite.prepare('SELECT taps FROM players WHERE device_id=?').get(device).taps;
beforeEach(resetFixture);after(()=>fixture.sqlite?.close());
test('200 real progress units unlock one persistent 1.2 weight; duplicate targets do not double count',async()=>{
 for(let target=10;target<=200;target+=10){fixture.sqlite.exec('UPDATE players SET tap_updated_at=0');const r=await tap.POST(request(target));assert.equal(r.status,200);assert.equal((await r.json()).taps,target);assert.equal((await (await tap.POST(request(target))).json()).taps,target)}
 assert.equal(current(),200);
 const x=await (await state.GET(request(200))).json();assert.equal(x.players[0].weight,6);assert.equal(x.players[1].weight,5);assert.equal(x.myPlayerId,1);
 assert.equal((await tap.POST(request(201))).status,400);assert.equal(current(),200);
});
test('tap validation, bounded increments, registration closure and active draw prevent changes',async()=>{
 assert.equal((await tap.POST(request(10,{cookie:''}))).status,401);
 assert.equal((await tap.POST(request(10,{origin:'https://foreign.example'}))).status,403);
 assert.equal((await tap.POST(request(1.5))).status,400);
 await tap.POST(request(200));assert.equal(current(),0);
 await tap.POST(request(10));await tap.POST(request(20));assert.equal(current(),10);
 fixture.sqlite.exec('UPDATE players SET tap_updated_at=0; UPDATE settings SET registration_open=0');
 await tap.POST(request(20));assert.equal(current(),10);
 fixture.sqlite.exec('UPDATE settings SET registration_open=1');addActiveDraw();
 assert.equal((await tap.POST(request(20))).status,409);assert.equal(current(),10);
});
test('all weighted tickets map exactly 6:5:5; sectors align with every result',()=>{
 assert.equal(weightFor(199),5);assert.equal(weightFor(200),6);
 const weights=[6,5,5],counts=[0,0,0];for(let i=0;i<16;i++)counts[weightedIndex(weights,i)]++;
 assert.deepEqual(counts,weights);
 const slices=sectors(weights);assert.equal(slices[0].width/slices[1].width,1.2);
 for(let i=0;i<3;i++)assert.ok(Math.abs(slices[i].width-weights[i]/16)<1e-12);
});
test('draw snapshots weights and rejects a tap change between read and insert',async()=>{
 fixture.sqlite.exec('UPDATE players SET taps=200 WHERE id=1');
 let r=await action.POST(actionRequest({action:'start'}));assert.equal(r.status,200);const x=await r.json();assert.deepEqual(x.weights,[6,5,5]);
 const draw=fixture.sqlite.prepare('SELECT * FROM draws WHERE finished_at IS NULL').get();assert.deepEqual(JSON.parse(draw.weights),[6,5,5]);
 resetFixture();let mutated=false;fixture.afterAll=sql=>{if(!mutated&&sql.includes('FROM players ORDER BY id')){mutated=true;fixture.sqlite.exec('UPDATE players SET taps=200 WHERE id=1')}};
 r=await action.POST(actionRequest({action:'start'}));assert.equal(r.status,409);assert.equal(fixture.sqlite.prepare('SELECT COUNT(*) n FROM draws WHERE finished_at IS NULL').get().n,0);
});
test('only host can set stream, invalid hosts rejected and stream visible to viewers',async()=>{
 assert.equal(parseVideoId('https://youtu.be/McPPSZeoA0M?t=4'),'McPPSZeoA0M');
 assert.equal(parseVideoId('https://www.youtube.com/live/McPPSZeoA0M'),'McPPSZeoA0M');
 assert.equal(parseVideoId('https://youtube.com.evil.example/watch?v=McPPSZeoA0M'),null);
 assert.equal((await action.POST(actionRequest({action:'stream',url:'https://youtu.be/McPPSZeoA0M'},{cookie:''}))).status,401);
 assert.equal((await action.POST(actionRequest({action:'stream',url:'javascript:alert(1)'}))).status,400);
 assert.equal((await action.POST(actionRequest({action:'stream',url:'https://youtu.be/McPPSZeoA0M'}))).status,200);
 assert.equal((await (await state.GET(request(1))).json()).streamVideoId,'McPPSZeoA0M');
 await action.POST(actionRequest({action:'stream',url:''}));assert.equal((await (await state.GET(request(1))).json()).streamVideoId,null);
});
