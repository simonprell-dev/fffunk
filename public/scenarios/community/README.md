# Community-Szenarien

Dieser Ordner ist die Zielablage für Szenarien aus der Community.

## Ablauf

1. In der App ein Szenario im Szenario-Editor erstellen.
2. Lokal speichern und testen. Das Szenario funktioniert sofort auf dem eigenen Gerät.
3. Im Editor `JSON für PR` exportieren.
4. Die exportierte Datei nach `public/scenarios/community/<scenario-id>.json` legen.
5. Einen GitHub Pull Request öffnen.

## Benachrichtigung

Der Editor speichert im Feld `community.notifyContact` optional einen GitHub-Namen oder eine E-Mail-Adresse. Nach dem Merge kann der Maintainer den Ersteller darüber benachrichtigen.

## Sicherheit

GitHub Personal Access Tokens dürfen nicht in der App, im Repository oder im Browser-Code gespeichert werden. Für automatische PRs braucht es später GitHub OAuth oder ein kleines Backend, das Secrets serverseitig hält.
