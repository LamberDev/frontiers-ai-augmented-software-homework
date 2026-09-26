<script setup lang="ts">
/**
 * InviteReviewer form (API-free): local validation only, emits a typed
 * `submit` with the trimmed userId once valid.
 *
 * Validation timing and the server/local field-error rule mirror
 * `RegisterUserForm` (see its doc comment and `odd/tasks/frontend-ui.md`,
 * T4): a field's local error shows once touched or submitted; a server
 * `fieldErrors` entry takes priority until the user edits that field again,
 * and reappears whenever a fresh `fieldErrors` prop is received.
 *
 * `initialUserId` only prefills the field at mount (e.g. from a route
 * query); it is not re-applied on later prop changes, since the page that
 * renders this form is expected to remount it per navigation.
 */
import { computed, ref, watch } from 'vue'
import GlassCard from '@/shared/ui/molecules/GlassCard/GlassCard.vue'
import FormField from '@/shared/ui/molecules/FormField/FormField.vue'
import GlassButton from '@/shared/ui/atoms/GlassButton/GlassButton.vue'
import { validateInviteReviewer } from '../model/validateInviteReviewer'
import type { InviteReviewerFieldErrors, InviteReviewerInput } from '../model/types'

const props = withDefaults(
  defineProps<{
    loading?: boolean
    fieldErrors?: InviteReviewerFieldErrors
    initialUserId?: string
  }>(),
  {
    loading: false,
    fieldErrors: undefined,
    initialUserId: undefined,
  },
)

const emit = defineEmits<{
  submit: [input: InviteReviewerInput]
}>()

const userId = ref(props.initialUserId ?? '')

const touched = ref(false)
const dirtySinceServerError = ref(false)
const submittedOnce = ref(false)

watch(
  () => props.fieldErrors,
  () => {
    dirtySinceServerError.value = false
  },
)

watch(userId, () => {
  touched.value = true
  dirtySinceServerError.value = true
})

const localErrors = computed(() => validateInviteReviewer({ userId: userId.value }))

const userIdErrors = computed<string[]>(() => {
  const serverErrors = props.fieldErrors?.userId
  if (serverErrors && serverErrors.length > 0 && !dirtySinceServerError.value) {
    return serverErrors
  }
  if (touched.value || submittedOnce.value) {
    return localErrors.value.userId ?? []
  }
  return []
})

function handleSubmit() {
  submittedOnce.value = true
  touched.value = true

  const errors = validateInviteReviewer({ userId: userId.value })
  if ((errors.userId?.length ?? 0) > 0) return

  emit('submit', { userId: userId.value.trim() })
}
</script>

<template>
  <form novalidate @submit.prevent="handleSubmit">
    <GlassCard title="Invite reviewer">
      <FormField
        v-model="userId"
        label="User id"
        required
        autocomplete="off"
        :errors="userIdErrors"
      />
      <template #actions>
        <GlassButton type="submit" :loading="loading">Invite</GlassButton>
      </template>
    </GlassCard>
  </form>
</template>
