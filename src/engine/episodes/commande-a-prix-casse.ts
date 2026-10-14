/**
 * LA COMMANDE À PRIX CASSÉ — le modèle du centre de découpe de Vénissieux.
 *
 * Un atelier qui débite et usine des panneaux bois, plâtre et composite pour
 * les artisans et les agences d'Arvel Distribution : une scie à panneaux, un
 * centre d'usinage, une équipe de jour. Un promoteur demande 1 600 panneaux à
 * 39 €, quand le coût complet d'un panneau est de 46 €. Treize semaines, six
 * décisions. Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LES CHARGES FIXES NE BOUGENT PAS. Les salaires de l'équipe, les
 *     amortissements des machines, le loyer et l'entretien coûtent 16 000 €
 *     par semaine, que l'atelier façonne 600 panneaux ou 1 000. Les 46 € du
 *     coût complet en comprennent 20 de charges fixes, réparties sur une
 *     activité normale de 800 panneaux. Tant qu'il reste de la capacité libre,
 *     un panneau de plus ne coûte que son coût variable — 26 € — et tout prix
 *     au-dessus ajoute de la marge. Refuser la commande parce qu'elle est
 *     « sous le coût complet » laisse les charges fixes exactement où elles
 *     sont, et la marge sur coût variable de la commande sur la table. Le coût
 *     complet unitaire lui-même dépend du volume : il baisse quand l'atelier
 *     est plein, monte quand il est creux, sans qu'un seul coût réel change.
 *   · AU-DELÀ DE LA CAPACITÉ, LE COÛT MARGINAL SAUTE. L'atelier façonne 1 000
 *     panneaux par semaine en heures normales. Au-delà, les cent suivants se
 *     font en heures supplémentaires, 11 € de plus par panneau ; au-delà
 *     encore, ce sont des clients réguliers qui attendent, et un panneau en
 *     retard sur deux part chez un concurrent avec ses 32 € de marge. En
 *     pleine saison (semaines 9 à 11), l'atelier est plein : le même panneau à
 *     39 € qui enrichissait l'atelier en semaine 4 l'appauvrit en semaine 10.
 *     Une heure de machine perdue y coûte la marge qu'elle aurait faite.
 *     Fabriquer la commande d'avance, dans les semaines creuses, sépare les
 *     deux.
 *   · UN PRIX SE VOIT. Les poseurs du promoteur sont aussi des clients de
 *     l'atelier. Un prix de chantier livré comme le catalogue, sous la même
 *     référence, devient le prix que tout le monde réclame. Le même prix,
 *     attaché à des conditions — camions complets, débit à plat, référence de
 *     chantier — reste un prix de chantier. Le donner sur du volume qui
 *     viendrait de toute façon n'a rien de marginal : c'est une remise.
 *
 * Le hasard décide si le promoteur accepte une contre-proposition, si Marcel
 * Rioult, le plus gros agenceur client, va voir ailleurs, si les autres
 * clients apprennent le prix, et si la scie tombe en panne quand on a reporté
 * sa révision.
 *
 * Le trimestre est jugé en euros : la marge de l'atelier (marge sur coût
 * variable moins charges fixes et surcoûts), en écart à son budget.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Les panneaux façonnés par semaine en heures normales : une équipe de jour, la scie et le centre d'usinage. */
export const CAPACITE = 1000;
/** Ce que les heures supplémentaires ajoutent au plus, par semaine. */
export const HEURES_SUP_MAX = 100;
/** Ce qu'un panneau fait en heures supplémentaires coûte de plus : les salaires majorés. */
export const SURCOUT_HS = 11;
/** Le coût variable d'un panneau, poste par poste : il ne dépend que de ce qu'on façonne. */
export const CV = { panneau: 21, chants: 3.5, energie: 1.5 } as const;
export const COUT_VARIABLE = CV.panneau + CV.chants + CV.energie;
/** Les charges fixes de l'atelier, par semaine : salaires, amortissements, loyer, entretien. */
export const CHARGES_FIXES = 16000;
/** L'activité normale sur laquelle le contrôle de gestion répartit les charges fixes. */
export const ACTIVITE_NORMALE = 800;
export const PART_FIXE = CHARGES_FIXES / ACTIVITE_NORMALE;
export const COUT_COMPLET = COUT_VARIABLE + PART_FIXE;
/** Le tarif catalogue : le coût complet, plus 26 %. */
export const MARGE_TARIF = 0.26;
export const PRIX_REGULIER = 58;
export const MCV_REGULIERE = PRIX_REGULIER - COUT_VARIABLE;
/** Le profil de la demande régulière, rapporté à l'activité normale : creux jusqu'en semaine 7, pleine saison de la 9 à la 11. */
export const SAISON = [0, 0.84, 0.84, 0.84, 0.84, 0.84, 0.84, 0.84, 1, 1.25, 1.25, 1.25, 1, 0.84];

/** La commande d'Habitat Cévral : 1 600 panneaux à 39 €, livrés 200 par semaine des semaines 3 à 10. */
export const COMMANDE = { quantite: 1600, prix: 39, rythme: 200, de: 3, a: 10 } as const;
export const MCV_UNITAIRE_COMMANDE = COMMANDE.prix - COUT_VARIABLE;
export const MCV_COMMANDE = MCV_UNITAIRE_COMMANDE * COMMANDE.quantite;
/** Contre-proposer le coût complet : le promoteur l'accepte une fois sur cinq. */
export const PRIX_CONTRE = 46;
export const CHANCE_CONTRE = 0.2;
/** Livrer aux conditions du promoteur : livraisons fractionnées sur chantier, chants à la demande. */
export const SURCOUT_FRACTIONNE = 1;
/** Fabriquer la commande d'avance, dans les semaines creuses, et la stocker. */
export const AVANCE = { rythme: 320, de: 3, a: 7, stockage: 1.2 } as const;
export const DEUXIEME_EQUIPE = { capacite: 400, cout: 3000, de: 4 } as const;
export const SOUS_TRAITANT = { forfait: 4000, surcout: 15 } as const;
/** Un panneau régulier en retard sur deux part chez un concurrent ; l'autre attend la semaine suivante. */
export const PERDU_PAR_RETARD = 0.5;

/** Agencements Rioult : la part du volume régulier, et ce qu'il emporte s'il part. */
export const RIOULT = { part: 0.15, prix: 39, depart: 0.6, des: 6, effet: 5 } as const;
export const FIDELITE = 0.04;
/** Le prix de chantier offert à Rioult pour du volume en plus, dans les semaines creuses. */
export const EN_PLUS = { volume: 80, prix: 42, de: 5, a: 7 } as const;
/** Les autres clients apprennent le prix de chantier : les commerciaux concèdent des remises. */
export const FUITE = { chance: 0.5, part: 0.1, remise: 6, des: 6 } as const;

/** Le second lot du promoteur, en pleine saison. */
export const LOT = {
  quantite: 1200,
  rythme: 300,
  de: 9,
  a: 12,
  prixPointe: 48,
  chancePointe: 0.25,
  chanceApres: 0.7,
  apresDe: 12,
} as const;
export const MCV_POINTE = MCV_REGULIERE * PERDU_PAR_RETARD;

/** La révision de la scie : deux jours d'arrêt, ou un week-end majoré, ou un report. */
export const REVISION = {
  semaine: 9,
  arret: 0.4,
  weekend: 4800,
  surveillance: 600,
  risqueSurveille: 0.05,
  risqueSans: 0.25,
  panne: 0.6,
  reparation: 3000,
} as const;

/** Répercuter le nouveau coût complet dans le tarif : la demande réagit plus à une hausse qu'à une baisse. */
export const ELASTICITE = { baisse: 0.8, hausse: 2.5 } as const;
export const REMISE_VOLUME = { remise: 0.08, part: 0.3, economie: 2, gain: 0.12, de: 12 } as const;
export const REMISE_GROS = { remise: 0.05, part: 0.5 } as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des devis d'agenceurs restés sans réponse. */
export const PERTE_PAR_JOUR = 1500;

/** Ce que chaque semaine du budget apporte : la demande normale, sans commande exceptionnelle. */
export const MARGE_BUDGET_SEMAINE = SAISON.map((s, w) =>
  w ? ACTIVITE_NORMALE * s * MCV_REGULIERE - CHARGES_FIXES : 0,
);
/** Le budget de marge de l'atelier pour le trimestre. */
export const BUDGET = 110000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  commande: 0,
  planning: 1,
  rioult: 2,
  lot: 3,
  revision: 4,
  tarif: 5,
} as const;

/** Ne rien changer, décision par décision : pas de commande, le rythme du promoteur, rien à Rioult, rien en pleine saison, pas de révision, le tarif tel quel. */
export const NEUTRE = [0, 0, 1, 3, 3, 1] as const;

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
  effet: { demande?: number; capacite?: number; cv?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "rupture",
    titre: "Rupture de panneaux bruts",
    de: "Achats",
    role: "Plateforme de Saint-Priest",
    texte:
      "Le fournisseur de mélaminé livre avec une semaine de retard : l'atelier perd un quart de ses débits faute de matière.",
    duree: 1,
    effet: { capacite: 0.75 },
  },
  {
    id: "hausse",
    titre: "Hausse du panneau brut",
    de: "Achats",
    role: "Plateforme de Saint-Priest",
    texte:
      "Le fournisseur de panneaux applique une surcharge énergie de 1,50 € par panneau pendant trois semaines, sans pouvoir la refacturer aux clients.",
    duree: 3,
    effet: { cv: 1.5 },
  },
  {
    id: "grippe",
    titre: "Grippe à l'atelier",
    de: "Ressources humaines",
    role: "Vénissieux",
    texte:
      "La grippe touche l'atelier : deux opérateurs sur neuf absents pendant deux semaines, et pas d'intérimaire formé à la scie.",
    duree: 2,
    effet: { capacite: 0.85 },
  },
  {
    id: "agence",
    titre: "Chantier urgent pour l'agence de Bron",
    de: "Agence de Bron",
    role: "Arvel Distribution",
    texte:
      "L'agence de Bron décroche la rénovation d'une école : 90 panneaux façonnés à livrer dans la semaine, au tarif catalogue.",
    duree: 1,
    effet: { demande: 1.12 },
  },
  {
    id: "centre",
    titre: "Panne du centre d'usinage",
    de: "Maintenance",
    role: "Vénissieux",
    texte:
      "La broche du centre d'usinage a lâché : un jour d'arrêt, et les perçages reportés sur la scie.",
    duree: 1,
    effet: { capacite: 0.8 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit de la demande régulière, semaine par semaine. */
  semaines: readonly (number | null)[];
  /** Le promoteur accepte-t-il le coût complet ? */
  uContre: number;
  /** Les autres clients apprennent-ils le prix de chantier ? */
  uFuite: number;
  /** Marcel Rioult va-t-il voir ailleurs ? */
  uRioult: number;
  /** Le promoteur accepte-t-il les conditions du second lot ? */
  uLot: number;
  /** La scie tombe-t-elle en panne, et quand ? */
  uPanne: number;
  semainePanne: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000211 + 7);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push(Math.min(1.1, Math.max(0.9, 1 + 0.04 * gauss(r))));
  }
  const uContre = r();
  const uFuite = r();
  const uRioult = r();
  const uLot = r();
  const uPanne = r();
  const semainePanne = 9 + Math.floor(r() * 3);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uContre, uFuite, uRioult, uLot, uPanne, semainePanne, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, selon le hasard.
 * ------------------------------------------------------------------------- */

/** La commande est-elle signée, et à quel prix ? */
export function commandeSignee(chemin: readonly number[], graine: number): number | null {
  const d1 = chemin[D.commande];
  if (d1 === 2 || d1 === 3) return COMMANDE.prix;
  if (d1 === 1 && hasard(graine).uContre < CHANCE_CONTRE) return PRIX_CONTRE;
  return null;
}
export const contreAcceptee = (graine: number) => hasard(graine).uContre < CHANCE_CONTRE;

/**
 * LE RISQUE QUE RIOULT PARTE.
 *
 * Il réclame 39 €. S'il a vu le prix sur les bons de livraison de ses propres
 * poseurs, livrés comme le catalogue, sa menace est sérieuse ; un prix de
 * chantier attaché à des conditions s'explique, et se défend. Aligner son
 * prix ou lui faire un geste le garde à coup sûr.
 */
export function risqueRioult(chemin: readonly number[]): number {
  const d3 = chemin[D.rioult];
  if (d3 !== 1 && d3 !== 2) return 0;
  const vu = chemin[D.commande] === 3;
  if (d3 === 1) return vu ? 0.45 : 0.2;
  return vu ? 0.3 : 0.12;
}
export const rioultPart = (chemin: readonly number[], graine: number) =>
  hasard(graine).uRioult < risqueRioult(chemin);

/** Livrée comme le catalogue, la commande fait circuler son prix une fois sur deux. */
export const prixEbruite = (chemin: readonly number[], graine: number) =>
  chemin[D.commande] === 3 && hasard(graine).uFuite < FUITE.chance;

/** Le promoteur accepte-t-il le second lot ? En pleine saison à 39 €, toujours. */
export function lotAccepte(chemin: readonly number[], graine: number): "pointe" | "apres" | null {
  const d4 = chemin[D.lot];
  const u = hasard(graine).uLot;
  if (d4 === 0) return "pointe";
  if (d4 === 2) return u < LOT.chancePointe ? "pointe" : null;
  if (d4 === 1) return u < LOT.chanceApres ? "apres" : null;
  return null;
}
export const lotAccepteSiDemande = (choix: number, graine: number) =>
  choix === 2 ? hasard(graine).uLot < LOT.chancePointe : hasard(graine).uLot < LOT.chanceApres;

/** Le risque de panne de la scie, selon ce qu'on a fait de sa révision. */
export function risquePanne(chemin: readonly number[]): number {
  const d5 = chemin[D.revision];
  if (d5 === 2) return REVISION.risqueSurveille;
  if (d5 === 3) return REVISION.risqueSans;
  return 0;
}
export const scieEnPanne = (chemin: readonly number[], graine: number) =>
  hasard(graine).uPanne < risquePanne(chemin);

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** Panneaux façonnés à l'atelier dans la semaine (hors sous-traitance). */
  volume: number;
  /** Ce qu'on a demandé à l'atelier : réguliers, retards repris, commandes. */
  charge: number;
  capacite: number;
  /** Panneaux réguliers en retard en fin de semaine. */
  retard: number;
  /** Panneaux réguliers partis chez un concurrent faute de capacité. */
  perdus: number;
  /** Marge sur coût variable de la semaine. */
  mcv: number;
  /** Heures supplémentaires, sous-traitance, deuxième équipe, stockage, révision, panne. */
  surcout: number;
  /** Marge de l'atelier de la semaine : marge sur coût variable moins charges fixes et surcoûts. */
  marge: number;
  /** Cumul depuis le début du trimestre. */
  margeCumul: number;
  surcoutCumul: number;
  /** Le coût complet d'un panneau cette semaine : charges variables et fixes, rapportées au volume. */
  coutComplet: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge de l'atelier en écart au budget : positive, l'atelier fait mieux que prévu. */
  objectif: number;
  marge: number;
  /** Le prix de la commande signée, ou null. */
  prixCommande: number | null;
  /** La marge sur coût variable réalisée sur la commande et le second lot. */
  mcvPromoteur: number;
  lot: "pointe" | "apres" | null;
  rioultParti: boolean;
  prixEbruite: boolean;
  panne: boolean;
  semainePanne: number;
  perdus: number;
  heuresSup: number;
  sousTraitance: number;
  surcouts: number;
  /** Le coût complet recalculé sur les semaines 1 à 10, et le tarif qu'il donnerait. */
  coutCompletRecalcule: number;
  tarifRecalcule: number;
  volumeMoyen: number;
}

/** Le tarif catalogue arrondi au dixième d'euro. */
const arrondi = (x: number) => Math.round(x * 10) / 10;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, , d5, d6] = chemin;
  const prixCommande = commandeSignee(chemin, graine);
  const signee = prixCommande !== null;
  const cvCommande = COUT_VARIABLE + (chemin[D.commande] === 3 ? SURCOUT_FRACTIONNE : 0);
  const avance = signee && d2 === 1;
  const lot = lotAccepte(chemin, graine);
  const prixLot = chemin[D.lot] === 2 ? LOT.prixPointe : COMMANDE.prix;
  const parti = rioultPart(chemin, graine);
  const ebruite = prixEbruite(chemin, graine);
  const panne = scieEnPanne(chemin, graine);

  const semaines: (Semaine | null)[] = [null];
  let report = 0;
  let margeCumul = 0;
  let surcoutCumul = 0;
  let perdus = 0;
  let heuresSup = 0;
  let sousTraitance = 0;
  let mcvPromoteur = 0;
  let volume1a10 = 0;
  let coutCompletRecalcule = COUT_COMPLET;
  let tarifRecalcule = PRIX_REGULIER;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let facteurDemande = 1;
    let facteurCapacite = 1;
    let cvEnPlus = 0;
    for (const a of actifs) {
      facteurDemande *= a.imprevu.effet.demande ?? 1;
      facteurCapacite *= a.imprevu.effet.capacite ?? 1;
      cvEnPlus += a.imprevu.effet.cv ?? 0;
    }
    const cv = COUT_VARIABLE + cvEnPlus;

    // Le tarif catalogue de la semaine : il ne change que si l'on répercute le coût complet.
    const nouveauTarif = d6 === 0 && w >= 11;
    const catalogue = nouveauTarif ? tarifRecalcule : PRIX_REGULIER;
    const elasticite = tarifRecalcule < PRIX_REGULIER ? ELASTICITE.baisse : ELASTICITE.hausse;
    const reactionVolume = nouveauTarif ? (tarifRecalcule / PRIX_REGULIER) ** -elasticite : 1;

    // La demande régulière : Rioult, les autres, et ce qu'on leur a promis.
    const base = ACTIVITE_NORMALE * SAISON[w]! * h.semaines[w]! * facteurDemande * reactionVolume;
    const rioult = RIOULT.part * base * (parti && w >= RIOULT.des ? 1 - RIOULT.depart : 1);
    const autres = (1 - RIOULT.part) * base;
    const prixRioult =
      w >= RIOULT.effet && d3 === 0
        ? RIOULT.prix
        : w >= RIOULT.effet && d3 === 3
          ? catalogue * (1 - FIDELITE)
          : catalogue;
    // Les postes de la demande régulière : [volume, prix, coût variable].
    const postes: [number, number, number][] = [[rioult, prixRioult, cv]];
    let autresAuCatalogue = autres;
    if (ebruite && w >= FUITE.des) {
      postes.push([autres * FUITE.part, catalogue - FUITE.remise, cv]);
      autresAuCatalogue -= autres * FUITE.part;
    }
    if (d6 === 3 && w >= 11) {
      const gros = autresAuCatalogue * REMISE_GROS.part;
      postes.push([gros, catalogue * (1 - REMISE_GROS.remise), cv]);
      autresAuCatalogue -= gros;
    }
    if (d6 === 2 && w >= REMISE_VOLUME.de) {
      const groupe = autresAuCatalogue * REMISE_VOLUME.part;
      const prixGroupe = catalogue * (1 - REMISE_VOLUME.remise);
      const cvGroupe = cv - REMISE_VOLUME.economie;
      postes.push([groupe + (rioult + autres) * REMISE_VOLUME.gain, prixGroupe, cvGroupe]);
      autresAuCatalogue -= groupe;
    }
    postes.push([autresAuCatalogue, catalogue, cv]);
    if (d3 === 2 && w >= EN_PLUS.de && w <= EN_PLUS.a)
      postes.push([EN_PLUS.volume, EN_PLUS.prix, cv]);
    if (report > 0) postes.push([report, catalogue, cv]);
    const demandeReguliere = postes.reduce((s, [v]) => s + v, 0);
    const mcvSiServie = postes.reduce((s, [v, p, c]) => s + v * (p - c), 0);

    // Ce que le promoteur prend à l'atelier cette semaine.
    let production = 0;
    let livraison = 0;
    if (signee) {
      if (w >= COMMANDE.de && w <= COMMANDE.a) livraison = COMMANDE.rythme;
      if (avance) production = w >= AVANCE.de && w <= AVANCE.a ? AVANCE.rythme : 0;
      else production = livraison;
    }
    let lotSemaine = 0;
    if (lot === "pointe" && w >= LOT.de && w <= LOT.a) lotSemaine = LOT.rythme;
    if (lot === "apres" && w >= LOT.apresDe) lotSemaine = LOT.rythme;

    // La capacité de la semaine.
    let capacite = CAPACITE * facteurCapacite;
    if (d5 === 0 && w === REVISION.semaine) capacite *= 1 - REVISION.arret;
    if (panne && w === h.semainePanne) capacite *= 1 - REVISION.panne;
    if (d2 === 2 && w >= DEUXIEME_EQUIPE.de) capacite += DEUXIEME_EQUIPE.capacite;

    // Le débordement : heures supplémentaires, puis sous-traitance ou retards des réguliers.
    const charge = demandeReguliere + production + lotSemaine;
    const deborde = Math.max(0, charge - capacite);
    const hs = Math.min(deborde, HEURES_SUP_MAX);
    const reste = deborde - hs;
    const sousTraite = d2 === 3 ? reste : 0;
    const retard = d2 === 3 ? 0 : Math.min(reste, demandeReguliere);
    const perduSemaine = retard * PERDU_PAR_RETARD;
    report = retard - perduSemaine;
    perdus += perduSemaine;
    heuresSup += hs * SURCOUT_HS;
    sousTraitance += sousTraite * SOUS_TRAITANT.surcout;

    // Ce que la semaine rapporte : la part servie de la demande régulière, et les livraisons au promoteur.
    const servie = demandeReguliere > 0 ? (demandeReguliere - retard) / demandeReguliere : 1;
    const mcvPromoteurSemaine =
      livraison * ((prixCommande ?? 0) - cvCommande - cvEnPlus) +
      lotSemaine * (prixLot - cvCommande - cvEnPlus);
    mcvPromoteur += mcvPromoteurSemaine;
    const mcv = mcvSiServie * servie + mcvPromoteurSemaine;

    // Ce que la semaine coûte en plus des charges fixes.
    let surcout = hs * SURCOUT_HS + sousTraite * SOUS_TRAITANT.surcout;
    if (avance && w >= AVANCE.de && w <= AVANCE.a) surcout += AVANCE.rythme * AVANCE.stockage;
    if (d2 === 2 && w >= DEUXIEME_EQUIPE.de) surcout += DEUXIEME_EQUIPE.cout;
    if (d2 === 3 && w === COMMANDE.de) surcout += SOUS_TRAITANT.forfait;
    if (d5 === 1 && w === REVISION.semaine) surcout += REVISION.weekend;
    if (d5 === 2 && w === REVISION.semaine) surcout += REVISION.surveillance;
    if (panne && w === h.semainePanne) surcout += REVISION.reparation;
    if (w === 1) surcout += Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
    surcoutCumul += surcout;

    const marge = mcv - CHARGES_FIXES - surcout;
    margeCumul += marge;
    const fabrique = Math.min(charge, capacite + hs);
    const variables = fabrique * cv;
    if (w <= 10) volume1a10 += fabrique;
    if (w === 10) {
      coutCompletRecalcule = COUT_VARIABLE + (CHARGES_FIXES * 10) / volume1a10;
      tarifRecalcule = arrondi(coutCompletRecalcule * (1 + MARGE_TARIF));
    }

    semaines.push({
      volume: fabrique,
      charge,
      capacite,
      retard,
      perdus: perduSemaine,
      mcv,
      surcout,
      marge,
      margeCumul,
      surcoutCumul,
      coutComplet: (variables + CHARGES_FIXES) / Math.max(1, fabrique),
    });
  }

  return {
    semaines,
    objectif: margeCumul - BUDGET,
    marge: margeCumul,
    prixCommande,
    mcvPromoteur,
    lot,
    rioultParti: parti,
    prixEbruite: ebruite,
    panne,
    semainePanne: h.semainePanne,
    perdus,
    heuresSup,
    sousTraitance,
    surcouts: surcoutCumul,
    coutCompletRecalcule,
    tarifRecalcule,
    volumeMoyen: volume1a10 / 10,
  };
}

/** Ce qui s'est passé pendant des semaines : les suites des décisions, et les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  // La semaine où le plus de clients réguliers sont partis faute de capacité.
  let pire = 0;
  for (let w = de; w <= a; w += 1) {
    if ((t.semaines[w]?.perdus ?? 0) > (t.semaines[pire]?.perdus ?? 0)) pire = w;
  }
  const perdusPeriode = (t.semaines.slice(de, a + 1) as Semaine[]).reduce(
    (s, x) => s + x.perdus,
    0,
  );
  return {
    rioultPart: t.rioultParti && dans(RIOULT.des),
    rioultReste: chemin[D.rioult] !== undefined && !t.rioultParti && dans(RIOULT.des),
    ebruite: t.prixEbruite && dans(FUITE.des),
    panne: t.panne && dans(t.semainePanne),
    lotLivre: t.lot !== null && dans(t.lot === "pointe" ? LOT.de : LOT.apresDe),
    retards: perdusPeriode >= 40 ? { semaine: pire, perdus: perdusPeriode } : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

/* ---------------------------------------------------------------------------
 * LE TABLEAU DE BORD de l'atelier.
 * ------------------------------------------------------------------------- */

export interface LectureAtelier {
  marge: number | null;
  volume: number | null;
  coutComplet: number | null;
  surcouts: number | null;
  retard: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  signee: number | null;
  prixCommande: number | null;
  chargePointe: number | null;
  coutCompletRecalcule: number | null;
  tarifRecalcule: number | null;
  volumeMoyen: number | null;
  rioultParti: number | null;
}

/** La part du budget de marge acquise à la fin de chaque semaine. */
export const BUDGET_A_DATE = (() => {
  const total = MARGE_BUDGET_SEMAINE.reduce((s, x) => s + x, 0);
  let cumul = 0;
  return MARGE_BUDGET_SEMAINE.map((x) => {
    cumul += x;
    return (BUDGET * cumul) / total;
  });
})();

/** La charge prévue en pleine saison : la demande normale, plus ce que le promoteur prendra encore. */
export function chargePrevueEnPointe(chemin: readonly number[], graine: number): number {
  const signee = commandeSignee(chemin, graine) !== null;
  const avance = signee && chemin[D.planning] === 1;
  const lot = lotAccepte(chemin, graine) === "pointe";
  return (
    ACTIVITE_NORMALE * SAISON[10]! +
    (signee && !avance ? COMMANDE.rythme : 0) +
    (lot ? LOT.rythme : 0)
  );
}

/**
 * Ce que Nadège lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAtelier {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const prix = commandeSignee(chemin, graine);
  const commun = {
    signee: prix === null ? 0 : 1,
    prixCommande: prix,
    chargePointe: chargePrevueEnPointe(chemin, graine),
  };
  if (semaine === 0) {
    const creux = ACTIVITE_NORMALE * SAISON[1]!;
    return {
      marge: 0,
      volume: creux,
      coutComplet: COUT_VARIABLE + CHARGES_FIXES / creux,
      surcouts: 0,
      retard: 0,
      budgetADate: 0,
      ...commun,
      coutCompletRecalcule: null,
      tarifRecalcule: null,
      volumeMoyen: null,
      rioultParti: 0,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.margeCumul,
    volume: s.volume,
    coutComplet: s.coutComplet,
    surcouts: s.surcoutCumul,
    retard: s.retard,
    budgetADate: BUDGET_A_DATE[semaine]!,
    ...commun,
    coutCompletRecalcule: semaine >= 10 ? t.coutCompletRecalcule : null,
    tarifRecalcule: semaine >= 10 ? t.tarifRecalcule : null,
    volumeMoyen: semaine >= 10 ? t.volumeMoyen : null,
    rioultParti: t.rioultParti && semaine >= RIOULT.des ? 1 : 0,
  };
}
