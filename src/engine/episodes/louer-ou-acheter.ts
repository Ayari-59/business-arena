/**
 * LOUER OU ACHETER — le modèle d'Arvel Location.
 *
 * Arvel Location loue aux artisans du bâtiment des mini-pelles, des nacelles,
 * des échafaudages et des bétonnières. Quand son parc ne suffit pas, elle
 * sous-loue chez un loueur partenaire et refacture la journée à l'artisan.
 * Le trimestre va de janvier à mars : un creux d'hiver, puis la saison qui
 * monte. Treize semaines, six décisions. Trois mécanismes font l'épisode, et
 * le joueur doit les découvrir :
 *
 *   · UNE MACHINE COÛTE UN COÛT TOTAL, PAS UNE MENSUALITÉ. Achetée à crédit,
 *     une mini-pelle coûte sur trois ans son prix, moins sa valeur de
 *     revente, plus les intérêts et l'entretien ; en location longue durée,
 *     trente-six loyers sans rien à revendre ; chez le partenaire, une
 *     journée chaque fois qu'on s'en sert. Les deux premières sont des coûts
 *     FIXES, la troisième un coût VARIABLE : posséder ne vaut que pour une
 *     machine qui tourne plus de huit jours par mois environ. Le socle sûr de
 *     la demande se possède, la pointe se loue. Comparer la mensualité
 *     d'emprunt au loyer de LLD, ou choisir ce qui « ne sort pas de
 *     trésorerie », ne dit rien de tout cela.
 *   · LA DEMANDE EST INCERTAINE, ET L'ACHAT NE SE REND PAS. La météo fait
 *     varier les semaines, un chantier peut être reporté, et une fois sur
 *     trois la saison se retourne en semaine 11. Une machine louée au
 *     partenaire se rend ; une machine achetée reste, et si elle n'a plus
 *     d'emploi elle doit être revendue sur un marché de l'occasion lui-même
 *     déprimé ; une LLD ne se rend qu'en payant six loyers. L'achat est
 *     moins cher en moyenne quand l'utilisation tient, et fragile quand elle
 *     tombe.
 *   · LE MATÉRIEL ANCIEN COÛTE EN PANNES. Une machine amortie ne coûte plus
 *     d'amortissement, mais elle tombe en panne plus souvent, et chaque panne
 *     coûte une réparation, une semaine d'immobilisation chez le partenaire,
 *     et parfois un client.
 *
 * Le trimestre est jugé en euros : l'écart au budget de la marge d'Arvel
 * Location, valeur du parc comprise. Le contrôle de gestion compte chaque
 * machine à son coût économique : amortissement jusqu'à la valeur de revente,
 * intérêts et entretien pour un achat ; le crédit-bail est retraité comme un
 * achat financé à crédit ; les loyers de LLD et les journées du partenaire
 * sont des charges. En fin de trimestre, une machine qui n'a pas tourné
 * 40 % du temps sur les trois dernières semaines n'a plus de valeur d'usage :
 * elle est ramenée à sa valeur de revente (dépréciation), ou sa LLD à
 * l'indemnité de restitution anticipée.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_OUVRES = 5;

/** Les mini-pelles de 2,5 t : prix, cote, entretien, tarifs. */
export const MP = {
  prix: 45000,
  /** La cote de revente à trois ans, sur un marché normal. */
  revente: 22000,
  /** L'entretien d'une machine neuve, par an (contrat du constructeur). */
  entretien: 2400,
  /** La journée facturée à l'artisan. */
  tarif: 175,
  /** Transport, nettoyage et usure d'une journée louée sur le parc d'Arvel. */
  coutVariable: 20,
  /** Le loyer mensuel de LLD sur 36 mois, entretien compris. */
  lld: 1290,
  /** Les frais d'une revente : transport, remise en état, commission. */
  fraisRevente: 1000,
} as const;

/** Les quatre anciennes mini-pelles : huit ans, 7 000 heures, amorties. */
export const ANCIENNES = {
  nombre: 4,
  /** L'entretien par machine et par an. */
  entretien: 4500,
  /** Le risque de panne par machine et par semaine. */
  risque: 0.06,
  reparationMin: 3000,
  reparationMax: 6600,
  /** La journée de demande perdue par semaine quand un client excédé part. */
  clientPerdu: 2,
  chanceClientPart: 0.5,
} as const;

/** L'emprunt bancaire : 100 % du prix hors taxes, sur 36 mois. */
export const EMPRUNT = { taux: 0.048, mois: 36 } as const;

/** Les nacelles à ciseaux de 12 m. */
export const NA = {
  prix: 28000,
  revente: 11200,
  entretien: 1200,
  tarif: 140,
  coutVariable: 12,
  fraisRevente: 800,
} as const;

/** Les nacelles tout-terrain diesel de 12 m, pour les chantiers sur terrain non stabilisé. */
export const TT = {
  prix: 36000,
  revente: 14400,
  entretien: 1500,
  /** La journée facturée à Ganivet. */
  tarif: 170,
  coutVariable: 15,
  fraisRevente: 900,
} as const;
/** La LLD d'une nacelle tout-terrain sur 36 mois, entretien compris. */
export const LLD_TT = 1180;

/** Le crédit-bail proposé pour les nacelles : 36 loyers, une option d'achat de 1 %. */
export const CREDIT_BAIL = { loyer: 830, option: 280, mois: 36 } as const;
/** La LLD des nacelles sur 36 mois, entretien compris : la nacelle est restituée. */
export const LLD_NA = 920;
/** Rendre une LLD la première année : les loyers restant dus jusqu'au douzième mois, soit neuf. */
export const INDEMNITE_LLD = 9;

/** Le loueur partenaire, à la journée : hors saison, puis au tarif de saison. */
export const PARTENAIRE = {
  mp: { hors: 115, saison: 165 },
  na: { hors: 95, saison: 130 },
  tt: { hors: 125, saison: 160 },
} as const;
/** La première semaine du tarif de saison (début mars). */
export const SAISON = 9;
/** Le contrat de saison du partenaire : le prix d'hiver bloqué, contre un minimum de journées payées. */
export const CONTRAT_SAISON = { prix: 115, minimum: 25 } as const;
/** Le second loueur, à Givors, s'il a des machines. */
export const SECOND_LOUEUR = { prix: 130, chance: 0.5 } as const;

/** Elvatec Maintenance : trois nacelles cinq jours sur cinq, pendant deux ans. */
export const ELVATEC = { jours: 15, tarif: 125, debut: 4 } as const;
/**
 * Ganivet Construction : trois nacelles tout-terrain, phase 1 ferme, phase 2
 * sous réserve. Ganivet reporte une phase sur cinq d'ordinaire, près d'une
 * sur deux quand les ventes de logements ralentissent.
 */
export const GANIVET = {
  jours: 15,
  debut: 6,
  phase2: 9,
  chanceReport: { normale: 0.15, ralentie: 0.4 },
} as const;
/** Le contrat-cadre de Sorlin Terrassement : deux mini-pelles à demeure, quatre jours par semaine. */
export const CADRE = {
  jours: 8,
  /** 25 % sous le tarif public, et 10 % si Sorlin accepte la contre-proposition. */
  prix: 131,
  prixContre: 157,
  chanceContre: 0.4,
  debut: 11,
} as const;
/** La vieille nacelle : onze ans, en panne en semaine 8. */
export const VIEILLE = {
  reparation: 5400,
  /** Le risque d'une nouvelle panne, par semaine, une fois réparée. */
  risque: 0.18,
  panne: 2800,
  /** Une pompe d'occasion, posée en semaine 12. */
  piece: 2200,
  retour: 12,
  entretien: 2000,
  /** La nacelle neuve qui la remplace, en stock chez le concessionnaire, arrive en semaine 9. */
  livraison: 9,
} as const;

/** Une fois sur trois, la saison se retourne en semaine 11. */
export const RALENTISSEMENT = {
  chance: 0.35,
  semaine: 11,
  mp: 0.5,
  na: 0.8,
  /** Le marché de l'occasion s'encombre : les loueurs vendent en même temps. */
  occasion: 0.88,
} as const;
/** Une machine de quelques semaines se revend 85 % de son prix neuf sur un marché normal. */
export const DECOTE_QUASI_NEUVE = 0.85;
/** Sans 6 jours loués sur les 15 des trois dernières semaines (40 %), une machine n'a plus d'emploi. */
export const SEUIL_EMPLOI = 6;

/** La marge des échafaudages, bétonnières et petits matériels, par semaine. */
export const AUTRES_MARGE = 7000;
/** Les frais de structure : salaires, dépôt, assurances, véhicules. */
export const STRUCTURE = 9000;
/** Le budget de marge du trimestre, valeur du parc comprise. */
export const BUDGET = 15000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des artisans qui réservent chez un concurrent. */
export const PERTE_PAR_JOUR = 800;

/** La demande de mini-pelles d'une semaine normale, en journées : l'hiver, puis la saison. */
export const DEMANDE_MP = [0, 11, 12, 12, 13, 14, 15, 17, 19, 22, 25, 28, 30, 31] as const;
/** La demande courante de nacelles, hors contrats. */
export const DEMANDE_NA = [0, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15] as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  minipelles: 0,
  elvatec: 1,
  ganivet: 2,
  saison: 3,
  vieille: 4,
  cadre: 5,
} as const;

/** Ne rien changer, décision par décision : garder les anciennes, décliner, payer le tarif du jour. */
export const NEUTRE = [3, 3, 3, 2, 3, 2] as const;

/* ---------------------------------------------------------------------------
 * LES CALCULS DE FINANCEMENT : ce que les sources donnent, et ce que le
 * contrôle de gestion compte chaque semaine.
 * ------------------------------------------------------------------------- */

/** La mensualité constante d'un emprunt. */
export function mensualite(capital: number, tauxAnnuel: number, mois: number): number {
  const r = tauxAnnuel / 12;
  return (capital * r) / (1 - (1 + r) ** -mois);
}

/** Les intérêts des `n` premiers mois d'un emprunt à mensualités constantes. */
export function interetsDesPremiersMois(
  capital: number,
  tauxAnnuel: number,
  mois: number,
  n: number,
): number {
  const r = tauxAnnuel / 12;
  const m = mensualite(capital, tauxAnnuel, mois);
  let reste = capital;
  let interets = 0;
  for (let i = 0; i < n; i += 1) {
    const x = reste * r;
    interets += x;
    reste -= m - x;
  }
  return interets;
}

export const MENSUALITE_MP = mensualite(MP.prix, EMPRUNT.taux, EMPRUNT.mois);
/** Les intérêts de l'emprunt sur trois ans. */
export const INTERETS_MP = MENSUALITE_MP * EMPRUNT.mois - MP.prix;
/** Le coût total sur trois ans d'une mini-pelle achetée à crédit, valeur de revente déduite. */
export const COUT_TOTAL_ACHAT_MP = MP.prix - MP.revente + INTERETS_MP + 3 * MP.entretien;
/** Le coût total sur trois ans d'une mini-pelle en LLD : 36 loyers, rien à revendre. */
export const COUT_TOTAL_LLD_MP = 36 * MP.lld;
/** Le seuil d'utilisation : les journées par mois au-delà desquelles posséder coûte moins que louer. */
export const SEUIL_JOURS_PAR_MOIS = COUT_TOTAL_ACHAT_MP / 36 / PARTENAIRE.mp.hors;

/** Le taux implicite du crédit-bail : celui qui égale 28 000 € aux loyers et à l'option. */
export const TAUX_CREDIT_BAIL = (() => {
  const valeur = (t: number) => {
    const r = t / 12;
    const a = (1 - (1 + r) ** -CREDIT_BAIL.mois) / r;
    return CREDIT_BAIL.loyer * a + CREDIT_BAIL.option * (1 + r) ** -CREDIT_BAIL.mois;
  };
  let bas = 0.001;
  let haut = 0.3;
  for (let i = 0; i < 80; i += 1) {
    const m = (bas + haut) / 2;
    if (valeur(m) > NA.prix) bas = m;
    else haut = m;
  }
  return (bas + haut) / 2;
})();
/** Le coût total sur trois ans d'une nacelle en crédit-bail, option levée et nacelle revendue. */
export const COUT_TOTAL_CREDIT_BAIL =
  CREDIT_BAIL.mois * CREDIT_BAIL.loyer + CREDIT_BAIL.option + 3 * NA.entretien - NA.revente;
/** Le coût total sur trois ans d'une nacelle en LLD. */
export const COUT_TOTAL_LLD_NA = 36 * LLD_NA;

/** Ce qu'une machine coûte au contrôle de gestion, par semaine, selon la manière de l'avoir. */
const amortissement = (prix: number, revente: number) => (prix - revente) / 156;
const interetsParSemaine = (prix: number, taux: number) =>
  interetsDesPremiersMois(prix, taux, 36, 3) / SEMAINES;
export const COUT_SEMAINE = {
  achatMP:
    amortissement(MP.prix, MP.revente) +
    interetsParSemaine(MP.prix, EMPRUNT.taux) +
    MP.entretien / 52,
  lldMP: (MP.lld * 12) / 52,
  ancienneMP: ANCIENNES.entretien / 52,
  achatNA:
    amortissement(NA.prix, NA.revente) +
    interetsParSemaine(NA.prix, EMPRUNT.taux) +
    NA.entretien / 52,
  creditBailNA:
    amortissement(NA.prix, NA.revente) +
    interetsParSemaine(NA.prix, TAUX_CREDIT_BAIL) +
    NA.entretien / 52,
  lldNA: (LLD_NA * 12) / 52,
  achatTT:
    amortissement(TT.prix, TT.revente) +
    interetsParSemaine(TT.prix, EMPRUNT.taux) +
    TT.entretien / 52,
  lldTT: (LLD_TT * 12) / 52,
  vieilleNA: VIEILLE.entretien / 52,
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
  effet: { cout?: number; demandeMP?: number; demandeNA?: number; joursNA?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gel",
    titre: "Une semaine de gel",
    de: "Mélina Agostini",
    role: "Responsable du comptoir",
    texte:
      "−8 °C au petit matin toute la semaine : les terrassiers ont arrêté leurs chantiers, les réservations de mini-pelles sont annulées les unes après les autres.",
    effet: { demandeMP: 0.4, demandeNA: 0.7 },
  },
  {
    id: "vol",
    titre: "Vol sur un chantier",
    de: "Nils Ferrando",
    role: "Chef d'atelier",
    texte:
      "Une bétonnière et quarante mètres carrés d'échafaudage ont disparu d'un chantier à Oullins. Franchise d'assurance et remplacement : 3 800 €.",
    effet: { cout: 3800 },
  },
  {
    id: "vgp",
    titre: "Vérifications périodiques des nacelles",
    de: "Nils Ferrando",
    role: "Chef d'atelier",
    texte:
      "L'organisme de contrôle a avancé les vérifications générales périodiques : deux nacelles immobilisées deux jours, et 1 500 € de remise en conformité.",
    effet: { cout: 1500, joursNA: 4 },
  },
  {
    id: "litige",
    titre: "Un godet rendu cassé",
    de: "Mélina Agostini",
    role: "Responsable du comptoir",
    texte:
      "Un artisan a rendu une mini-pelle avec le godet fendu et conteste la facture. On transige : 2 100 € à notre charge.",
    effet: { cout: 2100 },
  },
  {
    id: "salon",
    titre: "Le salon régional du bâtiment",
    de: "Mélina Agostini",
    role: "Responsable du comptoir",
    texte:
      "Le salon régional du bâtiment a eu lieu cette semaine : nos démonstrations ont fait réserver beaucoup d'artisans d'un coup.",
    effet: { demandeMP: 1.3 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** La météo des chantiers : ce qu'elle fait à la demande de la semaine. */
  meteoMP: readonly number[];
  meteoNA: readonly number[];
  /** Pour chaque ancienne mini-pelle et chaque semaine : panne, coût, immobilisation longue. */
  pannes: readonly (readonly { u: number; cout: number; longue: boolean }[])[];
  /** Le client excédé part-il après une panne chez lui ? */
  uClient: number;
  /** La vieille nacelle, une fois réparée, retombe-t-elle en panne ? */
  uVieille: readonly number[];
  /** Ganivet reporte-t-il la phase 2 ? */
  uReport: number;
  /** La saison se retourne-t-elle en semaine 11 ? */
  ralentissement: boolean;
  /** Le marché de l'occasion en fin de trimestre, rapporté à un marché normal. */
  occasion: number;
  /** Le second loueur a-t-il des machines ? */
  uSecond: number;
  /** Sorlin accepte-t-il la contre-proposition ? */
  uContre: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000303 + 7);
  const meteoMP: number[] = [0];
  const meteoNA: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) {
    meteoMP.push(borne(1 + 0.12 * gauss(r), 0.65, 1.3));
    meteoNA.push(borne(1 + 0.07 * gauss(r), 0.8, 1.2));
  }
  const pannes: { u: number; cout: number; longue: boolean }[][] = [];
  for (let k = 0; k < ANCIENNES.nombre; k += 1) {
    const ligne = [{ u: 1, cout: 0, longue: false }];
    for (let w = 1; w <= SEMAINES; w += 1) {
      ligne.push({
        u: r(),
        cout: ANCIENNES.reparationMin + (ANCIENNES.reparationMax - ANCIENNES.reparationMin) * r(),
        longue: r() < 0.5,
      });
    }
    pannes.push(ligne);
  }
  const uClient = r();
  const uVieille = [1];
  for (let w = 1; w <= SEMAINES; w += 1) uVieille.push(r());
  const uReport = r();
  const ralentissement = r() < RALENTISSEMENT.chance;
  const occasion =
    borne(1 + 0.05 * gauss(r), 0.9, 1.1) * (ralentissement ? RALENTISSEMENT.occasion : 1);
  const uSecond = r();
  const uContre = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    meteoMP,
    meteoNA,
    pannes,
    uClient,
    uVieille,
    uReport,
    ralentissement,
    occasion,
    uSecond,
    uContre,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Ganivet reporte la phase 2 une fois sur trois : le permis modificatif traîne. */
export const phase2Reportee = (graine: number) => {
  const h = hasard(graine);
  return h.uReport < GANIVET.chanceReport[h.ralentissement ? "ralentie" : "normale"];
};

/** Le second loueur n'a des machines qu'une fois sur deux. */
export const secondLoueurDisponible = (graine: number) =>
  hasard(graine).uSecond < SECOND_LOUEUR.chance;

/** Sorlin accepte une remise de 10 % au lieu de 25 % quatre fois sur dix. */
export const contreAcceptee = (graine: number) => hasard(graine).uContre < CADRE.chanceContre;

/** Le tarif journalier du contrat-cadre de Sorlin, s'il est signé ; 0 sinon. */
export function tarifCadre(chemin: readonly number[], graine: number): number {
  if (chemin[D.cadre] === 0) return CADRE.prix;
  if (chemin[D.cadre] === 1 && contreAcceptee(graine)) return CADRE.prixContre;
  return 0;
}

/** Le prix d'une journée de mini-pelle chez le partenaire, la semaine `w`. */
export function prixPartenaireMP(chemin: readonly number[], graine: number, w: number): number {
  if (w < SAISON) return PARTENAIRE.mp.hors;
  if (chemin[D.saison] === 0) return CONTRAT_SAISON.prix;
  if (chemin[D.saison] === 3 && secondLoueurDisponible(graine)) return SECOND_LOUEUR.prix;
  return PARTENAIRE.mp.saison;
}

/* ---------------------------------------------------------------------------
 * LE PARC : chaque machine, comment on l'a, de quand à quand, ce qu'elle coûte.
 * ------------------------------------------------------------------------- */
export type Genre = "ancienne" | "achat" | "lld" | "creditBail" | "recente" | "vieille";

export type Pool = "mp" | "na" | "el" | "tt";

export interface Machine {
  /** Les mini-pelles, les nacelles du parc courant, celles d'Elvatec, les tout-terrain de Ganivet. */
  pool: Pool;
  genre: Genre;
  /** La première et la dernière semaine dans le parc. */
  debut: number;
  fin: number;
  coutSemaine: number;
  /** Les semaines où elle est indisponible (atelier). */
  absences?: readonly number[];
  /** L'index de l'ancienne mini-pelle, pour lire ses pannes. */
  index?: number;
}

/** Le parc que dessinent les décisions. */
export function parc(chemin: readonly number[]): Machine[] {
  const [d1, d2, d3, d4, d5] = chemin;
  const m: Machine[] = [];
  for (let k = 0; k < ANCIENNES.nombre; k += 1) {
    m.push({
      pool: "mp",
      genre: "ancienne",
      debut: 1,
      fin: d1 === 3 ? SEMAINES : 2,
      coutSemaine: COUT_SEMAINE.ancienneMP,
      index: k,
    });
  }
  const ajout = (n: number, x: Omit<Machine, "fin">) => {
    for (let k = 0; k < n; k += 1) m.push({ ...x, fin: SEMAINES });
  };
  // Les mini-pelles neuves arrivent en semaine 3.
  if (d1 === 0)
    ajout(6, { pool: "mp", genre: "achat", debut: 3, coutSemaine: COUT_SEMAINE.achatMP });
  if (d1 === 1)
    ajout(4, { pool: "mp", genre: "achat", debut: 3, coutSemaine: COUT_SEMAINE.achatMP });
  if (d1 === 2) ajout(6, { pool: "mp", genre: "lld", debut: 3, coutSemaine: COUT_SEMAINE.lldMP });
  if (d4 === 1)
    ajout(2, { pool: "mp", genre: "achat", debut: 9, coutSemaine: COUT_SEMAINE.achatMP });

  ajout(2, { pool: "na", genre: "recente", debut: 1, coutSemaine: COUT_SEMAINE.achatNA });
  // La vieille nacelle tombe en panne en semaine 8 ; ce qu'on en fait se décide ce vendredi-là.
  if (d5 === 0) {
    m.push({
      pool: "na",
      genre: "vieille",
      debut: 1,
      fin: SEMAINES,
      absences: [8],
      coutSemaine: COUT_SEMAINE.vieilleNA,
    });
  } else if (d5 === 3) {
    m.push({
      pool: "na",
      genre: "vieille",
      debut: 1,
      fin: SEMAINES,
      absences: [8, 9, 10, 11],
      coutSemaine: COUT_SEMAINE.vieilleNA,
    });
  } else {
    m.push({ pool: "na", genre: "vieille", debut: 1, fin: 7, coutSemaine: COUT_SEMAINE.vieilleNA });
  }
  if (d5 === 2) {
    ajout(1, {
      pool: "na",
      genre: "creditBail",
      debut: VIEILLE.livraison,
      coutSemaine: COUT_SEMAINE.creditBailNA,
    });
  }
  if (d2 === 0)
    ajout(3, {
      pool: "el",
      genre: "creditBail",
      debut: ELVATEC.debut,
      coutSemaine: COUT_SEMAINE.creditBailNA,
    });
  if (d2 === 2)
    ajout(3, { pool: "el", genre: "lld", debut: ELVATEC.debut, coutSemaine: COUT_SEMAINE.lldNA });
  if (d3 === 0)
    ajout(3, {
      pool: "tt",
      genre: "achat",
      debut: GANIVET.debut,
      coutSemaine: COUT_SEMAINE.achatTT,
    });
  if (d3 === 2)
    ajout(3, { pool: "tt", genre: "lld", debut: GANIVET.debut, coutSemaine: COUT_SEMAINE.lldTT });
  return m;
}

/**
 * CE QUE COÛTE UNE MACHINE SANS EMPLOI EN FIN DE TRIMESTRE.
 *
 * Achetée (ou en crédit-bail, retraité comme un achat) : l'écart entre sa
 * valeur nette comptable et ce qu'elle se revend, sur le marché du moment,
 * frais déduits — le crédit-bail ajoute 1 % de frais de résiliation. En LLD :
 * l'indemnité de restitution anticipée. Amortie, ou rendue au partenaire :
 * rien.
 */
export function coutDeSortie(x: Machine, occasion: number): number {
  const pa = x.pool === "mp" ? MP : x.pool === "tt" ? TT : NA;
  if (x.genre === "lld") {
    return INDEMNITE_LLD * (x.pool === "mp" ? MP.lld : x.pool === "tt" ? LLD_TT : LLD_NA);
  }
  if (x.genre !== "achat" && x.genre !== "creditBail") return 0;
  const semaines = SEMAINES - x.debut + 1;
  const vnc = pa.prix - amortissement(pa.prix, pa.revente) * semaines;
  const venale = pa.prix * DECOTE_QUASI_NEUVE * occasion - pa.fraisRevente;
  const frais = x.genre === "creditBail" ? 0.01 * pa.prix : 0;
  return Math.max(0, vnc - venale) + frais;
}

export type Semaine = {
  /** La marge de la semaine, avant la revue du parc de fin de trimestre. */
  marge: number;
  /** La marge cumulée depuis le début du trimestre. */
  cumul: number;
  /** Le chiffre d'affaires de la location de la semaine. */
  ca: number;
  /** La part des journées disponibles du parc de mini-pelles qui ont été louées. */
  utilisationMP: number;
  utilisationNA: number;
  /** Les journées de mini-pelles demandées, et celles servies par le partenaire. */
  demandeMP: number;
  partenaireMP: number;
  partenaireNA: number;
  /** Le prix d'une journée de mini-pelle chez le partenaire. */
  prixPartenaire: number;
  /** Ce que coûte le parc à date : amortissements, intérêts, loyers, entretien. */
  chargesParc: number;
  /** La sous-location payée au partenaire, à date. */
  sousLocation: number;
  /** Les réparations à date. */
  reparations: number;
  /** Les machines de chaque parc cette semaine. */
  flotteMP: number;
  flotteNA: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge du trimestre, valeur du parc comprise, moins le budget : positive, au-dessus. */
  objectif: number;
  /** La marge du trimestre, valeur du parc comprise. */
  marge: number;
  /** La dépréciation des machines sans emploi, et les indemnités de LLD. */
  valeurDuParc: number;
  excedentairesMP: number;
  excedentairesNA: number;
  /** Les journées du contrat de saison payées sans être prises. */
  minimumNonPris: number;
  sousLocation: number;
  chargesParc: number;
  reparations: number;
  pannesAnciennes: number;
  pannesVieille: number;
  /** Chaque panne, sa semaine et ce qu'elle a coûté. */
  pannes: readonly { semaine: number; cout: number; quoi: "ancienne" | "vieille" }[];
  /** La semaine où le client excédé est parti ; 0 s'il est resté. */
  clientParti: number;
  phase2Reportee: boolean;
  ralentissement: boolean;
  occasion: number;
  utilisationMP: number;
  joursPartenaireMP: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, d4, d5] = chemin;
  const machines = parc(chemin);
  const report = phase2Reportee(graine);
  const tarifSorlin = tarifCadre(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let chargesParc = 0;
  let sousLocation = 0;
  let reparations = 0;
  let pannesAnciennes = 0;
  let pannesVieille = 0;
  let clientParti = 0;
  const pannes: { semaine: number; cout: number; quoi: "ancienne" | "vieille" }[] = [];
  let joursSaison = 0;
  let joursPartenaireMP = 0;
  let utilisationCumulee = 0;
  let minimumNonPris = 0;
  /** Les journées louées sur le parc, des trois dernières semaines, pour la revue du parc. */
  const finMP = { jours: 0 };
  const finNA = { jours: 0 };
  const finTT = { jours: 0 };
  /** Les semaines d'atelier, au fil des pannes. */
  const atelier = new Map<Machine, Set<number>>();
  const absent = (x: Machine, w: number) =>
    (x.absences?.includes(w) ?? false) || (atelier.get(x)?.has(w) ?? false);
  const immobiliser = (x: Machine, w: number) => {
    const s = atelier.get(x) ?? new Set<number>();
    s.add(w);
    atelier.set(x, s);
  };

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => i.semaine === w).map((i) => i.imprevu);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;
    const presentes = machines.filter((x) => w >= x.debut && w <= x.fin);

    // Les pannes des anciennes mini-pelles, et le client qu'une panne peut faire partir.
    for (const x of presentes) {
      if (x.genre !== "ancienne" || absent(x, w)) continue;
      const p = h.pannes[x.index!]![w]!;
      if (p.u < ANCIENNES.risque) {
        pannesAnciennes += 1;
        pannes.push({ semaine: w, cout: p.cout, quoi: "ancienne" });
        reparations += p.cout;
        cout += p.cout;
        immobiliser(x, w);
        if (p.longue) immobiliser(x, w + 1);
        if (w >= 3 && !clientParti && h.uClient < ANCIENNES.chanceClientPart) clientParti = w + 1;
      }
    }
    // La vieille nacelle, réparée ou remise en route, peut lâcher de nouveau.
    for (const x of presentes) {
      if (x.genre !== "vieille" || w < 9 || absent(x, w)) continue;
      if (w === 9 && d5 === 0) {
        reparations += VIEILLE.reparation;
        cout += VIEILLE.reparation;
      }
      if (w === VIEILLE.retour && d5 === 3) {
        reparations += VIEILLE.piece;
        cout += VIEILLE.piece;
      }
      if (h.uVieille[w]! < VIEILLE.risque) {
        pannesVieille += 1;
        pannes.push({ semaine: w, cout: VIEILLE.panne, quoi: "vieille" });
        reparations += VIEILLE.panne;
        cout += VIEILLE.panne;
        immobiliser(x, w);
      }
    }

    // La demande de la semaine.
    let facteurMP = h.meteoMP[w]!;
    let facteurNA = h.meteoNA[w]!;
    let joursNAperdus = 0;
    for (const i of actifs) {
      facteurMP *= i.effet.demandeMP ?? 1;
      facteurNA *= i.effet.demandeNA ?? 1;
      joursNAperdus += i.effet.joursNA ?? 0;
      cout += i.effet.cout ?? 0;
    }
    const ralenti = h.ralentissement && w >= RALENTISSEMENT.semaine;
    if (ralenti) {
      facteurMP *= RALENTISSEMENT.mp;
      facteurNA *= RALENTISSEMENT.na;
    }
    const courantMP = Math.max(
      0,
      DEMANDE_MP[w]! * facteurMP - (clientParti && w >= clientParti ? ANCIENNES.clientPerdu : 0),
    );
    const cadre = tarifSorlin && w >= CADRE.debut ? CADRE.jours : 0;
    const courantNA = DEMANDE_NA[w]! * facteurNA;
    const elvatec = d2 !== 3 && w >= ELVATEC.debut ? ELVATEC.jours : 0;
    const ganivet =
      d3 !== 3 && w >= GANIVET.debut && (w < GANIVET.phase2 || !report) ? GANIVET.jours : 0;

    // Le parc sert d'abord, le partenaire prend le reste.
    const capacite = (pool: Pool) =>
      presentes.filter((x) => x.pool === pool && !absent(x, w)).reduce((s) => s + JOURS_OUVRES, 0);
    const capMP = capacite("mp");
    const capNA = Math.max(0, capacite("na") - joursNAperdus);
    const demandeMP = courantMP + cadre;
    const demandeNA = courantNA;
    const parcMP = Math.min(demandeMP, capMP);
    const parcNA = Math.min(demandeNA, capNA);
    const partMP = demandeMP - parcMP;
    const partNA = demandeNA - parcNA;
    // Les nacelles d'Elvatec restent sur ses sites : celles du contrat, ou celles du partenaire.
    const parcEL = Math.min(elvatec, capacite("el"));
    const partEL = elvatec - parcEL;
    // Les tout-terrain ne servent qu'au chantier de Ganivet.
    const parcTT = Math.min(ganivet, capacite("tt"));
    const partTT = ganivet - parcTT;
    const prixTT = w < SAISON ? PARTENAIRE.tt.hors : PARTENAIRE.tt.saison;
    const prixMP = prixPartenaireMP(chemin, graine, w);
    const prixNA = w < SAISON ? PARTENAIRE.na.hors : PARTENAIRE.na.saison;
    if (w >= SAISON) joursSaison += partMP;
    joursPartenaireMP += partMP;
    if (w > SEMAINES - 3) {
      finMP.jours += parcMP;
      finNA.jours += parcNA;
      finTT.jours += parcTT;
    }

    const ca =
      courantMP * MP.tarif +
      cadre * tarifSorlin +
      courantNA * NA.tarif +
      elvatec * ELVATEC.tarif +
      ganivet * TT.tarif;
    let partenaire = partMP * prixMP + (partNA + partEL) * prixNA + partTT * prixTT;
    // Le contrat de saison se solde en semaine 13 : le minimum est dû, même non pris.
    if (w === SEMAINES && d4 === 0) {
      minimumNonPris = Math.max(0, CONTRAT_SAISON.minimum - joursSaison);
      partenaire += minimumNonPris * CONTRAT_SAISON.prix;
    }
    const variables =
      parcMP * MP.coutVariable + (parcNA + parcEL) * NA.coutVariable + parcTT * TT.coutVariable;
    const charges = presentes.reduce((s, x) => s + x.coutSemaine, 0);
    chargesParc += charges;
    sousLocation += partenaire;
    cout += partenaire + variables + charges;
    const marge = ca + AUTRES_MARGE - STRUCTURE - cout;
    cumul += marge;
    const utilMP = capMP ? parcMP / capMP : 0;
    utilisationCumulee += utilMP;

    semaines.push({
      marge,
      cumul,
      ca,
      utilisationMP: utilMP,
      utilisationNA: capNA ? parcNA / capNA : 0,
      demandeMP,
      partenaireMP: partMP,
      partenaireNA: partNA + partEL,
      prixPartenaire: prixMP,
      chargesParc,
      sousLocation,
      reparations,
      flotteMP: presentes.filter((x) => x.pool === "mp").length,
      flotteNA: presentes.filter((x) => x.pool === "na").length,
    });
  }

  // La revue du parc : les machines sans emploi, ramenées à ce qu'elles valent.
  const revue = (pool: Pool, joursLoues: number) => {
    const enParc = machines
      .filter((x) => x.pool === pool && x.fin === SEMAINES)
      .map((x) => ({ x, sortie: coutDeSortie(x, h.occasion) }))
      // On garde au travail les machines qui coûtent le plus à sortir.
      .sort((a, b) => b.sortie - a.sortie);
    let reste = joursLoues;
    let excedentaires = 0;
    let depreciation = 0;
    for (const { x, sortie } of enParc) {
      let dispo = 0;
      for (let w = SEMAINES - 2; w <= SEMAINES; w += 1) if (!absent(x, w)) dispo += JOURS_OUVRES;
      const pris = Math.min(dispo, reste);
      reste -= pris;
      if (pris < SEUIL_EMPLOI) {
        excedentaires += 1;
        depreciation += sortie;
      }
    }
    return { excedentaires, depreciation };
  };
  const rMP = revue("mp", finMP.jours);
  const rNA = revue("na", finNA.jours);
  const rTT = revue("tt", finTT.jours);
  const valeurDuParc = rMP.depreciation + rNA.depreciation + rTT.depreciation;
  const marge = cumul - valeurDuParc;

  return {
    semaines,
    objectif: marge - BUDGET,
    marge,
    valeurDuParc,
    excedentairesMP: rMP.excedentaires,
    excedentairesNA: rNA.excedentaires + rTT.excedentaires,
    minimumNonPris,
    sousLocation,
    chargesParc,
    reparations,
    pannesAnciennes,
    pannesVieille,
    pannes,
    clientParti,
    phase2Reportee: report,
    ralentissement: h.ralentissement,
    occasion: h.occasion,
    utilisationMP: utilisationCumulee / SEMAINES,
    joursPartenaireMP,
  };
}

/** Ce qui s'est passé pendant des semaines : pannes, client, chantier, saison, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    pannes: t.pannes.filter((p) => dans(p.semaine)),
    clientParti: t.clientParti > 0 && dans(t.clientParti - 1),
    report:
      chemin[D.ganivet] !== undefined && chemin[D.ganivet] !== 3 && dans(GANIVET.phase2)
        ? t.phase2Reportee
        : null,
    ralentissement: t.ralentissement && dans(RALENTISSEMENT.semaine),
    minimum: t.minimumNonPris > 0 && dans(SEMAINES),
    revue: t.valeurDuParc > 0 && dans(SEMAINES),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/** La part du budget de marge attendue à chaque semaine : l'hiver rapporte peu, la saison beaucoup. */
export const PROFIL_BUDGET = (() => {
  const poids = DEMANDE_MP.map((x, w) => (w ? Math.max(0, x - 9) : 0));
  const total = poids.reduce((s, x) => s + x, 0);
  let cumul = 0;
  return poids.map((x) => {
    cumul += x;
    return cumul / total;
  });
})();

export interface LectureLocation {
  marge: number | null;
  budgetADate: number | null;
  utilisationMP: number | null;
  sousLocation: number | null;
  chargesParc: number | null;
  reparations: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  utilisationNA: number | null;
  partenaireMP: number | null;
  prixPartenaire: number | null;
  demandeMP: number | null;
  flotteMP: number | null;
}

/**
 * Ce que Salomé lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureLocation {
  if (semaine === 0) {
    return {
      marge: 0,
      budgetADate: 0,
      utilisationMP: 0.58,
      sousLocation: 0,
      chargesParc: 0,
      reparations: 0,
      utilisationNA: 0.68,
      partenaireMP: 0,
      prixPartenaire: PARTENAIRE.mp.hors,
      demandeMP: DEMANDE_MP[1],
      flotteMP: ANCIENNES.nombre,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    marge: s.cumul,
    budgetADate: BUDGET * PROFIL_BUDGET[semaine]!,
    utilisationMP: s.utilisationMP,
    sousLocation: s.sousLocation,
    chargesParc: s.chargesParc,
    reparations: s.reparations,
    utilisationNA: s.utilisationNA,
    partenaireMP: s.partenaireMP,
    prixPartenaire: s.prixPartenaire,
    demandeMP: s.demandeMP,
    flotteMP: s.flotteMP,
  };
}
