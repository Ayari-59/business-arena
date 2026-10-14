/**
 * LES CONSULTANTS QUI PARTENT À DEUX ANS — le modèle de la fidélisation chez
 * Atlas Conseil.
 *
 * 190 consultants facturables, 24 % de départs l'an dernier, surtout entre
 * dix-huit mois et trois ans d'ancienneté, vers les clients et vers Halden
 * Partners. Janvier à mars : la campagne annuelle d'augmentations, les
 * entretiens de départ de l'an dernier à exploiter, treize semaines, six
 * décisions. Quatre mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · LES CAUSES DIFFÈRENT SELON LES PROFILS. Les 46 entretiens de départ de
 *     l'an dernier, lus par segment, ne disent pas la même chose : les
 *     analystes et consultants partent d'abord pour des missions répétitives
 *     et des intercontrats sans contenu, les seniors faute de perspective, et
 *     seuls les profils data partent d'abord pour la rémunération. Chaque
 *     segment a ses départs, et chaque départ sa cause principale : une
 *     mesure n'agit que sur la cause qu'elle traite.
 *   · UNE HAUSSE GÉNÉRALE COÛTE CHER ET RETIENT PEU. Six pour cent pour tous
 *     pèse sur toute la masse salariale des consultants et ne touche que les
 *     départs motivés par la rémunération ; elle ne rattrape même pas l'écart
 *     de marché des profils data. Une hausse ciblée sur les profils en
 *     tension, dans l'enveloppe, fait mieux pour dix fois moins.
 *   · LA MOBILITÉ ET LES PARCOURS AGISSENT AVEC RETARD. Une bourse aux
 *     missions, des parcours de carrière publiés, la mobilité entre practices
 *     réduisent les départs, mais montent en puissance sur des semaines : ce
 *     que le trimestre en voit est petit, ce que l'année en tire ne l'est pas.
 *     Publier des parcours sans avoir demandé aux seniors ce qu'ils attendent
 *     rate la moitié d'entre eux quand ils veulent une filière d'expertise.
 *   · CHAQUE DÉPART COÛTE, ET LA PYRAMIDE SE DÉFORME. Un départ coûte un
 *     recrutement, un poste vide, une montée en compétence, et parfois un
 *     client. Le plan de recrutement du budget remplace des départs qui
 *     n'auront peut-être pas lieu : des juniors en trop finissent en
 *     intercontrat, ce qui fait partir les juniors. Et une pyramide à qui il
 *     manque des seniors se répare mieux par des promotions sur critères que
 *     par des recrutements au prix du marché, qui se savent.
 *
 * L'OBJECTIF, en euros : l'économie nette sur l'année, estimée en semaine 13.
 * C'est le coût des départs évités par rapport au rythme de l'an dernier
 * (départs constatés au premier trimestre, plus départs attendus jusqu'en
 * décembre aux taux que les décisions et le trimestre ont installés), moins le
 * coût des mesures sur l'année, moins les pertes du trimestre (marge perdue,
 * client parti, incident de mission). Le hasard porte sur ce que le trimestre
 * révèle — Halden ouvre-t-il à Nantes, que veulent les seniors, la
 * certification réussit-elle, qui démissionne —, jamais sur les règles du
 * calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const SEMAINES_AN = 52;
export const CONSULTANTS = 190;
export const COLLABORATEURS = 240;
/** Directeurs et associés : ils ne partent presque jamais, le modèle les laisse de côté. */
export const DIRECTION = 10;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le dossier du comité se boucle avec un cabinet de rémunération. */
export const PERTE_PAR_JOUR = 3000;
/** Le taux de départ que le comité de direction vise sur l'année. */
export const OBJECTIF_TAUX = 0.2;
/** L'économie nette que le comité attend des décisions du trimestre. */
export const OBJECTIF_ECONOMIE = 250000;
/** Le budget de fidélisation de l'année, hors enveloppe d'augmentations. */
export const BUDGET_MESURES = 300000;

export type Segment = "juniors" | "seniors" | "data";
export type Cause = "missions" | "perspectives" | "salaire" | "autres";
export const SEGMENTS: readonly Segment[] = ["juniors", "seniors", "data"];
export const CAUSES: readonly Cause[] = ["missions", "perspectives", "salaire", "autres"];

export const EFFECTIFS: Record<Segment, number> = { juniors: 92, seniors: 62, data: 26 };

/**
 * LES 46 ENTRETIENS DE DÉPART DE L'AN DERNIER, par segment et par raison
 * principale. Ils fixent les taux de départ de chaque segment et la part de
 * chaque cause : le modèle ne connaît pas d'autres départs.
 */
export const ENTRETIENS: Record<Segment, Record<Cause, number>> = {
  juniors: { missions: 15, perspectives: 4, salaire: 4, autres: 5 },
  seniors: { missions: 2, perspectives: 6, salaire: 2, autres: 1 },
  data: { missions: 1, perspectives: 1, salaire: 4, autres: 1 },
};

/** La synthèse des questionnaires de sortie, plusieurs réponses possibles : sur 46. */
export const QUESTIONNAIRES = { salaire: 27, missions: 22, perspectives: 19, equilibre: 12 };

export const departsAnDernier = (s: Segment) => CAUSES.reduce((t, c) => t + ENTRETIENS[s][c], 0);
export const DEPARTS_AN_DERNIER = SEGMENTS.reduce((t, s) => t + departsAnDernier(s), 0);
export const tauxAnDernier = (s: Segment) => departsAnDernier(s) / EFFECTIFS[s];
export const TAUX_AN_DERNIER = DEPARTS_AN_DERNIER / CONSULTANTS;

/**
 * CE QUE COÛTE UN DÉPART, segment par segment, tel que le contrôle de gestion
 * le chiffre : le recrutement du remplaçant, la marge perdue pendant que le
 * poste est vide, les jours que la recrue ne facture pas pendant sa montée en
 * compétence, et le client qui, une fois sur n, suit le consultant ou ne
 * renouvelle pas.
 */
export const COUT_DEPART: Record<
  Segment,
  {
    recrutement: number;
    semainesVides: number;
    margeParSemaine: number;
    joursDeMontee: number;
    tjm: number;
    /** Un départ sur `client` coûte un client. */
    client: number;
    margeClient: number;
  }
> = {
  juniors: {
    recrutement: 11000,
    semainesVides: 8,
    margeParSemaine: 1500,
    joursDeMontee: 25,
    tjm: 700,
    client: 8,
    margeClient: 56000,
  },
  seniors: {
    recrutement: 18000,
    semainesVides: 12,
    margeParSemaine: 2400,
    joursDeMontee: 30,
    tjm: 950,
    client: 4,
    margeClient: 80000,
  },
  data: {
    recrutement: 20000,
    semainesVides: 14,
    margeParSemaine: 1900,
    joursDeMontee: 25,
    tjm: 850,
    client: 6,
    margeClient: 60000,
  },
};

export const coutDUnDepart = (s: Segment) => {
  const c = COUT_DEPART[s];
  return (
    c.recrutement +
    c.semainesVides * c.margeParSemaine +
    c.joursDeMontee * c.tjm +
    c.margeClient / c.client
  );
};

/** Ce que les départs de l'an dernier ont coûté. */
export const COUT_AN_DERNIER = SEGMENTS.reduce(
  (t, s) => t + departsAnDernier(s) * coutDUnDepart(s),
  0,
);

/* ---------------------------------------------------------------------------
 * LA RÉMUNÉRATION : l'enveloppe, l'écart au marché, ce que coûte chaque option.
 * ------------------------------------------------------------------------- */

/** La masse salariale chargée des 190 consultants, et celle des 26 profils data. */
export const MASSE_CONSULTANTS = 16700000;
export const MASSE_DATA = 2080000;
/** L'enveloppe d'augmentations prévue au budget, en part de la masse salariale. */
export const ENVELOPPE = 0.03;
export const HAUSSE_GENERALE = 0.06;
/** Le rattrapage proposé pour les profils data, et l'enveloppe qu'il demande. */
export const RATTRAPAGE_DATA = 0.1;
export const ENVELOPPE_CIBLEE = 0.033;
/** L'écart à la médiane du marché, par segment, selon l'étude de rémunération. */
export const ECART_MARCHE: Record<Segment, number> = { juniors: 0.02, seniors: 0.03, data: 0.13 };
export const ECART_MOYEN = 0.05;
/** Ce que Halden Partners paie de plus qu'Atlas, en moyenne. */
export const PRIME_HALDEN = 0.08;
/** Les augmentations partent avec la paie de février : onze mois sur douze. */
export const MOIS_PAYES = 11 / 12;
/** La prime de fidélité versée au deuxième anniversaire. */
export const PRIME_FIDELITE = { brut: 3000, charges: 1.45, beneficiaires: 30 } as const;

export const COUT_HAUSSE_GENERALE = (HAUSSE_GENERALE - ENVELOPPE) * MASSE_CONSULTANTS * MOIS_PAYES;
export const COUT_HAUSSE_CIBLEE = (ENVELOPPE_CIBLEE - ENVELOPPE) * MASSE_CONSULTANTS * MOIS_PAYES;
export const COUT_PRIME_FIDELITE =
  PRIME_FIDELITE.brut * PRIME_FIDELITE.charges * PRIME_FIDELITE.beneficiaires * MOIS_PAYES;
/** Ce qui reste en moyenne aux autres consultants, une fois les data rattrapés. */
export const HAUSSE_DES_AUTRES =
  (ENVELOPPE_CIBLEE * MASSE_CONSULTANTS - RATTRAPAGE_DATA * MASSE_DATA) /
  (MASSE_CONSULTANTS - MASSE_DATA);

/* ---------------------------------------------------------------------------
 * LES AUTRES MESURES.
 * ------------------------------------------------------------------------- */

export const MESURES = {
  /** La marge que les régies longues rapportent, nette des missions refusées au printemps. */
  margeRegie: 60000,
  /** La bourse aux missions : un chargé de staffing à mi-temps, et les passations. */
  bourse: 55000,
  formation: 45000,
  grille: 5000,
  /** Les entretiens de maintien : le temps des managers, et la filière d'expertise. */
  entretiens: 20000,
  /** Huit promotions de manager anticipées, et le surcoût de huit managers sans équipe. */
  promotions: 8 * 9000 * (10 / 12) + 30000,
} as const;

/** Les six consultants de Performance opérationnelle en intercontrat depuis novembre. */
export const POOL = {
  effectif: 6,
  partants: 4,
  /** Leur risque de départ sur l'année, selon ce qu'on leur propose. */
  risque: { attente: 0.45, mobilite: 0.1, echec: 0.9, pret: 0.38, avantVente: 0.4 },
  /** Ce que coûte un recrutement d'auditeur énergétique, et la formation certifiante. */
  recrutementAuditeur: 15000,
  formation: 7000,
  margePret: 25000,
  /** Si la certification échoue : deux auditeurs à trouver en urgence, en indépendants. */
  urgence: 40000,
  /** La certification réussit plus souvent quand une bourse aux missions a fait émerger les volontaires. */
  reussite: { avecBourse: 0.85, sans: 0.6 },
  /** Les semaines de l'année encore à courir quand la décision prend effet. */
  semaines: 46,
} as const;

/** Le plan de recrutement du budget : la vague de juniors du printemps. */
export const PLAN = {
  printemps: 16,
  recale: 10,
  accelere: 22,
  /** Un junior en trop : quatre mois d'intercontrat, et des juniors qui s'en lassent. */
  surplus: 20000,
  departParSurplus: 0.1,
  /** Un junior qui manque : des missions refusées ou sous-traitées sur Freelancia. */
  manque: 15000,
  /** Recruter en juin ce qui manque au printemps : arrivées tardives. */
  retardJuin: 5000,
  /** Geler : tout arrive tard, et les écoles s'en souviennent. */
  retardGel: 9000,
  ecoles: 20000,
} as const;

/** La pyramide : six seniors manquent pour encadrer les juniors. */
export const PYRAMIDE = {
  manque: 6,
  recrutementSenior: 18000,
  primeMarche: 0.12,
  promotion: 6 * 6000 * 0.75 + 12000,
  freelancia: 100000,
  incident: 40000,
  /** Le risque d'un incident de mission d'ici la semaine 12, selon l'option. */
  risqueIncident: [0, 0.2, 0, 0.5],
} as const;

/** Halden Partners ouvre-t-il un bureau à Nantes ? On le sait en semaine 5. */
export const CHANCE_HALDEN = 0.5;
export const ANNONCE_HALDEN = 5;
/** Les seniors attendent-ils aussi une filière d'expertise ? */
export const CHANCE_EXPERTISE = 0.6;
/** Le compte Banque de l'Erdre et son manager, Jakez Kerzerho. */
export const KERZERHO = { semaine: 9, perteClient: 50000, chanceClient: 0.5 } as const;
export const REGIE = { semaine: 10, chance: 0.5, partants: 2 } as const;
export const CERTIFICATION = 12;
export const INCIDENT = 12;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  augmentations: 0,
  intercontrat: 1,
  parcours: 2,
  mobilite: 3,
  recrutement: 4,
  pyramide: 5,
} as const;

/** La semaine où chaque décision entre dans l'estimation. */
export const EFFET = [3, 3, 5, 7, 9, 11] as const;

/** Ne rien changer : la campagne prévue, le staffing tel quel, rien de publié, le plan du budget. */
export const NEUTRE = [2, 3, 3, 0, 0, 3] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  effet: {
    /** Des consultants en intercontrat en plus (ou en moins), pendant `duree` semaines. */
    intercontrat?: number;
    duree?: number;
    /** De la marge gagnée ou perdue. */
    marge?: number;
    /** Ce qui change les départs des juniors pour le reste de l'année. */
    juniors?: { missions?: number; perspectives?: number };
    /** Des profils data qui partent d'un coup, vers un client. */
    departsData?: number;
    /** Ce qu'un recrutement de junior coûte de plus. */
    recrutement?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "marche",
    titre: "Un marché public reporté",
    de: "Achats Publics de l'Ouest",
    role: "Centrale d'achat public",
    texte:
      "L'attribution du marché de conseil en organisation des hôpitaux de la région est reportée de trois semaines : six consultants attendront en intercontrat.",
    effet: { intercontrat: 6, duree: 3, marge: -25000, juniors: { missions: 1.05 } },
  },
  {
    id: "avance",
    titre: "Un programme qui démarre plus tôt",
    de: "Noé Akintola",
    role: "Directeur de la practice Performance opérationnelle",
    texte:
      "Les Fonderies de l'Erve avancent leur programme de réduction des stocks : cinq consultants partent en mission dès lundi.",
    effet: { intercontrat: -5, duree: 13, marge: 20000, juniors: { missions: 0.97 } },
  },
  {
    id: "temoignage",
    titre: "Un témoignage qui circule",
    de: "Hamidou Thoraval",
    role: "Secrétaire du CSE",
    texte:
      "Une ancienne consultante publie « Pourquoi j'ai quitté Atlas au bout de deux ans » sur un réseau professionnel : 40 000 lectures, et beaucoup de juniors qui l'ont partagé.",
    effet: { juniors: { missions: 1.06, perspectives: 1.06 } },
  },
  {
    id: "keroual",
    titre: "Kéroual Consulting relève ses salaires d'embauche",
    de: "Aïssatou Ndour",
    role: "Responsable du staffing et du recrutement",
    texte:
      "Kéroual Consulting embauche désormais les jeunes diplômés 3 000 € au-dessus de nous : chaque recrutement de junior nous coûtera 2 000 € de plus en salons et en cooptation.",
    effet: { recrutement: 2000 },
  },
  {
    id: "internalisation",
    titre: "Un client internalise sa data",
    de: "Ruben Esnault",
    role: "Directeur de la practice Data et systèmes d'information",
    texte:
      "La Laiterie coopérative des Mauges monte sa propre équipe data et embauche deux de nos consultants qui y étaient en mission.",
    effet: { departsData: 2 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** La chance du trimestre sur les démissions de chaque segment, et le décalage des comptes entiers. */
  chance: Record<Segment, number>;
  decalage: Record<Segment, number>;
  /** Halden ouvre-t-il à Nantes ? */
  halden: boolean;
  /** Les seniors attendent-ils aussi une filière d'expertise ? */
  expertise: boolean;
  uCertification: number;
  uRegie: number;
  uKerzerho: number;
  uClient: number;
  uIncident: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000723 + 7);
  const chance = {} as Record<Segment, number>;
  const decalage = {} as Record<Segment, number>;
  for (const s of SEGMENTS) {
    chance[s] = borne(1 + 0.15 * gauss(r), 0.7, 1.3);
    decalage[s] = r();
  }
  const halden = r() < CHANCE_HALDEN;
  const expertise = r() < CHANCE_EXPERTISE;
  const uCertification = r();
  const uRegie = r();
  const uKerzerho = r();
  const uClient = r();
  const uIncident = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    chance,
    decalage,
    halden,
    expertise,
    uCertification,
    uRegie,
    uKerzerho,
    uClient,
    uIncident,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La certification des consultants qui changent de practice réussit-elle ? */
export const chanceDeCertification = (chemin: readonly number[]) =>
  chemin[D.intercontrat] === 1 ? POOL.reussite.avecBourse : POOL.reussite.sans;
export const certificationReussie = (chemin: readonly number[], graine: number) =>
  chemin[D.mobilite] === 1 && hasard(graine).uCertification < chanceDeCertification(chemin);

/** Deux juniors de la même régie démissionnent ensemble, une fois sur deux. */
export const departGroupe = (chemin: readonly number[], graine: number) =>
  chemin[D.intercontrat] === 0 && hasard(graine).uRegie < REGIE.chance;

/**
 * MAËLIG KERZERHO PART-IL CHEZ HALDEN ? Halden l'approche en semaine 9. Il
 * attend un chemin vers la direction de practice : des parcours publiés le
 * retiennent deux fois plus, un rattrapage des profils data aussi un peu.
 * Si Halden ouvre à Nantes, l'offre est plus pressante.
 */
export function chanceQueKerzerhoParte(chemin: readonly number[], graine: number): number {
  const h = hasard(graine);
  let p = h.halden ? 0.55 : 0.25;
  const parcours = chemin[D.parcours];
  if (parcours === 0 || parcours === 1) p *= 0.5;
  if (chemin[D.augmentations] === 1) p *= 0.7;
  if (chemin[D.augmentations] === 0) p *= 0.8;
  return p;
}
export const kerzerhoPart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uKerzerho < chanceQueKerzerhoParte(chemin, graine);
/** La Banque de l'Erdre réduit son programme une fois sur deux quand il part. */
export const clientPerdu = (chemin: readonly number[], graine: number) =>
  kerzerhoPart(chemin, graine) && hasard(graine).uClient < KERZERHO.chanceClient;

/** Un incident de mission, faute d'encadrement, d'ici la semaine 12. */
export const incidentDeMission = (chemin: readonly number[], graine: number) =>
  hasard(graine).uIncident < PYRAMIDE.risqueIncident[chemin[D.pyramide]!]!;

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/* ---------------------------------------------------------------------------
 * LES TAUX DE DÉPART, semaine par semaine de l'année.
 * ------------------------------------------------------------------------- */

/** La montée en puissance d'une mesure qui agit avec retard : 0 avant `debut`, 1 à `plein`. */
export const rampe = (t: number, debut: number, plein: number) =>
  borne((t - debut + 1) / (plein - debut + 1), 0, 1);
const effet = (m: number, r: number) => 1 - (1 - m) * r;

type Multiplicateurs = Record<Segment, Record<Cause, number>>;

/**
 * Ce que les décisions et le trimestre font à chaque cause de départ en
 * semaine `t` de l'année, tel qu'on le sait en fin de semaine `w` : une
 * décision compte une fois prise, Halden une fois annoncé (avant, on le
 * pondère par sa probabilité), un imprévu une fois tombé.
 */
function multiplicateurs(chemin: readonly number[], h: Hasard, t: number, w: number) {
  const m = {} as Multiplicateurs;
  for (const s of SEGMENTS) m[s] = { missions: 1, perspectives: 1, salaire: 1, autres: 1 };
  const dit = (k: number) => w >= EFFET[k]!;
  const [d1, d2, d3, , , d6] = chemin;

  if (t >= ANNONCE_HALDEN) {
    const f = (x: number) =>
      w >= ANNONCE_HALDEN ? (h.halden ? x : 1) : 1 + CHANCE_HALDEN * (x - 1);
    m.seniors.perspectives *= f(1.2);
    m.seniors.salaire *= f(1.3);
    m.data.salaire *= f(1.3);
  }

  if (dit(D.augmentations) && t >= EFFET[D.augmentations]) {
    if (d1 === 0) {
      m.juniors.salaire *= 0.4;
      m.seniors.salaire *= 0.4;
      m.data.salaire *= 0.7;
    } else if (d1 === 1) {
      m.data.salaire *= 0.3;
      m.juniors.salaire *= 1.1;
      m.seniors.salaire *= 1.1;
    } else if (d1 === 3) {
      m.juniors.missions *= 0.9;
      m.juniors.perspectives *= 0.9;
      m.juniors.salaire *= 0.9;
    }
  }

  if (dit(D.intercontrat)) {
    if (d2 === 0) m.juniors.missions *= effet(1.25, rampe(t, 5, 13));
    if (d2 === 1) {
      m.juniors.missions *= effet(0.7, rampe(t, 5, 13));
      m.data.missions *= effet(0.8, rampe(t, 5, 13));
    }
    if (d2 === 2) {
      m.juniors.missions *= effet(0.9, rampe(t, 4, 10));
      m.juniors.perspectives *= effet(0.85, rampe(t, 4, 10));
    }
  }

  if (dit(D.parcours)) {
    // Des promotions financées rendent les parcours crédibles.
    const credible = d1 === 1 ? 1.2 : 1;
    if (d3 === 0 || d3 === 1) {
      const cible = d3 === 1 ? 0.55 : h.expertise ? 0.9 : 0.55;
      const m3 = 1 - (1 - cible) * credible;
      const r = d3 === 1 ? rampe(t, 8, 19) : rampe(t, 6, 17);
      m.seniors.perspectives *= effet(m3, r);
      m.data.perspectives *= effet(m3, r);
    }
    if (d3 === 2 && t >= 6) m.seniors.perspectives *= 0.8;
  }

  if (dit(D.pyramide)) {
    if (d6 === 0 && t >= 14) {
      m.seniors.salaire *= 1.4;
      m.seniors.perspectives *= 1.1;
    }
    if (d6 === 1 && t >= 11) m.juniors.perspectives *= d3 === 0 || d3 === 1 ? 0.7 : 0.8;
    if (d6 === 3 && t >= 11) m.seniors.perspectives *= 1.1;
  }

  for (const { imprevu: i, semaine } of h.imprevus) {
    if (w < semaine || t < semaine || !i.effet.juniors) continue;
    m.juniors.missions *= i.effet.juniors.missions ?? 1;
    m.juniors.perspectives *= i.effet.juniors.perspectives ?? 1;
  }
  return m;
}

/** Les départs attendus d'un segment en semaine `t`, tels qu'on les estime en fin de semaine `w`. */
function attendus(chemin: readonly number[], h: Hasard, s: Segment, t: number, w: number) {
  const m = multiplicateurs(chemin, h, t, w)[s];
  return CAUSES.reduce((x, c) => x + ENTRETIENS[s][c] * m[c], 0) / SEMAINES_AN;
}

/** Les départs attendus au rythme de l'an dernier, de la semaine `de` à la semaine `a`. */
export const departsDeReference = (de: number, a: number) =>
  (DEPARTS_AN_DERNIER * Math.max(0, a - de + 1)) / SEMAINES_AN;

/* ---------------------------------------------------------------------------
 * L'ESTIMATION DE L'ANNÉE, à la fin d'une semaine.
 * ------------------------------------------------------------------------- */

export interface Estimation {
  /** L'économie nette estimée sur l'année, en euros. */
  valeur: number;
  /** Les départs constatés depuis janvier, par segment. */
  constates: Record<Segment, number>;
  /** Les départs estimés sur l'année, par segment, et au total. */
  annee: Record<Segment, number>;
  total: number;
  /** Le coût des mesures sur l'année, pertes du trimestre non comprises. */
  mesures: number;
  /** Les pertes du trimestre : marge, client, incident, enquête. */
  pertes: number;
  /** Le besoin de juniors au printemps, au rythme de départs estimé. */
  besoin: number;
}

function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const [, , , d4, d5, d6] = chemin;
  const dit = (k: number) => w >= EFFET[k]!;

  // Les démissions constatées : des comptes entiers, tirés une fois pour toutes.
  const constates = {} as Record<Segment, number>;
  const annee = {} as Record<Segment, number>;
  for (const s of SEGMENTS) {
    let cumul = 0;
    for (let t = 1; t <= w; t += 1) cumul += attendus(chemin, h, s, t, t);
    constates[s] = Math.floor(cumul * h.chance[s] + h.decalage[s]);
    let reste = 0;
    for (let t = w + 1; t <= SEMAINES_AN; t += 1) reste += attendus(chemin, h, s, t, w);
    annee[s] = constates[s] + reste;
  }
  if (departGroupe(chemin, graine) && w >= REGIE.semaine) {
    constates.juniors += REGIE.partants;
    annee.juniors += REGIE.partants;
  }
  const internalisation = imprevu(h, "internalisation");
  if (internalisation && internalisation.semaine <= w) {
    constates.data += internalisation.imprevu.effet.departsData!;
    annee.data += internalisation.imprevu.effet.departsData!;
  }
  const kerzerho = kerzerhoPart(chemin, graine) && w >= KERZERHO.semaine;
  if (kerzerho) {
    constates.seniors += 1;
    annee.seniors += 1;
  }

  let mesures = 0;
  let pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const [d1, d2, d3] = chemin;
  if (dit(D.augmentations)) {
    if (d1 === 0) mesures += COUT_HAUSSE_GENERALE;
    if (d1 === 1) mesures += COUT_HAUSSE_CIBLEE;
    if (d1 === 3) mesures += COUT_PRIME_FIDELITE;
  }
  if (dit(D.intercontrat)) {
    if (d2 === 0) mesures -= MESURES.margeRegie;
    if (d2 === 1) mesures += MESURES.bourse;
    if (d2 === 2) mesures += MESURES.formation;
  }
  if (dit(D.parcours)) {
    if (d3 === 0) mesures += MESURES.grille;
    if (d3 === 1) mesures += MESURES.entretiens;
    if (d3 === 2) mesures += MESURES.promotions;
  }

  // Les six de Performance opérationnelle : leur départ en plus du rythme des juniors.
  if (dit(D.mobilite)) {
    const q = POOL.risque;
    let risques: number;
    if (d4 === 1) {
      const reussite =
        w >= CERTIFICATION
          ? certificationReussie(chemin, graine)
            ? 1
            : 0
          : chanceDeCertification(chemin);
      const siReussite = POOL.partants * q.mobilite + 2 * q.attente;
      const siEchec = 2 * q.mobilite + 2 * q.echec + 2 * q.attente;
      risques = reussite * siReussite + (1 - reussite) * siEchec;
      mesures +=
        POOL.partants * POOL.formation -
        POOL.recrutementAuditeur * (reussite * POOL.partants + (1 - reussite) * 2) +
        (1 - reussite) * POOL.urgence;
    } else if (d4 === 2) {
      risques = POOL.effectif * q.pret;
      mesures -= POOL.margePret;
    } else {
      risques = POOL.effectif * (d4 === 3 ? q.avantVente : q.attente);
    }
    const enPlus = ((risques - POOL.effectif * tauxAnDernier("juniors")) * POOL.semaines) / 52;
    annee.juniors += enPlus;
  }

  // Le besoin de juniors au printemps suit les départs attendus d'ici décembre.
  let resteEstime = 0;
  for (const s of SEGMENTS) {
    for (let t = SEMAINES + 1; t <= SEMAINES_AN; t += 1)
      resteEstime += attendus(chemin, h, s, t, w);
  }
  const besoin = (PLAN.printemps * resteEstime) / departsDeReference(SEMAINES + 1, SEMAINES_AN);
  if (dit(D.recrutement)) {
    let embauches: number;
    if (d5 === 1) {
      embauches = Math.max(PLAN.recale, besoin);
      mesures += Math.max(0, besoin - PLAN.recale) * PLAN.retardJuin;
    } else if (d5 === 3) {
      embauches = besoin;
      mesures += besoin * PLAN.retardGel + PLAN.ecoles;
    } else {
      embauches = d5 === 2 ? PLAN.accelere : PLAN.printemps;
    }
    const ecart = embauches - besoin;
    if (ecart > 0) {
      mesures += ecart * PLAN.surplus;
      annee.juniors += ecart * PLAN.departParSurplus;
    } else {
      mesures -= ecart * PLAN.manque;
    }
  }

  if (dit(D.pyramide)) {
    if (d6 === 0) mesures += PYRAMIDE.manque * PYRAMIDE.recrutementSenior;
    if (d6 === 1) mesures += PYRAMIDE.promotion;
    if (d6 === 2) mesures += PYRAMIDE.freelancia;
    const risque = PYRAMIDE.risqueIncident[d6!]!;
    const incident = w >= INCIDENT ? (incidentDeMission(chemin, graine) ? 1 : 0) : risque;
    pertes += incident * PYRAMIDE.incident;
  }

  for (const { imprevu: i, semaine } of h.imprevus) {
    if (semaine > w) continue;
    pertes -= i.effet.marge ?? 0;
    if (i.effet.recrutement) {
      let juniors = 0;
      for (let t = semaine; t <= SEMAINES_AN; t += 1)
        juniors += attendus(chemin, h, "juniors", t, w);
      pertes += i.effet.recrutement * juniors;
    }
  }
  if (kerzerho && clientPerdu(chemin, graine)) pertes += KERZERHO.perteClient;

  const evites = SEGMENTS.reduce(
    (x, s) => x + (departsAnDernier(s) - annee[s]) * coutDUnDepart(s),
    0,
  );
  const total = SEGMENTS.reduce((x, s) => x + annee[s], 0);
  return {
    valeur: evites - mesures - pertes,
    constates,
    annee,
    total,
    mesures,
    pertes,
    besoin,
  };
}

/** Les consultants en intercontrat en fin de semaine : le creux de janvier, puis les marchés publics. */
const INTERCONTRAT_JUNIORS = [0, 14, 14, 13, 13, 12, 11, 10, 9, 8, 8, 7, 7, 7] as const;

export function intercontrat(chemin: readonly number[], graine: number, w: number): number {
  const h = hasard(graine);
  const [, d2, , d4] = chemin;
  let juniors = INTERCONTRAT_JUNIORS[w]!;
  if (w >= 4 && d2 === 0) juniors -= 6;
  if (w >= 6 && d2 === 1) juniors -= 2;
  let pool: number = POOL.effectif;
  if (w >= EFFET[D.mobilite]) {
    if (d4 === 1) pool = 2 + (w >= CERTIFICATION && !certificationReussie(chemin, graine) ? 2 : 0);
    if (d4 === 2) pool = 0;
  }
  let autres = 0;
  for (const { imprevu: i, semaine } of h.imprevus) {
    if (i.effet.intercontrat && w >= semaine && w < semaine + (i.effet.duree ?? 1)) {
      autres += i.effet.intercontrat;
    }
  }
  return Math.max(2, Math.max(0, juniors) + pool + autres);
}

export type Semaine = {
  /** L'économie nette estimée sur l'année, en fin de semaine. */
  economie: number;
  /** Le taux de départ estimé sur l'année. */
  taux: number;
  /** Les démissions constatées depuis janvier. */
  demissions: number;
  /** Au même stade l'an dernier. */
  reference: number;
  intercontrat: number;
  mesures: number;
  besoin: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'économie nette estimée en semaine 13, en euros. */
  objectif: number;
  taux: number;
  constates: Record<Segment, number>;
  annee: Record<Segment, number>;
  mesures: number;
  pertes: number;
  besoin: number;
  halden: boolean;
  expertise: boolean;
  certification: boolean | null;
  departGroupe: boolean;
  kerzerhoPart: boolean;
  clientPerdu: boolean;
  incident: boolean;
  intercontratFinal: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    semaines.push({
      economie: e.valeur,
      taux: e.total / CONSULTANTS,
      demissions: SEGMENTS.reduce((x, s) => x + e.constates[s], 0),
      reference: departsDeReference(1, w),
      intercontrat: intercontrat(chemin, graine, w),
      mesures: e.mesures,
      besoin: e.besoin,
    });
    fin = e;
  }
  return {
    semaines,
    objectif: fin!.valeur,
    taux: fin!.total / CONSULTANTS,
    constates: fin!.constates,
    annee: fin!.annee,
    mesures: fin!.mesures,
    pertes: fin!.pertes,
    besoin: fin!.besoin,
    halden: h.halden,
    expertise: h.expertise,
    certification: chemin[D.mobilite] === 1 ? certificationReussie(chemin, graine) : null,
    departGroupe: departGroupe(chemin, graine),
    kerzerhoPart: kerzerhoPart(chemin, graine),
    clientPerdu: clientPerdu(chemin, graine),
    incident: incidentDeMission(chemin, graine),
    intercontratFinal: semaines[SEMAINES]!.intercontrat,
  };
}

/** Ce qui s'est passé pendant des semaines : Halden, Kerzerho, la régie, la certification, l'incident. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    halden: dans(ANNONCE_HALDEN),
    kerzerho: dans(KERZERHO.semaine),
    departGroupe: t.departGroupe && dans(REGIE.semaine),
    certification: t.certification !== null && dans(CERTIFICATION),
    incident: t.incident && dans(INCIDENT),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureDeparts {
  taux: number | null;
  economie: number | null;
  demissions: number | null;
  intercontrat: number | null;
  mesures: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  reference: number | null;
  besoin: number | null;
  halden: number | null;
  juniors: number | null;
  seniors: number | null;
  data: number | null;
}

/**
 * Ce que Maëline lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureDeparts {
  if (semaine === 0) {
    return {
      taux: TAUX_AN_DERNIER,
      economie: 0,
      demissions: 0,
      intercontrat: INTERCONTRAT_JUNIORS[1]! + POOL.effectif,
      mesures: 0,
      reference: 0,
      besoin: PLAN.printemps,
      halden: 0,
      juniors: 0,
      seniors: 0,
      data: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const e = estimer(chemin, graine, semaine, jours);
  return {
    taux: e.total / CONSULTANTS,
    economie: e.valeur,
    demissions: SEGMENTS.reduce((x, s) => x + e.constates[s], 0),
    intercontrat: intercontrat(chemin, graine, semaine),
    mesures: e.mesures,
    reference: departsDeReference(1, semaine),
    besoin: e.besoin,
    halden: semaine >= ANNONCE_HALDEN && hasard(graine).halden ? 1 : 0,
    juniors: e.constates.juniors,
    seniors: e.constates.seniors,
    data: e.constates.data,
  };
}
