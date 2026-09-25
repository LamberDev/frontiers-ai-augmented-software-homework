# Feature: ci-workflow

## Objective
GitHub Actions workflow (`.github/workflows/ci.yml`) that re-runs, in verify-only mode, every
check of the pre-commit hook plus the checks left out of it for speed (`dotnet format style`,
build, tests, Steiger, web build). Closes T5 of `odd/tasks/git-hooks-linting.md`.

## Why
The pre-commit hook can be skipped locally (`--no-verify`, `LEFTHOOK=0`); CI cannot. CI is the
definitive quality gate, the hook only gives fast local feedback.

## Scope
- In: `.github/workflows/ci.yml` (jobs `changes`, `api`, `web`, `ci-success`),
  `apps/api/global.json`, `apps/web/.nvmrc`, `packageManager` in `apps/web/package.json`,
  README "Continuous integration" section, closing T5 in `git-hooks-linting.md`.
- Out: branch protection settings (done by the user in GitHub), push, deployment.

## Constraints
- Triggers: `pull_request` to `main`, `push` to `main`. `concurrency` per branch;
  `cancel-in-progress` only on `pull_request` (every push to `main` is verified). Workflow
  `permissions: contents: read`.
- Latest major of each official action, verified with `gh api repos/<r>/releases/latest`
  (2026-09-25): `actions/checkout@v7`, `actions/setup-dotnet@v6`, `actions/setup-node@v7`,
  `pnpm/action-setup@v6`, `actions/cache@v6`, `actions/upload-artifact@v7`;
  `dorny/paths-filter` v4.0.3 pinned by commit SHA (third-party).
- Commit only on branch `chore/ci-workflow` with the message given by the user; no push.

## TDD
- Mode: strict (source: global CLAUDE.md). This feature is CI configuration with no application
  behaviour; verification is `actionlint` plus running every job command locally exactly as in
  the workflow (observed), not unit tests.

## Delivery
- Branch `chore/ci-workflow` from main (ab20e08). Strategy: ask-on-risk (forecast < 400 authored
  lines).

## Decisions
- Change detection with `dorny/paths-filter`: native `on.paths` would skip the whole workflow,
  and a skipped-by-trigger workflow leaves required checks pending forever; paths-filter works
  both on `pull_request` (PR file list via API, needs `pull-requests: read` on that job only)
  and on `push` (git diff against the previous commit), exposes one boolean output per filter,
  and supports YAML anchors so the shared files are declared once.
- `ci-success` also needs `changes`: if `changes` fails, `api` and `web` are skipped, and
  "skipped" alone would make `ci-success` pass.
- `ci-success` uses an allowlist: only `success` and `skipped` pass; any other result
  (`failure`, `cancelled`, empty or unexpected) fails, so the required check fails closed.
- Cancellation only on pull requests: cancelling on `main` would leave an earlier merge commit
  unverified with a red `ci-success` when two PRs merge in quick succession.
- `persist-credentials: false` on every checkout: no job needs git credentials after checkout,
  so the token is not left in the git config for dependency install scripts.
- Web install runs in `apps/web`: it has its own `pnpm-lock.yaml` and there is no
  `pnpm-workspace.yaml`; the root `package.json`/lockfile only hold Lefthook (tooling). `LEFTHOOK: 0`
  is kept as requested (defensive; the `apps/web` install does not run the root `prepare`).
- NuGet cache with `actions/cache` (key: hash of `Directory.Packages.props` + `*.csproj`):
  `setup-dotnet`'s `cache: true` requires `packages.lock.json`, which the repo does not use.
- pnpm stays at 9.12.3 (same as root `packageManager` and lockfile v9.0).
- Node LTS: `.nvmrc` = `24` (Krypton, current Active LTS; 26 is not LTS yet on 2026-09-25).

## Tasks
- [x] T1 Config files: `apps/api/global.json`, `apps/web/.nvmrc`, `packageManager` in
      `apps/web/package.json`. Route: inline (mechanical).
- [x] T2 Workflow `.github/workflows/ci.yml`. Route: inline (single file, design understood).
- [x] T3 README "Continuous integration"; close T5 in `git-hooks-linting.md`. Route: inline (docs).
- [x] T4 Verification: `actionlint`, every job command locally, `ci-success` truth table.
      Route: inline.
- [x] T5 Commit `ci: add github actions workflow for api and web` on `chore/ci-workflow`
      (no push). Route: inline.

## Acceptance criteria / checks
1. `actionlint` passes with no errors.
2. All `api` and `web` job commands pass locally, same flags and directory.
3. `ci-success` outcome explained for: only web changed, only api changed, api fails, both skipped.
4. T5 closed in `git-hooks-linting.md`; progress recorded here.
5. Commit on `chore/ci-workflow`, `git log -1 --stat` shown, no push.

## Progress
- Branch created; action versions and Node LTS verified.
- T1-T3 written. README also updated: prerequisites now point to the pinned versions and the
  "Git hooks" section no longer says CI is pending.
- T4 evidence (2026-09-25):
  - `actionlint` 1.7.12 with shellcheck 0.11.0: 0 errors.
  - api (`apps/api`, SDK 10.0.401 resolved by `global.json`): restore, whitespace verify,
    style verify, Release build (0 warnings, 0 errors), test with TRX: all exit 0. The test
    projects contain no tests yet ("No test is available"), so `dotnet test` passes empty.
  - web (`apps/web`, `LEFTHOOK=0`, `CI=true`): install, lint, format:check, steiger, test
    (2 passed), build: all exit 0. Local Node is 22.14, not the 24 pinned in `.nvmrc`; the
    first CI run is the first execution on Node 24.
  - `ci-success` script simulated: web only PASS, api only PASS, api failure FAIL, both skipped
    PASS, cancelled FAIL, `changes` failure FAIL.
- T5 commit `cbe987c` on `chore/ci-workflow`. Native review (4 lenses) approved with
  non-blocking suggestions.
- Follow-up commit `b9f93a1` (by the user) applying the review suggestions: PR-only
  cancellation, `persist-credentials: false`, `ci-success` allowlist. `actionlint` 0 errors;
  `ci-success` re-simulated: web only PASS, api only PASS, api failure FAIL, both skipped PASS,
  cancelled FAIL, `changes` failure FAIL, empty result FAIL. Native review declined by the user
  for this commit.
- Docs updated to match the workflow (this file, README). No push.

## Next step
User pushes the branch and opens the PR to see the first real run, then marks `CI success` as
the only required check in the `main` branch protection.
