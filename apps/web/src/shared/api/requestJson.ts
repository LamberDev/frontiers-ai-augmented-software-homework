import { getApiUrl } from '@/shared/config'
import { httpClient } from './httpClient'
import { ApiError, MISSING_API_URL_CODE, NETWORK_UNAVAILABLE_CODE } from './ApiError'

export interface RequestJsonInit {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

interface ProblemDetailsBody {
  code?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

function isProblemDetailsBody(value: unknown): value is ProblemDetailsBody {
  return typeof value === 'object' && value !== null
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
      fieldErrors: body.errors ?? {},
    })
  }

  return (await response.json()) as T
}
