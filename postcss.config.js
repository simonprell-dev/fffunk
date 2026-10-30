// Chrome 72 (Messe-Funkgerät) kennt kein :where() und verwirft sonst ganze Preflight-Regeln
// (z. B. den transparenten Button-Hintergrund). :where(X) → X ändert nur die Spezifität.
const unwrapWhere = {
  postcssPlugin: 'unwrap-where',
  Rule(rule) {
    if (rule.selector.includes(':where(')) {
      rule.selector = rule.selector.replace(/:where\(((?:[^()]|\([^()]*\))*)\)/g, '$1');
    }
  },
}

export default {
  plugins: [
    (await import('tailwindcss')).default,
    unwrapWhere,
    (await import('autoprefixer')).default,
  ],
}
