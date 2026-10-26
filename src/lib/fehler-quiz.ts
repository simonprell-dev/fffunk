/**
 * „Fehler finden“: Die App spielt einen fehlerhaften Funkspruch vor, der Nutzer erkennt den Fehler.
 * Kein Mikrofon nötig. Texte werden wie die Szenarien über `applyRufnamen` lokalisiert.
 * Inhalte konsistent mit dem Lernbereich (lern-content.ts) und den eingebauten Szenarien.
 */
export interface FehlerQuizItem {
  id: string;
  /** Kurze Lage, damit der Funkspruch eingeordnet werden kann. */
  situation: string;
  /** Der fehlerhafte Funkspruch (wird vorgelesen). */
  spoken: string;
  /** Antwortmöglichkeiten – genau eine ist richtig (`correct`). */
  options: string[];
  correct: number;
  explanation: string;
  /** Korrekte Fassung (wird nach der Auflösung angeboten). */
  corrected: string;
}

export const fehlerQuiz: FehlerQuizItem[] = [
  {
    id: 'hoert',
    situation: 'Die Leitstelle ruft: „Florian Neuhaus 44/1 von Leitstelle – kommen.“ Der Gruppenführer antwortet:',
    spoken: 'Florian Neuhaus 44/1 hört – kommen.',
    options: [
      '„hört“ ist kein Betriebswort – die Antwort beginnt mit „hier“',
      'Der eigene Funkrufname darf in der Antwort nicht vorkommen',
      '„kommen“ ist am Ende falsch, richtig wäre „Ende“',
    ],
    correct: 0,
    explanation: 'Auf einen Anruf antwortet man mit **„hier“ + eigenem Funkrufnamen + „kommen“**. „Hört“ ist kein Betriebswort.',
    corrected: 'Hier Florian Neuhaus 44/1 – kommen.',
  },
  {
    id: 'eigener_rufname_fehlt',
    situation: 'Der Angriffstrupp will den Gruppenführer anrufen:',
    spoken: 'Gruppenführer – kommen.',
    options: [
      'Es fehlt „von“ und der eigene Funkrufname',
      'Der Gruppenführer wird nie über Funk angerufen',
      'Es fehlt das Wort „bitte“',
    ],
    correct: 0,
    explanation: 'Ein Anruf hat die Form **„<Gegenstelle> von <eigener Rufname> – kommen“**. Ohne eigenen Rufnamen weiß die Gegenstelle nicht, wer ruft – gerade wenn mehrere Trupps in der Sprechgruppe sind.',
    corrected: 'Gruppenführer von Angriffstrupp – kommen.',
  },
  {
    id: 'reihenfolge',
    situation: 'Florian Neuhaus 44/1 will die Leitstelle anrufen:',
    spoken: 'Florian Neuhaus 44/1 ruft Leitstelle – kommen.',
    options: [
      'Reihenfolge falsch: erst die Gegenstelle, dann „von“ und der eigene Rufname',
      'Die Leitstelle darf man nur per Status 0 erreichen',
      'Es fehlt das Wort „Funkspruch“',
    ],
    correct: 0,
    explanation: 'Zuerst wird die **gerufene Stelle** genannt – so horcht sie sofort auf. Dann **„von“** und der eigene Rufname. In Bayern meldet man sich bei der ILS im Regelfall zuvor mit **Status 5** (Sprechwunsch).',
    corrected: 'Leitstelle von Florian Neuhaus 44/1 – kommen.',
  },
  {
    id: 'hoeflichkeit',
    situation: 'Der Wassertrupp ruft den Maschinisten:',
    spoken: 'Hallo Maschinist, hier ist der Wassertrupp, bitte kommen, danke!',
    options: [
      'Höflichkeitsfloskeln und falscher Aufbau – kurz und nach Schema funken',
      'Der Maschinist hat keinen Funkrufnamen',
      'Am Ende fehlt „Ende“',
    ],
    correct: 0,
    explanation: '**Kurz, klar, deutlich** – ohne „Hallo“, „bitte“, „danke“. Jede Silbe blockiert die Sprechgruppe für alle anderen.',
    corrected: 'Maschinist von Wassertrupp – kommen.',
  },
  {
    id: 'nicht_gewartet',
    situation: 'Der Angriffstrupp hat eine Person gefunden und funkt den Gruppenführer an:',
    spoken: 'Gruppenführer von Angriffstrupp – kommen – Person gefunden, Obergeschoss Kinderzimmer, Kind bewusstlos – kommen.',
    options: [
      'Nicht auf die Antwort gewartet – nach dem Anruf erst „Hier Gruppenführer – kommen“ abwarten',
      'Eine Person darf nicht über Funk gemeldet werden',
      '„bewusstlos“ ist kein zulässiger Begriff',
    ],
    correct: 0,
    explanation: 'Nach dem Anruf wird **gewartet, bis sich die Gegenstelle meldet**. Erst dann ist sicher, dass sie zuhört – sonst geht die wichtige Nachricht womöglich ins Leere.',
    corrected: 'Gruppenführer von Angriffstrupp – kommen. … (Antwort: „Hier Gruppenführer – kommen.“) … Person gefunden, Obergeschoss Kinderzimmer, Kind bewusstlos – kommen.',
  },
  {
    id: 'kommen_fehlt',
    situation: 'Nach der Antwort des Gruppenführers fragt der Schlauchtrupp:',
    spoken: 'Frage: Wo soll der Verteiler gesetzt werden?',
    options: [
      'Am Ende fehlt „kommen“ – die Gegenstelle weiß nicht, dass sie dran ist',
      'Fragen sind über Funk nicht erlaubt',
      'Vor der Frage muss „Achtung“ gesagt werden',
    ],
    correct: 0,
    explanation: '**„kommen“** übergibt die Sprecherlaubnis. Ohne „kommen“ wartet die Gegenstelle – oder beide fangen gleichzeitig an zu senden.',
    corrected: 'Frage Standort Verteiler – kommen.',
  },
  {
    id: 'over',
    situation: 'Der Truppführer bestätigt eine Anweisung des Gruppenführers:',
    spoken: 'Okay, verstanden, over.',
    options: [
      '„Okay“ und „over“ sind keine Betriebsworte',
      '„verstanden“ ist kein Betriebswort',
      'Eine Anweisung wird nie bestätigt',
    ],
    correct: 0,
    explanation: 'Im BOS-Funk gelten **„verstanden“**, **„kommen“** und **„Ende“**. „Okay“, „over“ oder „Roger“ stammen aus Film und Flugfunk und sorgen für Missverständnisse.',
    corrected: 'Hier Angriffstrupp – verstanden – Ende.',
  },
  {
    id: 'status_gesprochen',
    situation: 'Florian Neuhaus 44/1 erreicht die Einsatzstelle:',
    spoken: 'Leitstelle von Florian Neuhaus 44/1 – wir sind jetzt am Einsatzort angekommen – kommen.',
    options: [
      'Die Ankunft wird mit Status 4 gedrückt, nicht gesprochen',
      'Die Ankunft muss mit „Ende“ statt „kommen“ gemeldet werden',
      'Es fehlt die Uhrzeit',
    ],
    correct: 0,
    explanation: 'Fahrzeugzustände werden als **Status per Taste** gesendet – **Status 4** = am Einsatzort. Gesprochen wird erst die **Lagemeldung**. Das hält die Sprechgruppe der ILS frei.',
    corrected: '⌨️ Status 4 drücken – danach Status 5 für die Lagemeldung.',
  },
  {
    id: 'lagemeldung_unvollstaendig',
    situation: 'Die Leitstelle hat Florian Neuhaus 44/1 auf Sprechwunsch gerufen. Lagemeldung:',
    spoken: 'Hier Florian Neuhaus 44/1 – Lagemeldung: Birkenweg 12, Brand im Dachgeschoss, ein Rohr im Innenangriff – kommen.',
    options: [
      'Es fehlen „Menschenleben in Gefahr“ und die Nachforderung',
      'Die Adresse darf nicht über Funk genannt werden',
      'Eine Lagemeldung beginnt immer mit „Mayday“',
    ],
    correct: 0,
    explanation: 'Die Lagemeldung folgt dem Schema **Wo · Was · Menschenleben in Gefahr · eigene Maßnahmen · Nachforderung** – auch „keine Nachforderung“ wird ausdrücklich gesagt.',
    corrected: 'Hier Florian Neuhaus 44/1 – Lagemeldung: Birkenweg 12, Brand im Dachgeschoss. Alle Bewohner im Freien, kein Menschenleben in Gefahr. Ein Rohr im Innenangriff. Keine Nachforderung – kommen.',
  },
  {
    id: 'mayday_falsch',
    situation: 'Im Innenangriff bricht der Truppführer zusammen. Der Truppmann funkt:',
    spoken: 'Hilfe, Hilfe! Mein Truppführer ist umgefallen, schnell!',
    options: [
      'Notruf nach Schema: dreimal „Mayday“, Rufname, Standort, Lage, „Mayday – kommen“',
      'Ein Notfall wird nur über Status 0 gemeldet, nicht gesprochen',
      'Zuerst muss die Atemschutzüberwachung angerufen werden',
    ],
    correct: 0,
    explanation: 'Der Atemschutznotfall beginnt mit **„Mayday, Mayday, Mayday – hier <Rufname>“**, dann **Standort** und **Lage**, Abschluss **„Mayday – kommen“**. Zusätzlich die **Notruftaste** drücken. „Mayday“ verschafft sofort Vorrang in der Sprechgruppe.',
    corrected: 'Mayday, Mayday, Mayday – hier Angriffstrupp Florian Neuhaus 44/1 – Erdgeschoss Wohnzimmer – Truppführer bewusstlos – Mayday, kommen!',
  },
  {
    id: 'fuellwoerter',
    situation: 'Der Gruppenführer meldet sich bei der Leitstelle (die ihn auf Sprechwunsch gerufen hat):',
    spoken: 'Hier Florian Neuhaus 44/1 – äh, also, wir schauen uns das jetzt mal an und melden uns dann irgendwann nochmal – kommen.',
    options: [
      'Kein Inhalt, Füllwörter – erst denken, dann drücken, dann sprechen',
      '„Hier“ ist am Anfang falsch',
      'Der Funkrufname muss buchstabiert werden',
    ],
    correct: 0,
    explanation: '**Denken – Drücken – Sprechen.** Wer nichts zu melden hat, funkt nicht. Füllwörter wie „äh“ und „also“ verlängern den Spruch ohne Information.',
    corrected: '(Nicht funken – erst nach der Erkundung eine vollständige Lagemeldung abgeben.)',
  },
  {
    id: 'zahl_am_stueck',
    situation: 'Die Warntafel am Gefahrgut-LKW zeigt unten die UN-Nummer 1203. Gemeldet wird:',
    spoken: 'UN-Nummer zwölfhundertdrei – kommen.',
    options: [
      'Wichtige Zahlen Ziffer für Ziffer sprechen: eins – zwo – null – drei',
      'Die UN-Nummer darf nicht über Funk genannt werden',
      'UN-Nummern werden in Buchstaben übermittelt',
    ],
    correct: 0,
    explanation: 'Bei wichtigen Zahlen wie UN-Nummern, Kennzeichen oder Hausnummern werden die **Ziffern einzeln** gesprochen. „Zwo“ statt „zwei“ verhindert die Verwechslung mit „drei“.',
    corrected: 'UN-Nummer eins – zwo – null – drei – kommen.',
  },
  {
    id: 'ok_ohne_wiederholung',
    situation: 'Die Leitstelle gibt eine Nachinformation: „Alle Bewohner im Freien, Gasanschluss im Keller – kommen.“ Antwort:',
    spoken: 'Hier Florian Neuhaus 44/1 – ok – Ende.',
    options: [
      '„ok“ statt „verstanden“, die wichtigen Punkte nicht wiederholt – und „Ende“ sagt die Stelle, die das Gespräch eröffnet hat',
      'Eine Nachinformation wird nicht beantwortet',
      'Der Rufname muss am Ende statt am Anfang stehen',
    ],
    correct: 0,
    explanation: 'Einsatzwichtige Informationen werden mit **„verstanden“** quittiert und **kurz wiederholt** – so fallen Hörfehler sofort auf. Das Gespräch beendet die Stelle, die es eröffnet hat, hier also die Leitstelle.',
    corrected: 'Hier Florian Neuhaus 44/1 – verstanden: alle Bewohner im Freien, Gasanschluss im Keller – kommen.',
  },
  {
    id: 'name_betroffener',
    situation: 'Bei der Vermisstensuche wird die Person gefunden. Meldung an den Einsatzleiter:',
    spoken: 'Florian Neuhaus 11/1 von Florian Neuhaus 44/1 – wir haben Herrn Max Müller aus der Bergstraße 7 gefunden, er ist unterkühlt – kommen.',
    options: [
      'Namen von Betroffenen gehören nicht in den Funk – Fundort und Zustand genügen',
      'Unterkühlung darf nicht gemeldet werden',
      'Der Einsatzleiter wird nie direkt angerufen',
    ],
    correct: 0,
    explanation: 'Funk kann **mitgehört** werden. Namen von Betroffenen und andere persönliche Daten werden nicht gefunkt. Fundort, Zustand und benötigte Hilfe reichen für die Einsatzführung.',
    corrected: 'Florian Neuhaus 11/1 von Florian Neuhaus 44/1 – Person aufgefunden in Suchabschnitt drei, am Bachlauf, ansprechbar, stark unterkühlt, benötigen Rettungsdienst – kommen.',
  },
];
