import { auCentime } from "./amortissement";
import { departDeLaFiche, equipeMoisParMois, partDuMarche } from "./capacite";
import { PAIE_DU_MOIS } from "./exercice-de-nova";
import { FICHE_RH, HEURES_LEGALES_PAR_MOIS, MOIS_DU_RECRUTEMENT, SMIC_HORAIRE_BRUT, TAUX_PATRONAL } from "./ressources-humaines-de-nova";

/**
 * LE MONDE DU COURS : LA MASSE SALARIALE PRÉVISIONNELLE DE NOVA ET SES ÉCARTS (le chapitre « La masse
 * salariale prévisionnelle et ses écarts », DCG UE11 3.2 et DSCG UE3 2.6).
 *
 * AUCUN SALAIRE NOUVEAU SUR CE QUI S'EST PASSÉ. L'équipe de décembre N est celle de la paie du cours
 * (exercice-de-nova.ts, ressources-humaines-de-nova.ts) : quatre opérateurs à 1 875 € bruts pour
 * 151,67 heures, 7 500 € bruts par mois, aux taux du chapitre « La paie » (42 % de cotisations
 * patronales). Aucune hausse en N : la masse brute de N fait 90 000 €, la masse chargée 127 800 €,
 * les comptes 641 et 645 du premier exercice. Le salaire du marché de N + 1 (2 000 €) et le seuil de
 * démission (95 %) sont ceux de nova-capacite.ts ; le départ d'un opérateur et l'arrivée de son
 * remplaçant, ceux des chapitres de ressources humaines (capacite.ts) ; le cinquième opérateur arrive le 1er mars, comme au
 * chapitre « Recruter » (recrutement lancé en janvier, deux mois de délai).
 *
 * LES HYPOTHÈSES DU CHAPITRE (la politique salariale de N + 1), nommées ci-dessous : deux hausses
 * générales, une promotion, un départ remplacé, un salaire d'embauche, et ce qui s'est réellement
 * passé en N + 1 pour le contrôle budgétaire. La garde tests/cours/la-masse-salariale-previsionnelle.test.ts
 * refait chaque chiffre à la main.
 *
 * CONVENTIONS : les montants sont bruts (la masse chargée = brute × 1,42) ; un salaire mensuel se
 * calcule au centime après chaque hausse ; une hausse s'applique le premier jour de son mois, à tout
 * salarié présent avant ce mois (une recrue reçoit les hausses qui suivent son arrivée, pas celles qui
 * la précèdent). Les indices sont en base 100 au salaire de décembre N.
 */

const MOIS_PAR_AN = 12;
const somme = (xs: readonly number[]) => auCentime(xs.reduce((t, x) => t + x, 0));

/** Le salaire de décembre N d'un opérateur et l'équipe de décembre N : ceux de la paie du cours. */
export const SALAIRE_DE_DECEMBRE_N = FICHE_RH.operateurs.salaireBrutMensuel;
export const EFFECTIF_DE_DECEMBRE_N = PAIE_DU_MOIS.effectif;

/** Une hausse générale : son mois (1 à 12) et son taux. */
export interface HausseGenerale {
  mois: number;
  taux: number;
}

/**
 * LA POLITIQUE SALARIALE DE N + 1 (hypothèse du chapitre) : 2 % au 1er janvier, qui porte un opérateur
 * à 1 912,50 €, au-dessus des 95 % du marché (1 900 €) sous lesquels il part ; puis 2 % au 1er octobre.
 */
export const HAUSSES_DE_N_PLUS_1: readonly HausseGenerale[] = [
  { mois: 1, taux: 0.02 },
  { mois: 10, taux: 0.02 },
];

/** Aucune hausse en N : NOVA a payé 1 875 € tous les mois de son premier exercice. */
export const HAUSSES_DE_N: readonly HausseGenerale[] = [];

/**
 * LE SALAIRE D'EMBAUCHE DE N + 1 : le plus bas qui garde un opérateur, 95 % du salaire du marché de
 * N + 1 (1 900 €). Une recrue payée moins partirait (le seuil de démission de nova-capacite.ts).
 */
export const SALAIRE_D_EMBAUCHE = partDuMarche(FICHE_RH).salaireAuSeuil;

/** LA PROMOTION (hypothèse du chapitre) : un opérateur devient chef d'équipe le 1er avril, à 2 100 € bruts. */
export const PROMOTION = { mois: 4, salaire: 2_100, poste: "chef d'équipe" } as const;

/**
 * LE DÉPART ET SON REMPLACEMENT : ceux des chapitres de ressources humaines (capacite.ts). Un opérateur
 * annonce son départ le 1er mars et part le 31 mars ; le recrutement commence en avril, et son
 * remplaçant arrive le 1er juin, au salaire d'embauche. La direction le met au budget.
 */
export const DEPART = { dernierMois: departDeLaFiche(FICHE_RH).dernierMois, arriveeDuRemplacant: equipeMoisParMois(FICHE_RH).arrivee! } as const;

/** Le cinquième opérateur (chapitre « Recruter ») : recrutement lancé en janvier, deux mois de délai. */
export const ARRIVEE_DU_CINQUIEME = MOIS_DU_RECRUTEMENT + FICHE_RH.personnel.delaiDeRecrutementEnMois;

/**
 * CE QUI S'EST PASSÉ EN N + 1 (hypothèse du contrôle budgétaire) : le remplaçant arrive le 1er mai,
 * un mois plus tôt que prévu ; le cinquième opérateur a négocié 1 950 € à l'embauche. Les anciens ont
 * été payés comme prévu.
 */
export const REALISE_DE_N_PLUS_1 = { arriveeDuRemplacant: DEPART.arriveeDuRemplacant - 1, salaireDuCinquieme: 1_950 } as const;

/** L'ENVELOPPE DE LA DIRECTION (hypothèse du chapitre) : les hausses ne font pas monter la masse de l'équipe de plus de 2,6 % sur N + 1. */
export const ENVELOPPE_DE_L_EFFET_DE_MASSE = 0.026;

/** CE QUE DEMANDENT LES OPÉRATEURS (hypothèse du laboratoire) : 4 % de plus sur l'année, de décembre à décembre. */
export const NIVEAU_DEMANDE = 0.04;

// ─────────────────────────────────────────────────────────────────────────────
// LES INDICES ET LES TROIS EFFETS
// ─────────────────────────────────────────────────────────────────────────────

/** Le coefficient d'un mois (1 à 12) : le produit des hausses dont le mois est passé, après `depuis`. */
export const coefficientDuMois = (hausses: readonly HausseGenerale[], mois: number, depuis = 0) =>
  hausses.filter((h) => h.mois > depuis && h.mois <= mois).reduce((k, h) => k * (1 + h.taux), 1);

/** Les douze indices d'une année (base 100 au salaire de décembre de l'année d'avant). */
export const indicesDeLAnnee = (hausses: readonly HausseGenerale[]) => Array.from({ length: MOIS_PAR_AN }, (_, i) => Number((100 * coefficientDuMois(hausses, i + 1)).toFixed(6)));

/**
 * LES TROIS EFFETS d'une politique, à effectif constant. L'effet de niveau = indice de décembre ÷
 * indice de décembre de l'année d'avant (100) ; l'effet de masse = somme des douze indices ÷ 1 200 ;
 * l'effet de report sur l'année suivante = 12 × indice de décembre ÷ somme des indices. Ils se tiennent :
 * effet de niveau = effet de masse × effet de report.
 */
export function effetsDesHausses(hausses: readonly HausseGenerale[] = HAUSSES_DE_N_PLUS_1) {
  const indices = indicesDeLAnnee(hausses);
  const cumul = Number(indices.reduce((t, x) => t + x, 0).toFixed(6));
  const decembre = indices[MOIS_PAR_AN - 1]!;
  return {
    indices,
    cumul,
    decembre,
    niveau: decembre / 100,
    masse: cumul / (100 * MOIS_PAR_AN),
    report: (MOIS_PAR_AN * decembre) / cumul,
  };
}

/** La masse brute de l'équipe de décembre N sur N + 1, à effectif constant : 7 500 € × la somme des indices. */
export const masseAEffectifConstant = (hausses: readonly HausseGenerale[] = HAUSSES_DE_N_PLUS_1) =>
  auCentime((EFFECTIF_DE_DECEMBRE_N * SALAIRE_DE_DECEMBRE_N * effetsDesHausses(hausses).cumul) / 100);

/** La masse brute de N : l'équipe de décembre N, sans hausse, douze mois. */
export const masseBruteDeN = () => auCentime(EFFECTIF_DE_DECEMBRE_N * SALAIRE_DE_DECEMBRE_N * MOIS_PAR_AN);

/** Le premier mois de la seconde hausse où la masse de l'équipe tient dans l'enveloppe, la première hausse gardée. */
export function premierMoisDansLEnveloppe(hausses: readonly HausseGenerale[] = HAUSSES_DE_N_PLUS_1) {
  const plafond = auCentime(masseBruteDeN() * (1 + ENVELOPPE_DE_L_EFFET_DE_MASSE));
  for (let m = 2; m <= MOIS_PAR_AN; m++) if (masseAEffectifConstant([hausses[0]!, { mois: m, taux: hausses[1]!.taux }]) <= plafond + 1e-9) return m;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUDGET DE N + 1, SALARIÉ PAR SALARIÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Une période de paie d'un salarié : ses mois (de, à), son salaire de base, et le mois d'où partent ses hausses. */
interface Periode {
  de: number;
  a: number;
  base: number;
  depuis: number;
}

export type CodeDuSalarie = "stables" | "promu" | "sortant" | "cinquieme" | "remplacant";
export type CategorieDuSalarie = "anciens" | "recrues";

export interface SalarieDuBudget {
  code: CodeDuSalarie;
  libelle: string;
  /** Combien de salariés la ligne compte (deux opérateurs stables, un seul ailleurs). */
  nombre: number;
  categorie: CategorieDuSalarie;
  /** Les salaires bruts d'un salarié de la ligne, de janvier à décembre (0 : absent). */
  salaires: readonly number[];
  moisPayes: number;
  masse: number;
}

export interface HypothesesDeLAnnee {
  hausses: readonly HausseGenerale[];
  arriveeDuRemplacant: number;
  salaireDuRemplacant: number;
  salaireDuCinquieme: number;
}

export const HYPOTHESES_DU_BUDGET: HypothesesDeLAnnee = {
  hausses: HAUSSES_DE_N_PLUS_1,
  arriveeDuRemplacant: DEPART.arriveeDuRemplacant,
  salaireDuRemplacant: SALAIRE_D_EMBAUCHE,
  salaireDuCinquieme: SALAIRE_D_EMBAUCHE,
};

export const HYPOTHESES_DU_REALISE: HypothesesDeLAnnee = {
  ...HYPOTHESES_DU_BUDGET,
  arriveeDuRemplacant: REALISE_DE_N_PLUS_1.arriveeDuRemplacant,
  salaireDuCinquieme: REALISE_DE_N_PLUS_1.salaireDuCinquieme,
};

function salairesDe(periodes: readonly Periode[], hausses: readonly HausseGenerale[]) {
  return Array.from({ length: MOIS_PAR_AN }, (_, i) => {
    const m = i + 1;
    const p = periodes.find((x) => m >= x.de && m <= x.a);
    return p ? auCentime(p.base * coefficientDuMois(hausses, m, p.depuis)) : 0;
  });
}

function ligne(code: CodeDuSalarie, libelle: string, nombre: number, categorie: CategorieDuSalarie, periodes: readonly Periode[], hausses: readonly HausseGenerale[]): SalarieDuBudget {
  const salaires = salairesDe(periodes, hausses);
  const moisPayes = salaires.filter((s) => s > 0).length;
  return { code, libelle, nombre, categorie, salaires, moisPayes: nombre * moisPayes, masse: auCentime(nombre * somme(salaires)) };
}

/** Les salariés de l'année, ligne par ligne, selon les hypothèses (le budget par défaut). */
export function salariesDeLAnnee(h: HypothesesDeLAnnee = HYPOTHESES_DU_BUDGET): SalarieDuBudget[] {
  const s = SALAIRE_DE_DECEMBRE_N;
  return [
    ligne("stables", "Les opérateurs présents toute l'année", EFFECTIF_DE_DECEMBRE_N - 2, "anciens", [{ de: 1, a: 12, base: s, depuis: 0 }], h.hausses),
    ligne("promu", `L'opérateur promu ${PROMOTION.poste}`, 1, "anciens", [{ de: 1, a: PROMOTION.mois - 1, base: s, depuis: 0 }, { de: PROMOTION.mois, a: 12, base: PROMOTION.salaire, depuis: PROMOTION.mois }], h.hausses),
    ligne("sortant", "L'opérateur qui part", 1, "anciens", [{ de: 1, a: DEPART.dernierMois, base: s, depuis: 0 }], h.hausses),
    ligne("cinquieme", "Le cinquième opérateur", 1, "recrues", [{ de: ARRIVEE_DU_CINQUIEME, a: 12, base: h.salaireDuCinquieme, depuis: ARRIVEE_DU_CINQUIEME }], h.hausses),
    ligne("remplacant", "Le remplaçant", 1, "recrues", [{ de: h.arriveeDuRemplacant, a: 12, base: h.salaireDuRemplacant, depuis: h.arriveeDuRemplacant }], h.hausses),
  ];
}

const parCode = (xs: readonly SalarieDuBudget[], code: CodeDuSalarie) => xs.find((x) => x.code === code)!;

/** Une catégorie de l'année : ses mois payés, sa masse, son salaire mensuel moyen. */
function categorie(xs: readonly SalarieDuBudget[], c: CategorieDuSalarie) {
  const lignes = xs.filter((x) => x.categorie === c);
  const mois = lignes.reduce((t, x) => t + x.moisPayes, 0);
  const masse = somme(lignes.map((x) => x.masse));
  return { mois, masse, moyen: masse / mois };
}

/**
 * LE BUDGET DE LA MASSE SALARIALE DE N + 1 : salarié par salarié, la masse brute, la masse chargée,
 * et ce qui la sépare de N, effet par effet :
 *   · les hausses générales, sur l'équipe de décembre N gardée toute l'année (à effectif constant) ;
 *   · le GVT, ici la technicité : ce que la promotion ajoute à ce que l'opérateur promu aurait gagné ;
 *   · l'effet de noria : ce que le remplaçant coûte de moins que le sortant, depuis son arrivée ;
 *   · l'effet d'effectif : le cinquième opérateur, moins les mois où le poste du sortant reste vide.
 * Les quatre font, au centime, la variation de la masse brute.
 */
export function budgetDeLaMasse(h: HypothesesDeLAnnee = HYPOTHESES_DU_BUDGET) {
  const salaries = salariesDeLAnnee(h);
  const brute = somme(salaries.map((x) => x.masse));
  const chargee = auCentime(brute * (1 + TAUX_PATRONAL));
  const deN = masseBruteDeN();
  const constant = masseAEffectifConstant(h.hausses);
  const unAncien = constant / EFFECTIF_DE_DECEMBRE_N;
  const sansHausse = salairesDe([{ de: 1, a: 12, base: SALAIRE_DE_DECEMBRE_N, depuis: 0 }], h.hausses);
  const sortant = parCode(salaries, "sortant");
  const remplacant = parCode(salaries, "remplacant");
  // Ce que le sortant aurait gagné les mois où son remplaçant est payé, et les mois où le poste reste vide.
  const sortantAuxMoisDuRemplacant = somme(sansHausse.filter((_, i) => remplacant.salaires[i]! > 0));
  const vacance = somme(sansHausse.filter((_, i) => sortant.salaires[i] === 0 && remplacant.salaires[i] === 0));
  const generales = auCentime(constant - deN);
  const gvt = auCentime(parCode(salaries, "promu").masse - unAncien);
  const noria = auCentime(remplacant.masse - sortantAuxMoisDuRemplacant);
  const effectif = auCentime(parCode(salaries, "cinquieme").masse - vacance);
  const anciens = categorie(salaries, "anciens");
  const recrues = categorie(salaries, "recrues");
  const mois = anciens.mois + recrues.mois;
  return {
    salaries,
    brute,
    chargee,
    deN,
    chargeeDeN: auCentime(deN * (1 + TAUX_PATRONAL)),
    variation: auCentime(brute - deN),
    variationRelative: brute / deN - 1,
    effets: { generales, gvt, noria, effectif, vacance, sortantAuxMoisDuRemplacant },
    categories: { anciens, recrues },
    mois,
    moyen: brute / mois,
    /** L'équipe de décembre N + 1, et sa masse de N + 2 sans aucune hausse. */
    effectifDeDecembre: salaries.reduce((t, x) => t + (x.salaires[MOIS_PAR_AN - 1]! > 0 ? x.nombre : 0), 0),
    masseDeNPlus2SansHausse: auCentime(MOIS_PAR_AN * somme(salaries.map((x) => x.nombre * x.salaires[MOIS_PAR_AN - 1]!))),
  };
}

export type BudgetDeLaMasse = ReturnType<typeof budgetDeLaMasse>;

// ─────────────────────────────────────────────────────────────────────────────
// LE CONTRÔLE BUDGÉTAIRE : DU PRÉVU AU RÉALISÉ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LES ÉCARTS SUR LA MASSE SALARIALE (prévu, le budget ; réel, le réalisé de N + 1), sur les mois
 * payés de deux catégories, les anciens (en poste au 31 décembre N) et les recrues. Écart total = masse
 * réelle − masse prévue = écart sur effectif + écart de structure + écart sur salaire :
 *   · sur effectif = (mois réels − mois prévus) × salaire moyen prévu ;
 *   · de structure = Σ mois réels × salaire moyen prévu de la catégorie − mois réels × salaire moyen prévu ;
 *   · sur salaire (taux nominal) = Σ mois réels × (salaire moyen réel − salaire moyen prévu) de la catégorie.
 * Un écart positif est défavorable : la masse coûte plus que prévu.
 */
export function ecartsDeLaMasse(prevu: BudgetDeLaMasse = budgetDeLaMasse(), reel: BudgetDeLaMasse = budgetDeLaMasse(HYPOTHESES_DU_REALISE)) {
  const cats: CategorieDuSalarie[] = ["anciens", "recrues"];
  // Deux décimales (10 novembre 2026) : chaque terme se calcule en une ligne sur les masses, mois ×
  // masse prévue ÷ mois prévus, arrondie au centime ; le salaire moyen n'est pas arrondi en chemin,
  // et les trois écarts retombent juste sur l'écart total.
  const auSalaireMoyen = (mois: number, masse: number, moisPrevus: number) => auCentime((mois * masse) / moisPrevus);
  const auMoyenDe = (c: CategorieDuSalarie) => auSalaireMoyen(reel.categories[c].mois, prevu.categories[c].masse, prevu.categories[c].mois);
  const aStructureReelle = auCentime(cats.reduce((t, c) => t + auMoyenDe(c), 0));
  const aSalaireMoyenPrevu = auSalaireMoyen(reel.mois, prevu.brute, prevu.mois);
  const effectif = auSalaireMoyen(reel.mois - prevu.mois, prevu.brute, prevu.mois);
  const structure = auCentime(aStructureReelle - aSalaireMoyenPrevu);
  const salaireParCategorie = Object.fromEntries(cats.map((c) => [c, auCentime(reel.categories[c].masse - auMoyenDe(c))])) as Record<CategorieDuSalarie, number>;
  const salaire = auCentime(salaireParCategorie.anciens + salaireParCategorie.recrues);
  return {
    prevu,
    reel,
    total: auCentime(reel.brute - prevu.brute),
    /** Ce que chaque catégorie coûterait, ses mois réels au salaire moyen prévu : une ligne du corrigé. */
    auMoyenDe,
    aSalaireMoyenPrevu,
    aStructureReelle,
    effectif,
    structure,
    salaireParCategorie,
    salaire,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE SALAIRE HORAIRE ET LE SMIC
// ─────────────────────────────────────────────────────────────────────────────

/** Le salaire horaire brut d'un salaire mensuel, pour 151,67 heures, et sa marge sur le SMIC (12,31 €). */
export function salaireHoraire(mensuel: number) {
  const horaire = mensuel / HEURES_LEGALES_PAR_MOIS;
  return { mensuel, horaire, auCentime: auCentime(horaire), auDessusDuSmic: horaire >= SMIC_HORAIRE_BRUT };
}

/** Le plus bas salaire mensuel de l'année, toutes lignes : celui qu'il faut comparer au SMIC. */
export const plusBasSalaireDeLAnnee = (h: HypothesesDeLAnnee = HYPOTHESES_DU_BUDGET) => Math.min(...salariesDeLAnnee(h).flatMap((x) => x.salaires.filter((s) => s > 0)));

/** Le laboratoire des hausses : la hausse de janvier, le mois et le taux de la seconde. */
export function laboratoireDesHausses(janvier: number, moisDeLaSeconde: number, seconde: number) {
  const hausses: HausseGenerale[] = [
    { mois: 1, taux: janvier },
    { mois: moisDeLaSeconde, taux: seconde },
  ];
  const e = effetsDesHausses(hausses);
  const salaireDeJanvier = auCentime(SALAIRE_DE_DECEMBRE_N * (1 + janvier));
  return {
    hausses,
    ...e,
    masseBrute: masseAEffectifConstant(hausses),
    chargee: auCentime(masseAEffectifConstant(hausses) * (1 + TAUX_PATRONAL)),
    salaireDeJanvier,
    salaireDeDecembre: auCentime(salaireDeJanvier * (1 + seconde)),
    gardeLEquipe: salaireDeJanvier >= SALAIRE_D_EMBAUCHE,
  };
}
