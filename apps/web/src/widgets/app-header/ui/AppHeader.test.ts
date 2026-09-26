import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import AppHeader from './AppHeader.vue'

const RegisterStub = { template: '<div>Register page</div>' }
const InviteStub = { template: '<div>Invite page</div>' }

async function mountAppHeaderAt(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', name: 'register-user', component: RegisterStub },
      { path: '/invite', name: 'invite-reviewer', component: InviteStub },
    ],
  })
  await router.push(initialPath)
  await router.isReady()
  return mountWithVuetify(AppHeader, { global: { plugins: [router] } })
}

describe('Given AppHeader', () => {
  describe('When mounted', () => {
    it('Then it renders a header landmark, a nav labelled "Primary", the brand logo and both links', async () => {
      // Arrange / Act
      const wrapper = await mountAppHeaderAt('/register')

      // Assert
      expect(wrapper.find('header').exists()).toBe(true)
      const nav = wrapper.find('nav')
      expect(nav.exists()).toBe(true)
      expect(nav.attributes('aria-label')).toBe('Primary')
      expect(wrapper.text()).toContain('Frontiers')
      expect(wrapper.text()).toContain('Peer Review')

      const links = wrapper.findAll('a')
      expect(links.some((link) => link.attributes('href') === '/register')).toBe(true)
      expect(links.some((link) => link.attributes('href') === '/invite')).toBe(true)
    })
  })

  describe('When mounted on the register route', () => {
    it('Then the register link has aria-current="page" and the invite link does not', async () => {
      // Arrange / Act
      const wrapper = await mountAppHeaderAt('/register')

      // Assert
      const links = wrapper.findAll('a')
      const registerLink = links.find((link) => link.attributes('href') === '/register')
      const inviteLink = links.find((link) => link.attributes('href') === '/invite')
      expect(registerLink?.attributes('aria-current')).toBe('page')
      expect(inviteLink?.attributes('aria-current')).toBeUndefined()
    })
  })

  describe('When mounted on the invite route', () => {
    it('Then the invite link has aria-current="page" and the register link does not', async () => {
      // Arrange / Act
      const wrapper = await mountAppHeaderAt('/invite')

      // Assert
      const links = wrapper.findAll('a')
      const registerLink = links.find((link) => link.attributes('href') === '/register')
      const inviteLink = links.find((link) => link.attributes('href') === '/invite')
      expect(inviteLink?.attributes('aria-current')).toBe('page')
      expect(registerLink?.attributes('aria-current')).toBeUndefined()
    })
  })
})
