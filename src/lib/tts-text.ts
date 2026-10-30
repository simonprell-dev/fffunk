// Text für die Sprachausgabe aufbereiten – damit Funksprüche so klingen, wie sie gesprochen werden.

export function ttsText(text: string): string {
  return text
    // Absätze nicht als lange Pause sprechen
    .replace(/\s*\n+\s*/g, ' ')
    // „44/1“ ist kein Bruch: Funkrufnamen werden „vierundvierzig eins“ gesprochen
    .replace(/(\d)\s*\/\s*(?=\d)/g, '$1 ') // auch mehrteilig: 17/42/1
    // „Angriffstrupp“ sonst „Angriff-Schtrupp“: hinter dem Fugen-s trennen
    .replace(/([A-Za-zÄÖÜäöüß]{3,}s)trupp\b/g, '$1-Trupp');
}
