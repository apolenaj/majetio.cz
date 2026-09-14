/**
 * Majetio design tokens — semantic names for components.
 * CSS variables in globals.css are the runtime source of truth.
 */

export const colorTokens = {
  backgroundPrimary: "var(--background-primary)",
  backgroundSecondary: "var(--background-secondary)",
  surfacePrimary: "var(--surface-primary)",
  surfaceElevated: "var(--surface-elevated)",
  surfaceSunken: "var(--surface-sunken)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  textInverse: "var(--text-inverse)",
  borderDefault: "var(--border-default)",
  borderStrong: "var(--border-strong)",
  actionPrimary: "var(--action-primary)",
  actionPrimaryHover: "var(--action-primary-hover)",
  actionAccent: "var(--action-accent)",
  statusSuccess: "var(--status-success)",
  statusWarning: "var(--status-warning)",
  statusError: "var(--status-error)",
  statusInfo: "var(--status-info)",
  dataVerified: "var(--data-verified)",
  dataEstimated: "var(--data-estimated)",
  dataStale: "var(--data-stale)",
  dataMissing: "var(--data-missing)",
  investmentPositive: "var(--investment-positive)",
  investmentNegative: "var(--investment-negative)",
  riskLow: "var(--risk-low)",
  riskMedium: "var(--risk-medium)",
  riskHigh: "var(--risk-high)",
  riskCritical: "var(--risk-critical)",
  focusRing: "var(--focus-ring)",
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
} as const;

export const spaceScale = {
  0: "0",
  1: "0.25rem", // 4
  2: "0.5rem", // 8
  3: "0.75rem", // 12
  4: "1rem", // 16
  5: "1.25rem", // 20
  6: "1.5rem", // 24
  8: "2rem", // 32
  10: "2.5rem", // 40
  12: "3rem", // 48
  16: "4rem", // 64
  20: "5rem", // 80
  24: "6rem", // 96
} as const;

export const radiusTokens = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  card: "var(--radius-card)",
  dialog: "var(--radius-dialog)",
  pill: "var(--radius-pill)",
  full: "9999px",
} as const;

export const shadowTokens = {
  flat: "none",
  raised: "var(--shadow-raised)",
  overlay: "var(--shadow-overlay)",
  modal: "var(--shadow-modal)",
  sticky: "var(--shadow-sticky)",
} as const;

export const zIndexTokens = {
  base: 0,
  raised: 10,
  sticky: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
  skipLink: 100,
} as const;

export const motionTokens = {
  durationFast: "var(--duration-fast)",
  durationNormal: "var(--duration-normal)",
  durationSlow: "var(--duration-slow)",
  easeStandard: "var(--ease-standard)",
  easeEnter: "var(--ease-enter)",
  easeExit: "var(--ease-exit)",
} as const;

export const layoutTokens = {
  contentMarketing: "72rem", // max-w-6xl
  contentDashboard: "80rem",
  contentForm: "40rem",
  contentArticle: "42rem",
  contentNarrow: "36rem",
} as const;

export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
  "3xl": 1920,
} as const;

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Chart palette — limited set, never rainbow. */
export const chartPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;
