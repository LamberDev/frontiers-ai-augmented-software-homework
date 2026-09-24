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
  `PeerReview.Application.UnitTests`), mirroring the business folder structure being tested.
- A test project references only the project it tests.

## Verification commands

Run these from `apps/api` before considering a change done:

```
dotnet build                                   # 0 errors, 0 warnings
dotnet test                                    # must run successfully
dotnet list src/PeerReview.Domain reference    # (none)
dotnet list src/PeerReview.Application reference   # only Domain
dotnet list src/PeerReview.Infrastructure reference # only Application
dotnet list src/PeerReview.Api reference       # Application + Infrastructure
```
