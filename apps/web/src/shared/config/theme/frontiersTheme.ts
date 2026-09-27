import type { ThemeDefinition } from 'vuetify'

/**
 * Glassmorphic violet -> indigo -> pink theme (light) for Vuetify, replacing the
 * earlier Frontiers brand-blue palette.
 *
 * Colors sourced from the glass palette (see `odd/tasks/glass-palette.md`, "Palette"
 * table, HSL -> hex). Only design tokens live here — no component logic, per the
 * `shared` layer rule (no business logic). The retired brand-blue `primary-darken-1` /
 * `primary-lighten-1` / `primary-lighten-5` / `accent-teal` / `accent-purple` variants
 * are dropped rather than re-derived: none of them were referenced by any component
 * (verified with a grep across `src`), so keeping palette-consistent guesses for them
 * would be unused, untested surface area.
 */
// `satisfies` (instead of a `: ThemeDefinition` annotation) keeps `colors` and
// `variables` required in the inferred type, since Vuetify's `ThemeDefinition` makes
// every field optional (it also accepts partial theme overrides).
export const frontiersTheme = {
  dark: false,
  colors: {
    primary: '#4D1B7E',
    'on-primary': '#FFFFFF',
    secondary: '#DCDCF9',
    // Vuetify's own "background" token (e.g. `<v-app>`'s default surface); the visible
    // page background is `GlassShell`'s fixed gradient instead (see `App.vue`, which sets
    // `.v-application { background: transparent; }`), so this only matters for any
    // Vuetify surface that does render it directly. Mapped to the palette's neutral
    // "muted" tone.
    background: '#F4F4F6',
    surface: '#FFFFFF',
    'on-surface': '#17171C',
    'on-background': '#17171C',
    // Success/warning/error are the *toast* semantic colors (see
    // `shared/ui/molecules/ToastStack`, T3 in `odd/tasks/glass-palette.md`): solid,
    // opaque backgrounds (not the `.glass-surface` translucency used elsewhere), each
    // verified >= 4.5:1 against white text/icons/close buttons in `contrast.test.ts`.
    // The earlier values (`#00844A`/`#F6921E`/`#EF4444`) were chosen for the old inline
    // (non-toast) alert presentation and are superseded, not layered alongside these.
    success: '#15803D',
    warning: '#B45309',
    error: '#B91C1C',
    'on-success': '#FFFFFF',
    'on-warning': '#FFFFFF',
    'on-error': '#FFFFFF',
    info: '#009FD1',
  },
  variables: {
    // Medium/low-emphasis text renders on translucent glass over the page gradient, where
    // the palette's muted-foreground (#6D6D78) drops to ~1.7:1. Use the foreground color
    // instead (>= 6:1 on every gradient stop); hierarchy comes from size and weight.
    'medium-emphasis-opacity': 1,
    'text-medium-emphasis': '#17171C',
    'text-low-emphasis': '#17171C',
  },
} satisfies ThemeDefinition

/**
 * Small, reusable glass-effect CSS tokens, mirrored as CSS custom properties in
 * `shared/ui/styles/glass.css` (single source of truth for the raw numbers).
 */
export const glassTokens = {
  blurRadius: '16px',
  surfaceAlpha: 0.12,
  borderAlpha: 0.35,
} as const
