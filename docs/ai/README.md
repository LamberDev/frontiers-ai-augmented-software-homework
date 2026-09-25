# How I use AI in this homework

This folder explains how I built the Frontiers homework with AI: the harness I
chose, the rules I set for the agent, where I decide and where the AI executes,
and the curated evidence (instructions, specs, conversations, memory).

Start here, then read [harness.md](harness.md) for the details and
[SHARING.md](SHARING.md) before adding anything to the evidence folders.

## Folder map

| Path | What it holds |
|------|---------------|
| [README.md](README.md) | This overview: my setup, my rules, the decision split |
| [harness.md](harness.md) | How I configured gentle-ai 3.6.1: orchestration, ODD/SDD, Engram, RDD, strict TDD |
| [SHARING.md](SHARING.md) | What may be published and what must be scrubbed first |
| [instructions/](instructions/) | Curated excerpts of agent instructions and skills (never the full global file) |
| [specs/](specs/) | Proposal, spec, design and tasks for each change (SDD or ODD feature docs) |
| [conversations/](conversations/) | Exported and cleaned session transcripts (the prompt history) |
| [memory/](memory/) | Engram memory export, filtered to this project only |

## My setup and why I use each tool

| Tool | Why I use it |
|------|--------------|
| Claude Code (CLI) | Runs the model in my terminal, with a permission layer I control |
| gentle-ai 3.6.1 | Lets me encode my workflow and guardrails once instead of repeating them in every prompt |
| Engram | Keeps my decisions and conventions across sessions, so I do not re-explain context |
| CodeGraph | Lets the agent answer structural questions from an index instead of reading files blindly |
| Context7 | Gives the agent current framework documentation instead of relying on training data |

## The rules I set for the AI

1. **No change without my authorization.** Investigation, explanation and
   planning are read-only. The AI may not write files until I ask for a change.
2. **Explore before proposing.** The agent reads the relevant code and
   requirements first, and asks me one focused question when a product
   decision is open. It does not decide for me.
3. **Tests come first (strict TDD).** The AI must show a failing test before
   implementing, then make it pass, then refactor.
4. **Specs only when I choose them.** By default I work with ODD (lightweight,
   task-tracked). I opt into SDD (proposal, spec, design, tasks) when a change
   has enough ambiguity to justify it.
5. **Risky changes get a review I consent to.** Commits rated medium or high
   risk go through an independent review (RDD) only if I grant it.
6. **No commit without my explicit consent.** Push, pull requests and merges
   are also mine.
7. **Nothing is published without scrubbing.** Transcripts and memory exports
   go through [SHARING.md](SHARING.md) first.

See [harness.md](harness.md) for how each rule is configured.

## Who decides what

| Decision | Human (me) | AI |
|----------|:----------:|:--:|
| Scope of each task and what is in or out | Decides | Proposes |
| Product decisions (behavior, UX, API shape) | Decides | Asks one focused question |
| Accepting an SDD proposal or a plan | Decides | Drafts |
| Consent for a native review of a candidate | Decides | Relays the consent prompt |
| Approving every commit | Decides | Proposes a message, waits |
| Push, pull requests, merge | Decides | Never on its own |
| What is ignored in git and what is published | Decides | Suggests, applies on request |
| Model choice | Decides | Uses the assigned model |
| Exploring the codebase and requirements | Reviews | Does |
| Drafting code, tests and docs | Reviews and corrects | Does, under explicit authorization |
| Running tests, builds and checks | Reviews results | Does and reports honestly |
| Suggesting alternatives and risks | Weighs | Proposes |

## What I designed and specified myself

Quality starts with the first line of code, and with a good harness around
the AI. That is why the architecture rules, the linters that enforce them and
the acceptance checks were in place before any business code was written.

The AI generated the code; the architecture, the rules it must obey and the way
each step is verified are mine. I wrote them as specifications before any code
existed (see
[conversations/2026-09-24-monorepo-architecture.md](conversations/2026-09-24-monorepo-architecture.md)
and [conversations/2026-09-25-git-hooks-linting.md](conversations/2026-09-25-git-hooks-linting.md)).

**Backend architecture (`apps/api`)**

- Clean Architecture with four layers and a strict dependency rule: Domain
  depends on nothing; Application depends only on Domain and defines the ports;
  Infrastructure implements them; Api is the only composition root.
- Screaming Architecture inside every layer: folders by business capability
  (`Users/RegisterUser`, `Reviewers/InviteReviewer`), never by technical type,
  and ports named after the business need (`IUniversityDirectory`, not
  `IFrontiersApiClient`).
- Conventions: `.slnx` solution, `Directory.Build.props` with nullable,
  implicit usings and `TreatWarningsAsErrors`, central NuGet versions, Minimal
  APIs with one endpoint file per use case.

**Frontend architecture (`apps/web`)**

- Feature-Sliced Design with a fixed layer order
  (`app → pages → widgets → features → entities → shared`), imports only
  downward, kebab-case business slices that mirror the backend use cases, the
  standard segments only, and each slice's public API only through `index.ts`.
- Tooling: Vue 3.5.x (explicitly not the 3.6 RC), Vite, TypeScript, pnpm,
  Vue Router, Vitest, the official Vue + TypeScript ESLint config, Steiger to
  enforce the FSD rules, the `@/` alias and `VITE_API_URL` read from
  `shared/config`.

**Verification and testing strategy**

- Acceptance criteria for every step, which the AI must run and show before
  calling it done.
- Linters that enforce the architecture, not only the code style: Steiger
  (the official FSD linter) validates layer order and public-API-only imports
  in `apps/web` and runs as `pnpm steiger`; on the backend, an architecture
  test with NetArchTest or ArchUnitNET is planned to turn the dependency rule
  into an automated check.
- Dependency-rule checks per layer: project references, NuGet packages (so a
  layer cannot break the rule through a package) and a grep for upward
  `using`s, as a stopgap until an architecture test with NetArchTest or
  ArchUnitNET.
- xUnit test projects that mirror the business structure of the project they
  test, Vitest on the frontend, and strict TDD (a failing test before any
  implementation) as a standing rule for the AI.

**Git hooks and linting**

- The hook behaviour: Lefthook with per-app `root` and `glob`, only staged
  files, both apps in parallel, `stage_fixed`, ESLint then Prettier, unfixable
  ESLint errors failing the commit, and analyzers left to the build.
- The acceptance scenarios, including the 10-second budget that led me to move
  `dotnet format style` to CI.

## How I steered the git hooks work

The AI implemented and committed the pre-commit tooling and its review fixes;
these were my calls along the way (see
[conversations/2026-09-25-git-hooks-linting.md](conversations/2026-09-25-git-hooks-linting.md)):

- I set a 10-second budget for the hook. When it measured ~17 s, I moved
  `dotnet format style` to CI and kept only `dotnet format whitespace --folder`
  in the hook (~2 s).
- I kept `.gitattributes` and chose not to enable `EnforceCodeStyleInBuild`.
- I granted every native review and required the fixes one commit per finding.
- I asked for the suspected parallel `stage_fixed` race to be tested with real
  mixed commits instead of accepting the reviewer's inference.
- I deferred the task-document findings to the CI pipeline work.

## Model used and why

Facts:

- Main session (orchestrator): **Claude Opus 5.5** with 1M-token context.
- Sub-agents follow the harness model table: **Sonnet** by default (explore,
  spec, tasks, apply, verify), **Opus** for architectural phases (propose,
  design), **Haiku** for mechanical closing (archive, onboarding).

## When I coded without AI

- **Locale-independent git probe in `scripts/install-hooks.mjs`.** A native
  review found that the "not a git repository" check depended on git's English
  output, so a localized git would fail `pnpm install` outside a repository. I
  wrote the fix by hand: git now runs with `LC_ALL=C` and `LANGUAGE=C`, and the
  error message includes `probe.error?.message` so spawn failures are no longer
  silent. The AI only ran my version against the five install scenarios
  (repository, `LEFTHOOK=0`, no repository, no git, corrupted config).

## Evidence index

| Evidence | Location |
|----------|----------|
| Prompt history | [conversations/](conversations/) |
| Specs and task lists | [specs/](specs/) |
| Instructions that shaped the agent | [instructions/](instructions/) |
| Memory decisions and discoveries | [memory/](memory/) |
