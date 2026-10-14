/**
 * LA RÉORGANISATION QUI COINCE — le modèle de la région commerciale.
 *
 * Quatorze commerciaux, quatre agences, une nouvelle organisation à mettre en
 * place : on ne vend plus par agence mais par type de clients (grands comptes
 * d'un côté, artisans de l'autre), avec un outil de suivi partagé. Treize
 * semaines, six décisions. Trois mécanismes font l'épisode, et le joueur doit
 * les découvrir :
 *
 *   · LA COURBE DU CHANGEMENT. Chaque portefeuille qui change de mains coûte
 *     d'abord du chiffre : le client perd son interlocuteur, le commercial
 *     apprend ses nouveaux clients. Le creux est d'autant plus profond que
 *     l'équipe n'y croit pas (la passation est bâclée) et que tout bascule en
 *     même temps. Ensuite seulement vient le gain, et il n'est réel que si la
 *     nouvelle organisation est vraiment utilisée.
 *   · L'ADHÉSION SE CONSTRUIT, ELLE NE SE DÉCRÈTE PAS. L'écoute, un pilote
 *     réussi avec des volontaires, un influent associé font monter
 *     l'adhésion ; l'injonction la fait baisser, et nourrit le ressentiment
 *     des deux anciens, qui freinent en silence et finissent par partir. Les
 *     résultats visibles entretiennent l'adhésion, le creux l'entame.
 *   · LE CONTRÔLE FABRIQUE DES SAISIES, PAS DE L'USAGE. Rendre la saisie
 *     obligatoire fait monter le taux de saisie de l'outil, pas l'usage réel :
 *     des fiches vides, remplies le vendredi soir. L'usage réel suit l'utilité
 *     de l'outil et l'adhésion de l'équipe, et c'est lui qui fait le gain.
 *
 * Le trimestre est jugé en euros : l'écart au budget de marge de la région,
 * coûts du projet et départs compris, plus ce que l'organisation laissée en
 * semaine 13 rapporte (ou coûte encore) sur les huit semaines suivantes.
 * Imposer vite et céder ne sont pas des postures : ce sont des calculs.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const COMMERCIAUX = 14;
/** Le chiffre d'affaires hebdomadaire de la région quand l'organisation tourne sans heurt. */
export const CA_BASE = 420000;
export const TAUX_MARGE = 0.25;
/** Le chiffre de la semaine de l'annonce. */
export const CA_DEPART = 404000;
/** La marge budgétée du trimestre, nette des coûts du projet. */
export const BUDGET = 1330000;
export const ADHESION_DEPART = 0.38;
export const USAGE_DEPART = 0.12;
export const SAISIES_DEPART = 0.16;
/** Le ressentiment des deux anciens, Patrick et Sylvie, au lendemain de l'annonce. */
export const RESSENTIMENT_DEPART = 0.7;
/** Ce que pèsent, chaque semaine, les portefeuilles des deux anciens, et celui de Patrick seul. */
export const PORTEFEUILLE_ANCIENS = 76000;
export const PORTEFEUILLE_PATRICK = 40000;
/** La part de ses clients qui suit Patrick s'il part chez un concurrent. */
export const CLIENTS_QUI_SUIVENT = 0.35;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux laisse la rumeur courir : une affaire perdue. */
export const PERTE_PAR_JOUR = 3000;
export const COUT_DEPART = 15000;
/** Les semaines du trimestre suivant que la direction compte dans le bilan du projet. */
export const SUITE = 8;
/** Le gain de la nouvelle organisation, en part du chiffre, une fois mûre et pleinement utilisée. */
export const GAIN_MAX = 0.08;
export const OBJECTIF_ADHESION = 0.6;
export const OBJECTIF_USAGE = 0.6;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  annonce: 0,
  bascule: 1,
  outil: 2,
  patrick: 3,
  generalisation: 4,
  fin: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

export const COUTS = {
  /** La formation d'un portefeuille qui bascule, rapportée à toute l'équipe. */
  formation: 7000,
  pleniere: 2500,
  pilote: 3000,
  simplification: 6000,
  formationOutil: 5000,
  referent: 1500,
  binomes: 2000,
  mesure: 1000,
  challenge: 6000,
} as const;

/** Le creux d'un portefeuille qui bascule, semaine après semaine : d'abord la chute, puis la remontée. */
export const PROFIL_DU_CREUX = [0.6, 0.9, 0.75, 0.5, 0.3, 0.15, 0.05] as const;

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
  effet: { ca?: number; usage?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "intemperies",
    titre: "Intempéries sur les chantiers",
    de: "Agence de Villefranche",
    role: "Comptoir",
    texte:
      "Une semaine de pluie et de gel : les chantiers sont à l'arrêt, les artisans ne commandent plus que l'indispensable.",
    duree: 1,
    effet: { ca: 0.86 },
  },
  {
    id: "concurrent",
    titre: "Un concurrent casse ses prix",
    de: "Direction commerciale",
    role: "Siège",
    texte:
      "Un négociant concurrent lance −15 % sur l'outillage pendant deux semaines. Quelques artisans en profitent.",
    duree: 2,
    effet: { ca: 0.95 },
  },
  {
    id: "panne",
    titre: "Panne de l'outil de suivi",
    de: "Service informatique",
    role: "Siège",
    texte:
      "L'outil de suivi est resté inaccessible trois jours : les commerciaux ont repris leurs carnets, et certains y sont restés.",
    duree: 1,
    effet: { usage: 0.8 },
  },
  {
    id: "chantier",
    titre: "Un grand chantier public",
    de: "Direction commerciale",
    role: "Siège",
    texte:
      "Un client grands comptes remporte la rénovation d'un groupe scolaire à Bron : deux semaines de grosses commandes.",
    duree: 2,
    effet: { ca: 1.07 },
  },
  {
    id: "accident",
    titre: "Un commercial accidenté",
    de: "Ressources humaines",
    role: "Siège",
    texte:
      "Kevin Morin a eu un accident de la route en tournée. Rien de grave, mais trois semaines d'arrêt : ses clients attendent.",
    duree: 3,
    effet: { ca: 0.97 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit du chiffre d'affaires, semaine par semaine. */
  semaines: readonly (number | null)[];
  /** Le pilote réussit-il ? */
  uPilote: number;
  /** Patrick accepte-t-il le rôle qu'on lui propose ? */
  uPatrick: number;
  /** Patrick part-il, si son ressentiment est trop fort ? */
  uDepart: number;
  /** L'éditeur livre-t-il l'outil simplifié à temps ? */
  uLivraison: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 3021377 + 53);
  const semaines: (number | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push(Math.min(1.08, Math.max(0.92, 1 + 0.03 * gauss(r))));
  }
  const uPilote = r();
  const uPatrick = r();
  const uDepart = r();
  const uLivraison = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uPilote, uPatrick, uDepart, uLivraison, imprevus };
  tirages.set(graine, h);
  return h;
}

/**
 * LE PILOTE RÉUSSIT-IL ?
 *
 * Quatre volontaires de Villeurbanne basculent en semaine 4. Le pilote réussit
 * bien plus souvent quand on a écouté l'équipe en semaine 1 : les objections
 * entendues (garder ses artisans le temps de les présenter, une fiche courte)
 * sont celles que le pilote règle, et Sylvie s'y porte volontaire.
 */
export function chanceQueLePiloteReussisse(chemin: readonly number[]): number {
  if (chemin[D.bascule] !== 1) return 0;
  return chemin[D.annonce] === 1 ? 0.8 : chemin[D.annonce] === 2 ? 0.55 : 0.45;
}
export const piloteReussi = (chemin: readonly number[], graine: number) =>
  hasard(graine).uPilote < chanceQueLePiloteReussisse(chemin);

/**
 * PATRICK ACCEPTE-T-IL D'ÊTRE RÉFÉRENT GRANDS COMPTES ?
 *
 * Un influent qu'on n'a jamais écouté prend le rôle qu'on lui tend pour un
 * piège ; celui qu'on a reçu en semaine 1 y voit une reconnaissance. Un pilote
 * réussi achève de le convaincre.
 */
export function chanceQuePatrickAccepte(chemin: readonly number[], graine: number): number {
  if (chemin[D.patrick] !== 0) return 0;
  const base = chemin[D.annonce] === 1 ? 0.75 : 0.35;
  return base + (piloteReussi(chemin, graine) ? 0.1 : 0);
}
export const patrickAccepte = (chemin: readonly number[], graine: number) =>
  hasard(graine).uPatrick < chanceQuePatrickAccepte(chemin, graine);

/** L'éditeur livre l'application simplifiée en semaine 7 trois fois sur cinq ; sinon, en semaine 10. */
export const livraisonALHeure = (graine: number) => hasard(graine).uLivraison < 0.6;

/** Le risque que Patrick parte chez un concurrent, lu sur le ressentiment en fin de semaine 9. */
export const risqueDeDepart = (ressentiment: number) =>
  Math.min(0.85, Math.max(0, (ressentiment - 0.3) * 1.4));

export type Semaine = {
  /** Chiffre d'affaires de la semaine. */
  ca: number;
  /** Marge commerciale de la semaine. */
  marge: number;
  /** Ce que la semaine a coûté au projet : formations, outil, primes, départ, enquête. */
  cout: number;
  /** Marge nette des coûts cumulée, moins le budget à date. */
  ecart: number;
  adhesion: number;
  /** Part de l'activité réellement suivie dans l'outil (fiches utiles). */
  usage: number;
  /** Taux de saisie que l'outil affiche, fiches vides comprises. */
  saisies: number;
  /** Part des portefeuilles passés dans la nouvelle organisation. */
  deploiement: number;
  /** Ce que la transition coûte cette semaine, en part du chiffre. */
  creux: number;
  /** Ce que la nouvelle organisation rapporte cette semaine, en part du chiffre. */
  gain: number;
  ressentiment: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge, coûts du projet et départs compris, plus la valeur laissée : positif, la région fait mieux que le budget. */
  objectif: number;
  marge: number;
  couts: number;
  /** Ce que l'organisation laissée en semaine 13 rapporte, ou coûte, sur les huit semaines suivantes. */
  valeurLaissee: number;
  /** `null` : pas de pilote. */
  piloteReussi: boolean | null;
  /** `null` : on ne lui a rien proposé. */
  patrickAccepte: boolean | null;
  patrickPart: boolean;
  /** La semaine où l'outil simplifié arrive ; `null` : pas de simplification. */
  livraison: number | null;
  adhesionFinale: number;
  usageFinal: number;
  saisiesFinales: number;
  deploiementFinal: number;
  /** La pire semaine, rapportée au chiffre de base. */
  pireSemaine: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

interface Transfert {
  semaine: number;
  part: number;
  /** La part du chiffre que ce portefeuille perd au plus creux, par unité transférée. */
  profondeur: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const pilote = d2 === 1 ? piloteReussi(chemin, graine) : null;
  const accepte = d4 === 0 ? patrickAccepte(chemin, graine) : null;
  const livraison = d3 === 1 ? (livraisonALHeure(graine) ? 7 : 10) : null;
  const exempte = d4 === 2;
  const plafond = exempte ? 0.9 : 1;

  const semaines: (Semaine | null)[] = [null];
  const transferts: Transfert[] = [];
  let A = ADHESION_DEPART;
  let U = USAGE_DEPART;
  let R = RESSENTIMENT_DEPART;
  let marge = 0;
  const enquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let couts = 0;
  let ecart = 0;
  let patrickPart = false;
  let valeurLaissee = 0;
  let pire = Infinity;

  const deploye = () => transferts.reduce((s, t) => s + t.part, 0);
  /** Un portefeuille qui bascule : le creux qu'il fera dépend de l'adhésion au moment de la passation. */
  const basculer = (w: number, part: number, facteur: number) => {
    if (part <= 1e-9) return 0;
    transferts.push({ semaine: w, part, profondeur: (0.04 + 0.12 * (1 - A)) * facteur });
    return COUTS.formation * part;
  };
  // Les nouveaux basculent en binôme avec ceux qui ont déjà l'expérience : un pilote réussi en fait des parrains.
  const binome = pilote === true ? 0.65 : d2 === 1 || d2 === 2 ? 0.8 : 1;
  // Référent, Patrick présente lui-même ses clients à leurs nouveaux interlocuteurs.
  const passation = accepte ? 0.8 : 1;

  for (let w = 1; w <= SEMAINES + SUITE; w += 1) {
    const suite = w > SEMAINES;
    const actifs = suite
      ? []
      : h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? enquete : 0;

    if (!suite) {
      // Ce que les décisions font, au début de la semaine où elles prennent effet.
      // D1 — la réponse à l'annonce mal reçue.
      if (d1 === 0 && w === 1) {
        A -= 0.06;
        R += 0.2;
      }
      if (d1 === 1 && w <= 2) {
        A += 0.04;
        R -= 0.1;
      }
      if (d1 === 2 && w === 2) {
        A += 0.02;
        R -= 0.03;
        cout += COUTS.pleniere;
      }
      if (d1 === 3 && w === 2) R += 0.03;

      // D2 — la bascule prévue en semaine 4.
      if (w === 4) {
        if (d2 === 0) {
          A -= 0.05;
          R += 0.15;
          cout += basculer(w, 1, 1.15);
        }
        if (d2 === 1) cout += COUTS.pilote + basculer(w, 0.3, 0.85);
        if (d2 === 2) {
          A -= 0.02;
          R += 0.05;
          cout += basculer(w, 0.3, 0.9);
        }
        if (d2 === 3) R -= 0.03;
      }
      if (pilote !== null && w === 8) {
        A += pilote ? 0.12 : -0.04;
        R += pilote ? -0.1 : 0.05;
      }

      // D3 — l'outil que personne n'utilise.
      if (w === 6) {
        if (d3 === 0) {
          A -= 0.04;
          R += 0.12;
        }
        if (d3 === 1) cout += COUTS.simplification;
        if (d3 === 2) {
          A += 0.02;
          R -= 0.02;
          cout += COUTS.formationOutil;
        }
      }
      if (livraison === w) {
        A += 0.03;
        R -= 0.1;
      }

      // D4 — Patrick.
      if (w === 8) {
        if (d4 === 0) {
          cout += COUTS.referent;
          if (accepte) {
            A += 0.08;
            R *= 0.2;
          } else R += 0.2;
        }
        if (d4 === 1) {
          A -= 0.05;
          R += 0.25;
        }
        if (d4 === 2) {
          // Les autres ont compris qu'il suffisait de refuser.
          A -= 0.1;
          R *= 0.4;
        }
        // Courtisé par un concurrent, et personne ne lui parle.
        if (d4 === 3) R += 0.08;
      }

      // D5 — la généralisation que la direction attend pour la semaine 13.
      const reste = Math.max(0, plafond - deploye());
      if (d5 === 0 && w === 10) {
        A -= 0.03;
        R += 0.08;
        cout += basculer(w, reste, 1.15 * passation);
      }
      if (d5 === 1 && w === 10) {
        A += 0.03;
        R -= 0.03;
        cout += COUTS.binomes + basculer(w, reste / 2, binome * passation);
      }
      if (d5 === 1 && w === 12) cout += basculer(w, reste, binome * passation);
      if (d5 === 2 && w >= 10) {
        if (w === 10) A += 0.01;
        cout += basculer(w, reste * 0.25 * A, 0.85 * passation);
      }
      if (d5 === 3 && w === 10) {
        A -= 0.02;
        R -= 0.02;
      }

      // D6 — finir le trimestre.
      if (w === 12) {
        if (d6 === 0) {
          A -= 0.04;
          R += 0.08;
        }
        if (d6 === 1) {
          A += 0.05;
          R -= 0.03;
          cout += COUTS.mesure;
        }
        if (d6 === 2) cout += COUTS.challenge;
      }
      if (patrickPart && w === 10) {
        A -= 0.06;
        cout += COUT_DEPART;
      }
      A = borne(A, 0.1, 0.95);
      R = borne(R, 0, 1);

      // L'usage réel de l'outil : il suit son utilité, l'adhésion, et la part de l'équipe qui en a besoin.
      const P = Math.min(deploye(), plafond);
      let utilite = livraison !== null && w >= livraison ? 0.85 : 0.5;
      if (d3 === 2 && w >= 7) utilite += 0.1;
      let cible = utilite * (0.2 + 0.8 * A) * (0.25 + 0.75 * P);
      if (sousControle(d3, d6, w)) cible *= 0.85;
      if (d6 === 1 && w >= 12) cible += 0.1;
      if (d6 === 2 && w >= 12) cible *= 0.75;
      U += 0.35 * (cible - U);
      for (const a of actifs) if (a.semaine === w) U *= a.imprevu.effet.usage ?? 1;
      U = borne(U, 0, 1);
    }

    // La courbe du changement : le creux des portefeuilles qui basculent, puis le gain, s'il est utilisé.
    const brut = deploye();
    const exemption = exempte && w >= 8 && brut > plafond ? plafond / brut : 1;
    let creux = 0;
    let maturite = 0;
    for (const t of transferts) {
      const k = w - t.semaine;
      if (k < 0) continue;
      creux += t.part * (PROFIL_DU_CREUX[k] ?? 0) * t.profondeur;
      maturite += t.part * borne((k - 1) / 4, 0, 1);
    }
    const qualite = 0.4 * A + 0.6 * U;
    const gain = GAIN_MAX * qualite * maturite * exemption;

    // Le chiffre de la semaine.
    let facteur = suite ? 1 : h.semaines[w]!;
    for (const a of actifs) facteur *= a.imprevu.effet.ca ?? 1;
    if (!suite && d3 === 2 && w === 6) facteur *= 0.98; // la journée de formation
    if (!suite && d6 === 2 && w >= 12) facteur *= 1.04; // le challenge
    if (!suite && d6 === 0 && w >= 12) facteur *= 1.01; // le classement affiché
    const freinage = PORTEFEUILLE_ANCIENS * (patrickPart ? 0.5 : 1) * 0.08 * R;
    const fuite = patrickPart && w >= 10 ? PORTEFEUILLE_PATRICK * CLIENTS_QUI_SUIVENT : 0;
    const ca = CA_BASE * facteur * (1 - creux + gain) - freinage - fuite * (suite ? 0.5 : 1);
    const margeSemaine = ca * TAUX_MARGE;

    if (suite) {
      // Ce que l'organisation laissée vaut, comparée à l'ancienne tournant sans heurt.
      valeurLaissee += margeSemaine - CA_BASE * TAUX_MARGE;
      continue;
    }

    marge += margeSemaine;
    couts += cout;
    ecart += margeSemaine - cout - BUDGET / SEMAINES;
    pire = Math.min(pire, ca / CA_BASE);

    // Ce que la semaine fait à l'équipe : le temps apaise, les anciens entraînent, les résultats convainquent.
    A += -0.02 * (R - 0.35) + 0.5 * gain - 0.15 * creux;
    R -= 0.01;
    A = borne(A, 0.1, 0.95);
    R = borne(R, 0, 1);
    // À bout, Patrick part : la décision se lit en fin de semaine 9.
    if (w === 9 && !exempte && h.uDepart < risqueDeDepart(R)) patrickPart = true;

    const saisies = sousControle(d3, d6, w) ? Math.max(U, 0.85) : Math.min(1, U * 1.25 + 0.03);
    semaines.push({
      ca,
      marge: margeSemaine,
      cout,
      ecart,
      adhesion: A,
      usage: U,
      saisies,
      deploiement: Math.min(brut, plafond),
      creux,
      gain,
      ressentiment: R,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: marge - couts - BUDGET + valeurLaissee,
    marge,
    couts,
    valeurLaissee,
    piloteReussi: pilote,
    patrickAccepte: accepte,
    patrickPart,
    livraison,
    adhesionFinale: fin.adhesion,
    usageFinal: fin.usage,
    saisiesFinales: fin.saisies,
    deploiementFinal: fin.deploiement,
    pireSemaine: pire,
  };
}

/** La saisie est-elle contrôlée cette semaine ? */
function sousControle(d3: number | undefined, d6: number | undefined, w: number) {
  return (d3 === 0 && w >= 6) || (d6 === 0 && w >= 12);
}

/** Ce qui s'est passé pendant des semaines : pilote, réponse de Patrick, départ, outil, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    sylvieVolontaire: chemin[D.annonce] === 1 && chemin[D.bascule] === 1 && dans(4),
    pilote: t.piloteReussi !== null && dans(7) ? t.piloteReussi : null,
    patrick: t.patrickAccepte !== null && dans(8) ? t.patrickAccepte : null,
    livraison: t.livraison !== null && dans(t.livraison) ? t.livraison : null,
    patrickPart: t.patrickPart && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRegion {
  ca: number | null;
  ecart: number | null;
  adhesion: number | null;
  usage: number | null;
  saisies: number | null;
  deploiement: number | null;
  /** 1 : le pilote a réussi ; 0 : il a échoué ; `null` : pas de pilote, ou pas encore. */
  pilote: number | null;
  /** 1 : Patrick est parti. */
  patrickParti: number | null;
}

/** Ce que la responsable lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRegion {
  if (semaine === 0) {
    return {
      ca: CA_DEPART,
      ecart: 0,
      adhesion: ADHESION_DEPART,
      usage: USAGE_DEPART,
      saisies: SAISIES_DEPART,
      deploiement: 0,
      pilote: null,
      patrickParti: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    ca: s.ca,
    ecart: s.ecart,
    adhesion: s.adhesion,
    usage: s.usage,
    saisies: s.saisies,
    deploiement: s.deploiement,
    pilote: t.piloteReussi === null || semaine < 7 ? null : t.piloteReussi ? 1 : 0,
    patrickParti: t.patrickPart && semaine >= 10 ? 1 : 0,
  };
}
