import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initCompactMode } from './lib/display-mode';
import { initFlexGapPolyfill } from './lib/flex-gap-polyfill';
import { initKnobNavigation } from './lib/radio-keys';
import { trackEvent } from './lib/usage-stats';

initCompactMode();
initFlexGapPolyfill();
initKnobNavigation();
trackEvent('app_open');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
