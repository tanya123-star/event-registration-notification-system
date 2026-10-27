# AI and Development Evidence

Drop the screenshots, recordings, and exports for the midterm here, then link them from
[`documentation/AI-DECLARATION-FONTANILLA.md`](../documentation/AI-DECLARATION-FONTANILLA.md) and
[`documentation/AI-DECLARATION-RABOSA.md`](../documentation/AI-DECLARATION-RABOSA.md) Section C, and from
[`documentation/MIDTERM-SUBMISSION.md`](../documentation/MIDTERM-SUBMISSION.md) Section 3.

Per-student evidence lives in its own named folder. Tanya Mae Fontanilla's captures, session records, index, and
evidence summary are in [`Tanya-Mae-Fontanilla/`](./Tanya-Mae-Fontanilla/).

## Final Week 7 session record

The officer attendance workflow and the database-backed student registration work are recorded in
[`final-wk7-session-record.md`](./Tanya-Mae-Fontanilla/final-wk7-session-record.md). The record names the AI session id, the requests and
outputs, the files and commits, the verification results, and the known limitations. The `final-wk7` tag in the main
repository marks the implementation commit `54bcb76`.

One capture per OpenCode session created during the week: `Tanya-Mae-Fontanilla/08-final-wk7-session-01.png` through
`Tanya-Mae-Fontanilla/08-final-wk7-session-09.png`. Each follows the midterm `07-ai-*` convention - session id, date range, model, and the
key exchanges in the session view. The index, including the session titles and timestamps, is
[`final-wk7-sessions.md`](./Tanya-Mae-Fontanilla/final-wk7-sessions.md).

Name files after the number they prove so the grader can match them without opening each one:

| File                             | Rubric / form line                                                       |
| -------------------------------- | ------------------------------------------------------------------------ |
| `01-git-log.png`                 | Proof 1 - git repository                                                 |
| `02-screen-recording.mp4`        | Proof 2 - screen recording (3-5 minutes)                                 |
| `03-api-devtools.png`            | Proof 3 - API evidence                                                   |
| `04-db-before.png`               | Proof 4 - database, before a change                                      |
| `04-db-after.png`                | Proof 4 - database, after a change                                       |
| `05-auth-roles.png`              | Proof 5 - roles and account rows                                         |
| `05-auth-denied.png`             | Proof 5 - role-restricted page blocked                                   |
| `06-walkthrough-<name>.mp4`      | Proof 6 - one walkthrough per member                                     |
| `07-ai-<initials><n>-<what>.png` | AI declaration Section B, row _n_ (initials: `f` Fontanilla, `r` Rabosa) |

The `07-ai-*` files are captures of the saved OpenCode session for each declaration row. Each one carries a caption band
with the session id, the row, and the local timestamp of the message shown; the transcript itself prints clock times
without a date, so the caption is what makes the date visible. They were taken from the OpenCode web client of this
workstation's session data, not retyped.

## Before you capture

```bash
docker compose up -d
pnpm prisma:generate && pnpm prisma:deploy
pnpm prisma:seed
pnpm dev
```

Seed accounts exist for each role; if you prefer your own, invite them from **Manage Users**. Never screenshot `.env`,
`AUTH_SECRET`, the Google client secret, real student data, or your own email inbox.

## 1. Git history

```bash
git log --graph --date=short --pretty=format:'%h %ad %an %s'
```

Screenshot the whole window with the terminal title visible. The requirement is commits from **every** member spread
across the weeks, not one dump at the end. If a member has no commits, their work needs to land before this is captured;
the history is checked against the AI log.

## 2. Screen recording (3-5 minutes, unedited)

One take, showing the integrations in the order they are listed in the submission document:

1. Sign in as a student - feed and role-restricted sidebar.
2. Sign in as an admin - **Manage Clubs**: create, rename, delete.
3. **Manage Users**: change a role; then sign in as that role and show the change took effect.
4. Send a notification as an officer or admin, then show it in the recipient's feed and in Mailpit at
   <http://localhost:8025>.
5. Open a notification and show the unread badge drop.
6. Sign in as a student and open `/admin/users` - access denied.

Say what you are doing as you do it. Show the browser URL bar so the route is visible.

## 3. API evidence

1. Open DevTools, **Network** tab, filter to **Fetch/XHR**.
2. Rename a club (or send a notification) to fire a Server Action.
3. Click the `POST` to the page URL, then screenshot **Headers** (request URL, status code, `Next-Action` header) and
   **Response** (the JSON envelope) side by side.

For external evidence instead, capture the `accounts.google.com` and `/api/auth/callback/google` requests during
sign-in, or a Mailpit delivery screenshot for the SMTP side effect.

## 4. Database evidence

Use Prisma Studio (`pnpm prisma:studio`) and capture before and after each operation:

- **Create**: empty table, then the new club row.
- **Update**: the row before the rename, then the same row after.
- **Delete**: the row present, then absent.

A single screenshot showing two tabs side by side is easier to grade than two separate images.

## 5. Authentication evidence

The app stores no passwords, so this proof shows the equivalent:

- `User` table: `email`, `role`, `isActive`, `clubId`.
- `Account` table: `provider = google`, `providerAccountId` - the local user is linked to a Google identity.
- `/admin/users` opened as a student, showing the access-denied page.
- Sign-in with an unapproved external address, showing the inline rejection on the sign-in card.

## 6. Individual walkthrough

One unlisted YouTube video per member, uploaded from your own channel. Each must:

- Explain one function end to end - what it is called by, what it validates, what it writes, what it returns. A guard
  (`requirePermission`), a query (`getNotificationPage`), an action (`sendNotificationAction`), or the `signIn`
  callback are all good choices.
- Make one small change live and show its effect.

The grader is checking understanding, not the recording quality. Rehearse once so the explanation is not read off the
screen.
