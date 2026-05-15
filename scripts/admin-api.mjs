import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLicenseDbAvailable, createLicense, getLicenseByCode,
  getLicenseById, listLicenses, updateLicense, deleteLicense,
  listAdminScenarios, getAdminScenario, createAdminScenario,
  updateAdminScenario, deleteAdminScenario, setScenarioLicenses, upsertAdminScenario,
  listTaxonomy, getTaxonomyItem, createTaxonomyItem, updateTaxonomyItem, deleteTaxonomyItem,
} from './license-db.mjs';
import { listScenarios, getScenario as getCommunityScenario, isDbAvailable, deleteScenario } from './community-db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const scenariosDir = path.join(rootDir, 'public', 'scenarios');

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

function defaultWildcardText() {
  return [
    'Florian Kirchberg 44/1=Florian [Ort] 1/40/1',
    'Florian Kirchberg 44/2=Florian [Ort] 2/40/1',
    'Florian Kirchberg=Florian [Ort]',
    'Kirchberg=[Ort]',
    'Leitstelle=ILS [Region]',
  ].join('\n');
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

function applyTextMapDeep(value, replacements) {
  if (!replacements || Object.keys(replacements).length === 0) return value;
  if (typeof value === 'string') {
    return Object.entries(replacements)
      .sort((a, b) => b[0].length - a[0].length)
      .reduce((text, [from, to]) => text.split(from).join(to), value);
  }
  if (Array.isArray(value)) return value.map(item => applyTextMapDeep(item, replacements));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, applyTextMapDeep(item, replacements)])
    );
  }
  return value;
}

function splitQuickStepLine(line) {
  return String(line || '').split('|').map(part => part.trim());
}

function buildScenarioFromQuickSteps(body) {
  const quickSteps = String(body.quickSteps || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(splitQuickStepLine)
    .filter(parts => parts[0] && parts[2]);

  if (quickSteps.length === 0) return null;

  const scenarioId = String(body.scenarioId || body.title || 'neues_szenario').trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'neues_szenario';
  const role = String(body.playerRole || 'gruppenführer_a').trim() || 'gruppenführer_a';
  const nodes = {};

  quickSteps.forEach(([prompt, expected, hint, feedback], index) => {
    const nodeId = `n_step_${index + 1}`;
    const failId = `n_step_${index + 1}_fail`;
    const nextNodeId = index === quickSteps.length - 1 ? 'n_end' : `n_step_${index + 2}`;
    nodes[nodeId] = {
      id: nodeId,
      role,
      narrative: prompt,
      actions: [{
        id: `radio_step_${index + 1}`,
        label: 'Funk-Meldung sprechen',
        radioCall: {
          expectedPhrases: String(expected || '').split(',').map(item => item.trim()).filter(Boolean),
          hint,
          onSuccess: nextNodeId,
          onFailure: failId,
          feedbackSuccess: 'Funkmeldung korrekt.',
          feedbackFailure: feedback || 'Wiederholen Sie die Meldung mit den erwarteten Kernbegriffen.',
        },
      }],
    };
    nodes[failId] = {
      id: failId,
      role,
      narrative: `**Feedback:** ${feedback || 'Die Funkmeldung war noch nicht vollständig.'}\n\nBeispiel: *"${hint}"*`,
      actions: [{ id: 'retry', label: 'Erneut versuchen', nextNodeId: nodeId }],
    };
  });

  nodes.n_end = {
    id: 'n_end',
    role,
    narrative: '**Übung abgeschlossen!**',
    actions: [
      { id: 'restart', label: 'Noch einmal trainieren', nextNodeId: 'n_step_1' },
      { id: 'exit', label: 'Zur Übersicht', nextNodeId: '__exit__' },
    ],
  };

  return {
    id: scenarioId,
    title: String(body.title || 'Neues Szenario').trim(),
    description: String(body.description || '').trim(),
    startingNodeId: 'n_step_1',
    playerRole: role,
    nodes,
    community: {
      authorName: 'Admin',
      category: String(body.category || 'sonstige').trim() || 'sonstige',
      source: 'license',
      status: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function buildScenarioFromStepFields(body) {
  const prompts = formArray(body.stepPrompt);
  const expected = formArray(body.stepExpected);
  const hints = formArray(body.stepHint);
  const failures = formArray(body.stepFailure);
  const steps = prompts.map((prompt, index) => ({
    prompt: String(prompt || '').trim(),
    expected: String(expected[index] || '').trim(),
    hint: String(hints[index] || '').trim(),
    failure: String(failures[index] || '').trim(),
  })).filter(step => step.prompt && step.hint);

  if (steps.length === 0) return null;

  const scenarioId = String(body.scenarioId || body.title || 'neues_szenario').trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'neues_szenario';
  const role = String(body.playerRole || 'gruppenführer_a').trim() || 'gruppenführer_a';
  const nodes = {};

  steps.forEach((step, index) => {
    const nodeId = `n_step_${index + 1}`;
    const failId = `n_step_${index + 1}_fail`;
    const nextNodeId = index === steps.length - 1 ? 'n_end' : `n_step_${index + 2}`;
    nodes[nodeId] = {
      id: nodeId,
      role,
      narrative: step.prompt,
      actions: [{
        id: `radio_step_${index + 1}`,
        label: 'Funk-Meldung sprechen',
        radioCall: {
          expectedPhrases: step.expected.split(/[,\n]/).map(item => item.trim()).filter(Boolean),
          hint: step.hint,
          onSuccess: nextNodeId,
          onFailure: failId,
          feedbackSuccess: 'Funkmeldung korrekt.',
          feedbackFailure: step.failure || 'Wiederholen Sie die Meldung mit den erwarteten Kernbegriffen.',
        },
      }],
    };
    nodes[failId] = {
      id: failId,
      role,
      narrative: `**Feedback:** ${step.failure || 'Die Funkmeldung war noch nicht vollständig.'}\n\nBeispiel: *"${step.hint}"*`,
      actions: [{ id: 'retry', label: 'Erneut versuchen', nextNodeId: nodeId }],
    };
  });

  nodes.n_end = {
    id: 'n_end',
    role,
    narrative: '**Übung abgeschlossen!**',
    actions: [
      { id: 'restart', label: 'Noch einmal trainieren', nextNodeId: 'n_step_1' },
      { id: 'exit', label: 'Zur Übersicht', nextNodeId: '__exit__' },
    ],
  };

  return {
    id: scenarioId,
    title: String(body.title || 'Neues Szenario').trim(),
    description: String(body.description || '').trim(),
    startingNodeId: 'n_step_1',
    playerRole: role,
    nodes,
    community: {
      authorName: 'Admin',
      category: String(body.category || 'sonstige').trim() || 'sonstige',
      source: 'license',
      status: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function syncScenarioMeta(scenario, { scenarioId, title, description, category, playerRole }) {
  const next = {
    ...scenario,
    id: scenarioId || scenario.id,
    title: title || scenario.title,
    description: description ?? scenario.description ?? '',
    playerRole: playerRole || scenario.playerRole || 'gruppenführer_a',
    community: {
      authorName: scenario.community?.authorName || 'Admin',
      source: scenario.community?.source || 'license',
      status: scenario.community?.status || 'local',
      createdAt: scenario.community?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...scenario.community,
      category: category || scenario.community?.category || 'sonstige',
    },
  };

  for (const node of Object.values(next.nodes || {})) {
    if (node && typeof node === 'object') node.role = next.playerRole;
  }

  return next;
}

function scenarioToQuickSteps(scenario) {
  if (!scenario?.nodes || !scenario?.startingNodeId) return '';
  const lines = [];
  const seen = new Set();
  let nodeId = scenario.startingNodeId;
  while (nodeId && nodeId !== 'n_end' && nodeId !== '__exit__' && !seen.has(nodeId)) {
    seen.add(nodeId);
    const node = scenario.nodes[nodeId];
    if (!node) break;
    const action = (node.actions || []).find(item => item.radioCall);
    if (!action?.radioCall) break;
    lines.push([
      String(node.narrative || '').replace(/\s+/g, ' ').trim(),
      (action.radioCall.expectedPhrases || []).join(', '),
      action.radioCall.hint || '',
      action.radioCall.feedbackFailure || '',
    ].join(' | '));
    nodeId = action.radioCall.onSuccess;
  }
  return lines.join('\n');
}

function scenarioToStepEditorSteps(scenario) {
  if (!scenario?.nodes || !scenario?.startingNodeId) {
    return [{ prompt: '', expected: '', hint: '', failure: '' }];
  }
  const steps = [];
  const seen = new Set();
  let nodeId = scenario.startingNodeId;
  while (nodeId && nodeId !== 'n_end' && nodeId !== '__exit__' && !seen.has(nodeId)) {
    seen.add(nodeId);
    const node = scenario.nodes[nodeId];
    if (!node) break;
    const action = (node.actions || []).find(item => item.radioCall);
    if (!action?.radioCall) break;
    steps.push({
      prompt: node.narrative || '',
      expected: (action.radioCall.expectedPhrases || []).join(', '),
      hint: action.radioCall.hint || '',
      failure: action.radioCall.feedbackFailure || '',
    });
    nodeId = action.radioCall.onSuccess;
  }
  return steps.length ? steps : [{ prompt: '', expected: '', hint: '', failure: '' }];
}

function scenarioToAdminRecord(scenario, prefix = 'standard') {
  const category = scenario.community?.category || 'sonstige';
  const id = `${prefix}_${scenario.id}`;
  const next = syncScenarioMeta({
    ...scenario,
    id,
    community: {
      authorName: scenario.community?.authorName || 'Admin',
      source: 'license',
      status: 'local',
      createdAt: scenario.community?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...scenario.community,
      category,
    },
  }, {
    scenarioId: id,
    title: scenario.title,
    description: scenario.description || '',
    category,
    playerRole: scenario.playerRole || 'gruppenführer_a',
  });
  return {
    scenarioId: id,
    title: next.title,
    description: next.description || '',
    category,
    playerRole: next.playerRole,
    scenarioJson: JSON.stringify(next, null, 2),
  };
}

function parseFormMulti(body) {
  const p = new URLSearchParams(body);
  const o = {};
  for (const [k, v] of p) {
    if (Object.prototype.hasOwnProperty.call(o, k)) {
      o[k] = Array.isArray(o[k]) ? [...o[k], v] : [o[k], v];
    } else {
      o[k] = v;
    }
  }
  return o;
}

function parseIdList(value) {
  const values = Array.isArray(value) ? value : [value].filter(Boolean);
  return values.map(v => Number(v)).filter(Number.isFinite);
}

function formArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function normalizeScenarioForm(body) {
  let scenario = body.useStepEditor === 'true' ? buildScenarioFromStepFields(body) : null;
  if (!scenario) scenario = body.useQuickSteps === 'true' ? buildScenarioFromQuickSteps(body) : null;
  if (!scenario) {
    try {
      scenario = JSON.parse(String(body.scenarioJson || ''));
    } catch {
      throw new Error('Szenario-JSON ist nicht gültig.');
    }
  }
  if (!scenario || typeof scenario !== 'object') throw new Error('Szenario-JSON muss ein Objekt sein.');
  if (!scenario.id || !scenario.title || !scenario.startingNodeId || !scenario.nodes) {
    throw new Error('Szenario-JSON braucht mindestens id, title, startingNodeId und nodes.');
  }

  const meta = {
    scenarioId: String(body.scenarioId || scenario.id).trim(),
    title: String(body.title || scenario.title).trim(),
    description: String(body.description || scenario.description || '').trim(),
    category: String(body.category || scenario.community?.category || 'sonstige').trim() || 'sonstige',
    playerRole: String(body.playerRole || scenario.playerRole || 'gruppenführer_a').trim() || 'gruppenführer_a',
  };

  scenario = syncScenarioMeta(scenario, meta);

  const wildcardMap = parseRufText(body.wildcards);
  scenario = applyTextMapDeep(scenario, wildcardMap);
  scenario = syncScenarioMeta(scenario, meta);

  return {
    ...meta,
    scenarioJson: JSON.stringify(scenario, null, 2),
    licenseIds: parseIdList(body.licenseIds),
  };
}

function normalizeScenarioPath(value) {
  const clean = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!clean || clean.includes('..') || path.isAbsolute(clean)) return null;
  return clean;
}

async function readScenarioFile(relativePath) {
  const clean = normalizeScenarioPath(relativePath);
  if (!clean) return null;
  const absolute = path.resolve(scenariosDir, clean);
  if (!absolute.startsWith(scenariosDir + path.sep)) return null;
  const raw = await fs.readFile(absolute, 'utf8');
  return JSON.parse(raw);
}

async function listDefaultScenarios() {
  try {
    const raw = await fs.readFile(path.join(scenariosDir, 'index.json'), 'utf8');
    const index = JSON.parse(raw);
    const entries = [];
    for (const [source, groups] of Object.entries(index)) {
      for (const [category, paths] of Object.entries(groups || {})) {
        for (const relativePath of paths || []) {
          try {
            const scenario = await readScenarioFile(relativePath);
            if (scenario) entries.push({ source, category, path: relativePath, scenario });
          } catch {}
        }
      }
    }
    return entries.sort((a, b) => a.scenario.title.localeCompare(b.scenario.title, 'de'));
  } catch {
    return [];
  }
}

async function getScenarioTemplate(templatePath) {
  const scenario = await readScenarioFile(templatePath);
  if (!scenario) return null;
  const category = normalizeScenarioPath(templatePath)?.split('/').at(-2) || scenario.community?.category || 'sonstige';
  return {
    scenario_id: `lizenz_${scenario.id}`,
    title: scenario.title,
    description: scenario.description || '',
    category,
    player_role: scenario.playerRole || 'gruppenführer_a',
    scenario_json: JSON.stringify({
      ...scenario,
      id: `lizenz_${scenario.id}`,
      community: {
        authorName: scenario.community?.authorName || 'FFFunk',
        category,
        source: 'license',
        status: 'local',
        createdAt: scenario.community?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shareId: scenario.community?.shareId,
      },
    }, null, 2),
    assignedLicenseIds: [],
  };
}

async function importDefaultScenarios() {
  const defaults = await listDefaultScenarios();
  let imported = 0;
  for (const entry of defaults) {
    const record = scenarioToAdminRecord({
      ...entry.scenario,
      community: {
        authorName: entry.scenario.community?.authorName || 'FFFunk',
        source: 'license',
        status: 'local',
        createdAt: entry.scenario.community?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...entry.scenario.community,
        category: entry.category,
      },
    }, 'standard');
    await upsertAdminScenario(record);
    imported += 1;
  }
  return imported;
}

async function migrateCommunityScenario(shareId) {
  const row = await getCommunityScenario(shareId);
  if (!row) return null;
  const scenario = JSON.parse(row.scenario_json);
  const record = scenarioToAdminRecord({
    ...scenario,
    community: {
      authorName: row.author_name || scenario.community?.authorName || 'Community',
      source: 'license',
      status: 'local',
      createdAt: scenario.community?.createdAt || row.published_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...scenario.community,
      category: row.category || scenario.community?.category || 'sonstige',
      shareId: row.share_id,
    },
  }, 'community');
  return upsertAdminScenario(record);
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
      <a href="/admin/scenarios" class="${active === 'scenarios' ? 'active' : ''}">Szenarien</a>
      <a href="/admin/taxonomy" class="${active === 'taxonomy' ? 'active' : ''}">Kategorien & Rollen</a>
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
  let totalLicenses = 0, activeLicenses = 0, communityCount = 0, adminScenarioCount = 0;
  try {
    const ls = await listLicenses();
    totalLicenses = ls.length;
    activeLicenses = ls.filter(l => l.active).length;
  } catch {}
  try { communityCount = (await listScenarios()).length; } catch {}
  try { adminScenarioCount = (await listAdminScenarios()).length; } catch {}

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
      <div class="card" style="text-align:center;">
        <div style="font-size:2.5rem;font-weight:700;color:#dc2626;">${adminScenarioCount}</div>
        <div style="color:#a3a3a3;font-size:.8rem;margin-top:.25rem;">Lizenz-Szenarien</div>
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
      <a href="/admin/scenarios" class="btn btn-secondary">Szenarien zuweisen</a>
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

// ── Admin scenario pages ──────────────────────────────────────────────────────

async function adminScenariosPage(flash = '') {
  const scenarios = await listAdminScenarios();
  const defaults = await listDefaultScenarios();

  const rows = scenarios.map(s => {
    const assigned = Array.isArray(s.licenses) ? s.licenses : [];
    return `<tr>
      <td>
        <strong>${esc(s.title)}</strong><br>
        <span style="color:#666;font-size:.8rem;">${esc(s.description)}</span>
      </td>
      <td><span class="code">${esc(s.scenario_id)}</span></td>
      <td><span class="badge warn">${esc(s.category)}</span></td>
      <td style="color:#a3a3a3;">
        ${assigned.length
          ? assigned.map(l => `<div><span class="code">${esc(l.code)}</span> ${esc(l.organization_name)}</div>`).join('')
          : '<span style="color:#666;">Nicht zugewiesen</span>'}
      </td>
      <td>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
          <a href="/admin/scenarios/${s.id}" class="btn btn-secondary btn-sm">Bearbeiten</a>
          <form method="POST" action="/admin/scenarios/${s.id}/delete" style="margin:0;"
                onsubmit="return confirm('Szenario ${esc(s.title)} wirklich löschen?')">
            <button type="submit" class="btn btn-danger btn-sm">Löschen</button>
          </form>
        </div>
      </td>
    </tr>`;
  }).join('');

  const defaultRows = defaults.map(entry => `<tr>
    <td>
      <strong>${esc(entry.scenario.title)}</strong><br>
      <span style="color:#666;font-size:.8rem;">${esc(entry.scenario.description)}</span>
    </td>
    <td><span class="code">${esc(entry.scenario.id)}</span></td>
    <td><span class="badge warn">${esc(entry.category)}</span></td>
    <td><span class="badge ok">${entry.source === 'builtin' ? 'Default' : 'Datei'}</span></td>
    <td>
      <a href="/admin/scenarios/new?template=${encodeURIComponent(entry.path)}" class="btn btn-secondary btn-sm">Als Vorlage bearbeiten</a>
    </td>
  </tr>`).join('');

  return page('Lizenz-Szenarien', `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
      <h2 style="margin:0;">Lizenz-Szenarien</h2>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
        <form method="POST" action="/admin/scenarios/import-defaults" style="margin:0;">
          <button type="submit" class="btn btn-secondary">Default-Szenarien migrieren</button>
        </form>
        <a href="/admin/scenarios/new" class="btn btn-primary">+ Neues Szenario</a>
      </div>
    </div>
    ${flash ? `<div class="flash-ok">${esc(flash)}</div>` : ''}
    ${!isLicenseDbAvailable() ? '<div class="flash-err">Datenbank nicht verfügbar. Bitte DATABASE_URL setzen.</div>' : ''}
    <div class="card" style="margin-bottom:1.5rem;">
      <h3>Default-Szenarien</h3>
      <p style="font-size:.85rem;color:#a3a3a3;margin:0 0 1rem;">
        Diese Szenarien kommen aus <span class="code">public/scenarios</span>. Über „Als Vorlage bearbeiten“ wird eine lizenzgebundene Kopie erstellt, die Sie mit Wildcards und Lizenz-Zuweisungen anpassen können.
      </p>
      ${defaultRows
        ? `<div style="overflow:auto;"><table><thead><tr>
             <th>Titel</th><th>ID</th><th>Kategorie</th><th>Quelle</th><th>Aktion</th>
           </tr></thead><tbody>${defaultRows}</tbody></table></div>`
        : '<p style="color:#a3a3a3;margin:0;">Keine Default-Szenarien gefunden.</p>'}
    </div>
    <h3>Lizenzgebundene Szenarien</h3>
    ${scenarios.length === 0
      ? '<div class="card" style="text-align:center;color:#a3a3a3;padding:3rem;">Noch keine Lizenz-Szenarien erstellt.</div>'
      : `<div class="card" style="padding:0;overflow:auto;">
           <table><thead><tr>
             <th>Titel</th><th>ID</th><th>Kategorie</th><th>Zugewiesen an</th><th>Aktionen</th>
           </tr></thead><tbody>${rows}</tbody></table>
         </div>`}
  `, 'scenarios');
}

async function adminScenarioFormPage(s = null, err = '') {
  const isEdit = s?.id != null;
  const licenses = await listLicenses();
  const categories = await listTaxonomy('category');
  const roles = await listTaxonomy('role');
  const assigned = new Set((s?.assignedLicenseIds || []).map(Number));
  const v = (f, fb = '') => esc(s?.[f] ?? fb);
  const json = esc(s?.scenario_json || `{
  "id": "neues_szenario",
  "title": "Neues Szenario",
  "description": "Kurze Beschreibung",
  "startingNodeId": "n_start",
  "playerRole": "gruppenführer_a",
  "nodes": {
    "n_start": {
      "id": "n_start",
      "role": "gruppenführer_a",
      "narrative": "Ausgangslage beschreiben.",
      "actions": [
        { "id": "finish", "label": "Abschließen", "nextNodeId": "n_end" }
      ]
    },
    "n_end": {
      "id": "n_end",
      "role": "gruppenführer_a",
      "narrative": "Übung abgeschlossen.",
      "actions": [
        { "id": "exit", "label": "Zur Übersicht", "nextNodeId": "__exit__" }
      ]
    }
  }
}`);
  let quickSteps = '';
  try { quickSteps = scenarioToQuickSteps(JSON.parse(s?.scenario_json || 'null')); } catch {}
  let stepEditorSteps = [{ prompt: '', expected: '', hint: '', failure: '' }];
  try { stepEditorSteps = scenarioToStepEditorSteps(JSON.parse(s?.scenario_json || 'null')); } catch {}
  const licenseChecks = licenses.map(l => `
    <label style="display:flex;align-items:center;gap:.5rem;margin:.35rem 0;color:#e5e5e5;">
      <input type="checkbox" name="licenseIds" value="${l.id}" ${assigned.has(Number(l.id)) ? 'checked' : ''} style="width:auto;">
      <span><span class="code">${esc(l.code)}</span> ${esc(l.organization_name)}</span>
    </label>
  `).join('');
  const stepCards = stepEditorSteps.map((step, index) => `
    <div class="step-card" style="border:1px solid #333;background:#111;border-radius:.5rem;padding:1rem;margin-bottom:1rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;margin-bottom:.75rem;">
        <strong>Schritt <span class="step-number">${index + 1}</span></strong>
        <button type="button" class="btn btn-danger btn-sm" onclick="removeStepCard(this)">Löschen</button>
      </div>
      <label>Ansage / Lage</label>
      <textarea name="stepPrompt" rows="4">${esc(step.prompt)}</textarea>
      <label>Erwartete Schlüsselbegriffe</label>
      <textarea name="stepExpected" rows="2" placeholder="z.B. verstanden, Status 3">${esc(step.expected)}</textarea>
      <label>Beispiel-Funkspruch</label>
      <input name="stepHint" value="${esc(step.hint)}">
      <label>Feedback bei falscher Meldung</label>
      <input name="stepFailure" value="${esc(step.failure)}">
    </div>
  `).join('');

  return page(isEdit ? 'Szenario bearbeiten' : 'Neues Szenario', `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
      <a href="/admin/scenarios" class="btn btn-secondary btn-sm">← Zurück</a>
      <h2 style="margin:0;">${isEdit ? 'Szenario bearbeiten' : 'Szenario erstellen'}</h2>
    </div>
    ${err ? `<div class="flash-err">${esc(err)}</div>` : ''}
    <form method="POST" action="${isEdit ? `/admin/scenarios/${s.id}/update` : '/admin/scenarios/create'}">
      <div style="display:grid;gap:1.5rem;">
        <div class="card">
          <h3>Metadaten</h3>
          <div class="grid2">
            <div>
              <label>Szenario-ID *</label>
              <input name="scenarioId" value="${v('scenario_id')}" required>
            </div>
            <div>
              <label>Titel *</label>
              <input name="title" value="${v('title')}" required>
            </div>
            <div class="full">
              <label>Beschreibung</label>
              <textarea name="description" rows="2">${v('description')}</textarea>
            </div>
            <div>
              <label>Kategorie</label>
              <select name="category">
                ${categories.map(c => `<option value="${esc(c.value)}" ${(s?.category || 'sonstige') === c.value ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label>Rolle</label>
              <select name="playerRole">
                ${roles.map(r => `<option value="${esc(r.value)}" ${(s?.player_role || 'gruppenführer_a') === r.value ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="card">
          <h3>Funk-Schritte</h3>
          <p style="font-size:.8rem;color:#a3a3a3;margin:0 0 .75rem;">
            Ähnlich wie im App-Editor: pro Funk-Schritt Ansage, erwartete Begriffe, Beispiel-Funkspruch und Fehler-Feedback pflegen.
          </p>
          <label style="display:flex;align-items:center;gap:.5rem;margin:.5rem 0 1rem;color:#e5e5e5;">
            <input type="checkbox" name="useStepEditor" value="true" style="width:auto;">
            <span>Diese Funk-Schritte beim Speichern als Szenario verwenden</span>
          </label>
          <div id="step-editor">${stepCards}</div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="addStepCard()">+ Schritt hinzufügen</button>
          <details style="margin-top:1rem;">
            <summary style="cursor:pointer;color:#a3a3a3;">Altes Zeilenformat anzeigen</summary>
            <p style="font-size:.8rem;color:#a3a3a3;">Eine Zeile pro Schritt: Ansage | Erwartete Begriffe | Beispiel-Funkspruch | Fehler-Feedback</p>
            <label style="display:flex;align-items:center;gap:.5rem;margin:.5rem 0;color:#e5e5e5;">
              <input type="checkbox" name="useQuickSteps" value="true" style="width:auto;">
              <span>Zeilenformat verwenden</span>
            </label>
            <textarea name="quickSteps" rows="6" class="mono">${esc(quickSteps)}</textarea>
          </details>
        </div>
        <div class="card">
          <h3>Zuweisung</h3>
          ${licenses.length ? licenseChecks : '<p style="color:#a3a3a3;margin:0;">Noch keine Lizenzen vorhanden.</p>'}
        </div>
        <div class="card">
          <h3>Wildcards / Text-Ersetzungen</h3>
          <p style="font-size:.8rem;color:#a3a3a3;margin:0 0 .75rem;">
            Optional. Eine Ersetzung pro Zeile: <code style="background:#0a0a0a;padding:.1rem .35rem;border-radius:.25rem;">Suchtext=Ersetzung</code>.
            Beim Speichern werden diese Texte im kompletten Szenario-JSON ersetzt. Das ist praktisch für Orte, Leitstellen und Rufnamen.
          </p>
          <textarea name="wildcards" rows="7" class="mono" placeholder="Florian Kirchberg 44/1=Florian Musterstadt 1/40/1&#10;Kirchberg=Musterstadt&#10;Leitstelle=ILS München">${isEdit ? '' : esc(defaultWildcardText())}</textarea>
        </div>
        <div class="card">
          <h3>Szenario-JSON</h3>
          <textarea name="scenarioJson" rows="24" class="mono" required>${json}</textarea>
        </div>
        <div style="display:flex;gap:.75rem;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Änderungen speichern' : 'Szenario erstellen'}</button>
          <a href="/admin/scenarios" class="btn btn-secondary">Abbrechen</a>
        </div>
      </div>
    </form>
    <script>
      function renumberSteps() {
        document.querySelectorAll('.step-card .step-number').forEach((el, index) => { el.textContent = String(index + 1); });
      }
      function removeStepCard(button) {
        const cards = document.querySelectorAll('.step-card');
        if (cards.length <= 1) return;
        button.closest('.step-card').remove();
        renumberSteps();
      }
      function addStepCard() {
        const editor = document.getElementById('step-editor');
        const template = document.createElement('div');
        template.className = 'step-card';
        template.style.cssText = 'border:1px solid #333;background:#111;border-radius:.5rem;padding:1rem;margin-bottom:1rem;';
        template.innerHTML = \`
          <div style="display:flex;justify-content:space-between;align-items:center;gap:.75rem;margin-bottom:.75rem;">
            <strong>Schritt <span class="step-number"></span></strong>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeStepCard(this)">Löschen</button>
          </div>
          <label>Ansage / Lage</label>
          <textarea name="stepPrompt" rows="4"></textarea>
          <label>Erwartete Schlüsselbegriffe</label>
          <textarea name="stepExpected" rows="2" placeholder="z.B. verstanden, Status 3"></textarea>
          <label>Beispiel-Funkspruch</label>
          <input name="stepHint">
          <label>Feedback bei falscher Meldung</label>
          <input name="stepFailure">
        \`;
        editor.appendChild(template);
        renumberSteps();
      }
      renumberSteps();
    </script>
  `, 'scenarios');
}

// ── Taxonomy pages ────────────────────────────────────────────────────────────

function taxonomyKindLabel(kind) {
  return kind === 'role' ? 'Rolle' : 'Kategorie';
}

function taxonomyKindPlural(kind) {
  return kind === 'role' ? 'Rollen' : 'Kategorien';
}

function normalizeTaxonomyBody(body) {
  const kind = body.kind === 'role' ? 'role' : 'category';
  const value = String(body.value || '').trim();
  const label = String(body.label || value).trim();
  if (!value) throw new Error('Technischer Wert ist ein Pflichtfeld.');
  if (!label) throw new Error('Anzeigename ist ein Pflichtfeld.');
  return {
    kind,
    value,
    label,
    sortOrder: Number(body.sortOrder) || 0,
  };
}

async function taxonomyPage(flash = '', err = '') {
  const [categories, roles] = await Promise.all([listTaxonomy('category'), listTaxonomy('role')]);

  const renderTable = (kind, items) => {
    const otherOptions = item => items
      .filter(candidate => candidate.value !== item.value)
      .map(candidate => `<option value="${esc(candidate.value)}">${esc(candidate.label)} (${esc(candidate.value)})</option>`)
      .join('');

    const rows = items.map(item => `<tr>
      <td><strong>${esc(item.label)}</strong></td>
      <td><span class="code">${esc(item.value)}</span></td>
      <td style="color:#a3a3a3;">${Number(item.sort_order) || 0}</td>
      <td>
        <form method="POST" action="/admin/taxonomy/${item.id}/update" style="display:grid;grid-template-columns:1fr 1fr 90px auto;gap:.5rem;align-items:end;margin:0 0 .75rem;">
          <input type="hidden" name="kind" value="${kind}">
          <div>
            <label>Wert</label>
            <input name="value" value="${esc(item.value)}" required>
          </div>
          <div>
            <label>Name</label>
            <input name="label" value="${esc(item.label)}" required>
          </div>
          <div>
            <label>Sort.</label>
            <input name="sortOrder" type="number" value="${Number(item.sort_order) || 0}">
          </div>
          <button type="submit" class="btn btn-secondary btn-sm">Speichern</button>
        </form>
        <form method="POST" action="/admin/taxonomy/${item.id}/delete" style="display:flex;gap:.5rem;align-items:end;flex-wrap:wrap;margin:0;"
              onsubmit="return confirm('${taxonomyKindLabel(kind)} ${esc(item.label)} löschen und bestehende Szenarien migrieren?')">
          <input type="hidden" name="kind" value="${kind}">
          <div style="min-width:220px;">
            <label>Beim Löschen migrieren nach</label>
            <select name="replacementValue" required>
              <option value="">Ziel wählen...</option>
              ${otherOptions(item)}
            </select>
          </div>
          <button type="submit" class="btn btn-danger btn-sm">Löschen & migrieren</button>
        </form>
      </td>
    </tr>`).join('');

    return `<div class="card" style="padding:0;overflow:auto;margin-bottom:1.5rem;">
      <table><thead><tr><th>Name</th><th>Wert</th><th>Sortierung</th><th>Aktionen</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  };

  const createForm = kind => `<form method="POST" action="/admin/taxonomy/create" class="card" style="margin-bottom:1.5rem;">
    <input type="hidden" name="kind" value="${kind}">
    <h3>${taxonomyKindLabel(kind)} hinzufügen</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr 110px auto;gap:1rem;align-items:end;">
      <div>
        <label>Technischer Wert</label>
        <input name="value" required placeholder="${kind === 'role' ? 'maschinist' : 'gefahrgut'}">
      </div>
      <div>
        <label>Anzeigename</label>
        <input name="label" required placeholder="${kind === 'role' ? 'Maschinist' : 'Gefahrgut'}">
      </div>
      <div>
        <label>Sortierung</label>
        <input name="sortOrder" type="number" value="100">
      </div>
      <button type="submit" class="btn btn-primary">Hinzufügen</button>
    </div>
  </form>`;

  return page('Kategorien & Rollen', `
    <h2>Kategorien & Rollen</h2>
    ${flash ? `<div class="flash-ok">${esc(flash)}</div>` : ''}
    ${err ? `<div class="flash-err">${esc(err)}</div>` : ''}
    ${!isLicenseDbAvailable() ? '<div class="flash-err">Datenbank nicht verfügbar. Änderungen können erst mit DATABASE_URL gespeichert werden.</div>' : ''}
    <p style="color:#a3a3a3;margin-top:-.75rem;margin-bottom:1.5rem;">
      Werte werden im Szenario-Editor verwendet. Wenn ein Wert geändert oder gelöscht wird, werden bestehende lizenzgebundene Szenarien inklusive gespeichertem JSON migriert.
    </p>
    <h3>Kategorien</h3>
    ${createForm('category')}
    ${renderTable('category', categories)}
    <h3>Rollen</h3>
    ${createForm('role')}
    ${renderTable('role', roles)}
  `, 'taxonomy');
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
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
        <a href="/admin/community/${esc(s.share_id)}" class="btn btn-secondary btn-sm">Ansehen</a>
        <form method="POST" action="/admin/community/${esc(s.share_id)}/migrate" style="margin:0;">
          <button type="submit" class="btn btn-primary btn-sm">In Standards übernehmen</button>
        </form>
        <form method="POST" action="/admin/community/${esc(s.share_id)}/delete" style="margin:0;"
              onsubmit="return confirm('Szenario wirklich löschen?')">
          <button type="submit" class="btn btn-danger btn-sm">Löschen</button>
        </form>
      </div>
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

async function communityScenarioPage(shareId, flash = '') {
  const row = await getCommunityScenario(shareId);
  if (!row) return page('Nicht gefunden', '<p style="color:#a3a3a3;">Community-Szenario nicht gefunden.</p>', 'community');
  let scenario = null;
  try { scenario = JSON.parse(row.scenario_json); } catch {}
  const steps = scenarioToStepEditorSteps(scenario);
  const stepRows = steps.map((step, index) => `<tr>
    <td>${index + 1}</td>
    <td>${esc(step.prompt)}</td>
    <td>${esc(step.expected)}</td>
    <td>${esc(step.hint)}</td>
  </tr>`).join('');

  return page(row.title, `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
      <a href="/admin/community" class="btn btn-secondary btn-sm">← Zurück</a>
      <h2 style="margin:0;">${esc(row.title)}</h2>
    </div>
    ${flash ? `<div class="flash-ok">${esc(flash)}</div>` : ''}
    <div class="card" style="margin-bottom:1.5rem;">
      <h3>Metadaten</h3>
      <table style="width:auto;">
        <tr><td style="color:#a3a3a3;padding:.35rem 1rem .35rem 0;">Share-ID</td><td><span class="code">${esc(row.share_id)}</span></td></tr>
        <tr><td style="color:#a3a3a3;padding:.35rem 1rem .35rem 0;">Autor</td><td>${esc(row.author_name)}</td></tr>
        <tr><td style="color:#a3a3a3;padding:.35rem 1rem .35rem 0;">Kategorie</td><td><span class="badge warn">${esc(row.category)}</span></td></tr>
        <tr><td style="color:#a3a3a3;padding:.35rem 1rem .35rem 0;">Danke</td><td>${Number(row.thank_count) || 0}</td></tr>
      </table>
      <p style="color:#a3a3a3;">${esc(row.description)}</p>
      <form method="POST" action="/admin/community/${esc(row.share_id)}/migrate" style="margin:1rem 0 0;">
        <button type="submit" class="btn btn-primary">In Standards übernehmen</button>
      </form>
    </div>
    <div class="card" style="padding:0;overflow:auto;margin-bottom:1.5rem;">
      <table><thead><tr><th>#</th><th>Ansage</th><th>Erwartet</th><th>Beispiel</th></tr></thead><tbody>${stepRows}</tbody></table>
    </div>
    <details class="card">
      <summary style="cursor:pointer;font-weight:600;">JSON anzeigen</summary>
      <pre class="mono" style="white-space:pre-wrap;overflow:auto;">${esc(JSON.stringify(scenario, null, 2))}</pre>
    </details>
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

  if (p === '/admin/scenarios' && m === 'GET')
    return sendHtml(res, 200, await adminScenariosPage(url.searchParams.get('msg') || ''));

  if (p === '/admin/scenarios/import-defaults' && m === 'POST') {
    try {
      const count = await importDefaultScenarios();
      return redirect(res, `/admin/scenarios?msg=${encodeURIComponent(count + ' Default-Szenarien migriert')}`);
    } catch (e) {
      return sendHtml(res, 200, await adminScenariosPage(e.message));
    }
  }

  if (p === '/admin/scenarios/new' && m === 'GET') {
    const template = url.searchParams.get('template');
    const scenario = template ? await getScenarioTemplate(template) : null;
    if (template && !scenario) {
      return sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Vorlage nicht gefunden.</p>'));
    }
    return sendHtml(res, 200, await adminScenarioFormPage(scenario));
  }

  if (p === '/admin/scenarios/create' && m === 'POST') {
    const body = parseFormMulti(await readBody(req));
    try {
      const data = normalizeScenarioForm(body);
      const created = await createAdminScenario(data);
      await setScenarioLicenses(created.id, data.licenseIds);
      return redirect(res, '/admin/scenarios?msg=Szenario+erstellt');
    } catch (e) {
      return sendHtml(res, 200, await adminScenarioFormPage(null, e.message));
    }
  }

  const scenarioEditM = p.match(/^\/admin\/scenarios\/(\d+)$/);
  if (scenarioEditM && m === 'GET') {
    const scenario = await getAdminScenario(scenarioEditM[1]);
    if (!scenario) return sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Szenario nicht gefunden.</p>'));
    return sendHtml(res, 200, await adminScenarioFormPage(scenario));
  }

  const scenarioUpdateM = p.match(/^\/admin\/scenarios\/(\d+)\/update$/);
  if (scenarioUpdateM && m === 'POST') {
    const body = parseFormMulti(await readBody(req));
    const existing = await getAdminScenario(scenarioUpdateM[1]);
    try {
      const data = normalizeScenarioForm(body);
      await updateAdminScenario(scenarioUpdateM[1], data);
      await setScenarioLicenses(scenarioUpdateM[1], data.licenseIds);
      return redirect(res, '/admin/scenarios?msg=Szenario+gespeichert');
    } catch (e) {
      return sendHtml(res, 200, await adminScenarioFormPage(existing, e.message));
    }
  }

  const scenarioDeleteM = p.match(/^\/admin\/scenarios\/(\d+)\/delete$/);
  if (scenarioDeleteM && m === 'POST') {
    await deleteAdminScenario(scenarioDeleteM[1]);
    return redirect(res, '/admin/scenarios?msg=Szenario+gelöscht');
  }

  if (p === '/admin/taxonomy' && m === 'GET')
    return sendHtml(res, 200, await taxonomyPage(url.searchParams.get('msg') || '', url.searchParams.get('err') || ''));

  if (p === '/admin/taxonomy/create' && m === 'POST') {
    const body = parseForm(await readBody(req));
    try {
      const data = normalizeTaxonomyBody(body);
      await createTaxonomyItem(data);
      return redirect(res, `/admin/taxonomy?msg=${encodeURIComponent(taxonomyKindLabel(data.kind) + ' hinzugefügt')}`);
    } catch (e) {
      return sendHtml(res, 200, await taxonomyPage('', e.message));
    }
  }

  const taxonomyUpdateM = p.match(/^\/admin\/taxonomy\/(\d+)\/update$/);
  if (taxonomyUpdateM && m === 'POST') {
    const body = parseForm(await readBody(req));
    try {
      const data = normalizeTaxonomyBody(body);
      await updateTaxonomyItem(taxonomyUpdateM[1], data);
      return redirect(res, `/admin/taxonomy?msg=${encodeURIComponent(taxonomyKindLabel(data.kind) + ' gespeichert')}`);
    } catch (e) {
      return sendHtml(res, 200, await taxonomyPage('', e.message));
    }
  }

  const taxonomyDeleteM = p.match(/^\/admin\/taxonomy\/(\d+)\/delete$/);
  if (taxonomyDeleteM && m === 'POST') {
    const body = parseForm(await readBody(req));
    const item = await getTaxonomyItem(taxonomyDeleteM[1]);
    try {
      await deleteTaxonomyItem(taxonomyDeleteM[1], body.replacementValue);
      return redirect(res, `/admin/taxonomy?msg=${encodeURIComponent((item ? taxonomyKindLabel(item.kind) : 'Wert') + ' gelöscht und migriert')}`);
    } catch (e) {
      return sendHtml(res, 200, await taxonomyPage('', e.message));
    }
  }

  if (p === '/admin/community' && m === 'GET')
    return sendHtml(res, 200, await communityPage(url.searchParams.get('msg') || ''));

  const comViewM = p.match(/^\/admin\/community\/([^/]+)$/);
  if (comViewM && m === 'GET') {
    return sendHtml(res, 200, await communityScenarioPage(comViewM[1]));
  }

  const comMigrateM = p.match(/^\/admin\/community\/([^/]+)\/migrate$/);
  if (comMigrateM && m === 'POST') {
    const migrated = await migrateCommunityScenario(comMigrateM[1]);
    if (!migrated) return sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Community-Szenario nicht gefunden.</p>'));
    return redirect(res, `/admin/scenarios?msg=${encodeURIComponent('Community-Szenario übernommen: ' + migrated.title)}`);
  }

  const comDelM = p.match(/^\/admin\/community\/([^/]+)\/delete$/);
  if (comDelM && m === 'POST') {
    try { await deleteScenario(comDelM[1]); } catch {}
    return redirect(res, '/admin/community?msg=Szenario+gelöscht');
  }

  sendHtml(res, 404, page('Nicht gefunden', '<p style="color:#a3a3a3;">Seite nicht gefunden.</p>'));
}
