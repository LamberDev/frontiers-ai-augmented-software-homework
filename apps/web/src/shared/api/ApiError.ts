/**
 * `requestJson` throws this synthetic code, rather than a real API problem
 * code, when the browser's own `fetch` call rejects (offline, CORS,
 * DNS failure, ...) before any HTTP response was received.
 */
export const NETWORK_UNAVAILABLE_CODE = 'Network.Unavailable'

/**
 * `requestJson` throws this synthetic code when `VITE_API_URL` is not
 * configured, so a missing build/deploy configuration surfaces through the
 * same `ApiError` channel as a server-side failure instead of an uncaught
 * exception.
 */
export const MISSING_API_URL_CODE = 'Config.MissingApiUrl'

/**
 * Thrown for a successful (2xx) response whose body cannot be trusted: an
 * empty/non-JSON body where JSON was expected (`requestJson`, `./requestJson.ts`),
 * or a JSON body that parses but does not match the expected shape (e.g.
 * `inviteReviewer`'s own structural check, `features/invite-reviewer/api/inviteReviewer.ts`).
 * Keeps a malformed-but-"successful" response from reaching application code
 * as untyped data by surfacing it through the same `ApiError` channel as
 * every other failure.
 */
export const RESPONSE_INVALID_BODY_CODE = 'Response.InvalidBody'

export interface ApiErrorOptions {
  status: number
  code?: string
  title?: string
  detail?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Thrown by `requestJson` (see `./requestJson.ts`) for every failed
 * request: an HTTP non-2xx response — parsed from an RFC 9457
 * `application/problem+json`/JSON body when present, tolerating an empty or
 * non-JSON body (`status` only, in that case) — a network failure (status
 * 0, `code: NETWORK_UNAVAILABLE_CODE`), or missing `VITE_API_URL`
 * configuration (status 0, `code: MISSING_API_URL_CODE`). See
 * `odd/tasks/frontend-ui.md` (T6, API contract).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly title?: string
  readonly detail?: string
  readonly fieldErrors: Record<string, string[]>

  constructor(options: ApiErrorOptions) {
    super(options.detail ?? options.title ?? `Request failed with status ${options.status}`)
    this.name = 'ApiError'
    this.status = options.status
    this.code = options.code
    this.title = options.title
    this.detail = options.detail
    this.fieldErrors = options.fieldErrors ?? {}
  }
}
