import { describe, expect, it } from "vitest";
import {
  EQUIPES_DE_LA_SEANCE,
  N_IMPORTE_QUOI,
  jouerLaSeance,
  premierArret,
  scenarioDeLaSeance,
} from "../helpers/seance-d-essai";
import { toursAvantLArret } from "@/config/defaillance";

/**
 * P0-2 DE LA SÉANCE D'ESSAI : AU NIVEAU 3, EN CLASSE, PAS D'ARRÊT AVANT LE TOUR 4.
 *
 * Mesuré dans la séance (NOVA, niveau 3, 4 équipes et SoundBox, réglages par
 * défaut) : Écho Premium, qui suit « Viser la valeur », à l'arrêt à la clôture du
 * tour 2 ; BassBoost, le prix bas, au tour 3. La partie est rejouée ici avec les
 * décisions de la séance (`tests/helpers/seance-d-essai.ts`), sur dix graines,
 * puisque celle de la séance n'est pas connue.
 *
 * Décision du propriétaire : l'arrêt reste possible, mais pas avant le tour 4, et
 * « Viser la valeur » doit rester viable pour une équipe qui pilote moyennement.
 * Une équipe qui fait n'importe quoi s'arrête encore, au tour 4 ou après.
 */
const GRAINES = [1, 2, 3, 4, 5, 6, 7, 8, 20260101, 4242];

describe("la séance d'essai rejouée, en classe au niveau 3", () => {
  const parties = GRAINES.map((graine) => jouerLaSeance({ graine }));

  it("Écho Premium, la valeur : aucun arrêt avant le tour 4 (et aucun du tout)", () => {
    for (const lignes of parties) {
      const arret = premierArret(lignes, "Écho Premium");
      expect(arret === null || arret >= 4).toBe(true);
    }
    // Viable : la route de la valeur, pilotée comme dans la séance, tient la partie.
    expect(parties.map((l) => premierArret(l, "Écho Premium"))).toEqual(GRAINES.map(() => null));
  });

  it("BassBoost, le prix bas à 42 € puis 39 € : aucun arrêt avant le tour 4", () => {
    for (const lignes of parties) {
      const arret = premierArret(lignes, "BassBoost");
      expect(arret === null || arret >= 4).toBe(true);
    }
  });

  it("une équipe qui fait n'importe quoi s'arrête encore, au tour 4 ou après", () => {
    for (const graine of GRAINES) {
      const lignes = jouerLaSeance({
        graine,
        equipes: EQUIPES_DE_LA_SEANCE.map((e) =>
          e.nom === "Équipe 4" ? { nom: "N'importe quoi", trajectoire: N_IMPORTE_QUOI } : e,
        ),
      });
      const arret = premierArret(lignes, "N'importe quoi");
      expect(arret).not.toBeNull();
      expect(arret!).toBeGreaterThanOrEqual(4);
    }
  });
});

describe("la règle ne vaut que pour la classe au niveau 3", () => {
  it("la classe au niveau 3 la fige dans son scénario", () => {
    expect(scenarioDeLaSeance({ graine: 1, concurrents: 5, genre: "class", niveau: 3 }).finance.premierTourDeDefaillance).toBe(4);
  });

  it("la partie solo, et la classe aux autres niveaux, gardent leur règle", () => {
    expect(scenarioDeLaSeance({ graine: 1, concurrents: 3, niveau: 3 }).finance).not.toHaveProperty("premierTourDeDefaillance");
    for (const niveau of [1, 2, 4, 5, 6]) {
      expect(
        scenarioDeLaSeance({ graine: 1, concurrents: 5, genre: "class", niveau }).finance,
      ).not.toHaveProperty("premierTourDeDefaillance");
    }
  });
});

describe("l'alerte de l'équipe en crise dit le vrai compte à rebours", () => {
  // L'alerte affiche « Encore N tours dans cet état » avec N = ceci − tours déjà en crise.
  const restants = (serie: number, tourAJouer: number, premier?: number) =>
    toursAvantLArret({ toursAvantDefaillance: 2, toursConsecutifs: serie, premierTourDeDefaillance: premier, tourAJouer }) - serie;

  it("sans premier tour, la règle d'avant : un tour de crise, encore un tour", () => {
    expect(restants(1, 2)).toBe(1);
  });

  it("en classe au niveau 3 : en crise dès le tour 1, l'arrêt attend le tour 4", () => {
    expect(restants(1, 2, 4)).toBe(3); // tours 2, 3 et 4 en crise
    expect(restants(2, 3, 4)).toBe(2); // tours 3 et 4
    expect(restants(3, 4, 4)).toBe(1); // le tour 4
    expect(restants(1, 4, 4)).toBe(1); // la règle des deux tours reprend la main
    expect(restants(1, 5, 4)).toBe(1);
  });
});
