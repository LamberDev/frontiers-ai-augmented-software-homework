import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Updated 2026-09-26 (T8): `entities/user`/`entities/university` are now both
    // referenced by real UI (`RegisterUserPage` renders `UserSummary`, which embeds
    // `UniversityCard`), but `fsd/insignificant-slice` still flags each with "only one
    // reference ... consider merging" — this app has exactly one page presenting a
    // `User`, and `entities/university` is only ever reached through `entities/user`
    // (its `@x` cross-import, see `entities/university/@x/user.ts`), never referenced
    // directly by a widget/page. Kept as a deliberate, permanent relaxation rather than
    // folding these entities into `pages/register-user`: they are a distinct
    // atomic-design level (see the mapping table in `odd/tasks/frontend-ui.md`) with
    // their own model/UI/tests, independent of this app's current page count.
    files: ['./src/entities/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // Updated 2026-09-26 (T8): both feature slices are now wired into their page
    // (`RegisterUserPage`/`InviteReviewerPage`), but `fsd/insignificant-slice` still
    // flags each as "only one reference ... consider merging" because this app has
    // exactly one page per form. Kept as a deliberate, permanent relaxation rather
    // than folding the forms into their pages: `RegisterUserForm`/`InviteReviewerForm`
    // are a distinct atomic-design level (organisms, per the mapping table in
    // `odd/tasks/frontend-ui.md`) with their own `model`/`api` segments and unit tests,
    // independent of how many pages currently render them.
    files: ['./src/features/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // `app/providers` is the conventional FSD app-layer segment for framework/plugin
    // setup (router, store, etc.) and is explicitly required by this project's
    // structure (odd/tasks/monorepo-scaffold.md). `segments-by-purpose` is tuned for
    // business slices; the composition-root `app` layer legitimately names segments
    // after their technical role.
    files: ['./src/app/**'],
    rules: {
      'fsd/segments-by-purpose': 'off',
    },
  },
])
