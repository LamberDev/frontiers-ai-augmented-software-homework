import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import { findFieldInput } from '@test/support/findFieldInput'
import InviteReviewerPage from './InviteReviewerPage.vue'
import RegisterUserPage from '@/pages/register-user/ui/RegisterUserPage.vue'
import { ApiError } from '@/shared/api'
import type { InvitationResult } from '@/features/invite-reviewer'

// Mocks the feature's internal api module directly (mirrors
// `RegisterUserPage.test.ts`'s reasoning): `useInviteReviewer` imports
// `inviteReviewer` from `../api/inviteReviewer`, not the public barrel.
vi.mock('@/features/invite-reviewer/api/inviteReviewer')

import { inviteReviewer } from '@/features/invite-reviewer'

const inviteReviewerMock = vi.mocked(inviteReviewer)

const userId = '11111111-1111-1111-1111-111111111111'

async function mountPage(path = '/invite') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', name: 'register-user', component: RegisterUserPage },
      { path: '/invite', name: 'invite-reviewer', component: InviteReviewerPage },
    ],
  })
  await router.push(path)
  await router.isReady()
  return mountWithVuetify(InviteReviewerPage, { global: { plugins: [router] } })
}

describe('Given InviteReviewerPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('When mounted without a userId query', () => {
    it('Then it renders exactly one h1 heading and an empty, prefill-free form', async () => {
      // Arrange / Act
      const wrapper = await mountPage('/invite')

      // Assert
      expect(wrapper.findAll('h1')).toHaveLength(1)
      expect(wrapper.text()).toContain('Invite reviewer')
      expect((findFieldInput(wrapper, 'User id').element as HTMLInputElement).value).toBe('')
    })
  })

  describe('When mounted with a userId query (e.g. from the register page link)', () => {
    it('Then the form is prefilled with that userId', async () => {
      // Arrange / Act
      const wrapper = await mountPage(`/invite?userId=${userId}`)

      // Assert
      expect((findFieldInput(wrapper, 'User id').element as HTMLInputElement).value).toBe(userId)
    })
  })

  describe('When mounted with a repeated userId query (an array)', () => {
    it('Then the field is not prefilled', async () => {
      // Arrange / Act
      const wrapper = await mountPage(`/invite?userId=${userId}&userId=other`)

      // Assert
      expect((findFieldInput(wrapper, 'User id').element as HTMLInputElement).value).toBe('')
    })
  })

  describe('When the invitation succeeds and the user is invited', () => {
    it('Then it shows a success alert with the API message', async () => {
      // Arrange
      const invitation: InvitationResult = {
        userId,
        invited: true,
        message: 'Reviewer invited.',
        reasons: [],
      }
      inviteReviewerMock.mockResolvedValueOnce(invitation)
      const wrapper = await mountPage(`/invite?userId=${userId}`)

      // Act
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Assert
      expect(wrapper.text()).toContain('Invitation sent')
      expect(wrapper.text()).toContain('Reviewer invited.')
    })
  })

  describe('When the invitation succeeds but the user is not eligible', () => {
    it('Then it shows a warning alert listing the reasons', async () => {
      // Arrange
      const invitation: InvitationResult = {
        userId,
        invited: false,
        message: 'Reviewer not invited.',
        reasons: [{ code: 'University.ScoreTooLow', message: 'University score is too low.' }],
      }
      inviteReviewerMock.mockResolvedValueOnce(invitation)
      const wrapper = await mountPage(`/invite?userId=${userId}`)

      // Act
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Assert
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('University score is too low.')
    })
  })

  describe('When the request fails with a server field error', () => {
    it('Then the form shows the field error', async () => {
      // Arrange
      inviteReviewerMock.mockRejectedValueOnce(
        new ApiError({
          status: 400,
          code: 'Reviewer.UserIdRequired',
          fieldErrors: { userId: ['User id is required.'] },
        }),
      )
      const wrapper = await mountPage(`/invite?userId=${userId}`)

      // Act
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Assert
      expect(wrapper.text()).toContain('User id is required.')
    })
  })
})
