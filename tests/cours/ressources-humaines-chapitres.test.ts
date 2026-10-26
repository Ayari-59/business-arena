import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { FORMER, formation } from "../../src/config/cours/chapitres/former";
import { INDICATEURS_SOCIAUX, indicateursSociaux } from "../../src/config/cours/chapitres/indicateurs-sociaux";
import { RECRUTER, recrutement } from "../../src/config/cours/chapitres/recruter";
import { REMUNERATION_ET_MOTIVATION, remuneration } from "../../src/config/cours/chapitres/remuneration-et-motivation";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { ECART_D_INDICE, EMBAUCHES } from "../../src/config/cours/ressources-humaines";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES QUATRE DERNIERS CHAPITRES DU PARCOURS RESSOURCES HUMAINES DU BAC STMG.
 *
 * Recruter, rémunérer, former, lire les indicateurs sociaux : chaque chapitre rejoue l'année du
 * cours avec une décision de l'équipe (ressources-humaines.ts). Ces gardes vérifient que ses
 * chiffres se recomposent entre eux et avec le moteur, dans chaque entreprise du cours, et que
 * ses textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, une seule bonne
 * réponse par question.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
  }
}

const QUATRE: readonly Chapitre[] = [RECRUTER, REMUNERATION_ET_MOTIVATION, FORMER, INDICATEURS_SOCIAUX];

describe("le parcours ressources humaines du bac STMG", () => {
  it("a ses six chapitres, dans l'ordre de sa carte, et n'est plus en préparation", () => {
    const rh = CHAPITRES.filter((c) => c.parcours === "stmg-rh").map((c) => c.titre);
    expect(rh).toEqual(PROGRAMME["stmg-rh"][1]);
    expect(PARCOURS.find((p) => p.code === "stmg-rh")!.enPreparation).toBeUndefined();
  });
});

describe.each(ENTREPRISES_DU_COURS)("les chapitres RH chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const hr = scenarioByCode(code).scenario.hr!;

  it("recruter : l'embauche coûte son recrutement et ses salaires, et doit faire vendre de quoi les payer", () => {
    const r = recrutement(cas);
    expect(r.coutDuRecrutement).toBe(hr.hiringCost * EMBAUCHES);
    expect(r.salaires).toBe(hr.salaryPerEmployeePerRound * EMBAUCHES * r.trimestresAvecLui);
    expect(r.coutDeLEmbauche).toBe(r.coutDuRecrutement + r.salaires);
    expect(r.ventesPourSePayer * r.margeUnitaire).toBeGreaterThanOrEqual(r.coutDeLEmbauche);
    expect((r.ventesPourSePayer - 1) * r.margeUnitaire).toBeLessThan(r.coutDeLEmbauche);
    expect(r.capaciteApres).toBeGreaterThan(r.capaciteAvant);
    expect(r.verdict).toBe(r.ecartDeResultat > 0 ? "se-paie" : r.venduesEnPlus > 0 ? "pas-assez" : "rien-de-plus");
  });

  it("rémunération : la baisse fait une économie, et sous le seuil, l'équipe perd des salariés", () => {
    const r = remuneration(cas);
    expect(r.ecart).toBe(Math.round(ECART_D_INDICE * 100));
    expect(100 - r.ecart).toBeLessThan(r.seuil);
    expect(r.economieDuTrimestre).toBe(Math.round(cas.personnel.effectif * hr.salaryPerEmployeePerRound * ECART_D_INDICE));
    expect(r.economieDeLAnnee).toBeGreaterThan(0);
    expect(r.departs).toBeGreaterThan(0);
    expect(r.effectifFinal).toBe(r.effectif - r.departs);
    expect(r.ecartDeResultat).toBe(r.resultatApres - r.resultatAvant);
    // Aux salaires habituels, personne ne part : la colonne de comparaison garde l'effectif.
    expect(r.effectifsHabituels).toEqual(r.effectifs.map(() => r.effectif));
  });

  it("former : la formation fait gagner de la capacité, à un coût par unité qui se compare à l'embauche", () => {
    const f = formation(cas);
    expect(f.capaciteGagnee).toBe(f.capaciteApres - f.capaciteAvant);
    expect(f.capaciteGagnee).toBeGreaterThan(0);
    expect(f.formerCouteMoins).toBe(f.coutParUnite < f.coutParUniteEmbauche);
    expect(f.coutDeLEmbauche).toBe(recrutement(cas).coutDeLEmbauche);
  });

  it("indicateurs sociaux : la rotation est les départs sur l'effectif moyen, tels que le moteur les compte", () => {
    const s = indicateursSociaux(cas);
    expect(s.departs).toBe(s.trimestres.reduce((t, x) => t + x.departs, 0));
    expect(s.rotation).toBeCloseTo((s.departs / s.effectifMoyen) * 100, 0);
    for (const t of s.trimestres) expect(t.caParSalarie).toBe(Math.round(t.ventes / t.effectif));
  });

  for (const ch of QUATRE) {
    it(`${ch.code} : aucun texte ne sort undefined, « de le » ni un tiret ; une seule bonne réponse ; les notions existent`, () => {
      const chapitre = chapitreDuCas(ch, cas);
      const notions = new Set(CONCEPTS.map((x) => x.code));
      for (const [i, e] of chapitre.etapes.entries()) {
        const etat = etatAvant(chapitre, cas, i);
        for (const x of textesDe(e, cas, etat)) {
          expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
          expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
          // Un négatif prend le signe moins, et retranché, il va entre parenthèses.
          // (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
          if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/− −/);
        }
        if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
        for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
      }
    });
  }
});
