/**
 * LE PIC DES FÊTES — le modèle des lignes desserts de la Laiterie de Kerbrélan.
 *
 * Usine de Loudéac, lignes 5 et 6 : les crèmes desserts et les riz au lait.
 * D'octobre à décembre, treize semaines, six décisions. En décembre, les
 * ventes de desserts doublent ; les deux lignes, en 2×8 du lundi au vendredi,
 * ne sortent que ce qu'il faut en octobre. Quatre mécanismes font l'épisode,
 * et le joueur doit les découvrir :
 *
 *   · LE BESOIN SE COMPTE EN HEURES DE LIGNE. Ce qu'il faudra produire chaque
 *     semaine de décembre, divisé par ce qu'une ligne sort vraiment en une
 *     heure (sa cadence nominale multipliée par son TRS), moins les heures que
 *     les équipes en place assurent déjà : 130 heures de ligne par semaine au
 *     pic, soit six personnes pour chacune. C'est ce trou qu'il faut combler,
 *     et le nombre d'intérimaires, de volontaires ou d'heures se déduit de lui.
 *   · LA DLC INTERDIT DE STOCKER LE PIC. Un dessert frais a 28 jours de DLC,
 *     et les centrales exigent d'en recevoir au moins les deux tiers : un pot
 *     doit quitter l'usine au plus huit jours après sa fabrication. Produire
 *     d'avance n'est donc possible que d'une semaine, et dans la limite de la
 *     chambre froide ; au-delà, les centrales refusent le produit, qui est
 *     déclassé (vendu à un soldeur) : la matière et les heures sont perdues.
 *   · UN INTÉRIMAIRE VAUT CE QU'ON A PRÉPARÉ POUR LUI. Commandés début octobre,
 *     les intérimaires arrivent presque tous, sont formés deux semaines avant le
 *     pic et restent. Commandés fin novembre, quand toutes les usines du bassin
 *     recrutent, l'agence n'en trouve qu'un sur deux ; ils arrivent sans
 *     formation, sont lents, et partent : un sur deux l'an dernier. Le tutorat
 *     et des postes simples divisent les départs par deux.
 *   · UN DÉBUTANT SUR UN POSTE À RISQUE, C'EST UN ACCIDENT OU UN LOT REBUTÉ.
 *     Conduite de la thermoformeuse, préparation des mix, produits de NEP : un
 *     intérimaire non formé y fait un accident ou un défaut de scellage tiré au
 *     hasard, d'autant plus souvent qu'ils sont nombreux à y être. La fatigue
 *     des permanents à qui l'on impose des heures fait de même, et des absences.
 *
 * Les leviers de la capacité humaine se combinent : l'aménagement du temps de
 * travail prévu par l'accord d'entreprise (40 heures en décembre, récupérées en
 * janvier), le décalage des congés de Noël au volontariat, une équipe de
 * suppléance du week-end (volontaires, majorée de 50 %, qui demande l'avis du
 * CSE : l'avis est tiré au hasard, et il dépend de la concertation), les
 * intérimaires recrutés tôt, et le regroupement des petites séries, qui rend
 * des heures de ligne perdues en changements de format.
 *
 * Le trimestre est jugé en euros : la MARGE des desserts livrés pendant le pic
 * (semaines 8 à 13, prix de cession moins matières et emballages), moins les
 * ruptures du trimestre (pénalités logistiques et ventes perdues), la casse,
 * les heures majorées, l'intérim, les accidents et les rebuts. Les salaires
 * des permanents n'y entrent pas : ils sont payés quoi qu'on décide.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La première semaine du pic : celle du lundi 23 novembre. */
export const PIC = 8;

/* ---------------------------------------------------------------------------
 * LES LIGNES ET LE BESOIN.
 * ------------------------------------------------------------------------- */
export const LIGNES = 2;
/** Pots par heure, machine lancée, sur chaque ligne. */
export const CADENCE_NOMINALE = 7200;
/** Le taux de rendement synthétique moyen des deux lignes sur douze mois. */
export const TRS = 0.625;
/** Ce qu'une ligne sort vraiment en une heure : 4 500 pots. */
export const CADENCE = CADENCE_NOMINALE * TRS;
/** Les heures de production d'un poste, une fois le nettoyage en place fait. */
export const HEURES_PAR_POSTE = 7.5;
/** Deux lignes, deux postes, cinq jours : 150 heures de ligne par semaine. */
export const HEURES_BASE = LIGNES * 2 * 5 * HEURES_PAR_POSTE;
/** Les personnes qu'une ligne en marche mobilise. */
export const EQUIPAGE = 6;
/** Les permanents des lignes 5 et 6. */
export const PERMANENTS = 28;

/** Les ventes d'une semaine d'octobre, en pots. */
export const VENTES_OCTOBRE = 630000;
/** Les ventes de chaque semaine, rapportées à octobre : le double au pic. */
export const PROFIL = [0, 1, 0.99, 1, 1.01, 1.02, 1.03, 1.05, 1.55, 1.7, 1.9, 2, 2, 1.5] as const;
export const ventesPrevues = (w: number) => VENTES_OCTOBRE * PROFIL[w]!;
/** Les heures de ligne qu'une semaine demande. */
export const besoinEnHeures = (pots: number) => pots / CADENCE;
/** Ce qui manque par semaine au pic de décembre : la prévision de la semaine 1. */
export const besoinDuPic = () => besoinEnHeures(ventesPrevues(11)) - HEURES_BASE;
export const BESOIN_PIC = besoinDuPic();

/* ---------------------------------------------------------------------------
 * LA DLC.
 * ------------------------------------------------------------------------- */
export const DLC = 28;
/** La part de DLC que les centrales exigent à réception. */
export const PART_EXIGEE = 2 / 3;
export const JOURS_DE_TRANSPORT = 1;
/** L'âge maximal d'un pot au départ de l'usine : 8 jours. */
export const AGE_MAX = Math.floor(DLC * (1 - PART_EXIGEE) - JOURS_DE_TRANSPORT);
/** Ce que la chambre froide de l'usine peut garder d'avance, en pots. */
export const CHAMBRE_FROIDE = 300000;

/* ---------------------------------------------------------------------------
 * LES PRIX ET LES COÛTS.
 * ------------------------------------------------------------------------- */
export const PRIX_CESSION = 0.34;
/** Matières (lait, crème, sucre, riz) et emballages, par pot. */
export const COUT_VARIABLE = 0.23;
export const MARGE = PRIX_CESSION - COUT_VARIABLE;
/** La pénalité logistique des enseignes : 15 % du prix de cession par pot manquant. */
export const TAUX_PENALITE = 0.15;
export const PENALITE = PRIX_CESSION * TAUX_PENALITE;
/** Ce qu'une heure de ligne manquante coûte au pic : marge perdue et pénalité. */
export const VALEUR_HEURE = CADENCE * (MARGE + PENALITE);
/** Un pot refusé pour fraîcheur est vendu à un soldeur. */
export const PRIX_SOLDEUR = 0.08;
export const CASSE = COUT_VARIABLE - PRIX_SOLDEUR;

/** L'heure d'un permanent, charges comprises, et ses majorations. */
export const TAUX_HORAIRE = 26;
export const MAJORATION_SUP = 1.25;
export const MAJORATION_WEEKEND = 1.5;
/** L'heure d'intérimaire facturée par l'agence. */
export const TAUX_INTERIM = 28;
export const HEURES_SEMAINE = 35;
export const SEMAINE_INTERIM = HEURES_SEMAINE * TAUX_INTERIM;
/** Ce que coûte une heure de ligne faite en heures supplémentaires : six personnes majorées. */
export const coutHeureDeLigne = (majoration: number) => EQUIPAGE * TAUX_HORAIRE * majoration;

/** Un accident du travail avec arrêt : arrêt de ligne, enquête, remplacement, cotisation AT/MP. */
export const COUT_ACCIDENT = 22000;
/** Un lot mal scellé : bloqué, détruit, et refait. */
export const LOT = 36000;
export const COUT_REBUT = LOT * COUT_VARIABLE;
export const HEURES_REBUT = LOT / CADENCE;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : les meilleurs intérimaires du bassin partent ailleurs. */
export const PERTE_PAR_JOUR = 2500;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = { interim: 0, temps: 1, weekend: 2, avance: 3, postes: 4, noel: 5 } as const;

export const O = {
  interim: { finNovembre: 0, tot: 1, octobre: 2, sansFormation: 3 },
  temps: { modulation: 0, refus: 1, rien: 2, volontaires: 3 },
  weekend: { suppleance: 0, imposer: 1, samedi: 2, rien: 3 },
  avance: { rien: 0, uneSemaine: 1, troisSemaines: 2 },
  postes: { tous: 0, tutorat: 1, surLeTas: 2 },
  noel: { imposer: 0, series: 1, rien: 2, agence: 3 },
} as const;

/** Faire comme chaque année, décision par décision. */
export const NEUTRE = [0, 2, 3, 0, 2, 2] as const;

/** Les intérimaires commandés à l'agence en octobre. */
export const COMMANDE = 10;
/** Appelée fin novembre, l'agence reçoit la même demande que l'an dernier : 18. */
export const COMMANDE_TARDIVE = 18;
/** Ceux qu'on redemande pour Noël, et ce que l'agence en trouve alors. */
export const COMMANDE_NOEL = 8;

/** Ce que chaque manière de recruter donne : arrivée, part pourvue, rendement, départs. */
export const RECRUTEMENT = {
  /** Commandés début octobre, arrivés le 9 novembre, formés deux semaines : l'agence a encore le choix. */
  tot: { arrivee: 6, pourvu: [0.85, 1], depart: 0.03, debut: 0, plafond: 0.9 },
  /** Commandés début octobre, arrivés le 23 novembre, formés sur la ligne. */
  sansFormation: { arrivee: 8, pourvu: [0.7, 0.9], depart: 0.15, debut: 0.4, plafond: 0.85 },
  /** Appelés fin novembre, arrivés le 30, quand toutes les usines recrutent : ceux qui restent. */
  finNovembre: { arrivee: 9, pourvu: [0.3, 0.6], depart: 0.16, debut: 0.4, plafond: 0.75 },
  /** Redemandés pour Noël. */
  noel: { arrivee: 12, pourvu: [0.15, 0.45], depart: 0.16, debut: 0.4, plafond: 0.75 },
} as const;
/** La formation de deux semaines : formateur, accueil sécurité, équipements. */
export const COUT_FORMATION = 3500;

/** L'accord d'entreprise de 2021 : jusqu'à 40 heures par semaine, sans majoration, récupérées en janvier. */
export const HEURES_MODULEES = 40;
export const MODULATION = HEURES_BASE * (HEURES_MODULEES / HEURES_SEMAINE - 1);
/** Les congés posés entre le 21 décembre et le 3 janvier (semaines 12 et 13). */
export const CONGES_POSES = 8;
/** Ceux qui décaleraient en janvier contre une prime. */
export const CONGES_DECALABLES = 6;
export const PRIME_DECALAGE = 200;
export const heuresDeConges = (absents: number) => (HEURES_BASE * absents) / PERMANENTS;
/** Les heures supplémentaires de décembre, quand on les demande : 15 heures de ligne par semaine. */
export const HEURES_SUP_DECEMBRE = 15;

/** L'équipe de suppléance : deux jours de 11 heures de production sur les deux lignes. */
export const HEURES_WEEKEND = LIGNES * 2 * 11;
export const HEURES_SAMEDI = LIGNES * 11;
/** Douze volontaires pour deux lignes, en postes de 12 heures le samedi et le dimanche. */
export const VOLONTAIRES_REQUIS = 2 * EQUIPAGE;
export const VOLONTAIRES = 15;
/** Quand on a refusé les congés de Noël, les volontaires se font rares. */
export const VOLONTAIRES_APRES_REFUS = 8;
export const COUT_SUPPLEANCE = VOLONTAIRES_REQUIS * 24 * TAUX_HORAIRE * MAJORATION_WEEKEND;
export const COUT_SAMEDI = VOLONTAIRES_REQUIS * 12 * TAUX_HORAIRE * MAJORATION_SUP;
/** Les week-ends de décembre, du 5-6 au 26-27 : semaines 9 à 12. */
export const WEEKENDS = [9, 10, 11, 12] as const;
/** Le CSE rend un avis favorable environ trois fois sur quatre quand on l'a associé tôt. */
export const CHANCE_AVIS_FAVORABLE = 0.75;

/** La location d'une chambre froide chez Transports Kerfroid, par semaine. */
export const LOCATION_KERFROID = 2500;
/** Produire d'avance en octobre : les samedis du 31 octobre au 21 novembre (semaines 4 à 7). */
export const SAMEDIS_OCTOBRE = [4, 7] as const;

/** Les changements de format de décembre : 24 par semaine, 75 minutes chacun, NEP compris. */
export const CHANGEMENTS = 24;
export const CHANGEMENTS_REGROUPES = 8;
export const MINUTES_PAR_CHANGEMENT = 75;
export const HEURES_REGAGNEES =
  ((CHANGEMENTS - CHANGEMENTS_REGROUPES) * MINUTES_PAR_CHANGEMENT) / 60;
/** Les heures que les permanents font en plus, imposées, les deux semaines avant Noël. */
export const HEURES_IMPOSEES_NOEL = (PERMANENTS * 6) / EQUIPAGE;

/** Les intérimaires partout : des permanents libérés pour la nuit et le week-end. */
export const HEURES_LIBEREES = 4;
/** Le tutorat : un tuteur pour quatre, une prime de tutorat, une demi-journée d'accueil sécurité. */
export const PRIME_TUTEUR = 80;
export const ACCUEIL_SECURITE = 1200;

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
  effet: { heures?: number; absence?: number; demande?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "doseur",
    titre: "Panne du doseur de la ligne 6",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le doseur de la ligne 6 a cassé mardi : pièce commandée en Italie, deux jours et demi d'arrêt. Dix-huit heures de ligne perdues.",
    duree: 1,
    effet: { heures: -18 },
  },
  {
    id: "gastro",
    titre: "Épidémie de gastro-entérite",
    de: "Thècle Kergoat",
    role: "Chargée des ressources humaines",
    texte:
      "La gastro-entérite fait le tour de l'atelier : huit pour cent des permanents absents pendant deux semaines.",
    duree: 2,
    effet: { absence: 0.08 },
  },
  {
    id: "opercules",
    titre: "Opercules livrés en retard",
    de: "Azilis Cozic",
    role: "Responsable emballages et développement",
    texte:
      "Le fournisseur d'opercules a livré avec trois jours de retard : les lignes ont tourné au ralenti, dix heures de ligne perdues.",
    duree: 1,
    effet: { heures: -10 },
  },
  {
    id: "opaline",
    titre: "Opaline avance une opération",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Opaline a avancé d'une semaine une mise en avant de nos crèmes desserts : huit pour cent de commandes en plus cette semaine-là.",
    duree: 1,
    effet: { demande: 1.08 },
  },
  {
    id: "tempete",
    titre: "Tempête et coupure de courant",
    de: "Djibril Ouedraogo",
    role: "Responsable énergie et travaux neufs",
    texte:
      "La tempête a coupé le courant six heures : redémarrage, nettoyage en place complet des deux lignes, douze heures de ligne perdues.",
    duree: 1,
    effet: { heures: -12 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** L'écart des commandes à la prévision. */
  demande: number;
}

/** Le plus d'intérimaires présents en même temps : la commande, puis les renforts de Noël. */
const PLACES = 24;

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La part de la commande que l'agence pourvoit. */
  uPourvu: number;
  uPourvuNoel: number;
  /** Les départs : [intérimaire][semaine]. */
  uDepart: readonly (readonly number[])[];
  /** Un accident d'intérimaire, un lot rebuté, un accident de permanent : par semaine. */
  uAccident: readonly number[];
  uRebut: readonly number[];
  uAccidentPermanent: readonly number[];
  /** L'avis du CSE sur l'équipe de suppléance. */
  uAvis: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001153 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    const ecart = w >= PIC ? 0.045 : 0.015;
    semaines.push({ demande: Math.min(1.1, Math.max(0.9, 1 + ecart * gauss(r))) });
  }
  const uPourvu = r();
  const uPourvuNoel = r();
  const uDepart = Array.from({ length: PLACES }, () =>
    Array.from({ length: SEMAINES + 1 }, () => r()),
  );
  const uAccident = Array.from({ length: SEMAINES + 1 }, () => r());
  const uRebut = Array.from({ length: SEMAINES + 1 }, () => r());
  const uAccidentPermanent = Array.from({ length: SEMAINES + 1 }, () => r());
  const uAvis = r();
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
    uPourvu,
    uPourvuNoel,
    uDepart,
    uAccident,
    uRebut,
    uAccidentPermanent,
    uAvis,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** L'avis du CSE ne dépend que du hasard du trimestre : seule la demande compte. */
export const avisFavorable = (graine: number) => hasard(graine).uAvis < CHANCE_AVIS_FAVORABLE;
/** L'équipe de suppléance existe-t-elle ? Il faut l'avoir proposée, et un avis favorable. */
export const suppleanceCreee = (chemin: readonly number[], graine: number) =>
  chemin[D.weekend] === O.weekend.suppleance && avisFavorable(graine);
/** Les volontaires du week-end, selon ce qu'on a fait des congés de Noël. */
export const volontaires = (chemin: readonly number[]) =>
  chemin[D.temps] === O.temps.refus ? VOLONTAIRES_APRES_REFUS : VOLONTAIRES;
/** La part des postes du week-end que les volontaires tiennent. */
export const partTenue = (chemin: readonly number[]) =>
  Math.min(1, volontaires(chemin) / VOLONTAIRES_REQUIS);

/** Ce qu'on demande à l'agence, selon le moment de la commande. */
export const commandeDe = (mode: keyof typeof RECRUTEMENT) =>
  mode === "finNovembre" ? COMMANDE_TARDIVE : mode === "noel" ? COMMANDE_NOEL : COMMANDE;

/** Combien d'intérimaires l'agence envoie, selon le moment de la commande. */
export function interimairesPourvus(mode: keyof typeof RECRUTEMENT, u: number): number {
  const [bas, haut] = RECRUTEMENT[mode].pourvu;
  return Math.round(commandeDe(mode) * (bas + (haut - bas) * u));
}

/** Le mode de recrutement que la décision de la semaine 1 entraîne. */
export const modeDeRecrutement = (d1: number | undefined): keyof typeof RECRUTEMENT =>
  d1 === O.interim.tot ? "tot" : d1 === O.interim.sansFormation ? "sansFormation" : "finNovembre";

/** La part des intérimaires sur un poste à risque, selon leur affectation, à partir de la semaine 9. */
export const PART_A_RISQUE = [0.45, 0.03, 0.15] as const;
/** Un intérimaire formé deux semaines a trois fois moins d'accidents. */
export const FACTEUR_FORME = 0.3;
/** Le risque d'accident et de lot rebuté, par intérimaire exposé et par semaine. */
export const RISQUE_ACCIDENT = 0.06;
export const RISQUE_REBUT = 0.1;
export const probabilite = (taux: number, exposition: number) => 1 - Math.exp(-taux * exposition);
/** Les départs, selon l'affectation : la pression de tous les postes, le tutorat, le tas. */
export const FACTEUR_DEPART = [1.2, 0.45, 1] as const;
/** Le risque qu'un permanent fatigué ait un accident dans la semaine. */
export const risqueFatigue = (fatigue: number) => Math.min(0.5, 0.3 * Math.max(0, fatigue - 0.42));
/** Les absences qu'ajoute la fatigue des permanents. */
export const absencesDeFatigue = (fatigue: number) =>
  Math.min(0.08, 0.35 * Math.max(0, fatigue - 0.35));
/** Au-delà, l'atelier ne tourne plus : les chefs d'équipe ferment une ligne. */
export const ABSENCES_MAX = 0.13;
export const ABSENTEISME_DE_BASE = 0.051;

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

interface Interimaire {
  arrivee: number;
  /** De 0 (en formation) à 1 (comme un permanent). */
  rendement: number;
  forme: boolean;
  /** La semaine de son départ, 0 s'il est là. */
  parti: number;
  mode: keyof typeof RECRUTEMENT;
}

export type Semaine = {
  /** La part des commandes livrées. */
  service: number;
  /** Les heures de ligne disponibles, et celles que les commandes demandaient. */
  capacite: number;
  besoin: number;
  /** Les commandes de la semaine, et ce qui manque. */
  demande: number;
  manquants: number;
  interimaires: number;
  absenteisme: number;
  fatigue: number;
  /** Ce que la semaine a coûté : intérim, heures majorées, casse, accidents, rebuts, location. */
  couts: number;
  /** Les coûts du renfort cumulés depuis le début du trimestre. */
  coutsCumules: number;
  /** La marge du pic, moins les ruptures et les coûts : la contribution de la semaine. */
  contribution: number;
  cumul: number;
  /** Les heures de ligne libres que le planning prévoit, avant toute production d'avance. */
  libres: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge du pic, moins les ruptures, la casse, les heures majorées, l'intérim, les accidents et les rebuts. */
  objectif: number;
  /** La marge des desserts livrés pendant le pic. */
  margePic: number;
  /** Pénalités et ventes perdues sur le trimestre. */
  ruptures: number;
  casse: number;
  /** Pots refusés pour fraîcheur. */
  potsRefuses: number;
  heuresMajorees: number;
  interim: number;
  accidents: number;
  rebuts: number;
  /** Le taux de service sur les six semaines du pic. */
  servicePic: number;
  /** Les intérimaires arrivés, partis avant la fin, présents la dernière semaine. */
  arrives: number;
  partis: number;
  /** Les semaines où un intérimaire est parti. */
  departs: readonly number[];
  /** Les semaines des accidents et des rebuts. */
  semainesAccidents: readonly { semaine: number; interimaire: boolean }[];
  semainesRebuts: readonly number[];
  avisFavorable: boolean;
  suppleance: boolean;
  /** Le besoin d'heures de ligne supplémentaires par semaine au pic : la prévision de la semaine 1. */
  besoinPic: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const mode = modeDeRecrutement(d1);
  const conf = RECRUTEMENT[mode];
  const recrues = interimairesPourvus(mode, h.uPourvu);
  const interimaires: Interimaire[] = Array.from({ length: recrues }, () => ({
    arrivee: conf.arrivee,
    rendement: 0,
    forme: mode === "tot",
    parti: 0,
    mode,
  }));
  if (d6 === O.noel.agence) {
    const renforts = interimairesPourvus("noel", h.uPourvuNoel);
    for (let k = 0; k < renforts; k += 1) {
      interimaires.push({
        arrivee: RECRUTEMENT.noel.arrivee,
        rendement: 0,
        forme: false,
        parti: 0,
        mode: "noel",
      });
    }
  }
  const avis = avisFavorable(graine);
  const suppleance = d3 === O.weekend.suppleance && avis;
  const tenue = partTenue(chemin);

  const semaines: (Semaine | null)[] = [null];
  const departs: number[] = [];
  const semainesAccidents: { semaine: number; interimaire: boolean }[] = [];
  const semainesRebuts: number[] = [];
  let fatigue = 0.3;
  let stock = 0;
  let cumul = 0;
  let coutsCumules = 0;
  let margePic = 0;
  let ruptures = 0;
  let casse = 0;
  let refusOctobre = 0;
  let refusKerfroid = 0;
  let heuresMajorees = 0;
  let interim = 0;
  let accidents = 0;
  let rebuts = 0;
  let livreesPic = 0;
  let demandeesPic = 0;
  let permanentsBlesses = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus
      .filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree)
      .map((i) => i.imprevu.effet);
    let couts = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    let majorees = 0;

    // Les commandes de la semaine.
    let demande = ventesPrevues(w) * n.demande;
    for (const e of actifs) demande *= e.demande ?? 1;
    const besoin = besoinEnHeures(demande);

    // Les permanents : les absences, les congés de Noël, l'aménagement du temps de travail.
    let absence = absencesDeFatigue(fatigue);
    if (d2 === O.temps.refus && w >= 9) absence += w === 12 ? 0.09 : 0.04;
    // Les samedis imposés par note de service : des arrêts le lundi, et un atelier qui traîne.
    if (d3 === O.weekend.imposer && w >= 9) absence += 0.03;
    for (const e of actifs) absence += e.absence ?? 0;
    absence = Math.min(ABSENCES_MAX, absence);
    let permanents = HEURES_BASE * (1 - absence);
    if (w >= 9 && d2 === O.temps.modulation) permanents += MODULATION * (1 - absence);
    if (w >= 12) {
      const absents =
        d2 === O.temps.refus
          ? 0
          : d2 === O.temps.modulation
            ? CONGES_POSES - CONGES_DECALABLES
            : CONGES_POSES;
      permanents -= heuresDeConges(absents);
    }
    permanents -= permanentsBlesses * (HEURES_SEMAINE / EQUIPAGE);
    let capacite = permanents;

    // Les heures supplémentaires de décembre.
    if (w >= 9 && (d2 === O.temps.refus || d2 === O.temps.volontaires)) {
      capacite += HEURES_SUP_DECEMBRE;
      majorees += HEURES_SUP_DECEMBRE * coutHeureDeLigne(MAJORATION_SUP);
    }

    // Le week-end.
    const weekend = (WEEKENDS as readonly number[]).includes(w);
    if (weekend && d3 === O.weekend.suppleance) {
      if (suppleance) {
        capacite += HEURES_WEEKEND * tenue;
        majorees += COUT_SUPPLEANCE * tenue;
      } else if (w >= 11) {
        // Avis défavorable : un samedi de volontaires en heures supplémentaires, deux semaines plus tard.
        capacite += HEURES_SAMEDI * tenue;
        majorees += COUT_SAMEDI * tenue;
      }
    }
    if (weekend && (d3 === O.weekend.imposer || d3 === O.weekend.samedi)) {
      const part = d3 === O.weekend.imposer ? 1 : tenue;
      capacite += HEURES_SAMEDI * part;
      majorees += COUT_SAMEDI * part;
    }

    // Noël.
    if (w >= 11 && w <= 12 && d6 === O.noel.imposer) {
      capacite += HEURES_IMPOSEES_NOEL;
      majorees += HEURES_IMPOSEES_NOEL * coutHeureDeLigne(MAJORATION_SUP);
    }
    if (w >= 11 && d6 === O.noel.series) capacite += HEURES_REGAGNEES;

    // Les intérimaires présents, et ce qu'ils abattent.
    const presents = interimaires.filter((x) => w >= x.arrivee && !x.parti);
    for (const x of presents) {
      if (w === x.arrivee) x.rendement = RECRUTEMENT[x.mode].debut;
    }
    capacite += presents.reduce((s, x) => s + (HEURES_SEMAINE * x.rendement) / EQUIPAGE, 0);
    interim += presents.length * SEMAINE_INTERIM;
    couts += presents.length * SEMAINE_INTERIM;
    if (w === RECRUTEMENT.tot.arrivee && mode === "tot") couts += COUT_FORMATION;

    // L'affectation des intérimaires, à partir de la semaine 9.
    const affectation = w >= 9 ? (d5 ?? O.postes.surLeTas) : null;
    if (affectation === O.postes.tous) capacite += HEURES_LIBEREES;
    if (affectation === O.postes.tutorat && presents.length) {
      couts += Math.ceil(presents.length / 4) * PRIME_TUTEUR + (w === 9 ? ACCUEIL_SECURITE : 0);
    }
    let exposition = 0;
    for (const x of presents) {
      let part: number;
      if (affectation === null) part = x.mode === "tot" ? 0.03 : 0.15;
      else part = PART_A_RISQUE[affectation as 0 | 1 | 2];
      exposition += part * (x.forme ? FACTEUR_FORME : 1);
    }

    // Les imprévus qui arrêtent les lignes.
    for (const e of actifs) capacite += e.heures ?? 0;

    // Un lot mal scellé : détruit, et refait.
    if (presents.length && h.uRebut[w]! < probabilite(RISQUE_REBUT, exposition)) {
      rebuts += COUT_REBUT;
      couts += COUT_REBUT;
      capacite -= HEURES_REBUT;
      semainesRebuts.push(w);
    }

    // Produire d'avance en octobre : des samedis en heures supplémentaires, stockés chez Kerfroid.
    if (d1 === O.interim.octobre && w >= SAMEDIS_OCTOBRE[0] && w <= SAMEDIS_OCTOBRE[1]) {
      majorees += COUT_SAMEDI;
      const pots = HEURES_SAMEDI * CADENCE;
      // Seul le dernier samedi part à moins de huit jours ; le reste sera refusé.
      if (w === 7) stock += pots;
      else refusOctobre += pots;
    }
    if (d1 === O.interim.octobre && w >= SAMEDIS_OCTOBRE[0] && w <= PIC) couts += LOCATION_KERFROID;

    capacite = Math.max(0, capacite);
    const libres = capacite - besoin;

    // Produire d'avance la semaine 7, pour la semaine 8 : les heures libres, et un samedi.
    if (w === 7 && (d4 === O.avance.uneSemaine || d4 === O.avance.troisSemaines)) {
      // Produire d'avance en octobre occupe déjà le samedi de la semaine 7.
      const samedi = d1 === O.interim.octobre ? 0 : HEURES_SAMEDI;
      if (samedi) majorees += COUT_SAMEDI;
      const possible = (Math.max(0, libres) + samedi) * CADENCE;
      stock += Math.min(CHAMBRE_FROIDE, possible);
      if (d4 === O.avance.troisSemaines) {
        // Un week-end entier en plus, stocké chez Kerfroid avec le surplus pour les semaines 9 et 10.
        majorees += COUT_SUPPLEANCE;
        refusKerfroid = Math.max(0, possible - CHAMBRE_FROIDE) + HEURES_WEEKEND * CADENCE;
      }
    }
    if (d4 === O.avance.troisSemaines && w >= 7 && w <= 9) couts += LOCATION_KERFROID;

    // Ce qui est livré : le stock d'abord, puis la production de la semaine.
    let livre: number;
    if (w === PIC) {
      livre = Math.min(demande, stock + capacite * CADENCE);
      stock = 0;
    } else {
      livre = Math.min(demande, capacite * CADENCE);
    }
    const manquants = demande - livre;

    // La casse : ce qui part à plus de huit jours est refusé, la semaine où il devait partir.
    let casseSemaine = 0;
    if (w === PIC) casseSemaine += refusOctobre * CASSE;
    if (w === 9) casseSemaine += refusKerfroid * CASSE;
    casse += casseSemaine;
    couts += casseSemaine + majorees;
    heuresMajorees += majorees;

    // Les ruptures : la pénalité, et la marge perdue avant le pic.
    let penalite = manquants * PENALITE;
    if (w >= 11 && d6 === O.noel.series) penalite *= 0.6;
    const perdu = w >= PIC ? 0 : manquants * MARGE;
    ruptures += penalite + perdu + (w >= PIC ? manquants * MARGE : 0);
    const marge = w >= PIC ? livre * MARGE : 0;
    margePic += marge;
    if (w >= PIC) {
      livreesPic += livre;
      demandeesPic += demande;
    }

    // Les accidents : un intérimaire exposé, ou un permanent à bout.
    if (presents.length && h.uAccident[w]! < probabilite(RISQUE_ACCIDENT, exposition)) {
      accidents += COUT_ACCIDENT;
      couts += COUT_ACCIDENT;
      semainesAccidents.push({ semaine: w, interimaire: true });
      const blesse = [...presents].reverse().find((x) => !x.forme) ?? presents.at(-1)!;
      blesse.parti = w;
    } else if (h.uAccidentPermanent[w]! < risqueFatigue(fatigue)) {
      accidents += COUT_ACCIDENT;
      couts += COUT_ACCIDENT;
      semainesAccidents.push({ semaine: w, interimaire: false });
      permanentsBlesses += 1;
    }

    const contribution = marge - penalite - perdu - couts;
    cumul += contribution;
    coutsCumules += couts;

    semaines.push({
      service: demande ? livre / demande : 1,
      capacite,
      besoin,
      demande,
      manquants,
      interimaires: presents.length,
      absenteisme: ABSENTEISME_DE_BASE + absence,
      fatigue,
      couts,
      coutsCumules,
      contribution,
      cumul,
      libres,
    });

    // La fatigue des permanents : ce qu'on leur impose, ce qu'ils acceptent.
    if (w >= 9 && d2 === O.temps.modulation) fatigue += 0.02;
    if (w >= 9 && d2 === O.temps.refus) fatigue += 0.06;
    if (w >= 9 && d2 === O.temps.volontaires) fatigue += 0.03;
    if (weekend && d3 === O.weekend.imposer) fatigue += 0.08;
    if (weekend && d3 === O.weekend.samedi) fatigue += 0.02;
    if (weekend && d3 === O.weekend.suppleance && !suppleance && w >= 11) fatigue += 0.02;
    if (w >= 11 && w <= 12 && d6 === O.noel.imposer) fatigue += 0.12;
    if (d1 === O.interim.octobre && w >= SAMEDIS_OCTOBRE[0] && w <= SAMEDIS_OCTOBRE[1]) {
      fatigue += 0.02;
    }
    fatigue = borne(fatigue - 0.02, 0.2, 1);

    // Ce que la semaine a appris aux intérimaires.
    for (const x of presents) {
      if (x.parti) continue;
      if (x.mode === "tot") {
        // Deux semaines de formation, puis la ligne : 55 % la deuxième semaine, 90 % au plus avec un tuteur.
        const plafond = affectation === null || affectation === O.postes.tutorat ? 0.9 : 0.82;
        x.rendement = w === x.arrivee ? 0.55 : borne(x.rendement + 0.15, 0, plafond);
      } else {
        // Sur la ligne sans formation : on apprend en faisant, plus vite avec un tuteur.
        const tuteur = affectation === O.postes.tutorat;
        const plafond = RECRUTEMENT[x.mode].plafond + (tuteur ? 0.05 : 0);
        x.rendement = borne(x.rendement + (tuteur ? 0.12 : 0.08), 0, plafond);
      }
    }

    // Les départs, lus en fin de semaine.
    for (let i = 0; i < interimaires.length; i += 1) {
      const x = interimaires[i]!;
      if (w < x.arrivee || x.parti || w === SEMAINES) continue;
      const facteur = affectation === null ? 1 : FACTEUR_DEPART[affectation as 0 | 1 | 2];
      if (h.uDepart[i]![w]! < RECRUTEMENT[x.mode].depart * facteur) {
        x.parti = w;
        departs.push(w);
      }
    }
  }

  return {
    semaines,
    objectif: cumul,
    margePic,
    ruptures,
    casse,
    potsRefuses: refusOctobre + refusKerfroid,
    heuresMajorees,
    interim,
    accidents,
    rebuts,
    servicePic: demandeesPic ? livreesPic / demandeesPic : 1,
    arrives: interimaires.length,
    partis: departs.length,
    departs,
    semainesAccidents,
    semainesRebuts,
    avisFavorable: avis,
    suppleance,
    besoinPic: BESOIN_PIC,
  };
}

/** Ce qui s'est passé pendant des semaines : arrivées, départs, accidents, rebuts, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const mode = modeDeRecrutement(chemin[D.interim]);
  const arrivee = RECRUTEMENT[mode].arrivee;
  const recrues = interimairesPourvus(mode, hasard(graine).uPourvu);
  return {
    arrivee: dans(arrivee) ? { semaine: arrivee, recrues } : null,
    renfortNoel:
      chemin[D.noel] === O.noel.agence && dans(RECRUTEMENT.noel.arrivee)
        ? interimairesPourvus("noel", hasard(graine).uPourvuNoel)
        : null,
    departs: t.departs.filter(dans),
    accidents: t.semainesAccidents.filter((x) => dans(x.semaine)),
    rebuts: t.semainesRebuts.filter(dans),
    refusOctobre: chemin[D.interim] === O.interim.octobre && dans(PIC),
    refusKerfroid: chemin[D.avance] === O.avance.troisSemaines && dans(9),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureLignes {
  service: number | null;
  capacite: number | null;
  besoin: number | null;
  interimaires: number | null;
  absenteisme: number | null;
  couts: number | null;
  /** Des clés que le tableau n'affiche pas, pour les messages et les sources. */
  contribution: number | null;
  manquants: number | null;
  /** Les heures libres que le planning prévoit en semaine 7. */
  libresSemaine7: number | null;
  departs: number | null;
  /** Les intérimaires que l'agence envoie, selon le moment de la commande. */
  recrues: number | null;
  accidents: number | null;
}

/** Ce que Maëwenn lit à la fin d'une semaine ; les décisions à venir comptent comme « comme chaque année ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureLignes {
  if (semaine === 0) {
    return {
      service: 0.996,
      capacite: HEURES_BASE,
      besoin: besoinEnHeures(VENTES_OCTOBRE),
      interimaires: 0,
      absenteisme: ABSENTEISME_DE_BASE,
      couts: 0,
      contribution: 0,
      manquants: 0,
      libresSemaine7: null,
      departs: 0,
      recrues: null,
      accidents: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    service: s.service,
    capacite: s.capacite,
    besoin: s.besoin,
    interimaires: s.interimaires,
    absenteisme: s.absenteisme,
    couts: s.coutsCumules,
    contribution: s.cumul,
    manquants: (t.semaines.slice(1, semaine + 1) as Semaine[]).reduce((x, v) => x + v.manquants, 0),
    libresSemaine7: t.semaines[7]!.libres,
    departs: t.departs.filter((w) => w <= semaine).length,
    recrues: interimairesPourvus(modeDeRecrutement(chemin[D.interim]), hasard(graine).uPourvu),
    accidents: t.semainesAccidents.filter((x) => x.semaine <= semaine).length,
  };
}
