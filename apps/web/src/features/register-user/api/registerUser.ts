import { requestJson } from '@/shared/api'
import { toUser } from '@/entities/user'
import type { User, UserDto } from '@/entities/user'
import type { RegisterUserInput } from '../model/types'

/**
 * `POST /api/users` (see `odd/tasks/frontend-ui.md`, API contract), mapping
 * the response DTO to the domain `User` via `toUser`. On a non-2xx
 * response, `requestJson` rejects with `ApiError` (`@/shared/api`).
 */
export async function registerUser(input: RegisterUserInput): Promise<User> {
  const dto = await requestJson<UserDto>('/api/users', {
    method: 'POST',
    body: {
      userName: input.userName,
      universityName: input.universityName,
      numberOfPublications: input.numberOfPublications,
    },
  })
  return toUser(dto)
}
