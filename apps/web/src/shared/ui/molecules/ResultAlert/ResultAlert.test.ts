import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import ResultAlert from './ResultAlert.vue'

interface TestResult {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
}

// Single shared test harness component (kept to one `defineComponent` in
// this file, see `vue/one-component-per-file`): a parent that owns a list
// of results and renders one `ResultAlert` per result, keyed by a stable
// id, emitting the updated list when a result's alert is closed. This is
// the contract T2.3 introduces: the parent (not `ResultAlert` itself) owns
// removal, so this suite drives that removal by reacting to the emitted
// event the same way a real parent would (see the existing "re-shows"
// simulation pattern below), rather than asserting on internal component
// state.
const ResultAlertList = defineComponent({
  props: {
    items: { type: Array as () => TestResult[], required: true },
  },
  emits: ['update:items'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        props.items.map((item) =>
          h(ResultAlert, {
            key: item.id,
            type: item.type,
            title: item.title,
            closable: true,
            onClose: () =>
              emit(
                'update:items',
                props.items.filter((current) => current.id !== item.id),
              ),
          }),
        ),
      )
  },
})

describe('Given ResultAlert', () => {
  describe('When type is "success"', () => {
    it('Then it has role="status" and an aria-live of "polite"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'success', title: 'Registration complete' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('status')
      expect(wrapper.attributes('aria-live')).toBe('polite')
      expect(wrapper.text()).toContain('Registration complete')
    })
  })

  describe('When type is "info"', () => {
    it('Then it has role="status"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'info', title: 'Heads up' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('status')
    })
  })

  describe('When type is "error"', () => {
    it('Then it has role="alert" and an aria-live of "assertive"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'error', title: 'Registration failed' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('alert')
      expect(wrapper.attributes('aria-live')).toBe('assertive')
    })
  })

  describe('When type is "warning"', () => {
    it('Then it has role="alert"', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'warning', title: 'Careful' },
      })

      // Assert
      expect(wrapper.attributes('role')).toBe('alert')
    })
  })

  describe('When items are provided', () => {
    it('Then each item is rendered as a list entry', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: {
          type: 'error',
          title: 'Not eligible',
          items: ['Score below threshold', 'Missing publications'],
        },
      })

      // Assert
      const items = wrapper.findAll('li')
      expect(items).toHaveLength(2)
      expect(items[0].text()).toBe('Score below threshold')
      expect(items[1].text()).toBe('Missing publications')
    })
  })

  describe('When a message is provided', () => {
    it('Then the message text is rendered', () => {
      // Arrange / Act
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'success', title: 'Done', message: 'You can close this window.' },
      })

      // Assert
      expect(wrapper.text()).toContain('You can close this window.')
    })
  })

  describe('When a re-render reorders a list containing duplicate values', () => {
    it('Then it renders every entry without a Vue duplicate-key warning', async () => {
      // Arrange
      // Vue's "Duplicate keys found during update" warning is only raised
      // while diffing an update that cannot be resolved by simple
      // prefix/suffix matching (an actual reorder), not on the initial
      // mount and not on a same-order update — so the list must reorder at
      // least once to exercise the keyed diff that a plain `:key="item"`
      // would trip over for duplicate item text.
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = mountWithVuetify(ResultAlert, {
        props: {
          type: 'error',
          title: 'Not eligible',
          items: ['Missing university', 'Score below threshold', 'Score below threshold'],
        },
      })

      // Act
      await wrapper.setProps({
        items: ['Score below threshold', 'Score below threshold', 'Missing university'],
      })

      // Assert
      const items = wrapper.findAll('li')
      expect(items.map((item) => item.text())).toEqual([
        'Score below threshold',
        'Score below threshold',
        'Missing university',
      ])
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe('When items change', () => {
    it('Then the rendered list updates to match', async () => {
      // Arrange
      const wrapper = mountWithVuetify(ResultAlert, {
        props: { type: 'error', title: 'Not eligible', items: ['First'] },
      })

      // Act
      await wrapper.setProps({ items: ['Second', 'Third'] })

      // Assert
      const items = wrapper.findAll('li')
      expect(items.map((item) => item.text())).toEqual(['Second', 'Third'])
    })
  })

  describe('Given a closable alert', () => {
    describe('When the close button is clicked', () => {
      it('Then it emits "close" once and the alert is still rendered (it does not hide itself)', async () => {
        // Arrange
        const wrapper = mountWithVuetify(ResultAlert, {
          props: { type: 'info', title: 'Dismiss me', closable: true },
        })

        // Act
        await wrapper.find('.v-alert__close button').trigger('click')

        // Assert
        expect(wrapper.emitted('close')).toHaveLength(1)
        expect(wrapper.find('.result-alert').exists()).toBe(true)
        expect(wrapper.text()).toContain('Dismiss me')
      })
    })
  })

  describe('Given a parent rendering multiple results with v-for keyed by a stable id', () => {
    describe('When one alert is closed and the parent removes it from its list', () => {
      it('Then only that alert disappears and the others stay', async () => {
        // Arrange
        const items: TestResult[] = [
          { id: 'a', type: 'success', title: 'First result' },
          { id: 'b', type: 'error', title: 'Second result' },
          { id: 'c', type: 'info', title: 'Third result' },
        ]
        const wrapper = mountWithVuetify(ResultAlertList, { props: { items } })

        // Act
        await wrapper.findAll('.v-alert__close button')[1].trigger('click')
        const emitted = wrapper.emitted('update:items')
        // A real parent reacts to the emitted updated list by updating its
        // own bound value; simulate that here (same pattern used elsewhere
        // in this suite for setProps-driven updates).
        await wrapper.setProps({ items: emitted?.[0][0] as TestResult[] })

        // Assert
        expect(wrapper.findAll('.result-alert')).toHaveLength(2)
        expect(wrapper.text()).toContain('First result')
        expect(wrapper.text()).not.toContain('Second result')
        expect(wrapper.text()).toContain('Third result')
      })
    })

    describe('When a new result is appended, even with identical content to a removed one', () => {
      it('Then a new visible alert is rendered', async () => {
        // Arrange
        const items: TestResult[] = [{ id: 'a', type: 'success', title: 'Result' }]
        const wrapper = mountWithVuetify(ResultAlertList, { props: { items } })
        await wrapper.find('.v-alert__close button').trigger('click')
        const afterClose = wrapper.emitted('update:items')?.[0][0] as TestResult[]
        await wrapper.setProps({ items: afterClose })
        expect(wrapper.findAll('.result-alert')).toHaveLength(0)

        // Act
        await wrapper.setProps({ items: [{ id: 'b', type: 'success', title: 'Result' }] })

        // Assert
        expect(wrapper.findAll('.result-alert')).toHaveLength(1)
        expect(wrapper.text()).toContain('Result')
      })
    })
  })

  describe('Given a parent re-rendering with a freshly built items array of identical content', () => {
    it('Then the alert content is unchanged and nothing re-mounts or hides', async () => {
      // Arrange
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const items: TestResult[] = [{ id: 'a', type: 'success', title: 'Stable result' }]
      const wrapper = mountWithVuetify(ResultAlertList, { props: { items } })

      // Act
      await wrapper.setProps({ items: [{ id: 'a', type: 'success', title: 'Stable result' }] })

      // Assert
      expect(wrapper.findAll('.result-alert')).toHaveLength(1)
      expect(wrapper.text()).toContain('Stable result')
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })
})
