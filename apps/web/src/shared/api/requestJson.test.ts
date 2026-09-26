import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

function jsonResponse(body: unknown, init: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
}

describe('Given the shared/api requestJson helper', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('When VITE_API_URL is missing', () => {
    it('Then it rejects with an ApiError carrying status 0 and the missing-config code, without calling fetch', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', undefined)
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError, MISSING_API_URL_CODE } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(0)
        expect(error.code).toBe(MISSING_API_URL_CODE)
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('When fetch itself rejects (network failure)', () => {
    it('Then it rejects with an ApiError carrying status 0 and the network-unavailable code', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError, NETWORK_UNAVAILABLE_CODE } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(0)
        expect(error.code).toBe(NETWORK_UNAVAILABLE_CODE)
      })
    })
  })

  describe('When the request succeeds', () => {
    it('Then it resolves with the parsed JSON body, and calls fetch with the method, JSON headers and stringified body', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const responseBody = { userId: 'u1', userName: 'Grace Hopper', numberOfPublications: 5 }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(responseBody, { status: 201 }))
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')

      // Act
      const result = await requestJson('/api/users', {
        method: 'POST',
        body: { userName: 'Grace Hopper' },
      })

      // Assert
      expect(result).toEqual(responseBody)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
      expect(init.method).toBe('POST')
      expect(new Headers(init.headers).get('Content-Type')).toBe('application/json')
      expect(init.body).toBe(JSON.stringify({ userName: 'Grace Hopper' }))
    })
  })

  describe('When the response is a 400 validation problem with field errors', () => {
    it('Then it rejects with an ApiError carrying the code, title, detail and fieldErrors', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const problem = {
        code: 'RegisterUser.UniversityNameRequired',
        title: 'Validation failed',
        detail: 'One or more fields are invalid.',
        errors: { universityName: ['University name is required.'] },
      }
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 400,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(400)
        expect(error.code).toBe('RegisterUser.UniversityNameRequired')
        expect(error.title).toBe('Validation failed')
        expect(error.detail).toBe('One or more fields are invalid.')
        expect(error.fieldErrors).toEqual({
          universityName: ['University name is required.'],
        })
      })
    })
  })

  describe('When the response is a 404 with a code and no errors dictionary', () => {
    it('Then it rejects with an ApiError carrying the code and an empty fieldErrors', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const problem = { code: 'UniversityDirectory.NotFound', title: 'Not found' }
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 404,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(404)
        expect(error.code).toBe('UniversityDirectory.NotFound')
        expect(error.fieldErrors).toEqual({})
      })
    })
  })

  describe('When the response is a 502 with a code', () => {
    it('Then it rejects with an ApiError carrying status 502 and the code', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const problem = { code: 'UniversityDirectory.Unavailable' }
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(problem), {
          status: 502,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      )
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(502)
        expect(error.code).toBe('UniversityDirectory.Unavailable')
      })
    })
  })

  describe('When the response is a 415 with an empty body', () => {
    it('Then it rejects with an ApiError carrying just the status', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 415 }))
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(415)
        expect(error.code).toBeUndefined()
        expect(error.title).toBeUndefined()
        expect(error.detail).toBeUndefined()
        expect(error.fieldErrors).toEqual({})
      })
    })
  })

  describe('When the response is a bare 400 with a non-JSON body', () => {
    it('Then it rejects with an ApiError carrying just the status, tolerating the unparsable body', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const fetchMock = vi.fn().mockResolvedValue(new Response('Bad Request', { status: 400 }))
      vi.stubGlobal('fetch', fetchMock)
      const { requestJson } = await import('./requestJson')
      const { ApiError } = await import('./ApiError')

      // Act
      const call = requestJson('/api/users', { method: 'POST', body: {} })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(400)
        expect(error.code).toBeUndefined()
        expect(error.fieldErrors).toEqual({})
      })
    })
  })
})
