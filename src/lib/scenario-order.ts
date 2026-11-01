import type { Scenario } from '../types/story';

/** Reihenfolge im Ordner: Grundausbildungen (Kapitel) zuerst, dann alphabetisch. */
export function sortFolderScenarios(scenarios: Scenario[]): Scenario[] {
  return [...scenarios].sort((a, b) =>
    Number(!!b.chapters) - Number(!!a.chapters) || a.title.localeCompare(b.title, 'de'));
}
