/**
 * LE COLLABORATEUR QUI DÉCROCHE — le modèle du comptoir de l'agence de Bron.
 *
 * Six vendeurs comptoir, treize semaines, six décisions. Didier Fontaine,
 * vingt ans de maison et longtemps le meilleur du comptoir, enchaîne depuis
 * deux mois les erreurs de commande ; l'équipe rattrape, et la direction
 * parle de procédure. Trois mécanismes font l'épisode, et le joueur doit les
 * découvrir :
 *
 *   · LA CAUSE N'EST PAS CELLE QU'ON CROIT. Les erreurs viennent presque
 *     toutes des commandes spéciales saisies dans le nouveau logiciel, auquel
 *     Didier n'a été qu'à moitié formé. Sa performance suit sa MAÎTRISE de
 *     l'outil et son ENGAGEMENT : une sanction ne lui apprend pas l'outil,
 *     et le retirer des commandes spéciales déplace les erreurs sans les
 *     résoudre.
 *   · LE DIALOGUE CONDITIONNE TOUT LE RESTE. Un entretien factuel et
 *     bienveillant « ouvre » Didier : il dit lui-même ce qui ne va pas, et un
 *     accompagnement porte deux fois plus. Un avertissement d'emblée le ferme :
 *     il se défend, apprend moins, et peut s'arrêter. Le recadrage formel garde
 *     sa place, mais APRÈS un plan qui a échoué, pas à la place du plan.
 *   · L'ÉQUIPE PAIE LE DÉCROCHAGE. Chaque erreur rattrapée, chaque commande
 *     reprise est une charge pour les cinq autres. Laissée sans réponse, elle
 *     use le climat, et la meilleure vendeuse finit par regarder ailleurs.
 *
 * Le trimestre est jugé en euros : la marge du comptoir, moins ce que coûtent
 * les erreurs, la formation, l'intérim et les départs, en écart au budget de
 * l'agence. Comprendre avant de juger n'y est pas une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const VENDEURS = 6;
/** Le chiffre d'affaires hebdomadaire du comptoir quand tout tourne. */
export const CA_SEMAINE = 62000;
export const TAUX_MARGE = 0.27;
/** Le budget de marge nette du comptoir sur le trimestre. */
export const BUDGET = 210000;
export const OBJECTIF_SATISFACTION = 0.86;
/** Le niveau d'erreurs de Didier avant son décrochage, par semaine. */
export const NIVEAU_D_AVANT = 1;
/** L'objectif fixé à mi-parcours : au plus 2,5 erreurs par semaine en semaine 6. */
export const SEUIL_TENU = 2.5;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des commandes fausses de plus, un artisan qui part. */
export const PERTE_PAR_JOUR = 1200;
/** Reprise, transport retour, avoir : ce que coûte une erreur de commande. */
export const COUT_ERREUR = 240;
export const COUT_DEPART = 11000;

export const MAITRISE_DEPART = 0.2;
export const ENGAGEMENT_DEPART = 0.45;
export const CLIMAT_DEPART = 0.55;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  entretien: 0,
  plan: 1,
  equipe: 2,
  etape: 3,
  gamme: 4,
  fin: 5,
} as const;

/** Ne rien changer, ou contourner, décision par décision. */
export const NEUTRE = [3, 3, 2, 2, 3, 3] as const;

export const COUTS = {
  formation: 1600,
  prime: 2400,
  technico: 400,
  interim: 1300,
  retours: 1500,
} as const;

/** Ce que la nouvelle gamme de fixations rapporte de marge par semaine, une fois le comptoir formé. */
export const GAIN_GAMME = 3000;

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
  effet: { ca?: number; charge?: number; erreurs?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "caisse",
    titre: "Panne du terminal de caisse",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le terminal de caisse du comptoir est tombé deux jours : encaissements à la main, file d'attente jusque sur le parking.",
    duree: 1,
    effet: { ca: 0.93, charge: 0.1 },
  },
  {
    id: "arret",
    titre: "Une vendeuse en arrêt",
    de: "Lucie Marchetti",
    role: "Vendeuse comptoir",
    texte: "Lucie est arrêtée une semaine pour une entorse : le comptoir tourne à cinq.",
    duree: 1,
    effet: { charge: 0.17 },
  },
  {
    id: "rupture",
    titre: "Rupture de plaques de plâtre",
    de: "Dépôt régional",
    role: "Logistique",
    texte:
      "Le fournisseur de plaques de plâtre est en rupture deux semaines : les artisans repartent les mains vides.",
    duree: 2,
    effet: { ca: 0.93 },
  },
  {
    id: "miseajour",
    titre: "Mise à jour du logiciel de commande",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Nouvelle version du logiciel de commande : les écrans de saisie ont changé, tout le monde tâtonne une semaine.",
    duree: 1,
    effet: { erreurs: 1.3 },
  },
  {
    id: "chantier",
    titre: "Ouverture d'un grand chantier",
    de: "Franck Delorme",
    role: "Directeur de l'agence",
    texte:
      "Le chantier de la ZAC voisine démarre : ses artisans viennent s'équiper au comptoir pendant deux semaines.",
    duree: 2,
    effet: { ca: 1.08, charge: 0.06 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  erreurs: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La vitesse à laquelle Didier apprend un outil quand on l'y accompagne. */
  apprentissage: number;
  /** Didier s'arrête-t-il après une sanction ? Un tirage par occasion. */
  uArret1: number;
  uArret4: number;
  uArret6: number;
  /** L'éditeur a-t-il une session de formation en semaine 4, ou seulement en semaine 8 ? */
  uEditeur: number;
  /** La formation de l'équipe par Didier réussit-elle ? */
  uGamme: number;
  /** Karima part-elle si le climat se dégrade ? */
  uKarima: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 3021377 + 53);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.05 * gauss(r), 0.88, 1.12),
      erreurs: borne(1 + 0.15 * gauss(r), 0.65, 1.4),
    });
  }
  const apprentissage = borne(1 + 0.3 * gauss(r), 0.5, 1.5);
  const uArret1 = r();
  const uArret4 = r();
  const uArret6 = r();
  const uEditeur = r();
  const uGamme = r();
  const uKarima = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = {
    semaines,
    apprentissage,
    uArret1,
    uArret4,
    uArret6,
    uEditeur,
    uGamme,
    uKarima,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/**
 * CE QUE L'ENTRETIEN OUVRE.
 *
 * Un accompagnement ne porte que si Didier accepte de dire ce qui ne va pas,
 * et de se faire aider. Un entretien factuel et bienveillant l'y amène ; un
 * avertissement d'emblée le met sur la défensive pour le trimestre.
 */
export function ouverture(chemin: readonly number[]): number {
  return [0.4, 1, 0.65, 0.55][chemin[D.entretien] ?? 3] ?? 0.55;
}

/** L'éditeur a une session en semaine 4 une fois sur deux ; sinon, la suivante est en semaine 8. */
export const semaineFormation = (graine: number) => (hasard(graine).uEditeur < 0.5 ? 4 : 8);

/** Le risque que Didier s'arrête après une sanction, selon son engagement du moment. */
export const risqueDArret = (engagement: number) => borne(0.6 - 0.6 * engagement, 0.1, 0.5);

/** Le risque que Karima démissionne, lu sur le climat de l'équipe en fin de semaine 9. */
export const risqueDeDepart = (climat: number) => borne((0.52 - climat) * 3, 0, 0.75);

/** La formation de l'équipe par Didier réussit d'autant plus souvent qu'il est engagé. */
export const chanceGamme = (engagement: number) => borne(1.1 * engagement - 0.1, 0.05, 0.8);

export type Semaine = {
  /** Erreurs de commande de Didier dans la semaine. */
  erreurs: number;
  /** Son indice de performance : 100, son niveau d'avant. */
  performance: number;
  satisfaction: number;
  /** Le climat de l'équipe, de 0 à 1. */
  climat: number;
  /** Le risque que la meilleure vendeuse parte. */
  risque: number;
  /** La charge de l'équipe : 1, le travail normal de six vendeurs. */
  charge: number;
  ca: number;
  /** Ce que la semaine apporte à la marge nette : marge, moins erreurs, dépenses et départs. */
  contribution: number;
  /** Marge nette cumulée depuis le début du trimestre. */
  cumul: number;
  maitrise: number;
  engagement: number;
  /** 1 s'il est au comptoir, 0 s'il est arrêté. */
  present: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge nette du comptoir : positif, le comptoir fait mieux que le budget. */
  objectif: number;
  margeNette: number;
  depenses: number;
  erreursTotales: number;
  /** Les semaines où Didier a été arrêté. */
  arret: readonly number[];
  karimaPart: boolean;
  formationSemaine: number | null;
  /** Le point d'étape de la semaine 6 a-t-il trouvé les objectifs tenus ? */
  tenu: boolean;
  gammeReussie: boolean | null;
  satisfactionMoyenne: number;
  erreursFinales: number;
  /** Son indice de performance en semaine 13 : 100, son niveau d'avant. */
  performanceFinale: number;
  climatFinal: number;
  effectifFinal: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const ouvre = ouverture(chemin);
  const formation = d2 === 0 ? semaineFormation(graine) : null;
  const semaines: (Semaine | null)[] = [null];
  let maitrise = MAITRISE_DEPART;
  let engagement = ENGAGEMENT_DEPART;
  let climat = CLIMAT_DEPART;
  let satisfactionPrecedente = 0.82;
  let cumul = 0;
  let depenses = 0;
  let erreursTotales = 0;
  let karima = false;
  let tenu = false;
  let gamme: boolean | null = null;
  let qualiteGamme = 0;
  let confiance = ouvre;
  let suivi = d2 === 1;
  /** Le binôme avec Yacine continue-t-il après la semaine 6 ? */
  let binomeProlonge = false;
  /** Un surcroît d'effort sous la menace : il s'éteint avec elle. */
  const effort: number[] = Array.from({ length: SEMAINES + 1 }, () => 0);
  const arret = new Set<number>();
  if (d1 === 0 && h.uArret1 < 0.3) [3, 4, 5].forEach((w) => arret.add(w));
  if (d1 === 0) [1, 2, 3].forEach((w) => (effort[w]! += 6));
  if (d2 === 2) [3, 4, 5, 6].forEach((w) => (effort[w]! += 5));
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let depense = 0;
    let climatDelta = 0;

    // Ce que les décisions changent, le jour où elles prennent effet.
    if (w === 1) {
      engagement += [-0.15, 0.12, -0.02, 0][d1 ?? 3]!;
      climatDelta += [0.02, 0, -0.01, -0.02][d1 ?? 3]!;
    }
    if (w === 3) {
      if (d2 === 2 || d2 === 3) engagement -= 0.08;
      if (d2 === 3) climatDelta -= 0.04;
    }
    if (w === 5) {
      if (d3 === 0) climatDelta += 0.12;
      if (d3 === 1) {
        climatDelta += 0.04;
        engagement -= 0.15;
        confiance *= 0.6;
      }
      if (d3 === 2) climatDelta -= 0.04;
      if (d3 === 3) {
        climatDelta += 0.08;
        depense += COUTS.prime;
      }
    }
    if (w === 7) {
      if (d4 === 0) {
        engagement -= 0.15;
        confiance *= 0.5;
        climatDelta -= 0.02;
        [7, 8, 9].forEach((x) => (effort[x]! += 5));
        if (h.uArret4 < risqueDArret(engagement)) [8, 9, 10].forEach((x) => arret.add(x));
      }
      if (d4 === 1) {
        // Un point toutes les deux semaines, quoi qu'il arrive.
        suivi = true;
        if (tenu) {
          engagement += 0.1; // Les progrès sont reconnus ; Yacine retourne au comptoir.
        } else {
          // Le recadrage écrit, avec une dernière échéance et une session de rattrapage.
          maitrise += 0.1 * (0.6 + 0.4 * confiance);
          [7, 8, 9, 10].forEach((x) => (effort[x]! += 6));
          binomeProlonge = d2 === 1;
        }
      }
      if (d4 === 2) {
        binomeProlonge = d2 === 1;
        // Garder la main sur l'épaule d'un vendeur qui a tenu ses objectifs l'infantilise.
        if (tenu && d2 === 1) engagement -= 0.05;
      }
      if (d4 === 3) suivi = false;
    }
    if (w === 9) {
      if (d5 === 2) climatDelta -= 0.07;
      if (d5 === 1) depense += COUTS.technico;
    }
    if (w === 10) {
      if (d5 === 0) {
        gamme = !arret.has(9) && !arret.has(10) && h.uGamme < chanceGamme(engagement);
        // Il connaît ces produits et les chantiers des clients mieux que le fournisseur.
        // Ratée, la session coûte : des chevilles inadaptées partent sur les chantiers.
        engagement += gamme ? 0.15 : -0.1;
        climatDelta += gamme ? 0.03 : -0.02;
        qualiteGamme = gamme ? 1.2 : 0;
        if (!gamme) depense += COUTS.retours;
      } else {
        qualiteGamme = [1.2, 0.6, 0.5, 0.25][d5 ?? 3]!;
      }
    }
    if (w === 11) {
      engagement += [0.05, -0.2, -0.03, 0][d6 ?? 3]!;
      climatDelta += [0.02, -0.04, 0.01, -0.03][d6 ?? 3]!;
      if (d6 === 1 && h.uArret6 < 0.35) [11, 12, 13].forEach((x) => arret.add(x));
    }

    // Ce que Didier apprend de l'outil.
    const present = !arret.has(w);
    const surSpeciales = !(d2 === 3 && w >= 3) && !(d6 === 2 && w >= 11);
    const avant = maitrise;
    if (present && surSpeciales) maitrise += 0.01;
    const binome =
      present && d2 === 1 && ((w >= 3 && w <= 6) || (w >= 7 && w <= 10 && binomeProlonge));
    // Le binôme apprend beaucoup les premières semaines, puis de moins en moins.
    if (binome) maitrise += (w <= 6 ? 0.085 : 0.015) * confiance * h.apprentissage;
    if (formation !== null && w === formation && present) {
      maitrise += 0.26 * (0.6 + 0.4 * confiance) * (0.85 + 0.15 * h.apprentissage);
      engagement += 0.05;
    }
    maitrise = borne(maitrise, 0, 1);
    // Réussir redonne confiance ; être suivi chaque semaine aussi, à condition d'être écouté.
    engagement += 0.25 * (maitrise - avant);
    // Sans suivi, il glisse vers un retrait poli.
    if (suivi && w >= 3 && present) engagement += 0.035 * confiance * (1 - engagement);
    else if (w >= 2) engagement += 0.06 * (0.3 - engagement);
    engagement = borne(engagement, 0.05, 1);

    const performance = borne(
      100 * (0.3 + 0.45 * maitrise + 0.3 * engagement) + effort[w]!,
      20,
      100,
    );
    let facteurErreurs = 1;
    for (const a of actifs) facteurErreurs *= a.imprevu.effet.erreurs ?? 1;
    // Remis seul face au rush sans maîtriser l'outil, il se noie.
    const deborde = d6 === 0 && w >= 11 && maitrise < 0.5 ? 1.4 : 1;
    const erreurs = present
      ? (0.5 + 7 * (1 - performance / 100)) *
        n.erreurs *
        facteurErreurs *
        deborde *
        (surSpeciales ? 1 : 0.35)
      : 0;

    // Ce que l'équipe porte : rattraper les erreurs, reprendre les commandes, couvrir les absents.
    let charge = 1;
    if (present) {
      charge += 0.3 * (1 - performance / 100) * (surSpeciales ? 1 : 0.35);
      if (!surSpeciales) charge += 0.1;
    } else {
      charge += 0.08; // Un intérimaire tient sa place, mal.
      depense += COUTS.interim;
    }
    if (binome) charge += w <= 6 ? 0.04 : 0.05;
    if (d5 === 2 && (w === 9 || w === 10)) charge += 0.05;
    // Qui pilote les commandes spéciales du rush les retire des mains des autres.
    if (d6 === 0 && w >= 11 && present && maitrise >= 0.5) charge -= 0.1;
    if (formation !== null && w === formation) charge += 0.06;
    if (d3 === 0 && w >= 5) charge -= 0.03;
    if (karima && w >= 11) charge += 0.17;
    const rush = w >= 11;
    if (rush) charge += 0.12;
    if (d6 === 2 && w >= 11) {
      charge -= 0.1;
      depense += COUTS.interim;
    }
    for (const a of actifs) charge += a.imprevu.effet.charge ?? 0;

    const erreursEquipe =
      (1.6 * (1 + 2.5 * Math.max(0, charge - 1.1)) +
        (!present || (d6 === 2 && w >= 11) ? 1.5 : 0)) *
      n.erreurs *
      facteurErreurs;
    const totales = erreurs + erreursEquipe;
    const satisfaction = borne(
      0.92 - 0.014 * totales - 0.25 * Math.max(0, charge - 1.08),
      0.5,
      0.95,
    );

    // Le climat : la charge l'use, la reconnaissance et l'équité le réparent.
    climatDelta += -0.1 * (charge - 1.06);
    if ((d1 === 2 || d1 === 3) && w <= 4) climatDelta -= 0.01;
    climat = borne(climat + climatDelta, 0.05, 0.95);
    const risque = risqueDeDepart(climat);
    // À bout, Karima accepte l'offre d'un concurrent : la décision se lit en fin de semaine 9.
    if (w === 9 && h.uKarima < risque) karima = true;

    // Ce que la semaine rapporte.
    let facteurCA = n.demande * (rush ? 1.25 : 1);
    for (const a of actifs) facteurCA *= a.imprevu.effet.ca ?? 1;
    const servis = 1 - 0.5 * Math.max(0, charge - 1.1);
    const fideles = 1 - 1.2 * Math.max(0, OBJECTIF_SATISFACTION - satisfactionPrecedente);
    const ca = CA_SEMAINE * facteurCA * servis * fideles;
    let marge = ca * TAUX_MARGE;
    if (w >= 11) marge += GAIN_GAMME * qualiteGamme;
    const depart = karima && w === 10 ? COUT_DEPART : 0;
    const contribution =
      marge - totales * COUT_ERREUR - depense - depart - (w === 1 ? perteEnquete : 0);
    depenses += depense;
    cumul += contribution;
    erreursTotales += erreurs;
    satisfactionPrecedente = satisfaction;
    // Tenu, c'est moins d'erreurs sur ses commandes spéciales : pas moins de commandes spéciales.
    if (w === 6) tenu = erreurs <= SEUIL_TENU && present && surSpeciales;

    semaines.push({
      erreurs,
      performance,
      satisfaction,
      climat,
      risque,
      charge,
      ca,
      contribution,
      cumul,
      maitrise,
      engagement,
      present: present ? 1 : 0,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: cumul - BUDGET,
    margeNette: cumul,
    depenses,
    erreursTotales,
    arret: [...arret].sort((a, b) => a - b),
    karimaPart: karima,
    formationSemaine: formation,
    tenu,
    gammeReussie: gamme,
    satisfactionMoyenne: pleines.reduce((s, x) => s + x.satisfaction, 0) / SEMAINES,
    erreursFinales: pleines[SEMAINES - 1]!.erreurs,
    performanceFinale: pleines[SEMAINES - 1]!.performance,
    climatFinal: pleines[SEMAINES - 1]!.climat,
    effectifFinal: VENDEURS - (karima ? 1 : 0),
  };
}

/** Ce qui s'est passé pendant des semaines : arrêts, départ, formation, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  // Un arrêt commence après une sanction : en semaine 3, 8 ou 11, pour trois semaines.
  const debutArret = [3, 8, 11].find((w) => dans(w) && t.arret.includes(w));
  return {
    arret: debutArret ?? null,
    /** La session de l'éditeur : suivie, manquée pour cause d'arrêt, ou rien cette fois. */
    formation:
      t.formationSemaine !== null && dans(t.formationSemaine)
        ? t.arret.includes(t.formationSemaine)
          ? ("manquee" as const)
          : ("suivie" as const)
        : null,
    etape: chemin[D.etape] === 1 && dans(7) ? t.tenu : null,
    karimaPart: t.karimaPart && dans(10),
    gamme: chemin[D.gamme] === 0 && dans(10) ? t.gammeReussie : null,
    /** Didier était-il arrêté quand la session sur la gamme devait avoir lieu ? */
    gammeSansDidier: t.arret.includes(9) || t.arret.includes(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureComptoir {
  erreurs: number | null;
  satisfaction: number | null;
  climat: number | null;
  risque: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** Ce que le tableau de bord ne montre pas, mais que les messages lisent. */
  maitrise: number | null;
  engagement: number | null;
  absent: number | null;
}

/** Ce que Sandrine lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureComptoir {
  if (semaine === 0) {
    return {
      erreurs: 4.2,
      satisfaction: 0.82,
      climat: CLIMAT_DEPART,
      risque: risqueDeDepart(CLIMAT_DEPART),
      cumul: 0,
      budgetADate: 0,
      maitrise: MAITRISE_DEPART,
      engagement: ENGAGEMENT_DEPART,
      absent: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    erreurs: s.erreurs,
    satisfaction: s.satisfaction,
    climat: s.climat,
    risque: s.risque,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    maitrise: s.maitrise,
    engagement: s.engagement,
    absent: t.arret.includes(semaine) ? 1 : 0,
  };
}
