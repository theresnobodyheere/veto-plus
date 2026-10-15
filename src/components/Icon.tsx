// Icônes au trait, dessinées dans l'esprit des SF Symbols (graisse « regular », 24 × 24).
// Elles héritent de la couleur du texte (currentColor) et suivent donc le mode clair / sombre.

const PATHS = {
  // Onglets
  cas: 'M9 3h6v4h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4V3zM12 10.5v6M9 13.5h6M9 7h6',
  historique: 'M12 21a9 9 0 1 0-9-9M3 5v4h4M12 7.5V12l3 2',
  medicaments: 'M10.6 3.9a4.5 4.5 0 0 1 6.4 6.4l-6.7 6.7a4.5 4.5 0 0 1-6.4-6.4l6.7-6.7zM7.3 7.2l6.4 6.4',
  outils: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 17h6M17 14v6',
  reglages: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7.6 7.6 0 0 1-2 1.2l-.3 2H11l-.3-2a7.6 7.6 0 0 1-2-1.2l-1.9.7-2-3.4 1.6-1.2a7.7 7.7 0 0 1 0-3L4.8 9.3l2-3.4 1.9.7a7.6 7.6 0 0 1 2-1.2l.3-2h4l.3 2a7.6 7.6 0 0 1 2 1.2l1.9-.7 2 3.4-1.6 1.2a7.7 7.7 0 0 1 0 3z',
  // Actions
  chevronRight: 'M9.5 5.5 16 12l-6.5 6.5',
  chevronLeft: 'M15 4.5 7.5 12l7.5 7.5',
  chevronDown: 'M5.5 9.5 12 16l6.5-6.5',
  plus: 'M12 5v14M5 12h14',
  xmark: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  camera: 'M4 8h3l1.8-2.5h6.4L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 15.5h6M9 9h2',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3',
  trash: 'M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10.5 10v7M13.5 10v7',
  share: 'M12 3v12M8 7l4-4 4 4M7 10H5v11h14V10h-2',
  pencil: 'M15.5 4.5l4 4L9 19H5v-4L15.5 4.5z',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.3 15.3 20 20',
  refresh: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4h-4',
  // États
  warning: 'M12 4 21.5 20h-19L12 4zM12 10v4.5M12 17.4v.1',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.6v.1',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3z',
  wifiOff: 'M3 3l18 18M8.5 16.4a5 5 0 0 1 5.6-.8M5.2 13a9.5 9.5 0 0 1 4.3-2.3M2 9.6a14 14 0 0 1 5-3M12 20h.01M16 10.9a9.5 9.5 0 0 1 2.8 2.1M12.6 5.5A14 14 0 0 1 22 9.6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  flask: 'M9.5 3h5M10 3v6.5L4.8 18.6A1.6 1.6 0 0 0 6.2 21h11.6a1.6 1.6 0 0 0 1.4-2.4L14 9.5V3M7.5 15h9',
  map: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  filter: 'M4 6h16M7 12h10M10 18h4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  phone: 'M6.5 3.5h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, class: cls, label }: { name: IconName; size?: number; class?: string; label?: string }) {
  return (
    <svg class={`icon ${cls ?? ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label}>
      <path d={PATHS[name]} />
    </svg>
  );
}
