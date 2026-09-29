---
name: version-evolution
description: "Guides safe selection and incremental upgrades of language, framework and toolchain versions. Use when a user asks to upgrade/update, migrate/modernize, adopt LTS, leave EOL, or choose versions for Java/JDK, Spring Boot/Cloud, Angular, Node.js, TypeScript, build images or CI agents. Separates the repository's current compatibility baseline from the team's target baseline, prefers vendor-supported GA lines and LTS runtimes, checks official compatibility matrices and deployment capacity, then pins the resolved versions. Not for ordinary feature work with no version decision; for implementation conventions, use the matching stack skill if one is available."
---

# version-evolution — supported versions without fleet lock-in

## Outcome

Move each project toward a supported target without forcing an incidental migration or copying a
fleet snapshot as a permanent ceiling.

Use these terms consistently:

- **Current baseline**: versions declared by the target repository and its effective build/runtime.
- **Target baseline**: versions explicitly selected for a new project or migration increment.
- **Infrastructure capacity**: builder, runtime image, CI agent and deployment support for the target.
- **Fleet evidence**: useful compatibility history, never the maximum version the team may adopt.

## Resolve the baselines

1. Read the target's manifests before recommending code or versions.
   - Java/Spring: parent or plugin versions, build JDK, source/bytecode target, application runtime
     JDK and vendor, Maven/Gradle wrapper and imported BOMs.
   - Angular/Node: Angular core and CLI, `engines`, TypeScript, RxJS, `packageManager`, lockfile and builders.
   - Delivery: Docker base image, build container, Jenkins process JDK, Kubernetes agent and production runtime.
     Keep the Jenkins controller/agent Java separate from the JDK used inside the build.
2. Treat the current baseline as the compatibility contract for ordinary feature and fix work.
3. Treat a new target as a team decision, never as a value inferred from another repository.
4. Report an unsupported current baseline as debt with the smallest safe migration increment.
   Continue unrelated work when it remains safe and compatible; do not smuggle an upgrade into it.

## Select a target

For a new project or an explicit migration:

1. Consult the vendors' official lifecycle, system-requirements and compatibility pages at execution time.
   Numbers embedded in examples or fleet inventories are not current evidence.
2. Choose a stable GA line that is still supported.
   Prefer an LTS runtime for Java and Node.js when it is compatible with the selected framework.
   If the team's infrastructure cannot build or run it yet, record that capacity as a prerequisite instead
   of choosing an older application target.
   For Java, record the distribution, license/contract and patch channel; LTS support depends on the vendor.
3. For frameworks without a distinct LTS release label, choose a supported line with the longest practical runway.
   Do not invent an LTS designation that the vendor does not use.
4. Verify the complete compatibility set before editing:
   - Java ↔ Spring Boot ↔ Spring Cloud ↔ springdoc ↔ third-party libraries.
   - Angular ↔ Angular CLI ↔ Node.js ↔ TypeScript ↔ RxJS ↔ installed UI libraries.
   - Build JDK/Node ↔ runtime image ↔ Jenkins agent ↔ Kubernetes base distribution.
5. Resolve and pin the top-level decisions: parent/framework, BOM, toolchain, non-managed direct
   dependencies and immutable build/runtime images. Let a BOM manage its transitives and regenerate
   the lockfile; do not override every transitive dependency manually.
   Never leave `latest`, a floating container tag or an unresolved placeholder in a delivered project.
6. Preserve or raise the current baseline. Never downgrade an application to fit an old template or CI agent.
   Missing infrastructure blocks completion or deployment of the affected increment, not safe
   preparatory analysis or source work that still builds and tests on the current baseline.

## Migrate incrementally

- Follow the vendor-supported upgrade path; Angular majors advance one at a time with `ng update`.
- Choose the order from compatibility evidence. Build JDK, bytecode target, application runtime,
  framework/BOM, namespace/API migration and optional libraries are independent axes, not a fixed sequence.
- Apply migrations from legacy Java/Jakarta EE `javax.*` APIs to their `jakarta.*` equivalents only
  in the increment that requires them. Never globally replace Java SE packages such as `javax.crypto`.
- Use unsupported intermediate versions only as isolated migration checkpoints required by an
  official path. Never present or deploy one as the stable target.
- Re-resolve transitive compatibility after every framework or runtime increment.
- Build and run the selected test level after each increment; the repository's test conventions own
  approval and commands (if the `software-testing` skill is available, it covers them).
- Before deployment, define rollback, canary/rollout checks, API/data compatibility and observability evidence.
- Remove temporary compatibility bridges when their declared increment completes.

## Stack gates

| Stack | Required evidence before choosing the target |
|---|---|
| Java/Spring | JDK vendor/LTS channel, Spring Boot system requirements/support, Spring Cloud train mapping, library support |
| Angular | Angular support window and version table, matching CLI major, compatible Node LTS/TypeScript/RxJS |
| Containers/CI | A builder and a runtime image for the selected runtime, each pinned by digest and current — a stale mirror does not qualify — plus native-library compatibility |
| Other stacks | Vendor lifecycle, framework compatibility range, package-manager and deployment support |

Recorded evidence from real migrations: [Java 25 + Spring Boot 4 migration traps](references/java25-boot4-traps.md)
— what actually broke on a first service built on that stack. Read it when the target crosses
into Boot 4 or a JDK past 21. It changes nothing about how a target is selected; it shortens the
increment by naming the failures that compile cleanly and only surface at startup or at runtime.

## Report the decision

Use one row per independently upgradeable axis:

| Axis | Current | Target | Support evidence | Blocker or next increment |
|---|---|---|---|---|
| Application runtime | `<declared JDK>` | `<selected LTS>` | Vendor roadmap, distribution and support channel checked on `<date>` | Provision the matching runtime image |
| Spring Boot | `<declared line>` | `<supported target>` | Support policy and Cloud train mapping | Follow official checkpoints; isolate required namespace/API changes |

The versions above illustrate the format only. Resolve live targets from official sources.
Give build JDK, bytecode target, application runtime and Jenkins process JDK separate rows whenever
they differ. Link the official source, record the consultation date and distinguish OSS from
commercial support. If official sources conflict, report the decision as inconclusive and run an
isolated compatibility probe; never resolve the conflict from a blog example or `latest` tag.

## Invariants

- The repository declares compatibility; the team declares the target.
- A fleet example informs migration risk; it never freezes the target version.
- The selected target is supported as a complete stack, not merely available for download.
- Generated or migrated projects pin the resolved top-level versions, BOMs, toolchains and images.
- Missing build or runtime capacity blocks the increment instead of causing a downgrade.
