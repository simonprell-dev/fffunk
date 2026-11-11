# FFFunk – Feuerwehr-Funk-Trainer

Interaktives Trainingsprogramm für BOS-Funk, basierend auf den **Sprechfunkübungen im TMO-Betrieb** der Staatlichen Feuerwehrschule Würzburg (Basis 14.5).

Trainieren Sie digitale Sprechfunk-Prozeduren, Alarmierungen und Einsatzabläufe – direkt im Browser, mit Spracherkennung und typischem Funk-Sound.

**15 Szenarien** mit über 80 Funk-Gesprächen, basierend auf der Bayerischen Feuerwehrschule.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Piper TTS** – Offline-Sprachsynthese (Deutsch, neural) mit authentischem Funk-Sound
- **Spracherkennung (ASR)** – Web Speech API (Deutsch), bewertet Ihre Funk-Gespräche
- **Story-basierte Szenarien** – Verzweigte Dialoge mit direktem Feedback
- **Community-Szenarien** – Eigene Szenarien erstellen, veröffentlichen und teilen
- **Gruppenübung** – 2 bis 20 Personen funken gemeinsam, jede mit eigenem Handy und eigener Position; die App hört mit und wertet aus (Feuerwehr, Rettungsdienst, THW, Polizei)
- **Virtuelles Funkgerät** – Gruppenübung ohne echte Geräte: Sprechtaste, Notruftaste und Gruppenwahl in der App
- **Konto** – Anmeldung per E-Mail-Code, Spielstand, Wehr-Code erspielen
- **Multiplattform** – Web-first, funktioniert auf Desktop & Mobile
- **Push-to-Talk** – Echter PTT-Knopf mit Pointer-Capture für Touch-Geräte

## Technologie

- React 18 + TypeScript + Vite + Tailwind CSS (Dark Theme)
- Node.js HTTP-Server (Production)
- Piper TTS (Open-Source, Deutsch, auf dem Server)
- Web Speech API (Spracherkennung)
- Web Audio API (Funk-Effekte, PTT-Klick, Radio-Hiss)
- PostgreSQL via `pg` (Community-Szenarien)
- Railway (Hosting + PostgreSQL)

## Schnellstart (Lokale Entwicklung)

```bash
git clone https://github.com/simonprell-dev/fffunk.git
cd fffunk
npm install
npm run dev
```

Öffne http://localhost:5173. Die Spracherkennung benötigt Chrome/Edge mit deutscher Spracheinstellung.

> Im Dev-Modus läuft nur Vite ohne Node-Server. Piper-TTS und Community-API sind dann nicht verfügbar – der Browser nutzt automatisch die Web Speech API als Fallback.

## Deployment auf Railway

### 1. Repository verbinden

1. [Railway](https://railway.app) öffnen → **New Project** → **Deploy from GitHub repo**
2. Repository `fffunk` auswählen
3. Railway erkennt das `Dockerfile` automatisch

### 2. PostgreSQL-Datenbank hinzufügen (Pflicht für Community-Szenarien)

1. Im Railway-Projekt auf **+ New** klicken → **Database** → **Add PostgreSQL**
2. Railway erstellt die Datenbank und setzt `DATABASE_URL` **automatisch** als Umgebungsvariable im Projekt

Das war's. Die App liest `DATABASE_URL` beim Start und initialisiert die Tabellen selbst (`initDb()`). Ohne `DATABASE_URL` startet der Server trotzdem, aber Community-Szenarien sind deaktiviert (Meldung im Log: *„DATABASE_URL nicht gesetzt – Community-DB nicht verfügbar"*).

### 3. Umgebungsvariablen (optional)

| Variable | Standard | Beschreibung |
|---|---|---|
| `PORT` | `3000` | HTTP-Port |
| `DATABASE_URL` | – | PostgreSQL-Verbindungs-URL (Railway setzt diese automatisch) |
| `PIPER_DIR` | `/opt/piper` | Pfad zum Piper-Verzeichnis |
| `PIPER_MODEL` | `/app/voices/de_DE-thorsten-medium.onnx` | Pfad zum Sprachmodell |
| `ADMIN_PASSWORD` | – | Passwort für `/admin` |
| `SMTP_USER`, `SMTP_PASS` | – | Postfach für die Anmelde-E-Mails (IONOS). Ohne diese beiden kann sich niemand anmelden |
| `SMTP_HOST` | `smtp.ionos.de` | SMTP-Server |
| `SMTP_PORT` | `587` | `587` (STARTTLS) oder `465` (TLS) |
| `MAIL_FROM` | `SMTP_USER` | Absenderadresse |
| `KONTO_TESTCODE` | – | `1` = Anmeldecode in der Antwort mitgeben, solange kein SMTP eingerichtet ist. Nur für lokale Tests! |

### 4. Domain

Railway vergibt automatisch eine `.up.railway.app`-Domain. Unter **Settings → Networking** kann eine eigene Domain eingetragen werden.

## Gruppenübung

Unter **Gruppe** legt die Übungsleitung (mit Konto) eine Übung an: Organisation, Teilnehmerzahl, Szenario. Die App teilt die Gruppe in Abschnitte mit zwei bis vier Personen, die gleichzeitig auf eigenen Sprechgruppen funken; freie Positionen spricht der Computer.

- **Zugang:** ein QR-Code/Link für alle (Position wird zugelost) oder je Position ein eigener Link. Mischen geht: Positionen mit „selbst vergeben“ werden nicht verlost.
- **Echte Funkgeräte:** Das Handy zeigt, was zu funken ist, und die Erkennung startet von selbst, sobald man an der Reihe ist.
- **Virtuelles Funkgerät:** Sprache läuft über die App (WebSocket, 8 kHz µ-law). Eine Übung ist höchstens 6 Stunden aktiv.
- **Auswertung:** Anteil der erkannten Kernbegriffe je Funkspruch; am Ende Gesamtergebnis, je Abschnitt und je Person – namentlich oder anonym.

Szenarien liegen in `src/data/gruppen/` (je Organisation eine Datei), die Regeln dafür prüft `pruefeSzenario` in `src/lib/gruppen-plan.ts`. Konten, Spielstand und Übungen liegen in derselben PostgreSQL-Datenbank wie Lizenzen und Community-Szenarien; die Tabellen legt der Server beim Start selbst an. Laufende Übungen hält der Server im Arbeitsspeicher (eine Instanz, kein horizontales Skalieren) und sichert sie in der Datenbank, sodass sie einen Neustart überstehen.

Die Schwelle für den erspielbaren Wehr-Code steht im Admin-Bereich unter **Konten**.

## Community-Szenarien

Nutzer können eigene Szenarien direkt in der App erstellen und veröffentlichen:

1. **Editor** öffnen → Szenario ausfüllen → **In Community veröffentlichen**
2. Die App gibt einen Share-Link zurück: `https://ihre-domain/#community=<shareId>`
3. Andere öffnen den Link – das Szenario startet direkt
4. In der Szenarioliste unter **Community** können andere Szenarien mit **Danke** wertschätzen

Die Szenarien werden in PostgreSQL gespeichert (kein GitHub-Token nötig).

## Lokal entwickeln (mit Community-API und TTS)

```bash
npm run build        # React-App bauen
npm start            # Node-Server auf Port 3000 starten
```

Für die Community-API lokal eine PostgreSQL-Instanz starten und `DATABASE_URL` setzen:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/fffunk"
npm start
```

Ohne `DATABASE_URL` läuft der Server ohne Community-Funktion.

## Wie man spielt

1. **Szenario wählen** – Ordner links auswählen, Szenario anklicken
2. **Narrative lesen / hören** – Der Text wird per Piper-TTS (oder Browser-TTS als Fallback) vorgelesen
3. **Funk-Gespräch** – PTT-Knopf gedrückt halten, sprechen, loslassen
4. Die Spracherkennung bewertet Ihre Antwort und gibt Feedback

## Datenschutz

- Mikrofon-Aufnahmen werden lokal verarbeitet und nicht gespeichert
- Community-Szenarien (Titel, Beschreibung, Autor) werden auf dem Server gespeichert
- Keine Tracking-Cookies, kein Analytics

## Lizenz

MIT – siehe [LICENSE](LICENSE).

---

**Entwickelt von Simon Prell** – Inspiriert von der Bayerischen Feuerwehrschule.
