/**
 * LE DOSSIER DE SOINS QUE PERSONNE NE REMPLIT — le modèle des transmissions
 * dans trois EHPAD de l'Association Solvanne.
 *
 * Carnéo, le dossier de soins informatisé, est déployé depuis six mois dans
 * les six EHPAD. À Dijon-Montchapet, Dijon-Grésilles et Auxonne, il a pris ;
 * à Beaune, Chalon-sur-Saône et Montbard (248 places, 60 postes de soignants
 * par jour), les transmissions restent sur papier, la moitié des postes les
 * recopient dans Carnéo en fin de poste, les plans de soins ne sont pas à jour
 * et la tablette de nuit dort dans un tiroir. Treize semaines d'avril à juin,
 * six décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · L'OUTIL N'EST UTILISÉ QUE LÀ OÙ SE FONT LES SOINS. La part des
 *     transmissions saisies au moment du soin plafonne à ce que le travail
 *     réel permet : une tablette fixée au mur du poste de soins, à l'autre
 *     bout de l'étage, et rien la nuit, la tiennent à 20 % ; des tablettes sur
 *     les chariots, un téléphone par soignant de nuit et le Wi-Fi dans les
 *     étages de Montbard la portent à 55 % ; des plans de soins refaits avec
 *     les équipes, où chacun retrouve les soins qu'il fait, la portent à 90 %.
 *     Les plans de soins valent peu sans le matériel au chariot : on ne valide
 *     pas au fil des soins un plan qu'on consulte à l'autre bout du couloir.
 *   · LES RÉFÉRENTS FONT MONTER L'USAGE, AVEC RETARD. Deux soignants formés
 *     par établissement, avec deux heures par semaine pour leurs collègues,
 *     font converger l'usage vers ce plafond trois fois plus vite ; leur effet
 *     ne se voit que deux semaines après leur formation. Une formation en
 *     salle donne trois points, qui ne tiennent pas.
 *   · L'OBLIGATION FABRIQUE DES RECOPIES, PAS DE L'USAGE. Rendre la saisie
 *     obligatoire et la contrôler chaque jour pousse ceux qui ne peuvent pas
 *     saisir au moment du soin à recopier leur papier en fin de poste :
 *     vingt minutes par poste, des transmissions tardives et génériques, et un
 *     climat qui se dégrade (absences, et le départ d'une aide-soignante de
 *     nuit, tiré au hasard). Revenir au papier supprime la double saisie,
 *     mais pas les erreurs du papier ; il laisse les plans de soins à
 *     l'abandon et expose aux reprises de crédits de l'ARS.
 *   · DEUX SUPPORTS, AUCUN COMPLET. Les erreurs de soins (un pansement non
 *     refait, un traitement modifié mais non transmis, une chute non signalée
 *     à l'équipe suivante) sont tirées au hasard chaque semaine ; leur
 *     fréquence suit la qualité des transmissions : faible quand on saisit au
 *     moment du soin, moyenne sur papier, forte quand on recopie après coup,
 *     plus forte encore avec des plans de soins faux et pendant une vague de
 *     chaleur.
 *
 * L'OBJECTIF, en euros (plus haut, mieux c'est) : la valeur du temps de
 * transmission gagné par rapport à la situation d'avril, moins ce que le
 * trimestre a coûté. Le temps se valorise au coût horaire chargé d'un soignant
 * (30 €) : une transmission saisie au moment du soin fait gagner 15 minutes au
 * poste par rapport au papier (relève ciblée, rien à réécrire) ; une recopie en
 * fin de poste en fait perdre 20 (10 une fois le papier retiré : il ne reste que
 * la saisie différée) ; tant que le cahier reste ouvert à côté de Carnéo, chaque
 * relève lit les deux, six minutes par poste. Les coûts : matériel, formation,
 * paramétrage, accompagnement, contrôle des cadres, erreurs de soins (2 000 €
 * chacune en moyenne), absences liées au climat, départ, reprise de crédits.
 * Comme le projet se juge aussi à ce qu'il laisse, la direction ajoute la
 * valeur des huit semaines de l'été au rythme de la fin juin, avec les
 * remplaçants de juillet et d'août.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Les trois EHPAD où Carnéo n'a pas pris : leurs places et leurs postes de soignants par jour. */
export const ETABLISSEMENTS = [
  { nom: "Beaune", places: 88, postes: 21 },
  { nom: "Chalon-sur-Saône", places: 90, postes: 22 },
  { nom: "Montbard", places: 70, postes: 17 },
] as const;
export const PLACES = ETABLISSEMENTS.reduce((s, e) => s + e.places, 0);
export const POSTES_JOUR = ETABLISSEMENTS.reduce((s, e) => s + e.postes, 0);
export const POSTES_SEMAINE = POSTES_JOUR * 7;
/** La part des postes de Montbard, où le Wi-Fi ne couvre ni le deuxième étage ni l'unité protégée. */
export const PART_MONTBARD = ETABLISSEMENTS[2].postes / POSTES_JOUR;

/** Le coût horaire chargé moyen d'un soignant (aide-soignant, AES, infirmier). */
export const COUT_HEURE = 30;
/** Une recopie de fin de poste : la durée moyenne des sessions que les journaux de connexion montrent. */
export const MINUTES_RECOPIE = 20;
/** Ce qu'une transmission saisie au moment du soin fait gagner au poste, par rapport au papier. */
export const MINUTES_GAGNEES = 15;

/** Au départ : 10 % des postes saisissent au moment du soin, 50 % recopient, 40 % restent au papier. */
export const USAGE_DEPART = 0.1;
export const RECOPIE_DEPART = 0.5;
/** Les heures perdues chaque semaine à recopier : la prévision de la semaine 1. */
export const HEURES_DOUBLE_DEPART = (POSTES_SEMAINE * RECOPIE_DEPART * MINUTES_RECOPIE) / 60;
export const TENSION_DEPART = 0.25;
/** L'absentéisme des soignants des trois EHPAD, selon le climat. */
export const absenteisme = (tension: number) => 0.1 + 0.06 * tension;

/** La part des postes qui saisissent au moment du soin, que la direction attend fin juin. */
export const OBJECTIF_USAGE = 0.7;
export const OBJECTIF_DOUBLE = 15;
export const OBJECTIF_ERREURS = 6;

/** Une erreur de soins coûte en moyenne : temps d'analyse et de soins, parfois une hospitalisation, la relation avec la famille. */
export const COUT_ERREUR = 2000;
/** Le taux d'erreurs de soins par semaine, pour les trois EHPAD, quand tout est sur papier. */
export const TAUX_ERREUR = 0.2;
/** Le poids, dans les erreurs, d'une transmission recopiée après coup, et d'une saisie au moment du soin. */
export const POIDS_RECOPIE = 1.8;
export const POIDS_USAGE = 0.3;
/** Recopiée parce qu'un cadre la contrôle, la transmission devient générique : « RAS ». */
export const POIDS_RECOPIE_CONTROLEE = 2.3;
/** Les fiches d'hydratation papier recopiées dans Carnéo : minutes de plus par poste. */
export const MINUTES_FICHES = 5;
/** Ce que la coexistence du cahier et de Carnéo ajoute aux erreurs, au plus (moitié-moitié). */
export const COEXISTENCE = 0.7;
/** Tant que le cahier papier reste ouvert à côté de Carnéo, chacun lit les deux à la relève. */
export const MINUTES_LECTURE = 6;
/**
 * Le temps de transmission de la situation d'avril, en euros par semaine (négatif : du temps
 * perdu) : 10 % de saisies au moment du soin, 50 % de recopies, et le cahier lu à côté de
 * l'écran à chaque relève. Le temps GAGNÉ se compte par rapport à elle.
 */
export const TEMPS_DEPART =
  ((POSTES_SEMAINE * COUT_HEURE) / 60) *
  (MINUTES_GAGNEES * USAGE_DEPART - MINUTES_RECOPIE * RECOPIE_DEPART - MINUTES_LECTURE);

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des recopies faites après le poste, payées en heures supplémentaires. */
export const PERTE_PAR_JOUR = 900;

/** L'été : huit semaines comptées au rythme de la fin juin ; 22 % des postes tenus par des remplaçants. */
export const ETE = 8;
export const PART_REMPLACANTS = 0.22;
export const REMPLACANTS = 38;

/** Les crédits non reconductibles de l'ARS pour le déploiement, et la part des trois EHPAD. */
export const CREDITS_ARS = 54000;
export const REPRISE_ARS = 18000;
export const CHANCE_REPRISE = 0.5;

/** Le départ d'une aide-soignante de nuit expérimentée : intérim de nuit jusqu'au recrutement, recrutement. */
export const COUT_DEPART = 9000;
/** Les absences que le climat fait remplacer, par semaine et par point de tension. */
export const COUT_TENSION = 800;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  terrain: 0,
  plans: 1,
  referents: 2,
  bascule: 3,
  canicule: 4,
  ete: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 2, 3] as const;

export const MATERIEL = {
  tablettes: 18,
  prixTablette: 620,
  telephones: 6,
  prixTelephone: 390,
  bornes: 3,
  prixBorne: 700,
} as const;
export const COUT_MATERIEL =
  MATERIEL.tablettes * MATERIEL.prixTablette +
  MATERIEL.telephones * MATERIEL.prixTelephone +
  MATERIEL.bornes * MATERIEL.prixBorne;

/** Le paramétrage des plans de soins avec les équipes : une heure de soignants par résident, remplacée. */
export const HEURES_PAR_RESIDENT = 1;
export const COUT_PARAMETRAGE = PLACES * HEURES_PAR_RESIDENT * COUT_HEURE;

/** Six référents (un de jour, un de nuit par EHPAD) : deux jours de formation, puis deux heures par semaine. */
export const REFERENTS = 6;
export const COUT_FORMATION_REFERENTS = REFERENTS * 2 * 7 * COUT_HEURE;
export const COUT_HEBDO_REFERENTS = REFERENTS * 2 * COUT_HEURE;

export const COUTS = {
  /** Le contrôle quotidien : trente minutes par jour pour chacun des trois cadres de santé. */
  controle: 300,
  saisieRapide: 8500,
  plansTypes: 4800,
  /** Le formateur de l'éditeur, une journée par EHPAD, et deux heures de chaque soignant (120). */
  formateur: 3 * 1400 + 120 * 2 * COUT_HEURE,
  /** La présence de l'éditeur et du technicien aux bascules : deux jours par EHPAD. */
  bascule: 3 * 2 * 900,
  /** Un démarrage difficile : une semaine de renfort de l'éditeur. */
  demarrage: 6000,
  canicule: 600,
  /** Des comptes nominatifs pour les remplaçants de l'été, et une demi-heure d'accueil par un référent. */
  comptes: REMPLACANTS * 15 + REMPLACANTS * 0.5 * 2 * COUT_HEURE,
  /** Relancer Carnéo en septembre après l'avoir suspendu l'été. */
  relance: 6000,
  /** Un incident sur un compte partagé : analyse, mise en conformité, réclamation. */
  incident: 10000,
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
  effet: { erreurs?: number; usage?: number; recopie?: number; tension?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "reseau",
    titre: "Panne du réseau à Chalon-sur-Saône",
    de: "Odon Sabran",
    role: "Technicien des systèmes d'information",
    texte:
      "La liaison internet de l'EHPAD de Chalon est coupée une journée et demie : procédure dégradée, transmissions sur papier, à ressaisir ensuite.",
    duree: 1,
    effet: { erreurs: 1.3, usage: 0.75, recopie: 0.1 },
  },
  {
    id: "version",
    titre: "Nouvelle version de Carnéo",
    de: "Halina Ostrowska",
    role: "Cheffe de projet, éditeur de Carnéo",
    texte:
      "La nouvelle version de Carnéo change l'écran des transmissions ciblées : une semaine pour que chacun retrouve ses repères.",
    duree: 1,
    effet: { usage: 0.85, recopie: 0.05 },
  },
  {
    id: "gastro",
    titre: "Épidémie de gastro-entérite à Beaune",
    de: "Greta Quenardel",
    role: "Cadre de santé, EHPAD de Beaune",
    texte:
      "Une gastro-entérite touche trente résidents et six soignants de l'EHPAD de Beaune : mesures d'isolement, deux semaines de travail sous tension.",
    duree: 2,
    effet: { erreurs: 1.35, usage: 0.9, tension: 0.03 },
  },
  {
    id: "ponts",
    titre: "Les ponts de mai",
    de: "Eudoxie Rambourg",
    role: "Directrice administrative et financière",
    texte:
      "Avec les ponts de mai, un poste sur six est tenu par un remplaçant de Soralis Intérim Santé, sans compte Carnéo : ses transmissions sont sur papier.",
    duree: 2,
    effet: { usage: 0.88, recopie: 0.06, erreurs: 1.1 },
  },
  {
    id: "idec",
    titre: "L'infirmière coordinatrice de Montbard en arrêt",
    de: "Valère Bellefontaine",
    role: "Directeur de l'EHPAD de Montbard",
    texte:
      "L'infirmière coordinatrice de Montbard est en arrêt pour trois semaines : personne pour tenir les plans de soins et relire les transmissions.",
    duree: 3,
    effet: { erreurs: 1.15, usage: 0.95 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Ce que la semaine ajoute ou retire au rythme d'adoption. */
  adoption: number;
  /** La charge de soins de la semaine, qui fait varier les erreurs. */
  charge: number;
  /** Le tirage qui dit combien d'erreurs de soins la semaine produit. */
  uErreurs: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Une aide-soignante de nuit démissionne-t-elle si le climat se dégrade ? */
  uDepart: number;
  /** L'ARS reprend-elle les crédits si l'on revient au papier ? */
  uArs: number;
  /** Trouve-t-on un volontaire de nuit à Montbard pour être référent ? */
  uVolontaire: number;
  /** La bascule se passe-t-elle mal ? */
  uBascule: number;
  /** L'intensité de la chaleur de la mi-juin. */
  uChaleur: number;
  /** Un compte partagé donne-t-il lieu à un incident ? */
  uCompte: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000969 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      adoption: Math.min(1.3, Math.max(0.7, 1 + 0.1 * gauss(r))),
      charge: Math.min(1.35, Math.max(0.7, 1 + 0.12 * gauss(r))),
      uErreurs: r(),
    });
  }
  const uDepart = r();
  const uArs = r();
  const uVolontaire = r();
  const uBascule = r();
  const uChaleur = r();
  const uCompte = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uDepart, uArs, uVolontaire, uBascule, uChaleur, uCompte, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le nombre d'erreurs d'une semaine : une loi de Poisson, lue au tirage de la semaine. */
export function erreursDeLaSemaine(lambda: number, u: number): number {
  let k = 0;
  let p = Math.exp(-lambda);
  let cumul = p;
  while (u > cumul && k < 12) {
    k += 1;
    p *= lambda / k;
    cumul += p;
  }
  return k;
}

/** Deux fois sur trois, un soignant de nuit se porte volontaire à Montbard pour être référent. */
export const CHANCE_VOLONTAIRE = 0.65;
export const volontaireDeNuit = (graine: number) => hasard(graine).uVolontaire < CHANCE_VOLONTAIRE;

/**
 * LA CHALEUR DE LA MI-JUIN (semaines 11 et 12) : pas de vague une fois sur trois
 * environ, un épisode modéré quatre fois sur dix, une vague forte une fois sur quatre.
 */
export const CHALEUR = [
  { seuil: 0.35, intensite: 0.3, nom: "des températures de saison" },
  { seuil: 0.75, intensite: 1, nom: "un épisode de chaleur modéré" },
  { seuil: 1, intensite: 2, nom: "une vague de chaleur forte" },
] as const;
export const chaleur = (graine: number) =>
  CHALEUR.find((c) => hasard(graine).uChaleur < c.seuil) ?? CHALEUR[2];
export const SEMAINES_CHALEUR = [11, 12] as const;
/** Les événements liés à la chaleur (déshydratation, malaise), par semaine chaude d'intensité 1. */
export const CHALEUR_EVENEMENTS = 2;

/**
 * CE QUI PROTÈGE DE LA CHALEUR : un plan de soins canicule dans Carnéo, avec ses
 * rappels d'hydratation au chariot, protège d'autant mieux que l'usage est réel et
 * le matériel au plus près des chambres ; les fiches papier en chambre, recopiées,
 * protègent toujours, mais coûtent du temps ; le plan bleu habituel protège moins.
 */
export function vulnerabiliteALaChaleur(chemin: readonly number[], usage: number): number {
  const materiel = chemin[D.terrain] === 1;
  if (chemin[D.canicule] === 0) return 0.8 - 0.65 * usage * (materiel ? 1 : 0.5);
  if (chemin[D.canicule] === 1) return 0.3;
  return 0.55;
}

/**
 * UNE BASCULE QUI SE PASSE MAL : retirer le papier dans les trois EHPAD la
 * même semaine, avec un seul technicien et l'éditeur, échoue une fois sur
 * trois quand le matériel est au chariot, deux fois sur trois sinon ; un
 * établissement à la fois, le risque est le même, mais il ne touche qu'un
 * tiers des postes, et les deux autres profitent de ce que le premier a appris.
 */
export const risqueDeDemarrage = (chemin: readonly number[]) =>
  chemin[D.terrain] === 1 ? 0.35 : 0.7;
export const demarrageDifficile = (chemin: readonly number[], graine: number) =>
  (chemin[D.bascule] === 1 || chemin[D.bascule] === 2) &&
  hasard(graine).uBascule < risqueDeDemarrage(chemin);

/** Le risque qu'une aide-soignante de nuit démissionne, lu sur le climat en fin de semaine 9. */
export const risqueDeDepart = (tension: number) =>
  Math.min(0.8, Math.max(0, (tension - 0.35) * 1.6));

/** L'ARS reprend les crédits des trois EHPAD une fois sur deux si l'on revient au papier. */
export const repriseDesCredits = (chemin: readonly number[], graine: number) =>
  chemin[D.bascule] === 0 && hasard(graine).uArs < CHANCE_REPRISE;

/** Quatre fois sur dix, un compte partagé par les remplaçants finit par un incident de traçabilité. */
export const CHANCE_INCIDENT = 0.4;
export const incidentDeCompte = (chemin: readonly number[], graine: number) =>
  chemin[D.ete] === 2 && hasard(graine).uCompte < CHANCE_INCIDENT;

/** La part des postes passés au tout-Carnéo, le papier retiré, semaine par semaine. */
export function partBasculee(chemin: readonly number[], w: number): number {
  if (chemin[D.bascule] === 1) return w >= 9 ? 1 : 0;
  if (chemin[D.bascule] === 2) return w >= 13 ? 1 : w >= 11 ? 2 / 3 : w >= 9 ? 1 / 3 : 0;
  return 0;
}

export type Semaine = {
  /** La part des postes qui saisissent leurs transmissions au moment du soin. */
  usage: number;
  /** La part des postes qui recopient après coup. */
  recopie: number;
  papier: number;
  /** Les heures de soignants passées à recopier, sur la semaine. */
  heuresDouble: number;
  /** Les erreurs de soins de la semaine, et leur cumul. */
  erreurs: number;
  erreursCumul: number;
  absenteisme: number;
  /** La valeur du temps de transmission gagné (négative quand on recopie). */
  temps: number;
  /** Ce que la semaine a coûté : achats, heures, erreurs, absences, départ, reprise. */
  cout: number;
  /** Le solde du projet depuis le début du trimestre. */
  solde: number;
  plans: number;
  tension: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le temps gagné moins les coûts, été compris : plus c'est haut, mieux c'est. */
  objectif: number;
  /** La valeur du temps de transmission gagné sur le trimestre. */
  tempsGagne: number;
  /** Les coûts du trimestre : achats, heures, erreurs, absences, départ, reprise. */
  couts: number;
  /** Ce que valent les huit semaines de l'été au rythme de la fin juin. */
  ete: number;
  heuresDoubleDepart: number;
  heuresDoubleTotal: number;
  usageFinal: number;
  heuresDoubleFinal: number;
  erreurs: number;
  absenteismeMoyen: number;
  depart: boolean;
  repriseArs: boolean;
  volontaire: boolean;
  demarrageDifficile: boolean;
  incident: boolean;
  chaleur: string;
}

/** Le papier est-il revenu dans les trois EHPAD ? */
export const papierActif = (chemin: readonly number[]) => chemin[D.bascule] === 0;

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La part des plans de soins qui correspondent aux soins réellement faits. */
function plansAJour(d2: number | undefined, w: number): number {
  if (d2 === 0) return w >= 5 ? 0.35 : 0;
  if (d2 === 1) return w >= 6 ? 1 : w === 5 ? 0.6 : w === 4 ? 0.3 : 0;
  if (d2 === 2) return w >= 4 ? Math.min(0.5, 0.06 * (w - 3)) : 0;
  return 0;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const volontaire = volontaireDeNuit(graine);
  const demarrage = demarrageDifficile(chemin, graine);
  const reprise = repriseDesCredits(chemin, graine);
  const incident = incidentDeCompte(chemin, graine);
  const vague = chaleur(graine);
  const semaines: (Semaine | null)[] = [null];
  let usage = USAGE_DEPART;
  let recopie = RECOPIE_DEPART;
  let tension = TENSION_DEPART;
  let erreursCumul = 0;
  let solde = 0;
  let tempsGagne = 0;
  let couts = 0;
  let heuresDoubleTotal = 0;
  let depart = false;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  let minutesRecopie = MINUTES_RECOPIE;
  let materiel = 0;
  let plans = 0;
  let poidsRecopie = POIDS_RECOPIE;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;

    const papier = d4 === 0 && w >= 8;
    const obligation = d1 === 0 && w >= 2 && !papier;
    const f = partBasculee(chemin, w);
    materiel = d1 === 1 && w >= 3 ? 1 : 0;
    plans = plansAJour(d2, w);
    const referents = d3 === 0 && w >= 8;

    // Le plafond : ce que le travail réel permet de saisir au moment du soin.
    let plafond = 0.2 + 0.35 * materiel + 0.15 * plans + 0.2 * materiel * plans;
    if (materiel && !(d3 === 0 && volontaire) && w >= 8) plafond -= 0.03; // la nuit de Montbard
    if (referents) plafond += 0.05;
    if (obligation) plafond += 0.04;
    if (d1 === 2 && w >= 7) plafond += 0.03;
    if (d5 === 2 && w >= 10) plafond -= 0.08; // les fiches en chambre ramènent le papier
    plafond += 0.08 * f;
    if (papier) plafond = 0.02;
    plafond = borne(plafond, 0, 0.92);

    // Le rythme auquel l'usage s'en approche : l'accompagnement, et le hasard de la semaine.
    let rythme = 0.08;
    if (referents) rythme += 0.22;
    if (d3 === 2 && w >= 6) rythme += d2 === 2 ? 0.03 : 0.07;
    if (d3 === 1 && w >= 7) rythme += 0.02;
    if (obligation) rythme *= 0.7; // on se met en règle plutôt qu'on apprend
    rythme *= n.adoption;
    if (papier) rythme = 0.5;
    if (plafond < usage) rythme = Math.max(rythme, 0.3);
    usage += rythme * (plafond - usage);
    if (d3 === 1 && w === 6) usage += 0.03; // la journée du formateur
    if (d3 === 1 && w === 9) usage -= 0.02; // ... qui ne tient pas
    let usageVu = usage;
    // Un démarrage difficile : des comptes bloqués, une procédure dégradée mal connue, le cahier ressorti.
    if (demarrage && w >= 9 && w <= 10) usageVu *= d4 === 1 ? 0.8 : 0.95;
    for (const a of actifs) usageVu *= a.imprevu.effet.usage ?? 1;
    usageVu = borne(usageVu, 0, 0.95);

    // Ceux qui ne saisissent pas au moment du soin : la part qui recopie après coup.
    let part = 0.5 / 0.9;
    if (obligation) part = 0.92;
    if (papier) part = 0;
    part = (1 - f) * part + f;
    recopie += 0.6 * (part * (1 - usage) - recopie);
    let recopieVue = recopie;
    for (const a of actifs) recopieVue += a.imprevu.effet.recopie ?? 0;
    if (d5 === 2 && w >= 10 && !papier) recopieVue += 0.08; // l'hydratation notée en chambre, parfois reprise
    recopieVue = borne(recopieVue, 0, 1 - usageVu);
    const papierSeul = 1 - usageVu - recopieVue;

    // Le temps : une recopie de 20 minutes, 10 une fois le papier retiré ; la saisie rapide en ôte 30 %.
    minutesRecopie = MINUTES_RECOPIE * (1 - 0.5 * f) * (d1 === 2 && w >= 7 ? 0.7 : 1);
    const heuresDouble = (POSTES_SEMAINE * recopieVue * minutesRecopie) / 60;
    // Les fiches d'hydratation en chambre, recopiées dans Carnéo : cinq minutes de plus par poste.
    const fiches = d5 === 1 && w >= 10 ? MINUTES_FICHES : 0;
    // Deux supports ouverts : à la relève, on lit le cahier, puis l'écran.
    const lecture = papier ? 0 : MINUTES_LECTURE * (1 - f);
    const temps =
      ((POSTES_SEMAINE * COUT_HEURE) / 60) *
        (MINUTES_GAGNEES * usageVu - minutesRecopie * recopieVue - fiches - lecture) -
      TEMPS_DEPART;

    // Les erreurs de soins : deux supports, aucun complet ; des plans faux ; la chaleur.
    // Recopiée sous contrôle, la transmission devient générique (« RAS ») ; le papier retiré, la
    // saisie différée reste sur un seul support, sauf sans matériel : des notes sur des bouts de papier.
    const poidsDeuxSupports = obligation ? POIDS_RECOPIE_CONTROLEE : POIDS_RECOPIE;
    poidsRecopie = (1 - f) * poidsDeuxSupports + f * (materiel ? 0.9 : 2.2);
    let lambda =
      TAUX_ERREUR *
      (papierSeul + poidsRecopie * recopieVue + POIDS_USAGE * usageVu) *
      (1.3 - 0.3 * (papier ? 0 : plans)) *
      n.charge;
    // Deux supports ouverts, chacun à moitié rempli : l'information se perd entre les deux.
    if (!papier) lambda *= 1 + COEXISTENCE * 4 * usageVu * (1 - usageVu) * (1 - f);
    if (d2 === 2 && d3 === 2 && w >= 6) lambda *= 1.08; // l'IDEC n'a plus le temps de relire
    for (const a of actifs) lambda *= a.imprevu.effet.erreurs ?? 1;
    if ((SEMAINES_CHALEUR as readonly number[]).includes(w)) {
      lambda += CHALEUR_EVENEMENTS * vague.intensite * vulnerabiliteALaChaleur(chemin, usageVu);
    }
    if (demarrage && w >= 9 && w <= 10) lambda *= 1 + (d4 === 1 ? 2 : 0.25);
    const erreurs = erreursDeLaSemaine(lambda, n.uErreurs);
    erreursCumul += erreurs;

    // Le climat des équipes.
    tension += -0.01;
    if (obligation) tension += 0.05;
    if (f > 0 && !materiel) tension += 0.04 * f;
    if (referents) tension -= 0.02;
    if (d4 === 3 && w >= 8) tension += 0.015; // un rappel à l'ordre après l'événement, et rien d'autre
    if (d2 === 1 && w >= 4 && w <= 6) tension -= 0.02;
    if (d2 === 2 && w >= 4) tension += 0.01;
    if (demarrage && w >= 9 && w <= 10) tension += d4 === 1 ? 0.08 : 0.02;
    for (const a of actifs) tension += a.imprevu.effet.tension ?? 0;
    tension = borne(tension, 0, 1);
    if (w === 9 && h.uDepart < risqueDeDepart(tension)) depart = true;

    // Ce que la semaine coûte.
    let achats = 0;
    if (obligation) achats += COUTS.controle;
    if (d1 === 1 && w === 2) achats += COUT_MATERIEL;
    if (d1 === 2 && w === 2) achats += COUTS.saisieRapide;
    if (d2 === 0 && w === 4) achats += COUTS.plansTypes;
    if (d2 === 1 && w >= 4 && w <= 6) achats += COUT_PARAMETRAGE / 3;
    if (d3 === 0 && (w === 6 || w === 7)) achats += COUT_FORMATION_REFERENTS / 2;
    if (referents) achats += COUT_HEBDO_REFERENTS;
    if (d3 === 1 && w === 6) achats += COUTS.formateur;
    if (d4 === 1 && (w === 8 || w === 9)) achats += COUTS.bascule / 2;
    if (d4 === 2 && (w === 9 || w === 11 || w === 13)) achats += COUTS.bascule / 3 + 200;
    if (demarrage && w === 9) achats += d4 === 1 ? COUTS.demarrage : COUTS.demarrage / 3;
    if (d5 === 0 && w === 10) achats += COUTS.canicule;
    if (d6 === 0 && w === 12) achats += COUTS.comptes;
    if (d6 === 1 && w === 13) achats += COUTS.relance;
    const absences = COUT_TENSION * tension;
    const departCout = depart && w === 10 ? COUT_DEPART : 0;
    const repriseCout = reprise && w === 12 ? REPRISE_ARS : 0;
    const incidentCout = incident && w === 13 ? COUTS.incident : 0;
    cout += achats + erreurs * COUT_ERREUR + absences + departCout + repriseCout + incidentCout;

    tempsGagne += temps;
    couts += cout;
    solde += temps - cout;
    heuresDoubleTotal += heuresDouble;

    semaines.push({
      usage: usageVu,
      recopie: recopieVue,
      papier: papierSeul,
      heuresDouble,
      erreurs,
      erreursCumul,
      absenteisme: absenteisme(tension),
      temps,
      cout,
      solde,
      plans,
      tension,
    });
  }

  // L'ÉTÉ : huit semaines au rythme de la fin juin, avec les remplaçants de juillet et d'août.
  const fin = semaines[SEMAINES]!;
  let uEte = usage;
  let cEte = recopie;
  let pEte = Math.max(0, 1 - usage - recopie);
  if (d6 === 0 || d6 === 2) uEte = usage * (d3 === 0 ? 0.96 : 0.88);
  if (d6 === 3) {
    uEte = usage * (1 - PART_REMPLACANTS);
    cEte = recopie + PART_REMPLACANTS * 0.6 * usage;
  }
  if (d6 === 1) {
    uEte = 0;
    cEte = 0;
  }
  if (papierActif(chemin)) {
    uEte = Math.min(uEte, 0.02);
    cEte = 0;
  }
  pEte = Math.max(0, 1 - uEte - cEte);
  const seulPapier = papierActif(chemin) || d6 === 1;
  const lectureEte = seulPapier ? 0 : MINUTES_LECTURE * (1 - partBasculee(chemin, SEMAINES));
  const plansEte = seulPapier ? 0 : plans;
  const tempsEte =
    ((POSTES_SEMAINE * COUT_HEURE) / 60) *
      (MINUTES_GAGNEES * uEte - minutesRecopie * cEte - lectureEte) -
    TEMPS_DEPART;
  const erreursEte =
    TAUX_ERREUR *
    (pEte + poidsRecopie * cEte + POIDS_USAGE * uEte) *
    (1.3 - 0.3 * plansEte) *
    (seulPapier
      ? 1
      : 1 + COEXISTENCE * 4 * uEte * (1 - uEte) * (1 - partBasculee(chemin, SEMAINES)));
  const ete =
    ETE * (tempsEte - erreursEte * COUT_ERREUR - COUT_TENSION * fin.tension) -
    (d3 === 0 ? ETE * COUT_HEBDO_REFERENTS * 0.5 : 0);

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: solde + ete,
    tempsGagne,
    couts,
    ete,
    heuresDoubleDepart: HEURES_DOUBLE_DEPART,
    heuresDoubleTotal,
    usageFinal: fin.usage,
    heuresDoubleFinal: fin.heuresDouble,
    erreurs: erreursCumul,
    absenteismeMoyen: pleines.reduce((s, x) => s + x.absenteisme, 0) / SEMAINES,
    depart,
    repriseArs: reprise,
    volontaire,
    demarrageDifficile: demarrage,
    incident,
    chaleur: vague.nom,
  };
}

/** Ce qui s'est passé pendant des semaines : erreurs, départ, reprise, bascule, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const erreurs = t.semaines.slice(de, a + 1).reduce((s, x) => s + (x ? x.erreurs : 0), 0);
  return {
    erreurs,
    depart: t.depart && dans(10),
    reprise: t.repriseArs && dans(12),
    demarrage: t.demarrageDifficile && dans(9),
    incident: t.incident && dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDossier {
  usage: number | null;
  heuresDouble: number | null;
  erreurs: number | null;
  absenteisme: number | null;
  solde: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  recopie: number | null;
  plans: number | null;
}

/** Ce que Fulbert lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDossier {
  if (semaine === 0) {
    return {
      usage: USAGE_DEPART,
      heuresDouble: HEURES_DOUBLE_DEPART,
      erreurs: 0,
      absenteisme: absenteisme(TENSION_DEPART),
      solde: 0,
      recopie: RECOPIE_DEPART,
      plans: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    usage: s.usage,
    heuresDouble: s.heuresDouble,
    erreurs: s.erreursCumul,
    absenteisme: s.absenteisme,
    solde: s.solde,
    recopie: s.recopie,
    plans: s.plans,
  };
}
