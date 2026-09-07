import { describe, expect, it } from "vitest";
import { computePlayWindow } from "../../src/lib/play-window";

const at = (iso: string) => new Date(iso);

describe("play-window : verrou temporel du planning", () => {
  it("sans aucune fenêtre, l'accès est ouvert (pilotage manuel, rétrocompatible)", () => {
    const w = computePlayWindow({ now: at("2026-03-10T10:00:00Z") });
    expect(w).toEqual({ playable: true, state: "open", opensAt: null, closesAt: null });
  });

  it("avant l'ouverture du tour : verrouillé, état « before »", () => {
    const w = computePlayWindow({
      now: at("2026-03-10T08:00:00Z"),
      roundOpensAt: at("2026-03-10T09:00:00Z"),
      roundDeadline: at("2026-03-12T18:00:00Z"),
    });
    expect(w.playable).toBe(false);
    expect(w.state).toBe("before");
    expect(w.opensAt).toEqual(at("2026-03-10T09:00:00Z"));
  });

  it("dans la fenêtre : jouable", () => {
    const w = computePlayWindow({
      now: at("2026-03-11T10:00:00Z"),
      roundOpensAt: at("2026-03-10T09:00:00Z"),
      roundDeadline: at("2026-03-12T18:00:00Z"),
    });
    expect(w.playable).toBe(true);
    expect(w.state).toBe("open");
  });

  it("après l'échéance : verrouillé, état « after »", () => {
    const w = computePlayWindow({
      now: at("2026-03-13T09:00:00Z"),
      roundDeadline: at("2026-03-12T18:00:00Z"),
    });
    expect(w.playable).toBe(false);
    expect(w.state).toBe("after");
    expect(w.closesAt).toEqual(at("2026-03-12T18:00:00Z"));
  });

  it("l'ouverture effective est la PLUS TARDIVE des ouvertures (partie + tour + étape)", () => {
    const w = computePlayWindow({
      now: at("2026-03-10T09:30:00Z"),
      gameOpensAt: at("2026-03-01T00:00:00Z"),
      roundOpensAt: at("2026-03-10T10:00:00Z"), // la plus tardive
      stageStartsAt: at("2026-03-05T00:00:00Z"),
    });
    expect(w.opensAt).toEqual(at("2026-03-10T10:00:00Z"));
    expect(w.state).toBe("before"); // now est avant 10:00
  });

  it("la fermeture effective est la PLUS PRÉCOCE des fermetures", () => {
    const w = computePlayWindow({
      now: at("2026-03-11T10:00:00Z"),
      gameClosesAt: at("2026-03-24T23:59:00Z"),
      roundDeadline: at("2026-03-12T18:00:00Z"), // la plus précoce
      stageEndsAt: at("2026-03-20T00:00:00Z"),
    });
    expect(w.closesAt).toEqual(at("2026-03-12T18:00:00Z"));
    expect(w.playable).toBe(true);
  });

  it("la fenêtre de partie referme même si le tour n'a pas d'échéance", () => {
    const w = computePlayWindow({
      now: at("2026-03-25T10:00:00Z"),
      gameOpensAt: at("2026-03-10T00:00:00Z"),
      gameClosesAt: at("2026-03-24T23:59:00Z"),
    });
    expect(w.playable).toBe(false);
    expect(w.state).toBe("after");
  });

  it("aux bornes : ouverture incluse, échéance incluse", () => {
    const ouverture = computePlayWindow({
      now: at("2026-03-10T09:00:00Z"),
      roundOpensAt: at("2026-03-10T09:00:00Z"),
    });
    expect(ouverture.playable).toBe(true);
    const echeance = computePlayWindow({
      now: at("2026-03-12T18:00:00Z"),
      roundDeadline: at("2026-03-12T18:00:00Z"),
    });
    expect(echeance.playable).toBe(true);
  });
});
