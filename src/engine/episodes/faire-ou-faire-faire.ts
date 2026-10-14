/**
 * FAIRE OU FAIRE FAIRE — le modèle des livraisons de la plateforme de Corbas.
 *
 * Six porteurs achetés, trois porteurs en location longue durée, six
 * chauffeurs en CDI et trois intérimaires, quelque trois cents livraisons sur
 * chantier par semaine : deux cent dix dans l'agglomération, quatre-vingt-dix
 * dans les zones lointaines (Nord-Isère, Monts du Lyonnais). Un transporteur
 * propose de tout reprendre à un prix par livraison inférieur au coût complet
 * interne. Treize semaines, six décisions. Trois mécanismes font l'épisode, et
 * le joueur doit les découvrir :
 *
 *   · SEULS LES COÛTS ÉVITABLES SE COMPARENT AU PRIX. Le coût complet d'une
 *     livraison (65 €) additionne des coûts qui disparaîtraient si le
 *     transporteur roulait à la place de la flotte (carburant, péages, pneus,
 *     intérimaires, heures supplémentaires) et d'autres qui resteraient quoi
 *     qu'il arrive sur le trimestre : les salaires des chauffeurs en CDI,
 *     l'amortissement des porteurs achetés (un coût irrécupérable), le loyer
 *     du garage, l'encadrement, la quote-part du siège. En agglomération, une
 *     livraison ne coûte en évitable que 12 € : la confier à 48 € fait perdre
 *     36 € à chaque fois. Dans les zones lointaines, au contraire, les
 *     kilomètres, les intérimaires et les heures supplémentaires font 67 €
 *     d'évitable, pour un prix de 60 € : là, faire faire est juste. Et quand
 *     la part interne diminue, le coût complet de ce qui reste monte, sans que
 *     rien n'ait changé dans ce qu'une livraison coûte à faire : le réflexe du
 *     coût complet pousse alors à externaliser encore, à perte.
 *   · UN COÛT DEVIENT ÉVITABLE À SON ÉCHÉANCE. La location des trois porteurs
 *     est ferme jusqu'à la fin de la semaine 6 : avant, son loyer est dû quoi
 *     qu'on décide ; à son renouvellement, il devient évitable, et la
 *     décision change de nature (83,7 € d'évitable par livraison lointaine
 *     après la semaine 6). Les aménagements payés à la signature, eux, sont
 *     irrécupérables : ils ne plaident ni pour ni contre le renouvellement.
 *     La pointe de printemps obéit à la même logique : ce qu'une livraison de
 *     plus coûte en interne, ce sont des heures majorées et des retards, pas
 *     le salaire moyen d'un chauffeur déjà payé.
 *   · FAIRE FAIRE, C'EST DÉPENDRE. Le transporteur perd des chauffeurs en
 *     cours de trimestre et son service dérape, selon le hasard ; ses retards
 *     sont facturés par les clients, et un grand compte du Nord-Isère
 *     applique la pénalité de son contrat-cadre au-delà de 12 % de retards.
 *     Un contrat révisable l'expose à une hausse de prix ; un engagement de
 *     service, payé 2 € par livraison, lui fait porter une partie des retards.
 *
 * Le trimestre est jugé en euros : l'écart au budget de la logistique de
 * livraison, pénalités clients comprises. Plus il est haut, mieux c'est.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/** Les livraisons d'une semaine ordinaire, par zone. */
export const LIVRAISONS = { agglo: 210, lointaines: 90 } as const;
export const TOTAL_LIVRAISONS = LIVRAISONS.agglo + LIVRAISONS.lointaines;
/** Carburant, péages, pneus, entretien au kilomètre : par livraison faite par la flotte. */
export const VARIABLE = { agglo: 12, lointaines: 27 } as const;
/** Six chauffeurs en CDI, salaire chargé par semaine. */
export const CDI = { nombre: 6, semaine: 800 } as const;
/** Trois chauffeurs intérimaires, sur les tournées lointaines ; fin de mission sous une semaine. */
export const INTERIM = { nombre: 3, semaine: 1000 } as const;
/** Les heures supplémentaires des tournées lointaines, par semaine. */
export const HEURES_SUP_LOINTAINES = 600;
/** Six porteurs achetés : leur amortissement par semaine. */
export const PROPRES = { nombre: 6, amortissement: 230 } as const;
/**
 * Trois porteurs en location longue durée, entretien compris, sur les tournées
 * lointaines : contrat ferme jusqu'à la fin de la semaine 6. Loyers par porteur
 * et par semaine : actuel, renouvelé pour quatre ans avec 8 % de remise,
 * prolongé au tarif courte durée.
 */
export const LOUES = {
  nombre: 3,
  loyer: 500,
  renouvele: 460,
  courteDuree: 650,
  finDeContrat: 6,
  /** Les grues et plateaux payés à la signature, en 2022 : irrécupérables. */
  amenagements: 27000,
} as const;
/** Ce qui reste quoi qu'on décide sur le trimestre : assurance annuelle, garage, encadrement, siège. */
export const FIXES = { assurance: 360, garage: 1200, encadrement: 1260, structure: 450 } as const;
export const FIXES_COMMUNS = FIXES.assurance + FIXES.garage + FIXES.encadrement + FIXES.structure;

/** Ce que coûte une semaine ordinaire de livraisons, tout compris. */
export const COUT_SEMAINE =
  LIVRAISONS.agglo * VARIABLE.agglo +
  LIVRAISONS.lointaines * VARIABLE.lointaines +
  CDI.nombre * CDI.semaine +
  INTERIM.nombre * INTERIM.semaine +
  HEURES_SUP_LOINTAINES +
  PROPRES.nombre * PROPRES.amortissement +
  LOUES.nombre * LOUES.loyer +
  FIXES_COMMUNS;
/** Le coût complet d'une livraison, tel que le contrôle de gestion le calcule : 65 €. */
export const COUT_COMPLET = COUT_SEMAINE / TOTAL_LIVRAISONS;
/** Ce qui disparaît avec une livraison lointaine confiée d'ici la semaine 6 : 67 €. */
export const EVITABLE_LOINTAINE =
  (LIVRAISONS.lointaines * VARIABLE.lointaines +
    INTERIM.nombre * INTERIM.semaine +
    HEURES_SUP_LOINTAINES) /
  LIVRAISONS.lointaines;
/** La même, à partir de la semaine 7, quand la location des porteurs devient évitable. */
export const EVITABLE_LOINTAINE_APRES =
  EVITABLE_LOINTAINE + (LOUES.nombre * LOUES.loyer) / LIVRAISONS.lointaines;
/** Ce qui disparaît avec une livraison d'agglomération confiée : le carburant et l'usure, 12 €. */
export const EVITABLE_AGGLO = VARIABLE.agglo;

/**
 * Le coût complet d'une livraison d'agglomération selon le contrôle de gestion :
 * ses coûts directs et sa part des frais communs, au prorata des livraisons (52,3 €).
 */
export const COUT_COMPLET_AGGLO =
  (LIVRAISONS.agglo * VARIABLE.agglo +
    CDI.nombre * CDI.semaine +
    PROPRES.nombre * PROPRES.amortissement +
    (FIXES_COMMUNS * LIVRAISONS.agglo) / TOTAL_LIVRAISONS) /
  LIVRAISONS.agglo;
/** Le même quand l'agglomération porte seule les frais communs (57 €) : rien n'a changé dans une livraison. */
export const COUT_COMPLET_AGGLO_SEULE =
  (LIVRAISONS.agglo * VARIABLE.agglo +
    CDI.nombre * CDI.semaine +
    PROPRES.nombre * PROPRES.amortissement +
    FIXES_COMMUNS) /
  LIVRAISONS.agglo;
/** Le transporteur, Transports Ventajol : son prix par livraison, par zone. */
export const TARIFS = { agglo: 48, lointaines: 60 } as const;
/**
 * Les quatre formules de contrat : écart au tarif, volume garanti chaque
 * semaine, prix ferme sur un an, engagement de service, priorité dans les pointes.
 */
export const CONTRATS = [
  { ecart: -3, minimum: 120, ferme: true, service: false, priorite: true },
  { ecart: 0, minimum: 0, ferme: false, service: false, priorite: true },
  { ecart: 2, minimum: 0, ferme: true, service: true, priorite: true },
  { ecart: 6, minimum: 0, ferme: false, service: false, priorite: false },
] as const;
/** Le prix d'une livraison confiée sous une formule de contrat, avant toute hausse. */
export const prixContrat = (contrat: number, zone: "agglo" | "lointaines") =>
  TARIFS[zone] + CONTRATS[contrat]!.ecart;
/** L'économie que la direction lit en comparant les tarifs au coût complet : 4 020 € par semaine. */
export const ECONOMIE_AFFICHEE =
  COUT_SEMAINE - (LIVRAISONS.agglo * TARIFS.agglo + LIVRAISONS.lointaines * TARIFS.lointaines);
/** La hausse qu'un contrat révisable laisse passer, à partir de la semaine 11. */
export const HAUSSE = { taux: 0.09, chance: 0.6, semaine: 11 } as const;
/** L'engagement de service : au-delà de 5 % de retards, 60 € par livraison en retard. */
export const SERVICE = { seuil: 0.05, penalite: 60 } as const;
/**
 * Un second transporteur, à partir de la semaine 11, pour la moitié des tournées
 * lointaines : celles des chantiers de Bâtiments Sirand. Sa mise en place (audit,
 * semaine de doublon) se paie en semaine 11.
 */
export const SECOND = { lointaines: 63, miseEnPlace: 3500 } as const;

/** La part des livraisons qui arrivent en retard, en temps ordinaire. */
export const RETARDS = { agglo: 0.03, lointaines: 0.09, transporteur: 0.05 } as const;
/** Ce qu'une livraison en retard coûte : l'équipe qui attend sur le chantier, facturée par le client. */
export const PENALITE_RETARD = 80;
/** Les livraisons en retard d'une semaine ordinaire, quand la flotte fait tout. */
export const RETARDS_ORDINAIRES =
  LIVRAISONS.agglo * RETARDS.agglo + LIVRAISONS.lointaines * RETARDS.lointaines;
/** Une livraison qui ne passe pas : reportée au lendemain, en heures supplémentaires, et en retard. */
export const REPORT = 40;
/**
 * Bâtiments Sirand, grand compte du Nord-Isère : la pénalité de son contrat-cadre
 * (5 % de ses commandes du trimestre) si plus de 15 % de ses livraisons arrivent
 * en retard sur les trois dernières semaines.
 */
export const GRAND_COMPTE = { penalite: 6000, seuil: 0.15, de: 11, a: 13 } as const;

/** Ce que les six chauffeurs en CDI livrent en agglomération sur leurs heures normales. */
export const CAPACITE_AGGLO = 216;
/** Les heures supplémentaires ordinaires : jusqu'à 30 livraisons de plus, 40 € d'heures chacune. */
export const HEURES_SUP = { livraisons: 30, cout: 40 } as const;
/** Les samedis de la pointe : 40 livraisons de plus, 55 € d'heures chacune, et des chauffeurs fatigués. */
export const SAMEDIS = { livraisons: 40, cout: 55, retard: 0.05 } as const;
/** Deux équipages de renfort pour la pointe : intérimaires, et porteurs loués s'il n'y en a pas de libres. */
export const RENFORT = { livraisons: 72, interim: 2000, location: 1800 } as const;
/** La pointe de printemps, en agglomération. */
export const POINTE = { de: 8, a: 10 } as const;
/** Reprendre les tournées lointaines : trois porteurs loués à la semaine, si les vôtres sont rendus. */
export const REPRISE = { location: 2700 } as const;

export const BUDGET = 280000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les tournées de la semaine partent sans être revues. */
export const PERTE_PAR_JOUR = 800;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  offre: 0,
  contrat: 1,
  location: 2,
  pointe: 3,
  coutComplet: 4,
  prestataire: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [2, 3, 2, 3, 1, 0] as const;

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
  effet: { capacite?: number; retard?: number; variable?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "panne",
    titre: "Un porteur immobilisé",
    de: "Seydou Coulibaly",
    role: "Chef d'atelier",
    texte:
      "Le porteur 4 est immobilisé une semaine : embrayage. Sans porteur de rechange, c'est une tournée d'agglomération en moins.",
    duree: 1,
    effet: { capacite: -36 },
  },
  {
    id: "grippe",
    titre: "La grippe chez les chauffeurs",
    de: "Ressources humaines",
    role: "Plateforme de Corbas",
    texte: "Deux chauffeurs de l'agglomération sont arrêtés, l'un dix jours, l'autre une semaine.",
    duree: 2,
    effet: { capacite: -27 },
  },
  {
    id: "travaux",
    titre: "Travaux sur la rocade Est",
    de: "Nour Bensalem",
    role: "Planificatrice des tournées",
    texte:
      "Deux semaines de travaux de nuit qui débordent sur le matin : bouchons à chaque sortie, les tournées perdent une heure.",
    duree: 2,
    effet: { capacite: -30, retard: 0.04 },
  },
  {
    id: "gazole",
    titre: "Le gazole s'envole",
    de: "Achats",
    role: "Siège",
    texte:
      "Le gazole professionnel prend 15 % en dix jours. Le transporteur, lui, ne révise ses prix qu'à l'échéance de son contrat.",
    duree: 3,
    effet: { variable: 1.15 },
  },
  {
    id: "neige",
    titre: "Neige sur le Nord-Isère et les Monts du Lyonnais",
    de: "Nour Bensalem",
    role: "Planificatrice des tournées",
    texte:
      "Deux jours de neige au-dessus de 400 mètres : les chantiers des hauteurs sont injoignables le matin, une livraison lointaine sur huit part en retard.",
    duree: 1,
    effet: { retard: 0.12 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  agglo: number;
  lointaines: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'ampleur de la pointe de printemps en agglomération. */
  pointe: number;
  /** Le transporteur perd des chauffeurs : la semaine où son service dérape, et sa part de retards. */
  derapage: { semaine: number; taux: number };
  /** La part de votre surplus de pointe qu'il peut prendre sous contrat ; sans contrat, bien moins. */
  dispo: number;
  /** Fait-il passer une hausse, si le contrat le permet ? */
  uHausse: number;
  /** Se redresse-t-il quand on le met en demeure ? */
  uRedressement: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000231 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      agglo: borne(1 + 0.04 * gauss(r), 0.9, 1.1),
      lointaines: borne(1 + 0.05 * gauss(r), 0.88, 1.12),
    });
  }
  const pointe = 1.18 + 0.24 * r();
  const derapage = { semaine: 6 + Math.floor(r() * 4), taux: 0.08 + 0.22 * r() };
  const dispo = borne(0.98 - (derapage.taux - 0.08) * 1.6 + 0.05 * gauss(r), 0.5, 1);
  const uHausse = r();
  const uRedressement = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, pointe, derapage, dispo, uHausse, uRedressement, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux à peu près, la mise en demeure redresse le service. */
export const CHANCE_REDRESSEMENT = 0.55;
export const seRedresse = (graine: number) => hasard(graine).uRedressement < CHANCE_REDRESSEMENT;
/** La hausse passe-t-elle ? Seulement si le contrat est révisable, et selon le hasard. */
export const hausseAppliquee = (chemin: readonly number[], graine: number) =>
  !CONTRATS[chemin[D.contrat]!]!.ferme && hasard(graine).uHausse < HAUSSE.chance;

/** Qui livre les tournées lointaines, semaine par semaine. */
export function lointainesConfiees(chemin: readonly number[], w: number): boolean {
  const [d1, , d3, , , d6] = chemin;
  if (d6 === 2 && w >= 11) return false;
  if ((d1 === 0 || d1 === 1) && w >= 3) return true;
  return (d1 === 3 || d3 === 1) && w >= 7;
}

/** La part de l'agglomération confiée au transporteur, semaine par semaine. */
export function partAggloConfiee(chemin: readonly number[], w: number): number {
  const [d1, , , , d5] = chemin;
  if (d1 === 0 && w >= 3) return 1;
  if (d1 === 3 && w >= 7) return 1;
  if (d5 === 0 && w >= 10) return 1;
  if (d5 === 2 && w >= 10) return 0.5;
  return 0;
}

/** Les porteurs loués sont-ils encore dans la flotte ? */
const porteursLoues = (chemin: readonly number[], w: number) =>
  w <= LOUES.finDeContrat || chemin[D.location] === 0 || chemin[D.location] === 2;

export type Semaine = {
  /** Ce que la semaine a coûté, pénalités comprises. */
  cout: number;
  /** Le coût cumulé depuis le début du trimestre. */
  couts: number;
  /** Ce que coûte une livraison en moyenne, tout compris : flotte, transporteur, pénalités. */
  coutLivraison: number;
  /**
   * Le coût complet d'une livraison d'agglomération, tel que le contrôle de gestion
   * le calcule : ses coûts directs, et une part des frais communs au prorata des
   * livraisons faites par la flotte. 0 quand la flotte ne livre plus l'agglomération.
   */
  coutCompletAgglo: number;
  /** La part des livraisons arrivées en retard. */
  retard: number;
  /** La part des retards sur les tournées lointaines. */
  retardLointaines: number;
  /** Pénalités clients cumulées. */
  penalites: number;
  /** Ce qui a été payé cette semaine pour des porteurs et des chauffeurs à l'arrêt. */
  arret: number;
  /** Le prix payé au transporteur, cette semaine. */
  transporteur: number;
  /** La part des livraisons confiées au transporteur. */
  partConfiee: number;
  /** La part des retards du transporteur. */
  retardTransporteur: number;
  /** Les livraisons d'agglomération qui n'ont pas pu partir le jour prévu. */
  reportees: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget, pénalités comprises : positif, la logistique est sous le budget. */
  objectif: number;
  cout: number;
  penalites: number;
  /** Ce qu'ont coûté les porteurs et les chauffeurs payés à l'arrêt. */
  arret: number;
  retardMoyen: number;
  /** Bâtiments Sirand a appliqué la pénalité de son contrat-cadre. */
  grandCompte: boolean;
  hausse: boolean;
  redressement: boolean;
  /** La part du trimestre confiée au transporteur. */
  partConfiee: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, d4, , d6] = chemin;
  const contrat = CONTRATS[d2!]!;
  const hausse = hausseAppliquee(chemin, graine);
  const redresse = d6 === 1 && seRedresse(graine);
  const semaines: (Semaine | null)[] = [null];
  let couts = 0;
  let penalites = 0;
  let arretTotal = 0;
  let retards = 0;
  let livrees = 0;
  let confiees = 0;
  let retardSirand = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const enPointe = w >= POINTE.de && w <= POINTE.a;
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // Les porteurs loués libres : dans la flotte, et sans tournée lointaine à faire.
    const loinConfiees = lointainesConfiees(chemin, w);
    const louesEnFlotte = porteursLoues(chemin, w);
    const libres = louesEnFlotte && loinConfiees ? LOUES.nombre : 0;

    let capacite = CAPACITE_AGGLO;
    let retardEnPlus = 0;
    let gazole = 1;
    for (const a of actifs) {
      const e = a.imprevu.effet;
      // Un porteur libre remplace celui qui est immobilisé.
      if (e.capacite) capacite += a.imprevu.id === "panne" && libres > 0 ? 0 : e.capacite;
      retardEnPlus += e.retard ?? 0;
      gazole *= e.variable ?? 1;
    }

    // Le transporteur : son prix, son service.
    const actif = w >= 3;
    const majoration = hausse && w >= HAUSSE.semaine && !redresse ? 1 + HAUSSE.taux : 1;
    const prixAgglo = (TARIFS.agglo + contrat.ecart) * majoration;
    const prixLoin = (TARIFS.lointaines + contrat.ecart) * majoration;
    let tauxT = w >= h.derapage.semaine ? h.derapage.taux : RETARDS.transporteur;
    if (redresse && w >= 12) tauxT = RETARDS.transporteur;
    tauxT += retardEnPlus;

    // Les volumes, et qui les livre.
    const agglo = LIVRAISONS.agglo * n.agglo * (enPointe ? h.pointe : 1);
    const loin = LIVRAISONS.lointaines * n.lointaines;
    let aggloExt = agglo * partAggloConfiee(chemin, w);
    let aggloInt = agglo - aggloExt;
    const loinInt = loinConfiees ? 0 : loin;
    let loinExt = loinConfiees ? loin : 0;
    let loinSecond = 0;
    if (d6 === 3 && w >= 11 && loinExt > 0) {
      loinSecond = loinExt / 2;
      loinExt -= loinSecond;
    }
    // Le volume garanti : ce qui manque au minimum est facturé, alors on le remplit.
    let manque = 0;
    if (actif && contrat.minimum > 0) {
      const ecart = contrat.minimum - (aggloExt + loinExt);
      if (ecart > 0) {
        const transfert = Math.min(ecart, aggloInt);
        aggloInt -= transfert;
        aggloExt += transfert;
        manque = ecart - transfert;
      }
    }

    // L'agglomération en interne : ce qui dépasse la capacité.
    let reste = Math.max(0, aggloInt - capacite);
    let fatigue = 0;
    let depense = 0;
    let versT = 0;
    let renfort = 0;
    if (enPointe && d4 === 2 && reste > 0) {
      renfort = Math.min(reste, RENFORT.livraisons);
      reste -= renfort;
      depense += RENFORT.interim + (libres >= 2 ? 0 : RENFORT.location);
    } else if (enPointe && d4 === 2) {
      depense += RENFORT.interim + (libres >= 2 ? 0 : RENFORT.location);
    }
    if (enPointe && d4 === 1 && reste > 0) {
      const part = contrat.priorite ? h.dispo : borne(h.dispo - 0.5, 0, 1);
      versT = reste * part;
      reste -= versT;
    }
    const hs = Math.min(reste, HEURES_SUP.livraisons);
    reste -= hs;
    let samedis = 0;
    if (enPointe && d4 === 0) {
      samedis = Math.min(reste, SAMEDIS.livraisons);
      reste -= samedis;
      fatigue = SAMEDIS.retard;
    }
    const reportees = reste;
    depense += hs * HEURES_SUP.cout + samedis * SAMEDIS.cout + reportees * REPORT;

    // Les coûts de la flotte.
    const aggloFlotte = aggloInt - versT;
    let flotte = CDI.nombre * CDI.semaine + PROPRES.nombre * PROPRES.amortissement + FIXES_COMMUNS;
    flotte +=
      w <= LOUES.finDeContrat
        ? LOUES.nombre * LOUES.loyer
        : d3 === 0
          ? LOUES.nombre * LOUES.renouvele
          : d3 === 2
            ? LOUES.nombre * LOUES.courteDuree
            : 0;
    flotte += aggloFlotte * VARIABLE.agglo * gazole;
    if (loinInt > 0) {
      flotte += INTERIM.nombre * INTERIM.semaine + HEURES_SUP_LOINTAINES * n.lointaines;
      flotte += loinInt * VARIABLE.lointaines * gazole;
      if (!louesEnFlotte) flotte += REPRISE.location;
    }
    flotte += depense;

    // Le transporteur, et le second s'il y en a un.
    const versTotal = aggloExt + versT + loinExt;
    let transporteur = (aggloExt + versT) * prixAgglo + loinExt * prixLoin + manque * prixAgglo;
    if (loinSecond > 0) transporteur += loinSecond * SECOND.lointaines;
    if (d6 === 3 && w === 11 && loinSecond > 0) transporteur += SECOND.miseEnPlace;

    // Les retards, et ce que les clients facturent.
    const rA = RETARDS.agglo + retardEnPlus + fatigue;
    const rL = RETARDS.lointaines + retardEnPlus;
    const rS = RETARDS.transporteur + retardEnPlus;
    const retardsLoin = loinInt * rL + loinExt * tauxT + loinSecond * rS;
    const nRetards = aggloFlotte * rA + (aggloExt + versT) * tauxT + retardsLoin + reportees;
    let penalite = nRetards * PENALITE_RETARD;
    if (contrat.service && versTotal > 0 && tauxT > SERVICE.seuil) {
      penalite -= (tauxT - SERVICE.seuil) * versTotal * SERVICE.penalite;
    }
    const retardLointaines = retardsLoin / loin;
    // Les chantiers de Sirand suivent les tournées lointaines, sauf s'ils passent au second transporteur.
    const tauxSirand = loinSecond > 0 ? rS : retardLointaines;
    if (w >= GRAND_COMPTE.de && w <= GRAND_COMPTE.a) retardSirand += tauxSirand;
    if (
      w === GRAND_COMPTE.a &&
      retardSirand / (GRAND_COMPTE.a - GRAND_COMPTE.de + 1) > GRAND_COMPTE.seuil
    ) {
      penalite += GRAND_COMPTE.penalite;
    }

    // Ce qui a été payé pour rien : porteurs loués libres, chauffeurs sans tournée.
    const loyerSemaine =
      w <= LOUES.finDeContrat
        ? LOUES.loyer
        : d3 === 0
          ? LOUES.renouvele
          : d3 === 2
            ? LOUES.courteDuree
            : 0;
    const arret =
      (louesEnFlotte && loinConfiees ? LOUES.nombre * loyerSemaine : 0) +
      (Math.max(0, capacite - aggloFlotte) / CAPACITE_AGGLO) * CDI.nombre * CDI.semaine;

    // Le coût complet de l'agglomération : ses coûts directs, sa part des frais communs, et les
    // porteurs loués qui restent à payer quand les tournées lointaines ne sont plus faites.
    const completAgglo =
      aggloFlotte * VARIABLE.agglo * gazole +
      CDI.nombre * CDI.semaine +
      PROPRES.nombre * PROPRES.amortissement +
      depense +
      (FIXES_COMMUNS * aggloFlotte) / Math.max(1, aggloFlotte + loinInt) +
      (loinInt > 0 ? 0 : louesEnFlotte ? LOUES.nombre * loyerSemaine : 0);

    cout += flotte + transporteur + penalite;
    couts += cout;
    penalites += penalite;
    arretTotal += arret;
    const total = agglo + loin;
    retards += nRetards;
    livrees += total;
    confiees += versTotal + loinSecond;
    semaines.push({
      cout,
      couts,
      coutLivraison: cout / total,
      coutCompletAgglo: aggloFlotte > 1 ? completAgglo / aggloFlotte : 0,
      retard: nRetards / total,
      retardLointaines,
      penalites,
      arret,
      transporteur,
      partConfiee: (versTotal + loinSecond) / total,
      retardTransporteur: tauxT,
      reportees,
    });
  }

  return {
    semaines,
    objectif: BUDGET - couts,
    cout: couts,
    penalites,
    arret: arretTotal,
    retardMoyen: retards / livrees,
    grandCompte: retardSirand / (GRAND_COMPTE.a - GRAND_COMPTE.de + 1) > GRAND_COMPTE.seuil,
    hausse,
    redressement: redresse,
    partConfiee: confiees / livrees,
  };
}

/** Ce qui s'est passé pendant des semaines : le service du transporteur, sa hausse, Sirand, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const confie = (w: number) => (t.semaines[w]?.partConfiee ?? 0) > 0;
  return {
    derapage: dans(h.derapage.semaine) && confie(h.derapage.semaine) && h.derapage.taux >= 0.12,
    hausse: t.hausse && dans(10) && confie(10),
    grandCompte: t.grandCompte && dans(13),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureLivraisons {
  couts: number | null;
  budgetADate: number | null;
  coutLivraison: number | null;
  retard: number | null;
  penalites: number | null;
  arret: number | null;
  /** Non affichées : ce que les messages et les sources lisent. */
  coutCompletAgglo: number | null;
  partConfiee: number | null;
  retardTransporteur: number | null;
  retardLointaines: number | null;
  /** 1 quand Ventajol a annoncé sa hausse (à partir de la semaine 10). */
  hausse: number | null;
  /** La semaine où le service de Ventajol a dérapé, une fois qu'elle est passée ; 0 sinon. */
  derapage: number | null;
}

/** Ce que Maëlys lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureLivraisons {
  if (semaine === 0) {
    return {
      couts: 0,
      budgetADate: 0,
      coutLivraison: (COUT_SEMAINE + RETARDS_ORDINAIRES * PENALITE_RETARD) / TOTAL_LIVRAISONS,
      coutCompletAgglo: COUT_COMPLET_AGGLO,
      retard: RETARDS_ORDINAIRES / TOTAL_LIVRAISONS,
      penalites: 0,
      arret: ((CAPACITE_AGGLO - LIVRAISONS.agglo) / CAPACITE_AGGLO) * CDI.nombre * CDI.semaine,
      partConfiee: 0,
      retardTransporteur: RETARDS.transporteur,
      retardLointaines: RETARDS.lointaines,
      hausse: 0,
      derapage: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  const h = hasard(graine);
  return {
    couts: s.couts,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    coutLivraison: s.coutLivraison,
    coutCompletAgglo: s.coutCompletAgglo > 0 ? s.coutCompletAgglo : null,
    retard: s.retard,
    penalites: s.penalites,
    arret: s.arret,
    partConfiee: s.partConfiee,
    retardTransporteur: s.retardTransporteur,
    retardLointaines: s.retardLointaines,
    hausse: semaine >= 10 && hausseAppliquee(chemin, graine) ? 1 : 0,
    derapage: semaine >= h.derapage.semaine ? h.derapage.semaine : 0,
  };
}
