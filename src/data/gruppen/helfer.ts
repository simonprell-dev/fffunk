// Kurzschreibweise für die Szenariodaten der Gruppenübungen.
import type { Gespraech, GruppenRolle } from '../../types/gruppe';

export const rolle = (id: string, name: string, rufname: string, auftrag: string): GruppenRolle => ({ id, name, rufname, auftrag });

/** Gespräch: von, an, Meldung, Kernbegriffe, Quittung, Kernbegriffe der Quittung, Zusätze (lage, kanal, notruf). */
export const g = (
  von: string, an: string, meldung: string, kern: string[], antwort: string, antwortKern: string[],
  extra: Pick<Gespraech, 'lage' | 'kanal' | 'notruf'> = {},
): Gespraech => ({ von, an, meldung, kern, antwort, antwortKern, ...extra });
