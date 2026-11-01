import json, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROOT = os.path.join(REPO, "public", "scenarios", "builtin")
SPECIAL = {"__exit__", "__chapters__", "__next_chapter__"}


class S:
    def __init__(self, sid, title, desc, role, start):
        self.d = {"id": sid, "title": title, "description": desc,
                  "startingNodeId": start, "playerRole": role, "nodes": {}}
        self.role = role
        self.start = start

    def _node(self, nid, narrative, actions):
        assert nid not in self.d["nodes"], nid
        self.d["nodes"][nid] = {"id": nid, "role": self.role,
                                "narrative": narrative, "actions": actions}

    def radio(self, nid, narrative, label, phrases, hint, briefing, nxt,
              ok, fail, explain):
        fid = nid + "_fail"
        self._node(nid, narrative, [{
            "id": "radio_" + nid[2:], "label": "📞 " + label,
            "radioCall": {
                "expectedPhrases": phrases, "hint": hint, "briefing": briefing,
                "onSuccess": nxt, "onFailure": fid,
                "feedbackSuccess": "✅ " + ok, "feedbackFailure": "❌ " + fail}}])
        self._node(fid, "**Feedback:** " + explain + "\n\nBeispiel: *„" + hint + "“*",
                   [{"id": "retry", "label": "🔄 Erneut versuchen", "nextNodeId": nid}])

    def choice(self, nid, narrative, options):
        """options: (label, next_id) richtig  |  (label, None, erklaerung) falsch"""
        actions = []
        for i, opt in enumerate(options):
            if opt[1] is not None:
                actions.append({"id": f"opt{i}", "label": opt[0], "nextNodeId": opt[1]})
            else:
                wid = f"{nid}_x{i}"
                actions.append({"id": f"opt{i}", "label": opt[0], "nextNodeId": wid})
                self._node(wid, "**Nicht richtig.** " + opt[2],
                           [{"id": "retry", "label": "🔄 Zurück zur Entscheidung", "nextNodeId": nid}])
        self._node(nid, narrative, actions)

    def info(self, nid, narrative, label, nxt):
        self._node(nid, narrative, [{"id": "weiter", "label": label, "nextNodeId": nxt}])

    def end(self, narrative):
        self._node("n_end", narrative, [
            {"id": "restart", "label": "🔄 Noch einmal trainieren", "nextNodeId": self.start},
            {"id": "exit", "label": "← Zur Übersicht", "nextNodeId": "__exit__"}])

    def save(self, folder):
        nodes = self.d["nodes"]
        assert self.start in nodes
        for n in nodes.values():
            for a in n["actions"]:
                for t in [a.get("nextNodeId"), (a.get("radioCall") or {}).get("onSuccess"),
                          (a.get("radioCall") or {}).get("onFailure")]:
                    assert t is None or t in SPECIAL or t in nodes, (self.d["id"], n["id"], t)
        path = os.path.join(ROOT, folder, self.d["id"] + ".json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(self.d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        return f"builtin/{folder}/{self.d['id']}.json"


class K(S):
    """Szenario mit Kapiteln (Grundausbildung): je Kapitel Erklärung → Auswahl → selbst sprechen."""

    def __init__(self, sid, title, desc, role):
        super().__init__(sid, title, desc, role, None)
        nodes = self.d.pop("nodes")
        self.d["chapters"] = []
        self.d["nodes"] = nodes

    def chapter(self, cid, title, prefix):
        if not self.d["chapters"]:
            self.start = self.d["startingNodeId"] = prefix + "_start"
        self.d["chapters"].append({"id": cid, "title": title,
                                   "startNodeId": prefix + "_start", "endNodeId": prefix + "_end"})

    @staticmethod
    def go(aid, label, target, **kw):
        return {"id": aid, "label": label, "nextNodeId": target, **kw}

    @staticmethod
    def call(label, hint, expected, ok, fail, response):
        return {"id": "funk", "label": label, "radioCall": {
            "hint": hint, "expectedPhrases": expected, "onSuccess": ok, "onFailure": fail, "response": response}}

    def node(self, nid, narrative, actions):
        self._node(nid, narrative, actions)

    def ask(self, prefix, question, right, wrongs, right_target, order):
        """Auswahl aus drei: richtige Option + zwei typische Fehler mit Erklär-Knoten."""
        opts = [(right, right_target)] + [(w, f"{prefix}_x{i+1}") for i, (w, _) in enumerate(wrongs)]
        self._node(f"{prefix}_choice", question,
                   [self.go(f"opt{j}", opts[i][0], opts[i][1]) for j, i in enumerate(order)])
        for i, (_, why) in enumerate(wrongs):
            self._node(f"{prefix}_x{i+1}", why, [self.go("retry", "🔄 Zurück zur Auswahl", f"{prefix}_choice")])

    def retry(self, nid, why, target):
        self._node(nid, why, [self.go("retry", "🔄 Nochmal versuchen", target)])

    def finish(self, nid, text, last=False):
        acts = [] if last else [self.go("next", "Nächstes Kapitel ▶", "__next_chapter__")]
        acts.append(self.go("menu", "📋 Zur Kapitelauswahl", "__chapters__"))
        if last:
            acts.append(self.go("exit", "🏁 Beenden", "__exit__"))
        self._node(nid, text, acts)
