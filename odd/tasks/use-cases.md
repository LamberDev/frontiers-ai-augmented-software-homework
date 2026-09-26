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
- Frontiers lookup: `GET https://organizations-api.frontiersin.org/v1/organizations/elasticSuggestions?query=<UniversityName>&maxcount=1`
  (operation `Organization_ElasticSuggest`, verified from `swagger/docs/1.0` on 2026-09-25). The
  search is fuzzy: a nonsense query still returns a (low-score) match, e.g.
  `zzqqxxnotauniversity` -> "University Hospital Frankfurt", score 3.74; "Harvard University"
  -> id 1327079645, score 94.36. Only an empty array means not found. Empty `organizationName` is rejected
  (never falls back to `matchedName`); no result is a NotFound error; transport/HTTP failures are
  a `Failure` error.
- University get-or-create by `FrontiersOrganizationId` in the `RegisterUser` handler (InMemory
  does not enforce the unique index). Score snapshot kept at first registration.
- Ineligibility is a successful outcome: `InviteReviewer` returns `invited: false` with the
  reasons and a user-friendly message; unknown user is NotFound.
- Handlers are plain classes registered in `AddApplication()` (no mediator package; Application
  may only use `Microsoft.Extensions.DependencyInjection.Abstractions`). Tests use hand-written
  fakes, no mocking package.
- HTTP contract (user approved, 2026-09-26):
  - `POST /api/users` body `{ userName, universityName, numberOfPublications }` -> 201
    `{ userId, userName, numberOfPublications, university: { id, frontiersOrganizationId, name, score } }`;
    400 ValidationProblem (errors per field); 404 university not found in Frontiers; 502 Frontiers
    unavailable or invalid entry.
  - `POST /api/reviewers/invitations` body `{ userId }` (Guid) -> 200
    `{ userId, invited, message, reasons: [ { code, message } ] }` (`invited: false` is also 200);
    400 ValidationProblem (empty or non-Guid `userId`); 404 user not found.
  - Errors as RFC 9457 ProblemDetails; OpenAPI at `/openapi/v1.json`; CORS for the frontend origin
    from configuration.
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
  `main`. Slice boundaries are the task commits; recorded here as PRs are opened. Running count: ~462 (T1) + ~87 (T1b) + ~380 (T2).

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
  - Commit (user consented): `56c2d5d` feat(application): add RegisterUser use case. ~462
    authored lines.
  - RDD: assessed medium (`slice_budget_reached`), consent granted, one lens
    (`review-reliability`), approved and acknowledged (lineage `review-ade2cb71ed61cbba`, authority
    burned). Reviewed boundary advances to `56c2d5d`. Advisory findings (non-blocking):
    university staged before user validation (WARNING), get-or-create race (WARNING), invalid
    directory data reported as client Validation instead of upstream failure (WARNING), queried
    name not asserted (SUGGESTION), user add not asserted on the reuse path (SUGGESTION).
- [x] T1b T1 review follow-ups (user accepted, 2026-09-25). Route: delegated (writer, 3 files).
  - Evidence: RED with `dotnet test PeerReview.slnx -c Release`: 2 failed / 8 passed in
    Application — `HandleAsync_WithNewUniversityAndInvalidUser_StagesNothingAndDoesNotSave`
    (`Assert.Empty()` on the university adds: the university was staged) and
    `HandleAsync_WhenDirectoryReturnsInvalidUniversityData_ReturnsInvalidEntryFailureAndSavesNothing`
    (expected `UniversityDirectory.InvalidEntry`, got `Validation.Failed`). Query-name and
    reuse-path assertions passed immediately (test strengthening). GREEN: 81 passed / 0 failed
    (62 + 10 + 9), re-run by the parent. Format clean, build 0 warnings / 0 errors, dependency
    rule OK. No new domain type: the rule is the handler's build-then-stage order.
  - Commit (user consented): `1c47f76`. RDD assess (base `56c2d5d`): medium, `review_due=false`,
    `under_budget` (97 lines): pending in the slice until a later commit reaches the budget.
  - R3 university-before-user: business rule "a new university is only staged together with a
    valid user". Build and validate the `University` and the `User` first, then add both;
    nothing is added to any repository when any validation fails. Test the new-university path
    with an invalid user (no add, no save).
  - R3 upstream-invalid-data: invalid directory data (e.g. empty name) is an upstream failure,
    not client validation: new `UniversityDirectoryErrors.InvalidEntry` (`ErrorType.Failure`,
    maps to 502).
  - R3 query-name: assert the directory is queried with the command's `UniversityName`.
  - R3 reuse-path: assert exactly one user added and `UserId` matches the persisted user.
  - R3 get-or-create race: accepted limitation (single-instance InMemory), documented in T6.
- [x] T2 Frontiers adapter (Infrastructure): typed `HttpClient` (base URL + timeout via options),
  response DTO, anti-corruption mapping to the port result, NotFound/Failure handling; tests with a
  fake `HttpMessageHandler`; register in `AddInfrastructure()`. Route: delegated (writer, 2+ files).
  - Evidence: RED with `dotnet test PeerReview.slnx -c Release`: Infrastructure 11 failed / 10
    passed, the 11 new adapter tests failing with `System.NotImplementedException` from
    `FrontiersUniversityDirectory.FindByNameAsync`. GREEN: 93 passed / 0 failed (62 + 10 + 21),
    re-run by the parent. Format clean, build 0 warnings / 0 errors, dependency rule OK.
  - `AddInfrastructure(IConfiguration)` now binds `FrontiersOrganizations` (`BaseAddress`,
    `Timeout` 10 s) from `appsettings.json`; `Program.cs` updated. Packages (10.0.12):
    `Microsoft.Extensions.Http`, `Microsoft.Extensions.Options.ConfigurationExtensions`
    (Infrastructure), `Microsoft.Extensions.Configuration` (integration tests only).
  - Parent correction: the writer's DI test read the private `_httpClient` field by reflection;
    replaced by a behavioral test that swaps the primary handler for a fake and asserts the
    request goes to the configured base address (test strengthening, passed immediately).
  - Commit (user consented): `9d4c79a`. RDD: assess (base `56c2d5d`, slice T1b+T2) medium,
    `slice_budget_reached` (502 lines); consent granted; one lens (`review-reliability`);
    approved and acknowledged (lineage `review-d20d9d803901729f`, authority burned). Reviewed
    boundary advances to `9d4c79a`. Advisory findings (non-blocking): null first array element
    throws `NullReferenceException` instead of `InvalidEntry` (WARNING); options not validated
    (bad `BaseAddress`/`Timeout` fail lazily on first request; a base address without trailing
    slash drops its last segment) (WARNING); configured `Timeout` not asserted (SUGGESTION).
- [x] T2b T2 review follow-ups (user accepted, 2026-09-26), after T3. Route: delegated (writer).
  - Evidence: RED with `dotnet test PeerReview.slnx -c Release`: Infrastructure 7 failed / 22
    passed — null first element (`NullReferenceException`), the 5 options-validation cases (no
    exception thrown) and the trailing-slash test (request lost the `api-prefix` segment). The
    configured-timeout test passed immediately (timeout was already wired; test only). GREEN:
    108 passed / 0 failed (62 + 17 + 29), re-run by the parent. Format clean, build 0 warnings /
    0 errors, dependency rule OK. Validation rules are tested through
    `IOptions<FrontiersOrganizationsOptions>.Value`; `ValidateOnStart()` enforces them at host
    startup.
  - R3 null-suggestion-element: a null first array element maps to `InvalidEntry` (test).
  - R3 unvalidated-client-options: validate `FrontiersOrganizationsOptions` at startup
    (`ValidateOnStart`: absolute http(s) `BaseAddress`, `Timeout` > 0); normalize a missing
    trailing slash on `BaseAddress` (tests).
  - R3 timeout-binding: assert the configured `Timeout` reaches the typed client (test).
- [x] T3 `InviteReviewer` use case (Application): `InviteReviewerCommand(Guid UserId)`, handler
  loading the user with university, applying `ReviewerEligibilityPolicy`, returning invited flag,
  message and reasons; NotFound for unknown user; tests with fakes. Route: delegated (writer).
  - Evidence: RED with `dotnet test PeerReview.slnx -c Release`: Application 7 failed / 10
    passed, the 7 new tests failing with `System.NotImplementedException` from
    `InviteReviewerHandler.HandleAsync`. GREEN: 100 passed / 0 failed (62 + 17 + 21), re-run by
    the parent. Format clean, build 0 warnings / 0 errors, dependency rule OK.
  - `ReviewerInvitation(UserId, Invited, Message, Reasons)`; `Guid.Empty` ->
    `Reviewer.UserIdRequired` (Validation, repository not called); unknown user ->
    `Reviewer.UserNotFound` (NotFound); read-only, no save.
- [ ] T4 Endpoints and contract (Api): `POST /api/users` and `POST /api/reviewers/invitations`,
  request/response records, Result -> HTTP mapping, OpenAPI, CORS for the web origin from
  configuration; new `PeerReview.Api.IntegrationTests` with `WebApplicationFactory` and a fake
  `IUniversityDirectory`; contract documented in `apps/api/AGENTS.md`.
- [ ] T5 Docker: multi-stage `apps/api/Dockerfile`, `.dockerignore`, root `docker-compose.yml`
  with the api service (web service added by `frontend-ui`); verify `docker build` and `/health`.
- [ ] T6 README: build/run (local and Docker), API contract summary, deviations (Guid ids, null
  score not eligible, score semantics), known limitation (university get-or-create race under
  concurrent registrations, no unique index in InMemory), LLM used and why, link to `docs/ai/conversations`.

## Acceptance criteria / checks (from `apps/api`)
- `dotnet format whitespace|style PeerReview.slnx --verify-no-changes` clean.
- `dotnet build PeerReview.slnx -c Release`: 0 errors, 0 warnings.
- `dotnet test PeerReview.slnx -c Release`: all green.
- Dependency rule per `apps/api/AGENTS.md` (`dotnet list ... reference`, no Infrastructure/Api/EF
  usings in Domain/Application).

## Progress
- T1 done, committed and reviewed (approved). T1b committed (`1c47f76`). T2 committed (`9d4c79a`),
  reviewed (approved). T3 committed (`48b61d9`; RDD
  assess base `9d4c79a`: medium, `under_budget`, 258 lines, pending in the slice). T2b done
  (commit pending user consent). Next: T4.
