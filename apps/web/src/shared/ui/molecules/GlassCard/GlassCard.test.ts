import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import GlassCard from './GlassCard.vue'

describe('Given GlassCard', () => {
  describe('When mounted with a title prop', () => {
    it('Then it renders as a <section> labelled by its heading', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        props: { title: 'Result' },
        slots: { default: 'Body content' },
      })

      // Assert
      const root = wrapper.element
      expect(root.tagName).toBe('SECTION')
      const labelledBy = root.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const heading = wrapper.find(`#${labelledBy}`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Result')
      expect(wrapper.text()).toContain('Body content')
    })
  })

  describe('When "as" is set to a different tag', () => {
    it('Then it renders that tag instead of <section>', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        props: { as: 'article' },
      })

      // Assert
      expect(wrapper.element.tagName).toBe('ARTICLE')
    })
  })

  describe('When a subtitle is provided alongside the title', () => {
    it('Then the subtitle text is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        props: { title: 'Result', subtitle: 'Eligibility outcome' },
      })

      // Assert
      expect(wrapper.text()).toContain('Eligibility outcome')
    })
  })

  describe('When an actions slot is provided', () => {
    it('Then it renders the actions content', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        slots: { actions: '<button>Confirm</button>' },
      })

      // Assert
      expect(wrapper.find('button').text()).toBe('Confirm')
    })
  })

  describe('When mounted without a title', () => {
    it('Then it does not set aria-labelledby', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        slots: { default: 'Just content' },
      })

      // Assert
      expect(wrapper.element.hasAttribute('aria-labelledby')).toBe(false)
    })
  })

  describe('When a title slot override is provided', () => {
    it('Then the header is rendered and aria-labelledby points at the visible heading', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        slots: { title: '<h3>Custom heading</h3>', default: 'Body content' },
      })

      // Assert
      const labelledBy = wrapper.element.getAttribute('aria-labelledby')
      expect(labelledBy).toBeTruthy()
      const heading = wrapper.find(`#${labelledBy}`)
      expect(heading.exists()).toBe(true)
      expect(heading.text()).toBe('Custom heading')
    })
  })

  describe('When both a title slot override and a subtitle are provided', () => {
    it('Then the subtitle is still rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, {
        props: { subtitle: 'Eligibility outcome' },
        slots: { title: '<h3>Custom heading</h3>' },
      })

      // Assert
      expect(wrapper.text()).toContain('Eligibility outcome')
    })
  })

  describe('When elevation is set to an in-range value', () => {
    it('Then it applies the matching elevation class', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, { props: { elevation: 2 } })

      // Assert
      expect(wrapper.classes()).toContain('glass-card--elevation-2')
    })
  })

  describe('When elevation is above the supported range', () => {
    it('Then it clamps to the highest elevation class', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, { props: { elevation: 10 } })

      // Assert
      expect(wrapper.classes()).toContain('glass-card--elevation-3')
    })
  })

  describe('When elevation is below the supported range', () => {
    it('Then it clamps to the lowest elevation class', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, { props: { elevation: -1 } })

      // Assert
      expect(wrapper.classes()).toContain('glass-card--elevation-0')
    })
  })

  describe('When elevation is not set', () => {
    it('Then it applies no elevation class', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(GlassCard, { props: {} })

      // Assert
      expect(wrapper.classes().some((cls) => cls.startsWith('glass-card--elevation-'))).toBe(false)
    })
  })
})
