// Gruppenübung aus Sicht eines Geräts: anlegen, beitreten und die Live-Verbindung zum Server.
import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import type { Sicht, UebungsOptionen, UebungsPlan, OrgId } from '../types/gruppe';
import { NATIVE_API_BASE, apiUrl } from './api-base';
import { api, kontoToken } from './konto';

/** Zufällige Kennung dieses Geräts – damit man nach dem Neuladen wieder auf derselben Position landet. */
export function geraeteId(): string {
  const KEY = 'fffunk_geraet';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  }
}

export interface UebungInfo { code: string; titel: string; org: OrgId; phase: Sicht['phase']; anonym: boolean; plaetze: number; frei: number }
export interface UebungKurz { code: string; titel: string; org: OrgId; phase: Sicht['phase']; teilnehmer: number; erstellt: number; endetUm: number }

export const legeUebungAn = (plan: UebungsPlan, optionen: UebungsOptionen) => api<{ code: string }>('/api/gruppe', { plan, optionen }).then(r => r.code);
export const meineUebungen = () => api<{ uebungen: UebungKurz[] }>('/api/gruppe/meine').then(r => r.uebungen);
export const uebungInfo = (code: string) => api<UebungInfo>(`/api/gruppe/${encodeURIComponent(code)}`);
export const tritBei = (code: string, name: string, token?: string) =>
  api<{ tn: string; slot: number | null }>(`/api/gruppe/${encodeURIComponent(code)}/beitreten`, { geraet: geraeteId(), name, token });

/** Adresse der App für Links und QR-Codes (in der Android-App die öffentliche Adresse). */
export function appAdresse(): string {
  return Capacitor.isNativePlatform() ? NATIVE_API_BASE.replace(/\/+$/, '') : window.location.origin;
}

export const zufallsLink = (code: string) => `${appAdresse()}/#g=${code}`;
export const positionsLink = (code: string, token: string) => `${appAdresse()}/#g=${code}&p=${token}`;

export type ServerNachricht =
  | { t: 'sicht'; sicht: Sicht }
  | { t: 'fehler'; text: string }
  | { t: 'ergebnis'; nochmal: boolean; punkte: number | null; thread: number; idx: number }
  | { t: 'ptt'; an: boolean; von?: string }
  | { t: 'belegt' };

interface Ereignisse {
  onNachricht: (n: ServerNachricht) => void;
  onTon?: (daten: Uint8Array) => void;
  onStatus?: (verbunden: boolean) => void;
  /** Der Server kennt die Übung oder dieses Gerät nicht (mehr). */
  onAbgelehnt?: (grund: 'unbekannt' | 'nicht-beigetreten') => void;
}

/** WebSocket zur Übung; verbindet sich nach einem Abbruch von selbst neu. */
export class UebungsVerbindung {
  private ws: WebSocket | null = null;
  private zu = false;
  private versuch = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private code: string, private leiter: boolean, private ereignisse: Ereignisse) {
    this.verbinde();
  }

  private adresse(): string {
    const q = new URLSearchParams({ code: this.code, geraet: geraeteId() });
    if (this.leiter) { q.set('leiter', '1'); q.set('konto', kontoToken() ?? ''); }
    const pfad = apiUrl(`/api/gruppe/ws?${q}`);
    if (/^https?:/.test(pfad)) return pfad.replace(/^http/, 'ws');
    return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${pfad}`;
  }

  private verbinde() {
    if (this.zu) return;
    const ws = new WebSocket(this.adresse());
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => { this.versuch = 0; this.ereignisse.onStatus?.(true); };
    ws.onmessage = e => {
      if (typeof e.data === 'string') {
        try { this.ereignisse.onNachricht(JSON.parse(e.data)); } catch { /* ignore */ }
      } else this.ereignisse.onTon?.(new Uint8Array(e.data as ArrayBuffer));
    };
    ws.onclose = e => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.ereignisse.onStatus?.(false);
      if (e.code === 4004) { this.zu = true; this.ereignisse.onAbgelehnt?.('unbekannt'); return; }
      if (e.code === 4003) { this.zu = true; this.ereignisse.onAbgelehnt?.('nicht-beigetreten'); return; }
      if (this.zu) return;
      this.timer = setTimeout(() => this.verbinde(), Math.min(8000, 500 * 2 ** this.versuch++));
    };
    ws.onerror = () => { /* onclose folgt */ };
  }

  sende(nachricht: Record<string, unknown>): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(nachricht));
    return true;
  }

  sendeTon(daten: Uint8Array): void {
    if (this.ws?.readyState === WebSocket.OPEN && this.ws.bufferedAmount < 128 * 1024) this.ws.send(daten);
  }

  schliesse(): void {
    this.zu = true;
    if (this.timer) clearTimeout(this.timer);
    this.ws?.close();
    this.ws = null;
  }
}

interface UebungHook {
  sicht: Sicht | null;
  verbunden: boolean;
  /** Letzte Fehlermeldung des Servers (z. B. „nicht mehr an der Reihe“). */
  fehler: string | null;
  abgelehnt: 'unbekannt' | 'nicht-beigetreten' | null;
  sende: (nachricht: Record<string, unknown>) => boolean;
  sendeTon: (daten: Uint8Array) => void;
}

/** Hält die Verbindung zu einer Übung, solange die Komponente lebt. */
export function useUebung(
  code: string | null, leiter: boolean,
  extra: { onNachricht?: (n: ServerNachricht) => void; onTon?: (d: Uint8Array) => void } = {},
): UebungHook {
  const [sicht, setSicht] = useState<Sicht | null>(null);
  const [verbunden, setVerbunden] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [abgelehnt, setAbgelehnt] = useState<UebungHook['abgelehnt']>(null);
  const ref = useRef<UebungsVerbindung | null>(null);
  const extraRef = useRef(extra);
  extraRef.current = extra;

  useEffect(() => {
    setSicht(null); setAbgelehnt(null); setFehler(null);
    if (!code) return;
    const v = new UebungsVerbindung(code, leiter, {
      onNachricht: n => {
        if (n.t === 'sicht') { setSicht(n.sicht); setFehler(null); }
        else if (n.t === 'fehler') setFehler(n.text);
        extraRef.current.onNachricht?.(n);
      },
      onTon: d => extraRef.current.onTon?.(d),
      onStatus: setVerbunden,
      onAbgelehnt: setAbgelehnt,
    });
    ref.current = v;
    return () => { v.schliesse(); ref.current = null; };
  }, [code, leiter]);

  return {
    sicht, verbunden, fehler, abgelehnt,
    sende: n => ref.current?.sende(n) ?? false,
    sendeTon: d => ref.current?.sendeTon(d),
  };
}
