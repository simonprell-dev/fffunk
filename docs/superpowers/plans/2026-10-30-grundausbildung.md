# Grundausbildung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neues Einsteiger-Szenario „Grundausbildung“ mit 6 einzeln startbaren Kapiteln, Kapitelauswahl mit gespeichertem Fortschritt und Notruftaste als Teil des Mayday-Kapitels.

**Architecture:** Ein normales Szenario-JSON erhält ein optionales Feld `chapters`. Eine reine Logik-Datei (`chapter-progress.ts`) verwaltet Fortschritt in `localStorage` und Kapitel-Navigation; `ChapterMenu.tsx` zeigt die Auswahl; `PracticeScreen` wertet Sonderziele `__chapters__`/`__next_chapter__` und Aktionen mit `key: 'sos'` aus. `App.tsx` leitet die Notruftaste während der Grundausbildung nicht mehr ins Mayday-Szenario um, hebt die Grundausbildung in der Liste hervor und blendet sie im Training aus.

**Tech Stack:** React 18 + TypeScript + Vite 5 + Tailwind, Capacitor-Android; neu: Vitest 2 für Logik- und Inhaltstests; Playwright (Scratchpad) für E2E.

**Spec:** `docs/superpowers/specs/2026-10-30-grundausbildung-design.md`

## Global Constraints

- Szenario-ID `grundausbildung`, Datei `public/scenarios/builtin/funk/grundausbildung.json`, Kategorie `funk`.
- Kapitel-IDs und Titel (genau so): `reihenfolge` „Wer ruft wen?“, `kommen-ende` „Kommen und Ende“, `frage` „Eine Frage stellen“, `nachfrage` „Nachfragen“, `anruf-beantworten` „Einen Anruf beantworten“, `mayday` „Mayday“.
- Sonderziele: `__exit__` (bestehend), `__chapters__`, `__next_chapter__`.
- Speicher-Schlüssel `fffunk_chapters_<scenarioId>`, Inhalt `{ done: string[]; last?: string }`; jeder Zugriff in try/catch.
- Spielerrolle `truppmann`; Funkrufnamen mit „Florian Neuhaus“ (HLF `Florian Neuhaus 40/1`).
- „hört“ ist **falsch** (nur in falschen Auswahl-Optionen erlaubt); Anrufantwort „Hier … – kommen“.
- Mayday-Wortlaut wie Lernbereich: `Mayday, Mayday, Mayday – hier <Rufname> – <Standort> – <Lage inkl. Atemluft> – Mayday, kommen!`
- Szenarien ohne `chapters` verhalten sich exakt wie bisher.
- Kompaktansicht 274×366: kein horizontaler Überlauf; alles per Drehknopf (normale `<button>`) erreichbar.
- Commit-Messages enden mit `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`; nicht pushen ohne Freigabe.

## Review Focus

1. Kaputter/fremder `localStorage`-Inhalt (kein JSON, `done` kein Array, unbekannte Kapitel-IDs) → Menü erscheint trotzdem, ungültige Einträge werden ignoriert. *(Test in Task 1)*
2. Alle Kapitel erledigt → kein „Weiter mit“, sondern „Nochmal von vorn: Kapitel 1“; Abschluss des letzten Kapitels bietet kein „Nächstes Kapitel“. *(Tests in Task 1 und Task 4)*
3. Notruftaste außerhalb des SOS-Schritts in der Grundausbildung → passiert nichts (kein Szenariowechsel). *(nur auf dem Funkgerät prüfbar – Task 5 Step 3)*
4. Kapitel mitten drin verlassen („Abbrechen“) und Szenario neu starten → Menü erscheint wieder, „Weiter mit“ zeigt das angefangene Kapitel. *(Test in Task 1: `last` ohne `done`)*
5. Falsch gesprochener Funkspruch im Kapitel → `onFailure` führt auf einen Erklär-Knoten mit Rückweg, nie in eine Sackgasse. *(Inhaltstest in Task 4: jeder Knoten erreicht den Kapitel-Endknoten)*

---

### Task 0: Ausgangsstand sichern

Im Arbeitsbaum liegen nicht committete Funkgerät-Änderungen (Vosk, Tasten, TTS, Kompaktansicht, Lernbereich-Fix). Sie gehören nicht zur Grundausbildung.

- [ ] **Step 1:** Nutzer fragen, ob dieser Stand jetzt committet werden darf (bislang nicht freigegeben). Falls ja: alles außer `docs/` und `__pycache__` als eigener Commit `feat(funkgeraet): Android-App fürs PoC-Funkgerät (Vosk, Tasten, Sprachausgabe, Kompaktansicht)`; danach Spec + Plan als `docs: Grundausbildung – Design und Plan`. Falls nein: Grundausbildung-Commits enthalten nur ihre eigenen Dateien (`git add <pfade>`, nie `git add -A`).

### Task 1: Vitest + Kapitel-Logik

**Files:**
- Modify: `package.json` (devDependency `vitest@^2.1.9`, Script `"test": "vitest run"`), `src/types/story.ts`
- Create: `src/lib/chapter-progress.ts`
- Test: `src/lib/chapter-progress.test.ts`

**Interfaces:**
- Produces:
  - in `src/types/story.ts`: `export interface Chapter { id: string; title: string; startNodeId: string; endNodeId: string }` und `Scenario.chapters?: Chapter[]`
  - `export interface ChapterProgress { done: string[]; last?: string }`
  - `loadChapterProgress(scenarioId: string): ChapterProgress` – nie Exception; Fallback `{ done: [] }`
  - `markChapterDone(scenarioId: string, chapterId: string): ChapterProgress` – idempotent, setzt auch `last`
  - `markChapterStarted(scenarioId: string, chapterId: string): ChapterProgress` – setzt nur `last`
  - `resumeChapter(chapters: Chapter[], p: ChapterProgress): Chapter | null` – erstes nicht erledigtes Kapitel ab `last` (inklusive `last`, falls nicht erledigt), sonst erstes nicht erledigtes überhaupt; alle erledigt → `null`
  - `nextChapter(chapters: Chapter[], chapterId: string): Chapter | null`
  - `chapterEndingAt(chapters: Chapter[], nodeId: string): Chapter | null`

- [ ] **Step 1: Failing tests** in `chapter-progress.test.ts` (Vitest, `localStorage` per kleinem In-Memory-Stub auf `globalThis`):
  - `loadChapterProgress` bei leerem Speicher → `{ done: [] }`; bei `'kaputt'` → `{ done: [] }`; bei `{"done":"x"}` → `{ done: [] }`
  - `markChapterDone('s','a')` zweimal → `done` = `['a']`, `last` = `'a'`, `loadChapterProgress('s')` liefert dasselbe
  - Wenn `localStorage.setItem` wirft → `markChapterDone` wirft nicht
  - Mit Kapiteln `a,b,c`: `resumeChapter(ch,{done:[]})` → `a`; `{done:['a'],last:'a'}` → `b`; `{done:[],last:'b'}` → `b`; `{done:['a','b','c']}` → `null`; `{done:['zz'],last:'zz'}` → `a`
  - `nextChapter(ch,'c')` → `null`; `nextChapter(ch,'a')` → `b`
  - `chapterEndingAt(ch, endNodeOf_b)` → `b`; unbekannter Knoten → `null`
- [ ] **Step 2:** `npx vitest run src/lib/chapter-progress.test.ts` → FAIL (Modul fehlt)
- [ ] **Step 3:** Implementieren; Schlüssel `fffunk_chapters_${scenarioId}`, ungültige Werte beim Laden verwerfen (`done` nur Strings).
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit -p .` → keine Fehler
- [ ] **Step 5: Commit** `feat(kapitel): Fortschritt und Navigation für Kapitel-Szenarien`

### Task 2: Typen, Kapitelauswahl, PracticeScreen

**Files:**
- Modify: `src/types/story.ts` (Typen), `src/components/PracticeScreen.tsx`, `src/lib/usage-stats.ts`, `scripts/license-db.mjs` (`USAGE_EVENTS.chapter_complete: 'Kapitel abgeschlossen'`)
- Create: `src/components/ChapterMenu.tsx`

**Interfaces:**
- Consumes: alles aus Task 1 (inkl. Typ `Chapter`).
- Produces:
  - `Action.key?: 'sos'` – Aktion wird zusätzlich durch die Notruftaste ausgelöst
  - `UsageEvent` um `'chapter_complete'` erweitert
  - `ChapterMenu` Props: `{ chapters: Chapter[]; progress: ChapterProgress; onStart: (c: Chapter) => void }`

- [ ] **Step 1: ChapterMenu** – Überschrift „Kapitel“; oben Primär-Button: `resumeChapter` ≠ null → „Weiter mit Kapitel N: Titel“ (bei leerem Fortschritt „Los geht’s: Kapitel 1“), sonst „Nochmal von vorn: Kapitel 1“; darunter je Kapitel ein Button „N. Titel“ mit ✓ wenn erledigt. Stil wie Kapitelliste in `LernbereichView` (inkl. `min-w-0`/`truncate`), Kompakt-Klassen wie dort.
- [ ] **Step 2: PracticeScreen** – nur wenn `scenario.chapters`:
  - State `menuOpen` (Start: `true`), `progress` (aus `loadChapterProgress`). Bei `menuOpen` statt Narrative/Aktionen `ChapterMenu` rendern; Kopfzeile bleibt.
  - `onStart(c)`: `markChapterStarted`, `engine.goTo(c.startNodeId)`, `refreshNode()`, `menuOpen=false`, `window.scrollTo(0,0)`.
  - Effekt auf `currentNode.id`: `chapterEndingAt(...)` → `markChapterDone`, `trackEvent('chapter_complete')` (einmal je Erreichen).
  - `handleAction`: `__chapters__` → Menü öffnen (Fortschritt neu laden); `__next_chapter__` → `nextChapter` des aktuellen Endknoten-Kapitels starten, sonst Menü.
  - Menü offen → kein Vorlesen der Narrative und PTT öffnet nichts.
  - Notruftaste: eigener `onRadioKey`-Listener; bei `sos` gedrückt und offenem Schritt (kein Modal, keine `incoming`) die Aktion mit `key === 'sos'` des aktuellen Knotens per `handleAction` auslösen; sonst ignorieren.
- [ ] **Step 3:** `npx tsc --noEmit -p .` + `npm test` → grün
- [ ] **Step 4: Commit** `feat(kapitel): Kapitelauswahl und Notruftaste im Szenario`

### Task 3: App-Einbindung

**Files:** Modify `src/App.tsx`, `src/components/ScenarioList.tsx`

- [ ] **Step 1:** `sosRef`: wenn `view === 'practice'` und `selectedScenario?.chapters` → nichts tun (PracticeScreen übernimmt).
- [ ] **Step 2:** Training-Liste: `scenarios.filter(s => s.id !== 'grundausbildung')` an die Training-`ScenarioList` übergeben.
- [ ] **Step 3:** `ScenarioList` neue optionale Prop `featured?: Scenario`; im Modus `guided` über den Ordnern ein hervorgehobener Button (rot umrandet, volle Breite) „Neu bei der Feuerwehr? → Grundausbildung“, der `onSelect(featured)` aufruft. App übergibt `scenarios.find(s => s.id === 'grundausbildung')`; fehlt es, wird nichts gerendert.
- [ ] **Step 4:** `npx tsc --noEmit -p .` → grün
- [ ] **Step 5: Commit** `feat(grundausbildung): hervorgehoben in der Liste, Notruftaste bleibt im Kapitel`

### Task 4: Szenario-Inhalt

**Files:**
- Create: `public/scenarios/builtin/funk/grundausbildung.json`
- Modify: `public/scenarios/index.json` (an den Anfang von `builtin.funk`), `src/lib/vosk-splits.json` (generiert)
- Test: `src/lib/grundausbildung.test.ts`

Inhalt pro Kapitel nach Spec-Tabelle: Szene-Satz → Erklärung (2–3 Sätze) → Auswahl aus 3 Optionen (2 falsche = typische Anfängerfehler, je Erklär-Knoten `*_x1/_x2` mit „🔄 Zurück zur Auswahl“) → 1–2 Sprech-Schritte (`radioCall` mit `hint`, `expectedPhrases`, `response`, `onFailure` auf Erklär-Knoten mit Rückweg) → Endknoten (Merksatz; Aktionen `__next_chapter__` „Nächstes Kapitel ▶“ außer bei `mayday`, und `__chapters__` „Zur Kapitelauswahl“). Kapitel 4: unklare Antwort der Gegenstelle steht im Text („…Verteiler… *rauscht* …“), Spieler spricht `Wiederholen`. Kapitel 6: Schritt „Notruftaste drücken“ (Aktion mit `"key": "sos"`, Label „🆘 Notruftaste drücken“) vor dem Mayday-`radioCall`.

- [ ] **Step 1: Failing test** `grundausbildung.test.ts` liest das JSON und prüft:
  - `id === 'grundausbildung'`, `playerRole === 'truppmann'`, `chapters.map(c=>[c.id,c.title])` exakt wie in Global Constraints, `startingNodeId === chapters[0].startNodeId`
  - jedes `nextNodeId`/`onSuccess`/`onFailure` ist ein Knoten oder eins von `__exit__`, `__chapters__`, `__next_chapter__`
  - je Kapitel: von **jedem** von `startNodeId` aus erreichbaren Knoten ist `endNodeId` erreichbar (keine Sackgasse); mindestens ein `radioCall`; mindestens ein Knoten mit ≥3 Aktionen ohne `radioCall`
  - Endknoten: enthält `__chapters__`; enthält `__next_chapter__` genau dann, wenn nicht letztes Kapitel
  - jede `narrative` ≤ 600 Zeichen
  - kein `hint`/`expectedPhrases`/`response` enthält „hört“ (Wortgrenze, case-insensitive)
  - Kapitel `reihenfolge`: erster `hint` passt auf `/^.+ von .+ – .*kommen[.!]?$/`
  - Kapitel `mayday`: genau eine Aktion mit `key === 'sos'`; ein `hint` beginnt mit `Mayday, Mayday, Mayday – hier ` und endet mit `Mayday, kommen!`
- [ ] **Step 2:** `npx vitest run src/lib/grundausbildung.test.ts` → FAIL (Datei fehlt)
- [ ] **Step 3:** JSON schreiben (Format wie `funkdisziplin_mayday_fremd.json`), in `index.json` eintragen.
- [ ] **Step 4:** `npm test` → PASS
- [ ] **Step 5:** Vosk-Wörter: `PYTHONPATH=<scratchpad>/vosk-venv/Lib/site-packages python scripts/vosk_splits.py` (Modell via `node scripts/fetch-vosk-model.mjs`); unlösbare neue Wörter im Text ersetzen und erneut laufen lassen.
- [ ] **Step 6: Commit** `feat(grundausbildung): 6 Kapitel für Einsteiger`

### Task 5: Ende-zu-Ende-Prüfung

**Files:** Create `<scratchpad>/e2e/grundausbildung.mjs` (nicht im Repo; nutzt `playwright-core` aus `<scratchpad>/e2e/node_modules`)

- [ ] **Step 1:** `npm run build`, `npx vite preview --host 127.0.0.1 --port 4173`
- [ ] **Step 2:** Skript für Viewports 1200×800 und 274×366. Sprechschritte wie in `<scratchpad>/e2e/e2e.mjs`: `window.SpeechRecognition`/`webkitSpeechRecognition` per Init-Script durch eine Attrappe ersetzen, die den angezeigten Muster-Funkspruch als Ergebnis liefert, dann „HALTEN ZUM SPRECHEN“ drücken/loslassen. Ablauf: Üben → Hervorhebung klicken → Menü „Los geht’s: Kapitel 1“ → Kapitel 1 komplett durch → Endknoten → „Zur Kapitelauswahl“ zeigt ✓ bei Kapitel 1 und „Weiter mit Kapitel 2“; Seite neu laden → ✓ bleibt; Kapitel 6 direkt starten → „Notruftaste drücken“-Button führt weiter; Training-Liste enthält kein „Grundausbildung“; `scrollWidth <= innerWidth` bei 274.
  Expected: alle Prüfungen „ok“, keine `pageerror`.
- [ ] **Step 3:** Funkgerät (falls angeschlossen): `npx cap sync android`, `gradlew.bat assembleDebug`, installieren, starten mit `am start -n dev.simonprell.fffunk/.MainActivity`; Kapitelauswahl per Drehknopf, Kapitel 6 Notruftaste → geht weiter (kein Wechsel ins andere Mayday-Szenario), in Kapitel 2 Notruftaste → nichts passiert. Nicht angeschlossen → im Bericht als offen vermerken.
- [ ] **Step 4:** Ergebnisse dem Nutzer berichten; Push nur nach Freigabe.
