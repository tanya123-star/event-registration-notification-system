import { describe, expect, it } from "vitest";

import { createRegistrationReference } from "./reference";

describe("createRegistrationReference", () => {
  it("returns an opaque KASAMA reference with 80 bits of entropy", () => {
    expect(createRegistrationReference()).toMatch(/^KASAMA-[0-9A-HJKMNP-TV-Z]{16}$/);
  });

  it("returns a different reference each time", () => {
    const references = new Set(Array.from({ length: 20 }, () => createRegistrationReference()));

    expect(references.size).toBe(20);
  });
});
