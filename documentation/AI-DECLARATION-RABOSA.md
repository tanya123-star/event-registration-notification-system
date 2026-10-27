# AI Declaration Form

**IT 305 Midterm: Integration Checkpoint**

> Every row in Section B names commits that contain the AI-influenced work. Sections C-F are this student's own evidence
> and own words.

## Section A. Student and team details

| Field         | Entry                                                                          |
| ------------- | ------------------------------------------------------------------------------ |
| Student name  | John Rey Rabosa                                                                |
| Team name     | four4Bytes                                                                     |
| Project title | Event Registration and Notification System                                     |
| AI use level  | **Generated** - AI produced code and documentation that was used               |
| Git identity  | `John Rey Rabosa` and `r4ppz` are the same person: `johnreyrabosa.f@gmail.com` |

All commits below are on `main`.

## Section B. AI usage log

| #   | Tool and version                   | Date       | Component or file affected                                                      | Purpose                  | Prompt summary                                                                                    | What AI produced                                                       | Decision              | Commit hash          |
| --- | ---------------------------------- | ---------- | ------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------- | -------------------- |
| 1   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-18 | `src/lib/security/rbac.ts`, `documentation/RBAC.md`                             | Code implementation      | Centralise role permissions into one matrix and enforce it in every server action                 | Central RBAC matrix, `requirePermission`, guard wiring                 | Modified              | `928857c`            |
| 2   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-19 | `src/features/*/actions.ts`, `schemas.ts`, `mutations.ts`, `queries.ts`         | Refactor                 | Rename the data layer to the repo conventions, take typed payloads, add TSDoc to exported actions | Renamed functions, `*Payload` types, TSDoc blocks                      | Accepted              | `c974629`, `e398d1c` |
| 3   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-20 | `src/lib/security/email-domain.test.ts`, `src/features/users/schemas.test.ts`   | Testing and verification | Add tests for the email domain allow-list and the user schemas                                    | The two test files                                                     | Accepted              | `8113fb2`            |
| 4   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-21 | sign-in flow, `src/lib/security/email-domain.ts`                                | Troubleshooting          | `@acd.edu.ph` sign-in is rejected; show the rejection inline instead of a generic error           | Domain allow-list fix and inline rejection message on the sign-in form | Modified              | `f1dfe0f`, `8b2f09c` |
| 5   | OpenCode, DeepSeek V4.1 Flash Free | 2026-10-24 | `documentation/MIDTERM-SUBMISSION.md`, `documentation/AI-DECLARATION-RABOSA.md` | Documentation assistance | Draft the midterm submission and this declaration from repo evidence                              | The submission document and this form, drafted by a teammate           | Accepted after review | N/A - uncommitted    |

Row 5 discloses AI-written documentation inside this submission, drafted by Tanya Mae A. Fontanilla with OpenCode and
reviewed by me. Rows 1-4 are reconstruction from commit subjects; no session transcript was kept, so the prompt wording
summarises what the commit contains rather than quoting it.

## Section C. Proof attachments

| Log row | Attachment                          | Status     |
| ------- | ----------------------------------- | ---------- |
| 1       | `ai-evidence/07-ai-r1-rbac.png`     | TO CAPTURE |
| 2       | `ai-evidence/07-ai-r2-refactor.png` | TO CAPTURE |
| 3       | `ai-evidence/07-ai-r3-tests.png`    | TO CAPTURE |
| 4       | `ai-evidence/07-ai-r4-signin.png`   | TO CAPTURE |
| 5       | `ai-evidence/07-ai-r5-docs.png`     | TO CAPTURE |

Each file must be a screenshot of this student's own OpenCode session with the date visible. A teammate's session is not
evidence for these rows. A link that expires counts as no evidence.

## Section D. Verification statement

I verified the AI-assisted parts by reviewing each diff and running the project gates:

- `pnpm validate` (Prettier, ESLint, `tsc --noEmit`) passes.
- `pnpm test` passes, including `src/lib/security/email-domain.test.ts` and `src/features/users/schemas.test.ts`.
- `pnpm build` completes.
- I read `src/lib/security/rbac.ts` against `documentation/RBAC.md` and confirmed the matrix matches.
- I signed in with an `@acd.edu.ph` account and was admitted; an unapproved external address was rejected with the message
  shown inline on the form, not as a generic error page.

Delete any line above that did not pass when you ran it.

## Section E. Understanding statement

Written by the student, not generated. Answer these three in your own words:

1. Every server action starts with `requirePermission(...)` from `src/lib/security/rbac.ts`, so the browser never decides
   what is allowed.
2. Removing that one guard is enough to let a signed-in student call the same action and change a role; hiding the button
   does not stop a crafted request.
3. The email allow-list lives in `src/lib/security/email-domain.ts` and is checked server-side during sign-in, which is why
   a client that skips the UI still cannot get in with a foreign address.

## Section F. Honesty statement and signature

I declare that the information provided in this form is complete and accurate to the best of my knowledge. All AI tools
used in preparing or implementing this submission are disclosed, and the supporting evidence corresponds to the listed
activities.

Signature: ______________________________ Date: ______________________
