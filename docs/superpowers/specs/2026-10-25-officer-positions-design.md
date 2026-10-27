# Officer Positions, Tasks, and Scan Gating

Date: 2026-10-25
Status: approved (Option C)

## 1. Scope

This round adds a single club officer position (`PRESIDENT`), a `Task` model, and
position-aware authorization for tasks and attendance scanning.

In scope:

- `OfficerPosition` enum with one value, `PRESIDENT`, on `User` and on
  `PendingRoleAssignment`.
- One President per club, enforced by a partial unique index, and a CHECK
  constraint that a position requires `role = OFFICER` and a club.
- Transactional President replacement and removal.
- Task assignment, reassignment, status updates, and deletion.
- `/club` (President: tasks + officers) and a gated scan route that states
  attendance capture is not built yet.
- Position-aware permission checks, tests for every role/position against every
  new permission, cross-club attempts, plain-officer scan without a task, and a
  President replaced mid-session.

Out of scope (own rounds):

- Event creation/management (`event.create`, `event.manage`).
- Attendance capture: `Registration` model, scan screen, check-in action,
  walk-in fields (`attendance.record_walkin`). No permission row is added for a
  capability with no endpoint.

`AGENTS.md` says only implemented capabilities are listed in the matrix, so the
three deferred permissions above are deliberately absent until their features
land.

## 2. Current state

- `Role` is a single global enum on `User`: `STUDENT`, `OFFICER`, `ADMIN`,
  `DEV`. `DEV` is pinned to `yes` in every matrix row.
- `User.clubId` is nullable and singular; there is no membership table.
- `PendingRoleAssignment` stores one `role` and an optional `clubId`, keyed by
  unique `email`. It is applied only when the user row does not exist yet.
- `src/lib/security/rbac.ts` holds `PERMISSION_MATRIX` (role → access level) and
  `can(role, permission)`; `requirePermission(...)` checks the session role.
  `own_club` is scoped only by the notification feature.
- There is no `Task` model, route, action, or permission.
- `/attendance` is a mock read-only history. Nothing in `src/` writes
  `Attendance`; there is no scan route, scanner, check-in action, or
  `Registration` model.
- The DB holds 9 real `Event` rows (6 with a club). The student-facing events
  catalog is a separate in-memory mock.

## 3. Data model

```prisma
enum OfficerPosition {
  PRESIDENT
}

enum TaskType {
  ATTENDANCE
  GENERAL
}

enum TaskStatus {
  ASSIGNED
  IN_PROGRESS
  DONE
}

model User {
  officerPosition OfficerPosition?
  tasksAssigned   Task[] @relation("TaskAssignee")
  tasksCreated    Task[] @relation("TaskAssigner")
}

model PendingRoleAssignment {
  officerPosition OfficerPosition?
}

model Task {
  id           String     @id @default(cuid())
  clubId       String
  club         Club       @relation(fields: [clubId], references: [id])
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

  @@index([clubId, status])
  @@index([assigneeId, status])
  @@index([eventId, type])
}
```

Plus `Club.tasks Task[]` and `Event.tasks Task[]`.

### Migration

One migration, no backfill (all positions start null):

1. `CREATE TYPE` for `OfficerPosition`, `TaskType`, `TaskStatus`.
2. Add nullable `officerPosition` to `User` and `PendingRoleAssignment`.
3. `CREATE UNIQUE INDEX "User_club_president_key" ON "User" ("clubId") WHERE "officerPosition" = 'PRESIDENT';`
4. `ALTER TABLE "User" ADD CONSTRAINT "User_position_requires_officer" CHECK ("officerPosition" IS NULL OR ("role" = 'OFFICER' AND "clubId" IS NOT NULL));`
5. Create `Task` with foreign keys and indexes.

Prisma cannot express partial indexes or CHECK constraints, so 3 and 4 are raw
SQL appended to the generated migration. A `prisma migrate diff` dry run runs
immediately after migration to confirm the schema and database agree. If Prisma
reports the index as drift, the index stays in the database, enforcement also
exists in the mutations, and the limitation is documented.

### Invariants (mutation layer)

- Position requires `role = OFFICER` and a non-null club.
- Changing role away from `OFFICER`, or changing/clearing the club, clears the
  position in the same update.
- A task's club equals its assignee's club. For `ATTENDANCE`, the event must
  exist and its club must equal the task club.
- `ATTENDANCE` requires `eventId` and `dueAt`; `GENERAL` allows a null event and
  a null due date.
- The assignee must be a plain `OFFICER` (`officerPosition = null`) of the task
  club.
- Only one `PRESIDENT` per club (index + transaction).

## 4. Position lifecycle

- **Invite**: `AddUserModal` shows an officer-position field only when the role
  is `OFFICER`. Selecting a position requires a club. The pending row stores
  `officerPosition`.
- **First sign-in**: `signIn` copies `pending.officerPosition` into the new user
  alongside role and club, then deletes the pending row.
- **Role/club change**: `updateUserRole` and `setUserClub` clear the position
  when the new role is not `OFFICER` or the club changes/clears.
- **Appoint/replace**: Admin-only row action in Manage Users. One transaction
  clears the club's current President and sets the target officer to
  `PRESIDENT`. The target must be an `OFFICER` whose `clubId` is that club.
- **Remove**: the same action with "No position" clears the position, leaving
  the club without a President.

## 5. Session and JWT

Sessions use the `jwt` strategy. The `jwt` callback re-reads the user by
`token.email` on every session read and copies `id`, `role`, `isActive`, and
`clubId` onto the token; the `session` callback copies them to
`session.user`. Adding `officerPosition` to that select, token, session, and
`src/types/next-auth.d.ts` makes position changes take effect on the next
request with no sign-out.

Sensitive position-gated actions do not rely on the session alone:
`requireClubPermission` re-reads `{ role, clubId, officerPosition }` from the DB
by user id. A President replaced mid-session is therefore refused on the next
action even if the token still says `PRESIDENT`. Position-gated pages redirect
through `requirePagePermission`; actions return the forbidden envelope.

## 6. Permissions

New rows (matrix and `documentation/RBAC.md` edited together):

| Permission                 | Admin | Officer  | Student |
| -------------------------- | :---: | :------: | :-----: |
| `officer.assign_president` |  YES  |    NO    |   NO    |
| `task.assign`              |  YES  | OWN_CLUB |   NO    |
| `task.read_club`           |  YES  | OWN_CLUB |   NO    |
| `task.read_own`            |  NO   |   YES    |   NO    |
| `task.update_own`          |  NO   |   YES    |   NO    |
| `attendance.scan`          |  NO   | OWN_CLUB |   NO    |
| `attendance.view_results`  |  YES  | OWN_CLUB |   NO    |

`notification.create` changes from Officer `YES` to `OWN_CLUB`; position
narrows it to `PRESIDENT`.

Position refinement (`POSITION_PERMISSIONS`):

- `PRESIDENT`: `task.assign`, `task.read_club`, `attendance.scan` (any event in
  the club), `attendance.view_results`, `notification.create`.
- No position (plain officer): `task.read_own`, `task.update_own`, and
  `attendance.scan` only for an event with their own active `ATTENDANCE` task.
  No task assignment, no club-wide results, no notification composing.

Enforcement:

- `can(role, permission)` keeps its role-level meaning for existing callers.
- `positionAllows(position, permission)` is the second gate for `OFFICER`.
- `requireClubPermission(permission, clubId)` verifies the session, re-reads the
  actor from the DB, requires the role-level permission, requires the position
  gate when the role is `OFFICER`, and requires `actor.clubId === clubId`.
  `ADMIN`/`DEV` skip the club and position checks but still need the matrix
  grant.
- Scanning additionally checks the task in the action:
  - President: `event.clubId === actor.clubId`.
  - Plain officer: an `ATTENDANCE` task with `assigneeId = actor.id`,
    `eventId = event.id`, `status != DONE`.
  - Admin: never.

## 7. Tasks

- President creates tasks for plain officers of their own club; Admin may do so
  for any club.
- `ATTENDANCE` tasks pick a real DB event belonging to the task club and require
  a due date. `GENERAL` tasks may omit the event and due date.
- The assignee moves their own task `ASSIGNED → IN_PROGRESS → DONE`. The
  President may reassign or delete a task. Status cannot move backwards.
- The "Scan QR" nav item appears only while the officer holds an `ATTENDANCE`
  task that is not `DONE`; it links to that event's scan route.

## 8. UI surfaces

- **Manage Users**: position pill beside the Officer role; "Set officer
  position" row action (Admin) with President / No position; position field in
  the Add assignment dialog when Role = Officer.
- **`/club`**: one page with the club's tasks (assignee, event, type, due,
  status) and an Officers list. Presidents see their own club; Admins get a club
  picker. Assign task dialog, reassign, delete.
- **Dashboard**: assigned tasks panel for officers.
- **`/events/[eventId]/scan`**: permission-gated stub showing "Attendance
  capture is not built yet." No capture logic this round.
- **Sidebar**: `Club` for `task.read_club`; `Scan QR` only with an active
  attendance task. Notifications compose button hidden for plain officers.

## 9. Testing

- `src/lib/security/rbac.test.ts`: every role against every permission,
  including `DEV` pinned to yes; position matrix for President and plain
  officer; `notification.create` denied for plain officers.
- `src/lib/security/auth-guards.test.ts`: cross-club attempts denied,
  President replaced mid-session denied from a fresh DB read, plain officer
  scanning without a task denied, President scanning any own-club event
  allowed, Admin scanning denied.
- `src/features/users/*.test.ts`: position requires officer + club, role/club
  change clears position, transactional replacement, pending position applied
  at first sign-in.
- `src/features/tasks/*.test.ts`: assignment invariants (plain officer, same
  club, event club, ATTENDANCE requires event + due date), reassignment,
  deletion, status transitions, own-task scoping.
