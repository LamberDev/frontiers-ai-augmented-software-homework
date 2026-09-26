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

## Authority
- From 2026-09-26 the user authorizes commits, push, granting Gentle AI reviews and opening PRs
  without asking each time; merges still need an explicit yes.
- 2026-09-26: the user said yes to merging PRs #14-#20 in order, with merge commits (as earlier
  PRs), after T4d is pushed to #20. Each PR is merged only after it targets `main` and its CI
  (`ci-success`) passes.

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
  - Commit (user consented): `3f6b01d`. RDD: assess (base `9d4c79a`, slice T3+T2b) medium,
    `slice_budget_reached` (440 lines); consent granted; one lens (`review-reliability`);
    approved and acknowledged (lineage `review-a94f56a196235155`, authority burned). Reviewed
    boundary advances to `3f6b01d`. Advisory findings (non-blocking): invalid-Timeout theory does
    not assert which rule failed (WARNING; mitigated because the default `BaseAddress` is valid,
    but the message is not asserted); Timeout upper bound (> `int.MaxValue` ms) and
    `InfiniteTimeSpan` not aligned with `HttpClient` (SUGGESTION); `ValidateOnStart` not proved
    by a host-level test (SUGGESTION); trailing-slash append breaks a base address with a query or
    fragment (SUGGESTION).
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
- [x] T4 Endpoints and contract (Api): `POST /api/users` and `POST /api/reviewers/invitations`,
  request/response records, Result -> HTTP mapping, OpenAPI, CORS for the web origin from
  configuration; new `PeerReview.Api.IntegrationTests` with `WebApplicationFactory` and a fake
  `IUniversityDirectory`; contract documented in `apps/api/AGENTS.md`. Route: delegated (writer).
  - Evidence: RED with stub endpoints returning 501: Api tests 17 failed / 6 passed (status
    code mismatches, `NotImplemented`). GREEN: 131 passed / 0 failed (62 + 17 + 29 + 23),
    re-run by the parent. Format clean, build 0 warnings / 0 errors, references OK (Api ->
    Application + Infrastructure; Api tests -> Api only). Smoke run against the real Frontiers
    API: `/health` 200, `/openapi/v1.json` 200 with both paths, `POST /api/users` (Ada Lovelace,
    Harvard University, 5) 201 with Frontiers id 1327079645 and score 94.36,
    `POST /api/reviewers/invitations` with the returned id 200 `invited: true`.
  - Mapping in `Api/SharedKernel/Http/ResultHttpExtensions.cs`; ProblemDetails with a `code`
    extension; OpenAPI in all environments; CORS policy from `Cors:AllowedOrigins`
    (Development: `http://localhost:5173`), POST + `Content-Type` only. Packages (10.0.12):
    `Microsoft.AspNetCore.OpenApi`, `Microsoft.AspNetCore.Mvc.Testing`. CI unchanged (it runs the
    whole solution). The deferred T1 DI test is covered here.
  - Parent correction (user convention: lookup maps over `switch`): replaced the `ErrorType`
    switch expression with a `StatusCodeByErrorType` map; the 502 override applies only to
    `UniversityDirectory.*` failures (a first version also turned `UniversityDirectory.NotFound`
    into 502 and the existing 404 test caught it).
  - ~868 authored lines (tests are about half); larger than the 400 heuristic because the
    contract, mapping and its integration tests form one coherent unit.
  - Commit (user consented): `ac915bf`. RDD: assess (base `3f6b01d`) medium,
    `slice_budget_reached` (910 lines); consent granted; one lens (`review-reliability`);
    approved and acknowledged (lineage `review-192ee494216db89d`, authority burned). Reviewed
    boundary advances to `ac915bf`. Advisory findings (non-blocking): malformed body on
    `POST /api/users` likely becomes 500 (the exception handler swallows
    `BadHttpRequestException`) instead of the documented 400 (WARNING); missing
    `numberOfPublications` binds to 0 and registers instead of 400 (WARNING); generic 500 handler
    untested (SUGGESTION); Conflict 409 and non-directory Failure 500 mappings untested
    (SUGGESTION).
- [x] T2c T2b review follow-ups (user accepted, 2026-09-26). Route: delegated (writer).
  - Evidence: RED with `dotnet test tests/PeerReview.Infrastructure.IntegrationTests -c Release`:
    6 failed / 27 passed (message assertions, query/fragment and oversized-timeout cases). GREEN:
    136 passed / 0 failed (62 + 17 + 33 + 24), re-run by the parent. Startup test meaningfulness:
    with `.ValidateOnStart()` commented out it failed ("No exception was thrown"); restored, it
    passes. Format clean, build 0 warnings / 0 errors.
  - Parent correction: shortened the two new validation messages to one short sentence each (repo
    message convention); the rationale stays in code comments.
  - Options tests set a valid counterpart value and assert the failing rule's message.
  - `Timeout` rule matches `HttpClient`: > 0 and <= `int.MaxValue` ms (`InfiniteTimeSpan` stays
    rejected: an unbounded upstream call makes no sense here).
  - Host-level test in `PeerReview.Api.IntegrationTests`: invalid `FrontiersOrganizations`
    configuration makes startup fail (`ValidateOnStart`).
  - `BaseAddress` with a query or fragment is rejected by validation.
- [x] T4b T4 review follow-ups (user accepted, 2026-09-26). Route: delegated (writer).
  - Evidence: RED with `dotnet test tests/PeerReview.Api.IntegrationTests -c Release`: 4 failed /
    29 passed — malformed JSON and wrong JSON type on `/api/users` got 500, missing
    `numberOfPublications` got 201 (bound to 0), null `numberOfPublications` got 500. Invitations
    body cases, the generic 500 test and the 409/500 mapping unit tests passed immediately
    (behavior already correct; tests only). GREEN: 145 passed / 0 failed (62 + 17 + 33 + 33),
    re-run by the parent. Format clean, build 0 warnings / 0 errors. Smoke: malformed body 400 on
    both endpoints, missing `numberOfPublications` 400 keyed by the field.
  - Parent correction: the two new problems lacked the contract's `code` extension; added
    `Request.InvalidBody` / `Server.UnexpectedError` (exception handler) and
    `RegisterUser.NumberOfPublicationsRequired`, asserted in tests (RED observed by removing the
    extension: `KeyNotFoundException` on `code`), documented in `apps/api/AGENTS.md`.
  - Commit (user consented): `c4db629`. RDD: assess (base `ac915bf`, slice T2c+T4b) medium,
    `slice_budget_reached` (477 lines); consent granted; one lens (`review-reliability`);
    approved and acknowledged (lineage `review-46bb351ad1bd1b1e`, authority burned). Reviewed
    boundary advances to `c4db629`. Advisory findings (non-blocking): exact-type lookup misses
    `BadHttpRequestException` subclasses and rewrites the framework's own status (413/415) to 400
    (WARNING); the 400 body-binding contract relies on `ThrowOnBadRequest`, which is only on by
    default in Development, and the tests run in Development only (WARNING); `Server.UnexpectedError`
    and the wrong-type `Request.InvalidBody` codes are not asserted (SUGGESTION).
  - Malformed or non-JSON body returns 400 ProblemDetails (not 500) on both endpoints.
  - Missing or null `numberOfPublications` returns 400 keyed by `numberOfPublications`.
  - Generic 500 handler tested: status, ProblemDetails shape, no exception details leaked.
  - Result -> HTTP mapping tests for Conflict 409 and non-directory Failure 500.
- [x] T4c T4b review follow-ups (user accepted, 2026-09-26). Route: delegated (writer).
  - Evidence: RED with `dotnet test tests/PeerReview.Api.IntegrationTests -c Release`: 4 failed /
    36 passed — 413/415/422 exceptions rewritten to 400, and the Production malformed-body test got
    an empty body. `code` assertions passed immediately (tests only). GREEN: 152 passed / 0 failed
    (62 + 17 + 33 + 40), re-run by the parent. Format clean, build 0 warnings / 0 errors.
  - Codes: 400 `Request.InvalidBody`, 413 `Request.PayloadTooLarge`, 415
    `Request.UnsupportedMediaType`, other 4xx `Request.Invalid`, 500 `Server.UnexpectedError`.
  - Observed framework behavior: a `text/plain` body gets a bare 415 written by minimal API binding
    itself (no exception, handler not reached), with or without `ThrowOnBadRequest`; documented and
    tested as-is. Possible later improvement: `UseStatusCodePages` to fill empty error bodies.
  - Docker check (worktree build, Production): malformed JSON -> 400 ProblemDetails
    `Request.InvalidBody`; missing `numberOfPublications` -> 400 keyed by the field.
  - `BadHttpRequestException` matched by type hierarchy, honouring its own `StatusCode`
    (413/415 stay as the framework set them).
  - `ThrowOnBadRequest` enabled in every environment; a test runs the host in Production and gets
    the 400 ProblemDetails with `Request.InvalidBody`.
  - Assert `Server.UnexpectedError` in the 500 test and `Request.InvalidBody` in the wrong-type test.
- [x] T4d Final-review follow-ups (user accepted, 2026-09-26; lands in PR #20). Route: delegated.
  - Design: `ThrowOnBadRequest = false` in every environment plus `UseStatusCodePages()` and
    `CustomizeProblemDetails` (`BodyBindingProblemDetails`), which adds the `code` by status
    (`ClientErrorCodes` lookup) only when a problem has none. The exception handler stays for real
    unhandled exceptions (500) with reason-phrase titles and a non-4xx clamp.
  - Evidence: RED `dotnet test tests/PeerReview.Api.IntegrationTests -c Release`: 4 failed / 39
    passed (fallback title, non-4xx clamp, Error log on a malformed body, bare 415). GREEN: 155
    passed / 0 failed (62 + 17 + 33 + 43), re-run by the parent; format clean; build 0 warnings.
    Docker (Production): malformed JSON 400 `Request.InvalidBody`, `text/plain` 415
    `Request.UnsupportedMediaType`, no error lines in the container log. README bare-415
    limitation removed; `apps/api/AGENTS.md` updated.
  - Commit `4785662`. RDD: assess (base `27ea4bf`) medium, `under_budget` (397); review requested
    deliberately (last change before merge); one lens; approved and acknowledged (lineage
    `review-c43ca9559e11a560`). Findings: global `UseStatusCodePages` labeled an unknown-route 404
    `Request.Invalid` (WARNING) -> fixed inline by the parent: `Route.NotFound` (404) and
    `Request.MethodNotAllowed` (405), RED observed (both returned `Request.Invalid`), GREEN 157/157;
    413 not proved end to end (WARNING) -> documented in `apps/api/AGENTS.md` (the test host does
    not enforce a body size limit).
  - Client body errors (400/413/415) are ProblemDetails with a stable `code` in every environment
    and are not logged as unhandled exceptions at Error level; real unhandled exceptions stay a
    generic 500 logged at Error.
  - Unmapped `BadHttpRequestException` statuses get the title from the status code; non-4xx
    statuses are treated as the generic 500.
  - The 415 test asserts the intended contract instead of pinning the framework's empty body.
- [x] T5 Docker: multi-stage `apps/api/Dockerfile`, `.dockerignore`, root `docker-compose.yml`
  with the api service (web service added by `frontend-ui`); verify `docker build` and `/health`.
  Route: delegated (writer), parent trimmed comments and upgraded the healthcheck.
  - Commit (user consented): `4333666`. RDD: assess (base `c4db629`) high (`high_risk`: compose
    starts processes); consent granted; four lenses (risk, resilience, readability, reliability);
    approved and acknowledged (lineage `review-de3ae8d93a6c3da3`, authority burned). Reviewed
    boundary advances to `4333666`. Advisory findings (non-blocking): port published on all host
    interfaces (SUGGESTION); floating `10.0` base image tags (SUGGESTION x2); compose does not
    restart an unhealthy container (SUGGESTION); this entry said "uncommitted" while checked
    (WARNING, fixed here); port 8080 repeated without a visible link (SUGGESTION); container
    contract verified only by hand, no CI step (SUGGESTION).
  - Contents: SDK 10.0 build stage (restore layer cached, publish, no tests),
    aspnet 10.0 runtime as `$APP_UID` on 8080; compose `api` service in Production with
    `Cors__AllowedOrigins__0=http://localhost:5173`, healthcheck via bash `/dev/tcp` GET `/health`
    expecting 200 (the runtime image has no curl or wget).
  - Verified: `docker compose config` parses; local `dotnet publish src/PeerReview.Api -c Release
    -p:UseAppHost=false` succeeds.
  - Container verified (Docker 29.8.0), built from a clean `git archive` of `c4db629` plus the T5
    files (T4c was being edited in the worktree): `docker compose build` OK; `up -d` -> health
    `healthy`; process uid 1654 (non-root); `/health` 200 `Healthy`; `/openapi/v1.json` 200;
    `POST /api/users` (Ada Lovelace, Harvard University, 5) 201 with Frontiers id 1327079645;
    `POST /api/reviewers/invitations` 200 `invited: true`; CORS preflight from
    `http://localhost:5173` allowed; `down` OK.
  - Also observed in the container (Production): a malformed JSON body returns a bare 400 with an
    empty body — confirms the T4b review finding that T4c fixes (`ThrowOnBadRequest`).
- [x] T5b T5 review follow-ups (user accepted, 2026-09-26). Route: inline (2 mechanical edits).
  - Port published on `127.0.0.1` only; comments tie the healthcheck port to
    `ASPNETCORE_HTTP_PORTS` and state that compose does not restart an unhealthy container.
    Floating base image tags: kept, explained in T6. CI container job: not added (user agreed).
  - Evidence: `docker compose config` shows `host_ip: 127.0.0.1`; clean `git archive` of
    `4333666` plus the edited files: `docker compose up -d --build --wait` -> `Healthy`,
    `docker port` -> `8080/tcp -> 127.0.0.1:8080`, `/health` 200; `down` OK.
  - Commit (user consented): `4dbc9c4`. RDD: assess (base `4333666`) high (`process_boundary` in
    compose); consent granted; four lenses; approved with no findings and acknowledged (lineage
    `review-7a3390115af0482a`, authority burned). Reviewed boundary advances to `4dbc9c4`. The
    uncommitted T4c work was parked in a `git stash` during this review (its untracked test file
    blocked the preflight) and restored afterwards.
- [x] T6 README (done 2026-09-26; route: delegated writer, parent adjusted the Web section
  after `main` received frontend-ui PRs #10-#12). Evidence: `docker compose config` parses;
  launch profile URL `http://localhost:5112` and anchors (`apps/api/AGENTS.md#http-contract`,
  `apps/web/AGENTS.md#configuration`, `docs/ai/README.md#model-used-and-why`) checked; the Quick
  start commands run verbatim against the container: `/health` 200, `/openapi/v1.json` 200,
  register 201, invite 200 `invited: true`. Scope: build/run (local and Docker), API contract summary, deviations (Guid ids, null
  score not eligible, score semantics), floating `10.0` base image tags (patch updates vs
  reproducibility), known limitation (university get-or-create race under
  concurrent registrations, no unique index in InMemory), LLM used and why, link to `docs/ai/conversations`.

## Acceptance criteria / checks (from `apps/api`)
- `dotnet format whitespace|style PeerReview.slnx --verify-no-changes` clean.
- `dotnet build PeerReview.slnx -c Release`: 0 errors, 0 warnings.
- `dotnet test PeerReview.slnx -c Release`: all green.
- Dependency rule per `apps/api/AGENTS.md` (`dotnet list ... reference`, no Infrastructure/Api/EF
  usings in Domain/Application).

## Progress
- All tasks done. Commits: `56c2d5d` T1, `1c47f76` T1b, `9d4c79a` T2, `48b61d9` T3, `3f6b01d` T2b,
  `ac915bf` T4, `9259f86` T2c, `c4db629` T4b, `4333666` T5, `4dbc9c4` T5b, `377304f` T4c, then T6.
- Reviewed slices (RDD approved and acknowledged): T1; T1b+T2; T3+T2b; T4; T2c+T4b; T5; T5b.
  T4c (244 lines, `under_budget`) is pending in the slice with T6.
- Final suite: 152 passed / 0 failed; format clean; build 0 warnings / 0 errors; container
  verified (Quick start commands run verbatim).
- Last slice (T4c+T6, 388 lines, `under_budget`): review requested deliberately because no later
  commit would reach the budget; consent granted (user authority); one lens; approved and
  acknowledged (lineage `review-f9463b5af645ed3e`). Advisory findings, open as follow-ups (T4d
  candidate, user decision): `ThrowOnBadRequest` makes client body errors log as unhandled
  exceptions at Error level (WARNING); fallback descriptor titles any unmapped status "Bad
  Request" and does not clamp non-4xx (SUGGESTION); the 415 test pins the framework's empty body
  (SUGGESTION).
- Delivery: stacked-to-main PRs, one per reviewed slice: 01 T1, 02 T1b+T2, 03 T3+T2b, 04 T4,
  05 T2c+T4b, 06 T5+T5b, 07 T4c+T6. Merges need the user's yes.
