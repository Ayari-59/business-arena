/**
 * LE TRIMESTRE QUI DÉRAPE — le modèle de l'agence de Lyon.
 *
 * Treize semaines, trois clientèles (grands comptes, artisans fidèles,
 * nouveaux clients), cinq décisions. Le modèle est pur et déterministe : une
 * même graine donne les mêmes tirages, QUELLES QUE SOIENT les décisions. C'est
 * ce qui permet au bilan de rejouer une décision sous le hasard exact que le
 * joueur a connu, puis sous trente autres, et de séparer ce qui relevait du
 * choix de ce qui relevait de la chance.
 *
 * Données fictives : ces chiffres servent l'épisode de démonstration, ils ne
 * décrivent aucune entreprise réelle.
 */

type Segment = "gc" | "fi" | "nc";

const SEG: Record<Segment, { devis: number; conv: number; marge: number }> = {
  gc: { devis: 120000, conv: 0.3, marge: 0.26 },
  fi: { devis: 90000, conv: 0.55, marge: 0.36 },
  nc: { devis: 30000, conv: 0.2, marge: 0.34 },
};

export const SEMAINES = 13;
export const OBJECTIF_CA = 1200000;
export const OBJECTIF_MARGE = 0.3;
export const BUDGET_REMISES = 40000;
export const DSO_DEPART = 52;
export const DSO_SEUIL = 55;
export const DSO_PENALITE = 1500;
/** Le taux de transformation de la semaine qui précède l'épisode. */
export const TRANSFO_AVANT = 0.336;
/** Les choix que le tableau de bord suppose tant qu'une décision n'est pas prise : ne rien changer. */
export const NEUTRE: Chemin = [3, 3, 3, 2, 2];
/** Au-delà de deux jours d'enquête en semaine 1, chaque jour coûte une affaire. */
export const JOURS_SANS_PERTE = 2;
export const PERTE_PAR_JOUR = 6000;

/** Les cinq décisions, chacune par l'indice de l'option retenue. */
export type Chemin = readonly [number, number, number, number, number];

export interface Semaine {
  ca: number;
  marge: number;
  transfo: number;
  /** Remises cumulées depuis le début du trimestre. */
  remises: number;
  dso: number;
}

export interface Trimestre {
  /** Indexées de 1 à 13 ; l'indice 0 est vide. */
  semaines: readonly (Semaine | null)[];
  ca: number;
  marge: number;
  dsoFin: number;
  penalite: number;
  /** Ce sur quoi la direction juge le trimestre : la marge moins la pénalité de délai. */
  objectif: number;
  remises: number;
}

function mulberry32(graine: number) {
  let a = graine;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = r();
  while (v === 0) v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const borne = (x: number) => Math.min(1.4, Math.max(0.6, x));

interface Bruit {
  dg: number;
  df: number;
  dn: number;
  cg: number;
  cf: number;
  cn: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le tirage qui décide de la réponse de Delta en semaine 9. */
  u4: number;
  dso: number;
}

const tirages = new Map<number, Hasard>();

/** Les tirages d'une graine, calculés une fois : le bilan en rejoue des centaines. */
export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 7919 + 13);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      dg: borne(1 + 0.1 * gauss(r)),
      df: borne(1 + 0.1 * gauss(r)),
      dn: borne(1 + 0.12 * gauss(r)),
      cg: borne(1 + 0.06 * gauss(r)),
      cf: borne(1 + 0.06 * gauss(r)),
      cn: borne(1 + 0.08 * gauss(r)),
    });
  }
  const h = { semaines, u4: r(), dso: 2 * gauss(r) };
  tirages.set(graine, h);
  return h;
}

/** Delta accepte une contre-proposition à 4 % un peu plus d'une fois sur deux. */
export const deltaAccepte = (graine: number) => hasard(graine).u4 < 0.55;
/** Refusée, Delta réduit ses commandes trois fois sur dix. */
export const deltaReduit = (graine: number) => hasard(graine).u4 < 0.3;

/**
 * Simule le trimestre.
 *
 * @param chemin les cinq décisions
 * @param graine le hasard
 * @param jours les jours d'enquête pris en semaine 1
 */
export function simuler(chemin: Chemin, graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5] = chemin;
  const semaines: (Semaine | null)[] = [null];
  let remises = 0;
  const perteCA = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const dev = { gc: SEG.gc.devis * n.dg, fi: SEG.fi.devis * n.df, nc: SEG.nc.devis * n.dn };
    const cv = { gc: SEG.gc.conv, fi: SEG.fi.conv, nc: SEG.nc.conv };
    const mg = { gc: SEG.gc.marge, fi: SEG.fi.marge, nc: SEG.nc.marge };
    const rem = { gc: 0, fi: 0, nc: 0 };
    // Karim est absent jusqu'à la semaine 9, sauf si son portefeuille est réaffecté.
    const karimSuivi = w >= 10 || (d1 === 1 && w >= 2);
    if (!karimSuivi) {
      cv.gc *= 0.94;
      cv.fi *= 0.925;
    }
    // Un concurrent livre en 24 h ; l'agence en 72 h.
    if (d2 === 0 && w >= 5) {
      mg.gc -= 0.01;
      mg.fi -= 0.01;
    } else if (d2 === 1 && w >= 5) {
      cv.gc *= 0.93;
      cv.fi *= 0.985;
    } else {
      cv.gc *= 0.93;
      cv.fi *= 0.94;
    }
    if (w >= 2) {
      if (d1 === 0) {
        cv.gc *= 1.05;
        rem.gc += 0.05;
      }
      if (d1 === 1 && w <= 3) cv.fi *= 0.98;
      if (d1 === 2) {
        dev.nc *= 1.4;
        cv.fi *= 0.97;
      }
    }
    if (w >= 5 && d2 === 2) {
      cv.gc *= 1.03;
      cv.fi *= 1.03;
      rem.gc += 0.03;
      rem.fi += 0.03;
    }
    if (w >= 8) {
      if (d3 === 0) cv.fi *= 0.985;
      if (d3 === 1) mg.gc -= 0.012;
      if (d3 === 2) cv.gc *= 0.88;
    }
    if (w >= 12) {
      if (d5 === 0) {
        cv.gc *= 1.12;
        cv.fi *= 1.12;
        cv.nc *= 1.12;
        rem.gc += 0.05;
        rem.fi += 0.05;
        rem.nc += 0.05;
      }
      if (d5 === 1) cv.fi *= 1.06;
    }
    const ca = {
      gc: dev.gc * cv.gc * n.cg,
      fi: dev.fi * cv.fi * n.cf,
      nc: dev.nc * cv.nc * n.cn,
    };
    if (w === 1) ca.gc = Math.max(0, ca.gc - perteCA);
    let margeGC = ca.gc * (mg.gc - rem.gc);
    // Groupe Delta : 20 % du chiffre des grands comptes.
    let caDelta = 0;
    let margeDelta = 0;
    if (w >= 10) {
      const existant = ca.gc * 0.2;
      if (d4 === 0) {
        caDelta = 10000;
        margeDelta = 10000 * (SEG.gc.marge - 0.08);
        margeGC -= existant * 0.08;
        remises += existant * 0.08 + 10000 * 0.08;
      } else if (d4 === 1 && h.u4 < 0.55) {
        caDelta = 10000;
        margeDelta = 10000 * (SEG.gc.marge - 0.04);
        margeGC -= existant * 0.04;
        remises += existant * 0.04 + 10000 * 0.04;
      } else if (d4 === 2 && h.u4 < 0.3) {
        margeGC -= existant * 0.5 * (mg.gc - rem.gc);
        ca.gc -= existant * 0.5;
      }
    }
    remises += ca.gc * rem.gc + ca.fi * rem.fi + ca.nc * rem.nc;
    const caTot = ca.gc + ca.fi + ca.nc + caDelta;
    const margeTot = margeGC + ca.fi * (mg.fi - rem.fi) + ca.nc * (mg.nc - rem.nc) + margeDelta;
    const devisTot = dev.gc + dev.fi + dev.nc;
    const transfo = (ca.gc + ca.fi + ca.nc) / devisTot;
    semaines.push({ ca: caTot, marge: margeTot, transfo, remises, dso: DSO_DEPART });
  }
  // Le délai de paiement dérive de 18 jours si rien n'est fait.
  const correction = [-14, -22, -16, 0][d3] ?? 0;
  const dsoFin = DSO_DEPART + 18 + correction + h.dso;
  const dsoA = (w: number) =>
    w <= 4
      ? DSO_DEPART
      : w <= 7
        ? DSO_DEPART + (18 * (w - 4)) / 9
        : DSO_DEPART + (18 * (w - 4)) / 9 + ((dsoFin - 70) * (w - 7)) / 6;
  for (let w = 1; w <= SEMAINES; w += 1) semaines[w]!.dso = dsoA(w);
  const pleines = semaines.slice(1) as Semaine[];
  const ca = pleines.reduce((s, x) => s + x.ca, 0);
  const marge = pleines.reduce((s, x) => s + x.marge, 0);
  const penalite = DSO_PENALITE * Math.max(0, dsoFin - DSO_SEUIL);
  return {
    semaines,
    ca,
    marge,
    dsoFin,
    penalite,
    objectif: marge - penalite,
    remises: pleines[SEMAINES - 1]!.remises,
  };
}

/** Les trente tirages sous lesquels le bilan rejoue chaque décision. */
export const GRAINES_DU_BILAN = Array.from({ length: 30 }, (_, i) => i + 1);

export const moyenne = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
export const quantile = (xs: readonly number[], q: number) => {
  const tries = [...xs].sort((a, b) => a - b);
  return tries[Math.floor(q * (tries.length - 1))]!;
};

export interface Rejeu {
  option: number;
  /** Le résultat moyen sur les trente tirages. */
  attendu: number;
  /** Le résultat dans les 10 % de tirages les moins favorables. */
  p10: number;
}

/** Rejoue chaque option d'une décision sous les trente mêmes tirages, les autres choix inchangés. */
export function rejouer(
  chemin: Chemin,
  decision: number,
  nbOptions: number,
  jours: number,
): Rejeu[] {
  return Array.from({ length: nbOptions }, (_, option) => {
    const autre = [...chemin] as [number, number, number, number, number];
    autre[decision] = option;
    const valeurs = GRAINES_DU_BILAN.map((g) => simuler(autre, g, jours).objectif);
    return { option, attendu: moyenne(valeurs), p10: quantile(valeurs, 0.1) };
  });
}

/** La marge d'une fenêtre de semaines, et la pénalité de délai quand la fenêtre la porte. */
export function fenetre(t: Trimestre, de: number, a: number, avecDso: boolean): number {
  let m = 0;
  for (let w = de; w <= a; w += 1) m += t.semaines[w]!.marge;
  return avecDso ? m - t.penalite : m;
}

export interface TableauDeBord {
  ca: number;
  /** L'objectif de chiffre d'affaires à date, au prorata des semaines écoulées. */
  cible: number;
  /** Le taux de marge depuis le début du trimestre ; `null` avant la première semaine. */
  marge: number | null;
  transfo: number;
  dso: number;
  remises: number;
}

/**
 * Ce que Claire lit à la fin d'une semaine. Les décisions pas encore prises
 * comptent comme « ne rien changer » : elles ne pèsent sur aucune semaine
 * déjà écoulée, puisque chacune n'agit qu'après sa date.
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): TableauDeBord {
  if (semaine === 0) {
    return { ca: 0, cible: 0, marge: null, transfo: TRANSFO_AVANT, dso: DSO_DEPART, remises: 0 };
  }
  const t = simuler(cheminComplet(decisions), graine, jours);
  const ecoulees = t.semaines.slice(1, semaine + 1) as Semaine[];
  const ca = ecoulees.reduce((s, x) => s + x.ca, 0);
  const marge = ecoulees.reduce((s, x) => s + x.marge, 0);
  const derniere = t.semaines[semaine]!;
  return {
    ca,
    cible: (OBJECTIF_CA * semaine) / SEMAINES,
    marge: marge / ca,
    transfo: derniere.transfo,
    dso: derniere.dso,
    remises: derniere.remises,
  };
}

/** Complète les décisions prises par « ne rien changer ». */
export function cheminComplet(decisions: readonly number[]): Chemin {
  return NEUTRE.map((n, i) => decisions[i] ?? n) as unknown as Chemin;
}
