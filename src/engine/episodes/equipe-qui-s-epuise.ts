/**
 * L'ÉQUIPE QUI S'ÉPUISE — le modèle du service client.
 *
 * Douze conseillers, une file de demandes, treize semaines, six décisions.
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA FILE S'ALIMENTE ELLE-MÊME. Au-delà de deux jours de délai, les
 *     clients relancent : chaque retard fabrique de nouvelles demandes, qui
 *     allongent le retard. Couper les relances soulage plus que n'importe
 *     quel effort supplémentaire.
 *   · LA FATIGUE SE PAIE PLUS TARD. Demander plus à l'équipe (heures
 *     supplémentaires, objectifs individuels, samedis) donne de la capacité
 *     tout de suite, et de la fatigue qui revient en absences, puis en départ.
 *   · LES TENSIONS NE SE RÉSORBENT PAS SEULES. Un conflit laissé à lui-même
 *     use l'équipe semaine après semaine.
 *
 * Le trimestre est jugé en euros : l'écart au budget variable du service,
 * pertes de clients et coûts de départ compris. Prendre soin de l'équipe n'y
 * est pas une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const EFFECTIF = 12;
/** Demandes traitées par conseiller présent et par semaine. */
export const PRODUCTIVITE = 100;
/** Demandes nouvelles par semaine, avant relances. */
export const DEMANDE = 940;
export const FILE_DEPART = 600;
export const DELAI_DEPART = 3.5;
export const FATIGUE_DEPART = 0.45;
export const OBJECTIF_DELAI = 2;
export const OBJECTIF_SATISFACTION = 0.85;
export const SEUIL_ABSENTEISME = 0.06;
/** Le budget variable du service : heures supplémentaires, intérim, recrutement, gestes commerciaux. */
export const BUDGET = 45000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux se paie en gestes commerciaux. */
export const PERTE_PAR_JOUR = 1500;
export const COUT_DEPART = 12000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  file: 0,
  mathieu: 1,
  conflit: 2,
  campagne: 3,
  teletravail: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 2, 3, 3, 3, 2] as const;

export const COUTS = {
  heuresSup: 2400,
  accuse: 800,
  cdi: 4000,
  interim: 1400,
  augmentation: 450,
  heuresSupCampagne: 2000,
  faq: 600,
  samedi: 3000,
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
  effet: { demande?: number; capacite?: number; absents?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "standard",
    titre: "Panne du standard téléphonique",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le standard est tombé deux jours : les appels ont basculé sur la messagerie, à traiter ensuite.",
    duree: 1,
    effet: { capacite: 0.85 },
  },
  {
    id: "transporteur",
    titre: "Grève chez le transporteur",
    de: "Logistique",
    role: "Dépôt régional",
    texte:
      "Grève chez le transporteur national : des centaines de livraisons en retard, et autant de clients qui écrivent.",
    duree: 1,
    effet: { demande: 1.3 },
  },
  {
    id: "grippe",
    titre: "Épidémie de grippe",
    de: "Ressources humaines",
    role: "Siège",
    texte: "La grippe touche l'agence : deux conseillers absents en moyenne pendant deux semaines.",
    duree: 2,
    effet: { absents: 1.5 },
  },
  {
    id: "logiciel",
    titre: "Mise à jour du logiciel client",
    de: "Service informatique",
    role: "Siège",
    texte:
      "La nouvelle version du logiciel ralentit chaque dossier le temps que l'équipe s'y fasse.",
    duree: 1,
    effet: { capacite: 0.9 },
  },
  {
    id: "rappel",
    titre: "Rappel d'un produit",
    de: "Qualité",
    role: "Siège",
    texte:
      "Un fournisseur rappelle une série de perceuses : les clients concernés veulent savoir quoi faire.",
    duree: 2,
    effet: { demande: 1.15 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  absence: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Mathieu accepte-t-il de rester ? */
  uMathieu: number;
  /** Sophie s'arrête-t-elle si le conflit dure ? */
  uSophie: number;
  /** Le marketing accepte-t-il de décaler la campagne ? */
  uCampagne: number;
  /** Inès part-elle si l'équipe est à bout ? */
  uInes: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 104729 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: Math.min(1.25, Math.max(0.8, 1 + 0.07 * gauss(r))),
      absence: Math.min(1.6, Math.max(0.5, 1 + 0.2 * gauss(r))),
    });
  }
  const uMathieu = r();
  const uSophie = r();
  const uCampagne = r();
  const uInes = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uMathieu, uSophie, uCampagne, uInes, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * MATHIEU RESTE-T-IL ?
 *
 * Il part « parce qu'ici on court tout le temps ». Une augmentation le
 * retient deux fois plus souvent si la file a été soulagée en semaine 1 :
 * l'argent ne compense pas une charge, il accompagne une charge qui baisse.
 */
export function chanceQueMathieuReste(chemin: readonly number[]): number {
  if (chemin[D.mathieu] !== 3) return 0;
  return chemin[D.file] === 1 ? 0.7 : 0.35;
}
export const mathieuReste = (chemin: readonly number[], graine: number) =>
  hasard(graine).uMathieu < chanceQueMathieuReste(chemin);

/** Laissé à lui-même, le conflit fait s'arrêter Sophie une fois sur trois. */
export const sophieSArrete = (chemin: readonly number[], graine: number) =>
  chemin[D.conflit] === 3 && hasard(graine).uSophie < 0.35;

/** Une fois sur deux, le marketing accepte de décaler la campagne de trois semaines. */
export const campagneDecalee = (chemin: readonly number[], graine: number) =>
  chemin[D.campagne] === 0 && hasard(graine).uCampagne < 0.5;

/** Le risque qu'Inès démissionne, lu sur la fatigue de l'équipe en fin de semaine 9. */
export const risqueDeDepart = (fatigue: number) =>
  Math.min(0.85, Math.max(0, (fatigue - 0.5) * 2.5));

export type Semaine = {
  /** Délai moyen de réponse, en jours ouvrés. */
  delai: number;
  satisfaction: number;
  absenteisme: number;
  /** Demandes en attente en fin de semaine. */
  file: number;
  /** Dépenses variables cumulées depuis le début du trimestre. */
  depenses: number;
  /** Ce que la semaine a coûté : dépenses, gestes commerciaux, clients perdus, départs. */
  cout: number;
  fatigue: number;
  presents: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget variable, pertes et départs compris : positif, le service est sous le budget. */
  objectif: number;
  depenses: number;
  pertes: number;
  mathieuReste: boolean;
  sophieArret: boolean;
  inesPart: boolean;
  campagneDecalee: boolean;
  effectifFinal: number;
  satisfactionMoyenne: number;
  absenteismeMoyen: number;
  delaiFinal: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const reste = mathieuReste(chemin, graine);
  const sophie = sophieSArrete(chemin, graine);
  const decalee = campagneDecalee(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let file = FILE_DEPART;
  let delai = DELAI_DEPART;
  let fatigue = FATIGUE_DEPART;
  let depenses = 0;
  let pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let ines = false;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? pertes : 0;

    // Qui est là.
    let presents = EFFECTIF;
    let absentsLongs = 0;
    if (w <= 6) absentsLongs += 1; // Léa, en arrêt jusqu'à la semaine 6.
    if (w >= 6 && !reste) presents -= 1; // Mathieu parti.
    if (d2 === 0 && w >= 9) presents += w === 9 ? 0.6 : 0.85; // La recrue en CDI, qui apprend.
    if (d2 === 1 && w >= 6) presents += 0.8; // L'intérimaire.
    if (sophie && w >= 8 && w <= 10) absentsLongs += 1;
    if (ines && w >= 10) presents -= 1;
    for (const a of actifs) absentsLongs += a.imprevu.effet.absents ?? 0;
    presents -= absentsLongs;
    const tauxAbsence = (0.03 + 0.12 * fatigue) * n.absence;
    const nominal = presents;
    presents *= 1 - tauxAbsence;

    // Ce que chacun abat.
    let efficacite = 1;
    if (d1 === 0 && w >= 2 && w <= 5) efficacite *= 1.12;
    if (d1 === 1 && w === 2) efficacite *= 0.97;
    if (d1 === 2 && w >= 2) efficacite *= 1.05;
    if (d3 === 1) efficacite *= w <= 7 && w >= 6 ? 0.97 : w >= 8 ? 1.03 : 1;
    if (d3 === 2 && w >= 6) efficacite *= 0.97;
    if (d4 === 1 && w >= 9 && w <= 11) efficacite *= 1.1;
    if (d5 === 0 && w >= 10) efficacite *= 1.02;
    if (d5 === 1 && w >= 10) efficacite *= 0.96;
    if (d6 === 0 && w === 12) efficacite *= 1.15;
    for (const a of actifs) efficacite *= a.imprevu.effet.capacite ?? 1;
    const capacite = presents * PRODUCTIVITE * efficacite;

    // Ce qui arrive : les demandes nouvelles, et les relances que le retard fabrique.
    let entrantes = DEMANDE * n.demande;
    for (const a of actifs) entrantes *= a.imprevu.effet.demande ?? 1;
    const enCampagne = decalee ? w >= 12 : w >= 9 && w <= 11;
    if (enCampagne) entrantes *= d4 === 2 ? 1.06 : 1.25;
    let relances = 0.14 * borne(delai - OBJECTIF_DELAI, 0, 4) * DEMANDE;
    if (d1 === 1 && w >= 2) relances *= 0.4;
    if (d6 === 1 && w >= 12) relances *= 0.5;
    const demande = entrantes + relances;

    const traitees = Math.min(capacite, file + demande);
    // Au-delà de trois jours, des clients renoncent : ils ne relancent plus, ils partent.
    const abandons = file * Math.min(0.3, 0.04 * Math.max(0, delai - 3));
    file = file + demande - traitees - abandons;
    delai = file / (capacite / 5) + 0.5;
    let satisfaction = borne(0.93 - 0.05 * Math.max(0, delai - 1.5), 0.4, 0.95);
    if (d6 === 1 && w >= 12) satisfaction = Math.min(0.95, satisfaction + 0.03);

    // La fatigue : la charge, la pression, et ce qui la soulage.
    const charge = demande / Math.max(1, nominal * PRODUCTIVITE);
    fatigue += 0.06 * (charge - 1) - 0.015;
    if (d1 === 0 && w >= 2 && w <= 5) fatigue += 0.05;
    if (d1 === 2 && w >= 2) fatigue += 0.03;
    if (d2 === 2 && w >= 6) fatigue += 0.02;
    if (d3 === 0 && w === 6) fatigue -= 0.04;
    if (d3 === 1 && w >= 8) fatigue -= 0.01;
    if (d3 === 2 && w >= 6) fatigue += 0.01;
    if (d3 === 3 && w >= 6) fatigue += 0.03;
    if (d4 === 1 && w >= 9 && w <= 11) fatigue += 0.02;
    if ((d5 === 0 || d5 === 1) && w >= 10) fatigue -= 0.03;
    if (d5 === 2 && w >= 10) fatigue += 0.02;
    if (d5 === 3 && w >= 10) fatigue += 0.01;
    if (d6 === 0 && w === 12) fatigue += 0.05;
    fatigue = borne(fatigue, 0, 1);
    // À bout, Inès démissionne : la décision se lit en fin de semaine 9.
    if (w === 9 && h.uInes < risqueDeDepart(fatigue)) ines = true;

    // Ce que la semaine coûte.
    let depense = 0;
    if (d1 === 0 && w >= 2 && w <= 5) depense += COUTS.heuresSup;
    if (d1 === 1 && w === 2) depense += COUTS.accuse;
    if (d2 === 0 && w === 4) depense += COUTS.cdi;
    if (d2 === 1 && w >= 6) depense += COUTS.interim;
    if (d2 === 3 && w === 4) depense += COUTS.augmentation;
    if (d4 === 1 && w >= 9 && w <= 11) depense += COUTS.heuresSupCampagne;
    if (d4 === 2 && w === 8) depense += COUTS.faq;
    if (d6 === 0 && w === 12) depense += COUTS.samedi;
    depenses += depense;
    const gestes = delai > 3 ? 500 * (delai - 3) : 0;
    const clientsPerdus =
      Math.max(0, OBJECTIF_SATISFACTION - satisfaction) * 100 * 150 + abandons * 4;
    const depart = ines && w === 10 ? COUT_DEPART : 0;
    pertes += gestes + clientsPerdus + depart;
    cout += depense + gestes + clientsPerdus + depart;

    semaines.push({
      delai,
      satisfaction,
      absenteisme: (absentsLongs + nominal * tauxAbsence) / EFFECTIF,
      file,
      depenses,
      cout,
      fatigue,
      presents,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const effectifFinal =
    EFFECTIF - (reste ? 0 : 1) - (ines ? 1 : 0) + (d2 === 0 ? 1 : 0) + (d2 === 1 ? 1 : 0);
  return {
    semaines,
    objectif: BUDGET - depenses - pertes,
    depenses,
    pertes,
    mathieuReste: reste,
    sophieArret: sophie,
    inesPart: ines,
    campagneDecalee: decalee,
    effectifFinal,
    satisfactionMoyenne: pleines.reduce((s, x) => s + x.satisfaction, 0) / SEMAINES,
    absenteismeMoyen: pleines.reduce((s, x) => s + x.absenteisme, 0) / SEMAINES,
    delaiFinal: pleines[SEMAINES - 1]!.delai,
  };
}

/** Ce qui s'est passé pendant des semaines : départs, arrêts, campagne, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    mathieuPart: !t.mathieuReste && dans(6),
    mathieuReste: t.mathieuReste && dans(4),
    sophieArret: t.sophieArret && dans(8),
    inesPart: t.inesPart && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureEquipe {
  delai: number | null;
  satisfaction: number | null;
  absenteisme: number | null;
  file: number | null;
  depenses: number | null;
  budgetADate: number | null;
}

/** Ce que Nadia lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureEquipe {
  if (semaine === 0) {
    return {
      delai: DELAI_DEPART,
      satisfaction: 0.83,
      absenteisme: 0.11,
      file: FILE_DEPART,
      depenses: 0,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    delai: s.delai,
    satisfaction: s.satisfaction,
    absenteisme: s.absenteisme,
    file: s.file,
    depenses: s.depenses,
    budgetADate: (BUDGET * semaine) / SEMAINES,
  };
}
