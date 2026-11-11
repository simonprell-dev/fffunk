// Aus einem Gruppenszenario und der Teilnehmerzahl wird ein Übungsplan: wer sitzt wo, wer funkt wann.
import type { Abschnitt, Gespraech, GruppenSzenario, PlanFunk, PlanSlot, PlanThread, UebungsPlan } from '../types/gruppe';
import { applyRufnamen } from './rufnamen';
import { phraseMatches } from './speech-match';

export const MIN_TEILNEHMER = 2;
export const MAX_TEILNEHMER = 20;
export const ROLLEN_JE_ABSCHNITT = 4;
export const ABSCHNITTE_JE_SZENARIO = 5;

/** Teilt n Personen in Abschnitte mit zwei bis vier Personen, möglichst gleich groß: 7 → [4, 3]. */
export function teileAuf(n: number): number[] {
  if (!Number.isInteger(n) || n < MIN_TEILNEHMER || n > MAX_TEILNEHMER) throw new Error(`Teilnehmerzahl ${n} liegt nicht zwischen ${MIN_TEILNEHMER} und ${MAX_TEILNEHMER}.`);
  const k = Math.ceil(n / ROLLEN_JE_ABSCHNITT);
  const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}

/** Gespräche, an denen bei `besetzt` Personen mindestens ein Mensch beteiligt ist. */
export function gespraecheFuer(a: Abschnitt, besetzt: number): Gespraech[] {
  const menschen = new Set(a.rollen.slice(0, besetzt).map(r => r.id));
  return a.gespraeche.filter(g => menschen.has(g.von) || menschen.has(g.an));
}

function satz(text: string, schluss: 'kommen' | 'Ende'): string {
  return `${text.trim().replace(/[\s.,;–-]+$/, '')}, ${schluss}.`;
}

function mapDeep<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === 'string') return fn(value) as unknown as T;
  if (Array.isArray(value)) return value.map(v => mapDeep(v, fn)) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' || k === 'von' || k === 'an' || k === 'org' || k === 'kanal' ? v : mapDeep(v, fn)])) as T;
  }
  return value;
}

export interface PlanOptionen {
  /** Welcher Abschnitt zuerst besetzt wird (0–4) – so sehen kleine Gruppen auch die anderen Abschnitte. */
  versatz?: number;
  /** Eigene Rufnamen der Organisation (Wehr-Code). */
  rufnamen?: Record<string, string>;
}

export function bauePlan(szenario: GruppenSzenario, n: number, { versatz = 0, rufnamen }: PlanOptionen = {}): UebungsPlan {
  const sz = rufnamen && Object.keys(rufnamen).length ? mapDeep(szenario, s => applyRufnamen(s, rufnamen)) : szenario;
  const groessen = teileAuf(n);
  const slots: PlanSlot[] = [];
  const threads: PlanThread[] = [];

  groessen.forEach((besetzt, i) => {
    const a = sz.abschnitte[(versatz + i) % sz.abschnitte.length];
    const slotVon = new Map<string, number>();
    a.rollen.slice(0, besetzt).forEach(r => {
      slotVon.set(r.id, slots.length);
      slots.push({ id: slots.length, abschnitt: a.name, rolle: r.name, rufname: r.rufname, auftrag: r.auftrag, gruppe: a.gruppe });
    });
    const ruf = (id: string) => a.rollen.find(r => r.id === id)?.rufname ?? sz.stationen[id]?.rufname ?? id;
    const funk: PlanFunk[] = [];
    for (const g of gespraecheFuer(a, besetzt)) {
      const gruppe = g.kanal === 'fuehrung' ? sz.fuehrungsgruppe : a.gruppe;
      const von = { slot: slotVon.get(g.von) ?? null, ruf: ruf(g.von) };
      const an = { slot: slotVon.get(g.an) ?? null, ruf: ruf(g.an) };
      const hin = { slot: von.slot, sprecher: von.ruf, an: an.ruf, anSlot: an.slot, gruppe };
      const her = { slot: an.slot, sprecher: an.ruf, an: von.ruf, anSlot: von.slot, gruppe };
      if (g.notruf) {
        funk.push({ ...hin, art: 'notruf', text: satz(g.meldung, 'kommen'), kern: [...g.kern, 'kommen'], lage: g.lage });
      } else {
        funk.push({ ...hin, art: 'anruf', text: `${an.ruf} von ${von.ruf}, kommen.`, kern: [an.ruf, von.ruf, 'kommen'], lage: g.lage });
        funk.push({ ...her, art: 'antwort', text: `Hier ${an.ruf}, kommen.`, kern: [an.ruf, 'kommen'] });
        funk.push({ ...hin, art: 'meldung', text: satz(g.meldung, 'kommen'), kern: [...g.kern, 'kommen'], lage: g.lage });
      }
      funk.push({ ...her, art: 'quittung', text: satz(g.antwort, 'Ende'), kern: [...g.antwortKern, 'Ende'] });
    }
    threads.push({ name: a.name, gruppe: a.gruppe, funk });
  });

  const gruppen = [...new Set([sz.fuehrungsgruppe, ...sz.abschnitte.map(a => a.gruppe)])];
  return { szenarioId: sz.id, org: sz.org, titel: sz.titel, lage: sz.lage, gruppen, slots, threads };
}

/** Längste Folge von Funksprüchen eines Abschnitts, in der eine besetzte Position nichts sagt. */
export function laengstePause(thread: PlanThread, slot: number): number {
  let max = 0, lauf = 0;
  for (const f of thread.funk) {
    if (f.slot === slot) { max = Math.max(max, lauf); lauf = 0; } else lauf++;
  }
  return Math.max(max, lauf);
}

// ── Prüfung der Szenariodaten ─────────────────────────────────────────────────────────────

const MIN_GESPRAECHE = 8;
/** So viele Gespräche müssen übrig bleiben, wenn nur zwei Positionen besetzt sind. */
const MIN_GESPRAECHE_ZU_ZWEIT = 6;
/** Mehr Gespräche in Folge darf keine besetzte Position aussetzen. */
const MAX_AUSSETZEN = 2;

/** Liefert alle Verstöße eines Szenarios gegen die Regeln für Gruppenübungen (leer = in Ordnung). */
export function pruefeSzenario(sz: GruppenSzenario): string[] {
  const fehler: string[] = [];
  const f = (wo: string, was: string) => fehler.push(`${sz.id} › ${wo}: ${was}`);

  if (sz.abschnitte.length !== ABSCHNITTE_JE_SZENARIO) f('Szenario', `braucht genau ${ABSCHNITTE_JE_SZENARIO} Abschnitte, hat ${sz.abschnitte.length}`);
  if (!sz.lage.trim() || !sz.titel.trim() || !sz.beschreibung.trim()) f('Szenario', 'Titel, Beschreibung und Lage dürfen nicht leer sein');
  const gruppen = sz.abschnitte.map(a => a.gruppe);
  if (new Set([...gruppen, sz.fuehrungsgruppe]).size !== gruppen.length + 1) f('Szenario', 'jede Sprechgruppe (auch die Führungsgruppe) darf nur einmal vorkommen');
  if (new Set(sz.abschnitte.map(a => a.id)).size !== sz.abschnitte.length) f('Szenario', 'Abschnitts-IDs müssen eindeutig sein');

  for (const a of sz.abschnitte) {
    const wo = a.name || a.id;
    if (a.rollen.length !== ROLLEN_JE_ABSCHNITT) f(wo, `braucht genau ${ROLLEN_JE_ABSCHNITT} Rollen`);
    const ids = a.rollen.map(r => r.id);
    if (new Set(ids).size !== ids.length) f(wo, 'Rollen-IDs müssen eindeutig sein');
    const rufe = [...a.rollen.map(r => r.rufname), ...Object.values(sz.stationen).map(s => s.rufname)];
    if (new Set(rufe.map(r => r.toLowerCase())).size !== rufe.length) f(wo, 'Rufnamen (Rollen und Stationen) müssen eindeutig sein');
    for (const id of ids) if (sz.stationen[id]) f(wo, `Rollen-ID „${id}“ ist schon eine Station`);
    for (const r of a.rollen) if (!r.name.trim() || !r.rufname.trim() || !r.auftrag.trim()) f(wo, `Rolle „${r.id}“ ist unvollständig`);
    if (a.gespraeche.length < MIN_GESPRAECHE) f(wo, `braucht mindestens ${MIN_GESPRAECHE} Gespräche, hat ${a.gespraeche.length}`);

    a.gespraeche.forEach((g, i) => {
      const nr = `${wo} › Gespräch ${i + 1}`;
      for (const id of [g.von, g.an]) if (!ids.includes(id) && !sz.stationen[id]) f(nr, `unbekannte Stelle „${id}“`);
      if (g.von === g.an) f(nr, 'von und an sind gleich');
      if (!ids.includes(g.von) && !ids.includes(g.an)) f(nr, 'mindestens eine Seite muss eine Rolle des Abschnitts sein');
      if (g.notruf && !ids.includes(g.von)) f(nr, 'ein Notruf muss von einer Rolle des Abschnitts kommen');
      if (/\b(kommen|ende)\W*$/i.test(g.meldung)) f(nr, 'meldung ohne „kommen“/„Ende“ am Schluss schreiben');
      if (/\b(kommen|ende)\W*$/i.test(g.antwort)) f(nr, 'antwort ohne „kommen“/„Ende“ am Schluss schreiben');
      if (g.meldung.length > 240) f(nr, `meldung ist zu lang (${g.meldung.length} Zeichen, höchstens 240)`);
      if (g.antwort.length > 160) f(nr, `antwort ist zu lang (${g.antwort.length} Zeichen, höchstens 160)`);
      if (g.kern.length < 2 || g.kern.length > 5) f(nr, 'kern braucht 2 bis 5 Begriffe');
      if (g.antwortKern.length < 1 || g.antwortKern.length > 3) f(nr, 'antwortKern braucht 1 bis 3 Begriffe');
      for (const k of g.kern) if (!phraseMatches(g.meldung, k)) f(nr, `Kernbegriff „${k}“ steht nicht in der meldung`);
      for (const k of g.antwortKern) if (!phraseMatches(g.antwort, k)) f(nr, `Kernbegriff „${k}“ steht nicht in der antwort`);
    });

    for (const besetzt of [2, 3, 4]) {
      const menschen = ids.slice(0, besetzt);
      const rest = gespraecheFuer(a, besetzt);
      if (besetzt === 2 && rest.length < MIN_GESPRAECHE_ZU_ZWEIT) f(wo, `zu zweit bleiben nur ${rest.length} Gespräche (mindestens ${MIN_GESPRAECHE_ZU_ZWEIT}) – die ersten beiden Rollen öfter beteiligen`);
      for (const id of menschen) {
        let lauf = 0, max = 0;
        for (const g of rest) {
          if (g.von === id || g.an === id) lauf = 0; else max = Math.max(max, ++lauf);
        }
        if (max > MAX_AUSSETZEN) f(wo, `Rolle „${id}“ setzt bei ${besetzt} Personen ${max} Gespräche in Folge aus (höchstens ${MAX_AUSSETZEN})`);
      }
    }
  }
  return fehler;
}
