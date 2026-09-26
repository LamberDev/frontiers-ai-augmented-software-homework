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
- Out (superseded 2026-09-26: the API contract is defined, P1–P3 folded into T6–T9): API calls in
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
  merges (PR #10 = T1+T1.1, merged `274eddd`); T2/T2.1/T2.2/T2.3 on `feat/frontend-ui-glass`.
- Delivery note: T3 on `feat/frontend-ui-shell`, stacked on `feat/frontend-ui-glass` while PR #12
  is open; retarget to main after #12 merges.

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
- [x] T3 Template: `GlassShell` layout (gradient background, blobs, container) and reworked
  `AppHeader` with Register/Invite navigation; responsive, visible focus.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Placement decision: `GlassShell` lives at `src/widgets/glass-shell/` (`ui/GlassShell.vue` +
    `index.ts` public API), matching the atomic-design-to-FSD mapping table above (Templates ->
    `widgets/`, `app/layouts`) and mirroring the existing `widgets/app-header` shape (a
    `ui/<Name>.vue` + slice-level `index.ts`, no `model`/`api`). `app/layouts` was not used since
    `GlassShell` has no dependency on the composition root (router/Vuetify plugin instances) and
    is reusable as an ordinary widget; steiger raised no objection (clean run).
  - Evidence:
    1. `GlassShell` (new `src/widgets/glass-shell/ui/GlassShell.vue` + `.test.ts` +
       `src/widgets/glass-shell/index.ts`): renders a `position: fixed; inset: 0` gradient
       background (`#0C4DED` -> `#003BDE` -> `#0024B0`) with three absolutely-positioned, blurred
       decorative blobs (`#25BCBD` teal, `#712E74` purple, `#6D9EFD` blue), all inside one
       `aria-hidden="true"`, `pointer-events: none` wrapper (`.glass-shell__background`); a
       `header` slot rendered only when provided (`v-if="$slots.header"`); and a centered
       `.glass-shell__container` (max-width 960px, mobile-first padding, wider from 600px up) for
       the default slot. The component renders no landmark elements itself (no own `<main>`), so
       nesting it inside `v-main` (which already renders `<main>`) does not duplicate the
       landmark — verified by a dedicated test. A subtle float animation on the blobs is disabled
       under `prefers-reduced-motion: reduce`. RED (before implementation): `pnpm test` failed
       with `Failed to resolve import "./GlassShell.vue"` (file did not exist). GREEN (after
       implementation): `pnpm test -- GlassShell` 4/4 passed (header + default slot both render;
       background layer is `aria-hidden`; no nested `<main>`; no header wrapper when the slot is
       unused).
    2. `AppHeader` (`src/widgets/app-header/ui/AppHeader.vue` reworked + new `.test.ts`): now a
       `<header class="app-header glass-surface">` (reuses the shared `.glass-surface` class
       instead of styling Vuetify directly) with `BrandLogo` (`subtitle="Peer Review"`) on the
       left and a `<nav aria-label="Primary">` on the right, driven by a `navItems` array
       (`{ to, label }[]`) rendered with `v-for` — `Register user` -> `/register`, `Invite
       reviewer` -> `/invite`. `RouterLink`'s own default behavior sets `aria-current="page"` and
       the `router-link-exact-active` class on the exact-active link (confirmed by reading
       `vue-router`'s `RouterLinkImpl` render function; no extra logic needed), styled with a
       visible underline + color change; focus uses `:focus-visible` with a 3px `#0C4DED` outline
       for contrast; the header/nav wrap and stay usable on narrow widths (`flex-wrap: wrap`).
       Tests mount with a real `createMemoryHistory()` router. RED (before implementation, against
       the old placeholder header): `pnpm test -- AppHeader` — 1/3 failed (`nav`'s
       `aria-label` was `undefined`, not `'Primary'`; no `BrandLogo`/"Peer Review" text yet). GREEN
       (after implementation): `pnpm test -- AppHeader` 3/3 passed (header/nav/logo/links render;
       the register-route link has `aria-current="page"` and the invite link does not; on the
       invite route it is the reverse).
    3. `App.vue`: now `<v-app><v-main><GlassShell><template #header><AppHeader
       /></template><RouterView /></GlassShell></v-main></v-app>`. Added a scoped
       `.v-application { background: transparent; }` override (Vue's scoped CSS applies the
       component's data attribute to a direct child component's root element, so this reaches
       `VApp`'s rendered `.v-application` div without `:deep()`) so `GlassShell`'s fixed brand
       gradient shows through instead of the theme's opaque `background` color.
    4. Extended `src/app/index.test.ts`'s existing wiring test with two more assertions:
       `.glass-shell__background` exists, and exactly one `<main>` element is rendered end-to-end.
       RED (before implementation): both new assertions failed (`.glass-shell__background` was
       `null`; N/A for main count since the first assertion already failed). GREEN (after): the
       full wiring test passes with both assertions.
    5. `shared/lib/index.ts`: steiger's `fsd/no-public-api-sidestep` flagged the two new
       cross-layer test files (`widgets/app-header/ui/AppHeader.test.ts`,
       `widgets/glass-shell/ui/GlassShell.test.ts`) deep-importing
       `@/shared/lib/test/mountWithVuetify` — unlike same-layer imports from `shared/ui/**` test
       files (already tolerated, unchanged). Fixed by re-exporting `mountWithVuetify` from
       `shared/lib`'s public API (`shared/lib/index.ts`) and importing it as `@/shared/lib` from
       the two new widget test files only (existing `shared/ui/**` test files keep their working
       deep import, left unchanged). No relaxation added to `steiger.config.ts`.
    - Checks (from `apps/web`): `pnpm format` PASS (reformatted `AppHeader.vue` only, one
      multi-attribute line collapsed) · `pnpm test` PASS (14 files/80 tests, up from 12
      files/73) · `pnpm lint` PASS (0 errors/0 warnings) · `pnpm steiger` PASS (no problems found,
      no new relaxation) · `pnpm build` PASS (`vue-tsc -b && vite build`, 0 errors) ·
      `pnpm format:check` PASS.
    - Size: ~334 authored changed lines (93 insertions/deletions across 4 modified files + 241
      lines across 4 new files), under the ~400-line planning heuristic.
  - Commit: `3c8f7d8` — feat(web): add glass shell layout and navigation header. RDD assess from
    `5237d05` (covers 72c3233, 5c28e6a, 3c8f7d8): medium, 911 lines, review granted, but the bound
    STATUS after START timed out twice (`operation_timeout`, `pre_native`, Gentle AI defect,
    occurrence added to gentle-ai#4655 with user consent); candidate declined via the provider
    decline invocation. Outcome: unavailable → declined; no review receipt for this range.
  - Parent spot check (2026-09-26): the writer had re-exported the test-only `mountWithVuetify`
    from `shared/lib/index.ts` to satisfy steiger; that would let production imports of
    `@/shared/lib` pull `@vue/test-utils` and the global `ResizeObserver` stub into the bundle.
    Moved it to `apps/web/test/support/mountWithVuetify.ts` behind a `@test` alias
    (`vite.config.ts`, `tsconfig.app.json`), reverted the `shared/lib` export, documented in
    `apps/web/AGENTS.md`. Re-checked: `pnpm test` 14 files / 80 tests, lint, steiger, build,
    format:check all clean.
- [x] T4 Forms in `features/*/ui`: `RegisterUserForm` (userName required, trimmed, <= 100;
  universityName required; numberOfPublications required integer >= 0) and `InviteReviewerForm`
  (userId required, UUID format). Local validation, typed `submit` events, `loading` and
  `fieldErrors` props so server validation errors can be shown per field.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Validation timing: a field's local errors show once that field has been touched (its value
    changed at least once) or the form has been submitted at least once; after the first submit
    attempt every field counts as touched, so later edits re-validate live. Documented in each
    form's doc comment.
  - Server-vs-local field-error rule: a `fieldErrors` (server) entry for a field is shown and
    takes priority over local validation for that field, until the user edits that specific field
    again (then local validation takes over for it); a fresh `fieldErrors` prop (new object,
    e.g. from a new submission) makes the server error reappear even for a field edited since the
    previous one. Implemented with a per-field `dirtySinceServerError` flag reset by a `watch` on
    the `fieldErrors` prop and set by a `watch` on that field's own ref.
  - Files: `features/register-user/model/types.ts` (+new), `model/validateRegisterUser.ts`
    (+new) + `.test.ts`, `ui/RegisterUserForm.vue` (+new) + `.test.ts`, `index.ts` (updated);
    `features/invite-reviewer/model/types.ts` (+new), `model/validateInviteReviewer.ts` (+new)
    + `.test.ts`, `ui/InviteReviewerForm.vue` (+new) + `.test.ts`, `index.ts` (updated).
    `steiger.config.ts`: the `fsd/no-segmentless-slices` relaxation for `features/**` is now
    obsolete (both feature slices have real `ui`/`model` segments) and was replaced by a
    `fsd/insignificant-slice` relaxation for `features/**` — this rule still fires because no
    widget/page consumes either form yet (T8 lands that); remove once T8 wires the forms in.
  - RED (validators, before implementation): `pnpm test -- validateRegisterUser
    validateInviteReviewer` — both suites failed with `Failed to resolve import` (files did not
    exist). GREEN: 2 files/16 tests passed.
  - RED (`RegisterUserForm`, before implementation): `pnpm test -- RegisterUserForm` failed,
    `Failed to resolve import "./RegisterUserForm.vue"`. GREEN: 1 file/10 tests passed (valid
    trimmed submit; empty-submit shows all three required errors with `aria-invalid`; untouched
    field shows no error; touch-then-clear shows an error without submitting; non-integer
    publications blocks submit; `loading` disables submit; server `fieldErrors` shown, cleared on
    edit, and reinstated by a fresh `fieldErrors` prop).
  - RED (`InviteReviewerForm`, before implementation): `pnpm test -- InviteReviewerForm` failed,
    `Failed to resolve import "./InviteReviewerForm.vue"`. GREEN: 1 file/8 tests passed (valid
    trimmed UUID submit; empty-submit required error with `aria-invalid`; non-UUID format error;
    `initialUserId` prefill; `loading` disables submit; server `fieldErrors` shown and cleared on
    edit).
  - Checks (from `apps/web`): `pnpm format` PASS (reformatted whitespace only, plus removed an
    unused `reactive` import lint error caught by `pnpm lint`, fixed before final run) ·
    `pnpm test` PASS (20 files/125 tests, up from 18 files/114 before T5) · `pnpm lint` PASS
    (0 errors/0 warnings) · `pnpm steiger` PASS (no problems found, see relaxation note above) ·
    `pnpm build` PASS (`vue-tsc -b && vite build`, 0 errors) · `pnpm format:check` PASS.
  - Size: ~880 authored lines across 12 files (2 features x (types + validator + validator test +
    form + form test + index)), naturally above the ~400-line heuristic — two full forms with
    BDD test coverage for validation timing, server/local error precedence, a11y and loading
    state, not split artificially.
  - Commit: `aa3da40` — feat(web): add register user and invite reviewer forms. Reviewed
    together with T5 as commit range `8696b4b..aa3da40` — see T5's commit note below.
- [x] T5 Result views in `entities/*/ui`: `UserSummary` (userName, publications, copyable userId)
  and `UniversityCard` (name, Frontiers organization id, `ScoreBadge` with threshold 60 and
  `label="University score"`, null score -> Unknown); model types aligned with the contract.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Model types aligned with the API contract: `University { id, frontiersOrganizationId, name,
    score: number | null }` (`entities/university/model/types.ts`); `User { id, userName,
    numberOfPublications, university: University }` (`entities/user/model/types.ts`). No prior
    consumers existed (only placeholder pages), so no other code needed updating.
  - `REVIEWER_MIN_UNIVERSITY_SCORE = 60` exported from `entities/university/model/reviewerPolicy.ts`
    (documented as mirroring the backend's reviewer-eligibility policy), consumed by
    `UniversityCard` as `ScoreBadge`'s `threshold`.
  - FSD cross-import decision: `entities/user` embedding `University` and `UserSummary` embedding
    `UniversityCard` is a same-layer (`entities`) cross-slice reference, which `pnpm steiger`
    (`fsd/forbidden-imports`) rejects by default. Resolved with FSD's own sanctioned mechanism
    (not a config relaxation): a cross-import public API file at
    `entities/university/@x/user.ts` (the `@x` convention — re-exports only `University` and
    `UniversityCard`, the two things `entities/user` is allowed to consume from
    `entities/university`); `entities/user` imports from `@/entities/university/@x/user` instead
    of the slice's normal `index.ts`. Verified this is the intended mechanism by reading
    `@feature-sliced/steiger-plugin`'s `forbidden-imports` rule source (calls
    `isCrossImportPublicApi`) and `@feature-sliced/filesystem`'s implementation, which recognizes
    exactly a `<targetSlice>/@x/<consumingSlice>.ts` file as an explicit, scoped exception.
  - `steiger.config.ts`: the `fsd/insignificant-slice` relaxation for `entities/**` is not
    obsolete yet — verified by temporarily removing it and re-running `pnpm steiger`, which
    reintroduced "no references" errors for both entity slices (no widget/page consumes
    `UserSummary`/`UniversityCard` cross-layer yet; that lands in T8). Updated its comment to say
    so explicitly and to note the original "pure type placeholder" rationale is now stale (both
    slices have real `ui`/`model` segments), rather than removing it prematurely.
  - Files: `entities/university/model/types.ts` (updated), `model/reviewerPolicy.ts` (+new),
    `ui/UniversityCard.vue` (+new) + `.test.ts`, `@x/user.ts` (+new), `index.ts` (updated);
    `entities/user/model/types.ts` (updated), `ui/UserSummary.vue` (+new) + `.test.ts`, `index.ts`
    (updated).
  - RED (`UniversityCard`, before implementation): `pnpm test -- UniversityCard` failed, `Failed
    to resolve import "./UniversityCard.vue"`. GREEN: 1 file/5 tests passed (name + Frontiers
    organization id render; null score -> "Unknown"; boundary score 60 passes (success color);
    score 59 fails (error color); `label="University score"` accessible name).
  - RED (`UserSummary`, before implementation): `pnpm test -- UserSummary` failed, `Failed to
    resolve import "./UserSummary.vue"`. Intermediate RED during implementation: stubbing the
    whole `navigator` global to test clipboard behavior broke Vuetify's `display` composable
    (`Cannot read properties of undefined (reading 'match')`, since it reads `navigator.userAgent`
    at `createVuetify()` time); fixed by stubbing only `navigator.clipboard` via
    `Object.defineProperty` instead of replacing all of `navigator`. GREEN: 1 file/6 tests passed
    (renders name/publications/monospace `<code>` user id; embeds `UniversityCard` for the
    user's university; `actions` slot renders when provided and is absent otherwise; copy button
    calls `navigator.clipboard.writeText` and announces "Copied." via `aria-live`; clipboard
    unavailable announces a distinct message without throwing).
  - Checks (from `apps/web`): `pnpm format` PASS (reformatted whitespace only) · `pnpm test` PASS
    (20 files/125 tests) · `pnpm lint` PASS (0 errors/0 warnings) · `pnpm steiger` PASS (no
    problems found, see `@x` cross-import and relaxation notes above) · `pnpm build` PASS
    (`vue-tsc -b && vite build`, 0 errors) · `pnpm format:check` PASS.
  - Size: ~394 authored lines across 10 files, close to the ~400-line heuristic — not split
    artificially (two entity slices with real UI, tests and a cross-import public API file).
  - Commit: `8696b4b` — feat(web): add user and university result views. Review of commit range
    `8696b4b..aa3da40` (covers this task and T4): RDD medium, 1468 lines, reliability lens
    approved and acknowledged (lineage `review-6e35c2d3900ad054`); advisory findings accepted as
    mandatory follow-ups, recorded as T5.1 below.
- [x] T5.1 Review follow-ups (from the `8696b4b..aa3da40` review above): `entities/user`'s
  `id`/`userId` mapping made explicit via a `toUser` mapper (landed with T6, see its Files list);
  `UserSummary` copy distinguishes a rejected clipboard promise from an unsupported one, and
  clears its live region before each attempt so a repeated outcome is re-announced;
  `RegisterUserForm` guards its submit payload's numeric field at runtime instead of an `as`
  cast. Route: inline (doc-comment fix + two already-understood component edits with their
  tests; no new design work, under the 4-file mapping/writer-trigger thresholds).
  - Evidence:
    1. `entities/user/model/types.ts`: WARNING — the doc comment claimed `User`'s fields matched
       the wire format verbatim, which is false once `toUser` (T6) renames the API's `userId` to
       the domain's `id`. Fixed the doc comment only (no behavior change, no test needed); the
       mapping itself and its pinning test (`toUser.test.ts`) are T6.
    2. `UserSummary.vue` + `.test.ts`: WARNING — added a test where
       `navigator.clipboard.writeText` rejects. RED: `pnpm test -- UserSummary` 6/8 passed, 2
       failed (the new rejected-clipboard test: `expected 'Copying is not supported in this
       browser.' to be 'Could not copy the user id.'`; a new repeated-copy test:
       `expected 'Copied.' to be ''`). Fix: an `announcementByOutcome` lookup map
       (`success`/`unsupported`/`rejected`), and `copyUserId` now clears
       `copyAnnouncement` and awaits `nextTick()` before checking the outcome, so a repeated
       identical message is re-announced by assistive tech. GREEN: `pnpm test -- UserSummary`
       8/8 passed.
    3. `RegisterUserForm.vue` + `.test.ts`: SUGGESTION — added a characterization test (type a
       number, clear it, submit): already passed before the change (`validateRegisterUser`
       already rejects `null` as "Number of publications is required." before the emit is
       reached), confirming `GlassTextField`'s numeric contract (T2.1) really does emit `null` on
       clear. Replaced the `numberOfPublications.value as number` cast at the emit site with an
       explicit `typeof publications !== 'number'` runtime guard (early-returns instead of
       trusting the cast), behavior-preserving: `pnpm test -- RegisterUserForm` 11/11 passed
       before and after.
  - Checks (from `apps/web`): all covered by T6/T7's full-suite run below (`pnpm test` 26
    files/157 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`, `pnpm format:check`), run once
    against the combined working tree rather than repeated per task.
  - Commit: pending (see the Next step note for how this task's files split from T6/T7's).
- [x] T6 API layer: `shared/api` parses RFC 9457 problem responses (JSON or empty body, e.g.
  415) into a typed `ApiError` (`status`, `code`, `title`, `detail`, `fieldErrors`); typed
  `registerUser()` / `inviteReviewer()` calls in the feature `api` segments on `httpClient`.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - `ApiError`: a `class extends Error` (not a discriminated result) — `{ status, code?, title?,
    detail?, fieldErrors: Record<string, string[]> }` — chosen over a result type so every
    caller uses one uniform `try`/`catch` (matching the codebase's existing exception-based
    style, e.g. `getApiUrl()`'s throw), rather than mixing thrown and returned error paths.
    `requestJson<T>(path, init)` (`shared/api/requestJson.ts`) is the one JSON request/response
    helper on top of `httpClient`; every failure mode converts to a rejected `ApiError`: a
    non-2xx response (parsed from `application/problem+json`/JSON when present, tolerating an
    empty or non-JSON body down to `{ status }` only), a network failure (`fetch` itself
    rejecting — status 0, `code: 'Network.Unavailable'`), or a missing `VITE_API_URL` (detected
    by calling `getApiUrl()` directly before the fetch, not by sniffing the rejection message —
    status 0, `code: 'Config.MissingApiUrl'`).
  - `toUser` mapper decision: placed in `entities/user/model/toUser.ts` (not
    `features/register-user/api/`), because the mapping (`userId` -> `id`) is owned by the
    entity it produces — any future feature receiving a user-shaped DTO can reuse it instead of
    duplicating the field rename; the DTO type (`entities/user/model/dto.ts`) reuses the
    `University` domain type as-is for the nested `university` object (its fields already match
    the wire format field-for-field, so no separate university DTO/mapping is needed). Both
    exported from `entities/user`'s public API.
  - Files: `shared/api/ApiError.ts` (+new), `requestJson.ts` (+new) + `.test.ts`, `index.ts`
    (updated); `entities/user/model/dto.ts` (+new), `toUser.ts` (+new) + `.test.ts`, `index.ts`
    (updated); `features/register-user/api/registerUser.ts` (+new) + `.test.ts`, `index.ts`
    (updated); `features/invite-reviewer/model/types.ts` (updated, `+InvitationResult`,
    `+InvitationReason`), `api/inviteReviewer.ts` (+new) + `.test.ts`, `index.ts` (updated).
  - RED (`requestJson`, before implementation): `pnpm test -- requestJson` failed, `Failed to
    resolve import "./requestJson"`. GREEN: 1 file/8 tests passed (missing config rejects without
    calling `fetch`; network rejection; success mapping + request method/headers/body; 400
    validation problem -> fieldErrors; 404 with code and no `errors` dict -> empty fieldErrors;
    502 with code; 415 empty body -> status only; bare 400 non-JSON body -> status only).
  - RED (`toUser`, before implementation): `pnpm test -- toUser` failed, `Failed to resolve
    import "./toUser"`. GREEN: 1 file/1 test passed (wire `userId` -> domain `id`, rest as-is).
  - RED (`registerUser`/`inviteReviewer` api, before implementation): both suites failed, `Failed
    to resolve import`. GREEN: `registerUser.test.ts` 2/2 (POSTs to `/api/users` with the mapped
    body, resolves with the mapped `User`; a validation-problem rejection carries `fieldErrors`);
    `inviteReviewer.test.ts` 3/3 (POSTs to `/api/reviewers/invitations`; resolves with
    `invited: true` and `invited: false` + `reasons` alike, both `200`; a not-found rejection
    carries the code).
  - Deviation: `registerUser.test.ts`'s first draft used the same `vi.resetModules()` + dynamic
    `import()` per test pattern as `shared/api`/`shared/config`'s tests (needed there because
    those tests vary the env var *across* tests in one file). Both of this file's tests use the
    same `VITE_API_URL` value, so that reset bought nothing but re-triggered
    `registerUser.ts -> @/entities/user`'s heavier transform (pulls in `UserSummary.vue`'s
    Vuetify component tree) on every test; under the full 26-file suite's CPU contention this
    intermittently exceeded even a raised 20s per-test timeout. Rewritten with a plain static
    import and `vi.stubEnv`/`vi.stubGlobal` per test (no reset needed: `getApiUrl()` reads the
    env var uncached on every call) — confirmed stable across 3 consecutive full-suite runs
    afterwards (157/157 each time).
  - Checks: see T7 below (verified together against the combined working tree).
  - Commit: pending (see the Next step note for how this task's files split from T5.1/T7's).
- [x] T7 Stateful composables in `features/*/model`: `useRegisterUser` / `useInviteReviewer`
  (`idle`/`loading`/`success`/`error` via lookup maps), server `errors` mapped to form fields,
  results appended as one `ResultAlert` per result (stateless contract from T2.3). Route:
  delegated (writer trigger, 2+ non-trivial files).
  - `ResultAlertEntry` (new `shared/ui/molecules/ResultAlert/ResultAlertEntry.ts`, exported from
    `shared/ui`): `{ id, type, title, message?, items? }`, one entry per `ResultAlert` instance
    (T2.3's stateless contract) — shared by both composables instead of duplicated per feature,
    since it is exactly `ResultAlert`'s own prop shape plus a stable `id` key.
  - Both composables take their api function as an optional constructor parameter (e.g.
    `useRegisterUser({ registerUser })`), defaulting to the real API call, for dependency
    injection in tests instead of `vi.mock`.
  - `useRegisterUser`: on success, appends a `success` entry ("User registered" /
    "`<userName>` was registered with `<university name>`."), sets `lastUser`, clears
    `fieldErrors`. On an `ApiError` with `fieldErrors`, narrows the server's free-form keys down
    to the form's known fields (`toRegisterUserFieldErrors`, ignoring any unexpected key) and
    appends a generic "Please fix the highlighted fields." error entry. On any other `ApiError`,
    a `FRIENDLY_TITLE_BY_CODE` lookup map (by `code`) supplies the title, falling back to
    "Something went wrong. Please try again."; the `ApiError`'s own `detail` (server-controlled
    text from the same ProblemDetails contract, not raw exception internals) is included as the
    entry's `message` when present.
  - `useInviteReviewer`: same shape, plus `lastInvitation`. A successful request (`invited` true
    or false) always sets `status` to `success` — the request itself succeeded either way — while
    a `RESULT_TYPE_BY_INVITED` lookup map decides the *entry's* type: `invited: true` ->
    `success` ("Invitation sent", the API's own `message`); `invited: false` -> **`warning`**
    (chosen over `error`, since the request succeeded and the user is simply ineligible) with the
    API's `reasons[].message` as `items`. `ApiError` mapping mirrors `useRegisterUser`, with
    `Reviewer.UserNotFound` -> "User not found." and field errors narrowed to `userId`.
  - Double-submission guard: `submit()` returns immediately if `status` is already `'loading'`;
    since `status` is set to `'loading'` synchronously before the first `await`, a second
    synchronous call is guaranteed to see it and no-op, so the test needs no timing tricks.
  - Files: `features/register-user/model/useRegisterUser.ts` (+new) + `.test.ts`, `index.ts`
    (updated); `features/invite-reviewer/model/useInviteReviewer.ts` (+new) + `.test.ts`,
    `index.ts` (updated); `shared/ui/molecules/ResultAlert/ResultAlertEntry.ts` (+new),
    `shared/ui/index.ts` (updated).
  - RED (`useRegisterUser`, before implementation): `pnpm test -- useRegisterUser` failed,
    `Failed to resolve import "./useRegisterUser"`. GREEN: 1 file/8 tests passed (idle initial
    state; success sets lastUser/clears fieldErrors/appends a success result; server
    fieldErrors — including an unknown key ignored — set and appends an error result; a known
    ApiError code appends a friendly title + `detail` as message; an unmapped code falls back to
    the default title; `Network.Unavailable` gets its own friendly title; a second concurrent
    submit is ignored, API called once; `dismiss` removes only the matching result).
  - RED (`useInviteReviewer`, before implementation): `pnpm test -- useInviteReviewer` failed,
    `Failed to resolve import "./useInviteReviewer"`. GREEN: 1 file/7 tests passed (idle initial
    state; `invited: true` -> success result with the API message; `invited: false` -> warning
    result with `reasons` as `items`; server fieldErrors set and appends an error result;
    `Reviewer.UserNotFound` -> "User not found."; double-submission guard; `dismiss`).
  - Checks (from `apps/web`, covering T5.1, T6 and T7 together): `pnpm format` PASS (formatted
    the new files only) · `pnpm test` PASS (26 files/157 tests, up from 20 files/125 before T5.1;
    confirmed stable across 3 consecutive full-suite runs, see the T6 deviation note above) ·
    `pnpm lint` PASS (0 errors/0 warnings, after removing 4 `no-unused-vars` on an
    only-used-as-a-type `ApiError` import in `requestJson.test.ts`'s later assertions — fixed by
    adding a `rejects.toBeInstanceOf(ApiError)` assertion alongside each, which also strengthens
    those tests) · `pnpm steiger` PASS (no problems found) · `pnpm build` PASS
    (`vue-tsc -b && vite build`, 0 errors) · `pnpm format:check` PASS.
  - Commit: pending.
- [ ] T8 Pages: `RegisterUserPage` (form + registered user/university + "Invite as reviewer"
  link to `/invite?userId=<id>`) and `InviteReviewerPage` (form prefilled from the query + one
  alert per invitation outcome with reasons). Update `AGENTS.md` (web usage notes).
- [ ] T9 Delivery: web `Dockerfile` (multi-stage Node build + nginx, `VITE_API_URL` build
  arg), `.env.example`, and the `web` service in `docker-compose.yml` once the API compose file
  (`feat/use-cases`) is on `main`; README run instructions.

## API contract (from `feat/use-cases`, explored 2026-09-26)
Defined by the infrastructure/use-cases work; the frontend consumes it as-is.
- `POST /api/users` body `{ userName, universityName, numberOfPublications }` ->
  `201 { userId: uuid, userName, numberOfPublications, university: { id: uuid,
  frontiersOrganizationId: number, name, score: number | null } }`.
- `POST /api/reviewers/invitations` body `{ userId: uuid }` -> `200 { userId, invited: boolean,
  message, reasons: { code, message }[] }` for both eligible and ineligible outcomes.
- Errors: RFC 9457 `application/problem+json` with a `code` extension; validation problems add
  `errors: { <camelCaseField>: string[] }`. Codes: 400 `User.UserNameRequired`,
  `User.UserNameTooLong`, `User.NegativeNumberOfPublications`,
  `RegisterUser.UniversityNameRequired`, `RegisterUser.NumberOfPublicationsRequired`,
  `Reviewer.UserIdRequired`, `Request.InvalidBody`; 404 `UniversityDirectory.NotFound`,
  `Reviewer.UserNotFound`; 502 `UniversityDirectory.Unavailable` / `.InvalidEntry`; 500
  `Server.UnexpectedError`. 415 has an empty body; in Production a malformed body may still
  return a bare 400 (API task T4c pending), so the client must tolerate non-JSON errors.
- Ids are UUID strings (deliberate deviation from the brief's `int UserId`).
- CORS: POST + `Content-Type` only, origin `http://localhost:5173` (dev and compose).
  API dev URL `http://localhost:5112`; compose publishes `127.0.0.1:8080`.
- OpenAPI: `GET /openapi/v1.json`.

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
- 2026-09-26: T3 implemented and verified (`GlassShell` template widget — gradient background,
  blurred blobs, `header`/default slots, centered container — plus `AppHeader` reworked into a
  glass nav bar with `BrandLogo` and data-driven Register/Invite links; `App.vue` composed with
  `GlassShell`; test helper later moved to `apps/web/test/support` behind `@test`). All checks
  green (`pnpm test` 14 files/80 tests, `pnpm lint`, `pnpm steiger`, `pnpm build`,
  `pnpm format:check`). Committed as `3c8f7d8`; review unavailable (Gentle AI timeout) and
  declined for that candidate.
- 2026-09-26: T4 implemented and verified (`RegisterUserForm` and `InviteReviewerForm` in
  `features/*/ui`, API-free: local validators in `model`, typed `submit` events, `loading` and
  `fieldErrors` props with a documented touch/submit validation-timing rule and a server-vs-local
  field-error precedence rule). All checks green (`pnpm test` 20 files/125 tests, `pnpm lint`,
  `pnpm steiger`, `pnpm build`, `pnpm format:check`). `steiger.config.ts`'s obsolete
  `fsd/no-segmentless-slices` relaxation for `features/**` replaced with a narrower, still-needed
  `fsd/insignificant-slice` one (removable once T8 wires the forms into a page). Committed as
  `aa3da40`.
- 2026-09-26: T5 implemented and verified (`University`/`User` model types aligned with the API
  contract; `REVIEWER_MIN_UNIVERSITY_SCORE` policy constant; `UniversityCard` and `UserSummary` in
  `entities/*/ui`). `entities/user` embedding `University`/`UniversityCard` is a same-layer
  cross-slice reference that `pnpm steiger` rejects by default; resolved with FSD's own `@x`
  cross-import public API convention (`entities/university/@x/user.ts`) rather than a config
  relaxation. Verified the `entities/**` `fsd/insignificant-slice` relaxation is still needed
  (not yet obsolete) by temporarily removing it and observing the errors return; updated its
  comment accordingly. All checks green (`pnpm test` 20 files/125 tests, `pnpm lint`,
  `pnpm steiger`, `pnpm build`, `pnpm format:check`). Committed as `8696b4b`. Review of
  `8696b4b..aa3da40` (covers T5 and T4): RDD medium, 1468 lines, reliability lens approved and
  acknowledged (lineage `review-6e35c2d3900ad054`); advisories accepted as mandatory follow-ups,
  moved to T5.1.
- 2026-09-26: T5.1 implemented and verified (review follow-ups from the `8696b4b..aa3da40`
  review: `entities/user`'s doc comment no longer claims field-for-field wire-format parity;
  `UserSummary`'s clipboard copy distinguishes a rejected promise from an unsupported one and
  clears its live region before each attempt so a repeated outcome re-announces;
  `RegisterUserForm`'s submit guards its numeric payload field at runtime instead of an `as`
  cast). Verified together with T6/T7 in one full-suite run (checks recorded under T7); not yet
  committed — see the Next step note on how the three tasks' changes are separable.
- 2026-09-26: T6 implemented and verified (`shared/api`'s `ApiError` class and `requestJson`
  JSON helper — RFC 9457 problem parsing tolerant of an empty/non-JSON body, network failures and
  missing `VITE_API_URL` all surfacing as `ApiError`; `entities/user`'s `toUser` DTO mapper;
  `registerUser()`/`inviteReviewer()` in each feature's `api` segment). Verified together with
  T5.1/T7 (checks recorded under T7); not yet committed.
- 2026-09-26: T7 implemented and verified (`useRegisterUser`/`useInviteReviewer` stateful
  composables in `features/*/model`, a shared `ResultAlertEntry` type in `shared/ui`, DI-friendly
  api parameters). All checks green (`pnpm test` 26 files/157 tests — confirmed stable across 3
  consecutive full-suite runs after fixing an unrelated per-test-transform perf issue in
  `registerUser.test.ts`, see its evidence — `pnpm lint`, `pnpm steiger`, `pnpm build`,
  `pnpm format:check`). Commit pending user consent.

## Next step
T8 (pages: `RegisterUserPage`, `InviteReviewerPage` wiring forms, composables and result views;
`AGENTS.md` web usage notes). T5.1, T6 and T7 are committed as three work-unit commits (barrel
export lines staged per task).
