<script setup lang="ts">
/**
 * Base text input: wraps Vuetify's `v-text-field` and owns the glass/brand
 * look, so features never style Vuetify directly (see `apps/web/AGENTS.md`).
 * Label association and the required marker are Vuetify's own accessible
 * field behavior; `aria-invalid` is bound explicitly (see below).
 *
 * Numeric model contract (see `odd/tasks/frontend-ui.md`, T2.1 item 6): when
 * `type="number"`, the model (`v-model`) emits a `number` instead of the
 * native input's string value; clearing the field emits `null`. Any other
 * `type` keeps the plain string model Vuetify's `v-text-field` produces.
 */
import { computed, useId } from 'vue'
import { VTextField } from 'vuetify/components'

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    errorMessages?: string[]
    hint?: string
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    name?: string
    id?: string
  }>(),
  {
    type: 'text',
    errorMessages: () => [],
    hint: undefined,
    required: false,
    disabled: false,
    autocomplete: undefined,
    inputmode: undefined,
    name: undefined,
    id: undefined,
  },
)

const model = defineModel<string | number | null>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
const hasErrors = computed(() => props.errorMessages.length > 0)

// Vuetify's `error`/`error-messages` props style the field as invalid but
// do not set `aria-invalid` on the native `<input>`. `v-text-field` forwards
// `aria-*` attributes to that input, so bind it declaratively (WCAG 4.1.2).
const ariaInvalid = computed(() => (hasErrors.value ? 'true' : undefined))

// Proxies `v-text-field`'s own (always-string) v-model into the numeric
// model contract documented above.
const fieldValue = computed<string | number>({
  get: () => model.value ?? '',
  set: (value) => {
    if (props.type !== 'number') {
      model.value = value
      return
    }
    if (value === '' || value === null || value === undefined) {
      model.value = null
      return
    }
    const parsed = typeof value === 'number' ? value : Number(value)
    model.value = Number.isNaN(parsed) ? null : parsed
  },
})
</script>

<template>
  <VTextField
    :id="fieldId"
    v-model="fieldValue"
    :label="label"
    :type="type"
    :name="name"
    :autocomplete="autocomplete"
    :inputmode="inputmode"
    :hint="hint"
    :persistent-hint="!!hint"
    :required="required"
    :disabled="disabled"
    :error="hasErrors"
    :error-messages="errorMessages"
    :aria-invalid="ariaInvalid"
    class="glass-text-field"
    variant="outlined"
    density="comfortable"
  />
</template>
