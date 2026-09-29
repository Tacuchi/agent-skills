---
name: security-practices
description: "Use whenever security or sensitive data is in play — handling secrets, credentials, API keys or tokens; auditing a repo for committed secrets; writing or reviewing SQL; configuring CORS or auth; or touching PII (national ID, email, phone). Mandates: never commit or log secrets (alert the caller if found, never silence — externalize via ${ENV} / secret manager); always parametrize SQL; validate and sanitize external input; handle PII aggregated/anonymized, never raw in artifacts; database access through an agent is READ-ONLY (mutations ship as versioned scripts). Actively flags recurring anti-patterns: plaintext secrets in application*.yml / .npmrc / service-account key files and permissive CORS (a wildcard `allowedOrigins` + allowCredentials). Never triggers external state mutations (publish/deploy/push/PR) on its own. The `sql-authoring` skill, if available, covers SQL authoring; the `coding-standards` skill, if available, covers error handling."
---

# security-practices — Security practices and sensitive-data handling

## Purpose

Protect secrets, sensitive data (PII) and database integrity when **writing, reviewing or auditing** code in any stack. It contributes hard rules and, above all, **actively remediates** recurring anti-patterns instead of merely stating them. The AI never silences a security finding: it flags it.

## Knowledge

### Secrets — per-environment rule (strict in prod, UAT allowed in dev)

Hard rule. Applies to passwords, API keys, credentials, tokens, private keys.

- **PROD — never literal.** No secret or endpoint in the clear in code, versioned files (`application-prod.yml`, `.env`, `.npmrc`, `credentials.json`, keys) or logs: everything via environment variable / `${ENV}` placeholder / secret manager (`${DB_PASSWORD}`, `${URL_SERVICE_*}`).
- **DEV — UAT allowed.** Hardcoding is OK **only** for **UAT/testing** (non-prod) values: UAT creds, staging URLs/endpoints (`feign.service.*`). They are not production secrets → committing them is **not** a finding. **Never** a PROD credential in a dev file (or anywhere).
- **On finding a prod secret/cred** in the input or a file: **alert the user** and **flag it with a comment** (`# FIXME: move to ${ENV}`) — never silence it, **never replace the value** in place, never copy it elsewhere. The human does the replacement.

Recurring anti-pattern to **flag, never propagate** — the problem is the **prod/real** cred in a versioned file, not the UAT value in dev:

```yaml
# application-prod.yml — BAD: prod secret committed in plain text
spring:
  datasource:
    password: qwerty12345          # FIXME: move to ${DB_PASSWORD} (flag, do not replace)
token:
  clientSecret: "@dM1n-Pr0d-2025!"   # FIXME: move to ${TOKEN_CLIENT_SECRET}
```

```yaml
# application-dev.yml — OK: UAT/testing values hardcoded (not prod)
spring:
  datasource:
    password: pass_uat_dev         # acceptable in dev; in prod it goes through ${DB_PASSWORD}
feign:
  service:
    auth: http://host-staging:8080 # staging endpoint — OK to hardcode in dev
```

- A cloud service-account key file for a prod account (e.g. `gcp-account-file.json`) in `src/main/resources/` → out of the repo, mounted per environment.
- In frontend: **prod** credentials hardcoded in JSX (`user`/`password`), private-registry credentials in a committed `.npmrc`, `console.log(access_token)`. These are leaks — flag and propose the fix (mark, never replace).

### Parametrized SQL — never concatenate

- Every query with external values is parametrized: `$1` / `@Param` / `%L`, **never** string concatenation.
- Applies to JPA (`@Query` with `:param`), native queries and scripts.
- The full SQL-script authoring discipline (idempotency, rollback, naming) is not duplicated here; if the `sql-authoring` skill is available, it covers it.

### External input validation and sanitization

- Validate and sanitize **all** input crossing the system boundary (request bodies, headers, params, third-party responses).
- In backend this materializes with Bean Validation (`@Valid` on every `@RequestBody`); if the `coding-standards` skill is available, it holds the per-stack detail.
- Never rely on frontend-only validation for security rules.

### PII — aggregated and anonymized

- Personal data (national ID, email, phone, address) is handled **aggregated or anonymized**.
- **Never** copy raw PII into evidence artifacts, analyses, logs or tickets.
- Prefer counts/aggregations (`COUNT`, `GROUP BY`) over row dumps with personal data.

### Database access — read-only

- Database connections used by the AI (MCP or any other) are **READ-ONLY**: only `SELECT` / `EXPLAIN` / `\d`. The AI **never** runs `INSERT/UPDATE/DELETE/TRUNCATE/MERGE` or DDL via MCP, Bash, `psql` or a driver.
- Every mutation materializes as a **versioned SQL script** the user applies manually (the script is the source of truth; it avoids drift and audit gaps).

### CORS and auth — flag the permissive posture

- Anti-pattern to flag: open CORS with credentials.

```java
// BAD: any origin + credentials enabled
.allowedOrigins("*").allowCredentials(true)
```

- Restrict `allowedOrigins` to a per-environment list; never combine `"*"` with `allowCredentials(true)`.
- Mark permissive CORS as a risk to remediate, never a convention to copy.

### External state mutations — never on own initiative

- The AI **never** triggers, on its own: `npm publish`, `mvn deploy`, `docker push`, `gh pr create`, Slack/email/status-page sends. The human triggers those.
- Never edit a `Dockerfile` or CI/CD pipelines without explicit confirmation.
- Respect the `dev` / `staging` (pre-prod) / `prod` environment separation; never target prod without an explicit request.

### Secret patterns to never write or commit, and to flag in review

- **Block** (high precision, near-zero false positives): PEM/OpenSSH/PGP private keys, AWS `AKIA…`, Google `AIza…`, Slack/GitHub/GitLab tokens, npm `_authToken` with a real value, GCP service-account JSON. Never write them to disk; flag them where found.
- **Ask the person** (prone to false positives → confirm, do not block): JWT, and generic `key = value` secrets (a quoted literal in any file, or bare in config files). Placeholders (`${ENV}`, `<...>`, `changeme`, `example`) do **not** count.
- These patterns do not distinguish dev from prod: a UAT cred hardcoded in dev (allowed above) may match an **ask** pattern (never a **block** one) — expected; the person confirms. The dev/prod judgment stays with the rules above.

## Output

It produces no files on disk. It contributes rules and **findings**: on detecting a secret, unparametrized SQL, permissive CORS or exposed PII, it flags it to the user with the proposed fix, and never silences or executes it without confirmation.
