# Explicit merge approval policy

## Request

The project owner may authorize Codex to merge a pull request, provided Codex asks immediately before the merge.

## Policy

- Codex still stops after opening and reporting a pull request.
- Required checks must pass before Codex asks for merge approval.
- The request identifies the pull request and head commit.
- Only a fresh explicit reply to that request authorizes the merge.
- Standing permission and an earlier generic `Go` are not merge approvals.
- A changed head or failed required check invalidates the approval and requires a new request.
- No unrelated task starts automatically after a merge.

## Files aligned

- `PROJECT_CONTRACT.json`
- `AGENTS.md`
- `EXECUTION_CORE.md`
- `CODEX_MASTER_PROMPT.md`
- `README_FIRST.md`
- `CODEX_TASKS/08_OFFLINE_HARDENING_RELEASE.md`
- `docs/spec/CHECKPOINTS.md`
- `docs/spec/RELEASE_PROCESS.md`

## Verification

- Contract JSON parses successfully.
- Every permanent process document expresses the same approval boundary.
- No application code, database schema, export format, cache, runtime behavior or release identity changes.

## Rollback

Restore `noAutoMerge` to `true`, remove `mergePolicy`, and restore the unconditional no-merge language in the aligned process documents.
