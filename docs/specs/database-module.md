# Feature Specification: Database Module (TypeORM + pgvector)

> Status: Draft
> Created: 2026-10-29
> Last updated: 2026-10-29

## 1. Overview

### Problem
The NestJS app has no connection to the running Postgres (pgvector) database, no place to centralize data access, and no schema for storing documents and embeddings.

### Proposed solution
Connect NestJS to the existing Postgres instance with TypeORM (`@nestjs/typeorm`), and add a `DatabaseModule` exposing a `DbService` (behind an `IDbService` interface). `DbService` is the only layer allowed to talk to the database; all other services depend on it through the interface. A TypeORM migration creates the `documents` table and its HNSW index.

### Goals
- TypeORM connected to the existing Postgres, configured from `.env` through `@nestjs/config`.
- `DatabaseModule` containing `DbService` and its `IDbService` interface (no methods yet).
- `DbService` injectable by any other module that imports `DatabaseModule`.
- A reproducible migration (run manually via npm script) creating `documents` and `documents_embedding_idx`.
- A plain `Document` domain model matching the `documents` table.

### Non-goals
- Any `DbService` methods (insert/search/etc.), to be specified later.
- TypeORM entities (`@Entity` classes) — not used; the `Document` domain model is a plain TS type (see FR-007).
- Global module registration (consumers import `DatabaseModule` explicitly).
- Auto schema sync (`synchronize` stays off).

## 2. Functional Requirements

### FR-001: Configuration
- Description: Connection settings are read from environment variables via `@nestjs/config` (`ConfigModule`, `.env`).
- Expected behavior: Uses `POSTGRES_HOST` (new, no default, read only from `.env`), `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`. `POSTGRES_HOST` is added to `.env`.
- Priority: Must
- Validation and error handling: All five variables are required, with no fallback values. App fails at startup with a clear error if any is missing or the DB is unreachable.

### FR-002: TypeORM connection
- Description: Register `TypeOrmModule.forRootAsync` inside `DatabaseModule`, `type: 'postgres'`, using `ConfigService`.
- Expected behavior: `synchronize: false`; `migrationsRun: false` (migrations are never run automatically on app start, by decision; they are run explicitly with `npm run migration:run`); no entities registered.
- Priority: Must
- Validation and error handling: Connection errors surface at bootstrap and stop the app.

### FR-003: DbService and interface
- Description: `src/database/dbServiceInterface.ts` defines `IDbService` (empty for now) and a `DB_SERVICE` injection token (Symbol), since TypeScript interfaces do not exist at runtime. `src/database/dbService.ts` defines `DbService implements IDbService`, `@Injectable()`, with TypeORM's `DataSource` injected (the only place that holds DB access).
- Expected behavior: `DatabaseModule` provides `{ provide: DB_SERVICE, useClass: DbService }` and exports `DB_SERVICE`. Consumers add `DatabaseModule` to their `imports` and inject with `@Inject(DB_SERVICE) private readonly db: IDbService`.
- Priority: Must
- Validation and error handling: N/A (no methods).

### FR-004: Repository-layer rule
- Description: No other module may import `typeorm`/`@nestjs/typeorm` or use `DataSource`/repositories directly; all persistence goes through `IDbService`.
- Expected behavior: Enforced by convention and code review only (no ESLint rule).
- Priority: Should

### FR-005: Migration for `documents`
- Description: A hand-written TypeORM migration in `src/database/migrations/` runs this SQL via `queryRunner.query`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;

  CREATE TABLE documents (
      id BIGSERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      embedding VECTOR(1536) NOT NULL
  );

  CREATE INDEX documents_embedding_idx
  ON documents
  USING hnsw (embedding vector_cosine_ops);
  ```
- Expected behavior: `up` applies the above; `down` drops the index, then the table (the extension is left installed).
- Priority: Must
- Validation and error handling: Failure rolls back (TypeORM runs migrations in a transaction); re-running is a no-op once recorded in the `migrations` table.

### FR-006: Migration tooling
- Description: A standalone `DataSource` file (`src/database/dataSource.ts`) reading the same env vars, used by the TypeORM CLI. npm scripts: `migration:run`, `migration:revert`, `migration:show`.
- Expected behavior: `npm run migration:run` applies pending migrations against the docker Postgres.
- Priority: Must

### FR-007: Document domain model
- Description: `src/database/documentModel.ts` exports a plain TypeScript `Document` type/class mirroring the `documents` table, with no TypeORM decorators.
- Expected behavior: Fields `id: string` (BIGSERIAL is returned by `pg` as a string to avoid precision loss), `content: string`, `embedding: number[]` (1536 dimensions). Other modules may import this model; `DbService` will map rows to it when methods are added. Not used by any method yet.
- Priority: Should

## 3. Processing Flow

1. App starts; `ConfigModule` loads `.env`.
2. `DatabaseModule` builds the TypeORM connection from `ConfigService` and instantiates `DbService`.
3. Another module imports `DatabaseModule` and injects `DB_SERVICE`.
4. Schema changes are applied separately with `npm run migration:run` (not at app startup).

## 4. Data Model

### Entities
- No TypeORM entities. Domain model `Document` (plain TS, see FR-007): `id: string`, `content: string`, `embedding: number[]`.

### Table: `documents`
- Fields: `id BIGSERIAL PK`, `content TEXT NOT NULL`, `embedding VECTOR(1536) NOT NULL`
- Relationships: none
- Constraints / indexes: HNSW index `documents_embedding_idx` using `vector_cosine_ops`. Embedding dimension (1536) is fixed.

## 5. API and Integrations

No HTTP endpoints. Integrations:
- Postgres 17 + pgvector (`docker-compose.yml`, `Dockerfile.postgres`).
- New dependencies: `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/config`.

## 6. Business Rules

- BR-001: `DbService` is the only component allowed to access the database.
- BR-002: Schema changes are made only through migrations; `synchronize` is always `false`.
- BR-003: Consumers depend on `IDbService` (via `DB_SERVICE`), never on the concrete `DbService`.
- BR-004: Migrations are run manually, never automatically at app startup.

## 7. Acceptance Criteria

- AC-1: `npm run build` succeeds with no errors.
- AC-2: With the docker Postgres up, the app starts and connects without errors.
- AC-3: `npm run migration:run` creates `documents` and `documents_embedding_idx` (verify with `\d documents`); a second run reports nothing to apply.
- AC-4: `npm run migration:revert` removes the index and table.
- AC-5: A test/consumer module importing `DatabaseModule` can resolve `@Inject(DB_SERVICE)`.
- AC-6: `Document` model exists and compiles, with no `typeorm` import.

## 8. Open Questions

None. Decision: no `.env.example` will be created; `.env` is the only configuration source.
