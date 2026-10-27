# Documentation

This folder explains the Event Registration & Notification System in plain language: what it does today, how the pieces
fit together, and what is still missing.

The code and [AGENTS.md](../AGENTS.md) are the source of truth for implementation details. These guides describe
behaviour and structure rather than every field or screen, so they should stay useful as the code changes. The one
deliberate mirror is [RBAC.md](./RBAC.md), which must stay in sync with the permission matrix in code.

## Start here

- **New to the project?** Read [OVERVIEW.md](./OVERVIEW.md), then [SETUP.md](./SETUP.md).
- **Changing the code?** Read [ARCHITECTURE.md](./ARCHITECTURE.md) and keep [AGENTS.md](../AGENTS.md) nearby.
- **Working on access?** Read [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md) and [RBAC.md](./RBAC.md).
- **Working on announcements?** Read [NOTIFICATIONS.md](./NOTIFICATIONS.md).
- **Planning events?** Read [ROADMAP.md](./ROADMAP.md).

## Documents

| Document                                   | What it covers                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| [OVERVIEW.md](./OVERVIEW.md)               | What the product is, who uses it, and what works today.                    |
| [SETUP.md](./SETUP.md)                     | Local setup, environment variables, and useful commands.                   |
| [ARCHITECTURE.md](./ARCHITECTURE.md)       | Stack, code organisation, data flow, and the main application boundaries.  |
| [AUTH-AND-ACCESS.md](./AUTH-AND-ACCESS.md) | Sign-in, invitations, sessions, access states, and authorization.          |
| [NOTIFICATIONS.md](./NOTIFICATIONS.md)     | Audiences, visibility, sending, email delivery, and the notification feed. |
| [DATA-MODEL.md](./DATA-MODEL.md)           | The main records, relationships, constraints, and event groundwork.        |
| [RBAC.md](./RBAC.md)                       | The permission matrix mirrored by the server-side policy.                  |
| [ROADMAP.md](./ROADMAP.md)                 | Current limitations, already-recorded decisions, and the phases ahead.     |

## Scope

The application is currently notification-first and people-first. Sign-in, invitations, People management with a global
President, and notifications are working. Event management, registration records, task assignment, and scan flow are
still staged in-memory screens; the database groundwork is in place. See
[ROADMAP.md](./ROADMAP.md) for the boundary and the phases ahead.
