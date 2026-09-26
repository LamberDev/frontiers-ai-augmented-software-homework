import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Updated 2026-09-26 (T4/T5): `entities/user` and `entities/university` now have
    // real `ui`/`model` segments (RegisterUserForm/InviteReviewerForm consume their
    // types; UserSummary embeds UniversityCard), so the original "pure type
    // placeholder" rationale for this relaxation no longer applies. It stays only
    // because `fsd/insignificant-slice` counts cross-*layer* references, and no
    // widget/page consumes `entities/user`/`entities/university` yet (that lands in T8,
    // page composition) — removing this now would flag both slices as unreferenced.
    // Remove once T8 wires `UserSummary/UniversityCard` into a page.
    files: ['./src/entities/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // Updated 2026-09-26 (T4): the original relaxation for `fsd/no-segmentless-slices`
    // is obsolete — `features/register-user` and `features/invite-reviewer` now have
    // real `ui`/`model` segments (RegisterUserForm/InviteReviewerForm) — and is removed.
    // A new, narrower relaxation replaces it: `fsd/insignificant-slice` still fires for
    // both feature slices because no widget/page consumes their forms yet (that lands
    // in T8, page composition). Remove once T8 wires the forms into a page.
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
