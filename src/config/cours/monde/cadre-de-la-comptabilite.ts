import { cloture, type CodeDeTravail } from "./cloture";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA, PAIE_DU_MOIS } from "./exercice-de-nova";

/**
 * LE MONDE DU COURS : LE CADRE DE LA COMPTABILITÉ (BTS CG P1, 1.1.1 et 1.1.3 ; P2, 2.1.1).
 *
 * Le chapitre « Le cadre de la comptabilité : formes d'entreprise, sources du droit et principes » et
 * son cas le lisent. Ce fichier pose trois choses :
 *
 *   1. LA FORME JURIDIQUE DES NEUF ENTREPRISES DU COURS (FORMES_DES_ENTREPRISES). Décision du
 *      propriétaire (novembre 2026) : NOVA est une SAS (son président, ses actions, ses actionnaires,
 *      l'assemblée qui approuve les comptes) ; MARTEL & FILS est une entreprise individuelle. Les sept
 *      autres prennent la forme que le vocabulaire de leurs chapitres emploie déjà, relevé par
 *      recherche dans les sources du cours : chaque entrée cite l'extrait qui l'atteste, et la garde
 *      (tests/cours/le-cadre-de-la-comptabilite.test.ts) vérifie que l'extrait est bien dans le fichier.
 *      Sans mot propre à une entreprise, c'est le vocabulaire des chapitres communs aux neuf qui
 *      tranche : un gérant et des associés, celui de la SARL.
 *   2. LES CARACTÉRISTIQUES DES CINQ FORMES DU RÉFÉRENTIEL (EI, EURL, SARL, SA, SAS) et le seuil du
 *      commissaire aux comptes, que NOVA confronte à ses chiffres de la clôture de N.
 *   3. LE LABORATOIRE DES PRINCIPES : la clôture de N (monde/cloture.ts, sur la fiche figée
 *      exercice-de-nova.ts, qui n'est que lue) refaite en oubliant les travaux d'un principe, pour
 *      mesurer ce que chaque principe pèse sur le résultat.
 *
 * Les valeurs réglementaires que le cours n'a pas vérifiées sur pièce portent « À VÉRIFIER ».
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. LES CINQ FORMES DU RÉFÉRENTIEL
// ─────────────────────────────────────────────────────────────────────────────

export type FormeJuridique = "EI" | "EURL" | "SARL" | "SA" | "SAS";

export interface CaracteristiquesDeLaForme {
  code: FormeJuridique;
  nom: string;
  /** Qui la détient. */
  associes: string;
  /** Le capital minimal, en euros ; null : il n'y a pas de capital. */
  capitalMinimal: number | null;
  /** Ce que risque celui qui la détient. */
  responsabilite: string;
  /** Qui la dirige. */
  dirigeant: string;
  /** Ce que détiennent les associés ; null : aucun titre. */
  titres: string | null;
  /** L'impôt sur le bénéfice, par défaut. */
  impot: string;
}

/**
 * LES CINQ FORMES (code de commerce et code général des impôts). La responsabilité de l'entrepreneur
 * individuel est limitée de droit à son patrimoine professionnel depuis la loi du 14 février 2022, en
 * vigueur le 15 mai 2022 (À VÉRIFIER). Le capital d'une SARL, d'une EURL et d'une SAS est fixé
 * librement par les statuts (1 € au moins) ; celui d'une SA est d'au moins 37 000 €.
 */
export const FORMES: Readonly<Record<FormeJuridique, CaracteristiquesDeLaForme>> = {
  EI: {
    code: "EI",
    nom: "Entreprise individuelle",
    associes: "un entrepreneur seul",
    capitalMinimal: null,
    responsabilite: "son patrimoine professionnel",
    dirigeant: "l'entrepreneur",
    titres: null,
    impot: "impôt sur le revenu, sauf option",
  },
  EURL: {
    code: "EURL",
    nom: "Entreprise unipersonnelle à responsabilité limitée",
    associes: "un associé unique",
    capitalMinimal: 1,
    responsabilite: "ses apports",
    dirigeant: "un gérant",
    titres: "parts sociales",
    impot: "impôt sur le revenu, sauf option",
  },
  SARL: {
    code: "SARL",
    nom: "Société à responsabilité limitée",
    associes: "de 2 à 100 associés",
    capitalMinimal: 1,
    responsabilite: "leurs apports",
    dirigeant: "un ou plusieurs gérants",
    titres: "parts sociales",
    impot: "impôt sur les sociétés",
  },
  SA: {
    code: "SA",
    nom: "Société anonyme",
    associes: "2 actionnaires au moins",
    capitalMinimal: 37_000,
    responsabilite: "leurs apports",
    dirigeant: "un conseil d'administration et un directeur général",
    titres: "actions",
    impot: "impôt sur les sociétés",
  },
  SAS: {
    code: "SAS",
    nom: "Société par actions simplifiée",
    associes: "1 associé au moins",
    capitalMinimal: 1,
    responsabilite: "leurs apports",
    dirigeant: "un président, et ce que prévoient les statuts",
    titres: "actions",
    impot: "impôt sur les sociétés",
  },
};

/** L'ordre où le chapitre présente les formes. */
export const ORDRE_DES_FORMES: readonly FormeJuridique[] = ["EI", "EURL", "SARL", "SA", "SAS"];

// ─────────────────────────────────────────────────────────────────────────────
// 2. LA FORME DES NEUF ENTREPRISES DU COURS
// ─────────────────────────────────────────────────────────────────────────────

export interface FormeDUneEntreprise {
  forme: FormeJuridique;
  /** Le mot du cours pour son dirigeant. */
  dirigeant: string;
  /** Ce qui, dans le cours, la fait reconnaître (le libellé du tri du chapitre). */
  indice: string;
  /**
   * Les extraits des sources du cours qui attestent ce vocabulaire : un fichier (sous src/) et un
   * passage qu'il contient. La garde les relit.
   */
  preuves: readonly { fichier: string; extrait: string }[];
}

/** Le vocabulaire des chapitres communs aux neuf entreprises : des associés (leur dirigeant y est « le dirigeant », depuis que NOVA est une SAS). */
const CHAPITRES_COMMUNS = [
  { fichier: "config/cours/chapitres/creation-premier-bilan.ts", extrait: "la somme versée par les associés" },
] as const;

/**
 * LA FORME DE CHAQUE ENTREPRISE DU COURS, par son code (monde/cas-des-entreprises.ts).
 *   · NOVA : SAS, décision du propriétaire (D1, novembre 2026). Des chapitres anciens disent encore
 *     « gérant » pour NOVA : ils sont corrigés à part ; le chapitre du cadre n'en dépend pas.
 *   · MARTEL & FILS : entreprise individuelle, décision du propriétaire (D6). Ses chapitres de TVA
 *     disent « la gérante » au sens courant de celle qui dirige ; le cours l'appelle l'entrepreneuse.
 *   · MAILLE & CO : SARL, son gérant propose le dividende à « l'assemblée des associés ».
 *   · ATLAS CONSEIL : SAS, sa dirigeante est « Présidente d'Atlas Conseil » ; ses associés dirigent
 *     les practices.
 *   · PIXEL & CO : SAS, un groupe de distribution en est « actionnaire ».
 *   · L'ESCALE : SARL, l'hôtel a des associés qui apportent et un propriétaire qui le dirige.
 *   · LA TABLE D'AUGUSTIN, VOLT FITNESS, ROUTE & CIE : SARL, faute d'un mot qui leur soit propre, le
 *     vocabulaire des chapitres communs (un gérant, des associés).
 */
export const FORMES_DES_ENTREPRISES: Readonly<Record<string, FormeDUneEntreprise>> = {
  nova: {
    forme: "SAS",
    dirigeant: "le président",
    indice: "un président, un capital en actions, des actionnaires réunis en assemblée",
    preuves: [{ fichier: "config/cours/monde/comptabilite-approfondie.ts", extrait: "actions" }],
  },
  boutique: {
    forme: "SARL",
    dirigeant: "le gérant",
    indice: "un gérant qui fait sa proposition à l'assemblée des associés",
    preuves: [{ fichier: "config/cours/chapitres/le-bilan-et-le-bfr-de-la-boutique.ts", extrait: "Le gérant doit faire une proposition à l'assemblée des associés" }],
  },
  hotel: {
    forme: "SARL",
    dirigeant: "le gérant",
    indice: "des associés qui apportent, un gérant qui le dirige",
    preuves: [{ fichier: "config/cours/monde/projets-et-financement.ts", extrait: "les associés apportent 300 000 €" }, ...CHAPITRES_COMMUNS],
  },
  bistrot: {
    forme: "SARL",
    dirigeant: "le gérant",
    indice: "un gérant et des associés, sans actions",
    preuves: CHAPITRES_COMMUNS,
  },
  conseil: {
    forme: "SAS",
    dirigeant: "la présidente",
    indice: "une présidente, des associés qui dirigent les practices",
    preuves: [{ fichier: "config/episodes/factures-qui-dorment.ts", extrait: "Présidente d'Atlas Conseil" }],
  },
  ecommerce: {
    forme: "SAS",
    dirigeant: "le président",
    indice: "un groupe de distribution actionnaire, un président",
    preuves: [{ fichier: "config/cours/chapitres/le-deficit-reporte.ts", extrait: "actionnaire de PIXEL & CO" }],
  },
  fitness: {
    forme: "SARL",
    dirigeant: "le gérant",
    indice: "un gérant et des associés, sans actions",
    preuves: CHAPITRES_COMMUNS,
  },
  batiment: {
    forme: "EI",
    dirigeant: "l'entrepreneuse",
    indice: "une entrepreneuse qui exploite seule, sans associé",
    preuves: [{ fichier: "config/cours/situations/par-chapitre/la-tva-du-dernier-trimestre.ts", extrait: "La gérante veut" }],
  },
  transport: {
    forme: "SARL",
    dirigeant: "le gérant",
    indice: "un gérant et des associés, sans actions",
    preuves: CHAPITRES_COMMUNS,
  },
};

/** La forme d'une entreprise du cours, par son code. */
export function formeDe(code: string): CaracteristiquesDeLaForme {
  const f = FORMES_DES_ENTREPRISES[code];
  if (!f) throw new Error(`Pas de forme juridique pour l'entreprise ${code}`);
  return FORMES[f.forme];
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LE COMMISSAIRE AUX COMPTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE SEUIL DU COMMISSAIRE AUX COMPTES (code de commerce, depuis la loi PACTE de 2019) : une société
 * commerciale le nomme quand elle dépasse, à la clôture, deux des trois seuils : 4 000 000 € de total
 * du bilan, 8 000 000 € de chiffre d'affaires hors taxes, 50 salariés. // À VÉRIFIER : un relèvement
 * des seuils a été annoncé pour transposer la directive européenne de 2023.
 */
export const SEUILS_DU_COMMISSAIRE_AUX_COMPTES = { totalDuBilan: 4_000_000, chiffreDAffaires: 8_000_000, effectif: 50, criteresADepasser: 2 } as const;

/** Les trois critères d'une entreprise : total du bilan, chiffre d'affaires hors taxes, effectif. */
export interface Criteres {
  totalDuBilan: number;
  chiffreDAffaires: number;
  effectif: number;
}

/**
 * LES CRITÈRES DE NOVA À LA CLÔTURE DE N (exercice-de-nova.ts) : le total du bilan, le chiffre
 * d'affaires (sa production vendue : NOVA ne garde aucune enceinte finie en stock) et ses 4 opérateurs.
 */
export const CRITERES_DE_NOVA: Criteres = {
  totalDuBilan: CLOTURE_DE_LA_FICHE.totalDuBilan,
  chiffreDAffaires: CLOTURE_DE_LA_FICHE.soldes.production,
  effectif: PAIE_DU_MOIS.effectif,
};

/** Les seuils qu'une entreprise dépasse, et si elle doit nommer un commissaire aux comptes. */
export function commissaireAuxComptes(c: Criteres) {
  const s = SEUILS_DU_COMMISSAIRE_AUX_COMPTES;
  const depasses = [c.totalDuBilan > s.totalDuBilan, c.chiffreDAffaires > s.chiffreDAffaires, c.effectif > s.effectif].filter(Boolean).length;
  return { depasses, obligatoire: depasses >= s.criteresADepasser };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. LE LABORATOIRE DES PRINCIPES : LA CLÔTURE DE N, UN PRINCIPE OUBLIÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Les travaux de la clôture que la prudence commande : la dépréciation de Sonora et la provision du litige. */
export const TRAVAUX_DE_LA_PRUDENCE: readonly CodeDeTravail[] = ["creanceDouteuse", "provision"];

/**
 * Les travaux que l'indépendance des exercices commande : rattacher à N ses charges et ses produits,
 * et rien d'autre (la facture non parvenue, la charge constatée d'avance, la facture à établir, le
 * produit constaté d'avance, les intérêts courus de l'emprunt et ceux du placement).
 */
export const TRAVAUX_DE_L_INDEPENDANCE: readonly CodeDeTravail[] = ["factureNonParvenue", "chargeConstateeDAvance", "factureAEtablir", "produitConstateDAvance", "interetsCourus", "interetsDuPlacement"];

/** Une position du laboratoire : 1 quand le principe est appliqué, 0 quand ses travaux sont oubliés. */
export interface PositionDesPrincipes {
  prudence: number;
  independance: number;
}

/** Le résultat de N selon les principes appliqués : la clôture refaite, les travaux oubliés retirés. */
export function resultatSelonLesPrincipes(p: PositionDesPrincipes) {
  const oublies = [...(p.prudence ? [] : TRAVAUX_DE_LA_PRUDENCE), ...(p.independance ? [] : TRAVAUX_DE_L_INDEPENDANCE)];
  const k = cloture(EXERCICE_DE_NOVA, { travauxOublies: oublies });
  const fiche = CLOTURE_DE_LA_FICHE.resultatNet;
  return {
    resultatAvantImpot: k.resultatAvantImpot,
    impot: k.impot.impot,
    resultatNet: k.resultatNet,
    ecart: Math.round((k.resultatNet - fiche) * 100) / 100 + 0,
    oublies: k.travauxOublies.map((t) => ({ libelle: t.libelle, effet: t.effetSurLeResultat })),
  };
}

/** Le départ du laboratoire : le premier jet du comptable, qui n'a passé aucun travail d'inventaire de ces deux principes. */
export const DEPART_DES_PRINCIPES: PositionDesPrincipes = { prudence: 0, independance: 0 };

/** Ce que les comptes de N publient : les deux principes appliqués. */
export const COMPTES_PUBLIES: PositionDesPrincipes = { prudence: 1, independance: 1 };

// ─────────────────────────────────────────────────────────────────────────────
// 5. LA VEILLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * CE QUE LA VEILLE DE NOVA RELÈVE EN N + 1 (À VÉRIFIER à la date de l'écriture : le cours les cite,
 * il ne les a pas relus sur pièce) :
 *   · le règlement ANC n° 2022-06 sur la présentation des comptes annuels, qui remplace les modèles
 *     du PCG pour les exercices ouverts à compter du 1er janvier 2025 : le résultat exceptionnel
 *     redéfini (réservé aux événements majeurs et inhabituels), les comptes de transferts de charges
 *     supprimés, une annexe réorganisée. Le cours ne réécrit pas ses chapitres : il le signale ;
 *   · la facture électronique : toute entreprise doit pouvoir en recevoir depuis le 1er septembre
 *     2026 ; les PME et les micro-entreprises, comme NOVA, en émettront à partir du 1er septembre 2027.
 */
export const VEILLE_DE_N_PLUS_1 = {
  reglementDeLAnc: { numero: "2022-06", applicableAuxExercicesOuverts: "1er janvier 2025" },
  factureElectronique: { reception: "1er septembre 2026", emissionDesPme: "1er septembre 2027" },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. LE CAS : L'ATELIER DE RÉPARATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'ATELIER DE RÉPARATION (hypothèse du cas « Créer l'atelier de réparation ») : deux opérateurs de
 * NOVA veulent ouvrir un atelier qui répare les enceintes. Ils apportent 4 000 € à eux deux ; ils
 * prévoient 180 000 € de chiffre d'affaires, 2 salariés et 60 000 € de total du bilan la première
 * année ; ils veulent protéger leurs biens personnels, faire entrer plus tard un investisseur, et
 * écrire eux-mêmes dans les statuts qui décide de quoi.
 */
export const ATELIER_DE_REPARATION = {
  associes: 2,
  apports: 4_000,
  criteres: { totalDuBilan: 60_000, chiffreDAffaires: 180_000, effectif: 2 } satisfies Criteres,
} as const;

/** Ce qui manquerait aux apports de l'atelier pour constituer une SA. */
export const MANQUE_POUR_UNE_SA = FORMES.SA.capitalMinimal! - ATELIER_DE_REPARATION.apports;
