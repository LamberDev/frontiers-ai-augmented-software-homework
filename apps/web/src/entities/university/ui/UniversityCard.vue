<script setup lang="ts">
/**
 * Displays a university's identity and reviewer-eligibility score. A `null`
 * score renders as "Unknown" (see `ScoreBadge`'s own null/non-finite
 * handling); `REVIEWER_MIN_UNIVERSITY_SCORE` mirrors the backend's
 * reviewer-eligibility policy (see `odd/tasks/frontend-ui.md`).
 */
import GlassCard from '@/shared/ui/molecules/GlassCard/GlassCard.vue'
import ScoreBadge from '@/shared/ui/atoms/ScoreBadge/ScoreBadge.vue'
import type { University } from '../model/types'
import { REVIEWER_MIN_UNIVERSITY_SCORE } from '../model/reviewerPolicy'

defineProps<{
  university: University
}>()
</script>

<template>
  <GlassCard :title="university.name" :elevation="1" class="university-card">
    <dl class="university-card__details">
      <div class="university-card__row">
        <dt>Frontiers organization id</dt>
        <dd>{{ university.frontiersOrganizationId }}</dd>
      </div>
    </dl>
    <ScoreBadge
      :score="university.score"
      :threshold="REVIEWER_MIN_UNIVERSITY_SCORE"
      label="University score"
    />
  </GlassCard>
</template>

<style scoped>
.university-card__details {
  margin: 0 0 0.75rem;
}

.university-card__row {
  display: flex;
  gap: 0.5rem;
}

.university-card__row dt {
  font-weight: 600;
}

.university-card__row dd {
  margin: 0;
}
</style>
