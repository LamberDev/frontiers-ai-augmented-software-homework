<script setup lang="ts">
/**
 * Generic numeric score badge (deliberately business-agnostic: `shared/ui`
 * must not name domain concepts like "university" — see
 * `odd/tasks/frontend-ui.md`). Consumers in higher layers (e.g.
 * `entities/university`) pass a contextual `label` ("University score")
 * for the accessible name; the default stays generic ("Score").
 */
import { computed } from 'vue'
import { VChip } from 'vuetify/components'

const props = withDefaults(
  defineProps<{
    score: number | null | undefined
    threshold?: number
    label?: string
  }>(),
  {
    threshold: undefined,
    label: 'Score',
  },
)

// Treat non-finite numbers (NaN, +/-Infinity) as unknown too, not just
// null/undefined, so an upstream calculation error never renders as a
// literal "NaN" or "Infinity" badge (see `odd/tasks/frontend-ui.md`, T2.1
// item 5).
const isUnknown = computed(
  () => props.score === null || props.score === undefined || !Number.isFinite(props.score),
)

const colorByOutcome = {
  unknown: undefined,
  pass: 'success',
  fail: 'error',
} as const

const outcome = computed<keyof typeof colorByOutcome>(() => {
  if (isUnknown.value || props.threshold === undefined) return 'unknown'
  return props.score! >= props.threshold ? 'pass' : 'fail'
})

const color = computed(() => colorByOutcome[outcome.value])

const displayText = computed(() => (isUnknown.value ? 'Unknown' : String(props.score)))

const ariaLabel = computed(() => `${props.label} ${displayText.value}`)
</script>

<template>
  <VChip :color="color" variant="flat" class="score-badge" :aria-label="ariaLabel">
    {{ displayText }}
  </VChip>
</template>
