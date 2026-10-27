# KASAMA Single-Organization Rework

Date: 2026-10-25
Status: approved with changes — 2026-10-25
Supersedes, in part: `docs/superpowers/specs/2026-10-25-officer-positions-design.md`,
`docs/adr/0007-simplified-roles-and-approval.md`, `docs/MVP-SPEC.md`

## 1. Intent

KASAMA is the student council. It runs campus-wide events, not club events. This round turns the existing
club-scoped product into one organization with one event calendar, one approval path, one attendance model, and
one staff roster.

The two problems the office interview ranked highest are the ones this design optimizes for:

1. Students miss announcements spread across Facebook and group chats.
2. Event approval and event records live in scattered files and paper sign-in sheets.

The product therefore becomes the single place where KASAMA publishes events, collects registrations, records
attendance at the start and end of an event, and keeps the approval trail. It does not try to replace Facebook;
it becomes the authoritative record and the place students are told to check.

## 2. Goals, non-goals, anti-goals

### Goals

- One organization: no club ownership, no club scoping, no club permissions, no Manage Clubs page.
- One President, appointed by an Admin, enforced by the database and by one transactional mutation.
- An approval workflow from draft to published, with a written record of who approved or asked for changes.
- Event mechanics (mechanics, program flow, requirements) required before an event can be submitted.
- Registration with a verifiable QR code, plus a manual fallback that works when a QR scan fails.
- Check-in and check-out per registration, with duplicate protection and an audit trail of who recorded each scan.
- Attendance monitoring per event and task monitoring across all officers.
- Server-side enforcement of every permission; navigation is never the boundary.

### Non-goals

- Email, push, and SMS delivery. The in-app feed remains the source of truth. The model leaves a seam for channels.
- A multi-step Council/Dean/OSA/Security approval chain. Admin is the single approver stand-in this round.
- Payments, ticketing fees, seat maps, waitlists, and event chat.
- Club membership management, club events, club notifications, or any migration back to clubs.
- A public REST/OpenAPI surface. The repo uses Server Actions for application data.

### Anti-goals

- A second source of truth for attendance (paper backup that is never entered).
- Hiding a button and calling it authorization.
- Deleting the existing club history to make the model look clean.
- Adding a scanner dependency, a queue, or a background worker before the simple path is proven.

## 3. What exists today (verified)

### Stack and shape

- Next.js 16 App Router, React 19, TypeScript strict, NextAuth v5 with JWT sessions, Prisma 7 + PostgreSQL,
  Server Actions, CSS Modules, React Aria Components.
- Feature slices follow `actions.ts` / `queries.ts` / `mutations.ts` / `schemas.ts`.
- `pnpm test` currently passes: 14 files, 168 tests. `tsc --noEmit` currently passes.
- The working tree has uncommitted changes from an earlier, club-based "officer positions and tasks" round. The
  design below supersedes the club parts of that work; it does not throw the useful parts away.

### Database (verified against the local database)

- 4 clubs: LITS, SSC, JPCS, RCY.
- 12 users: 1 ADMIN, 4 OFFICER, 5 STUDENT, 2 DEV. No user currently has an officer position.
- 9 events. 6 have a `clubId` (3 LITS, 1 SSC, 1 JPCS, 1 RCY); 3 are organization-wide (`clubId = null`).
- 7 attendance rows, 7 notifications (2 ALL, 5 CLUB), 0 tasks, 0 pending role assignments.

### What is real and what is still mock

| Area                      | Current state                                                                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users, roles, invitations | Real. Admin-only user table, pending email invitations, role changes, deactivation, last-admin guard.                                                                                           |
| Clubs                     | Real. CRUD, club assignment, club-scoped notifications, one President per club.                                                                                                                 |
| Notifications             | Real. In-app feed + read receipts; the create action also sends email. Audience is ALL or CLUB.                                                                                                 |
| Events                    | Split. 9 real `Event` rows exist, but the student catalog is an in-memory mock (`initial-events.ts`, `useSyncExternalStore`). There is no event create/edit action, no status, no registration. |
| Attendance                | Real table, mock UI. `/attendance` is a hard-coded history. Nothing in `src/` writes attendance.                                                                                                |
| Tasks                     | Schema + Zod schemas only. No queries, actions, routes, or UI.                                                                                                                                  |
| Approval                  | Not built. No status, no approval model, no queue.                                                                                                                                              |
| Scan                      | Not built. No route, no scanner, no scan action.                                                                                                                                                |
| Dashboard                 | Student dashboard only.                                                                                                                                                                         |
| Manage Clubs              | Built: page, table, modal, actions, story, dev preview.                                                                                                                                         |
| Manage Users              | Built, with club column, club filter, Assign Club modal, and officer position UI.                                                                                                               |

### Authorization today

- `src/lib/security/rbac.ts` is a role matrix with `yes`, `no`, and `own_club`.
- Officer positions narrow the Officer column. `PRESIDENT` is currently one per club.
- `requirePermission(...)` checks the session; `requireClubPermission(...)` re-reads the actor and checks the club.
- The JWT callback re-reads `role`, `isActive`, `clubId`, and `officerPosition` from the database on every session
  read, so role/position changes already apply without a manual sign-out.
- The sidebar hides items by `can(role, permission)`, which is presentation only.

### Documentation conflict to settle

`docs/adr/0007` and `docs/MVP-SPEC.md` describe an `APPROVER` login role and a Council → Dean → OSA → Security
approval chain. The brief says four roles and Admin as the approver stand-in. This design follows the brief. A new
ADR will mark the club-scoped and multi-step parts of 0007 as superseded rather than silently leaving two stories
in the repo.

## 4. What breaks when clubs are removed

Removing clubs is not one page deletion. It reaches these places:

### Schema and database

- `Club` and its four relations: `User.clubId`, `PendingRoleAssignment.clubId`, `Event.clubId`,
  `Notification.clubId`.
- `NotificationAudience.CLUB` and every query that filters on it.
- `Task.clubId` is currently **required**, plus its foreign key and `[clubId, status]` index.
- The per-club partial unique index on `User.clubId` and the `CHECK` that requires a club for a position.
- Seed data: clubs, memberships, club events, club notifications, pending club assignment.

### Security and data access

- `AccessLevel = "own_club"` and the `club.*` permissions.
- `requireClubPermission` / `requirePageClubPermission`.
- `notificationVisibility` and `buildNotificationAudienceFilter` (club branch).
- Sidebar `club.read` item.

### User management

- Club column, club filter, `AssignClubModal`, club field in `AddUserModal`.
- `setUserClubAction`, `setUserClub`, `SetUserClubSchema`.
- "Officers must belong to a club" in schemas and actions.
- "Position requires a club" in the position mutation, the CHECK, and the partial index.

### Events, tasks, notifications

- `EventRow.clubName`, `organizer`, and the event detail's club/organization host split.
- Mock event `host: "organization" | "club"` and the host filter.
- `Task` schemas' `clubId`, and the old task design's club scoping.
- Notification composer club selector, `getClubOptionsAction`, `getNotificationRecipients(clubId)`.
- `ClubLabel` in notification cards, stories, and previews.

### UI, seed, tests, docs

- `/admin/clubs`, `Manage Clubs` nav, `ClubsManagement`, `ClubFormModal`, `ClubLabel`, club preview data,
  `ClubLabel.stories.tsx`.
- Seed's club/user/event/notification relationships.
- `rbac.test.ts`, `auth-guards.test.ts`, `users/schemas.test.ts`, notification tests, preview-data tests.
- `documentation/RBAC.md`, `DATA-MODEL.md`, `ARCHITECTURE.md`, `AUTH-AND-ACCESS.md`, `NOTIFICATIONS.md`,
  `OVERVIEW.md`, `ROADMAP.md`, `GLOSSARY.md`, `README.md`, the ADRs, the tickets, and the old design/plan.

The migration plan below keeps the existing rows until an explicit cleanup approval, so none of this requires
deleting data now.

## 5. Proposed model

### 5.1 Roles and the President position

`Role` stays `STUDENT | OFFICER | ADMIN | DEV`. `DEV` keeps its existing superuser behavior and stays pinned to
"yes" in the matrix.

`OfficerPosition` keeps one value, `PRESIDENT`, on `User`. The rules:

- A position is valid only when `role = OFFICER`.
- Exactly one President in the whole system. The database enforces "at most one" with a global partial unique
  index; the application enforces the appointment transaction.
- Clearing the role clears the position in the same update.
- Deactivating the President clears the position in the same transaction, otherwise the index would block the
  next appointment.
- Appointing a new President clears the previous President and sets the new one in one transaction.
- The position is never set from a client-supplied role or permission claim; it is an Admin-only mutation.

```prisma
enum OfficerPosition {
  PRESIDENT
}

// User
officerPosition OfficerPosition?
```

Database enforcement (raw SQL appended to the migration; Prisma cannot model either):

```sql
CREATE UNIQUE INDEX "User_officer_position_president_key"
  ON "User" ("officerPosition")
  WHERE "officerPosition" = 'PRESIDENT';

ALTER TABLE "User"
  ADD CONSTRAINT "User_position_requires_officer"
  CHECK ("officerPosition" IS NULL OR "role" = 'OFFICER');
```

"Exactly one" cannot be enforced by a unique index without a row to hang it on. The system allows zero or one
President; the People page shows a clear "No President appointed" state and the Admin appoints one. This is the
honest interpretation of the invariant.

### 5.2 Events and approval

```prisma
enum EventStatus {
  DRAFT
  SUBMITTED
  REVISION_REQUESTED
  APPROVED
  PUBLISHED
  CANCELLED
}

enum EventApprovalAction {
  SUBMITTED
  APPROVED
  REVISION_REQUESTED
  CANCELLED
}

// Event
status               EventStatus @default(DRAFT)
mechanics            String?
programFlow          String?
requirements         String?
publishedAt          DateTime?
capacity             Int?
registrationClosesAt DateTime?

// New
model EventApproval {
  id         String              @id @default(cuid())
  eventId    String
  event      Event               @relation(fields: [eventId], references: [id])
  actorId    String
  actor      User                @relation(fields: [actorId], references: [id])
  action     EventApprovalAction
  fromStatus EventStatus
  toStatus   EventStatus
  comment    String?
  createdAt  DateTime            @default(now())

  @@index([eventId, createdAt])
}
```

`APPROVED` stays in `EventStatus` for a possible two-step flow later, but no transition writes it this round.
Approval publishes immediately, so `EventApprovalAction` drops `PUBLISHED`; the `APPROVED` trail row records
`fromStatus = SUBMITTED` and `toStatus = PUBLISHED`.

`mechanics`, `programFlow`, and `requirements` are nullable so drafts can be saved, but all three must be
non-empty after trimming before `SUBMITTED` is allowed. This is validated in the schema and again in the
mutation, because the client is not the boundary.

`capacity` is optional; `null` means unlimited. `registrationClosesAt` is optional; `null` means registration
stays open until the event starts. Registration closes when either the capacity or the deadline is reached.

Transitions:

| From               | To                 | Who              | Rule                                                                                                                                                                                      |
| ------------------ | ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DRAFT              | SUBMITTED          | President, Admin | Mechanics complete; writes a `SUBMITTED` record.                                                                                                                                          |
| SUBMITTED          | PUBLISHED          | Admin            | Approve; sets `publishedAt`; writes an `APPROVED` record with `fromStatus = SUBMITTED`, `toStatus = PUBLISHED`; comment optional. Admin self-approval is allowed and the actor is logged. |
| SUBMITTED          | REVISION_REQUESTED | Admin            | Comment required; writes a `REVISION_REQUESTED` record.                                                                                                                                   |
| REVISION_REQUESTED | SUBMITTED          | President, Admin | Mechanics complete again; writes a new `SUBMITTED` record.                                                                                                                                |
| Any non-cancelled  | REVISION_REQUESTED | Admin            | The unpublish/rework path; comment required; clears `publishedAt`; writes a `REVISION_REQUESTED` record.                                                                                  |
| Any non-cancelled  | CANCELLED          | President, Admin | Writes a `CANCELLED` record; hidden from students; registration and scanning stop.                                                                                                        |

Every status change writes an `EventApproval` row, except the legacy backfill described in §7, which has no
actor and is shown as "No approval record (pre-workflow)". Despite the name, the trail is the full
approval-and-publication record: who submitted, who approved or asked for changes and why, and who cancelled.
The staff event detail shows the trail in order. All staff roles may read it; students never see it.

Edits are allowed only in `DRAFT` and `REVISION_REQUESTED`. To change an approved or published event, an Admin
first sends it back to `REVISION_REQUESTED`; that keeps the approval meaningful and leaves a record. There is no
separate publish action or `event.publish` permission this round: approval publishes.

Students see only `PUBLISHED` events. A student who opens a draft by direct URL gets a not-found response, not an
access-denied page, so the existence of the draft is not leaked. Staff see all statuses with a status pill.

### 5.3 Registration

```prisma
enum RegistrationStatus {
  REGISTERED
  CANCELLED
}

model Registration {
  id          String             @id @default(cuid())
  eventId     String
  event       Event              @relation(fields: [eventId], references: [id])
  studentId   String
  student     User               @relation(fields: [studentId], references: [id])
  reference   String             @unique
  status      RegistrationStatus @default(REGISTERED)
  createdAt   DateTime           @default(now())
  cancelledAt DateTime?

  @@unique([eventId, studentId])
  @@index([studentId, status])
}
```

- Only a `STUDENT` may register. Staff roles do not register; they run events.
- Registration is open only while the event is `PUBLISHED`, has not started, is before
  `registrationClosesAt` when one is set, and has a free seat when `capacity` is set.
- `capacity = null` means unlimited. `registrationClosesAt = null` means registration stays open until the event
  starts. Registration closes at the earlier of the deadline and the start time, or when the last seat is taken.
- Cancelling sets `CANCELLED` and preserves the row and reference. Re-registering reuses the row, rechecks the
  deadline and capacity, and restores `REGISTERED`, so duplicate prevention and history survive.
- A cancellation frees a seat. The availability read returns seats left, `Full`, or `Registration closed` for the
  event card and detail; the register action rechecks the same rules server-side.
- Capacity is enforced inside a `Serializable` transaction that counts `REGISTERED` rows and then inserts or
  updates. A serialization conflict is retried once; a second conflict returns a retryable envelope. No seat
  counter is stored, so the count cannot drift.
- Cancellation is refused once the event has started or a check-in exists. Attendance is a record of presence,
  not an RSVP, and the current UI already treats cancellation as closed after the start.
- `reference` is a random, human-typable code (Crockford base32, grouped, at least 60 bits). It is both the QR
  payload and the manual code. It contains no personal data.
- The QR is rendered with the already-installed `qrcode` package; no new dependency is needed for rendering.

The manual student-ID fallback needs a student number, and `Attendance.studentId` already means the user foreign
key. Add a differently named field:

```prisma
// User
studentNumber String? @unique
```

It is free text, trimmed, 1-30 characters, stored uppercase, and optional. A student enters it on the
registration form the first time; it is saved to their profile and reused. An Admin can correct it on the People
page. A student who has not set one can still register and use the QR; manual lookup then falls back to email or
the confirmation reference. Existing students need no backfill.

Registration history is owned by the student. If an event is cancelled or sent back for revision, the
registration, ticket, and attendance history stay visible with the event's current status and a "Scanning is
closed" note. Hiding the event from the catalog does not erase the student's record.

### 5.4 Attendance

Extend the existing `Attendance` row rather than create a parallel table. The existing unique rule
`@@unique([eventId, studentId])` already gives one row per student per event.

```prisma
enum AttendanceMethod {
  QR
  MANUAL_CODE
  MANUAL_ID
  MANUAL_SIGNIN
  LEGACY
}

// Attendance (changed fields)
checkedInAt    DateTime          @default(now())
checkedInById  String?
checkedInBy    User?             @relation("CheckInRecorder", fields: [checkedInById], references: [id])
checkInMethod  AttendanceMethod?
checkedOutAt   DateTime?
checkedOutById String?
checkedOutBy   User?             @relation("CheckOutRecorder", fields: [checkedOutById], references: [id])
checkOutMethod AttendanceMethod?
photoUrl       String?           // legacy only; new rows do not require a photo
```

Why one row with two timestamp pairs:

- "Per registration, check in and check out" is exactly one attendance record with a start and an end.
- The existing table, unique rule, and 7 rows survive.
- Duplicate check-in is "row already exists with `checkedInAt`"; duplicate check-out is "`checkedOutAt` already
  set". The action pre-checks for a clear message and a conditional update closes the race.
- Every record stores who recorded the start and who recorded the end, when, and by which method.

Rules:

- Check-in creates the row. Check-out updates it.
- Check-out before check-in returns "Not checked in" (a result, not a 500).
- Duplicate check-in returns "Already checked in at {time} by {name}" (a result, not an error).
- Duplicate check-out returns "Already checked out at {time} by {name}".
- A cancelled registration cannot be checked in.
- A QR or manual code that belongs to another event is refused.
- Scanning is allowed only for a `PUBLISHED` event, at any time while it is published: staff can scan a late
  arrival or an end-of-event line without fighting the clock.
- Manual entry accepts a registration reference, a student number, or an email address. A manual sign-in may
  create an attendance row for a student who did not register. That is a walk-in; monitoring counts walk-ins
  separately. This is the "manual sign-in for forums" path.
- Existing 7 attendance rows become legacy check-ins: `checkInMethod = LEGACY`, `checkedInById = null` (the old
  data never stored an actor), `checkedOutAt = null`. A backfill also creates their registration rows so the
  monitoring view can show "registered / attended".
- Monitoring counts: registered (registration status `REGISTERED`), checked in (attendance rows with
  `checkedInAt`), checked out (attendance rows with `checkedOutAt`), not attended (registered without an
  attendance row), and walk-ins (attendance rows without a registration) as a separate number.

### 5.5 Tasks

```prisma
model Task {
  id           String     @id @default(cuid())
  eventId      String?
  event        Event?     @relation(fields: [eventId], references: [id])
  type         TaskType
  assigneeId   String
  assignee     User       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  assignedById String
  assignedBy   User       @relation("TaskAssigner", fields: [assignedById], references: [id])
  dueAt        DateTime?
  status       TaskStatus @default(ASSIGNED)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([assigneeId, status])
  @@index([eventId, type])
  @@index([assignedById])
}
```

- `clubId` is removed. The Task table currently has 0 rows, so this drops no data.
- `ATTENDANCE` requires an event and a due date. `GENERAL` may have either or both.
- The assignee must be an active `OFFICER`. Any Officer, including the President, may be assigned, though
  assigning the President a scan task is redundant.
- The President may create, reassign, and delete tasks they assigned. Admin may edit any task.
- The assignee may move their own task forward: `ASSIGNED → IN_PROGRESS → DONE`. No backward moves.
- Admin task monitoring shows all officers' tasks, with assignee, event, status, and due date, and allows
  reassignment, status changes, and deletion.
- Demoting or deactivating an Officer does not delete their tasks. The tasks stay in the record and remain visible
  to the Admin, who can reassign or delete them. Scan access fails immediately because the guard re-reads the
  actor's role and active status. The task list marks the assignee as no longer an Officer.

### 5.6 Notifications

- Notifications are campus-wide. The composer no longer asks for an audience or a club.
- `NotificationAudience` and `Notification.clubId` become legacy in the first migration: the code writes
  `audience = ALL, clubId = null` and reads only `ALL`. Existing club-scoped rows stay in the database but are not
  shown. The cleanup migration can archive and drop the columns after approval.
- `NotificationRead` is unchanged.
- The in-app feed remains the source of truth. The design seam for more channels is: keep `Notification` as
  content and add a `NotificationDelivery(channel, status, ...)` table later, without changing read receipts. No
  unused delivery table is created now.
- The current create action also sends email. The brief says email is out of scope. Recommended default: stop
  sending email this round and keep the in-app row; the existing email helper stays for a later channel round.
  This is a decision below because it removes a currently working side effect.

## 6. Permission matrix

`DEV` is pinned to YES on every row, as today, and is omitted from the table. `own_club` is removed. Row scope
(own event, own task, assigned event) is enforced in queries and mutations, not by a matrix qualifier.

| Permission                 | Student |                 Officer                 |         President         |     Admin      |
| -------------------------- | :-----: | :-------------------------------------: | :-----------------------: | :------------: |
| `event.read_published`     |   YES   |                   YES                   |            YES            |      YES       |
| `event.read_all`           |   NO    |                   YES                   |            YES            |      YES       |
| `event.create`             |   NO    |                   NO                    |            YES            |      YES       |
| `event.edit`               |   NO    |                   NO                    |            YES            |      YES       |
| `event.submit`             |   NO    |                   NO                    |            YES            |      YES       |
| `event.approve`            |   NO    |                   NO                    |            NO             |      YES       |
| `event.cancel`             |   NO    |                   NO                    |            YES            |      YES       |
| `registration.create`      |   YES   |                   NO                    |            NO             |       NO       |
| `registration.cancel`      |   YES   |                   NO                    |            NO             |       NO       |
| `registration.read_own`    |   YES   |                   NO                    |            NO             |       NO       |
| `registration.read_event`  |   NO    |                   YES                   |            YES            |      YES       |
| `attendance.scan`          |   NO    | YES with matching open ATTENDANCE task  |       YES any event       | YES any event  |
| `attendance.manual`        |   NO    | YES with matching open ATTENDANCE task  |       YES any event       | YES any event  |
| `attendance.view`          |   NO    | YES events with any task (open or done) |      YES all events       | YES all events |
| `task.create`              |   NO    |                   NO                    |     YES (they assign)     |      YES       |
| `task.read_own`            |   NO    |                   YES                   |            YES            |      YES       |
| `task.read_assigned`       |   NO    |                   NO                    | YES (tasks they assigned) |      YES       |
| `task.read_all`            |   NO    |                   NO                    |            NO             |      YES       |
| `task.update`              |   NO    |                   NO                    | YES (tasks they assigned) |      YES       |
| `task.update_status_own`   |   NO    |                   YES                   |            YES            |      YES       |
| `task.delete`              |   NO    |                   NO                    | YES (tasks they assigned) |      YES       |
| `notification.read`        |   YES   |                   YES                   |            YES            |      YES       |
| `notification.create`      |   NO    |                   YES                   |            YES            |      YES       |
| `user.read`                |   NO    |                   NO                    |            NO             |      YES       |
| `user.create`              |   NO    |                   NO                    |            NO             |      YES       |
| `user.update`              |   NO    |                   NO                    |            NO             |      YES       |
| `user.delete`              |   NO    |                   NO                    |            NO             |      YES       |
| `officer.assign_president` |   NO    |                   NO                    |            NO             |      YES       |

Position refinement for `OFFICER`:

- Plain Officer: `event.read_all`, `attendance.scan`/`manual` only with a matching open task,
  `attendance.view` for events they have any task for (including a completed task, so they can still see the
  records they made), `task.read_own`, `task.update_status_own`, `notification.read`, `notification.create`.
- President: everything a plain Officer can do, plus `event.create`, `event.edit`, `event.submit`,
  `event.cancel`, `task.create`, `task.read_assigned`, `task.update`, `task.delete`,
  `attendance.scan`/`manual` for any event, `attendance.view` for all events.

The scan permission is deliberately split from the matrix: the matrix says an Officer _may_ scan; the event
guard decides _whether_ this Officer may scan _this_ event. `requirePermission("attendance.scan")` alone is not
enough.

## 7. Migration and data retention

No data is deleted in the first migration. The existing club history stays in place, unused, until a separate
cleanup is approved.

### 7.1 First migration (additive, keeps club data)

1. Add `EventStatus`, `RegistrationStatus`, `AttendanceMethod`, `EventApprovalAction`.
2. Add `Event.status` (default `DRAFT`), `Event.mechanics`, `Event.programFlow`, `Event.requirements`,
   `Event.publishedAt`, `Event.capacity`, `Event.registrationClosesAt`.
3. Add `Registration`, `EventApproval`, and `User.studentNumber`.
4. Extend `Attendance` with check-out and recorder fields; make `photoUrl` nullable.
5. Remove `Task.clubId` (0 rows), its foreign key, and its club index; add the new task indexes.
6. Replace the per-club President index and CHECK with the global index and the role-only CHECK.
7. Keep `Club`, `User.clubId`, `Event.clubId`, `Notification.clubId`, `NotificationAudience`, and
   `PendingRoleAssignment.clubId` in the schema but stop reading/writing them. New notifications write `ALL`.
8. Backfill existing events to `PUBLISHED` and set `publishedAt` from `createdAt` or the event start. No
   `EventApproval` row is created because there is no historical actor; the detail shows the pre-workflow note.
9. Backfill a `REGISTERED` registration for each of the 7 existing attendance rows. Generate references in an
   idempotent application script, not in raw SQL.
10. Mark existing attendance rows `LEGACY`; leave `checkedInById` null because the old data has no actor.
11. Do not create a President. The Admin appoints one after the migration.

The `Task.clubId` drop is the only column removal in this migration, and the table is empty. Every other removal
waits for the cleanup.

### 7.2 Cleanup migration (separate approval, after a backup)

1. Export the club data first: the 4 club names, the 9 user memberships, the 6 event club ids, and the 5
   club-scoped notification ids. A JSON/CSV export outside the app or in a git-ignored archive is enough; the
   content is club names, not student records.
2. Drop `Club`, `User.clubId`, `Event.clubId`, `Notification.clubId`, `PendingRoleAssignment.clubId`, and the
   club audience enum/value.
3. Optionally archive the 5 club-scoped notification bodies before dropping the audience column. They are hidden
   in the first release, not deleted.

Postgres cannot remove a single enum value; the cleanup recreates `NotificationAudience` with only `ALL` (or
drops the column entirely) and casts the data. That is why it is a separate, reviewed step.

### 7.3 Rollback

The first migration is additive and the club columns remain, so the code can be rolled back without a data
restore. The cleanup is destructive and gets a backup and a maintenance window.

## 8. Screens and routes

### Student

- `/events` — published events only, with search and upcoming/past filter.
- `/events/[eventId]` — published detail with mechanics, program flow, requirements, seats left / `Full` /
  `Registration closed`, and register or cancel.
- `/registrations` — own registrations, grouped upcoming/past/cancelled; registrations for unpublished or
  cancelled events stay visible with the event's current status.
- `/registrations/[eventId]/ticket` — confirmation reference and QR; still viewable after the event stops being
  published, with a note that scanning is closed.
- `/attendance` — own attendance history (check-in and check-out).
- `/notifications` — feed and read state.

### Officer and President

- `/dashboard` — assigned tasks, open scan task, role-appropriate shortcuts.
- `/events/[eventId]/attendance` — attendance monitoring for an assigned event (Officer) or any event
  (President).
- `/scan` — scan landing; lists the events this user may scan.
- `/events/[eventId]/scan` — scan screen with a check-in/check-out toggle, code field, manual reference /
  student-number / email entry, result history, and a clear no-access state.
- `/events/[eventId]` — staff detail with status, mechanics, and the approval/publication trail.
- `/tasks` — the President's assigned and created tasks, with the assign dialog.
- `/events/new`, `/events/[eventId]/edit` — event form with the mechanics section, Save draft, and Submit for
  approval.

### Admin

- `/admin/approvals` — queue of `SUBMITTED` events with mechanics and Approve (publishes immediately) / Request
  revision actions; the event detail shows the full approval/publication trail.
- `/admin/people` — add or remove the President and Officers, invite by email, change role and position,
  deactivate. (The old `/admin/users` route and nav label are retired; this replaces Manage Users.)
- `/admin/tasks` — all officers' tasks with assignee, event, status, due date, and edit actions.
- `/events/[eventId]/attendance` — same monitoring view as the President.
- `/scan`, `/events/[eventId]/scan` — scanning is allowed and every scan records the Admin.
- `/notifications` — compose.

### Navigation

- Dashboard, Events, My Registrations, My Attendance, Notifications.
- Scan QR: always for President and Admin; for a plain Officer only while they hold an `ATTENDANCE` task that is
  not `DONE`.
- Tasks: President.
- Approvals, Tasks, People: Admin.
- Manage Clubs is removed.

The nav is a convenience. Every page and action re-checks the server permission.

## 9. Enforcement and session

### Guards

- Every exported Server Action starts with `requireAuth` or `requirePermission`; every write validates with
  `safeParse`; every row-scoped write checks ownership in the mutation.
- Event visibility is a query rule, not a UI rule: student reads filter `status = PUBLISHED`; staff reads do not.
- `requireEventScanAccess(eventId)` is a dedicated guard:
  1. `requireAuth()`.
  2. Re-read `{ role, isActive, officerPosition }` from the database by user id.
  3. Refuse inactive users.
  4. `ADMIN`, `DEV`, and `OFFICER + PRESIDENT` pass.
  5. A plain `OFFICER` passes only with an `ATTENDANCE` task for this exact event, assigned to them, status not
     `DONE`.
  6. Everyone else gets `ForbiddenError`.
  7. The event must exist and be `PUBLISHED`.
- Both scan and manual entry call the same guard. There is no manual-entry bypass.
- Every attendance write stores the actor id from the verified session, never from the payload.
- Task status changes re-read the task and assignee; a task marked `DONE` loses scan access immediately.
- Position and role changes already refresh on the next JWT read. `clubId` is removed from the token and session;
  `officerPosition` stays. Sensitive guards still re-read the database, so a stale token cannot outlive a
  replacement.
- Self-protection: no user may change their own role. The last active Admin cannot be demoted or deactivated.
  The President position is Admin-only; an Officer cannot promote or demote themselves. The existing guard
  counts ADMIN + DEV; this round counts active ADMINs, matching "never remove the last Admin", while DEV remains
  a recovery account.
- The app has no REST endpoints for application data. A denied Server Action returns the shared forbidden
  envelope (`ActionStatusResponse`), and a denied page redirects to `/access-denied`. This is the accepted
  interpretation of the brief's "403"; a literal HTTP status would require route handlers and contradict the
  repo's architecture.

## 10. Testing

- `rbac.test.ts`: `it.each` over every role × every permission, plus plain Officer vs President for every
  position-sensitive row. Assert `DEV` stays YES.
- Guard tests: Officer with a matching task allowed; without a task denied; with a `DONE` task denied; with a
  task for another event denied; President allowed on any event; Admin allowed and the recorded actor is the
  Admin; Student denied; inactive denied; stale token position denied after a fresh read.
- Approval tests: submit without all three mechanics refused; submit with them allowed; student query never
  returns non-published; direct draft detail is not found; revision comment required; approve sets `PUBLISHED`
  in one transition and writes an `APPROVED` row with `toStatus = PUBLISHED`; an Admin may approve their own
  event and is recorded as the actor; editing after publish requires revision; every transition writes a trail
  row naming the actor, and the trail shows who approved and who cancelled.
- Registration tests: capacity `null` is unlimited; a full event refuses a new registration; cancelling frees a
  seat; a deadline in the past closes registration; `null` deadline closes at the event start; the availability
  read returns seats left / `Full` / `Registration closed`; a serialization conflict retries once.
- Registration/attendance tests: duplicate check-in returns "already checked in"; duplicate check-out returns
  "already checked out"; check-out before check-in refused; cancelled registration refused; QR from another
  event refused; manual sign-in records method and actor; walk-in counted separately; a student's registration,
  ticket, and attendance history survive an event being unpublished or cancelled.
- Task tests: a demoted or deactivated Officer keeps their task history, loses scan access immediately, and the
  Admin can still reassign or delete the task.
- President tests: appointing a second President replaces the first in one transaction; demoting the President
  clears the position; deactivating the President clears it; the database partial index rejects a raw second
  President. The last item needs a small database-backed test (transaction rolled back) because a mocked Prisma
  client cannot prove a Postgres index. This adds an `integration` test project that is skipped when
  `DATABASE_URL` is absent.
- Admin scan: assert `checkedInById`/`checkedOutById` is the Admin, not the student.

## 11. Phases

Each phase is shippable on its own and leaves the app compiling and tested.

### Phase A — De-club and President

- First migration: global President index/CHECK; drop `Task.clubId`; keep legacy club columns.
- Rewrite the RBAC matrix: remove `own_club` and club permissions; add the new rows.
- Remove `clubId` from the session/JWT and from `requireClubPermission`; replace with role/position + row scope.
- Remove Manage Clubs, club UI, club schemas/actions, club seed, club previews/story.
- Rewrite People (from Manage Users) without clubs; position is global; last-admin and self-change guards.
- De-club events, tasks schemas, notifications, seed, tests, docs; add ADR-0009.
- Verify: no Manage Clubs; People can appoint/replace/clear President; second appointment replaces the first;
  demotion clears; tests pass.

### Phase B — Events, mechanics, and approval

- Add `EventStatus`, mechanics fields, `EventApproval`, `Event.capacity`, `Event.registrationClosesAt`,
  migration/backfill.
- Replace the in-memory student event mock (`initial-events.ts`, `event-data.ts`, `useSyncExternalStore`) with
  real `Event` queries; the 9 existing rows become the starting catalog.
- Event create/edit form; Save draft; Submit; Admin queue; revision comment; approve (publishes immediately);
  cancel.
- Student visibility filters; draft direct URL returns not found.
- Verify: create with missing mechanics cannot submit; Admin requests revision; President edits and resubmits;
  approve publishes; student sees it immediately; cancel hides it.

### Phase C — Registration with QR

- Add `Registration` and `User.studentNumber`; migration and legacy registration backfill.
- Register/cancel; reference generation; QR ticket; capacity and deadline availability server-side.
- Student UI shows seats left, `Full`, and `Registration closed`.
- Verify: register; fill capacity; cancel frees a seat; a past deadline closes registration; QR shows the
  reference; duplicate registration is refused.

### Phase D — Scanning, manual fallback, and tasks

- Extend `Attendance`; migration and legacy attendance backfill.
- Scan screen; check-in/check-out; duplicate results; manual code, student number, and email; walk-ins;
  recorder/method fields.
- Complete the tasks slice (queries, mutations, actions), remove club scoping.
- President assign/reassign/delete; assignee status moves; Admin all-tasks page.
- Officer dashboard tasks; conditional Scan QR nav; scan access guard.
- Verify: assign an attendance task; the Officer scans; DONE removes access; manual code and student number work;
  a walk-in is counted separately; an Admin scan records the Admin.

### Phase E — Attendance monitoring and notifications

- Global notifications; remove the club composer; stop sending email this round.
- Per-event attendance monitoring with counts and filters. No CSV export this round.
- Role-aware dashboard and final nav.
- Verify: Officer creates a notification; Student reads it; monitoring shows registered/checked in/checked
  out/not attended; the table has no export button.

## 12. Decisions (resolved 2026-10-25)

All 20 recommendations were accepted on 2026-10-25, with the four changes recorded in rows 6, 14, 16, and 17.
The table is the final decision record. **Blocking** marks decisions that shaped the schema or security model
and were settled before Phase A.

| #   | Decision                                                                                                                                                                                                                                                     | Decision                                                                                                                                                                   | Why it matters                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | **Blocking.** Legacy club data: keep the `Club` table and `User.clubId`/`Event.clubId`/`Notification.clubId` as read-only legacy for one release, then drop after a backup, or archive and drop now?                                                         | Keep for one release; separate cleanup.                                                                                                                                    | Avoids irreversible data loss and keeps rollback simple.                                                          |
| 2   | **Blocking.** The 9 existing events: `PUBLISHED` with "Not recorded (pre-workflow)" mechanics, or `DRAFT` so they must be re-approved?                                                                                                                       | `PUBLISHED`, mechanics blank/legacy.                                                                                                                                       | Changes what students see on day one.                                                                             |
| 3   | **Blocking.** The 5 club-scoped notifications: keep them stored but hidden, make them global, or archive/delete?                                                                                                                                             | Keep stored but hidden; archive in cleanup.                                                                                                                                | Making them global would expose club-only content to everyone.                                                    |
| 4   | **Blocking.** Event creators: President + Admin, or President only?                                                                                                                                                                                          | President + Admin (the brief's assumption).                                                                                                                                | Changes the create permission and the Admin's role.                                                               |
| 5   | **Blocking.** Approval chain: single Admin decision now, or the multi-step Council/Dean/OSA/Security chain?                                                                                                                                                  | Single Admin now; the approval log is the seam for steps later.                                                                                                            | A chain adds step holders, ordering, and a much larger workflow.                                                  |
| 6   | **Blocking.** Does Admin approval publish immediately, or is `PUBLISHED` a separate President/Admin action? May an Admin approve an event they created?                                                                                                      | Approve publishes immediately; keep `APPROVED` in the enum but unused. Admin self-approval is allowed and logged.                                                          | Affects status transitions and whether one Admin can operate alone.                                               |
| 7   | **Blocking.** Editing an approved/published event: require Admin revision/unpublish first, or allow direct edits?                                                                                                                                            | Require revision; edits only in DRAFT/REVISION_REQUESTED.                                                                                                                  | Direct edits would bypass the approval trail.                                                                     |
| 8   | **Blocking.** Student number: add an optional unique `User.studentNumber` (not `studentId`, which is already the user FK on `Attendance`), entered by the student at first registration or corrected by Admin, or use only the confirmation reference/email? | Add `studentNumber`; reference and email remain fallbacks.                                                                                                                 | Without it, "student-ID entry" has no field to match; the name avoids a second `studentId` meaning.               |
| 9   | **Blocking.** QR payload: opaque random registration reference, or a signed token?                                                                                                                                                                           | Opaque random reference.                                                                                                                                                   | Signed tokens only pay off for offline/stateless verification, which this app does not need.                      |
| 10  | **Blocking.** QR capture: USB/keyboard-wedge scanner + paste/manual entry, or in-browser camera scanning (new dependency)?                                                                                                                                   | Keyboard-wedge scanner + paste first; camera later.                                                                                                                        | Camera scanning adds a dependency and browser-permission work.                                                    |
| 11  | **Blocking.** Attendance record shape: one `Attendance` row per event+student with check-in/check-out fields, or separate check-in and check-out rows? May a manual sign-in create a walk-in without a registration?                                         | One row; walk-ins allowed and counted separately.                                                                                                                          | Changes the table, duplicate logic, and monitoring queries.                                                       |
| 12  | **Blocking.** Plain Officer attendance monitoring: only events with a task assigned to them (open or done), or all events?                                                                                                                                   | Events with any assigned task; President/Admin all.                                                                                                                        | Changes the query scope and the permission description.                                                           |
| 13  | **Blocking.** Notification email: stop sending email this round (in-app only) or keep the existing email side effect to all active users?                                                                                                                    | Stop this round; keep the helper for a later channel.                                                                                                                      | Email is declared out of scope, but it currently works.                                                           |
| 14  | Capacity and registration deadline: no capacity, registration until event start, or add capacity/windows?                                                                                                                                                    | Optional capacity (`null` = unlimited) and optional `registrationClosesAt` (`null` = until start); closes at either; UI shows seats left / `Full` / `Registration closed`. | Capacity adds concurrency, waitlists, and seat-release rules.                                                     |
| 15  | Admin user management: keep full role management including Admins, or only President/Officers?                                                                                                                                                               | Keep full management, with last-admin and self-change guards.                                                                                                              | Affects the People page and lockout safety.                                                                       |
| 16  | Attendance CSV export: include a download button, or just an export-ready table?                                                                                                                                                                             | Skip CSV this round; keep a filterable attendance table.                                                                                                                   | Avoids a file-format and download path nobody asked for.                                                          |
| 17  | Literal HTTP 403 on scan/manual entry: use the Server Action forbidden envelope (repo architecture), or add route handlers?                                                                                                                                  | Accepted: Server Action forbidden envelope; pages redirect to `/access-denied`.                                                                                            | Route handlers would contradict `AGENTS.md`'s Server Action rule.                                                 |
| 18  | Can staff register for events, or is registration Student-only?                                                                                                                                                                                              | Student-only.                                                                                                                                                              | The current role model has one role per user, so staff would lose their staff permissions if treated as students. |
| 19  | Pending President invitations: keep `officerPosition` on `PendingRoleAssignment` and apply it transactionally at first sign-in, or appoint only after the account exists?                                                                                    | Keep it; apply in one transaction that clears the previous President.                                                                                                      | A pending President is not a User yet, but applying it later must not create two.                                 |
| 20  | Scan time window: any time while the event is `PUBLISHED`, or only between `startAt` and `endAt`?                                                                                                                                                            | Any time while `PUBLISHED`.                                                                                                                                                | A window would block late arrivals and end-of-event lines.                                                        |

## 13. Assumptions stated as assumptions

- KASAMA is the only organization; every event is a KASAMA event.
- Admin is the Council/Dean/OSA/Security approver stand-in this round.
- The President is an `OFFICER` with a position, not a separate login role.
- The President and Admin may scan any event; an Officer scans only an assigned event with an open task.
- A student's QR is a reference, not a bearer credential for public access. The scan screen is authenticated.
- The in-app notification is the authoritative announcement; email is a later channel.
- The existing 7 attendance rows are historical and have no known recorder; they are marked legacy rather than
  inventing an actor.
- Approval publishes immediately; there is no separate publish step or `event.publish` permission.
- Capacity and the registration deadline are optional; `null` means unlimited and until the event starts.
- The status trail is staff-readable and records approval (which publishes) and cancellation. Legacy events have
  no trail row and show the pre-workflow note.
- A student's registration and attendance history is never hidden by an event leaving `PUBLISHED`.
- A demoted or deactivated Officer keeps task history; the Admin reassigns or deletes open work.
- Attendance monitoring has no CSV export this round.

## 14. Documentation changes

- Add `docs/adr/0009-kasama-single-organization.md` and mark the club-scoped and multi-step parts of ADR-0007 as
  superseded.
- Rewrite `documentation/RBAC.md` cell-for-cell with the matrix in §6.
- Update `documentation/DATA-MODEL.md`, `ARCHITECTURE.md`, `AUTH-AND-ACCESS.md`, `NOTIFICATIONS.md`,
  `OVERVIEW.md`, `ROADMAP.md`, `GLOSSARY.md`, and `README.md`.
- Replace the club parts of `docs/MVP-SPEC.md` and the tickets that describe club scoping or the old approval
  chain.
- Keep this design as the source for the implementation plan; do not commit it until asked.
