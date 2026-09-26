import { describe, expect, it, vi } from 'vitest'
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
    it('Then it emits "close" and "update:modelValue"(false), and becomes hidden', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Dismiss me', closable: true },
      })

      // Act
      await wrapper.find('.v-alert__close button').trigger('click')

      // Assert
      expect(wrapper.emitted('close')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false])
      expect(wrapper.find('.result-alert').exists()).toBe(false)
    })
  })

  describe('When a parent re-shows a dismissed alert via v-model', () => {
    it('Then the alert becomes visible again', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Dismiss me', closable: true, modelValue: true },
      })
      await wrapper.find('.v-alert__close button').trigger('click')
      // A real v-model-bound parent reacts to the emitted `update:modelValue`
      // by updating its own bound value; simulate that here.
      await wrapper.setProps({ modelValue: false })
      expect(wrapper.find('.result-alert').exists()).toBe(false)

      // Act
      await wrapper.setProps({ modelValue: true })

      // Assert
      expect(wrapper.find('.result-alert').exists()).toBe(true)
    })
  })

  describe("When a dismissed alert's content changes", () => {
    it('Then it re-appears with the new content', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Dismiss me', closable: true },
      })
      await wrapper.find('.v-alert__close button').trigger('click')
      expect(wrapper.find('.result-alert').exists()).toBe(false)

      // Act
      await wrapper.setProps({ title: 'New result' })

      // Assert
      expect(wrapper.find('.result-alert').exists()).toBe(true)
      expect(wrapper.text()).toContain('New result')
    })
  })

  describe('When a re-render reorders a list containing duplicate values', () => {
    it('Then it renders every entry without a Vue duplicate-key warning', async () => {
      // Arrange
      // Vue's "Duplicate keys found during update" warning is only raised
      // while diffing an update that cannot be resolved by simple
      // prefix/suffix matching (an actual reorder), not on the initial
      // mount and not on a same-order update — so the list must reorder at
      // least once to exercise the keyed diff that a plain `:key="item"`
      // would trip over for duplicate item text.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mountWithVuetify(ResultAlert, {
        props: {
          type: 'error',
          title: 'Not eligible',
          items: ['Missing university', 'Score below threshold', 'Score below threshold'],
        },
      })

      // Act
      await wrapper.setProps({
        items: ['Score below threshold', 'Score below threshold', 'Missing university'],
      })

      // Assert
      const items = wrapper.findAll('li')
      expect(items.map((item) => item.text())).toEqual([
        'Score below threshold',
        'Score below threshold',
        'Missing university',
      ])
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('When items change', () => {
    it('Then the rendered list updates to match', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'error', title: 'Not eligible', items: ['First'] },
      })

      // Act
      await wrapper.setProps({ items: ['Second', 'Third'] })

      // Assert
      const items = wrapper.findAll('li')
      expect(items.map((item) => item.text())).toEqual(['Second', 'Third'])
    })
  })
})
