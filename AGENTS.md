# Project AI Instructions

## General Rules
- Read relevant existing code before proposing or making changes.
- Follow the existing architecture and coding conventions.
- Keep changes focused on the requested task.

## Specification Workflow
When brainstorming or documenting/specing a feature:
1. Read `docs/SPEC_TEMPLATE.md`.
2. Clarify important requirements and unresolved questions.
3. Generate or update the relevant file in `docs/specs/`.
4. Do not modify application code unless explicitly requested.

## Implementation Workflow
When implementing a feature:
1. Read the relevant approved specification in `docs/specs/`.
2. Read `docs/DEVELOPMENT_RULES.md`.
3. Inspect the existing codebase.
4. Implement the requirements without unrelated changes.
5. Verify the implementation by delegating to a `task` sub-agent (do not skip):
   - Run `dotnet build` and report any errors or warnings.
   - Start the app, exercise the new feature (e.g., call the new endpoint with `curl`),
     and compare the actual responses (status codes, body) with the spec's acceptance criteria.
   - Stop the app afterwards and report pass/fail per criterion, with full output for any failure.
6. If the sub-agent reports problems, fix them and re-run the verification until it passes.
   Then summarize the results against the spec's acceptance criteria.
