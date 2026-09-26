import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api'
import { useRegisterUser } from './useRegisterUser'
import type { RegisterUserInput } from './types'
import type { User } from '@/entities/user'

const input: RegisterUserInput = {
  userName: 'Grace Hopper',
  universityName: 'MIT',
  numberOfPublications: 12,
}

const user: User = {
  id: '11111111-1111-1111-1111-111111111111',
  userName: 'Grace Hopper',
  numberOfPublications: 12,
  university: {
    id: '22222222-2222-2222-2222-222222222222',
    frontiersOrganizationId: 42,
    name: 'MIT',
    score: 72,
  },
}

describe('Given useRegisterUser', () => {
  describe('When first created', () => {
    it('Then it starts idle with no results, field errors or last user', () => {
      // Arrange / Act
      const { status, fieldErrors, results, lastUser } = useRegisterUser()

      // Assert
      expect(status.value).toBe('idle')
      expect(fieldErrors.value).toEqual({})
      expect(results.value).toEqual([])
      expect(lastUser.value).toBeNull()
    })
  })

  describe('When submit succeeds', () => {
    it('Then it sets status to success, stores lastUser, clears fieldErrors and appends a success result', async () => {
      // Arrange
      const registerUser = vi.fn().mockResolvedValue(user)
      const { status, fieldErrors, results, lastUser, submit } = useRegisterUser({ registerUser })

      // Act
      await submit(input)

      // Assert
      expect(status.value).toBe('success')
      expect(lastUser.value).toEqual(user)
      expect(fieldErrors.value).toEqual({})
      expect(results.value).toHaveLength(1)
      expect(results.value[0]).toMatchObject({
        type: 'success',
        title: 'User registered',
        message: 'Grace Hopper was registered with MIT.',
      })
      expect(typeof results.value[0].id).toBe('string')
    })
  })

  describe('When submit fails with server field errors', () => {
    it('Then it sets fieldErrors (filtered to known fields) and appends an error result', async () => {
      // Arrange
      const registerUser = vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: 'RegisterUser.UniversityNameRequired',
          fieldErrors: { universityName: ['University name is required.'], unknownField: ['x'] },
        }),
      )
      const { status, fieldErrors, results, submit } = useRegisterUser({ registerUser })

      // Act
      await submit(input)

      // Assert
      expect(status.value).toBe('error')
      expect(fieldErrors.value).toEqual({
        universityName: ['University name is required.'],
      })
      expect(results.value).toHaveLength(1)
      expect(results.value[0].type).toBe('error')
    })
  })

  describe('When submit fails with a known ApiError code and no field errors', () => {
    it('Then it appends an error result with the friendly title and the detail as message', async () => {
      // Arrange
      const registerUser = vi.fn().mockRejectedValue(
        new ApiError({
          status: 404,
          code: 'UniversityDirectory.NotFound',
          detail: 'No university matched "Not A Real University".',
        }),
      )
      const { results, submit } = useRegisterUser({ registerUser })

      // Act
      await submit(input)

      // Assert
      expect(results.value[0]).toMatchObject({
        type: 'error',
        title: 'University not found.',
        message: 'No university matched "Not A Real University".',
      })
    })
  })

  describe('When submit fails with an unmapped ApiError code', () => {
    it('Then it appends an error result with the default friendly title', async () => {
      // Arrange
      const registerUser = vi
        .fn()
        .mockRejectedValue(new ApiError({ status: 500, code: 'Server.UnexpectedError' }))
      const { results, submit } = useRegisterUser({ registerUser })

      // Act
      await submit(input)

      // Assert
      expect(results.value[0]).toMatchObject({
        type: 'error',
        title: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('When submit fails with a network error', () => {
    it('Then it appends an error result telling the user to check their connection', async () => {
      // Arrange
      const registerUser = vi
        .fn()
        .mockRejectedValue(new ApiError({ status: 0, code: 'Network.Unavailable' }))
      const { results, submit } = useRegisterUser({ registerUser })

      // Act
      await submit(input)

      // Assert
      expect(results.value[0]).toMatchObject({
        type: 'error',
        title: 'Cannot reach the server. Check your connection and try again.',
      })
    })
  })

  describe('When submit is called again while a previous submit is still loading', () => {
    it('Then the second call is ignored and the API is called only once', async () => {
      // Arrange
      let resolveRegister!: (value: User) => void
      const registerUser = vi.fn(() => new Promise<User>((resolve) => (resolveRegister = resolve)))
      const { status, submit } = useRegisterUser({ registerUser })

      // Act
      const first = submit(input)
      expect(status.value).toBe('loading')
      const second = submit(input)
      resolveRegister(user)
      await Promise.all([first, second])

      // Assert
      expect(registerUser).toHaveBeenCalledTimes(1)
      expect(status.value).toBe('success')
    })
  })

  describe('When dismiss is called with a result id', () => {
    it('Then it removes only that result', async () => {
      // Arrange
      const registerUser = vi
        .fn()
        .mockRejectedValueOnce(new ApiError({ status: 500 }))
        .mockResolvedValueOnce(user)
      const { results, submit, dismiss } = useRegisterUser({ registerUser })
      await submit(input)
      await submit(input)
      expect(results.value).toHaveLength(2)
      const [first, second] = results.value

      // Act
      dismiss(first.id)

      // Assert
      expect(results.value).toHaveLength(1)
      expect(results.value[0].id).toBe(second.id)
    })
  })
})
