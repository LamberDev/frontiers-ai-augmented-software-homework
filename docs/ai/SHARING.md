# Safe sharing policy

Everything under `docs/ai/` is public once pushed. Apply this policy before
committing anything into `instructions/`, `specs/`, `conversations/` or
`memory/`.

## May be published

- Prompts and answers about this homework.
- Excerpts of agent instructions and skills that explain the workflow.
- Specs, designs, task lists and decisions for this repository.
- Tool names, versions and command shapes (without secrets).

## Must be scrubbed

| Category | Examples | Replace with |
|----------|----------|--------------|
| Secrets | API keys, tokens, passwords, cookies, connection strings | `<redacted-secret>` |
| Personal data | Emails, full names of third parties, phone numbers | `<email>`, `<person>` |
| Usernames and hosts | OS usernames, machine names, internal hostnames, IPs | `<user>`, `<host>` |
| Absolute paths | `C:\Users\<name>\...`, `/home/<name>/...` | Repo-relative paths or `~/...` |
| Other projects | Names and content of unrelated or private projects | Remove entirely |
| Employer information | Internal systems, clients, domains (`<employer-domain>`) | Remove entirely |
| Environment | Environment variable values, local config contents | Remove or `<redacted>` |

## Engram is multi-project

The local Engram database also holds memories from unrelated projects.
Every export **must** be filtered by project
`frontiers-ai-augmented-software-homework` (see
[memory/README.md](memory/README.md)). Even filtered exports contain an
absolute `directory` field per session: scrub it.

## Pre-commit checklist

- [ ] The content belongs to this project only.
- [ ] No secrets, tokens or credentials.
- [ ] No emails, usernames, hostnames or IPs.
- [ ] No absolute paths; only repo-relative or `~/` paths.
- [ ] No names or content of other projects or of the employer.
- [ ] The leak scan below returns only the expected pattern line.
- [ ] I have read the final file myself.

## Leak scan

Run from the repository root:

```bash
grep -rnEi "C:\\\\Users|/home/|@[a-z0-9.-]+\.(com|org|net|io)|api[_-]?key|token|secret|password|<employer-domain>" docs/ai
```

Expected hits: this file (the pattern and the scrub table) and the
generic words "token"/"secret" when used in prose. Inspect every other hit.

