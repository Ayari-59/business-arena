import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { acomptes, eligibleAuTauxReduit, impotDuBenefice, resultatFiscal, solde } from "../monde/finance";
import {
  ACOMPTES,
  CONDITIONS_DU_TAUX_REDUIT,
  DEPENSE_DE_FIN_D_ANNEE,
  EXERCICE_N1_DE_NOVA,
  IMPOT_DE_NOVA_EN_N,
  MAJORATION_DE_RETARD,
  NOVA_ET_LE_TAUX_REDUIT,
  PIXEL_ET_LE_TAUX_REDUIT,
  PLAFOND_DU_TAUX_REDUIT,
  TAUX_NORMAL,
  TAUX_REDUIT,
  VOITURE_DU_GERANT,
  type ExerciceFiscal,
} from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'IMPÔT SUR LES SOCIÉTÉS, DU RÉSULTAT À L'IMPÔT (fiscalité de l'entreprise, palier 3 ;
 * BTS CG, DCG UE4, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le second
 * exercice de NOVA, N+1, a une fiche figée (monde/projets-et-financement.ts, EXERCICE_N1_DE_NOVA) et
 * l'impôt se calcule par le modèle du cours (monde/finance.ts : `resultatFiscal`, `impotDuBenefice`,
 * `acomptes`, `solde`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : du résultat comptable au résultat fiscal (deux réintégrations : l'amortissement de la
 * voiture du gérant au-delà du plafond, une majoration de retard), le barème du taux réduit et ses
 * conditions, le taux effectif face au taux marginal, les acomptes calculés sur l'impôt de N et le
 * solde du 15 mai N+2. Puis une critique : l'impôt qui pousse à dépenser en fin d'année.
 *
 * Le piège central : le taux réduit fait croire qu'un euro de charge en plus économise 15 %. Au-delà
 * de 42 500 € de bénéfice, chaque euro paie 25 % : le taux marginal est le taux normal, quel que soit
 * le taux effectif, et c'est lui qui dit ce que rapporte (ou coûte) un euro de plus.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-resultat-fiscal, la-majoration (la formule est au repère ou dans la question,
 *     qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-taux-effectif
 *     puis le-taux-effectif-au-curseur (le bénéfice de 42 500 € à 200 000 €, l'impôt face à 20 % du
 *     bénéfice : ils se croisent à 85 000 €) avant l-impot-de-l-exercice ; predire-le-solde puis
 *     le-solde-au-curseur (le bénéfice de N+1, l'impôt face aux acomptes calculés sur N : ils se
 *     croisent à 99 968 €) avant les-acomptes-et-le-solde ;
 *   · autonome : l-impot-de-l-exercice (le repère donne le barème, la question ne nomme plus les
 *     chiffres), les-conditions-du-taux-reduit, les-acomptes-et-le-solde, au-31-decembre ;
 *   · expert : le-laboratoire-de-l-impot (résultat comptable, réintégrations, taux réduit ou taux
 *     normal, et le graphique du taux effectif face au taux marginal ; défi : un taux effectif sous
 *     20 % avec un taux marginal de 25 %), sans-le-taux-reduit (une variante : un fonds entre au
 *     capital, le taux réduit tombe), a-rebours (retrouver l'impôt et le résultat fiscal de N+2 à
 *     partir du solde), la-depense-de-decembre (la critique) ; puis la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : les quatre trimestres de l'année jouée, les acomptes que le moteur
 * prélevait sur le résultat cumulé de l'exercice en cours, le trimestre de perte qui les faisait
 * rendre. Le cours suit maintenant le droit : des acomptes sur l'impôt de l'exercice précédent, un
 * solde après la clôture, une dette d'impôt au bilan.
 */

/**
 * LE REPÈRE DU TAUX EFFECTIF, hypothèse du cours : 20 %, le taux sous lequel on cherche à garder le
 * taux effectif de NOVA (au curseur, puis au laboratoire). Ce n'est pas un taux du droit.
 */
export const TAUX_EFFECTIF_VISE = 0.2;

/**
 * LA VARIANTE SANS TAUX RÉDUIT, hypothèse du cours : en N+1, un fonds d'investissement entre au
 * capital de NOVA ; les associés fondateurs n'en gardent que 70 %. Le chiffre d'affaires et le
 * résultat ne changent pas.
 */
export const PART_DES_FONDATEURS_APRES_LE_FONDS = 0.7;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : au 15 mai N+3, l'État rend 1 870 € à NOVA au titre de
 * N+2 (un solde négatif). Les acomptes de N+2 se sont calculés sur l'impôt de N+1, comme le cours le
 * suppose, et NOVA a toujours droit au taux réduit.
 */
export const SOLDE_DE_N2_A_REBOURS = -1_870;

/**
 * LA MACHINE DE DÉCEMBRE, hypothèse du cours (l'étape de la critique) : une machine de 20 000 € hors
 * taxes achetée le 20 décembre, qu'on croit déduire en entier de l'exercice.
 */
export const MACHINE_DE_DECEMBRE = 20_000;

/** Les bornes des curseurs du bénéfice : à partir du plafond du taux réduit, où l'impôt est une droite. */
export const BENEFICE_DU_CURSEUR = { min: PLAFOND_DU_TAUX_REDUIT, max: 200_000 } as const;

/** Les leviers du laboratoire de l'impôt : le résultat comptable et les réintégrations, en euros. */
export const LEVIERS_DE_L_IMPOT = {
  resultat: { min: 30_000, max: 200_000, pas: 20 },
  reintegrations: { min: 0, max: 20_000, pas: 20 },
} as const;

/** Le levier à choix du barème : le taux réduit d'une PME, ou le taux normal seul. */
export const BAREMES = { normal: 0, reduit: 1 } as const;

/**
 * Une solution du défi du laboratoire, hypothèse du cours : 60 000 € de résultat comptable, les
 * réintégrations de N+1, le taux réduit. 64 020 € de bénéfice, 11 755 € d'impôt : 19,59 %.
 */
export const SOLUTION_DU_LABORATOIRE = { resultat: 60_000, reintegrations: 4_020, bareme: BAREMES.reduit } as const;

/** L'impôt sur les sociétés se calcule ici sur l'exercice de NOVA. */
export const ENTREPRISES_DE_L_IMPOT: readonly string[] = ["nova"];

/** Les exercices du cours, par code d'entreprise : celui de NOVA en N+1. */
const EXERCICES: Readonly<Record<string, ExerciceFiscal>> = { nova: EXERCICE_N1_DE_NOVA };

/** L'exercice de l'entreprise, lu par son code. */
export const exerciceDe = (c: Pick<Cas, "code">): ExerciceFiscal => EXERCICES[c.code]!;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un taux déjà en pour cent : 25 donne « 25 % ». */
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
/** Une fraction en pour cent, au centième de point : 0,222607 donne 22,26. */
const enPct = (x: number) => Math.round(x * 10_000) / 100;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const somme = (xs: readonly number[]) => auCentime(xs.reduce((s, x) => s + x, 0));
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'impôt au taux réduit sur la part du bénéfice qui y a droit : 42 500 € × 15 % = 6 375 €. */
const IMPOT_DE_LA_TRANCHE_REDUITE = auCentime(PLAFOND_DU_TAUX_REDUIT * TAUX_REDUIT);

/**
 * LE TAUX MARGINAL D'UN BÉNÉFICE (une fonction du chapitre, que le modèle n'a pas) : ce que paie le
 * prochain euro de bénéfice. Rien sur une perte ; le taux réduit sous le plafond, pour une société
 * qui y a droit ; le taux normal au-delà.
 */
export function tauxMarginal(benefice: number, eligible: boolean): number {
  if (benefice < 0) return 0;
  return eligible && benefice < PLAFOND_DU_TAUX_REDUIT ? TAUX_REDUIT : TAUX_NORMAL;
}

/**
 * LE RÉSULTAT FISCAL D'UN IMPÔT DONNÉ (une fonction du chapitre, le calcul à rebours) : le barème
 * remonté. Au-delà de l'impôt de la tranche réduite, chaque euro d'impôt vient de 4 € de bénéfice au
 * taux normal.
 */
export function resultatFiscalDeLImpot(impot: number, eligible: boolean): number {
  if (!eligible) return auCentime(impot / TAUX_NORMAL);
  if (impot <= IMPOT_DE_LA_TRANCHE_REDUITE) return auCentime(impot / TAUX_REDUIT);
  return auCentime(PLAFOND_DU_TAUX_REDUIT + (impot - IMPOT_DE_LA_TRANCHE_REDUITE) / TAUX_NORMAL);
}

/** L'impôt, le taux effectif (sur le résultat comptable) et le taux marginal, pour un résultat comptable, des réintégrations et un barème. */
export function laboratoireDeLImpot(resultatComptable: number, reintegrations: number, eligible: boolean) {
  const benefice = auCentime(resultatComptable + reintegrations);
  const i = impotDuBenefice(benefice, eligible);
  return {
    benefice,
    aTauxReduit: i.aTauxReduit,
    aTauxNormal: i.aTauxNormal,
    impot: i.impot,
    resultatNet: auCentime(resultatComptable - i.impot),
    tauxEffectif: resultatComptable > 0 ? enPct(i.impot / resultatComptable) : 0,
    tauxMarginal: enPct(tauxMarginal(benefice, eligible)),
    economieDuTauxReduit: auCentime(impotDuBenefice(benefice, false).impot - impotDuBenefice(benefice, true).impot),
  };
}

/** L'impôt de N+1 de NOVA : tout ce que le chapitre et son cas demandent. */
export function impotDeNova(c: Pick<Cas, "code">) {
  const e = exerciceDe(c);
  const v = VOITURE_DU_GERANT;
  const amortissementComptable = auCentime(v.prixTtc / v.dureeDAmortissement);
  const amortissementDeductible = auCentime(v.plafondDeDeduction / v.dureeDAmortissement);
  const reintegrations = somme(e.reintegrations.map((r) => r.montant));
  const benefice = resultatFiscal(e);
  const eligible = eligibleAuTauxReduit(NOVA_ET_LE_TAUX_REDUIT);
  const i = impotDuBenefice(benefice, eligible);
  const verses = acomptes(IMPOT_DE_NOVA_EN_N);
  const totalVerse = somme(verses);
  // La variante : les fondateurs ne gardent que 70 % du capital, le taux réduit tombe.
  const avecLeFonds = { ...NOVA_ET_LE_TAUX_REDUIT, partDesPersonnesPhysiques: PART_DES_FONDATEURS_APRES_LE_FONDS };
  const eligibleAvecLeFonds = eligibleAuTauxReduit(avecLeFonds);
  const sansTauxReduit = impotDuBenefice(benefice, eligibleAvecLeFonds).impot;
  // Le calcul à rebours : N+2, ses acomptes sur l'impôt de N+1, son solde donné.
  const acomptesDeN2 = acomptes(i.impot);
  const versesEnN2 = somme(acomptesDeN2);
  const impotDeN2 = auCentime(versesEnN2 + SOLDE_DE_N2_A_REBOURS);
  const beneficeDeN2 = resultatFiscalDeLImpot(impotDeN2, eligible);
  // Les curseurs : le bénéfice où le taux effectif atteint 20 %, celui où l'impôt rejoint les acomptes.
  const seuilDuTauxEffectif = Math.floor(((TAUX_NORMAL - TAUX_REDUIT) * PLAFOND_DU_TAUX_REDUIT) / (TAUX_NORMAL - TAUX_EFFECTIF_VISE) + 1e-6);
  const seuilDuSolde = Math.floor(PLAFOND_DU_TAUX_REDUIT + (totalVerse - IMPOT_DE_LA_TRANCHE_REDUITE) / TAUX_NORMAL + 1e-6);
  return {
    e,
    entreprise: e.entreprise,
    amortissementComptable,
    amortissementDeductible,
    amortissementReintegre: auCentime(amortissementComptable - amortissementDeductible),
    reintegrations,
    benefice,
    eligible,
    aTauxReduit: i.aTauxReduit,
    baseAuTauxNormal: i.baseAuTauxNormal,
    aTauxNormal: i.aTauxNormal,
    impot: i.impot,
    resultatNet: auCentime(e.resultatComptable - i.impot),
    tauxEffectif: enPct(i.impot / e.resultatComptable),
    tauxEffectifFiscal: enPct(i.impot / benefice),
    tauxMarginal: enPct(tauxMarginal(benefice, eligible)),
    acompte: verses[0]!,
    totalVerse,
    solde: solde(i.impot, verses),
    eligibleAvecLeFonds,
    sansTauxReduit,
    impotEnPlus: auCentime(sansTauxReduit - i.impot),
    tauxEffectifSansTauxReduit: enPct(sansTauxReduit / e.resultatComptable),
    acompteDeN2: acomptesDeN2[0]!,
    versesEnN2,
    impotDeN2,
    beneficeDeN2,
    tauxEffectifDeN2: enPct(impotDeN2 / beneficeDeN2),
    seuilDuTauxEffectif,
    seuilDuSolde,
  };
}

export type ImpotDeNova = ReturnType<typeof impotDeNova>;

/** Le taux effectif visé appliqué à un bénéfice, en points entiers pour un calcul exact : 20 × b ÷ 100. */
const vingtPourCent = (b: number) => (b * Math.round(TAUX_EFFECTIF_VISE * 100)) / 100;

/** L'impôt d'un bénéfice au-delà du plafond, pour une société qui a droit au taux réduit : la droite des curseurs. */
export const impotAuDelaDuPlafond = (benefice: number) => IMPOT_DE_LA_TRANCHE_REDUITE + (benefice - PLAFOND_DU_TAUX_REDUIT) * TAUX_NORMAL;

/** Le document de départ : l'exercice N+1 de NOVA, et ce qu'il faut pour son impôt. */
function tableauDeLExercice(x: ImpotDeNova): TableauDeDonnees {
  const v = VOITURE_DU_GERANT;
  return {
    titre: `Le second exercice ${dE(x.entreprise)}, ${x.e.exercice}`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Résultat comptable avant impôt", valeurs: [eur(x.e.resultatComptable)] },
      { libelle: "Voiture du gérant, prix toutes taxes comprises", valeurs: [eur(v.prixTtc)] },
      { libelle: "Durée d'amortissement de la voiture", valeurs: [`${v.dureeDAmortissement} ans`] },
      { libelle: "Plafond de l'amortissement déductible", valeurs: [eur(v.plafondDeDeduction)] },
      { libelle: "Majoration de retard sur la TVA", valeurs: [eur(MAJORATION_DE_RETARD)] },
      { libelle: "Chiffre d'affaires de N", valeurs: [eur(NOVA_ET_LE_TAUX_REDUIT.chiffreDAffaires)] },
      { libelle: "Capital détenu par les associés fondateurs", valeurs: [pct(NOVA_ET_LE_TAUX_REDUIT.partDesPersonnesPhysiques * 100)] },
      { libelle: "Impôt sur les sociétés de N", valeurs: [eur(IMPOT_DE_NOVA_EN_N)] },
      { libelle: `Taux réduit, jusqu'à ${eur(PLAFOND_DU_TAUX_REDUIT)}`, valeurs: [pct(TAUX_REDUIT * 100)] },
      { libelle: "Taux normal", valeurs: [pct(TAUX_NORMAL * 100)] },
    ],
  };
}

/** La synthèse : du résultat comptable au solde. */
function tableauDeLImpot(x: ImpotDeNova): TableauDeDonnees {
  return {
    titre: `L'impôt ${dE(x.entreprise)} en ${x.e.exercice}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Résultat comptable avant impôt", valeurs: [eur(x.e.resultatComptable)] },
      { libelle: "Réintégrations", valeurs: [eur(x.reintegrations)] },
      { libelle: "Résultat fiscal", valeurs: [eur(x.benefice)] },
      { libelle: `Impôt au taux réduit, ${pct(TAUX_REDUIT * 100)}`, valeurs: [eur(x.aTauxReduit)] },
      { libelle: `Impôt au taux normal, ${pct(TAUX_NORMAL * 100)}`, valeurs: [eur(x.aTauxNormal)] },
      { libelle: "Impôt sur les sociétés", valeurs: [eur(x.impot)] },
      { libelle: "Acomptes versés en N+1", valeurs: [eur(x.totalVerse)] },
      { libelle: `Solde du ${ACOMPTES.dateDuSolde} N+2`, valeurs: [eur(x.solde)] },
      { libelle: "Taux effectif, sur le résultat comptable", valeurs: [pct(x.tauxEffectif)] },
      { libelle: "Taux marginal", valeurs: [pct(x.tauxMarginal)] },
    ],
  };
}

const NB = ACOMPTES.dates.length;

export const L_IMPOT_SUR_LES_SOCIETES: Chapitre = {
  code: "l-impot-sur-les-societes",
  parcours: "fiscalite",
  palier: 3,
  blocs: [
    "BTS CG P3 · Gestion des obligations fiscales",
    "DCG UE4 · Droit fiscal",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "L'impôt sur les sociétés : du résultat à l'impôt",
  accroche:
    "Du résultat comptable au résultat fiscal, le taux réduit d'une PME et ses conditions, le taux effectif face au taux marginal, les acomptes et le solde : l'impôt d'un exercice de NOVA, et pourquoi dépenser en décembre pour payer moins d'impôt est un mauvais calcul.",
  objectifs: [
    "Passer du résultat comptable au résultat fiscal par les réintégrations et les déductions",
    "Calculer l'impôt au taux réduit puis au taux normal, et vérifier les conditions du taux réduit",
    "Distinguer le taux effectif et le taux marginal, et dire lequel juge une décision",
    "Calculer les acomptes, le solde, et la dette d'impôt à la clôture",
    "Remonter d'un solde à l'impôt et au résultat fiscal, et critiquer la dépense de fin d'année",
  ],
  libre: false,
  prerequis: ["la-cloture"],
  entreprises: {
    codes: ENTREPRISES_DE_L_IMPOT,
    pourquoi:
      "l'impôt se calcule ici sur un exercice complet, le second de NOVA, la fabrique d'enceintes du cours : son résultat fiscal, son taux réduit de PME, ses acomptes et son solde. Venu d'une autre entreprise, vous y apprenez la mécanique que vous retrouverez sur vos propres chiffres.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un impôt pour l'exercice",
      notions: ["income_statement"],
      tableau: (c) => tableauDeLExercice(impotDeNova(c)),
      texte: (c) => {
        const x = impotDeNova(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, la fabrique d'enceintes, sur son second exercice, ${x.e.exercice}. L'impôt sur les sociétés porte sur le bénéfice de l'exercice entier, mais pas sur le bénéfice comptable tel quel : la loi refuse de déduire certaines charges, qu'on réintègre, et exonère certains produits, qu'on déduit. On obtient le résultat fiscal, et c'est lui qu'on taxe.`,
          `Les hypothèses de la simulation. ${x.entreprise} gagne ${eur(x.e.resultatComptable)} avant impôt en ${x.e.exercice}. Le gérant roule dans une voiture de tourisme achetée en janvier, dont la loi plafonne l'amortissement déductible ; une déclaration de TVA déposée en retard a coûté une majoration. ${x.entreprise} remplit les conditions du taux réduit : ${pct(TAUX_REDUIT * 100)} jusqu'à ${eur(PLAFOND_DU_TAUX_REDUIT)} de bénéfice, ${pct(TAUX_NORMAL * 100)} au-delà. L'impôt s'arrondit à l'euro.`,
          `L'impôt se paie en ${NB} acomptes, le ${ACOMPTES.dates.join(", le ")}, puis un solde le ${ACOMPTES.dateDuSolde} qui suit la clôture. Le cours simplifie : les ${NB} acomptes de ${x.e.exercice} se calculent tous sur l'impôt de N, ${eur(IMPOT_DE_NOVA_EN_N)} (le droit calcule celui du ${ACOMPTES.dates[0]} sur l'avant-dernier exercice quand le dernier n'est pas encore déclaré).`,
        ];
      },
      repere: () => "Résultat fiscal = résultat comptable avant impôt + réintégrations − déductions. L'impôt se calcule sur le résultat fiscal.",
    },
    {
      id: "le-resultat-fiscal",
      objectifs: [0],
      type: "montants",
      titre: "Le résultat fiscal",
      notions: ["income_statement", "depreciation"],
      question: (c) => {
        const x = impotDeNova(c);
        const v = VOITURE_DU_GERANT;
        return `La voiture du gérant, ${eur(v.prixTtc)} toutes taxes comprises, s'amortit sur ${v.dureeDAmortissement} ans ; la loi ne déduit l'amortissement que sur ${eur(v.plafondDeDeduction)}, le plafond que ses émissions de CO2 lui donnent (il change selon le véhicule). Calculez l'amortissement déductible de l'année, puis l'amortissement à réintégrer (l'amortissement comptable, ${eur(x.amortissementComptable)}, moins le déductible), et enfin le résultat fiscal : ${eur(x.e.resultatComptable)}, plus cet amortissement, plus la majoration de retard de ${eur(MAJORATION_DE_RETARD)}.`;
      },
      champs: (c) => {
        const x = impotDeNova(c);
        const v = VOITURE_DU_GERANT;
        return [
          { libelle: "Amortissement déductible de la voiture", attendu: x.amortissementDeductible, calcul: `${eur(v.plafondDeDeduction)} ÷ ${v.dureeDAmortissement} = ${eur(x.amortissementDeductible)}` },
          { libelle: "Amortissement à réintégrer", attendu: x.amortissementReintegre, calcul: `${eur(x.amortissementComptable)} − ${eur(x.amortissementDeductible)} = ${eur(x.amortissementReintegre)}` },
          {
            libelle: "Résultat fiscal",
            attendu: x.benefice,
            calcul: `${eur(x.e.resultatComptable)} + ${eur(x.amortissementReintegre)} + ${eur(MAJORATION_DE_RETARD)} = ${eur(x.benefice)}`,
          },
        ];
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `La voiture reste amortie de ${eur(x.amortissementComptable)} dans les comptes : la comptabilité ne change pas. La réintégration se fait hors comptabilité, sur la déclaration (le tableau 2058-A) : ${eur(x.reintegrations)} de charges que la loi ne déduit pas, et ${x.entreprise} est taxée sur ${eur(x.benefice)}, plus que son bénéfice.`,
        ];
      },
    },
    {
      id: "la-majoration",
      objectifs: [0],
      type: "choix",
      titre: "La majoration de retard",
      notions: ["income_statement"],
      question: (c) => `La majoration de retard, ${eur(MAJORATION_DE_RETARD)}, est passée en charges dans les comptes ${dE(impotDeNova(c).entreprise)}. Pour le résultat fiscal, qu'en faites-vous ?`,
      options: () => [
        {
          texte: "Je la réintègre : une pénalité ne se déduit pas",
          juste: true,
          retour: `Oui. Les amendes et les pénalités ne sont pas déductibles : laisser l'État financer une part de ses propres sanctions n'aurait pas de sens. Les ${eur(MAJORATION_DE_RETARD)} restent une charge comptable, et s'ajoutent au résultat fiscal.`,
        },
        {
          texte: "Rien : c'est une charge de l'exercice comme une autre",
          juste: false,
          retour: "Non : toute charge comptable n'est pas déductible. Les pénalités, les amendes, l'impôt sur les sociétés lui-même, l'amortissement d'une voiture au-delà du plafond se réintègrent.",
        },
        {
          texte: `Je la réintègre pour ${pct(TAUX_NORMAL * 100)} de son montant, sa part d'impôt`,
          juste: false,
          retour: `Non : on réintègre la charge entière, ${eur(MAJORATION_DE_RETARD)}, au résultat fiscal. C'est l'impôt calculé ensuite qui en prend ${pct(TAUX_NORMAL * 100)}.`,
        },
        {
          texte: "Je la retranche du résultat comptable, une seconde fois",
          juste: false,
          retour: "Non : ce serait la déduire deux fois. Une charge non déductible s'ajoute au résultat comptable pour faire le résultat fiscal.",
        },
      ],
    },
    {
      id: "predire-le-taux-effectif",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le taux effectif",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Avant de calculer, pariez. ${x.entreprise} paie ${pct(TAUX_REDUIT * 100)} sur ses premiers ${eur(PLAFOND_DU_TAUX_REDUIT)} de bénéfice, ${pct(TAUX_NORMAL * 100)} sur le reste. Plus son bénéfice grandit, plus son impôt rapporté à son bénéfice, le taux effectif…`;
      },
      options: () => {
        const voir = "Faites varier le bénéfice à l'étape suivante : le curseur montre où va le taux effectif, et à quelle vitesse.";
        return [
          { texte: `Monte vers ${pct(TAUX_NORMAL * 100)}, sans jamais l'atteindre`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `Reste à ${pct(TAUX_REDUIT * 100)} : une PME paie le taux réduit`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Vaut ${pct(((TAUX_REDUIT + TAUX_NORMAL) / 2) * 100)}, la moyenne des deux taux`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-taux-effectif-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Faites varier le bénéfice",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Faites varier le bénéfice imposable ${dE(x.entreprise)} de ${eur(BENEFICE_DU_CURSEUR.min)} à ${eur(BENEFICE_DU_CURSEUR.max)}. Une droite donne son impôt, ${pct(TAUX_REDUIT * 100)} puis ${pct(TAUX_NORMAL * 100)} ; l'autre, ${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice. Placez le curseur sur le plus grand bénéfice où l'impôt ne dépasse pas ${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice, puis validez.`;
      },
      grandeur: () => ({ libelle: "Bénéfice imposable", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: impotDeNova(c).seuilDuTauxEffectif, min: BENEFICE_DU_CURSEUR.min, max: BENEFICE_DU_CURSEUR.max }),
      zones: [`Taux effectif sous ${pct(TAUX_EFFECTIF_VISE * 100)}`, `Taux effectif au-dessus de ${pct(TAUX_EFFECTIF_VISE * 100)}`],
      rates: () => ({
        dessous: `Le taux effectif reste encore sous ${pct(TAUX_EFFECTIF_VISE * 100)} un peu plus loin : cherchez le plus grand bénéfice.`,
        dessus: `À cette position, l'impôt dépasse déjà ${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice.`,
      }),
      montrer: "Montrer la limite",
      lecture: (_c, b) => {
        const l = laboratoireDeLImpot(b, 0, true);
        const vise = vingtPourCent(b);
        return [
          { libelle: "Impôt sur les sociétés", montant: l.impot },
          { libelle: `${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice`, montant: vise },
          { libelle: "Économie du taux réduit", montant: l.economieDuTauxReduit },
          { libelle: `Marge sous ${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice`, montant: auCentime(vise - l.impot), fort: true },
        ];
      },
      droites: () => ({
        produit: vingtPourCent,
        cout: impotAuDelaDuPlafond,
        libelles: [`${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice`, "Impôt, au taux réduit puis au taux normal"],
      }),
      explication: (c) => {
        const x = impotDeNova(c);
        const economie = auCentime(PLAFOND_DU_TAUX_REDUIT * (TAUX_NORMAL - TAUX_REDUIT));
        return [
          `Jusqu'à ${eur(x.seuilDuTauxEffectif)}, l'impôt reste sous ${pct(TAUX_EFFECTIF_VISE * 100)} du bénéfice ; au-delà, il passe au-dessus. L'économie du taux réduit ne grandit pas avec le bénéfice : elle reste ${eur(economie)}, ${eur(PLAFOND_DU_TAUX_REDUIT)} × (${pct(TAUX_NORMAL * 100)} − ${pct(TAUX_REDUIT * 100)}), et pèse de moins en moins. Le taux effectif monte vers ${pct(TAUX_NORMAL * 100)} sans l'atteindre.`,
          `Au-delà de ${eur(PLAFOND_DU_TAUX_REDUIT)}, la droite de l'impôt monte de ${pct(TAUX_NORMAL * 100)} par euro de bénéfice : c'est le taux marginal, ce que paie le prochain euro. ${x.entreprise} gagne ${eur(x.benefice)} : son taux effectif est sous ${pct(TAUX_NORMAL * 100)}, son taux marginal est ${pct(TAUX_NORMAL * 100)}.`,
        ];
      },
    },
    {
      id: "l-impot-de-l-exercice",
      objectifs: [1],
      type: "montants",
      titre: "L'impôt de l'exercice",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Calculez l'impôt sur les sociétés ${dE(x.entreprise)} en ${x.e.exercice} sur son résultat fiscal : la part au taux réduit, la part au taux normal, l'impôt, puis le taux effectif, l'impôt rapporté au résultat comptable avant impôt, en %.`;
      },
      champs: (c) => {
        const x = impotDeNova(c);
        return [
          { libelle: "Impôt au taux réduit", attendu: x.aTauxReduit, calcul: `${eur(PLAFOND_DU_TAUX_REDUIT)} × ${pct(TAUX_REDUIT * 100)} = ${eur(x.aTauxReduit)}` },
          {
            libelle: "Impôt au taux normal",
            attendu: x.aTauxNormal,
            calcul: `(${eur(x.benefice)} − ${eur(PLAFOND_DU_TAUX_REDUIT)}) × ${pct(TAUX_NORMAL * 100)} = ${eur(x.baseAuTauxNormal)} × ${pct(TAUX_NORMAL * 100)} = ${eur(x.aTauxNormal)}`,
          },
          { libelle: "Impôt sur les sociétés", attendu: x.impot, calcul: `${eur(x.aTauxReduit)} + ${eur(x.aTauxNormal)} = ${eur(x.impot)}` },
          {
            libelle: "Taux effectif (%)",
            attendu: x.tauxEffectif,
            calcul: `${eur(x.impot)} ÷ ${eur(x.e.resultatComptable)} × 100 = ${pct(x.tauxEffectif)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `${x.entreprise} paie ${eur(x.impot)}, et garde ${eur(x.resultatNet)} de résultat net. Sur son résultat fiscal, l'impôt fait ${pct(x.tauxEffectifFiscal)} ; sur son résultat comptable, ${pct(x.tauxEffectif)}, parce qu'il porte aussi sur les ${eur(x.reintegrations)} réintégrés. Le taux réduit le fait baisser, une charge que la loi ne déduit pas le fait monter.`,
          `L'impôt se passe en charges au 31 décembre (le compte 695, au crédit du compte 444, État, impôt sur les bénéfices) : il est l'impôt de l'exercice, quoi qu'il en reste à payer.`,
        ];
      },
    },
    {
      id: "les-conditions-du-taux-reduit",
      objectifs: [1],
      type: "choix",
      titre: "Les conditions du taux réduit",
      notions: ["income_statement"],
      question: () => {
        const p = PIXEL_ET_LE_TAUX_REDUIT;
        return `PIXEL & CO, le commerçant en ligne du cours, fait ${eur(p.chiffreDAffaires)} de chiffre d'affaires hors taxes ; son capital est entièrement libéré, et ses fondateurs en détiennent ${pct(p.partDesPersonnesPhysiques * 100)}, un groupe de distribution le reste. Son bénéfice dépasse ${eur(PLAFOND_DU_TAUX_REDUIT)}. A-t-elle droit au taux réduit ?`;
      },
      options: () => {
        const k = CONDITIONS_DU_TAUX_REDUIT;
        return [
          {
            texte: `Non : son capital n'est pas détenu à ${pct(k.partMinimaleDesPersonnesPhysiques * 100)} par des personnes physiques`,
            juste: !eligibleAuTauxReduit(PIXEL_ET_LE_TAUX_REDUIT),
            retour: `Oui. Les conditions vont ensemble : un chiffre d'affaires sous ${eur(k.chiffreDAffairesMaximal)}, un capital entièrement libéré, et détenu pour ${pct(k.partMinimaleDesPersonnesPhysiques * 100)} au moins par des personnes physiques (ou par une société qui remplit elle-même ces conditions, ce que n'est pas un groupe de cette taille). PIXEL & CO paie ${pct(TAUX_NORMAL * 100)} sur tout son bénéfice.`,
          },
          {
            texte: `Oui : son chiffre d'affaires reste sous ${eur(k.chiffreDAffairesMaximal)}`,
            juste: false,
            retour: "Non : le chiffre d'affaires n'est qu'une des conditions. Le capital doit aussi être détenu, pour l'essentiel, par des personnes physiques.",
          },
          {
            texte: "Oui : son capital est entièrement libéré",
            juste: false,
            retour: "Non : un capital libéré ne suffit pas. Il doit aussi être détenu, pour l'essentiel, par des personnes physiques.",
          },
          {
            texte: `Non : son bénéfice dépasse ${eur(PLAFOND_DU_TAUX_REDUIT)}`,
            juste: false,
            retour: `Non : ${eur(PLAFOND_DU_TAUX_REDUIT)} n'est pas une condition d'accès, c'est le plafond de la tranche taxée au taux réduit. Une PME qui y a droit paie ${pct(TAUX_REDUIT * 100)} sur ses premiers ${eur(PLAFOND_DU_TAUX_REDUIT)}, quel que soit son bénéfice.`,
          },
        ];
      },
    },
    {
      id: "predire-le-solde",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le solde",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Avant de calculer, pariez. Les acomptes de ${x.e.exercice} se calculent sur l'impôt de N, ${eur(IMPOT_DE_NOVA_EN_N)}. En ${x.e.exercice}, ${x.entreprise} gagne plus qu'en N. Le ${ACOMPTES.dateDuSolde} N+2…`;
      },
      options: () => {
        const voir = "Faites varier le bénéfice de N+1 à l'étape suivante : le curseur montre quand les acomptes suffisent, et quand ils ne suffisent plus.";
        return [
          { texte: "Elle paiera un solde : les acomptes ont suivi l'impôt de N", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "L'État lui rendra une part des acomptes", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Elle ne devra rien : les acomptes suivent le bénéfice de l'année", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-solde-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "Les acomptes face à l'impôt",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Faites varier le bénéfice imposable ${dE(x.entreprise)} en ${x.e.exercice}, de ${eur(BENEFICE_DU_CURSEUR.min)} à ${eur(BENEFICE_DU_CURSEUR.max)}. Une droite donne les acomptes versés, calculés sur l'impôt de N : ils ne bougent pas. L'autre donne l'impôt de ${x.e.exercice}. Placez le curseur sur le plus grand bénéfice où les acomptes couvrent encore l'impôt, puis validez.`;
      },
      grandeur: () => ({ libelle: "Bénéfice imposable de N+1", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: impotDeNova(c).seuilDuSolde, min: BENEFICE_DU_CURSEUR.min, max: BENEFICE_DU_CURSEUR.max }),
      zones: ["L'État rend l'excédent", "Un solde à payer"],
      rates: () => ({
        dessous: "Les acomptes couvrent encore l'impôt un peu plus loin : cherchez le plus grand bénéfice.",
        dessus: "À cette position, l'impôt dépasse déjà les acomptes : il reste un solde à payer.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, b) => {
        const x = impotDeNova(c);
        const impot = impotDuBenefice(b, true).impot;
        return [
          { libelle: "Impôt de l'exercice", montant: impot },
          { libelle: "Acomptes versés, sur l'impôt de N", montant: x.totalVerse },
          { libelle: `Solde du ${ACOMPTES.dateDuSolde} N+2`, montant: auCentime(impot - x.totalVerse), fort: true },
        ];
      },
      droites: (c) => {
        const x = impotDeNova(c);
        return { produit: () => x.totalVerse, cout: impotAuDelaDuPlafond, libelles: ["Acomptes versés, sur l'impôt de N", "Impôt de N+1"] };
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `Les acomptes couvrent l'impôt jusqu'à ${eur(x.seuilDuSolde)} de bénéfice, presque exactement le bénéfice de N : ils reproduisent l'impôt de l'année d'avant. En dessous, l'État rend l'excédent après la déclaration ; au-dessus, ${x.entreprise} paie un solde. À ${eur(x.benefice)}, le solde est de ${eur(x.solde)}.`,
          "Une entreprise qui grandit paie donc toujours en retard d'un an une part de son impôt ; une entreprise dont le bénéfice baisse avance de l'impôt à l'État. Le droit lui permet de réduire ses derniers acomptes si elle prévoit un impôt plus faible, à ses risques.",
        ];
      },
    },
    {
      id: "les-acomptes-et-le-solde",
      objectifs: [3],
      type: "montants",
      titre: "Les acomptes et le solde",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Sans formule cette fois. Calculez chaque acompte ${dE(x.entreprise)} en ${x.e.exercice}, le total versé avant la clôture, puis le solde du ${ACOMPTES.dateDuSolde} N+2 (négatif si l'État rend).`;
      },
      champs: (c) => {
        const x = impotDeNova(c);
        return [
          { libelle: "Chaque acompte de N+1", attendu: x.acompte, calcul: `${eur(IMPOT_DE_NOVA_EN_N)} d'impôt de N ÷ ${NB} = ${eur(x.acompte)}` },
          { libelle: "Acomptes versés en N+1", attendu: x.totalVerse, calcul: `${NB} × ${eur(x.acompte)} = ${eur(x.totalVerse)}` },
          { libelle: `Solde du ${ACOMPTES.dateDuSolde} N+2`, attendu: x.solde, calcul: `${eur(x.impot)} − ${eur(x.totalVerse)} = ${eur(x.solde)}` },
        ];
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `Les acomptes ont payé ${eur(x.totalVerse)} sur ${eur(x.impot)} : ${x.entreprise} doit encore ${eur(x.solde)}, qu'elle paiera le ${ACOMPTES.dateDuSolde} N+2 avec sa déclaration. Les acomptes de N+2 se calculeront à leur tour sur ${eur(x.impot)}, soit ${eur(x.acompteDeN2)} chacun : la trésorerie de N+2 paiera à la fois le solde de N+1 et des acomptes plus lourds.`,
          `Un acompte n'est dû que si l'impôt de référence atteint ${eur(ACOMPTES.seuilDeDispense)} ; au premier exercice d'une société nouvelle, il n'y en a pas. C'est pourquoi ${x.entreprise} n'en avait versé aucun en N.`,
        ];
      },
    },
    {
      id: "au-31-decembre",
      objectifs: [3],
      type: "choix",
      titre: "Au 31 décembre",
      notions: ["balance_sheet", "income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Au 31 décembre ${x.e.exercice}, ${x.entreprise} a passé l'impôt de l'exercice en charges et versé ses ${NB} acomptes. Que porte son bilan au titre de l'impôt sur les sociétés ?`;
      },
      options: (c) => {
        const x = impotDeNova(c);
        return [
          {
            texte: `Une dette de ${eur(x.solde)} envers l'État`,
            juste: true,
            retour: `Oui : le compte 444 est crédité de l'impôt, ${eur(x.impot)}, et débité des acomptes, ${eur(x.totalVerse)}. Son solde créditeur, ${eur(x.solde)}, est une dette fiscale, payée le ${ACOMPTES.dateDuSolde} suivant.`,
          },
          {
            texte: `Une dette de ${eur(x.impot)}, l'impôt de l'exercice entier`,
            juste: false,
            retour: `Non : c'est oublier les acomptes. Ils ont déjà payé ${eur(x.totalVerse)} de cet impôt ; seul le reste est dû.`,
          },
          {
            texte: `Une créance de ${eur(x.solde)} sur l'État`,
            juste: false,
            retour: `Non : le signe est inversé. ${x.entreprise} a versé moins que son impôt ; c'est elle qui doit. Une créance naîtrait si les acomptes avaient dépassé l'impôt.`,
          },
          {
            texte: "Rien : les acomptes ont payé l'impôt de l'exercice",
            juste: false,
            retour: `Non : les acomptes se calculent sur l'impôt de N, pas sur celui de ${x.e.exercice}. Ils n'en ont payé que ${eur(x.totalVerse)}.`,
          },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-impot",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de l'impôt",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Faites varier le résultat comptable ${dE(x.entreprise)}, ses réintégrations et son barème. Le tableau suit le résultat fiscal, l'impôt et les deux taux ; le graphique trace le taux effectif et le taux marginal selon le résultat comptable. Relevez le défi, et comparez les deux taux.`;
      },
      leviers: (c) => {
        const x = impotDeNova(c);
        const L = LEVIERS_DE_L_IMPOT;
        return [
          { code: "resultat", libelle: "Résultat comptable avant impôt", unite: "€", min: L.resultat.min, max: L.resultat.max, pas: L.resultat.pas, depart: x.e.resultatComptable },
          { code: "reintegrations", libelle: "Réintégrations", unite: "€", min: L.reintegrations.min, max: L.reintegrations.max, pas: L.reintegrations.pas, depart: x.reintegrations },
          {
            code: "bareme",
            libelle: "Le barème",
            unite: "",
            min: BAREMES.normal,
            max: BAREMES.reduit,
            pas: 1,
            depart: x.eligible ? BAREMES.reduit : BAREMES.normal,
            choix: [
              { valeur: BAREMES.normal, libelle: `Le taux normal seul, ${pct(TAUX_NORMAL * 100)}` },
              { valeur: BAREMES.reduit, libelle: `Le taux réduit d'une PME, ${pct(TAUX_REDUIT * 100)} puis ${pct(TAUX_NORMAL * 100)}` },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const x = impotDeNova(c);
        const l = laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit);
        const d = laboratoireDeLImpot(x.e.resultatComptable, x.reintegrations, x.eligible);
        return [
          { libelle: "Résultat fiscal", montant: l.benefice, reference: d.benefice },
          { libelle: "Impôt sur les sociétés", montant: l.impot, reference: d.impot, fort: true },
          { libelle: "Économie du taux réduit", montant: p.bareme === BAREMES.reduit ? l.economieDuTauxReduit : 0, reference: d.economieDuTauxReduit, effet: true },
          { libelle: "Résultat net", montant: l.resultatNet, reference: d.resultatNet },
          { libelle: "Taux effectif, sur le résultat comptable", montant: l.tauxEffectif, reference: d.tauxEffectif, unite: "%" },
          { libelle: "Taux marginal", montant: l.tauxMarginal, reference: d.tauxMarginal, unite: "%" },
        ];
      },
      graphique: () => ({
        levier: "resultat",
        unite: "%",
        courbes: [
          { libelle: "Taux effectif", valeur: (p) => laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit).tauxEffectif },
          { libelle: "Taux marginal", valeur: (p) => laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit).tauxMarginal },
        ],
      }),
      defi: () => {
        const vise = enPct(TAUX_EFFECTIF_VISE);
        const reussi = (p: Readonly<Record<string, number>>) => {
          const l = laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit);
          return l.tauxEffectif < vise && l.tauxMarginal === enPct(TAUX_NORMAL);
        };
        return {
          consigne: `Trouvez une position où le taux effectif passe sous ${pct(vise)} alors que le taux marginal reste à ${pct(TAUX_NORMAL * 100)}.`,
          atteint: reussi,
          indice: (p) => {
            const l = laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit);
            if (p.bareme !== BAREMES.reduit) return `Au taux normal seul, l'impôt fait ${pct(TAUX_NORMAL * 100)} du résultat fiscal, et plus encore du résultat comptable dès qu'il y a des réintégrations : le taux effectif ne descend jamais sous ${pct(TAUX_NORMAL * 100)}.`;
            if (l.tauxMarginal !== enPct(TAUX_NORMAL)) return `Sous ${eur(PLAFOND_DU_TAUX_REDUIT)} de résultat fiscal, le prochain euro ne paie que ${pct(TAUX_REDUIT * 100)} : le taux marginal doit rester à ${pct(TAUX_NORMAL * 100)}.`;
            return `Le taux effectif vaut ${pct(l.tauxEffectif)} : l'économie du taux réduit, ${eur(l.economieDuTauxReduit)}, pèse trop peu sur ${eur(p.resultat!)}. Baissez le résultat comptable, ou les réintégrations.`;
          },
          solution: SOLUTION_DU_LABORATOIRE,
        };
      },
      explication: (c, p) => {
        const x = impotDeNova(c);
        const l = laboratoireDeLImpot(p.resultat!, p.reintegrations!, p.bareme === BAREMES.reduit);
        return [
          `À ${eur(p.resultat!)} de résultat comptable, l'impôt fait ${pct(l.tauxEffectif)} : le taux effectif est sous ${pct(enPct(TAUX_EFFECTIF_VISE))}, et pourtant le prochain euro de bénéfice paiera ${pct(l.tauxMarginal)}. Le taux effectif est une moyenne, le taux marginal une pente : la courbe du premier monte doucement, celle du second est une marche, à ${eur(PLAFOND_DU_TAUX_REDUIT)} de résultat fiscal.`,
          `Pour juger une décision (une charge de plus, une vente de plus, un projet), c'est le taux marginal qui compte : chez ${x.entreprise}, chaque euro de plus ou de moins pèse ${pct(x.tauxMarginal)}. Et une réintégration fait monter le taux effectif sur le résultat comptable : elle est taxée sans être un bénéfice.`,
        ];
      },
    },
    {
      id: "sans-le-taux-reduit",
      objectifs: [1],
      type: "montants",
      titre: "Variante : un fonds entre au capital",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Variante : en ${x.e.exercice}, un fonds d'investissement entre au capital ${dE(x.entreprise)}, et les associés fondateurs n'en gardent que ${pct(PART_DES_FONDATEURS_APRES_LE_FONDS * 100)}. Rien d'autre ne change. Calculez l'impôt de ${x.e.exercice}, l'impôt en plus par rapport au taux réduit, puis le taux effectif sur le résultat comptable, en %.`;
      },
      champs: (c) => {
        const x = impotDeNova(c);
        return [
          { libelle: "Impôt sans le taux réduit", attendu: x.sansTauxReduit, calcul: `${pct(PART_DES_FONDATEURS_APRES_LE_FONDS * 100)} < ${pct(CONDITIONS_DU_TAUX_REDUIT.partMinimaleDesPersonnesPhysiques * 100)} : plus de taux réduit, ${eur(x.benefice)} × ${pct(TAUX_NORMAL * 100)} = ${eur(x.sansTauxReduit)}` },
          { libelle: "Impôt en plus", attendu: x.impotEnPlus, calcul: `${eur(x.sansTauxReduit)} − ${eur(x.impot)} = ${eur(x.impotEnPlus)}, soit ${eur(PLAFOND_DU_TAUX_REDUIT)} × (${pct(TAUX_NORMAL * 100)} − ${pct(TAUX_REDUIT * 100)})` },
          {
            libelle: "Taux effectif sans le taux réduit (%)",
            attendu: x.tauxEffectifSansTauxReduit,
            calcul: `${eur(x.sansTauxReduit)} ÷ ${eur(x.e.resultatComptable)} × 100 = ${pct(x.tauxEffectifSansTauxReduit)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `Le taux réduit valait ${eur(x.impotEnPlus)} par an à ${x.entreprise}, quel que soit son bénéfice au-delà de ${eur(PLAFOND_DU_TAUX_REDUIT)}. Sans lui, son taux effectif sur le résultat comptable passe à ${pct(x.tauxEffectifSansTauxReduit)}, au-dessus du taux normal : les ${eur(x.reintegrations)} réintégrés paient l'impôt sans être un bénéfice.`,
          `C'est un coût de l'ouverture du capital que les associés doivent chiffrer : l'argent du fonds a un prix, et la perte du taux réduit en fait partie. Le taux marginal, lui, ne change pas : il était déjà de ${pct(x.tauxMarginal)}.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Remonter du solde à l'impôt",
      notions: ["income_statement", "cash_budget"],
      question: (c) => {
        const x = impotDeNova(c);
        return `Un an plus tard, le relevé du ${ACOMPTES.dateDuSolde} N+3 annonce que l'État rend ${eur(-SOLDE_DE_N2_A_REBOURS)} à ${x.entreprise} au titre de N+2. Ses acomptes de N+2 se sont calculés sur l'impôt de ${x.e.exercice}, et elle a toujours droit au taux réduit. Retrouvez les acomptes versés en N+2, l'impôt de N+2, puis son résultat fiscal.`;
      },
      champs: (c) => {
        const x = impotDeNova(c);
        return [
          { libelle: "Acomptes versés en N+2", attendu: x.versesEnN2, calcul: `${NB} × (${eur(x.impot)} ÷ ${NB}) = ${NB} × ${eur(x.acompteDeN2)} = ${eur(x.versesEnN2)}` },
          { libelle: "Impôt de N+2", attendu: x.impotDeN2, calcul: `${eur(x.versesEnN2)} − ${eur(-SOLDE_DE_N2_A_REBOURS)} rendus = ${eur(x.impotDeN2)}` },
          {
            libelle: "Résultat fiscal de N+2",
            attendu: x.beneficeDeN2,
            calcul: `${eur(PLAFOND_DU_TAUX_REDUIT)} + (${eur(x.impotDeN2)} − ${eur(IMPOT_DE_LA_TRANCHE_REDUITE)}) ÷ ${pct(TAUX_NORMAL * 100)} = ${eur(x.beneficeDeN2)}`,
          },
        ];
      },
      explication: (c) => {
        const x = impotDeNova(c);
        return [
          `Remonter le barème demande de savoir où l'on est : l'impôt de N+2, ${eur(x.impotDeN2)}, dépasse les ${eur(IMPOT_DE_LA_TRANCHE_REDUITE)} de la tranche réduite, donc le bénéfice dépasse ${eur(PLAFOND_DU_TAUX_REDUIT)}, et chaque euro d'impôt au-delà vient de ${eur(1 / TAUX_NORMAL)} de bénéfice. ${x.entreprise} a gagné ${eur(x.beneficeDeN2)} de résultat fiscal en N+2, moins qu'en ${x.e.exercice} : ses acomptes, calculés sur l'année d'avant, étaient trop lourds.`,
          `Diviser ${eur(x.impotDeN2)} par ${pct(TAUX_NORMAL * 100)} donnerait ${eur(auCentime(x.impotDeN2 / TAUX_NORMAL))} : c'est oublier que les premiers ${eur(PLAFOND_DU_TAUX_REDUIT)} ne paient que ${pct(TAUX_REDUIT * 100)}.`,
        ];
      },
    },
    {
      id: "la-depense-de-decembre",
      objectifs: [4],
      type: "choix",
      titre: "La dépense de décembre",
      notions: ["income_statement"],
      question: (c) => {
        const x = impotDeNova(c);
        return `En décembre ${x.e.exercice}, le gérant ${dE(x.entreprise)} veut « dépenser avant le 31 pour payer moins d'impôt ». Que vaut l'argument ?`;
      },
      options: (c) => {
        const x = impotDeNova(c);
        return [
          {
            texte: `Une charge inutile coûte ${pct((1 - TAUX_NORMAL) * 100)} de son montant : l'impôt n'en paie qu'un quart`,
            juste: true,
            retour: `Oui. Au taux marginal de ${pct(x.tauxMarginal)}, ${eur(DEPENSE_DE_FIN_D_ANNEE)} de charges font ${eur(auCentime(DEPENSE_DE_FIN_D_ANNEE * TAUX_NORMAL))} d'impôt en moins et ${eur(auCentime(DEPENSE_DE_FIN_D_ANNEE * (1 - TAUX_NORMAL)))} de résultat net en moins. Une dépense utile de toute façon peut être avancée ; une dépense faite pour l'impôt appauvrit l'entreprise. Et avancer une charge ne fait souvent que décaler l'impôt d'un exercice.`,
          },
          {
            texte: "Chaque euro dépensé fait économiser un euro d'impôt",
            juste: false,
            retour: `Non : un euro de charge retire un euro au bénéfice, et seulement ${pct(TAUX_NORMAL * 100)} à l'impôt.`,
          },
          {
            texte: `Elle n'économise que ${pct(TAUX_REDUIT * 100)} de son montant, le taux réduit de la PME`,
            juste: false,
            retour: `Non : c'est confondre le taux réduit et le taux marginal. ${x.entreprise} gagne ${eur(x.benefice)}, bien au-delà de ${eur(PLAFOND_DU_TAUX_REDUIT)} : le dernier euro paie ${pct(TAUX_NORMAL * 100)}, et c'est lui que la dépense retire.`,
          },
          {
            texte: `Une machine de ${eur(MACHINE_DE_DECEMBRE)} achetée le 20 décembre fait ${eur(MACHINE_DE_DECEMBRE * TAUX_NORMAL)} d'impôt en moins`,
            juste: false,
            retour: "Non : une machine est une immobilisation, pas une charge. Seul son amortissement de l'exercice, quelques jours au prorata, se déduit cette année.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement", "cash_budget", "balance_sheet"],
      tableau: (c) => tableauDeLImpot(impotDeNova(c)),
      texte: (c) => {
        const x = impotDeNova(c);
        return [
          `${x.entreprise} gagne ${eur(x.e.resultatComptable)} avant impôt en ${x.e.exercice}, et elle est taxée sur ${eur(x.benefice)} : ${eur(x.reintegrations)} de charges que la loi ne déduit pas. Elle paie ${eur(x.impot)}, ${eur(x.aTauxReduit)} au taux réduit et ${eur(x.aTauxNormal)} au taux normal ; ses acomptes, calculés sur l'impôt de N, en ont payé ${eur(x.totalVerse)}, et le solde de ${eur(x.solde)} est une dette au 31 décembre.`,
          `Deux taux à ne pas confondre : le taux effectif, ${pct(x.tauxEffectif)}, dit ce que l'impôt prend en moyenne ; le taux marginal, ${pct(x.tauxMarginal)}, dit ce que paie le prochain euro, et c'est lui qui juge une dépense, une vente ou un projet. Dépenser en décembre pour l'impôt, c'est perdre ${pct((1 - TAUX_NORMAL) * 100)} de chaque euro.`,
          "Au niveau de l'examen, vous savez passer du résultat comptable au résultat fiscal, appliquer le barème et ses conditions, calculer les acomptes et le solde, remonter d'un solde au résultat fiscal, et critiquer une décision prise pour l'impôt.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        `Résultat fiscal = résultat comptable + réintégrations − déductions. Impôt = ${pct(TAUX_REDUIT * 100)} jusqu'à ${eur(PLAFOND_DU_TAUX_REDUIT)} (pour une PME qui y a droit) + ${pct(TAUX_NORMAL * 100)} au-delà. Taux effectif = impôt ÷ résultat comptable avant impôt ; taux marginal = ce que paie le prochain euro. Solde = impôt de l'exercice − acomptes versés.`,
    },
  ],
};
