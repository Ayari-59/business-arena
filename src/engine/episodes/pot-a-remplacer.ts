/**
 * LE POT EN PLASTIQUE QU'IL FAUT REMPLACER — le modèle du changement d'emballage
 * des yaourts Kerbrélan, à l'usine de Loudéac de la Laiterie de Kerbrélan.
 *
 * Celtis exige que tous les pots de ses fournisseurs soient recyclables d'ici
 * dix-huit mois. Les yaourts Kerbrélan (40 millions de pots par an, sur les
 * lignes 1 et 2, des thermoformeuses-remplisseuses-scelleuses) sont en
 * polystyrène (PS), qui ne se recycle pas. Deux solutions : le polypropylène
 * monomatériau (PP), thermoformé sur les mêmes lignes après un kit de
 * conversion, ou le pot carton à film barrière, livré préformé, qui demande un
 * module de dépilage et de scellage sur chaque ligne. Le président veut
 * annoncer le carton pour toute la gamme au salon professionnel de mars. Le
 * trimestre va de janvier à mars. Cinq mécanismes font l'épisode :
 *
 *   · LE PRIX DU POT NE DIT PAS LE COÛT DE L'EMBALLAGE. Le coût d'un
 *     emballage, c'est le prix du pot, plus l'éco-contribution (le barème de
 *     l'éco-organisme pénalise le PS non recyclable et allège le PP et le
 *     carton), plus les rebuts qu'il fait à la ligne, plus la cadence qu'il
 *     fait perdre, que l'on rattrape l'été en samedis et en intérim, plus la
 *     DLC qu'il ne tient pas. Les fournisseurs annoncent une cadence et des
 *     rebuts ; la ligne dit les vrais.
 *   · L'ESSAI INDUSTRIEL MESURE CE QUE LES FICHES ANNONCENT. Trois jours par
 *     matière sur la ligne 2, une seule référence : il coûte 22 k€ et révèle la
 *     vraie cadence et le vrai taux de rebut (tirés au hasard, plus mauvais que
 *     les annonces, surtout pour le carton), lance les tests de conservation et
 *     trouve les réglages (opercule, température et pression de scellage).
 *     Il laisse aussi la ligne 2 équipée de son kit PP.
 *   · BASCULER SANS AVOIR QUALIFIÉ, C'EST TIRER AU SORT. Une ligne qui change
 *     d'emballage met des semaines à retrouver sa cadence et son taux de
 *     rebut, et risque des pots mal scellés : le lot est bloqué et détruit,
 *     la ligne s'arrête, les commandes partent en rupture. Le risque est tiré
 *     au hasard ; il est fort sans essai, plus fort quand les deux lignes
 *     basculent en même temps (la maintenance ne peut pas être partout), plus
 *     fort en carton, plus coûteux au printemps qu'en hiver, quand les lignes
 *     ont encore de la marge. Et un yaourt ne se stocke pas d'avance : avec 30
 *     jours de DLC et les deux tiers exigés à la livraison, un pot doit partir
 *     dans les dix jours.
 *   · LE SURCOÛT SE NÉGOCIE AVEC UN DOSSIER, ET AVANT LE 1ER MARS. Celtis
 *     demande du recyclable, pas du carton : elle prend une part du surcoût
 *     dans son tarif, plus grande sur un coût mesuré que sur les fiches des
 *     fournisseurs, et refuse trois fois sur dix (tiré au hasard) ; elle ne
 *     paie pas un choix marketing, et prive de ses opérations de printemps un
 *     fournisseur sans plan à la clôture des négociations. Opaline et Proxival
 *     s'alignent ensuite, ou non (tiré au hasard), selon ce qu'on annonce au
 *     salon.
 *   · ATTENDRE L'ÉCHÉANCE NE SUPPRIME PAS LE CHANGEMENT. Garder le PS reporte
 *     la bascule à la veille de l'échéance de Celtis : les deux lignes en même
 *     temps, au printemps, sans réglages, au moment où tous les fournisseurs de
 *     Celtis se convertissent et où les kits et les bobines de PP se paient plus
 *     cher, et sans part négociée. Les bobines de PS imprimées, elles, se
 *     commandent un trimestre d'avance : en trop, elles sont détruites ; en
 *     manque, réimprimées dans l'urgence.
 *
 * COMMENT LE TRIMESTRE EST JUGÉ. En euros, sur le COÛT DU CHANGEMENT estimé en
 * semaine 13 (l'objectif est son opposé : plus haut, mieux c'est) :
 *
 *   coûts du trimestre (essai, kits ou modules, dédits, rebuts et cadence des
 *   démarrages, samedis, ruptures, lots détruits, surcoût des pots, imprévus) ;
 *   + ce qui reste à faire au deuxième trimestre, estimé en espérance avec ce
 *     qui est en place (démarrage des lignes qui n'ont pas basculé, bobines de
 *     PS imprimées en trop ou manquantes) ;
 *   + le coût de la première année de l'emballage retenu, comparé au PS :
 *     prix du pot, éco-contribution, rebuts et cadence réels, DLC ;
 *   − la part du surcoût que les enseignes prennent dans leur tarif.
 *
 * Ne rien retenir, c'est laisser l'échéance choisir : on compte alors le PP
 * basculé dans l'urgence. Pur et déterministe : une même graine donne les
 * mêmes tirages, quelles que soient les décisions. Entreprise, personnes et
 * chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les yaourts Kerbrélan : 24 références, deux lignes à Loudéac, la moitié des volumes chacune. */
export const VOLUME_AN = 40000000;
export const LIGNES = 2;
/** Les pots qu'une ligne livre par semaine, en moyenne sur l'année. */
export const POTS_SEMAINE = VOLUME_AN / LIGNES / 52;
/** La demande du trimestre, rapportée à la moyenne de l'année : l'hiver est creux, mars remonte. */
export const SAISON = [0, 0.92, 0.92, 0.93, 0.93, 0.94, 0.95, 0.95, 0.96, 0.97, 0.98, 0.99, 1, 1];
/** Avril à juin, et le printemps de l'an prochain où se ferait une bascule dans l'urgence. */
export const SAISON_T2 = 1.08;
export const SAISON_URGENCE = 1.1;

/** Une ligne : 9 000 pots à l'heure en PS, 75 heures par semaine en 2×8, un TRS de 70 %. */
export const CADENCE_PS = 9000;
export const HEURES = 75;
export const TRS = 0.7;
/** La capacité d'une ligne en PS, en pots par semaine. */
export const CAPACITE_PS = CADENCE_PS * HEURES * TRS;
/** Un samedi de production : huit heures, une équipe payée majorée, l'énergie, le nettoyage. */
export const SAMEDI = { heures: 8, cout: 6500 } as const;
/** Un pot commandé et non livré : la marge perdue et la pénalité logistique de l'enseigne. */
export const MARGE_PERDUE = 0.06;
export const PENALITE = 0.04;
export const RUPTURE = MARGE_PERDUE + PENALITE;
/** Un pot rebuté à la ligne : le lait, les ferments, le sucre, le pot et l'opercule. */
export const COUT_REBUT = 0.1;
/** Un pot d'un lot bloqué : rebuté, et détruit. */
export const DESTRUCTION = 0.02;
export const REBUT_PS = 0.01;
/** Le taux de service des yaourts en PS, quand tout tourne : les enseignes attendent 98,5 %. */
export const SERVICE_PS = 0.995;
export const SERVICE_ATTENDU = 0.985;
/** La part de la production d'une semaine qu'un lot mal scellé fait bloquer : deux jours sur cinq. */
export const LOT_BLOQUE = 0.4;
/** La journée d'arrêt pour trouver la cause. */
export const ARRET_INCIDENT = 0.8;

export type Matiere = "ps" | "pp" | "carton";

/** Le prix d'un pot et son éco-contribution, en centimes d'euro (barème de l'an prochain). */
export const PRIX: Readonly<Record<Matiere, number>> = { ps: 1.3, pp: 1.52, carton: 1.82 };
export const ECO: Readonly<Record<Matiere, number>> = { ps: 0.36, pp: 0.2, carton: 0.17 };
/** Ce qu'un pot coûte de plus que le PS, éco-contribution comprise, en euros. */
export const surcoutUnitaire = (m: Matiere) => (PRIX[m] + ECO[m] - PRIX.ps - ECO.ps) / 100;
/** Le chiffre que la prévision demande : le surcoût annuel du carton, éco-contribution comprise. */
export const SURCOUT_CARTON = Math.round(surcoutUnitaire("carton") * VOLUME_AN);
export const SURCOUT_PP = Math.round(surcoutUnitaire("pp") * VOLUME_AN);

/** Ce que les fournisseurs annoncent : perte de cadence et taux de rebut. */
export const ANNONCE = {
  pp: { cadence: 0.04, rebut: 0.013 },
  carton: { cadence: 0.1, rebut: 0.018 },
} as const;
/** Le kit de conversion d'une thermoformeuse au PP ; le module pour pots préformés. */
export const CONFORMAGE = { pp: 35000, carton: 70000 } as const;
/** Les délais de livraison, en semaines. */
export const DELAI = { pp: 5, carton: 7 } as const;
/** L'été, les lignes sont saturées : chaque point de cadence perdu se paie en samedis et en intérim. */
export const COUT_POINT_CADENCE = 3000;
/** Sans essai, les réglages se cherchent en production : 0,3 point de rebut de plus la première année. */
export const REGLAGES = 0.003;
/** Le carton qui ne tient pas la DLC : 24 jours au lieu de 30, plus de casse et de démarque. */
export const DLC_CARTON = { chance: 0.65, perte: 40000 } as const;

export const ESSAI = 22000;
/** Les dédits si l'on renonce à ce qu'on a commandé : 30 % des équipements, et la première commande de pots carton. */
export const DEDIT = { part: 0.3, potsCarton: 10000 } as const;

/** L'urgence de l'échéance : kits plus chers et pots de PP plus chers quand tout le monde se convertit. */
export const URGENCE = { kits: 1.2, pot: 0.05 } as const;

/** Les bobines de PS imprimées aux couleurs Kerbrélan : la commande du deuxième trimestre. */
export const BOBINES = {
  semaines: 13,
  /** Les pots d'une semaine de ligne au deuxième trimestre. */
  potsSemaine: Math.round(POTS_SEMAINE * SAISON_T2),
  /** Imprimées, elles ne se reprennent pas : on n'en récupère que la matière, 15 %. */
  recuperation: 0.15,
  /** Une impression en urgence : cylindres, réglages, transport express, une demi-journée d'arrêt. */
  urgenceFixe: 12000,
  urgencePrime: 0.3,
  marge: 2,
} as const;
/** Une bascule du deuxième trimestre glisse de trois semaines, trois fois sur dix. */
export const GLISSEMENT = { chance: 0.3, semaines: 3 } as const;

/** Les enseignes : la part des volumes de la gamme. */
export const PART_CELTIS = 0.45;
export const PART_AUTRES = 0.35;
/** Ce que Celtis accepte : le partage, sept fois sur dix, à hauteur de ce que le dossier justifie. */
export const CELTIS = {
  accord: 0.7,
  mesure: 0.6,
  fiches: 0.3,
  /** Le carton est un choix marketing : Celtis n'en prend qu'une partie. */
  carton: 0.6,
  /** Tout demander sans dossier : une fois sur quatre. */
  toutAccord: 0.25,
  contrepartie: 8000,
  forfait: 0.3,
  avantPremiere: 1500,
  /** Un fournisseur sans plan de passage au recyclable à la clôture : deux opérations de printemps perdues. */
  sansPlan: 35000,
} as const;
/** Opaline et Proxival s'alignent sur Celtis, au salon, selon ce qui est annoncé. */
export const ALIGNEMENT = {
  mesureBascule: 0.65,
  mesure: 0.45,
  carton: 0.35,
  rien: 0.15,
  retropedalage: 20000,
} as const;

/** Le stock d'avance avant une bascule : une demi-semaine de pots, dont plus de la moitié arrivera trop vieille. */
export const STOCK = {
  semaines: 0.5,
  samedis: 2,
  /** La part que les enseignes acceptent encore : plus des deux tiers de la DLC. */
  accepte: 0.4,
  /** Un pot refusé : déclassé, vendu à un déstockeur ou donné. */
  perte: 0.15,
} as const;

/** Le budget du projet, pour le trimestre. */
export const BUDGET_PROJET = 150000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les créneaux d'essai réservés chez Maëlpack sont facturés. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  bobines: 1,
  matiere: 2,
  celtis: 3,
  bascule: 4,
  salon: 5,
} as const;

/** Les options, par leur nom. */
export const PLAN = { carton: 0, ppDirect: 1, essai: 2, rien: 3 } as const;
export const COMMANDE = { juste: 0, confirmer: 1, annuler: 2 } as const;
export const RETENU = { pp: 0, carton: 1, ps: 2 } as const;
export const NEGO = { tout: 0, forfait: 1, dossier: 2, rien: 3 } as const;
export const BASCULE = { toutDUnCoup: 0, stock: 1, reporter: 2, etapes: 3 } as const;
export const ANNONCE_SALON = { carton: 0, rien: 1, mesure: 2 } as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 1, 2, 3, 2, 1] as const;

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
    /** La capacité de chaque ligne, multipliée. */
    capacite?: readonly [number, number];
    /** Un coût, la semaine où il tombe. */
    cout?: number;
    /** Les pots de PS plus chers, en centimes, jusqu'à la fin du trimestre. */
    prixPS?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "kerfroid",
    titre: "Grève aux Transports Kerfroid",
    de: "Radka Brélivet",
    role: "Responsable d'exploitation, Transports Kerfroid",
    texte:
      "Deux jours de grève de nos chauffeurs : une partie des livraisons de Celtis et d'Opaline est partie avec un jour de retard. Les pénalités logistiques des enseignes s'élèvent à 9 000 €.",
    duree: 1,
    effet: { cout: 9000 },
  },
  {
    id: "opercules",
    titre: "Les opercules arrivent en retard",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Notre fournisseur d'opercules a livré avec deux jours de retard : la ligne 1 s'est arrêtée une journée, faute de quoi sceller.",
    duree: 1,
    effet: { capacite: [0.8, 1] },
  },
  {
    id: "panne",
    titre: "Panne de la thermoformeuse de la ligne 2",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le moteur d'entraînement de la thermoformeuse de la ligne 2 a lâché : un jour et demi d'arrêt, et 6 000 € de réparation.",
    duree: 1,
    effet: { capacite: [1, 0.7], cout: 6000 },
  },
  {
    id: "grippe",
    titre: "La grippe à l'atelier de conditionnement",
    de: "Maëwenn Postec",
    role: "Directrice des ressources humaines",
    texte:
      "La grippe touche l'atelier de conditionnement : des intérimaires moins rodés tiennent les postes, et les deux lignes perdent environ 10 % de leur rendement pendant deux semaines.",
    duree: 2,
    effet: { capacite: [0.9, 0.9] },
  },
  {
    id: "styrene",
    titre: "Le polystyrène augmente",
    de: "Taïg Paugam",
    role: "Responsable commercial, Styrel",
    texte:
      "Le prix du styrène s'envole : nos bobines de polystyrène augmentent de 12 % à compter de ce lundi, soit 0,16 centime par pot.",
    duree: 99,
    effet: { prixPS: 0.16 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

/** Ce que les lignes font vraiment, matière par matière : la ligne le dit, pas la fiche. */
export interface Reel {
  /** La perte de cadence, rapportée au PS. */
  cadence: number;
  rebut: number;
}

export interface Hasard {
  /** Le bruit de la demande, semaine par semaine. */
  semaines: readonly (number | null)[];
  pp: Reel;
  carton: Reel;
  /** Le carton tient-il les 30 jours de DLC ? */
  uDLC: number;
  /** Des pots mal scellés à la bascule de chaque ligne ? */
  uScel: readonly [number, number];
  /** Celtis accepte-t-elle ? */
  uCeltis: number;
  /** Opaline et Proxival s'alignent-elles ? */
  uAlignement: number;
  /** Une bascule du deuxième trimestre glisse-t-elle ? */
  uGlissement: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001089 + 7);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) semaines.push(borne(1 + 0.03 * gauss(r), 0.94, 1.06));
  const pp = {
    cadence: borne(0.07 + 0.02 * gauss(r), 0.04, 0.11),
    rebut: borne(0.016 + 0.002 * gauss(r), 0.012, 0.022),
  };
  const carton = {
    cadence: borne(0.17 + 0.04 * gauss(r), 0.11, 0.26),
    rebut: borne(0.031 + 0.006 * gauss(r), 0.02, 0.045),
  };
  const uDLC = r();
  const uScel: [number, number] = [r(), r()];
  const uCeltis = r();
  const uAlignement = r();
  const uGlissement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    semaines,
    pp,
    carton,
    uDLC,
    uScel,
    uCeltis,
    uAlignement,
    uGlissement,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LES RÈGLES.
 * ------------------------------------------------------------------------- */

/** Ce qu'on sait d'une bascule avant de la faire : rien, un peu, ou ce que l'essai a mesuré. */
export type Qualification = "aucune" | "partielle" | "qualifiee";

/**
 * LE DÉMARRAGE D'UNE LIGNE APRÈS LA BASCULE, semaine par semaine : ce qui reste de sa
 * cadence, les points de rebut en plus, et le risque de pots mal scellés la première semaine.
 */
export const DEMARRAGE: Readonly<
  Record<Qualification, { scel: number; cadence: readonly number[]; rebut: readonly number[] }>
> = {
  qualifiee: { scel: 0.08, cadence: [0.92, 0.97], rebut: [0.006, 0.002] },
  partielle: { scel: 0.25, cadence: [0.82, 0.92, 0.97], rebut: [0.015, 0.006, 0.002] },
  aucune: { scel: 0.45, cadence: [0.7, 0.84, 0.94], rebut: [0.03, 0.015, 0.006] },
};
/** Deux lignes qui démarrent ensemble : la maintenance et les régleurs ne sont pas partout. */
export const SIMULTANEE = 1.6;
/** Le carton se scelle sur un bord plus délicat que le plastique. */
export const SCEL_CARTON = 1.3;

/** La matière retenue en fin de trimestre. */
export function matiereRetenue(chemin: readonly number[]): Matiere {
  const m = chemin[D.matiere];
  return m === RETENU.pp ? "pp" : m === RETENU.carton ? "carton" : "ps";
}

const essaiFait = (chemin: readonly number[]) => chemin[D.plan] === PLAN.essai;

/** La semaine où chaque ligne peut basculer : quand son kit ou son module est là. */
export function arrivees(chemin: readonly number[]): [number, number] {
  const m = matiereRetenue(chemin);
  const p = chemin[D.plan];
  if (m === "pp") {
    if (p === PLAN.ppDirect) return [1 + DELAI.pp, 1 + DELAI.pp];
    // L'essai laisse son kit sur la ligne 2 ; le reste est commandé en semaine 5.
    if (p === PLAN.essai) return [5 + DELAI.pp, 5];
    return [5 + DELAI.pp, 5 + DELAI.pp];
  }
  if (m === "carton") {
    if (p === PLAN.carton) return [1 + DELAI.carton, 1 + DELAI.carton];
    return [5 + DELAI.carton, 5 + DELAI.carton];
  }
  return [99, 99];
}

export interface Bascules {
  /** La semaine de bascule de chaque ligne (au-delà de 13 : au deuxième trimestre). */
  semaine: [number, number];
  qualif: [Qualification, Qualification];
  simultanee: [boolean, boolean];
  /** La semaine prévue sans glissement, pour les bobines. */
  glisse: boolean;
}

/** Quand chaque ligne bascule, et ce qu'on en sait alors. */
export function bascules(chemin: readonly number[], graine: number): Bascules {
  const m = matiereRetenue(chemin);
  const glisse = hasard(graine).uGlissement < GLISSEMENT.chance;
  if (m === "ps") {
    return {
      semaine: [99, 99],
      qualif: ["aucune", "aucune"],
      simultanee: [false, false],
      glisse: false,
    };
  }
  const [a1, a2] = arrivees(chemin);
  const mode = chemin[D.bascule];
  let l2: number;
  let l1: number;
  if (mode === BASCULE.reporter) {
    l2 = 15;
    l1 = 17;
  } else if (mode === BASCULE.etapes) {
    l2 = Math.max(10, a2);
    l1 = Math.max(16, l2 + 4);
  } else {
    l2 = Math.max(10, a2);
    l1 = Math.max(11, a1);
  }
  const decale = (w: number) => (w > SEMAINES && glisse ? w + GLISSEMENT.semaines : w);
  const semaine: [number, number] = [decale(l1), decale(l2)];
  const ecart = Math.abs(semaine[0] - semaine[1]);
  const ensemble = ecart < 2;
  // L'essai a qualifié la ligne 2 sur la référence testée ; l'autre ligne apprend de la première.
  const premiere = semaine[1] <= semaine[0] ? 1 : 0;
  const seconde = 1 - premiere;
  const qualif: [Qualification, Qualification] = ["aucune", "aucune"];
  if (essaiFait(chemin)) {
    qualif[premiere] = premiere === 1 ? "qualifiee" : "partielle";
    qualif[seconde] = ensemble ? "partielle" : "qualifiee";
  } else {
    qualif[premiere] = "aucune";
    qualif[seconde] = ensemble ? "aucune" : "partielle";
  }
  const simultanee: [boolean, boolean] = [ensemble && seconde === 0, ensemble && seconde === 1];
  return { semaine, qualif, simultanee, glisse };
}

/** Le risque de pots mal scellés la semaine où une ligne bascule. */
export function risqueScellage(m: Matiere, q: Qualification, simultanee: boolean): number {
  if (m === "ps") return 0;
  return Math.min(
    0.9,
    DEMARRAGE[q].scel * (m === "carton" ? SCEL_CARTON : 1) * (simultanee ? SIMULTANEE : 1),
  );
}

/** Ce que la ligne fait vraiment, matière par matière. */
export function reel(m: Matiere, graine: number): Reel {
  if (m === "ps") return { cadence: 0, rebut: REBUT_PS };
  return hasard(graine)[m];
}

/* ---------------------------------------------------------------------------
 * UNE SEMAINE DE LIGNE.
 * ------------------------------------------------------------------------- */

export interface SemaineDeLigne {
  demande: number;
  livres: number;
  rupture: number;
  /** La part de pots rebutés à la ligne. */
  rebut: number;
  /** Les pots à l'heure, démarrage compris. */
  cadence: number;
  samedi: boolean;
  incident: boolean;
  /** Ce que la semaine coûte de plus qu'en PS : rebuts en plus, samedi, ruptures, lot détruit. */
  cout: number;
}

interface Conditions {
  demande: number;
  matiere: Matiere;
  /** Les semaines depuis la bascule ; `null` : la ligne tourne encore en PS. */
  k: number | null;
  qualif: Qualification;
  simultanee: boolean;
  /** La capacité, multipliée (essai, imprévus). */
  facteur: number;
  incident: boolean;
  /** Le risque d'incident compté en espérance, pour les bascules à venir. */
  esperance?: number;
  r: Reel;
}

function semaineDeLigne(c: Conditions): SemaineDeLigne {
  let demarrage = 1;
  let rebutEnPlus = 0;
  if (c.k !== null) {
    const d = DEMARRAGE[c.qualif];
    const perte = 1 - (d.cadence[c.k] ?? 1);
    demarrage = 1 - perte * (c.simultanee ? SIMULTANEE : 1);
    rebutEnPlus = (d.rebut[c.k] ?? 0) * (c.simultanee ? SIMULTANEE : 1);
  }
  const rebut = c.r.rebut + rebutEnPlus;
  const cadence = CADENCE_PS * (1 - c.r.cadence) * demarrage;
  const part = c.esperance ?? (c.incident ? 1 : 0);
  const facteur = c.facteur * (1 - (1 - ARRET_INCIDENT) * part);
  const parHeure = cadence * TRS * facteur * (1 - rebut);
  let bons = parHeure * HEURES;
  let cout = 0;
  let samedi = false;
  if (bons < c.demande) {
    samedi = true;
    bons += parHeure * SAMEDI.heures;
    cout += SAMEDI.cout;
  }
  const livres = Math.min(bons, c.demande);
  const rupture = c.demande - livres;
  const fabriques = livres / (1 - rebut);
  cout += fabriques * Math.max(0, rebut - REBUT_PS) * COUT_REBUT;
  cout += rupture * RUPTURE;
  cout += part * LOT_BLOQUE * c.demande * (COUT_REBUT + DESTRUCTION);
  return {
    demande: c.demande,
    livres,
    rupture,
    rebut,
    cadence: cadence * facteur,
    samedi,
    incident: c.incident,
    cout,
  };
}

/**
 * CE QUE COÛTE UNE BASCULE À VENIR, en espérance : les semaines de démarrage d'une ligne à
 * la saison où elle se fera, le risque de pots mal scellés compté pour sa probabilité.
 */
export function basculeAttendue(
  m: Matiere,
  q: Qualification,
  simultanee: boolean,
  saison: number,
  graine: number,
): number {
  const r = reel(m, graine);
  const p = risqueScellage(m, q, simultanee);
  let cout = 0;
  for (let k = 0; k < 4; k += 1) {
    const demande = POTS_SEMAINE * saison;
    cout += semaineDeLigne({
      demande,
      matiere: m,
      k,
      qualif: q,
      simultanee,
      facteur: 1,
      incident: false,
      esperance: k === 0 ? p : 0,
      r,
    }).cout;
    // Ce que la même semaine coûtera une fois la ligne rodée : le coût annuel le compte déjà.
    cout -= semaineDeLigne({
      demande,
      matiere: m,
      k: null,
      qualif: q,
      simultanee: false,
      facteur: 1,
      incident: false,
      r,
    }).cout;
  }
  return cout;
}

/** Le coût de la première année de l'emballage, comparé au PS : pot, éco-contribution, rebuts, cadence, DLC. */
export function coutAnnuel(m: Matiere, graine: number, reglagesConnus: boolean): number {
  if (m === "ps") return 0;
  const r = reel(m, graine);
  const dlc = m === "carton" && hasard(graine).uDLC >= DLC_CARTON.chance ? DLC_CARTON.perte : 0;
  return (
    surcoutUnitaire(m) * VOLUME_AN +
    (r.rebut - REBUT_PS + (reglagesConnus ? 0 : REGLAGES)) * VOLUME_AN * COUT_REBUT +
    r.cadence * 100 * COUT_POINT_CADENCE +
    dlc
  );
}

/** Le même calcul sur les fiches des fournisseurs : ce qu'on croit sans essai. */
export function coutAnnuelAnnonce(m: "pp" | "carton"): number {
  return (
    surcoutUnitaire(m) * VOLUME_AN +
    (ANNONCE[m].rebut - REBUT_PS) * VOLUME_AN * COUT_REBUT +
    ANNONCE[m].cadence * 100 * COUT_POINT_CADENCE
  );
}

/** Ce que Celtis accepte de prendre du surcoût, selon le dossier et sa réponse. */
export function partCeltis(chemin: readonly number[], graine: number): number {
  const m = matiereRetenue(chemin);
  if (m === "ps") return 0;
  const u = hasard(graine).uCeltis;
  const n = chemin[D.celtis];
  if (n === NEGO.tout) return u < CELTIS.toutAccord ? 1 : 0;
  if (n === NEGO.forfait) return CELTIS.forfait;
  if (n === NEGO.dossier) {
    if (u >= CELTIS.accord) return 0;
    const niveau = essaiFait(chemin) ? CELTIS.mesure : CELTIS.fiches;
    return niveau * (m === "carton" ? CELTIS.carton : 1);
  }
  return 0;
}

/** Celtis dit-elle oui ? Seul le hasard compte : le dossier fixe le montant, pas la réponse. */
export const celtisAccepte = (negociation: number, graine: number) =>
  negociation === NEGO.forfait ||
  (negociation === NEGO.tout && hasard(graine).uCeltis < CELTIS.toutAccord) ||
  (negociation === NEGO.dossier && hasard(graine).uCeltis < CELTIS.accord);

/** La chance qu'Opaline et Proxival s'alignent sur Celtis après le salon. */
export function chanceDAlignement(chemin: readonly number[]): number {
  const m = matiereRetenue(chemin);
  if (m === "ps") return 0;
  const a = chemin[D.salon];
  if (a === ANNONCE_SALON.mesure) {
    const basculee =
      chemin[D.bascule] !== BASCULE.reporter && Math.max(10, arrivees(chemin)[1]) <= SEMAINES;
    return basculee ? ALIGNEMENT.mesureBascule : ALIGNEMENT.mesure;
  }
  if (a === ANNONCE_SALON.carton) return m === "carton" ? ALIGNEMENT.carton : 0;
  return ALIGNEMENT.rien;
}

/** Les bobines de PS imprimées dont chaque ligne aura besoin au deuxième trimestre, en semaines. */
export function besoinsEnBobines(b: Bascules, m: Matiere): [number, number] {
  if (m === "ps") return [BOBINES.semaines, BOBINES.semaines];
  const besoin = (w: number) => borne(w - (SEMAINES + 1), 0, BOBINES.semaines);
  return [besoin(b.semaine[0]), besoin(b.semaine[1])];
}

/** Ce qui est commandé en semaine 2, ligne par ligne, en semaines : selon le plan de la semaine 1. */
export function commandeDeBobines(chemin: readonly number[]): [number, number] {
  const c = chemin[D.bobines];
  if (c === COMMANDE.confirmer) return [BOBINES.semaines, BOBINES.semaines];
  if (c === COMMANDE.annuler) return [0, 0];
  const p = chemin[D.plan];
  if (p === PLAN.rien) return [BOBINES.semaines, BOBINES.semaines];
  // L'essai prévoit la ligne 2 au premier trimestre, la ligne 1 en semaine 16 : deux semaines, et la marge.
  if (p === PLAN.essai) return [2 + BOBINES.marge, 0];
  return [0, 0];
}

/** Ce que coûtent les bobines en trop (détruites) ou manquantes (imprimées en urgence). */
export function coutDesBobines(
  commandees: readonly [number, number],
  besoins: readonly [number, number],
): { trop: number; manque: number; cout: number } {
  let trop = 0;
  let manque = 0;
  let cout = 0;
  const prix = PRIX.ps / 100;
  for (let l = 0; l < LIGNES; l += 1) {
    const ecart = commandees[l]! - besoins[l]!;
    if (ecart > 0) {
      trop += ecart;
      cout += ecart * BOBINES.potsSemaine * prix * (1 - BOBINES.recuperation);
    } else if (ecart < 0) {
      manque += -ecart;
      cout += BOBINES.urgenceFixe + -ecart * BOBINES.potsSemaine * prix * BOBINES.urgencePrime;
    }
  }
  return { trop, manque, cout };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** Ce que la semaine a coûté au changement. */
  cout: number;
  coutCumule: number;
  /** La part des commandes livrées, les deux lignes ensemble. */
  service: number;
  rebut: number;
  /** Les pots à l'heure, en moyenne des deux lignes. */
  cadence: number;
  /** La part de la gamme produite en pot recyclable. */
  recyclable: number;
  rupture: number;
  samedis: number;
  incidents: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'opposé du coût du changement : plus haut, mieux c'est. */
  objectif: number;
  /** Le coût du changement, estimé en semaine 13. */
  cout: number;
  trimestre: number;
  resteAFaire: number;
  annuel: number;
  enseignes: number;
  partCeltis: number;
  partAutres: number;
  alignement: boolean;
  matiere: Matiere;
  bascules: Bascules;
  /** Les lignes qui ont des pots mal scellés à leur bascule. */
  incidents: readonly number[];
  bobines: { trop: number; manque: number; cout: number };
  dlcTenue: boolean;
  serviceMoyen: number;
  ruptures: number;
  /** Ce que l'emballage retenu coûtera la première année, une fois la part des enseignes déduite. */
  annuelNet: number;
  /** Le chiffre de la prévision, en k€. */
  surcoutCarton: number;
  urgence: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const m = matiereRetenue(chemin);
  const plan = chemin[D.plan];
  const b = bascules(chemin, graine);
  const essai = essaiFait(chemin);
  const stock = chemin[D.bascule] === BASCULE.stock;
  const semaines: (Semaine | null)[] = [null];
  const incidents: number[] = [];
  let cumul = 0;
  let prixPS = 0;
  // Le stock d'avance : ce que les enseignes acceptent encore, ligne par ligne.
  const accepte = [0, 0];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = 0;
    if (w === 1) cout += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    for (const i of actifs) if (w === i.semaine) cout += i.imprevu.effet.cout ?? 0;
    for (const i of actifs) prixPS = Math.max(prixPS, i.imprevu.effet.prixPS ?? 0);

    // Les engagements : l'essai, les équipements, les dédits.
    if (essai && (w === 3 || w === 4)) cout += ESSAI / 2;
    if (w === 1 && plan === PLAN.carton) cout += 2 * CONFORMAGE.carton;
    if (w === 1 && plan === PLAN.ppDirect) cout += 2 * CONFORMAGE.pp;
    if (w === 5) {
      if (plan === PLAN.carton && m !== "carton") {
        // On renonce au carton : 30 % des modules et la première commande de pots.
        cout += -2 * CONFORMAGE.carton + 2 * CONFORMAGE.carton * DEDIT.part + DEDIT.potsCarton;
      }
      if (plan === PLAN.ppDirect && m !== "pp") {
        cout += -2 * CONFORMAGE.pp + 2 * CONFORMAGE.pp * DEDIT.part;
      }
      if (m === "pp" && plan !== PLAN.ppDirect) cout += 2 * CONFORMAGE.pp;
      if (m === "carton" && plan !== PLAN.carton) cout += 2 * CONFORMAGE.carton;
    }
    if (w === 9 && chemin[D.celtis] === NEGO.tout && !celtisAccepte(NEGO.tout, graine)) {
      cout += CELTIS.contrepartie;
    }
    if (w === 9 && chemin[D.celtis] === NEGO.forfait && m !== "ps") cout += CELTIS.avantPremiere;
    if (w === 9 && m === "ps") cout += CELTIS.sansPlan;
    if (w === 12 && chemin[D.salon] === ANNONCE_SALON.carton && m !== "carton") {
      cout += ALIGNEMENT.retropedalage;
    }

    let demandeTotale = 0;
    let livres = 0;
    let rupture = 0;
    let rebutPondere = 0;
    let cadence = 0;
    let samedis = 0;
    let incidentsSemaine = 0;
    let recyclable = 0;
    for (let l = 0; l < LIGNES; l += 1) {
      const demande = POTS_SEMAINE * SAISON[w]! * h.semaines[w]!;
      const basculee = m !== "ps" && w >= b.semaine[l]!;
      const k = basculee ? w - b.semaine[l]! : null;
      let facteur = 1;
      if (essai && l === 1 && (w === 3 || w === 4)) facteur *= 0.9;
      for (const i of actifs) facteur *= i.imprevu.effet.capacite?.[l] ?? 1;
      const incident = k === 0 && h.uScel[l]! < risqueScellage(m, b.qualif[l]!, b.simultanee[l]!);
      if (incident) incidents.push(l);
      const s = semaineDeLigne({
        demande,
        matiere: basculee ? m : "ps",
        k,
        qualif: b.qualif[l]!,
        simultanee: b.simultanee[l]!,
        facteur,
        incident,
        r: reel(basculee ? m : "ps", graine),
      });
      let ruptureLigne = s.rupture;
      let coutLigne = s.cout;
      // Le stock d'avance couvre les ruptures du démarrage, pour ce que les enseignes en acceptent.
      if (stock && k === 0) {
        const fait = POTS_SEMAINE * STOCK.semaines;
        coutLigne += STOCK.samedis * SAMEDI.cout + fait * (1 - STOCK.accepte) * STOCK.perte;
        accepte[l] = fait * STOCK.accepte;
      }
      if (stock && k !== null && accepte[l]! > 0) {
        const couvert = Math.min(accepte[l]!, ruptureLigne);
        accepte[l]! -= couvert;
        ruptureLigne -= couvert;
        coutLigne -= couvert * RUPTURE;
      }
      // Le pot lui-même : ce qu'il coûte de plus que le PS, éco-contribution comprise.
      coutLigne += s.livres * (basculee ? surcoutUnitaire(m) : prixPS / 100);
      cout += coutLigne;
      demandeTotale += demande;
      livres += demande - ruptureLigne;
      rupture += ruptureLigne;
      rebutPondere += s.rebut * demande;
      cadence += s.cadence / LIGNES;
      samedis += s.samedi ? 1 : 0;
      incidentsSemaine += incident ? 1 : 0;
      recyclable += basculee ? 1 / LIGNES : 0;
    }
    cumul += cout;
    semaines.push({
      cout,
      coutCumule: cumul,
      service: SERVICE_PS * (livres / demandeTotale),
      rebut: rebutPondere / demandeTotale,
      cadence,
      recyclable,
      rupture,
      samedis,
      incidents: incidentsSemaine,
    });
  }

  // Ce qui reste à faire au deuxième trimestre, en espérance.
  const bobines = coutDesBobines(commandeDeBobines(chemin), besoinsEnBobines(b, m));
  let resteAFaire = bobines.cout;
  const urgence = m === "ps";
  if (m !== "ps") {
    for (let l = 0; l < LIGNES; l += 1) {
      if (b.semaine[l]! <= SEMAINES) continue;
      resteAFaire += basculeAttendue(m, b.qualif[l]!, b.simultanee[l]!, SAISON_T2, graine);
    }
  } else {
    // L'échéance choisit : le PP, les deux lignes ensemble, au printemps, kits au prix de l'urgence.
    const q: Qualification = essai ? "partielle" : "aucune";
    resteAFaire += 2 * CONFORMAGE.pp * URGENCE.kits;
    resteAFaire += basculeAttendue("pp", q, false, SAISON_URGENCE, graine);
    resteAFaire += basculeAttendue("pp", q, true, SAISON_URGENCE, graine);
  }

  const annuel = urgence
    ? coutAnnuel("pp", graine, false) + (URGENCE.pot / 100) * VOLUME_AN
    : coutAnnuel(m, graine, essai);
  const pc = partCeltis(chemin, graine);
  const celtis = pc * PART_CELTIS * annuel;
  const alignement = pc > 0 && h.uAlignement < chanceDAlignement(chemin);
  const autres = alignement ? pc * PART_AUTRES * annuel : 0;
  const enseignes = celtis + autres;
  const trimestre = cumul;
  const cout = trimestre + resteAFaire + annuel - enseignes;
  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: -cout,
    cout,
    trimestre,
    resteAFaire,
    annuel,
    enseignes,
    partCeltis: pc,
    partAutres: alignement ? pc : 0,
    alignement,
    matiere: m,
    bascules: b,
    incidents,
    bobines,
    dlcTenue: h.uDLC < DLC_CARTON.chance,
    serviceMoyen: pleines.reduce((s, x) => s + x.service, 0) / SEMAINES,
    ruptures: pleines.reduce((s, x) => s + x.rupture, 0),
    annuelNet: annuel - enseignes,
    surcoutCarton: SURCOUT_CARTON / 1000,
    urgence,
  };
}

/** Ce qui s'est passé pendant des semaines : bascules, lots bloqués, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    t,
    dans,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePot {
  coutCumule: number | null;
  service: number | null;
  rebut: number | null;
  cadence: number | null;
  recyclable: number | null;
  /** Lus pour les messages et les sources. */
  essai: number | null;
  cadencePP: number | null;
  rebutPP: number | null;
  cadenceCarton: number | null;
  rebutCarton: number | null;
  /** 1 : le carton tient la DLC ; 0 : non ; `null` : pas encore su. */
  dlcCarton: number | null;
  annuelPP: number | null;
  annuelCarton: number | null;
  arriveeL1: number | null;
  arriveeL2: number | null;
  bobinesL1: number | null;
  bobinesL2: number | null;
}

/** Ce qu'Azilis lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePot {
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const essai = chemin[D.plan] === PLAN.essai;
  const mesure = essai && semaine >= 4;
  const h = hasard(graine);
  const commande = commandeDeBobines(chemin);
  const [a1, a2] = arrivees(chemin);
  const communs = {
    essai: essai ? 1 : 0,
    cadencePP: mesure ? h.pp.cadence : null,
    rebutPP: mesure ? h.pp.rebut : null,
    cadenceCarton: mesure ? h.carton.cadence : null,
    rebutCarton: mesure ? h.carton.rebut : null,
    dlcCarton: essai && semaine >= 8 ? (h.uDLC < DLC_CARTON.chance ? 1 : 0) : null,
    annuelPP: mesure ? coutAnnuel("pp", graine, true) : null,
    // La DLC du carton ne se sait qu'en semaine 8, à la fin des tests de conservation.
    annuelCarton: mesure
      ? coutAnnuel("carton", graine, true) -
        (semaine < 8 && h.uDLC >= DLC_CARTON.chance ? DLC_CARTON.perte : 0)
      : null,
    arriveeL1: a1 < 99 ? a1 : null,
    arriveeL2: a2 < 99 ? a2 : null,
    bobinesL1: commande[0],
    bobinesL2: commande[1],
  };
  if (semaine === 0) {
    return {
      coutCumule: 0,
      service: SERVICE_PS,
      rebut: REBUT_PS,
      cadence: CADENCE_PS,
      recyclable: 0,
      ...communs,
    };
  }
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    coutCumule: s.coutCumule,
    service: s.service,
    rebut: s.rebut,
    cadence: s.cadence,
    recyclable: s.recyclable,
    ...communs,
  };
}
