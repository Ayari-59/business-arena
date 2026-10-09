import { describe, expect, it } from "vitest";
import {
  SURFACES_COCKPIT,
  SURFACES_DE_LECTURE,
  SURFACES_PAPIER,
  estCockpit,
  estPapier,
} from "@/config/surfaces-de-lecture";

/**
 * LES DEUX SOLS SE DÉCLARENT (LOT 6A).
 *
 * Le lot 6A bascule l'écran de jeu sur le marine (cockpit) et laisse les zones
 * de LECTURE sur papier. Le critère est écrit dans `surfaces-de-lecture.ts` ;
 * cette garde l'énumère et tient trois invariants :
 *   · chaque surface déclare un rôle, un porteur et une raison ;
 *   · les deux ensembles sont disjoints (une surface n'est pas les deux sols) ;
 *   · les documents de lecture nommés par le brief sont bien du PAPIER, et les
 *     surfaces de pilotage bien du COCKPIT — on ne peut pas les y glisser par
 *     mégarde sans faire tomber la garde.
 */
describe("surfaces de lecture", () => {
  it("chaque surface est complète", () => {
    for (const s of SURFACES_DE_LECTURE) {
      expect(s.cle, "une clé").toBeTruthy();
      expect(s.porte, `un porteur pour ${s.cle}`).toBeTruthy();
      expect(s.raison.length, `une raison étoffée pour ${s.cle}`).toBeGreaterThan(20);
      expect(["papier", "cockpit"]).toContain(s.role);
    }
  });

  it("les clés sont uniques", () => {
    const cles = SURFACES_DE_LECTURE.map((s) => s.cle);
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("les deux sols sont disjoints", () => {
    for (const s of SURFACES_PAPIER) {
      expect(estPapier(s.cle)).toBe(true);
      expect(estCockpit(s.cle)).toBe(false);
    }
    for (const s of SURFACES_COCKPIT) {
      expect(estCockpit(s.cle)).toBe(true);
      expect(estPapier(s.cle)).toBe(false);
    }
  });

  it("les documents de lecture du brief sont du papier", () => {
    const attendus = [
      "courrier-du-tour",
      "situation-du-tour",
      "analyse-du-tour",
      "debrief-de-la-situation",
      "note-du-tour-precedent",
      "mandat-de-lequipe",
      "aides-longues",
      "textes-du-bilan",
    ];
    for (const cle of attendus) {
      expect(estPapier(cle), `${cle} doit rester un document papier`).toBe(true);
    }
  });

  it("les surfaces de pilotage sont le cockpit", () => {
    const attendus = [
      "ardoise-des-chiffres",
      "feuille-de-decision",
      "bande-de-marche",
      "classement-des-equipes",
      "tableau-de-bord-du-tour-clos",
    ];
    for (const cle of attendus) {
      expect(estCockpit(cle), `${cle} doit rester du cockpit`).toBe(true);
    }
  });
});
