import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import { findFieldInput } from '@test/support/findFieldInput'
import RegisterUserPage from './RegisterUserPage.vue'
import InviteReviewerPage from '@/pages/invite-reviewer/ui/InviteReviewerPage.vue'
import { ApiError } from '@/shared/api'
import type { User } from '@/entities/user'

// Mocks the feature's internal api module directly, since `useRegisterUser`
// imports `registerUser` from `../api/registerUser` (a relative import to
// the same file), not from the slice's public barrel — mocking the barrel
// instead would leave that internal import untouched. The module path
// below is a plain string argument to `vi.mock`, not an import declaration,
// so it does not sidestep the slice's public API; the import right after
// it resolves through the public barrel, which re-exports the very same
// (now mocked) module.
vi.mock('@/features/register-user/api/registerUser')

import { registerUser } from '@/features/register-user'

const registerUserMock = vi.mocked(registerUser)

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

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', name: 'register-user', component: RegisterUserPage },
      { path: '/invite', name: 'invite-reviewer', component: InviteReviewerPage },
    ],
  })
  await router.push('/register')
  await router.isReady()
  return { wrapper: mountWithVuetify(RegisterUserPage, { global: { plugins: [router] } }), router }
}

async function fillValidForm(wrapper: Awaited<ReturnType<typeof mountPage>>['wrapper']) {
  await findFieldInput(wrapper, 'User name').setValue('Grace Hopper')
  await findFieldInput(wrapper, 'University name').setValue('MIT')
  await findFieldInput(wrapper, 'Number of publications').setValue('12')
}

describe('Given RegisterUserPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('When mounted', () => {
    it('Then it renders exactly one h1 heading and the register form', async () => {
      // Arrange / Act
      const { wrapper } = await mountPage()

      // Assert
      expect(wrapper.findAll('h1')).toHaveLength(1)
      expect(wrapper.text()).toContain('Register user')
      expect(wrapper.find('[aria-label="Results"]').exists()).toBe(true)
    })
  })

  describe('When registration succeeds', () => {
    it('Then it shows a success alert and the registered UserSummary with an invite link carrying the right query', async () => {
      // Arrange
      registerUserMock.mockResolvedValueOnce(user)
      const { wrapper } = await mountPage()
      await fillValidForm(wrapper)

      // Act
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Assert
      expect(wrapper.text()).toContain('User registered')
      expect(wrapper.text()).toContain('Grace Hopper was registered with MIT.')
      expect(wrapper.text()).toContain('User summary')
      const link = wrapper.find(`a[href="/invite?userId=${user.id}"]`)
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('Invite as reviewer')
    })
  })

  describe('When registration fails with server field errors', () => {
    it('Then the form shows the field error and no UserSummary is rendered', async () => {
      // Arrange
      registerUserMock.mockRejectedValueOnce(
        new ApiError({
          status: 400,
          code: 'RegisterUser.UniversityNameRequired',
          fieldErrors: { universityName: ['University name is required.'] },
        }),
      )
      const { wrapper } = await mountPage()
      await fillValidForm(wrapper)

      // Act
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Assert
      expect(wrapper.text()).toContain('University name is required.')
      expect(wrapper.text()).not.toContain('User summary')
    })
  })

  describe('When closing a result alert', () => {
    it('Then only that alert is removed', async () => {
      // Arrange
      registerUserMock
        .mockRejectedValueOnce(new ApiError({ status: 500, code: 'Server.UnexpectedError' }))
        .mockResolvedValueOnce(user)
      const { wrapper } = await mountPage()
      await fillValidForm(wrapper)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      await fillValidForm(wrapper)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.findAll('.result-alert')).toHaveLength(2)

      // Act
      await wrapper.findAll('.v-alert__close button')[0].trigger('click')
      await flushPromises()

      // Assert
      expect(wrapper.findAll('.result-alert')).toHaveLength(1)
      expect(wrapper.text()).toContain('User registered')
      expect(wrapper.text()).not.toContain('Something went wrong')
    })
  })
})
