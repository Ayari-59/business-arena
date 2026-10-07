/**
 * LA SECTION QUI PLONGE — le modèle budgétaire de l'EHPAD d'Auxonne.
 *
 * Un EHPAD de 64 places, habilité à l'aide sociale, tarifé en trois sections
 * qui ne se compensent pas : l'HÉBERGEMENT (le prix de journée, arrêté par le
 * département pour les places habilitées), la DÉPENDANCE (le forfait global
 * du département, calculé sur le GMP) et les SOINS (le forfait de l'ARS,
 * calculé sur le GMP et le PMP). L'ERRD affiche 310 k€ de déficit ; le
 * conseil d'administration veut supprimer deux postes d'aides-soignants.
 * Septembre à novembre : les propositions budgétaires de l'an prochain et le
 * dialogue de gestion. Quatre mécanismes font l'épisode :
 *
 *   · LE DÉFICIT SE LIT PAR SECTION. Presque tout est à l'hébergement : un taux
 *     d'occupation de 92,5 % et un prix de journée inférieur au coût de revient
 *     de la journée. Le soins, lui, est en excédent, et le CPOM prévoit que
 *     l'ARS reprend l'excédent de la section soins : il ne compense rien.
 *   · SUPPRIMER UN POSTE D'AIDE-SOIGNANT NE TOUCHE PAS L'HÉBERGEMENT. Un
 *     aide-soignant s'impute à 70 % sur le soins et à 30 % sur la dépendance.
 *     La part soins de l'économie est reprise par l'ARS sur le forfait (les
 *     crédits suivent les postes) ; seule la part dépendance reste. Et la
 *     charge reportée sur l'équipe se paie : absentéisme, intérim, chambres
 *     qu'on ne remplit plus, et parfois un signalement suivi d'une inspection.
 *   · LA CLÉ DE RÉPARTITION EST MAL APPLIQUÉE. Les trois aides-soignants de
 *     nuit ont été saisis dans la paie comme « veilleurs de nuit » et imputés
 *     à 100 % à l'hébergement. Corriger l'imputation déplace 129 k€ : le
 *     faux excédent de soins disparaît (il n'est plus repris), l'hébergement
 *     montre son vrai déficit, et le département peut instruire une demande
 *     de prix de journée fondée sur des charges qu'il accepte.
 *   · LE GMP ET LE PMP N'ONT PAS ÉTÉ REVALIDÉS DEPUIS TROIS ANS. Une coupe
 *     validée relève les deux forfaits ; sa validation par les médecins de
 *     l'ARS et du département est tirée au hasard, d'autant plus favorable
 *     que les dossiers ont été préparés. Au soins, le gain ne vaut que tant
 *     qu'il comble un déficit : au-delà, l'excédent est repris.
 *
 * L'objectif, en euros, est le RÉSULTAT PRÉVISIONNEL DE L'AN PROCHAIN que
 * l'association garde : hébergement + dépendance + le soins s'il est en
 * déficit (un excédent de soins est repris), projeté en fin de trimestre avec
 * les décisions de tarification obtenues et le taux d'occupation atteint,
 * MOINS le coût des mesures engagées pendant le trimestre. À structure
 * inchangée, les propositions reconduisent l'ERRD : le taux directeur couvre
 * à peu près les hausses de salaires.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * L'ERRD DE L'AN DERNIER, tel que le siège l'a déposé (en euros).
 * Toutes les sources de l'épisode en sont tirées.
 * ------------------------------------------------------------------------- */

export const CAPACITE = 64;
export const JOURS_AN = 365;
export const JOURNEES_THEORIQUES = CAPACITE * JOURS_AN;
export const OCCUPATION_ERRD = 0.925;
export const JOURNEES_ERRD = Math.round(JOURNEES_THEORIQUES * OCCUPATION_ERRD);
export const OCCUPATION_CIBLE = 0.97;
/** Le prix de journée hébergement arrêté par le département pour les 64 places habilitées. */
export const PRIX_JOURNEE = 66.4;
/** Ce que coûte une journée de plus : denrées, linge, fournitures hôtelières. */
export const COUT_VARIABLE_JOURNEE = 7.1;

/** Un aide-soignant, chargé, par an. */
export const SALAIRE_AS = 43000;
export const MASSES = {
  /** Treize aides-soignants de jour. */
  asJour: 13 * SALAIRE_AS,
  /** Trois aides-soignants de nuit, saisis dans la paie comme « veilleurs de nuit ». */
  asNuit: 3 * SALAIRE_AS,
  /** Onze agents de service hospitalier, à 36 k€. */
  ash: 11 * 36000,
} as const;
/** La règle de répartition : aides-soignants 70 % soins, 30 % dépendance ; agents de service 70 % hébergement, 30 % dépendance. */
export const CLE_AS_SOINS = 0.7;
export const CLE_ASH_HEBERGEMENT = 0.7;
const part = (masse: number, cle: number) => Math.round(masse * cle);

export const CHARGES_HEBERGEMENT = {
  direction: 262000,
  ash: part(MASSES.ash, CLE_ASH_HEBERGEMENT),
  restauration: 266000,
  linge: 94000,
  batiment: 468000,
  energie: 124000,
  siege: 98000,
  autres: 54600,
  /** L'erreur : les trois aides-soignants de nuit, en entier sur l'hébergement. */
  nuit: MASSES.asNuit,
} as const;
export const CHARGES_DEPENDANCE = {
  as: MASSES.asJour - part(MASSES.asJour, CLE_AS_SOINS),
  ash: MASSES.ash - part(MASSES.ash, CLE_ASH_HEBERGEMENT),
  psychologue: 26400,
  protections: 34000,
} as const;
export const CHARGES_SOINS = {
  as: part(MASSES.asJour, CLE_AS_SOINS),
  infirmiers: 200000,
  idec: 58000,
  medecin: 48000,
  fournitures: 13600,
} as const;

const somme = (o: Readonly<Record<string, number>>) => Object.values(o).reduce((s, x) => s + x, 0);
export const TOTAL_HEBERGEMENT = somme(CHARGES_HEBERGEMENT);
export const TOTAL_DEPENDANCE = somme(CHARGES_DEPENDANCE);
export const TOTAL_SOINS = somme(CHARGES_SOINS);

/** Le GMP et le PMP validés il y a trois ans, et ceux qu'estime le médecin coordonnateur. */
export const GMP_VALIDE = 668;
export const PMP_VALIDE = 186;
export const GMP_REEL = 742;
export const PMP_REEL = 221;
/** L'équation tarifaire du soins : GMPS = GMP + 2,59 × PMP. */
export const COEF_PMP = 2.59;
export const POINT_SOINS = 10.34;
/** La valeur du point GIR départemental. */
export const POINT_GIR = 7.6;

export const forfaitSoins = (gmp: number, pmp: number) =>
  (gmp + COEF_PMP * pmp) * CAPACITE * POINT_SOINS;
export const forfaitDependance = (gmp: number) => gmp * CAPACITE * POINT_GIR;

export const PRODUITS_HEBERGEMENT_ERRD = JOURNEES_ERRD * PRIX_JOURNEE;
export const RESULTAT_ERRD = {
  hebergement: PRODUITS_HEBERGEMENT_ERRD - TOTAL_HEBERGEMENT,
  dependance: forfaitDependance(GMP_VALIDE) - TOTAL_DEPENDANCE,
  soins: forfaitSoins(GMP_VALIDE, PMP_VALIDE) - TOTAL_SOINS,
} as const;
export const DEFICIT_ERRD =
  RESULTAT_ERRD.hebergement + RESULTAT_ERRD.dependance + RESULTAT_ERRD.soins;
/** Le même ERRD, la ligne de nuit imputée selon la règle. */
export const RESULTAT_RETRAITE = {
  hebergement: RESULTAT_ERRD.hebergement + MASSES.asNuit,
  dependance: RESULTAT_ERRD.dependance - (MASSES.asNuit - part(MASSES.asNuit, CLE_AS_SOINS)),
  soins: RESULTAT_ERRD.soins - part(MASSES.asNuit, CLE_AS_SOINS),
} as const;
/** Ce que l'association garde : un excédent de soins est repris par l'ARS. */
export const conserve = (s: { hebergement: number; dependance: number; soins: number }) =>
  s.hebergement + s.dependance + Math.min(0, s.soins);

/** Le coût de revient d'une journée d'hébergement à 97 % d'occupation. */
export const coutDeLaJournee = (charges: number) =>
  charges / (JOURNEES_THEORIQUES * OCCUPATION_CIBLE);

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS ET CE QU'ELLES COÛTENT.
 * ------------------------------------------------------------------------- */

export const D = {
  conseil: 0,
  nuit: 1,
  coupe: 2,
  prix: 3,
  admissions: 4,
  chantier: 5,
} as const;

/** Ne rien changer : attendre, laisser l'ERRD, attendre la coupe, ne rien demander, garder le circuit, rien de plus. */
export const NEUTRE = [3, 1, 3, 3, 3, 3] as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la rumeur fait partir une AS en CDD, remplacée en intérim. */
export const PERTE_PAR_JOUR = 2000;

/** Les deux postes que le conseil veut supprimer. */
export const POSTES = 2 * SALAIRE_AS;
export const POSTES_SOINS = part(POSTES, CLE_AS_SOINS);
export const POSTES_DEPENDANCE = POSTES - POSTES_SOINS;

/** Si l'on attend, le conseil vote la suppression à sa séance d'octobre une fois sur deux. */
export const CHANCE_CONSEIL = 0.5;
export const SEMAINE_CONSEIL = 6;
/** Les agents de service imputés au soins : l'ARS le voit au dialogue de gestion deux fois sur trois. */
export const ASH_SOINS = part(MASSES.ash, 0.2);
export const CHANCE_DETECTION = 0.65;
export const SEMAINE_DIALOGUE = 7;
export const COUT_AUDIT = 12000;

/** La coupe : chance de validation et valeurs retenues par les médecins valideurs, selon la préparation. */
export const COUPES: readonly ({
  chance: number;
  gmp: number;
  pmp: number;
  cout: number;
} | null)[] = [
  { chance: 0.85, gmp: GMP_REEL, pmp: PMP_REEL, cout: 7000 },
  { chance: 0.45, gmp: 712, pmp: 204, cout: 0 },
  { chance: 0.5, gmp: 736, pmp: 216, cout: 15000 },
  null,
];
export const SEMAINE_COUPE = 10;
/** Une imputation contestée par l'ARS rend les médecins valideurs plus exigeants. */
export const COUPE_APRES_DETECTION = 0.6;

/** La mesure de rattrapage du prix de journée, au-delà du taux directeur. */
export const RATTRAPAGE = 3.2;
export const SEMAINE_DEPARTEMENT = 8;
/** La convention d'habilitation partielle : un prix libre pour les nouveaux contrats seulement. */
export const GAIN_HABILITATION = 32000;
export const CHANCE_HABILITATION = 0.5;

/** Le circuit d'admission raccourci, et ce qu'il coûte. */
export const EFFET_ADMISSIONS = 0.037;
export const COUT_ADMISSIONS = 3000;
export const ENTRETIEN_AN = 8000;
export const EFFET_SANS_VISITE = 0.05;
export const COUT_CAMPAGNE = 6000;

/** Les chantiers de la dernière décision. */
export const ECONOMIES_HEBERGEMENT = 20000;
export const MISE_EN_PLACE_HEBERGEMENT = 2000;
export const POOL = { interim: 40000, coordination: 12000, miseEnPlace: 3000 } as const;
export const POOL_NET = POOL.interim - POOL.coordination;

/** L'absentéisme des soignants, et ce qu'un point de plus coûte en intérim sur un an. */
export const ABSENTEISME = 0.12;
export const POINT_ABSENTEISME = (16 * SALAIRE_AS * 1.2) / 100;
/** Ne plus remplacer : la moitié des absences était couverte en CDD ; seule la part dépendance de l'économie reste. */
export const GEL_PAR_SEMAINE = ((16 * ABSENTEISME * 0.5 * SALAIRE_AS) / 52) * (1 - CLE_AS_SOINS);

export const CHANCE_INSPECTION = { suppression: 0.35, gel: 0.15 } as const;
export const COUT_INSPECTION = 15000;
export const SEMAINE_INSPECTION = 11;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: {
    /** Sur le taux d'occupation de la semaine, le temps de l'imprévu. */
    occupation?: number;
    /** Sur le taux d'occupation durable, et l'hypothèse de l'an prochain. */
    cible?: number;
    absences?: number;
    /** Un coût ponctuel, la première semaine. */
    cout?: number;
    /** Des charges de plus l'an prochain, par section. */
    charges?: { hebergement: number; dependance: number; soins: number };
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "virus",
    titre: "Cas groupés d'infection respiratoire",
    de: "Tassadit Truchot",
    role: "Infirmière coordinatrice (IDEC)",
    texte:
      "Sept résidents et quatre soignants touchés par un virus respiratoire : admissions suspendues deux semaines sur avis de l'ARS, renforts d'hygiène, 4 000 € de matériel et d'heures.",
    duree: 2,
    effet: { occupation: -0.015, absences: 0.04, cout: 4000 },
  },
  {
    id: "chaudiere",
    titre: "Panne de la chaudière",
    de: "Bakary Gagnepain",
    role: "Directeur de l'EHPAD d'Auxonne",
    texte:
      "La chaudière s'est arrêtée un matin de gel ; chauffages d'appoint dans les couloirs et pièce changée en urgence : 9 000 €.",
    duree: 1,
    effet: { cout: 9000 },
  },
  {
    id: "avenant",
    titre: "Agrément d'un avenant salarial",
    de: "Fadila Benmansour",
    role: "Responsable de la paie, siège",
    texte:
      "L'avenant de revalorisation de la convention collective est agréé : 13 k€ de charges de plus l'an prochain à Auxonne, que les tarifs ne couvriront pas.",
    duree: 1,
    effet: { charges: { hebergement: 5000, dependance: 2500, soins: 5500 } },
  },
  {
    id: "orchidia",
    titre: "Orchidia Résidences ouvre à Genlis",
    de: "Rosemonde Gauthey",
    role: "Assistante de direction, chargée des admissions",
    texte:
      "Orchidia Résidences ouvre une résidence de 80 places à Genlis : deux familles de la liste d'attente ont retiré leur dossier.",
    duree: 13,
    effet: { cible: -0.008 },
  },
  {
    id: "idec",
    titre: "Arrêt de l'infirmière coordinatrice",
    de: "Bakary Gagnepain",
    role: "Directeur de l'EHPAD d'Auxonne",
    texte:
      "Tassadit Truchot s'est cassé le poignet : deux semaines d'arrêt, une infirmière intérimaire de Soralis Intérim Santé pour la coordination, les visites de préadmission en attente.",
    duree: 2,
    effet: { occupation: -0.006, cout: 3000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les départs et les entrées de la semaine, en points d'occupation. */
  occupation: number;
  absences: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Ce que le trimestre révèle de l'occupation durable, pour l'an prochain. */
  occupationDurable: number;
  uConseil: number;
  uDetection: number;
  uDepartement: number;
  uHabilitation: number;
  uCoupe: number;
  uInspection: number;
  /** La part des admissions sans visite qui ne correspondent pas à ce que l'établissement peut accompagner. */
  inadaptes: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000919 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      occupation: borne(0.004 * gauss(r), -0.01, 0.01),
      absences: borne(1 + 0.12 * gauss(r), 0.7, 1.35),
    });
  }
  const occupationDurable = borne(0.004 * gauss(r), -0.01, 0.01);
  const uConseil = r();
  const uDetection = r();
  const uDepartement = r();
  const uHabilitation = r();
  const uCoupe = r();
  const uInspection = r();
  const inadaptes = 0.2 + 0.8 * r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    semaines,
    occupationDurable,
    uConseil,
    uDetection,
    uDepartement,
    uHabilitation,
    uCoupe,
    uInspection,
    inadaptes,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Si l'on demande d'attendre, le conseil vote la suppression en octobre une fois sur deux. */
export const conseilImpose = (chemin: readonly number[], graine: number) =>
  chemin[D.conseil] === 3 && hasard(graine).uConseil < CHANCE_CONSEIL;

/** La semaine où la suppression des deux postes est décidée, s'il y en a une. */
export function semaineDeSuppression(chemin: readonly number[], graine: number): number | null {
  if (chemin[D.conseil] === 0) return 3;
  if (conseilImpose(chemin, graine)) return SEMAINE_CONSEIL;
  if (chemin[D.chantier] === 0) return 11;
  return null;
}

/** Les agents de service imputés au soins : l'ARS le voit-elle au dialogue de gestion ? */
export const imputationDetectee = (chemin: readonly number[], graine: number) =>
  chemin[D.nuit] === 2 && hasard(graine).uDetection < CHANCE_DETECTION;

/** La chance que le département accorde la mesure de rattrapage : elle tient au dossier de la section. */
export function chanceDuDepartement(chemin: readonly number[], graine: number): number {
  const nuit = chemin[D.nuit];
  let p =
    nuit === 0
      ? 0.75
      : nuit === 3
        ? 0.45
        : nuit === 2 && imputationDetectee(chemin, graine)
          ? 0.05
          : 0.25;
  if (chemin[D.conseil] === 1) p += 0.05;
  return p;
}
export const rattrapageAccorde = (chemin: readonly number[], graine: number) =>
  chemin[D.prix] === 0 && hasard(graine).uDepartement < chanceDuDepartement(chemin, graine);
/** La convention d'habilitation partielle : le département l'accepte une fois sur deux. */
export const habilitationAccordee = (graine: number) =>
  hasard(graine).uHabilitation < CHANCE_HABILITATION;

/** La chance que la coupe soit validée. */
export function chanceDeLaCoupe(chemin: readonly number[], graine: number): number {
  const c = COUPES[chemin[D.coupe]!];
  if (!c) return 0;
  return c.chance * (imputationDetectee(chemin, graine) ? COUPE_APRES_DETECTION : 1);
}
/** Le GMP et le PMP retenus pour l'an prochain. */
export function coupeRetenue(chemin: readonly number[], graine: number) {
  const c = COUPES[chemin[D.coupe]!];
  const validee = !!c && hasard(graine).uCoupe < chanceDeLaCoupe(chemin, graine);
  return validee
    ? { validee, gmp: c.gmp, pmp: c.pmp }
    : { validee, gmp: GMP_VALIDE, pmp: PMP_VALIDE };
}

/** L'inspection qui suit un signalement, quand l'équipe a été réduite ou n'est plus remplacée. */
export function inspection(chemin: readonly number[], graine: number) {
  const suppression = semaineDeSuppression(chemin, graine);
  const gel = chemin[D.conseil] === 2;
  const chance =
    suppression !== null ? CHANCE_INSPECTION.suppression : gel ? CHANCE_INSPECTION.gel : 0;
  if (hasard(graine).uInspection >= chance) return null;
  // Une suppression décidée pour janvier n'expose qu'à une inspection l'an prochain.
  return {
    semaine: suppression === 11 ? null : SEMAINE_INSPECTION,
    injonction: suppression !== null,
  };
}

export interface Faits {
  suppression: number | null;
  detectee: boolean;
  rattrapage: boolean;
  habilitation: boolean;
  coupe: { validee: boolean; gmp: number; pmp: number };
  inspection: { semaine: number | null; injonction: boolean } | null;
}

export function faits(chemin: readonly number[], graine: number): Faits {
  return {
    suppression: semaineDeSuppression(chemin, graine),
    detectee: imputationDetectee(chemin, graine),
    rattrapage: rattrapageAccorde(chemin, graine),
    habilitation: chemin[D.prix] === 1 && habilitationAccordee(graine),
    coupe: coupeRetenue(chemin, graine),
    inspection: inspection(chemin, graine),
  };
}

export interface Sections {
  hebergement: number;
  dependance: number;
  soins: number;
}

export type Semaine = {
  /** Le taux d'occupation de la semaine. */
  occupation: number;
  /** Les journées réalisées dans la semaine. */
  journees: number;
  absenteisme: number;
  /** Le résultat prévisionnel de l'an prochain que l'association garderait, coût des mesures déduit. */
  prevu: number;
  hebergement: number;
  dependance: number;
  soins: number;
  /** Le coût des mesures engagées depuis le début du trimestre. */
  couts: number;
  /** L'hypothèse d'occupation de l'an prochain. */
  occupationPrevue: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat prévisionnel de l'an prochain que l'association garde, moins le coût des mesures. */
  objectif: number;
  sections: Sections;
  conserve: number;
  couts: number;
  /** L'excédent de soins que l'ARS reprendra. */
  repris: number;
  occupationPrevue: number;
  absenteismePrevu: number;
  occupationMoyenne: number;
  faits: Faits;
  cleCorrigee: boolean;
  /** Le résultat de la section hébergement à l'ERRD : la prévision. */
  hebergementErrd: number;
}

/** Ce que l'équipe perd de stabilité, en points d'absentéisme, à une semaine donnée. */
function absencesEnPlus(chemin: readonly number[], f: Faits, w: number, anProchain: boolean) {
  let a = 0;
  const s = f.suppression;
  if (s !== null && (anProchain ? w >= s : s < 11 && w > s)) a += 0.025;
  if (chemin[D.conseil] === 2 && w >= 3) a += anProchain ? 0.015 : 0.02;
  if (chemin[D.admissions] === 1 && w >= 10) a += anProchain ? 0.01 : 0.015;
  return a;
}

/** Le taux d'occupation vers lequel l'établissement tend, à une semaine donnée. */
function cible(chemin: readonly number[], f: Faits, h: Hasard, w: number) {
  const dansLeTrimestre = f.suppression !== null && f.suppression < 11;
  let c = OCCUPATION_ERRD;
  const d5 = chemin[D.admissions];
  if (d5 === 0 && w >= 9) c += EFFET_ADMISSIONS * (dansLeTrimestre ? 0.6 : 1);
  if (d5 === 1 && w >= 9) {
    c += EFFET_SANS_VISITE * (dansLeTrimestre ? 0.7 : 1);
    // Les réorientations : des résidents dont l'établissement ne peut pas accompagner les besoins.
    if (w >= 11) c -= 0.06 * h.inadaptes;
  }
  if (d5 === 2 && w >= 10) c += 0.006;
  if (dansLeTrimestre && w > f.suppression!) c -= 0.02;
  if (chemin[D.conseil] === 2 && w >= 4) c -= 0.01;
  if (f.inspection?.semaine != null && w >= f.inspection.semaine) c -= 0.01;
  for (const i of h.imprevus) if (w >= i.semaine) c += i.imprevu.effet.cible ?? 0;
  return c;
}

/** La projection de l'an prochain, avec ce qui est su et décidé à la fin de la semaine w. */
function projection(
  chemin: readonly number[],
  f: Faits,
  h: Hasard,
  jours: number,
  w: number,
): { sections: Sections; couts: number; occupation: number; absenteisme: number } {
  const [d1, d2, d3, , d5, d6] = chemin;
  const cle = (d2 === 0 && w >= 3) || (d2 === 3 && w >= 10);
  const ashSoins = d2 === 2 && w >= 3 && !(f.detectee && w >= SEMAINE_DIALOGUE);
  const supprimes = f.suppression !== null && w >= f.suppression;
  const inspectionSue =
    !!f.inspection && (f.inspection.semaine === null ? w >= SEMAINES : w >= f.inspection.semaine);
  const partSuppression = supprimes ? (inspectionSue && f.inspection!.injonction ? 0.5 : 1) : 0;
  const rattrapage = f.rattrapage && w >= SEMAINE_DEPARTEMENT;
  const habilitation = f.habilitation && w >= 7;
  const coupe = w >= SEMAINE_COUPE ? f.coupe : { gmp: GMP_VALIDE, pmp: PMP_VALIDE };

  let occupation = cible(chemin, f, h, w) + h.occupationDurable;
  if (supprimes && f.suppression === 11) occupation -= 0.02;
  if (inspectionSue && f.inspection!.semaine === null) occupation -= 0.01;
  occupation = borne(occupation, 0.86, 0.985);
  const absenteisme = ABSENTEISME + absencesEnPlus(chemin, f, w, true);
  const interim = (absenteisme - ABSENTEISME) * 100 * POINT_ABSENTEISME;
  const pool = d6 === 2 && w >= 11 ? POOL_NET : 0;
  const avenant = { hebergement: 0, dependance: 0, soins: 0 };
  for (const i of h.imprevus) {
    const c = i.imprevu.effet.charges;
    if (c && w >= i.semaine) {
      avenant.hebergement += c.hebergement;
      avenant.dependance += c.dependance;
      avenant.soins += c.soins;
    }
  }

  const journees = JOURNEES_THEORIQUES * occupation;
  const prix = PRIX_JOURNEE + (rattrapage ? RATTRAPAGE : 0);
  const nuitSoins = part(MASSES.asNuit, CLE_AS_SOINS);
  const hebergement =
    journees * prix +
    (habilitation ? GAIN_HABILITATION : 0) -
    (TOTAL_HEBERGEMENT +
      COUT_VARIABLE_JOURNEE * (journees - JOURNEES_ERRD) -
      (cle ? MASSES.asNuit : 0) -
      (ashSoins ? ASH_SOINS : 0) +
      (d5 === 0 && w >= 9 ? ENTRETIEN_AN : 0) -
      (d6 === 1 && w >= 11 ? ECONOMIES_HEBERGEMENT : 0) +
      avenant.hebergement);
  const dependance =
    forfaitDependance(coupe.gmp) -
    (TOTAL_DEPENDANCE +
      (cle ? MASSES.asNuit - nuitSoins : 0) -
      partSuppression * POSTES_DEPENDANCE +
      (1 - CLE_AS_SOINS) * (interim - pool) +
      avenant.dependance);
  // Les crédits des postes supprimés sont repris sur le forfait : l'économie de soins ne reste pas.
  const soins =
    forfaitSoins(coupe.gmp, coupe.pmp) -
    partSuppression * POSTES_SOINS -
    (TOTAL_SOINS +
      (cle ? nuitSoins : 0) +
      (ashSoins ? ASH_SOINS : 0) -
      partSuppression * POSTES_SOINS +
      CLE_AS_SOINS * (interim - pool) +
      avenant.soins);

  // Le coût des mesures engagées pendant le trimestre.
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  if (d2 === 3 && w >= 3) couts += COUT_AUDIT;
  const c = COUPES[d3!];
  if (c && w >= 5) couts += c.cout;
  if (d5 === 0 && w >= 9) couts += COUT_ADMISSIONS;
  if (d5 === 2 && w >= 9) couts += COUT_CAMPAGNE;
  if (d6 === 1 && w >= 11) couts += MISE_EN_PLACE_HEBERGEMENT;
  if (d6 === 2 && w >= 11) couts += POOL.miseEnPlace;
  for (const i of h.imprevus) if (w >= i.semaine) couts += i.imprevu.effet.cout ?? 0;
  if (inspectionSue) couts += COUT_INSPECTION;
  if (d1 === 2) couts -= GEL_PAR_SEMAINE * Math.max(0, Math.min(w, SEMAINES) - 1);

  return { sections: { hebergement, dependance, soins }, couts, occupation, absenteisme };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const f = faits(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let occ = OCCUPATION_ERRD;
  let cumul = 0;
  const fin = projection(chemin, f, h, jours, SEMAINES);
  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    occ += 0.5 * (cible(chemin, f, h, w) - occ) + n.occupation;
    let occupation = occ;
    let absences = (ABSENTEISME + absencesEnPlus(chemin, f, w, false)) * n.absences;
    for (const a of actifs) {
      occupation += a.imprevu.effet.occupation ?? 0;
      absences += a.imprevu.effet.absences ?? 0;
    }
    occupation = borne(occupation, 0.86, 0.995);
    cumul += occupation;
    const p = w === SEMAINES ? fin : projection(chemin, f, h, jours, w);
    semaines.push({
      occupation,
      journees: occupation * CAPACITE * 7,
      absenteisme: absences,
      prevu: conserve(p.sections) - p.couts,
      hebergement: p.sections.hebergement,
      dependance: p.sections.dependance,
      soins: p.sections.soins,
      couts: p.couts,
      occupationPrevue: p.occupation,
    });
  }
  const garde = conserve(fin.sections);
  return {
    semaines,
    objectif: garde - fin.couts,
    sections: fin.sections,
    conserve: garde,
    couts: fin.couts,
    repris: Math.max(0, fin.sections.soins),
    occupationPrevue: fin.occupation,
    absenteismePrevu: fin.absenteisme,
    occupationMoyenne: cumul / SEMAINES,
    faits: f,
    cleCorrigee: chemin[D.nuit] === 0 || chemin[D.nuit] === 3,
    hebergementErrd: RESULTAT_ERRD.hebergement,
  };
}

/** Ce qui s'est passé pendant des semaines : conseil, ARS, département, coupe, inspection, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const f = faits(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    conseilImpose: chemin[D.conseil] === 3 && f.suppression === SEMAINE_CONSEIL && dans(6),
    conseilAttend: chemin[D.conseil] === 3 && f.suppression !== SEMAINE_CONSEIL && dans(6),
    detectee: f.detectee && dans(SEMAINE_DIALOGUE),
    nonDetectee: chemin[D.nuit] === 2 && !f.detectee && dans(SEMAINE_DIALOGUE),
    departement: chemin[D.prix] === 0 && dans(SEMAINE_DEPARTEMENT),
    coupe: chemin[D.coupe] !== 3 && dans(SEMAINE_COUPE),
    audit: chemin[D.nuit] === 3 && dans(10),
    inspection: f.inspection?.semaine != null && dans(f.inspection.semaine),
    reorientations: chemin[D.admissions] === 1 && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSection {
  prevu: number | null;
  hebergement: number | null;
  soins: number | null;
  occupation: number | null;
  absenteisme: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  dependance: number | null;
  journees: number | null;
  cle: number | null;
  coupe: number | null;
  suppression: number | null;
}

/**
 * Ce qu'Eudoxie lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ». Au lundi de la semaine 1, rien n'est encore
 * projeté : on montre l'occupation et l'absentéisme de l'an dernier.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureSection {
  if (semaine === 0) {
    return {
      prevu: null,
      hebergement: null,
      soins: null,
      occupation: OCCUPATION_ERRD,
      absenteisme: ABSENTEISME,
      dependance: null,
      journees: OCCUPATION_ERRD * CAPACITE * 7,
      cle: 0,
      coupe: 0,
      suppression: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const cle = (chemin[D.nuit] === 0 && semaine >= 3) || (chemin[D.nuit] === 3 && semaine >= 10);
  return {
    prevu: s.prevu,
    hebergement: s.hebergement,
    soins: s.soins,
    occupation: s.occupation,
    absenteisme: s.absenteisme,
    dependance: s.dependance,
    journees: s.journees,
    cle: cle ? 1 : 0,
    coupe: t.faits.coupe.validee && semaine >= SEMAINE_COUPE ? 1 : 0,
    suppression: t.faits.suppression !== null && semaine >= t.faits.suppression ? 1 : 0,
  };
}
