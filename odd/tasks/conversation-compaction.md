# Feature: conversation-compaction

## Objective
Publish the missing AI session transcripts and make all eight exported transcripts in
`docs/ai/conversations/` easy for Frontiers to read: remove harness noise, keep every human
prompt and every meaningful decision, and add a short summary per session.

## Why
The raw exports are 420–1980 lines each. Most of the volume is tooling bookkeeping (Gentle AI
review ceremony, Engram memory calls, routine tool calls, one-word confirmations), which hides
the prompts and the human decisions the reviewers care about.

## Scope
- In: the three new exports (`2026-09-25-domain-model-prompt-review.md`,
  `2026-09-26-use-cases.md`, `2026-09-26-frontend-ui.md`), a Markdown post-processor
  `docs/ai/tools/compact_conversation.py` with stdlib `unittest` tests, compacting all eight
  transcripts, a summary header and "Human decision" markers per transcript, the README index
  and timeline.
- Out: push and PR (the user reviews the files first), rewording human prompts.

## Constraints
- The five older transcripts were reviewed and hand-edited: a fresh JSONL export differs from
  them by 250–640 lines. Compaction therefore works on the Markdown, not by re-exporting, so
  the review edits survive.
- Human prompts stay verbatim (typos included); only scrubbing per `docs/ai/SHARING.md`.
- Assistant answers and review findings stay; only the ceremony around them goes.
- Leak scan from `docs/ai/SHARING.md` must stay clean.

## TDD
- Mode: strict (source: global CLAUDE.md). Runner: `python -m unittest discover -s docs/ai/tools -p "test_*.py"`.

## Delivery
- Branch `docs/ai-conversation-exports-2` from main (8e279cd). Strategy: ask-on-risk; mostly
  generated/deleted transcript lines, authored code forecast < 400 lines.
- No commits, push or PR: the user said "no hagas commits" (2026-09-27). Every change stays in
  the working tree for the user to review.

## Tasks
- [x] T0 · Add the three raw exports and their index rows (uncommitted). Route: inline (mechanical).
- [x] T1 · `compact_conversation.py` + tests (RED → GREEN): drop Engram and Gentle AI tool
  lines, collapse remaining tool blocks into one counted line, collapse Gentle AI consent
  questions into one line with the answer, fold confirmation-only human turns into a one-line
  marker, strip leaked internal tags. Route: delegated writer (2 non-trivial files).
- [x] T2 · Run it on the eight transcripts, read back, leak scan (uncommitted). Route: inline (script run).
- [x] T3 · Summary header (goal, model, outcome, key decisions) and "Human decision" markers
  per transcript, README index statuses and timeline. Route: delegated writer (9 files).

## Acceptance criteria
- Every human prompt from the originals is still present (confirmations as one-line markers).
- No `engram.`/`gentle-ai` tool lines and no Gentle AI consent blocks remain.
- Transcripts are roughly half their current size.
- Leak scan clean; unittest suite green.

## Progress
- Created 2026-09-27.
- T1: `compact_conversation.py` + 23 tests. RED `ModuleNotFoundError`, GREEN `Ran 23 tests ... OK` (re-run by parent). Raw `<task-notification>` blocks become the exporter's standard marker instead of being deleted.
- T2: applied to the 8 transcripts: 7443 → 5529 lines (66–96 % per file; the rest is assistant prose). Idempotent. Leak scan clean; `__pycache__/` added to `.gitignore`. Prose mentions of Gentle AI kept on purpose.
- T3: `## Summary` header and `Human decision` anchors in all 8 transcripts (22 markers), README export step, layout and timeline. Verified: human text unchanged (snapshot diff), anchors resolve, tests green, leak scan clean. Parent removed one marker/summary line that labelled an attribution dispute as a "human decision" (not a decision; the transcript exchange itself is untouched).
- Next: user reviews the working tree; commit/push/PR only when the user asks. Index statuses of the new rows stay "Pending review" until then.
- Engram mirror: pending (save failed: multiple active runtime sessions).
