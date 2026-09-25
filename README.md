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

- .NET SDK 10
- Node 22
- pnpm 9

## Git hooks

Pre-commit hooks are managed by [Lefthook](https://lefthook.dev) and installed automatically by
running `pnpm install` at the repository root (the root `package.json` holds repository tooling
only). Outside a git repository (or with `LEFTHOOK=0`) it skips hook installation instead of
failing. The root install does not install app dependencies: the web checks also need
`pnpm install` in `apps/web`, and the api check needs the .NET SDK.

On each commit, only the staged files of each app are checked, in parallel:

- `apps/web`: `eslint --fix` then `prettier --write` (`*.{ts,vue,js}`); `prettier --write` for
  `*.{css,json,md}`. Unfixable ESLint errors fail the commit.
- `apps/api`: `dotnet format whitespace --folder` on the staged `*.cs` files, using the rules in
  the root `.editorconfig`. Code style (`dotnet format style`) is left out of the hook to keep
  it fast; it will be validated in CI (not implemented yet; until then run
  `dotnet format style PeerReview.slnx` in `apps/api` manually).

Fixed files are re-staged automatically. Configuration lives in `lefthook.yml`.
`.gitattributes` normalizes line endings to LF so formatters do not report false changes on
checkouts with `core.autocrlf=true`.

Build and run instructions will be added as the apps are implemented.
