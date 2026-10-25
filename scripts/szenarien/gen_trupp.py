from gen_lib import S

OUT = []
TF = "truppführer"


def anruf(s, nid, trupp, narrative, nxt):
    s.radio(nid, narrative, "Anruf beantworten",
            ["hier", trupp, "kommen"],
            f"Hier {trupp} – kommen.",
            f"Antwort mit „hier“ . eigener Rufname ({trupp}) . „kommen“",
            nxt,
            "Anruf formal korrekt beantwortet.",
            f"Antworten Sie mit „Hier {trupp} – kommen“.",
            "Die Antwort auf einen Anruf beginnt mit **„hier“**, dann folgt der eigene Rufname, Abschluss **„kommen“**. „Hört“ ist kein Betriebswort.")


# ---------------------------------------------------------------- THL PKW
s = S("trupp_auto_absichern", "Truppführer: PKW sichern und Bergung vorbereiten",
      "Truppführer-Übung THL: Befehl wiederholen, verunfallten PKW gegen Wegrollen sichern, Antriebsart erkunden, auslaufende Betriebsmittel aufnehmen und das Fahrzeug für den Abschleppdienst vorbereiten. 4 Funk-Schritte.",
      TF, "n_anfunken")
anruf(s, "n_anfunken", "Angriffstrupp",
      "**Gruppenführer:** „Angriffstrupp von Gruppenführer – kommen.“\n\nVerkehrsunfall in Neuhaus. Der Maschinist hat die Einsatzstelle mit Blaulicht und Warnblinker gesichert, der Schlauchtrupp sichert gegen den fließenden Verkehr ab, der Brandschutz steht.\n\nBeantworten Sie den Anruf.",
      "n_start")
s.radio("n_start",
        "**Gruppenführer:** „PKW nach Auffahrunfall, Fahrer ist ausgestiegen und unverletzt, niemand eingeklemmt. Das Fahrzeug steht auf abschüssiger Fahrbahn. Angriffstrupp: PKW gegen Wegrollen sichern, Zündung aus, Antriebsart feststellen – kommen.“\n\n"
        "Wiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Angriffstrupp", "verstanden", "Wegrollen", "Zündung aus", "Antriebsart", "kommen"],
        "Hier Angriffstrupp – verstanden: PKW gegen Wegrollen sichern, Zündung aus, Antriebsart feststellen – kommen.",
        "„hier Angriffstrupp“ . „verstanden“ . Befehl in Stichworten wiederholen: PKW gegen Wegrollen sichern, Zündung aus, Antriebsart feststellen . „kommen“",
        "n_sichern",
        "Befehl korrekt wiederholt.",
        "Wiederholen Sie die drei Teilaufträge: gegen Wegrollen sichern, Zündung aus, Antriebsart feststellen.",
        "Nach **FwDV 3** wiederholt der Truppführer den Befehl. So erkennt der Gruppenführer sofort, ob er richtig verstanden wurde.")
s.choice("n_sichern",
         "Am Fahrzeug: Der Motor läuft noch, es ist ein Fahrzeug mit Schlüssellos-System (Keyless). Am Heck sehen Sie kein „E“ im Kennzeichen, der Tankdeckel ist vorhanden.\n\nWie gehen Sie vor?",
         [("🛑 Unterlegkeile setzen, Feststellbremse, Wählhebel auf P / Gang, Zündung aus, Schlüssel mindestens 5 m vom Fahrzeug weg", "n_meldung"),
          ("🔧 Sofort die Batterie abklemmen", None,
           "Batterie abklemmen ist **kein Standard** und nur nach Befehl sinnvoll: Elektrische Fenster und Sitze lassen sich dann nicht mehr bedienen. Bei Hybrid- oder Elektrofahrzeugen wird das Hochvoltsystem **nach Rettungskarte** abgeschaltet – nie an orangefarbenen Hochvoltleitungen arbeiten."),
          ("🔑 Zündung aus, Schlüssel im Fahrzeug lassen", None,
           "Bei **Keyless**-Systemen kann das Fahrzeug wieder starten, solange der Schlüssel in der Nähe ist. Schlüssel **mindestens 5 m** vom Fahrzeug entfernt ablegen.")])
s.radio("n_meldung",
        "Unterlegkeile sitzen, Feststellbremse angezogen, Wählhebel auf P, Zündung aus, Schlüssel liegt beim Gruppenführer. Benzinfahrzeug. Unter dem Motor tropft **Kühlflüssigkeit**.\n\n"
        "Melden Sie dem Gruppenführer.",
        "Meldung an den Gruppenführer",
        ["Gruppenführer", "Angriffstrupp", "gesichert", "Unterlegkeile", "Zündung aus", "Benzin", "Kühlflüssigkeit", "kommen"],
        "Gruppenführer von Angriffstrupp – PKW mit Unterlegkeilen und Feststellbremse gesichert, Zündung aus, Schlüssel außerhalb. Benzinfahrzeug, Kühlflüssigkeit läuft aus – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . Sicherung (Unterlegkeile, Feststellbremse) . Zündung aus, Schlüssel außerhalb . Antriebsart (Benzin) . Auffälligkeit (Kühlflüssigkeit läuft aus) . „kommen“",
        "n_bergung",
        "Vollständige Meldung: Sicherung, Antriebsart und auslaufende Betriebsmittel.",
        "Melden Sie Sicherung, Zündung/Schlüssel, Antriebsart und die auslaufende Kühlflüssigkeit.",
        "Eine Meldung beantwortet den Befehl **vollständig** und ergänzt neue Erkenntnisse – hier die auslaufende Kühlflüssigkeit.")
s.radio("n_bergung",
        "**Gruppenführer:** „Verstanden. Kühlflüssigkeit mit Bindemittel aufnehmen, Trümmerteile von der Fahrbahn räumen, Fahrzeug für den Abschleppdienst vorbereiten. Abschleppdienst ist verständigt – kommen.“\n\n"
        "Nach getaner Arbeit melden Sie den Abschluss. Es ist die letzte Meldung in diesem Gespräch.",
        "Abschluss melden",
        ["Gruppenführer", "Angriffstrupp", "Bindemittel", "Trümmerteile", "Abschleppdienst", "Ende"],
        "Gruppenführer von Angriffstrupp – Kühlflüssigkeit mit Bindemittel aufgenommen, Trümmerteile geräumt, Fahrzeug für den Abschleppdienst vorbereitet – Ende.",
        "Anruf: Gruppenführer von Angriffstrupp . Bindemittel aufgebracht und aufgenommen . Trümmerteile geräumt . Fahrzeug bereit für den Abschleppdienst . letzte Übertragung: „Ende“",
        "n_end",
        "Auftrag vollständig gemeldet und das Gespräch mit „Ende“ abgeschlossen.",
        "Melden Sie Bindemittel, geräumte Trümmerteile und das vorbereitete Fahrzeug, Abschluss „Ende“.",
        "Ist niemand eingeklemmt, ist **kein hydraulisches Rettungsgerät** nötig. „Bergung“ heißt hier: Betriebsmittel aufnehmen, Fahrbahn räumen, Fahrzeug an den Abschleppdienst übergeben.")
s.end("Fahrzeug gesichert, Keyless und Antriebsart beachtet, Betriebsmittel aufgenommen und Bergung vorbereitet.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("thl", s))

# ---------------------------------------------------------------- THL Sturmschaden
s = S("trupp_thl_kombi", "Truppführer: Sturmschaden – Absichern, Ausleuchten, Verkehr",
      "Truppführer-Übung in Neuhaus: Nach einem Sturm Einsatzstelle absichern, ausleuchten, Verkehr wechselseitig vorbeiführen, zweiten Posten anfordern und den Abschluss melden. 5 Funk-Schritte im Einsatzstellenfunk.",
      TF, "n_anfunken")
anruf(s, "n_anfunken", "Schlauchtrupp",
      "**Gruppenführer:** „Schlauchtrupp von Gruppenführer – kommen.“\n\nNach einem Sturm liegt in Neuhaus auf der Ortsverbindungsstraße ein großer Ast quer über einer Fahrspur. Es ist Nacht.\n\nBeantworten Sie den Anruf.",
      "n_start")
s.radio("n_start",
        "**Gruppenführer:** „Schlauchtrupp: Einsatzstelle in beide Richtungen absichern, Ast ausleuchten und Verkehr einspurig vorbeiführen. Den Ast zerkleinert der Angriffstrupp mit der Motorsäge – kommen.“\n\nWiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Schlauchtrupp", "verstanden", "absichern", "ausleuchten", "Verkehr", "vorbeiführen", "kommen"],
        "Hier Schlauchtrupp – verstanden: Einsatzstelle in beide Richtungen absichern, ausleuchten, Verkehr einspurig vorbeiführen – kommen.",
        "„hier Schlauchtrupp“ . „verstanden“ . Auftrag wiederholen: absichern in beide Richtungen, ausleuchten, Verkehr einspurig vorbeiführen . „kommen“",
        "n_wie",
        "Befehl korrekt wiederholt.",
        "Wiederholen Sie: absichern, ausleuchten, Verkehr einspurig vorbeiführen.",
        "Der Truppführer wiederholt den Befehl in Stichworten (FwDV 3).")
s.choice("n_wie",
         "Sie stellen die Absicherung auf. Die Strecke ist außerorts, Tempo 100 erlaubt, übersichtlich.\n\nWie sichern Sie ab?",
         [("🔺 Warnkleidung, Faltsignale und Warnleuchten in beiden Richtungen deutlich vor der Einsatzstelle (außerorts mindestens ca. 100 m, besser mehr), Leitkegel zur Fahrstreifenverengung", "n_absichern"),
          ("🔺 Ein Leitkegel direkt am Ast reicht, das Blaulicht sieht man ja", None,
           "Bei Tempo 100 braucht ein Fahrer viel Weg, um zu reagieren. Die Vorwarnung muss **deutlich vor** der Einsatzstelle stehen. Richtwerte stehen im Merkblatt „Verkehrsabsicherung von Einsatzstellen der Feuerwehr“ der Staatlichen Feuerwehrschulen Bayern."),
          ("🔦 Erst ausleuchten, dann absichern", None,
           "**Eigenschutz zuerst:** Erst die Absicherung gegen den fließenden Verkehr, dann ausleuchten und arbeiten.")])
s.radio("n_absichern",
        "Die Absicherung steht in beiden Richtungen, ein Lichtmast leuchtet den Ast blendfrei für den Gegenverkehr aus.\n\nMelden Sie den Stand.",
        "Stand melden",
        ["Gruppenführer", "Schlauchtrupp", "Absicherung", "beide Richtungen", "ausgeleuchtet", "kommen"],
        "Gruppenführer von Schlauchtrupp – Absicherung in beide Richtungen mit Faltsignalen, Warnleuchten und Leitkegeln steht, Einsatzstelle blendfrei ausgeleuchtet – kommen.",
        "Anruf: Gruppenführer von Schlauchtrupp . Absicherung in beide Richtungen (Faltsignale, Warnleuchten, Leitkegel) . Ausleuchtung blendfrei . „kommen“",
        "n_verkehr",
        "Stand vollständig gemeldet.",
        "Melden Sie Absicherung in beide Richtungen und die Ausleuchtung.",
        "Melden Sie, **was steht**: Absicherung (womit, in welche Richtungen) und Ausleuchtung. Beleuchtung darf den Verkehr nicht blenden.")
s.radio("n_verkehr",
        "Der Verkehr muss abwechselnd an der Einsatzstelle vorbei. Wegen einer Kuppe sehen Sie das andere Ende nicht. Zwei Personen reichen dafür nicht: Für **wechselseitigen Verkehr** braucht es an **jedem Ende einen Posten**, die sich über Funk abstimmen.\n\n"
        "Melden Sie die Lage und fordern Sie Unterstützung an.",
        "Bedarf melden",
        ["Gruppenführer", "Schlauchtrupp", "wechselseitig", "Posten", "Kuppe", "benötigen", "kommen"],
        "Gruppenführer von Schlauchtrupp – Verkehr muss wechselseitig geführt werden, anderes Ende wegen Kuppe nicht einsehbar. Benötigen einen zweiten Posten mit Funkgerät am Südende – kommen.",
        "Anruf: Gruppenführer von Schlauchtrupp . Lage: Verkehr nur wechselseitig, Ende wegen Kuppe nicht einsehbar . Bedarf: zweiter Posten mit Funkgerät (Südende) . „kommen“",
        "n_frei",
        "Lage und konkreter Bedarf gemeldet.",
        "Melden Sie, warum Sie Unterstützung brauchen, und fordern Sie konkret einen zweiten Posten mit Funkgerät an.",
        "Fordern Sie **konkret** an: was, wie viel, wofür. Wechselseitige Verkehrsführung ohne Sichtkontakt geht nur mit **zwei Posten**, die sich über Funk abstimmen.")
s.radio("n_frei",
        "Der Angriffstrupp hat den Ast mit **Schnittschutzausrüstung** zerkleinert und an den Fahrbahnrand gelegt, die Fahrbahn ist gekehrt. Die Straße ist frei.\n\nMelden Sie den Abschluss. Das ist die letzte Meldung dieses Gesprächs.",
        "Abschluss melden",
        ["Gruppenführer", "Schlauchtrupp", "Fahrbahn frei", "Absicherung", "zurück", "Ende"],
        "Gruppenführer von Schlauchtrupp – Fahrbahn frei, Verkehr läuft wieder in beide Richtungen, bauen die Absicherung von innen nach außen zurück – Ende.",
        "Anruf: Gruppenführer von Schlauchtrupp . Fahrbahn frei, Verkehr läuft wieder . Absicherung wird zurückgebaut (von innen nach außen) . „Ende“",
        "n_end",
        "Abschluss gemeldet.",
        "Melden Sie: Fahrbahn frei, Absicherung wird zurückgebaut, Abschluss „Ende“.",
        "Die Absicherung wird in **umgekehrter Reihenfolge** abgebaut – von der Einsatzstelle nach außen –, damit der Schutz bis zuletzt besteht.")
s.end("Sicher abgesichert, ausgeleuchtet, zweiten Posten angefordert und sauber abgebaut.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("verkehr", s))

# ---------------------------------------------------------------- Verkehr absichern
s = S("trupp_verkehr_absichern", "Truppführer: Schlauchtrupp Verkehrsabsicherung",
      "Truppführer-Übung: Anruf beantworten, Befehl wiederholen, Einsatzstelle an einer unübersichtlichen Kurve richtig absichern und auf Befehl erweitern. 4 Funk-Schritte.",
      TF, "n_anfunken")
anruf(s, "n_anfunken", "Schlauchtrupp",
      "**Gruppenführer:** „Schlauchtrupp von Gruppenführer – kommen.“\n\nVerkehrsunfall auf der Kreisstraße bei Neuhaus, direkt hinter einer unübersichtlichen Rechtskurve.\n\nBeantworten Sie den Anruf.",
      "n_start")
s.radio("n_start",
        "**Gruppenführer:** „Schlauchtrupp: Einsatzstelle in beide Richtungen gegen den fließenden Verkehr absichern. Achtung, Kurve aus Richtung Neuhaus – kommen.“\n\nWiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Schlauchtrupp", "verstanden", "beide Richtungen", "absichern", "Kurve", "kommen"],
        "Hier Schlauchtrupp – verstanden: Einsatzstelle in beide Richtungen absichern, Kurve aus Richtung Neuhaus beachten – kommen.",
        "„hier Schlauchtrupp“ . „verstanden“ . Auftrag: in beide Richtungen absichern . Gefahrenhinweis wiederholen (Kurve aus Richtung Neuhaus) . „kommen“",
        "n_wo",
        "Befehl samt Gefahrenhinweis wiederholt.",
        "Wiederholen Sie den Auftrag und den Hinweis auf die Kurve.",
        "Wiederholen Sie auch **Gefahrenhinweise** – sie sind Teil des Befehls.")
s.choice("n_wo",
         "Sie tragen Warnkleidung. Wo stellen Sie die Vorwarnung aus Richtung Neuhaus auf?",
         [("🔺 **Vor** der Kurve, so dass Fahrer die Warnung sehen, bevor sie in die Kurve einfahren – Weg dorthin hinter der Leitplanke bzw. am Fahrbahnrand gegen die Fahrtrichtung", "n_absicherung"),
          ("🔺 Etwa 100 m vor dem Unfall, also mitten in der Kurve", None,
           "In der Kurve sieht der Fahrer die Warnung zu spät. Die Vorwarnung gehört **vor** die Kurve, damit sie rechtzeitig sichtbar ist."),
          ("🔺 Direkt am Unfallfahrzeug, damit alles zusammen ist", None,
           "Am Unfallfahrzeug ist es für eine Warnung viel zu spät – der Fahrer muss **vorher** bremsen können.")])
s.radio("n_absicherung",
        "Die Absicherung steht: Aus Richtung Neuhaus Faltsignal und Warnleuchte **vor der Kurve**, aus der Gegenrichtung etwa 100 m vor der Einsatzstelle, dazu Leitkegel bis zur Unfallstelle.\n\nGeben Sie die Rückmeldung.",
        "Rückmeldung geben",
        ["Gruppenführer", "Schlauchtrupp", "Absicherung", "vor der Kurve", "Gegenrichtung", "kommen"],
        "Gruppenführer von Schlauchtrupp – Absicherung steht: aus Richtung Neuhaus vor der Kurve, aus der Gegenrichtung etwa 100 Meter vor der Einsatzstelle, Leitkegel bis zur Unfallstelle – kommen.",
        "Anruf: Gruppenführer von Schlauchtrupp . Absicherung Richtung Neuhaus: vor der Kurve . Gegenrichtung: etwa 100 m vorher . Leitkegel bis zur Unfallstelle . „kommen“",
        "n_erweitern",
        "Klare Rückmeldung mit beiden Richtungen.",
        "Melden Sie die Absicherung je Richtung mit Standort.",
        "Melden Sie **je Richtung**, wo die Absicherung steht – dann weiß der Gruppenführer, ob die Einsatzstelle wirklich geschützt ist.")
s.radio("n_erweitern",
        "**Gruppenführer:** „Verstanden. Es setzt Regen ein: Absicherung aus Richtung Neuhaus weiter nach vorn verlängern und einen Warnposten mit Handlampe vor die Kurve stellen. Der Warnposten steht hinter der Leitplanke – kommen.“\n\n"
        "Wiederholen Sie den Zusatzbefehl. Das Gespräch endet damit.",
        "Zusatzbefehl wiederholen",
        ["Schlauchtrupp", "verstanden", "verlängern", "Warnposten", "Leitplanke", "Ende"],
        "Hier Schlauchtrupp – verstanden: Absicherung aus Richtung Neuhaus verlängern, Warnposten mit Handlampe vor die Kurve hinter die Leitplanke – Ende.",
        "„hier Schlauchtrupp“ . „verstanden“ . Absicherung verlängern . Warnposten mit Handlampe vor die Kurve, Standort hinter der Leitplanke . „Ende“",
        "n_end",
        "Zusatzbefehl korrekt wiederholt.",
        "Wiederholen Sie: verlängern, Warnposten mit Handlampe, hinter der Leitplanke.",
        "Ein Warnposten steht **nie auf der Fahrbahn**, sondern geschützt (hinter der Leitplanke / im Seitenraum) und warnt mit Handlampe oder Warnflagge.")
s.end("Absicherung richtig vor der Kurve gesetzt und bei Regen sicher erweitert.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("verkehr", s))

# ---------------------------------------------------------------- Verkehr leiten (Ölspur)
s = S("trupp_verkehr_leiten", "Truppführer: Schlauchtrupp Verkehr leiten",
      "Truppführer-Übung: Verkehr an einer Ölspur vorbeiführen – Befugnis nach bayerischem Recht, Verstoß richtig melden, Unterstützung anfordern und an die Polizei übergeben. 4 Funk-Schritte.",
      TF, "n_anfunken")
anruf(s, "n_anfunken", "Schlauchtrupp",
      "**Gruppenführer:** „Schlauchtrupp von Gruppenführer – kommen.“\n\nÖlspur an der Kreuzung Schulstraße / Hauptstraße in Neuhaus. Die Polizei ist verständigt, aber noch nicht vor Ort.\n\nBeantworten Sie den Anruf.",
      "n_start")
s.radio("n_start",
        "**Gruppenführer:** „Schlauchtrupp: Sperrpunkt an der Kreuzung übernehmen und den Verkehr einspurig an der Ölspur vorbeiführen – kommen.“\n\n"
        "> In Bayern dürfen die eingesetzten Feuerwehrkräfte zur Sicherung der Einsatzstelle den Verkehr regeln (**Art. 7a ZustGVerk** – Befugnisse nach § 36 Abs. 1 StVO). Ihre Zeichen sind dann verbindlich.\n\nWiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Schlauchtrupp", "verstanden", "Sperrpunkt", "Kreuzung", "einspurig", "kommen"],
        "Hier Schlauchtrupp – verstanden: Sperrpunkt an der Kreuzung, Verkehr einspurig an der Ölspur vorbeiführen – kommen.",
        "„hier Schlauchtrupp“ . „verstanden“ . Sperrpunkt an der Kreuzung . Verkehr einspurig vorbeiführen . „kommen“",
        "n_verstoss",
        "Befehl korrekt wiederholt.",
        "Wiederholen Sie: Sperrpunkt an der Kreuzung, Verkehr einspurig vorbeiführen.",
        "Der Truppführer wiederholt den Befehl in Stichworten (FwDV 3).")
s.choice("n_verstoss",
         "Die Verkehrsführung läuft. Ein Fahrer missachtet Ihr Haltezeichen und fährt über die Ölspur weiter. Wie reagieren Sie?",
         [("📝 Nicht hinterherlaufen, Kennzeichen und Fahrzeug merken, an den Gruppenführer für die Polizei melden, weiterregeln", "n_status"),
          ("🏃 Dem Fahrzeug in den Weg stellen", None,
           "**Eigenschutz geht vor.** Stellen Sie sich nie einem Fahrzeug in den Weg. Verstöße verfolgt die Polizei – Sie merken sich Kennzeichen, Fahrzeug und Fahrtrichtung."),
          ("🤷 Ignorieren", None,
           "Der Verstoß gefährdet Einsatzkräfte. Kennzeichen und Fahrzeug merken und über den Gruppenführer an die Polizei weitergeben.")])
s.radio("n_status",
        "Außerdem staut sich der Verkehr aus Richtung Schule bis in die nächste Kreuzung zurück. Ein zweiter Sperrpunkt in der Schulstraße würde das entschärfen.\n\n"
        "Melden Sie dem Gruppenführer Verstoß und Lage und fordern Sie Unterstützung an. Kennzeichen-Buchstaben werden **buchstabiert**: **ERH – AB 123**.",
        "Lage und Bedarf melden",
        ["Gruppenführer", "Schlauchtrupp", "Kennzeichen", "Anton", "Berta", "Stau", "zweiten Sperrpunkt", "kommen"],
        "Gruppenführer von Schlauchtrupp – Fahrzeug hat Haltezeichen missachtet: blauer Kombi, Kennzeichen ich buchstabiere Emil Richard Heinrich – Anton Berta – eins zwo drei, Richtung Hauptstraße. Verkehr staut aus Richtung Schule bis zur nächsten Kreuzung, benötigen zweiten Sperrpunkt Schulstraße – kommen.",
        "Anruf: Gruppenführer von Schlauchtrupp . Verstoß: Fahrzeug, Kennzeichen buchstabiert (Emil Richard Heinrich – Anton Berta – eins zwo drei), Fahrtrichtung . Lage: Stau aus Richtung Schule . Bedarf: zweiter Sperrpunkt Schulstraße . „kommen“",
        "n_polizei",
        "Verstoß mit buchstabiertem Kennzeichen, Lage und Bedarf gemeldet.",
        "Melden Sie Fahrzeug und buchstabiertes Kennzeichen, den Stau und den Bedarf an einem zweiten Sperrpunkt.",
        "Buchstaben im Kennzeichen werden mit dem **deutschen Buchstabieralphabet** durchgegeben, Ziffern einzeln, „zwei“ als **„zwo“**.")
s.radio("n_polizei",
        "Die Polizei trifft ein. Ein Beamter übernimmt den Sperrpunkt an der Kreuzung. Sie haben ihm den Verstoß persönlich übergeben.\n\nMelden Sie die Übergabe. Es ist die letzte Meldung des Gesprächs.",
        "Übergabe melden",
        ["Gruppenführer", "Schlauchtrupp", "Polizei", "übernommen", "Verstoß", "Ende"],
        "Gruppenführer von Schlauchtrupp – Polizei hat den Sperrpunkt Kreuzung übernommen, Verstoß an die Polizei übergeben, Schlauchtrupp kommt zum Fahrzeug – Ende.",
        "Anruf: Gruppenführer von Schlauchtrupp . Polizei hat den Sperrpunkt übernommen . Verstoß übergeben . Trupp kommt zum Fahrzeug zurück . „Ende“",
        "n_end",
        "Übergabe sauber gemeldet.",
        "Melden Sie: Polizei hat übernommen, Verstoß übergeben, Trupp kommt zurück.",
        "Erst nach der **Übergabe an die Polizei** verlässt der Trupp den Sperrpunkt – und meldet sich beim Gruppenführer zurück.")
s.end("Verkehr geführt, Verstoß richtig gemeldet, Kennzeichen buchstabiert und sauber an die Polizei übergeben.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("verkehr", s))

# ---------------------------------------------------------------- Wasserversorgung
s = S("trupp_wasseraufbau", "Truppführer: Wassertrupp Wasserversorgung",
      "Truppführer-Übung nach FwDV 3: Wasserversorgung vom Unterflurhydranten zum Fahrzeug aufbauen – Standrohr, Spülen, Systemtrenner, Wasser marsch auf Befehl des Maschinisten und Meldung an den Gruppenführer. 5 Funk-Schritte.",
      TF, "n_anfunken")
anruf(s, "n_anfunken", "Wassertrupp",
      "**Gruppenführer:** „Wassertrupp von Gruppenführer – kommen.“\n\nScheunenbrand in Neuhaus. Der Angriffstrupp geht mit dem ersten Rohr vor und wird zunächst aus dem Löschwasserbehälter versorgt. Jetzt braucht es eine stabile Wasserversorgung.\n\nBeantworten Sie den Anruf.",
      "n_start")
s.radio("n_start",
        "**Gruppenführer:** „Wassertrupp: Wasserversorgung vom Unterflurhydranten an der Hofeinfahrt zum Fahrzeug herstellen – kommen.“\n\n"
        "> Nach **FwDV 3** stellt der Wassertrupp die Wasserversorgung von der Wasserentnahmestelle zum Fahrzeug her. Die Leitung vom Fahrzeug zum Verteiler legt der Schlauchtrupp.\n\nWiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Wassertrupp", "verstanden", "Wasserversorgung", "Hydrant", "Hofeinfahrt", "Fahrzeug", "kommen"],
        "Hier Wassertrupp – verstanden: Wasserversorgung vom Unterflurhydranten Hofeinfahrt zum Fahrzeug – kommen.",
        "„hier Wassertrupp“ . „verstanden“ . Auftrag: Wasserversorgung . von (Unterflurhydrant Hofeinfahrt) . nach (zum Fahrzeug) . „kommen“",
        "n_reihenfolge",
        "Befehl korrekt wiederholt.",
        "Wiederholen Sie Auftrag, Entnahmestelle und Ziel.",
        "Wiederholen Sie den Befehl in Stichworten: **was, von wo, wohin**.")
s.choice("n_reihenfolge",
         "Am Hydranten: Deckel ist frei, Hydrantenschlüssel und Standrohr liegen bereit. In welcher Reihenfolge arbeiten Sie?",
         [("🔧 Standrohr setzen → Hydrant kurz öffnen und spülen → schließen → Systemtrenner und B-Schlauch zum Fahrzeug anschließen", "n_meldung_ma"),
          ("🔧 Hydrant öffnen, dann Standrohr aufsetzen", None,
           "Ein Unterflurhydrant wird erst geöffnet, wenn das **Standrohr** sitzt – sonst schießt das Wasser unkontrolliert aus dem Schacht."),
          ("🔧 Standrohr setzen und sofort B-Leitung ohne Spülen anschließen", None,
           "Der Hydrant wird vorher **gespült**, damit Sand und Steine nicht in die Pumpe gelangen. Zum Schutz des Trinkwassernetzes gehört außerdem ein **Systemtrenner** dazu.")])
s.radio("n_meldung_ma",
        "Standrohr gesetzt, Hydrant gespült, Systemtrenner und B-Leitung zum Fahrzeug angeschlossen. Der Hydrant ist wieder geschlossen.\n\nMelden Sie dem **Maschinisten**, dass die Leitung bereit ist.",
        "Meldung an den Maschinisten",
        ["Maschinist", "Wassertrupp", "Standrohr", "gespült", "Systemtrenner", "B-Leitung", "kommen"],
        "Maschinist von Wassertrupp – Standrohr gesetzt, Hydrant gespült, Systemtrenner und B-Leitung zum Fahrzeug angeschlossen, bereit zum Öffnen – kommen.",
        "Anruf: Maschinist von Wassertrupp . Standrohr gesetzt . Hydrant gespült . Systemtrenner + B-Leitung angeschlossen . bereit zum Öffnen . „kommen“",
        "n_marsch",
        "Leitung bereit gemeldet – jetzt entscheidet der Maschinist.",
        "Melden Sie: Standrohr, gespült, Systemtrenner und B-Leitung angeschlossen, bereit.",
        "Der **Maschinist** bedient die Pumpe und gibt deshalb das Kommando „Wasser marsch“ für die Zubringerleitung.")
s.radio("n_marsch",
        "**Maschinist:** „Hier Maschinist – Wassertrupp: Wasser marsch – kommen.“\n\nÖffnen Sie den Hydranten **langsam** (Druckstoß vermeiden) und bestätigen Sie.",
        "Wasser marsch bestätigen",
        ["Wassertrupp", "verstanden", "Wasser marsch", "Hydrant", "geöffnet", "kommen"],
        "Hier Wassertrupp – verstanden, Wasser marsch, Hydrant wird langsam geöffnet – kommen.",
        "„hier Wassertrupp“ . „verstanden“ . „Wasser marsch“ wiederholen . Hydrant wird langsam geöffnet . „kommen“",
        "n_fertig",
        "Kommando bestätigt, Hydrant langsam geöffnet.",
        "Bestätigen Sie „Wasser marsch“ und dass der Hydrant geöffnet wird.",
        "Hydranten werden **langsam** geöffnet und geschlossen – ein schneller Druckstoß kann Leitungen und Armaturen beschädigen.")
s.radio("n_fertig",
        "Wasser kommt am Fahrzeug an, die Leitung ist dicht. Melden Sie dem **Gruppenführer**, dass die Wasserversorgung steht und der Trupp für den nächsten Auftrag bereit ist. Es ist die letzte Meldung des Gesprächs.",
        "Meldung an den Gruppenführer",
        ["Gruppenführer", "Wassertrupp", "Wasserversorgung", "steht", "bereit", "Ende"],
        "Gruppenführer von Wassertrupp – Wasserversorgung vom Hydranten Hofeinfahrt zum Fahrzeug steht, Leitung dicht, Wassertrupp bereit für weiteren Auftrag – Ende.",
        "Anruf: Gruppenführer von Wassertrupp . Wasserversorgung Hydrant → Fahrzeug steht . Leitung dicht . Trupp bereit für weiteren Auftrag (z. B. Sicherheitstrupp) . „Ende“",
        "n_end",
        "Auftrag abgeschlossen und Einsatzbereitschaft gemeldet.",
        "Melden Sie: Wasserversorgung steht, Leitung dicht, Trupp bereit.",
        "Nach dem Auftrag meldet sich der Trupp **beim Gruppenführer zurück** und bereit – häufig folgt der nächste Auftrag, z. B. als **Sicherheitstrupp** für den Atemschutzeinsatz.")
s.end("Wasserversorgung nach FwDV 3 aufgebaut: richtige Reihenfolge am Hydranten, Wasser marsch auf Kommando des Maschinisten, Rückmeldung an den Gruppenführer.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("wasser", s))
