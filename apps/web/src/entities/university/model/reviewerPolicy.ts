/**
 * Minimum university score a user's university must reach for that user to
 * be eligible as a peer reviewer. Mirrors the backend's reviewer-eligibility
 * policy (see `odd/tasks/frontend-ui.md`, API contract); kept here — a
 * business rule about the `university` entity — rather than in `shared/ui`,
 * which stays business-agnostic (see `ScoreBadge`'s doc comment).
 */
export const REVIEWER_MIN_UNIVERSITY_SCORE = 60
