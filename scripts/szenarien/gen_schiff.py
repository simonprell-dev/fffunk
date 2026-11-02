"""Schifffahrt & Wasserrettung: Grundausbildung Sprechfunk am Wasser (Kapitel) und Einsatz-Szenarien
am Main-Donau-Kanal bei Erlangen.

Quellen: Landesrechtliche Ergänzung der Sprechfunk-Dienstanweisung DLRG LV Bayern V3.1 (2020) –
Kennwort „Pelikan“, Kennzahlen 91 Gerätewagen Wasserrettung, 98 Wasserretter, 99 Boot;
Handout Digitalfunk ILS Schweinfurt (2017) – FMS-Status; Brandwacht 2016 „Schiffsunfall Erlangen“
und Übung „Poseidon“ (Main-Donau-Kanal, 2018). Binnenschiffe funken nicht im BOS-Netz – eine
Sperrung der Schifffahrt läuft über die Leitstelle und die Wasserstraßen- und Schifffahrtsverwaltung."""
from gen_lib import K, S

OUT = []
WR = "wasserrettung"
HINWEIS = "\n\n> *Beispiel nach bayerischer Regelung – Rufnamen und Abläufe können in deiner Gliederung abweichen.*"
HINWEIS_SIE = "\n\n> *Beispiel nach bayerischer Regelung – Rufnamen und Abläufe können in Ihrer Gliederung abweichen.*"
ILS = "**Leitstelle Nürnberg:**"
BOOT = "Pelikan Erlangen 99/1"


def status(s, nid, narrative, right, wrongs, nxt):
    """Status am Funkgerät drücken: richtige Taste + typische Verwechslungen."""
    s.choice(nid, narrative, [("📟 " + right, nxt)] + [("📟 " + w, None, why) for w, why in wrongs])


# ================================================================ Grundausbildung Wasserrettung
k = K("schiff_grundausbildung", "Wasserrettung Grundausbildung Sprechfunk",
      "Für neue Bootsbesatzungen: In 4 Kapiteln lernst du Pelikan-Rufnamen, Ortsangaben am Wasser, die Meldung „Person im Wasser“ und wie man die Schifffahrt sperren lässt.",
      WR)
k.chapter("rufnamen", "Rufnamen am Wasser", "r")
k.chapter("ortsangabe", "Ortsangaben am Wasser", "o")
k.chapter("person", "Person im Wasser melden", "p")
k.chapter("sperrung", "Schifffahrt sperren lassen", "z")
BF = "**Bootsführer:**"

# ---------- Kapitel 1: Rufnamen ----------
k.node("r_start",
       "Dienst an der Wasserrettungsstation am **Main-Donau-Kanal**. Du fährst heute als Bootsgast auf dem Rettungsboot der DLRG.\n\n"
       f"{BF} „Die DLRG funkt in Bayern mit dem Kennwort **Pelikan**, dann der Standort, dann die Kennzahlen. Die **99** steht für ein **Boot**, die **98** für **Wasserretter** zu Fuß, die **91** für den **Gerätewagen Wasserrettung**. "
       f"Unser Boot ist also **{BOOT}** – gesprochen „neunundneunzig – eins“.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "r_choice")])
k.ask("r", "Wer meldet sich mit **Pelikan Erlangen 98/2**?",
      "Ein Wasserretter-Trupp am Ufer (98 = Wasserretter)",
      [("Das zweite Rettungsboot",
        "**Nicht ganz.** Boote haben die **99**. Die **98** steht für **Wasserretter** – Rettungsschwimmer, die vom Ufer aus arbeiten."),
       ("Der Gerätewagen Wasserrettung",
        "**Nicht ganz.** Der Gerätewagen hat die **91**. **98** sind die **Wasserretter**.")],
      "r_speak", [2, 0, 1])
k.node("r_speak", "**Richtig!** Rufe jetzt vom Boot aus den Wasserretter-Trupp **Pelikan Erlangen 98/2**.",
       [K.call("Wasserretter anfunken", f"Pelikan Erlangen 98/2 von {BOOT} – kommen.",
               ["Pelikan", "98/2", "99/1", "kommen"], "r_end", "r_fail", "Hier Pelikan Erlangen 98/2 – kommen.")])
k.retry("r_fail", f"**Noch nicht ganz.** Erst der Gerufene, dann „von“ und du: „Pelikan Erlangen 98/2 von {BOOT} – kommen.“", "r_speak")
k.finish("r_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Pelikan – Standort – Kennzahl.** 91 Gerätewagen, 98 Wasserretter, 99 Boot.")

# ---------- Kapitel 2: Ortsangaben am Wasser ----------
k.node("o_start",
       "Am Wasser gibt es keine Hausnummern.\n\n"
       f"{BF} „Wir geben den Ort mit **festen Punkten** an: **Brücke, Schleuse, Hafen** oder der **Kilometertafel** am Ufer. Dazu das **Ufer**: **rechts und links gelten immer in Fließrichtung** – also mit Blick **talwärts**, wohin das Wasser fließt. "
       "Am Kanal sagen wir dazu **zu Berg** oder **zu Tal**, wenn sich ein Schiff bewegt.“",
       [K.go("ok", "👍 Verstanden", "o_choice")])
k.ask("o", "Was heißt **rechtes Ufer**?",
      "Rechts, wenn man in Fließrichtung (talwärts) schaut",
      [("Das Ufer, das von meinem Boot aus rechts liegt",
        "**Gefährlich.** Dreht das Boot, wechselt dein „rechts“. Damit alle dasselbe meinen, gilt **immer die Fließrichtung**."),
       ("Das Ufer auf der Seite der Stadt",
        "**Zu ungenau.** Das versteht nur, wer sich auskennt. Eindeutig ist: **rechts in Fließrichtung**.")],
      "o_speak", [1, 2, 0])
k.node("o_speak", f"**Richtig!** Melde deinem Bootsführer am Funk: Du siehst ein **treibendes Kanu**, **Höhe Brücke Möhrendorf**, **rechtes Ufer**.",
       [K.call("Ort melden", f"Bootsführer von Bootsgast – treibendes Kanu Höhe Brücke Möhrendorf, rechtes Ufer – kommen.",
               ["Bootsführer", "Bootsgast", "Kanu", "Brücke Möhrendorf", "rechtes Ufer", "kommen"], "o_end", "o_fail",
               "Hier Bootsführer – verstanden, fahren hin – Ende.")])
k.retry("o_fail", "**Fast.** Fester Punkt plus Ufer: „Bootsführer von Bootsgast – treibendes Kanu Höhe Brücke Möhrendorf, rechtes Ufer – kommen.“", "o_speak")
k.finish("o_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Fester Punkt + Ufer in Fließrichtung.** Bei Schiffen dazu: **zu Berg** oder **zu Tal**.")

# ---------- Kapitel 3: Person im Wasser ----------
k.node("p_start",
       "Eine Person im Wasser ist **in Minuten** in Lebensgefahr – kaltes Wasser, Strömung, Sog von Schiffen.\n\n"
       f"{BF} „Wer eine Person im Wasser sieht, **ruft laut**, **zeigt mit dem Arm** auf sie und **lässt sie nicht mehr aus den Augen**. Gemeldet wird: **Person im Wasser – wo – treibt wohin – bei Bewusstsein oder nicht**.“",
       [K.go("ok", "👍 Verstanden", "p_choice")])
k.ask("p", "Du entdeckst eine Person im Wasser. Was tust du **zuerst**?",
      "Laut rufen, auf die Person zeigen und sie nicht aus den Augen lassen",
      [("Zum Funkgerät greifen und eine vollständige Meldung absetzen",
        "**Noch nicht.** Wer den Blick abwendet, verliert die Person oft für immer. **Zuerst** rufen und zeigen – der Bootsführer kann dann funken."),
       ("Sofort ins Wasser springen",
        "**Gefährlich.** Ungesichert wirst du selbst zum Opfer. Das Boot fährt hin, gerettet wird nach Absprache und gesichert.")],
      "p_speak", [0, 2, 1])
k.node("p_speak", f"**Richtig!** Der Bootsführer steuert hin, du hältst Sichtkontakt. Melde jetzt an die Leitstelle: **Person im Wasser**, **Höhe Schleuse Erlangen**, **linkes Ufer**, **treibt talwärts**, **reagiert nicht**.",
       [K.call("Person im Wasser melden",
               f"Leitstelle Nürnberg von {BOOT} – Person im Wasser, Höhe Schleuse Erlangen, linkes Ufer, treibt talwärts, reagiert nicht – kommen.",
               ["Leitstelle Nürnberg", "99/1", "Person im Wasser", "Schleuse Erlangen", "linkes Ufer", "talwärts", "reagiert nicht", "kommen"],
               "p_end", "p_fail", f"{BOOT} von Leitstelle Nürnberg – verstanden, Rettungsdienst und Notarzt kommen zur Schleuse – Ende.")])
k.retry("p_fail", f"**Noch nicht ganz.** „Leitstelle Nürnberg von {BOOT} – Person im Wasser, Höhe Schleuse Erlangen, linkes Ufer, treibt talwärts, reagiert nicht – kommen.“", "p_speak")
k.finish("p_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Rufen – zeigen – nicht aus den Augen lassen.** Dann melden: wo, treibt wohin, Zustand.")

# ---------- Kapitel 4: Schifffahrt sperren ----------
k.node("z_start",
       "Auf dem Main-Donau-Kanal fahren **Frachtschiffe mit über 100 Metern Länge**. Ein solches Schiff braucht hunderte Meter, um anzuhalten, und sein Sog zieht kleine Boote und Schwimmer an.\n\n"
       f"{BF} „Binnenschiffe sind **nicht** in unserem Digitalfunk – die funken auf eigenen Kanälen. Wenn wir im Fahrwasser arbeiten müssen, bitten wir die **Leitstelle**, die **Schifffahrt sperren** zu lassen. Die Leitstelle sagt der Schifffahrtsverwaltung Bescheid, und die hält die Schiffe an.“",
       [K.go("ok", "👍 Verstanden", "z_choice")])
k.ask("z", "Ihr müsst mitten im Kanal suchen, ein Frachter kommt zu Tal. Wie stoppt ihr ihn?",
      "Über die Leitstelle die Sperrung der Schifffahrt anfordern",
      [("Den Frachter direkt über unser Funkgerät rufen",
        "**Geht nicht.** Das Schiff hört unser BOS-Netz nicht. Der Weg führt über die **Leitstelle**."),
       ("Mit dem Boot quer vor den Frachter fahren",
        "**Lebensgefährlich.** Der Frachter kann nicht schnell bremsen oder ausweichen. Sperren lässt man **über die Leitstelle**.")],
      "z_speak", [1, 0, 2])
k.node("z_speak", f"**Richtig!** Fordere jetzt bei der Leitstelle an: **Schifffahrt sperren** zwischen **Schleuse Erlangen** und **Brücke Möhrendorf**, Grund: **Suche nach einer Person**.",
       [K.call("Sperrung anfordern",
               f"Leitstelle Nürnberg von {BOOT} – bitte Schifffahrt sperren zwischen Schleuse Erlangen und Brücke Möhrendorf, wir suchen eine Person im Wasser – kommen.",
               ["Leitstelle Nürnberg", "99/1", "Schifffahrt sperren", "Schleuse Erlangen", "Brücke Möhrendorf", "Person", "kommen"],
               "z_end", "z_fail", f"{BOOT} von Leitstelle Nürnberg – Sperrung wird veranlasst, ich melde mich, wenn sie steht – Ende.")])
k.retry("z_fail", f"**Fast.** Was, von wo bis wo, warum: „Leitstelle Nürnberg von {BOOT} – bitte Schifffahrt sperren zwischen Schleuse Erlangen und Brücke Möhrendorf, wir suchen eine Person im Wasser – kommen.“", "z_speak")
k.finish("z_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Schiffe hören uns nicht.** Sperrung immer über die Leitstelle anfordern – **von wo bis wo** und **warum**.\n\n"
         "**Du hast die Grundausbildung Wasserrettung abgeschlossen!** 🏆", last=True)
OUT.append(("schifffahrt", k))


# ================================================================ Person im Wasser
s = S("schiff_person_im_wasser", "Wasserrettung: Person im Main-Donau-Kanal",
      "Einsteiger: Mit dem Rettungsboot eine Person im Kanal suchen, finden und an den Rettungsdienst übergeben – Status, Sperrung der Schifffahrt und Lagemeldungen. 3 Funk-Schritte.",
      WR, "n_alarm")
status(s, "n_alarm",
       f"Sie sind Bootsführer auf **{BOOT}**. Alarm: **Person im Wasser, Main-Donau-Kanal Höhe Möhrendorf**, ein Passant hat sie gesehen. Das Boot ist auf dem Trailer, Sie fahren zur Einsatzstelle. Welchen Status drücken Sie?" + HINWEIS_SIE,
       "Status 3 – Einsatz übernommen",
       [("Status 4", "**4** kommt erst, wenn Sie **an der Einsatzstelle** sind."), ("Status 1", "**1** heißt frei über Funk – Sie sind im Einsatz.")],
       "n_sperrung")
s.radio("n_sperrung",
        "Sie slippen das Boot an der Brücke Möhrendorf. Der Passant zeigt in die Kanalmitte – von der Person ist **nichts mehr zu sehen**. Ein **Frachter** ist zu Tal unterwegs.\n\nFordern Sie die Sperrung der Schifffahrt an.",
        "Sperrung anfordern",
        ["Leitstelle Nürnberg", "99/1", "Schifffahrt sperren", "Brücke Möhrendorf", "Suche", "kommen"],
        f"Leitstelle Nürnberg von {BOOT} – bitte Schifffahrt sperren ab Brücke Möhrendorf talwärts, wir beginnen die Suche – kommen.",
        "Anruf . „bitte Schifffahrt sperren“ . Bereich (ab Brücke Möhrendorf talwärts) . Grund (Suche) . „kommen“",
        "n_status4",
        "Sperrung mit Bereich und Grund angefordert.",
        "Fordern Sie an: Schifffahrt sperren, ab Brücke Möhrendorf, Grund Suche.",
        "Ohne Sperrung bringt der Frachter Sie und die Person in Gefahr – und er hört Ihr Funkgerät nicht.")
status(s, "n_status4", f"{ILS} „Sperrung ist veranlasst – Ende.“ Das Boot ist im Wasser, Sie beginnen zu suchen. Welcher Status?",
       "Status 4 – an der Einsatzstelle",
       [("Status 7", "**7** heißt Patient aufgenommen – Sie suchen noch."), ("Gar keiner, wir sind ja auf dem Wasser", "Auch auf dem Wasser braucht die Leitstelle Ihren **Status** – sie plant damit Rettungsdienst und Notarzt.")],
       "n_fund")
s.radio("n_fund",
        "Nach zehn Minuten sieht Ihr Bootsgast eine Person **am linken Ufer, 200 Meter unterhalb der Brücke**, sie hält sich an einem Ast fest und **ist ansprechbar**. Sie nehmen sie ins Boot: stark **unterkühlt**, keine sichtbaren Verletzungen.\n\n"
        "Melden Sie das der Leitstelle und sagen Sie, **wo** Sie die Person an Land bringen.",
        "Fund melden",
        ["Leitstelle Nürnberg", "99/1", "Person gerettet", "ansprechbar", "unterkühlt", "Brücke Möhrendorf", "Rettungsdienst", "kommen"],
        f"Leitstelle Nürnberg von {BOOT} – Person gerettet, ansprechbar, stark unterkühlt, wir bringen sie zur Slipstelle Brücke Möhrendorf, bitte Rettungsdienst dorthin – kommen.",
        "Anruf . „Person gerettet“ . Zustand (ansprechbar, unterkühlt) . Übergabeort (Slipstelle Brücke Möhrendorf) . „bitte Rettungsdienst dorthin“ . „kommen“",
        "n_end",
        "Zustand und Übergabeort gemeldet – der Rettungsdienst fährt direkt an die richtige Stelle.",
        "Melden Sie: gerettet, ansprechbar, unterkühlt, Übergabe an der Brücke Möhrendorf, Rettungsdienst dorthin.",
        "Am Wasser ist der **Übergabeort** entscheidend – sonst wartet der RTW am falschen Ufer.")
s.end("Der Rettungsdienst übernimmt an der Slipstelle. Sie melden der Leitstelle noch, dass die **Sperrung aufgehoben** werden kann.\n\n"
      "Status gedrückt, Schifffahrt gesperrt, Fund mit Übergabeort gemeldet – so arbeitet eine Bootsbesatzung.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("schifffahrt", s))


# ================================================================ Havarie Frachter / Öl
s = S("schiff_havarie_frachter", "Schifffahrt: Frachter leckgeschlagen – Öl auf dem Kanal",
      "Fortgeschritten: Ein Frachter läuft voll Wasser, Öl tritt aus. Sie erkunden mit dem Boot, melden die Lage nach Schema und fordern Ölsperre und Sperrung an. 3 Funk-Schritte.",
      WR, "n_erkunden")
s.choice("n_erkunden",
         f"Einsatz für **{BOOT}**: Ein **Frachter** hat oberhalb der **Schleuse Erlangen** festgemacht, der **Maschinenraum läuft voll Wasser**. Die Feuerwehr ist an Land, Sie sollen vom Wasser aus **erkunden**.\n\n"
         "Sie umrunden das Schiff. Was ist für Ihre Meldung am wichtigsten?" + HINWEIS_SIE,
         [("Personen an Bord, Gefahren (Öl, Schlagseite) und ob das Schiff sicher festgemacht ist", "n_lage"),
          ("Name der Reederei und Ladung im Detail", None, "Das klärt die Schifffahrtsverwaltung mit dem Schiffsführer. Für die **Einsatzleitung** zählen zuerst **Menschen und Gefahren**."),
          ("Wie lange der Kanal gesperrt bleiben muss", None, "Das kann noch niemand sagen. Melden Sie, was Sie **sehen**: Personen, Öl, Schlagseite, Festmachen.")])
s.radio("n_lage",
        "Sie sehen: **zwei Personen** an Bord, unverletzt. Das Schiff hat **leichte Schlagseite**, ist aber fest vertäut. Am Heck läuft ein **Ölfilm** aus, etwa **50 Meter** lang, er treibt **Richtung Schleuse**.\n\nMelden Sie der **Einsatzleitung** die Lage.",
        "Lage melden",
        ["Einsatzleitung", "99/1", "zwei Personen", "unverletzt", "Schlagseite", "Ölfilm", "50 Meter", "Schleuse", "kommen"],
        f"Einsatzleitung von {BOOT} – Lage: zwei Personen an Bord, unverletzt, leichte Schlagseite, Schiff fest vertäut, Ölfilm am Heck etwa 50 Meter, treibt Richtung Schleuse – kommen.",
        "Anruf . „Lage“ . Personen (zwei, unverletzt) . Schiff (Schlagseite, vertäut) . Gefahr (Ölfilm 50 Meter) . Richtung (Schleuse) . „kommen“",
        "n_oelsperre",
        "Klare Lage: Menschen, Schiff, Gefahr, Richtung.",
        "Melden Sie: zwei Personen unverletzt, Schlagseite, Ölfilm 50 Meter, Richtung Schleuse.",
        "Erst **Menschen**, dann **Schiff**, dann die **Gefahr** und **wohin** sie sich bewegt.")
s.radio("n_oelsperre",
        "**Einsatzleitung:** „Verstanden. Was brauchen Sie?“\n\nDer Ölfilm darf **nicht in die Schleuse**. Sie brauchen eine **Ölsperre** vor der Schleuse und die Schleuse soll **nicht geöffnet** werden.",
        "Nachfordern",
        ["Einsatzleitung", "99/1", "Ölsperre", "vor der Schleuse", "nicht schleusen", "kommen"],
        f"Einsatzleitung von {BOOT} – wir brauchen eine Ölsperre vor der Schleuse, bitte nicht schleusen – kommen.",
        "Anruf . was (Ölsperre) . wo (vor der Schleuse) . was nicht passieren darf (nicht schleusen) . „kommen“",
        "n_wache",
        "Nachforderung mit Ort und Grund.",
        "Fordern Sie an: Ölsperre vor der Schleuse, nicht schleusen.",
        "Wird geschleust, verteilt sich das Öl kanalabwärts – darum die Bitte, **nicht zu schleusen**.")
s.radio("n_wache",
        "Die Feuerwehr bringt die Ölsperre aus, Ihr Boot hilft beim Ziehen. Danach sollen Sie **am Frachter Wache** halten. Melden Sie der Einsatzleitung, dass die Ölsperre **liegt** und Sie **am Schiff bleiben**.",
        "Vollzug melden",
        ["Einsatzleitung", "99/1", "Ölsperre liegt", "bleiben am Schiff", "kommen"],
        f"Einsatzleitung von {BOOT} – Ölsperre liegt, Öl wird gehalten, wir bleiben am Schiff zur Wache – kommen.",
        "Anruf . Vollzug („Ölsperre liegt“) . Wirkung (Öl wird gehalten) . was Sie jetzt tun („bleiben am Schiff“) . „kommen“",
        "n_end",
        "Vollzug gemeldet – die Einsatzleitung weiß, dass der Auftrag erledigt ist und wo Sie sind.",
        "Melden Sie: Ölsperre liegt, Sie bleiben am Schiff.",
        "Ein Auftrag ist erst fertig, wenn er **zurückgemeldet** ist.")
s.end("Das Öl ist gestoppt, der Frachter wird abgepumpt.\n\nErkundet, Lage nach Schema gemeldet, gezielt nachgefordert und den Vollzug zurückgemeldet.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("schifffahrt", s))


# ================================================================ Fahrgastschiff Rauch
s = S("schiff_fahrgastschiff_rauch", "Schifffahrt: Rauch auf dem Fahrgastschiff",
      "Fortgeschritten: Auf einem Ausflugsschiff brennt es im Maschinenraum. Ihr Boot holt Fahrgäste ab – Zahlen sauber melden, Übergabestelle nennen und eine Gefahr sofort weitergeben. 3 Funk-Schritte.",
      WR, "n_anfahrt")
s.radio("n_anfahrt",
        f"Ein **Fahrgastschiff** mit **etwa 60 Fahrgästen** liegt **manövrierunfähig** im Kanal **unterhalb der Schleuse Erlangen**, aus dem Maschinenraum kommt **Rauch**. Sie fahren mit **{BOOT}** hin.\n\n"
        "**Einsatzleitung:** „Pelikan Erlangen 99/1 – Fahrgäste vom Heck abholen und zur Slipstelle Hafen bringen – kommen.“\n\nWiederholen Sie den Auftrag." + HINWEIS_SIE,
        "Auftrag wiederholen",
        ["99/1", "verstanden", "Fahrgäste", "Heck", "Slipstelle Hafen", "kommen"],
        f"Hier {BOOT} – verstanden: Fahrgäste vom Heck abholen, zur Slipstelle Hafen – kommen.",
        "„hier Pelikan Erlangen 99/1“ . „verstanden“ . Auftrag (Fahrgäste vom Heck) . Ziel (Slipstelle Hafen) . „kommen“",
        "n_zahl",
        "Auftrag mit Abholort und Ziel wiederholt.",
        "Wiederholen Sie: Fahrgäste vom Heck, zur Slipstelle Hafen.",
        "Bei mehreren Booten ist der **Übergabeort** entscheidend – sonst landen Fahrgäste an verschiedenen Stellen.")
s.radio("n_zahl",
        "Sie nehmen **acht Fahrgäste** auf, darunter **ein Kind**. Eine Frau **hustet stark**. Melden Sie der Einsatzleitung, was Sie an Bord haben.",
        "Belegung melden",
        ["Einsatzleitung", "99/1", "acht Personen", "ein Kind", "eine Person hustet", "Slipstelle Hafen", "kommen"],
        f"Einsatzleitung von {BOOT} – acht Personen an Bord, davon ein Kind, eine Person hustet stark, fahren zur Slipstelle Hafen – kommen.",
        "Anruf . Zahl (acht Personen) . Besonderheiten (ein Kind, eine Person hustet) . Ziel (Slipstelle Hafen) . „kommen“",
        "n_gefahr",
        "Zahl und Besonderheiten gemeldet – der Rettungsdienst an Land kann sich vorbereiten.",
        "Melden Sie: acht Personen, ein Kind, eine Person hustet, Ziel Slipstelle Hafen.",
        "Die Einsatzleitung **zählt mit**: Nur so weiß sie am Ende, ob alle 60 Fahrgäste an Land sind.")
s.radio("n_gefahr",
        "Auf der Rückfahrt sehen Sie: Am Bug des Fahrgastschiffs **steigt jetzt Rauch aus den Fenstern** – dort warten noch Fahrgäste. Das muss die Einsatzleitung **sofort** wissen.",
        "Gefahr melden",
        ["Einsatzleitung", "99/1", "Achtung", "Rauch am Bug", "Fahrgäste", "kommen"],
        f"Einsatzleitung von {BOOT} – Achtung: Rauch am Bug aus den Fenstern, dort warten noch Fahrgäste – kommen.",
        "Anruf . „Achtung“ . was (Rauch am Bug) . warum gefährlich (dort warten Fahrgäste) . „kommen“",
        "n_end",
        "Gefahr sofort und knapp gemeldet.",
        "Melden Sie sofort: Achtung, Rauch am Bug, dort warten Fahrgäste.",
        "Eine **Gefahr** meldet man **sofort** – auch mitten in einem anderen Auftrag.")
s.end("Die Einsatzleitung schickt das nächste Boot zuerst an den Bug. Alle Fahrgäste kommen an Land.\n\n"
      "Auftrag wiederholt, Personen gezählt und gemeldet, Gefahr sofort weitergegeben.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("schifffahrt", s))
