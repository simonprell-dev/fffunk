import { isDbAvailable, publishScenario, listScenarios, getScenario, addThank, generateShareId } from './community-db.mjs';

function sendJson(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(body));
}

function rowToEntry(row) {
  return {
    shareId: row.share_id,
    id: row.id,
    title: row.title,
    description: row.description,
    authorName: row.author_name,
    category: row.category,
    thankCount: row.thank_count,
    publishedAt: row.published_at,
    scenario: JSON.parse(row.scenario_json),
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

// Routes:
//   GET  /api/community/scenarios           → list
//   POST /api/community/scenarios           → publish
//   GET  /api/community/scenarios/:shareId  → single
//   POST /api/community/scenarios/:shareId/thank

export async function handleCommunityApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return true;
  }

  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.replace(/^\/api\/community\/scenarios\/?/, '').split('/').filter(Boolean);
  // parts = []              → list / publish
  // parts = [shareId]       → single
  // parts = [shareId, thank] → thank

  if (!url.pathname.startsWith('/api/community/scenarios')) return false;

  if (!isDbAvailable()) {
    sendJson(res, 503, { error: 'Community-Datenbank nicht konfiguriert. DATABASE_URL fehlt.' });
    return true;
  }

  try {
    // GET /api/community/scenarios
    if (req.method === 'GET' && parts.length === 0) {
      const rows = await listScenarios();
      sendJson(res, 200, rows.map(rowToEntry));
      return true;
    }

    // POST /api/community/scenarios
    if (req.method === 'POST' && parts.length === 0) {
      const body = await readBody(req);
      const scenario = body.scenario;
      if (!scenario?.id || !scenario?.title) {
        sendJson(res, 400, { error: 'Szenario unvollständig (id und title erforderlich).' });
        return true;
      }

      const shareId = generateShareId();
      await publishScenario({
        shareId,
        id: scenario.id,
        title: scenario.title,
        description: scenario.description || '',
        authorName: scenario.community?.authorName || 'Anonym',
        category: scenario.community?.category || 'sonstige',
        scenarioJson: JSON.stringify(scenario),
      });

      sendJson(res, 200, { ok: true, shareId });
      return true;
    }

    // GET /api/community/scenarios/:shareId
    if (req.method === 'GET' && parts.length === 1) {
      const row = await getScenario(parts[0]);
      if (!row) { sendJson(res, 404, { error: 'Nicht gefunden.' }); return true; }
      sendJson(res, 200, rowToEntry(row));
      return true;
    }

    // POST /api/community/scenarios/:shareId/thank
    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'thank') {
      const thankCount = await addThank(parts[0]);
      sendJson(res, 200, { ok: true, thankCount });
      return true;
    }

    sendJson(res, 404, { error: 'Nicht gefunden.' });
  } catch (err) {
    console.error('Community API Fehler:', err);
    sendJson(res, 500, { error: err.message });
  }

  return true;
}
