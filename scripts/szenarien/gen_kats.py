"""Katastrophenschutz: Grundausbildung Funk in der Führungsorganisation (Kapitel) und Einsatz-Szenarien
an der Aisch (Landkreis Erlangen-Höchstadt).

Quellen: Bayerisches Katastrophenschutzgesetz (Art. 6 ÖEL), KSR Bayern Nr. 8 (Führungsgruppe
Katastrophenschutz, FüGK), Brandwacht 6/2020 „Katastrophenfälle“, Handout Digitalfunk ILS Schweinfurt
(2017: Fallback-Modus, Gruppen), DLRG LV Bayern Sprechfunkanweisung (2020: Funkrufnamen ÖEL).
Funkrufnamen der Führungsstellen legt der Landkreis fest – hier mit Funktionsnamen
(„Einsatzleitung“, „Abschnitt Nord“), wie sie im Einsatz üblich sind."""
from gen_lib import K, S

OUT = []
KS = "katastrophenschutz"
HINWEIS = "\n\n> *Beispiel – Führungsstruktur und Funkrufnamen legt dein Landkreis fest.*"
HINWEIS_SIE = "\n\n> *Beispiel – Führungsstruktur und Funkrufnamen legt Ihr Landkreis fest.*"
EL = "**Einsatzleitung:**"


def status(s, nid, narrative, right, wrongs, nxt):
    s.choice(nid, narrative, [("📟 " + right, nxt)] + [("📟 " + w, None, why) for w, why in wrongs])


# ================================================================ Grundausbildung Katastrophenschutz
k = K("kats_grundausbildung", "Katastrophenschutz Grundausbildung Funk",
      "Für Einsatzkräfte in Großlagen: In 4 Kapiteln lernst du, wer im Katastrophenfall führt, wie eine Lagemeldung aufgebaut ist, wie man richtig nachfordert und was zu tun ist, wenn das Netz ausfällt.",
      KS)
k.chapter("fuehrung", "Wer führt im Katastrophenfall?", "f")
k.chapter("lage", "Die Lagemeldung", "l")
k.chapter("nachforderung", "Richtig nachfordern", "n")
k.chapter("ausfall", "Wenn das Netz ausfällt", "a")
ZF = "**Zugführer:**"

# ---------- Kapitel 1: Führung ----------
k.node("f_start",
       "Die **Aisch** steigt seit Stunden, der Landkreis hat den **Katastrophenfall** festgestellt. Du bist mit deiner Feuerwehr im Einsatz.\n\n"
       f"{ZF} „Im Katastrophenfall führt das **Landratsamt** mit seiner **Führungsgruppe Katastrophenschutz (FüGK)**. Vor Ort setzt es einen **Örtlichen Einsatzleiter (ÖEL)** ein – am Funk heißt er meist einfach **Einsatzleitung**. "
       "Das Gebiet wird in **Einsatzabschnitte** geteilt, zum Beispiel **Abschnitt Nord** in Adelsdorf und **Abschnitt Süd** in Neuhaus. **Wir melden an unseren Abschnitt** – der Abschnitt meldet an die Einsatzleitung.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "f_choice")])
k.ask("f", "Deine Gruppe im **Abschnitt Nord** braucht mehr Sandsäcke. Wen rufst du?",
      "Den Abschnitt Nord",
      [("Direkt das Landratsamt",
        "**Nicht der Dienstweg.** Würde jede Gruppe das Landratsamt rufen, bräche dort alles zusammen. Du meldest an **deinen Abschnitt**."),
       ("Die Leitstelle Nürnberg",
        "**Nicht im Katastrophenfall.** Die Leitstelle hat jetzt hunderte Notrufe. Im Einsatzgebiet führt die **Einsatzleitung** – und für dich dein **Abschnitt**.")],
      "f_speak", [1, 0, 2])
k.node("f_speak", "**Richtig!** Rufe den Abschnitt Nord. Ihr seid **Florian Neuhaus 42/1**.",
       [K.call("Abschnitt anfunken", "Abschnitt Nord von Florian Neuhaus 42/1 – kommen.",
               ["Abschnitt Nord", "42/1", "kommen"], "f_end", "f_fail", "Hier Abschnitt Nord – kommen.")])
k.retry("f_fail", "**Noch nicht ganz.** „Abschnitt Nord von Florian Neuhaus 42/1 – kommen.“", "f_speak")
k.finish("f_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Landratsamt (FüGK) → Einsatzleitung (ÖEL) → Abschnitt → Einheit.** Gemeldet wird an die nächsthöhere Stelle.")

# ---------- Kapitel 2: Lagemeldung ----------
k.node("l_start",
       "In einer Großlage weiß die Einsatzleitung nur, was ihr gemeldet wird.\n\n"
       f"{ZF} „Eine **Lagemeldung** hat immer dieselbe Reihenfolge: **Lage** – was ist los? **Eingesetzte Kräfte** – wer ist da? **Maßnahmen** – was tun wir? **Nachforderung** – was fehlt? "
       "Und immer mit **Uhrzeit**, damit man später weiß, wann das galt.“",
       [K.go("ok", "👍 Verstanden", "l_choice")])
k.ask("l", "Welche Meldung ist eine gute Lagemeldung?",
      "„14 Uhr: Aisch am Sportplatz über die Ufer, eine Gruppe vor Ort, verbauen Sandsäcke, brauchen 500 Sandsäcke.“",
      [("„Alles ganz schlimm hier, wir brauchen dringend Hilfe!“",
        "**Damit kann niemand planen.** Was ist los, wer ist da, was tut ihr, was fehlt? **Lage – Kräfte – Maßnahmen – Nachforderung.**"),
       ("„Wir brauchen 500 Sandsäcke.“",
        "**Nur die Nachforderung.** Ohne Lage weiß die Einsatzleitung nicht, wie dringend es ist und wohin.")],
      "l_speak", [2, 1, 0])
k.node("l_speak", "**Richtig!** Gib jetzt die Lagemeldung an den Abschnitt Nord: **14 Uhr**, **Aisch am Sportplatz Adelsdorf über die Ufer**, **eine Gruppe** vor Ort, **verbauen Sandsäcke**, brauchen **500 Sandsäcke**.",
       [K.call("Lage melden",
               "Abschnitt Nord von Florian Neuhaus 42/1 – Lage 14 Uhr: Aisch am Sportplatz Adelsdorf über die Ufer, eine Gruppe vor Ort, verbauen Sandsäcke, brauchen 500 Sandsäcke – kommen.",
               ["Abschnitt Nord", "42/1", "Lage", "14 Uhr", "Sportplatz Adelsdorf", "eine Gruppe", "Sandsäcke", "500", "kommen"],
               "l_end", "l_fail", "Hier Abschnitt Nord – verstanden, Sandsäcke werden angefordert – Ende.")])
k.retry("l_fail", "**Noch nicht ganz.** Lage – Kräfte – Maßnahmen – Nachforderung: „Abschnitt Nord von Florian Neuhaus 42/1 – Lage 14 Uhr: Aisch am Sportplatz Adelsdorf über die Ufer, eine Gruppe vor Ort, verbauen Sandsäcke, brauchen 500 Sandsäcke – kommen.“", "l_speak")
k.finish("l_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Uhrzeit – Lage – Kräfte – Maßnahmen – Nachforderung.**")

# ---------- Kapitel 3: Nachforderung ----------
k.node("n_start",
       "Kräfte und Material sind im Katastrophenfall knapp – sie müssen **genau dort** ankommen, wo sie gebraucht werden.\n\n"
       f"{ZF} „Eine Nachforderung beantwortet: **Was** – **wie viel** – **wohin** – **bis wann**. Und wer dort **in Empfang nimmt**. Sonst steht der Lkw mit Sandsäcken irgendwo im Dorf und niemand weiß Bescheid.“",
       [K.go("ok", "👍 Verstanden", "n_choice")])
k.ask("n", "Was fehlt in dieser Nachforderung: „Wir brauchen Pumpen.“?",
      "Wie viele, wohin, bis wann und wer sie in Empfang nimmt",
      [("Nichts – Pumpen ist eindeutig",
        "**Zu ungenau.** Eine kleine Tauchpumpe oder eine große Pumpe vom THW? Wie viele? Wohin? Ohne das kommt die falsche Hilfe an den falschen Ort."),
       ("Nur der Grund, warum wir Pumpen brauchen",
        "**Der Grund hilft, aber es fehlt mehr:** **wie viele**, **wohin**, **bis wann** und **wer** sie übernimmt.")],
      "n_speak", [0, 2, 1])
k.node("n_speak", "**Richtig!** Fordere beim Abschnitt Nord an: **zwei große Pumpen**, zur **Kläranlage Adelsdorf**, **in einer Stunde**, Einweisung durch **Florian Neuhaus 42/1** an der Zufahrt.",
       [K.call("Nachfordern",
               "Abschnitt Nord von Florian Neuhaus 42/1 – Nachforderung: zwei große Pumpen zur Kläranlage Adelsdorf, in einer Stunde, wir weisen an der Zufahrt ein – kommen.",
               ["Abschnitt Nord", "42/1", "Nachforderung", "zwei große Pumpen", "Kläranlage Adelsdorf", "in einer Stunde", "Zufahrt", "kommen"],
               "n_end", "n_fail", "Hier Abschnitt Nord – verstanden, THW wird mit zwei Pumpen geschickt – Ende.")])
k.retry("n_fail", "**Fast.** Was – wie viel – wohin – bis wann – wer übernimmt: „Abschnitt Nord von Florian Neuhaus 42/1 – Nachforderung: zwei große Pumpen zur Kläranlage Adelsdorf, in einer Stunde, wir weisen an der Zufahrt ein – kommen.“", "n_speak")
k.finish("n_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Was – wie viel – wohin – bis wann – wer übernimmt.**")

# ---------- Kapitel 4: Netzausfall ----------
k.node("a_start",
       "Bei einem großen Unwetter kann auch das Funknetz gestört sein.\n\n"
       f"{ZF} „Fällt die Verbindung eines Funkmasts zum Netz aus, geht er in den **Fallback-Modus**: Das Display meldet es. Geräte **am selben Mast** können noch miteinander sprechen, aber die **Leitstelle** und andere Gebiete erreichst du nicht mehr, und **Gruppen wechseln** geht nicht. "
       "Dann gilt, was im Einsatzbefehl steht: Wir wechseln in den **Direktbetrieb (DMO)** auf die vereinbarte Gruppe – und wichtige Meldungen bringt ein **Melder** persönlich.“",
       [K.go("ok", "👍 Verstanden", "a_choice")])
k.ask("a", "Dein Funkgerät zeigt **Fallback**, der Abschnitt antwortet nicht mehr. Was tust du?",
      "In die vereinbarte DMO-Gruppe wechseln und wichtige Meldungen per Melder schicken",
      [("Immer wieder rufen, bis jemand antwortet",
        "**Das blockiert nur.** Wenn der Abschnitt an einem anderen Mast hängt, hört er dich nicht. Wechsle in die **vereinbarte DMO-Gruppe** und nutze einen **Melder**."),
       ("Mit dem Handy die Einsatzleitung anrufen",
        "**Unsicher.** Bei großen Lagen ist das Handynetz oft genauso gestört oder überlastet. Der Plan ist: **DMO-Gruppe** und **Melder**.")],
      "a_speak", [1, 0, 2])
k.node("a_speak", "**Richtig!** Du bist in der DMO-Gruppe aus dem Einsatzbefehl. Rufe dort den Abschnitt Nord und melde: **Netz im Fallback**, ihr seid **jetzt im Direktbetrieb erreichbar**.",
       [K.call("Im Direktbetrieb melden",
               "Abschnitt Nord von Florian Neuhaus 42/1 – Netz im Fallback, sind jetzt im Direktbetrieb erreichbar – kommen.",
               ["Abschnitt Nord", "42/1", "Fallback", "Direktbetrieb", "kommen"],
               "a_end", "a_fail", "Hier Abschnitt Nord – verstanden, bleiben im Direktbetrieb – Ende.")])
k.retry("a_fail", "**Fast.** „Abschnitt Nord von Florian Neuhaus 42/1 – Netz im Fallback, sind jetzt im Direktbetrieb erreichbar – kommen.“", "a_speak")
k.finish("a_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Fallback = Leitstelle weg, Gruppenwechsel weg.** Vereinbarte DMO-Gruppe, wichtige Meldungen per Melder.\n\n"
         "**Du hast die Grundausbildung Katastrophenschutz abgeschlossen!** 🏆", last=True)
OUT.append(("katastrophenschutz", k))


# ================================================================ Hochwasser Aisch – Abschnittsleitung
s = S("kats_hochwasser_aisch", "Katastrophenschutz: Hochwasser an der Aisch",
      "Fortgeschritten: Sie leiten den Abschnitt Nord in Adelsdorf. Lage an die Einsatzleitung, THW anfordern, eine Gefahr am Damm melden und eine Evakuierung empfehlen. 4 Funk-Schritte.",
      KS, "n_lage")
s.radio("n_lage",
        "Sie leiten den **Abschnitt Nord** in **Adelsdorf**. Es ist **16 Uhr**. Die **Aisch** steht am **Sportplatz** schon auf dem Weg, **drei Feuerwehrgruppen** bauen einen Sandsackwall vor der Siedlung. Die Einsatzleitung fragt nach der Lage.\n\nGeben Sie die Lagemeldung." + HINWEIS_SIE,
        "Lagemeldung",
        ["Einsatzleitung", "Abschnitt Nord", "16 Uhr", "Aisch", "Sportplatz", "drei Gruppen", "Sandsackwall", "kommen"],
        "Einsatzleitung von Abschnitt Nord – Lage 16 Uhr: Aisch am Sportplatz über den Weg, drei Gruppen im Einsatz, bauen Sandsackwall vor der Siedlung – kommen.",
        "Anruf . „Lage“ + Uhrzeit . was los ist (Aisch am Sportplatz) . Kräfte (drei Gruppen) . Maßnahme (Sandsackwall) . „kommen“",
        "n_thw",
        "Lagemeldung in der richtigen Reihenfolge.",
        "Melden Sie: 16 Uhr, Aisch am Sportplatz, drei Gruppen, Sandsackwall.",
        "**Uhrzeit – Lage – Kräfte – Maßnahmen.** So kann die Einsatzleitung alle Abschnitte vergleichen.")
s.radio("n_thw",
        "Die Keller in der Siedlung laufen voll, Ihre Tragkraftspritzen reichen nicht. Sie brauchen das **THW** mit **zwei großen Pumpen** am **Feuerwehrhaus Adelsdorf**, möglichst **in einer Stunde**.",
        "THW anfordern",
        ["Einsatzleitung", "Abschnitt Nord", "Nachforderung", "THW", "zwei große Pumpen", "Feuerwehrhaus Adelsdorf", "in einer Stunde", "kommen"],
        "Einsatzleitung von Abschnitt Nord – Nachforderung: THW mit zwei großen Pumpen, Treffpunkt Feuerwehrhaus Adelsdorf, in einer Stunde – kommen.",
        "Anruf . „Nachforderung“ . wer/was (THW, zwei große Pumpen) . wohin (Feuerwehrhaus Adelsdorf) . bis wann (in einer Stunde) . „kommen“",
        "n_damm",
        "Nachforderung vollständig: was, wie viel, wohin, bis wann.",
        "Fordern Sie an: THW, zwei große Pumpen, Feuerwehrhaus Adelsdorf, in einer Stunde.",
        "Mit **Treffpunkt** und **Zeit** kann das THW sofort losfahren, ohne nachzufragen.")
s.radio("n_damm",
        "Ein Gruppenführer meldet Ihnen: Am **Damm hinter der Siedlung** tritt auf **20 Metern Wasser durch**, der Boden wird **weich**. Wenn der Damm bricht, steht die Siedlung unter Wasser. Das muss **sofort** zur Einsatzleitung.",
        "Gefahr melden",
        ["Einsatzleitung", "Abschnitt Nord", "Achtung", "Damm", "20 Meter", "Wasser tritt durch", "kommen"],
        "Einsatzleitung von Abschnitt Nord – Achtung: Damm hinter der Siedlung, auf 20 Meter tritt Wasser durch, Boden wird weich – kommen.",
        "Anruf . „Achtung“ . wo (Damm hinter der Siedlung) . was (auf 20 Meter tritt Wasser durch, Boden weich) . „kommen“",
        "n_evakuierung",
        "Gefahr sofort, knapp und genau gemeldet.",
        "Melden Sie sofort: Achtung, Damm, 20 Meter, Wasser tritt durch.",
        "Eine **Gefahr** geht **vor** jeder anderen Meldung.")
s.radio("n_evakuierung",
        f"{EL} „Abschnitt Nord – verstanden. Ihre Empfehlung? – kommen.“\n\nIn der Siedlung wohnen **etwa 80 Menschen**, darunter **mehrere Ältere**, die nicht gut gehen können. Sie empfehlen die **Evakuierung** und brauchen dafür **Busse** und einen **Krankentransport**.",
        "Evakuierung empfehlen",
        ["Abschnitt Nord", "empfehle Evakuierung", "80 Personen", "Busse", "Krankentransport", "kommen"],
        "Hier Abschnitt Nord – empfehle Evakuierung der Siedlung, etwa 80 Personen, darunter mehrere gehbehindert, brauchen Busse und Krankentransport – kommen.",
        "„hier Abschnitt Nord“ . Empfehlung („empfehle Evakuierung“) . wie viele (etwa 80 Personen) . Besonderheit (gehbehindert) . Bedarf (Busse, Krankentransport) . „kommen“",
        "n_end",
        "Klare Empfehlung mit Zahl und Bedarf – die Einsatzleitung kann entscheiden.",
        "Empfehlen Sie: Evakuierung, etwa 80 Personen, Busse und Krankentransport.",
        "Die **Entscheidung** trifft die Einsatzleitung – Ihre Meldung muss alles enthalten, was sie dafür braucht.")
s.end(f"{EL} „Evakuierung wird angeordnet, Busse kommen zum Sportplatz – Ende.“\n\n"
      "Lage, Nachforderung, Gefahr und Empfehlung – jede Meldung an die richtige Stelle und vollständig.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("katastrophenschutz", s))


# ================================================================ Stromausfall – Fallback / Melder
s = S("kats_stromausfall", "Katastrophenschutz: Stromausfall – Funk im Fallback",
      "Fortgeschritten: Großflächiger Stromausfall, das Feuerwehrhaus wird Anlaufstelle für die Bevölkerung, dann geht das Funknetz in den Fallback. Richtig reagieren und den Notruf eines Bürgers weitergeben. 3 Funk-Schritte.",
      KS, "n_anlauf")
s.radio("n_anlauf",
        "Seit zwei Stunden ist im ganzen Landkreis der **Strom weg**. Telefon und Handy funktionieren kaum noch. Ihr **Feuerwehrhaus Neuhaus** ist laut Alarmplan **Anlaufstelle** für die Bevölkerung, das Notstromaggregat läuft.\n\n"
        "Sie sind **Florian Neuhaus 42/1**. Melden Sie dem **Abschnitt Süd**, dass die Anlaufstelle **besetzt** ist." + HINWEIS_SIE,
        "Anlaufstelle melden",
        ["Abschnitt Süd", "42/1", "Anlaufstelle", "Feuerwehrhaus Neuhaus", "besetzt", "Notstrom", "kommen"],
        "Abschnitt Süd von Florian Neuhaus 42/1 – Anlaufstelle Feuerwehrhaus Neuhaus besetzt, Notstrom läuft – kommen.",
        "Anruf . was (Anlaufstelle Feuerwehrhaus Neuhaus) . Zustand (besetzt, Notstrom läuft) . „kommen“",
        "n_fallback",
        "Die Führung weiß jetzt, wo die Bevölkerung Hilfe bekommt.",
        "Melden Sie: Anlaufstelle Feuerwehrhaus Neuhaus besetzt, Notstrom läuft.",
        "Bei Stromausfall ist das **Feuerwehrhaus** oft der einzige Ort, an dem Bürger einen Notruf absetzen können.")
s.choice("n_fallback",
         "Nach einer Stunde zeigt Ihr Funkgerät **Fallback**. Der Abschnitt Süd antwortet nicht mehr. Im Einsatzbefehl steht: **Bei Netzausfall DMO-Gruppe 307**.\n\nWas tun Sie?",
         [("📟 In die DMO-Gruppe 307 wechseln und dort den Abschnitt rufen", "n_dmo"),
          ("📟 Weiter im Netz rufen, bis der Abschnitt antwortet", None, "Im **Fallback** erreichen Sie nur Geräte am **selben Mast**. Der Plan aus dem Einsatzbefehl gilt: **DMO-Gruppe 307**."),
          ("📟 Eine andere Netzgruppe einstellen", None, "Im **Fallback** lassen sich **keine Gruppen schalten** – und es würde nichts bringen. Wechseln Sie in die **vereinbarte DMO-Gruppe**.")])
s.radio("n_dmo",
        "Sie sind in **DMO 307**. Der Abschnitt Süd ist nur **zwei Kilometer** entfernt – in DMO reicht das gerade so. Melden Sie sich.",
        "Im Direktbetrieb melden",
        ["Abschnitt Süd", "42/1", "Fallback", "Direktbetrieb", "Anlaufstelle", "kommen"],
        "Abschnitt Süd von Florian Neuhaus 42/1 – Netz im Fallback, sind im Direktbetrieb erreichbar, Anlaufstelle weiter besetzt – kommen.",
        "Anruf . „Netz im Fallback“ . „im Direktbetrieb erreichbar“ . Anlaufstelle weiter besetzt . „kommen“",
        "n_notruf",
        "Erreichbarkeit im Direktbetrieb gemeldet.",
        "Melden Sie: Fallback, im Direktbetrieb erreichbar, Anlaufstelle besetzt.",
        "Jetzt weiß der Abschnitt, **wie** er Sie erreicht.")
s.radio("n_notruf",
        "Ein Mann kommt ins Feuerwehrhaus: Seine Frau ist zu Hause **im Lindenweg 3** **gestürzt**, sie **blutet am Kopf** und ist **ansprechbar**. Ein Telefon geht nicht. Geben Sie den Notruf an den Abschnitt weiter, damit der Rettungsdienst kommt.",
        "Notruf weitergeben",
        ["Abschnitt Süd", "42/1", "Notruf", "Lindenweg 3", "gestürzt", "blutet am Kopf", "ansprechbar", "Rettungsdienst", "kommen"],
        "Abschnitt Süd von Florian Neuhaus 42/1 – Notruf: Neuhaus, Lindenweg 3, Frau gestürzt, blutet am Kopf, ansprechbar, bitte Rettungsdienst – kommen.",
        "Anruf . „Notruf“ . wo (Neuhaus, Lindenweg 3) . was (gestürzt, blutet am Kopf) . Zustand (ansprechbar) . „bitte Rettungsdienst“ . „kommen“",
        "n_end",
        "Notruf vollständig weitergegeben – der Abschnitt kann den Rettungsdienst schicken.",
        "Geben Sie weiter: Notruf, Lindenweg 3, gestürzt, blutet am Kopf, ansprechbar, Rettungsdienst.",
        "Bei Stromausfall sind Sie **das Telefon** der Bürger – die Meldung muss so vollständig sein wie ein Notruf bei 112.")
s.end("Der Abschnitt schickt **Rotkreuz Höchstadt 71/1** in den Lindenweg.\n\n"
      "Anlaufstelle gemeldet, im Fallback nach Plan in DMO gewechselt und einen Notruf vollständig weitergegeben.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("katastrophenschutz", s))


# ================================================================ Evakuierung / Betreuungsstelle
s = S("kats_betreuungsstelle", "Katastrophenschutz: Evakuierung und Betreuungsstelle",
      "Einsteiger: Sie leiten die Betreuungsstelle in der Turnhalle Höchstadt. Ankunft melden, Personen zählen, Bedarf anfordern und abmelden. 3 Funk-Schritte.",
      KS, "n_bereit")
s.radio("n_bereit",
        "Wegen des Hochwassers wird eine Siedlung evakuiert. Sie leiten die **Betreuungsstelle** in der **Turnhalle Höchstadt**: Feldbetten, Decken, warme Getränke. Alles ist aufgebaut.\n\n"
        "Melden Sie der **Einsatzleitung**, dass die Betreuungsstelle **bereit** ist und für **wie viele** Menschen Platz hat: **120**." + HINWEIS_SIE,
        "Bereitschaft melden",
        ["Einsatzleitung", "Betreuungsstelle", "Turnhalle Höchstadt", "bereit", "120", "kommen"],
        "Einsatzleitung von Betreuungsstelle – Turnhalle Höchstadt ist bereit, Platz für 120 Personen – kommen.",
        "Anruf . wo (Turnhalle Höchstadt) . „bereit“ . Kapazität (Platz für 120 Personen) . „kommen“",
        "n_ankunft",
        "Bereitschaft und Kapazität gemeldet – die Einsatzleitung kann die Busse schicken.",
        "Melden Sie: Turnhalle Höchstadt bereit, Platz für 120 Personen.",
        "Mit der **Kapazität** weiß die Einsatzleitung, ob sie eine zweite Betreuungsstelle braucht.")
s.radio("n_ankunft",
        "Der erste Bus ist da. Sie zählen **42 Personen**, davon **6 Kinder**. Eine ältere Frau braucht **ihre Medikamente**, die sie zu Hause vergessen hat. Namen nennen Sie **nicht** über Funk – die Liste mit Namen bleibt bei Ihnen.",
        "Ankunft melden",
        ["Einsatzleitung", "Betreuungsstelle", "42 Personen", "6 Kinder", "Medikamente", "kommen"],
        "Einsatzleitung von Betreuungsstelle – erster Bus angekommen, 42 Personen, davon 6 Kinder, eine Person braucht Medikamente – kommen.",
        "Anruf . was (erster Bus angekommen) . Zahl (42 Personen, 6 Kinder) . Besonderheit (eine Person braucht Medikamente) . „kommen“",
        "n_bedarf",
        "Zahlen ohne Namen gemeldet – richtig so.",
        "Melden Sie: 42 Personen, 6 Kinder, eine Person braucht Medikamente.",
        "Die Einsatzleitung **zählt**: Wer evakuiert wurde und wo er ist. **Namen** gehören auf die Liste, nicht in den Funk.")
s.radio("n_bedarf",
        "Es wird eine lange Nacht. Sie brauchen für **morgen früh** **Frühstück für 120 Personen** und einen **Arzt**, der sich um die Medikamente kümmert.",
        "Bedarf anfordern",
        ["Einsatzleitung", "Betreuungsstelle", "Nachforderung", "Frühstück", "120 Personen", "Arzt", "kommen"],
        "Einsatzleitung von Betreuungsstelle – Nachforderung: Frühstück für 120 Personen bis morgen 7 Uhr, außerdem einen Arzt in die Turnhalle – kommen.",
        "Anruf . „Nachforderung“ . was (Frühstück für 120 Personen, Arzt) . bis wann (morgen 7 Uhr) . wohin (Turnhalle) . „kommen“",
        "n_end",
        "Bedarf mit Menge, Zeit und Ort angefordert.",
        "Fordern Sie an: Frühstück für 120 Personen bis morgen früh, einen Arzt.",
        "Verpflegung für viele Menschen braucht **Vorlauf** – deshalb früh und mit **Uhrzeit** anfordern.")
s.end("Die Einsatzleitung bestätigt Frühstück und Arzt.\n\nBereitschaft mit Kapazität, Zahlen ohne Namen und ein Bedarf mit Menge und Uhrzeit – so läuft eine Betreuungsstelle.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("katastrophenschutz", s))
