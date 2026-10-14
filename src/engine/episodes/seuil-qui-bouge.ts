/**
 * LE SEUIL QUI BOUGE — le modèle du drive matériaux de Bourgoin-Jallieu.
 *
 * Un drive ouvert depuis un mois : les artisans commandent en ligne ou par
 * téléphone et chargent en dix minutes. Le plan d'affaires l'a dimensionné
 * pour 300 retraits par semaine ; il en fait 254, et personne ne sait s'il
 * montera, plafonnera ou décrochera. Treize semaines, six décisions. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE SEUIL DÉPEND DE LA STRUCTURE. Chaque charge variable transformée en
 *     charge fixe (des CDI à la place de l'intérim, un loyer fixe à la place
 *     d'un loyer indexé, des chariots achetés à la place de la location à
 *     l'heure) coûte moins cher au volume du plan, et rapproche le seuil de
 *     rentabilité du chiffre d'affaires. Au volume du plan, la structure la
 *     plus fixe gagne ; au volume probable, elle perd ; si la demande
 *     décroche, elle perd beaucoup. Le levier opérationnel amplifie tout :
 *     avec une marge de sécurité de 13 %, il est proche de 8, et une baisse
 *     de 10 % du chiffre d'affaires emporte près de 80 % du résultat.
 *     Fixer une charge n'est pas une faute en soi : un chariot
 *     en crédit-bail, rentable dès 440 retraits par mois, l'est encore dans
 *     le scénario bas.
 *   · LA DEMANDE EST INCERTAINE, ET LE SCÉNARIO BAS EST PLAUSIBLE. Trois
 *     trajectoires sont tirées d'avance : la montée en charge vers le plan
 *     (trois fois sur dix), le plateau (un peu moins d'une fois sur deux), le
 *     décrochage (une fois sur quatre). La meilleure structure en moyenne
 *     garde un socle fixe que le volume probable remplit ; la plus sûre est
 *     toute variable, et ne coûte que peu de plus.
 *   · BAISSER LES PRIX FAIT MONTER LE SEUIL. Le taux de marge sur coût
 *     variable n'est que de 20 % : une baisse de 5 % de tous les prix en
 *     retire le quart, et il faudrait un tiers de retraits en plus pour la
 *     payer. L'élasticité mesurée n'en donne qu'une fraction. À l'inverse, un
 *     prix spécial sur un volume EN PLUS, au-dessus du coût variable, ajoute
 *     de la marge : c'est le coût marginal qui compte, pas le coût complet, et
 *     il dépend de la structure choisie avant (des préparateurs en CDI qui ont
 *     du temps libre, un quai qui sature).
 *
 * Le trimestre est jugé en euros : le résultat du drive, en écart à son
 * budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Douze mois font cinquante-deux semaines : un mois vaut 52/12 semaines, le trimestre treize. */
export const SEMAINES_PAR_MOIS = 52 / 12;

/* ---------------------------------------------------------------------------
 * LA STRUCTURE DE DÉPART : celle du premier mois d'exploitation.
 * ------------------------------------------------------------------------- */

/** Le panier moyen d'un retrait, au prix du tarif drive, en euros hors taxes. */
export const PANIER = 250;
/** Le coût d'achat des marchandises vendues, en part du prix du tarif. */
export const TAUX_ACHAT = 0.74;
/** La préparation par l'intérim, par retrait : au coup par coup, ou dans un contrat-cadre. */
export const INTERIM = { coupParCoup: 10, cadre: 8 } as const;
/** Le chariot élévateur loué à l'heure, ramené au retrait. */
export const CHARIOT_HEURE = 2.5;
/** Frais d'encaissement par carte, film, palettes perdues : par retrait. */
export const ENCAISSEMENT = 2.5;
/** Le coût variable d'un retrait au départ : 185 + 10 + 2,50 + 2,50 = 200 €. */
export const CV_DEPART = PANIER * TAUX_ACHAT + INTERIM.coupParCoup + CHARIOT_HEURE + ENCAISSEMENT;
/** La marge sur coût variable d'un retrait : 50 €. */
export const MCV_DEPART = PANIER - CV_DEPART;
/** Le taux de marge sur coût variable : 20 %. */
export const TAUX_MCV_DEPART = MCV_DEPART / PANIER;

/** Les charges fixes d'un mois, au départ. */
export const CHARGES_FIXES = {
  /** La convention d'occupation précaire, jusqu'à la fin de la semaine 4. */
  loyer: 16000,
  /** Rachid, deux vendeurs au comptoir, un magasinier-cariste : charges sociales comprises. */
  salaires: 21000,
  /** Énergie, informatique, assurances, entretien. */
  frais: 4500,
  /** Les aménagements du bâtiment et le logiciel de commande en ligne. */
  amortissements: 6500,
} as const;
/** 48 000 € par mois. */
export const CF_DEPART =
  CHARGES_FIXES.loyer + CHARGES_FIXES.salaires + CHARGES_FIXES.frais + CHARGES_FIXES.amortissements;
/** Ce qui reste fixe quel que soit le bail : 32 000 € par mois. */
export const AUTRES_CHARGES_FIXES = CF_DEPART - CHARGES_FIXES.loyer;
/** Le seuil de rentabilité mensuel de départ : 48 000 / 20 % = 240 000 € de chiffre d'affaires. */
export const SEUIL_DEPART = CF_DEPART / TAUX_MCV_DEPART;
/** Le même seuil, en retraits par mois : 960. */
export const SEUIL_DEPART_RETRAITS = CF_DEPART / MCV_DEPART;

/** Les retraits du premier mois, et le rythme hebdomadaire qu'ils font. */
export const RETRAITS_MOIS_1 = 1100;
export const DEPART_HEBDO = RETRAITS_MOIS_1 / SEMAINES_PAR_MOIS;
/** Le rythme de croisière du plan d'affaires, en retraits par semaine. */
export const PLAN = 300;
/** Le volume sur lequel le budget du trimestre a été bâti. */
export const VOLUME_BUDGET = 270;
/** Le résultat budgété du trimestre : 13 × 270 × 50 − 3 × 48 000 = 31 500 €. */
export const BUDGET = SEMAINES * VOLUME_BUDGET * MCV_DEPART - 3 * CF_DEPART;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'intérim au coup par coup et le loyer précaire courent. */
export const PERTE_PAR_JOUR = 800;

/* ---------------------------------------------------------------------------
 * CE QUE LES DÉCISIONS CHANGENT.
 * ------------------------------------------------------------------------- */

/** Un préparateur en CDI : coût chargé mensuel, et retraits préparés par semaine. */
export const CDI = { cout: 3000, capacite: 100 } as const;
/** Les trois formules du bail définitif, à partir de la semaine 5. */
export const LOYER = {
  fixe: 13000,
  /** Le loyer binaire : un minimum garanti, plus une part du chiffre d'affaires. */
  minimum: 6600,
  part: 0.02,
  /** Le loyer variable, sans minimum. */
  variable: 0.048,
} as const;
export const DEBUT_BAIL = 5;
/** Un chariot en crédit-bail, par mois ; les travaux du second quai. */
export const CREDIT_BAIL = 1100;
export const TRAVAUX_QUAI = 2000;
export const DEBUT_CHARIOTS = 8;
/** Les retraits servis par semaine sans attente au-delà d'un quart d'heure aux heures de pointe. */
export const CAPACITE = { depart: 290, renfort: 360, quai: 420 } as const;
/** La part des artisans qui repartent sans charger quand on dépasse la capacité. */
export const PERDUS = 0.5;
/** À partir de deux cents retraits par semaine, un second chariot sert aux matins de pointe. */
export const SEUIL_SECOND_CHARIOT = 200;

/** Brenaz Matériaux ouvre son drive à L'Isle-d'Abeau, à 5 % sous vos prix. */
export const CONCURRENT = {
  semaine: 6,
  baisse: 0.05,
  /** La clientèle perdue sans réponse ; avec une baisse de tous les prix, le gain de volume. */
  perte: 0.1,
  gainBaisse: 0.02,
  /** Les produits d'appel : 20 % du chiffre d'affaires. */
  partAppel: 0.2,
  perteAppel: 0.02,
  perteService: 0.04,
  /** Si Brenaz répond à votre baisse (guerre des prix), à partir de la semaine 8. */
  perteGuerre: 0.05,
} as const;
export const CHANCE_GUERRE = 0.5;
/** Un préparateur intérimaire de renfort aux heures de pointe, pour garantir le retrait en dix minutes. */
export const RENFORT_SERVICE = 2600;

/** Avec trois préparateurs en CDI, le planning couvre les matins : la garantie ne coûte rien de plus. */
export const renfortInutile = (chemin: readonly number[]) => chemin[D.preparation] === 0;

/** Bâtir Nord-Isère : ses sous-traitants chargeraient au drive de la semaine 10 à la fin du trimestre. */
export const CONTRAT = {
  debut: 10,
  retraits: 40,
  panier: 300,
  remise: 0.08,
  contre: 0.04,
} as const;
export const CHANCE_CONTRE = 0.5;
/** Une fois sur trois, le chantier glisse : la moitié des retraits seulement à partir de la semaine 11. */
export const CHANCE_GLISSEMENT = 0.35;

/** La fin d'année : saisonnalité des chantiers, et ce que coûte d'ouvrir la semaine de Noël. */
export const SAISON = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9, 0.45] as const;
export const FIN = {
  remise: 0.08,
  hausse: 0.1,
  /** Chauffage du hall, éclairage, gardiennage, nettoyage : ce qu'une fermeture évite. */
  evitables: 2000,
  /** Ce qu'évite une ouverture le matin seulement. */
  matin: 1500,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  preparation: 0,
  bail: 1,
  concurrent: 2,
  chariots: 3,
  contrat: 4,
  noel: 5,
} as const;

/** Ne rien changer, décision par décision : le bail se signe tel que le bailleur le propose. */
export const NEUTRE = [3, 0, 3, 3, 2, 3] as const;

/* ---------------------------------------------------------------------------
 * LE HASARD : la trajectoire de la demande, et les imprévus.
 * ------------------------------------------------------------------------- */

export type Regime = "haut" | "plateau" | "bas";
/** Les trois trajectoires de la demande, et le rythme qu'elles atteignent en semaine 7. */
export const REGIMES: readonly { id: Regime; cible: number; chance: number }[] = [
  { id: "haut", cible: 320, chance: 0.3 },
  { id: "plateau", cible: 260, chance: 0.45 },
  { id: "bas", cible: 150, chance: 0.25 },
];

export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  duree: number;
  effet: { volume?: number; achat?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "verglas",
    titre: "Une semaine de pluie verglaçante",
    de: "Bogdan Ilić",
    role: "Chef d'équipe préparation",
    texte:
      "Pluie verglaçante toute la semaine : les chantiers sont à l'arrêt, un quart des retraits prévus ne sont pas venus.",
    duree: 1,
    effet: { volume: 0.75 },
  },
  {
    id: "logiciel",
    titre: "Panne du site de commande",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le site de commande du drive est tombé deux jours : les artisans ont appelé, ou sont allés ailleurs.",
    duree: 1,
    effet: { volume: 0.88 },
  },
  {
    id: "ciment",
    titre: "Hausse du ciment et du plâtre",
    de: "Inaya Fofana",
    role: "Contrôleuse de gestion régionale",
    texte:
      "Le fournisseur de ciment et de plâtre augmente ses prix ; le tarif drive ne sera corrigé que dans un mois. Le coût d'achat passe de 74 à 75 % du tarif.",
    duree: 4,
    effet: { achat: 0.01 },
  },
  {
    id: "vol",
    titre: "Vol sur le parc de stockage",
    de: "Bogdan Ilić",
    role: "Chef d'équipe préparation",
    texte:
      "Nuit de vol sur le parc : câbles de cuivre et gazole du chariot. Franchise d'assurance et clôture à réparer, 3 500 €.",
    duree: 1,
    effet: { cout: 3500 },
  },
  {
    id: "securite",
    titre: "Visite de la commission de sécurité",
    de: "Octave Dumesnil",
    role: "Gestionnaire du bâtiment, foncière Alpes Logistique",
    texte:
      "La commission de sécurité demande de déplacer deux extincteurs et de refaire le marquage des allées : 2 800 €, à la charge de l'exploitant.",
    duree: 1,
    effet: { cout: 2800 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  regime: Regime;
  /** Le bruit de la demande, semaine par semaine. */
  bruit: readonly number[];
  /** Brenaz répond-il à une baisse générale de vos prix ? */
  uGuerre: number;
  /** Bâtir Nord-Isère accepte-t-il la contre-proposition ? */
  uContre: number;
  /** Son chantier glisse-t-il ? */
  uGlissement: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000249 + 7);
  const u = r();
  let cumul = 0;
  let regime: Regime = "bas";
  for (const x of REGIMES) {
    cumul += x.chance;
    if (u < cumul) {
      regime = x.id;
      break;
    }
  }
  const bruit: number[] = [1];
  for (let w = 1; w <= SEMAINES; w += 1) {
    bruit.push(Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))));
  }
  const uGuerre = r();
  const uContre = r();
  const uGlissement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { regime, bruit, uGuerre, uContre, uGlissement, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le rythme de la demande avant toute décision : il rejoint sa trajectoire en semaine 7. */
export function rythme(regime: Regime, w: number): number {
  const cible = REGIMES.find((x) => x.id === regime)!.cible;
  return DEPART_HEBDO + (cible - DEPART_HEBDO) * Math.min(1, (w - 1) / 6);
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Brenaz répond une fois sur deux à une baisse générale par une baisse plus forte. */
export const guerreDesPrix = (chemin: readonly number[], graine: number) =>
  chemin[D.concurrent] === 0 && hasard(graine).uGuerre < CHANCE_GUERRE;

/** Bâtir Nord-Isère accepte la contre-proposition à −4 % une fois sur deux. */
export const contreAcceptee = (graine: number) => hasard(graine).uContre < CHANCE_CONTRE;

/** Le contrat est-il signé, à quel prix ? `null` : pas de contrat. */
export function contratSigne(chemin: readonly number[], graine: number): number | null {
  if (chemin[D.contrat] === 0) return CONTRAT.remise;
  if (chemin[D.contrat] === 1 && contreAcceptee(graine)) return CONTRAT.contre;
  return null;
}

/** Le chantier glisse une fois sur trois : seulement si le contrat est signé. */
export const chantierGlisse = (chemin: readonly number[], graine: number) =>
  contratSigne(chemin, graine) !== null && hasard(graine).uGlissement < CHANCE_GLISSEMENT;

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** Retraits servis dans la semaine, contrat compris. */
  retraits: number;
  /** Retraits perdus : artisans repartis faute de pouvoir charger. */
  perdus: number;
  ca: number;
  /** Les charges variables et la marge sur coût variable de la semaine. */
  cv: number;
  mcv: number;
  tauxMcv: number;
  /** Les charges fixes de la structure, ramenées à la semaine. */
  cf: number;
  /** Les charges ponctuelles : imprévus, travaux, attente. */
  ponctuel: number;
  resultat: number;
  /** Le résultat cumulé depuis le début du trimestre. */
  cumul: number;
  /** Le seuil de rentabilité mensuel de la structure de la semaine, en euros de chiffre d'affaires. */
  seuil: number;
  /** La marge de sécurité, en part du chiffre d'affaires mensualisé. */
  securite: number;
  /** Le levier opérationnel : marge sur coût variable sur résultat (hors charges ponctuelles). */
  levier: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat du drive en écart à son budget : positif, au-dessus du budget. */
  objectif: number;
  resultat: number;
  ca: number;
  mcv: number;
  retraits: number;
  perdus: number;
  regime: Regime;
  guerre: boolean;
  /** Le prix du contrat de Bâtir Nord-Isère : `null` s'il n'est pas signé. */
  contrat: number | null;
  glissement: boolean;
  /** La structure de fin de trimestre, lue en semaine 11. */
  seuilFinal: number;
  securiteFinale: number;
  tauxMcvMoyen: number;
  /** La structure que le trimestre laisse, lue au rythme du premier mois, sans hasard. */
  structure: Structure;
}

const MENSUEL = 12 / 52;

/** La préparation : ce qu'elle coûte en fixe (CDI) et en variable (intérim), pour n retraits. */
export function preparation(option: number | undefined, w: number, n: number) {
  const cdi = (k: number) => k * CDI.cout * MENSUEL;
  if (option === 0 && w >= 3) {
    const reste = Math.max(0, n - 3 * CDI.capacite);
    return { fixe: cdi(3), variable: reste * INTERIM.coupParCoup };
  }
  if (option === 1 && w >= 3) {
    const reste = Math.max(0, n - 2 * CDI.capacite);
    return { fixe: cdi(2), variable: reste * INTERIM.cadre };
  }
  if ((option === 1 || option === 2) && w >= 2) return { fixe: 0, variable: n * INTERIM.cadre };
  return { fixe: 0, variable: n * INTERIM.coupParCoup };
}

/** Le loyer de la semaine : sa part fixe et sa part variable. */
export function loyer(option: number | undefined, w: number, ca: number) {
  if (w < DEBUT_BAIL) return { fixe: CHARGES_FIXES.loyer * MENSUEL, variable: 0 };
  if (option === 1) return { fixe: LOYER.minimum * MENSUEL, variable: LOYER.part * ca };
  if (option === 2) return { fixe: 0, variable: LOYER.variable * ca };
  return { fixe: LOYER.fixe * MENSUEL, variable: 0 };
}

/** Les chariots : crédit-bail (fixe) et location à l'heure (variable), et la capacité de pointe. */
export function chariots(option: number | undefined, w: number, n: number) {
  const second = CHARIOT_HEURE * Math.max(0, n - SEUIL_SECOND_CHARIOT);
  if (w >= DEBUT_CHARIOTS) {
    if (option === 0)
      return { fixe: 2 * CREDIT_BAIL * MENSUEL, variable: 0, capacite: CAPACITE.quai };
    if (option === 1)
      return { fixe: CREDIT_BAIL * MENSUEL, variable: second, capacite: CAPACITE.renfort };
    if (option === 2)
      return { fixe: 0, variable: CHARIOT_HEURE * n + second, capacite: CAPACITE.renfort };
  }
  return { fixe: 0, variable: CHARIOT_HEURE * n, capacite: CAPACITE.depart };
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, , d6] = chemin;
  const guerre = guerreDesPrix(chemin, graine);
  const contrat = contratSigne(chemin, graine);
  const glisse = chantierGlisse(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let ca = 0;
  let mcv = 0;
  let retraits = 0;
  let perdus = 0;
  let dernierTaux = TAUX_MCV_DEPART;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let ponctuel = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // La demande des artisans, et le prix qu'ils paient.
    let demande = rythme(h.regime, w) * h.bruit[w]! * SAISON[w]!;
    let prix = 1;
    if (w >= CONCURRENT.semaine) {
      if (d3 === 0) {
        prix *= 1 - CONCURRENT.baisse;
        demande *= guerre && w >= 8 ? 1 - CONCURRENT.perteGuerre : 1 + CONCURRENT.gainBaisse;
      } else if (d3 === 1) {
        prix *= 1 - CONCURRENT.baisse * CONCURRENT.partAppel;
        demande *= 1 - CONCURRENT.perteAppel;
      } else if (d3 === 2) {
        demande *= 1 - CONCURRENT.perteService;
      } else {
        demande *= 1 - CONCURRENT.perte;
      }
    }
    for (const a of actifs) demande *= a.imprevu.effet.volume ?? 1;
    let pro = 0;
    if (contrat !== null && w >= CONTRAT.debut) {
      pro = CONTRAT.retraits * SAISON[w]! * (glisse && w >= 11 ? 0.5 : 1);
    }
    // La fin d'année.
    if (w >= 12) {
      if (d6 === 0) {
        prix *= 1 - FIN.remise;
        demande *= 1 + FIN.hausse;
      } else if (d6 === 1) {
        if (w === 12) demande *= 1.06;
        if (w === 13) {
          demande = 0;
          pro = 0;
        }
      } else if (d6 === 2) {
        if (w === 12) demande *= 1.04;
        if (w === 13) {
          demande *= 0.9;
          pro *= 0.9;
        }
      }
    }

    // Ce que le drive peut servir aux heures de pointe.
    const ch0 = chariots(d4, w, demande + pro);
    const total = demande + pro;
    const servi =
      total <= ch0.capacite ? 1 : (ch0.capacite + (1 - PERDUS) * (total - ch0.capacite)) / total;
    const nReg = demande * servi;
    const nPro = pro * servi;
    const n = nReg + nPro;
    perdus += total - n;

    // Le chiffre d'affaires et les charges variables.
    const tauxAchat = TAUX_ACHAT + actifs.reduce((s, a) => s + (a.imprevu.effet.achat ?? 0), 0);
    const caSemaine = nReg * PANIER * prix + nPro * CONTRAT.panier * (1 - (contrat ?? 0));
    const achats = (nReg * PANIER + nPro * CONTRAT.panier) * tauxAchat;
    const prep = preparation(d1, w, n);
    const bail = loyer(d2, w, caSemaine);
    const ch = chariots(d4, w, n);
    const cv = achats + prep.variable + bail.variable + ch.variable + ENCAISSEMENT * n;

    // Les charges fixes de la structure.
    let cf = AUTRES_CHARGES_FIXES * MENSUEL + prep.fixe + bail.fixe + ch.fixe;
    // La garantie de service demande un renfort aux heures de pointe, sauf si trois préparateurs
    // en CDI, déjà payés, ont le temps de la tenir : le coût marginal dépend de ce qui est engagé.
    if (d3 === 2 && w >= CONCURRENT.semaine && !renfortInutile(chemin)) {
      cf += RENFORT_SERVICE * MENSUEL;
    }
    if (d4 === 0 && w === DEBUT_CHARIOTS) ponctuel += TRAVAUX_QUAI;
    if (d6 === 1 && w === 13) ponctuel -= FIN.evitables;
    if (d6 === 2 && w === 13) ponctuel -= FIN.matin;
    for (const a of actifs) if (a.semaine === w) ponctuel += a.imprevu.effet.cout ?? 0;

    const marge = caSemaine - cv;
    const resultat = marge - cf - ponctuel;
    cumul += resultat;
    ca += caSemaine;
    mcv += marge;
    retraits += n;
    const taux = caSemaine > 0 ? marge / caSemaine : dernierTaux;
    dernierTaux = taux;
    const seuil = cf / MENSUEL / Math.max(0.01, taux);
    const caMois = caSemaine / MENSUEL;
    semaines.push({
      retraits: n,
      perdus: total - n,
      ca: caSemaine,
      cv,
      mcv: marge,
      tauxMcv: taux,
      cf,
      ponctuel,
      resultat,
      cumul,
      seuil,
      securite: caMois > 0 ? borne((caMois - seuil) / caMois, -1, 1) : -1,
      levier: marge - cf > 0 ? marge / (marge - cf) : 0,
    });
  }

  const s11 = semaines[11]!;
  return {
    semaines,
    objectif: cumul - BUDGET,
    resultat: cumul,
    ca,
    mcv,
    retraits,
    perdus,
    regime: h.regime,
    guerre,
    contrat,
    glissement: glisse,
    seuilFinal: s11.seuil,
    securiteFinale: s11.securite,
    tauxMcvMoyen: ca > 0 ? mcv / ca : 0,
    structure: structure(chemin),
  };
}

/**
 * LA STRUCTURE QU'UN CHEMIN LAISSE, lue au rythme du premier mois (254 retraits
 * par semaine), sans hasard : ses charges fixes mensuelles, son taux de marge
 * sur coût variable, son seuil de rentabilité, sa marge de sécurité et son
 * levier opérationnel. C'est ce que le drive emporte dans le trimestre suivant.
 */
export interface Structure {
  /** Les charges fixes d'un mois. */
  cf: number;
  taux: number;
  seuil: number;
  securite: number;
  /** Le levier opérationnel ; `null` sous le seuil, où il n'a pas de sens. */
  levier: number | null;
}

export function structure(chemin: readonly number[]): Structure {
  const n = DEPART_HEBDO;
  const w = SEMAINES - 2;
  const [d1, d2, d3, d4] = chemin;
  const prix =
    d3 === 0 ? 1 - CONCURRENT.baisse : d3 === 1 ? 1 - CONCURRENT.baisse * CONCURRENT.partAppel : 1;
  const ca = n * PANIER * prix;
  const prep = preparation(d1, w, n);
  const bail = loyer(d2, w, ca);
  const ch = chariots(d4, w, n);
  let cf = AUTRES_CHARGES_FIXES * MENSUEL + prep.fixe + bail.fixe + ch.fixe;
  if (d3 === 2 && !renfortInutile(chemin)) cf += RENFORT_SERVICE * MENSUEL;
  const cv =
    n * PANIER * TAUX_ACHAT + prep.variable + bail.variable + ch.variable + ENCAISSEMENT * n;
  const mcv = ca - cv;
  const taux = mcv / ca;
  const seuil = cf / MENSUEL / taux;
  const caMois = ca / MENSUEL;
  return {
    cf: cf / MENSUEL,
    taux,
    seuil,
    securite: (caMois - seuil) / caMois,
    levier: mcv > cf ? mcv / (mcv - cf) : null,
  };
}

/**
 * CE QUE RAPPORTE UN RETRAIT DE BÂTIR NORD-ISÈRE, en marge sur coût variable :
 * le prix remisé, moins les achats, l'encaissement, la préparation et le
 * chariot que ce retrait-là fait payer en plus, et la part de loyer qui suit
 * le chiffre d'affaires. Les charges fixes n'y entrent pas : elles sont payées
 * que Bâtir vienne ou non. Des préparateurs en CDI qui ont du temps libre ne
 * coûtent rien de plus.
 */
export function margeDUnRetraitBatir(chemin: readonly number[], remise: number = CONTRAT.remise) {
  const ca = CONTRAT.panier * (1 - remise);
  const achats = CONTRAT.panier * TAUX_ACHAT;
  const prep =
    chemin[D.preparation] === 0
      ? 0
      : chemin[D.preparation] === 3
        ? INTERIM.coupParCoup
        : INTERIM.cadre;
  const chariot = chemin[D.chariots] === 0 ? 0 : CHARIOT_HEURE;
  const part = chemin[D.bail] === 1 ? LOYER.part : chemin[D.bail] === 2 ? LOYER.variable : 0;
  return {
    ca,
    achats,
    prep,
    chariot,
    loyer: part * ca,
    marge: ca - achats - ENCAISSEMENT - prep - chariot - part * ca,
  };
}

/** Ce qui s'est passé pendant des semaines : guerre des prix, contrat, chantier, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    cdi: (chemin[D.preparation] === 0 || chemin[D.preparation] === 1) && dans(3),
    brenaz: dans(CONCURRENT.semaine),
    guerre: t.guerre && dans(8),
    glissement: t.glissement && dans(11),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDrive {
  cumul: number | null;
  retraits: number | null;
  tauxMcv: number | null;
  seuil: number | null;
  securite: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  budgetADate: number | null;
  ca: number | null;
  levier: number | null;
  perdus: number | null;
}

/** La situation du lundi de la semaine 1 : le premier mois d'exploitation. */
export const DEPART = (() => {
  const ca = RETRAITS_MOIS_1 * PANIER;
  const mcv = RETRAITS_MOIS_1 * MCV_DEPART;
  return {
    ca,
    mcv,
    resultat: mcv - CF_DEPART,
    securite: (ca - SEUIL_DEPART) / ca,
    levier: mcv / (mcv - CF_DEPART),
  };
})();

/** Ce que Rachid lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDrive {
  if (semaine === 0) {
    return {
      cumul: 0,
      retraits: DEPART_HEBDO,
      tauxMcv: TAUX_MCV_DEPART,
      seuil: SEUIL_DEPART,
      securite: DEPART.securite,
      budgetADate: 0,
      ca: DEPART.ca,
      levier: DEPART.levier,
      perdus: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    cumul: s.cumul,
    retraits: s.retraits,
    tauxMcv: s.tauxMcv,
    seuil: s.seuil,
    securite: s.securite,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    ca: s.ca,
    levier: s.levier,
    perdus: s.perdus,
  };
}
