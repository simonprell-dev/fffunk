import http from 'node:http';
import { handleCommunityPrRequest, logPrConfig, sendJson } from './community-pr-api.mjs';

const PORT = Number(process.env.FFFUNK_PR_SERVER_PORT || 5174);

const server = http.createServer(async (req, res) => {
  if (req.url !== '/api/community-pr') {
    sendJson(res, 404, { ok: false, error: 'Not found' });
    return;
  }

  await handleCommunityPrRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`FFFunk community PR server listening on http://localhost:${PORT}`);
  logPrConfig();
});
