import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import {
  CROITRE_EN_INVESTISSANT,
  TRIMESTRE_DE_L_ACHAT,
  anneeAvecLaMachine,
  anneeSansInvestir,
  investissement,
  machineDuChapitre,
} from "../../src/config/cours/chapitres/croitre-en-investissant";
import {
  BUDGET_RSE_EN_ECHELLES,
  LA_RESPONSABILITE_SOCIETALE,
  anneeEngagee,
  anneeProcessPropre,
  budgetRse,
  engagementRse,
  reglagesRse,
} from "../../src/config/cours/chapitres/la-responsabilite-societale";
import { VOIR_PLUS_GRAND, plusGrandeMachine, voirPlusGrand } from "../../src/config/cours/situations/par-chapitre/voir-plus-grand";
import {
  TRIMESTRES_AVANT_LE_LABEL,
  VISER_LE_LABEL,
  anneeVersLeLabel,
  budgetDuLabel,
  viserLeLabel,
} from "../../src/config/cours/situations/par-chapitre/viser-le-label";
import { anneeDeReference, surLAnnee } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { scenarioByCode, scenarioCodeForLevel } from "../../src/config/scenarios/registry";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { DEFAULT_RSE_CONFIG, RSE_CARD_CODES, evaluateRseCards, rseEffort } from "../../src/engine/rse";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { CompanyRoundResult } from "../../src/engine/types";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * CROÎTRE EN INVESTISSANT, ET LA RESPONSABILITÉ SOCIÉTALE (parcours stratégie et management,
 * paliers 3 et 4).
 *
 * Deux chapitres et leurs cas dédiés, qui rejouent l'année du cours avec une décision changée
 * (gestion-de-la-pme.ts) : une machine achetée au trimestre 1, un budget RSE chaque trimestre.
 * Ces gardes vérifient que le moteur honore ces décisions dans le scénario rejoué, que leurs
 * chiffres se recomposent entre eux et avec le moteur dans chacune des neuf entreprises, que les
 * verdicts se lisent dans les chiffres, et que les textes se lisent : rien d'indéfini, pas de
 * « de le », pas de tiret au milieu d'une phrase, une seule bonne réponse, des notions qui
 * existent.
 */

const pres = (a: number, b: number, ecart = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(ecart);
const somme = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => surLAnnee(annee, f);
const is = (r: CompanyRoundResult) => r.incomeStatement;

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

const DEUX_CHAPITRES: readonly Chapitre[] = [CROITRE_EN_INVESTISSANT, LA_RESPONSABILITE_SOCIETALE];
const DEUX_CAS: readonly Situation[] = [VOIR_PLUS_GRAND, VISER_LE_LABEL];
const entreprisesDe = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));
const niveauQuiOuvre = (levier: "investment" | "rse") => DIFFICULTY_PRESETS.find((p) => p.decisions[levier])!.level;

describe("croissance et RSE : la place dans le parcours", () => {
  it("les titres sont ceux du programme, aux paliers 3 et 4 du parcours stratégie, et les blocs existent tels quels au registre", () => {
    for (const [ch, palier] of [
      [CROITRE_EN_INVESTISSANT, 3],
      [LA_RESPONSABILITE_SOCIETALE, 4],
    ] as const) {
      expect(ch.parcours).toBe("strategie");
      expect(ch.palier).toBe(palier);
      expect(PROGRAMME.strategie[palier], ch.code).toContain(ch.titre);
      expect(ch.libre).toBe(false);
      expect(ch.blocs.length).toBeGreaterThan(0);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b);
        expect(r, b).not.toBeNull();
        expect(r!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
      }
    }
    expect(CROITRE_EN_INVESTISSANT.blocs).toEqual(["DCG UE6 · Finance d'entreprise", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir la stratégie de création de valeur"]);
    expect(LA_RESPONSABILITE_SOCIETALE.blocs).toContain("STMG Thème 3 · Les organisations et la société");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises", () => {
    for (const [s, ch] of [
      [VOIR_PLUS_GRAND, CROITRE_EN_INVESTISSANT],
      [VISER_LE_LABEL, LA_RESPONSABILITE_SOCIETALE],
    ] as const) {
      expect(s.reprend).toEqual([ch.code]);
      expect(s.palier).toBe(ch.palier);
      expect(s.parcours).toBe(ch.parcours);
      expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
      expect(s.libre).toBe(false);
      expect(s.blocs).toEqual([]);
      expect(s.code).not.toBe(ch.code);
      expect(s.commanditaire.length).toBeGreaterThan(3);
      expect(s.etapes[0]!.type).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
      expect(s.etapes.at(-1)!.type).toBe("choix");
    }
  });

  it("les décisions s'ouvrent aux niveaux 4 et 5, mais le moteur les honore dans le scénario de l'année du cours", () => {
    expect(niveauQuiOuvre("investment")).toBe(4);
    expect(niveauQuiOuvre("rse")).toBe(5);
    for (const code of ENTREPRISES_DU_COURS) {
      const r = investissement(casDeLEntreprise(code));
      expect(r.avec.capaciteOutil - r.sans.capaciteOutil, code).toBe(r.capacite);
      const engagee = anneeEngagee(code);
      expect(engagee[0]!.rse!.imageCapital, code).toBeGreaterThan(0);
      // Les réglages RSE et le catalogue d'équipements du niveau qui ouvre la décision sont ceux de l'année du cours.
      const s = scenarioByCode(code).scenario;
      expect(scenarioByCode(scenarioCodeForLevel(code, 5)).scenario.rse, code).toEqual(s.rse);
      expect(scenarioByCode(scenarioCodeForLevel(code, 5)).scenario.marketing.scale, code).toBe(s.marketing.scale);
      expect(scenarioByCode(scenarioCodeForLevel(code, 4)).scenario.equipment!.types, code).toEqual(s.equipment!.types);
    }
  });

  it("sans achat, le drapeau du parc ne change rien à l'année du cours", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const a = anneeSansInvestir(code);
      const b = anneeDeReference(code);
      for (const k of a.keys()) expect(is(a[k]!).netIncome, code).toBe(is(b[k]!).netIncome);
    }
  });

  it("les verdicts varient d'une entreprise à l'autre : la réponse se lit dans les chiffres", () => {
    const verdicts = (f: (c: Cas) => string) => [...new Set(ENTREPRISES_DU_COURS.map((c) => f(casDeLEntreprise(c))))].sort();
    // Sur l'année du cours, le bon gestionnaire produit la demande qu'il a vue : la machine paie là
    // où l'outil bridait des ventes manquées ; elle fait vendre trop peu pour payer là où l'outil ne
    // bridait qu'à peine ; elle ne fait rien vendre là où l'équipe plafonne avant l'outil, ou là où
    // l'outil ne manquait pas. Les trois réponses du chapitre se rencontrent, et les trois du cas.
    expect(verdicts((c) => investissement(c).verdict)).toEqual(["croitre-paie", "la-capacite-ne-manquait-pas", "la-demande-ne-suit-pas"]);
    expect(ENTREPRISES_DU_COURS.filter((c) => investissement(casDeLEntreprise(c)).verdict === "croitre-paie")).toEqual(["nova", "boutique", "fitness", "transport"]);
    expect(ENTREPRISES_DU_COURS.filter((c) => investissement(casDeLEntreprise(c)).verdict === "la-demande-ne-suit-pas")).toEqual(["bistrot", "batiment"]);
    const sansVenteEnPlus = ENTREPRISES_DU_COURS.map((c) => investissement(casDeLEntreprise(c))).filter((r) => r.verdict === "la-capacite-ne-manquait-pas");
    expect([...new Set(sansVenteEnPlus.map((r) => r.equipeLimite))].sort()).toEqual([false, true]);
    // L'outil agrandi fait embaucher le bon gestionnaire chez les unes, pas chez les autres.
    expect([...new Set(ENTREPRISES_DU_COURS.map((c) => investissement(casDeLEntreprise(c)).embauchesEnPlus > 0))].sort()).toEqual([false, true]);
    expect(verdicts((c) => voirPlusGrand(c).verdict)).toEqual(["aucune", "la-grande", "la-petite"]);
    // Le bon gestionnaire produit aussi la demande que l'engagement RSE amène : elle se vend
    // partout. La branche « la demande gagnée ne se vend pas » du chapitre n'est lue dans aucune
    // entreprise ; restent les deux autres, selon que la marge gagnée paie ou non l'engagement.
    expect(verdicts((c) => engagementRse(c).verdict)).toEqual(["paie-deja", "pas-encore"]);
    for (const c of ENTREPRISES_DU_COURS) expect(engagementRse(casDeLEntreprise(c)).ventesGagnees, c).toBeGreaterThan(0);
    expect(verdicts((c) => engagementRse(c).label)).toEqual(["jamais", "plus-tard"]);
    // Le label n'arrive qu'au trimestre 4 : nulle part l'année ne finit mieux qu'au budget de départ
    // (la branche « visons le label » du cas n'est lue dans aucune entreprise). La demande en plus
    // est servie partout, mais trop tard pour payer le budget : la branche « la demande en plus
    // n'est pas servie » n'est plus lue non plus.
    expect(verdicts((c) => viserLeLabel(c).verdict)).toEqual(["pas-cette-annee"]);
    const servie = (c: Cas) => viserLeLabel(c).label.ventes > viserLeLabel(c).chapitre.ventes;
    expect(ENTREPRISES_DU_COURS.filter((c) => servie(casDeLEntreprise(c)))).toEqual(ENTREPRISES_DU_COURS);
    // Seuls le bistrot et le marchand en ligne comptent des rebuts : l'étape du process propre ne vit que là.
    expect(ENTREPRISES_DU_COURS.filter((c) => engagementRse(casDeLEntreprise(c)).aDesRebuts)).toEqual(["bistrot", "ecommerce"]);
  });
});

describe.each(ENTREPRISES_DU_COURS)("croître en investissant chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const k = TRIMESTRE_DE_L_ACHAT; // l'indice du trimestre où la machine entre en service

  it("la machine est le premier équipement du cas, l'emprunt est accordé en entier, la capacité entre au trimestre suivant", () => {
    const m = machineDuChapitre(code);
    expect(m.name).toBe(cas.immobilisation.designation);
    expect(m.costPerUnit).toBe(cas.immobilisation.prixUnitaire);
    const sans = anneeSansInvestir(code);
    const avec = anneeAvecLaMachine(code, m, "emprunt");
    expect((avec[0]!.debt?.newLoan ?? 0) - (sans[0]!.debt?.newLoan ?? 0)).toBe(m.costPerUnit);
    for (const r of avec) expect(r.debt?.loanRefused ?? 0).toBe(0);
    expect(avec[0]!.investment?.outlay).toBe(m.costPerUnit);
    // L'achat et son emprunt ne se jouent qu'au trimestre de l'achat : le formulaire ne les reconduit pas.
    for (let t = TRIMESTRE_DE_L_ACHAT; t < avec.length; t++) {
      expect(avec[t]!.investment?.outlay ?? 0, `T${t + 1}`).toBe(0);
      expect((avec[t]!.debt?.newLoan ?? 0) - (sans[t]!.debt?.newLoan ?? 0), `T${t + 1}`).toBe(0);
    }
    expect(avec[0]!.production.machineCapacity).toBe(sans[0]!.production.machineCapacity);
    // La machine compte une fois, à chaque trimestre où elle sert : le parc sans doublon.
    for (let t = k; t < avec.length; t++) pres(avec[t]!.production.machineCapacity - sans[t]!.production.machineCapacity, m.capacityPerUnit, 1e-6);
  });

  it("l'amortissement et les intérêts du chapitre sont ceux que le moteur compte", () => {
    const r = investissement(cas);
    const sans = anneeSansInvestir(code);
    const avec = anneeAvecLaMachine(code, machineDuChapitre(code), "emprunt");
    pres(r.amortissement, somme(avec, (x) => is(x).depreciation) - somme(sans, (x) => is(x).depreciation), 0.02);
    expect(r.trimestresEnService).toBe(avec.length - TRIMESTRE_DE_L_ACHAT);
    expect(r.taux).toBeCloseTo(s.finance.loanAnnualRate * 100, 6);
    // Le capital dû à l'ouverture de chaque trimestre en service est celui de l'échéancier du moteur.
    r.lignes.forEach((l, i) => {
      pres(avec[i]!.balanceSheet.financialDebt - sans[i]!.balanceSheet.financialDebt, l.du, 0.05);
      pres(l.interets, (l.du * s.finance.loanAnnualRate) / 4, 0.01);
    });
    pres(r.interets, r.lignes.reduce((t, l) => t + l.interets, 0), 0.01);
    // Rien d'autre n'a changé que la marge, l'entretien, les salaires d'une embauche, l'amortissement,
    // les charges financières et l'impôt.
    for (const f of [(x: CompanyRoundResult) => is(x).marketingCost, (x: CompanyRoundResult) => is(x).qualityCost]) pres(somme(avec, f), somme(sans, f), 0.01);
    pres(r.chargesFixesEnPlus, somme(avec, (x) => is(x).fixedCosts) - somme(sans, (x) => is(x).fixedCosts), 1);
    // Des charges fixes en plus, ce sont des embauches que le bon gestionnaire n'aurait pas faites sans la machine.
    const embauches = (a: readonly CompanyRoundResult[]) => somme(a, (x) => x.hr?.hired ?? 0);
    expect(r.embauchesEnPlus).toBe(embauches(avec) - embauches(sans));
    expect(r.chargesFixesEnPlus > 0, code).toBe(r.embauchesEnPlus > 0);
    expect(r.chargesFixesEnPlus).toBeGreaterThanOrEqual(0);
  });

  it("l'année rejouée se recompose : marge, charges de la machine, résultat net, délai et rentabilité", () => {
    const r = investissement(cas);
    expect(r.margeUnitaire).toBe(Math.round((r.margeSans / r.venduesSans) * 100) / 100);
    expect(r.margeSiLaDemandeSuit).toBeGreaterThanOrEqual(r.margeGagnee);
    expect(r.capaciteGagnee).toBe(r.capacite * r.trimestresEnService);
    pres(r.exploitationGagnee, r.margeGagnee - r.entretienEnPlus - r.chargesFixesEnPlus - r.amortissementsEnPlus, 2);
    pres(r.resultatNetGagne, r.exploitationGagnee - r.chargesFinancieresEnPlus - r.impotEnPlus, 2);
    pres(r.amortissementsEnPlus, r.amortissement, 1);
    // Le bon gestionnaire reconduit son entretien sans le relever pour la machine de plus : le
    // texte « d'entretien en plus » n'est lu dans aucune entreprise.
    expect(r.entretienEnPlus).toBe(0);
    expect(r.caf).toBe(r.resultatNetGagne + Math.round(r.amortissement));
    if (r.caf > 0) pres(r.delai!, (r.cout * r.trimestresEnService) / r.caf, 0.05);
    else expect(r.delai).toBeNull();
    expect(r.rentabilite).toBe(Math.round((r.resultatNetGagne / r.cout) * 1000) / 10);
    const ventes = surLAnnee(anneeAvecLaMachine(code, machineDuChapitre(code), "emprunt"), soldUnits) - surLAnnee(anneeSansInvestir(code), soldUnits);
    if (r.verdict === "la-capacite-ne-manquait-pas") expect(Math.abs(ventes)).toBeLessThan(0.5);
    else expect(ventes).toBeGreaterThan(0.5);
    if (r.verdict === "croitre-paie") expect(r.resultatNetGagne).toBeGreaterThan(0);
    if (r.verdict === "la-demande-ne-suit-pas") expect(r.resultatNetGagne).toBeLessThanOrEqual(0);
    if (r.equipeLimite) expect(r.verdict).toBe("la-capacite-ne-manquait-pas");
  });

  it("payée par la trésorerie, la machine rapporte le même résultat d'exploitation : seules les charges financières changent", () => {
    const r = investissement(cas);
    const comptant = anneeAvecLaMachine(code, machineDuChapitre(code), "tresorerie");
    const sans = anneeSansInvestir(code);
    for (const t of comptant.keys()) expect((comptant[t]!.debt?.newLoan ?? 0) - (sans[t]!.debt?.newLoan ?? 0)).toBe(0);
    pres(r.exploitationGagneeComptant, r.exploitationGagnee, 1);
    expect(r.ecartDeFinancement).toBe(r.resultatNetGagneComptant - r.resultatNetGagne);
    expect(r.comptant.tresoreriePlusBasse).toBeLessThanOrEqual(r.avec.tresoreriePlusBasse);
    if (r.comptant.tresoreriePlusBasse === r.avec.tresoreriePlusBasse) expect(r.avec.tresoreriePlusBasse).toBe(-r.plafondDeDecouvert);
  });

  it("le cas : la plus grande machine, ses charges, et la comparaison à la petite", () => {
    const v = voirPlusGrand(cas);
    const g = plusGrandeMachine(code);
    expect(g.code).not.toBe(machineDuChapitre(code).code);
    expect(v.grande.capacite).toBeGreaterThan(v.petite.capacite);
    expect(v.grande.cout).toBe(g.costPerUnit);
    const avec = anneeAvecLaMachine(code, g, "emprunt");
    for (const r of avec) expect(r.debt?.loanRefused ?? 0).toBe(0);
    pres(v.grande.amortissement, somme(avec, (x) => is(x).depreciation) - somme(anneeSansInvestir(code), (x) => is(x).depreciation), 0.02);
    expect(v.grande.sans).toEqual(v.petite.sans);
    expect(v.ecart).toBe(v.grande.resultatNetGagne - v.petite.resultatNetGagne);
    if (v.verdict === "la-grande") expect(v.ecart > 0 && v.grande.resultatNetGagne > 0).toBe(true);
    if (v.verdict === "la-petite") expect(v.petite.resultatNetGagne > 0 && v.ecart <= 0).toBe(true);
    if (v.verdict === "aucune") expect(Math.max(v.petite.resultatNetGagne, v.grande.resultatNetGagne)).toBeLessThanOrEqual(0);
  });
});

describe.each(ENTREPRISES_DU_COURS)("la responsabilité sociétale chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const g = reglagesRse(code);

  it("le budget est celui du cours, les réglages ceux que le moteur applique", () => {
    expect(budgetRse(code)).toBe(Math.round(s.marketing.scale * BUDGET_RSE_EN_ECHELLES));
    expect(g).toEqual(s.rse ?? DEFAULT_RSE_CONFIG);
    const r = engagementRse(cas);
    expect(r.parDefaut).toBe(s.rse === undefined);
    // Le bon gestionnaire dépense en publicité la moitié de l'échelle au premier trimestre : ce que le commentaire du chapitre dit.
    expect(r.publiciteT1).toBe(Math.round(s.marketing.scale / 2));
  });

  it("le capital-image et l'attractivité calculés sont ceux que l'arène joue", () => {
    const r = engagementRse(cas);
    const e = anneeEngagee(code);
    pres(r.effort, rseEffort(r.budget, s.marketing.scale), 0.005);
    pres(r.capitalT1, e[0]!.rse!.imageCapital, 0.005);
    pres(r.capitalT2, e[1]!.rse!.imageCapital, 0.005);
    pres(r.capitalFin, e[e.length - 1]!.rse!.imageCapital, 0.005);
    // L'attractivité se lit sur le capital d'ouverture : neutre au trimestre 1, relevée ensuite.
    expect(e[0]!.rse!.imageFactor).toBe(1);
    pres(r.hausseT2, (e[1]!.rse!.imageFactor - 1) * 100, 0.2);
    pres(r.facteurT4, e[e.length - 1]!.rse!.imageFactor, 0.005);
  });

  it("aucun courrier RSE n'était possible dans l'année, et le label demande plus que le budget du cours", () => {
    const r = engagementRse(cas);
    const e = anneeEngagee(code);
    expect(r.courriers).toEqual([]);
    // Le capital avait quitté la zone tiède au premier trimestre où l'arène envoie des courriers.
    const ouverture = e[g.cards.minRound - 2]!.rse!.imageCapital;
    expect(ouverture).toBeGreaterThanOrEqual(g.cards.badBuzzImageCeiling);
    expect(e[e.length - 1]!.rse!.imageCapital).toBeLessThan(g.cards.labelImageThreshold);
    // Le budget du label : son effort égale le seuil, à l'euro près.
    pres(rseEffort(r.budgetDuLabel, s.marketing.scale), g.cards.labelImageThreshold, 1e-4);
    expect(r.label === "jamais").toBe(rseEffort(r.budget, s.marketing.scale) < g.cards.labelImageThreshold);
    if (r.trimestresDuLabel !== null) {
      const E = rseEffort(r.budget, s.marketing.scale);
      const k = g.imageInertia;
      expect(E * (1 - k ** r.trimestresDuLabel)).toBeGreaterThanOrEqual(g.cards.labelImageThreshold);
      expect(E * (1 - k ** (r.trimestresDuLabel - 1))).toBeLessThan(g.cards.labelImageThreshold);
    }
    expect(r.label).not.toBe("cette-annee");
  });

  it("l'année rejouée : l'écart de résultat est la marge gagnée moins le coût, rien d'autre ne change", () => {
    const r = engagementRse(cas);
    const ref = anneeDeReference(code);
    const e = anneeEngagee(code);
    expect(r.cout).toBe(r.budget * e.length);
    // Le budget joué chaque trimestre est celui du cours, ni reconduit ni multiplié d'un trimestre à l'autre.
    for (const x of e) pres(is(x).engagementRse ?? 0, r.budget, 0.01);
    pres(r.cout, somme(e, (x) => is(x).engagementRse ?? 0), 0.01);
    pres(r.ecart, r.margeGagnee - r.cout, 2);
    for (const f of [
      (x: CompanyRoundResult) => is(x).marketingCost,
      (x: CompanyRoundResult) => is(x).qualityCost,
      (x: CompanyRoundResult) => is(x).maintenanceCost,
      (x: CompanyRoundResult) => is(x).fixedCosts,
      (x: CompanyRoundResult) => is(x).depreciation,
      (x: CompanyRoundResult) => is(x).exceptionalCharge ?? 0,
      (x: CompanyRoundResult) => is(x).exceptionalIncome ?? 0,
    ])
      pres(somme(e, f), somme(ref, f), 0.01);
    expect(r.demandeGagnee).toBeGreaterThan(0);
    const ventes = surLAnnee(e, soldUnits) - surLAnnee(ref, soldUnits);
    if (r.verdict === "la-demande-ne-se-vend-pas") expect(Math.abs(ventes)).toBeLessThan(0.5);
    else expect(ventes).toBeGreaterThan(0.5);
    if (r.verdict === "paie-deja") expect(r.ecart).toBeGreaterThan(0);
    if (r.verdict === "pas-encore") expect(r.ecart).toBeLessThanOrEqual(0);
  });

  it("le process propre ne réduit les rebuts que là où l'arène en compte", () => {
    const r = engagementRse(cas);
    const p = anneeProcessPropre(code);
    pres(r.coutPropre, r.budget * p.length, 0.01);
    for (const x of p) pres(is(x).engagementRse ?? 0, r.budget, 0.01);
    pres(r.ecartPropre, r.margeGagneePropre - r.coutPropre, 2);
    // La réduction des rebuts se lit sur le capital d'ouverture : nulle au trimestre 1.
    expect(p[0]!.rse!.defectReduction).toBe(0);
    expect(p[1]!.rse!.defectReduction).toBeGreaterThan(0);
    if (r.aDesRebuts) {
      expect(r.rebutsEvites).toBeGreaterThan(0);
      expect(r.nonQualiteEvitee).toBeGreaterThan(0);
    } else {
      expect(r.rebutsEvites).toBe(0);
      expect(r.ecartPropre).toBe(-r.coutPropre);
    }
  });

  it("le cas : le budget du label le fait passer en trois trimestres, et l'arène l'accorde au quatrième", () => {
    const v = viserLeLabel(cas);
    const b = budgetDuLabel(code);
    const k = g.imageInertia;
    const seuil = g.cards.labelImageThreshold;
    const capital = (budget: number) => rseEffort(budget, s.marketing.scale) * (1 - k ** TRIMESTRES_AVANT_LE_LABEL);
    expect(b % 100).toBe(0);
    expect(capital(b)).toBeGreaterThanOrEqual(seuil);
    expect(capital(b - 100)).toBeLessThan(seuil);
    const vers = anneeVersLeLabel(code);
    pres(v.capitalT3, vers[TRIMESTRES_AVANT_LE_LABEL - 1]!.rse!.imageCapital, 0.005);
    expect(vers[TRIMESTRES_AVANT_LE_LABEL - 1]!.rse!.imageCapital).toBeGreaterThanOrEqual(seuil);
    // Le label, et lui seul, tombe au trimestre 4, comme le moteur le tire sur le capital d'ouverture.
    expect(v.courriers).toEqual([{ trimestre: TRIMESTRES_AVANT_LE_LABEL + 1, code: RSE_CARD_CODES.label }]);
    expect(
      evaluateRseCards({
        imageCapital: vers[TRIMESTRES_AVANT_LE_LABEL - 1]!.rse!.imageCapital,
        cleanCapital: 0,
        roundIndex: TRIMESTRES_AVANT_LE_LABEL + 1,
        config: g.cards,
        scale: s.marketing.scale,
        badBuzzRoll: 1,
        sanctionRoll: 1,
      }).map((c) => c.code),
    ).toEqual([RSE_CARD_CODES.label]);
    expect(g.cards.labelDuration).toBeGreaterThanOrEqual(2);
    expect(v.cout).toBe(b * vers.length);
    for (const x of vers) pres(is(x).engagementRse ?? 0, b, 0.01);
    pres(v.cout, somme(vers, (x) => is(x).engagementRse ?? 0), 0.01);
    expect(v.ecartAuChapitre).toBe(v.label.resultatDExploitation - v.chapitre.resultatDExploitation);
    expect(v.verdict).toBe(v.ecartAuChapitre > 0 ? "viser-le-label" : "pas-cette-annee");
    // Le budget de départ ne donne pas le label dans l'année : la troisième réponse reste fausse.
    expect(engagementRse(cas).courriers).toEqual([]);
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
          expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\bnull\b|\[object/);
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
          expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
          if (DEUX_CAS.some((s) => s.code === contenu.code)) {
            const juste = options.find((o) => o.juste)!;
            const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
            expect(juste.texte.length, `${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
          }
        }
        if (e.type === "montants") {
          const champs = e.champs(cas, etat);
          expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
          for (const c of champs) {
            expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
            // Le correcteur lit la saisie au centième : un attendu plus fin ne se saisirait pas.
            expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
          }
        }
        if (e.tableau) {
          const t = e.tableau(cas);
          expect(t.lignes.length, e.id).toBeGreaterThan(0);
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
