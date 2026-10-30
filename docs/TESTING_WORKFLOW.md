## Testing Workflow

This workflow applies to **.NET** and **Node.js / NestJS (TypeScript)** projects. Detect the stack from the repository (`*.sln` / `*.csproj` → .NET, `package.json` → Node) and use the matching commands below. Mixed repositories use both.

### When this workflow applies

- **Features, API changes, behavior changes:** the full workflow, including independent sub-agent verification (section 5).

### Stack commands

| Purpose | .NET | Node / NestJS |
|---|---|---|
| Build | `dotnet build` | `npm run build` |
| Typecheck | (part of build) | `npx tsc --noEmit -p .` |
| Lint | (analyzers in build) | `npx eslint <changed paths>` |
| Unit tests | `dotnet test path/to/TestProject.csproj` | `npm test` (Jest, `*.spec.ts` in `src/`) |
| Whole suite | `dotnet test` | `npm test` and `npm run test:e2e` |
| Run app | `dotnet run` | `npm run start:dev` (or `npm run start`) |

Always check `package.json` scripts / the solution layout first. Prefer what the repository already defines over the table above.

### 1. Determine the Testing Strategy

Before writing tests or executing them:
1. Inspect the existing test projects, frameworks, conventions, and infrastructure.
2. Identify which parts of the application are affected.
3. Determine the appropriate testing levels based on the changes.
4. Reuse existing testing patterns and frameworks. Do not introduce new testing frameworks without a good reason.

Choose the appropriate tests from the following:

- **Unit Tests:** Individual classes, functions, business logic, validation rules, calculations, and edge cases in isolation.
- **API / Endpoint Tests:** HTTP endpoints using the existing integration infrastructure (.NET `WebApplicationFactory`, NestJS `Test.createTestingModule` + `supertest`) or `curl` when appropriate.
- **End-to-End (E2E) Tests:** Complete workflows across multiple layers, including frontend and backend where applicable.

Not every change requires every level. Select the tests that provide meaningful coverage for the specific change.

### 2. Create or Update Tests

1. Add tests for new functionality.
2. Update existing tests when behavior or requirements change. If an existing test is stale (it asserts behavior that was intentionally removed), update it to the new behavior and say so in the report.
3. Cover normal scenarios, edge cases, invalid inputs, and failure scenarios where relevant.
4. Verify expected behavior, not merely implementation details.
5. Keep tests isolated, deterministic, and repeatable.
6. Never weaken, delete, or skip existing tests simply to make the suite pass.
7. Do not modify application behavior solely to satisfy an incorrect test. Investigate whether the implementation or the test expectation is wrong.

#### What to mock and what to keep real

- **Fake the data-access layer by default.** Unit and API tests must replace the repository/database service (for example `IDbService`, which wraps TypeORM) with an in-memory fake at the DI boundary, so no database connection is needed.
- **Exception — the data-access class itself.** A fake cannot verify real SQL, migrations, or database-specific features (for example pgvector ordering, `ON CONFLICT`, type casts). Changes to the data-access class or to migrations MUST also be verified against a real database. Keep these as a small, separate integration suite with its own script (for example `npm run test:integration`), not part of the default `npm test` / `dotnet test` run. Run it against a throwaway test database (for example a Docker Postgres image with the required extensions), never against a development or production database, and apply migrations to it before the tests.
- Prefer the real HTTP pipeline (controllers, pipes, filters) when it is fast and deterministic.
- **Always fake external, paid, slow, or non-deterministic services** — LLM / AI providers, embedding APIs, third-party HTTP APIs, email, payment. Tests must not need an API key or network access.
- For AI-agent features, assert on the **shape and handling** of the response (status code, structure, error mapping, empty-response handling), never on exact generated text.
- Replace the dependency at the DI boundary (.NET: replace the service registration; NestJS: `overrideProvider` or provide a fake for the injection token).

### 3. Execute the Tests

Run the appropriate tests based on the selected strategy, using the commands in the table above.

Infrastructure prerequisites:
1. Identify what the tests need before running them. Default unit and API tests should need no database (see the mocking rules above). Real-database integration tests need environment variables and migrations; check `docker-compose*`, `.env`, `README`, and migration scripts.
2. Start required services (for example Postgres) and apply migrations only for tests that need them. If that infrastructure is unavailable, run the fake-based tests and explicitly report the real-database tests as not executed.
3. Never commit secrets. Do not print API keys or passwords in reports.

For API changes:
1. Start the application with the development configuration.
2. Exercise the affected endpoints with integration tests or `curl`.
3. Verify HTTP status codes, response bodies, headers, validation behavior, and error responses.
4. Test authentication and authorization when relevant.
5. Test relevant boundary conditions and invalid requests.

For E2E changes:
1. Start the required application services.
2. Exercise the actual user workflow.
3. Verify the resulting UI behavior and backend state.
4. Check relevant failure scenarios.

Do not claim a test passed if it was not actually executed.

### 4. Verification Requirements

After executing tests:

1. Confirm that the application builds successfully (and typechecks / lints cleanly for Node).
2. Confirm that all relevant tests pass.
3. Investigate and resolve failures caused by the implementation.
4. Re-run affected tests after making fixes.
5. Check for unexpected regressions.
6. Report all build errors, warnings, test failures, and skipped tests.
7. Stop any application processes or services started specifically for verification.

If a test cannot be executed because of missing infrastructure, unavailable dependencies, or environment limitations, explain the reason. Never report an unexecuted test as passed.

### 5. Independent Verification Using a Task Sub-Agent

For features, API changes, and behavior changes, delegate independent verification to a `task` sub-agent.

The sub-agent MUST:

1. Read the relevant specification (or the stated acceptance criteria) and `docs/DEVELOPMENT_RULES.md`.
2. Independently inspect the implementation and existing tests.
3. Review whether the selected testing strategy adequately covers the requirements.
4. Run the build (and typecheck/lint for Node) and report all errors and warnings.
5. Execute the relevant unit, integration, API, and/or E2E tests.
6. Start the application and exercise affected endpoints with `curl` when applicable and when its dependencies are available (otherwise state why not).
7. Compare actual behavior against the acceptance criteria.
8. Stop the application and any services started for verification.
9. Report pass/fail for each acceptance criterion, including full output for failures.

The sub-agent must not simply trust the implementation agent's claims or test results. It must independently verify the behavior.

If verification identifies problems:
- Fix the underlying implementation or test issues.
- Re-run the relevant tests.
- Delegate verification again.
- Repeat until all acceptance criteria pass or a genuine blocker is identified.

### 6. Final Testing Report

Include a testing summary when completing a feature, API change, or behavior change (a one-line summary is enough for small changes):

- **Build (and typecheck/lint for Node):** Pass / Fail
- **Unit Tests:** Pass / Fail / Not Applicable
- **API Tests:** Pass / Fail / Not Applicable
- **E2E Tests:** Pass / Fail / Not Applicable
- **Sub-Agent Verification:** Pass / Fail / Not Required

For each category, briefly explain what was tested and provide the actual execution results. Only mark a category as passed when the relevant tests were successfully executed.

The work is considered complete only when the applicable tests pass and the acceptance criteria have been verified.
