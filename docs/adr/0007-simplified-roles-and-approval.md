# Simplified roles and approval

> **Superseded in part.** [ADR-0009](./0009-kasama-single-organization.md) removes the club-scoped parts of this ADR
> (officer contacts become a `Club` field) and replaces the multi-step approval chain with a one-step Admin approval.

Amends ADRs 0001 (access roles and approval authority), 0002 (registration lifecycle), 0003 (attendance walk-in authority), 0004 (email delivery outcomes), 0005 (approval-chain model) and 0006 (deferred decisions). Every security and privacy guard from those ADRs stays in force; only the shapes below change.

## 1. Drop `ATTENDANCE_STAFF` from the model

`markAttendance` = OFFICER or ADMIN. A separate attendance-only login role buys no new authority: officers and administrators already operate events, and the role added an enum value, an assignment path and a dropdown entry for a permission they can hold directly.

The enum value was added by committed code (`25078a9`), but nothing had been pushed and no shared database had ever run that migration, so the addition was **reverted rather than deprecated**: the migration now adds only `APPROVER`, and the role is absent from `schema.prisma`, `AssignableRoleSchema`, the three role pickers and `roleLabels`. That window is the only one in which it could be done at all — Postgres cannot remove a value from an enum type additively.

Consequence: Ticket 2's follow-up correction (recorded in `docs/tickets/02-roles-permission-map.md`) changed `markAttendance` to OFFICER/ADMIN, removed the `ATTENDANCE_STAFF` rows from the `rbac.test.ts` matrix and the `ATTENDANCE_STAFF` user row from `roles.integration.test.ts`, and rewrote the unpushed migration. Those are settled-decision changes, not weakened guards: the matrix still asserts every role against every permission, a test now enforces that coverage and that every permission keeps denied roles, and `roles.integration.test.ts` asserts the database enum rejects `ATTENDANCE_STAFF`.

## 2. Keep `APPROVER`; one model instead of two

`APPROVER` stays the only new login role — a login role distinct from ADMIN, so an approval decision is attributable to a named approver rather than to general administration. The office lives on the approval step, not on the role: a step's holder may be an APPROVER, an OFFICER or an ADMIN, in every case only when an Administrator has assigned them to that step (§8).

`ApprovalAuthority` and the delegation ticket are replaced by a single `ApprovalStep` that stores:

- `office` — `Council | Dean | OSA | Security`,
- `stepOrder` — ordinal position,
- `condition` — free-form description (still "ASSUMED, pending sign-off"),
- holder users — the user(s) who may act for this step, set by an Administrator.

The Council step's holder is an OFFICER user. An Administrator can reassign the holders of any step at any time, and **every reassignment writes an audit entry**. Skipping a step stays refused, and every decision (approve, reject, request revision) still writes an audit entry. Delegated authority moves to Phase 2.

Two models plus delegation references existed to answer "who may act for this step"; one step row with its holders answers the same question with less structure, and the reassignment audit replaces the delegation audit.

## 3. Remove the `BOUNCED` email outcome

A delivery attempt starts as `QUEUED` and ends as exactly one of `SENT` or `FAILED`. `BOUNCED` required bounce-report webhooks that the MVP does not have, so it was an unreachable state. The email–app isolation rule from ADR-0004 is unchanged: the in-app row is written first and survives any email failure, and an email outcome never alters in-app read/acknowledge state.

## 4. Merge manual reminders into the notifications ticket

A manual reminder is a notification send to an event's registered students through the same mechanism, gate (`sendNotifications`) and delivery rows. A second ticket and a second send path for the same mechanism were redundant, so the reminder behavior is a checkbox in the notifications ticket with one "Send Reminder" button.

## 5. Officer contacts become a `Club` field

Officer contacts (name + email) are a field on `Club`, edited by an Administrator or Council member on the one small club screen. Officers remain non-users. A separate metadata ticket plus model is not justified for a name and an email address.

Unchanged guards: publishing never blocks on email failure, the Council sees officer name, club and `SENT`/`FAILED` only, and full email addresses and delivery detail remain Administrator-only (RA 10173).

## 6. Merge attendance presence and walk-ins into one ticket

Presence and walk-in flagging are one table and one migration: two tickets meant two migrations on the same table. The single ticket keeps `@@unique([eventId, studentId])`, one PRESENT row per student per event, no ABSENT row, walk-ins never consuming capacity, the separate walk-in count, the required reason and recording actor, and the walk-in audit entry. The walk-in model is settled: one table with an `isWalkIn` flag, not a separate table (ADR-0003).

## 7. Drop the REST/OpenAPI ticket

The repo builds application data access through Server Actions (`AGENTS.md:56`: API routes are "restricted strictly to framework orchestration", do not create custom REST endpoints for application data; `AGENTS.md:57`: every state change routes through a Server Action). A v1 REST surface would contradict the repo's own architecture, and nothing in `docs/MVP-SPEC.md` requires one.

Decision: drop the ticket. **The per-route 401/403 tests go with it** — with no routes there is nothing to test — and gate verification stays in the per-ticket correctness reviews, which already assert authentication, suspended/inactive refusal and a denied-role case for every operation.

Trade-off to confirm: **this drop is conditional.** If a course rubric or panel explicitly requires a documented HTTP API, the ticket comes back (an optional last ticket, `docs/tickets/13-rest-api.md` style) and this decision reverses on its own; no other decision depends on it. Pending that answer, REST stays dropped.

## 8. Who may hold an approval step (ADMIN included)

An approval step's holder may be an `APPROVER`, an `OFFICER` (the Council step) or an `ADMIN`, in every case only when an Administrator has explicitly assigned that user to that step. An `ADMIN` has no approval power on any step it is not assigned to. No user may approve an event they created or submitted, even when they hold the step. Assigning and reassigning holders is audited, and every approval records the approver and their role. For a small organization or a demo, an Administrator may be assigned to all steps.

**ASSUMED, pending sign-off**: this is a judgement about who may act, not a settled institutional answer; it sits alongside the open assumptions in `docs/MVP-SPEC.md` and ADR-0005.

Rejected: letting an `ADMIN` approve any step automatically. It would let an administrator approve an event they created themselves, and it makes a decision attributable to general administration rather than to a named holder — the accountability the chain exists to provide. Assignment stays explicit so every approval names the person who made it.

## Consequences

- Ticket count 16 → 12. Unstarted tickets renumbered `03…12`; completed tickets `01` and `02` keep their numbers and commit hashes.
- `docs/tickets/06-delegation.md`, `10-walkins.md`, `13-manual-reminders.md` and `16-rest-openapi.md` are removed; their surviving content lives in tickets `05`, `08`, `09` and this ADR.
- Phase 2 deferrals added: step delegation, `BOUNCED` bounce handling (with webhook infrastructure), and any REST/OpenAPI surface.
- Unchanged and explicitly kept: suspended/inactive refusal everywhere, a denied-role test for every role on every operation, audit entries for every state change, the Administrator-only per-recipient email detail (RA 10173), the single-`@@unique` presence rule, capacity and confirmation-reference invariants, and publishing never blocking on email failure.

## Rejected alternatives

Rejected: keeping `ATTENDANCE_STAFF` as an assignable role (an assignment path, a dropdown entry and a permission for authority officers already hold); keeping `ApprovalAuthority` plus delegation references (two structures where one step-plus-holders answers "who may act"); keeping `BOUNCED` (no bounce webhook in the MVP, so an unreachable state); a separate walk-in table (parallel presence records under one unique rule); a separate officer-contact model (a name and an email on `Club`); a separate reminders ticket and send path (the same mechanism); and building a v1 REST surface against `AGENTS.md:56` while nothing in `docs/MVP-SPEC.md` requires one; and letting an `ADMIN` approve any step automatically, which would allow approving an event the administrator created (§8). Each remains reversible on an explicit requirement — delegation, bounce handling and any REST surface are listed as Phase 2.
