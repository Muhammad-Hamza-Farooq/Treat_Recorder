import { describe, expect, it } from "vitest";
import { isValidTimeZone, zonedLocalToUtc } from "./datetime";

describe("datetime", () => {
  it("converts Karachi local time (UTC+5) to UTC", () => {
    expect(zonedLocalToUtc("2026-11-02T19:30", "Asia/Karachi").toISOString()).toBe(
      "2026-11-02T14:30:00.000Z"
    );
  });

  it("handles DST zones", () => {
    expect(zonedLocalToUtc("2026-07-01T12:00", "America/New_York").toISOString()).toBe(
      "2026-07-01T16:00:00.000Z"
    );
  });

  it("validates time zones", () => {
    expect(isValidTimeZone("Asia/Karachi")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});
