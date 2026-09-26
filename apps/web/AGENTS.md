# apps/web — Agent Instructions

Vue 3.5.x + TypeScript frontend, managed with pnpm. Feature-Sliced Design (FSD). Read this
before adding or changing any code here.

## Layers and import rule

`app` -> `pages` -> `widgets` -> `features` -> `entities` -> `shared`

Each layer may import only from layers strictly below it in this order (never sideways between
slices of the same layer, never upward). `shared` imports from nothing else in `src`.

```
app/       providers/router.ts, styles/main.css, App.vue, index.ts (composition root)
pages/     register-user/, invite-reviewer/
widgets/   app-header/
features/  register-user/, invite-reviewer/
entities/  user/, university/
shared/    api/, config/, ui/, lib/ (no business logic)
```

Slice names mirror the backend's business use cases/entities: `register-user`,
`invite-reviewer` (features/pages), `user`, `university` (entities). Slices are kebab-case.

## Segments and public API

- Allowed segments inside a slice: `ui`, `model`, `api`, `lib`, `config` only.
- Every slice exposes its public API **only** through its `index.ts`. Never deep-import a file
  inside another slice (e.g. `@/entities/user/model/types` from outside `entities/user`) —
  import `{ User } from '@/entities/user'` instead.
- `shared` has no business logic: it's the HTTP client base (`shared/api`), env-derived config
  (`shared/config`), base UI primitives (`shared/ui`), and generic helpers (`shared/lib`).

## Components and paths

- Vue component files are PascalCase (`RegisterUserPage.vue`, `AppHeader.vue`).
- Use the `@/` alias (-> `src/`) instead of relative `../../..` paths across slices; it's
  configured in both `vite.config.ts` and `tsconfig.app.json`.
- Test-only support code (e.g. `mountWithVuetify`) lives in `test/support/` outside `src`,
  imported as `@test/...`; it is never part of a slice public API, so production code can't
  pull `@vue/test-utils` or test globals into the bundle.

## Configuration

- The backend base URL is read **only** through `shared/config` (`getApiUrl()` in
  `shared/config/apiUrl.ts`), which resolves `VITE_API_URL` lazily on first use and throws a
  descriptive error if it's missing. Never read `import.meta.env.VITE_API_URL` directly outside
  `shared/config`.
- Copy `.env.example` to `.env` and set `VITE_API_URL` before running `dev`/`test`. In
  development, `VITE_API_URL` points at `http://localhost:5112`; the API's CORS policy allows
  requests from `http://localhost:5173` (this app's default `vite dev` origin) only.

## Pages: composing features/entities

A page (`pages/*/ui/*Page.vue`) is a thin composition layer, never business logic itself:

- It binds one feature's stateful composable (`useRegisterUser`/`useInviteReviewer`) to that
  feature's form (`loading`, `fieldErrors` props, `@submit` -> `submit`).
- It renders the composable's `results` as a **results-list**: one `ResultAlert` per
  `ResultAlertEntry`, `v-for`-keyed by the entry's own `id` (never the array index), `closable`,
  `@close="dismiss(entry.id)"`. This list lives in its own labelled region
  (`<section aria-label="Results">`) so assistive tech can find `ResultAlert`'s `role`/`aria-live`
  announcements independently of the surrounding form. See `ResultAlert.vue`'s doc comment for the
  stateless-visibility contract this pattern relies on (the page/composable owns the list; the
  alert never hides or reopens itself).
- After a successful result it composes in the relevant `entities/*/ui` view (e.g.
  `RegisterUserPage` renders `UserSummary` for `lastUser`), passing page-level navigation (e.g. an
  "Invite as reviewer" link, `GlassButton`'s `to` prop) through that view's `actions` slot — pages
  own navigation and cross-feature composition; entities/features never import `vue-router`
  themselves for this.
- A page reads its own route query (`useRoute()`) to prefill a form (e.g.
  `InviteReviewerPage`'s `initialUserId` from `?userId=`), narrowing a possibly-array/`null` query
  value down to a plain string itself before passing it down.
- Exactly one `h1` per page.

## Vue version

- Vue is pinned to `~3.5.43` (latest 3.5.x stable). Never move to a `3.6` release candidate or
  any pre-release tag.

## Tooling commands

Run these from `apps/web` before considering a change done:

```
pnpm build     # vue-tsc -b && vite build — 0 errors
pnpm lint      # eslint . — 0 errors, 0 warnings
pnpm steiger   # steiger ./src — FSD structure check
pnpm test      # vitest run
```

- `steiger.config.ts` relaxes a few rules for scaffolding-only slices (empty `entities`/`features`
  placeholders, the `app/providers` segment name) — see the comments in that file before adding
  more relaxations; each one should disappear once real behavior lands.
- TDD is strict for real behavior: write the failing test first, observe RED, then implement.
  Pure structural/placeholder code doesn't need a test.
