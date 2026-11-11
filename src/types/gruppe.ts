// Gruppenübung: mehrere Personen funken gemeinsam, jede mit eigenem Handy und eigener Position.
// Ein Szenario besteht aus fünf Abschnitten mit je vier Positionen. Je nach Teilnehmerzahl (2–20)
// werden ein bis fünf Abschnitte mit zwei bis vier Personen besetzt; unbesetzte Positionen spricht der Computer.

export type OrgId = 'feuerwehr' | 'rettungsdienst' | 'thw' | 'polizei';

export const ORGS: Record<OrgId, string> = {
  feuerwehr: 'Feuerwehr',
  rettungsdienst: 'Rettungsdienst',
  thw: 'THW',
  polizei: 'Polizei',
};

export interface GruppenRolle {
  /** Kürzel innerhalb des Abschnitts, z. B. „gf“. */
  id: string;
  /** Position, wie sie die Übungsleitung zuweist: „Gruppenführer“, „Atemschutzüberwachung“. */
  name: string;
  /** So meldet sich die Position am Funk. */
  rufname: string;
  /** Ein bis zwei Sätze für die Positionskarte: Was ist meine Aufgabe? */
  auftrag: string;
}

/** Ein Funkgespräch: Anruf → Antwort → Meldung → Quittung. Anruf und Antwort ergänzt die App selbst. */
export interface Gespraech {
  /** Rollen-ID des Abschnitts oder ID einer Station (Computer). */
  von: string;
  an: string;
  /** Was der Anrufer gerade sieht oder erfährt – erscheint nur ihm, bevor er funkt. */
  lage?: string;
  /** Inhalt der Meldung ohne Anruf und ohne „kommen“ am Ende. */
  meldung: string;
  /** Begriffe, die in der Meldung vorkommen müssen (stehen wörtlich in `meldung`). */
  kern: string[];
  /** Quittung der Gegenstelle ohne „Ende“ – wiederholt das Wesentliche. */
  antwort: string;
  antwortKern: string[];
  /** Gespräch läuft auf der Führungsgruppe statt auf der Gruppe des Abschnitts. */
  kanal?: 'fuehrung';
  /** Notruf: kein Anruf vorab, `meldung` ist der vollständige Notruf; am virtuellen Gerät gehört die Notruftaste dazu. */
  notruf?: boolean;
}

export interface Abschnitt {
  id: string;
  /** „Innenangriff“, „Wasserversorgung“ … */
  name: string;
  /** Sprechgruppe des Abschnitts, z. B. „307_F“. */
  gruppe: string;
  /** Vier Positionen, wichtigste zuerst: Bei zwei Personen sind die ersten beiden besetzt. */
  rollen: GruppenRolle[];
  gespraeche: Gespraech[];
}

/** Gegenstelle, die immer der Computer spricht (Leitstelle, Einsatzleitung …). */
export interface Station {
  name: string;
  rufname: string;
}

export interface GruppenSzenario {
  id: string;
  org: OrgId;
  titel: string;
  beschreibung: string;
  /** Ausgangslage, die alle Teilnehmenden vor dem Start lesen. */
  lage: string;
  fuehrungsgruppe: string;
  stationen: Record<string, Station>;
  abschnitte: Abschnitt[];
}

// ── Übungsplan: Szenario für eine bestimmte Teilnehmerzahl ────────────────────────────────

export interface PlanSlot {
  id: number;
  abschnitt: string;
  rolle: string;
  rufname: string;
  auftrag: string;
  gruppe: string;
}

export type FunkArt = 'anruf' | 'antwort' | 'meldung' | 'quittung' | 'notruf';

/** Ein einzelner Funkspruch. */
export interface PlanFunk {
  /** Sprechende Position; null = Computer. */
  slot: number | null;
  sprecher: string;
  an: string;
  anSlot: number | null;
  gruppe: string;
  art: FunkArt;
  /** Muster-Funkspruch. */
  text: string;
  kern: string[];
  lage?: string;
}

export interface PlanThread {
  name: string;
  gruppe: string;
  funk: PlanFunk[];
}

export interface UebungsPlan {
  szenarioId: string;
  org: OrgId;
  titel: string;
  lage: string;
  /** Alle Sprechgruppen der Übung – Auswahl am virtuellen Funkgerät. */
  gruppen: string[];
  slots: PlanSlot[];
  threads: PlanThread[];
}

export interface UebungsOptionen {
  /** Virtuelles Funkgerät: Sprechen über die App statt über echte Geräte. */
  funk: boolean;
  /** Ergebnisse ohne Namen. */
  anonym: boolean;
  /** Muster-Funkspruch vorab zeigen (sonst nur die Stichpunkte). */
  muster: boolean;
}

// ── Sicht eines Geräts auf die laufende Übung (kommt vom Server) ──────────────────────────

export interface SichtFunk {
  thread: number;
  idx: number;
  slot: number | null;
  sprecher: string;
  an: string;
  anSlot: number | null;
  gruppe: string;
  art: FunkArt;
  /** Fehlt bei fremden, noch nicht gesprochenen Funksprüchen. */
  text?: string;
  kern?: string[];
  lage?: string;
  versuch: number;
  /** Zeitpunkt (ms), zu dem ein Computer-Funkspruch endet. */
  bis?: number;
}

export interface SichtErgebnis {
  name: string;
  rolle: string;
  punkte: number | null;
  funksprueche: number;
}

export interface Auswertung {
  team: number | null;
  /** Je Abschnitt. */
  threads: { name: string; punkte: number | null }[];
  /** Für die Übungsleitung; bei anonymer Auswertung ohne Namen und gemischt. */
  teilnehmer: SichtErgebnis[];
}

export interface SichtSlot extends PlanSlot {
  fest: boolean;
  /** Nur für die Übungsleitung: Einzel-Link dieser Position. */
  token?: string;
  besetzt: boolean;
  /** Nur für die Übungsleitung: Kennung der Person auf dieser Position. */
  tn?: string;
  name?: string;
  online?: boolean;
}

export interface Sicht {
  code: string;
  phase: 'lobby' | 'laeuft' | 'ende';
  leiter: boolean;
  titel: string;
  org: OrgId;
  lage: string;
  optionen: UebungsOptionen;
  gruppen: string[];
  endetUm: number;
  slots: SichtSlot[];
  /** Nur für die Übungsleitung: beigetreten, aber noch ohne Position. */
  wartende?: { tn: string; name: string; online: boolean }[];
  /** Eigene Position (Teilnehmende). */
  ich?: { slot: number | null; name: string };
  threads: { name: string; gruppe: string; pos: number; total: number; aktuell: SichtFunk | null; letzter?: SichtFunk & { punkte?: number | null } }[];
  /** Aktiver Notruf am virtuellen Funkgerät. */
  notruf?: { rufname: string; gruppe: string } | null;
  auswertung?: Auswertung;
  /** Eigenes Ergebnis (Teilnehmende). */
  meins?: { punkte: number | null; funksprueche: number };
}
