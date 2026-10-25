/**
 * LE RÉPIT À CRÉER : le modèle d'un projet d'accueil de répit pour les
 * aidants, à l'Association Solvanne.
 *
 * Alix Fournier fait des soins à domicile pour Solvanne, à Dijon. Chez les
 * familles, Alix voit des aidants épuisés : un conjoint, une fille, qui ne
 * prennent jamais une demi-journée pour eux. Le projet : un accueil de répit,
 * où la personne aidée passe une demi-journée pendant que l'aidant souffle.
 * On joue la personne qui porte le projet, de l'intention à l'ouverture, en
 * treize semaines et six décisions. Quatre mécanismes à découvrir :
 *
 *   · UN BESOIN SE VÉRIFIE CHEZ CEUX QUI L'ONT. Un sondage en ligne dit oui à
 *     tout ; quinze familles rencontrées disent quels jours, à quelle heure,
 *     et avec quel transport elles viendraient. Ce qui vient, c'est ce qu'on a
 *     compris.
 *   · LA FORME DÉCIDE DU DÉLAI. Un service de Solvanne s'appuie sur ce qui
 *     existe : assurance, comptabilité, salariés. Une association nouvelle ou
 *     une coopérative demandent des statuts, des assemblées et des semaines.
 *     Sans forme du tout, ni assurance ni subvention.
 *   · ON N'ENTREPREND PAS SEUL. La mairie prête une salle, des bénévoles
 *     formés ouvrent des demi-journées, un financeur convaincu par le besoin
 *     des familles paie le démarrage.
 *   · UN MODÈLE ÉCONOMIQUE SE CALCULE. Une petite participation des familles,
 *     une subvention et un mécène local couvrent les coûts ; la gratuité
 *     inquiète les financeurs, un prix trop haut vide l'accueil, un seul
 *     mécène rend le projet fragile. Et l'an prochain, la subvention ne
 *     revient que si l'on sait montrer l'utilité de l'accueil.
 *
 * Le trimestre est jugé en euros : la valeur des heures de répit offertes
 * (comptée comme une heure d'aide à domicile), plus ce qui reste dans la
 * caisse du projet, plus la subvention de l'an prochain si elle est obtenue.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LE BESOIN.
 * ------------------------------------------------------------------------- */
/** Les familles que le service d'aide à domicile de Solvanne suit dans le quartier. */
export const FAMILLES_SUIVIES = 120;
/** Environ une sur quatre a un aidant qui dit être épuisé. */
export const PART_D_AIDANTS_EPUISES = 0.25;
/** Une demi-journée d'accueil dure quatre heures : quatre heures de répit pour l'aidant. */
export const HEURES_PAR_DEMI_JOURNEE = 4;
/** Solvanne compte une heure de répit comme une heure d'aide à domicile. */
export const VALEUR_HEURE = 30;
/** Une demi-journée accueille six personnes au plus. */
export const PLACES_PAR_DEMI_JOURNEE = 6;

/** Ce que chaque manière de vérifier le besoin fait : la part des aidants épuisés qui viennent chaque semaine. */
export const BESOIN = [
  /** Un sondage en ligne sur la page de Solvanne : tout le monde dit oui, personne ne dit quand. */
  { venue: 0.35 },
  /** Quinze familles rencontrées chez elles : les bons jours, les bons horaires, le transport. */
  { venue: 0.6 },
  /** L'avis de la directrice, qui connaît bien le quartier. */
  { venue: 0.4 },
  /** Ouvrir sans vérifier : le besoin paraît évident. */
  { venue: 0.3 },
] as const;

/* ---------------------------------------------------------------------------
 * LA FORME DU PROJET.
 * ------------------------------------------------------------------------- */
/** Ce que chaque forme permet : la première semaine où l'on peut ouvrir, ce qu'elle coûte, l'assurance. */
export const FORME = [
  /** Un service de Solvanne : son assurance, sa comptabilité, ses salariés. */
  { disponible: 8, cout: 0, assuree: true, apport: 0 },
  /** Une association nouvelle : statuts, assemblée, déclaration, compte en banque, assurance. */
  { disponible: 12, cout: 400, assuree: true, apport: 0 },
  /** Une coopérative avec la commune : des réunions, un vote du conseil municipal, puis un apport. */
  { disponible: 13, cout: 600, assuree: true, apport: 2000 },
  /** Sans forme, entre amis : on commence tout de suite, sans assurance ni compte. */
  { disponible: 6, cout: 0, assuree: false, apport: 0 },
] as const;

/* ---------------------------------------------------------------------------
 * LES ACTEURS.
 * ------------------------------------------------------------------------- */
/** La subvention de démarrage d'un financeur public, versée en semaine 8 si elle est accordée. */
export const SUBVENTION = 6000;
export const SEMAINE_SUBVENTION = 8;
/** La salle, quand la mairie ne la prête pas. */
export const LOYER_SALLE = 120;

/** Ce que chaque manière de réunir les acteurs fait : places par semaine, chance de subvention, salle, risque. */
export const ACTEURS = [
  /** Écrire aux financeurs pour demander une subvention, sans les rencontrer. */
  { places: 12, subvention: 0.3, sallePretee: false, risque: 0 },
  /** Tout faire soi-même pour aller plus vite. */
  { places: 8, subvention: 0.15, sallePretee: false, risque: 0 },
  /** Présenter ensemble le projet à la mairie, aux bénévoles et aux financeurs. */
  { places: 24, subvention: 0.75, sallePretee: true, risque: 0 },
  /** Recruter des bénévoles sur les réseaux sociaux, sans les former. */
  { places: 20, subvention: 0.3, sallePretee: false, risque: 0.25 },
] as const;

/* ---------------------------------------------------------------------------
 * LE CALENDRIER.
 * ------------------------------------------------------------------------- */
/** Ce que chaque calendrier fait : la semaine d'ouverture prévue, la qualité des premières semaines, ensuite, et le risque. */
export const CALENDRIER = [
  /** Ouvrir tout de suite, et régler les détails ensuite. */
  { prevue: 7, debuts: 0.4, ensuite: 0.8, risque: 0.2 },
  /** Attendre que tout soit parfait. */
  { prevue: 13, debuts: 1, ensuite: 1, risque: 0 },
  /** Fixer une date sans prévenir les soignants, qui orientent les familles. */
  { prevue: 9, debuts: 0.5, ensuite: 0.5, risque: 0 },
  /** Partir de la date d'ouverture et remonter : salle, assurance, bénévoles formés, familles prévenues. */
  { prevue: 9, debuts: 1, ensuite: 1, risque: 0 },
] as const;
/** Les trois premières semaines d'ouverture. */
export const SEMAINES_DE_DEBUT = 3;

/* ---------------------------------------------------------------------------
 * LE MODÈLE ÉCONOMIQUE.
 * ------------------------------------------------------------------------- */
/** Une demi-journée d'animation : une salariée de Solvanne, quatre heures et la préparation. */
export const COUT_DEMI_JOURNEE = 90;
/** Le goûter et le petit matériel, par personne accueillie. */
export const COUT_PAR_PERSONNE = 3;
/** Le mécène local : une boulangerie et une pharmacie du quartier. */
export const MECENE_LOCAL = 1500;
export const SEMAINE_MECENE = 9;
/** Un seul gros mécène : la grande surface du quartier, en deux versements. */
export const GRAND_MECENE = 2000;
export const SEMAINE_RETRAIT = 11;
/** Une fois sur deux, la grande surface change de priorité et se retire. */
export const CHANCE_RETRAIT = 0.5;

/** Ce que chaque modèle fait : venue, participation par demi-journée, mécène, et chance de renouvellement de la subvention. */
export const MODELE = [
  /** Gratuit pour tous, payé par les subventions : des places réservées et pas honorées. */
  { venue: 0.92, participation: 0, mecene: "local", renouvellement: 0.7 },
  /** Une participation de 5 € par demi-journée, une subvention et un mécène local : le seuil est calculé. */
  { venue: 1, participation: 5, mecene: "local", renouvellement: 1 },
  /** Un prix qui couvre tous les coûts : 18 € la demi-journée. */
  { venue: 0.45, participation: 18, mecene: "aucun", renouvellement: 1 },
  /** Tout financer par un seul mécène, la grande surface du quartier. */
  { venue: 1, participation: 5, mecene: "unique", renouvellement: 0.8 },
] as const;

/* ---------------------------------------------------------------------------
 * L'UTILITÉ SOCIALE.
 * ------------------------------------------------------------------------- */
/** La subvention de l'an prochain, si le financeur est convaincu de l'utilité de l'accueil. */
export const SUBVENTION_SUIVANTE = 12000;
/** Ce que chaque manière de mesurer l'utilité fait : la chance que la subvention revienne, et ce qu'elle coûte. */
export const UTILITE = [
  /** Compter les passages, c'est suffisant. */
  { chance: 0.3, cout: 0 },
  /** Raconter de belles histoires de familles dans le journal local. */
  { chance: 0.4, cout: 0 },
  /** Suivre trois indicateurs simples : heures de répit, familles aidées, fatigue des aidants avant et après. */
  { chance: 0.85, cout: 0 },
  /** Payer un cabinet pour une étude d'impact. */
  { chance: 0.9, cout: 4000 },
] as const;

/* ---------------------------------------------------------------------------
 * LES INCIDENTS.
 * ------------------------------------------------------------------------- */
/** Une chute, une personne qui se perd : l'accueil ferme deux semaines, et il faut réparer. */
export const COUT_INCIDENT = 3000;
/** Sans assurance, tout est à la charge du projet. */
export const COUT_INCIDENT_SANS_ASSURANCE = 5000;
export const RISQUE_SANS_ASSURANCE = 0.3;
export const SEMAINES_DE_FERMETURE = 2;

/** L'enveloppe de démarrage que Solvanne confie au projet. */
export const ENVELOPPE = 3000;
/** Les familles accueillies par semaine visées, une fois l'accueil ouvert. */
export const OBJECTIF_FAMILLES = 15;
/** La semaine d'ouverture visée : avant les vacances des aidants. */
export const OUVERTURE_VISEE = 9;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des heures de préparation perdues. */
export const PERTE_PAR_JOUR = 300;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  besoin: 0,
  forme: 1,
  acteurs: 2,
  calendrier: 3,
  modele: 4,
  utilite: 5,
} as const;

export const O = {
  besoin: { sondage: 0, rencontrer: 1, directrice: 2, sansVerifier: 3 },
  forme: { service: 0, association: 1, cooperative: 2, sansForme: 3 },
  acteurs: { ecrire: 0, seul: 1, reunir: 2, reseaux: 3 },
  calendrier: {
    toutDeSuite: 0,
    parfait: 1,
    sansSoignants: 2,
    retroplanning: 3,
  },
  modele: { gratuit: 0, participation: 1, prixFort: 2, grandMecene: 3 },
  utilite: { passages: 0, histoires: 1, indicateurs: 2, cabinet: 3 },
} as const;

/** Ne rien préparer, décision par décision. */
export const NEUTRE = [3, 3, 1, 0, 0, 0] as const;

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
    /** Multiplie les familles qui viennent. */
    venue?: number;
    /** Ajoute un coût, une fois. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Service d'aide à domicile",
    role: "Solvanne",
    texte:
      "La grippe touche le quartier : beaucoup de personnes aidées restent chez elles cette semaine.",
    duree: 1,
    effet: { venue: 0.5 },
  },
  {
    id: "article",
    titre: "Un article dans le journal",
    de: "Le Bien Public",
    role: "Journal local",
    texte:
      "Le journal local parle du projet : des familles appellent pour s'inscrire.",
    duree: 2,
    effet: { venue: 1.2 },
  },
  {
    id: "chauffage",
    titre: "Panne de chauffage",
    de: "Mairie de quartier",
    role: "Services techniques",
    texte:
      "Le chauffage de la salle tombe en panne : il faut louer des radiateurs.",
    duree: 1,
    effet: { cout: 400 },
  },
  {
    id: "neige",
    titre: "Chutes de neige",
    de: "Service d'aide à domicile",
    role: "Solvanne",
    texte: "Deux jours de neige : les familles ne peuvent pas se déplacer.",
    duree: 1,
    effet: { venue: 0.6 },
  },
  {
    id: "minibus",
    titre: "Le minibus prêté",
    de: "Club des aînés",
    role: "Quartier des Grésilles",
    texte:
      "Le club des aînés prête son minibus deux semaines : les familles sans voiture peuvent venir.",
    duree: 2,
    effet: { venue: 1.15 },
  },
];

/** Un ou deux imprévus par trimestre, à égalité de chances, entre la semaine 2 et la semaine 11. */
export const CHANCE_DEUX_IMPREVUS = 0.5;
export const PREMIERE_SEMAINE_IMPREVU = 2;
export const SEMAINES_POSSIBLES_IMPREVU = 10;

/** Le bruit : la part d'aidants épuisés varie de 10 % autour d'un quart, la venue de 10 % chaque semaine. */
export const BRUIT = {
  aidants: { ecart: 0.1, min: 0.8, max: 1.2 },
  venue: { ecart: 0.1, min: 0.75, max: 1.25 },
} as const;
const bruite = (b: { ecart: number; min: number; max: number }, z: number) =>
  Math.min(b.max, Math.max(b.min, 1 + b.ecart * z));

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les aidants épuisés parmi les familles suivies. */
  aidants: number;
  venue: readonly number[];
  uSubvention: number;
  uIncident: number;
  uRetrait: number;
  uRenouvellement: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 70001 + 53);
  const aidants = Math.round(
    FAMILLES_SUIVIES * PART_D_AIDANTS_EPUISES * bruite(BRUIT.aidants, gauss(r)),
  );
  const venue = [0];
  for (let i = 1; i <= SEMAINES; i += 1)
    venue.push(bruite(BRUIT.venue, gauss(r)));
  const uSubvention = r();
  const uIncident = r();
  const uRetrait = r();
  const uRenouvellement = r();
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
  const h = {
    aidants,
    venue,
    uSubvention,
    uIncident,
    uRetrait,
    uRenouvellement,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** La semaine d'ouverture : la date prévue, pas avant que la forme le permette. */
export const ouverture = (chemin: readonly number[]) =>
  Math.max(
    CALENDRIER[chemin[D.calendrier] as 0 | 1 | 2 | 3].prevue,
    FORME[chemin[D.forme] as 0 | 1 | 2 | 3].disponible,
  );

/** La subvention de démarrage est accordée : il faut une forme, et des financeurs convaincus. */
export const subventionAccordee = (chemin: readonly number[], graine: number) =>
  FORME[chemin[D.forme] as 0 | 1 | 2 | 3].assuree &&
  hasard(graine).uSubvention <
    ACTEURS[chemin[D.acteurs] as 0 | 1 | 2 | 3].subvention;

/** La chance d'un incident : sans assurance, avec des bénévoles non formés, ou en ouvrant sans préparer. */
export function risqueIncident(chemin: readonly number[]): number {
  const forme = FORME[chemin[D.forme] as 0 | 1 | 2 | 3];
  return Math.max(
    forme.assuree ? 0 : RISQUE_SANS_ASSURANCE,
    ACTEURS[chemin[D.acteurs] as 0 | 1 | 2 | 3].risque,
    CALENDRIER[chemin[D.calendrier] as 0 | 1 | 2 | 3].risque,
  );
}
export const incident = (chemin: readonly number[], graine: number) =>
  ouverture(chemin) <= SEMAINES &&
  hasard(graine).uIncident < risqueIncident(chemin);

/** La grande surface se retire en semaine 11 : l'accueil ferme. */
export const meceneRetire = (chemin: readonly number[], graine: number) =>
  chemin[D.modele] === O.modele.grandMecene &&
  hasard(graine).uRetrait < CHANCE_RETRAIT;

/** La subvention de l'an prochain revient. */
export const subventionRenouvelee = (
  chemin: readonly number[],
  graine: number,
) =>
  hasard(graine).uRenouvellement <
  UTILITE[chemin[D.utilite] as 0 | 1 | 2 | 3].chance *
    MODELE[chemin[D.modele] as 0 | 1 | 2 | 3].renouvellement;

export type Semaine = {
  /** Les personnes accueillies dans la semaine (une demi-journée chacune). */
  familles: number;
  /** Les heures de répit offertes depuis le début. */
  heures: number;
  /** L'argent dans la caisse du projet. */
  caisse: number;
  /** Les places ouvertes chaque semaine. */
  places: number;
  cout: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée : heures de répit, ce que la caisse a gagné ou perdu, et la subvention de l'an prochain. */
  objectif: number;
  aidants: number;
  ouverture: number;
  heures: number;
  caisse: number;
  famillesMoyennes: number;
  subvention: boolean;
  renouvelee: boolean;
  incident: boolean;
  meceneRetire: boolean;
}

export function simuler(
  chemin: readonly number[],
  graine: number,
  jours = 0,
): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as readonly number[];
  const besoin = BESOIN[d1 as 0 | 1 | 2 | 3];
  const forme = FORME[d2 as 0 | 1 | 2 | 3];
  const acteurs = ACTEURS[d3 as 0 | 1 | 2 | 3];
  const calendrier = CALENDRIER[d4 as 0 | 1 | 2 | 3];
  const modele = MODELE[d5 as 0 | 1 | 2 | 3];
  const utilite = UTILITE[d6 as 0 | 1 | 2 | 3];
  const ouvre = ouverture(chemin);
  const accordee = subventionAccordee(chemin, graine);
  const accident = incident(chemin, graine);
  const retire = meceneRetire(chemin, graine);
  const renouvelee = subventionRenouvelee(chemin, graine);

  const semaines: (Semaine | null)[] = [null];
  let caisse =
    ENVELOPPE - Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let heures = 0;
  let famillesCumulees = 0;
  let semainesOuvertes = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter(
      (i) => w >= i.semaine && w < i.semaine + i.imprevu.duree,
    );
    const avant = caisse;
    if (w === DEBUT[D.forme]) caisse -= forme.cout;
    if (w === SEMAINES) caisse += forme.apport;
    if (accordee && w === SEMAINE_SUBVENTION) caisse += SUBVENTION;
    if (w === SEMAINE_MECENE && modele.mecene === "local")
      caisse += MECENE_LOCAL;
    if (modele.mecene === "unique") {
      if (w === SEMAINE_MECENE) caisse += GRAND_MECENE;
      if (w === SEMAINE_RETRAIT && !retire) caisse += GRAND_MECENE;
    }
    if (w === DEBUT[D.utilite]) caisse -= utilite.cout;
    for (const a of actifs) caisse -= a.imprevu.effet.cout ?? 0;

    // L'accueil est-il ouvert cette semaine ?
    const ferme =
      (accident && w > ouvre && w <= ouvre + SEMAINES_DE_FERMETURE) ||
      (retire && w >= SEMAINE_RETRAIT);
    const ouvert = w >= ouvre && !ferme;
    let familles = 0;
    let places = 0;
    if (ouvert) {
      places = acteurs.places;
      const qualite =
        w < ouvre + SEMAINES_DE_DEBUT ? calendrier.debuts : calendrier.ensuite;
      let venue = h.aidants * besoin.venue * qualite * h.venue[w]!;
      if (w >= DEBUT[D.modele]) venue *= modele.venue;
      for (const a of actifs) venue *= a.imprevu.effet.venue ?? 1;
      familles = Math.min(places, venue);
      const participation = w >= DEBUT[D.modele] ? modele.participation : 0;
      caisse += familles * (participation - COUT_PAR_PERSONNE);
      caisse -= (places / PLACES_PAR_DEMI_JOURNEE) * COUT_DEMI_JOURNEE;
      if (!acteurs.sallePretee) caisse -= LOYER_SALLE;
      heures += familles * HEURES_PAR_DEMI_JOURNEE;
      famillesCumulees += familles;
      semainesOuvertes += 1;
    }
    if (accident && w === ouvre + 1)
      caisse -= forme.assuree ? COUT_INCIDENT : COUT_INCIDENT_SANS_ASSURANCE;

    semaines.push({ familles, heures, caisse, places, cout: avant - caisse });
  }

  const suivante = renouvelee ? SUBVENTION_SUIVANTE : 0;
  return {
    semaines,
    objectif: heures * VALEUR_HEURE + (caisse - ENVELOPPE) + suivante,
    aidants: h.aidants,
    ouverture: ouvre,
    heures,
    caisse,
    famillesMoyennes: semainesOuvertes
      ? famillesCumulees / semainesOuvertes
      : 0,
    subvention: accordee,
    renouvelee,
    incident: accident,
    meceneRetire: retire,
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
    subvention: t.subvention && dans(SEMAINE_SUBVENTION),
    ouverture: t.ouverture <= SEMAINES && dans(t.ouverture),
    semaineOuverture: t.ouverture,
    incident: t.incident && dans(t.ouverture + 1),
    retrait: t.meceneRetire && dans(SEMAINE_RETRAIT),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDuProjet {
  familles: number | null;
  heures: number | null;
  caisse: number | null;
  places: number | null;
}

/** Ce qu'Alix lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien préparer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDuProjet {
  if (semaine === 0)
    return { familles: 0, heures: 0, caisse: ENVELOPPE, places: 0 };
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    familles: s.familles,
    heures: s.heures,
    caisse: s.caisse,
    places: s.places,
  };
}
