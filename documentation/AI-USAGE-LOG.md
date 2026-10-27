# AI Usage Log and Evidence Index

**IT 305 Midterm: Integration Checkpoint — Tanya Mae A. Fontanilla (four4Bytes)**

Every row below names commits that contain the AI-influenced work, so the log can be cross-checked with `git log`. The
Section C images live in `ai-evidence/`.

Dates are the real commit dates, not the dates the work was requested. Rows 1-3 were built on 23 Oct 2026 and the
commits are stamped accordingly.

## Section B. AI usage log

| #   | Tool and version                   | Date       | Component or file affected                                                                                                                                                                                                      | Purpose                         | Prompt summary                                                                                                                                                                        | What AI produced                                                                               | Decision                                          | Commit hash                                                                                                  |
| --- | ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/features/events/**`, `src/app/(app)/events/**`, `src/app/(app)/registrations/**`, `src/app/(app)/attendance/**`                                                                                                            | Code implementation             | Build the student-facing events prototype on the in-memory store: list, detail, registration, ticket, attendance history                                                              | Event mock store, event list, detail page, registration flow, ticket page, attendance history  | Accepted, then edited                             | `687c3ab`, `0ceb1f2`, `58f6869`, `191b20e`, `5080bce`, `a7ef334`                                             |
| 2   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/features/notifications/**`                                                                                                                                                                                                 | Code implementation             | Add a split view to the notification feed and a mark-all-read action                                                                                                                  | Split list/detail view and the mark-all-read path                                              | Accepted, then edited                             | `dcadcd2`                                                                                                    |
| 3   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/styles/variables.css`, shared controls, `src/app/sign-in/**`                                                                                                                                                               | Design implementation           | Refresh shared controls to the navy/sky tokens and keep every text-on-fill pair at WCAG AA                                                                                            | Token changes and restyled controls, sign-in page, primary action                              | Modified                                          | `1314fec`, `d22f6fb`, `9f9dc06`                                                                              |
| 4   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-24 | `.github/workflows/**`                                                                                                                                                                                                          | CI setup                        | Add CI that runs lint, tests, and build                                                                                                                                               | The workflow file                                                                              | Accepted                                          | `d8ff2aa`                                                                                                    |
| 5   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-24 | `documentation/AI-DECLARATION-FONTANILLA.md`, `documentation/AI-DECLARATION-RABOSA.md`, `documentation/MIDTERM-SUBMISSION.md`, `ai-evidence/README.md`                                                                          | Documentation assistance        | Read the repo and the midterm form, then draft the submission document and the per-student AI declarations                                                                            | This form, the submission document, and the evidence checklist                                 | Modified                                          | N/A - uncommitted                                                                                            |
| 6   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-18 | `prisma/seed.ts`, `docs/`, `GLOSSARY.md`                                                                                                                                                                                        | Code implementation             | Implement ticket 04's event lifecycle: seed one event per lifecycle state and reconcile the seven states in the spec, glossary and ticket docs                                        | Seed data for every lifecycle state and the ticket 04 doc reconciliation                       | Accepted                                          | `0b722a5`, `73bef94`                                                                                         |
| 7   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-21 | `documentation/AUTH-AND-ACCESS.md`, `documentation/OVERVIEW.md`, `documentation/SETUP.md`, `eslint.config.mjs`                                                                                                                  | Documentation assistance        | After merging `origin/main`, split the pending work and move the documentation and ESLint changes into their own commit                                                               | The three documentation updates and the agent-tooling ignores in ESLint                        | Accepted                                          | `2c2ac52`                                                                                                    |
| 8   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-15 | `GLOSSARY.md`, `docs/MVP-SPEC.md`, `docs/adr/`, `docs/tickets/`, `vitest.config.mts`, `src/features/notifications/queries.integration.test.ts`                                                                                  | Documentation and testing setup | Turn the design-grill decisions into the glossary and ADRs, write the MVP spec (ADR-0006) and the ticket list, then add the integration test project and an example notification test | Glossary, six ADRs, MVP spec, 16 tickets, integration test project                             | Accepted                                          | `044ce6e`, `b2305d8`, `39f12bf`, `c48b5ef`                                                                   |
| 9   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-16 | `prisma/schema.prisma`, `src/lib/security/rbac.ts`                                                                                                                                                                              | Code implementation             | Add the ATTENDANCE_STAFF and APPROVER roles with the markAttendance permission                                                                                                        | The two role enum values and the permission mapping                                            | Accepted, then dropped ATTENDANCE_STAFF on 17 Oct | `25078a9`                                                                                                    |
| 10  | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-17 | `docs/adr/0007-simplified-roles-and-approval.md`, `docs/adr/0008-development-only-sign-in.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/security/rbac.ts`, `src/app/dev-sign-in/route.ts`, `src/app/sign-in/page.tsx` | Refactor                        | Simplify the role model and approval chain (ADR-0007), add the development-only sign-in gate and demo seed (ADR-0008), then fix the auth and seed findings from review                | ADR-0007 and 0008, role and guard changes, the dev sign-in route and its tests, the seed guard | Accepted                                          | `7103f24`, `7dea4ca`, `59413b2`, `8ee5891`, `e498d69`, `816f47b`, `f41e5b9`, `fc465c8`, `c9a8a1d`, `ec9d442` |

Rows 1-4 and 6-10 are reconstruction from commit diffs and the saved sessions; the prompt wording summarises each request
rather than quoting it verbatim.

Branch note: rows 1-5 are on `fork/style/quiet-refresh` only and are not merged into `origin/main`; row 7 is already on
`main`; rows 6 and 8-10 are on the fork's `main`, before the 18 Oct history reset.

## Section C. Proof attachments

| Log row | Attachment                                                     | Status              |
| ------- | -------------------------------------------------------------- | ------------------- |
| 1       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f1-student-events.png` | Captured 2026-10-24 |
| 2       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f2-notifications.png`  | Captured 2026-10-24 |
| 3       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f3-design-tokens.png`  | Captured 2026-10-24 |
| 4       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f4-ci.png`             | Captured 2026-10-24 |
| 5       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f5-docs.png`           | Captured 2026-10-24 |
| 6       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f6-events-plan.png`    | Captured 2026-10-24 |
| 7       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f7-docs-commit.png`    | Captured 2026-10-24 |
| 8       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f8-spec-tickets.png`   | Captured 2026-10-24 |
| 9       | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f9-roles.png`          | Captured 2026-10-24 |
| 10      | `ai-evidence/Tanya-Mae-Fontanilla/07-ai-f10-dev-signin.png`    | Captured 2026-10-24 |

Rows 1-4 are captured from `ses_e9b6ca8aaffe0B9ZTQl3LsdYmR` ("Create PR for committed changes") and row 5 from
`ses_e967084d2ffew37WnyVcu3mE1Y` ("Filling AI declaration form for ERNS"). Row 6 comes from
`ses_eb10835d6ffeA8hXWmm67dfali` and row 7 from `ses_ea2c29f55ffeIa5MoOBFB4FeUh`; rows 8-10 all come from
`ses_eb6dfacf3ffeyIpCCwR0LaxUmj`, which ran from 13 to 17 Oct. Each image carries a caption band with the session id,
the log row, and the exact local timestamp of the message shown, because the transcript prints clock times without a
date.

Row 9's commit `25078a9` landed on 16 Oct, but the session message that names it is the 17 Oct follow-up ("The enum
value already exists in committed code (25078a9)"), so that message is what the capture shows.

## Final Week 7. Officer attendance session record

The Week 7 officer attendance and database-backed registration work was produced in session
`ses_e883954f0ffebkxutKDiK0nsrW` (OpenCode, DeepSeek V4.1 Flash) on 26-27 October 2026. The full record - requests,
outputs, files, verification, decisions, and limitations - is in
[`ai-evidence/Tanya-Mae-Fontanilla/final-wk7-session-record.md`](../ai-evidence/Tanya-Mae-Fontanilla/final-wk7-session-record.md).

| Area                                                                       | Commit                                      | Evidence                                               |
| -------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------ |
| Officer dashboard, QR scanner, manual entry, records, attendance migration | `54bcb76` (tag `final-wk7`)                 | `src/features/events/attendance.integration.test.ts`   |
| Database-backed student registration and cancellation                      | `54bcb76` (tag `final-wk7`)                 | `src/features/events/registration.integration.test.ts` |
| Verification                                                               | 435 unit, 7 integration, lint, types, build | Refer to the session record                            |

Rows 11-19 of [`AI-DECLARATION-FONTANILLA.md`](./AI-DECLARATION-FONTANILLA.md) Section B record these sessions; the
captures are indexed in [`ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md`](../ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md).

The session reused the existing `KASAMA-...` registration reference as the QR payload and kept every authorization
decision in the existing guards. No new evidence screenshots were captured for this session; the record, the tagged
commit, and the tests above are the evidence trail.

Capture: one PNG per OpenCode session created during the week - `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-01.png` through
`-09.png`, indexed in [`ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md`](../ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md).
