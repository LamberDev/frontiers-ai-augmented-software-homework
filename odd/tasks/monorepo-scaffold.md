# Feature: monorepo-scaffold

## Objective
Create the monorepo skeleton: `apps/api` (.NET 10, Clean + Screaming Architecture) and
`apps/web` (Vue 3.5.x, Feature-Sliced Design), with root tooling files and per-app `AGENTS.md`.

## Why
Foundation for the Frontiers homework (RegisterUser / InviteReviewer). Architecture rules must be
explicit and verifiable before any business code is written.

## Scope
- In: folder structure, solution/projects, central package management, `/health`, test projects,
  Vite + TS + pnpm app, router with placeholder pages, Vitest, ESLint, Steiger, `@/` alias,
  `VITE_API_URL` config, root `.gitignore`/`.editorconfig`/`README.md`, `apps/*/AGENTS.md`.
- Out: domain classes, handlers, forms, API calls, Docker (later features).

## Constraints
- Domain -> nothing; Application -> Domain only (abstractions packages at most); Infrastructure ->
  Application; Api -> Application + Infrastructure (composition root).
- Screaming folders by business capability inside each layer; ports named by business need.
- FSD layers app > pages > widgets > features > entities > shared; public API via `index.ts` only.
- Vue 3.5.x (not 3.6 RC). .NET SDK 10.0.401 installed via winget (user-approved).
- No commit without explicit user consent (overrides ODD auto-commit).

## TDD
- Mode: strict (source: global CLAUDE.md "Strict TDD Mode: enabled").
- Runners: `dotnet test` (xUnit) in apps/api; `pnpm test` (Vitest) in apps/web.
- Note: this feature is pure scaffolding with no business behavior; RED/GREEN applies from the
  first domain/use-case feature. Test projects are created empty and must run.

## Delivery
- Strategy: ask-on-risk. Forecast > 400 authored lines (excluding lockfiles/generated) -> ask chain
  strategy at commit time.

## Tasks
- [x] T1 Root: extend `.gitignore` (.NET + Node), `.editorconfig`, minimal `README.md`
      (`docs/` already exists with `docs/ai/`, no `.gitkeep` needed). Route: delegated (writer T1+T2).
- [x] T2 Backend `apps/api`: slnx, Directory.Build.props, Directory.Packages.props, 4 src projects,
      2 test projects, business folders, empty DependencyInjection.cs, Minimal API `/health`,
      `apps/api/AGENTS.md`. Route: delegated writer (2+ non-trivial files).
- [x] T3 Frontend `apps/web`: Vite + Vue 3.5 + TS + pnpm, router, placeholder pages, FSD slices,
      Vitest, ESLint (Vue + TS official), Steiger, `@/` alias, `VITE_API_URL`,
      `apps/web/AGENTS.md`. Route: delegated writer (2+ non-trivial files).
- [x] T4 Verification report: acceptance criteria 1-5 with real outputs. Route: inline.

## Acceptance criteria / checks
1. `dotnet build` (apps/api): 0 errors, 0 warnings.
2. `dotnet test` (apps/api) runs.
3. Dependency rule: `dotnet list <proj> reference` / `package` per layer as specified; no upward
   `using PeerReview.(Infrastructure|Api)` in Domain/Application.
4. `pnpm build`, `pnpm lint`, `pnpm steiger` (apps/web) pass.
5. Final monorepo tree.

## Progress
- Branch `chore/monorepo-scaffold` created from main (972f5c7).

- T1+T2 done (delegated writer). Evidence: `dotnet build` 0 warnings/0 errors (re-run by parent);
  `dotnet test` exit 0 (no tests yet); references/packages match the rule; no upward usings;
  `/health` -> 200 Healthy. Packages: DI.Abstractions 10.0.12, Microsoft.NET.Test.Sdk 17.14.1,
  xunit 2.9.3, xunit.runner.visualstudio 3.1.4, coverlet.collector 6.0.4.
- Decision: `apps/api/NuGet.Config` clears sources and uses nuget.org only, because a machine-global
  private feed returned NU1301 401 and broke restore; keeps builds reproducible.

- T3 done (delegated writer). TDD evidence: RED `Failed to resolve import "./apiUrl"` -> GREEN 2 tests
  passed (shared/config apiUrl). Steiger rules relaxed during scaffolding (scoped, commented):
  `fsd/insignificant-slice` (entities), `fsd/no-segmentless-slices` (features),
  `fsd/segments-by-purpose` (app). TypeScript pinned ~6.0.3 (typescript-eslint peer < 6.1.0).
  Versions: vue 3.5.43, vue-router 5.3.1, vite 8.3.1, vitest 5.0.1, eslint 10.11.0, steiger 0.6.0.
- Limitation: `apps/web/.env.example` not created; a Claude Code permission rule blocks dotenv files.
- T4 done (parent re-ran all checks): dotnet build 0/0; dotnet test exit 0 (no tests); references and
  packages match the rule; upward-using grep empty; pnpm build/lint/steiger/test exit 0; vue 3.5.43.
- Authored lines ~860 (excluding pnpm-lock.yaml) > 400 budget -> ask chain strategy before commit.
- RDD: per-commit assessment pending (no commit yet; commits need user consent).

- Commits (user-approved): T1 `a44ba8b` chore: add root tooling files; T2 `d7bfff1` feat(api);
  T3 feat(web) is the commit that includes this document.
- Convention: no `.env` file mentions inside source code (user request).

## Next step
User: PR strategy (single PR vs chained); create `apps/web/.env.example` manually.
