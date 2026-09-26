import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api'
import { useInviteReviewer } from './useInviteReviewer'
import type { InvitationResult, InviteReviewerInput } from './types'

const input: InviteReviewerInput = { userId: '11111111-1111-1111-1111-111111111111' }

describe('Given useInviteReviewer', () => {
  describe('When first created', () => {
    it('Then it starts idle with no results, field errors or last invitation', () => {
      // Arrange / Act
      const { status, fieldErrors, results, lastInvitation } = useInviteReviewer()

      // Assert
      expect(status.value).toBe('idle')
      expect(fieldErrors.value).toEqual({})
      expect(results.value).toEqual([])
      expect(lastInvitation.value).toBeNull()
    })
  })

  describe('When submit succeeds and the user is invited', () => {
    it('Then it sets status to success and appends a success result with the API message', async () => {
      // Arrange
      const invitation: InvitationResult = {
        userId: input.userId,
        invited: true,
        message: 'Reviewer invited.',
        reasons: [],
      }
      const inviteReviewer = vi.fn().mockResolvedValue(invitation)
      const { status, lastInvitation, results, submit } = useInviteReviewer({ inviteReviewer })

      // Act
      await submit(input)

      // Assert
      expect(status.value).toBe('success')
      expect(lastInvitation.value).toEqual(invitation)
      expect(results.value).toHaveLength(1)
      expect(results.value[0]).toMatchObject({
        type: 'success',
        title: 'Invitation sent',
        message: 'Reviewer invited.',
      })
    })
  })

  describe('When submit succeeds and the user is not eligible', () => {
    it('Then it sets status to success and appends a warning result with the reasons as items', async () => {
      // Arrange
      const invitation: InvitationResult = {
        userId: input.userId,
        invited: false,
        message: 'Reviewer not invited.',
        reasons: [{ code: 'University.ScoreTooLow', message: 'University score is too low.' }],
      }
      const inviteReviewer = vi.fn().mockResolvedValue(invitation)
      const { status, results, submit } = useInviteReviewer({ inviteReviewer })

      // Act
      await submit(input)

      // Assert
      expect(status.value).toBe('success')
      expect(results.value[0]).toMatchObject({
        type: 'warning',
        message: 'Reviewer not invited.',
        items: ['University score is too low.'],
      })
    })
  })

  describe('When submit fails with server field errors', () => {
    it('Then it sets fieldErrors and appends an error result', async () => {
      // Arrange
      const inviteReviewer = vi.fn().mockRejectedValue(
        new ApiError({
          status: 400,
          code: 'Reviewer.UserIdRequired',
          fieldErrors: { userId: ['User id is required.'], unknownField: ['x'] },
        }),
      )
      const { status, fieldErrors, results, submit } = useInviteReviewer({ inviteReviewer })

      // Act
      await submit(input)

      // Assert
      expect(status.value).toBe('error')
      expect(fieldErrors.value).toEqual({ userId: ['User id is required.'] })
      expect(results.value[0].type).toBe('error')
    })
  })

  describe('When submit fails because the user was not found', () => {
    it('Then it appends an error result titled "User not found."', async () => {
      // Arrange
      const inviteReviewer = vi
        .fn()
        .mockRejectedValue(new ApiError({ status: 404, code: 'Reviewer.UserNotFound' }))
      const { results, submit } = useInviteReviewer({ inviteReviewer })

      // Act
      await submit(input)

      // Assert
      expect(results.value[0]).toMatchObject({ type: 'error', title: 'User not found.' })
    })
  })

  describe('When submit is called again while a previous submit is still loading', () => {
    it('Then the second call is ignored and the API is called only once', async () => {
      // Arrange
      let resolveInvite!: (value: InvitationResult) => void
      const inviteReviewer = vi.fn(
        () =>
          new Promise<InvitationResult>((resolve) => {
            resolveInvite = resolve
          }),
      )
      const { status, submit } = useInviteReviewer({ inviteReviewer })

      // Act
      const first = submit(input)
      expect(status.value).toBe('loading')
      const second = submit(input)
      resolveInvite({ userId: input.userId, invited: true, message: 'ok', reasons: [] })
      await Promise.all([first, second])

      // Assert
      expect(inviteReviewer).toHaveBeenCalledTimes(1)
      expect(status.value).toBe('success')
    })
  })

  describe('When dismiss is called with a result id', () => {
    it('Then it removes only that result', async () => {
      // Arrange
      const inviteReviewer = vi
        .fn()
        .mockRejectedValueOnce(new ApiError({ status: 500 }))
        .mockResolvedValueOnce({ userId: input.userId, invited: true, message: 'ok', reasons: [] })
      const { results, submit, dismiss } = useInviteReviewer({ inviteReviewer })
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
