---
name: angular-standards
description: "Use when writing or reviewing Angular + TypeScript code — components, services, reactive forms, routing/guards, state, styling — even when the user does not say standards, and keep applying it across the session. Enforces two-layer @data/@presentation architecture, all HTTP through a single shared HTTP wrapper service (never HttpClient directly) with URLs from an environment-configured base URL plus a version segment, providedIn:'root' singletons, reactive forms, version-aware NgModule/standalone coexistence, signal stores when supported, strict TS (avoid any), SCSS + framework-first styling, and centralized error handling (ngx-toastr + ErrorInterceptor, never silence); flags fat smart components and hardcoded env URLs. For the core, the `coding-standards` skill helps if available; for Angular/Node upgrades, LTS or EOL migration, the `version-evolution` skill if available; for testing, the `software-testing` skill if available."
---

# angular-standards — Angular + TypeScript standards

## Purpose

Stack conventions for writing and reviewing Angular code. It contributes idiomatic Angular/TS rules; it does not write the consumer's code.

## Knowledge

### Version and toolchain baseline

- Read `package.json`, the lockfile, `angular.json` and `tsconfig*` before choosing Angular APIs.
  Resolve Angular core/CLI, Node.js, TypeScript, RxJS, the package manager and configured builders.
- For ordinary work, those declared versions are the compatibility baseline.
  Use only stable APIs available on that baseline; never downgrade or upgrade it incidentally.
- For a new project or explicit migration, apply the `version-evolution` skill if it is available.
  Choose a supported Angular line, a compatible Node.js LTS and the official TypeScript/RxJS ranges.
- Keep Angular core and CLI on the same major.
  Upgrade one major at a time with `ng update`, pin the result and regenerate the lockfile.
- Treat the existing code patterns below as compatibility history, not as limits on newer supported Angular versions.

### Two-layer architecture

- `src/app/@data/` — data access: `services/` (HTTP), `interceptors/`, `guards/`, `interfaces/`, `directives/`.
- `src/app/@presentation/` — UI: `auth/`, `home/`, `shared/`, `pages/`.
- Cross-cutting helpers in `Utils/`. Global types in `@data/interfaces/`; local types in the feature's `interfaces/`.
- Tolerated minor variant: a repo without path-aliases (`@data/*`) that imports via absolute `src/app/...`. Respect the repo's convention.

### HTTP always through the shared wrapper (never HttpClient directly)

- All HTTP goes through a single wrapper service (e.g. `@data/services/api-client.service.ts` with `get/post/put/patch/delete` + `getBlob/getResource`); each method does `catchError -> formatErrors`. Feature services **inject the wrapper, never `HttpClient`**.
- URLs are built from an environment-configured base URL (e.g. `environment.apiBaseUrl`) + an explicit version segment such as `/v1/`. Never hardcode URLs/hosts inline:

  ```ts
  const url = `${environment.apiBaseUrl}/v1/users/roles`;
  return this.apiClient.get(url);
  ```

- Query and body are built with shared `Utils/` helpers: a query helper (e.g. `buildQuery()`: trims, drops `null`/empty, keeps `0`) for querystrings and a payload helper (e.g. `wrapPayload<T>()`) to wrap the body. Never ad-hoc `HttpParams`.
- The response envelope types (e.g. `IResponsePayload<T>`, `IPayloadList<T>`) are the shared FE-BE contract.

### Dependency injection

- Services `@Injectable({ providedIn: 'root' })` (tree-shakable singletons).
- Two styles coexist: **constructor injection** (`private` collaborators, dominant in existing code)
  and **`inject()`** (for `DestroyRef`, signal stores, and functional guards/interceptors).
  Use `inject()` only when the installed Angular baseline supports the required stable API;
  otherwise preserve constructor injection.

### Reactive forms

- `ReactiveFormsModule` + `FormBuilder`/`FormGroup`/`Validators` for capture screens. Build in `ngOnInit`/constructor.
- Clean up `valueChanges` with `takeUntilDestroyed(destroyRef)` when the installed baseline supports
  it; otherwise use the repository's existing teardown pattern without adding a compatibility shim.
- Dependent combos: subscribe to the parent's `valueChanges` and reset/patch the children.
- On edit, preload with `patchValue({...}, { emitEvent: false })` to avoid firing the `valueChanges` chain.
- `[(ngModel)]` only in simple/legacy views.

### Modules, routing and components

- In an existing NgModule feature, preserve its module + `*-routing.module.ts` (`forChild`) shape
  unless the task explicitly includes migration.
- On an Angular baseline that supports stable standalone APIs, prefer standalone components and
  lazy routes for new isolated features. They may coexist with existing NgModules.
- Migrate existing NgModules only as explicit, feature-sized increments using the official migration tooling.
- The root router declares auth/home/admin and lazy-loads features using the syntax supported by the installed version. Wildcard `'**'` redirects.
- **Smart/presentational**: "page" components are smart containers (forms, services, orchestrate HTTP+navigation); the pieces in `shared/components` are `@Input`-driven with getter-derived state. Selector prefix `app`, separate `templateUrl` + `styleUrls`. `OnPush` is the target for new components. Flag: "fat smart component" (e.g. a ~410-line component injecting 11 services) — propose extraction.
- Guards: preserve class-based guards on baselines that require them. Use functional guards
  (`CanActivateFn`/`CanMatchFn` with `inject()`) only when the installed Angular line supports the
  required stable APIs, or migrate them as an explicit increment. Post-login navigation is
  permission-driven (default-deny RBAC).
- **An empty permission set renders an empty menu.** Never fall back to showing every item (or a default route) because the permissions came back empty — that turns a backend failure into an access grant. Surface the empty state; the same no-hidden-fallback rule as in the `coding-standards` skill, if available, applied to authorization.

### State

- Do not add NgRx/Akita unless the problem justifies that dependency and the team accepts it.
- When the installed Angular line supports stable signals, prefer a light signal store for new local
  state: private writable `signal()`, readonly `computed()` selectors, `asReadonly()` exposure,
  `.store.ts` suffix and a co-located state interface.
- On older baselines, follow the existing RxJS state pattern.
  Migrate `BehaviorSubject` services to signals only in an explicit, tested modernization increment.

### Strict typing

- With `strict` + `strictTemplates` active in `tsconfig`, discipline is the gap. **Avoid `any`** (use the concrete type or `unknown`); type the HTTP wrapper generically instead of `Observable<any>`. Avoid `!` (non-null assertion) without justification.

### Centralized error handling (never silence)

- Two levels: (1) the HTTP wrapper's `catchError` normalizes `HttpErrorResponse` and shows an `ngx-toastr` toast ('danger'), then re-throws with `throwError`; (2) a global `ErrorInterceptor` handles auth: **403** → silent refresh-token + replay of the cloned request; **401** → redirect to `/login`; exclude the login/refresh endpoints.
- **Forbidden**: `catchError(() => of([]))` and leftover `console.log` of tokens/responses.
- Guard the deep message path: read `error?.error?.status?.error?.messages?.[0]` with optional-chaining + fallback. The unguarded access `error.error.status.error.messages[0]` blows up when the shape differs — fix it when touched.
- The session interceptor (Bearer token, per-request identity headers, pre-auth skip) is a separate interceptor from the `ErrorInterceptor`.

### Styling

- **SCSS** over `.css` (per-component `.component.scss` + global `styles.scss`/`theme.scss`). Bootstrap as cherry-picked SCSS partials with `$primary`/`$success` overridden **before** the import. Respect the per-component style budgets in `angular.json`. Avoid one-off inline styles.
- Existing codebases often mix Angular Material, Bootstrap and ng/ngx-bootstrap, plus, if the project has one, a shared component catalog
  in `shared/components` (e.g. data-table, pagination, status-badge, form-modal, page-header…). Detect the
  target's installed libraries and versions; **reuse before creating** and never copy a snapshot as a dependency baseline.
- Modals: use the installed compatible dialog library and the shared confirm dialog, if the project has one (e.g. `confirm-dialog`), for destructive actions. `window.confirm()` is forbidden.
- UX feedback: the loading service (e.g. `LoadingService.show()/hide()`) paired in `next` **and** `error`; errors via the toast service (e.g. a `ToastService` over ngx-toastr, dedup). Keep it simple (data-or-empty + toast); no Retry-button error blocks.

### Naming and i18n

- Domain identifiers follow the project's established language; framework members keep their Angular names.
- Catalog constants in `SCREAMING_SNAKE`, centralized in `Utils/const.ts` with a shared prefix (e.g. `CAT_STAGE`, `CAT_BANK`) — the FE mirror of the backend's catalog tables.
- In a single-locale app, never introduce a translation layer (`@angular/localize`/`TranslateService`) unless asked. Toast titles are literal strings in the app's locale. For prose rules, the `technical-writing` skill helps if it is available.

### Lint and test (gaps to remediate, never emulate)

- Lint: if a repo has no ESLint, recommend an ESLint + Prettier baseline for it. Never propagate the absence.
- Karma + Jasmine is a common legacy runner, not a permanent version constraint.
  Use the runner configured by the target and treat sparse coverage as a gap. For level/command/naming detail, the `software-testing` skill helps if it is available.

**Mounting a screen component drags its whole injector chain.** A screen component
injects a domain service, which injects the shared HTTP wrapper, which injects the toast service —
so a `TestBed` that declares only the component fails on a provider three hops away, and the error
names the last link, not the missing import. The two that account for most of it:

- Anything that reaches the shared HTTP wrapper needs `HttpClientTestingModule`.
- Anything that reaches the toast service needs the toast library's `forRoot()` in `imports`;
  without it the failure reads `No provider for InjectionToken ToastConfig`.

**Test the logic without mounting the template.** A screen component's template pulls in child
components, directives and bindings that have nothing to do with the rule under test. Override it:

```ts
TestBed.configureTestingModule({ declarations: [DebtComponent], schemas: [NO_ERRORS_SCHEMA] })
  .overrideComponent(DebtComponent, { set: { template: '' } });
```

Then call the method and assert the field it sets, instead of querying the DOM for a control the
test never needed to render. Keep the build as the companion check: the unit runner compiles
templates in JIT, so a template the AOT build rejects passes the suite and breaks the branch.

## Output

Rules to apply when implementing or reviewing Angular/TS. It generates no files and runs no runners. On detecting a violation (direct HttpClient, hardcoded URL, `catchError(()=>of([]))`, unguarded error path, fat smart component, `any` at the HTTP boundary), flag it and propose the idiomatic fix; the consumer decides and writes the change.
