export const colors = {
  // Backgrounds
  bg:           '#0A0D14',
  bgCard:       '#0F1420',
  bgSubtle:     '#151C2C',
  bgHover:      '#1A2236',

  // Text
  text:         '#E2E6EF',
  textMuted:    '#5B6478',
  textFaint:    '#2E3A4F',

  // Accent — single blue, no green
  accent:       '#3B7EF6',
  accentHover:  '#5B94F8',
  accentDim:    'rgba(59,126,246,0.10)',
  accentFaint:  'rgba(59,126,246,0.06)',

  // Semantic (data only — not UI chrome)
  success:      '#10B981',   // positive metrics / won deals only
  warning:      '#F59E0B',   // pending / at-risk
  danger:       '#EF4444',   // lost / error

  // Borders & dividers
  border:       'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.10)',
} as const;
