# Implementation Plan: Officer Positions, Tasks, and Scan Gating

Date: 2026-10-25
Spec: `docs/superpowers/specs/2026-10-25-officer-positions-design.md`

Rules for the implementer:

- Do not commit or push (repo rule).
- Read each file before editing it.
- Every exported Server Action gets TSDoc and `safeParse` before business logic.
- Run `pnpm format && pnpm lint && tsc --noEmit` after TypeScript changes; add
  `pnpm test` for touched test files; run `pnpm build` once at the end.
- Schema work: `pnpm prisma format && pnpm prisma:generate && tsc --noEmit`.

## Task 1: Schema and migration

Files: `prisma/schema.prisma`, new migration folder.

1. Add `OfficerPosition { PRESIDENT }`, `TaskType { ATTENDANCE GENERAL }`,
   `TaskStatus { ASSIGNED IN_PROGRESS DONE }`.
2. Add `User.officerPosition`, `User.tasksAssigned`, `User.tasksCreated`,
   `PendingRoleAssignment.officerPosition`, `Club.tasks`, `Event.tasks`, and the
   `Task` model exactly as in the spec.
3. Run `pnpm prisma migrate dev --create-only --name officer_positions_and_tasks`.
4. Append to the migration SQL:
   - partial unique index `User_club_president_key` on `clubId` where
     `officerPosition = 'PRESIDENT'`;
   - CHECK constraint `User_position_requires_officer`.
5. Run `pnpm prisma migrate dev`.
6. Run `pnpm prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code` (or `prisma migrate diff` between the migration history and the schema) and record the result. Expected: no drift besides the known unmodelled index/constraint. If drift is reported for them, document it in the spec.
7. Run `pnpm prisma:generate`.

Acceptance: DB has the enums, both columns, `Task`, the partial index, and the
CHECK; `tsc --noEmit` passes.

## Task 2: RBAC matrix and position gate

Files: `src/lib/security/rbac.ts`, `documentation/RBAC.md`,
`src/lib/security/rbac.test.ts` (new).

1. Add permissions `officer.assign_president`, `task.assign`,
   `task.read_club`, `task.read_own`, `task.update_own`, `attendance.scan`,
   `attendance.view_results`.
2. Set cells exactly as the spec table; change `notification.create` Officer to
   `own_club`.
3. Add `POSITION_PERMISSIONS: Record<OfficerPosition, readonly Permission[]>`
   and `positionAllows(position, permission): boolean`. `null` position grants
   `task.read_own`, `task.update_own` only; scanning is handled by the task
   check, not the position table.
4. Add `canWithPosition(role, position, permission)` for presentation use.
5. Update `documentation/RBAC.md` with the new tables and the notification cell.
6. Test: `it.each` over every `Role` × every `Permission` asserting the exact
   matrix value via `can`; `it.each` over positions for the position table;
   assert plain officer cannot `notification.create`, President can.

Acceptance: tests pass; docs and code match cell for cell.

## Task 3: Session, guards, and fresh position reads

Files: `src/lib/infra/auth.ts`, `src/types/next-auth.d.ts`,
`src/lib/security/auth-guards.ts`, `src/lib/security/auth-guards.test.ts` (new).

1. Add `officerPosition` to the `jwt` select, token assignment, `session`
   assignment, and both declaration blocks.
2. Extend `AuthenticatedUser` with `officerPosition: OfficerPosition | null`.
3. Add `requireClubPermission(permission, clubId)`:
   - `requireAuth()` for identity;
   - re-read `{ role, clubId, officerPosition }` from `prisma.user` by id;
   - deny when the row is missing/inactive;
   - `ADMIN`/`DEV`: matrix grant only;
   - `OFFICER`: matrix grant + `positionAllows` + `clubId` match;
   - everyone else: deny.
     Throw `ForbiddenError` on failure.
4. Add `requirePageClubPermission` mirroring `requirePagePermission` redirects.
5. Test (mock `auth` and `prisma.user.findUnique`):
   - every role/position against each new permission;
   - cross-club attempt denied;
   - stale token says `PRESIDENT`, DB says `null` → denied;
   - Admin denied `attendance.scan`;
   - President allowed `attendance.scan` in own club only.

Acceptance: tests pass; existing actions compile with the extended user type.

## Task 4: Position lifecycle in users

Files: `src/features/users/{schemas,queries,mutations,actions}.ts`,
`src/features/users/constants.ts`, `src/features/users/schemas.test.ts`.

1. Add `OfficerPositionSchema = z.enum([OfficerPosition.PRESIDENT]).nullable()`.
2. `AddPendingUserSchema`: add `officerPosition` (nullable, default null) and a
   `superRefine` that requires `clubId` when role is `OFFICER` and requires
   `role = OFFICER` when a position is set.
3. `SetOfficerPositionSchema = { userId, officerPosition }`.
4. `UserManagementRow`: add `officerPosition`; select it in both branches.
5. `updateUserRole`: clear `officerPosition` when `role !== OFFICER`.
6. `setUserClub`: clear `officerPosition` when the club changes or clears.
7. `upsertPendingRoleAssignment`: persist `officerPosition`; clear it when role
   is not `OFFICER`.
8. New `setOfficerPosition({ userId, officerPosition })` mutation:
   - load target;
   - require `role = OFFICER` and `clubId`;
   - position `PRESIDENT`: one `$transaction` that clears the club's current
     President and sets the target;
   - `null`: clear.
9. New `setOfficerPositionAction` guarded by
   `requirePermission("officer.assign_president")`, returns
   `ActionStatusResponse`.
10. `auth.ts` first sign-in copies `pending.officerPosition`.
11. Tests: schema invariants; role/club change clears position; replacement is
    transactional (assert `$transaction` callback calls); pending position
    applied on create.

Acceptance: tests pass; `getUserManagementPage` returns the new field.

## Task 5: Tasks feature slice

Files: `src/features/tasks/{schemas,queries,mutations,actions}.ts` (new) plus
tests.

1. `schemas.ts`:
   - `TaskIdSchema`;
   - `CreateTaskSchema { clubId, eventId?, type, assigneeId, dueAt? }` with the
     ATTENDANCE → event + due date refinement;
   - `UpdateTaskSchema { taskId, assigneeId }`;
   - `UpdateTaskStatusSchema { taskId, status }`;
   - payload aliases at the bottom.
2. `queries.ts`:
   - `TaskRow { id, clubId, clubName, eventId, eventTitle, type, assigneeId,
assigneeName, assignedById, assignedByName, dueAt, status, createdAt }`;
   - `getClubTaskPage({ clubId, query })` cursor page by `createdAt, id`;
   - `getAssignedTaskPage({ assigneeId, query })`;
   - `getActiveAttendanceTask(assigneeId)` → first
     `ATTENDANCE` task not `DONE` with its event;
   - `getTaskById`;
   - `getAssignableOfficers(clubId)` → plain officers of the club;
   - `getClubEventOptions(clubId)` → events of the club.
3. `mutations.ts`:
   - `createTask(payload)` validates assignee (plain officer, same club), event
     (exists, same club) for ATTENDANCE, sets `assignedById`;
   - `updateTaskAssignee(payload)` revalidates;
   - `updateTaskStatus({ taskId, assigneeId, status })` only forward moves and
     only by the assignee;
   - `deleteTask(taskId)`.
4. `actions.ts` (all with TSDoc + `safeParse`):
   - `getClubTaskPageAction` → `requireClubPermission("task.read_club", clubId)`;
   - `getAssignedTaskPageAction` → `requirePermission("task.read_own")`;
   - `createTaskAction` → `requireClubPermission("task.assign", clubId)`;
   - `updateTaskAssigneeAction`, `deleteTaskAction` → `task.assign`;
   - `updateTaskStatusAction` → `task.update_own` and ownership.
5. Tests: assignment invariants (plain officer, same club, event club,
   ATTENDANCE requires event + due), reassignment, deletion, forward-only
   status, own-task scoping, cross-club denial.

Acceptance: tests pass.

## Task 6: Scan gating

Files: `src/features/tasks/scan.ts` (or in `queries.ts`),
`src/app/(app)/events/[eventId]/scan/page.tsx` (new), tests.

1. `canScanEvent({ userId, role, clubId, officerPosition, eventId })`:
   - `ADMIN`/`DEV`/`STUDENT` → false;
   - `PRESIDENT` → event exists and `event.clubId === clubId`;
   - plain officer → `getActiveAttendanceTask(userId)` matches `eventId`.
2. Scan page:
   - `requirePagePermission("attendance.scan")`;
   - `canScanEvent(...)` false → `redirect("/access-denied")`;
   - true → render a notice: "Attendance capture is not built yet."
3. Tests: plain officer without a task denied; with a matching active task
   allowed; task `DONE` denied; President any own-club event allowed; other
   club's event denied; Admin denied.

Acceptance: tests pass; route builds.

## Task 7: UI

1. `UsersManagement`: position pill, "Set officer position" dialog
   (`SetOfficerPositionModal`), wired to the action; pending rows show the pill.
2. `AddUserModal`: position select when Role = Officer; club required.
3. `Sidebar` + `(app)/layout.tsx`: pass `officerPosition` and `scanEventId`;
   nav `Club` (`task.read_club`) and `Scan QR` only when `scanEventId` exists.
4. Notifications page: `canCompose` becomes position-aware.
5. Dashboard: assigned-tasks panel for officers (server read via
   `getAssignedTaskPage`).
6. `/club` page: guard `task.read_club`; Admin club picker via `?clubId`;
   tasks table with assign/reassign/delete/status; officers list.
7. Scan stub page per Task 6.

Acceptance: `pnpm build` passes; manual check with a seeded President, a plain
officer with an ATTENDANCE task, and a plain officer without one.

## Task 8: Verification

1. `pnpm format && pnpm lint && tsc --noEmit`.
2. `pnpm test`.
3. `pnpm build` (stop the dev server first; it owns `.next`).
4. Drift dry run result recorded in the spec.
5. Update `documentation/RBAC.md` and the spec if anything diverged.
