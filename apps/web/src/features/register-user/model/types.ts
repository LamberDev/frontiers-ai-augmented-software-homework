/**
 * RegisterUser form model: values as they are edited (numberOfPublications
 * may be `null` while the field is empty or invalid), and the trimmed,
 * fully-typed payload emitted only once the form is valid.
 */
export type RegisterUserField = 'userName' | 'universityName' | 'numberOfPublications'

export type RegisterUserFieldErrors = Partial<Record<RegisterUserField, string[]>>

export interface RegisterUserFormValues {
  userName: string
  universityName: string
  numberOfPublications: number | null
}

export interface RegisterUserInput {
  userName: string
  universityName: string
  numberOfPublications: number
}
