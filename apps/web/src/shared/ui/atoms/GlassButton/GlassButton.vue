<script setup lang="ts">
/**
 * Base action button: wraps Vuetify's `v-btn` and owns the glass/brand
 * look, so features never style Vuetify directly (see `apps/web/AGENTS.md`).
 *
 * - `primary`: solid brand-blue button (Vuetify picks contrasting white text).
 * - `secondary`: outlined, glass-tinted button (see `.glass-surface` in
 *   `shared/ui/styles/glass.css`).
 * - `ghost`: minimal text-only button.
 *
 * `to` renders this as a navigation link (Vuetify's own `VBtn` `to`/router
 * support) instead of a `<button>` — e.g. a page-to-page action styled as a
 * button, such as "Invite as reviewer" navigating to the invite page. `type`
 * is only meaningful without `to`.
 */
import { computed } from 'vue'
import { VBtn } from 'vuetify/components'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
    block?: boolean
    to?: RouteLocationRaw
  }>(),
  {
    variant: 'primary',
    loading: false,
    disabled: false,
    type: 'button',
    block: false,
    to: undefined,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

type ButtonVariant = NonNullable<typeof props.variant>

const vuetifyVariantByVariant = {
  primary: 'flat',
  secondary: 'outlined',
  ghost: 'text',
} as const satisfies Record<ButtonVariant, VBtn['$props']['variant']>

// Falls back to `flat` (the `primary` mapping) for any runtime variant that
// does not match the typed union — e.g. a value passed from untyped JS, or
// one that slips past a widened/cast type at a call site — instead of
// silently passing `undefined` through to VBtn (which would then apply its
// own default variant, `elevated`, an un-styled look this component never
// intends to render).
const vuetifyVariant = computed(
  () => vuetifyVariantByVariant[props.variant] ?? vuetifyVariantByVariant.primary,
)

const isDisabled = computed(() => props.disabled || props.loading)

function handleClick(event: MouseEvent) {
  emit('click', event)
}
</script>

<template>
  <VBtn
    :type="type"
    :to="to"
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
