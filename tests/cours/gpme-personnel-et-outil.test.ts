import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import {
  ENTREPRISES_OU_LE_POSTE_COMPTE,
  ECART_SOUS_LE_MARCHE,
  LE_DEPART_D_UN_SALARIE,
  TRIMESTRE_DU_RECRUTEMENT,
  anneeDuDepart,
  departDUnSalarie,
} from "../../src/config/cours/chapitres/le-depart-d-un-salarie";
import {
  ENTRETENIR_L_OUTIL,
  anneeSansEntretien,
  entretienDeLOutil,
  sensibiliteDesRebuts,
} from "../../src/config/cours/chapitres/entretenir-l-outil";
import {
  RECRUTER_DES_L_ANNONCE_DU_DEPART,
  anneeRemplaceeTot,
  remplacementAnticipe,
} from "../../src/config/cours/situations/par-chapitre/recruter-des-l-annonce-du-depart";
import { ENTRETENIR_AU_SEUIL, budgetAuSeuil, entretienAuSeuil } from "../../src/config/cours/situations/par-chapitre/entretenir-au-seuil";
import { anneeDeReference, surLAnnee } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { REFERENTIELS_DES_FORMATIONS } from "../../src/config/ateliers/referentiels";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { parcActifDuTour, referenceDEntretien } from "../../src/engine/simulation";
import { seuilDEntretien, updateAvailability } from "../../src/engine/production";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LE PERSONNEL ET L'OUTIL DE LA PME (parcours BTS GPME, palier 3).
 *
 * Deux chapitres et leurs cas dédiés, qui rejouent l'année du cours avec une décision changée
 * (gestion-de-la-pme.ts) : un salaire sous le marché qui fait partir un salarié, un trimestre
 * sans entretien. Ces gardes vérifient que leurs chiffres se recomposent entre eux et avec le
 * moteur, dans chaque entreprise où ils se jouent, que la restriction du chapitre du départ dit
 * vrai dans les deux sens, et que les textes se lisent : rien d'indéfini, pas de « de le », pas
 * de tiret au milieu d'une phrase, une seule bonne réponse, des notions qui existent.
 */

const pres = (a: number, b: number, ecart = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(ecart);
const resultat = (r: { incomeStatement: { operatingIncome: number } }) => r.incomeStatement.operatingIncome;

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

const DEUX_CHAPITRES: readonly Chapitre[] = [LE_DEPART_D_UN_SALARIE, ENTRETENIR_L_OUTIL];
const DEUX_CAS: readonly Situation[] = [RECRUTER_DES_L_ANNONCE_DU_DEPART, ENTRETENIR_AU_SEUIL];
const entreprisesDe = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));

describe("le personnel et l'outil : la place dans le parcours", () => {
  it("les titres sont ceux du programme, au palier 3 du parcours gpme, et les blocs existent au registre", () => {
    const entrees = new Set(REFERENTIELS_DES_FORMATIONS["bts-gpme"]!.entrees.map((x) => `BTS GPME ${x}`));
    for (const ch of DEUX_CHAPITRES) {
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(3);
      expect(PROGRAMME.gpme[3], ch.code).toContain(ch.titre);
      expect(ch.libre).toBe(false);
      for (const b of ch.blocs) expect(entrees.has(b), b).toBe(true);
    }
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises", () => {
    for (const [s, ch] of [
      [RECRUTER_DES_L_ANNONCE_DU_DEPART, LE_DEPART_D_UN_SALARIE],
      [ENTRETENIR_AU_SEUIL, ENTRETENIR_L_OUTIL],
    ] as const) {
      expect(s.reprend).toEqual([ch.code]);
      expect(s.palier).toBe(ch.palier);
      expect(s.parcours).toBe(ch.parcours);
      expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
      expect(s.libre).toBe(false);
      expect(s.blocs).toEqual([]);
      expect(s.code).not.toBe(ch.code);
      expect(s.commanditaire.length).toBeGreaterThan(3);
      // Sans cours : la question d'abord, aucune autre lecture, la réponse pour finir.
      expect(s.etapes[0]!.type).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
      expect(s.etapes.at(-1)!.type).toBe("choix");
    }
  });

  it("le départ ne se joue que là où le poste vide coûte des ventes, et la restriction le dit vrai", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const reference = anneeDeReference(code);
      const depart = anneeDuDepart(code);
      const k = TRIMESTRE_DU_RECRUTEMENT - 1;
      const perdues = soldUnits(reference[k]!) - soldUnits(depart[k]!);
      if ((ENTREPRISES_OU_LE_POSTE_COMPTE as readonly string[]).includes(code)) expect(perdues, code).toBeGreaterThan(0.5);
      else expect(perdues, code).toBeLessThanOrEqual(0.5);
    }
  });

  it("les verdicts varient d'une entreprise à l'autre : la réponse se lit dans les chiffres", () => {
    // Le départ ne se joue plus que chez NOVA : un seul verdict s'y lit. L'autre se calcule encore là où le
    // poste vide ne coûte aucune vente, hors du chapitre : la réponse vient des chiffres, pas d'une constante.
    expect(ENTREPRISES_OU_LE_POSTE_COMPTE.map((c) => departDUnSalarie(casDeLEntreprise(c)).verdict)).toEqual(["le-depart-coute-plus"]);
    expect(ENTREPRISES_OU_LE_POSTE_COMPTE.map((c) => remplacementAnticipe(casDeLEntreprise(c)).verdict)).toEqual(["recruter-tot"]);
    expect(new Set(ENTREPRISES_DU_COURS.map((c) => departDUnSalarie(casDeLEntreprise(c)).verdict)).size).toBe(2);
    expect(new Set(ENTREPRISES_DU_COURS.map((c) => remplacementAnticipe(casDeLEntreprise(c)).verdict)).size).toBe(2);
    // L'entretien : rien ne se perd là où l'outil ne limite pas l'activité, l'économie se perd ailleurs. Aucune
    // entreprise, cette année, ne perd des ventes en gardant l'économie : « l'économie tient » ne se lit pas.
    expect([...new Set(ENTREPRISES_DU_COURS.map((c) => entretienDeLOutil(casDeLEntreprise(c)).verdict))].sort()).toEqual(["l-economie-se-perd", "rien-ne-se-perd"]);
    // Seul le bistrot fait jouer l'entretien sur les rebuts : l'étape des rebuts et la réponse qui les nomme ne vivent que là.
    expect(ENTREPRISES_DU_COURS.filter((c) => sensibiliteDesRebuts(c) > 0)).toEqual(["bistrot"]);
  });
});

describe.each(ENTREPRISES_OU_LE_POSTE_COMPTE)("le départ d'un salarié chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const hr = scenarioByCode(code).scenario.hr!;

  it("un salarié part au trimestre 1, le poste reste vide un trimestre, le remplaçant arrive ensuite", () => {
    const r = departDUnSalarie(cas);
    const depart = anneeDuDepart(code);
    expect(1 - ECART_SOUS_LE_MARCHE).toBeLessThan(hr.attritionThreshold);
    expect(r.departs).toBe(1);
    expect(r.effectifVide).toBe(r.effectif - 1);
    expect(depart[TRIMESTRE_DU_RECRUTEMENT - 1]!.hr!.hired).toBe(1);
    // Au trimestre d'après, l'équipe est revenue à son effectif : sa capacité est celle de l'année de référence.
    expect(depart[TRIMESTRE_DU_RECRUTEMENT]!.production.laborCapacity).toBeCloseTo(
      anneeDeReference(code)[TRIMESTRE_DU_RECRUTEMENT]!.production.laborCapacity,
      6,
    );
  });

  it("l'économie, le salaire non versé et le recrutement sont ceux que le moteur facture", () => {
    const r = departDUnSalarie(cas);
    const reference = anneeDeReference(code);
    const depart = anneeDuDepart(code);
    const charges = (k: number) => depart[k]!.incomeStatement.fixedCosts - reference[k]!.incomeStatement.fixedCosts;
    expect(r.economie).toBe(Math.round(cas.personnel.effectif * hr.salaryPerEmployeePerRound * ECART_SOUS_LE_MARCHE));
    pres(charges(0), -r.economie, 0.01);
    pres(charges(TRIMESTRE_DU_RECRUTEMENT - 1), -(r.salaireNonVerse - r.recrutement), 0.01);
    expect(r.recrutement).toBe(hr.hiringCost);
    expect(r.salaireNonVerse).toBe(hr.salaryPerEmployeePerRound);
  });

  it("le coût complet du départ se recompose, et l'écart de l'année est l'économie moins ce coût", () => {
    const r = departDUnSalarie(cas);
    const reference = anneeDeReference(code);
    const depart = anneeDuDepart(code);
    expect(r.capacitePerdue).toBeGreaterThan(0);
    expect(r.ventesPerdues).toBeGreaterThan(0);
    expect(r.margePerdue).toBeGreaterThan(0);
    expect(r.capacitePerdue).toBe(r.capaciteAvant - r.capaciteVide);
    expect(r.margePerdue).toBe(r.margeAvant - r.margeVide);
    expect(r.margePerdueTotale).toBe(r.margePerdue + r.margePerdueEnsuite);
    expect(r.coutDuDepart).toBe(r.margePerdueTotale + r.recrutement - r.salaireNonVerse);
    // Le trimestre 1 porte l'économie, le trimestre vide la vacance : sa marge, le recrutement, le salaire non versé.
    const ecart = (k: number) => resultat(depart[k]!) - resultat(reference[k]!);
    pres(ecart(0), r.economie);
    pres(-ecart(TRIMESTRE_DU_RECRUTEMENT - 1), r.margePerdue + r.recrutement - r.salaireNonVerse);
    // Ensuite, l'équipe et ses charges sont revenues : l'écart de résultat n'est plus que de la marge. La gestion
    // prépare d'après ses ventes du trimestre d'avant : moins vendu, elle prépare moins, et vend moins.
    let suite = 0;
    for (let k = TRIMESTRE_DU_RECRUTEMENT; k < reference.length; k++) {
      pres(depart[k]!.incomeStatement.fixedCosts, reference[k]!.incomeStatement.fixedCosts, 0.01);
      pres(ecart(k), depart[k]!.incomeStatement.grossMargin - reference[k]!.incomeStatement.grossMargin, 0.01);
      expect(soldUnits(depart[k - 1]!)).toBeLessThan(soldUnits(reference[k - 1]!) - 0.5);
      expect(depart[k]!.production.planned).toBeLessThan(reference[k]!.production.planned - 0.5);
      suite += ecart(k);
    }
    pres(-suite, r.margePerdueEnsuite, 2);
    expect(r.ventesPerduesEnsuite).toBe(Math.round(surLAnnee(reference.slice(TRIMESTRE_DU_RECRUTEMENT), soldUnits)) - Math.round(surLAnnee(depart.slice(TRIMESTRE_DU_RECRUTEMENT), soldUnits)));
    expect(r.ventesPerduesEnsuite).toBeGreaterThan(0);
    expect(r.margePerdueEnsuite).toBeGreaterThan(0);
    expect(r.ecartDeResultat).toBe(r.resultatApres - r.resultatAvant);
    pres(r.ecartDeResultat, r.economie - r.coutDuDepart, 2);
    expect(r.verdict).toBe(r.ecartDeResultat < 0 ? "le-depart-coute-plus" : "l-economie-couvre");
  });

  it("le cas : recruté dès l'annonce, le poste n'est jamais vide, et l'écart entre les deux dates se recompose", () => {
    const e = remplacementAnticipe(cas);
    const tot = anneeRemplaceeTot(code);
    const reference = anneeDeReference(code);
    expect(e.effectifAuDepart).toBe(e.r.effectif);
    expect(tot[0]!.hr!.hired).toBe(1);
    expect(tot[0]!.hr!.departed).toBe(1);
    expect(e.venduesTot).toBe(e.r.venduesAnnee);
    expect(e.coutTot).toBe(e.r.recrutement);
    // Recruter dès l'annonce : le trimestre 1 porte l'économie moins le recrutement, la suite ne bouge pas.
    pres(resultat(tot[0]!) - resultat(reference[0]!), e.r.economie - e.r.recrutement);
    for (let k = 1; k < reference.length; k++) pres(resultat(tot[k]!) - resultat(reference[k]!), 0, 0.01);
    expect(e.gainDuRecrutementTot).toBe(e.r.coutDuDepart - e.coutTot);
    pres(e.ecartEntreLesDates, e.gainDuRecrutementTot, 2);
    expect(e.verdict).toBe(e.ecartEntreLesDates > 0 ? "recruter-tot" : "attendre");
  });
});

describe.each(ENTREPRISES_DU_COURS)("l'entretien de l'outil chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const scenario = scenarioByCode(code).scenario;
  const perte = scenario.production.availabilityDecay;

  it("le budget de référence est celui du parc, tel que le moteur le compte, et le seuil celui du moteur", () => {
    const e = entretienDeLOutil(cas);
    const etat = scenarioByCode(code).company("joueur", "x", "bot", "balanced");
    const s = { ...scenario, roundsCount: 4 };
    pres(e.budget, referenceDEntretien(s, parcActifDuTour(s, etat, 1), etat), 0.01);
    pres(e.seuil, seuilDEntretien(e.budget), 0.01);
    // Au seuil, la disponibilité ne bouge plus ; un peu en dessous, elle baisse.
    const au = (budget: number) =>
      updateAvailability({ current: 0.9, maintenanceBudget: budget, maintenanceReference: e.budget, availabilityDecay: perte, availabilityFloor: scenario.production.availabilityFloor });
    pres(au(seuilDEntretien(e.budget)), 0.9, 1e-9);
    expect(au(e.seuil - 1)).toBeLessThan(0.9);
    expect(e.economieAuSeuil).toBe(Math.round((e.budget - e.seuil) * 100) / 100);
  });

  it("la disponibilité et la capacité calculées sont celles que l'arène joue après le trimestre sans entretien", () => {
    const e = entretienDeLOutil(cas);
    const reference = anneeDeReference(code);
    const sans = anneeSansEntretien(code);
    const apres = updateAvailability({ current: 1, maintenanceBudget: 0, maintenanceReference: e.budget, availabilityDecay: perte, availabilityFloor: scenario.production.availabilityFloor });
    const ensuite = updateAvailability({ current: apres, maintenanceBudget: e.budget, maintenanceReference: e.budget, availabilityDecay: perte, availabilityFloor: scenario.production.availabilityFloor });
    pres(e.disponibiliteApres, apres * 100, 0.05);
    pres(e.disponibiliteEnsuite, ensuite * 100, 0.05);
    pres(e.capaciteReelleApres, e.capaciteApres);
    pres(e.capaciteReelleEnsuite, e.capaciteEnsuite);
    expect(e.capaciteAvecEnsuite).toBe(e.capacite);
    // Après ses trimestres d'entretien complet, et pas avant, l'outil a retrouvé sa capacité.
    const manquants = sans.filter((x, k) => x.production.machineCapacity < reference[k]!.production.machineCapacity - 0.01).length;
    expect(manquants).toBe(e.trimestresDeRetour);
    pres(sans[1 + e.trimestresDeRetour]!.production.machineCapacity, reference[1 + e.trimestresDeRetour]!.production.machineCapacity, 0.01);
    expect(sans[0]!.incomeStatement.maintenanceCost).toBe(0);
  });

  it("l'année rejouée : l'écart de résultat est l'entretien économisé moins la marge perdue", () => {
    const e = entretienDeLOutil(cas);
    pres(e.economie, e.budget, 0.01);
    pres(e.entretienApres, surLAnnee(anneeSansEntretien(code), (r) => r.incomeStatement.maintenanceCost), 0.02);
    pres(e.entretienAvant - e.entretienApres, e.economie, 0.001);
    expect(e.margePerdue).toBe(e.margeAvant - e.margeApres);
    expect(e.margePerdue).toBeGreaterThanOrEqual(0);
    pres(e.ecartDeResultat, e.economie - e.margePerdue, 2);
    if (e.verdict === "rien-ne-se-perd") pres(e.ecartDeResultat, e.economie);
    if (e.verdict === "l-economie-tient") {
      expect(e.ecartDeResultat).toBeGreaterThan(0);
      expect(e.ventesPerdues).toBeGreaterThan(0);
    }
    if (e.verdict === "l-economie-se-perd") expect(e.ecartDeResultat).toBeLessThanOrEqual(0);
    if (sensibiliteDesRebuts(code) > 0) {
      expect(e.rebutsEnPlus).toBeGreaterThan(0);
      expect(e.coutDesRebutsEnPlus).toBeGreaterThan(0);
    }
  });

  it("le cas : au seuil toute l'année, l'outil tient, et l'économie passe au résultat, moins les rebuts là où ils jouent", () => {
    const s = entretienAuSeuil(cas);
    expect(s.budget).toBe(budgetAuSeuil(cas));
    expect(s.budget).toBeGreaterThanOrEqual(s.e.seuil - 0.005);
    expect(s.budget - 1).toBeLessThan(s.e.seuil);
    expect(s.capacitePerdue).toBe(0);
    expect(s.capacitePlusBasse).toBe(s.capacitePlusBasseAvec);
    pres(s.economieDeLAnnee, (s.e.budget - s.budget) * s.trimestres, 0.02);
    if (sensibiliteDesRebuts(code) > 0) {
      expect(s.verdict).toBe("les-rebuts-en-reprennent");
      expect(s.budget).toBeLessThan(s.referenceDesRebuts);
    } else {
      expect(s.verdict).toBe("l-economie-passe-entiere");
      pres(s.ecartDeResultat, s.economieDeLAnnee);
    }
  });
});

const FAUTES_D_ACCORD = (u: string) =>
  new RegExp(`\\bun ${u}\\b|\\b${u} (vendu|perdu|produit|servi)\\b(?!e)|\\b${u}s (vendu|perdu|produit|servi)s\\b`, "i");

for (const contenu of [...DEUX_CHAPITRES, ...DEUX_CAS]) {
  describe.each(entreprisesDe(contenu))(`${contenu.code} chez %s`, (code) => {
    it("aucun texte ne sort undefined, « de le » ni un tiret ; une seule bonne réponse ; des libellés uniques ; les notions existent", () => {
      const cas = casDeLEntreprise(code);
      const chapitre = chapitreDuCas(contenu, cas);
      const notions = new Set(CONCEPTS.map((x) => x.code));
      const feminine = UNITES_FEMININES.has(cas.unite);
      for (const [i, e] of chapitre.etapes.entries()) {
        const etat = etatAvant(chapitre, cas, i);
        for (const x of textesDe(e, cas, etat)) {
          expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
          expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
          if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
          expect(x, `${e.id} : ${x}`).not.toMatch(/− −/);
          if (feminine) expect(x, `${e.id} : ${x}`).not.toMatch(FAUTES_D_ACCORD(cas.unite));
        }
        if (e.type === "choix") {
          const options = e.options(cas, etat);
          expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
          // L'élève (et le test de bout en bout) choisit une option par son texte : aucun n'en contient un autre.
          for (const o of options) for (const p of options) if (o !== p) expect(p.texte.includes(o.texte), `${e.id} : ${o.texte}`).toBe(false);
          if (contenu === DEUX_CAS.find((s) => s.code === contenu.code)) {
            const juste = options.find((o) => o.juste)!;
            const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
            expect(juste.texte.length, `${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
          }
        }
        if (e.type === "montants") {
          const champs = e.champs(cas, etat);
          expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
          for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        }
        if (e.tableau) {
          const t = e.tableau(cas);
          expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
          for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
        }
        for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
      }
      expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
      expect(new Set(chapitre.etapes.map((e) => e.titre)).size).toBe(chapitre.etapes.length);
    });
  });
}
