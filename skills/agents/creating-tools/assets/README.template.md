# {{SLUG}}

> **Type**: {{TYPE}} · **Model**: {{MODEL}} · **Repo**: {{REPO}} · **Path**: {{PATH}} · **Created**: {{DATE}}

## Purpose

[1-2 sentences: what it does and when to use it.]

## Usage

```bash
<invocation example>
```

## Parameters

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `--foo` | string | yes | — | … |

## Inputs / Outputs

- **Inputs**: <files / env vars / services it consumes>
- **Outputs**: <what it produces; each run's results go to `runs/<ts>/output/` and the latest one is reached through `output/latest`>

## Dependencies

- <required binary / env var / service — check it at the start of the script>

## Examples

```bash
# Main case (archiving the run)
node record-run.mjs {{SLUG}} -- <command> --env staging

# Edge case
node record-run.mjs {{SLUG}} -- <command> --env staging --dry-run
```

## Notes

[Warnings, limitations, when NOT to use it.]
