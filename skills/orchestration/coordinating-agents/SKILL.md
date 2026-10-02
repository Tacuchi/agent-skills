---
name: coordinating-agents
description: "Coordinates coding agents run by a multi-agent orchestrator (Herdr, Orca, teamctl, Dorothy, Pylon or another): delegates bounded tasks, verifies the effective model and effort, follows states and questions, and recovers sessions without impersonating human authorizations. Use it when the person asks to coordinate, supervise, dispatch to or monitor agents in an orchestrator's panes, terminals, workers or worktrees. Not for a host's built-in subagent tool, and not for choosing how to plan the work."
---

# Coordinating agents under an orchestrator

This guide works on its own in any host that can drive an orchestrator through its CLI, API or MCP tools. It does not install agents, configure the host or create panes, terminals or workers by default. If the orchestrator's interface is missing, or there is no access to an authorized session, explain the precondition and stop: do not attribute started tasks or results to an agent you could not observe.

## Pick the adapter

1. Identify the orchestrator from the person's words and from the environment (an injected variable, a running app, a team file).
2. Read only the reference file for that orchestrator, before the first command:
   - Herdr: [references/herdr.md](references/herdr.md).
   - Orca: [references/orca.md](references/orca.md).
   - teamctl: [references/teamctl.md](references/teamctl.md).
   - Dorothy: [references/dorothy.md](references/dorothy.md).
3. For any other orchestrator (Pylon, a tmux wrapper, an IDE panel), read its installed help or docs and answer every row of the primitives table below before acting. If it offers no way to read an agent's output or state, coordinate through the person: tell them what to send and ask what they see.
4. When the orchestrator's installed help or version-matched guide differs from a reference file, the installed help wins: a reference records mappings and traps, not a complete CLI.

| Primitive | Establish from the help before relying on it |
|---|---|
| Locate | How to list sessions, panes, terminals or workers, and which handle stays stable. |
| Start | How an agent is launched, where it runs and what "ready" means. |
| Verify | Where the effective model, effort and permission mode are shown. |
| Send | How a task is delivered and what the acceptance response proves. |
| Wait | Which states exist and how to wait for one with a timeout. |
| Read | How to read the agent's recent output or screen. |
| Answer | How a question or permission dialog is answered: keys, a reply, or an approval command. |
| Isolate | Whether agents share a checkout or get a worktree each. |
| Relocate | How to find the same agent and task again after a restart. |

## Scope and boundaries

- Ask for the goal, the repository or working directory, the read and write limits, the agent type and the allowed effects. Read only what you need from the agent's output and from the authorized checkout; do not copy credentials, private transcripts or out-of-scope files into prompts or reports. Write only to authorized destinations, and make clear which agent will make each change. Do not make commits, publications or irreversible changes on the person's behalf.
- Check the installed help before acting, for each operation you use. Options, agent types and model/effort gestures vary between orchestrators and versions; the agent's screen or the orchestrator's launch record confirms the effective values, not the launch argument or an assumption about the profile.
- If several agents share files or a stateful resource, agree on ownership and write order; prefer the orchestrator's per-task worktree when it has one and the person accepts it. Serialize only the stretch that needs it, with a generic mechanism suited to the context. Do not invent a global lock or manage other people's agents.
- A request for permission, a spend of quota/resources, a commit, a publication, an irreversible change or wider access goes back **verbatim to the person**, with its context and every visible alternative. Launching an agent with a permission-skipping flag, an autonomy level above the default or a remote placement is wider access too. Wait for an explicit written answer to **that** request; do not choose or press keys on their behalf, do not infer authorization from earlier instructions, and do not delegate it to the blocked agent. If the person does not answer, keep the block. Relay only the option they authorized, then check its receipt and the state that follows. A general authorization given earlier ("answer the routine ones yourself") is not the answer to **that** request. The host's permission policies still apply: if the host blocks sending keys, prompts or replies to another agent's dialog, do not look for another way; summarize for the person the question, its options and the agent's recommendation, and let them answer in the orchestrator's own interface.

## Observable cycle

1. **Locate.** List the orchestrator's sessions, panes, terminals or workers and find the right one; inspect it before acting if there is ambiguity. If the environment exposes a project registry (a CLI that lists projects with their folders), use it to pick the destination, and open the agent in that project's folder. Create a new pane, terminal, worker or worktree only once the destination and the layout are agreed; do not close or replace other people's. Keep the task ↔ handle relationship; do not rely only on an agent name.
2. **Start.** Check the start command's help and the agent type actually available. Pass only the options its help confirms. Success means the orchestrator detected the agent and it is ready for input, not that the task has started. If the destination is busy or the type is not supported, stop and rethink the choice; do not force the process.
3. **Verify before the handoff.** Read the agent's output and compare its banner or indicator, the effective model and effort, the permission mode, the session and the readiness with the agreed task. If you adjust model or effort through that agent's own UI, wait for it to update, read the screen again and only then confirm. If they are not shown or they differ, report the uncertainty and ask before using a different configuration.
4. **Delegate.** Send a bounded task with goal, relative path or destination, read/write limits, expected test and stop conditions. An accepted send proves delivery to the orchestrator, not that the agent read, ran or finished it; a wait that does not track turns may match the end of another task if the agent was already working. Read the output again to check that it received **this** task. If receipt is uncertain, inspect before resending, to avoid duplicate instructions; use the orchestrator's idempotent retry when it has one.
5. **Follow.** Wait for observed states with a suitable timeout, then read the output. A timeout, an unknown state or output that does not change proves neither failure nor success; record what you observed and reassess. A wait for one specific output signal serves that signal, not to credit the whole task.
6. **Close the task, not the agent.** On `done` or `idle`, read the output anyway: it may hold a question, a permission or an error. Check the task's deliverable and validation against the evidence in the checkout or the agent's output. Report what is complete, what is unverified and what is pending; do not attribute to the person an approval they did not write.

Map the orchestrator's own state names onto these five before acting; each reference file lists its mapping. An orchestrator with no state detection yields `unknown` until you read the output.

| Observed signal | Next action before reporting |
|---|---|
| `working` | Wait or read progress; do not interrupt or send a second uncertain instruction. |
| `blocked` | Read the output, take the question and its options to the person and wait for a specific authorization; confirm receipt after relaying it. |
| `idle` | Read the output: it may be waiting on a question or the next task; check the previous result before concluding. |
| `done` | Read the output and verify the deliverable/tests of that specific task before declaring it concluded, even when the reported outcome is a success. |
| `unknown` | Read the output, review detection or liveness and keep the state as uncertain; do not repeat or declare success. |

## Questions, restarts and recovery

- On a block, read the full text of the request and present its alternatives to the person with the effect of each one. Do not send keys, prompts or replies to answer until you receive the explicit choice. Answer through the channel the request uses: keys for a terminal dialog, a reply for a message-bus question, an approve/deny command for an approval queue. Read the output again and, if receipt is not confirmed, keep the question pending without assuming the answer arrived. An answer sent right before a disconnection is also uncertain.
- A dialog with several tabs is read in full before taking it to the person: walk through it without choosing (navigation keys vary between agents) and read the screen again after each key, because the refresh may arrive late. When relaying authorized choices, send only when the review screen shows every answer; if one is missing, complete that tab before sending.
- After a restart or a session change, names and handles may be lost or reassigned. Relocate with the identifier you kept and by reading the output, to check it is the expected session and task; send to one handle only, never to the old and the new one both. Do not send "continue" or repeat the task until you have checked what the instance received and what it ran; if that cannot be shown, ask the person how to recover.
- If the handle changes, the output does not reflect the model/effort after the pause, another instance appears or the evidence contradicts the state, stop, inspect and report the uncertainty. An authorization for one question does not carry over to another, even if they look alike.

## Synthetic examples

- **Blocked:** an agent asks "publish now? Yes / No". Take both options to the person. With the written answer "No", relay "No", read the output again to check receipt and keep the result without claiming a publication.
- **General authorization:** the person said earlier "answer the routine ones yourself", and an agent asks to accept a route proposal. That does not answer this request: summarize the proposal and its options, ask for the choice and, if the host blocks sending, let the person answer in the orchestrator's interface.
- **Uncertain send:** the orchestrator accepts "review module", but the output still shows the previous task. Read again and wait for a sign of receipt; do not resend blindly or declare the review finished.
- **Restart:** the agent's name no longer resolves. Find the associated handle and read its output; resume following only after identifying the instance and the last task.
- **Model:** after selecting another variant or effort, the banner still shows the previous one. Wait and read again; until it reflects the change, do not report the new value as effective.
- **Launch default:** the orchestrator starts agents with permissions skipped unless told otherwise. Start it with permissions enforced, or ask the person first; skipping is wider access.
- **Finished:** `done` appears and the output reports a path and passing tests. Check that path and the test output in the authorized checkout; only then report that task as complete.

## Invariants to keep in mind

- An accepted send is not receipt, and a state is not a result: read the output and check the evidence.
- Permission, quota/resources, commit, publication, irreversible changes and wider access go back verbatim to the person, one request at a time.
- The effective model, effort and permission mode are the ones the agent or its launch record shows.
