import { describe, expect, it } from 'vitest';
import { applyRufnamen } from './rufnamen';

describe('applyRufnamen', () => {
  it('ersetzt Rufnamen laut Lizenz', () => {
    expect(applyRufnamen('Hier Florian Neuhaus 17/42/1 – kommen', { 'Florian Neuhaus 17/42/1': 'Florian Musterstadt 40/1' }))
      .toBe('Hier Florian Musterstadt 40/1 – kommen');
  });

  it('wendet alte Lizenz-Zuordnungen für 44/1 auf den neuen Rufnamen 17/42/1 an', () => {
    expect(applyRufnamen('Hier Florian Neuhaus 17/42/1 – kommen', { 'Florian Neuhaus 44/1': 'Florian Musterstadt 40/1' }))
      .toBe('Hier Florian Musterstadt 40/1 – kommen');
  });

  it('lässt Texte ohne Zuordnung unverändert', () => {
    expect(applyRufnamen('Florian Adelsdorf 44/1', {})).toBe('Florian Adelsdorf 44/1');
  });

  it('ersetzt in einem Durchgang – ein eingesetzter Name wird nicht noch einmal ersetzt', () => {
    // Wehr Neuhaus wird zu Adelsdorf, der Nachbarort Adelsdorf zu Höchstadt
    expect(applyRufnamen('Florian Neuhaus fährt nach Adelsdorf', {
      'Florian Neuhaus': 'Florian Adelsdorf',
      'Adelsdorf': 'Höchstadt',
    })).toBe('Florian Adelsdorf fährt nach Höchstadt');
  });

  it('bevorzugt den längeren Begriff an derselben Stelle', () => {
    expect(applyRufnamen('Heros Erlangen 22/51 in Neuhaus', { 'Neuhaus': 'Aisch', 'Heros Erlangen': 'Heros Forchheim' }))
      .toBe('Heros Forchheim 22/51 in Aisch');
  });

  it('wendet eine alte „Leitstelle=…“-Zuordnung auf die ganze Leitstelle an', () => {
    expect(applyRufnamen('Leitstelle Nürnberg von Rotkreuz Höchstadt 71/1', { Leitstelle: 'ILS Bamberg' }))
      .toBe('ILS Bamberg von Rotkreuz Höchstadt 71/1');
  });
});
