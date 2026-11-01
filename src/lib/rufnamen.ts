// Frühere Rufnamen der Szenarien → heutige. Ältere Lizenzen ordnen noch den alten Namen zu.
const RENAMED: Record<string, string> = {
  'Florian Neuhaus 44/1': 'Florian Neuhaus 17/42/1',
  // Früher stand nur „Leitstelle“ im Text; heute heißt sie „Leitstelle Nürnberg“.
  Leitstelle: 'Leitstelle Nürnberg',
};

export function applyRufnamen(text: string, rufnamen: Record<string, string>): string {
  if (!text || !rufnamen) return text;
  const map = { ...rufnamen };
  for (const [oldName, newName] of Object.entries(RENAMED)) {
    if (map[oldName] && !map[newName]) map[newName] = map[oldName];
  }
  const entries = Object.entries(map).filter(([k]) => k.length > 0);
  if (entries.length === 0) return text;
  // Ein Durchgang, längere Begriffe zuerst: Eingesetzte Namen werden nicht erneut ersetzt
  // (Wehr „Neuhaus“ → „Adelsdorf“ darf nicht zusätzlich zum Nachbarort „Adelsdorf“ → „Höchstadt“ werden).
  entries.sort(([a], [b]) => b.length - a.length);
  const pattern = new RegExp(entries.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return text.replace(pattern, found => map[found]);
}
