# security-practices 1.1.0

Guides the handling of secrets, PII, parametrized SQL, input validation, permissive CORS and external state mutations: it flags findings with a proposed fix, keeps database access read-only and never silences or executes a mutation on its own. It needs no other skill; the skills it mentions are optional.

Version 1.1.0 adds three areas: masking secrets and personal data in logs, where the obvious pattern misses most cases; agent and LLM surfaces, where retrieved content is data and never instructions; and network premises that stop holding when a service gains a public domain.

Acquire the whole `security-practices` directory from `Tacuchi/agent-skills` once the ref `skill/security-practices/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
