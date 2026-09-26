import type { User } from './types'
import type { UserDto } from './dto'

/**
 * Maps the RegisterUser API response DTO to the domain `User` entity: the
 * wire field `userId` becomes the domain field `id` (see `./types.ts`'s doc
 * comment and `odd/tasks/frontend-ui.md`, API contract). Lives in
 * `entities/user/model` (not the `register-user` feature's `api` segment)
 * because the mapping is owned by the entity it produces, so any future
 * feature that receives a user-shaped DTO can reuse it instead of
 * duplicating the field rename.
 */
export function toUser(dto: UserDto): User {
  return {
    id: dto.userId,
    userName: dto.userName,
    numberOfPublications: dto.numberOfPublications,
    university: dto.university,
  }
}
