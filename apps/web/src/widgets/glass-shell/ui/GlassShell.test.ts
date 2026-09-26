import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import GlassShell from './GlassShell.vue'

describe('Given GlassShell', () => {
  describe('When mounted with header and default slot content', () => {
    it('Then it renders both the header slot and the default slot content', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassShell, {
        slots: {
          header: '<header data-testid="header">Header content</header>',
          default: '<p>Body content</p>',
        },
      })

      // Assert
      expect(wrapper.find('[data-testid="header"]').text()).toBe('Header content')
      expect(wrapper.text()).toContain('Body content')
    })
  })

  describe('When mounted', () => {
    it('Then the decorative background layer is aria-hidden and non-interactive', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassShell, { slots: { default: '<p>Body</p>' } })

      // Assert
      const background = wrapper.find('.glass-shell__background')
      expect(background.exists()).toBe(true)
      expect(background.attributes('aria-hidden')).toBe('true')
    })

    it('Then it does not render its own <main> landmark', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassShell, { slots: { default: '<p>Body</p>' } })

      // Assert
      expect(wrapper.find('main').exists()).toBe(false)
    })
  })

  describe('When no header slot content is provided', () => {
    it('Then it does not render a header wrapper', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassShell, { slots: { default: '<p>Body</p>' } })

      // Assert
      expect(wrapper.find('.glass-shell__header').exists()).toBe(false)
    })
  })
})
