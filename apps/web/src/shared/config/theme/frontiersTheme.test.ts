import { describe, expect, it } from 'vitest'
import { frontiersTheme } from './frontiersTheme'

describe('Given the frontiers Vuetify theme', () => {
  describe('When it is defined', () => {
    it('Then it is a light theme', () => {
      // Arrange / Act
      const { dark } = frontiersTheme

      // Assert
      expect(dark).toBe(false)
    })

    it('Then it exposes the glass-palette primary color', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors.primary).toBe('#4D1B7E')
    })

    it('Then it exposes solid, opaque toast semantic colors for success/warning/error', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert: chosen so white toast text/icons/close buttons stay
      // >= 4.5:1 (see `contrast.test.ts`), replacing the earlier
      // success/warning/error values that were tuned for glass surfaces,
      // not solid toast backgrounds (`odd/tasks/glass-palette.md`, T3).
      expect(colors.success).toBe('#15803D')
      expect(colors.warning).toBe('#B45309')
      expect(colors.error).toBe('#B91C1C')
    })

    it('Then white text/icons are guaranteed legible on every toast semantic color', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors['on-success']).toBe('#FFFFFF')
      expect(colors['on-warning']).toBe('#FFFFFF')
      expect(colors['on-error']).toBe('#FFFFFF')
    })

    it('Then it exposes the surface, background and on-surface colors', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors.background).toBe('#F4F4F6')
      expect(colors.surface).toBe('#FFFFFF')
      expect(colors['on-surface']).toBe('#17171C')
      expect(colors['on-background']).toBe('#17171C')
    })

    it('Then white text is guaranteed to be legible on the solid primary color', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors['on-primary']).toBe('#FFFFFF')
    })

    it('Then it exposes the glass-palette secondary color', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors.secondary).toBe('#DCDCF9')
    })

    it('Then it no longer exposes the retired brand-blue primary/accent variants', () => {
      // Arrange
      const colorKeys = Object.keys(frontiersTheme.colors)

      // Act / Assert
      expect(colorKeys).not.toContain('primary-darken-1')
      expect(colorKeys).not.toContain('primary-lighten-1')
      expect(colorKeys).not.toContain('primary-lighten-5')
      expect(colorKeys).not.toContain('accent-teal')
      expect(colorKeys).not.toContain('accent-purple')
    })

    it('Then it uses the foreground color for medium and low emphasis text so it stays readable on glass', () => {
      // Arrange
      const { variables } = frontiersTheme

      // Act / Assert
      expect(variables['text-medium-emphasis']).toBe('#17171C')
      expect(variables['text-low-emphasis']).toBe('#17171C')
    })
  })
})
