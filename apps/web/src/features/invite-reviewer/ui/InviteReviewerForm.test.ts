import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import InviteReviewerForm from './InviteReviewerForm.vue'

function findFieldInput(wrapper: ReturnType<typeof mountWithVuetify>, label: string) {
  const labelEl = wrapper
    .findAll('label')
    .find((candidate) => candidate.text().startsWith(label) && !!candidate.attributes('for'))
  const forId = labelEl?.attributes('for')
  return wrapper.find(`#${forId}`)
}

const validUuid = '123e4567-e89b-12d3-a456-426614174000'

describe('Given InviteReviewerForm', () => {
  describe('When mounted', () => {
    it('Then it renders inside a GlassCard titled "Invite reviewer"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(InviteReviewerForm)

      // Assert
      expect(wrapper.text()).toContain('Invite reviewer')
    })
  })

  describe('When submitted with a valid, padded UUID', () => {
    it('Then it emits "submit" with the trimmed userId', async () => {
      // Arrange
      const wrapper = mountWithVuetify(InviteReviewerForm)
      await findFieldInput(wrapper, 'User id').setValue(`  ${validUuid}  `)

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      const emitted = wrapper.emitted('submit')
      expect(emitted).toHaveLength(1)
      expect(emitted?.[0][0]).toEqual({ userId: validUuid })
    })
  })

  describe('When submitted empty', () => {
    it('Then it emits nothing and shows the required error with aria-invalid', async () => {
      // Arrange
      const wrapper = mountWithVuetify(InviteReviewerForm)

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.text()).toContain('User id is required.')
      expect(findFieldInput(wrapper, 'User id').attributes('aria-invalid')).toBe('true')
    })
  })

  describe('When submitted with a non-UUID value', () => {
    it('Then it emits nothing and shows the UUID format error', async () => {
      // Arrange
      const wrapper = mountWithVuetify(InviteReviewerForm)
      await findFieldInput(wrapper, 'User id').setValue('not-a-uuid')

      // Act
      await wrapper.find('form').trigger('submit')

      // Assert
      expect(wrapper.emitted('submit')).toBeUndefined()
      expect(wrapper.text()).toContain('User id must be a valid UUID.')
    })
  })

  describe('When initialUserId is provided', () => {
    it('Then the field is prefilled with it', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(InviteReviewerForm, {
        props: { initialUserId: validUuid },
      })

      // Assert
      const input = findFieldInput(wrapper, 'User id')
      expect((input.element as HTMLInputElement).value).toBe(validUuid)
    })
  })

  describe('When the loading prop is true', () => {
    it('Then the submit button is disabled', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(InviteReviewerForm, { props: { loading: true } })

      // Assert
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })
  })

  describe('When a server fieldErrors prop is passed for an untouched field', () => {
    it('Then it renders the server error', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(InviteReviewerForm, {
        props: { fieldErrors: { userId: ['User id was not found.'] } },
      })

      // Assert
      expect(wrapper.text()).toContain('User id was not found.')
    })
  })

  describe('When the field with a server error is edited by the user', () => {
    it('Then the server error is replaced by local validation', async () => {
      // Arrange
      const wrapper = mountWithVuetify(InviteReviewerForm, {
        props: { fieldErrors: { userId: ['User id was not found.'] } },
      })

      // Act
      await findFieldInput(wrapper, 'User id').setValue('not-a-uuid')

      // Assert
      expect(wrapper.text()).not.toContain('User id was not found.')
      expect(wrapper.text()).toContain('User id must be a valid UUID.')
    })
  })
})
