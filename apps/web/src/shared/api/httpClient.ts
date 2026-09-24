import { apiUrl } from '@/shared/config'

/**
 * Minimal fetch-based HTTP client base.
 *
 * No endpoint-specific methods live here: this is scaffolding for
 * `entities`/`features` to build typed API calls on top of, not a place for
 * business logic (that would violate the FSD rule that `shared` has none).
 */
export function httpClient(path: string, init?: RequestInit): Promise<Response> {
  return fetch(new URL(path, apiUrl), init)
}
