# Agent-type notes

How the agents running inside the orchestrator ask questions and change modes. Checked against Claude Code 2.1.287 and Codex 0.159.3. The agent's installed help (`codex features list`, `claude --help`) wins over this file.

## Codex

- In its default mode Codex has no option dialog (`request_user_input`): it asks in plain text. Treat that text as the question.
- `/plan` enters Plan mode, where Codex asks through option dialogs. Plan mode also switches the effort to `medium`: report the change and agree on the effort with the person before handing work over in that mode.
- `codex --enable default_mode_request_user_input` turns option dialogs on in the default mode. The flag is marked under development and is off by default; `codex features list` shows its state. Launch with it only once the person agrees.
- Its dialog offers "None of the above" plus a free note with Tab, and it often marks one option "(Recommended)" without being asked: that mark is the agent's opinion.

## Claude Code

- Its option dialog works in every mode and offers "Other" for a free answer.
