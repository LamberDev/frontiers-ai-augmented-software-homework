<script setup lang="ts">
/**
 * Accessible "Frontiers" wordmark: an original inline SVG mark (not the
 * real Frontiers logo artwork) plus text, with an optional subtitle (e.g.
 * "Peer Review"). The whole thing exposes one accessible name via
 * `role="img"` + `aria-label`; the inner text/svg are `aria-hidden` so
 * assistive tech does not announce the wordmark twice.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ subtitle?: string }>(), { subtitle: undefined })

const ariaLabel = computed(() => (props.subtitle ? `Frontiers — ${props.subtitle}` : 'Frontiers'))
</script>

<template>
  <div class="brand-logo" role="img" :aria-label="ariaLabel">
    <svg
      class="brand-logo__mark"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="16" cy="16" r="15" fill="#4D1B7E" />
      <path
        d="M10 22V10h11"
        fill="none"
        stroke="#FFFFFF"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M10 16.5h7" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
    </svg>
    <span class="brand-logo__text" aria-hidden="true">
      <span class="brand-logo__name">Frontiers</span>
      <span v-if="subtitle" class="brand-logo__subtitle">{{ subtitle }}</span>
    </span>
  </div>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-logo__text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-logo__name {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--glass-text, #17171c);
}

.brand-logo__subtitle {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--glass-text, #17171c);
}
</style>
