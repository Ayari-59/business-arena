import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OBJECTIFS } from "@/config/orientation";
import { ATELIERS, atelierByCode } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { familyOf, isBuiltInScenarioCode } from "@/config/scenarios/registry";

/**
 * PARTIR DE CE QU'ON VEUT FAIRE TRAVAILLER.
 *
 * Le formulaire d'orientation pose quatre questions et rend UNE
 * recommandation. C'est ce qu'il faut à qui sait déjà ce qu'il veut
 * travailler ; un enseignant qui découvre se demande l'inverse — « la
 * trésorerie et le BFR, ça donne quoi ici ? » — et devait deviner l'objectif
 * pour obtenir une réponse, sans jamais voir l'étendue des objectifs
 * possibles.
 *
 * LA TABLE NE CALCULE RIEN : elle déplie le registre que le formulaire
 * interroge. Ce que la garde tient, c'est que ce registre reste utilisable
 * tel quel — un secteur qui ne résout plus, un niveau qui n'existe plus, un
 * objectif sans raison écrite, et la page affiche une ligne creuse sans que
 * rien n'échoue.
 */

const PAGE = readFileSync(join(process.cwd(), "src/app/orientation/page.tsx"), "utf8");
const AVEC_SECTEUR = OBJECTIFS.filter((o) => o.secteur !== null);

describe("l'orientation par objectif", () => {
  it("déplie le registre au lieu de recopier ses intitulés", () => {
    expect(PAGE).toContain("OBJECTIFS.filter");
    expect(PAGE).toContain("parObjectif()");
    for (const o of OBJECTIFS) {
      expect(PAGE, `l'intitulé « ${o.libelle} » est recopié dans la page`).not.toContain(o.libelle);
    }
  });

  it("ne propose que des objectifs utilisables", () => {
    expect(AVEC_SECTEUR.length).toBeGreaterThan(0);
    for (const o of AVEC_SECTEUR) {
      expect(isBuiltInScenarioCode(o.secteur), `${o.code} vise un secteur inconnu`).toBe(true);
      expect(
        DIFFICULTY_PRESETS.some((p) => p.level === o.niveauMinimum),
        `${o.code} exige un niveau qui n'existe pas`,
      ).toBe(true);
      // Une recommandation qui ne s'explique pas ne s'adopte pas, et ne se
      // discute pas non plus : c'est la règle de ce module depuis l'origine.
      expect(o.raison.length, `${o.code} n'explique pas son choix`).toBeGreaterThan(60);
    }
  });

  it("ne renvoie que vers des ateliers qui existent", () => {
    // Les ateliers d'un objectif se DÉDUISENT : ceux qui se jouent sur la même
    // famille de scénarios. Si le réglage d'un atelier pointait vers un code
    // inconnu, il disparaîtrait de la table sans erreur nulle part.
    const tete = (code: string) => familyOf(code)?.head ?? code;
    for (const a of ATELIERS) {
      expect(
        isBuiltInScenarioCode(a.reglages.scenarioCode),
        `l'atelier ${a.code} se joue sur un scénario inconnu`,
      ).toBe(true);
      expect(atelierByCode.get(a.code)).toBeTruthy();
    }
    // Et au moins un objectif doit trouver un atelier, sinon la colonne ne
    // garde rien.
    const servis = AVEC_SECTEUR.filter((o) =>
      ATELIERS.some((a) => tete(a.reglages.scenarioCode) === tete(o.secteur!)),
    );
    expect(servis.length).toBeGreaterThan(AVEC_SECTEUR.length / 2);
  });

  it("dit quand aucun atelier n'existe, au lieu de le taire", () => {
    // C'est une information utile : elle signifie que la séance reste à
    // écrire, et c'est ce qu'un enseignant a besoin de savoir avant de
    // choisir.
    expect(PAGE).toContain("Aucun atelier publié sur ce métier");
  });
});
