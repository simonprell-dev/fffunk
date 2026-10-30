// Sprachausgabe über Android (natives Plugin RadioTtsPlugin.java) – Ersatz, wenn der Server nicht erreichbar ist.
import { Capacitor, registerPlugin } from '@capacitor/core';

interface RadioTtsPlugin {
  speak(options: { text: string }): Promise<void>;
  stop(): Promise<void>;
}

export const RadioTts = registerPlugin<RadioTtsPlugin>('RadioTts');

export function isNativeTtsAvailable(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('RadioTts');
}
