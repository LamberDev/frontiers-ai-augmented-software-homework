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

const isUnknown = computed(() => props.score === null || props.score === undefined)

const color = computed<'success' | 'error' | undefined>(() => {
  if (isUnknown.value || props.threshold === undefined) return undefined
  return props.score! >= props.threshold ? 'success' : 'error'
})

const displayText = computed(() => (isUnknown.value ? 'Unknown' : String(props.score)))

const ariaLabel = computed(() => `${props.label} ${displayText.value}`)
</script>

<template>
  <VChip :color="color" variant="flat" class="score-badge" :aria-label="ariaLabel">
    {{ displayText }}
  </VChip>
</template>
