<script setup lang="ts">
/**
 * Register-user page: composes `RegisterUserForm` with `useRegisterUser`
 * (see `odd/tasks/frontend-ui.md`, T7/T8), renders `results` as top-right
 * toasts via `ToastStack` (the shared results-list pattern — see
 * `apps/web/AGENTS.md` and `odd/tasks/glass-palette.md`, T3), and after a
 * successful registration shows the registered user's `UserSummary` with an
 * "Invite as reviewer" link into the invite-reviewer page, prefilled via its
 * `userId` query param.
 */
import { RegisterUserForm, useRegisterUser } from '@/features/register-user'
import { UserSummary } from '@/entities/user'
import { GlassButton, ToastStack } from '@/shared/ui'

const { status, fieldErrors, results, lastUser, submit, dismiss } = useRegisterUser()
</script>

<template>
  <section class="register-user-page">
    <h1>Register a user</h1>
    <RegisterUserForm
      :loading="status === 'loading'"
      :field-errors="fieldErrors"
      @submit="submit"
    />
    <section aria-label="Results" class="register-user-page__results">
      <ToastStack :items="results" @close="dismiss" />
    </section>
    <UserSummary v-if="lastUser" :user="lastUser">
      <template #actions>
        <GlassButton :to="{ name: 'invite-reviewer', query: { userId: lastUser.id } }">
          Invite as reviewer
        </GlassButton>
      </template>
    </UserSummary>
  </section>
</template>

<style scoped>
.register-user-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
</style>
