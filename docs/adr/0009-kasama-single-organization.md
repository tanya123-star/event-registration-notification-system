# KASAMA single-organization model

Supersedes the club-scoped and multi-step parts of ADR-0007 (simplified roles and approval): there is one organization
(KASAMA), no clubs as a scoping unit, one global President appointed by an Admin, and a single-step event approval by an
Admin. The security guardrails from ADRs 0001–0006 stay in force; only the shapes below change.

## 1. One organization, no clubs

Events, tasks, notifications, and people are not scoped by a club. The `Club` table and the legacy `clubId` columns on
`User`, `Event`, `Task`, `Notification`, and `PendingRoleAssignment` stay in the database as read-only legacy columns until
a separate, approved cleanup migration. Application code stops reading and writing them, and the UI has no club column,
filter, audience, action, or page. Removing the physical club data is deliberately deferred so the first migration stays
additive and remains reversible.

## 2. One global President

`PRESIDENT` is an officer position, not a login role. A single active officer holds it:

- the database enforces it with a partial unique index plus a `CHECK` constraint (`PRESIDENT` requires `Role.OFFICER`),
- `setOfficerPosition` performs transactional replacement — clearing a sitting President and appointing the target in one
  transaction,
- changing a President's role away from `OFFICER`, or deactivating them, clears the position,
- Admins appoint and replace the President from the People page; no one may change their own role.

A plain officer gains no event-lifecycle permissions. The President additionally creates, submits, edits, and cancels
events, and assigns/reassigns/deletes their tasks. Admin approval publishes an event.

## 3. One-step approval

The multi-step approval chain (`ApprovalStep`, Council/Dean/OSA/Security holders, step delegation) is dropped. An Admin
approves a submitted event in one step and the decision is written to an approval record. Existing events stay
`PUBLISHED`; in-memory student events now use `KASAMA` as the organizer.

## 4. Notifications are campus-wide

Every new notification writes `audience: ALL, clubId: null`. Legacy `CLUB` rows remain stored but are hidden from every
feed. The system no longer sends notification email this round; the shared `sendEmail` helper remains as a future seam for
invitation email only.

## Consequences

- `rbac.ts` has no `own_club` or `club.*` permission, and no club guard. Nav and page titles say "People", not "Manage
  Users".
- The scan surface is campus-wide: Admin and President scan any published event; a plain officer scans only an event for
  which they hold a non-`DONE` `ATTENDANCE` task (enforced again in the scan flow, not by nav).
- `seed.ts` and previews no longer create clubs, club membership, club audiences, or a pending club assignment.
- The separate cleanup migration must: back up the data, then drop legacy club columns, the `Club` table, and the
  `NotificationAudience.CLUB`-only rows after a decision.

## Rejected alternatives

Rejected: keeping the club scoping and `own_club` access level (the organization is already single), and folding
notification email back into this phase (it is a separate, future step).
