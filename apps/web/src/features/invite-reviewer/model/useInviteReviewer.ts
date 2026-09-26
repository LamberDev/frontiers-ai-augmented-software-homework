import { ref } from 'vue'
import { ApiError } from '@/shared/api'
import type { ResultAlertEntry } from '@/shared/ui'
import { inviteReviewer as inviteReviewerApi } from '../api/inviteReviewer'
import type {
  InvitationResult,
  InviteReviewerField,
  InviteReviewerFieldErrors,
  InviteReviewerInput,
} from './types'

export type InviteReviewerStatus = 'idle' | 'loading' | 'success' | 'error'

const INVITE_REVIEWER_FIELDS: readonly InviteReviewerField[] = ['userId']

/**
 * Friendly title for an `ApiError` that carries no field errors, looked up
 * by its `code` (see `odd/tasks/frontend-ui.md`, API contract).
 */
const FRIENDLY_TITLE_BY_CODE: Record<string, string> = {
  'Reviewer.UserNotFound': 'User not found.',
  'Network.Unavailable': 'Cannot reach the server. Check your connection and try again.',
}

const DEFAULT_ERROR_TITLE = 'Something went wrong. Please try again.'

function friendlyTitle(error: ApiError): string {
  return (error.code && FRIENDLY_TITLE_BY_CODE[error.code]) || DEFAULT_ERROR_TITLE
}

/**
 * The result's `ResultAlert` type for a successful invitation request,
 * looked up by the `invited` outcome rather than branched with an
 * `if`/`else`: `invited: true` is a success; `invited: false` is a
 * recommended `warning` (documented in `odd/tasks/frontend-ui.md`, T7) —
 * the request itself succeeded, the user is simply not eligible, so it is
 * not treated as an `error`.
 */
const RESULT_TYPE_BY_INVITED = {
  true: 'success',
  false: 'warning',
} as const satisfies Record<'true' | 'false', ResultAlertEntry['type']>

function resultTypeForInvited(invited: boolean): ResultAlertEntry['type'] {
  return RESULT_TYPE_BY_INVITED[invited ? 'true' : 'false']
}

/**
 * Narrows an `ApiError`'s free-form `fieldErrors` down to the
 * InviteReviewer form's own known fields (mirrors
 * `register-user/model/useRegisterUser.ts`'s `toRegisterUserFieldErrors`).
 */
function toInviteReviewerFieldErrors(source: Record<string, string[]>): InviteReviewerFieldErrors {
  const result: InviteReviewerFieldErrors = {}
  for (const field of INVITE_REVIEWER_FIELDS) {
    const messages = source[field]
    if (messages && messages.length > 0) {
      result[field] = messages
    }
  }
  return result
}

export interface UseInviteReviewerOptions {
  /** Injected for testability; defaults to the real `inviteReviewer` API call. */
  inviteReviewer?: (input: InviteReviewerInput) => Promise<InvitationResult>
}

/**
 * Stateful InviteReviewer submission: tracks the request lifecycle, the
 * last invitation outcome, per-field server errors and a list of result
 * entries (one `ResultAlert` per entry). See `odd/tasks/frontend-ui.md` (T7).
 */
export function useInviteReviewer(options: UseInviteReviewerOptions = {}) {
  const apiCall = options.inviteReviewer ?? inviteReviewerApi

  const status = ref<InviteReviewerStatus>('idle')
  const fieldErrors = ref<InviteReviewerFieldErrors>({})
  const results = ref<ResultAlertEntry[]>([])
  const lastInvitation = ref<InvitationResult | null>(null)

  let nextResultId = 0
  function createResultId(): string {
    nextResultId += 1
    return `invite-reviewer-result-${nextResultId}`
  }

  async function submit(input: InviteReviewerInput): Promise<void> {
    if (status.value === 'loading') return

    status.value = 'loading'
    // Reset on every submit attempt (mirrors
    // `register-user/model/useRegisterUser.ts`'s `submit`): a stale field
    // error must never survive into a new submission that fails for an
    // unrelated reason.
    fieldErrors.value = {}

    try {
      // `apiCall` (the `inviteReviewer` api function) is the one place that
      // validates/normalizes the raw response into an `InvitationResult`
      // (see `features/invite-reviewer/api/inviteReviewer.ts`) — it either
      // resolves with a fully-formed result or rejects, so building the
      // result entry from `invitation` below can never observe a
      // half-parsed value. `lastInvitation`/`status`/`results` are only
      // ever assigned together, after that result is fully known — never
      // partially, mid-processing.
      const invitation = await apiCall(input)
      const entry: ResultAlertEntry = {
        id: createResultId(),
        type: resultTypeForInvited(invitation.invited),
        title: invitation.invited ? 'Invitation sent' : 'Reviewer not invited',
        message: invitation.message,
        items: invitation.reasons.length
          ? invitation.reasons.map((reason) => reason.message)
          : undefined,
      }
      lastInvitation.value = invitation
      status.value = 'success'
      results.value = [...results.value, entry]
    } catch (error) {
      status.value = 'error'

      const narrowedFieldErrors =
        error instanceof ApiError ? toInviteReviewerFieldErrors(error.fieldErrors) : {}

      // Only highlight fields that survive narrowing to this form's known
      // fields; a server `fieldErrors` payload naming only unrecognized
      // keys falls through to the code/default message below (mirrors
      // `useRegisterUser.ts`).
      if (Object.keys(narrowedFieldErrors).length > 0) {
        fieldErrors.value = narrowedFieldErrors
        results.value = [
          ...results.value,
          {
            id: createResultId(),
            type: 'error',
            title: 'Please fix the highlighted fields.',
          },
        ]
        return
      }

      results.value = [
        ...results.value,
        {
          id: createResultId(),
          type: 'error',
          title: error instanceof ApiError ? friendlyTitle(error) : DEFAULT_ERROR_TITLE,
          message: error instanceof ApiError ? error.detail : undefined,
        },
      ]
    }
  }

  function dismiss(id: string): void {
    results.value = results.value.filter((result) => result.id !== id)
  }

  return { status, fieldErrors, results, lastInvitation, submit, dismiss }
}
