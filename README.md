# Frontiers AI-Augmented Software Homework

Frontiers homework: a small peer-review workflow (`RegisterUser`, `InviteReviewer`) built with
explicit, verifiable architecture.

## Repository layout

- `apps/api` — backend (.NET 10, Clean Architecture + Screaming Architecture). See
  [`apps/api/AGENTS.md`](apps/api/AGENTS.md).
- `apps/web` — frontend (Vue 3.5, Feature-Sliced Design). See
  [`apps/web/AGENTS.md`](apps/web/AGENTS.md).
- `docs/ai` — AI collaboration artifacts (conversations, harness, instructions). See
  [`docs/ai/README.md`](docs/ai/README.md).

## Prerequisites

- .NET SDK 10 (pinned in `apps/api/global.json`)
- Node 24 LTS (pinned in `apps/web/.nvmrc`)
- pnpm 9 (pinned in the `packageManager` field of `package.json`)

## Git hooks

Pre-commit hooks are managed by [Lefthook](https://lefthook.dev) and installed automatically by
running `pnpm install` at the repository root (the root `package.json` holds repository tooling
only). Outside a git repository, without git installed, or with `LEFTHOOK=0` it skips hook
installation instead of failing; other git errors still fail the install. The root install does not install app dependencies: the web checks also need
`pnpm install` in `apps/web`, and the api check needs the .NET SDK.

On each commit, only the staged files of each app are checked, in parallel:

- `apps/web`: `eslint --fix` then `prettier --write` (`*.{ts,vue,js}`); `prettier --write` for
  `*.{css,json,md}`. Unfixable ESLint errors fail the commit.
- `apps/api`: `dotnet format whitespace --folder` on the staged `*.cs` files, using the rules in
  the root `.editorconfig`. Code style (`dotnet format style`) is left out of the hook to keep
  it fast; CI validates it (see [Continuous integration](#continuous-integration)).

Fixed files are re-staged automatically. Configuration lives in `lefthook.yml`.
`.gitattributes` normalizes line endings to LF so formatters do not report false changes on
checkouts with `core.autocrlf=true`.

## Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request to `main` and every push
to `main`. All checks run in verify-only mode; nothing is rewritten.

- `apps/api`: restore, `dotnet format whitespace` and `dotnet format style` with
  `--verify-no-changes`, Release build (analyzers as errors), tests (TRX results uploaded as the
  `api-test-results` artifact, even when tests fail).
- `apps/web`: `pnpm install --frozen-lockfile`, ESLint, `prettier --check`, Steiger, Vitest
  (single run) and the production build.

A `changes` job runs each app job only when its app, or a shared file (`.editorconfig`,
`.gitattributes`, `.github/workflows/**`), changed; both app jobs run in parallel.
`ci-success` is the only required status check in branch protection: it passes when the app
jobs succeed or are skipped by the path filter, and fails if any job failed or was cancelled.

The pre-commit hook gives fast local feedback on staged files, but it can be skipped
(`--no-verify`, `LEFTHOOK=0`); CI is the definitive validation and also runs the checks that
are too slow for the hook.

Build and run instructions will be added as the apps are implemented.
