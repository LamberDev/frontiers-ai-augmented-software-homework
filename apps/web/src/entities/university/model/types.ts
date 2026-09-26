/**
 * University entity, matching the backend's university-directory fields
 * (see `odd/tasks/frontend-ui.md`, API contract). `score` is `null` when
 * the university directory could not resolve a score.
 */
export interface University {
  id: string
  frontiersOrganizationId: number
  name: string
  score: number | null
}
