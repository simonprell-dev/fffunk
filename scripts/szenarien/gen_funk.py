from gen_lib import S

OUT = []
GF = "gruppenführer_a"

# ---------------------------------------------------------------- Alarm & Ausrücken
s = S("alarm_ausruecken", "Alarmierung und Ausrücken",
      "Einsteiger: Alarmierung über die ILS, Status 3/4/5 korrekt per Taste senden, Nachinformation der Leitstelle quittieren und an der Einsatzstelle die erste Lagemeldung absetzen. 3 Funk-Schritte.",
      GF, "n_alarm")
s.choice("n_alarm",
         "Ihr Funkmeldeempfänger löst aus: **„B 3 – Wohnhaus – Neuhaus, Birkenweg 12 – Rauch aus dem Dachgeschoss“**.\n\n"
         "Sie sind Gruppenführer auf **Florian Neuhaus 44/1**. Das Fahrzeug ist mit einer Gruppe (**1/8**) besetzt und rückt aus dem Gerätehaus aus.\n\n"
         "> In Bayern alarmiert die **Integrierte Leitstelle (ILS)** über Funkmeldeempfänger und Sirene – nicht über Sprechfunk. Fahrzeugzustände werden als **Status per Taste** gesendet.\n\n"
         "Was tun Sie beim Ausrücken?",
         [("⌨️ Status 3 drücken", "n_anruf"),
          ("📞 Leitstelle anrufen und „Ausrücken“ melden", None,
           "Das Ausrücken wird nicht gesprochen, sondern mit **Status 3** (Einsatzauftrag übernommen) gesendet. Ein Sprechfunkanruf blockiert die Sprechgruppe der Leitstelle unnötig – gerade dann, wenn viele Fahrzeuge gleichzeitig ausrücken."),
          ("⌨️ Status 1 drücken", None,
           "**Status 1** heißt „einsatzbereit über Funk“, also frei für neue Einsätze. Mit Übernahme des Einsatzes gilt **Status 3**.")])
s.radio("n_anruf",
        "Auf der Anfahrt meldet sich die Leitstelle:\n\n**Leitstelle:** „Florian Neuhaus 44/1 von Leitstelle – kommen.“\n\nBeantworten Sie den Anruf korrekt.",
        "Anruf beantworten",
        ["hier", "Florian Neuhaus", "kommen"],
        "Hier Florian Neuhaus 44/1 – kommen.",
        "Antwort beginnt mit „hier“ . eigener Funkrufname . mit „kommen“ die Sprecherlaubnis zurückgeben",
        "n_nachinfo",
        "Anruf korrekt beantwortet: „hier“ + eigener Rufname + „kommen“.",
        "Die Antwort auf einen Anruf lautet „Hier <eigener Rufname> – kommen“.",
        "Auf einen Anruf antworten Sie mit **„hier“ + eigenem Funkrufnamen + „kommen“**. Kein „hört“, kein „ja bitte“ – „hört“ ist kein Betriebswort.")
s.radio("n_nachinfo",
        "**Leitstelle:** „Nachinformation zum Einsatz Birkenweg 12: Laut Anrufer sind **alle Bewohner im Freien**. Der **Gasanschluss** befindet sich im **Keller** – kommen.“\n\n"
        "Quittieren Sie die Nachinformation und wiederholen Sie die einsatzwichtigen Punkte.",
        "Nachinformation quittieren",
        ["Florian Neuhaus", "verstanden", "Bewohner im Freien", "Gasanschluss", "Keller", "kommen"],
        "Hier Florian Neuhaus 44/1 – verstanden: alle Bewohner im Freien, Gasanschluss im Keller – kommen.",
        "Eigener Rufname . „verstanden“ . die wichtigen Inhalte kurz wiederholen (alle Bewohner im Freien, Gasanschluss im Keller) . „kommen“ – die Leitstelle hat das Gespräch eröffnet und beendet es",
        "n_ankunft",
        "Nachinformation quittiert und die einsatzwichtigen Punkte wiederholt.",
        "Quittieren Sie mit „verstanden“ und wiederholen Sie die wichtigen Inhalte: Bewohner im Freien, Gasanschluss im Keller.",
        "Einsatzwichtige Informationen werden **quittiert und kurz wiederholt** – so merkt die Leitstelle sofort, wenn etwas falsch angekommen ist. Das Gespräch hat die Leitstelle eröffnet, deshalb beendet sie es auch mit „Ende“.")
s.choice("n_ankunft",
         "**Leitstelle:** „Verstanden – Ende.“\n\nSie erreichen den Birkenweg 12. Aus dem Dachgeschoss des freistehenden Einfamilienhauses dringt dichter Rauch. Die Bewohner stehen auf der Straße und bestätigen: Es ist niemand mehr im Haus.\n\nWas melden Sie zuerst?",
         [("⌨️ Status 4 drücken", "n_sprechwunsch"),
          ("📞 Ankunft per Sprechfunk melden", None,
           "Die Ankunft an der Einsatzstelle wird mit **Status 4** gesendet – nicht gesprochen. Gesprochen wird erst die Lagemeldung.")])
s.choice("n_sprechwunsch",
         "Status 4 ist gesendet. Nach der ersten Erkundung wollen Sie der ILS die **Lagemeldung** durchgeben.\n\nWie nehmen Sie Kontakt zur Leitstelle auf?",
         [("⌨️ Status 5 (Sprechwunsch) drücken", "n_lage"),
          ("📞 Sofort in die Leitstellen-Sprechgruppe sprechen", None,
           "Im Regelfall meldet sich ein Fahrzeug bei der ILS mit **Status 5 (Sprechwunsch)** und wartet, bis die Leitstelle ruft. So kann die Leitstelle die Gespräche ordnen. Ein **priorisierter Sprechwunsch (Status 0)** oder direktes Sprechen sind nur bei Gefahr im Verzug vorgesehen – die Regelung Ihrer ILS gilt.")])
s.radio("n_lage",
        "**Leitstelle:** „Florian Neuhaus 44/1 von Leitstelle – Sprechwunsch – kommen.“\n\n"
        "Geben Sie die **Lagemeldung** nach Schema ab: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung**.",
        "Lagemeldung sprechen",
        ["Florian Neuhaus", "Birkenweg", "Einfamilienhaus", "Dachgeschoss", "Bewohner im Freien", "Innenangriff", "keine Nachforderung", "kommen"],
        "Hier Florian Neuhaus 44/1 – Lagemeldung: Birkenweg 12, freistehendes Einfamilienhaus, Brand im Dachgeschoss. Alle Bewohner im Freien, kein Menschenleben in Gefahr. Brandbekämpfung mit einem Rohr im Innenangriff eingeleitet. Keine Nachforderung – kommen.",
        "Eigener Rufname + „Lagemeldung“ . WO: Birkenweg 12, freistehendes Einfamilienhaus . WAS: Brand im Dachgeschoss . MENSCHENLEBEN: alle Bewohner im Freien, niemand in Gefahr . MASSNAHMEN: ein Rohr im Innenangriff . NACHFORDERUNG: keine . „kommen“",
        "n_end",
        "Lagemeldung vollständig nach Schema abgesetzt.",
        "Die Lagemeldung braucht: Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung.",
        "Die Lagemeldung folgt einem festen Schema:\n1. **Wo** – Adresse und Objekt\n2. **Was** – Art und Umfang des Schadens\n3. **Menschenleben in Gefahr** – ja oder nein\n4. **Eigene Maßnahmen**\n5. **Nachforderung** – auch „keine Nachforderung“ ausdrücklich sagen")
s.end("**Leitstelle:** „Hier Leitstelle – Lagemeldung verstanden, keine Nachforderung – Ende.“\n\n"
      "Sauber gearbeitet: Status 3, 4 und 5 per Taste gesendet, die Nachinformation quittiert und eine vollständige Lagemeldung abgesetzt.\n\n"
      "> **Merke:** Status werden gedrückt, nicht gesprochen. Auf dem Rückweg folgt **Status 1**, im Gerätehaus nach Wiederherstellung der Einsatzbereitschaft **Status 2**.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("funk", s))

# ---------------------------------------------------------------- Koordination Nachkräfte
s = S("koordination_nachkraefte", "Koordination der Nachkräfte",
      "Mittel: Als Gruppenführer des ersteintreffenden Fahrzeugs nachrückende Kräfte über Funk einweisen – Anfahrt mit Meldepunkt, Einsatzauftrag nach Befehlsschema und Auftrag für die Drehleiter. 3 Funk-Schritte.",
      GF, "n_anfahrt_start")
s.radio("n_anfahrt_start",
        "Sie sind Gruppenführer des ersteintreffenden Fahrzeugs **Florian Neuhaus 44/1** und Einsatzleiter an der Einsatzstelle **Dorfstraße 8 in Neuhaus** (Scheunenbrand). Die ILS hat für den Einsatz eine **Einsatz-Sprechgruppe (TMO)** zugewiesen.\n\n"
        "Das nachgeforderte **Florian Adelsdorf 44/1** ist auf Anfahrt:\n\n"
        "**Florian Adelsdorf 44/1:** „Florian Neuhaus 44/1 von Florian Adelsdorf 44/1 – Frage Anfahrtsweg – kommen.“\n\n"
        "Geben Sie die **Anfahrt mit Meldepunkt** durch. Die Dorfstraße ist durch Schläuche und Fahrzeuge eng – nachrückende Kräfte sollen sich zuerst melden.",
        "Anfahrt durchgeben",
        ["Florian Neuhaus", "Hauptstraße", "Kirche", "Dorfstraße", "Gartenweg", "melden", "kommen"],
        "Hier Florian Neuhaus 44/1 – Anfahrt über die Hauptstraße, an der Kirche links in die Dorfstraße. Melden an der Kreuzung Dorfstraße / Gartenweg – kommen.",
        "„hier“ + eigener Rufname . Anfahrtsweg mit markanten Punkten (Hauptstraße, Kirche links, Dorfstraße) . Meldepunkt (Kreuzung Dorfstraße / Gartenweg) . „kommen“",
        "n_weiterweisung",
        "Anfahrtsweg mit markanten Punkten und klarem Meldepunkt durchgegeben.",
        "Geben Sie den Anfahrtsweg mit markanten Punkten und einen eindeutigen Meldepunkt durch.",
        "Nachrückende Kräfte brauchen eine **eindeutige Route** (markante Punkte wie Kirche, Kreuzungen) und einen **Meldepunkt**. So fahren sie sich nicht an der engen Einsatzstelle fest und Sie können sie gezielt einsetzen.")
s.radio("n_weiterweisung",
        "**Florian Adelsdorf 44/1:** „Hier Florian Adelsdorf 44/1 – Meldepunkt Kreuzung Dorfstraße / Gartenweg erreicht – Frage Auftrag – kommen.“\n\n"
        "Geben Sie den **Einsatzauftrag** nach Befehlsschema: **Einheit – Auftrag – Mittel – Ziel – Weg**. Die Gruppe soll die **Wasserversorgung** vom Hydranten am Gartenweg zur Einsatzstelle aufbauen.",
        "Einsatzauftrag geben",
        ["Florian Neuhaus", "Florian Adelsdorf", "Wasserversorgung", "Hydrant", "Gartenweg", "Dorfstraße", "kommen"],
        "Hier Florian Neuhaus 44/1 – Florian Adelsdorf 44/1: Aufbau der Wasserversorgung vom Hydranten Gartenweg zum Verteiler vor der Scheune Dorfstraße 8, Fahrzeug am Hydranten Gartenweg aufstellen – kommen.",
        "Einheit (Florian Adelsdorf 44/1) . Auftrag (Wasserversorgung aufbauen) . Mittel / Entnahmestelle (Hydrant Gartenweg) . Ziel (Verteiler vor der Scheune Dorfstraße 8) . Weg / Aufstellort (am Hydranten Gartenweg) . „kommen“",
        "n_drehleiter",
        "Einsatzauftrag nach Befehlsschema erteilt.",
        "Geben Sie den Auftrag nach Schema: Einheit – Auftrag – Mittel – Ziel – Weg.",
        "Ein Einsatzauftrag nach FwDV 3 / FwDV 100 nennt **Einheit – Auftrag – Mittel – Ziel – Weg**. Damit weiß die nachrückende Einheit genau, was sie wo und womit tun soll.")
s.radio("n_drehleiter",
        "**Florian Adelsdorf 44/1:** „Verstanden – Ende.“\n\nKurz darauf:\n\n**Florian Neuhaus 33/1 (Drehleiter):** „Florian Neuhaus 44/1 von Florian Neuhaus 33/1 – kurz vor der Einsatzstelle – Frage Auftrag und Aufstellung – kommen.“\n\n"
        "Das Wohnhaus neben der Scheune ist bedroht. Die **Nordseite** ist über den Gartenweg frei anfahrbar. Geben Sie der Drehleiter **Auftrag** und **Aufstellbereich** – die genaue Aufstellung legt der Maschinist der Drehleiter fest.",
        "Auftrag Drehleiter geben",
        ["Florian Neuhaus", "Aufstellbereich", "Nordseite", "Gartenweg", "Riegelstellung", "Wohnhaus", "kommen"],
        "Hier Florian Neuhaus 44/1 – Florian Neuhaus 33/1: Riegelstellung zum Schutz des Wohnhauses, Aufstellbereich Nordseite, Zufahrt über den Gartenweg ist frei – kommen.",
        "Einheit (Florian Neuhaus 33/1) . Auftrag (Riegelstellung zum Schutz des Wohnhauses) . Aufstellbereich (Nordseite) . Zufahrt (über den Gartenweg frei) . „kommen“",
        "n_end",
        "Drehleiter mit Auftrag und Aufstellbereich eingewiesen.",
        "Nennen Sie Auftrag (Schutz des Wohnhauses), Aufstellbereich (Nordseite) und die freie Zufahrt (Gartenweg).",
        "Die Drehleiter braucht einen **klaren Auftrag** und den **Aufstellbereich mit Zufahrt**. Wo genau sie abgestützt wird, entscheidet ihr Maschinist anhand von Untergrund und Hindernissen.")
s.end("**Florian Neuhaus 33/1:** „Hier Florian Neuhaus 33/1 – verstanden, Riegelstellung Nordseite – Ende.“\n\n"
      "Alle nachrückenden Kräfte sind gezielt eingewiesen: Meldepunkt, Auftrag nach Befehlsschema, Drehleiter mit Aufstellbereich.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("funk", s))

# ---------------------------------------------------------------- Lagemeldung & Nachforderung
s = S("lagemeldung_nachalarmierung", "Lagemeldung und Nachforderung",
      "Mittel: Lagemeldung mit sofortiger Nachforderung (Drehleiter und Rettungsdienst) an die ILS, Folgemeldung zur Menschenrettung, „Feuer unter Kontrolle“ und „Feuer aus“. 4 Funk-Schritte.",
      GF, "n_vor_ort")
s.radio("n_vor_ort",
        "Sie sind mit **Florian Neuhaus 44/1** als erste Einheit an der **Bergstraße 4 in Neuhaus** eingetroffen und haben **Status 4** gedrückt.\n\n"
        "**Lage:** Freistehendes Einfamilienhaus, **Dachgeschoss in Vollbrand**. Am Dachfenster ist **eine Person** zu sehen und ruft um Hilfe. Der Treppenraum ist stark verraucht. Keine weiteren Kräfte vor Ort.\n\n"
        "Sie haben **Status 5** gedrückt.\n\n**Leitstelle:** „Florian Neuhaus 44/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie die **Lagemeldung** ab. Weil Menschenleben in Gefahr sind, fordern Sie **sofort** nach – nicht „Nachforderung folgt“.",
        "Lagemeldung mit Nachforderung",
        ["Florian Neuhaus", "Bergstraße", "Einfamilienhaus", "Dachgeschoss", "Person", "Menschenrettung", "Drehleiter", "Rettungsdienst", "kommen"],
        "Hier Florian Neuhaus 44/1 – Lagemeldung: Bergstraße 4, freistehendes Einfamilienhaus, Dachgeschoss in Vollbrand. Eine Person im Dachgeschoss, Menschenleben in Gefahr. Menschenrettung über den Innenangriff eingeleitet. Nachforderung: Drehleiter und Rettungsdienst – kommen.",
        "Eigener Rufname + „Lagemeldung“ . WO: Bergstraße 4, freistehendes Einfamilienhaus . WAS: Dachgeschoss in Vollbrand . MENSCHENLEBEN: eine Person im Dachgeschoss in Gefahr . MASSNAHMEN: Menschenrettung über Innenangriff eingeleitet . NACHFORDERUNG: Drehleiter + Rettungsdienst . „kommen“",
        "n_folge",
        "Lagemeldung vollständig – die Nachforderung kam sofort mit.",
        "Lagemeldung nach Schema und die Nachforderung (Drehleiter, Rettungsdienst) gleich mitgeben.",
        "Sind Menschenleben in Gefahr, gehört die **Nachforderung direkt in die erste Lagemeldung** – jede Minute Anfahrt zählt. Lieber früh nachfordern und später abbestellen.\n\nSchema: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung**.")
s.radio("n_folge",
        "**Leitstelle:** „Hier Leitstelle – verstanden. Drehleiter Florian Neuhaus 33/1, RTW und Notarzt sind alarmiert – Ende.“\n\n"
        "Der Angriffstrupp hat die Person über den Treppenraum ins Freie gebracht. Sie hat eine Rauchgasvergiftung und wurde an den eingetroffenen Rettungsdienst übergeben. Die Drehleiter ist eingetroffen und unterstützt die Brandbekämpfung von außen.\n\n"
        "Setzen Sie eine **Folgemeldung** ab (Status 5 ist gedrückt, die Leitstelle hat Sie gerufen). Über Funk **keine Namen** von Betroffenen.",
        "Folgemeldung sprechen",
        ["Florian Neuhaus", "Folgemeldung", "Person gerettet", "Rettungsdienst", "Rauchgasvergiftung", "Drehleiter", "kommen"],
        "Hier Florian Neuhaus 44/1 – Folgemeldung Bergstraße 4: eine Person gerettet und mit Verdacht auf Rauchgasvergiftung an den Rettungsdienst übergeben. Brandbekämpfung innen mit einem Rohr und außen über die Drehleiter – kommen.",
        "Eigener Rufname + „Folgemeldung“ . Menschenrettung abgeschlossen: eine Person gerettet . Übergabe an den Rettungsdienst, Verdacht Rauchgasvergiftung . aktuelle Maßnahmen: innen ein Rohr, außen Drehleiter . keine Namen über Funk . „kommen“",
        "n_kontrolle",
        "Folgemeldung klar und ohne personenbezogene Daten.",
        "Melden Sie: Person gerettet, an Rettungsdienst übergeben, aktuelle Maßnahmen – ohne Namen.",
        "Eine **Folgemeldung** aktualisiert die Lage: Was hat sich geändert, was läuft gerade? Personenbezogene Daten (Namen, Geburtsdaten) gehören **nicht** in den Funk.")
s.radio("n_kontrolle",
        "**Leitstelle:** „Verstanden – Ende.“\n\nNach einiger Zeit ist die Ausbreitung gestoppt: Der Brand kann sich nicht weiter ausbreiten, die Löscharbeiten laufen noch.\n\n"
        "Melden Sie der Leitstelle die Standardmeldung dafür.",
        "„Feuer unter Kontrolle“ melden",
        ["Florian Neuhaus", "Bergstraße", "Feuer unter Kontrolle", "kommen"],
        "Hier Florian Neuhaus 44/1 – Einsatz Bergstraße 4: Feuer unter Kontrolle – kommen.",
        "Eigener Rufname . Einsatzstelle (Bergstraße 4) . Standardmeldung „Feuer unter Kontrolle“ = keine weitere Ausbreitung, Löscharbeiten laufen noch . „kommen“",
        "n_aus",
        "„Feuer unter Kontrolle“ korrekt gemeldet.",
        "Die Standardmeldung lautet „Feuer unter Kontrolle“.",
        "**„Feuer unter Kontrolle“** heißt: keine weitere Ausbreitung, die Löscharbeiten laufen aber noch. **„Feuer aus“** folgt erst, wenn kein offenes Feuer mehr vorhanden ist.")
s.radio("n_aus",
        "**Leitstelle:** „Verstanden – Ende.“\n\nDie Nachlöscharbeiten sind weit fortgeschritten, kein offenes Feuer mehr. Die **Polizei** ist vor Ort und übernimmt die Einsatzstelle zur **Brandursachenermittlung**, sobald Sie fertig sind.\n\n"
        "Melden Sie **„Feuer aus“** und die geplante Übergabe.",
        "„Feuer aus“ melden",
        ["Florian Neuhaus", "Feuer aus", "Nachlöscharbeiten", "Polizei", "übergeben", "kommen"],
        "Hier Florian Neuhaus 44/1 – Einsatz Bergstraße 4: Feuer aus, Nachlöscharbeiten laufen. Einsatzstelle wird anschließend an die Polizei übergeben – kommen.",
        "Eigener Rufname . Einsatzstelle . „Feuer aus“ . Nachlöscharbeiten laufen . Übergabe der Einsatzstelle an die Polizei (Brandursachenermittlung) . „kommen“",
        "n_end",
        "„Feuer aus“ und die Übergabe an die Polizei gemeldet.",
        "Melden Sie „Feuer aus“, die laufenden Nachlöscharbeiten und die Übergabe an die Polizei.",
        "Nach **„Feuer aus“** folgen Nachlöscharbeiten und die **Übergabe der Einsatzstelle** (hier an die Polizei). Erst danach geht es zurück – auf dem Rückweg **Status 1**.")
s.end("**Leitstelle:** „Hier Leitstelle – Feuer aus, verstanden – Ende.“\n\n"
      "Komplette Meldekette nach Lagemeldung: sofortige Nachforderung, Folgemeldung, „Feuer unter Kontrolle“, „Feuer aus“.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("funk", s))

# ---------------------------------------------------------------- Mayday (Truppführer)
TF = "truppführer"
s = S("mayday_atemschutznotfall", "Mayday: Truppmann verschüttet",
      "Profi: Als Truppführer des Angriffstrupps einen Atemschutznotfall melden – Notruftaste und Mayday nach FwDV 7, Lage ergänzen, Anweisungen bestätigen und das Ende der Rettung melden. 4 Funk-Schritte.",
      TF, "n_start")
s.choice("n_start",
         "Sie sind Truppführer des Angriffstrupps von **Florian Neuhaus 44/1** im Innenangriff, Wohnungsbrand im **zweiten Obergeschoss**. Einsatzleiter ist **Florian Neuhaus 11/1**, gefunkt wird im Einsatzstellenfunk (DMO).\n\n"
         "**Lage:** Im Wohnzimmer bricht ein Teil der abgehängten Decke herunter. Ihr **Truppmann ist verschüttet und reagiert nicht**. Der Weg zurück zur Tür ist teilweise versperrt. Ihr Behälterdruck: **80 bar**.\n\nWas tun Sie zuerst?",
         [("🆘 Notruftaste am Funkgerät drücken und Mayday absetzen", "n_mayday"),
          ("🧱 Erst allein versuchen, den Truppmann freizulegen", None,
           "Jede Sekunde ohne Notruf verzögert die Rettung. Nach **FwDV 7** setzt der Trupp in einer Notlage **sofort** Mayday ab – erst danach folgen eigene Rettungsversuche. Der Sicherheitstrupp braucht Zeit, bis er bei Ihnen ist."),
          ("🚪 Rückweg suchen und draußen Hilfe holen", None,
           "Ein Trupp bleibt **zusammen**. Verlassen Sie den Truppmann, findet ihn im Rauch womöglich niemand mehr. Notruf über Funk, beim Truppmann bleiben.")])
s.radio("n_mayday",
        "Notruftaste ist gedrückt. Setzen Sie den **Mayday-Notruf** im Wortlaut der FwDV 7 ab: Kennwort – wer – wo – was – Abschluss.",
        "Mayday sprechen",
        ["Mayday", "Angriffstrupp", "zweites Obergeschoss", "Wohnzimmer", "Truppmann", "verschüttet", "kommen"],
        "Mayday, Mayday, Mayday – hier Angriffstrupp Florian Neuhaus 44/1 – zweites Obergeschoss, Brandwohnung, Wohnzimmer – Truppmann verschüttet und bewusstlos, Rückweg teilweise versperrt – Mayday, kommen!",
        "Kennwort dreimal: Mayday, Mayday, Mayday . „hier“ + eigener Funkrufname (Angriffstrupp Florian Neuhaus 44/1) . Standort so genau wie möglich (Geschoss, Wohnung, Raum) . Lage (Truppmann verschüttet und bewusstlos, Rückweg teilweise versperrt) . Abschluss: „Mayday, kommen“",
        "n_lage",
        "Mayday nach FwDV 7: Kennwort dreimal, Rufname, Standort, Lage, „Mayday, kommen“.",
        "Mayday enthält: dreimal „Mayday“, „hier“ + Rufname, Standort, Lage und „Mayday, kommen“.",
        "Der Mayday-Notruf hat nach **FwDV 7** eine feste Reihenfolge:\n1. **„Mayday, Mayday, Mayday“**\n2. **„hier“ + eigener Funkrufname**\n3. **Standort** – Geschoss, Wohnung, Raum\n4. **Lage** – Art des Notfalls\n5. **„Mayday, kommen“**\n\nMayday hat **Vorrang vor jedem anderen Funkverkehr**.")
s.radio("n_lage",
        "**Einsatzleiter:** „Hier Florian Neuhaus 11/1 – Mayday verstanden. Sicherheitstrupp geht vor. Frage genauer Standort und Behälterdruck – kommen.“\n\n"
        "Ergänzen Sie den **genauen Standort mit Anhaltspunkt** und Ihren **Behälterdruck**.",
        "Standort und Druck ergänzen",
        ["Angriffstrupp", "zweites Obergeschoss", "Wohnzimmer", "Fenster", "bar", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – zweites Obergeschoss, Wohnzimmer, links neben dem Fenster zur Straße, Schlauchleitung führt zu uns – Behälterdruck 80 bar – kommen!",
        "„hier“ + Rufname . genauer Standort mit Anhaltspunkt (2. OG, Wohnzimmer, links neben dem Fenster zur Straße) . Hinweis für den Sicherheitstrupp: Schlauchleitung führt zu uns . Behälterdruck in bar . „kommen“",
        "n_anweisung",
        "Standort präzisiert und Druck gemeldet – der Sicherheitstrupp kann gezielt vorgehen.",
        "Nennen Sie Rufname, genauen Standort mit Anhaltspunkt und Behälterdruck in bar.",
        "Der Sicherheitstrupp braucht **Geschoss, Raum und einen Anhaltspunkt** (Fenster, Tür, Möbel) und den Hinweis, dass er der **Schlauchleitung** folgen kann. Der **Behälterdruck** zeigt, wie viel Zeit bleibt.")
s.radio("n_anweisung",
        "**Einsatzleiter:** „Florian Neuhaus 11/1 an alle: Atemschutznotfall im zweiten Obergeschoss. Funkverkehr nur noch für den Notfall. – Angriffstrupp: Bleiben Sie beim Truppmann, machen Sie sich mit der Lampe bemerkbar, Sicherheitstrupp in etwa zwei Minuten bei Ihnen – kommen.“\n\n"
        "Bestätigen Sie die Anweisung kurz.",
        "Anweisung bestätigen",
        ["Angriffstrupp", "verstanden", "bleibe beim Truppmann", "Lampe", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – verstanden, bleibe beim Truppmann, mache mich mit der Lampe bemerkbar – kommen.",
        "„hier“ + Rufname . „verstanden“ . Anweisung kurz wiederholen (bleibe beim Truppmann, mache mich mit der Lampe bemerkbar) . „kommen“ – danach Funkdisziplin",
        "n_rettung",
        "Anweisung kurz bestätigt – Funk bleibt frei für die Rettung.",
        "Bestätigen Sie mit Rufname, „verstanden“ und der kurzen Wiederholung der Anweisung.",
        "Im Atemschutznotfall gilt **Funkdisziplin**: kurz bestätigen, Anweisung wiederholen, danach nur noch Wichtiges funken.")
s.radio("n_rettung",
        "Der Sicherheitstrupp erreicht Sie, legt den Truppmann frei, schließt ihn an die Notluftversorgung an und bringt ihn mit Ihnen in den raucharmen Treppenraum und ins Freie. Der Rettungsdienst übernimmt.\n\n"
        "Melden Sie dem Einsatzleiter: **Rettung abgeschlossen, Angriffstrupp vollständig im Freien**. Das Mayday hebt **der Einsatzleiter** auf – nicht Sie.",
        "Rettung melden",
        ["Angriffstrupp", "Truppmann", "gerettet", "Rettungsdienst", "im Freien", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – Truppmann durch Sicherheitstrupp gerettet und an den Rettungsdienst übergeben, Angriffstrupp vollständig im Freien – kommen.",
        "„hier“ + Rufname . Truppmann durch den Sicherheitstrupp gerettet . an den Rettungsdienst übergeben . Angriffstrupp vollständig im Freien . „kommen“ – die Aufhebung spricht der Einsatzleiter",
        "n_end",
        "Rettung gemeldet – die Aufhebung des Mayday überlassen Sie dem Einsatzleiter.",
        "Melden Sie: Truppmann gerettet, an den Rettungsdienst übergeben, Trupp vollständig im Freien.",
        "Sie melden das **Ergebnis**. Die **Aufhebung** von Mayday und Funkbeschränkung gibt der **Einsatzleiter** an alle durch – einzelne Funkstellen nehmen den normalen Funkverkehr nicht eigenmächtig wieder auf.")
s.end("**Einsatzleiter:** „Florian Neuhaus 11/1 an alle: Atemschutznotfall beendet, Funkverkehr wieder frei.“\n\n"
      "Vorbildlich: sofort Notruftaste und Mayday, Lage ergänzt, Funkdisziplin gehalten, Rettung gemeldet. Nach dem Einsatz: Untersuchung durch den Rettungsdienst und Angebot der **PSNV** (Psychosoziale Notfallversorgung für Einsatzkräfte).\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("funk", s))

# ---------------------------------------------------------------- Vollübung
s = S("volluebung_einsatzablauf", "Vollübung: Kompletter Einsatzablauf",
      "Profi: Kompletter Einsatz von der Alarmierung bis zur Einsatzbereitschaft – Status 3/4/5/1/2 per Taste, Lagemeldung mit Nachforderung, Folgemeldung zur Menschenrettung, „Feuer unter Kontrolle“, „Feuer aus“ und Einsatzende. 4 Funk-Schritte.",
      GF, "n_alarm")
s.choice("n_alarm",
         "Alarm über Funkmeldeempfänger und Sirene: **„B 4 – Wohnhaus, Person in Gefahr – Neuhaus, Hauptstraße 22 – Mehrfamilienhaus, Rauch aus dem 2. OG“**.\n\n"
         "Sie sind Gruppenführer auf **Florian Neuhaus 44/1**, besetzt mit **1/8**. Was tun Sie beim Ausrücken?",
         [("⌨️ Status 3 drücken", "n_ankunft"),
          ("📞 Bei der Leitstelle Einsatzbereitschaft melden und Einsatzbefehl erfragen", None,
           "Der Einsatzauftrag kommt in Bayern mit der Alarmierung durch die ILS. Beim Ausrücken senden Sie **Status 3** – keine Sprechfunkmeldung, keine Frage nach dem Einsatzbefehl.")])
s.choice("n_ankunft",
         "Sie treffen an der Hauptstraße 22 ein. Viergeschossiges Mehrfamilienhaus, **zweites OG in Vollbrand**, Flammen schlagen aus den Fenstern. **Zwei Personen** stehen am Fenster im zweiten OG zur Straße. Der Treppenraum ist verraucht.\n\nWelche Status-Tasten drücken Sie?",
         [("⌨️ Status 4, dann Status 5", "n_lage"),
          ("⌨️ Nur Status 5", None, "Zuerst kommt **Status 4** (Ankunft an der Einsatzstelle), danach **Status 5** für den Sprechwunsch zur Lagemeldung."),
          ("📞 „Status vier“ über Funk sprechen", None, "Status werden **gedrückt**, nicht gesprochen.")])
s.radio("n_lage",
        "**Leitstelle:** „Florian Neuhaus 44/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie die **Lagemeldung** ab und fordern Sie das nach, was Sie für **zwei Personen über die Straßenseite** brauchen.",
        "Lagemeldung mit Nachforderung",
        ["Florian Neuhaus", "Hauptstraße", "Mehrfamilienhaus", "zweites Obergeschoss", "zwei Personen", "Menschenrettung", "Drehleiter", "Rettungsdienst", "kommen"],
        "Hier Florian Neuhaus 44/1 – Lagemeldung: Hauptstraße 22, Mehrfamilienhaus mit vier Geschossen, zweites Obergeschoss in Vollbrand, Treppenraum verraucht. Zwei Personen am Fenster zweites Obergeschoss, Menschenleben in Gefahr. Menschenrettung eingeleitet. Nachforderung: Drehleiter und Rettungsdienst für zwei Personen – kommen.",
        "Eigener Rufname + „Lagemeldung“ . WO: Hauptstraße 22, Mehrfamilienhaus . WAS: 2. OG in Vollbrand, Treppenraum verraucht . MENSCHENLEBEN: zwei Personen am Fenster in Gefahr . MASSNAHMEN: Menschenrettung eingeleitet . NACHFORDERUNG: Drehleiter + Rettungsdienst für zwei Personen . „kommen“",
        "n_folge",
        "Lagemeldung mit sofortiger Nachforderung – so muss es sein.",
        "Lagemeldung nach Schema, Nachforderung Drehleiter und Rettungsdienst nicht vergessen.",
        "Bei Personen am Fenster und verrauchtem Treppenraum ist die **Drehleiter** das Rettungsmittel. Fordern Sie sie und den **Rettungsdienst** sofort mit an.\n\nSchema: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung**.")
s.radio("n_folge",
        "**Leitstelle:** „Verstanden – Drehleiter Florian Neuhaus 33/1, zwei RTW und Notarzt alarmiert – Ende.“\n\n"
        "Über die Drehleiter werden beide Personen gerettet. Eine hat Verdacht auf Rauchgasvergiftung. Beide sind an den Rettungsdienst übergeben. Der Brand wird mit zwei Rohren bekämpft.\n\n"
        "Status 5 ist gedrückt, die Leitstelle ruft Sie. Setzen Sie die **Folgemeldung** ab – ohne Namen.",
        "Folgemeldung sprechen",
        ["Florian Neuhaus", "Folgemeldung", "zwei Personen", "gerettet", "Rettungsdienst", "zwei Rohre", "kommen"],
        "Hier Florian Neuhaus 44/1 – Folgemeldung Hauptstraße 22: zwei Personen über Drehleiter gerettet und an den Rettungsdienst übergeben, eine mit Verdacht auf Rauchgasvergiftung. Brandbekämpfung mit zwei Rohren – kommen.",
        "Eigener Rufname + „Folgemeldung“ . Menschenrettung: zwei Personen über die Drehleiter gerettet . an den Rettungsdienst übergeben (eine mit Verdacht auf Rauchgasvergiftung) . Brandbekämpfung mit zwei Rohren . keine Namen . „kommen“",
        "n_kontrolle",
        "Folgemeldung vollständig und ohne Namen.",
        "Melden Sie: zwei Personen gerettet, an den Rettungsdienst übergeben, Brandbekämpfung mit zwei Rohren.",
        "Eine Folgemeldung sagt, **was sich geändert hat**. Personen werden über Funk nicht namentlich genannt. Der Transport ist Sache des Rettungsdienstes – Ihr Löschfahrzeug bleibt im Einsatz.")
s.radio("n_kontrolle",
        "**Leitstelle:** „Verstanden – Ende.“\n\nDer Brand breitet sich nicht weiter aus, die Löscharbeiten laufen. Melden Sie das der ILS mit der Standardmeldung.",
        "„Feuer unter Kontrolle“ melden",
        ["Florian Neuhaus", "Hauptstraße", "Feuer unter Kontrolle", "kommen"],
        "Hier Florian Neuhaus 44/1 – Einsatz Hauptstraße 22: Feuer unter Kontrolle – kommen.",
        "Eigener Rufname . Einsatzstelle . „Feuer unter Kontrolle“ . „kommen“",
        "n_aus",
        "Standardmeldung korrekt.",
        "Die Meldung lautet „Feuer unter Kontrolle“.",
        "**„Feuer unter Kontrolle“** = keine weitere Ausbreitung, Löscharbeiten laufen noch.")
s.radio("n_aus",
        "**Leitstelle:** „Verstanden – Ende.“\n\nKein offenes Feuer mehr, die Nachlöscharbeiten sind abgeschlossen, die Wohnungen sind mit der Wärmebildkamera kontrolliert. Die Polizei übernimmt die Einsatzstelle. Sie rücken ein.\n\n"
        "Melden Sie **„Feuer aus“**, die Übergabe und dass Sie einrücken.",
        "„Feuer aus“ und Einsatzende melden",
        ["Florian Neuhaus", "Feuer aus", "Polizei", "übergeben", "rücken ein", "kommen"],
        "Hier Florian Neuhaus 44/1 – Einsatz Hauptstraße 22: Feuer aus, Nachkontrolle durchgeführt, Einsatzstelle an die Polizei übergeben, rücken ein – kommen.",
        "Eigener Rufname . „Feuer aus“ . Nachkontrolle durchgeführt . Einsatzstelle an die Polizei übergeben . „rücken ein“ . „kommen“ – Status 1 wird anschließend gedrückt",
        "n_einruecken",
        "„Feuer aus“ und Einsatzende gemeldet.",
        "Melden Sie: Feuer aus, Übergabe an die Polizei, rücken ein.",
        "Zum Einsatzende gehören **„Feuer aus“**, die **Übergabe der Einsatzstelle** und das **Einrücken**. Die Status folgen per Taste.")
s.choice("n_einruecken",
         "**Leitstelle:** „Verstanden – Ende.“\n\nSie fahren zurück ins Gerätehaus. Dort werden Schläuche getauscht, Atemschutzgeräte ersetzt und das Fahrzeug aufgerüstet.\n\nWelche Status senden Sie?",
         [("⌨️ Auf der Rückfahrt Status 1, nach dem Aufrüsten Status 2", "n_end"),
          ("⌨️ Sofort Status 2", None, "**Status 2** heißt „einsatzbereit auf Wache“. Auf der Rückfahrt sind Sie **über Funk** einsatzbereit = **Status 1**."),
          ("⌨️ Status 2 bei Ankunft im Gerätehaus, noch vor dem Aufrüsten", None, "Ohne getauschte Schläuche und Atemschutzgeräte sind Sie **nicht voll einsatzbereit**. Status 2 erst nach dem Aufrüsten – bis dahin ggf. **Status 6**, wenn das Fahrzeug nicht einsatzfähig ist.")])
s.end("Vollständiger Einsatzablauf trainiert: Status 3 → 4 → 5, Lagemeldung mit Nachforderung, Folgemeldung, „Feuer unter Kontrolle“, „Feuer aus“, Status 1 → 2.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("funk", s))
