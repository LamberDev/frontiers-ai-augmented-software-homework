<script setup lang="ts">
/**
 * Invite-reviewer page: composes `InviteReviewerForm` with
 * `useInviteReviewer` (see `odd/tasks/frontend-ui.md`, T7/T8), prefilled
 * from the `userId` route query (e.g. arriving from RegisterUserPage's
 * "Invite as reviewer" link), and renders one `ResultAlert` per result — a
 * `warning` outcome (`invited: false`) shows its `reasons` as the alert's
 * item list.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { InviteReviewerForm, useInviteReviewer } from '@/features/invite-reviewer'
import { ResultAlert } from '@/shared/ui'

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
      <ResultAlert
        v-for="entry in results"
        :key="entry.id"
        :type="entry.type"
        :title="entry.title"
        :message="entry.message"
        :items="entry.items"
        closable
        @close="dismiss(entry.id)"
      />
    </section>
  </section>
</template>

<style scoped>
.invite-reviewer-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.invite-reviewer-page__results:empty {
  display: none;
}
</style>
