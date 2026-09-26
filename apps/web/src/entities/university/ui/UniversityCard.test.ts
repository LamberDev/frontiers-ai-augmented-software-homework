import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import UniversityCard from './UniversityCard.vue'
import type { University } from '../model/types'

function university(overrides: Partial<University> = {}): University {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    frontiersOrganizationId: 42,
    name: 'MIT',
    score: 72,
    ...overrides,
  }
}

describe('Given UniversityCard', () => {
  describe('When mounted with a university', () => {
    it('Then it renders the name and the Frontiers organization id', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UniversityCard, {
        props: { university: university() },
      })

      // Assert
      expect(wrapper.text()).toContain('MIT')
      expect(wrapper.text()).toContain('Frontiers organization id')
      expect(wrapper.text()).toContain('42')
    })
  })

  describe('When score is null', () => {
    it('Then the score badge shows "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UniversityCard, {
        props: { university: university({ score: null }) },
      })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('When score is at the reviewer threshold boundary (60)', () => {
    it('Then it renders with a passing (success) color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UniversityCard, {
        props: { university: university({ score: 60 }) },
      })

      // Assert
      expect(wrapper.findComponent({ name: 'VChip' }).classes().join(' ')).toContain('success')
    })
  })

  describe('When score is below the reviewer threshold', () => {
    it('Then it renders with a failing (error) color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UniversityCard, {
        props: { university: university({ score: 59 }) },
      })

      // Assert
      expect(wrapper.findComponent({ name: 'VChip' }).classes().join(' ')).toContain('error')
    })
  })

  describe('When mounted', () => {
    it('Then the score badge uses the "University score" accessible label', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(UniversityCard, {
        props: { university: university({ score: 72 }) },
      })

      // Assert
      expect(wrapper.find('.score-badge').attributes('aria-label')).toBe('University score 72')
    })
  })
})
