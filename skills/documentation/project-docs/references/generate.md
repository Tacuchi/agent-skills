# `generate <repo>`

Documents a repository that has no `ARCHITECTURE.md`. Follow the steps in order. Read [format.md](format.md) before step 5.

## 1. Check the ground

1. Run the preflight and apply its rules from the main file of this skill.
2. Find the branch the repository declares for work. If none is declared, ask on which branch to write.
3. If the repository has pending changes, show them and ask before editing.

## 2. Read the code

Read until you can explain what runs, what it talks to and where it keeps its data. Note every fact with its `path:start-end`. Keep the notes outside the repository.

Look for, at least:

- entry points and the manifest: commands, scripts, version;
- what reads configuration: files, environment variables, defaults;
- every network call: URLs, hosts, ports it listens on, sockets;
- where it stores data, and what it writes outside its own folder;
- processes that stay running, and who starts and stops them;
- build, packaging and deployment files;
- comments and commits that state why something was chosen.

When the repository is one part of a system of several repositories, read the `ARCHITECTURE.md` of each sibling that has one and use the same names for the shared parts. Each run still documents one repository.

A file that exists is not a feature that is supported. When the code and the README disagree, note both and ask in step 4.

## 3. Sort the facts

Split the notes in two:

- **Defaults and structure:** they go in the published set.
- **Measured on this machine:** they stay out. Convert each with the table at the end of [format.md](format.md), or drop it.

## 4. Ask only the gaps

One round, at most four questions, with the structured question tool. Read the preferences file first, when the preflight names one. Ask only what neither the code nor that file answers. Typical gaps:

- the purpose in the person's words, and what the project is not;
- the reason for a decision the code shows but does not explain. Always offer "Not recorded yet" as an option;
- the contribution policy for the README;
- the language, when there is no README.

A reason found in a document outside the repository, such as a design note the person keeps elsewhere, counts only after the person confirms it. Record that the person confirmed it and what kind of document states it; never write a path to a place outside the repository.

Write the person's answers as theirs. Anything nobody answered is "Not recorded yet".

## 5. Draw the two diagrams

Follow [diagrams.md](diagrams.md): one context diagram and one container diagram, each with its source, its page and its exported image in `docs/architecture/`.

## 6. Write `ARCHITECTURE.md`

1. Copy [the template](../assets/ARCHITECTURE.md.template) to the repository root.
2. Pin it: the commit is `git rev-parse --short HEAD`, the version is `project_version` from the preflight, the date is today.
3. Write the summary list, then fill the seven sections from the notes, inside the budget of [format.md](format.md). Detail that does not fit goes to a guide in `docs/`. Every claim must have a citation ready for the appendix.
4. Write the appendix last: one row per section, citing code or configuration only.

## 7. Record the decisions

One record per decision with a known reason, from [the template](../assets/decision.md.template). Record the ones a reader would ask "why" about; a choice that only repeats what the code shows needs no record. The table of section 7 shows the five that weigh most and links the folder. List the decisions without a known reason as "Not recorded yet".

## 8. Put the README in order

1. Read the whole README first.
2. Reorder it to the fixed order of [format.md](format.md), moving its text without rewriting it.
3. Move each long guide to `docs/<topic>.md`, leaving one paragraph and the link.
4. Add "How it works": one paragraph, the context diagram and the link to `ARCHITECTURE.md`.
5. Confirm that every line of the original README is still present in the README or in the file it moved to. Report any line you removed on purpose.

If there is no README, write one from [the template](../assets/README.md.template).

## 9. Check until clean

```sh
node <skill dir>/scripts/check.mjs --repo <repo> --json
```

Fix every error and run it again until the exit code is 0. [update.md](update.md) says what each code means.

Then look at both exported images, in light and in dark, before calling the diagrams done.

## 10. Hand over

1. Summarize what now exists: the files, the questions answered by the person, the answers taken from the preferences file and what stayed as "Not recorded yet".
2. Propose the commit with its exact paths and a one-line message, as a structured question. Commit only after the person approves. Never push unless they ask.
3. Before any push, follow [publishing.md](publishing.md): a push of documentation can start a build or a deployment.
4. For a public repository, offer GitHub Pages for the interactive diagrams, as a separate question. [diagrams.md](diagrams.md) has the details. Never offer it for a private repository.
5. When the preflight named no preferences file and the person answered a question that is not about this repository alone, such as the contribution policy, offer once to save those answers. Write `preferences.md` from [the example](../assets/preferences.example.md) only after the person says yes.
