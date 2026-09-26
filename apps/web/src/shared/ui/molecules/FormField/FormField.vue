<script setup lang="ts">
/**
 * Composes `GlassTextField` with consistent field spacing, passing
 * `v-model` through. Only the first error message is shown at a time,
 * keeping the field compact even when a caller has several validation
 * messages queued for the same field.
 */
import { computed, useId } from 'vue'
import GlassTextField from '@/shared/ui/atoms/GlassTextField/GlassTextField.vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    errors?: string[]
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
    errors: () => [],
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
const firstError = computed(() => (props.errors.length > 0 ? [props.errors[0]] : []))
</script>

<template>
  <div class="form-field">
    <GlassTextField
      :id="fieldId"
      v-model="model"
      :label="label"
      :type="type"
      :hint="hint"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :name="name"
      :error-messages="firstError"
    />
  </div>
</template>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}
</style>
