<script setup lang="ts">
/**
 * Glass surface container (molecule): a translucent `.glass-surface` card
 * with an optional heading/subtitle and `actions` slot. Renders as a
 * `section` by default; `as` picks a different semantic tag. Whenever a
 * heading is rendered — the default `title` prop rendering, or a caller's
 * `title` slot override — it is wrapped in an element carrying the
 * generated id, and the root is always `aria-labelledby` that id, so the
 * accessible name keeps pointing at whatever is visually the heading.
 *
 * `elevation` (0-3, clamped, non-finite values ignored) is observable: it
 * sets a `glass-card--elevation-{n}` class that maps to an increasing
 * `box-shadow` strength (see the style block below).
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
const hasHeader = computed(() => !!slots.title || !!props.title)

const elevationLevel = computed(() => {
  if (props.elevation === undefined) return undefined
  const numeric = Number(props.elevation)
  if (!Number.isFinite(numeric)) return undefined
  return Math.min(3, Math.max(0, Math.round(numeric)))
})

const elevationClass = computed(() =>
  elevationLevel.value !== undefined ? `glass-card--elevation-${elevationLevel.value}` : undefined,
)
</script>

<template>
  <component
    :is="as"
    class="glass-card glass-surface"
    :class="elevationClass"
    :aria-labelledby="hasHeader ? headingId : undefined"
  >
    <div v-if="hasHeader" class="glass-card__header">
      <div :id="headingId" class="glass-card__title-slot">
        <slot name="title">
          <h2 class="glass-card__title">{{ title }}</h2>
        </slot>
      </div>
      <p v-if="subtitle" class="glass-card__subtitle">{{ subtitle }}</p>
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

.glass-card--elevation-0 {
  box-shadow: none;
}

.glass-card--elevation-1 {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.glass-card--elevation-2 {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
}

.glass-card--elevation-3 {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
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
  color: var(--glass-text, #17171c);
}

.glass-card__actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
