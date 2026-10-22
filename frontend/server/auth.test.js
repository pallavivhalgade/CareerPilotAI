import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { compare } from 'bcryptjs';
import { createAuthHandler } from './auth.js';

const secret = 'test-only-secret-'.repeat(4);
const credentials = { email: 'Candidate@Example.com', password: 'correct-password' };

function memoryStore() {
  const users = new Map();
  const attempts = new Map();
  return {
    users,
    async health() {},
    async consumeAttempt(key, windowStart) {
      const previous = attempts.get(key);
      const count = previous?.windowStart === windowStart ? previous.count + 1 : 1;
      attempts.set(key, { windowStart, count });
      return count;
    },
    async createUser(email, passwordHash) {
      if (users.has(email)) return null;
      const user = { id: users.size + 1, email, password_hash: passwordHash };
      users.set(email, user);
      return { id: user.id, email };
    },
    async findUserByEmail(email) { return users.get(email) || null; },
    async findUserById(id) { return [...users.values()].find(user => user.id === id) || null; },
    async dashboard(id) {
      return { analyses: id * 2, avg_ats: 75, interviews: id, avg_interview: 80, recent_events: [] };
    },
  };
}

async function withServer(options, run) {
  const server = createServer(createAuthHandler({ getSecret: () => secret, ...options }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  async function request(path, { body, headers = {}, method = body ? 'POST' : 'GET' } = {}) {
    const response = await fetch(base + path, {
      method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { status: response.status, headers: response.headers, data: await response.json() };
  }
  try { await run(request, base); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('signup stores a bcrypt hash and login works through a fresh handler', async () => {
  const store = memoryStore();
  await withServer({ getStore: () => store }, async request => {
    const signup = await request('/api/auth/register', { body: credentials });
    assert.equal(signup.status, 201);
    assert.ok(signup.data.token);
    const saved = store.users.get('candidate@example.com');
    assert.notEqual(saved.password_hash, credentials.password);
    assert.ok(await compare(credentials.password, saved.password_hash));
  });
  await withServer({ getStore: () => store }, async request => {
    const login = await request('/api/auth/login', { body: { ...credentials, email: 'candidate@example.com' } });
    assert.equal(login.status, 200);
    const dashboard = await request('/api/dashboard', { headers: { Authorization: 'Bearer ' + login.data.token } });
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.data.analyses, 2);
  });
});

test('duplicate signup is rejected even when email casing differs', async () => {
  const store = memoryStore();
  await withServer({ getStore: () => store }, async request => {
    await request('/api/auth/register', { body: credentials });
    const duplicate = await request('/api/auth/register', { body: { ...credentials, email: 'candidate@example.com' } });
    assert.equal(duplicate.status, 409);
    assert.match(duplicate.data.detail, /already exists/);
    assert.equal(store.users.size, 1);
  });
});

test('wrong passwords and unknown accounts return the same error', async () => {
  const store = memoryStore();
  await withServer({ getStore: () => store }, async request => {
    await request('/api/auth/register', { body: credentials });
    const wrong = await request('/api/auth/login', { body: { ...credentials, password: 'wrong-password' } });
    const unknown = await request('/api/auth/login', { body: { ...credentials, email: 'unknown@example.com' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.data, unknown.data);
  });
});

test('dashboard requires a valid unexpired token and reads only its owner', async () => {
  let time = Date.now();
  const store = memoryStore();
  await withServer({ getStore: () => store, now: () => time }, async request => {
    const one = await request('/api/auth/register', { body: credentials });
    const two = await request('/api/auth/register', { body: { ...credentials, email: 'second@example.com' } });
    assert.equal((await request('/api/dashboard')).status, 401);
    const parts = one.data.token.split('.');
    parts[1] = Buffer.from(JSON.stringify({ sub: '2', exp: Math.floor(time / 1000) + 86400 })).toString('base64url');
    assert.equal((await request('/api/dashboard', { headers: { Authorization: 'Bearer ' + parts.join('.') } })).status, 401);
    const dashboard = await request('/api/dashboard', { headers: { Authorization: 'Bearer ' + two.data.token } });
    assert.equal(dashboard.data.analyses, 4);
    time += 86401 * 1000;
    assert.equal((await request('/api/dashboard', { headers: { Authorization: 'Bearer ' + two.data.token } })).status, 401);
  });
});

test('invalid inputs, malformed JSON, methods, and routes get useful JSON errors', async () => {
  await withServer({ getStore: memoryStore }, async (request, base) => {
    assert.equal((await request('/api/auth/register')).status, 405);
    assert.equal((await request('/api/missing')).status, 404);
    assert.equal((await request('/api/auth/register', { body: { email: 'invalid', password: '123456' } })).status, 422);
    assert.equal((await request('/api/auth/register', { body: { ...credentials, password: 'short' } })).status, 422);
    assert.equal((await request('/api/auth/register', { body: { ...credentials, password: 'a'.repeat(73) } })).status, 422);
    assert.equal((await request('/api/auth/register', { body: { ...credentials, password: '😀'.repeat(20) } })).status, 422);
    const malformed = await fetch(base + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(malformed.status, 400);
    const wrongType = await fetch(base + '/api/auth/register', { method: 'POST', body: 'email=test' });
    assert.equal(wrongType.status, 415);
    const tooLarge = await fetch(base + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ extra: 'x'.repeat(9000) }) });
    assert.equal(tooLarge.status, 413);
  });
});

test('Vercel rewritten paths reach the account handler', async () => {
  const store = memoryStore();
  await withServer({ getStore: () => store }, async request => {
    assert.equal((await request('/api?path=health')).data.status, 'ok');
    assert.equal((await request('/api?path=auth/register', { body: credentials })).status, 201);
  });
});

test('auth throttling persists between calls and resets in the next window', async () => {
  let time = Date.now();
  const store = memoryStore();
  await withServer({ getStore: () => store, now: () => time, attemptLimit: 2 }, async request => {
    await request('/api/auth/login', { body: credentials });
    await request('/api/auth/login', { body: credentials });
    const limited = await request('/api/auth/login', { body: credentials });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get('retry-after')) > 0);
    time += 15 * 60 * 1000;
    assert.equal((await request('/api/auth/login', { body: credentials })).status, 401);
  });
});

test('missing configuration and database errors do not expose secrets', async () => {
  await withServer({ getSecret: () => '' }, async request => {
    const response = await request('/api/health');
    assert.equal(response.status, 503);
    assert.match(response.data.detail, /temporarily unavailable/);
  });
  await withServer({ getStore: () => { throw new Error('postgresql://private:password@database'); } }, async request => {
    const response = await request('/api/health');
    assert.equal(response.status, 503);
    assert.doesNotMatch(JSON.stringify(response.data), /private|password|postgresql/);
  });
});
