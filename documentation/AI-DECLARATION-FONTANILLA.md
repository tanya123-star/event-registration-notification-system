# AI Declaration Form

**IT 305 Midterm and Final Performance Task: Integration Showcase**

> Every row in Section B names commits that contain the AI-influenced work, so the log can be cross-checked against the
> repository. Sections C-F are this student's own evidence and own words.

## Section A. Student and team details

| Field         | Entry                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Student name  | Tanya Mae A. Fontanilla                                               |
| Team name     | four4Bytes                                                            |
| Project title | Event Registration and Notification System                            |
| AI use level  | **Generated** - AI produced code and documentation that was used      |
| Git identity  | `Tanya Mae <fontanillatanya1@gmail.com>` (GitHub `tanya123-star`)     |
| Branch        | `feat/admin-phase-1` on `origin`; tag `final-wk7` = `54bcb76`; PR #10 |

Rows 1-10 record the midterm checkpoint and remain on `fork/style/quiet-refresh`. Rows 11-19 record the Final Week 7
sessions of 25-27 October 2026 on `feat/admin-phase-1`; the implementation is tagged `final-wk7` (`54bcb76`) and
proposed in PR #10. Each row's capture is in `ai-evidence/Tanya-Mae-Fontanilla/07-ai-*` (rows 1-10) or `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-*`
(rows 11-19).

## Section B. AI usage log

| #   | Tool and version                   | Date       | Component or file affected                                                                                                                                                                                                      | Purpose                          | Prompt summary                                                                                                                                                                        | What AI produced                                                                                                        | Decision                                          | Commit hash                                                                                                  |
| --- | ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/features/events/**`, `src/app/(app)/events/**`, `src/app/(app)/registrations/**`, `src/app/(app)/attendance/**`                                                                                                            | Code implementation              | Build the student-facing events prototype on the in-memory store: list, detail, registration, ticket, attendance history                                                              | Event mock store, event list, detail page, registration flow, ticket page, attendance history                           | Accepted, then edited                             | `687c3ab`, `0ceb1f2`, `58f6869`, `191b20e`, `5080bce`, `a7ef334`                                             |
| 2   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/features/notifications/**`                                                                                                                                                                                                 | Code implementation              | Add a split view to the notification feed and a mark-all-read action                                                                                                                  | Split list/detail view and the mark-all-read path                                                                       | Accepted, then edited                             | `dcadcd2`                                                                                                    |
| 3   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-23 | `src/styles/variables.css`, shared controls, `src/app/sign-in/**`                                                                                                                                                               | Design implementation            | Refresh shared controls to the navy/sky tokens and keep every text-on-fill pair at WCAG AA                                                                                            | Token changes and restyled controls, sign-in page, primary action                                                       | Modified                                          | `1314fec`, `d22f6fb`, `9f9dc06`                                                                              |
| 4   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-24 | `.github/workflows/**`                                                                                                                                                                                                          | CI setup                         | Add CI that runs lint, tests, and build                                                                                                                                               | The workflow file                                                                                                       | Accepted                                          | `d8ff2aa`                                                                                                    |
| 5   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-24 | `documentation/AI-DECLARATION-FONTANILLA.md`, `documentation/AI-DECLARATION-RABOSA.md`, `documentation/MIDTERM-SUBMISSION.md`, `ai-evidence/README.md`                                                                          | Documentation assistance         | Read the repo and the midterm form, then draft the submission document and the per-student AI declarations                                                                            | This form, the submission document, and the evidence checklist                                                          | Modified                                          | N/A - uncommitted                                                                                            |
| 6   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-18 | `prisma/seed.ts`, `docs/`, `GLOSSARY.md`                                                                                                                                                                                        | Code implementation              | Implement ticket 04's event lifecycle: seed one event per lifecycle state and reconcile the seven states in the spec, glossary and ticket docs                                        | Seed data for every lifecycle state and the ticket 04 doc reconciliation                                                | Accepted                                          | `0b722a5`, `73bef94`                                                                                         |
| 7   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-21 | `documentation/AUTH-AND-ACCESS.md`, `documentation/OVERVIEW.md`, `documentation/SETUP.md`, `eslint.config.mjs`                                                                                                                  | Documentation assistance         | After merging `origin/main`, split the pending work and move the documentation and ESLint changes into their own commit                                                               | The three documentation updates and the agent-tooling ignores in ESLint                                                 | Accepted                                          | `2c2ac52`                                                                                                    |
| 8   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-15 | `GLOSSARY.md`, `docs/MVP-SPEC.md`, `docs/adr/`, `docs/tickets/`, `vitest.config.mts`, `src/features/notifications/queries.integration.test.ts`                                                                                  | Documentation and testing setup  | Turn the design-grill decisions into the glossary and ADRs, write the MVP spec (ADR-0006) and the ticket list, then add the integration test project and an example notification test | Glossary, six ADRs, MVP spec, 16 tickets, integration test project                                                      | Accepted                                          | `044ce6e`, `b2305d8`, `39f12bf`, `c48b5ef`                                                                   |
| 9   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-16 | `prisma/schema.prisma`, `src/lib/security/rbac.ts`                                                                                                                                                                              | Code implementation              | Add the ATTENDANCE_STAFF and APPROVER roles with the markAttendance permission                                                                                                        | The two role enum values and the permission mapping                                                                     | Accepted, then dropped ATTENDANCE_STAFF on 17 Oct | `25078a9`                                                                                                    |
| 10  | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-17 | `docs/adr/0007-simplified-roles-and-approval.md`, `docs/adr/0008-development-only-sign-in.md`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/security/rbac.ts`, `src/app/dev-sign-in/route.ts`, `src/app/sign-in/page.tsx` | Refactor                         | Simplify the role model and approval chain (ADR-0007), add the development-only sign-in gate and demo seed (ADR-0008), then fix the auth and seed findings from review                | ADR-0007 and 0008, role and guard changes, the dev sign-in route and its tests, the seed guard                          | Accepted                                          | `7103f24`, `7dea4ca`, `59413b2`, `8ee5891`, `e498d69`, `816f47b`, `f41e5b9`, `fc465c8`, `c9a8a1d`, `ec9d442` |
| 11  | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-25 | President dashboard and event screens                                                                                                                                                                                           | UI exploration                   | Match the President dashboard, club events, and event creation screens to reference images                                                                                            | Screenshot-driven layout exploration; no retained reply                                                                 | Discarded                                         | N/A - no committed change                                                                                    |
| 12  | OpenCode, Beam Free                | 2026-10-25 | `prisma/schema.prisma`, `src/features/**`, `src/lib/security/**`, `docs/superpowers/specs/**`                                                                                                                                   | Architecture and implementation  | Rework the club-based model into a single KASAMA model, then implement the approved phases                                                                                            | KASAMA model design, de-clubbed schema and UI, phased implementation                                                    | Accepted                                          | `525c5b3`, `a108e7f`                                                                                         |
| 13  | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-25 | design docs                                                                                                                                                                                                                     | Design review                    | Fork of the redesign session: review the design before implementation                                                                                                                 | Read-only design review; no code change                                                                                 | Not used                                          | N/A - no committed change                                                                                    |
| 14  | OpenCode, Beam Free                | 2026-10-26 | OpenCode MCP configuration                                                                                                                                                                                                      | Troubleshooting                  | Investigate the Figma MCP `ENOTFOUND` failure                                                                                                                                         | Diagnosis only; the MCP was not fixed                                                                                   | Not used                                          | N/A - no committed change                                                                                    |
| 15  | OpenCode, MiMo v2.6 Pro            | 2026-10-26 | `documentation/**`                                                                                                                                                                                                              | Documentation assistance         | Draft the final performance task fact sheet and evidence index                                                                                                                        | Draft fact sheet and log analysis; the draft was not retained on this branch                                            | Modified                                          | N/A - draft only                                                                                             |
| 16  | OpenCode, GPT-5.6 Luna             | 2026-10-26 | `src/features/events/**`, `src/app/(app)/admin/**`                                                                                                                                                                              | Code implementation              | Change request: event creation, approval flow, task management, and form validation                                                                                                   | Admin approval and task UI, validation changes                                                                          | Accepted, then edited                             | `1d31643`                                                                                                    |
| 17  | OpenCode, MiMo v2.5                | 2026-10-26 | admin event UI                                                                                                                                                                                                                  | Code implementation              | Match event creation to reference screenshots and simplify the task/activity tabs                                                                                                     | Event form and UI exploration, mostly reverted on request                                                               | Mostly reverted                                   | `1d31643` (retained)                                                                                         |
| 18  | OpenCode, DeepSeek V4.1 Flash      | 2026-10-26 | `prisma/schema.prisma`, `src/features/events/**`, `src/app/(app)/attendance/**`, `src/app/(app)/dashboard/**`, `ai-evidence/**`                                                                                                 | Code implementation and evidence | Implement officer attendance (QR, manual entry, records), make every student registration persist, tag `final-wk7`, and record the evidence                                           | Attendance migration, officer dashboard/scanner/records, database-backed registrations, tests, session captures, PR #10 | Accepted                                          | `54bcb76` (tag `final-wk7`), `679a70b`, `1028cc6`                                                            |
| 19  | OpenCode, Beam Free                | 2026-10-26 | branch merge and PR #8                                                                                                                                                                                                          | Integration and verification     | PR the students pages and resolve the merge conflicts against `origin/main`                                                                                                           | PR #8, merge-conflict resolution, follow-up fixes                                                                       | Accepted                                          | `e877d2b`, `2112b39`, `900ddd0`, `934baad`                                                                   |

Rows 1-4 and 6-10 are reconstruction from commit diffs and the saved sessions; the prompt wording summarises each request
rather than quoting it verbatim. Rows 11-19 are the Final Week 7 sessions captured on 27 October 2026.

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
| 11      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-01.png` | Captured 2026-10-27 |
| 12      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-02.png` | Captured 2026-10-27 |
| 13      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-03.png` | Captured 2026-10-27 |
| 14      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-04.png` | Captured 2026-10-27 |
| 15      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-05.png` | Captured 2026-10-27 |
| 16      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-06.png` | Captured 2026-10-27 |
| 17      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-07.png` | Captured 2026-10-27 |
| 18      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-08.png` | Captured 2026-10-27 |
| 19      | `ai-evidence/Tanya-Mae-Fontanilla/08-final-wk7-session-09.png` | Captured 2026-10-27 |

Rows 1-4 are captured from `ses_e9b6ca8aaffe0B9ZTQl3LsdYmR` ("Create PR for committed changes") and row 5 from
`ses_e967084d2ffew37WnyVcu3mE1Y` ("Filling AI declaration form for ERNS"). Row 6 comes from
`ses_eb10835d6ffeA8hXWmm67dfali` and row 7 from `ses_ea2c29f55ffeIa5MoOBFB4FeUh`; rows 8-10 all come from
`ses_eb6dfacf3ffeyIpCCwR0LaxUmj`, which ran from 13 to 17 Oct. Each image carries a caption band with the session id,
the log row, and the exact local timestamp of the message shown, because the transcript prints clock times without a
date.

Row 9's commit `25078a9` landed on 16 Oct, but the session message that names it is the 17 Oct follow-up ("The enum
value already exists in committed code (25078a9)"), so that message is what the capture shows.

Rows 11-19 are captured from the sessions indexed in
[`ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md`](../ai-evidence/Tanya-Mae-Fontanilla/final-wk7-sessions.md); each PNG carries the session id, date range,
model, and the key exchanges. Row 13 is the fork of row 12, and row 15's fact-sheet draft was not retained on this branch.

## Section D. Verification statement

I verified the AI-assisted parts by reviewing the diff of each commit and running the project gates.

### Midterm verification (`style/quiet-refresh`)

- `pnpm validate` (Prettier, ESLint, `tsc --noEmit`) passes on `style/quiet-refresh`.
- `pnpm test` passes, including `src/features/events/event-data.test.ts`, `registrations.test.ts`, `attendance-data.test.ts`, and `format.test.ts`.
- `pnpm build` completes.
- I opened the student events list, one event detail page, the registration flow, the ticket page, and the attendance history in the running app and confirmed the state matches what the mock store describes.
- The contrast rule was checked on the refreshed controls: text on navy and on sky fills is white and passes AA.

Delete any midterm line above that did not pass when you ran it. Do not submit a claim you have not reproduced.

### Final Week 7 verification

- `pnpm test` passes with 435 unit tests; integration tests are excluded from the unit project and run separately.
- `pnpm test:integration` passes with 7 tests against PostgreSQL, including the concurrent duplicate check-in and the
  registration persistence test.
- `pnpm lint`, `tsc --noEmit`, and `pnpm build` pass.
- CI (`Lint, test, and build`) and CodeQL (actions, javascript-typescript) are green on PR #10.
- The session record reported 442 unit tests before the integration tests were excluded from the unit project; the counts
  above are the current split.
- Camera decoding needs a physical camera and browser permission; it was implemented and reviewed but is not part of the
  automated checks.

## Section E. Understanding statement

Written by the student, not generated. Answer these three in your own words:

> **Final Week 7:** rewrite these three answers for the current database-backed flow before submitting. The answers below
> describe the midterm mock-store state, which no longer exists.

1. The events feature is client-side state in `src/features/events/event-data.ts`; nothing is written to PostgreSQL. A
   refresh returns the seeded demo state, so a registration is not durable.
2. The permission checks for admin actions live on the server in `src/lib/security/rbac.ts`; the student pages only hide UI.
3. If a real registration flow were built on the mock store, two tabs registering for the last slot would both succeed,
   because there is no database constraint or transaction behind the counter.

## Section F. Honesty statement and signature

I declare that the information provided in this form is complete and accurate to the best of my knowledge. All AI tools
used in preparing or implementing this submission are disclosed, and the supporting evidence corresponds to the listed
activities.

Signature: ______________________________ Date: ______________________
