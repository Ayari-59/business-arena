/**
 * LES PALETTES QUI PÉRIMENT — le modèle du plan de production des produits frais de Loudéac.
 *
 * Laiterie de Kerbrélan, usine de Loudéac : les yaourts aromatisés et les
 * desserts lactés de trois lignes de conditionnement, quarante-six références
 * vendues aux trois enseignes (Celtis, Opaline, Proxival) et à la restauration
 * collective. De juillet à septembre, treize semaines, six décisions. La casse
 * (produits déclassés ou détruits à DLC dépassée, refus des entrepôts des
 * enseignes pour fraîcheur insuffisante) a atteint 2,8 % du chiffre d'affaires
 * au printemps, le double de l'objectif, et le taux de service à Celtis est
 * tombé à 96 %. Cinq mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · UN PRODUIT FRAIS NE SE STOCKE PAS. Une DLC de 28 jours, et des centrales
 *     qui exigent d'en recevoir au moins les deux tiers : un pot doit quitter
 *     l'usine au plus huit jours après sa fabrication. Plus une série couvre
 *     de jours de ventes, plus son stock moyen vieillit et plus il se casse :
 *     la casse observée vaut 1 % des pots par semaine de stock moyen sur les
 *     fortes rotations, 1,6 % sur les faibles ; au-delà de la fenêtre de huit
 *     jours, elle s'accélère (refus des entrepôts). La casse a trois causes :
 *     les grandes séries, les promotions produites à l'aveugle, les écarts de
 *     prévision sur les faibles rotations.
 *   · LA TAILLE DE LOT ÉCONOMIQUE. Le coût d'un changement de série (rinçage,
 *     réglages, mix et pots de démarrage perdus : 180 €) contre le coût de
 *     possession d'un stock qui se casse (0,90 € de froid et 2,40 € de casse
 *     par millier de pots et par semaine) : la formule de Wilson donne pour
 *     les fortes rotations une série d'environ une semaine de ventes, contre
 *     dix jours aujourd'hui. Pour les faibles rotations, elle donne deux à
 *     trois semaines, plus que la fenêtre de fraîcheur : c'est la fenêtre qui
 *     fixe la série.
 *   · PRODUIRE PETIT SATURE LA LIGNE. Chaque série de plus prend 25 minutes de
 *     ligne. Au-delà de 95 % des heures ouvertes, il faut des samedis ; au-delà
 *     des samedis, ce sont des ruptures, et les pénalités logistiques des
 *     enseignes (20 % de la valeur manquante au-delà de la tolérance de 1,5 %,
 *     plafonnées à 2 % de la valeur commandée).
 *   · PRÉVOIR AVEC L'ENSEIGNE. Les promotions sont produites sur l'historique,
 *     à 28 % près ; une prévision partagée avec Celtis (ses volumes
 *     promotionnels et ses commandes fermes) réduit l'erreur, à partir de la
 *     semaine 7 seulement. Celtis l'accepte ou non, selon ce qu'on lui propose
 *     (tiré au hasard). Les commandes fermes permettent de produire les faibles
 *     rotations à la commande, sans stock de sécurité.
 *   · BRADER COÛTE, DONNER COÛTE PEU. Les surplus encore consommables se
 *     vendent aux magasins de déstockage au quart du prix (la marque
 *     seulement : un produit sous marque de distributeur ne peut pas y aller),
 *     mais la marque y perd son prix ; donnés aux associations, ils ouvrent une
 *     réduction d'impôt de 60 % de leur coût de revient (leur valeur en stock,
 *     pas leur prix de vente), dans la limite de ce que les associations
 *     peuvent prendre en froid.
 *
 * Le trimestre est jugé en euros : la marge sur coût variable des ventes,
 * moins la casse (au coût variable, nette de ce que les surplus rapportent),
 * les pénalités logistiques, les changements de série et les samedis, plus
 * l'effet attendu sur le trimestre suivant de ce que le trimestre a mis en
 * place ou abîmé : la prévision partagée avec Celtis, le prix de la marque
 * après le déstockage, les références que Celtis déréférence, et la règle de
 * pilotage choisie pour l'automne.
 *
 * La sécurité des aliments n'est jamais une variable : une DLC allongée sans
 * étude de vieillissement validée expose à un retrait de lots, et coûte.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * L'ÉCONOMIE D'UN POT, en euros par millier de pots.
 * ------------------------------------------------------------------------- */
/** Le prix de cession net moyen aux enseignes ; en promotion, 15 % de moins. */
export const PRIX = 320;
export const PRIX_PROMO = 272;
/** Le coût variable : lait, sucre, ingrédients, emballages, énergie de fabrication. */
export const COUT_VARIABLE = 240;
export const MCV = PRIX - COUT_VARIABLE;
export const MCV_PROMO = PRIX_PROMO - COUT_VARIABLE;
/** Le coût de revient industriel, la valeur en stock : coût variable et frais fixes de l'usine. */
export const COUT_REVIENT = 268;

/* ---------------------------------------------------------------------------
 * LES RÉFÉRENCES : seize fortes rotations, trente faibles.
 * ------------------------------------------------------------------------- */
export type Classe = "A" | "C";
export const CLASSES: readonly Classe[] = ["A", "C"];
export const REFS: Readonly<
  Record<
    Classe,
    {
      nombre: number;
      /** Les ventes d'une référence, en milliers de pots par semaine. */
      demande: number;
      /** La part des pots qui se cassent par semaine de stock moyen. */
      casseStock: number;
      /** L'erreur de prévision d'une semaine, en part des ventes. */
      erreur: number;
      /** Le stock de sécurité, en semaines de ventes. */
      securite: number;
    }
  >
> = {
  A: { nombre: 16, demande: 125, casseStock: 0.01, erreur: 0.12, securite: 0.02 },
  C: { nombre: 30, demande: 12, casseStock: 0.016, erreur: 0.25, securite: 0.1 },
};
export const VOLUME: Readonly<Record<Classe, number>> = {
  A: REFS.A.nombre * REFS.A.demande,
  C: REFS.C.nombre * REFS.C.demande,
};
export const VOLUME_TOTAL = VOLUME.A + VOLUME.C;
/** Le chiffre d'affaires d'une semaine ordinaire, hors promotions. */
export const CA_SEMAINE = VOLUME_TOTAL * PRIX;

/** La DLC des produits frais, et la part que les centrales exigent de recevoir. */
export const DLC = 28;
export const DEUX_TIERS = 2 / 3;
/** Le transport jusqu'aux entrepôts, en jours. */
export const TRANSPORT = 1;
/** La fenêtre : un pot doit quitter l'usine au plus huit jours après sa fabrication. */
export const FENETRE_JOURS = Math.floor(DLC * (1 - DEUX_TIERS) - TRANSPORT);
export const FENETRE = FENETRE_JOURS / 7;
/** Au-delà de la fenêtre, la casse s'accélère : refus des entrepôts. */
export const ACCELERATION = 0.011;
/** Ce que coûte un millier de pots gardé une semaine en chambre froide : froid, manutention. */
export const COUT_FROID = 0.9;

/** Un changement de série entre deux recettes : rinçage, réglages, mix et pots de démarrage perdus. */
export const CHANGEMENT = { cout: 180, minutes: 25 } as const;
/** Le détail du coût d'un changement, tel que la source le donne. */
export const DETAIL_CHANGEMENT = { equipe: 60, nettoyage: 24, demarrage: 96 } as const;
/** Un changement de format pour les lots promotionnels. */
export const FORMAT_PROMO = { cout: 420, minutes: 70 } as const;

/** Le coût de possession, casse comprise, par millier de pots et par semaine de stock. */
export const possession = (c: Classe) => COUT_FROID + REFS[c].casseStock * COUT_VARIABLE;

/** La taille de lot économique (Wilson), en milliers de pots. */
export const lotEconomique = (demande: number, coutChangement: number, h: number) =>
  Math.sqrt((2 * demande * coutChangement) / h);

/** La référence de la prévision : la crème dessert chocolat 4×125 g, une forte rotation. */
export const REFERENCE_PREVISION = { nom: "crème dessert chocolat 4×125 g", demande: 150 } as const;
export const LOT_ECONOMIQUE_REFERENCE = lotEconomique(
  REFERENCE_PREVISION.demande,
  CHANGEMENT.cout,
  possession("A"),
);
/** Aujourd'hui, une série tous les dix jours de ventes. */
export const LOT_ACTUEL_REFERENCE = (REFERENCE_PREVISION.demande * 10) / 7;

/** La couverture économique d'une classe, en semaines de ventes, plafonnée par la fenêtre. */
export const couvertureEconomique = (c: Classe) =>
  Math.min(
    FENETRE,
    lotEconomique(REFS[c].demande, CHANGEMENT.cout, possession(c)) / REFS[c].demande,
  );
/** La couverture que donne Wilson pour les faibles rotations, sans le plafond de fraîcheur. */
export const couvertureWilsonC = () =>
  lotEconomique(REFS.C.demande, CHANGEMENT.cout, possession("C")) / REFS.C.demande;

/** La couverture d'une série selon le plan, en semaines de ventes. */
export const SERIES: readonly Readonly<Record<Classe, number>>[] = [
  { A: 12 / 7, C: 3 },
  { A: couvertureEconomique("A"), C: couvertureEconomique("C") },
  { A: 0.6, C: 0.6 },
  { A: 1.4, C: 3 },
];

/** La part des pots qui se cassent quand une série couvre `c` semaines avec `s` semaines de sécurité. */
export function tauxCasseSerie(classe: Classe, c: number, s: number) {
  const age = c + s;
  return REFS[classe].casseStock * (c / 2 + s) + ACCELERATION * Math.max(0, age - FENETRE) ** 2;
}

/* ---------------------------------------------------------------------------
 * LES LIGNES.
 * ------------------------------------------------------------------------- */
export const LIGNES = 3;
/** 2×8 du lundi au vendredi, moins le nettoyage en place (NEP) du soir. */
export const HEURES_OUVERTES = LIGNES * 75;
/** Ce qu'une ligne sort vraiment en une heure, TRS compris, en milliers de pots. */
export const CADENCE = 14.5;
/** Au-delà de 95 % des heures ouvertes, il faut des samedis ; au plus 10 % de plus. */
export const SEUIL_SAMEDI = 0.95;
export const SAMEDI_MAX = 0.1;
export const COUT_HEURE_SAMEDI = 320;

/* ---------------------------------------------------------------------------
 * LES CLIENTS ET LEURS PÉNALITÉS.
 * ------------------------------------------------------------------------- */
export type Enseigne = "celtis" | "opaline" | "proxival" | "autres";
export const PARTS: Readonly<Record<Enseigne, number>> = {
  celtis: 0.45,
  opaline: 0.3,
  proxival: 0.15,
  autres: 0.1,
};
/** La marque Kerbrélan dans ces références ; le reste est sous marque de distributeur. */
export const PART_MARQUE = 0.6;
export const SERVICE_ATTENDU = 0.985;
/** 20 % de la valeur manquante au-delà de la tolérance, au plus 2 % de la valeur commandée. */
export const PENALITE = { taux: 0.2, plafond: 0.02 } as const;
/** Une rupture n'est perdue qu'à moitié : l'enseigne complète une partie le lendemain. */
export const PERTE_RUPTURE = 0.5;

export function penalite(commande: number, manquant: number, prix = PRIX) {
  const exces = Math.max(0, manquant - (1 - SERVICE_ATTENDU) * commande);
  return Math.min(PENALITE.plafond * commande * prix, PENALITE.taux * exces * prix);
}

/* ---------------------------------------------------------------------------
 * LES PROMOTIONS.
 * ------------------------------------------------------------------------- */
export interface Operation {
  id: string;
  enseigne: Enseigne;
  semaines: readonly [number, number];
  /** Le volume promotionnel attendu par semaine, en milliers de pots. */
  volume: number;
}
export const OPERATIONS: readonly Operation[] = [
  { id: "ete", enseigne: "celtis", semaines: [3, 4], volume: 260 },
  { id: "opaline", enseigne: "opaline", semaines: [6, 7], volume: 200 },
  { id: "aout", enseigne: "celtis", semaines: [8, 9], volume: 240 },
  { id: "rentree", enseigne: "celtis", semaines: [11, 12], volume: 320 },
];
/** L'erreur sur le volume d'une promotion produite sur l'historique. */
export const ERREUR_PROMO = 0.28;
/** Avec les volumes de l'enseigne, et en réassort sur les sorties de caisse. */
export const ERREUR_PROMO_PARTAGEE = 0.1;
export const ERREUR_REASSORT = { partagee: 0.05, seule: 0.12 } as const;
/** Le stock de sécurité de promotion du réflexe : 25 % au-dessus de l'historique. */
export const MARGE_PROMO = 0.25;
export const MARGE_RENTREE = 0.2;
/** Une série unique pour la rentrée, fabriquée en semaine 10 : une partie arrive trop vieille. */
export const REFUS_SERIE_UNIQUE = 0.18;

/* ---------------------------------------------------------------------------
 * LA CASSE ET LES SURPLUS.
 * ------------------------------------------------------------------------- */
/** La casse sans rapport avec le plan : casse physique, incidents. */
export const CASSE_AUTRE = 0.0005;
/** Un excédent de prévision sur une faible rotation finit en casse pour un quart. */
export const CASSE_EXCES_C = 0.15;
/** La moitié de la casse est encore consommable : refus pour fraîcheur, surplus de promotion. */
export const CONSOMMABLE = 0.5;
export const DESTRUCTION = 6;
export const DESTOCKAGE = { prix: 0.25, erosion: 70 } as const;
/** La réduction d'impôt du mécénat : 60 % de la valeur en stock des produits donnés. */
export const REDUCTION_DON = 0.6;
export const DON = {
  logistique: 14,
  /** Les associations du département prennent dix palettes par semaine en froid positif. */
  palettes: 10,
  potsParPalette: 2.88,
  convention: 1000,
} as const;
export const CAPACITE_DON = DON.palettes * DON.potsParPalette;
export const VALEUR_DON = REDUCTION_DON * COUT_REVIENT - DON.logistique;
/** Ce que la casse coûtait au printemps, et l'objectif. */
export const CASSE_DEPART = 0.028;
export const OBJECTIF_CASSE = 0.014;
export const SERVICE_CELTIS_DEPART = 0.96;
/** Les pénalités logistiques du printemps, les trois enseignes ensemble. */
export const PENALITES_PRINTEMPS = 37000;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  series: 0,
  celtis: 1,
  surplus: 2,
  service: 3,
  rentree: 4,
  automne: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 0, 3, 3, 3] as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : un jour de plus de grandes séries. */
export const PERTE_PAR_JOUR = 3500;

/** La prévision partagée avec Celtis : la proposition, et ses chances d'être acceptée. */
export const PARTENARIAT = {
  acceptation: { contrepartie: 0.65, simple: 0.2 },
  mise: 5000,
  previsionniste: 1400,
  debut: 7,
  /** L'erreur de prévision baisse de moitié sur la part de Celtis. */
  reduction: 0.5,
  /** Sans Celtis, un prévisionniste améliore la prévision interne de 5 %. */
  interne: 0.05,
  /** La prévision partagée vaut, sur le trimestre suivant : les promotions d'automne et de Noël. */
  suite: 20000,
} as const;

/** Le stock de sécurité de trois jours sur toutes les références, constitué en semaines 7 et 8. */
export const SECURITE_PARTOUT = 3 / 7;
export const SECURITE_CIBLEE = 0.2;
/** L'arrêt des dix faibles rotations les moins vendues, au 1er septembre (semaine 9). */
export const ARRET = {
  references: 10,
  volume: 50,
  report: 0.7,
  debut: 9,
  /** Les linéaires libérés vont au Groupe Nordal : ce que coûte le trimestre suivant. */
  lineaire: 6000,
} as const;

/** Celtis réagit à un taux de service bas : quatre faibles rotations déréférencées au 1er janvier. */
export const DEREFERENCEMENT = {
  seuil: 0.975,
  chance: 0.5,
  references: 4,
  cout: 4 * REFS.C.demande * PARTS.celtis * MCV * SEMAINES,
} as const;
/** Opaline voit la marque en déstockage : une remise de 2 % sur la marque pendant deux mois. */
export const COMPENSATION = {
  remise: 0.02,
  semaines: 9,
  /** La probabilité monte avec le volume déstocké : certaine vers 220 milliers de pots. */
  volume: 220,
  max: 0.85,
} as const;
export const COMPENSATION_SEMAINE = CA_SEMAINE * PARTS.opaline * PART_MARQUE * COMPENSATION.remise;

/** L'automne : la règle de pilotage, et ce qu'elle vaut sur le trimestre suivant. */
export const CA_TRIMESTRE = CA_SEMAINE * SEMAINES;
export const AUTOMNE = {
  /** À Pontivy, le PIC mensuel a fait baisser la casse de 0,3 point en un trimestre. */
  pic: 0.003,
  picPartage: 0.0045,
  picCout: 1500,
  /** La prime au coût unitaire allonge les séries : 0,4 point de casse, 0,15 si elles sont déjà longues. */
  coutUnitaire: 0.004,
  coutUnitaireDejaLongues: 0.0015,
  /** Une DLC allongée sans étude : moins de casse, et un lot non conforme une fois sur trois. */
  dlcGain: 0.0025,
  dlcRisque: 1 / 3,
  dlcRetrait: 250000,
} as const;
/** Ce que vaut un point de casse sur un trimestre : la casse se paie au coût variable. */
export const valeurPointDeCasse = (points: number) =>
  points * CA_TRIMESTRE * (COUT_VARIABLE / PRIX);

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
    demande?: number;
    capacite?: number;
    /** De la casse en plus, en milliers de pots, non consommable. */
    casse?: number;
    /** Une promotion non annoncée, en milliers de pots, produite pour moitié. */
    surprise?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "canicule",
    titre: "Canicule",
    de: "Météo-France, bulletin régional",
    role: "Vigilance orange",
    texte:
      "Vigilance canicule sur la Bretagne pour deux semaines : les ventes de yaourts montent, les groupes froids de l'usine peinent et les lignes ralentissent l'après-midi.",
    duree: 2,
    effet: { demande: 1.06, capacite: 0.95 },
  },
  {
    id: "thermoformeuse",
    titre: "Panne de la thermoformeuse de la ligne 2",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "La thermoformeuse de la ligne 2 est arrêtée deux jours : une pièce du moule à remplacer. Les séries de la ligne 2 se reportent sur les deux autres.",
    duree: 1,
    effet: { capacite: 0.87 },
  },
  {
    id: "opercules",
    titre: "Opercules livrés en retard",
    de: "Azilis Cozic",
    role: "Responsable emballages et développement",
    texte:
      "Le fournisseur d'opercules imprimés livre avec une semaine de retard : il faut réordonnancer les séries de la semaine selon les opercules disponibles.",
    duree: 1,
    effet: { capacite: 0.92 },
  },
  {
    id: "prospectus",
    titre: "Prospectus avancé chez Opaline",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Opaline a avancé d'une semaine un prospectus sur les desserts sans nous prévenir : des commandes en plus, qu'on ne pourra servir qu'à moitié.",
    duree: 1,
    effet: { surprise: 160 },
  },
  {
    id: "camion",
    titre: "Groupe froid en panne chez Kerfroid",
    de: "Transports Kerfroid",
    role: "Exploitation",
    texte:
      "Le groupe froid d'une semi-remorque est tombé en panne entre Loudéac et l'entrepôt de Celtis : la chaîne du froid est rompue, le chargement est détruit.",
    duree: 1,
    effet: { casse: 26 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  a: number;
  c: number;
  dispo: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le volume réel de chaque promotion, rapporté au volume attendu. */
  promos: Readonly<Record<string, number>>;
  /** L'erreur qui reste quand les volumes sont partagés, ou en réassort. */
  erreursPartagees: Readonly<Record<string, number>>;
  reassort: number;
  uCeltis: number;
  uOpaline: number;
  uDeref: number;
  uDlc: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001047 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      a: borne(1 + 0.02 * gauss(r), 0.94, 1.06),
      c: borne(1 + 0.03 * gauss(r), 0.9, 1.1),
      dispo: borne(1 + 0.025 * gauss(r), 0.93, 1.05),
    });
  }
  const promos: Record<string, number> = {};
  const erreursPartagees: Record<string, number> = {};
  for (const op of OPERATIONS) {
    promos[op.id] = borne(1 + ERREUR_PROMO * gauss(r), 0.5, 1.6);
    erreursPartagees[op.id] = borne(gauss(r), -2.5, 2.5);
  }
  const reassort = borne(gauss(r), -2.5, 2.5);
  const uCeltis = r();
  const uOpaline = r();
  const uDeref = r();
  const uDlc = r();
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
    promos,
    erreursPartagees,
    reassort,
    uCeltis,
    uOpaline,
    uDeref,
    uDlc,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUE LE HASARD FAIT DES DÉCISIONS.
 * ------------------------------------------------------------------------- */

/** Celtis accepte-t-elle de partager ses volumes ? Avec une contrepartie, deux fois sur trois. */
export function chanceQueCeltisAccepte(chemin: readonly number[]): number {
  const d = chemin[D.celtis];
  if (d === 0) return PARTENARIAT.acceptation.contrepartie;
  if (d === 1) return PARTENARIAT.acceptation.simple;
  return 0;
}
export const celtisAccepte = (chemin: readonly number[], graine: number) =>
  hasard(graine).uCeltis < chanceQueCeltisAccepte(chemin);

/** La chance qu'Opaline demande une compensation, selon les pots de marque déstockés. */
export const chanceDeCompensation = (destocke: number) =>
  Math.min(COMPENSATION.max, destocke / COMPENSATION.volume);

/** L'étude de la DLC : le lot non conforme tombe une fois sur trois. */
export const lotNonConforme = (chemin: readonly number[], graine: number) =>
  chemin[D.automne] === 2 && hasard(graine).uDlc < AUTOMNE.dlcRisque;

/* ---------------------------------------------------------------------------
 * L'ERREUR DE PRÉVISION : ce qu'elle laisse en trop, et ce qu'elle laisse manquer.
 * ------------------------------------------------------------------------- */
const phi = (z: number) => Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI);
/** La fonction de répartition de la loi normale (Abramowitz et Stegun, 7.1.26). */
export function Phi(z: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
/** E[(s − ε)⁺] et E[(ε − s)⁺] pour ε ~ N(0, σ) : l'excédent et le manque, en part des ventes. */
export function excesEtManque(sigma: number, s: number) {
  if (sigma <= 0) return { exces: Math.max(0, s), manque: Math.max(0, -s) };
  const z = s / sigma;
  const G = (x: number) => x * Phi(x) + phi(x);
  return { exces: sigma * G(z), manque: sigma * G(-z) };
}
/** Plus une série couvre de semaines, plus on prévoit loin : l'erreur croît comme la racine. */
export const erreurSerie = (sigma: number, c: number) => sigma * Math.sqrt((c + 0.5) / 1.5);

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */
export type Semaine = {
  /** La casse de la semaine, en part du chiffre d'affaires. */
  casse: number;
  /** La casse de la semaine, en milliers de pots. */
  cassePots: number;
  serviceCeltis: number;
  /** La charge des lignes, en part des heures ouvertes. */
  charge: number;
  changements: number;
  /** Les pénalités logistiques de la semaine. */
  penalites: number;
  /** Ce que la semaine rapporte à l'objectif : marge, moins casse nette, pénalités, changements, samedis. */
  resultat: number;
  ca: number;
  /** Les commandes de la semaine, promotions comprises, en milliers de pots. */
  commandes: number;
  marge: number;
  /** La casse nette : au coût variable, moins ce que les surplus rapportent. */
  casseNette: number;
  coutChangements: number;
  samedis: number;
  ruptures: number;
  /** Les pots de marque partis en déstockage, et ceux donnés. */
  destocke: number;
  donne: number;
  /** La casse par cause, en milliers de pots. */
  casseSeries: number;
  cassePromo: number;
  cassePrevision: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Marge, moins casse nette, pénalités, changements et samedis, plus l'effet sur le trimestre suivant. */
  objectif: number;
  /** Le résultat du trimestre lui-même. */
  trimestre: number;
  /** L'effet attendu sur le trimestre suivant. */
  suite: number;
  ca: number;
  marge: number;
  casseTaux: number;
  casseNette: number;
  penalites: number;
  coutChangements: number;
  samedis: number;
  serviceCeltis: number;
  celtisAccepte: boolean;
  compensation: boolean;
  /** La semaine où Opaline réclame, s'il y a lieu. */
  semaineCompensation: number | null;
  dereferencement: boolean;
  lotNonConforme: boolean;
  destocke: number;
  donne: number;
  /** Le volume réel de la promotion de rentrée, rapporté au volume annoncé. */
  rentree: number;
  /** La taille de lot économique de la crème dessert chocolat, en milliers de pots. */
  lotEconomique: number;
  /** La part de l'effet sur le trimestre suivant, par cause. */
  effets: {
    partenariat: number;
    marque: number;
    dereferencement: number;
    automne: number;
    lineaire: number;
  };
}

/** Le plan de séries en vigueur à la semaine `w` : le nouveau plan s'applique en deux semaines. */
function couvertures(d1: number, w: number): Record<Classe, number> {
  const actuel = SERIES[3]!;
  const plan = SERIES[d1] ?? actuel;
  const k = w <= 1 ? 0 : w === 2 ? 0.5 : 1;
  return {
    A: actuel.A + (plan.A - actuel.A) * k,
    C: actuel.C + (plan.C - actuel.C) * k,
  };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const accepte = celtisAccepte(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let destockeCumule = 0;
  let compensation = false;
  let semaineCompensation: number | null = null;
  let dereferencement = false;
  const servicesCeltis: number[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const saison = SAISON[w]!;
    const partage = accepte && w >= PARTENARIAT.debut;
    const interne = d2 === 0 && !accepte && w >= PARTENARIAT.debut;

    // Ce que les enseignes commandent.
    let facteur = saison;
    for (const a of actifs) facteur *= a.imprevu.effet.demande ?? 1;
    const arret = d4 === 2 && w >= ARRET.debut;
    const volumeC = arret ? VOLUME.C - ARRET.volume * (1 - ARRET.report) : VOLUME.C;
    const refsC = arret ? REFS.C.nombre - ARRET.references : REFS.C.nombre;
    const dA = VOLUME.A * facteur * n.a;
    const dC = volumeC * facteur * n.c;

    // Le plan de séries et la sécurité.
    const cov = couvertures(d1 ?? 3, w);
    let sA = REFS.A.securite;
    let sC = REFS.C.securite;
    let construction = 0;
    let ferme = 0;
    if (w >= 7) {
      if (d4 === 0) {
        sA += SECURITE_PARTOUT;
        sC += SECURITE_PARTOUT;
        if (w <= 8) construction = (SECURITE_PARTOUT * (VOLUME.A + VOLUME.C)) / 2;
      } else if (d4 === 1) {
        sA += SECURITE_CIBLEE;
        // Les faibles rotations à la commande : sans stock de sécurité, sur commandes fermes si Celtis en donne.
        sC = 0;
        ferme = partage ? PARTS.celtis : 0;
      }
    }

    // L'erreur de prévision, que la série et le partage avec Celtis font varier.
    let gainPrevision = 1;
    if (partage) gainPrevision = 1 - PARTS.celtis * PARTENARIAT.reduction;
    else if (interne) gainPrevision = 1 - PARTENARIAT.interne;
    // Moins de références, plus de volume par référence : une erreur plus faible.
    const erreurC = REFS.C.erreur * (arret ? Math.sqrt(REFS.C.demande / (volumeC / refsC)) : 1);
    const sigA = erreurSerie(REFS.A.erreur, cov.A) * gainPrevision;
    const sigC = erreurSerie(erreurC, cov.C) * gainPrevision;
    const pa = excesEtManque(sigA, sA);
    const pc = excesEtManque(sigC, sC);
    // La part ferme des faibles rotations ne connaît ni excès ni manque.
    const libre = 1 - ferme;

    // La casse des séries, et celle de la prévision des faibles rotations.
    const casseSeries =
      dA * tauxCasseSerie("A", cov.A, sA) + dC * tauxCasseSerie("C", cov.C, sC * libre);
    const cassePrevision = dC * libre * CASSE_EXCES_C * pc.exces;
    const rupturesStock = PERTE_RUPTURE * (dA * pa.manque + dC * libre * pc.manque);

    // Les promotions.
    let promoDemande = 0;
    let promoProduit = 0;
    let promoManque = 0;
    let promoCeltis = 0;
    let promoManqueCeltis = 0;
    let promoManqueOpaline = 0;
    let cassePromo = 0;
    let formats = 0;
    for (const op of OPERATIONS) {
      if (w !== op.semaines[0] && w !== op.semaines[1]) continue;
      const m = h.promos[op.id]!;
      const e = h.erreursPartagees[op.id]!;
      const demande = op.volume * m;
      let produit = op.volume;
      const partagee = op.enseigne === "celtis" && accepte && op.semaines[0] >= 8;
      const marge = d2 === 2 && op.semaines[0] >= 6 ? MARGE_PROMO : 0;
      if (op.id === "rentree" && d5 !== 3) {
        const base = partagee ? op.volume * m * (1 + ERREUR_PROMO_PARTAGEE * e) : op.volume;
        if (d5 === 0) {
          produit = base;
          if (w === op.semaines[1]) cassePromo += Math.min(produit, demande) * REFUS_SERIE_UNIQUE;
        } else if (d5 === 1) {
          // Deux séries : la seconde ajustée sur les sorties de caisse de la première semaine.
          const ecart = partagee ? ERREUR_REASSORT.partagee : ERREUR_REASSORT.seule;
          produit = w === op.semaines[0] ? base : op.volume * m * (1 + ecart * h.reassort);
          if (w === op.semaines[1] && d1 === 2) {
            // Des lignes saturées ne trouvent pas de place pour la seconde série à temps.
            produit *= 0.8;
          }
          if (w === op.semaines[0]) formats += 1;
        } else {
          produit = base * (1 + MARGE_RENTREE);
        }
      } else if (partagee) {
        produit = op.volume * m * (1 + ERREUR_PROMO_PARTAGEE * e) * (1 + marge);
      } else {
        produit = op.volume * (1 + marge);
      }
      if (w === op.semaines[0]) formats += 1;
      promoDemande += demande;
      promoProduit += produit;
      const manque = Math.max(0, demande - produit);
      promoManque += manque;
      cassePromo += Math.max(0, produit - demande);
      if (op.enseigne === "celtis") {
        promoCeltis += demande;
        promoManqueCeltis += manque;
      } else {
        promoManqueOpaline += manque;
      }
    }

    // Les imprévus qui ajoutent de la casse ou des commandes.
    let casseImprevu = 0;
    let surprise = 0;
    let capaciteImprevu = 1;
    for (const a of actifs) {
      casseImprevu += a.imprevu.effet.casse ?? 0;
      surprise += a.imprevu.effet.surprise ?? 0;
      capaciteImprevu *= a.imprevu.effet.capacite ?? 1;
    }
    const casseAutre = (dA + dC) * CASSE_AUTRE + casseImprevu;

    // La charge des lignes.
    const changements = REFS.A.nombre / cov.A + refsC / cov.C;
    const production =
      dA +
      dC +
      casseSeries +
      cassePrevision +
      casseAutre +
      promoProduit +
      construction +
      surprise / 2;
    const heures =
      production / CADENCE +
      (changements * CHANGEMENT.minutes) / 60 +
      (formats * FORMAT_PROMO.minutes) / 60;
    const ouvertes = HEURES_OUVERTES * n.dispo * capaciteImprevu;
    const normales = SEUIL_SAMEDI * ouvertes;
    const samediHeures = Math.min(Math.max(0, heures - normales), SAMEDI_MAX * ouvertes);
    const manqueHeures = Math.max(0, heures - normales - SAMEDI_MAX * ouvertes);
    const rupturesCapacite = manqueHeures * CADENCE;
    const ruptures = rupturesStock + rupturesCapacite + promoManque + surprise / 2;

    // Ce que les enseignes reçoivent, et les pénalités.
    const ordinaire = dA + dC;
    const partRupture = (e: Enseigne) =>
      PARTS[e] * (rupturesStock + rupturesCapacite * (ordinaire / (ordinaire + promoDemande)));
    const commandeCeltis = PARTS.celtis * ordinaire + promoCeltis;
    const manqueCeltis =
      partRupture("celtis") +
      promoManqueCeltis +
      rupturesCapacite * (promoCeltis / (ordinaire + promoDemande));
    const opalineCommande = PARTS.opaline * ordinaire + (promoDemande - promoCeltis) + surprise;
    const manqueOpaline = partRupture("opaline") + promoManqueOpaline + surprise / 2;
    const penalites =
      penalite(commandeCeltis, manqueCeltis) +
      penalite(opalineCommande, manqueOpaline) +
      penalite(PARTS.proxival * ordinaire, partRupture("proxival"));
    const serviceCeltis = 1 - manqueCeltis / commandeCeltis;
    servicesCeltis.push(serviceCeltis);

    // La marge des ventes.
    const venduOrdinaire =
      ordinaire - rupturesStock - rupturesCapacite * (ordinaire / (ordinaire + promoDemande));
    const venduPromo =
      promoDemande - promoManque - rupturesCapacite * (promoDemande / (ordinaire + promoDemande));
    const venduSurprise = surprise / 2;
    const ca = venduOrdinaire * PRIX + (venduPromo + venduSurprise) * PRIX_PROMO;
    const marge = venduOrdinaire * MCV + (venduPromo + venduSurprise) * MCV_PROMO;

    // La casse, et ce que les surplus deviennent.
    const cassePots = casseSeries + cassePrevision + cassePromo + casseAutre;
    const consommable = (cassePots - casseImprevu) * CONSOMMABLE;
    const destination =
      w <= 4
        ? d1 === 0
          ? "destockage"
          : "destruction"
        : d3 === 1
          ? "destockage"
          : d3 === 2
            ? "don"
            : "destruction";
    let recupere = 0;
    let destocke = 0;
    let donne = 0;
    let detruit = cassePots;
    if (destination === "destockage") {
      destocke = consommable * PART_MARQUE;
      recupere = destocke * PRIX * DESTOCKAGE.prix;
      detruit = cassePots - destocke;
    } else if (destination === "don") {
      donne = Math.min(consommable, CAPACITE_DON);
      recupere = donne * VALEUR_DON;
      detruit = cassePots - donne;
    }
    destockeCumule += destocke;
    const casseNette =
      cassePots * COUT_VARIABLE +
      detruit * DESTRUCTION -
      recupere +
      (d3 === 2 && w === 5 ? DON.convention : 0);

    // Ce que coûtent les changements, les samedis et les décisions.
    const coutChangements = changements * CHANGEMENT.cout + formats * FORMAT_PROMO.cout;
    const samedis = samediHeures * COUT_HEURE_SAMEDI;
    let decisions = 0;
    if (d2 === 0 && w >= 3)
      decisions += PARTENARIAT.previsionniste + (w === 3 ? PARTENARIAT.mise : 0);
    if (d6 === 0 && w >= 12) decisions += AUTOMNE.picCout / 2;
    if (compensation && w >= (semaineCompensation ?? 99)) decisions += COMPENSATION_SEMAINE;

    // Opaline réagit au déstockage, en fin de semaine 8.
    if (w === 8 && !compensation && h.uOpaline < chanceDeCompensation(destockeCumule)) {
      compensation = true;
      semaineCompensation = 10;
    }
    // Celtis réagit au taux de service, en fin de semaine 9.
    if (w === 9) {
      const moyenne = servicesCeltis.slice(4, 9).reduce((s, x) => s + x, 0) / 5;
      if (moyenne < DEREFERENCEMENT.seuil && h.uDeref < DEREFERENCEMENT.chance)
        dereferencement = true;
    }

    const resultat =
      marge -
      casseNette -
      penalites -
      coutChangements -
      samedis -
      decisions -
      (w === 1 ? perte : 0);
    semaines.push({
      casse: cassePots / (ordinaire + promoDemande),
      cassePots,
      serviceCeltis,
      charge: heures / (HEURES_OUVERTES * n.dispo * capaciteImprevu),
      changements: changements + formats,
      penalites,
      resultat,
      ca,
      commandes: ordinaire + promoDemande,
      marge,
      casseNette,
      coutChangements,
      samedis,
      ruptures,
      destocke,
      donne,
      casseSeries,
      cassePromo,
      cassePrevision,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const somme = (f: (s: Semaine) => number) => pleines.reduce((x, s) => x + f(s), 0);
  const trimestre = somme((s) => s.resultat);
  const plan = SERIES[d1 ?? 3]!;
  const seriesLongues = plan.A >= SERIES[3]!.A;
  const nonConforme = lotNonConforme(chemin, graine);
  const effets = {
    partenariat: accepte ? PARTENARIAT.suite : 0,
    marque: -somme((s) => s.destocke) * DESTOCKAGE.erosion,
    dereferencement: dereferencement ? -DEREFERENCEMENT.cout : 0,
    automne:
      d6 === 0
        ? valeurPointDeCasse(accepte ? AUTOMNE.picPartage : AUTOMNE.pic) - AUTOMNE.picCout / 2
        : d6 === 1
          ? -valeurPointDeCasse(
              seriesLongues ? AUTOMNE.coutUnitaireDejaLongues : AUTOMNE.coutUnitaire,
            )
          : d6 === 2
            ? valeurPointDeCasse(AUTOMNE.dlcGain) - (nonConforme ? AUTOMNE.dlcRetrait : 0)
            : 0,
    lineaire: d4 === 2 ? -ARRET.lineaire : 0,
  };
  // La compensation d'Opaline court sur deux mois : ce qui reste après la semaine 13.
  const compensationSuite = compensation
    ? -(COMPENSATION.semaines - (SEMAINES - (semaineCompensation ?? SEMAINES) + 1)) *
      COMPENSATION_SEMAINE
    : 0;
  const suite =
    effets.partenariat +
    effets.marque +
    effets.dereferencement +
    effets.automne +
    effets.lineaire +
    compensationSuite;
  effets.marque += compensationSuite;
  const ca = somme((s) => s.ca);
  return {
    semaines,
    objectif: trimestre + suite,
    trimestre,
    suite,
    ca,
    marge: somme((s) => s.marge),
    casseTaux: somme((s) => s.cassePots) / somme((s) => s.commandes),
    casseNette: somme((s) => s.casseNette),
    penalites: somme((s) => s.penalites),
    coutChangements: somme((s) => s.coutChangements),
    samedis: somme((s) => s.samedis),
    serviceCeltis: servicesCeltis.reduce((s, x) => s + x, 0) / SEMAINES,
    celtisAccepte: accepte,
    compensation,
    semaineCompensation,
    dereferencement,
    lotNonConforme: nonConforme,
    destocke: somme((s) => s.destocke),
    donne: somme((s) => s.donne),
    rentree: h.promos.rentree!,
    lotEconomique: LOT_ECONOMIQUE_REFERENCE,
    effets,
  };
}

/** Juillet monte avec la chaleur, août baisse avec les congés, la rentrée repart. */
export const SAISON = [
  0, 1.04, 1.06, 1.07, 1.05, 1.0, 0.95, 0.94, 0.96, 1.02, 1.05, 1.07, 1.06, 1.05,
] as const;

/* ---------------------------------------------------------------------------
 * CE QUE LES SOURCES DONNENT : la casse du printemps, par cause.
 * ------------------------------------------------------------------------- */

/** E[(1 − m)⁺] pour m ~ N(1, σ) : la part d'une promotion produite en trop, en moyenne. */
export const SURPLUS_PROMO_MOYEN = ERREUR_PROMO / Math.sqrt(2 * Math.PI);

/**
 * La casse d'une semaine moyenne du printemps, par cause, en milliers de pots : le plan
 * actuel (séries de dix jours et de trois semaines), les promotions produites sur
 * l'historique, sans hasard. C'est ce que la décomposition de la semaine 1 donne.
 */
export function decomposition() {
  const cov = SERIES[3]!;
  const series =
    VOLUME.A * tauxCasseSerie("A", cov.A, REFS.A.securite) +
    VOLUME.C * tauxCasseSerie("C", cov.C, REFS.C.securite);
  const seriesC = VOLUME.C * tauxCasseSerie("C", cov.C, REFS.C.securite);
  const prevision =
    VOLUME.C *
    CASSE_EXCES_C *
    excesEtManque(erreurSerie(REFS.C.erreur, cov.C), REFS.C.securite).exces;
  const volumePromo = OPERATIONS.reduce((x, op) => x + 2 * op.volume, 0) / SEMAINES;
  const promo = volumePromo * SURPLUS_PROMO_MOYEN;
  const autre = VOLUME_TOTAL * CASSE_AUTRE;
  const total = series + prevision + promo + autre;
  return {
    series,
    promo,
    prevision,
    autre,
    total,
    taux: total / (VOLUME_TOTAL + volumePromo),
    /** La part des faibles rotations dans la casse, et dans les volumes. */
    partC: (seriesC + prevision) / total,
    volumeC: VOLUME.C / VOLUME_TOTAL,
  };
}

/* ---------------------------------------------------------------------------
 * CE QUI ARRIVE, ET CE QUE LE TABLEAU DE BORD MONTRE.
 * ------------------------------------------------------------------------- */

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    t,
    partenariat: t.celtisAccepte && dans(PARTENARIAT.debut),
    compensation: t.compensation && dans(9),
    dereferencement: t.dereferencement && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** Le budget du trimestre : la marge nette que la direction attend des produits frais de Loudéac. */
export const BUDGET = 2280000;

export interface LectureDlc {
  casse: number | null;
  serviceCeltis: number | null;
  charge: number | null;
  penalites: number | null;
  resultat: number | null;
  budgetADate: number | null;
  /** Ce que les messages lisent : la casse en pots, Celtis, la promotion de rentrée. */
  cassePots: number | null;
  partenariat: number | null;
  rentree: number | null;
  samedis: number | null;
}

/** Ce qu'Ysée lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDlc {
  if (semaine === 0) {
    return {
      casse: CASSE_DEPART,
      serviceCeltis: SERVICE_CELTIS_DEPART,
      charge: 0.86,
      penalites: 0,
      resultat: 0,
      budgetADate: 0,
      cassePots: decomposition().total,
      partenariat: null,
      rentree: null,
      samedis: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const jusque = t.semaines.slice(1, semaine + 1) as Semaine[];
  return {
    casse: s.casse,
    serviceCeltis: s.serviceCeltis,
    charge: s.charge,
    penalites: jusque.reduce((x, w) => x + w.penalites, 0),
    resultat: jusque.reduce((x, w) => x + w.resultat, 0),
    budgetADate: (BUDGET * semaine) / SEMAINES,
    cassePots: s.cassePots,
    partenariat: decisions.length > D.celtis ? (t.celtisAccepte ? 1 : 0) : null,
    rentree: semaine >= 12 ? t.rentree : null,
    samedis: jusque.reduce((x, w) => x + w.samedis, 0),
  };
}
