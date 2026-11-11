import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { ATLAS_CONSEIL, CANAUX, type FicheDuCabinet } from "./atlas-conseil";

/**
 * LE MONDE DU COURS : LE PLATEAU DE TÉLÉACTEURS D'ATLAS CONSEIL (le parcours BTS NDRC, bloc 2 : la
 * relation client à distance ; bloc 1 : la performance collective).
 *
 * HYPOTHÈSE DU COURS, POSÉE POUR N + 1. Le cabinet ouvre un plateau de 4 téléacteurs. Il y rapatrie
 * deux métiers qu'il faisait mal ou pas du tout :
 *   · LA LIGNE CLIENTS (appels reçus, ou réception) : les participants des formations et les services
 *     formation des comptes appellent pour une inscription, une convocation, un changement de date ou
 *     l'accès aux supports en ligne ;
 *   · LA PROSPECTION TÉLÉPHONIQUE (appels émis, ou émission) : la prise de rendez-vous qu'Hugo, le
 *     commercial de la conquête, faisait seul en N (les 1 200 contacts de la prospection de la fiche,
 *     qui ont donné 60 rendez-vous). Hugo, libéré du téléphone, ne fait plus que les rendez-vous.
 *
 * Cette fiche ne change rien à l'année N d'ATLAS CONSEIL (monde/atlas-conseil.ts) : elle en reprend le
 * taux de rendez-vous de la prospection (60 rendez-vous pour 1 200 contacts, 5 %), et le modèle du
 * chapitre (« Le plateau de téléacteurs ») calcule le reste. Le mois étudié est un mois type de N + 1
 * (20 jours ouvrés) ; la journée type en est la moyenne.
 *
 * CONVENTIONS. Le plateau ouvre de 9 h à 13 h et de 14 h à 18 h, en quatre créneaux de deux heures.
 * Un téléacteur tient 3 créneaux par jour, soit 6 heures au téléphone : le reste de sa journée de
 * 7 heures va aux pauses (le code du travail en impose une de 20 minutes dès 6 heures de travail) et
 * au suivi des dossiers. La durée moyenne de traitement (DMT) d'un appel compte la conversation et le
 * travail qui suit (la saisie dans la fiche du client). Tout est hors taxes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// LE TEMPS DU PLATEAU
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDeCreneau = "9-11" | "11-13" | "14-16" | "16-18";

/** La durée d'un créneau, en minutes. */
export const MINUTES_D_UN_CRENEAU = 120;

/** Les créneaux qu'un téléacteur tient dans sa journée : 6 heures au téléphone sur 7 heures de présence. */
export const CRENEAUX_D_UN_TELEACTEUR = 3;

/** Les jours ouvrés du mois type. */
export const JOURS_DU_MOIS = 20;

/**
 * LE TAUX D'OCCUPATION CIBLE de la ligne (hypothèse du cours, un ordre de grandeur courant des centres
 * de relation client) : 80 % du créneau passé à traiter des appels. Au-delà, les appels attendent,
 * les clients raccrochent et les téléacteurs s'usent ; la simulation suppose donc qu'un téléacteur ne
 * traite jamais plus de 80 % de son créneau. C'est la même valeur qui dimensionne l'effectif.
 */
export const OCCUPATION_CIBLE = 0.8;

// ─────────────────────────────────────────────────────────────────────────────
// LA LIGNE CLIENTS : LA JOURNÉE TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface CreneauDeLaLigne {
  code: CodeDeCreneau;
  libelle: string;
  /** Les appels reçus dans le créneau, en moyenne sur les jours du mois. */
  appelsRecus: number;
  /** Les téléacteurs que le planning du mois place sur la ligne dans ce créneau. */
  presents: number;
}

/**
 * LA JOURNÉE TYPE DE LA LIGNE CLIENTS (hypothèse du cours) : 120 appels reçus, le pic de 11 h à 13 h
 * (les services formation appellent avant le déjeuner), le creux de 16 h à 18 h. Le planning du mois
 * place 2 téléacteurs sur la ligne à chaque créneau : 8 créneaux de ligne par jour, les 4 autres
 * créneaux du plateau allant à la prospection.
 */
export const CRENEAUX_DE_LA_LIGNE: readonly CreneauDeLaLigne[] = [
  { code: "9-11", libelle: "9 h à 11 h", appelsRecus: 32, presents: 2 },
  { code: "11-13", libelle: "11 h à 13 h", appelsRecus: 44, presents: 2 },
  { code: "14-16", libelle: "14 h à 16 h", appelsRecus: 28, presents: 2 },
  { code: "16-18", libelle: "16 h à 18 h", appelsRecus: 16, presents: 2 },
];

/** LA DURÉE MOYENNE DE TRAITEMENT d'un appel de la ligne, en minutes : celle du mois (voir les téléacteurs). */
export const DMT_DE_LA_LIGNE = 6;

/**
 * LA VARIANTE DE L'ESPACE PARTICIPANT EN LIGNE (hypothèse du cours) : convocations, supports et
 * changements de date passent par un espace en ligne, et les appels qui restent sont plus courts. La
 * DMT tombe à 4 minutes ; les appels reçus ne changent pas.
 */
export const DMT_AVEC_L_ESPACE_EN_LIGNE = 4;

// ─────────────────────────────────────────────────────────────────────────────
// LES TÉLÉACTEURS ET LEUR MOIS
// ─────────────────────────────────────────────────────────────────────────────

export interface TeleacteurDuPlateau {
  code: string;
  /** Un prénom fictif, pour les textes. */
  prenom: string;
  /** La ligne clients : les appels décrochés dans le mois, et le temps passé à les traiter (minutes). */
  appelsDecroches: number;
  minutesDeTraitement: number;
  /** La prospection : les appels émis, les contacts argumentés (le décideur joint et l'offre présentée), les rendez-vous pris. */
  appelsEmis: number;
  contactsArgumentes: number;
  rendezVousPris: number;
  /** Les rendez-vous qu'Hugo a effectivement tenus : le prospect était là, et il avait un projet. */
  rendezVousHonores: number;
  /** La note de qualité du mois, sur 20 : la double écoute du superviseur (accueil, reformulation, conclusion). */
  noteDeQualite: number;
}

/**
 * LES 4 TÉLÉACTEURS ET LEUR MOIS TYPE (hypothèses du cours). Chacun tient 2 créneaux de ligne et
 * 1 créneau de prospection par jour : 80 heures de ligne et 40 heures de prospection dans le mois.
 * Ensemble, ils refont la journée type : 108 appels décrochés par jour (2 160 dans le mois), traités
 * en 6 minutes en moyenne ; 1 600 appels émis en 160 heures (10 par heure), 240 contacts argumentés
 * (15 %), 12 rendez-vous pris (5 % des contacts, le taux de la prospection de N), dont 10 honorés.
 *   - Léa traite vite (5 minutes), prend le plus de rendez-vous, mais la moitié ne tient pas : elle
 *     force la conclusion, et sa note de qualité est la plus basse.
 *   - Samir et Inès prennent moins de rendez-vous, tous honorés ; Inès prend son temps (7,5 minutes).
 *   - Bruno est régulier, sans plus.
 */
export const TELEACTEURS: readonly TeleacteurDuPlateau[] = [
  { code: "lea", prenom: "Léa", appelsDecroches: 600, minutesDeTraitement: 3_000, appelsEmis: 440, contactsArgumentes: 60, rendezVousPris: 4, rendezVousHonores: 2, noteDeQualite: 12 },
  { code: "samir", prenom: "Samir", appelsDecroches: 600, minutesDeTraitement: 3_600, appelsEmis: 400, contactsArgumentes: 64, rendezVousPris: 3, rendezVousHonores: 3, noteDeQualite: 15 },
  { code: "ines", prenom: "Inès", appelsDecroches: 480, minutesDeTraitement: 3_600, appelsEmis: 360, contactsArgumentes: 58, rendezVousPris: 3, rendezVousHonores: 3, noteDeQualite: 17 },
  { code: "bruno", prenom: "Bruno", appelsDecroches: 480, minutesDeTraitement: 2_760, appelsEmis: 400, contactsArgumentes: 58, rendezVousPris: 2, rendezVousHonores: 2, noteDeQualite: 14 },
];

/** Les créneaux de ligne et de prospection que chaque téléacteur tient par jour, dans le planning du mois. */
export const CRENEAUX_DE_CHAQUE_TELEACTEUR = { ligne: 2, prospection: 1 } as const;

/**
 * CE QUE COÛTE UN TÉLÉACTEUR PAR MOIS (hypothèses du cours) : 2 640 € de salaire et de cotisations
 * patronales, 240 € de poste (casque, licence du logiciel de gestion des appels, couplage avec le
 * fichier clients). 2 880 € pour 120 heures au téléphone : 24 € l'heure.
 */
export const COUT_D_UN_TELEACTEUR = { salaireCharge: 2_640, posteEtLogiciel: 240 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// LA PROSPECTION, ET CE QUI LA CHANGERAIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * LE TAUX DE RENDEZ-VOUS D'UN CONTACT ARGUMENTÉ : celui de la prospection de N (fiche d'ATLAS CONSEIL),
 * 60 rendez-vous pour 1 200 contacts. Le plateau le garde : il appelle les mêmes entreprises avec le
 * même argumentaire.
 */
export function tauxDeRendezVousDeN(f: FicheDuCabinet = ATLAS_CONSEIL) {
  const p = f.canaux.find((k) => k.code === "prospection") ?? CANAUX[0]!;
  return p.rendezVous / p.contacts;
}

/**
 * LES RENDEZ-VOUS QU'HUGO PEUT TENIR (hypothèse du cours) : 16 par mois, 4 par semaine. En N, il en
 * tenait de 34 à 46 par trimestre, tous canaux confondus, en passant aussi ses journées au téléphone.
 * Au-delà, un rendez-vous pris attend des semaines, et le prospect se refroidit.
 */
export const RENDEZ_VOUS_QU_HUGO_PEUT_TENIR = 16;

/**
 * L'OBJECTIF DE CONQUÊTE DU PLATEAU (hypothèse du cours) : au moins 15 rendez-vous pris par mois. À
 * 10 honorés pour 12 pris, et 1 contrat pour 20 rendez-vous tenus (le taux de la prospection de N),
 * 15 rendez-vous par mois font un peu plus de 7 comptes neufs par an : la conquête de N, presque toute
 * par le seul téléphone.
 */
export const RENDEZ_VOUS_VISES = 15;

/**
 * LE RAPPEL PROGRAMMÉ (hypothèse du cours) : quand le décideur n'est pas joint, le téléacteur obtient
 * de son assistante l'heure où le rappeler, et le logiciel replace l'appel à cette heure. L'option du
 * logiciel coûte 200 € par mois pour le plateau ; elle porte les contacts argumentés de 15 % à 20 % des
 * appels émis, sans changer le nombre d'appels par heure.
 */
export const RAPPEL_PROGRAMME = { coutMensuel: 200, joignabilite: 0.2 } as const;

/**
 * LE COÛT VISÉ D'UN RENDEZ-VOUS (hypothèse du cours) : 300 € au plus. C'est un tiers de ce que coûtait
 * un rendez-vous de la prospection de N (54 000 € pour 60 rendez-vous), où le temps d'Hugo au
 * téléphone comptait.
 */
export const COUT_VISE_D_UN_RENDEZ_VOUS = 300;

/**
 * LA PRIME DU MOIS (hypothèse du cours) : 150 € versés au téléacteur qui atteint 3 rendez-vous dans le
 * mois, ce qu'elle coûte au cabinet cotisations comprises. Deux règles sont étudiées : 3 rendez-vous
 * pris (la règle proposée par le superviseur), ou 3 rendez-vous honorés avec au moins 14 sur 20 de
 * note de qualité.
 */
export const PRIME_DU_MOIS = { montant: 150, rendezVous: 3, noteMinimale: 14 } as const;

/** LA RENTRÉE (hypothèse du cas pratique) : la ligne reçoit 25 % d'appels de plus en septembre, à chaque créneau. */
export const HAUSSE_DE_LA_RENTREE = 0.25;

/** L'OCCUPATION QUE PROPOSE LA DIRECTION POUR LA RENTRÉE (hypothèse du cas pratique) : 90 % au lieu de 80 %. */
export const OCCUPATION_PROPOSEE_A_LA_RENTREE = 0.9;

// ─────────────────────────────────────────────────────────────────────────────
// LE MODÈLE
// ─────────────────────────────────────────────────────────────────────────────

const auCentime = arrondi2;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
/** Arrondi à l'entier supérieur, sans qu'un calcul en virgule flottante ne fasse monter un entier exact. */
const plafond = (x: number) => Math.ceil(x - 1e-9);
const plancher = (x: number) => Math.floor(x + 1e-9);

/** Les leviers de la ligne : les appels reçus et les présents de chaque créneau, la DMT, l'occupation cible. */
export interface LeviersDeLaLigne {
  appelsRecus: readonly number[];
  presents: readonly number[];
  dmt: number;
  occupation: number;
}

/**
 * LA LIGNE CLIENTS, CRÉNEAU PAR CRÉNEAU. Charge = appels reçus × DMT (en minutes). Un téléacteur traite
 * au plus (créneau × occupation cible) ÷ DMT appels ; les appels décrochés sont les reçus, au plus la
 * capacité des présents. Taux de décroché = décrochés ÷ reçus. Taux d'occupation = décrochés × DMT ÷
 * (présents × créneau). Effectif nécessaire = charge ÷ (créneau × occupation cible), à l'unité
 * supérieure. Puis la journée : les totaux, et l'occupation de la journée.
 */
export function ligneClients(leviers: Partial<LeviersDeLaLigne> = {}) {
  const appelsRecus = leviers.appelsRecus ?? CRENEAUX_DE_LA_LIGNE.map((k) => k.appelsRecus);
  const presents = leviers.presents ?? CRENEAUX_DE_LA_LIGNE.map((k) => k.presents);
  const dmt = leviers.dmt ?? DMT_DE_LA_LIGNE;
  const occupation = leviers.occupation ?? OCCUPATION_CIBLE;
  const minutesUtiles = MINUTES_D_UN_CRENEAU * occupation;
  const parTeleacteur = plancher(minutesUtiles / dmt);
  const creneaux = CRENEAUX_DE_LA_LIGNE.map((k, i) => {
    const recus = appelsRecus[i]!;
    const n = presents[i]!;
    const charge = auCentime(recus * dmt);
    const capacite = n * parTeleacteur;
    const decroches = Math.min(recus, capacite);
    const effectifExact = charge / minutesUtiles;
    return {
      code: k.code,
      libelle: k.libelle,
      recus,
      presents: n,
      charge,
      capacite,
      decroches,
      perdus: recus - decroches,
      tauxDeDecroche: decroches / recus,
      occupation: n > 0 ? (decroches * dmt) / (n * MINUTES_D_UN_CRENEAU) : 0,
      effectifExact,
      // À l'unité au-dessus, depuis le quotient écrit à deux décimales, comme sur la copie.
      effectifNecessaire: plafond(auCentime(effectifExact)),
    };
  });
  const recus = somme(creneaux.map((k) => k.recus));
  const decroches = somme(creneaux.map((k) => k.decroches));
  const creneauxTenus = somme(creneaux.map((k) => k.presents));
  return {
    dmt,
    occupationCible: occupation,
    minutesUtiles,
    parTeleacteur,
    creneaux,
    recus,
    decroches,
    perdus: recus - decroches,
    tauxDeDecroche: decroches / recus,
    charge: auCentime(somme(creneaux.map((k) => k.charge))),
    creneauxTenus,
    occupation: creneauxTenus > 0 ? (decroches * dmt) / (creneauxTenus * MINUTES_D_UN_CRENEAU) : 0,
    effectifNecessaire: creneaux.map((k) => k.effectifNecessaire),
    creneauxNecessaires: somme(creneaux.map((k) => k.effectifNecessaire)),
  };
}

/** Le coût d'un téléacteur par mois, ses heures au téléphone, et le coût d'une heure. */
export function coutDuPlateau() {
  const parMois = COUT_D_UN_TELEACTEUR.salaireCharge + COUT_D_UN_TELEACTEUR.posteEtLogiciel;
  const heures = CRENEAUX_D_UN_TELEACTEUR * (MINUTES_D_UN_CRENEAU / 60) * JOURS_DU_MOIS;
  return { parMois, heures, coutHoraire: auCentime(parMois / heures), plateau: parMois * TELEACTEURS.length };
}

/** Les heures du mois que représente un créneau tenu chaque jour. */
export const heuresDuMoisDUnCreneau = () => (MINUTES_D_UN_CRENEAU / 60) * JOURS_DU_MOIS;

/** Les leviers de la prospection : les téléacteurs du plateau, les créneaux de ligne par jour, les appels par heure, la joignabilité, le rappel programmé. */
export interface LeviersDeLaProspection {
  teleacteurs: number;
  creneauxDeLigne: number;
  appelsParHeure: number;
  joignabilite: number;
  rappelProgramme: boolean;
}

/** La joignabilité du mois : contacts argumentés ÷ appels émis. */
export const joignabiliteDuMois = () => somme(TELEACTEURS.map((t) => t.contactsArgumentes)) / somme(TELEACTEURS.map((t) => t.appelsEmis));

/** Les appels émis par heure de prospection, dans le mois. */
export const appelsParHeureDuMois = () =>
  somme(TELEACTEURS.map((t) => t.appelsEmis)) / (TELEACTEURS.length * CRENEAUX_DE_CHAQUE_TELEACTEUR.prospection * heuresDuMoisDUnCreneau());

/**
 * LA PROSPECTION DU MOIS. Les créneaux de prospection par jour sont ceux que la ligne laisse :
 * téléacteurs × 3 − créneaux de ligne. Heures = créneaux × 2 × 20 ; appels émis = heures × appels par
 * heure ; contacts argumentés = appels × joignabilité (celle du rappel programmé s'il est pris) ;
 * rendez-vous = contacts × le taux de rendez-vous de N (des rendez-vous attendus, non arrondis). Coût
 * = heures × coût horaire (+ l'option du rappel) ; coût d'un rendez-vous = coût ÷ rendez-vous.
 */
export function prospectionDuMois(leviers: Partial<LeviersDeLaProspection> = {}) {
  const teleacteurs = leviers.teleacteurs ?? TELEACTEURS.length;
  const creneauxDeLigne = leviers.creneauxDeLigne ?? ligneClients().creneauxTenus;
  const appelsParHeure = leviers.appelsParHeure ?? appelsParHeureDuMois();
  const rappelProgramme = leviers.rappelProgramme ?? false;
  const joignabilite = rappelProgramme ? RAPPEL_PROGRAMME.joignabilite : (leviers.joignabilite ?? joignabiliteDuMois());
  const c = coutDuPlateau();
  const creneaux = Math.max(0, teleacteurs * CRENEAUX_D_UN_TELEACTEUR - creneauxDeLigne);
  const heures = creneaux * heuresDuMoisDUnCreneau();
  const appels = heures * appelsParHeure;
  const contacts = appels * joignabilite;
  const rendezVous = contacts * tauxDeRendezVousDeN();
  const cout = auCentime(heures * c.coutHoraire + (rappelProgramme ? RAPPEL_PROGRAMME.coutMensuel : 0));
  return {
    teleacteurs,
    creneauxDeLigne,
    creneaux,
    heures,
    appelsParHeure,
    joignabilite,
    rappelProgramme,
    appels,
    contacts,
    rendezVous,
    cout,
    coutParRendezVous: rendezVous > 0 ? auCentime(cout / rendezVous) : null,
    auDelaDeHugo: Math.max(0, rendezVous - RENDEZ_VOUS_QU_HUGO_PEUT_TENIR),
  };
}

/** Le tableau de bord individuel du mois : chaque téléacteur, ses indicateurs de ligne, de prospection et de qualité, et les deux règles de prime. */
export function tableauDeBordDesTeleacteurs() {
  const heuresDeLigne = CRENEAUX_DE_CHAQUE_TELEACTEUR.ligne * heuresDuMoisDUnCreneau();
  const heuresDeProspection = CRENEAUX_DE_CHAQUE_TELEACTEUR.prospection * heuresDuMoisDUnCreneau();
  const p = PRIME_DU_MOIS;
  const teleacteurs = TELEACTEURS.map((t) => ({
    ...t,
    dmt: t.minutesDeTraitement / t.appelsDecroches,
    occupation: t.minutesDeTraitement / (heuresDeLigne * 60),
    appelsParHeure: t.appelsEmis / heuresDeProspection,
    joignabilite: t.contactsArgumentes / t.appelsEmis,
    tauxDeRendezVous: t.rendezVousPris / t.contactsArgumentes,
    tauxDHonoration: t.rendezVousHonores / t.rendezVousPris,
    primeSurLesPris: t.rendezVousPris >= p.rendezVous,
    primeSurLesHonores: t.rendezVousHonores >= p.rendezVous && t.noteDeQualite >= p.noteMinimale,
  }));
  const total = (cle: "appelsDecroches" | "minutesDeTraitement" | "appelsEmis" | "contactsArgumentes" | "rendezVousPris" | "rendezVousHonores") => somme(TELEACTEURS.map((t) => t[cle]));
  const primesSurLesPris = teleacteurs.filter((t) => t.primeSurLesPris).length;
  const primesSurLesHonores = teleacteurs.filter((t) => t.primeSurLesHonores).length;
  return {
    heuresDeLigne,
    heuresDeProspection,
    teleacteurs,
    appelsDecroches: total("appelsDecroches"),
    minutesDeTraitement: total("minutesDeTraitement"),
    appelsEmis: total("appelsEmis"),
    contactsArgumentes: total("contactsArgumentes"),
    rendezVousPris: total("rendezVousPris"),
    rendezVousHonores: total("rendezVousHonores"),
    dmt: total("minutesDeTraitement") / total("appelsDecroches"),
    tauxDHonoration: total("rendezVousHonores") / total("rendezVousPris"),
    primesSurLesPris,
    primesSurLesHonores,
    coutDesPrimesSurLesPris: primesSurLesPris * p.montant,
    coutDesPrimesSurLesHonores: primesSurLesHonores * p.montant,
  };
}

/** Les appels de la rentrée, créneau par créneau : les reçus de la journée type, plus la hausse. */
export const appelsDeLaRentree = () => CRENEAUX_DE_LA_LIGNE.map((k) => Math.round(k.appelsRecus * (1 + HAUSSE_DE_LA_RENTREE)));
