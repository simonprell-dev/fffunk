import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';
import { initCompactMode } from './lib/display-mode';
import { initFlexGapPolyfill } from './lib/flex-gap-polyfill';
import { initKnobNavigation } from './lib/radio-keys';
import { trackEvent } from './lib/usage-stats';

// Wegweiser zu den Lernseiten nur im Browser – in der App führen die Links ins Leere.
if (Capacitor.isNativePlatform()) document.getElementById('site-links')?.remove();

initCompactMode();
initFlexGapPolyfill();
initKnobNavigation();
trackEvent('app_open');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
