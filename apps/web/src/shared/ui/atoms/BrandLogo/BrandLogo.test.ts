import { describe, expect, it } from 'vitest'
import { mountWithVuetify } from '@/shared/lib/test/mountWithVuetify'
import BrandLogo from './BrandLogo.vue'

describe('Given BrandLogo', () => {
  describe('When mounted without a subtitle', () => {
    it('Then it exposes an accessible name of "Frontiers"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(BrandLogo)

      // Assert
      expect(wrapper.attributes('aria-label')).toBe('Frontiers')
      expect(wrapper.text()).toContain('Frontiers')
    })

    it('Then it renders an inline SVG mark', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(BrandLogo)

      // Assert
      expect(wrapper.find('svg').exists()).toBe(true)
    })
  })

  describe('When mounted with a subtitle', () => {
    it('Then the accessible name includes both the wordmark and the subtitle', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(BrandLogo, {
        props: { subtitle: 'Peer Review' },
      })

      // Assert
      expect(wrapper.attributes('aria-label')).toContain('Frontiers')
      expect(wrapper.attributes('aria-label')).toContain('Peer Review')
      expect(wrapper.text()).toContain('Peer Review')
    })
  })
})
