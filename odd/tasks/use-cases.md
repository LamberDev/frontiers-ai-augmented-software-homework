# Feature: use-cases

## Objective
Complete the backend of the homework: `RegisterUser` and `InviteReviewer` use cases, the Frontiers
organizations adapter, HTTP endpoints with a documented contract, Docker for the API and the
README build/run and submission notes.

## Why
`main` (1f93e15) has the domain, persistence ports and EF Core InMemory, but `Program.cs` only
serves `/health`. The brief requires both APIs, the Frontiers lookup, Docker and a README; the
frontend (`odd/tasks/frontend-ui.md`) is blocked on the API contract.

## Scope
- In: `PeerReview.Application` `Users/RegisterUser`, `Reviewers/InviteReviewer`, the
  `IUniversityDirectory` port; `PeerReview.Infrastructure` `Universities/FrontiersOrganizations`
  adapter; `PeerReview.Api` endpoints, error mapping, OpenAPI, CORS; tests in
  `PeerReview.Application.UnitTests`, `PeerReview.Infrastructure.IntegrationTests` and a new
  `PeerReview.Api.IntegrationTests`; API `Dockerfile` and `docker-compose.yml`; README;
  `apps/api/AGENTS.md` updates.
- Out: frontend code and the web Docker image (feature `frontend-ui`), real database, auth.

## Constraints and decisions
- Contract ids (user decision, 2026-09-25): the HTTP contract exposes the domain `Guid` (v7) as
  `userId`. Deliberate deviation from the brief's `InviteReviewer(int UserId)`, documented in the
  README (ids not enumerable, no user-count leak, known before persisting).
- Contract and domain stay separate types: API request/response records live in `PeerReview.Api`;
  handlers return Application results, never domain entities over HTTP.
- Frontiers lookup: `GET https://organizations-api.frontiersin.org/api/organizations/elasticsuggest?query=<UniversityName>&maxcount=1`
  (exact path to be confirmed from the swagger in T2). Empty `organizationName` is rejected
  (never falls back to `matchedName`); no result is a NotFound error; transport/HTTP failures are
  a `Failure` error.
- University get-or-create by `FrontiersOrganizationId` in the `RegisterUser` handler (InMemory
  does not enforce the unique index). Score snapshot kept at first registration.
- Ineligibility is a successful outcome: `InviteReviewer` returns `invited: false` with the
  reasons and a user-friendly message; unknown user is NotFound.
- Handlers are plain classes registered in `AddApplication()` (no mediator package; Application
  may only use `Microsoft.Extensions.DependencyInjection.Abstractions`). Tests use hand-written
  fakes, no mocking package.
- Result -> HTTP: Validation 400 (ValidationProblem), NotFound 404, Conflict 409, Failure 502 when
  the university directory fails, otherwise 500.
- Commits only with the user's explicit consent (overrides ODD auto-commits); no push.

## TDD
- Mode: strict (source: global CLAUDE.md). Runner: xUnit via `dotnet test PeerReview.slnx -c Release`
  from `apps/api`. Observe RED before each behavior; interfaces/records without behavior need none.

## Delivery
- Branch `feat/use-cases` from `origin/main` (1f93e15), worktree
  `../frontiers-ai-augmented-software-homework-worktrees/use-cases` (no upstream set).
- Strategy: ask-on-risk. Forecast ~1200 authored lines (> 400). Chain strategy (user choice,
  2026-09-25): `stacked-to-main`, one PR per work unit stacked on the previous one, all targeting
  `main`. Slice boundaries are the task commits; recorded here as PRs are opened. Running count: ~462 (T1, uncommitted).

## Tasks
- [x] T1 `RegisterUser` use case (Application): `IUniversityDirectory` port and its lookup result,
  `RegisterUserCommand`, `RegisterUserHandler` (lookup, get-or-create university, create user,
  save), `RegisteredUser` result, errors; handler tests with fakes; register in `AddApplication()`.
  Route: delegated (writer trigger, 2+ non-trivial files).
  - Evidence: RED with `dotnet test PeerReview.slnx -c Release`: 9 new tests failed, all
    `System.NotImplementedException` from `RegisterUserHandler.HandleAsync` (e.g.
    `HandleAsync_WithNewUniversity_CreatesUniversityAndUserAndSavesOnce`,
    `HandleAsync_WithBlankUniversityName_ReturnsValidationErrorWithoutCallingDirectory`). GREEN:
    80 passed / 0 failed (62 Domain + 9 Application + 9 Infrastructure), re-run by the parent.
    `dotnet format` whitespace/style clean, build 0 warnings / 0 errors, dependency rule OK.
  - Port and errors live in `Application/Universities/` (`IUniversityDirectory`,
    `UniversityDirectoryEntry`, `UniversityDirectoryErrors.NotFound|Unavailable`). Blank university
    name is rejected before calling the directory (`RegisterUser.UniversityNameRequired`).
  - DI resolution test skipped: it needs the concrete `Microsoft.Extensions.DependencyInjection`
    package in the Application test project; covered later by the Api integration tests (T4).
  - Commit (user consented): `feat(application): add RegisterUser use case`. ~462 authored lines.
- [ ] T2 Frontiers adapter (Infrastructure): typed `HttpClient` (base URL + timeout via options),
  response DTO, anti-corruption mapping to the port result, NotFound/Failure handling; tests with a
  fake `HttpMessageHandler`; register in `AddInfrastructure()`.
- [ ] T3 `InviteReviewer` use case (Application): `InviteReviewerCommand(Guid UserId)`, handler
  loading the user with university, applying `ReviewerEligibilityPolicy`, returning invited flag,
  message and reasons; NotFound for unknown user; tests with fakes.
- [ ] T4 Endpoints and contract (Api): `POST /api/users` and `POST /api/reviewers/invitations`,
  request/response records, Result -> HTTP mapping, OpenAPI, CORS for the web origin from
  configuration; new `PeerReview.Api.IntegrationTests` with `WebApplicationFactory` and a fake
  `IUniversityDirectory`; contract documented in `apps/api/AGENTS.md`.
- [ ] T5 Docker: multi-stage `apps/api/Dockerfile`, `.dockerignore`, root `docker-compose.yml`
  with the api service (web service added by `frontend-ui`); verify `docker build` and `/health`.
- [ ] T6 README: build/run (local and Docker), API contract summary, deviations (Guid ids, null
  score not eligible, score semantics), LLM used and why, link to `docs/ai/conversations`.

## Acceptance criteria / checks (from `apps/api`)
- `dotnet format whitespace|style PeerReview.slnx --verify-no-changes` clean.
- `dotnet build PeerReview.slnx -c Release`: 0 errors, 0 warnings.
- `dotnet test PeerReview.slnx -c Release`: all green.
- Dependency rule per `apps/api/AGENTS.md` (`dotnet list ... reference`, no Infrastructure/Api/EF
  usings in Domain/Application).

## Progress
- T1 done and committed. Next: T2 (Frontiers adapter).
