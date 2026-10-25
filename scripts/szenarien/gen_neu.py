from gen_lib import S

OUT = []
GF = "gruppenführer_a"
TF = "truppführer"

# ================================================================ Atemschutzüberwachung
s = S("atemschutzueberwachung", "Atemschutzüberwachung",
      "Mittel: Als Atemschutzüberwachung den Angriffstrupp registrieren, Druckkontrollen nach 1/3 und 2/3 der Einsatzzeit abfragen, Rückzugsdruck vorgeben, bei fehlender Antwort den Gruppenführer alarmieren und das Verlassen des Gefahrenbereichs dokumentieren. 6 Funk-Schritte.",
      "atemschutzüberwachung", "n_start")
s.choice("n_start",
         "Kellerbrand in einem Mehrfamilienhaus in Neuhaus. Sie sind Maschinist auf **Florian Neuhaus 44/1** und übernehmen im Auftrag des Gruppenführers die **Atemschutzüberwachung** (FwDV 7) mit Überwachungstafel und Uhr.\n\n"
         "Der Angriffstrupp schließt gerade die Lungenautomaten an (Pressluftatmer, 300-bar-Flaschen). Erwartete Einsatzzeit: **30 Minuten**.\n\nWas tragen Sie auf der Tafel ein?",
         [("📋 Namen der Geräteträger, Funkrufname des Trupps, Uhrzeit beim Anschließen, Flaschendruck, Auftrag", "n_anmeldung"),
          ("📋 Nur die Uhrzeit – der Trupp weiß selbst, wie viel Luft er hat", None,
           "Die Überwachung nach FwDV 7 registriert **wer** (Namen, Rufname), **wann** (Zeit beim Anschließen des Lungenautomaten), **womit** (Druck) und **wohin** (Auftrag). Nur so kann im Notfall gezielt gesucht werden.")])
s.radio("n_anmeldung",
        "**Angriffstrupp:** „Atemschutzüberwachung von Angriffstrupp – Angriffstrupp geht vor zur Brandbekämpfung in den Keller, Druck **300** und **290 bar** – kommen.“\n\n"
        "Es ist **14:05 Uhr**. Bestätigen Sie die Anmeldung. Dokumentiert wird der **niedrigste** Druck im Trupp.",
        "Anmeldung bestätigen",
        ["Atemschutzüberwachung", "verstanden", "Angriffstrupp", "Keller", "290", "Ende"],
        "Hier Atemschutzüberwachung – verstanden: Angriffstrupp geht vor in den Keller, 290 bar, Zeit 14:05 – Ende.",
        "„hier Atemschutzüberwachung“ . „verstanden“ . kurz wiederholen: Trupp, Ziel (Keller), niedrigster Druck (290 bar), Uhrzeit . „Ende“",
        "n_drittel",
        "Anmeldung quittiert und wiederholt – Ausgangsdruck ist dokumentiert.",
        "Bestätigen Sie mit „verstanden“ und wiederholen Sie Trupp, Ziel, niedrigsten Druck und Uhrzeit.",
        "Durch die Wiederholung merkt der Trupp sofort, wenn ein falscher Druck notiert wurde. Maßgeblich ist der **niedrigste Druck** im Trupp.")
s.radio("n_drittel",
        "Es ist **14:15 Uhr** – ein Drittel der erwarteten Einsatzzeit ist vorbei. Fragen Sie den Behälterdruck ab.",
        "Erste Druckkontrolle",
        ["Angriffstrupp", "Atemschutzüberwachung", "Druck", "kommen"],
        "Angriffstrupp von Atemschutzüberwachung – erste Druckkontrolle, Frage Behälterdruck – kommen.",
        "Anruf: Angriffstrupp von Atemschutzüberwachung . Anlass: erste Druckkontrolle (1/3 der Einsatzzeit) . Frage Behälterdruck . „kommen“",
        "n_rueckzug",
        "Druckkontrolle nach einem Drittel der Einsatzzeit abgefragt.",
        "Rufen Sie den Angriffstrupp an und fragen Sie den Behälterdruck ab.",
        "Nach FwDV 7 erinnert die Überwachung den Trupp nach **1/3 und 2/3 der erwarteten Einsatzzeit** an die Druckkontrolle.")
s.radio("n_rueckzug",
        "**Angriffstrupp:** „Hier Angriffstrupp – Truppführer **230**, Truppmann **220 bar**, Brandraum im Keller erreicht – kommen.“\n\n"
        "Notieren Sie den Druck. Für den Hinweg hat der Trupp **70 bar** verbraucht (290 → 220). Faustregel: Für den Rückweg wird der **doppelte** Druck des Hinwegs eingeplant – also Rückzug spätestens bei **140 bar**. Geben Sie das durch.",
        "Druck quittieren, Rückzugsdruck",
        ["Atemschutzüberwachung", "verstanden", "220", "Rückzug", "140", "Ende"],
        "Hier Atemschutzüberwachung – verstanden: 220 bar, Brandraum erreicht. Rückzug spätestens bei 140 bar – Ende.",
        "„hier Atemschutzüberwachung“ . „verstanden“ . niedrigster Druck (220 bar) + Einsatzziel erreicht . Rückzugsdruck: 2 × 70 bar Verbrauch = spätestens bei 140 bar . „Ende“",
        "n_zweidrittel",
        "Druck notiert und Rückzugsdruck richtig vorgegeben.",
        "Quittieren Sie 220 bar und geben Sie den Rückzug spätestens bei 140 bar vor.",
        "Für den Rückweg wird der **doppelte Luftverbrauch des Hinwegs** eingeplant: 70 bar Hinweg → 140 bar Reserve. Unabhängig davon tritt der Trupp spätestens beim **Warnsignal** den Rückweg an.")
s.radio("n_zweidrittel",
        "Es ist **14:25 Uhr** – zwei Drittel der Einsatzzeit. Fragen Sie erneut den Druck ab.",
        "Zweite Druckkontrolle",
        ["Angriffstrupp", "Atemschutzüberwachung", "zweite Druckkontrolle", "Druck", "kommen"],
        "Angriffstrupp von Atemschutzüberwachung – zweite Druckkontrolle, Frage Behälterdruck – kommen.",
        "Anruf: Angriffstrupp von Atemschutzüberwachung . zweite Druckkontrolle (2/3) . Frage Behälterdruck . „kommen“",
        "n_keine_antwort",
        "Zweite Druckkontrolle abgefragt.",
        "Rufen Sie den Angriffstrupp an und fragen Sie den Druck ab.",
        "Die zweite Erinnerung kommt nach **2/3 der Einsatzzeit**.")
s.choice("n_keine_antwort",
         "… **Keine Antwort.** Sie rufen ein zweites Mal – wieder **keine Antwort**.\n\nWas tun Sie?",
         [("📣 Sofort den Gruppenführer informieren", "n_meldung_gf"),
          ("⏳ Fünf Minuten warten und dann noch einmal rufen", None,
           "Ein Trupp, der sich nicht meldet, ist ein **möglicher Atemschutznotfall**. Der Einheitsführer muss **sofort** informiert werden – er entscheidet über den Einsatz des Sicherheitstrupps. Jede Minute zählt."),
          ("🚶 Selbst zum Kellerabgang gehen und nachsehen", None,
           "Die Atemschutzüberwachung bleibt an der Tafel und am Funk. Sie informieren den **Gruppenführer** – er setzt den Sicherheitstrupp ein.")])
s.radio("n_meldung_gf",
        "Informieren Sie den Gruppenführer mit allen Angaben, die er für die Entscheidung braucht.",
        "Gruppenführer informieren",
        ["Gruppenführer", "Atemschutzüberwachung", "Angriffstrupp", "meldet sich nicht", "220", "Keller", "kommen"],
        "Gruppenführer von Atemschutzüberwachung – Angriffstrupp meldet sich nach zweimaligem Anruf nicht. Letzter Druck 220 bar um 14:15, Standort Brandraum Keller, Einsatzzeit 20 Minuten – kommen.",
        "Anruf: Gruppenführer von Atemschutzüberwachung . Angriffstrupp meldet sich nach zweimaligem Anruf nicht . letzter Druck (220 bar) mit Uhrzeit (14:15) . letzter Standort (Brandraum Keller) . bisherige Einsatzzeit (20 Minuten) . „kommen“",
        "n_rueckmeldung",
        "Alle entscheidenden Angaben weitergegeben – der Gruppenführer kann handeln.",
        "Melden Sie: keine Antwort nach zwei Anrufen, letzter Druck mit Uhrzeit, letzter Standort, Einsatzzeit.",
        "Der Gruppenführer braucht: **was** (keine Antwort nach zwei Anrufen), **letzter Druck mit Uhrzeit**, **letzter Standort** und **Einsatzzeit**. Damit kann er den Sicherheitstrupp gezielt einsetzen.")
s.radio("n_rueckmeldung",
        "**Gruppenführer:** „Verstanden – Sicherheitstrupp macht sich bereit.“\n\nKurz darauf meldet sich der Trupp:\n\n**Angriffstrupp:** „Atemschutzüberwachung von Angriffstrupp – Funk im Keller war gestört. Wir haben den Gefahrenbereich verlassen, Druck **150** und **140 bar** – kommen.“\n\n"
        "Quittieren Sie und dokumentieren Sie das Verlassen des Gefahrenbereichs.",
        "Verlassen quittieren",
        ["Atemschutzüberwachung", "verstanden", "Gefahrenbereich verlassen", "140", "Ende"],
        "Hier Atemschutzüberwachung – verstanden: Angriffstrupp hat den Gefahrenbereich verlassen, 140 bar, Zeit 14:27 – Ende.",
        "„hier Atemschutzüberwachung“ . „verstanden“ . Angriffstrupp hat den Gefahrenbereich verlassen . niedrigster Druck (140 bar) + Uhrzeit . „Ende“ – danach den Gruppenführer informieren",
        "n_end",
        "Verlassen des Gefahrenbereichs dokumentiert.",
        "Quittieren Sie: Gefahrenbereich verlassen, 140 bar, Uhrzeit.",
        "Erst wenn der Trupp den **Gefahrenbereich verlassen** hat, ist er aus der Überwachung entlassen. Danach informieren Sie den Gruppenführer, damit der Sicherheitstrupp nicht mehr vorgehen muss.")
s.end("Sie informieren den Gruppenführer: Angriffstrupp ist wohlauf draußen. Der Sicherheitstrupp bleibt in Bereitstellung.\n\n"
      "Atemschutzüberwachung nach FwDV 7: Registrierung, Kontrollen nach 1/3 und 2/3, Rückzugsdruck, sofortige Meldung bei fehlender Antwort, Austragen beim Verlassen.\n\n"
      "> Ein Funkloch im Keller ist typisch. Abhilfe: rechtzeitig in **DMO** arbeiten, ggf. **Repeater** oder eine Funkbrücke einrichten.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("brand", s))

# ================================================================ Angriffstrupp Menschenrettung + Rauchabzug
s = S("angriffstrupp_menschenrettung", "Angriffstrupp: Menschenrettung, Brandherd und Abluft",
      "Profi: Als Truppführer im verrauchten Wohnhaus eine vermisste Person suchen und retten, den Brandherd finden und bekämpfen und für die Überdruckbelüftung die Abluftöffnung schaffen. 8 Funk-Schritte.",
      TF, "n_befehl")
s.radio("n_befehl",
        "Zimmerbrand in einem zweigeschossigen Einfamilienhaus, Neuhaus, Lindenweg 3. Das Obergeschoss ist komplett verraucht. Die Mutter meldet: **Ihr Sohn (12) ist noch im Obergeschoss.**\n\n"
        "Sie sind Truppführer des Angriffstrupps. Der Gruppenführer gibt den Befehl:\n\n"
        "**Gruppenführer:** „Angriffstrupp zur Menschenrettung mit dem ersten Rohr über den Treppenraum ins Obergeschoss – vor!“\n\n"
        "Wiederholen Sie den Befehl (Einheit – Auftrag – Mittel – Ziel – Weg).",
        "Befehl wiederholen",
        ["Angriffstrupp", "Menschenrettung", "ersten Rohr", "Obergeschoss", "Treppenraum"],
        "Angriffstrupp zur Menschenrettung mit dem ersten Rohr über den Treppenraum ins Obergeschoss – verstanden.",
        "Einheit (Angriffstrupp) . Auftrag (Menschenrettung) . Mittel (erstes Rohr) . Ziel (Obergeschoss) . Weg (über den Treppenraum) . „verstanden“",
        "n_anmeldung",
        "Befehl nach dem Schema Einheit – Auftrag – Mittel – Ziel – Weg wiederholt.",
        "Wiederholen Sie den Befehl vollständig: Einheit, Auftrag, Mittel, Ziel, Weg.",
        "Nach FwDV 3 hat der Befehl die Form **Einheit – Auftrag – Mittel – Ziel – Weg – „vor!“**. Der Truppführer wiederholt ihn, bevor der Trupp vorgeht.")
s.radio("n_anmeldung",
        "Lungenautomaten sind angeschlossen, Flaschendruck **300** und **290 bar**. Melden Sie sich bei der Atemschutzüberwachung an.",
        "Bei der Atemschutzüberwachung anmelden",
        ["Atemschutzüberwachung", "Angriffstrupp", "geht vor", "Menschenrettung", "Obergeschoss", "bar", "kommen"],
        "Atemschutzüberwachung von Angriffstrupp – Angriffstrupp geht vor zur Menschenrettung ins Obergeschoss, Druck 300 und 290 bar – kommen.",
        "Anruf: Atemschutzüberwachung von Angriffstrupp . „geht vor“ . Auftrag und Ziel (Menschenrettung, Obergeschoss) . Druck beider Geräteträger in bar . „kommen“",
        "n_suche",
        "Anmeldung bei der Atemschutzüberwachung vollständig.",
        "Melden Sie: Angriffstrupp geht vor, Auftrag und Ziel, Druck beider Geräteträger.",
        "Vor dem Vorgehen meldet sich der Trupp bei der **Atemschutzüberwachung** an: Auftrag, Ziel und Druck. Ohne Anmeldung kein Vorgehen.")
s.choice("n_suche",
         "Am Treppenkopf im Obergeschoss: Sicht null, Hitze unter der Decke. Vor Ihnen ein Flur mit mehreren Türen.\n\nWie suchen Sie?",
         [("🧭 Mit Rohr systematisch Raum für Raum an der Wand entlang (Rechts- oder Linksregel), Wärmebildkamera nutzen, durchsuchte Türen schließen und markieren", "n_fund"),
          ("🏃 Rohr am Treppenkopf liegen lassen, um schneller zu sein", None,
           "Das Rohr ist **Schutz und Rückweg** zugleich. Ohne Rohr sind Sie einer Rauchdurchzündung schutzlos ausgeliefert und finden den Weg schwerer zurück."),
          ("🪟 Zuerst alle Fenster einschlagen, damit der Rauch abzieht", None,
           "Unkontrolliertes Öffnen führt dem Brand Sauerstoff zu und kann eine **Rauchdurchzündung** auslösen. Ventilation nur **koordiniert und auf Befehl**.")])
s.radio("n_fund",
        "Im zweiten Raum rechts – einem Kinderzimmer – finden Sie den Jungen vor dem Bett am Boden. Er ist **bewusstlos**. Der Brand ist in diesem Raum nicht.\n\n"
        "Menschenrettung hat Vorrang. Melden Sie dem Gruppenführer den Fund und Ihr Vorgehen.",
        "Fund melden",
        ["Gruppenführer", "Angriffstrupp", "Person gefunden", "Kinderzimmer", "bewusstlos", "Treppenraum", "ins Freie", "kommen"],
        "Gruppenführer von Angriffstrupp – Person gefunden, Obergeschoss Kinderzimmer, Kind bewusstlos. Bringen die Person über den Treppenraum ins Freie – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . „Person gefunden“ . Fundort (Obergeschoss, Kinderzimmer) . Zustand (bewusstlos) . Vorgehen: über den Treppenraum ins Freie . „kommen“",
        "n_wieder_vor",
        "Fund mit Ort, Zustand und Rettungsweg gemeldet – der Rettungsdienst steht bereit.",
        "Melden Sie: Person gefunden, wo, Zustand, und dass Sie sie über den Treppenraum ins Freie bringen.",
        "Der Gruppenführer braucht **Fundort, Zustand und Rettungsweg**, damit der Rettungsdienst am Ausgang bereitsteht und ggf. weitere Kräfte die Brandbekämpfung übernehmen.")
s.radio("n_wieder_vor",
        "Sie übergeben den Jungen vor der Haustür an den Rettungsdienst. Ihr Druck: **220** und **210 bar**. Ein Lüfter steht vor der Haustür bereit.\n\n"
        "**Gruppenführer:** „Angriffstrupp: zur Brandbekämpfung erneut ins Obergeschoss, Brandherd suchen. Melden, wenn eine Abluftöffnung im Brandraum möglich ist – vor!“\n\n"
        "Bestätigen Sie und melden Sie den Druck.",
        "Bestätigen mit Druck",
        ["Angriffstrupp", "verstanden", "Brandbekämpfung", "Obergeschoss", "Abluftöffnung", "bar"],
        "Angriffstrupp zur Brandbekämpfung erneut ins Obergeschoss, Brandherd suchen, Abluftöffnung melden – verstanden, Druck 210 bar.",
        "Befehl wiederholen (Brandbekämpfung, Obergeschoss, Brandherd suchen, Abluftöffnung melden) . „verstanden“ . niedrigsten Druck nennen (210 bar)",
        "n_brandherd",
        "Befehl wiederholt und Druck mitgeteilt.",
        "Wiederholen Sie den neuen Befehl und nennen Sie Ihren Druck.",
        "Vor einem erneuten Vorgehen prüft der Gruppenführer, ob die **Luft reicht**. Nennen Sie deshalb den **niedrigsten Druck** im Trupp.")
s.radio("n_brandherd",
        "Mit der Wärmebildkamera finden Sie den Brandherd: **Schlafzimmer am Ende des Flurs**, eine brennende Matratze. Sie löschen mit kurzen Stößen. Das Fenster des Schlafzimmers führt zum Garten.\n\n"
        "Melden Sie Brandherd und mögliche Abluftöffnung.",
        "Brandherd melden",
        ["Gruppenführer", "Angriffstrupp", "Brandherd", "Schlafzimmer", "Fenster", "Abluftöffnung", "kommen"],
        "Gruppenführer von Angriffstrupp – Brandherd gefunden, Obergeschoss Schlafzimmer am Flurende, wird abgelöscht. Fenster zum Garten als Abluftöffnung möglich – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . Brandherd gefunden (OG, Schlafzimmer am Flurende) . Maßnahme (wird abgelöscht) . mögliche Abluftöffnung (Fenster zum Garten) . „kommen“",
        "n_abluft",
        "Brandherd und Abluftöffnung gemeldet.",
        "Melden Sie Brandherd mit Ort und die mögliche Abluftöffnung im Brandraum.",
        "Für eine **Überdruckbelüftung** soll die Abluftöffnung **im Brandraum** oder so nah wie möglich daran liegen – dann wird der Rauch auf kürzestem Weg ins Freie gedrückt.")
s.choice("n_abluft",
         "**Gruppenführer:** „Verstanden – Abluftöffnung schaffen und melden, danach geht der Lüfter in Betrieb.“\n\nIn welcher Reihenfolge läuft die Überdruckbelüftung?",
         [("🪟 Erst Abluftöffnung im Brandraum öffnen und melden – dann Lüfter an der Haustür starten", "n_abluft_melden"),
          ("🌀 Lüfter sofort starten, Fenster danach öffnen", None,
           "Ohne Abluftöffnung drückt der Lüfter Rauch und Brandgase **in andere Räume** – auch zu Ihnen. Zuerst die **Abluftöffnung**, dann den Lüfter."),
          ("🪟 Ein Fenster im Treppenraum oben öffnen", None,
           "Dann zieht der Rauch **quer durch das Gebäude** am Trupp vorbei. Die Abluft gehört in den **Brandraum**, die Türen zu anderen Räumen bleiben geschlossen.")])
s.radio("n_abluft_melden",
        "Sie öffnen das Schlafzimmerfenster vollständig, die Türen der anderen Räume sind geschlossen. Melden Sie.",
        "Abluftöffnung melden",
        ["Gruppenführer", "Angriffstrupp", "Abluftöffnung", "geschaffen", "Lüfter", "kommen"],
        "Gruppenführer von Angriffstrupp – Abluftöffnung im Schlafzimmer geschaffen, andere Türen geschlossen, Lüfter kann in Betrieb gehen – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . Abluftöffnung im Brandraum geschaffen . andere Türen geschlossen . Freigabe: Lüfter kann in Betrieb gehen . „kommen“",
        "n_aus",
        "Abluftöffnung gemeldet – Freigabe für den Lüfter.",
        "Melden Sie: Abluftöffnung geschaffen, Türen geschlossen, Lüfter kann starten.",
        "Erst mit der Meldung **„Abluftöffnung geschaffen“** startet der Lüfter. Geschlossene Türen lenken den Luftstrom gezielt durch den Brandraum.")
s.radio("n_aus",
        "Der Lüfter läuft, der Rauch zieht durch das Schlafzimmerfenster ab, die Sicht wird besser. Die Matratze ist abgelöscht, die Wärmebildkamera zeigt keine Glutnester mehr. Ihr Druck: **150** und **140 bar**.\n\n"
        "Melden Sie das Ergebnis und dass Sie den Rückzug antreten.",
        "Ergebnis melden",
        ["Gruppenführer", "Angriffstrupp", "Feuer aus", "Wärmebildkamera", "Rauch zieht ab", "Rückzug", "kommen"],
        "Gruppenführer von Angriffstrupp – Feuer aus im Schlafzimmer, Nachkontrolle mit Wärmebildkamera ohne Befund, Rauch zieht ab. Treten Rückzug an, Druck 140 bar – kommen.",
        "Anruf: Gruppenführer von Angriffstrupp . „Feuer aus“ (Schlafzimmer) . Nachkontrolle mit Wärmebildkamera ohne Befund . Rauch zieht ab . „treten Rückzug an“ + niedrigster Druck . „kommen“",
        "n_abmeldung",
        "Ergebnis und Rückzug gemeldet.",
        "Melden Sie Feuer aus, Nachkontrolle, Rauchabzug, Rückzug und Druck.",
        "Melden Sie das **Ergebnis**, die **Nachkontrolle** und dass Sie den **Rückzug** antreten – mit Druck.")
s.radio("n_abmeldung",
        "Sie sind vor der Haustür. Melden Sie sich bei der Atemschutzüberwachung ab.",
        "Bei der Überwachung abmelden",
        ["Atemschutzüberwachung", "Angriffstrupp", "Gefahrenbereich verlassen", "bar", "kommen"],
        "Atemschutzüberwachung von Angriffstrupp – Angriffstrupp hat den Gefahrenbereich verlassen, Druck 140 bar – kommen.",
        "Anruf: Atemschutzüberwachung von Angriffstrupp . „Gefahrenbereich verlassen“ . niedrigster Druck . „kommen“",
        "n_end",
        "Bei der Atemschutzüberwachung abgemeldet.",
        "Melden Sie: Gefahrenbereich verlassen, Druck.",
        "Ohne Abmeldung gilt der Trupp für die Überwachung weiterhin als **im Einsatz** – im Zweifel wird nach ihm gesucht.")
s.end("**Atemschutzüberwachung:** „Hier Atemschutzüberwachung – verstanden, 140 bar – Ende.“\n\n"
      "Menschenrettung vor Brandbekämpfung, systematische Suche mit Rohr, Brandherd gefunden, Abluftöffnung vor dem Lüfter – vorbildlich.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("brand", s))

# ================================================================ Verkehrsregelung wechselseitig
s = S("verkehrsregelung_wechselseitig", "Verkehrsregelung: Wechselseitige Verkehrsführung",
      "Mittel: Mit zwei Posten den Verkehr an einer Unfallstelle wechselseitig regeln – Befugnis nach Art. 7a ZustGVerk, Absprache „letztes Fahrzeug“, Rettungswagen mit Sondersignal durchschleusen, Übergabe an die Polizei. 5 Funk-Schritte.",
      TF, "n_start")
s.radio("n_start",
        "Verkehrsunfall auf der Staatsstraße zwischen Neuhaus und Adelsdorf. Ein Fahrstreifen ist durch die Unfallfahrzeuge blockiert. Die Polizei ist noch auf Anfahrt.\n\n"
        "Sie sind Truppführer des **Schlauchtrupps**. Ihr Posten ist das **Nordende** (Richtung Adelsdorf). Am **Südende** steht der **Wassertrupp** – wegen einer Kuppe ohne Sichtkontakt. Beide Posten haben ein Handfunkgerät.\n\n"
        "**Gruppenführer:** „Schlauchtrupp: Posten Nordende, Verkehr wechselseitig an der Unfallstelle vorbeiführen, Absprache mit dem Wassertrupp am Südende – kommen.“\n\nWiederholen Sie den Befehl.",
        "Befehl wiederholen",
        ["Schlauchtrupp", "verstanden", "Nordende", "wechselseitig", "Wassertrupp", "kommen"],
        "Hier Schlauchtrupp – verstanden: Posten Nordende, Verkehr wechselseitig vorbeiführen, Absprache mit dem Wassertrupp am Südende – kommen.",
        "„hier Schlauchtrupp“ . „verstanden“ . Posten (Nordende) . Auftrag (Verkehr wechselseitig vorbeiführen) . Absprache mit Wassertrupp am Südende . „kommen“",
        "n_haltezeichen",
        "Befehl korrekt wiederholt.",
        "Wiederholen Sie: Posten Nordende, wechselseitig vorbeiführen, Absprache mit dem Wassertrupp.",
        "Wechselseitiger Verkehr funktioniert nur, wenn **beide Posten** wissen, wer gerade fahren darf.")
s.choice("n_haltezeichen",
         "> In Bayern üben die **eingesetzten Feuerwehrkräfte** zur Sicherung der Einsatzstelle die Befugnisse der Polizei nach **§ 36 Abs. 1 StVO** aus (**Art. 7a ZustGVerk**). Ihre Zeichen sind für Verkehrsteilnehmer verbindlich.\n\n"
         "Sie tragen Warnkleidung und haben einen Anhaltestab (Leuchtstab). Wie halten Sie den Verkehr an?",
         [("✋ Vom Fahrbahnrand aus, früh sichtbar, Blickkontakt mit dem Fahrer, Anhaltestab deutlich quer bzw. senkrecht hoch – Fluchtweg im Rücken", "n_freigabe"),
          ("🚧 Mitten auf den Fahrstreifen stellen, dann muss jeder halten", None,
           "Auf der Fahrbahn sind Sie ungeschützt. Stehen Sie **am Fahrbahnrand** mit Fluchtweg, früh sichtbar, und halten Sie Blickkontakt."),
          ("🔦 Mit der Taschenlampe ins Gesicht leuchten", None,
           "Blenden gefährdet alle. Benutzen Sie den **Anhaltestab** oder eine Handlampe, die nicht blendet.")])
s.radio("n_freigabe",
        "Sie lassen den Verkehr Richtung Süden laufen. Das letzte Fahrzeug, das Sie durchlassen, ist ein **roter Kombi**; danach halten Sie an. Teilen Sie das dem Wassertrupp mit, damit er weiß, wann er seine Richtung freigeben kann.",
        "Freigabe an den Wassertrupp",
        ["Wassertrupp", "Schlauchtrupp", "Richtung Süden", "letztes Fahrzeug", "roter Kombi", "kommen"],
        "Wassertrupp von Schlauchtrupp – Verkehr Richtung Süden läuft, letztes Fahrzeug roter Kombi, danach gesperrt – kommen.",
        "Anruf: Wassertrupp von Schlauchtrupp . Fahrtrichtung, die gerade läuft (Richtung Süden) . „letztes Fahrzeug“ mit eindeutiger Beschreibung (roter Kombi) . danach gesperrt . „kommen“",
        "n_rtw",
        "Klare Übergabe mit „letztem Fahrzeug“ – so gibt es keinen Gegenverkehr in der Engstelle.",
        "Melden Sie Fahrtrichtung, letztes Fahrzeug (roter Kombi) und dass danach gesperrt ist.",
        "Die Gegenseite gibt **erst frei, wenn das „letzte Fahrzeug“ bei ihr angekommen ist**. Deshalb muss das letzte Fahrzeug eindeutig beschrieben werden (Farbe, Typ, ggf. Kennzeichen).")
s.choice("n_rtw",
         "**Wassertrupp:** „Hier Wassertrupp – roter Kombi durch, Verkehr Richtung Norden läuft – kommen.“\n\nPlötzlich hören Sie hinter sich ein **Martinshorn**: Ein **RTW mit Sondersignal** kommt von Norden und will nach Süden durch – gegen den gerade laufenden Verkehr.\n\nWas tun Sie?",
         [("📞 Wassertrupp sofort anfunken: Verkehr Richtung Norden stoppen, RTW kommt von Norden durch", "n_rtw_funk"),
          ("🚑 RTW einfach in die Engstelle schicken", None,
           "Dann trifft der RTW in der Engstelle auf Gegenverkehr. Erst den Gegenverkehr am anderen Posten **stoppen**, dann den RTW durchschleusen."),
          ("✋ RTW anhalten, bis die Richtung ohnehin wechselt", None,
           "Ein RTW mit Sondersignal hat **Vorrang** (§ 38 StVO). Schaffen Sie ihm sofort freie Bahn – über Absprache mit dem anderen Posten.")])
s.radio("n_rtw_funk",
        "Sprechen Sie den Wassertrupp kurz und eindeutig an.",
        "RTW durchschleusen",
        ["Wassertrupp", "Schlauchtrupp", "sofort", "Richtung Norden", "stoppen", "RTW", "Sondersignal", "kommen"],
        "Wassertrupp von Schlauchtrupp – sofort Verkehr Richtung Norden stoppen, RTW mit Sondersignal kommt von Norden durch – kommen.",
        "Anruf: Wassertrupp von Schlauchtrupp . „sofort“ . Verkehr Richtung Norden stoppen . Grund: RTW mit Sondersignal von Norden . „kommen“",
        "n_kennzeichen",
        "RTW sicher durchgeschleust.",
        "Fordern Sie den Wassertrupp auf, sofort Richtung Norden zu stoppen, weil ein RTW mit Sondersignal von Norden kommt.",
        "Im Notfall zuerst die **Handlung** („sofort … stoppen“), dann der Grund. Den RTW lassen Sie erst fahren, wenn der Wassertrupp **bestätigt**, dass gestoppt ist.")
s.radio("n_kennzeichen",
        "**Wassertrupp:** „Hier Wassertrupp – Richtung Norden gestoppt, letztes Fahrzeug weißer Transporter ist durch – kommen.“\n\nDer RTW passiert die Engstelle. Kurz danach fährt ein **schwarzer SUV** trotz Ihres Haltezeichens an Ihnen vorbei. Kennzeichen: **ERH – SK 47**.\n\n"
        "Nicht hinterherlaufen! Warnen Sie den Wassertrupp und melden Sie den Verstoß. Buchstaben **buchstabieren**.",
        "Verstoß melden",
        ["Wassertrupp", "Schlauchtrupp", "schwarzer SUV", "Haltezeichen", "Samuel", "Kaufmann", "kommen"],
        "Wassertrupp von Schlauchtrupp – Achtung: schwarzer SUV hat Haltezeichen missachtet, fährt Richtung Süden. Kennzeichen ich buchstabiere Emil Richard Heinrich – Samuel Kaufmann – vier sieben. Gruppenführer bitte mithören – kommen.",
        "Anruf: Wassertrupp von Schlauchtrupp . „Achtung“ . Fahrzeug und Verstoß (schwarzer SUV, Haltezeichen missachtet) . Fahrtrichtung (Süden) . Kennzeichen buchstabiert (Emil Richard Heinrich – Samuel Kaufmann – vier sieben) . „kommen“",
        "n_polizei",
        "Warnung und Verstoß mit buchstabiertem Kennzeichen gemeldet.",
        "Warnen Sie den Wassertrupp, beschreiben Sie das Fahrzeug und buchstabieren Sie das Kennzeichen.",
        "Zuerst die **Warnung** an den anderen Posten – dort kommt das Fahrzeug in den Gegenverkehr. Das Kennzeichen wird **buchstabiert**, damit es die Polizei verfolgen kann.")
s.radio("n_polizei",
        "Die Polizei trifft ein und übernimmt Ihren Posten am Nordende. Sie haben dem Beamten den Verstoß übergeben.\n\nMelden Sie dem Gruppenführer die Übergabe. Es ist die letzte Meldung des Gesprächs.",
        "Übergabe melden",
        ["Gruppenführer", "Schlauchtrupp", "Polizei", "übernommen", "Nordende", "Ende"],
        "Gruppenführer von Schlauchtrupp – Polizei hat die Verkehrsregelung am Nordende übernommen, Verstoß übergeben, Schlauchtrupp kommt zum Fahrzeug – Ende.",
        "Anruf: Gruppenführer von Schlauchtrupp . Polizei hat die Verkehrsregelung am Nordende übernommen . Verstoß übergeben . Trupp kommt zum Fahrzeug . „Ende“",
        "n_end",
        "Übergabe gemeldet.",
        "Melden Sie: Polizei hat am Nordende übernommen, Verstoß übergeben, Trupp kommt zurück.",
        "Den Posten verlassen Sie erst **nach der Übergabe** – und melden sich dann beim Gruppenführer zurück.")
s.end("Wechselseitige Verkehrsführung mit „letztem Fahrzeug“, RTW sicher durchgeschleust, Verstoß richtig gemeldet und an die Polizei übergeben.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("verkehr", s))

# ================================================================ Vermisstensuche
s = S("vermisstensuche", "Vermisstensuche im Gelände",
      "Mittel: Als Gruppenführer einer Suchgruppe einen Suchabschnitt übernehmen, in der Suchkette suchen, einen Fund richtig sichern und melden, die aufgefundene Person ohne Namen melden und die Vollzähligkeit zurückmelden. 5 Funk-Schritte.",
      GF, "n_ankunft")
s.radio("n_ankunft",
        "Ein **78-jähriger, an Demenz erkrankter Mann** wird seit drei Stunden aus einem Seniorenheim in Neuhaus vermisst. Die **Polizei leitet die Suche**, die Feuerwehr unterstützt. Am Sammelplatz Sportplatz führt **Florian Neuhaus 11/1** den Feuerwehr-Abschnitt.\n\n"
        "Sie treffen als Gruppenführer mit **Florian Neuhaus 44/1** und **1/8** am Sammelplatz ein. Melden Sie sich an und erfragen Sie den Auftrag.",
        "Anmelden und Auftrag erfragen",
        ["Florian Neuhaus", "Sammelplatz", "1/8", "Auftrag", "kommen"],
        "Florian Neuhaus 11/1 von Florian Neuhaus 44/1 – mit Gruppe 1/8 am Sammelplatz Sportplatz eingetroffen, Frage Suchauftrag – kommen.",
        "Anruf: Florian Neuhaus 11/1 von Florian Neuhaus 44/1 . eingetroffen am Sammelplatz Sportplatz . Stärke (1/8 = Gruppe) . Frage Suchauftrag . „kommen“",
        "n_auftrag",
        "Anmeldung mit Stärke – der Abschnitt weiß, mit wie vielen Kräften er planen kann.",
        "Melden Sie Ankunft am Sammelplatz, Stärke 1/8 und fragen Sie den Auftrag ab.",
        "Bei Suchen zählt jede Person: Melden Sie sich mit **Stärke** (z. B. **1/8** = ein Führer, acht Mann) an.")
s.radio("n_auftrag",
        "**Florian Neuhaus 11/1:** „Hier Florian Neuhaus 11/1 – Auftrag für Florian Neuhaus 44/1: **Suchabschnitt drei**, Waldstück nördlich des Sportplatzes zwischen Feldweg und Bachlauf bis zur Kreisstraße. Suchkette, Abstand höchstens fünf Meter. Gesucht: Mann, 78, graue Jacke, Gehstock. Fundstücke nicht verändern. Bei Auffinden **keine Namen** über Funk – kommen.“\n\n"
        "Wiederholen Sie die wesentlichen Punkte.",
        "Auftrag wiederholen",
        ["Florian Neuhaus", "verstanden", "Suchabschnitt drei", "Feldweg", "Bachlauf", "Kreisstraße", "Suchkette", "kommen"],
        "Hier Florian Neuhaus 44/1 – verstanden: Suchabschnitt drei, Waldstück zwischen Feldweg und Bachlauf bis zur Kreisstraße, Suchkette mit höchstens fünf Metern Abstand, graue Jacke, Gehstock – beginnen mit der Suche – kommen.",
        "„hier“ + Rufname . „verstanden“ . Abschnitt und Grenzen (Suchabschnitt drei, Feldweg – Bachlauf – Kreisstraße) . Suchart (Suchkette, max. 5 m) . Merkmale (graue Jacke, Gehstock) . Beginn melden . „kommen“",
        "n_kette",
        "Auftrag mit Abschnittsgrenzen und Merkmalen wiederholt.",
        "Wiederholen Sie Abschnitt, Grenzen, Suchkette mit Abstand und die Merkmale.",
        "Die **Abschnittsgrenzen** sind das Wichtigste: Nur so überlappen sich die Abschnitte nicht und es bleiben keine Lücken.")
s.choice("n_kette",
         "Sie stellen die Gruppe am Feldweg auf. Wie organisieren Sie die Suche?",
         [("🚶‍♂️🚶‍♀️ Suchkette mit gleichem Abstand und Sicht- und Rufkontakt, Gruppenführer dahinter, langsames Tempo, durchsuchte Grenzen mit Trassierband markieren", "n_gegenstand"),
          ("🏃 Alle verteilen sich einzeln, damit es schneller geht", None,
           "Einzeln Suchende lassen Lücken und können selbst verloren gehen. Eine **Suchkette** mit Sicht- und Rufkontakt deckt die Fläche lückenlos ab."),
          ("📣 Mit Martinshorn durch den Wald fahren", None,
           "Menschen mit Demenz reagieren oft nicht oder verstecken sich sogar. Lärm hilft nicht, sondern stört Suchhunde. Systematische Suche in der **Kette**.")])
s.choice("n_gegenstand",
         "Nach 20 Minuten findet ein Truppmann am Bachufer einen **Gehstock**.\n\nWas tun Sie?",
         [("📍 Nicht berühren, Fundstelle markieren, Standort bestimmen und dem Abschnitt melden", "n_fund_melden"),
          ("🦯 Gehstock mitnehmen und am Sammelplatz abgeben", None,
           "Fundstücke werden **nicht verändert** – sie sind eine Spur für die Polizei und für **Personenspürhunde** (Mantrailer). Markieren, Standort melden, liegen lassen.")])
s.radio("n_fund_melden",
        "Melden Sie den Fund mit eindeutigem Standort.",
        "Fund melden",
        ["Florian Neuhaus", "Fund", "Suchabschnitt drei", "Gehstock", "Bachufer", "Holzbrücke", "markiert", "kommen"],
        "Florian Neuhaus 11/1 von Florian Neuhaus 44/1 – Fund in Suchabschnitt drei: Gehstock am Bachufer, etwa zweihundert Meter nördlich der Holzbrücke. Fundstelle markiert und nicht verändert – kommen.",
        "Anruf: Florian Neuhaus 11/1 von Florian Neuhaus 44/1 . „Fund“ + Suchabschnitt . was (Gehstock) . wo – mit markantem Punkt oder Koordinaten (Bachufer, ca. 200 m nördlich der Holzbrücke) . markiert und nicht verändert . „kommen“",
        "n_person",
        "Fund mit Standort gemeldet und gesichert.",
        "Melden Sie: was gefunden, wo (mit markantem Punkt), markiert und nicht verändert.",
        "Der Standort muss **für andere auffindbar** sein: markanter Punkt mit Entfernung und Richtung oder Koordinaten aus dem Funkgerät oder der App.")
s.radio("n_person",
        "**Florian Neuhaus 11/1:** „Verstanden – Suche entlang des Bachlaufs verdichten – Ende.“\n\nFünfzig Meter bachabwärts finden Sie den Mann in einem Graben. Er ist **ansprechbar, stark unterkühlt** und kann nicht gehen. Ihre Gruppe beginnt mit der Erstversorgung (Rettungsdecke, Wärmeerhalt).\n\n"
        "Melden Sie das Auffinden – **ohne Namen** –, fordern Sie den Rettungsdienst an und nennen Sie eine Zufahrt.",
        "Auffinden melden",
        ["Florian Neuhaus", "Person aufgefunden", "unterkühlt", "ansprechbar", "Rettungsdienst", "Zufahrt", "Feldweg", "kommen"],
        "Florian Neuhaus 11/1 von Florian Neuhaus 44/1 – Person aufgefunden in Suchabschnitt drei, im Graben am Bachlauf, etwa fünfzig Meter unterhalb des Fundorts Gehstock. Ansprechbar, stark unterkühlt. Erstversorgung läuft, benötigen Rettungsdienst. Zufahrt über den Feldweg ab der Kreisstraße, Einweiser steht an der Kreisstraße – kommen.",
        "Anruf . „Person aufgefunden“ + Suchabschnitt (keine Namen!) . Fundort . Zustand (ansprechbar, stark unterkühlt) . Maßnahmen (Erstversorgung) . Nachforderung (Rettungsdienst) . Zufahrt + Einweiser . „kommen“",
        "n_vollzaehlig",
        "Auffinden gemeldet: Zustand, Rettungsdienst, Zufahrt mit Einweiser – und kein Name im Funk.",
        "Melden Sie: Person aufgefunden (ohne Namen), Fundort, Zustand, Rettungsdienst, Zufahrt mit Einweiser.",
        "Über Funk hören viele mit (auch Scanner). **Keine Namen** der vermissten Person. Der Rettungsdienst braucht eine **befahrbare Zufahrt** und einen **Einweiser**.")
s.radio("n_vollzaehlig",
        "Der Rettungsdienst hat den Mann übernommen.\n\n**Florian Neuhaus 11/1:** „Florian Neuhaus 11/1 an alle: Suche beendet, alle Suchgruppen zum Sammelplatz Sportplatz – Vollzähligkeit melden.“\n\n"
        "Sie haben durchgezählt: alle 9 da. Melden Sie zurück.",
        "Vollzähligkeit melden",
        ["Florian Neuhaus", "verstanden", "Rettungsdienst", "vollzählig", "1/8", "Sammelplatz", "Ende"],
        "Hier Florian Neuhaus 44/1 – verstanden: Person an den Rettungsdienst übergeben, Gruppe vollzählig 1/8, rücken zum Sammelplatz – Ende.",
        "„hier“ + Rufname . „verstanden“ . Person übergeben . Vollzähligkeit mit Stärke (1/8) . rücken zum Sammelplatz . „Ende“",
        "n_end",
        "Vollzählig zurückgemeldet.",
        "Melden Sie: übergeben, vollzählig 1/8, rücken zum Sammelplatz.",
        "Nach jeder Suche wird die **Vollzähligkeit** gemeldet – im Gelände kann eine Einsatzkraft leicht selbst verloren gehen.")
s.end("Suchabschnitt systematisch abgesucht, Fund gesichert, Person ohne Namen gemeldet, Rettungsdienst mit Zufahrt angefordert und vollzählig zurückgemeldet.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("sonstige", s))

# ================================================================ Hubschrauber
s = S("hubschrauber_landeplatz", "Hubschrauber: Landeplatz absperren und einweisen",
      "Mittel: Für einen Rettungshubschrauber einen geeigneten Landeplatz wählen, absperren lassen, Landeplatzdaten an den Hubschrauber geben, richtig einweisen und sich dem Hubschrauber nur auf Zeichen der Crew nähern. 4 Funk-Schritte.",
      GF, "n_alarm")
s.radio("n_alarm",
        "Verkehrsunfall auf der Kreisstraße bei Neuhaus, ein Schwerverletzter. Sie sind Gruppenführer auf **Florian Neuhaus 44/1**.\n\n"
        "**Leitstelle:** „Florian Neuhaus 44/1 von Leitstelle – Rettungshubschrauber **Christoph 27** ist alarmiert, Ankunft in etwa acht Minuten. Richten Sie einen Landeplatz ein, der Hubschrauber meldet sich bei Ihnen in der Einsatz-Sprechgruppe – kommen.“\n\nBestätigen Sie.",
        "Bestätigen",
        ["Florian Neuhaus", "verstanden", "Christoph 27", "acht Minuten", "Landeplatz", "kommen"],
        "Hier Florian Neuhaus 44/1 – verstanden: Christoph 27 in etwa acht Minuten, richten Landeplatz ein – kommen.",
        "„hier“ + Rufname . „verstanden“ . wiederholen: Christoph 27, Ankunft in etwa 8 Minuten, Landeplatz einrichten . „kommen“",
        "n_platz",
        "Auftrag bestätigt.",
        "Bestätigen Sie mit „verstanden“ und wiederholen Sie Christoph 27, Ankunftszeit und Auftrag.",
        "Wiederholen Sie die einsatzwichtigen Inhalte – Rufname des Hubschraubers, Zeit, Auftrag.")
s.choice("n_platz",
         "Welchen Landeplatz wählen Sie?",
         [("🌾 Wiese rund 100 m südlich der Unfallstelle: eben, etwa 40 × 40 m, keine Bäume, Stromleitung etwa 150 m entfernt", "n_absperren"),
          ("🛣️ Die Fahrbahn direkt neben den Unfallfahrzeugen", None,
           "Der Rotorabwind wirbelt Trümmerteile, Glas und Staub auf – die Einsatzkräfte an den Fahrzeugen werden gefährdet. Der Landeplatz soll **abseits der Arbeiten** liegen."),
          ("🌳 Kleiner Hof zwischen Bäumen, dafür nur 20 m entfernt", None,
           "Zu klein und mit Hindernissen. Als Richtwert gilt am Tag eine **hindernisfreie Fläche von mindestens etwa 25 × 25 m** (besser mehr), dazu freie An- und Abflugwege.")])
s.radio("n_absperren",
        "Geben Sie dem **Schlauchtrupp** den Befehl, den Landeplatz einzurichten. Ein Truppmann soll einweisen.",
        "Befehl an den Schlauchtrupp",
        ["Schlauchtrupp", "Landeplatz", "Wiese", "absperren", "lose Gegenstände", "weist", "kommen"],
        "Schlauchtrupp von Gruppenführer – Landeplatz auf der Wiese südlich der Unfallstelle einrichten: großräumig absperren, lose Gegenstände entfernen, ein Truppmann weist den Hubschrauber ein – kommen.",
        "Anruf: Schlauchtrupp von Gruppenführer . Auftrag: Landeplatz einrichten . Ziel: Wiese südlich der Unfallstelle . Maßnahmen: großräumig absperren, lose Gegenstände entfernen . Einweiser bestimmen . „kommen“",
        "n_daten",
        "Befehl vollständig: absperren, lose Teile weg, Einweiser.",
        "Befehlen Sie: Landeplatz Wiese, absperren, lose Gegenstände entfernen, Einweiser.",
        "Der Abwind kann lose Teile **mehrere Dutzend Meter** weit schleudern – auch Leitkegel, Planen und Decken gehören weg. Schaulustige und Fahrzeuge bleiben **außerhalb der Absperrung**.")
s.radio("n_daten",
        "**Christoph 27:** „Florian Neuhaus 44/1 von Christoph 27 – im Anflug, Frage Landeplatz – kommen.“\n\n"
        "Wind: schwach aus **West**. Geben Sie die Landeplatzdaten durch.",
        "Landeplatzdaten geben",
        ["Florian Neuhaus", "Landeplatz", "Wiese", "südlich", "Hindernis", "Stromleitung", "Wind", "West", "Einweiser", "kommen"],
        "Hier Florian Neuhaus 44/1 – Landeplatz Wiese etwa 100 Meter südlich der Unfallstelle, östlich der Kreisstraße. Fläche eben, etwa 40 mal 40 Meter. Hindernis: Stromleitung etwa 150 Meter nördlich. Wind schwach aus West. Landeplatz abgesperrt, Einweiser in Warnkleidung – kommen.",
        "„hier“ + Rufname . Lage des Landeplatzes (Wiese ca. 100 m südlich, östlich der Straße) . Fläche und Untergrund . Hindernisse (Stromleitung ca. 150 m nördlich) . Wind (Richtung und Stärke) . abgesperrt, Einweiser in Warnkleidung . „kommen“",
        "n_einweiser",
        "Alle Landeplatzdaten übermittelt – besonders die Stromleitung.",
        "Nennen Sie Lage, Fläche, Hindernisse (Stromleitung), Wind und dass abgesperrt und ein Einweiser da ist.",
        "Für den Piloten zählen **Lage, Größe/Untergrund, Hindernisse** (vor allem **Leitungen** – aus der Luft kaum zu sehen) und **Wind**.")
s.choice("n_einweiser",
         "Der Hubschrauber ist in Sicht. Wie steht Ihr Einweiser?",
         [("🙆 Am Rand des Landeplatzes, **Rücken zum Wind**, beide Arme schräg nach oben (Y), Schutzbrille bzw. Visier, Blickkontakt zum Piloten, nicht bewegen", "n_landung"),
          ("👋 Mitten auf dem Platz und winkend", None,
           "Der Einweiser steht **am Rand**, nicht im Landefeld. Winken verwirrt – die ruhige **Y-Haltung** zeigt: Hier landen."),
          ("🌬️ Gesicht zum Wind", None,
           "Der Hubschrauber landet **gegen den Wind**. Steht der Einweiser mit dem **Rücken zum Wind**, fliegt der Pilot direkt auf ihn zu.")])
s.choice("n_landung",
         "Christoph 27 ist gelandet, der Rotor dreht noch. Ihre Kräfte wollen mit der Trage zum Hubschrauber.\n\nWie gehen sie vor?",
         [("✋ Warten, bis die Crew ein Zeichen gibt – dann nur von vorne im Sichtbereich des Piloten, gebückt, nie zum Heckrotor", "n_abflug"),
          ("🏃 Sofort von hinten zur Ladetür, das spart Zeit", None,
           "Der **Heckrotor** ist kaum zu sehen und lebensgefährlich. Annähern **nur auf Zeichen der Crew** und **von vorne** im Sichtbereich des Piloten."),
          ("🚒 Mit dem Fahrzeug bis an den Hubschrauber fahren", None,
           "Fahrzeuge nähern sich nur nach **Freigabe der Crew** und fahren nie unter der Rotorebene durch.")])
s.radio("n_abflug",
        "Der Patient ist an Bord, die Crew bereitet den Abflug vor. Befehlen Sie dem Schlauchtrupp, was bis nach dem Abflug gilt.",
        "Befehl zum Abflug",
        ["Schlauchtrupp", "Absperrung", "halten", "abgeflogen", "lose Teile", "kommen"],
        "Schlauchtrupp von Gruppenführer – Absperrung halten, bis Christoph 27 abgeflogen ist. Danach Landeplatz auf lose Teile kontrollieren und Absperrung abbauen – kommen.",
        "Anruf: Schlauchtrupp von Gruppenführer . Absperrung halten bis zum Abflug . danach Landeplatz auf lose Teile kontrollieren . Absperrung abbauen . „kommen“",
        "n_end",
        "Absperrung bis zum Abflug gesichert.",
        "Befehlen Sie: Absperrung halten bis zum Abflug, danach kontrollieren und abbauen.",
        "Auch beim **Abflug** wirkt der Rotorabwind. Die Absperrung bleibt, bis der Hubschrauber **abgeflogen** ist.")
s.end("**Schlauchtrupp:** „Hier Schlauchtrupp – verstanden – Ende.“\n\n"
      "Christoph 27 hebt ab. Landeplatz richtig gewählt, abgesperrt, Hindernisse und Wind gemeldet, korrekt eingewiesen und sicher angenähert.\n\n**Übung abgeschlossen! 🚁**")
OUT.append(("sonstige", s))

# ================================================================ Mayday: Truppführer bewusstlos
s = S("mayday_truppfuehrer_bewusstlos", "Mayday: Angriffstruppführer bewusstlos",
      "Profi: Als Truppmann den Zusammenbruch des eigenen Truppführers erkennen, Notruftaste und Mayday absetzen, Atmung und Druck melden, die Anweisungen umsetzen und mit dem Sicherheitstrupp die Rettung abschließen. 4 Funk-Schritte.",
      "truppmann", "n_start")
s.choice("n_start",
         "Innenangriff im **Erdgeschoss** eines Reihenhauses in Neuhaus, Sicht nahezu null. Sie sind **Truppmann** im Angriffstrupp von **Florian Neuhaus 44/1**. Gefunkt wird im Einsatzstellenfunk (DMO), Ihr Gruppenführer führt den Einsatz.\n\n"
         "Plötzlich sackt Ihr **Truppführer** zusammen und reagiert nicht mehr auf Ansprache und Rütteln. Sie hören, dass sein **Lungenautomat noch arbeitet** – er atmet.\n\nWas tun Sie **zuerst**?",
         [("🆘 Notruftaste am Funkgerät drücken und Mayday absetzen", "n_mayday"),
          ("😷 Maske des Truppführers lösen, um die Atmung besser zu prüfen", None,
           "**Niemals** im Brandrauch die Maske abnehmen – der Truppführer atmet sonst Brandgase ein. Die Atmung erkennen Sie am Geräusch des Lungenautomaten."),
          ("🚪 Allein zum Ausgang und Hilfe holen", None,
           "Sie bleiben **beim Truppführer**. Allein im Rauch finden ihn die Retter womöglich nicht wieder. Notruf über Funk – sofort.")])
s.radio("n_mayday",
        "Die Notruftaste ist gedrückt. Setzen Sie den Mayday-Notruf ab. Sie stehen etwa **zehn Meter hinter der Haustür im Wohnzimmer** und haben die **Schlauchleitung** in der Hand.",
        "Mayday sprechen",
        ["Mayday", "Angriffstrupp", "Erdgeschoss", "Wohnzimmer", "Truppführer", "bewusstlos", "kommen"],
        "Mayday, Mayday, Mayday – hier Angriffstrupp Florian Neuhaus 44/1 – Erdgeschoss, Wohnzimmer, etwa zehn Meter hinter der Haustür an der Schlauchleitung – Truppführer bewusstlos – Mayday, kommen!",
        "Kennwort dreimal: Mayday, Mayday, Mayday . „hier“ + Funkrufname (Angriffstrupp Florian Neuhaus 44/1) . Standort (Erdgeschoss, Wohnzimmer, ca. 10 m hinter der Haustür, an der Schlauchleitung) . Lage (Truppführer bewusstlos) . „Mayday, kommen“",
        "n_lage",
        "Mayday nach FwDV 7 abgesetzt.",
        "Mayday: dreimal Kennwort, „hier“ + Rufname, Standort, Lage, „Mayday, kommen“.",
        "Auch der **Truppmann** setzt das Mayday ab, wenn der Truppführer ausfällt – im Wortlaut der FwDV 7:\n1. **„Mayday, Mayday, Mayday“**\n2. **„hier“ + Funkrufname des Trupps**\n3. **Standort**\n4. **Lage**\n5. **„Mayday, kommen“**")
s.radio("n_lage",
        "**Gruppenführer:** „Hier Florian Neuhaus 44/1 – Mayday verstanden. Sicherheitstrupp geht vor, folgt der Schlauchleitung. Frage Atmung, Druck und Rückweg – kommen.“\n\n"
        "Sie lesen die Manometer ab: Truppführer **150 bar**, Sie selbst **160 bar**. Der Weg zur Haustür entlang des Schlauchs ist frei.",
        "Atmung, Druck, Rückweg melden",
        ["Angriffstrupp", "atmet", "Lungenautomat", "bar", "Rückweg frei", "Schlauchleitung", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – Truppführer atmet, Lungenautomat arbeitet. Druck Truppführer 150, eigener Druck 160 bar. Rückweg entlang der Schlauchleitung frei – kommen.",
        "„hier“ + Rufname . Atmung (Truppführer atmet, Lungenautomat arbeitet) . Druck beider Geräte (150 / 160 bar) . Rückweg (entlang der Schlauchleitung frei) . „kommen“",
        "n_massnahme",
        "Lage präzise gemeldet – der Sicherheitstrupp weiß, was ihn erwartet.",
        "Melden Sie Atmung, beide Drücke und den Zustand des Rückwegs.",
        "Der Gruppenführer und der Sicherheitstrupp brauchen: **Atmet er? Wie viel Luft haben beide? Ist der Rückweg frei?**")
s.choice("n_massnahme",
         "**Gruppenführer:** „Verstanden. Bleiben Sie beim Truppführer. Wenn möglich, ziehen Sie ihn am Schlauch in Richtung Haustür. Machen Sie sich mit der Lampe bemerkbar – kommen.“\n\nWas tun Sie?",
         [("🔦 Beim Truppführer bleiben, Schlauch nicht loslassen, ihn am Tragegriff des Atemschutzgeräts Richtung Ausgang ziehen, Lampe auf den Boden richten", "n_bestaetigen"),
          ("🧭 Schlauch kurz loslassen, um mit beiden Händen besser ziehen zu können", None,
           "Die **Schlauchleitung ist Ihr Rückweg** und der Weg des Sicherheitstrupps zu Ihnen. Nie loslassen."),
          ("🔄 Eigenes Gerät mit dem Truppführer teilen", None,
           "Sein Lungenautomat arbeitet und er hat 150 bar. Das Teilen der Luft macht die Lage nur unübersichtlicher. Bleiben Sie bei der Anweisung des Gruppenführers.")])
s.radio("n_bestaetigen",
        "Bestätigen Sie die Anweisung kurz – danach Funkdisziplin.",
        "Anweisung bestätigen",
        ["Angriffstrupp", "verstanden", "bleibe beim Truppführer", "Schlauch", "Haustür", "Lampe", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – verstanden: bleibe beim Truppführer, ziehe ihn am Schlauch Richtung Haustür, mache mich mit der Lampe bemerkbar – kommen.",
        "„hier“ + Rufname . „verstanden“ . Anweisung wiederholen (beim Truppführer bleiben, am Schlauch Richtung Haustür ziehen, mit Lampe bemerkbar machen) . „kommen“",
        "n_st",
        "Kurz und vollständig bestätigt.",
        "Bestätigen Sie mit „verstanden“ und wiederholen Sie die Anweisung.",
        "Nach dem Mayday gehört der Funk dem Notfall: **kurz bestätigen**, dann nur noch Wesentliches.")
s.radio("n_st",
        "Nach etwa drei Metern spüren Sie eine Hand auf der Schulter: Der **Sicherheitstrupp** ist da. Er übernimmt Ihren Truppführer und bringt ihn hinaus. Sie gehen mit.\n\n"
        "Vor dem Haus übernimmt der Rettungsdienst den Truppführer. Melden Sie dem Gruppenführer – das Mayday hebt **er** auf.",
        "Rettung melden",
        ["Angriffstrupp", "Truppführer", "Sicherheitstrupp", "gerettet", "Rettungsdienst", "im Freien", "kommen"],
        "Hier Angriffstrupp Florian Neuhaus 44/1 – Truppführer durch Sicherheitstrupp gerettet und an den Rettungsdienst übergeben, Angriffstrupp vollständig im Freien – kommen.",
        "„hier“ + Rufname . Truppführer durch Sicherheitstrupp gerettet . an den Rettungsdienst übergeben . Angriffstrupp vollständig im Freien . „kommen“ – Aufhebung durch den Gruppenführer",
        "n_end",
        "Rettung gemeldet – Aufhebung durch den Gruppenführer.",
        "Melden Sie: Truppführer gerettet, an den Rettungsdienst übergeben, Trupp vollständig im Freien.",
        "Sie melden das **Ergebnis**, der **Gruppenführer bzw. Einsatzleiter** hebt Mayday und Funkbeschränkung auf.")
s.end("**Gruppenführer:** „Florian Neuhaus 44/1 an alle: Atemschutznotfall beendet, Funkverkehr wieder frei.“\n\n"
      "Sie haben richtig gehandelt: sofort Notruftaste und Mayday, präzise Lage, beim Truppführer geblieben, Schlauch nie losgelassen.\n\n"
      "> Nach einem Atemschutznotfall lassen sich **beide** Geräteträger vom Rettungsdienst untersuchen. Die **PSNV** (Psychosoziale Notfallversorgung für Einsatzkräfte) wird angeboten. Sie gehen nicht wieder vor.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("brand", s))
