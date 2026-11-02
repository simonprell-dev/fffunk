import { apiUrl } from './api-base';

export type UsageEvent =
  | 'app_open'
  | 'scenario_start'
  | 'training_start'
  | 'scenario_complete'
  | 'chapter_complete'
  | 'radio_ok'
  | 'radio_fail'
  | 'lern_open';

/**
 * Nutzungszähler: sendet den Ereignisnamen, bei Szenario-Ereignissen zusätzlich die
 * Szenario-ID und den Lizenzcode der Organisation. Keine Geräte-ID, keine Inhalte,
 * nichts wird lokal gespeichert. Fehler werden ignoriert.
 */
export function trackEvent(event: UsageEvent, scenarioId?: string): void {
  if (import.meta.env.DEV) return;
  try {
    const params = new URLSearchParams();
    if (scenarioId) {
      params.set('scenario', scenarioId);
      const license = localStorage.getItem('fffunk_license_code');
      if (license) params.set('license', license);
    }
    const query = params.toString();
    fetch(apiUrl(`/api/stats/${event}${query ? `?${query}` : ''}`), { method: 'POST', keepalive: true, credentials: 'omit' })
      .catch(() => {});
  } catch { /* ignore */ }
}
