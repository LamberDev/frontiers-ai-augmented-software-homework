"""Export a Claude Code session JSONL to a scrubbed Markdown transcript.

Keeps: human prompts, assistant replies, one-line tool-call summaries and the
human's answers to blocking questions. Drops: model thinking, raw tool results
and system/harness attachments. Scrubs personal data per docs/ai/SHARING.md.

Usage:
    python docs/ai/tools/export_conversation.py <session.jsonl> <output.md> "<title>"

Personal terms (employer domain, real name, OS username...) must never be
committed. Put them, one per line, in docs/ai/tools/scrub.local.txt (ignored by
git); each line is replaced case-insensitively by "<redacted>".
"""
import json
import re
import sys
from pathlib import Path

LOCAL_TERMS = Path(__file__).with_name("scrub.local.txt")
ALLOWED_EMAILS = {"noreply@anthropic.com"}

SCRUB = [
    (re.compile(r"[A-Za-z]--Users-[^\s/\\'\"`]+"), "<project-dir>"),
    (re.compile(r"[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s'\"`]+", re.I), "<home>"),
    (re.compile(r"(?:/[a-z])?/(?:Users|home)/[^/\s'\"`]+"), "<home>"),
    (re.compile(r"\b[A-Z0-9]{1,6}~\d(?:\.[A-Z0-9]{1,3})?\b"), "<user>"),
    (re.compile(r"toolu_[A-Za-z0-9]+"), "<tool-use-id>"),
    (re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b"), "<session-id>"),
]
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")


def load_local_terms():
    if not LOCAL_TERMS.exists():
        return []
    terms = [t.strip() for t in LOCAL_TERMS.read_text(encoding="utf-8").splitlines()]
    # Longest first so "name.surname" is replaced before "name".
    return sorted((t for t in terms if t and not t.startswith("#")), key=len, reverse=True)


TERMS = [re.compile(re.escape(t), re.I) for t in load_local_terms()]


def scrub(text):
    text = EMAIL.sub(lambda m: m.group(0) if m.group(0).lower() in ALLOWED_EMAILS else "<email>", text)
    for pattern, repl in SCRUB:
        text = pattern.sub(repl, text)
    for pattern in TERMS:
        text = pattern.sub("<redacted>", text)
    return text


def strip_tags(text):
    text = re.sub(r"<system-reminder>.*?</system-reminder>", "", text, flags=re.S)
    text = re.sub(r"<pasted_content[^>]*>", "\n```text\n", text)
    text = re.sub(r"</pasted_content[^>]*>", "\n```\n", text)
    return text.strip()


def quote(text):
    return "\n".join("> " + line if line else ">" for line in text.splitlines())


def tool_summary(block):
    name, inp = block.get("name", ""), block.get("input", {}) or {}
    short = name.replace("mcp__engram__", "engram.").replace("mcp__", "")
    detail = (
        inp.get("description")
        or inp.get("title")
        or inp.get("file_path")
        or inp.get("query")
        or inp.get("judgment_id")
        or ""
    )
    if name == "Bash" and inp.get("command"):
        # Scrub before truncating so a cut can never leave a partial identifier.
        cmd = scrub(inp["command"].split("\n")[0])[:160]
        return f"- `{short}` — {detail}: `{cmd}`"
    return f"- `{short}` — {detail}".rstrip(" —")


def export(src, dst, title):
    out = [f"# {title}", "",
           "Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).",
           "Model thinking, raw tool output and harness attachments are omitted; tool calls",
           "are summarised in one line each.", ""]
    pending_questions = {}
    tool_buffer = []

    def flush_tools():
        if tool_buffer:
            out.append("<details><summary>Tool calls</summary>\n")
            out.extend(tool_buffer)
            out.append("\n</details>\n")
            tool_buffer.clear()

    def human(text):
        flush_tools()
        out.extend(["## Human", "", text, ""])

    for line in open(src, encoding="utf-8"):
        d = json.loads(line)
        kind = d.get("type")
        content = (d.get("message") or {}).get("content")

        if kind == "attachment" and (d.get("attachment") or {}).get("type") == "queued_command":
            human("_(sent while the assistant was working)_\n\n" + d["attachment"]["prompt"])
            continue

        if kind == "user" and isinstance(content, str):
            if content.startswith("<task-notification>"):
                flush_tools()
                out.extend(["_[Background agent finished and reported back]_", ""])
            elif d.get("isMeta") and "Stop hook" in content:
                flush_tools()
                out.extend(["_[Stop hook: RDD asked to run the review preflight for the new commit]_", ""])
            elif not d.get("isMeta"):
                human(strip_tags(content))
            continue

        if kind == "user" and isinstance(content, list):
            for b in content:
                if b.get("type") == "tool_result" and b.get("tool_use_id") in pending_questions:
                    res = b.get("content")
                    res = res if isinstance(res, str) else json.dumps(res)
                    answer = re.findall(r'="([^"]+)"', res)
                    flush_tools()
                    out.extend(["## Human (answer to blocking question)", "",
                                pending_questions.pop(b["tool_use_id"]), "",
                                f"**Answer:** {answer[-1] if answer else res[:200]}", ""])
            continue

        if kind == "assistant" and isinstance(content, list):
            for b in content:
                if b.get("type") == "text" and b.get("text", "").strip():
                    flush_tools()
                    out.extend(["## Assistant", "", b["text"].strip(), ""])
                elif b.get("type") == "tool_use":
                    if b.get("name") == "AskUserQuestion":
                        q = b["input"]["questions"][0]
                        opts = "\n".join(f"- **{o['label']}**: {o['description']}" for o in q["options"])
                        pending_questions[b["id"]] = quote(q["question"]) + "\n\nOptions:\n\n" + opts
                    else:
                        tool_buffer.append(tool_summary(b))

    flush_tools()
    with open(dst, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(scrub("\n".join(out)).rstrip() + "\n")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    export(*sys.argv[1:])
