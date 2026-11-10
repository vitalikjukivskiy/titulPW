// Isolated test database. This file never connects to Cloudflare or production.
import { readFileSync } from 'node:fs';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
globalThis.__poleTestEnv = { SESSION_SECRET: 'local-test-session-secret', ADMIN_PIN: 'local-test-pin' };
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'cloudflare:workers') return { url: 'pole-test:workers', shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: new URL(specifier.slice(2) + '.ts', root).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'pole-test:workers') return { format: 'module', source: 'export const env = globalThis.__poleTestEnv;', shortCircuit: true };
    if (url.startsWith(root.href) && url.endsWith('.ts')) return {
      format: 'module', source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), 'utf8')), shortCircuit: true,
    };
    return nextLoad(url, context);
  },
});

export const action = await import('../app/api/admin/action/route.ts');
export const state = await import('../app/api/state/route.ts');
export const register = await import('../app/api/register/route.ts');
export const login = await import('../app/api/admin/login/route.ts');
export const check = await import('../app/api/admin/check/route.ts');
const { signature } = await import('../lib/show.ts');
export const hostCookie = `show_host=${await signature('host')}`;
export const fixture = { sqlite: null, beforeRun: null, afterAll: null };

export function resetFixture() {
  fixture.sqlite?.close();
  fixture.sqlite = new DatabaseSync(':memory:');
  fixture.beforeRun = fixture.afterAll = null;
  for(const entry of JSON.parse(readFileSync(new URL('../drizzle/meta/_journal.json',import.meta.url),'utf8')).entries) fixture.sqlite.exec(readFileSync(new URL('../drizzle/'+entry.tag+'.sql',import.meta.url),'utf8'));
  fixture.sqlite.prepare('INSERT INTO settings(id,registration_open) VALUES(1,1)').run();
  for (const [i, name] of ['TestAlpha', 'TestBeta', 'TestGamma'].entries()) {
    fixture.sqlite.prepare('INSERT INTO players(nickname,name_key,device_id,created_at) VALUES(?,?,?,?)')
      .run(name, name.toLowerCase(), `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`, Date.now());
  }
  fixture.sqlite.prepare('INSERT INTO draws(round,entries,winner_index,started_at,finished_at) VALUES(1,?,0,?,?)')
    .run(JSON.stringify(['ArchivedWinner', 'ArchivedPlayer']), Date.now() - 120000, Date.now() - 60000);
  globalThis.__poleTestEnv.DB = {
    prepare(sql) {
      let parameters = [];
      const statement = {
        bind(...values) { parameters = values; return statement; },
        async first() { return fixture.sqlite.prepare(sql).get(...parameters) ?? null; },
        async all() {
          const results = fixture.sqlite.prepare(sql).all(...parameters);
          fixture.afterAll?.(sql);
          return { results, success: true };
        },
        async run() {
          fixture.beforeRun?.(sql);
          const result = fixture.sqlite.prepare(sql).run(...parameters);
          return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
        },
      };
      return statement;
    },
  };
}

export function countPlayers() { return fixture.sqlite.prepare('SELECT count(*) AS n FROM players').get().n; }
export function addActiveDraw() {
  fixture.sqlite.prepare('INSERT INTO draws(round,entries,winner_index,started_at) VALUES(2,?,0,?)')
    .run(JSON.stringify(['TestAlpha', 'TestBeta', 'TestGamma']), Date.now());
}
export function actionRequest(body = { action: 'removeAll', confirmed: true }, headers = {}) {
  return new Request('http://127.0.0.1/api/admin/action', {
    method: 'POST', headers: { origin: 'http://127.0.0.1', cookie: hostCookie, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}
