# Notifications

## What a notification is

A notification is a campus-wide announcement with a title and a body. It records who sent it and when. It may link to an
event; the composer cannot attach an event yet.

Each user has their own read receipts, which is how the feed knows what is unread.

## Audience and visibility

There is one audience in the active system: **Everyone (campus-wide)**. Every signed-in role can read notifications, and
legacy club-scoped rows remain stored in the database but are hidden from every feed. Physical removal of those rows is
part of the separately-approved cleanup migration (ADR-0009).

| Audience | Intended recipients     |
| -------- | ----------------------- |
| Everyone | The whole organisation. |

## Sending

Sending requires the notification-create permission. Admins, developers, and officers have it; students do not. The feed
hides the composer from students, and the server enforces the same rule.

The composer asks for a title and a body. The server validates the same rules before writing. After sending, the
notification appears in every signed-in user's feed.

## Email delivery

Notification email is intentionally not part of the current build. The shared `sendEmail` helper remains in place as the
future seam, and the invitation email path still uses it, but the notification composer does not enqueue or await an email
anymore. Turning notification email back on is a separate decision recorded in the roadmap.

## The feed

The notification feed is the home screen after sign-in. The first page loads on the server, and the browser fetches more
as the user scrolls.

Notifications are shown newest first. Search runs over title and body, and the status filter can show unread or read
items. Search and filters are applied by the server rather than filtering a fully loaded list in the browser.

Opening a notification shows its details and marks it as read. Read receipts are stored per user and notification, so
opening the same item repeatedly is harmless. The feed updates locally, and the unread count is reduced immediately.
The feed toolbar also lets the signed-in person mark every visible notification as read.

The sidebar badge shows the unread count. It is refreshed periodically, when the tab becomes active again, and after a
notification is marked read. A failed background refresh is ignored and corrected by the next successful refresh or page
load.

## What notifications do not do yet

Notifications cannot be edited, deleted, scheduled, sent to an individual, delivered as push notifications, attached to
an event from the composer, or emailed. There is no notification preference screen.

These are current boundaries, not hidden features. [ROADMAP.md](./ROADMAP.md) covers the next phase.

## Related

- [DATA-MODEL.md](./DATA-MODEL.md) describes the notification records.
- [RBAC.md](./RBAC.md) contains the exact permissions.
- [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md) explains how roles shape access.
