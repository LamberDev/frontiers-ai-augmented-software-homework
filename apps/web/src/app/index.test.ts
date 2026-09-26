import { describe, expect, it, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { createPeerReviewApp } from './index'
import { router } from './providers/router'

// jsdom has no ResizeObserver implementation, but Vuetify's `<v-app>` layout
// system needs one to mount at all. This stub is test-environment plumbing
// (not part of the app wiring under test) — same reason jsdom needs a
// `matchMedia`/`fetch` stub elsewhere in this suite.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Given the composed peer review app', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('When it is mounted and routed to /register', () => {
    it('Then the Vuetify app root, theme class, header and routed page all render', async () => {
      // Arrange
      vi.stubGlobal('ResizeObserver', ResizeObserverStub)
      const host = document.createElement('div')
      document.body.appendChild(host)
      const app = createPeerReviewApp()

      // Act
      app.mount(host)
      await router.push('/register')
      await router.isReady()
      await nextTick()

      // Assert
      const root = host.querySelector('.v-application')
      expect(root).not.toBeNull()
      expect(root?.classList.contains('v-theme--frontiers')).toBe(true)
      expect(host.querySelector('nav')).not.toBeNull()
      expect(host.querySelector('a[href="/register"]')).not.toBeNull()
      expect(host.textContent).toContain('Register user')
      expect(host.querySelector('.glass-shell__background')).not.toBeNull()
      expect(host.querySelectorAll('main')).toHaveLength(1)

      // Cleanup
      app.unmount()
      host.remove()
    })
  })
})
