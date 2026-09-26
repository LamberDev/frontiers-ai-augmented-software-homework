import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import GlassButton from './GlassButton.vue'

describe('Given GlassButton', () => {
  describe('When mounted with default props', () => {
    it('Then it renders a native button of type "button" with the slot content', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassButton, {
        slots: { default: 'Submit' },
      })

      // Assert
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.attributes('type')).toBe('button')
      expect(wrapper.text()).toContain('Submit')
    })
  })

  describe('When type="submit" is passed', () => {
    it('Then the rendered button has type "submit"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassButton, {
        props: { type: 'submit' },
        slots: { default: 'Save' },
      })

      // Assert
      expect(wrapper.find('button').attributes('type')).toBe('submit')
    })
  })

  describe('When clicked', () => {
    it('Then it emits a "click" event with the native MouseEvent', async () => {
      // Arrange
      const wrapper = mountWithVuetify(GlassButton, {
        slots: { default: 'Click me' },
      })

      // Act
      await wrapper.find('button').trigger('click')

      // Assert
      const emitted = wrapper.emitted('click')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0][0]).toBeInstanceOf(MouseEvent)
    })
  })

  describe('When disabled', () => {
    it('Then the rendered button is disabled and does not emit "click"', async () => {
      // Arrange
      const wrapper = mountWithVuetify(GlassButton, {
        props: { disabled: true },
        slots: { default: 'Disabled' },
      })

      // Act
      await wrapper.find('button').trigger('click')

      // Assert
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.emitted('click')).toBeUndefined()
    })
  })

  describe('When loading', () => {
    it('Then it sets aria-busy and disables the button', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassButton, {
        props: { loading: true },
        slots: { default: 'Loading' },
      })

      // Assert
      const button = wrapper.find('button')
      expect(button.attributes('aria-busy')).toBe('true')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('When not loading', () => {
    it('Then aria-busy is not present', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassButton, {
        slots: { default: 'Idle' },
      })

      // Assert
      expect(wrapper.find('button').attributes('aria-busy')).toBeUndefined()
    })
  })

  describe('When variant="secondary" or "ghost" is passed', () => {
    it('Then each variant renders with a distinct class from the others', () => {
      // Arrange / Act
      const primary = mountWithVuetify(GlassButton, { slots: { default: 'A' } })
      const secondary = mountWithVuetify(GlassButton, {
        props: { variant: 'secondary' },
        slots: { default: 'B' },
      })
      const ghost = mountWithVuetify(GlassButton, {
        props: { variant: 'ghost' },
        slots: { default: 'C' },
      })

      // Assert
      expect(primary.find('button').classes()).toContain('glass-button--primary')
      expect(secondary.find('button').classes()).toContain('glass-button--secondary')
      expect(ghost.find('button').classes()).toContain('glass-button--ghost')
    })
  })

  describe('When a prependIcon slot is provided', () => {
    it('Then it renders inside the button', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassButton, {
        slots: {
          default: 'With icon',
          prependIcon: '<span data-testid="icon">i</span>',
        },
      })

      // Assert
      expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true)
    })
  })

  describe('Given the variant-to-Vuetify-variant mapping', () => {
    describe('When variant="primary" (default)', () => {
      it('Then it renders with the Vuetify "flat" variant', () => {
        // Arrange / Act
        const wrapper = mountWithVuetify(GlassButton, { slots: { default: 'Primary' } })

        // Assert
        expect(wrapper.find('button').classes()).toContain('v-btn--variant-flat')
      })
    })

    describe('When variant="secondary"', () => {
      it('Then it renders with the Vuetify "outlined" variant', () => {
        // Arrange / Act
        const wrapper = mountWithVuetify(GlassButton, {
          props: { variant: 'secondary' },
          slots: { default: 'Secondary' },
        })

        // Assert
        expect(wrapper.find('button').classes()).toContain('v-btn--variant-outlined')
      })
    })

    describe('When variant="ghost"', () => {
      it('Then it renders with the Vuetify "text" variant', () => {
        // Arrange / Act
        const wrapper = mountWithVuetify(GlassButton, {
          props: { variant: 'ghost' },
          slots: { default: 'Ghost' },
        })

        // Assert
        expect(wrapper.find('button').classes()).toContain('v-btn--variant-text')
      })
    })

    describe('When an invalid runtime variant is passed (bypassing the prop type)', () => {
      it('Then it falls back to the Vuetify "flat" variant', () => {
        // Arrange / Act
        const wrapper = mountWithVuetify(GlassButton, {
          props: { variant: 'unknown' as unknown as 'primary' },
          slots: { default: 'Fallback' },
        })

        // Assert
        expect(wrapper.find('button').classes()).toContain('v-btn--variant-flat')
      })
    })
  })
})
