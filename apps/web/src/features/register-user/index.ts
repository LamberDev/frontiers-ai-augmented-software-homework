/**
 * Public API for the register-user feature.
 */
export { default as RegisterUserForm } from './ui/RegisterUserForm.vue'
export { validateRegisterUser } from './model/validateRegisterUser'
export type {
  RegisterUserField,
  RegisterUserFieldErrors,
  RegisterUserFormValues,
  RegisterUserInput,
} from './model/types'
