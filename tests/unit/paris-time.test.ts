import { describe, expect, it } from "vitest";
import { parisLocalToUtc, utcToParisLocalInput } from "../../src/lib/paris-time";

describe("paris-time : saisie heure de Paris ↔ UTC", () => {
  it("vide ↔ null", () => {
    expect(parisLocalToUtc("")).toBeNull();
    expect(parisLocalToUtc(null)).toBeNull();
    expect(utcToParisLocalInput(null)).toBe("");
  });

  it("heure d'hiver : Paris = UTC+1", () => {
    // 12 mars 2026 18:00 à Paris = 17:00 UTC (heure d'hiver).
    const utc = parisLocalToUtc("2026-03-12T18:00");
    expect(utc?.toISOString()).toBe("2026-03-12T17:00:00.000Z");
  });

  it("heure d'été : Paris = UTC+2", () => {
    // 15 juin 2026 09:00 à Paris = 07:00 UTC (heure d'été).
    const utc = parisLocalToUtc("2026-06-15T09:00");
    expect(utc?.toISOString()).toBe("2026-06-15T07:00:00.000Z");
  });

  it("aller-retour stable (hiver et été)", () => {
    for (const local of ["2026-01-20T08:30", "2026-07-01T23:45", "2026-03-31T00:15"]) {
      const utc = parisLocalToUtc(local);
      expect(utc).not.toBeNull();
      expect(utcToParisLocalInput(utc)).toBe(local);
    }
  });
});
