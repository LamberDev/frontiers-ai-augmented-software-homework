import { ref } from 'vue'
import { ApiError } from '@/shared/api'
import type { ResultAlertEntry } from '@/shared/ui'
import type { User } from '@/entities/user'
import { registerUser as registerUserApi } from '../api/registerUser'
import type { RegisterUserField, RegisterUserFieldErrors, RegisterUserInput } from './types'

export type RegisterUserStatus = 'idle' | 'loading' | 'success' | 'error'

const REGISTER_USER_FIELDS: readonly RegisterUserField[] = [
  'userName',
  'universityName',
  'numberOfPublications',
]

/**
 * Friendly title for an `ApiError` that carries no field errors, looked up
 * by its `code` (see `odd/tasks/frontend-ui.md`, API contract). Falls back
 * to a generic title for a network failure without a recognized code, or
 * any other unmapped/unexpected server code.
 */
const FRIENDLY_TITLE_BY_CODE: Record<string, string> = {
  'UniversityDirectory.NotFound': 'University not found.',
  'UniversityDirectory.Unavailable':
    'The university directory is unavailable. Please try again later.',
  'UniversityDirectory.InvalidEntry':
    'The university directory is unavailable. Please try again later.',
  'Network.Unavailable': 'Cannot reach the server. Check your connection and try again.',
}

const DEFAULT_ERROR_TITLE = 'Something went wrong. Please try again.'

function friendlyTitle(error: ApiError): string {
  return (error.code && FRIENDLY_TITLE_BY_CODE[error.code]) || DEFAULT_ERROR_TITLE
}

/**
 * Narrows an `ApiError`'s free-form `fieldErrors` (server-controlled
 * string keys) down to the RegisterUser form's own known fields, so an
 * unrelated or unexpected server key can never be assigned to a field the
 * form does not have.
 */
function toRegisterUserFieldErrors(source: Record<string, string[]>): RegisterUserFieldErrors {
  const result: RegisterUserFieldErrors = {}
  for (const field of REGISTER_USER_FIELDS) {
    const messages = source[field]
    if (messages && messages.length > 0) {
      result[field] = messages
    }
  }
  return result
}

export interface UseRegisterUserOptions {
  /** Injected for testability; defaults to the real `registerUser` API call. */
  registerUser?: (input: RegisterUserInput) => Promise<User>
}

/**
 * Stateful RegisterUser submission: tracks the request lifecycle, the
 * registered user, per-field server errors and a list of result entries
 * (one `ResultAlert` per entry — see `ResultAlert.vue`'s stateless
 * visibility contract). See `odd/tasks/frontend-ui.md` (T7).
 */
export function useRegisterUser(options: UseRegisterUserOptions = {}) {
  const apiCall = options.registerUser ?? registerUserApi

  const status = ref<RegisterUserStatus>('idle')
  const fieldErrors = ref<RegisterUserFieldErrors>({})
  const results = ref<ResultAlertEntry[]>([])
  const lastUser = ref<User | null>(null)

  let nextResultId = 0
  function createResultId(): string {
    nextResultId += 1
    return `register-user-result-${nextResultId}`
  }

  async function submit(input: RegisterUserInput): Promise<void> {
    if (status.value === 'loading') return

    status.value = 'loading'

    try {
      const user = await apiCall(input)
      lastUser.value = user
      fieldErrors.value = {}
      status.value = 'success'
      results.value = [
        ...results.value,
        {
          id: createResultId(),
          type: 'success',
          title: 'User registered',
          message: `${user.userName} was registered with ${user.university.name}.`,
        },
      ]
    } catch (error) {
      status.value = 'error'

      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        fieldErrors.value = toRegisterUserFieldErrors(error.fieldErrors)
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

  return { status, fieldErrors, results, lastUser, submit, dismiss }
}
