import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('Given the shared/config apiUrl resolver', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('When VITE_API_URL is set', () => {
    it('Then it returns the configured value', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')

      // Act
      const { getApiUrl } = await import('./apiUrl')
      const result = getApiUrl()

      // Assert
      expect(result).toBe('https://api.example.test')
    })
  })

  describe('When VITE_API_URL is missing', () => {
    it('Then it throws a descriptive configuration error', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', undefined)

      // Act
      const { getApiUrl } = await import('./apiUrl')

      // Assert
      expect(() => getApiUrl()).toThrowError(/VITE_API_URL/)
    })
  })
})
