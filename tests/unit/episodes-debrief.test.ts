import { describe, expect, it } from "vitest";
import { HASARD_HABITUEL, hasardDuDebrief, lienDuDebrief } from "../../src/config/episodes/debrief";
import { choisirLeHasard, jugerLeHasard } from "../../src/pedagogy/episodes/hasard-du-debrief";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * Le hasard du débrief ne punit pas la bonne méthode et ne fait pas payer un
 * réflexe : le tableau figé suit la règle, épisode par épisode.
 */
describe("le hasard du débrief", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.titre}`, () => {
      const g = hasardDuDebrief(ep.code);
      expect(g, "le tableau suit la règle").toBe(choisirLeHasard(ep));
      expect(jugerLeHasard(ep, g).defauts).toEqual([]);
    });
  }

  it("garde le n° 12 pour la majorité des épisodes", () => {
    const habituels = EPISODES.filter((ep) => hasardDuDebrief(ep.code) === HASARD_HABITUEL);
    expect(habituels.length).toBeGreaterThan(EPISODES.length / 2);
  });

  it("donne le lien du débrief", () => {
    expect(lienDuDebrief("marche-qui-s-ouvre")).toBe(
      `/entreprises/episode/marche-qui-s-ouvre?hasard=${hasardDuDebrief("marche-qui-s-ouvre")}`,
    );
  });

  it("refuse un hasard qui punit la bonne méthode", () => {
    // Sous le n° 12, la bonne méthode du projet qu'on n'ose pas arrêter finit 25e sur 30.
    const ep = EPISODES.find((e) => e.code === "projet-a-arreter")!;
    expect(jugerLeHasard(ep, 12).defauts.join(" ")).toMatch(/25e sur 30/);
  });
});
