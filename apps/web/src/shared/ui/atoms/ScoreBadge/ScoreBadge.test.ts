import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import ScoreBadge from './ScoreBadge.vue'

describe('Given ScoreBadge', () => {
  describe('When score is null', () => {
    it('Then it renders "Unknown" and an accessible label saying "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: null } })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
      expect(wrapper.attributes('aria-label')).toContain('Unknown')
    })
  })

  describe('When score is undefined', () => {
    it('Then it renders "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: undefined } })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('When score is above the threshold', () => {
    it('Then it renders the score with a success color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: 80, threshold: 70 } })

      // Assert
      expect(wrapper.text()).toContain('80')
      expect(wrapper.classes().join(' ')).toContain('success')
    })
  })

  describe('When score equals the threshold (boundary)', () => {
    it('Then it renders with a success color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: 70, threshold: 70 } })

      // Assert
      expect(wrapper.classes().join(' ')).toContain('success')
    })
  })

  describe('When score is below the threshold', () => {
    it('Then it renders with an error color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: 60, threshold: 70 } })

      // Assert
      expect(wrapper.classes().join(' ')).toContain('error')
    })
  })

  describe('When no threshold is provided', () => {
    it('Then it renders neutrally, without a success or error color', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: 42 } })

      // Assert
      const classes = wrapper.classes().join(' ')
      expect(classes).not.toContain('success')
      expect(classes).not.toContain('error')
    })
  })

  describe('When score is NaN', () => {
    it('Then it renders "Unknown", a neutral color and an accessible label saying "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: NaN, threshold: 70 } })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
      expect(wrapper.attributes('aria-label')).toContain('Unknown')
      const classes = wrapper.classes().join(' ')
      expect(classes).not.toContain('success')
      expect(classes).not.toContain('error')
    })
  })

  describe('When score is Infinity', () => {
    it('Then it renders "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: Infinity } })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('When score is -Infinity', () => {
    it('Then it renders "Unknown"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, { props: { score: -Infinity } })

      // Assert
      expect(wrapper.text()).toContain('Unknown')
    })
  })

  describe('When a custom label is provided', () => {
    it('Then the accessible label uses it instead of the generic default', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ScoreBadge, {
        props: { score: 72, label: 'University score' },
      })

      // Assert
      expect(wrapper.attributes('aria-label')).toBe('University score 72')
    })
  })
})
