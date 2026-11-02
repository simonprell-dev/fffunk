// Auffindbarkeit: Metadaten, strukturierte Daten, robots.txt und Sitemap.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const SITE = 'https://fffunk-production.up.railway.app';
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

  it('hat lesbaren Inhalt ohne JavaScript im Startelement', () => {
    const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/)?.[1] ?? '';
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

  it('listet Startseite und Messe-Seite', () => {
    const sitemap = read('public/sitemap.xml');
    expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
    expect(sitemap).toContain(`<loc>${SITE}/messe</loc>`);
  });

  it('die Admin-Seiten sind auf noindex gesetzt', () => {
    expect(read('scripts/admin-api.mjs').match(/<meta name="robots" content="noindex, nofollow">/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
