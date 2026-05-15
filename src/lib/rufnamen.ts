export function applyRufnamen(text: string, rufnamen: Record<string, string>): string {
  if (!text || !rufnamen) return text;
  const entries = Object.entries(rufnamen).filter(([k]) => k.length > 0);
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
