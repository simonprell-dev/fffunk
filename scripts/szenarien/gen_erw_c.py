from gen_lib import S

OUT = []
GF = "gruppenführer_a"
TF = "truppführer"

# ================================================================ Wasserförderung über lange Wegstrecke
s = S("wasserfoerderung_lange_wegstrecke", "Wasserförderung über lange Wegstrecke",
      "Mittel: Als Maschinist der Verstärkerpumpe in einer Förderstrecke vom Weiher zum Brandobjekt „Wasser marsch“ weitergeben, die Kette in der richtigen Reihenfolge anfahren, Schieber langsam bedienen, den Eingangsdruck halten, bei einem Schlauchplatzer „Wasser halt“ geben und nach dem Schlauchtausch wieder anfahren. 5 Funk-Schritte.",
      TF, "n_start")
s.radio("n_start",
        "Scheunenbrand auf einem Aussiedlerhof bei Neuhaus. Hydranten gibt es dort nicht. Löschwasser kommt aus einem **Weiher rund 900 m entfernt** – über eine **Förderstrecke** aus B-Schläuchen in **geschlossener Schaltreihe** (Pumpe speist direkt in Pumpe).\n\n"
        "Die Kette: **Wasserentnahme** (Pumpe am Weiher, saugt aus dem offenen Gewässer) → **Verstärkerpumpe 1** (Tragkraftspritze etwa auf halber Strecke) → **Einspeisung** (Maschinist von Florian Neuhaus 17/42/1 am Brandobjekt). Die Pumpen funken im Einsatzstellenfunk unter diesen **funktionalen Rufnamen**.\n\n"
        "Sie sind **Maschinist der Verstärkerpumpe 1**. Ihre Pumpe läuft im Leerlauf, Eingang und Ausgang sind angeschlossen, der Druckabgang ist zu. Der Einsatzleiter hat festgelegt: Die Einspeisung fordert das Wasser an, angefahren wird **von der Wasserentnahme aus**.\n\n"
        "**Einspeisung:** „Verstärkerpumpe 1 von Einspeisung – Einspeisung betriebsbereit, **Wasser marsch** – kommen.“\n\n"
        "Bestätigen Sie und kündigen Sie an, dass Sie den Befehl an die Wasserentnahme weitergeben.",
        "Wasser marsch bestätigen",
        ["Verstärkerpumpe 1", "verstanden", "Wasser marsch", "Wasserentnahme", "kommen"],
        "Hier Verstärkerpumpe 1 – verstanden: Wasser marsch, gebe weiter an Wasserentnahme – kommen.",
        "„hier Verstärkerpumpe 1“ . „verstanden“ . „Wasser marsch“ wiederholen . „gebe weiter an Wasserentnahme“ . „kommen“",
        "n_reihenfolge",
        "Befehl bestätigt – die Einspeisung weiß, dass die Kette anläuft.",
        "Bestätigen Sie mit „verstanden“, wiederholen Sie „Wasser marsch“ und sagen Sie, dass Sie an die Wasserentnahme weitergeben.",
        "In einer Förderstrecke läuft jeder Befehl **Pumpe für Pumpe** durch. Wer weitergibt, bestätigt zuerst und sagt, an wen er weitergibt – dann weiß der Absender, dass der Befehl unterwegs ist.")
s.choice("n_reihenfolge",
         "**Einspeisung:** „Verstanden – Ende.“\n\nIn welcher Reihenfolge wird die Förderstrecke angefahren?",
         [("➡️ Die Wasserentnahme fördert zuerst und füllt die Leitung langsam. Die Verstärkerpumpe gibt erst weiter, wenn bei ihr Wasser mit Eingangsdruck ankommt – dann weiter bis zur Einspeisung", "n_marsch"),
          ("⚡ Alle Pumpen gleichzeitig Vollgas, dann geht es am schnellsten", None,
           "Solange in der Leitung noch Luft ist und kein Wasser ankommt, kann eine Verstärkerpumpe nichts fördern – sie läuft **trocken** bzw. saugt den Zubringerschlauch leer. Zudem prallt die Wassersäule beim Füllen mit voller Wucht auf – **Druckstöße**. Angefahren wird **von der Entnahme zur Einspeisung**, Abschnitt für Abschnitt."),
          ("🔄 Zuerst die Verstärkerpumpe aufdrehen, damit sie das Wasser vom Weiher ansaugt", None,
           "Eine Verstärkerpumpe kann das Wasser nicht über 450 m Schlauch ansaugen: Ein B-Druckschlauch ist nicht saugfest und wird bei Unterdruck flachgezogen. Das Wasser muss von der **Wasserentnahme** in die Leitung **gedrückt** werden.")])
s.radio("n_marsch",
        "Geben Sie „Wasser marsch“ an die Wasserentnahme weiter und melden Sie, dass Ihre Pumpe bereit ist.",
        "Wasser marsch weitergeben",
        ["Wasserentnahme", "Verstärkerpumpe 1", "betriebsbereit", "Wasser marsch", "kommen"],
        "Wasserentnahme von Verstärkerpumpe 1 – Verstärkerpumpe 1 betriebsbereit, Einspeisung fordert Wasser marsch – kommen.",
        "Anruf: Wasserentnahme von Verstärkerpumpe 1 . eigene Pumpe betriebsbereit . „Einspeisung fordert Wasser marsch“ . „kommen“",
        "n_schieber",
        "„Wasser marsch“ sauber an die Wasserentnahme weitergegeben.",
        "Rufen Sie die Wasserentnahme an: Verstärkerpumpe 1 betriebsbereit, Wasser marsch.",
        "Die Wasserentnahme fährt erst an, wenn sie weiß, dass die **nächste Pumpe bereit** ist. Kurz: wer ruft, wer ist bereit, was wird gefordert.")
s.choice("n_schieber",
         "**Wasserentnahme:** „Hier Wasserentnahme – verstanden, Wasser marsch – Ende.“\n\n"
         "Nach einigen Minuten kommt das Wasser bei Ihnen an: Der Eingangsschlauch wird prall, das **Eingangsmanometer** steigt auf **etwa 3 bar**.\n\nWie geben Sie das Wasser weiter?",
         [("🐢 Druckabgang **langsam** öffnen, Gas allmählich erhöhen und dabei das Eingangsmanometer im Blick behalten", "n_eingang"),
          ("💨 Druckabgang schlagartig ganz aufreißen und gleich Vollgas", None,
           "Schnelles Öffnen oder Schließen erzeugt **Druckstöße** in der Leitung. Die können Schläuche und Kupplungen platzen lassen und Pumpen beschädigen – über Hunderte Meter Schlauch schaukelt sich das auf. Schieber und Druckabgänge **immer langsam** bedienen."),
          ("⏳ Abwarten, bis die Einspeisung erneut nachfragt", None,
           "„Wasser marsch“ ist bereits angefordert. Kommt bei Ihnen Wasser mit Druck an, geben Sie es **ohne Verzögerung** – aber langsam – weiter. Die Einspeisung wartet darauf.")])
s.choice("n_eingang",
         "Das Wasser läuft bis zur Einspeisung durch. Dort werden jetzt weitere Rohre geöffnet. Bei Ihnen fällt der **Eingangsdruck auf 1,2 bar** und sinkt weiter.\n\n"
         "> **Faustwert** (Ihre Ausbildungsunterlagen gelten): Der Eingangsdruck an einer Verstärkerpumpe sollte **nicht unter etwa 1,5 bar** fallen – sonst droht, dass der Zubringerschlauch zusammengezogen wird und die Pumpe Luft bzw. Dampf zieht (Kavitation).\n\n"
         "Was tun Sie?",
         [("📞 Gas nicht weiter erhöhen, ggf. etwas zurücknehmen und die Wasserentnahme anfunken: Eingangsdruck zu niedrig, Ausgangsdruck erhöhen", "n_druck"),
          ("🔥 Mehr Gas geben, damit vorne genug ankommt", None,
           "Mehr Gas an der Verstärkerpumpe zieht den Eingangsdruck **noch weiter herunter**. Die Pumpe kann nur weitergeben, was von hinten nachkommt. Das Problem lösen Sie **im Gespräch** mit der vorgeschalteten Pumpe."),
          ("🔒 Druckabgang ohne Meldung zudrehen, bis der Druck wieder passt", None,
           "Dann bricht vorne plötzlich die Wasserversorgung zusammen – womöglich steht ein Trupp im Innenangriff ohne Wasser. In der Förderstrecke **kein Alleingang**: Änderungen werden abgesprochen.")])
s.radio("n_druck",
        "Funken Sie die Wasserentnahme an.",
        "Eingangsdruck melden",
        ["Wasserentnahme", "Verstärkerpumpe 1", "Eingangsdruck", "1,2 bar", "Ausgangsdruck erhöhen", "kommen"],
        "Wasserentnahme von Verstärkerpumpe 1 – Eingangsdruck sinkt auf 1,2 bar, Ausgangsdruck erhöhen – kommen.",
        "Anruf: Wasserentnahme von Verstärkerpumpe 1 . Problem: Eingangsdruck sinkt auf 1,2 bar . Forderung: Ausgangsdruck erhöhen . „kommen“",
        "n_platzer",
        "Klare Meldung mit Messwert und Forderung – kein Alleingang.",
        "Melden Sie den Eingangsdruck (1,2 bar) und fordern Sie, den Ausgangsdruck zu erhöhen.",
        "Der Maschinist an der Wasserentnahme sieht Ihren Eingangsdruck nicht. Er braucht den **Messwert** und eine **klare Forderung**. Reicht auch das nicht, muss die Einspeisung weniger abnehmen oder der Einsatzleiter eine weitere Leitung bzw. Pumpe einplanen.")
s.radio("n_platzer",
        "**Wasserentnahme:** „Hier Wasserentnahme – verstanden, erhöhe Ausgangsdruck – Ende.“\n\n"
        "Ihr Eingangsdruck steigt wieder auf **etwa 2 bar** – die Strecke läuft. Eine Viertelstunde später: Etwa 100 m hinter Ihrer Pumpe, **zwischen Ihnen und der Einspeisung**, platzt ein B-Schlauch. Ihr Ausgangsdruck bricht ein, Wasser schießt über den Feldweg.\n\n"
        "Sie nehmen Gas zurück und schließen Ihren Druckabgang **langsam**. Geben Sie „Wasser halt“ an alle Pumpen der Strecke – mit Ort und Grund.",
        "Wasser halt geben",
        ["An alle", "Verstärkerpumpe 1", "Wasser halt", "Schlauchplatzer", "Einspeisung", "kommen"],
        "An alle von Verstärkerpumpe 1 – Wasser halt! Schlauchplatzer etwa 100 Meter hinter Verstärkerpumpe 1 Richtung Einspeisung. Wasserentnahme Druck zurücknehmen, Leitung gefüllt halten – kommen.",
        "Sammelruf: An alle von Verstärkerpumpe 1 . „Wasser halt“ . Ort und Grund (Schlauchplatzer ca. 100 m hinter Verstärkerpumpe 1 Richtung Einspeisung) . Wasserentnahme: Druck zurücknehmen, Leitung gefüllt halten . „kommen“",
        "n_tausch",
        "„Wasser halt“ mit Ort und Grund an alle Pumpen gegeben.",
        "Sammelruf an alle: „Wasser halt“, Ort des Schlauchplatzers, Wasserentnahme Druck zurücknehmen.",
        "Ein Schlauchplatzer betrifft die **ganze Strecke**: Die Einspeisung muss wissen, dass vorerst kein Wasser kommt (sie versorgt aus dem Tank weiter), die Wasserentnahme nimmt den Druck zurück. Die Leitung bleibt **gefüllt** – das spart beim Wiederanfahren viel Zeit.")
s.d["nodes"]["n_platzer"]["actions"][0]["radioCall"]["response"] = "Hier Wasserentnahme – verstanden, Wasser halt – Ende."
s.info("n_tausch",
       "**Einspeisung:** „Hier Einspeisung – verstanden, Wasser halt. Versorgen den Angriff aus dem Tank, Wasser reicht noch etwa fünf Minuten – Ende.“\n\n"
       "Die Schlauchtrupps der Förderstrecke tauschen den geplatzten B-Schlauch gegen einen aus der Schlauchreserve. Sie sehen selbst nach: Beide Kupplungen sind fest verbunden, der neue Schlauch liegt ohne Knick.\n\n"
       "> Der neue Schlauch ist **leer**. Wenn Sie den Druckabgang wieder öffnen, füllen Sie ihn **langsam** – sonst schlägt die Wassersäule an der Einspeisung als Druckstoß an.",
       "➡️ Wieder anfahren", "n_wieder")
s.radio("n_wieder",
        "Fordern Sie bei der Wasserentnahme wieder Wasser an. Die Einspeisung hört im Einsatzstellenfunk mit.",
        "Wieder Wasser marsch",
        ["Wasserentnahme", "Verstärkerpumpe 1", "Schlauch getauscht", "Wasser marsch", "Druck", "kommen"],
        "Wasserentnahme von Verstärkerpumpe 1 – Schlauch getauscht, Wasser marsch, Druck langsam wieder erhöhen – kommen.",
        "Anruf: Wasserentnahme von Verstärkerpumpe 1 . „Schlauch getauscht“ . „Wasser marsch“ . Druck langsam wieder erhöhen . „kommen“",
        "n_end",
        "Strecke nach dem Schlauchtausch wieder angefahren.",
        "Melden Sie „Schlauch getauscht“ und fordern Sie „Wasser marsch“ mit langsamer Druckerhöhung.",
        "Nach dem Tausch wird die Strecke wie beim ersten Mal angefahren: **von hinten nach vorne, langsam**. Erst „Schlauch getauscht“ melden, dann „Wasser marsch“.")
s.end("**Wasserentnahme:** „Hier Wasserentnahme – verstanden, Wasser marsch – Ende.“\n\n"
      "Sie öffnen Ihren Druckabgang langsam, der neue Schlauch füllt sich. Kurz darauf:\n\n**Einspeisung:** „Verstärkerpumpe 1 von Einspeisung – Wasser kommt an, Eingangsdruck stabil – Ende.“\n\n"
      "Sie haben die Förderstrecke sicher betrieben: Befehle Pumpe für Pumpe weitergegeben, von der Entnahme zur Einspeisung angefahren, Schieber langsam bedient, Eingangsdruck gehalten und bei der Störung „Wasser halt“ an alle gegeben.\n\n"
      "> **Merke:** In der Förderstrecke hängt jede Pumpe von der vorherigen ab. **Langsam schalten, Eingangsdruck im Blick (Faustwert ca. 1,5 bar), Änderungen immer per Funk absprechen.**\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("wasser", s))

# ================================================================ Unwetter: Einsatzserie über die ILS
s = S("unwetter_einsatzserie", "Unwetter: Einsatzserie über die ILS",
      "Einsteiger: Bei einer Sturmlage nacheinander Einsätze der ILS über Sprechfunk übernehmen, Aufträge quittieren und wiederholen, Status 3/4/1 per Taste senden, eine Gefahr für Personen vorrangig melden und die überlastete Sprechgruppe nur für das Nötige nutzen. 4 Funk-Schritte.",
      GF, "n_auftrag1")
s.radio("n_auftrag1",
        "Ein **Sturmtief** zieht über den Landkreis. Bei der ILS gehen Dutzende Notrufe ein, die Sprechgruppe ist dauernd belegt. Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1**, die Gruppe ist im Gerätehaus besetzt (**Status 2**).\n\n"
        "> Bei Unwetterlagen vergibt die ILS Einsätze oft nacheinander per Sprechfunk an bereitstehende Fahrzeuge. Wie genau das läuft (Sprechfunk, Fax, Einsatzmonitor, örtliche Einsatzleitung), regelt **Ihre ILS** bzw. der Landkreis.\n\n"
        "**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – Einsatzauftrag: **Baum auf Fahrbahn**, Kreisstraße Neuhaus – Adelsdorf, Höhe Waldparkplatz. Fahrbahn komplett blockiert, keine Personen betroffen – kommen.“\n\n"
        "Quittieren Sie den Auftrag und wiederholen Sie die wichtigen Punkte.",
        "Auftrag quittieren",
        ["Florian Neuhaus", "verstanden", "Baum", "Kreisstraße", "Waldparkplatz", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – verstanden: Baum auf Fahrbahn, Kreisstraße Neuhaus – Adelsdorf, Höhe Waldparkplatz – kommen.",
        "„hier“ + eigener Rufname . „verstanden“ . Einsatzart (Baum auf Fahrbahn) . Ort (Kreisstraße Neuhaus – Adelsdorf, Höhe Waldparkplatz) . „kommen“",
        "n_ausruecken",
        "Auftrag quittiert und Ort wiederholt.",
        "Quittieren Sie mit „verstanden“ und wiederholen Sie Einsatzart und Ort.",
        "Gerade bei vielen Einsätzen gleichzeitig ist die **Wiederholung** wichtig: So merkt die ILS sofort, wenn Sie den falschen Ort verstanden haben. Kurz – nur Einsatzart und Ort.")
s.choice("n_ausruecken",
         "**Leitstelle:** „Verstanden – Ende.“\n\nSie rücken aus. Was senden Sie?",
         [("⌨️ Status 3 drücken", "n_baum_fertig"),
          ("📞 Leitstelle anrufen: „Florian Neuhaus 17/42/1 rückt aus“", None,
           "Das Ausrücken wird mit **Status 3** gedrückt, nicht gesprochen. Bei einer Unwetterlage ist jedes unnötige Gespräch eines zu viel – andere warten auf die Sprechgruppe."),
          ("⌨️ Gar nichts – die ILS hat Ihnen den Einsatz ja selbst gegeben", None,
           "Die ILS muss sehen, dass Sie den Auftrag **übernommen** haben und unterwegs sind. Das geht mit **Status 3** – ohne ein Wort zu sprechen.")])
s.choice("n_baum_fertig",
         "An der Einsatzstelle drücken Sie **Status 4**. Der Baum wird mit der Motorsäge zerkleinert und von der Fahrbahn geräumt, die Straße ist wieder frei.\n\n"
         "Die ILS hat keine besondere Rückmeldung verlangt. Wie melden Sie, dass Sie wieder frei sind?",
         [("⌨️ Status 1 drücken – einsatzbereit über Funk", "n_auftrag2"),
          ("📞 Leitstelle anrufen und ausführlich berichten, wie der Baum beseitigt wurde", None,
           "Bei überlasteter Sprechgruppe ist ein ausführlicher Bericht unnötig. **Status 1** sagt der ILS: Einsatz erledigt, Fahrzeug frei für den nächsten Auftrag. Ob Ihre ILS zusätzlich eine **kurze** Sprechfunkmeldung („Einsatzstelle abgearbeitet“) erwartet, regelt sie selbst."),
          ("⌨️ Status 2 drücken", None,
           "**Status 2** heißt „einsatzbereit auf Wache“. Sie stehen aber noch an der Kreisstraße und sind **über Funk** einsatzbereit – also **Status 1**.")])
s.radio("n_auftrag2",
        "Kaum ist Status 1 gesendet, kommt der nächste Auftrag:\n\n"
        "**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – nächster Einsatz: **Keller unter Wasser**, Neuhaus, **Lindenweg 7**. Wasser etwa 30 Zentimeter hoch, Bewohner wohlauf, Heizung im Keller – kommen.“\n\n"
        "Quittieren und wiederholen Sie.",
        "Zweiten Auftrag quittieren",
        ["Florian Neuhaus", "verstanden", "Keller", "Lindenweg 7", "Heizung", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – verstanden: Keller unter Wasser, Lindenweg 7, Heizung im Keller – kommen.",
        "„hier“ + eigener Rufname . „verstanden“ . Einsatzart (Keller unter Wasser) . Ort (Lindenweg 7) . wichtiger Hinweis (Heizung im Keller) . „kommen“",
        "n_unterwegs",
        "Zweiter Auftrag quittiert – mit dem Hinweis auf die Heizung.",
        "Quittieren Sie mit „verstanden“: Keller unter Wasser, Lindenweg 7, Heizung im Keller.",
        "Wiederholen Sie neben Einsatzart und Ort auch **Hinweise auf Gefahren** – hier die Heizung (Strom, ggf. Öl oder Gas im Keller). Einen überfluteten Keller erst betreten, wenn die Gefahr durch Strom geklärt ist.")
s.choice("n_unterwegs",
         "**Leitstelle:** „Verstanden – Ende.“\n\nSie drücken **Status 3** und fahren los. Auf der Hauptstraße sehen Sie: Vom Dach des Hauses **Hauptstraße 3** reißt der Sturm **Dachziegel** ab. Sie fallen auf den Gehweg – direkt an der **Bushaltestelle**, an der mehrere Schulkinder warten.\n\nWas tun Sie?",
         [("🛑 Anhalten, Personen aus dem Gefahrenbereich holen, Gehweg absperren und mit **Status 5** die ILS informieren", "n_meldung"),
          ("🚒 Weiterfahren – Ihr Auftrag ist der Keller im Lindenweg", None,
           "**Gefahr für Personen geht vor Sachschaden.** Ein voller Keller kann ein paar Minuten warten, herabfallende Ziegel über wartenden Kindern nicht. Sie greifen ein – und informieren die ILS, damit sie den Keller ggf. neu disponieren kann."),
          ("🔇 Eingreifen, aber die ILS nicht informieren – die hat genug zu tun", None,
           "Ohne Meldung glaubt die ILS, Sie seien auf dem Weg zum Lindenweg. Sie weiß nichts von der neuen Gefahrenstelle und kann weder eine Drehleiter schicken noch den Keller umplanen. Eine **kurze** Meldung ist hier **nötig**.")])
s.radio("n_meldung",
        "Ihre Gruppe hat die Kinder in Sicherheit gebracht und sperrt den Gehweg großräumig ab. Ziegel fallen weiter – zum Sichern des Daches brauchen Sie eine **Drehleiter**.\n\n"
        "**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – Sprechwunsch – kommen.“\n\n"
        "Melden Sie kurz nach Schema: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung** – und dass der Keller warten muss.",
        "Neue Gefahrenstelle melden",
        ["Florian Neuhaus", "Hauptstraße 3", "Dachziegel", "Bushaltestelle", "abgesperrt", "Drehleiter", "Lindenweg", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – auf Anfahrt Lindenweg angehalten: Hauptstraße 3, Sturm reißt Dachziegel ab, Gefahr für Personen an der Bushaltestelle. Personen in Sicherheit, Gehweg abgesperrt. Nachforderung: Drehleiter zum Sichern des Daches. Lindenweg 7 übernehmen wir anschließend – kommen.",
        "„hier“ + Rufname . WO: Hauptstraße 3 . WAS: Dachziegel fallen . MENSCHENLEBEN: Gefahr für Personen an der Bushaltestelle, jetzt in Sicherheit . MASSNAHMEN: Gehweg abgesperrt . NACHFORDERUNG: Drehleiter . Hinweis: Lindenweg 7 anschließend . „kommen“",
        "n_disziplin",
        "Kurze, vollständige Meldung – die ILS kann neu disponieren.",
        "Melden Sie: Hauptstraße 3, Dachziegel, Gefahr an der Bushaltestelle, abgesperrt, Drehleiter, Lindenweg 7 später.",
        "Auch bei voller Sprechgruppe gehört eine **neue Gefahr für Personen** gemeldet – kurz und nach Schema. Der Hinweis auf den wartenden Keller hilft der ILS beim Priorisieren.")
s.choice("n_disziplin",
         "**Leitstelle:** „Hier Leitstelle – verstanden. Einsatz Hauptstraße 3 ist angelegt, Drehleiter **Florian Neuhaus 33/1** kommt. Lindenweg 7 bleibt bei Ihnen – Ende.“\n\n"
         "Kurz darauf eine Durchsage: **„Leitstelle an alle: Sprechgruppe überlastet. Nur noch dringende Gespräche, Einsatzende mit Status 1 – Ende.“**\n\n"
         "Die Drehleiter sichert das Dach, Sie fahren zum Lindenweg und pumpen den Keller aus. Ein Kamerad schlägt vor, die ILS zu fragen, **wie viele Einsätze im Ort noch offen** sind und ob es **Verpflegung** gibt.\n\nWie entscheiden Sie?",
         [("🤫 Nicht fragen. Sie melden sich nur, wenn Sie etwas Dringendes haben oder gerufen werden; Verpflegung klärt die örtliche Führung", "n_abgearbeitet"),
          ("📞 Kurz nachfragen – dauert ja nur ein paar Sekunden", None,
           "Wenn das jedes Fahrzeug macht, ist die Sprechgruppe dicht – und ein Notfall kommt nicht durch. Die ILS hat **ausdrücklich** um Funkdisziplin gebeten. Organisatorisches gehört nicht in die Sprechgruppe der ILS."),
          ("⌨️ Status 0 drücken, dann werden Sie schneller drangenommen", None,
           "Der **priorisierte Sprechwunsch (Status 0)** ist für Notfälle und Gefahr im Verzug – nicht für Fragen. Die Verwendung ist regional geregelt; Missbrauch blockiert die echten Notfälle.")])
s.radio("n_abgearbeitet",
        "Der Keller ist ausgepumpt, die Bewohner kümmern sich um den Rest. Bevor Sie Status 1 drücken, ruft Sie die ILS:\n\n"
        "**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – Frage Stand Lindenweg 7 – kommen.“\n\n"
        "Antworten Sie **so kurz wie möglich**.",
        "Kurz zurückmelden",
        ["Florian Neuhaus", "Lindenweg 7", "abgearbeitet", "einsatzbereit", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Lindenweg 7 Einsatzstelle abgearbeitet, wieder einsatzbereit – kommen.",
        "„hier“ + Rufname . Ort (Lindenweg 7) . „Einsatzstelle abgearbeitet“ . „wieder einsatzbereit“ . „kommen“ – danach Status 1 drücken",
        "n_end",
        "Kurz und eindeutig: abgearbeitet und einsatzbereit.",
        "Melden Sie in einem Satz: Lindenweg 7 abgearbeitet, wieder einsatzbereit.",
        "Mehr braucht die ILS in dieser Lage nicht: **Ort – abgearbeitet – einsatzbereit**. Details (Wasserstand, Dauer) gehören in den Einsatzbericht, nicht in die überlastete Sprechgruppe.")
s.end("**Leitstelle:** „Verstanden – Ende.“\n\nSie drücken **Status 1** – und warten auf den nächsten Auftrag.\n\n"
      "Sie haben die Einsatzserie diszipliniert abgearbeitet: Aufträge quittiert und wiederholt, Status 3/4/1 gedrückt statt gesprochen, die Gefahr für Personen vorgezogen und gemeldet, unnötige Gespräche vermieden.\n\n"
      "> **Merke:** Bei Unwetter gilt: **Personen vor Sachwerten, Status statt Sprechfunk, so kurz wie möglich.** Wie Ihre ILS Einsatzserien abwickelt, legt sie selbst fest.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("sonstige", s))

# ================================================================ MANV: Erstmeldung
s = S("manv_erstmeldung", "MANV: Erstmeldung als ersteintreffende Einheit",
      "Profi: Als Gruppenführer der ersteintreffenden Einheit an einem Busunfall mit vielen Verletzten den Überblick gewinnen statt sofort zu behandeln, die Erstmeldung mit „MANV“ und geschätzter Patientenzahl absetzen, nach MANV-Konzept nachfordern, Zufahrt und Bereitstellungsraum festlegen und die Sichtung durch den Rettungsdienst unterstützen. 4 Funk-Schritte.",
      GF, "n_start")
s.choice("n_start",
         "Alarm: **„THL – Verkehrsunfall mit Bus – Staatsstraße Neuhaus – Adelsdorf“**. Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1** (1/8) und treffen als **erste Einheit** ein – der Rettungsdienst ist noch nicht da. Sie haben **Status 4** gedrückt.\n\n"
         "Ein **Reisebus** ist von der Fahrbahn abgekommen und liegt **auf der Seite im Straßengraben**. Mehrere Menschen laufen blutend auf der Straße umher, einige sitzen oder liegen am Rand, aus dem Bus hört man Hilferufe. Es riecht nach Diesel.\n\n"
         "Ein Fahrgast zieht Sie am Arm: „Helfen Sie meiner Frau, sie blutet am Kopf!“\n\nWas tun Sie als Gruppenführer **zuerst**?",
         [("👀 Kurz erkunden: einmal um die Einsatzstelle, Gefahren erfassen, Zahl der Verletzten grob schätzen – dann sofort melden", "n_aufstellung"),
          ("🩹 Sich selbst um die Frau kümmern – sie braucht jetzt Hilfe", None,
           "Verständlich, aber falsch: Wenn sich der Führer der ersteintreffenden Einheit in die Behandlung eines Einzelnen bindet, **fehlt der Überblick** – und die Nachforderung für alle anderen kommt zu spät. Bei vielen Verletzten rettet die **schnelle, richtige Meldung** die meisten Leben. Ein Truppmann kann die Frau kurz betreuen."),
          ("🏃 Die ganze Gruppe sofort in den Bus schicken, um alle herauszuholen", None,
           "Der Bus liegt auf der Seite, Diesel läuft aus – ohne Sicherung und Brandschutz gefährden Sie Ihre Kräfte. Und unkoordiniert verlieren Sie den Überblick. **Erst erkunden, Eigenschutz, melden** – dann gezielt einsetzen.")])
s.choice("n_aufstellung",
         "Ihre Erkundung (etwa eine Minute): **ca. 25 Insassen**, davon etwa 15 gehfähig. Mehrere liegen am Straßenrand, **mindestens zwei Personen sind im Bus eingeklemmt**. Am Tank läuft Diesel aus, der Bus wirkt instabil. Die Fahrbahn ist durch Glas und Gepäck teilweise blockiert.\n\n"
         "Wie ordnen Sie die Einsatzstelle?",
         [("🚒 Fahrzeug **vor** der Unfallstelle als Absicherung (in Anfahrtsrichtung Neuhaus), Fahrbahn auf der anderen Seite **als Zufahrt für Rettungsmittel freihalten**, Brandschutz sicherstellen, Bus gegen Bewegung sichern", "n_erstmeldung"),
          ("🚒 Fahrzeug direkt neben den Bus stellen, damit alles Material nah ist", None,
           "Dann stehen Sie mitten in der einzigen Zufahrt. Bei einem MANV kommen **viele Rettungsmittel** – sie brauchen eine **freie An- und Abfahrt**. Die Raumordnung legen Sie **von Anfang an** fest, nachträglich umparken kostet Zeit."),
          ("🅿️ Erst einmal nichts festlegen – das macht später der Rettungsdienst", None,
           "Der Rettungsdienst kommt erst in einigen Minuten. Bis dahin parken Ersthelfer und Schaulustige die Straße zu. **Absicherung, freie Zufahrt und Brandschutz** sind von Anfang an Aufgabe der ersteintreffenden Feuerwehr.")])
s.radio("n_erstmeldung",
        "Sie haben **Status 5** gedrückt.\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – Sprechwunsch – kommen.“\n\n"
        "Setzen Sie die **Erstmeldung** ab. Nennen Sie ausdrücklich **„MANV“** und die **geschätzte** Zahl der Verletzten („ca.“) – genaue Zahlen gibt es erst nach der Sichtung. Dazu Gefahren und eingeklemmte Personen. Die Nachforderung geben Sie gleich danach.",
        "Erstmeldung MANV",
        ["Florian Neuhaus", "MANV", "Reisebus", "ca. 25", "Verletzte", "eingeklemmt", "Diesel", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Erstmeldung MANV: Staatsstraße Neuhaus – Adelsdorf, Reisebus auf der Seite im Graben. Ca. 25 Verletzte, davon mindestens zwei im Bus eingeklemmt. Diesel läuft aus, Bus instabil. Einsatzstelle wird abgesichert, Brandschutz wird aufgebaut. Nachforderung folgt sofort – kommen.",
        "„hier“ + Rufname + „Erstmeldung MANV“ . WO: Staatsstraße Neuhaus – Adelsdorf . WAS: Reisebus auf der Seite im Graben . MENSCHENLEBEN: ca. 25 Verletzte, mind. 2 eingeklemmt . Gefahren: Diesel läuft aus, Bus instabil . Maßnahmen: Absicherung, Brandschutz . „Nachforderung folgt sofort“ . „kommen“",
        "n_nachforderung",
        "Erstmeldung mit „MANV“ und geschätzter Patientenzahl – die ILS kann das MANV-Konzept auslösen.",
        "Melden Sie: MANV, Ort, Reisebus, ca. 25 Verletzte, Eingeklemmte, Gefahr durch Diesel.",
        "Das Stichwort **„MANV“** (Massenanfall von Verletzten) und eine **geschätzte Patientenzahl** sind die wichtigsten Informationen: Damit löst die ILS ihr **MANV-Konzept** aus und alarmiert Rettungsmittel in großer Zahl. Schätzen ist richtig – „ca.“ sagen, nicht minutenlang zählen.")
s.radio("n_nachforderung",
        "**Leitstelle:** „Hier Leitstelle – verstanden, MANV, ca. 25 Verletzte. Frage Nachforderung und Anfahrt – kommen.“\n\n"
        "Fordern Sie nach: **Rettungsdienst nach dem MANV-Alarmplan Ihrer ILS** einschließlich **Leitendem Notarzt** und **Organisatorischem Leiter Rettungsdienst**, für die Eingeklemmten **technische Rettung** (Rüstwagen, weitere Feuerwehr). Nennen Sie die **Zufahrt** und schlagen Sie einen **Bereitstellungsraum** vor: den Parkplatz an der Mühle, etwa 300 m Richtung Neuhaus.",
        "Nachforderung und Zufahrt",
        ["Florian Neuhaus", "Leitender Notarzt", "Organisatorischer Leiter", "Rüstwagen", "Zufahrt", "Bereitstellungsraum", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Nachforderung: Rettungsdienst nach MANV-Alarmplan, dazu Leitender Notarzt und Organisatorischer Leiter Rettungsdienst. Für zwei Eingeklemmte Rüstwagen und Florian Adelsdorf 44/1. Zufahrt nur von Neuhaus her, Bereitstellungsraum Parkplatz an der Mühle – kommen.",
        "„hier“ + Rufname . Nachforderung: Rettungsdienst nach MANV-Alarmplan, Leitender Notarzt, Organisatorischer Leiter Rettungsdienst . technische Rettung: Rüstwagen + weitere Feuerwehr (Florian Adelsdorf 44/1) . Zufahrt (von Neuhaus her) . Bereitstellungsraum (Parkplatz an der Mühle) . „kommen“",
        "n_sichtung",
        "Nachforderung nach MANV-Konzept mit Zufahrt und Bereitstellungsraum.",
        "Fordern Sie Rettungsdienst nach MANV-Alarmplan mit LNA und OrgL, Rüstwagen nach und nennen Sie Zufahrt und Bereitstellungsraum.",
        "Bei einem MANV braucht der Rettungsdienst eine eigene **Führung**: **Leitender Notarzt (LNA)** und **Organisatorischer Leiter Rettungsdienst (OrgL)**. Welche Kräfte bei welchem Stichwort kommen, steht im **Alarmplan Ihrer ILS**. Die vielen Rettungsmittel sammeln sich im **Bereitstellungsraum** und werden von dort gezielt an die Einsatzstelle geholt – so bleibt die Zufahrt frei.")
s.choice("n_sichtung",
         "**Leitstelle:** „Hier Leitstelle – verstanden. MANV-Alarmierung läuft, LNA und OrgL sind alarmiert, Rüstwagen und Florian Adelsdorf 44/1 kommen. Bereitstellungsraum Parkplatz an der Mühle – Ende.“\n\n"
         "Bis der Rettungsdienst in größerer Zahl da ist, vergehen noch Minuten. Der erste **RTW** trifft ein. Wie setzen Sie Ihre Gruppe ein?",
         [("🤝 Gehfähige Verletzte an eine Sammelstelle abseits der Straße führen und betreuen lassen, Liegende ansprechen, Zahl und Lage notieren, Erste Hilfe nach Ausbildung – die **Sichtung** macht der Rettungsdienst, Sie unterstützen ihn", "n_zufahrt"),
          ("🏷️ Selbst alle Verletzten mit Anhängekarten in Rot, Gelb und Grün einteilen", None,
           "Die **Sichtung** (Einteilung nach Behandlungsdringlichkeit) ist Aufgabe des **Rettungsdienstes bzw. des Notarztes**. Manche Regionen sehen eine **Vorsichtung** durch geschulte Kräfte nach einem festen Schema vor – dann nur nach diesem Konzept und mit Ausbildung. Ohne beides unterstützen Sie: sammeln, betreuen, zählen, Erste Hilfe."),
          ("🚒 Leichtverletzte ins Feuerwehrfahrzeug setzen und selbst ins Krankenhaus bringen", None,
           "Patienten werden bei einem MANV **gezielt** auf Kliniken verteilt – sonst ist das nächste Krankenhaus überfüllt und Patienten fehlen in der Übersicht. Den Transport koordiniert der Rettungsdienst (OrgL/LNA). Ihr Fahrzeug wird außerdem für die technische Rettung gebraucht.")])
s.radio("n_zufahrt",
        "> **Sichtungskategorien** (vereinfacht, die Einteilung trifft der Rettungsdienst): **Rot** – akute Lebensgefahr, sofortige Behandlung. **Gelb** – schwer verletzt, Behandlung dringend, aber aufschiebbar. **Grün** – leicht verletzt, spätere Behandlung. Je nach Konzept gibt es weitere Kategorien.\n\n"
        "An der Einsatzstelle halten schon die ersten **Privatautos** von Ersthelfern und Schaulustigen. Geben Sie dem **Schlauchtrupp** den Befehl, die Zufahrt freizuhalten und die Rettungsmittel einzuweisen.",
        "Befehl Zufahrt freihalten",
        ["Schlauchtrupp", "Gruppenführer", "Zufahrt", "freihalten", "Rettungsmittel", "einweisen", "Bereitstellungsraum", "kommen"],
        "Schlauchtrupp von Gruppenführer – Zufahrt von Neuhaus her freihalten, keine Fahrzeuge an der Unfallstelle abstellen lassen. Rettungsmittel einweisen, alle weiteren in den Bereitstellungsraum Parkplatz an der Mühle – kommen.",
        "Anruf: Schlauchtrupp von Gruppenführer . Auftrag: Zufahrt von Neuhaus her freihalten . keine Fahrzeuge an der Unfallstelle abstellen lassen . Rettungsmittel einweisen . alle weiteren in den Bereitstellungsraum (Parkplatz an der Mühle) . „kommen“",
        "n_folge",
        "Zufahrt gesichert – die Rettungsmittel kommen durch.",
        "Befehlen Sie: Zufahrt freihalten, keine Fahrzeuge abstellen lassen, Rettungsmittel einweisen, weitere in den Bereitstellungsraum.",
        "Die häufigste Panne bei Großschadenslagen: **zugeparkte Zufahrten**. Ein Trupp, der die Zufahrt freihält und einweist, ist von Anfang an gut eingesetzt.")
s.radio("n_folge",
        "**Schlauchtrupp:** „Hier Schlauchtrupp – verstanden – Ende.“\n\n"
        "Inzwischen sind ein Notarzt und mehrere RTW eingetroffen, die **Sichtung durch den Rettungsdienst läuft**. Der Bus ist gesichert, ein Schnellangriff steht, der ausgelaufene Diesel ist abgestreut. Die gehfähigen Verletzten werden an der Sammelstelle am Feldweg betreut. Der Rüstwagen ist da, die **technische Rettung der zwei Eingeklemmten** hat begonnen.\n\n"
        "Die Leitstelle ruft Sie:\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – Frage Lage – kommen.“\n\nGeben Sie eine kurze **Folgemeldung**.",
        "Folgemeldung",
        ["Florian Neuhaus", "Folgemeldung", "Sichtung", "Rettungsdienst", "Sammelstelle", "technische Rettung", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Folgemeldung: Sichtung durch den Rettungsdienst läuft. Gehfähige Verletzte an der Sammelstelle am Feldweg betreut. Bus gesichert, Brandschutz steht, technische Rettung der zwei Eingeklemmten läuft. Zufahrt frei – kommen.",
        "„hier“ + Rufname + „Folgemeldung“ . Sichtung durch den Rettungsdienst läuft . Gehfähige an der Sammelstelle (Feldweg) . Bus gesichert, Brandschutz steht . technische Rettung der 2 Eingeklemmten läuft . Zufahrt frei . „kommen“",
        "n_end",
        "Folgemeldung kurz und vollständig – ohne Namen, ohne medizinische Details.",
        "Melden Sie: Sichtung läuft, Sammelstelle, Bus gesichert, technische Rettung läuft, Zufahrt frei.",
        "In die Folgemeldung der Feuerwehr gehört, was **Sie** verantworten: Sicherung, Brandschutz, technische Rettung, Zufahrt. Patientenzahlen nach Sichtungskategorien meldet der **Rettungsdienst** (LNA/OrgL) – keine Namen und keine Diagnosen über Funk.")
s.end("**Leitstelle:** „Verstanden – Ende.“\n\nKurz darauf treffen **LNA und OrgL** ein. Sie stimmen sich mit ihnen ab: Der Rettungsdienst führt die Patientenversorgung, Sie führen Sicherung und technische Rettung.\n\n"
      "Sie haben als ersteintreffende Einheit richtig gehandelt: erst Überblick statt Einzelbehandlung, Raumordnung mit freier Zufahrt, Erstmeldung mit „MANV“ und geschätzter Patientenzahl, Nachforderung nach dem Alarmplan der ILS, Sichtung durch den Rettungsdienst unterstützt.\n\n"
      "> **Merke:** Beim MANV gilt für die erste Einheit: **Erkunden – Eigenschutz – Melden – Ordnen.** Die erste Meldung mit „MANV“ und „ca.“-Zahl entscheidet, wie schnell genug Hilfe kommt.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("sonstige", s))
