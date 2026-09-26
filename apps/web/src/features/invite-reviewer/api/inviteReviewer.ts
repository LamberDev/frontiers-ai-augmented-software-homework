import { ApiError, RESPONSE_INVALID_BODY_CODE, requestJson } from '@/shared/api'
import type { InvitationReason, InvitationResult, InviteReviewerInput } from '../model/types'

function isInvitationReason(value: unknown): value is InvitationReason {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as InvitationReason).code === 'string' &&
    typeof (value as InvitationReason).message === 'string'
  )
}

function isInvitationResult(value: unknown): value is InvitationResult {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    typeof candidate.invited === 'boolean' &&
    typeof candidate.message === 'string' &&
    Array.isArray(candidate.reasons) &&
    candidate.reasons.every(isInvitationReason)
  )
}

/**
 * Validates/normalizes the raw response body into an `InvitationResult`,
 * so a 2xx response that parses as JSON but does not match the expected
 * shape (a malformed or unexpectedly-changed server contract) can never
 * reach the caller as untyped/partially-trusted data. Rejects with
 * `ApiError` (`RESPONSE_INVALID_BODY_CODE`) instead of returning it —
 * `inviteReviewer` below only ever resolves with a fully-formed result, so
 * a caller (e.g. `useInviteReviewer`) never observes a half-processed one.
 */
function toInvitationResult(body: unknown): InvitationResult {
  if (!isInvitationResult(body)) {
    throw new ApiError({ status: 200, code: RESPONSE_INVALID_BODY_CODE })
  }
  return body
}

/**
 * `POST /api/reviewers/invitations` (see `odd/tasks/frontend-ui.md`, API
 * contract). Both an eligible and an ineligible outcome resolve with `200`
 * and an `InvitationResult` (`invited: false` carries `reasons`); a
 * request-level failure (validation, not-found, network, ...) rejects with
 * `ApiError` (`@/shared/api`), and so does a 2xx body that fails this
 * module's own structural validation (`toInvitationResult` above).
 */
export async function inviteReviewer(input: InviteReviewerInput): Promise<InvitationResult> {
  const body = await requestJson<unknown>('/api/reviewers/invitations', {
    method: 'POST',
    body: { userId: input.userId },
  })
  return toInvitationResult(body)
}
