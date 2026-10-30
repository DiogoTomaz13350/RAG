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
1. Read the relevant approved specification in `docs/specs/` (if none exists, use the user's request as the acceptance criteria and state them).
2. Read `docs/DEVELOPMENT_RULES.md`.
3. Inspect the existing codebase.
4. Implement the requirements without unrelated changes.
5. Verify the implementation by following `docs/TESTING_WORKFLOW.md`, including delegating independent verification to a `task` sub-agent (do not skip for features and API changes). The workflow defines the build/test commands for both .NET and Node/NestJS projects.
6. If the sub-agent reports problems, fix them and re-run the verification until it passes.
   Then summarize the results against the acceptance criteria.

## Testing Rules

When asked to test the project or code base, or when verifying an implementation:
1. Read `docs/TESTING_WORKFLOW.md`.
2. Determine the appropriate testing strategy based on the changes and the code base.
3. Implement and execute the relevant tests.
4. Delegate independent verification to a `task` sub-agent as described in the testing workflow.
5. Do not consider the work complete until all applicable acceptance criteria have been verified.