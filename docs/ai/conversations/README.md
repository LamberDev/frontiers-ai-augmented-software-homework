# Conversations

Exported and cleaned transcripts of the sessions used to build this homework.
Together they form the prompt history requested by Frontiers.

## How transcripts are exported

1. Claude Code stores each session as a JSONL file under the user's
   `~/.claude/projects/<project-folder>/` directory, one file per session ID.
2. Convert the session to readable Markdown: keep user prompts and assistant
   answers; summarize or drop raw tool output that adds no insight.
3. Clean it with [../SHARING.md](../SHARING.md): remove secrets, emails,
   usernames, hostnames, absolute paths and anything from other projects.
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
| `2026-09-24-agent-harness.md` | 2026-09-24 | Branch creation and `docs/ai/` harness structure | Pending export |

