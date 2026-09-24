import fsd from '@feature-sliced/steiger-plugin'
import { defineConfig } from 'steiger'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Scaffolding-only relaxation: `entities/user` and `entities/university` are pure
    // type placeholders (see apps/web/AGENTS.md) with no consumers yet, because this
    // task ships structure only, no business/form code (out of scope per
    // odd/tasks/monorepo-scaffold.md). They gain real references once the
    // RegisterUser/InviteReviewer features consume them.
    files: ['./src/entities/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // Scaffolding-only relaxation: `features/register-user` and
    // `features/invite-reviewer` intentionally have no segments yet (no forms, no API
    // calls in this task). They will gain a `ui`/`model` segment once that behavior is
    // implemented; adding an empty placeholder segment now would just be fake code.
    files: ['./src/features/**'],
    rules: {
      'fsd/no-segmentless-slices': 'off',
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
