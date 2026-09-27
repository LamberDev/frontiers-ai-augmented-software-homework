"""Tests for compact_conversation.py.

Run with: python -m unittest discover -s docs/ai/tools -p "test_*.py"
"""
import tempfile
import unittest
from pathlib import Path

import compact_conversation as cc


class ToolBlockCompactionTests(unittest.TestCase):
    def test_given_engram_and_gentle_ai_lines_when_compacted_then_only_notable_calls_kept(self):
        # Arrange: a tool block mixing Engram, Gentle AI, plain and notable Bash calls.
        text = (
            "## Assistant\n\n"
            "Trabajo en curso.\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `Bash` — List files: `ls -la`\n"
            "- `engram.mem_save` — use-cases feature tasks\n"
            "- `Bash` — Start granted review: `gentle-ai review start --contract x`\n"
            "- `Agent` — Implement T1 RegisterUser use case\n"
            "- `Bash` — Run tests: `pnpm test`\n"
            "- `Edit` — some/path.ts\n\n"
            "</details>\n\n"
            "## Human\n\nsiguiente paso\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: engram and gentle-ai lines are gone.
        self.assertNotIn("engram.mem_save", result)
        self.assertNotIn("gentle-ai", result)
        # Assert: a single counted summary line replaces the details block.
        self.assertIn("_(4 tool calls:", result)
        self.assertNotIn("<details>", result)
        self.assertNotIn("</details>", result)
        # Assert: notable calls (Agent, and a Bash mentioning tests) are kept verbatim.
        self.assertIn("- `Agent` — Implement T1 RegisterUser use case", result)
        self.assertIn("- `Bash` — Run tests: `pnpm test`", result)
        # Assert: non-notable surviving calls (plain Bash, Edit) are counted but not listed.
        self.assertNotIn("- `Bash` — List files", result)
        self.assertNotIn("- `Edit` — some/path.ts", result)

    def test_given_details_block_with_only_engram_and_gentle_ai_lines_when_compacted_then_block_dropped(self):
        # Arrange
        text = (
            "## Assistant\n\n"
            "Guardo el resultado en memoria.\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `engram.mem_save` — use-cases feature tasks\n"
            "- `engram.mem_judge` — rel-307ab7f0b2096b94\n"
            "- `Bash` — Acknowledge review: `gentle-ai review acknowledge-approved --cwd x`\n\n"
            "</details>\n\n"
            "## Human\n\nok\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: no trace of the block or a tool-count summary for it.
        self.assertNotIn("<details>", result)
        self.assertNotIn("tool calls:", result)
        self.assertNotIn("engram", result)
        self.assertNotIn("gentle-ai", result)

    def test_given_toolsearch_selecting_engram_tools_when_compacted_then_line_dropped(self):
        # Arrange
        text = (
            "## Human\n\nsigue\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `ToolSearch` — select:mcp__engram__mem_save,mcp__engram__mem_search\n"
            "- `Bash` — Build image: `docker build .`\n\n"
            "</details>\n\n"
            "## Assistant\n\nListo.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertNotIn("mcp__engram", result)
        self.assertIn("_(1 tool calls: 1 Bash)_", result)
        self.assertIn("- `Bash` — Build image: `docker build .`", result)


class GentleAiConsentCompactionTests(unittest.TestCase):
    def test_given_gentle_ai_consent_question_when_compacted_then_single_line_with_answer(self):
        # Arrange
        text = (
            "## Human (answer to blocking question)\n\n"
            "> Gentle AI puede revisar este cambio antes de darlo por terminado. "
            "Riesgo: medio. ¿Qué hago con este cambio?\n\n"
            "Options:\n\n"
            "- **Revisar este cambio**: Revisa solo este cambio.\n"
            "- **Omitir esta vez**: Omite solo este cambio.\n\n"
            "**Answer:** Revisar este cambio\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `Bash` — Start granted review: `gentle-ai review start --contract x`\n\n"
            "</details>\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: collapsed to one italic line, no heading, no options list.
        self.assertIn("_[Gentle AI review consent: Revisar este cambio]_", result)
        self.assertNotIn("## Human (answer to blocking question)", result)
        self.assertNotIn("Options:", result)
        self.assertNotIn("Omitir esta vez", result)

    def test_given_non_gentle_ai_blocking_question_when_compacted_then_left_intact(self):
        # Arrange
        text = (
            "## Human (answer to blocking question)\n\n"
            "> ¿Cómo encadeno las PRs a partir de ahora?\n\n"
            "Options:\n\n"
            "- **Stacked a main**: Rama nueva.\n"
            "- **Feature-branch chain**: Cada tarea en su rama.\n\n"
            "**Answer:** Stacked a main\n\n"
            "## Assistant\n\nDe acuerdo.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: untouched.
        self.assertIn("## Human (answer to blocking question)", result)
        self.assertIn("Options:", result)
        self.assertIn("**Answer:** Stacked a main", result)


class CeremonyAssistantSectionTests(unittest.TestCase):
    def test_given_short_ceremony_assistant_section_when_compacted_then_removed(self):
        # Arrange
        text = (
            "## Assistant\n\n"
            "La revisión automática de Gentle AI pide tu permiso para este commit:\n\n"
            "## Human (answer to blocking question)\n\n"
            "> Gentle AI puede revisar este cambio. ¿Qué hago?\n\n"
            "Options:\n\n"
            "- **Revisar este cambio**: Revisa el cambio.\n"
            "- **Omitir esta vez**: Omite la revisión.\n\n"
            "**Answer:** Revisar este cambio\n\n"
            "## Assistant\n\nContinuo con el trabajo.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: the ceremony lead-in paragraph is gone, consent is collapsed.
        self.assertNotIn("pide tu permiso para este commit", result)
        self.assertIn("_[Gentle AI review consent: Revisar este cambio]_", result)
        self.assertIn("Continuo con el trabajo.", result)

    def test_given_assistant_section_with_review_findings_when_compacted_then_kept(self):
        # Arrange
        text = (
            "## Assistant\n\n"
            "La revisión ha salido aprobada. No ha encontrado nada bloqueante, pero deja "
            "2 observaciones:\n\n"
            "| # | Gravedad | Observación |\n"
            "|---|---|---|\n"
            "| 1 | WARNING | Algo raro |\n\n"
            "## Human\n\nGracias, continuemos con T5.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: findings table and text survive untouched.
        self.assertIn("La revisión ha salido aprobada", result)
        self.assertIn("| 1 | WARNING | Algo raro |", result)


class ConfirmationOnlyHumanTurnTests(unittest.TestCase):
    def _assert_collapsed(self, prompt):
        # Arrange
        text = f"## Human\n\n{prompt}\n\n## Assistant\n\nSigo con la tarea.\n"

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertIn(f"**Human:** «{prompt}»", result)
        self.assertNotIn(f"## Human\n\n{prompt}", result)

    def test_given_si_continua_when_compacted_then_folded_to_one_line(self):
        self._assert_collapsed("Si continua")

    def test_given_aplicalos_when_compacted_then_folded_to_one_line(self):
        self._assert_collapsed("aplicalos")

    def test_given_vamos_con_ello_when_compacted_then_folded_to_one_line(self):
        self._assert_collapsed("vamos con ello")

    def test_given_si_hazlo_when_compacted_then_folded_to_one_line(self):
        self._assert_collapsed("si hazlo")

    def test_given_bare_si_when_compacted_then_folded_to_one_line(self):
        self._assert_collapsed("Si")

    def test_given_substantive_short_prompt_when_compacted_then_left_verbatim(self):
        # Arrange: short but a real decision, not a mere confirmation.
        text = "## Human\n\nexpon el guid\n\n## Assistant\n\nDe acuerdo.\n"

        # Act
        result = cc.compact_text(text)

        # Assert: untouched, no heading removed, no «» marker.
        self.assertIn("## Human\n\nexpon el guid", result)
        self.assertNotIn("«expon el guid»", result)

    def test_given_decline_instruction_when_compacted_then_left_verbatim(self):
        # Arrange: short, but a substantive decision ("no lo revises"), not a confirmation.
        text = "## Human\n\nno lo revises\n\n## Assistant\n\nHecho.\n"

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertIn("## Human\n\nno lo revises", result)

    def test_given_confirmation_with_trailing_tool_block_when_compacted_then_block_kept_separately(self):
        # Arrange
        text = (
            "## Human\n\naplicalos\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `Edit` — odd/tasks/use-cases.md\n\n"
            "</details>\n\n"
            "## Assistant\n\nHecho.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: the human turn folds, the following tool block survives as its own summary.
        self.assertIn("**Human:** «aplicalos»", result)
        self.assertIn("_(1 tool calls: 1 Edit)_", result)


class LeakedTagStrippingTests(unittest.TestCase):
    def test_given_leaked_internal_tags_when_compacted_then_stripped(self):
        # Arrange
        text = (
            "## Human\n\n"
            "<system-reminder>hidden system text</system-reminder>\n"
            "<usage>1234 tokens</usage>\n"
            "<command-name>foo</command-name>\n"
            "<task-notification>agent done</task-notification>\n"
            "Este es el prompt real.\n\n"
            "## Assistant\n\nListo.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertNotIn("system-reminder", result)
        self.assertNotIn("hidden system text", result)
        self.assertNotIn("<usage>", result)
        self.assertNotIn("1234 tokens", result)
        self.assertNotIn("<command-name>", result)
        self.assertNotIn("<task-notification>", result)
        self.assertIn("Este es el prompt real.", result)


class BlankLineCollapseTests(unittest.TestCase):
    def test_given_three_or_more_blank_lines_when_compacted_then_collapsed_to_one(self):
        # Arrange
        text = "A\n\n\n\n\nB\n"

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertEqual("A\n\nB\n", result)

    def test_given_two_blank_lines_when_compacted_then_left_alone(self):
        # Arrange: only 2 blank lines (not 3+), must not be touched by this rule.
        text = "## Human\n\nA\n\n\n## Assistant\n\nB\n"

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertIn("A\n\n\n## Assistant", result)


class IntroWordingTests(unittest.TestCase):
    def test_given_original_intro_sentence_when_compacted_then_wording_updated(self):
        # Arrange
        text = (
            "# Session\n\n"
            "Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).\n"
            "Model thinking, raw tool output and harness attachments are omitted; tool calls\n"
            "are summarised in one line each.\n\n"
            "## Human\n\nhola\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert
        self.assertNotIn("are summarised in one line each.", result)
        self.assertIn("are summarised as counts", result)
        self.assertIn("review and memory bookkeeping is omitted", result)


class IdempotencyTests(unittest.TestCase):
    def test_given_already_compacted_text_when_compacted_again_then_output_is_unchanged(self):
        # Arrange
        text = (
            "# Session\n\n"
            "Exported from a Claude Code session and scrubbed per [../SHARING.md](../SHARING.md).\n"
            "Model thinking, raw tool output and harness attachments are omitted; tool calls\n"
            "are summarised in one line each.\n\n"
            "## Human\n\nQue nos queda por hacer\n\n"
            "<details><summary>Tool calls</summary>\n\n"
            "- `Bash` — List repo: `ls`\n"
            "- `engram.mem_save` — note\n\n"
            "</details>\n\n"
            "## Assistant\n\n"
            "La revisión automática de Gentle AI pide tu permiso para este commit:\n\n"
            "## Human (answer to blocking question)\n\n"
            "> Gentle AI puede revisar este cambio. ¿Qué hago?\n\n"
            "Options:\n\n"
            "- **Revisar este cambio**: Revisa el cambio.\n"
            "- **Omitir esta vez**: Omite la revisión.\n\n"
            "**Answer:** Revisar este cambio\n\n"
            "## Human\n\nsi hazlo\n\n"
            "## Assistant\n\nHecho, sigo con T2.\n"
        )

        # Act
        once = cc.compact_text(text)
        twice = cc.compact_text(once)

        # Assert
        self.assertEqual(once, twice)


class VerbatimPreservationTests(unittest.TestCase):
    def test_given_mixed_transcript_when_compacted_then_non_confirmation_prompts_survive_verbatim(self):
        # Arrange
        original_prompts = [
            "Que nos queda por hacer en el backend para concluir la tarea",
            "una cosa es el dominio y otra el contrato",
            "expon el guid",
        ]
        text = (
            "## Human\n\nQue nos queda por hacer en el backend para concluir la tarea\n\n"
            "## Assistant\n\nComparando el enunciado...\n\n"
            "## Human\n\nuna cosa es el dominio y otra el contrato\n\n"
            "## Assistant\n\nTienes razón.\n\n"
            "## Human\n\nexpon el guid\n\n"
            "## Assistant\n\nDe acuerdo.\n\n"
            "## Human\n\nsi\n\n"
            "## Assistant\n\nSeguimos.\n"
        )

        # Act
        result = cc.compact_text(text)

        # Assert: every non-confirmation prompt is present verbatim.
        for prompt in original_prompts:
            self.assertIn(prompt, result)
        # And the confirmation-only turn is folded.
        self.assertIn("**Human:** «si»", result)


class CliFileHandlingTests(unittest.TestCase):
    def test_given_file_path_when_compacted_then_rewritten_in_place_utf8_unix_newlines(self):
        # Arrange
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.md"
            path.write_text(
                "## Human\n\nsi hazlo\n\n## Assistant\n\nHecho.\n",
                encoding="utf-8",
                newline="\n",
            )

            # Act
            cc.compact_file(str(path))
            raw = path.read_bytes()

            # Assert: no CRLF, valid UTF-8, and content was compacted.
            self.assertNotIn(b"\r\n", raw)
            text = raw.decode("utf-8")
            self.assertIn("**Human:** «si hazlo»", text)

    def test_given_already_compacted_file_when_run_twice_then_idempotent(self):
        # Arrange
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "sample.md"
            path.write_text(
                "## Human\n\nsi hazlo\n\n## Assistant\n\nHecho.\n",
                encoding="utf-8",
                newline="\n",
            )

            # Act
            cc.compact_file(str(path))
            first = path.read_text(encoding="utf-8")
            cc.compact_file(str(path))
            second = path.read_text(encoding="utf-8")

            # Assert
            self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
