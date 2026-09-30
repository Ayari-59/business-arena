import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import {
  AU_DELA_DE_L_ATELIER,
  CLES_ECRITES,
  couvertureDeLAtelier,
  tousLesBlocs,
} from "@/config/couverture";

/**
 * LA COUVERTURE D'UN RÉFÉRENTIEL SE DÉRIVE, ET CE QUI RESTE ÉCRIT DÉSIGNE
 * QUELQUE CHOSE DE RÉEL.
 *
 * Le tableau bloc par bloc était écrit à la main pour quatre diplômes. Il
 * oubliait deux processus du BTS CG (P2 et P7) sans que personne ne le voie,
 * parce qu'un oubli dans une liste écrite à la main ne se voit pas : il faut
 * connaître la liste entière pour remarquer ce qui n'y est pas.
 *
 * Deux dangers maintenant que la liste se dérive du déroulé des séances.
 *
 * Le premier : une phrase écrite pour un bloc qui n'existe plus. Le référentiel
 * du BTS MCO renomme un bloc, la clé de COMMENTAIRES ne correspond plus, et la
 * phrase disparaît de la page sans erreur nulle part — la page se vide de sa
 * substance en silence, ce qui est exactement le défaut que la dérivation
 * devait supprimer.
 *
 * Le second : une adéquation corrigée à la main qui dirait l'inverse du
 * comptage sans raison. La correction est légitime, elle doit rester rare et
 * nommée ; qu'elle porte sur un bloc réel est le minimum.
 */

describe("la couverture des référentiels", () => {
  it("chaque atelier publié a une couverture non vide", () => {
    expect(ATELIERS.length, "aucun atelier au registre").toBeGreaterThan(0);
    for (const a of ATELIERS) {
      const blocs = couvertureDeLAtelier(a.code);
      expect(
        blocs.length,
        `l'atelier « ${a.code} » ne couvre aucun bloc`,
      ).toBeGreaterThan(0);
      for (const b of blocs) {
        expect(
          b.seances.length,
          `${a.code} / ${b.referentiel} : aucune séance`,
        ).toBeGreaterThan(0);
        expect(b.seancesEnTout, `${a.code} : le total des séances`).toBe(
          a.seances.length,
        );
        expect(
          b.seances.length,
          `${a.code} / ${b.referentiel} : plus de séances que l'atelier n'en a`,
        ).toBeLessThanOrEqual(a.seances.length);
      }
    }
  });

  it("aucun bloc nommé par une séance ne manque à sa couverture", () => {
    // C'est la règle qui manquait au tableau écrit à la main : l'oubli.
    for (const a of ATELIERS) {
      const rendus = new Set(
        couvertureDeLAtelier(a.code).map((b) => b.referentiel),
      );
      for (const s of a.seances) {
        for (const bloc of s.processus) {
          expect(
            rendus,
            `${a.code}, séance ${s.numero} : « ${bloc} » n'est pas couvert`,
          ).toContain(bloc);
        }
      }
    }
  });

  it("toute phrase écrite à la main désigne un bloc qui existe", () => {
    const reels = new Set(tousLesBlocs());
    expect(reels.size, "aucun bloc au registre").toBeGreaterThan(0);
    const orphelines = [
      ...CLES_ECRITES.commentaires,
      ...CLES_ECRITES.adequations,
    ].filter((cle) => !reels.has(cle));
    expect(
      orphelines,
      `clés qui ne désignent aucun bloc de référentiel :\n${orphelines.join("\n")}`,
    ).toEqual([]);
  });

  it("les notes hors séance portent sur un atelier réel et sur un bloc qu'il n'a pas", () => {
    const codes = new Set(ATELIERS.map((a) => a.code));
    for (const [code, notes] of Object.entries(AU_DELA_DE_L_ATELIER)) {
      expect(codes, `note écrite pour l'atelier inconnu « ${code} »`).toContain(
        code,
      );
      const dansLAtelier = new Set(
        couvertureDeLAtelier(code).map((b) => b.referentiel),
      );
      for (const note of notes) {
        // Une note « hors séance » qui nomme un bloc que l'atelier travaille
        // dirait deux fois la même chose, et la seconde fois en le niant.
        expect(
          dansLAtelier,
          `« ${note.referentiel} » est dit hors séance alors que ${code} le met en jeu`,
        ).not.toContain(note.referentiel);
      }
    }
  });

  it("les adéquations corrigées restent l'exception", () => {
    // Si la moitié des blocs doit être corrigée, c'est le comptage qu'il faut
    // revoir, pas les blocs un par un.
    const total = ATELIERS.reduce(
      (n, a) => n + couvertureDeLAtelier(a.code).length,
      0,
    );
    expect(CLES_ECRITES.adequations.length * 4).toBeLessThan(total);
  });
});
