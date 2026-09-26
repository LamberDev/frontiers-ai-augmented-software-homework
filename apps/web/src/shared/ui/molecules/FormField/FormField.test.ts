import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@/shared/lib/test/mountWithVuetify'
import FormField from './FormField.vue'

describe('Given FormField', () => {
  describe('When mounted with a label', () => {
    it('Then the input has a stable id associated with a visible label', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(FormField, {
        props: { label: 'User name', modelValue: '' },
      })

      // Assert
      const input = wrapper.find('input')
      const inputId = input.attributes('id')
      expect(inputId).toBeTruthy()
      expect(wrapper.find(`label[for="${inputId}"]`).exists()).toBe(true)
    })
  })

  describe('When the user types', () => {
    it('Then it emits "update:modelValue" with the typed value', async () => {
      // Arrange
      const wrapper = mountWithVuetify(FormField, {
        props: { label: 'User name', modelValue: '' },
      })

      // Act
      await wrapper.find('input').setValue('Grace Hopper')

      // Assert
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Grace Hopper'])
    })
  })

  describe('When multiple errors are passed', () => {
    it('Then only the first error message is displayed', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(FormField, {
        props: {
          label: 'User name',
          modelValue: '',
          errors: ['User name is required', 'User name is too long'],
        },
      })

      // Assert
      expect(wrapper.text()).toContain('User name is required')
      expect(wrapper.text()).not.toContain('User name is too long')
    })
  })

  describe('When type is "number"', () => {
    it("Then it proxies GlassTextField's numeric model and emits a number", async () => {
      // Arrange
      const wrapper = mountWithVuetify(FormField, {
        props: { label: 'Publications', type: 'number', modelValue: 0 },
      })

      // Act
      await wrapper.find('input').setValue('12')

      // Assert
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([12])
    })
  })

  describe('When a hint is provided and there are no errors', () => {
    it('Then the hint text is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(FormField, {
        props: { label: 'User name', modelValue: '', hint: 'As it appears on your profile' },
      })

      // Assert
      expect(wrapper.text()).toContain('As it appears on your profile')
    })
  })
})
