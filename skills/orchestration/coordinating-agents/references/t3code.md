# T3 Code adapter

T3 Code is a desktop and web app that runs each agent as a **thread** of a project, on a local server. It has no panes or tabs to arrange: one agent, one thread. Checked against the `--help` of the `t3` CLI 0.1.9 and the orchestration notes bundled with the app 0.1.9, on macOS on 2026-11-14; no thread was started. The installed help wins over this file, and so do the notes the app gives its own agents.

## Detect

- Inside a T3 Code thread, the host offers T3 tools such as `orchestrator_capabilities`, `delegate_task` and `t3_thread_read`.
- From any shell, the `t3` CLI talks to the running server: `t3 thread list --project <path>`.
- If neither is available, or the server is not running, explain the precondition and stop.

## Primitives

| Primitive | T3 Code mechanism (CLI) |
|---|---|
| Locate | `t3 thread list --project <path> --json`, newest first. The folder must be a T3 Code project; `t3 project add <path>` registers one durably, so ask the person first. |
| Start | `t3 thread start <project> "<task>" --provider <id> --model <slug> --json` prints the thread id. `--worktree <ref>` with `--branch <name>` runs it in a new git worktree. |
| Verify | `t3 thread show <thread> --json`: the thread's state and its latest messages. The CLI has no effort or permission flag: report the provider and model the thread shows, and the rest as not verifiable. |
| Send | `t3 thread send <thread> "<message>"`: a busy thread takes it as its next turn, and nothing is interrupted. |
| Wait | `--wait` on `start` or `send` waits for the agent to finish and prints its reply. |
| Read | `t3 thread show <thread> --messages <n>`. |
| Answer | `t3 thread send <thread> "<the authorized option>"`. |
| Place | Nothing to place: each agent is its own thread, so your own view is never split. |
| Isolate | The project folder by default; `--worktree` gives the thread its own checkout. |
| Relocate | Thread ids persist: `t3 thread list`, then `t3 thread show`. |

State mapping, from the exit code of `--wait` and from `t3 thread show`:

- Exit 0 → `done`: read the reply.
- Exit 1 → `done` with a failure: read the thread.
- Exit 2 → `blocked`: the thread waits for an answer.
- A run in progress in `thread show` → `working`; a thread with no run in progress → `idle`.
- A timeout, a server that does not answer or any other value → `unknown`.

## Traps

- **Starting a thread starts work.** There is no shell to prepare first: `thread start` spends the provider's quota at once. Agree on the provider and the model before, and check the quota first.
- **Inside a thread, T3 Code's own notes apply.** In 0.1.9 they send delegated work through `delegate_task`, after one `orchestrator_capabilities` call per thread, and keep new top-level threads (`t3_thread_launch`, `create_threads`) for when the person asks for a new thread. Follow the notes the app gives you.
- **Running delegates.** Those notes ask you not to poll a running delegate and to stop one you no longer need with `task_cancel`.
- **Secrets.** A login, token or password that only the person can give goes through `request_secret`, never through the chat.
- **Another machine.** A linked environment (`t3 environment`, `t3_environment_links`) is a remote placement, which is wider access.
- **Model and effort.** A delegate's settings go in `target.options`; report what the thread shows, never what you asked for.
