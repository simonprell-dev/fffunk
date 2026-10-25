import json, os

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ROOT = os.path.join(REPO, "public", "scenarios", "builtin")


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
                    assert t is None or t == "__exit__" or t in nodes, (self.d["id"], n["id"], t)
        path = os.path.join(ROOT, folder, self.d["id"] + ".json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(self.d, f, ensure_ascii=False, indent=2)
            f.write("\n")
        return f"builtin/{folder}/{self.d['id']}.json"
