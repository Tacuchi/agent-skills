---
name: java-spring-standards
description: "Use when writing or reviewing Java / Spring Boot code — controllers, services, repositories, entities, DTOs, exception handling, transactions, logging — even when the user does not say standards. Enforces classic layered MVC (thin Controller → Service interface → @Service Impl → Repository), constructor injection via Lombok @RequiredArgsConstructor over private final (never @Autowired field injection), @Transactional read/write discipline, Bean Validation (@Valid @RequestBody, cascade on nested payload), a single centralized @ControllerAdvice that never leaks ex.getMessage()/stacktrace, Log4j2 + @Slf4j parameterized logging, and DTOs as Lombok POJOs. For SQL scripts, the `sql-authoring` skill helps if available; for secrets/CORS, the `security-practices` skill if available; for the generic core, the `coding-standards` skill if available; for Java/Spring upgrades, LTS selection or EOL migration, the `version-evolution` skill if available."
---

# java-spring-standards — Java / Spring Boot standards

## Purpose

Idiomatic Java + Spring Boot rules to apply when **implementing or reviewing** backends. It contributes the layer, injection, transaction, validation, error-handling and logging conventions; the consumer writes the code. Organization-specific parts (request/response envelope, persistence auditing, identity) stay with the project's own conventions.

## Knowledge

### Version-aware implementation

- Read the effective Maven/Gradle model, wrapper and Java toolchain before choosing APIs or imports.
- For ordinary work, the repository's declared Java and Spring Boot versions are the compatibility baseline.
  Preserve them and never introduce APIs from a newer line incidentally.
- For a new project or explicit upgrade, apply the `version-evolution` skill if it is available.
  Prefer a supported Java LTS and a supported Spring Boot line compatible with Spring Cloud,
  springdoc, third-party libraries, build images and the production runtime.
- Use the namespace required by the selected Spring generation for the affected Jakarta EE API
  (`javax.persistence`, `javax.validation`, `javax.servlet`, etc. on legacy lines; their `jakarta.*`
  equivalents on current lines). Do not globally replace Java SE namespaces such as `javax.crypto`,
  `javax.sql` or `javax.xml`; those remain valid. Avoid mixing two generations of the same Jakarta
  EE API unless a documented compatibility bridge requires it.
- Treat the prevalence of a pattern in existing code and the examples below as migration evidence, not as a version ceiling.

### Layered architecture (classic MVC)

- `Controller → Service (interface) → ServiceImpl (@Service) → Repository`.
- **Thin controllers**: they delegate to the service and shape the response; no business logic.
- **Every service is an interface + a single Impl** (even with one implementation). Interface in `service/`, impl in `service/impl/` with the `ServiceImpl` suffix.
- Naming example: `service/TaskHistoryService.java` + `service/impl/TaskHistoryServiceImpl.java`.

### Dependency injection

- **Constructor injection only**, via Lombok `@RequiredArgsConstructor` over `private final`. Never field `@Autowired`.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskHistoryServiceImpl implements TaskHistoryService {
    private final TaskHistoryRepository repository;
}
```

### Transactions

- `@Transactional(readOnly = true)` on reads; `@Transactional` wrapping multi-step writes.
- **Consistent import**: use `org.springframework.transaction.annotation.Transactional` (avoid mixing `javax`/`jakarta` — a common source of drift).
- Anti-pattern to avoid: a multi-step write without `@Transactional`.

### Async executors (`@Async`)

- **One named executor per workload**, qualified at the call site (`@Async("reportExecutor")`). A configuration class that implements `AsyncConfigurer` turns its executor into the **default for every `@Async` in the service**, so one workload holding threads for hours starves every other one that arrives later.
- **`ThreadPoolTaskExecutor` grows past `corePoolSize` only once the queue is full.** A generous `queueCapacity` therefore makes `maxPoolSize` unreachable: `core 2 / max 5 / queue 100` has an effective ceiling of **2** concurrent tasks and the third waits in the queue with no signal anywhere. This has been observed on a job that runs for hours. Size the queue for the workload — short tasks tolerate one; work measured in minutes wants `core == max` with a queue of `0`, so the rejection is visible.
- **Keep `CallerRunsPolicy` away from long work.** On rejection the task runs on the **caller's** thread, which for an HTTP-triggered job is a Tomcat request thread held for the whole run. Reserve it for short bursts where backpressure on the caller is acceptable; for a job measured in minutes or hours prefer `AbortPolicy` and answer the caller that there is no capacity.
- A job a user starts and then needs to pause, cancel or resume needs more than a pool: give it an explicit job-control contract: persisted job state, cooperative checkpoints the worker polls, endpoints to pause, cancel and resume, a lease that makes relaunching the job safe, and work split into claimed slices so no unit is processed twice.

### Validation (Bean Validation)

- `@Valid @RequestBody` on **every** endpoint receiving a payload.
- `@NotNull`/`@NotBlank`/`@Size`/`@Pattern` with explicit messages on the fields.
- Cascade into nested payloads with `@Valid` on the field (when a request envelope wraps the data, mark its `payload` field with `@NotNull @Valid`).
- Anti-pattern: declaring the validation starter and doing manual null-checks.

### Centralized error handling

- A single `@ControllerAdvice`/`@RestControllerAdvice` maps each custom exception to an HTTP status and an error body.
- Custom exceptions extend `RuntimeException` with a static `DESCRIPTION`:

```java
public class NotFoundException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private static final String DESCRIPTION = "Not found (404)";
    public NotFoundException(String detail) { super(DESCRIPTION + ". " + detail); }
}
```

- Flatten `@Valid` errors to `"field: message"`:

```java
for (final FieldError error : ex.getBindingResult().getFieldErrors())
    errors.add(error.getField() + ": " + error.getDefaultMessage());
```

- **Required**: code that handles errors with per-method try/catch and no advice is standardized toward the single advice.

### Error-handling anti-patterns (FORBIDDEN)

- Leaking internals to the client: `ex.getMessage()` / `ex.getStackTrace()[0]` in `error.messages`.
- `e.printStackTrace()` / `System.out.println` in code.
- A catch-all returning the raw exception text.
- A `204 NO_CONTENT` handler that still writes a body.
- **Correct**: a safe generic message (e.g. a constant such as `Messages.UNEXPECTED_ERROR`) to the client; the stack goes only to the server log.

### Logging

- Log4j2 (exclude `starter-logging`, `log4j2.xml` on the classpath). Logger via `@Slf4j`.
- Parametrized messages with `{}` and a bracketed context tag.

```java
log.info("[LOAD] batch {} started", batchId);
```

- `traceId` via MDC in `log4j2.xml` for correlation. Never log secrets/PII (the `security-practices` skill, if available, covers this in depth).

### DTOs as Lombok POJOs (honest drift)

- A common living convention is the DTO as a Lombok POJO: `@Data` or `@Getter/@Setter/@Builder`, even in codebases where Java records were recommended for Request/Response.
- **Follow the project** for ordinary work. A new isolated DTO may use a record when the selected
  Java/Spring/Jackson baseline supports it and the team accepts the local style.
- Migrate an existing DTO family only as an explicit, tested modernization increment.
- Bridge external JSON keys to the project's field names with `@JsonSetter`/`@JsonProperty`:

```java
@JsonSetter("payment_method") private String paymentMethod;
```

### Log severity levels

ERROR / WARN / INFO / DEBUG — the generic semantics belong to the `coding-standards` skill, if available; here only the mechanism (Log4j2 + tag + MDC).

## Output

None of its own. The skill contributes rules; the consumer writes the Java code.
