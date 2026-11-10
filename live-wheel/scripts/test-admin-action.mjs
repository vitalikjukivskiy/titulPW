import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { action, state, register, fixture, resetFixture, countPlayers, addActiveDraw, actionRequest } from './admin-test-fixture.mjs';

beforeEach(resetFixture);
after(() => fixture.sqlite?.close());

test('unauthenticated and forged sessions cannot remove participants', async () => {
  for (const cookie of ['', 'show_host=forged-session']) {
    const response = await action.POST(actionRequest(undefined, { cookie }));
    assert.equal(response.status, 401);
    assert.equal(countPlayers(), 3);
  }
});

test('foreign and missing Origin are rejected even for an administrator', async () => {
  for (const origin of ['https://other.example', 'null', '']) {
    assert.equal((await action.POST(actionRequest(undefined, { origin }))).status, 403);
    assert.equal(countPlayers(), 3);
  }
});

test('explicit boolean confirmation is required', async () => {
  for (const confirmed of [undefined, false, 'true', 1]) {
    assert.equal((await action.POST(actionRequest({ action: 'removeAll', confirmed }))).status, 400);
    assert.equal(countPlayers(), 3);
  }
});

test('confirmed removal clears the roster and preserves history and registration', async () => {
  const history = fixture.sqlite.prepare('SELECT * FROM draws').all();
  const settings = fixture.sqlite.prepare('SELECT * FROM settings').all();
  const response = await action.POST(actionRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, deleted: 3 });
  assert.equal(countPlayers(), 0);
  assert.deepEqual(fixture.sqlite.prepare('SELECT * FROM draws').all(), history);
  assert.deepEqual(fixture.sqlite.prepare('SELECT * FROM settings').all(), settings);
  const refreshed = await (await state.GET(new Request('http://127.0.0.1/api/state'))).json();
  assert.deepEqual(refreshed.players, []);
  assert.equal(refreshed.history[0].name, 'ArchivedWinner');
});

test('empty list is a successful no-op; repeated requests remain safe', async () => {
  const responses = await Promise.all([action.POST(actionRequest()), action.POST(actionRequest())]);
  assert.deepEqual((await Promise.all(responses.map(r => r.json()))).map(x => x.deleted).sort(), [0, 3]);
  assert.equal(countPlayers(), 0);
  assert.deepEqual(await (await action.POST(actionRequest())).json(), { ok: true, deleted: 0 });
});

test('active draw blocks bulk removal', async () => {
  addActiveDraw();
  assert.equal((await action.POST(actionRequest())).status, 409);
  assert.equal(countPlayers(), 3);
});

test('draw starting between the initial check and DELETE blocks removal atomically', async () => {
  fixture.beforeRun = sql => {
    if (sql.startsWith('DELETE FROM players')) { fixture.beforeRun = null; addActiveDraw(); }
  };
  assert.equal((await action.POST(actionRequest())).status, 409);
  assert.equal(countPlayers(), 3);
});

test('roster cleared between snapshot and draw INSERT prevents a stale draw', async () => {
  fixture.afterAll = sql => {
    if (sql.startsWith('SELECT id,nickname')) { fixture.afterAll = null; fixture.sqlite.exec('DELETE FROM players'); }
  };
  assert.equal((await action.POST(actionRequest({ action: 'start' }))).status, 409);
  assert.equal(fixture.sqlite.prepare('SELECT count(*) AS n FROM draws WHERE finished_at IS NULL').get().n, 0);
});

test('normal draw start still works with the guarded snapshot', async () => {
  const response = await action.POST(actionRequest({ action: 'start' }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.entries, ['TestAlpha', 'TestBeta', 'TestGamma']);
  assert.equal(result.round, 2);
  assert.ok(result.winnerIndex >= 0 && result.winnerIndex < 3);
});

test('finished draw can settle before bulk removal', async () => {
  addActiveDraw();
  fixture.sqlite.prepare('UPDATE draws SET started_at=? WHERE round=2').run(Date.now() - 61000);
  assert.equal((await action.POST(actionRequest())).status, 200);
  assert.equal(countPlayers(), 0);
  assert.notEqual(fixture.sqlite.prepare('SELECT finished_at FROM draws WHERE round=2').get().finished_at, null);
});

test('database failure returns an error and preserves participants', async () => {
  fixture.beforeRun = sql => { if (sql.startsWith('DELETE FROM players')) throw Error('Simulated local DB failure'); };
  const original = console.error;
  console.error = () => {};
  try {
    const response = await action.POST(actionRequest());
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /Не вдалося/);
    assert.equal(countPlayers(), 3);
  } finally { console.error = original; }
});

test('a cleared participant can register again with the same nickname and device', async () => {
  await action.POST(actionRequest());
  const response = await register.POST(new Request('http://127.0.0.1/api/register', {
    method: 'POST', headers: { origin: 'http://127.0.0.1', cookie: 'show_device=00000000-0000-0000-0000-000000000000' },
    body: JSON.stringify({ nickname: 'TestAlpha' }),
  }));
  assert.equal(response.status, 201);
  assert.equal(countPlayers(), 1);
});
