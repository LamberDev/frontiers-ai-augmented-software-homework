import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import RegisterUserForm from './RegisterUserForm.vue'

function findFieldInput(wrapper: ReturnType<typeof mountWithVuetify>, label: string) {
  const labelEl = wrapper.findAll('label').find((candidate) => candidate.text().startsWith(label))
  const forId = labelEl?.attributes('for')
  return wrapper.find(`#${forId}`)
}

describe('Given RegisterUserForm', () => {
  describe('When mounted', () => {
    it('Then it renders inside a GlassCard titled "Register user"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(RegisterUserForm)

      // Assert
      expect(wrapper.text()).toContain('Register user')
    })
  })

  describe('When submitted with valid, padded values', () => {
    it('Then it emits "submit" with a trimmed, typed RegisterUserInput', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm)
      await findFieldInput(wrapper, 'User name').setValue('  Grace Hopper  ')
      await findFieldInput(wrapper, 'University name').setValue('  MIT  ')
      await findFieldInput(wrapper, 'Number of publications').setValue('5')

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      const emitted = wrapper.emitted('submit')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0][0]).toEqual({
        userName: 'Grace Hopper',
        universityName: 'MIT',
        numberOfPublications: 5,
      })
    })
  })

  describe('When submitted with empty fields', () => {
    it('Then it emits nothing and shows field errors with aria-invalid', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm)

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.text()).toContain('User name is required.')
      expect(wrapper.text()).toContain('University name is required.')
      expect(wrapper.text()).toContain('Number of publications is required.')
      const userNameInput = findFieldInput(wrapper, 'User name')
      expect(userNameInput.attributes('aria-invalid')).toBe('true')
    })
  })

  describe('When a field has not been touched or submitted yet', () => {
    it('Then it shows no error for that field', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(RegisterUserForm)

      // Assert
      expect(wrapper.text()).not.toContain('is required.')
    })
  })

  describe('When a field is edited then cleared (touched)', () => {
    it('Then it shows that field error without submitting', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm)
      const input = findFieldInput(wrapper, 'User name')

      // Act
      await input.setValue('Grace')
      await input.setValue('')

      // Assert
      expect(wrapper.text()).toContain('User name is required.')
      expect(wrapper.emitted('submit')).toBeUndefined()
    })
  })

  describe('When numberOfPublications is entered then cleared', () => {
    it('Then it shows the required error and does not emit submit', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm)
      await findFieldInput(wrapper, 'User name').setValue('Grace Hopper')
      await findFieldInput(wrapper, 'University name').setValue('MIT')
      const publicationsInput = findFieldInput(wrapper, 'Number of publications')
      await publicationsInput.setValue('5')
      await publicationsInput.setValue('')

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.text()).toContain('Number of publications is required.')
    })
  })

  describe('When numberOfPublications is not an integer', () => {
    it('Then it shows the whole-number error and does not emit', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm)
      await findFieldInput(wrapper, 'User name').setValue('Grace Hopper')
      await findFieldInput(wrapper, 'University name').setValue('MIT')
      await findFieldInput(wrapper, 'Number of publications').setValue('1.5')

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.text()).toContain(
        'Number of publications must be a whole number of at least 0.',
      )
    })
  })

  describe('When the loading prop is true', () => {
    it('Then the submit button is disabled', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(RegisterUserForm, { props: { loading: true } })

      // Assert
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })
  })

  describe('When server fieldErrors are passed for an untouched field', () => {
    it('Then it renders the server error', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(RegisterUserForm, {
        props: { fieldErrors: { userName: ['User name is already taken.'] } },
      })

      // Assert
      expect(wrapper.text()).toContain('User name is already taken.')
    })
  })

  describe('When a field with a server error is edited by the user', () => {
    it('Then the server error is replaced by local validation', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm, {
        props: { fieldErrors: { userName: ['User name is already taken.'] } },
      })

      // Act
      const input = findFieldInput(wrapper, 'User name')
      await input.setValue('Ada Lovelace')

      // Assert
      expect(wrapper.text()).not.toContain('User name is already taken.')
    })
  })

  describe('When new server fieldErrors are received after an edit cleared the old one', () => {
    it('Then the new server error is shown again', async () => {
      // Arrange
      const wrapper = mountWithVuetify(RegisterUserForm, {
        props: { fieldErrors: { userName: ['User name is already taken.'] } },
      })
      const input = findFieldInput(wrapper, 'User name')
      await input.setValue('Ada Lovelace')
      expect(wrapper.text()).not.toContain('User name is already taken.')

      // Act
      await wrapper.setProps({ fieldErrors: { userName: ['User name is already taken.'] } })

      // Assert
      expect(wrapper.text()).toContain('User name is already taken.')
    })
  })
})
