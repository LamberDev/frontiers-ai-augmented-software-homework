# Conversations

Exported and cleaned transcripts of the sessions used to build this homework.
Together they form the prompt history requested by Frontiers.

## How transcripts are exported

1. Claude Code stores each session as a JSONL file under the user's
   `~/.claude/projects/<project-folder>/` directory, one file per session ID.
2. Convert and scrub it with [../tools/export_conversation.py](../tools/export_conversation.py):

   ```bash
   python docs/ai/tools/export_conversation.py <session.jsonl> \
     docs/ai/conversations/YYYY-MM-DD-<topic>.md "Session YYYY-MM-DD: <topic>"
   ```

   It keeps prompts, answers and one-line tool-call summaries, drops model
   thinking and raw tool output, and replaces emails, home paths and session
   IDs. Personal terms (employer domain, real name, OS username) go one per
   line in `docs/ai/tools/scrub.local.txt`, which git ignores.
3. Compact it with [../tools/compact_conversation.py](../tools/compact_conversation.py):

   ```bash
   python docs/ai/tools/compact_conversation.py docs/ai/conversations/YYYY-MM-DD-<topic>.md
   ```

   It rewrites the file in place (idempotent, safe to re-run) and drops
   Gentle AI review/Engram memory bookkeeping, collapses each tool-call block
   into one counted line, and folds confirmation-only human turns into a
   one-line marker, while keeping every human prompt and assistant decision.
   Its tests run with:

   ```bash
   python -m unittest discover -s docs/ai/tools -p "test_*.py"
   ```
4. Review it against [../SHARING.md](../SHARING.md) and run the leak check
   there: the script is a first pass, not a guarantee.
5. Save it here and add a row to the index.

## Naming convention

`YYYY-MM-DD-<topic>.md`, lowercase, hyphen-separated.

## Suggested file layout

```markdown
# <Topic>

Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).
...

## Summary

- **Date:** YYYY-MM-DD
- **Model:** <model used>
- **Goal:** <one sentence>
- **Outcome:** <what was built or decided, with PRs/commits if named>
- **Key decisions:** 3-5 bullets, each naming who drove it (human or AI) when clear.
- **Human decisions:** links to the `human-decision-*` anchors below, e.g.
  `[Domain vs contract](#human-decision-domain-vs-contract)`.

## Human
<user prompt>

## Assistant
<what the AI did and decided>
```

A moment where the human corrected, redirected, constrained or challenged the
AI gets an anchor and a one-line callout immediately before its `## Human`
heading, without editing the prompt text itself:

```markdown
<a id="human-decision-<slug>"></a>
> **Human decision:** <short description of what was decided and why it mattered>

## Human
...
```

## Timeline

Each session builds on the ones before it:

1. **Agent harness** — sets up the `docs/ai/` structure and sharing rules
   used by every later session.
2. **Monorepo architecture** — scaffolds `apps/api` (.NET 10 Clean/Screaming
   Architecture) and `apps/web` (Vue 3 FSD) inside that harness.
3. **Git hooks and linting** — adds pre-commit checks on top of the scaffold
   and fixes the review findings one commit per finding.
4. **CI workflow** — promotes what the pre-commit hook checks locally into a
   required GitHub Actions gate, closing a task left open in the hooks
   session.
5. **Domain model prompt review** — reviews and rewrites the prompt for the
   next step (the domain model) before handing it to the implementing agent.
6. **Domain model** — implements that reviewed prompt: shared kernel,
   `User`/`University` entities and EF Core InMemory persistence.
7. **Use cases** — builds the use cases and HTTP endpoints on top of that
   domain model, and ships the backend.
8. **Frontend UI** — builds the Vue 3 UI in parallel, then integrates it
   against the HTTP contract the use-cases session produced.

## Index

| File | Date | Topic | Status |
|------|------|-------|--------|
| `2026-09-24-agent-harness.md` | 2026-09-24 | Branch creation and `docs/ai/` harness structure | Reviewed |
| `2026-09-24-monorepo-architecture.md` | 2026-09-24 | Monorepo architecture: .NET 10 Clean/Screaming API and Vue 3 FSD scaffold | Reviewed |
| `2026-09-25-git-hooks-linting.md` | 2026-09-25 | Lefthook pre-commit, ESLint/Prettier and `dotnet format`, review fixes | Reviewed |
| `2026-09-25-ci-workflow.md` | 2026-09-25 | GitHub Actions CI for api and web, `ci-success` gate, review follow-ups | Reviewed |
| `2026-09-25-domain-model.md` | 2026-09-25 | Domain model: shared kernel, User/University, reviewer eligibility, EF Core InMemory persistence | Reviewed |
