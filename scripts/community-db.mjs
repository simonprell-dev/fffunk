import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Pool } = pg;

let pool = null;

export function isDbAvailable() {
  return pool !== null;
}

export async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL nicht gesetzt – Community-DB nicht verfügbar.');
    return;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_scenarios (
      share_id   TEXT PRIMARY KEY,
      id         TEXT NOT NULL,
      title      TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT 'Anonym',
      category   TEXT NOT NULL DEFAULT 'sonstige',
      scenario_json TEXT NOT NULL,
      thank_count INTEGER NOT NULL DEFAULT 0,
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log('Community-DB bereit.');
}

export function generateShareId() {
  return randomBytes(6).toString('base64url'); // 8 URL-safe chars
}

export async function publishScenario({ shareId, id, title, description, authorName, category, scenarioJson }) {
  await pool.query(
    `INSERT INTO community_scenarios (share_id, id, title, description, author_name, category, scenario_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (share_id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       author_name = EXCLUDED.author_name,
       category = EXCLUDED.category,
       scenario_json = EXCLUDED.scenario_json`,
    [shareId, id, title, description, authorName, category, scenarioJson]
  );
}

export async function listScenarios() {
  const result = await pool.query(
    `SELECT share_id, id, title, description, author_name, category, thank_count, published_at, scenario_json
     FROM community_scenarios
     ORDER BY published_at DESC
     LIMIT 100`
  );
  return result.rows;
}

export async function getScenario(shareId) {
  const result = await pool.query(
    `SELECT share_id, id, title, description, author_name, category, thank_count, published_at, scenario_json
     FROM community_scenarios WHERE share_id = $1`,
    [shareId]
  );
  return result.rows[0] ?? null;
}

export async function addThank(shareId) {
  const result = await pool.query(
    `UPDATE community_scenarios SET thank_count = thank_count + 1
     WHERE share_id = $1 RETURNING thank_count`,
    [shareId]
  );
  return result.rows[0]?.thank_count ?? 0;
}
