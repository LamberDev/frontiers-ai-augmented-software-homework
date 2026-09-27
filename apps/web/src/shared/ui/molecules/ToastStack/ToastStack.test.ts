import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountWithVuetify } from '@test/support/mountWithVuetify'
import ToastStack from './ToastStack.vue'
import type { ResultAlertEntry } from '../ResultAlert/ResultAlertEntry'

describe('Given ToastStack', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('When mounted with result entries', () => {
    it('Then it renders one closable ResultAlert per entry inside the fixed toast region', () => {
      // Arrange
      const items: ResultAlertEntry[] = [
        { id: 'a', type: 'success', title: 'Saved' },
        { id: 'b', type: 'error', title: 'Failed' },
      ]

      // Act
      const wrapper = mountWithVuetify(ToastStack, { props: { items } })

      // Assert
      expect(wrapper.classes()).toContain('toast-stack')
      expect(wrapper.findAll('.result-alert')).toHaveLength(2)
      expect(wrapper.findAll('.v-alert__close button')).toHaveLength(2)
    })
  })

  describe('When the close button of an entry is clicked', () => {
    it('Then it emits "close" with that entry\'s id', async () => {
      // Arrange
      const items: ResultAlertEntry[] = [{ id: 'a', type: 'info', title: 'Heads up' }]
      const wrapper = mountWithVuetify(ToastStack, { props: { items } })

      // Act
      await wrapper.find('.v-alert__close button').trigger('click')

      // Assert
      expect(wrapper.emitted('close')).toEqual([['a']])
    })
  })

  describe('When a warning result carries reasons', () => {
    it("Then the reasons are rendered as the alert's item list", () => {
      // Arrange
      const items: ResultAlertEntry[] = [
        { id: 'a', type: 'warning', title: 'Reviewer not invited', items: ['Score too low'] },
      ]

      // Act
      const wrapper = mountWithVuetify(ToastStack, { props: { items } })

      // Assert
      expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['Score too low'])
    })
  })

  describe('Given a success entry', () => {
    describe('When 5 seconds elapse without user interaction', () => {
      it('Then it auto-dismisses by emitting "close" with its id', () => {
        // Arrange
        vi.useFakeTimers()
        const items: ResultAlertEntry[] = [{ id: 'a', type: 'success', title: 'Saved' }]
        const wrapper = mountWithVuetify(ToastStack, { props: { items } })

        // Act
        vi.advanceTimersByTime(5000)

        // Assert
        expect(wrapper.emitted('close')).toEqual([['a']])
      })
    })
  })

  describe('Given warning and error entries', () => {
    describe('When 5 seconds elapse without user interaction', () => {
      it('Then neither auto-dismisses', () => {
        // Arrange
        vi.useFakeTimers()
        const items: ResultAlertEntry[] = [
          { id: 'a', type: 'warning', title: 'Careful' },
          { id: 'b', type: 'error', title: 'Failed' },
        ]
        const wrapper = mountWithVuetify(ToastStack, { props: { items } })

        // Act
        vi.advanceTimersByTime(5000)

        // Assert
        expect(wrapper.emitted('close')).toBeUndefined()
      })
    })
  })

  describe('Given a success entry the user closes before its auto-dismiss timer fires', () => {
    describe('When the parent removes it from items and 5 seconds elapse', () => {
      it('Then no extra "close" is emitted from the cleared timer', async () => {
        // Arrange
        vi.useFakeTimers()
        const items: ResultAlertEntry[] = [{ id: 'a', type: 'success', title: 'Saved' }]
        const wrapper = mountWithVuetify(ToastStack, { props: { items } })
        await wrapper.find('.v-alert__close button').trigger('click')
        await wrapper.setProps({ items: [] })

        // Act
        vi.advanceTimersByTime(5000)

        // Assert
        expect(wrapper.emitted('close')).toEqual([['a']])
      })
    })
  })

  describe('Given a mounted stack with a pending success auto-dismiss timer', () => {
    describe('When the component unmounts before 5 seconds elapse', () => {
      it('Then the timer is cleared and never emits after unmount', () => {
        // Arrange
        vi.useFakeTimers()
        const items: ResultAlertEntry[] = [{ id: 'a', type: 'success', title: 'Saved' }]
        const wrapper = mountWithVuetify(ToastStack, { props: { items } })

        // Act
        wrapper.unmount()
        vi.advanceTimersByTime(5000)

        // Assert
        expect(wrapper.emitted('close')).toBeUndefined()
      })
    })
  })

  describe('Given a new success entry appended after an earlier one already auto-dismissed', () => {
    describe('When 5 more seconds elapse', () => {
      it('Then only the new entry auto-dismisses (each entry gets its own timer)', async () => {
        // Arrange
        vi.useFakeTimers()
        const first: ResultAlertEntry[] = [{ id: 'a', type: 'success', title: 'Saved' }]
        const wrapper = mountWithVuetify(ToastStack, { props: { items: first } })
        vi.advanceTimersByTime(5000)
        expect(wrapper.emitted('close')).toEqual([['a']])

        // Act
        await wrapper.setProps({
          items: [{ id: 'b', type: 'success', title: 'Saved again' }],
        })
        vi.advanceTimersByTime(5000)

        // Assert
        expect(wrapper.emitted('close')).toEqual([['a'], ['b']])
      })
    })
  })
})
