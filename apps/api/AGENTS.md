# apps/api — Agent Instructions

.NET 10 backend. Clean Architecture (dependency rule) + Screaming Architecture (folders by
business capability). Read this before adding or changing any code here.

## Layers and dependency rule

| Layer | May reference | Packages allowed |
|---|---|---|
| `PeerReview.Domain` | nothing | none |
| `PeerReview.Application` | `Domain` only | at most `Microsoft.Extensions.DependencyInjection.Abstractions` |
| `PeerReview.Infrastructure` | `Application` only | as needed to implement ports (HTTP clients, persistence drivers, etc.) |
| `PeerReview.Api` | `Application` + `Infrastructure` | web framework packages; this is the **only** composition root |

Never add a reference that violates this table (e.g. `Domain` -> `Infrastructure`, or a `using
PeerReview.Infrastructure` / `using PeerReview.Api` inside `Domain`/`Application`). Verify with:

```
dotnet list src/PeerReview.Domain reference
dotnet list src/PeerReview.Application reference
dotnet list src/PeerReview.Infrastructure reference
dotnet list src/PeerReview.Api reference
grep -rE "using PeerReview\.(Infrastructure|Api)" src/PeerReview.Domain src/PeerReview.Application
```

## Screaming Architecture

Organize folders by business capability, never by technical role. Inside each layer, create one
folder per capability (e.g. `Users/`, `Reviewers/`), and inside `Application`/`Api`, one folder per
use case (e.g. `Users/RegisterUser/`, `Reviewers/InviteReviewer/`).

- Never create `Controllers/`, `Services/`, `Dtos/`, `Helpers/`, or other technical-role folders.
- Minimal API endpoints live one file per use case, inside its business folder in `PeerReview.Api`
  (e.g. `Users/RegisterUser/RegisterUserEndpoint.cs`), not in a shared `Endpoints/` folder.
- Tests mirror the business folder structure of the layer they test (`tests/*.UnitTests/Users/...`).

## Ports and adapters

- Ports (interfaces) are defined in `PeerReview.Application`, named after the business need, not the
  technology (e.g. `IUniversityDirectory`, never `IFrontiersApiClient`).
- `PeerReview.Infrastructure` implements those ports (e.g.
  `Universities/FrontiersOrganizations/FrontiersUniversityDirectory.cs`).
- `PeerReview.Api` is the only place ports get their concrete implementations registered
  (via `AddApplication()` / `AddInfrastructure()` called from `Program.cs`).

## Package management

- Central Package Management is enabled (`Directory.Packages.props`, `ManagePackageVersionsCentrally=true`).
  Never put a `Version` attribute on a `PackageReference` in a `.csproj`; add/update versions only in
  `Directory.Packages.props`.
- Common build settings (`TargetFramework`, `Nullable`, `ImplicitUsings`, `TreatWarningsAsErrors`) live
  in `Directory.Build.props`. `TreatWarningsAsErrors` is `true` — keep the build warning-free.
- `NuGet.Config` in this folder pins the package source to `nuget.org` so restores are reproducible.

## Tests

- xUnit, one test project per layer under test (`PeerReview.Domain.UnitTests`,
  `PeerReview.Application.UnitTests`, `PeerReview.Infrastructure.IntegrationTests`,
  `PeerReview.Api.IntegrationTests`), mirroring the business folder structure being tested.
- A test project references only the project it tests.
- `PeerReview.Infrastructure.IntegrationTests` exercises EF Core InMemory persistence
  (`PeerReviewDbContext`, repositories, `AddInfrastructure()`). Each test uses its own isolated
  in-memory database name (e.g. a fresh `Guid`) and reads back through a **new** `DbContext`/
  repository instance, so it proves persistence rather than change tracking. The InMemory
  provider does **not** enforce unique indexes (e.g. `University.FrontiersOrganizationId`); the
  no-duplicates guarantee for that value comes from the get-or-create logic in the `RegisterUser`
  handler (a later step), not from the database.
- `PeerReview.Api.IntegrationTests` exercises the HTTP endpoints end to end with
  `WebApplicationFactory<Program>` (`Program.cs` ends with `public partial class Program;` to make
  the entry point visible to the test host). `PeerReviewApiFactory` (`ConfigureTestServices`)
  replaces `IUniversityDirectory` with a hand-written `FakeUniversityDirectory` (no calls to the
  real Frontiers API) and re-registers `DbContextOptions<PeerReviewDbContext>` with a unique
  InMemory database name per factory instance, so test classes never share state. Packages:
  `Microsoft.AspNetCore.Mvc.Testing` 10.0.12 (matching the other 10.0.12 pins) and
  `Microsoft.EntityFrameworkCore.InMemory` (for the per-factory database swap).

## HTTP contract

Minimal API endpoints, one file per use case, under their business folder in `PeerReview.Api`.
Request/response records live in the Api layer next to their endpoint; handlers only ever return
Application result records, never domain entities, over HTTP.

- `POST /api/users` — body `{ "userName": string, "universityName": string, "numberOfPublications": int }`.
  - `201 Created` (no `Location` header; there is no `GET` endpoint) —
    `{ userId, userName, numberOfPublications, university: { id, frontiersOrganizationId, name, score } }`.
  - `400` `ValidationProblem` — `errors` keyed by camelCase request field (`userName`,
    `universityName`, `numberOfPublications`).
  - `404` `ProblemDetails` — university not found in Frontiers (`UniversityDirectory.NotFound`).
  - `502` `ProblemDetails` — Frontiers unavailable or returned invalid data
    (`UniversityDirectory.Unavailable` / `UniversityDirectory.InvalidEntry`).
- `POST /api/reviewers/invitations` — body `{ "userId": "<guid>" }`.
  - `200 OK` — `{ userId, invited, message, reasons: [ { code, message } ] }` (`invited: false` is
    still `200`, with the ineligibility reasons in evaluation order).
  - `400` `ValidationProblem` (`errors.userId`) — empty Guid, missing/non-Guid `userId`, or a
    malformed body (the request body is read manually so all three fail the same way).
  - `404` `ProblemDetails` — unknown user id.
- Every error is an RFC 9457 `ProblemDetails`/`ValidationProblem` (`AddProblemDetails()`), including
  framework body-binding failures and unhandled exceptions (a single top-level
  `app.UseExceptionHandler(...)` in `Program.cs` always returns a generic `500`, never the
  exception's message or stack trace). Every mapped error carries the stable Application/Domain
  error code as the `code` extension.
- Result -> HTTP mapping lives in `PeerReview.Api.SharedKernel.Http.ResultHttpExtensions`
  (`Result<T>.ToHttpResult(...)`). `SharedKernel/Http` mirrors the Domain's own `SharedKernel`
  naming: the mapping is genuinely cross-cutting (every endpoint uses it), not owned by one
  business capability, so it is not a technical-role `Helpers/` folder. Mapping: `Validation` ->
  `400` `ValidationProblem` (an explicit per-endpoint code -> field map; a code missing from the
  map falls back to the code itself as the field key), `NotFound` -> `404`, `Conflict` -> `409`,
  `Failure` -> `502` when the error code starts with `UniversityDirectory.`, otherwise `500`.
- OpenAPI: `Microsoft.AspNetCore.OpenApi` 10.0.12, `AddOpenApi()` + `MapOpenApi()`, served at
  `/openapi/v1.json` in every environment (this is a homework demo, so the document is not gated to
  `Development`). Endpoints declare `WithName`/`WithSummary`/`Produces`/`ProducesProblem`/
  `ProducesValidationProblem` metadata.
- CORS: policy `Frontend`, origins from configuration `Cors:AllowedOrigins` (a string array; empty
  by default, so nothing is allowed unless configured), methods restricted to `POST`, headers to
  `Content-Type`. `appsettings.Development.json` sets it to `http://localhost:5173`, the Vite dev
  server's default port (`apps/web/vite.config.ts` does not override `server.port`).
- `/health` stays mapped via `AddHealthChecks()` / `MapHealthChecks("/health")`.

## Verification commands

Run these from `apps/api` before considering a change done:

```
dotnet build                                   # 0 errors, 0 warnings
dotnet test                                    # must run successfully
dotnet list src/PeerReview.Domain reference    # (none)
dotnet list src/PeerReview.Application reference   # only Domain
dotnet list src/PeerReview.Infrastructure reference # only Application
dotnet list src/PeerReview.Api reference       # Application + Infrastructure
dotnet list tests/PeerReview.Infrastructure.IntegrationTests reference # only Infrastructure
dotnet list tests/PeerReview.Api.IntegrationTests reference # only Api
```

CI (`.github/workflows/ci.yml`) runs `dotnet test PeerReview.slnx` on the whole solution, so the new
`PeerReview.Api.IntegrationTests` project is picked up automatically; no CI change was needed.
