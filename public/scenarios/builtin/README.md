# Eingebaute Szenarien

Die eingebauten Szenarien sind nach Kategorie sortiert:

- `brand/`
- `thl/`
- `verkehr/`
- `wasser/`
- `funk/`
- `sonstige/`

Welche Dateien geladen werden, steht in `public/scenarios/index.json` im Abschnitt `builtin`.

Die eingebauten Szenarien werden mit `python scripts/szenarien/run.py` erzeugt
(Inhalte in `scripts/szenarien/gen_*.py`). Änderungen bitte dort vornehmen, nicht
direkt in den JSON-Dateien – das Skript aktualisiert auch `index.json` und prüft,
ob jeder Musterfunkspruch die erwarteten Phrasen erfüllt.
