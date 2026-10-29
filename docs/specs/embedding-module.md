# Feature Specification: Embedding Module (Markdown ingestion with Gemini)

> Status: Draft
> Created: 2026-10-29
> Last updated: 2026-10-29 (simplified: plain-sentence source file, split on `.`)

## 1. Overview

### Problem
The `documents` table is empty. Nothing reads `cv_markdown.md`, turns it into embeddings, or stores it through `IDbService.insertEmbedding`. In addition, `insertEmbedding` currently has a broken SQL statement and re-running an ingestion would create duplicate rows.

### Proposed solution
Add an `EmbeddingModule` with an `EmbeddingService` (behind an `IEmbeddingService` interface) that injects `IDbService` via `DB_SERVICE`. An idempotent instance method reads a plain-text file, splits it into sentences (chunks) on `.`, generates an embedding for each with Google's free-tier `gemini-embedding-001` (1536 dimensions), and calls `insertEmbedding` per chunk. Idempotency is guaranteed by a unique `content_hash` column and `ON CONFLICT DO NOTHING`.

### Goals
- `EmbeddingModule` containing `EmbeddingService` and `IEmbeddingService` (+ `EMBEDDING_SERVICE` token), mirroring the `DatabaseModule` conventions.
- `EmbeddingService` injects `IDbService` (`@Inject(DB_SERVICE)`).
- An ingestion method that is safe to run any number of times with the same file.
- Rewrite `cv_markdown.md` as plain sentences so splitting is a trivial split on `.` (no markdown parsing).
- Fix `DbService.insertEmbedding` so it actually inserts correctly.

### Non-goals
- Query-time embedding / similarity search endpoint (`findClosestFive` already exists; wiring it is a later spec).
- Embedding models other than Gemini; changing the vector dimension (stays 1536).
- Deleting stale rows when the markdown changes (only new content is added; removal is a later spec).
- Markdown-aware splitting (headings, bullets, heading-path context). Input files must follow FR-009 instead.
- Any HTTP endpoint for ingestion (it is run manually from the CLI, see FR-008).

## 2. Functional Requirements

### FR-001: Module and interface
- Description: `src/embedding/embeddingModule.ts`, `src/embedding/services/embeddingService.ts`, `src/embedding/services/embeddingServiceInterface.ts` (same layout/naming as `src/database`). The interface file exports `IEmbeddingService` and `EMBEDDING_SERVICE = Symbol('EMBEDDING_SERVICE')`. The embedding model provider lives next to the service (FR-004).
- Expected behavior: `EmbeddingModule` imports `DatabaseModule` and `ConfigModule`, provides `{ provide: EMBEDDING_SERVICE, useClass: EmbeddingService }` and `{ provide: EMBEDDING_MODEL, useClass: GeminiEmbeddingModel }`, and exports `EMBEDDING_SERVICE` only (the model is internal to the module). `EmbeddingModule` is added to `AppModule` imports.
- Priority: Must
- Validation and error handling: Consumers depend on `IEmbeddingService`, never on the concrete class (same rule as BR-003 of the database spec).

### FR-002: Ingestion method
- Description: `IEmbeddingService.embedMarkdownFile(filePath: string): Promise<Result<EmbedSummary, EmbedMarkdownError>>`. It is an **instance** method (not `static`) because it needs the injected `IDbService`.
- Expected behavior: Reads the file (UTF-8), splits it into chunks (FR-003), and for each chunk gets its embedding from the injected `IEmbeddingModel` (`@Inject(EMBEDDING_MODEL)`, FR-004) and calls `db.insertEmbedding(content, embedding)`. `EmbedSummary` = `{ chunks: number }`. The service knows nothing about Gemini or HTTP.
- Priority: Must
- Validation and error handling: Returns `err(...)` for: `FileNotFound`, `NoChunks` (empty file) and `EmbeddingFailed` (the model returned an error `Result`; the run stops). Uses the project's `Result` helpers (`err`, `okey`) from `src/shared/result.ts`. DB failures are thrown (not caught) and stop the run; rows already inserted stay, which is safe because of FR-006.

### FR-003: Splitting by sentence
- Description: A pure, deterministic helper `splitSentences(text: string): string[]`. No markdown parsing: the source file is plain sentences (FR-009).
- Expected behavior: Split on a period that is followed by whitespace or end of file (regex `/\.(?=\s|$)/`), so periods inside tokens such as `Node.js`, `.NET` or a URL do not split. Each piece is trimmed, internal whitespace/newlines collapsed to a single space, empty pieces dropped, duplicates collapsed (first occurrence kept). The trailing period is not part of the chunk.
- Priority: Must
- Validation and error handling: Same input always yields the same chunks in the same order. Input with no sentences yields `[]` (`NoChunks`, FR-002).

### FR-009: Source file format (`cv_markdown.md`)
- Description: The ingested file is rewritten as plain text: one complete, self-contained sentence per line, every sentence ending with a period, and no headings, bullets, bold or other markdown syntax.
- Expected behavior: Every sentence names its subject (e.g. "Diogo...", "At TouchePulse, Diogo...", "The Factory Telemetry Platform...") so it makes sense as a retrieved chunk without surrounding context. A period followed by whitespace is used only to end a sentence (no `e.g.`, `vs.` or similar abbreviations). Phone number and email are not included. The file keeps its name `cv_markdown.md` and root location.
- Priority: Must
- Validation and error handling: Splitting the file produces exactly one chunk per line (38 chunks at the time of writing).

### FR-004: Embedding model provider (Gemini)
- Description: A separate provider behind an interface, so the model can be swapped without touching the service. Files are in `src/embedding/services/`.
  - `geminiEmbeddingModelInterfaceService.ts`: `EMBEDDING_MODEL = Symbol('EMBEDDING_MODEL')`, `IEmbeddingModel { embed(text: string): Promise<Result<number[], EmbeddingModelError>> }` (one text in, one vector out) and `enum EmbeddingModelError { FailedToEmbed }`.
  - `geminiEmbeddingModelService.ts`: `GeminiEmbeddingModel implements IEmbeddingModel`, `@Injectable()`, injects `ConfigService`. Makes one request per text to the Gemini API `models/gemini-embedding-001` (`embedContent`) with `outputDimensionality: 1536` and `taskType: RETRIEVAL_DOCUMENT`, using the global `fetch` (no new dependency), and returns `ok(embedding.values)`.
- Expected behavior: Intentionally minimal: no batching, no retries, no logging, no `try/catch`, no vector post-processing. Vectors are not normalized because the search uses cosine distance (`<=>`), which is scale-invariant. A vector with the wrong dimension is rejected by the `VECTOR(1536)` column.
- Priority: Must
- Validation and error handling: A non-OK HTTP response returns `err(EmbeddingModelError.FailedToEmbed)`; the service maps it to `EmbedMarkdownError.EmbeddingFailed`, and `ingest.ts` prints it and exits with code 1.

### FR-005: Configuration
- Description: `GEMINI_API_KEY` is read by `GeminiEmbeddingModel` through `ConfigService.getOrThrow`, added to `.env`. The default file path is the `cv_markdown.md` at the project root (resolved with `process.cwd()`).
- Expected behavior: App fails fast on startup/first use if the key is missing, consistent with the database spec's no-fallback rule.
- Priority: Must

### FR-006: Idempotency (content hash)
- Description: New migration `src/database/migrations/<timestamp>AddDocumentContentHash.ts`:
  ```sql
  ALTER TABLE documents ADD COLUMN content_hash CHAR(64);
  UPDATE documents SET content_hash = encode(sha256(convert_to(content, 'UTF8')), 'hex');
  ALTER TABLE documents ALTER COLUMN content_hash SET NOT NULL;
  ALTER TABLE documents ADD CONSTRAINT documents_content_hash_key UNIQUE (content_hash);
  ```
  `down` drops the constraint and the column.
- Expected behavior: `DbService.insertEmbedding` computes `sha256(content)` (hex) itself, so the `IDbService` signature does not change, and inserts with `ON CONFLICT (content_hash) DO NOTHING`. Running `embedMarkdownFile` N times on the same file leaves the table identical to running it once.
- Priority: Must
- Validation and error handling: Identical chunk text is stored once. Optimization (Should): skip the Gemini call for chunks whose hash already exists, which needs a new `IDbService` method (e.g. `existingHashes`); deferred unless the free-tier quota becomes an issue.

### FR-007: Fix `insertEmbedding`
- Description: The current statement `INSERT INTO documents VALUES ($1::string,$2::vector)` has no column list (so values map to `id`, `content`) and uses a non-existent `string` type.
- Expected behavior: Becomes
  ```sql
  INSERT INTO documents (content, content_hash, embedding)
  VALUES ($1, $2, $3::vector)
  ON CONFLICT (content_hash) DO NOTHING
  ```
- Priority: Must

### FR-008: Manual CLI trigger
- Description: `src/embedding/ingest.ts` is a standalone script that bootstraps Nest **without an HTTP server** (`NestFactory.createApplicationContext(AppModule)`), resolves `EMBEDDING_SERVICE`, calls `embedMarkdownFile`, prints the result, and closes the context. New npm script: `"ingest": "ts-node -r tsconfig-paths/register src/embedding/ingest.ts"`.
- Expected behavior: `npm run ingest` ingests the root `cv_markdown.md`; `npm run ingest -- path/to/other.md` ingests another file. On success prints `Ingested N chunks` and exits `0`; on an error `Result` prints the error name and exits `1`. Ingestion is never triggered automatically on app start and no endpoint exists.
- Priority: Must
- Validation and error handling: The context is always closed (also on failure) so the DB connection does not keep the process alive. Imports in `src/` that use the `src/...` alias must resolve under `ts-node` (hence `tsconfig-paths/register`, already a devDependency).

## 3. Processing Flow

1. `npm run ingest` starts the standalone script, which resolves `EMBEDDING_SERVICE` and invokes `embedMarkdownFile('cv_markdown.md')`.
2. The file is read; missing/empty file returns an error `Result`.
3. The text is split into sentences on `.` (FR-003).
4. For each chunk, `IEmbeddingModel.embed` calls Gemini (1536 dims) and returns the vector.
5. For each chunk, `IDbService.insertEmbedding(content, embedding)` hashes the content and inserts it, ignoring duplicates.
6. Returns `okey({ chunks })`; the script prints it, closes the Nest context, and exits with code 0 (or 1 on error).

## 4. Data Model

### Table: `documents` (changed)
- Fields: `id BIGSERIAL PK`, `content TEXT NOT NULL`, `embedding VECTOR(1536) NOT NULL`, **new** `content_hash CHAR(64) NOT NULL UNIQUE`.
- Constraints / indexes: HNSW index unchanged; new unique constraint `documents_content_hash_key`.
- The `Document` / `DocumentMatch` domain models need no change (hash is internal to the DB layer).

## 5. API and Integrations

No HTTP endpoints in this spec.
- Google Gemini API: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`, header `x-goog-api-key: $GEMINI_API_KEY`. Free tier is rate-limited, and content sent to the free tier may be used by Google to improve its products. The CV text is sent to Gemini as-is; phone and email are no longer in the file (FR-009), which was the main privacy concern.

## 6. Business Rules

- BR-001: `EmbeddingService` never touches the database directly (only `IDbService`) and never calls an embedding API directly (only `IEmbeddingModel`).
- BR-002: Re-running ingestion on unchanged input must not create duplicate rows.
- BR-003: Every stored vector is 1536-dimensional (`outputDimensionality`, enforced by the column type).
- BR-004: Schema changes only through migrations (run manually with `npm run migration:run`).

## 7. Acceptance Criteria

- AC-1: `npm run build` succeeds with no errors or warnings.
- AC-2: After `npm run migration:run`, `\d documents` shows `content_hash` with the unique constraint; `migration:revert` removes it.
- AC-3: With a valid `GEMINI_API_KEY`, `npm run ingest` exits 0, the process terminates by itself, and it fills `documents` with N rows (N > 0), each with a 1536-dim embedding.
- AC-4: Running `npm run ingest` a second time leaves the row count unchanged.
- AC-5: `findClosestFive` with the embedding of a query such as "Which databases does he know?" returns the sentences about PostgreSQL first (manual sanity check).

## 8. Open Questions

- ~~How is ingestion triggered?~~ Decided: manual `npm run ingest` standalone script (FR-008), no endpoint.
- ~~Accept sending CV personal data to Gemini?~~ Decided: phone and email were removed from `cv_markdown.md` (FR-009); the remaining text is sent to Gemini.
- ~~Should the Gemini call live behind its own provider?~~ Decided: yes, `IEmbeddingModel` / `GeminiEmbeddingModel` (FR-004).
