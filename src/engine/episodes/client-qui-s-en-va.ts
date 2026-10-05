/**
 * LE CLIENT QUI S'EN VA — le modèle de la clientèle artisans de l'Est lyonnais.
 *
 * Neuf cent vingt artisans actifs, six agences, huit commerciaux, treize
 * semaines, six décisions. Le nombre d'artisans actifs baisse doucement depuis
 * six mois, et personne ne sait pourquoi. Trois mécanismes font l'épisode, et
 * le joueur doit les découvrir :
 *
 *   · L'ATTRITION EST SILENCIEUSE, ET ELLE SE LIT AVANT LE DÉPART. Un artisan
 *     qui part ne se plaint presque jamais : il commande moins pendant deux ou
 *     trois mois, puis plus du tout. Le portefeuille a donc trois états — les
 *     fidèles, ceux dont les commandes baissent, les partis — et c'est dans le
 *     deuxième qu'on peut encore agir. Un appel à temps en ramène un sur trois ;
 *     un client parti coûte bien plus cher à faire revenir, quand il revient.
 *     Encore faut-il savoir qui baisse : sans liste, on appelle au hasard.
 *   · ON PART POUR UN IRRITANT, PAS POUR LE PRIX. Depuis la réorganisation de
 *     septembre, l'attente au comptoir à l'ouverture a doublé, et elle monte
 *     avec la saison ; les erreurs de facturation agacent, mais moins. C'est
 *     l'irritant qui fait passer un fidèle dans la zone de baisse, puis au
 *     départ. Une remise ne le compense qu'à la marge, et chaque point de
 *     remise se paie sur tout le chiffre d'affaires.
 *   · UNE ACTION POUR TOUS PAIE D'ABORD CEUX QUI SERAIENT RESTÉS. Un programme
 *     de points, une enveloppe de remises, un alignement général sur un
 *     concurrent rémunèrent les neuf artisans sur dix qui ne partaient pas.
 *     La même somme, ciblée sur ceux qui baissent, retient bien davantage.
 *
 * Le trimestre est jugé en euros : la marge des artisans, plus la valeur des
 * clients conservés en fin de trimestre, moins ce qu'ont coûté les actions,
 * en écart au budget. Retenir n'y est pas une politesse commerciale, c'est un
 * calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les artisans au début du trimestre : fidèles, et en baisse de commandes. */
export const FIDELES_DEPART = 804;
export const EN_BAISSE_DEPART = 115;
/** Kaya Rénovation compte à part : un artisan en baisse, mais le premier client de la région. */
export const ACTIFS_DEPART = FIDELES_DEPART + EN_BAISSE_DEPART + 1;
/** Il y a six mois. */
export const ACTIFS_IL_Y_A_SIX_MOIS = 985;
/** Les artisans partis depuis six mois, avant le trimestre : le vivier d'une reconquête. */
export const PARTIS_AVANT = 96;
/** Le chiffre d'affaires d'un artisan fidèle, par semaine. */
export const CA_ARTISAN = 380;
export const TAUX_MARGE = 0.25;
/** Un artisan en baisse commande moins de la moitié de ce qu'il commandait. */
export const PART_EN_BAISSE = 0.45;
/** Ce que vaut un artisan fidèle en fin de trimestre : la marge du trimestre suivant. */
export const VALEUR_FIDELE = 1000;
/** Un artisan en baisse vaut bien moins : beaucoup partiront au trimestre suivant. */
export const VALEUR_EN_BAISSE = 0.45 * VALEUR_FIDELE;
/** Le même, quand une alerte le fera rappeler dès la première semaine du trimestre suivant. */
export const VALEUR_EN_BAISSE_SUIVI = 0.6 * VALEUR_FIDELE;
/** Les nouveaux artisans qu'apporte la prospection, par semaine. */
export const NOUVEAUX = 3;
/** L'objectif de l'année : pas plus de cinq artisans perdus par semaine. */
export const PLAFOND_DEPARTS = 5;
/** L'enveloppe des actions de fidélisation du trimestre. */
export const ENVELOPPE = 45000;
/** Le nombre d'artisans actifs que le budget prévoit en fin de trimestre, dont 815 fidèles. */
export const ACTIFS_BUDGET = 900;
/** Le budget du trimestre : la marge des artisans, et la valeur du portefeuille en fin de trimestre. */
export const BUDGET_MARGE = 1060000;
export const BUDGET_PORTEFEUILLE = 815 * VALEUR_FIDELE + 85 * VALEUR_EN_BAISSE;
export const BUDGET = BUDGET_MARGE + BUDGET_PORTEFEUILLE;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des artisans passent leurs commandes ailleurs. */
export const PERTE_PAR_JOUR = 1500;
/** L'attente au comptoir à l'ouverture il y a un an, en minutes. */
export const ATTENTE_IL_Y_A_UN_AN = 8;
/** La part des factures des comptes artisans corrigées par un avoir. */
export const ERREURS_DEPART = 0.04;
/** Le gros client du portefeuille, et ce qu'il pèse. */
export const KAYA_MARGE = 450;
export const KAYA_VALEUR = 6000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  lancement: 0,
  irritant: 1,
  signaux: 2,
  reconquete: 3,
  concurrent: 4,
  suivi: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 2, 2] as const;

export const COUTS = {
  enquete: 2500,
  pointsLancement: 5000,
  /** Les points distribués, réellement utilisés, en part du chiffre d'affaires. */
  points: 0.006,
  /** L'enveloppe de remises : 1,5 % pour les artisans qui la demandent, un tiers des fidèles. */
  enveloppe: 0.015,
  retraitExpressMiseEnPlace: 3000,
  retraitExpress: 1500,
  factures: 900,
  /** La remise du matin : 2 % sur les retraits avant 9 h, un tiers du chiffre d'affaires. */
  remiseMatin: 0.02 * 0.3,
  appelsBase: 1000,
  parAppel: 25,
  remiseCiblee: 0.06,
  emailing: 1200,
  reconqueteCampagne: 2500,
  bonReconquete: 300,
  remiseReconquete: 0.1,
  visites: 1800,
  /** S'aligner sur Dalvaz : 4 % sur le gros œuvre, 40 % du chiffre d'affaires. */
  alignement: 0.04 * 0.4,
  garantie: 1000,
  livraison: 300,
  alerteMiseEnPlace: 2000,
  alerte: 400,
  remiseFin: 0.03,
} as const;

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
    /** Multiplie le passage des fidèles en baisse : un irritant de plus. */
    irritant?: number;
    /** Minutes d'attente en plus au comptoir. */
    attente?: number;
    /** Multiplie l'activité des artisans. */
    activite?: number;
    /** Des fidèles qui disparaissent d'un coup, sans que rien n'y puisse. */
    pertes?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "plaques",
    titre: "Rupture sur les plaques de plâtre",
    de: "Achats",
    role: "Siège",
    texte:
      "Le fabricant livre les plaques de plâtre avec deux semaines de retard : les plaquistes repartent les mains vides, et certains vont se servir ailleurs.",
    duree: 2,
    effet: { irritant: 1.35 },
  },
  {
    id: "caisse",
    titre: "Panne du logiciel de caisse",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel de caisse a planté trois matins de suite : bons faits à la main, files d'attente jusque sur le parking.",
    duree: 1,
    effet: { attente: 10 },
  },
  {
    id: "pluie",
    titre: "Une semaine de pluie",
    de: "Direction commerciale",
    role: "Région",
    texte:
      "Une semaine de pluie sans interruption : les chantiers s'arrêtent, les artisans commandent un cinquième de moins.",
    duree: 1,
    effet: { activite: 0.8 },
  },
  {
    id: "transport",
    titre: "Livraisons sur chantier en retard",
    de: "Logistique",
    role: "Dépôt régional",
    texte:
      "Le transporteur a perdu deux chauffeurs : une livraison sur chantier sur quatre arrive le lendemain, et les artisans attendent leurs palettes.",
    duree: 1,
    effet: { irritant: 1.3 },
  },
  {
    id: "liquidation",
    titre: "Liquidation d'une entreprise cliente",
    de: "Contrôle de gestion",
    role: "Région",
    texte:
      "L'entreprise Ferhat Bâtiment, cliente depuis douze ans, est en liquidation judiciaire : ses six équipes ne commanderont plus.",
    duree: 1,
    effet: { pertes: 6 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Le passage des fidèles en baisse : certaines semaines usent plus que d'autres. */
  flux: number;
  activite: number;
  nouveaux: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Les commerciaux passent-ils vraiment les appels, en pleine saison ? */
  uAppels: number;
  /** Kaya Rénovation part-elle ? */
  uKaya: number;
  /** Les artisans partis répondent-ils à la reconquête ? */
  uReconquete: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000081 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      flux: Math.min(1.35, Math.max(0.65, 1 + 0.12 * gauss(r))),
      activite: Math.min(1.08, Math.max(0.92, 1 + 0.025 * gauss(r))),
      nouveaux: Math.min(1.8, Math.max(0.2, 1 + 0.35 * gauss(r))),
    });
  }
  const uAppels = r();
  const uKaya = r();
  const uReconquete = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uAppels, uKaya, uReconquete, imprevus };
  tirages.set(graine, h);
  return h;
}

/** La liste des artisans en baisse existe-t-elle ? Seule l'enquête de la semaine 1 la construit. */
export const liste = (chemin: readonly number[]) => chemin[D.lancement] === 1;

/**
 * LES COMMERCIAUX APPELLENT-ILS VRAIMENT ?
 *
 * En avril, les chantiers reprennent et les commerciaux courent. Deux fois sur
 * trois, ils passent presque tous les appels ; sinon, moins de la moitié. Le
 * tirage ne dépend que du hasard du trimestre : l'appel est le meilleur choix
 * en moyenne, et un pari.
 */
export const CHANCE_APPELS = 0.65;
export const appelsTenus = (graine: number) => hasard(graine).uAppels < CHANCE_APPELS;

/**
 * KAYA RÉNOVATION PART-ELLE ?
 *
 * Huit compagnons, le premier client artisan de la région, et des commandes
 * qui baissent depuis janvier. Mustafa Kaya ne s'est jamais plaint : il
 * envoie ses gars ailleurs le matin. Le comptoir réglé, et quelqu'un qui
 * l'appelle, il reste presque sûrement ; laissé à lui-même, deux fois sur trois
 * il part en semaine 7.
 */
export function chanceQueKayaParte(chemin: readonly number[]): number {
  let c = 0.65;
  if (liste(chemin)) c -= 0.15;
  if (chemin[D.irritant] === 0) c -= 0.3;
  if (chemin[D.irritant] === 1) c -= 0.05;
  if (chemin[D.signaux] === 0 || chemin[D.signaux] === 1) c -= 0.12;
  return Math.max(0.03, c);
}
export const kayaPart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uKaya < chanceQueKayaParte(chemin);

/** L'attente au comptoir à l'ouverture, avant décision : elle monte avec la saison. */
export const attenteDeSaison = (w: number) => 18 + 0.4 * w;

export type Semaine = {
  /** Artisans qui commandent normalement. */
  fideles: number;
  /** Artisans dont les commandes ont baissé de 40 % ou plus sur huit semaines. */
  enBaisse: number;
  /** Fidèles et en baisse : ceux qui ont commandé dans les huit dernières semaines. */
  actifs: number;
  /** Artisans qui ont cessé de commander cette semaine. */
  departs: number;
  /** Artisans revenus cette semaine, par la reconquête. */
  retours: number;
  /** Attente moyenne au comptoir entre 6 h 30 et 8 h 30, en minutes. */
  attente: number;
  /** Réclamations reçues dans la semaine. */
  reclamations: number;
  /** La marge de la semaine, avant le coût des actions. */
  margeSemaine: number;
  /** La marge cumulée depuis le début du trimestre. */
  marge: number;
  /** Ce que les actions ont coûté dans la semaine : remises, points, renforts, appels. */
  cout: number;
  /** Le coût des actions cumulé. */
  couts: number;
  /** Ce que la semaine apporte à l'objectif : sa marge, moins ses coûts, plus ce que le portefeuille a gagné. */
  contribution: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget : marge plus valeur du portefeuille, moins les actions. Positif, mieux que prévu. */
  objectif: number;
  marge: number;
  couts: number;
  valeurPortefeuille: number;
  actifsFinal: number;
  enBaisseFinal: number;
  departsTotal: number;
  retoursTotal: number;
  kayaPart: boolean;
  appelsTenus: boolean;
  /** Le joueur a-t-il fait appeler les artisans en baisse ? */
  appelsLances: boolean;
  attenteFinale: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const aLaListe = liste(chemin);
  const kaya = kayaPart(chemin, graine);
  const tenus = appelsTenus(graine);
  const semaines: (Semaine | null)[] = [null];
  let fideles = FIDELES_DEPART;
  let enBaisse = EN_BAISSE_DEPART;
  let partis = PARTIS_AVANT;
  let marge = 0;
  let couts = 0;
  let departsTotal = 0;
  let retoursTotal = 0;
  let listeEnvoyee = 0;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const valeur = (f: number, b: number) => f * VALEUR_FIDELE + b * VALEUR_EN_BAISSE;
  let valeurAvant = valeur(fideles, enBaisse) + KAYA_VALEUR;
  let attente = attenteDeSaison(0);
  // Le retrait express traite l'irritant : sa réussite se lit sur l'attente réelle.
  let irritantTraite = false;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;

    // L'IRRITANT : l'attente au comptoir le matin, et les erreurs de facturation.
    const saison = attenteDeSaison(w);
    attente = saison;
    if (d2 === 0 && w === 4) attente = (saison + 9) / 2; // Une semaine de rodage.
    if (d2 === 0 && w >= 5) attente = ATTENTE_IL_Y_A_UN_AN + 0.1 * (saison - ATTENTE_IL_Y_A_UN_AN);
    for (const a of actifs) attente += a.imprevu.effet.attente ?? 0;
    let erreurs = ERREURS_DEPART;
    if (d2 === 1 && w === 4) erreurs = 0.026;
    if (d2 === 1 && w >= 5) erreurs = 0.012;
    const irritant =
      0.75 * Math.max(0, (attente - ATTENTE_IL_Y_A_UN_AN) / 12) +
      0.25 * Math.max(0, (erreurs - 0.01) / 0.03);
    irritantTraite = irritant < 0.5;

    // Le passage des fidèles en baisse : l'irritant d'abord, le prix à la marge.
    let passage = (0.005 + 0.006 * irritant) * n.flux;
    if (d1 === 0 && w >= 3) passage *= 0.95; // Les points : surtout pour ceux qui restaient.
    if (d1 === 2 && w >= 2) passage *= 0.96; // L'enveloppe : surtout pour ceux qui la demandent.
    if (d2 === 2 && w >= 4) passage *= 0.93; // La remise du matin ne raccourcit pas la file.
    if (d6 === 0 && w >= 12) passage *= 0.9;
    for (const a of actifs) passage *= a.imprevu.effet.irritant ?? 1;

    // Le départ des artisans en baisse, et leur retour à la normale.
    let depart = 0.04 + 0.02 * irritant;
    let retour = 0.02 + 0.03 * Math.max(0, 1 - irritant);
    if (d3 === 1 && w >= 6) {
      // La remise ciblée tient huit semaines ; sans liste, elle va pour moitié à des fidèles.
      depart *= aLaListe ? 0.5 : 0.8;
      retour += aLaListe ? 0.015 : 0.005;
    }
    if (d3 === 2 && w >= 6 && w <= 8) depart *= 0.92;
    if (d4 === 0 && w >= 8 && w <= 10) depart *= 1.15; // Les commerciaux courent après les partis.
    // DALVAZ MATÉRIAUX ouvre à Décines en semaine 10, 6 % moins cher sur le gros œuvre.
    if (w >= 10) {
      let attraction = 1;
      if (d5 === 2) attraction = 1.8;
      if (d5 === 3) attraction = 1.65;
      if (d5 === 1)
        attraction = 1 + 0.8 * (1 - (aLaListe ? 0.8 : 0.4) * (irritantTraite ? 1 : 0.5));
      depart *= attraction;
      passage *= d5 === 0 ? 1 : d5 === 1 ? 1.06 : d5 === 3 ? 1.2 : 1.25;
    }
    if (d6 === 1 && w >= 12) {
      // L'alerte du lundi : un appel sous 48 heures. Sans liste, il faut d'abord la construire.
      if (aLaListe || w === 13) {
        depart *= 0.75;
        retour += 0.02;
      }
    }
    if (d6 === 0 && w >= 12) depart *= 0.85;
    depart = borne(depart, 0, 0.3);

    // Les flux de la semaine.
    const versBaisse = fideles * borne(passage, 0, 0.1);
    const departs = enBaisse * depart;
    const redresses = enBaisse * retour;
    let rappeles = 0;
    if (d3 === 0 && (w === 6 || w === 7)) {
      // LES APPELS : la moitié de la liste chaque semaine ; un appel ne retient que si l'on peut
      // dire que le problème est réglé.
      const couverture = tenus ? 0.85 : 0.25;
      const precision = aLaListe ? 1 : 0.45;
      const succes = irritantTraite ? 0.36 : 0.12;
      rappeles = enBaisse * 0.5 * couverture * precision * succes;
      cout += (w === 6 ? COUTS.appelsBase : 0) + COUTS.parAppel * enBaisse * 0.5 * couverture;
    }
    let retours = 0;
    let retoursFideles = 0;
    if (d4 === 0 && (w === 8 || w === 9)) {
      // L'offre à tous les partis : peu reviennent, et ils reviennent en baisse.
      const taux = (irritantTraite ? 0.08 : 0.04) * (0.6 + 0.8 * h.uReconquete);
      retours = (partis * taux) / (w === 8 ? 1 : 2);
      cout += (w === 8 ? COUTS.reconqueteCampagne : 0) + COUTS.bonReconquete * retours;
    }
    if (d4 === 1 && w === 8) {
      // Les visites : trente artisans partis à cause du comptoir, si l'on sait lesquels.
      const vises = 30 * (aLaListe ? 1 : 0.5);
      const taux = (irritantTraite ? 0.32 : 0.06) * (0.6 + 0.8 * h.uReconquete);
      if (irritantTraite) retoursFideles = vises * taux;
      else retours = vises * taux;
      cout += COUTS.visites;
    }
    let perdus = 0;
    for (const a of actifs) {
      if (w === a.semaine) perdus += a.imprevu.effet.pertes ?? 0;
    }
    const nouveaux = NOUVEAUX * n.nouveaux;

    fideles = Math.max(
      0,
      fideles - versBaisse + redresses + rappeles + nouveaux + retoursFideles - perdus,
    );
    enBaisse = Math.max(0, enBaisse + versBaisse - departs - redresses - rappeles + retours);
    partis += departs + perdus - retours - retoursFideles;
    departsTotal += departs + perdus;
    retoursTotal += retours + retoursFideles;

    // La marge : les fidèles commandent tout, les artisans en baisse moins de la moitié.
    let activite = n.activite * (1 + 0.006 * w); // Le printemps.
    for (const a of actifs) activite *= a.imprevu.effet.activite ?? 1;
    const caFideles = fideles * CA_ARTISAN * activite;
    const caBaisse = enBaisse * CA_ARTISAN * PART_EN_BAISSE * activite;
    const ca = caFideles + caBaisse;
    let margeSemaine = ca * TAUX_MARGE;
    if (!(kaya && w >= 7)) margeSemaine += KAYA_MARGE * activite;

    // Ce que coûtent les actions de la semaine.
    if (d1 === 1 && w === 2) cout += COUTS.enquete;
    if (d1 === 0 && w === 3) cout += COUTS.pointsLancement;
    if (d1 === 0 && w >= 3) cout += COUTS.points * ca;
    if (d1 === 2 && w >= 2) cout += COUTS.enveloppe * caFideles * (1 / 3);
    if (d2 === 0 && w === 4) cout += COUTS.retraitExpressMiseEnPlace;
    if (d2 === 0 && w >= 4) cout += COUTS.retraitExpress;
    if (d2 === 1 && w >= 4) cout += COUTS.factures;
    if (d2 === 2 && w >= 4) cout += COUTS.remiseMatin * ca;
    if (d3 === 1 && w === 6) listeEnvoyee = aLaListe ? enBaisse : 120;
    if (d3 === 1 && w >= 6) {
      // Huit pour cent sur ce qu'achètent les destinataires ; sans liste, la moitié sont des fidèles.
      const caCible = aLaListe
        ? enBaisse * CA_ARTISAN * PART_EN_BAISSE
        : listeEnvoyee * CA_ARTISAN * (0.5 + 0.5 * PART_EN_BAISSE);
      cout += COUTS.remiseCiblee * caCible * activite;
    }
    if (d3 === 2 && w === 6) cout += COUTS.emailing;
    if (d4 === 0 && w >= 8) {
      cout += COUTS.remiseReconquete * Math.min(retoursTotal, 40) * CA_ARTISAN * PART_EN_BAISSE;
    }
    if (d5 === 0 && w >= 10) cout += COUTS.alignement * ca;
    if (d5 === 3 && w >= 10) cout += COUTS.alignement * caFideles * 0.3;
    if (d5 === 1 && w === 10) cout += COUTS.garantie;
    if (d5 === 1 && w >= 10) cout += COUTS.livraison;
    if (d6 === 1 && w === 12) cout += COUTS.alerteMiseEnPlace;
    if (d6 === 1 && w >= 12) cout += COUTS.alerte;
    if (d6 === 0 && w >= 12) cout += COUTS.remiseFin * ca;

    marge += margeSemaine;
    couts += cout;

    // Ce que vaut le portefeuille : en fin de trimestre, l'alerte fait mieux valoir ceux qui baissent.
    const suivi = d6 === 1 && w === SEMAINES;
    const valeurApres =
      fideles * VALEUR_FIDELE +
      enBaisse * (suivi ? VALEUR_EN_BAISSE_SUIVI : VALEUR_EN_BAISSE) +
      (kaya && w >= 7 ? 0 : KAYA_VALEUR);
    const contribution = margeSemaine - cout + valeurApres - valeurAvant;
    valeurAvant = valeurApres;

    semaines.push({
      fideles,
      enBaisse,
      actifs: fideles + enBaisse + (kaya && w >= 7 ? 0 : 1),
      departs: departs + perdus + (kaya && w === 7 ? 1 : 0),
      retours: retours + retoursFideles,
      attente,
      reclamations: (2 + 60 * erreurs) * (0.8 + 0.4 * (n.flux - 0.55)),
      margeSemaine,
      marge,
      cout,
      couts,
      contribution,
    });
  }

  const derniere = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: marge - couts + valeurAvant - BUDGET,
    marge,
    couts,
    valeurPortefeuille: valeurAvant,
    actifsFinal: derniere.actifs,
    enBaisseFinal: derniere.enBaisse,
    departsTotal: departsTotal + (kaya ? 1 : 0),
    retoursTotal,
    kayaPart: kaya,
    appelsTenus: tenus,
    appelsLances: d3 === 0,
    attenteFinale: derniere.attente,
  };
}

/** Ce qui s'est passé pendant des semaines : Kaya, les appels, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    kayaPart: t.kayaPart && dans(7),
    kayaReste: !t.kayaPart && dans(7),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureClients {
  actifs: number | null;
  enBaisse: number | null;
  reclamations: number | null;
  marge: number | null;
  couts: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  departs: number | null;
  attente: number | null;
  margeADate: number | null;
}

/** Ce qu'Arthur lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureClients {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      actifs: ACTIFS_DEPART,
      enBaisse: null,
      reclamations: 4.4,
      marge: 0,
      couts: 0,
      departs: 7,
      attente: attenteDeSaison(0),
      margeADate: 0,
    };
  }
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    actifs: s.actifs,
    // Kaya Rénovation est dans la liste tant qu'elle n'est pas partie.
    enBaisse: liste(chemin) && semaine >= 2 ? s.actifs - s.fideles : null,
    reclamations: s.reclamations,
    marge: s.marge,
    couts: s.couts,
    departs: s.departs,
    attente: s.attente,
    margeADate: (BUDGET_MARGE * semaine) / SEMAINES,
  };
}
