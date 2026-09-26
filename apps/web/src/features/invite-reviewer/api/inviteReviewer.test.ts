import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('Given inviteReviewer', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  describe('When the API accepts the invitation', () => {
    it('Then it POSTs to /api/reviewers/invitations with the userId and resolves with the InvitationResult', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const result = {
        userId: '11111111-1111-1111-1111-111111111111',
        invited: true,
        message: 'Reviewer invited.',
        reasons: [],
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result, 200))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')

      // Act
      const invitation = await inviteReviewer({
        userId: '11111111-1111-1111-1111-111111111111',
      })

      // Assert
      expect(invitation).toEqual(result)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
      expect(url.pathname).toBe('/api/reviewers/invitations')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        userId: '11111111-1111-1111-1111-111111111111',
      })
    })
  })

  describe('When the API reports the user as ineligible', () => {
    it('Then it resolves with invited: false and the reasons', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const result = {
        userId: '11111111-1111-1111-1111-111111111111',
        invited: false,
        message: 'Reviewer not invited.',
        reasons: [{ code: 'University.ScoreTooLow', message: 'University score is too low.' }],
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(result, 200))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')

      // Act
      const invitation = await inviteReviewer({
        userId: '11111111-1111-1111-1111-111111111111',
      })

      // Assert
      expect(invitation).toEqual(result)
    })
  })

  describe('When the response body is missing the "invited" flag', () => {
    it('Then it rejects with an ApiError carrying the invalid-body code, without setting a half-processed result', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const malformed = {
        userId: '11111111-1111-1111-1111-111111111111',
        message: 'Reviewer invited.',
        reasons: [],
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(malformed, 200))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')
      const { ApiError, RESPONSE_INVALID_BODY_CODE } = await import('@/shared/api')

      // Act
      const call = inviteReviewer({ userId: '11111111-1111-1111-1111-111111111111' })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.code).toBe(RESPONSE_INVALID_BODY_CODE)
      })
    })
  })

  describe('When the response body has a non-array "reasons"', () => {
    it('Then it rejects with an ApiError carrying the invalid-body code', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const malformed = {
        userId: '11111111-1111-1111-1111-111111111111',
        invited: false,
        message: 'Reviewer not invited.',
        reasons: 'not an array',
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(malformed, 200))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')
      const { ApiError, RESPONSE_INVALID_BODY_CODE } = await import('@/shared/api')

      // Act
      const call = inviteReviewer({ userId: '11111111-1111-1111-1111-111111111111' })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.code).toBe(RESPONSE_INVALID_BODY_CODE)
      })
    })
  })

  describe('When the response body has a reason entry with a non-string message', () => {
    it('Then it rejects with an ApiError carrying the invalid-body code', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const malformed = {
        userId: '11111111-1111-1111-1111-111111111111',
        invited: false,
        message: 'Reviewer not invited.',
        reasons: [{ code: 'University.ScoreTooLow', message: 42 }],
      }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(malformed, 200))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')
      const { ApiError, RESPONSE_INVALID_BODY_CODE } = await import('@/shared/api')

      // Act
      const call = inviteReviewer({ userId: '11111111-1111-1111-1111-111111111111' })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.code).toBe(RESPONSE_INVALID_BODY_CODE)
      })
    })
  })

  describe('When the API reports the user as not found', () => {
    it('Then it rejects with an ApiError carrying the code', async () => {
      // Arrange
      vi.stubEnv('VITE_API_URL', 'https://api.example.test')
      const problem = { code: 'Reviewer.UserNotFound' }
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(problem, 404))
      vi.stubGlobal('fetch', fetchMock)
      const { inviteReviewer } = await import('./inviteReviewer')
      const { ApiError } = await import('@/shared/api')

      // Act
      const call = inviteReviewer({ userId: 'not-a-uuid' })

      // Assert
      await expect(call).rejects.toBeInstanceOf(ApiError)
      await call.catch((error: InstanceType<typeof ApiError>) => {
        expect(error.status).toBe(404)
        expect(error.code).toBe('Reviewer.UserNotFound')
      })
    })
  })
})
