// Gewähltes Bedienkonzept und ob Szenarien Status/Gruppenwechsel am simulierten Funkgerät verlangen.
import { KONZEPTE, type KonzeptId } from './funkgeraet';

const KEY_KONZEPT = 'fffunk.funkgeraet';
const KEY_SZENARIEN = 'fffunk.funkgeraet.szenarien';

export function getKonzept(): KonzeptId {
  try {
    const v = localStorage.getItem(KEY_KONZEPT);
    return v && v in KONZEPTE ? (v as KonzeptId) : 'sepura-stp';
  } catch {
    return 'sepura-stp';
  }
}

export function setKonzept(id: KonzeptId): void {
  try { localStorage.setItem(KEY_KONZEPT, id); } catch { /* ignore */ }
}

export function getGeraetInSzenarien(): boolean {
  try { return localStorage.getItem(KEY_SZENARIEN) !== 'off'; } catch { return true; }
}

export function setGeraetInSzenarien(on: boolean): void {
  try { localStorage.setItem(KEY_SZENARIEN, on ? 'on' : 'off'); } catch { /* ignore */ }
}
