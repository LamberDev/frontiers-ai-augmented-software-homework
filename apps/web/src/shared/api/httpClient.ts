import { getApiUrl } from '@/shared/config'

/**
 * Minimal fetch-based HTTP client base.
 *
 * No endpoint-specific methods live here: this is scaffolding for
 * `entities`/`features` to build typed API calls on top of, not a place for
 * business logic (that would violate the FSD rule that `shared` has none).
 *
 * `async` on purpose: `getApiUrl()` throws synchronously when `VITE_API_URL`
 * is missing, and wrapping the call in an async function converts that throw
 * into a rejected promise instead of an exception raised out of the call
 * site, so every caller can `await`/`.catch()` it uniformly.
 */
export async function httpClient(path: string, init?: RequestInit): Promise<Response> {
  return fetch(new URL(path, getApiUrl()), init)
}
