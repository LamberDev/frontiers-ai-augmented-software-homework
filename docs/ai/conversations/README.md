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
3. Review it against [../SHARING.md](../SHARING.md) and run the leak check
   there: the script is a first pass, not a guarantee.
4. Save it here and add a row to the index.

## Naming convention

`YYYY-MM-DD-<topic>.md`, lowercase, hyphen-separated.

## Suggested file layout

```markdown
# <Topic>

- **Date:** YYYY-MM-DD
- **Model:** <model used>
- **Goal:** <one sentence>

## Prompt 1
<user prompt>

## Answer 1 (summary)
<what the AI did and decided>
```

## Index

| File | Date | Topic | Status |
|------|------|-------|--------|
| `2026-09-24-agent-harness.md` | 2026-09-24 | Branch creation and `docs/ai/` harness structure | Reviewed |
| `2026-09-24-monorepo-architecture.md` | 2026-09-24 | Monorepo architecture: .NET 10 Clean/Screaming API and Vue 3 FSD scaffold | Reviewed |
| `2026-09-25-git-hooks-linting.md` | 2026-09-25 | Lefthook pre-commit, ESLint/Prettier and `dotnet format`, review fixes | Reviewed |
| `2026-09-25-ci-workflow.md` | 2026-09-25 | GitHub Actions CI for api and web, `ci-success` gate, review follow-ups | Reviewed |
| `2026-09-25-domain-model.md` | 2026-09-25 | Domain model: shared kernel, User/University, reviewer eligibility, EF Core InMemory persistence | Reviewed |

