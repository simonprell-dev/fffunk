from gen_lib import S

OUT = []
GF = "gruppenführer_a"

# ================================================================ VU: Person eingeklemmt
s = S("vu_person_eingeklemmt", "Verkehrsunfall: Person eingeklemmt",
      "Mittel: Als Gruppenführer an einem PKW-Unfall die Einsatzstelle absichern, den Brandschutz befehlen, mit begründeter Nachforderung (Notarzt, hydraulisches Rettungsgerät) an die ILS melden, vor dem Schneiden stabilisieren, die Rettungsöffnung mit dem Notarzt abstimmen und die Befreiung zurückmelden. 4 Funk-Schritte.",
      GF, "n_start")
s.choice("n_start",
         "Alarm durch die ILS: **Verkehrsunfall, PKW gegen Baum, eine Person verletzt** – Kreisstraße zwischen Neuhaus und Adelsdorf. Alarmiert sind **Florian Neuhaus 17/42/1** und ein RTW.\n\n"
         "Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1**. Ihr Löschfahrzeug führt **kein hydraulisches Rettungsgerät** mit – das hat in Ihrem Bereich der **Rüstwagen** (Alarmplan der ILS).\n\nDie Besatzung sitzt auf. Was tun Sie beim Ausrücken?",
         [("⌨️ Status 3 drücken", "n_ankunft"),
          ("📞 Leitstelle anrufen und „rücken aus mit 1/8“ melden", None,
           "Das Ausrücken wird **nicht gesprochen**, sondern mit **Status 3** (Einsatzauftrag übernommen) gesendet. Ein Sprechfunkanruf belegt die Sprechgruppe der ILS unnötig."),
          ("⌨️ Status 4 drücken", None,
           "**Status 4** heißt „Ankunft an der Einsatzstelle“. Beim Ausrücken gilt **Status 3**.")])
s.choice("n_ankunft",
         "Sie erreichen die Unfallstelle: Ein Kompaktwagen ist frontal gegen einen Straßenbaum geprallt, die Front ist stark eingedrückt, aus dem Motorraum dampft es leicht. Es herrscht Verkehr in beiden Richtungen.\n\nWie gehen Sie vor?",
         [("⌨️ Status 4 drücken. LF auf der Seite des anfahrenden Verkehrs mit Abstand schräg als Schutz vor die Unfallstelle stellen (Blaulicht, Warnblinker, Umfeldbeleuchtung), Arbeitsraum um den PKW frei lassen, Verkehr mit Warndreieck/Leitkegeln warnen – alle in Warnkleidung", "n_befehl"),
          ("🚒 Direkt neben dem Unfall-PKW halten – kurze Wege für die Geräte", None,
           "Dann blockiert das LF den **Arbeitsraum** rund um den PKW, den Sie für Geräteablage, Rettungsdienst und Rettungsöffnung brauchen – und schützt niemanden vor dem fließenden Verkehr. Das Fahrzeug steht mit **Abstand** und schräg als **Schutz** vor der Einsatzstelle."),
          ("📞 Erst die Lagemeldung absetzen, dann aussteigen und absichern", None,
           "Zuerst **Status 4** und **Eigenschutz/Absicherung** – eine ungesicherte Einsatzstelle auf der Straße gefährdet Ihre Mannschaft. Die Lagemeldung folgt nach der **Erkundung**, wenn Sie wissen, was los ist.")])
s.radio("n_befehl",
        "Erkundung: Der Fahrer (etwa 40 Jahre) ist **ansprechbar** und klagt über starke Schmerzen in den Beinen. Seine Beine sind im eingedrückten Fußraum **eingeklemmt**, die Fahrertür klemmt. Kein Feuer, aber unter dem Motorraum tropft Flüssigkeit. Der **Angriffstrupp** hat über das Seitenfenster Kontakt zum Fahrer aufgenommen und betreut ihn (Erstversorgung, Kopf stabilisieren).\n\n"
        "Der **Wassertrupp** steht am Heck des LF. Geben Sie ihm über Funk den Befehl, den **Brandschutz** sicherzustellen.",
        "Befehl an den Wassertrupp",
        ["Wassertrupp", "Gruppenführer", "Brandschutz", "Pulverlöscher", "Schnellangriff", "Unfallfahrzeug", "kommen"],
        "Wassertrupp von Gruppenführer – Wassertrupp zur Sicherstellung des Brandschutzes mit Pulverlöscher und Schnellangriff zum Unfallfahrzeug, Stellung seitlich an der Fahrzeugfront außerhalb des Arbeitsraums – kommen.",
        "Anruf: Wassertrupp von Gruppenführer . Einheit (Wassertrupp) . Auftrag (Brandschutz sicherstellen) . Mittel (Pulverlöscher, Schnellangriff) . Ziel (Unfallfahrzeug) . Weg/Stellung (seitlich an der Front, außerhalb des Arbeitsraums) . „kommen“",
        "n_lage",
        "Brandschutz befohlen – mit Einheit, Auftrag, Mittel und Ziel.",
        "Befehlen Sie: Wassertrupp, Brandschutz sicherstellen, mit Pulverlöscher und Schnellangriff, zum Unfallfahrzeug.",
        "Bei jedem Verkehrsunfall mit eingeklemmter Person wird der **Brandschutz sichergestellt**, bevor mit Rettungsgerät gearbeitet wird – auslaufende Betriebsstoffe und heiße Motorteile können sich entzünden. Befehl nach FwDV 3: **Einheit – Auftrag – Mittel – Ziel – Weg**.")
s.radio("n_lage",
        "Der Wassertrupp hat den Brandschutz übernommen. Sie drücken **Status 5**.\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie die **Lagemeldung** ab: Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung. Denken Sie an die Lücken: Ein **Notarzt** ist bisher nicht alarmiert, und Ihr LF hat **kein hydraulisches Rettungsgerät**.",
        "Lagemeldung mit Nachforderung",
        ["Florian Neuhaus", "Kreisstraße", "eingeklemmt", "ansprechbar", "Brandschutz", "Notarzt", "Rettungsgerät", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Lagemeldung: Kreisstraße zwischen Neuhaus und Adelsdorf, PKW gegen Baum. Eine Person im Fahrzeug eingeklemmt, ansprechbar. Einsatzstelle abgesichert, Brandschutz sichergestellt, Erstversorgung läuft. Nachforderung: Notarzt und hydraulisches Rettungsgerät, Rüstwagen nach Alarmplan – kommen.",
        "Eigener Rufname + „Lagemeldung“ . WO: Kreisstraße zwischen Neuhaus und Adelsdorf . WAS: PKW gegen Baum . MENSCHENLEBEN: eine Person eingeklemmt, ansprechbar . MASSNAHMEN: abgesichert, Brandschutz, Erstversorgung . NACHFORDERUNG: Notarzt + hydraulisches Rettungsgerät (Rüstwagen nach Alarmplan) . „kommen“",
        "n_stabil",
        "Lagemeldung vollständig – die Nachforderung ist konkret und begründet.",
        "Melden Sie Ort, Unfallart, eingeklemmte ansprechbare Person, Ihre Maßnahmen und fordern Sie Notarzt und hydraulisches Rettungsgerät nach.",
        "Bei einer **eingeklemmten Person** gehört die Nachforderung **sofort** in die erste Lagemeldung: Die Befreiung ist ohne hydraulisches Rettungsgerät nicht möglich, und eine technische Rettung wird in aller Regel **notärztlich begleitet**. Nennen Sie **was** und **wofür** – die ILS alarmiert dann nach ihrem Alarmplan (z. B. Rüstwagen, HLF der Nachbarwehr).")
s.choice("n_stabil",
         "**Leitstelle:** „Hier Leitstelle – verstanden. Notarzt und Rüstwagen sind alarmiert, Polizei ist verständigt – Ende.“\n\n"
         "Der Rüstwagen trifft ein, kurz danach der RTW. Die Rüstwagenbesatzung baut das Rettungsgerät auf.\n\nWas muss passieren, **bevor** gespreizt oder geschnitten wird?",
         [("🔧 Fahrzeug stabilisieren (unterbauen, Keile/Stützen), Zündung aus und Schlüssel aus dem Nahbereich, Antriebsart prüfen (Rettungsdatenblatt), Glasmanagement, Abstand zu nicht ausgelösten Airbags", "n_oeffnung"),
          ("✂️ Sofort die Fahrertür aufspreizen – der Patient hat Schmerzen", None,
           "Ohne **Stabilisierung** bewegt sich das Fahrzeug beim Spreizen und Schneiden – das belastet die Wirbelsäule des Patienten und gefährdet die Retter. Erst stabilisieren, dann Gerät einsetzen. Die Schmerzbehandlung übernimmt der Rettungsdienst."),
          ("🔋 Batterie abklemmen – dann sind alle Airbags sicher", None,
           "Ein Trugschluss: Airbags können auch **nach dem Abklemmen noch eine gewisse Zeit auslösen** (Energiereserve im Steuergerät). Deshalb gilt immer: nicht im Entfaltungsbereich nicht ausgelöster Airbags arbeiten (gängige Faustregel **30 / 60 / 90 cm** für Seiten-, Fahrer-, Beifahrerairbag), nicht in Gasgeneratoren schneiden. Die Batterie wird nur abgeklemmt, wenn sie gut erreichbar ist – vorher ggf. elektrische Sitz- oder Fensterverstellung nutzen. Bei Hybrid- oder Elektrofahrzeugen nach **Rettungsdatenblatt** vorgehen.")])
s.choice("n_oeffnung",
         "Das Fahrzeug ist stabilisiert, die Scheiben sind kontrolliert entfernt. Der **Notarzt** ist eingetroffen und hat den Fahrer durch das Seitenfenster untersucht.\n\nWie legen Sie die **Rettungsöffnung** fest?",
         [("🩺 Gemeinsam mit dem Notarzt: Zustand und Dringlichkeit des Patienten bestimmen, ob schonend oder zeitkritisch gerettet wird – danach wird die Rettungsöffnung festgelegt", "n_innen"),
          ("✂️ Dach abnehmen – das ist immer der Standard", None,
           "Es gibt **keine Standardöffnung**. Welche Öffnung richtig ist, hängt vom **Zustand des Patienten**, von der Einklemmung und vom Fahrzeug ab – und wird mit dem **Notarzt** abgestimmt. Manchmal reicht eine große Seitenöffnung, manchmal ist das Dach der beste Weg."),
          ("🚪 Den Fahrer selbst aussteigen lassen, er ist ja ansprechbar", None,
           "**Ansprechbar heißt nicht unverletzt.** Der Fahrer ist eingeklemmt und hat Beinverletzungen, eine Wirbelsäulenverletzung ist nicht ausgeschlossen. Die Rettung erfolgt **patientengerecht** – abgestimmt mit dem Notarzt.")])
s.radio("n_innen",
        "**Notarzt:** „Patient ist kreislaufstabil, Verdacht auf Oberschenkelbruch. Wir retten schonend – große Seitenöffnung auf der Fahrerseite, dann über das Rettungsbrett.“\n\n"
        "Die Rüstwagenbesatzung entfernt Fahrertür und B-Säule. Ihr **Angriffstrupp** betreut den Fahrer weiter von innen. Weil das Aggregat laut ist, informieren Sie ihn über das Handfunkgerät.",
        "Angriffstrupp informieren",
        ["Angriffstrupp", "Gruppenführer", "Fahrerseite", "B-Säule", "Schutzdecke", "Kopf", "kommen"],
        "Angriffstrupp von Gruppenführer – Rettungsöffnung Fahrerseite, Tür und B-Säule werden entfernt. Patient mit Schutzdecke abdecken, Kopf weiter stabilisieren, Patienten über jeden Arbeitsschritt informieren – kommen.",
        "Anruf: Angriffstrupp von Gruppenführer . geplante Rettungsöffnung (Fahrerseite, Tür und B-Säule) . Auftrag: Patient mit Schutzdecke abdecken, Kopf stabilisieren, Patienten informieren . „kommen“",
        "n_meldung",
        "Innere Betreuung informiert – der Patient ist beim Schneiden geschützt.",
        "Sagen Sie dem Angriffstrupp, welche Öffnung geschaffen wird, und dass er den Patienten mit der Schutzdecke abdeckt und den Kopf stabilisiert.",
        "Die **innere Betreuung** muss wissen, wo geschnitten wird: Sie schützt den Patienten mit einer **Schutzdecke** vor Splittern und Kanten, hält den **Kopf** stabil und **erklärt** dem Patienten jeden Schritt – das nimmt Angst und verhindert Bewegungen.")
s.radio("n_meldung",
        "Nach etwa 25 Minuten ist der Fahrer schonend über die Seitenöffnung auf dem Rettungsbrett befreit und an Notarzt und Rettungsdienst übergeben. Er wird mit dem RTW abtransportiert. Die Polizei nimmt den Unfall auf.\n\n"
        "Sie drücken **Status 5**.\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – kommen.“\n\nGeben Sie die **Folgemeldung** ab.",
        "Folgemeldung sprechen",
        ["Florian Neuhaus", "Folgemeldung", "Person befreit", "Rettungsdienst", "übergeben", "keine weitere Nachforderung", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Folgemeldung Kreisstraße: Person befreit und an den Rettungsdienst übergeben. Polizei vor Ort, Brandschutz bleibt bis zur Bergung des Fahrzeugs. Keine weitere Nachforderung – kommen.",
        "Eigener Rufname + „Folgemeldung“ . Ergebnis: Person befreit und an den Rettungsdienst übergeben . Lage: Polizei vor Ort, Brandschutz bis zur Bergung . „keine weitere Nachforderung“ . „kommen“",
        "n_end",
        "Folgemeldung klar und vollständig.",
        "Melden Sie: Person befreit, an den Rettungsdienst übergeben, was noch läuft und dass keine weitere Nachforderung besteht.",
        "Die **Folgemeldung** sagt der ILS, dass die Menschenrettung abgeschlossen ist – damit kann sie z. B. weitere Kräfte freigeben. Auch „keine weitere Nachforderung“ wird ausdrücklich gesagt.")
s.end("**Leitstelle:** „Hier Leitstelle – verstanden – Ende.“\n\n"
      "Sauber geführt: Status per Taste, Einsatzstelle abgesichert, Brandschutz befohlen, Notarzt und Rettungsgerät sofort begründet nachgefordert, erst stabilisiert, Rettungsöffnung mit dem Notarzt abgestimmt und die Befreiung zurückgemeldet.\n\n"
      "> **Merke:** Bei eingeklemmten Personen gilt: **Sicherheit – Stabilisieren – Zugang – Befreien** – und die Rettung richtet sich nach dem **Patienten**, nicht nach dem Werkzeug.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("thl", s))

# ================================================================ BMA: Täuschungsalarm
s = S("bma_taeuschungsalarm", "Brandmeldeanlage: Erkundung und Täuschungsalarm",
      "Einsteiger: Einen Alarm der Brandmeldeanlage richtig abarbeiten – Feuerwehr-Anlaufstelle mit FAT/FBF und Schlüsseldepot, Erkundung mit Laufkarte und Atemschutzbereitschaft, Ursache quittieren, Anlage geordnet an den Betreiber übergeben und den Täuschungsalarm an die ILS melden. 3 Funk-Schritte.",
      GF, "n_anfahrt")
s.choice("n_anfahrt",
         "Alarm durch die ILS: **Brandmeldeanlage** – Druckerei, Industriestraße 7, Gewerbegebiet Neuhaus. Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1**, **Status 3** ist gedrückt.\n\n"
         "> Eine **Brandmeldeanlage (BMA)** meldet über eine Übertragungseinrichtung automatisch an die ILS. Jeder BMA-Alarm wird behandelt wie ein Brand – bis die Erkundung etwas anderes zeigt.\n\nWohin fahren Sie?",
         [("🚨 Zur **Feuerwehr-Anlaufstelle** (gekennzeichnet durch die **Blitzleuchte**) – dort sind Feuerwehr-Schlüsseldepot (FSD), Feuerwehr-Anzeigetableau (FAT) und Feuerwehr-Bedienfeld (FBF). Status 4 drücken.", "n_fat"),
          ("🏭 Zur Hallenseite, auf der es vermutlich brennt", None,
           "Sie wissen noch nicht, **welcher Melder** ausgelöst hat. Das zeigt Ihnen das **FAT an der Feuerwehr-Anlaufstelle** – dort liegen auch Schlüssel und Laufkarten. Ohne diese Informationen suchen Sie im Gebäude herum."),
          ("🅿️ Am Werkstor warten, bis der Betreiber kommt", None,
           "Für genau diesen Fall gibt es das **Feuerwehr-Schlüsseldepot**: Die Feuerwehr kommt ohne den Betreiber ins Gebäude. Warten kostet Zeit, die bei einem echten Brand fehlt.")])
s.choice("n_fat",
         "An der Anlaufstelle blinkt die Blitzleuchte, das FSD ist entriegelt. Das **FAT** zeigt: **Meldergruppe 14, Melder 3 – Papierlager, 1. Obergeschoss**.\n\nWas tun Sie?",
         [("🗝️ Objektschlüssel aus dem FSD und die **Laufkarte** der Meldergruppe 14 entnehmen, Anlage **nicht** zurückstellen, Erkundung zum Melder einleiten", "n_trupp"),
          ("🔄 Am FBF sofort „BMZ rückstellen“ drücken – ist meistens sowieso nichts", None,
           "**Nie vor der Erkundung zurückstellen!** Damit löschen Sie die Anzeige, welcher Melder ausgelöst hat – und bei einem echten Brand verlieren Sie Zeit und Informationen. Zurückgestellt wird erst, wenn die Ursache geklärt ist."),
          ("🗺️ Ohne Laufkarte los – das Gebäude ist ja übersichtlich", None,
           "Die **Laufkarte** zeigt den Weg von der Anlaufstelle zum ausgelösten Melder und wo genau er sitzt – auch versteckte Melder in Zwischendecken oder Doppelböden. Ohne Laufkarte sucht der Trupp im Zweifel lange.")])
s.choice("n_trupp",
         "Sie haben Schlüssel und Laufkarte. Wen schicken Sie wie zur Erkundung?",
         [("🧯 Den **Angriffstrupp** mit angelegtem Atemschutzgerät (Maske griffbereit), Feuerlöscher, Wärmebildkamera, Handfunkgerät, Laufkarte und Schlüssel – der Wassertrupp rüstet sich als Sicherheitstrupp aus, der Maschinist bereitet die Wasserversorgung vor", "n_befehl"),
          ("🚶 Einen einzelnen Feuerwehrmann ohne Atemschutz – geht schneller", None,
           "Erkundet wird **nie allein**, sondern als **Trupp**. Und weil es tatsächlich brennen kann, geht der Trupp in **Atemschutzbereitschaft** – sonst muss er bei Rauch umkehren und es geht wertvolle Zeit verloren."),
          ("🧑‍🔧 Den Mitarbeiter der Druckerei allein nachsehen lassen", None,
           "Die Erkundung ist **Aufgabe der Feuerwehr**. Ortskundige Mitarbeiter sind als Auskunft wertvoll, aber Sie schicken sie nicht allein in einen möglicherweise verrauchten Bereich.")])
s.radio("n_befehl",
        "Geben Sie dem Angriffstrupp über Funk den Befehl zur Erkundung. Laut Laufkarte führt der Weg über das **Treppenhaus Ost**.",
        "Befehl zur Erkundung",
        ["Angriffstrupp", "Gruppenführer", "Erkundung", "Laufkarte", "Meldergruppe", "Obergeschoss", "Treppenhaus", "kommen"],
        "Angriffstrupp von Gruppenführer – Angriffstrupp zur Erkundung mit Laufkarte Meldergruppe 14, Atemschutz angelegt, mit Feuerlöscher und Wärmebildkamera zum Melder im Papierlager, erstes Obergeschoss, über das Treppenhaus Ost – kommen.",
        "Anruf: Angriffstrupp von Gruppenführer . Einheit (Angriffstrupp) . Auftrag (Erkundung, Laufkarte Meldergruppe 14) . Mittel (Atemschutz angelegt, Feuerlöscher, Wärmebildkamera) . Ziel (Melder im Papierlager, 1. OG) . Weg (Treppenhaus Ost) . „kommen“",
        "n_ursache",
        "Erkundungsbefehl vollständig – der Trupp weiß, wohin und womit.",
        "Befehlen Sie: Angriffstrupp, Erkundung mit Laufkarte, Atemschutz, Ziel Papierlager 1. Obergeschoss, Weg Treppenhaus Ost.",
        "Auch der Erkundungsbefehl folgt FwDV 3: **Einheit – Auftrag – Mittel – Ziel – Weg**. Ziel und Weg stehen auf der **Laufkarte**.")
s.radio("n_ursache",
        "**Angriffstrupp:** „Hier Angriffstrupp – verstanden – Ende.“\n\nWenige Minuten später:\n\n"
        "**Angriffstrupp:** „Gruppenführer von Angriffstrupp – am Melder im Papierlager: kein Feuer, kein Rauch, Wärmebildkamera ohne Befund. Im Raum liegt viel Staub, Handwerker haben mit einem Trennschleifer einen Wanddurchbruch gemacht – kommen.“\n\n"
        "Quittieren Sie und geben Sie den nächsten Auftrag: **angrenzende Räume kontrollieren**, dann mit dem Vorarbeiter zur Anlaufstelle.",
        "Ursache quittieren",
        ["Gruppenführer", "verstanden", "kein Feuer", "Staub", "angrenzende Räume", "kontrollieren", "kommen"],
        "Hier Gruppenführer – verstanden: kein Feuer, Auslösung durch Staub von Bauarbeiten. Angriffstrupp: angrenzende Räume kontrollieren, dann mit dem Vorarbeiter zur Anlaufstelle – kommen.",
        "„hier Gruppenführer“ . „verstanden“ + Kern wiederholen (kein Feuer, Staub von Bauarbeiten) . neuer Auftrag: angrenzende Räume kontrollieren, dann mit dem Vorarbeiter zur Anlaufstelle . „kommen“",
        "n_rueck",
        "Ursache quittiert und Nachkontrolle befohlen.",
        "Quittieren Sie „kein Feuer, Staub“ und befehlen Sie die Kontrolle der angrenzenden Räume.",
        "Eine plausible Ursache ist gut – aber **kontrollieren Sie auch die Umgebung**: Ein Trennschleifer erzeugt Funken, ein Glimmbrand im Nachbarraum oder in einer Zwischendecke ist möglich.")
s.choice("n_rueck",
         "Der Angriffstrupp meldet: angrenzende Räume ohne Befund. Der **Betreiber** (Haustechniker der Druckerei) ist eingetroffen.\n\nWie schließen Sie ab?",
         [("📋 Ursache mit dem Betreiber besprechen, Anlage nach örtlicher Regelung zurückstellen und prüfen, dass sie in Ruhe bleibt, Schlüssel zurück ins FSD und verschließen, Einsatzstelle an den Betreiber übergeben – Staubarbeiten künftig nur nach Absprache mit ihm", "n_ils"),
          ("🧻 Den Melder mit einer Tüte abkleben, damit er nicht noch einmal auslöst", None,
           "Eingriffe in die Anlage oder Abschaltungen sind **Sache des Betreibers** (mit seiner Fachfirma) und nur mit **Ersatzmaßnahmen**, z. B. einer Brandwache. Die Feuerwehr macht einen Bereich nicht eigenmächtig „blind“."),
          ("🚒 Einfach abrücken – der Betreiber stellt die Anlage schon zurück", None,
           "Solange die Anlage nicht zurückgestellt ist, kann in der Regel **kein neuer Alarm** an die ILS übertragen werden – das Objekt wäre ungeschützt. Außerdem gehört der Schlüssel zurück ins FSD und die Einsatzstelle wird **ausdrücklich übergeben**. Wer genau zurückstellt, regelt Ihre örtliche Vorgabe.")])
s.radio("n_ils",
        "> **Täuschungsalarm oder Fehlalarm?** „Fehlalarm“ wird oft als **Oberbegriff** für jeden Alarm ohne Schadenfeuer benutzt. Ein **Täuschungsalarm** liegt vor, wenn ein Melder auf eine **brandähnliche Kenngröße** reagiert hat – Staub, Wasserdampf, Abgase. Die Anlage hat also funktioniert, wurde aber „getäuscht“. Davon unterscheidet man z. B. einen **technischen Defekt** oder eine **böswillige Auslösung**. Welche Begriffe Ihre ILS in der Rückmeldung erwartet, regelt sie selbst.\n\n"
        "Sie drücken **Status 5**.\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – kommen.“\n\nGeben Sie die **Rückmeldung** ab.",
        "Rückmeldung an die ILS",
        ["Florian Neuhaus", "Brandmeldeanlage", "Täuschungsalarm", "kein Feuer", "Betreiber", "übergeben", "geräumt", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Rückmeldung Brandmeldeanlage Druckerei Industriestraße 7: Täuschungsalarm durch Staub von Bauarbeiten, kein Feuer. Anlage zurückgestellt und an den Betreiber übergeben. Einsatzstelle wird geräumt – kommen.",
        "Eigener Rufname + „Rückmeldung“ . Objekt (BMA Druckerei, Industriestraße 7) . Ergebnis: Täuschungsalarm durch Staub von Bauarbeiten, kein Feuer . Anlage zurückgestellt und an den Betreiber übergeben . „Einsatzstelle wird geräumt“ . „kommen“",
        "n_end",
        "Rückmeldung klar: Ursache, kein Feuer, Übergabe, Einsatzende.",
        "Melden Sie: Täuschungsalarm mit Ursache, kein Feuer, Anlage an den Betreiber übergeben, Einsatzstelle wird geräumt.",
        "Die ILS braucht: **Objekt**, **Ergebnis mit Ursache** (Täuschungsalarm durch Staub, kein Feuer), **Übergabe an den Betreiber** und dass Sie die **Einsatzstelle räumen**. Danach folgt auf der Rückfahrt **Status 1**.")
s.end("**Leitstelle:** „Hier Leitstelle – verstanden, Täuschungsalarm – Ende.“\n\n"
      "Sie drücken **Status 1** und rücken ein. Feuerwehr-Anlaufstelle angefahren, Laufkarte genutzt, mit Atemschutzbereitschaft erkundet, erst nach Klärung zurückgestellt und geordnet übergeben.\n\n"
      "> **Merke:** Jeder BMA-Alarm ist ein Brand, bis die Erkundung das Gegenteil zeigt. **Erst erkunden – dann zurückstellen – dann übergeben.**\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("brand", s))

# ================================================================ Gefahrgut: Warntafel
s = S("gefahrgut_un_nummer", "Gefahrgut: Warntafel richtig durchgeben",
      "Mittel: An einem verunfallten Tank-LKW nach der GAMS-Regel vorgehen – mit dem Wind anfahren, Warntafel aus sicherer Entfernung ablesen, Menschen aus dem Gefahrenbereich holen, absperren, Brandschutz befehlen und die Nummern Ziffer für Ziffer an die ILS melden und kontrollieren. 4 Funk-Schritte.",
      GF, "n_anfahrt")
s.choice("n_anfahrt",
         "Alarm durch die ILS: **Verkehrsunfall mit LKW, Flüssigkeit läuft aus** – Kreisstraße nördlich von Neuhaus. Sie sind Gruppenführer auf **Florian Neuhaus 17/42/1**, **Status 3** ist gedrückt.\n\n"
         "Die Kreisstraße verläuft von **West nach Ost**. Die Fahnen am Ortsrand zeigen: **Wind schwach aus West**. Sie können von Osten (kürzester Weg) oder über die Umgehung von Westen anfahren.\n\nWie fahren Sie an?",
         [("🌬️ Von **Westen** anfahren – **Wind im Rücken** –, mit großem Abstand anhalten, nicht in Senken, Status 4 drücken", "n_gams"),
          ("➡️ Von **Osten** – das ist der kürzeste Weg", None,
           "Von Osten fahren Sie **gegen den Wind** – also direkt in mögliche Dämpfe hinein. Der laufende Motor kann zudem eine **Zündquelle** sein. Bei Gefahrgut immer **mit dem Wind im Rücken** anfahren, auch wenn der Weg länger ist."),
          ("🚒 Egal woher – Hauptsache direkt bis an den LKW", None,
           "Direkt am LKW stehen Sie mitten im **Gefahrenbereich**: Dämpfe, Zündgefahr, Kontamination von Mannschaft und Fahrzeug. Halten Sie **großen Abstand** und erkunden Sie zuerst aus der Ferne.")])
s.choice("n_gams",
         "Sie halten etwa **150 m westlich** des LKW. Zu sehen: ein **Tank-LKW** im Straßengraben, eine Lache auf der Fahrbahn.\n\n"
         "> **GAMS-Regel** für die Erstmaßnahmen bei Gefahrgut: **G**efahr erkennen – **A**bsperren – **M**enschenrettung durchführen – **S**pezialkräfte alarmieren.\n\nWas tun Sie zuerst?",
         [("🔭 **Gefahr erkennen**: mit dem Fernglas aus sicherer Entfernung Warntafel, Gefahrzettel, Austritt und Personen erkunden", "n_mensch"),
          ("🏃 Zum LKW laufen und die Warntafel aus der Nähe lesen", None,
           "Solange Sie den Stoff nicht kennen, gehen Sie **nicht** in den Gefahrenbereich – auch nicht „nur kurz“. Die Warntafel lässt sich mit dem **Fernglas** aus sicherer Entfernung lesen."),
          ("💦 Die Lache sofort mit Wasser wegspülen", None,
           "Wegspülen **verteilt** den Stoff – in Graben, Kanal oder Gewässer. Manche Stoffe reagieren sogar gefährlich mit Wasser. Erst den **Stoff bestimmen**, dann Maßnahmen festlegen.")])
s.choice("n_mensch",
         "Durch das Fernglas lesen Sie die **orangefarbene Warntafel**: oben **33**, unten **1170**. Daneben ein Gefahrzettel mit **Flamme** (Klasse 3 – entzündbare Flüssigkeit). Aus einem Riss am Tank läuft Flüssigkeit.\n\n"
         "> **Warntafel lesen:** Oben steht die **Nummer zur Kennzeichnung der Gefahr** (z. B. **33** = leicht entzündbarer flüssiger Stoff), unten die **UN-Nummer** des Stoffes (z. B. **1170** = Ethanol, **1203** = Benzin). Die Bedeutung schlagen Sie nach (z. B. ERI-Cards, Gefahrgut-App, Nachschlagewerk im Fahrzeug).\n\n"
         "Der **Fahrer** steht etwa 10 m neben dem LKW und hält sich den Arm. Wie holen Sie ihn aus dem Gefahrenbereich?",
         [("📢 Mit Lautsprecher bzw. Zurufen und Handzeichen zu sich holen – er kommt auf der windzugewandten Seite (von Westen) heraus, bleibt bis zur Sichtung durch den Rettungsdienst bei Ihnen außerhalb der Absperrung", "n_absperren"),
          ("🏃 Ein Trupp ohne Schutzausrüstung läuft hin und holt ihn", None,
           "Der Fahrer **kann gehen** – dann rufen Sie ihn heraus, statt eigene Kräfte ungeschützt in den Gefahrenbereich zu schicken. Kann eine Person nicht selbst heraus, erfolgt die Rettung mit **geeigneter Schutzausrüstung** (mindestens Atemschutz) und so kurz wie möglich."),
          ("⏳ Warten, bis die Spezialkräfte da sind", None,
           "**Menschenrettung** hat Vorrang und kann hier ohne Risiko erfolgen: Der Fahrer geht selbst heraus. Die GAMS-Regel ist keine starre Reihenfolge – Absperren und Menschenrettung laufen oft gleichzeitig.")])
s.radio("n_absperren",
        "Der Fahrer steht bei Ihnen, er hat sich beim Unfall den Arm geprellt.\n\n"
        "Geben Sie dem **Schlauchtrupp** den Befehl zur Absperrung. Gängiger Faustwert für die Erstmaßnahmen (vgl. FwDV 500): **Gefahrenbereich zunächst mindestens 50 m** um die Austrittsstelle, die **Absperrung** deutlich weiter, häufig **100 m** – bei unklarer Lage, Gas oder Brand mehr.",
        "Befehl zur Absperrung",
        ["Schlauchtrupp", "Gruppenführer", "Absperrung", "Gefahrenbereich", "Zündquellen", "kommen"],
        "Schlauchtrupp von Gruppenführer – Schlauchtrupp zur Absperrung: Gefahrenbereich 50 Meter um den LKW, Absperrung 100 Meter auf der Kreisstraße in beide Richtungen, Verkehr anhalten, Zündquellen fernhalten, nicht in den Gefahrenbereich gehen – kommen.",
        "Anruf: Schlauchtrupp von Gruppenführer . Auftrag: Absperrung . Gefahrenbereich (50 m) und Absperrung (100 m, beide Richtungen) . Verkehr anhalten, Zündquellen fernhalten . nicht in den Gefahrenbereich . „kommen“",
        "n_brandschutz",
        "Absperrung mit klaren Grenzen befohlen.",
        "Befehlen Sie: Absperrung, Grenzen von Gefahrenbereich und Absperrung, Zündquellen fernhalten.",
        "Bei einer entzündbaren Flüssigkeit ist jede **Zündquelle** gefährlich: Motoren, Zigaretten, Funken. Die Absperrung hält Unbeteiligte und Verkehr fern. Der **Gefahrenbereich** wird nur mit geeigneter Schutzausrüstung und auf Befehl betreten.")
s.radio("n_brandschutz",
        "**Schlauchtrupp:** „Hier Schlauchtrupp – verstanden – Ende.“\n\n"
        "Nun zum **Brandschutz**. Stoff 1170 ist **Ethanol** – mit Wasser mischbar. Herkömmlicher Schaum wird von solchen Stoffen zerstört; nötig ist **alkoholbeständiges Schaummittel**. Befehlen Sie dem **Wassertrupp**, den Brandschutz außerhalb des Gefahrenbereichs vorzubereiten.",
        "Befehl Brandschutz",
        ["Wassertrupp", "Gruppenführer", "Brandschutz", "Schaum", "außerhalb", "Wind im Rücken", "kommen"],
        "Wassertrupp von Gruppenführer – Wassertrupp zur Sicherstellung des Brandschutzes mit Pulverlöscher und Schaumrohr, alkoholbeständiges Schaummittel, Stellung westlich außerhalb des Gefahrenbereichs mit dem Wind im Rücken – kommen.",
        "Anruf: Wassertrupp von Gruppenführer . Auftrag: Brandschutz sicherstellen . Mittel: Pulverlöscher, Schaumrohr, alkoholbeständiges Schaummittel . Stellung: westlich, außerhalb des Gefahrenbereichs, Wind im Rücken . „kommen“",
        "n_lage",
        "Brandschutz befohlen – mit dem richtigen Löschmittel und sicherer Stellung.",
        "Befehlen Sie: Wassertrupp, Brandschutz, Schaum, außerhalb des Gefahrenbereichs mit dem Wind im Rücken.",
        "Der Brandschutz wird **außerhalb des Gefahrenbereichs** und **mit dem Wind im Rücken** bereitgestellt – nicht in der Lache. Bei wassermischbaren Flüssigkeiten wie Ethanol braucht es **alkoholbeständiges Schaummittel** (AR). Führt Ihr Fahrzeug keins mit, gehört das in die Nachforderung.")
s.radio("n_lage",
        "**Wassertrupp:** „Hier Wassertrupp – verstanden – Ende.“\n\nSie drücken **Status 5**.\n\n**Leitstelle:** „Florian Neuhaus 17/42/1 von Leitstelle – kommen.“\n\n"
        "Geben Sie die **Lagemeldung** ab. Die Nummern der Warntafel sprechen Sie **Ziffer für Ziffer** – erst die obere, dann die untere Zahl. Dazu: Wind, Absperrung und Nachforderung von Gefahrgut-/ABC-Kräften **nach Alarmplan Ihrer ILS**.",
        "Lagemeldung Gefahrgut",
        ["Florian Neuhaus", "Warntafel", "drei drei", "eins eins sieben null", "Wind aus West", "Absperrung", "Nachforderung", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – Lagemeldung: Kreisstraße nördlich Neuhaus, Tank-LKW verunfallt, Flüssigkeit läuft aus. Warntafel: Nummer zur Kennzeichnung der Gefahr drei – drei, UN-Nummer eins – eins – sieben – null. Fahrer aus dem Gefahrenbereich, leicht verletzt. Wind schwach aus West, Absperrung 100 Meter, Brandschutz sichergestellt. Nachforderung: Gefahrgutkräfte nach Alarmplan, Rettungsdienst und Polizei – kommen.",
        "Eigener Rufname + „Lagemeldung“ . WO: Kreisstraße nördlich Neuhaus . WAS: Tank-LKW, Flüssigkeit läuft aus . Warntafel Ziffer für Ziffer: oben drei – drei, unten eins – eins – sieben – null . MENSCHEN: Fahrer aus dem Gefahrenbereich, leicht verletzt . MASSNAHMEN: Wind aus West, Absperrung 100 m, Brandschutz . NACHFORDERUNG: Gefahrgutkräfte nach Alarmplan, Rettungsdienst, Polizei . „kommen“",
        "n_korr",
        "Lagemeldung mit Warntafel in Ziffern, Wind, Absperrung und Nachforderung.",
        "Melden Sie Ort, Lage, Warntafel Ziffer für Ziffer (drei – drei / eins – eins – sieben – null), Personen, Wind, Absperrung und Nachforderung.",
        "Zahlen werden im Funk **einzeln** gesprochen – „eins – eins – sieben – null“, nicht „elfhundertsiebzig“. Bei Gefahrgut ist das lebenswichtig: **Eine falsche Ziffer ist ein anderer Stoff.** Wind und Absperrung braucht die ILS, um Spezialkräfte richtig anfahren zu lassen und ggf. die Bevölkerung zu warnen.")
s.choice("n_korr",
         "**Leitstelle:** „Hier Leitstelle – verstanden. Ich wiederhole: Warntafel drei – drei, UN-Nummer eins – eins – sieben – **eins**, Wind aus West, Absperrung 100 Meter. Gefahrgutkräfte, Rettungsdienst und Polizei werden alarmiert – kommen.“\n\nWas tun Sie?",
         [("☝️ Sofort korrigieren und die UN-Nummer noch einmal Ziffer für Ziffer durchgeben", "n_korrektur"),
          ("👍 „Verstanden – Ende“ – eine Ziffer ist nicht so wichtig", None,
           "Eine andere UN-Nummer bezeichnet einen **anderen Stoff** – mit anderen Gefahren, anderer Schutzausrüstung und anderen Löschmitteln. Die Wiederholung der ILS ist genau dafür da, solche Fehler zu finden. Korrigieren Sie **sofort**."),
          ("⏳ Nichts sagen – die Spezialkräfte lesen die Tafel ohnehin selbst ab", None,
           "Bis dahin plant die ILS mit dem **falschen Stoff**, und die anrückenden Kräfte bereiten sich falsch vor. Ein Fehler in der Wiederholung wird **sofort** richtiggestellt.")])
s.radio("n_korrektur",
        "Geben Sie die UN-Nummer erneut durch – mit **„ich wiederhole“** und Ziffer für Ziffer.",
        "UN-Nummer richtigstellen",
        ["Florian Neuhaus", "ich wiederhole", "UN-Nummer", "eins eins sieben null", "kommen"],
        "Hier Florian Neuhaus 17/42/1 – ich wiederhole: UN-Nummer eins – eins – sieben – null. Nummer zur Kennzeichnung der Gefahr drei – drei – kommen.",
        "„hier“ + Rufname . „ich wiederhole“ . UN-Nummer Ziffer für Ziffer: eins – eins – sieben – null . zur Sicherheit auch die obere Zahl: drei – drei . „kommen“",
        "n_end",
        "UN-Nummer klar richtiggestellt.",
        "Sagen Sie „ich wiederhole“ und geben Sie die UN-Nummer Ziffer für Ziffer durch: eins – eins – sieben – null.",
        "Mit **„ich wiederhole“** geben Sie Ihre eigene Nachricht noch einmal durch. Sprechen Sie langsam und **Ziffer für Ziffer** – „null“ am Ende ist deutlich von „eins“ zu unterscheiden.")
s.end("**Leitstelle:** „Hier Leitstelle – verstanden: UN-Nummer eins – eins – sieben – null, Ethanol. Gefahrgutkräfte nach Alarmplan, Rettungsdienst und Polizei sind alarmiert – Ende.“\n\n"
      "Mit dem Wind angefahren, Gefahr aus der Ferne erkannt, Fahrer herausgeholt, abgesperrt, Brandschutz mit dem richtigen Schaummittel befohlen und die Warntafel Ziffer für Ziffer gemeldet – inklusive Kontrolle der Wiederholung.\n\n"
      "> **Merke:** **GAMS** – Gefahr erkennen, Absperren, Menschenrettung, Spezialkräfte. Anfahren **mit dem Wind im Rücken**, Warntafel per **Fernglas**, Nummern **Ziffer für Ziffer** – und die Wiederholung der ILS immer prüfen.\n\n**Übung abgeschlossen! 🎉**")
OUT.append(("sonstige", s))
