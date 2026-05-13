# FFFunk – Feuerwehr-Funk-Trainer

Interaktives Trainingsprogramm für BOS-Funk, basierend auf den **Sprechfunkübungen im TMO-Betrieb** der Staatlichen Feuerwehrschule Würzburg (Basis 14.5).

Trainieren Sie digitale Sprechfunk-Prozeduren, Alarmierungen und Einsatzabläufe – direkt im Browser, mit Spracherkennung und typischem Funk-Sound.

**15 Szenarien** mit über 80 Funk-Gesprächen, basierend auf der Bayerischen Feuerwehrschule.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
[![Deploy to GitHub Pages](https://github.com/simonprell-dev/fffunk/actions/workflows/gh-pages.yml/badge.svg)](https://github.com/simonprell-dev/fffunk/actions/workflows/gh-pages.yml)

## ✨ Features

- 📻 **Radio-TTS mit PTT-Klick** – Authentischer Funk-Sound beim Sprechen
- 🎤 **Spracherkennung (ASR)** – Web Speech API (Deutsch), bewertet Ihre Funk-Gespräche
- 📖 **Story-basierte Szenarien** – Verzweigte Dialoge mit direktem Feedback
- 🌐 **Client-seitig only** – Kein Backend, keine Datenerfassung, DSGVO-konform
- 📱 **Multiplattform** – Web-first, funktioniert auf Desktop & Mobile (PWA-fähig)
- 🚀 **Kostenlos gehostet** – GitHub Pages, minimaler Wartungsaufwand
- 🔄 **Remotely updatable** – Neue Szenarien per Push zu `public/scenarios/remote.json` hinzufügbar

## 🛠️ Technologie

- React 18 + TypeScript + Vite
- Tailwind CSS (Dark Theme)
- Web Speech API (Spracherkennung & Sprachsynthese)
- Web Audio API (PTT-Klick)
- GitHub Pages (Hosting)

## 🚀 Schnellstart (Lokales Testing)

```bash
# 1. Repository klonen
git clone https://github.com/simonprell-dev/fffunk.git
cd fffunk

# 2. Dependencies installieren
npm install

# 3. Development Server starten
npm run dev
```

Öffne http://localhost:5173 in deinem Browser.

**Hinweis:** Die Spracherkennung benötigt Mikrofon-Zugriff und einen Browser, der Web Speech API unterstützt (Chrome/Edge). Verwende **deutsche Spracheinstellung** für beste Ergebnisse.

## 📦 Bauen für Produktion

```bash
npm run build   # erstellt ./dist
npm run preview # lokaler Preview-Server für dist/
```

## 🌍 GitHub Pages Deployment

1. Aktiviere GitHub Pages in den Repository-Einstellungen:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` (main Branch + `/root` folder)

2. Der Workflow `.github/workflows/gh-pages.yml` wird automatisch bei jedem Push zu `main` ausgeführt und deployt die App.

3. Deine FFFunk-App ist dann erreichbar unter:
   ```
   https://simonprell-dev.github.io/fffunk/
   ```

## 🎮 Wie man spielt

1. **Szenario wählen** – Wählen Sie eine der 7 Trainings-Einheiten aus (z.B. "Grundlagen: Alarmierung", "Brandobjekt", "Tiefgarage", etc.)

2. **Narratives lesen / hören** – Jede Szene beginnt mit einer Funk-Durchsage. Der Text wird als Funk-TTS vorgelesen.

3. **Aktion wählen** – Klicken Sie einen der angebotenen Buttons:
   - Normale Buttons: Nächster Schritt ohne Funk-Gespräch
   - **Funk-Buttons** (mit 🎤): Starten Sie ein Funk-Gespräch mit Spracherkennung

4. **Funk-Gespräch**:
   - Das System spricht die erwartete Funk-Phrase vor (z.B. "Florian A nach Kiel, kommen")
   - Nach Countdown (3…2…1…) beginnt die Aufnahme (5 Sekunden)
   - Sprechen Sie deutlich und warten Sie die Bewertung ab
   - Erfolg: grüne Bestätigung, nächster Schritt
   - Fehlschlag: rote Rückmeldung mit Hinweis, Sie dürfen es erneut versuchen

5. **Punkte** – Pro erfolgreichem Funk-Gespräch: +10 Punkte

## 🔧 Remote Szenarien hinzufügen

Sie können neue Szenarien **ohne Code-Änderung** hinzufügen, indem Sie `public/scenarios/remote.json` auf GitHub aktualisieren.

### Szenario-Format

```json
[
  {
    "id": "mein_szenario_1",
    "title": "Mein Szenario",
    "description": "Kurze Beschreibung",
    "startingNodeId": "start",
    "playerRole": "gruppenführer_a",
    "nodes": {
      "start": {
        "id": "start",
        "role": "einsatzleit",
        "narrative": "**Einsatzleitstelle:** Alarm für Florian A...",
        "actions": [
          {
            "id": "a1",
            "label": "Funk-Antwort geben",
            "radioCall": {
              "expectedPhrases": ["Florian A an Kiel, kommen"],
              "hint": "Florian A nach Kiel, kommen",
              "onSuccess": "node_002",
              "onFailure": "node_999"
            }
          }
        ]
      }
    }
  }
]
```

- `expectedPhrases`: Liste zulässiger Phrasen (Teilstring-Match, case-insensitive)
- `hint`: Was gesagt werden soll (wird vorgelesen)
- `onSuccess` / `onFailure`: ID des nächsten Nodes

Committen & pushen Sie die Änderung – GitHub Pages lädt die neue URL automatisch.

## 🔐 Datenschutz & Sicherheit

- **Keine Datensammlung** – Alle Daten bleiben im Browser (localStorage)
- **Keine Server** – Nur statische Dateien auf GitHub Pages
- **Mikrofon-Aufnahmen** – Werden lokal verarbeitet, nicht hochgeladen
- **Open Source** – Code transparent einsehbar

Siehe [SECURITY.md](SECURITY.md) für Details.

## 📚 Datenherkunft

Die Basisszenarien stammen aus der PDF *"Sprechfunkübungen im TMO-Betrieb"* (Staatliche Feuerwehrschule Würzburg, Basis 14.5). Die Übungen wurden in ein interaktives Story-Format überführt und um Feedback-Mechanismen erweitert.

## 🎯 Geplante Features (Phase 2)

- [ ] Vollständige **Radio-Filtereffekte** (Bandpass, Distortion) für TTS
- [ ] **Whisper WASM** für hochgenaue Offline-Spracherkennung
- [ ] **Progress-Tracking** mit Bestenliste (lokal)
- [ ] **PWA-Installation** für Offline-Nutzung
- [ ] Mehr Szenarien (THW, Rettungsdienst, Polizei)

## 🤝 Beitragen

Pull Requests sind willkommen! Forken, ändern, PR öffnen.

## 📄 Lizenz

Dieses Projekt steht unter der **MIT-Lizenz** – siehe [LICENSE](LICENSE).

Kurz gesagt: Du darfst den Code frei nutzen, modifizieren, verteilen und auch kommerziell einsetzen – solange der Copyright-Vermerk erhalten bleibt. Keine Garantie.

---

**Entwickelt von Simon Prell** – Inspiriert von der Bayerischen Feuerwehrschule.
