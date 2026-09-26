import { requestJson } from '@/shared/api'
import type { InvitationResult, InviteReviewerInput } from '../model/types'

/**
 * `POST /api/reviewers/invitations` (see `odd/tasks/frontend-ui.md`, API
 * contract). Both an eligible and an ineligible outcome resolve with `200`
 * and an `InvitationResult` (`invited: false` carries `reasons`); only a
 * request-level failure (validation, not-found, network, ...) rejects with
 * `ApiError` (`@/shared/api`).
 */
export async function inviteReviewer(input: InviteReviewerInput): Promise<InvitationResult> {
  return requestJson<InvitationResult>('/api/reviewers/invitations', {
    method: 'POST',
    body: { userId: input.userId },
  })
}
