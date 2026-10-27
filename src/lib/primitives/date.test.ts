import { describe, expect, it } from "vitest";

import { formatMonthDay } from "./date";

describe("formatMonthDay", () => {
  it("formats the list date tile", () => {
    expect(formatMonthDay("2026-11-12T08:00:00+08:00")).toEqual({ month: "NOV", day: "12" });
  });
});
