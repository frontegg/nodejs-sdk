# SDK Test Coverage Plan (BMAD-style)

Repo: `@frontegg/client` (nodejs-sdk), branch `next`.
Baseline: 85 source files, 12 existing spec files (~14% file coverage). Jest + ts-jest, thresholds currently set very low (stmts 17 / br 24 / fn 20 / ln 18).
Goal: comprehensive **unit** coverage for all behavior-bearing modules + a **real-sandbox e2e** suite covering the primary public SDK flows.

---

## 1. Phases (BMAD)

| Phase | Owner | Deliverable |
|---|---|---|
| **B – Brief** | this doc | Scope, risks, test matrix (below) |
| **M – Model/Design** | this doc | Per-module spec outline, e2e flow list, fixtures & mocks strategy |
| **A – Act** | follow-up PRs | Spec files, e2e harness, CI wiring |
| **D – Done** | follow-up | Coverage thresholds raised, CI green on unit + e2e-on-demand |

---

## 2. Existing coverage (keep / extend)

Already specced — I will only **extend** these where gaps are obvious:

- `src/cache/local-cache.manager.spec.ts`
- `src/cache/ioredis-cache.manager.spec.ts`
- `src/clients/http/http-client.spec.ts`
- `src/clients/identity/identity-client.spec.ts`
- `src/clients/identity/step-up/step-up.validator.spec.ts`
- `src/clients/hosted-login/hosted-login.client.spec.ts`
- `src/clients/entitlements/entitlements-client.spec.ts`
- `src/clients/entitlements/entitlements.user-scoped.spec.ts`
- `src/clients/entitlements/storage/in-memory/in-memory.cache.spec.ts`
- `src/clients/entitlements/storage/in-memory/mappers/plan-tuple.mapper.spec.ts`
- `src/clients/entitlements/storage/in-memory/mappers/feature-flag-tuple.mapper.spec.ts`
- `src/middlewares/with-authentication.spec.ts`

Gap check for each of the above: run with `--coverage`, note < 90% branch lines, file patch-spec tasks.

---

## 3. Unit test matrix — files to add

Grouped by module. Each row = one new `*.spec.ts` next to the source file.

### 3.1 cache
| File | Focus |
|---|---|
| `src/cache/redis-cache.manager.spec.ts` | `set/get/del/ttl`, JSON (de)serialization, connection error paths, key-prefixing, `ioredis` mocked via `ioredis-mock` or `jest-mock-extended` |

### 3.2 http client
Extend `http-client.spec.ts` — retries, auth header injection, base URL resolution, error mapping, timeout.

### 3.3 identity — token resolvers
| File | Focus |
|---|---|
| `token-resolvers/token-resolver.spec.ts` | Dispatch to access vs authorization resolver, unknown token → `InvalidTokenTypeException` |
| `token-resolvers/access-token-resolver.spec.ts` | Tenant vs user access-token routing, cache hit/miss, error propagation |
| `token-resolvers/authorization-token-resolver.spec.ts` | JWT verification happy path, `jsonwebtoken.verify` mocked, expired / bad signature / wrong issuer |
| `access-token-services/services/access-token.service.spec.ts` | Base service contract (fetch, parse, error) |
| `access-token-services/services/tenant-access-token.service.spec.ts` | Tenant-specific endpoint + payload shape |
| `access-token-services/services/user-access-token.service.spec.ts` | User-specific endpoint + payload shape |
| `access-token-services/cache-services/cache-access-token.service.spec.ts` | Cache key strategy, TTL, bypass on miss |
| `access-token-services/cache-services/cache-tenant-access-token.service.spec.ts` | Tenant cache key uniqueness + eviction |
| `access-token-services/cache-services/cache-user-access-token.service.spec.ts` | User cache key uniqueness + eviction |

### 3.4 identity — exceptions
One combined spec `src/clients/identity/exceptions/exceptions.spec.ts` that exercises:
- `FailedToAuthenticateException`
- `InsufficientPermissionException`
- `InsufficientRoleException`
- `InvalidTokenTypeException`
- `MaxAgeExceededException`
- `MissingAcrException`
- `MissingAmrException`
- `StatusCodeErrorException`

Assert: message, `name`, `statusCode` (where applicable), `instanceof Error`, serialization.

### 3.5 entitlements
| File | Focus |
|---|---|
| `entitlements-client.events.spec.ts` | Event emitter wiring: subscribe/unsubscribe, replay, error isolation per listener |
| `helpers/frontegg-entity.helper.spec.ts` | Entity-key building, normalization, edge cases (empty tenant/user) |
| `storage/exp-time.utils.spec.ts` | `isExpired`, `computeTtl`, off-by-one & clock skew |
| `storage/in-memory/in-memory.cache-key.utils.spec.ts` | Key shape per entity type, collision guards |
| `storage/in-memory/mappers/helper.spec.ts` | Shared mapper helpers |
| `storage/in-memory/mappers/sources.mapper.spec.ts` | Source record → tuple mapping, unknown source fallback |
| `api-types/.../feature-set.spec.ts` | If it contains runtime logic (otherwise skip — pure types) |
| `api-types/.../feature.spec.ts` | Same |

### 3.6 events client
| File | Focus |
|---|---|
| `src/clients/events/events.spec.ts` | `trigger` happy path, channel config validation, required-field errors (`types/errors.ts`), retries on 5xx, idempotency key |

### 3.7 utils
| File | Focus |
|---|---|
| `src/utils/package-loader.spec.ts` | Optional-peer loading for `ioredis` / `redis`: returns module when present, returns `null` on `MODULE_NOT_FOUND`, rethrows unexpected errors |

### 3.8 authenticator
`src/authenticator/index.ts` — spec for vendor-token acquisition, expiry refresh, concurrent-caller dedupe, failure propagation.

### 3.9 middlewares
Extend `with-authentication.spec.ts` — cover: missing header, malformed header, expired token, role / permission guards, next() on success, error formatting.

### 3.10 components
`src/components/frontegg-context/*` — if non-type runtime exists, spec context resolution from `req`.

---

## 4. Shared unit-test infrastructure (new)

Create `src/__test-utils__/` (excluded from publish via `files` in package.json):

- `jwt.ts` — `signTestJwt(payload, { kid, exp, iss, aud })` using `jsonwebtoken` + a stable RSA keypair fixture.
- `jwks.ts` — in-memory JWKS server fixture for `jsonwebtoken` verification paths that go through JWKS.
- `http.ts` — `axios-mock-adapter` helpers: `mockAuthEndpoint`, `mockVendorToken`, `mockEntitlements`.
- `cache.ts` — `makeInMemoryCache()` factory.
- `fixtures/` — canonical user, tenant, entitlements, feature-flag payloads.

Naming policy: all helpers live under `__test-utils__`, imported only from `*.spec.ts`. Jest `testPathIgnorePatterns` already excludes non-`.spec.ts`.

---

## 5. E2E suite — real Frontegg sandbox

### 5.1 Location & config
- New dir: `src/__e2e__/`
- New file: `jest.e2e.config.js` (separate from unit) with:
  - `testRegex: 'src/__e2e__/.*\\.e2e\\.ts$'`
  - `setupFilesAfterEach`: tenant cleanup
  - `testTimeout: 60_000`
- `npm run test:e2e` script.
- Guarded by required env: `FRONTEGG_BASE_URL`, `FRONTEGG_CLIENT_ID`, `FRONTEGG_API_KEY`, `FRONTEGG_TEST_TENANT_ID`, `FRONTEGG_TEST_USER_ID`, `FRONTEGG_TEST_USER_JWT` (or the ability to mint one). If any are missing → `describe.skip` with a clear message.

### 5.2 Credential hygiene
- Credentials loaded via `process.env` only. Never committed. A `.env.e2e.example` documents the required keys. `.env.e2e` in `.gitignore`.
- All E2E operations target a **dedicated sandbox tenant** — no writes against prod.
- Each test cleans its own side effects (created users, triggered events) in `afterAll`.

### 5.3 Flows to cover (one `*.e2e.ts` per flow)

| Flow | Asserts |
|---|---|
| `identity-client.e2e.ts` | Real vendor-token fetch → `validateIdentityOnToken` against a freshly minted user JWT → permissions/roles echo back |
| `http-client.e2e.ts` | Authenticated request to a known public Frontegg read endpoint returns 200 + expected shape |
| `entitlements-client.e2e.ts` | `isEntitledTo` happy path for a known feature flag in the sandbox; unknown feature → not entitled |
| `hosted-login.client.e2e.ts` | `requestAuthorize` URL construction against sandbox vendor; code-exchange stub if sandbox supports it |
| `events.e2e.ts` | Trigger a channel-configured event into the sandbox event bus, assert 2xx |
| `middlewares.e2e.ts` | Boot a minimal `express` app, hit it with a real sandbox user JWT, assert `req.frontegg.user` is populated |
| `step-up.e2e.ts` | Validate a real step-up token from sandbox (or assert failure path if minting not available) |

### 5.4 CI wiring
- Unit tests: run on every PR (existing).
- E2E: separate GH Actions workflow, `workflow_dispatch` + nightly cron, credentials from repo secrets, does **not** block PR merges.

---

## 6. Coverage targets (raise after Act phase)

Move `jest.config.js` thresholds from the current floor to:

```
statements: 85,
branches:   75,
functions:  85,
lines:      85,
```

Any file that intentionally stays below (e.g. `src/types/express/index.d.ts`, pure type files) goes into `collectCoverageFrom` exclusions.

---

## 7. Risks & open questions

1. **Sandbox availability** — do you already have a Frontegg sandbox tenant dedicated to SDK e2e, or should I scaffold the e2e with `describe.skip` placeholders and let you fill in credentials?
2. **User JWT minting** — does the sandbox expose a way to mint a user JWT for a test user via API, or will you provide a long-lived test JWT via env? This determines whether e2e is fully self-contained.
3. **Rate limits** — nightly + on-demand should be fine; confirm no per-minute ceiling that batched e2e would hit.
4. **Secrets storage** — confirm the GH Actions secret names to use (`FRONTEGG_E2E_*` prefix suggested).
5. **Type-only files** — I'll skip files that are 100% `type`/`interface` exports; flag if you want stub specs for them anyway.
6. **Test-utils publishing** — confirm `src/__test-utils__/` should be excluded from the published package (it will be, via `.npmignore` / tsconfig `exclude`).

---

## 8. Proposed execution order (Act phase)

1. Land `__test-utils__/` + fixtures (no behavior change).
2. Unit specs for **identity token-resolvers** + **exceptions** (highest security value).
3. Unit specs for **authenticator**, **events**, **package-loader**, **redis-cache.manager**.
4. Unit specs for remaining **entitlements helpers/mappers/storage utils**.
5. Extend existing specs to close branch-coverage gaps.
6. Land `jest.e2e.config.js` + `__e2e__/` skeleton with one real flow (`identity-client.e2e.ts`) as proof.
7. Fill remaining e2e flows.
8. Raise coverage thresholds, wire e2e workflow, update README with `test` / `test:e2e` instructions.

Each step ships as its own commit/PR to keep review tractable.
