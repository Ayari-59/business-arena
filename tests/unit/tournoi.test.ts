import { describe, expect, it } from "vitest";
import { composeGroups, qualifiers, type GroupStanding } from "@/competition";
import {
  formatDuTournoi,
  libelleFormatTournoi,
  LIMITES_CONCOURS,
} from "@/config/concours";

/**
 * LE FORMAT ANNONCÉ EST CELUI QUI AURA LIEU.
 *
 * Une fiche de tournoi annonce des groupes et des finalistes devant tout un
 * campus. Si le calcul qui l'écrit n'est pas celui que le produit exécute, la
 * fiche ment, et personne ne le voit avant le jour du tirage. Ces tests ne
 * vérifient donc pas une formule : ils font TOURNER le tirage du produit et
 * comparent.
 */
const equipesFactices = (n: number) => Array.from({ length: n }, (_, i) => `E${i + 1}`);

describe("format d'un tournoi", () => {
  it("annonce le tirage que le produit exécute", () => {
    for (const equipes of [2, 5, 9, 10, 12, 14, 15, 18, 24, 30]) {
      for (let taille = LIMITES_CONCOURS.tailleGroupe.min; taille <= LIMITES_CONCOURS.tailleGroupe.max; taille++) {
        const tire = composeGroups(equipesFactices(equipes), taille, 12345);
        const annonce = formatDuTournoi({ equipes, tailleGroupe: taille, qualifiesParGroupe: 1 });
        expect(annonce.groupes, `${equipes} équipes en groupes de ${taille}`).toBe(tire.length);
        expect(
          [...annonce.equipesParGroupe].sort((a, b) => a - b),
          `${equipes} équipes en groupes de ${taille} : répartition`,
        ).toEqual(tire.map((g) => g.length).sort((a, b) => a - b));
      }
    }
  });

  it("annonce le nombre de finalistes que la qualification produit", () => {
    const standing = (id: string, bpi: number): GroupStanding => ({
      entryId: id,
      bpi,
      financial: 0,
      lastTreasury: 0,
    });
    for (const equipes of [6, 10, 12, 15, 20, 30]) {
      for (const taille of [3, 4, 5]) {
        for (const parGroupe of [1, 2, 3]) {
          const tire = composeGroups(equipesFactices(equipes), taille, 7);
          const groupes: GroupStanding[][] = tire.map((g) =>
            g.map((nom, i) => standing(nom, 100 - i)),
          );
          // La même arithmétique que le produit applique avant d'appeler
          // `qualifiers` : c'est elle qui plafonne la finale.
          const cible = Math.min(
            LIMITES_CONCOURS.finalistesMax,
            Math.max(2, groupes.length * parGroupe),
          );
          const reels = qualifiers(groupes, parGroupe, cible).length;
          const annonce = formatDuTournoi({
            equipes,
            tailleGroupe: taille,
            qualifiesParGroupe: parGroupe,
          });
          expect(
            annonce.finalistes,
            `${equipes} équipes, groupes de ${taille}, ${parGroupe} par groupe`,
          ).toBe(reels);
        }
      }
    }
  });

  it("quinze équipes en groupes de quatre font trois groupes de cinq, pas quatre groupes", () => {
    // Le piège du quotient entier, écrit noir sur blanc : c'est l'erreur qu'une
    // fiche commet naturellement, et celle qui se voit devant le campus.
    const f = formatDuTournoi({ equipes: 15, tailleGroupe: 4, qualifiesParGroupe: 2 });
    expect(f.groupes).toBe(3);
    expect(f.equipesParGroupe).toEqual([5, 5, 5]);
    expect(f.finalistes).toBe(6);
    expect(libelleFormatTournoi({ equipes: 15, tailleGroupe: 4, qualifiesParGroupe: 2 })).toBe(
      "3 poules de 5 équipes, 6 équipes finalistes.",
    );
  });

  it("la finale ne dépasse jamais son plafond, et le dit", () => {
    const f = formatDuTournoi({ equipes: 30, tailleGroupe: 3, qualifiesParGroupe: 4 });
    expect(f.finalistes).toBe(LIMITES_CONCOURS.finalistesMax);
    expect(f.plafonnee).toBe(true);
  });
});
