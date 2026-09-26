import { getApiUrl } from '@/shared/config'
import { httpClient } from './httpClient'
import {
  ApiError,
  MISSING_API_URL_CODE,
  NETWORK_UNAVAILABLE_CODE,
  RESPONSE_INVALID_BODY_CODE,
} from './ApiError'

export interface RequestJsonInit {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

interface ProblemDetailsBody {
  code?: string
  title?: string
  detail?: string
  errors?: unknown
}

// An array is technically `typeof value === 'object'`, but it is never a
// valid RFC 9457 problem body (which is always a JSON object of named
// fields) — without this, a bare array response would be treated as an
// object with all-`undefined` fields instead of "no usable problem body".
function isProblemDetailsBody(value: unknown): value is ProblemDetailsBody {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Keeps only the `errors` dictionary's entries whose value is actually an
 * array of strings (the RFC 9457 validation-problem shape this app expects
 * per field), dropping any entry a server might send with an unexpected
 * shape (a non-array value, or an array containing a non-string) instead of
 * passing it through untyped as a field's "error messages".
 */
function normalizeFieldErrors(errors: unknown): Record<string, string[]> {
  if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) return {}

  const result: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(errors as Record<string, unknown>)) {
    if (isStringArray(messages)) {
      result[field] = messages
    }
  }
  return result
}

/**
 * Parses an error response body as RFC 9457 `application/problem+json` (or
 * plain JSON carrying the same shape), tolerating an empty body or one that
 * is not valid JSON at all (e.g. a bare 415/400 in Production — see
 * `odd/tasks/frontend-ui.md`, API contract) by falling back to `{}` in
 * either case.
 */
async function parseErrorBody(response: Response): Promise<ProblemDetailsBody> {
  const text = await response.text().catch(() => '')
  if (!text) return {}

  try {
    const parsed: unknown = JSON.parse(text)
    return isProblemDetailsBody(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * JSON request/response helper on top of `httpClient`: sets the JSON
 * request headers/body, parses a successful JSON response, and converts
 * every failure mode (see `./ApiError.ts`) into a rejected `ApiError`
 * instead of a raw fetch/HTTP error, so every caller can handle failures
 * uniformly through one `catch`.
 */
export async function requestJson<T>(path: string, init: RequestJsonInit): Promise<T> {
  try {
    getApiUrl()
  } catch (cause) {
    throw new ApiError({
      status: 0,
      code: MISSING_API_URL_CODE,
      detail: cause instanceof Error ? cause.message : undefined,
    })
  }

  let response: Response
  try {
    response = await httpClient(path, {
      method: init.method,
      headers: { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError({ status: 0, code: NETWORK_UNAVAILABLE_CODE })
  }

  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ApiError({
      status: response.status,
      code: body.code,
      title: body.title,
      detail: body.detail,
      fieldErrors: normalizeFieldErrors(body.errors),
    })
  }

  try {
    return (await response.json()) as T
  } catch (cause) {
    // A 2xx response is not a guarantee of a parsable JSON body (e.g. an
    // empty 204, or a misconfigured/broken server sending non-JSON on
    // "success"). Without this, `response.json()` would throw a raw
    // `SyntaxError` instead of the `ApiError` every other failure mode
    // rejects with, breaking the "one uniform catch" contract this helper
    // exists for (see the module doc comment above).
    throw new ApiError({
      status: response.status,
      code: RESPONSE_INVALID_BODY_CODE,
      detail: cause instanceof Error ? cause.message : undefined,
    })
  }
}
