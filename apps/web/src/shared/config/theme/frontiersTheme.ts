import type { ThemeDefinition } from 'vuetify'

/**
 * Frontiers brand theme (light) for Vuetify.
 *
 * Colors sourced from the extracted Frontiers brand tokens (see
 * `odd/tasks/frontend-ui.md`, "Brand tokens" section). Only design tokens live here —
 * no component logic, per the `shared` layer rule (no business logic).
 */
// `satisfies` (instead of a `: ThemeDefinition` annotation) keeps `colors` and
// `variables` required in the inferred type, since Vuetify's `ThemeDefinition` makes
// every field optional (it also accepts partial theme overrides).
export const frontiersTheme = {
  dark: false,
  colors: {
    primary: '#0C4DED',
    'primary-darken-1': '#003BDE',
    'primary-lighten-1': '#6D9EFD',
    'primary-lighten-5': '#EEF5FF',
    secondary: '#0024B0',
    background: '#F7F7F7',
    surface: '#FFFFFF',
    'on-surface': '#282828',
    'on-background': '#282828',
    success: '#00844A',
    error: '#DA2128',
    warning: '#F6921E',
    info: '#009FD1',
    'accent-teal': '#25BCBD',
    'accent-purple': '#712E74',
  },
  variables: {
    // Medium-emphasis text on light surfaces, consistent with the Frontiers neutral scale.
    'medium-emphasis-opacity': 1,
    'text-medium-emphasis': '#545454',
    'text-low-emphasis': '#6B6B6B',
  },
} satisfies ThemeDefinition

/**
 * Small, reusable glass-effect CSS tokens. The glass components themselves (GlassCard,
 * GlassButton, etc.) are built in a later task; only the raw values live here so both
 * that task and ad-hoc styling can share one source of truth.
 */
export const glassTokens = {
  blurRadius: '16px',
  surfaceAlpha: 0.14,
  borderAlpha: 0.25,
} as const
