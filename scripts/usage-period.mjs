// Zeitraum-Filter und CSV-Export der Admin-Statistik.

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const iso = d => d.toISOString().slice(0, 10);
const addDays = (day, n) => iso(new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000));
const deDate = day => day.split('-').reverse().join('.');
const isDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') && iso(new Date(s + 'T00:00:00Z')) === s;

function monthPeriod(ym) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { zeitraum: 'monat', monat: ym, from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}`, label: `${MONATE[m - 1]} ${y}` };
}

/**
 * Wandelt die Filter-Parameter (zeitraum = monat | jahr | 7 | 30 | gesamt | frei) in einen Datumsbereich.
 * from/to sind inklusive (YYYY-MM-DD), bei „gesamt“ null. bucket: Verlauf nach Tag oder Monat.
 */
export function resolvePeriod(q, today) {
  let p = null;
  if ((q.zeitraum ?? 'monat') === 'monat') {
    const ym = q.monat ?? today.slice(0, 7);
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) p = monthPeriod(ym);
  } else if (q.zeitraum === 'jahr' && /^\d{4}$/.test(q.jahr ?? '')) {
    p = { zeitraum: 'jahr', jahr: q.jahr, from: `${q.jahr}-01-01`, to: `${q.jahr}-12-31`, label: `Jahr ${q.jahr}` };
  } else if (q.zeitraum === '7' || q.zeitraum === '30') {
    p = { zeitraum: q.zeitraum, from: addDays(today, 1 - Number(q.zeitraum)), to: today, label: `Letzte ${q.zeitraum} Tage` };
  } else if (q.zeitraum === 'gesamt') {
    p = { zeitraum: 'gesamt', from: null, to: null, label: 'Gesamter Zeitraum' };
  } else if (q.zeitraum === 'frei' && isDay(q.von) && isDay(q.bis)) {
    const [from, to] = [q.von, q.bis].sort();
    p = { zeitraum: 'frei', from, to, label: `${deDate(from)} – ${deDate(to)}` };
  }
  p ??= monthPeriod(today.slice(0, 7));
  const span = p.from ? (Date.parse(p.to) - Date.parse(p.from)) / 86400000 : Infinity;
  return { ...p, bucket: span <= 62 ? 'day' : 'month' };
}

/** CSV für Excel (deutsch): Semikolon, BOM, CRLF. */
export function toCsv(rows) {
  const cell = v => {
    const s = String(v ?? '');
    return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(';') + '\r\n').join('');
}
