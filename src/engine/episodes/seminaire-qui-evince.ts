/**
 * LE SÉMINAIRE QUI CHASSE LES CLIENTS — le modèle de L'Escale Évian.
 *
 * Anton Leclercq vend les groupes et les séminaires d'Escale Événements à
 * L'Escale Évian : 66 chambres sur le lac Léman, des salles de séminaire, une
 * Table d'Augustin. De mai à juillet, les demandes de groupes arrivent pour
 * juin et juillet, les mois où l'hôtel se remplit aussi de clients
 * individuels. Treize semaines, six décisions, nuit par nuit.
 *
 * Le trimestre est jugé sur la CONTRIBUTION de l'hôtel : la marge sur coûts
 * variables de l'hébergement, de la restauration et des salles, groupes et
 * individuels confondus. Trois mécanismes font l'épisode, et le joueur doit
 * les découvrir :
 *
 *   · LE DÉPLACEMENT. Une chambre ne se vend qu'une fois par nuit : un groupe
 *     qui bloque 55 chambres un mardi de juin chasse les clients individuels
 *     qui les auraient prises, à un prix moyen bien plus haut, et qui
 *     auraient dîné à la Table d'Augustin. Un groupe se juge donc sur sa
 *     contribution totale MOINS celle des individuels qu'il évince. Le même
 *     séminaire, au même prix, vaut peu en juin et beaucoup sur des dates
 *     creuses de fin mai, où il n'évince presque personne.
 *   · L'ATTRITION. Un groupe réserve plus de chambres qu'il n'en occupe. La
 *     chambre est périssable : rendue à J-7, elle se revend mal (une fois sur cinq) ;
 *     rendue à J-21, presque toujours (85 %). Sans clause, les chambres vides
 *     ne rapportent rien ; une date limite de libération les remet en vente à
 *     temps, une clause d'attrition fait payer ce qui est rendu trop tard, un
 *     acompte couvre l'annulation.
 *   · LES MARGES NE SONT PAS LES MÊMES. Une salle louée garde 90 % de son
 *     prix, un dîner de gala un peu plus de 60 %, une chambre de groupe moins
 *     que la chambre individuelle qu'elle remplace. Un groupe dont le prix
 *     chambre est bas peut valoir beaucoup par ses salles et sa restauration ;
 *     un groupe qui remplit l'hôtel peut ne rien valoir.
 *
 * Deux décisions demandent plus qu'un calcul. Avant de signer une série de
 * juillet, lire le pick-up coûte deux jours et 600 €, et change la réponse :
 * la série ne vaut que si l'été est mou. Quand un groupe annonce des chambres
 * libres, les reprendre tout de suite vaut mieux que tenir un bloc signé. Et
 * un groupe protège aussi d'un été mou : signer la série sans attendre est
 * l'option la plus sûre, pas la meilleure en moyenne.
 *
 * Le hasard porte sur la demande individuelle de l'été (un SCÉNARIO de marché
 * tiré d'avance : plus forte que la prévision, conforme ou plus molle), le
 * bruit de chaque semaine, ce que les groupes occupent vraiment, la réponse
 * des clients aux contre-propositions, et les imprévus. Il ne dépend jamais
 * des décisions : une même graine donne les mêmes tirages quelles qu'elles
 * soient. Pur et déterministe. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Du lundi 4 mai au dimanche 2 août : quatre-vingt-onze nuits, la nuit 0 étant celle du 4 mai. */
export const NUITS = 91;
export const CHAMBRES = 66;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des demandes de petits groupes de mai restent sans réponse. */
export const PERTE_PAR_JOUR = 1500;

/* ---------------------------------------------------------------------------
 * LE CALENDRIER ET LA DEMANDE INDIVIDUELLE.
 * ------------------------------------------------------------------------- */

/** La saison tarifaire d'une nuit : 0 mai, 1 juin, 2 juillet (et les deux nuits d'août). */
export const saison = (i: number) => (i < 28 ? 0 : i < 58 ? 1 : 2);
export const semaineDe = (i: number) => Math.floor(i / 7) + 1;

/**
 * LA PRÉVISION D'OCCUPATION INDIVIDUELLE, par jour de la semaine (lundi à
 * dimanche) : la demande attendue en chambres, sans les groupes. Mai est
 * creux en semaine, sauf les ponts de l'Ascension et de la Pentecôte ; juin
 * se remplit ; juillet est plein.
 */
export const PREVISION = {
  mai: [28, 30, 34, 31, 46, 52, 24],
  juin: [50, 58, 61, 57, 62, 64, 44],
  juillet: [58, 60, 62, 63, 65, 66, 54],
} as const;
/** L'Ascension (jeudi 14 mai) et la Pentecôte (samedi 23 au lundi 25 mai). */
export const PONTS: Readonly<Record<number, number>> = {
  10: 58,
  11: 62,
  12: 64,
  13: 40,
  19: 62,
  20: 50,
  21: 36,
};
export const prevision = (i: number): number =>
  PONTS[i] ?? [PREVISION.mai, PREVISION.juin, PREVISION.juillet][saison(i)]![i % 7]!;

/** Le prix moyen des chambres individuelles, prévu, par saison. */
export const PRIX_MOYEN = [178, 232, 258] as const;

/** Ce que coûte et rapporte une nuitée individuelle, en plus de son prix. */
export const INDIVIDUELS = {
  /** La part des nuitées vendues par Bookalia et Voyagio, et leur commission. */
  partPlateformes: 0.45,
  commission: 0.17,
  /** Linge de la Blanchisserie du Fier, produits d'accueil, énergie, ménage à la tâche. */
  coutVariable: 30,
} as const;

/** Les clients individuels qui dînent à la Table d'Augustin. */
export const DINER = { part: 0.45, couverts: 2, ticket: 42, marge: 0.65 } as const;
/** La marge des dîners, par nuitée individuelle. */
export const DINER_PAR_NUITEE = DINER.part * DINER.couverts * DINER.ticket * DINER.marge;

/** La commission moyenne des plateformes, en part du prix d'une nuitée individuelle. */
export const COMMISSION_MOYENNE = INDIVIDUELS.partPlateformes * INDIVIDUELS.commission;

/** Ce que rapporte une nuitée individuelle : marge de la chambre et du dîner, commission déduite. */
export const valeurIndividuelle = (prix: number, coutVariable: number = INDIVIDUELS.coutVariable) =>
  prix * (1 - COMMISSION_MOYENNE) - coutVariable + DINER_PAR_NUITEE;

/** Le bar, les clients extérieurs du restaurant, les petites réunions : la contribution de chaque semaine. */
export const AUTRES = [9000, 12000, 15000] as const;

/**
 * LE SCÉNARIO DE L'ÉTÉ : la demande individuelle de juin et juillet, plus forte
 * que la prévision, conforme, ou plus molle. Le pick-up de l'été est en retard
 * sur l'an dernier : une fenêtre de réservation qui se raccourcit, ou une
 * demande qui faiblit. Révélé fin juin.
 */
export const SCENARIOS = [
  { id: "fort", nom: "Été plus fort que prévu", chance: 0.3, demande: 1.03, prix: 1.01 },
  { id: "conforme", nom: "Été conforme à la prévision", chance: 0.4, demande: 1, prix: 1 },
  { id: "mou", nom: "Été plus mou", chance: 0.3, demande: 0.92, prix: 0.98 },
] as const;
/** La semaine où le revenue management sait ce que sera l'été. */
export const REVELATION = 8;

/* ---------------------------------------------------------------------------
 * LES GROUPES DU TRIMESTRE.
 * ------------------------------------------------------------------------- */

/**
 * LE SÉMINAIRE DES LABORATOIRES ORVANDEL, demandé par l'agence Lacustra
 * Événements : 55 chambres du mardi 16 au jeudi 18 juin, 60 participants,
 * journées d'étude et dîners de groupe en salle.
 */
export const SEMINAIRE = {
  chambres: 55,
  participants: 60,
  prix: 158,
  /** Le prix qui couvre le déplacement en juin, si l'on garde les dates, même avec un quart d'attrition. */
  prixDeplacement: 228,
  /** La commission de l'agence, sur l'hébergement. */
  commission: 0.1,
  /** Le forfait journée d'étude : salle plénière, sous-commissions, pauses, déjeuner. */
  forfait: 65,
  margeForfait: 0.6,
  diner: 45,
  margeDiner: 0.6,
  juin: [43, 44, 45],
  /** Les dates creuses : du mardi 26 au jeudi 28 mai. */
  mai: [22, 23, 24],
  /** Le bloc ramené à 30 chambres, les autres participants à l'hôtel partenaire de Thonon. */
  partenaire: 30,
  /** La part du bloc occupée en moyenne par un séminaire de laboratoire, et son écart. */
  occupation: 0.78,
  ecart: 0.04,
} as const;

/** La réponse d'Orvandel aux contre-propositions. */
export const REPONSE_SEMINAIRE = {
  /** Fin mai au prix demandé, ou juin au prix du déplacement : mai, juin, ou ailleurs. */
  dates: { mai: 0.55, juin: 0.15 },
  /** Juin avec un bloc de 30 chambres et l'hôtel partenaire. */
  partenaire: 0.5,
} as const;

/** Une annulation (report du séminaire) un peu plus d'une fois sur dix, connue en semaine 3. */
export const ANNULATION = { chance: 0.12, semaine: 3 } as const;

/**
 * LES CONDITIONS DE VENTE DES GROUPES du trimestre, selon la décision 2 :
 * le contrat type de l'agence, trois clauses négociées, ou la garantie totale.
 */
export const CONDITIONS = [
  { nom: "contrat type", liberation: 7, tolerance: 1, facturation: 0, acompte: 0.1 },
  { nom: "trois clauses", liberation: 21, tolerance: 0.1, facturation: 0.8, acompte: 0.3 },
  { nom: "garantie totale", liberation: 0, tolerance: 0, facturation: 1, acompte: 0.5 },
] as const;
/** La garantie totale, les clients la refusent souvent : la chance que chacun parte ailleurs. */
export const REFUS_GARANTIE = { seminaire: 0.45, convention: 0.35, serie: 0.35 } as const;
/** La part du séminaire dont l'attrition est connue à J-21 ; le reste se découvre à J-7. */
export const ATTRITION_CONNUE = 0.5;

/** La part des chambres rendues qui se revendent aux individuels, selon le délai. */
export const REVENTE = { j21: 0.85, j17: 0.85, j10: 0.6, j7: 0.2 } as const;

/**
 * LA CONVENTION DE LA MAISON MÉLIZANE, en direct : 30 chambres trois nuits,
 * du lundi 6 au jeudi 9 juillet, la salle plénière le mardi et le mercredi,
 * et un dîner de gala de 140 couverts le mercredi, Table d'Augustin
 * privatisée.
 */
export const CONVENTION = {
  nuits: [63, 64, 65],
  /** Les deux journées de convention : salle plénière, pauses et déjeuners. */
  journees: [64, 65],
  chambres: 30,
  prix: 145,
  participants: 35,
  forfait: 40,
  margeForfait: 0.6,
  salle: 2800,
  margeSalle: 0.9,
  gala: {
    nuit: 65,
    invites: 105,
    ticket: 89,
    matiere: 0.32,
    autres: 0.05,
    extras: 6,
    coutExtra: 190,
  },
  /** Ce que la privatisation fait perdre : les clients extérieurs du soir, et les dîners des clients de l'hôtel. */
  exterieurs: 40,
  /** Le bloc ramené à 15 chambres, le reste à l'hôtel partenaire : Mélizane accepte une fois sur deux à peu près. */
  reduit: 15,
  accepteReduit: 0.45,
  /** La part du bloc occupée une fois la réorganisation annoncée, entre ces deux bornes. */
  occupation: [0.45, 0.6],
} as const;

/** La marge d'un couvert du dîner de gala : matière et autres coûts variables déduits. */
export const MARGE_GALA_PAR_COUVERT =
  CONVENTION.gala.ticket * (1 - CONVENTION.gala.matiere - CONVENTION.gala.autres);

/**
 * LA SÉRIE DE TAVENNE VOYAGES : 24 chambres chaque nuit du jeudi 9 au
 * mercredi 29 juillet, pour ses circuits « Lac et montagnes », demi-pension.
 */
export const SERIE = {
  premiere: 66,
  derniere: 86,
  chambres: 24,
  prix: 175,
  participants: 45,
  /** La marge du dîner de groupe par participant : 32 € à 60 %. */
  diner: 32,
  margeDiner: 0.6,
  occupation: 0.95,
} as const;
export const NUITS_SERIE = Array.from(
  { length: SERIE.derniere - SERIE.premiere + 1 },
  (_, k) => SERIE.premiere + k,
);

/**
 * L'ANALYSE DU PICK-UP de juillet par le revenue management : deux jours et
 * 600 € de données de marché. La chance qu'elle conclue à une baisse de la
 * demande, selon l'été réel ; Tavenne ne l'attend pas une fois sur dix.
 */
export const ANALYSE = { cout: 600, baisse: [0.05, 0.15, 0.9], depart: 0.1, semaine: 6 } as const;

/**
 * LES DEMANDES DE DERNIÈRE MINUTE DE JUILLET, auxquelles la grille de prix de
 * la décision 6 répond.
 */
export const DEMANDES = [
  {
    id: "cyclo",
    nom: "Le club de cyclotourisme de Bourg",
    nuits: [69, 70],
    chambres: 18,
    prix: 150,
    participants: 34,
    fb: 19.2,
    salle: 0,
  },
  {
    id: "direction",
    nom: "Le comité de direction d'une PME genevoise",
    nuits: [78, 79],
    chambres: 12,
    prix: 190,
    participants: 12,
    fb: 30,
    salle: 2520,
  },
  {
    id: "chorale",
    nom: "Une chorale en tournée",
    nuits: [81, 82],
    chambres: 25,
    prix: 140,
    participants: 48,
    fb: 19.2,
    salle: 0,
  },
  {
    id: "golf",
    nom: "Un groupe de golfeurs",
    nuits: [83, 84],
    chambres: 16,
    prix: 160,
    participants: 30,
    fb: 19.2,
    salle: 0,
  },
  {
    id: "entreprise",
    nom: "Le voyage d'une entreprise lyonnaise",
    nuits: [86, 87],
    chambres: 28,
    prix: 150,
    participants: 50,
    fb: 19.2,
    salle: 0,
  },
] as const;
/** La grille unique de l'été. */
export const GRILLE = 150;
/** La chance qu'un groupe accepte le prix de déplacement quand il est au-dessus de ce qu'il proposait. */
export const ACCEPTE_PLANCHER = 0.25;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  seminaire: 0,
  contrat: 1,
  convention: 2,
  serie: 3,
  signal: 4,
  grille: 5,
} as const;

/** Ne rien changer : décliner, le contrat type, refuser Mélizane et Tavenne, tenir les blocs, fermer les groupes. */
export const NEUTRE = [3, 0, 0, 2, 0, 2] as const;

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
    /** La demande individuelle de la semaine, multipliée. */
    demande?: number;
    /** Le coût variable de chaque nuitée, à partir de cette semaine. */
    coutVariable?: number;
    /** Un coût de la semaine. */
    cout?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "climatisation",
    titre: "La climatisation de la salle plénière lâche",
    de: "Lancelot Vuagnat",
    role: "Responsable technique de L'Escale Évian",
    texte:
      "Le compresseur de la climatisation de la salle plénière a lâché. Réparation en urgence, location d'un groupe mobile et gestes pour les clients qui avaient réservé la salle : 3 500 €.",
    effet: { cout: 3500 },
  },
  {
    id: "greve",
    titre: "Grève des trains sur la rive sud du Léman",
    de: "Léonie Combaz",
    role: "Cheffe de réception",
    texte:
      "Les trains régionaux ne circulent plus entre Genève et Évian toute la semaine. Les annulations de dernière minute s'enchaînent : la demande individuelle de la semaine perd 8 %.",
    effet: { demande: 0.92 },
  },
  {
    id: "blanchisserie",
    titre: "La Blanchisserie du Fier augmente ses tarifs",
    de: "Aliénor Duchosal",
    role: "Directrice de L'Escale Évian",
    texte:
      "La Blanchisserie du Fier répercute la hausse de l'énergie : le linge d'une nuitée coûte 2 € de plus, jusqu'à la fin de l'été.",
    effet: { coutVariable: 2 },
  },
  {
    id: "congres",
    titre: "Un congrès médical sature les hôtels de Genève",
    de: "Lucile Fabbri",
    role: "Revenue manager du Groupe Escale",
    texte:
      "Un congrès médical de cinq mille participants remplit les hôtels de Genève : ceux qui n'y trouvent pas de chambre descendent jusqu'à Évian. La demande individuelle de la semaine prend 10 %.",
    effet: { demande: 1.1 },
  },
  {
    id: "hosteo",
    titre: "Panne de Hostéo et du gestionnaire de canaux",
    de: "Léonie Combaz",
    role: "Cheffe de réception",
    texte:
      "Hostéo et le gestionnaire de canaux sont tombés deux jours : plus de disponibilités sur Bookalia ni sur Voyagio. Les réservations de la semaine perdent 6 %.",
    effet: { demande: 0.94 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart de la demande individuelle de chaque semaine à la prévision (indices 1 à 13). */
  bruit: readonly number[];
  /** L'été : 0 fort, 1 conforme, 2 mou. */
  scenario: number;
  /** La réponse d'Orvandel à une contre-proposition. */
  uSeminaire: number;
  /** Les clients refusent-ils la garantie totale ? */
  uGarantieSeminaire: number;
  uGarantieConvention: number;
  uGarantieSerie: number;
  /** Le séminaire est-il annulé ? */
  uAnnulation: number;
  /** La part du bloc que le séminaire occupe vraiment. */
  occupationSeminaire: number;
  /** Celle de la convention Mélizane, après la réorganisation. */
  occupationConvention: number;
  /** Mélizane accepte-t-elle un bloc réduit ? */
  uReduit: number;
  /** Tavenne attend-il l'analyse ? Que conclut-elle ? */
  uAttente: number;
  uAnalyse: number;
  /** Chaque demande de juillet accepte-t-elle le prix de déplacement ? */
  uDemandes: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000427 + 7);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.03 * gauss(r), -0.07, 0.07));
  const us = r();
  const scenario =
    us < SCENARIOS[0].chance ? 0 : us < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const uSeminaire = r();
  const uGarantieSeminaire = r();
  const uGarantieConvention = r();
  const uGarantieSerie = r();
  const uAnnulation = r();
  const occupationSeminaire = borne(
    SEMINAIRE.occupation + SEMINAIRE.ecart * gauss(r),
    SEMINAIRE.occupation - 0.1,
    SEMINAIRE.occupation + 0.1,
  );
  const [bas, haut] = CONVENTION.occupation;
  const occupationConvention = bas + (haut - bas) * r();
  const uReduit = r();
  const uAttente = r();
  const uAnalyse = r();
  const uDemandes = DEMANDES.map(() => r());
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    scenario,
    uSeminaire,
    uGarantieSeminaire,
    uGarantieConvention,
    uGarantieSerie,
    uAnnulation,
    occupationSeminaire,
    occupationConvention,
    uReduit,
    uAttente,
    uAnalyse,
    uDemandes,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

export type StatutSeminaire =
  | "decline"
  | "juin"
  | "mai"
  | "juinPrixPlein"
  | "partenaire"
  | "ailleurs"
  | "refusGarantie"
  | "annule";

/** Ce qu'Orvandel fait de la réponse d'Anton, en semaine 1. */
export function reponseSeminaire(d1: number, graine: number): StatutSeminaire {
  if (d1 === 0) return "juin";
  if (d1 === 3) return "decline";
  const u = hasard(graine).uSeminaire;
  if (d1 === 1) {
    const { mai, juin } = REPONSE_SEMINAIRE.dates;
    return u < mai ? "mai" : u < mai + juin ? "juinPrixPlein" : "ailleurs";
  }
  return u < REPONSE_SEMINAIRE.partenaire ? "partenaire" : "ailleurs";
}

const signe = (s: StatutSeminaire) =>
  s === "juin" || s === "mai" || s === "juinPrixPlein" || s === "partenaire";

/** Le statut du séminaire tel qu'on le connaît en fin de semaine w. */
export function statutSeminaire(chemin: readonly number[], graine: number, w = SEMAINES) {
  const h = hasard(graine);
  const premier = reponseSeminaire(chemin[D.seminaire]!, graine);
  if (!signe(premier)) return premier;
  if (w >= 2 && chemin[D.contrat] === 2 && h.uGarantieSeminaire < REFUS_GARANTIE.seminaire) {
    return "refusGarantie";
  }
  if (w >= ANNULATION.semaine && h.uAnnulation < ANNULATION.chance) return "annule";
  return premier;
}
/** Les statuts que le séminaire avait au moment de signer : pour retrouver ses dates après une annulation. */
export const statutSigne = (chemin: readonly number[], graine: number) =>
  reponseSeminaire(chemin[D.seminaire]!, graine);

export type StatutConvention = "refusee" | "complete" | "reduite" | "sansGala" | "ailleurs";

/** Ce que devient la convention Mélizane. */
export function statutConvention(chemin: readonly number[], graine: number): StatutConvention {
  const h = hasard(graine);
  const d3 = chemin[D.convention]!;
  if (d3 === 0) return "refusee";
  if (d3 === 2 && h.uReduit >= CONVENTION.accepteReduit) return "ailleurs";
  if (chemin[D.contrat] === 2 && h.uGarantieConvention < REFUS_GARANTIE.convention) {
    return "ailleurs";
  }
  return d3 === 1 ? "complete" : d3 === 2 ? "reduite" : "sansGala";
}

export type StatutSerie = "refusee" | "signee" | "partie" | "analyseContre" | "refusGarantie";

/** L'analyse du pick-up conclut-elle à une baisse de la demande ? */
export const analyseConclutBaisse = (graine: number) => {
  const h = hasard(graine);
  return h.uAnalyse < ANALYSE.baisse[h.scenario]!;
};

/** Ce que devient la série de Tavenne. */
export function statutSerie(chemin: readonly number[], graine: number): StatutSerie {
  const h = hasard(graine);
  const d4 = chemin[D.serie]!;
  if (d4 === 2) return "refusee";
  if (d4 === 1) {
    if (h.uAttente < ANALYSE.depart) return "partie";
    if (!analyseConclutBaisse(graine)) return "analyseContre";
  }
  if (chemin[D.contrat] === 2 && h.uGarantieSerie < REFUS_GARANTIE.serie) return "refusGarantie";
  return "signee";
}

/* ---------------------------------------------------------------------------
 * LE DÉPLACEMENT : ce que les chiffres de la semaine 1 permettent de calculer.
 * ------------------------------------------------------------------------- */

/** Les chambres individuelles qu'un bloc évince sur une nuit, à la prévision. */
export const evinces = (demande: number, bloc: number) =>
  Math.max(0, Math.min(demande, CHAMBRES) - (CHAMBRES - bloc));

/**
 * LA VALEUR DES INDIVIDUELS QUE LE SÉMINAIRE ÉVINCERAIT en juin : les nuitées
 * qu'il chasse sur ses trois nuits, à la prévision, fois la marge d'une nuitée
 * individuelle de juin, dîner compris. C'est la prévision de la semaine 1.
 */
export const NUITEES_EVINCEES = SEMINAIRE.juin.reduce(
  (s, i) => s + evinces(prevision(i), SEMINAIRE.chambres),
  0,
);
export const DEPLACEMENT_SEMINAIRE = NUITEES_EVINCEES * valeurIndividuelle(PRIX_MOYEN[1]);
/** Le même séminaire sur les dates creuses de fin mai. */
export const NUITEES_EVINCEES_MAI = SEMINAIRE.mai.reduce(
  (s, i) => s + evinces(prevision(i), SEMINAIRE.chambres),
  0,
);
export const DEPLACEMENT_MAI = NUITEES_EVINCEES_MAI * valeurIndividuelle(PRIX_MOYEN[0]);

/** La marge du séminaire s'il occupe tout son bloc : chambres, journées d'étude, dîners. */
export function contributionSeminaire(prix: number = SEMINAIRE.prix, occupation = 1) {
  const nuits = SEMINAIRE.juin.length;
  const chambres =
    SEMINAIRE.chambres *
    occupation *
    nuits *
    (prix * (1 - SEMINAIRE.commission) - INDIVIDUELS.coutVariable);
  const restauration =
    SEMINAIRE.participants *
    occupation *
    nuits *
    (SEMINAIRE.forfait * SEMINAIRE.margeForfait + SEMINAIRE.diner * SEMINAIRE.margeDiner);
  return { chambres, restauration, total: chambres + restauration };
}

/** La valeur des individuels qu'un bloc évince sur des nuits données, à la prévision, pour un été. */
export function deplacementPrevu(
  nuits: readonly number[],
  bloc: number,
  scenario = 1,
  autres: (i: number) => number = () => 0,
) {
  const sc = SCENARIOS[scenario]!;
  return nuits.reduce((s, i) => {
    const ete = i >= 28;
    const demande = prevision(i) * (ete ? sc.demande : 1);
    const libres = CHAMBRES - autres(i);
    const sans = Math.min(demande, libres);
    const avec = Math.min(demande, Math.max(0, libres - bloc));
    const prix = PRIX_MOYEN[saison(i)]! * (ete ? sc.prix : 1);
    return s + (sans - avec) * valeurIndividuelle(prix);
  }, 0);
}

/** La marge de la convention Mélizane, à bloc plein, selon l'option retenue. */
export function contributionConvention(option: "complete" | "reduite" | "sansGala") {
  const c = CONVENTION;
  const chambres =
    (option === "reduite" ? c.reduit : c.chambres) *
    c.nuits.length *
    (c.prix - INDIVIDUELS.coutVariable);
  const salle = c.salle * c.journees.length * c.margeSalle;
  const forfaits = c.participants * c.journees.length * c.forfait * c.margeForfait;
  const gala =
    option === "sansGala"
      ? 0
      : (c.gala.invites + c.participants) * MARGE_GALA_PAR_COUVERT -
        c.gala.extras * c.gala.coutExtra;
  return { chambres, salle, forfaits, gala, total: chambres + salle + forfaits + gala };
}

/** Ce que la privatisation de la Table un soir de juillet fait perdre, à la prévision. */
export function privatisationPrevue(clientsDeLHotel: number) {
  return (
    CONVENTION.exterieurs * DINER.ticket * DINER.marge +
    clientsDeLHotel * DINER.part * DINER.couverts * DINER.ticket * DINER.marge
  );
}

/** La marge de la série Tavenne à la prévision, nette des individuels qu'elle évince, pour un été. */
export function valeurDeLaSerie(scenario: number, avecConvention = false) {
  const autres = (i: number) =>
    avecConvention && (CONVENTION.nuits as readonly number[]).includes(i) ? CONVENTION.chambres : 0;
  const nuitees = NUITS_SERIE.length * SERIE.chambres * SERIE.occupation;
  const marge =
    nuitees * (SERIE.prix - INDIVIDUELS.coutVariable) +
    NUITS_SERIE.length * SERIE.participants * SERIE.occupation * SERIE.diner * SERIE.margeDiner;
  return marge - deplacementPrevu(NUITS_SERIE, SERIE.chambres, scenario, autres);
}

/**
 * Le prix de déplacement d'une demande de juillet : le prix qui couvre les
 * individuels qu'elle évince, à la prévision, compte tenu des groupes déjà
 * signés ces nuits-là (la série de Tavenne, si elle l'est).
 */
export function plancher(k: number, avecSerie = false): number {
  const g = DEMANDES[k]!;
  const autres = (i: number) => (avecSerie && NUITS_SERIE.includes(i) ? SERIE.chambres : 0);
  const deplacement = deplacementPrevu(g.nuits, g.chambres, 1, autres);
  const autre = g.participants * g.nuits.length * g.fb + g.salle;
  return Math.max(
    0,
    INDIVIDUELS.coutVariable + (deplacement - autre) / (g.chambres * g.nuits.length),
  );
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, NUIT PAR NUIT.
 * ------------------------------------------------------------------------- */

/** Ce qu'un groupe tient une nuit donnée. */
interface Bloc {
  /** Les chambres bloquées, occupées ou non. */
  tenues: number;
  occupees: number;
  prix: number;
  commission: number;
  /** Les chambres rendues, et la part qui s'en revend. */
  rendues: { n: number; q: number }[];
  /** Ce que le client paie pour des chambres vides. */
  facture: number;
  /** Les chambres vides et payées. */
  payees: number;
  /** La marge des salles et de la restauration du groupe cette nuit-là. */
  autres: number;
}

export type Semaine = {
  /** La contribution de la semaine, en euros. */
  contribution: number;
  /** La contribution cumulée depuis le 4 mai. */
  cumul: number;
  /** Le taux d'occupation de la semaine. */
  to: number;
  /** Le prix moyen des chambres occupées. */
  pm: number;
  revpar: number;
  /** Les nuitées de groupe de la semaine. */
  groupes: number;
  /** Les chambres de groupe restées vides sans être payées, cumulées. */
  vides: number;
  /** La contribution des groupes moins celle des individuels qu'ils ont évincés, cumulée. */
  netGroupes: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  chemin: readonly number[];
  /** La contribution du trimestre, en euros. */
  objectif: number;
  scenario: number;
  seminaire: StatutSeminaire;
  convention: StatutConvention;
  serie: StatutSerie;
  /** Les demandes de juillet acceptées, et à quel prix. */
  demandes: readonly (number | null)[];
  /** Les groupes, déplacement déduit, sur le trimestre. */
  netGroupes: number;
  /** Les individuels évincés par les groupes, en nuitées et en euros. */
  evinces: number;
  deplacement: number;
  vides: number;
  toJuin: number;
  revparJuin: number;
  /** Les chambres de la convention restées libres après la réorganisation. */
  liberees: number;
  analyse: boolean | null;
}

/** Les décisions comme le tableau de bord les suppose : celles à venir valent « ne rien changer ». */
export const completer = (decisions: readonly number[]) => NEUTRE.map((n, i) => decisions[i] ?? n);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const sc = SCENARIOS[h.scenario]!;
  const p = chemin[D.contrat]!;
  const cond = CONDITIONS[p]!;
  const d5 = chemin[D.signal]!;
  const d6 = chemin[D.grille]!;

  const imprevuActif = (id: string, w: number) =>
    h.imprevus.find((x) => x.imprevu.id === id && x.semaine === w) !== undefined;
  const blanchisserie = h.imprevus.find((x) => x.imprevu.id === "blanchisserie");
  const coutVariable = (i: number) =>
    INDIVIDUELS.coutVariable +
    (blanchisserie && semaineDe(i) >= blanchisserie.semaine
      ? blanchisserie.imprevu.effet.coutVariable!
      : 0);

  const blocs: Bloc[][] = Array.from({ length: NUITS }, () => []);
  const couts: number[] = Array.from({ length: SEMAINES + 1 }, () => 0);
  couts[1] = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  /**
   * L'attrition d'un groupe sous les conditions du trimestre : les chambres
   * rendues tôt se revendent, celles rendues tard presque pas, et au-delà de
   * la tolérance, le client paie.
   */
  const attrition = (
    tenues: number,
    vides: number,
    prix: number,
    connue: number,
  ): Pick<Bloc, "rendues" | "facture" | "payees"> => {
    if (vides <= 0) return { rendues: [], facture: 0, payees: 0 };
    if (p === 2) return { rendues: [], facture: vides * prix * cond.facturation, payees: vides };
    if (p === 0) return { rendues: [{ n: vides, q: REVENTE.j7 }], facture: 0, payees: 0 };
    const tot = vides * connue;
    const tard = vides - tot;
    const tolere = Math.min(tard, tenues * cond.tolerance);
    const au_dela = tard - tolere;
    return {
      rendues: [
        { n: tot, q: REVENTE.j21 },
        { n: tolere, q: REVENTE.j7 },
      ],
      facture: au_dela * prix * cond.facturation,
      payees: au_dela,
    };
  };

  // Le séminaire Orvandel.
  let acompte = 0;
  const seminaire = statutSeminaire(chemin, graine);
  const signeA = statutSigne(chemin, graine);
  if (signe(seminaire)) {
    const nuits = seminaire === "mai" ? SEMINAIRE.mai : SEMINAIRE.juin;
    const prix = seminaire === "juinPrixPlein" ? SEMINAIRE.prixDeplacement : SEMINAIRE.prix;
    const tenues = seminaire === "partenaire" ? SEMINAIRE.partenaire : SEMINAIRE.chambres;
    const s = h.occupationSeminaire;
    const occupees = Math.min(tenues, SEMINAIRE.chambres * s);
    const restauration =
      SEMINAIRE.participants *
      s *
      (SEMINAIRE.forfait * SEMINAIRE.margeForfait + SEMINAIRE.diner * SEMINAIRE.margeDiner);
    for (const i of nuits) {
      blocs[i]!.push({
        tenues,
        occupees,
        prix,
        commission: SEMINAIRE.commission,
        ...attrition(tenues, tenues - occupees, prix, ATTRITION_CONNUE),
        autres: restauration,
      });
    }
  } else if (seminaire === "annule") {
    // Annulé en semaine 3 : l'acompte reste acquis, les chambres reviennent à la vente.
    const nuits = signeA === "mai" ? SEMINAIRE.mai : SEMINAIRE.juin;
    const prix = signeA === "juinPrixPlein" ? SEMINAIRE.prixDeplacement : SEMINAIRE.prix;
    const tenues = signeA === "partenaire" ? SEMINAIRE.partenaire : SEMINAIRE.chambres;
    const valeur =
      nuits.length *
      (tenues * prix + SEMINAIRE.participants * (SEMINAIRE.forfait + SEMINAIRE.diner));
    acompte = valeur * cond.acompte;
    const q = signeA === "mai" ? REVENTE.j7 : REVENTE.j21;
    for (const i of nuits) {
      blocs[i]!.push({
        tenues,
        occupees: 0,
        prix,
        commission: 0,
        rendues: [{ n: tenues, q }],
        facture: 0,
        payees: 0,
        autres: 0,
      });
    }
  }

  // La convention Mélizane : la réorganisation libère des chambres, que la décision 5 traite.
  const convention = statutConvention(chemin, graine);
  let liberees = 0;
  if (convention === "complete" || convention === "reduite" || convention === "sansGala") {
    const c = CONVENTION;
    const tenues = convention === "reduite" ? c.reduit : c.chambres;
    const s = h.occupationConvention;
    const occupees = Math.min(tenues, c.chambres * s);
    const vides = tenues - occupees;
    liberees = vides;
    const participants = c.participants * s;
    const gala =
      convention === "sansGala"
        ? 0
        : (c.gala.invites + participants) * MARGE_GALA_PAR_COUVERT -
          c.gala.extras * c.gala.coutExtra;
    for (const i of c.nuits) {
      const traitement: Pick<Bloc, "rendues" | "facture" | "payees"> =
        d5 === 1
          ? { rendues: [{ n: vides, q: REVENTE.j17 }], facture: 0, payees: 0 }
          : d5 === 2
            ? { rendues: [{ n: vides, q: REVENTE.j10 }], facture: 0, payees: 0 }
            : attrition(tenues, vides, c.prix, 0);
      blocs[i]!.push({
        tenues,
        occupees,
        prix: c.prix,
        commission: 0,
        ...traitement,
        autres:
          ((c.journees as readonly number[]).includes(i)
            ? c.salle * c.margeSalle + participants * c.forfait * c.margeForfait
            : 0) + (i === c.gala.nuit ? gala : 0),
      });
    }
  }

  // La série Tavenne.
  const serie = statutSerie(chemin, graine);
  // L'analyse se commande en semaine 5 : elle se paie cette semaine-là.
  if (chemin[D.serie] === 1) couts[ANALYSE.semaine - 1] = ANALYSE.cout;
  if (serie === "signee") {
    const occupees = SERIE.chambres * SERIE.occupation;
    for (const i of NUITS_SERIE) {
      blocs[i]!.push({
        tenues: SERIE.chambres,
        occupees,
        prix: SERIE.prix,
        commission: 0,
        ...attrition(SERIE.chambres, SERIE.chambres - occupees, SERIE.prix, ATTRITION_CONNUE),
        autres: SERIE.participants * SERIE.occupation * SERIE.diner * SERIE.margeDiner,
      });
    }
  }

  // Les demandes de juillet, selon la grille.
  const demandes = DEMANDES.map((g, k): number | null => {
    if (d6 === 2) return null;
    if (d6 === 0) return GRILLE;
    const plancherK = plancher(k, serie === "signee");
    if (g.prix >= plancherK) return g.prix;
    return h.uDemandes[k]! < ACCEPTE_PLANCHER ? Math.ceil(plancherK) : null;
  });
  demandes.forEach((prix, k) => {
    if (prix === null) return;
    const g = DEMANDES[k]!;
    g.nuits.forEach((i, n) => {
      blocs[i]!.push({
        tenues: g.chambres,
        occupees: g.chambres,
        prix,
        commission: 0,
        rendues: [],
        facture: 0,
        payees: 0,
        autres: g.participants * g.fb + (n === 0 ? g.salle : 0),
      });
    });
  });

  // Les nuits.
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let vides = 0;
  let netGroupes = 0;
  let evincesTotal = 0;
  let deplacement = 0;
  let occupeesJuin = 0;
  let recetteJuin = 0;
  const galaTenu =
    convention === "complete" || convention === "reduite" ? CONVENTION.gala.nuit : -1;
  for (let w = 1; w <= SEMAINES; w += 1) {
    let contribution =
      AUTRES[saison((w - 1) * 7)]! - couts[w]! + (w === ANNULATION.semaine ? acompte : 0);
    let occupeesSemaine = 0;
    let recette = 0;
    let groupes = 0;
    for (const x of h.imprevus) {
      if (x.semaine === w && x.imprevu.effet.cout) contribution -= x.imprevu.effet.cout;
    }
    let multiplicateur = 1 + h.bruit[w]!;
    for (const id of ["greve", "congres", "hosteo"]) {
      if (imprevuActif(id, w)) {
        multiplicateur *= IMPREVUS.find((x) => x.id === id)!.effet.demande!;
      }
    }
    for (let i = (w - 1) * 7; i < w * 7; i += 1) {
      const ete = i >= 28;
      const demande = prevision(i) * (ete ? sc.demande : 1) * multiplicateur;
      const prix = PRIX_MOYEN[saison(i)]! * (ete ? sc.prix : 1);
      const cv = coutVariable(i);
      const valeur = valeurIndividuelle(prix, cv);
      const nuit = blocs[i]!;
      const tenues = nuit.reduce((s, b) => s + b.tenues, 0);
      const base = Math.min(demande, Math.max(0, CHAMBRES - tenues));
      const restante = Math.max(0, demande - base);
      const offertes = nuit.reduce((s, b) => s + b.rendues.reduce((t, r) => t + r.n * r.q, 0), 0);
      const revendues = Math.min(restante, offertes);
      const individuels = base + revendues;
      const chasses = Math.min(demande, CHAMBRES) - individuels;
      let groupe = 0;
      let rendues = 0;
      for (const b of nuit) {
        groupe += b.occupees * (b.prix * (1 - b.commission) - cv) + b.facture + b.autres;
        recette += b.occupees * b.prix;
        occupeesSemaine += b.occupees;
        groupes += b.occupees;
        rendues += b.tenues - b.occupees - b.payees;
      }
      // Le soir du gala, la Table est privatisée : ses dîners à la carte sont perdus.
      const privatisation = i === galaTenu ? privatisationPrevue(individuels) : 0;
      contribution += individuels * valeur + groupe - privatisation;
      recette += individuels * prix;
      occupeesSemaine += individuels;
      vides += Math.max(0, rendues - revendues);
      if (nuit.length) {
        netGroupes += groupe - chasses * valeur - privatisation;
        evincesTotal += chasses;
        deplacement += chasses * valeur;
      }
      if (saison(i) === 1) {
        occupeesJuin += individuels + nuit.reduce((s, b) => s + b.occupees, 0);
        recetteJuin += individuels * prix + nuit.reduce((s, b) => s + b.occupees * b.prix, 0);
      }
    }
    // L'acompte d'un séminaire annulé est acquis : il compte avec les groupes.
    if (w === ANNULATION.semaine) netGroupes += acompte;
    cumul += contribution;
    const offertesSemaine = CHAMBRES * 7;
    semaines.push({
      contribution,
      cumul,
      to: occupeesSemaine / offertesSemaine,
      pm: occupeesSemaine > 0 ? recette / occupeesSemaine : 0,
      revpar: recette / offertesSemaine,
      groupes,
      vides,
      netGroupes,
    });
  }

  return {
    semaines,
    chemin: [...chemin],
    objectif: cumul,
    scenario: h.scenario,
    seminaire,
    convention,
    serie,
    demandes,
    netGroupes,
    evinces: evincesTotal,
    deplacement,
    vides,
    toJuin: occupeesJuin / (CHAMBRES * 30),
    revparJuin: recetteJuin / (CHAMBRES * 30),
    liberees,
    analyse: chemin[D.serie] === 1 && serie !== "partie" ? analyseConclutBaisse(graine) : null,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, annulation, réorganisation, analyse, été, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    refusGarantie: t.seminaire === "refusGarantie" && dans(2),
    annulation: t.seminaire === "annule" && dans(ANNULATION.semaine),
    analyse: t.analyse !== null && dans(ANALYSE.semaine),
    tavennePart: t.serie === "partie" && dans(ANALYSE.semaine),
    revelation: dans(REVELATION),
    demandes: dans(10),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSeminaire {
  cumul: number | null;
  to: number | null;
  pm: number | null;
  revpar: number | null;
  vides: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  budgetADate: number | null;
  seminaire: number | null;
  convention: number | null;
  serie: number | null;
  conditions: number | null;
  liberees: number | null;
  scenario: number | null;
  analyse: number | null;
}

export const STATUTS_SEMINAIRE: readonly StatutSeminaire[] = [
  "decline",
  "juin",
  "mai",
  "juinPrixPlein",
  "partenaire",
  "ailleurs",
  "refusGarantie",
  "annule",
];
export const STATUTS_CONVENTION: readonly StatutConvention[] = [
  "refusee",
  "complete",
  "reduite",
  "sansGala",
  "ailleurs",
];
export const STATUTS_SERIE: readonly StatutSerie[] = [
  "refusee",
  "signee",
  "partie",
  "analyseContre",
  "refusGarantie",
];

/** Ce qu'Anton lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
  budget: number,
): LectureSeminaire {
  if (semaine === 0) {
    return {
      cumul: 0,
      to: 0.58,
      pm: 176,
      revpar: 102,
      vides: 0,
      budgetADate: 0,
      seminaire: 0,
      convention: 0,
      serie: 0,
      conditions: 0,
      liberees: 0,
      scenario: -1,
      analyse: -1,
    };
  }
  const chemin = completer(decisions);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  let budgetADate = 0;
  for (let w = 1; w <= semaine; w += 1) budgetADate += budgetDeLaSemaine(w, budget);
  const h = hasard(graine);
  return {
    cumul: s.cumul,
    to: s.to,
    pm: s.pm,
    revpar: s.revpar,
    vides: s.vides,
    budgetADate,
    seminaire: STATUTS_SEMINAIRE.indexOf(statutSeminaire(chemin, graine, semaine)),
    convention: STATUTS_CONVENTION.indexOf(t.convention),
    serie: STATUTS_SERIE.indexOf(t.serie),
    conditions: chemin[D.contrat]!,
    liberees: t.liberees,
    scenario: semaine >= REVELATION ? h.scenario : -1,
    analyse: t.analyse === null || semaine < ANALYSE.semaine ? -1 : t.analyse ? 1 : 0,
  };
}

/** Le budget se répartit comme la saison : mai creux, juillet plein. */
export const POIDS_DES_SEMAINES = [
  0.055, 0.065, 0.06, 0.06, 0.075, 0.08, 0.08, 0.08, 0.085, 0.09, 0.09, 0.09, 0.09,
] as const;
export const budgetDeLaSemaine = (w: number, budget: number) =>
  (budget * POIDS_DES_SEMAINES[w - 1]!) / POIDS_DES_SEMAINES.reduce((a, b) => a + b, 0);
