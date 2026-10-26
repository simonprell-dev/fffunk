"""Erzeugt die eingebauten Szenarien unter public/scenarios/builtin/ und deren
Eintraege in public/scenarios/index.json. Aufruf: python scripts/szenarien/run.py

Prueft danach, ob jeder Musterfunkspruch (hint) alle expectedPhrases mit der
gleichen Logik wie RadioCallModal.tsx erfuellt."""
import json, os, re, sys, unicodedata

sys.path.insert(0, os.path.dirname(__file__))
import gen_funk, gen_trupp, gen_neu, gen_erw_a, gen_erw_b, gen_erw_c
from gen_lib import REPO


def norm(v):
    v = v.lower()
    for pat, r in [(r'\b(eins|eine|ein)\b', '1'), (r'\b(zwei|zwo)\b', '2'), (r'\bdrei\b', '3'),
                   (r'\bvier\b', '4'), (r'\b(fuenf|fünf)\b', '5'), (r'\bsechs\b', '6'),
                   (r'\bsieben\b', '7'), (r'\bacht\b', '8'), (r'\bneun\b', '9'), (r'\bnull\b', '0')]:
        v = re.sub(pat, r, v)
    v = re.sub('[\u0300-\u036f]', '', unicodedata.normalize('NFD', v))
    return re.sub(r'\s+', ' ', re.sub('[^a-z0-9]+', ' ', v)).strip()


def matches(spoken, phrase):
    s, e = norm(spoken), norm(phrase)
    if not e:
        return False
    if e in s:
        return True
    words = [w for w in e.split(' ') if len(w) > 1]
    if len(words) <= 1:
        return e in s.split(' ')
    return all(w in s.split(' ') for w in words)


idx_path = os.path.join(REPO, "public", "scenarios", "index.json")
with open(idx_path, encoding="utf-8") as f:
    idx = json.load(f)
builtin = {k: [] for k in ["brand", "thl", "verkehr", "wasser", "funk", "sonstige"]}
problems = 0
for mod in (gen_funk, gen_trupp, gen_neu, gen_erw_a, gen_erw_b, gen_erw_c):
    for folder, s in mod.OUT:
        builtin[folder].append(s.save(folder))
        for n in s.d["nodes"].values():
            for a in n["actions"]:
                rc = a.get("radioCall")
                if rc:
                    miss = [p for p in rc["expectedPhrases"] if not matches(rc["hint"], p)]
                    if miss:
                        problems += 1
                        print(f"{s.d['id']}/{n['id']}: hint deckt nicht ab: {miss}")
for k in builtin:
    builtin[k].sort()
idx["builtin"] = builtin
with open(idx_path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(idx, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(f"{sum(len(v) for v in builtin.values())} Szenarien geschrieben, {problems} Hinweis(e).")
sys.exit(1 if problems else 0)
