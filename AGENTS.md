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
4. Verify the implementation by following `docs/TESTING_WORKFLOW.md`, 
6. If the sub-agent reports problems, fix them and re-run the verification until it passes.
   Then summarize the results against the acceptance criteria.

## Testing Rules

When explicitly asked to test the project or codebase:
1. Read docs/TESTING_WORKFLOW.md.
2. Follow its testing and verification requirements.
3. Report actual results, including failures and tests that could not be executed.

Do not consider implementation work complete until all applicable acceptance criteria have been verified or a genuine blocker has been reported.