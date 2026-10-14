/**
 * L'ASSOCIÉ QUI VEUT VENDRE SES PARTS — le modèle de la sortie de Wilfrid
 * Vasselot du capital d'Atlas Conseil.
 *
 * Wilfrid Vasselot, associé fondateur, détient 18 % du capital et porte trois
 * grands comptes industriels de la practice Performance opérationnelle :
 * Herlinval Distribution, Lavaudière Agroalimentaire, les Fonderies du Brivet.
 * Il veut céder ses parts d'ici l'été, et réclame 2 988 k€ comptant : huit
 * fois l'EBE, sans décote, « ce que Halden Partners a payé à Bordeaux ». Le
 * pacte d'associés fixe une méthode de prix, mais ne dit rien du paiement,
 * d'un complément de prix, de la non-sollicitation ni d'une transition.
 * Gustave Herbelin, directeur administratif et financier, prépare
 * l'opération pour la présidente et les associés : janvier à mars, treize
 * semaines, six décisions, jusqu'au protocole d'accord.
 *
 * LA VALEUR CRÉÉE, ESTIMÉE EN SEMAINE 13, pour les associés qui restent. Une
 * sortie d'associé se juge sur des années ; l'épisode dure un trimestre. Le
 * contrôle de gestion estime donc chaque semaine :
 *
 *   ce que les associés restants détiendront après l'opération (100 % du
 *   cabinet, au multiple du pacte, moins la valeur des comptes perdus et ce
 *   que le marché et le plan d'économies de Lavaudière ôtent aux comptes gardés)
 *   − ce qu'ils détenaient le lundi de l'annonce (82 % du cabinet, le risque
 *     sur les trois comptes compté à son espérance si rien n'est organisé)
 *   − le prix payé (comptant, étalé, complément de prix dû)
 *   − les coûts de l'opération (expert, revue, contrepartie des clauses,
 *     accompagnement, conflit, débauchage, frais bancaires, tension de
 *     trésorerie, imprévus).
 *
 * Un compte vaut six fois ce qu'il apporte à l'EBE, le multiple du pacte. Le
 * paiement étalé porte intérêt au taux du marché : il compte pour son
 * montant. Le complément de prix compte pour son montant s'il est dû (il se
 * paie dans dix-huit mois à deux ans, l'écart d'actualisation est faible
 * devant l'incertitude). Avant d'être connu, chaque aléa (le départ d'un
 * compte, Halden, le refus de signer, la défaillance d'un associé, le point
 * bas de trésorerie, le marché) compte pour son espérance ; il compte pour ce
 * qu'il est dès que le trimestre le révèle. Le hasard porte sur ce que le
 * trimestre révèle, jamais sur les règles du calcul.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · L'EBE RETRAITÉ DONNE LA BASE. L'EBE publié (3 M€) flatte : les associés
 *     se paient sous le marché et se servent en dividendes, une mission de
 *     sauvegarde exceptionnelle a gonflé l'année, un déménagement l'a pesée.
 *     Retraité, il vaut 2,2 M€ ; six fois, moins la dette nette, 18 %, moins
 *     la décote de minorité : 1 867 k€ selon le pacte. L'actualisation des
 *     flux disponibles confirme le multiple de six.
 *   · LES TROIS COMPTES PEUVENT PARTIR AVEC LUI. Un compte qui tient à la
 *     personne de Wilfrid part une fois sur deux s'il ne fait rien pour le
 *     transmettre, un compte qui tient à l'équipe une fois sur dix. Le tirage
 *     se fait au hasard ; sa probabilité dépend du montage (un cédant payé au
 *     maintien de ses comptes les transmet), des clauses (non-concurrence et
 *     non-sollicitation), de l'accompagnement (efficace s'il est intéressé,
 *     ciblé sur les comptes qui tiennent à lui), et de Halden.
 *   · TOUT PAYER COMPTANT TRANSFÈRE TOUT LE RISQUE AU CABINET. Le prix payé
 *     d'avance ne revient pas si les comptes partent ; un complément de prix
 *     le partage, et rend au cédant son prix s'il transmet ses clients. Un
 *     complément se rédige sur ce que le cédant maîtrise : le maintien du
 *     compte, pas ses honoraires, que le plan d'économies d'un client peut
 *     faire tomber sans lui.
 *   · LE FINANCEMENT CHANGE LA TRÉSORERIE, PAS LA VALEUR. Au taux du marché,
 *     les intérêts d'un emprunt paient le temps ; ils ne retirent rien à la
 *     valeur. Payer sur la trésorerie d'un cabinet payé à 75 jours, si : le
 *     point bas de l'été passe sous le seuil de sécurité, et l'affacturage en
 *     urgence coûte.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La valeur que la présidente attend de l'opération, pour les associés restants. */
export const OBJECTIF_VALEUR = 200000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'avocate et l'expert-comptable travaillent dans l'urgence. */
export const PERTE_PAR_JOUR = 4000;

/* ---------------------------------------------------------------------------
 * LES COMPTES 2026, LE PACTE, ET CE QU'ILS DONNENT.
 * ------------------------------------------------------------------------- */

/** Les comptes provisoires de l'exercice 2026, tels que l'expert-comptable les a arrêtés. */
export const COMPTES_2026 = {
  chiffreAffaires: 34000000,
  ebePublie: 3000000,
  associes: 6,
  /** La rémunération chargée que chaque associé se verse ; le reste vient en dividendes. */
  remunerationVersee: 140000,
  /** Ce que coûterait, charges comprises, un associé payé au prix du marché. */
  remunerationNormative: 240000,
  /** La marge d'une mission de plan de sauvegarde qui ne se reproduira pas. */
  missionExceptionnelle: 350000,
  /** Le déménagement du bureau de Paris, passé en charges. */
  demenagement: 150000,
  emprunts: 3600000,
  tresorerie: 2600000,
} as const;

/** Ramener les associés à une rémunération de marché : une charge de plus. */
export const RETRAITEMENT_REMUNERATION =
  COMPTES_2026.associes * (COMPTES_2026.remunerationNormative - COMPTES_2026.remunerationVersee);

/** L'EBE retraité : rémunération normative, éléments non récurrents. */
export const EBE_RETRAITE =
  COMPTES_2026.ebePublie -
  RETRAITEMENT_REMUNERATION -
  COMPTES_2026.missionExceptionnelle +
  COMPTES_2026.demenagement;

export const DETTE_NETTE = COMPTES_2026.emprunts - COMPTES_2026.tresorerie;

/** L'article 9 du pacte d'associés : la méthode du prix. */
export const PACTE = { multiple: 6, decote: 0.15, part: 0.18, seuilDecote: 1 / 3 } as const;

export const VALEUR_D_ENTREPRISE = PACTE.multiple * EBE_RETRAITE;
export const FONDS_PROPRES = VALEUR_D_ENTREPRISE - DETTE_NETTE;
/** Les 18 % de Wilfrid, sans décote : ce que les associés restants acquièrent. */
export const VALEUR_DE_LA_PART = PACTE.part * FONDS_PROPRES;
/** Le prix selon le pacte : la décote de minorité s'applique sous le tiers du capital. */
export const PRIX_DU_PACTE = VALEUR_DE_LA_PART * (1 - PACTE.decote);

/** Ce que Wilfrid réclame : huit fois l'EBE retraité, moins la dette nette, sans décote, comptant. */
export const MULTIPLE_DEMANDE = 8;
export const PRIX_DEMANDE = PACTE.part * (MULTIPLE_DEMANDE * EBE_RETRAITE - DETTE_NETTE);

/** L'actualisation des flux disponibles, que l'expert-comptable a faite pour vérifier le multiple. */
export const FLUX = { disponible: 1452000, croissance: 0.02, coutDuCapital: 0.13 } as const;
export const VALEUR_ACTUALISEE = FLUX.disponible / (FLUX.coutDuCapital - FLUX.croissance);

/* ---------------------------------------------------------------------------
 * LES TROIS COMPTES QUE WILFRID PORTE.
 * ------------------------------------------------------------------------- */

export interface Compte {
  id: "herlinval" | "lavaudiere" | "brivet";
  nom: string;
  honoraires: number;
  /** Ce que le compte apporte à l'EBE une fois ses consultants redéployés. */
  contribution: number;
  /** La chance que la relation tienne à la personne de Wilfrid plutôt qu'à l'équipe. */
  chancePersonnel: number;
  /** Le complément de prix attaché au compte, dans le montage équilibré et le maximal. */
  complement: { equilibre: number; maximal: number };
  /** La semaine où le client dit, à la tournée de présentation, s'il reste. */
  semaine: number;
}

export const COMPTES: readonly Compte[] = [
  {
    id: "herlinval",
    nom: "Herlinval Distribution",
    honoraires: 1250000,
    contribution: 190000,
    chancePersonnel: 0.6,
    complement: { equilibre: 250000, maximal: 550000 },
    semaine: 13,
  },
  {
    id: "lavaudiere",
    nom: "Lavaudière Agroalimentaire",
    honoraires: 900000,
    contribution: 140000,
    chancePersonnel: 0.5,
    complement: { equilibre: 200000, maximal: 450000 },
    semaine: 12,
  },
  {
    id: "brivet",
    nom: "les Fonderies du Brivet",
    honoraires: 650000,
    contribution: 100000,
    chancePersonnel: 0.4,
    complement: { equilibre: 150000, maximal: 300000 },
    semaine: 11,
  },
];
export const HERLINVAL = 0;
export const LAVAUDIERE = 1;

/** Ce qu'un compte vaut pour le cabinet : six fois sa contribution à l'EBE. */
export const valeurDuCompte = (c: Compte) => PACTE.multiple * c.contribution;
export const VALEUR_DES_COMPTES = COMPTES.reduce((s, c) => s + valeurDuCompte(c), 0);

/** La chance qu'un compte parte, sans rien organiser, selon ce qui le retient. */
export const DEPART = { personnel: 0.55, institutionnel: 0.06, plafond: 0.9 } as const;
/** Le risque de départ moyen d'un compte, sans rien organiser. */
export const departSansRien = (c: Compte) =>
  c.chancePersonnel * DEPART.personnel + (1 - c.chancePersonnel) * DEPART.institutionnel;
/** La perte attendue sur les trois comptes le lundi de l'annonce, si rien n'est organisé. */
export const PERTE_SANS_RIEN = COMPTES.reduce(
  (s, c) => s + departSansRien(c) * valeurDuCompte(c),
  0,
);

/**
 * La valeur de départ : la part des associés restants, et ce que l'annonce
 * leur fait déjà perdre. Le trimestre est jugé par rapport à elle.
 */
export const BASE = VALEUR_DE_LA_PART + (1 - PACTE.part) * PERTE_SANS_RIEN;

/* ---------------------------------------------------------------------------
 * LES OFFRES, LES CLAUSES, L'ACCOMPAGNEMENT, HALDEN.
 * ------------------------------------------------------------------------- */

export type Complement = "equilibre" | "maximal" | null;

export interface Offre {
  comptant: number;
  /** Payé en deux annuités, avec intérêts au taux du marché. */
  etale: number;
  complement: Complement;
  /** Ce que le complément de prix fait au risque de départ d'un compte intéressé. */
  facteur: number;
}

/** Les quatre offres de la semaine 4 : son prix, le pacte, le montage équilibré, le montage maximal. */
export const OFFRES: readonly Offre[] = [
  { comptant: PRIX_DEMANDE, etale: 0, complement: null, facteur: 1 },
  { comptant: PRIX_DU_PACTE, etale: 0, complement: null, facteur: 1 },
  { comptant: 1300000, etale: 300000, complement: "equilibre", facteur: 0.55 },
  { comptant: 1000000, etale: 0, complement: "maximal", facteur: 0.45 },
];

export const totalDuComplement = (o: Offre) =>
  o.complement ? COMPTES.reduce((s, c) => s + c.complement[o.complement!], 0) : 0;

/** Non-concurrence de deux ans et non-sollicitation de trois ans, limitées et payées. */
export const CLAUSES = { facteur: 0.7, contrepartie: 60000 } as const;
/** Six mois d'accompagnement : efficace si Wilfrid est intéressé au maintien du compte. */
export const ACCOMPAGNEMENT = {
  interesse: 0.35,
  sansInteret: 0.8,
  parCompte: 40000,
  tous: 120000,
  /** Ce que trois semaines d'arrêt de Wilfrid ôtent à l'accompagnement. */
  arret: 0.15,
} as const;

/**
 * HALDEN PARTNERS. Wilfrid rejoint Halden, avec la chance que ses choix
 * donnent : un refus sec ou une parole reprise l'y poussent, une offre qui
 * lui rend son prix s'il transmet ses comptes l'en éloigne. Halden lui
 * propose une part variable sur les clients apportés : le risque de départ de
 * chaque compte est multiplié par deux et demi, il n'accompagne plus
 * personne, et Halden débauche deux consultants de son équipe.
 */
export const HALDEN = {
  /** Selon la première réponse : son prix, le pacte sec, la méthode et le montage, l'expert d'abord. */
  reponse: [0.04, 0.35, 0.06, 0.2],
  /** Selon l'offre : son prix, le pacte comptant, le montage équilibré, le montage maximal. */
  offre: [0, 0.12, 0, 0.1],
  /** Lui avoir accordé son prix en semaine 1, puis lui offrir autre chose. */
  reniement: 0.25,
  /** Lui avoir demandé d'évaluer lui-même le risque de ses comptes. */
  question: 0.03,
  /** La signature reportée à l'automne, faute d'un associé pour suivre. */
  retard: 0.2,
  facteur: 2.5,
  /** Ce que la revue permet quand il part : aller voir le jour même les décideurs qui tenaient à lui. */
  defense: 0.6,
  debauchage: 60000,
  semaine: 7,
  semaineTardive: 11,
} as const;

/**
 * LE PROTOCOLE ET SON REFUS. Signer un complément indexé sur les honoraires
 * alors que Lavaudière gèle son budget, ou reprendre une part du prix : Wilfrid
 * peut refuser de signer. On passe alors par l'expert de l'article 1843-4 du
 * Code civil, qui applique le pacte et peut retenir ou non la décote ; les
 * clauses négociées tombent, l'accompagnement aussi, et le conflit pèse sur
 * les comptes.
 */
export const CONFLIT = {
  refusTelQuel: 0.5,
  refusRetrade: 0.6,
  retrade: 100000,
  facteur: 1.3,
  couts: 70000,
  semaine: 11,
} as const;
/** L'expert retiendra la décote ou non : le pacte est flou. Compté à son espérance. */
export const PRIX_EXPERT = (PRIX_DU_PACTE + VALEUR_DE_LA_PART) / 2;

/** Le plan d'économies de Lavaudière : 30 % de son budget de conseil gelé deux ans, chez tous les cabinets. */
export const LAVAUDIERE_GEL = { part: 0.3, annees: 2, seuil: 0.8, semaine: 9 } as const;
export const PERTE_GEL =
  LAVAUDIERE_GEL.part * LAVAUDIERE_GEL.annees * COMPTES[LAVAUDIERE]!.contribution;

/** Les budgets 2027 des industriels de l'Ouest : ce que valent les comptes gardés. */
export const MARCHES = [
  { id: "reprise", chance: 0.3, facteur: 1.1 },
  { id: "stable", chance: 0.45, facteur: 1 },
  { id: "repli", chance: 0.25, facteur: 0.88 },
] as const;
export type Marche = (typeof MARCHES)[number]["id"];
export const SEMAINE_MARCHE = 5;
export const FACTEUR_MARCHE_ATTENDU = MARCHES.reduce((s, m) => s + m.chance * m.facteur, 0);

/**
 * LA TRÉSORERIE. Le point bas de l'été, fin août, sans le rachat : 1,5 M€ à
 * 0,3 M€ près selon les paiements publics. Sous 600 k€, un mois de salaires
 * n'est plus couvert à moitié : il faut céder des créances en urgence.
 */
export const TRESORERIE = {
  pointBas: 1300000,
  ecart: 200000,
  seuil: 600000,
  fixe: 25000,
  taux: 0.06,
  semaine: 10,
} as const;
/** L'emprunt de la Banque de l'Erdre : cinq ans, frais de dossier selon sa réponse. */
export const EMPRUNT = { taux: 0.042, duree: 5, frais: 0.005, fraisNantissement: 0.008 } as const;
export const CHANCE_FRAIS_BAS = 0.6;
/** Deux des cinq associés n'ont pas la trésorerie personnelle : un sur deux ne suivra pas. */
export const ASSOCIES = { restants: 5, chanceDefaut: 0.45, semaine: 9, relais: 15000 } as const;

export const COUTS = { expert: 35000, revue: 12000, reindexation: 5000 } as const;
/** La semaine où la revue des comptes rend ses conclusions. */
export const SEMAINE_REVUE = 4;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  reponse: 0,
  revue: 1,
  offre: 2,
  clauses: 3,
  financement: 4,
  signature: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;

/**
 * Ne rien changer, décision par décision : attendre l'expert, ne pas sonder
 * les comptes, appliquer le pacte comptant, s'en tenir à sa clause, payer sur
 * la trésorerie, signer ce qui est rédigé.
 */
export const NEUTRE = [3, 2, 1, 0, 0, 0] as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: "retard" | "halden" | "manager" | "urssaf" | "arret";
  titre: string;
  de: string;
  role: string;
  texte: string;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "retard",
    titre: "Achats Publics de l'Ouest décale ses paiements",
    de: "Prune Lecoeur",
    role: "Contrôleuse de gestion",
    texte:
      "La centrale change de logiciel comptable : 400 k€ de nos factures validées ne seront payés qu'en septembre. Le point bas de trésorerie de l'été recule d'autant.",
  },
  {
    id: "halden",
    titre: "Halden Partners annonce un bureau à Nantes",
    de: "Victoire Lanoë",
    role: "Présidente d'Atlas Conseil",
    texte:
      "Halden ouvre à Nantes au printemps et cherche « des associés qui apportent leurs clients ». Nos clients industriels ont tous reçu le communiqué.",
  },
  {
    id: "manager",
    titre: "La manager du compte Herlinval démissionne",
    de: "Ysoline Labéguerie",
    role: "Manager, compte Herlinval",
    texte:
      "Je rejoins la direction des opérations d'un industriel en avril. Je le dis à Herlinval cette semaine ; ils perdent leur deuxième visage chez nous.",
  },
  {
    id: "urssaf",
    titre: "Le contrôle URSSAF se conclut",
    de: "Amalric Malivel",
    role: "Expert-comptable du cabinet",
    texte:
      "Le contrôle de l'automne se termine : 40 k€ de redressement sur les avantages en nature des associés. Rien de récurrent, mais il faut le payer.",
  },
  {
    id: "arret",
    titre: "Wilfrid en arrêt de travail trois semaines",
    de: "Mahalia Mardirossian",
    role: "Associée, Performance opérationnelle",
    texte:
      "Wilfrid s'est fait opérer du genou : trois semaines d'arrêt. Je tiens ses comités de pilotage, mais ses clients le réclament, et la passation prendra du retard.",
  },
];

export const EFFETS_IMPREVUS = {
  retard: 400000,
  halden: 1.15,
  manager: { facteur: 1.3, cout: 30000 },
  urssaf: 40000,
} as const;

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** La relation de chaque compte tient-elle à la personne de Wilfrid ? */
  personnel: readonly boolean[];
  /** Le tirage de chaque compte : il part si ce tirage est sous sa chance de partir. */
  uDepart: readonly number[];
  marche: Marche;
  uHalden: number;
  uRefus: number;
  uDefaut: number;
  uBanque: number;
  /** Le point bas de trésorerie de l'été, sans rachat ni imprévu. */
  pointBas: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/**
 * LES TIRAGES STRATIFIÉS. Les départs de comptes, Halden, le refus de signer
 * sont des événements rares et binaires : sur trente tirages indépendants, le
 * hasard d'échantillonnage pèserait autant que les décisions. Chacun de ces
 * tirages est donc pris dans une strate de largeur 1/30 qui dépend de la
 * graine, selon une permutation propre à chaque aléa (un hypercube latin) :
 * sur les trente graines du bilan, chaque aléa couvre exactement une fois
 * chaque strate, et les aléas restent indépendants entre eux. Chaque tirage
 * reste uniforme, et ne dépend que de la graine.
 */
const STRATES = 30;
const PERMUTATIONS: readonly (readonly number[])[] = (() => {
  const r = mulberry32(1000847);
  return Array.from({ length: 12 }, () => {
    const p = Array.from({ length: STRATES }, (_, i) => i);
    for (let i = STRATES - 1; i > 0; i -= 1) {
      const j = Math.floor(r() * (i + 1));
      [p[i], p[j]] = [p[j]!, p[i]!];
    }
    return p;
  });
})();

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000847 + 7);
  const strate = (((Math.floor(graine) - 1) % STRATES) + STRATES) % STRATES;
  let k = 0;
  /** Un tirage uniforme dans la strate de cette graine, pour le k-ième aléa. */
  const u = () => {
    const v = (PERMUTATIONS[k]![strate]! + r()) / STRATES;
    k += 1;
    return v;
  };
  const personnel = COMPTES.map((c) => u() < c.chancePersonnel);
  const uDepart = COMPTES.map(() => u());
  const um = u();
  const marche: Marche =
    um < MARCHES[0].chance
      ? "reprise"
      : um < MARCHES[0].chance + MARCHES[1].chance
        ? "stable"
        : "repli";
  const uHalden = u();
  const uRefus = u();
  const uDefaut = u();
  const uBanque = u();
  const pointBas = TRESORERIE.pointBas + TRESORERIE.ecart * borne(gauss(r), -2, 2);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    personnel,
    uDepart,
    marche,
    uHalden,
    uRefus,
    uDefaut,
    uBanque,
    pointBas,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const facteurDuMarche = (m: Marche) => MARCHES.find((x) => x.id === m)!.facteur;

/* ---------------------------------------------------------------------------
 * LES RÈGLES DU MONTAGE : qui est intéressé, qui est accompagné.
 * ------------------------------------------------------------------------- */

/** La chance que Wilfrid rejoigne Halden avant la fin des négociations, selon les trois premières décisions. */
export function chanceHalden(chemin: readonly number[]): number {
  const [d1, d2, d3] = chemin as [number, number, number];
  let p = HALDEN.reponse[d1]! + HALDEN.offre[d3]!;
  if (d2 === 1) p += HALDEN.question;
  if (d1 === 0 && d3 !== 0) p += HALDEN.reniement;
  return Math.min(0.9, p);
}

/** La chance qu'il refuse de signer le protocole, selon ce qu'on lui présente en semaine 10. */
export function chanceRefus(chemin: readonly number[]): number {
  const offre = OFFRES[chemin[D.offre]!]!;
  const d6 = chemin[D.signature];
  if (d6 === 3) return CONFLIT.refusRetrade;
  if (d6 === 0 && offre.complement) return CONFLIT.refusTelQuel;
  return 0;
}

/**
 * Les comptes que l'accompagnement ciblé vise : ceux que la revue a désignés,
 * tous les trois si Wilfrid l'a dit lui-même, Herlinval, le plus gros, faute
 * de mieux.
 */
export function cibles(chemin: readonly number[], graine: number): boolean[] {
  const d4 = chemin[D.clauses];
  if (d4 === 2) return COMPTES.map(() => true);
  if (d4 !== 3) return COMPTES.map(() => false);
  const d2 = chemin[D.revue];
  if (d2 === 0) return [...hasard(graine).personnel];
  if (d2 === 1) return COMPTES.map(() => true);
  return COMPTES.map((_, i) => i === HERLINVAL);
}

export interface Etat {
  halden: boolean;
  refus: boolean;
  defaut: boolean;
}

export interface Connu {
  /** La revue a dit ce qui retient chaque compte. */
  attachements: boolean;
  marche: boolean;
  lavaudiere: boolean;
  pointBas: boolean;
  banque: boolean;
  /** Les imprévus déjà tombés. */
  imprevus: ReadonlySet<Imprevu["id"]>;
}

const TOUT_CONNU = (h: Hasard): Connu => ({
  attachements: true,
  marche: true,
  lavaudiere: true,
  pointBas: true,
  banque: true,
  imprevus: new Set(h.imprevus.map((i) => i.imprevu.id)),
});

/** Le montage tel qu'il est signé, ou tel que le conflit le défait. */
export function montage(chemin: readonly number[], etat: Pick<Etat, "refus">) {
  const offre = OFFRES[chemin[D.offre]!]!;
  const d6 = chemin[D.signature]!;
  const avecComplement = offre.complement !== null;
  const persiste = d6 === 0 && avecComplement;
  const retrade = d6 === 3;
  const conflit = etat.refus && chanceRefus(chemin) > 0;
  /** Le complément de prix existe-t-il au contrat, compte par compte ? */
  const auContrat = COMPTES.map(
    (_, i) => !conflit && avecComplement && d6 !== 2 && !(i === LAVAUDIERE && retrade),
  );
  /** Wilfrid a-t-il un intérêt à garder le compte ? Pas pour Lavaudière, si le seuil d'honoraires le prive du complément. */
  const interesse = auContrat.map((x, i) => x && !(i === LAVAUDIERE && persiste));
  return { offre, avecComplement, persiste, retrade, conflit, auContrat, interesse };
}

/**
 * LA CHANCE DE DÉPART D'UN COMPTE, selon ce qui le retient et tout ce que le
 * trimestre a décidé : montage, clauses, accompagnement, Halden, conflit,
 * imprévus connus.
 */
export function chanceDepart(
  chemin: readonly number[],
  graine: number,
  i: number,
  personnel: boolean,
  etat: Etat,
  imprevusConnus: ReadonlySet<Imprevu["id"]>,
): number {
  const m = montage(chemin, etat);
  const d4 = chemin[D.clauses]!;
  let p = personnel ? DEPART.personnel : DEPART.institutionnel;
  if (m.interesse[i]) p *= m.offre.facteur;
  if (!m.conflit && d4 >= 1) p *= CLAUSES.facteur;
  if (!m.conflit && !etat.halden && cibles(chemin, graine)[i]) {
    const arret = imprevusConnus.has("arret") ? ACCOMPAGNEMENT.arret : 0;
    p *= (m.interesse[i] ? ACCOMPAGNEMENT.interesse : ACCOMPAGNEMENT.sansInteret) + arret;
  }
  if (etat.halden) p *= HALDEN.facteur * (personnel && chemin[D.revue] === 0 ? HALDEN.defense : 1);
  if (m.conflit) p *= CONFLIT.facteur;
  if (imprevusConnus.has("halden")) p *= EFFETS_IMPREVUS.halden;
  if (i === HERLINVAL && imprevusConnus.has("manager")) p *= EFFETS_IMPREVUS.manager.facteur;
  return Math.min(DEPART.plafond, p);
}

/** Le coût d'un point bas sous le seuil : l'affacturage en urgence. */
export function coutDeTension(pointBas: number, sortie: number): number {
  const manque = TRESORERIE.seuil - (pointBas - sortie);
  return manque > 0 ? TRESORERIE.fixe + TRESORERIE.taux * manque : 0;
}

/** Onze points également probables d'une loi normale réduite : l'espérance d'un coût convexe. */
const QUANTILES = [-1.69, -1.1, -0.75, -0.47, -0.23, 0, 0.23, 0.47, 0.75, 1.1, 1.69];

/** Le coût de tension attendu tant que le point bas n'est pas connu. */
export function tensionAttendue(sortie: number, retard: number): number {
  return (
    QUANTILES.reduce(
      (s, z) => s + coutDeTension(TRESORERIE.pointBas + TRESORERIE.ecart * z - retard, sortie),
      0,
    ) / QUANTILES.length
  );
}

/** Les départs réels, une fois tout connu : le tirage de chaque compte contre sa chance. */
export function departs(chemin: readonly number[], graine: number): boolean[] {
  const h = hasard(graine);
  const etat = etatReel(chemin, graine);
  const connus = TOUT_CONNU(h).imprevus;
  return COMPTES.map(
    (_, i) => h.uDepart[i]! < chanceDepart(chemin, graine, i, h.personnel[i]!, etat, connus),
  );
}

/** Ce que le trimestre fait vraiment : Halden, le refus de signer, la défaillance d'un associé. */
export function etatReel(chemin: readonly number[], graine: number): Etat {
  const h = hasard(graine);
  const defaut = chemin[D.financement] === 2 && h.uDefaut < ASSOCIES.chanceDefaut;
  const ph = chanceHalden(chemin) + (defaut ? HALDEN.retard : 0);
  return {
    halden: h.uHalden < Math.min(0.95, ph),
    refus: h.uRefus < chanceRefus(chemin),
    defaut,
  };
}

/** La semaine où l'on apprend que Wilfrid rejoint Halden, ou `null`. */
export function semaineHalden(chemin: readonly number[], graine: number): number | null {
  const h = hasard(graine);
  if (!etatReel(chemin, graine).halden) return null;
  return h.uHalden < chanceHalden(chemin) ? HALDEN.semaine : HALDEN.semaineTardive;
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, DANS UN ÉTAT DU MONDE DONNÉ.
 * ------------------------------------------------------------------------- */

export interface Bilan {
  valeur: number;
  /** Le prix attendu des parts : comptant, étalé, complément dû. */
  prix: number;
  comptant: number;
  complement: number;
  /** La valeur des comptes perdue ou exposée : départ attendu ou constaté. */
  exposee: number;
  /** Le point bas de trésorerie de l'été, rachat compris. */
  pointBas: number;
  couts: number;
}

function bilanDans(
  chemin: readonly number[],
  graine: number,
  jours: number,
  etat: Etat,
  connu: Connu,
  /** Les comptes dont on connaît la réponse, et le départ réel. */
  reponses: readonly (boolean | null)[],
): Bilan {
  const h = hasard(graine);
  const [d1, d2, , d4, d5, d6] = chemin as readonly [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const m = montage(chemin, etat);
  const mk = connu.marche ? facteurDuMarche(h.marche) : FACTEUR_MARCHE_ATTENDU;

  let perte = 0;
  let exposee = 0;
  let complement = 0;
  COMPTES.forEach((c, i) => {
    const etats = connu.attachements
      ? [{ p: 1, personnel: h.personnel[i]! }]
      : [
          { p: c.chancePersonnel, personnel: true },
          { p: 1 - c.chancePersonnel, personnel: false },
        ];
    const q =
      reponses[i] !== null
        ? reponses[i]
          ? 1
          : 0
        : etats.reduce(
            (s, e) => s + e.p * chanceDepart(chemin, graine, i, e.personnel, etat, connu.imprevus),
            0,
          );
    const A = valeurDuCompte(c);
    exposee += q * A;
    perte += q * A + (1 - q) * A * (1 - mk);
    if (i === LAVAUDIERE && connu.lavaudiere) perte += (1 - q) * PERTE_GEL;
    // Le complément est dû pour un compte gardé ; sur les honoraires, Lavaudière passe sous le seuil.
    if (m.auContrat[i] && !(i === LAVAUDIERE && m.persiste && connu.lavaudiere)) {
      complement += (1 - q) * c.complement[m.offre.complement!];
    }
  });

  let comptant: number;
  let etale = 0;
  if (m.conflit) {
    comptant = PRIX_EXPERT;
    complement = 0;
  } else {
    comptant = m.offre.comptant - (m.retrade ? CONFLIT.retrade : 0);
    etale = m.offre.etale;
    if (d6 === 2 && m.avecComplement) {
      comptant += totalDuComplement(m.offre);
      complement = 0;
    }
  }
  const prix = comptant + etale + complement;

  let couts = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  if (d1 === 3) couts += COUTS.expert;
  if (d2 === 0) couts += COUTS.revue;
  if (!m.conflit && d4 >= 1) couts += CLAUSES.contrepartie;
  if (!m.conflit && !etat.halden) {
    if (d4 === 2) couts += ACCOMPAGNEMENT.tous;
    if (d4 === 3) couts += ACCOMPAGNEMENT.parCompte * cibles(chemin, graine).filter(Boolean).length;
  }
  if (etat.halden) couts += HALDEN.debauchage;
  if (etat.defaut) couts += ASSOCIES.relais;
  if (m.conflit) couts += CONFLIT.couts;
  if (!m.conflit && d6 === 1 && m.avecComplement) couts += COUTS.reindexation;
  if (connu.imprevus.has("urssaf")) couts += EFFETS_IMPREVUS.urssaf;
  if (connu.imprevus.has("manager")) couts += EFFETS_IMPREVUS.manager.cout;

  // Le financement : ce qui sort de la trésorerie, ce que coûte l'emprunt.
  const sortie = d5 === 0 ? comptant : d5 === 2 && etat.defaut ? comptant / ASSOCIES.restants : 0;
  if (d5 === 1) {
    const frais = connu.banque
      ? h.uBanque < CHANCE_FRAIS_BAS
        ? EMPRUNT.frais
        : EMPRUNT.fraisNantissement
      : CHANCE_FRAIS_BAS * EMPRUNT.frais + (1 - CHANCE_FRAIS_BAS) * EMPRUNT.fraisNantissement;
    couts += frais * comptant;
  }
  const retard = connu.imprevus.has("retard") ? EFFETS_IMPREVUS.retard : 0;
  couts += connu.pointBas
    ? coutDeTension(h.pointBas - retard, sortie)
    : tensionAttendue(sortie, retard);
  const pointBas = (connu.pointBas ? h.pointBas : TRESORERIE.pointBas) - retard - sortie;

  return {
    valeur: BASE - perte - prix - couts,
    prix,
    comptant,
    complement,
    exposee,
    pointBas,
    couts,
  };
}

/* ---------------------------------------------------------------------------
 * CE QUE L'ON SAIT À LA FIN D'UNE SEMAINE : les aléas encore inconnus
 * comptent pour leur espérance.
 * ------------------------------------------------------------------------- */

export function estimer(
  chemin: readonly number[],
  graine: number,
  w: number,
  jours: number,
): Bilan & { chanceHalden: number } {
  const h = hasard(graine);
  const eff = chemin.map((c, k) => (w >= EFFET[k]! ? c : NEUTRE[k]!));
  const reel = etatReel(eff, graine);
  const connu: Connu = {
    attachements: eff[D.revue] === 0 && w >= SEMAINE_REVUE,
    marche: w >= SEMAINE_MARCHE,
    lavaudiere: w >= LAVAUDIERE_GEL.semaine,
    pointBas: w >= TRESORERIE.semaine,
    banque: eff[D.financement] === 1 && w >= EFFET[D.financement],
    imprevus: new Set(h.imprevus.filter((i) => i.semaine <= w).map((i) => i.imprevu.id)),
  };
  const reel13 = departs(eff, graine);
  const reponses = COMPTES.map((c, i) => (w >= c.semaine ? reel13[i]! : null));

  // Les états encore possibles, et leur chance.
  const ph1 = chanceHalden(eff);
  const defautConnu = eff[D.financement] !== 2 || w >= ASSOCIES.semaine;
  const defauts: { v: boolean; p: number }[] = defautConnu
    ? [{ v: reel.defaut, p: 1 }]
    : [
        { v: true, p: ASSOCIES.chanceDefaut },
        { v: false, p: 1 - ASSOCIES.chanceDefaut },
      ];
  const pr = chanceRefus(eff);
  const refus: { v: boolean; p: number }[] =
    w >= CONFLIT.semaine || pr === 0
      ? [{ v: reel.refus, p: 1 }]
      : [
          { v: true, p: pr },
          { v: false, p: 1 - pr },
        ];
  let total: Bilan | null = null;
  let chanceH = 0;
  const ajoute = (b: Bilan, p: number) => {
    if (!total) {
      total = {
        valeur: 0,
        prix: 0,
        comptant: 0,
        complement: 0,
        exposee: 0,
        pointBas: 0,
        couts: 0,
      };
    }
    const t = total as Bilan;
    t.valeur += p * b.valeur;
    t.prix += p * b.prix;
    t.comptant += p * b.comptant;
    t.complement += p * b.complement;
    t.exposee += p * b.exposee;
    t.pointBas += p * b.pointBas;
    t.couts += p * b.couts;
  };
  for (const d of defauts) {
    const ph = Math.min(0.95, ph1 + (d.v ? HALDEN.retard : 0));
    let pH: number;
    if (w >= HALDEN.semaineTardive) pH = reel.halden ? 1 : 0;
    else if (w >= HALDEN.semaine) {
      pH = h.uHalden < ph1 ? 1 : (ph - Math.min(ph, ph1)) / Math.max(1e-9, 1 - ph1);
    } else pH = ph;
    for (const r of refus) {
      for (const [hv, p] of [
        [true, pH],
        [false, 1 - pH],
      ] as const) {
        const poids = d.p * r.p * p;
        if (poids <= 0) continue;
        chanceH += d.p * r.p * (hv ? p : 0);
        ajoute(
          bilanDans(eff, graine, jours, { halden: hv, refus: r.v, defaut: d.v }, connu, reponses),
          poids,
        );
      }
    }
  }
  return { ...(total as unknown as Bilan), chanceHalden: chanceH };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  variation: number;
  prix: number;
  exposee: number;
  pointBas: number;
  /** La chance, vue de cette semaine, que Wilfrid rejoigne Halden. */
  halden: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  prix: number;
  comptant: number;
  complement: number;
  couts: number;
  pointBas: number;
  /** Les comptes partis, dans l'ordre de COMPTES. */
  partis: readonly boolean[];
  personnel: readonly boolean[];
  halden: boolean;
  semaineHalden: number | null;
  refus: boolean;
  conflit: boolean;
  defaut: boolean;
  marche: Marche;
  tension: boolean;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  let avant = 0;
  let fin: (Bilan & { chanceHalden: number }) | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      prix: e.prix,
      exposee: e.exposee,
      pointBas: e.pointBas,
      halden: e.chanceHalden,
    });
    avant = e.valeur;
    fin = e;
  }
  const etat = etatReel(chemin, graine);
  const m = montage(chemin, etat);
  return {
    semaines,
    objectif: fin!.valeur,
    prix: fin!.prix,
    comptant: fin!.comptant,
    complement: fin!.complement,
    couts: fin!.couts,
    pointBas: fin!.pointBas,
    partis: departs(chemin, graine),
    personnel: h.personnel,
    halden: etat.halden,
    semaineHalden: semaineHalden(chemin, graine),
    refus: etat.refus,
    conflit: m.conflit,
    defaut: etat.defaut,
    marche: h.marche,
    tension: fin!.pointBas < TRESORERIE.seuil,
  };
}

/** Ce qui s'est passé pendant des semaines : marché, Halden, Lavaudière, banque, refus, comptes, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const t = simuler(chemin, graine);
  return {
    marche: dans(SEMAINE_MARCHE),
    halden: t.semaineHalden !== null && dans(t.semaineHalden),
    lavaudiere: dans(LAVAUDIERE_GEL.semaine),
    associes: chemin[D.financement] === 2 && dans(ASSOCIES.semaine),
    pointBas: dans(TRESORERIE.semaine),
    signature: dans(CONFLIT.semaine),
    comptes: COMPTES.map((c) => dans(c.semaine)),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAssocie {
  valeur: number | null;
  prix: number | null;
  exposee: number | null;
  pointBas: number | null;
  halden: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  marche: number | null;
  partis: number | null;
  /** Ce que la revue a dit, compte par compte (1 : Herlinval, 2 : Lavaudière, 4 : le Brivet tiennent à Wilfrid). */
  attachements: number | null;
  /** Le point bas de l'été prévu sans le rachat, imprévus connus compris. */
  pointBasSans: number | null;
  /** 1 quand on sait que Wilfrid rejoint Halden. */
  haldenConnu: number | null;
}

/** Le masque des comptes qui tiennent à la personne de Wilfrid. */
export const masqueDesAttachements = (personnel: readonly boolean[]) =>
  personnel.reduce((m, x, i) => m + (x ? 2 ** i : 0), 0);

/**
 * Ce que Gustave lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAssocie {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      valeur: 0,
      prix: PRIX_DU_PACTE,
      exposee: PERTE_SANS_RIEN,
      pointBas: TRESORERIE.pointBas,
      halden: 0,
      marche: null,
      partis: 0,
      attachements: null,
      pointBasSans: TRESORERIE.pointBas,
      haldenConnu: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const h = hasard(graine);
  return {
    valeur: s.valeur,
    prix: s.prix,
    exposee: s.exposee,
    pointBas: s.pointBas,
    halden: s.halden,
    marche: semaine >= SEMAINE_MARCHE ? MARCHES.findIndex((m) => m.id === h.marche) : null,
    partis: COMPTES.filter((c, i) => semaine >= c.semaine && t.partis[i]).length,
    attachements:
      chemin[D.revue] === 0 && semaine >= SEMAINE_REVUE ? masqueDesAttachements(h.personnel) : null,
    pointBasSans:
      (semaine >= TRESORERIE.semaine ? h.pointBas : TRESORERIE.pointBas) -
      (h.imprevus.some((i) => i.imprevu.id === "retard" && i.semaine <= semaine)
        ? EFFETS_IMPREVUS.retard
        : 0),
    haldenConnu: t.semaineHalden !== null && t.semaineHalden <= semaine ? 1 : 0,
  };
}
