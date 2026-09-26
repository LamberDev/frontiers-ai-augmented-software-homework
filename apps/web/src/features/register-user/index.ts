/**
 * Public API for the register-user feature.
 */
export { default as RegisterUserForm } from './ui/RegisterUserForm.vue'
export { validateRegisterUser } from './model/validateRegisterUser'
export { registerUser } from './api/registerUser'
export { useRegisterUser } from './model/useRegisterUser'
export type { RegisterUserStatus, UseRegisterUserOptions } from './model/useRegisterUser'
export type {
  RegisterUserField,
  RegisterUserFieldErrors,
  RegisterUserFormValues,
  RegisterUserInput,
} from './model/types'
