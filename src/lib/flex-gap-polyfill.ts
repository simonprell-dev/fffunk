// Flexbox-`gap` gibt es erst ab Chrome 84 – das Messe-Funkgerät (Android 9) hat Chrome 72.
// Ohne Unterstützung werden die Abstände als Außenabstand der Kinder nachgebildet
// (Hauptachse; bei flex-wrap zusätzlich oben für alle Zeilen außer der ersten).

const touched = new Map<HTMLElement, { prop: 'marginLeft' | 'marginRight' | 'marginTop' | 'marginBottom'; value: string }[]>();

function supportsFlexGap(): boolean {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  el.appendChild(document.createElement('div'));
  el.appendChild(document.createElement('div'));
  document.body.appendChild(el);
  const ok = el.scrollHeight === 1;
  el.remove();
  return ok;
}

function px(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function setMargin(child: HTMLElement, prop: 'marginLeft' | 'marginRight' | 'marginTop' | 'marginBottom', gap: number) {
  // Eigene Außenabstände (z. B. ml-auto) bleiben unangetastet.
  if (px(getComputedStyle(child)[prop]) !== 0) return;
  const value = `${gap}px`;
  child.style[prop] = value;
  const list = touched.get(child) ?? [];
  list.push({ prop, value });
  touched.set(child, list);
}

function reset() {
  touched.forEach((list, el) => {
    for (const { prop, value } of list) if (el.style[prop] === value) el.style[prop] = '';
  });
  touched.clear();
}

function apply() {
  reset();
  const all = document.body.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i] as HTMLElement;
    const cs = getComputedStyle(el);
    if (cs.display !== 'flex' && cs.display !== 'inline-flex') continue;
    const colGap = px(cs.columnGap);
    const rowGap = px(cs.rowGap);
    if (!colGap && !rowGap) continue;
    const column = cs.flexDirection.startsWith('column');
    const reverse = cs.flexDirection.endsWith('reverse');
    const mainGap = column ? rowGap : colGap;
    const mainProp = column ? (reverse ? 'marginBottom' : 'marginTop') : (reverse ? 'marginRight' : 'marginLeft');
    const items = Array.from(el.children).filter((c): c is HTMLElement => {
      if (!(c instanceof HTMLElement)) return false;
      const s = getComputedStyle(c);
      return s.display !== 'none' && s.position !== 'absolute' && s.position !== 'fixed';
    });
    if (items.length < 2) continue;
    const firstTop = items[0].offsetTop;
    const firstLeft = items[0].offsetLeft;
    items.forEach((item, idx) => {
      if (idx === 0) return;
      // Bei Umbruch: erstes Element einer neuen Zeile bekommt keinen seitlichen Abstand.
      const newLine = column ? item.offsetLeft !== firstLeft && item.offsetTop <= items[idx - 1].offsetTop
                             : item.offsetTop > items[idx - 1].offsetTop + 1;
      if (mainGap && !newLine) setMargin(item, mainProp, mainGap);
      if (cs.flexWrap !== 'nowrap' && !column && rowGap && item.offsetTop > firstTop + 1) setMargin(item, 'marginTop', rowGap);
    });
  }
}

export function initFlexGapPolyfill() {
  if (typeof document === 'undefined' || supportsFlexGap()) return;
  document.documentElement.classList.add('no-flexgap');
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      observer.disconnect();
      apply();
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule);
  schedule();
}
