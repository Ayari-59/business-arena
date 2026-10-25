/**
 * LE BUREAU QUI S'ÉCHAUFFE : le modèle du bureau administratif de l'agence
 * Arvel Distribution de Bourgoin-Jallieu.
 *
 * On y joue Sacha Morel, en seconde professionnelle Gestion administrative,
 * transport et logistique, en apprentissage au bureau de l'agence : les
 * factures fournisseurs, le comptoir administratif, le téléphone. Sacha ne
 * dirige personne. Ses décisions sont celles d'un employé : comment parler à
 * un transporteur en colère, à une collègue, à sa responsable, à un client
 * agacé, et comment traiter une facture. Treize semaines, six décisions, et
 * quatre mécanismes que le joueur doit découvrir :
 *
 *   · UNE FACTURE SANS BON DE LIVRAISON ATTEND. Une facture fournisseur ne se
 *     paie qu'après le rapprochement : bon de commande, bon de livraison et
 *     facture doivent dire la même chose. Quand les bons restent au dépôt, les
 *     factures s'entassent, sont payées en retard, et chaque retard coûte une
 *     indemnité de 40 €. Les payer sans vérifier vide la pile, mais fait payer
 *     des marchandises jamais livrées.
 *   · UN INTERLOCUTEUR ÉCOUTÉ SE CALME. Un transporteur ou un client en colère
 *     qu'on écoute, dont on vérifie le dossier devant lui et à qui l'on dit
 *     quand il aura sa réponse, ferme son litige. Renvoyé ailleurs, rembarré
 *     ou payé de promesses, il revient plus fâché, et il coûte.
 *   · UN DÉSACCORD NON DIT S'ENVENIME. La tension avec une collègue use
 *     l'entente du bureau semaine après semaine ; l'entente se paie en heures
 *     perdues, en erreurs et en factures traitées moins vite.
 *   · UNE MAUVAISE NOUVELLE SE DIT TÔT. Une erreur dite tout de suite à sa
 *     responsable, avec les faits et une solution, se rattrape. Cachée, elle
 *     se rattrape mal, et la confiance s'en va quand on la découvre.
 *
 * Le trimestre est jugé en euros : ce que le bureau coûte en plus à l'agence
 * (indemnités de retard, factures payées à tort, litiges, clients perdus,
 * heures perdues), comparé au plafond que la responsable administrative a
 * fixé.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LES FACTURES FOURNISSEURS.
 * ------------------------------------------------------------------------- */
/** Les factures fournisseurs reçues par jour ouvré, et les jours ouvrés du bureau. */
export const FACTURES_PAR_JOUR = 12;
export const JOURS_OUVRES = 5;
export const FACTURES_PAR_SEMAINE = FACTURES_PAR_JOUR * JOURS_OUVRES;
/** Les factures en attente le lundi de la semaine 1. */
export const EN_ATTENTE_DEPART = 90;
/** Ce que le bureau traite en une semaine quand chaque facture a son bon de livraison et que l'entente est bonne (7 sur 10). */
export const CAPACITE = 72;
/** La part des factures dont le bon de livraison est resté au dépôt : elles ne peuvent pas être rapprochées. */
export const SANS_BON_DEPART = 0.3;
/** Avec une bannette convenue avec le dépôt, les bons remontent chaque soir. */
export const SANS_BON_AVEC_BANNETTE = 0.05;
/** Avec des relances par mail, le dépôt en remonte un peu plus. */
export const SANS_BON_AVEC_RELANCES = 0.2;
/** Payer sans rapprocher va plus vite : on ne cherche plus les bons. */
export const CAPACITE_SANS_VERIFIER = 1.4;
/** Les heures supplémentaires des semaines 2 à 5 : quinze factures de plus par semaine. */
export const FACTURES_EN_HEURES_SUP = 15;
export const SEMAINES_D_HEURES_SUP = 4;
/** Huit heures supplémentaires par semaine, majorées : 200 €. */
export const COUT_HEURES_SUP = 200;
/** Au-delà d'une semaine de factures en attente, la moitié du surplus passe son échéance chaque semaine. */
export const PART_QUI_PASSE_L_ECHEANCE = 0.5;
/** L'indemnité forfaitaire pour frais de recouvrement, due par facture payée en retard. */
export const INDEMNITE_DE_RETARD = 40;
/** La part des factures où le fournisseur facture plus qu'il n'a livré, et l'écart moyen. */
export const PART_DE_FACTURES_FAUSSES = 0.08;
export const ECART_MOYEN = 350;

/* ---------------------------------------------------------------------------
 * L'ENTENTE AU BUREAU.
 * ------------------------------------------------------------------------- */
/** La note que Nathalie demande chaque vendredi, de 0 à 10 : l'entente au bureau. */
export const ENTENTE_DEPART = 5.5;
export const OBJECTIF_ENTENTE = 7;
/** Tant que le désaccord avec Fabienne n'est pas traité, l'entente baisse chaque semaine. */
export const ENTENTE_DERIVE = 0.12;
/** Chaque point d'entente au-dessus ou en dessous de 7 change de 3 % ce que le bureau traite. */
export const CAPACITE_PAR_POINT = 0.03;
/** Chaque point sous 7 : une dizaine d'heures perdues en tensions, erreurs et absences, à 25 € l'heure. */
export const HEURES_PERDUES_PAR_POINT = 10;
export const COUT_HORAIRE = 25;
export const COUT_PAR_POINT = HEURES_PERDUES_PAR_POINT * COUT_HORAIRE;

/** Ce que chaque manière de traiter le désaccord avec Fabienne fait à l'entente, et à ce qu'elle traite. */
export const DESACCORD = [
  /** Un moment au calme, des faits, une répartition écrite. */
  { saut: 2, derive: 0, capacite: 1 },
  /** Ne rien dire et faire avec : la tension continue de monter. */
  { saut: 0, derive: ENTENTE_DERIVE * 1.25, capacite: 1 },
  /** Se plaindre à Nathalie sans en parler à Fabienne : elle ne fait plus que sa part. */
  { saut: -1, derive: 0.05, capacite: 0.9 },
  /** Une remarque devant tout le monde. */
  { saut: -2.5, derive: 0.05, capacite: 0.95 },
] as const;

/* ---------------------------------------------------------------------------
 * LES LITIGES.
 * ------------------------------------------------------------------------- */
/** Une semaine de litige ouvert : temps passé, relances, risque. */
export const COUT_LITIGE = 120;
/** Le litige du transporteur Bressan, ouvert en semaine 1. */
export const LITIGES_DEPART = 1;
/** Ce que fait un transporteur fâché : il fait attendre nos livraisons, et facture l'attente. */
export const FRAIS_DU_TRANSPORTEUR = 500;
/** Le transporteur qui refuse nos chargements : un transport de secours. */
export const TRANSPORT_DE_SECOURS = 1500;
/** Une scène au comptoir, devant les collègues : l'entente du bureau en prend un coup. */
export const ENTENTE_SCENE = -0.3;
/** Une fois sur trois, le paiement promis pour le lendemain part vraiment à temps. */
export const CHANCE_PROMESSE_TENUE = 1 / 3;

/** Ce que chaque manière d'accueillir le transporteur fait du litige : jusqu'à quand il reste ouvert, et ce qu'il coûte. */
export const TRANSPORTEUR = [
  /** Le renvoyer à la comptabilité du siège : il écrit à la directrice. */
  { fermeture: 9, frais: [3, 8], secours: [] as readonly number[] },
  /** Lui promettre un paiement pour demain (quand la promesse n'est pas tenue). */
  { fermeture: 12, frais: [4, 12], secours: [] as readonly number[] },
  /** L'écouter, vérifier son dossier devant lui, lui dire ce qui manque et quand il sera payé. */
  { fermeture: 3, frais: [0, -1], secours: [] as readonly number[] },
  /** Lui répondre sur le même ton : il refuse nos chargements deux semaines. */
  { fermeture: 10, frais: [5, 9], secours: [3, 4] as readonly number[] },
] as const;

/* ---------------------------------------------------------------------------
 * L'ERREUR À DIRE (décision 4).
 * ------------------------------------------------------------------------- */
/** La facture de carrelage saisie et payée deux fois, découverte en semaine 6. */
export const DOUBLE_PAIEMENT = 9000;
/** Ce que l'agence récupère selon la manière de le dire, et ce que l'entente y gagne ou y perd. */
export const ERREUR = [
  /** Corriger discrètement le mois prochain : le fournisseur rembourse mal ce qu'on lui réclame tard. */
  { recupere: 0.4, entente: 0 },
  /** Demander à Fabienne de le dire à sa place. */
  { recupere: 0.75, entente: -0.6 },
  /** Un mail court à Nathalie, le vendredi soir, sans détail. */
  { recupere: 0.65, entente: -0.2 },
  /** Le dire tout de suite à Nathalie, avec les faits et un avoir à demander. */
  { recupere: 1, entente: 0.3 },
] as const;
/** L'erreur cachée est découverte par Nathalie six fois sur dix, en semaine 11. */
export const CHANCE_DECOUVERTE = 0.6;
export const SEMAINE_DECOUVERTE = 11;
export const ENTENTE_SI_DECOUVERTE = -1.5;

/* ---------------------------------------------------------------------------
 * LES CLIENTS AU TÉLÉPHONE (décision 5).
 * ------------------------------------------------------------------------- */
/** Les clients qui appellent chaque semaine pour contester une facture. */
export const APPELS_PAR_SEMAINE = 6;
/** Quatre fois sur dix, ils ont raison : une palette facturée et pas livrée, un mauvais prix. */
export const PART_JUSTIFIEE = 0.4;
/** L'avoir moyen quand le client a raison. */
export const AVOIR_MOYEN = 180;
/** Ce qu'un artisan perdu fait perdre : sa marge du trimestre. */
export const CLIENT_PERDU = 900;
/** La remise accordée pour raccrocher vite. */
export const REMISE_POUR_RACCROCHER = 200;

/** Ce que chaque manière de répondre fait des appels : clients perdus, litiges ouverts, remises. */
export const TELEPHONE = [
  /** Défendre la facture sans vérifier : ceux qui avaient raison ouvrent un litige, la moitié s'en va. */
  {
    perdus: PART_JUSTIFIEE * 0.5,
    litiges: PART_JUSTIFIEE,
    avoirs: 0,
    remises: 0,
  },
  /** Lui dire de passer à l'agence avec ses papiers : beaucoup ne viennent pas. */
  { perdus: 0.25, litiges: 0.2, avoirs: PART_JUSTIFIEE * 0.5, remises: 0 },
  /** Écouter, vérifier contre le bon de livraison signé, faire l'avoir s'il est dû, rappeler à l'heure dite. */
  { perdus: 0.01, litiges: 0, avoirs: PART_JUSTIFIEE, remises: 0 },
  /** Une remise tout de suite, à tous : l'erreur du logiciel reste, et revient. */
  { perdus: 0.02, litiges: 0, avoirs: 0, remises: 1 },
] as const;
/** Un litige client reste ouvert trois semaines en moyenne. */
export const SEMAINES_DE_LITIGE_CLIENT = 3;

/* ---------------------------------------------------------------------------
 * LA REMARQUE ET LE DOSSIER DE FIN DE TRIMESTRE (décision 6).
 * ------------------------------------------------------------------------- */
/** Les avoirs à réclamer aux fournisseurs avant la clôture du trimestre. */
export const AVOIRS_A_RECLAMER = 7200;
/** Vos erreurs de saisie : une facture sur trente, 150 € chacune à corriger. */
export const PART_D_ERREURS_DE_SAISIE = 1 / 30;
export const COUT_ERREUR_DE_SAISIE = 150;
/** Chaque point d'entente sous 7 fait 12 % d'erreurs de saisie en plus. */
export const ERREURS_PAR_POINT = 0.12;

/** Ce que chaque manière de recevoir la remarque fait du dossier, de l'entente et des erreurs. */
export const REMARQUE = [
  /** Écouter, demander des exemples, une liste de contrôle ; le dossier à deux, chacun relit l'autre. */
  { recupere: 0.95, entente: 0.5, erreurs: 0.6, capacite: 1 },
  /** Se justifier, puis faire le dossier seul pour prouver qu'on sait. */
  { recupere: 0.55, entente: -0.5, erreurs: 1, capacite: 1 },
  /** Dire oui, puis laisser Fabienne faire le dossier : elle le connaît mieux, mais elle a l'inventaire. */
  { recupere: 0.6, entente: -0.4, erreurs: 1, capacite: 1 },
  /** Se vexer, et ne plus faire que ce qu'on vous demande. */
  { recupere: 0.4, entente: -1, erreurs: 1, capacite: 0.95 },
] as const;

/* ---------------------------------------------------------------------------
 * LE JUGEMENT, ET CE QUE LES SOURCES DISENT.
 * ------------------------------------------------------------------------- */
/** Le plafond de ce que le bureau peut coûter en plus sur le trimestre, fixé par la responsable administrative. */
export const PLAFOND = 40000;
/** Les factures en attente visées : une semaine de factures, au plus. */
export const OBJECTIF_EN_ATTENTE = FACTURES_PAR_SEMAINE;
/** Les factures payées en retard visées, par semaine. */
export const OBJECTIF_RETARDS = 5;
/** Les litiges ouverts visés, au plus. */
export const OBJECTIF_LITIGES = 2;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, la pile grossit et des factures passent leur échéance. */
export const PERTE_PAR_JOUR = 300;
/** L'évolution du nombre de factures sur un an, que la source « bruit » donne. */
export const HAUSSE_DES_FACTURES = 0.04;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  factures: 0,
  transporteur: 1,
  desaccord: 2,
  erreur: 3,
  telephone: 4,
  remarque: 5,
} as const;

export const O = {
  factures: { payerSansVerifier: 0, bannette: 1, relancer: 2, heuresSup: 3 },
  transporteur: { renvoyer: 0, promettre: 1, ecouter: 2, memeTon: 3 },
  desaccord: { parler: 0, seTaire: 1, sePlaindre: 2, enPublic: 3 },
  erreur: { cacher: 0, parFabienne: 1, mailDuVendredi: 2, dire: 3 },
  telephone: { defendre: 0, renvoyer: 1, verifier: 2, remise: 3 },
  remarque: { ecouter: 0, seJustifier: 1, laisser: 2, seVexer: 3 },
} as const;

/** Faire comme d'habitude, décision par décision. */
export const NEUTRE = [2, 0, 1, 0, 0, 1] as const;

/**
 * La semaine où chaque décision commence à jouer : la manière de traiter les
 * factures, décidée le vendredi de la semaine 1, vaut dès la semaine 2.
 */
export const DEBUT = [2, 3, 5, 7, 9, 11] as const;

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
    /** Multiplie ce que le bureau traite. */
    capacite?: number;
    /** Multiplie les factures reçues. */
    factures?: number;
    /** Ajoute des appels de clients qui contestent une facture. */
    appels?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "inventaire",
    titre: "L'inventaire du mois",
    de: "Nathalie Grosjean",
    role: "Responsable administrative",
    texte:
      "Fabienne passe la semaine sur l'inventaire avec le dépôt. Vous tenez le bureau presque sans elle.",
    duree: 1,
    effet: { capacite: 0.75 },
  },
  {
    id: "logiciel",
    titre: "Mise à jour du logiciel comptable",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel comptable change de version : chaque saisie prend plus de temps le temps de s'y faire.",
    duree: 1,
    effet: { capacite: 0.85 },
  },
  {
    id: "grippe",
    titre: "Fabienne a la grippe",
    de: "Nathalie Grosjean",
    role: "Responsable administrative",
    texte:
      "Fabienne est en arrêt deux semaines. Le bureau tourne avec vous seulement, et Nathalie quand elle peut.",
    duree: 2,
    effet: { capacite: 0.65 },
  },
  {
    id: "chantiers",
    titre: "Fin de grands chantiers",
    de: "Manon Pellerin",
    role: "Directrice d'agence",
    texte:
      "Trois grands chantiers se terminent : les fournisseurs envoient leurs factures toutes en même temps.",
    duree: 2,
    effet: { factures: 1.3 },
  },
  {
    id: "tarifs",
    titre: "Changement de tarifs mal passé",
    de: "Kevin Lopes",
    role: "Vendeur comptoir",
    texte:
      "Les nouveaux tarifs ont été mal chargés dans le logiciel : des clients reçoivent des factures au mauvais prix.",
    duree: 1,
    effet: { appels: 4 },
  },
];

/** Un ou deux imprévus par trimestre, à égalité de chances, entre la semaine 2 et la semaine 11. */
export const CHANCE_DEUX_IMPREVUS = 0.5;
export const PREMIERE_SEMAINE_IMPREVU = 2;
export const SEMAINES_POSSIBLES_IMPREVU = 10;

/**
 * LE BRUIT DE CHAQUE SEMAINE : son écart type, et ses bornes. Les factures
 * reçues varient de 5 % autour de leur moyenne, les appels de clients de 20 %,
 * les factures fausses de 30 %.
 */
export const BRUIT = {
  factures: { ecart: 0.05, min: 0.88, max: 1.12 },
  appels: { ecart: 0.2, min: 0.5, max: 1.5 },
  fausses: { ecart: 0.3, min: 0.3, max: 1.8 },
} as const;
const bruite = (b: { ecart: number; min: number; max: number }, z: number) =>
  Math.min(b.max, Math.max(b.min, 1 + b.ecart * z));

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  factures: number;
  appels: number;
  fausses: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le paiement promis au transporteur part-il à temps ? */
  uPromesse: number;
  /** Nathalie découvre-t-elle l'erreur cachée ? */
  uDecouverte: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 60013 + 29);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      factures: bruite(BRUIT.factures, gauss(r)),
      appels: bruite(BRUIT.appels, gauss(r)),
      fausses: bruite(BRUIT.fausses, gauss(r)),
    });
  }
  const uPromesse = r();
  const uDecouverte = r();
  const combien = r() < CHANCE_DEUX_IMPREVUS ? 2 : 1;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({
      imprevu,
      semaine:
        PREMIERE_SEMAINE_IMPREVU + Math.floor(r() * SEMAINES_POSSIBLES_IMPREVU),
    });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uPromesse, uDecouverte, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le paiement promis au transporteur est vraiment parti le lendemain. */
export const promesseTenue = (chemin: readonly number[], graine: number) =>
  chemin[D.transporteur] === O.transporteur.promettre &&
  hasard(graine).uPromesse < CHANCE_PROMESSE_TENUE;

/** Nathalie découvre en semaine 11 l'erreur que Sacha a cachée. */
export const erreurDecouverte = (chemin: readonly number[], graine: number) =>
  chemin[D.erreur] === O.erreur.cacher &&
  hasard(graine).uDecouverte < CHANCE_DECOUVERTE;

export type Semaine = {
  /** Les factures fournisseurs en attente en fin de semaine. */
  enAttente: number;
  /** Les factures payées en retard dans la semaine. */
  retards: number;
  /** Les litiges ouverts en fin de semaine. */
  litiges: number;
  /** L'entente au bureau, de 0 à 10. */
  entente: number;
  /** Les factures fournisseurs reçues dans la semaine. */
  recues: number;
  /** Ce que la semaine a coûté en plus à l'agence. */
  cout: number;
  /** Le coût cumulé depuis le début du trimestre. */
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au plafond : positif, le bureau a coûté moins que le plafond. */
  objectif: number;
  couts: number;
  retards: number;
  /** Ce que l'agence a payé à tort : factures fausses non vérifiées, double paiement non récupéré. */
  payeATort: number;
  litigesMoyens: number;
  ententeFinale: number;
  enAttenteFinale: number;
  promesseTenue: boolean;
  erreurDecouverte: boolean;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(
  chemin: readonly number[],
  graine: number,
  jours = 0,
): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const joue = (d: number, w: number) => w >= DEBUT[d]!;
  const tenue = promesseTenue(chemin, graine);
  const decouverte = erreurDecouverte(chemin, graine);
  // La promesse tenue vaut une écoute ; sinon le transporteur revient plus fâché.
  const accueil =
    TRANSPORTEUR[tenue ? O.transporteur.ecouter : (d2 as 0 | 1 | 2 | 3)];
  const desaccord = DESACCORD[d3 as 0 | 1 | 2 | 3];
  const erreur = ERREUR[d4 as 0 | 1 | 2 | 3];
  const telephone = TELEPHONE[d5 as 0 | 1 | 2 | 3];
  const remarque = REMARQUE[d6 as 0 | 1 | 2 | 3];

  const semaines: (Semaine | null)[] = [null];
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let enAttente = EN_ATTENTE_DEPART;
  let entente = ENTENTE_DEPART;
  let retardsTotal = 0;
  let payeATort = 0;
  let litigesCumules = 0;
  /** Les litiges clients ouverts, avec la semaine où ils se ferment. */
  const litigesClients: { jusqua: number; nombre: number }[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    let cout = w === 1 ? couts : 0;

    // L'entente : le désaccord avec Fabienne, puis ce que les décisions suivantes y font.
    if (joue(D.desaccord, w)) {
      if (w === DEBUT[D.desaccord]) entente += desaccord.saut;
      entente -= desaccord.derive;
    } else {
      entente -= ENTENTE_DERIVE;
    }
    if (w === DEBUT[D.erreur]) entente += erreur.entente;
    if (decouverte && w === SEMAINE_DECOUVERTE)
      entente += ENTENTE_SI_DECOUVERTE;
    if (w === DEBUT[D.remarque]) entente += remarque.entente;
    if (d2 === O.transporteur.memeTon && w === DEBUT[D.transporteur])
      entente += ENTENTE_SCENE;
    entente = borne(entente, 0, 10);

    // Les factures : ce qui arrive, et ce que le bureau peut traiter.
    let recues = FACTURES_PAR_SEMAINE * n.factures;
    for (const a of actifs) recues *= a.imprevu.effet.factures ?? 1;
    let capacite =
      CAPACITE * (1 + CAPACITE_PAR_POINT * (entente - OBJECTIF_ENTENTE));
    if (joue(D.desaccord, w)) capacite *= desaccord.capacite;
    if (joue(D.remarque, w)) capacite *= remarque.capacite;
    for (const a of actifs) capacite *= a.imprevu.effet.capacite ?? 1;

    const methode = joue(D.factures, w) ? d1 : O.factures.relancer;
    let sansBon = SANS_BON_DEPART;
    let heuresSup = 0;
    let fausses = 0;
    if (methode === O.factures.payerSansVerifier) {
      sansBon = 0;
      capacite *= CAPACITE_SANS_VERIFIER;
    } else if (methode === O.factures.bannette) {
      sansBon = SANS_BON_AVEC_BANNETTE;
    } else if (methode === O.factures.relancer && joue(D.factures, w)) {
      sansBon = SANS_BON_AVEC_RELANCES;
    } else if (
      methode === O.factures.heuresSup &&
      w < DEBUT[D.factures] + SEMAINES_D_HEURES_SUP
    ) {
      capacite += FACTURES_EN_HEURES_SUP;
      heuresSup = COUT_HEURES_SUP;
    }
    const traitables = capacite * (1 - sansBon);
    const traitees = Math.min(enAttente + recues, traitables);
    enAttente = enAttente + recues - traitees;
    // Payées sans rapprochement, les factures fausses passent.
    if (methode === O.factures.payerSansVerifier) {
      fausses = traitees * PART_DE_FACTURES_FAUSSES * n.fausses * ECART_MOYEN;
    }
    const retards =
      Math.max(0, enAttente - FACTURES_PAR_SEMAINE) * PART_QUI_PASSE_L_ECHEANCE;
    retardsTotal += retards;

    // Les erreurs de saisie : plus nombreuses quand l'entente est mauvaise.
    let partErreurs =
      PART_D_ERREURS_DE_SAISIE *
      (1 + ERREURS_PAR_POINT * Math.max(0, OBJECTIF_ENTENTE - entente));
    if (joue(D.remarque, w)) partErreurs *= remarque.erreurs;
    const erreursDeSaisie = traitees * partErreurs * COUT_ERREUR_DE_SAISIE;

    // Le transporteur.
    let litiges = 0;
    let transporteur = 0;
    const [debutFrais, finFrais] = accueil.frais;
    if (w < accueil.fermeture) litiges += LITIGES_DEPART;
    if (w >= debutFrais! && w <= finFrais!)
      transporteur += FRAIS_DU_TRANSPORTEUR;
    if (accueil.secours.includes(w)) transporteur += TRANSPORT_DE_SECOURS;

    // Les clients au téléphone.
    let appels = APPELS_PAR_SEMAINE * n.appels;
    for (const a of actifs) appels += a.imprevu.effet.appels ?? 0;
    let clients = 0;
    if (joue(D.telephone, w)) {
      clients =
        appels *
        (telephone.perdus * CLIENT_PERDU +
          telephone.avoirs * AVOIR_MOYEN +
          telephone.remises * REMISE_POUR_RACCROCHER);
      if (telephone.litiges > 0) {
        litigesClients.push({
          jusqua: w + SEMAINES_DE_LITIGE_CLIENT - 1,
          nombre: appels * telephone.litiges,
        });
      }
    } else {
      // Avant la décision, on fait comme d'habitude : on défend la facture.
      const habitude = TELEPHONE[O.telephone.defendre];
      clients = appels * habitude.perdus * CLIENT_PERDU;
      litigesClients.push({
        jusqua: w + SEMAINES_DE_LITIGE_CLIENT - 1,
        nombre: appels * habitude.litiges,
      });
    }
    for (const l of litigesClients) if (w <= l.jusqua) litiges += l.nombre;
    litigesCumules += litiges;

    // Le double paiement, et les avoirs de fin de trimestre.
    let paye = fausses;
    if (w === DEBUT[D.erreur]) paye += DOUBLE_PAIEMENT * (1 - erreur.recupere);
    if (w === SEMAINES) paye += AVOIRS_A_RECLAMER * (1 - remarque.recupere);
    payeATort += paye;

    const semaine =
      retards * INDEMNITE_DE_RETARD +
      paye +
      erreursDeSaisie +
      heuresSup +
      litiges * COUT_LITIGE +
      transporteur +
      clients +
      Math.max(0, OBJECTIF_ENTENTE - entente) * COUT_PAR_POINT;
    couts += semaine;
    cout += semaine;

    semaines.push({
      enAttente,
      retards,
      litiges,
      entente,
      recues,
      cout,
      couts,
    });
  }

  return {
    semaines,
    objectif: PLAFOND - couts,
    couts,
    retards: retardsTotal,
    payeATort,
    litigesMoyens: litigesCumules / SEMAINES,
    ententeFinale: entente,
    enAttenteFinale: enAttente,
    promesseTenue: tenue,
    erreurDecouverte: decouverte,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(
  chemin: readonly number[],
  graine: number,
  de: number,
  a: number,
) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const promesse = chemin[D.transporteur] === O.transporteur.promettre;
  return {
    promesseTenue: promesse && t.promesseTenue && dans(DEBUT[D.transporteur]),
    promesseRompue:
      promesse && !t.promesseTenue && dans(DEBUT[D.transporteur] + 1),
    decouverte: t.erreurDecouverte && dans(SEMAINE_DECOUVERTE),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDuBureau {
  enAttente: number | null;
  retards: number | null;
  litiges: number | null;
  entente: number | null;
  couts: number | null;
  plafondADate: number | null;
}

/** Ce que Sacha lit à la fin d'une semaine ; les décisions à venir comptent comme « faire comme d'habitude ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDuBureau {
  if (semaine === 0) {
    return {
      enAttente: EN_ATTENTE_DEPART,
      retards:
        (EN_ATTENTE_DEPART - FACTURES_PAR_SEMAINE) * PART_QUI_PASSE_L_ECHEANCE,
      litiges: LITIGES_DEPART,
      entente: ENTENTE_DEPART,
      couts: 0,
      plafondADate: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    enAttente: s.enAttente,
    retards: s.retards,
    litiges: s.litiges,
    entente: s.entente,
    couts: s.couts,
    plafondADate: (PLAFOND * semaine) / SEMAINES,
  };
}
