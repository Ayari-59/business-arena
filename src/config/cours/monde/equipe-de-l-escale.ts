import { HEURES_D_UN_TEMPS_COMPLET } from "./equipe-de-la-boutique";
import { L_ESCALE } from "./l-escale";

/**
 * LE MONDE DU COURS : L'ÉQUIPE DE L'ESCALE, POUR « DE L'INDIVIDU À L'ACTEUR » (Bac STMG, sciences de
 * gestion et numérique de première, thème 1).
 *
 * L'hôtel du cours (l-escale.ts) compte 14 salariés, payés 8 600 € chacun par trimestre, charges
 * comprises : ces deux chiffres sont ceux de sa fiche, et la garde vérifie que l'organigramme les
 * refait. Le reste est une hypothèse du cours, dite ici : la répartition des 14 salariés entre la
 * direction, la réception, les étages et la salle ; les personnes que le chapitre suit (Inès, la
 * réceptionniste qui arrive, et Karim, le réceptionniste le plus ancien) ; les arrivées et les
 * départs de l'année N ; ce que coûte un départ et ce que promet le tutorat.
 *
 * L'heure de travail d'un salarié se compte sur le temps complet du cours (151,67 heures par mois,
 * celui de la paie de la boutique) : 8 600 € ÷ (3 × 151,67 h), au centime.
 */

export interface ServiceDeLHotel {
  code: string;
  nom: string;
  /** Le responsable du service, qui a l'autorité que lui donne l'organigramme. */
  responsable: string;
  effectif: number;
  /** Ce que fait le service, en une phrase. */
  mission: string;
}

/** L'ORGANIGRAMME DE L'ESCALE (hypothèse du cours) : quatre services, 14 salariés. */
export const SERVICES_DE_L_ESCALE: readonly ServiceDeLHotel[] = [
  { code: "direction", nom: "Direction", responsable: "la directrice", effectif: 1, mission: "fixe les objectifs, recrute et tient le budget" },
  { code: "reception", nom: "Réception", responsable: "le chef de réception", effectif: 4, mission: "accueille, enregistre les arrivées et les départs, répond aux avis" },
  { code: "etages", nom: "Étages", responsable: "la gouvernante", effectif: 6, mission: "prépare les chambres et le linge" },
  { code: "salle", nom: "Salle", responsable: "la responsable du petit-déjeuner", effectif: 3, mission: "sert le petit-déjeuner et tient le bar" },
];

/** L'effectif de l'organigramme : celui de la fiche de l'hôtel (la garde le vérifie). */
export const EFFECTIF_DE_L_ESCALE = SERVICES_DE_L_ESCALE.reduce((n, s) => n + s.effectif, 0);

/** Le coût d'une heure de travail d'un salarié de L'ESCALE, charges comprises, au centime. */
export const COUT_HORAIRE_DE_L_ESCALE =
  Math.round((L_ESCALE.equipe.coutParSalarieParTrimestre / (3 * HEURES_D_UN_TEMPS_COMPLET)) * 100) / 100;

/**
 * L'INTÉGRATION DES NOUVEAUX (hypothèses du cours). En N, l'hôtel a accueilli 6 salariés ; 3 sont
 * partis pendant leur période d'essai. Remplacer un départ coûte le recrutement (l'annonce et les
 * entretiens, 900 €) et les heures de formation du remplaçant (70 heures, son temps et celui de
 * qui le forme, au coût horaire de l'hôtel). La directrice attend d'un tuteur, un salarié ancien qui
 * accompagne chaque arrivant, qu'il ramène les départs à 1 sur autant d'arrivées.
 */
export const INTEGRATION_DE_L_ESCALE: Readonly<Record<"arrivees" | "departs" | "departsAvecTutorat" | "recrutement" | "heuresDeFormation", number>> = {
  arrivees: 6,
  departs: 3,
  departsAvecTutorat: 1,
  recrutement: 900,
  heuresDeFormation: 70,
};

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Ce que coûte un départ, ce que le tutorat ferait économiser, et ce qu'il coûte pour un nombre d'heures par arrivant. */
export function integrationDeLEscale(heuresDeTutorat = 0, annee: Partial<Record<"arrivees" | "departs" | "departsAvecTutorat", number>> = {}) {
  const i = { ...INTEGRATION_DE_L_ESCALE, ...annee };
  const formation = auCentime(i.heuresDeFormation * COUT_HORAIRE_DE_L_ESCALE);
  const coutDUnDepart = auCentime(i.recrutement + formation);
  const departsEvites = i.departs - i.departsAvecTutorat;
  const economie = auCentime(departsEvites * coutDUnDepart);
  const coutDuTutorat = auCentime(i.arrivees * heuresDeTutorat * COUT_HORAIRE_DE_L_ESCALE);
  return { formation, coutDUnDepart, departsEvites, economie, coutDuTutorat, gain: auCentime(economie - coutDuTutorat) };
}

/**
 * L'ÉTÉ DE N + 1 (hypothèse du cas « Un tuteur pour l'été ») : l'hôtel recrute 10 saisonniers ; sans
 * tuteur, la directrice en attend 5 départs, avec un tuteur 1 seul, et elle propose 30 heures de
 * tutorat par saisonnier.
 */
export const ETE_DE_L_ESCALE = { arrivees: 10, departs: 5, departsAvecTutorat: 1, heuresProposees: 30 } as const;

/** Le plus d'heures de tutorat par arrivant que l'économie paie encore, à l'heure près. */
export const TUTORAT_LE_PLUS_LONG = Math.floor(integrationDeLEscale().economie / (INTEGRATION_DE_L_ESCALE.arrivees * COUT_HORAIRE_DE_L_ESCALE));
