import type { University } from '@/entities/university/@x/user'

/**
 * User entity, matching the backend's RegisterUser/InviteReviewer fields
 * (see `odd/tasks/frontend-ui.md`, API contract). Every registered user has
 * exactly one associated `University`.
 */
export interface User {
  id: string
  userName: string
  numberOfPublications: number
  university: University
}
