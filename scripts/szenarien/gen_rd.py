"""Rettungsdienst: Grundausbildung Sprechfunk (Kapitel) und Einsatz-Szenarien.

Quellen: FMS-Richtlinie Bayern (2009), Richtlinie Funkrufnamen und OPTA Bayern (2014),
Handout Digitalfunk ILS Schweinfurt (2017), ÄLRD/ZRF Nürnberg „Anmeldung von Patienten“ (2026).
Status 0/5/9 und die Klinikanmeldung (PZC) unterscheiden sich regional – als Beispiel gekennzeichnet."""
from gen_lib import K, S

OUT = []
RD = "rettungsdienst"
HINWEIS = "\n\n> *Beispiel nach bayerischer Regelung – Status und Abläufe können in deinem Rettungsdienstbereich abweichen.*"
HINWEIS_SIE = "\n\n> *Beispiel nach bayerischer Regelung – Status und Abläufe können in Ihrem Rettungsdienstbereich abweichen.*"
ILS = "**Leitstelle Nürnberg:**"

# ================================================================ Grundausbildung Rettungsdienst
k = K("rd_grundausbildung", "Rettungsdienst Grundausbildung Sprechfunk",
      "Für Neue im Rettungsdienst: In 5 Kapiteln lernst du Rufnamen, Status, Sprechwunsch, die Klinikanmeldung ohne Namen und wann Status 0 oder die Notruftaste dran ist.",
      RD)
k.chapter("rufnamen", "Rufnamen im Rettungsdienst", "r")
k.chapter("status", "Status drücken", "s")
k.chapter("sprechwunsch", "Sprechwunsch: Status 5 und J", "w")
k.chapter("anmeldung", "Klinikanmeldung ohne Namen", "a")
k.chapter("notfall", "Status 0 oder Notruftaste", "n")
PA = "**Praxisanleiter:**"

# ---------- Kapitel 1: Rufnamen ----------
k.node("r_start",
       "Dein erster Dienst auf der **Rettungswache Höchstadt** des Roten Kreuzes. Dein Praxisanleiter zeigt dir den Rettungswagen.\n\n"
       f"{PA} „Unser RTW heißt **Rotkreuz Höchstadt 71/1**. Das Kennwort sagt, wer das Fahrzeug betreibt: **Rotkreuz** (BRK/DRK), **Sama** (ASB), **Akkon** (Johanniter), **Johannes** (Malteser). "
       "Die **71** ist der RTW, **72** der KTW, **76** das Notarzteinsatzfahrzeug, **79** First Responder. Die Leitstelle ist einfach **Leitstelle Nürnberg**.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "r_choice")])
k.ask("r", "Über Funk hörst du **Akkon Erlangen 76/1**. Wer ist das?",
      "Das Notarzteinsatzfahrzeug der Johanniter",
      [("Ein RTW der Malteser",
        "**Nicht ganz.** **Akkon** sind die **Johanniter** (die Malteser heißen **Johannes**), und **76** ist das **NEF** – der RTW wäre 71."),
       ("Ein Krankentransportwagen der Johanniter",
        "**Fast.** Akkon = Johanniter stimmt. Aber der KTW hat die **72** – die **76** ist das **Notarzteinsatzfahrzeug**.")],
      "r_speak", [2, 0, 1])
k.node("r_speak", "**Richtig!** Jetzt du: Rufe die Leitstelle. Wie immer: **Wen rufst du – von wem – kommen.**",
       [K.call("Leitstelle anfunken", "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – kommen.",
               ["Leitstelle Nürnberg", "Rotkreuz", "71/1", "kommen"], "r_speak2", "r_fail", "Hier Leitstelle Nürnberg – kommen.")])
k.retry("r_fail", "**Noch nicht ganz.** Erst der Gerufene, dann „von“ und du: „Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – kommen.“", "r_speak")
k.node("r_speak2", f"Jetzt ruft die Leitstelle **euch**:\n\n{ILS} „Rotkreuz Höchstadt 71/1 von Leitstelle Nürnberg – kommen.“\n\nAntworte: **Hier** – dein Rufname – **kommen**.",
       [K.call("Anruf beantworten", "Hier Rotkreuz Höchstadt 71/1 – kommen.",
               ["hier", "Rotkreuz", "71/1", "kommen"], "r_end", "r_fail2", "Hier Leitstelle Nürnberg – Funkprobe, danke – Ende.")])
k.retry("r_fail2", "**Fast.** „Hier Rotkreuz Höchstadt 71/1 – kommen.“ – „hört“ ist kein Funkwort.", "r_speak2")
k.finish("r_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Kennwort – Ort – Kennzahl.** 71 RTW, 72 KTW, 76 NEF, 79 First Responder.")

# ---------- Kapitel 2: Status ----------
k.node("s_start",
       "Im RTW zeigt dir der Praxisanleiter das Bedienteil.\n\n"
       f"{PA} „Das Meiste sagen wir der Leitstelle **ohne Worte – mit Status**: "
       "**1** frei über Funk · **2** frei auf Wache · **3** Einsatz übernommen · **4** am Einsatzort · **6** nicht einsatzbereit · **7** Patient aufgenommen · **8** am Zielort. "
       "Ein gedrückter Status spart dem Funkkanal viele Sprüche.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "s_choice")])
k.ask("s", "Alarm! Ihr sitzt im RTW und fahrt von der Wache los. Welchen Status drückst du?",
      "Status 3 – Einsatz übernommen",
      [("Status 4", "**Zu früh.** **4** heißt: am Einsatzort angekommen. Beim Losfahren drückst du **3** – Einsatz übernommen."),
       ("Status 1", "**Nicht ganz.** **1** heißt: frei über Funk – also einsatzbereit für den **nächsten** Einsatz. Ihr seid aber gerade unterwegs: **3**.")],
      "s2_choice", [1, 0, 2])
k.ask("s2", "**Richtig!** Ihr habt die Patientin versorgt, sie liegt im RTW, ihr fahrt ins Krankenhaus. Welcher Status?",
      "Status 7 – Patient aufgenommen",
      [("Status 8", "**Noch nicht.** **8** drückst du erst **am Zielort**, also in der Klinik. Mit Patient an Bord unterwegs: **7**."),
       ("Status 3", "**Nicht ganz.** **3** war die Anfahrt zum Einsatz. Mit Patient an Bord: **7** – Patient aufgenommen.")],
      "s_speak", [2, 1, 0])
k.node("s_speak", f"**Richtig!** Nach Status 7 fragt die Leitstelle oft nach dem Ziel:\n\n{ILS} „Rotkreuz Höchstadt 71/1 – Transportziel durchgeben – kommen.“\n\nIhr fahrt ins **Uniklinikum Erlangen**.",
       [K.call("Transportziel durchgeben", "Hier Rotkreuz Höchstadt 71/1 – Transportziel Uniklinikum Erlangen – kommen.",
               ["71/1", "Transportziel", "Uniklinikum Erlangen", "kommen"], "s_end", "s_fail", "Hier Leitstelle Nürnberg – verstanden – Ende.")])
k.retry("s_fail", "**Noch nicht ganz.** „Hier Rotkreuz Höchstadt 71/1 – Transportziel Uniklinikum Erlangen – kommen.“", "s_speak")
k.finish("s_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **3** los – **4** da – **7** Patient an Bord – **8** am Ziel – **1** wieder frei.")

# ---------- Kapitel 3: Sprechwunsch ----------
k.node("w_start",
       "Zurück auf der Wache. Der Praxisanleiter erklärt, wie man der Leitstelle etwas sagt.\n\n"
       f"{PA} „Die Leitstelle spricht mit vielen Fahrzeugen gleichzeitig. Willst du etwas sagen, drückst du **Status 5 – Sprechwunsch** und **wartest**. "
       "Hat die Leitstelle Zeit, schickt sie dir ein **J – Sprechaufforderung** oder ruft dich. Erst **dann** sprichst du.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "w_choice")])
k.ask("w", "Nach einem Transport ist euer RTW **stark verschmutzt** und muss auf der Wache desinfiziert werden. Das muss die Leitstelle wissen. Was machst du?",
      "Status 5 drücken und auf J warten",
      [("Einfach lossprechen: „Leitstelle Nürnberg von …“",
        "**Nicht ganz.** Vielleicht spricht die Leitstelle gerade mit einem anderen Fahrzeug über einen Notfall. Mit **Status 5** meldest du dich an – sie ruft dich, sobald sie kann."),
       ("Gar nichts sagen und einfach zur Wache fahren",
        "**Nicht gut.** Die Leitstelle hält euch sonst für einsatzbereit und schickt euch womöglich zum nächsten Notfall.")],
      "w_speak", [1, 0, 2])
k.node("w_speak", "**Richtig!** Auf dem Display erscheint **J**. Sprich jetzt: was los ist, was ihr tut, wie lange es dauert.",
       [K.call("Nach J sprechen", "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Fahrzeug stark verschmutzt, fahren zur Desinfektion auf die Wache, etwa 30 Minuten nicht einsatzbereit – kommen.",
               ["Leitstelle Nürnberg", "71/1", "verschmutzt", "Desinfektion", "30 Minuten", "nicht einsatzbereit", "kommen"],
               "w2_choice", "w_fail", "Hier Leitstelle Nürnberg – verstanden, Status 6 – Ende.")])
k.retry("w_fail", "**Noch nicht ganz.** „Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Fahrzeug stark verschmutzt, fahren zur Desinfektion auf die Wache, etwa 30 Minuten nicht einsatzbereit – kommen.“", "w_speak")
k.ask("w2", "Die Leitstelle sagt „Status 6“. Nach der Desinfektion steht der RTW sauber auf der Wache. Welchen Status drückst du jetzt?",
      "Status 2 – frei auf Wache",
      [("Status 6", "**Nicht mehr.** **6** heißt nicht einsatzbereit – das seid ihr ja nicht mehr. Auf der Wache und bereit: **2**."),
       ("Status 5", "**Nicht nötig.** Für „wieder einsatzbereit“ gibt es einen eigenen Status – das spart den Funkspruch: **2**.")],
      "w_end", [0, 2, 1])
k.finish("w_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Status 5 – warten auf J – dann sprechen.**\n\n> *In manchen Leitstellen sprichst du nach J ohne neuen Anruf sofort los – frag nach, wie es bei euch üblich ist.*")

# ---------- Kapitel 4: Klinikanmeldung ----------
k.node("a_start",
       "Unterwegs zur Klinik. Der Praxisanleiter erklärt die Anmeldung.\n\n"
       f"{PA} „Funk kann **jeder mithören**. Deshalb nennen wir **nie Namen oder Geburtsdaten**. Für die Klinik reicht: **Wunschklinik, Geschlecht, Verdachtsdiagnose, Ankunftszeit**. "
       "Viele Bereiche nutzen statt der Diagnose einen **PZC** (Patientenzuweisungscode). Bei **Schockraum, Schlaganfall, Herzinfarkt oder Reanimation** meldest du zusätzlich **telefonisch** vor.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "a_choice")])
k.ask("a", "Euer Patient: **Herr Max Berger**, geboren 1950, Sturz vom Fahrrad, Verdacht auf **Unterschenkelbruch**. In etwa **20 Minuten** seid ihr im Uniklinikum Erlangen. Was gehört in den Funkspruch?",
      "„… männlich, Verdacht Unterschenkelfraktur, Ankunft in 20 Minuten …“",
      [("„… Herr Max Berger, geboren 1950, Unterschenkelbruch …“",
        "**Datenschutz!** Über Funk hört jeder mit, der einen Scanner hat. **Keine Namen, keine Geburtsdaten** – Geschlecht und Verdachtsdiagnose reichen der Klinik."),
       ("„… wir kommen gleich mit einem Patienten …“",
        "**Zu wenig.** Die Klinik muss wissen, **was** kommt und **wann** – sonst steht kein passendes Team bereit.")],
      "a_speak", [1, 0, 2])
k.node("a_speak", "**Richtig!** Die Leitstelle hat euch nach Status 5 aufgefordert. Melde den Patienten über die Leitstelle beim Klinikum an.",
       [K.call("Patienten anmelden", "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – bitte für das Uniklinikum Erlangen anmelden: männlich, Verdacht Unterschenkelfraktur, Ankunft in 20 Minuten – kommen.",
               ["Leitstelle Nürnberg", "71/1", "Uniklinikum Erlangen", "anmelden", "männlich", "Unterschenkelfraktur", "20 Minuten", "kommen"],
               "a_end", "a_fail", "Hier Leitstelle Nürnberg – verstanden, Uniklinikum Erlangen, männlich, Unterschenkelfraktur, 20 Minuten – Ende.")])
k.retry("a_fail", "**Noch nicht ganz.** Klinik – Geschlecht – Verdacht – Ankunft, aber **kein Name**: „Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – bitte für das Uniklinikum Erlangen anmelden: männlich, Verdacht Unterschenkelfraktur, Ankunft in 20 Minuten – kommen.“", "a_speak")
k.finish("a_end", "**Kapitel geschafft!** 🎉\n\nMerksatz: **Klinik – Geschlecht – Verdacht – Ankunft.** Namen gibt es nur am Telefon oder bei der Übergabe.")

# ---------- Kapitel 5: Status 0 oder Notruftaste ----------
k.node("n_start",
       "Letzte Lektion für heute: die dringenden Fälle.\n\n"
       f"{PA} „**Status 5** ist ein normaler Sprechwunsch. Ist es **dringend für den Patienten** – zum Beispiel ihr braucht sofort einen Notarzt – drückst du im Digitalfunk **Status 0: dringender Sprechwunsch**. "
       "Status 0 ist **kein Notruf**! Seid **ihr selbst in Gefahr**, drückst du die rote **Notruftaste** mindestens drei Sekunden – dann ist dein Mikrofon offen und du hast Vorrang vor allen.“" + HINWEIS,
       [K.go("ok", "👍 Verstanden", "n_choice")])
k.ask("n", "Euer Patient wird plötzlich **bewusstlos**, ihr braucht **sofort einen Notarzt**. Was drückst du?",
      "Status 0 – dringender Sprechwunsch",
      [("Die rote Notruftaste",
        "**Nicht ganz.** Die Notruftaste ist für **eure eigene Lebensgefahr**. Für den Patienten: **Status 0** – dringender Sprechwunsch."),
       ("Status 5 und warten",
        "**Zu langsam.** Bei Status 5 kann es dauern, bis die Leitstelle Zeit hat. Für einen Notfall des Patienten: **Status 0**.")],
      "n2_choice", [1, 2, 0])
k.ask("n2", "**Richtig!** Nächster Einsatz: In der Wohnung zieht ein **Angehöriger plötzlich ein Messer** und bedroht euch. Ihr zieht euch sofort zurück. Was jetzt?",
      "🆘 Notruftaste drücken",
      [("Status 0 drücken",
        "**Nicht ganz.** Status 0 ist ein Sprechwunsch – ihr müsstet warten. Bei **eigener Lebensgefahr**: **Notruftaste**, dann sofort sprechen."),
       ("Erst einmal abwarten, ob er sich beruhigt",
        "**Gefährlich.** Bei Bedrohung zählt jede Sekunde – Polizei braucht Zeit zur Anfahrt. Sofort **Notruftaste**.")],
      "n_sos", [2, 0, 1])
k.node("n_sos", "**Richtig!** Drück jetzt die **Notruftaste** deines Funkgeräts.",
       [K.go("sos", "🆘 Notruftaste drücken", "n_speak", key="sos")])
k.node("n_speak", "Die Notruftaste ist ausgelöst, dein Mikrofon ist offen. Sprich sofort: **Notruf – wer – wo – was – was ihr braucht.**",
       [K.call("Notruf sprechen", "Notruf – Rotkreuz Höchstadt 71/1 – Lindenweg 3 – Bedrohung durch Person mit Messer – ziehen uns zum Fahrzeug zurück – brauchen Polizei – kommen.",
               ["Notruf", "71/1", "Lindenweg 3", "Bedrohung", "Messer", "Polizei", "kommen"],
               "n_end", "n_fail", "Hier Leitstelle Nürnberg – Notruf verstanden, Polizei ist alarmiert. Bleiben Sie im Fahrzeug – kommen.")])
k.retry("n_fail", "**Noch nicht ganz.** **Notruf** – wer – wo – was – was ihr braucht: „Notruf – Rotkreuz Höchstadt 71/1 – Lindenweg 3 – Bedrohung durch Person mit Messer – ziehen uns zum Fahrzeug zurück – brauchen Polizei – kommen.“", "n_speak")
k.finish("n_end", "**Geschafft – die Polizei ist unterwegs, ihr seid in Sicherheit.** 🎉\n\n"
         "Du kennst jetzt die Grundlagen: Rufnamen, Status, Sprechwunsch, Klinikanmeldung ohne Namen, Status 0 und Notruftaste. **Willkommen im Rettungsdienst-Funk!**", last=True)
OUT.append(("rettungsdienst", k))


def status(s, nid, narrative, right, wrongs, nxt):
    """Status am Bedienteil drücken: richtige Taste + typische Verwechslungen."""
    s.choice(nid, narrative, [("📟 " + right, nxt)] + [("📟 " + w, None, why) for w, why in wrongs])


# ================================================================ Ganzer RTW-Einsatz
s = S("rd_einsatzablauf_rtw", "Rettungsdienst: Ein RTW-Einsatz von Alarm bis frei",
      "Einsteiger: Mit dem RTW einen kompletten Einsatz fahren – Einsatzauftrag wiederholen, Status 3, 4, 7, 8 und 1 richtig drücken, Rückmeldung geben und die Patientin ohne Namen in der Klinik anmelden. 3 Funk-Schritte.",
      RD, "n_auftrag")
s.radio("n_auftrag",
        "Sie sind Notfallsanitäter auf dem RTW **Rotkreuz Höchstadt 71/1**, Status 2 auf der Wache. Der Melder geht, das Display zeigt **C – melden für Einsatzauftrag**. Sie haben die Leitstelle gerufen:\n\n"
        f"{ILS} „Rotkreuz Höchstadt 71/1 – Einsatz: Neuhaus, Lindenweg 3, Erdgeschoss, gestürzte Person, kommt nicht mehr hoch – kommen.“\n\n"
        "Wiederholen Sie den Einsatzauftrag." + HINWEIS_SIE,
        "Einsatzauftrag wiederholen",
        ["71/1", "verstanden", "Lindenweg 3", "Erdgeschoss", "gestürzte Person", "kommen"],
        "Hier Rotkreuz Höchstadt 71/1 – verstanden: Neuhaus, Lindenweg 3, Erdgeschoss, gestürzte Person – kommen.",
        "„hier Rotkreuz Höchstadt 71/1“ . „verstanden“ . Einsatzort (Lindenweg 3, Erdgeschoss) . Stichwort (gestürzte Person) . „kommen“",
        "n_status3",
        "Einsatzort und Stichwort wiederholt – Hörfehler beim Ort wären sonst teuer.",
        "Wiederholen Sie Ort, Stockwerk und Stichwort.",
        "Die Wiederholung des **Einsatzorts** schützt vor der teuersten Verwechslung: einer falschen Adresse.")
status(s, "n_status3", "Sie sitzen im RTW und fahren los. Welchen Status drücken Sie?",
       "Status 3 – Einsatz übernommen",
       [("Status 4", "**4** kommt erst **am Einsatzort**."), ("Status 1", "**1** heißt frei über Funk – Sie sind aber im Einsatz.")],
       "n_status4")
status(s, "n_status4", "**Status 3** ist gesetzt. Nach sechs Minuten halten Sie vor dem Lindenweg 3. Welcher Status?",
       "Status 4 – am Einsatzort",
       [("Status 7", "**7** heißt Patient aufgenommen – Sie haben die Patientin noch nicht gesehen."),
        ("Kein Status, die Leitstelle sieht uns ja auf dem Navi", "Die Leitstelle braucht den **Status 4** – davon hängen Zeiten, Statistik und die Disposition anderer Fahrzeuge ab.")],
       "n_rueckmeldung")
s.radio("n_rueckmeldung",
        "In der Wohnung finden Sie eine **ältere Dame**, gestürzt, das **rechte Bein ist verkürzt und nach außen gedreht** – Verdacht auf **Oberschenkelhalsbruch**. Kreislauf stabil, ein Notarzt ist **nicht** nötig.\n\n"
        "Sie drücken Status 5, die Leitstelle schickt **J**. Geben Sie eine kurze Rückmeldung.",
        "Rückmeldung geben",
        ["Leitstelle Nürnberg", "71/1", "Oberschenkelhalsfraktur", "stabil", "kein Notarzt", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Patientin weiblich, Verdacht Oberschenkelhalsfraktur, Kreislauf stabil, kein Notarzt erforderlich – kommen.",
        "Anruf . Patientin (weiblich, kein Name) . Verdacht (Oberschenkelhalsfraktur) . Zustand (stabil) . „kein Notarzt erforderlich“ . „kommen“",
        "n_status7",
        "Kurze, namenlose Rückmeldung mit der wichtigsten Information: kein Notarzt nötig.",
        "Melden Sie: weiblich, Verdacht, stabil, kein Notarzt erforderlich.",
        "Mit „**kein Notarzt erforderlich**“ kann die Leitstelle das NEF für andere Einsätze freihalten.")
status(s, "n_status7", "Die Patientin ist auf der Trage im RTW, Sie fahren los. Welcher Status?",
       "Status 7 – Patient aufgenommen",
       [("Status 8", "**8** heißt am **Zielort** – Sie sind noch unterwegs."), ("Status 3", "**3** war die Anfahrt zum Einsatz.")],
       "n_anmeldung")
s.radio("n_anmeldung",
        f"{ILS} sendet **d – Transportziel durchgeben**. Sie fahren ins **Uniklinikum Erlangen**, Ankunft in etwa **15 Minuten**.\n\nMelden Sie Ziel und Patientin an – ohne Namen.",
        "Zielklinik anmelden",
        ["Leitstelle Nürnberg", "71/1", "Uniklinikum Erlangen", "anmelden", "weiblich", "Oberschenkelhalsfraktur", "15 Minuten", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – bitte für das Uniklinikum Erlangen anmelden: weiblich, Verdacht Oberschenkelhalsfraktur, Ankunft in 15 Minuten – kommen.",
        "Anruf . „bitte für das Uniklinikum Erlangen anmelden“ . Geschlecht . Verdacht . Ankunftszeit . „kommen“",
        "n_status8",
        "Anmeldung vollständig und ohne Namen.",
        "Melden Sie: Klinik, weiblich, Verdacht, Ankunft in 15 Minuten.",
        "Klinik, Geschlecht, Verdacht und Ankunftszeit reichen. Der **Name** gehört nicht in den Funk.")
status(s, "n_status8", "Die Leitstelle sendet **h – Zielort verständigt**. Sie fahren in die Liegendanfahrt des Klinikums. Welcher Status?",
       "Status 8 – am Zielort",
       [("Status 1", "Noch nicht – erst übergeben. Am Zielort: **8**."), ("Status 4", "**4** ist der **Einsatzort**, nicht die Klinik.")],
       "n_status1")
status(s, "n_status1", "Übergabe in der Notaufnahme erledigt, der RTW ist wieder bestückt, Sie sitzen im Fahrzeug. Welcher Status?",
       "Status 1 – frei über Funk",
       [("Status 2", "**2** heißt frei **auf der Wache** – Sie sind aber noch am Klinikum. Einsatzbereit unterwegs: **1**."),
        ("Status 6", "**6** heißt nicht einsatzbereit – Sie sind aber wieder einsatzbereit.")],
       "n_end")
s.end("Die Leitstelle sieht **Status 1** – Sie können sofort zum nächsten Einsatz.\n\n"
      "Auftrag wiederholt, Status lückenlos gedrückt, Rückmeldung und Anmeldung ohne Namen – ein sauberer Einsatz.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))

# ================================================================ Notarzt nachfordern / STEMI
s = S("rd_notarzt_nachfordern", "Rettungsdienst: Notarzt nachfordern – Herzinfarkt",
      "Mittel: Bei einem Patienten mit Brustschmerz verschlechtert sich der Zustand – mit Status 0 den Notarzt nachfordern, die Leitstelle informieren und den Herzinfarkt mit telefonischer Voranmeldung in der Klinik anmelden. 3 Funk-Schritte.",
      RD, "n_dringend")
s.choice("n_dringend",
         "Einsatz **Brustschmerz**, Neuhaus, Bahnhofstraße 12, 2. Obergeschoss. Sie sind mit dem RTW **Rotkreuz Höchstadt 71/1** allein am Patienten, ein Notarzt war nicht alarmiert.\n\n"
         "Das EKG zeigt einen **Herzinfarkt (STEMI)**, der Blutdruck fällt, der Patient wird **kaltschweißig**. Sie brauchen **sofort einen Notarzt**. Was drücken Sie?" + HINWEIS_SIE,
         [("📟 Status 0 – dringender Sprechwunsch", "n_nachfordern"),
          ("📟 Status 5 – Sprechwunsch", None,
           "Status 5 ist ein **normaler** Sprechwunsch – bei viel Funkverkehr kann es dauern. Für einen zeitkritischen Patienten: **Status 0**."),
          ("🆘 Notruftaste", None,
           "Die Notruftaste ist für **Ihre eigene Lebensgefahr** (z. B. Bedrohung). Für den Patienten: **Status 0** – dringender Sprechwunsch.")])
s.radio("n_nachfordern",
        f"{ILS} „Rotkreuz Höchstadt 71/1 – kommen.“\n\nFordern Sie den Notarzt nach: Ort, Grund, Zustand.",
        "Notarzt nachfordern",
        ["71/1", "Notarzt", "Bahnhofstraße 12", "Herzinfarkt", "instabil", "kommen"],
        "Hier Rotkreuz Höchstadt 71/1 – Notarzt nachfordern zur Bahnhofstraße 12, 2. Obergeschoss, Patient männlich, Herzinfarkt, Kreislauf instabil – kommen.",
        "„hier Rotkreuz Höchstadt 71/1“ . „Notarzt nachfordern“ . wohin (Bahnhofstraße 12, 2. OG) . Patient männlich . Grund (Herzinfarkt) . Zustand (instabil) . „kommen“",
        "n_alarm",
        "Nachforderung mit Ort, Grund und Dringlichkeit.",
        "Fordern Sie an: Notarzt, wohin, Patient, Herzinfarkt, instabil.",
        "Die Leitstelle entscheidet, **welches** Notarztmittel kommt – Sie liefern Ort, Grund und Zustand.")
s.radio("n_alarm",
        f"Das Display zeigt **A – Notarzt alarmiert**.\n\n{ILS} „Notarzt ist alarmiert: **Rotkreuz Höchstadt 76/1**, Eintreffen in etwa **8 Minuten** – kommen.“\n\nBestätigen Sie und sagen Sie, wo der Notarzt hin muss.",
        "Bestätigen",
        ["71/1", "verstanden", "76/1", "8 Minuten", "2. Obergeschoss", "Ende"],
        "Hier Rotkreuz Höchstadt 71/1 – verstanden, 76/1 in 8 Minuten. Wir sind im 2. Obergeschoss, Haustür ist offen – Ende.",
        "„hier Rotkreuz Höchstadt 71/1“ . „verstanden“ . was angekommen ist (76/1, 8 Minuten) . Hinweis für die Anfahrt (2. OG, Haustür offen) . „Ende“",
        "n_voranmeldung",
        "Bestätigt und mit einem nützlichen Anfahrtshinweis ergänzt.",
        "Bestätigen Sie 76/1 und die Zeit und sagen Sie, wo Sie sind.",
        "Ein kurzer **Anfahrtshinweis** (Stockwerk, offene Tür) spart dem Notarzt Suchzeit.")
s.choice("n_voranmeldung",
         "Der Notarzt ist da, der Patient ist stabilisiert. Ziel: das **Herzkatheterlabor im Uniklinikum Erlangen**. Was gehört zur Anmeldung?",
         [("☎️ Funk-Anmeldung über die Leitstelle **und** telefonische Voranmeldung beim Herzkatheter", "n_anmelden"),
          ("📻 Nur Funk-Anmeldung – die Klinik wird schon Bescheid wissen", None,
           "Bei **Herzinfarkt, Schlaganfall, Schockraum und Reanimation** ist eine **telefonische Voranmeldung** üblich – das Katheterteam muss sich vorbereiten."),
          ("☎️ Nur telefonisch – die Leitstelle braucht das nicht", None,
           "Die Leitstelle muss Ihr **Transportziel** kennen – sonst plant sie mit falschen Kapazitäten. Funk-Anmeldung **und** Telefon.")])
s.radio("n_anmelden",
        "Die telefonische Voranmeldung hat der Notarzt erledigt. Ankunft in etwa **25 Minuten**, der Notarzt fährt mit.\n\nMelden Sie über die Leitstelle an.",
        "Klinik anmelden",
        ["Leitstelle Nürnberg", "71/1", "Uniklinikum Erlangen", "anmelden", "männlich", "Herzinfarkt", "Notarzt", "25 Minuten", "telefonisch", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – bitte für das Uniklinikum Erlangen, Herzkatheter, anmelden: männlich, Herzinfarkt, mit Notarzt, Ankunft in 25 Minuten, telefonisch vorangemeldet – kommen.",
        "Anruf . „bitte für das Uniklinikum Erlangen, Herzkatheter, anmelden“ . männlich . Herzinfarkt . mit Notarzt . Ankunft in 25 Minuten . telefonisch vorangemeldet . „kommen“",
        "n_end",
        "Vollständige Anmeldung mit Hinweis auf die telefonische Voranmeldung.",
        "Melden Sie: Klinik und Herzkatheter, männlich, Herzinfarkt, mit Notarzt, 25 Minuten, telefonisch vorangemeldet.",
        "„Telefonisch vorangemeldet“ zeigt der Leitstelle, dass die Klinik Bescheid weiß – sie muss nicht noch einmal anrufen.")
s.end(f"{ILS} „Verstanden – Zielort verständigt – Ende.“\n\nStatus 0 statt Warten, präzise Nachforderung und eine vollständige Anmeldung – so kommt der Patient schnell ins Katheterlabor.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))

# ================================================================ Schlaganfall
s = S("rd_schlaganfall_anmeldung", "Rettungsdienst: Schlaganfall – Zeit ist Hirn",
      "Mittel: Eine Patientin mit Schlaganfall-Verdacht ohne Namen, aber mit Symptombeginn in der Stroke Unit anmelden – auch wenn Angehörige den Namen durchgeben wollen. 2 Funk-Schritte.",
      RD, "n_name")
s.choice("n_name",
         "Einsatz in Neuhaus: Eine Frau kann den **rechten Arm nicht heben**, spricht **verwaschen**, der Mundwinkel hängt. Der Ehemann sagt: Es begann um **9:40 Uhr**. Sie sind auf **Rotkreuz Höchstadt 71/1**.\n\n"
         "Der Ehemann drängt: „Sagen Sie denen gleich, dass es **Frau Maier** ist, sie war schon mal dort!“ Was antworten Sie?" + HINWEIS_SIE,
         [("🤝 „Den Namen geben wir in der Klinik direkt weiter – über Funk hört jeder mit.“", "n_voranmeldung"),
          ("📻 Den Namen mit in den Funkspruch nehmen – dann findet die Klinik die Akte schneller", None,
           "Funk kann **jeder mit einem Scanner mithören**. Namen und Geburtsdaten gehören nicht in den Funk – die Klinik bekommt sie bei der **Übergabe** oder **telefonisch**."),
          ("🙈 Gar nichts sagen", None,
           "Der Ehemann meint es gut. Erklären Sie kurz, **warum** der Name nicht in den Funk gehört – dann fühlt er sich ernst genommen.")])
s.choice("n_voranmeldung",
         "Ziel ist die **Stroke Unit im Uniklinikum Erlangen**. Was ist bei einem Schlaganfall-Verdacht zusätzlich wichtig?",
         [("☎️ Telefonische Voranmeldung – und die Uhrzeit des Symptombeginns nennen", "n_anmelden"),
          ("⏱️ Erst in der Klinik sagen, wann es losging", None,
           "Ob eine Lyse oder Katheter-Behandlung infrage kommt, hängt vom **Zeitfenster** ab. Der **Symptombeginn** gehört schon in die Anmeldung."),
          ("🚑 Gar nicht anmelden, einfach schnell fahren", None,
           "Ohne Anmeldung steht kein Stroke-Team bereit, und das CT ist vielleicht belegt. **Zeit ist Hirn** – die Anmeldung spart Minuten.")])
s.radio("n_anmelden",
        "Ihr Kollege meldet telefonisch vor. Sie haben Status 5 gedrückt, die Leitstelle hat Sie aufgefordert. Ankunft in etwa **20 Minuten**.\n\nMelden Sie die Patientin über Funk an.",
        "Stroke Unit anmelden",
        ["Leitstelle Nürnberg", "71/1", "Uniklinikum Erlangen", "anmelden", "weiblich", "Schlaganfall", "9:40", "20 Minuten", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – bitte für die Stroke Unit Uniklinikum Erlangen anmelden: weiblich, Verdacht Schlaganfall, Symptombeginn 9:40 Uhr, Ankunft in 20 Minuten – kommen.",
        "Anruf . „bitte für die Stroke Unit Uniklinikum Erlangen anmelden“ . weiblich . Verdacht Schlaganfall . Symptombeginn 9:40 Uhr . Ankunft in 20 Minuten . „kommen“ – kein Name",
        "n_status",
        "Anmeldung mit Symptombeginn – und ohne Namen.",
        "Melden Sie: Stroke Unit, weiblich, Verdacht Schlaganfall, Symptombeginn, Ankunft in 20 Minuten.",
        "Der **Symptombeginn** ist bei einem Schlaganfall die wichtigste Zahl: Davon hängt die Behandlung ab.")
s.radio("n_status",
        f"{ILS} „Hier Leitstelle Nürnberg – Stroke Unit ist verständigt – kommen.“\n\nBestätigen Sie kurz und beenden Sie den Funkverkehr.",
        "Bestätigen",
        ["71/1", "verstanden", "Ende"],
        "Hier Rotkreuz Höchstadt 71/1 – verstanden – Ende.",
        "„hier Rotkreuz Höchstadt 71/1“ . „verstanden“ . „Ende“",
        "n_end",
        "Kurz bestätigt – der Kanal ist wieder frei.",
        "Bestätigen Sie mit „verstanden – Ende“.",
        "Mehr braucht es nicht: **verstanden – Ende** gibt den Kanal frei.")
s.end("Status 7 ist gedrückt, die Stroke Unit wartet schon. Den Namen gibt der Ehemann an der Aufnahme an.\n\n"
      "Datenschutz gewahrt, Symptombeginn gemeldet, telefonisch vorangemeldet – so zählt jede Minute für die Patientin.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))

# ================================================================ MANV
s = S("rd_manv_ersteintreffend", "Rettungsdienst: MANV – erster RTW an der Einsatzstelle",
      "Profi: Als erster RTW an einem Busunfall nicht sofort behandeln, sondern Lage melden und Kräfte anfordern, das Sichtungsergebnis durchgeben und die Einsatzleitung an LNA und OrgL übergeben. 3 Funk-Schritte.",
      RD, "n_erster")
s.choice("n_erster",
         "Alarm: **Verkehrsunfall mit Bus**, B 470 zwischen Gremsdorf und Adelsdorf. Sie sind mit **Rotkreuz Höchstadt 71/1** als **erstes Rettungsmittel** vor Ort.\n\n"
         "Ein **Linienbus** ist gegen einen Baum gefahren. Überall sitzen und liegen Verletzte, Sie schätzen **etwa 20**. Direkt vor Ihnen schreit ein Mann mit stark blutendem Arm. Was tun Sie zuerst?" + HINWEIS_SIE,
         [("📻 Überblick verschaffen und Lage an die Leitstelle melden – vorläufige Einsatzleitung übernehmen", "n_lage"),
          ("🩹 Sofort den blutenden Mann versorgen", None,
           "Verständlich – aber wenn der **erste RTW** behandelt, fehlt die Lagemeldung, und alle weiteren Kräfte kommen **zu spät**. Erst melden und ordnen, dann helfen (kurze Blutstillung durch den Kollegen ist okay)."),
          ("🚑 Den schwersten Patienten einladen und in die Klinik fahren", None,
           "Dann steht die Einsatzstelle **ohne Rettungsdienst** da. Der erste RTW bleibt, **meldet** und **ordnet**, bis die Führung eintrifft.")])
s.radio("n_lage",
        "Geben Sie die erste Lagemeldung: Ort, was passiert ist, geschätzte Zahl der Verletzten, was Sie brauchen.",
        "Erste Lagemeldung",
        ["Leitstelle Nürnberg", "71/1", "B 470", "Bus", "20 Verletzte", "Notarzt", "Einsatzleitung", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Lagemeldung: B 470 zwischen Gremsdorf und Adelsdorf, Linienbus gegen Baum, geschätzt 20 Verletzte, MANV. Fordern weitere Rettungsmittel, Notärzte, LNA und OrgL an. Übernehmen vorläufige Einsatzleitung – kommen.",
        "Anruf . „Lagemeldung“ . wo (B 470 zwischen Gremsdorf und Adelsdorf) . was (Bus gegen Baum) . wie viele (geschätzt 20 Verletzte) . „MANV“ . Anforderung (Rettungsmittel, Notärzte, LNA, OrgL) . „übernehmen vorläufige Einsatzleitung“ . „kommen“",
        "n_sichtung",
        "Lagemeldung vollständig – die Leitstelle kann groß nachalarmieren.",
        "Melden Sie: Ort, Bus gegen Baum, geschätzt 20 Verletzte, MANV, Anforderung, vorläufige Einsatzleitung.",
        "Die **erste Lagemeldung** bestimmt, wie groß die Leitstelle nachalarmiert. Fordern Sie **Einsatzmittel** an – wer kommt, entscheidet die Leitstelle.")
s.radio("n_sichtung",
        "Ihr Kollege und Sie haben gesichtet: **3 rot** (lebensbedrohlich), **6 gelb** (schwer verletzt), **11 grün** (leicht verletzt). Die ersten Nachalarmierten sind unterwegs.\n\nGeben Sie das Sichtungsergebnis durch.",
        "Sichtungsergebnis melden",
        ["Leitstelle Nürnberg", "71/1", "Sichtungsergebnis", "3 rot", "6 gelb", "11 grün", "20", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Sichtungsergebnis: 3 rot, 6 gelb, 11 grün, gesamt 20 – kommen.",
        "Anruf . „Sichtungsergebnis“ . Zahlen je Kategorie (3 rot, 6 gelb, 11 grün) . gesamt 20 . „kommen“",
        "n_uebergabe",
        "Sichtungsergebnis klar nach Kategorien gemeldet.",
        "Melden Sie die Zahlen: 3 rot, 6 gelb, 11 grün, gesamt 20.",
        "Mit den **Zahlen je Kategorie** plant die Leitstelle Transportmittel und verteilt die Patienten auf die Kliniken.")
s.choice("n_uebergabe",
         "Der **Leitende Notarzt (LNA)** und der **Organisatorische Leiter (OrgL)** treffen ein. Wie übergeben Sie?",
         [("🗣️ Persönlich: Lage, Sichtungsergebnis, was angefordert ist – dann zurück an die Patienten", "n_melden"),
          ("📻 Über Funk, dann muss ich nicht von den Patienten weg", None,
           "Die Übergabe an die Führung geschieht **persönlich** – kurz, aber vollständig. Funk ist für Nachfragen da, nicht für die Übergabe auf 20 Metern."),
          ("🚑 Gar nicht – die sehen ja, was los ist", None,
           "Ohne Übergabe beginnt die Führung **bei null**: Sie kennt weder die Sichtung noch die Anforderungen.")])
s.radio("n_melden",
        "Die Übergabe ist erledigt. Melden Sie der Leitstelle, dass LNA und OrgL die Einsatzleitung übernommen haben und Sie in die Versorgung gehen.",
        "Übergabe melden",
        ["Leitstelle Nürnberg", "71/1", "Einsatzleitung", "übergeben", "Versorgung", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Einsatzleitung an LNA und OrgL übergeben, übernehmen Patientenversorgung – kommen.",
        "Anruf . Einsatzleitung übergeben (an LNA und OrgL) . was Sie jetzt tun (Patientenversorgung) . „kommen“",
        "n_end",
        "Übergabe der Einsatzleitung gemeldet.",
        "Melden Sie: Einsatzleitung an LNA und OrgL übergeben, übernehmen Versorgung.",
        "Die Leitstelle muss wissen, **wer** jetzt die Einsatzstelle führt – ab sofort laufen Rückfragen über LNA und OrgL.")
s.end(f"{ILS} „Verstanden – Ende.“\n\nNicht sofort behandelt, sondern gemeldet und geordnet, nach Kategorien gesichtet und sauber übergeben – genau das rettet beim MANV die meisten Leben.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))

# ================================================================ Fahrzeugdefekt
s = S("rd_fahrzeugdefekt", "Rettungsdienst: Defekt am RTW – Status 6",
      "Einsteiger: Nach einem Einsatz fällt die Trage aus – den richtigen Status wählen, den Ausfall über Sprechwunsch melden und später die Einsatzbereitschaft mit dem Ersatzfahrzeug zurückmelden. 2 Funk-Schritte.",
      RD, "n_defekt")
status(s, "n_defekt",
       "Nach der Übergabe im Klinikum merken Sie: Das **Fahrgestell der Trage klemmt** – sie lässt sich nicht mehr absenken. Ohne Trage können Sie keinen liegenden Patienten transportieren.\n\nWelchen Status drücken Sie?" + HINWEIS_SIE,
       "Status 6 – nicht einsatzbereit",
       [("Status 1", "Mit defekter Trage sind Sie **nicht** einsatzbereit – die Leitstelle würde Sie zum nächsten Notfall schicken."),
        ("Status 8", "Den hatten Sie bei der Ankunft – jetzt geht es um die **Einsatzbereitschaft**: **6**.")],
       "n_sprechwunsch")
s.radio("n_sprechwunsch",
        "Die Leitstelle soll wissen, **warum** und **wie lange**. Sie drücken Status 5, das Display zeigt **J**. Die Ersatztrage liegt auf der Wache, Tausch etwa **30 Minuten**.",
        "Ausfall melden",
        ["Leitstelle Nürnberg", "71/1", "Trage defekt", "nicht einsatzbereit", "Wache", "30 Minuten", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Trage defekt, Fahrzeug nicht einsatzbereit, fahren zur Wache zum Tausch, etwa 30 Minuten – kommen.",
        "Anruf . was (Trage defekt) . Folge (nicht einsatzbereit) . was Sie tun (zur Wache, Tausch) . wie lange (30 Minuten) . „kommen“",
        "n_wieder",
        "Ausfall mit Grund, Maßnahme und Dauer gemeldet.",
        "Melden Sie: Trage defekt, nicht einsatzbereit, zur Wache, etwa 30 Minuten.",
        "Mit der **Dauer** kann die Leitstelle planen, ob ein anderes Fahrzeug Ihren Bereich abdecken muss.")
s.radio("n_wieder",
        "Auf der Wache ist die Trage getauscht, der RTW ist wieder voll einsatzbereit. Die Leitstelle möchte das **auch hören**, weil sie Ihren Bereich umgeplant hatte – sie ruft Sie:\n\n"
        f"{ILS} „Rotkreuz Höchstadt 71/1 von Leitstelle Nürnberg – Frage Einsatzbereitschaft – kommen.“",
        "Einsatzbereitschaft melden",
        ["71/1", "Trage getauscht", "einsatzbereit", "Wache", "kommen"],
        "Hier Rotkreuz Höchstadt 71/1 – Trage getauscht, wieder einsatzbereit auf der Wache – kommen.",
        "„hier Rotkreuz Höchstadt 71/1“ . was erledigt ist (Trage getauscht) . „wieder einsatzbereit“ . wo (auf der Wache) . „kommen“",
        "n_status2",
        "Einsatzbereitschaft klar zurückgemeldet.",
        "Melden Sie: Trage getauscht, wieder einsatzbereit auf der Wache.",
        "Kurz und eindeutig: **was** behoben ist und **dass** Sie wieder einsatzbereit sind.")
status(s, "n_status2", f"{ILS} „Verstanden – Ende.“ Welchen Status drücken Sie jetzt?",
       "Status 2 – frei auf Wache",
       [("Status 1", "**1** heißt frei **über Funk** (unterwegs). Sie stehen auf der Wache: **2**."),
        ("Status 6", "Die **6** ist vorbei – Sie sind wieder einsatzbereit.")],
       "n_end")
s.end("Die Leitstelle sieht **Status 2** und plant Sie wieder ein.\n\nRichtiger Status, Sprechwunsch statt Dazwischenfunken und eine klare Rückmeldung.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))

# ================================================================ Bedrohung / Notruftaste
s = S("rd_bedrohung_notruf", "Rettungsdienst: Bedrohung im Einsatz – Notruftaste",
      "Mittel: Im Einsatz wird die Besatzung mit einem Messer bedroht – zurückziehen, die Notruftaste auslösen, den Notruf sprechen und die Lage nach Eintreffen der Polizei melden. 2 Funk-Schritte.",
      RD, "n_lage")
s.choice("n_lage",
         "Einsatz **hilflose Person**, Neuhaus, Gartenstraße 8. Sie sind mit Ihrer Kollegin auf **Rotkreuz Höchstadt 71/1** in der Wohnung. Ein Mann ist stark alkoholisiert, wird plötzlich **aggressiv** und greift nach einem **Küchenmesser**.\n\nWas tun Sie?" + HINWEIS_SIE,
         [("🚪 Sofort gemeinsam raus – Abstand, zum Fahrzeug zurückziehen", "n_sos"),
          ("🗣️ Ruhig auf ihn einreden und weiter versorgen", None,
           "Mit einem Messer in Reichweite geht **Eigenschutz vor**. Erst Abstand gewinnen – deeskalieren können Sie, wenn Sie sicher sind."),
          ("🤼 Ihm das Messer abnehmen", None,
           "Das ist Aufgabe der **Polizei**. Ein Zugriff bringt Sie und Ihre Kollegin in **Lebensgefahr**.")])
s._node("n_sos",
        "Sie sind draußen am Fahrzeug, der Mann steht mit dem Messer in der Haustür. **Drücken Sie jetzt die Notruftaste** Ihres Funkgeräts (mindestens drei Sekunden) – danach ist das Mikrofon offen und Ihr Ruf hat Vorrang vor allen anderen.",
        [{"id": "sos", "label": "🆘 Notruftaste drücken", "nextNodeId": "n_notruf", "key": "sos"}])
s.radio("n_notruf",
        "Der Notruf ist ausgelöst. Sprechen Sie sofort: **Notruf – wer – wo – was – was Sie brauchen.**",
        "Notruf sprechen",
        ["Notruf", "71/1", "Gartenstraße 8", "Bedrohung", "Messer", "Polizei", "kommen"],
        "Notruf – Rotkreuz Höchstadt 71/1 – Gartenstraße 8 – Bedrohung durch Mann mit Messer – sind am Fahrzeug, brauchen sofort Polizei – kommen.",
        "„Notruf“ . wer (Rotkreuz Höchstadt 71/1) . wo (Gartenstraße 8) . was (Bedrohung, Messer) . wo Sie sind (am Fahrzeug) . was Sie brauchen (Polizei) . „kommen“",
        "n_polizei",
        "Notruf knapp und vollständig – die Polizei ist alarmiert.",
        "Sprechen Sie: Notruf, wer, wo, Bedrohung mit Messer, wo Sie sind, Polizei.",
        "Im Notruf zählt: **wer – wo – was – was gebraucht wird**. Kein Satz zu viel – jede Sekunde zählt.")
s.radio("n_polizei",
        f"{ILS} „Notruf verstanden, Polizei ist unterwegs. Bleiben Sie im Fahrzeug, verriegeln Sie – kommen.“\n\n"
        "Nach vier Minuten ist die Polizei da und nimmt den Mann fest. **Niemand von Ihnen ist verletzt.** Der Mann hat eine Schnittwunde an der Hand, die Sie jetzt versorgen.\n\nMelden Sie die Lage.",
        "Lage nach Eintreffen der Polizei",
        ["Leitstelle Nürnberg", "71/1", "Polizei", "Lage", "keine Verletzten", "Einsatzkräften", "versorgen", "kommen"],
        "Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1 – Polizei vor Ort, Lage unter Kontrolle, keine Verletzten bei den Einsatzkräften, versorgen jetzt den Patienten – kommen.",
        "Anruf . Polizei vor Ort . Lage unter Kontrolle . keine Verletzten bei den Einsatzkräften . was Sie jetzt tun (Patient versorgen) . „kommen“",
        "n_end",
        "Entwarnung klar gegeben – die Leitstelle kann den Notruf schließen.",
        "Melden Sie: Polizei vor Ort, Lage unter Kontrolle, keine Verletzten bei Ihnen, Sie versorgen jetzt.",
        "Nach einem Notruf wartet die Leitstelle **dringend** auf Entwarnung: Sind die Einsatzkräfte unverletzt?")
s.end(f"{ILS} „Verstanden – gut, dass Ihnen nichts passiert ist – Ende.“\n\n"
      "Eigenschutz zuerst, Notruftaste statt Status, knapper Notruf und eine klare Entwarnung. Melden Sie den Vorfall danach auch schriftlich.\n\n**Übung abgeschlossen! 🏆**")
OUT.append(("rettungsdienst", s))
