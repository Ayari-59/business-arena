import { describe, expect, it } from "vitest";
import { hasardDeLaClasse } from "../../src/config/episodes/fiches";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LA PRÉVISION NE SE LIT PAS SUR LE TABLEAU DE BORD.
 *
 * En semaine 1, l'élève prévoit une grandeur en la calculant dans les sources. Cinq épisodes
 * l'affichaient déjà, valeur de départ comprise, dans leur tableau de bord avant la première
 * semaine (fiche de « La brigade à bout », octobre 2026) : il suffisait de la recopier. Avant la
 * première semaine, aucun indicateur ne montre la réponse attendue.
 *
 * Une seule coïncidence, qui n'en est pas une fuite : chez « Les chambres pas prêtes », 4
 * chambres ne sont pas prêtes à 15 h, et la prévision demande 4 heures perdues.
 */
const COINCIDENCES: Readonly<Record<string, readonly string[]>> = { "chambres-pas-pretes": ["nonPretes"] };

describe("avant la première semaine", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} ${ep.code} : le tableau de bord ne montre pas la réponse à la prévision`, () => {
      const graine = hasardDeLaClasse(ep.code);
      const t = ep.simuler(ep.references[0]!.chemin, graine, ep.enquete.joursSansPerte);
      const reponse = ep.prevision.reel(t);
      const lecture = ep.lire([], graine, ep.enquete.joursSansPerte, 0) as Record<string, number | null>;
      for (const ind of ep.indicateurs) {
        if (COINCIDENCES[ep.code]?.includes(ind.cle)) continue;
        const v = lecture[ind.cle];
        if (v === null || v === undefined) continue;
        expect(Math.abs(v - reponse), `${ind.cle} = ${v}`).toBeGreaterThan(1e-6 * Math.max(1, Math.abs(reponse)));
      }
    });
  }
});
