<script setup lang="ts">
/**
 * Base action button: wraps Vuetify's `v-btn` and owns the glass/brand
 * look, so features never style Vuetify directly (see `apps/web/AGENTS.md`).
 *
 * - `primary`: solid brand-blue button (Vuetify picks contrasting white text).
 * - `secondary`: outlined, glass-tinted button (see `.glass-surface` in
 *   `shared/ui/styles/glass.css`).
 * - `ghost`: minimal text-only button.
 */
import { computed } from 'vue'
import { VBtn } from 'vuetify/components'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    block?: boolean
  }>(),
  {
    variant: 'primary',
    loading: false,
    disabled: false,
    type: 'button',
    block: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const vuetifyVariant = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'outlined'
    case 'ghost':
      return 'text'
    default:
      return 'flat'
  }
})

const isDisabled = computed(() => props.disabled || props.loading)

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<template>
  <VBtn
    :type="type"
    color="primary"
    :variant="vuetifyVariant"
    :loading="loading"
    :disabled="isDisabled"
    :block="block"
    :aria-busy="loading ? 'true' : undefined"
    :class="[
      'glass-button',
      `glass-button--${variant}`,
      { 'glass-surface': variant === 'secondary' },
    ]"
    @click="handleClick"
  >
    <template v-if="$slots.prependIcon" #prepend>
      <slot name="prependIcon" />
    </template>
    <slot />
  </VBtn>
</template>
