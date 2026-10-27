# Roadmap

## Where the project stands

The foundations work end to end: sign-in, invitations, the People page with a global President, and campus-wide
notifications. The student-facing event browser, registration, ticket, and attendance history exist as staged in-memory
screens ready to be backed by the database.

The following phases are already approved in [the KASAMA plan](../docs/superpowers/plans/2026-10-26-kasama-single-org.md):

1. **Single-organization model.** People rename, global President, campus-wide notifications, no club surfaces.
2. **Tasks.** The President assigns tasks to Officers; Officers move their own tasks; Admins manage every task.
3. **Events, mechanics, approval.** Real event data replaces the in-memory mock; Admin approval publishes an event.
4. **Registration and QR.** Opaque references, optional capacity, cancel/re-register keeping the same reference.
5. **Scanning and attendance.** QR and manual capture, walk-ins, scan permissions tied to open attendance tasks.
6. **Final pass.** Navigation polish and documentation.

## Decisions already recorded

The design decisions are not open questions any more; they live in the approved ADRs:

- [ADR-0009](../docs/adr/0009-kasama-single-organization.md) covers the single-organization model, the global President,
  one-step approval, and the deferred club-cleanup migration.
- Roles and the central permission matrix are documented in [RBAC.md](./RBAC.md).
- Scan permissions and the officer-task rule are documented there as well, and the scan flow re-checks every permission
  server-side.

## Current limitations

- The student-facing event pages still use staged in-memory data; the database-backed event lifecycle is a later phase.
- Tasks, event approval, registration records, QR references, attendance capture, and the scan route still use the
  default auth and nav readiness only.
- Attendance is currently a seed-created check-in record; there is not yet a live scan router.
- Notification email is deliberately not part of the current build; the shared helper survives for the invitation email.
- The composer cannot attach an event yet.
- Re-inviting an existing user does not apply the new role, officer position, or external-email decision to their account.
- Notifications cannot be edited, deleted, scheduled, sent to one person, or delivered as push notifications.
- There is no user deletion workflow; deactivation is the removal path.
- There is no audit log, application-level rate limiting, or email delivery tracking.
- Legacy `Club` and `clubId` database columns remain, awaiting the separately-approved cleanup migration.
