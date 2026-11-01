import type { Scenario } from '../types/story';

/** Wertet das Szenario die Notruftaste selbst aus (Kapitel oder eigene „sos“-Aktion)?
 *  Sonst springt die App bei der Taste in die Mayday-Übung. */
export function handlesSosKey(scenario: Scenario | null | undefined): boolean {
  if (!scenario) return false;
  if (scenario.chapters) return true;
  return Object.values(scenario.nodes).some(n => n.actions.some(a => a.key === 'sos'));
}
