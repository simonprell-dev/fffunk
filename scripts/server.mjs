import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleCommunityPrRequest, logPrConfig } from './community-pr-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': contentType });
  res.end(text);
}

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const requested = path.join(dist, normalized === '/' ? 'index.html' : normalized);
  const resolved = path.resolve(requested);
  return resolved.startsWith(dist) ? resolved : path.join(dist, 'index.html');
}

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/community-pr')) {
    await handleCommunityPrRequest(req, res);
    return;
  }

  const requested = safeFilePath(req.url || '/');
  const file = fs.existsSync(requested) && fs.statSync(requested).isFile()
    ? requested
    : path.join(dist, 'index.html');

  fs.readFile(file, (error, content) => {
    if (error) {
      sendText(res, 500, 'Server error');
      return;
    }

    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`FFFunk listening on http://localhost:${PORT}`);
  logPrConfig();
});
