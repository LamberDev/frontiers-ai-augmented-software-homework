# Memory

Export of the Engram memories (decisions, discoveries, conventions) created
while building this homework.

## Export, filtered by project

The Engram CLI (v2) supports project-filtered exports. Always pass the
project; the local database also holds unrelated projects.

```bash
# JSON export of this project only
engram export docs/ai/memory/engram-export.json --project frontiers-ai-augmented-software-homework

# Optional: readable Markdown vault of this project only
engram obsidian-export --project frontiers-ai-augmented-software-homework --vault <temp-dir>
```

Notes:

- Run exports from the repository root. Do not pass `--help` to `export`:
  it is treated as a file name and triggers an export.
- Never use `--all`.
- Inside an agent session, `mem_context` and `mem_search` with the project
  filter give a quick view of the same content.

## Scrub before committing

Apply [../SHARING.md](../SHARING.md). In particular:

- Each session has an absolute `directory` field: replace it with `<repo>`.
- Remove any observation that mentions other projects or private data.
- Prompts captured by Engram may duplicate conversation content: scrub them
  the same way.

## Naming convention

- `engram-export.json` for the raw (scrubbed) JSON export.
- `YYYY-MM-DD-<topic>.md` for curated, human-readable highlights.

## Index

| File | Date | Content |
|------|------|---------|

