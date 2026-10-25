// Kompaktansicht für sehr kleine Displays (z. B. 2,4"-Funkgerät mit 240×320).
// Setzt die Klasse `compact` auf <html>; Styles dazu: index.css und Tailwind-Variante `compact:`.

export type CompactSetting = 'auto' | 'on' | 'off';

const KEY = 'fffunk.compact';

function isSmallScreen(): boolean {
  return window.innerWidth <= 360 && window.innerHeight <= 540;
}

export function getCompactSetting(): CompactSetting {
  try {
    const param = new URLSearchParams(window.location.search).get('compact');
    if (param === '1') localStorage.setItem(KEY, 'on');
    else if (param === '0') localStorage.setItem(KEY, 'off');
    else if (param === 'auto') localStorage.removeItem(KEY);
    const v = localStorage.getItem(KEY);
    return v === 'on' || v === 'off' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function setCompactSetting(value: CompactSetting): void {
  try {
    if (value === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch { /* ignore */ }
  applyCompactMode();
}

export function applyCompactMode(): void {
  const setting = getCompactSetting();
  const compact = setting === 'on' || (setting === 'auto' && isSmallScreen());
  document.documentElement.classList.toggle('compact', compact);
}

export function initCompactMode(): void {
  applyCompactMode();
  window.addEventListener('resize', applyCompactMode);
}
