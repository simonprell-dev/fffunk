// Welche Datei der Server für eine Adresse ausliefert – mit echten 404 statt immer der Startseite.
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error – reines JS-Modul aus scripts/, vom Server genutzt
import { resolveStatic } from '../../scripts/static-route.mjs';

const dist = path.resolve('/app/dist');
const files = new Set(['index.html', '404.html', 'lernen.html', 'lernen/mayday.html', 'messe/index.html', 'assets/index-abc.js']
  .map(f => path.join(dist, f)));
const isFile = (p: string) => files.has(p);
const route = (url: string) => resolveStatic(url, dist, isFile);

describe('resolveStatic', () => {
  it('liefert die Startseite für /', () => {
    expect(route('/')).toEqual({ status: 200, file: path.join(dist, 'index.html') });
    expect(route('/?compact=1')).toEqual({ status: 200, file: path.join(dist, 'index.html') });
  });

  it('liefert vorhandene Dateien', () => {
    expect(route('/assets/index-abc.js')).toEqual({ status: 200, file: path.join(dist, 'assets/index-abc.js') });
  });

  it('liefert Seiten ohne .html in der Adresse', () => {
    expect(route('/lernen')).toEqual({ status: 200, file: path.join(dist, 'lernen.html') });
    expect(route('/lernen/mayday')).toEqual({ status: 200, file: path.join(dist, 'lernen/mayday.html') });
  });

  it('liefert die index.html eines Verzeichnisses', () => {
    expect(route('/messe')).toEqual({ status: 200, file: path.join(dist, 'messe/index.html') });
  });

  it('leitet Adressen mit Schrägstrich am Ende auf die kanonische Form um', () => {
    expect(route('/lernen/')).toEqual({ status: 301, location: '/lernen' });
    expect(route('/messe/?x=1')).toEqual({ status: 301, location: '/messe?x=1' });
  });

  it('antwortet auf unbekannte Adressen mit 404 statt mit der Startseite', () => {
    expect(route('/gibtsnicht')).toEqual({ status: 404, file: path.join(dist, '404.html') });
    expect(route('/bild.png')).toEqual({ status: 404, file: path.join(dist, '404.html') });
  });

  it('bleibt im Auslieferungsordner', () => {
    expect(route('/../../etc/passwd').status).toBe(404);
    expect(route('/%2e%2e/%2e%2e/etc/passwd').status).toBe(404);
  });

  it('übersteht kaputt kodierte Adressen', () => {
    expect(route('/%E0%A4%A').status).toBe(404);
  });
});
