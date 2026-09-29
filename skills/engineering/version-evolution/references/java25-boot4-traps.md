# Java 25 + Spring Boot 4 — migration traps

Recorded evidence from real migrations: a first service built on this stack (a scheduler service, 2026-08).
It informs migration risk; it is neither a version ceiling nor a target to copy. Resolve live versions
from official sources as this skill requires — what does not age is the trap.

Every entry below cost real debugging time on that increment. Each says what breaks, what the symptom
looks like, and the fix verified in the service.

## Jackson 3 replaces Jackson 2 inside the framework

Boot 4 ships Jackson 3. The databind classes moved to `tools.jackson.databind`; the **annotations
stayed** in `com.fasterxml.jackson.annotation`. Jackson 2's databind normally remains on the classpath
through other dependencies, so the old import still **compiles** — the failure is a startup abort,
because the framework has no `com.fasterxml.jackson.databind.ObjectMapper` bean to inject.

- Inject and import `tools.jackson.databind.ObjectMapper` / `JsonNode`.
- Keep `com.fasterxml.jackson.annotation.*` for `@JsonInclude`, `@JsonFormat` and the rest.
- Audit every `ObjectMapper` injection point before the first run. A compiling import proves nothing.

## The Logback exclusion must target `spring-boot-starter`

Excluding `spring-boot-starter-logging` only from `spring-boot-starter-web` leaves Logback reachable
through the transitive root. Logback then wins the binding and **the service logs nothing**, while
starting and serving normally — a silent failure with no error to grep for.

Put the exclusion on `spring-boot-starter`. Verify against a resolved dependency tree showing zero
logback artifacts, not by re-reading the POM.

## Test slices were split into their own starters

`@WebMvcTest` is no longer part of `spring-boot-starter-test`. Add `spring-boot-starter-webmvc-test`
and import `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` — the annotation also
changed package. Without the starter the annotation simply does not resolve, which reads as a broken
IDE rather than a missing dependency.

## Coupled libraries that fall outside the Boot BOM

- springdoc's Boot 4 line is not managed by the Boot BOM. Pin its version explicitly.
- Spring Cloud now ships a Boot 4 train in its `2025.1.x` line (checked 2026-09-19: `2025.1.2`
  covers Boot 4.0.x and 4.1.x). It had none when this service migrated, and that gap is what makes
  the trap worth keeping: **re-resolve the train at migration time** rather than reusing the answer
  from the previous increment — "there is no train" ages into a false blocker. A service that does
  not need Spring Cloud still carries **no** block at all, rather than one that cannot resolve.

Treat every coupled library as unmanaged until the BOM proves otherwise.

## The toolchain needs explicit wiring for Lombok and Mockito

- **Lombok**: declare it in `maven-compiler-plugin`'s `annotationProcessorPaths` **and** pass
  `-proc:full`. Recent JDKs no longer run annotation processors found only on the classpath, so
  without both the processor never runs and every generated accessor becomes a compile error —
  hundreds of them, none naming the real cause.
- **Mockito**: declare it as a `-javaagent` (expose its jar path with
  `maven-dependency-plugin:properties`, pass it in surefire's `argLine`). Otherwise every run warns
  about self-attaching, which later JDKs are set to refuse outright.

## What the new runtime pays back

`spring.threads.virtual.enabled: true` makes Boot autoconfigure a virtual-thread task scheduler, so
one slow scheduled task can no longer starve the others. Confirm it in the startup log instead of
assuming the property took effect.

**Audit `synchronized` before flipping that flag.** Until JEP 491 (JDK 24) a virtual thread that
blocks inside a `synchronized` block **pins** its carrier, so a monitor held across I/O turns the
scheduler back into a fixed pool and can starve it outright. On JDK 24+ the pinning is gone — which
is precisely what makes the flag safe on this runtime and unsafe on 21. A codebase that guards
blocking work with `synchronized` in its hot path takes the runtime upgrade first and the flag
second, never in the same increment.
