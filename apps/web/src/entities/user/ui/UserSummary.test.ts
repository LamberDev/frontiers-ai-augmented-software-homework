import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import UserSummary from './UserSummary.vue'
import type { User } from '../model/types'

function user(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    userName: 'Grace Hopper',
    numberOfPublications: 12,
    university: {
      id: '22222222-2222-2222-2222-222222222222',
      frontiersOrganizationId: 42,
      name: 'MIT',
      score: 72,
    },
    ...overrides,
  }
}

function stubClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  })
}

describe('Given UserSummary', () => {
  afterEach(() => {
    stubClipboard(undefined)
    vi.unstubAllGlobals()
  })

  describe('When mounted with a user', () => {
    it('Then it renders the user name, publication count and monospace user id', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UserSummary, { props: { user: user() } })

      // Assert
      expect(wrapper.text()).toContain('Grace Hopper')
      expect(wrapper.text()).toContain('12')
      const idElement = wrapper.find('code')
      expect(idElement.exists()).toBe(true)
      expect(idElement.text()).toBe('11111111-1111-1111-1111-111111111111')
    })
  })

  describe('When mounted with a user', () => {
    it("Then it embeds the UniversityCard for the user's university", () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UserSummary, { props: { user: user() } })

      // Assert
      expect(wrapper.text()).toContain('MIT')
      expect(wrapper.text()).toContain('Frontiers organization id')
    })
  })

  describe('When an actions slot is provided', () => {
    it('Then it renders the slot content', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UserSummary, {
        props: { user: user() },
        slots: { actions: '<button>Invite as reviewer</button>' },
      })

      // Assert
      expect(wrapper.text()).toContain('Invite as reviewer')
    })
  })

  describe('When no actions slot is provided', () => {
    it('Then it renders no actions wrapper', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UserSummary, { props: { user: user() } })

      // Assert
      expect(wrapper.find('.user-summary__actions').exists()).toBe(false)
    })
  })

  describe('When the copy button is clicked and the clipboard API succeeds', () => {
    it('Then it copies the user id and announces "Copied."', async () => {
      // Arrange
      const writeText = vi.fn().mockResolvedValue(undefined)
      stubClipboard({ writeText })
      const wrapper = mountWithVuetify(UserSummary, { props: { user: user() } })

      // Act
      await wrapper.find('button.user-summary__copy').trigger('click')
      await vi.waitFor(() => {
        expect(wrapper.find('[aria-live]').text()).toBe('Copied.')
      })

      // Assert
      expect(writeText).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
    })
  })

  describe('When the copy button is clicked and the clipboard API is unavailable', () => {
    it('Then it does not throw and announces that copying is unsupported', async () => {
      // Arrange
      stubClipboard(undefined)
      const wrapper = mountWithVuetify(UserSummary, { props: { user: user() } })

      // Act
      await wrapper.find('button.user-summary__copy').trigger('click')

      // Assert
      expect(wrapper.find('[aria-live]').text()).not.toBe('')
      expect(wrapper.find('[aria-live]').text()).not.toBe('Copied.')
    })
  })
})
