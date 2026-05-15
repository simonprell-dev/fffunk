import { randomBytes } from 'node:crypto';
import {
  isLicenseDbAvailable, createLicense, getLicenseByCode,
  getLicenseById, listLicenses, updateLicense, deleteLicense,
} from './license-db.mjs';
import { listScenarios, isDbAvailable, deleteScenario } from './community-db.mjs';

// ── Session auth ──────────────────────────────────────────────────────────────

const sessions = new Map(); // token → expiry
const SESSION_TTL = 24 * 60 * 60 * 1000;

function createSession() {
  const token = randomBytes(24).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL);
  for (const [t, exp] of sessions) if (exp < Date.now()) sessions.delete(t);
  return token;
}

function getToken(req) {
  const m = (req.headers.cookie || '').match(/\badmin_token=([a-f0-9]+)/);
  return m ? m[1] : null;
}

function isAuthed(req) {
  const token = getToken(req);
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) { sessions.delete(token); return false; }
  return true;
}

function cookieHeader(token) {
  return `admin_token=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=Strict`;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

function parseForm(body) {
  const p = new URLSearchParams(body);
  const o = {};
  for (const [k, v] of p) o[k] = v;
  return o;
}

function sendHtml(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(body);
}

function redirect(res, to, cookie) {
  const h = { location: to };
  if (cookie) h['set-cookie'] = cookie;
  res.writeHead(302, h);
  res.end();
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rufToText(rufnamen) {
  if (!rufnamen || typeof rufnamen !== 'object') return '';
  return Object.entries(rufnamen).map(([k, v]) => `${k}=${v}`).join('\n');
}

function parseRufText(text) {
  const result = {};
  for (const line of String(text || '').split('\n')) {
    const i = line.indexOf('=');
    if (i < 1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (k && v) result[k] = v;
  }
  return result;
}

// ── Shared CSS ────────────────────────────────────────────────────────────────

const CSS = `
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#e5e5e5;margin:0;min-height:100vh}
  a{color:inherit;text-decoration:none}
  input,select,textarea{background:#111;border:1px solid #444;color:#e5e5e5;border-radius:.5rem;padding:.5rem .75rem;width:100%;font-size:.9rem;font-family:inherit}
  input:focus,select:focus,textarea:focus{outline:none;border-color:#dc2626}
  label{display:block;font-size:.8rem;color:#a3a3a3;margin-bottom:.25rem;margin-top:.75rem}
  label:first-child{margin-top:0}
  .btn{display:inline-flex;align-items:center;gap:.375rem;padding:.5rem 1rem;border-radius:.5rem;font-weight:600;font-size:.875rem;cursor:pointer;border:none;text-decoration:none}
  .btn-primary{background:#dc2626;color:#fff}.btn-primary:hover{background:#b91c1c}
  .btn-secondary{background:#262626;color:#e5e5e5;border:1px solid #444}.btn-secondary:hover{background:#333}
  .btn-danger{background:#3d0a0a;color:#fca5a5;border:1px solid #7f1d1d}.btn-danger:hover{background:#7f1d1d}
  .btn-sm{padding:.25rem .625rem;font-size:.8rem}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;padding:.75rem 1rem;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:1px solid #222;font-weight:600}
  td{padding:.75rem 1rem;border-bottom:1px solid #1a1a1a;vertical-align:top;font-size:.875rem}
  tr:hover td{background:#111}
  .card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:.75rem;padding:1.5rem}
  .badge{display:inline-block;padding:.15rem .5rem;border-radius:9999px;font-size:.75rem;font-weight:500}
  .ok{background:#14532d40;color:#86efac;border:1px solid #166534}
  .err{background:#7f1d1d40;color:#fca5a5;border:1px solid #991b1b}
  .warn{background:#78350f40;color:#fbbf24;border:1px solid #92400e}
  .flash-ok{background:#14532d40;border:1px solid #166534;color:#86efac;border-radius:.5rem;padding:.75rem 1rem;margin-bottom:1rem;font-size:.875rem}
  .flash-err{background:#7f1d1d40;border:1px solid #991b1b;color:#fca5a5;border-radius:.5rem;padding:.75rem 1rem;margin-bottom:1rem;font-size:.875rem}
  .code{font-family:monospace;background:#0a0a0a;border:1px solid #333;border-radius:.375rem;padding:.2rem .5rem;font-size:.9rem;letter-spacing:.05em}
  nav a.active{color:#fff}
  nav a{color:#a3a3a3}
  nav a:hover{color:#fff}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  @media(max-width:640px){.grid2{grid-template-columns:1fr}}
  .full{grid-column:1/-1}
  h2{font-size:1.5rem;font-weight:700;margin:0 0 1.5rem}
  h3{font-size:1rem;font-weight:600;margin:0 0 1rem}
  .mono{font-family:monospace;font-size:.85rem}
`;

// ── Layout wrapper ────────────────────────────────────────────────────────────

function page(title, content, active = '') {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(title)} – FFFunk Admin</title>
  <style>${CSS}</style>
</head>
<body>
<nav style="background:#1a1a1a;border-bottom:1px solid #2a2a2a;padding:.75rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
  <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:.5rem;">
      <div style="width:2rem;height:2rem;background:#dc2626;border-radius:.375rem;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.1rem;">F</div>
      <strong>FFFunk Admin</strong>
    </div>
    <nav style="display:flex;gap:1.25rem;font-size:.875rem;">
      <a href="/admin/dashboard" class="${active === 'dashboard' ? 'active' : ''}">Übersicht</a>
      <a href="/admin/licenses" class="${active === 'licenses' ? 'active' : ''}">Lizenzen</a>
      <a href="/admin/community" class="${active === 'community' ? 'active' : ''}">Community</a>
    </nav>
  </div>
  <form method="POST" action="/admin/logout" style="margin:0;">
    <button type="submit" class="btn btn-secondary btn-sm">Abmelden</button>
  </form>
</nav>
<main style="max-width:1000px;margin:0 auto;padding:2rem 1.5rem;">
  ${content}
</main>
</body></html>`;
}

// ── Login page ────────────────────────────────────────────────────────────────

function loginPage(err = '') {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>FFFunk Admin – Login</title>
  <style>${CSS}</style>
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="width:100%;max-width:360px;padding:1rem;">
  <div style="text-align:center;margin-bottom:2rem;">
    <div style="width:3.5rem;height:3.5rem;background:#dc2626;border-radius:.75rem;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;font-size:1.75rem;margin-bottom:.75rem;">F</div>
    <h1 style="font-size:1.5rem;font-weight:700;margin:0;">FFFunk Admin</h1>
  </div>
  ${err ? `<div class="flash-err">${esc(err)}</div>` : ''}
  <form method="POST" action="/admin/login" class="card">
    <label>Passwort</label>
    <input type="password" name="password" autofocus autocomplete="current-password">
    <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1.25rem;justify-content:center;">Anmelden</button>
  </form>
</div>
</body></html>`;
}

// ── Dashboard page ────────────────────────────────────────────────────────────

async function dashboardPage() {
  let totalLicenses = 0, activeLicenses = 0, communityCount = 0;
  try {
    const ls = await listLicenses();
    totalLicenses = ls.length;
    activeLicenses = ls.filter(l => l.active).length;
  } catch {}
  try { communityCount = (await listScenarios()).length; } catch {}

  const dbStatus = isLicenseDbAvailable()
    ? '<span class="badge ok">Verbunden</span>'
    : '<span class="badge err">Nicht verfügbar – DATABASE_URL fehlt</span>';
  const pwStatus = process.env.ADMIN_PASSWORD
    ? '<span class="badge ok">Gesetzt</span>'
    : '<span class="badge err">ADMIN_PASSWORD nicht gesetzt!</span>';

  return page('Übersicht', `
    <h2>Übersicht</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-bottom:2rem;">
      <div class="card" style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:700;color:#dc2626;">${activeLicenses}</div>
        <div style="color:#a3a3a3;font-size:.8rem;margin-top:.25rem;">Aktive Lizenzen</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:700;color:#dc2626;">${totalLicenses}</div>
        <div style="color:#a3a3a3;font-size:.8rem;margin-top:.25rem;">Lizenzen gesamt</div>
      </div>
      <div class="card" style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:700;color:#dc2626;">${communityCount}</div>
        <div style="color:#a3a3a3;font-size:.8rem;margin-top:.25rem;">Community-Szenarien</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:1.5rem;">
      <h3>System-Status</h3>
      <table style="width:auto;">
        <tr><td style="padding:.4rem 1rem .4rem 0;color:#a3a3a3;">Datenbank</td><td style="padding:.4rem 0;">${dbStatus}</td></tr>
        <tr><td style="padding:.4rem 1rem .4rem 0;color:#a3a3a3;">Admin-Passwort</td><td style="padding:.4rem 0;">${pwStatus}</td></tr>
      </table>
    </div>
    <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
      <a href="/admin/licenses/new" class="btn btn-primary">+ Neue Lizenz</a>
      <a href="/admin/licenses" class="btn btn-secondary">Alle Lizenzen</a>
      <a href="/admin/community" class="btn btn-secondary">Community verwalten</a>
    </div>
  `, 'dashboard');
}

// ── License list page ─────────────────────────────────────────────────────────

async function licensesPage(flash = '') {
  const licenses = await listLicenses();

  const rows = licenses.map(l => {
    const ruf = Object.entries(l.rufnamen || {});
    return `<tr>
      <td><span class="code">${esc(l.code)}</span></td>
      <td><strong>${esc(l.organization_name)}</strong></td>
      <td style="color:#a3a3a3;">
        ${l.contact_name ? esc(l.contact_name) + '<br>' : ''}
        ${l.contact_email ? `<a href="mailto:${esc(l.contact_email)}" style="color:#60a5fa;">${esc(l.contact_email)}</a>` : ''}
        ${l.contact_phone ? '<br>' + esc(l.contact_phone) : ''}
      </td>
      <td>
        ${ruf.slice(0, 3).map(([k, v]) => `<div class="mono" style="font-size:.78rem;"><span style="color:#666;">${esc(k)}</span> → <span style="color:#e5e5e5;">${esc(v)}</span></div>`).join('')}
        ${ruf.length > 3 ? `<div style="font-size:.75rem;color:#555;">+${ruf.length - 3} weitere</div>` : ''}
      </td>
      <td style="white-space:nowrap;color:#666;">${new Date(l.created_at).toLocaleDateString('de-DE')}</td>
      <td><span class="badge ${l.active ? 'ok' : 'err'}">${l.active ? 'Aktiv' : 'Inaktiv'}</span></td>
      <td>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          <a href="/admin/licenses/${l.id}" class="btn btn-secondary btn-sm">Bearbeiten</a>
          <form method="POST" action="/admin/licenses/${l.id}/delete" style="margin:0;"
                onsubmit="return confirm('Lizenz ${esc(l.code)} wirklich löschen?')">
            <button type="submit" class="btn btn-danger btn-sm">Löschen</button>
          </form>
        </div>
      </td>
    </tr>`;
  }).join('');

  return page('Lizenzen', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
      <h2 style="margin:0;">Lizenzen</h2>
      <a href="/admin/licenses/new" class="btn btn-primary">+ Neue Lizenz</a>
    </div>
    ${flash ? `<div class="flash-ok">${esc(flash)}</div>` : ''}
    ${!isLicenseDbAvailable() ? '<div class="flash-err">Datenbank nicht verfügbar. Bitte DATABASE_URL setzen.</div>' : ''}
    ${licenses.length === 0
      ? '<div class="card" style="text-align:center;color:#a3a3a3;padding:3rem;">Noch keine Lizenzen erstellt.</div>'
      : `<div class="card" style="padding:0;overflow:auto;">
           <table><thead><tr>
             <th>Code</th><th>Organisation</th><th>Kontakt</th><th>Rufnamen</th>
             <th>Erstellt</th><th>Status</th><th>Aktionen</th>
           </tr></thead><tbody>${rows}</tbody></table>
         </div>`}
  `, 'licenses');
}

// ── License form page ─────────────────────────────────────────────────────────

function licenseFormPage(l, err = '') {
  const isEdit = l != null;
  const v = (f, fb = '') => esc(l?.[f] ?? fb);
  const rufText = esc(rufToText(l?.rufnamen ?? {
    'Florian Kirchberg 44/1': 'Florian [Ort] 1/40/1',
    'Florian Kirchberg 44/2': 'Florian [Ort] 2/40/1',
    'Kirchberg': '[Ort]',
    'Leitstelle': 'ILS [Region]',
  }));

  return page(isEdit ? 'Lizenz bearbeiten' : 'Neue Lizenz', `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
      <a href="/admin/licenses" class="btn btn-secondary btn-sm">← Zurück</a>
      <h2 style="margin:0;">${isEdit ? 'Lizenz bearbeiten' : 'Neue Lizenz erstellen'}</h2>
    </div>
    ${isEdit ? `<div style="margin-bottom:1.5rem;">Code: <span class="code" style="font-size:1.1rem;">${v('code')}</span></div>` : ''}
    ${err ? `<div class="flash-err">${esc(err)}</div>` : ''}

    <form method="POST" action="${isEdit ? `/admin/licenses/${l.id}/update` : '/admin/licenses/create'}">
      <div style="display:grid;gap:1.5rem;">

        <div class="card">
          <h3>Auftragsdaten</h3>
          <div class="grid2">
            <div class="full">
              <label>Organisation / Feuerwehr *</label>
              <input name="organizationName" value="${v('organization_name')}" required placeholder="z.B. FF Musterstadt">
            </div>
            <div>
              <label>Ansprechpartner</label>
              <input name="contactName" value="${v('contact_name')}" placeholder="Max Mustermann">
            </div>
            <div>
              <label>E-Mail</label>
              <input name="contactEmail" type="email" value="${v('contact_email')}" placeholder="max@feuerwehr.de">
            </div>
            <div>
              <label>Telefon</label>
              <input name="contactPhone" value="${v('contact_phone')}" placeholder="+49 170 1234567">
            </div>
            <div${isEdit ? '' : ' class="full"'}>
              <label>Notizen / Auftragsinfos</label>
              <textarea name="notes" rows="3" placeholder="Interne Notizen, Auftragsnummer, Vereinbarungen...">${v('notes')}</textarea>
            </div>
            ${isEdit ? `
            <div>
              <label>Status</label>
              <select name="active">
                <option value="true"${l.active ? ' selected' : ''}>Aktiv</option>
                <option value="false"${!l.active ? ' selected' : ''}>Inaktiv (Code gesperrt)</option>
              </select>
            </div>` : ''}
          </div>
        </div>

        <div class="card">
          <h3>Rufnamen &amp; Textsubstitutionen</h3>
          <p style="font-size:.8rem;color:#a3a3a3;margin:0 0 .75rem;">
            Eine Substitution pro Zeile: <code style="background:#0a0a0a;padding:.1rem .35rem;border-radius:.25rem;">Suchtext=Ersetzung</code><br>
            Die App ersetzt diese Texte automatisch in Szenarien und in der Sprachausgabe.
            Längere Begriffe werden zuerst ersetzt.
          </p>
          <textarea name="rufnamen" rows="10" class="mono" placeholder="Florian Kirchberg 44/1=Florian Musterstadt 1/40/1&#10;Kirchberg=Musterstadt&#10;Leitstelle=ILS München">${rufText}</textarea>
        </div>

        <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Änderungen speichern' : 'Lizenz erstellen & Code generieren'}</button>
          <a href="/admin/licenses" class="btn btn-secondary">Abbrechen</a>
        </div>
      </div>
    </form>
  `, 'licenses');
}

// ── Community page ────────────────────────────────────────────────────────────

async function communityPage(flash = '') {
  let scenarios = [];
  try { scenarios = await listScenarios(); } catch {}

  const rows = scenarios.map(s => `<tr>
    <td>
      <strong>${esc(s.title)}</strong><br>
      <span style="color:#666;font-size:.8rem;">${esc(s.description)}</span>
    </td>
    <td>${esc(s.author_name)}</td>
    <td><span class="badge warn">${esc(s.category)}</span></td>
    <td style="color:#a3a3a3;">♥ ${s.thank_count}</td>
    <td style="color:#666;white-space:nowrap;">${new Date(s.published_at).toLocaleDateString('de-DE')}</td>
    <td>
      <form method="POST" action="/admin/community/${esc(s.share_id)}/delete" style="margin:0;"
            onsubmit="return confirm('Szenario wirklich löschen?')">
        <button type="submit" class="btn btn-danger btn-sm">Löschen</button>
      </form>
    </td>
  </tr>`).join('');

  return page('Community-Szenarien', `
    <h2>Community-Szenarien</h2>
    ${flash ? `<div class="flash-ok">${esc(flash)}</div>` : ''}
    ${!isDbAvailable() ? '<div class="flash-err">Datenbank nicht verfügbar.</div>' : ''}
    ${scenarios.length === 0
      ? '<div class="card" style="text-align:center;color:#a3a3a3;padding:3rem;">Keine Community-Szenarien vorhanden.</div>'
      : `<div class="card" style="padding:0;overflow:auto;">
           <table><thead><tr>
             <th>Titel &amp; Beschreibung</th><th>Autor</th><th>Kategorie</th>
             <th>Danke</th><th>Veröffentlicht</th><th>Aktion</th>
           </tr></thead><tbody>${rows}</tbody></table>
         </div>`}
  `, 'community');
}

// ── Public license lookup ─────────────────────────────────────────────────────

export async function handleLicenseLookup(req, res) {
  const code = req.url.split('/api/license/')[1]?.split('?')[0];
  if (!code) { sendJson(res, 400, { error: 'Kein Code angegeben.' }); return; }
  try {
    const license = await getLicenseByCode(code);
    if (!license) { sendJson(res, 404, { error: 'Unbekannter oder inaktiver Code.' }); return; }
    sendJson(res, 200, { organizationName: license.organization_name, rufnamen: license.rufnamen ?? {} });
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
}

// ── Main admin request handler ────────────────────────────────────────────────

export async function handleAdminRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/\/$/, '') || '/admin';
  const m = req.method.toUpperCase();

  // Public: login
  if ((p === '/admin' || p === '/admin/login') && m === 'GET') {
    return isAuthed(req) ? redirect(res, '/admin/dashboard') : sendHtml(res, 200, loginPage());
  }
  if (p === '/admin/login' && m === 'POST') {
    const body = parseForm(await readBody(req));
    const pw = process.env.ADMIN_PASSWORD;
    if (!pw) return sendHtml(res, 200, loginPage('ADMIN_PASSWORD ist nicht gesetzt.'));
    if (body.password !== pw) return sendHtml(res, 200, loginPage('Falsches Passwort.'));
    return redirect(res, '/admin/dashboard', cookieHeader(createSession()));
  }
  if (p === '/admin/logout' && m === 'POST') {
    const token = getToken(req);
    if (token) sessions.delete(token);
    return redirect(res, '/admin/login', 'admin_token=; HttpOnly; Path=/; Max-Age=0');
  }

  // All other routes require auth
  if (!isAuthed(req)) return redirect(res, '/admin/login');

  if (p === '/admin/dashboard' && m === 'GET')
    return sendHtml(res, 200, await dashboardPage());

  if (p === '/admin/licenses' && m === 'GET')
    return sendHtml(res, 200, await licensesPage(url.searchParams.get('msg') || ''));

  if (p === '/admin/licenses/new' && m === 'GET')
    return sendHtml(res, 200, licenseFormPage(null));

  if (p === '/admin/licenses/create' && m === 'POST') {
    const body = parseForm(await readBody(req));
    if (!body.organizationName?.trim())
      return sendHtml(res, 200, licenseFormPage(null, 'Organisation ist ein Pflichtfeld.'));
    try {
      const license = await createLicense({
        organizationName: body.organizationName.trim(),
        contactName: body.contactName?.trim(),
        contactEmail: body.contactEmail?.trim(),
        contactPhone: body.contactPhone?.trim(),
        rufnamen: parseRufText(body.rufnamen),
        notes: body.notes?.trim(),
      });
      return redirect(res, `/admin/licenses?msg=Lizenz+${encodeURIComponent(license.code)}+erstellt`);
    } catch (e) {
      return sendHtml(res, 200, licenseFormPage(null, e.message));
    }
  }

  const editM = p.match(/^\/admin\/licenses\/(\d+)$/);
  if (editM && m === 'GET') {
    const license = await getLicenseById(editM[1]);
    if (!license) return sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Lizenz nicht gefunden.</p>'));
    return sendHtml(res, 200, licenseFormPage(license));
  }

  const updateM = p.match(/^\/admin\/licenses\/(\d+)\/update$/);
  if (updateM && m === 'POST') {
    const body = parseForm(await readBody(req));
    if (!body.organizationName?.trim()) {
      const license = await getLicenseById(updateM[1]);
      return sendHtml(res, 200, licenseFormPage(license, 'Organisation ist ein Pflichtfeld.'));
    }
    try {
      await updateLicense(updateM[1], {
        organizationName: body.organizationName.trim(),
        contactName: body.contactName?.trim(),
        contactEmail: body.contactEmail?.trim(),
        contactPhone: body.contactPhone?.trim(),
        rufnamen: parseRufText(body.rufnamen),
        notes: body.notes?.trim(),
        active: body.active !== 'false',
      });
      return redirect(res, '/admin/licenses?msg=Lizenz+gespeichert');
    } catch (e) {
      const license = await getLicenseById(updateM[1]);
      return sendHtml(res, 200, licenseFormPage(license, e.message));
    }
  }

  const deleteM = p.match(/^\/admin\/licenses\/(\d+)\/delete$/);
  if (deleteM && m === 'POST') {
    await deleteLicense(deleteM[1]);
    return redirect(res, '/admin/licenses?msg=Lizenz+gelöscht');
  }

  if (p === '/admin/community' && m === 'GET')
    return sendHtml(res, 200, await communityPage(url.searchParams.get('msg') || ''));

  const comDelM = p.match(/^\/admin\/community\/([^/]+)\/delete$/);
  if (comDelM && m === 'POST') {
    try { await deleteScenario(comDelM[1]); } catch {}
    return redirect(res, '/admin/community?msg=Szenario+gelöscht');
  }

  sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Seite nicht gefunden.</p>'));
}
