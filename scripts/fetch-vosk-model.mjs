// Lädt das deutsche Vosk-Modell (Offline-Spracherkennung der Android-App) nach
// android/app/src/main/assets/model-de. Das Modell (~45 MB) ist nicht eingecheckt.
// Aufruf: node scripts/fetch-vosk-model.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const NAME = 'vosk-model-small-de-0.15';
const MODEL_URL = `https://alphacephei.com/vosk/models/${NAME}.zip`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'android/app/src/main/assets/model-de');

if (fs.existsSync(path.join(target, 'uuid'))) {
  console.log('Vosk-Modell bereits vorhanden:', target);
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(root, 'node_modules/.vosk-'));
const zip = path.join(tmp, `${NAME}.zip`);
console.log('Lade', MODEL_URL);
const res = await fetch(MODEL_URL);
if (!res.ok) throw new Error(`Download fehlgeschlagen: ${res.status}`);
fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()));

// ZIP entpacken: bsdtar (Windows: System32/tar.exe, macOS); GNU tar aus Git Bash kann kein ZIP.
const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe') : 'tar';
if (process.platform === 'linux') execFileSync('unzip', ['-q', zip, '-d', tmp]);
else execFileSync(tar, ['-xf', path.basename(zip)], { cwd: tmp });
fs.rmSync(target, { recursive: true, force: true });
fs.renameSync(path.join(tmp, NAME), target);
// StorageService.unpack() erkennt an der uuid, ob das Modell neu entpackt werden muss.
fs.writeFileSync(path.join(target, 'uuid'), randomUUID());
fs.rmSync(tmp, { recursive: true, force: true });
console.log('Vosk-Modell bereit:', target);
