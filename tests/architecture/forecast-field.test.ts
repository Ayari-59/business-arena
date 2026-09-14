import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * L'ARÈNE NE DEMANDE PLUS DE PLAN DE TRÉSORERIE.
 *
 * Le formulaire demandait, avant chaque tour, les ventes attendues et la
 * trésorerie de fin de tour. C'était un exercice scolaire greffé sur un jeu :
 * deux champs à remplir de tête, dont l'un conditionnait l'instruction d'un
 * emprunt — pas de plan, pas de prêt. Le prix à payer était double : la
 * lourdeur à chaque tour, et un verrou dont personne ne comprenait la cause
 * quand il tombait.
 *
 * Le moteur, lui, GARDE la capacité de juger un plan déposé par une autre voie
 * (`fiabiliteDuPlan`, `planDepose`) : les tests d'intégration s'en servent, et
 * une partie d'atelier pourrait le rouvrir. C'est l'arène qui ne le demande
 * plus. Sans plan à juger, la confiance de la banque reste où elle est — donc
 * le plafond et le taux du découvert aussi.
 *
 * Une garde de source, parce que la faute serait de remettre les champs sans
 * rétablir ce qui allait avec, ou de laisser le verrou de l'emprunt en place.
 */

const FORMULAIRE = readFileSync("src/components/decision-form.tsx", "utf-8");
const MOTEUR = readFileSync("src/engine/simulation/index.ts", "utf-8");

describe("le plan de trésorerie a quitté l'arène", () => {
  it("le formulaire ne demande plus ni ventes attendues ni trésorerie prévue", () => {
    expect(FORMULAIRE).not.toContain('name="expectedCash"');
    expect(FORMULAIRE).not.toContain('name="expectedUnits"');
  });

  it("l'emprunt n'est plus conditionné à un plan déposé", () => {
    // La ligne fautive, mot pour mot : elle mettait l'emprunt à zéro faute de
    // plan. Le champ retiré, elle aurait interdit d'emprunter à tout le monde.
    expect(MOTEUR).not.toContain("bank && !planFourni ? 0 : loanRequested");
    // Ce qui borne l'emprunt aujourd'hui, c'est la capacité d'endettement, pas
    // une pièce à fournir : la ligne part donc de la demande elle-même.
    expect(MOTEUR).toMatch(/const newLoan = (?:loanRequested|Math\.min\(loanRequested)/);
  });

  it("le découvert consenti reste dit, là où l'on décide d'emprunter", () => {
    // Il vivait dans le panneau du plan, parti avec lui. C'est pourtant le
    // chiffre qui dit jusqu'où la caisse peut descendre : il a suivi dans le
    // bloc « Financer ».
    const decouvert = FORMULAIRE.indexOf("Découvert autorisé");
    expect(decouvert, "le plafond de découvert n'est plus annoncé nulle part").toBeGreaterThan(-1);
    const financer = FORMULAIRE.lastIndexOf("💶 Financer", decouvert);
    expect(financer, "le plafond a quitté le bloc où l'on décide d'emprunter").toBeGreaterThan(-1);
  });
});
