/**
 * InviteReviewer form model.
 */
export type InviteReviewerField = 'userId'

export type InviteReviewerFieldErrors = Partial<Record<InviteReviewerField, string[]>>

export interface InviteReviewerFormValues {
  userId: string
}

export interface InviteReviewerInput {
  userId: string
}

/**
 * `POST /api/reviewers/invitations` response (see
 * `odd/tasks/frontend-ui.md`, API contract): `reasons` explains an
 * ineligible outcome (`invited: false`) and is empty on a successful one.
 */
export interface InvitationReason {
  code: string
  message: string
}

export interface InvitationResult {
  userId: string
  invited: boolean
  message: string
  reasons: InvitationReason[]
}
