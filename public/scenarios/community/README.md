# Community-Szenarien

Community-Szenarien werden nach Einsatz-/Ausbildungsthema sortiert.

## Ordner

- `brand/` - Brand, Löschangriff, Brandabsicherung
- `thl/` - Technische Hilfeleistung
- `verkehr/` - Verkehrsabsicherung und Verkehrsleitung
- `wasser/` - Wasserentnahme und Wasseraufbau
- `funk/` - Funkgrundlagen, Anfunken, Statusmeldungen
- `sonstige/` - alles, was nicht eindeutig passt
- eigene Ordner sind erlaubt, wenn die Kategorie im Editor entsprechend gewählt wurde

## Ablauf

1. In der App ein Szenario im Szenario-Editor erstellen.
2. Kategorie auswählen oder einen eigenen Ordnernamen eintragen.
3. Lokal speichern und testen. Das Szenario funktioniert sofort auf dem eigenen Gerät.
4. Für automatische Pull Requests lokal den PR-Server starten:

   ```powershell
   $env:GITHUB_TOKEN="NEUER_TOKEN"
   npm run pr-server
   ```

5. In der App `Veröffentlichen` klicken. Der Server legt Branch, Szenario-Datei, `index.json`-Eintrag und Pull Request automatisch an.

Ohne lokalen PR-Server kann die exportierte Datei weiterhin manuell in den angezeigten Pfad gelegt werden, z.B. `public/scenarios/community/verkehr/mein-szenario.json`.
Danach muss `public/scenarios/index.json` im Abschnitt `community` aktualisiert werden, z.B. `"verkehr": ["community/verkehr/mein-szenario.json"]`.

## Sicherheit

GitHub Personal Access Tokens dürfen nicht in der App, im Repository oder im Browser-Code gespeichert werden. Der PR-Server liest den Token nur aus der lokalen Umgebungsvariable `GITHUB_TOKEN`.
