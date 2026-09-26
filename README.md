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
`ci-success` is the only required status check in branch protection: it passes only when every
job succeeded or was skipped by the path filter, and fails on any other result (failed,
cancelled or unexpected). A new push to a pull request cancels its previous run; runs on `main`
are never cancelled, so every commit on `main` is verified.

The pre-commit hook gives fast local feedback on staged files, but it can be skipped
(`--no-verify`, `LEFTHOOK=0`); CI is the definitive validation and also runs the checks that
are too slow for the hook.

## Quick start (Docker)

Run the API in a container:

```bash
docker compose up --build
```

The API listens on `http://localhost:8080` (published on `127.0.0.1` only). Wait for the
healthcheck to report `healthy` (`docker compose ps`), then try it:

```bash
# Health check
curl http://localhost:8080/health

# OpenAPI document
curl http://localhost:8080/openapi/v1.json

# Register a user (copy "userId" from the response)
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"userName":"Ada Lovelace","universityName":"Harvard University","numberOfPublications":5}'

# Invite that user as a reviewer (replace <userId> with the value above)
curl -X POST http://localhost:8080/api/reviewers/invitations \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>"}'
```

`docker compose down` stops and removes the container. The `web` service is added by the
`frontend-ui` feature and is not part of this compose file yet.

## Run locally without Docker

### API

From `apps/api`:

```bash
dotnet run --project src/PeerReview.Api
```

This uses the `http` launch profile in
[`src/PeerReview.Api/Properties/launchSettings.json`](apps/api/src/PeerReview.Api/Properties/launchSettings.json),
which binds to `http://localhost:5112` (pass `--urls http://localhost:8080`, or any other URL,
to override it). Run the tests with:

```bash
dotnet test PeerReview.slnx -c Release
```

### Web

From `apps/web`:

```bash
pnpm install
cp .env.example .env   # VITE_API_URL=http://localhost:5112 (the API's `http` launch profile)
pnpm dev               # http://localhost:5173
```

The app reads the API base URL from `VITE_API_URL` (see
[`apps/web/AGENTS.md`](apps/web/AGENTS.md#configuration)). Point it at
`http://localhost:8080` instead when the API runs with `docker compose`. The API's CORS policy
only allows the origin `http://localhost:5173`, so keep Vite's default port.

Checks (from `apps/web`, all run in CI):

```bash
pnpm build     # vue-tsc -b && vite build
pnpm lint
pnpm steiger
pnpm test
pnpm format:check
```

#### Web Docker image

`apps/web/Dockerfile` builds the production bundle and serves it with unprivileged nginx on port
8080. The API origin is baked into the bundle at build time, so the build argument is required
(the build fails without it):

```bash
docker build --build-arg VITE_API_URL=http://localhost:8080 -t peer-review-web apps/web
docker run -p 127.0.0.1:5173:8080 peer-review-web
```

Open `http://localhost:5173`; publishing on port 5173 keeps the origin allowed by the API's CORS
policy.

## API contract summary

| Endpoint | Body | Success | Errors |
|---|---|---|---|
| `POST /api/users` | `{ userName, universityName, numberOfPublications }` | `201` `{ userId, userName, numberOfPublications, university: { id, frontiersOrganizationId, name, score } }` | `400` validation (per field) or malformed body; `404` university not found; `502` Frontiers unavailable or invalid |
| `POST /api/reviewers/invitations` | `{ userId }` (Guid) | `200` `{ userId, invited, message, reasons: [{ code, message }] }` (`invited: false` is still `200`) | `400` empty/non-Guid `userId`; `404` unknown user |

Every error is an RFC 9457 `ProblemDetails`/`ValidationProblem` with a stable `code` extension,
and validation failures are keyed by field. Full details (status-code mapping, exception
handling, OpenAPI, CORS) are in
[`apps/api/AGENTS.md#http-contract`](apps/api/AGENTS.md#http-contract); the machine-readable
contract is served at `/openapi/v1.json`.

## Design decisions and deviations from the brief

- **`userId` is a `Guid` (v7), not the brief's `InviteReviewer(int UserId)`.** Guids are not
  enumerable, do not leak a user count, and are known before the entity is persisted. The HTTP
  contract exposes this id and keeps it separate from domain types.
- **Eligibility:** `numberOfPublications > 3` and university `score >= 60`. An unknown (`null`)
  score is treated as not eligible, never as a pass. An ineligible user is still a successful
  `200` response, with `invited: false` and the reasons.
- **Frontiers lookup** uses `GET /v1/organizations/elasticSuggestions?query=<name>&maxcount=1`.
  The search is fuzzy, so a misspelled university name still registers the closest match
  (possibly with a low score); only an empty result is treated as "not found" (`404`). An
  upstream failure or invalid entry is `502`. The returned score is presumed to be the
  Elasticsearch relevance score, not an accreditation rating; the brief's `>= 60` threshold is
  applied to it as given.
- **University snapshot:** a university's data (including its score) is fetched and stored once,
  at the first registration that references it, and reused afterwards by
  `frontiersOrganizationId`. It is not re-fetched on later registrations.
- **Persistence** is EF Core InMemory: all data is lost when the process restarts.

## Known limitations

- **University get-or-create race:** concurrent registrations for a university that does not yet
  exist can create duplicate `University` rows, because EF Core InMemory does not enforce a
  unique index on `FrontiersOrganizationId`; the no-duplicates guarantee only comes from the
  get-or-create logic in the handler, not the database.
- **Floating base image tags:** the Dockerfile pins `mcr.microsoft.com/dotnet/sdk:10.0` and
  `mcr.microsoft.com/dotnet/aspnet:10.0` (minor version only), so a rebuild can pick up a newer
  patch release; builds are not bit-for-bit reproducible over time.
- **No automatic restart on unhealthy:** `docker-compose.yml` reports container health but does
  not restart a container that becomes unhealthy; `restart: unless-stopped` only covers the
  process exiting.

## AI usage

This project was built with AI assistance under an explicit set of rules (human-authorized
changes, strict TDD, reviewed commits). See [`docs/ai/README.md`](docs/ai/README.md) for the
harness, [`docs/ai/README.md#model-used-and-why`](docs/ai/README.md#model-used-and-why) for the
model used and why, and [`docs/ai/conversations/`](docs/ai/conversations/) for the prompt
history.
