import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ApiError } from '@/shared/api'
import { registerUser } from './registerUser'

// `VITE_API_URL` is the same value in every test in this file, so a plain
// `vi.stubEnv`/`vi.stubGlobal` per test is enough (`getApiUrl()` reads the
// env var fresh on each call, uncached — see `shared/config/apiUrl.ts`).
// Unlike `shared/api`'s own tests, which vary the env across tests and so
// need `vi.resetModules()` + a fresh dynamic import per test, that reset
// pattern isn't needed here, and skipping it avoids re-triggering this
// file's heavier transform (`registerUser.ts` -> `@/entities/user`'s public
// API, which pulls in `UserSummary.vue`'s Vuetify component tree) on every
// single test.

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Given registerUser', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('When the API accepts the registration', () => {
    it('Then it POSTs to /api/users with the input and resolves with the mapped User', async () => {
      // Arrange
      const dto = {
        userId: '11111111-1111-1111-1111-111111111111',
        userName: 'Grace Hopper',
        numberOfPublications: 12,
        university: {
          id: '22222222-2222-2222-2222-222222222222',
          frontiersOrganizationId: 42,
          name: 'MIT',
          score: 72,
        },
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(dto, 201))
      vi.stubGlobal('fetch', fetchMock)

      // Act
      const user = await registerUser({
        userName: 'Grace Hopper',
        universityName: 'MIT',
        numberOfPublications: 12,
      })

      // Assert
      expect(user).toEqual({
        id: '11111111-1111-1111-1111-111111111111',
        userName: 'Grace Hopper',
        numberOfPublications: 12,
        university: dto.university,
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
      expect(url.pathname).toBe('/api/users')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        userName: 'Grace Hopper',
        universityName: 'MIT',
        numberOfPublications: 12,
      })
    })
  })

  describe('When the API rejects the registration with a validation problem', () => {
    it('Then it rejects with an ApiError carrying the field errors', async () => {
      // Arrange
      const problem = {
        code: 'RegisterUser.UniversityNameRequired',
        errors: { universityName: ['University name is required.'] },
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(problem, 400))
      vi.stubGlobal('fetch', fetchMock)

      // Act
      const call = registerUser({
        userName: 'Grace Hopper',
        universityName: '',
        numberOfPublications: 12,
      })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(400)
        expect(error.fieldErrors).toEqual({
          universityName: ['University name is required.'],
        })
      })
    })
  })
})
