/**
 * L'EDI QUI S'IMPOSE : le modèle de l'administration des ventes de la
 * Laiterie de Kerbrélan.
 *
 * Celtis, la première enseigne cliente, impose l'échange de données
 * informatisé (EDI) : ses commandes, les avis d'expédition et les factures
 * doivent arriver sous forme de messages normalisés, lisibles par son système
 * sans ressaisie. On joue Lou Le Bihan, à l'administration des ventes : ni
 * directeur ni informaticien, la personne qui reçoit les commandes, prépare
 * les documents et répond quand un message est rejeté. Treize semaines, six
 * décisions, et quatre mécanismes que le joueur doit découvrir :
 *
 *   · RESSAISIR, C'EST SE TROMPER. Chaque commande recopiée à la main d'un
 *     portail vers le logiciel de gestion porte un risque d'erreur, et une
 *     erreur coûte une pénalité logistique et des produits frais perdus. Un
 *     logiciel relié à l'EDI ne recopie rien.
 *   · UN ÉCHANGE NE MARCHE QUE SUR UN LANGAGE COMMUN. Les messages sont
 *     rejetés quand les codes ne sont pas ceux que le partenaire attend (code
 *     article, code du lieu de livraison, unité). Corriger chaque message ne
 *     règle rien ; mettre la fiche article au standard de l'enseigne règle
 *     tout. Le même standard partagé avec le transporteur fait passer les
 *     palettes au quai sans contrôle.
 *   · SÉCURISER SANS S'ISOLER. Un canal non protégé expose à une fraude ; un
 *     chiffrement maison, que les partenaires ne savent pas lire, coupe les
 *     échanges. Le canal sécurisé reconnu par tous protège et reste lisible.
 *   · UN ÉCHANGE A UN COÛT ET UN GAIN. Connecter un partenaire coûte ; cela
 *     rapporte selon son volume. On connecte d'abord ceux qui commandent le
 *     plus.
 *
 * Le trimestre est jugé en euros : ce que les échanges avec les clients
 * coûtent (temps de saisie, erreurs, rejets, refus de palettes, factures
 * refusées, incidents, outils), comparé au budget de l'administration des
 * ventes.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LES COMMANDES DE CELTIS.
 * ------------------------------------------------------------------------- */
/** Les magasins Celtis livrés par la laiterie, et leurs commandes par semaine. */
export const MAGASINS = 42;
export const COMMANDES_PAR_MAGASIN = 3;
export const COMMANDES_PAR_SEMAINE = MAGASINS * COMMANDES_PAR_MAGASIN;
/** Chaque commande appelle deux messages en retour : l'avis d'expédition et la facture. */
export const MESSAGES_PAR_COMMANDE = 2;
/** Une commande mal saisie : la pénalité logistique de l'enseigne et des produits frais perdus. */
export const COUT_ERREUR = 220;
/** L'heure de travail à l'administration des ventes, charges comprises. */
export const COUT_HORAIRE = 30;

/** Ce que chaque manière de recevoir les commandes fait : erreurs, temps, abonnement, mise en place, non-conformité. */
export const RECEPTION = [
  /** Ressaisir à la main les commandes lues sur le portail de l'enseigne. */
  { erreur: 0.06, minutes: 6, abonnement: 0, miseEnPlace: 0, nonConforme: 0 },
  /** Un prestataire qui reçoit l'EDI sur un écran web : on ressaisit encore dans le logiciel. */
  { erreur: 0.04, minutes: 3, abonnement: 250, miseEnPlace: 0, nonConforme: 0 },
  /** Le logiciel de gestion relié à l'EDI par un prestataire : les commandes entrent seules. */
  {
    erreur: 0.005,
    minutes: 0.3,
    abonnement: 300,
    miseEnPlace: 4000,
    nonConforme: 0,
  },
  /** Demander une dérogation et garder le fax et le mail : l'enseigne facture la non-conformité. */
  { erreur: 0.07, minutes: 6, abonnement: 0, miseEnPlace: 0, nonConforme: 500 },
] as const;
/** Les trois premières semaines du logiciel relié, le temps de régler la traduction des messages. */
export const SEMAINES_DE_RODAGE = 3;
export const ERREUR_EN_RODAGE = 0.04;

/* ---------------------------------------------------------------------------
 * LES MESSAGES REJETÉS.
 * ------------------------------------------------------------------------- */
/** La part des messages rejetés par l'enseigne pour une erreur de format, avant toute décision. */
export const TAUX_DE_REJET = 0.12;
/** Une fois les fiches articles au standard de l'enseigne. */
export const TAUX_DE_REJET_CORRIGE = 0.02;
/** Une journée et demie pour remettre les fiches articles au standard. */
export const COUT_DE_LA_FICHE = 600;

/** Ce que chaque manière de traiter les rejets fait : taux de rejet, et ce que coûte chaque rejet. */
export const REJETS = [
  /** Corriger chaque message rejeté à la main, puis le renvoyer. */
  { corrige: false, parRejet: 35 },
  /** Mettre la fiche article au standard de l'enseigne : codes, lieux de livraison, unités. */
  { corrige: true, parRejet: 35 },
  /** Renvoyer les documents rejetés en PDF par mail : refusés à nouveau, payés en retard. */
  { corrige: false, parRejet: 55 },
  /** Payer le prestataire pour corriger chaque rejet. */
  { corrige: false, parRejet: 28 },
] as const;

/* ---------------------------------------------------------------------------
 * LA SÉCURITÉ DES ÉCHANGES.
 * ------------------------------------------------------------------------- */
/** Une fraude ou une fuite de fichiers : une facture détournée, des données exposées. */
export const COUT_INCIDENT = 15000;
export const SEMAINE_INCIDENT = 9;
/** À partir de la semaine 8, l'enseigne exige un canal sécurisé reconnu. */
export const SEMAINE_EXIGENCE = 8;
export const PENALITE_CANAL = 400;
/** Un chiffrement que les partenaires ne savent pas lire : un message sur cinq rejeté, trois semaines. */
export const REJETS_DU_CHIFFREMENT = 0.2;
export const SEMAINES_DU_CHIFFREMENT = 3;

/** Ce que chaque manière de sécuriser fait : risque d'incident, conformité, temps, mise en place. */
export const SECURITE = [
  /** Garder le serveur de fichiers avec un mot de passe partagé. */
  {
    risque: 0.3,
    conforme: false,
    parSemaine: 0,
    miseEnPlace: 0,
    chiffrementMaison: false,
  },
  /** Envoyer les fichiers par mail, le mot de passe dans un second mail. */
  {
    risque: 0.15,
    conforme: false,
    parSemaine: 100,
    miseEnPlace: 0,
    chiffrementMaison: false,
  },
  /** Chiffrer les fichiers avec un outil gratuit, sans prévenir les partenaires. */
  {
    risque: 0,
    conforme: false,
    parSemaine: 0,
    miseEnPlace: 0,
    chiffrementMaison: true,
  },
  /** Un canal sécurisé reconnu par l'enseigne, avec certificats et accès nominatifs. */
  {
    risque: 0,
    conforme: true,
    parSemaine: 50,
    miseEnPlace: 1500,
    chiffrementMaison: false,
  },
] as const;

/* ---------------------------------------------------------------------------
 * LA FACTURE ÉLECTRONIQUE.
 * ------------------------------------------------------------------------- */
/** À partir de la semaine 9, l'enseigne n'accepte plus que des factures électroniques structurées. */
export const SEMAINE_FACTURE_ELECTRONIQUE = 9;
/** Une facture refusée : la refaire, et attendre plus longtemps son paiement. */
export const COUT_FACTURE_REFUSEE = 14;

/** Ce que chaque manière de facturer fait : refus après la semaine 9, coût par facture, mise en place. */
export const FACTURATION = [
  /** Une plateforme agréée reliée au logiciel, qui émet des factures structurées. */
  { refus: 0, parFacture: 0.3, miseEnPlace: 2000 },
  /** Continuer d'envoyer des PDF par mail : ce n'est pas une facture électronique. */
  { refus: 1, parFacture: 0, miseEnPlace: 0 },
  /** Saisir chaque facture sur le portail fournisseur de l'enseigne. */
  { refus: 0.4, parFacture: 3, miseEnPlace: 0 },
  /** Revenir au papier posté, le temps de voir. */
  { refus: 1, parFacture: 1.5, miseEnPlace: 0 },
] as const;

/* ---------------------------------------------------------------------------
 * LE TRANSPORTEUR.
 * ------------------------------------------------------------------------- */
/** Les palettes livrées chaque semaine aux entrepôts de l'enseigne. */
export const PALETTES_PAR_SEMAINE = 350;
/** Une palette refusée au quai : la relivrer, et payer la pénalité. */
export const COUT_REFUS_PALETTE = 110;
/** Ce que chaque manière de travailler avec le transporteur fait : palettes refusées, coûts. */
export const TRANSPORT = [
  /** Le bon de livraison papier avec les palettes, comme avant. */
  { refus: 0.04, parSemaine: 0, miseEnPlace: 0 },
  /** Un fichier tableur maison envoyé chaque soir au transporteur, qui le ressaisit. */
  { refus: 0.025, parSemaine: 60, miseEnPlace: 0 },
  /** Le transporteur imprime ses propres étiquettes dans son entrepôt. */
  { refus: 0.02, parSemaine: 150, miseEnPlace: 0 },
  /** Le standard de l'enseigne partagé : avis d'expédition EDI et étiquette logistique normalisée. */
  { refus: 0.005, parSemaine: 0, miseEnPlace: 600 },
] as const;

/* ---------------------------------------------------------------------------
 * LES AUTRES CLIENTS (décision 6).
 * ------------------------------------------------------------------------- */
/** Les commandes des deux autres enseignes, ressaisies à la main jusqu'ici. */
export const COMMANDES_AUTRES_ENSEIGNES = 140;
/** Les petites crémeries et épiceries fines, et ce que coûte le raccordement de chacune. */
export const PETITS_CLIENTS = 25;
export const RACCORDEMENT_PETIT_CLIENT = 300;
/** Raccorder une enseigne : peu de chose si le logiciel est déjà relié, beaucoup sinon. */
export const RACCORDEMENT_RELIE = 400;
export const RACCORDEMENT_NON_RELIE = 1500;
/** S'adapter au format de chaque client : un traducteur par client à entretenir. */
export const ENTRETIEN_DES_FORMATS = 400;
export const ERREUR_FORMATS_MULTIPLES = 0.04;

/* ---------------------------------------------------------------------------
 * LE JUGEMENT.
 * ------------------------------------------------------------------------- */
/** Le budget de l'administration des ventes pour les échanges avec les clients, sur le trimestre. */
export const BUDGET = 70000;
export const OBJECTIF_ERREURS = 0.02;
export const OBJECTIF_REJETS = 10;
/** Les palettes refusées visées, par semaine. */
export const OBJECTIF_PALETTES = 10;
/** L'évolution des commandes de Celtis sur un an, que la source « bruit » donne. */
export const HAUSSE_DES_COMMANDES = 0.03;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des commandes ressaisies dans l'urgence, et des erreurs. */
export const PERTE_PAR_JOUR = 400;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  reception: 0,
  rejets: 1,
  securite: 2,
  facture: 3,
  transport: 4,
  clients: 5,
} as const;

export const O = {
  reception: { ressaisir: 0, ecranWeb: 1, relier: 2, derogation: 3 },
  rejets: { corrigerUnParUn: 0, fiches: 1, pdf: 2, prestataire: 3 },
  securite: { serveur: 0, mail: 1, chiffrementMaison: 2, canalReconnu: 3 },
  facture: { plateforme: 0, pdf: 1, portail: 2, papier: 3 },
  transport: {
    papier: 0,
    tableur: 1,
    etiquettesDuTransporteur: 2,
    standard: 3,
  },
  clients: { tous: 0, parVolume: 1, aucun: 2, chacunSonFormat: 3 },
} as const;

/** Faire comme d'habitude, décision par décision. */
export const NEUTRE = [0, 0, 0, 1, 0, 2] as const;

/** La semaine où chaque décision commence à jouer. */
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
    /** Multiplie les commandes de Celtis. */
    commandes?: number;
    /** Ajoute une part de messages rejetés. */
    rejets?: number;
    /** Multiplie le temps de saisie. */
    temps?: number;
    /** Multiplie le coût des erreurs. */
    penalites?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "promotion",
    titre: "Opération promotionnelle chez Celtis",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Celtis lance une promotion sur les yaourts : les magasins commandent beaucoup plus cette semaine.",
    duree: 1,
    effet: { commandes: 1.4 },
  },
  {
    id: "panne",
    titre: "Panne chez le prestataire",
    de: "Service informatique",
    role: "Loudéac",
    texte:
      "Le serveur du prestataire est tombé une journée : des messages sont partis en double ou pas du tout.",
    duree: 1,
    effet: { rejets: 0.1 },
  },
  {
    id: "gamme",
    titre: "Nouvelles références",
    de: "Morwenna Pellen",
    role: "Cheffe de marque",
    texte:
      "Six nouvelles références de desserts entrent chez Celtis : leurs codes sont tout neufs.",
    duree: 2,
    effet: { rejets: 0.05 },
  },
  {
    id: "absence",
    titre: "Une collègue en arrêt",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Gwenola est en arrêt deux semaines : vous tenez l'administration des ventes avec une intérimaire.",
    duree: 2,
    effet: { temps: 1.5 },
  },
  {
    id: "audit",
    titre: "Audit logistique de l'enseigne",
    de: "Celtis",
    role: "Direction logistique",
    texte:
      "Celtis audite ses fournisseurs cette semaine : chaque erreur de livraison est comptée double.",
    duree: 1,
    effet: { penalites: 1.5 },
  },
];

/** Un ou deux imprévus par trimestre, à égalité de chances, entre la semaine 2 et la semaine 11. */
export const CHANCE_DEUX_IMPREVUS = 0.5;
export const PREMIERE_SEMAINE_IMPREVU = 2;
export const SEMAINES_POSSIBLES_IMPREVU = 10;

/** Le bruit de chaque semaine : les commandes varient de 6 % autour de leur moyenne, les rejets de 20 %. */
export const BRUIT = {
  commandes: { ecart: 0.06, min: 0.85, max: 1.15 },
  rejets: { ecart: 0.2, min: 0.5, max: 1.5 },
} as const;
const bruite = (b: { ecart: number; min: number; max: number }, z: number) =>
  Math.min(b.max, Math.max(b.min, 1 + b.ecart * z));

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  commandes: number;
  rejets: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Un incident de sécurité frappe-t-il un canal mal protégé ? */
  uIncident: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 40009 + 41);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      commandes: bruite(BRUIT.commandes, gauss(r)),
      rejets: bruite(BRUIT.rejets, gauss(r)),
    });
  }
  const uIncident = r();
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
  const h = { semaines, uIncident, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Un incident de sécurité frappe le canal choisi, en semaine 9. */
export const incidentDeSecurite = (chemin: readonly number[], graine: number) =>
  hasard(graine).uIncident <
  SECURITE[chemin[D.securite] as 0 | 1 | 2 | 3].risque;

export type Semaine = {
  /** La part des commandes de Celtis saisies avec une erreur. */
  erreurs: number;
  /** Les messages rejetés par l'enseigne dans la semaine. */
  rejets: number;
  /** Les palettes refusées au quai. */
  palettes: number;
  /** Les factures refusées. */
  factures: number;
  /** Les commandes de Celtis reçues dans la semaine. */
  commandes: number;
  cout: number;
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget : positif, les échanges ont coûté moins que prévu. */
  objectif: number;
  couts: number;
  erreursMoyennes: number;
  rejets: number;
  palettesRefusees: number;
  facturesRefusees: number;
  incident: boolean;
}

export function simuler(
  chemin: readonly number[],
  graine: number,
  jours = 0,
): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const joue = (d: number, w: number) => w >= DEBUT[d]!;
  const incident = incidentDeSecurite(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let sommeErreurs = 0;
  let rejetsTotal = 0;
  let palettesTotal = 0;
  let facturesTotal = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    const effet = (cle: "commandes" | "temps" | "penalites") =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[cle] ?? 1), 1);
    let cout = w === 1 ? couts : 0;
    let outils = 0;

    // Les commandes de Celtis.
    const commandes = COMMANDES_PAR_SEMAINE * n.commandes * effet("commandes");
    const mode =
      RECEPTION[
        (joue(D.reception, w) ? d1 : O.reception.ressaisir) as 0 | 1 | 2 | 3
      ];
    let erreur: number = mode.erreur;
    if (
      joue(D.reception, w) &&
      d1 === O.reception.relier &&
      w < DEBUT[D.reception] + SEMAINES_DE_RODAGE
    )
      erreur = ERREUR_EN_RODAGE;
    if (w === DEBUT[D.reception]) outils += mode.miseEnPlace;
    outils += mode.abonnement + mode.nonConforme;
    const saisie =
      (commandes * mode.minutes * effet("temps") * COUT_HORAIRE) / 60;
    const erreurs = commandes * erreur * COUT_ERREUR * effet("penalites");

    // Les messages rejetés.
    const rejet =
      REJETS[
        (joue(D.rejets, w) ? d2 : O.rejets.corrigerUnParUn) as 0 | 1 | 2 | 3
      ];
    let taux =
      rejet.corrige && w > DEBUT[D.rejets]
        ? TAUX_DE_REJET_CORRIGE
        : TAUX_DE_REJET;
    if (rejet.corrige && w === DEBUT[D.rejets]) outils += COUT_DE_LA_FICHE;
    for (const a of actifs) taux += a.imprevu.effet.rejets ?? 0;
    const securite = SECURITE[d3 as 0 | 1 | 2 | 3];
    if (
      joue(D.securite, w) &&
      securite.chiffrementMaison &&
      w < DEBUT[D.securite] + SEMAINES_DU_CHIFFREMENT
    )
      taux += REJETS_DU_CHIFFREMENT;
    const rejets = commandes * MESSAGES_PAR_COMMANDE * taux * n.rejets;
    rejetsTotal += rejets;

    // La sécurité des échanges.
    let incidents = 0;
    if (joue(D.securite, w)) {
      if (w === DEBUT[D.securite]) outils += securite.miseEnPlace;
      outils += securite.parSemaine;
      if (
        !securite.conforme &&
        !securite.chiffrementMaison &&
        w >= SEMAINE_EXIGENCE
      )
        outils += PENALITE_CANAL;
      if (incident && w === SEMAINE_INCIDENT) incidents = COUT_INCIDENT;
    }

    // La facture électronique.
    const facturation =
      FACTURATION[(joue(D.facture, w) ? d4 : O.facture.pdf) as 0 | 1 | 2 | 3];
    if (joue(D.facture, w) && w === DEBUT[D.facture])
      outils += facturation.miseEnPlace;
    let facturesRefusees = 0;
    if (joue(D.facture, w)) {
      outils += commandes * facturation.parFacture;
      if (w >= SEMAINE_FACTURE_ELECTRONIQUE)
        facturesRefusees = commandes * facturation.refus;
    }
    facturesTotal += facturesRefusees;

    // Le transporteur.
    const transport =
      TRANSPORT[
        (joue(D.transport, w) ? d5 : O.transport.papier) as 0 | 1 | 2 | 3
      ];
    if (joue(D.transport, w)) {
      if (w === DEBUT[D.transport]) outils += transport.miseEnPlace;
      outils += transport.parSemaine;
    }
    const palettes = PALETTES_PAR_SEMAINE * transport.refus;
    palettesTotal += palettes;

    // Les deux autres enseignes et les petits clients.
    let autres =
      (COMMANDES_AUTRES_ENSEIGNES *
        RECEPTION[O.reception.ressaisir].minutes *
        COUT_HORAIRE) /
      60;
    autres +=
      COMMANDES_AUTRES_ENSEIGNES *
      RECEPTION[O.reception.ressaisir].erreur *
      COUT_ERREUR;
    if (joue(D.clients, w)) {
      const raccordement =
        d1 === O.reception.relier ? RACCORDEMENT_RELIE : RACCORDEMENT_NON_RELIE;
      const relie = RECEPTION[O.reception.relier];
      const connectees =
        (COMMANDES_AUTRES_ENSEIGNES * relie.minutes * COUT_HORAIRE) / 60 +
        COMMANDES_AUTRES_ENSEIGNES * relie.erreur * COUT_ERREUR;
      if (d6 === O.clients.tous || d6 === O.clients.parVolume) {
        autres = connectees;
        if (w === DEBUT[D.clients]) outils += 2 * raccordement;
        if (d6 === O.clients.tous && w === DEBUT[D.clients])
          outils += PETITS_CLIENTS * RACCORDEMENT_PETIT_CLIENT;
      } else if (d6 === O.clients.chacunSonFormat) {
        autres =
          (COMMANDES_AUTRES_ENSEIGNES *
            RECEPTION[O.reception.ecranWeb].minutes *
            COUT_HORAIRE) /
            60 +
          COMMANDES_AUTRES_ENSEIGNES * ERREUR_FORMATS_MULTIPLES * COUT_ERREUR;
        outils += ENTRETIEN_DES_FORMATS;
      }
    }

    const semaine =
      saisie +
      erreurs +
      outils +
      rejets * rejet.parRejet +
      incidents +
      facturesRefusees * COUT_FACTURE_REFUSEE +
      palettes * COUT_REFUS_PALETTE +
      autres;
    couts += semaine;
    cout += semaine;
    sommeErreurs += erreur;
    semaines.push({
      erreurs: erreur,
      rejets,
      palettes,
      factures: facturesRefusees,
      commandes,
      cout,
      couts,
    });
  }

  return {
    semaines,
    objectif: BUDGET - couts,
    couts,
    erreursMoyennes: sommeErreurs / SEMAINES,
    rejets: rejetsTotal,
    palettesRefusees: palettesTotal,
    facturesRefusees: facturesTotal,
    incident: incident && joue(D.securite, SEMAINE_INCIDENT),
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
  return {
    incident: t.incident && dans(SEMAINE_INCIDENT),
    facturesRefusees:
      t.facturesRefusees > 0 && dans(SEMAINE_FACTURE_ELECTRONIQUE),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDesEchanges {
  erreurs: number | null;
  rejets: number | null;
  palettes: number | null;
  factures: number | null;
  couts: number | null;
  budgetADate: number | null;
}

/** Ce que Lou lit à la fin d'une semaine ; les décisions à venir comptent comme « faire comme d'habitude ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDesEchanges {
  if (semaine === 0) {
    return {
      erreurs: RECEPTION[O.reception.ressaisir].erreur,
      rejets: COMMANDES_PAR_SEMAINE * MESSAGES_PAR_COMMANDE * TAUX_DE_REJET,
      palettes: PALETTES_PAR_SEMAINE * TRANSPORT[O.transport.papier].refus,
      factures: 0,
      couts: 0,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    erreurs: s.erreurs,
    rejets: s.rejets,
    palettes: s.palettes,
    factures: s.factures,
    couts: s.couts,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
