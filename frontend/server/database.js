import { neon } from '@neondatabase/serverless';

const schema = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS auth_attempts (
    key TEXT PRIMARY KEY, window_start BIGINT NOT NULL, attempts INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    resume_text TEXT NOT NULL, job_text TEXT NOT NULL, result_json TEXT NOT NULL,
    ats_score INTEGER NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    resume_text TEXT NOT NULL, job_text TEXT NOT NULL, difficulty VARCHAR(30) NOT NULL,
    history_json TEXT NOT NULL DEFAULT '[]', total_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    turns INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), event_type VARCHAR(80) NOT NULL,
    latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0, detail_json TEXT NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
];

let database;

export function getDatabase() {
  if (database) return database;
  const connection = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connection) throw new Error('DATABASE_URL is not configured');
  const sql = neon(connection);
  let initialized;
  async function ready() {
    if (!initialized) {
      initialized = sql.transaction(schema.map(statement => sql.query(statement))).catch(error => {
        initialized = undefined;
        throw error;
      });
    }
    await initialized;
  }
  database = {
    async health() {
      await sql`SELECT 1`;
    },
    async consumeAttempt(key, windowStart) {
      await ready();
      const rows = await sql`
        INSERT INTO auth_attempts (key, window_start, attempts) VALUES (${key}, ${windowStart}, 1)
        ON CONFLICT (key) DO UPDATE SET
          attempts = CASE WHEN auth_attempts.window_start < EXCLUDED.window_start THEN 1 ELSE auth_attempts.attempts + 1 END,
          window_start = EXCLUDED.window_start
        RETURNING attempts
      `;
      return Number(rows[0].attempts);
    },
    async findUserByEmail(email) {
      await ready();
      const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email} LIMIT 1`;
      return rows[0] || null;
    },
    async findUserById(id) {
      await ready();
      const rows = await sql`SELECT id, email FROM users WHERE id = ${id} LIMIT 1`;
      return rows[0] || null;
    },
    async createUser(email, passwordHash) {
      await ready();
      const rows = await sql`
        INSERT INTO users (email, password_hash) VALUES (${email}, ${passwordHash})
        ON CONFLICT (email) DO NOTHING RETURNING id, email
      `;
      return rows[0] || null;
    },
    async dashboard(userId) {
      await ready();
      const [analyses, interviews, events] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count, COALESCE(AVG(ats_score), 0)::float AS average FROM analyses WHERE user_id = ${userId}`,
        sql`SELECT COUNT(*)::int AS count, COALESCE(AVG(total_score), 0)::float AS average FROM interview_sessions WHERE user_id = ${userId}`,
        sql`SELECT event_type AS type, latency_ms, created_at FROM events WHERE user_id = ${userId} ORDER BY id DESC LIMIT 50`,
      ]);
      return {
        analyses: analyses[0].count, avg_ats: Math.round(analyses[0].average * 10) / 10,
        interviews: interviews[0].count, avg_interview: Math.round(interviews[0].average * 10) / 10,
        recent_events: events,
      };
    },
  };
  return database;
}
