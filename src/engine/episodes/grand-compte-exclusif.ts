/**
 * LE GRAND COMPTE QUI VEUT L'EXCLUSIVITÉ — le modèle du contrat-cadre Sarlève.
 *
 * Le groupe Sarlève, entreprise générale de construction, propose à Arvel
 * Distribution un contrat-cadre de trois ans pour ses chantiers de la région
 * Lyon-Rhône : 5 M€ de chiffre d'affaires par an, près d'un quart de celui de
 * la région une fois le contrat signé. En échange : des prix serrés, une
 * exclusivité réciproque (Arvel ne livre plus Moulinier Construction ni
 * Batival, ses deux concurrents directs), un stock dédié, une cellule dédiée
 * et soixante jours de délai de paiement au lieu de trente. Kenji Lefranc,
 * directeur commercial grands comptes, décide de la réponse et la porte au
 * comité de direction. Treize semaines, six décisions.
 *
 * La valeur d'un contrat de trois ans se joue sur des années ; un épisode dure
 * un trimestre. Le trimestre est donc jugé sur la VALEUR CRÉÉE ESTIMÉE en
 * semaine 13 : la valeur actuelle, au taux de 8 % du groupe, de tout ce que
 * les décisions du trimestre ont engagé — la contribution du contrat année par
 * année (marge sur coût variable, remises des fabricants, moins la cellule
 * dédiée, le crédit client et le portage du stock), la marge perdue chez les
 * clients exclus pendant l'exclusivité et le temps de les reconquérir, la
 * décote du stock dédié qu'on ne peut plus écouler, l'extension éventuelle à
 * la filiale iséroise —, recalculée avec ce que le trimestre a révélé : la
 * réponse de Sarlève, le chantier suspendu, les imprévus, puis, en semaine 12,
 * le carnet de commandes du groupe. Le point zéro est le statu quo : pas de
 * contrat, et personne d'autre ne l'emporte. Laisser le contrat à Lestrade
 * Négoce n'est pas neutre : le concurrent en sort renforcé et le fait payer
 * aux agences. Le hasard porte sur ce que le trimestre révèle, jamais sur les
 * règles du calcul.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE VOLUME A UN PRIX QUI NE FIGURE PAS DANS L'OFFRE. Aux conditions
 *     proposées, le contrat apporte 400 k€ de marge sur coût variable et des
 *     remises de fin d'année ; mais la cellule dédiée, le crédit client, le
 *     portage du stock et surtout la marge des deux clients exclus en
 *     reprennent l'essentiel. Et l'exclusivité ne s'arrête pas avec le
 *     contrat : un client parti chez un concurrent ne revient pas le jour où
 *     l'on peut à nouveau le livrer.
 *   · LA DÉPENDANCE DONNE LE POUVOIR AU CLIENT. Un client qui pèse un quart de
 *     la région, des actifs dédiés qu'on ne redéploie pas, des clients
 *     alternatifs perdus : à la revue annuelle des prix, Sarlève sait ce que
 *     la rupture coûterait à Arvel, et demande une baisse. Sans clause
 *     d'indexation, la revue se fait « d'un commun accord », et à défaut
 *     chacun peut résilier ; avec elle, la demande n'a plus de fondement.
 *   · LE RISQUE DE CONCENTRATION SE BORNE PAR CONTRAT, ET SE RÉVISE. Si le
 *     groupe réduit son activité, le volume baisse, mais pas la cellule ni le
 *     stock dédié. Un engagement de volume minimal, la reprise du stock dédié
 *     par le client, une exclusivité limitée dans le temps bornent la perte ;
 *     un signal (un chantier suspendu, une note dégradée) doit faire réviser
 *     l'engagement, pas le confirmer. Refuser par principe n'est pas une
 *     protection : c'est donner le contrat au concurrent.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe. */
export const TAUX = 0.08;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'acheteur de Sarlève fait baisser le prix de Lestrade, qu'il vous opposera. */
export const PERTE_PAR_JOUR = 1500;
/** La valeur que la direction générale attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 200000;

/** La région Lyon-Rhône : six agences, son chiffre d'affaires de l'an dernier. */
export const REGION = { ca: 18_000_000, agences: 6 } as const;

/** Le contrat-cadre tel que Sarlève le propose, par an. */
export const CONTRAT = {
  ca: 5_000_000,
  annees: 3,
  /** Le taux de marge sur coût variable aux prix proposés. */
  tauxMarge: 0.08,
  /** La cellule dédiée : un chargé d'affaires, deux préparateurs, un camion-grue loué, une zone du dépôt. */
  cellule: 150_000,
  /** Les remises de fin d'année des fabricants : les achats de la région franchissent trois paliers. */
  remises: 40_000,
  /** Le délai de paiement demandé, et celui des grands comptes d'Arvel aujourd'hui, en jours. */
  delai: 60,
  delaiHabituel: 30,
  tva: 0.2,
  /** Le coût du financement à court terme du groupe. */
  financement: 0.05,
  /** Le stock dédié demandé avant les premières livraisons, et son coût de portage annuel. */
  stock: 400_000,
  portage: 0.08,
} as const;

/** Les deux concurrents directs de Sarlève, clients d'Arvel, que l'exclusivité oblige à ne plus livrer. */
export const EXCLUS = { moulinier: 500_000, batival: 300_000, taux: 0.11 } as const;
export const MARGE_EXCLUS = (EXCLUS.moulinier + EXCLUS.batival) * EXCLUS.taux;

/** Ce que coûte un délai de paiement plus long : les créances en plus, TTC, financées au taux du groupe. */
export const creditClient = (ca: number, financement: number = CONTRAT.financement) =>
  ((ca * (1 + CONTRAT.tva) * (CONTRAT.delai - CONTRAT.delaiHabituel)) / 360) * financement;

/** La contribution annuelle du contrat aux conditions proposées : ce que la semaine 1 demande. */
export const CONTRIBUTION_PROPOSEE =
  CONTRAT.ca * CONTRAT.tauxMarge -
  CONTRAT.cellule +
  CONTRAT.remises -
  creditClient(CONTRAT.ca) -
  CONTRAT.stock * CONTRAT.portage -
  MARGE_EXCLUS;

/** La part de Sarlève dans le chiffre d'affaires de la région, contrat signé, clients exclus partis. */
export const partDeSarleve = (caSarleve: number, exclus = EXCLUS.moulinier + EXCLUS.batival) =>
  caSarleve / (REGION.ca - exclus + caSarleve);

/**
 * LA CONTRE-PROPOSITION : exclusivité limitée à deux ans, indexation des
 * prix sur l'indice des matériaux, engagement de volume minimal à 75 % (la
 * marge manquante en dessous est compensée), reprise du stock dédié au prix
 * coûtant si les volumes baissent ou en fin de contrat. Sarlève demande en
 * échange un demi-point de prix.
 */
export const CLAUSES = { concession: 0.005, exclusivite: 2, volumeMinimal: 0.75 } as const;
/** Sans exclusivité, Sarlève veut un point de prix de plus. */
export const SANS_EXCLUSIVITE = { concession: 0.01 } as const;
/** S'il revient après avoir consulté Lestrade, il a son devis en main : 0,3 point de plus. */
export const PLUS_TARD = { concession: 0.003, signature: 6 } as const;
/** La semaine où Sarlève répond, et où le contrat est signé s'il accepte. */
export const SIGNATURE = 2;

/** Ce que fait Sarlève d'une contre-proposition : il accepte, il revient plus tard, ou il signe avec Lestrade. */
export const REACTION = {
  clauses: { accepte: 0.6, plusTard: 0.35 },
  sansExclusivite: { accepte: 0.15, plusTard: 0.2 },
} as const;

/**
 * LE CARNET DE COMMANDES DU GROUPE, révélé en semaine 12 : le volume de
 * chaque année du contrat, rapporté au volume annoncé ; et celui de la
 * filiale iséroise, plus exposée.
 */
export const SCENARIOS = [
  {
    id: "solide",
    nom: "Carnet solide",
    chance: 0.5,
    volumes: [1, 1, 1],
    filiale: [1, 1, 1],
  },
  {
    id: "tassement",
    nom: "Activité en tassement",
    chance: 0.3,
    volumes: [0.95, 0.75, 0.7],
    filiale: [0.8, 0.4, 0.3],
  },
  {
    id: "retournement",
    nom: "Retournement",
    chance: 0.2,
    volumes: [0.85, 0.5, 0.4],
    filiale: [0.6, 0.2, 0.15],
  },
] as const;
export const REVELATION = 12;

/** Le chantier de la ZAC des Vergnes, suspendu en semaine 7 : 8 % du volume de la première année, 15 % du stock dédié. */
export const SUSPENSION = { semaine: 7, volume: 0.08, stock: 0.15 } as const;

export const STOCK = {
  /** Constitué par tranches sur les commandes fermes : un stock de sécurité de 200 k€. */
  tranches: 200_000,
  /** Des commandes plus fréquentes aux fabricants, par an. */
  surcoutTranches: 4_000,
  /** En dépôt chez les fabricants : 2,5 points de remise perdus sur 1,8 M€ d'achats par an. */
  consignation: { achats: 1_800_000, remise: 0.025 },
  /** Le stock dédié en trop s'écoule avec 35 % de décote ; en fin de contrat, le reste avec 15 %. */
  decote: 0.35,
  decoteFin: 0.15,
  /** Les frais de retour aux fabricants du stock d'un chantier suspendu. */
  retour: 0.1,
} as const;
/** Constitué par tranches, le stock manque une fois sur trois sur un chantier : pénalités de retard. */
export const RUPTURE = { chance: 0.35, penalite: 10_000, semaine: 9 } as const;

/**
 * LE RETOUR DES CLIENTS EXCLUS, une fois l'exclusivité finie : la marge
 * perdue en plus, en années de marge. Préparé, il est rapide ; sinon, il
 * faut les reconquérir sur Lestrade, et d'autant plus lentement qu'ils y sont
 * restés longtemps.
 */
export const RETOUR = { sec: 0.8, prepare: 0.15, longue: 1.3, cout: 6_000 } as const;
/** Une campagne de conquête d'autres entreprises générales : un client gagné quatre fois sur dix. */
export const CONQUETE = { cout: 30_000, chance: 0.4, marge: 40_000, semaine: 10 } as const;

/** L'extension à Sarlève Dauphiné : 1,5 M€ par an, un entrepôt en bail ferme de trois ans à Bourgoin. */
export const EXTENSION = {
  ca: 1_500_000,
  remises: 12_000,
  bail: 60_000,
  amenagement: 40_000,
  /** Livrée à partir du printemps : les trois quarts de la première année. */
  premiereAnnee: 0.75,
  /** Un entrepôt en bail ferme qui ne sert plus se sous-loue à moitié prix. */
  sousLocation: 0.5,
} as const;
/** L'analyse du carnet de commandes et des comptes de Sarlève : son coût, et la chance qu'elle conclue « solide » selon la réalité. */
export const ANALYSE = { cout: 6_000, favorable: [0.85, 0.25, 0.05] } as const;

/** Réviser l'engagement après le signal : la cellule suit le volume, le stock les commandes fermes. */
export const REVISION = { plancherCellule: 0.6, reorganisation: 10_000, stockSuivi: 0.3 } as const;

/**
 * LA REVUE ANNUELLE DES PRIX : Sarlève demande un point de baisse pour les
 * années 2 et 3. La chance qu'il résilie si Arvel échange ou tient son prix,
 * avec et sans clause d'indexation.
 */
export const REVUE = {
  baisse: 0.01,
  echange: 0.004,
  plancher: 0.85,
  resiliation: { echange: [0.05, 0.3], tenir: [0.2, 0.55] },
} as const;
/** Ce que Lestrade, renforcé par le contrat Sarlève, prend chaque année aux agences d'Arvel. */
export const LESTRADE = { perte: 30_000 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  reponse: 0,
  stock: 1,
  exclus: 2,
  extension: 3,
  signal: 4,
  revue: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 8, 11] as const;

/** Ne rien changer, décision par décision : décliner, ce que Sarlève demande, refuser l'extension, tenir. */
export const NEUTRE = [3, 0, 0, 1, 0, 1] as const;
/** Ce que l'estimation suppose tant qu'une décision n'a pas pris effet : le contrat tel que proposé. */
const DEFAUT = [3, 0, 0, 1, 0, -1] as const;

/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux = TAUX) => (1 - (1 + taux) ** -n) / taux;
const actu = (annees: number) => (1 + TAUX) ** -annees;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: {
    /** Points de marge perdus sur la première année, sans clause d'indexation. */
    indice?: number;
    /** Pénalités de livraison sur les chantiers, contrat en cours. */
    transport?: number;
    /** Remises de fin d'année perdues, par an. */
    remises?: number;
    /** Le nouveau coût du financement à court terme. */
    financement?: number;
    /** Marge perdue par les agences, et en plus si Lestrade a le contrat. */
    depot?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "indice",
    titre: "L'indice des matériaux prend 3 %",
    de: "Rosalie Fontenay",
    role: "Directrice administrative et financière",
    texte:
      "L'indice des prix des matériaux du bâtiment a pris 3 % en un mois : acier, isolants, plâtre. Les fabricants répercutent tout de suite ; nos prix de contrat, eux, ne bougent que si une clause le prévoit.",
    effet: { indice: 0.006 },
  },
  {
    id: "transport",
    titre: "Grève chez le transporteur régional",
    de: "Oumou Sylla",
    role: "Responsable du dépôt de Corbas",
    texte:
      "Le transporteur qui assure nos livraisons sur chantier est en grève depuis lundi : une semaine de livraisons décalées, et les pénalités de retard des contrats qui vont avec.",
    effet: { transport: 8_000 },
  },
  {
    id: "paliers",
    titre: "Un fabricant relève ses paliers de remise",
    de: "Wen Zhao",
    role: "Contrôleuse de gestion commerciale",
    texte:
      "Le fabricant de plaques de plâtre relève ses paliers de remise de fin d'année de 10 % : même avec le volume de Sarlève, nous en perdons un. 10 k€ de remises en moins par an.",
    effet: { remises: 10_000 },
  },
  {
    id: "taux",
    titre: "La banque relève le coût du crédit court terme",
    de: "Rosalie Fontenay",
    role: "Directrice administrative et financière",
    texte:
      "Notre banque relève le coût de nos lignes de crédit court terme : 6 % au lieu de 5 %. Tout ce que nous finançons, créances et stocks, coûte un point de plus.",
    effet: { financement: 0.06 },
  },
  {
    id: "depot",
    titre: "Lestrade ouvre un dépôt à Vénissieux",
    de: "Eliott Brasseur",
    role: "Directeur régional Lyon-Rhône",
    texte:
      "Lestrade Négoce ouvre un dépôt à Vénissieux, à dix minutes de notre agence. Les artisans de l'Est lyonnais vont être sollicités : comptons 20 k€ de marge perdue sur l'année.",
    effet: { depot: 20_000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart des commandes de Sarlève de chaque semaine, autour du rythme annoncé (indices 1 à 13). */
  bruit: readonly number[];
  /** Le carnet de commandes du groupe : 0 solide, 1 tassement, 2 retournement. */
  scenario: number;
  /** La réponse de Sarlève à une contre-proposition. */
  uReaction: number;
  /** L'analyse du carnet conclut-elle « solide » ? */
  uAnalyse: number;
  /** La campagne de conquête gagne-t-elle un client ? */
  uConquete: number;
  /** Le stock par tranches manque-t-il sur un chantier ? */
  uRupture: number;
  /** Sarlève résilie-t-il à la revue des prix ? */
  uRevue: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000409 + 7);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.07 * gauss(r), -0.18, 0.18));
  const us = r();
  const scenario =
    us < SCENARIOS[0].chance ? 0 : us < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const uReaction = r();
  const uAnalyse = r();
  const uConquete = r();
  const uRupture = r();
  const uRevue = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    scenario,
    uReaction,
    uAnalyse,
    uConquete,
    uRupture,
    uRevue,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

export type Statut = "signe" | "plusTard" | "lestrade";

/** Ce que Sarlève fait de la réponse d'Arvel. */
export function statut(chemin: readonly number[], graine: number): Statut {
  const d1 = chemin[D.reponse];
  if (d1 === 0) return "signe";
  if (d1 === 3) return "lestrade";
  const p = d1 === 1 ? REACTION.clauses : REACTION.sansExclusivite;
  const u = hasard(graine).uReaction;
  return u < p.accepte ? "signe" : u < p.accepte + p.plusTard ? "plusTard" : "lestrade";
}

/** La semaine de la signature, ou rien. */
export const semaineDeSignature = (chemin: readonly number[], graine: number) => {
  const s = statut(chemin, graine);
  return s === "signe" ? SIGNATURE : s === "plusTard" ? PLUS_TARD.signature : null;
};

/** L'analyse du carnet conclut-elle que le groupe est solide ? */
export const analyseFavorable = (graine: number) => {
  const h = hasard(graine);
  return h.uAnalyse < ANALYSE.favorable[h.scenario]!;
};

/** La chance d'une conclusion favorable, et ce qu'elle dit du carnet : la loi de Bayes. */
export function posterieur(favorable: boolean): number[] {
  const p = SCENARIOS.map(
    (s, i) => s.chance * (favorable ? ANALYSE.favorable[i]! : 1 - ANALYSE.favorable[i]!),
  );
  const total = p.reduce((a, b) => a + b, 0);
  return p.map((x) => x / total);
}

export const conqueteReussie = (graine: number) => hasard(graine).uConquete < CONQUETE.chance;
export const ruptureDeStock = (graine: number) => hasard(graine).uRupture < RUPTURE.chance;

/** La chance que Sarlève résilie à la revue des prix, selon la réponse d'Arvel et la clause d'indexation. */
export function chanceDeResiliation(d6: number, indexation: boolean): number {
  if (d6 === 0) return 0;
  const p = d6 === 2 ? REVUE.resiliation.echange : REVUE.resiliation.tenir;
  return p[indexation ? 0 : 1]!;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/* ---------------------------------------------------------------------------
 * LA VALEUR DU CONTRAT, POUR UN CARNET DE COMMANDES DONNÉ.
 * ------------------------------------------------------------------------- */

/** Tout ce que la valeur du contrat lit des décisions et de ce que le trimestre a révélé. */
export interface Engagement {
  concession: number;
  /** La durée de l'exclusivité, en années ; 0 sans exclusivité. */
  exclusivite: number;
  volumeMinimal: boolean;
  indexation: boolean;
  reprise: boolean;
  /** Le stock dédié possédé par Arvel, et comment il est tenu. */
  stock: number;
  tranches: boolean;
  consignation: boolean;
  /** Les clients exclus : 0 courrier, 1 conquête, 2 retour préparé. */
  exclus: number;
  /** La conquête : réussie (1), ratée (0), pas encore connue (sa chance). */
  conquete: number;
  /** L'extension : acceptée (1), refusée (0). */
  extension: number;
  suspension: boolean;
  revise: boolean;
  /** Seul le complément de stock est gelé : la cellule reste au complet. */
  partiel: boolean;
  /** La baisse de prix consentie à la revue, en points, et le plancher de volume obtenu en échange. */
  baisse: number;
  plancherRevue: boolean;
  /** Les imprévus déjà tombés. */
  indice: number;
  remisesPerdues: number;
  financement: number;
}

export interface Valeur {
  total: number;
  /** La contribution du contrat, année par année, actualisée. */
  contrat: number;
  /** La marge perdue chez Moulinier et Batival, pendant et après l'exclusivité. */
  exclus: number;
  /** La décote du stock dédié qu'on ne peut plus écouler. */
  stock: number;
  extension: number;
  /** Les dépenses du trimestre : retour de stock, conquête, préparation, indemnités. */
  depenses: number;
}

/**
 * CE QUE VAUT L'EXTENSION À SARLÈVE DAUPHINÉ pour un carnet donné : la marge
 * de la filiale, moins un entrepôt en bail ferme de trois ans qui court même
 * si le contrat s'arrête (sous-loué à moitié prix), et son aménagement.
 */
export function valeurDeLExtension(
  s: number,
  o: { concession: number; baisse?: number; fin?: number; financement?: number },
): number {
  const sc = SCENARIOS[s]!;
  const fin = o.fin ?? CONTRAT.annees;
  let valeur = -EXTENSION.amenagement;
  for (let y = 1; y <= CONTRAT.annees; y += 1) {
    const part = y === 1 ? EXTENSION.premiereAnnee : 1;
    const v = sc.filiale[y - 1]!;
    let flux = -EXTENSION.bail * part;
    if (y <= fin) {
      const tx = CONTRAT.tauxMarge - o.concession - (y >= 2 ? (o.baisse ?? 0) : 0);
      flux +=
        part *
        (EXTENSION.ca * tx * v +
          EXTENSION.remises * v -
          creditClient(EXTENSION.ca * v, o.financement ?? CONTRAT.financement));
    } else {
      flux += EXTENSION.bail * EXTENSION.sousLocation;
    }
    valeur += flux * actu(y);
  }
  return valeur;
}

/** La valeur du contrat pour un carnet donné, résilié ou non au terme de la première année. */
export function valeurPour(e: Engagement, s: number, resilie: boolean): Valeur {
  const sc = SCENARIOS[s]!;
  const fin = resilie ? 1 : CONTRAT.annees;
  const vol = (y: number) => sc.volumes[y - 1]! - (y === 1 && e.suspension ? SUSPENSION.volume : 0);
  const allege = e.revise || e.partiel;
  const stockGarde = allege ? e.stock * (1 - SUSPENSION.stock) : e.stock;

  let contrat = 0;
  for (let y = 1; y <= fin; y += 1) {
    const v = vol(y);
    let plancher = e.volumeMinimal ? CLAUSES.volumeMinimal : 0;
    if (y >= 2 && e.plancherRevue) plancher = Math.max(plancher, REVUE.plancher);
    const tx =
      CONTRAT.tauxMarge -
      e.concession -
      (y >= 2 ? e.baisse : 0) -
      (y === 1 && !e.indexation ? e.indice : 0);
    const marge = CONTRAT.ca * tx * Math.max(v, plancher);
    const remises = CONTRAT.remises * v - e.remisesPerdues;
    const credit = creditClient(CONTRAT.ca * v, e.financement);
    const cellule =
      e.revise && y >= 2
        ? CONTRAT.cellule * Math.max(REVISION.plancherCellule, v)
        : CONTRAT.cellule;
    const portage = stockGarde * (CONTRAT.portage + e.financement - CONTRAT.financement);
    const consignation = e.consignation
      ? STOCK.consignation.achats * STOCK.consignation.remise * v
      : 0;
    const tranches = e.tranches ? STOCK.surcoutTranches : 0;
    contrat += (marge + remises - credit - cellule - portage - consignation - tranches) * actu(y);
  }

  // Les clients exclus : la marge perdue pendant l'exclusivité, puis le temps de les reconquérir.
  let exclus = 0;
  const finExclusivite = Math.min(e.exclusivite, fin);
  for (let y = 1; y <= Math.ceil(finExclusivite); y += 1) {
    exclus -= MARGE_EXCLUS * Math.min(1, finExclusivite - (y - 1)) * actu(y);
  }
  if (e.exclusivite > 0) {
    const lent = e.exclusivite >= CONTRAT.annees && fin === CONTRAT.annees ? RETOUR.longue : 1;
    const annees = e.exclus === 2 ? RETOUR.prepare : RETOUR.sec;
    exclus -= MARGE_EXCLUS * annees * lent * actu(finExclusivite + 1);
  }
  if (e.exclusivite > 0 && e.exclus === 1) {
    exclus += e.conquete * CONQUETE.marge * annuite(CONTRAT.annees);
  }

  // Le stock dédié : l'excédent quand le volume baisse, le reste en fin de contrat, sauf reprise.
  let stock = 0;
  if (!e.reprise && stockGarde > 0) {
    if (fin >= 2) {
      const exces = Math.max(0, 1 - vol(2)) * (allege ? REVISION.stockSuivi : 1);
      stock -= stockGarde * exces * STOCK.decote * actu(1);
    }
    const decote = fin < CONTRAT.annees ? STOCK.decote : STOCK.decoteFin;
    stock -= stockGarde * Math.min(1, vol(fin)) * decote * actu(fin);
  }

  // L'extension à la filiale iséroise : le bail court, que le contrat dure ou non.
  const extension = e.extension
    ? valeurDeLExtension(s, {
        concession: e.concession,
        baisse: e.baisse,
        fin,
        financement: e.financement,
      })
    : 0;

  // Sarlève parti chez Lestrade au terme de la première année : le concurrent renforcé.
  if (fin < CONTRAT.annees) {
    for (let y = fin + 1; y <= CONTRAT.annees; y += 1) contrat -= LESTRADE.perte * actu(y);
  }

  return {
    total: contrat + exclus + stock + extension,
    contrat,
    exclus,
    stock,
    extension,
    depenses: 0,
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export interface Estimation extends Valeur {
  /** La valeur du contrat sous chaque carnet de commandes, telle qu'on la voit cette semaine. */
  parScenario: readonly number[];
  /** Le poids donné à chaque carnet cette semaine. */
  poids: readonly number[];
  signe: boolean;
  stockDedie: number;
  /** L'engagement tel qu'on le connaît cette semaine ; rien sans contrat. */
  engagement: Engagement | null;
}

/** Ce que l'on sait en fin de semaine w ; le reste est pris aux conditions proposées. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const opt = (k: number) => (w >= EFFET[k]! ? chemin[k]! : DEFAUT[k]!);
  const tombe = (id: string) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= w;
  };
  let depenses = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  if (tombe("depot")) depenses += IMPREVUS.find((i) => i.id === "depot")!.effet.depot!;
  const vide = (lestrade: boolean, signe: boolean): Estimation => {
    const perte = lestrade
      ? LESTRADE.perte * annuite(CONTRAT.annees) +
        (tombe("depot") ? IMPREVUS.find((i) => i.id === "depot")!.effet.depot! / 2 : 0)
      : 0;
    return {
      total: 0 - depenses - perte,
      contrat: 0 - perte,
      exclus: 0,
      stock: 0,
      extension: 0,
      depenses,
      parScenario: SCENARIOS.map(() => 0 - perte),
      poids: SCENARIOS.map((s) => s.chance),
      signe,
      stockDedie: 0,
      engagement: null,
    };
  };
  if (w < EFFET[D.reponse]) return vide(false, false);
  const st = statut(chemin, graine);
  if (st === "lestrade") return vide(true, false);
  const signature = st === "signe" ? SIGNATURE : PLUS_TARD.signature;

  const d1 = chemin[D.reponse]!;
  const d2 = opt(D.stock);
  const d3 = opt(D.exclus);
  const d4 = opt(D.extension);
  const d5 = opt(D.signal);
  const d6 = opt(D.revue);
  const clauses = d1 === 1;
  const concession =
    (d1 === 1 ? CLAUSES.concession : d1 === 2 ? SANS_EXCLUSIVITE.concession : 0) +
    (st === "plusTard" ? PLUS_TARD.concession : 0);
  const stock = d2 === 0 ? CONTRAT.stock : d2 === 2 ? STOCK.tranches : 0;
  const exclusivite = d1 === 2 ? 0 : clauses ? CLAUSES.exclusivite : CONTRAT.annees;
  const financement = tombe("taux") ? 0.06 : CONTRAT.financement;
  const suspension = w >= SUSPENSION.semaine;
  // La conquête ne se lance que s'il y a des clients exclus à compenser.
  const conquete =
    exclusivite > 0 && d3 === 1
      ? w >= CONQUETE.semaine
        ? conqueteReussie(graine)
          ? 1
          : 0
        : CONQUETE.chance
      : 0;
  const analyse = d4 === 2;
  const extension = d4 === 0 || (analyse && analyseFavorable(graine)) ? 1 : 0;
  const revise = d5 === 1 && suspension;
  const partiel = d5 === 2 && suspension;
  const revue = d6 >= 0;
  const baisse = !revue ? 0 : d6 === 0 ? REVUE.baisse : d6 === 2 ? REVUE.echange : 0;
  const resiliationConnue = revue && w >= EFFET[D.revue];
  const resilie = resiliationConnue && hasard(graine).uRevue < chanceDeResiliation(d6, clauses);

  const e: Engagement = {
    concession,
    exclusivite,
    volumeMinimal: clauses,
    indexation: clauses,
    reprise: clauses,
    stock,
    tranches: d2 === 2,
    consignation: d2 === 1,
    exclus: d3,
    conquete,
    extension,
    suspension,
    revise,
    partiel,
    baisse,
    plancherRevue: revue && d6 === 2,
    indice: tombe("indice") ? IMPREVUS.find((i) => i.id === "indice")!.effet.indice! : 0,
    remisesPerdues: tombe("paliers") ? IMPREVUS.find((i) => i.id === "paliers")!.effet.remises! : 0,
    financement,
  };

  // Les dépenses du trimestre, engagées quoi qu'il arrive.
  if (exclusivite > 0 && d3 === 2) depenses += RETOUR.cout;
  if (exclusivite > 0 && d3 === 1) depenses += CONQUETE.cout;
  if (analyse) depenses += ANALYSE.cout;
  if (revise) depenses += REVISION.reorganisation;
  if (revise || partiel) depenses += stock * SUSPENSION.stock * STOCK.retour;
  if (d2 === 2) {
    const sait = w >= RUPTURE.semaine;
    const signeAvant = signature < RUPTURE.semaine;
    if (signeAvant) {
      depenses += sait
        ? ruptureDeStock(graine)
          ? RUPTURE.penalite
          : 0
        : RUPTURE.chance * RUPTURE.penalite;
    }
  }
  const transport = imprevu(h, "transport");
  if (transport && transport.semaine <= w && transport.semaine > signature) {
    depenses += transport.imprevu.effet.transport!;
  }

  // Le poids de chaque carnet : la chance de départ, ce que dit l'analyse, puis le carnet publié.
  let poids: number[] = SCENARIOS.map((s) => s.chance);
  if (w >= REVELATION) poids = SCENARIOS.map((_, i) => (i === h.scenario ? 1 : 0));
  else if (analyse && w >= EFFET[D.extension]) poids = posterieur(analyseFavorable(graine));

  const parScenario = SCENARIOS.map((_, s) => valeurPour(e, s, resilie));
  const somme = (f: (v: Valeur) => number) =>
    parScenario.reduce((acc, v, i) => acc + poids[i]! * f(v), 0);
  const contrat = somme((v) => v.contrat);
  const exclus = somme((v) => v.exclus);
  const stockV = somme((v) => v.stock);
  const ext = somme((v) => v.extension);
  return {
    total: contrat + exclus + stockV + ext - depenses,
    contrat,
    exclus,
    stock: stockV,
    extension: ext,
    depenses,
    parScenario: parScenario.map((v) => v.total),
    poids,
    signe: w >= signature,
    stockDedie:
      w >= Math.max(signature, EFFET[D.stock])
        ? revise || partiel
          ? stock * (1 - SUSPENSION.stock)
          : stock
        : 0,
    engagement: e,
  };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** Les commandes de Sarlève livrées dans la semaine, en euros. */
  commandes: number;
  /** La part de Sarlève dans le chiffre d'affaires de la région, contrat signé. */
  part: number;
  /** Le stock dédié possédé par Arvel. */
  stock: number;
  /** La marge perdue chez Moulinier et Batival depuis le début du trimestre. */
  exclusPerdu: number;
  /** La contribution cumulée du trimestre : marge du contrat moins ce qu'il coûte. */
  marge: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Les décisions jouées. */
  chemin: readonly number[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  statut: Statut;
  signature: number | null;
  scenario: number;
  contrat: number;
  exclus: number;
  stock: number;
  extension: number;
  depenses: number;
  /** L'extension a-t-elle été signée ? */
  etendu: boolean;
  analyse: boolean | null;
  conquete: boolean | null;
  rupture: boolean;
  /** Sarlève a-t-il résilié à la revue des prix ? */
  resilie: boolean;
  stockDedie: number;
  part: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const st = statut(chemin, graine);
  const signature = semaineDeSignature(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const d1 = chemin[D.reponse]!;
  const exclusivite = st !== "lestrade" && d1 !== 2;
  const etendu =
    st !== "lestrade" &&
    (chemin[D.extension] === 0 || (chemin[D.extension] === 2 && analyseFavorable(graine)));
  let avant = 0;
  let fin: Estimation | null = null;
  let exclusPerdu = 0;
  let marge = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    const actif = signature !== null && w > signature;
    let commandes = 0;
    if (actif) {
      commandes =
        (CONTRAT.ca / 52) *
        (1 + h.bruit[w]!) *
        (w >= SUSPENSION.semaine ? 1 - SUSPENSION.volume * 1.5 : 1);
      const concession =
        (d1 === 1 ? CLAUSES.concession : d1 === 2 ? SANS_EXCLUSIVITE.concession : 0) +
        (st === "plusTard" ? PLUS_TARD.concession : 0);
      marge += commandes * (CONTRAT.tauxMarge - concession) - CONTRAT.cellule / 52;
    }
    if (actif && exclusivite) {
      exclusPerdu += MARGE_EXCLUS / 52;
      marge -= MARGE_EXCLUS / 52;
    }
    const ca =
      signature !== null && w >= signature
        ? CONTRAT.ca + (etendu && w >= EFFET[D.extension] ? EXTENSION.ca : 0)
        : 0;
    semaines.push({
      valeur: e.total,
      variation: e.total - avant,
      commandes,
      part: ca > 0 ? partDeSarleve(ca, exclusivite ? undefined : 0) : 0,
      stock: e.stockDedie,
      exclusPerdu,
      marge,
    });
    avant = e.total;
    fin = e;
  }
  const d6 = chemin[D.revue]!;
  const resilie = st !== "lestrade" && h.uRevue < chanceDeResiliation(d6, d1 === 1);
  return {
    semaines,
    chemin: [...chemin],
    objectif: fin!.total,
    statut: st,
    signature,
    scenario: h.scenario,
    contrat: fin!.contrat,
    exclus: fin!.exclus,
    stock: fin!.stock,
    extension: fin!.extension,
    depenses: fin!.depenses,
    etendu,
    analyse: st !== "lestrade" && chemin[D.extension] === 2 ? analyseFavorable(graine) : null,
    conquete:
      st !== "lestrade" && exclusivite && chemin[D.exclus] === 1 ? conqueteReussie(graine) : null,
    rupture:
      st !== "lestrade" &&
      chemin[D.stock] === 2 &&
      signature !== null &&
      signature < RUPTURE.semaine &&
      ruptureDeStock(graine),
    resilie,
    stockDedie: fin!.stockDedie,
    part: semaines[SEMAINES]!.part,
  };
}

/** Ce qui s'est passé pendant des semaines : signature, signal, analyse, rupture, carnet, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const contrat = t.statut !== "lestrade";
  return {
    signature: t.statut === "plusTard" && dans(PLUS_TARD.signature),
    suspension: contrat && dans(SUSPENSION.semaine),
    analyse: t.analyse !== null && dans(EFFET[D.extension]),
    rupture: t.rupture && dans(RUPTURE.semaine),
    conquete: t.conquete !== null && dans(CONQUETE.semaine),
    carnet: dans(REVELATION),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

/**
 * CE QUE LA RUPTURE COÛTERAIT À ARVEL si Sarlève résiliait au terme de la
 * première année : la valeur du contrat gardé, moins celle du contrat rompu,
 * aux chances de départ des trois carnets.
 */
export function coutDeRupture(chemin: readonly number[], graine: number, w: number): number {
  const e = estimer(chemin, graine, w, 0).engagement;
  if (!e) return 0;
  return SCENARIOS.reduce(
    (acc, sc, s) =>
      acc + sc.chance * (valeurPour(e, s, false).total - valeurPour(e, s, true).total),
    0,
  );
}

export interface LectureExclusivite {
  valeur: number | null;
  commandes: number | null;
  part: number | null;
  stock: number | null;
  marge: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  statut: number | null;
  signature: number | null;
  financement: number | null;
  exclusPerdu: number | null;
  rupture: number | null;
}

/** Ce que Kenji lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureExclusivite {
  if (semaine === 0) {
    return {
      valeur: 0,
      commandes: 0,
      part: 0,
      stock: 0,
      marge: 0,
      statut: -1,
      signature: null,
      financement: CONTRAT.financement,
      exclusPerdu: 0,
      rupture: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const h = hasard(graine);
  const taux = imprevu(h, "taux");
  const connu = decisions.length > 0 && semaine >= EFFET[D.reponse];
  return {
    valeur: s.valeur,
    commandes: s.commandes,
    part: s.part,
    stock: s.stock,
    marge: s.marge,
    statut: !connu ? -1 : t.statut === "signe" ? 0 : t.statut === "plusTard" ? 1 : 2,
    signature: t.signature,
    financement: taux && taux.semaine <= semaine ? 0.06 : CONTRAT.financement,
    exclusPerdu: s.exclusPerdu,
    rupture: coutDeRupture(chemin, graine, semaine),
  };
}
