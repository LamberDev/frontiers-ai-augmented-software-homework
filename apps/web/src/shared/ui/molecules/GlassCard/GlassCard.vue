<script setup lang="ts">
/**
 * Glass surface container (molecule): a translucent `.glass-surface` card
 * with an optional heading/subtitle and `actions` slot. Renders as a
 * `section` by default; `as` picks a different semantic tag. When titled
 * through the `title` prop (not the `title` slot override), the root is
 * `aria-labelledby` the generated heading id.
 */
import { computed, useId, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    as?: string
    elevation?: number | string
  }>(),
  {
    title: undefined,
    subtitle: undefined,
    as: 'section',
    elevation: undefined,
  },
)

const slots = useSlots()

const headingId = useId()
// Auto aria-labelledby only applies to the default `title` prop rendering:
// a caller overriding the `title` slot owns their own heading and labeling.
const hasAutoHeading = computed(() => !slots.title && !!props.title)
const hasHeader = computed(() => !!slots.title || !!props.title)
</script>

<template>
  <component
    :is="as"
    class="glass-card glass-surface"
    :aria-labelledby="hasAutoHeading ? headingId : undefined"
    :style="elevation !== undefined ? { '--glass-card-elevation': String(elevation) } : undefined"
  >
    <div v-if="hasHeader" class="glass-card__header">
      <slot name="title">
        <h2 :id="headingId" class="glass-card__title">{{ title }}</h2>
      </slot>
      <p v-if="subtitle && !slots.title" class="glass-card__subtitle">{{ subtitle }}</p>
    </div>
    <div class="glass-card__content">
      <slot />
    </div>
    <div v-if="$slots.actions" class="glass-card__actions">
      <slot name="actions" />
    </div>
  </component>
</template>

<style scoped>
.glass-card {
  padding: 1.5rem;
}

.glass-card__header {
  margin-bottom: 1rem;
}

.glass-card__title {
  margin: 0;
  font-size: 1.25rem;
}

.glass-card__subtitle {
  margin: 0.25rem 0 0;
  color: #545454;
}

.glass-card__actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
