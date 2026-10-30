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
});
