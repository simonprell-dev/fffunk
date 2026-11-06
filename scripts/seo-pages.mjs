// Statische Seiten für Suchmaschinen: Lernkapitel, Szenario-Übersicht, 404 und Sitemap.
// Die App selbst navigiert per # – solche Adressen indexiert keine Suchmaschine als eigene Seite.
// Läuft nach `vite build` (npm run build) und schreibt nach dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadTs } from './load-ts.mjs';

export { SITE } from './static-route.mjs';
import { SITE } from './static-route.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Suchtitel und Beschreibung je Kapitel – so, wie Leute danach suchen. */
const KAPITEL_META = {
  grundlagen: {
    title: 'BOS-Digitalfunk Grundlagen: TMO, DMO, Sprechgruppen',
    description: 'Grundlagen des BOS-Digitalfunks einfach erklärt: Netz- und Direktbetrieb (TMO/DMO), Sprechgruppen statt Kanälen, Sprechtaste und OPTA.',
  },
  sprechfunkverkehr: {
    title: 'Sprechfunk-Regeln: Ablauf und Betriebsworte',
    description: 'Wie läuft ein Funkgespräch im BOS-Sprechfunk ab? Grundregeln, Anruf mit „von“ und „kommen“, die wichtigsten Betriebsworte und ein ganzes Beispiel.',
  },
  buchstabieralphabet: {
    title: 'Deutsches Buchstabieralphabet & Zahlen im Funk',
    description: 'Das deutsche Buchstabieralphabet für den BOS-Funk von Anton bis Zeppelin, dazu Zahlen und Ziffern richtig sprechen: „zwo“ statt „zwei“.',
  },
  'fms-status': {
    title: 'FMS-Status 0–9: Statuskatalog für die Feuerwehr',
    description: 'Alle FMS-Status von 0 bis 9 auf einen Blick: was Status 1, 2, 3, 4, 5 und 6 bedeuten, wann du welchen drückst und wie es im Einsatz abläuft.',
  },
  funkrufnamen: {
    title: 'Funkrufnamen der Feuerwehr: Aufbau erklärt',
    description: 'So ist ein Funkrufname aufgebaut: Florian + Ort + Kennung. Was Fahrzeugtyp und laufende Nummer bedeuten und wie man Rufnamen im Funk spricht.',
  },
  lagemeldung: {
    title: 'Lagemeldung im Funk: Schema und Beispiel',
    description: 'Die Lagemeldung Schritt für Schritt: was hineingehört, in welcher Reihenfolge, ein vollständiges Beispiel und wie du weitere Kräfte nachforderst.',
  },
  mayday: {
    title: 'Mayday-Notruf: Wortlaut nach FwDV 7 und Ablauf',
    description: 'Mayday richtig absetzen: wann ein Notfall vorliegt, der verbindliche Wortlaut nach FwDV 7 und der Ablauf Schritt für Schritt – für Atemschutz und Trupp.',
  },
  funkdisziplin: {
    title: 'Funkdisziplin: Regeln und typische Fehler',
    description: 'Funkdisziplin im BOS-Sprechfunk: Grundregeln, Umgang mit der Sprechtaste, Sprechpausen und die typischen Anfängerfehler, die du vermeiden solltest.',
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ldJson = data => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const STYLE = `
:root{color-scheme:dark;--bg:#0a0a0a;--card:#141414;--line:#2a2a2a;--text:#e5e5e5;--muted:#a3a3a3;--accent:#ef4444;--link:#93c5fd}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--link)}header,main,footer{max-width:46rem;margin:0 auto;padding:0 16px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:16px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.logo{display:flex;align-items:center;gap:8px;color:var(--text);text-decoration:none;font-weight:700}
.logo span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:6px;background:var(--accent);color:#fff}
nav.top a{color:var(--muted);text-decoration:none;margin-left:14px}nav.top a:hover{color:var(--text)}
.crumbs{font-size:14px;color:var(--muted);margin:20px 0 0}.crumbs a{color:var(--muted)}
h1{font-size:1.9rem;line-height:1.25;margin:.4em 0 .6em}h2,h3{line-height:1.3;margin-top:1.6em}
blockquote{margin:1em 0;padding:.6em 1em;border-left:3px solid var(--accent);background:var(--card)}
pre{background:var(--card);padding:12px;border-radius:6px;overflow-x:auto}code{font-size:.92em}
table{border-collapse:collapse;width:100%;margin:1em 0;font-size:15px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}th{background:var(--card)}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0;padding:16px;border:1px solid #7f1d1d;border-radius:8px;background:#1c0f0f}
.cta p{margin:0;flex:1 1 16rem}.btn{display:inline-block;padding:10px 16px;border-radius:6px;background:var(--accent);color:#fff;text-decoration:none;font-weight:600}
.grid{list-style:none;padding:0;display:grid;gap:10px}.grid li{border:1px solid var(--line);border-radius:8px;padding:12px 14px;background:var(--card)}
.grid a{font-weight:600;text-decoration:none}.grid p{margin:4px 0 0;color:var(--muted);font-size:15px}
footer{margin-top:40px;padding-top:16px;padding-bottom:32px;border-top:1px solid var(--line);color:var(--muted);font-size:14px}
footer ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px 16px}`;

function page({ urlPath, title, description, h1, crumbs, body, ld = [], noindex = false }) {
  const url = `${SITE}${urlPath}`;
  const breadcrumb = crumbs.length > 1 ? [{
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: `${SITE}${c.path}` })),
  }] : [];
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
${noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`}
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<meta name="theme-color" content="#0a0a0a" />
<meta property="og:type" content="article" />
<meta property="og:locale" content="de_DE" />
<meta property="og:site_name" content="FFFunk" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<style>${STYLE}</style>
${[...ld, ...breadcrumb].map(ldJson).join('\n')}
</head>
<body>
<header><a class="logo" href="/"><span>F</span>FFunk</a><nav class="top"><a href="/lernen">Lernen</a><a href="/szenarien">Szenarien</a><a href="/">Trainer</a></nav></header>
<main>
${crumbs.length > 1 ? `<p class="crumbs">${crumbs.map((c, i) => i < crumbs.length - 1 ? `<a href="${c.path}">${esc(c.name)}</a>` : esc(c.name)).join(' › ')}</p>` : ''}
<h1>${esc(h1)}</h1>
${body}
</main>
<footer>
<ul>${CHAPTER_LINKS}</ul>
<p>FFFunk – kostenloser Sprechfunk-Trainer für Feuerwehr, THW, Rettungsdienst, Wasserrettung und Katastrophenschutz. Übungsinhalte ersetzen keine Ausbildung nach FwDV 2 und den Vorgaben eurer Leitstelle.</p>
</footer>
</body>
</html>
`;
}

let CHAPTER_LINKS = '';

const cta = text => `<div class="cta"><p>${text}</p><a class="btn" href="/#scenarios">Jetzt im Trainer üben</a></div>`;

function markdownHtml(md) {
  return renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, md));
}

/** Szenarien aus dem Index (eingebaute), gruppiert nach Ordner. */
function loadScenarios(scenariosDir) {
  const index = JSON.parse(fs.readFileSync(path.join(scenariosDir, 'index.json'), 'utf8'));
  return Object.entries(index.builtin ?? {}).map(([folder, files]) => ({
    folder,
    scenarios: files.map(f => {
      const s = JSON.parse(fs.readFileSync(path.join(scenariosDir, f), 'utf8'));
      return { id: s.id, title: s.title, description: s.description ?? '' };
    }),
  }));
}

/**
 * Schreibt alle Seiten nach outDir und gibt die Liste der indexierbaren Adressen zurück.
 * @param {{ outDir: string, scenariosDir: string, today?: string }} opts
 */
export async function generateSeoPages({ outDir, scenariosDir, today = new Date().toISOString().slice(0, 10) }) {
  const { lernChapters } = await loadTs(path.join(root, 'src/lib/lern-content.ts'));
  const { getCategoryLabel } = await loadTs(path.join(root, 'src/lib/community-scenarios.ts'));
  const write = (rel, html) => {
    const file = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  };
  const urls = ['/'];
  const lernenCrumb = [{ name: 'Start', path: '/' }, { name: 'Lernen', path: '/lernen' }];

  CHAPTER_LINKS = lernChapters.map(c => `<li><a href="/lernen/${c.id}">${esc(c.title)}</a></li>`).join('');

  // Kapitel
  for (const c of lernChapters) {
    const meta = KAPITEL_META[c.id];
    if (!meta) throw new Error(`Suchtitel/Beschreibung fehlt für Kapitel „${c.id}“ (KAPITEL_META)`);
    const urlPath = `/lernen/${c.id}`;
    // Die erste Überschrift wiederholt oft den Kapiteltitel – die Seite hat schon ihre h1.
    const md = c.body.replace(/^#{1,3} (.+)\n+/, (m, h) => (h.trim() === c.title.trim() ? '' : m));
    const i = lernChapters.indexOf(c);
    const next = lernChapters[i + 1];
    const body = markdownHtml(md)
      + cta('Lesen ist gut, Sprechen ist besser: Im Trainer hörst du die Lage, drückst die Sprechtaste und die Spracherkennung prüft deinen Funkspruch.')
      + (next ? `<p>Weiter: <a href="/lernen/${next.id}">${esc(next.title)}</a></p>` : '');
    write(`lernen/${c.id}.html`, page({
      urlPath, title: `${meta.title} | FFFunk`, description: meta.description, h1: c.title,
      crumbs: [...lernenCrumb, { name: c.title, path: urlPath }], body,
      ld: [{
        '@context': 'https://schema.org', '@type': 'LearningResource', name: c.title, headline: meta.title,
        description: meta.description, inLanguage: 'de', url: `${SITE}${urlPath}`, isAccessibleForFree: true,
        learningResourceType: 'Lerntext', educationalLevel: 'Einsteiger',
        audience: { '@type': 'Audience', audienceType: 'Einsatzkräfte von Feuerwehr, THW, Rettungsdienst und Katastrophenschutz' },
        isPartOf: { '@type': 'WebSite', name: 'FFFunk', url: `${SITE}/` },
      }],
    }));
    urls.push(urlPath);
  }

  // Lernen-Übersicht
  write('lernen.html', page({
    urlPath: '/lernen', title: 'BOS-Sprechfunk lernen: alle Themen | FFFunk',
    description: 'Sprechfunk für Feuerwehr und BOS lernen: Digitalfunk-Grundlagen, Funkregeln, Buchstabieralphabet, FMS-Status, Funkrufnamen, Lagemeldung und Mayday.',
    h1: 'BOS-Sprechfunk lernen', crumbs: lernenCrumb,
    body: `<p>Acht Kapitel mit allem, was du für den Funk im Einsatz brauchst – kurz erklärt, mit Beispielen aus dem Einsatzalltag. Danach übst du im Trainer mit echter Sprechtaste.</p>
<ul class="grid">${lernChapters.map(c => `<li><a href="/lernen/${c.id}">${esc(c.title)}</a><p>${esc(KAPITEL_META[c.id].description)}</p></li>`).join('')}</ul>`
      + cta('Bereit für den Ernstfall? Starte mit der Grundausbildung – ohne Vorwissen, Kapitel für Kapitel.'),
  }));
  urls.push('/lernen');

  // Szenario-Übersicht
  const groups = loadScenarios(scenariosDir)
    .map(g => ({ ...g, label: getCategoryLabel(g.folder) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
  const count = groups.reduce((n, g) => n + g.scenarios.length, 0);
  write('szenarien.html', page({
    urlPath: '/szenarien', title: `${count} Funk-Übungsszenarien für BOS-Einsatzkräfte | FFFunk`,
    description: `${count} Übungsszenarien für den Sprechfunk: Brand, THL, Mayday, MANV, THW, Rettungsdienst, Wasserrettung und Katastrophenschutz – mit Spracherkennung.`,
    h1: 'Übungsszenarien für den Sprechfunk', crumbs: [{ name: 'Start', path: '/' }, { name: 'Szenarien', path: '/szenarien' }],
    body: `<p>Jedes Szenario spielt einen Einsatz durch: Du hörst die Lage, entscheidest und sprichst den Funkspruch selbst. Die Spracherkennung prüft Reihenfolge und Inhalt.</p>`
      + groups.map(g => `<h2>${esc(g.label)}</h2><ul class="grid">${g.scenarios.map(s => `<li><strong>${esc(s.title)}</strong>${s.description ? `<p>${esc(s.description)}</p>` : ''}</li>`).join('')}</ul>`).join('')
      + cta('Alle Szenarien sind kostenlos und laufen im Browser, als Android-App und direkt am Funkgerät.'),
    ld: [{
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Übungsszenarien für den Sprechfunk', numberOfItems: count,
      itemListElement: groups.flatMap(g => g.scenarios).map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title })),
    }],
  }));
  urls.push('/szenarien');
  urls.push('/messe');

  // 404 – mit Wegweisern, nicht indexierbar
  write('404.html', page({
    urlPath: '/404', title: 'Seite nicht gefunden | FFFunk', description: 'Diese Seite gibt es nicht (mehr).', noindex: true,
    h1: 'Seite nicht gefunden', crumbs: [],
    body: '<p>Diese Adresse gibt es nicht. Hier geht es weiter:</p><ul><li><a href="/">Zum Sprechfunk-Trainer</a></li><li><a href="/lernen">Sprechfunk lernen</a></li><li><a href="/szenarien">Alle Übungsszenarien</a></li></ul>',
  }));

  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
  return urls;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const urls = await generateSeoPages({ outDir: path.join(root, 'dist'), scenariosDir: path.join(root, 'public/scenarios') });
  console.log(`SEO-Seiten: ${urls.length} Adressen in der Sitemap`);
}
