import { describe, expect, it } from "vitest";

import { formatEventDay, formatEventTimeRange, formatLongDateTime } from "./format";

describe("formatEventDay", () => {
  it("formats the long event date", () => {
    expect(formatEventDay("2026-11-12T08:00:00+08:00")).toBe("Thursday, November 12, 2026");
  });
});

describe("formatEventTimeRange", () => {
  it("formats the time range", () => {
    expect(formatEventTimeRange("2026-11-12T08:00:00+08:00", "2026-11-12T16:00:00+08:00")).toBe(
      "8:00 AM – 4:00 PM",
    );
  });
});

describe("formatLongDateTime", () => {
  it("formats the closing date and time", () => {
    expect(formatLongDateTime("2026-11-10T17:00:00+08:00")).toBe("November 10, 2026 at 5:00 PM");
  });
});
