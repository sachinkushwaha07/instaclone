import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db';

/**
 * Deliberately simple: this project has one growing schema.sql, and every
 * statement uses IF NOT EXISTS, so re-running is always safe. A team
 * outgrows this the moment two people need to change the schema in the
 * same week — at that point, move to numbered migration files (or an
 * ORM's migration tool) so changes apply in a fixed order and can each be
 * rolled back individually.
 */
async function migrate(): Promise<void> {
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'db/schema.sql'), 'utf-8');
  console.log('Applying db/schema.sql ...');
  await pool.query(sql);
  console.log('Schema is up to date.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
