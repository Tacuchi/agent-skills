# The master profile

The profile holds one person's defaults so that `/master` needs no extra instructions. It lives at `${XDG_CONFIG_HOME:-~/.config}/agent-skills/master.md`, outside any repository. Read this file when no profile exists, or when the person asks to create or change it.

## Defaults without a profile

| Key | Default |
|---|---|
| Placement | your own tab, up to four panes; more panes go to new tabs named after the task |
| Minimum pane | 60 columns × 14 rows |
| Quota floor | 15 % weekly remaining |
| Unrestricted launch | yes |
| Models | the strongest model each CLI lists for specs and design, its general model for implementation, its fast tier for mechanical work |
| Workflow effort | specs xhigh, plans high, plan execution medium, small direct tasks high |

## Format

Plain Markdown, one key per bullet, read by the agent; no parser depends on it. Keep it short: every line is read on each run.

```markdown
# master profile

- Placement: Orca: always my own tab. Herdr: my own tab up to 4 panes.
- Minimum pane: 60x14
- Quota floor: 15 % weekly
- Unrestricted launch: yes
- Claude Code: claude-opus-5-5, effort medium for delegated work
- Codex: gpt-6.1-sol, effort high for implementation
- Antigravity: gemini-4-argon-high
- Workflow effort: spec xhigh, plan high, execution medium, quick high
- Reviewers: only when I ask; at most two, one named case each
- Never: put customer personal data in prompts
```

## Rules for the profile

- The person's words in the current request win over the profile; the profile wins over this skill's defaults.
- A profile can narrow the authorization (for example `Unrestricted launch: no`), never widen it: commits, publications, destructive changes, production data, resets and remote placement stay with the person whatever it says.
- When the person states a lasting preference during a run, offer to add it to the profile; write it only after they agree.
