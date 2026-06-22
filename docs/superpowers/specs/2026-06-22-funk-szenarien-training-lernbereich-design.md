# FFFunk – Überarbeitung Szenarien · Trainingsmodus · Lernbereich

**Datum:** 2026-06-22
**Branch:** `feat/funk-szenarien-training-lernbereich`

## Ziel

Drei zusammenhängende Erweiterungen am Feuerwehr-Funk-Trainer FFFunk:

1. **Szenarien überarbeiten** – durchgängiger Funkrufname **„Florian Neuhaus"**, inhaltlich stimmiger und konform zu den **formalen Funkrichtlinien** der (Freiwilligen) Feuerwehr / BOS-Digitalfunk.
2. **Trainingsmodus** – eigener Bereich, in dem nur der **Inhalt** der Meldung gezeigt wird (nicht der fertige Funkspruch); man formuliert/spricht selbst und sieht **danach** den korrekten Muster-Funkspruch.
3. **Lernbereich** – neuer Theorie-Bereich in der Grundansicht mit umfassender Theorie inkl. **Mayday-Ablauf Schritt für Schritt**.

## Entscheidungen (vom Nutzer bestätigt)

- **Funkstandard:** BOS-Digitalfunk (TETRA). FMS-Statuskatalog 1–9 bleibt, zusätzlich vollständiges Sprechfunk-Wechselverkehr-Verfahren.
- **Trainingsmodus:** eigene Ansicht (kein Schalter im Szenario), **mikrofonbasiert** (selbst sprechen → Abgleich mit Muster).
- **Umfang:** **alle** Szenarien (4 Funk + 5 Trupp) + **1 neues Mayday-Szenario** = 10.
- **Lernbereich:** umfassend (8 Kapitel).
- **Navigation:** Top-Level-Tabs „Üben · Training · Lernen · Editor".
- **Trainingsdaten:** neues optionales Feld `briefing` an `RadioCall`.

## Architektur / Navigation (Abschnitt 1)

Header-Navigation: `Üben` · `Training` · `Lernen` · `Editor` (Zahnrad/Einstellungen bleibt rechts).

| Bereich | Hash | Verhalten |
|---|---|---|
| Üben | `#scenarios` | `ScenarioList` → `PracticeScreen` mode=`guided` (zeigt Muster-Funkspruch zum Nachsprechen, wie bisher). |
| Training | `#training` | `ScenarioList` (mode=`training`) → `PracticeScreen` mode=`training`. |
| Lernen | `#lernen` | `LernbereichView` (statisch, kein Mikrofon). |
| Editor | `#editor` | unverändert. |

- `View`-Typ in `src/App.tsx`: `'list' | 'training' | 'lernen' | 'editor' | 'practice'`.
- `PracticeScreen` erhält Prop `mode: 'guided' | 'training'` (Default `guided`).
- `ScenarioList` erhält Prop `mode` (steuert nur Überschrift/Texte); „Üben" und „Training" teilen sich dieselbe Liste, kein Code-Duplikat.
- Hash-Routing in `App.tsx` um `#training` und `#lernen` erweitert.

## Szenario-Überarbeitung (Abschnitt 2)

### Funkrufnamen-Satz (fiktive Wehr „Neuhaus")

| Rolle | Funkrufname |
|---|---|
| Eigenes LF (Spieler) | Florian Neuhaus 44/1 |
| Drehleiter | Florian Neuhaus 33/1 |
| Einsatzleitwagen | Florian Neuhaus 11/1 |
| Nachbar-LF (Nachforderung) | Florian Altdorf 44/1 |
| Leitstelle | Leitstelle *(per Substitution lokalisierbar)* |

Ortsbezug durchgängig „Neuhaus" statt „Kirchberg".

### Formale Regeln (durchgängig)

1. **Anruf:** „*[Gegenstelle]* von *[eigener Rufname]* — kommen." **Antwort:** „Hier *[eigener Rufname]* … kommen."
2. Jede Übertragung endet mit **„kommen"**; die letzte Übertragung eines Gesprächs mit **„Ende"**.
3. Eigener Rufname **zuerst** beim Antworten.
4. Zahlen einzeln gesprochen; korrekter **FMS-Statuskatalog** (sachlich korrekt zugeordnet, z. B. kein „Status 7 Patient übergeben" für ein LF).
5. **Lagemeldung** nach festem Schema (Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung).
6. Trupp-Szenarien: korrektes **Befehls-/Meldungsschema** (Anruf → „… hört" → Auftrag → Wiederholung durch den Trupp).

### Datenmodell-Erweiterung

`src/types/story.ts` → `RadioCall` erhält:

```ts
briefing?: string; // reiner Inhalt der Meldung (was zu melden ist), für den Trainingsmodus
```

- Jede `radioCall` der 10 Szenarien bekommt ein `briefing` (Stichpunkte, ohne fertige Formulierung).
- `hint` bleibt der **fertige Muster-Funkspruch** (im Training erst nach dem Versuch aufgedeckt).
- Fallback: fehlt `briefing`, zeigt der Trainingsmodus einen generischen Hinweis und deckt trotzdem `hint` auf (Alt-/Community-Szenarien bleiben nutzbar).

### Inhalts-/Plausibilitätspass

Neben Form auch Inhalt prüfen: realistische Lagemeldungen, konsistente Adressen/Ort (Neuhaus), korrekte Status-Bedeutungen, sinnvolle Nachforderungen.

### Genauigkeit

Exakte Formulierungen (v. a. Mayday, FMS-Status, Sprechfunkfloskeln) werden bei der Umsetzung gegen **FwDV 7 / vfdb 10/03** und die BOS-Sprechfunk-Regeln verifiziert (Web-Recherche), nicht aus dem Gedächtnis.

### Graph-Integrität

Bei der Überarbeitung der 9 bestehenden Szenarien bleiben **node-IDs, `startingNodeId`, `onSuccess`/`onFailure`, Action-IDs unverändert** — nur Texte (`narrative`, `hint`, `briefing`, `expectedPhrases`, `feedbackSuccess`, `feedbackFailure`) werden bearbeitet.

## Trainingsmodus (Abschnitt 3)

- Eigener Bereich `#training`; Szenarioauswahl über dieselbe `ScenarioList`.
- `PracticeScreen` mode=`training`:
  - `narrative` wird normal angezeigt (inkl. Anruf der Leitstelle) und per TTS gesprochen.
  - `RadioCallModal` zeigt im Training **nur `briefing`** (Inhalt), **nicht** `hint`.
  - Nutzer drückt PTT, spricht eigene Formulierung; Spracherkennung wertet gegen `expectedPhrases`.
  - **Nach dem Sprechen** Aufdeck-Panel: (a) eigenes Transkript, (b) Treffer der Kernbegriffe (✓/✗), (c) **Muster-Funkspruch** (`hint`) zum Vergleich; optional TTS des Musters.
  - Buttons **„Weiter"** (→ `onSuccess`) und **„Nochmal"** (gleicher Schritt). Im Training wird unabhängig vom Treffer per Klick fortgeschritten (Ziel: Selbstformulierung + Vergleich); Punkte weiterhin bei Treffer.
- `guided`-Modus bleibt unverändert (zeigt `hint` zum Nachsprechen).

## Lernbereich (Abschnitt 4)

- Neue Ansicht `#lernen`, Komponente `LernbereichView`: zweispaltig (Kapitel-Sidebar + Markdown-Inhalt), Styling wie `ScenarioList`. Mobil: Kapitel-Liste oben.
- Inhalt in `src/lib/lern-content.ts` (Array von Kapiteln `{ id, title, icon?, body }`, `body` = Markdown), gerendert via vorhandenem `react-markdown`.
- `applyRufnamen` wird auf den Inhalt angewendet (Beispiele zeigen ggf. echte Rufnamen).
- **Kapitel (umfassend):**
  1. Grundlagen BOS-Digitalfunk (TMO/DMO, Sprechgruppen, Sprechtaste, OPTA vs. Funkrufname)
  2. Sprechfunkverkehr / Verkehrsabwicklung im Wechselverkehr (Anruf, Antwort, Spruch, „kommen"/„Ende"/„verstanden"/„wiederholen"/„Frage"; erst hören – dann sprechen)
  3. Buchstabieralphabet + Zahlen/Uhrzeiten richtig sprechen
  4. FMS-Statuskatalog 0–9 mit Bedeutung
  5. Funkrufnamen-System (Florian + Ort + Kennung; Beispiel-Fuhrpark Neuhaus)
  6. Die Lagemeldung – Schema Schritt für Schritt + Nachforderung
  7. **Mayday / Notfallmeldung – Schritt für Schritt** (Reihenfolge, Inhalt, Funkstille, Sicherheitstrupp, Aufhebung)
  8. Funkdisziplin & häufige Fehler
- Optionale Querverweise: Kapitel → passendes Szenario („Üben"-Link).

## Neues Mayday-Szenario (Teil von Abschnitt 2)

- Datei: `public/scenarios/builtin/funk/mayday_atemschutznotfall.json`, Kategorie `funk`, `playerRole: truppführer`.
- Ablauf (gegen FwDV 7 / vfdb 10/03 zu verifizieren):
  1. Atemschutznotfall im Innenangriff → Spieler setzt **Mayday** korrekt ab („Mayday, Mayday, Mayday – hier … – Standort/Lage/Atemluft – kommen").
  2. Einsatzleiter/Leitstelle bestätigt, fragt fehlende Angaben nach (Standort, Luftvorrat) → Spieler ergänzt.
  3. **Funkstille** für übrigen Funkverkehr / **Sicherheitstrupp vor**.
  4. Rettung erfolgt → **Mayday aufgehoben / Funkstille aufgehoben**.

## Migration & Sonstiges (Abschnitt 5)

- `scripts/admin-api.mjs`: Default-Rufnamen/Wildcard-Vorlagen „Kirchberg" → „Neuhaus" (Funktion `defaultWildcardText`, Default in `licenseFormPage`, Platzhalter-Texte). **Hinweis:** bestehende Wehr-Codes in der DB referenzieren ggf. noch „Kirchberg" und sollten ihre Substitutionstabelle aktualisieren.
- `public/scenarios/index.json`: neuen Mayday-Pfad ergänzen.
- `src/components/ScenarioEditor.tsx` + `src/lib/community-scenarios.ts`: optionales `briefing`-Feld pro Schritt, damit auch Community-Szenarien den Trainingsmodus unterstützen (niedrigere Priorität; Fallback greift ohnehin).
- Spracherkennung (`RadioCallModal`): ≥2-Treffer-Regel bleibt; ggf. Normalisierung kleinerer Begriffe ergänzen. Prozedurwörter („kommen"/„Ende") nicht zwingend für Erfolg, um Fehlauslösungen zu vermeiden.

## Verifikation

- `npm run build` (`tsc -b && vite build`) muss fehlerfrei durchlaufen.
- Smoke-Test: App starten, alle vier Tabs öffnen; je ein Szenario in `guided` und `training` durchspielen; Lernbereich-Kapitel anzeigen; alle 10 Szenario-JSONs laden (über `index.json`).
- Funk-Korrektheit: jedes Szenario gegen die verifizierte Funk-Referenz adversarial geprüft (Form + Inhalt + Graph-Integrität).

## Nicht im Umfang (YAGNI)

- Keine echte Server-/DB-Migration bestehender Lizenzdaten (nur Default-Vorlagen + Doku-Hinweis).
- Keine Mehrsprachigkeit, keine neuen Audio-Effekte.
- Keine Änderung am Lizenz-/Community-API-Backend außer den Rufnamen-Vorlagen.
