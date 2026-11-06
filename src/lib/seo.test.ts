// Auffindbarkeit: Metadaten, strukturierte Daten, robots.txt und Sitemap.
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error – reines JS-Modul aus scripts/, läuft nach dem Vite-Build
import { generateSeoPages } from '../../scripts/seo-pages.mjs';
import { lernChapters } from './lern-content';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const SITE = 'https://fffunk.prelldynamics.de';
const html = read('index.html');
const meta = (attr: string, key: string) =>
  html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1] ?? '';

describe('index.html', () => {
  it('hat einen Titel mit den Suchbegriffen, nicht zu lang', () => {
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    expect(title).toMatch(/Sprechfunk/);
    expect(title).toMatch(/Feuerwehr/);
    expect(title.length).toBeLessThanOrEqual(65);
  });

  it('hat eine Beschreibung von 120 bis 160 Zeichen', () => {
    const d = meta('name', 'description');
    expect(d.length).toBeGreaterThanOrEqual(120);
    expect(d.length).toBeLessThanOrEqual(160);
  });

  it('nennt die kanonische Adresse und Vorschau-Daten für soziale Netze', () => {
    expect(html).toContain(`<link rel="canonical" href="${SITE}/" />`);
    expect(meta('property', 'og:title')).not.toBe('');
    expect(meta('property', 'og:description')).not.toBe('');
    expect(meta('property', 'og:url')).toBe(`${SITE}/`);
    expect(meta('property', 'og:locale')).toBe('de_DE');
    expect(meta('name', 'twitter:card')).toBe('summary_large_image');
    const image = meta('property', 'og:image');
    expect(image.startsWith(`${SITE}/`)).toBe(true);
    expect(existsSync(new URL(`../../public/${image.slice(SITE.length + 1)}`, import.meta.url))).toBe(true);
  });

  it('beschreibt die App als strukturierte Daten (JSON-LD)', () => {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const app = blocks.flatMap(b => b['@graph'] ?? [b]).find(b => b['@type'] === 'WebApplication');
    expect(app).toMatchObject({ name: 'FFFunk', url: `${SITE}/`, inLanguage: 'de', isAccessibleForFree: true });
    const faq = blocks.flatMap(b => b['@graph'] ?? [b]).find(b => b['@type'] === 'FAQPage');
    expect(faq.mainEntity.length).toBeGreaterThanOrEqual(3);
  });

  it('verlinkt die Lern- und Szenarioseiten auch nach dem Start der App (Fußzeile außerhalb von #root)', () => {
    const footer = html.match(/<footer id="site-links"[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(html.indexOf('<footer id="site-links"')).toBeGreaterThan(html.indexOf('<div id="root">'));
    for (const href of ['/lernen', '/szenarien', '/lernen/fms-status', '/lernen/mayday']) expect(footer).toContain(`href="${href}"`);
  });

  it('hat lesbaren Inhalt ohne JavaScript im Startelement', () => {
    const root = html.match(/<div id="root">([\s\S]*?)<\/main>\s*<\/div>/)?.[1] ?? '';
    expect(root).toMatch(/<h1[^>]*>[^<]*Sprechfunk/);
    for (const w of ['Feuerwehr', 'THW', 'Rettungsdienst', 'Wasserrettung', 'Katastrophenschutz', 'Digitalfunk'])
      expect(root, w).toContain(w);
  });
});

describe('robots.txt und Sitemap', () => {
  it('erlaubt die Seite, sperrt Admin und API und verweist auf die Sitemap', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Disallow: \/admin$/m);
    expect(robots).toMatch(/^Disallow: \/api\/$/m);
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });

  it('die Admin-Seiten sind auf noindex gesetzt', () => {
    expect(read('scripts/admin-api.mjs').match(/<meta name="robots" content="noindex, nofollow">/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe('statische Seiten (scripts/seo-pages.mjs)', async () => {
  const out = mkdtempSync(path.join(tmpdir(), 'fffunk-seo-'));
  const urls: string[] = await generateSeoPages({ outDir: out, scenariosDir: fileURLToPath(new URL('../../public/scenarios', import.meta.url)), today: '2026-11-06' });
  const fileFor = (u: string) => path.join(out, u === '/' ? 'index.html' : `${u.slice(1)}.html`);
  const pages = urls.filter(u => u !== '/' && u !== '/messe');
  const get = (u: string) => readFileSync(fileFor(u), 'utf8');

  it('erzeugt eine Seite je Lernkapitel, die Übersichten und die Sitemap', () => {
    for (const c of lernChapters) expect(urls).toContain(`/lernen/${c.id}`);
    expect(urls).toEqual(expect.arrayContaining(['/', '/lernen', '/szenarien', '/messe']));
    const sitemap = readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
    for (const u of urls) expect(sitemap).toContain(`<loc>${SITE}${u}</loc>`);
    expect(sitemap).toContain('<lastmod>2026-11-06</lastmod>');
  });

  it('jede Seite hat eigenen Titel (≤ 65 Zeichen), Beschreibung (120–160), Canonical und eine h1', () => {
    const titles = new Set<string>();
    for (const u of pages) {
      const html = get(u);
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
      expect(title.length, `${u}: ${title}`).toBeLessThanOrEqual(65);
      expect(desc.length, `${u}: ${desc}`).toBeGreaterThanOrEqual(120);
      expect(desc.length, `${u}: ${desc}`).toBeLessThanOrEqual(160);
      expect(html).toContain(`<link rel="canonical" href="${SITE}${u}" />`);
      expect(html.match(/<h1>/g)?.length, u).toBe(1);
      expect(titles.has(title), `doppelter Titel ${title}`).toBe(false);
      titles.add(title);
    }
  });

  it('Kapitelseiten enthalten den ganzen Lerntext als HTML, ohne doppelte Überschrift', () => {
    const html = get('/lernen/fms-status');
    expect(html).toContain('<table>');
    expect(html).toContain('Statustabelle');
    expect(html).not.toMatch(/<h3>FMS-Statuskatalog 0-9<\/h3>/);
    expect(get('/lernen/funkrufnamen')).toContain('Florian Neuhaus 42/1');
  });

  it('strukturierte Daten sind gültiges JSON mit Brotkrumen', () => {
    for (const u of pages) {
      const blocks = [...get(u).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
      expect(blocks.some(b => b['@type'] === 'BreadcrumbList'), u).toBe(true);
    }
  });

  it('alle internen Links führen zu einer erzeugten Seite oder in die App', () => {
    const known = new Set([...urls, '/#scenarios']);
    for (const u of [...pages, '/404']) {
      const html = readFileSync(u === '/404' ? path.join(out, '404.html') : fileFor(u), 'utf8');
      for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
        if (href === '/icon.svg') continue;
        expect(known.has(href), `${u} → ${href}`).toBe(true);
      }
    }
  });

  it('die 404-Seite ist nicht indexierbar', () => {
    const html = readFileSync(path.join(out, '404.html'), 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).not.toContain('rel="canonical"');
  });

  it('Szenario-Übersicht nennt alle eingebauten Szenarien', () => {
    const html = get('/szenarien');
    for (const t of ['Alarmierung und Ausrücken', 'Person im Wasser', 'Hochwasser']) expect(html).toContain(t);
  });
});
