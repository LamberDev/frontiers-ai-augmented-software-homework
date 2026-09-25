import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { VBtn } from 'vuetify/components'
import { vuetify } from './vuetify'

describe('Given the app Vuetify plugin', () => {
  describe('When it is created', () => {
    it("Then its default theme is 'frontiers'", () => {
      // Arrange / Act
      const { name } = vuetify.theme

      // Assert
      expect(name.value).toBe('frontiers')
    })

    it('Then it mounts a component using a Vuetify component without errors', () => {
      // Arrange
      const host = document.createElement('div')
      const TestComponent = defineComponent({
        render: () => h(VBtn, null, () => 'Click me'),
      })
      const app = createApp(TestComponent)
      app.use(vuetify)

      // Act
      const mount = () => app.mount(host)

      // Assert
      expect(mount).not.toThrow()
      expect(host.querySelector('.v-btn')).not.toBeNull()

      app.unmount()
    })
  })
})
