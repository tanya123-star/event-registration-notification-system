# Architecture

## One server-first application

The project is a single Next.js application backed by PostgreSQL. There is no separate API service and no client-side
database layer. Pages render on the server by default, interactive components are loaded only where needed, and
structural changes go through Server Actions.

That keeps the security boundary in one place. A page can read data after checking the session, and a form can submit
typed data to an action that re-checks access and validates the payload before writing. The browser never imports the
database client and never decides whether an operation is allowed.

The dependency set is intentionally small. React provides the UI, React Aria Components cover accessible interaction
patterns, CSS Modules and design tokens handle styling, Zod handles validation, and Nodemailer sends email. There is no
global client state library and no custom REST layer.

## Stack

| Layer          | Choice                                       |
| -------------- | -------------------------------------------- |
| Framework      | Next.js App Router with React                |
| Language       | TypeScript in strict mode                    |
| Authentication | NextAuth / Auth.js with Google               |
| Data           | PostgreSQL through Prisma                    |
| Validation     | Zod, shared by forms and server actions      |
| UI             | React Aria Components and CSS Modules        |
| Email          | Nodemailer over SMTP                         |
| Testing        | Vitest and Storybook browser tests           |
| Tooling        | pnpm, with an optional Nix development shell |

## Code organisation

- `src/app/` contains routes and page-level orchestration.
- `src/features/{domain}/` contains domain logic: server actions, reads, writes, schemas, and feature components.
- `src/components/` contains shared UI primitives and the application shell.
- `src/lib/` contains shared infrastructure, security, validation, date, pagination, and email helpers.
- `src/styles/` contains design tokens and global styles.
- `prisma/` contains the schema, migrations, and seed script.

A feature keeps its layers together rather than spreading them across the application. Server actions are the entry
point for writes and permissioned reads. Plain query and mutation functions talk to Prisma but do not make authorization
decisions. Feature components call actions; they do not import Prisma.

Shared code flows toward features, not the other way around. A feature may use `src/lib/` and shared components, but
shared modules should not import a feature's internals.

## How data moves

**Page reads.** A server component runs a page-level access check, reads the initial data, and passes plain serialisable
values into client components. Expected access failures redirect to a notice page instead of reaching an error boundary.

**Lists.** The people and notification lists use cursor pagination. The server applies search, filters, and sorting,
then returns a page of rows with a cursor for the next page. Client components request more through actions and append
the results without keeping a second independent data store.

**Writes.** A form submits a typed payload, not raw form data. The action checks permission first, validates with Zod,
performs the write, and returns a structured response. The client shows a toast and refreshes the affected list. The same
schema drives the browser-side feedback, but the server always validates again.

Read failures propagate to the framework or the calling component. Write failures are caught and mapped to a safe
response envelope; raw errors, database details, and secrets never reach the browser.

## Boundaries

### Server actions are the security perimeter

Every protected write starts with a server-side authorization check. Client-side permission checks only hide controls;
they are never treated as enforcement. Page guards and action guards use the same central permission matrix, but page
guards redirect while actions return structured errors.

### Prisma stays on the server

Prisma is used only in feature read/write modules, the seed script, and the auth adapter. Server components may call
plain reads for initial rendering after a page guard; interactive reads and all writes go through actions.

The generated Prisma client has separate server and browser entries. The server entry imports Node builtins. Shared
modules that run in the browser, including the permission matrix and form schemas, use the browser entry so the
production build does not pull server code into the client bundle.

### Officer attendance

`/dashboard` branches by role; Officers get attendance statistics for a selected published event. `/attendance/scanner`
decodes QR codes in the browser with `@zxing/browser` and offers the same verification by manual reference entry.
`/attendance/records` lists persisted check-ins with event, method, and day filters plus cursor pagination. The routes
guard with `attendance.scan` and `attendance.view`.

QR payloads are the opaque `KASAMA-…` registration reference generated at registration time; there is no second token
format. `verifyAttendanceAction` only reads and returns a student/event summary. `recordAttendanceAction` writes through
`recordAttendance`, which re-resolves the reference on the server, checks the event and registration state, and relies on
the `(eventId, studentId)` unique constraint so concurrent scans create one row and one `already attended` result. No
browser-supplied identity or eligibility value is trusted.

### Email is a side effect

Invitations and notification emails are sent after the database write. They are not part of a transaction. If SMTP fails,
the pending invitation or notification remains in the database, and the action reports the failure. There is no outbox,
retry queue, or delivery tracking yet.

## UI and styling

Pages are server components unless they need client state, event handlers, effects, or browser APIs. The authenticated
shell provides navigation, the unread badge, and shared providers. Main content areas are client components when they
own search, filters, modals, or infinite scrolling.

Styling uses CSS Modules and design tokens. Layout relies on flexbox, media queries, and semantic HTML rather than
JavaScript viewport detection. Interactive primitives come from React Aria Components, which provide keyboard
behaviour, focus management, and accessible labels.

Storybook stories cover shared UI and double as browser tests. Unit tests sit next to the code they exercise.

## What is not here

There is no custom REST API for application data, no GraphQL layer, and no client-side ORM. The server-rendered page and
Server Action model covers the current event, registration, and attendance workflows.
