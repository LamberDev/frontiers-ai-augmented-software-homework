/**
 * Pure WCAG 2.2 contrast-ratio math, with no Vuetify/DOM dependency, used by
 * `contrast.test.ts` to verify the glass-palette tokens in `frontiersTheme.ts`
 * meet AA visibility (see `odd/tasks/glass-palette.md`, "Palette" table).
 * Kept local to this segment (not re-exported through `shared/config`'s
 * public API) since only this slice's own tests need it today.
 */

type Rgb = readonly [red: number, green: number, blue: number]

function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return [red, green, blue]
}

// WCAG 2.2 sRGB relative-luminance transfer function for one 0-255 channel.
function linearizeChannel(channel: number): number {
  const fraction = channel / 255
  return fraction <= 0.03928 ? fraction / 12.92 : Math.pow((fraction + 0.055) / 1.055, 2.4)
}

function relativeLuminance([red, green, blue]: Rgb): number {
  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  )
}

/**
 * WCAG 2.2 contrast ratio (from 1 to 21) between two `#rrggbb` colors.
 * Order-independent: the lighter color's luminance is always the numerator.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const luminanceA = relativeLuminance(hexToRgb(hexA))
  const luminanceB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Composites `whiteAlpha` of opaque white over `hex` (source-over), returning the
 * resulting `#RRGGBB`. Models a translucent white glass surface over a solid color.
 */
export function blendWithWhite(hex: string, whiteAlpha: number): string {
  const blended = hexToRgb(hex).map((channel) =>
    Math.round(channel * (1 - whiteAlpha) + 255 * whiteAlpha),
  )
  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}
