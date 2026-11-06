// Welche Datei der Server für eine Adresse ausliefert.
// Unbekannte Adressen bekommen eine echte 404 – sonst hält die Suchmaschine jede Tippfehler-Adresse
// für eine Kopie der Startseite. Die App selbst navigiert per #, braucht also keine Pfad-Fallbacks.
import path from 'node:path';

export const SITE = 'https://fffunk.prelldynamics.de';

/**
 * Seitenaufrufe über die Railway-Adresse → eigene Domain (sonst sieht die Suchmaschine zwei Kopien).
 * API und Admin bleiben erreichbar: Installierte Apps und Formulare nutzen noch die alte Adresse.
 * @returns {string | null} Ziel der Umleitung
 */
export function canonicalRedirect(host, method, url) {
  if (!host || !/\.up\.railway\.app(:\d+)?$/i.test(host)) return null;
  if (method !== 'GET' && method !== 'HEAD') return null;
  if (url.startsWith('/api/') || url === '/admin' || url.startsWith('/admin/') || url.startsWith('/admin?')) return null;
  return SITE + url;
}

/**
 * @param {string} url  Adresse samt Query, z. B. „/lernen/mayday?x=1“
 * @param {string} dist Auslieferungsordner (absolut)
 * @param {(file: string) => boolean} isFile
 * @returns {{ status: 200 | 404, file: string } | { status: 301, location: string }}
 */
export function resolveStatic(url, dist, isFile) {
  const [rawPath, ...q] = url.split('?');
  const query = q.length ? `?${q.join('?')}` : '';
  const notFound = { status: 404, file: path.join(dist, '404.html') };

  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { return notFound; }
  if (decoded.length > 1 && decoded.endsWith('/')) return { status: 301, location: rawPath.replace(/\/+$/, '') + query };

  const file = path.resolve(dist, '.' + path.posix.normalize(decoded.replace(/\\/g, '/')));
  if (file !== dist && !file.startsWith(dist + path.sep)) return notFound;

  for (const candidate of [file === dist ? path.join(dist, 'index.html') : file, `${file}.html`, path.join(file, 'index.html')]) {
    if (isFile(candidate)) return { status: 200, file: candidate };
  }
  return notFound;
}
