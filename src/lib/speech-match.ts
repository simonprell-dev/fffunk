// Vergleich von erkanntem und erwartetem Funkspruch – unabhängig von der Spracherkennung.
// Zahlen werden einheitlich als Ziffern verglichen („zweihundertneunzig“ = „290“),
// Komposita und Ziffernfolgen auch ohne Leerzeichen („vier vier eins“ = „44/1“).

const UNITS: Record<string, number> = {
  null: 0, ein: 1, eins: 1, eine: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
};
const TEENS: Record<string, number> = {
  zehn: 10, elf: 11, zwolf: 12, dreizehn: 13, vierzehn: 14, funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
};
const TENS: Record<string, number> = {
  zwanzig: 20, dreissig: 30, vierzig: 40, funfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90,
};

function below100(w: string): number | null {
  if (w in UNITS) return UNITS[w];
  if (w in TEENS) return TEENS[w];
  if (w in TENS) return TENS[w];
  const m = w.match(/^(ein|zwei|drei|vier|funf|sechs|sieben|acht|neun)und(\w+)$/);
  if (m && m[2] in TENS) return UNITS[m[1]] + TENS[m[2]];
  return null;
}

function below1000(w: string): number | null {
  const i = w.indexOf('hundert');
  if (i < 0) return below100(w);
  const head = w.slice(0, i);
  const h = head === '' ? 1 : UNITS[head];
  if (h === undefined || h === 0) return null;
  const tail = w.slice(i + 'hundert'.length).replace(/^und/, '');
  if (!tail) return h * 100;
  const t = below100(tail);
  return t === null ? null : h * 100 + t;
}

/** „zweihundertneunzig“ → 290; kein Zahlwort → null. Erwartet Kleinbuchstaben ohne Umlaute. */
export function parseNumberWord(w: string): number | null {
  const i = w.indexOf('tausend');
  if (i < 0) return below1000(w);
  const head = w.slice(0, i);
  const k = head === '' ? 1 : below100(head);
  if (k === null || k === 0) return null;
  const tail = w.slice(i + 'tausend'.length).replace(/^und/, '');
  if (!tail) return k * 1000;
  const t = below1000(tail);
  return t === null ? null : k * 1000 + t;
}

function stripAccents(value: string): string {
  return value.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function normalizeSpeech(value: string): string {
  const words = stripAccents(value).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    const n = parseNumberWord(w);
    if (n === null) { out.push(w); continue; }
    // „zweihundert neunzig“ / „vierzehn hundert“ getrennt erkannt → zusammenfassen
    const prev = out.length ? Number(out[out.length - 1]) : NaN;
    if (!Number.isNaN(prev) && prev >= 100 && prev % 100 === 0 && n < 100) out[out.length - 1] = String(prev + n);
    else if (!Number.isNaN(prev) && prev > 0 && prev < 100 && (w === 'hundert' || w === 'tausend')) out[out.length - 1] = String(prev * n);
    else out.push(String(n));
  }
  return out.join(' ');
}

export function phraseMatches(spokenText: string, phrase: string): boolean {
  const spoken = normalizeSpeech(spokenText);
  const expected = normalizeSpeech(phrase);
  if (!expected) return false;
  if (spoken.includes(expected)) return true;
  // Komposita („atemschutz überwachung“) und Ziffernfolgen („4 4 1“ = „44 1“)
  if (spoken.replace(/ /g, '').includes(expected.replace(/ /g, ''))) return true;
  const spokenWords = spoken.split(' ');
  const expectedWords = expected.split(' ').filter(word => word.length > 1);
  if (expectedWords.length <= 1) return spokenWords.includes(expected);
  return expectedWords.every(word => spokenWords.includes(word));
}

// ---- Wortliste für die Offline-Erkennung (Vosk erkennt dann nur diese Wörter) ----

const DIGIT_WORDS = ['null', 'eins', 'zwei', 'zwo', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const ONES = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
const TEEN_WORDS = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TEN_WORDS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

export function numberToWords(n: number): string {
  if (n < 10) return DIGIT_WORDS[n === 1 ? 1 : n >= 3 ? n + 1 : n];
  if (n < 20) return TEEN_WORDS[n - 10];
  if (n < 100) return (n % 10 ? ONES[n % 10] + 'und' : '') + TEN_WORDS[Math.floor(n / 10)];
  if (n < 1000) return (n >= 200 ? ONES[Math.floor(n / 100)] : 'ein') + 'hundert' + (n % 100 ? numberToWords(n % 100) : '');
  return (n >= 2000 ? numberToWords(Math.floor(n / 1000)) : 'ein') + 'tausend' + (n % 1000 ? numberToWords(n % 1000) : '');
}

// Funkbetriebswörter, die in fast jedem Spruch vorkommen können
const RADIO_WORDS = [
  'kommen', 'ende', 'verstanden', 'hier', 'von', 'an', 'alle', 'für', 'mit', 'und', 'nicht', 'bitte',
  'wiederholen', 'richtig', 'frage', 'uhr', 'strich', 'komma', 'bar', 'minuten', 'meter',
];

/**
 * Wortschatz für die Erkennung eines Funkspruchs: Wörter aus Muster und Schlüsselbegriffen,
 * Zahlen als Zahlwort und Ziffernfolge, dazu Funkbetriebswörter und „[unk]“ für alles Übrige.
 */
export function speechGrammar(texts: string[], splits: Record<string, string> = {}): string[] {
  const words = new Set<string>([...RADIO_WORDS, ...DIGIT_WORDS]);
  const add = (word: string) => (splits[word] ?? word).split(' ').forEach(w => words.add(w));
  for (const text of texts) {
    for (const raw of text.toLowerCase().split(/[^a-zäöüß0-9]+/)) {
      if (!raw) continue;
      if (/^\d+$/.test(raw)) {
        const n = Number(raw);
        if (n < 10000) {
          add(numberToWords(n));
          if (n >= 100 && n < 200) add(numberToWords(n).replace(/^ein/, '')); // „hundertvierzig“
        }
        for (const d of raw) words.add(DIGIT_WORDS[Number(d) >= 3 ? Number(d) + 1 : Number(d)]);
        continue;
      }
      if (/\d/.test(raw)) continue;
      add(raw);
    }
  }
  return [...words, '[unk]'];
}
