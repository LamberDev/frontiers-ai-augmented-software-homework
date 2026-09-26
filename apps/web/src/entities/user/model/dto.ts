import type { University } from '@/entities/university/@x/user'

/**
 * RegisterUser API response DTO, exactly as the wire format names its
 * fields (see `odd/tasks/frontend-ui.md`, API contract). The nested
 * `university` object already matches the `University` domain type
 * field-for-field, so no separate university DTO/mapping is needed; only
 * the top-level `userId` -> `id` rename does (`./toUser.ts`).
 */
export interface UserDto {
  userId: string
  userName: string
  numberOfPublications: number
  university: University
}
