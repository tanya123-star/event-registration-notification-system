# Student Events — Design

**Status:** Proposed for approval  
**Date:** 2026-10-22  
**Scope:** Student-facing Events list, event detail, and registration confirmation, built on mock data.

## Intent

Give students a polished way to discover events, open an event, register, receive a QR ticket, and cancel or re-register. This round is a UI review build: it must look and behave like the three screenshots without changing Prisma, authentication, or the database.

## Visual reference

The three screenshots supplied in chat are the visual source. They are not checked into the repository.

- **List:** a light content area with a serif "Events" heading, a search field and two compact selects on one row, the result count at the right, and a 3-column grid of white cards. Each card has a date tile at the top-left, serif title and organizer beside it, a soft status pill at the top-right, then time, venue, and seats-left rows.
- **Detail:** a breadcrumb, then a two-column layout. The left white card holds the serif event title, two pills, About copy, a divider, and a two-column information grid with small indigo icon tiles. The right column holds a white seat card with a large taken count, progress bar, remaining seats, closing date, full-width indigo Register button, and a small note. When registered, the same button reads You're registered and opens the QR/cancel modal; there is no second card below it.
- **Success modal:** a narrow white card with a green check and "You're registered", a large bordered QR panel, a light gray reference block with a copy icon, a two-line note, and the Done action.
- Card radius is about 12px, card padding about 16px, grid gap about 16px, and the detail split is roughly two-thirds main card to one-third seat column.

## Goals

- Events list with search, two filters, result count, responsive 3-column card grid, and four card states.
- Event detail with title, tags, About, event information grid, seat availability, and Register/Cancel.
- Registration success modal with green check, QR code, confirmation reference, copy-to-clipboard, close, and Done.
- Registered detail state: the seat card button reads You're registered and opens a QR/cancel popup with the registration reference and Cancel registration.
- Register increments seats, cancel decrements them, and the confirmation reference survives cancel/re-register.
- Registration is blocked when the event is full or registration is closed, with an explanatory message.
- Existing navy/cream shell stays; add an Events nav item and a notification bell with unread dot.

## Non-goals

- My Attendance and My Registrations pages or sidebar links.
- Real `EventRegistration` schema, migrations, Server Actions, or auth changes.
- Event approval, attendance staff, or other RBAC changes.
- Global shell redesign; the sidebar remains navy and the app background remains cream.
- Persistence across a full page reload.

## Constraints and decisions

- **Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, React Aria components, `react-icons`, `qrcode`.
- **Mock data only:** all events and registration state live behind `src/features/events/event-data.ts`; types and pure helpers live in `types.ts`, `status.ts`, and `format.ts`.
- **Data seam:** `event-data.ts` is the only module that owns the mock dataset, store, and registration logic. It exposes `getEvents`, `getEvent`, `registerForEvent`, `cancelRegistration`, plus `subscribe` and the `useEvents` / `useEvent` hooks. Components do not import mock arrays.
- **Mock state:** a module-level external store in `event-data.ts`, read through `useSyncExternalStore`. It survives client-side navigation to Notifications and back, and resets on a full page reload.
- **Mock clock:** use a fixed `MOCK_NOW` of `2026-10-22` for status, filter, and cancel checks so the screenshot states stay stable as the review date moves. The UI does not display the mock clock.
- **No database changes:** no Prisma edits, migrations, or Server Actions in this round.
- **Shell edits are not a restyle:** add the Events nav item and header bell only. After those edits, smoke-check Notifications, Manage Users, and Manage Clubs and fix only actual visual breakage.
- **Shared shell:** keep the current navy sidebar and cream page background. Add Events to the existing nav and a bell to the existing header. Do not restyle the sidebar or header to the light screenshot shell.
- **Event look:** event content uses indigo as its primary color, white cards, and soft status pills. This is scoped to the Events feature so the rest of the app keeps its navy identity.
- **Typography:** add a serif face for the Events page title, event titles, and card titles; keep Roboto for body text and controls.
- **No new route for confirmation:** the success state is a modal on the detail page.
- **Confirmation before registering:** clicking Register opens a confirmation dialog; only "Yes, register" reserves the seat and opens the success modal.

## Review access

The Events routes live under the existing `(app)` layout and require an already-working signed-in session. This design does not change authentication and does not add a public route.

There is no `event.read` permission in `src/lib/security/rbac.ts`. Rather than add new RBAC, this preview relies on the existing `(app)` layout auth. The Events nav item has no permission guard, and both routes render for every signed-in role. The mock store treats the current viewer as the mock student; the list intentionally shows all six events rather than applying real club scope.

The breadcrumb role label still reflects the signed-in user. To see the exact Student presentation, sign in with a seeded student account such as `student.rcy@acdeducation.com`, `student.lits@acdeducation.com`, or `student.ssc@acdeducation.com`. Role switching is optional because every role can open the pages.

Review the six states through the list and detail screens:

- **Open:** Annual Science Fair 2026, Foundation Day Convocation, Mathematics Olympiad Qualifier.
- **Registered:** Inter-School Debate Finals.
- **Full:** Robotics Workshop: Arduino Basics.
- **Registration closed:** Library Circle Open Mic.

## Mock data

Create `src/features/events/types.ts` with the `StudentEvent` shape and `MOCK_NOW` (`2026-10-22T00:00:00+08:00`), and `src/features/events/event-data.ts` with the six initial events. All status, filter, and cancel checks take `now` as an argument so tests can inject a different clock.

```ts
type EventStatus = "open" | "registered" | "full" | "closed";

interface EventRegistration {
  reference: string;
  state: "registered" | "cancelled";
}

interface StudentEvent {
  id: string;
  title: string;
  organizer: string;
  description: string;
  venue: string;
  startAt: string; // ISO 8601
  endAt: string;
  registrationOpensAt: string;
  registrationClosesAt: string;
  capacity: number;
  seatsTaken: number;
  host: "organization" | "club";
  registration: EventRegistration | null;
  mockReference: string; // CH-2026-#####
}
```

Initial events:

| Event                             | Date / time              | Venue                 | Host                | Capacity | Taken | State      |
| --------------------------------- | ------------------------ | --------------------- | ------------------- | -------- | ----- | ---------- |
| Annual Science Fair 2026          | Nov 12, 8:00 AM–4:00 PM  | Main Gymnasium        | Organization-wide   | 400      | 280   | Open       |
| Inter-School Debate Finals        | Nov 14, 1:00 PM–5:00 PM  | Auditorium            | Debate Society      | 100      | 88    | Registered |
| Robotics Workshop: Arduino Basics | Nov 18, 3:00 PM–6:00 PM  | Computer Laboratory 2 | Robotics Club       | 30       | 30    | Full       |
| Foundation Day Convocation        | Nov 23, 8:00 AM–11:30 AM | University Grounds    | Organization-wide   | 500      | 255   | Open       |
| Library Circle Open Mic           | Nov 25, 5:00 PM–7:30 PM  | Library Atrium        | Library Circle      | 60       | 30    | Closed     |
| Mathematics Olympiad Qualifier    | Dec 2, 8:00 AM–11:30 AM  | Room 204              | Mathematics Society | 50       | 32    | Open       |

- The Annual Science Fair detail copy matches the screenshot, including the registration window (opens Oct 19, closes Nov 10 at 5:00 PM).
- The Library Circle event has a registration deadline in the past so the list shows "Registration closed" while the event is still upcoming.
- The Debate Finals event is pre-registered for the mock student.
- Reuse `CH-2026-00418` for the Annual Science Fair, matching the screenshot. Assign a unique `mockReference` to every other event.
- `seatsTaken` includes the pre-registered Debate seat.

## Derived status

Create a pure `resolveEventStatus(event, now)` helper and use it everywhere:

1. `registered` when `event.registration?.state === "registered"`.
2. `closed` when `now >= startAt` or `now >= registrationClosesAt`.
3. `full` when `seatsTaken >= capacity`.
4. `open` otherwise.

`registered` wins over `closed` and `full` so the student's seat is never hidden. The Cancel action remains available after the registration deadline but before the event starts.

## Flows

### Register

1. Register is enabled only when the derived status is `open`.
2. Clicking Register opens a confirmation dialog: "Register for this event?" with "Keep browsing" and "Yes, register". Nothing is reserved until "Yes, register" is confirmed.
3. Confirming sets the registration to `registered`, increments `seatsTaken` by one, closes the confirmation, and opens the success modal.
4. The success modal shows the green "You're registered" header, QR code, reference, copy button, note, close, and Done.
5. Closing the success modal returns to the detail page. The seat card button becomes `You're registered`; no inline registered card appears.
6. The list card pill becomes `Registered`.

### Registered popup

1. Clicking the `You're registered` button opens a modal with the green "You're registered" header, "Your seat is confirmed." subtitle, QR code, reference, copy button, note, and a secondary/outline "Cancel registration" button.
2. The popup closes with its close icon, Escape, or the overlay without changing the registration.
3. After the event starts, "Cancel registration" is disabled and the popup shows "Cancellation is closed because the event has started."

### Cancel

1. "Cancel registration" in the registered popup opens a small alert dialog: "Cancel your registration?" with "Keep registration" and "Cancel registration".
2. "Keep registration" closes the alert dialog and returns to the registered popup.
3. Confirming decrements `seatsTaken`, keeps the reference, sets the registration state to `cancelled`, and closes both the alert dialog and the registered popup.
4. The seat card button returns to Register, available if the event is still open and has seats.
5. The list card pill returns to `Open`, `Full`, or `Registration closed` as appropriate.

### Re-register

1. A cancelled registration keeps its reference in the mock event.
2. Registering again asks for confirmation, reuses that reference, increments the seat count, and reopens the success modal with the same reference.
3. The list card pill returns to `Registered`.

### Guard messages

- `full`: Register disabled, message "This event is full. No seats are currently available."
- `closed`: Register disabled, message "Registration is closed for this event."
- `registered`: button reads You're registered and opens the registered popup; no inline card.
- After the event starts: Cancel is disabled, message "Cancellation is closed because the event has started."

## Screens

### Events list — `/events`

- Content breadcrumb: `<role label> / Events`; page title "Events" in serif.
- Toolbar: search field, host select, time select, result count.
- Search matches title and organizer; placeholder "Search events by title or club".
- Host options: All events, Organization-wide, Club events.
- Time options: Upcoming, All dates. Default Upcoming. The six mock events are all upcoming on the mock clock; "All dates" is the escape hatch if an event is added with an earlier date.
- Result count: "Showing X of Y events".
- Grid: 3 columns at desktop, 2 at tablet, 1 at mobile.
- Card: date badge (month/day), serif title, organizer, status pill, time, venue, seats left. Entire card links to the detail page.
- Empty state when filters return nothing.

### Event detail — `/events/[eventId]`

- Breadcrumb: `<role label> / Event detail`.
- Two-column layout: main event card on the left, seat column on the right.
- Main card: serif event title, host tag, status tag, About heading and copy, divider, Event information grid (Date, Time, Venue, Organizer, Registration opens, Registration closes) with light indigo icon tiles.
- Right column unregistered: seat availability card with `280 of 400 seats taken`, progress bar, `120 seats remaining`, registration deadline, Register button, and cancellation note.
- Right column registered: the same seat availability card with the button reading You're registered. Clicking it opens the registered popup with green check, "Your seat is confirmed." subtitle, QR, reference + copy, reference note, and a secondary Cancel button. No second card sits below the seat card.
- Mobile: main card first, then seat availability. The registered popup opens over the page.

### Success modal

- Opens immediately after registering.
- Header: green check + "You're registered".
- Body: QR code in a bordered white panel, light gray reference block with copy icon, note "Keep this reference. It stays the same if you cancel and register again."
- Footer: Done button; the modal also has its close icon.
- Escape/overlay/close/Done all close the modal without changing the registration.

### Registered popup

- Opens from the You're registered button in the seat card.
- Header: green check + "You're registered", with the subtitle "Your seat is confirmed."
- Body: the same QR code, reference block with copy icon, and reference note as the success modal.
- Footer: secondary/outline "Cancel registration" button. After the event starts, it is disabled with "Cancellation is closed because the event has started."
- Close icon, Escape, and overlay dismiss the popup without changing the registration.
- Cancel opens the confirmation dialog; Keep registration returns to the popup, and confirming closes both.

## Visual system

- **Page background:** existing cream token.
- **Cards:** white, 1px neutral border, 12px radius, subtle shadow.
- **Indigo:** primary `#4338ca`, hover `#3730a3`, soft `#eef2ff`, soft border `#e0e7ff`.
- **Status pills:** soft fills with colored text:
  - Open: green text on light green.
  - Registered: indigo/blue text on light indigo.
  - Full: amber text on light amber.
  - Registration closed: gray text on light gray.
- **Typography:** Lora for page/event/card titles; Roboto for body, labels, and controls.
- **Controls:** white search/select fields with neutral borders; indigo focus ring.
- **Seat bar:** 8px track in neutral gray with indigo fill.
- **Buttons:** Register is full-width indigo with white text; Cancel is secondary/outline with indigo text and border.
- **QR:** 220px square, white background, dark navy modules, alt text naming the reference.
- **Tokens:** add event-scoped primitives/semantic tokens to `src/styles/variables.css`; add a serif font token to the root layout.

## Accessibility

- Cards are links with an accessible name that includes the event title and date.
- Search and filters have accessible names even without visible labels.
- Status is text, not color alone.
- The native seat progress element has an accessible label and is described by the remaining-seat text.
- Remaining-seat text is an `aria-live="polite"` region so register/cancel updates are announced.
- Modal and confirmation dialog use the existing React Aria focus management.
- Disabled Register has an associated explanatory message.
- Copy button has an accessible label and reports success/failure via the shared toast helpers.
- Focus styles remain visible; reduced-motion behavior follows `globals.css`.

## Files

New routes:

- `src/app/(app)/events/page.tsx` — list route.
- `src/app/(app)/events/[eventId]/page.tsx` — detail route.

New feature:

- `src/features/events/types.ts` — event, status, filter, and mutation types plus `MOCK_NOW`.
- `src/features/events/status.ts` — pure seat, started, closed, and status-precedence helpers.
- `src/features/events/event-data.ts` — initial events, module-level store, hooks, filters, register/cancel.
- `src/features/events/format.ts` — long date and time-range formatting.
- `src/features/events/components/EventsBrowser/` — toolbar and grid.
- `src/features/events/components/EventCard/` — list card.
- `src/features/events/components/EventStatusPill/` — soft status pill.
- `src/features/events/components/EventDetailView/` — detail layout and actions.
- `src/features/events/components/SeatAvailabilityCard/` — seat progress, Register/You're registered state, and guard message.
- `src/features/events/components/RegistrationDetails/` — shared QR/reference block.
- `src/features/events/components/RegistrationModal/` — success modal and registered popup with Cancel action.

Shared edits:

- `src/components/layout/Sidebar/Sidebar.tsx` — add the Events nav item; navigate when the current path differs from the item href so the item returns to its root from a nested route.
- `src/components/layout/Header/Header.tsx` and CSS — add bell with unread dot.
- `src/components/ui/Modal/Modal.tsx` — allow a React node title for the green-check header.
- `src/components/ui/ConfirmDialog/ConfirmDialog.tsx` — add a `cancelLabel` prop.
- `src/styles/variables.css` — event indigo/status tokens and serif font token.
- `src/app/layout.tsx` — load Lora.
- `package.json` / `pnpm-lock.yaml` — add `qrcode` and `@types/qrcode`.

Tests:

- `src/features/events/status.test.ts` — status precedence, seat arithmetic, reference reuse, register/cancel guards.

## Acceptance criteria

- The three screens match the screenshots' layout and density within the existing navy/cream shell.
- Six mock events render in a responsive grid; all four pill states appear.
- Search and both filters change the visible cards and result count.
- Register asks for confirmation, then updates seats, opens the success modal, and changes the seat button and list pill.
- The You're registered button opens the QR/cancel popup; no inline registered card remains.
- Cancel asks for confirmation, releases the seat, closes the popup, and restores Register.
- Re-register reuses the exact reference.
- Full and closed events cannot be registered for and explain why.
- Cancel works after the registration deadline but not after the event starts (unit-tested; the six-event demo does not expose a registered, closed event).
- Keyboard, focus, labels, and copy feedback work.
- No Prisma, auth, or database changes are made.

## Builder calls

These are settled by the implementer, not open product questions:

- Use `qrcode` with the reference as the encoded value.
- Add Lora via `next/font/google`.
- Use the module-level store; a full reload resets the mock, but navigation does not.
- Use the six events above; do not duplicate cards to fill the screenshot's repeated rows.
- Use the existing cream background for the page and white cards, rather than changing the global app background to gray.
- Keep the existing sign-out control and user chip in the header; only add the bell.
- Use a simple in-page empty state for an unknown event id, with a link back to Events.
- Treat the chat screenshots as the visual source; the repo does not need to contain the images.
