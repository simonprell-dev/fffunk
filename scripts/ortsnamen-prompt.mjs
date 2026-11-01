// KI-Prompt für ortsabhängige Namen (scripts/ortsnamen.json) und Übernahme der KI-Antwort.
// Beide Funktionen sind eigenständig: Die Admin-Seite bettet sie per toString() im Browser ein.

/** Prompt, der eine KI ein JavaScript-Objekt mit den echten Namen für einen Standort erzeugen lässt. */
export function buildOrtsnamenPrompt({ ort, organisation, katalog }) {
  const zeilen = katalog.map(k => `  ${JSON.stringify(k.name)}: "", // ${k.bedeutung}`).join('\n');
  return [
    'Du hilfst, die Sprechfunk-Übungs-App FFFunk auf einen echten Standort anzupassen.',
    '',
    `Standort: ${ort || '(bitte eintragen)'}`,
    `Organisation: ${organisation || '(bitte eintragen)'}`,
    '',
    'In den Übungen kommen Beispielnamen aus Neuhaus an der Aisch (Gemeinde Adelsdorf, Landkreis Erlangen-Höchstadt) vor.',
    'Ersetze jeden Beispielnamen durch den echten Namen, der für den Standort oben zutrifft.',
    '',
    'Regeln:',
    '- Nur real existierende Namen aus der Umgebung des Standorts: Nachbarorte, zuständige Integrierte Leitstelle,',
    '  nächste Rettungswache und Notarztstandort, zuständiger THW-Ortsverband, nächstgelegenes Krankenhaus mit',
    '  Stroke Unit und Herzkatheter, nahe Bundesstraße und Autobahn samt Anschlussstelle, Fluss am Ort.',
    '- Funkrufnamen genau im Schema des Bundeslandes (in Bayern nach der Richtlinie Funkrufnamen: Kennwort – Ort – Kennzahlen,',
    '  z. B. „Florian Musterstadt 40/1“, „Rotkreuz Musterstadt 71/1“, „Leitstelle Musterregion“). Kennwort der',
    '  Hilfsorganisation passend zur tatsächlichen Rettungswache wählen (Rotkreuz, Sama, Akkon, Johannes).',
    '- Kennzahlen der eigenen Fahrzeuge nur ändern, wenn du sie sicher kennst; sonst die Beispiel-Kennzahl behalten.',
    '- Die Schlüssel (links) nie ändern, nur die Werte (rechts) eintragen.',
    '- Bist du bei einem Wert unsicher, trage den plausibelsten ein und schreibe „unsicher“ in den Kommentar.',
    '',
    'Antworte ausschließlich mit genau einem JavaScript-Codeblock in diesem Format:',
    '',
    '```js',
    'const rufnamen = {',
    zeilen,
    '};',
    '```',
  ].join('\n');
}

/** Liest die KI-Antwort (JavaScript-Objekt oder „Suchtext=Ersetzung“-Zeilen) in eine Zuordnung. */
export function parseOrtsnamenAntwort(text) {
  const result = {};
  const unquote = s => s.slice(1, -1).replace(/\\(["'\\])/g, '$1');
  const add = (k, v) => {
    k = k.trim(); v = v.trim();
    if (k && v && k !== v) result[k] = v;
  };
  const paar = /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')\s*:\s*("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g;
  let m, gefunden = false;
  while ((m = paar.exec(text))) { gefunden = true; add(unquote(m[1]), unquote(m[2])); }
  if (!gefunden) {
    for (const line of String(text).split(/\r?\n/)) {
      const i = line.indexOf('=');
      if (i > 0) add(line.slice(0, i), line.slice(i + 1));
    }
  }
  return result;
}
