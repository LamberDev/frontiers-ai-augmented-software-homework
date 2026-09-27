<script setup lang="ts">
/**
 * Wraps Vuetify's `v-alert` to present a typed result (success/error/
 * info/warning) with a title, optional message and reason list. Uses
 * `role="status"`/`aria-live="polite"` for success/info, and
 * `role="alert"`/`aria-live="assertive"` for error/warning, so assistive
 * tech announces failures more urgently than confirmations.
 *
 * Renders as a solid, opaque toast (via Vuetify's `variant="flat"` +
 * `type`-driven theme color, e.g. `bg-success`/`bg-warning`/`bg-error` —
 * see `frontiersTheme.ts`'s toast semantic colors), never the translucent
 * `.glass-surface` used elsewhere in `shared/ui`: a toast's background must
 * stay legible regardless of whatever page content sits behind it (see
 * `odd/tasks/glass-palette.md`, T3). Rendered inside `ToastStack`, which
 * owns placement (fixed, top-right) and auto-dismiss timing.
 *
 * Visibility contract (redesigned in T2.3, superseding T2.1 item 1 — see
 * `odd/tasks/frontend-ui.md`): this component is stateless with respect to
 * visibility. It is visible for exactly as long as it is mounted, and it
 * never hides itself. The parent owns the list of results and renders one
 * `ResultAlert` per result (e.g. `v-for` keyed by a stable result id);
 * closing (via the `closable` close button) only emits `close`, and the
 * parent reacts by removing that result from its list, which unmounts this
 * instance. An alert is never reused for a different result and never
 * reopens on its own.
 */
import { computed } from 'vue'
import { VAlert } from 'vuetify/components'

const props = withDefaults(
  defineProps<{
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message?: string
    items?: string[]
    closable?: boolean
  }>(),
  {
    message: undefined,
    items: () => [],
    closable: false,
  },
)

const emit = defineEmits<{
  close: []
}>()

const announcementByType = {
  success: { role: 'status', ariaLive: 'polite' },
  info: { role: 'status', ariaLive: 'polite' },
  warning: { role: 'alert', ariaLive: 'assertive' },
  error: { role: 'alert', ariaLive: 'assertive' },
} as const satisfies Record<typeof props.type, { role: string; ariaLive: string }>

// Vuetify's default `error` icon is `mdi-close-circle` (an "x" in a circle), which reads
// as a second close button next to the real one. Every type gets an unambiguous glyph.
const iconByType = {
  success: 'mdi-check-circle',
  info: 'mdi-information',
  warning: 'mdi-alert',
  error: 'mdi-alert-octagon',
} as const satisfies Record<typeof props.type, string>

const icon = computed(() => iconByType[props.type])
const role = computed(() => announcementByType[props.type].role)
const ariaLive = computed(() => announcementByType[props.type].ariaLive)

// VAlert manages its own visibility internally (Vuetify's `useProxiedModel`)
// even without a `v-model`: clicking the `closable` close button sets its
// internal `isActive` ref to `false` and stops rendering — unless the
// binding is "controlled" (a `model-value` prop *and* an
// `onUpdate:modelValue` listener both present on the tag). A no-op
// writable `v-model` keeps VAlert always controlled and always `true`, so
// it never hides itself; only the emitted `close` event (below) signals
// removal, which the parent performs by unmounting this instance.
const alwaysVisible = computed({
  get: () => true,
  set: () => {},
})

function handleClose() {
  emit('close')
}
</script>

<template>
  <VAlert
    v-model="alwaysVisible"
    :type="type"
    :title="title"
    :text="message"
    :icon="icon"
    :closable="closable"
    close-label="Dismiss notification"
    :role="role"
    :aria-live="ariaLive"
    variant="flat"
    class="result-alert"
    @click:close="handleClose"
  >
    <ul v-if="items.length" class="result-alert__items">
      <li v-for="(item, index) in items" :key="`${index}:${item}`">{{ item }}</li>
    </ul>
  </VAlert>
</template>

<style scoped>
.result-alert__items {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
</style>
