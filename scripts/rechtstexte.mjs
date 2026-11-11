// Impressum und Datenschutzerklärung als Markdown – seo-pages.mjs macht daraus /impressum und /datenschutz.
// Ändert sich, welche Dienste die App nutzt (Hosting, Spracherkennung, Statistik …), hier nachziehen.

export const STAND_DATENSCHUTZ = 'November 2026';

const zeilen = (...z) => z.filter(Boolean).join('  \n');
const mail = a => `[${a.email}](mailto:${a.email})`;
const web = a => a.website && `Web: [${a.website.replace(/^https?:\/\//, '')}](${a.website})`;

export function impressumMarkdown(a) {
  return `## Angaben gemäß § 5 DDG

${zeilen(a.name, a.strasse, a.plzOrt)}

## Kontakt

${zeilen(`E-Mail: ${mail(a)}`, a.telefon && `Telefon: ${a.telefon}`, web(a))}

Fragen, Fehler in einem Szenario oder eigene Rufnamen für eure Wehr: am schnellsten per E-Mail.

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

${a.name}, Anschrift wie oben

## Kein offizielles Angebot

FFFunk ist ein privat betriebenes Projekt und kein Angebot einer Behörde, Leitstelle oder Feuerwehrschule. Die Übungen orientieren sich an den Sprechfunkübungen der Staatlichen Feuerwehrschule Würzburg, ersetzen aber keine Ausbildung nach FwDV 2 und nicht die Vorgaben eurer Leitstelle.

## Haftung für Inhalte

Die Inhalte erstelle ich mit Sorgfalt, für Richtigkeit, Vollständigkeit und Aktualität übernehme ich aber keine Gewähr. Community-Szenarien stammen von Nutzerinnen und Nutzern und werden vor der Veröffentlichung nicht geprüft. Fällt dir ein fehlerhafter oder rechtswidriger Inhalt auf, schreib mir – ich entferne ihn umgehend.

## Haftung für Links

Für verlinkte fremde Seiten (z. B. GitHub, PayPal) sind allein deren Betreiber verantwortlich. Beim Setzen der Links waren keine Rechtsverstöße erkennbar; werden mir welche bekannt, entferne ich den Link.

## Quellcode

FFFunk ist Open Source (MIT-Lizenz): [github.com/simonprell-dev/fffunk](https://github.com/simonprell-dev/fffunk).
`;
}

export function datenschutzMarkdown(a) {
  return `Kurz vorweg: FFFunk zeigt keine Werbung, setzt keine Cookies und bindet keine Tracking- oder Analysedienste ein. Ein Konto gibt es nicht.

## Verantwortlicher

${zeilen(a.name, a.strasse, a.plzOrt, `E-Mail: ${mail(a)}`)}

## Hosting

FFFunk läuft bei Railway (Railway Corporation, San Francisco, USA). Beim Aufruf jeder Seite verarbeitet der Server technisch notwendig deine IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserkennung, um die Seite auszuliefern. FFFunk selbst schreibt keine Zugriffsprotokolle mit IP-Adressen. Dabei können Daten in die USA übermittelt werden.

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse an einer sicheren, funktionierenden Website.

## Speicherung im Browser

Einstellungen, dein Lernfortschritt, eigene Szenarien und ein eingegebener Lizenzcode liegen im lokalen Speicher deines Browsers bzw. der App (localStorage). Diese Daten verlassen dein Gerät nicht – mit Ausnahme des Lizenzcodes, siehe „Nutzungsstatistik“ und „Lizenzcodes“. Du löschst sie, indem du die Website-Daten im Browser oder die App-Daten löschst.

Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG (für den Dienst unbedingt erforderlich) und Art. 6 Abs. 1 lit. f DSGVO.

## Spracherkennung

Damit FFFunk deinen Funkspruch prüfen kann, nimmt es auf, solange du die Sprechtaste hältst. Welcher Dienst die Sprache in Text umwandelt, hängt von deinem Gerät ab:

- **Im Browser (Chrome, Edge):** Die eingebaute Spracherkennung des Browsers schickt die Aufnahme an den Spracherkennungsdienst des Browser-Herstellers – bei Chrome an Google, bei Edge an Microsoft – und bekommt den Text zurück. Dabei können Daten in die USA übermittelt werden. FFFunk selbst erhält nur den erkannten Text und speichert ihn nicht.
- **In der Android-App:** Die Spracherkennung des Geräts (meist die von Google). Ob sie auf dem Gerät oder über das Internet arbeitet, hängt von Gerät und Einstellungen ab.
- **Offline-Erkennung:** Ohne Google-Dienst erkennt FFFunk die Sprache direkt auf deinem Gerät (Whistle im Browser, Vosk in der App); die Aufnahme verlässt das Gerät dann nicht. Das Sprachmodell für Whistle wird einmalig von Hugging Face (Hugging Face Inc., USA) geladen, dabei wird deine IP-Adresse an Hugging Face übermittelt. Im Browser erzwingst du die Offline-Erkennung mit dem Zusatz \`?stt=whistle\` in der Adresse.

Aufnahmen werden von FFFunk nicht gespeichert und nicht an den FFFunk-Server geschickt. Den Mikrofonzugriff erlaubst du selbst im Browser bzw. in der App und kannst ihn dort jederzeit entziehen.

Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (deine Einwilligung durch Freigabe des Mikrofons und Drücken der Sprechtaste).

## Sprachausgabe

Die Funksprüche der Gegenseite liest eine Sprachsynthese (Piper) auf dem FFFunk-Server vor. Dafür schickt die App den Text des Funkspruchs aus dem Szenario an den Server. Der Text wird nur umgewandelt, nicht gespeichert.

## Nutzungsstatistik

FFFunk zählt auf dem Server, wie oft die App geöffnet und welche Szenarien gestartet und abgeschlossen werden – je Tag, Ereignis, Szenario und gegebenenfalls Lizenzcode der Organisation. Gespeichert werden nur diese Zähler: keine IP-Adresse, keine Geräte-ID, kein Cookie, keine Inhalte. Ein Rückschluss auf dich als Person ist nicht möglich.

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse daran, zu sehen, welche Übungen genutzt werden.

## Community-Szenarien

Wenn du ein eigenes Szenario veröffentlichst, speichert der Server Titel, Beschreibung, Inhalt, Kategorie, den von dir angegebenen Autorennamen (Standard: „Anonym“) und den Zeitpunkt. Das Szenario ist danach für alle sichtbar. Ein „Danke“ erhöht nur einen Zähler. Möchtest du ein Szenario löschen lassen, schreib mir eine E-Mail.

Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (du veröffentlichst bewusst).

## Lizenzcodes für Organisationen

Für Feuerwehren und andere Organisationen mit eigenem Code speichere ich Name der Organisation, die eingerichteten Rufnamen und die Kontaktdaten der Ansprechperson (Name, E-Mail, ggf. Telefon), um den Code einzurichten und zu betreuen. Gibst du einen Code in der App ein, fragt die App beim Server die dazugehörigen Rufnamen und Szenarien ab.

Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag bzw. Anfrage der Organisation).

## Kontakt per E-Mail

Schreibst du mir, verarbeite ich deine E-Mail-Adresse und den Inhalt, um zu antworten, und lösche die Nachricht, wenn die Sache erledigt ist und keine Aufbewahrungspflicht besteht.

Rechtsgrundlage: Art. 6 Abs. 1 lit. b bzw. f DSGVO.

## Links zu anderen Anbietern

Der Spenden-Knopf führt zu PayPal, der Quellcode-Link zu GitHub. Erst wenn du einen solchen Link anklickst, verlässt du FFFunk; dann gelten die Datenschutzbestimmungen des jeweiligen Anbieters.

## Deine Rechte

Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen. Eine E-Mail an ${mail(a)} genügt.

Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO), zum Beispiel bei der deines Wohnorts.

Stand: ${STAND_DATENSCHUTZ}
`;
}
