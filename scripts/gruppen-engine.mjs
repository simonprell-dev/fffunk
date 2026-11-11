// Ablauf einer Gruppenübung – reine Zustandslogik ohne Netzwerk und Datenbank (siehe gruppen-api.mjs).
// Eine Übung besteht aus Abschnitten (Threads), die gleichzeitig laufen. In jedem Abschnitt ist immer genau
// ein Funkspruch an der Reihe: Ein Mensch spricht ihn und meldet das Ergebnis, oder der Computer spielt ihn ab.
import { randomBytes, randomInt } from 'node:crypto';

/** So lange bleibt eine Übung (und ihr virtuelles Funkgerät) höchstens aktiv. */
export const MAX_DAUER_MS = 6 * 60 * 60 * 1000;
/** Ab dieser Punktzahl gilt ein Funkspruch als gelungen; darunter gibt es einen zweiten Versuch. */
export const BESTANDEN = 60;
const ZWEITER_VERSUCH_FAKTOR = 0.9;

const CODE_ZEICHEN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O/1/I

export function neuerCode(laenge = 6) {
  return Array.from({ length: laenge }, () => CODE_ZEICHEN[randomInt(CODE_ZEICHEN.length)]).join('');
}

const neuesToken = () => randomBytes(9).toString('base64url');

class Fehler extends Error {
  constructor(text) { super(text); this.oeffentlich = true; }
}
const fehler = text => { throw new Fehler(text); };

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const ARTEN = ['anruf', 'antwort', 'meldung', 'quittung', 'notruf'];
const ORGS = ['feuerwehr', 'rettungsdienst', 'thw', 'polizei'];

/** Prüft einen vom Gerät der Übungsleitung gebauten Plan und übernimmt nur bekannte Felder. */
export function pruefePlan(plan) {
  if (!plan || typeof plan !== 'object') fehler('Übungsplan fehlt.');
  const slots = Array.isArray(plan.slots) ? plan.slots : [];
  const threads = Array.isArray(plan.threads) ? plan.threads : [];
  if (slots.length < 2 || slots.length > 20) fehler('Eine Übung braucht 2 bis 20 Positionen.');
  if (threads.length < 1 || threads.length > 5) fehler('Eine Übung braucht 1 bis 5 Abschnitte.');
  const slotOk = v => v === null || (Number.isInteger(v) && v >= 0 && v < slots.length);
  const sauber = {
    szenarioId: text(plan.szenarioId, 80),
    org: ORGS.includes(plan.org) ? plan.org : fehler('Unbekannte Organisation.'),
    titel: text(plan.titel, 120) || fehler('Titel fehlt.'),
    lage: text(plan.lage, 1200),
    gruppen: (Array.isArray(plan.gruppen) ? plan.gruppen : []).slice(0, 12).map(g => text(g, 20)).filter(Boolean),
    slots: slots.map((s, i) => ({
      id: i, abschnitt: text(s?.abschnitt, 80), rolle: text(s?.rolle, 80), rufname: text(s?.rufname, 80),
      auftrag: text(s?.auftrag, 400), gruppe: text(s?.gruppe, 20),
    })),
    threads: threads.map(t => {
      const funk = Array.isArray(t?.funk) ? t.funk : [];
      if (funk.length < 1 || funk.length > 80) fehler('Ein Abschnitt braucht 1 bis 80 Funksprüche.');
      return {
        name: text(t.name, 80), gruppe: text(t.gruppe, 20),
        funk: funk.map(f => {
          if (!slotOk(f?.slot) || !slotOk(f?.anSlot)) fehler('Ungültige Position im Plan.');
          if (!ARTEN.includes(f.art)) fehler('Unbekannte Art von Funkspruch.');
          const kern = (Array.isArray(f.kern) ? f.kern : []).slice(0, 8).map(k => text(k, 80)).filter(Boolean);
          return {
            slot: f.slot, sprecher: text(f.sprecher, 80), an: text(f.an, 80), anSlot: f.anSlot, gruppe: text(f.gruppe, 20),
            art: f.art, text: text(f.text, 400), kern, ...(f.lage ? { lage: text(f.lage, 400) } : {}),
          };
        }),
      };
    }),
  };
  if (new Set(sauber.threads.map(t => t.name)).size !== sauber.threads.length) fehler('Abschnitte müssen verschiedene Namen haben.');
  for (const s of sauber.slots) if (threadVon(sauber, s.id) < 0) fehler(`Position „${s.rolle}“ gehört zu keinem Abschnitt.`);
  return sauber;
}

function threadVon(plan, slotId) {
  const slot = plan.slots[slotId];
  return slot ? plan.threads.findIndex(t => t.name === slot.abschnitt) : -1;
}

export function saubereOptionen(o = {}) {
  return { funk: !!o.funk, anonym: !!o.anonym, muster: o.muster !== false };
}

export function neueUebung({ code, leiterId, plan, optionen, jetzt = Date.now() }) {
  const sauber = pruefePlan(plan);
  return {
    code, leiterId, plan: sauber, optionen: saubereOptionen(optionen),
    erstelltUm: jetzt, endetUm: jetzt + MAX_DAUER_MS, phase: 'lobby', beendetUm: null,
    slots: sauber.slots.map(s => ({ id: s.id, token: neuesToken(), fest: false, tn: null })),
    teilnehmer: {}, // id → { id, geraet, name, kontoId, slot }
    threads: sauber.threads.map(() => ({ pos: 0, seit: 0, versuch: 1, erster: null })),
    ergebnisse: [], // { thread, idx, slot, tn, punkte | null, versuche, text }
    notruf: null,   // { tn, rufname, gruppe }
  };
}

const tnVonGeraet = (u, geraet) => Object.values(u.teilnehmer).find(t => t.geraet === geraet) ?? null;

function setzeAuf(u, tn, slotId) {
  for (const s of u.slots) if (s.tn === tn.id) s.tn = null;
  tn.slot = slotId;
  if (slotId !== null) u.slots[slotId].tn = tn.id;
}

/**
 * Ein Gerät tritt bei. Mit Positions-Link (token) genau auf diese Position, sonst per Zufall auf eine
 * freie Position, die nicht für die Vergabe durch die Übungsleitung reserviert ist. Ist keine frei,
 * wartet die Person, bis ihr die Übungsleitung eine Position gibt.
 */
export function beitreten(u, { geraet, name = '', token = '', kontoId = null, zufall = randomInt }) {
  if (u.phase === 'ende') fehler('Diese Übung ist schon beendet.');
  if (typeof geraet !== 'string' || geraet.length < 8 || geraet.length > 80) fehler('Gerätekennung fehlt.');
  let tn = tnVonGeraet(u, geraet);
  const wunsch = token ? u.slots.find(s => s.token === token) : null;
  if (token && !wunsch) fehler('Dieser Positions-Link gehört nicht zu dieser Übung.');
  if (wunsch && wunsch.tn && wunsch.tn !== tn?.id) fehler('Diese Position ist schon besetzt. Bitte bei der Übungsleitung melden.');

  if (!tn) {
    if (Object.keys(u.teilnehmer).length >= 40) fehler('Die Übung ist voll.');
    tn = { id: neuesToken(), geraet, name: '', kontoId: null, slot: null };
    u.teilnehmer[tn.id] = tn;
  }
  tn.name = text(String(name).trim(), 40) || tn.name || '';
  if (kontoId) tn.kontoId = kontoId;

  if (wunsch) setzeAuf(u, tn, wunsch.id);
  else if (tn.slot === null) {
    const frei = u.slots.filter(s => !s.tn && !s.fest);
    if (frei.length) setzeAuf(u, tn, frei[zufall(frei.length)].id);
  }
  return tn;
}

/** Übungsleitung: Position für die eigene Vergabe reservieren (kein Zufall) oder wieder freigeben. */
export function setzeFest(u, slotId, fest) {
  const s = u.slots[slotId] ?? fehler('Position unbekannt.');
  s.fest = !!fest;
}

/** Übungsleitung: Person auf eine Position setzen (tauscht, falls besetzt) oder in den Warteraum (null). */
export function weiseZu(u, tnId, slotId) {
  const tn = u.teilnehmer[tnId] ?? fehler('Person unbekannt.');
  if (slotId === null) { setzeAuf(u, tn, null); return; }
  const ziel = u.slots[slotId] ?? fehler('Position unbekannt.');
  const anderer = ziel.tn && ziel.tn !== tn.id ? u.teilnehmer[ziel.tn] : null;
  const alt = tn.slot;
  if (anderer) setzeAuf(u, anderer, null);
  setzeAuf(u, tn, slotId);
  if (anderer && alt !== null) setzeAuf(u, anderer, alt);
}

export function entferne(u, tnId) {
  const tn = u.teilnehmer[tnId];
  if (!tn) return;
  setzeAuf(u, tn, null);
  delete u.teilnehmer[tnId];
  if (u.notruf?.tn === tnId) u.notruf = null;
}

export function starte(u, jetzt = Date.now()) {
  if (u.phase !== 'lobby') fehler('Die Übung läuft schon.');
  if (!u.slots.some(s => s.tn)) fehler('Es ist noch niemand auf einer Position.');
  u.phase = 'laeuft';
  for (const t of u.threads) Object.assign(t, { pos: 0, seit: jetzt, versuch: 1, erster: null });
  tick(u, jetzt);
}

export function aktuell(u, thread) {
  return u.phase === 'laeuft' ? u.plan.threads[thread]?.funk[u.threads[thread].pos] ?? null : null;
}

/** So lange „spricht“ der Computer einen Funkspruch. */
export function dauerMs(funk) {
  return Math.max(2500, Math.min(14000, 1800 + 75 * funk.text.length));
}

const sprecherTn = (u, funk) => (funk.slot === null ? null : u.slots[funk.slot].tn);

function weiter(u, thread, jetzt) {
  const t = u.threads[thread];
  Object.assign(t, { pos: t.pos + 1, seit: jetzt, versuch: 1, erster: null });
}

/** Lässt fällige Computer-Funksprüche ablaufen und beendet die Übung, wenn alle Abschnitte fertig sind. */
export function tick(u, jetzt = Date.now()) {
  if (u.phase !== 'laeuft') return false;
  let geaendert = false;
  if (jetzt >= u.endetUm) { beende(u, jetzt); return true; }
  u.threads.forEach((t, i) => {
    for (;;) {
      const funk = aktuell(u, i);
      if (!funk || sprecherTn(u, funk) || jetzt < t.seit + dauerMs(funk)) break;
      weiter(u, i, t.seit + dauerMs(funk));
      geaendert = true;
    }
  });
  if (u.threads.every((t, i) => t.pos >= u.plan.threads[i].funk.length)) { beende(u, jetzt); geaendert = true; }
  return geaendert;
}

export function punkteFuer(treffer, anzahl) {
  if (!anzahl) return 100;
  return Math.round((100 * Math.min(anzahl, treffer)) / anzahl);
}

/**
 * Ein Gerät meldet den eigenen Funkspruch: welche Kernbegriffe erkannt wurden und der erkannte Text.
 * `ohneWertung`: Die Spracherkennung stand nicht zur Verfügung – der Funkspruch zählt nicht in die Punkte.
 * Liefert `nochmal: true`, wenn ein zweiter Versuch fällig ist.
 */
export function melde(u, tnId, { thread, idx, treffer = [], text: erkannt = '', ohneWertung = false }, jetzt = Date.now()) {
  const funk = aktuell(u, thread);
  const t = u.threads[thread];
  if (!funk || t.pos !== idx || sprecherTn(u, funk) !== tnId) fehler('Dieser Funkspruch ist nicht mehr an der Reihe.');
  const anzahl = Array.isArray(treffer) ? treffer.filter(Boolean).length : 0;
  let punkte = ohneWertung ? null : punkteFuer(anzahl, funk.kern.length);
  if (punkte !== null && t.versuch === 1 && punkte < BESTANDEN) {
    t.versuch = 2;
    t.erster = punkte;
    return { nochmal: true, punkte };
  }
  if (punkte !== null && t.versuch === 2) punkte = Math.max(t.erster ?? 0, Math.round(punkte * ZWEITER_VERSUCH_FAKTOR));
  u.ergebnisse.push({ thread, idx, slot: funk.slot, tn: tnId, punkte, versuche: t.versuch, text: text(String(erkannt), 300) });
  weiter(u, thread, jetzt);
  tick(u, jetzt);
  return { nochmal: false, punkte };
}

/** Übungsleitung: hängenden Funkspruch überspringen (zählt nicht in die Punkte). */
export function ueberspringe(u, thread, jetzt = Date.now()) {
  const funk = aktuell(u, thread) ?? fehler('In diesem Abschnitt ist nichts an der Reihe.');
  const tn = sprecherTn(u, funk);
  if (tn) u.ergebnisse.push({ thread, idx: u.threads[thread].pos, slot: funk.slot, tn, punkte: null, versuche: 0, text: '' });
  weiter(u, thread, jetzt);
  tick(u, jetzt);
}

export function beende(u, jetzt = Date.now()) {
  if (u.phase === 'ende') return;
  u.phase = 'ende';
  u.beendetUm = jetzt;
  u.notruf = null;
}

export function setzeNotruf(u, tnId, an) {
  const tn = u.teilnehmer[tnId];
  if (!an) { if (!tnId || u.notruf?.tn === tnId) u.notruf = null; return; }
  if (!tn || tn.slot === null) return;
  const slot = u.plan.slots[tn.slot];
  u.notruf = { tn: tnId, rufname: slot.rufname, gruppe: slot.gruppe };
}

// ── Auswertung ────────────────────────────────────────────────────────────────────────────

const schnitt = werte => (werte.length ? Math.round(werte.reduce((a, b) => a + b, 0) / werte.length) : null);
const gewertet = liste => liste.filter(e => e.punkte !== null).map(e => e.punkte);

export function punkteVon(u, tnId) {
  const meine = u.ergebnisse.filter(e => e.tn === tnId);
  return { punkte: schnitt(gewertet(meine)), funksprueche: meine.filter(e => e.versuche > 0).length };
}

export function auswertung(u) {
  const teilnehmer = Object.values(u.teilnehmer)
    .filter(tn => tn.slot !== null || u.ergebnisse.some(e => e.tn === tn.id))
    .map(tn => ({ slot: tn.slot ?? 99, name: tn.name || 'Ohne Namen', rolle: tn.slot !== null ? u.plan.slots[tn.slot].rolle : '', ...punkteVon(u, tn.id) }));
  if (u.optionen.anonym) {
    // Ohne Namen und ohne Position, nach Punkten sortiert – so lässt sich niemand zuordnen.
    teilnehmer.sort((a, b) => (b.punkte ?? -1) - (a.punkte ?? -1));
    teilnehmer.forEach((t, i) => { t.name = `Person ${i + 1}`; t.rolle = ''; });
  } else teilnehmer.sort((a, b) => a.slot - b.slot);
  return {
    team: schnitt(gewertet(u.ergebnisse)),
    threads: u.plan.threads.map((t, i) => ({ name: t.name, punkte: schnitt(gewertet(u.ergebnisse.filter(e => e.thread === i))) })),
    teilnehmer: teilnehmer.map(({ slot: _slot, ...rest }) => rest),
  };
}

// ── Sicht eines Geräts ────────────────────────────────────────────────────────────────────

function funkSicht(u, thread, idx, { voll }) {
  const funk = u.plan.threads[thread].funk[idx];
  if (!funk) return null;
  const computer = !sprecherTn(u, funk);
  const t = u.threads[thread];
  const laeuft = t.pos === idx;
  return {
    thread, idx, slot: funk.slot, sprecher: funk.sprecher, an: funk.an, anSlot: funk.anSlot, gruppe: funk.gruppe, art: funk.art,
    versuch: laeuft ? t.versuch : 1,
    // Fremde Funksprüche von Menschen hört man über Funk – ihr Text erscheint erst danach.
    ...(voll || computer || !laeuft ? { text: funk.text } : {}),
    ...(voll ? { kern: funk.kern, lage: funk.lage } : {}),
    ...(computer && laeuft ? { bis: t.seit + dauerMs(funk) } : {}),
  };
}

/** Was ein Gerät sehen darf. `tnId` für Teilnehmende, `leiter` für die Übungsleitung. */
export function sicht(u, { tnId = null, leiter = false, online = new Set() } = {}) {
  const tn = tnId ? u.teilnehmer[tnId] : null;
  const meinThread = tn && tn.slot !== null ? threadVon(u.plan, tn.slot) : -1;
  const namenZeigen = leiter && !(u.optionen.anonym && u.phase !== 'lobby');
  const s = {
    code: u.code, phase: u.phase, leiter, titel: u.plan.titel, org: u.plan.org, lage: u.plan.lage,
    optionen: u.optionen, gruppen: u.plan.gruppen, endetUm: u.endetUm,
    slots: u.plan.slots.map((p, i) => {
      const besetzer = u.slots[i].tn ? u.teilnehmer[u.slots[i].tn] : null;
      return {
        ...p, fest: u.slots[i].fest, besetzt: !!besetzer,
        ...(leiter ? { token: u.slots[i].token, tn: besetzer?.id, online: besetzer ? online.has(besetzer.id) : false } : {}),
        ...(besetzer && (namenZeigen || besetzer.id === tnId) ? { name: besetzer.name } : {}),
      };
    }),
    threads: u.plan.threads.map((t, i) => {
      if (!leiter && i !== meinThread) return null;
      const pos = u.threads[i].pos;
      const akt = aktuell(u, i);
      const meinZug = !!akt && !!tn && sprecherTn(u, akt) === tn.id;
      const letztes = pos > 0 ? u.ergebnisse.filter(e => e.thread === i && e.idx === pos - 1).pop() : null;
      const zeigePunkte = letztes && (leiter ? !u.optionen.anonym : letztes.tn === tnId);
      return {
        name: t.name, gruppe: t.gruppe, pos: Math.min(pos, t.funk.length), total: t.funk.length,
        aktuell: akt ? funkSicht(u, i, pos, { voll: leiter || meinZug }) : null,
        ...(pos > 0 && u.phase === 'laeuft' ? { letzter: { ...funkSicht(u, i, pos - 1, { voll: false }), ...(zeigePunkte ? { punkte: letztes.punkte } : {}) } } : {}),
      };
    }).filter(Boolean),
    notruf: u.notruf ? { rufname: u.notruf.rufname, gruppe: u.notruf.gruppe } : null,
  };
  if (leiter) s.wartende = Object.values(u.teilnehmer).filter(t => t.slot === null).map(t => ({ tn: t.id, name: t.name, online: online.has(t.id) }));
  if (tn) {
    s.ich = { slot: tn.slot, name: tn.name };
    if (u.phase !== 'lobby') s.meins = punkteVon(u, tn.id);
  }
  if (u.phase === 'ende') {
    const a = auswertung(u);
    s.auswertung = leiter ? a : { team: a.team, threads: a.threads, teilnehmer: [] };
  }
  return s;
}

export { Fehler as UebungsFehler };
