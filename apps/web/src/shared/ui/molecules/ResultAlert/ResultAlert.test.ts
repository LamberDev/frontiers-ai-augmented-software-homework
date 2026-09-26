import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@/shared/lib/test/mountWithVuetify'
import ResultAlert from './ResultAlert.vue'

describe('Given ResultAlert', () => {
  describe('When type is "success"', () => {
    it('Then it has role="status" and an aria-live of "polite"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'success', title: 'Registration complete' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('status')
      expect(wrapper.attributes('aria-live')).toBe('polite')
      expect(wrapper.text()).toContain('Registration complete')
    })
  })

  describe('When type is "info"', () => {
    it('Then it has role="status"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Heads up' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('status')
    })
  })

  describe('When type is "error"', () => {
    it('Then it has role="alert" and an aria-live of "assertive"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'error', title: 'Registration failed' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('alert')
      expect(wrapper.attributes('aria-live')).toBe('assertive')
    })
  })

  describe('When type is "warning"', () => {
    it('Then it has role="alert"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'warning', title: 'Careful' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('alert')
    })
  })

  describe('When items are provided', () => {
    it('Then each item is rendered as a list entry', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: {
          type: 'error',
          title: 'Not eligible',
          items: ['Score below threshold', 'Missing publications'],
        },
      })

      // Assert
      const items = wrapper.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe('Score below threshold')
      expect(items[1].text()).toBe('Missing publications')
    })
  })

  describe('When a message is provided', () => {
    it('Then the message text is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'success', title: 'Done', message: 'You can close this window.' },
      })

      // Assert
      expect(wrapper.text()).toContain('You can close this window.')
    })
  })

  describe('When closable is true and the close control is activated', () => {
    it('Then it emits "close"', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Dismiss me', closable: true },
      })

      // Act
      await wrapper.find('.v-alert__close button').trigger('click')

      // Assert
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })
})
