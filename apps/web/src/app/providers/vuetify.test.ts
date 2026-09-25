import { describe, expect, it, vi, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { VApp, VBtn } from 'vuetify/components'
import { vuetify } from './vuetify'

// jsdom has no ResizeObserver implementation, but Vuetify's `<v-app>` layout
// system needs one to mount at all. This stub is test-environment plumbing,
// not part of the theme wiring under test.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Single shared test component (kept to one `defineComponent` in this file,
// see `vue/one-component-per-file`): a `<v-app>` root wrapping a Vuetify
// component, used to prove the plugin mounts cleanly and applies its theme.
const TestApp = defineComponent({
  render: () => h(VApp, null, () => h(VBtn, null, () => 'Click me')),
})

describe('Given the app Vuetify plugin', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('When it is created', () => {
    it("Then its default theme is 'frontiers'", () => {
      // Arrange / Act
      const { name } = vuetify.theme

      // Assert
      expect(name.value).toBe('frontiers')
    })

    it("Then it mounts within v-app without errors, and applies the 'frontiers' theme as an observable class and rgb CSS variable", () => {
      // Arrange
      vi.stubGlobal('ResizeObserver', ResizeObserverStub)
      const host = document.createElement('div')
      const app = createApp(TestApp)
      app.use(vuetify)

      // Act
      const mount = () => app.mount(host)

      // Assert: mounts cleanly and renders the wrapped Vuetify component.
      expect(mount).not.toThrow()
      expect(host.querySelector('.v-btn')).not.toBeNull()

      // Assert: the theme name is applied as an observable DOM class on the
      // app root, not only readable from the internal `theme.name` ref.
      const root = host.querySelector('.v-application')
      expect(root).not.toBeNull()
      expect(root?.classList.contains('v-theme--frontiers')).toBe(true)

      // Assert: Vuetify writes the resolved theme colors into a generated
      // stylesheet (`#vuetify-theme-stylesheet`) as rgb CSS variables; brand
      // primary #0C4DED must resolve to the "12,77,237" rgb triplet there.
      const themeStylesheet = document.getElementById('vuetify-theme-stylesheet')
      expect(themeStylesheet?.textContent).toContain('--v-theme-primary: 12,77,237')

      app.unmount()
    })
  })
})
