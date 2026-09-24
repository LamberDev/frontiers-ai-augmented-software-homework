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

## Model used and why

Facts:

- Main session (orchestrator): **Claude Opus 5.5** with 1M-token context.
- Sub-agents follow the harness model table: **Sonnet** by default (explore,
  spec, tasks, apply, verify), **Opus** for architectural phases (propose,
  design), **Haiku** for mechanical closing (archive, onboarding).

## When I coded without AI

## Evidence index

| Evidence | Location |
|----------|----------|
| Prompt history | [conversations/](conversations/) |
| Specs and task lists | [specs/](specs/) |
| Instructions that shaped the agent | [instructions/](instructions/) |
| Memory decisions and discoveries | [memory/](memory/) |
