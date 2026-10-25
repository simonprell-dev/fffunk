import { apiUrl } from './api-base';

export type UsageEvent =
  | 'app_open'
  | 'scenario_start'
  | 'training_start'
  | 'scenario_complete'
  | 'radio_ok'
  | 'radio_fail'
  | 'lern_open';

/**
 * Anonymer Nutzungszähler: sendet nur den Ereignisnamen, keine IDs, keine
 * Inhalte, nichts wird lokal gespeichert. Fehler werden ignoriert.
 */
export function trackEvent(event: UsageEvent): void {
  if (import.meta.env.DEV) return;
  try {
    fetch(apiUrl(`/api/stats/${event}`), { method: 'POST', keepalive: true, credentials: 'omit' })
      .catch(() => {});
  } catch { /* ignore */ }
}
