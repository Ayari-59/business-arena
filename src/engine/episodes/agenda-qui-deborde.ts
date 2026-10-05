/**
 * L'AGENDA QUI DÉBORDE — le modèle de l'agence de Genas.
 *
 * Un directeur, deux adjoints, douze personnes, treize semaines, six
 * décisions. L'agence vient de s'agrandir ; Clovis Lemaistre travaille
 * soixante heures par semaine, tout passe par lui, et ce qui compte vraiment
 * (l'ouverture du drive, les entretiens annuels) n'avance pas. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · CE QUI PASSE PAR LE DIRECTEUR ATTEND. Devis, remises, plannings : chaque
 *     dossier qui doit recevoir sa signature entre dans une file, et la file
 *     coûte (devis qui ne se transforment plus, plannings refaits, clients qui
 *     relancent et interrompent). Travailler plus la vide un temps ; seule la
 *     DÉLÉGATION en retire durablement des dossiers. Déléguer coûte d'abord
 *     (former, contrôler un dossier sur cinq), puis libère, à condition d'un
 *     CADRE : sans seuils ni règles, les adjoints se trompent et renvoient.
 *   · L'URGENT CHASSE L'IMPORTANT. Sans temps protégé, le projet du drive ne
 *     progresse pas ; en semaine 9, l'ouverture annoncée aux clients en fait
 *     une crise, traitée dans l'urgence, plus cher et plus tard. Les
 *     entretiens annuels jamais tenus usent le climat, et l'adjointe qui
 *     attendait des responsabilités regarde ailleurs.
 *   · LA FATIGUE FAIT LES ERREURS. Au-delà de cinquante-deux heures, la
 *     fatigue monte ; elle allonge chaque dossier et multiplie les erreurs de
 *     décision. À bout, le directeur s'arrête, et tout ce qui passait par lui
 *     s'empile.
 *
 * Le trimestre est jugé en euros : la marge nette de l'agence, moins ce que
 * coûtent l'attente des décisions, les erreurs, les opportunités manquées et
 * les départs, en écart au budget. Se rendre moins indispensable n'y est pas
 * une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les deux adjoints et les douze personnes de leurs équipes. */
export const EFFECTIF = 14;
/** Le chiffre d'affaires hebdomadaire de l'agence en début de trimestre. */
export const CA_SEMAINE = 118000;
export const TAUX_MARGE = 0.27;
/** L'activité qui croît avec l'agrandissement : par semaine. */
export const CROISSANCE = 0.008;
/** Le budget de marge nette de l'agence sur le trimestre. */
export const BUDGET = 425000;

/** Les dossiers qui demandent une signature chaque semaine : devis, remises, plannings, achats. */
export const ARRIVEES = 82;
/** Les devis et les remises (le domaine de Gwenaëlle), la logistique (celui de Tariq), le reste. */
export const PART_DEVIS = 0.45;
export const PART_LOGISTIQUE = 0.3;
/** Le temps qu'un dossier prend au directeur, reposé, en heures. */
export const H_DOSSIER = 0.46;
export const FILE_DEPART = 64;
/** Ce qui reste toujours sur le bureau le vendredi soir : les dossiers arrivés dans la journée. */
export const FILE_INCOMPRESSIBLE = 15;
export const OBJECTIF_FILE = 25;
export const HEURES_DEPART = 60;
export const OBJECTIF_HEURES = 50;
export const FATIGUE_DEPART = 0.6;
export const CLIMAT_DEPART = 0.5;
/** Réunions internes, régionales et fournisseurs, par semaine. */
export const REUNIONS = 14;

/** Le travail qui reste pour ouvrir le drive, en heures de directeur. */
export const PROJET = 32;
export const AVANCEMENT_DEPART = 4;
/** L'ouverture annoncée aux clients : la semaine où le drive doit tourner. */
export const OUVERTURE_PREVUE = 9;
/** La marge qu'apporte le drive par semaine d'ouverture. */
export const GAIN_DRIVE = 4500;

/** L'ouverture annoncée et rien de prêt : artisans renvoyés, caristes en heures supplémentaires. */
export const COUT_CRISE = 5000;
/** Ce que coûte, par semaine, un dossier qui attend une signature. */
export const COUT_ATTENTE = 40;
/** Mauvais prix, remise de trop, livraison en double : ce que coûte une erreur de décision. */
export const COUT_ERREUR = 900;
export const COUT_DEPART = 12000;
/** Un client qui n'attend plus achète ailleurs. */
export const COUT_ABANDON = 200;
/** La marge des premières livraisons du groupe scolaire, en semaines 12 et 13, si l'offre est retenue. */
export const GAIN_OFFRE = 14000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des devis qui attendent, et se perdent. */
export const PERTE_PAR_JOUR = 1500;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  delegation: 0,
  reunions: 1,
  drive: 2,
  entretiens: 3,
  erreur: 4,
  offre: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

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
  /** heures : ce qu'il prend au directeur ; dossier : le temps de chaque dossier. */
  effet: { heures?: number; dossier?: number; arrivees?: number; ca?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "logiciel",
    titre: "Panne du logiciel de devis",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel de devis est tombé deux jours : les devis se font sur tableur, à ressaisir ensuite, et chacun prend deux fois plus de temps à vérifier.",
    duree: 1,
    effet: { dossier: 1.25 },
  },
  {
    id: "audit",
    titre: "Audit de la direction régionale",
    de: "Gaspard Lhermitte",
    role: "Contrôleur de gestion régional",
    texte:
      "Gaspard Lhermitte passe trois jours à l'agence pour l'audit annuel des stocks et des remises : il lui faut le directeur à ses côtés.",
    duree: 1,
    effet: { heures: 7 },
  },
  {
    id: "chantier",
    titre: "Démarrage d'un grand chantier",
    de: "Bilal Ouédraogo",
    role: "Technico-commercial",
    texte:
      "Le chantier du nouveau groupe scolaire de Genas démarre : ses artisans demandent des devis par dizaines pendant deux semaines.",
    duree: 2,
    effet: { arrivees: 1.2, ca: 1.05 },
  },
  {
    id: "grippe",
    titre: "Grippe dans l'équipe",
    de: "Coralie Courtois",
    role: "Assistante d'agence",
    texte:
      "La grippe passe par l'agence : deux à trois absents pendant deux semaines, des plannings à refaire chaque matin.",
    duree: 2,
    effet: { ca: 0.95, heures: 2 },
  },
  {
    id: "litige",
    titre: "Litige avec un grand compte",
    de: "Constructions Aubrac",
    role: "Client grand compte",
    texte:
      "Constructions Aubrac conteste une facture de 28 000 € et ne veut parler qu'au directeur : deux rendez-vous et un dossier à reconstituer.",
    duree: 1,
    effet: { heures: 5 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  arrivees: number;
  ca: number;
  erreurs: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Ce que Tariq abat sur le projet du drive quand on le lui confie : 1, ce qu'on attend de lui. */
  talentTariq: number;
  /** Clovis s'arrête-t-il, s'il est à bout ? */
  uArret: number;
  /** Gwenaëlle part-elle, si elle n'y croit plus ? */
  uGwenaelle: number;
  /** L'appel d'offres du groupe scolaire est-il retenu ? */
  uOffre: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000037 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      arrivees: borne(1 + 0.08 * gauss(r), 0.8, 1.2),
      ca: borne(1 + 0.04 * gauss(r), 0.9, 1.1),
      erreurs: borne(1 + 0.2 * gauss(r), 0.55, 1.5),
    });
  }
  const talentTariq = borne(1 + 0.32 * gauss(r), 0.45, 1.45);
  const uArret = r();
  const uGwenaelle = r();
  const uOffre = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, talentTariq, uArret, uGwenaelle, uOffre, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Tariq tient-il le calendrier du drive ? Seul, il lui faut au moins 0,875 de ce qu'on attend de lui. */
export const SEUIL_TARIQ = 0.875;

/** Le risque que Clovis s'arrête, lu sur sa fatigue en fin de semaine 8. */
export const risqueDArret = (fatigue: number) => borne((fatigue - 0.8) * 2.5, 0, 0.6);

/** Le temps qu'un dossier prend au directeur : la fatigue l'allonge. */
export const tempsParDossier = (fatigue: number) =>
  H_DOSSIER * (1 + 0.5 * Math.max(0, fatigue - 0.5));

/** La part des dossiers où le directeur se trompe : la fatigue la multiplie. */
export const tauxErreurDirecteur = (fatigue: number) => 0.012 + 0.06 * Math.max(0, fatigue - 0.4);

/** La part des dossiers où un adjoint se trompe : elle baisse avec son autonomie, et sans cadre elle s'envole. */
export const tauxErreurAdjoint = (autonomie: number, cadre: boolean) =>
  (0.008 + 0.035 * (1 - autonomie)) * (cadre ? 1 : 1.7);

export type Semaine = {
  /** Dossiers qui attendent la signature du directeur en fin de semaine. */
  file: number;
  /** Le délai moyen d'une signature, en jours ouvrés. */
  delai: number;
  /** Les heures de travail de Clovis dans la semaine. */
  heures: number;
  fatigue: number;
  /** Erreurs de décision de la semaine, directeur et adjoints. */
  erreurs: number;
  /** Erreurs de décision depuis le début du trimestre. */
  erreursCumul: number;
  /** Avancement du projet du drive, en heures de travail sur PROJET. */
  projet: number;
  climat: number;
  /** Autonomie moyenne des deux adjoints, de 0 à 1. */
  autonomie: number;
  /** La part des dossiers que les adjoints signent sans le directeur. */
  delegue: number;
  entretiens: number;
  ca: number;
  /** Ce que la semaine apporte à la marge nette : marge, drive, moins attente, erreurs, dépenses, départs. */
  contribution: number;
  /** Marge nette cumulée depuis le début du trimestre. */
  cumul: number;
  /** 1 si le drive est ouvert cette semaine. */
  drive: number;
  /** 1 si Clovis est arrêté cette semaine. */
  absent: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge nette : positif, l'agence fait mieux que le budget. */
  objectif: number;
  margeNette: number;
  /** Ce qu'a coûté l'attente des signatures sur le trimestre. */
  coutAttente: number;
  coutErreurs: number;
  erreursTotales: number;
  /** La semaine d'ouverture du drive, ou null s'il n'a pas ouvert. */
  ouverture: number | null;
  /** Le projet a-t-il dû être fini dans l'urgence, à partir de la semaine 9 ? */
  crise: boolean;
  /** Tariq aurait-il tenu le calendrier du drive, si on le lui avait confié ? */
  tariqTiendrait: boolean;
  maximeArrete: boolean;
  gwenaellePart: boolean;
  /** L'appel d'offres du groupe scolaire : gagné, perdu, ou pas de réponse. */
  offreGagnee: boolean | null;
  /** Les dossiers abandonnés par des clients lassés d'attendre. */
  abandons: number;
  entretiensFaits: number;
  /** Les entretiens expédiés en une journée en semaine 13 : tenus sur le papier seulement. */
  entretiensExpedies: boolean;
  heuresMoyennes: number;
  heuresFinales: number;
  fileFinale: number;
  climatFinal: number;
  autonomieFinale: number;
}

/** La part des devis et des plannings que les adjoints signent seuls, semaine par semaine. */
function partDeleguee(d1: number | undefined, w: number) {
  if (d1 === 1) return [0, 0.25, 0.45, 0.6][w] ?? 0.7;
  if (d1 === 2) return 0.85;
  return 0;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const cadre = d1 === 1;
  const semaines: (Semaine | null)[] = [null];
  let file = FILE_DEPART;
  let fatigue = FATIGUE_DEPART;
  let climat = CLIMAT_DEPART;
  let autonomieG = 0.3;
  let autonomieT = 0.3;
  let projet = AVANCEMENT_DEPART;
  let ouverture: number | null = null;
  let crise = false;
  let arret = false;
  let gwenaelle = false;
  let offre: boolean | null = null;
  let entretiensFaits = 0;
  let entretienGwenaelle = false;
  let cumul = 0;
  let coutAttente = 0;
  let coutErreurs = 0;
  let erreursTotales = 0;
  let heuresTotales = 0;
  let abandonsTotaux = 0;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const present = !(arret && w === 9);
    let climatDelta = 0;

    // Qui signe quoi.
    let partG = partDeleguee(d1, w);
    const partT = partDeleguee(d1, w);
    if (d5 === 0 && w >= 9) partG = 0; // Le directeur reprend tous les devis.
    if (gwenaelle && w >= 11) partG *= 0.5; // Elle s'en va : ses dossiers remontent.
    if (d6 === 1 && w === 11) partG *= 0.8; // Elle monte l'offre : une partie de ses devis remonte.

    // Ce qui arrive cette semaine, et ce qui remonte au directeur.
    let arrivees = ARRIVEES * n.arrivees * (1 + 1.5 * CROISSANCE * (w - 1));
    for (const a of actifs) arrivees *= a.imprevu.effet.arrivees ?? 1;
    const confiesG = arrivees * PART_DEVIS * partG;
    const confiesT = arrivees * PART_LOGISTIQUE * partT;
    // Ce qu'un adjoint ne sait pas trancher revient sur le bureau du directeur.
    const renvoi = cadre ? 0.25 : 0.5;
    const renvoyes = confiesG * (1 - autonomieG) * renvoi + confiesT * (1 - autonomieT) * renvoi;
    const versMaxime = arrivees - confiesG - confiesT + renvoyes;

    // Le temps du directeur que les dossiers ne voient pas.
    let reunions = REUNIONS;
    // Chaque dossier en attente fait passer quelqu'un à son bureau : « tu as regardé mon devis ? »
    let interruptions = Math.min(12, 5 + 0.04 * file);
    if (w >= 3) {
      if (d2 === 0) {
        reunions -= 6;
        interruptions -= 1.5;
      }
      if (d2 === 1) {
        reunions += 5;
        interruptions -= 1;
      }
      if (d2 === 2) {
        reunions -= 9;
        interruptions += 4 + 0.02 * file;
      }
    }
    let formation = 0;
    if (d1 === 1) formation = w <= 2 ? 6 : w <= 4 ? 4 : 1.5;
    if (d5 === 1 && w === 9) formation += 2;
    if (d5 === 2 && w >= 9) formation += 0.2 * (confiesG + confiesT);
    let pourProjet = 0;
    if (w >= 5 && w < OUVERTURE_PREVUE && projet < PROJET) {
      if (d3 === 0) pourProjet = 8;
      if (d3 === 1) pourProjet = 1; // Le point d'étape avec Tariq.
    }
    // Le drive ouvert, piloté par le directeur : chaque question remonte à lui.
    if (ouverture !== null && w >= ouverture && d3 !== 1) interruptions += 3;
    let entretiens = 0;
    let faits = 0;
    if (d4 === 0 && w >= 7) {
      entretiens = 3;
      faits = present ? 2 : 0;
    }
    if (d4 === 1 && w === 13) {
      entretiens = 7;
      faits = present ? 14 : 0;
    }
    if (d4 === 2 && w === 7) {
      entretiens = 3;
      faits = present ? 2 : 0;
    }
    if (d4 === 2 && w >= 8 && w <= 10) {
      entretiens = 1;
      faits = 4;
    }
    if (d4 === 2 && w >= 11) entretiens = 0.5;
    let autre = 0;
    if (d6 === 2 && (w === 11 || w === 12)) autre += 6;
    if (d6 === 1 && w === 11) autre += 2;
    for (const a of actifs) autre += a.imprevu.effet.heures ?? 0;

    // La crise : en semaine 9, l'ouverture est annoncée ; ce qui reste se fait dans l'urgence.
    let urgence = 0;
    if (w >= OUVERTURE_PREVUE && ouverture === null && projet < PROJET && present) {
      // Reprendre au pied levé un travail à moitié fait coûte deux fois son temps.
      urgence = Math.min(14, (PROJET - projet) * 2);
      crise = true;
    }

    const fixe = reunions + interruptions + formation + pourProjet + entretiens + autre + urgence;
    let plafond = 62;
    if (d1 === 0) plafond += 8;
    const plancher = d1 === 0 ? 66 : 45;
    let tDossier = tempsParDossier(fatigue);
    for (const a of actifs) tDossier *= a.imprevu.effet.dossier ?? 1;
    const besoin = Math.max(0, file + versMaxime - FILE_INCOMPRESSIBLE) * tDossier;
    // Le soir et le samedi : des heures en plus, qui ne prennent rien aux dossiers.
    let enPlus = 0;
    if (d3 === 2 && w >= 5 && w < OUVERTURE_PREVUE && projet < PROJET) enPlus += 8;
    if (d6 === 0 && (w === 11 || w === 12)) enPlus += 6;
    const auBureau = present ? borne(fixe + besoin, plancher, Math.max(plafond, fixe + 8)) : 0;
    const heures = present ? auBureau + enPlus : 0;
    const pourDossiers = Math.max(0, auBureau - fixe);
    const traites = present
      ? Math.min(Math.max(0, file + versMaxime - FILE_INCOMPRESSIBLE), pourDossiers / tDossier)
      : 0;
    file = file + versMaxime - traites;
    // Au-delà de quatre jours d'attente, des clients n'attendent plus : ils achètent ailleurs.
    const delai = (5 * file) / Math.max(1, arrivees);
    const abandons = file * Math.min(0.3, 0.05 * Math.max(0, delai - 4));
    file -= abandons;
    abandonsTotaux += abandons;

    // Le projet du drive.
    const efficacite = 1 / (1 + 0.5 * Math.max(0, fatigue - 0.5));
    if (present && d3 === 0) projet += pourProjet * efficacite;
    // Le soir, fatigué, on avance moins vite.
    if (present && d3 === 2 && enPlus > 0) projet += 8 * efficacite * 0.8;
    if (d3 === 1 && w >= 5 && projet < PROJET) {
      projet += 8 * h.talentTariq * (d1 === 2 ? 0.6 : 1);
    }
    if (urgence > 0) projet += urgence / 2;
    projet = Math.min(PROJET, projet);
    if (ouverture === null && projet >= PROJET && w >= OUVERTURE_PREVUE - 1) ouverture = w + 1;

    // L'appel d'offres du groupe scolaire : remis en semaine 11, réponse en semaine 12.
    if (w === 12 && d6 !== 3 && d6 !== undefined) {
      offre = h.uOffre < chanceOffre(d6, fatigue, autonomieG, gwenaelle);
    }

    // Les erreurs : celles du directeur fatigué, et celles des adjoints.
    let erreurDirecteur = tauxErreurDirecteur(fatigue);
    let erreurAdjoint =
      (tauxErreurAdjoint(autonomieG, cadre) + tauxErreurAdjoint(autonomieT, cadre)) / 2;
    if (w >= 9) {
      if (d5 === 1) {
        erreurDirecteur *= 0.85;
        erreurAdjoint *= 0.7;
      }
      if (d5 === 2) erreurAdjoint *= 0.6;
      if (d5 === 3) {
        // Une erreur dont on ne cherche pas la cause se répète.
        erreurDirecteur *= 1.1;
        erreurAdjoint *= 1.15;
      }
    }
    let coordination = 1;
    if (d2 === 1 && w >= 3) coordination = 0.92;
    if (d2 === 2 && w >= 3) coordination = 1.15;
    const erreurs =
      (traites * erreurDirecteur + (confiesG + confiesT - renvoyes) * erreurAdjoint) *
      coordination *
      n.erreurs;

    // Les adjoints apprennent : vite avec un cadre et une formation, lentement sans.
    let progres = cadre ? (w <= 6 ? 0.07 : 0.03) : d1 === 2 ? 0.025 : 0;
    if (d2 === 1 && w >= 3) progres *= 0.6; // On ne grandit pas sous un contrôle quotidien.
    if (d5 === 2 && w >= 9) progres = 0;
    autonomieG += progres;
    autonomieT += progres + (d3 === 1 && w >= 5 && w <= 8 ? 0.02 : 0);
    if (d5 === 1 && w === 9 && d1 !== undefined && d1 !== 0 && d1 !== 3) {
      autonomieG += 0.05;
      autonomieT += 0.05;
    }
    // Mener les entretiens de leur équipe fait grandir des adjoints qu'on a préparés.
    if (d4 === 2 && w === 10 && (autonomieG + autonomieT) / 2 >= 0.5) {
      autonomieG += 0.04;
      autonomieT += 0.04;
    }
    autonomieG = borne(autonomieG, 0, 0.95);
    autonomieT = borne(autonomieT, 0, 0.95);
    const autonomie = (autonomieG + autonomieT) / 2;

    // Le climat : l'attente use l'équipe ; la confiance, les entretiens et des réunions utiles la réparent.
    climatDelta -= (0.01 * (file - 30)) / 30;
    if (d1 === 1 && w >= 3) climatDelta += 0.005;
    if (d1 === 2 && w <= 6) climatDelta -= 0.006;
    if (w >= 3) climatDelta += d2 === 0 ? 0.006 : d2 === 1 || d2 === 2 ? -0.006 : 0;
    if (d4 === 0) climatDelta += 0.006 * faits;
    if (d4 === 2) climatDelta += (w === 7 ? 0.008 : autonomie >= 0.6 ? 0.009 : 0.003) * faits;
    if (d4 === 1) climatDelta += 0.002 * faits;
    if (d4 === 3 && w >= 9) climatDelta -= 0.008;
    if (d5 === 0 && w === 9) climatDelta -= 0.03;
    if (d5 === 2 && w === 9) climatDelta -= 0.015;
    if (gwenaelle && w === 11) climatDelta -= 0.05;
    climat = borne(climat + climatDelta, 0.1, 0.85);
    entretiensFaits += faits;
    if ((d4 === 0 || d4 === 2) && w === 7 && present) entretienGwenaelle = true;

    // La fatigue : au-delà de cinquante-deux heures, elle monte.
    fatigue = present ? borne(fatigue + (0.03 * (heures - 52)) / 10, 0, 1) : 0.55;
    // À bout, Clovis s'arrête : la décision se lit en fin de semaine 8.
    if (w === 8 && h.uArret < risqueDArret(fatigue)) arret = true;
    // Sans perspective, Gwenaëlle accepte une offre : la décision se lit en fin de semaine 10.
    if (w === 10 && h.uGwenaelle < risqueDeDepart(climat, chemin, entretienGwenaelle))
      gwenaelle = true;

    // Ce que la semaine rapporte.
    let facteurCA = n.ca * (1 + CROISSANCE * (w - 1)) * (1 + 0.15 * (climat - CLIMAT_DEPART));
    if (w >= 3) facteurCA *= d2 === 0 ? 1.015 : d2 === 1 ? 0.985 : d2 === 2 ? 0.99 : 1;
    if (gwenaelle && w >= 11) facteurCA *= 0.98;
    for (const a of actifs) facteurCA *= a.imprevu.effet.ca ?? 1;
    const ca = CA_SEMAINE * facteurCA;
    const ouvert = ouverture !== null && w >= ouverture;
    let marge = ca * TAUX_MARGE;
    // Le drive conçu par celui qui le fera tourner tourne mieux.
    if (ouvert) marge += GAIN_DRIVE * (d3 === 1 ? 1.2 : 1);
    if (offre && w >= 12) marge += GAIN_OFFRE / 2;
    const attente = file * COUT_ATTENTE + abandons * COUT_ABANDON;
    const coutErreur = erreurs * COUT_ERREUR;
    const depart = gwenaelle && w === 11 ? COUT_DEPART : 0;
    const enCrise = crise && w === OUVERTURE_PREVUE ? COUT_CRISE : 0;
    const contribution =
      marge - attente - coutErreur - depart - enCrise - (w === 1 ? perteEnquete : 0);
    cumul += contribution;
    coutAttente += attente;
    coutErreurs += coutErreur;
    erreursTotales += erreurs;
    heuresTotales += heures;

    semaines.push({
      file,
      delai: (5 * file) / Math.max(1, arrivees),
      heures,
      fatigue,
      erreurs,
      erreursCumul: erreursTotales,
      projet,
      climat,
      autonomie,
      delegue: (confiesG + confiesT - renvoyes) / arrivees,
      entretiens: Math.min(EFFECTIF, entretiensFaits),
      ca,
      contribution,
      cumul,
      drive: ouvert ? 1 : 0,
      absent: present ? 0 : 1,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: cumul - BUDGET,
    margeNette: cumul,
    coutAttente,
    coutErreurs,
    erreursTotales,
    abandons: abandonsTotaux,
    ouverture,
    crise,
    tariqTiendrait: h.talentTariq * (d1 === 2 ? 0.6 : 1) >= SEUIL_TARIQ,
    maximeArrete: arret,
    gwenaellePart: gwenaelle,
    offreGagnee: offre,
    entretiensFaits: Math.min(EFFECTIF, entretiensFaits),
    entretiensExpedies: d4 === 1,
    heuresMoyennes: heuresTotales / SEMAINES,
    heuresFinales: fin.heures,
    fileFinale: fin.file,
    climatFinal: fin.climat,
    autonomieFinale: fin.autonomie,
  };
}

/**
 * QUI GAGNE L'APPEL D'OFFRES ?
 *
 * Gwenaëlle chiffre les devis de l'agence depuis deux ans : elle connaît les
 * prix et les artisans du chantier mieux que le directeur. Confiée avec un
 * prix plancher, l'offre gagne d'autant plus souvent qu'elle a appris à
 * décider seule ; montée par un directeur fatigué, elle gagne moins.
 */
export function chanceOffre(
  choix: number,
  fatigue: number,
  autonomieGwenaelle: number,
  gwenaellePart: boolean,
): number {
  const efficacite = 1 / (1 + 0.5 * Math.max(0, fatigue - 0.5));
  if (choix === 0 || choix === 2) return 0.4 * efficacite;
  if (choix === 1) return (0.15 + 0.6 * autonomieGwenaelle) * (gwenaellePart ? 0.4 : 1);
  return 0;
}

/**
 * OPHÉLIE PART-ELLE ?
 *
 * Elle prépare tous les devis depuis deux ans sans pouvoir en signer un, et
 * attend son entretien depuis dix-huit mois. Des responsabilités cadrées et
 * un entretien tenu la retiennent ; tout reprendre après une erreur la pousse
 * dehors.
 */
export function risqueDeDepart(
  climat: number,
  chemin: readonly number[],
  entretienFait: boolean,
): number {
  const d1 = chemin[D.delegation];
  const d5 = chemin[D.erreur];
  let r = 0.2 + (CLIMAT_DEPART - climat);
  r += d1 === 1 ? -0.08 : d1 === 2 ? 0.12 : 0.08;
  if (entretienFait) r -= 0.1;
  if (d5 === 0) r += 0.25;
  if (d5 === 2) r += 0.1;
  return borne(r, 0.02, 0.8);
}

/** Ce qui s'est passé pendant des semaines : arrêt, départ, drive, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arret: t.maximeArrete && dans(9),
    gwenaellePart: t.gwenaellePart && dans(11),
    /** Le point d'étape de Tariq en semaine 7 : dans les temps, ou en retard. */
    pointTariq: chemin[D.drive] === 1 && dans(7) ? !t.crise : null,
    /** La réponse du groupe scolaire, en semaine 12. */
    offre: t.offreGagnee !== null && dans(12) ? t.offreGagnee : null,
    crise: t.crise && dans(OUVERTURE_PREVUE),
    ouverture: t.ouverture !== null && dans(t.ouverture) ? t.ouverture : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** Pour ouvrir en semaine 9, le travail doit avancer d'un quart chaque semaine, de la semaine 5 à la semaine 8. */
export const avancementAttendu = (semaine: number) =>
  Math.min(
    PROJET,
    AVANCEMENT_DEPART + Math.max(0, semaine - 4) * ((PROJET - AVANCEMENT_DEPART) / 4),
  );

export interface LectureAgence {
  file: number | null;
  heures: number | null;
  erreurs: number | null;
  projet: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** Ce que le tableau de bord ne montre pas, mais que les messages lisent. */
  /** L'avancement qu'il faudrait avoir à date pour ouvrir le drive en semaine 9. */
  attendu: number | null;
  erreursCumul: number | null;
  delai: number | null;
  fatigue: number | null;
  climat: number | null;
  autonomie: number | null;
  delegue: number | null;
  entretiens: number | null;
  absent: number | null;
  drive: number | null;
  gwenaelle: number | null;
}

/** Ce que Clovis lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAgence {
  if (semaine === 0) {
    return {
      file: FILE_DEPART,
      heures: HEURES_DEPART,
      erreurs: 2.1,
      projet: AVANCEMENT_DEPART,
      cumul: 0,
      budgetADate: 0,
      attendu: AVANCEMENT_DEPART,
      erreursCumul: 0,
      delai: (5 * FILE_DEPART) / ARRIVEES,
      fatigue: FATIGUE_DEPART,
      climat: CLIMAT_DEPART,
      autonomie: 0.3,
      delegue: 0,
      entretiens: 0,
      absent: 0,
      drive: 0,
      gwenaelle: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    file: s.file,
    heures: s.heures,
    erreurs: s.erreurs,
    projet: s.projet,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    attendu: avancementAttendu(semaine),
    erreursCumul: s.erreursCumul,
    delai: s.delai,
    fatigue: s.fatigue,
    climat: s.climat,
    autonomie: s.autonomie,
    delegue: s.delegue,
    entretiens: s.entretiens,
    absent: s.absent,
    drive: s.drive,
    gwenaelle: t.gwenaellePart && semaine >= 11 ? 1 : 0,
  };
}
