import { describe, expect, it } from "vitest";
import { progressionLaPlusAvancee, vueDeLaClasse, type ProgressionLue } from "@/pedagogy/cours/suivi";
import { CHAPITRES } from "@/config/cours/registre";

/**
 * LA PROGRESSION D'UN ÉLÈVE DE CLASSE NE RECULE JAMAIS (décision du propriétaire du 11 novembre 2026 ;
 * audit UX du même jour, P1-5). Le scénario de l'audit : Léa a validé les étapes 2 et 3 ; son navigateur
 * oublie tout ; elle repart à « Étape 1 sur 7 », et dès son premier geste l'enseignante voyait « 2 sur
 * 7 · 0 du premier coup ». La fusion garde le plus avancé des deux.
 */

const r = (essais: number, aide = false) => ({ essais, reussi: true, aide });
const tente = (essais: number) => ({ essais, reussi: false, aide: false });

describe("la progression la plus avancée", () => {
  it("un envoi moins avancé ne remplace pas ce qui est enregistré", () => {
    const enregistree = { etape: 3, etapes: { a: r(1), b: r(1), c: r(2) } };
    const oubliee = { etape: 1, etapes: { a: r(1) } };
    expect(progressionLaPlusAvancee(enregistree, oubliee)).toEqual(enregistree);
  });

  it("un envoi plus avancé s'ajoute, étape par étape", () => {
    const enregistree = { etape: 2, etapes: { a: r(1), b: tente(1) } };
    const envoyee = { etape: 3, etapes: { a: r(1), b: r(2), c: tente(1) } };
    expect(progressionLaPlusAvancee(enregistree, envoyee)).toEqual({ etape: 3, etapes: { a: r(1), b: r(2), c: tente(1) } });
  });

  it("une étape réussie le reste, avec ses essais d'alors ; sinon, le plus d'essais", () => {
    // Refaite après « Recommencer », avec la correction : le premier passage reste celui qui compte.
    expect(progressionLaPlusAvancee({ etape: 7, etapes: { a: r(1) } }, { etape: 1, etapes: { a: r(3, true) } }).etapes.a).toEqual(r(1));
    expect(progressionLaPlusAvancee({ etape: 1, etapes: { a: tente(3) } }, { etape: 1, etapes: { a: tente(1) } }).etapes.a).toEqual(tente(3));
    expect(progressionLaPlusAvancee({ etape: 1, etapes: { a: tente(3) } }, { etape: 2, etapes: { a: r(4) } }).etapes.a).toEqual(r(4));
    // Rien d'enregistré : l'envoi tel quel.
    expect(progressionLaPlusAvancee(null, { etape: 2, etapes: { a: r(1) } })).toEqual({ etape: 2, etapes: { a: r(1) } });
  });

  it("la vue de l'enseignante ne recule plus : « Fini » reste « Fini »", () => {
    const chapitre = CHAPITRES[0]!;
    const n = chapitre.etapes.length;
    const fini = { etape: n, etapes: Object.fromEntries(chapitre.etapes.map((e) => [e.id, r(1)])) };
    const repartie = { etape: 1, etapes: { [chapitre.etapes[0]!.id]: r(1) } };
    const lue = (p: { etape: number; etapes: ProgressionLue["etapes"] }): ProgressionLue => ({
      eleve: "Léa",
      entreprise: "nova",
      erreurs: {},
      majLe: new Date(),
      ...p,
    });
    const avant = vueDeLaClasse(chapitre, [lue(repartie)]).eleves[0]!;
    const apres = vueDeLaClasse(chapitre, [lue(progressionLaPlusAvancee(fini, repartie))]).eleves[0]!;
    expect(avant.fini).toBe(false);
    expect(apres.fini).toBe(true);
    expect(apres.etape).toBe(n);
  });
});
