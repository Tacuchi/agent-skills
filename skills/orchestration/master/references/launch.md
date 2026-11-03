# Launching agents and reading quota

Read this before you start an agent or pick a provider. Checked on 2026-11-03 against Claude Code 2.1.317, Codex 0.166.0 and Antigravity CLI (`agy`) 1.4.12. Each CLI's `--help` wins over this file.

## Launch flags

| Agent | Unrestricted | Model | Effort | Available models |
|---|---|---|---|---|
| Claude Code | `--dangerously-skip-permissions` | `--model <id>` | `--effort low\|medium\|high\|xhigh\|max` | aliases and IDs in `claude --help` |
| Codex | `--dangerously-bypass-approvals-and-sandbox` | `-m <id>` | `-c model_reasoning_effort=<level>`, or a profile with `-p <name>` | `model` in `~/.codex/config.toml` and its profiles |
| Antigravity | `--dangerously-skip-permissions` | `--model <id>` | `--effort <level>`, or a model variant ending in `-low`, `-medium` or `-high` | `agy models` |

Example, Claude Code for an agreed plan:

```sh
cd '/path/to/repo' && claude --dangerously-skip-permissions --model claude-opus-5-5 --effort medium
```

- Start every agent interactive. A one-shot print or exec mode leaves nothing to watch, steer or ask a second turn.
- Confirm the banner or status line shows the model, effort and permission mode before sending the task; the flag you passed is a request, the screen is the fact.
- Change model or effort by relaunching with flags. In Claude Code, `/model` and `/effort` inside a running session also save the value as the person's default.
- If Codex ignores or mishandles a `-c` override, launch it with a profile (`-p`) that sets the model and effort instead.
- Codex in its default mode asks questions as plain text; treat that text as the question. Claude Code and Antigravity show option dialogs.
- For any other agent, read its `--help` for the four columns above before launching it.

## Quota

`openusage` (add a provider name, such as `openusage codex`, for one) prints JSON from a shared five-minute cache without spending quota; `--force` refreshes it. Each provider lists `resources.<window>` with `remaining` (a percentage), `resetsAt` and `windowSeconds`.

| Provider | Windows | Drawn on by |
|---|---|---|
| Claude | `session` (5 h), `weekly`, plus per-model weekly buckets | Claude Code |
| Codex | `session`, `weekly` | Codex |
| Antigravity | `session` and `weekly`, split into Gemini and non-Gemini | `agy`: Gemini models draw on the Gemini windows; Claude and other models inside `agy` draw on the non-Gemini ones |
| OpenRouter | credits | agents configured with an OpenRouter key |

- Read the weekly window first: it is the one that stops a run for days.
- `rateLimitResets.available` counts redeemable resets. Redeeming one, or spending paid credits, needs the person's answer every time.
- Orchestrating from an agent spends that agent's provider too. When your own provider is low, delegate the token-heavy parts and keep your own turns to reading panes and deciding.
