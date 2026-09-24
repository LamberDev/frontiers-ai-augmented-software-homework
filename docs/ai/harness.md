# My harness: gentle-ai 3.6.1 on Claude Code

This is how I configured the agent for this homework and why. It is a summary,
not a copy of the agent instructions; curated excerpts live in
[instructions/](instructions/).

I chose gentle-ai because it lets me write my workflow and guardrails down
once. The agent then follows them in every session, and I spend my attention
on decisions instead of re-explaining the process.

## 1. The main session coordinates, it does not do everything

I configured the main session as a **coordinator**: it keeps one thin thread
with me, delegates bounded work to sub-agents, and brings the results back for
me to review. This keeps the conversation focused on my decisions instead of
filling it with file dumps.

| Situation | Route I set |
|-----------|-------------|
| Read 1-3 files to decide or verify | Inline (bounded read) |
| Understanding needs 4+ files | Delegate one narrow mapping/exploration agent |
| Write one mechanical, already-understood file | Inline |
| Write 2+ non-trivial files | Delegate one writer agent |
| Reading that prepares a write | Delegated together with the write |
| Tests, builds, installs, reviews | May use a fresh per-action worker |

Constraints I keep:

- One writer at a time; no parallel writers without isolated worktrees.
- After about 20 tool calls without delegation, the next bounded unit must be
  delegated.
- Delegation chooses how work runs, never which workflow; SDD stays my choice.

## 2. ODD: my default workflow

For every request the agent follows these seven steps, in order. The first one
is the guardrail I care most about: nothing is written without my go-ahead.

| # | Step | What I expect |
|---|------|---------------|
| 1 | Authorize | Only an explicit change request allows writes; investigation and planning stay read-only |
| 2 | Explore | Read code and requirements before proposing anything |
| 3 | Resolve uncertainty | Optional research, or one focused question to me, then wait for my answer |
| 4 | Classify | Small and understood, or substantial (2+ steps, worth recovering) |
| 5 | Track | Substantial work gets `odd/tasks/<feature>.md` plus an Engram mirror, before the first write |
| 6 | Implement | Task by task, with TDD and checks; a Conventional Commit per task, only after I approve it |
| 7 | Close | Report the verified outcome, any failed or skipped checks, and the next step |

I use about 400 changed lines per task as a planning heuristic, not a hard cap.

## 3. SDD: when I want specs first

I opt into SDD only when a change is ambiguous enough that a written proposal
and spec save time. I accept or reject each proposal. Phases:

```
explore -> propose -> spec -> design -> tasks -> apply -> verify -> archive
```

| Phase | Output I review |
|-------|-----------------|
| explore | Investigation of the codebase and approaches |
| propose | `proposal.md`: intent, scope, approach |
| spec | `specs/`: requirements and scenarios (delta specs) |
| design | `design.md`: architecture decisions and trade-offs |
| tasks | `tasks.md`: ordered implementation checklist |
| apply | Code written against the tasks |
| verify | Validation of the implementation against spec and design |
| archive | Delta specs merged, change folder closed |

Artifacts live under `openspec/changes/<change>/` and are mirrored into
[specs/](specs/) for this documentation.

## 4. Engram: so I do not repeat myself

I use Engram so that decisions, conventions and fixes survive new sessions
and context compactions. When I set a rule (for example "no commits without my
consent"), it is saved and applied in later sessions.

| Tool | Use |
|------|-----|
| `mem_context` | Recent history at session start or after compaction |
| `mem_search` | Find past work by keywords, scoped to the project |
| `mem_get_observation` | Full content of a search hit |
| `mem_save` | Save a decision, bug fix, discovery or convention |
| `mem_session_summary` | End-of-session summary before reporting done |

Topic keys give stable identities to evolving documents, for example
`odd/<feature>/tasks`. Exports for this repo are described in
[memory/README.md](memory/README.md).

## 5. RDD: a review I control

I keep an independent review of risky changes behind a switch that only I
toggle, and behind my consent for each candidate.

```
gentle-ai review mode status     # read-only: effective mode and who decided it
gentle-ai review mode enable|disable
```

How a review flows:

1. **Assess.** After each work-unit commit the native assessor rates risk as
   `passive`, `medium` or `high`.
2. **Consent.** Passive changes get a structural check only. For medium and
   high changes I see a consent prompt and grant or decline that candidate.
3. **Review.** On grant, up to four lenses run on frozen, immutable trees:
   risk (security), resilience, readability, reliability.
4. **Correct.** At most one bounded correction, scoped to corroborated findings.
5. **Acknowledge.** An approved review is acknowledged exactly once, which
   closes it.

A review outcome informs me; it never commits, pushes or merges for me.

## 6. Strict TDD: tests before code

I require the agent to prove the behavior is missing before it writes it.

| Phase | Rule |
|-------|------|
| RED | Write the test first and show it failing |
| GREEN | Write the minimum implementation to pass |
| REFACTOR | Clean up with the tests still green |

The TDD mode and the exact test runner are recorded in each feature document
and passed to every implementation agent.

## 7. CodeGraph: answers from an index, not guesses

A local SQLite index of symbols, calls and files. I configured the agent to
query it before any broad file search for structural questions ("how does X
work", "what calls Y", "what breaks if I change Z"). Each worktree has its own
`.codegraph/` index.

## 8. Model assignments

| Role | Model |
|------|-------|
| Orchestrator (main session) | Claude Opus 5.5, 1M context |
| explore, research, spec, tasks, apply, verify | Sonnet |
| propose, design | Opus |
| archive, onboard | Haiku |
| Generic sub-agents (mapper, writer, verifier) | Sonnet |

## 9. Boundaries I keep

- No commit without my explicit consent; push, PRs and merges are mine.
- Remote operations (SSH, deploys, uploads) need my explicit authorization.
- Destructive or outward-facing actions are confirmed with me first.
- Tests, checks and reviews are reported faithfully, including failures.
- Nothing leaves my machine unscrubbed: see [SHARING.md](SHARING.md).
