# Feature: frontend-ui

## Objective
Usable Vue 3 frontend for `RegisterUser` and `InviteReviewer` built with Vuetify, a glassmorphism
visual style themed with the Frontiers brand colors, and UI pieces organized with atomic design
inside the existing Feature-Sliced Design (FSD) structure.

## Why
The brief requires a simple Vue 3 frontend that calls the backend endpoints and can be used by
users. The scaffold (`apps/web`) already has FSD slices, pages, router and an HTTP client base,
but no UI kit, theme or real components.

## Scope
- In: Vuetify setup, `frontiers` theme and design tokens, glass atoms/molecules in `shared/ui`,
  `GlassShell` layout and `AppHeader`, `RegisterUserForm` and `InviteReviewerForm` (local
  validation, emit-only), result views in `entities/*/ui`, page composition, `apps/web/AGENTS.md`
  update.
- Out (pending the API contract, defined by the infrastructure agent): API calls in
  `entities/*/api`, `registerUser()` / `inviteReviewer()`, stateful composables
  (`useRegisterUser`, `useInviteReviewer`), mapping backend validation errors to fields, the id
  type used by `InviteReviewer`, web Docker image.

## Constraints and decisions (confirmed by the user, 2026-09-25)
- UI kit: Vuetify (with `vite-plugin-vuetify` for auto-import/tree-shaking), `@mdi/font` icons.
- Visual style: glassmorphism with Frontiers brand colors.
- Component thinking: atomic design mapped onto FSD (FSD rules and Steiger stay authoritative):

  | Atomic level | FSD location | Examples |
  |---|---|---|
  | Tokens | `shared/config/theme` | Vuetify theme, glass CSS variables |
  | Atoms | `shared/ui/atoms` | `GlassButton`, `GlassTextField`, `BrandLogo`, `ScoreBadge` |
  | Molecules | `shared/ui/molecules` | `GlassCard`, `FormField`, `ResultAlert` |
  | Organisms | `features/*/ui`, `entities/*/ui` | `RegisterUserForm`, `InviteReviewerForm`, `UniversityCard`, `UserSummary` |
  | Templates | `widgets/`, `app/layouts` | `GlassShell`, `AppHeader` |
  | Pages | `pages/` | `RegisterUserPage`, `InviteReviewerPage` |

- Atoms wrap Vuetify components; features never style Vuetify directly.
- API contract: not addressed until the infrastructure agent defines it. Forms emit typed
  `submit` events and views receive props, so later integration only touches composables and pages.
- Vue stays pinned to `~3.5.43`.

## Brand tokens (extracted from frontiersin.org CSS, 2026-09-25)
- Primary scale: `#EEF5FF` (blue0), `#CEE1FF`, `#AECBFF`, `#6D9EFD`, `#3673F7`, `#0C4DED`
  (blue40, primary), `#003BDE` (blue50), `#002FCA`, `#0024B0` (blue70), `#001991`.
- Neutrals: text `#282828`, `#545454`, `#6B6B6B`; surfaces `#F7F7F7`, `#F0F0F0`.
- Logo accents: `#F6921E` (warning), `#EBD417`, `#DA2128` (error), `#8BC53F`, `#712E74`,
  `#25BCBD`, `#034EA1`, `#009FD1` (info), `#00844A` (success).
- Font: Frontiers uses MuseoSans (licensed); use Nunito Sans via `@fontsource/nunito-sans`.
- Glass: brand-blue gradient background with blurred accent blobs (`#25BCBD`, `#712E74`);
  translucent cards (`backdrop-filter: blur(16px)`, white 12–18 %, white 25 % border, soft
  shadow). Opaque fallback for `prefers-reduced-transparency` and no `backdrop-filter` support.
  Text on glass must meet WCAG AA contrast.

## TDD
- Mode: strict (source: global CLAUDE.md and `apps/web/AGENTS.md`). Runner: Vitest via
  `pnpm test` from `apps/web`. Observe RED before each behavior; structural/placeholder code
  needs no test.

## Delivery
- Strategy: ask-on-risk. Forecast > 400 authored lines: the chain strategy will be asked before
  the commit that crosses the budget. Commits only with the user's explicit consent.

## Tasks
- [x] T1 Vuetify and `frontiers` theme: install `vuetify`, `vite-plugin-vuetify`, `@mdi/font`,
  `@fontsource/nunito-sans`; plugin in `app/providers/vuetify.ts`; theme tokens in
  `shared/config/theme`; test that the app mounts with the theme active.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Evidence:
    - Installed versions: `vuetify` 4.2.2, `@mdi/font` 7.4.47, `@fontsource/nunito-sans` 5.3.0
      (dependencies); `vite-plugin-vuetify` 2.1.3 (devDependency). `vite-plugin-vuetify`'s peer
      range is `vite >=5`, so it works with Vite 8 as-is — no workaround needed. `vuetify`'s peer
      range accepts `vue ^3.5.0`, compatible with the pinned `~3.5.43`.
    - RED (before implementation): `pnpm test` failed with 2 failed suites — 0 tests collected —
      both erroring `Failed to resolve import "./vuetify"` and `Failed to resolve import
      "./frontiersTheme"` (files did not exist yet); the pre-existing `apiUrl.test.ts` still
      passed (1 file / 2 tests).
    - GREEN (after implementation): `pnpm test` — 3 files / 7 tests passed
      (`frontiersTheme.test.ts` 3, `vuetify.test.ts` 2, `apiUrl.test.ts` 2).
    - Checks: `pnpm test` PASS (3 files/7 tests) · `pnpm lint` PASS (0 errors/0 warnings) ·
      `pnpm steiger` PASS (no problems found) · `pnpm build` PASS (`vue-tsc -b && vite build`, 0
      errors) · `pnpm format:check` PASS (ran `pnpm format` once on `src/app/styles/main.css`
      first, then check was clean).
    - Deviations/decisions:
      1. `shared/config/index.ts` used to eagerly compute `export const apiUrl = getApiUrl()` at
         import time. Once the theme was re-exported from the same barrel, any import of
         `@/shared/config` (including for the Vuetify plugin/tests that only need the theme)
         required `VITE_API_URL` to be set, and this worktree has no `.env`. Deep-importing the
         theme module directly to dodge it was rejected by steiger
         (`fsd/no-public-api-sidestep`). Fix: changed the barrel to export `getApiUrl` (lazy)
         instead of the eagerly-computed `apiUrl` constant, and updated
         `shared/api/httpClient.ts` to call `getApiUrl()` inside `httpClient()` instead of using
         the old top-level constant. Behavior is preserved (still fails fast on a missing URL),
         just resolved lazily on first use instead of at any module import.
      2. `frontiersTheme` is declared with `satisfies ThemeDefinition` instead of a
         `: ThemeDefinition` annotation, because Vuetify's `ThemeDefinition` makes every field
         (including `colors`) optional (to support partial theme overrides), which made
         `colors` `possibly undefined` for TS in the theme test and failed `pnpm build`.
         `satisfies` keeps `colors`/`variables` required in the inferred type while still
         checking assignability.
      3. Vuetify 4.2.2's theme instance exposes the active theme name as `theme.name` (a
         `Ref<string>`), not `theme.defaultTheme`; the test was written and corrected to assert
         `vuetify.theme.name.value === 'frontiers'`.
    - Commit: pending user consent (not committed — see global no-commits-without-consent rule).
- [ ] T2 Glass atoms and molecules in `shared/ui`: `GlassCard`, `GlassButton`, `GlassTextField`,
  `FormField`, `ResultAlert`, `ScoreBadge`, with tests for props, slots and accessibility states.
- [ ] T3 Template: `GlassShell` layout (gradient background, blobs, container) and reworked
  `AppHeader` with Register/Invite navigation; responsive, visible focus.
- [ ] T4 API-free forms: `RegisterUserForm` and `InviteReviewerForm` in `features/*/ui`, local
  validation (user name required and <= 100 chars, publications >= 0, user id required), emit
  typed `submit` events.
- [ ] T5 Result views: `UserSummary`, `UniversityCard` and eligibility success/rejection view in
  `entities/*/ui`, driven by props using the existing `User`/`University` types.
- [ ] T6 Pages and closure: compose pages with the forms (provisional state on submit, no API
  calls), then `pnpm build`, `pnpm lint`, `pnpm steiger`, `pnpm test`; document atomic design,
  Vuetify and glass rules in `apps/web/AGENTS.md`.

## Pending the API contract (not started)
- [ ] P1 API calls: `entities/*/api`, `registerUser()` and `inviteReviewer()` on `httpClient`.
- [ ] P2 Stateful composables `useRegisterUser` / `useInviteReviewer` (`idle/loading/success/error`)
  and backend validation errors mapped to fields.
- [ ] P3 Contract-dependent details: id type (`Guid` vs `int`), `InviteReviewer` response shape,
  web Docker image alongside the API.

## Acceptance criteria / checks (from `apps/web`)
- `pnpm build` 0 errors, `pnpm lint` 0 errors / 0 warnings, `pnpm steiger` clean, `pnpm test` green.
- Forms usable by keyboard, labels and errors announced, AA contrast on glass surfaces.

## Progress
- 2026-09-25: plan saved; no implementation started.
- 2026-09-25: T1 implemented and verified (Vuetify + `frontiers` theme). All checks green
  (`pnpm test`, `pnpm lint`, `pnpm steiger`, `pnpm build`, `pnpm format:check`). Commit pending
  user consent.

## Next step
T2 (glass atoms and molecules in `shared/ui`), once the user authorizes the next commit/task.
