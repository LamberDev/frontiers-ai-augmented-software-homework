/**
 * One entry of a result list rendered as one `ResultAlert` per item (see
 * `ResultAlert.vue`'s stateless visibility contract). `id` is a stable,
 * caller-assigned key so the parent can remove exactly one entry (e.g. on
 * `close`) without disturbing the others.
 */
export interface ResultAlertEntry {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  items?: string[]
}
