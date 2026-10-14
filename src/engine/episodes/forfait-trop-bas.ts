/**
 * LE FORFAIT VENDU SOUS SON COÛT — le modèle du chiffrage des forfaits d'Atlas Conseil.
 *
 * Prune Lecoeur, contrôleuse de gestion du cabinet, de janvier à mars. Les
 * forfaits paraissent rentables à la vente (38 % de marge affichée par la
 * grille de chiffrage) et finissent en perte (−3 % une fois clos). La grille,
 * construite en 2019, divise le coût annuel d'un consultant par 218 jours.
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · UN JOUR FACTURABLE PAIE AUSSI LES JOURS QUI NE LE SONT PAS. Sur les
 *     218 jours du forfait annuel d'un cadre (253 jours ouvrés, moins 25 jours
 *     de congés et 10 de RTT), un consultant senior en facture 160 : le reste
 *     part en absences, formation, avant-vente, intercontrat et tâches
 *     internes. Le coût de revient d'une journée FACTURABLE est le coût annuel
 *     complet (salaire chargé, plus la quote-part des charges de structure :
 *     fonctions support, locaux, système d'information…) divisé par ces
 *     160 jours, pas par 218. La grille fait les deux erreurs : elle divise
 *     par 218, et elle garde la quote-part de structure de 2019 (24 000 € par
 *     consultant, 36 000 € aujourd'hui). Elle sous-estime le coût d'une
 *     journée de 33 à 39 % selon le grade : 550 € pour un senior qui en coûte
 *     825. Le prix plancher durable d'un forfait est son coût complet,
 *     dépassement moyen compris (8 % des jours vendus).
 *   · UNE GRILLE JUSTE PERD DES PROPOSITIONS, ET GAGNE DE L'ARGENT. Au prix
 *     plancher, le taux de transformation baisse ; mais chaque forfait gagné
 *     sous le coût complet est une perte signée pour des mois. Baisser les
 *     prix pour « regagner des forfaits » remplit le carnet de pertes. Quand
 *     la note technique pèse lourd, concentrer l'avant-vente sur les
 *     consultations qu'on peut gagner (go / no-go) fait mieux que de répondre
 *     à tout, et renforce les mémoires suivants.
 *   · LE COÛT MARGINAL, DANS L'AUTRE SENS. Trois analystes sont en
 *     intercontrat certain des semaines 6 à 11 : leurs salaires sont payés
 *     qu'ils travaillent ou non. Une mission payée sous leur coût complet,
 *     mais au-dessus de ce qu'elle ajoute vraiment aux coûts (des frais non
 *     refacturés, les jours d'un senior qui, lui, n'est pas libre), enrichit
 *     le cabinet — à condition de tenir dans la fenêtre d'intercontrat. Au-delà,
 *     ces analystes sont attendus ailleurs et le coût marginal saute : il faut
 *     les remplacer par des indépendants de Freelancia.
 *   · LA PYRAMIDE PÈSE AUTANT QUE LE TJM. Un même forfait coûte 14 % de moins
 *     avec des analystes encadrés par des seniors qu'avec l'équipe chargée en
 *     managers qu'un associé chiffre par habitude. Revoir la pyramide tient le
 *     budget d'un client sans baisser les prix ; mais une équipe plus jeune
 *     dépasse un peu plus, et un comité de pilotage peut réclamer son manager.
 *
 * L'OBJECTIF, en euros : la marge des forfaits sur le trimestre, soit
 *   · la marge réalisée des forfaits en cours, signés l'an dernier ;
 *   · plus la marge À TERMINAISON des forfaits signés de janvier à mars : la
 *     part réalisée dans le trimestre et la projection du carnet, valorisées
 *     au coût complet réel des jours (dépassements compris) ; pour un
 *     accord-cadre, sur le minimum de commandes de la première année.
 * Une journée qui ne prend la place de rien — l'intercontrat certain — ne
 * coûte que ce qu'elle ajoute (frais, jours d'un senior) ; une journée prise à
 * la place d'une autre, au-delà, coûte ce qu'il faut payer pour la remplacer.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LE COÛT D'UNE JOURNÉE, grade par grade : toutes les sources en sont tirées.
 * ------------------------------------------------------------------------- */

export type Grade = "analyste" | "senior" | "manager";
export const GRADES: readonly Grade[] = ["analyste", "senior", "manager"];
export const NOMS_GRADES: Record<Grade, string> = {
  analyste: "Analyste",
  senior: "Consultant senior",
  manager: "Manager",
};

/** Le forfait annuel d'un cadre : 253 jours ouvrés, moins 25 jours de congés et 10 de RTT. */
export const JOURS_OUVRES = 253;
export const CONGES = 25;
export const RTT = 10;
export const JOURS_TRAVAILLES = JOURS_OUVRES - CONGES - RTT;

/** Le salaire annuel chargé moyen, par grade. */
export const SALAIRE_CHARGE: Record<Grade, number> = {
  analyste: 54000,
  senior: 96000,
  manager: 116000,
};

/** Où passent les 218 jours, par grade, d'après les temps saisis dans Tempora l'an dernier. */
export const TEMPS: Record<
  Grade,
  { absences: number; formation: number; avantVente: number; intercontrat: number; interne: number }
> = {
  analyste: { absences: 7, formation: 10, avantVente: 4, intercontrat: 27, interne: 10 },
  senior: { absences: 7, formation: 6, avantVente: 18, intercontrat: 15, interne: 12 },
  manager: { absences: 7, formation: 4, avantVente: 30, intercontrat: 8, interne: 17 },
};
export const nonFacturables = (g: Grade) => Object.values(TEMPS[g]).reduce((s, x) => s + x, 0);
export const FACTURABLES: Record<Grade, number> = {
  analyste: JOURS_TRAVAILLES - nonFacturables("analyste"),
  senior: JOURS_TRAVAILLES - nonFacturables("senior"),
  manager: JOURS_TRAVAILLES - nonFacturables("manager"),
};

/** Les charges de structure de l'an dernier : les fonctions support, et tout le reste. */
export const STRUCTURE = { support: 3100000, autres: 3740000 } as const;
export const CHARGES_STRUCTURE = STRUCTURE.support + STRUCTURE.autres;
/** Les consultants facturables du cabinet, sur qui la structure se répartit. */
export const CONSULTANTS = 190;
export const QUOTE_PART = CHARGES_STRUCTURE / CONSULTANTS;
/** La quote-part de structure que la grille a gardée depuis 2019. */
export const QUOTE_PART_GRILLE = 24000;

/** Le coût d'une journée selon la grille : coût annuel de 2019, divisé par 218 jours. */
export const coutGrille = (g: Grade) => (SALAIRE_CHARGE[g] + QUOTE_PART_GRILLE) / JOURS_TRAVAILLES;
/** Le coût de revient complet d'une journée facturable : coût annuel complet ÷ jours facturables. */
export const coutComplet = (g: Grade) => (SALAIRE_CHARGE[g] + QUOTE_PART) / FACTURABLES[g];
/** Ce que la grille sous-estime, en part du vrai coût. */
export const sousEstimation = (g: Grade) => 1 - coutGrille(g) / coutComplet(g);

/** Le TJM catalogue, par grade. */
export const TJM: Record<Grade, number> = { analyste: 650, senior: 950, manager: 1200 };

/** Une équipe : des jours par grade (ou des parts de jours). */
export type Pyramide = Record<Grade, number>;
export const joursDe = (p: Pyramide) => p.analyste + p.senior + p.manager;
export const coutEquipe = (p: Pyramide, cout: (g: Grade) => number = coutComplet) =>
  GRADES.reduce((s, g) => s + p[g] * cout(g), 0);
export const catalogue = (p: Pyramide) => GRADES.reduce((s, g) => s + p[g] * TJM[g], 0);

/** La pyramide type d'un forfait : la moitié des jours en analystes, 30 % en seniors, 20 % en managers. */
export const STANDARD: Pyramide = { analyste: 0.5, senior: 0.3, manager: 0.2 };
/** Le coût complet d'un jour de forfait à la pyramide type. */
export const COUT_JOUR = coutEquipe(STANDARD);
export const COUT_JOUR_GRILLE = coutEquipe(STANDARD, coutGrille);
export const TJM_MOYEN = catalogue(STANDARD);

/** Le dépassement moyen des forfaits clos l'an dernier : des jours passés et non payés. */
export const DEPASSEMENT = 0.08;
/** Le prix plancher durable d'un jour de forfait : son coût complet, dépassement moyen compris. */
export const PLANCHER = COUT_JOUR * (1 + DEPASSEMENT);
/** La remise moyenne accordée l'an dernier sur le catalogue. */
export const REMISE = 0.1;
export const PRIX_ACTUEL = TJM_MOYEN * (1 - REMISE);
/** Les forfaits clos l'an dernier : marge affichée par la grille à la vente, marge réelle à la clôture. */
export const MARGE_AFFICHEE = 1 - COUT_JOUR_GRILLE / PRIX_ACTUEL;
export const MARGE_REELLE_2024 = 1 - PLANCHER / PRIX_ACTUEL;
export const MARGE_SANS_DEPASSEMENT = 1 - COUT_JOUR / PRIX_ACTUEL;

/**
 * Le prix d'un jour de forfait (pyramide type), selon la règle de chiffrage :
 *   · baisser de 8 % pour regagner des forfaits ;
 *   · provisionner 5 % de jours pour les dépassements, sans toucher au coût ;
 *   · le catalogue, remise limitée à 2,5 % pour rester au-dessus du plancher ;
 *   · la grille et la remise de l'an dernier.
 */
export const PRIX = {
  baisse: PRIX_ACTUEL * 0.92,
  provision: PRIX_ACTUEL * 1.05,
  plancher: TJM_MOYEN * 0.975,
  actuel: PRIX_ACTUEL,
} as const;

/* ---------------------------------------------------------------------------
 * LES PROPOSITIONS DU TRIMESTRE.
 * ------------------------------------------------------------------------- */

/** « technique » : la note technique pèse au moins 60 % ; « prix » : le prix pèse au moins 50 %. */
export type TypeDeConsultation = "technique" | "prix";
export interface Proposition {
  id: string;
  client: string;
  semaine: number;
  jours: number;
  type: TypeDeConsultation;
}

export const PROPOSITIONS: readonly Proposition[] = [
  { id: "conserverie", client: "Conserverie Gravelot", semaine: 2, jours: 140, type: "technique" },
  { id: "syndicat", client: "Syndicat des eaux du Vignoble", semaine: 3, jours: 110, type: "prix" },
  { id: "chantiers", client: "Chantiers Kerdavel", semaine: 3, jours: 160, type: "technique" },
  { id: "chu", client: "Centre hospitalier de Pornelle", semaine: 4, jours: 120, type: "prix" },
  { id: "laboratoire", client: "Laboratoires Aubrevel", semaine: 5, jours: 150, type: "technique" },
  {
    id: "communaute",
    client: "Communauté de communes du Pays de Brivane",
    semaine: 6,
    jours: 100,
    type: "prix",
  },
  { id: "transports", client: "Transports Quilvenec", semaine: 8, jours: 180, type: "technique" },
  {
    id: "office",
    client: "Office public de l'habitat de Saumière",
    semaine: 10,
    jours: 120,
    type: "prix",
  },
  {
    id: "papeterie",
    client: "Papeteries de l'Odet-Vallon",
    semaine: 12,
    jours: 160,
    type: "technique",
  },
  { id: "distribution", client: "Distri-Ouest Frais", semaine: 13, jours: 130, type: "technique" },
];

/** La chance de gagner une consultation, selon le prix proposé (repère : le prix de l'an dernier). */
export const CHANCE = {
  technique: { base: 0.42, elasticite: 2.5 },
  prix: { base: 0.34, elasticite: 8 },
  /** Concentrer l'avant-vente sur les consultations techniques : de meilleurs mémoires. */
  goNoGo: 1.3,
  max: 0.85,
} as const;
export function chanceDeGagner(prix: number, type: TypeDeConsultation, goNoGo: boolean): number {
  const c = CHANCE[type];
  const p = c.base * (goNoGo && type === "technique" ? CHANCE.goNoGo : 1);
  return Math.min(CHANCE.max, p * Math.exp(-c.elasticite * (prix / PRIX_ACTUEL - 1)));
}
/** Le rythme de production d'un forfait gagné : il démarre trois semaines après la signature. */
export const RYTHME = 12;
export const DELAI_DEMARRAGE = 3;

/** Les forfaits en cours, signés l'an dernier : des jours par semaine, au prix de l'an dernier. */
export const EN_COURS = { joursParSemaine: 40, prix: PRIX_ACTUEL } as const;

/* ---------------------------------------------------------------------------
 * LA MISSION D'INTERCONTRAT (décision 3).
 * ------------------------------------------------------------------------- */

/** La Biscuiterie Lancelin : un diagnostic d'entrepôts, trois analystes et un senior. */
export const MISSION = {
  analystes: 3,
  joursParSemaine: 4,
  de: 6,
  a: 11,
  /** Les jours d'un senior pour encadrer : lui n'est pas en intercontrat. */
  joursSenior: 6,
  prix: 36000,
  /** Les frais de mission que le prix ne couvre pas, par jour d'analyste. */
  frais: 25,
  /** Prolonger à dix semaines : 48 jours d'analystes et 4 de senior en plus, pour 24 000 €. */
  prolongation: { semaines: 4, joursSenior: 4, prix: 24000 },
  /** Le TJM d'un analyste de Freelancia, pour remplacer ceux qu'attend le programme hospitalier. */
  freelance: 620,
  /** Contre-proposer au coût complet plus 8 % : le client accepte une fois sur quatre. */
  contre: 49000,
  chanceContre: 0.25,
} as const;
export const JOURS_MISSION =
  MISSION.analystes * MISSION.joursParSemaine * (MISSION.a - MISSION.de + 1);
export const JOURS_PROLONGATION =
  MISSION.analystes * MISSION.joursParSemaine * MISSION.prolongation.semaines;
export const COUT_COMPLET_MISSION =
  JOURS_MISSION * coutComplet("analyste") + MISSION.joursSenior * coutComplet("senior");
/** Ce que la mission ajoute vraiment aux coûts, dans la fenêtre d'intercontrat. */
export const COUT_MARGINAL_MISSION =
  JOURS_MISSION * MISSION.frais + MISSION.joursSenior * coutComplet("senior");
export const MARGE_MISSION = MISSION.prix - COUT_MARGINAL_MISSION;
/** La prolongation : des analystes attendus ailleurs, à remplacer par des indépendants. */
export const COUT_PROLONGATION =
  JOURS_PROLONGATION * MISSION.freelance + MISSION.prolongation.joursSenior * coutComplet("senior");
export const MARGE_PROLONGATION = MISSION.prolongation.prix - COUT_PROLONGATION;
export const PRIX_JOUR_MISSION = MISSION.prix / (JOURS_MISSION + MISSION.joursSenior);

/* ---------------------------------------------------------------------------
 * LE SCHÉMA DIRECTEUR DE LA COOPÉRATIVE VALMORIN (décision 4).
 * ------------------------------------------------------------------------- */

export const VALMORIN = {
  budget: 200000,
  /** L'équipe que l'associé a chiffrée : un tiers de managers. */
  associe: { analyste: 80, senior: 80, manager: 80 } as Pyramide,
  /** Des analystes encadrés par les seniors, un manager à 18 jours. */
  revue: { analyste: 172, senior: 60, manager: 18 } as Pyramide,
  /** La même idée, en gardant le manager sur chaque comité. */
  prudente: { analyste: 133, senior: 74, manager: 43 } as Pyramide,
  /** Le dépassement attendu, selon l'équipe : une équipe plus jeune dépasse un peu plus. */
  depassement: {
    associe: { moyen: 0.07, ecart: 0.03 },
    revue: { moyen: 0.09, ecart: 0.05 },
    prudente: { moyen: 0.075, ecart: 0.025 },
  },
  /** Avec le manager à 18 jours, près d'un comité sur trois le réclame : 35 jours de plus. */
  chanceComite: 0.3,
  joursComite: 35,
  semaineComite: 12,
  /** Au prix catalogue, à prendre ou à laisser : la coopérative accepte une fois sur cinq. */
  chanceCatalogue: 0.2,
  signature: 8,
} as const;

/* ---------------------------------------------------------------------------
 * L'ACCORD-CADRE D'ACHATS PUBLICS DE L'OUEST (décision 5).
 * ------------------------------------------------------------------------- */

export const ACCORD = {
  /** Le minimum de commandes de la première année, en jours. */
  minimumJours: 400,
  poidsPrix: 40,
  poidsTechnique: 60,
  prixKeroual: 700,
  prixHalden: 900,
  techAtlas: 50,
  techKeroual: 46,
  techHalden: 52,
  /** L'écart-type de la note technique d'un candidat : l'appréciation du jury. */
  ecartTech: 3,
  /** Un mémoire préparé par une avant-vente qui n'a pas répondu à tout. */
  bonusGoNoGo: 3,
  prix: { aligne: 700, plancher: 790, catalogue: 850 },
  attribution: 11,
} as const;
/** La note prix : le poids du prix, multiplié par le prix le plus bas et divisé par le prix. */
export const notePrix = (prix: number, plusBas: number) => (ACCORD.poidsPrix * plusBas) / prix;

/* ---------------------------------------------------------------------------
 * LE RENOUVELLEMENT DE LA MUTUELLE ARMORINE (décision 6).
 * ------------------------------------------------------------------------- */

export const ARMORINE = {
  jours: 260,
  prix2024: 760,
  pyramide: { analyste: 0.4, senior: 0.4, manager: 0.2 } as Pyramide,
  nouvelle: { analyste: 0.55, senior: 0.35, manager: 0.1 } as Pyramide,
  depassement: { moyen: 0.06, ecart: 0.02 },
  /** Le plancher de son équipe, plus 3 % : la mutuelle accepte sept fois sur dix. */
  prixPropose: 840,
  chanceAccepte: 0.7,
  signature: 13,
} as const;
export const COUT_JOUR_ARMORINE = coutEquipe(ARMORINE.pyramide);
export const COUT_JOUR_ARMORINE_NOUVELLE = coutEquipe(ARMORINE.nouvelle);

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS, L'ENQUÊTE ET LE BUDGET.
 * ------------------------------------------------------------------------- */

export const D = {
  grille: 0,
  pertes: 1,
  intercontrat: 2,
  pyramide: 3,
  accord: 4,
  renouvellement: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 0, 0, 3, 0] as const;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, une proposition part chiffrée avec l'ancienne grille. */
export const PERTE_PAR_JOUR = 1500;
/** La marge des forfaits que le budget attend du trimestre. */
export const BUDGET = 40000;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent les forfaits en cours, quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce qu'il coûte aux forfaits en cours, en euros. */
  cout: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Ressources humaines",
    role: "Siège, Nantes",
    texte:
      "La grippe touche le bureau de Nantes : cinq consultants absents une semaine. Les jalons de deux forfaits glissent, et il faudra des jours en plus pour rattraper.",
    cout: 4000,
  },
  {
    id: "demission",
    titre: "Démission d'un manager",
    de: "Ressources humaines",
    role: "Siège, Nantes",
    texte:
      "Un manager de la practice Performance opérationnelle part chez Halden Partners. La passation de ses deux forfaits prend des jours que personne ne facturera.",
    cout: 6000,
  },
  {
    id: "greve",
    titre: "Grève des transports",
    de: "Assistante de direction",
    role: "Bureau de Rennes",
    texte:
      "Grève des trains toute la semaine : les équipes louent des voitures et dorment sur place. Des frais que les forfaits ne refacturent pas.",
    cout: 2500,
  },
  {
    id: "comite",
    titre: "Un comité de pilotage reporté",
    de: "Eloan Kastler",
    role: "Manager",
    texte:
      "Le client de Saint-Nazaire reporte son comité de pilotage de trois semaines : l'équipe attend la validation pour continuer, et les jours d'attente restent à notre charge.",
    cout: 3500,
  },
  {
    id: "tempora",
    titre: "Panne de Tempora",
    de: "Service informatique",
    role: "Siège, Nantes",
    texte:
      "Tempora est resté inaccessible trois jours : les temps de la semaine sont à ressaisir, et deux factures de jalon partent en retard.",
    cout: 1500,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le dépassement des forfaits en cours, ce trimestre. */
  gEnCours: number;
  /** Pour chaque proposition : le tirage qui décide du résultat, et celui du dépassement. */
  propositions: readonly { u: number; g: number }[];
  /** La biscuiterie accepte-t-elle la contre-proposition ? */
  uContre: number;
  /** La coopérative : dépassement, comité, prix catalogue. */
  gValmorin: number;
  uComite: number;
  uCatalogue: number;
  /** L'appréciation du jury sur les trois mémoires techniques. */
  techAtlas: number;
  techKeroual: number;
  techHalden: number;
  /** La mutuelle : accepte-t-elle le nouveau prix ? et le dépassement de l'an prochain. */
  uArmorine: number;
  gArmorine: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000829 + 7);
  const gEnCours = gauss(r);
  const propositions = PROPOSITIONS.map(() => ({ u: r(), g: gauss(r) }));
  const uContre = r();
  const gValmorin = gauss(r);
  const uComite = r();
  const uCatalogue = r();
  const techAtlas = gauss(r);
  const techKeroual = gauss(r);
  const techHalden = gauss(r);
  const uArmorine = r();
  const gArmorine = gauss(r);
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    gEnCours,
    propositions,
    uContre,
    gValmorin,
    uComite,
    uCatalogue,
    techAtlas,
    techKeroual,
    techHalden,
    uArmorine,
    gArmorine,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/* ---------------------------------------------------------------------------
 * CE QUE LES DÉCISIONS DÉCLENCHENT, SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** Le prix d'un jour de forfait pour une proposition de la semaine `w`, et si l'avant-vente trie. */
export function regleDePrix(chemin: readonly number[], w: number) {
  const d1 = chemin[D.grille] ?? NEUTRE[D.grille];
  const d2 = chemin[D.pertes] ?? NEUTRE[D.pertes];
  const base = [PRIX.baisse, PRIX.provision, PRIX.plancher, PRIX.actuel][d1]!;
  if (w <= 3) return { prix: base, goNoGo: false };
  if (d2 === 0) return { prix: base, goNoGo: true };
  if (d2 === 1) return { prix: PRIX.baisse, goNoGo: false };
  if (d2 === 3) return { prix: base * 0.97, goNoGo: false };
  return { prix: base, goNoGo: false };
}

/** La contre-proposition à la biscuiterie est-elle acceptée ? */
export const contreAcceptee = (graine: number) => hasard(graine).uContre < MISSION.chanceContre;

/** Le comité de pilotage de Valmorin réclame-t-il son manager ? */
export const comiteReclame = (chemin: readonly number[], graine: number) =>
  chemin[D.pyramide] === 2 && hasard(graine).uComite < VALMORIN.chanceComite;

/** Au prix catalogue, à prendre ou à laisser : la coopérative accepte-t-elle ? */
export const catalogueAccepte = (graine: number) =>
  hasard(graine).uCatalogue < VALMORIN.chanceCatalogue;

/** Les notes de l'accord-cadre, et qui l'emporte. `null` : Atlas n'a pas répondu. */
export function attribution(chemin: readonly number[], graine: number) {
  const d5 = chemin[D.accord];
  if (d5 === 3) return null;
  const h = hasard(graine);
  const prix = [ACCORD.prix.aligne, ACCORD.prix.plancher, ACCORD.prix.catalogue][d5 ?? 0]!;
  const goNoGo = chemin[D.pertes] === 0;
  const plusBas = Math.min(prix, ACCORD.prixKeroual, ACCORD.prixHalden);
  const atlas =
    notePrix(prix, plusBas) +
    ACCORD.techAtlas +
    (goNoGo ? ACCORD.bonusGoNoGo : 0) +
    ACCORD.ecartTech * h.techAtlas;
  const keroual =
    notePrix(ACCORD.prixKeroual, plusBas) + ACCORD.techKeroual + ACCORD.ecartTech * h.techKeroual;
  const halden =
    notePrix(ACCORD.prixHalden, plusBas) + ACCORD.techHalden + ACCORD.ecartTech * h.techHalden;
  const gagnant =
    atlas > keroual && atlas > halden ? "atlas" : keroual > halden ? "keroual" : "halden";
  return { prix, atlas, keroual, halden, gagnant } as const;
}

/** La mutuelle accepte-t-elle le prix plancher plus 4 % ? */
export const armorineAccepte = (graine: number) =>
  hasard(graine).uArmorine < ARMORINE.chanceAccepte;

/* ---------------------------------------------------------------------------
 * LA SIMULATION.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La marge de la semaine : réalisée sur les forfaits en cours, plus celle, à terminaison, des forfaits signés. */
  margeSemaine: number;
  /** La marge cumulée depuis janvier. */
  marge: number;
  /** Les honoraires signés depuis janvier et pas encore produits. */
  carnet: number;
  remises: number;
  gagnees: number;
  /** Les jours et les honoraires des forfaits signés depuis janvier. */
  joursVendus: number;
  honorairesVendus: number;
  /** Leur marge à terminaison, au coût complet réel. */
  margeVendue: number;
  /** Leur marge selon la grille de 2019, sans dépassement. */
  margeAffichee: number;
};

export interface Signature {
  id: string;
  client: string;
  semaine: number;
  jours: number;
  honoraires: number;
  /** La marge à terminaison, au coût réel des jours. */
  marge: number;
  /** La marge que la grille affichait à la signature. */
  margeAffichee: number;
  /** Les semaines de production : de quand à quand, et les honoraires produits par semaine. */
  debut: number;
  parSemaine: number;
}

export interface Resultat {
  id: string;
  client: string;
  semaine: number;
  prix: number;
  repondu: boolean;
  gagne: boolean;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge des forfaits : réalisée sur ceux en cours, à terminaison sur ceux signés. */
  objectif: number;
  margeEnCours: number;
  margeNouveaux: number;
  /** La part de la marge des forfaits signés qui reste à réaliser après mars. */
  margeCarnet: number;
  carnetFinal: number;
  signatures: readonly Signature[];
  resultats: readonly Resultat[];
  remises: number;
  gagnees: number;
  prixMoyen: number | null;
  /** Le prix moyen d'un jour sur les seules propositions gagnées, hors missions particulières. */
  prixPropositions: number | null;
  tauxMargeReelle: number | null;
  tauxMargeAffichee: number | null;
  /** La mission d'intercontrat : `null` si elle n'a pas eu lieu. */
  mission: "ferme" | "prolongee" | "contre" | null;
  comite: boolean;
  valmorin: "signee" | "perdue";
  accord: ReturnType<typeof attribution>;
  armorine: "reconduite" | "relevee" | "partie" | "repyramidee";
  perte: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, , d3, d4, , d6] = chemin;
  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const signatures: Signature[] = [];
  const resultats: Resultat[] = [];
  const signer = (s: Omit<Signature, "parSemaine"> & { duree: number }) => {
    const { duree, ...reste } = s;
    signatures.push({ ...reste, parSemaine: reste.honoraires / Math.max(1, duree) });
  };

  // Les propositions courantes.
  PROPOSITIONS.forEach((p, k) => {
    const { prix, goNoGo } = regleDePrix(chemin, p.semaine);
    const repondu = !goNoGo || p.type === "technique";
    const gagne = repondu && h.propositions[k]!.u < chanceDeGagner(prix, p.type, goNoGo);
    resultats.push({ id: p.id, client: p.client, semaine: p.semaine, prix, repondu, gagne });
    if (!gagne) return;
    const dep = borne(DEPASSEMENT + 0.035 * h.propositions[k]!.g, 0, 0.2);
    signer({
      id: p.id,
      client: p.client,
      semaine: p.semaine,
      jours: p.jours,
      honoraires: p.jours * prix,
      marge: p.jours * (prix - COUT_JOUR * (1 + dep)),
      margeAffichee: p.jours * (prix - COUT_JOUR_GRILLE),
      debut: p.semaine + DELAI_DEMARRAGE,
      duree: p.jours / RYTHME,
    });
  });

  // La mission d'intercontrat de la biscuiterie.
  let mission: Trimestre["mission"] = null;
  const joursMission = JOURS_MISSION + MISSION.joursSenior;
  if (d3 === 3 || d3 === 1) {
    const prolongee = d3 === 1;
    mission = prolongee ? "prolongee" : "ferme";
    signer({
      id: "biscuiterie",
      client: "Biscuiterie Lancelin",
      semaine: MISSION.de,
      jours: joursMission + (prolongee ? JOURS_PROLONGATION + MISSION.prolongation.joursSenior : 0),
      honoraires: MISSION.prix + (prolongee ? MISSION.prolongation.prix : 0),
      marge: MARGE_MISSION + (prolongee ? MARGE_PROLONGATION : 0),
      margeAffichee:
        MISSION.prix -
        coutEquipe(
          { analyste: JOURS_MISSION, senior: MISSION.joursSenior, manager: 0 },
          coutGrille,
        ) +
        (prolongee ? MISSION.prolongation.prix - JOURS_PROLONGATION * coutGrille("analyste") : 0),
      debut: MISSION.de,
      duree: MISSION.a - MISSION.de + 1 + (prolongee ? MISSION.prolongation.semaines : 0),
    });
  } else if (d3 === 2 && contreAcceptee(graine)) {
    mission = "contre";
    signer({
      id: "biscuiterie",
      client: "Biscuiterie Lancelin",
      semaine: MISSION.de,
      jours: joursMission,
      honoraires: MISSION.contre,
      marge: MISSION.contre - COUT_MARGINAL_MISSION,
      margeAffichee:
        MISSION.contre -
        coutEquipe(
          { analyste: JOURS_MISSION, senior: MISSION.joursSenior, manager: 0 },
          coutGrille,
        ),
      debut: MISSION.de,
      duree: MISSION.a - MISSION.de + 1,
    });
  }

  // Le schéma directeur de la coopérative.
  const equipe = d4 === 1 ? "prudente" : d4 === 2 ? "revue" : "associe";
  const pyramide = VALMORIN[equipe];
  const dv = VALMORIN.depassement[equipe];
  const depV = borne(dv.moyen + dv.ecart * h.gValmorin, 0, 0.25);
  const valmorinSignee = d4 !== 3 || catalogueAccepte(graine);
  const prixValmorin = d4 === 3 ? catalogue(VALMORIN.associe) : VALMORIN.budget;
  const comite = comiteReclame(chemin, graine);
  if (valmorinSignee) {
    signer({
      id: "valmorin",
      client: "Coopérative Valmorin",
      semaine: VALMORIN.signature,
      jours: joursDe(pyramide),
      honoraires: prixValmorin,
      marge: prixValmorin - coutEquipe(pyramide) * (1 + depV),
      margeAffichee: prixValmorin - coutEquipe(pyramide, coutGrille),
      debut: VALMORIN.signature + 2,
      duree: 10,
    });
  }

  // L'accord-cadre : le minimum de commandes de la première année, s'il est attribué à Atlas.
  const accord = attribution(chemin, graine);
  if (accord?.gagnant === "atlas") {
    signer({
      id: "accord",
      client: "Achats Publics de l'Ouest",
      semaine: ACCORD.attribution,
      jours: ACCORD.minimumJours,
      honoraires: ACCORD.minimumJours * accord.prix,
      marge: ACCORD.minimumJours * (accord.prix - PLANCHER),
      margeAffichee: ACCORD.minimumJours * (accord.prix - COUT_JOUR_GRILLE),
      debut: 14,
      duree: 40,
    });
  }

  // Le renouvellement de la mutuelle.
  let armorine: Trimestre["armorine"] = "partie";
  const depA = borne(
    ARMORINE.depassement.moyen + ARMORINE.depassement.ecart * h.gArmorine,
    0,
    0.15,
  );
  const renouveler = (prix: number, pyr: Pyramide) =>
    signer({
      id: "armorine",
      client: "Mutuelle Armorine",
      semaine: ARMORINE.signature,
      jours: ARMORINE.jours,
      honoraires: ARMORINE.jours * prix,
      marge: ARMORINE.jours * (prix - coutEquipe(pyr) * (1 + depA)),
      margeAffichee: ARMORINE.jours * (prix - coutEquipe(pyr, coutGrille)),
      debut: 14,
      duree: 40,
    });
  if (d6 === 0) {
    armorine = "reconduite";
    renouveler(ARMORINE.prix2024, ARMORINE.pyramide);
  } else if (d6 === 1 && armorineAccepte(graine)) {
    armorine = "relevee";
    renouveler(ARMORINE.prixPropose, ARMORINE.pyramide);
  } else if (d6 === 2) {
    armorine = "repyramidee";
    renouveler(ARMORINE.prix2024, ARMORINE.nouvelle);
  }

  // Semaine après semaine.
  const depEnCours = borne(DEPASSEMENT + 0.015 * h.gEnCours, 0.03, 0.13);
  const enCoursParSemaine =
    EN_COURS.joursParSemaine * (EN_COURS.prix - COUT_JOUR * (1 + depEnCours));
  const coutComite = VALMORIN.joursComite * coutComplet("manager");
  const semaines: (Semaine | null)[] = [null];
  let marge = 0;
  let margeEnCours = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    let m = enCoursParSemaine;
    for (const i of h.imprevus) if (i.semaine === w) m -= i.imprevu.cout;
    if (w === 1) m -= perte;
    margeEnCours += m;
    const signees = signatures.filter((s) => s.semaine <= w);
    for (const s of signatures) if (s.semaine === w) m += s.marge;
    if (comite && valmorinSignee && w === VALMORIN.semaineComite) m -= coutComite;
    marge += m;
    const produit = (s: Signature) =>
      Math.min(s.honoraires, Math.max(0, w - s.debut + 1) * s.parSemaine);
    const repondues = resultats.filter((r) => r.semaine <= w && r.repondu);
    semaines.push({
      margeSemaine: m,
      marge,
      carnet: signees.reduce((x, s) => x + s.honoraires - produit(s), 0),
      remises: repondues.length,
      gagnees: repondues.filter((r) => r.gagne).length,
      joursVendus: signees.reduce((x, s) => x + s.jours, 0),
      honorairesVendus: signees.reduce((x, s) => x + s.honoraires, 0),
      margeVendue:
        signees.reduce((x, s) => x + s.marge, 0) -
        (comite && valmorinSignee && w >= VALMORIN.semaineComite ? coutComite : 0),
      margeAffichee: signees.reduce((x, s) => x + s.margeAffichee, 0),
    });
  }

  const fin = semaines[SEMAINES]!;
  const margeNouveaux = fin.margeVendue;
  // La part de la marge à terminaison qui reste à réaliser après mars, au prorata du reste à produire.
  const margeCarnet = signatures.reduce((x, s) => {
    const produitFin = Math.min(s.honoraires, Math.max(0, SEMAINES - s.debut + 1) * s.parSemaine);
    return x + (s.marge * (s.honoraires - produitFin)) / Math.max(1, s.honoraires);
  }, 0);
  const courantes = signatures.filter((x) => PROPOSITIONS.some((p) => p.id === x.id));
  const joursCourants = courantes.reduce((x, c) => x + c.jours, 0);
  const remises = resultats.filter((r) => r.repondu).length;
  const gagnees = resultats.filter((r) => r.gagne).length;
  return {
    semaines,
    objectif: marge,
    margeEnCours: margeEnCours,
    margeNouveaux,
    margeCarnet,
    carnetFinal: fin.carnet,
    signatures,
    resultats,
    remises,
    gagnees,
    prixMoyen: fin.joursVendus ? fin.honorairesVendus / fin.joursVendus : null,
    prixPropositions: joursCourants
      ? courantes.reduce((x, c) => x + c.honoraires, 0) / joursCourants
      : null,
    tauxMargeReelle: fin.honorairesVendus ? fin.margeVendue / fin.honorairesVendus : null,
    tauxMargeAffichee: fin.honorairesVendus ? fin.margeAffichee / fin.honorairesVendus : null,
    mission,
    comite: comite && valmorinSignee,
    valmorin: valmorinSignee ? "signee" : "perdue",
    accord,
    armorine,
    perte,
  };
}

/** Ce qui s'est passé pendant des semaines : signatures, attribution, comité, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    resultats: t.resultats.filter((r) => r.repondu && dans(r.semaine)),
    comite: t.comite && dans(VALMORIN.semaineComite),
    valmorin: dans(VALMORIN.signature) ? t.valmorin : null,
    accord: dans(ACCORD.attribution) ? t.accord : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureForfaits {
  marge: number | null;
  carnet: number | null;
  transformation: number | null;
  prixJour: number | null;
  margeReelle: number | null;
  /** Pour les messages et les sources, non affichés. */
  remises: number | null;
  gagnees: number | null;
  margeAffichee: number | null;
}

/** Ce que Prune lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureForfaits {
  if (semaine === 0) {
    return {
      marge: 0,
      carnet: 0,
      transformation: 0.38,
      prixJour: PRIX_ACTUEL,
      margeReelle: MARGE_REELLE_2024,
      remises: 0,
      gagnees: 0,
      margeAffichee: MARGE_AFFICHEE,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    marge: s.marge,
    carnet: s.carnet,
    transformation: s.remises ? s.gagnees / s.remises : null,
    prixJour: s.joursVendus ? s.honorairesVendus / s.joursVendus : null,
    margeReelle: s.honorairesVendus ? s.margeVendue / s.honorairesVendus : null,
    remises: s.remises,
    gagnees: s.gagnees,
    margeAffichee: s.honorairesVendus ? s.margeAffichee / s.honorairesVendus : null,
  };
}
