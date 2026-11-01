"""Grundausbildung Feuerwehr: Neulinge lernen die Funkregeln in 6 Kapiteln (verstehen → auswählen → sprechen)."""
from gen_lib import K

OUT = []
k = K("grundausbildung", "Grundausbildung",
      "Für Neulinge ohne Vorwissen: In 6 kurzen Kapiteln lernst du die Grundregeln des Sprechfunks – von „Wer ruft wen?“ bis Mayday.",
      "truppmann")
k.chapter("reihenfolge", "Wer ruft wen?", "r")
k.chapter("kommen-ende", "Kommen und Ende", "k")
k.chapter("frage", "Eine Frage stellen", "f")
k.chapter("nachfrage", "Nachfragen", "n")
k.chapter("anruf-beantworten", "Einen Anruf beantworten", "a")
k.chapter("mayday", "Mayday", "m")

GF = '**Gruppenführer:**'

# ---------- Kapitel 1: Wer ruft wen? ----------
k.node('r_start',
 'Erster Übungsabend bei der Feuerwehr Neuhaus. Du bist **Truppmann im Angriffstrupp** des Löschfahrzeugs **Florian Neuhaus 17/42/1**. Dein Gruppenführer drückt dir ein Funkgerät in die Hand.\n\n'
 f'{GF} „Beim Funk gilt immer dieselbe Reihenfolge: **Wen rufst du – von wem – kommen.** Zuerst der Gerufene, dann „von“ und du selbst. „Kommen“ heißt: Jetzt bist du dran.“',
 [K.go('ok', '👍 Verstanden', 'r_choice')])
k.ask('r', 'Du willst deinen **Gruppenführer** anfunken. Welcher Funkspruch ist richtig?',
 '„Gruppenführer von Angriffstrupp – kommen.“',
 [('„Angriffstrupp an Gruppenführer – kommen.“',
   '**Nicht ganz.** Du hast dich zuerst genannt. Beim Funk steht **der Gerufene vorne** – er soll sofort hören, dass er gemeint ist. Danach kommen „von“ und dein eigener Name.'),
  ('„Hallo Gruppenführer, hörst du mich?“',
   '**Nicht ganz.** Über Funk gibt es kein „Hallo“ wie am Telefon. Ein Anruf ist immer gleich aufgebaut: **Gerufener – von – Rufender – kommen.**')],
 'r_speak', [0, 1, 2])
k.node('r_speak', '**Richtig!** Jetzt du: Halte die **Sprechtaste** gedrückt, warte kurz und sprich den Anruf an deinen Gruppenführer.',
 [K.call('Gruppenführer anfunken', 'Gruppenführer von Angriffstrupp – kommen.', ['Gruppenführer', 'Angriffstrupp', 'kommen'],
       'r_speak2', 'r_fail', 'Hier Gruppenführer – kommen.')])
k.retry('r_fail', '**Noch nicht ganz.** Merke dir: **Gerufener – von – Rufender – kommen.** Also: „Gruppenführer von Angriffstrupp – kommen.“', 'r_speak')
k.node('r_speak2', 'Der Gruppenführer hat geantwortet – dein erster Funkspruch hat geklappt! Jetzt rufst du den **Maschinisten** am Fahrzeug. Gleiche Reihenfolge, nur ein anderer Gerufener.',
 [K.call('Maschinisten anfunken', 'Maschinist von Angriffstrupp – kommen.', ['Maschinist', 'Angriffstrupp', 'kommen'],
       'r_end', 'r_fail2', 'Hier Maschinist – kommen.')])
k.retry('r_fail2', '**Fast.** Zuerst der Gerufene: „Maschinist von Angriffstrupp – kommen.“', 'r_speak2')
k.finish('r_end', '**Kapitel geschafft!** 🎉\n\nMerksatz: **Wen rufe ich – von wem – kommen.**')

# ---------- Kapitel 2: Kommen und Ende ----------
k.node('k_start',
 'Übungsabend, du bist Truppmann im Angriffstrupp. Der Gruppenführer erklärt die zwei wichtigsten Funkwörter.\n\n'
 f'{GF} „**Kommen** heißt: Ich warte auf deine Antwort. **Ende** heißt: Das Gespräch ist fertig, der Kanal ist wieder frei. Wer „Ende“ vergisst, lässt die anderen warten.“',
 [K.go('ok', '👍 Verstanden', 'k_choice')])
k.ask('k', f'Der Gruppenführer funkt dich an:\n\n{GF} „Angriffstrupp von Gruppenführer – rüstet euch mit Atemschutz aus – kommen.“\n\nDu hast alles verstanden und brauchst nichts mehr. Wie antwortest du?',
 '„Hier Angriffstrupp – verstanden – Ende.“',
 [('„Okay, machen wir.“',
   '**Nicht ganz.** „Okay“ ist kein Funkwort, und es fehlt der Abschluss. Sag, **wer** spricht, dass du **verstanden** hast – und beende mit **Ende**.'),
  ('„Hier Angriffstrupp – verstanden – kommen.“',
   '**Fast.** Mit „kommen“ wartest du auf eine weitere Antwort – aber es gibt nichts mehr zu sagen. Ist alles klar, schließt du mit **Ende** ab.')],
 'k_speak', [1, 0, 2])
k.node('k_speak', '**Richtig!** Sprich jetzt deine Antwort und beende das Gespräch.',
 [K.call('Antwort sprechen', 'Hier Angriffstrupp – verstanden – Ende.', ['Angriffstrupp', 'verstanden', 'Ende'],
       'k_speak2', 'k_fail', '')])
k.retry('k_fail', '**Noch nicht ganz.** Wer spricht – verstanden – **Ende**: „Hier Angriffstrupp – verstanden – Ende.“', 'k_speak')
k.node('k_speak2', 'Ihr seid ausgerüstet. Melde das jetzt dem Gruppenführer. Weil du auf seine Antwort wartest, endet deine Meldung mit **kommen**.',
 [K.call('Meldung sprechen', 'Gruppenführer von Angriffstrupp – Angriffstrupp ist ausgerüstet – kommen.',
       ['Gruppenführer', 'Angriffstrupp', 'ausgerüstet', 'kommen'],
       'k_end', 'k_fail2', 'Hier Gruppenführer – verstanden – Ende.')])
k.retry('k_fail2', '**Fast.** „Gruppenführer von Angriffstrupp – Angriffstrupp ist ausgerüstet – kommen.“', 'k_speak2')
k.finish('k_end', '**Kapitel geschafft!** 🎉\n\nMerksatz: **kommen** = du bist dran. **Ende** = Gespräch fertig, Kanal frei.')

# ---------- Kapitel 3: Eine Frage stellen ----------
k.node('f_start',
 'Übungsabend am Übungshaus. Du sollst eine Schlauchleitung zum **Verteiler** legen – weißt aber nicht, wo er steht.\n\n'
 f'{GF} „Willst du etwas wissen, sagst du **Frage** vor deine Frage. Dann weiß jeder sofort: Hier wird eine Antwort gebraucht. Und weil du auf die Antwort wartest: **kommen**.“',
 [K.go('ok', '👍 Verstanden', 'f_choice')])
k.ask('f', 'Der Gruppenführer hat sich schon gemeldet: „Hier Gruppenführer – kommen.“ Wie stellst du deine Frage?',
 '„Frage: Wo steht der Verteiler? – kommen.“',
 [('„Äh, wo ist eigentlich der Verteiler?“',
   '**Nicht ganz.** Ohne „Frage“ geht eine Frage im Funk leicht unter – und ohne „kommen“ weiß der andere nicht, dass er dran ist.'),
  ('„Frage: Wo steht der Verteiler? – Ende.“',
   '**Fast.** Mit „Ende“ beendest du das Gespräch – dann bekommst du keine Antwort. Bei einer Frage wartest du: **kommen**.')],
 'f_speak', [2, 0, 1])
k.node('f_speak', '**Richtig!** Jetzt der ganze Funkspruch: erst anrufen, auf die Antwort warten, dann die Frage stellen.',
 [K.call('Frage funken', 'Gruppenführer von Angriffstrupp – Frage: Wo steht der Verteiler? – kommen.',
       ['Gruppenführer', 'Angriffstrupp', 'Frage', 'Verteiler', 'kommen'],
       'f_speak2', 'f_fail', 'Hier Gruppenführer – Verteiler steht an der Hofeinfahrt – kommen.')])
k.retry('f_fail', '**Noch nicht ganz.** „Gruppenführer von Angriffstrupp – Frage: Wo steht der Verteiler? – kommen.“', 'f_speak')
k.node('f_speak2', 'Die Antwort: Der Verteiler steht an der **Hofeinfahrt**. Bestätige kurz, was du verstanden hast, und beende das Gespräch.',
 [K.call('Antwort bestätigen', 'Hier Angriffstrupp – verstanden, Verteiler an der Hofeinfahrt – Ende.',
       ['Angriffstrupp', 'verstanden', 'Hofeinfahrt', 'Ende'], 'f_end', 'f_fail2', '')])
k.retry('f_fail2', '**Fast.** „Hier Angriffstrupp – verstanden, Verteiler an der Hofeinfahrt – Ende.“', 'f_speak2')
k.finish('f_end', '**Kapitel geschafft!** 🎉\n\nMerksatz: **Frage** voran – und am Schluss **kommen**, weil du auf die Antwort wartest.')

# ---------- Kapitel 4: Nachfragen ----------
k.node('n_start',
 'Übungsabend, du stehst als Truppmann hinter einer dicken Mauer – der Funk rauscht.\n\n'
 f'{GF} „Hast du etwas **nicht sicher verstanden**, rate nie! Sag **wiederholen** – dann sagt der andere alles noch einmal. Ein falsch verstandener Auftrag ist gefährlicher als eine Nachfrage.“',
 [K.go('ok', '👍 Verstanden', 'n_choice')])
k.ask('n', f'Aus dem Funkgerät:\n\n{GF} „Angriffstrupp von Gruppenführer – erstes Rohr *krrrz* … zum *krrrz* … – kommen.“\n\nWas tust du?',
 '„Hier Angriffstrupp – wiederholen – kommen.“',
 [('„Hier Angriffstrupp – verstanden – Ende.“ und dann schauen, was gemeint war',
   '**Nicht gut.** Du hast den Auftrag nicht verstanden – „verstanden“ wäre falsch. Wer rät, macht im Einsatz womöglich das Falsche. Frag nach: **wiederholen**.'),
  ('Nichts sagen – er meldet sich schon noch mal',
   '**Nicht gut.** Schweigst du, weiß der Gruppenführer nicht, ob du ihn gehört hast. Melde dich und sag **wiederholen**.')],
 'n_speak', [1, 2, 0])
k.node('n_speak', '**Richtig!** Sprich deine Nachfrage.',
 [K.call('Nachfragen', 'Hier Angriffstrupp – wiederholen – kommen.', ['Angriffstrupp', 'wiederholen', 'kommen'],
       'n_speak2', 'n_fail', 'Hier Gruppenführer – ich wiederhole: Angriffstrupp mit erstem Rohr zum Hauseingang – kommen.')])
k.retry('n_fail', '**Noch nicht ganz.** „Hier Angriffstrupp – wiederholen – kommen.“', 'n_speak')
k.node('n_speak2', 'Jetzt war es klar: **erstes Rohr zum Hauseingang**. Bestätige den Auftrag und beende das Gespräch.',
 [K.call('Auftrag bestätigen', 'Hier Angriffstrupp – verstanden, erstes Rohr zum Hauseingang – Ende.',
       ['Angriffstrupp', 'verstanden', 'Rohr', 'Hauseingang', 'Ende'], 'n_end', 'n_fail2', '')])
k.retry('n_fail2', '**Fast.** „Hier Angriffstrupp – verstanden, erstes Rohr zum Hauseingang – Ende.“', 'n_speak2')
k.finish('n_end', '**Kapitel geschafft!** 🎉\n\nMerksatz: Nicht sicher verstanden? **Wiederholen** – niemals raten.')

# ---------- Kapitel 5: Einen Anruf beantworten ----------
k.node('a_start',
 'Übungsabend – diesmal wirst **du** angefunkt.\n\n'
 f'{GF} „Ruft dich jemand, antwortest du mit **Hier**, deinem Namen und **kommen**. Viele sagen aus Gewohnheit „Angriffstrupp hört“ – „hört“ ist aber **kein Funkwort**. Richtig ist: „Hier Angriffstrupp – kommen.““',
 [K.go('ok', '👍 Verstanden', 'a_choice')])
k.ask('a', f'Aus dem Funkgerät:\n\n{GF} „Angriffstrupp von Gruppenführer – kommen.“\n\nWie antwortest du?',
 '„Hier Angriffstrupp – kommen.“',
 [('„Angriffstrupp hört.“',
   '**Nicht ganz.** „Hört“ ist kein Funkwort – auch wenn man es oft hört. Die Antwort beginnt mit **Hier**: „Hier Angriffstrupp – kommen.“'),
  ('„Ja?“',
   '**Nicht ganz.** Bei „Ja?“ weiß niemand, **wer** antwortet – es können mehrere Trupps auf dem Kanal sein. Nenne dich: „Hier Angriffstrupp – kommen.“')],
 'a_speak', [2, 1, 0])
k.node('a_speak', f'**Richtig!** Der Gruppenführer ruft noch einmal:\n\n{GF} „Angriffstrupp von Gruppenführer – kommen.“\n\nAntworte ihm.',
 [K.call('Anruf beantworten', 'Hier Angriffstrupp – kommen.', ['hier', 'Angriffstrupp', 'kommen'],
       'a_speak2', 'a_fail', 'Hier Gruppenführer – Angriffstrupp zur Übungspuppe ins Erdgeschoss vorgehen – kommen.')])
k.retry('a_fail', '**Noch nicht ganz.** Erst **Hier**, dann dein Name, dann **kommen**: „Hier Angriffstrupp – kommen.“', 'a_speak')
k.node('a_speak2', 'Auftrag erhalten: **zur Übungspuppe ins Erdgeschoss**. Bestätige und beende das Gespräch.',
 [K.call('Auftrag bestätigen', 'Hier Angriffstrupp – verstanden, gehen zur Übungspuppe ins Erdgeschoss vor – Ende.',
       ['Angriffstrupp', 'verstanden', 'Übungspuppe', 'Erdgeschoss', 'Ende'], 'a_end', 'a_fail2', '')])
k.retry('a_fail2', '**Fast.** „Hier Angriffstrupp – verstanden, gehen zur Übungspuppe ins Erdgeschoss vor – Ende.“', 'a_speak2')
k.finish('a_end', '**Kapitel geschafft!** 🎉\n\nMerksatz: Angerufen? **Hier** + Name + **kommen**. „Hört“ gibt es im Funk nicht.')

# ---------- Kapitel 6: Mayday ----------
k.node('m_start',
 'Zum Abschluss eine Atemschutzübung im verrauchten Übungshaus. Du bist mit deinem Truppführer im **Obergeschoss**.\n\n'
 f'{GF} „Seid ihr in Lebensgefahr, rufst du **Mayday**. Erst die **Notruftaste** am Funkgerät drücken, dann: **Mayday, Mayday, Mayday – hier – wo – was – Mayday, kommen!** Mayday geht vor jedem anderen Funkspruch.“',
 [K.go('ok', '👍 Verstanden', 'm_choice')])
k.ask('m', 'Plötzlich stürzt dein Truppführer im **Schlafzimmer** und reagiert nicht mehr. Was tust du?',
 '🆘 Notruftaste drücken und Mayday rufen',
 [('Erst einmal abwarten, ob er wieder aufsteht',
   '**Gefährlich.** In einer Notlage zählt jede Sekunde – die Atemluft ist begrenzt. Sofort **Notruftaste** und **Mayday**.'),
  ('Den Gruppenführer ganz normal anfunken: „Gruppenführer von Angriffstrupp – kommen.“',
   '**Zu langsam.** Ein normaler Anruf muss warten, bis der Kanal frei ist. **Mayday** unterbricht jeden anderen Funkverkehr – genau dafür gibt es das Notrufwort.')],
 'm_sos', [0, 2, 1])
k.node('m_sos', '**Richtig!** Drück jetzt die **Notruftaste** deines Funkgeräts.',
 [K.go('sos', '🆘 Notruftaste drücken', 'm_speak', key='sos')])
k.node('m_speak', 'Notruf ist ausgelöst. Jetzt sprich den Mayday: **wer** (Angriffstrupp Florian Neuhaus 17/42/1), **wo** (Obergeschoss, Schlafzimmer), **was** (Truppführer bewusstlos, Atemluft 150 bar).',
 [K.call('Mayday rufen', 'Mayday, Mayday, Mayday – hier Angriffstrupp Florian Neuhaus 17/42/1 – Obergeschoss, Schlafzimmer – Truppführer bewusstlos, Atemluft 150 bar – Mayday, kommen!',
       ['Mayday', 'Angriffstrupp', 'Obergeschoss', 'Schlafzimmer', 'bewusstlos', 'kommen'],
       'm_speak2', 'm_fail', 'Hier Gruppenführer – Mayday verstanden, Sicherheitstrupp kommt zu euch ins Obergeschoss – kommen.')])
k.retry('m_fail', '**Noch nicht ganz.** Dreimal **Mayday** – **hier** wer – **wo** – **was** – **Mayday, kommen!**', 'm_speak')
k.node('m_speak2', 'Der Sicherheitstrupp ist unterwegs. Bestätige und bleib bei deinem Truppführer.',
 [K.call('Bestätigen', 'Hier Angriffstrupp – verstanden, bleibe beim Truppführer – kommen.',
       ['Angriffstrupp', 'verstanden', 'Truppführer', 'kommen'], 'm_end', 'm_fail2', 'Hier Gruppenführer – verstanden – Ende.')])
k.retry('m_fail2', '**Fast.** „Hier Angriffstrupp – verstanden, bleibe beim Truppführer – kommen.“', 'm_speak2')
k.finish('m_end', '**Übung beendet – der Sicherheitstrupp hat euch erreicht.** 🎉\n\nDu kennst jetzt die Grundregeln: Reihenfolge, kommen und Ende, Frage, Nachfrage, Anruf beantworten und Mayday. **Willkommen im Funkverkehr!**', last=True)

OUT.append(("funk", k))
