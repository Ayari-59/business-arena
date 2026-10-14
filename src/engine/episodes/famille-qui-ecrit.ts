/**
 * LA FAMILLE QUI ÉCRIT À L'ARS — le modèle d'un EHPAD face à une réclamation.
 *
 * L'EHPAD de Dijon-Montchapet (Association Solvanne) : 96 places, 42
 * équivalents temps plein d'aides-soignants et d'accompagnants. La fille
 * d'une résidente a écrit à l'ARS et au journal local : toilettes faites tard,
 * sonnettes sans réponse, linge perdu. L'ARS demande des explications sous
 * quinze jours, et l'équipe se sent attaquée. Treize semaines, d'avril à juin,
 * six décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · LES FAITS MONTRENT UNE CAUSE D'ORGANISATION, MÊLÉE D'UN MALENTENDU. Le
 *     journal des appels malades et les plannings disent la même chose : de
 *     7 h à 9 h le week-end, six aides-soignantes au lieu de neuf en semaine,
 *     et dix-neuf minutes d'attente à la sonnette au lieu de six. Le linge se
 *     perd depuis qu'un prestataire le traite, surtout les vêtements que les
 *     familles apportent sans les faire marquer. Les toilettes tardives de la
 *     semaine, elles, sont un choix de la résidente, écrit dans son projet
 *     personnalisé, que sa fille ignorait.
 *   · LA RÉPONSE À L'ARS DÉCIDE DE LA SUITE. Une réponse factuelle, appuyée
 *     sur des faits établis, avec un plan d'action daté, fait clore la
 *     réclamation presque toujours ; une réponse défensive (« tout est
 *     conforme ») vaut une inspection sur place deux fois sur trois. Le tirage
 *     est fait d'avance ; la probabilité dépend des choix.
 *   · LA FAMILLE RENCONTRÉE S'APAISE LE PLUS SOUVENT. Reçue avec des faits,
 *     elle s'apaise cinq fois sur six ; sinon, d'autres familles et la presse
 *     s'en mêlent une fois sur deux, les réclamations se multiplient, et les
 *     demandes d'admission s'en vont ailleurs.
 *   · SANCTIONNER SANS FAITS COÛTE PLUS QUE CE QU'ON CROIT RÉGLER. Mettre à
 *     pied l'aide-soignante citée par la famille met l'équipe du week-end en
 *     arrêt et fait partir quelqu'un ; soutenir l'équipe tout en corrigeant
 *     l'organisation tient. Défendre l'équipe en bloc la soulage un mois, et
 *     laisse intacte la cause des plaintes.
 *
 * Le trimestre est jugé en euros : ce que la réclamation et ses suites coûtent
 * à l'EHPAD — renforts, linge, remplacements, départs de soignants, inspection
 * et ses suites, temps passé à traiter les réclamations — plus l'effet attendu
 * sur les admissions du trimestre suivant : quand la liste d'attente fond, une
 * chambre libérée reste vide plus longtemps, et chaque journée vide est une
 * journée d'hébergement et de dépendance non facturée. L'objectif est l'opposé
 * de ce coût : plus il est proche de zéro, mieux c'est.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Établissement, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const PLACES = 96;
/** Aides-soignants et accompagnants, en équivalents temps plein. */
export const ETP_SOIGNANTS = 42;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des réclamations de plus à traiter, et le journal qui relance. */
export const PERTE_PAR_JOUR = 1000;

/** Le délai moyen de réponse aux appels malades, en minutes. */
export const APPELS = {
  /** En semaine, de 7 h à 9 h : neuf aides-soignantes. */
  semaine: 6,
  /** Le week-end, de 7 h à 9 h : six aides-soignantes. */
  weekEnd: 19,
  /** Avec une aide-soignante de l'équipe en plus de 7 h à 9 h. */
  renfort: 9,
  /** Avec une intérimaire, qui ne connaît ni les résidents ni leurs habitudes. */
  interim: 12,
  /** En avançant à 7 h un poste d'après-midi. */
  posteAvance: 13,
  /** L'objectif que l'EHPAD s'est donné, et qu'il tient en semaine. */
  objectif: 10,
} as const;
/** La part des appels du week-end matin qui attendent plus d'un quart d'heure. */
export const PART_APPELS_LONGS = 0.31;
export const AS_SEMAINE_MATIN = 9;
export const AS_WEEK_END_MATIN = 6;

/** Le coût d'une heure d'aide-soignante, charges comprises. */
export const HEURE_AS = 28;
/** Le dimanche, avec l'indemnité de dimanche. */
export const HEURE_AS_DIMANCHE = 32;
/** Le renfort : une aide-soignante de 7 h à 9 h, le samedi et le dimanche. */
export const HEURES_RENFORT = 2;
/** Ce que coûte le renfort par week-end, et sur un trimestre de treize week-ends. */
export const RENFORT_WEEK_END = HEURES_RENFORT * (HEURE_AS + HEURE_AS_DIMANCHE);
export const RENFORT_TRIMESTRE = SEMAINES * RENFORT_WEEK_END;
/** L'intérim : 60 € de l'heure, quatre heures au moins par mission. */
export const HEURE_INTERIM = 60;
export const MINIMUM_INTERIM = 4;
export const INTERIM_WEEK_END = 2 * MINIMUM_INTERIM * HEURE_INTERIM;
/** Une journée d'aide-soignante remplacée en intérim. */
export const JOUR_REMPLACEMENT = 390;

/** Le linge des résidents, en pièces déclarées perdues par semaine. */
export const LINGE = {
  /** Avant le changement de prestataire, en janvier. */
  avant: 1.5,
  /** Depuis : 64 pièces en huit semaines. */
  depuis: 8,
  /** La part des pièces perdues qui n'étaient pas marquées. */
  nonMarquees: 0.7,
  /** Ce que l'EHPAD rembourse en moyenne pour une pièce perdue. */
  remboursement: 35,
  /** Rembourser au prix du neuf, sans discuter. */
  prixDuNeuf: 50,
  /** La pénalité du contrat, par pièce marquée perdue : jamais réclamée. */
  penalite: 30,
  /** Pièces perdues par semaine, une fois tout marqué, si le prestataire suit le plan. */
  planSuivi: 1.2,
  /** Si le prestataire conteste : le marquage seul fait une partie du travail. */
  planConteste: 3,
  /** Le linge personnel repris en interne. */
  interne: 0.5,
} as const;

export const COUTS = {
  /** L'étiqueteuse thermocollante et deux jours d'agent pour marquer les armoires. */
  marquage: 1000,
  /** La lingère en contrat à durée déterminée et les produits, par semaine. */
  lingerie: 700,
  /** Une inspection sur place : préparation, deux jours de cadres, pièces à produire. */
  inspection: 6000,
  /** L'audit externe de l'organisation que l'injonction impose. */
  audit: 5000,
  /** Un départ : recrutement, intégration, et l'intérim jusqu'à l'arrivée de la remplaçante. */
  depart: 9000,
  /** Une journée portes ouvertes et une plaquette. */
  portesOuvertes: 1800,
  /** Une chute au lever : bilan médical, transport éventuel, temps soignant, déclaration d'événement indésirable. */
  chute: 800,
  /** Le temps de cadre pour traiter une réclamation : recevoir, vérifier, répondre. */
  reclamation: 150,
} as const;

/** Ce que coûte une journée de chambre vide : hébergement et ticket modérateur dépendance. */
export const TARIF_HEBERGEMENT = 72;
export const TARIF_DEPENDANCE = 6;
export const JOURNEE = TARIF_HEBERGEMENT + TARIF_DEPENDANCE;
/** Les admissions attendues au trimestre suivant, et le délai normal pour pourvoir une chambre. */
export const ADMISSIONS_SUIVANT = 8;
export const DELAI_NORMAL = 9;
/** Même avec une longue liste, il faut cinq jours pour préparer une chambre et accueillir. */
export const DELAI_MINIMUM = 5;
/** La liste d'attente d'avant l'article ; chaque demande en moins allonge le délai d'un jour et demi. */
export const LISTE_NORMALE = 34;
export const JOURS_PAR_DEMANDE = 1.5;
export const LISTE_DEPART = 27;
export const CONFIANCE_DEPART = 0.78;
export const ABSENTEISME_BASE = 0.11;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  equipe: 0,
  famille: 1,
  ars: 2,
  weekEnd: 3,
  linge: 4,
  cvs: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 3, 3, 3] as const;

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
    /** Équivalents temps plein absents en plus, chaque semaine. */
    absents?: number;
    /** Minutes de plus à la sonnette le week-end matin. */
    appels?: number;
    /** Pièces de linge perdues en plus (le prestataire seulement). */
    linge?: number;
    /** Ce que la semaine coûte en plus. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "ponts",
    titre: "Les ponts de mai",
    de: "Planning",
    role: "EHPAD de Montchapet",
    texte:
      "Le pont de l'Ascension tombe mal : trois aides-soignantes arrêtées la même semaine, remplacées en intérim.",
    duree: 1,
    effet: { absents: 1.5, appels: 2 },
  },
  {
    id: "ascenseur",
    titre: "Panne de l'ascenseur du bâtiment B",
    de: "Services techniques",
    role: "Siège",
    texte:
      "L'ascenseur du bâtiment B est en panne dix jours : repas servis en chambre au premier étage, et des bras en moins ailleurs.",
    duree: 2,
    effet: { appels: 3, cout: 750 },
  },
  {
    id: "idec",
    titre: "Arrêt de l'infirmière coordinatrice",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Khadidja Haddouche, l'infirmière coordinatrice, est arrêtée deux semaines : une infirmière intérimaire assure l'essentiel.",
    duree: 2,
    effet: { appels: 1, cout: 1500 },
  },
  {
    id: "blanchisserie",
    titre: "Panne chez le blanchisseur",
    de: "Blanchisserie Ondelys",
    role: "Prestataire",
    texte:
      "Le tunnel de lavage d'Ondelys est en panne : le linge revient avec quatre jours de retard, trié dans l'urgence.",
    duree: 1,
    effet: { linge: 8 },
  },
  {
    id: "carneo",
    titre: "Panne de Carnéo",
    de: "Systèmes d'information",
    role: "Siège",
    texte:
      "Le dossier de soins Carnéo est inaccessible deux jours : transmissions sur papier, ressaisies ensuite.",
    duree: 1,
    effet: { appels: 2, cout: 600 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Minutes de plus ou de moins à la sonnette le week-end. */
  appels: number;
  /** Le linge perdu, en multiple de l'attendu. */
  linge: number;
  /** L'absentéisme ordinaire de la semaine. */
  absences: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La fille de la résidente s'apaise-t-elle ? */
  uFamille: number;
  /** D'autres familles et la presse s'en mêlent-elles ? */
  uAutres: number;
  /** L'ARS diligente-t-elle une inspection ? */
  uArs: number;
  /** L'équipe du week-end s'arrête-t-elle après une sanction ? */
  uArrets: number;
  /** Une aide-soignante démissionne-t-elle après une sanction ? */
  uDepart: number;
  /** Les volontaires du renfort tiennent-elles jusqu'à fin juin ? */
  uVolontaires: number;
  /** Le blanchisseur accepte-t-il le plan et les pénalités ? */
  uPrestataire: number;
  /** Quand le renfort promis lâche, l'ARS revient-elle voir ? */
  uRelance: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000889 + 7);
  // Les tirages des suites d'abord, dans un ordre fixe, puis le bruit des semaines.
  const uFamille = r();
  const uAutres = r();
  const uArs = r();
  const uArrets = r();
  const uDepart = r();
  const uVolontaires = r();
  const uPrestataire = r();
  const uRelance = r();
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      appels: Math.min(3, Math.max(-3, 1.2 * gauss(r))),
      linge: Math.min(1.5, Math.max(0.6, 1 + 0.18 * gauss(r))),
      absences: Math.min(0.15, Math.max(0.08, ABSENTEISME_BASE + 0.012 * gauss(r))),
    });
  }
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
    uFamille,
    uAutres,
    uArs,
    uArrets,
    uDepart,
    uVolontaires,
    uPrestataire,
    uRelance,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/**
 * LA SEMAINE OÙ UNE AIDE-SOIGNANTE EST SANCTIONNÉE, s'il y en a une : mise à
 * pied dès la semaine 1, ou sanction annoncée à l'ARS en semaine 3.
 */
export function semaineDeSanction(chemin: readonly number[]): number | null {
  if (chemin[D.equipe] === 2) return 1;
  if (chemin[D.ars] === 2) return 3;
  return null;
}

/**
 * LA FAMILLE S'APAISE-T-ELLE ?
 *
 * Ce qui l'apaise, c'est d'être reçue avec des faits : ce qui est fondé, ce
 * qui ne l'est pas, ce qui va changer. Sans faits établis, la rencontre
 * n'apporte que des promesses ; après une note qui dit que la famille exagère,
 * elle vient pour en découdre. Une sanction ne l'apaise pas : elle ne l'a pas
 * demandée.
 */
const APAISEMENT = [
  // Établir les faits, défendre en bloc, sanctionner, attendre.
  [0.85, 0.3, 0.45, 0.45], // La recevoir avec l'infirmière coordinatrice et le médecin.
  [0.15, 0.05, 0.1, 0.1], // Lui écrire que les soins sont conformes.
  [0.3, 0.15, 0.2, 0.2], // La recevoir après la réponse à l'ARS.
  [0.5, 0.2, 0.3, 0.3], // Le médecin coordonnateur l'appelle.
] as const;

export const chanceDApaisement = (chemin: readonly number[]) =>
  APAISEMENT[chemin[D.famille]!]![chemin[D.equipe]!]!;
export const familleApaisee = (chemin: readonly number[], graine: number) =>
  hasard(graine).uFamille < chanceDApaisement(chemin);

/** Une famille qui ne s'apaise pas trouve des alliés une fois sur deux ; plus encore après une note qui la met en cause. */
export function chanceQueDAutresSEnMelent(chemin: readonly number[]): number {
  return 0.5 + (chemin[D.equipe] === 1 ? 0.2 : 0) + (chemin[D.famille] === 1 ? 0.1 : 0);
}
export const autresFamilles = (chemin: readonly number[], graine: number) =>
  !familleApaisee(chemin, graine) && hasard(graine).uAutres < chanceQueDAutresSEnMelent(chemin);

/**
 * L'ARS INSPECTE-T-ELLE ?
 *
 * Une réponse factuelle avec un plan daté fait clore le dossier neuf fois sur
 * dix quand les faits ont été établis avec l'équipe ; sans eux, la réponse est
 * mince. Une réponse défensive vaut une inspection deux fois sur trois. Les
 * lettres d'autres familles, arrivées entre-temps, pèsent dans la balance.
 */
export function chanceDInspection(chemin: readonly number[], autres: boolean): number {
  const faits = chemin[D.equipe] === 0;
  const base = [faits ? 0.1 : 0.3, 0.7, 0.4, 0.45][chemin[D.ars]!]!;
  return Math.min(0.9, base + (autres ? 0.2 : 0));
}
export const inspection = (chemin: readonly number[], graine: number) =>
  hasard(graine).uArs < chanceDInspection(chemin, autresFamilles(chemin, graine));

/** Après une sanction sans faits, deux aides-soignantes du week-end s'arrêtent trois fois sur cinq. */
export const arretsApresSanction = (chemin: readonly number[], graine: number) =>
  semaineDeSanction(chemin) !== null && hasard(graine).uArrets < 0.6;
/** Et une aide-soignante démissionne deux fois sur cinq. */
export const departApresSanction = (chemin: readonly number[], graine: number) =>
  semaineDeSanction(chemin) !== null && hasard(graine).uDepart < 0.4;

/**
 * LES VOLONTAIRES DU RENFORT TIENNENT-ELLES ?
 *
 * Quatre aides-soignantes à temps partiel sont prêtes à commencer à 7 h ;
 * avec les congés de juin, le renfort lâche une fois sur cinq à partir de la
 * semaine 10. Après une sanction, l'équipe ne vient pas plus tôt pour se faire
 * reprocher le retard : le renfort ne tient qu'une fois sur quatre, et quand
 * il lâche, il ne démarre pas.
 */
export const chanceQueLesVolontairesTiennent = (chemin: readonly number[]) =>
  semaineDeSanction(chemin) === 1 ? 0.25 : 0.8;
export const volontairesTiennent = (chemin: readonly number[], graine: number) =>
  hasard(graine).uVolontaires < chanceQueLesVolontairesTiennent(chemin);
/** La semaine où le renfort des volontaires s'arrête, s'il s'arrête. */
export function finDuRenfort(chemin: readonly number[], graine: number): number | null {
  if (chemin[D.weekEnd] !== 0 || volontairesTiennent(chemin, graine)) return null;
  return semaineDeSanction(chemin) === 1 ? 5 : 10;
}

/**
 * QUAND LE RENFORT PROMIS LÂCHE : le plan d'action annoncé à l'ARS et aux
 * familles n'est plus tenu ; une famille le signale, et quatre fois sur cinq
 * l'ARS vient voir en semaine 12, si elle n'est pas déjà venue.
 */
export const SEMAINE_DE_RELANCE = 12;
export const relanceDeLArs = (chemin: readonly number[], graine: number) =>
  finDuRenfort(chemin, graine) !== null &&
  !inspection(chemin, graine) &&
  hasard(graine).uRelance < 0.8;

/** Deux fois sur trois, le blanchisseur accepte le plan et les pénalités ; sinon il les conteste. */
export const CHANCE_PRESTATAIRE = 0.65;
export const prestataireAccepte = (graine: number) =>
  hasard(graine).uPrestataire < CHANCE_PRESTATAIRE;

/** Le délai normal pour pourvoir une chambre libérée, selon la liste d'attente. */
export const delaiDAdmission = (liste: number) =>
  Math.max(DELAI_MINIMUM, DELAI_NORMAL + JOURS_PAR_DEMANDE * (LISTE_NORMALE - liste));
/**
 * L'effet attendu sur les admissions du trimestre suivant : les journées vides de plus
 * (ou de moins, quand la liste dépasse celle d'avant l'article), facturées à rien.
 */
export const perteDAdmissions = (liste: number) =>
  ADMISSIONS_SUIVANT * (delaiDAdmission(liste) - DELAI_NORMAL) * JOURNEE;

export type Semaine = {
  /** Délai moyen de réponse aux appels malades, le week-end de 7 h à 9 h, en minutes. */
  appels: number;
  /** Pièces de linge déclarées perdues. */
  linge: number;
  /** Réclamations des familles reçues dans la semaine. */
  reclamations: number;
  absenteisme: number;
  /** Demandes d'admission en attente. */
  liste: number;
  /** La confiance des familles et des prescripteurs, de 0 à 1 : ce qui nourrit la liste. */
  confiance: number;
  /** Ce que la semaine a coûté. */
  cout: number;
  /** Les coûts cumulés depuis le début du trimestre. */
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'opposé du coût de la réclamation, admissions comprises : plus proche de zéro, mieux c'est. */
  objectif: number;
  couts: number;
  /** L'effet attendu sur les admissions du trimestre suivant. */
  perteAdmissions: number;
  renfort: number;
  linge: number;
  remplacements: number;
  inspectionCout: number;
  apaisee: boolean;
  autres: boolean;
  inspection: boolean;
  /** L'ARS revenue en semaine 12 parce que le renfort promis a lâché. */
  relance: boolean;
  arrets: boolean;
  depart: boolean;
  sanction: number | null;
  finDuRenfort: number | null;
  prestataireAccepte: boolean;
  /** Le plan de correction a été exigé du blanchisseur. */
  planLinge: boolean;
  reclamations: number;
  listeFinale: number;
  /** Le délai moyen à la sonnette le week-end matin, de la semaine 10 à la semaine 13. */
  appelsFin: number;
  absenteismeMoyen: number;
  /** La prévision de la semaine 1 : un renfort de 7 h à 9 h le week-end, sur treize week-ends, en k€. */
  renfortTrimestre: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, , , d4, d5, d6] = chemin;
  const sanction = semaineDeSanction(chemin);
  const apaisee = familleApaisee(chemin, graine);
  const autres = autresFamilles(chemin, graine);
  const inspecte = inspection(chemin, graine);
  const arrets = arretsApresSanction(chemin, graine);
  const depart = departApresSanction(chemin, graine);
  const fin = finDuRenfort(chemin, graine);
  const relance = relanceDeLArs(chemin, graine);
  const accepte = prestataireAccepte(graine);
  const semaines: (Semaine | null)[] = [null];
  let confiance = CONFIANCE_DEPART;
  let liste = LISTE_DEPART;
  let couts = 0;
  let renfort = 0;
  let linge = 0;
  let remplacements = 0;
  let inspectionCout = 0;
  let reclamations = 0;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? perte : 0;

    // Le matin du week-end : qui est là de 7 h à 9 h.
    let couvert: "aucun" | "equipe" | "interim" | "poste" = "aucun";
    if (w >= 5) {
      if (d4 === 0 && (fin === null || w < fin)) couvert = "equipe";
      if (d4 === 1) couvert = "interim";
      if (d4 === 2) couvert = "poste";
      // L'injonction de l'ARS impose le renfort à partir de la semaine 9 : en intérim, faute de mieux.
      const impose = (inspecte && w >= 9) || (relance && w > SEMAINE_DE_RELANCE);
      if (impose && (couvert === "aucun" || couvert === "poste")) couvert = "interim";
    }
    let appels: number =
      couvert === "equipe"
        ? APPELS.renfort
        : couvert === "interim"
          ? APPELS.interim
          : couvert === "poste"
            ? APPELS.posteAvance
            : APPELS.weekEnd;
    if (couvert === "equipe") renfort += RENFORT_WEEK_END;
    if (couvert === "interim") renfort += INTERIM_WEEK_END;
    cout += couvert === "equipe" ? RENFORT_WEEK_END : couvert === "interim" ? INTERIM_WEEK_END : 0;
    // Pendant les arrêts, des intérimaires qui ne connaissent pas les résidents.
    if (arrets && sanction !== null && w >= sanction + 1 && w <= sanction + 2) appels += 2;
    for (const a of actifs) appels += a.imprevu.effet.appels ?? 0;
    appels = Math.max(5, appels + n.appels);

    // Ceux qui n'attendent pas la sonnette se lèvent seuls : des chutes au lever, sans gravité
    // le plus souvent, chacune déclarée en événement indésirable.
    const chutes = 0.04 * Math.max(0, appels - 8);
    cout += chutes * COUTS.chute;

    // Le linge.
    const interne = d5 === 1 && w >= 9;
    let pieces: number = LINGE.depuis;
    if (d5 === 0 && w === 8) pieces = LINGE.depuis / 2; // Le marquage commence à faire effet.
    if (d5 === 0 && w >= 9) pieces = accepte ? LINGE.planSuivi : LINGE.planConteste;
    if (interne) pieces = LINGE.interne;
    if (d5 === 2 && w >= 8) pieces *= 1.2; // Remboursé sans discuter, le linge se déclare perdu plus vite.
    pieces *= n.linge;
    if (!interne) for (const a of actifs) pieces += a.imprevu.effet.linge ?? 0;
    const parPiece =
      d5 === 0 && w >= 9 && accepte
        ? LINGE.remboursement - LINGE.penalite
        : d5 === 2 && w >= 8
          ? LINGE.prixDuNeuf
          : LINGE.remboursement;
    let coutLinge = pieces * parPiece;
    if (d5 === 0 && w === 8) coutLinge += COUTS.marquage;
    if (interne) coutLinge += COUTS.lingerie;
    linge += coutLinge;
    cout += coutLinge;

    // Les réclamations des familles : ce qui les fait écrire, semaine après semaine.
    let r = 0.1 * Math.max(0, appels - 8) + 0.13 * pieces * (d5 === 2 && w >= 8 ? 0.5 : 1);
    r += 0.5 * chutes;
    if (!apaisee && w >= 3) r += 0.6;
    if (autres && w >= 4) r += 1;
    if (d4 === 2 && w >= 5) r += 0.8; // Goûters et couchers retardés l'après-midi.
    if (d6 === 0 && w >= 10) r *= 0.6; // Les familles ont un lieu où le dire.
    if (d6 === 1 && w >= 10) r += apaisee ? 0.3 : 0.6; // Le droit de réponse relance la polémique.
    if (fin !== null && w >= fin && w >= 10) r += 0.5; // Le renfort promis aux familles s'arrête.
    reclamations += r;
    cout += r * COUTS.reclamation;

    // La confiance des familles et des prescripteurs, et la liste d'attente qu'elle nourrit.
    confiance += 0.015 - 0.012 * r;
    if (apaisee && w === 3) confiance += 0.04;
    if (autres && w === 4) confiance -= 0.1;
    if (inspecte && w === 8) confiance -= 0.08;
    if (relance && w === 12) confiance -= 0.14; // Une visite pour un plan non tenu : tout le quartier le sait.
    if (w === 10) {
      if (d6 === 0) confiance += apaisee ? 0.09 : 0.05;
      if (d6 === 1) confiance -= apaisee ? 0.04 : 0.07;
      if (d6 === 2) confiance += 0.02;
    }
    confiance = borne(confiance, 0.3, 1);
    liste += 0.25 * (38 * confiance - liste);
    // Après une seconde visite, l'assistante sociale du CHU oriente ailleurs : des familles retirent leur demande.
    if (relance && w === SEMAINE_DE_RELANCE) liste -= 4;

    // L'équipe : absences et remplacements au-delà de l'ordinaire.
    let enPlus = 0; // en équivalents temps plein
    if (d1 === 0 && w >= 2) enPlus -= 0.004 * ETP_SOIGNANTS;
    if (d1 === 1 && w <= 4) enPlus -= 0.006 * ETP_SOIGNANTS;
    if (d4 === 2 && w >= 6) enPlus += 0.006 * ETP_SOIGNANTS; // L'après-midi à quatre, épuisant.
    if (d1 === 3 && w >= 2 && w <= 6) enPlus += 0.004 * ETP_SOIGNANTS;
    if (sanction !== null) {
      if (sanction === 1 && w === 1) enPlus += 1; // La mise à pied, remplacée.
      if (w >= sanction && w <= sanction + 3) enPlus += 0.01 * ETP_SOIGNANTS;
      if (arrets && w >= sanction + 1 && w <= sanction + 2) enPlus += 2;
    }
    if (relance && w === SEMAINE_DE_RELANCE) enPlus += 0.01 * ETP_SOIGNANTS;
    if (inspecte && (w === 7 || w === 8)) enPlus += 0.01 * ETP_SOIGNANTS;
    if ((couvert === "equipe" || couvert === "interim") && w >= 7) enPlus -= 0.004 * ETP_SOIGNANTS;
    for (const a of actifs) enPlus += a.imprevu.effet.absents ?? 0;
    const absenteisme = n.absences + enPlus / ETP_SOIGNANTS;
    const remplacement = Math.max(0, enPlus) * 5 * JOUR_REMPLACEMENT;
    remplacements += remplacement;
    cout += remplacement;
    if (depart && sanction !== null && w === sanction + 5) {
      remplacements += COUTS.depart;
      cout += COUTS.depart;
    }

    // L'inspection et ses suites.
    if (inspecte && w === 7) {
      inspectionCout += COUTS.inspection;
      cout += COUTS.inspection;
    }
    if (relance && w === SEMAINE_DE_RELANCE) {
      inspectionCout += COUTS.inspection;
      cout += COUTS.inspection;
    }
    if (relance && w === SEMAINE_DE_RELANCE + 1) {
      inspectionCout += COUTS.audit;
      cout += COUTS.audit;
    }
    if (inspecte && w === 10) {
      inspectionCout += COUTS.audit;
      cout += COUTS.audit;
    }

    if (d6 === 2 && w === 10) cout += COUTS.portesOuvertes;
    for (const a of actifs) cout += a.imprevu.effet.cout ?? 0;

    couts += cout;
    semaines.push({
      appels,
      linge: pieces,
      reclamations: r,
      absenteisme,
      liste,
      confiance,
      cout,
      couts,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const perteAdmissions = perteDAdmissions(liste);
  return {
    semaines,
    objectif: -(couts + perteAdmissions),
    couts,
    perteAdmissions,
    renfort,
    linge,
    remplacements,
    inspectionCout,
    apaisee,
    autres,
    inspection: inspecte,
    relance,
    arrets,
    depart,
    sanction,
    finDuRenfort: fin,
    prestataireAccepte: accepte,
    planLinge: d5 === 0,
    reclamations,
    listeFinale: liste,
    appelsFin: pleines.slice(9).reduce((s, x) => s + x.appels, 0) / 4,
    absenteismeMoyen: pleines.reduce((s, x) => s + x.absenteisme, 0) / SEMAINES,
    renfortTrimestre: RENFORT_TRIMESTRE / 1000,
  };
}

/** Ce qui s'est passé pendant des semaines : la famille, les autres familles, l'ARS, l'équipe, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const s = t.sanction;
  return {
    sanction: s !== null && dans(s),
    arrets: t.arrets && s !== null && dans(s + 1),
    depart: t.depart && s !== null && dans(s + 2),
    rencontre: dans(2),
    autres: t.autres && dans(4),
    decisionArs: dans(5),
    visite: t.inspection && dans(7),
    injonction: t.inspection && dans(9),
    renfortLache: t.finDuRenfort !== null && dans(t.finDuRenfort),
    relance: t.relance && dans(SEMAINE_DE_RELANCE),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureFamille {
  appels: number | null;
  linge: number | null;
  absenteisme: number | null;
  liste: number | null;
  couts: number | null;
  /** Les réclamations reçues depuis le début du trimestre. */
  reclamations: number | null;
  /** 1 : la famille s'est apaisée ; 0 : non ; null : pas encore reçue. */
  apaisee: number | null;
  /** 1 : d'autres familles ont écrit ; null : pas encore. */
  autres: number | null;
  /** 1 : l'ARS inspecte ; 0 : elle clôt ; null : pas encore décidé. */
  inspection: number | null;
}

/** Ce qu'Edmée lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureFamille {
  if (semaine === 0) {
    return {
      appels: APPELS.weekEnd,
      linge: LINGE.depuis,
      absenteisme: ABSENTEISME_BASE,
      liste: LISTE_DEPART,
      couts: 0,
      reclamations: 0,
      apaisee: null,
      autres: null,
      inspection: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const cumul = (t.semaines.slice(1, semaine + 1) as Semaine[]).reduce(
    (x, w) => x + w.reclamations,
    0,
  );
  return {
    appels: s.appels,
    linge: s.linge,
    absenteisme: s.absenteisme,
    liste: s.liste,
    couts: s.couts,
    reclamations: cumul,
    apaisee: semaine >= 2 && decisions.length >= 2 ? (t.apaisee ? 1 : 0) : null,
    autres: semaine >= 4 ? (t.autres ? 1 : 0) : null,
    inspection: semaine >= 5 && decisions.length >= 3 ? (t.inspection ? 1 : 0) : null,
  };
}
