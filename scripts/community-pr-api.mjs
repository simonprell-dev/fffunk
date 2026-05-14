const OWNER = process.env.GITHUB_OWNER || 'simonprell-dev';
const REPO = process.env.GITHUB_REPO || 'fffunk';
const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || process.env.GH_TOKEN;
const TOKEN_ENV_NAME = process.env.GITHUB_TOKEN ? 'GITHUB_TOKEN' : process.env.GITHUB_PAT ? 'GITHUB_PAT' : process.env.GH_TOKEN ? 'GH_TOKEN' : null;

export function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function encodeBase64(value) {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function github(path, options = {}) {
  if (!TOKEN) {
    throw new Error('Kein GitHub Token gesetzt. Erwartet wird GITHUB_TOKEN, GITHUB_PAT oder GH_TOKEN.');
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || `GitHub API Fehler ${response.status}`);
  }
  return data;
}

function normalizePath(path) {
  return path.replace(/^\/+/, '').replace(/\\/g, '/');
}

export async function createPullRequest({ scenario, suggestedPath, prTitle, prBody }) {
  const safePath = normalizePath(suggestedPath);
  const relativeCommunityPath = safePath.replace(/^public\/scenarios\/community\//, '');
  const category = scenario.community?.category || relativeCommunityPath.split('/')[0] || 'sonstige';
  const branchName = `community/${scenario.id}-${Date.now()}`;

  const baseRef = await github(`/repos/${OWNER}/${REPO}/git/ref/heads/${BASE_BRANCH}`);
  await github(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseRef.object.sha,
    }),
  });

  await github(`/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(safePath).replaceAll('%2F', '/')}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Add community scenario: ${scenario.title}`,
      content: encodeBase64(`${JSON.stringify(scenario, null, 2)}\n`),
      branch: branchName,
    }),
  });

  const indexPath = 'public/scenarios/index.json';
  const indexFile = await github(`/repos/${OWNER}/${REPO}/contents/${indexPath}?ref=${encodeURIComponent(branchName)}`);
  const index = JSON.parse(Buffer.from(indexFile.content, 'base64').toString('utf8'));
  if (!index.community) index.community = {};
  const entries = Array.isArray(index.community[category]) ? index.community[category] : [];
  const indexedPath = `community/${relativeCommunityPath}`;
  if (!entries.includes(indexedPath)) {
    index.community[category] = [...entries, indexedPath].sort();
  }

  await github(`/repos/${OWNER}/${REPO}/contents/${indexPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Register community scenario: ${scenario.title}`,
      content: encodeBase64(`${JSON.stringify(index, null, 2)}\n`),
      sha: indexFile.sha,
      branch: branchName,
    }),
  });

  return github(`/repos/${OWNER}/${REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: prTitle || `Community-Szenario: ${scenario.title}`,
      head: branchName,
      base: BASE_BRANCH,
      body: prBody || `Automatisch erstellter Community-Szenario-PR.\n\nDatei: ${safePath}`,
    }),
  });
}

export async function handleCommunityPrRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.method === 'GET' && req.url?.startsWith('/api/community-pr/health')) {
    sendJson(res, 200, {
      ok: true,
      tokenConfigured: Boolean(TOKEN),
      tokenEnvName: TOKEN_ENV_NAME,
      owner: OWNER,
      repo: REPO,
      baseBranch: BASE_BRANCH,
    });
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return true;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const pr = await createPullRequest(payload);
    sendJson(res, 200, { ok: true, url: pr.html_url, number: pr.number });
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  return true;
}

export function logPrConfig() {
  console.log(`Repository: ${OWNER}/${REPO}, base branch: ${BASE_BRANCH}`);
  if (TOKEN) {
    console.log(`GitHub token configured via ${TOKEN_ENV_NAME}`);
  } else {
    console.warn('No GitHub token configured. Set GITHUB_TOKEN, GITHUB_PAT, or GH_TOKEN.');
  }
}
