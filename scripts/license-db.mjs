import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Pool } = pg;
let pool = null;

const DEFAULT_TAXONOMY = {
  category: [
    ['brand', 'Brand'],
    ['thl', 'THL'],
    ['verkehr', 'Verkehr'],
    ['wasser', 'Wasseraufbau'],
    ['funk', 'Funkgrundlagen'],
    ['sonstige', 'Sonstige'],
  ],
  role: [
    ['gruppenführer_a', 'Gruppenführer A'],
    ['gruppenführer_b', 'Gruppenführer B'],
    ['gruppenführer_c', 'Gruppenführer C'],
    ['gruppenführer_d', 'Gruppenführer D'],
    ['gruppenführer_e', 'Gruppenführer E'],
    ['gruppenführer_f', 'Gruppenführer F'],
    ['truppführer', 'Truppführer'],
    ['atemschutzüberwachung', 'Atemschutzüberwachung'],
    ['einsatzleit', 'Einsatzleitung'],
  ],
};

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

// ── Admin scenarios ────────────────────────────────────────────────────────────

export async function initAdminScenariosDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_scenarios (
      id            SERIAL PRIMARY KEY,
      scenario_id   TEXT NOT NULL UNIQUE,
      title         TEXT NOT NULL,
      description   TEXT NOT NULL DEFAULT '',
      category      TEXT NOT NULL DEFAULT 'sonstige',
      player_role   TEXT NOT NULL DEFAULT 'gruppenführer_a',
      scenario_json TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS license_scenarios (
      license_id    INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
      scenario_id   INTEGER REFERENCES admin_scenarios(id) ON DELETE CASCADE,
      PRIMARY KEY (license_id, scenario_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_taxonomy (
      id         SERIAL PRIMARY KEY,
      kind       TEXT NOT NULL CHECK (kind IN ('category', 'role')),
      value      TEXT NOT NULL,
      label      TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (kind, value)
    )
  `);

  for (const [kind, items] of Object.entries(DEFAULT_TAXONOMY)) {
    for (const [index, [value, label]] of items.entries()) {
      await pool.query(
        `INSERT INTO admin_taxonomy (kind, value, label, sort_order)
         VALUES ($1,$2,$3,$4) ON CONFLICT (kind, value) DO NOTHING`,
        [kind, value, label, index * 10]
      );
    }
  }
}

export async function listAdminScenarios() {
  if (!pool) return [];
  const result = await pool.query(`
    SELECT s.*,
      COALESCE(json_agg(json_build_object('id', l.id, 'code', l.code, 'organization_name', l.organization_name))
        FILTER (WHERE l.id IS NOT NULL), '[]') AS licenses
    FROM admin_scenarios s
    LEFT JOIN license_scenarios ls ON ls.scenario_id = s.id
    LEFT JOIN licenses l ON l.id = ls.license_id
    GROUP BY s.id ORDER BY s.created_at DESC
  `);
  return result.rows;
}

export async function getAdminScenario(id) {
  if (!pool) return null;
  const s = await pool.query(`SELECT * FROM admin_scenarios WHERE id = $1`, [Number(id)]);
  if (!s.rows[0]) return null;
  const ls = await pool.query(
    `SELECT license_id FROM license_scenarios WHERE scenario_id = $1`, [Number(id)]
  );
  return { ...s.rows[0], assignedLicenseIds: ls.rows.map(r => r.license_id) };
}

export async function createAdminScenario({ scenarioId, title, description, category, playerRole, scenarioJson }) {
  const result = await pool.query(
    `INSERT INTO admin_scenarios (scenario_id, title, description, category, player_role, scenario_json)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [scenarioId, title, description || '', category || 'sonstige', playerRole || 'gruppenführer_a', scenarioJson]
  );
  return result.rows[0];
}

export async function upsertAdminScenario({ scenarioId, title, description, category, playerRole, scenarioJson }) {
  const result = await pool.query(
    `INSERT INTO admin_scenarios (scenario_id, title, description, category, player_role, scenario_json)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (scenario_id) DO UPDATE SET
       title = EXCLUDED.title,
       description = EXCLUDED.description,
       category = EXCLUDED.category,
       player_role = EXCLUDED.player_role,
       scenario_json = EXCLUDED.scenario_json,
       updated_at = NOW()
     RETURNING *`,
    [scenarioId, title, description || '', category || 'sonstige', playerRole || 'gruppenführer_a', scenarioJson]
  );
  return result.rows[0];
}

export async function updateAdminScenario(id, { scenarioId, title, description, category, playerRole, scenarioJson }) {
  const result = await pool.query(
    `UPDATE admin_scenarios SET
       scenario_id=$2, title=$3, description=$4, category=$5, player_role=$6,
       scenario_json=$7, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [Number(id), scenarioId, title, description || '', category || 'sonstige', playerRole || 'gruppenführer_a', scenarioJson]
  );
  return result.rows[0];
}

export async function deleteAdminScenario(id) {
  await pool.query(`DELETE FROM admin_scenarios WHERE id = $1`, [Number(id)]);
}

export async function setScenarioLicenses(scenarioDbId, licenseIds) {
  await pool.query(`DELETE FROM license_scenarios WHERE scenario_id = $1`, [Number(scenarioDbId)]);
  for (const lid of licenseIds) {
    await pool.query(
      `INSERT INTO license_scenarios (license_id, scenario_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [Number(lid), Number(scenarioDbId)]
    );
  }
}

export async function getScenariosByLicenseCode(code) {
  if (!pool) return [];
  const result = await pool.query(`
    SELECT s.scenario_json FROM admin_scenarios s
    JOIN license_scenarios ls ON ls.scenario_id = s.id
    JOIN licenses l ON l.id = ls.license_id
    WHERE l.code = $1 AND l.active = TRUE
    ORDER BY s.created_at ASC
  `, [code.trim().toUpperCase()]);
  return result.rows.map(r => JSON.parse(r.scenario_json));
}

// ── Admin taxonomy ────────────────────────────────────────────────────────────

function fallbackTaxonomy(kind) {
  return (DEFAULT_TAXONOMY[kind] || []).map(([value, label], index) => ({
    id: null,
    kind,
    value,
    label,
    sort_order: index * 10,
  }));
}

export async function listTaxonomy(kind) {
  if (!pool) return fallbackTaxonomy(kind);
  const result = await pool.query(
    `SELECT * FROM admin_taxonomy WHERE kind = $1 ORDER BY sort_order ASC, label ASC`,
    [kind]
  );
  return result.rows.length ? result.rows : fallbackTaxonomy(kind);
}

export async function getTaxonomyItem(id) {
  if (!pool) return null;
  const result = await pool.query(`SELECT * FROM admin_taxonomy WHERE id = $1`, [Number(id)]);
  return result.rows[0] ?? null;
}

export async function createTaxonomyItem({ kind, value, label, sortOrder }) {
  const result = await pool.query(
    `INSERT INTO admin_taxonomy (kind, value, label, sort_order)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [kind, value, label, Number(sortOrder) || 0]
  );
  return result.rows[0];
}

function migrateScenarioJson(rawJson, kind, oldValue, newValue, newLabel = null) {
  let scenario;
  try { scenario = JSON.parse(rawJson); } catch { return rawJson; }

  if (kind === 'role') {
    if (scenario.playerRole === oldValue) scenario.playerRole = newValue;
    for (const node of Object.values(scenario.nodes || {})) {
      if (node?.role === oldValue) node.role = newValue;
    }
  }

  if (kind === 'category') {
    scenario.community = {
      authorName: scenario.community?.authorName || 'Admin',
      source: scenario.community?.source || 'license',
      status: scenario.community?.status || 'local',
      createdAt: scenario.community?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...scenario.community,
      category: newValue,
    };
  }

  return JSON.stringify(scenario, null, 2);
}

export async function updateTaxonomyItem(id, { value, label, sortOrder }) {
  const existing = await getTaxonomyItem(id);
  if (!existing) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE admin_taxonomy SET value = $2, label = $3, sort_order = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [Number(id), value, label, Number(sortOrder) || 0]
    );

    if (existing.value !== value) {
      await migrateScenarioValue(client, existing.kind, existing.value, value, label);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTaxonomyItem(id, replacementValue) {
  const existing = await getTaxonomyItem(id);
  if (!existing) return;
  if (!replacementValue || replacementValue === existing.value) {
    throw new Error('Bitte einen anderen Zielwert für die Migration wählen.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await migrateScenarioValue(client, existing.kind, existing.value, replacementValue);
    await client.query(`DELETE FROM admin_taxonomy WHERE id = $1`, [Number(id)]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function migrateScenarioValue(client, kind, oldValue, newValue, newLabel = null) {
  const column = kind === 'role' ? 'player_role' : 'category';
  const result = await client.query(
    `SELECT id, scenario_json FROM admin_scenarios WHERE ${column} = $1`,
    [oldValue]
  );

  for (const row of result.rows) {
    await client.query(
      `UPDATE admin_scenarios SET ${column} = $2, scenario_json = $3, updated_at = NOW()
       WHERE id = $1`,
      [row.id, newValue, migrateScenarioJson(row.scenario_json, kind, oldValue, newValue, newLabel)]
    );
  }
}

// ── Anonyme Nutzungsstatistik ────────────────────────────────────────────────
// Nur aggregierte Tageszähler pro Ereignis – keine IP, keine Geräte-ID, kein
// Cookie. Damit entsteht kein Personenbezug (DSGVO) und es wird nichts auf dem
// Endgerät gespeichert (TTDSG § 25), eine Einwilligung ist nicht nötig.
// Szenario-Ereignisse zählen zusätzlich je Szenario und Lizenzcode – der Code
// steht für eine Organisation (Wehr, Ortsverband, Wache), nicht für eine Person.

export const USAGE_EVENTS = {
  app_open: 'App geöffnet',
  scenario_start: 'Szenario gestartet',
  training_start: 'Training gestartet',
  scenario_complete: 'Szenario abgeschlossen',
  chapter_complete: 'Kapitel abgeschlossen',
  radio_ok: 'Funkspruch richtig',
  radio_fail: 'Funkspruch falsch',
  lern_open: 'Lernbereich geöffnet',
};

export async function initUsageStatsDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usage_daily (
      day    DATE    NOT NULL,
      event  TEXT    NOT NULL,
      count  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, event)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usage_plays (
      day          DATE    NOT NULL,
      event        TEXT    NOT NULL,
      scenario_id  TEXT    NOT NULL,
      license_code TEXT    NOT NULL DEFAULT '',
      count        INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, event, scenario_id, license_code)
    )
  `);
}

export const PLAY_EVENTS = ['scenario_start', 'training_start', 'scenario_complete'];
// Eigene, lokale und Community-Szenarien werden ohne ihre (frei wählbare) ID gezählt.
export const OTHER_SCENARIO = '(eigenes)';

/**
 * Zählt ein Ereignis. Szenario-Ereignisse zusätzlich je Szenario und Lizenz: nur bekannte
 * Szenario-IDs (eingebaut oder Admin-Szenario) und nur aktive Lizenzcodes werden übernommen.
 */
export async function countUsageEvent(event, { scenarioId = '', licenseCode = '', builtinIds = [] } = {}) {
  if (!pool || !Object.hasOwn(USAGE_EVENTS, event)) return false;
  await pool.query(
    `INSERT INTO usage_daily (day, event, count) VALUES (CURRENT_DATE, $1, 1)
     ON CONFLICT (day, event) DO UPDATE SET count = usage_daily.count + 1`,
    [event]
  );
  if (PLAY_EVENTS.includes(event) && scenarioId) {
    await pool.query(
      `INSERT INTO usage_plays (day, event, scenario_id, license_code, count)
       SELECT CURRENT_DATE, $1,
              CASE WHEN $2 = ANY($3::text[]) OR EXISTS (SELECT 1 FROM admin_scenarios WHERE scenario_id = $2)
                   THEN $2 ELSE $5 END,
              COALESCE((SELECT code FROM licenses WHERE code = $4 AND active = TRUE), ''),
              1
       ON CONFLICT (day, event, scenario_id, license_code) DO UPDATE SET count = usage_plays.count + 1`,
      [event, String(scenarioId).slice(0, 200), builtinIds, String(licenseCode).trim().toUpperCase().slice(0, 40), OTHER_SCENARIO]
    );
  }
  return true;
}

/**
 * Gespielte Szenarien im Zeitraum (from/to inklusive, null = offen), optional nur eine Lizenz
 * ('' = ohne Lizenz). bucket 'day' | 'month' für den Verlauf.
 */
export async function getPlayStats({ from = null, to = null, licenseCode = null, bucket = 'day' } = {}) {
  if (!pool) return { byLicense: [], byScenario: [], trend: [], events: [] };
  const where = `($1::date IS NULL OR day >= $1) AND ($2::date IS NULL OR day <= $2)`;
  const sums = `SUM(count) FILTER (WHERE event IN ('scenario_start','training_start'))::int AS started,
                SUM(count) FILTER (WHERE event = 'training_start')::int AS training,
                SUM(count) FILTER (WHERE event = 'scenario_complete')::int AS completed`;
  const params = [from, to, licenseCode];
  const plays = `${where} AND ($3::text IS NULL OR license_code = $3)`;
  const [byLicense, byScenario, trend, events] = await Promise.all([
    pool.query(
      `SELECT p.license_code, l.organization_name, ${sums}
         FROM usage_plays p LEFT JOIN licenses l ON l.code = p.license_code
        WHERE ${plays} GROUP BY p.license_code, l.organization_name ORDER BY started DESC NULLS LAST, p.license_code`, params),
    pool.query(
      `SELECT p.scenario_id, a.title, ${sums}
         FROM usage_plays p LEFT JOIN admin_scenarios a ON a.scenario_id = p.scenario_id
        WHERE ${plays} GROUP BY p.scenario_id, a.title ORDER BY started DESC NULLS LAST, p.scenario_id`, params),
    pool.query(
      `SELECT to_char(day, $4) AS bucket, ${sums}
         FROM usage_plays WHERE ${plays} GROUP BY 1 ORDER BY 1`, [...params, bucket === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD']),
    pool.query(
      `SELECT event, SUM(count)::int AS total FROM usage_daily WHERE ${where} GROUP BY event`, [from, to]),
  ]);
  return { byLicense: byLicense.rows, byScenario: byScenario.rows, trend: trend.rows, events: events.rows };
}

/** Jahre mit Daten (für die Filterauswahl), neueste zuerst. */
export async function listUsageYears() {
  if (!pool) return [];
  const r = await pool.query(`SELECT DISTINCT EXTRACT(YEAR FROM day)::int AS y FROM usage_daily ORDER BY y DESC`);
  return r.rows.map(x => x.y);
}
