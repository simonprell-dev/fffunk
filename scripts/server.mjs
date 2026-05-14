import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { handleCommunityPrRequest, logPrConfig } from './community-pr-api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT || 3000);

// Piper TTS config — paths are baked into the Docker image, not user-configurable
const PIPER_DIR = process.env.PIPER_DIR || '/opt/piper';
const PIPER_BIN = path.join(PIPER_DIR, 'piper');
const PIPER_MODEL = process.env.PIPER_MODEL || '/app/voices/de_DE-thorsten-medium.onnx';
const PIPER_SAMPLE_RATE = 22050; // thorsten-medium
const PIPER_AVAILABLE = fs.existsSync(PIPER_BIN) && fs.existsSync(PIPER_MODEL);

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

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const requested = path.join(dist, normalized === '/' ? 'index.html' : normalized);
  const resolved = path.resolve(requested);
  return resolved.startsWith(dist) ? resolved : path.join(dist, 'index.html');
}

// Add a WAV header to raw 16-bit signed little-endian PCM from Piper
function addWavHeader(pcm, sampleRate = PIPER_SAMPLE_RATE, channels = 1, bitsPerSample = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);  // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function runPiper(text) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PIPER_BIN, ['--model', PIPER_MODEL, '--output-raw'], {
      env: {
        ...process.env,
        LD_LIBRARY_PATH: PIPER_DIR,
        ESPEAK_DATA_PATH: path.join(PIPER_DIR, 'espeak-ng-data'),
      },
    });

    const chunks = [];
    proc.stdout.on('data', chunk => chunks.push(chunk));
    proc.stderr.on('data', () => {}); // Piper writes progress to stderr — suppress it

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Piper timeout'));
    }, 30_000);

    proc.on('error', err => { clearTimeout(timeout); reject(err); });
    proc.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) { reject(new Error(`Piper exit ${code}`)); return; }
      resolve(addWavHeader(Buffer.concat(chunks)));
    });

    proc.stdin.write(text, 'utf8');
    proc.stdin.end();
  });
}

async function handleTtsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  if (!PIPER_AVAILABLE) {
    sendJson(res, 503, { error: 'TTS not available' });
    return;
  }

  let text;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    text = String(body.text ?? '').trim().slice(0, 500);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }

  if (!text) {
    res.writeHead(400);
    res.end();
    return;
  }

  try {
    const wav = await runPiper(text);
    res.writeHead(200, {
      'content-type': 'audio/wav',
      'content-length': String(wav.length),
      'cache-control': 'no-store',
    });
    res.end(wav);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/tts')) {
    await handleTtsRequest(req, res);
    return;
  }

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
      res.writeHead(500);
      res.end('Server error');
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`FFFunk listening on http://localhost:${PORT}`);
  console.log(`Piper TTS: ${PIPER_AVAILABLE ? `${PIPER_BIN} + ${PIPER_MODEL}` : 'not available (fallback: browser TTS)'}`);
  logPrConfig();
});
