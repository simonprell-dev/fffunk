/**
 * Inhalte des Lernbereichs (Theorie). Jedes Kapitel hat eine Markdown-`body`,
 * die in `LernbereichView` mit react-markdown gerendert wird. Der Text wird
 * über `applyRufnamen` lokalisiert, sodass Beispiele die echten Rufnamen zeigen.
 *
 * Die `body`-Texte werden inhaltlich gegen die formalen Funkrichtlinien
 * (FwDV 2/7, vfdb 10/03, BOS-Sprechfunk) erstellt.
 */
export interface LernChapter {
  id: string;
  title: string;
  /** lucide-react Icon-Name (siehe ICON_MAP in LernbereichView). */
  icon: string;
  body: string;
}

export const lernChapters: LernChapter[] = [
  {
    id: 'grundlagen',
    title: 'Grundlagen BOS-Digitalfunk',
    icon: 'Radio',
    body: '### Grundlagen\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'sprechfunkverkehr',
    title: 'Sprechfunkverkehr & Verkehrsabwicklung',
    icon: 'MessagesSquare',
    body: '### Sprechfunkverkehr\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'buchstabieralphabet',
    title: 'Buchstabieralphabet & Zahlen',
    icon: 'Type',
    body: '### Buchstabieralphabet\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'fms-status',
    title: 'FMS-Statuskatalog 0–9',
    icon: 'ListOrdered',
    body: '### FMS-Status\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'funkrufnamen',
    title: 'Funkrufnamen-System',
    icon: 'Tag',
    body: '### Funkrufnamen\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'lagemeldung',
    title: 'Die Lagemeldung',
    icon: 'ClipboardList',
    body: '### Lagemeldung\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'mayday',
    title: 'Mayday / Notfallmeldung',
    icon: 'AlertTriangle',
    body: '### Mayday\n\n*(Inhalt wird erstellt.)*',
  },
  {
    id: 'funkdisziplin',
    title: 'Funkdisziplin & häufige Fehler',
    icon: 'ShieldCheck',
    body: '### Funkdisziplin\n\n*(Inhalt wird erstellt.)*',
  },
];
