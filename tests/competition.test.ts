import { describe, expect, it } from "vitest";
import { composeGroups, podium, qualifiers, type GroupStanding } from "../src/competition";

const standing = (entryId: string, bpi: number, financial = 50, lastTreasury = 0): GroupStanding => ({
  entryId,
  bpi,
  financial,
  lastTreasury,
});

describe("composition des groupes (doc 04)", () => {
  const entries = ["a", "b", "c", "d", "e", "f", "g"];

  it("déterministe à graine égale (tirage auditable, anti-contestation)", () => {
    expect(composeGroups(entries, 3, 42)).toEqual(composeGroups(entries, 3, 42));
    expect(JSON.stringify(composeGroups(entries, 3, 42))).not.toBe(
      JSON.stringify(composeGroups(entries, 3, 43)),
    );
  });
  it("jamais de groupe à 1 : 7 équipes par 3 → 2 groupes de 4 et 3", () => {
    const groups = composeGroups(entries, 3, 1);
    expect(groups).toHaveLength(2);
    expect(groups.flat().sort()).toEqual([...entries].sort());
    for (const g of groups) expect(g.length).toBeGreaterThanOrEqual(2);
  });
  it("cas limites : vide, moins d'équipes qu'un groupe", () => {
    expect(composeGroups([], 3, 1)).toEqual([]);
    expect(composeGroups(["a", "b"], 4, 1)).toEqual([expect.arrayContaining(["a", "b"])]);
  });
});

describe("qualification (doc 04 §3)", () => {
  const groups = [
    [standing("a1", 70), standing("a2", 60), standing("a3", 40)],
    [standing("b1", 55), standing("b2", 65), standing("b3", 50)],
  ];
  it("les N premiers de chaque groupe, triés", () => {
    expect(qualifiers(groups, 1)).toEqual(["a1", "b2"]);
    expect(qualifiers(groups, 2)).toEqual(["a1", "b2", "a2", "b1"]);
  });
  it("complément par les meilleurs restants jusqu'à la cible", () => {
    expect(qualifiers(groups, 1, 3)).toEqual(["a1", "b2", "a2"]); // a2 (60) meilleur second
  });
  it("départage à BPI égal : dimension financière puis trésorerie (doc 04)", () => {
    const tied = [[standing("x", 60, 80, 0), standing("y", 60, 70, 999999)]];
    expect(qualifiers(tied, 1)).toEqual(["x"]);
    const tied2 = [[standing("x", 60, 70, 100), standing("y", 60, 70, 200)]];
    expect(qualifiers(tied2, 1)).toEqual(["y"]);
  });
  it("podium = classement complet de la finale", () => {
    expect(podium([standing("c", 50), standing("a", 80), standing("b", 65)])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
