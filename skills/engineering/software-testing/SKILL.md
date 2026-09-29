---
name: software-testing
description: "Use whenever tests are in play — writing, adding, naming, structuring, or running them, or deciding how to verify a change — in any stack, even when the user only says 'add tests' without details, and keep it in force across the session. Picks the level (unit/integration/e2e), resolves the configured runner and command from the detected stack (Maven/Gradle/Angular/Node — committed wrapper or package script, never plain mvn), guides naming and structure ([method]_[scenario]_[result], AAA, TestBuilder), and requires a regression test for every bugfix (red before, green after). Always asks before running a test runner — never launches it without explicit confirmation. Low or absent coverage is a gap to remediate, never a pattern to copy (no skipTests=true, no contextLoads-only). Optional complements, if available: the `coding-standards` skill (and the `java-spring-standards` skill or the `angular-standards` skill) for authoring the code under test; the `git-conventions` skill for commit conventions."
---

# software-testing — Test strategy and execution

## Purpose

Reason about tests: which level to apply, with which command, with which naming/structure convention. **It never runs tests autonomously** — it first asks the human whether to run them, whether they will run them manually, or whether none are needed.

This skill covers **how to test**. If available, the style of the code under test can come from the `coding-standards` skill (+ the `java-spring-standards` skill / the `angular-standards` skill), and commits from the `git-conventions` skill.

## Knowledge

### Execution rule

By default, **never run tests automatically**. Before launching any test runner, ask the human, with the host's structured question tool if it has one; otherwise with a **numbered markdown** list.

```
Run the tests?
  [a] Yes, run them now
  [b] I will run them manually
  [c] Not needed
```

Skip the question only if the user already asked to run them, or in a validation step the user explicitly requested.

### Verification-first (bugfix => regression test)

A bugfix **requires a regression test** that reproduces the defect:

1. Write the test that **fails** with the current code (red) — it proves the bug exists.
2. Apply the fix.
3. The same test now **passes** (green).

Without the prior red there is no guarantee the test covers the bug. For new features, the test accompanies the new logic — never deferred.

### A red you did not cause still has to be proven

A failing test in a repo you just touched is not preexisting because it looks unrelated. Demonstrate
it: run **the same command** against the untouched base — another checkout of the same commit, or a
clean worktree — and compare the failure, by name, not by count. An equal count with different names
hides a new regression behind an old one.

`git stash` is the wrong instrument for this. It mutates the tree you are measuring, and on a clone
shared with other worktrees or other agent sessions the stash stack is shared too, so a pop can take
somebody else's work. Prefer a second checkout.

Report a preexisting failure with its evidence — the command, the environment, the cause — and never
as an aside. "It was already broken" without that is indistinguishable from not having looked.

### Coverage is a GAP, not a convention

In many codebases testing is **nearly absent**: a repository has only a `@SpringBootTest` `contextLoads()` (or no `src/test` at all), a `pom.xml` carries `maven-surefire-plugin` with `<skipTests>true</skipTests>` so declared tests never run, a frontend has a handful of specs, or a static-analysis gate stands in for a suite.

**Never emulate this anti-pattern.** Rules:

- Never propose or leave `<skipTests>true</skipTests>`.
- Never treat a lone `contextLoads()` as coverage — it is boot smoke, not logic testing.
- Empty stub tests (a `@Test` method with a blank body) do not count; either complete them or do not add them.

```java
// ANTI-PATTERN: a repository whose only real tests
// leave two cases as empty shells — do NOT replicate.
@Test public void testActive_CronNotFound() { }   // no Arrange/Act/Assert
@Test public void testActive_CronInactive()  { }
```

When touching a repo without tests, treat it as debt to remediate in what you modify — never as a license to skip.

### Test levels

Three universal levels, adapted to the detected stack:

| Level | Scope | When |
|---|---|---|
| **a) Unit** | Isolated logic (services, utils, mappers) with mocked dependencies | Targeted fix, logic without external dependencies |
| **b) Integration** | Unit + API/controller layer | New or modified endpoint |
| **c) Full / e2e** | Integration + full context | Complete feature, critical cross-layer flow |

### Stack resolution

Detect the stack, test engine, runner version and command from the repository's manifests, build
files, wrapper, package-manager declaration and test configuration. Those declarations are the
current compatibility baseline; never add or upgrade a runner merely because it appears in an
example below. For a new project or explicit runner/toolchain migration, use the `version-evolution`
skill if it is available, and select a supported release compatible with the chosen language/framework baseline.

**Never use global `mvn`/`gradle` — always the committed wrapper.** If an existing repository lacks
one, report that reproducibility gap. A new project must generate, pin and commit its wrapper before
the first verification command.

#### Spring Boot (Maven)

| Level | Typical scope | Command |
|---|---|---|
| a) Unit | configured Java test engine + mocking library | `./mvnw test -Dtest=ClassTest` |
| b) Integration | configured controller/API test support | `./mvnw test` |
| c) Full | configured full-context/integration suites | `./mvnw verify` |

> Windows: `mvnw.cmd` instead of `./mvnw`.

#### Spring Boot (Gradle)

| Level | Command |
|---|---|
| a) Unit | `./gradlew <declared-unit-task> --tests ClassTest` when that task supports filtering |
| b) Integration | `./gradlew <declared-integration-task>` |
| c) Full | `./gradlew <declared-verification-task>` |

Resolve the placeholders from tasks registered by the target build. `test`, `integrationTest` and
`check` are common examples, not guaranteed task names.

#### Angular

| Level | Typical scope | Command |
|---|---|---|
| a) Unit | configured Angular unit runner | the repository's `test` script with its supported non-watch flag |
| b) Integration | configured Angular component test support | the repository's `test` script with its supported non-watch flag |
| c) Full | configured browser/e2e runner, if present | the repository's e2e script |

Karma/Jasmine, Jest, Vitest, Cypress and Playwright are examples found in different generations,
not defaults to install. Use only the runner and flags supported by the selected Angular builder.

#### Generic Node / TypeScript

| Level | Command |
|---|---|
| a) Unit | the declared package manager's `test` script |
| b) Integration | its configured integration script/suite |
| c) Full | its configured e2e script |

#### Automatic resolution

1. `mvnw` / `mvnw.cmd` → Maven wrapper and the project's configured test plugins.
2. `gradlew` / `gradlew.bat` → Gradle wrapper and declared test tasks.
3. `package.json` → honor `packageManager`, lockfile and scripts; use the declared package manager.
4. `angular.json` → inspect its test/e2e builders when scripts delegate to the Angular CLI.

If the manifest has no runnable command for the requested level, report the missing configuration;
do not silently substitute a globally installed tool or introduce a historical runner.

### Naming conventions

**Java:** class `[Target]Test.java`, method `[method]_[scenario]_[result]`. Arrange-Act-Assert structure. `@Mock` for collaborators, `@InjectMocks` for the SUT.

```java
@Test
void active_cronInactive_throwsException() {
    // Arrange
    var parameter = new ParameterDTO(/* ... inactive status ... */);
    when(parameterService.findByAppCode(APP, PRM_CRON))
            .thenReturn(parameter);
    // Act + Assert
    assertThrows(BusinessException.class,
            () -> validateCronService.active(PRM_CRON));
}
```

> Note: existing code may use ad-hoc names (`testActive_CronActive`); prefer the `[method]_[scenario]_[result]` pattern for new cases.

**Angular / TypeScript:** file `[name].spec.ts`, `describe` / `it` blocks. `TestBed` for components; `it` messages describe the behavior, not the implementation.

```typescript
describe('AuthService', () => {
  it('should return a token on login', () => {
    // Arrange / Act / Assert
  });
});
```

### TestBuilder pattern (Java)

Build reusable fixtures without coupling tests to the production constructor. Useful with entities/DTOs that carry audit or status fields:

```java
public class RequestTestBuilder {
    private Integer status = 1;           // 1 = active (soft status)
    private String document = "12345678";

    public static RequestTestBuilder builder() { return new RequestTestBuilder(); }

    public RequestTestBuilder document(String v) { this.document = v; return this; }
    public RequestTestBuilder status(Integer v)  { this.status = v;   return this; }

    public Request build() {
        var r = new Request();
        r.setDocument(document);
        r.setStatus(status);
        return r;
    }
}
```

### Level selection prompt (shown to the human, in the user's language)

Adapt to the resolved stack. Spring Boot example:

```
Which test level do we apply?
  a) Unit        — configured runner and mocks (fast, isolated)
  b) Integration — configured API/controller support
  c) Full        — configured context/integration suites
```

The human can switch levels at any time or decide not to run.

### Execution and logging

1. Confirm the human wants execution (see "Execution rule").
2. Run the resolved command per stack and level.
3. On failures, if the human wants to continue: fix and re-run.
4. If the human already validated manually, do not repeat; note one brief line if it adds traceability.

## Output

It produces no artifacts autonomously. When the human confirms execution:

- Runs the resolved command and reports the result inline.
- Writes a brief test log only when explicitly requested.
- For a bugfix, records the added regression test (red→green).
