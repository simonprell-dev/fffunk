// /api/konto/… – Anmeldung per E-Mail-Code, Spielstand, eigener Wehr-Code.
import {
  aendereKonto, findeOderErstelleKonto, istEmail, kontoZuToken, loescheKonto, loescheSitzung, merkeSpiel,
  neueSitzung, neuerLoginCode, normEmail, pruefeLoginCode, spielstand, wehrcodeSchwelle,
} from './konto-db.mjs';
import { createLicense, getLicenseByCode, isLicenseDbAvailable, updateLicense } from './license-db.mjs';
import { istMailEingerichtet, sendeLoginCode } from './mailer.mjs';
import { SITE } from './static-route.mjs';

export function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

/** CORS für die Android-App (anderes Origin). Liefert true, wenn die Anfrage damit erledigt ist. */
export function cors(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
  return false;
}

export async function readJson(req, maxBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > maxBytes) throw Object.assign(new Error('Anfrage zu groß.'), { status: 413 });
    chunks.push(c);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('Ungültige Anfrage.'), { status: 400 }); }
}

export function bearer(req) {
  return (req.headers.authorization || '').match(/^Bearer\s+([a-f0-9]{64})$/i)?.[1] ?? null;
}

export async function kontoAusAnfrage(req) {
  return kontoZuToken(bearer(req));
}

// Anmeldeversuche je Adresse des Aufrufers begrenzen (nur im Arbeitsspeicher, wird nicht gespeichert).
const versuche = new Map(); // ip → { n, bis }
function gebremst(req, max = 20, fensterMs = 60 * 60 * 1000) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const jetzt = Date.now();
  const v = versuche.get(ip);
  if (!v || v.bis < jetzt) { versuche.set(ip, { n: 1, bis: jetzt + fensterMs }); return false; }
  if (versuche.size > 5000) for (const [k, x] of versuche) if (x.bis < jetzt) versuche.delete(k);
  return ++v.n > max;
}

function appAdresse(req) {
  const origin = String(req.headers.origin || '');
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : SITE;
}

/** Rufnamen-Zuordnung aus dem Konto: höchstens 80 Einträge, kurze Texte. */
export function saubereRufnamen(eingabe) {
  const out = {};
  if (!eingabe || typeof eingabe !== 'object') return out;
  for (const [k, v] of Object.entries(eingabe).slice(0, 80)) {
    const alt = String(k).trim().slice(0, 80);
    const neu = String(v ?? '').trim().slice(0, 80);
    if (alt && neu && alt !== neu) out[alt] = neu;
  }
  return out;
}

async function kontoSicht(konto) {
  const [stand, schwelle] = await Promise.all([spielstand(konto.id), wehrcodeSchwelle()]);
  let wehrcode = null;
  if (konto.lizenzCode) {
    const l = await getLicenseByCode(konto.lizenzCode).catch(() => null);
    if (l) wehrcode = { code: l.code, organisation: l.organization_name, rufnamen: l.rufnamen ?? {} };
  }
  return { email: konto.email, name: konto.name, spiele: stand.spiele, gruppenspiele: stand.gruppe, verlauf: stand.verlauf, schwelle, wehrcode };
}

export async function handleKontoRequest(req, res) {
  if (cors(req, res)) return;
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/\/$/, '');
  const m = req.method;

  try {
    if (p === '/api/konto/login' && m === 'POST') {
      if (gebremst(req)) return sendJson(res, 429, { error: 'Zu viele Versuche. Bitte später noch einmal.' });
      const email = normEmail((await readJson(req)).email);
      if (!istEmail(email)) return sendJson(res, 400, { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' });
      const code = await neuerLoginCode(email);
      if (!code) return sendJson(res, 429, { error: 'Der Code wurde gerade verschickt. Bitte eine Minute warten.' });
      const link = `${appAdresse(req)}/#login=${encodeURIComponent(email)}:${code}`;
      let verschickt = false;
      try { verschickt = await sendeLoginCode(email, code, link); } catch (e) {
        console.error('E-Mail-Versand fehlgeschlagen:', e.message);
        return sendJson(res, 502, { error: 'Die E-Mail konnte nicht verschickt werden. Bitte später noch einmal.' });
      }
      // Nur für lokale Tests: Code direkt zurückgeben, wenn kein Versand eingerichtet ist.
      const testCode = !istMailEingerichtet() && process.env.KONTO_TESTCODE === '1' ? code : undefined;
      if (!verschickt && !testCode) return sendJson(res, 503, { error: 'Die Anmeldung per E-Mail ist auf diesem Server noch nicht eingerichtet.' });
      return sendJson(res, 200, { ok: true, testCode });
    }

    if (p === '/api/konto/verify' && m === 'POST') {
      if (gebremst(req, 40)) return sendJson(res, 429, { error: 'Zu viele Versuche. Bitte später noch einmal.' });
      const body = await readJson(req);
      const email = normEmail(body.email);
      if (!istEmail(email) || !(await pruefeLoginCode(email, body.code))) {
        return sendJson(res, 401, { error: 'Der Code stimmt nicht oder ist abgelaufen.' });
      }
      const konto = await findeOderErstelleKonto(email);
      return sendJson(res, 200, { token: await neueSitzung(konto.id), konto: await kontoSicht(konto) });
    }

    const konto = await kontoAusAnfrage(req);
    if (!konto) return sendJson(res, 401, { error: 'Nicht angemeldet.' });

    if (p === '/api/konto' && m === 'GET') return sendJson(res, 200, { konto: await kontoSicht(konto) });

    if (p === '/api/konto' && m === 'DELETE') {
      await loescheKonto(konto.id);
      return sendJson(res, 200, { ok: true });
    }

    if (p === '/api/konto/logout' && m === 'POST') {
      await loescheSitzung(bearer(req));
      return sendJson(res, 200, { ok: true });
    }

    if (p === '/api/konto/name' && m === 'POST') {
      const name = String((await readJson(req)).name ?? '').trim().slice(0, 60);
      await aendereKonto(konto.id, { name });
      return sendJson(res, 200, { konto: await kontoSicht({ ...konto, name }) });
    }

    if (p === '/api/konto/spiel' && m === 'POST') {
      const body = await readJson(req);
      await merkeSpiel(konto.id, { szenarioId: body.szenarioId, art: 'einzel', punkte: Number(body.punkte) });
      return sendJson(res, 200, { konto: await kontoSicht(konto) });
    }

    if (p === '/api/konto/wehrcode' && m === 'POST') {
      if (!isLicenseDbAvailable()) return sendJson(res, 503, { error: 'Wehr-Codes brauchen die Datenbank – auf diesem Server nicht verfügbar.' });
      if (konto.lizenzCode && await getLicenseByCode(konto.lizenzCode)) return sendJson(res, 409, { error: 'Dieses Konto hat schon einen Wehr-Code.' });
      const organisation = String((await readJson(req)).organisation ?? '').trim().slice(0, 120);
      if (organisation.length < 3) return sendJson(res, 400, { error: 'Bitte den Namen eurer Wehr oder Organisation angeben.' });
      const [stand, schwelle] = await Promise.all([spielstand(konto.id), wehrcodeSchwelle()]);
      if (!schwelle) return sendJson(res, 403, { error: 'Wehr-Codes können derzeit nicht erspielt werden.' });
      if (stand.spiele < schwelle) return sendJson(res, 403, { error: `Noch ${schwelle - stand.spiele} abgeschlossene Übungen bis zum Wehr-Code.` });
      const lizenz = await createLicense({ organizationName: organisation, contactName: konto.name, contactEmail: konto.email, notes: `Erspielt über Konto (${stand.spiele} Übungen)` });
      await aendereKonto(konto.id, { lizenzCode: lizenz.code });
      return sendJson(res, 200, { konto: await kontoSicht({ ...konto, lizenzCode: lizenz.code }) });
    }

    if (p === '/api/konto/rufnamen' && m === 'POST') {
      const lizenz = konto.lizenzCode && await getLicenseByCode(konto.lizenzCode);
      if (!lizenz) return sendJson(res, 404, { error: 'Dieses Konto hat noch keinen Wehr-Code.' });
      await updateLicense(lizenz.id, {
        organizationName: lizenz.organization_name, contactName: lizenz.contact_name, contactEmail: lizenz.contact_email,
        contactPhone: lizenz.contact_phone, notes: lizenz.notes, active: lizenz.active,
        rufnamen: saubereRufnamen((await readJson(req)).rufnamen),
      });
      return sendJson(res, 200, { konto: await kontoSicht(konto) });
    }

    sendJson(res, 404, { error: 'Nicht gefunden.' });
  } catch (e) {
    if (!e.status) console.error('Konto-API:', e);
    sendJson(res, e.status || 500, { error: e.status ? e.message : 'Serverfehler.' });
  }
}
