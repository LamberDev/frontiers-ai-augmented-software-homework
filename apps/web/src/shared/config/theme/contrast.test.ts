import { describe, expect, it } from 'vitest'
import { frontiersTheme, glassTokens } from './frontiersTheme'
import { blendWithWhite, contrastRatio } from './contrast'

const WHITE = '#FFFFFF'

// Ring focus-outline color (hsl(270 60% 50%) — see `odd/tasks/glass-palette.md`, "Palette"
// table); not a Vuetify theme color, so it is not read from `frontiersTheme`, only mirrored
// here as the literal used in `AppHeader.vue`'s `:focus-visible` outline.
const RING = '#8033CC'

const GRADIENT_STOPS = [
  ['gradient-start', '#A670DB'],
  ['gradient-middle', '#7D7DE8'],
  ['gradient-end', '#E29CCB'],
] as const

describe('Given the contrastRatio helper', () => {
  describe('When comparing known reference colors', () => {
    it('Then black vs white is the maximum WCAG ratio (21:1)', () => {
      // Arrange
      const black = '#000000'

      // Act
      const ratio = contrastRatio(black, WHITE)

      // Assert
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('Then a color against itself is the minimum ratio (1:1)', () => {
      // Arrange
      const color = '#4D1B7E'

      // Act
      const ratio = contrastRatio(color, color)

      // Assert
      expect(ratio).toBeCloseTo(1, 5)
    })

    it('Then the ratio is order-independent', () => {
      // Arrange
      const a = '#4D1B7E'
      const b = '#A670DB'

      // Act
      const ratioAB = contrastRatio(a, b)
      const ratioBA = contrastRatio(b, a)

      // Assert
      expect(ratioAB).toBe(ratioBA)
    })
  })
})

describe('Given the blendWithWhite helper', () => {
  describe('When blending a color with white at a given alpha', () => {
    it('Then alpha 0 keeps the color and alpha 1 yields white', () => {
      // Arrange
      const color = '#A670DB'

      // Act
      const unchanged = blendWithWhite(color, 0)
      const white = blendWithWhite(color, 1)

      // Assert
      expect(unchanged).toBe('#A670DB')
      expect(white).toBe(WHITE)
    })
  })
})

describe('Given the glass-palette theme tokens', () => {
  describe('When checking the WCAG 2.2 AA contrast pairs required by the palette', () => {
    const { colors, variables } = frontiersTheme

    it('Then foreground text on the white surface is >= 4.5:1', () => {
      // Arrange
      const foreground = colors['on-surface']

      // Act
      const ratio = contrastRatio(foreground, WHITE)

      // Assert
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    // Text on a `.glass-surface` sits on 12 % white composited over the page gradient,
    // not on opaque white, so every text token must clear 4.5:1 against that blend.
    const textTokens = [
      ['on-surface', colors['on-surface']],
      ['text-medium-emphasis', variables['text-medium-emphasis']],
      ['text-low-emphasis', variables['text-low-emphasis']],
    ] as const
    const textOnGlassCases = textTokens.flatMap(([tokenName, tokenColor]) =>
      GRADIENT_STOPS.map(([stopName, stopColor]) => [tokenName, stopName, tokenColor, stopColor]),
    )

    it.each(textOnGlassCases)(
      'Then %s text on the glass surface over the %s gradient stop is >= 4.5:1',
      (_tokenName, _stopName, tokenColor, stopColor) => {
        // Arrange
        const glassBackground = blendWithWhite(stopColor, glassTokens.surfaceAlpha)

        // Act
        const ratio = contrastRatio(tokenColor, glassBackground)

        // Assert
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      },
    )

    it('Then white text on the solid primary color is >= 4.5:1', () => {
      // Arrange
      const primary = colors.primary

      // Act
      const ratio = contrastRatio(WHITE, primary)

      // Assert
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it.each(GRADIENT_STOPS)(
      'Then the primary color vs the %s gradient stop is >= 3:1',
      (_name, gradientStop) => {
        // Arrange
        const primary = colors.primary

        // Act
        const ratio = contrastRatio(primary, gradientStop)

        // Assert
        expect(ratio).toBeGreaterThanOrEqual(3)
      },
    )

    it('Then the ring focus color vs the white surface is >= 3:1', () => {
      // Act
      const ratio = contrastRatio(RING, WHITE)

      // Assert
      expect(ratio).toBeGreaterThanOrEqual(3)
    })

    // Toast semantic colors (T3, `odd/tasks/glass-palette.md`): success/warning/error toasts
    // render solid (opaque) backgrounds with white text/icons/close buttons, so each one must
    // clear the 4.5:1 AA text threshold against white — read from `frontiersTheme` itself
    // (not duplicated literals) so this test and the theme can never drift apart.
    const toastColors = [
      ['success', colors.success],
      ['warning', colors.warning],
      ['error', colors.error],
    ] as const

    it.each(toastColors)(
      'Then white text on the solid %s toast background is >= 4.5:1',
      (_name, color) => {
        // Act
        const ratio = contrastRatio(WHITE, color)

        // Assert
        expect(ratio).toBeGreaterThanOrEqual(4.5)
      },
    )
  })
})
