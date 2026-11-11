// Konto: Anmeldung per E-Mail-Code, Spielstand, eigener Wehr-Code. Das Sitzungs-Token liegt im Browser.
import { useSyncExternalStore } from 'react';
import { apiUrl } from './api-base';

const TOKEN_KEY = 'fffunk_konto_token';

export interface Spiel { szenarioId: string; tag: string; art: 'einzel' | 'gruppe'; punkte: number | null }

export interface Konto {
  email: string;
  name: string;
  /** Abgeschlossene Übungen (je Szenario, Tag und Art einmal gezählt). */
  spiele: number;
  gruppenspiele: number;
  verlauf: Spiel[];
  /** So viele Übungen braucht es für einen eigenen Wehr-Code; 0 = nicht erspielbar. */
  schwelle: number;
  wehrcode: { code: string; organisation: string; rufnamen: Record<string, string> } | null;
}

export function kontoToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** Anfrage an die FFFunk-API, mit Anmeldung falls vorhanden. Fehler kommen als Error mit deutschem Text. */
export async function api<T>(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const token = kontoToken();
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Keine Verbindung zum Server.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Fehler ${res.status}`), { status: res.status });
  return data as T;
}

// ── Zustand für die ganze App ─────────────────────────────────────────────────────────────

interface Zustand { konto: Konto | null; laedt: boolean }
let zustand: Zustand = { konto: null, laedt: !!kontoToken() };
const hoerer = new Set<() => void>();
function setze(z: Partial<Zustand>) {
  zustand = { ...zustand, ...z };
  hoerer.forEach(h => h());
}

function abgemeldet() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  setze({ konto: null, laedt: false });
}

export async function ladeKonto(): Promise<void> {
  if (!kontoToken()) { setze({ konto: null, laedt: false }); return; }
  try {
    setze({ konto: (await api<{ konto: Konto }>('/api/konto')).konto, laedt: false });
  } catch (e) {
    if ((e as { status?: number }).status === 401) abgemeldet();
    else setze({ laedt: false });
  }
}

let geladen = false;
export function useKonto(): Zustand {
  if (!geladen) { geladen = true; void ladeKonto(); }
  return useSyncExternalStore(h => { hoerer.add(h); return () => hoerer.delete(h); }, () => zustand);
}

export async function fordereCodeAn(email: string): Promise<{ testCode?: string }> {
  return api('/api/konto/login', { email });
}

export async function meldeAn(email: string, code: string): Promise<Konto> {
  const r = await api<{ token: string; konto: Konto }>('/api/konto/verify', { email, code });
  try { localStorage.setItem(TOKEN_KEY, r.token); } catch { /* ignore */ }
  setze({ konto: r.konto, laedt: false });
  return r.konto;
}

export async function meldeAb(): Promise<void> {
  await api('/api/konto/logout', {}).catch(() => {});
  abgemeldet();
}

export async function loescheKonto(): Promise<void> {
  await api('/api/konto', undefined, 'DELETE');
  abgemeldet();
}

const uebernimm = (r: { konto: Konto }) => { setze({ konto: r.konto }); return r.konto; };

export const setzeName = (name: string) => api<{ konto: Konto }>('/api/konto/name', { name }).then(uebernimm);
export const holeWehrcode = (organisation: string) => api<{ konto: Konto }>('/api/konto/wehrcode', { organisation }).then(uebernimm);
export const speichereRufnamen = (rufnamen: Record<string, string>) => api<{ konto: Konto }>('/api/konto/rufnamen', { rufnamen }).then(uebernimm);

/** Abgeschlossenes Einzel-Szenario dem Konto gutschreiben (ohne Konto passiert nichts). */
export function meldeSpiel(szenarioId: string, punkte: number): void {
  if (!kontoToken()) return;
  api<{ konto: Konto }>('/api/konto/spiel', { szenarioId, punkte }).then(uebernimm).catch(() => {});
}
