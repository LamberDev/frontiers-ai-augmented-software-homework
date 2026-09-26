import { createVuetify } from 'vuetify'
import type { VuetifyOptions } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { mount } from '@vue/test-utils'
import type { ComponentMountingOptions, VueWrapper } from '@vue/test-utils'
import type { Component, ComponentPublicInstance } from 'vue'
import { frontiersTheme } from '@/shared/config'

// jsdom has no ResizeObserver implementation, but some Vuetify components
// (layout/overlay internals) need one to mount without throwing. Defined
// once, only if missing, without `vi.stubGlobal` so it is not undone by an
// unrelated test's `afterEach(() => vi.unstubAllGlobals())`.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

/**
 * Test-only helper: mounts a component with a real Vuetify instance wired
 * the same way the app does in `src/app/providers/vuetify.ts` (the
 * `frontiers` theme, MDI icons), without `shared` importing from `app` (see
 * `apps/web/AGENTS.md`, layer import rule). Used by `shared/ui` component
 * tests instead of mounting through the app composition root.
 */
function createTestVuetify() {
  const options: VuetifyOptions = {
    theme: {
      defaultTheme: 'frontiers',
      themes: {
        frontiers: frontiersTheme,
      },
    },
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
  }
  return createVuetify(options)
}

// Return type is deliberately loosened to `VueWrapper<ComponentPublicInstance>`
// (instead of a generic `mount<T>(...)` inference): TypeScript cannot name
// the fully generic `ReturnType<typeof mount<T>>` without an unstable
// reference into `vue-component-type-helpers` (see `pnpm build` failure this
// produced), and this helper is test-only tooling, not part of the public
// component API surface, so exact per-instance typing is not needed.
export function mountWithVuetify<T extends Component>(
  component: T,
  options?: ComponentMountingOptions<T>,
): VueWrapper<ComponentPublicInstance> {
  const vuetify = createTestVuetify()
  return mount(component, {
    ...options,
    global: {
      ...options?.global,
      plugins: [vuetify, ...(options?.global?.plugins ?? [])],
    },
  }) as unknown as VueWrapper<ComponentPublicInstance>
}
