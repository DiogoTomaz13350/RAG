# Testing Workflow

This workflow applies to **.NET** and **Node.js / NestJS (TypeScript)** projects.

Detect the stack from the repository:
- `*.sln` or `*.csproj` → .NET
- `package.json` → Node.js
- Both → Apply both workflows.

Always inspect the repository's existing scripts, test projects, and conventions before choosing commands.

## 1. Choose the Appropriate Tests

Before testing:

1. Inspect the existing test infrastructure and conventions.
2. Identify which parts of the application are affected.
3. Select the tests that provide meaningful coverage.

Use the appropriate testing levels:

- **Unit tests:** Business logic, individual classes, functions, validation, and edge cases.
- **API tests:** Endpoints, HTTP responses, validation, authentication, and error handling.
- **E2E tests:** Complete user workflows across application layers.

Avoid introducing new testing frameworks when existing ones are sufficient.

## 2. Write and Maintain Tests

- Add tests for new functionality.
- Update existing tests when requirements or behavior change.
- Cover normal scenarios, edge cases, invalid inputs, and relevant failures.
- Test expected behavior rather than implementation details.
- Keep tests isolated, deterministic, and repeatable.
- Never delete, skip, or weaken tests just to make them pass.
- Investigate whether the implementation or test expectation is incorrect before changing either.

### Mocking and external dependencies

- Fake database/repository dependencies by default in unit and API tests. No database connection should be necessary.
- Always fake external services such as AI providers, embedding APIs, email, payment, and third-party HTTP APIs. Tests must not require API keys or network access.
- Prefer the real HTTP pipeline when practical.
- For AI features, test response structure, status codes, and error handling rather than exact generated text.


## 3. Build and Test

Check the repository's existing scripts and project configuration first. Prefer existing commands over defaults.

| Purpose | .NET | Node.js / NestJS |
|---|---|---|
| Build | `dotnet build` | `npm run build` |
| Typecheck | Included in build | `npx tsc --noEmit -p .` |
| Lint | Build analyzers | `npx eslint <changed paths>` |
| Unit tests | `dotnet test <project>` | `npm test` |
| Full test suite | `dotnet test` | `npm test` and `npm run test:e2e` |

For API and E2E changes:
- Start the application when required.
- Exercise affected endpoints or user workflows.
- Verify responses, validation, authorization, and relevant failure scenarios.
- Stop application processes and services started for testing.

Before starting infrastructure, inspect the README, environment configuration, Docker Compose files, and migration scripts.

Never expose secrets or commit credentials.

## 4. Independent Verification

For features, API changes, and behavior changes, delegate independent verification to a `task` sub-agent.

The sub-agent must independently:

1. Read the relevant specification or acceptance criteria and `docs/DEVELOPMENT_RULES.md`.
2. Inspect the implementation and existing tests.
3. Build the application and run the relevant tests.
4. Check typechecking and linting for Node.js projects.
5. Exercise affected endpoints with `curl` when applicable.
6. Compare actual behavior against the acceptance criteria.
7. Report failures, warnings, and tests that could not be executed.

## 5. Final Testing Report

When completing a feature, API change, or behavior change, provide a concise testing summary:

| Check | Result |
|---|---|
| Build | Pass / Fail / Not Run |
| Typecheck / Lint | Pass / Fail / Not Applicable |
| Unit tests | Pass / Fail / Not Applicable |
| API tests | Pass / Fail / Not Applicable |
| E2E tests | Pass / Fail / Not Applicable |
| Sub-agent verification | Pass / Fail / Not Required |

Briefly explain what was executed and include relevant failure details.

**Never report tests as passed unless they were actually executed successfully.**

If infrastructure or environment limitations prevent testing, clearly state what could not be verified.

The work is complete when all applicable acceptance criteria have been verified or a genuine blocker has been reported.