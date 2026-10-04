/**
 * LE PROJET QUI GLISSE — le modèle du projet de commande en ligne.
 *
 * Six développeurs, un reste à faire, des demandes des agences qui arrivent
 * chaque semaine, une recette qui dépend d'utilisateurs clés qu'on ne voit
 * pas, et une mise en service promise pour la semaine 13. Trois mécanismes
 * font l'épisode, et le joueur doit les découvrir :
 *
 *   · LE PÉRIMÈTRE GONFLE. Chaque demande acceptée au fil de l'eau ajoute du
 *     travail, et l'équipe en reçoit presque autant qu'elle en abat : le reste
 *     à faire ne baisse pas, quoi qu'on mette en face. Geler le périmètre et
 *     trier les demandes rend à l'équipe sa vitesse ; découper (ouvrir
 *     l'essentiel à la date, le reste ensuite) protège la date.
 *   · AJOUTER DU MONDE RETARDE D'ABORD. Un renfort ne connaît ni le code ni le
 *     métier : pendant trois semaines il prend du temps aux anciens au lieu
 *     d'en donner, puis il apporte moins qu'eux, et chaque personne de plus
 *     ajoute de la coordination et des défauts (loi de Brooks).
 *   · LES TESTS SAUTÉS SE PAIENT APRÈS. Chaque jour de développement laisse
 *     des défauts ; la recette les trouve, et les corriger prend du temps à
 *     l'équipe. Raccourcir la recette rend ce temps tout de suite, et envoie
 *     les défauts en service, où chacun coûte trois fois plus.
 *
 * Le trimestre est jugé en euros : la valeur de ce qui est mis en service,
 * diminuée de chaque semaine de retard, moins les surcoûts, le travail qui
 * reste après la semaine 13, le lancement manqué et les défauts livrés.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const DEVELOPPEURS = 6;
/** Jours-homme de développement par développeur et par semaine, réunions déduites. */
export const PRODUCTIVITE = 4;
/** Le reste à faire au départ, en jours-homme : le cœur de l'outil, et le reste. */
export const RAF_COEUR = 120;
export const RAF_LOT2 = 100;
/** Ce qui est déjà développé, en jours-homme. */
export const FAIT_DEPART = 200;
export const DEMANDES_DEPART = 14;
export const OUVERTS_DEPART = 12;
export const LATENTS_DEPART = 18;
/** L'avancement que le plan prévoyait en semaine 0, et la semaine où le développement devait finir. */
export const PLAN_DEPART = 0.55;
export const PLAN_FIN = 12;
/** La cadence du plan : le reste à faire de départ sur douze semaines. */
export const CADENCE = Math.round((RAF_COEUR + RAF_LOT2) / PLAN_FIN);
/** Le budget du trimestre : l'équipe et le prestataire, 14 k€ par semaine, et une réserve. */
export const BUDGET = 200000;
export const DEPENSE_SEMAINE = 14000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les demandes continuent d'entrer sans tri. */
export const PERTE_PAR_JOUR = 2000;

/** Ce que vaut ce qui est mis en service, en euros. */
export const VALEUR = {
  coeur: 150000,
  lot2: 40000,
  /** Le devis en ligne demandé par le directeur commercial. */
  devis: 6000,
  /** Par jour-homme de demande des agences acceptée : du confort, surtout. */
  demandeParJh: 150,
} as const;
/** Chaque semaine de retard retire 4 % de la valeur : la saison des chantiers n'attend pas. */
export const DECOTE = 0.04;
/** Un lancement annoncé aux artisans et manqué : campagne, salon, catalogue à refaire. */
export const LANCEMENT_MANQUE = 15000;
/** Ce que coûte un jour-homme qui reste à faire après la semaine 13. */
export const COUT_JH = 350;
/** Un défaut livré sans avoir été trouvé : correction en urgence, commandes fausses, avoirs. */
export const COUT_DEFAUT_LIVRE = 1800;
/** Un défaut connu, ouvert à la mise en service : un contournement, et une correction ensuite. */
export const COUT_DEFAUT_OUVERT = 500;
/** Corriger un défaut prend une demi-journée en début de projet, une journée à la fin : le code s'est construit dessus. */
export const coutCorrection = (semaine: number) => 0.4 + 0.05 * semaine;
/** Ce qu'un défaut pas encore trouvé fait perdre à l'équipe chaque semaine, en jours-homme. */
export const RALENTISSEMENT_PAR_DEFAUT = 0.1;
/** Défauts laissés par jour-homme de développement. */
export const DEFAUTS_PAR_JH = 0.22;
/** Une panne le jour de l'ouverture : commandes bloquées, artisans au comptoir. */
export const COUT_INCIDENT = 25000;
export const COUT_INCIDENT_PILOTE = 5000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  cap: 0,
  recette: 1,
  devis: 2,
  pilotage: 3,
  tests: 4,
  ouverture: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 0, 3, 3, 0] as const;

export const COUTS = {
  /** Deux développeurs de plus chez le prestataire, par semaine. */
  renfort: 4000,
  heuresSup: 1800,
  /** Les remplaçants au comptoir qui libèrent les utilisateurs clés, par semaine. */
  remplacants: 1200,
  /** Trois développeurs prêtés par la DSI, refacturés par semaine. */
  dsi: 3000,
  testsAuto: 8000,
} as const;

/** Le devis en ligne : 35 jours-homme, et il touche au panier et aux prix, déjà testés. */
export const DEVIS_JH = 35;
export const DEVIS_REGRESSIONS = 5;
/** Le troc : le compte multi-utilisateurs sort du lot 2 pour faire place au devis. */
export const TROC_JH = 30;
export const TROC_VALEUR = 7000;
/** Les demandes des agences qu'on fait passer avant l'ouverture. */
export const DERNIERES_DEMANDES_JH = 28;
export const DERNIERES_DEMANDES_VALEUR = 6000;

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
  effet: { capacite?: number; recette?: number; travail?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "environnement",
    titre: "Panne de l'environnement de test",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le serveur de recette est tombé et sa restauration a pris quatre jours : aucune séance de test cette semaine.",
    duree: 1,
    effet: { recette: 0.3 },
  },
  {
    id: "grippe",
    titre: "Grippe dans l'équipe",
    de: "Yannick Meunier",
    role: "Développeur principal",
    texte:
      "Sarah et Hugo sont cloués au lit, et Léna tousse. On tourne à moitié pendant quinze jours.",
    duree: 2,
    effet: { capacite: 0.75 },
  },
  {
    id: "facture",
    titre: "La facture électronique devient obligatoire",
    de: "Direction financière",
    role: "Siège",
    texte:
      "Le nouveau format de facture électronique s'impose aux factures émises par le portail : douze jours-homme de travail imprévu.",
    duree: 1,
    effet: { travail: 12 },
  },
  {
    id: "prestataire",
    titre: "Le prestataire change un développeur",
    de: "Olivier Mercier",
    role: "Directeur de projet, Studio Lumen",
    texte:
      "Kevin nous quitte ; Bastien le remplace et doit reprendre son code. Comptez deux semaines un peu molles de notre côté.",
    duree: 2,
    effet: { capacite: 0.88 },
  },
  {
    id: "inventaire",
    titre: "Inventaire annuel des agences",
    de: "Direction des agences",
    role: "Siège",
    texte:
      "L'inventaire annuel mobilise tout le personnel des agences cette semaine : les utilisateurs clés ne viendront pas.",
    duree: 1,
    effet: { recette: 0.35 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** La vitesse de l'équipe, rapportée à la normale. */
  vitesse: number;
  /** Les nouvelles demandes des agences. */
  demandes: number;
  /** Leur taille moyenne, en jours-homme. */
  taille: number;
  /** Le travail que personne n'avait vu, découvert en cours de route. */
  decouverte: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'agence de Saint-Priest accepte-t-elle de libérer ses utilisateurs clés ? */
  uSaintPriest: number;
  /** Le directeur commercial accepte-t-il d'attendre le lot 2 ? */
  uDirecteur: number;
  /** Une panne le jour de l'ouverture ? */
  uIncident: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 611953 + 41);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      vitesse: Math.min(1.2, Math.max(0.8, 1 + 0.08 * gauss(r))),
      demandes: Math.min(5, Math.max(0, 1.9 + 1 * gauss(r))),
      taille: 3.5 + 2 * r(),
      decouverte: Math.max(0, 2 + 2.5 * gauss(r)),
    });
  }
  const uSaintPriest = r();
  const uDirecteur = r();
  const uIncident = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, uSaintPriest, uDirecteur, uIncident, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur trois, l'agence de Saint-Priest, la plus grosse, garde ses deux utilisateurs clés. */
export const saintPriestRefuse = (graine: number) => hasard(graine).uSaintPriest < 0.35;

/**
 * LE DIRECTEUR COMMERCIAL ATTEND-IL LE LOT 2 ?
 *
 * Proposer de mettre son devis en tête du lot 2 ne marche que si le lot 2
 * existe déjà aux yeux de tous : avec un comité qui trie les demandes depuis
 * la semaine 1, il accepte quatre fois sur cinq ; sans, il va voir la
 * direction générale trois fois sur quatre, et le devis est imposé en semaine 7.
 */
export function chanceQueLeDirecteurAttende(chemin: readonly number[]): number {
  if (chemin[D.devis] !== 1) return 0;
  return chemin[D.cap] === 1 ? 0.8 : 0.25;
}
export const directeurAttend = (chemin: readonly number[], graine: number) =>
  hasard(graine).uDirecteur < chanceQueLeDirecteurAttende(chemin);

/** Le risque d'une panne le jour de l'ouverture, lu sur les défauts que la recette n'a pas trouvés. */
export const risqueIncident = (latents: number) => Math.min(0.85, Math.max(0, 0.03 * latents));

export type Semaine = {
  /** Part du périmètre total développée. */
  avancement: number;
  /** Reste à faire avant la mise en service, en jours-homme (le cœur seul, une fois découpé). */
  raf: number;
  /** Reste à faire de tout le périmètre. */
  rafTotal: number;
  /** Reste à faire du cœur de l'outil : catalogue, prix, panier, commande, suivi. */
  rafCoeur: number;
  /** Demandes de changement en attente de décision. */
  demandes: number;
  /** Défauts trouvés en recette et pas encore corrigés. */
  ouverts: number;
  /** Défauts que personne n'a encore trouvés. */
  latents: number;
  /** Budget consommé depuis le début du trimestre. */
  budget: number;
  /** Ce que la semaine a coûté en plus du plan : renforts, heures, remplaçants, tests. */
  depense: number;
  /** Jours-homme développés dans la semaine. */
  realise: number;
  /** Jours-homme ajoutés au périmètre dans la semaine : demandes, découvertes, imprévus. */
  ajoute: number;
  /** Reste à faire abattu dans la semaine, net des ajouts (jamais négatif sur la courbe). */
  net: number;
  /** Ce que la semaine a apporté : travail utile, moins surcoûts et défauts laissés. */
  solde: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur nette du projet : positive, il a rapporté plus qu'il n'a coûté en dérapages. */
  objectif: number;
  valeur: number;
  surcouts: number;
  /** Ce qui reste à développer après la semaine 13, en jours-homme. */
  restant: number;
  /** Le glissement de la mise en service de l'essentiel, en semaines (0 : à la date). */
  glissement: number;
  /** Le glissement de tout le périmètre, en semaines. */
  glissementTotal: number;
  lancementManque: boolean;
  defautsLivres: number;
  defautsOuverts: number;
  coutDefauts: number;
  incident: boolean;
  decoupe: boolean;
  report: boolean;
  directeurAttend: boolean;
  devisImpose: boolean;
  saintPriestRefuse: boolean;
  demandesAcceptees: number;
  budgetConsomme: number;
  pertes: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const attend = directeurAttend(chemin, graine);
  const saintPriest = d2 === 1 && saintPriestRefuse(graine);
  const decoupe = d4 === 1;
  const report = d4 === 2;
  const devisImpose = d3 === 0 || (d3 === 1 && !attend);
  const semaines: (Semaine | null)[] = [null];

  let rafC = RAF_COEUR;
  let rafL = RAF_LOT2;
  let fait = FAIT_DEPART;
  let latents = LATENTS_DEPART;
  let ouverts = OUVERTS_DEPART;
  let demandes = DEMANDES_DEPART;
  let accepteJh = 0;
  let surcouts = 0;
  const pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const vitesses: number[] = [];

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    const rafAvant = rafC + rafL;

    // La capacité : l'équipe, les renforts qui apprennent, ce qui la ralentit.
    let capacite = DEVELOPPEURS * PRODUCTIVITE * n.vitesse;
    let efficacite = 1;
    let defautsParJh = DEFAUTS_PAR_JH;
    if (d1 === 0 && w >= 2) {
      // Deux renforts : trois semaines à prendre du temps aux anciens, puis 3 jh chacun.
      capacite += w <= 4 ? -3 : 6;
      efficacite *= 0.95;
      if (w >= 5) defautsParJh *= 1.2;
    }
    if (d1 === 2 && w >= 2) {
      // Les heures supplémentaires : +20 % pour les internes, que la fatigue grignote.
      capacite += w <= 6 ? 3.2 : 1.2;
      defautsParJh *= 1.3;
    }
    if (d2 === 0 && w >= 4) efficacite *= 0.9;
    if (d4 === 0 && w >= 8) {
      // Trois développeurs de la DSI, qui découvrent le code à huit semaines de la fin.
      capacite += w <= 10 ? -4.5 : 6;
      efficacite *= 0.93;
      defautsParJh *= 1.25;
    }
    if (d5 === 2 && w >= 11) defautsParJh *= 0.8;
    for (const a of actifs) efficacite *= a.imprevu.effet.capacite ?? 1;
    // Un code plein de défauts que personne n'a trouvés ralentit tout le monde.
    capacite -= RALENTISSEMENT_PAR_DEFAUT * latents;
    capacite = Math.max(4, capacite * efficacite);

    // Ce qui entre au périmètre : demandes acceptées, découvertes, imprévus, décisions.
    let ajout = n.decouverte;
    demandes += n.demandes;
    let acceptees: number;
    if (d1 === 1 && w >= 2) {
      // Le comité tranche chaque semaine : l'indispensable entre, le reste part en lot 2.
      // Un directeur commercial vexé ou désavoué fait passer ses demandes par-dessus le comité.
      const contourne = (d3 === 3 && w >= 6) || (devisImpose && d3 === 1 && w >= 7);
      acceptees = demandes * (contourne ? 0.3 : 0.15);
      demandes = 0;
    } else {
      // Au fil de l'eau : les développeurs prennent ce que les agences poussent ; certaines
      // demandes, lassées d'attendre, sont abandonnées.
      acceptees = demandes * (d3 === 3 && w >= 6 ? 0.35 : 0.25);
      demandes -= acceptees + demandes * 0.15;
    }
    accepteJh += acceptees * n.taille;
    ajout += acceptees * n.taille;
    for (const a of actifs) if (w === a.semaine) ajout += a.imprevu.effet.travail ?? 0;
    let ajoutCoeur = ajout * 0.6;
    const ajoutLot2 = ajout * 0.4;
    if (devisImpose && w === (d3 === 0 ? 6 : 7)) {
      ajoutCoeur += DEVIS_JH;
      latents += DEVIS_REGRESSIONS;
    }
    if (d3 === 2 && w === 6) {
      ajoutCoeur += DEVIS_JH;
      rafL = Math.max(0, rafL - TROC_JH);
      latents += DEVIS_REGRESSIONS;
    }
    if (d6 === 2 && w === 12) {
      ajoutCoeur += DERNIERES_DEMANDES_JH;
      latents += 3;
    }
    rafC += ajoutCoeur;
    rafL += ajoutLot2;

    // Les corrections passent avant le développement nouveau, dans une part de la capacité.
    const protegee = d5 === 1 && (w === 10 || w === 11);
    let partCorrections = 0.3;
    if (protegee) partCorrections = 0.6;
    if (d5 === 0 && w >= 10) partCorrections = 0.1;
    // Sans consigne, la date qui approche fait passer les corrections après les fonctionnalités.
    if (d5 === 3 && w >= 10) partCorrections = 0.15;
    if (d6 === 1 && w >= 12) partCorrections = Math.max(partCorrections, 0.5);
    const cout = coutCorrection(w);
    const corriges = Math.min(ouverts, (capacite * partCorrections) / cout);
    ouverts -= corriges;
    const dev = capacite - corriges * cout;

    // Le développement : sur tout le périmètre à la fois, ou l'essentiel d'abord une fois découpé.
    let faitC: number;
    let faitL: number;
    if (decoupe && w >= 8) {
      faitC = Math.min(rafC, dev);
      faitL = Math.min(rafL, dev - faitC);
    } else {
      const total = Math.max(1e-9, rafC + rafL);
      faitC = Math.min(rafC, (dev * rafC) / total);
      faitL = Math.min(rafL, (dev * rafL) / total);
    }
    rafC -= faitC;
    rafL -= faitL;
    const realise = faitC + faitL;
    fait += realise;
    vitesses.push(dev);
    const nouveaux = realise * defautsParJh;
    latents += nouveaux;

    // La recette : la part des défauts que les utilisateurs clés trouvent cette semaine.
    let recette = 0.15;
    if (w >= 4) {
      if (d2 === 0) recette = 0.2;
      if (d2 === 1) recette = saintPriest ? 0.32 : 0.38;
      if (d2 === 2) recette = w <= 9 ? 0.04 : 0.3;
    }
    if (d3 === 3 && w >= 6) recette *= 0.6;
    if (protegee) recette += 0.3;
    if (d5 === 0 && w >= 10) recette *= 0.35;
    if (d5 === 3 && w >= 10) recette *= 0.7;
    if (d5 === 2 && w >= 11) recette += 0.08;
    for (const a of actifs) recette *= a.imprevu.effet.recette ?? 1;
    // Les utilisateurs clés ne testent pas plus de douze parcours par semaine.
    let trouves = Math.min(12, latents * borne(recette, 0, 0.8));
    // Les agences pilotes trouvent la moitié de ce qui reste, une semaine avant tout le monde.
    if (d6 === 1 && w === 12) trouves += (latents - trouves) * 0.5;
    latents -= trouves;
    ouverts += trouves;

    // Ce que la semaine coûte en plus du plan.
    let depense = 0;
    if (d1 === 0 && w >= 2) depense += COUTS.renfort;
    if (d1 === 2 && w >= 2) depense += COUTS.heuresSup;
    if (d2 === 1 && w >= 4) depense += COUTS.remplacants;
    if (d4 === 0 && w >= 8) depense += COUTS.dsi;
    if (d5 === 2 && w === 10) depense += COUTS.testsAuto;
    surcouts += depense;

    const rafApres = rafC + rafL;
    semaines.push({
      avancement: fait / (fait + rafApres),
      raf: decoupe && w >= 8 ? rafC : rafApres,
      rafTotal: rafApres,
      rafCoeur: rafC,
      demandes,
      ouverts,
      latents,
      budget: DEPENSE_SEMAINE * w + surcouts,
      depense,
      realise,
      ajoute: ajoutCoeur + ajoutLot2,
      net: Math.max(0, rafAvant - rafApres),
      solde:
        (rafAvant - rafApres) * COUT_JH -
        depense -
        (nouveaux - trouves) * COUT_DEFAUT_LIVRE -
        (w === 1 ? pertes : 0),
    });
  }

  // La mise en service : ce qui est prêt en fin de semaine 13, et ce qui glisse.
  const vitesse = Math.max(8, (vitesses.at(-1)! + vitesses.at(-2)! + vitesses.at(-3)!) / 3);
  const restant = rafC + rafL;
  const glisseCoeur = (decoupe ? rafC : restant) / vitesse;
  const glissementTotal = restant / vitesse;
  // Un report annoncé en semaine 7 déplace la date de quatre semaines : la valeur attend, le lancement est replanifié.
  const glissement = report ? Math.max(0, glisseCoeur - 4) : glisseCoeur;
  const attenteCoeur = report ? 4 + glissement : glissement;
  const attenteLot2 = report ? Math.max(4, glissementTotal) : glissementTotal;
  const lancementManque = glissement > 0.05;
  const garde = (s: number) => Math.max(0, 1 - DECOTE * s);
  const devisLivre = d3 === 0 || d3 === 2 || (d3 === 1 && !attend);
  const valeur =
    (VALEUR.coeur + accepteJh * VALEUR.demandeParJh) * garde(attenteCoeur) +
    VALEUR.lot2 * garde(attenteLot2) -
    (d3 === 2 ? TROC_VALEUR : 0) +
    (devisLivre
      ? VALEUR.devis * garde(attenteCoeur)
      : d3 === 1
        ? VALEUR.devis * garde(attenteLot2)
        : 0) +
    (d6 === 2 ? DERNIERES_DEMANDES_VALEUR : 0);

  const incident = h.uIncident < risqueIncident(latents);
  const coutDefauts =
    latents * COUT_DEFAUT_LIVRE +
    ouverts * COUT_DEFAUT_OUVERT +
    (incident ? (d6 === 1 ? COUT_INCIDENT_PILOTE : COUT_INCIDENT) : 0);
  const objectif =
    valeur -
    surcouts -
    restant * COUT_JH -
    (lancementManque ? LANCEMENT_MANQUE : 0) -
    coutDefauts -
    pertes;

  return {
    semaines,
    objectif,
    valeur,
    surcouts,
    restant,
    glissement,
    glissementTotal,
    lancementManque,
    defautsLivres: latents,
    defautsOuverts: ouverts,
    coutDefauts,
    incident,
    decoupe,
    report,
    directeurAttend: attend,
    devisImpose,
    saintPriestRefuse: saintPriest,
    demandesAcceptees: accepteJh,
    budgetConsomme: DEPENSE_SEMAINE * SEMAINES + surcouts,
    pertes,
  };
}

/** Ce qui s'est passé pendant des semaines : le directeur, la panne d'ouverture, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    directeurAttend: chemin[D.devis] === 1 && t.directeurAttend && dans(6),
    devisImpose: chemin[D.devis] === 1 && !t.directeurAttend && dans(7),
    // La panne frappe les pilotes en semaine 12, ou tout le monde le jour de l'ouverture.
    incident:
      t.incident &&
      (chemin[D.ouverture] === 1 ? dans(12) : !t.lancementManque && !t.report && dans(13)),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureProjet {
  avancement: number | null;
  raf: number | null;
  demandes: number | null;
  ouverts: number | null;
  budget: number | null;
  /** L'avancement que le plan prévoyait à cette date. */
  plan: number | null;
  budgetADate: number | null;
  /** 1 une fois le périmètre découpé : le reste à faire ne compte plus que l'essentiel. */
  decoupe: number | null;
  /** Le reste à faire abattu par semaine, en moyenne sur les quatre dernières. */
  rythme: number | null;
  /** La part du cœur de l'outil dans le reste à faire. */
  partCoeur: number | null;
  rafTotal: number | null;
}

/** L'avancement que le plan initial prévoyait en fin de semaine. */
export const avancementPrevu = (semaine: number) =>
  Math.min(1, PLAN_DEPART + ((1 - PLAN_DEPART) * semaine) / PLAN_FIN);

/** Ce que Camille lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureProjet {
  if (semaine === 0) {
    return {
      avancement: FAIT_DEPART / (FAIT_DEPART + RAF_COEUR + RAF_LOT2),
      raf: RAF_COEUR + RAF_LOT2,
      demandes: DEMANDES_DEPART,
      ouverts: OUVERTS_DEPART,
      budget: 0,
      plan: PLAN_DEPART,
      budgetADate: 0,
      decoupe: 0,
      rythme: null,
      partCoeur: RAF_COEUR / (RAF_COEUR + RAF_LOT2),
      rafTotal: RAF_COEUR + RAF_LOT2,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const semaines = simuler(chemin, graine, jours).semaines;
  const s = semaines[semaine]!;
  // Le rythme se lit sur les quatre dernières semaines, ou depuis le début s'il y en a moins.
  const recul = Math.min(4, semaine);
  const depart = semaine > 4 ? semaines[semaine - 4]!.rafTotal : RAF_COEUR + RAF_LOT2;
  return {
    avancement: s.avancement,
    raf: s.raf,
    demandes: s.demandes,
    ouverts: s.ouverts,
    budget: s.budget,
    plan: avancementPrevu(semaine),
    budgetADate: (BUDGET * semaine) / SEMAINES,
    decoupe: chemin[D.pilotage] === 1 && semaine >= 8 ? 1 : 0,
    rythme: (depart - s.rafTotal) / recul,
    partCoeur: s.rafCoeur / Math.max(1, s.rafTotal),
    rafTotal: s.rafTotal,
  };
}
