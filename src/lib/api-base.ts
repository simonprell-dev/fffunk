import { Capacitor } from '@capacitor/core';

/**
 * In der gepackten Android-/iOS-App zeigen relative `/api/...`-Pfade auf das
 * lokale App-Origin (capacitor/https-localhost) und schlagen fehl. Trage hier
 * die öffentliche Backend-URL deiner Bereitstellung ein, z. B.
 *   'https://fffunk-production.up.railway.app'
 * Leer lassen = relative Pfade (Web-Build / Server – funktioniert unverändert).
 */
export const NATIVE_API_BASE: string = '';

/** Baut die korrekte API-URL: relativ im Web, absolut in der nativen App. */
export function apiUrl(path: string): string {
  if (NATIVE_API_BASE && Capacitor.isNativePlatform()) {
    return NATIVE_API_BASE.replace(/\/+$/, '') + path;
  }
  return path;
}
