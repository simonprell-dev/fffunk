# FFFunk – Szenario „Grundausbildung“

**Datum:** 2026-10-30
**Status:** zur Freigabe

## Worum es geht

Neue Feuerwehrleute ohne jedes Vorwissen sollen spielerisch die Grundregeln des Sprechfunks lernen – nicht als Theorieseite (die gibt es schon im Lernbereich), sondern **eingebaut in ein Szenario**: Die Regel wird in der Geschichte genau dann erklärt, wenn man sie gleich selbst anwenden muss.

Ziel ist, dass ein Neuling am Ende sicher beherrscht:

1. **Reihenfolge** eines Funkspruchs (wer wird gerufen – wer ruft – Nachricht)
2. **„kommen“ und „Ende“** – Gespräch übergeben bzw. beenden
3. **Frage** – eine Frage als Funkspruch („Frage … – kommen“)
4. **Nachfrage** – bei Unverstandenem nachfragen („Wiederholen“)
5. **Anruf beantworten** – mit „Hier … – kommen“, **nicht** mit „… hört“
6. **Mayday** – den eigenen Notruf absetzen

Zu Punkt 5: Der Nutzer nannte „hört“. Der Lernbereich der App (`src/lib/lern-content.ts`, Funkdisziplin) führt „Florian Neuhaus 44/1 hört“ ausdrücklich als **Fehler** – „hört“ ist kein Betriebswort, die Anrufantwort beginnt mit „hier“. Das Kapitel lehrt genau das (**vom Nutzer bestätigt**).

## Ziele

- Ohne Vorwissen spielbar: keine Abkürzung, kein Fachwort ohne Erklärung beim ersten Auftreten.
- Spielerisch: Geschichte mit Figuren, Fehler sind erlaubt und werden kurz erklärt, keine Strafe.
- **6 Kapitel**, die einzeln startbar sind; die App merkt sich den Fortschritt und bietet „Weiter mit Kapitel X“ an.
- Läuft auch auf dem 2,4"-Funkgerät (Kompaktansicht, Drehknopf, Sprechtaste, Vosk-Spracherkennung).

## Nicht-Ziele

- Kein Ersatz für den Lernbereich (Theorie bleibt dort); kein Verweis-Zwang dorthin.
- Keine Prüfung/Zertifikat, keine Punkte-Rangliste.
- Kein Server-Speicher, kein Konto – Fortschritt nur auf dem Gerät.
- Kapitel-System zunächst nur für dieses Szenario; andere Szenarien bleiben unverändert (dürfen es später nutzen).

## Was es nicht werden darf

- Ein Textwüste: Erklärungen max. 2–3 Sätze pro Schritt (Funkgerät-Display!).
- Ein Neuling, der gleich im ersten Schritt frei sprechen muss und scheitert.
- Inhaltlich falsch gegenüber dem, was Szenarien und Lernbereich bereits lehren (Funkrufname „Florian Neuhaus“, bayerische Vorgaben, Betriebsworte wie im Lernbereich).

## Ablauf eines Kapitels: Verstehen → Auswählen → Sprechen

Jedes Kapitel folgt derselben Leiter:

1. **Verstehen** – Szene + Gruppenführer erklärt die Regel in 2–3 Sätzen im Szenariotext. Taste „Verstanden“.
2. **Auswählen** – „Welcher Funkspruch ist richtig?“: drei Antworten, die falschen sind typische Anfängerfehler (z. B. eigener Name zuerst, „Ende“ vergessen, „hört“). Falsch → kurzer Erklär-Schritt + „Zurück zur Auswahl“ (Muster wie in `funkdisziplin_mayday_fremd.json`, Knoten `*_x1…`).
3. **Sprechen** – derselbe Typ Funkspruch, leicht abgewandelt, selbst sprechen (bestehender `radioCall` mit `hint`, `expectedPhrases`, `response`). Der Muster-Funkspruch ist wie im Üben-Modus sichtbar.

Danach: Kapitelabschluss-Schritt mit einem Satz Lob/Merksatz und den Tasten **„Nächstes Kapitel“** und **„Zur Kapitelauswahl“** (letztes Kapitel: nur Kapitelauswahl / Beenden).

## Geschichte und Kapitel

Rahmen: **Erster Übungsabend** bei der Feuerwehr Neuhaus. Der Spieler ist neues Mitglied, eingeteilt als Truppmann im Angriffstrupp des HLF **Florian Neuhaus 40/1**; Gruppenführer und Übungsleiter erklären. Jedes Kapitel beginnt mit einem Satz, der die Szene setzt, damit es ohne die vorherigen verständlich ist.

| # | Kapitel | Lernziel | Szene (Vorschlag) |
|---|---|---|---|
| 1 | Wer ruft wen? | Reihenfolge: Gerufener – „von“ – Rufender – kommen | Am Gerätehaus: erster Anruf beim Gruppenführer |
| 2 | Kommen und Ende | Übergeben mit „kommen“, Abschluss „verstanden – Ende“ | Gruppenführer gibt kurzen Auftrag, man bestätigt und beendet |
| 3 | Eine Frage stellen | „Frage …“ als Spruch | Am Übungsobjekt: nach dem Standort des Verteilers fragen |
| 4 | Nachfragen | Unverstandenes nicht raten: „Wiederholen“ | Antwort der Gegenstelle ist abgehackt/unklar (Text mit „…“), Spieler fragt nach |
| 5 | Einen Anruf beantworten | „Hier … – kommen“, nicht „hört“ | Spieler wird selbst gerufen und antwortet |
| 6 | Mayday | Notruf-Aufbau wie im Lernbereich (Mayday ×3, hier …, wo, was, Mayday – kommen) | Ende der Übung: Atemschutz-Übungsszenario, Trupp in Notlage |

Exakte Rufnamen, Inhalte und Wortlaute legt der Umsetzer fest – passend zu bestehenden Szenarien und Lernbereich. Pro Kapitel ein bis zwei Sprech-Schritte, damit ein Kapitel in 2–4 Minuten durch ist.

## Kapitelauswahl und Fortschritt

- Beim Start des Szenarios erscheint **statt der Geschichte eine Kapitelauswahl**:
  - oben, falls Fortschritt vorhanden und nicht alles fertig: **„Weiter mit Kapitel N: Titel“** (erstes nicht abgeschlossenes Kapitel nach dem zuletzt gespielten; *Umsetzer-Entscheidung im Detail*);
  - darunter alle 6 Kapitel mit Nummer, Titel und **✓** wenn abgeschlossen; jedes direkt startbar.
  - Bei keinem Fortschritt: „Los geht’s: Kapitel 1“ oben.
- Kapitel gilt als **abgeschlossen**, wenn sein Abschluss-Schritt erreicht wird.
- Fortschritt in `localStorage` (eigener Schlüssel je Szenario, z. B. `fffunk_chapters_<scenarioId>`: abgeschlossene Kapitel-IDs + zuletzt gespieltes Kapitel). Zugriff in try/catch – ohne Speicher funktioniert alles, nur ohne ✓.
- Kapitelauswahl ist per Drehknopf bedienbar (normale Buttons → `radio-keys.ts` greift automatisch) und passt auf 274×366 (Kompaktansicht).

## Technik (Rahmen, Details beim Umsetzer)

- **Szenario-Datei:** `public/scenarios/builtin/funk/grundausbildung.json`, eingetragen in `public/scenarios/index.json`. Normale Knoten/Aktionen wie bisher.
- **Neues optionales Feld** in `Scenario` (`src/types/story.ts`):
  `chapters?: { id: string; title: string; startNodeId: string; endNodeId: string }[]`.
  Szenarien ohne `chapters` verhalten sich exakt wie bisher.
- **Kapitelauswahl** wird von der App erzeugt (nicht als statischer Knoten), weil ✓ und „Weiter mit“ dynamisch sind. `PracticeScreen` (oder eine kleine neue Komponente davor) zeigt sie, wenn `scenario.chapters` gesetzt ist; Kapitelstart = `engine.goTo(startNodeId)`.
- **Kapitelende-Tasten:** Aktionen mit Sonderzielen analog zu `__exit__`, z. B. `__next_chapter__` und `__chapters__`, die `PracticeScreen` auswertet.
- **Platzierung in der Liste:** *Entscheidung von mir:* In der Szenarioliste („Üben“) ganz oben ein hervorgehobener Eintrag **„Neu bei der Feuerwehr? → Grundausbildung“**, unabhängig vom gewählten Ordner; das Szenario liegt zusätzlich normal im Ordner Funk.
- **Trainingsmodus:** *Entscheidung von mir:* Grundausbildung erscheint **nicht** in der Training-Liste (dort wird der Muster-Funkspruch verborgen – das widerspricht dem Einsteiger-Gedanken).
- **Spracherkennung:** Alle neuen Wörter müssen für Vosk erkennbar sein → nach dem Schreiben `python scripts/vosk_splits.py` laufen lassen und `src/lib/vosk-splits.json` mitliefern.
- **Notruftaste in Kapitel 6 (vom Nutzer entschieden):** Das Kapitel lehrt „Notruftaste drücken, dann Mayday sprechen“. Solange die Grundausbildung läuft, startet die SOS-Taste (`sosRef` in `src/App.tsx`) **nicht** das Szenario `mayday_atemschutznotfall`; stattdessen wertet `PracticeScreen` sie aus: Im dafür vorgesehenen Schritt von Kapitel 6 gilt der Druck als richtiger Schritt und führt weiter (z. B. Aktion mit neuem optionalem Feld `key: 'sos'` oder Knoten-Markierung – Umsetzer entscheidet). Ohne Funkgerät (Handy/PC) gibt es für diesen Schritt einen normalen Button „Notruftaste drücken“. In anderen Schritten der Grundausbildung wird die Taste ignoriert. Außerhalb der Grundausbildung bleibt das bisherige Verhalten.
- **Nutzungsstatistik:** `scenario_complete` feuert nur bei reinen `__exit__`-Schritten; wie Kapitelabschlüsse zählen, entscheidet der Umsetzer (z. B. eigenes Event `chapter_complete`).
- **Antwort der Gegenstelle:** bestehendes `response`-Feld bzw. automatische Ableitung (`radio-response.ts`) nutzen; für Kapitel 4 (unklare Antwort) ist die Antwort Teil des Szenariotexts.

## Prüfung

- Typecheck + Build.
- Durchspielen aller 6 Kapitel per Playwright bei 1200×800 und 274×366 (kein horizontaler Überlauf, Kapitelauswahl ✓ nach Abschluss, „Weiter mit“ korrekt nach Neuladen).
- Auf dem Funkgerät: Kapitelauswahl per Drehknopf, ein Sprech-Schritt per Sprechtaste, Notruftaste in Kapitel 6 (führt weiter, startet nicht das andere Mayday-Szenario).

## Dem Umsetzer überlassen

Exakte Texte und Funksprüche, Anzahl der Zwischenschritte, Gestaltung der Kapitelauswahl, Namen der Sonderziele und des Speicher-Schlüssels, ob die Kapitelauswahl eigene Komponente oder Teil von `PracticeScreen` ist.
