<script setup lang="ts">
/**
 * RegisterUser form (API-free): local validation only, emits a typed
 * `submit` with the trimmed payload once valid. See
 * `odd/tasks/frontend-ui.md` (T4) for the validation-timing and
 * server/local field-error rules documented below.
 *
 * Validation timing: a field's local errors are shown once that field has
 * been touched (its value changed at least once) or the form has been
 * submitted at least once; after the first submit attempt every field is
 * considered touched, so subsequent edits re-validate live.
 *
 * Server vs. local field errors: `fieldErrors` (server-side, from a prior
 * submission) is shown for a field whenever present, taking priority over
 * local validation for that field. As soon as the user edits that specific
 * field again, its server error is cleared and local validation takes over
 * for it; a fresh `fieldErrors` prop (e.g. from a new submission) makes the
 * server error reappear for any field it names, even if previously edited.
 */
import { computed, reactive, ref, watch } from 'vue'
import GlassCard from '@/shared/ui/molecules/GlassCard/GlassCard.vue'
import FormField from '@/shared/ui/molecules/FormField/FormField.vue'
import GlassButton from '@/shared/ui/atoms/GlassButton/GlassButton.vue'
import { validateRegisterUser } from '../model/validateRegisterUser'
import type { RegisterUserField, RegisterUserFieldErrors, RegisterUserInput } from '../model/types'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    fieldErrors?: RegisterUserFieldErrors
  }>(),
  {
    loading: false,
    fieldErrors: undefined,
  },
)

const emit = defineEmits<{
  submit: [input: RegisterUserInput]
}>()

const userName = ref('')
const universityName = ref('')
const numberOfPublications = ref<number | null>(null)

const touched = reactive<Record<RegisterUserField, boolean>>({
  userName: false,
  universityName: false,
  numberOfPublications: false,
})

const dirtySinceServerError = reactive<Record<RegisterUserField, boolean>>({
  userName: false,
  universityName: false,
  numberOfPublications: false,
})

const submittedOnce = ref(false)

// A fresh `fieldErrors` prop (e.g. from a new submission) makes server
// errors visible again, even for fields edited since the previous one.
watch(
  () => props.fieldErrors,
  () => {
    dirtySinceServerError.userName = false
    dirtySinceServerError.universityName = false
    dirtySinceServerError.numberOfPublications = false
  },
)

watch(userName, () => {
  touched.userName = true
  dirtySinceServerError.userName = true
})
watch(universityName, () => {
  touched.universityName = true
  dirtySinceServerError.universityName = true
})
watch(numberOfPublications, () => {
  touched.numberOfPublications = true
  dirtySinceServerError.numberOfPublications = true
})

const localErrors = computed(() =>
  validateRegisterUser({
    userName: userName.value,
    universityName: universityName.value,
    numberOfPublications: numberOfPublications.value,
  }),
)

function displayedErrors(field: RegisterUserField): string[] {
  const serverErrors = props.fieldErrors?.[field]
  if (serverErrors && serverErrors.length > 0 && !dirtySinceServerError[field]) {
    return serverErrors
  }
  if (touched[field] || submittedOnce.value) {
    return localErrors.value[field] ?? []
  }
  return []
}

const userNameErrors = computed(() => displayedErrors('userName'))
const universityNameErrors = computed(() => displayedErrors('universityName'))
const numberOfPublicationsErrors = computed(() => displayedErrors('numberOfPublications'))

function handleSubmit() {
  submittedOnce.value = true
  touched.userName = true
  touched.universityName = true
  touched.numberOfPublications = true

  const errors = validateRegisterUser({
    userName: userName.value,
    universityName: universityName.value,
    numberOfPublications: numberOfPublications.value,
  })
  const hasErrors = Object.values(errors).some((messages) => (messages?.length ?? 0) > 0)
  if (hasErrors) return

  emit('submit', {
    userName: userName.value.trim(),
    universityName: universityName.value.trim(),
    numberOfPublications: numberOfPublications.value as number,
  })
}
</script>

<template>
  <form novalidate @submit.prevent="handleSubmit">
    <GlassCard title="Register user">
      <FormField
        v-model="userName"
        label="User name"
        required
        autocomplete="name"
        :errors="userNameErrors"
      />
      <FormField
        v-model="universityName"
        label="University name"
        required
        :errors="universityNameErrors"
      />
      <FormField
        v-model="numberOfPublications"
        label="Number of publications"
        type="number"
        required
        inputmode="numeric"
        :errors="numberOfPublicationsErrors"
      />
      <template #actions>
        <GlassButton type="submit" :loading="loading">Register</GlassButton>
      </template>
    </GlassCard>
  </form>
</template>
