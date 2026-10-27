import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { FORMER, formation } from "../../src/config/cours/chapitres/former";
import { INDICATEURS_SOCIAUX, indicateursSociaux } from "../../src/config/cours/chapitres/indicateurs-sociaux";
import { RECRUTER, recrutement } from "../../src/config/cours/chapitres/recruter";
import { TRIMESTRE_DE_L_EMBAUCHE_DECALEE, embaucheDecalee } from "../../src/config/cours/situations/par-chapitre/embaucher-un-trimestre-plus-tard";
import { masseQuiBaisse } from "../../src/config/cours/situations/par-chapitre/la-masse-salariale-qui-baisse";
import { INDICE_DEMANDE, hausseDemandee } from "../../src/config/cours/situations/par-chapitre/l-equipe-demande-une-augmentation";
import { REMUNERATION_ET_MOTIVATION, anneeAuxSalaires, remuneration } from "../../src/config/cours/chapitres/remuneration-et-motivation";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { ECART_D_INDICE, EMBAUCHES, rejouerLAnnee } from "../../src/config/cours/ressources-humaines";
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
    expect(r.effectifFinal).toBe(r.effectif - r.departs + r.embauches);
    expect(r.ecartDeResultat).toBe(r.resultatApres - r.resultatAvant);
    // Aux salaires habituels, personne ne part : la colonne de comparaison est l'effectif de l'année
    // jouée, embauches du bon gestionnaire comprises, et sa masse salariale en suit l'effectif.
    const base = rejouerLAnnee(code, "base", () => undefined);
    expect(base.every((x) => (x.hr?.departed ?? 0) === 0)).toBe(true);
    expect(r.effectifsHabituels).toEqual(base.map((x) => x.hr?.headcount ?? r.effectif));
    expect(r.masseAvant).toBe(Math.round(r.effectifsHabituels.reduce((t, n) => t + n * hr.salaryPerEmployeePerRound, 0)));
    expect(r.masseApres).toBe(Math.round(r.effectifs.reduce((t, n) => t + n * hr.salaryPerEmployeePerRound * (1 - ECART_D_INDICE), 0)));
    // Seule la rémunération change : aux salaires baissés, les embauches de l'année jouée sont gardées,
    // trimestre par trimestre, et l'indice baissé est joué à chaque trimestre. Le conseil seul embauche.
    const baisse = anneeAuxSalaires(code, "salaires-baisses", 1 - ECART_D_INDICE);
    expect(baisse.map((x) => x.hr!.hired)).toEqual(base.map((x) => x.hr?.hired ?? 0));
    expect(baisse.map((x) => x.hr!.salaryIndex)).toEqual(baisse.map(() => 1 - ECART_D_INDICE));
    expect(r.embauches).toBe(code === "conseil" ? 2 : 0);
  });

  it("les rejeux jouent la décision voulue, au trimestre voulu, sans l'empiler ni effacer les embauches de l'année jouée", () => {
    // Les rejeux des chapitres et de leurs cas, sous leurs clés : appelés après les fonctions, ils
    // rendent l'année que celles-ci ont jouée.
    recrutement(cas);
    embaucheDecalee(cas);
    formation(cas);
    hausseDemandee(cas);
    const base = rejouerLAnnee(code, "base", () => undefined);
    const embauches = (t: number) => base[t - 1]!.hr?.hired ?? 0;
    // L'embauche du chapitre s'ajoute au 1er trimestre, celle du cas au 2e, à celles du bon gestionnaire.
    const avec = rejouerLAnnee(code, "embauche:en-plus", () => undefined);
    expect(avec[0]!.hr!.hired).toBe(embauches(1) + EMBAUCHES);
    const decalee = rejouerLAnnee(code, "embauche-decalee:en-plus", () => undefined);
    expect(decalee[TRIMESTRE_DE_L_EMBAUCHE_DECALEE - 1]!.hr!.hired).toBe(embauches(TRIMESTRE_DE_L_EMBAUCHE_DECALEE) + EMBAUCHES);
    // La formation ne se paie qu'au 1er trimestre : le formulaire ne la reconduit pas.
    const formee = rejouerLAnnee(code, "formation", () => undefined);
    expect(formee.map((x) => x.hr?.trainingBudget ?? 0)).toEqual(formee.map((_, i) => (i === 0 ? hr.trainingScale : 0)));
    // Les salaires demandés, à chaque trimestre, les embauches de l'année jouée gardées.
    const hausse = anneeAuxSalaires(code, "salaires-montes", INDICE_DEMANDE);
    expect(hausse.map((x) => x.hr!.salaryIndex)).toEqual(hausse.map(() => INDICE_DEMANDE));
    expect(hausse.map((x) => x.hr!.hired)).toEqual(base.map((x) => x.hr?.hired ?? 0));
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
    // Le chiffre d'affaires par salarié monte partout ; il monte surtout parce que l'équipe fond, sauf
    // au conseil, dont les embauches de l'année jouée sont gardées : là, ce sont les ventes.
    const premier = s.trimestres[0]!;
    const dernier = s.trimestres.at(-1)!;
    expect(s.caParSalarieFin).toBeGreaterThan(s.caParSalarieDebut);
    expect(s.parLEquipe).toBe(premier.effectif / dernier.effectif >= dernier.ventes / premier.ventes);
    expect(s.parLEquipe).toBe(code !== "conseil");
    // Le cas « La masse salariale qui baisse » : chaque trimestre, sauf là où les embauches gardées
    // compensent les départs (au conseil), et sa phrase le dit.
    const m = masseQuiBaisse(cas);
    expect(m.baisseChaqueTrimestre).toBe(s.trimestres.every((t, i) => i === 0 || t.masse < s.trimestres[i - 1]!.masse));
    expect(m.baisseChaqueTrimestre).toBe(code !== "conseil");
    const lecture = INDICATEURS_SOCIAUX.etapes.find((e) => e.id === "lecture");
    if (lecture?.type !== "choix") throw new Error("Pas d'étape lecture");
    expect(lecture.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toBe(
      s.parLEquipe ? "Il monte parce que l'équipe fond, pas parce qu'elle vend mieux" : "Il monte surtout avec les ventes du trimestre, pendant que l'équipe perd des salariés",
    );
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
