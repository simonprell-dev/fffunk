// Wer FFFunk anbietet – für Impressum (§ 5 DDG), Datenschutzerklärung und Kontakt-Links.
// Fehlt eine Pflichtangabe, bricht `npm run build` ab: Ein leeres Impressum soll nie online gehen.
export const ANBIETER = {
  name: 'Simon Prell',
  strasse: 'Adelsdorferstraße 8', // Straße und Hausnummer (ladungsfähige Anschrift, kein Postfach)
  plzOrt: '91325 Adelsdorf', // z. B. „97070 Würzburg“
  email: 'simon.prell@googlemail.com',
  telefon: '', // freiwillig
  website: 'https://prelldynamics.de',
};

const PFLICHT = { name: 'Name', strasse: 'Straße und Hausnummer', plzOrt: 'PLZ und Ort', email: 'E-Mail' };

/** Wirft, wenn eine Pflichtangabe fürs Impressum fehlt. */
export function checkAnbieter(anbieter) {
  const missing = Object.entries(PFLICHT).filter(([k]) => !String(anbieter[k] ?? '').trim()).map(([, label]) => label);
  if (missing.length) throw new Error(`Impressum unvollständig – in scripts/anbieter.mjs fehlt: ${missing.join(', ')}`);
}
