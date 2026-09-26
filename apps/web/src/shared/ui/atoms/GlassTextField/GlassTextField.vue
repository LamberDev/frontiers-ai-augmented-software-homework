<script setup lang="ts">
/**
 * Base text input: wraps Vuetify's `v-text-field` and owns the glass/brand
 * look, so features never style Vuetify directly (see `apps/web/AGENTS.md`).
 * Label association and the required marker are Vuetify's own accessible
 * field behavior; `aria-invalid` is bound explicitly (see below).
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

const model = defineModel<string | number>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
const hasErrors = computed(() => props.errorMessages.length > 0)

// Vuetify's `error`/`error-messages` props style the field as invalid but
// do not set `aria-invalid` on the native `<input>`. `v-text-field` forwards
// `aria-*` attributes to that input, so bind it declaratively (WCAG 4.1.2).
const ariaInvalid = computed(() => (hasErrors.value ? 'true' : undefined))
</script>

<template>
  <VTextField
    :id="fieldId"
    v-model="model"
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
