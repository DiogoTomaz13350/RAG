# RAG

A Retrieval-Augmented Generation (RAG) API built with **NestJS**, **PostgreSQL + pgvector**, **Google Gemini** and **Mastra**.

Markdown documents are split into chunks, embedded with Gemini, and stored in Postgres. When a question arrives, an AI agent calls a retrieval tool that finds the five closest chunks (cosine distance) and answers using only that context.

## How It Works

```text
Ingestion (npm run ingest)
  Markdown file ──► split into sentences ──► Gemini embedding ──► documents table
                    (trim, dedupe)            (1536-d vector)     (SHA-256 content_hash, no duplicates)

Question (GET /?question=...)
  AppController ──► AgentService ──► Assistant Agent (Gemini Flash)
                                          │ calls tool "findPossibleAnswers"
                                          ▼
                       embed question ──► pgvector cosine search (top 5) ──► answer from retrieved chunks
```

## Project Structure

```text
src/
├── main.ts                     # Bootstraps the HTTP app (PORT, default 3000)
├── app.module.ts               # Root module (Database, Embedding, Agent)
├── app.controller.ts           # GET / ?question=...
├── agent/
│   ├── agentModule.ts
│   ├── service/                # AgentService (IAgentService, RagAgentError)
│   └── mastra/
│       ├── mastraFactory.ts    # Builds the Mastra instance
│       ├── agents/             # Assistant agent (instructions + model + tools)
│       └── tools/              # findPossibleAnswers retrieval tool
├── embedding/
│   ├── embeddingModule.ts
│   ├── ingest.ts               # CLI entry point for ingestion
│   └── services/               # EmbeddingService (chunking) + GeminiEmbeddingModel
├── database/
│   ├── databaseModule.ts       # TypeORM connection from .env
│   ├── dataSource/             # DataSource used by the TypeORM CLI
│   ├── migrations/             # documents table, HNSW index, content_hash
│   ├── domain/                 # DocumentMatch
│   └── services/               # DbService (insertEmbedding, findClosestFive)
└── shared/result.ts            # Result<T, E> type (okey / err)
docker/init-pgvector.sql        # Enables the vector extension on first DB init
Dockerfile.postgres             # pgvector/pgvector:pg17 image
docker-compose.yml              # Postgres service (rag-postgres)
docs/                           # Development rules, spec template and feature specs
cv_markdown.md                  # Default document ingested by `npm run ingest`
```

Each module exposes services through an interface and an injection token (`DB_SERVICE`, `EMBEDDING_MODEL`, `EMBEDDING_SERVICE`, `AGENT_SERVICE`). Services that can fail return a `Result<T, E>` instead of throwing.

## Prerequisites

- Node.js 22+ and npm
- Docker (for PostgreSQL + pgvector)
- A [Gemini API key](https://aistudio.google.com/apikey)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root (it is git-ignored):

   ```env
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=rag
   POSTGRES_PASSWORD=change-me
   POSTGRES_DB=rag
   GEMINI_API_KEY=your-gemini-api-key
   # Optional, defaults to 3000
   PORT=3000
   ```

   `docker-compose.yml` fails with a clear message if any `POSTGRES_*` variable is missing.

3. **Start PostgreSQL**

   ```bash
   docker compose up -d
   ```

4. **Run the migrations**

   ```bash
   npm run migration:run
   ```

5. **Ingest a document** (defaults to `cv_markdown.md`)

   ```bash
   npm run ingest
   npm run ingest -- path/to/file.md
   ```

6. **Start the API**

   ```bash
   npm run start:dev
   ```

## API

### `GET /?question=<text>`

Asks the RAG agent a question and returns the answer as plain text.

```bash
curl "http://localhost:3000/?question=What%20programming%20languages%20do%20you%20know%3F"
```

| Status | Meaning |
| --- | --- |
| `200` | Answer text |
| `400` | `question` is missing or blank |
| `502` | The agent returned an empty response |

## Database

Managed through TypeORM migrations in `src/database/migrations` (never `synchronize`):

- `CreateDocuments` — enables `vector`, creates `documents (id, content, embedding VECTOR(1536))` and the `documents_embedding_idx` HNSW index (`vector_cosine_ops`).
- `AddDocumentContentHash` — adds a unique `content_hash` (SHA-256) so re-ingesting the same content is a no-op (`ON CONFLICT DO NOTHING`).

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run start` / `start:prod` | Start once / run the compiled build (`dist/main`) |
| `npm run build` | Compile with Nest CLI |
| `npm run ingest [-- <file>]` | Chunk, embed and store a markdown file |
| `npm run migration:run` / `migration:revert` / `migration:show` | Manage TypeORM migrations |
| `npm run test` / `test:cov` / `test:e2e` | Unit tests / coverage / end-to-end tests |
| `npm run lint` / `npm run format` | ESLint (with fix) / Prettier |
