/**
 * Cross-import public API for the `entities/user` slice only (FSD `@x`
 * convention — https://feature-sliced.design/docs/reference/public-api#cross-imports).
 *
 * A `User` always has exactly one `University` (matches the backend's
 * response shape — see `odd/tasks/frontend-ui.md`, API contract), so
 * `entities/user` needs the `University` type and `UniversityCard` to
 * embed it in `UserSummary`. This file is the only sanctioned way for
 * `entities/user` to reach into `entities/university`; no other slice
 * should import from this path.
 */
export type { University } from '../model/types'
export { default as UniversityCard } from '../ui/UniversityCard.vue'
