/**
 * LE TRIMESTRE QUI DÉRAPE — le modèle de l'agence de Lyon.
 *
 * Treize semaines, trois clientèles (grands comptes, artisans fidèles,
 * nouveaux clients), six décisions, et quelques imprévus. Le modèle est pur et déterministe : une
 * même graine donne les mêmes tirages, QUELLES QUE SOIENT les décisions. C'est
 * ce qui permet au bilan de rejouer une décision sous le hasard exact que le
 * joueur a connu, puis sous trente autres, et de séparer ce qui relevait du
 * choix de ce qui relevait de la chance.
 *
 * Données fictives : ces chiffres servent l'épisode de démonstration, ils ne
 * décrivent aucune entreprise réelle.
 */

import {
  GRAINES_DU_BILAN,
  gauss,
  moyenne,
  mulberry32,
  quantile,
  rejouerAvec,
  type Rejeu,
} from "./commun";

export { GRAINES_DU_BILAN, moyenne, quantile, type Rejeu };

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
export const NEUTRE: Chemin = [3, 3, 3, 3, 2, 2];
/** Au-delà de deux jours d'enquête en semaine 1, chaque jour coûte une affaire. */
export const JOURS_SANS_PERTE = 2;
export const PERTE_PAR_JOUR = 6000;

/** Les six décisions, chacune par l'indice de l'option retenue. */
export type Chemin = readonly [number, number, number, number, number, number];

/** Les décisions, par leur place dans le chemin. */
export const D = {
  karim: 0,
  livraison: 1,
  equipe: 2,
  paiement: 3,
  delta: 4,
  fin: 5,
} as const;

/** L'intérimaire coûte 1 200 € par semaine, des semaines 6 à 10. */
export const COUT_INTERIM = 1200;
/** La prime exceptionnelle accordée à Julie, versée en fin de trimestre. */
export const PRIME = 3000;
/** Julie s'arrête quatre semaines, de la semaine 8 à la semaine 11. */
export const ARRET = { de: 8, a: 11 } as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS.
 *
 * Un trimestre réel n'est pas qu'un bruit de fond : il a ses accidents. Chaque
 * graine en tire un ou deux, à une semaine donnée, et ils frappent le
 * trimestre QUELLES QUE SOIENT les décisions — c'est ce qui les distingue des
 * conséquences. Le bilan les nomme, pour que le joueur voie la part du hasard
 * avec un visage plutôt qu'avec un écart-type.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Le nombre de semaines qu'il dure. */
  duree: number;
  effet: { devis?: Partial<Record<Segment, number>>; conv?: Partial<Record<Segment, number>> };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "rupture",
    titre: "Rupture de plaques de plâtre",
    de: "Dépôt régional",
    role: "Logistique",
    texte:
      "Rupture chez le fournisseur de plaques de plâtre : une semaine sans livraison sur la référence la plus vendue aux artisans.",
    duree: 1,
    effet: { conv: { fi: 0.85 } },
  },
  {
    id: "metropole",
    titre: "Le chantier de la Métropole",
    de: "Achats, Groupe Delta",
    role: "Grand compte",
    texte:
      "La Métropole lance la rénovation de trois groupes scolaires : nos équipes vous envoient une série de demandes de devis.",
    duree: 1,
    effet: { devis: { gc: 1.35 } },
  },
  {
    id: "intemperies",
    titre: "Intempéries",
    de: "Julie Roux",
    role: "Commerciale, secteur Est",
    texte: "Une semaine de pluie : la moitié des chantiers de mes artisans sont à l'arrêt.",
    duree: 1,
    effet: { devis: { fi: 0.8, nc: 0.8 } },
  },
  {
    id: "fermeture",
    titre: "Un concurrent ferme",
    de: "Thomas Petit",
    role: "Commercial, secteur Centre",
    texte:
      "Le petit négoce de Vénissieux a fermé : ses clients cherchent un fournisseur et nous appellent.",
    duree: 2,
    effet: { devis: { nc: 1.35 } },
  },
  {
    id: "logiciel",
    titre: "Panne du logiciel de devis",
    de: "Service informatique",
    role: "Siège",
    texte: "Le logiciel de devis est resté en panne trois jours : les devis sont partis en retard.",
    duree: 1,
    effet: { conv: { gc: 0.9, fi: 0.9, nc: 0.9 } },
  },
];

/** Un imprévu tiré pour une graine : lequel, et à quelle semaine il commence. */
export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export type Semaine = {
  ca: number;
  marge: number;
  transfo: number;
  /** Remises cumulées depuis le début du trimestre. */
  remises: number;
  dso: number;
};

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
  /** Julie s'est-elle arrêtée ? */
  arret: boolean;
  /** Intérimaire et prime : ce que la décision d'équipe a coûté. */
  couts: number;
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
  /** Le tirage qui décide si Julie s'arrête. */
  uJulie: number;
  imprevus: readonly ImprevuTire[];
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
  const u4 = r();
  const dso = 2 * gauss(r);
  // Tirés APRÈS les précédents : ajouter Julie et les imprévus n'a déplacé
  // aucun des tirages d'avant.
  const uJulie = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, u4, dso, uJulie, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Delta accepte une contre-proposition à 4 % un peu plus d'une fois sur deux. */
export const deltaAccepte = (graine: number) => hasard(graine).u4 < 0.55;
/** Une fois sur sept, Delta prend mal la contre-proposition et réduit ses commandes de moitié. */
export const deltaVexee = (graine: number) => hasard(graine).u4 >= 0.85;
/** Refusée, Delta réduit ses commandes trois fois sur dix. */
export const deltaReduit = (graine: number) => hasard(graine).u4 < 0.3;

/**
 * LE RISQUE QUE JULIE S'ARRÊTE.
 *
 * Il dépend de sa charge : elle en a beaucoup plus si elle a repris les
 * comptes de Karim. Lui retirer des comptes le divise par quatre ; un
 * intérimaire l'efface ; une prime n'y change rien — on ne paie pas une
 * surcharge, on la réduit.
 */
export function risqueDArret(chemin: Chemin): number {
  const base = chemin[D.karim] === 1 ? 0.45 : 0.2;
  const equipe = chemin[D.equipe];
  if (equipe === 0) return base / 4;
  if (equipe === 1) return 0;
  return base;
}
export const julieSArrete = (chemin: Chemin, graine: number) =>
  hasard(graine).uJulie < risqueDArret(chemin);

/**
 * Simule le trimestre.
 *
 * @param chemin les cinq décisions
 * @param graine le hasard
 * @param jours les jours d'enquête pris en semaine 1
 */
export function simuler(chemin: Chemin, graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, dEquipe, d3, d4, d5] = chemin;
  const arret = julieSArrete(chemin, graine);
  let couts = 0;
  const semaines: (Semaine | null)[] = [null];
  let remises = 0;
  const perteCA = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const dev = { gc: SEG.gc.devis * n.dg, fi: SEG.fi.devis * n.df, nc: SEG.nc.devis * n.dn };
    const cv = { gc: SEG.gc.conv, fi: SEG.fi.conv, nc: SEG.nc.conv };
    for (const { imprevu, semaine } of h.imprevus) {
      if (w < semaine || w >= semaine + imprevu.duree) continue;
      for (const [seg, k] of Object.entries(imprevu.effet.devis ?? {})) dev[seg as Segment] *= k;
      for (const [seg, k] of Object.entries(imprevu.effet.conv ?? {})) cv[seg as Segment] *= k;
    }
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
    // Julie, surchargée : ce que chaque réponse change, puis l'arrêt s'il tombe.
    if (w >= 6) {
      if (dEquipe === 0) {
        if (w <= 7) cv.fi *= 0.99;
        dev.nc *= 0.97;
      }
      if (dEquipe === 1 && w <= 10) {
        cv.fi *= 1.01;
        couts += COUT_INTERIM;
      }
      if (dEquipe === 2 && w <= 9) cv.fi *= 1.015;
    }
    if (arret && w >= ARRET.de && w <= ARRET.a) {
      cv.fi *= 0.8;
      if (d1 === 1) cv.gc *= 0.94;
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
      } else if ((d4 === 2 && h.u4 < 0.3) || (d4 === 1 && h.u4 >= 0.85)) {
        margeGC -= existant * 0.5 * (mg.gc - rem.gc);
        ca.gc -= existant * 0.5;
      }
    }
    remises += ca.gc * rem.gc + ca.fi * rem.fi + ca.nc * rem.nc;
    const caTot = ca.gc + ca.fi + ca.nc + caDelta;
    let margeTot = margeGC + ca.fi * (mg.fi - rem.fi) + ca.nc * (mg.nc - rem.nc) + margeDelta;
    if (dEquipe === 1 && w >= 6 && w <= 10) margeTot -= COUT_INTERIM;
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
  // La prime se paie en fin de trimestre.
  const prime = dEquipe === 2 ? PRIME : 0;
  pleines[SEMAINES - 1]!.marge -= prime;
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
    arret,
    couts: couts + prime,
  };
}

/** Rejoue chaque option d'une décision sous les trente mêmes tirages, les autres choix inchangés. */
export function rejouer(
  chemin: Chemin,
  decision: number,
  nbOptions: number,
  jours: number,
): Rejeu[] {
  return rejouerAvec(
    (c, g) => simuler(c as Chemin, g, jours).objectif,
    chemin,
    decision,
    nbOptions,
  );
}

/** Ce qui est arrivé pendant une fenêtre de semaines : les imprévus, et l'arrêt de Julie. */
export function evenements(
  chemin: Chemin,
  graine: number,
  de: number,
  a: number,
): { imprevus: ImprevuTire[]; arret: boolean } {
  return {
    imprevus: hasard(graine).imprevus.filter((i) => i.semaine >= de && i.semaine <= a),
    arret: julieSArrete(chemin, graine) && ARRET.de >= de && ARRET.de <= a,
  };
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
