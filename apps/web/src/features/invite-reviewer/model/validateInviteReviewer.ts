import type { InviteReviewerFieldErrors, InviteReviewerFormValues } from './types'

// Case-insensitive 8-4-4-4-12 hex UUID, any RFC 4122 variant/version.
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Pure local validation for the InviteReviewer form. Messages are short
 * English sentences ending with a period, matching the backend's tone (see
 * `odd/tasks/frontend-ui.md`, API contract).
 */
export function validateInviteReviewer(input: InviteReviewerFormValues): InviteReviewerFieldErrors {
  const userId = input.userId.trim()

  if (userId.length === 0) {
    return { userId: ['User id is required.'] }
  }

  if (!uuidPattern.test(userId)) {
    return { userId: ['User id must be a valid UUID.'] }
  }

  return {}
}
