<script setup lang="ts">
/**
 * Wraps Vuetify's `v-alert` to present a typed result (success/error/
 * info/warning) with a title, optional message and reason list. Uses
 * `role="status"`/`aria-live="polite"` for success/info, and
 * `role="alert"`/`aria-live="assertive"` for error/warning, so assistive
 * tech announces failures more urgently than confirmations.
 *
 * Visibility contract (see `odd/tasks/frontend-ui.md`, T2.1 item 1):
 * visibility is parent-controllable through `v-model` (default: visible).
 * Closing (via the `closable` close button) sets the model to `false` (so
 * both `update:modelValue` and `close` are emitted) instead of only
 * flipping Vuetify's own internal, unreachable state. A parent can always
 * re-show a dismissed alert by setting the model back to `true`; in
 * addition, whenever the alert's own content (`type`/`title`/`message`/
 * `items`) changes, a dismissed alert automatically resets to visible,
 * so a new result is never silently hidden behind a previous dismissal.
 */
import { computed, watch } from 'vue'
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

const visible = defineModel<boolean>({ default: true })

const announcementByType = {
  success: { role: 'status', ariaLive: 'polite' },
  info: { role: 'status', ariaLive: 'polite' },
  warning: { role: 'alert', ariaLive: 'assertive' },
  error: { role: 'alert', ariaLive: 'assertive' },
} as const satisfies Record<typeof props.type, { role: string; ariaLive: string }>

const role = computed(() => announcementByType[props.type].role)
const ariaLive = computed(() => announcementByType[props.type].ariaLive)

function handleClose() {
  emit('close')
}

watch(
  () => [props.type, props.title, props.message, props.items],
  () => {
    visible.value = true
  },
  { deep: true },
)
</script>

<template>
  <VAlert
    v-model="visible"
    :type="type"
    :title="title"
    :text="message"
    :closable="closable"
    :role="role"
    :aria-live="ariaLive"
    variant="flat"
    class="result-alert glass-surface"
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
