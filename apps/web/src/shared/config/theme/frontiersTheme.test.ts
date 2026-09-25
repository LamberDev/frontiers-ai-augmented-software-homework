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

    it('Then it exposes the brand primary, error and success colors', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors.primary).toBe('#0C4DED')
      expect(colors.error).toBe('#DA2128')
      expect(colors.success).toBe('#00844A')
    })

    it('Then it exposes the surface, background and on-surface colors', () => {
      // Arrange
      const { colors } = frontiersTheme

      // Act / Assert
      expect(colors.background).toBe('#F7F7F7')
      expect(colors.surface).toBe('#FFFFFF')
      expect(colors['on-surface']).toBe('#282828')
      expect(colors['on-background']).toBe('#282828')
    })
  })
})
