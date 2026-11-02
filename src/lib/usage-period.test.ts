// Zeitraum-Filter der Admin-Statistik: Monat, Jahr, letzte Tage, gesamt, frei.
import { describe, expect, it } from 'vitest';
// @ts-expect-error – reines JS-Modul aus scripts/, im Admin-Bereich des Servers genutzt
import { resolvePeriod, toCsv } from '../../scripts/usage-period.mjs';

const today = '2026-11-02';

describe('resolvePeriod', () => {
  it('zeigt ohne Auswahl den laufenden Monat', () => {
    expect(resolvePeriod({}, today)).toMatchObject({ zeitraum: 'monat', from: '2026-11-01', to: '2026-11-30', label: 'November 2026', bucket: 'day' });
  });

  it('nimmt einen gewählten Monat bis zu dessen letztem Tag', () => {
    expect(resolvePeriod({ zeitraum: 'monat', monat: '2024-02' }, today)).toMatchObject({ from: '2024-02-01', to: '2024-02-29', label: 'Februar 2024' });
  });

  it('nimmt ein ganzes Jahr und gruppiert nach Monaten', () => {
    expect(resolvePeriod({ zeitraum: 'jahr', jahr: '2025' }, today)).toMatchObject({ from: '2025-01-01', to: '2025-12-31', label: 'Jahr 2025', bucket: 'month' });
  });

  it('rechnet die letzten 7 und 30 Tage einschließlich heute', () => {
    expect(resolvePeriod({ zeitraum: '7' }, today)).toMatchObject({ from: '2026-10-27', to: today, label: 'Letzte 7 Tage' });
    expect(resolvePeriod({ zeitraum: '30' }, today)).toMatchObject({ from: '2026-10-04', to: today, label: 'Letzte 30 Tage' });
  });

  it('kennt „gesamt“ ohne Grenzen', () => {
    expect(resolvePeriod({ zeitraum: 'gesamt' }, today)).toMatchObject({ from: null, to: null, label: 'Gesamter Zeitraum', bucket: 'month' });
  });

  it('nimmt einen freien Zeitraum, vertauschte Grenzen werden getauscht', () => {
    expect(resolvePeriod({ zeitraum: 'frei', von: '2026-03-10', bis: '2026-03-01' }, today))
      .toMatchObject({ from: '2026-03-01', to: '2026-03-10', label: '01.03.2026 – 10.03.2026', bucket: 'day' });
    expect(resolvePeriod({ zeitraum: 'frei', von: '2025-01-01', bis: '2026-01-01' }, today)).toMatchObject({ bucket: 'month' });
  });

  it('fällt bei ungültigen Angaben auf den laufenden Monat zurück', () => {
    for (const q of [{ zeitraum: 'monat', monat: '2026-13' }, { zeitraum: 'jahr', jahr: "1'; DROP" }, { zeitraum: 'frei', von: 'x' }, { zeitraum: 'quatsch' }]) {
      expect(resolvePeriod(q, today)).toMatchObject({ zeitraum: 'monat', from: '2026-11-01', to: '2026-11-30' });
    }
  });
});

describe('toCsv', () => {
  it('trennt mit Semikolon für Excel und maskiert Anführungszeichen und Trenner', () => {
    expect(toCsv([['Lizenz', 'Gestartet'], ['FF "Nord"; Ost', 3]])).toBe('﻿Lizenz;Gestartet\r\n"FF ""Nord""; Ost";3\r\n');
  });
});
