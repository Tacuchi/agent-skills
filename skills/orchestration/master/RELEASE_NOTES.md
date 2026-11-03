# master 1.0.0

`/master <task>` hands a whole task to the current agent. It decides whether to do the work alone or delegate it to Claude Code, Codex or Antigravity agents in Herdr or Orca panes; it picks each agent's model and effort from the person's profile and the remaining quota; it lays the panes out evenly, launches the agents unrestricted with a bounded brief, follows every pane and reports each part with its evidence.

The invocation itself authorizes unrestricted launches inside the task's folder, quota above the profile's floor and answers to routine questions, for that run only. Commits, publications, destructive changes, production data, quota resets, remote placement and other people's panes still need the person's answer to each request.

Layouts follow one invariant: rows of equal height, and panes of equal width inside each row. The reference files record the cut orders and traps measured on Herdr and Orca, the launch flags of each agent CLI and the profile format.

Acquire the whole `skills/orchestration/master/` directory, including `references/`, from `Tacuchi/agent-skills` once the ref `skill/master/v1.0.0` exists. It works alone; the `coordinating-agents` skill adds the detailed supervision cycle when it is installed.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
