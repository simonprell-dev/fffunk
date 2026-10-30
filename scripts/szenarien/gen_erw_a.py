from gen_lib import S

OUT = []
GF = "gruppenführer_a"
TF = "truppführer"
EL = "einsatzleit"

# ================================================================ Buchstabieren
s = S("buchstabieren_din5009", "Buchstabieren: Kennzeichen und Namen durchgeben",
      "Einsteiger: Nach einer Unfallflucht der ILS das Kennzeichen und eine Firmenaufschrift buchstabiert durchgeben, auf „wiederholen Sie alles nach …“ richtig reagieren und Zahlen einzeln sprechen. 5 Funk-Schritte.",
      GF, "n_start")
s.choice("n_start",
         "Verkehrsunfall auf der Kreisstraße zwischen Neuhaus und Adelsdorf. Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1**. Ein Kastenwagen hat einen geparkten PKW gestreift, aus dem PKW läuft etwas Öl aus. **Niemand ist verletzt.** Der Verursacher ist **weitergefahren**.\n\n"
         "Ein Zeuge hat sich notiert: weißer Kastenwagen, Aufschrift **„Bäckerei Pfab“**, Kennzeichen **ERH – DA 47**, Unfallzeit **14:32 Uhr**.\n\n"
         "Das wollen Sie der ILS durchgeben. Wie geben Sie die Buchstaben durch?",
         [("🔤 Mit „ich buchstabiere“ ankündigen und jeden Buchstaben mit dem Wort der Buchstabiertafel sprechen: Emil – Richard – Heinrich …", "n_lage"),
          ("✈️ Mit dem NATO-Alphabet: Echo – Romeo – Hotel …", None,
           "Das internationale NATO-Alphabet ist im deutschen BOS-Funk **nicht üblich**. Verwendet wird das **deutsche Buchstabieralphabet** – entscheidend ist, dass Sender und Empfänger **dieselbe Tafel** benutzen."),
          ("🔡 Einfach die Buchstaben sprechen: „E – R – H – D – A“", None,
           "Einzelne Buchstaben klingen im Funk zum Verwechseln ähnlich (**D/T, B/P, E/D, M/N**). Deshalb wird mit einer **Buchstabiertafel** buchstabiert.")])
s.radio("n_lage",
        "Die Einsatzstelle ist abgesichert, das Öl wird mit Bindemittel aufgenommen. Sie haben **Status 5** gedrückt.\n\n"
        "**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie eine kurze **Lagemeldung** und fordern Sie die **Polizei** wegen der Unfallflucht nach. Kennzeichen und Fahrzeug folgen gleich.",
        "Lagemeldung mit Nachforderung Polizei",
        ["Florian Neuhaus", "Lagemeldung", "Kreisstraße", "keine Verletzten", "geflüchtet", "Polizei", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Lagemeldung: Kreisstraße zwischen Neuhaus und Adelsdorf, ein geparkter PKW angefahren, keine Verletzten, Verursacher geflüchtet. Einsatzstelle abgesichert, Öl wird abgebunden. Nachforderung: Polizei – kommen.",
        "„hier“ + Rufname . „Lagemeldung“ . WO: Kreisstraße Neuhaus – Adelsdorf . WAS: geparkter PKW angefahren, Verursacher geflüchtet . MENSCHENLEBEN: keine Verletzten . MASSNAHMEN: abgesichert, Öl wird abgebunden . NACHFORDERUNG: Polizei . „kommen“",
        "n_kennzeichen",
        "Lagemeldung vollständig – die Polizei wird verständigt.",
        "Melden Sie Ort, was passiert ist, dass niemand verletzt ist, Ihre Maßnahmen und fordern Sie die Polizei nach.",
        "Auch bei einem kleinen Einsatz gilt das Schema: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung**. Die Unfallflucht ist Sache der **Polizei** – sie wird über die ILS verständigt.")
s.radio("n_kennzeichen",
        "**Leitstelle:** „Hier Leitstelle – verstanden, Polizei wird verständigt. Frage Kennzeichen des flüchtigen Fahrzeugs – kommen.“\n\n"
        "Kennzeichen: **ERH – DA 47**. Kündigen Sie das Buchstabieren an und sprechen Sie die Zahlen **einzeln**.\n\n"
        "| E | R | H | D | A |\n|:--:|:--:|:--:|:--:|:--:|\n| Emil | Richard | Heinrich | Dora | Anton |",
        "Kennzeichen buchstabieren",
        ["Florian Neuhaus", "ich buchstabiere", "Emil", "Richard", "Heinrich", "Dora", "Anton", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Kennzeichen, ich buchstabiere: Emil Richard Heinrich – Dora Anton – vier sieben – kommen.",
        "„hier“ + Rufname . „Kennzeichen, ich buchstabiere“ . Ortskennung: Emil Richard Heinrich . kurze Pause . Buchstaben: Dora Anton . Zahlen einzeln: vier sieben . „kommen“",
        "n_rueckfrage",
        "Sauber buchstabiert, mit kurzer Pause zwischen den Kennzeichen-Teilen.",
        "Kündigen Sie mit „ich buchstabiere“ an und sprechen Sie Emil Richard Heinrich – Dora Anton – vier sieben.",
        "Mit **„ich buchstabiere“** weiß die Gegenstelle, dass jetzt Buchstabierwörter kommen. Eine **kurze Pause** zwischen Ortskennung, Buchstaben und Zahlen macht die Gliederung des Kennzeichens hörbar. Zahlen werden **einzeln** gesprochen: „vier sieben“, nicht „siebenundvierzig“.")
s.choice("n_rueckfrage",
         "**Leitstelle:** „Hier Leitstelle – wiederholen Sie alles nach Heinrich – kommen.“\n\n"
         "Die ILS hat den Teil nach der Ortskennung nicht sicher verstanden. Wie antworten Sie?",
         [("🔁 Mit „ich wiederhole“ nur den angefragten Teil noch einmal buchstabieren: Dora Anton – vier sieben", "n_wiederholen"),
          ("📢 Das komplette Kennzeichen und die Lagemeldung noch einmal von vorn", None,
           "Die ILS hat **gezielt** nach dem Teil **nach „Heinrich“** gefragt. Wiederholen Sie genau diesen Teil – alles andere blockiert den Kanal unnötig."),
          ("⚡ Schnell „D – A – 47“ hinterherschieben", None,
           "Was beim ersten Mal nicht ankam, kommt ohne Buchstabiertafel erst recht nicht an. Mit **„ich wiederhole“** ankündigen und **wieder buchstabieren**.")])
s.radio("n_wiederholen",
        "Wiederholen Sie den angefragten Teil des Kennzeichens.",
        "Teil wiederholen",
        ["Florian Neuhaus", "ich wiederhole", "Dora", "Anton", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – ich wiederhole: Dora Anton – vier sieben – kommen.",
        "„hier“ + Rufname . „ich wiederhole“ . nur den angefragten Teil: Dora Anton – vier sieben . „kommen“",
        "n_aufschrift",
        "Genau der angefragte Teil – kurz und eindeutig.",
        "Sagen Sie „ich wiederhole“ und buchstabieren Sie nur den Teil nach Heinrich: Dora Anton – vier sieben.",
        "**„Wiederholen Sie alles nach …“** fragt gezielt einen Teil ab. Die Antwort beginnt mit **„ich wiederhole“** und enthält genau diesen Teil.")
s.radio("n_aufschrift",
        "**Leitstelle:** „Hier Leitstelle – verstanden: Emil Richard Heinrich – Dora Anton – vier sieben. Frage Fahrzeugbeschreibung und Fluchtrichtung – kommen.“\n\n"
        "Weißer Kastenwagen mit Aufschrift **„Bäckerei Pfab“**, Fluchtrichtung **Adelsdorf**. Der Name ist ungewöhnlich – am Funk könnte „Pfaff“ oder „Pfab“ ankommen. Buchstabieren Sie ihn.\n\n"
        "| P | F | A | B |\n|:--:|:--:|:--:|:--:|\n| Paula | Friedrich | Anton | Berta |",
        "Fahrzeug und Namen buchstabieren",
        ["Kastenwagen", "ich buchstabiere", "Paula", "Friedrich", "Anton", "Berta", "Adelsdorf", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – weißer Kastenwagen, Aufschrift Bäckerei Pfab, ich buchstabiere: Paula Friedrich Anton Berta. Fluchtrichtung Adelsdorf – kommen.",
        "„hier“ + Rufname . Fahrzeug (weißer Kastenwagen) . Aufschrift „Bäckerei Pfab“ – „ich buchstabiere“: Paula Friedrich Anton Berta . Fluchtrichtung (Adelsdorf) . „kommen“",
        "n_zahlen",
        "Fahrzeug, Name und Fluchtrichtung eindeutig durchgegeben.",
        "Beschreiben Sie das Fahrzeug, buchstabieren Sie „Pfab“ (Paula Friedrich Anton Berta) und nennen Sie die Fluchtrichtung.",
        "**Eigennamen** werden buchstabiert, weil sie sich nicht aus dem Zusammenhang erraten lassen. Erst das Wort sprechen, dann **„ich buchstabiere“** und die Buchstabierwörter.")
s.choice("n_zahlen",
         "**Leitstelle:** „Hier Leitstelle – verstanden: Bäckerei Paula Friedrich Anton Berta, weißer Kastenwagen, Richtung Adelsdorf. Frage Unfallzeit – kommen.“\n\n"
         "Der Zeuge nennt **14:32 Uhr**. Wie sprechen Sie die Uhrzeit?",
         [("🔢 Ziffern einzeln: „eins – vier – drei – zwo“", "n_zeit"),
          ("🕑 „vierzehn Uhr zweiunddreißig“", None,
           "Zusammengesetzte Zahlen werden am Funk leicht verwechselt („zweiunddreißig“ / „dreiundzwanzig“). Im BOS-Funk werden Zahlen **einzeln** gesprochen: „eins – vier – drei – zwo“."),
          ("🕑 „halb drei, kurz danach“", None,
           "Ungefähre Zeitangaben helfen der Polizei nicht. Geben Sie die notierte Zeit **genau** und **ziffernweise** durch.")])
s.radio("n_zeit",
        "In der Ausbildung ist **„zwo“** statt „zwei“ üblich – so lässt es sich bei schlechter Verbindung nicht mit „drei“ verwechseln. Geben Sie die Unfallzeit durch. Die Personalien des Zeugen nimmt die Polizei vor Ort auf – **nicht über Funk**.",
        "Unfallzeit durchgeben",
        ["Florian Neuhaus", "Unfallzeit", "Zeuge", "Polizei", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Unfallzeit laut Zeuge eins vier drei zwo. Zeuge wartet an der Einsatzstelle auf die Polizei – kommen.",
        "„hier“ + Rufname . Unfallzeit ziffernweise (eins – vier – drei – zwo) . Hinweis: Zeuge wartet auf die Polizei (keine Personalien über Funk) . „kommen“",
        "n_end",
        "Uhrzeit ziffernweise, Zeuge an die Polizei verwiesen – ohne Namen im Funk.",
        "Sprechen Sie die Unfallzeit Ziffer für Ziffer und sagen Sie, dass der Zeuge auf die Polizei wartet.",
        "Zahlen und Uhrzeiten werden **Ziffer für Ziffer** gesprochen. Personalien von Beteiligten oder Zeugen gehören **nicht** in den Funk – die Polizei nimmt sie vor Ort auf.")
s.end("**Leitstelle:** „Hier Leitstelle – verstanden, Unfallzeit eins vier drei zwo, Polizei ist informiert – Ende.“\n\n"
      "Kennzeichen und Name sauber buchstabiert, gezielte Rückfrage mit „ich wiederhole“ beantwortet, Zahlen einzeln gesprochen.\n\n"
      "> **Merke:** Im BOS-Funk ist die Buchstabiertafel mit **Namen** verbreitet (Anton, Berta, Cäsar, Dora, Emil … – für S teils **Samuel**, teils **Siegfried**). Die **DIN 5009** sieht seit **2022** eine neue Tafel mit **Städtenamen** vor (Augsburg, Berlin, Chemnitz …). Entscheidend ist, dass **alle Beteiligten dieselbe Tafel** benutzen – es gilt die Regelung Ihrer ILS bzw. Ihrer Ausbildung.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("funk", s))

# ================================================================ Schlechte Verbindung / DMO
s = S("verbindung_schlecht_dmo", "Schlechte Verbindung: wiederholen und auf DMO wechseln",
      "Mittel: Als Truppführer im zweiten Untergeschoss einer Tiefgarage mit abreißendem Funk umgehen – auf „wiederholen Sie“ richtig antworten, Standort wechseln, in die vorgegebene DMO-Sprechgruppe wechseln und die Grenzen von DMO kennen. 5 Funk-Schritte.",
      TF, "n_start")
s.radio("n_start",
        "PKW-Brand im **zweiten Untergeschoss** einer Tiefgarage unter einer Wohnanlage in Neuhaus. Sie sind **Truppführer des Angriffstrupps** von Florian Neuhaus 17/42/1 und gehen unter Atemschutz mit dem ersten Rohr über die Zufahrtsrampe vor.\n\n"
         "Gefunkt wird zunächst im **Netzbetrieb (TMO)** in der Einsatz-Sprechgruppe. Der Gruppenführer hat vor dem Vorgehen festgelegt: **Bricht der Funk ab, wechseln Trupp, Gruppenführer und Atemschutzüberwachung in die vorgegebene DMO-Sprechgruppe** (sie ist auf Ihrem Funkzettel eingetragen).\n\n"
        "Sie haben den brennenden PKW erreicht und löschen. Melden Sie das dem Gruppenführer.",
        "Lage melden",
        ["Gruppenführer", "Angriffstrupp", "zweiten Untergeschoss", "Brandbekämpfung", "kommen"],
        "Gruppenführer von Angriffstrupp – PKW im zweiten Untergeschoss erreicht, Brandbekämpfung läuft, starke Verrauchung – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . Ziel erreicht (PKW im zweiten Untergeschoss) . Brandbekämpfung läuft . Lage (starke Verrauchung) . „kommen“",
        "n_bruch",
        "Meldung abgesetzt – aber kommt sie auch an?",
        "Melden Sie: PKW im zweiten Untergeschoss erreicht, Brandbekämpfung läuft, starke Verrauchung.",
        "Melden Sie das **Erreichen des Ziels** und die Lage, damit der Gruppenführer weiß, dass der Trupp arbeitet.")
s.choice("n_bruch",
         "**Gruppenführer:** „… Angriffs… … zweiten … *(Rauschen)* … wiederholen Sie – kommen.“\n\n"
         "Die Antwort des Gruppenführers kam noch an – Ihre Nachricht bei ihm aber nur in Bruchstücken. Was tun Sie?",
         [("🔁 Mit „ich wiederhole“ die Meldung noch einmal kurz, langsam und deutlich sprechen – Sprechtaste erst drücken, kurz warten, dann sprechen", "n_wiederhole"),
          ("📢 Lauter ins Funkgerät schreien und schneller sprechen", None,
           "Lautes Schreien übersteuert das Mikrofon, schnelles Sprechen verschluckt Silben. Bei schlechter Verbindung: **langsamer, deutlicher, kürzer** – und **Denken – Drücken – Sprechen**."),
          ("🤷 Nichts mehr sagen – er hat ja „zweiten“ gehört, das reicht", None,
           "Ein Gruppenführer, der nur Bruchstücke hört, weiß nicht, ob der Trupp arbeitet oder in Not ist. Auf **„wiederholen Sie“** antworten Sie mit **„ich wiederhole“**.")])
s.radio("n_wiederhole",
        "Wiederholen Sie die Meldung – kurz und deutlich.",
        "Meldung wiederholen",
        ["Angriffstrupp", "ich wiederhole", "Untergeschoss", "Brandbekämpfung", "kommen"],
        "Hier Angriffstrupp – ich wiederhole: PKW im zweiten Untergeschoss erreicht, Brandbekämpfung läuft – kommen.",
        "„hier Angriffstrupp“ . „ich wiederhole“ . Kern der Meldung, möglichst kurz (PKW im zweiten Untergeschoss erreicht, Brandbekämpfung läuft) . „kommen“",
        "n_weg",
        "Mit „ich wiederhole“ und gekürzt wiederholt.",
        "Sagen Sie „ich wiederhole“ und sprechen Sie den Kern der Meldung noch einmal.",
        "**„ich wiederhole“** zeigt, dass Sie die eigene Meldung erneut senden. Bei schlechter Verbindung die Meldung auf das **Wesentliche kürzen**.")
s.choice("n_weg",
         "**Gruppenführer:** „… verst… … *(Rauschen)* …“\n\n"
         "Wieder nur Bruchstücke. Zwischen Ihnen und dem Netz liegen zwei Betondecken – in der Tiefgarage ist der **Netzbetrieb (TMO)** kaum zu erreichen. Der Truppmann hat den PKW inzwischen weitgehend abgelöscht.\n\n"
         "Was tun Sie?",
         [("🧭 Als Trupp gemeinsam an der Schlauchleitung zurück Richtung Rampe, bis die Verbindung steht – dann den vorgegebenen Wechsel auf DMO ansprechen", "n_dmo"),
          ("🚶 Der Truppmann löscht allein weiter, Sie gehen zum Funken zur Rampe", None,
           "Ein Atemschutztrupp **trennt sich nie**. Wenn Sie den Standort wechseln, dann **gemeinsam** und an der Schlauchleitung."),
          ("📻 Einfach irgendeine freie DMO-Gruppe am Gerät wählen", None,
           "In einer **nicht vorgegebenen** Sprechgruppe hört Sie niemand – weder Gruppenführer noch Atemschutzüberwachung. Gewechselt wird nur in die **vorgegebene** Sprechgruppe und **abgesprochen**."),
          ("🔇 Ohne Funk weiterarbeiten, bis die Flasche leer ist", None,
           "Ohne Funkverbindung kann die Atemschutzüberwachung Sie nicht erreichen und ein Notruf käme nicht an. Stellen Sie die Verbindung wieder her – in vielen Ausbildungsunterlagen gilt: **ohne Funkverbindung Rückzug**. Es gilt die Vorgabe Ihres Gruppenführers.")])
s.radio("n_dmo",
        "Am Fuß der Zufahrtsrampe ist die Verbindung schwach, aber verständlich. Melden Sie das Funkproblem und schlagen Sie den vorgegebenen Wechsel auf DMO vor.",
        "Wechsel auf DMO ansprechen",
        ["Gruppenführer", "Angriffstrupp", "TMO", "nicht möglich", "DMO", "kommen"],
        "Gruppenführer von Angriffstrupp – im zweiten Untergeschoss Funk in TMO nicht möglich. Stehen am Fuß der Rampe, PKW weitgehend abgelöscht. Schlage Wechsel in die vorgegebene DMO-Sprechgruppe vor – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . Problem: Funk in TMO im zweiten Untergeschoss nicht möglich . Standort (Fuß der Rampe) + kurzer Stand (PKW weitgehend abgelöscht) . Vorschlag: Wechsel in die vorgegebene DMO-Sprechgruppe . „kommen“",
        "n_bestaetigen",
        "Problem, Standort und Lösung in einer kurzen Meldung.",
        "Melden Sie: Funk in TMO nicht möglich, Standort, kurzer Stand – und schlagen Sie den Wechsel in die vorgegebene DMO-Sprechgruppe vor.",
        "Im **DMO (Direktbetrieb)** funken die Geräte direkt miteinander, **ohne Netz** – im Keller oder in der Tiefgarage oft die bessere Wahl. Gewechselt wird **abgesprochen**, damit alle gleichzeitig in derselben Gruppe sind.")
s.radio("n_bestaetigen",
        "**Gruppenführer:** „Hier Gruppenführer – verstanden. Angriffstrupp, Gruppenführer und Atemschutzüberwachung wechseln jetzt in die vorgegebene DMO-Sprechgruppe. Dort melden – kommen.“\n\n"
        "Bestätigen Sie kurz.",
        "Wechsel bestätigen",
        ["Angriffstrupp", "verstanden", "Wechsel", "DMO", "kommen"],
        "Hier Angriffstrupp – verstanden: Wechsel in die vorgegebene DMO-Sprechgruppe, melden uns dort – kommen.",
        "„hier Angriffstrupp“ . „verstanden“ . Wechsel in die vorgegebene DMO-Sprechgruppe . „melden uns dort“ . „kommen“",
        "n_repeater",
        "Wechsel bestätigt – alle Beteiligten wechseln gleichzeitig.",
        "Bestätigen Sie mit „verstanden“ und wiederholen Sie den Wechsel in die vorgegebene DMO-Sprechgruppe.",
        "Erst wenn alle den Wechsel **bestätigt** haben, wird umgeschaltet. Sonst funkt der Trupp in einer Gruppe, in der niemand mehr zuhört.")
s.choice("n_repeater",
         "Sie schalten in die DMO-Sprechgruppe und melden sich dort beim Gruppenführer – die Verbindung zur Rampe ist klar. Sie gehen zurück zum PKW, um nachzulöschen.\n\n"
         "**Gruppenführer:** „Hier Gruppenführer – im Untergeschoss höre ich Sie in DMO nur schwach. Gehe näher an die Rampe – Ende.“\n\n"
         "Warum ist DMO auch nicht grenzenlos – und was hilft dann?",
         [("📶 DMO reicht nur von Gerät zu Gerät, Beton dämpft stark. Hilfe: Gruppenführer geht näher heran, ggf. ein Gerät als DMO-Repeater an der Rampe (wenn vorhanden und örtlich so geregelt)", "n_feuer"),
          ("🗼 DMO nutzt besonders starke Basisstationen – das Problem kann nur am Gerät liegen", None,
           "Im DMO gibt es **keine Basisstationen** – die Geräte funken **direkt**. Reichweite hängt von Abstand und Hindernissen (Betondecken) ab."),
          ("📞 In DMO hört die ILS automatisch mit und kann vermitteln", None,
           "Im DMO ist die ILS **nicht** verbunden – dafür bräuchte es ein **Gateway** ins Netz. Die Verbindung zur ILS hält der Gruppenführer bzw. das Fahrzeug im **TMO**.")])
s.radio("n_feuer",
        "Der Gruppenführer steht jetzt an der Rampe, die Verbindung in DMO ist gut. Der PKW ist abgelöscht, die Nachkontrolle mit der Wärmebildkamera zeigt keine Glutnester mehr. Ihr Druck: **170** und **160 bar**. Melden Sie in der DMO-Sprechgruppe.",
        "„Feuer aus“ melden",
        ["Gruppenführer", "Angriffstrupp", "Feuer aus", "Wärmebildkamera", "160", "kommen"],
        "Gruppenführer von Angriffstrupp – Feuer aus, PKW im zweiten Untergeschoss abgelöscht, Nachkontrolle mit Wärmebildkamera ohne Befund. Druck 160 bar – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . „Feuer aus“ (PKW, zweites Untergeschoss) . Nachkontrolle mit Wärmebildkamera ohne Befund . niedrigster Druck (160 bar) . „kommen“",
        "n_end",
        "Ergebnis gemeldet – die Verbindung steht.",
        "Melden Sie: Feuer aus, Nachkontrolle ohne Befund, Druck 160 bar.",
        "Melden Sie **Ergebnis, Nachkontrolle und Druck**. Der Gruppenführer entscheidet dann über Rauchabzug und Rückzug.")
s.end("**Gruppenführer:** „Hier Gruppenführer – verstanden. Angriffstrupp zurück zur Rampe, Lüfter wird in Stellung gebracht – kommen.“\n\n"
      "Bei abreißender Verbindung richtig gehandelt: „ich wiederhole“, gemeinsamer Standortwechsel, abgesprochener Wechsel in die vorgegebene DMO-Sprechgruppe.\n\n"
      "> **Merke:** **TMO** (Netzbetrieb) braucht Empfang einer Basisstation – in Tiefgaragen und Kellern oft nicht vorhanden. **DMO** (Direktbetrieb) funkt von Gerät zu Gerät, ist aber ebenfalls durch Abstand und Beton begrenzt. Abhilfe: näher heran, Standort wechseln, ggf. **DMO-Repeater**. Welche DMO-Sprechgruppe gilt, legt die Führungskraft bzw. Ihre ILS fest – nie eigenmächtig wählen.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("funk", s))

# ================================================================ Fremder Mayday – Funkstille
s = S("funkdisziplin_mayday_fremd", "Funkdisziplin: Fremder Mayday – Funkstille halten",
      "Mittel: Als Truppführer des Wassertrupps bei einem Mayday eines anderen Trupps sofort Funkstille halten, nur auf Aufforderung der Einsatzleitung sprechen, einen Auftrag bestätigen und die eigene Routinemeldung erst nach Freigabe des Funkverkehrs absetzen. 3 Funk-Schritte.",
      TF, "n_start")
s.choice("n_start",
         "Brand in einer Lagerhalle am Ortsrand von Neuhaus. Einsatzleiter ist **Florian Neuhaus 11/1**. Im Innenangriff ist unter anderem der **Angriffstrupp von Florian Adelsdorf 44/1**. Alle Trupps an der Einsatzstelle funken in derselben Sprechgruppe.\n\n"
         "Sie sind **Truppführer des Wassertrupps** von Florian Neuhaus 17/42/1 und haben an der **Nordseite** der Halle die Wasserversorgung vom Hydranten zum Verteiler aufgebaut. Gerade wollen Sie das Ihrem Gruppenführer melden – da hören Sie:\n\n"
         "**Angriffstrupp Florian Adelsdorf 44/1:** „Mayday, Mayday, Mayday – hier Angriffstrupp Florian Adelsdorf 44/1 – Halle, Erdgeschoss, hinterer Bereich – Orientierung verloren, Atemluft 90 bar – Mayday, kommen!“\n\n"
         "Was tun Sie?",
         [("🔇 Sofort Funkstille: eigene Meldung zurückstellen, Sprechtaste nicht drücken, aufmerksam mithören", "n_kamerad"),
          ("⚡ Schnell noch die eigene Meldung absetzen – dauert nur fünf Sekunden", None,
           "Ein Mayday hat die **höchste Vorrangstufe**. Jede andere Sendung kann die Antwort der Einsatzleitung oder eine Rückmeldung des Trupps **überdecken**. Ab jetzt nur noch Notfallverkehr."),
          ("📞 Das Mayday selbst mit „verstanden“ bestätigen, damit der Trupp weiß, dass er gehört wurde", None,
           "Das Mayday quittiert die **Einsatzleitung** bzw. die zuständige Führungskraft oder Atemschutzüberwachung. Zusätzliche Quittungen anderer Stellen blockieren den Kanal und stiften Verwirrung."),
          ("🏃 Mit dem Wassertrupp in die Halle laufen und suchen", None,
           "Der Wassertrupp ist **nicht unter Atemschutz** und hat keinen Auftrag. Gerettet wird durch den **Sicherheitstrupp auf Befehl** – kein eigenmächtiges Vorgehen.")])
s.choice("n_kamerad",
         "**Florian Neuhaus 11/1:** „Hier Florian Neuhaus 11/1 – Mayday verstanden. Sicherheitstrupp geht vor. – An alle: Atemschutznotfall, Funkverkehr nur noch für den Notfall.“\n\n"
         "Ihr Truppmann stößt Sie an: „Sollen wir nicht trotzdem melden, dass das Wasser steht? Der Gruppenführer wartet doch darauf.“\n\nWas antworten Sie?",
         [("✋ „Nein. Funkstille – die Meldung ist jetzt nicht notfallrelevant. Wir hören mit und sprechen nur, wenn wir angesprochen werden.“", "n_aufforderung"),
          ("📞 „Ja, ganz kurz – Wasser ist wichtig für den Sicherheitstrupp.“", None,
           "Die Wasserversorgung **steht bereits** – daran ändert die Meldung nichts. Sie kann warten. Funkverkehr während eines Mayday nur, wenn er dem **Notfall** dient oder die Einsatzleitung ausdrücklich fragt."),
          ("📟 „Wir drücken Status 5, dann ruft uns die ILS zurück.“", None,
           "Die ILS hat mit der internen Lage an der Einsatzstelle nichts zu tun, und auch ein Sprechwunsch stört jetzt nur. **Funkstille** heißt: warten, bis die Einsatzleitung den Funkverkehr wieder freigibt.")])
s.radio("n_aufforderung",
        "Der Sicherheitstrupp geht über den Haupteingang Süd vor.\n\n"
        "**Florian Neuhaus 11/1:** „Florian Neuhaus 11/1 an alle: Frage – wer steht an der Nordseite der Halle? Ist dort ein Zugang offen – kommen.“\n\n"
        "Sie stehen an der Nordseite: Das **Rolltor Nord** ist geschlossen, die **Schlupftür** daneben ist **offen**. Jetzt sind **Sie gefragt** – antworten Sie kurz.",
        "Auf Aufforderung antworten",
        ["Wassertrupp", "Nordseite", "Rolltor", "geschlossen", "Schlupftür", "offen", "kommen"],
        "Hier Wassertrupp Florian Neuhaus 17/42/1 – stehe an der Nordseite. Rolltor Nord geschlossen, Schlupftür daneben offen – kommen.",
        "„hier“ + Trupp und Rufname (Wassertrupp Florian Neuhaus 17/42/1) . Standort (Nordseite) . nur die erfragte Information: Rolltor Nord geschlossen, Schlupftür daneben offen . „kommen“",
        "n_auftrag",
        "Auf Aufforderung gesprochen – kurz, nur die erfragte Information.",
        "Melden Sie Ihren Standort und den Zustand der Zugänge an der Nordseite.",
        "Während eines Mayday sprechen Sie nur, wenn die Einsatzleitung **fragt** – und dann **nur das Erfragte**. Ihre Wasserversorgungs-Meldung gehört nicht hinein.")
s.radio("n_auftrag",
        "**Florian Neuhaus 11/1:** „Hier Florian Neuhaus 11/1 – verstanden. Wassertrupp Florian Neuhaus 17/42/1: Schlupftür Nord offen halten, mit Lampe und Zuruf bemerkbar machen, nicht vorgehen – kommen.“\n\n"
        "Bestätigen Sie den Auftrag.",
        "Auftrag bestätigen",
        ["Wassertrupp", "verstanden", "Schlupftür", "offen halten", "Lampe", "nicht vorgehen", "kommen"],
        "Hier Wassertrupp Florian Neuhaus 17/42/1 – verstanden: Schlupftür Nord offen halten, mit Lampe und Zuruf bemerkbar machen, nicht vorgehen – kommen.",
        "„hier“ + Trupp und Rufname . „verstanden“ . Auftrag wiederholen (Schlupftür Nord offen halten, mit Lampe und Zuruf bemerkbar machen, nicht vorgehen) . „kommen“",
        "n_ende",
        "Auftrag kurz und vollständig bestätigt.",
        "Bestätigen Sie mit „verstanden“ und wiederholen Sie den Auftrag.",
        "Ein Auftrag der Einsatzleitung wird auch im Notfall **kurz bestätigt** – sonst weiß sie nicht, ob er angekommen ist. Danach wieder Funkstille.")
s.choice("n_ende",
         "Sie halten die Schlupftür offen und leuchten hinein. Nach einigen Minuten taucht der Lichtkegel des Sicherheitstrupps auf: Er bringt den Angriffstrupp Florian Adelsdorf 44/1 **durch die Schlupftür Nord** ins Freie. Beide Geräteträger gehen selbstständig, der Rettungsdienst übernimmt.\n\n"
         "**Sicherheitstrupp:** „Florian Neuhaus 11/1 von Sicherheitstrupp – Angriffstrupp Florian Adelsdorf 44/1 über Schlupftür Nord im Freien, an Rettungsdienst übergeben – kommen.“\n\n"
         "**Florian Neuhaus 11/1:** „Hier Florian Neuhaus 11/1 – verstanden – Ende.“\n\n"
         "Der Trupp ist gerettet. Dürfen Sie jetzt Ihre Meldung zur Wasserversorgung absetzen?",
         [("⏳ Nein – erst, wenn die Einsatzleitung den Atemschutznotfall beendet und den Funkverkehr ausdrücklich freigibt", "n_routine"),
          ("✅ Ja – der Trupp ist draußen, also ist der Notfall vorbei", None,
           "Die **Aufhebung** von Mayday und Funkbeschränkung gibt die **Einsatzleitung** an alle durch. Einzelne Funkstellen nehmen den normalen Funkverkehr **nicht eigenmächtig** wieder auf.")])
s.radio("n_routine",
        "**Florian Neuhaus 11/1:** „Florian Neuhaus 11/1 an alle: Atemschutznotfall beendet, Funkverkehr wieder frei.“\n\n"
        "Jetzt setzen Sie Ihre zurückgestellte Meldung an den Gruppenführer ab.",
        "Routinemeldung absetzen",
        ["Gruppenführer", "Wassertrupp", "Wasserversorgung", "Hydrant", "Verteiler", "steht", "kommen"],
        "Gruppenführer von Wassertrupp – Wasserversorgung vom Hydranten Nordseite zum Verteiler steht – kommen.",
        "Anruf: Gruppenführer von Wassertrupp . Wasserversorgung vom Hydranten (Nordseite) zum Verteiler steht . „kommen“",
        "n_end",
        "Routinemeldung nach der Freigabe – genau richtig.",
        "Melden Sie: Wasserversorgung vom Hydranten Nordseite zum Verteiler steht.",
        "Nach der Freigabe läuft der normale Funkverkehr wieder. Zurückgestellte Meldungen werden jetzt **kurz** nachgeholt.")
s.end("Sie haben die Funkdisziplin gehalten: sofort Funkstille beim fremden Mayday, nur auf Aufforderung gesprochen, Auftrag bestätigt und die Routinemeldung erst nach der Freigabe abgesetzt.\n\n"
      "> **Merke:** Ein **Mayday** unterbricht jeden anderen Funkverkehr. Wer nicht betroffen ist, **schweigt und hört mit** – gesprochen wird nur auf Aufforderung oder wenn man eine **notfallrelevante** Beobachtung hat. Den Funkverkehr gibt allein die **Einsatzleitung** wieder frei.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("funk", s))

# ================================================================ Einsatzabschnitte bilden
s = S("einsatzabschnitte_bilden", "Einsatzleitung: Einsatzabschnitte bilden",
      "Profi: Als Einsatzleiter bei einem Brand auf einem landwirtschaftlichen Anwesen Einsatzabschnitte bilden, per Sammelruf bekanntgeben, Abschnittsaufträge erteilen, Rückmeldungen quittieren und eine Lagemeldung mit Führungsstruktur an die ILS geben. 5 Funk-Schritte.",
      EL, "n_start")
s.choice("n_start",
         "Brand auf einem landwirtschaftlichen Anwesen, **Hofstelle Am Mühlbach 2** bei Neuhaus. Sie sind Einsatzleiter auf **Florian Neuhaus 11/1**.\n\n"
         "**Lage:** Eine **Scheune** mit Heu und Stroh steht in **Vollbrand**. Nur wenige Meter daneben das **Wohnhaus**, auf der anderen Seite ein **Stall** mit Rindern. Der Landwirt meldet: **alle Bewohner draußen**. Der Hydrant am Hof liefert nur wenig Wasser, ein **Löschteich** liegt etwa **400 m** entfernt.\n\n"
         "An der Einsatzstelle: **Florian Neuhaus 17/42/1** (LF), **Florian Neuhaus 33/1** (Drehleiter), **Florian Adelsdorf 44/1** (LF). Gefunkt wird in der von der ILS zugewiesenen Einsatz-Sprechgruppe.\n\n"
         "Wie führen Sie die Einsatzstelle?",
         [("🗂️ Zwei Einsatzabschnitte mit je einem Abschnittsleiter: **Brandbekämpfung** (Florian Neuhaus 17/42/1, Drehleiter unterstellt) und **Wasserversorgung** (Florian Adelsdorf 44/1) – Sie führen die Abschnittsleiter", "n_sammel"),
          ("📡 Alle Trupps direkt vom ELW aus über Funk führen", None,
           "Ein Führer kann nur eine begrenzte Zahl Einheiten sicher führen (**Führungsspanne** etwa 2 bis 5). Wer jeden Trupp selbst führt, ist überlastet und blockiert den Funk. Mit **Einsatzabschnitten** führen Sie nur noch die Abschnittsleiter."),
          ("🚒 Jedes Fahrzeug arbeitet für sich, Absprachen untereinander", None,
           "Ohne klare **Führungsstruktur** fehlt die Abstimmung – z. B. wer das Wasser bekommt. Bilden Sie **Einsatzabschnitte** mit eindeutigen Aufgaben und Abschnittsleitern.")])
s.radio("n_sammel",
        "Geben Sie die Abschnittsbildung per **Sammelruf** an alle bekannt. Die Abschnittsleiter sollen sich melden.",
        "Sammelruf an alle",
        ["an alle", "Einsatzabschnitte", "Brandbekämpfung", "Florian Neuhaus", "Wasserversorgung", "Florian Adelsdorf", "kommen"],
        "An alle von Florian Neuhaus 11/1 – Einsatzstelle wird in zwei Einsatzabschnitte geteilt. Abschnitt Brandbekämpfung: Florian Neuhaus 17/42/1, Drehleiter Florian Neuhaus 33/1 ist unterstellt. Abschnitt Wasserversorgung: Florian Adelsdorf 44/1. Abschnittsleiter melden sich – kommen.",
        "„An alle von“ + eigener Rufname . „zwei Einsatzabschnitte“ . Abschnitt Brandbekämpfung: Florian Neuhaus 17/42/1, Drehleiter unterstellt . Abschnitt Wasserversorgung: Florian Adelsdorf 44/1 . Abschnittsleiter melden sich . „kommen“",
        "n_prio",
        "Führungsstruktur für alle klar bekanntgegeben.",
        "Geben Sie an alle durch: zwei Einsatzabschnitte – Brandbekämpfung (Florian Neuhaus 17/42/1 mit Drehleiter) und Wasserversorgung (Florian Adelsdorf 44/1).",
        "Ein **Sammelruf** erreicht alle Einheiten gleichzeitig. Jede Einheit muss wissen, **zu welchem Abschnitt** sie gehört und **wer ihr Abschnittsleiter** ist.")
s.choice("n_prio",
         "**Florian Neuhaus 17/42/1:** „Hier Florian Neuhaus 17/42/1 – verstanden, übernehme Abschnitt Brandbekämpfung – Frage Auftrag – kommen.“\n\n"
         "**Florian Adelsdorf 44/1:** „Hier Florian Adelsdorf 44/1 – verstanden, Abschnitt Wasserversorgung – kommen.“\n\n"
         "Die Scheune ist nicht mehr zu retten. Was ist der **Schwerpunkt** für den Abschnitt Brandbekämpfung?",
         [("🛡️ Ausbreitung verhindern: Riegelstellung zum Wohnhaus und zum Stall, Scheune von außen ablöschen", "n_auftrag1"),
          ("🔥 Mit allen Rohren in die Scheune, um das Heu zu löschen", None,
           "Die Scheune ist verloren, Innenangriff in eine brennende Heuscheune ist zudem lebensgefährlich (Einsturz). Schwerpunkt ist, die **Ausbreitung** auf Wohnhaus und Stall zu **verhindern**."),
          ("🐄 Erst alle Kräfte zur Tierrettung, das Wohnhaus später", None,
           "Tiere zu retten ist wichtig – aber das **Wohnhaus** droht unmittelbar in Brand zu geraten. Der Abschnittsleiter setzt seine Kräfte für **Riegelstellung** und, wo gefahrlos möglich, das Räumen des Stalls ein.")])
s.radio("n_auftrag1",
        "Geben Sie dem Abschnittsleiter Brandbekämpfung seinen Auftrag – er hat Sie gerade gerufen.",
        "Auftrag Abschnitt Brandbekämpfung",
        ["Florian Neuhaus", "Riegelstellung", "Wohnhaus", "Stall", "Drehleiter", "Scheune", "kommen"],
        "Hier Florian Neuhaus 11/1 – Florian Neuhaus 17/42/1: Abschnitt Brandbekämpfung – Riegelstellung zum Wohnhaus mit der Drehleiter und zum Stall, Stall räumen, soweit gefahrlos möglich. Scheune von außen ablöschen – kommen.",
        "„hier“ + eigener Rufname . Einheit (Florian Neuhaus 17/42/1) . Abschnitt (Brandbekämpfung) . Schwerpunkt: Riegelstellung Wohnhaus (mit Drehleiter) und Stall . Stall räumen, soweit gefahrlos . Scheune von außen ablöschen . „kommen“",
        "n_auftrag2",
        "Abschnittsauftrag mit klarem Schwerpunkt erteilt.",
        "Nennen Sie: Riegelstellung zum Wohnhaus mit der Drehleiter und zum Stall, Stall räumen, Scheune von außen ablöschen.",
        "Als Einsatzleiter geben Sie dem Abschnitt **Auftrag und Schwerpunkt** – wie er die Trupps einsetzt, entscheidet der **Abschnittsleiter**.")
s.radio("n_auftrag2",
        "**Florian Neuhaus 17/42/1:** „Hier Florian Neuhaus 17/42/1 – verstanden: Riegelstellung Wohnhaus mit Drehleiter und Stall, Stall räumen, Scheune von außen – Ende.“\n\n"
        "Rufen Sie jetzt den Abschnittsleiter **Wasserversorgung** und geben Sie seinen Auftrag: Löschwasserentnahme am **Löschteich**, Förderleitung zum Verteiler vor der Scheune, Wasser für den Abschnitt Brandbekämpfung.",
        "Auftrag Abschnitt Wasserversorgung",
        ["Florian Adelsdorf", "Florian Neuhaus", "Wasserversorgung", "Löschteich", "Förderleitung", "Verteiler", "kommen"],
        "Florian Adelsdorf 44/1 von Florian Neuhaus 11/1 – Abschnitt Wasserversorgung: Löschwasserentnahme am Löschteich, Förderleitung zum Verteiler vor der Scheune, Wasser für den Abschnitt Brandbekämpfung – kommen.",
        "Anruf: Florian Adelsdorf 44/1 von Florian Neuhaus 11/1 . Abschnitt Wasserversorgung . Entnahmestelle (Löschteich) . Förderleitung zum Verteiler vor der Scheune . Zweck: Wasser für den Abschnitt Brandbekämpfung . „kommen“",
        "n_quittung",
        "Abschnitt Wasserversorgung hat einen klaren Auftrag.",
        "Geben Sie den Auftrag: Löschteich, Förderleitung zum Verteiler vor der Scheune, Wasser für die Brandbekämpfung.",
        "Bei langer Wegstrecke braucht die Wasserversorgung einen **eigenen Abschnitt** mit klarer Entnahmestelle, Ziel (Verteiler) und Zweck.")
s.radio("n_quittung",
        "**Florian Adelsdorf 44/1:** „Hier Florian Adelsdorf 44/1 – verstanden: Wasserversorgung vom Löschteich zum Verteiler vor der Scheune – Ende.“\n\n"
        "Zwanzig Minuten später:\n\n"
        "**Florian Neuhaus 17/42/1:** „Florian Neuhaus 11/1 von Florian Neuhaus 17/42/1 – Rückmeldung Abschnitt Brandbekämpfung: Riegelstellung steht, Übergreifen auf Wohnhaus und Stall verhindert. Stall geräumt, alle Tiere draußen. Wasserversorgung vom Löschteich steht – kommen.“\n\n"
        "Quittieren Sie die Rückmeldung mit den wesentlichen Punkten.",
        "Rückmeldung quittieren",
        ["Florian Neuhaus", "verstanden", "Riegelstellung", "Wohnhaus", "Stall geräumt", "Ende"],
        "Hier Florian Neuhaus 11/1 – verstanden: Riegelstellung steht, Wohnhaus und Stall geschützt, Stall geräumt – Ende.",
        "„hier“ + eigener Rufname . „verstanden“ . Kernpunkte wiederholen (Riegelstellung steht, Wohnhaus und Stall geschützt, Stall geräumt) . „Ende“",
        "n_lage",
        "Rückmeldung quittiert – Sie haben den Überblick.",
        "Quittieren Sie mit „verstanden“ und den Kernpunkten: Riegelstellung steht, Wohnhaus und Stall geschützt, Stall geräumt.",
        "Durch das kurze Wiederholen der Kernpunkte merkt der Abschnittsleiter, ob seine Meldung richtig angekommen ist. Mit **„Ende“** ist das Gespräch abgeschlossen.")
s.choice("n_lage",
         "Die Lage ist stabil, die Scheune brennt kontrolliert ab. Für die lang dauernden Löscharbeiten wollen Sie **ein weiteres Löschfahrzeug** zur Ablösung der Wasserförderung nachfordern. Die ILS braucht eine Lagemeldung.\n\n"
         "Wer meldet was an die ILS?",
         [("📋 Sie als Einsatzleiter: Wo · Was · Menschenleben · Maßnahmen inkl. Einsatzabschnitte mit Abschnittsleitern · Nachforderung", "n_ils"),
          ("📻 Jeder Abschnittsleiter meldet seinen Abschnitt selbst an die ILS", None,
           "Die Verbindung zur ILS hält die **Einsatzleitung**. Meldet jeder selbst, bekommt die ILS ein lückenhaftes, widersprüchliches Bild – und der Funk wird überlastet."),
          ("⏳ Lagemeldung erst nach „Feuer aus“", None,
           "Die ILS muss **frühzeitig** wissen, wie die Lage ist und was gebraucht wird – Anfahrtswege kosten Zeit. Nachforderungen **sofort** melden.")])
s.radio("n_ils",
        "Sie haben **Status 5** gedrückt.\n\n**Leitstelle:** „Florian Neuhaus 11/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie die Lagemeldung mit Führungsstruktur und Nachforderung.",
        "Lagemeldung an die ILS",
        ["Florian Neuhaus", "Lagemeldung", "Scheune", "keine Personen", "Einsatzabschnitte", "Nachforderung", "Löschfahrzeug", "kommen"],
        "Hier Florian Neuhaus 11/1 – Lagemeldung: Hofstelle Am Mühlbach 2, Scheune in Vollbrand, keine Personen in Gefahr, Tiere gerettet. Wohnhaus und Stall durch Riegelstellung geschützt. Zwei Einsatzabschnitte: Brandbekämpfung unter Florian Neuhaus 17/42/1, Wasserversorgung vom Löschteich unter Florian Adelsdorf 44/1. Nachforderung: ein weiteres Löschfahrzeug zur Ablösung der Wasserförderung – kommen.",
        "„hier“ + Rufname . „Lagemeldung“ . WO: Hofstelle Am Mühlbach 2 . WAS: Scheune in Vollbrand . MENSCHENLEBEN: keine Personen in Gefahr, Tiere gerettet . MASSNAHMEN: Riegelstellung Wohnhaus und Stall, zwei Einsatzabschnitte mit Abschnittsleitern . NACHFORDERUNG: ein weiteres Löschfahrzeug . „kommen“",
        "n_end",
        "Vollständige Lagemeldung mit Führungsstruktur und konkreter Nachforderung.",
        "Lagemeldung nach Schema – mit den beiden Einsatzabschnitten und der Nachforderung eines Löschfahrzeugs.",
        "Schema: **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung**. Bei größeren Lagen gehört die **Führungsstruktur** (Einsatzabschnitte, Abschnittsleiter) zu den Maßnahmen – so weiß die ILS, wohin sie nachrückende Kräfte schickt.")
s.end("**Leitstelle:** „Hier Leitstelle – verstanden, ein weiteres Löschfahrzeug wird alarmiert und meldet sich bei Ihnen – Ende.“\n\n"
      "Sie haben die Einsatzstelle in Abschnitte gegliedert, die Struktur per Sammelruf bekanntgegeben, klare Abschnittsaufträge erteilt, Rückmeldungen quittiert und die ILS vollständig informiert.\n\n"
      "> **Merke:** Einsatzabschnitte werden nach **Raum** (z. B. Nord/Süd) oder **Aufgabe** (z. B. Wasserversorgung) gebildet. Jeder Abschnitt hat **einen Abschnittsleiter**, der Einsatzleiter führt nur noch diese (**Führungsspanne** etwa 2 bis 5). Die Verbindung zur ILS hält die Einsatzleitung.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("funk", s))
