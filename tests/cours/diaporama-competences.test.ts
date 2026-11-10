import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { LES_OPERATIONS_EN_DEVISES } from "@/config/cours/chapitres/les-operations-en-devises";
import { competencesAffichees } from "@/config/cours/competences-affichees";
import { planDuDiaporama } from "@/pedagogy/cours/diaporama";

/**
 * LE DIAPORAMA DE L'ENSEIGNANT NE NOMME QUE LE DIPLÔME CHOISI (décision du propriétaire, novembre 2026),
 * comme la page du chapitre (config/cours/competences-affichees.ts) : sa diapositive de titre ne liste
 * que les compétences de ce diplôme, sous un titre qui le nomme.
 */
const cas = casDeLEntreprise("nova");
const titre = (diplome: string | null) => {
  const plan = planDuDiaporama(LES_OPERATIONS_EN_DEVISES, cas, competencesAffichees(LES_OPERATIONS_EN_DEVISES, { demande: diplome }));
  return JSON.stringify(plan.find((d) => d.role === "titre"));
};

describe("la diapositive de titre du diaporama, réduite au diplôme choisi", () => {
  it("depuis le DCG, seulement l'UE10", () => {
    const t = titre("dcg");
    expect(t).toContain("Compétences du référentiel · DCG");
    expect(t).toContain("UE10");
    expect(t).not.toMatch(/BTS CG|BUT GEA|P1 ·|P2 ·/);
  });

  it("depuis le BTS CG, seulement P1 et P2", () => {
    const t = titre("bts-cg");
    expect(t).toMatch(/P1/);
    expect(t).toMatch(/P2/);
    expect(t).not.toContain("UE10");
  });
});
