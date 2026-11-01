"""THW: Grundausbildung Sprechfunk (Kapitel) und Einsatz-Szenarien.

Quellen: THW-Taschenkarte Sprechfunk (OV Wörth), GA-Handbuch LA 9 „Einsatzgrundlagen“ (2022),
Einsatzhandakten OV Simmern/Gießen (Funkrufnamen, Stärken). Rufnamen-Kennzahlen im Detail
regional – vom Bereichsausbilder Sprechfunk gegenlesen lassen."""
from gen_lib import K, S

OUT = []
HINWEIS = "\n\n> *Beispiel – Kennzahlen und Abläufe können je nach Ortsverband abweichen.*"

# ================================================================ Grundausbildung THW
k = K("thw_grundausbildung", "THW Grundausbildung Sprechfunk",
      "Für neue THW-Helferinnen und -Helfer: In 5 Kapiteln lernst du Heros-Rufnamen, Stärkemeldung, Meldungen nach den 5 W, An- und Abmelden und das Melden von Gefahren.",
      "thw_helfer")
k.chapter("rufnamen", "Heros-Rufnamen lesen", "h")
k.chapter("staerke", "Die Stärkemeldung", "s")
k.chapter("meldung", "Meldung nach den 5 W", "w")
k.chapter("anmelden", "An- und Abmelden", "b")
k.chapter("gefahr", "Gefahr melden", "g")
GF = "**Gruppenführer:**"

# ---------- Kapitel 1: Heros-Rufnamen ----------
k.node("h_start",
       "Dienstabend im **THW-Ortsverband Neuhaus**. Du bist Helfer in der **1. Bergungsgruppe**, euer Fahrzeug ist der Gerätekraftwagen (GKW).\n\n"
       f"{GF} „Beim THW beginnt jeder Funkrufname mit **Heros**, dann der Ortsverband, dann zwei Zahlen: **Einheit / Fahrzeug oder Person**. "
       "Unser GKW ist **Heros Neuhaus 22/51** – 22 ist die 1. Bergungsgruppe, 51 der GKW. **21** ist der Zugtrupp, die **91** steht für die Führungskraft. "
       "Gesprochen wird jede Zahl einzeln: „zweiundzwanzig – einundfünfzig“.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "h_choice")])
k.ask("h", "Wer meldet sich mit **Heros Neuhaus 21/91**?",
      "Der Zugführer (Zugtrupp 21, Führungskraft 91)",
      [("Der GKW der 1. Bergungsgruppe",
        "**Nicht ganz.** Der GKW ist **22/51** – Einheit 22, Fahrzeug 51. Bei **21/91** steht 21 für den **Zugtrupp** und 91 für die **Führungskraft** – also den Zugführer."),
       ("Der Ortsverband selbst",
        "**Nicht ganz.** Der Ortsverband hat eine eigene Kennzahl. **21/91** ist der **Zugführer**: Zugtrupp (21), Führungskraft (91).")],
      "h_speak", [1, 0, 2])
k.node("h_speak", "**Richtig!** Jetzt du: Rufe vom GKW aus den Zugführer. Wie immer: **Wen rufst du – von wem – kommen.**",
       [K.call("Zugführer anfunken", "Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – kommen.",
               ["Heros", "21/91", "22/51", "kommen"], "h_speak2", "h_fail", "Hier Heros Neuhaus 21/91 – kommen.")])
k.retry("h_fail", "**Noch nicht ganz.** Erst der Gerufene, dann „von“ und du: „Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – kommen.“", "h_speak")
k.node("h_speak2", "Der Zugführer antwortet. Melde ihm, dass eure **Bergungsgruppe einsatzbereit** ist.",
       [K.call("Einsatzbereitschaft melden", "Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – Bergungsgruppe einsatzbereit – kommen.",
               ["21/91", "22/51", "einsatzbereit", "kommen"], "h_end", "h_fail2", "Hier Heros Neuhaus 21/91 – verstanden – Ende.")])
k.retry("h_fail2", "**Fast.** „Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – Bergungsgruppe einsatzbereit – kommen.“", "h_speak2")
k.finish("h_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Heros – Ortsverband – Einheit / Fahrzeug oder Person.** 21 Zugtrupp, 22 1. Bergungsgruppe, 51 GKW, 91 Führungskraft.")

# ---------- Kapitel 2: Stärkemeldung ----------
k.node("s_start",
       "Vor dem Einsatz will der Zugführer wissen, wie viele Kräfte ihr seid.\n\n"
       f"{GF} „Die **Stärke** meldet man beim THW **vierteilig**: **Führer / Unterführer / Helfer / gesamt**. "
       "Eine volle Bergungsgruppe ist **null – zwo – sieben – gesamt neun**: kein Zugführer dabei, zwei Unterführer (Gruppenführer und Truppführer), sieben Helfer.“",
       [K.go("ok", "👍 Verstanden", "s_choice")])
k.ask("s", "Heute seid ihr **ein Gruppenführer, ein Truppführer und sechs Helfer**. Wie lautet die Stärke?",
      "„null – zwo – sechs – gesamt acht“",
      [("„Wir sind acht Mann.“",
        "**Nicht ganz.** Die Gesamtzahl allein reicht nicht – die Führung muss wissen, **wie viele Führungskräfte** dabei sind. Immer vierteilig: Führer / Unterführer / Helfer / gesamt."),
       ("„zwo – sechs – acht“",
        "**Fast.** Es fehlt die erste Stelle: die **Führer** (Zugführer). Auch wenn keiner dabei ist, sagst du **null**.")],
      "s_speak", [2, 0, 1])
k.node("s_speak", f"**Richtig!** Der Zugführer fragt:\n\n**Zugführer:** „Heros Neuhaus 22/51 von Heros Neuhaus 21/91 – Frage Stärkemeldung – kommen.“\n\nAntworte mit eurer Stärke.",
       [K.call("Stärke melden", "Hier Heros Neuhaus 22/51 – Stärke null – zwo – sechs – gesamt acht – kommen.",
               ["22/51", "Stärke", "null", "zwo", "sechs", "gesamt", "acht", "kommen"], "s_end", "s_fail", "Hier Heros Neuhaus 21/91 – verstanden – Ende.")])
k.retry("s_fail", "**Noch nicht ganz.** „Hier Heros Neuhaus 22/51 – Stärke null – zwo – sechs – gesamt acht – kommen.“", "s_speak")
k.finish("s_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: Stärke = **Führer / Unterführer / Helfer / gesamt** – auch eine Null wird gesprochen.")

# ---------- Kapitel 3: Meldung nach den 5 W ----------
k.node("w_start",
       "Übung am Trümmerkegel. Du bist mit deinem Truppführer an einem Gebäude eingesetzt.\n\n"
       f"{GF} „Eine gute Meldung beantwortet die **5 W: Wo – Wann – Was – Wie – Wer**. Und sag dazu, ob du es **selbst festgestellt** hast, ob es dir **berichtet** wurde oder ob du es nur **vermutest**. "
       "Sofort melden musst du **Gefahren** und alles, was **vom Auftrag abweicht**.“",
       [K.go("ok", "👍 Verstanden", "w_choice")])
k.ask("w", "Du siehst an der **Giebelwand auf der Nordseite** einen **Riss**, der breiter wird. Welche Meldung ist gut?",
      "„… an der Giebelwand Nordseite einen Riss festgestellt, wird breiter – kommen.“",
      [("„… da ist was an der Wand – kommen.“",
        "**Zu ungenau.** **Wo** an der Wand? **Was** genau? Ändert es sich? Die Führung muss aus deiner Meldung entscheiden können."),
       ("„… das Gebäude stürzt gleich ein – kommen.“",
        "**Vorsicht.** Das ist eine **Vermutung**, als Tatsache gemeldet. Melde, was du **festgestellt** hast – und kennzeichne Vermutungen als „vermutlich“.")],
      "w_speak", [1, 0, 2])
k.node("w_speak", "**Richtig!** Melde jetzt deinem Gruppenführer: Es ist **10:20 Uhr**, Riss an der **Giebelwand Nordseite**, **festgestellt**, er **wird breiter**.",
       [K.call("Meldung absetzen", "Gruppenführer von Truppführer – 10:20 Uhr – an der Giebelwand Nordseite einen Riss festgestellt, wird breiter – kommen.",
               ["Gruppenführer", "Truppführer", "Giebelwand", "Riss", "festgestellt", "breiter", "kommen"],
               "w_end", "w_fail", "Hier Gruppenführer – verstanden, Beobachtungsposten wird aufgestellt – Ende.")])
k.retry("w_fail", "**Noch nicht ganz.** Wann – wo – was – festgestellt – wie: „Gruppenführer von Truppführer – 10:20 Uhr – an der Giebelwand Nordseite einen Riss festgestellt, wird breiter – kommen.“", "w_speak")
k.finish("w_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Wo – Wann – Was – Wie – Wer** – und sagen, ob **festgestellt, berichtet oder vermutet**.")

# ---------- Kapitel 4: An- und Abmelden ----------
k.node("b_start",
       "Großübung mit mehreren Ortsverbänden. Den Funkverkehr leitet die **Führungsstelle Heros Neuhaus 10** – sie ist die **Betriebsleitung** eures Sprechfunkverkehrskreises.\n\n"
       f"{GF} „Kommst du in einen fremden Sprechfunkverkehrskreis, **meldest du dich bei der Betriebsleitung an**. Verlässt du ihn, **meldest du dich ab**. So weiß sie immer, wer da ist.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "b_choice")])
k.ask("b", "Ihr seid mit dem GKW an der Übungsstelle angekommen. Was machst du zuerst über Funk?",
      "Bei der Betriebsleitung Heros Neuhaus 10 anmelden",
      [("Gleich die anderen Gruppen anfunken und Material absprechen",
        "**Nicht ganz.** Erst **anmelden** – die Betriebsleitung muss wissen, dass ihr im Kreis seid, bevor ihr dort funkt."),
       ("Gar nichts – die sehen uns ja",
        "**Nicht ganz.** Gesehen ist nicht gemeldet. Ohne Anmeldung fehlt ihr in der Übersicht der Betriebsleitung.")],
      "b_speak", [2, 1, 0])
k.node("b_speak", "**Richtig!** Melde dich mit dem GKW bei der Betriebsleitung an.",
       [K.call("Anmelden", "Heros Neuhaus 10 von Heros Neuhaus 22/51 – ich melde mich an Ihrem Sprechfunkverkehrskreis an – kommen.",
               ["Heros Neuhaus 10", "22/51", "melde mich an", "kommen"], "b_speak2", "b_fail", "Hier Heros Neuhaus 10 – verstanden – Ende.")])
k.retry("b_fail", "**Noch nicht ganz.** „Heros Neuhaus 10 von Heros Neuhaus 22/51 – ich melde mich an Ihrem Sprechfunkverkehrskreis an – kommen.“", "b_speak")
k.node("b_speak2", "Die Übung ist vorbei, ihr fahrt zurück zur Unterkunft. Melde dich bei der Betriebsleitung ab.",
       [K.call("Abmelden", "Heros Neuhaus 10 von Heros Neuhaus 22/51 – ich melde mich aus Ihrem Sprechfunkverkehrskreis ab – kommen.",
               ["Heros Neuhaus 10", "22/51", "melde mich ab", "kommen"], "b_end", "b_fail2", "Hier Heros Neuhaus 10 – verstanden – Ende.")])
k.retry("b_fail2", "**Fast.** „Heros Neuhaus 10 von Heros Neuhaus 22/51 – ich melde mich aus Ihrem Sprechfunkverkehrskreis ab – kommen.“", "b_speak2")
k.finish("b_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: Neuer Sprechfunkverkehrskreis? **Anmelden.** Weg? **Abmelden.**")

# ---------- Kapitel 5: Gefahr melden ----------
k.node("g_start",
       "Zurück am Trümmerkegel. Du stehst als **Beobachtungsposten** vor dem beschädigten Gebäude, im Inneren arbeitet die Bergungsgruppe.\n\n"
       f"{GF} „Der Beobachtungsposten hat nur eine Aufgabe: das Gebäude beobachten. Siehst du eine **Gefahr**, meldest du **sofort** – bei Gefahr für Leib und Leben darfst du dafür auch einen laufenden Funkverkehr **unterbrechen**.“",
       [K.go("ok", "👍 Verstanden", "g_choice")])
k.ask("g", "Gerade sprechen zwei Trupps über Werkzeug. Da siehst du: **Die Giebelwand bewegt sich.** Was tust du?",
      "Sofort dazwischen funken: Gefahr melden",
      [("Warten, bis der Funkverkehr fertig ist",
        "**Zu spät.** Bei Gefahr für Leib und Leben zählt jede Sekunde – du **unterbrichst** den laufenden Funkverkehr."),
       ("Ins Gebäude laufen und Bescheid sagen",
        "**Gefährlich.** Du bringst dich selbst in den Gefahrenbereich und verlierst Zeit. Melde **über Funk** – sofort.")],
      "g_speak", [1, 0, 2])
k.node("g_speak", "**Richtig!** Funke deinen Gruppenführer an – kurz und klar: **Gefahr**, was du siehst, was zu tun ist.",
       [K.call("Gefahr melden", "Gruppenführer von Beobachtungsposten – Gefahr! Giebelwand bewegt sich – sofort räumen – kommen.",
               ["Gruppenführer", "Beobachtungsposten", "Gefahr", "Giebelwand", "räumen", "kommen"],
               "g_speak2", "g_fail", "Hier Gruppenführer – verstanden. An alle: Gebäude sofort räumen! – kommen.")])
k.retry("g_fail", "**Noch nicht ganz.** „Gruppenführer von Beobachtungsposten – Gefahr! Giebelwand bewegt sich – sofort räumen – kommen.“", "g_speak")
k.node("g_speak2", "Alle Helfer verlassen das Gebäude. Du zählst mit: **alle neun sind draußen**. Melde das.",
       [K.call("Vollzählig melden", "Gruppenführer von Beobachtungsposten – Gebäude geräumt, alle neun Helfer draußen – kommen.",
               ["Gruppenführer", "Beobachtungsposten", "geräumt", "neun", "draußen", "kommen"],
               "g_end", "g_fail2", "Hier Gruppenführer – verstanden – Ende.")])
k.retry("g_fail2", "**Fast.** „Gruppenführer von Beobachtungsposten – Gebäude geräumt, alle neun Helfer draußen – kommen.“", "g_speak2")
k.finish("g_end", "**Übung beendet – alle sind in Sicherheit.** 🎉\n\nDu kennst jetzt die Grundlagen: Heros-Rufnamen, Stärkemeldung, Meldung nach den 5 W, An- und Abmelden und Gefahrenmeldung. **Willkommen im THW-Funk!**", last=True)
OUT.append(("thw", k))

# ================================================================ Gebäudeschaden / Bergung
GFR = "thw_gruppenführer"
s = S("thw_gebaeudeschaden_bergung", "THW: Gebäudeschaden – Bergung mit Einsturzgefahr",
      "Mittel: Als Gruppenführer der 1. Bergungsgruppe an einem teileingestürzten Wohnhaus eintreffen, Lage nach den 5 W melden, bei Einsturzgefahr sofort räumen lassen und die Abweichung vom Auftrag melden. 4 Funk-Schritte.",
      GFR, "n_ankunft")
s.radio("n_ankunft",
        "Nach einer Gasexplosion ist ein Wohnhaus in Neuhaus, Mühlweg 7, **teilweise eingestürzt**. Die Feuerwehr hat das THW angefordert.\n\n"
        "Sie sind **Gruppenführer der 1. Bergungsgruppe** (Ihr Rufname: **Heros Neuhaus 22/91**). Ihr Zugführer ist **Heros Neuhaus 21/91**. Ihre Gruppe ist vollständig: **null / zwo / sieben / gesamt neun**.\n\n"
        "Melden Sie dem Zugführer das Eintreffen mit Stärke." + HINWEIS,
        "Eintreffen melden",
        ["21/91", "22/91", "eingetroffen", "Stärke", "gesamt", "kommen"],
        "Heros Neuhaus 21/91 von Heros Neuhaus 22/91 – 1. Bergungsgruppe an der Einsatzstelle eingetroffen, Stärke null – zwo – sieben – gesamt neun – kommen.",
        "Anruf: Heros Neuhaus 21/91 von Heros Neuhaus 22/91 . Bergungsgruppe eingetroffen . Stärke vierteilig (0/2/7/9) . „kommen“",
        "n_sichern",
        "Eintreffen mit vierteiliger Stärke gemeldet.",
        "Melden Sie das Eintreffen und die Stärke: null – zwo – sieben – gesamt neun.",
        "Beim THW wird die Stärke **vierteilig** gemeldet: Führer / Unterführer / Helfer / gesamt.")
s.choice("n_sichern",
         "**Zugführer:** „Verstanden. Auftrag: Erkundung der Rückseite, nach Verschütteten suchen.“\n\nBevor Ihre Helfer an das Gebäude gehen – was veranlassen Sie?",
         [("👀 Beobachtungsposten aufstellen und gefährdete Bauteile abstützen, dann erkunden", "n_lage"),
          ("🏃 Sofort alle Helfer zur Suche in die Trümmer schicken", None,
           "Ein teileingestürztes Gebäude kann jederzeit nachbrechen. Erst **sichern** (Beobachtungsposten, Abstützen), dann suchen – sonst gefährden Sie die eigenen Helfer."),
          ("⏳ Auf einen Statiker warten und nichts tun", None,
           "Ein Statiker ist sinnvoll, aber **Verschüttete** haben keine Zeit. Mit Beobachtungsposten und Abstützen kann die Erkundung **sicher** beginnen.")])
s.radio("n_lage",
        "Beobachtungsposten steht, die Erkundung läuft. An der **Rückseite im Erdgeschoss** finden Ihre Helfer einen **Hohlraum** und hören **Klopfzeichen**. Gesehen hat noch niemand eine Person. Es ist **10:40 Uhr**.\n\n"
        "Melden Sie die Lage nach den 5 W – und kennzeichnen Sie, was **festgestellt** und was **vermutet** ist.",
        "Lage melden",
        ["21/91", "22/91", "Hohlraum", "Klopfzeichen", "vermutlich", "Person", "Abstützen", "kommen"],
        "Heros Neuhaus 21/91 von Heros Neuhaus 22/91 – 10:40 Uhr – Rückseite Erdgeschoss Hohlraum festgestellt, Klopfzeichen gehört, vermutlich eine Person verschüttet – beginnen mit Abstützen und Freiräumen – kommen.",
        "Anruf . Wann (10:40) . Wo (Rückseite EG) . Was festgestellt (Hohlraum, Klopfzeichen) . Vermutung (vermutlich eine Person) . Maßnahme (Abstützen, Freiräumen) . „kommen“",
        "n_gefahr",
        "Lage vollständig gemeldet – Feststellung und Vermutung sauber getrennt.",
        "Melden Sie Zeit, Ort, Feststellung (Hohlraum, Klopfzeichen), Vermutung (Person) und Ihre Maßnahme.",
        "Der Zugführer muss wissen, was **sicher** ist und was **vermutet**: Davon hängt ab, ob er z. B. Rettungshunde oder Ortungsgeräte nachfordert.")
s.choice("n_gefahr",
         "Ihr Bergungstrupp arbeitet im Hohlraum. Da funkt der Beobachtungsposten dazwischen:\n\n**Beobachtungsposten:** „Gruppenführer von Beobachtungsposten – Gefahr! Giebelwand bewegt sich – kommen.“\n\nWas tun Sie?",
         [("📻 Sofort den Bergungstrupp zum Räumen auffordern", "n_raeumen"),
          ("🔍 Erst selbst hingehen und die Wand ansehen", None,
           "Jede Sekunde zählt. Der Beobachtungsposten ist genau **dafür** da – handeln Sie auf seine Meldung **sofort**."),
          ("🛠️ Den Trupp die Person noch schnell befreien lassen", None,
           "Wenn die Wand fällt, haben Sie **mehr** Verschüttete – auch eigene Helfer. Erst **räumen**, dann neu sichern und weiterarbeiten.")])
s.radio("n_raeumen",
        "Geben Sie dem **Bergungstrupp** den Befehl, das Gebäude sofort zu räumen.",
        "Räumen befehlen",
        ["Gruppenführer", "sofort", "räumen", "Giebelwand", "kommen"],
        "Bergungstrupp von Gruppenführer – sofort räumen! Giebelwand bewegt sich – kommen.",
        "Anruf: Bergungstrupp von Gruppenführer . „sofort räumen!“ . Grund (Giebelwand bewegt sich) . „kommen“",
        "n_abweichung",
        "Räumbefehl kurz und eindeutig gegeben.",
        "Befehlen Sie: sofort räumen – mit Grund.",
        "Ein Räumbefehl muss **kurz und unmissverständlich** sein. Der Grund hilft dem Trupp, den sichersten Weg zu wählen.")
s.radio("n_abweichung",
        "**Bergungstrupp:** „Hier Bergungstrupp – verstanden, räumen.“ Kurz darauf sind **alle neun Helfer draußen**. Die Arbeit am Hohlraum ist unterbrochen.\n\n"
        "Das weicht vom Auftrag ab – melden Sie es dem Zugführer und fordern Sie an, was Sie brauchen: eine **Abstützung der Giebelwand**.",
        "Abweichung melden",
        ["21/91", "22/91", "unterbrochen", "geräumt", "vollzählig", "Giebelwand", "kommen"],
        "Heros Neuhaus 21/91 von Heros Neuhaus 22/91 – Arbeiten am Hohlraum unterbrochen, Gebäude geräumt, Gruppe vollzählig. Giebelwand in Bewegung – benötigen Abstützung der Giebelwand, bevor wir weiterarbeiten – kommen.",
        "Anruf . Abweichung (Arbeiten unterbrochen, geräumt) . Gruppe vollzählig . Grund (Giebelwand in Bewegung) . Bedarf (Abstützung) . „kommen“",
        "n_end",
        "Abweichung, Vollzähligkeit und Bedarf gemeldet.",
        "Melden Sie: Arbeiten unterbrochen, Gebäude geräumt, vollzählig, Grund und benötigte Abstützung.",
        "Abweichungen vom Auftrag sind **sofort** zu melden. Mit „vollzählig“ weiß der Zugführer, dass niemand vermisst wird.")
s.end("**Zugführer:** „Verstanden – Abstützung durch die 2. Bergungsgruppe, danach weiter am Hohlraum.“\n\n"
      "Sichern vor Suchen, Feststellung und Vermutung getrennt, auf die Gefahrenmeldung sofort geräumt und die Abweichung gemeldet – vorbildlich.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("thw", s))

# ================================================================ Hochwasser / Pumpen
s = S("thw_hochwasser_pumpen", "THW: Hochwasser – Großpumpe in der Unterführung",
      "Mittel: Als Gruppenführer der Fachgruppe Wasserschaden/Pumpen bei der Feuerwehr-Einsatzleitung anmelden, den Auftrag wiederholen, Leistung melden und Betriebsstoff nachfordern. 4 Funk-Schritte.",
      GFR, "n_anmelden")
s.radio("n_anmelden",
        "Starkregen in Neuhaus: Die **Unterführung Bahnhofstraße** steht 1,5 m unter Wasser. Die Feuerwehr hat das THW angefordert – das THW ist der **Einsatzleitung der Feuerwehr** unterstellt.\n\n"
        "Sie sind **Gruppenführer der Fachgruppe Wasserschaden/Pumpen** (**Heros Neuhaus 47/91**) mit einer **Großpumpe** (5000 l/min). Stärke: **null / drei / neun / gesamt zwölf**.\n\n"
        "Melden Sie sich bei der Einsatzleitung **Florian Neuhaus 1** an und erbitten Sie einen Auftrag." + HINWEIS,
        "Bei der Einsatzleitung anmelden",
        ["Florian Neuhaus 1", "47/91", "Wasserschaden", "Großpumpe", "Stärke", "Auftrag", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 47/91 – Fachgruppe Wasserschaden Pumpen mit Großpumpe eingetroffen, Stärke null – drei – neun – gesamt zwölf – erbitten Auftrag – kommen.",
        "Anruf: Florian Neuhaus 1 von Heros Neuhaus 47/91 . Einheit + Großpumpe eingetroffen . Stärke vierteilig . „erbitten Auftrag“ . „kommen“",
        "n_auftrag",
        "Bei der Einsatzleitung angemeldet – mit Einheit, Gerät und Stärke.",
        "Melden Sie: Fachgruppe mit Großpumpe eingetroffen, Stärke, erbitten Auftrag.",
        "Das THW arbeitet dem **Bedarfsträger** zu – hier der Feuerwehr. Die Einsatzleitung braucht Einheit, Gerät und Stärke, um Sie richtig einzusetzen.")
s.radio("n_auftrag",
        "**Florian Neuhaus 1:** „Heros Neuhaus 47/91 – Auftrag: Unterführung Bahnhofstraße leerpumpen, Einleitung in die Neu hinter dem Deich. Melden, wenn die Pumpe läuft – kommen.“\n\n"
        "Wiederholen Sie den Auftrag.",
        "Auftrag wiederholen",
        ["47/91", "verstanden", "Unterführung", "Bahnhofstraße", "leerpumpen", "Deich", "kommen"],
        "Hier Heros Neuhaus 47/91 – verstanden: Unterführung Bahnhofstraße leerpumpen, Einleitung in die Neu hinter dem Deich, melden wenn Pumpe läuft – kommen.",
        "„hier Heros Neuhaus 47/91“ . „verstanden“ . Auftrag wiederholen (Unterführung leerpumpen, Einleitung hinter dem Deich, Meldung bei Pumpenstart) . „kommen“",
        "n_aufstellen",
        "Auftrag vollständig wiederholt.",
        "Wiederholen Sie Ziel, Einleitstelle und die Meldepflicht.",
        "Durch die Wiederholung merkt die Einsatzleitung sofort, wenn etwas falsch angekommen ist – etwa eine falsche Einleitstelle.")
s.choice("n_aufstellen",
         "Wo stellen Sie die Großpumpe auf?",
         [("🛻 Am Rand der Unterführung auf festem, erhöhtem Grund – Saugleitung ins Wasser, Druckleitung zum Deich", "n_laeuft"),
          ("🌊 Direkt unten in der Unterführung, möglichst nah am Wasser", None,
           "Steigt das Wasser oder rutscht der Untergrund, ist die Pumpe **verloren** und die Helfer stehen im Gefahrenbereich. Die Pumpe gehört auf **festen, erhöhten Grund**."),
          ("🏘️ Am Deich, und die Saugleitung 200 m lang verlegen", None,
           "Pumpen **saugen** nur über begrenzte Höhe und Länge – lange Saugleitungen kosten Leistung. Die Pumpe steht **nah am Wasser**, gefördert wird über die **Druckleitung**.")])
s.radio("n_laeuft",
        "Die Großpumpe läuft seit **14:10 Uhr** mit voller Leistung, der Wasserstand sinkt. Melden Sie das der Einsatzleitung.",
        "Ausführung melden",
        ["Florian Neuhaus 1", "47/91", "Großpumpe", "14:10", "5000", "Wasserstand", "sinkt", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 47/91 – Großpumpe läuft seit 14:10 Uhr mit 5000 Liter pro Minute, Wasserstand sinkt – kommen.",
        "Anruf . Pumpe läuft seit 14:10 . Leistung (5000 l/min) . Wirkung (Wasserstand sinkt) . „kommen“",
        "n_diesel",
        "Ausführungsmeldung mit Zeit, Leistung und Wirkung.",
        "Melden Sie Startzeit, Leistung und dass der Wasserstand sinkt.",
        "Die Ausführung des Auftrags ist **meldepflichtig**. Mit Leistung und Wirkung kann die Einsatzleitung abschätzen, wie lange es dauert.")
s.radio("n_diesel",
        "Am Abend: Der Diesel reicht noch etwa **bis 18 Uhr**. Für die Nacht brauchen Sie **200 Liter Diesel**. Für Betriebsstoff ist Ihr eigener Zugtrupp zuständig: **Heros Neuhaus 21/10**.\n\n"
        "Fordern Sie den Betriebsstoff an.",
        "Betriebsstoff anfordern",
        ["21/10", "47/91", "Betriebsstoff", "200", "Diesel", "Unterführung", "18 Uhr", "kommen"],
        "Heros Neuhaus 21/10 von Heros Neuhaus 47/91 – Zuführung von Betriebsstoff erforderlich: 200 Liter Diesel zur Unterführung Bahnhofstraße bis 18 Uhr – kommen.",
        "Anruf: Heros Neuhaus 21/10 von Heros Neuhaus 47/91 . „Zuführung von Betriebsstoff erforderlich“ . Was und wie viel (200 l Diesel) . Wohin . Bis wann (18 Uhr) . „kommen“",
        "n_end",
        "Nachforderung mit Menge, Ort und Zeitpunkt.",
        "Fordern Sie an: was, wie viel, wohin, bis wann.",
        "Eine Anforderung braucht **was – wie viel – wohin – bis wann**. Fehlt der Zeitpunkt, steht die Pumpe womöglich trocken.")
s.end("**Heros Neuhaus 21/10:** „Hier 21/10 – verstanden, Diesel kommt bis 17:30 Uhr – Ende.“\n\n"
      "Sauber angemeldet, Auftrag wiederholt, Pumpe sicher aufgestellt und rechtzeitig nachgefordert – die Unterführung ist am Morgen wieder frei.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("thw", s))

# ================================================================ Beleuchtung für die Feuerwehr
s = S("thw_beleuchtung_feuerwehr", "THW: Einsatzstelle ausleuchten für die Feuerwehr",
      "Einsteiger: Als Gruppenführer der Fachgruppe Notversorgung bei der Feuerwehr-Einsatzleitung anmelden, eine Rückfrage stellen, die Ausleuchtung melden und sich am Ende wieder abmelden. 4 Funk-Schritte.",
      GFR, "n_anmelden")
s.radio("n_anmelden",
        "Nachts, Verkehrsunfall mit Lkw auf der Kreisstraße bei Neuhaus. Die Bergung wird Stunden dauern. Die Feuerwehr hat das THW zur **Ausleuchtung** angefordert.\n\n"
        "Sie sind **Gruppenführer der Fachgruppe Notversorgung** (**Heros Neuhaus 24/91**) mit Lichtmast und Stromerzeuger. Einsatzleitung ist **Florian Neuhaus 1**.\n\n"
        "Melden Sie sich an." + HINWEIS,
        "Anmelden",
        ["Florian Neuhaus 1", "24/91", "Notversorgung", "eingetroffen", "Lichtmast", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 24/91 – Fachgruppe Notversorgung mit Lichtmast und Stromerzeuger eingetroffen – erbitten Auftrag – kommen.",
        "Anruf: Florian Neuhaus 1 von Heros Neuhaus 24/91 . Einheit + Gerät eingetroffen . „erbitten Auftrag“ . „kommen“",
        "n_frage",
        "Angemeldet mit Einheit und Gerät.",
        "Melden Sie: Fachgruppe Notversorgung mit Lichtmast eingetroffen, erbitten Auftrag.",
        "Auch als Unterstützung für die Feuerwehr gilt: erst **anmelden**, dann arbeiten.")
s.radio("n_frage",
        "**Florian Neuhaus 1:** „Heros Neuhaus 24/91 – Auftrag: Unfallstelle und Arbeitsbereich am Lkw ausleuchten – kommen.“\n\n"
        "Unklar ist, **wo der Stromerzeuger stehen darf** – auf der Straße wird gearbeitet. Stellen Sie eine Frage.",
        "Rückfrage stellen",
        ["Florian Neuhaus 1", "24/91", "verstanden", "Frage", "Stromerzeuger", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 24/91 – verstanden, Unfallstelle ausleuchten. Frage: Wo darf der Stromerzeuger aufgestellt werden? – kommen.",
        "Auftrag bestätigen (verstanden, ausleuchten) . „Frage“ + Ihre Frage (Standort Stromerzeuger) . „kommen“",
        "n_blenden",
        "Auftrag bestätigt und Frage klar gekennzeichnet.",
        "Bestätigen Sie den Auftrag und stellen Sie Ihre Frage mit „Frage“.",
        "Mit **„Frage“** weiß die Einsatzleitung sofort, dass eine Antwort erwartet wird.")
s.choice("n_blenden",
         "**Florian Neuhaus 1:** „Stromerzeuger auf den Feldweg rechts, 30 Meter hinter der Einsatzstelle – kommen.“\n\nWie richten Sie den Lichtmast aus?",
         [("💡 Hoch und von oben/hinten auf den Arbeitsbereich – Gegenverkehr und Kräfte nicht blenden", "n_meldung"),
          ("🔦 Flach direkt in Fahrtrichtung, damit möglichst weit Licht ist", None,
           "Flaches Licht **blendet** Einsatzkräfte und Verkehr und wirft lange Schatten. Hoch montiert und **von oben** leuchtet es gleichmäßig aus."),
          ("🌟 Alle Scheinwerfer auf den Lkw, der Rest bleibt dunkel", None,
           "Auch **Wege, Rettungsplatz und Absperrung** müssen hell sein – sonst stolpern die Kräfte zwischen Fahrzeugen und Einsatzstelle.")])
s.radio("n_meldung",
        "Lichtmast steht, die Einsatzstelle ist hell, der Stromerzeuger läuft auf dem Feldweg. Mit einer Tankfüllung läuft er etwa **8 Stunden**.\n\nMelden Sie die Ausführung.",
        "Ausführung melden",
        ["Florian Neuhaus 1", "24/91", "ausgeleuchtet", "Stromerzeuger", "8 Stunden", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 24/91 – Einsatzstelle ausgeleuchtet, Stromerzeuger läuft auf dem Feldweg, Betriebsdauer 8 Stunden – kommen.",
        "Anruf . Auftrag ausgeführt (ausgeleuchtet) . Standort Stromerzeuger . Betriebsdauer . „kommen“",
        "n_abmelden",
        "Ausführung mit Betriebsdauer gemeldet.",
        "Melden Sie: ausgeleuchtet, Stromerzeuger läuft, Betriebsdauer 8 Stunden.",
        "Mit der **Betriebsdauer** weiß die Einsatzleitung, ob und wann nachgetankt werden muss.")
s.radio("n_abmelden",
        "Gegen 4 Uhr ist der Lkw geborgen. **Florian Neuhaus 1:** „Heros Neuhaus 24/91 – Ausleuchtung kann abgebaut werden – kommen.“\n\n"
        "Bestätigen Sie und melden Sie sich ab.",
        "Abmelden",
        ["Florian Neuhaus 1", "24/91", "verstanden", "rücken ein", "melde mich ab", "kommen"],
        "Florian Neuhaus 1 von Heros Neuhaus 24/91 – verstanden, bauen ab und rücken ein, ich melde mich ab – kommen.",
        "„verstanden“ . was Sie tun (abbauen, einrücken) . „ich melde mich ab“ . „kommen“",
        "n_end",
        "Sauber abgemeldet.",
        "Bestätigen Sie, dass Sie abbauen und einrücken, und melden Sie sich ab.",
        "Ohne Abmeldung führt die Einsatzleitung Sie weiter als **an der Einsatzstelle**.")
s.end("**Florian Neuhaus 1:** „Hier Florian Neuhaus 1 – verstanden, danke für die Unterstützung – Ende.“\n\n"
      "Angemeldet, nachgefragt statt geraten, blendfrei ausgeleuchtet und sauber abgemeldet.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("thw", s))

# ================================================================ Deich / Sandsackverbau
s = S("thw_deich_sandsack", "THW: Deichverteidigung mit Sandsäcken",
      "Mittel: Als Helfer und Truppführer beim Sandsackverbau eine Sickerstelle melden, Material nachfordern, den Wasserstand durchgeben und die Ablösung mit Stärke übergeben. 4 Funk-Schritte.",
      "thw_helfer", "n_sickerstelle")
s.choice("n_sickerstelle",
         "Hochwasser an der Neu. Ihr Trupp kontrolliert den Deich bei **Kilometer 2,4**. Sie führen den Trupp, Ihr Gruppenführer steht am Sandsacklager.\n\n"
         "Auf der **Landseite** tritt am Deichfuß **trübes Wasser** aus, das mitläuft und Sand mitbringt. Was ist das?" + HINWEIS,
         [("⚠️ Eine Sickerstelle mit Materialaustrag – Gefahr für den Deich, sofort melden", "n_melden"),
          ("💧 Regenwasser – kein Problem", None,
           "Trübes Wasser, das **Sand mitbringt**, kommt **durch** den Deich. Das ist ein Zeichen, dass der Deich innen ausgespült wird – **Gefahr eines Deichbruchs**."),
          ("🧺 Erst einmal selbst ein paar Sandsäcke drauflegen, melden später", None,
           "Gefahren werden **sofort** gemeldet. Der Gruppenführer muss Kräfte und Material dorthin lenken – und weiß ohne Meldung nichts davon.")])
s.radio("n_melden",
        "Melden Sie Ihrem Gruppenführer die Sickerstelle: Ort, was Sie festgestellt haben, was Sie tun.",
        "Sickerstelle melden",
        ["Gruppenführer", "Truppführer", "Kilometer 2,4", "Sickerstelle", "Sand", "festgestellt", "kommen"],
        "Gruppenführer von Truppführer – Gefahr: Deich Kilometer 2,4 Landseite Sickerstelle festgestellt, trübes Wasser mit Sand – beginnen mit Quellkade – kommen.",
        "Anruf: Gruppenführer von Truppführer . „Gefahr“ . Wo (km 2,4, Landseite) . Was festgestellt (Sickerstelle, trübes Wasser mit Sand) . Maßnahme (Quellkade) . „kommen“",
        "n_material",
        "Gefahr mit Ort, Feststellung und Maßnahme gemeldet.",
        "Melden Sie: Gefahr, Kilometer 2,4 Landseite, Sickerstelle mit Sand, Ihre Maßnahme.",
        "Bei Sickerstellen zählt die **genaue Lage** (Kilometer, Land- oder Wasserseite) und ob **Material mitgeführt** wird – das entscheidet über die Dringlichkeit.")
s.radio("n_material",
        "**Gruppenführer:** „Verstanden – Quellkade setzen.“ Für den Ring um die Sickerstelle brauchen Sie etwa **150 gefüllte Sandsäcke** und eine **Schubkarre**.\n\nFordern Sie das Material an.",
        "Material anfordern",
        ["Gruppenführer", "Truppführer", "150", "Sandsäcke", "Schubkarre", "Kilometer 2,4", "kommen"],
        "Gruppenführer von Truppführer – benötigen 150 gefüllte Sandsäcke und eine Schubkarre an Kilometer 2,4 Landseite – kommen.",
        "Anruf . was und wie viel (150 Sandsäcke, Schubkarre) . wohin (km 2,4 Landseite) . „kommen“",
        "n_pegel",
        "Material mit Menge und Ort angefordert.",
        "Fordern Sie an: 150 Sandsäcke, Schubkarre, an Kilometer 2,4.",
        "Mit **Menge und Ort** kann das Lager gezielt liefern – ohne Rückfrage.")
s.radio("n_pegel",
        "Die Quellkade steht, das austretende Wasser ist jetzt **klar**. Der Gruppenführer fragt:\n\n**Gruppenführer:** „Truppführer von Gruppenführer – Frage Wasserstand an der Messlatte – kommen.“\n\nDie Latte zeigt **4 Meter 20**, steigend um etwa **5 Zentimeter pro Stunde**.",
        "Wasserstand durchgeben",
        ["Truppführer", "Wasserstand", "4 Meter 20", "steigend", "5 Zentimeter", "klar", "kommen"],
        "Hier Truppführer – Wasserstand 4 Meter 20, steigend um 5 Zentimeter pro Stunde. Quellkade steht, Wasser tritt jetzt klar aus – kommen.",
        "„hier Truppführer“ . Wasserstand (4,20 m) . Tendenz (steigend, 5 cm/h) . Lage an der Sickerstelle (Wasser klar) . „kommen“",
        "n_abloesung",
        "Messwert mit Tendenz und Lage gemeldet.",
        "Geben Sie Wasserstand, Tendenz und den Zustand der Sickerstelle durch.",
        "Ein Messwert ohne **Tendenz** sagt wenig. Und „Wasser klar“ zeigt, dass die Quellkade wirkt – kein Sand mehr.")
s.radio("n_abloesung",
        "Um Mitternacht kommt die Ablösung. Ihr Trupp: **ein Truppführer und drei Helfer**, alle wohlauf. Melden Sie dem Gruppenführer die Übergabe mit Stärke.",
        "Ablösung melden",
        ["Gruppenführer", "Truppführer", "übergeben", "Stärke", "null", "eins", "drei", "gesamt", "vier", "kommen"],
        "Gruppenführer von Truppführer – Kilometer 2,4 an Ablösung übergeben, Stärke null – eins – drei – gesamt vier, alle wohlauf, rücken zum Lager ab – kommen.",
        "Anruf . übergeben (an Ablösung) . Stärke vierteilig (0/1/3/4) . alle wohlauf . was Sie tun . „kommen“",
        "n_end",
        "Übergabe mit vierteiliger Stärke gemeldet.",
        "Melden Sie Übergabe, Stärke null – eins – drei – gesamt vier und dass alle wohlauf sind.",
        "Bei jeder Ablösung muss die Führung wissen, **wer wo ist** – die vierteilige Stärke macht das eindeutig.")
s.end("**Gruppenführer:** „Verstanden – Ende.“\n\nSickerstelle erkannt, sofort gemeldet, gezielt nachgefordert und mit Tendenz gemessen – der Deich hält.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("thw", s))

# ================================================================ Anmarsch im Verband
s = S("thw_anmarsch_verband", "THW: Anmarsch im Verband zum Bereitstellungsraum",
      "Einsteiger: Als Fahrzeugführer des GKW im Verband die Verständigung prüfen, einen Ausfall unterwegs melden und sich im Bereitstellungsraum bei der Führungsstelle anmelden. 4 Funk-Schritte.",
      GFR, "n_pruefung")
s.radio("n_pruefung",
        "Überörtlicher Hochwassereinsatz. Ihr Technischer Zug fährt **im Verband** zum Bereitstellungsraum am **Sportplatz Altdorf**. Sie führen den **GKW (Heros Neuhaus 22/51)**, der Zugführer fährt vorn im MTW (**Heros Neuhaus 21/91**).\n\n"
        "Vor dem Abmarsch: Prüfen Sie die Verständigung zum Zugführer." + HINWEIS,
        "Verständigung prüfen",
        ["21/91", "22/51", "Frage Verständigung", "kommen"],
        "Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – Frage Verständigung – kommen.",
        "Anruf: Heros Neuhaus 21/91 von Heros Neuhaus 22/51 . „Frage Verständigung“ . „kommen“",
        "n_panne",
        "Verständigungsprüfung korrekt.",
        "Fragen Sie: „Frage Verständigung – kommen.“",
        "Vor einer Fahrt im Verband prüft man, ob die **Funkverbindung steht** – unterwegs ist es zu spät.")
s.radio("n_panne",
        "**Heros Neuhaus 21/91:** „Hier 21/91 – Verständigung gut – kommen.“ Der Verband fährt los.\n\n"
        "Auf der B 12 bei **Kilometer 34** meldet Ihre Bordanzeige einen **Reifenschaden** hinten rechts. Sie müssen anhalten – der Verband fährt weiter. Der Wechsel dauert etwa **30 Minuten**.\n\nMelden Sie das dem Zugführer.",
        "Ausfall melden",
        ["21/91", "22/51", "Reifenschaden", "B 12", "34", "30 Minuten", "kommen"],
        "Heros Neuhaus 21/91 von Heros Neuhaus 22/51 – Reifenschaden, halten auf der B 12 bei Kilometer 34, Radwechsel etwa 30 Minuten, kommen selbstständig nach – kommen.",
        "Anruf . was (Reifenschaden) . wo (B 12, km 34) . wie lange (ca. 30 min) . was Sie tun (kommen selbstständig nach) . „kommen“",
        "n_entscheid",
        "Ausfall mit Ort, Dauer und Absicht gemeldet.",
        "Melden Sie: Reifenschaden, Ort, Dauer, dass Sie nachkommen.",
        "Wer den Verband verlässt, muss das **sofort** melden – sonst fehlt ein Fahrzeug, ohne dass es jemand merkt.")
s.choice("n_entscheid",
         "**Heros Neuhaus 21/91:** „Verstanden – Verband fährt weiter. Melden Sie sich direkt im Bereitstellungsraum bei **Heros Neuhaus 10** an.“\n\n"
         "Nach dem Radwechsel kommen Sie am Sportplatz Altdorf an. Wen funken Sie an?",
         [("📻 Die Führungsstelle Heros Neuhaus 10 – sie leitet den Bereitstellungsraum", "n_anmelden"),
          ("📻 Den Zugführer, der ist ja schon da", None,
           "Der Zugführer hat Sie ausdrücklich an **Heros Neuhaus 10** verwiesen. Der Bereitstellungsraum wird von der **Führungsstelle** geführt – dort melden Sie sich an."),
          ("🤐 Niemanden – einfach neben die anderen Fahrzeuge stellen", None,
           "Im Bereitstellungsraum muss die Führung wissen, **welche Kräfte verfügbar** sind. Ohne Anmeldung werden Sie nicht eingeplant.")])
s.radio("n_anmelden",
        "Melden Sie sich bei der Führungsstelle an – mit Stärke: **null / zwo / sieben / gesamt neun**.",
        "Im Bereitstellungsraum anmelden",
        ["Heros Neuhaus 10", "22/51", "Sportplatz", "eingetroffen", "Stärke", "gesamt", "einsatzbereit", "kommen"],
        "Heros Neuhaus 10 von Heros Neuhaus 22/51 – im Bereitstellungsraum Sportplatz Altdorf eingetroffen, Stärke null – zwo – sieben – gesamt neun, einsatzbereit – kommen.",
        "Anruf: Heros Neuhaus 10 von Heros Neuhaus 22/51 . eingetroffen (Bereitstellungsraum) . Stärke vierteilig . „einsatzbereit“ . „kommen“",
        "n_end",
        "Im Bereitstellungsraum mit Stärke und Einsatzbereitschaft angemeldet.",
        "Melden Sie: eingetroffen, Stärke, einsatzbereit.",
        "Im Bereitstellungsraum zählt für die Führung: **wer ist da, wie stark, einsatzbereit?**")
s.end("**Heros Neuhaus 10:** „Hier Heros Neuhaus 10 – verstanden, warten Sie auf Einsatzauftrag – Ende.“\n\n"
      "Verbindung geprüft, Ausfall sofort gemeldet und richtig im Bereitstellungsraum angemeldet.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("thw", s))
