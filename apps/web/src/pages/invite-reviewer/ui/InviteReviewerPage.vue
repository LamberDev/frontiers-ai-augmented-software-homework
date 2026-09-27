<script setup lang="ts">
/**
 * Invite-reviewer page: composes `InviteReviewerForm` with
 * `useInviteReviewer` (see `odd/tasks/frontend-ui.md`, T7/T8), prefilled
 * from the `userId` route query (e.g. arriving from RegisterUserPage's
 * "Invite as reviewer" link), and renders `results` as top-right toasts via
 * `ToastStack` (see `odd/tasks/glass-palette.md`, T3) — a `warning` outcome
 * (`invited: false`) still shows its `reasons` as the toast's item list.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { InviteReviewerForm, useInviteReviewer } from '@/features/invite-reviewer'
import { ToastStack } from '@/shared/ui'

const route = useRoute()

// A route query value can be a string, `null` (present with no value) or an
// array of strings (repeated query keys); only a plain string is a valid
// prefill, so anything else is ignored.
const initialUserId = computed(() => {
  const value = route.query.userId
  return typeof value === 'string' ? value : undefined
})

const { status, fieldErrors, results, submit, dismiss } = useInviteReviewer()
</script>

<template>
  <section class="invite-reviewer-page">
    <h1>Invite a reviewer</h1>
    <InviteReviewerForm
      :loading="status === 'loading'"
      :field-errors="fieldErrors"
      :initial-user-id="initialUserId"
      @submit="submit"
    />
    <section aria-label="Results" class="invite-reviewer-page__results">
      <ToastStack :items="results" @close="dismiss" />
    </section>
  </section>
</template>

<style scoped>
.invite-reviewer-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
