/**
 * LE QUAI DANGEREUX — le modèle de la plateforme logistique de Saint-Quentin-Fallavier.
 *
 * Quatorze caristes, une trentaine de préparateurs, les chauffeurs des
 * transporteurs sous-traitants qui chargent à quai ; treize semaines dont une
 * saison chargée, six décisions. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LES PRESQUE-ACCIDENTS ANNONCENT L'ACCIDENT. Un même danger produit
 *     beaucoup de presque-accidents, quelques accidents avec arrêt, et de
 *     temps en temps un accident grave (la pyramide de Bird). Chaque
 *     presque-accident déclaré PUIS ANALYSÉ supprime un peu du danger qui l'a
 *     produit ; un presque-accident classé ne supprime rien.
 *   · SANCTIONNER CELUI QUI DÉCLARE FAIT TAIRE LES SIGNAUX. La part des
 *     presque-accidents déclarés dépend de ce qui arrive à ceux qui
 *     déclarent. Une sanction ou une prime « zéro accident » font baisser les
 *     déclarations — le tableau de bord s'améliore — sans rien changer au
 *     danger, qu'on ne voit simplement plus. L'analyse ne vaut que ce que
 *     valent les déclarations qui la nourrissent.
 *   · LE DANGER SE TRAITE À LA SOURCE, ET LA CADENCE LE FAIT MONTER. Une
 *     consigne rappelée s'use en quelques semaines ; séparer physiquement les
 *     piétons des chariots retire durablement la moitié de l'exposition.
 *     Pousser la cadence (prime au rendement, double quai, retard qui
 *     s'accumule) multiplie les croisements pressés, donc le danger.
 *
 * L'accident grave n'est jamais certain : c'est un tirage, dont la
 * probabilité suit le danger semaine après semaine. Le trimestre est jugé en
 * euros : l'écart au budget de marge d'exploitation de la plateforme, en
 * comptant ce que coûtent les retards de chargement, les accidents, les
 * arrêts et l'activité interrompue. La sécurité n'y est pas une contrainte
 * morale posée à côté du résultat : elle en fait partie.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CARISTES = 14;
/** Heures de chargement par semaine : deux équipes, cinq jours. */
export const HEURES = 78;
/** Palettes chargées par heure, tous caristes présents, sans pression particulière. */
export const CADENCE_NOMINALE = 112;
export const CADENCE_DEPART = 106;
/** Palettes à charger par semaine, hors saison. */
export const DEMANDE = 8300;
/** La saison du bâtiment : la demande monte des semaines 6 à 11. */
export const SAISON = { de: 6, a: 11, hausse: 0.1 } as const;
/** Ce que la plateforme facture aux agences par palette chargée, une fois ses frais fixes couverts. */
export const MARGE_PALETTE = 7;
/** Le budget de marge d'exploitation du trimestre. */
export const BUDGET = 705000;
/** Chaque palette en attente coûte, par semaine : affrètements refaits, agences en rupture. */
export const PENALITE_RETARD = 1.5;
/** En fin de trimestre, une palette non chargée a souvent été achetée ailleurs. */
export const PENALITE_FIN = 3;
export const OBJECTIF_RETARD = 500;
/** L'indice de risque que la responsable QHSE juge acceptable. */
export const OBJECTIF_RISQUE = 30;
/** L'enveloppe prévention du trimestre. */
export const ENVELOPPE = 20000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, des camions attendent faute de créneaux replanifiés. */
export const PERTE_PAR_JOUR = 1200;

/** Ce qu'un accident avec arrêt coûte : complément de salaire, remplacement, cotisations. */
export const COUT_ACCIDENT = 6000;
/** Ce qu'un accident grave coûte, hors activité perdue : arrêt long, enquête, cotisations AT/MP. */
export const COUT_GRAVE = 150000;
/** La faute inexcusable de l'employeur, quand le cariste en cause n'était pas habilité. */
export const SURCOUT_FAUTE = 60000;

/** Le danger de départ, sans mesure : 1 vaut un indice de risque de 50. */
const DANGER_BASE = 1;
/** Le danger des camions qui avancent pendant le chargement, en saison, sans cales ni feux de quai. */
const DANGER_CAMION = 0.4;
const INDICE_PAR_DANGER = 50;
/** Presque-accidents réels par semaine, pour un danger de 1. */
const PRESQUE_PAR_DANGER = 5;
const P_ACCIDENT = 0.08;
/** Dommages matériels par semaine, pour un danger de 1, et ce que chacun coûte. */
const DOMMAGES_PAR_DANGER = 4;
const COUT_DOMMAGE = 700;
/** En saison, plus de camions et d'intérimaires aux quais : plus de croisements, sauf flux séparés. */
const AFFLUENCE = 1.25;
/** Le surcroît de pression des vagues de commandes en saison. */
const PIC_DE_SAISON = 1.15;
const P_GRAVE = 0.0155;
export const TAUX_DECLARATION_DEPART = 0.28;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  presque: 0,
  dylan: 1,
  flux: 2,
  saison: 3,
  retour: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 1, 3, 3, 3, 3] as const;

export const COUTS = {
  marquage: 2500,
  quartDHeure: 400,
  recyclage: 900,
  separation: 7000,
  gilets: 1200,
  protocole: 300,
  primeRendement: 1800,
  samedi: 3600,
  challenge: 3000,
  analyse: 300,
  audit: 3000,
  doubleQuai: 4500,
  prestataire: 4000,
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
  effet: { demande?: number; capacite?: number; danger?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chariots",
    titre: "Deux chariots en panne",
    de: "Maintenance des chariots",
    role: "Prestataire",
    texte:
      "Deux chariots frontaux sont immobilisés : la pièce de mât est attendue sous dix jours. Les autres caristes se partagent les quais.",
    duree: 2,
    effet: { capacite: 0.93 },
  },
  {
    id: "verglas",
    titre: "Verglas sur la cour",
    de: "Thierry Gomez",
    role: "Chef d'équipe quais",
    texte:
      "La cour a gelé cette nuit : les chariots glissent en sortie de remorque, et les chauffeurs marchent au milieu des allées pour éviter les plaques.",
    duree: 1,
    effet: { capacite: 0.95, danger: 1.25 },
  },
  {
    id: "informatique",
    titre: "Panne du logiciel d'entrepôt",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel d'entrepôt est tombé une journée et demie : les bons de chargement sont repassés à la main.",
    duree: 1,
    effet: { capacite: 0.86 },
  },
  {
    id: "chantier",
    titre: "Commande exceptionnelle d'un grand chantier",
    de: "Léo Chaumet",
    role: "Planificateur transport",
    texte:
      "Un grand compte lance un chantier d'hôpital : 1 400 palettes de plus à charger cette semaine, en plus du reste.",
    duree: 1,
    effet: { demande: 1.17 },
  },
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Ressources humaines",
    role: "Plateforme de Saint-Quentin-Fallavier",
    texte:
      "La grippe touche la plateforme : trois caristes absents en moyenne pendant deux semaines.",
    duree: 2,
    effet: { capacite: 0.91 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  capacite: number;
  /** Les presque-accidents réels de la semaine, autour de ce que le danger produit. */
  presque: number;
  /** L'arrondi des déclarations : 2,6 déclarations attendues font 2 ou 3. */
  arrondi: number;
  arrondiCamion: number;
  /** Un accident avec arrêt arrive-t-il ? Comparé à une probabilité qui suit le danger. */
  uAccident: number;
  /** Un accident grave arrive-t-il ? */
  uGrave: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Si un accident grave arrive, est-ce Dylan qui conduisait ? */
  uAuteur: number;
  /** Les agences acceptent-elles de lisser leurs commandes ? */
  uLissage: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 86028121 + 3);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.12, Math.max(0.9, 1 + 0.04 * gauss(r))),
      capacite: Math.min(1.06, Math.max(0.94, 1 + 0.02 * gauss(r))),
      presque: Math.min(1.5, Math.max(0.5, 1 + 0.2 * gauss(r))),
      arrondi: r(),
      arrondiCamion: r(),
      uAccident: r(),
      uGrave: r(),
    });
  }
  const uAuteur = r();
  const uLissage = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uAuteur, uLissage, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Six fois sur dix, les agences acceptent de lisser leurs commandes de saison. */
export const lissageAccepte = (chemin: readonly number[], graine: number) =>
  chemin[D.saison] === 2 && hasard(graine).uLissage < 0.6;

/** Dylan, intérimaire au CACES expiré, conduit-il sans habilitation cette semaine ? */
export const dylanSansHabilitation = (chemin: readonly number[], w: number) =>
  w <= 2 || chemin[D.dylan] === 1;

/** Quatre fois sur dix, si un accident grave arrive pendant qu'il conduit, c'est lui. */
const PART_DE_DYLAN = 0.4;

/**
 * La part des presque-accidents qui sont déclarés : elle dépend de ce qui
 * arrive à ceux qui déclarent. Une sanction la divise par près de trois ; une
 * analyse sans recherche de coupable, suivie d'effets visibles, la double.
 */
export function tauxDeDeclaration(chemin: readonly number[], w: number): number {
  const [d1, , , , d5] = chemin;
  let taux = TAUX_DECLARATION_DEPART;
  if (w >= 2) {
    if (d1 === 0) taux = 0.1;
    if (d1 === 1) taux = 0.3;
    if (d1 === 2) taux = 0.5;
    if (d1 === 3) taux = 0.22;
  }
  if (w >= 9) {
    if (d5 === 0) taux *= 0.4;
    if (d5 === 1) taux = Math.min(0.8, taux + 0.2);
  }
  return taux;
}

/**
 * Ce que l'analyse de la semaine 8 retire du danger des camions : elle ne
 * trouve que ce qui a été déclaré. Quand une fiche sur deux remonte, les
 * camions qui avancent pendant le chargement apparaissent vite, et des cales
 * et des feux de quai règlent l'essentiel ; quand une sur dix remonte, le
 * danger reste presque entier.
 */
export const traitementDesCamions = (taux: number) => Math.min(0.85, 1.6 * taux);

/** Une consigne rappelée : un effet net la première semaine, qui s'use ensuite. */
const consigne = (w: number, depuis: number) =>
  w >= depuis ? 1 - 0.15 * Math.pow(0.6, w - depuis) : 1;

export type Semaine = {
  /** L'indice de risque relevé aux quais : 50 pour le danger de départ. */
  risque: number;
  /** Presque-accidents déclarés dans la semaine. */
  declares: number;
  /** Presque-accidents déclarés depuis le début du trimestre. */
  declaresCumul: number;
  /** Ceux d'entre eux qui parlent d'un camion qui bouge pendant le chargement. */
  declaresCamion: number;
  /** Accidents avec arrêt depuis le début du trimestre, accident grave compris. */
  accidents: number;
  /** Palettes chargées par heure de quai. */
  cadence: number;
  /** Palettes à charger en attente en fin de semaine. */
  retard: number;
  /** Dépenses de prévention cumulées depuis le début du trimestre. */
  securite: number;
  /** Ce que la semaine a apporté à la marge : palettes chargées, moins tous ses coûts. */
  contribution: number;
  /** 1 si l'accident grave est arrivé cette semaine. */
  grave: number;
  danger: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge d'exploitation, accidents et retards compris : positif, au-dessus du budget. */
  objectif: number;
  marge: number;
  /** La semaine de l'accident grave, 0 s'il n'y en a pas eu. */
  semaineGrave: number;
  /** Le cariste en cause dans l'accident grave n'était pas habilité. */
  faute: boolean;
  /** Les semaines des accidents avec arrêt (hors accident grave). */
  accidentsLegers: readonly number[];
  lissageAccepte: boolean;
  /** La part du danger des camions que l'analyse a retirée en semaine 9. */
  camionsTraites: number;
  declaresTotal: number;
  risqueFinal: number;
  retardFinal: number;
  securite: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const lisse = lissageAccepte(chemin, graine);
  const separe = (w: number) => d3 === 0 && w >= 7;
  const attente = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const semaines: (Semaine | null)[] = [null];
  let retard = 0;
  let correction = 0;
  let camionsTraites = 0;
  let declaresCumul = 0;
  let declaresCamion = 0;
  let accidents = 0;
  let securite = 0;
  let semaineGrave = 0;
  let faute = false;
  const legers: number[] = [];
  let marge = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const saison = w >= SAISON.de && w <= SAISON.a;
    const pic = w >= 7 && w <= 11; // Les semaines que la décision de saison couvre.
    let cout = w === 1 ? attente : 0;

    // Ce qu'il y a à charger.
    let demande = DEMANDE * (saison ? 1 + SAISON.hausse : 1) * n.demande;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;

    // Ce que les quais peuvent charger.
    let heures = HEURES;
    let cadence = CADENCE_NOMINALE * n.capacite;
    if (d1 === 1 && w === 1) cadence *= 0.98; // Le quart d'heure à chaque prise de poste.
    if (d1 === 2 && w === 2) cadence *= 0.98; // Le temps de prendre l'allée provisoire.
    if (d2 === 0 && (w === 3 || w === 4)) cadence *= 0.98; // Dylan en préparation, puis en formation.
    if (d2 === 2 && (w === 3 || w === 4)) cadence *= 0.95; // Un cariste de moins, le temps que l'agence envoie quelqu'un.
    if (d3 === 0 && w === 6) cadence *= 0.97; // L'installation des séparations.
    if (separe(w)) cadence *= 1.01; // Moins d'arrêts pour laisser passer un piéton.
    if (pic) {
      if (d4 === 0) cadence *= 1.06;
      if (d4 === 1) heures += 5;
      if (d4 === 2) cadence *= lisse ? 1.05 : 1.015; // Moins de camions en même temps à quai.
    }
    if (w >= 11) {
      if (d6 === 1) cadence *= 1.12;
      if (d6 === 2) cadence *= 1.1;
    }
    for (const a of actifs) cadence *= a.imprevu.effet.capacite ?? 1;
    const capaciteBrute = cadence * heures;

    // LA PRESSION : le retard qui s'accumule, et ce qu'on demande aux quais pour le rattraper.
    const tension = (demande + retard) / capaciteBrute;
    let pression = 1 + 0.6 * borne(tension - 1, 0, 0.5);
    // En saison, les commandes arrivent par vagues : le lundi et le mardi, tout le monde court.
    let vagues = saison ? PIC_DE_SAISON : 1;
    if (pic) {
      if (d4 === 0) pression *= 1.25;
      if (d4 === 1) vagues = 0.95; // Le samedi absorbe les vagues, un animateur sécurité encadre.
      if (d4 === 2) vagues = lisse ? 1 : 1.1;
    }
    pression *= vagues;
    if (w >= 11) {
      if (d6 === 1) pression *= 1.2;
      if (d6 === 2) pression *= 1.15;
    }
    let aleas = 1;
    for (const a of actifs) aleas *= a.imprevu.effet.danger ?? 1;

    // LE DANGER DES CROISEMENTS : piétons et chariots, et ce qui les sépare.
    let exposition = separe(w) ? 0.4 : (d1 === 2 ? 0.8 : 1) * (saison ? AFFLUENCE : 1);
    if (d1 === 0 || d1 === 1) exposition *= consigne(w, 1);
    if (d3 === 1) exposition *= consigne(w, 5);
    if (d3 === 2 && w >= 5) exposition *= 0.85; // Les chauffeurs ne traversent plus la zone de manœuvre.
    if (d6 === 1 && w >= 11) exposition *= 1.35; // Deux camions par quai : on charge entre deux remorques.
    let competence = dylanSansHabilitation(chemin, w) ? 1.4 : 1;
    if (d2 === 2 && w >= 5 && w <= 7) competence = 1.1; // Le remplaçant découvre le site.
    // Des flux séparés, c'est aussi une cadence pressée qui croise moins de piétons.
    const presse = separe(w) ? 1 + (pression - 1) * 0.5 : pression;
    const croisements = exposition * competence * presse * aleas * (1 - correction);

    // LE DANGER DES CAMIONS : en saison, des chauffeurs nouveaux qui avancent pendant le chargement.
    const camions = w >= 7 ? DANGER_CAMION * pression * (1 - camionsTraites) : 0;
    const danger = DANGER_BASE * croisements + camions;

    // Les signaux : les presque-accidents réels, et la part qui en est déclarée.
    const taux = tauxDeDeclaration(chemin, w);
    const declaresCroisements = Math.floor(
      PRESQUE_PAR_DANGER * croisements * n.presque * taux + n.arrondi,
    );
    const declaresCamions = Math.floor(
      PRESQUE_PAR_DANGER * camions * n.presque * taux + n.arrondiCamion,
    );
    const declares = declaresCroisements + declaresCamions;
    // Le milieu de la pyramide : palettes renversées, portes de quai et racks heurtés.
    const casse = DOMMAGES_PAR_DANGER * danger * n.presque * COUT_DOMMAGE;
    cout += casse;
    declaresCumul += declares;
    declaresCamion += declaresCamions;

    // Les accidents : la base de la pyramide, puis son sommet.
    let arret = 1;
    if (n.uAccident < P_ACCIDENT * danger) {
      accidents += 1;
      legers.push(w);
      cout += COUT_ACCIDENT;
    }
    if (!semaineGrave && n.uGrave < P_GRAVE * danger) {
      semaineGrave = w;
      accidents += 1;
      arret = 0.7; // Les quais 3 à 6 arrêtés deux jours pour l'enquête.
      cout += COUT_GRAVE;
      if (dylanSansHabilitation(chemin, w) && h.uAuteur < PART_DE_DYLAN) {
        faute = true;
        cout += SURCOUT_FAUTE;
      }
    }

    // Ce qui est chargé, et ce qui attend.
    const capacite = capaciteBrute * arret;
    const aCharger = retard + demande;
    const chargees = Math.min(aCharger, capacite);
    retard = aCharger - chargees;
    const apport = chargees * MARGE_PALETTE;
    let penalite = retard * PENALITE_RETARD;
    if (pic && d4 === 2) penalite *= lisse ? 0.5 : 0.85;
    if (w >= 11 && d6 === 0) penalite *= 0.4;
    if (w === SEMAINES) penalite += retard * PENALITE_FIN * (d6 === 0 ? 0.3 : 1);

    // Ce qui a été déclaré puis analysé corrige le danger des semaines suivantes.
    const analyse = d1 === 2 || (d5 === 1 && w >= 9) ? 0.015 : 0.005;
    correction = Math.min(0.4, correction + analyse * declaresCroisements);
    if (d5 === 1 && w === 8) {
      // On reprend toutes les fiches du trimestre, en quart d'heure sécurité.
      camionsTraites = traitementDesCamions(taux);
      correction = Math.min(0.4, correction + 0.004 * declaresCumul);
    }
    if (d5 === 2 && w === 9) {
      // Le rapport de l'auditeur : il voit ce qu'on ne lui a pas déclaré, mais une fois.
      camionsTraites = 0.75;
      correction = Math.min(0.4, correction + 0.05);
    }

    // Ce que la semaine a coûté en prévention et en organisation.
    let depense = 0;
    if (d1 === 1 && w === 1) depense += COUTS.quartDHeure;
    if (d1 === 2 && w === 1) depense += COUTS.marquage;
    if (d2 === 0 && w === 4) depense += COUTS.recyclage;
    if (d3 === 0 && w === 6) depense += COUTS.separation;
    if (d3 === 1 && w === 5) depense += COUTS.gilets;
    if (d3 === 2 && w === 5) depense += COUTS.protocole;
    if (d5 === 1 && w >= 9) depense += COUTS.analyse;
    if (d5 === 2 && w === 9) depense += COUTS.audit;
    securite += depense;
    let organisation = 0;
    if (pic && d4 === 0) organisation += COUTS.primeRendement;
    if (pic && d4 === 1) organisation += COUTS.samedi;
    if (w === SEMAINES && d5 === 0) organisation += COUTS.challenge;
    if (w >= 11 && d6 === 1) organisation += COUTS.doubleQuai;
    if (w >= 11 && d6 === 2) organisation += COUTS.prestataire;

    cout += penalite + depense + organisation;
    marge += apport - cout;

    semaines.push({
      risque: danger * INDICE_PAR_DANGER,
      declares,
      declaresCumul,
      declaresCamion,
      accidents,
      cadence: chargees / heures,
      retard,
      securite,
      contribution: apport - cout,
      grave: semaineGrave === w ? 1 : 0,
      danger,
    });
  }

  return {
    semaines,
    objectif: marge - BUDGET,
    marge,
    semaineGrave,
    faute,
    accidentsLegers: legers,
    lissageAccepte: lisse,
    camionsTraites,
    declaresTotal: declaresCumul,
    risqueFinal: semaines[SEMAINES]!.risque,
    retardFinal: retard,
    securite,
  };
}

/** Ce qui s'est passé pendant des semaines : accidents, et imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    grave: dans(t.semaineGrave) ? t.semaineGrave : 0,
    faute: t.faute && dans(t.semaineGrave),
    accidents: t.accidentsLegers.filter(dans),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureQuai {
  declares: number | null;
  accidents: number | null;
  cadence: number | null;
  risque: number | null;
  securite: number | null;
  retard: number | null;
  camions: number | null;
  enveloppeADate: number | null;
}

/** Ce que Agathe Bonnefoy lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureQuai {
  if (semaine === 0) {
    return {
      declares: 0,
      accidents: 0,
      cadence: CADENCE_DEPART,
      // Ce matin : Dylan conduit sans habilitation, et rien n'a encore été fait.
      risque: DANGER_BASE * 1.32 * INDICE_PAR_DANGER,
      securite: 0,
      retard: 0,
      camions: 0,
      enveloppeADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    declares: s.declaresCumul,
    accidents: s.accidents,
    cadence: s.cadence,
    risque: s.risque,
    securite: s.securite,
    retard: s.retard,
    camions: s.declaresCamion,
    enveloppeADate: (ENVELOPPE * semaine) / SEMAINES,
  };
}
