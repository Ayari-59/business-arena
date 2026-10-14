/**
 * L'ÉQUIPE DISPERSÉE — le modèle de l'équipe technico-commerciale itinérante.
 *
 * Neuf technico-commerciaux sur trois départements, qu'on ne voit presque
 * jamais ; treize semaines, six décisions. Trois groupes, qui ne réagissent
 * pas au management de la même façon : trois AUTONOMES, qui font la moitié de
 * la marge ; quatre CONFIRMÉS ; deux DÉBUTANTS, recrutés il y a moins d'un an,
 * qui vendent deux fois moins que les meilleurs. Trois mécanismes
 * font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE CONTRÔLE ÉTEINT LES MEILLEURS. Géolocaliser les véhicules, exiger un
 *     compte rendu chaque soir : les visites montent quelques semaines, puis
 *     le temps passé à se justifier et la CONFIANCE perdue coûtent bien plus.
 *     Les autonomes y sont les plus sensibles : leur engagement baisse, et la
 *     meilleure finit par écouter les offres d'un concurrent. Le contrôle ne
 *     dit rien de ce que les débutants ne savent pas faire.
 *   · L'ISOLEMENT FAIT DÉCROCHER. Sans rituel, le LIEN avec l'équipe s'use
 *     semaine après semaine ; ce sont les débutants qui en souffrent le plus.
 *     Un point individuel court chaque semaine et une réunion mensuelle en
 *     présentiel le maintiennent, et donnent aux comptes rendus un lecteur :
 *     un compte rendu lu fait remonter des affaires, un compte rendu exigé ne
 *     fait remonter que des cases cochées.
 *   · LES PAIRS FONT PROGRESSER. Les débutants visitent autant que les
 *     autres ; ils perdent les devis techniques. Une tournée en binôme avec
 *     un autonome leur apprend le métier plus vite que tout — quand le binôme
 *     prend, et quand l'autonome a encore envie de transmettre. Adapter le
 *     style à chacun : guider les débutants, confier des missions aux
 *     autonomes.
 *
 * Le trimestre est jugé en euros : la marge apportée par l'équipe, moins les
 * outils, les déplacements, les recrutements, en écart au budget. Garder le
 * lien n'y est pas une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const EFFECTIF = 9;
export const AUTONOMES = 3;
export const CONFIRMES = 4;
export const DEBUTANTS = 2;
/** La marge hebdomadaire d'un commercial de chaque groupe, au mieux de sa forme. */
export const POTENTIEL = { autonome: 8800, confirme: 6600, debutant: 6600 } as const;
/** Le budget de marge nette de l'équipe sur le trimestre. */
export const BUDGET = 750000;
export const OBJECTIF_COMPTES_RENDUS = 0.8;
/** L'écart de résultats que la direction juge acceptable entre les meilleurs et les moins bons. */
export const OBJECTIF_ECART = 1.6;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des devis qui attendent une réponse, et qui partent. */
export const PERTE_PAR_JOUR = 1500;
/** Ce qu'une affaire signalée dans les comptes rendus rapporte par semaine, au mieux. */
export const OPPORTUNITES = 3500;
/** La marge hebdomadaire d'un commercial qui vend la nouvelle gamme d'isolation par l'extérieur. */
export const GAIN_ITE = 650;

export const CONFIANCE_DEPART = 0.6;
export const LIEN_DEPART = 0.35;
export const COMPETENCE_DEPART = 0.45;
export const ENGAGEMENT_DEPART = { autonome: 0.75, confirme: 0.62, debutant: 0.45 } as const;
export const COMPTES_RENDUS_DEPART = 0.55;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  cadre: 0,
  debutants: 1,
  comptesRendus: 2,
  elodie: 3,
  gamme: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 1, 3] as const;

export const COUTS = {
  boitiers: 1800,
  abonnement: 300,
  reunion: 1400,
  accompagnement: 350,
  assistante: 500,
  alignement: 150,
  atelier: 1600,
  formateur: 900,
  prime: 2000,
  recrutementElodie: 7000,
  recrutementKillian: 5000,
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
  duree: number;
  effet: { marge?: number; cout?: number; absents?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "transport",
    titre: "Grève des transporteurs",
    de: "Logistique",
    role: "Dépôt régional",
    texte:
      "Grève chez les transporteurs : les livraisons de chantier glissent d'une semaine, et des artisans reportent leurs commandes.",
    duree: 1,
    effet: { marge: 0.9 },
  },
  {
    id: "tablettes",
    titre: "Panne de l'outil de devis",
    de: "Service informatique",
    role: "Siège",
    texte:
      "L'outil de devis des tablettes est tombé trois jours : les commerciaux chiffrent à la main, et rappellent le lendemain.",
    duree: 1,
    effet: { marge: 0.93 },
  },
  {
    id: "faillite",
    titre: "Faillite d'un client plaquiste",
    de: "Service crédit",
    role: "Siège",
    texte:
      "Un client plaquiste de l'Ain est placé en liquidation : sa dernière facture ne sera pas payée. 6 500 € passés en perte.",
    duree: 1,
    effet: { cout: 6500 },
  },
  {
    id: "salon",
    titre: "Salon régional du bâtiment",
    de: "Marketing",
    role: "Siège",
    texte:
      "Le salon régional du bâtiment fait venir les artisans sur le stand d'Arvel : les commerciaux repartent avec des rendez-vous pour deux semaines.",
    duree: 2,
    effet: { marge: 1.06 },
  },
  {
    id: "arret",
    titre: "Un commercial confirmé en arrêt",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Loris Bonnaud est arrêté deux semaines après une chute sur un chantier : son secteur attend.",
    duree: 2,
    effet: { absents: 1 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'activité du bâtiment, semaine par semaine. */
  semaines: readonly (number | null)[];
  /** Les deux binômes prennent-ils ? Alassane avec Killian, Ambre avec Anaïs. */
  uBinome1: number;
  uBinome2: number;
  /** Killian démissionne-t-il s'il décroche ? */
  uKillian: number;
  /** Ambre accepte-t-elle l'offre du concurrent ? */
  uElodie: number;
  /** Les artisans suivent-ils une remise de fin de trimestre ? */
  uRemise: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000187 + 7);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) semaines.push(borne(1 + 0.05 * gauss(r), 0.88, 1.12));
  const uBinome1 = r();
  const uBinome2 = r();
  const uKillian = r();
  const uElodie = r();
  const uRemise = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uBinome1, uBinome2, uKillian, uElodie, uRemise, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Un binôme prend deux fois sur trois : deux styles, deux caractères, ça ne se décrète pas. */
export const binomesQuiPrennent = (graine: number): [boolean, boolean] => {
  const h = hasard(graine);
  return [h.uBinome1 < 0.65, h.uBinome2 < 0.65];
};

/** Une fois sur deux, les artisans avancent leurs commandes pour profiter d'une remise. */
export const remiseSuivie = (graine: number) => hasard(graine).uRemise < 0.5;

/** Le risque que Killian démissionne, lu sur l'engagement des débutants en fin de semaine 7. */
export const risqueKillian = (engagement: number) => borne((0.42 - engagement) * 4, 0, 0.7);

/**
 * LE RISQUE QU'ÉLODIE PARTE, lu en fin de semaine 9.
 *
 * Un concurrent l'a approchée : elle écoute d'autant plus que l'engagement
 * des autonomes et la confiance de l'équipe sont bas.
 */
export const risqueElodie = (engagement: number, confiance: number) =>
  borne(0.1 + 1.5 * (0.8 - engagement) + 0.8 * (0.55 - confiance), 0.03, 0.8);

/**
 * CE QUE LA RÉPONSE À ÉLODIE CHANGE À SON RISQUE.
 *
 * Plus d'autonomie et une mission répondent à ce qui la fait partir ; tant
 * que le boîtier reste dans sa voiture, elles n'y répondent qu'à moitié.
 */
export function facteurElodie(chemin: readonly number[]): number {
  const choix = chemin[D.elodie] ?? 3;
  if (choix === 0) return chemin[D.cadre] === 0 ? 0.7 : 0.35;
  return [0.35, 0.6, 1.3, 1][choix] ?? 1;
}

/** Ce qu'un commercial tire de son engagement : un commercial désengagé visite et relance moins. */
const productivite = (e: number) => 0.75 + 0.3 * e;

export type Semaine = {
  /** La marge apportée par l'équipe dans la semaine. */
  marge: number;
  /** La marge par tête des autonomes rapportée à celle des débutants. */
  ecart: number;
  /** La part des visites qui ont un compte rendu. */
  comptesRendus: number;
  /** L'engagement moyen de l'équipe, de 0 à 1. */
  engagement: number;
  /** Le risque qu'un commercial parte dans le trimestre. */
  risque: number;
  /** Ce que la semaine apporte à la marge nette : marge, moins outils, déplacements et départs. */
  contribution: number;
  cumul: number;
  lien: number;
  confiance: number;
  engagementAutonomes: number;
  engagementDebutants: number;
  competence: number;
  /** La marge que les affaires remontées par les comptes rendus ont apportée. */
  opportunites: number;
  presents: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge nette : positif, l'équipe fait mieux que le budget. */
  objectif: number;
  margeNette: number;
  depenses: number;
  killianPart: boolean;
  elodiePart: boolean;
  binomes: readonly [boolean, boolean] | null;
  /** Les autonomes ont-ils accepté le binôme de bon cœur ? */
  binomeVolontaire: boolean;
  remiseSuivie: boolean | null;
  effectifFinal: number;
  ecartFinal: number;
  comptesRendusMoyens: number;
  engagementFinal: number;
  competenceFinale: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const binomes = d2 === 0 ? binomesQuiPrennent(graine) : null;
  const remise = d6 === 2 ? remiseSuivie(graine) : null;
  const semaines: (Semaine | null)[] = [null];
  let confiance = CONFIANCE_DEPART;
  let lien = LIEN_DEPART;
  let competence = COMPETENCE_DEPART;
  let eA: number = ENGAGEMENT_DEPART.autonome;
  let eB: number = ENGAGEMENT_DEPART.confirme;
  let eC: number = ENGAGEMENT_DEPART.debutant;
  let comptesRendus = COMPTES_RENDUS_DEPART;
  let qualite = 0.5;
  let cumul = 0;
  let depenses = 0;
  let killian = false;
  let elodie = false;
  let volontaire = true;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const activite = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let depense = 0;

    // Ce que les décisions changent, le jour où elles prennent effet.
    if (w === 2) confiance += [-0.16, 0.05, 0.06, 0][d1 ?? 3]!;
    if (w === 4) {
      if (d2 === 0) {
        // Transmettre pendant qu'on est suivi au kilomètre : les autonomes le font, sans plus.
        volontaire = confiance >= 0.45;
        eA += volontaire ? 0.02 : -0.03;
      }
      if (d2 === 2) {
        eC -= 0.07;
        confiance -= 0.04;
      }
    }
    if (w === 6) confiance += [-0.08, 0.03, 0.02, 0][d3 ?? 3]!;
    if (w === 8) confiance += [0.08, 0, -0.06, 0][d4 ?? 3]!;
    if (w === 10) {
      if (d5 === 0) {
        lien += 0.08;
        competence += 0.05;
      }
      if (d5 === 2) {
        lien -= 0.04;
        eC -= 0.06;
        eA += 0.02;
      }
      if (d5 === 3) competence += 0.02;
    }
    if (w === 12) {
      if (d6 === 0) confiance -= 0.08;
      if (d6 === 1) lien += 0.02;
    }
    confiance = borne(confiance, 0.05, 0.95);

    // Le lien : sans rituel, il s'use ; un point chaque semaine et une réunion par mois le tiennent.
    const cibleLien = w >= 2 ? [0.25, 0.65, 0.28, 0.2][d1 ?? 3]! : 0.2;
    lien += 0.25 * (cibleLien - lien);
    if (d1 === 1 && (w === 4 || w === 8 || w === 12)) lien += 0.05;
    lien = borne(lien, 0.05, 0.95);
    // Ce que les débutants reçoivent en plus : quelqu'un à qui parler sur le terrain.
    let soutien = 0;
    if (d2 === 0) soutien = w >= 4 && w <= 7 ? 0.15 : w >= 8 ? 0.08 : 0;
    if (d2 === 1) soutien = w >= 4 && w <= 7 ? 0.12 : w >= 8 ? 0.05 : 0;
    if (d2 === 3 && w >= 4) soutien = 0.02;

    // Ce que les débutants apprennent : un peu sur le tas, beaucoup aux côtés d'un ancien.
    competence += 0.004;
    if (binomes && w >= 4 && w <= 7) {
      const prise = binomes.reduce((s, b) => s + (b ? 1 : 0), 0) / 2;
      competence += 0.06 * prise * (volontaire ? 1 : 0.55);
    }
    if (d2 === 1 && w >= 4 && w <= 7) competence += 0.025;
    competence = borne(competence, 0, 1);

    // L'engagement, groupe par groupe : chacun le sien, vers une cible que le management fixe.
    const objectifsClairs = (d1 === 1 || d1 === 2) && w >= 2 ? 0.04 : 0;
    const mission = d4 === 0 && w >= 8 ? 0.05 : 0;
    const cibleA =
      0.75 + 0.6 * (confiance - 0.6) + 0.15 * (lien - 0.35) + objectifsClairs + mission;
    const cibleB = 0.62 + 0.3 * (confiance - 0.6) + 0.35 * (lien - 0.35) + objectifsClairs;
    const cibleC =
      0.45 +
      0.15 * (confiance - 0.6) +
      0.6 * (lien + soutien - 0.35) +
      0.4 * (competence - COMPETENCE_DEPART) +
      objectifsClairs;
    eA = borne(eA + 0.35 * (cibleA - eA), 0.05, 1);
    eB = borne(eB + 0.35 * (cibleB - eB), 0.05, 1);
    eC = borne(eC + 0.35 * (cibleC - eC), 0.05, 1);

    // Les comptes rendus : remplis, ils valent ce que valent leur contenu et leur lecteur.
    let cibleCR = [0.9, 0.6, 0.5, 0.45][d1 ?? 3]!;
    let cibleQualite = d1 === 0 && w >= 2 ? 0.3 : 0.5;
    let lecture = [0.35, 0.9, 0.5, 0.3][d1 ?? 3]!;
    if (w >= 6) {
      if (d3 === 0) [cibleCR, cibleQualite] = [0.95, 0.3];
      if (d3 === 1) {
        [cibleCR, cibleQualite] = [0.88, 0.9];
        lecture = d1 === 1 ? 1 : 0.6;
      }
      if (d3 === 2) [cibleCR, cibleQualite] = [0.75, 0.6];
    }
    if (w >= 2) {
      comptesRendus += 0.5 * (cibleCR - comptesRendus);
      qualite += 0.5 * (cibleQualite - qualite);
    }
    const opportunites = OPPORTUNITES * comptesRendus * qualite * lecture * activite;

    // Le temps passé à se justifier plutôt qu'à vendre.
    let administratif = 0.015;
    if (d1 === 0 && w >= 2) administratif += 0.02;
    if (w >= 6 && d3 === 0) administratif += 0.02;
    if (w >= 6 && d3 === 1) administratif -= 0.005;
    if (d6 === 0 && w >= 12) administratif += 0.03;

    // Qui est sur la route.
    const nA = AUTONOMES - (elodie && w >= 10 ? 1 : 0);
    let nB = CONFIRMES;
    for (const a of actifs) nB -= a.imprevu.effet.absents ?? 0;
    const nC = DEBUTANTS - (killian && w >= 8 ? 1 : 0);

    // Ce que chacun vend.
    let facteur = activite * (1 - administratif);
    for (const a of actifs) facteur *= a.imprevu.effet.marge ?? 1;
    // Une demi-journée de réunion par mois ; une journée pour l'atelier.
    if (d1 === 1 && (w === 4 || w === 8 || w === 12)) facteur *= 0.97;
    if (d5 === 0 && w === 10) facteur *= 0.94;
    // Se savoir suivi fait faire quelques visites de plus, le temps que l'effet s'use.
    const surveillance = d1 === 0 && w >= 2 && w <= 5 ? 1.05 - 0.01 * (w - 2) : 1;
    let parA = POTENTIEL.autonome * productivite(eA) * facteur;
    // Un jour par semaine en tournée avec un débutant : un peu moins de visites pour soi.
    if (d2 === 0 && w >= 4 && w <= 7) parA *= 1 - 0.06 * (2 / AUTONOMES);
    const parB = POTENTIEL.confirme * productivite(eB) * 0.85 * facteur * surveillance;
    let parC = POTENTIEL.debutant * productivite(eC) * (0.25 + competence) * facteur * surveillance;
    if (d2 === 2 && w >= 4 && w <= 7) parC *= 1.08;
    let marge = nA * parA + nB * parB + nC * parC;
    // Les clients d'un commercial parti : un tiers suit les collègues, le reste va ailleurs.
    if (elodie && w >= 10) marge += 0.35 * parA;
    if (killian && w >= 8) marge += 0.3 * parC;
    // La nouvelle gamme d'isolation par l'extérieur : ce que chacun en a compris.
    if (w >= 11) {
      let adoption = [0, 0, 0];
      if (d5 === 0) {
        // Un atelier entre pairs vaut ce que valent ceux qui l'animent.
        const animation = (elodie ? 0.75 : 1) * (eA >= 0.65 ? 1 : 0.8);
        adoption = [0.85, 0.8, 0.75].map((x) => x * animation);
      }
      if (d5 === 1) adoption = [0.4, 0.25, 0.1];
      if (d5 === 2) adoption = [0.9, 0.45, 0.15];
      if (d5 === 3) adoption = [0.45, 0.45, 0.45];
      marge += GAIN_ITE * (nA * adoption[0]! + nB * adoption[1]! + nC * adoption[2]!) * activite;
    }
    marge += opportunites;
    // Finir le trimestre.
    if (w >= 12) {
      if (d6 === 0) marge *= 1 + (0.03 * (nB * parB + nC * parC) - 0.04 * nA * parA) / marge;
      if (d6 === 1) marge *= 1.02 + 0.04 * lien;
      if (d6 === 2) marge *= (remise ? 1.16 : 1.05) * (0.23 / 0.26);
    }

    // Ce que la semaine coûte.
    if (d1 === 0 && w === 2) depense += COUTS.boitiers;
    if (d1 === 0 && w >= 2) depense += COUTS.abonnement;
    if (d1 === 1 && (w === 4 || w === 8 || w === 12)) depense += COUTS.reunion;
    if (d2 === 1 && w >= 4 && w <= 7) depense += COUTS.accompagnement;
    if (d3 === 2 && w >= 6) depense += COUTS.assistante;
    if (d4 === 1 && w >= 8) depense += COUTS.alignement;
    if (d5 === 0 && w === 10) depense += COUTS.atelier;
    if (d5 === 3 && w === 10) depense += COUTS.formateur;
    if (d5 === 2 && w === 13) depense += COUTS.prime;
    if (killian && w === 8) depense += COUTS.recrutementKillian;
    if (elodie && w === 10) depense += COUTS.recrutementElodie;
    for (const a of actifs) if (w === a.semaine) depense += a.imprevu.effet.cout ?? 0;
    depenses += depense;
    const contribution = marge - depense - (w === 1 ? perteEnquete : 0);
    cumul += contribution;

    // Les départs : Killian en fin de semaine 7, Ambre en fin de semaine 9.
    const rK = killian || w > 7 ? 0 : risqueKillian(eC);
    const rE =
      elodie || w > 9
        ? 0
        : Math.min(0.9, risqueElodie(eA, confiance) * (w >= 8 ? facteurElodie(chemin) : 1));
    if (w === 7 && h.uKillian < rK) killian = true;
    if (w === 9 && h.uElodie < rE) elodie = true;

    const n = nA + nB + nC;
    semaines.push({
      marge,
      ecart: parA / Math.max(1, parC),
      comptesRendus,
      engagement: (nA * eA + nB * eB + nC * eC) / n,
      risque: 1 - (1 - rK) * (1 - rE),
      contribution,
      cumul,
      lien,
      confiance,
      engagementAutonomes: eA,
      engagementDebutants: eC,
      competence,
      opportunites,
      presents: n,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const fin = pleines[SEMAINES - 1]!;
  return {
    semaines,
    objectif: cumul - BUDGET,
    margeNette: cumul,
    depenses,
    killianPart: killian,
    elodiePart: elodie,
    binomes,
    binomeVolontaire: volontaire,
    remiseSuivie: remise,
    effectifFinal: EFFECTIF - (killian ? 1 : 0) - (elodie ? 1 : 0),
    ecartFinal: fin.ecart,
    comptesRendusMoyens: pleines.reduce((s, x) => s + x.comptesRendus, 0) / SEMAINES,
    engagementFinal: fin.engagement,
    competenceFinale: fin.competence,
  };
}

/** Ce qui s'est passé pendant des semaines : binômes, départs, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    binomeReticent: t.binomes !== null && !t.binomeVolontaire && dans(4),
    killianPart: t.killianPart && dans(8),
    elodiePart: t.elodiePart && dans(10),
    elodieReste: !t.elodiePart && (chemin[D.elodie] === 0 || chemin[D.elodie] === 1) && dans(10),
    atelier: chemin[D.gamme] === 0 && dans(10) ? (t.elodiePart ? "sans-elodie" : "complet") : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEquipe {
  marge: number | null;
  ecart: number | null;
  comptesRendus: number | null;
  engagement: number | null;
  risque: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** Ce que le tableau de bord ne montre pas, mais que les messages lisent. */
  lien: number | null;
  confiance: number | null;
  engagementAutonomes: number | null;
  engagementDebutants: number | null;
  killianParti: number | null;
  elodiePartie: number | null;
}

const ecartDeDepart = () =>
  (POTENTIEL.autonome * productivite(ENGAGEMENT_DEPART.autonome)) /
  (POTENTIEL.debutant * productivite(ENGAGEMENT_DEPART.debutant) * (0.25 + COMPETENCE_DEPART));

/** La marge d'une semaine ordinaire avant le trimestre. */
export const MARGE_DE_DEPART = Math.round(
  (AUTONOMES * POTENTIEL.autonome * productivite(ENGAGEMENT_DEPART.autonome) +
    CONFIRMES * POTENTIEL.confirme * productivite(ENGAGEMENT_DEPART.confirme) * 0.85 +
    DEBUTANTS *
      POTENTIEL.debutant *
      productivite(ENGAGEMENT_DEPART.debutant) *
      (0.25 + COMPETENCE_DEPART)) *
    0.985 +
    OPPORTUNITES * COMPTES_RENDUS_DEPART * 0.5 * 0.3,
);

/** Ce que Benoît lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEquipe {
  if (semaine === 0) {
    return {
      marge: MARGE_DE_DEPART,
      ecart: ecartDeDepart(),
      comptesRendus: COMPTES_RENDUS_DEPART,
      engagement:
        (AUTONOMES * ENGAGEMENT_DEPART.autonome +
          CONFIRMES * ENGAGEMENT_DEPART.confirme +
          DEBUTANTS * ENGAGEMENT_DEPART.debutant) /
        EFFECTIF,
      risque:
        1 -
        (1 - risqueKillian(ENGAGEMENT_DEPART.debutant)) *
          (1 - risqueElodie(ENGAGEMENT_DEPART.autonome, CONFIANCE_DEPART)),
      cumul: 0,
      budgetADate: 0,
      lien: LIEN_DEPART,
      confiance: CONFIANCE_DEPART,
      engagementAutonomes: ENGAGEMENT_DEPART.autonome,
      engagementDebutants: ENGAGEMENT_DEPART.debutant,
      killianParti: 0,
      elodiePartie: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    marge: s.marge,
    ecart: s.ecart,
    comptesRendus: s.comptesRendus,
    engagement: s.engagement,
    risque: s.risque,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    lien: s.lien,
    confiance: s.confiance,
    engagementAutonomes: s.engagementAutonomes,
    engagementDebutants: s.engagementDebutants,
    killianParti: t.killianPart && semaine >= 8 ? 1 : 0,
    elodiePartie: t.elodiePart && semaine >= 10 ? 1 : 0,
  };
}
