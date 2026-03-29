# Backend Status Report

Date: 2026-03-30
Scope reviewed: current backend in this workspace (Express + Firebase Admin + Knex/Postgres + partial Fabric stubs)

## Honest assessment

You have a good base architecture direction (routes -> controllers -> services -> DAO, with schema validation and middleware separation), but the backend is currently in a fragile state for production.

Main reason: there are several hard runtime blockers and schema/column mismatches that will break core flows before business logic can stabilize.

## What is good already

- Clear layered structure by responsibility (route/controller/service/DAO).
- Validation intent is present with Joi models.
- Authentication middleware exists and is integrated.
- Knex + migration setup exists (good direction for DB evolution).
- Rate limiting is already added.

## Critical issues (fix first)

1. Unresolved Git conflict markers in migration file (DB boot blocker)
- File: db/migrations/20260309150048_init.js:8, db/migrations/20260309150048_init.js:74, db/migrations/20260309150048_init.js:87
- Problem: file still contains <<<<<<<, =======, >>>>>>> conflict markers.
- Impact: migrations are invalid and schema state is unreliable.

2. Signup/Login are protected by token middleware (auth flow deadlock)
- File: routes/usersRoute.js:8, routes/usersRoute.js:9
- Problem: router-level decodeToken middleware runs before /signup and /login.
- Impact: unauthenticated users cannot signup/login, likely immediate 401.

3. Network service references undefined members/variables (runtime crash)
- File: service/networkService.js:39
- Problem: this.userDao is used but never initialized in constructor.
- File: service/networkService.js:39
- Problem: firebase_uid variable is not defined in networkCreation.
- File: service/networkService.js:70
- Problem: organization_name variable is not defined.
- File: service/networkService.js:72
- Problem: users_id variable is not defined.
- File: service/networkService.js:80
- Problem: validate is called with key node, but schema key is nodeSchema.
- Impact: network and organization endpoints will fail at runtime.

4. DB column mismatches between migration and DAO/controller responses
- File: db/migrations/20260309150048_init.js:21-27 creates users.user_id, users.email, users.firebase_uid (no id, no username).
- File: dao/userDao.js:14 returns id, username.
- File: dao/userDao.js:31 selects id, email.
- File: controllers/userController.js:14-16 returns user.id and user.username.
- Impact: inserts/selects and response payload mapping are inconsistent; responses can be wrong/null or throw depending on query result.

5. Organization DAO writes column that migration does not define
- File: dao/networkDao.js:25-31 inserts users_id into organization table.
- File: db/migrations/20260309150048_init.js:40-52 organization table has network_id, name, msp_id but no users_id.
- Impact: insert into organization will fail with column does not exist.

6. Environment file load path likely points to wrong location
- File: server.js:5 uses path.resolve(__dirname, '../../.env')
- Problem: from backend/server.js this resolves two levels up; backend/.env is one level down from repo root and should normally be ../.env or direct default load.
- Impact: env variables may silently fail to load depending on where command is run.

## High-priority quality/security concerns

1. Token payload is logged
- File: middleware/authenticate.js:18
- Risk: logs can expose user identifiers and increase sensitive-data surface.

2. Controller error paths do not always send a response
- File: controllers/userController.js:18-20 and controllers/userController.js:27-29
- Risk: requests can hang on unhandled errors; operational debugging is harder.

3. Duplicate DB clients without a single source of truth
- File: db/db.js and db/knex.js
- Risk: inconsistent environment usage and connection lifecycle behavior.

4. Implicit globals in Joi schema files
- File: models/user/signupModel.js:3, models/user/loginModel.js:3, models/network/organizationCreation.js:3
- Problem: schemas are assigned without const/let.
- Risk: implicit global mutation bugs in CommonJS runtime.

5. Package drift / uncertainty
- File: package.json includes sequelize, but code path appears Knex-based.
- Risk: dependency sprawl and ambiguity around data layer standard.

## Suggested action plan (stabilize first)

Phase 1: Make backend runnable and deterministic
- Resolve migration conflict file and keep one coherent schema history.
- Align all DAO column names with migration names (user_id vs id, name vs organization_name, etc.).
- Fix networkService constructor and undefined variable references.
- Remove router-level auth requirement for /signup and /login; apply auth selectively.
- Standardize on one Knex instance export and use it everywhere.

Phase 2: Improve correctness and observability
- Return consistent error responses from all controllers.
- Introduce centralized error middleware (map known domain errors to 4xx, unknown to 500).
- Add request validation failure structure (field, message, code).
- Remove sensitive logs and add structured logging.

Phase 3: Add tests before major refactors
- Add integration tests for signup/login/network/organization happy + failure paths.
- Add migration smoke test in CI (fresh DB + migrate latest).
- Add DAO tests for column mapping assumptions.

## TypeScript migration plan (safe, incremental)

### Recommended strategy
Migrate incrementally, not big-bang. Keep runtime behavior stable while adding type safety file-by-file.

### Step-by-step

1. Prepare tooling
- Install: typescript, tsx (or ts-node), @types/node, @types/express, @types/cors, @types/express-rate-limit.
- Add tsconfig.json with strict true, noImplicitAny true, outDir dist, rootDir src (or backend root during transition).

2. Introduce a shared type layer first
- Create interfaces for:
  - AuthenticatedRequest (extends Express Request with user payload)
  - DTOs (SignupInput, LoginInput, CreateNetworkInput, CreateOrganizationInput)
  - DAO return models aligned to real DB columns
- Add typed config module for env loading and validation.

3. Convert low-risk files first
- Convert Joi schema modules and pure config files to .ts.
- Then convert middleware/authenticate.js and middleware/rateLimiter.js.

4. Convert service and DAO layer next
- Convert service/userService.js, dao/userDao.js, service/networkService.js, dao/networkDao.js.
- Replace stringly-typed schema keys with typed map/enum.
- Add explicit return types on all async methods.

5. Convert controllers and routes
- Use typed request bodies and typed response payloads.
- Ensure controller methods always return a response or throw to centralized error handler.

6. Build + run transition
- During migration, allow JS + TS together:
  - Set allowJs true initially.
  - Gradually switch files to TS.
  - When complete, set allowJs false.

7. Productionize
- Build command: tsc
- Start command: node dist/server.js
- Dev command: tsx watch server.ts (or nodemon + tsx)

8. Final strictness hardening
- Enable exactOptionalPropertyTypes and noUncheckedIndexedAccess.
- Remove any remaining any.

### Suggested target structure after migration

- src/server.ts
- src/routes/*.ts
- src/controllers/*.ts
- src/service/*.ts
- src/dao/*.ts
- src/middleware/*.ts
- src/models/*.ts
- src/db/*.ts
- src/types/*.ts

### Important migration note for your codebase

TypeScript will immediately expose the current hidden bugs in networkService (undefined properties/variables, wrong schema keys) and DAO/schema column mismatches. This is good: fix those first while introducing types to avoid carrying broken assumptions into TS.

## Overall verdict

Your architecture direction is good and absolutely salvageable. The immediate need is not redesign; it is consistency and correctness in the current data/auth flow. Once the blockers above are fixed, migrating to TypeScript will be straightforward and will likely prevent this exact class of issues from recurring.
