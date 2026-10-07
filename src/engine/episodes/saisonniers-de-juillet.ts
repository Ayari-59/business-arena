/**
 * LES SAISONNIERS DE JUILLET — le modèle de la réception de L'Escale Évian.
 *
 * Un hôtel 4 étoiles de 66 chambres au bord du Léman, de juin à août. Six
 * réceptionnistes permanents tiennent le comptoir en juin ; huit saisonniers
 * les rejoignent le lundi 29 juin, la semaine où l'hôtel passe à plus de 90 %
 * d'occupation et ne redescendra plus avant septembre. Treize semaines, six
 * décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · UN SAISONNIER MIS AU COMPTOIR SANS FORMATION COÛTE. Hostéo, les plans
 *     tarifaires de l'hôtel (non remboursable, demi-pension, offres Bookalia),
 *     la procédure de délogement quand l'hôtel est en surréservation : rien de
 *     cela ne s'apprend en servant un client qui attend. Un saisonnier lâché
 *     au comptoir le premier jour fait chaque semaine six erreurs de
 *     facturation, deux de plan tarifaire et un délogement mal conduit toutes
 *     les deux semaines : 680 € par semaine, avant que la note de l'hôtel sur
 *     les plateformes ne s'en ressente. Il vend aussi cinq fois moins de
 *     surclassements et de petits-déjeuners qu'un réceptionniste formé.
 *     Sur le tas, il apprend lentement, et plafonne : il apprend les gestes,
 *     pas les standards. Le planning d'été, qui laisse les soirées aux
 *     saisonniers, y concentre sept erreurs sur dix ; un permanent sur
 *     chaque soirée en supprime un tiers.
 *   · LE BINÔME COÛTE DEUX SEMAINES, PUIS REND AUTONOME. Une semaine
 *     d'intégration avant le rush (une journée d'accueil, deux jours de
 *     formation, trois jours à côté d'un permanent) puis deux semaines en
 *     binôme coûtent des salaires et des heures, et ralentissent les
 *     permanents. Ensuite, le saisonnier travaille presque comme eux.
 *   · L'ACCUEIL DÉCIDE DES ABANDONS. Chaque semaine, un saisonnier peut rendre
 *     son badge. Le risque dépend de l'accueil : un premier jour préparé, un
 *     logement à pied de l'hôtel plutôt qu'à Thonon sans bus le soir, un
 *     planning connu à l'avance, et de ce qu'il vit au comptoir : un débutant
 *     repris par les clients toute la journée craque plus vite. Un départ en
 *     juillet se remplace mal : deux semaines de poste vacant, un extra
 *     d'agence plus cher et qui ne connaît rien de la maison.
 *   · LES PERMANENTS RATTRAPENT, ET S'ÉPUISENT. Chaque erreur d'un saisonnier
 *     est reprise par un permanent : refacturer, rappeler le client, trouver
 *     une chambre ailleurs. Les postes vacants se couvrent en heures
 *     supplémentaires. La FATIGUE des permanents monte avec cette charge ;
 *     fatigués, ils vendent moins, se trompent davantage, et l'un d'eux peut
 *     s'arrêter en août. C'est l'interaction qui fait l'épisode : ne pas
 *     former en juin, c'est charger les permanents en juillet.
 *
 * Le hasard du trimestre est tiré d'avance : l'affluence, les erreurs et les
 * ventes de chaque semaine, ce que chaque saisonnier apprend vite, qui
 * abandonne et quand, un ou deux imprévus, la réponse de la commission de la
 * résidence des saisonniers (environ deux fois sur trois, oui : la meilleure
 * option en moyenne n'est pas la plus sûre), la raison qui fait partir Elif
 * et sa réponse à ce qu'on lui propose, l'arrêt de la première de réception
 * quand les permanents sont à bout.
 *
 * Le trimestre est jugé en euros : la CONTRIBUTION de la réception, la marge
 * des ventes additionnelles (surclassements, petits-déjeuners) moins le coût
 * des erreurs, les gestes commerciaux, les réservations que la note perd sous
 * 8,8, les heures supplémentaires, les remplacements et les dépenses
 * d'accueil. Les salaires prévus au planning n'y entrent pas : ils sont payés
 * quoi qu'on décide.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const PERMANENTS = 6;
export const SAISONNIERS = 8;
/** La semaine où les saisonniers prennent le comptoir : celle du lundi 29 juin. */
export const DEBUT_SAISON = 5;
/** La semaine d'intégration, pour qui les fait venir le 22 juin. */
export const SEMAINE_INTEGRATION = 4;
/** Les arrivées de clients (check-in) par semaine : juin, puis juillet et août. */
export const ARRIVEES = [
  0, 148, 152, 158, 164, 182, 188, 194, 196, 200, 202, 206, 196, 182,
] as const;
/** Le taux d'occupation de chaque semaine. */
export const OCCUPATION = [
  0, 0.74, 0.77, 0.8, 0.83, 0.9, 0.92, 0.95, 0.94, 0.95, 0.96, 0.97, 0.94, 0.89,
] as const;

/**
 * Les erreurs d'un saisonnier mis au comptoir sans formation, par semaine,
 * et ce que chacune coûte : l'été dernier, cinq saisonniers sur leurs deux
 * premières semaines (le journal des anomalies d'Hostéo), et le chiffrage du
 * contrôle de gestion.
 */
export const ETE_DERNIER = {
  saisonniers: 5,
  semaines: 2,
  facturation: 60,
  tarif: 20,
  delogement: 5,
  /** Les six permanents sur les mêmes deux semaines, toutes erreurs confondues. */
  permanents: 10,
} as const;
export const COUT_ERREUR = { facturation: 45, tarif: 110, delogement: 380 } as const;
const parSaisonnierSemaine = (n: number) => n / (ETE_DERNIER.saisonniers * ETE_DERNIER.semaines);
/** Six erreurs de facturation, deux de plan tarifaire, un demi-délogement mal conduit. */
export const ERREURS_PAR_SEMAINE = {
  facturation: parSaisonnierSemaine(ETE_DERNIER.facturation),
  tarif: parSaisonnierSemaine(ETE_DERNIER.tarif),
  delogement: parSaisonnierSemaine(ETE_DERNIER.delogement),
} as const;
/** Ce que coûtent, en une semaine, les erreurs d'un saisonnier non formé : 680 €. */
export const coutSansFormation = () =>
  ERREURS_PAR_SEMAINE.facturation * COUT_ERREUR.facturation +
  ERREURS_PAR_SEMAINE.tarif * COUT_ERREUR.tarif +
  ERREURS_PAR_SEMAINE.delogement * COUT_ERREUR.delogement;
export const COUT_SANS_FORMATION = coutSansFormation();
export const NB_ERREURS_SANS_FORMATION =
  ERREURS_PAR_SEMAINE.facturation + ERREURS_PAR_SEMAINE.tarif + ERREURS_PAR_SEMAINE.delogement;
/**
 * La part d'erreurs qui reste à un réceptionniste formé : un permanent en fait
 * dix fois moins qu'un saisonnier lâché au comptoir.
 */
export const PLANCHER = 0.1;

/** Les heures et les salaires, charges comprises. */
export const HEURES_SEMAINE = 35;
export const TAUX_HORAIRE = 22;
/** Une heure supplémentaire d'un permanent, majorée de 25 %. */
export const HEURE_SUP = TAUX_HORAIRE * 1.25;
export const SALAIRE_SAISONNIER = 600;
/** Un extra d'agence, à la semaine, et les frais de l'agence pour le trouver. */
export const EXTRA_AGENCE = 840;
export const FRAIS_AGENCE = 400;
/** Ce qu'un poste vacant coûte de plus qu'un saisonnier : 35 heures supplémentaires au lieu d'un salaire. */
export const SURCOUT_VACANCE = HEURES_SEMAINE * HEURE_SUP - SALAIRE_SAISONNIER;
/** Les semaines pour remplacer un départ en plein été. */
export const DELAI_REMPLACEMENT = 2;

/** La marge des ventes additionnelles par arrivée, quand un permanent reposé fait l'accueil. */
export const VENTE_PERMANENT = 24;
/** Ce qu'un saisonnier débutant vend, rapporté à un permanent. */
export const VENTE_DEBUTANT = 0.2;
/** La part des arrivées qu'un saisonnier accueille. */
export const PART_PAR_SAISONNIER = 0.07;

/** La note de l'hôtel sur Bookalia et Voyagio, et ce qu'elle coûte sous le seuil. */
export const NOTE_DEPART = 8.9;
export const SEUIL_NOTE = 8.8;
/** Chaque dixième de point sous 8,8, par semaine d'été, en marge de chambres perdue. */
export const PERTE_PAR_DIXIEME = 1200;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des séminaires de juin accueillis sans vous. */
export const PERTE_PAR_JOUR = 900;

/** Les coûts de chaque option, tels que les sources et les options les donnent. */
export const COUTS = {
  /** D1 : la semaine d'intégration (huit salaires) et le formateur Hostéo du siège. */
  integration: SAISONNIERS * SALAIRE_SAISONNIER,
  formateur: 1200,
  elearning: SAISONNIERS * 110,
  /** Heures de permanent par saisonnier et par semaine de binôme : après une semaine d'intégration, en plein rush. */
  binomePrepare: 6,
  binomeRush: 9,
  /** D2 : quatre studios meublés pour la saison, moins la retenue d'avantage en nature. */
  studios: 4 * (2 * 850 + 200),
  retenueLogement: SAISONNIERS * 2 * 70,
  /** D2 : la moitié du loyer des huit places de la résidence des saisonniers, si la commission les accorde. */
  foyer: SAISONNIERS * 100 * 2,
  /** D2 : la marge d'une chambre côté cour vendue, par nuit (prix moyen 165 €, commission et coût variable déduits). */
  margeChambreCour: 112,
  /** D4 : la prime proposée, le recrutement par l'association, deux jours de binôme. */
  primeReste: 400,
  fraisAssociation: 250,
  deuxJoursBinome: 2 * 7 * HEURE_SUP,
  /** D5 : la prime collective, versée si la note finit au-dessus de 8,8. */
  primeCollective: 1800,
  /** D5 : le challenge individuel, en part de la marge vendue. */
  partChallenge: 0.06,
  /** D6 : la prime de fin de saison, par saisonnier présent le 30 août. */
  primeFinDeSaison: 250,
  /** D6 : les six permanents passés à 44 heures : neuf heures de plus chacun, par semaine. */
  heures44: PERMANENTS * 9,
} as const;

/**
 * Le planning publié laisse le soir aux saisonniers : sept erreurs sur dix s'y font, et un
 * permanent sur chaque soirée divise par deux les erreurs du soir (L'Escale Lac, l'été dernier).
 */
export const PART_DU_SOIR = 0.7;
export const FACTEUR_SOIREES = 1 - PART_DU_SOIR * 0.5;

/** Le challenge individuel : plus de ventes, mais un surclassement bradé pour gagner. */
export const CHALLENGE = { volume: 1.4, prix: 0.75 } as const;

/** Le net des studios, sur la saison. */
export const COUT_STUDIOS = COUTS.studios - COUTS.retenueLogement;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  accueil: 0,
  logement: 1,
  planning: 2,
  depart: 3,
  ventes: 4,
  fin: 5,
} as const;

/** Les options, par décision. */
export const O = {
  accueil: { comptoir: 0, elearning: 1, integration: 2, binomeRush: 3 },
  logement: { annonces: 0, foyer: 1, chambres: 2, studios: 3 },
  planning: { tenir: 0, soirees: 1, recadrer: 2, rattraper: 3 },
  depart: { extra: 0, entretien: 1, prime: 2, association: 3 },
  ventes: { challenge: 0, permanents: 1, script: 2, rien: 3 },
  fin: { repos: 0, prime: 1, extras: 2, rien: 3 },
} as const;

/** Ne rien changer à l'habitude de la maison, décision par décision. */
export const NEUTRE = [0, 0, 0, 0, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: { arrivees?: number; erreurs?: number; gestes?: number; note?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "hosteo",
    titre: "Panne d'Hostéo",
    de: "Systèmes d'information",
    role: "Siège, Annecy",
    texte:
      "Hostéo est tombé de vendredi soir à samedi midi : arrivées et départs faits à la main, factures ressaisies lundi.",
    effet: { erreurs: 1.35 },
  },
  {
    id: "canicule",
    titre: "Canicule et climatisation en panne",
    de: "Maintenance",
    role: "L'Escale Évian",
    texte:
      "La climatisation de l'aile sud a lâché par 34 degrés : quatre jours de réparation, des clients qui descendent au comptoir.",
    effet: { gestes: 1800, note: 0.08 },
  },
  {
    id: "groupe",
    titre: "Un groupe ajouté au dernier moment",
    de: "Escale Événements",
    role: "Commercial groupes",
    texte:
      "Un séminaire de quarante personnes a été confirmé avec dix jours de préavis : arrivées groupées, badges, factures séparées.",
    effet: { arrivees: 1.15, erreurs: 1.1 },
  },
  {
    id: "serrures",
    titre: "Panne des serrures électroniques",
    de: "Maintenance",
    role: "L'Escale Évian",
    texte:
      "Le serveur des cartes-clés a perdu sa programmation : une soirée à ouvrir les chambres au passe, des clients bloqués dans le couloir.",
    effet: { gestes: 1200, note: 0.05 },
  },
  {
    id: "festival",
    titre: "Un festival sur les quais",
    de: "Office de tourisme",
    role: "Évian",
    texte:
      "Le festival de musique des quais remplit la ville : arrivées tardives, demandes de taxis et de tables, clients qui veulent tout savoir.",
    effet: { arrivees: 1.1, erreurs: 1.08 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  arrivees: number;
  erreurs: number;
  ventes: number;
}

/** Les causes du départ annoncé en semaine 7 : ce qu'un entretien ferait dire. */
export const CAUSES = ["coupures", "client", "geneve"] as const;
export type Cause = (typeof CAUSES)[number];
/** Ses chances de rester, selon la cause et ce qu'on lui propose. */
export const RESTE = {
  entretien: { coupures: 0.9, client: 0.85, geneve: 0.45 },
  prime: { coupures: 0.15, client: 0.1, geneve: 0.6 },
} as const;

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Ce que chaque saisonnier apprend vite, autour de 1. */
  aptitude: readonly number[];
  /** Les tirages des départs : [saisonnier][semaine]. */
  uDepart: readonly (readonly number[])[];
  /** Les tirages des départs de fin de saison, pour la rentrée : [saisonnier][semaine]. */
  uRentree: readonly (readonly number[])[];
  /** La première de réception s'arrête-t-elle si elle est à bout ? */
  uArret: number;
  /** Pourquoi Elif veut partir, et ce qui la retiendrait. */
  cause: Cause;
  uReste: number;
  /** La commission de la résidence des saisonniers accorde-t-elle les huit places ? */
  uFoyer: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000541 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      arrivees: Math.min(1.12, Math.max(0.9, 1 + 0.04 * gauss(r))),
      erreurs: Math.min(1.4, Math.max(0.7, 1 + 0.15 * gauss(r))),
      ventes: Math.min(1.2, Math.max(0.82, 1 + 0.07 * gauss(r))),
    });
  }
  const aptitude = Array.from({ length: SAISONNIERS }, () =>
    Math.min(1.3, Math.max(0.7, 1 + 0.15 * gauss(r))),
  );
  const uDepart = Array.from({ length: SAISONNIERS }, () =>
    Array.from({ length: SEMAINES + 1 }, () => r()),
  );
  const uRentree = Array.from({ length: SAISONNIERS }, () =>
    Array.from({ length: SEMAINES + 1 }, () => r()),
  );
  const uArret = r();
  const uCause = r();
  const cause: Cause = uCause < 0.4 ? "coupures" : uCause < 0.7 ? "client" : "geneve";
  const uReste = r();
  const uFoyer = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, aptitude, uDepart, uRentree, uArret, cause, uReste, uFoyer, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Elif reste-t-elle ? Elle annonce son départ en semaine 7 et part à la fin de la semaine 8. */
export function chanceQuElifReste(chemin: readonly number[], cause: Cause): number {
  const d4 = chemin[D.depart];
  if (d4 === O.depart.entretien) return RESTE.entretien[cause];
  if (d4 === O.depart.prime) return RESTE.prime[cause];
  return 0;
}
export const elifReste = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return h.uReste < chanceQuElifReste(chemin, h.cause);
};

/** Le risque que la première de réception s'arrête, lu sur la fatigue des permanents en fin de semaine 9. */
export const risqueDArret = (fatigue: number) => Math.min(0.8, Math.max(0, (fatigue - 0.38) * 3));

/** Le risque hebdomadaire qu'un saisonnier abandonne, avant tout effet de son comptoir. */
export const RISQUE_DE_BASE = 0.015;
/** L'accueil du premier jour, selon le plan de la semaine 1. */
export const FACTEUR_ACCUEIL = [1.4, 1.2, 0.75, 1.1] as const;
/** La commission de la résidence des saisonniers accorde les places une fois sur… */
export const CHANCE_FOYER = 0.65;
/** Les places sont-elles accordées ? Seule la demande compte : la commission répond selon le hasard. */
export const foyerAccorde = (chemin: readonly number[], graine: number) =>
  chemin[D.logement] === O.logement.foyer && hasard(graine).uFoyer < CHANCE_FOYER;
/**
 * Le logement obtenu : la résidence refusée, on en revient aux annonces,
 * trois jours avant l'arrivée.
 */
export const REFUS = 4;
export const logementObtenu = (chemin: readonly number[], graine: number): number =>
  chemin[D.logement] === O.logement.foyer && !foyerAccorde(chemin, graine)
    ? REFUS
    : (chemin[D.logement] ?? O.logement.annonces);
/** Le logement obtenu, selon la décision de la semaine 3 ; le dernier : la résidence refusée. */
export const FACTEUR_LOGEMENT = [2, 0.55, 1.3, 0.5, 2.2] as const;
/** Les étudiants (les quatre derniers) rentrent pour la rentrée : le risque, par semaine, en fin d'août. */
export const RISQUE_RENTREE = 0.5;
/** Les autres saisonniers partent aussi plus tôt que prévu, moins souvent. */
export const RISQUE_FIN_DE_SAISON = 0.15;
export const ETUDIANTS = [4, 5, 6, 7] as const;
/** Les trois saisonniers qui n'ont pas trouvé de logement en semaine 3. */
export const SANS_LOGEMENT = [1, 2, 3] as const;
/** Le risque qu'un saisonnier sans logement renonce avant d'arriver, selon la décision de la semaine 3. */
export const RENONCE = [0.5, 0, 0, 0, 0.67] as const;

export function risqueDAbandon(
  chemin: readonly number[],
  logement: number,
  w: number,
  erreursRelatives: number,
): number {
  let h = RISQUE_DE_BASE;
  h *= FACTEUR_ACCUEIL[chemin[D.accueil] as 0 | 1 | 2 | 3] ?? 1;
  h *= FACTEUR_LOGEMENT[logement as 0 | 1 | 2 | 3 | 4] ?? 1;
  // Un saisonnier repris par les clients toute la journée craque plus vite.
  h *= 1 + 0.6 * erreursRelatives;
  if (w >= 6 && chemin[D.planning] === O.planning.soirees) h *= 0.85;
  if (w >= 6 && chemin[D.planning] === O.planning.recadrer) h *= 1.4;
  if (w >= 9 && chemin[D.depart] === O.depart.entretien) h *= 0.65;
  if (w >= 12 && chemin[D.fin] === O.fin.prime) h *= 0.5;
  return h;
}

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

type Etat = "attente" | "integration" | "comptoir" | "vacant" | "parti";

interface Poste {
  etat: Etat;
  /** De 0 (lâché au comptoir) à 1 (comme un permanent). */
  c: number;
  type: "saisonnier" | "extra" | "remplacant";
  /** La dernière semaine de binôme. */
  binome: number;
  /** La semaine où arrive le remplaçant d'un poste vacant. */
  retour: number;
}

export type Semaine = {
  /** La contribution de la réception cette semaine. */
  contribution: number;
  /** Cumulée depuis le début du trimestre. */
  cumul: number;
  /** Le coût des erreurs de la semaine (facturation, plans tarifaires, délogements). */
  erreurs: number;
  /** La marge des ventes additionnelles. */
  ventes: number;
  ventesParArrivee: number;
  ventesSaisonnier: number;
  ventesPermanent: number;
  note: number;
  /** Les saisonniers (ou leurs remplaçants) au comptoir. */
  enPoste: number;
  /** Les heures supplémentaires payées aux permanents. */
  heuresSup: number;
  fatigue: number;
  /** La compétence moyenne des saisonniers au comptoir. */
  competence: number;
  arrivees: number;
  /** Ce que la semaine a coûté hors erreurs : heures, remplacements, gestes, note, dépenses. */
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La contribution de la réception sur le trimestre. */
  objectif: number;
  ventes: number;
  erreurs: number;
  heuresSup: number;
  /** Les départs en cours de saison, hors celui d'Elif. */
  abandons: number;
  /** Les départs de fin de saison, pour la rentrée. */
  rentrees: number;
  elifReste: boolean;
  /** La première de réception s'est-elle arrêtée trois semaines en août ? */
  arret: boolean;
  noteFinale: number;
  noteMoyenne: number;
  /** Les saisonniers au comptoir le 30 août. */
  presentsFin: number;
  primeCollective: boolean;
  /** Le coût des erreurs d'un saisonnier non formé, par semaine : la prévision de la semaine 1. */
  coutSansFormation: number;
  /** La compétence moyenne en semaine 8. */
  competenceJuillet: number;
  /** Les semaines où un saisonnier est parti, et lequel. */
  departs: readonly { semaine: number; poste: number; rentree: boolean }[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** La part d'erreurs d'un saisonnier, de 1 (non formé) au plancher d'un permanent. */
const partDErreurs = (c: number) => PLANCHER + (1 - PLANCHER) * (1 - c);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const reste = elifReste(chemin, graine);
  const loge = logementObtenu(chemin, graine);
  const cultureBinome = d1 === O.accueil.integration || d1 === O.accueil.binomeRush;
  const postes: Poste[] = Array.from({ length: SAISONNIERS }, () => ({
    etat: "attente",
    c: 0,
    type: "saisonnier",
    binome: 0,
    retour: 0,
  }));
  const semaines: (Semaine | null)[] = [null];
  const departs: { semaine: number; poste: number; rentree: boolean }[] = [];
  let fatigue = 0.32;
  let note = NOTE_DEPART;
  let cumul = 0;
  let arretDe = 0;
  let totalVentes = 0;
  let totalErreurs = 0;
  let totalHeures = 0;
  let competenceJuillet = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => i.semaine === w).map((i) => i.imprevu.effet);
    let couts = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    let heures = 0;

    // Qui arrive, qui commence, qui revient.
    if (w === SEMAINE_INTEGRATION && d1 === O.accueil.integration) {
      for (const p of postes) p.etat = "integration";
    }
    if (w === DEBUT_SAISON) {
      postes.forEach((p, i) => {
        const apt = h.aptitude[i]!;
        p.etat = "comptoir";
        if (d1 === O.accueil.integration) {
          p.c = borne(0.4 * apt, 0, 0.6);
          p.binome = 6;
        } else if (d1 === O.accueil.binomeRush) {
          p.c = 0.08;
          p.binome = 6;
        } else if (d1 === O.accueil.elearning) {
          p.c = 0.2;
        }
        // Sans logement à trois jours de l'arrivée, certains renoncent : le poste reste vide deux semaines.
        if (
          (SANS_LOGEMENT as readonly number[]).includes(i) &&
          h.uDepart[i]![SEMAINE_INTEGRATION]! < (RENONCE[loge as 0 | 1 | 2 | 3 | 4] ?? 0)
        ) {
          p.etat = "vacant";
          p.retour = DEBUT_SAISON + DELAI_REMPLACEMENT;
          p.type = "extra";
          p.binome = 0;
          departs.push({ semaine: SEMAINE_INTEGRATION, poste: i, rentree: false });
        }
      });
    }
    postes.forEach((p) => {
      if (p.etat === "vacant" && p.retour === w) {
        p.etat = "comptoir";
        // Un remplaçant arrivé mi-août, après qu'on a attendu, va au comptoir sans binôme.
        p.c = p.type === "remplacant" ? 0.35 : cultureBinome && w < 11 ? 0.3 : 0;
      }
    });
    // Fin d'août : les étudiants rentrent pour la rentrée, d'autres partent avant la fin du contrat.
    if (w >= 12) {
      for (let i = 0; i < SAISONNIERS; i += 1) {
        const p = postes[i]!;
        if (p.etat !== "comptoir" || p.type !== "saisonnier") continue;
        const etudiant = (ETUDIANTS as readonly number[]).includes(i);
        const risque =
          (etudiant ? RISQUE_RENTREE : RISQUE_FIN_DE_SAISON) * (d6 === O.fin.prime ? 0.25 : 1);
        if (h.uRentree[i]![w]! < risque) {
          p.etat = "parti";
          departs.push({ semaine: w, poste: i, rentree: true });
        }
      }
    }

    // L'activité de la semaine.
    let arrivees = ARRIVEES[w]! * n.arrivees;
    for (const e of actifs) arrivees *= e.arrivees ?? 1;
    const auComptoir = postes.filter((p) => p.etat === "comptoir");
    const extrasFin = d6 === O.fin.extras && w >= 12 ? 2 : 0;
    const vacants =
      w >= DEBUT_SAISON
        ? postes.filter((p) => p.etat === "vacant" || p.etat === "parti").length
        : 0;
    const arret = arretDe > 0 && w >= arretDe && w < arretDe + 3;
    const permanents = PERMANENTS - (arret ? 1 : 0);

    // Les erreurs des saisonniers, et ce qu'en rattrapent les permanents.
    let multErreurs = n.erreurs;
    for (const e of actifs) multErreurs *= e.erreurs ?? 1;
    if ((loge === O.logement.annonces || loge === REFUS) && w >= DEBUT_SAISON) multErreurs *= 1.12;
    // Un poste vide, et ceux qui restent courent : plus d'erreurs pour tout le monde.
    multErreurs *= 1 + 0.1 * vacants;
    let erreursSaisonniers = 0;
    const binomes = auComptoir.filter((p) => p.binome >= w).length;
    for (const p of auComptoir) {
      let e = COUT_SANS_FORMATION * partDErreurs(p.c) * multErreurs;
      if (p.binome >= w) e *= d1 === O.accueil.integration ? 0.4 : 0.5;
      if (w >= 6 && d3 === O.planning.soirees) e *= FACTEUR_SOIREES;
      if (w >= 6 && d3 === O.planning.recadrer) e *= 0.95;
      if (w >= 10 && d5 === O.ventes.challenge) e *= 1 + 0.6 * (1 - p.c);
      erreursSaisonniers += e;
    }
    for (let k = 0; k < extrasFin; k += 1) {
      erreursSaisonniers += COUT_SANS_FORMATION * multErreurs;
    }
    const nbErreursSaisonniers =
      (erreursSaisonniers / COUT_SANS_FORMATION) * NB_ERREURS_SANS_FORMATION;
    let rattrapage = nbErreursSaisonniers * 0.6;
    let erreursComptees = erreursSaisonniers;
    if (w >= 6 && d3 === O.planning.rattraper) {
      // Les permanents reprennent chaque dossier avant le départ du client : moins de pertes, bien plus d'heures.
      erreursComptees *= 0.75;
      rattrapage *= 1.5;
      heures += rattrapage;
    }
    const erreursPermanents =
      permanents *
      COUT_SANS_FORMATION *
      PLANCHER *
      (1 + 3 * Math.max(0, fatigue - 0.4)) *
      n.erreurs;
    const erreurs = erreursComptees + erreursPermanents;

    // Les heures : binômes, postes vacants, arrêt, repos supprimés.
    const heuresBinome =
      binomes * (d1 === O.accueil.integration ? COUTS.binomePrepare : COUTS.binomeRush);
    heures += heuresBinome;
    let heuresCouverture = (vacants + (arret ? 1 : 0)) * HEURES_SEMAINE;
    if (d6 === O.fin.repos && w >= 12) {
      heures += COUTS.heures44;
      heuresCouverture = Math.max(0, heuresCouverture - COUTS.heures44);
    }
    if (extrasFin) heuresCouverture = Math.max(0, heuresCouverture - extrasFin * HEURES_SEMAINE);
    heures += heuresCouverture;

    // La fatigue des permanents : ce qu'ils rattrapent, couvrent, transmettent.
    const base = permanents * HEURES_SEMAINE;
    const poidsBinome = d1 === O.accueil.binomeRush ? 0.8 : 0.5;
    const charge =
      (rattrapage + heuresCouverture + poidsBinome * heuresBinome) / base +
      (d6 === O.fin.repos && w >= 12 ? COUTS.heures44 / base : 0);
    fatigue += 0.25 * charge * (1 - fatigue) - (w >= DEBUT_SAISON ? 0.013 : 0.02);
    if (w >= 6 && d3 === O.planning.soirees) fatigue += 0.006;
    if (w >= 10 && d5 === O.ventes.challenge) fatigue += 0.01;
    if (w >= 12 && d6 === O.fin.repos) fatigue += 0.12;
    fatigue = borne(fatigue, 0.1, 1);

    // Les ventes additionnelles : surclassements et petits-déjeuners proposés à l'accueil.
    let ventePermanent = VENTE_PERMANENT * (1 - 0.9 * Math.max(0, fatigue - 0.35));
    if (binomes) ventePermanent *= 0.92;
    // Pressés de couvrir un poste vide, les permanents ne proposent plus rien.
    ventePermanent *= Math.max(0.7, 1 - 0.06 * vacants);
    if (w >= 10 && d5 === O.ventes.challenge) ventePermanent *= CHALLENGE.volume * CHALLENGE.prix;
    if (w >= 10 && d5 === O.ventes.permanents) ventePermanent *= 1.12;
    if (w >= 10 && d5 === O.ventes.script) ventePermanent *= 1.22;
    /** Ce que la décision sur les ventes change à ce que vend un saisonnier, selon ce qu'il sait. */
    const multSaisonnier = (c: number) => {
      let m = w >= 9 && d4 === O.depart.entretien ? 1.05 : 1;
      if (w >= 10 && d5 === O.ventes.challenge) m *= CHALLENGE.volume * CHALLENGE.prix;
      if (w >= 10 && d5 === O.ventes.permanents) m *= 0.4;
      if (w >= 10 && d5 === O.ventes.script) m *= 1 + 0.3 * c;
      return m;
    };
    let ventesSaisonniers = 0;
    let partSaisonniers = 0;
    for (const p of auComptoir) {
      let v = VENTE_PERMANENT * (VENTE_DEBUTANT + (1 - VENTE_DEBUTANT) * p.c) * multSaisonnier(p.c);
      // Elif parle anglais, allemand et turc : formée, c'est la meilleure vendeuse des saisonniers.
      if (p === postes[0] && p.type === "saisonnier") v *= 1 + 0.8 * p.c;
      if (p.binome >= w) v = 0.5 * v + 0.5 * ventePermanent;
      ventesSaisonniers += v * PART_PAR_SAISONNIER;
      partSaisonniers += PART_PAR_SAISONNIER;
    }
    for (let k = 0; k < extrasFin; k += 1) {
      ventesSaisonniers += VENTE_PERMANENT * VENTE_DEBUTANT * PART_PAR_SAISONNIER;
      partSaisonniers += PART_PAR_SAISONNIER;
    }
    const venteSaisonnier = partSaisonniers ? ventesSaisonniers / partSaisonniers : 0;
    const parArrivee = ventesSaisonniers + (1 - partSaisonniers) * ventePermanent;
    const ventes = arrivees * parArrivee * n.ventes;

    // La note : les erreurs vues par les clients, la fatigue, la vente forcée.
    const incidents =
      nbErreursSaisonniers * (w >= 6 && d3 === O.planning.rattraper ? 0.75 : 1) +
      (erreursPermanents / COUT_SANS_FORMATION) * NB_ERREURS_SANS_FORMATION;
    let cible = 9.15 - 1.4 * (incidents / arrivees) - 0.5 * Math.max(0, fatigue - 0.4);
    if (w >= 10 && d5 === O.ventes.challenge) cible -= 0.2;
    // Un poste vide, c'est une file d'attente au comptoir.
    cible -= 0.06 * vacants;
    for (const e of actifs) cible -= (e.note ?? 0) * 4;
    note = borne(note + 0.2 * (cible - note), 8.3, 9.5);
    const perteNote = Math.max(0, SEUIL_NOTE - note) * 10 * PERTE_PAR_DIXIEME;

    // Ce que la semaine coûte en dehors des erreurs.
    let depenses = 0;
    if (w === 3 && d1 === O.accueil.elearning) depenses += COUTS.elearning;
    if (w === SEMAINE_INTEGRATION && d1 === O.accueil.integration) {
      depenses += COUTS.integration + COUTS.formateur;
    }
    if (w >= SEMAINE_INTEGRATION) {
      if (d2 === O.logement.studios) depenses += COUT_STUDIOS / 10;
      if (loge === O.logement.foyer && w >= DEBUT_SAISON) depenses += COUTS.foyer / 9;
      if (d2 === O.logement.chambres) depenses += 2 * 7 * OCCUPATION[w]! * COUTS.margeChambreCour;
    }
    if (w === 9 && d4 === O.depart.association)
      depenses += COUTS.fraisAssociation + COUTS.deuxJoursBinome;
    if (w === SEMAINES && d4 === O.depart.prime && reste && postes[0]!.etat === "comptoir") {
      depenses += COUTS.primeReste;
    }
    if (w >= 10 && d5 === O.ventes.challenge) depenses += COUTS.partChallenge * ventes;
    if (extrasFin) depenses += extrasFin * EXTRA_AGENCE + (w === 12 ? extrasFin * FRAIS_AGENCE : 0);
    // Un extra d'agence coûte plus cher qu'un saisonnier, et l'agence facture ses frais à l'arrivée.
    let remplacements = 0;
    for (const p of postes) {
      if (p.etat !== "comptoir" || p.type !== "extra") continue;
      remplacements += EXTRA_AGENCE - SALAIRE_SAISONNIER + (p.retour === w ? FRAIS_AGENCE : 0);
    }
    const salairesEconomises = vacants * SALAIRE_SAISONNIER;
    let gestes = 0;
    for (const e of actifs) gestes += e.gestes ?? 0;
    const coutHeures = heures * HEURE_SUP - salairesEconomises;
    couts += coutHeures + remplacements + depenses + gestes + perteNote;
    if (w === SEMAINES && d5 === O.ventes.script && note >= SEUIL_NOTE)
      couts += COUTS.primeCollective;
    if (w === SEMAINES && d6 === O.fin.prime) {
      const presents = postes.filter(
        (p) => p.etat === "comptoir" && p.type === "saisonnier",
      ).length;
      couts += presents * COUTS.primeFinDeSaison;
    }

    const contribution = ventes - erreurs - couts;
    cumul += contribution;
    totalVentes += ventes;
    totalErreurs += erreurs;
    totalHeures += heures;
    const competence = auComptoir.length
      ? auComptoir.reduce((s, p) => s + p.c, 0) / auComptoir.length
      : 0;
    if (w === 8) competenceJuillet = competence;

    semaines.push({
      contribution,
      cumul,
      erreurs,
      ventes,
      ventesParArrivee: parArrivee * n.ventes,
      ventesSaisonnier: venteSaisonnier * n.ventes,
      ventesPermanent: ventePermanent * n.ventes,
      note,
      enPoste: auComptoir.length + extrasFin,
      heuresSup: heures,
      fatigue,
      competence,
      arrivees,
      couts,
    });

    // Ce que la semaine a appris aux saisonniers.
    postes.forEach((p, i) => {
      if (p.etat !== "comptoir") return;
      const apt = p.type === "saisonnier" ? h.aptitude[i]! : 1;
      if (p.binome >= w) {
        p.c = borne(p.c + (d1 === O.accueil.integration ? 0.22 : 0.2) * apt, 0, 0.95);
      } else {
        const plafond =
          (cultureBinome || p.type === "remplacant" ? 0.95 : 0.7) +
          (w >= 6 && d3 === O.planning.soirees && !cultureBinome ? 0.1 : 0);
        const vitesse = cultureBinome || p.type === "remplacant" ? 0.25 : 0.18;
        p.c = borne(p.c + vitesse * apt * (plafond - p.c), 0, 0.95);
        if (w >= 6 && d3 === O.planning.soirees) p.c = borne(p.c + 0.02, 0, 0.95);
      }
    });

    // Les départs en cours de saison, lus en fin de semaine.
    if (w >= DEBUT_SAISON && w <= 11) {
      postes.forEach((p, i) => {
        if (p.etat !== "comptoir" || p.type !== "saisonnier") return;
        if (i === 0 && w <= 8) return; // Elif : son départ est annoncé, il se joue à part.
        const risque = risqueDAbandon(chemin, loge, w, partDErreurs(p.c));
        if (h.uDepart[i]![w]! < risque) {
          p.etat = "vacant";
          p.retour = w + 1 + DELAI_REMPLACEMENT;
          p.type = "extra";
          departs.push({ semaine: w, poste: i, rentree: false });
        }
      });
    }
    // Elif part à la fin de la semaine 8, sauf si on l'a retenue.
    if (w === 8 && !reste) {
      const p = postes[0]!;
      if (p.etat === "comptoir") {
        if (d4 === O.depart.association) {
          p.etat = "vacant";
          p.retour = 9;
          p.type = "remplacant";
        } else if (d4 === O.depart.extra) {
          p.etat = "vacant";
          p.retour = 9;
          p.type = "extra";
        } else {
          // On a attendu sa réponse : en août, l'agence n'a personne avant le 17.
          p.etat = "vacant";
          p.retour = 12;
          p.type = "extra";
        }
      }
    }
    // À bout, la première de réception s'arrête trois semaines : lu en fin de semaine 9.
    if (w === 9 && h.uArret < risqueDArret(fatigue)) arretDe = 10;
  }

  const pleines = semaines.slice(1) as Semaine[];
  const finale = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: cumul,
    ventes: totalVentes,
    erreurs: totalErreurs,
    heuresSup: totalHeures,
    abandons: departs.filter((x) => !x.rentree).length,
    rentrees: departs.filter((x) => x.rentree).length,
    elifReste: reste,
    arret: arretDe > 0,
    noteFinale: finale.note,
    noteMoyenne: pleines.reduce((s, x) => s + x.note, 0) / SEMAINES,
    presentsFin: postes.filter((p) => p.etat === "comptoir").length,
    primeCollective: d5 === O.ventes.script && finale.note >= SEUIL_NOTE,
    coutSansFormation: COUT_SANS_FORMATION,
    competenceJuillet,
    departs,
  };
}

/** Ce qui s'est passé pendant des semaines : départs, arrêt, réponses, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    /** Les renoncements avant l'arrivée (semaine 4), les abandons, les départs pour la rentrée. */
    departs: t.departs.filter((x) => dans(x.semaine)),
    /** La réponse de la résidence des saisonniers, en semaine 4. */
    foyer:
      chemin[D.logement] === O.logement.foyer && dans(SEMAINE_INTEGRATION)
        ? foyerAccorde(chemin, graine)
        : null,
    /** Elif part à la fin de la semaine 8. */
    elifPart: !t.elifReste && dans(8),
    arret: t.arret && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureReception {
  contribution: number | null;
  budgetADate: number | null;
  erreurs: number | null;
  note: number | null;
  enPoste: number | null;
  heuresSup: number | null;
  /** Des clés que le tableau n'affiche pas, pour les messages et les sources. */
  ventesParArrivee: number | null;
  ventesSaisonnier: number | null;
  ventesPermanent: number | null;
  departs: number | null;
}

/** Le budget de contribution de la réception sur le trimestre. */
export const BUDGET = 25000;

/** Ce que Léonie lit à la fin d'une semaine ; les décisions à venir comptent comme « l'habitude de la maison ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureReception {
  if (semaine === 0) {
    return {
      contribution: 0,
      budgetADate: 0,
      erreurs: PERMANENTS * COUT_SANS_FORMATION * PLANCHER,
      note: NOTE_DEPART,
      enPoste: 0,
      heuresSup: 0,
      ventesParArrivee: VENTE_PERMANENT,
      ventesSaisonnier: null,
      ventesPermanent: VENTE_PERMANENT,
      departs: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    contribution: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    erreurs: s.erreurs,
    note: s.note,
    enPoste: s.enPoste,
    heuresSup: s.heuresSup,
    ventesParArrivee: s.ventesParArrivee,
    ventesSaisonnier: s.enPoste ? s.ventesSaisonnier : null,
    ventesPermanent: s.ventesPermanent,
    departs: t.departs.filter((x) => !x.rentree && x.semaine <= semaine).length,
  };
}
