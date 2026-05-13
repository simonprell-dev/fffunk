# FFFunk – Feuerwehr Funk Trainer

Interaktives Training für BOS-Funk (TMO/DMO) basierend auf den offiziellen Bayerischen Feuerwehrschulen-Unterlagen (Basis 14.5).

## Features

- 📻 **Radio-TTS**: Dispatch-Nachrichten klingen wie echtes Funkgerät (Bandpass + Verzerrung)
- 🎤 **Spracherkennung**: Whisper ASR (offline möglich) bewertet deine Funkrufe
- 📖 **Story-basierte Szenarien**: Interaktive Geschichten mit Entscheidungen und Feedback
- 🎯 **Konstruktives Feedback**: Sofortige Korrektur und Hinweise bei Fehlern
- 📱 **Multiplattform**: PWA (Web) + optional Android/iOS via Capacitor
- 🆓 **Kostenlos**: Keine monatlichen Gebühren, keine Cloud nötig

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui Styling
- Zustand State Management
- Web Audio API (Radio-Effekte)
- Web Speech API (TTS + ASR)
- PWA (offline-fähig)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
# Output: dist/
```

## Deployment

Das `dist/`-Verzeichnis kann auf GitHub Pages veröffentlicht werden.

### GitHub Pages

```bash
git checkout -b gh-pages
npm run build
cp -r dist/* .
git add .
git commit -m "Deploy FFFunk"
git push origin gh-pages
```

## Content

Die Szenarien basieren auf dem offiziellen Lehrplan **Basis 14.5** der Staatlichen Feuerwehrschule Würzburg:
- 6 Arbeitsblätter mit 78 Funkmeldungen
- Vollständige Einsatzübung (Alarm → Einsatz → Rückzug)
- TMO-Betrieb mit FMS-Alternativen

## Security

- Keine personenbezogenen Daten gesammelt
- Lokale Speicherung nur im Browser (localStorage)
- Keine externe Kommunikation außer Erst-Laden der statischen Assets
- GDPR-konform

## License

MIT – für Feuerwehren und Ausbilder frei nutzbar.

---

**FFFunk** – *Train Smarter. Communicate Better.*
