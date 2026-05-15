import { ApiScenarioEntry, Scenario } from '../types/story';

const BASE = '/api/community/scenarios';

export async function fetchCommunityScenarios(): Promise<ApiScenarioEntry[]> {
  const res = await fetch(BASE);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCommunityScenario(shareId: string): Promise<ApiScenarioEntry | null> {
  const res = await fetch(`${BASE}/${shareId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function publishCommunityScenario(scenario: Scenario): Promise<{ shareId: string }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Veröffentlichen fehlgeschlagen.');
  return data;
}

export async function thankScenario(shareId: string): Promise<number> {
  const res = await fetch(`${BASE}/${shareId}/thank`, { method: 'POST' });
  const data = await res.json();
  return data.thankCount ?? 0;
}

const THANKS_KEY = 'fffunk_thanked';

export function hasThankd(shareId: string): boolean {
  try {
    const raw = localStorage.getItem(THANKS_KEY);
    return raw ? JSON.parse(raw).includes(shareId) : false;
  } catch { return false; }
}

export function markThanked(shareId: string): void {
  try {
    const raw = localStorage.getItem(THANKS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(shareId)) {
      list.push(shareId);
      localStorage.setItem(THANKS_KEY, JSON.stringify(list));
    }
  } catch { /* ignore */ }
}

export function buildShareUrl(shareId: string): string {
  return `${window.location.origin}${window.location.pathname}#community=${shareId}`;
}
