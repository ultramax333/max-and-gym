# ADR 0006 — Prompted Progressive Web App updates

- Status: Accepted
- Date: 2026-08-05

## Decision

Use a waiting/update prompt. Never auto-reload during an active workout or critical database operation.

## Consequence

Updates require one user action but avoid data loss and mid-session interruption. Build identity and cache diagnostics are required.
