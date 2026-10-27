# Student Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan inline. Steps use checkbox (`- [ ]`) syntax for tracking. **Do not commit** — this repo forbids commits unless the user explicitly asks.

**Goal:** Build the student Events list, event detail, and registration confirmation on mock data, matching the supplied screenshots inside the existing navy/cream shell.

**Architecture:** A single data-seam module (`event-data.ts`) owns the mock dataset, registration state, seat arithmetic, and reference reuse. Components read through `useEvents` / `useEvent` and call `registerForEvent` / `cancelRegistration`. The list and detail routes share the module-level store; a full reload resets it.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, React Aria components, `react-icons`, `qrcode`, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-22-student-events-design.md`

## Global Constraints

- **No Prisma, schema, migration, or auth changes.** Do not touch `prisma/schema.prisma`, `src/lib/infra/auth.ts`, `src/instrumentation.ts`, or `prisma/migrations/`.
- **No commits.** Stop after each task's verification; leave the working tree uncommitted.
- **One data seam:** all mock events and registration logic live in `src/features/events/event-data.ts`. Components must not import the mock array or mutate event state directly.
- **Shared state:** list and detail use the same module-level store. A full page reload resets the demo; client-side navigation does not.
- **Mock clock:** `MOCK_NOW = "2026-10-22T00:00:00+08:00"`. Status, filter, and cancel checks take `now` as an argument with `MOCK_NOW` as the default.
- **Shell:** keep the navy sidebar and cream background. Add the Events nav item, event breadcrumb, and notification bell only. Do not restyle the shell.
- **Styling:** CSS Modules only; no inline styles. Use event-scoped indigo tokens, soft status pills, serif page/event/card titles, and Roboto body text.
- **Existing components first:** reuse `Button`, `Modal`, `ConfirmDialog`, `SearchField`, `Select`, `Link`, and the toast helpers.
- **Verification gate:** `pnpm format && pnpm lint && pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm build` before handoff.

## Review Focus

- **List/detail state desync:** registering on the detail page must immediately change the list pill and seat count when navigating back. Pin with the snapshot-identity test in Task 1.
- **Reference and seat drift:** cancel must release exactly one seat and keep the reference; re-register must add exactly one seat and reuse the reference. Pin with Task 1 tests.
- **Status precedence:** a registered seat must stay visible even when the event is full or the deadline has passed; full/closed must block new registration. Pin with Task 1 tests and the disabled-button checks in Task 4.
- **QR/copy failure:** QR generation and clipboard access can fail; the reference text must remain usable and the copy path must surface a toast. Check manually in Task 3.
- **Responsive density:** long event titles and the two-column detail must not overflow at tablet and phone widths. Check at 1024px and 640px in Task 4.

---

### Task 1: Event data seam and pure status logic

**Files:**

- Create: `src/features/events/types.ts`
- Create: `src/features/events/status.ts`
- Create: `src/features/events/event-data.ts`
- Create: `src/features/events/status.test.ts`
- Create: `src/features/events/event-data.test.ts`

**Interfaces:**

- `types.ts` exports `EventStatus`, `RegistrationState`, `EventRegistration`, `StudentEvent`, `EventView`, `EventMutationFailureReason`, `EventMutationResult`, `EventFilter`.
- `status.ts` exports `getRemainingSeats(event: StudentEvent): number`, `isRegistrationClosed(event: StudentEvent, now?: string | Date): boolean`, `isEventStarted(event: StudentEvent, now?: string | Date): boolean`, `resolveEventStatus(event: StudentEvent, now?: string | Date): EventStatus`.
- `event-data.ts` exports `MOCK_NOW`, `getEvents(): EventView[]`, `getEvent(eventId: string): EventView | null`, `registerForEvent(eventId: string, now?: string | Date): EventMutationResult`, `cancelRegistration(eventId: string, now?: string | Date): EventMutationResult`, `filterEvents(events: EventView[], filter: EventFilter): EventView[]`, `subscribe(listener: () => void): () => void`, `useEvents(): EventView[]`, `useEvent(eventId: string): EventView | null`.

- [ ] **Step 1: Write the failing status tests**

Create `src/features/events/status.test.ts` with a `baseEvent` fixture for the Annual Science Fair (`startAt: "2026-11-12T08:00:00+08:00"`, `registrationClosesAt: "2026-11-10T17:00:00+08:00"`, `capacity: 400`, `seatsTaken: 280`, `registration: null`) and these cases:

```ts
it("returns registered before closed or full", () => {
  const event = {
    ...baseEvent,
    seatsTaken: 400,
    registration: { reference: "CH-2026-00418", state: "registered" },
  };
  expect(resolveEventStatus(event, "2026-11-11T00:00:00+08:00")).toBe("registered");
});

it.each([
  ["closed after the registration deadline", "2026-11-11T00:00:00+08:00", 280, "closed"],
  ["closed after the event starts", "2026-11-12T08:00:00+08:00", 280, "closed"],
  ["full at capacity", "2026-10-22T00:00:00+08:00", 400, "full"],
  ["open with seats and time left", "2026-10-22T00:00:00+08:00", 280, "open"],
])("%s", (_label, now, seatsTaken, expected) => {
  expect(resolveEventStatus({ ...baseEvent, seatsTaken }, now)).toBe(expected);
});

it("clamps remaining seats at zero", () => {
  expect(getRemainingSeats({ ...baseEvent, seatsTaken: 401 })).toBe(0);
});
```

- [ ] **Step 2: Run the status tests to verify they fail**

Run: `pnpm test src/features/events/status.test.ts`
Expected: FAIL because `./status` and `./types` do not exist.

- [ ] **Step 3: Implement the types and status helpers**

Create `types.ts` with the interfaces above. Create `status.ts`:

```ts
export function getRemainingSeats(event: StudentEvent): number {
  return Math.max(0, event.capacity - event.seatsTaken);
}

export function isEventStarted(event: StudentEvent, now: string | Date = MOCK_NOW): boolean {
  return new Date(now).getTime() >= new Date(event.startAt).getTime();
}

export function isRegistrationClosed(event: StudentEvent, now: string | Date = MOCK_NOW): boolean {
  return (
    isEventStarted(event, now) ||
    new Date(now).getTime() >= new Date(event.registrationClosesAt).getTime()
  );
}

export function resolveEventStatus(
  event: StudentEvent,
  now: string | Date = MOCK_NOW,
): EventStatus {
  if (event.registration?.state === "registered") return "registered";
  if (isRegistrationClosed(event, now)) return "closed";
  if (getRemainingSeats(event) <= 0) return "full";
  return "open";
}
```

Import `MOCK_NOW` from `event-data.ts` or define it in `types.ts` to avoid a cycle. Prefer defining `MOCK_NOW` in `types.ts` and re-exporting it from `event-data.ts`.

- [ ] **Step 4: Run the status tests to verify they pass**

Run: `pnpm test src/features/events/status.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing data-seam tests**

Create `src/features/events/event-data.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventFilter } from "./types";

let data: typeof import("./event-data");

beforeEach(async () => {
  vi.resetModules();
  data = await import("./event-data");
});

it("returns six events and a stable snapshot", () => {
  const first = data.getEvents();
  expect(first).toHaveLength(6);
  expect(data.getEvents()).toBe(first);
});

it("registers, releases, and reuses the same reference", () => {
  const registered = data.registerForEvent("annual-science-fair-2026");
  expect(registered.success).toBe(true);
  if (!registered.success) return;
  expect(registered.event.seatsTaken).toBe(281);
  expect(registered.event.status).toBe("registered");
  expect(registered.event.registration).toEqual({
    reference: "CH-2026-00418",
    state: "registered",
  });

  const cancelled = data.cancelRegistration("annual-science-fair-2026");
  expect(cancelled.success).toBe(true);
  if (!cancelled.success) return;
  expect(cancelled.event.seatsTaken).toBe(280);
  expect(cancelled.event.registration).toEqual({ reference: "CH-2026-00418", state: "cancelled" });

  const again = data.registerForEvent("annual-science-fair-2026");
  expect(again.success).toBe(true);
  if (!again.success) return;
  expect(again.event.seatsTaken).toBe(281);
  expect(again.event.registration?.reference).toBe("CH-2026-00418");
});

it("blocks full and closed events", () => {
  expect(data.registerForEvent("robotics-workshop-arduino-basics")).toEqual({
    success: false,
    reason: "full",
  });
  expect(data.registerForEvent("library-circle-open-mic")).toEqual({
    success: false,
    reason: "closed",
  });
});

it("blocks cancelling a non-registered event or after the start", () => {
  expect(data.cancelRegistration("annual-science-fair-2026")).toEqual({
    success: false,
    reason: "not_registered",
  });
  expect(
    data.cancelRegistration("inter-school-debate-finals", "2026-11-15T00:00:00+08:00"),
  ).toEqual({ success: false, reason: "started" });
});

it("filters by search, host, and upcoming", () => {
  const events = data.getEvents();
  const filter = (overrides: Partial<EventFilter>): EventFilter => ({
    search: "",
    host: "all",
    time: "all",
    ...overrides,
  });
  expect(data.filterEvents(events, filter({ search: "science" }))).toHaveLength(1);
  expect(data.filterEvents(events, filter({ host: "organization" }))).toHaveLength(2);
  expect(data.filterEvents(events, filter({ time: "upcoming" }))).toHaveLength(6);
});
```

- [ ] **Step 6: Run the data-seam tests to verify they fail**

Run: `pnpm test src/features/events/event-data.test.ts`
Expected: FAIL because `./event-data` does not exist.

- [ ] **Step 7: Implement `event-data.ts`**

Implement the six events from the spec, the module-level store, and these functions:

- `getEvents` maps the raw events to `EventView` and returns a cached array. Invalidate the cache before notifying subscribers.
- `getEvent` reads from `getEvents`.
- `registerForEvent` returns success for an already-registered event, fails `full` / `closed`, otherwise increments `seatsTaken`, sets `registration` to `{ reference: existingReference ?? event.mockReference, state: "registered" }`, invalidates, notifies, and returns the new view.
- `cancelRegistration` fails `not_found` / `not_registered` / `started`, otherwise decrements `seatsTaken` (never below zero), sets the existing registration state to `"cancelled"` while keeping the reference, invalidates, notifies, and returns the new view.
- `filterEvents` lowercases the search, matches title or organizer, applies host `all | organization | club`, applies time `upcoming | all` using `MOCK_NOW`, and sorts by `startAt`.
- `useEvents` uses `useSyncExternalStore(subscribe, getEvents, getEvents)`. `useEvent` selects by id.
- `EventView` adds `status`, `remainingSeats`, and `canCancel` (`registration?.state === "registered" && !isEventStarted(event, MOCK_NOW)`).

- [ ] **Step 8: Run the data-seam and status tests**

Run: `pnpm test src/features/events/status.test.ts src/features/events/event-data.test.ts`
Expected: PASS.

- [ ] **Step 9: Typecheck the seam**

Run: `pnpm exec tsc --noEmit`
Expected: PASS.

---

### Task 2: Events list, card grid, and shell additions

**Files:**

- Modify: `src/app/layout.tsx` — load Lora beside Roboto.
- Modify: `src/styles/variables.css` — add event primitives, semantic tokens, and `--font-family-serif`.
- Modify: `src/components/layout/Sidebar/Sidebar.tsx` — add the Events nav item.
- Modify: `src/components/layout/Header/Header.tsx` and `Header.module.css` — add event breadcrumb and notification bell with unread dot.
- Create: `src/features/events/format.ts`
- Create: `src/features/events/format.test.ts`
- Create: `src/features/events/components/EventStatusPill/EventStatusPill.tsx` + `.module.css`
- Create: `src/features/events/components/EventCard/EventCard.tsx` + `.module.css`
- Create: `src/features/events/components/EventsBrowser/EventsBrowser.tsx` + `.module.css`
- Create: `src/app/(app)/events/page.tsx`

**Interfaces:**

- `format.ts` exports `formatEventDay(date: string): string`, `formatEventTimeRange(startAt: string, endAt: string): string`, `formatEventDateShort(date: string): { month: string; day: string }`, `formatLongDateTime(date: string): string`.
- `EventStatusPill` takes `{ status: EventStatus }` and renders `Open`, `Registered`, `Full`, or `Registration closed`.
- `EventCard` takes `{ event: EventView }`.
- `EventsBrowser` takes no props and reads `useEvents()`.

- [ ] **Step 1: Write the failing formatter tests**

Create `src/features/events/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  formatEventDateShort,
  formatEventDay,
  formatEventTimeRange,
  formatLongDateTime,
} from "./format";

describe("event formatting", () => {
  it("formats the list date tile", () => {
    expect(formatEventDateShort("2026-11-12T08:00:00+08:00")).toEqual({ month: "NOV", day: "12" });
  });

  it("formats the long event date", () => {
    expect(formatEventDay("2026-11-12T08:00:00+08:00")).toBe("Thursday, November 12, 2026");
  });

  it("formats the time range", () => {
    expect(formatEventTimeRange("2026-11-12T08:00:00+08:00", "2026-11-12T16:00:00+08:00")).toBe(
      "8:00 AM – 4:00 PM",
    );
  });

  it("formats the closing date and time", () => {
    expect(formatLongDateTime("2026-11-10T17:00:00+08:00")).toBe("November 10, 2026 at 5:00 PM");
  });
});
```

- [ ] **Step 2: Run the formatter tests to verify they fail**

Run: `pnpm test src/features/events/format.test.ts`
Expected: FAIL because `./format` does not exist.

- [ ] **Step 3: Implement `format.ts`**

Use `Intl.DateTimeFormat` with `timeZone: getAppTimeZone()` from `src/lib/primitives/date.ts`. Use `month: "short"` and uppercase for the tile month; `weekday: "long"`, `month: "long"` for the long day; `hour: "numeric"`, `minute: "2-digit"` for times. Join the range with `" – "`.

- [ ] **Step 4: Run the formatter tests to verify they pass**

Run: `pnpm test src/features/events/format.test.ts`
Expected: PASS.

- [ ] **Step 5: Add fonts and event tokens**

In `src/app/layout.tsx`, import `Lora` from `next/font/google`, create `const lora = Lora({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-lora" })`, and add both variables to `<html className={`${roboto.variable} ${lora.variable}`}>`.

In `variables.css`, add indigo primitives (`#4338ca`, `#3730a3`, `#eef2ff`, `#e0e7ff`), soft status colors (green, blue/indigo, amber, gray), semantic `--color-event-*` tokens, and:

```css
--font-family-serif: var(--font-lora), Lora, Georgia, "Times New Roman", serif;
```

- [ ] **Step 6: Build the list components**

`EventStatusPill` uses a feature CSS module with soft pills. `EventCard` uses `Link` from `@/components/ui/Link/Link` with `variant="unstyled"`, `href={`/events/${event.id}`}`, a date tile, serif title, organizer, status pill, time, venue, and seats left. `EventsBrowser` holds search, host, and time state; renders `SearchField`, two `Select`s, the result count, and a 3/2/1-column grid. Use `useEvents()` and `filterEvents`.

`src/app/(app)/events/page.tsx`:

```tsx
import { EventsBrowser } from "@/features/events/components/EventsBrowser/EventsBrowser";

export default function EventsPage() {
  return <EventsBrowser />;
}
```

There is no `event.read` permission in `src/lib/security/rbac.ts`. Do not add one; the existing `(app)` layout handles sign-in, and this preview intentionally makes Events visible to every signed-in role.

- [ ] **Step 7: Add the shell additions**

In `Sidebar.tsx`, import `FaCalendarDays` and add `{ label: "Events", href: "/events", icon: FaCalendarDays }` before Notifications (no `permission` field). Change `handleNavClick` to navigate when `pathname !== href` so clicking Events on a detail page returns to the list.

In `Header.tsx`, import `FaBell`, `useRouter`, and `useUnreadCount`. Render `Student / Events` or `Student / Event detail` (using `roleLabels[userRole]`) in place of the page title for `/events` routes. Add a ghost bell button that pushes `/notifications` and shows a small dot when `unreadCount > 0`. Add the matching CSS.

- [ ] **Step 8: Verify the list and shell**

Run: `pnpm format && pnpm lint && pnpm exec tsc --noEmit`
Expected: PASS.

Manual check:

- Open `/events` as a Student. Six cards render; Annual is Open, Debate is Registered, Robotics is Full, Library Circle is Registration closed.
- Search "science" leaves one card. Host "Organization-wide" leaves two. Time "Upcoming" leaves six.
- Open Notifications, Manage Users, and Manage Clubs at desktop and mobile widths. Fix only actual layout breakage caused by the new nav item, breadcrumb, or bell.

---

### Task 3: Event detail, seat card, and registration modal

**Files:**

- Create: `src/app/(app)/events/[eventId]/page.tsx`
- Create: `src/features/events/components/EventDetailView/EventDetailView.tsx` + `.module.css`
- Create: `src/features/events/components/SeatAvailabilityCard/SeatAvailabilityCard.tsx` + `.module.css`
- Create: `src/features/events/components/RegistrationDetails/RegistrationDetails.tsx` + `.module.css`
- Create: `src/features/events/components/RegistrationModal/RegistrationModal.tsx` + `.module.css`
- Modify: `src/components/ui/Modal/Modal.tsx` — `title: React.ReactNode`.
- Modify: `package.json` / `pnpm-lock.yaml` — add `qrcode` and `@types/qrcode`.

**Interfaces:**

- `EventDetailView` takes `{ eventId: string }`.
- `SeatAvailabilityCard` takes `{ event: EventView; onRegister: () => void; onManageRegistration: () => void }`; the button reads Register for open events, You're registered for registered events, and is disabled for `full`/`closed` with the reason.
- `RegistrationDetails` takes `{ reference: string }`; renders the QR, reference, copy button, and note.
- `RegistrationModal` takes the common `{ isOpen: boolean; onOpenChange: (open: boolean) => void; reference: string }` plus either `{ mode: "success" }` or `{ mode: "manage"; canCancel: boolean; onCancel: () => void }`.

- [ ] **Step 1: Install the QR dependency**

Run: `pnpm add qrcode` and `pnpm add -D @types/qrcode`.
Expected: `package.json` and `pnpm-lock.yaml` updated; no Prisma/auth files changed.

- [ ] **Step 2: Allow a React node modal title**

Change `ModalProps.title` from `string` to `React.ReactNode`. Existing callers passing strings continue to work.

- [ ] **Step 3: Build the detail page and seat card**

`src/app/(app)/events/[eventId]/page.tsx`:

```tsx
import { EventDetailView } from "@/features/events/components/EventDetailView/EventDetailView";

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  return <EventDetailView eventId={eventId} />;
}
```

There is no `event.read` guard; the existing `(app)` layout handles sign-in.

`EventDetailView` uses `useEvent(eventId)`. If missing, render a small "Event not found" state with a link back to `/events`. Otherwise render the breadcrumb-compatible title, host/status pills, About copy, the information grid, and `SeatAvailabilityCard`. Register opens a confirmation dialog; confirming calls `registerForEvent(event.id)`, closes the dialog, and opens the success modal. A registered event's button reads You're registered and opens the registered popup.

The seat card shows the taken count, progress bar (`role="progressbar"`, `aria-valuenow={event.seatsTaken}`, `aria-valuemax={event.capacity}`), remaining seats with `aria-live="polite"`, the closing date via `formatLongDateTime`, the Register button, and the cancellation note.

- [ ] **Step 4: Build the registration modal**

`RegistrationDetails` generates a QR with `QRCode.toDataURL(reference, { width: 220, margin: 1, color: { dark: "#0f2440", light: "#ffffff" } })` inside a `useEffect` with a cancellation flag. Show a neutral placeholder while generating. The copy button uses `navigator.clipboard.writeText` and the shared toast helpers:

- success: `toastSuccess("Reference copied", "The confirmation reference is on your clipboard.")`
- failure: `toastError("Could not copy reference", "Copy the reference manually from the card.")`

`RegistrationModal` passes a green-check node as the `Modal` title and renders `RegistrationDetails`. In `success` mode it adds a full-width indigo Done button that closes the modal. In `manage` mode it adds the "Your seat is confirmed." subtitle, a secondary/outline "Cancel registration" button wired to `onCancel`, and the started-event reason when `canCancel` is false. Task 4 supplies the cancel dialog.

- [ ] **Step 5: Verify the registration path**

Run: `pnpm format && pnpm lint && pnpm exec tsc --noEmit`
Expected: PASS.

Manual check:

- Open `/events/annual-science-fair-2026`; seat card shows `280 of 400`, 120 remaining, closes November 10, 2026 at 5:00 PM.
- Click Register; the confirmation dialog shows "Register for this event?" with Keep browsing / Yes, register. Keep browsing leaves the seat count at 280.
- Click Yes, register; the success modal shows `CH-2026-00418`, a QR, and the reference note. Close with the X and with Done.
- The seat card button now reads You're registered and the count is 281 with 119 remaining. No inline registered card appears.
- Click You're registered; the registered popup shows the QR, reference, and Cancel registration. Close with X, Escape, and the overlay without changing the registration.
- Navigate back to `/events`; the Annual card pill is Registered and seats left is 119.
- Open `/events/robotics-workshop-arduino-basics` and `/events/library-circle-open-mic`; Register is disabled with the full/closed message.

---

### Task 4: Cancel confirmation and guards

**Files:**

- Modify: `src/components/ui/ConfirmDialog/ConfirmDialog.tsx` — add `cancelLabel?: string` defaulting to `"Cancel"`.
- Modify: `src/features/events/components/EventDetailView/EventDetailView.tsx` — add the cancel dialog and toast.
- Modify: `src/features/events/components/RegistrationModal/RegistrationModal.tsx` — disable Cancel when `canCancel` is false and show the started message.

**Interfaces:**

- `ConfirmDialog` adds `cancelLabel?: string`; the secondary button renders it.
- `EventDetailView` uses `cancelRegistration(event.id)`. On success, close the dialog, close the registered popup, and call `toastSuccess("Registration cancelled", "Your seat has been released. You can register again before the event starts.")`; on failure, call `toastError` with the reason. Keeping the registration closes only the dialog and leaves the popup open.

- [ ] **Step 1: Add `cancelLabel` to `ConfirmDialog`**

Change the secondary button label from the hardcoded `"Cancel"` to `{cancelLabel}` and add the optional prop with a `"Cancel"` default.

- [ ] **Step 2: Wire the cancel flow**

In `EventDetailView`, add `isCancelOpen` and open it from the registered popup's Cancel button. Render:

```tsx
<ConfirmDialog
  isOpen={isCancelOpen}
  onOpenChange={setIsCancelOpen}
  title="Cancel your registration?"
  confirmLabel="Cancel registration"
  cancelLabel="Keep registration"
  onConfirm={handleCancel}
>
  Your seat will be released. You can register again before the event starts.
</ConfirmDialog>
```

`handleCancel` calls `cancelRegistration(event.id)`, closes the dialog and popup on success, and surfaces the result via toasts.

- [ ] **Step 3: Guard the Cancel button**

In `RegistrationModal`'s `manage` mode, set `isDisabled={!canCancel}` and render `Cancellation is closed because the event has started.` when false. Keep the secondary/outline styling.

- [ ] **Step 4: Verify cancel and re-register**

Run: `pnpm format && pnpm lint && pnpm exec tsc --noEmit`
Expected: PASS.

Manual check:

- Register for the Annual Science Fair, open the Registered popup, then click Cancel registration; the dialog shows Keep registration / Cancel registration.
- Keep registration once; the popup remains open. Confirm cancel on the next attempt; the popup closes, the button returns to Register, seats return to 280/120, and the list pill returns to Open.
- Register again; confirm the dialog, then the success modal shows the same `CH-2026-00418`.
- Cancel the pre-registered Debate event from its Registered popup; seats go from 88 to 87, then re-register returns to 88 with the same reference.
- Check 1024px and 640px widths: the detail stacks correctly, the popup fits, and long titles wrap without overflow.

---

### Task 5: Final verification and review handoff

**Files:** none expected unless a verification fails.

- [ ] **Step 1: Run the full gate**

Run: `pnpm format && pnpm lint && pnpm exec tsc --noEmit`
Expected: PASS.

Run: `pnpm test`
Expected: PASS, including the new event tests.

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 2: Confirm the guardrails**

Run: `git status --short` and `git diff --stat`
Expected: no changes under `prisma/schema.prisma`, `prisma/migrations/`, `src/lib/infra/auth.ts`, or `src/instrumentation.ts`. The only dependency change is `qrcode` / `@types/qrcode`.

- [ ] **Step 3: Smoke-check the shell**

Open Notifications, Manage Users, and Manage Clubs at desktop and mobile widths. Confirm the sidebar, header, bell, and user chip are intact. Fix only actual breakage.

- [ ] **Step 4: Report the click-through**

Tell the user:

1. Sign in as a Student (or use the role-switch instructions in the spec).
2. Open **Events** in the sidebar.
3. Search and change both filters.
4. Open **Annual Science Fair 2026**, click **Register**, confirm with **Yes, register**, inspect the QR/reference success modal, close it, and confirm the seat button reads **You're registered**.
5. Click **You're registered**, inspect the QR/cancel popup, close it, and go back to **Events** to confirm the pill changed.
6. Return to the detail page, open **You're registered**, click **Cancel registration**, keep it once, then confirm cancel and re-register.
7. Open the Full and Registration closed events and confirm the disabled messages.
