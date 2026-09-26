<script setup lang="ts">
/**
 * Wraps Vuetify's `v-alert` to present a typed result (success/error/
 * info/warning) with a title, optional message and reason list. Uses
 * `role="status"`/`aria-live="polite"` for success/info, and
 * `role="alert"`/`aria-live="assertive"` for error/warning, so assistive
 * tech announces failures more urgently than confirmations.
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

const role = computed(() =>
  props.type === 'error' || props.type === 'warning' ? 'alert' : 'status',
)
const ariaLive = computed(() => (role.value === 'alert' ? 'assertive' : 'polite'))

function handleClose() {
  emit('close')
}
</script>

<template>
  <VAlert
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
      <li v-for="item in items" :key="item">{{ item }}</li>
    </ul>
  </VAlert>
</template>

<style scoped>
.result-alert__items {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
}
</style>
