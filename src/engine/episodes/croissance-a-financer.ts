/**
 * LA CROISSANCE À FINANCER — le modèle d'Arvel Rénovation.
 *
 * Une filiale qui vend et pose des menuiseries et des isolations pour les
 * particuliers, et qui vient de gagner un gros marché chez un bailleur privé.
 * Treize semaines, six décisions. Trois mécanismes font l'épisode, et le
 * joueur doit les découvrir :
 *
 *   · LA CROISSANCE CONSOMME DE LA TRÉSORERIE. Le marché Altaïr est rentable,
 *     mais il paie à 60 jours sur situations mensuelles : 77 jours entre les
 *     travaux et l'encaissement, quand les menuiseries sont livrées deux
 *     semaines avant la pose et payées 56 jours après la livraison. Le besoin
 *     en fonds de roulement monte de 560 k€ en onze semaines, et y reste tant
 *     que le marché tourne : c'est un besoin STRUCTUREL. Le résultat monte, la
 *     trésorerie descend : l'effet de ciseaux. À l'inverse, la croissance chez
 *     les particuliers, qui versent 30 % d'acompte à la commande, se finance
 *     elle-même ; baisser l'acompte pour vendre plus, c'est perdre la ressource
 *     et gagner des désistements sur des menuiseries faites sur mesure.
 *   · CHAQUE BESOIN SON FINANCEMENT. Un besoin durable se finance par des
 *     ressources stables, qui font monter le fonds de roulement : un prêt à
 *     moyen terme (que la banque accorde sur un dossier chiffré, et pour 70 %
 *     du besoin), le dividende laissé en compte courant par le groupe. Le
 *     découvert ne finance que les à-coups, comme les primes de fin mars : là,
 *     il est le bon outil, et un prêt à cinq ans serait trop lent et trop cher.
 *     Demander « plus de découvert » pour un besoin permanent, c'est demander à
 *     la banque ce qu'elle refuse le plus souvent.
 *   · AU-DELÀ DU PLAFOND, L'INCIDENT. Une semaine au-delà de l'autorisation de
 *     découvert coûte un taux majoré et une commission ; surtout, la banque
 *     rejette des LCR. Un incident de paiement est déclaré à la Banque de
 *     France, et Valcourt, le fabricant, suspend ses livraisons une semaine
 *     (le chantier s'arrête, Altaïr applique ses pénalités) puis ne livre plus
 *     qu'à 30 jours : le BFR remonte encore. Au-delà de la tolérance de la
 *     banque, les LCR reviennent impayées, et tant que des factures attendent,
 *     Valcourt reprend ses menuiseries d'autant plus souvent qu'elles pèsent.
 *     Le même mécanisme punit les paiements qui glissent. D'où le rythme : un
 *     second marché, dont la caution immobilise un gage-espèces et dont le
 *     BFR s'ajoute à celui d'Altaïr, se prend à la mesure de ce qu'on peut
 *     financer.
 *
 * Le trimestre est jugé en euros : le résultat de la filiale après frais
 * financiers et coûts des incidents, en écart au budget.
 *
 * Le fonds de roulement, le BFR et la trésorerie sont tenus séparément, et la
 * trésorerie nette vaut toujours FRNG − BFR : le solde du compte n'en diffère
 * que des créances mobilisées en Dailly, une dette bancaire à court terme.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives ; montants hors taxes, la TVA mise à
 * part.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * L'ACTIVITÉ.
 * ------------------------------------------------------------------------- */

/** Le chiffre d'affaires des particuliers, par semaine. */
export const CA_PARTICULIERS = 180000;
export const TMCV_PARTICULIERS = 0.36;
/** Le BFR de l'activité particuliers, en jours de chiffre d'affaires. */
export const JOURS_BFR_PARTICULIERS = 15;
/** Les menuiseries, en part du prix de vente, pour tous les chantiers. */
export const PART_MENUISERIES = 0.5;

/** Le marché Altaïr : 3,65 M€ par an, soit 70 k€ par semaine et 10 k€ par jour. */
export const CA_ALTAIR = 70000;
export const CA_ALTAIR_PAR_JOUR = CA_ALTAIR / 7;
export const TMCV_ALTAIR = 0.2;
/** La première semaine de pose ; deux de plus si l'on obtient de décaler le démarrage. */
export const DEBUT_ALTAIR = 2;
export const DECALAGE = 2;
/** Le conducteur de travaux du marché, recruté en semaine 1. */
export const FIXES_ALTAIR = 2500;

/** Les charges fixes de la filiale, par semaine, dont la provision des primes de fin mars. */
export const FIXES = 60000;
export const PROVISION_PRIMES = 3000;
/** Les primes de résultat déjà provisionnées au 1er janvier, versées avec la paie de mars. */
export const PRIMES_DEPART = 124000;
export const SEMAINE_PRIMES = 12;

/* ---------------------------------------------------------------------------
 * LE BFR DU MARCHÉ ALTAÏR, en jours de chiffre d'affaires hors taxes.
 * ------------------------------------------------------------------------- */

/** Situation mensuelle (15 jours en moyenne), visa du maître d'œuvre (2 jours), 60 jours. */
export const JOURS_CLIENTS_ALTAIR = 77;
/** Les menuiseries arrivent deux semaines avant la pose. */
export const SEMAINES_AVANCE = 2;
/** Valcourt est payé par LCR 56 jours après la livraison. */
export const DELAI_VALCOURT = 56;
/** Celui qu'il impose après un incident : 30 jours. */
export const DELAI_VALCOURT_COURT = 30;
export const JOURS_STOCK_ALTAIR = 7 * SEMAINES_AVANCE * PART_MENUISERIES;
export const JOURS_FOURNISSEURS_ALTAIR = DELAI_VALCOURT * PART_MENUISERIES;
export const JOURS_BFR_ALTAIR =
  JOURS_CLIENTS_ALTAIR + JOURS_STOCK_ALTAIR - JOURS_FOURNISSEURS_ALTAIR;
/** Le BFR du marché en régime : (77 + 7 − 28) jours × 10 k€ = 560 k€. */
export const BFR_ALTAIR = JOURS_BFR_ALTAIR * CA_ALTAIR_PAR_JOUR;
/** Le BFR au 1er janvier : les particuliers, moins les primes provisionnées. */
export const BFR_DEPART = (JOURS_BFR_PARTICULIERS * CA_PARTICULIERS) / 7 - PRIMES_DEPART;

/* ---------------------------------------------------------------------------
 * LE SECOND MARCHÉ, celui de la Foncière Clairval.
 * ------------------------------------------------------------------------- */
export const CA_CLAIRVAL = 80000;
export const TMCV_CLAIRVAL = 0.18;
export const DEBUT_CLAIRVAL = 10;
/** Deux équipes nouvelles sur le lot complet : 60 % de rendement les deux premières semaines. */
export const RODAGE = 0.6;
export const FIXES_CLAIRVAL = { complet: 3000, moitie: 1500 } as const;
export const DEMARRAGE_CLAIRVAL = { complet: 8000, moitie: 3000 } as const;
/** L'acompte de démarrage qu'on peut demander, en part du premier bon de commande. */
export const ACOMPTE_CLAIRVAL = 90000;
/**
 * La caution de bonne exécution qu'exige Clairval : 5 % du montant annuel du lot. Faute de
 * ligne de cautions, la banque ne la délivre que contre un gage-espèces de la moitié, bloqué
 * sur un compte jusqu'à la réception : une immobilisation financière, qui ampute le FRNG.
 */
export const GAGE_CLAIRVAL = 0.05 * 0.5 * CA_CLAIRVAL * 52;
export const SEMAINE_GAGE = 9;
export const CHANCE_ACOMPTE_CLAIRVAL = 0.4;

/* ---------------------------------------------------------------------------
 * LA CAMPAGNE DU SALON DE L'HABITAT : quatre semaines de commandes, posées quatre semaines après.
 * ------------------------------------------------------------------------- */
export const SEMAINES_CAMPAGNE = [6, 7, 8, 9] as const;
export const DELAI_POSE = 4;
/** Le solde des particuliers arrive deux semaines après la pose ; l'organisme de crédit paie en une. */
export const DELAI_SOLDE = 2;
export const STAND = 8000;
export interface Formule {
  /** Les commandes de chaque semaine de campagne. */
  commandes: number;
  acompte: number;
  /** La part des commandes annulées une fois les menuiseries fabriquées. */
  desistements: number;
  /** La part des soldes qui ne seront jamais payés. */
  impayes: number;
  /** La commission de l'organisme de crédit, sur le montant financé. */
  commission: number;
}
export const FORMULES: readonly (Formule | null)[] = [
  { commandes: 34000, acompte: 0.1, desistements: 0.19, impayes: 0.04, commission: 0 },
  { commandes: 30000, acompte: 0.3, desistements: 0.02, impayes: 0, commission: 0 },
  { commandes: 34000, acompte: 0.1, desistements: 0.06, impayes: 0, commission: 0.05 },
  null,
];

/* ---------------------------------------------------------------------------
 * LES FINANCEMENTS.
 * ------------------------------------------------------------------------- */
/** La trésorerie nette au 1er janvier : le compte est à découvert de 100 k€. */
export const SOLDE_DEPART = -100000;
export const AUTORISATION = 300000;
export const TAUX_DECOUVERT = 0.07;
export const TAUX_DEPASSEMENT = 0.14;
/** La commission d'intervention d'une semaine au-delà de l'autorisation. */
export const COMMISSION_DEPASSEMENT = 500;
/** Ce que la banque laisse passer au-delà de l'autorisation ; plus loin, elle rejette tout. */
export const TOLERANCE = 100000;
/** Les pénalités de retard des fournisseurs impayés : taux de la BCE plus dix points. */
export const TAUX_PENALITES = 0.12;

/** Le prêt à moyen terme : 70 % du besoin chiffré, cinq ans, six mois de différé. */
export const PRET = 400000;
export const TAUX_PRET = 0.045;
export const FRAIS_DOSSIER = 2000;
export const SEMAINE_PRET = 3;
export const CHANCE_PRET = 0.9;
/** Le relèvement du découvert demandé sans dossier : rarement accordé pour un besoin durable. */
export const AUTORISATION_RELEVEE = 700000;
export const CHANCE_RELEVEMENT = 0.35;
export const COMMISSION_ENGAGEMENT = 2000;

export const DIVIDENDE = 250000;
export const SEMAINE_DIVIDENDE = 5;
/** Le taux de la convention de trésorerie du groupe, pour un compte courant bloqué. */
export const TAUX_COMPTE_COURANT = 0.055;
/** L'augmentation de capital souscrite par le groupe : fonds en semaine 9, frais d'acte. */
export const SEMAINE_CAPITAL = 9;
export const FRAIS_CAPITAL = 4000;

/** Le plafond d'encours que l'assureur-crédit de Valcourt accepte à partir de la semaine 10. */
export const PLAFOND_VALCOURT = 250000;
export const SEMAINE_PLAFOND = 10;
export const GARANTIE_GROUPE = 900;
/** Le second fabricant est 4 % plus cher. */
export const SURCOUT_ORSEL = 0.04;
export const CHANCE_VALCOURT_TOLERE = 0.4;

/** La mobilisation en Dailly des situations visées d'Altaïr, en semaine 12. */
export const DAILLY = 250000;
export const TAUX_DAILLY = 0.055;
export const COMMISSION_DAILLY = 0.004;
/** La convention-cadre de cession Dailly, à signer avec la banque, et le bordereau. */
export const FRAIS_DAILLY = 2400;
/** Le prêt complémentaire demandé pour le pic : les frais, et une réponse après le trimestre. */
export const FRAIS_PRET_PIC = 1500;
export const FRAIS_REPORT = 600;

/* ---------------------------------------------------------------------------
 * LES INCIDENTS.
 * ------------------------------------------------------------------------- */
/** Frais de rejet, pénalités de retard et indemnité forfaitaire du créancier. */
export const FRAIS_INCIDENT = 1500;
/** Les pénalités d'Altaïr pour une semaine de chantier arrêté. */
export const PENALITES_ALTAIR = 6000;
/** La chance qu'une LCR soit rejetée, une semaine au-delà de l'autorisation. */
export const risqueDeRejet = (depassement: number) =>
  depassement > 0 ? Math.min(0.9, 0.2 + depassement / 150000) : 0;
/** Tant que des factures restent impayées, Valcourt retient la livraison d'autant plus souvent qu'elles sont lourdes. */
export const risqueDeRetenue = (arrieres: number) =>
  arrieres > 0 ? Math.min(0.5, arrieres / 400000) : 0;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux retarde la commande de la première tranche. */
export const PERTE_PAR_JOUR = 1500;
/** Le résultat du trimestre inscrit au budget, marché Altaïr compris. */
export const BUDGET = 180000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  financement: 0,
  dividende: 1,
  salon: 2,
  clairval: 3,
  valcourt: 4,
  pic: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [0, 0, 3, 2, 0, 1] as const;

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
    /** Multiplie les poses chez les particuliers, et sur les chantiers des bailleurs. */
    particuliers?: number;
    chantiers?: number;
    /** Une charge, une fois. */
    perte?: number;
    /** Un encaissement bloqué jusqu'à la fin du trimestre. */
    bloque?: number;
    /** Une surcharge sur le prix des menuiseries des chantiers. */
    surcharge?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "tempete",
    titre: "Une semaine de tempête",
    de: "Silvère Darmont",
    role: "Chef de chantier",
    texte:
      "Vent et pluie toute la semaine : impossible de déposer des fenêtres. Les poses glissent au trimestre prochain.",
    duree: 1,
    effet: { particuliers: 0.7, chantiers: 0.5 },
  },
  {
    id: "aluminium",
    titre: "Une surcharge sur l'aluminium",
    de: "Dorian Lefort",
    role: "Responsable grands comptes, Menuiseries Valcourt",
    texte:
      "Le cours de l'aluminium s'envole : nous appliquons une surcharge de 6 % sur les menuiseries livrées pendant trois semaines.",
    duree: 3,
    effet: { surcharge: 0.06 },
  },
  {
    id: "litige",
    titre: "Un client conteste sa pose",
    de: "Rayan Belhadj",
    role: "Directeur commercial",
    texte:
      "Une copropriété de Caluire conteste l'étanchéité de ses baies et bloque son solde de 24 k€ en attendant l'expert.",
    duree: 1,
    effet: { bloque: 24000 },
  },
  {
    id: "accident",
    titre: "Un accident sur le chantier Altaïr",
    de: "Silvère Darmont",
    role: "Chef de chantier",
    texte:
      "Un poseur intérimaire est tombé d'un escabeau. Rien de grave, mais le chantier s'est arrêté deux jours pour l'enquête, et l'agence d'intérim refacture le remplacement.",
    duree: 1,
    effet: { chantiers: 0.6, perte: 3000 },
  },
  {
    id: "urssaf",
    titre: "Un redressement de l'URSSAF",
    de: "Paola Ricci",
    role: "Cheffe comptable",
    texte:
      "Le contrôle de l'URSSAF se termine : 12 k€ de redressement sur les indemnités de grand déplacement des poseurs, à payer tout de suite.",
    duree: 1,
    effet: { perte: 12000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  particuliers: number;
  chantiers: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'affluence du salon de l'habitat. */
  salon: number;
  /** Le comité de crédit : le prêt, ou le relèvement du découvert. */
  uBanque: number;
  /** La Foncière Clairval verse-t-elle un acompte de démarrage ? */
  uClairval: number;
  /** Valcourt tolère-t-il un encours au-delà du plafond de son assureur ? */
  uValcourt: number;
  /** Valcourt accepte-t-il le report des LCR de fin mars sans réagir ? */
  uReport: number;
  /** Chaque semaine au-delà de l'autorisation, une LCR est-elle rejetée ? */
  uRejet: readonly number[];
  /** Chaque semaine d'impayés, Valcourt retient-il la livraison ? */
  uArret: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000291 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      particuliers: Math.min(1.12, Math.max(0.88, 1 + 0.05 * gauss(r))),
      chantiers: Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r))),
    });
  }
  const salon = Math.min(1.25, Math.max(0.75, 1 + 0.12 * gauss(r)));
  const uBanque = r();
  const uClairval = r();
  const uValcourt = r();
  const uReport = r();
  const uRejet = [1, ...Array.from({ length: SEMAINES }, () => r())];
  const uArret = [1, ...Array.from({ length: SEMAINES }, () => r())];
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, salon, uBanque, uClairval, uValcourt, uReport, uRejet, uArret, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Le hasard « moyen » d'une prévision : pas de bruit, pas d'accident, une banque ordinaire. */
const HASARD_MOYEN: Hasard = {
  semaines: [null, ...Array.from({ length: SEMAINES }, () => ({ particuliers: 1, chantiers: 1 }))],
  salon: 1,
  uBanque: 0.5,
  uClairval: 1,
  uValcourt: 0,
  uReport: 1,
  uRejet: Array.from({ length: SEMAINES + 1 }, () => 1),
  uArret: Array.from({ length: SEMAINES + 1 }, () => 1),
  imprevus: [],
};

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Sur dossier, le comité accorde le prêt plus de huit fois sur dix. */
export const pretAccordeSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.financement] === 1 && h.uBanque < CHANCE_PRET;
export const pretAccorde = (chemin: readonly number[], graine: number) =>
  pretAccordeSous(chemin, hasard(graine));
/** Sans dossier, pour un besoin durable, il relève le découvert un peu plus d'une fois sur trois. */
export const relevementSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.financement] === 2 && h.uBanque < CHANCE_RELEVEMENT;
export const relevementAccorde = (chemin: readonly number[], graine: number) =>
  relevementSous(chemin, hasard(graine));
/** La Foncière Clairval accepte de verser un acompte quatre fois sur dix ; sinon, elle passe au suivant. */
export const clairvalAccepteSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.clairval] === 3 && h.uClairval < CHANCE_ACOMPTE_CLAIRVAL;
export const clairvalAccepte = (chemin: readonly number[], graine: number) =>
  clairvalAccepteSous(chemin, hasard(graine));
/** Valcourt, laissé au-delà du plafond, tolère quatre fois sur dix ; sinon, il suspend et exige. */
export const valcourtExigeSous = (chemin: readonly number[], h: Hasard) =>
  chemin[D.valcourt] === 0 && h.uValcourt >= CHANCE_VALCOURT_TOLERE;
/** Les LCR reportées : une fois sur deux, l'assureur de Valcourt réagit ; quatre fois sur cinq après un incident. */
export const chanceDeSuspension = (dejaIncident: boolean) => (dejaIncident ? 0.8 : 0.5);

/** La taille du lot Clairval qu'on prend : 1, la moitié, ou rien. */
export function lotClairval(chemin: readonly number[], h: Hasard): number {
  const d = chemin[D.clairval];
  if (d === 0) return 1;
  if (d === 1) return 0.5;
  if (d === 3) return clairvalAccepteSous(chemin, h) ? 1 : 0;
  return 0;
}

export type Semaine = {
  /** Le découvert utilisé en fin de semaine, positif. */
  decouvert: number;
  autorisation: number;
  depassement: number;
  /** Le solde du compte : positif, de la trésorerie disponible. */
  solde: number;
  /** Ce qu'il faudrait financer : le découvert, plus les factures que la banque a rejetées. */
  besoin: number;
  /** Fonds de roulement net global : ressources stables − emplois stables. */
  frng: number;
  /** Besoin en fonds de roulement : créances + stocks − fournisseurs − acomptes reçus − dettes sociales. */
  bfr: number;
  /** Trésorerie nette : FRNG − BFR, Dailly compris en dette. */
  tresorerie: number;
  /** Le chiffre d'affaires de la semaine. */
  ca: number;
  /** Le résultat cumulé depuis le 1er janvier. */
  resultat: number;
  /** Le résultat de la semaine. */
  resultatSemaine: number;
  /** Frais financiers et coûts des incidents de la semaine. */
  frais: number;
  /** Ce que la filiale doit à Valcourt. */
  encours: number;
  /** Les factures fournisseurs échues, impayées faute de provision. */
  arrieres: number;
  incident: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Le résultat après frais financiers et incidents, en écart au budget : positif, au-dessus. */
  objectif: number;
  resultat: number;
  marge: number;
  /** Agios, intérêts, commissions, frais de dossier et de mobilisation. */
  fraisFinanciers: number;
  /** Frais de rejet, pénalités d'Altaïr, marge perdue des semaines arrêtées. */
  coutIncidents: number;
  /** Désistements, impayés et commission de crédit de la campagne. */
  pertesCampagne: number;
  pretAccorde: boolean;
  relevementAccorde: boolean;
  /** La banque a refusé ce qu'on lui demandait en semaine 2 : le prêt, ou le relèvement. */
  refusBanque: boolean;
  clairval: number;
  /** Les semaines où une LCR a été rejetée. */
  incidents: readonly number[];
  /** Les semaines où le chantier s'est arrêté, faute de livraisons. */
  arrets: readonly number[];
  valcourtCourt: boolean;
  /** Valcourt a suspendu ses livraisons à la suite d'une décision (plafond, LCR reportées). */
  valcourtSuspend: number | null;
  semainesEnDepassement: number;
  decouvertMax: number;
  frngFinal: number;
  bfrFinal: number;
  /** Le BFR du marché Altaïr en semaine 13. */
  bfrAltair: number;
  desistements: number;
  arrieresMax: number;
}

interface Lot {
  montant: number;
  echeance: number;
  /** Une livraison du marché Altaïr. */
  altair?: boolean;
}

/** Un paiement à `delai` semaines : réparti entre les deux semaines qui l'encadrent. */
function etaler(lots: Lot[], montant: number, semaine: number, delai: number, altair: boolean) {
  if (montant <= 0) return;
  const n = Math.floor(delai);
  const f = delai - n;
  if (1 - f > 1e-9) lots.push({ montant: montant * (1 - f), echeance: semaine + n, altair });
  if (f > 1e-9) lots.push({ montant: montant * f, echeance: semaine + n + 1, altair });
}
const du = (lots: readonly Lot[], w: number) =>
  lots.reduce((s, l) => s + (l.echeance > w ? l.montant : 0), 0);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  return simulerSous(chemin, hasard(graine), jours);
}

/** La prévision : les décisions prises, la suite inchangée, sans bruit ni accident. */
export function prevoir(decisions: readonly number[]): Trimestre {
  return simulerSous(
    NEUTRE.map((n, i) => decisions[i] ?? n),
    HASARD_MOYEN,
    0,
  );
}

function simulerSous(chemin: readonly number[], h: Hasard, jours: number): Trimestre {
  const [d1, d2, d3, , d5, d6] = chemin;
  const pret = pretAccordeSous(chemin, h);
  const releve = relevementSous(chemin, h);
  const lot = lotClairval(chemin, h);
  const formule = FORMULES[d3 ?? 3] ?? null;
  const debutAltair = d1 === 3 ? DEBUT_ALTAIR + DECALAGE : DEBUT_ALTAIR;

  // Les chantiers prévus, semaine par semaine (jusqu'à deux semaines après le trimestre).
  const prevuAltair = (w: number) => (w >= debutAltair ? CA_ALTAIR : 0);
  const rodage = lot === 1 && chemin[D.clairval] === 0 ? RODAGE : 1;
  const prevuClairval = (w: number) =>
    w >= DEBUT_CLAIRVAL ? CA_CLAIRVAL * lot * (w < DEBUT_CLAIRVAL + 2 ? rodage : 1) : 0;
  const ventilation = lot === 1 ? "complet" : lot > 0 ? "moitie" : null;

  // Les postes du BFR.
  const lissage = [CA_PARTICULIERS, CA_PARTICULIERS, CA_PARTICULIERS, CA_PARTICULIERS];
  let stockAltair = 0;
  let stockClairval = 0;
  const creancesAltair: Lot[] = [];
  const creancesClairval: Lot[] = [];
  const valcourt: Lot[] = [];
  const fournisseursSalon: Lot[] = [];
  const creancesSalon: Lot[] = [];
  let stockSalon = 0;
  let acomptesRecus = 0;
  let dettesSociales = PRIMES_DEPART;
  let bloque = 0;
  let mobilise = 0;
  /** Les factures fournisseurs échues que la banque n'a pas payées. */
  let arrieres = 0;

  // Les ressources stables : au départ, trésorerie nette + BFR.
  let frng = SOLDE_DEPART + BFR_DEPART;
  let resultat = 0;
  let marge = 0;
  let fraisFinanciers = 0;
  let coutIncidents = 0;
  let pertesCampagne = 0;
  let desistements = 0;
  let compteCourant = 0;

  // La première tranche d'Altaïr est arrivée la semaine dernière, pour les poses de la semaine 2.
  if (debutAltair === DEBUT_ALTAIR) {
    const livree = prevuAltair(DEBUT_ALTAIR) * PART_MENUISERIES;
    stockAltair += livree;
    etaler(valcourt, livree, 0, DELAI_VALCOURT / 7, true);
  }

  let valcourtCourt = false;
  let valcourtSuspend: number | null = null;
  const arrets = new Set<number>();
  const incidents: number[] = [];
  let decouvertMax = 0;
  let bfrAltair = 0;
  const semaines: (Semaine | null)[] = [null];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let charges = FIXES + FIXES_ALTAIR;
    let frais = 0;
    if (w === 1) charges += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

    let effetParticuliers = 1;
    let effetChantiers = 1;
    let surcharge = 0;
    for (const a of actifs) {
      effetParticuliers *= a.imprevu.effet.particuliers ?? 1;
      effetChantiers *= a.imprevu.effet.chantiers ?? 1;
      surcharge += a.imprevu.effet.surcharge ?? 0;
      if (a.semaine === w) {
        charges += a.imprevu.effet.perte ?? 0;
        bloque += a.imprevu.effet.bloque ?? 0;
      }
    }

    // Les particuliers, hors campagne : un BFR stable, en jours de chiffre d'affaires.
    const caParticuliers = CA_PARTICULIERS * n.particuliers * effetParticuliers;
    lissage.push(caParticuliers);
    const margeParticuliers = caParticuliers * TMCV_PARTICULIERS;

    // Les chantiers des bailleurs : livrés deux semaines avant la pose, payés à Valcourt ensuite.
    const delai = (valcourtCourt ? DELAI_VALCOURT_COURT : DELAI_VALCOURT) / 7;
    if (valcourtSuspend !== w) {
      const livreAltair = prevuAltair(w + SEMAINES_AVANCE) * PART_MENUISERIES;
      const livreClairval = prevuClairval(w + SEMAINES_AVANCE) * PART_MENUISERIES;
      stockAltair += livreAltair;
      stockClairval += livreClairval;
      etaler(valcourt, livreAltair, w, delai, true);
      etaler(valcourt, livreClairval, w, delai, false);
      charges += (livreAltair + livreClairval) * surcharge;
      // Le second fabricant prend le lot Clairval et un tiers d'Altaïr, 4 % plus cher.
      if (d5 === 3 && w >= SEMAINE_PLAFOND) {
        charges += (livreAltair / 3 + livreClairval) * SURCOUT_ORSEL;
      }
    }
    const arret = arrets.has(w);
    const travauxAltair = arret ? 0 : prevuAltair(w) * n.chantiers * effetChantiers;
    const travauxClairval = arret ? 0 : prevuClairval(w) * n.chantiers * effetChantiers;
    stockAltair -= Math.min(stockAltair, travauxAltair * PART_MENUISERIES);
    stockClairval -= Math.min(stockClairval, travauxClairval * PART_MENUISERIES);
    creancesAltair.push({ montant: travauxAltair, echeance: w + JOURS_CLIENTS_ALTAIR / 7 });
    creancesClairval.push({ montant: travauxClairval, echeance: w + JOURS_CLIENTS_ALTAIR / 7 });
    const margeChantiers = travauxAltair * TMCV_ALTAIR + travauxClairval * TMCV_CLAIRVAL;
    if (arret) {
      // Une semaine de chantier arrêté : la marge glisse au trimestre suivant, Altaïr pénalise.
      charges += PENALITES_ALTAIR;
      coutIncidents +=
        PENALITES_ALTAIR + prevuAltair(w) * TMCV_ALTAIR + prevuClairval(w) * TMCV_CLAIRVAL;
    }
    if (ventilation && w >= DEBUT_CLAIRVAL - 1) charges += FIXES_CLAIRVAL[ventilation];
    if (ventilation && w === DEBUT_CLAIRVAL - 1) charges += DEMARRAGE_CLAIRVAL[ventilation];
    if (w === SEMAINE_GAGE) frng -= GAGE_CLAIRVAL * lot;
    if (chemin[D.clairval] === 3 && lot === 1 && w === DEBUT_CLAIRVAL - 1) {
      acomptesRecus += ACOMPTE_CLAIRVAL;
    }

    // La campagne du salon : acompte à la commande, pose quatre semaines après, solde ensuite.
    let caSalon = 0;
    let margeSalon = 0;
    if (formule) {
      if (w === SEMAINES_CAMPAGNE[0]) charges += STAND;
      for (const k of SEMAINES_CAMPAGNE) {
        const commandes = formule.commandes * h.salon;
        if (w === k) acomptesRecus += commandes * formule.acompte;
        if (w === k + DELAI_POSE - SEMAINES_AVANCE) {
          // Fabriquées sur mesure pour toutes les commandes, désistements compris.
          stockSalon += commandes * PART_MENUISERIES;
          etaler(fournisseursSalon, commandes * PART_MENUISERIES, w, DELAI_VALCOURT / 7, false);
        }
        if (w === k + DELAI_POSE) {
          const posees = commandes * (1 - formule.desistements);
          const annulees = commandes * formule.desistements;
          caSalon += posees;
          margeSalon += posees * TMCV_PARTICULIERS;
          stockSalon -= commandes * PART_MENUISERIES;
          acomptesRecus -= commandes * formule.acompte;
          // L'acompte conservé couvre une partie des menuiseries perdues, pas toutes.
          const perte = annulees * (PART_MENUISERIES - formule.acompte);
          const reste = posees * (1 - formule.acompte);
          const commission = reste * formule.commission;
          const impayes = reste * formule.impayes;
          desistements += annulees;
          pertesCampagne += perte + commission + impayes;
          charges += perte + commission + impayes;
          creancesSalon.push({
            montant: reste - commission - impayes,
            echeance: w + (formule.commission > 0 ? 1 : DELAI_SOLDE),
          });
        }
      }
    }

    // Le plafond de l'assureur-crédit de Valcourt : au-delà, paiement à la livraison.
    if (w >= SEMAINE_PLAFOND && (d5 === 2 || valcourtExigeSous(chemin, h))) {
      if (d5 === 0 && w === SEMAINE_PLAFOND && valcourtSuspend === null) {
        // Pris de court, il suspend une semaine : le chantier s'arrête la semaine suivante.
        valcourtSuspend = w + 1;
        arrets.add(w + 1);
      }
      let exces = du(valcourt, w) - PLAFOND_VALCOURT;
      for (let i = valcourt.length - 1; i >= 0 && exces > 1e-6; i -= 1) {
        const l = valcourt[i]!;
        if (l.echeance <= w) continue;
        const paye = Math.min(l.montant, exces);
        l.montant -= paye;
        exces -= paye;
      }
    }
    if (d5 === 1 && w === SEMAINE_PLAFOND) frais += GARANTIE_GROUPE;

    // Le report des LCR de fin mars.
    if (d6 === 0 && w === 12) {
      frais += FRAIS_REPORT;
      for (const l of valcourt) if (l.echeance === 12 || l.echeance === 13) l.echeance += 2;
      if (h.uReport < chanceDeSuspension(incidents.length > 0) && valcourtSuspend === null) {
        valcourtSuspend = 13;
        arrets.add(13);
      }
    }

    // Les ressources stables : prêt, dividende, compte courant, capital.
    if (w === SEMAINE_PRET && pret) {
      frng += PRET;
      frais += FRAIS_DOSSIER;
    }
    if (w === SEMAINE_PRET && releve) frais += COMMISSION_ENGAGEMENT;
    if (w === SEMAINE_DIVIDENDE) {
      const verse = d2 === 0 || d2 === 2 ? DIVIDENDE : d2 === 3 ? DIVIDENDE / 2 : 0;
      frng -= verse;
      compteCourant += DIVIDENDE - verse;
    }
    if (d2 === 2 && w === SEMAINE_CAPITAL) {
      frng += DIVIDENDE;
      charges += FRAIS_CAPITAL;
    }
    frais +=
      ((pret && w >= SEMAINE_PRET ? PRET * TAUX_PRET : 0) + compteCourant * TAUX_COMPTE_COURANT) /
      52;

    // Les mobilisations du pic.
    if (d6 === 2 && w === 12) {
      mobilise = DAILLY;
      frais += DAILLY * COMMISSION_DAILLY + FRAIS_DAILLY;
    }
    frais += (mobilise * TAUX_DAILLY) / 52;
    if (d6 === 3 && w === 12) frais += FRAIS_PRET_PIC;

    // Les primes de fin mars, provisionnées chaque semaine.
    dettesSociales += PROVISION_PRIMES;
    if (w === SEMAINE_PRIMES) dettesSociales = 0;

    // Le BFR de fin de semaine, toutes les factures échues payées.
    const bfrParticuliers =
      (JOURS_BFR_PARTICULIERS * lissage.slice(-4).reduce((s, x) => s + x, 0)) / 4 / 7;
    const bfr =
      bfrParticuliers +
      du(creancesAltair, w) +
      du(creancesClairval, w) +
      stockAltair +
      stockClairval -
      du(valcourt, w) +
      du(creancesSalon, w) +
      stockSalon -
      du(fournisseursSalon, w) -
      acomptesRecus -
      dettesSociales +
      bloque;
    bfrAltair =
      du(creancesAltair, w) +
      stockAltair -
      du(
        valcourt.filter((l) => l.altair),
        w,
      );

    // Le découvert, l'autorisation, et ce que coûte le dépassement.
    const autorisation = releve && w >= SEMAINE_PRET ? AUTORISATION_RELEVEE : AUTORISATION;
    const margeTotale = margeParticuliers + margeChantiers + margeSalon;
    const voulu = frng + margeTotale - charges - frais - bfr + mobilise;
    const decouvertVoulu = Math.max(0, -voulu);
    const depassement = Math.min(TOLERANCE, Math.max(0, decouvertVoulu - autorisation));
    let agios = (Math.min(decouvertVoulu, autorisation) * TAUX_DECOUVERT) / 52;
    if (depassement > 0) agios += (depassement * TAUX_DEPASSEMENT) / 52 + COMMISSION_DEPASSEMENT;
    frais += agios;
    let incident = 0;
    const rejet =
      decouvertVoulu > autorisation + TOLERANCE ||
      (depassement > 0 && h.uRejet[w]! < risqueDeRejet(depassement));
    if (rejet) {
      incidents.push(w);
      incident = FRAIS_INCIDENT + (arrieres * TAUX_PENALITES) / 52;
      if (incidents.length === 1) {
        // Déclaré à la Banque de France ; Valcourt suspend une semaine, puis livre à 30 jours.
        valcourtCourt = true;
        if (w < SEMAINES && valcourtSuspend === null) {
          valcourtSuspend = w + 1;
          arrets.add(w + 1);
        }
      }
    }
    coutIncidents += incident;
    fraisFinanciers += frais;
    const resultatSemaine = margeTotale - charges - frais - incident;
    marge += margeTotale;
    resultat += resultatSemaine;
    frng += resultatSemaine;
    // Au-delà de la tolérance de la banque, les LCR reviennent impayées : les fournisseurs attendent.
    arrieres = Math.max(0, bfr - frng - mobilise - autorisation - TOLERANCE);
    if (w < SEMAINES && h.uArret[w]! < risqueDeRetenue(arrieres)) arrets.add(w + 1);
    const bfrFinal = bfr - arrieres;
    const solde = frng - bfrFinal + mobilise;
    const decouvert = Math.max(0, -solde);
    decouvertMax = Math.max(decouvertMax, decouvert);

    semaines.push({
      decouvert,
      autorisation,
      depassement: Math.max(0, decouvert - autorisation),
      solde,
      besoin: decouvert + arrieres,
      frng,
      bfr: bfrFinal,
      tresorerie: frng - bfrFinal,
      arrieres,
      ca: caParticuliers + travauxAltair + travauxClairval + caSalon,
      resultat,
      resultatSemaine,
      frais: frais + incident,
      encours: du(valcourt, w),
      incident,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const derniere = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: resultat - BUDGET,
    resultat,
    marge,
    fraisFinanciers,
    coutIncidents,
    pertesCampagne,
    pretAccorde: pret,
    relevementAccorde: releve,
    refusBanque: (d1 === 1 && !pret) || (d1 === 2 && !releve),
    clairval: lot,
    incidents,
    arrets: [...arrets].filter((w) => w <= SEMAINES).sort((a, b) => a - b),
    valcourtCourt,
    valcourtSuspend,
    semainesEnDepassement: pleines.filter((s) => s.depassement > 0).length,
    decouvertMax,
    frngFinal: derniere.frng,
    bfrFinal: derniere.bfr,
    bfrAltair,
    desistements,
    arrieresMax: Math.max(...pleines.map((s) => s.arrieres)),
  };
}

/** La situation du lundi de la semaine 1. */
export const DEPART = {
  decouvert: -SOLDE_DEPART,
  frng: SOLDE_DEPART + BFR_DEPART,
  bfr: BFR_DEPART,
} as const;

/** Ce qui s'est passé pendant des semaines : la banque, les incidents, Valcourt, Clairval, le salon. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    pretVerse: t.pretAccorde && dans(SEMAINE_PRET),
    incidents: t.incidents.filter(dans),
    /** La semaine où Valcourt passe à 30 jours, après le premier incident. */
    raccourci: t.incidents.length > 0 && dans(t.incidents[0]!) ? t.incidents[0]! : null,
    arrets: t.arrets.filter(dans),
    report: chemin[D.pic] === 0 && dans(12) ? t.valcourtSuspend !== 13 : null,
    salon: FORMULES[chemin[D.salon] ?? 3] && dans(SEMAINES_CAMPAGNE[0] + DELAI_POSE),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureCroissance {
  decouvert: number | null;
  autorisation: number | null;
  frng: number | null;
  bfr: number | null;
  ca: number | null;
  resultat: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  tresorerie: number | null;
  arrieres: number | null;
  encours: number | null;
  /** Le besoin de financement au plus haut d'ici la semaine 13, selon la prévision. */
  besoinPic: number | null;
  semainePic: number | null;
  /** La première semaine où la prévision passe au-delà de l'autorisation ; 0 : jamais. */
  premierDepassement: number | null;
  /** Le même pic, selon le sort du dividende (tant que la décision reste à prendre). */
  picDividende: number | null;
  picCompteCourant: number | null;
  /** Le même pic, selon la part du lot Clairval qu'on prend. */
  picComplet: number | null;
  picMoitie: number | null;
  picSansLot: number | null;
  /** L'encours Valcourt prévu au plus haut, et ce qu'il faudrait payer au-delà du plafond. */
  encoursMax: number | null;
  excesValcourt: number | null;
  pretAccorde: number | null;
}

/**
 * Ce que le directeur financier lit à la fin d'une semaine ; les décisions à
 * venir comptent comme « ne rien changer ». La prévision part de la situation
 * réelle de la semaine et y ajoute les flux d'un trimestre moyen.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureCroissance {
  const avec = (d: number, o: number) => {
    const c = NEUTRE.map((n, i) => decisions[i] ?? n);
    c[d] = o;
    return prevoir(c);
  };
  const reel =
    semaine > 0
      ? simuler(
          NEUTRE.map((n, i) => decisions[i] ?? n),
          graine,
          jours,
        )
      : null;
  const s = reel ? reel.semaines[semaine]! : null;
  /** Le pic à venir d'une prévision, recalée sur la situation réelle de la semaine. */
  const pic = (q: Trimestre) => {
    const decalage = s ? s.besoin - q.semaines[semaine]!.besoin : 0;
    let max = -Infinity;
    let quand = SEMAINES;
    let premier = 0;
    for (let w = semaine + 1; w <= SEMAINES; w += 1) {
      const b = q.semaines[w]!.besoin + decalage;
      if (b > max) {
        max = b;
        quand = w;
      }
      if (!premier && b > q.semaines[w]!.autorisation) premier = w;
    }
    return { max: Math.max(0, max), quand, premier };
  };
  const p = prevoir(decisions);
  const { max, quand, premier } =
    semaine < SEMAINES ? pic(p) : { max: s!.besoin, quand: SEMAINES, premier: 0 };
  const encoursPrevu = (q: Trimestre) =>
    Math.max(...q.semaines.slice(Math.max(1, semaine)).map((x) => x?.encours ?? 0));
  const ouvert = (d: number) => decisions.length <= d && semaine < SEMAINES;
  const encoursMax = encoursPrevu(avec(D.valcourt, 1));
  const lecture = {
    autorisation: s ? s.autorisation : AUTORISATION,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    besoinPic: max,
    semainePic: quand,
    premierDepassement: premier,
    picDividende: ouvert(D.dividende) ? pic(avec(D.dividende, 0)).max : null,
    picCompteCourant: ouvert(D.dividende) ? pic(avec(D.dividende, 1)).max : null,
    picComplet: ouvert(D.clairval) ? pic(avec(D.clairval, 0)).max : null,
    picMoitie: ouvert(D.clairval) ? pic(avec(D.clairval, 1)).max : null,
    picSansLot: ouvert(D.clairval) ? pic(avec(D.clairval, 2)).max : null,
    encoursMax,
    excesValcourt: (() => {
      const q = avec(D.valcourt, 1);
      let exces = 0;
      for (let w = Math.max(SEMAINE_PLAFOND, semaine + 1); w <= SEMAINES; w += 1) {
        exces = Math.max(exces, q.semaines[w]!.encours - PLAFOND_VALCOURT);
      }
      return Math.max(0, exces);
    })(),
    pretAccorde: semaine >= SEMAINE_PRET && reel ? (reel.pretAccorde ? 1 : 0) : null,
  };
  if (!s) {
    return {
      decouvert: DEPART.decouvert,
      frng: DEPART.frng,
      bfr: DEPART.bfr,
      ca: CA_PARTICULIERS,
      resultat: 0,
      tresorerie: DEPART.frng - DEPART.bfr,
      arrieres: 0,
      encours: PART_MENUISERIES * CA_ALTAIR,
      ...lecture,
    };
  }
  return {
    decouvert: s.decouvert,
    frng: s.frng,
    bfr: s.bfr,
    ca: s.ca,
    resultat: s.resultat,
    tresorerie: s.tresorerie,
    arrieres: s.arrieres,
    encours: s.encours,
    ...lecture,
  };
}
