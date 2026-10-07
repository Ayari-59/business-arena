/**
 * EMBAUCHER OU LOUER DES FREELANCES — le modèle de la practice Data et
 * systèmes d'information d'Atlas Conseil.
 *
 * Trente consultants en CDI, trente-huit consultants équivalents temps plein
 * (ETP) de missions à staffer : il en manque huit. La demande mêle des
 * contrats-cadres pluriannuels (la banque Kervalis, un groupement hospitalier,
 * un industriel, une mutuelle, des clients récurrents) et une vague de
 * missions de mise en conformité liées à une échéance réglementaire au
 * 30 juin, dont Bruxelles votera le sort fin mars. Treize semaines, de janvier
 * à mars, six décisions. Quatre mécanismes font l'épisode, et le joueur doit
 * les découvrir :
 *
 *   · LE TEMPS D'UN CONSULTANT NE SE STOCKE PAS, ET UN CDI SE PAIE TOUTES LES
 *     SEMAINES. Un consultant en CDI coûte 83 200 € par an chargés, qu'il soit
 *     en mission ou en intercontrat ; staffé, il rapporte 1 725 € de marge par
 *     semaine, en intercontrat il en coûte 1 600. Un freelance de Freelancia
 *     coûte 770 € par jour facturé (700 € de TJM et 10 % de commission) : il
 *     ne laisse que 180 € de marge par jour, mais il s'arrête sous cinq jours,
 *     sans coût. Le CDI ne vaut mieux que s'il facture plus de 108 jours par
 *     an (83 200 / 770) : c'est le seuil d'intercontrat.
 *   · LA DEMANDE A UNE PART DURABLE ET UNE PART QUI PEUT RETOMBER. Trente-trois
 *     ETP sont portés par des contrats-cadres ; cinq tiennent à l'échéance du
 *     30 juin, et le vote de fin mars peut la reporter de deux ans (environ
 *     45 %), la maintenir (35 %) ou l'élargir aux ETI (20 %). Pour un
 *     consultant de plus embauché pour la vague, l'occupation attendue d'avril
 *     à décembre est d'environ un tiers : sous le seuil. Le noyau permanent se
 *     dimensionne sur la part durable ; le reste se loue. Et quand une demande
 *     devient sûre en cours de trimestre (l'extension du contrat-cadre de
 *     Kervalis), c'est l'inverse : la louer coûte la marge.
 *   · UN CDI MET DEUX À TROIS MOIS À ARRIVER. Le cabinet de recrutement
 *     (11 200 € par embauche) présente des candidats en préavis : huit à onze
 *     semaines, et quatre de plus au-delà de trois postes ouverts à la fois.
 *     Un freelance déjà en mission se convertit en CDI tout de suite, pour
 *     les frais de conversion de Freelancia, s'il l'accepte.
 *   · TROP DE FREELANCES SUR UNE MISSION SENSIBLE FAIT PERDRE LE SAVOIR-FAIRE,
 *     ET PARFOIS LE CLIENT. La banque Kervalis recrute en direct les freelances
 *     qu'on lui place (le poste quitte alors Atlas pour l'année) ; un
 *     freelance part aussi parfois en cours de mission pour un meilleur TJM,
 *     et le forfait en pâtit. Une sous-traitance au forfait porte ce risque à
 *     la place du cabinet, contre un prix plus élevé. Un engagement de volume
 *     auprès de Freelancia fait baisser le TJM, mais rend payant ce qui était
 *     gratuit : arrêter un freelance.
 *
 * L'objectif, en euros : la marge de la practice sur le trimestre, PLUS la
 * marge d'avril à décembre que la structure en place fin mars permet
 * d'estimer, recalculée avec ce que le trimestre a révélé (le vote de
 * Bruxelles, les lots perdus, les engagements pris). Dans la projection, les
 * freelances s'ajustent chaque semaine au besoin ; les CDI, les recrutements
 * lancés, les départs naturels (un par trimestre) et l'engagement auprès de
 * Freelancia, eux, restent. Intercontrat et coûts de recrutement compris.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La projection va jusqu'à la fin de l'année : semaines 14 à 52. */
export const FIN_ANNEE = 52;

/** Les jours facturés par semaine d'un consultant en mission à plein temps, CDI ou freelance. */
export const JOURS_MISSION = 3.5;
/** Le TJM moyen de vente de la practice Data. */
export const TJM = 950;
/** Ce que rapporte une semaine d'un ETP en mission. */
export const REVENU_ETP = JOURS_MISSION * TJM;

/** Un consultant en CDI : salaire brut moyen, charges patronales, formation et poste de travail. */
export const CDI = { brut: 56000, charges: 0.45, frais: 2000 } as const;
/** Le coût annuel complet d'un consultant en CDI : 83 200 €. */
export const COUT_CDI_AN = CDI.brut * (1 + CDI.charges) + CDI.frais;
/** Le même, par semaine, en mission ou non : 1 600 €. */
export const COUT_CDI_SEMAINE = COUT_CDI_AN / FIN_ANNEE;
/** Les jours ouvrés d'un consultant par an, et l'occupation que le cabinet vise. */
export const JOURS_OUVRES = 210;
export const OCCUPATION_CIBLE = 0.75;
/** Le coût de revient d'une journée facturée par un CDI à l'occupation cible : 528 €. */
export const COUT_REVIENT_JOUR = COUT_CDI_AN / (JOURS_OUVRES * OCCUPATION_CIBLE);

/** Un freelance de Freelancia : son TJM, et la commission de la plateforme. */
export const FREELANCE = { tjm: 700, commission: 0.1 } as const;
/** Ce qu'Atlas paie par jour facturé par un freelance : 770 €. */
export const TJM_ACHAT = FREELANCE.tjm * (1 + FREELANCE.commission);
/** Le seuil d'intercontrat : au-dessous de 108 jours facturés par an, un CDI coûte plus qu'un freelance. */
export const SEUIL_JOURS = COUT_CDI_AN / TJM_ACHAT;

/** Le cabinet de recrutement : 20 % du brut annuel, et ses délais (préavis compris). */
export const RECRUTEMENT = {
  honoraires: CDI.brut * 0.2,
  delaiMin: 8,
  delaiMax: 11,
  /** Au-delà de trois postes ouverts à la fois, chaque recrutement prend quatre semaines de plus. */
  auDela: 3,
  retard: 4,
} as const;
/** Convertir un freelance en CDI : 15 % du brut annuel à Freelancia ; il accepte deux fois sur trois. */
export const CONVERSION = { frais: CDI.brut * 0.15, chance: 0.7, semaine: 9 } as const;
/** Remplacer un départ par cooptation, recrutée pendant les trois mois de préavis : une prime, et pas de poste vide. */
export const COOPTATION = { prime: 3000, delai: 0 } as const;
/**
 * L'accord-cadre de Freelancia : un TJM d'achat de 755 € au lieu de 770, contre
 * l'engagement de garder les freelances jusqu'à fin septembre (semaine 39) ;
 * chaque freelance arrêté avant coûte quatre semaines de missions.
 */
export const ACCORD = { tjm: 755, jusqua: 39, preavis: 4, debut: 5 } as const;
export const INDEMNITE_ACCORD = ACCORD.preavis * JOURS_MISSION * ACCORD.tjm;
/** Datamaris, l'ESN partenaire : les missions réglementaires au forfait, remplacements à sa charge. */
export const SOUS_TRAITANCE = { tjm: 840 } as const;

/** La demande au départ, en ETP : les contrats-cadres, et les missions de la vague réglementaire. */
export const CONTRATS = {
  kervalis: 10,
  ght: 7,
  pellerau: 6,
  mutuelle: 4,
  recurrents: 6,
} as const;
export const VAGUE = { kervalis: 2, eti: 3 } as const;
/** La part durable de la demande : 33 ETP. */
export const DURABLE =
  CONTRATS.kervalis + CONTRATS.ght + CONTRATS.pellerau + CONTRATS.mutuelle + CONTRATS.recurrents;
export const VAGUE_T1 = VAGUE.kervalis + VAGUE.eti;
export const DEMANDE = DURABLE + VAGUE_T1;
export const EQUIPE = 30;
/** Les trois postes ouverts sur la plateforme de données de Kervalis. */
export const OUVERTS_KERVALIS = DURABLE - EQUIPE;
/** L'extension du contrat-cadre de Kervalis : deux ETP de plus, pour trois ans, dès la semaine 9. */
export const EXTENSION = { etp: 2, semaine: 9 } as const;
/** Les freelances démarrent en semaine 3. */
export const DEMARRAGE_FREELANCES = 3;

/**
 * LE VOTE DE BRUXELLES, fin mars : le sort de l'échéance du 30 juin, et la
 * demande de la vague (en ETP) aux deuxième, troisième et quatrième trimestres.
 */
export const SCENARIOS = {
  reportee: { chance: 0.45, vague: [0, 0, 0] },
  maintenue: { chance: 0.35, vague: [5, 1, 0] },
  elargie: { chance: 0.2, vague: [6, 6, 6] },
} as const;
export type Scenario = keyof typeof SCENARIOS;

/** Les départs naturels d'avril à décembre : un par trimestre. */
export const DEPARTS_NATURELS = [20, 32, 44] as const;
/** Les consultants de Kéroual Consulting, disponibles en avril (semaine 14), sans frais de cabinet. */
export const KEROUAL = { semaine: 14, nombre: 4, brut: 63000 } as const;
/** Leur coût par semaine : des seniors, mieux payés que la moyenne de la practice (1 795 €). */
export const COUT_KEROUAL_SEMAINE = (KEROUAL.brut * (1 + CDI.charges) + CDI.frais) / FIN_ANNEE;
/** Appeler les clients de la vague : deux jours de deux managers. */
export const SONDAGE = { cout: 4 * TJM, semaine: 9 } as const;
/** La chance que les clients se disent engagés pour l'année, selon ce que le vote fera. */
export const SONDAGE_FAVORABLE: Record<Scenario, number> = {
  reportee: 0.05,
  maintenue: 0.2,
  elargie: 0.9,
};
/** Le plan de croissance : cinq recrutements de plus, lancés en semaine 12. */
export const CROISSANCE = { nombre: 5, semaine: 12 } as const;
/** Ne plus prendre de missions de la vague à partir de la semaine 18. */
export const SANS_VAGUE = 18;

/** Les risques des freelances : démarché par Kervalis, départ en cours de mission. */
export const DEMARCHE = { chance: 0.03, passation: 4000 } as const;
export const DEPART = { chance: 0.022, cout: 6500 } as const;
/** Faire passer trois consultants chez Kervalis : deux jours de passation chacun. */
export const PASSATION = OUVERTS_KERVALIS * 2 * TJM;
/** Un client dont les postes restent vides quatre semaines confie son lot à un concurrent, jusqu'à fin juin. */
export const PATIENCE = 4;
export const RETOUR_DU_LOT = 27;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : Ruben ne facture pas sa propre mission. */
export const PERTE_PAR_JOUR = 1300;
/** La marge du trimestre que la présidente attend. */
export const OBJECTIF_T1 = 650000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  placement: 1,
  accord: 2,
  extension: 3,
  keroual: 4,
  comite: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 1, 3, 3, 3] as const;

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
  effet: { absents?: number; contrats?: number; demission?: boolean; commission?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "demission",
    titre: "Une démission",
    de: "Loïs Corlay",
    role: "Consultant senior",
    texte:
      "Je vous préviens avant l'officiel : je rejoins un éditeur de logiciels. Préavis raccourci d'un commun accord, je pars dans quatre semaines.",
    duree: 1,
    effet: { demission: true },
  },
  {
    id: "grippe",
    titre: "La grippe dans l'équipe",
    de: "Maïmouna Riou",
    role: "Manager, practice Data",
    texte:
      "Quatre consultants arrêtés cette semaine. Les clients sont prévenus, les jours ne seront pas facturés.",
    duree: 1,
    effet: { absents: 4 },
  },
  {
    id: "gel",
    titre: "Le groupement hospitalier gèle ses bons de commande",
    de: "Wanda Gaborit",
    role: "Acheteuse, GHT Estuaire-Vendée",
    texte:
      "Le budget n'est pas encore voté : je ne peux pas émettre les bons de commande des deux prochaines semaines. Trois de vos consultants devront attendre.",
    duree: 2,
    effet: { contrats: -3 },
  },
  {
    id: "decalage",
    titre: "Pellerau décale un lot",
    de: "Nikita Guilbaud",
    role: "DSI, Pellerau Industries",
    texte:
      "Notre recette est repoussée : le lot de reprise des tableaux de bord démarrera avec deux semaines de retard. Deux de vos consultants n'ont rien à faire chez nous d'ici là.",
    duree: 2,
    effet: { contrats: -2 },
  },
  {
    id: "commission",
    titre: "Les freelances renégocient",
    de: "Galaad Tavernier",
    role: "Responsable grands comptes, Freelancia",
    texte:
      "Le marché des profils data se tend : nos freelances demandent 40 € de plus par jour pendant un mois, faute de quoi certains partiront.",
    duree: 4,
    effet: { commission: 40 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** La part des jours prévus réellement facturés, semaine par semaine. */
  realisation: readonly number[];
  scenario: Scenario;
  /** Le délai de chacun des recrutements lancés par le cabinet, en semaines. */
  delais: readonly number[];
  /** Kervalis démarche-t-il un freelance, poste par poste, semaine par semaine ? */
  demarche: readonly (readonly number[])[];
  /** Un freelance part-il en cours de mission, poste par poste, semaine par semaine ? */
  depart: readonly (readonly number[])[];
  /** Les deux freelances à qui l'on propose un CDI acceptent-ils ? */
  accepte: readonly [number, number];
  /** Ce que diront les clients de la vague s'ils sont appelés. */
  sondage: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000763 + 7);
  const sondage = r();
  const u = r();
  const scenario: Scenario =
    u < SCENARIOS.reportee.chance
      ? "reportee"
      : u < SCENARIOS.reportee.chance + SCENARIOS.maintenue.chance
        ? "maintenue"
        : "elargie";
  const realisation = [0];
  for (let w = 1; w <= SEMAINES; w += 1) realisation.push(borne(1 + 0.03 * gauss(r), 0.92, 1.08));
  const delais = Array.from(
    { length: 10 },
    () =>
      RECRUTEMENT.delaiMin + Math.floor(r() * (RECRUTEMENT.delaiMax - RECRUTEMENT.delaiMin + 1)),
  );
  const grille = (n: number) =>
    Array.from({ length: SEMAINES + 1 }, () => Array.from({ length: n }, () => r()));
  const demarche = grille(OUVERTS_KERVALIS);
  const depart = grille(14);
  const accepte: [number, number] = [r(), r()];
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { realisation, scenario, delais, demarche, depart, accepte, sondage, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Les clients de la vague se disent-ils engagés pour l'année ? */
export const sondageFavorable = (graine: number) => {
  const h = hasard(graine);
  return h.sondage < SONDAGE_FAVORABLE[h.scenario];
};
/** Combien des deux freelances acceptent le CDI qu'on leur propose. */
export const conversionsAcceptees = (graine: number) =>
  hasard(graine).accepte.filter((a) => a < CONVERSION.chance).length;

/** Combien de recrutements le plan de la semaine 1 lance. */
export const RECRUTEMENTS_PLAN = [8, 3, 0, 0] as const;
/** Combien de consultants de Kéroual sont embauchés, selon la décision et le sondage. */
export const embauchesKeroual = (chemin: readonly number[], graine: number) => {
  const d5 = chemin[D.keroual];
  if (d5 === 0) return KEROUAL.nombre;
  if (d5 === 1) return 2;
  if (d5 === 2) return sondageFavorable(graine) ? 2 : 0;
  return 0;
};

/** Les semaines d'arrivée des CDI recrutés, et les frais de chacun, selon les décisions. */
export function arrivees(chemin: readonly number[], graine: number) {
  const h = hasard(graine);
  const [d1, , , d4, , d6] = chemin;
  const liste: { semaine: number; frais: number; origine: string; cabinet: boolean }[] = [];
  let tirage = 0;
  /** Les recrutements par le cabinet : au-delà de trois postes ouverts à la fois, quatre semaines de plus. */
  const cabinet = (n: number, lancement: number, origine: string) => {
    const ouverts = liste.filter((a) => a.cabinet && a.semaine > lancement).length;
    for (let i = 0; i < n; i += 1) {
      const delai = h.delais[tirage % h.delais.length]!;
      tirage += 1;
      const retard = i + ouverts >= RECRUTEMENT.auDela ? RECRUTEMENT.retard : 0;
      liste.push({
        semaine: lancement + delai + retard,
        frais: RECRUTEMENT.honoraires,
        origine,
        cabinet: true,
      });
    }
  };
  cabinet(RECRUTEMENTS_PLAN[d1!]!, 1, "plan");
  if (d4 === 2) cabinet(EXTENSION.etp, 6, "extension");
  if (d4 === 1) {
    // Les freelances qui acceptent passent en CDI tout de suite ; un refus, et le poste part au cabinet.
    const acceptes = conversionsAcceptees(graine);
    for (let i = 0; i < acceptes; i += 1) {
      liste.push({
        semaine: CONVERSION.semaine,
        frais: CONVERSION.frais,
        origine: "conversion",
        cabinet: false,
      });
    }
    cabinet(EXTENSION.etp - acceptes, CONVERSION.semaine, "extension");
  }
  for (let i = 0; i < embauchesKeroual(chemin, graine); i += 1) {
    liste.push({ semaine: KEROUAL.semaine, frais: 0, origine: "keroual", cabinet: false });
  }
  if (d6 === 0) cabinet(CROISSANCE.nombre, CROISSANCE.semaine, "croissance");
  if (d6 === 1) {
    for (const w of DEPARTS_NATURELS) {
      liste.push({
        semaine: w + COOPTATION.delai,
        frais: COOPTATION.prime,
        origine: "cooptation",
        cabinet: false,
      });
    }
  }
  return liste;
}

export type Semaine = {
  /** La marge de la semaine, et depuis le début du trimestre. */
  margeSemaine: number;
  marge: number;
  /** Consultants en CDI présents, et freelances en mission. */
  cdi: number;
  freelances: number;
  /** La part des consultants en CDI qui facturent cette semaine. */
  occupation: number;
  /** Les jours d'intercontrat cumulés depuis le début du trimestre. */
  intercontrat: number;
  /** Les ETP de missions que personne ne tient cette semaine. */
  nonPourvus: number;
  /** Le coût d'une journée facturée : salaires, freelances, sous-traitance, recrutement. */
  coutJour: number;
  /** La demande de la semaine, en ETP. */
  demande: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge du trimestre plus la marge projetée d'avril à décembre. */
  objectif: number;
  margeT1: number;
  projection: number;
  scenario: Scenario;
  /** Consultants en CDI fin mars, et attendus fin décembre. */
  cdiFin: number;
  cdiDecembre: number;
  /** Les ETP de demande durable fin mars : contrats-cadres moins les postes perdus, extension comprise. */
  durableFin: number;
  /** Les freelances recrutés en direct par Kervalis. */
  demarches: number;
  /** Les freelances partis en cours de mission. */
  departs: number;
  /** Un client a confié son lot à un concurrent faute de consultants. */
  lotPerdu: boolean;
  /** Les jours d'intercontrat : au trimestre, et projetés d'avril à décembre. */
  intercontratT1: number;
  intercontratProjete: number;
  /** Les honoraires de recrutement et frais de conversion, sur l'année. */
  recrutement: number;
  /** Les indemnités payées à Freelancia pour des freelances arrêtés avant septembre. */
  indemnites: number;
  conversions: number;
  sondage: boolean | null;
  /** Ce qui est arrivé pendant le trimestre, semaine par semaine, du fait des décisions et du hasard. */
  faits: readonly Fait[];
}

export interface Fait {
  semaine: number;
  quoi: "demarche" | "depart" | "lot" | "arrivee" | "indemnite";
  /** Le nombre de personnes, ou le montant pour une indemnité. */
  n: number;
}

interface Etat {
  cdi: number;
  engages: number;
  indemnites: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, , d6] = chemin;
  const libre = d1 !== 3;
  const liste = arrivees(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  const etat: Etat = { cdi: EQUIPE, engages: 0, indemnites: 0 };
  let marge = 0;
  let intercontrat = 0;
  let recrutement = 0;
  let ouvertsK = OUVERTS_KERVALIS;
  let perdus = 0;
  let perdusLot = 0;
  let extensionPerdue = false;
  let demarches = 0;
  let departs = 0;
  let vides = 0;
  let lotPerdu = false;
  let extension = d4 !== 3;
  const faits: Fait[] = [];
  const noter = (semaine: number, quoi: Fait["quoi"], n: number) => {
    if (semaine > SEMAINES) return;
    const deja = faits.find((x) => x.semaine === semaine && x.quoi === quoi);
    if (deja) deja.n += n;
    else faits.push({ semaine, quoi, n });
  };
  const demission = h.imprevus.find((i) => i.imprevu.effet.demission);
  const finDemission = demission ? demission.semaine + 4 : 99;

  /** Le TJM d'achat, et l'engagement de l'accord-cadre : arrêter un freelance engagé se paie. */
  const payerFreelances = (w: number, n: number, jours: number, majoration: number) => {
    if (w === ACCORD.debut && d3 !== 1) etat.engages = d3 === 0 ? 6 : 3;
    let indemnite = 0;
    if (w <= ACCORD.jusqua && etat.engages > n) {
      indemnite = (etat.engages - n) * INDEMNITE_ACCORD;
      etat.indemnites += indemnite;
      etat.engages = n;
    }
    const engages = w <= ACCORD.jusqua ? Math.min(n, etat.engages) : 0;
    return (
      indemnite +
      jours * (engages * (ACCORD.tjm + majoration) + (n - engages) * (TJM_ACHAT + majoration))
    );
  };

  for (let w = 1; w <= FIN_ANNEE; w += 1) {
    const projete = w > SEMAINES;
    const f = projete ? 1 : h.realisation[w]!;
    const actifs = projete
      ? []
      : h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // Les consultants en CDI : les arrivées (une semaine d'intégration), les départs.
    let cdi = EQUIPE - (w >= finDemission ? 1 : 0);
    let integration = 0;
    let seniors = 0;
    for (const a of liste) {
      if (a.semaine <= w) cdi += 1;
      if (a.semaine <= w && a.origine === "keroual") seniors += 1;
      if (a.semaine === w) {
        if (a.origine === "plan" || a.origine === "extension") noter(w, "arrivee", 1);
        integration += a.origine === "conversion" ? 0 : 1;
        cout += a.frais;
        recrutement += a.frais;
      }
    }
    cdi -= DEPARTS_NATURELS.filter((x) => x <= w).length;
    let productifs = cdi - integration;
    let majoration = 0;
    let contrats = 0;
    for (const a of actifs) {
      const e = a.imprevu.effet;
      productifs -= e.absents ?? 0;
      contrats += e.contrats ?? 0;
      majoration += e.commission ?? 0;
    }

    // La demande : les contrats-cadres, l'extension de Kervalis, la vague.
    const rendu = w >= RETOUR_DU_LOT;
    const ext =
      w >= EXTENSION.semaine && (extension || (extensionPerdue && rendu)) ? EXTENSION.etp : 0;
    const durable = DURABLE - perdus - (rendu ? 0 : perdusLot) + ext + contrats;
    const trimestre = Math.min(2, Math.floor((w - 1) / 13) - 1);
    let vague = projete ? SCENARIOS[h.scenario].vague[trimestre]! : VAGUE_T1;
    if (d6 === 2 && w >= SANS_VAGUE) vague = 0;
    const demande = durable + vague;

    // Qui tient les postes : CDI d'abord, puis sous-traitance, freelances, ou personne.
    const sousTraites = !projete && d2 === 2 && w >= DEMARRAGE_FREELANCES ? vague : 0;
    const aStaffer = demande - sousTraites;
    const staffes = Math.min(productifs, aStaffer);
    const ecart = aStaffer - staffes;
    // Kervalis attend les embauches : ses postes ouverts ne vont qu'aux CDI arrivés.
    const enAttente =
      !projete && d2 === 3 ? Math.max(0, Math.min(ouvertsK, ouvertsK - (cdi - EQUIPE))) : 0;
    let freelances = 0;
    if (projete) freelances = ecart;
    else if (w >= DEMARRAGE_FREELANCES) {
      if (libre) freelances = Math.max(0, ecart - enAttente);
      else freelances = Math.min(ecart, d4 === 0 ? ext : 0);
    }
    const nonPourvus = ecart - freelances;

    // Les postes de contrats-cadres vides quatre semaines : le client confie le lot à un concurrent.
    if (!projete && w >= DEMARRAGE_FREELANCES && !lotPerdu) {
      const durablesVides = d2 === 3 && libre ? enAttente : Math.min(ouvertsK, nonPourvus);
      vides = durablesVides > 0 ? vides + 1 : 0;
      if (vides >= PATIENCE) {
        lotPerdu = true;
        noter(w, "lot", durablesVides);
        perdusLot += durablesVides;
        ouvertsK -= Math.min(ouvertsK, durablesVides);
        // C'est Kervalis qui attendait : l'extension part avec le lot, jusqu'à fin juin.
        if ((d2 === 0 || d2 === 3) && extension) {
          extension = false;
          extensionPerdue = true;
        }
      }
    }

    // Les freelances placés chez Kervalis : démarchés en direct, selon le hasard.
    if (!projete && d2 === 0 && w >= DEMARRAGE_FREELANCES) {
      const exposes = Math.min(ouvertsK, freelances);
      for (let i = 0; i < exposes; i += 1) {
        if (h.demarche[w]![i]! < DEMARCHE.chance) {
          demarches += 1;
          noter(w, "demarche", 1);
          perdus += 1;
          ouvertsK -= 1;
          cout += DEMARCHE.passation;
        }
      }
    }
    // Les freelances qui partent en cours de mission, pour un meilleur TJM.
    if (!projete && w >= DEMARRAGE_FREELANCES) {
      for (let i = 0; i < freelances; i += 1) {
        if (h.depart[w]![i]! < DEPART.chance) {
          departs += 1;
          noter(w, "depart", 1);
          cout += DEPART.cout;
        }
      }
    }

    const facturesETP = staffes + freelances + sousTraites;
    const revenu = facturesETP * REVENU_ETP * f;
    const indemnitesAvant = etat.indemnites;
    const coutFreelances = payerFreelances(w, freelances, JOURS_MISSION * f, majoration);
    if (etat.indemnites > indemnitesAvant) noter(w, "indemnite", etat.indemnites - indemnitesAvant);
    cout += (cdi - seniors) * COUT_CDI_SEMAINE + seniors * COUT_KEROUAL_SEMAINE + coutFreelances;
    cout += sousTraites * JOURS_MISSION * f * SOUS_TRAITANCE.tjm;
    if (w === DEMARRAGE_FREELANCES && (d2 === 1 || d2 === 2)) cout += PASSATION;
    if (w === SONDAGE.semaine && chemin[D.keroual] === 2) cout += SONDAGE.cout;

    const idle = Math.max(0, productifs - staffes);
    intercontrat += idle * JOURS_MISSION;
    const margeSemaine = revenu - cout;
    marge += margeSemaine;
    const coutTotal = cout;
    semaines.push({
      margeSemaine,
      marge,
      cdi,
      freelances,
      occupation: cdi > 0 ? staffes / cdi : 0,
      intercontrat,
      nonPourvus,
      coutJour: coutTotal / Math.max(1, facturesETP * JOURS_MISSION * f),
      demande,
    });
    if (w === SEMAINES) etat.cdi = cdi;
  }

  const t1 = semaines[SEMAINES]!;
  const fin = semaines[FIN_ANNEE]!;
  return {
    semaines: semaines.slice(0, SEMAINES + 1),
    objectif: fin.marge,
    margeT1: t1.marge,
    projection: fin.marge - t1.marge,
    scenario: h.scenario,
    cdiFin: t1.cdi,
    cdiDecembre: fin.cdi,
    durableFin: DURABLE - perdus - perdusLot + (extension ? EXTENSION.etp : 0),
    demarches,
    departs,
    lotPerdu,
    intercontratT1: t1.intercontrat,
    intercontratProjete: fin.intercontrat - t1.intercontrat,
    recrutement,
    indemnites: etat.indemnites,
    conversions: d4 === 1 ? conversionsAcceptees(graine) : 0,
    sondage: chemin[D.keroual] === 2 ? sondageFavorable(graine) : null,
    faits,
  };
}

/** Ce qui est arrivé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    faits: t.faits.filter((x) => dans(x.semaine)),
    vote: dans(SEMAINES),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LecturePractice {
  marge: number | null;
  occupation: number | null;
  intercontrat: number | null;
  nonPourvus: number | null;
  coutJour: number | null;
  /** Non affichées : ce que les messages et les sources lisent. */
  freelances: number | null;
  cdi: number | null;
  demande: number | null;
  demarches: number | null;
  lotPerdu: number | null;
}

/** Ce que Ruben lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePractice {
  if (semaine === 0) {
    return {
      marge: 0,
      occupation: 1,
      intercontrat: 0,
      nonPourvus: DEMANDE - EQUIPE,
      coutJour: COUT_CDI_SEMAINE / JOURS_MISSION,
      freelances: 0,
      cdi: EQUIPE,
      demande: DEMANDE,
      demarches: 0,
      lotPerdu: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const avant = (quoi: Fait["quoi"]) =>
    t.faits.filter((x) => x.quoi === quoi && x.semaine <= semaine).reduce((n, x) => n + x.n, 0);
  return {
    marge: s.marge,
    occupation: s.occupation,
    intercontrat: s.intercontrat,
    nonPourvus: s.nonPourvus,
    coutJour: s.coutJour,
    freelances: s.freelances,
    cdi: s.cdi,
    demande: s.demande,
    demarches: avant("demarche"),
    lotPerdu: avant("lot") > 0 ? 1 : 0,
  };
}
