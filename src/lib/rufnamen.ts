// Frühere Rufnamen der Szenarien → heutige. Ältere Lizenzen ordnen noch den alten Namen zu.
const RENAMED: Record<string, string> = {
  'Florian Neuhaus 44/1': 'Florian Neuhaus 17/42/1',
};

export function applyRufnamen(text: string, rufnamen: Record<string, string>): string {
  if (!text || !rufnamen) return text;
  const map = { ...rufnamen };
  for (const [oldName, newName] of Object.entries(RENAMED)) {
    if (map[oldName] && !map[newName]) map[newName] = map[oldName];
  }
  const entries = Object.entries(map).filter(([k]) => k.length > 0);
  if (entries.length === 0) return text;
  // Longer keys first to avoid partial replacements
  entries.sort(([a], [b]) => b.length - a.length);
  let result = text;
  for (const [key, value] of entries) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), value);
  }
  return result;
}
