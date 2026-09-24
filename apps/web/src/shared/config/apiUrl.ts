/**
 * Resolves the backend base URL from `VITE_API_URL`.
 *
 * Fails fast with a descriptive error instead of silently falling back to a
 * guessed default, so a missing configuration is caught at startup rather than
 * as a confusing network error later.
 */
export function getApiUrl(): string {
  const value = import.meta.env.VITE_API_URL

  if (!value) {
    throw new Error(
      'Missing VITE_API_URL. Define it before starting the app.',
    )
  }

  return value
}
