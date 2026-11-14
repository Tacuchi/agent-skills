# java-spring-standards 1.1.0

Gives Java and Spring Boot rules for writing and reviewing backends: layered MVC with thin controllers, constructor injection, transaction discipline, sized async executors, Bean Validation, a single centralized advice that never leaks internals, parameterized Log4j2 logging and DTOs that follow the project. It needs no other skill.

Version 1.1.0 adds traps that pass every unit test: proxy annotations that do nothing when called from their own class, a transaction left rollback-only by a caught constraint violation, a path filter bypassed with an encoded URI, and a logging configuration file that the runtime never reads.

Acquire the whole `java-spring-standards` directory from `Tacuchi/agent-skills` once the ref `skill/java-spring-standards/v1.1.0` exists.

Owner: Tacuchi. License: MIT, in the `LICENSE` file of this directory. The ref and its remote publication are created after this change.
