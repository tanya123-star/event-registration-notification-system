# Role-Based Access Control (RBAC)

> This document mirrors the security policy in
> [`src/lib/security/rbac.ts`](../src/lib/security/rbac.ts). Edit the matrix and this file together. A cell is `YES`
> (granted) or `NO` (denied). Row scope (own task, assigned event) is enforced by the feature query or mutation, not by a
> matrix qualifier.

## Roles

> **Dev accounts** are temporary recovery accounts. Dev is pinned to **YES** on every row in code and is not listed in the
> tables below.

```
DEV - initial recovery account

ADMIN
  -> OFFICER (President | plain officer)
    -> STUDENT
```

### Officer position

`Role.OFFICER` is the login role. An officer may hold the global `PRESIDENT` position. Exactly one active officer is
President, enforced by the database partial unique index and by the transactional assignment mutation. A plain officer
has no position. Changing the role away from `OFFICER` or deactivating the account clears the position.

The Officer column below is the coarse gate. Position lists refine it: a President receives the event-lifecycle and
task-assignment permissions marked “President adds”; a plain officer receives only the base Officer permissions. Positions
never widen the Admin or Student columns.

---

## Capability Matrix

Capabilities are deny-by-default `entity.action` grants enforced by `requirePermission(...)`. Only implemented
capabilities are listed.

### User

| Action | Admin | Officer | Student |
| :----- | :---: | :-----: | :-----: |
| READ   |  YES  |   NO    |   NO    |
| CREATE |  YES  |   NO    |   NO    |
| UPDATE |  YES  |   NO    |   NO    |
| DELETE |  YES  |   NO    |   NO    |

### Event

> Students see published events. Officers may read all events for attendance work. The President adds the draft lifecycle;
> only Admins approve.

| Action         | Admin | Officer | Student |
| :------------- | :---: | :-----: | :-----: |
| READ_PUBLISHED |  YES  |   YES   |   YES   |
| READ_ALL       |  YES  |   YES   |   NO    |
| CREATE         |  YES  |   NO*   |   NO    |
| EDIT           |  YES  |   NO*   |   NO    |
| SUBMIT         |  YES  |   NO*   |   NO    |
| APPROVE        |  YES  |   NO    |   NO    |
| CANCEL         |  YES  |   NO*   |   NO    |

\* The President position adds `CREATE`, `EDIT`, `SUBMIT`, and `CANCEL`.

### Registration

| Action     | Admin | Officer | Student |
| :--------- | :---: | :-----: | :-----: |
| CREATE     |  NO   |   NO    |   YES   |
| CANCEL     |  NO   |   NO    |   YES   |
| READ_OWN   |  NO   |   NO    |   YES   |
| READ_EVENT |  YES  |   YES   |   NO    |

### Attendance

> Admins and the President may scan any published event. A plain officer may scan only an event for which they hold a
> matching `ATTENDANCE` task that is not `DONE`. The matrix cell is the coarse gate; the event guard re-checks the task in
> the database on every scan.

| Action | Admin | Officer | Student |
| :----- | :---: | :-----: | :-----: |
| SCAN   |  YES  |   YES   |   NO    |
| MANUAL |  YES  |   YES   |   NO    |
| VIEW   |  YES  |   YES   |   NO    |

### Task

> Admins manage every task. The President assigns, reassigns, and deletes tasks they created and sees tasks they assigned
> plus their own. A plain officer sees only their own tasks and moves them forward (`ASSIGNED → IN_PROGRESS → DONE`).

| Action            | Admin | Officer | Student |
| :---------------- | :---: | :-----: | :-----: |
| CREATE            |  YES  |   NO*   |   NO    |
| READ_OWN          |  YES  |   YES   |   NO    |
| READ_ASSIGNED     |  YES  |   NO*   |   NO    |
| READ_ALL          |  YES  |   NO    |   NO    |
| UPDATE            |  YES  |   NO*   |   NO    |
| UPDATE_STATUS_OWN |  YES  |   YES   |   NO    |
| DELETE            |  YES  |   NO*   |   NO    |

\* The President position adds `CREATE`, `READ_ASSIGNED`, `UPDATE`, and `DELETE`.

### Notification

> Notifications are campus-wide. Every role reads them; Officers and Admins create them. Legacy club-scoped rows remain in
> the database but are hidden from every feed.

| Action | Admin | Officer | Student |
| :----- | :---: | :-----: | :-----: |
| READ   |  YES  |   YES   |   YES   |
| CREATE |  YES  |   YES   |   NO    |

### Officer

> Only Admins appoint, replace, or remove the global President. A replacement clears the previous President and sets the
> new one in a single transaction.

| Action           | Admin | Officer | Student |
| :--------------- | :---: | :-----: | :-----: |
| ASSIGN_PRESIDENT |  YES  |   NO    |   NO    |

---

## Implementation Notes

- Every exported Server Action verifies the session and evaluates its permission(s) at the top of the execution flow via
  `requirePermission(...)` from `src/lib/security/auth-guards.ts`. The guard accepts one or more permissions and
  authorizes when the user holds **at least one**.
- Page-level Server Components use `requirePagePermission(...)`, which redirects to `/sign-in`, `/deactivated`, or
  `/access-denied` instead of throwing into the error boundary. Server Actions still use `requirePermission(...)` and
  return structured envelopes.
- `canWithPosition(...)` evaluates non-officers against the role matrix and officers against their position list. The
  session JWT refreshes `role`, `isActive`, and `officerPosition` from the database on every request, so a replaced
  President loses the position without signing out.
- Client-side checks (for example sidebar visibility) are presentation-only and never a security boundary. The server
  re-checks every request.
- `attendance.scan` and `attendance.manual` are not sufficient by themselves. The scan flow also requires a published
  event and, for a plain officer, a non-`DONE` `ATTENDANCE` task for that event. The task is re-read from the database on
  every scan.
- There is no club scoping, `own_club`, club guard, or Manage Clubs page. The `Club` table and legacy `clubId` columns are
  retained only until the separate cleanup migration is approved.
