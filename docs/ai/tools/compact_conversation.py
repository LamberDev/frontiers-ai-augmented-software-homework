"""Compact an exported Claude Code Markdown transcript in place.

Post-processes the Markdown produced by export_conversation.py to make it
easier to read: tool-call bookkeeping for Engram (memory) and Gentle AI
(review ceremony) is dropped, remaining tool calls are collapsed into one
counted summary line per turn, Gentle AI consent questions collapse to one
line with the given answer, one-word human confirmations ("si", "dale",
"aplicalos", "vamos con ello"...) fold into a single-line marker, and leaked
internal tags (<system-reminder>, <usage>, <task-notification>,
<command-...>) are stripped. Every other human prompt and assistant answer
is left untouched, verbatim.

Usage:
    python docs/ai/tools/compact_conversation.py <file.md> [<file.md> ...]

Each file is rewritten in place, UTF-8 encoded with "\\n" newlines. Running
the script twice on the same file is a no-op the second time (idempotent).
"""
import re
import sys
from collections import Counter
from pathlib import Path

# A "boundary" is any of the fixed markers export_conversation.py only ever
# emits at the top level: the two heading kinds, a tool-call details block,
# or one of our own/its own single-line italic markers (e.g.
# "_[Background agent finished and reported back]_" or the counted tool-call
# summary this script introduces). Embedded "##" headings that appear
# *inside* an assistant's own Markdown answer never match this, because they
# are never exactly "## Human" or "## Assistant".
_BOUNDARY = r"(?=^## Human|^## Assistant|^<details>|^_[\[(]|\Z)"

ENGRAM_RE = re.compile(r"engram\.|mem_|mcp__engram|mcp__plugin_engram", re.I)
GENTLE_RE = re.compile(r"gentle-ai", re.I)
BASH_CEREMONY_RE = re.compile(
    r"\breview\b.*\b(start|status|capture|acknowledge|assess)\b|\bconsent\b|\blineage\b",
    re.I,
)
NOTABLE_BASH_RE = re.compile(
    r"\b(test|tests|build|docker|compose|format|lint|migration)\b", re.I
)

TOOL_BLOCK_RE = re.compile(
    r"<details><summary>Tool calls</summary>\n\n(?P<body>.*?)\n\n</details>\n?",
    re.S,
)
TOOL_LINE_RE = re.compile(r"^- `([^`]+)` — (.*)$")
BASH_CMD_RE = re.compile(r"^(?P<desc>.*): `(?P<cmd>[^`]*)`$")

BLOCKING_RE = re.compile(
    r"^## Human \(answer to blocking question\)\n\n"
    r"(?P<quote>(?:>.*\n)+)"
    r"\nOptions:\n\n"
    r"(?P<options>(?:-.*\n)+)"
    r"\n\*\*Answer:\*\* (?P<answer>.*)\n",
    re.M,
)

HUMAN_RE = re.compile(r"^## Human\n\n(?P<body>.*?)\n\n" + _BOUNDARY, re.M | re.S)
ASSISTANT_RE = re.compile(r"^## Assistant\n\n(?P<body>.*?)\n\n" + _BOUNDARY, re.M | re.S)

CEREMONY_RE = re.compile(
    r"gentle[\s-]?ai|revisi[oó]n autom[aá]tica|\blineage\b|\bcapture\b|permiso para este commit",
    re.I,
)

SENT_WHILE_WORKING_RE = re.compile(
    r"^_\(sent while the assistant was working\)_\n\n"
)
CODE_FENCE_RE = re.compile(r"```.*?```", re.S)

# Accents/inverted punctuation folded away before matching confirmation words.
_ACCENT_MAP = str.maketrans("áéíóúÁÉÍÓÚñÑ¡¿", "aeiouAEIOUnN  ")

CONFIRMATION_VOCAB = {
    "si", "sí", "dale", "continua", "su", "vamos", "con", "ello",
    "aplicalo", "aplicalos", "aplícalo", "aplícalos", "haz", "el", "commit",
    "hazlo", "ok", "yes", "adelante",
}

INTRO_OLD = "tool calls\nare summarised in one line each."
INTRO_NEW = (
    "tool calls\nare summarised as counts, and review and memory bookkeeping "
    "is omitted."
)


def _parse_tool_line(line):
    """Return (tool_name, description) for a `- \\`Tool\\` — ...` line, or None."""
    m = TOOL_LINE_RE.match(line)
    if not m:
        return None
    tool, rest = m.group(1), m.group(2)
    if tool == "Bash":
        cm = BASH_CMD_RE.match(rest)
        if cm:
            return tool, cm.group("desc")
    return tool, rest


def _summarize_tool_block(match):
    lines = match.group("body").split("\n")
    kept = []
    for line in lines:
        if ENGRAM_RE.search(line) or GENTLE_RE.search(line):
            continue
        parsed = _parse_tool_line(line)
        if parsed and parsed[0] == "Bash" and BASH_CEREMONY_RE.search(parsed[1]):
            continue
        kept.append((line, parsed))

    if not kept:
        return ""

    counts = Counter((parsed[0] if parsed else "?") for _, parsed in kept)
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    summary = "_({} tool calls: {})_".format(
        len(kept), ", ".join(f"{n} {tool}" for tool, n in ordered)
    )

    notable = []
    for line, parsed in kept:
        if not parsed:
            continue
        tool, desc = parsed
        if tool == "Agent" or (tool == "Bash" and NOTABLE_BASH_RE.search(desc)):
            notable.append(line)

    if notable:
        return summary + "\n" + "\n".join(notable) + "\n"
    return summary + "\n"


def _is_gentle_consent(quote):
    low = quote.lower()
    if "gentle ai" in low or "gentle-ai" in low:
        return True
    return "revis" in low and "cambio" in low


def _replace_blocking(match):
    if _is_gentle_consent(match.group("quote")):
        return f"_[Gentle AI review consent: {match.group('answer').strip()}]_\n"
    return match.group(0)


def _is_ceremony_assistant(body):
    text = body.strip()
    if len(text.splitlines()) > 3:
        return False
    return bool(CEREMONY_RE.search(text))


def _replace_assistant(match):
    if _is_ceremony_assistant(match.group("body")):
        return ""
    return match.group(0)


def _normalize_words(text):
    folded = text.translate(_ACCENT_MAP).lower()
    folded = re.sub(r"[^a-z\s]", " ", folded)
    return [w for w in folded.split() if w]


def _is_confirmation(body):
    stripped = SENT_WHILE_WORKING_RE.sub("", body.strip()).strip()
    plain = CODE_FENCE_RE.sub("", stripped).strip()
    if not plain:
        plain = stripped
    if not plain or len(plain) > 40:
        return False
    words = _normalize_words(plain)
    if not words:
        return False
    return all(w in CONFIRMATION_VOCAB for w in words)


def _replace_human(match):
    body = match.group("body")
    if _is_confirmation(body):
        return f"**Human:** «{body.strip()}»\n\n"
    return match.group(0)


def strip_leaked_tags(text):
    text = re.sub(r"<usage>.*?</usage>", "", text, flags=re.S)
    text = re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S)
    # A raw <task-notification> is the harness attachment export_conversation.py
    # itself always converts into the "_[Background agent finished and reported
    # back]_" marker (see its `kind == "attachment"` handling). In hand-edited
    # transcripts that conversion sometimes didn't happen, leaving the raw XML
    # (with a substantive <result>...) inline. Collapse it to that same marker
    # instead of deleting it outright, so the "a background agent finished
    # here" signal survives even though the internal tag noise does not.
    text = re.sub(
        r"<task-notification>.*?</task-notification>",
        "_[Background agent finished and reported back]_",
        text,
        flags=re.S,
    )
    text = re.sub(r"<task-notification[^>]*>", "", text)
    text = "\n".join(
        line for line in text.split("\n") if not line.strip().startswith("<command-")
    )
    return text


def collapse_blank_lines(text):
    return re.sub(r"\n{4,}", "\n\n", text)


def update_intro(text):
    return text.replace(INTRO_OLD, INTRO_NEW)


def compact_text(text):
    text = strip_leaked_tags(text)
    text = ASSISTANT_RE.sub(_replace_assistant, text)
    text = BLOCKING_RE.sub(_replace_blocking, text)
    text = HUMAN_RE.sub(_replace_human, text)
    text = TOOL_BLOCK_RE.sub(_summarize_tool_block, text)
    text = update_intro(text)
    text = collapse_blank_lines(text)
    return text.strip("\n") + "\n"


def compact_file(path):
    p = Path(path)
    original = p.read_text(encoding="utf-8")
    compacted = compact_text(original)
    with open(p, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(compacted)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        compact_file(arg)
