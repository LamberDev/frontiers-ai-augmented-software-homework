import type { University } from '@/entities/university/@x/user'

/**
 * User entity (see `odd/tasks/frontend-ui.md`, API contract). Field names
 * do not match the wire format verbatim: the API response DTO names the
 * identifier `userId`, while this domain type names it `id`; `toUser`
 * (`./toUser.ts`) converts between the two. Every registered user has
 * exactly one associated `University`.
 */
export interface User {
  id: string
  userName: string
  numberOfPublications: number
  university: University
}
