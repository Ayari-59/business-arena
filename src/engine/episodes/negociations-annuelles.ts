/**
 * LES NÉGOCIATIONS DU 1ER MARS — le modèle de la négociation annuelle avec Celtis.
 *
 * La Laiterie de Kerbrélan a envoyé ses conditions générales de vente (CGV)
 * avant le 1er décembre : +5,8 % sur la marque Kerbrélan, dont 3,9 points de
 * matière première agricole (le lait payé aux producteurs de l'OP Lait du
 * Méné). Celtis, qui pèse 30 % du chiffre d'affaires de la laiterie, répond
 * par une demande de baisse de 2 % et la menace de déréférencer douze
 * références de la marque si rien n'est signé au 1er mars. Baptistin Haddadi,
 * directeur commercial, mène la négociation de décembre à février : treize
 * semaines, six décisions.
 *
 * L'OBJECTIF, en euros, est estimé en semaine 13 : la marge sur coût variable
 * attendue sur la marque Kerbrélan chez Celtis pour l'année du contrat (mars à
 * février), au prix net obtenu, avec les contreparties du plan d'affaires
 * (promotions, nouveautés référencées, logistique), MOINS la marge perdue
 * pendant les déréférencements (celui de janvier s'il a lieu, celui qui
 * suivrait le 1er mars, et les clients qui ne reviennent pas), les semaines de
 * médiation livrées sans la hausse, et les frais engagés pour négocier (tiers
 * indépendant, données de sortie de caisse, pénalités logistiques). Un point
 * de prix vaut 200 k€ de marge par an.
 *
 * Cinq mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA POSITION DE REPLI SE CHIFFRE. Les douze références menacées ne pèsent
 *     pas toutes pareil : la marque est leader sur trois d'entre elles, et
 *     45 % de leurs acheteurs vont les chercher dans un autre magasin quand
 *     elles manquent ; sur les neuf autres, neuf acheteurs sur dix prennent
 *     un produit de Nordal ou la marque de Celtis. La marge réellement perdue
 *     si Celtis retirait les douze références un an se calcule ; et Celtis ne
 *     peut pas retirer les leaders sans perdre des clients.
 *   · LA PART AGRICOLE SE JUSTIFIE, ELLE NE SE NÉGOCIE PAS. Les 3,9 points
 *     viennent des indicateurs du contrat avec l'OP ; la loi les sanctuarise.
 *     Justifiés (et attestés par un tiers indépendant), Celtis ne les conteste
 *     plus ; laissés dans la discussion, ils fondent avec le reste.
 *   · CE QU'ON CÈDE SUR LA PART AGRICOLE NE SE RATTRAPE PAS. Le lait reste payé
 *     460 € les 1 000 litres aux producteurs : chaque point cédé est une perte
 *     sèche pour l'année, et la laiterie se retrouve en porte-à-faux avec
 *     l'OP. Le reste (1,9 point) se négocie, contre des contreparties.
 *   · LA RÉPONSE DE CELTIS EST TIRÉE AU HASARD : accord, déréférencement partiel
 *     temporaire ou médiation, avec une probabilité qui dépend de la
 *     préparation, de la part agricole justifiée, des contreparties et de ce
 *     qu'on a montré à l'acheteuse. Signer sa dernière offre ne court aucun
 *     risque et coûte la part agricole ; exiger les CGV entières court tous
 *     les risques.
 *   · UN DÉRÉFÉRENCEMENT TEMPORAIRE COÛTE DES VENTES, mais les clients
 *     reviennent en partie : presque tous sur les leaders, quatre sur cinq
 *     sur les références faibles, que Nordal a eu le temps d'installer.
 *
 * Le hasard tire, d'avance : les ventes de chaque semaine, un ou deux
 * imprévus, la mise en sommeil de références en janvier, le nombre de
 * nouveautés que Celtis référence, et la réponse de Celtis au 1er mars.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const SEMAINES_PAR_AN = 52;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'acheteuse cale le calendrier promotionnel sans vous. */
export const PERTE_PAR_JOUR = 3000;

/** La marque Kerbrélan chez Celtis, l'année écoulée : références, chiffre d'affaires net, marge sur coût variable. */
export const MARQUE = { references: 38, ca: 20_000_000, mcv: 6_000_000 } as const;
/** Les douze références menacées : les trois leaders, et les neuf autres. */
export const LEADERS = {
  references: 3,
  ca: 3_000_000,
  mcv: 1_020_000,
  /** La part de leurs acheteurs qui vont les chercher dans un autre magasin. */
  report: 0.45,
  /** La part des ventes qui revient quand la référence revient en rayon. */
  retour: 0.95,
} as const;
export const FAIBLES = {
  references: 9,
  ca: 3_600_000,
  mcv: 900_000,
  report: 0.1,
  retour: 0.75,
} as const;
export const MENACEES = LEADERS.references + FAIBLES.references;

/** Le prix de base du lait de l'OP Lait du Méné, en euros les 1 000 litres : l'an dernier, cette année. */
export const PRIX_LAIT = { ancien: 421, nouveau: 460 } as const;
export const HAUSSE_LAIT = PRIX_LAIT.nouveau / PRIX_LAIT.ancien - 1;
/** Le poids du lait dans le tarif des produits de la marque. */
export const PART_LAIT = 0.42;
/** Les trois indicateurs du contrat-cadre avec l'OP, leur poids et leur évolution sur un an. */
export const INDICATEURS = [
  { nom: "coûts de production", poids: 0.5, hausse: 0.12 },
  { nom: "valorisation beurre-poudre", poids: 0.3, hausse: 0.076 },
  { nom: "prix moyen national", poids: 0.2, hausse: 0.05 },
] as const;
/** La part agricole de la hausse, en points de tarif : 0,42 × 9,3 %, soit 3,9 points. */
export const PART_AGRICOLE = Math.round(PART_LAIT * HAUSSE_LAIT * 1000) / 1000;
/** Les autres hausses de coûts variables, en points de tarif : emballages, énergie, transport frigorifique. */
export const AUTRES_HAUSSES = { emballages: 0.006, energie: 0.005, transport: 0.004 } as const;
export const HAUSSE_AUTRES_COUTS =
  AUTRES_HAUSSES.emballages + AUTRES_HAUSSES.energie + AUTRES_HAUSSES.transport;
/** Les salaires et les frais fixes, que les CGV répercutent aussi. */
export const HAUSSE_FRAIS_FIXES = 0.004;
/** Ce que les coûts variables prennent, rapporté au chiffre d'affaires : 5,4 points. */
export const HAUSSE_COUTS_VARIABLES = PART_AGRICOLE + HAUSSE_AUTRES_COUTS;
/** La hausse des CGV : 5,8 %. */
export const HAUSSE_CGV = PART_AGRICOLE + HAUSSE_AUTRES_COUTS + HAUSSE_FRAIS_FIXES;
/** Ce qui se négocie, hors part agricole : 1,9 point. */
export const RESTE = HAUSSE_CGV - PART_AGRICOLE;
/** La demande de Celtis. */
export const DEMANDE_CELTIS = -0.02;
export const VALEUR_DU_POINT = MARQUE.ca / 100;

/** La marge annuelle d'un ensemble de références, à une hausse de prix donnée, coûts de l'année. */
export const margeA = (g: { ca: number; mcv: number }, hausse: number) =>
  g.mcv + g.ca * (hausse - HAUSSE_COUTS_VARIABLES);
export const margeAnnuelle = (hausse: number) => margeA(MARQUE, hausse);

/**
 * La prévision de la semaine 1 : la marge perdue en un an si Celtis retirait les douze
 * références, aux conditions de l'année écoulée, une fois déduits les acheteurs qui vont les
 * chercher ailleurs. 561 + 810 = 1 371 k€.
 */
export const MARGE_PERDUE_DOUZE =
  LEADERS.mcv * (1 - LEADERS.report) + FAIBLES.mcv * (1 - FAIBLES.report);

/** Ce que le plan prévoit : la part agricole et un point sur le reste, soit 5,9 M€. */
export const HAUSSE_DU_PLAN = PART_AGRICOLE + 0.01;
export const BUDGET_MARGE = margeAnnuelle(HAUSSE_DU_PLAN);

/** La mise en sommeil de janvier : une référence leader et trois faibles, trois semaines. */
export const SOMMEIL = {
  debut: 6,
  fin: 8,
  leader: { ca: 1_000_000, mcv: 340_000 },
  faibles: { ca: 1_200_000, mcv: 300_000 },
  references: 4,
  /** Les références faibles mises en sommeil ne retrouvent que 90 % de leurs ventes. */
  retour: 0.9,
} as const;
/** Les trois références faibles que la laiterie peut proposer de retirer elle-même. */
export const RETRAIT = { references: 3, ca: 1_200_000, mcv: 300_000 } as const;

/** Les déréférencements qui peuvent suivre le 1er mars : leur durée, en semaines. */
export const DEREFERENCEMENT = { partiel: 12, rupture: 14 } as const;
/** Avec une mise en avant préparée chez Opaline et Proxival, plus d'acheteurs retrouvent la marque. */
export const REPORT_PREPARE = { leaders: 0.6, faibles: 0.2 } as const;
/** La médiation : les semaines livrées sans la hausse, le temps que le médiateur recommande. */
export const SEMAINES_DE_MEDIATION = 6;

/** Le plan d'affaires : deux opérations promotionnelles, deux nouveautés, des camions complets. */
export const PLAN = {
  promotions: 110_000,
  nouveautes: { ca: 600_000, taux: 0.22 },
  logistique: 30_000,
} as const;
/** Trois semaines à −34 % sur les douze références menacées : la marge donnée, effet de stockage compris. */
export const PROMO_MASSIVE = 180_000;
/** La coopération commerciale sans service réel, en points de chiffre d'affaires. */
export const COOPERATION = 0.015;

export const COUTS = {
  attestation: 14_000,
  donnees: 9_000,
  mediation: 6_000,
  miseEnAvant: 15_000,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ouverture: 0,
  partAgricole: 1,
  contreparties: 2,
  pression: 3,
  offre: 4,
  echeance: 5,
} as const;

/** Les options, par leur nom. */
export const O = {
  ouverture: { ceder: 0, preparer: 1, refuser: 2, ecouter: 3 },
  partAgricole: { attester: 0, ramener: 1, courriel: 2, laisser: 3 },
  contreparties: { plan: 0, cooperation: 1, promo: 2, tenir: 3 },
  pression: { donnees: 0, retirer: 1, president: 2, rien: 3 },
  offre: { accepter: 0, echanger: 1, agricoleSeule: 2, cgv: 3 },
  echeance: { ceder: 0, mediation: 1, laisser: 2, attendre: 3 },
} as const;

/** Ne rien changer, décision par décision : écouter, laisser venir, tenir les CGV, attendre le 1er mars. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE DÉCISION FAIT AU PRIX ET AU RISQUE.
 * ------------------------------------------------------------------------- */

/** La part agricole que Celtis reconnaît, selon ce qu'on en a fait en semaine 3. */
export const PART_RECONNUE = [PART_AGRICOLE, 0.025, 0.035, 0.03] as const;
/** Ce que le médiateur retient de la part agricole : il lit les indicateurs. */
export const PART_DU_MEDIATEUR = [PART_AGRICOLE, 0.025, 0.035, 0.032] as const;
/** Ce que les contreparties font obtenir sur le reste (la coopération commerciale déduite). */
export const RESTE_OBTENU = [0.01, RESTE - COOPERATION, 0.012, 0.003] as const;
/** Ce que l'ouverture fait au prix final : partir de la baisse demandée le tire vers le bas. */
export const ANCRAGE = [-0.008, 0.002, -0.002, -0.002] as const;
/**
 * Ce que la réponse à la pression fait au prix final : les sorties de caisse montrent à l'acheteuse
 * ce que Celtis perd sans les leaders ; l'appel du président se paie d'un geste sur le prix.
 */
export const APRES_LA_PRESSION = [0.004, 0, -0.003, 0] as const;
/** La dernière offre de Celtis : une base, et ce que chaque décision y ajoute. */
export const OFFRE_DE_BASE = 0.01;
export const BONUS_OFFRE = [
  [-0.004, 0.004, -0.002, 0],
  [0.003, 0, 0.001, 0],
  [0.002, 0.001, 0.001, 0],
  [0.003, 0.001, 0.001, 0],
] as const;
/** La probabilité que Celtis ne signe pas au 1er mars, selon l'offre de la semaine 9 (signer la sienne : aucune). */
export const REFUS_DE_BASE = [0, 0.7, 0.36, 1] as const;
export const EFFET_SUR_LE_REFUS = {
  ouverture: [-0.05, -0.1, 0.1, 0],
  /** Attester la part agricole : moitié moins d'effet si le dossier n'était pas prêt. */
  partAgricole: [-0.08, -0.04, -0.03, 0.04],
  contreparties: [-0.1, -0.06, -0.06, 0.05],
  pression: [-0.12, -0.05, -0.03, 0],
  /** Annoncer qu'on signera tout : l'acheteuse attend l'échéance. */
  echeance: [0.3, -0.04, 0.1, 0.08],
} as const;
/** La probabilité de la mise en sommeil de janvier, et ce que les trois premières décisions y font. */
export const SOMMEIL_DE_BASE = 0.3;
export const EFFET_SUR_LE_SOMMEIL = {
  ouverture: [-0.1, -0.15, 0.35, 0],
  partAgricole: [-0.08, -0.05, -0.03, 0.08],
  contreparties: [-0.1, -0.05, -0.05, 0.08],
} as const;
/** Quand rien n'est signé : la part des cas qui vont en médiation plutôt qu'en déréférencement. */
export const CHANCE_DE_MEDIATION = { preparee: 0.8, sinon: 0.2 } as const;
/** Sans médiation préparée, la part des cas où Celtis retire les douze références. */
export const CHANCE_DE_RUPTURE = 0.35;
/** Celtis référence les deux nouveautés du plan d'affaires deux fois sur trois, une seule sinon. */
export const CHANCE_DEUX_NOUVEAUTES = 0.65;

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
    /** Des pénalités logistiques facturées par Celtis. */
    penalites?: number;
    /** Ce qui reste des ventes de la semaine. */
    ventes?: number;
    /** Ce que l'imprévu ajoute au risque que Celtis ne signe pas. */
    refus?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "panne",
    titre: "Panne sur une ligne de pots à Loudéac",
    de: "Gurvan Kerebel",
    role: "Responsable de production, Loudéac",
    texte:
      "La doseuse de la ligne 3 est tombée trente heures : fromage blanc et crèmes desserts en rupture chez Celtis trois jours. Taux de service de la semaine : 96,1 % pour 98,5 % attendus, et des pénalités logistiques. L'acheteuse de Celtis l'a déjà mentionné.",
    duree: 1,
    effet: { penalites: 16_000, ventes: 0.96, refus: 0.04 },
  },
  {
    id: "kerfroid",
    titre: "Tempête sur la Bretagne",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "La tempête a coupé deux axes une journée : les Transports Kerfroid ont livré une partie des entrepôts de Celtis avec un jour de retard. Pénalités de retard à prévoir.",
    duree: 1,
    effet: { penalites: 9_000, ventes: 0.98, refus: 0.02 },
  },
  {
    id: "nordal",
    titre: "Retrait de lots chez Nordal",
    de: "Morwenna Pellen",
    role: "Cheffe de marque",
    texte:
      "Le Groupe Nordal retire, par précaution, plusieurs lots de crèmes desserts. Les rayons de Celtis se vident sur ce segment ; nos ventes de desserts montent, et Celtis a besoin de nous.",
    duree: 2,
    effet: { ventes: 1.06, refus: -0.05 },
  },
  {
    id: "dgccrf",
    titre: "La DGCCRF annonce des contrôles",
    de: "Mévena Guégan",
    role: "Juriste",
    texte:
      "La DGCCRF annonce des contrôles ciblés des négociations annuelles, en particulier sur le respect de la part agricole. Les centrales d'achat se montrent plus prudentes.",
    duree: 1,
    effet: { refus: -0.04 },
  },
  {
    id: "acheteuse",
    titre: "Changement d'interlocuteur chez Celtis",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Celtis réorganise sa centrale : un second acheteur, arrivé du non-alimentaire, suivra désormais le dossier avec Cyrielle Mainguené. Il faut tout lui réexpliquer, et il veut « faire ses preuves ».",
    duree: 1,
    effet: { refus: 0.04 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des ventes, semaine par semaine. */
  ventes: readonly number[];
  /** Celtis met-elle des références en sommeil en janvier ? */
  uSommeil: number;
  /** Celtis signe-t-elle au 1er mars ? */
  uCeltis: number;
  /** Sinon : médiation ou déréférencement partiel ? */
  uIssue: number;
  /** Celtis référence-t-elle les deux nouveautés ? */
  uNouveautes: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001063 + 7);
  const ventes: number[] = [1];
  for (let i = 1; i <= SEMAINES; i += 1) {
    ventes.push(Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))));
  }
  const uSommeil = r();
  const uCeltis = r();
  const uIssue = r();
  const uNouveautes = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { ventes, uSommeil, uCeltis, uIssue, uNouveautes, imprevus };
  tirages.set(graine, h);
  return h;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Le dossier de négociation est prêt dès la semaine 3. */
export const prepare = (chemin: readonly number[]) => chemin[D.ouverture] === O.ouverture.preparer;

/** La dernière offre de Celtis, au rendez-vous de la semaine 9. */
export function offreFinale(chemin: readonly number[]): number {
  return BONUS_OFFRE.reduce((s, bonus, d) => s + bonus[chemin[d] ?? NEUTRE[d]!]!, OFFRE_DE_BASE);
}

/** Ce que Celtis signe si elle accepte l'offre de la semaine 9. */
export function hausseProposee(chemin: readonly number[]): number {
  const [d1, d2, d3, d4, d5] = chemin.map((c, i) => c ?? NEUTRE[i]!);
  if (d5 === O.offre.accepter) return offreFinale(chemin);
  const agricole = PART_RECONNUE[d2!]! + ANCRAGE[d1!]! + APRES_LA_PRESSION[d4!]!;
  if (d5 === O.offre.agricoleSeule) return agricole;
  const echange = agricole + RESTE_OBTENU[d3!]!;
  // Exiger les CGV entières : au mieux, Celtis signe ce que les contreparties justifiaient.
  return d5 === O.offre.cgv ? echange - 0.002 : echange;
}

/** La probabilité que Celtis ne signe pas au 1er mars, imprévus compris. */
export function risqueDeRefus(chemin: readonly number[], graine: number): number {
  const [d1, d2, d3, d4, d5, d6] = chemin;
  if (d5 === O.offre.accepter) return 0;
  const e = EFFET_SUR_LE_REFUS;
  let attester: number = e.partAgricole[d2!]!;
  if (d2 === O.partAgricole.attester && !prepare(chemin)) attester /= 2;
  const imprevus = hasard(graine).imprevus.reduce((s, i) => s + (i.imprevu.effet.refus ?? 0), 0);
  return borne(
    REFUS_DE_BASE[d5!]! +
      e.ouverture[d1!]! +
      attester +
      e.contreparties[d3!]! +
      e.pression[d4!]! +
      e.echeance[d6!]! +
      imprevus,
    0.03,
    0.97,
  );
}

/** La probabilité que Celtis mette des références en sommeil en janvier. */
export function risqueDeSommeil(chemin: readonly number[]): number {
  const [d1, d2, d3] = chemin.map((c, i) => c ?? NEUTRE[i]!);
  const e = EFFET_SUR_LE_SOMMEIL;
  // L'attestation n'arrive avant janvier que si le dossier est prêt.
  const agricole = d2 === O.partAgricole.attester && !prepare(chemin) ? 0 : e.partAgricole[d2!]!;
  return borne(SOMMEIL_DE_BASE + e.ouverture[d1!]! + agricole + e.contreparties[d3!]!, 0.03, 0.9);
}
export const sommeil = (chemin: readonly number[], graine: number) =>
  hasard(graine).uSommeil < risqueDeSommeil(chemin);

/** Les nouveautés que Celtis référence, en chiffre d'affaires annuel. */
export const caNouveautes = (graine: number) =>
  hasard(graine).uNouveautes < CHANCE_DEUX_NOUVEAUTES ? PLAN.nouveautes.ca : PLAN.nouveautes.ca / 2;

export type Issue = "accord" | "cede" | "mediation" | "partiel" | "rupture";

/** Ce qui se passe au 1er mars. */
export function issue(chemin: readonly number[], graine: number): Issue {
  const h = hasard(graine);
  if (h.uCeltis >= risqueDeRefus(chemin, graine)) return "accord";
  const [, , , , d5, d6] = chemin;
  if (d6 === O.echeance.ceder) return "cede";
  if (d5 === O.offre.cgv || d6 === O.echeance.laisser) return "rupture";
  const prepare = d6 === O.echeance.mediation;
  const mediation = prepare ? CHANCE_DE_MEDIATION.preparee : CHANCE_DE_MEDIATION.sinon;
  if (h.uIssue < mediation) return "mediation";
  // Sans dossier de médiation, Celtis va une fois sur quatre jusqu'au retrait des douze références.
  return !prepare && h.uIssue >= 1 - CHANCE_DE_RUPTURE ? "rupture" : "partiel";
}

export type Semaine = {
  /** La marge annuelle attendue sur Celtis, au prix sur la table, pertes et frais déduits. */
  marge: number;
  /** La hausse sur la table : l'offre de Celtis, puis le prix signé. */
  offre: number;
  /** La part agricole que Celtis reconnaît ; 0 tant qu'elle la conteste. */
  agricole: number;
  /** Les ventes de la marque chez Celtis dans la semaine. */
  ventes: number;
  /** Les références Kerbrélan en rayon chez Celtis. */
  references: number;
  /** La marge de la semaine, aux prix de l'an dernier et aux coûts du moment. */
  margeSemaine: number;
  /** Ce que la semaine a coûté : pénalités, frais, ventes perdues. */
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge annuelle attendue sur Celtis, estimée en semaine 13. */
  objectif: number;
  issue: Issue;
  /** La hausse de prix de l'année du contrat. */
  hausse: number;
  /** La part agricole reconnue dans le prix signé. */
  agricole: number;
  margeAuPrix: number;
  contreparties: number;
  /** La marge perdue par les déréférencements, celui de janvier compris, et les clients qui ne reviennent pas. */
  pertesDereferencement: number;
  /** Les semaines de médiation livrées sans la hausse. */
  perteMediation: number;
  frais: number;
  sommeil: boolean;
  deuxNouveautes: boolean;
  referencesFin: number;
  ventesTrimestre: number;
  risque: number;
}

/**
 * La marge perdue sur l'année quand Celtis retire des références un temps : les semaines sans
 * elles, moins les acheteurs qui vont les chercher ailleurs, puis les clients qui ne reviennent pas.
 */
export const perteSiRetire = (
  g: { ca: number; mcv: number; retour: number },
  hausse: number,
  semaines: number,
  report: number,
) =>
  margeA(g, hausse) *
  ((semaines / SEMAINES_PAR_AN) * (1 - report) +
    ((SEMAINES_PAR_AN - semaines) / SEMAINES_PAR_AN) * (1 - g.retour));

/** La progression de l'offre de Celtis au fil des rendez-vous (semaines 3, 5, 7 et 9). */
const RYTHME = [0, 0, 0, 0.3, 0.3, 0.55, 0.55, 0.8, 0.8, 1, 1, 1, 1, 1] as const;
/** Décembre pour les desserts des fêtes, janvier plus calme. */
export const SAISON = [
  0, 1.08, 1.12, 1.16, 1.02, 0.94, 0.95, 0.96, 0.97, 0.97, 0.98, 0.99, 1, 1,
] as const;
/** Le nouveau prix du lait s'applique au 1er janvier, en semaine 5. */
export const SEMAINE_DU_NOUVEAU_LAIT = 5;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, d4, d5, d6] = chemin.map((c, i) => c ?? NEUTRE[i]!) as number[];
  const enSommeil = sommeil(chemin, graine);
  const fin = issue(chemin, graine);
  const risque = risqueDeRefus(chemin, graine);
  const deux = h.uNouveautes < CHANCE_DEUX_NOUVEAUTES;
  const finale = offreFinale(chemin);
  const proposee = hausseProposee(chemin);
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  // LE PRIX DE L'ANNÉE DU CONTRAT, selon ce qui se passe au 1er mars.
  let hausse = proposee;
  let reconnue: number = PART_RECONNUE[d2!]!;
  if (d5 === O.offre.accepter || fin === "cede") {
    hausse = finale;
    reconnue = PART_AGRICOLE;
  } else if (fin === "accord" && d6 === O.echeance.ceder) {
    hausse = proposee - 0.003; // L'acheteuse sait que vous signerez : elle obtient encore 0,3 point.
  } else if (fin === "mediation") {
    hausse = PART_DU_MEDIATEUR[d2!]! + 0.5 * (proposee - PART_RECONNUE[d2!]!);
    reconnue = PART_DU_MEDIATEUR[d2!]!;
  } else if (fin === "partiel") {
    hausse = proposee - 0.003;
  } else if (fin === "rupture") {
    hausse = proposee - 0.005;
  }
  // La part agricole du prix de l'année : jamais plus que la hausse elle-même.
  const agricole = Math.min(hausse, reconnue);

  // LES CONTREPARTIES du plan d'affaires, et ce qu'elles coûtent.
  let contreparties = 0;
  if (d3 === O.contreparties.plan) {
    // Sans accord au 1er mars, les nouveautés n'entrent en rayon qu'à la signature.
    const signeAuPremierMars = fin === "accord" || fin === "cede";
    const nouveautes =
      d6 === O.echeance.laisser ? 0 : caNouveautes(graine) * (signeAuPremierMars ? 1 : 0.5);
    contreparties = nouveautes * PLAN.nouveautes.taux - PLAN.promotions + PLAN.logistique;
  }
  if (d3 === O.contreparties.promo) contreparties = -PROMO_MASSIVE;

  // LES DÉRÉFÉRENCEMENTS : les semaines sans la référence, puis les clients qui ne reviennent pas.
  const prepareOpaline = d6 === O.echeance.mediation;
  const report = {
    leaders: prepareOpaline ? REPORT_PREPARE.leaders : LEADERS.report,
    faibles: prepareOpaline ? REPORT_PREPARE.faibles : FAIBLES.report,
  };
  const retirees = d4 === O.pression.retirer ? RETRAIT.references : 0;
  const partFaibles = (FAIBLES.references - retirees) / FAIBLES.references;
  let pertesApres = 0;
  if (fin === "partiel") {
    pertesApres =
      partFaibles * perteSiRetire(FAIBLES, hausse, DEREFERENCEMENT.partiel, report.faibles);
  }
  if (fin === "rupture") {
    pertesApres =
      perteSiRetire(LEADERS, hausse, DEREFERENCEMENT.rupture, report.leaders) +
      partFaibles * perteSiRetire(FAIBLES, hausse, DEREFERENCEMENT.rupture, report.faibles);
  }
  const perteRetrait = retirees ? margeA(RETRAIT, hausse) * (1 - FAIBLES.report) : 0;
  const perteMediation =
    fin === "mediation" ? (MARQUE.ca * hausse * SEMAINES_DE_MEDIATION) / SEMAINES_PAR_AN : 0;
  // La mise en sommeil de janvier : les références faibles ne retrouvent pas toutes leurs ventes.
  const durableSommeil = enSommeil ? margeA(SOMMEIL.faibles, hausse) * (1 - SOMMEIL.retour) : 0;

  // LE TRIMESTRE, semaine par semaine.
  const semaines: (Semaine | null)[] = [null];
  let pertesSommeil = 0;
  let ventesTrimestre = 0;
  let coutsCumules = 0;
  const finSommeil = d4 === O.pression.president ? SOMMEIL.debut + 1 : SOMMEIL.fin;
  const offreA = (w: number) =>
    DEMANDE_CELTIS +
    (OFFRE_DE_BASE - DEMANDE_CELTIS) * RYTHME[w]! +
    BONUS_OFFRE.reduce(
      (s, bonus, d) => s + (w >= 3 + 2 * d ? bonus[chemin[d] ?? NEUTRE[d]!]! : 0),
      0,
    );
  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? enquete : 0;
    if (w === 3 && d2 === O.partAgricole.attester) cout += COUTS.attestation;
    if (w === 7 && d4 === O.pression.donnees) cout += COUTS.donnees;
    for (const a of actifs) {
      if (w === a.semaine) cout += a.imprevu.effet.penalites ?? 0;
    }

    // Les ventes de la semaine, et les références en sommeil.
    let ventes = (MARQUE.ca / SEMAINES_PAR_AN) * SAISON[w]! * h.ventes[w]!;
    for (const a of actifs) ventes *= a.imprevu.effet.ventes ?? 1;
    let references: number = MARQUE.references;
    const dort = enSommeil && w >= SOMMEIL.debut && w <= finSommeil;
    const nouveauCout = w >= SEMAINE_DU_NOUVEAU_LAIT ? HAUSSE_COUTS_VARIABLES : 0;
    if (dort) {
      references -= SOMMEIL.references;
      const parSemaine = (g: { ca: number; mcv: number }) =>
        (g.mcv - g.ca * nouveauCout) / SEMAINES_PAR_AN;
      ventes -= ((SOMMEIL.leader.ca + SOMMEIL.faibles.ca) / SEMAINES_PAR_AN) * SAISON[w]!;
      const perdue =
        parSemaine(SOMMEIL.leader) * (1 - LEADERS.report) +
        parSemaine(SOMMEIL.faibles) * (1 - FAIBLES.report);
      pertesSommeil += perdue;
      cout += perdue;
    }
    if (retirees && w >= 9) references -= retirees;
    ventesTrimestre += ventes;
    const margeSemaine = ventes * (MARQUE.mcv / MARQUE.ca - nouveauCout);

    // La hausse sur la table, puis signée.
    let offre = offreA(w);
    if (d5 === O.offre.accepter && w >= 10) offre = finale;
    let reconnue = 0;
    if (w >= 4 && d2 === O.partAgricole.ramener) reconnue = PART_RECONNUE[d2]!;
    if (w >= 4 && d2 === O.partAgricole.courriel) reconnue = PART_RECONNUE[d2]!;
    if (d2 === O.partAgricole.attester && w >= (prepare(chemin) ? 5 : 9)) reconnue = PART_AGRICOLE;
    if (d5 === O.offre.accepter && w >= 10) reconnue = Math.min(finale, PART_AGRICOLE);

    // La marge annuelle attendue au prix sur la table, pertes et frais à date déduits.
    coutsCumules += cout;
    let marge =
      margeAnnuelle(offre) +
      (w >= 7 ? contreparties : 0) -
      (w >= 9 ? perteRetrait : 0) -
      (enSommeil && w > finSommeil ? durableSommeil : 0) -
      coutsCumules;
    if (w === SEMAINES) {
      offre = hausse;
      reconnue = agricole;
      if (fin === "partiel") references = MARQUE.references - FAIBLES.references;
      if (fin === "rupture") references = MARQUE.references - MENACEES;
      marge =
        margeAnnuelle(hausse) +
        contreparties -
        perteRetrait -
        durableSommeil -
        pertesApres -
        perteMediation -
        coutsCumules -
        (fin === "mediation" ? COUTS.mediation : 0) -
        (prepareOpaline && (fin === "partiel" || fin === "rupture") ? COUTS.miseEnAvant : 0);
    }

    semaines.push({
      marge,
      offre,
      agricole: reconnue,
      ventes,
      references,
      margeSemaine,
      couts: cout,
    });
  }

  const fraisFin =
    coutsCumules -
    pertesSommeil +
    (fin === "mediation" ? COUTS.mediation : 0) +
    (prepareOpaline && (fin === "partiel" || fin === "rupture") ? COUTS.miseEnAvant : 0);
  const derniere = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: derniere.marge,
    issue: fin,
    hausse,
    agricole,
    margeAuPrix: margeAnnuelle(hausse),
    contreparties,
    pertesDereferencement: pertesApres + durableSommeil + pertesSommeil + perteRetrait,
    perteMediation,
    frais: fraisFin,
    sommeil: enSommeil,
    deuxNouveautes: deux,
    referencesFin: derniere.references,
    ventesTrimestre,
    risque,
  };
}

/** Ce qui s'est passé pendant des semaines : la mise en sommeil, la réponse de Celtis, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    sommeil: t.sommeil && dans(SOMMEIL.debut),
    issue: dans(SEMAINES) ? t.issue : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureCeltis {
  marge: number | null;
  offre: number | null;
  agricole: number | null;
  ventes: number | null;
  references: number | null;
  budget: number | null;
  /** Pour les messages : la dernière offre de Celtis, la mise en sommeil, la signature. */
  offreFinale: number | null;
  sommeil: number | null;
  signe: number | null;
}

/** Ce que Baptistin lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureCeltis {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  if (semaine === 0) {
    return {
      marge: margeAnnuelle(DEMANDE_CELTIS),
      offre: DEMANDE_CELTIS,
      agricole: 0,
      ventes: MARQUE.ca / SEMAINES_PAR_AN,
      references: MARQUE.references,
      budget: BUDGET_MARGE,
      offreFinale: offreFinale(chemin),
      sommeil: 0,
      signe: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.marge,
    offre: s.offre,
    agricole: s.agricole,
    ventes: s.ventes,
    references: s.references,
    budget: BUDGET_MARGE,
    offreFinale: offreFinale(chemin),
    sommeil: t.sommeil && semaine >= SOMMEIL.debut ? 1 : 0,
    signe: chemin[D.offre] === O.offre.accepter && semaine >= 10 ? 1 : 0,
  };
}
