# KASAMA Single-Organization Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the club-scoped product into one KASAMA system with one President, Officer task assignment, event registration with an opaque QR reference, and task-gated attendance scanning — without redesigning the existing UI.

**Architecture:** Keep the existing Next.js App Router, Server Action boundary, Prisma feature slices (`actions.ts` / `queries.ts` / `mutations.ts` / `schemas.ts`), CSS Modules, and RBAC guard pattern. Rebuild the product code from scratch instead of restoring the rejected Phase A–C stash. Reuse the current visual components and CSS modules; add only the fields, screens, and controls the brief requires.

**Tech Stack:** Next.js 16 (App Router), React 19 + React Compiler, TypeScript strict, NextAuth v5, Prisma 7 + PostgreSQL (`@prisma/adapter-pg`), CSS Modules + design tokens, `react-aria-components`, `react-icons`, `qrcode`, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-25-kasama-model-design.md`

**Baseline:** New branch `feat/kasama-single-org`, created from `525c5b3`. The club-based officer/task work stays on `wip/club-officer-positions-2026-10-25` and `feat/kasama-rework`.

**UI/UX contract:** The current screens are the visual baseline. Do not restore the rejected Phase A–C UI. Do not restyle existing pages, replace the design system, or introduce a new layout language. New screens must reuse the existing shell, `Content`, `ServerDataTable`, `DataTable`, `Modal`, `ConfirmDialog`, `Form`, `TextField`, `Select`, `DatePicker`, `TimeField`, `StatusBadge`, `Button`, `Link`, and the existing CSS-module patterns. If a required change would alter the visual hierarchy of an existing page, stop and ask.

**Database baseline:** The local database already has the prior Phase A–C migrations applied (`20261026090000_kasama_phase_a`, `20261026100000_kasama_phase_b`, `20261026120000_kasama_phase_c`) plus two older divergent migrations (`20261021155442_add_event_registrations`, `20261022010000_add_registration_reference_and_status`). Do not reset, clean, or re-run migrations. Restore the three A–C migration files from `stash@{0}^3` so the repository history matches the applied schema; do not restore any file under `src/` from that stash.

## Global Constraints

- **Do not commit, push, or open a PR** unless explicitly asked. Leave new work uncommitted.
- **Do not run the club cleanup migration**, drop legacy club tables/columns, delete data, or reset the database.
- **Do not change auth before the plan is approved.** This plan includes auth changes; execution starts only after approval.
- Every exported Server Action validates input with `z.safeParse()` before business logic; schemas live in the feature's `schemas.ts`.
- Every write action returns `ActionStatusResponse` or `ActionDataResponse<T>` and routes caught errors through `toActionResponse`. Every failure has a title and a complete-sentence description.
- Every protected action starts with `requireAuth` / `requirePermission` or a dedicated guard. Navigation visibility is never access control.
- Use `@/generated/prisma/browser` for enums/models reachable by client components. Never import the `client` entry into client code.
- Keep legacy `Club`, `User.clubId`, `Event.clubId`, `Notification.clubId`, and `PendingRoleAssignment.clubId` in `schema.prisma` for this release, but stop reading and writing them. Remove only `Task.clubId` (0 rows).
- Keep `NotificationAudience` in the schema because legacy rows use it. New notifications write `ALL` and `clubId: null`.
- No CSV export. No notification email this round. Leave `src/lib/messaging/email.ts` in place as the channel seam.
- Do not add dependencies. `qrcode` and `@types/qrcode` are already installed.
- Do not edit `src/generated/` by hand; run `pnpm prisma:generate`.
- After each phase run the gate for the touched files:
  - Schema/config: `pnpm prisma format && pnpm prisma:generate && pnpm format && pnpm lint && tsc --noEmit && pnpm test && pnpm build`
  - TS/TSX only: `pnpm format && pnpm lint && tsc --noEmit && pnpm test && pnpm build`
  - Markdown/CSS only: `pnpm format`
  - Run `pnpm test:browser` when a Storybook story changes.
- Stop after each phase. Report what changed, what passed, and exactly what to click through. Do not start the next phase until the user confirms.

## Review Focus

These are the failure modes most likely to bite a real user; each has a test in the owning task.

1. **Existing UI/UX drift.** A new screen or data change restyles an existing page, changes spacing/colors, or replaces a current component. The user must see the same visual language before and after.
2. **Migration drift.** The already-applied A–C schema is treated as a fresh database, or `prisma migrate dev` prompts a reset. Never reset; use `migrate deploy` and stop on drift.
3. **President invariant.** A second President is created, a replaced President keeps the position, or deactivation/role change leaves the position behind.
4. **Scan authorization.** A plain Officer scans without an open attendance task, scans another event, or keeps access after the task is `DONE`.
5. **Duplicate scans.** A second scan becomes an error or a second attendance row instead of an “already checked in/out” result.
6. **Capacity race.** Two students take the last seat, or cancellation does not free it.
7. **Denied scan route.** A student or unassigned Officer sees the scan screen instead of `/access-denied` with the scanning-specific message.

---

## Phase Map

| Phase | Outcome                                                                 | Main risk                         | Click-through                         |
| ----- | ----------------------------------------------------------------------- | --------------------------------- | ------------------------------------- |
| 0     | Baseline, branch, migration files                                       | Migration drift                   | `git status`, `prisma migrate status` |
| 1     | Clubs gone from product; global President; People; global notifications | RBAC/session regression, UI drift | People, events, notifications         |
| 2     | Tasks assigned by President, visible to Officers/Admin                  | Task authorization                | Tasks, dashboard                      |
| 3     | Real events, mechanics, approval that publishes                         | Event visibility, approval trail  | Events, approvals                     |
| 4     | Registration, capacity/deadline, opaque QR reference                    | Capacity race, legacy data        | Register, ticket                      |
| 5     | Scan/manual check-in, task-gated scan, attendance view                  | Duplicate scans, scan auth        | Scan, attendance                      |
| 6     | Final nav, dashboards, docs, full gate                                  | Stale docs/nav                    | Whole app                             |

---

## Phase 0 — Baseline and Migration Reconciliation

**Outcome:** The club-based work is isolated, the design doc is present, the applied A–C migration files are restored, and no database reset is needed.

### Task 0.1: Confirm branches and restore migration files

**Files:**

- Restore: `prisma/migrations/20261026090000_kasama_phase_a/migration.sql`
- Restore: `prisma/migrations/20261026100000_kasama_phase_b/migration.sql`
- Restore: `prisma/migrations/20261026120000_kasama_phase_c/migration.sql`
- Present: `docs/superpowers/specs/2026-10-25-kasama-model-design.md`

**Interfaces:**

- Produces: a repository whose migration folder contains the three already-applied A–C migrations.

- [ ] **Step 1: Confirm the club work is isolated.**

Run:

```bash
git branch --show-current
git log --oneline -1 wip/club-officer-positions-2026-10-25
git status --short
```

Expected: current branch is `feat/kasama-single-org`; `wip/club-officer-positions-2026-10-25` points at `525c5b3`; only preserved untracked docs/config are present.

- [ ] **Step 2: Restore only the applied migration files from the stash.**

Run:

```bash
git checkout 'stash@{0}^3' -- prisma/migrations/20261026090000_kasama_phase_a prisma/migrations/20261026100000_kasama_phase_b prisma/migrations/20261026120000_kasama_phase_c
git reset
```

Do not restore `src/`, `docs/adr/0009...`, or the old plan from the stash.

- [ ] **Step 3: Verify Prisma sees the applied history.**

Run:

```bash
pnpm prisma migrate status
```

Expected: the three A–C migrations appear under `prisma/migrations`; the database is up to date. If Prisma reports drift or asks for a reset, stop and report; do not reset.

- [ ] **Step 4: Regenerate the client against the current schema.**

Run:

```bash
pnpm prisma:generate
```

Expected: generated client succeeds. The schema will still be the old HEAD schema until Phase 1; that is expected.

---

## Phase 1 — De-club, Global President, People, Global Notifications

**Outcome:** No club behavior or club UI remains. Roles are `STUDENT | OFFICER | ADMIN | DEV`; the President is a global position on an Officer. People management is global. Notifications are campus-wide and in-app only. Existing events stay published.

**UI preservation:** Keep the current `/admin/users` table, modals, and CSS module. The route and nav label become `/admin/people` / “People”, but the table, toolbar, filters, row actions, and modal patterns stay the same. Remove the club column/filter/action and add the position control in the existing role modal or a small sibling modal built from `Modal` + `Form`.

### Task 1.1: Schema and global President invariant

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `src/features/users/mutations.ts`
- Modify: `src/features/users/queries.ts`
- Modify: `src/features/users/schemas.ts`
- Create: `src/features/users/mutations.test.ts`
- Create: `src/lib/security/president-invariant.integration.test.ts`
- Create: `vitest.integration.config.mts`
- Modify: `package.json` (`test:integration`)

**Interfaces:**

```ts
export interface OfficerPositionPayload {
  userId: string;
  officerPosition: OfficerPosition | null;
}
export async function setOfficerPosition(payload: OfficerPositionPayload): Promise<void>;
export async function updateUserRole(userId: string, role: Role): Promise<void>;
export async function setUserActive(userId: string, isActive: boolean): Promise<void>;
export async function countActiveAdmins(excludeUserId?: string): Promise<number>;
```

**Schema changes:**

- `Task`: remove `clubId`, `club`, `@@index([clubId, status])`; add `@@index([assignedById])`.
- `Club`: remove `tasks` relation; keep the legacy model and other relations.
- `User`: keep `clubId` as a legacy read-only column; add a short comment above it. Keep `officerPosition`.
- `PendingRoleAssignment`: keep `clubId` as legacy; code stops writing it.
- `Event`, `Notification`: keep `clubId` as legacy; code stops reading/writing it.
- Keep `NotificationAudience` for legacy rows.

**Behavior:**

- `setOfficerPosition` runs in one transaction: when setting `PRESIDENT`, clear any other user with `PRESIDENT`, then set the target. It does not require a club.
- `setUserActive(userId, false)` clears `officerPosition` in the same update.
- `updateUserRole` clears `officerPosition` when the new role is not `OFFICER`.
- `countActiveAdmins` counts active `ADMIN` only. `DEV` is a recovery account, not a second Admin.

- [ ] **Step 1: Write failing mutation tests.** Assert global replacement, deactivation clear, role-change clear, and no club query.
- [ ] **Step 2: Run `pnpm vitest run src/features/users/mutations.test.ts`; expect failure.**
- [ ] **Step 3: Update the schema and mutations; run `pnpm prisma format && pnpm prisma:generate`.**
- [ ] **Step 4: Add the database invariant test.** Two active Officers; raw second `PRESIDENT` update must fail with Prisma `P2002`; cleanup both. `describe.skipIf(!process.env.DATABASE_URL)`.
- [ ] **Step 5: Add `test:integration` to `package.json` and the integration Vitest project.**
- [ ] **Step 6: Run the unit and integration tests.** If `DATABASE_URL` is absent, the integration test skips.
- [ ] **Step 7: Run the Phase 1 gate.**

### Task 1.2: RBAC, session, and guards

**Files:**

- Modify: `src/lib/security/rbac.ts`
- Modify: `src/lib/security/rbac.test.ts`
- Modify: `src/lib/security/auth-guards.ts`
- Modify: `src/lib/security/auth-guards.test.ts`
- Modify: `src/types/next-auth.d.ts`
- Modify: `src/lib/infra/auth.ts`
- Create: `src/lib/infra/pending-user.ts`
- Create: `src/lib/infra/pending-user.test.ts`

**Interfaces:**

```ts
export type AccessLevel = "yes" | "no";
export type Permission =
  | "user.read"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "event.read_published"
  | "event.read_all"
  | "event.create"
  | "event.edit"
  | "event.submit"
  | "event.approve"
  | "event.cancel"
  | "registration.create"
  | "registration.cancel"
  | "registration.read_own"
  | "registration.read_event"
  | "attendance.scan"
  | "attendance.manual"
  | "attendance.view"
  | "task.create"
  | "task.read_own"
  | "task.read_assigned"
  | "task.read_all"
  | "task.update"
  | "task.update_status_own"
  | "task.delete"
  | "notification.read"
  | "notification.create"
  | "officer.assign_president";

export function can(role: Role | null | undefined, permission: Permission): boolean;
export function canWithPosition(
  role: Role | null | undefined,
  position: OfficerPosition | null | undefined,
  permission: Permission,
): boolean;
export function positionAllows(
  position: OfficerPosition | null | undefined,
  permission: Permission,
): boolean;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  officerPosition: OfficerPosition | null;
}
export async function requireAuth(): Promise<AuthenticatedUser>;
export async function requirePermission(...permissions: Permission[]): Promise<AuthenticatedUser>;
export async function requirePagePermission(
  ...permissions: Permission[]
): Promise<AuthenticatedUser>;
```

**Behavior:**

- Remove `own_club`, all `club.*` permissions, `notificationVisibility`, `requireClubPermission`, and `requirePageClubPermission`.
- Matrix follows design §6. `DEV` is `"yes"` on every row.
- Plain Officer: the matrix grants `event.read_all`, `attendance.scan`/`manual`, `attendance.view`, `task.read_own`, `task.update_status_own`, `notification.read`, and `notification.create`. The scan/manual matrix cell is only a coarse “may scan” gate; `requireScanAccess` must still require a matching open `ATTENDANCE` task for this event. `attendance.view` is scoped to events with any task.
- President: plain Officer plus `event.create`, `event.edit`, `event.submit`, `event.cancel`, `task.create`, `task.read_assigned`, `task.update`, `task.delete`, `attendance.scan`/`manual` any event, `attendance.view` all events.
- Remove `clubId` from `AuthenticatedUser`, `next-auth.d.ts`, and the JWT/session. Keep `officerPosition` refreshed from the database in the JWT callback.
- `applyPendingAssignment(email, assignment)` creates the user and deletes the pending row in one transaction; if the assignment is `PRESIDENT`, it clears the previous President in the same transaction. The sign-in callback uses it instead of separate create/delete calls.
- No self role change: `updateUserRoleAction` rejects `actor.id === userId` with a conflict envelope.
- Last-admin guard: demoting or deactivating an active `ADMIN` is refused when `countActiveAdmins(target.id) === 0`. `DEV` does not count.
- `setUserActiveAction` still allows self-deactivation only if the last-admin guard passes.

- [ ] **Step 1: Rewrite `rbac.test.ts` as a full role × permission table; assert `DEV` is allowed, `own_club` is gone, and plain Officer vs President differ.**
- [ ] **Step 2: Rewrite `auth-guards.test.ts` without club cases; add position-refresh and stale-token cases.**
- [ ] **Step 3: Write `pending-user.test.ts` for the transactional President replacement.**
- [ ] **Step 4: Implement the matrix, guards, JWT/session, and pending helper.**
- [ ] **Step 5: Run `pnpm vitest run src/lib/security src/lib/infra/pending-user.test.ts`.**

### Task 1.3: People page without clubs

**Files:**

- Modify: `src/features/users/queries.ts`
- Modify: `src/features/users/actions.ts`
- Modify: `src/features/users/schemas.ts`
- Modify: `src/features/users/components/UsersManagement/UsersManagement.tsx`
- Modify: `src/features/users/components/AddUserModal/AddUserModal.tsx`
- Modify: `src/features/users/components/EditRoleModal/EditRoleModal.tsx`
- Delete: `src/features/users/components/AssignClubModal/**`
- Create: `src/app/(app)/admin/people/page.tsx`
- Delete: `src/app/(app)/admin/users/page.tsx`
- Modify: `src/features/users/schemas.test.ts`

**Interfaces:**

```ts
export interface UserManagementRow {
  kind: "user" | "pending";
  id: string;
  name: string | null;
  email: string;
  role: Role;
  officerPosition: OfficerPosition | null;
  isActive: boolean | null;
  createdAt: Date;
}
export async function getUserManagementPage(
  query: UserManagementPageQuery,
): Promise<UserManagementPage>;
export async function getUserById(userId: string): Promise<UserAuthorization | null>;
```

**Behavior:**

- Remove `clubId`, `clubName`, `clubShortName`, club filters, club column, `setUserClub`, `SetUserClubSchema`, `setUserClubAction`, and club checks in `AddPendingUserSchema`.
- `AddPendingUserSchema` accepts `officerPosition` only when `role === OFFICER`; no club requirement.
- `setOfficerPositionAction` requires `officer.assign_president`, target must be an active `OFFICER`, no club check.
- `addPendingUserAction` passes `officerPosition` and no `clubId`; still sends the invitation email (invitation email is not the notification-email change).
- People page shows the existing table; the Role column renders “Officer · President” when set. Add a small “No President appointed” status line above the table using existing `StatusBadge`/`Content`; do not redesign the table.
- Add/Edit modals: remove club field/action; add a President toggle/select when role is Officer. Use the existing `Select`/`Checkbox` patterns.
- Disable role editing for the current user; show the existing tooltip copy.

- [ ] **Step 1: Update schema tests for no-club and position rules.**
- [ ] **Step 2: Update queries/actions and the table/modals.**
- [ ] **Step 3: Move the route to `/admin/people` and update the page import; keep the component and CSS module.**
- [ ] **Step 4: Run `pnpm vitest run src/features/users` and the Phase 1 gate.**

### Task 1.4: Remove club surfaces, de-club events/notifications/seed/previews

**Files:**

- Delete: `src/features/clubs/**`
- Delete: `src/app/(app)/admin/clubs/**`
- Delete: `src/app/dev/previews/(shell)/clubs/**`
- Delete: `src/features/clubs/components/ClubLabel/**`
- Delete: `src/stories/ClubLabel.stories.tsx`
- Modify: `src/components/layout/Sidebar/Sidebar.tsx`
- Modify: `src/components/layout/Header/Header.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/features/events/types.ts`, `initial-events.ts`, `event-data.ts`, `queries.ts`, `components/EventsBrowser/EventsBrowser.tsx`, `components/EventDetailView/EventDetailView.tsx`, `components/EventTicket/EventTicket.tsx`
- Modify: `src/features/notifications/scope.ts`, `queries.ts`, `schemas.ts`, `actions.ts`, `mutations.ts`, `components/SendNotificationModal/SendNotificationModal.tsx`, `components/NotificationCard/NotificationCard.tsx`, `components/NotificationDetail/NotificationDetail.tsx`
- Modify: `prisma/seed.ts`
- Modify: `src/app/dev/previews/_data/preview-*.ts`
- Modify: `src/app/dev/previews/_data/preview-data.test.ts`
- Modify: `src/features/notifications/*.test.ts`
- Create: `docs/adr/0009-kasama-single-organization.md`
- Modify: `documentation/RBAC.md`, `AUTH-AND-ACCESS.md`, `DATA-MODEL.md`, `ARCHITECTURE.md`, `NOTIFICATIONS.md`, `OVERVIEW.md`, `ROADMAP.md`, `GLOSSARY.md`, `README.md`
- Modify: `docs/MVP-SPEC.md`, `docs/DECISIONS.md`, `docs/adr/0007-simplified-roles-and-approval.md`

**Behavior:**

- No `club.read` nav item, no Manage Clubs page, no club column/filter/action, no `ClubLabel` usage, no club preview/story.
- Events: remove `host: "organization" | "club"`, `clubName`, and the host filter. `organizer` is “KASAMA” or the creator name; keep the current card/detail layout.
- Notifications: `NotificationCreatePayload` is `{ title, body, createdById }`; write `audience: ALL`, `clubId: null`; read all notifications; no club selector; no email call. Keep `sendEmail` helper untouched.
- Seed: no club creation, no club membership, no club events, no club notifications, no pending club assignment. Keep the existing event/user rows and do not overwrite legacy `Event.clubId` or `Notification.clubId`; new seed rows write `clubId: null`. Do not delete legacy rows or clubs.
- ADR-0009 records the single-organization model, global President, one-step approval, and the club cleanup as a future separate step. Mark the club-scoped/multi-step parts of ADR-0007 as superseded.

- [ ] **Step 1: Delete club code and references; run `pnpm grep`/`rg` to confirm no `club` imports remain under `src/` except legacy type fields and docs.**
- [ ] **Step 2: De-club event/notification code and seed.**
- [ ] **Step 3: Update previews/tests/docs/ADR.**
- [ ] **Step 4: Run `pnpm format && pnpm lint && tsc --noEmit && pnpm test && pnpm build`.**
- [ ] **Step 5: Click through:** People (no club column; appoint/replace/clear President), Events (no club filter/host tag), Notifications (no club selector/label), Sidebar (no Manage Clubs). Stop and report.

---

## Phase 2 — Tasks

**Outcome:** The President assigns tasks to Officers; Officers see and move their own tasks; Admin monitors and edits all tasks. Tasks use the existing `Event` rows and do not require the Phase 3 event workflow.

**UI preservation:** The new `/tasks` page uses `ServerDataTable`, `Modal`, `Form`, `Select`, `DatePicker`, `TimeField`, and `StatusBadge`. The Officer dashboard adds a task card using the existing dashboard card layout. No new visual language.

### Task 2.1: Task schemas and data layer

**Files:**

- Rewrite: `src/features/tasks/schemas.ts`
- Create: `src/features/tasks/queries.ts`
- Create: `src/features/tasks/mutations.ts`
- Create: `src/features/tasks/actions.ts`
- Create: `src/features/tasks/schemas.test.ts`
- Create: `src/features/tasks/queries.test.ts`
- Create: `src/features/tasks/mutations.test.ts`
- Create: `src/features/tasks/actions.test.ts`

**Interfaces:**

```ts
export const CreateTaskSchema = z.object({
  eventId: cuidSchema.nullable().default(null),
  type: z.enum([TaskType.ATTENDANCE, TaskType.GENERAL]),
  assigneeId: cuidSchema,
  dueAt: z.coerce.date().nullable().default(null),
}).superRefine(...); // ATTENDANCE needs eventId + dueAt

export interface TaskRow {
  id: string; type: TaskType; status: TaskStatus;
  eventId: string | null; eventTitle: string | null;
  assigneeId: string; assigneeName: string;
  assignedById: string; assignedByName: string;
  dueAt: Date | null; createdAt: Date;
}
export interface TaskPageQuery {
  search?: string; cursor?: string; pageSize?: number;
  type?: TaskType[]; status?: TaskStatus[]; assigneeId?: string;
}
export async function getTaskPage(query: TaskPageQuery): Promise<CursorPage<TaskRow>>;
export async function getMyTasks(assigneeId: string): Promise<TaskRow[]>;
export async function getTaskById(taskId: string): Promise<TaskRow | null>;
export async function getOfficerOptions(): Promise<{ id: string; name: string; email: string }[]>;
export async function getTaskEventOptions(): Promise<EventOption[]>;

export interface TaskCreatePayload {
  eventId: string | null; type: TaskType; assigneeId: string; dueAt: Date | null;
}
export async function createTask(payload: TaskCreatePayload & { assignedById: string }): Promise<Task>;
export async function updateTaskAssignee(payload: { taskId: string; assigneeId: string }): Promise<void>;
export async function updateTaskStatus(payload: { taskId: string; actorId: string; status: TaskStatus }): Promise<void>;
export async function deleteTask(taskId: string): Promise<void>;
```

**Behavior:**

- Assignee must be an active `OFFICER`.
- `ATTENDANCE` requires an event and due date; `GENERAL` may have either.
- President creates/reassigns/deletes tasks they assigned. Admin may edit any task.
- Assignee moves `ASSIGNED → IN_PROGRESS → DONE` only; no backward moves. Admin may set forward states.
- Task scope: Admin all; President tasks they assigned plus their own assigned tasks; plain Officer only their own.
- Demotion/deactivation does not delete tasks.

- [ ] **Step 1: Write schema tests for ATTENDANCE/GENERAL requirements.**
- [ ] **Step 2: Write mutation tests for forward-only status, assignee-only status, President scope, Admin scope, and active-Officer assignee.**
- [ ] **Step 3: Write action tests for guards and scope.**
- [ ] **Step 4: Implement schemas/queries/mutations/actions.**
- [ ] **Step 5: Run `pnpm vitest run src/features/tasks`.**

### Task 2.2: Tasks UI and dashboard

**Files:**

- Create: `src/app/(app)/tasks/page.tsx`
- Create: `src/features/tasks/components/TaskFormModal/TaskFormModal.tsx`
- Create: `src/features/tasks/components/TaskFormModal/TaskFormModal.module.css`
- Create: `src/features/tasks/components/TaskTable/TaskTable.tsx`
- Create: `src/features/tasks/components/TaskTable/TaskTable.module.css`
- Create: `src/features/tasks/components/TaskCard/TaskCard.tsx`
- Create: `src/features/tasks/components/TaskCard/TaskCard.module.css`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/layout/Sidebar/Sidebar.tsx`
- Modify: `src/components/layout/Header/Header.tsx`

**Behavior:**

- `/tasks`: President/Admin only. President sees a “New task” button and tasks they assigned/own; Admin sees all tasks. Plain Officer uses the dashboard task card, not `/tasks`.
- `TaskFormModal`: type, event (optional for GENERAL), assignee (active Officers), due date. Use the existing `DatePicker` + `TimeField`.
- `TaskTable`: `ServerDataTable` with type/status/assignee filters for President/Admin; row actions for reassign/delete/status.
- `TaskCard`: dashboard card for the assignee’s open tasks and next due date.
- Sidebar “Tasks” item for President/Admin only. Use `canWithPosition`.
- No changes to the dashboard’s existing visual hierarchy; add the task card in the existing content area.

- [ ] **Step 1: Build the task page and form using existing primitives.**
- [ ] **Step 2: Add the dashboard task card.**
- [ ] **Step 3: Add the conditional nav item.**
- [ ] **Step 4: Run the Phase 2 gate.**
- [ ] **Step 5: Click through:** Admin opens People and appoints an Officer; President opens Tasks, assigns a GENERAL task and an ATTENDANCE task; Officer sees both on the dashboard and moves one to IN_PROGRESS/DONE; Admin sees all tasks. Stop and report.

---

## Phase 3 — Events, Mechanics, and Approval

**Outcome:** Real event data replaces the in-memory student event mock. Events have status, mechanics, program flow, requirements, optional capacity/deadline, and an approval trail. Admin approval publishes immediately. Students see only published events.

**UI preservation:** Keep `EventsBrowser`, `EventCard`, `EventDetailView`, `EventStatusPill`, `SeatAvailabilityCard`, `MyRegistrations`, and their CSS modules. Wire real data into them; add fields without changing the visual hierarchy. Use `StatusBadge` variants for new statuses.

### Task 3.1: Event schema and queries

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `src/features/events/queries.ts`
- Modify: `src/features/events/types.ts`
- Delete/replace: `src/features/events/initial-events.ts`, `event-data.ts`, `event-data.test.ts`
- Create: `src/features/events/schemas.ts`
- Create: `src/features/events/queries.test.ts`
- Modify: `src/features/events/components/EventsBrowser/EventsBrowser.tsx`
- Modify: `src/features/events/components/EventDetailView/EventDetailView.tsx`
- Modify: `src/features/events/components/EventStatusPill/EventStatusPill.tsx`
- Modify: `src/app/(app)/events/page.tsx`
- Modify: `src/app/(app)/events/[eventId]/page.tsx`

**Interfaces:**

```ts
export type EventStatus =
  "DRAFT" | "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" | "PUBLISHED" | "CANCELLED";
export interface EventRow {
  id: string;
  title: string;
  description: string | null;
  venue: string;
  startAt: Date;
  endAt: Date | null;
  status: EventStatus;
  mechanics: string | null;
  programFlow: string | null;
  requirements: string | null;
  capacity: number | null;
  registrationClosesAt: Date | null;
  publishedAt: Date | null;
  createdById: string;
  createdByName: string;
}
export async function getPublishedEventPage(query: PageQuery): Promise<CursorPage<EventRow>>;
export async function getStaffEventPage(query: PageQuery): Promise<CursorPage<EventRow>>;
export async function getEventById(eventId: string): Promise<EventRow | null>;
export interface EventApprovalRow {
  id: string;
  actorId: string;
  actorName: string;
  action: EventApprovalAction;
  fromStatus: EventStatus;
  toStatus: EventStatus;
  comment: string | null;
  createdAt: Date;
}
export async function getEventApprovalTrail(eventId: string): Promise<EventApprovalRow[]>;
```

**Behavior:**

- Add `EventStatus`, `EventApprovalAction`, `EventApproval`, and the Event fields from the design. The DB already has them; do not re-run the migration.
- Remove `Event.clubId` reads/writes from code; keep the schema field legacy.
- Student reads filter `status = PUBLISHED`; staff reads do not.
- A student opening a draft by direct URL gets `notFound()`, not `/access-denied`.
- Replace the mock `useEvents`/`useSyncExternalStore` with server-provided rows. Keep the current event card/detail layout; use `EventStatusPill` for the new statuses.
- Remove the `host` filter and club organizer split; show “KASAMA” or the creator name.

- [ ] **Step 1: Write query tests for published-only student reads, staff all-status reads, and draft direct URL.**
- [ ] **Step 2: Update schema/types/queries and replace the mock data source.**
- [ ] **Step 3: Wire the existing EventsBrowser/EventCard/EventDetailView to the real rows.**
- [ ] **Step 4: Run the Phase 3 query tests and `tsc --noEmit`.**

### Task 3.2: Event mutations, approval actions, and UI

**Files:**

- Create: `src/features/events/mutations.ts`
- Create: `src/features/events/actions.ts`
- Create: `src/features/events/mutations.test.ts`
- Create: `src/features/events/actions.test.ts`
- Create: `src/app/(app)/events/new/page.tsx`
- Create: `src/app/(app)/events/[eventId]/edit/page.tsx`
- Create: `src/features/events/components/EventForm/EventForm.tsx`
- Create: `src/features/events/components/EventForm/EventForm.module.css`
- Create: `src/app/(app)/admin/approvals/page.tsx`
- Create: `src/features/events/components/ApprovalsQueue/ApprovalsQueue.tsx`
- Create: `src/features/events/components/ApprovalsQueue/ApprovalsQueue.module.css`
- Modify: `src/app/(app)/events/[eventId]/page.tsx`
- Modify: `src/components/layout/Sidebar/Sidebar.tsx`
- Modify: `src/components/layout/Header/Header.tsx`

**Interfaces:**

```ts
export const CreateEventSchema = z.object({
  title: requiredText(160, "Title"),
  description: optionalText(2000, "Description"),
  venue: requiredText(160, "Venue"),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable(),
  mechanics: optionalText(5000, "Mechanics"),
  programFlow: optionalText(5000, "Program flow"),
  requirements: optionalText(5000, "Requirements"),
  capacity: z.number().int().positive().nullable(),
  registrationClosesAt: z.coerce.date().nullable(),
});
export const SubmitEventSchema = z.object({ eventId: cuidSchema });
export const ApproveEventSchema = z.object({
  eventId: cuidSchema,
  comment: optionalText(1000, "Comment"),
});
export const RequestRevisionSchema = z.object({
  eventId: cuidSchema,
  comment: requiredText(1000, "Comment"),
});
export const CancelEventSchema = z.object({ eventId: cuidSchema });
export async function createEventAction(
  payload: CreateEventPayload,
): Promise<ActionDataResponse<{ eventId: string }>>;
export async function updateEventAction(payload: UpdateEventPayload): Promise<ActionStatusResponse>;
export async function submitEventAction(payload: SubmitEventPayload): Promise<ActionStatusResponse>;
export async function approveEventAction(
  payload: ApproveEventPayload,
): Promise<ActionStatusResponse>;
export async function requestRevisionAction(
  payload: RequestRevisionPayload,
): Promise<ActionStatusResponse>;
export async function cancelEventAction(payload: CancelEventPayload): Promise<ActionStatusResponse>;
```

**Behavior:**

- Create/edit allowed for President/Admin; edits only in `DRAFT`/`REVISION_REQUESTED`.
- Submit requires non-empty `mechanics`, `programFlow`, `requirements` after trimming; writes a `SUBMITTED` trail row.
- Approve is Admin-only; `SUBMITTED → PUBLISHED` in one transition; writes `APPROVED` with `fromStatus = SUBMITTED`, `toStatus = PUBLISHED`; sets `publishedAt`.
- Request revision is Admin-only; comment required; writes a trail row; clears `publishedAt`.
- Cancel is President/Admin; writes a `CANCELLED` trail row; hides from students.
- Admin self-approval is allowed and logged.
- Event form uses existing `Form`, `TextField` (with `isTextArea` for long fields), `DatePicker`, `TimeField`, and `Select` patterns. Save draft and Submit for approval.
- Approvals queue uses existing `ServerDataTable`/cards; approve publishes immediately.
- Staff event detail shows the trail in order; legacy events show “No approval record (pre-workflow)”.

- [ ] **Step 1: Write approval mutation tests for mechanics, transitions, trail, self-approval, revision comment, and edit restrictions.**
- [ ] **Step 2: Write action tests for guards and envelopes.**
- [ ] **Step 3: Implement mutations/actions.**
- [ ] **Step 4: Build the event form and approvals queue using existing primitives.**
- [ ] **Step 5: Run the Phase 3 gate.**
- [ ] **Step 6: Click through:** President creates a draft with missing mechanics; Submit is blocked; fill mechanics and submit; Admin requests revision; President edits/resubmits; Admin approves; student sees it immediately; cancel hides it. Stop and report.

---

## Phase 4 — Registration with Opaque QR Reference

**Outcome:** A Student registers for a published event, receives an opaque reference, sees it as QR and typed text, can cancel and re-register with the same reference, and capacity/deadline are enforced server-side.

**UI preservation:** Keep `RegistrationModal`, `RegistrationDetails`, `EventTicket`, `MyRegistrations`, `SeatAvailabilityCard`, and their CSS modules. Add the QR image inside the existing ticket/reference block; do not redesign the ticket.

### Task 4.1: Registration schema, reference, queries, mutations

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `src/features/registrations/reference.ts`
- Create: `src/features/registrations/reference.test.ts`
- Create: `src/features/registrations/schemas.ts`
- Create: `src/features/registrations/queries.ts`
- Create: `src/features/registrations/mutations.ts`
- Create: `src/features/registrations/actions.ts`
- Create: `src/features/registrations/queries.test.ts`
- Create: `src/features/registrations/mutations.test.ts`
- Create: `src/features/registrations/actions.test.ts`
- Create: `prisma/backfill-registrations.ts`

**Interfaces:**

```ts
export const RegisterForEventSchema = z.object({
  eventId: cuidSchema,
  studentNumber: optionalText(30, "Student number"),
});
export const CancelRegistrationSchema = z.object({ eventId: cuidSchema });
export const RegistrationReferenceSchema = z
  .string()
  .regex(/^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){2}$/);

export interface EventAvailability {
  seatsLeft: number | null;
  isFull: boolean;
  isClosed: boolean;
  closesAt: Date | null;
}
export interface RegistrationRow {
  id: string;
  eventId: string;
  eventTitle: string;
  reference: string;
  status: RegistrationStatus;
  createdAt: Date;
  cancelledAt: Date | null;
}
export interface RegistrationCreatePayload {
  eventId: string;
  studentId: string;
  studentNumber?: string;
}
export interface RegistrationCancelPayload {
  eventId: string;
  studentId: string;
}
export type RegistrationWriteResult =
  | { ok: true; registration: Registration }
  | {
      ok: false;
      reason: "not_found" | "not_published" | "closed" | "full" | "not_student" | "conflict";
    };

export function generateRegistrationReference(): string;
export async function getEventAvailability(eventId: string, now?: Date): Promise<EventAvailability>;
export async function getStudentRegistrations(studentId: string): Promise<RegistrationRow[]>;
export async function getRegistrationByReference(
  reference: string,
): Promise<RegistrationRow | null>;
export async function createRegistration(
  payload: RegistrationCreatePayload,
): Promise<RegistrationWriteResult>;
export async function cancelRegistration(
  payload: RegistrationCancelPayload,
): Promise<RegistrationWriteResult>;
```

**Behavior:**

- `Registration` uses `studentId`, `reference`, `status`, `createdAt`, `cancelledAt`; `@@unique([eventId, studentId])`; `@@index([studentId, status])`.
- `User.studentNumber` is optional, unique, trimmed, 1–30 chars, uppercase.
- Reference is Crockford base32, grouped `XXXX-XXXX-XXXX`, at least 60 bits, opaque.
- Student-only; registration open only while `PUBLISHED`, before start, before deadline, and with a free seat. `capacity = null` unlimited; `registrationClosesAt = null` until start.
- Capacity check runs in a `Serializable` transaction counting `REGISTERED` rows; retry once on serialization conflict; second conflict returns a retryable envelope. No seat counter.
- Cancel sets `CANCELLED`, preserves the row/reference; re-register reuses the row/reference and rechecks deadline/capacity. Cancel refused after start or after a check-in.
- Backfill the 7 legacy attendance rows into `Registration` with generated references; idempotent. Do not delete legacy `EventRegistration` rows.

- [ ] **Step 1: Write reference tests for format, alphabet, length, and uniqueness over many calls.**
- [ ] **Step 2: Write availability/mutation tests for capacity, deadline, cancel-free-seat, re-register same reference, duplicate, student-only, and serialization retry.**
- [ ] **Step 3: Implement schema/reference/queries/mutations/actions/backfill.**
- [ ] **Step 4: Run `pnpm vitest run src/features/registrations` and the Phase 4 gate.**

### Task 4.2: Student registration UI and QR ticket

**Files:**

- Modify: `src/features/events/components/EventDetailView/EventDetailView.tsx`
- Modify: `src/features/events/components/RegistrationModal/RegistrationModal.tsx`
- Modify: `src/features/events/components/RegistrationDetails/RegistrationDetails.tsx`
- Modify: `src/features/events/components/EventTicket/EventTicket.tsx`
- Modify: `src/features/events/components/MyRegistrations/MyRegistrations.tsx`
- Modify: `src/features/events/components/SeatAvailabilityCard/SeatAvailabilityCard.tsx`
- Modify: `src/app/(app)/registrations/page.tsx`
- Modify: `src/app/(app)/registrations/[eventId]/ticket/page.tsx`

**Behavior:**

- Event detail shows seats left / `Full` / `Registration closed` from the real availability read; register/cancel use Server Actions.
- Ticket shows the opaque reference as typed text and a QR code generated with `qrcode` (data URL or canvas). The QR payload is the reference.
- Registration history groups upcoming/past/cancelled from real rows; a cancelled registration keeps the same reference.
- Keep the current ticket/registration visual layout; add QR inside the existing reference block.

- [ ] **Step 1: Wire the existing components to the real actions/queries.**
- [ ] **Step 2: Add QR rendering using `qrcode`.**
- [ ] **Step 3: Run the Phase 4 gate.**
- [ ] **Step 4: Click through:** Student registers; sees seats decrease and a QR/reference; cancels; re-registers and sees the same reference; fill capacity or use a past deadline and see the correct closed/full state. Stop and report.

---

## Phase 5 — Scanning, Manual Fallback, and Attendance View

**Outcome:** President/Admin scan any published event; an Officer scans only an event with their open `ATTENDANCE` task. Scans record actor, time, and method. Duplicates return a result, not an error. Walk-ins are counted separately. Attendance monitoring shows registered/checked in/checked out/not attended/walk-ins.

**UI preservation:** Use the existing `Content`, `Button`, `TextField`, `RadioGroup`/`Tabs`, `StatusBadge`, `NoticePage`, `ServerDataTable`, and CSS-module patterns. The scan screen is a focused form, not a new dashboard design.

### Task 5.1: Attendance schema and migration

**Files:**

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261026140000_kasama_phase_d/migration.sql`
- Modify: `prisma/seed.ts`

**Schema:**

```prisma
enum AttendanceMethod { QR MANUAL_CODE MANUAL_ID MANUAL_SIGNIN LEGACY }

model Attendance {
  id String @id @default(cuid())
  eventId String
  event Event @relation(fields: [eventId], references: [id])
  studentId String
  student User @relation(fields: [studentId], references: [id])
  checkedInAt DateTime @default(now())
  checkedInById String?
  checkedInBy User? @relation("CheckInRecorder", fields: [checkedInById], references: [id])
  checkInMethod AttendanceMethod?
  checkedOutAt DateTime?
  checkedOutById String?
  checkedOutBy User? @relation("CheckOutRecorder", fields: [checkedOutById], references: [id])
  checkOutMethod AttendanceMethod?
  photoUrl String?
  @@unique([eventId, studentId])
  @@index([studentId, checkedInAt])
}
```

**Migration:** additive only; create the enum, make `photoUrl` nullable, add columns/FKs and the `studentId, checkedInAt` index, and mark existing rows `LEGACY` with null actors. The `@@unique([eventId, studentId])` already exists in the database; do not re-create it. Add the `User` relation fields `attendanceCheckIns` and `attendanceCheckOuts` for the two recorder relations. Do not drop anything. Apply with `pnpm prisma migrate deploy`; if Prisma reports drift, stop and report; do not reset.

- [ ] **Step 1: Add the schema and migration SQL.**
- [ ] **Step 2: Run `pnpm prisma migrate deploy` and `pnpm prisma:generate`.**
- [ ] **Step 3: Confirm the 7 legacy rows are `LEGACY` with null actors.**

### Task 5.2: Scan and attendance guards

**Files:**

- Modify: `src/lib/security/auth-guards.ts`
- Modify: `src/lib/security/auth-guards.test.ts`

**Interfaces:**

```ts
export async function requireScanAccess(eventId: string): Promise<AuthenticatedUser>;
export async function requirePageScanAccess(eventId: string): Promise<AuthenticatedUser>;
export async function requireScanLandingAccess(): Promise<AuthenticatedUser>;
export async function requireEventAttendanceView(eventId: string): Promise<AuthenticatedUser>;
```

**Behavior:**

- `requireScanAccess`: `requireAuth`, re-read `{ role, isActive, officerPosition }` from DB, refuse inactive; Admin/Dev and President pass; plain Officer passes only with `task.findFirst({ assigneeId, eventId, type: ATTENDANCE, status: { not: DONE } })`; everyone else `ForbiddenError`; event must exist and be `PUBLISHED`.
- `requireScanLandingAccess`: Admin/Dev/President pass; plain Officer passes only with at least one open attendance task; otherwise `ForbiddenError`.
- `requireEventAttendanceView`: Admin/Dev/President pass; plain Officer passes with any task on the event (open or done).
- Page variants catch and redirect to `/sign-in`, `/deactivated`, or `/access-denied?reason=scan`.

- [ ] **Step 1: Write guard tests for Officer with/without task, DONE task, wrong event, President, Admin, Student, inactive, stale token.**
- [ ] **Step 2: Implement and run `pnpm vitest run src/lib/security/auth-guards.test.ts`.**

### Task 5.3: Attendance queries, mutations, actions

**Files:**

- Create: `src/features/attendance/schemas.ts`
- Create: `src/features/attendance/queries.ts`
- Create: `src/features/attendance/mutations.ts`
- Create: `src/features/attendance/actions.ts`
- Create: `src/features/attendance/queries.test.ts`
- Create: `src/features/attendance/mutations.test.ts`
- Create: `src/features/attendance/actions.test.ts`

**Interfaces:**

```ts
export const ScanActionSchema = z.object({
  eventId: cuidSchema,
  reference: requiredText(32, "Reference"),
  direction: z.enum(["in", "out"]),
});
export const ManualCheckInSchema = z.object({
  eventId: cuidSchema,
  identifier: requiredText(160, "Reference, student number, or email"),
  direction: z.enum(["in", "out"]),
});

export type AttendanceWriteResult =
  | { ok: true; attendance: Attendance; already?: "checked_in" | "checked_out" }
  | {
      ok: false;
      reason:
        | "not_found"
        | "not_published"
        | "not_checked_in"
        | "not_registered"
        | "wrong_event"
        | "cancelled";
    };
export interface AttendanceRow {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string | null;
  reference: string | null;
  registrationStatus: RegistrationStatus | null;
  checkedInAt: Date;
  checkedInByName: string | null;
  checkInMethod: AttendanceMethod | null;
  checkedOutAt: Date | null;
  checkedOutByName: string | null;
  checkOutMethod: AttendanceMethod | null;
  walkIn: boolean;
}
export interface AttendancePageQuery {
  search?: string;
  cursor?: string;
  pageSize?: number;
  status?: "all" | "checked_in" | "checked_out" | "not_attended" | "walk_in";
}
export interface AttendanceHistoryRow {
  id: string;
  eventId: string;
  eventTitle: string;
  checkedInAt: Date;
  checkedOutAt: Date | null;
  checkInMethod: AttendanceMethod | null;
}
export type EventOption = Pick<Event, "id" | "title" | "startAt">;

export async function checkIn(payload: {
  eventId: string;
  studentId: string;
  actorId: string;
  method: AttendanceMethod;
}): Promise<AttendanceWriteResult>;
export async function checkOut(payload: {
  eventId: string;
  studentId: string;
  actorId: string;
  method: AttendanceMethod;
}): Promise<AttendanceWriteResult>;
export async function getEventAttendancePage(
  eventId: string,
  query: AttendancePageQuery,
): Promise<CursorPage<AttendanceRow>>;
export async function getEventAttendanceSummary(eventId: string): Promise<{
  registered: number;
  checkedIn: number;
  checkedOut: number;
  notAttended: number;
  walkIns: number;
}>;
export async function getStudentAttendancePage(
  studentId: string,
  query: PageQuery,
): Promise<CursorPage<AttendanceHistoryRow>>;
export async function getScanEventOptions(actor: AuthenticatedUser): Promise<EventOption[]>;
```

**Behavior:**

- Check-in creates the row; duplicate returns `ok: true, already: "checked_in"`. Check-out updates; duplicate returns `ok: true, already: "checked_out"`. Check-out before check-in returns `not_checked_in`.
- A cancelled registration cannot check in; a reference for another event returns `wrong_event`; unknown returns `not_found`.
- Manual lookup accepts reference, student number, or email. A reference that matches no registration returns `not_found`. A student number or email that matches a user with no registration creates a walk-in attendance row with `MANUAL_SIGNIN`; count walk-ins separately.
- Record `checkedInById`/`checkedOutById` from the verified session, never from payload. Method is `QR`, `MANUAL_CODE`, `MANUAL_ID`, or `MANUAL_SIGNIN`.
- Scan/manual actions call `requireScanAccess(eventId)`; monitoring calls `requireEventAttendanceView(eventId)`; student history uses `registration.read_own`.
- Result copy: “Checked in”, “Already checked in at {time} by {name}”, “Checked out”, “Already checked out at {time} by {name}”, “Not registered”, “This code belongs to another event”.

- [ ] **Step 1: Write mutation tests for duplicate in/out, checkout-before-checkin, wrong event, cancelled, walk-in.**
- [ ] **Step 2: Write action tests for scan guard, manual reference/student number/email, unknown, actor/method recording.**
- [ ] **Step 3: Write query tests for summary counts and not-attended/walk-in rows.**
- [ ] **Step 4: Implement and run `pnpm vitest run src/features/attendance`.**

### Task 5.4: Scan UI, attendance monitoring, and navigation

**Files:**

- Create: `src/app/(app)/scan/page.tsx`
- Create: `src/app/(app)/events/[eventId]/scan/page.tsx`
- Create: `src/app/(app)/events/[eventId]/attendance/page.tsx`
- Create: `src/features/attendance/components/ScanConsole/ScanConsole.tsx`
- Create: `src/features/attendance/components/ScanConsole/ScanConsole.module.css`
- Create: `src/features/attendance/components/ManualCheckIn/ManualCheckIn.tsx`
- Create: `src/features/attendance/components/ManualCheckIn/ManualCheckIn.module.css`
- Create: `src/features/attendance/components/AttendanceMonitoring/AttendanceMonitoring.tsx`
- Create: `src/features/attendance/components/AttendanceMonitoring/AttendanceMonitoring.module.css`
- Modify: `src/app/(app)/attendance/page.tsx`
- Modify: `src/features/events/components/AttendanceHistory/AttendanceHistory.tsx`
- Modify: `src/components/layout/Sidebar/Sidebar.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/access-denied/page.tsx`
- Modify: `src/components/layout/Header/Header.tsx`

**Behavior:**

- `/scan`: `requireScanLandingAccess`; list events from `getScanEventOptions`; each links to `/events/[eventId]/scan`.
- `/events/[eventId]/scan`: `requirePageScanAccess`; `ScanConsole` with check-in/check-out toggle, autofocused reference input, Enter submits, clear after each scan, result banner, recent scans (last 5), manual fallback panel. Keyboard-wedge scanner and paste; no camera.
- `/events/[eventId]/attendance`: `requireEventAttendanceView`; summary cards and table (student, student number, registration, check-in/out time/method/actor, walk-in badge). Filters: status/search. No export button.
- `/attendance`: real student attendance history; keep the current `AttendanceHistory` visuals.
- Sidebar “Scan QR” only when `canScan` is true. `app/(app)/layout.tsx` computes a `canScan` flag server-side: Admin/Dev/President true; plain Officer true only with an open attendance task. Pass it to `Sidebar`.
- `/access-denied?reason=scan` shows “Scanning requires an open attendance task for this event” and a link to the dashboard. Other reasons keep the existing copy.
- No toast per scan; use the inline result banner. Use toast helpers only for unexpected failures.

- [ ] **Step 1: Build the scan landing and console with existing primitives.**
- [ ] **Step 2: Build the manual fallback and attendance monitoring.**
- [ ] **Step 3: Wire the student attendance history to real data.**
- [ ] **Step 4: Add the conditional nav and scanning-specific access-denied copy.**
- [ ] **Step 5: Run the Phase 5 gate.**
- [ ] **Step 6: Click through the required scenarios:** Officer with task scans; Officer without task is denied; Officer scans another event and is denied; second President/replacement; duplicate scans show “already”; Admin scan records Admin; Student opens `/scan` and lands on `/access-denied?reason=scan`. Stop and report.

---

## Phase 6 — Final Navigation, Dashboards, Docs, Full Gate

**Outcome:** The final nav and dashboards match the roles; docs and ADR reflect the shipped behavior; the full gate passes.

### Task 6.1: Final nav/dashboards/docs

**Files:**

- Modify: `src/components/layout/Sidebar/Sidebar.tsx`
- Modify: `src/components/layout/Header/Header.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `documentation/RBAC.md`, `AUTH-AND-ACCESS.md`, `DATA-MODEL.md`, `ARCHITECTURE.md`, `NOTIFICATIONS.md`, `OVERVIEW.md`, `ROADMAP.md`, `GLOSSARY.md`, `README.md`
- Modify: `docs/MVP-SPEC.md`, `docs/DECISIONS.md`
- Modify: `docs/adr/0009-kasama-single-organization.md`

**Behavior:**

- Sidebar order: Dashboard, Events, My Registrations, My Attendance, Scan QR (conditional), Tasks (President/Admin), Approvals (Admin), Notifications, People (Admin). No Manage Clubs.
- Header titles: People, Tasks, Approvals, Scan, Attendance.
- Student dashboard: notifications, upcoming registrations, attendance summary.
- Officer dashboard: my tasks, scan shortcut when open, attendance.
- President dashboard: tasks, scan, events.
- Admin dashboard: approvals count, all tasks, People, events.
- Docs match shipped behavior: no clubs, global President, one-step approval, capacity/deadline, QR scanning, task-gated scan, global notifications, no CSV, no notification email.
- ADR-0009 is the superseding record; ADR-0007 and MVP-SPEC point to it.

- [ ] **Step 1: Update the sidebar/header/dashboards.**
- [ ] **Step 2: Update docs and ADR.**
- [ ] **Step 3: Run the final gate:** `pnpm prisma format && pnpm prisma:generate && pnpm format && pnpm lint && tsc --noEmit && pnpm test && pnpm build`.
- [ ] **Step 4: Run `pnpm test:browser` if stories changed.**
- [ ] **Step 5: Click through every role:** Student (events/registration/ticket/attendance/notifications), Officer (tasks/scan/attendance), President (events/tasks/scan/attendance), Admin (people/approvals/tasks/scan/attendance/notifications). Stop and report.

---

## Execution Notes

- Do not commit. The user has not asked for commits; leave the branch dirty for review.
- After each task, run the smallest test file for that task. After each phase, run the full gate.
- If a migration needs a reset, stop. Never run `prisma migrate reset`; the local database has legacy club data and applied A–C migrations.
- If Prisma reports drift, stop and report the exact output. Do not delete or recreate data.
- If a Prisma mock does not typecheck, fix the query boundary rather than adding `as any`.
- Keep the current UI components and CSS modules. New screens may add CSS modules, but must use the existing tokens and patterns.
- If a required change would visibly restyle an existing page, stop and ask before proceeding.
- Keep the design doc as the source of truth. If implementation reveals a contradiction, stop and report it rather than guessing.
