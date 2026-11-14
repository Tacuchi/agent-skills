# security-practices changelog

## [1.1.0] — 2026-11-14

- New section "Logs — mask before you truncate": URLs without query string, no serialized entities, masking before truncating, and a probe written before the pattern.
- New section "Agent and LLM surfaces": retrieved content is data, identity comes from the server's context, hard data comes from the deterministic source, and public projections enumerate their fields.
- New section "Network premises": loopback-only services that gain a domain, rate limits keyed on a client-chosen header, and path guards that compare a normalized path.

## [1.0.0] — 2026-09-29

- First public version, copied from the author's own convention security-practices and generalized: company-specific environments, examples and skill references, the plugin's secrets hook and the exception that allowed running SQL blocks against a pre-production database were removed, so database access stays read-only.
