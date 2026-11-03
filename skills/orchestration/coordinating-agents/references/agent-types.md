# Agent-type notes

How the agents running inside the orchestrator ask questions and change modes. Checked against Claude Code 2.1.287 and Codex 0.159.3, and again on 2026-11-03 against Claude Code 2.1.317, Codex 0.166.0 and Antigravity CLI (`agy`) 1.4.12. The agent's installed help (`codex features list`, `claude --help`, `agy --help`) wins over this file.

## Codex

- In its default mode Codex has no option dialog (`request_user_input`): it asks in plain text. Treat that text as the question.
- `/plan` enters Plan mode, where Codex asks through option dialogs. Plan mode also switches the effort to `medium`: report the change and agree on the effort with the person before handing work over in that mode.
- `codex --enable default_mode_request_user_input` turns option dialogs on in the default mode. The flag is marked under development and is off by default; `codex features list` shows its state. Launch with it only once the person agrees.
- Its dialog offers "None of the above" plus a free note with Tab, and it often marks one option "(Recommended)" without being asked: that mark is the agent's opinion.
- The model goes in `-m <id>` and the effort in `-c model_reasoning_effort=<level>` or in a profile passed with `-p`; `--dangerously-bypass-approvals-and-sandbox` removes both approvals and the sandbox, which is wider access.

## Claude Code

- Its option dialog works in every mode and offers "Other" for a free answer.
- `--model` and `--effort` set the session's values at launch. `/model` and `/effort` inside a running session also save them as the person's default, so prefer relaunching with flags.
- `--dangerously-skip-permissions` skips every permission prompt, which is wider access.

## Antigravity CLI

- `--model <id>` and `--effort <level>` set the session's values; `agy models` lists the IDs, some with the effort in a `-low`, `-medium` or `-high` suffix.
- `--mode accept-edits|auto|plan` sets the execution mode, and `--sandbox` restricts its terminal. A mode switch can change what it asks and when: read the indicator again after any switch.
- `--dangerously-skip-permissions` auto-approves every tool request, which is wider access.
- How its questions appear on screen is not verified here: read the screen and treat a plain-text question as the question.
