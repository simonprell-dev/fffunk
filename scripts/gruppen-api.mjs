// /api/gruppe/… – Gruppenübungen anlegen, beitreten und live verfolgen (WebSocket).
// Über denselben WebSocket läuft das virtuelle Funkgerät: Wer die Sprechtaste hält, schickt Tonpakete,
// der Server reicht sie an alle Geräte weiter, die auf derselben Sprechgruppe stehen.
import { WebSocketServer } from 'ws';
import {
  UebungsFehler, beende, beitreten, entferne, melde, neueUebung, neuerCode, punkteVon, saubereOptionen,
  setzeFest, setzeNotruf, sicht, starte, tick, ueberspringe, weiseZu,
} from './gruppen-engine.mjs';
import { gibtEsUebung, kontoZuToken, ladeUebung, listeUebungen, merkeSpiel, speichereUebung } from './konto-db.mjs';
import { cors, kontoAusAnfrage, readJson, sendJson } from './konto-api.mjs';

/** Laufende Übungen: code → { u, conns: Set<Verbindung>, sprecher: Map<gruppe, Verbindung>, gespeichert } */
const raeume = new Map();
const TICK_MS = 400;
const MAX_TONPAKET = 8 * 1024;
const NACH_ENDE_MS = 60 * 60 * 1000;

async function raum(code) {
  const c = String(code || '').toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(c)) return null;
  let r = raeume.get(c);
  if (r) return r;
  const u = await ladeUebung(c); // nach einem Neustart des Servers aus der Datenbank
  if (!u) return null;
  r = raeume.get(c); // inzwischen von einer anderen Anfrage geladen?
  if (!r) { r = { u, conns: new Set(), sprecher: new Map(), timer: null }; raeume.set(c, r); }
  return r;
}

function speichere(r) {
  if (r.timer) return;
  r.timer = setTimeout(() => {
    r.timer = null;
    speichereUebung(r.u.code, { leiterId: r.u.leiterId, daten: r.u, endet: r.u.endetUm, beendet: r.u.beendetUm })
      .catch(e => {
        // Konto der Übungsleitung gelöscht → die Übung gibt es nicht mehr
        if (e.code === '23503') { for (const c of r.conns) c.ws.close(4004, 'Übung gelöscht'); raeume.delete(r.u.code); }
        else console.error('Übung speichern:', e.message);
      });
  }, 500);
}

const online = r => new Set([...r.conns].filter(c => c.tnId).map(c => c.tnId));

function schicke(conn, nachricht) {
  if (conn.ws.readyState === 1) conn.ws.send(JSON.stringify(nachricht));
}

function verteile(r) {
  const on = online(r);
  for (const c of r.conns) schicke(c, { t: 'sicht', sicht: sicht(r.u, { tnId: c.tnId, leiter: c.leiter, online: on }) });
}

/** Nach dem Ende: Punkte den Konten der Teilnehmenden gutschreiben (einmalig). */
function abschluss(r) {
  if (r.u.phase !== 'ende' || r.u.verbucht) return;
  r.u.verbucht = true;
  for (const tn of Object.values(r.u.teilnehmer)) {
    const { punkte, funksprueche } = punkteVon(r.u, tn.id);
    if (tn.kontoId && funksprueche > 0) {
      merkeSpiel(tn.kontoId, { szenarioId: `gruppe:${r.u.plan.szenarioId}`, art: 'gruppe', punkte }).catch(() => {});
    }
  }
  for (const [, c] of r.sprecher) schicke(c, { t: 'ptt', an: false });
  r.sprecher.clear();
}

function geaendert(r) {
  abschluss(r);
  speichere(r);
  verteile(r);
}

setInterval(() => {
  const jetzt = Date.now();
  for (const [code, r] of raeume) {
    if (r.u.phase === 'laeuft' && tick(r.u, jetzt)) geaendert(r);
    // Lobby, die nie gestartet wurde: nach sechs Stunden ebenfalls schließen
    if (r.u.phase === 'lobby' && jetzt >= r.u.endetUm) { beende(r.u, jetzt); geaendert(r); }
    if (r.u.phase === 'ende' && !r.conns.size && jetzt - (r.u.beendetUm ?? jetzt) > NACH_ENDE_MS) raeume.delete(code);
  }
}, TICK_MS).unref();

// ── HTTP ──────────────────────────────────────────────────────────────────────────────────

export async function handleGruppenRequest(req, res) {
  if (cors(req, res)) return;
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname.replace(/\/$/, '');
  const m = req.method;

  try {
    if (p === '/api/gruppe' && m === 'POST') {
      const konto = await kontoAusAnfrage(req);
      if (!konto) return sendJson(res, 401, { error: 'Zum Anlegen einer Übung bitte anmelden.' });
      const body = await readJson(req, 512 * 1024);
      let code;
      do { code = neuerCode(); } while (raeume.has(code) || await gibtEsUebung(code));
      const u = neueUebung({ code, leiterId: konto.id, plan: body.plan, optionen: body.optionen });
      const r = { u, conns: new Set(), sprecher: new Map(), timer: null };
      raeume.set(code, r);
      await speichereUebung(code, { leiterId: konto.id, daten: u, endet: u.endetUm });
      return sendJson(res, 200, { code });
    }

    if (p === '/api/gruppe/meine' && m === 'GET') {
      const konto = await kontoAusAnfrage(req);
      if (!konto) return sendJson(res, 401, { error: 'Nicht angemeldet.' });
      return sendJson(res, 200, { uebungen: await listeUebungen(konto.id) });
    }

    const mitCode = p.match(/^\/api\/gruppe\/([A-Za-z0-9]{4,10})(\/beitreten)?$/);
    if (mitCode) {
      const r = await raum(mitCode[1]);
      if (!r) return sendJson(res, 404, { error: 'Diese Übung gibt es nicht (mehr). Bitte den Code prüfen.' });
      const u = r.u;

      if (!mitCode[2] && m === 'GET') {
        return sendJson(res, 200, {
          code: u.code, titel: u.plan.titel, org: u.plan.org, phase: u.phase, anonym: u.optionen.anonym,
          plaetze: u.slots.length, frei: u.slots.filter(s => !s.tn).length,
        });
      }

      if (mitCode[2] && m === 'POST') {
        const body = await readJson(req);
        const konto = await kontoAusAnfrage(req);
        const tn = beitreten(u, { geraet: body.geraet, name: body.name, token: body.token, kontoId: konto?.id ?? null });
        geaendert(r);
        return sendJson(res, 200, { ok: true, tn: tn.id, slot: tn.slot });
      }
    }

    sendJson(res, 404, { error: 'Nicht gefunden.' });
  } catch (e) {
    if (e instanceof UebungsFehler || e.status) return sendJson(res, e.status || 400, { error: e.message });
    console.error('Gruppen-API:', e);
    sendJson(res, 500, { error: 'Serverfehler.' });
  }
}

// ── WebSocket ─────────────────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });

function pttAus(r, conn) {
  for (const [gruppe, c] of r.sprecher) {
    if (c !== conn) continue;
    r.sprecher.delete(gruppe);
    for (const anderer of r.conns) if (anderer !== conn && anderer.gruppe === gruppe) schicke(anderer, { t: 'ptt', an: false });
  }
}

function funkErlaubt(r) {
  return r.u.optionen.funk && r.u.phase !== 'ende' && Date.now() < r.u.endetUm;
}

const AKTIONEN_LEITUNG = {
  fest: (r, n) => setzeFest(r.u, n.slot, n.fest),
  zuweisen: (r, n) => weiseZu(r.u, n.tn, n.slot ?? null),
  entfernen: (r, n) => entferne(r.u, n.tn),
  optionen: (r, n) => { if (r.u.phase === 'lobby') r.u.optionen = saubereOptionen(n.optionen); },
  start: r => starte(r.u),
  weiter: (r, n) => ueberspringe(r.u, n.thread),
  ende: r => beende(r.u),
  notrufEnde: r => setzeNotruf(r.u, null, false),
};

function nachricht(r, conn, n) {
  if (!n || typeof n.t !== 'string') return;

  if (conn.leiter && AKTIONEN_LEITUNG[n.t]) {
    AKTIONEN_LEITUNG[n.t](r, n);
    geaendert(r);
    return;
  }
  if (!conn.tnId || !r.u.teilnehmer[conn.tnId]) return;

  switch (n.t) {
    case 'melden': {
      const ergebnis = melde(r.u, conn.tnId, n);
      schicke(conn, { t: 'ergebnis', ...ergebnis, thread: n.thread, idx: n.idx });
      geaendert(r);
      break;
    }
    case 'gruppe':
      pttAus(r, conn);
      conn.gruppe = typeof n.g === 'string' ? n.g.slice(0, 20) : '';
      break;
    case 'ptt': {
      if (!n.an) { pttAus(r, conn); break; }
      if (!funkErlaubt(r) || !conn.gruppe) break;
      const belegt = r.sprecher.get(conn.gruppe);
      if (belegt && belegt !== conn) { schicke(conn, { t: 'belegt' }); break; }
      r.sprecher.set(conn.gruppe, conn);
      const tn = r.u.teilnehmer[conn.tnId];
      const von = tn.slot !== null ? r.u.plan.slots[tn.slot].rufname : tn.name;
      for (const c of r.conns) if (c !== conn && c.gruppe === conn.gruppe) schicke(c, { t: 'ptt', an: true, von });
      break;
    }
    case 'notruf':
      if (!funkErlaubt(r)) break;
      setzeNotruf(r.u, conn.tnId, !!n.an);
      geaendert(r);
      break;
  }
}

async function verbinde(ws, req) {
  const url = new URL(req.url, 'http://localhost');
  const r = await raum(url.searchParams.get('code'));
  if (!r) { ws.close(4004, 'Unbekannte Übung'); return; }

  const conn = { ws, tnId: null, leiter: false, gruppe: '' };
  const geraet = url.searchParams.get('geraet');
  const konto = await kontoZuToken(url.searchParams.get('konto'));
  if (konto && konto.id === r.u.leiterId && url.searchParams.get('leiter') === '1') conn.leiter = true;
  else {
    const tn = Object.values(r.u.teilnehmer).find(t => t.geraet === geraet);
    if (!tn) { ws.close(4003, 'Nicht beigetreten'); return; }
    conn.tnId = tn.id;
  }
  r.conns.add(conn);
  verteile(r);

  const empfange = (daten, binaer) => {
    try {
      if (binaer) {
        // Tonpaket: nur vom aktuellen Sprecher der Gruppe, an alle anderen auf dieser Gruppe
        if (daten.length > MAX_TONPAKET || r.sprecher.get(conn.gruppe) !== conn || !funkErlaubt(r)) return;
        for (const c of r.conns) if (c !== conn && c.gruppe === conn.gruppe && c.ws.readyState === 1 && c.ws.bufferedAmount < 256 * 1024) c.ws.send(daten, { binary: true });
        return;
      }
      nachricht(r, conn, JSON.parse(daten.toString('utf8')));
    } catch (e) {
      if (e instanceof UebungsFehler) schicke(conn, { t: 'fehler', text: e.message });
      else console.error('Gruppen-WebSocket:', e);
    }
  };
  // Nachrichten, die während des Verbindungsaufbaus ankamen, zuerst abarbeiten
  ws.off('message', ws.puffern);
  for (const [daten, binaer] of ws.vorab) empfange(daten, binaer);
  ws.vorab = [];
  ws.on('message', empfange);
  ws.on('close', () => {
    pttAus(r, conn);
    r.conns.delete(conn);
    verteile(r);
  });
  ws.on('error', () => {});
}

// Tote Verbindungen erkennen (Handy im Standby, Funkloch)
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.lebt === false) { ws.terminate(); continue; }
    ws.lebt = false;
    try { ws.ping(); } catch { /* ignore */ }
  }
}, 25_000).unref();

/** In server.on('upgrade', …) einhängen. Liefert true, wenn die Anfrage übernommen wurde. */
export function handleGruppenUpgrade(req, socket, head) {
  if (!req.url?.startsWith('/api/gruppe/ws')) return false;
  wss.handleUpgrade(req, socket, head, ws => {
    ws.lebt = true;
    ws.vorab = [];
    ws.puffern = (daten, binaer) => { if (ws.vorab.length < 20) ws.vorab.push([daten, binaer]); };
    ws.on('message', ws.puffern);
    ws.on('pong', () => { ws.lebt = true; });
    verbinde(ws, req).catch(e => { console.error('Gruppen-WebSocket:', e); ws.close(1011); });
  });
  return true;
}
