# Overview

## One school organization, one working product name: KASAMA

The Event Registration & Notification System (KASAMA) is a single school organization's web application for publishing
events, registering students, checking them in with a QR code, and keeping everyone informed through campus-wide
announcements. There are no club scoping units; the system is one organization with people in four roles, one global
President, and an Admin-run event approval flow.

The foundations work end to end: identity and roles, invitations, the People page, notifications, and event approvals.
The active UI already covers the student-facing event browser, registration mock, ticket, and attendance history, plus
the later president/task/scan phases still have contract work ahead.

## Who uses it

There are four account roles. Three are part of the normal workflow; the fourth exists for setup and maintenance.

| Role        | Who they are                                     | What they can do today                                                                                                   |
| ----------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Student** | A regular member of the school community.        | Read announcements, browse events, register, and see their attendance history.                                           |
| **Officer** | A student leader, optionally the President.      | Do everything a student can, send notifications, work on events, and scan attendance on an assigned event.               |
| **Admin**   | School staff or a trusted administrator.         | Manage people, invitations, roles, the President, event approvals, all tasks (once implemented), and every notification. |
| **Dev**     | A temporary bootstrap account used during setup. | Full access. It cannot be invited and its role cannot be changed.                                                        |

Exactly one active officer holds the global **President** position, approved by an Admin. A plain officer has no position.
The President adds the event draft lifecycle and task assignment; both are progressively delivered through later phases.

Permissions are not a simple role hierarchy. Every capability is looked up in one central matrix, documented in
[RBAC.md](./RBAC.md). The officer position is the one refinement layered over the Officer column.

## What works today

### Sign-in and invitations

People sign in with Google; the application does not store passwords. School accounts use the `@acdeducation.com` or
`@acd.edu.ph` domain. New external Google accounts are accepted only when an administrator has invited that address and
approved external email.

There is no open registration form. A first-time user needs a school address, the configured developer email, or a
pending invitation. An invitation carries the role, optional officer position, and the external-access setting. A pending
President invitation replaces the sitting President in a single transaction when the person first signs in.

Access failures land on clear notice pages rather than generic errors: sign-in required, email domain not allowed,
account deactivated, access denied, or access changed after a role update. [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md)
covers the full flow.

### Notifications

Every signed-in user has a feed of campus-wide announcements. Opening one marks it read, the sidebar shows an unread
count, and the toolbar can mark everything read.

Officers and admins can compose a notification with a title and body and send it campus-wide. It appears in every
signed-in user's feed immediately. The composer does not attach events, schedule delivery, target individual users, or
send email yet. [NOTIFICATIONS.md](./NOTIFICATIONS.md) describes the behaviour and the deliberate email gap.

### People

Administrators have one **People** page with Officers, Students, Admins, and Pending invitations tabs. From there they
can invite someone, change a role, appoint or replace the President with the crown control, deactivate or reactivate
an account, cancel an invitation, or remove an Officer by demoting them to Student. Officers show a position pill
beside the role. A banner notes when no President has been appointed yet.

That area protects the system from locking itself out: the last active admin cannot be demoted or deactivated, the
developer role cannot be assigned through the normal editor, and no one may change their own role.

### Event approvals

Administrators have an **Approvals** queue of events submitted for review. Each card shows the event's mechanics,
program flow, requirements, venue, date, and who submitted it. **Approve** publishes the event immediately; **Request
revision** requires a written comment and sends the event back to its organizer. Every decision writes an approval trail
row with the acting administrator, the transition, the comment, and the time. Administrators may approve their own
events; that self-approval is recorded the same way. Workflow status pills cover Draft, Submitted, Revision requested,
Approved, Published, and Cancelled.

The queue is backed by the database. Creating, editing, and submitting events is the next phase; until then the student
event browser still uses staged data.

## Two ideas that shape the system

### One organization, one President

There is no club scoping. Events, tasks, notifications, and people belong to the school community itself. Exactly one
active officer is President; a sitting President is replaced in a transaction, not two independent writes.

Legacy club columns remain in the database for the separately-approved cleanup migration. No active code path reads them.

### Invitations are the front door

A pending invitation represents a decision made before the person signs in: this email, this role, this officer position,
and whether external access is allowed. School addresses are trusted by domain. External addresses need that explicit
approval. Cancelling an invitation removes the pending record, so a new account cannot be created through it.

This is also why re-inviting an existing user does not change their access; the pending record is only consumed when a
new account is created. See [ROADMAP.md](./ROADMAP.md).

## The current boundary: events and registration

The student-facing event browser, registration, ticket, and attendance history use staged in-memory data. The database
contains the event workflow fields and approval trail, and the Admin approvals queue reads them live, but the student
pages still render from the in-memory dataset; the later phases wire event submission, registration records, QR
references, task assignment, and scan flow in. Opening the landing page shows the same UI that will eventually be
database-backed.

[ROADMAP.md](./ROADMAP.md) describes the phases still remaining.

## Where to go next

For local setup, continue with [SETUP.md](./SETUP.md). For the code structure, read
[ARCHITECTURE.md](./ARCHITECTURE.md). For exact permissions, use [RBAC.md](./RBAC.md) together with
[AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md).
