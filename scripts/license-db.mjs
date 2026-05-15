import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Pool } = pg;
let pool = null;

export function isLicenseDbAvailable() {
  return pool !== null;
}

export async function initLicenseDb() {
  if (!process.env.DATABASE_URL || pool) return;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS licenses (
      id              SERIAL PRIMARY KEY,
      code            TEXT UNIQUE NOT NULL,
      organization_name TEXT NOT NULL,
      contact_name    TEXT NOT NULL DEFAULT '',
      contact_email   TEXT NOT NULL DEFAULT '',
      contact_phone   TEXT NOT NULL DEFAULT '',
      rufnamen        JSONB NOT NULL DEFAULT '{}',
      notes           TEXT NOT NULL DEFAULT '',
      active          BOOLEAN NOT NULL DEFAULT TRUE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log('License-DB bereit.');
}

function generateCode() {
  const hex = randomBytes(4).toString('hex').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

export async function createLicense(data) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    try {
      const result = await pool.query(
        `INSERT INTO licenses
           (code, organization_name, contact_name, contact_email, contact_phone, rufnamen, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [code, data.organizationName, data.contactName || '',
         data.contactEmail || '', data.contactPhone || '',
         JSON.stringify(data.rufnamen ?? {}), data.notes || '']
      );
      return result.rows[0];
    } catch (e) {
      if (e.code === '23505') continue;
      throw e;
    }
  }
  throw new Error('Code-Generierung fehlgeschlagen.');
}

export async function getLicenseByCode(code) {
  if (!pool) return null;
  const result = await pool.query(
    `SELECT * FROM licenses WHERE code = $1 AND active = TRUE`,
    [code.trim().toUpperCase()]
  );
  return result.rows[0] ?? null;
}

export async function listLicenses() {
  if (!pool) return [];
  const result = await pool.query(`SELECT * FROM licenses ORDER BY created_at DESC`);
  return result.rows;
}

export async function getLicenseById(id) {
  const result = await pool.query(`SELECT * FROM licenses WHERE id = $1`, [Number(id)]);
  return result.rows[0] ?? null;
}

export async function updateLicense(id, data) {
  const result = await pool.query(
    `UPDATE licenses SET
       organization_name = $2, contact_name = $3, contact_email = $4,
       contact_phone = $5, rufnamen = $6, notes = $7, active = $8
     WHERE id = $1 RETURNING *`,
    [Number(id), data.organizationName, data.contactName || '',
     data.contactEmail || '', data.contactPhone || '',
     JSON.stringify(data.rufnamen ?? {}), data.notes || '',
     data.active !== false]
  );
  return result.rows[0] ?? null;
}

export async function deleteLicense(id) {
  await pool.query(`DELETE FROM licenses WHERE id = $1`, [Number(id)]);
}
