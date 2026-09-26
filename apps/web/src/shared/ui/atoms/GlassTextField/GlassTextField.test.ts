import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@/shared/lib/test/mountWithVuetify'
import GlassTextField from './GlassTextField.vue'

describe('Given GlassTextField', () => {
  describe('When mounted with a required label', () => {
    it('Then the rendered input is associated with a visible label containing the label text', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '' },
      })

      // Assert
      const input = wrapper.find('input')
      const inputId = input.attributes('id')
      expect(inputId).toBeTruthy()
      const label = wrapper.find(`label[for="${inputId}"]`)
      expect(label.exists()).toBe(true)
      expect(label.text()).toContain('User name')
    })
  })

  describe('When the user types into the field', () => {
    it('Then it emits "update:modelValue" with the typed value', async () => {
      // Arrange
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '' },
      })

      // Act
      await wrapper.find('input').setValue('Ada Lovelace')

      // Assert
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted?.at(-1)).toEqual(['Ada Lovelace'])
    })
  })

  describe('When errorMessages is non-empty', () => {
    it('Then the input is marked aria-invalid and the message is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: {
          label: 'User name',
          modelValue: '',
          errorMessages: ['User name is required'],
        },
      })

      // Assert
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
      expect(wrapper.text()).toContain('User name is required')
    })
  })

  describe('When errorMessages is empty', () => {
    it('Then the input is not marked aria-invalid', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '' },
      })

      // Assert
      const ariaInvalid = wrapper.find('input').attributes('aria-invalid')
      expect(ariaInvalid === undefined || ariaInvalid === 'false').toBe(true)
    })
  })

  describe('When required is true', () => {
    it('Then the input carries a required marker', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '', required: true },
      })

      // Assert
      expect(wrapper.find('input').attributes('required')).toBeDefined()
    })
  })

  describe('When disabled is true', () => {
    it('Then the input is disabled', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '', disabled: true },
      })

      // Assert
      expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })
  })

  describe('When a hint is provided', () => {
    it('Then the hint text is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'User name', modelValue: '', hint: 'As it appears on your profile' },
      })

      // Assert
      expect(wrapper.text()).toContain('As it appears on your profile')
    })
  })

  describe('When type is "number" and the user types a numeric value', () => {
    it('Then it emits "update:modelValue" with a number, not a string', async () => {
      // Arrange
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'Publications', type: 'number', modelValue: 0 },
      })

      // Act
      await wrapper.find('input').setValue('42')

      // Assert
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([42])
    })
  })

  describe('When type is "number" and the field is cleared', () => {
    it('Then it emits "update:modelValue" with null', async () => {
      // Arrange
      const wrapper = mountWithVuetify(GlassTextField, {
        props: { label: 'Publications', type: 'number', modelValue: 5 },
      })

      // Act
      await wrapper.find('input').setValue('')

      // Assert
      expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null])
    })
  })

  describe('When name, autocomplete and inputmode are provided', () => {
    it('Then they are forwarded to the rendered input', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassTextField, {
        props: {
          label: 'Publications',
          modelValue: 0,
          name: 'publications',
          autocomplete: 'off',
          inputmode: 'numeric',
        },
      })

      // Assert
      const input = wrapper.find('input')
      expect(input.attributes('name')).toBe('publications')
      expect(input.attributes('autocomplete')).toBe('off')
      expect(input.attributes('inputmode')).toBe('numeric')
    })
  })
})
