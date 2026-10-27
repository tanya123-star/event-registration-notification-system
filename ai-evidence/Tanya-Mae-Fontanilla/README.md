# AI Evidence — Tanya Mae A. Fontanilla

**Student:** Tanya Mae A. Fontanilla
**Team:** four4Bytes
**Course:** IT 305 — Midterm and Final Performance Task
**Project:** Event Registration and Notification System
**Prepared:** 27 October 2026

This folder holds this student's AI evidence: the midterm declaration captures and the Final Week 7 session captures,
records, and index. The AI-influenced work is cross-referenced from
[`../../documentation/AI-DECLARATION-FONTANILLA.md`](../../documentation/AI-DECLARATION-FONTANILLA.md).

## 1. Midterm captures (declaration Section B, rows 1-10)

| Capture                       | Declaration row | Captured   |
| ----------------------------- | --------------- | ---------- |
| `07-ai-f1-student-events.png` | 1               | 2026-10-24 |
| `07-ai-f2-notifications.png`  | 2               | 2026-10-24 |
| `07-ai-f3-design-tokens.png`  | 3               | 2026-10-24 |
| `07-ai-f4-ci.png`             | 4               | 2026-10-24 |
| `07-ai-f5-docs.png`           | 5               | 2026-10-24 |
| `07-ai-f6-events-plan.png`    | 6               | 2026-10-24 |
| `07-ai-f7-docs-commit.png`    | 7               | 2026-10-24 |
| `07-ai-f8-spec-tickets.png`   | 8               | 2026-10-24 |
| `07-ai-f9-roles.png`          | 9               | 2026-10-24 |
| `07-ai-f10-dev-signin.png`    | 10              | 2026-10-24 |

## 2. Final Week 7 work covered

The Final Week 7 sessions produced the officer attendance workflow and replaced the student mock store with
database-backed registrations:

- Officer dashboard with real per-event statistics.
- `/attendance/scanner` — real camera QR decoding plus manual reference verification.
- `/attendance/records` — persisted check-ins with search, filters, and cursor pagination.
- Additive attendance migration (`Attendance.method`, `Attendance.recordedById`).
- Student registration, cancellation, and ticket pages now read and write PostgreSQL through Server Actions.
- Nine per-session evidence captures, the written session record, and the session index.

The implementation is in `feat/admin-phase-1`, tagged `final-wk7` (`54bcb76`), and proposed in PR #10.

## 3. Final Week 7 session captures (declaration Section B, rows 11-19)

| Capture                       | Session                          | Session title                                          | Created (PHT) |
| ----------------------------- | -------------------------------- | ------------------------------------------------------ | ------------- |
| `08-final-wk7-session-01.png` | `ses_e8e918af3ffeR1P2mGlrYpPrkp` | President dashboard, club events, event creation       | 25 Oct, 13:00 |
| `08-final-wk7-session-02.png` | `ses_e8e89b269ffe0WeobwjdRwcyBB` | KASAMA event system redesign                           | 25 Oct, 13:09 |
| `08-final-wk7-session-03.png` | `ses_e8def954fffe1ddXmFws0Wv4PR` | KASAMA event system redesign (fork #1)                 | 25 Oct, 15:57 |
| `08-final-wk7-session-04.png` | `ses_e88ebe591ffeor5iP564rGfjF2` | Figma MCP ENOTFOUND failure                            | 26 Oct, 15:19 |
| `08-final-wk7-session-05.png` | `ses_e88a0a492ffeAReWHrRElcDtUS` | Event Registration System Fact Sheet                   | 26 Oct, 16:41 |
| `08-final-wk7-session-06.png` | `ses_e889fb311ffe3qo526DWnkwB6C` | Event approvals and task management                    | 26 Oct, 16:42 |
| `08-final-wk7-session-07.png` | `ses_e8861907cffez9vocmJDbMYCiX` | Event creation and admin approval flow                 | 26 Oct, 17:50 |
| `08-final-wk7-session-08.png` | `ses_e883954f0ffebkxutKDiK0nsrW` | Final Week 7 - Officer attendance and DB registrations | 26 Oct, 18:34 |
| `08-final-wk7-session-09.png` | `ses_e87f93c6dffeBSsWqYSo9a7ek3` | Students pages PR to fourbytes                         | 26 Oct, 19:44 |

Each PNG is a per-session capture in the midterm `07-ai-*` format: session id, date range, model, and the key exchanges.
The index with notes is [`final-wk7-sessions.md`](./final-wk7-sessions.md).

## 4. Written record and declaration

- [`final-wk7-session-record.md`](./final-wk7-session-record.md) — requests, outputs, files, verification, decisions, and
  limitations for the main Week 7 session.
- [`../../documentation/AI-DECLARATION-FONTANILLA.md`](../../documentation/AI-DECLARATION-FONTANILLA.md) — Section B rows
  11-19 record the nine sessions above; Section C rows 11-19 link the captures.
- [`../../documentation/AI-USAGE-LOG.md`](../../documentation/AI-USAGE-LOG.md) — the project-wide usage log and evidence
  index.

## 5. Verification

- `pnpm test` — 435 unit tests pass; integration tests are excluded from the unit project.
- `pnpm test:integration` — 7 tests pass against PostgreSQL, including concurrent duplicate check-in and registration
  persistence.
- `pnpm lint`, `tsc --noEmit`, and `pnpm build` pass.
- CI (`Lint, test, and build`) and CodeQL (actions, javascript-typescript) are green on PR #10.

## 6. Notes

- The duplicate fork session `ses_e8def7dccffe7qn0BSxRINHR45` has the same content as capture 03 and is not captured
  separately.
- Captures 01 and 04 have no retained assistant text in the exported session; they show the request and record that no
  text reply was saved.
- The pasted authentication debug log from the working session was excluded from the capture.
- Camera decoding requires a physical camera and browser permission; it is implemented and reviewed but not part of the
  automated checks.
