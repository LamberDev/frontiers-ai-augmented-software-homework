import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('Given the shared/api httpClient', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('When VITE_API_URL is missing', () => {
    it('Then calling it does not throw synchronously, and the returned promise rejects with the descriptive config error', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', undefined)
      const { httpClient } = await import('./httpClient')

      // Act
      let call: Promise<Response> | undefined
      let threwSynchronously = false
      try {
        call = httpClient('/users')
      } catch {
        threwSynchronously = true
      }

      // Assert
      expect(threwSynchronously).toBe(false)
      await expect(call!).rejects.toThrowError(/VITE_API_URL/)
    })
  })

  describe('When VITE_API_URL is set', () => {
    it('Then it calls fetch with the path resolved against the base URL and passes init through', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
      vi.stubGlobal('fetch', fetchMock)
      const { httpClient } = await import('./httpClient')
      const init: RequestInit = { method: 'POST' }

      // Act
      await httpClient('/users', init)

      // Assert
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(new URL('/users', 'https://api.example.test'), init)
    })
  })
})
