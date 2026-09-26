import type { RegisterUserFieldErrors, RegisterUserFormValues } from './types'

/**
 * Pure local validation for the RegisterUser form. Messages are short
 * English sentences ending with a period, matching the backend's tone (see
 * `odd/tasks/frontend-ui.md`, API contract).
 */
export function validateRegisterUser(input: RegisterUserFormValues): RegisterUserFieldErrors {
  const errors: RegisterUserFieldErrors = {}

  const userName = input.userName.trim()
  if (userName.length === 0) {
    errors.userName = ['User name is required.']
  } else if (userName.length > 100) {
    errors.userName = ['User name must be at most 100 characters.']
  }

  const universityName = input.universityName.trim()
  if (universityName.length === 0) {
    errors.universityName = ['University name is required.']
  }

  if (input.numberOfPublications === null) {
    errors.numberOfPublications = ['Number of publications is required.']
  } else if (!Number.isInteger(input.numberOfPublications) || input.numberOfPublications < 0) {
    errors.numberOfPublications = ['Number of publications must be a whole number of at least 0.']
  }

  return errors
}
