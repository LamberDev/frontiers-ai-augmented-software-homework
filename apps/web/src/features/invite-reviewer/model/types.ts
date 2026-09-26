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
