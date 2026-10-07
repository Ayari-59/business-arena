/**
 * L'ASSISTANT D'IA QUI CHANGE LE MÉTIER — le modèle d'Atlas Conseil au deuxième trimestre.
 *
 * Atlas Conseil (190 consultants facturables) a acheté des licences d'un
 * assistant d'IA générative hébergé dans un environnement maîtrisé : les
 * données qu'on y verse ne sortent pas du cabinet. Il n'est pas encore
 * ouvert. Pendant ce temps, un consultant sur cinq se sert d'outils grand
 * public, en cachette, et un sur trois refuse d'y toucher. Treize semaines,
 * d'avril à juin, six décisions. Quatre mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LE GAIN EST RÉEL, MAIS INÉGAL. L'assistant fait aller deux fois plus
 *     vite sur les synthèses d'entretiens, un peu plus vite sur les analyses
 *     et les premières versions, presque pas sur le conseil lui-même
 *     (entretiens, ateliers, recommandations). Le gain d'un utilisateur se
 *     calcule tâche par tâche, et la relecture obligatoire en reprend un
 *     quart. L'utiliser là où il est faible coûte plus en reprises qu'il ne
 *     rapporte.
 *   · LE MODÈLE ÉCONOMIQUE DÉCIDE À QUI VA LE GAIN. En régie (au temps
 *     passé), un jour gagné est un jour qu'on ne facture plus : le gain va au
 *     client. Au forfait, le prix ne bouge pas : le jour libéré est un jour
 *     qu'on revend ailleurs, et le staffing en replace sept sur dix au
 *     deuxième trimestre, quand le carnet est plein. Sans rien changer à la
 *     manière de vendre, la productivité rapporte peu ; repenser les contrats
 *     qui se renouvellent (forfait par livrable, gain partagé) la transforme
 *     en marge. Continuer de facturer en régie les jours qu'on n'a pas passés
 *     revient à facturer une prestation non réalisée, et un client finit
 *     parfois par le voir.
 *   · L'USAGE SANS RÈGLE SE PAIE AU HASARD. Des données client versées dans
 *     un outil grand public, ou sans règle dans l'assistant du cabinet,
 *     exposent à un incident de confidentialité ; un livrable non relu
 *     expose à une erreur chez le client. Les deux sont des tirages, dont la
 *     probabilité suit les choix : interdire ne supprime pas l'usage, il le
 *     cache dans les outils qu'on ne maîtrise pas.
 *   · L'ADOPTION S'APPREND ENTRE PAIRS. La maîtrise de l'outil (la part du
 *     gain possible qu'un utilisateur obtient vraiment) monte avec des
 *     référents et des cas d'usage partagés, pas avec une obligation ni avec
 *     un module en ligne.
 *
 * L'OBJECTIF, en euros : la marge du trimestre (honoraires moins charges et
 * coûts du projet), moins le coût des incidents, plus la VALEUR DES CONTRATS
 * REPENSÉS au trimestre, estimée en semaine 13 sur leurs douze premiers mois :
 * pour chaque contrat passé au forfait, son chiffre annuel multiplié par la
 * part du temps que l'assistant fera gagner sur la mission (mesurée sur les
 * pratiques du cabinet en fin de trimestre, relecture comprise) moins la
 * concession de prix ; pour Orvanne, ce que la réponse du trimestre change à
 * douze mois de contrat. En régie, le gain va au client : la valeur repensée
 * d'un contrat resté en régie est nulle.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const CONSULTANTS = 190;
/** Le TJM moyen du cabinet, de 650 € (analyste) à 1 400 € (associé). */
export const TJM = 900;
export const OCCUPATION = 0.75;
/** Les jours ouvrés d'avril à juin : le lundi de Pâques, les 1er et 8 mai, l'Ascension, la Pentecôte. */
export const JOURS_OUVRES = [0, 5, 4, 5, 5, 4, 4, 4, 5, 4, 5, 5, 5, 5] as const;
export const JOURS_DU_TRIMESTRE = JOURS_OUVRES.reduce((s: number, j) => s + j, 0);
/** La part des jours vendus en régie, au temps passé ; le reste est au forfait. */
export const PART_REGIE = 0.4;
/** Les jours facturables prévus au trimestre, et ceux de la régie. */
export const JOURS_FACTURES = CONSULTANTS * JOURS_DU_TRIMESTRE * OCCUPATION;
export const JOURS_REGIE = JOURS_FACTURES * PART_REGIE;
export const HONORAIRES_PREVUS = JOURS_FACTURES * TJM;
/** La marge budgétée du trimestre, établie sans l'assistant. */
export const BUDGET = 650000;
/** Salaires et structure du trimestre : ils ne bougent pas quand le temps se libère. */
export const CHARGES = HONORAIRES_PREVUS - BUDGET;
/** Sur dix jours libérés, le staffing en replace sept sur des missions qui attendent. */
export const REPLACEMENT = 0.7;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des équipes sans consigne, une proposition perdue. */
export const PERTE_PAR_JOUR = 4000;

/** Le temps des missions, tâche par tâche, et ce que l'assistant fait gagner sur chacune. */
export const TACHES = [
  { id: "synthese", nom: "synthèses et comptes rendus d'entretiens", part: 0.12, gain: 0.5 },
  { id: "analyse", nom: "analyses et traitements de données", part: 0.18, gain: 0.2 },
  { id: "redaction", nom: "premières versions de livrables", part: 0.2, gain: 0.25 },
  {
    id: "conseil",
    nom: "conseil lui-même (entretiens, ateliers, recommandations)",
    part: 0.5,
    gain: 0.02,
  },
] as const;
/** Le gain possible d'un utilisateur, s'il maîtrisait tout et sans relecture : 15,6 % de son temps. */
export const GAIN_POSSIBLE = TACHES.reduce((s, t) => s + t.part * t.gain, 0);
/** La relecture obligatoire reprend un quart du gain des tâches de production. */
export const RELECTURE = 0.25;

/** La part des consultants qui se servent d'outils grand public, en cachette, en semaine 1. */
export const CACHETTE_DEPART = 0.22;

/** Les douze contrats en régie qui se renouvellent au 1er juillet, en chiffre annuel. */
export const RENOUVELLEMENTS = [
  260000, 240000, 220000, 210000, 200000, 190000, 180000, 170000, 160000, 150000, 120000, 100000,
] as const;
export const RENOUVELLEMENTS_TOTAL = RENOUVELLEMENTS.reduce((s: number, c) => s + c, 0);
/** Le forfait par livrable proposé : le budget de l'an passé, moins 3 %. */
export const CONCESSION = 0.03;
/** La chance qu'un client accepte le forfait. */
export const ACCEPTATION = 0.65;
/** Une demi-journée d'associé et une demi-journée de manager par contrat, pour préparer le forfait. */
export const AVANT_VENTE = 1400;
/** Un forfait mal cadré : un client découvre à la réunion de cadrage un périmètre plus large. */
export const MAL_CADRE = { chance: 0.25, cout: 160000 } as const;

/** Orvanne, deuxième client privé du cabinet : une régie de 600 k€ par an, renouvelée au 1er juillet. */
export const ORVANNE = {
  ca: 600000,
  tjm: 950,
  /** Ce que demande son directeur des achats. */
  baisse: 0.12,
  /** La chance qu'il parte si l'on refuse toute baisse : Kéroual Consulting lui propose −15 %. */
  depart: 0.35,
  /** Le forfait proposé sans mesure : les 12 % que le client demande, sur le budget. */
  forfaitDirect: 0.12,
  accepteDirect: 0.8,
  /** Le forfait proposé après mesure, qui partage le gain mesuré à parts égales. */
  accepteMesureFort: 0.85,
  accepteMesureFaible: 0.6,
  mesure: 2200,
} as const;
/** La deuxième année d'Orvanne : riche en entretiens de terrain, ou en ateliers d'accompagnement. */
export const TYPES_ORVANNE = [
  {
    id: "terrain",
    nom: "riche en entretiens de terrain et en synthèses",
    facteur: 1.7,
    chance: 0.5,
  },
  { id: "ateliers", nom: "riche en ateliers et en accompagnement", facteur: 0.5, chance: 0.5 },
] as const;

/** Les propositions du second semestre qui partiraient en régie, et la part qu'on gagnera. */
export const PIPELINE = 1400000;
export const TRANSFORMATION = 0.6;

/** Facturer en régie des jours qui n'ont pas été passés : la chance chaque semaine qu'un client le voie, et ce qu'il en coûte. */
export const FRAUDE = { chance: 0.045, cout: 280000 } as const;
export const CONFIDENTIALITE = { cout: 90000 } as const;
/** Un livrable faux chez le client : la chance par semaine si tout le cabinet s'en servait sans relecture. */
export const ERREUR = { chance: 0.25, plafond: 0.12, cout: 45000 } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ouverture: 0,
  regie: 1,
  adoption: 2,
  usages: 3,
  orvanne: 4,
  comite: 5,
} as const;

/** Ne rien changer, décision par décision : rien n'ouvre avant le comité de juin. */
export const NEUTRE = [0, 0, 3, 0, 1, 2] as const;

export const COUTS = {
  /** Huit référents, une demi-journée par semaine chacun, prise sur du temps facturable. */
  referents: 8 * 0.5 * TJM,
  elearning: 6000,
  audit: 8000,
  avocats: 9000,
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
  effet: { gain?: number; capacite?: number; replacement?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "panne",
    titre: "Panne de l'assistant chez l'hébergeur",
    de: "Dragan Marinescu",
    role: "Responsable de la sécurité des systèmes d'information",
    texte:
      "L'hébergeur de l'assistant a subi une panne de trois jours. Les équipes qui s'en servaient ont fini leurs synthèses à la main.",
    duree: 1,
    effet: { gain: 0.4 },
  },
  {
    id: "gel",
    titre: "Un industriel gèle sa mission",
    de: "Aïssatou Ndour",
    role: "Responsable du staffing",
    texte:
      "Un industriel de la practice supply chain gèle sa mission pour deux semaines, le temps d'un arbitrage budgétaire. Six consultants en intercontrat.",
    duree: 2,
    effet: { capacite: 0.98 },
  },
  {
    id: "marches",
    titre: "Trois marchés publics notifiés d'un coup",
    de: "Aïssatou Ndour",
    role: "Responsable du staffing",
    texte:
      "Achats Publics de l'Ouest notifie trois marchés la même semaine. Il faut staffer vite : chaque jour libéré trouve preneur.",
    duree: 2,
    effet: { replacement: 1.25 },
  },
  {
    id: "fuite",
    titre: "Fuite de données chez Kéroual Consulting",
    de: "Victoire Lanoë",
    role: "Présidente d'Atlas Conseil",
    texte:
      "La presse régionale rapporte une fuite de données clients chez Kéroual Consulting. Plusieurs clients suspendent leurs lancements le temps de poser des questions, et nous demandent nos garanties.",
    duree: 2,
    effet: { replacement: 0.85, cout: 3000 },
  },
  {
    id: "audit",
    titre: "Questionnaire de sécurité d'une banque cliente",
    de: "Dragan Marinescu",
    role: "Responsable de la sécurité des systèmes d'information",
    texte:
      "Une banque régionale cliente envoie un questionnaire de sécurité de 140 questions, dont trente sur l'IA générative. Trois jours de travail pour le remplir.",
    duree: 1,
    effet: { cout: 8000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit du replacement des jours libérés, semaine par semaine. */
  replacement: readonly number[];
  /** Les tirages des incidents, semaine par semaine : confidentialité, erreur, régie contestée. */
  uConfidentialite: readonly number[];
  uErreur: readonly number[];
  uFraude: readonly number[];
  /** La réponse de chacun des douze clients au forfait. */
  uAcceptation: readonly number[];
  uMalCadre: number;
  /** La deuxième année d'Orvanne, et la réponse de son directeur des achats. */
  typeOrvanne: number;
  uOrvanne: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000777 + 7);
  const replacement = [1];
  const uConfidentialite = [1];
  const uErreur = [1];
  const uFraude = [1];
  for (let w = 1; w <= SEMAINES; w += 1) {
    replacement.push(Math.min(1.2, Math.max(0.8, 1 + 0.07 * gauss(r))));
    uConfidentialite.push(r());
    uErreur.push(r());
    uFraude.push(r());
  }
  const uAcceptation = RENOUVELLEMENTS.map(() => r());
  const uMalCadre = r();
  const typeOrvanne = r() < TYPES_ORVANNE[0].chance ? 0 : 1;
  const uOrvanne = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    replacement,
    uConfidentialite,
    uErreur,
    uFraude,
    uAcceptation,
    uMalCadre,
    typeOrvanne,
    uOrvanne,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * LES PRATIQUES : ce que les décisions font, semaine par semaine.
 * ------------------------------------------------------------------------- */
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export interface Pratiques {
  /** L'assistant du cabinet est-il ouvert cette semaine ? */
  ouvert: boolean;
  /** La part des consultants qu'il finira par toucher, et la vitesse à laquelle on s'en approche. */
  cible: number;
  vitesse: number;
  /** La part qui se servira d'outils grand public. */
  cibleCachette: number;
  relecture: boolean;
  /** Des règles sur les données client (pas d'outil grand public, données sensibles anonymisées). */
  regles: boolean;
  /** Ce que la relecture garde du gain des tâches de production. */
  garde: number;
  /** Ce que la relecture laisse passer d'erreurs. */
  filtre: number;
  /** Le multiplicateur du risque d'erreur selon les usages. */
  risque: number;
  /** Le gain de chaque tâche, en part de celui que l'outil permet. */
  facteurs: readonly [number, number, number, number];
  /** Ce que les pratiques ajoutent ou retirent à la maîtrise. */
  maitrise: number;
}

/** Les pratiques de la semaine w, lues dans les décisions déjà en vigueur. */
export function pratiques(
  chemin: readonly number[],
  w: number,
  maitriseAcquise: number,
): Pratiques {
  const [d1, , d3, d4, , d6] = chemin;
  const p: Pratiques = {
    ouvert: false,
    cible: 0,
    vitesse: 0.3,
    cibleCachette: Math.min(0.3, CACHETTE_DEPART + 0.006 * (w - 1)),
    relecture: true,
    regles: true,
    garde: 1 - RELECTURE,
    filtre: 0.2,
    risque: 1,
    facteurs: [1, 1, 1, 1],
    maitrise: maitriseAcquise,
  };
  // Semaine 1 : l'ouverture.
  if (d1 === 1) Object.assign(p, { ouvert: true, cible: 0.6, vitesse: 0.35, cibleCachette: 0.06 });
  if (d1 === 1) Object.assign(p, { relecture: false, regles: false });
  if (d1 === 2) Object.assign(p, { ouvert: true, cible: 0.42, vitesse: 0.25, cibleCachette: 0.03 });
  if (d1 === 3) Object.assign(p, { ouvert: true, cible: 0.105, vitesse: 0.6, cibleCachette: 0.17 });
  // Semaine 5 : l'adoption.
  if (w >= 5 && p.ouvert) {
    if (d3 === 0) p.cible = d1 === 3 ? 0.4 : p.cible + 0.18;
    if (d3 === 1) p.cible += 0.04;
    if (d3 === 2) p.cible = d1 === 3 ? 0.3 : p.cible + 0.12;
  }
  if (w >= 5) {
    if (d3 === 0) p.risque *= 1.4;
    if (d3 === 2) {
      p.risque *= 0.7;
      p.cibleCachette *= 0.6;
    }
  }
  // Semaine 7 : les usages.
  if (w >= 7) {
    // Garder le cap : l'assistant rédige aussi les recommandations, qu'il faut ensuite réécrire.
    if (d4 === 0 || d4 === 2) {
      p.risque *= 2;
      p.facteurs = [1, 1, 1, -1.5];
    }
    if (d4 === 1) {
      p.risque *= 0.4;
      p.facteurs = [1, 0.75, 1, 0];
    }
    if (d4 === 2 && p.relecture) {
      p.garde = 0.9;
      p.filtre = 0.6;
    }
    if (d4 === 3) {
      if (w <= 8) p.ouvert = false;
      p.cible *= 0.8;
      p.cibleCachette += 0.08;
    }
  }
  // Semaine 11 : ce que le comité de juin valide.
  if (w >= 11) {
    if (d1 === 0) {
      if (d6 === 0) Object.assign(p, { ouvert: true, cible: 0.12, vitesse: 0.3 });
      if (d6 === 1) Object.assign(p, { ouvert: true, cible: d3 === 2 ? 0.4 : 0.3, vitesse: 0.3 });
      if (d6 === 3) Object.assign(p, { ouvert: true, cible: 0.4, vitesse: 0.3 });
    } else {
      if (d6 === 0) p.cible *= 0.6;
      if (d6 === 1) p.cible += 0.05;
      if (d6 === 3) p.cible += 0.1;
    }
    if (d6 === 0) p.cibleCachette += 0.06;
    if (d6 === 1) p.cibleCachette *= 0.8;
    if (d6 === 1 || d6 === 0) p.cibleCachette = Math.max(0.02, p.cibleCachette);
    if (d6 === 3) Object.assign(p, { relecture: false, regles: false });
  }
  if (!p.relecture) {
    p.garde = 1;
    p.filtre = 1;
  }
  return p;
}

/** La maîtrise de départ : la part du gain possible qu'un utilisateur obtient vraiment. */
export function maitriseDeDepart(chemin: readonly number[]): number {
  const d1 = chemin[D.ouverture];
  return d1 === 1 ? 0.4 : d1 === 3 ? 0.7 : 0.6;
}

/** La maîtrise de la semaine w : les pairs la font monter, l'obligation la fait baisser. */
export function maitrise(chemin: readonly number[], w: number): number {
  const [, , d3, d4] = chemin;
  let m = maitriseDeDepart(chemin);
  if (w >= 5) {
    if (d3 === 0) m -= 0.05;
    if (d3 === 1) m += 0.04;
    if (d3 === 2) m += Math.min(0.25, 0.035 * (w - 4));
  }
  if (w >= 7) {
    if (d4 === 0 || d4 === 2) m -= 0.03;
    if (d4 === 1) m += 0.08;
  }
  return borne(m, 0.3, 1);
}

/** Le gain d'un utilisateur, en part de son temps, avec les pratiques de la semaine. */
export function gainUtilisateur(p: Pratiques, m: number): number {
  return (
    m *
    TACHES.reduce(
      (s, t, k) => s + t.part * t.gain * p.facteurs[k]! * (t.id === "conseil" ? 1 : p.garde),
      0,
    )
  );
}

/**
 * Le gain qu'on peut promettre sur un contrat repensé : celui d'une équipe qui suit les
 * pratiques du cabinet, RELECTURE COMPRISE (un forfait se chiffre avec la relecture), rapporté
 * à la part des consultants qui s'en servent vraiment.
 */
export function gainContractuel(chemin: readonly number[], w: number, adoption: number): number {
  const p = pratiques(chemin, w, 0);
  const standard: Pratiques = { ...p, garde: 1 - RELECTURE };
  const usage = p.ouvert ? Math.min(1, adoption / 0.5) : 0;
  return gainUtilisateur(standard, maitrise(chemin, w)) * usage;
}

/** Ce que coûterait en régie, sur le trimestre, des synthèses deux fois plus rapides : la prévision. */
export const BAISSE_REGIE_SYNTHESES = JOURS_REGIE * TACHES[0].part * TACHES[0].gain * TJM;

export type Semaine = {
  /** La part des consultants qui se servent de l'assistant du cabinet. */
  adoption: number;
  /** La part qui se sert d'outils grand public, en cachette. */
  cachette: number;
  /** Les jours gagnés cette semaine par l'assistant. */
  gagnes: number;
  gagnesCumul: number;
  /** Le chiffre d'affaires de régie que les jours gagnés ont fait disparaître, depuis avril. */
  regiePerdue: number;
  /** La marge à date, incidents déduits. */
  marge: number;
  /** Ce que la semaine a coûté au projet et en incidents. */
  cout: number;
  /** Le gain d'un utilisateur, en part de son temps. */
  gain: number;
  maitrise: number;
};

export interface Orvanne {
  type: number;
  /** Le gain sur la mission, tel qu'une mesure le donne en semaine 8. */
  gain: number;
  issue: "accepte" | "reste" | "part" | "baisse";
  valeur: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Marge du trimestre, moins les incidents, plus la valeur des contrats repensés. */
  objectif: number;
  honoraires: number;
  marge: number;
  incidents: number;
  /** La valeur des contrats repensés : forfaits du 1er juillet, Orvanne, propositions du semestre. */
  repenses: number;
  confidentialite: number | null;
  /** La première erreur dans un livrable, et leur nombre. */
  erreur: number | null;
  erreurs: number;
  fraude: number | null;
  /** Les contrats passés au forfait sur les douze, et leur chiffre annuel. */
  acceptes: number;
  caAcceptes: number;
  malCadre: boolean;
  /** Le gain promis sur un contrat repensé, en fin de trimestre. */
  gainContrat: number;
  orvanne: Orvanne;
  valeurForfaits: number;
  valeurPipeline: number;
  adoptionFinale: number;
  cachetteFinale: number;
  joursGagnes: number;
  regiePerdue: number;
}

/** Le gain qu'une mesure donnerait sur la mission Orvanne, en semaine 8. */
export function gainOrvanne(chemin: readonly number[], graine: number, adoption8: number): number {
  return gainContractuel(chemin, 8, adoption8) * TYPES_ORVANNE[hasard(graine).typeOrvanne]!.facteur;
}

/**
 * Ce que coûte le départ d'Orvanne sur douze mois : ses jours retournent au staffing, sept sur dix
 * trouvent une autre mission, au TJM moyen du cabinet.
 */
export const perteSiDepart = (gain: number) =>
  ORVANNE.ca * (1 - gain) * (1 - (REPLACEMENT * TJM) / ORVANNE.tjm);

/** Ce que la réponse à Orvanne vaut sur douze mois, selon l'option, le gain et le tirage. */
export function reponseOrvanne(choix: number, graine: number, gain: number): Orvanne {
  const h = hasard(graine);
  const type = h.typeOrvanne;
  const u = h.uOrvanne;
  const c = ORVANNE.ca;
  if (choix === 0) return { type, gain, issue: "baisse", valeur: -ORVANNE.baisse * c * (1 - gain) };
  if (choix === 1) {
    if (u < ORVANNE.depart) return { type, gain, issue: "part", valeur: -perteSiDepart(gain) };
    return { type, gain, issue: "reste", valeur: 0 };
  }
  if (choix === 2) {
    const chance = type === 0 ? ORVANNE.accepteMesureFort : ORVANNE.accepteMesureFaible;
    return u < chance
      ? { type, gain, issue: "accepte", valeur: (c * gain) / 2 }
      : { type, gain, issue: "reste", valeur: 0 };
  }
  if (u < ORVANNE.accepteDirect)
    return { type, gain, issue: "accepte", valeur: c * (gain - ORVANNE.forfaitDirect) };
  // Un forfait sur un périmètre que son comité n'a pas arrêté : la moitié du temps, il consulte.
  return u < (1 + ORVANNE.accepteDirect) / 2
    ? { type, gain, issue: "reste", valeur: 0 }
    : { type, gain, issue: "part", valeur: -perteSiDepart(gain) };
}

/** Les clients qui acceptent le forfait : ils ne dépendent que du tirage. */
export const acceptations = (graine: number) =>
  RENOUVELLEMENTS.map((_, i) => hasard(graine).uAcceptation[i]! < ACCEPTATION);

const caches = new Map<string, Trimestre>();

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const cle = `${chemin.join(",")}|${graine}|${jours}`;
  const deja = caches.get(cle);
  if (deja) return deja;
  const h = hasard(graine);
  const [, d2, d3, d4, d5, d6] = chemin;
  const semaines: (Semaine | null)[] = [null];
  let adoption = 0;
  let cachette = CACHETTE_DEPART;
  let gagnesCumul = 0;
  let regiePerdue = 0;
  let honoraires = 0;
  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let incidents = 0;
  let confidentialite: number | null = null;
  let erreur: number | null = null;
  let erreurs = 0;
  let fraude: number | null = null;
  let adoption8 = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const m = maitrise(chemin, w);
    const p = pratiques(chemin, w, m);
    let cout = w === 1 ? couts : 0;

    // Qui s'en sert : l'assistant du cabinet, et les outils grand public.
    adoption = p.ouvert ? adoption + p.vitesse * (p.cible - adoption) : adoption * 0.3;
    cachette += 0.5 * (p.cibleCachette - cachette);
    if (w === 8) adoption8 = adoption;

    // Ce que l'assistant fait gagner, et ce que la facturation en fait.
    let capacite = 1;
    let effetGain = 1;
    let replacement = REPLACEMENT * h.replacement[w]!;
    for (const a of actifs) {
      capacite *= a.imprevu.effet.capacite ?? 1;
      effetGain *= a.imprevu.effet.gain ?? 1;
      replacement *= a.imprevu.effet.replacement ?? 1;
    }
    replacement = Math.min(0.9, replacement);
    const facturables = CONSULTANTS * JOURS_OUVRES[w]! * OCCUPATION * capacite;
    const gain = p.ouvert ? gainUtilisateur(p, m) : 0;
    const gagnes = facturables * adoption * gain * effetGain;
    const enRegie = gagnes * PART_REGIE;
    // Facturer quand même les jours prévus : tant que personne ne l'a vu.
    const facturePrevu = d2 === 1 && w >= 3 && fraude === null;
    const perdu = facturePrevu ? 0 : enRegie * TJM;
    regiePerdue += perdu;
    gagnesCumul += gagnes;
    const ca = facturables * TJM - perdu + gagnes * replacement * TJM;
    honoraires += ca;

    // Ce que le projet coûte.
    if (d3 === 2 && w >= 5) cout += COUTS.referents;
    if (d3 === 1 && w === 5) cout += COUTS.elearning;
    if (d2 === 2 && w === 4) cout += AVANT_VENTE * RENOUVELLEMENTS.length;
    if (d4 === 3 && w === 7) cout += COUTS.audit;
    if (d5 === 2 && w === 9) cout += ORVANNE.mesure;
    if (d6 === 0 && w === 11) cout += COUTS.avocats;
    for (const a of actifs) if (a.semaine === w) cout += a.imprevu.effet.cout ?? 0;
    couts += w === 1 ? 0 : cout;

    // Les incidents : des tirages, dont la probabilité suit les usages.
    let incident = 0;
    const pConf = 0.15 * cachette + adoption * (p.regles ? 0.004 : 0.04);
    if (confidentialite === null && h.uConfidentialite[w]! < pConf) {
      confidentialite = w;
      incident += CONFIDENTIALITE.cout;
    }
    const pErr = Math.min(
      ERREUR.plafond,
      adoption * ERREUR.chance * p.filtre * p.risque + cachette * 0.02,
    );
    // Une erreur peut en suivre une autre : chaque semaine est un tirage.
    if (h.uErreur[w]! < pErr) {
      erreur ??= w;
      erreurs += 1;
      incident += ERREUR.cout;
    }
    if (facturePrevu && w >= 4 && h.uFraude[w]! < FRAUDE.chance) {
      fraude = w;
      incident += FRAUDE.cout;
    }
    incidents += incident;

    const charges = (CHARGES * w) / SEMAINES;
    semaines.push({
      adoption,
      cachette,
      gagnes,
      gagnesCumul,
      regiePerdue,
      marge: honoraires - charges - couts - incidents,
      cout: cout + incident,
      gain,
      maitrise: m,
    });
  }

  // La valeur des contrats repensés, estimée en semaine 13.
  const gainContrat = gainContractuel(chemin, SEMAINES, adoption);
  const ok = acceptations(graine);
  const acceptes = d2 === 2 ? ok.filter(Boolean).length : 0;
  const caAcceptes =
    d2 === 2 ? RENOUVELLEMENTS.reduce((s: number, c, i) => s + (ok[i] ? c : 0), 0) : 0;
  const malCadre = acceptes > 0 && h.uMalCadre < MAL_CADRE.chance;
  const valeurForfaits = caAcceptes * (gainContrat - CONCESSION) - (malCadre ? MAL_CADRE.cout : 0);
  const orvanne = reponseOrvanne(d5!, graine, gainOrvanne(chemin, graine, adoption8));
  const valeurPipeline = d6 === 1 ? PIPELINE * TRANSFORMATION * (gainContrat - CONCESSION) : 0;
  const repenses = valeurForfaits + orvanne.valeur + valeurPipeline;

  const marge = honoraires - CHARGES - couts;
  const fin = semaines[SEMAINES]!;
  const t: Trimestre = {
    semaines,
    objectif: marge - incidents + repenses,
    honoraires,
    marge,
    incidents,
    repenses,
    confidentialite,
    erreur,
    erreurs,
    fraude,
    acceptes,
    caAcceptes,
    malCadre,
    gainContrat,
    orvanne,
    valeurForfaits,
    valeurPipeline,
    adoptionFinale: fin.adoption,
    cachetteFinale: fin.cachette,
    joursGagnes: gagnesCumul,
    regiePerdue,
  };
  if (caches.size > 20000) caches.clear();
  caches.set(cle, t);
  return t;
}

/** Ce qui s'est passé pendant des semaines : incidents, réponses des clients, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number | null) => w !== null && w >= de && w <= a;
  return {
    confidentialite: dans(t.confidentialite),
    erreur: dans(t.erreur),
    fraude: dans(t.fraude),
    forfaits: chemin[D.regie] === 2 && dans(6),
    malCadre: t.malCadre && dans(9),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureIA {
  adoption: number | null;
  cachette: number | null;
  gagnes: number | null;
  regiePerdue: number | null;
  marge: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  gain: number | null;
  gainContrat: number | null;
}

/** Ce qu'Anouchka lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureIA {
  if (semaine === 0) {
    return {
      adoption: 0,
      cachette: CACHETTE_DEPART,
      gagnes: 0,
      regiePerdue: 0,
      marge: 0,
      budgetADate: 0,
      gain: 0,
      gainContrat: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    adoption: s.adoption,
    cachette: s.cachette,
    gagnes: s.gagnesCumul,
    regiePerdue: s.regiePerdue,
    marge: s.marge,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    gain: s.gain,
    gainContrat: gainContractuel(chemin, semaine, s.adoption),
  };
}
