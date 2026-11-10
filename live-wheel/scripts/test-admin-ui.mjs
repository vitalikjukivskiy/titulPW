import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { action, state, register, login, check, fixture, resetFixture, countPlayers, addActiveDraw } from './admin-test-fixture.mjs';

const require = createRequire(import.meta.url);
const { chromium } = process.env.PLAYWRIGHT_MODULE ? require(process.env.PLAYWRIGHT_MODULE) : await import('playwright');
const routes = {
  '/api/admin/action': action.POST, '/api/admin/login': login.POST, '/api/admin/check': check.GET,
  '/api/state': state.GET, '/api/register': register.POST,
};
let actionRequests = 0;
const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = `http://127.0.0.1:${server.address().port}${req.url}`;
    if (routes[req.url]) {
      if (req.url === '/api/admin/action') actionRequests++;
      const request = new Request(url, { method: req.method, headers: req.headers, ...(req.method !== 'GET' ? { body: Buffer.concat(chunks) } : {}) });
      const response = await routes[req.url](request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } else if (req.url === '/wheel.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(new URL('../public/wheel.html', import.meta.url)));
    } else { res.writeHead(404); res.end(); }
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_BROWSER ? { executablePath: process.env.PLAYWRIGHT_BROWSER } : {}) });
const pageErrors = [];
const outputs = new URL('../outputs/', import.meta.url);
mkdirSync(outputs, { recursive: true });
let context, page;

async function waitFor(predicate, message) {
  for (let i = 0; i < 80; i++) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error(message);
}
async function openAdmin({ authorized = true, active = false, empty = false, width = 1440 } = {}) {
  await context?.close();
  resetFixture(); actionRequests = 0;
  if (active) addActiveDraw();
  if (empty) fixture.sqlite.exec('DELETE FROM players');
  context = await browser.newContext({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
  page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  if (authorized) {
    const response = await context.request.post(`${origin}/api/admin/login`, {
      headers: { origin }, data: { pin: 'local-test-pin' },
    });
    assert.equal(response.status(), 200);
  }
  await page.goto(`${origin}/wheel.html`);
  if (authorized) {
    await page.waitForSelector('#hostPanel:not([hidden])');
    await page.waitForFunction(() => document.querySelector('#hostStatus').textContent.includes('учасників'));
    await page.locator('#enterSilentBtn').click();
    await page.waitForSelector('#welcome[hidden]', { state: 'attached' });
  }
}
function pass(name) { console.log(`PASS ${name}`); }

try {
  await openAdmin({ authorized: false });
  assert.equal(await page.locator('#hostRemoveAll').isVisible(), false);
  assert.equal(await page.locator('#hostGate').isVisible(), true);
  pass('button is hidden before administrator login');

  await openAdmin();
  await page.locator('#hostPanel').screenshot({ path: fileURLToPath(new URL('admin-desktop.png', outputs)) });
  let confirmation = '';
  page.once('dialog', async dialog => { confirmation = dialog.message(); await dialog.dismiss(); });
  await page.locator('#hostRemoveAll').click();
  assert.match(confirmation, /всіх учасників.*\(3\)/);
  assert.match(confirmation, /неможливо скасувати/);
  assert.equal(actionRequests, 0); assert.equal(countPlayers(), 3);
  pass('canceling confirmation makes no request and preserves the roster');

  let releaseAction;
  const actionGate = new Promise(resolve => { releaseAction = resolve; });
  let intercepted = 0;
  await page.route('**/api/admin/action', async route => { intercepted++; await actionGate; await route.continue(); });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#hostRemoveAll').click();
  await waitFor(async () => intercepted === 1, 'bulk request was not sent');
  assert.equal(await page.locator('#hostRemoveAll').isDisabled(), true);
  assert.equal(await page.locator('#spinBtn').isDisabled(), true);
  assert.equal(await page.locator('#hostOpen').isDisabled(), true);
  assert.equal(await page.locator('#hostClose').isDisabled(), true);
  await page.evaluate(() => document.querySelector('#hostRemoveAll').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  assert.equal(intercepted, 1);
  releaseAction();
  await page.waitForFunction(() => document.querySelector('#hostPlayers').children.length === 0 && document.querySelector('#hostStatus').textContent.includes('0 учасників'));
  assert.equal(actionRequests, 1); assert.equal(countPlayers(), 0);
  assert.equal(await page.locator('#hostRemoveAll').isDisabled(), true);
  assert.match(await page.locator('#toast').textContent(), /Видалено учасників: 3/);
  assert.match(await page.locator('#historyList').textContent(), /ArchivedWinner/);
  await page.locator('#hostPanel').screenshot({ path: fileURLToPath(new URL('admin-empty.png', outputs)) });
  pass('double click sends one request; successful removal refreshes the list and preserves history');

  await openAdmin({ empty: true });
  assert.equal(await page.locator('#hostRemoveAll').isDisabled(), true);
  pass('empty roster disables bulk removal');
  await openAdmin({ active: true });
  assert.equal(await page.locator('#hostRemoveAll').isDisabled(), true);
  pass('active draw disables bulk removal');

  await openAdmin();
  await page.route('**/api/admin/action', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Тестова помилка сервера' }) }));
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#hostRemoveAll').click();
  await waitFor(async () => (await page.locator('#toast').textContent()).includes('Тестова помилка сервера'), 'server error is not shown');
  await waitFor(async () => !(await page.locator('#hostRemoveAll').isDisabled()), 'button did not recover after error');
  assert.equal(countPlayers(), 3);
  assert.equal(await page.locator('#hostPlayers .host-row').count(), 3);
  pass('server error is shown, participants remain, and controls recover');

  await openAdmin();
  await page.route('**/api/admin/action', route => route.abort('failed'));
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#hostRemoveAll').click();
  await waitFor(async () => !(await page.locator('#hostRemoveAll').isDisabled()), 'network error left the button locked');
  assert.equal(countPlayers(), 3);
  pass('network error preserves participants and restores controls');

  await openAdmin();
  const oldState = await (await context.request.get(`${origin}/api/state`)).json();
  let releaseOldState, oldRequestHeld = false;
  const oldStateGate = new Promise(resolve => { releaseOldState = resolve; });
  await page.route('**/api/state', async route => {
    if (!oldRequestHeld) {
      oldRequestHeld = true;
      await oldStateGate;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(oldState) });
    } else await route.continue();
  });
  await waitFor(async () => oldRequestHeld, 'periodic state request was not captured');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#hostRemoveAll').click();
  await page.waitForFunction(() => document.querySelector('#hostPlayers').children.length === 0);
  releaseOldState();
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(await page.locator('#hostPlayers .host-row').count(), 0);
  assert.equal(countPlayers(), 0);
  pass('an older polling response cannot restore participants after successful removal');

  await openAdmin();
  await context.clearCookies();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#hostRemoveAll').click();
  await waitFor(async () => (await page.locator('#toast').textContent()).includes('Увійди як ведучий'), 'unauthorized error is not shown');
  assert.equal(countPlayers(), 3);
  pass('a session lost after rendering cannot delete participants');

  await openAdmin({ width: 390 });
  await page.locator('#hostPanel').screenshot({ path: fileURLToPath(new URL('admin-mobile.png', outputs)) });
  const box = await page.locator('#hostRemoveAll').boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390);
  assert.deepEqual(pageErrors, []);
  pass('mobile button fits within the viewport; no JavaScript page errors');
} finally {
  await context?.close(); await browser.close();
  await new Promise(resolve => server.close(resolve)); fixture.sqlite?.close();
}
