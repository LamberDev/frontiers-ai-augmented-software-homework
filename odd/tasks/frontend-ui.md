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
- Chain strategy: stacked-to-main — each slice is its own branch/PR to main after the previous one
  merges (PR #10 = T1+T1.1, merged `274eddd`); T2 on `feat/frontend-ui-glass`.

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
    - Commit: `b64f51b` — feat(web): add Vuetify with Frontiers theme. RDD assess: medium, review_due (slice_budget_reached, 458 lines). Review granted: lens review-reliability, approved and acknowledged (lineage review-a9c9e463ebb05dc7); reviewed boundary advances to `b64f51b`.
    - Advisory follow-ups: accepted by the user as mandatory (2026-09-25) and moved to T1.1: WARNING
      `httpClient` throws synchronously when `VITE_API_URL` is missing instead of returning a
      rejected Promise, untested; SUGGESTION no test mounts `createPeerReviewApp()`/`App.vue`;
      SUGGESTION theme tests do not assert an observable effect (e.g. `v-theme--frontiers` class).
- [x] T1.1 Review follow-ups: async httpClient rejection + test, app wiring mount test, observable
  theme assertion. Route: delegated (writer trigger, 2+ non-trivial files).
  - Evidence:
    - httpClient (`src/shared/api/httpClient.ts` + new `src/shared/api/httpClient.test.ts`): RED —
      `pnpm test -- httpClient` failed 1/2 (`expect(threwSynchronously).toBe(false)` got `true`,
      i.e. the missing-config call threw synchronously instead of rejecting). Fix: made
      `httpClient` `async` so the synchronous `getApiUrl()` throw is wrapped into a rejected
      promise. GREEN — `pnpm test -- httpClient` 2/2 passed (missing-config rejects without a
      synchronous throw; set-config case calls `fetch` with the URL resolved against the base and
      passes `init` through, verified with `vi.stubGlobal('fetch', ...)`).
    - App wiring (new `src/app/index.test.ts`, mounts `createPeerReviewApp()`, routes to
      `/register`, asserts `.v-application` root, `.v-theme--frontiers` class, `AppHeader` nav and
      the routed page text): GREEN with wiring intact (1/1). RED characterization — commenting out
      `app.use(vuetify)` in `src/app/index.ts` failed the test (`[Vuetify] Could not find defaults
      instance`); restored, re-verified GREEN (1/1). (jsdom has no `ResizeObserver`; stubbed it
      with `vi.stubGlobal`, since `<v-app>`'s layout composable requires one — test-environment
      plumbing, not part of the wiring under test.)
    - Observable theme (`src/app/providers/vuetify.test.ts`): consolidated the two mount-related
      tests into one (kept the internal `theme.name` ref test separately) mounting `<v-app>` and
      asserting the externally observable effects — `.v-theme--frontiers` class on the
      `.v-application` root, and the generated `#vuetify-theme-stylesheet` containing
      `--v-theme-primary: 12,77,237` (rgb triplet for brand primary `#0C4DED`) — not just the
      internal ref. RED characterization — changed `defaultTheme` to `'light'` in
      `src/app/providers/vuetify.ts`: both tests failed (2/2); restored, re-verified GREEN (2/2).
      (Consolidated to one `defineComponent` in the file to satisfy `vue/one-component-per-file`,
      which a second component definition triggered as a lint warning.)
    - Checks (from `apps/web`): `pnpm format` PASS (no changes needed) · `pnpm test` PASS (5
      files/10 tests: `frontiersTheme.test.ts` 3, `vuetify.test.ts` 2, `apiUrl.test.ts` 2,
      `httpClient.test.ts` 2, `app/index.test.ts` 1) · `pnpm lint` PASS (0 errors/0 warnings) ·
      `pnpm steiger` PASS (no problems found) · `pnpm build` PASS (`vue-tsc -b && vite build`, 0
      errors) · `pnpm format:check` PASS.
    - Commit: `test(web): cover app wiring, theme and async http client` (the commit that follows `b64f51b`).
- [x] T2 Glass atoms and molecules in `shared/ui`: `GlassCard`, `GlassButton`, `GlassTextField`,
  `FormField`, `ResultAlert`, `ScoreBadge`, with tests for props, slots and accessibility states.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Evidence:
    - Structure: `shared/ui/atoms/<Name>/<Name>.vue(+.test.ts)` for atoms (`GlassButton`,
      `GlassTextField`, `BrandLogo`, `ScoreBadge`) and `shared/ui/molecules/<Name>/<Name>.vue(+.test.ts)`
      for molecules (`GlassCard`, `FormField`, `ResultAlert`); steiger raised no objection to the
      atoms/molecules subfolders (clean run, no new relaxation needed). Shared glass tokens/surface
      in `shared/ui/styles/glass.css` (derived from `glassTokens` in `frontiersTheme.ts`), imported
      once as a side effect from `shared/ui/index.ts` so any consumer of the public API gets it.
      Test-only Vuetify-mounting helper at `shared/lib/test/mountWithVuetify.ts` (mounts with the
      real `frontiers` theme/MDI icons, `shared` never imports `app`).
    - RED (before implementation): `pnpm test` — 7 new suites failed with `Failed to resolve
      import "./<Component>.vue"` (files did not exist yet); the 5 pre-existing suites (10 tests)
      still passed.
    - GREEN (after implementation): `pnpm test` — 12 files / 52 tests passed (7 new component
      suites: `GlassButton` 8, `GlassTextField` 8, `BrandLogo` 3, `ScoreBadge` 7, `GlassCard` 5,
      `FormField` 4, `ResultAlert` 7; existing suites unchanged, 42 new tests total). One
      intermediate RED during implementation: `GlassTextField`'s "errorMessages marks aria-invalid"
      test failed because Vuetify's `error`/`error-messages` props style the field but do not set
      `aria-invalid` on the native `<input>`; fixed by binding `aria-invalid` explicitly (see Deviations).
    - Checks (from `apps/web`): `pnpm format` PASS (reformatted `glass.css` only, whitespace) ·
      `pnpm test` PASS (12 files/52 tests) · `pnpm lint` PASS (0 errors/0 warnings, after fixing
      one `vue/attributes-order` warning on `GlassTextField`) · `pnpm steiger` PASS (no problems
      found, no relaxation added) · `pnpm build` PASS (`vue-tsc -b && vite build`, 0 errors, after
      fixing a TS2883 unnamed-type error in `mountWithVuetify`) · `pnpm format:check` PASS.
    - Deviations/decisions:
      1. `ScoreBadge`'s aria-label: the task's own example ("University score 72") names a
         business term, which conflicts with the explicit instruction that `shared/ui` must stay
         business-agnostic (no "university"/"reviewer"/"invitation"). Resolved by adding an
         optional `label` prop defaulting to the generic `'Score'`; the accessible label is
         `${label} ${score|Unknown}`. A later entities/university consumer (T5) can pass
         `label="University score"` to reproduce the exact example without `shared/ui` naming the
         domain itself.
      2. `GlassTextField` `aria-invalid`: Vuetify 4.2.2's `VTextField` does not forward
         `aria-invalid` to its inner `<input>` from the `error`/`error-messages` props (confirmed
         by a failing test with the prop-only approach). Initially patched imperatively (template
         ref + `watchEffect`); simplified in parent spot check to a declarative
         `:aria-invalid="ariaInvalid"` binding, which `VTextField` forwards to the native input
         (same test GREEN, WCAG 4.1.2).
      3. `mountWithVuetify`'s return type: `ReturnType<typeof mount<T>>` produced a `vue-tsc`
         TS2883 error ("cannot be named without a reference to `vue-component-type-helpers`").
         Loosened the return type to `VueWrapper<ComponentPublicInstance>` (via `as unknown as`)
         since this is test-only tooling, not part of the app's public component API, so exact
         per-instance typing is not required.
      4. `GlassCard`'s `aria-labelledby` auto-wiring only applies when the default `title` prop
         rendering is used; if a caller overrides the `title` slot, the card does not set
         `aria-labelledby` (it would otherwise point at an id the caller's own markup may not
         use) — the caller then owns its own heading/labeling.
      5. Contrast approach (documented in `glass.css`): dark text `#282828` on light,
         white-tinted glass surfaces; both the `@supports not (backdrop-filter)` and
         `@media (prefers-reduced-transparency: reduce)` fallbacks resolve to an *opaque* white
         background, so AA contrast never depends on unknown content behind the surface.
         `GlassButton`'s primary variant instead sits on a solid brand-blue background and relies
         on Vuetify's theme-driven white `on-primary` text.
      6. Size: ~1239 authored lines across 17 new/changed files (7 components + 7 tests + CSS +
         test helper + barrel update), naturally above the ~400-line planning heuristic for one
         task — not split artificially, since the components form one coherent, currently-unused
         `shared/ui` addition with no natural sub-slice boundary before T3–T6 consume them.
    - Commit: bfcf169 — feat(web): add glass atoms and molecules to shared ui. RDD: medium (1296
      lines), reliability lens approved and acknowledged (lineage review-fe86bbfec38773d9);
      advisory findings accepted as T2.1. PR: #11 (`feat/frontend-ui-glass` -> `main`).
- [x] T2.1 Review follow-ups: fix ResultAlert's unreachable-once-closed visibility (parent
  v-model, content-change reset), ResultAlert's `v-for` string-keyed duplicate items, add
  GlassCard title-slot coverage (aria-labelledby always on the visible heading) and an
  observable `elevation` (bounded 0-3 class scale), treat non-finite `ScoreBadge` scores as
  unknown, and give `GlassTextField`/`FormField` a numeric (`type="number"`) model contract.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Evidence:
    1. ResultAlert visibility (`ResultAlert.vue` + `.test.ts`): RED — 3 tests failed pre-fix
       (`pnpm test -- ResultAlert`): closing didn't emit `update:modelValue`/hide (`expected
       undefined to deeply equal [ false ]`), re-show and content-change re-show both failed
       (`expected false to be true`). Fix: added `const visible = defineModel<boolean>({ default:
       true })` bound to `VAlert`'s own `v-model`, plus a `watch` on
       `[type, title, message, items]` (`{ deep: true }`) that resets `visible.value = true` on
       any content change. Contract: controlled via `v-model` (default visible); closing sets the
       model false (emits both `close` and `update:modelValue`); a dismissed alert also
       auto-reopens whenever its content changes. GREEN — `pnpm test -- ResultAlert` 11/11 passed.
       Superseded by T2.3: this parent-`v-model`/content-change-reset contract was replaced by a
       simpler, stateless one (visible == mounted; parent owns the list; no reopen logic).
    2. ResultAlert duplicate keys (same file): RED — a reorder of a 3-item list containing a
       duplicate value corrupted the rendered order with the old `:key="item"` (the DOM order
       came back wrong: `expected [...] to deeply equal [...]`), since Vue's "Duplicate keys
       found during update" check only runs mid-diff on an actual reorder (not on mount or a
       same-order update), so the test forces a reorder to exercise it. Fix:
       `:key="`${index}:${item}`"`. GREEN — the reorder renders the exact expected order, and a
       `console.warn` spy recorded zero calls.
    3. GlassCard title slot + elevation (`GlassCard.vue` + `.test.ts`): RED — 5 tests failed
       pre-fix: title-slot override had no `aria-labelledby` at all (`expected null to be
       truthy`), a subtitle alongside a title-slot override was dropped (`expected 'Custom
       heading' to contain 'Eligibility outcome'`), and `elevation` (2, 10, -1) produced no
       observable class (`expected [...] to include 'glass-card--elevation-N'`). Fix: the header
       (default `h2` or slot override) is now always wrapped in a `div` carrying the generated
       `headingId`, and the root is always `aria-labelledby` that id whenever a header exists;
       the subtitle now renders whenever `subtitle` is provided, regardless of a title-slot
       override; `elevation` is parsed with `Number()`, non-finite values ignored, clamped to
       0-3 and rounded, and applied as a `glass-card--elevation-{n}` class mapped to an
       increasing `box-shadow` in the component's scoped style (replacing the previously-inert
       `--glass-card-elevation` CSS var). GREEN — `pnpm test -- GlassCard` 11/11 passed.
    4. ScoreBadge NaN/Infinity (`ScoreBadge.vue` + `.test.ts`): RED — 3 tests failed pre-fix
       (`expected 'NaN'/'Infinity'/'-Infinity' to contain 'Unknown'`). Fix: `isUnknown` now also
       checks `!Number.isFinite(props.score)`. GREEN — `pnpm test -- ScoreBadge` 10/10 passed.
    5. GlassTextField/FormField numeric model (`GlassTextField.vue`, `FormField.vue` +
       `.test.ts` each): RED — 2 `GlassTextField` tests and 1 `FormField` test failed pre-fix
       (typing `'42'` into a `type="number"` field emitted the string `'42'` instead of the
       number `42`; clearing it emitted `''` instead of `null`). Fix: `GlassTextField` proxies
       `v-text-field`'s own string `v-model` through a computed (`fieldValue`) that, only when
       `type === 'number'`, converts on write (`''`/`null`/`undefined` -> `null`, otherwise
       `Number(value)`, `NaN` -> `null`) while leaving every other `type` as a plain string; the
       model is now typed `string | number | null`. `FormField`'s model type was widened to
       match (`string | number | null`) since it proxies `v-model` through as-is; no new
       conversion logic was needed there. GREEN — `pnpm test -- GlassTextField` 10/10 passed,
       `pnpm test -- FormField` 5/5 passed.
    - Checks (from `apps/web`): `pnpm format` PASS (reformatted one quote-escaping style in
      `FormField.test.ts` only) · `pnpm test` PASS (12 files/68 tests, up from 52) · `pnpm lint`
      PASS (0 errors/0 warnings) · `pnpm steiger` PASS (no problems found) · `pnpm build` PASS
      (`vue-tsc -b && vite build`, 0 errors) · `pnpm format:check` PASS.
  - Commit: `5237d05` — fix(web): address shared ui review findings and use lookup maps (with T2.2).
  - Review of 5237d05: RDD medium (489 lines), reliability approved and acknowledged (lineage
    review-844abfbed92bb33b); advisories handled in T2.3.
- [x] T2.2 PR #11 feedback (user): replace `switch`/conditional mappings with typed lookup maps
  (`Record` + `satisfies`) in `GlassButton` (variant -> Vuetify variant), `ResultAlert`
  (type -> role/aria-live) and `ScoreBadge` (outcome -> color); the convention is kept in agent
  memory (user choice), not in `AGENTS.md`. Route: inline (mechanical refactor, behavior unchanged).
  - Evidence: behavior-preserving refactor covered by existing tests: `pnpm test` 12 files / 68
    tests passed; `pnpm lint`, `pnpm build` clean. Commit: shared with T2.1 (`fix(web): address shared ui review findings and use lookup maps`).
- [x] T2.3 PR #11 review (5237d05) + user decision: ResultAlert becomes stateless (visible ==
  mounted, one instance per result, parent owns the list; content-change watcher and v-model
  removed); GlassButton restores the 'flat' fallback with per-variant tests. Route: delegated
  (writer trigger, 2+ non-trivial files).
  - Evidence:
    1. ResultAlert (`ResultAlert.vue` + `.test.ts`): removed `defineModel` and the content-change
       `watch`; `VAlert` is now bound with a no-op writable `v-model` (`alwaysVisible`, `get: () =>
       true, set: () => {}`) so it is always controlled and never hides itself internally; closing
       emits only `close`. Replaced the v-model/reopen tests with: a closable-alert test asserting
       `close` is emitted once and the alert stays rendered; a `defineComponent`/`h()`-based
       `ResultAlertList` harness (one `defineComponent` in the file, respecting
       `vue/one-component-per-file`) rendering N results `v-for`-keyed by a stable `id`, verifying
       that closing one result and having the parent remove it from its list only removes that
       alert (others stay), and that appending a new result — even with content identical to a
       removed one — renders a new visible alert; and a stable-rerender test asserting a freshly
       built `items` array with identical content leaves content unchanged with no
       remount/hide/console warning. RED (before the fix, new tests already in place): `pnpm test
       -- ResultAlert` — 11/12 passed, 1 failed (the closable-alert test: `expected false to be
       true`, i.e. the old implementation hid itself on close). GREEN (after the fix): `pnpm test
       -- ResultAlert` 12/12 passed.
    2. GlassButton (`GlassButton.vue` + `.test.ts`): restored the `'flat'` fallback dropped by the
       T2.2 lookup refactor — `vuetifyVariantByVariant[props.variant] ?? vuetifyVariantByVariant.primary`
       — so an unknown runtime variant no longer falls through to `VBtn`'s own default
       (`elevated`). Added tests pinning each variant's rendered `v-btn--variant-<x>` class
       (primary -> flat, secondary -> outlined, ghost -> text) plus an invalid runtime variant
       (cast in the test) falling back to flat. RED (before the fix): `pnpm test -- GlassButton` —
       11/12 passed, 1 failed (the invalid-variant test: `expected [...] to include
       'v-btn--variant-flat'`, got `'v-btn--elevated'`). GREEN (after the fix): `pnpm test --
       GlassButton` 12/12 passed.
    - Checks (from `apps/web`): `pnpm format` PASS (no changes needed) · `pnpm test` PASS (12
      files/73 tests, up from 68) · `pnpm lint` PASS (0 errors/0 warnings) · `pnpm steiger` PASS
      (no problems found) · `pnpm build` PASS (`vue-tsc -b && vite build`, 0 errors) ·
      `pnpm format:check` PASS.
  - Commit: `refactor(web): make ResultAlert stateless and restore button variant fallback` (follows `5237d05`).
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
  (`pnpm test`, `pnpm lint`, `pnpm steiger`, `pnpm build`, `pnpm format:check`). Committed as
  `b64f51b`.
- 2026-09-25: T1.1 implemented and verified (T1 review follow-ups, accepted as mandatory by the
  user: async `httpClient` rejection, app wiring mount test, observable theme assertion). All
  checks green (`pnpm test` 5 files/10 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`,
  `pnpm format:check`). Committed with user consent.
- 2026-09-25: T2 implemented and verified (glass atoms/molecules in `shared/ui`: `GlassButton`,
  `GlassTextField`, `BrandLogo`, `ScoreBadge`, `GlassCard`, `FormField`, `ResultAlert`, plus shared
  `glass.css` tokens and the `mountWithVuetify` test helper). All checks green (`pnpm test` 12
  files/52 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`, `pnpm format:check`). Committed as
  `bfcf169`; PR #11 open. RDD medium, reliability lens approved/acknowledged (lineage
  `review-fe86bbfec38773d9`); advisory findings accepted as mandatory follow-ups, moved to T2.1.
- 2026-09-26: T2.1 implemented and verified (all six mandatory review follow-ups from T2:
  ResultAlert parent-controlled visibility + content-change reset, ResultAlert duplicate-key
  fix, GlassCard title-slot `aria-labelledby` + observable `elevation`, ScoreBadge non-finite
  handling, GlassTextField/FormField numeric model contract). All checks green (`pnpm test` 12
  files/68 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`, `pnpm format:check`). Commit pending
  user consent.
- 2026-09-26: T2.3 implemented and verified (PR #11 review of `5237d05` + user decision:
  `ResultAlert` redesigned stateless — visible == mounted, one instance per result, parent owns
  the list, no reopen logic; `GlassButton`'s `'flat'` fallback restored with per-variant tests).
  All checks green (`pnpm test` 12 files/73 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`,
  `pnpm format:check`). Committed as `72c3233`.

## Next step
T2.3 is implemented and verified; awaiting user consent to commit. Then T3 (`GlassShell` layout
and reworked `AppHeader`), once the user authorizes the next commit/task.
