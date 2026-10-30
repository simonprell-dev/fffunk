// Tasten von PoC-Funkgeräten in der Android-App (natives Plugin RadioKeysPlugin.java):
// Sprechtaste (PTT), Notruftaste (SOS) und Drehknopf zum Durchwählen der Auswahl.
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type RadioKey = 'ptt' | 'sos' | 'next' | 'prev' | 'select';

interface RadioKeysPlugin {
  addListener(event: 'key', listener: (e: { key: RadioKey; pressed: boolean }) => void): Promise<PluginListenerHandle>;
}

const RadioKeys = registerPlugin<RadioKeysPlugin>('RadioKeys');

export function hasRadioKeys(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('RadioKeys');
}

/** Meldet Tasten; liefert eine Abmeldefunktion (für useEffect). */
export function onRadioKey(listener: (key: RadioKey, pressed: boolean) => void): () => void {
  if (!hasRadioKeys()) return () => {};
  const handle = RadioKeys.addListener('key', e => listener(e.key, e.pressed));
  return () => { handle.then(h => h.remove()); };
}

// ---- Kanalwähler: durch die Knöpfe wählen, Knopfdruck bestätigt ----

const FOCUS_CLASS = 'knob-focus';

function candidates(): HTMLElement[] {
  // Offener Dialog hat Vorrang; sonst alles außer der Kopfzeile.
  const dialog = document.querySelector<HTMLElement>('.fixed.inset-0');
  const scope = dialog ?? document.body;
  return Array.from(scope.querySelectorAll<HTMLElement>('button, a[href], select')).filter(el =>
    el.offsetParent !== null &&
    !(el as HTMLButtonElement).disabled &&
    el.dataset.knob !== 'skip' &&
    (dialog || !el.closest('header')));
}

function move(step: 1 | -1) {
  const list = candidates();
  if (!list.length) return;
  const current = document.querySelector<HTMLElement>('.' + FOCUS_CLASS);
  current?.classList.remove(FOCUS_CLASS);
  const i = current ? list.indexOf(current) : -1;
  const next = list[i < 0 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length];
  next.classList.add(FOCUS_CLASS);
  next.focus({ preventScroll: true });
  next.scrollIntoView({ block: 'nearest' });
}

function select() {
  const current = document.querySelector<HTMLElement>('.' + FOCUS_CLASS);
  if (current && candidates().includes(current)) current.click();
}

export function initKnobNavigation(): void {
  onRadioKey((key, pressed) => {
    if (!pressed) return;
    if (key === 'next') move(1);
    else if (key === 'prev') move(-1);
    else if (key === 'select') select();
  });
}
