// Antwort der angefunkten Stelle nach einem erfolgreichen Funkspruch –
// sie wird gesprochen, bevor der nächste Schritt erscheint (wie im echten Funkverkehr).

export interface RadioResponse {
  speaker: string;
  text: string;
  /** true: Antwort stammt aus der ersten Zeile des nächsten Schritts und wird dort nicht erneut gesprochen. */
  fromNarrative: boolean;
}

// **Leitstelle:** „Verstanden – Ende.“  am Anfang eines Schritts
const LEADING_LINE = /^\s*\*\*([^*:]+):\*\*\s*[„"]([\s\S]+?)[“"]\s*/;

export function splitLeadingResponse(narrative: string): { speaker: string; text: string; rest: string } | null {
  const m = narrative.match(LEADING_LINE);
  if (!m) return null;
  const text = m[2].replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim(); // Anzeige ohne Markdown
  return { speaker: m[1].trim(), text, rest: narrative.slice(m[0].length).trim() };
}

// „Gruppenführer von Angriffstrupp – …“ → „Gruppenführer“
export function calleeFromHint(hint: string): string | null {
  const m = hint.match(/^\s*([^–\-:,]+?)\s+von\s+[^–\-:,]+?\s*[–-]/);
  if (!m || /^hier\b/i.test(m[1])) return null;
  return m[1].trim();
}

// Letzte Stelle, die im aktuellen Schritt gesprochen hat (**Leitstelle:** „…“) – sie hat das Gespräch eröffnet.
export function lastSpeaker(narrative: string): string | null {
  const speakers = [...narrative.matchAll(/\*\*([^*:\n]+):\*\*\s*[„"]/g)].map(m => m[1].trim());
  return speakers.length ? speakers[speakers.length - 1] : null;
}

// „Florian Neuhaus 33/1 (Drehleiter)“ ≙ „Florian Neuhaus 33/1“
function sameStation(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/\(.*?\)/g, '').trim().toLowerCase();
  return norm(a) === norm(b);
}

/**
 * Reihenfolge: explizite `response` im Szenario (leer = keine Antwort) →
 * Sprecherzeile am Anfang des nächsten Schritts → kurze Quittung der angerufenen Stelle bzw.
 * „Verstanden – Ende“ der Stelle, die das Gespräch eröffnet hat (Sprecher im aktuellen Schritt).
 * Endet der eigene Spruch mit „Ende“ (oder ohne „kommen“), antwortet niemand.
 */
export function radioResponseFor(hint: string, nextNarrative: string, explicit?: string, currentNarrative = ''): RadioResponse | null {
  if (explicit !== undefined) {
    return explicit.trim()
      ? { speaker: calleeFromHint(hint) ?? 'Gegenstelle', text: explicit.trim(), fromNarrative: false }
      : null;
  }
  // Szenario lässt die Gegenstelle bewusst schweigen (z. B. Atemschutznotfall).
  if (/keine antwort/i.test(nextNarrative.slice(0, 120))) return null;
  const callee = calleeFromHint(hint);
  const lead = splitLeadingResponse(nextNarrative);
  // Sprecherzeile nur übernehmen, wenn sie von der angerufenen Stelle stammt –
  // sonst ist es z. B. schon der nächste Anruf eines Dritten.
  if (lead && (!callee || sameStation(lead.speaker, callee))) {
    return { speaker: lead.speaker, text: lead.text, fromNarrative: true };
  }
  if (!/\bkommen\W*$/i.test(hint.trim())) return null; // „… – Ende“ oder reine Befehlswiederholung
  if (callee) return { speaker: callee, text: `Hier ${callee} – verstanden – Ende.`, fromNarrative: false };
  const opener = lastSpeaker(currentNarrative);
  if (!opener) return null;
  return { speaker: opener, text: 'Verstanden – Ende.', fromNarrative: false };
}
