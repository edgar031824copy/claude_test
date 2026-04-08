# Claude Code in Action — Course Summary

---

## CLAUDE.md — 3 Levels of Configuration

| Level    | File                  | Scope                                         |
| -------- | --------------------- | --------------------------------------------- |
| Project  | `CLAUDE.md`           | Shared with team, committed to source control |
| Personal | `CLAUDE.local.md`     | Local tweaks, not committed                   |
| Global   | `~/.claude/CLAUDE.md` | Applies to all projects on your machine       |

---

## Key CLI Tricks

- `#` — Memory mode: intelligently edit CLAUDE.md with custom instructions
- `@` — Mention agents, skills, or tools
- `Ctrl+V` — Paste a screenshot directly into the chat
- `Esc` — Interrupt Claude mid-task (saves quota)
- `Esc Esc` — Open history / rewind to a previous point in the conversation
- `~50% context used` → run `/compact` to summarize older messages
- `/btw` — Ask a quick side question without interrupting Claude's current work
- `--resume` — Resume a previous session by its ID, picking up exactly where you left off
- `/rename` — Rename the current session for easier identification when resuming later

---

## Claude Pro vs. Claude API

|             | Claude Pro (claude.ai) | Claude API (platform.anthropic.com) |
| ----------- | ---------------------- | ----------------------------------- |
| Who uses it | You, as a user         | Your app, programmatically          |
| Billed      | Subscription           | Per API token usage                 |
| Use case    | Chat assistant         | Integrate Claude into your product  |

---

## Custom Commands

Create `.claude/commands/your-command.md` → available as `/your-command` in the CLI.
Supports `$ARGUMENT` for dynamic input.

```
/write_tests src/components/HeaderActions.tsx
```

## Hooks — Run Commands Around Tool Calls

Configured in `.claude/settings.json` (project), `~/.claude/settings.json` (global), or `.claude/settings.local.json` (local, not committed).

```json
"hooks": {
  "PreToolUse": [{ "matcher": "Read", "hooks": [{ "type": "command", "command": "..." }] }]
}
```

- **PreToolUse** — validate or block before a tool runs (e.g., block reads on `.env`)
- **PostToolUse** — format, test, or log after a tool runs (e.g., auto-format after Edit)

---

## GitHub Integration

- `/install-github-app` — automates workflow setup end-to-end
- If it fails → manual setup:
  1. Install Claude GitHub App on the repo
  2. Add `.github/workflows/claude.yml` using `anthropics/claude-code-action@v1`
  3. Add `ANTHROPIC_API_KEY` secret in repo Settings → Secrets
  4. Trigger with `@claude ...` in a PR comment

**GitHub MCP Server** — once configured in `.mcp.json`, Claude can interact with GitHub directly from the CLI:
- Read PR comments, review status, list issues
- Address a PR comment and push the fix without leaving the terminal

---

## Claude Code SDK

Run Claude programmatically inside your tooling — same behavior as the CLI.

```ts
import { query } from "@anthropic-ai/claude-code";

for await (const message of query({ prompt: "...", options: { ... } })) {
  // stream results
}
```

- Supports TypeScript, Python, CLI
- Good for: code analysis, review pipelines, automated refactors, agent tasks
- Default: read-only/safe permissions — explicitly allow more when needed
