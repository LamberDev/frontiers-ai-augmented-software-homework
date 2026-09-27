# Feature: glass-palette

## Objective

Replace the Frontiers blue palette of `apps/web` with the violet → indigo → pink glassmorphic
palette from the frontend visual spec (section 3.2 "Tokens"), keeping WCAG 2.2 AA visibility.

## Scope

- In: color tokens only — Vuetify theme colors, glass surface colors/alphas/shadow, background
  gradient and blobs, hard-coded hex colors in `shared`/`widgets` components, focus ring color,
  and an automated contrast test over the theme token pairs.
- Out: fonts, typography scale, spacing, radius, blur radius, layout, motion, component structure.

## Palette (from spec 3.2)

| Token | HSL | Hex |
|---|---|---|
| gradient-start | 270 60% 65% | #a670db |
| gradient-middle | 240 70% 70% | #7d7de8 |
| gradient-end | 320 55% 75% | #e29ccb |
| foreground | 240 10% 10% | main text |
| primary | 270 65% 30% | #4d1b7e |
| primary-foreground | 0 0% 100% | #ffffff |
| secondary | 240 70% 92% | |
| muted / muted-foreground | 240 10% 96% / 240 5% 45% | |
| accent | 320 55% 60% | |
| destructive | 0 84.2% 60.2% | |
| ring | 270 60% 50% | focus ring |
| glass-bg / glass-border | white 12 % / white 35 % | |
| glass-shadow | 0 8px 30px hsl(0 0% 0% / 0.15) | |
| glass-inset | inset 0 1px 0 hsl(0 0% 100% / 0.25) | |

## TDD

Strict TDD enabled (user global config). Runner: `pnpm test` (`vitest run`) in `apps/web`.

## Tasks

- [x] T1 — Palette tokens + contrast test (route: delegated direct, writer trigger: 6+ non-trivial files)
  - Update `frontiersTheme.ts` colors and its test; `glass.css` tokens; `GlassShell` gradient/blobs;
    `AppHeader`, `BrandLogo`, `GlassCard` hard-coded colors; `vuetify.test.ts` rgb assertion.
  - Add contrast test (text/surface ≥ 4.5:1, control/background ≥ 3:1).

- [x] T2 — Readable secondary text on glass (route: inline, 4 mechanical edits + test)
  - User report: "Peer Review" subtitle barely visible. Root cause: muted-foreground `#6D6D78`
    on 12 % glass over the gradient is 1.72 / 1.73 / 2.64:1; T1's test compared it to opaque
    white, which is not the real background.
  - Contrast test now blends glass (`glassTokens.surfaceAlpha`) over each gradient stop
    (`blendWithWhite`) and asserts every text token ≥ 4.5:1. RED: 6 failures. GREEN: medium/low
    emphasis → foreground `#17171C` (6.02 / 6.05 / 9.24:1); BrandLogo and GlassCard subtitles
    use `var(--glass-text)`. `pnpm test` 206/206, lint, format:check, steiger, build OK.
- [x] T3 — Result alerts as top-right toasts with semantic colors (route: delegated direct,
  mapping + writer trigger)
  - Success / warning / error toasts stacked top-right, identifiable colors, AA contrast,
    closable; success auto-dismisses, warning/error persist until closed.

## Checks

`pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm steiger`, `pnpm build` in `apps/web`.

## Delivery

No commits/push/PR unless the user asks in the moment (user preference since 2026-09-27).

## Progress

- Worktree `../frontiers-ai-augmented-software-homework-worktrees/glass-palette`, branch
  `feat/glass-palette` from `origin/main` (8e279cd).
- T1 done. TDD: RED first — updated `frontiersTheme.test.ts` (new hex + `on-primary` +
  retired-keys assertions), `vuetify.test.ts` (rgb `77,27,126`), and new
  `shared/config/theme/contrast.test.ts` (+ pure `contrastRatio` helper in
  `shared/config/theme/contrast.ts`) against the *old* theme values; observed 11 failing
  tests across the 3 files (old primary too close to the new gradient stops, old hex
  values, missing `on-primary`, retired keys still present). Then updated
  `frontiersTheme.ts` (colors, `glassTokens` alphas) and re-ran: GREEN (20/20 in those 3
  files). Then propagated the same hex values to `glass.css`, `GlassShell.vue`,
  `AppHeader.vue`, `BrandLogo.vue`, `GlassCard.vue` (no test changes needed there — grep
  confirmed no test asserts those literals) and re-ran the full suite: GREEN (197/197).
  Fixed one `vue-tsc` type error along the way (test tried to index the now-stricter
  `colors` type with retired keys; switched that assertion to `Object.keys(...).not
  .toContain(...)`).
- T3 done. New `shared/ui/molecules/ToastStack/ToastStack.vue` renders `results` as a
  fixed top-right toast stack (position:fixed, top/right 1rem, z-index 2000, max-width
  `min(24rem, 100vw - 2rem)`, full-width gutter below 640px), one `ResultAlert` per
  entry (`v-for` keyed by stable `id`, unchanged results-list contract). `ResultAlert`
  itself dropped the translucent `.glass-surface` class (toasts are now solid/opaque via
  Vuetify's `variant="flat"` + `type`-driven `bg-success`/`bg-warning`/`bg-error`); role
  mapping (`status`/`polite` for success/info, `alert`/`assertive` for warning/error) is
  unchanged. Auto-dismiss: a lookup map `AUTO_DISMISSES_BY_TYPE` (success: true;
  warning/error/info: false) drives a per-id `setTimeout(…, 5000)` tracked in a
  `Map<id, timer>`, reconciled on every `items` change (clears the timer for any id no
  longer present) and on `onBeforeUnmount` (clears all) — tested with `vi.useFakeTimers`
  / `vi.advanceTimersByTime` in `ToastStack.test.ts` (auto-dismiss fires,
  warning/error don't, a user-closed id's timer never fires again, unmount clears
  pending timers, two success entries each get their own independent timer). Reasons
  (`items`) still pass straight through to `ResultAlert`. Enter/leave uses a
  `TransitionGroup` (slide-in-from-right + fade, 0.2s), disabled under
  `prefers-reduced-motion: reduce`.
  - TDD: RED first — added `ToastStack.test.ts` (component didn't exist yet), a
    `ResultAlert.test.ts` case asserting no `.glass-surface` class, `frontiersTheme
    .test.ts` cases for the new toast hex values and explicit white `on-success`/
    `on-warning`/`on-error`, and `contrast.test.ts` cases asserting white text on each
    toast color >= 4.5:1 (reading the colors from `frontiersTheme`, not duplicated
    literals) — replacing the old "error contrast reported, not enforced" case, since
    the new error color passes. Ran `pnpm test`: 5 failures (missing module + the 4
    assertions above) confirming RED. Then implemented `frontiersTheme.ts`,
    `ResultAlert.vue`, `ToastStack.vue`, `shared/ui/index.ts`, and both pages: GREEN,
    219/219.
  - Vuetify theme **changed**: `success` `#00844A` -> `#15803D` (5.02:1 white),
    `warning` `#F6921E` -> `#B45309` (5.02:1 white), `error` `#EF4444` -> `#B91C1C`
    (6.47:1 white; the old error color was only 3.76:1, below AA — now fixed), plus new
    explicit `on-success`/`on-warning`/`on-error: #FFFFFF`. Reusing the theme colors for
    the toast (via `type` -> `bg-{type}`) keeps `bg-success`/`bg-warning` assertions in
    `InviteReviewerPage.test.ts` passing unchanged. Same hex values mirrored as CSS
    custom properties in `glass.css` (`--toast-success-bg`/`--toast-warning-bg`/
    `--toast-error-bg`/`--toast-text`) for any non-Vuetify-themed consumer; `frontiersTheme
    .ts` stays the source of truth. `info` (`#009FD1`) left unchanged (not a toast type
    used by either page today, out of the requested scope).
  - Pages: `RegisterUserPage.vue`/`InviteReviewerPage.vue` now render
    `<ToastStack :items="results" @close="dismiss" />` inside the existing
    `<section aria-label="Results">` landmark (kept, so `[aria-label="Results"]` and all
    `.result-alert`/`bg-success`/`bg-warning`/role assertions in both page test suites
    still pass unchanged) instead of a manual `v-for` of `ResultAlert`; the composables'
    public contract (`results`, `dismiss`) is untouched. Dropped the now-dead
    `:empty { display: none }` CSS rule on both pages (the results section is never
    empty anymore — it always contains the `ToastStack` root, which uses
    `position: fixed` and takes no layout space regardless of `results.length`).
  - Verification (in `apps/web`): `pnpm test` -> 219/219 passed; `pnpm lint` -> 0
    errors/warnings; `pnpm format:check` -> clean (after `prettier --write` on the new
    `ToastStack.vue`); `pnpm steiger` -> no problems; `pnpm build` -> `vue-tsc -b && vite
    build` succeeded. Status: **done**.
- Hex values chosen (HSL -> hex, verified with a small Node script and cross-checked
  against the spec's own listed hex for gradient-start/middle/end/primary):
  gradient-start `#A670DB`, gradient-middle `#7D7DE8`, gradient-end `#E29CCB`,
  foreground/on-surface/on-background `#17171C`, primary `#4D1B7E`, on-primary `#FFFFFF`,
  secondary `#DCDCF9`, muted/background `#F4F4F6`, muted-foreground `#6D6D78`,
  accent `#D161AC`, destructive/error `#EF4444`, ring `#8033CC` (not a Vuetify color key;
  used directly in `AppHeader.vue`'s focus outline and mirrored as a literal in
  `contrast.test.ts`). Dropped `primary-darken-1`/`primary-lighten-1`/`primary-lighten-5`/
  `accent-teal`/`accent-purple` — grep confirmed none were referenced anywhere in `src`.
  `success`/`warning`/`info` left unchanged (out of scope; not newly introduced).
- Computed WCAG 2.2 contrast ratios (see `contrast.test.ts`): foreground vs white 17.86:1;
  muted-foreground vs white 5.11:1; white vs primary 11.84:1; primary vs gradient-start
  3.36:1; primary vs gradient-middle 3.37:1; primary vs gradient-end 5.55:1; ring vs white
  6.44:1 — all pass their required threshold (4.5:1 or 3:1). Destructive/error (`#EF4444`)
  vs white: **3.76:1**, reported per the task's instruction, not silently changed — below
  the 4.5:1 AA text threshold, so `error` text/icons on a plain white surface should stay
  on a background/weight that doesn't rely on 4.5:1 body-text contrast (e.g. Vuetify's
  auto-picked `on-error`, chips/badges, or bold/larger text at the 3:1 large-text
  threshold), which this colors-only task does not change.
- Verification (run in `apps/web`, after `pnpm install --frozen-lockfile` since the
  worktree had no `node_modules`): `pnpm test` -> 197/197 passed; `pnpm lint` -> 0
  errors/warnings; `pnpm format:check` -> clean (after `prettier --write` on the one new
  file, `contrast.ts`); `pnpm steiger` -> no problems; `pnpm build` -> `vue-tsc -b && vite
  build` succeeded. Status: **done**.
- T4 (inline, 1 component + its test): user reported the error icon and the close "x" were
  confusing. Root cause: Vuetify's default `error` icon alias is `mdi-close-circle`. RED: 3
  failing tests (warning/error icon, close label). GREEN: `iconByType` lookup map in
  `ResultAlert.vue` (success `mdi-check-circle`, info `mdi-information`, warning `mdi-alert`,
  error `mdi-alert-octagon`) and `close-label="Dismiss notification"`. `pnpm test` 224/224,
  lint, format:check, steiger, build OK.
- T5 (inline, 1 file, CSS only): removed the native number spinner in `GlassTextField.vue`
  (`appearance: textfield` + hidden `::-webkit-*-spin-button`, scoped via `:deep`). No unit
  test: jsdom cannot render or query the spinner pseudo-elements, so a test would only assert
  markup, not the behavior. Checked that the built CSS contains the scoped rules;
  `pnpm test` 224/224, lint, format:check, build OK.
- Commits: b5fa81a (palette + contrast), af77360 (toasts + icons), 512f96d (number spinner).
  Gentle AI review (medium, consent granted, lens review-reliability): approved and
  acknowledged, authority burned. Advisory, non-blocking follow-ups: ToastStack watch is
  shallow (only fires on new array references); success toast has no pause on hover/focus;
  `hexToRgb` does not reject malformed hex.
