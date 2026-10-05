import pg from 'pg';
import { env } from './env';

const { Pool } = pg;

/**
 * One pool, shared by the whole process. `pg` manages a small set of real
 * connections and hands them out per query, which is why we never create a
 * new Pool per request — that would exhaust Postgres's connection limit
 * under load.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  // A background/idle client emitted an error (e.g. the DB restarted).
  // Log and let the pool recover — this must never crash the process.
  console.error('Unexpected Postgres pool error', err);
});
