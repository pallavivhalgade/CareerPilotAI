import { createHmac } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDatabase } from './database.js';

const WINDOW_MS = 15 * 60 * 1000;
const AI_ROUTES = new Set(['/analysis', '/resume/extract', '/interview/start', '/interview/answer', '/chat', '/knowledge/add', '/requirements']);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function readBody(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Send the account details as JSON.');
  }
  let body = req.body;
  if (body === undefined) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 8192) throw new HttpError(413, 'The account details are too large.');
      chunks.push(Buffer.from(chunk));
    }
    body = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > 8192) throw new HttpError(413, 'The account details are too large.');
    try { body = JSON.parse(body); } catch { throw new HttpError(400, 'The account details could not be read.'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Enter an email address and password.');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = body.password;
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) throw new HttpError(422, 'Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 6) throw new HttpError(422, 'Use a password with at least 6 characters.');
  if (Buffer.byteLength(password, 'utf8') > 72) throw new HttpError(422, 'Use a shorter password (up to 72 UTF-8 bytes).');
  return { email, password };
}

function routePath(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  // Vercel rewrites /api/* to this function. Local tests use the original path.
  const rewritten = req.query?.path ?? url.searchParams.get('path');
  return rewritten != null ? '/' + String(rewritten).replace(/^\/+|\/+$/g, '') : url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

export function createAuthHandler({ getStore = getDatabase, getSecret = () => process.env.SECRET_KEY, now = () => Date.now(), attemptLimit = 20 } = {}) {
  return async function handleRequest(req, res) {
    const path = routePath(req);
    const accountRoute = path === '/auth/register' || path === '/auth/login';
    if (!accountRoute && path !== '/health' && path !== '/dashboard' && !AI_ROUTES.has(path)) return json(res, 404, { detail: 'API endpoint not found.' });
    const expectedMethod = accountRoute || (AI_ROUTES.has(path) && path !== '/requirements') ? 'POST' : 'GET';
    if (req.method !== expectedMethod) {
      res.setHeader('Allow', expectedMethod);
      return json(res, 405, { detail: 'This request method is not supported.' });
    }
    try {
      const secret = getSecret();
      if (typeof secret !== 'string' || secret.length < 32) throw new Error('A secure SECRET_KEY is required');
      const key = new TextEncoder().encode(secret);
      const store = getStore();
      if (path === '/health') {
        await store.health();
        return json(res, 200, { status: 'ok', service: 'careerpilot-accounts', capabilities: { auth: true, ai: false } });
      }
      if (accountRoute) {
        const address = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
        const attemptKey = createHmac('sha256', key).update(String(address)).digest('hex');
        const windowStart = Math.floor(now() / WINDOW_MS) * WINDOW_MS;
        if (await store.consumeAttempt(attemptKey, windowStart) > attemptLimit) {
          res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowStart + WINDOW_MS - now()) / 1000))));
          throw new HttpError(429, 'Too many sign-in attempts. Please wait a few minutes and try again.');
        }
        const { email, password } = await readBody(req);
        let user;
        if (path === '/auth/register') {
          // The unique constraint also handles two simultaneous signup requests.
          user = await store.createUser(email, await hash(password, 12));
          if (!user) throw new HttpError(409, 'An account with this email already exists. Please sign in.');
        } else {
          user = await store.findUserByEmail(email);
          const valid = user ? await compare(password, user.password_hash) : (await hash(password, 12), false);
          if (!valid) throw new HttpError(401, 'Invalid email or password.');
        }
        const issuedAt = Math.floor(now() / 1000);
        const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
          .setSubject(String(user.id)).setIssuedAt(issuedAt).setExpirationTime(issuedAt + 86400).sign(key);
        return json(res, path === '/auth/register' ? 201 : 200, { token });
      }
      const authorization = req.headers.authorization;
      if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) throw new HttpError(401, 'Please sign in to continue.');
      let subject;
      try {
        const { payload } = await jwtVerify(authorization.slice(7), key, { algorithms: ['HS256'], currentDate: new Date(now()) });
        if (!/^\d+$/.test(payload.sub || '')) throw new Error('Invalid subject');
        subject = Number(payload.sub);
      } catch { throw new HttpError(401, 'Your session has expired. Please sign in again.'); }
      const user = await store.findUserById(subject);
      if (!user) throw new HttpError(401, 'Your account could not be found. Please sign in again.');
      if (path === '/dashboard') return json(res, 200, await store.dashboard(user.id));
      return json(res, 503, { detail: 'This tool needs the AI service to be connected. You can still explore the preview from the home page.' });
    } catch (error) {
      if (error instanceof HttpError) return json(res, error.status, { detail: error.message });
      // Never return database connection strings or credentials to the browser.
      console.error('Account request failed:', error.code || error.name || 'Error');
      return json(res, 503, { detail: 'The account service is temporarily unavailable. Please try again later.' });
    }
  };
}
