// Konten, Anmeldung per E-Mail-Code, Spielstand und gespeicherte Gruppenübungen.
// Mit DATABASE_URL in PostgreSQL, sonst im Arbeitsspeicher (lokale Entwicklung – nach Neustart leer).
import pg from 'pg';
import { createHash, randomBytes, randomInt } from 'node:crypto';

const { Pool } = pg;
let pool = null;

const mem = {
  konten: new Map(),   // id → Konto
  codes: new Map(),    // email → { hash, bis, versuche, gesendet }
  sitzungen: new Map(), // tokenHash → { kontoId, bis }
  spiele: new Map(),   // `${kontoId}|${szenario}|${tag}|${art}` → Spiel
  einstellungen: new Map(),
  uebungen: new Map(), // code → { leiterId, daten, erstellt, endet, beendet }
  naechsteId: 1,
};

export const CODE_GUELTIG_MS = 15 * 60 * 1000;
export const CODE_VERSUCHE = 5;
export const CODE_SPERRE_MS = 60 * 1000;
const SITZUNG_MS = 90 * 24 * 60 * 60 * 1000;

export function istKontoDbPersistent() {
  return pool !== null;
}

export async function initKontoDb() {
  if (!process.env.DATABASE_URL || pool) return;
  pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS konten (
      id           SERIAL PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL DEFAULT '',
      lizenz_code  TEXT NOT NULL DEFAULT '',
      erstellt     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS konto_codes (
      email     TEXT PRIMARY KEY,
      hash      TEXT NOT NULL,
      bis       TIMESTAMPTZ NOT NULL,
      versuche  INTEGER NOT NULL DEFAULT 0,
      gesendet  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS konto_sitzungen (
      token_hash TEXT PRIMARY KEY,
      konto_id   INTEGER NOT NULL REFERENCES konten(id) ON DELETE CASCADE,
      bis        TIMESTAMPTZ NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS konto_spiele (
      konto_id    INTEGER NOT NULL REFERENCES konten(id) ON DELETE CASCADE,
      szenario_id TEXT NOT NULL,
      tag         DATE NOT NULL DEFAULT CURRENT_DATE,
      art         TEXT NOT NULL DEFAULT 'einzel',
      punkte      INTEGER,
      PRIMARY KEY (konto_id, szenario_id, tag, art)
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_einstellungen (
      schluessel TEXT PRIMARY KEY,
      wert       TEXT NOT NULL
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gruppen_uebungen (
      code      TEXT PRIMARY KEY,
      leiter_id INTEGER REFERENCES konten(id) ON DELETE CASCADE,
      daten     JSONB NOT NULL,
      erstellt  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      endet     TIMESTAMPTZ NOT NULL,
      beendet   TIMESTAMPTZ
    )`);
  // Abgelaufenes aufräumen: Codes, Sitzungen und Übungen, die älter als ein Jahr sind.
  await pool.query(`DELETE FROM konto_codes WHERE bis < NOW()`);
  await pool.query(`DELETE FROM konto_sitzungen WHERE bis < NOW()`);
  await pool.query(`DELETE FROM gruppen_uebungen WHERE erstellt < NOW() - INTERVAL '365 days'`);
  console.log('Konto-DB bereit.');
}

const sha = s => createHash('sha256').update(String(s)).digest('hex');
export const normEmail = e => String(e ?? '').trim().toLowerCase().slice(0, 200);
export const istEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

// ── Einstellungen (Admin) ─────────────────────────────────────────────────────────────────

export async function getEinstellung(schluessel, standard = '') {
  if (!pool) return mem.einstellungen.get(schluessel) ?? standard;
  const r = await pool.query(`SELECT wert FROM app_einstellungen WHERE schluessel = $1`, [schluessel]);
  return r.rows[0]?.wert ?? standard;
}

export async function setEinstellung(schluessel, wert) {
  if (!pool) { mem.einstellungen.set(schluessel, String(wert)); return; }
  await pool.query(
    `INSERT INTO app_einstellungen (schluessel, wert) VALUES ($1,$2)
     ON CONFLICT (schluessel) DO UPDATE SET wert = EXCLUDED.wert`, [schluessel, String(wert)]);
}

export const WEHRCODE_SPIELE_STANDARD = 20;

/** So viele abgeschlossene Übungen braucht ein Konto für einen eigenen Wehr-Code (0 = nicht erspielbar). */
export async function wehrcodeSchwelle() {
  const n = Number(await getEinstellung('wehrcode_spiele', String(WEHRCODE_SPIELE_STANDARD)));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : WEHRCODE_SPIELE_STANDARD;
}

// ── Anmeldung ─────────────────────────────────────────────────────────────────────────────

/** Legt einen neuen Anmeldecode an. null, wenn für diese Adresse gerade erst einer verschickt wurde. */
export async function neuerLoginCode(email, jetzt = Date.now()) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const bis = new Date(jetzt + CODE_GUELTIG_MS);
  if (!pool) {
    const alt = mem.codes.get(email);
    if (alt && jetzt - alt.gesendet < CODE_SPERRE_MS) return null;
    mem.codes.set(email, { hash: sha(code), bis: bis.getTime(), versuche: 0, gesendet: jetzt });
    return code;
  }
  const alt = await pool.query(`SELECT gesendet FROM konto_codes WHERE email = $1`, [email]);
  if (alt.rows[0] && jetzt - new Date(alt.rows[0].gesendet).getTime() < CODE_SPERRE_MS) return null;
  await pool.query(
    `INSERT INTO konto_codes (email, hash, bis, versuche, gesendet) VALUES ($1,$2,$3,0,NOW())
     ON CONFLICT (email) DO UPDATE SET hash = EXCLUDED.hash, bis = EXCLUDED.bis, versuche = 0, gesendet = NOW()`,
    [email, sha(code), bis]);
  return code;
}

/** Prüft einen Anmeldecode; nach zu vielen Fehlversuchen ist er verbraucht. */
export async function pruefeLoginCode(email, code, jetzt = Date.now()) {
  const hash = sha(String(code ?? '').replace(/\D/g, ''));
  if (!pool) {
    const c = mem.codes.get(email);
    if (!c || c.bis < jetzt || c.versuche >= CODE_VERSUCHE) { mem.codes.delete(email); return false; }
    if (c.hash !== hash) { c.versuche++; return false; }
    mem.codes.delete(email);
    return true;
  }
  const r = await pool.query(
    `UPDATE konto_codes SET versuche = versuche + 1 WHERE email = $1 RETURNING hash, bis, versuche`, [email]);
  const c = r.rows[0];
  if (!c) return false;
  if (new Date(c.bis).getTime() < jetzt || c.versuche > CODE_VERSUCHE) {
    await pool.query(`DELETE FROM konto_codes WHERE email = $1`, [email]);
    return false;
  }
  if (c.hash !== hash) return false;
  await pool.query(`DELETE FROM konto_codes WHERE email = $1`, [email]);
  return true;
}

const zeile = r => r && { id: r.id, email: r.email, name: r.name, lizenzCode: r.lizenz_code, erstellt: r.erstellt };

export async function findeOderErstelleKonto(email) {
  if (!pool) {
    let k = [...mem.konten.values()].find(x => x.email === email);
    if (!k) { k = { id: mem.naechsteId++, email, name: '', lizenzCode: '', erstellt: new Date() }; mem.konten.set(k.id, k); }
    return { ...k };
  }
  const r = await pool.query(
    `INSERT INTO konten (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING *`, [email]);
  return zeile(r.rows[0]);
}

export async function neueSitzung(kontoId, jetzt = Date.now()) {
  const token = randomBytes(32).toString('hex');
  if (!pool) mem.sitzungen.set(sha(token), { kontoId, bis: jetzt + SITZUNG_MS });
  else await pool.query(`INSERT INTO konto_sitzungen (token_hash, konto_id, bis) VALUES ($1,$2,$3)`, [sha(token), kontoId, new Date(jetzt + SITZUNG_MS)]);
  return token;
}

export async function kontoZuToken(token, jetzt = Date.now()) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  if (!pool) {
    const s = mem.sitzungen.get(sha(token));
    if (!s || s.bis < jetzt) return null;
    const k = mem.konten.get(s.kontoId);
    return k ? { ...k } : null;
  }
  const r = await pool.query(
    `SELECT k.* FROM konto_sitzungen s JOIN konten k ON k.id = s.konto_id WHERE s.token_hash = $1 AND s.bis > NOW()`, [sha(token)]);
  return zeile(r.rows[0]) ?? null;
}

export async function loescheSitzung(token) {
  if (!pool) { mem.sitzungen.delete(sha(token)); return; }
  await pool.query(`DELETE FROM konto_sitzungen WHERE token_hash = $1`, [sha(token)]);
}

export async function aendereKonto(id, { name, lizenzCode }) {
  if (!pool) {
    const k = mem.konten.get(id);
    if (!k) return;
    if (name !== undefined) k.name = name;
    if (lizenzCode !== undefined) k.lizenzCode = lizenzCode;
    return;
  }
  if (name !== undefined) await pool.query(`UPDATE konten SET name = $2 WHERE id = $1`, [id, name]);
  if (lizenzCode !== undefined) await pool.query(`UPDATE konten SET lizenz_code = $2 WHERE id = $1`, [id, lizenzCode]);
}

/** Löscht das Konto samt Sitzungen, Spielstand und eigenen Übungen. */
export async function loescheKonto(id) {
  if (!pool) {
    mem.konten.delete(id);
    for (const [k, s] of mem.sitzungen) if (s.kontoId === id) mem.sitzungen.delete(k);
    for (const [k, s] of mem.spiele) if (s.kontoId === id) mem.spiele.delete(k);
    for (const [k, u] of mem.uebungen) if (u.leiterId === id) mem.uebungen.delete(k);
    return;
  }
  await pool.query(`DELETE FROM konten WHERE id = $1`, [id]);
}

// ── Spielstand ────────────────────────────────────────────────────────────────────────────

const heute = () => new Date().toISOString().slice(0, 10);

/** Zählt eine abgeschlossene Übung – je Szenario, Tag und Art nur einmal (beste Punktzahl bleibt). */
export async function merkeSpiel(kontoId, { szenarioId, art = 'einzel', punkte = null }) {
  const id = String(szenarioId ?? '').slice(0, 200);
  if (!id) return;
  const p = Number.isFinite(punkte) ? Math.max(0, Math.min(100000, Math.round(punkte))) : null;
  const a = art === 'gruppe' ? 'gruppe' : 'einzel';
  if (!pool) {
    const key = `${kontoId}|${id}|${heute()}|${a}`;
    const alt = mem.spiele.get(key);
    mem.spiele.set(key, { kontoId, szenarioId: id, tag: heute(), art: a, punkte: alt?.punkte != null && (p == null || alt.punkte > p) ? alt.punkte : p });
    return;
  }
  await pool.query(
    `INSERT INTO konto_spiele (konto_id, szenario_id, art, punkte) VALUES ($1,$2,$3,$4)
     ON CONFLICT (konto_id, szenario_id, tag, art) DO UPDATE
       SET punkte = GREATEST(COALESCE(konto_spiele.punkte, EXCLUDED.punkte), COALESCE(EXCLUDED.punkte, konto_spiele.punkte))`,
    [kontoId, id, a, p]);
}

export async function spielstand(kontoId) {
  if (!pool) {
    const alle = [...mem.spiele.values()].filter(s => s.kontoId === kontoId).sort((a, b) => b.tag.localeCompare(a.tag));
    return { spiele: alle.length, gruppe: alle.filter(s => s.art === 'gruppe').length, verlauf: alle.slice(0, 30).map(({ szenarioId, tag, art, punkte }) => ({ szenarioId, tag, art, punkte })) };
  }
  const [n, v] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS spiele, COUNT(*) FILTER (WHERE art = 'gruppe')::int AS gruppe FROM konto_spiele WHERE konto_id = $1`, [kontoId]),
    pool.query(`SELECT szenario_id, to_char(tag, 'YYYY-MM-DD') AS tag, art, punkte FROM konto_spiele WHERE konto_id = $1 ORDER BY tag DESC LIMIT 30`, [kontoId]),
  ]);
  return { ...n.rows[0], verlauf: v.rows.map(r => ({ szenarioId: r.szenario_id, tag: r.tag, art: r.art, punkte: r.punkte })) };
}

/** Für den Admin-Bereich: alle Konten mit Zahl der abgeschlossenen Übungen. */
export async function listeKonten() {
  if (!pool) {
    return [...mem.konten.values()].map(k => ({ ...k, spiele: [...mem.spiele.values()].filter(s => s.kontoId === k.id).length }));
  }
  const r = await pool.query(`
    SELECT k.*, (SELECT COUNT(*)::int FROM konto_spiele s WHERE s.konto_id = k.id) AS spiele
      FROM konten k ORDER BY k.erstellt DESC LIMIT 500`);
  return r.rows.map(x => ({ ...zeile(x), spiele: x.spiele }));
}

// ── Gruppenübungen ────────────────────────────────────────────────────────────────────────

export async function speichereUebung(code, { leiterId, daten, endet, beendet = null }) {
  if (!pool) { mem.uebungen.set(code, { leiterId, daten: structuredClone(daten), erstellt: mem.uebungen.get(code)?.erstellt ?? Date.now(), endet, beendet }); return; }
  await pool.query(
    `INSERT INTO gruppen_uebungen (code, leiter_id, daten, endet, beendet) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (code) DO UPDATE SET daten = EXCLUDED.daten, beendet = EXCLUDED.beendet`,
    [code, leiterId, JSON.stringify(daten), new Date(endet), beendet ? new Date(beendet) : null]);
}

export async function ladeUebung(code) {
  if (!pool) { const u = mem.uebungen.get(code); return u ? structuredClone(u.daten) : null; }
  const r = await pool.query(`SELECT daten FROM gruppen_uebungen WHERE code = $1`, [code]);
  return r.rows[0]?.daten ?? null;
}

export async function gibtEsUebung(code) {
  if (!pool) return mem.uebungen.has(code);
  const r = await pool.query(`SELECT 1 FROM gruppen_uebungen WHERE code = $1`, [code]);
  return r.rowCount > 0;
}

/** Die letzten Übungen einer Übungsleitung (ohne die vollständigen Daten). */
export async function listeUebungen(leiterId) {
  const kurz = (code, d, erstellt) => ({ code, titel: d.plan?.titel ?? '', org: d.plan?.org ?? '', phase: d.phase, teilnehmer: d.plan?.slots?.length ?? 0, erstellt, endetUm: d.endetUm });
  if (!pool) {
    return [...mem.uebungen.entries()].filter(([, u]) => u.leiterId === leiterId)
      .sort((a, b) => b[1].erstellt - a[1].erstellt).slice(0, 20).map(([code, u]) => kurz(code, u.daten, u.erstellt));
  }
  const r = await pool.query(`SELECT code, daten, erstellt FROM gruppen_uebungen WHERE leiter_id = $1 ORDER BY erstellt DESC LIMIT 20`, [leiterId]);
  return r.rows.map(x => kurz(x.code, x.daten, new Date(x.erstellt).getTime()));
}
