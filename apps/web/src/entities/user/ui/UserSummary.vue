<script setup lang="ts">
/**
 * Renders a registered user's summary — name, publication count, a
 * copyable id, and the associated `UniversityCard` — plus an optional
 * `actions` slot for contextual actions the page composes in (e.g. "Invite
 * as reviewer").
 *
 * Copying the user id uses `navigator.clipboard.writeText` when available;
 * when it is not (unsupported browser, insecure context, or the call
 * rejects), copying is skipped and a distinct message is announced instead,
 * so the interaction never throws.
 */
import { ref } from 'vue'
import GlassCard from '@/shared/ui/molecules/GlassCard/GlassCard.vue'
import GlassButton from '@/shared/ui/atoms/GlassButton/GlassButton.vue'
import { UniversityCard } from '@/entities/university/@x/user'
import type { User } from '../model/types'

const props = defineProps<{ user: User }>()

const copyAnnouncement = ref('')

async function copyUserId() {
  if (!navigator.clipboard?.writeText) {
    copyAnnouncement.value = 'Copying is not supported in this browser.'
    return
  }
  try {
    await navigator.clipboard.writeText(props.user.id)
    copyAnnouncement.value = 'Copied.'
  } catch {
    copyAnnouncement.value = 'Copying is not supported in this browser.'
  }
}
</script>

<template>
  <GlassCard title="User summary" class="user-summary">
    <dl class="user-summary__details">
      <div class="user-summary__row">
        <dt>User name</dt>
        <dd>{{ user.userName }}</dd>
      </div>
      <div class="user-summary__row">
        <dt>Number of publications</dt>
        <dd>{{ user.numberOfPublications }}</dd>
      </div>
      <div class="user-summary__row">
        <dt>User id</dt>
        <dd class="user-summary__user-id">
          <code>{{ user.id }}</code>
          <GlassButton
            variant="ghost"
            class="user-summary__copy"
            aria-label="Copy user id"
            @click="copyUserId"
          >
            Copy
          </GlassButton>
        </dd>
      </div>
    </dl>
    <p class="user-summary__announcement" aria-live="polite">{{ copyAnnouncement }}</p>
    <UniversityCard :university="user.university" />
    <div v-if="$slots.actions" class="user-summary__actions">
      <slot name="actions" />
    </div>
  </GlassCard>
</template>

<style scoped>
.user-summary__details {
  margin: 0 0 1rem;
}

.user-summary__row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.user-summary__row dt {
  font-weight: 600;
}

.user-summary__row dd {
  margin: 0;
}

.user-summary__user-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-summary__user-id code {
  font-family: monospace;
}

.user-summary__announcement {
  margin: 0 0 1rem;
}

.user-summary__actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
