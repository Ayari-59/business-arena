import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { acomptes, eligibleAuTauxReduit, impotDuBenefice, plafondDImputation, reportEnArriere, reportEnAvant, resultatFiscal, solde, suiteDesExercices } from "../monde/finance";
import {
  ACOMPTES,
  DUREE_D_UTILISATION_DE_LA_CREANCE,
  EXERCICES_DE_PIXEL,
  IMPOT_DE_PIXEL_EN_N_MOINS_1,
  PIXEL_ET_LE_TAUX_REDUIT,
  PLAFOND_DU_REPORT_EN_ARRIERE,
  PLAFOND_DU_REPORT_EN_AVANT,
  RANG_DE_L_EXERCICE_EN_PERTE,
  TAUX_NORMAL,
  type ExerciceFiscal,
} from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE DÉFICIT REPORTÉ, QUAND L'IMPÔT ATTEND (fiscalité de l'entreprise, palier 3 ; BTS CG,
 * DCG UE4, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : les exercices de
 * PIXEL & CO ont une fiche figée (monde/projets-et-financement.ts, EXERCICES_DE_PIXEL) et le déficit
 * se calcule par le modèle du cours (monde/finance.ts : `resultatFiscal`, `reportEnAvant`,
 * `reportEnArriere`, `suiteDesExercices`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : un exercice en perte (N) entre un exercice bénéficiaire (N−1) et deux autres (N+1, N+2).
 * Le déficit fiscal de N ; les acomptes de N, calculés sur N−1, rendus ; le report en avant sur N+1
 * puis N+2, l'impôt évité et son plafond ; le report en arrière sur N−1, sur option, et sa créance ;
 * le choix entre les deux.
 *
 * Le piège central : le déficit s'impute sur le bénéfice, pas sur l'impôt. Il fait économiser le
 * taux de l'impôt sur son montant, quand un bénéfice vient l'absorber ; et le report en arrière ne
 * fait pas payer moins d'impôt en tout tant que les bénéfices suivants absorbent le déficit : il
 * avance l'économie et la rend sûre.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-deficit-de-n, sur-quoi-s-impute (la formule est au repère ou dans la
 *     question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-l-impot-evite
 *     puis la-perte-au-curseur (la perte de N, de 0 à 150 000 € ; les bénéfices de N+1 et N+2 face au
 *     déficit : ils se croisent à 75 000 €) avant le-report-en-avant et l-impot-evite ;
 *     predire-le-report-en-arriere puis le-laboratoire-du-deficit (la perte, le résultat de N+2,
 *     l'option ; le graphique de l'impôt évité selon la perte, par les deux reports, et de la créance)
 *     avant le-report-en-arriere ;
 *   · autonome : le-report-en-avant, l-impot-evite, le-report-en-arriere (ni formule ni chiffres
 *     donnés ; le calcul de la correction montre le chemin) ;
 *   · expert : le-choix-entre-les-deux (un jugement), a-rebours (retrouver le bénéfice distribué et le
 *     déficit reporté en avant à partir d'une créance), le-plafond (une variante au-delà du million) ;
 *     puis la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le grand entretien qui faisait perdre l'année du cours, les huit
 * trimestres rejoués, l'acompte trimestriel sur le cumul diminué du déficit. Le cours suit le droit :
 * des exercices entiers, des acomptes sur l'impôt de l'exercice précédent, et le report en arrière,
 * que l'arène ne connaissait pas.
 */

/** Le déficit se calcule ici sur les exercices de PIXEL & CO. */
export const ENTREPRISES_EN_DEFICIT: readonly string[] = ["ecommerce"];

/**
 * Gardé pour la compatibilité : quatre trimestres font un exercice (la valeur actuelle nette le
 * lisait ici). Le chapitre ne compte plus en trimestres.
 */
export const TRIMESTRES_PAR_EXERCICE = 4;

/**
 * LE GRAND ENTRETIEN, gardé pour la mission « jouez » (src/config/cours/jouez.ts), qui fait perdre
 * une année dans l'arène en multipliant par ce facteur le budget de maintenance de chaque trimestre.
 * Le chapitre, joué dans le monde du cours, ne le lit plus.
 */
export const FACTEUR_DU_GRAND_ENTRETIEN = 6;

/** Les bornes du curseur de la perte : le déficit fiscal de N, en euros. */
export const PERTE_DU_CURSEUR = { min: 0, max: 150_000 } as const;

/** Les leviers du laboratoire : la perte de N et le résultat fiscal de N+2, en euros. */
export const LEVIERS_DU_DEFICIT = {
  perte: { min: 10_000, max: 150_000, pas: 1_000 },
  resultatDeN2: { min: 0, max: 100_000, pas: 1_000 },
} as const;

/** Le levier à choix : le report en avant (par défaut) ou, sur option, le report en arrière. */
export const OPTIONS_DU_REPORT = { enAvant: 0, enArriere: 1 } as const;

/**
 * Une solution du défi du laboratoire, hypothèse du cours : une perte de 100 000 €, plus que ce que
 * N+1 et N+2 gagnent (75 000 €), le report en arrière choisi.
 */
export const SOLUTION_DU_LABORATOIRE = { perte: 100_000, resultatDeN2: 48_000, option: OPTIONS_DU_REPORT.enArriere } as const;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : une variante où PIXEL & CO aurait distribué une part de
 * son bénéfice de N−1 en dividendes. Elle opte pour le report en arrière, et sa créance ne vaut que
 * 6 000 €. Le déficit de N et le bénéfice de N−1 restent ceux de la fiche.
 */
export const CREANCE_A_REBOURS = 6_000;

/**
 * LA VARIANTE DU PLAFOND, hypothèse du cours : une société plus grande, le groupe de distribution
 * actionnaire de PIXEL & CO, reporte 2 000 000 € de déficit et gagne 1 600 000 € de bénéfice fiscal.
 * Elle n'a pas droit au taux réduit.
 */
export const VARIANTE_DU_PLAFOND = { deficit: 2_000_000, benefice: 1_600_000 } as const;

/** Les exercices du cours, par code d'entreprise : ceux de PIXEL & CO. */
const EXERCICES: Readonly<Record<string, readonly ExerciceFiscal[]>> = { ecommerce: EXERCICES_DE_PIXEL };

/** Les exercices de l'entreprise, lus par son code. */
export const exercicesDe = (c: Pick<Cas, "code">): readonly ExerciceFiscal[] => EXERCICES[c.code]!;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const enPct = (x: number) => Math.round(x * 10_000) / 100;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const somme = (xs: readonly number[]) => auCentime(xs.reduce((s, x) => s + x, 0));
const T = pct(TAUX_NORMAL * 100);
/** « de PIXEL & CO », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const N = RANG_DE_L_EXERCICE_EN_PERTE;
const N1 = N + 1;
const N2 = N + 2;

/** Ce qui change dans les exercices : la perte fiscale de N, le résultat de N+2, une charge de plus en N ou en N+1. */
export interface ChangementDesExercices {
  perte: number;
  resultatDeN2: number;
  chargeEnN: number;
  chargeEnN1: number;
}

/**
 * LES EXERCICES CHANGÉS (une fonction du chapitre, que le modèle n'a pas) : la perte fait le résultat
 * fiscal de N (ses corrections restent, le résultat comptable suit) ; le résultat de N+2 est son
 * résultat comptable, sans correction ; une charge de plus baisse le résultat comptable de son
 * exercice.
 */
export function exercicesChanges(exercices: readonly ExerciceFiscal[], ch: Partial<ChangementDesExercices>): ExerciceFiscal[] {
  return exercices.map((e, k) => {
    let resultatComptable = e.resultatComptable;
    if (k === N && ch.perte !== undefined) resultatComptable = auCentime(resultatComptable - ch.perte - resultatFiscal(e));
    if (k === N2 && ch.resultatDeN2 !== undefined) resultatComptable = ch.resultatDeN2;
    if (k === N && ch.chargeEnN) resultatComptable = auCentime(resultatComptable - ch.chargeEnN);
    if (k === N1 && ch.chargeEnN1) resultatComptable = auCentime(resultatComptable - ch.chargeEnN1);
    return { ...e, resultatComptable };
  });
}

const eligibleDe = () => eligibleAuTauxReduit(PIXEL_ET_LE_TAUX_REDUIT);

/**
 * LA SUITE DES EXERCICES ET L'IMPÔT ÉVITÉ (une fonction du chapitre) : la suite du modèle, avec ou
 * sans l'option du report en arrière, et ce que le déficit fait éviter de N−1 à N+2 : l'impôt que
 * chaque exercice aurait payé seul (rien sur une perte), moins l'impôt net de la suite.
 */
export function suiteDe(exercices: readonly ExerciceFiscal[], enArriere: boolean) {
  const eligible = eligibleDe();
  const s = suiteDesExercices(exercices, { enArriere: enArriere ? N : undefined, eligible });
  const sansDeficit = somme(exercices.map((e) => impotDuBenefice(Math.max(0, resultatFiscal(e)), eligible).impot));
  return { ...s, sansDeficit, evite: auCentime(sansDeficit - s.impotNet) };
}

/** Le laboratoire : la perte de N, le résultat de N+2, l'option. */
export function laboratoireDuDeficit(exercices: readonly ExerciceFiscal[], perte: number, resultatDeN2: number, enArriere: boolean) {
  const ex = exercicesChanges(exercices, { perte, resultatDeN2 });
  const s = suiteDe(ex, enArriere);
  const l = s.exercices;
  return {
    creance: l[N]!.creanceNee,
    impotPayeN1: l[N1]!.impotPaye,
    impotPayeN2: l[N2]!.impotPaye,
    deficitRestant: s.deficitRestant,
    creanceRestante: s.creanceRestante,
    evite: s.evite,
  };
}

/** Le déficit de PIXEL & CO : tout ce que le chapitre et son cas demandent. */
export function deficitDePixel(c: Pick<Cas, "code">) {
  const ex = exercicesDe(c);
  const eligible = eligibleDe();
  const rf = ex.map(resultatFiscal);
  const n = ex[N]!;
  const reintegrationsDeN = somme(n.reintegrations.map((r) => r.montant));
  const deductionsDeN1 = somme(ex[N1]!.deductions.map((r) => r.montant));
  const deficit = -rf[N]!;
  // Les acomptes de N, sur l'impôt de N−1, rendus : l'exercice en perte ne doit rien.
  const acomptesDeN = acomptes(IMPOT_DE_PIXEL_EN_N_MOINS_1);
  const soldeDeN = solde(impotDuBenefice(Math.max(0, rf[N]!), eligible).impot, acomptesDeN);
  // Le report en avant.
  const avant = suiteDe(ex, false);
  const a = avant.exercices;
  const sansDeficitN1N2 = somme([N1, N2].map((k) => impotDuBenefice(Math.max(0, rf[k]!), eligible).impot));
  const impotN1N2 = somme([N1, N2].map((k) => a[k]!.impot));
  // Le report en arrière.
  const arriere = suiteDe(ex, true);
  const r = arriere.exercices;
  const enArriere = reportEnArriere(deficit, a[N - 1]!.beneficeImposable);
  // Le calcul à rebours : la créance donne le déficit reporté en arrière, donc le bénéfice non distribué.
  const reporteARebours = auCentime(CREANCE_A_REBOURS / TAUX_NORMAL);
  const aRebours = reportEnArriere(deficit, reporteARebours);
  // La variante du plafond.
  const v = VARIANTE_DU_PLAFOND;
  const plafond = plafondDImputation(v.benefice);
  const auPlafond = reportEnAvant(v.benefice, v.deficit);
  return {
    ex,
    entreprise: n.entreprise,
    eligible,
    rf,
    reintegrationsDeN,
    deductionsDeN1,
    deficit,
    acompteDeN: acomptesDeN[0]!,
    acomptesVersesEnN: somme(acomptesDeN),
    renduEnN1: -soldeDeN,
    // Le report en avant.
    imputeN1: a[N1]!.deficitImpute,
    restantApresN1: a[N1]!.deficitRestant,
    imputeN2: a[N2]!.deficitImpute,
    imposableN2: a[N2]!.beneficeImposable,
    impotN2: a[N2]!.impot,
    impotPayeN1: a[N1]!.impotPaye,
    absorbable: auCentime(rf[N1]! + rf[N2]!),
    sansDeficitN1N2,
    impotN1N2,
    eviteEnAvant: auCentime(sansDeficitN1N2 - impotN1N2),
    tauxEffectifN2: enPct(a[N2]!.impot / ex[N2]!.resultatComptable),
    impotNet: avant.impotNet,
    // Le report en arrière.
    reporteEnArriere: enArriere.reporte,
    creance: r[N]!.creanceNee,
    deficitEnAvantApresLArriere: enArriere.deficitEnAvant,
    imputeN1AvecLArriere: r[N1]!.deficitImpute,
    impotN1AvecLArriere: r[N1]!.impot,
    impotPayeN1AvecLArriere: r[N1]!.impotPaye,
    creanceUtiliseeN1: r[N1]!.creanceUtilisee,
    creanceApresN1: auCentime(r[N]!.creanceNee - r[N1]!.creanceUtilisee),
    impotN2AvecLArriere: r[N2]!.impot,
    impotPayeN2AvecLArriere: r[N2]!.impotPaye,
    impotNetAvecLArriere: arriere.impotNet,
    resultatNetDeNAvecLArriere: auCentime(n.resultatComptable + r[N]!.creanceNee),
    // Le calcul à rebours.
    reporteARebours,
    distribueARebours: auCentime(rf[N - 1]! - reporteARebours),
    enAvantARebours: aRebours.deficitEnAvant,
    // Le plafond.
    plafond,
    imposableAuPlafond: auCentime(v.benefice - auPlafond.impute),
    impotAuPlafond: impotDuBenefice(auCentime(v.benefice - auPlafond.impute), false).impot,
    restantAuPlafond: auPlafond.deficitRestant,
  };
}

export type DeficitDePixel = ReturnType<typeof deficitDePixel>;

/** Les exercices de la fiche, côte à côte : le document de départ. */
function tableauDesExercices(x: DeficitDePixel): TableauDeDonnees {
  const corrections = (e: ExerciceFiscal, l: "reintegrations" | "deductions") => eur(somme(e[l].map((r) => r.montant)));
  return {
    titre: `Les exercices ${dE(x.entreprise)}`,
    colonnes: x.ex.map((e) => e.exercice),
    lignes: [
      { libelle: "Résultat comptable avant impôt", valeurs: x.ex.map((e) => eur(e.resultatComptable)) },
      { libelle: "Réintégrations", valeurs: x.ex.map((e) => corrections(e, "reintegrations")) },
      { libelle: "Déductions", valeurs: x.ex.map((e) => corrections(e, "deductions")) },
      { libelle: "Impôt sur les sociétés", valeurs: x.ex.map((_, k) => (k === N - 1 ? eur(IMPOT_DE_PIXEL_EN_N_MOINS_1) : "à calculer")) },
    ],
  };
}

/** La synthèse : les deux reports, exercice par exercice. */
function tableauDesDeuxReports(x: DeficitDePixel): TableauDeDonnees {
  return {
    titre: `Le déficit de N ${dE(x.entreprise)}, par les deux reports`,
    colonnes: ["Report en avant", "Report en arrière"],
    lignes: [
      { libelle: "Créance sur l'État, née en N", valeurs: [eur(0), eur(x.creance)] },
      { libelle: "Déficit imputé sur N+1", valeurs: [eur(x.imputeN1), eur(x.imputeN1AvecLArriere)] },
      { libelle: "Impôt payé en N+1", valeurs: [eur(x.impotPayeN1), eur(x.impotPayeN1AvecLArriere)] },
      { libelle: "Impôt payé en N+2", valeurs: [eur(x.impotN2), eur(x.impotPayeN2AvecLArriere)] },
      { libelle: "Impôt net, de N−1 à N+2", valeurs: [eur(x.impotNet), eur(x.impotNetAvecLArriere)] },
    ],
  };
}

export const LE_DEFICIT_REPORTE: Chapitre = {
  code: "le-deficit-reporte",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Le déficit reporté : quand l'impôt attend",
  accroche:
    "Une année en perte ne paie pas d'impôt, et sa perte ne se perd pas : reportée en avant, elle vient en déduction des bénéfices suivants ; reportée en arrière, sur option, elle fait naître une créance sur l'État. Ce que chaque report fait éviter, quand, et lequel choisir.",
  objectifs: [
    "Calculer le déficit fiscal d'un exercice en perte, et dire ce que deviennent ses acomptes",
    "Imputer un déficit en avant sur les bénéfices suivants, dans la limite du plafond",
    "Calculer l'impôt évité par le report et le taux effectif de l'exercice qui l'absorbe",
    "Reporter un déficit en arrière, calculer la créance et son utilisation",
    "Choisir entre les deux reports, et remonter d'une créance au déficit",
  ],
  libre: false,
  prerequis: ["l-impot-sur-les-societes"],
  entreprises: {
    codes: ENTREPRISES_EN_DEFICIT,
    pourquoi:
      "il faut un exercice en perte entre des exercices bénéficiaires pour voir le report en avant, le report en arrière et sa créance : c'est l'histoire de PIXEL & CO, le commerçant en ligne du cours, quelle que soit l'entreprise d'où vous venez.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année en perte",
      notions: ["income_statement"],
      tableau: (c) => tableauDesExercices(deficitDePixel(c)),
      texte: (c) => {
        const x = deficitDePixel(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, le commerçant en ligne, sur ${x.ex.length} exercices, de N−1 à N+2. En N, un entrepôt neuf démarre mal et les retours affluent : l'exercice finit en perte, entre un exercice bénéficiaire et deux autres.`,
          `Les hypothèses de la simulation. ${x.entreprise} n'a pas droit au taux réduit (un groupe de distribution détient ${pct((1 - PIXEL_ET_LE_TAUX_REDUIT.partDesPersonnesPhysiques) * 100)} de son capital) : tout son bénéfice paie ${T}. Le bénéfice de N−1 a été mis en réserve en entier, rien n'a été distribué. Ses ${ACOMPTES.dates.length} acomptes de N se sont calculés sur l'impôt de N−1, et ${x.entreprise}, qui n'a pas vu venir la perte, les a tous versés. En N, une dépréciation forfaitaire du stock et des pénalités douanières sont en charges ; la dépréciation est reprise en N+1.`,
        ];
      },
      repere: () => "Une perte ne paie pas d'impôt : elle devient un déficit fiscal, qui viendra en déduction des bénéfices suivants, ou, sur option, de celui de l'exercice précédent.",
    },
    {
      id: "le-deficit-de-n",
      type: "montants",
      titre: "Le déficit de N",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Le déficit fiscal part du résultat comptable, comme un bénéfice : la dépréciation forfaitaire et les pénalités ne se déduisent pas, et se réintègrent (${eur(x.reintegrationsDeN)} en tout). Calculez le résultat fiscal de N (${eur(x.ex[N]!.resultatComptable)} + ${eur(x.reintegrationsDeN)}), l'impôt de N, puis chaque acompte versé en N (l'impôt de N−1, ${eur(IMPOT_DE_PIXEL_EN_N_MOINS_1)}, ÷ ${ACOMPTES.dates.length}) et ce que l'État rend en mai N+1.`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        return [
          { libelle: "Résultat fiscal de N", attendu: x.rf[N]!, calcul: `${eur(x.ex[N]!.resultatComptable)} + ${eur(x.reintegrationsDeN)} = ${eur(x.rf[N]!)}` },
          { libelle: "Impôt de N", attendu: 0, calcul: `un exercice en perte : pas d'impôt, ${eur(0)}` },
          { libelle: "Chaque acompte versé en N", attendu: x.acompteDeN, calcul: `${eur(IMPOT_DE_PIXEL_EN_N_MOINS_1)} ÷ ${ACOMPTES.dates.length} = ${eur(x.acompteDeN)}` },
          { libelle: "Excédent rendu en mai N+1", attendu: x.renduEnN1, calcul: `${eur(x.acomptesVersesEnN)} versés − ${eur(0)} d'impôt = ${eur(x.renduEnN1)}` },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `Les réintégrations réduisent la perte : la perte comptable est de ${eur(-x.ex[N]!.resultatComptable)}, le déficit fiscal de ${eur(x.deficit)}. C'est le déficit fiscal qui se reporte, pas la perte comptable.`,
          `${x.entreprise} a avancé ${eur(x.acomptesVersesEnN)} à l'État pendant l'année de sa perte, sur l'impôt d'une bonne année : ils lui sont rendus après la déclaration, au printemps N+1. La trésorerie a payé l'impôt d'avance au plus mauvais moment.`,
        ];
      },
    },
    {
      id: "sur-quoi-s-impute",
      type: "choix",
      titre: "Sur quoi s'impute le déficit",
      notions: ["income_statement"],
      question: (c) => `${deficitDePixel(c).entreprise} reporte un déficit de ${eur(deficitDePixel(c).deficit)}. Sur quoi s'impute-t-il ?`,
      options: (c) => {
        const x = deficitDePixel(c);
        return [
          {
            texte: "Sur le bénéfice des exercices suivants, avant le calcul de l'impôt",
            juste: true,
            retour: `Oui : le déficit réduit le bénéfice imposable, pas l'impôt. Il se reporte sans limite de durée, mais chaque exercice n'en impute que ${eur(PLAFOND_DU_REPORT_EN_AVANT.fixe)}, plus ${pct(PLAFOND_DU_REPORT_EN_AVANT.partDuBeneficeAuDela * 100)} du bénéfice au-delà.`,
          },
          {
            texte: "Sur l'impôt des exercices suivants, euro pour euro",
            juste: false,
            retour: `Non : imputé sur l'impôt, le déficit de ${eur(x.deficit)} effacerait ${eur(x.deficit)} d'impôt. Il s'impute sur le bénéfice : il fait baisser l'impôt de ${T} de son montant.`,
          },
          {
            texte: "Sur l'exercice suivant seulement : ce qui n'y est pas imputé est perdu",
            juste: false,
            retour: "Non : le report en avant est illimité dans le temps. Ce qu'un exercice n'absorbe pas attend le suivant.",
          },
        ];
      },
    },
    {
      id: "predire-l-impot-evite",
      type: "choix",
      titre: "Pariez sur l'impôt évité",
      notions: ["income_statement"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Avant de calculer, pariez. Le déficit de ${eur(x.deficit)} s'impute sur les bénéfices qui suivent. Sur N+1 et N+2, s'ils l'absorbent, il fera éviter à ${x.entreprise}…`;
      },
      options: (c) => {
        const x = deficitDePixel(c);
        const voir = "Faites varier la perte de N à l'étape suivante : le curseur montre ce que le déficit fait éviter, et jusqu'où.";
        return [
          { texte: `${T} de son montant, ${eur(auCentime(x.deficit * TAUX_NORMAL))} d'impôt`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Son montant entier, ${eur(x.deficit)} d'impôt`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien : une perte ne rapporte jamais rien", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-perte-au-curseur",
      type: "curseur",
      titre: "Faites varier la perte",
      notions: ["income_statement"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Faites varier le déficit fiscal de N, de ${eur(PERTE_DU_CURSEUR.min)} à ${eur(PERTE_DU_CURSEUR.max)}. Une droite donne ce que N+1 et N+2 peuvent absorber, leurs bénéfices fiscaux (${eur(x.absorbable)}) ; l'autre, le déficit. Placez le curseur sur le plus grand déficit que N+1 et N+2 absorbent en entier, puis validez.`;
      },
      grandeur: () => ({ libelle: "Déficit fiscal de N", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: deficitDePixel(c).absorbable, min: PERTE_DU_CURSEUR.min, max: PERTE_DU_CURSEUR.max }),
      zones: ["Déficit absorbé d'ici N+2", "Une part du déficit attend encore"],
      rates: () => ({
        dessous: "N+1 et N+2 absorbent encore un déficit plus grand : cherchez le plus grand.",
        dessus: "À cette position, une part du déficit attend encore après N+2.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, p) => {
        const ex = exercicesChanges(exercicesDe(c), { perte: p });
        const s = suiteDe(ex, false);
        const l = s.exercices;
        return [
          { libelle: "Déficit imputé sur N+1 et N+2", montant: auCentime(l[N1]!.deficitImpute + l[N2]!.deficitImpute) },
          { libelle: "Déficit qui attend encore après N+2", montant: s.deficitRestant },
          { libelle: "Impôt de N+1 et N+2", montant: auCentime(l[N1]!.impot + l[N2]!.impot) },
          { libelle: "Impôt évité par le report", montant: s.evite, fort: true },
        ];
      },
      droites: (c) => {
        const x = deficitDePixel(c);
        return { produit: () => x.absorbable, cout: (p) => p, libelles: ["Bénéfices fiscaux de N+1 et N+2", "Déficit fiscal de N"] };
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `Jusqu'à ${eur(x.absorbable)}, chaque euro de déficit fait éviter ${T} d'impôt sur N+1 et N+2 : l'impôt évité monte en droite, ${T} de la perte. Au-delà, il plafonne à ${eur(auCentime(x.absorbable * TAUX_NORMAL))} : N+1 et N+2 n'ont plus de bénéfice à effacer, et le reste du déficit attend les exercices suivants, sans limite de durée.`,
          `Le déficit ne rapporte rien tant qu'un bénéfice ne vient pas l'absorber. À ${eur(x.deficit)}, ${x.entreprise} est sous la limite : tout son déficit s'impute d'ici N+2. L'étape suivante le fait imputer, exercice par exercice.`,
        ];
      },
    },
    {
      id: "le-report-en-avant",
      type: "montants",
      titre: "Le report en avant",
      notions: ["income_statement"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Sans formule cette fois. ${x.entreprise} reporte son déficit en avant. Calculez le déficit imputé sur N+1 (son résultat fiscal tient compte de la reprise de la dépréciation), le déficit qui reste après N+1, le bénéfice imposable de N+2, puis l'impôt de N+2.`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        return [
          {
            libelle: "Déficit imputé sur N+1",
            attendu: x.imputeN1,
            calcul: `le résultat fiscal de N+1 : ${eur(x.ex[N1]!.resultatComptable)} − ${eur(x.deductionsDeN1)} de reprise déjà taxée = ${eur(x.rf[N1]!)}, moins que le déficit : ${eur(x.imputeN1)} imputés`,
          },
          { libelle: "Déficit qui reste après N+1", attendu: x.restantApresN1, calcul: `${eur(x.deficit)} − ${eur(x.imputeN1)} = ${eur(x.restantApresN1)}` },
          { libelle: "Bénéfice imposable de N+2", attendu: x.imposableN2, calcul: `${eur(x.rf[N2]!)} − ${eur(x.imputeN2)} = ${eur(x.imposableN2)}` },
          { libelle: "Impôt de N+2", attendu: x.impotN2, calcul: `${eur(x.imposableN2)} × ${T} = ${eur(x.impotN2)}` },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `N+1 n'a pas d'impôt du tout : son bénéfice entier efface une part du déficit. N+2 impute le reste, ${eur(x.imputeN2)}, et paie sur ${eur(x.imposableN2)}. Le déficit est épuisé : ${eur(x.imputeN1)} + ${eur(x.imputeN2)} = ${eur(x.deficit)}.`,
          `La reprise de la dépréciation, ${eur(x.deductionsDeN1)}, se déduit en N+1 parce qu'elle a déjà été taxée en N, par la réintégration : une correction fiscale d'un exercice appelle souvent la correction inverse d'un autre.`,
        ];
      },
    },
    {
      id: "l-impot-evite",
      type: "montants",
      titre: "L'impôt évité",
      notions: ["income_statement"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Sans déficit à reporter, N+1 et N+2 auraient payé l'impôt de leur bénéfice. Calculez cet impôt, l'impôt évité par le report, puis le taux effectif de N+2, son impôt rapporté à son résultat comptable, en %. ${x.entreprise} a-t-elle retrouvé ${T} de son déficit ?`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        return [
          { libelle: "Impôt de N+1 et N+2 sans déficit", attendu: x.sansDeficitN1N2, calcul: `(${eur(x.rf[N1]!)} + ${eur(x.rf[N2]!)}) × ${T} = ${eur(x.sansDeficitN1N2)}` },
          { libelle: "Impôt évité par le report", attendu: x.eviteEnAvant, calcul: `${eur(x.sansDeficitN1N2)} − ${eur(x.impotN1N2)} = ${eur(x.eviteEnAvant)}, soit ${eur(x.deficit)} × ${T}` },
          { libelle: "Taux effectif de N+2 (%)", attendu: x.tauxEffectifN2, calcul: `${eur(x.impotN2)} ÷ ${eur(x.ex[N2]!.resultatComptable)} × 100 = ${pct(x.tauxEffectifN2)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `Le report fait éviter ${eur(x.eviteEnAvant)}, exactement ${T} du déficit : quand les bénéfices suivants l'absorbent en entier, la perte « rapporte » le taux de l'impôt, ni plus ni moins. Sur les ${x.ex.length} exercices, ${x.entreprise} paie ${eur(x.impotNet)} pour ${eur(somme(x.rf))} de résultat fiscal cumulé : ${pct(enPct(x.impotNet / somme(x.rf)))}.`,
          `Le taux effectif de N+2 tombe à ${pct(x.tauxEffectifN2)} : il ne dit pas que l'impôt a baissé, il dit qu'une perte passée est venue en déduction. Un taux effectif bas se lit toujours avec les exercices d'avant.`,
        ];
      },
    },
    {
      id: "predire-le-report-en-arriere",
      type: "choix",
      titre: "Pariez sur le report en arrière",
      notions: ["income_statement", "balance_sheet"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Avant de calculer, pariez. Sur option, ${x.entreprise} peut reporter son déficit en arrière, sur le bénéfice de N−1 (${eur(x.rf[N - 1]!)}), et le reste en avant. Comparé au report en avant seul, de N−1 à N+2, il lui fera payer…`;
      },
      options: () => {
        const voir = "Passez au laboratoire : il compare les deux reports pour toutes les pertes, et montre où ils se séparent.";
        return [
          { texte: "Autant d'impôt en tout, mais avec une créance dès la clôture de N", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Moins d'impôt : l'État rend l'impôt de N−1 en plus de l'économie future", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus d'impôt : le déficit reporté en arrière ne s'impute plus en avant", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-deficit",
      type: "simulation",
      titre: "Le laboratoire du déficit",
      notions: ["income_statement", "balance_sheet"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Faites varier la perte de N et le résultat fiscal de N+2, et choisissez le report. Le tableau suit la créance, l'impôt payé en N+1 et N+2, le déficit qui attend encore, et l'impôt évité de N−1 à N+2 ; le graphique trace, selon la perte, l'impôt évité par chaque report et la créance. ${x.entreprise} gagne ${eur(x.rf[N - 1]!)} en N−1 et ${eur(x.rf[N1]!)} en N+1. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = deficitDePixel(c);
        const L = LEVIERS_DU_DEFICIT;
        return [
          { code: "perte", libelle: "Déficit fiscal de N", unite: "€", min: L.perte.min, max: L.perte.max, pas: L.perte.pas, depart: x.deficit },
          { code: "resultatDeN2", libelle: "Résultat fiscal de N+2", unite: "€", min: L.resultatDeN2.min, max: L.resultatDeN2.max, pas: L.resultatDeN2.pas, depart: x.rf[N2]! },
          {
            code: "option",
            libelle: "Le report",
            unite: "",
            min: OPTIONS_DU_REPORT.enAvant,
            max: OPTIONS_DU_REPORT.enArriere,
            pas: 1,
            depart: OPTIONS_DU_REPORT.enAvant,
            choix: [
              { valeur: OPTIONS_DU_REPORT.enAvant, libelle: "En avant seulement" },
              { valeur: OPTIONS_DU_REPORT.enArriere, libelle: "En arrière sur N−1, le reste en avant" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = deficitDePixel(c);
        const l = laboratoireDuDeficit(x.ex, p.perte!, p.resultatDeN2!, p.option === OPTIONS_DU_REPORT.enArriere);
        const d = laboratoireDuDeficit(x.ex, x.deficit, x.rf[N2]!, false);
        return [
          { libelle: "Créance sur l'État, née en N", montant: l.creance, reference: d.creance },
          { libelle: "Impôt payé en N+1", montant: l.impotPayeN1, reference: d.impotPayeN1 },
          { libelle: "Impôt payé en N+2", montant: l.impotPayeN2, reference: d.impotPayeN2 },
          { libelle: "Déficit qui attend encore après N+2", montant: l.deficitRestant, reference: d.deficitRestant },
          { libelle: "Créance qui reste après N+2", montant: l.creanceRestante, reference: d.creanceRestante },
          { libelle: "Impôt évité, de N−1 à N+2", montant: l.evite, reference: d.evite, effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const ex = exercicesDe(c);
        return {
          levier: "perte",
          courbes: [
            { libelle: "Impôt évité, report en avant", valeur: (p) => laboratoireDuDeficit(ex, p.perte!, p.resultatDeN2!, false).evite },
            { libelle: "Impôt évité, report en arrière", valeur: (p) => laboratoireDuDeficit(ex, p.perte!, p.resultatDeN2!, true).evite },
            { libelle: "Créance née en N", valeur: (p) => laboratoireDuDeficit(ex, p.perte!, p.resultatDeN2!, true).creance },
          ],
        };
      },
      defi: (c) => {
        const ex = exercicesDe(c);
        const evites = (p: Readonly<Record<string, number>>) => [false, true].map((arriere) => laboratoireDuDeficit(ex, p.perte!, p.resultatDeN2!, arriere).evite);
        return {
          consigne: "Trouvez une position où le report en arrière fait éviter plus d'impôt que le report en avant, de N−1 à N+2, et choisissez-le.",
          atteint: (p) => {
            const [avant, arriere] = evites(p);
            return p.option === OPTIONS_DU_REPORT.enArriere && arriere! > avant!;
          },
          indice: (p) => {
            const [avant, arriere] = evites(p);
            if (arriere! <= avant!)
              return `À cette position, les deux reports font éviter autant, ${eur(avant!)} : N+1 et N+2 absorbent tout le déficit en avant. Montez la perte au-delà de ce qu'ils gagnent, ou baissez le résultat de N+2.`;
            return `Le report en arrière ferait éviter ${eur(arriere!)} au lieu de ${eur(avant!)} : choisissez-le.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      explication: (c, p) => {
        const x = deficitDePixel(c);
        const avant = laboratoireDuDeficit(x.ex, p.perte!, p.resultatDeN2!, false);
        const arriere = laboratoireDuDeficit(x.ex, p.perte!, p.resultatDeN2!, true);
        const reporte = reportEnArriere(p.perte!, x.rf[N - 1]!).reporte;
        return [
          `Tant que N+1 et N+2 absorbent le déficit, les deux courbes se confondent : le report en arrière ne fait pas payer moins d'impôt, il change seulement le moment de l'économie. Elles se séparent quand le déficit dépasse ce que N+1 et N+2 gagnent : ici, le report en avant fait éviter ${eur(avant.evite)}, et ${eur(avant.deficitRestant)} de déficit attendent encore ; le report en arrière change ${eur(reporte)} du déficit en créance dès N, et fait éviter ${eur(arriere.evite)}.`,
          `La créance plafonne à ${eur(x.creance)}, ${T} du bénéfice de N−1 : on ne reporte en arrière que sur un bénéfice déjà taxé, non distribué, d'un seul exercice. Le déficit qui attend en avant n'est pas perdu, il reste reportable sans limite de durée ; la créance qui n'a pas encore servi, ${eur(arriere.creanceRestante)}, paiera un impôt suivant ou sera remboursée. Le report en arrière rend l'économie plus tôt, et plus sûre.`,
        ];
      },
    },
    {
      id: "le-report-en-arriere",
      type: "montants",
      titre: "Le report en arrière",
      notions: ["income_statement", "balance_sheet"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `${x.entreprise} opte pour le report en arrière de son déficit de ${eur(x.deficit)}. Calculez le déficit reporté en arrière, la créance sur l'État, le déficit reporté en avant, puis l'impôt que ${x.entreprise} paie vraiment en N+2, une fois la créance utilisée en N+1 et N+2.`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        return [
          {
            libelle: "Déficit reporté en arrière",
            attendu: x.reporteEnArriere,
            calcul: `le plus petit du déficit (${eur(x.deficit)}), du bénéfice de N−1 non distribué (${eur(x.rf[N - 1]!)}) et de ${eur(PLAFOND_DU_REPORT_EN_ARRIERE)} : ${eur(x.reporteEnArriere)}`,
          },
          { libelle: "Créance sur l'État", attendu: x.creance, calcul: `${eur(x.reporteEnArriere)} × ${T} = ${eur(x.creance)}` },
          { libelle: "Déficit reporté en avant", attendu: x.deficitEnAvantApresLArriere, calcul: `${eur(x.deficit)} − ${eur(x.reporteEnArriere)} = ${eur(x.deficitEnAvantApresLArriere)}` },
          {
            libelle: "Impôt payé en N+2",
            attendu: x.impotPayeN2AvecLArriere,
            calcul: `N+1 : (${eur(x.rf[N1]!)} − ${eur(x.deficitEnAvantApresLArriere)}) × ${T} = ${eur(x.impotN1AvecLArriere)}, payés par la créance ; N+2 : ${eur(x.rf[N2]!)} × ${T} = ${eur(x.impotN2AvecLArriere)}, moins les ${eur(x.creanceApresN1)} de créance qui restent = ${eur(x.impotPayeN2AvecLArriere)}`,
          },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `La créance de ${eur(x.creance)} naît à la clôture de N : un produit non imposable au compte de résultat de N, dont la perte nette tombe à ${eur(-x.resultatNetDeNAvecLArriere)}, et une créance sur l'État à l'actif. Elle paie l'impôt des ${DUREE_D_UTILISATION_DE_LA_CREANCE} exercices suivants ; ce qui en resterait serait remboursé au bout de ${DUREE_D_UTILISATION_DE_LA_CREANCE} ans. Une banque peut aussi l'escompter, et ${x.entreprise} toucherait l'argent tout de suite.`,
          `De N−1 à N+2, ${x.entreprise} paie ${eur(x.impotNetAvecLArriere)} net d'impôt, comme avec le report en avant seul (${eur(x.impotNet)}) : le pari de l'étape d'avant se vérifie.`,
        ];
      },
    },
    {
      id: "le-choix-entre-les-deux",
      type: "choix",
      titre: "Lequel choisir",
      notions: ["income_statement", "balance_sheet", "cash_budget"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Le gérant ${dE(x.entreprise)} hésite entre les deux reports. Sa banque lui demande de reconstituer sa trésorerie, et il ne sait pas si N+1 sera bénéficiaire. Que lui conseillez-vous ?`;
      },
      options: (c) => {
        const x = deficitDePixel(c);
        return [
          {
            texte: `L'option : une créance de ${eur(x.creance)} dès N, sûre même sans bénéfice`,
            juste: true,
            retour: `Oui. Tant que les bénéfices suivants absorbent le déficit, les deux reports font éviter autant d'impôt ; mais la créance existe dès la clôture de N, se mobilise auprès de la banque, et serait remboursée au bout de ${DUREE_D_UTILISATION_DE_LA_CREANCE} ans si les bénéfices ne revenaient pas. Le report en avant attend un bénéfice qui n'est pas certain.`,
          },
          {
            texte: `Le report en avant : il fait éviter ${eur(x.eviteEnAvant)}, l'option seulement ${eur(x.creance)}`,
            juste: false,
            retour: `Non : c'est oublier que le reste du déficit, ${eur(x.deficitEnAvantApresLArriere)}, se reporte encore en avant avec l'option. En tout, l'option fait éviter autant : ${eur(x.creance)} de créance et ${eur(auCentime(x.deficitEnAvantApresLArriere * TAUX_NORMAL))} d'impôt en avant.`,
          },
          {
            texte: `L'option : elle fait éviter ${eur(x.creance)} de plus que le report en avant`,
            juste: false,
            retour: "Non : c'est compter le déficit deux fois. Ce qui est reporté en arrière ne s'impute plus en avant ; tant que les bénéfices suivants absorbent le déficit, l'impôt évité est le même.",
          },
          {
            texte: "Les deux à la fois, sur tout le déficit",
            juste: false,
            retour: "Non : un même euro de déficit ne s'impute qu'une fois. L'option porte sur une part du déficit, le reste se reporte en avant.",
          },
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Remonter de la créance au déficit",
      notions: ["income_statement", "balance_sheet"],
      question: (c) => {
        const x = deficitDePixel(c);
        return `Variante : ${x.entreprise} avait distribué une part de son bénéfice de N−1 en dividendes. Elle opte pour le report en arrière, et sa créance ne vaut que ${eur(CREANCE_A_REBOURS)}. Le déficit de N reste de ${eur(x.deficit)}. Retrouvez le déficit reporté en arrière, le bénéfice de N−1 distribué, puis le déficit reporté en avant.`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        return [
          { libelle: "Déficit reporté en arrière", attendu: x.reporteARebours, calcul: `${eur(CREANCE_A_REBOURS)} ÷ ${T} = ${eur(x.reporteARebours)}` },
          {
            libelle: "Bénéfice de N−1 distribué",
            attendu: x.distribueARebours,
            calcul: `${eur(x.reporteARebours)} < ${eur(x.deficit)} : c'est le bénéfice non distribué qui a borné le report ; ${eur(x.rf[N - 1]!)} − ${eur(x.reporteARebours)} = ${eur(x.distribueARebours)}`,
          },
          { libelle: "Déficit reporté en avant", attendu: x.enAvantARebours, calcul: `${eur(x.deficit)} − ${eur(x.reporteARebours)} = ${eur(x.enAvantARebours)}` },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `La créance vaut ${T} du déficit reporté en arrière, ${eur(x.reporteARebours)}. Comme le déficit était plus grand, c'est le bénéfice de N−1 resté en réserve qui a fixé la limite : ${eur(x.distribueARebours)} avaient été distribués. Un bénéfice distribué ne peut plus recevoir de déficit : l'impôt qu'il a payé est parti avec les dividendes.`,
          `Les ${eur(x.enAvantARebours)} reportés en avant feront éviter ${eur(auCentime(x.enAvantARebours * TAUX_NORMAL))} sur les exercices suivants : en tout, l'économie reste ${T} du déficit.`,
        ];
      },
    },
    {
      id: "le-plafond",
      type: "montants",
      titre: "Variante : au-delà du million",
      notions: ["income_statement"],
      question: () => {
        const v = VARIANTE_DU_PLAFOND;
        return `Variante : le groupe de distribution actionnaire de PIXEL & CO reporte ${eur(v.deficit)} de déficit, et gagne ${eur(v.benefice)} de bénéfice fiscal cette année ; il n'a pas droit au taux réduit. Calculez le déficit qu'il peut imputer cette année, son bénéfice imposable, son impôt, puis le déficit qui reste à reporter.`;
      },
      champs: (c) => {
        const x = deficitDePixel(c);
        const v = VARIANTE_DU_PLAFOND;
        const P = PLAFOND_DU_REPORT_EN_AVANT;
        return [
          {
            libelle: "Déficit imputable cette année",
            attendu: x.plafond,
            calcul: `${eur(P.fixe)} + ${pct(P.partDuBeneficeAuDela * 100)} × (${eur(v.benefice)} − ${eur(P.fixe)}) = ${eur(x.plafond)}`,
          },
          { libelle: "Bénéfice imposable", attendu: x.imposableAuPlafond, calcul: `${eur(v.benefice)} − ${eur(x.plafond)} = ${eur(x.imposableAuPlafond)}` },
          { libelle: "Impôt de l'exercice", attendu: x.impotAuPlafond, calcul: `${eur(x.imposableAuPlafond)} × ${T} = ${eur(x.impotAuPlafond)}` },
          { libelle: "Déficit qui reste à reporter", attendu: x.restantAuPlafond, calcul: `${eur(v.deficit)} − ${eur(x.plafond)} = ${eur(x.restantAuPlafond)}` },
        ];
      },
      explication: (c) => {
        const x = deficitDePixel(c);
        return [
          `Le plafond fait payer un impôt une année où le déficit suffirait à tout effacer : ${eur(x.impotAuPlafond)}. Il n'efface rien, il étale : les ${eur(x.restantAuPlafond)} restants s'imputeront plus tard. C'est un impôt minimum sur les grosses entreprises qui renouent avec le bénéfice.`,
          `Chez ${x.entreprise}, le plafond ne mord jamais : sur ${eur(x.rf[N1]!)} de bénéfice, il vaut ${eur(PLAFOND_DU_REPORT_EN_AVANT.fixe)}, bien plus que le déficit.`,
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "balance_sheet"],
      tableau: (c) => tableauDesDeuxReports(deficitDePixel(c)),
      texte: (c) => {
        const x = deficitDePixel(c);
        return [
          `${x.entreprise} perd ${eur(-x.ex[N]!.resultatComptable)} en N, pour un déficit fiscal de ${eur(x.deficit)} ; elle ne paie pas d'impôt, et l'État lui rend ses ${eur(x.acomptesVersesEnN)} d'acomptes. Reporté en avant, le déficit efface le bénéfice de N+1 et une part de celui de N+2 : il fait éviter ${eur(x.eviteEnAvant)}, ${T} de son montant. Reporté en arrière sur N−1, il fait naître une créance de ${eur(x.creance)} dès la clôture, pour le même impôt en tout.`,
          "Le déficit s'impute sur le bénéfice, jamais sur l'impôt ; le report en avant est illimité dans le temps mais plafonné chaque année au-delà du million ; le report en arrière porte sur le bénéfice non distribué de l'exercice précédent, et sa créance se mobilise ou se rembourse. Choisir, c'est choisir le moment et la certitude de l'économie.",
          "Au niveau de l'examen, vous savez calculer un déficit fiscal, l'imputer en avant avec son plafond, chiffrer la créance d'un report en arrière et son utilisation, remonter d'une créance au déficit, et conseiller l'option.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        `Bénéfice imposable = bénéfice fiscal − déficit imputé ; déficit imputable = ${eur(PLAFOND_DU_REPORT_EN_AVANT.fixe)} + ${pct(PLAFOND_DU_REPORT_EN_AVANT.partDuBeneficeAuDela * 100)} du bénéfice au-delà. Report en arrière : le plus petit du déficit, du bénéfice précédent non distribué et de ${eur(PLAFOND_DU_REPORT_EN_ARRIERE)} ; créance = déficit reporté × ${T}.`,
    },
  ],
};
