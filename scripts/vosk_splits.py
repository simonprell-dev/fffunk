"""Zerlegt Wörter aus den Szenarien, die das Vosk-Modell nicht kennt, in bekannte Teilwörter
(„angriffstrupp“ → „angriffs trupp“) und schreibt src/lib/vosk-splits.json.

Die Android-App schränkt die Offline-Erkennung auf die Wörter des jeweiligen Funkspruchs ein;
unbekannte Wörter würden dabei sonst wegfallen. Nach neuen Szenarien erneut ausführen:

    pip install vosk
    node scripts/fetch-vosk-model.mjs
    python scripts/vosk_splits.py
"""
import glob
import json
import os
import re
import subprocess
import sys
from functools import lru_cache

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'model-de')
OUT = os.path.join(ROOT, 'src', 'lib', 'vosk-splits.json')

# Vosk meldet fehlende Wörter nur als Warnung beim Aufbau der Grammatik → in eigenem Prozess abfangen.
CHILD = r'''
import sys, json, vosk
vosk.SetLogLevel(0)
words = json.load(open(sys.argv[2], encoding="utf8"))
vosk.KaldiRecognizer(vosk.Model(sys.argv[1]), 16000, json.dumps(words + ["[unk]"], ensure_ascii=False))
'''


def missing(words):
    tmp = OUT + '.tmp.json'
    with open(tmp, 'w', encoding='utf8') as f:
        json.dump(sorted(set(words)), f, ensure_ascii=False)
    try:
        p = subprocess.run([sys.executable, '-c', CHILD, MODEL, tmp], capture_output=True)
    finally:
        os.remove(tmp)
    err = p.stderr.decode('utf8', 'replace')
    if p.returncode != 0:
        sys.exit(err)
    return {line.split("vocabulary: '")[1].rstrip("'") for line in err.splitlines() if 'missing in vocabulary' in line}


def scenario_words():
    words = set()
    for path in glob.glob(os.path.join(ROOT, 'public', 'scenarios', 'builtin', '*', '*.json')):
        with open(path, encoding='utf8') as f:
            scenario = json.load(f)
        for node in scenario['nodes'].values():
            for action in node['actions']:
                rc = action.get('radioCall')
                if not rc:
                    continue
                for text in [rc.get('hint', '')] + rc.get('expectedPhrases', []):
                    words.update(w for w in re.split(r'[^a-zäöüß0-9]+', text.lower()) if w and not re.search(r'\d', w))
    return words


def main():
    unknown = missing(scenario_words())
    parts = {w[i:j] for w in unknown for i in range(len(w)) for j in range(i + 2, len(w) + 1)}
    known = parts - missing(parts)

    @lru_cache(None)
    def split(s):
        """Wenigste Teile; Teile mit mindestens 3 Zeichen (nur das letzte darf kürzer sein)."""
        if not s:
            return ()
        best = None
        for j in range(len(s), 1, -1):
            head = s[:j]
            if head in known and (len(head) >= 3 or j == len(s)):
                rest = split(s[j:])
                if rest is not None and (best is None or len(rest) + 1 < len(best)):
                    best = (head,) + rest
        return best

    result, unsolved = {}, []
    for w in sorted(unknown):
        s = split(w)
        if s and len(s) > 1:
            result[w] = ' '.join(s)
        else:
            unsolved.append(w)
    with open(OUT, 'w', encoding='utf8') as f:
        json.dump(result, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write('\n')
    print(f'{len(result)} Wörter zerlegt → {os.path.relpath(OUT, ROOT)}')
    if unsolved:
        print('Nicht zerlegbar (werden nicht erkannt):', ', '.join(unsolved))


if __name__ == '__main__':
    main()
