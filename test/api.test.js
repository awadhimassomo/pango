const test = require('node:test');
const assert = require('node:assert');
delete process.env.ANTHROPIC_API_KEY;
process.env.ADMIN_EMAIL = 'boss@example.com';
const app = require('../src/app');

let server, base;
test.before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}`; r(); }); }));
test.after(() => server.close());

const j = (p, { token, body, method = body ? 'POST' : 'GET' } = {}) =>
  fetch(base + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, body: r.status === 204 ? null : await r.json() }));

const uniq = () => Math.random().toString(36).slice(2);
const register = (role, email = `${uniq()}@example.com`) =>
  j('/api/auth/register', { body: { name: 'T', email, password: 'password123', role } }).then((r) => r.body);

test('lists and filters houses', async () => {
  const f = await j('/api/houses?city=nairobi&has3d=true');
  assert.ok(f.body.results.length && f.body.results.every((h) => h.city === 'Nairobi' && h.models3d.length));
});

test('auth: register, login, me, bad password', async () => {
  const email = `${uniq()}@example.com`;
  const reg = await register('user', email);
  assert.ok(reg.token);
  assert.strictEqual(reg.user.passwordHash, undefined);
  assert.strictEqual((await j('/api/auth/login', { body: { email, password: 'password123' } })).status, 200);
  assert.strictEqual((await j('/api/auth/login', { body: { email, password: 'wrongpass1' } })).status, 401);
  assert.strictEqual((await j('/api/auth/me', { token: reg.token })).body.user.email, email);
  assert.strictEqual((await j('/api/auth/register', { body: { name: 'T', email, password: 'password123' } })).status, 409);
});

test('only agents/admins can write; agents own their listings', async () => {
  const user = await register('user');
  const agentA = await register('agent');
  const agentB = await register('agent');
  const admin = await register('user', 'boss@example.com');
  assert.strictEqual(admin.user.role, 'admin');

  const house = { title: 'T', price: 10, city: 'X' };
  assert.strictEqual((await j('/api/houses', { body: house })).status, 401);
  assert.strictEqual((await j('/api/houses', { body: house, token: user.token })).status, 403);

  const c = await j('/api/houses', { body: house, token: agentA.token });
  assert.strictEqual(c.status, 201);
  const id = c.body.id;
  const media = await j(`/api/houses/${id}/media/videos`, { token: agentA.token, body: { url: 'https://example.com/a.mp4' } });
  assert.strictEqual(media.body.videos.length, 1);
  assert.strictEqual((await j(`/api/houses/${id}`, { method: 'DELETE', token: agentB.token })).status, 403);
  assert.strictEqual((await j('/api/houses', { body: {}, token: agentA.token })).status, 400);
  assert.strictEqual((await j(`/api/houses/${id}`, { method: 'DELETE', token: admin.token })).status, 204);
});

test('chat fallback finds houses', async () => {
  const r = await j('/api/chat', { body: { messages: [{ role: 'user', content: 'villa in Nairobi with pool' }] } });
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.houses.length >= 1);
});
