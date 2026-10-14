import { describe, expect, it } from "vitest";
import { FAMILLES, SECTEURS } from "../../src/config/episodes/familles";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/** La page de choix range les épisodes par famille : aucun ne doit s'y perdre. */
describe("les familles d'épisodes", () => {
  it("rangent chaque épisode du registre dans une famille et une seule", () => {
    const ranges = FAMILLES.flatMap((f) => f.episodes);
    expect([...ranges].sort()).toEqual(EPISODES.map((e) => e.code).sort());
    expect(new Set(ranges).size).toBe(ranges.length);
  });

  it("se lisent dans l'ordre des numéros, de haut en bas de la page", () => {
    // Les numéros suivaient l'ordre d'écriture, et la page, rangée par
    // famille, sautait de 1 à 12, puis 16, puis revenait à 4 : des lecteurs
    // l'ont relevé. Le numéro est maintenant la place sur la page.
    expect(FAMILLES.flatMap((f) => f.episodes)).toEqual(EPISODES.map((e) => e.code));
  });

  it("ont chacune un code unique et au moins deux épisodes", () => {
    expect(new Set(FAMILLES.map((f) => f.code)).size).toBe(FAMILLES.length);
    for (const f of FAMILLES) expect(f.episodes.length, f.code).toBeGreaterThanOrEqual(2);
  });

  it("appartiennent chacune à un secteur connu", () => {
    const codes = SECTEURS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const f of FAMILLES) expect(codes, f.code).toContain(f.secteur);
  });

  it("se suivent par secteur : la page ouvre chaque secteur une seule fois", () => {
    // Un secteur qui reviendrait plus bas couperait sa section en deux.
    const suite = FAMILLES.map((f) => f.secteur).filter((s, i, t) => i === 0 || t[i - 1] !== s);
    expect(new Set(suite).size).toBe(suite.length);
  });
});
