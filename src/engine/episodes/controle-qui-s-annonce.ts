/**
 * LE CONTRÔLE QUI S'ANNONCE — le modèle de la conformité d'une filiale.
 *
 * Arvel Négoce Rhône, filiale d'Arvel Distribution à Vénissieux : quatre
 * agences, environ 500 factures fournisseurs par semaine. L'administration
 * annonce un contrôle sur place en semaine 8, sur les délais de paiement et la
 * facturation. Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · UN ÉCART QU'ON MONTRE COÛTE MOINS QU'UN ÉCART QU'ON TROUVE. L'amende
 *     dépend de ce que le contrôleur mesure, mais aussi de ce qu'il constate
 *     de l'attitude de l'entreprise : des écarts identifiés à l'avance,
 *     documentés et assortis d'un plan de correction daté sont sanctionnés
 *     bien moins lourdement que ceux qu'il découvre seul. Encore faut-il
 *     savoir ce qu'il va trouver : l'autodiagnostic ne vaut que ce que vaut
 *     l'audit interne qui l'a précédé.
 *   · LES RETARDS VIENNENT DU CIRCUIT, PAS DE LA CAISSE. Les factures
 *     attendent des semaines un bon pour accord en agence, puis une signature
 *     unique au-delà de 5 000 €. Payer l'arriéré en urgence vide le stock
 *     pour trois semaines ; le circuit le remplit aussitôt. Seule la
 *     correction du circuit (validation suivie, délégations de signature)
 *     fait baisser durablement le taux de retard — et le taux que le
 *     contrôleur mesure. Geler les paiements « le temps de vérifier » est la
 *     pire réponse : tout ce qui échoit pendant le gel est payé en retard.
 *   · MAQUILLER UN DOSSIER EST UN RISQUE GRAVE, JAMAIS UNE ÉCONOMIE. Faire
 *     antidater des accords de remise efface les écarts sur le papier, mais
 *     coûte du temps et des clients ; et le contrôleur peut interroger les
 *     artisans. Découvert — un tirage —, le faux fait basculer le dossier :
 *     amende multipliée, avocat, confiance perdue sur tout le reste.
 *
 * Après le contrôle, une injonction de mise en conformité et, une fois sur
 * deux, un contrôle de suite en semaine 13 : former les équipes au nouveau
 * circuit est ce qui évite la récidive.
 *
 * Le trimestre est jugé en euros : l'écart au budget de conformité prévu
 * (pénalités et intérêts de retard, amendes, mise en conformité, temps des
 * équipes). Pur et déterministe : une même graine donne les mêmes tirages,
 * quelles que soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Factures fournisseurs reçues par semaine, toutes agences confondues. */
export const FACTURES = 500;
/** La part des factures payées au-delà du délai légal, au départ. */
export const TAUX_DEPART = 0.18;
/** Ce que mesure le contrôleur sur les mois qui précèdent le trimestre. */
const TAUX_HISTORIQUE = 0.18;
export const OBJECTIF_TAUX = 0.05;
/** Les factures échues non payées, au départ. */
export const ECHUES_DEPART = 420;
/** Un taux de retard donné laisse, à l'équilibre, ce stock de factures échues. */
const STOCK_PAR_TAUX = FACTURES * 4.7;
/** L'indemnité forfaitaire de 40 €, réclamée par un fournisseur sur deux. */
const INDEMNITE = 20;
/** Les intérêts de retard d'une facture échue, par semaine. */
const INTERETS = 6;
/** Les remises exceptionnelles accordées sans écrit sur douze mois. */
export const REMISES = 60;
/** Celles que le sondage de la semaine dernière a déjà repérées. */
export const REMISES_REPEREES = 38;
/** L'amende, par point de taux de retard mesuré au-delà de 5 %. */
export const AMENDE_PAR_POINT = 4000;
/** L'amende pour une remise sans justificatif que le contrôleur trouve. */
export const AMENDE_REMISE = 600;
/** Une remise régularisée et signalée avant le contrôle. */
export const AMENDE_REMISE_SIGNALEE = 100;
/** Une remise régularisée, mais que le contrôleur a dû aller chercher. */
export const AMENDE_REMISE_REGULARISEE = 250;
/** Le budget de conformité du trimestre : pénalités habituelles et provision pour le contrôle. */
export const BUDGET = 95000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, les factures continuent d'attendre. */
export const PERTE_PAR_JOUR = 1200;
/** Ce que coûte un manquement à l'injonction au contrôle de suite. */
export const AMENDE_SUITE = 15000;
export const AMENDE_SUITE_REMISE = 500;
/** Un faux découvert : l'avocat pénaliste, et le temps de la direction. */
export const COUT_PENAL = 15000;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  audit: 0,
  circuit: 1,
  remises: 2,
  controle: 3,
  rapport: 4,
  suite: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 2, 2] as const;

export const COUTS = {
  auditCible: 4500,
  cabinet: 14000,
  auditExhaustif: 3500,
  gel: 3000,
  refonte: 10000,
  delegations: 1500,
  rattrapage: 3500,
  documenter: 2500,
  nettoyer: 5000,
  note: 1500,
  avocat: 6000,
  reponse: 1000,
  contestation: 7000,
  formation: 3000,
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
  effet: { retard?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "arret",
    titre: "Arrêt maladie à la comptabilité fournisseurs",
    de: "Bérénice Hoarau",
    role: "Responsable de la comptabilité fournisseurs",
    texte:
      "Joëlle est arrêtée deux semaines. Ses fournisseurs sont répartis sur les trois autres : les saisies prennent du retard.",
    duree: 2,
    effet: { retard: 0.03 },
  },
  {
    id: "logiciel",
    titre: "Panne du logiciel comptable",
    de: "Service informatique",
    role: "Siège",
    texte:
      "Le logiciel comptable est resté indisponible deux jours en pleine échéance : aucun virement n'est parti.",
    duree: 1,
    effet: { retard: 0.05 },
  },
  {
    id: "indemnites",
    titre: "Un fournisseur réclame ses indemnités",
    de: "Bérénice Hoarau",
    role: "Responsable de la comptabilité fournisseurs",
    texte:
      "Un fournisseur de carrelage nous réclame d'un coup les indemnités forfaitaires de 40 € sur 150 factures de l'année : 6 000 €, qu'il est en droit d'exiger.",
    duree: 1,
    effet: { cout: 6000 },
  },
  {
    id: "courrier",
    titre: "Grève des services postaux",
    de: "Accueil de l'agence de Vénissieux",
    role: "Courrier",
    texte:
      "Grève du courrier : une semaine de factures papier arrive d'un coup, déjà proches de l'échéance.",
    duree: 1,
    effet: { retard: 0.04 },
  },
  {
    id: "rib",
    titre: "Tentative de fraude au changement de RIB",
    de: "Bérénice Hoarau",
    role: "Responsable de la comptabilité fournisseurs",
    texte:
      "Un faux courrier d'un fournisseur demande de changer ses coordonnées bancaires. Repéré à temps, mais tous ses paiements sont suspendus le temps de vérifier.",
    duree: 1,
    effet: { retard: 0.02, cout: 1500 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** L'aléa du taux de retard de la semaine : échéances groupées, absences, courrier. */
  retard: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Le fournisseur de plaques suspend-il ses livraisons si les paiements sont gelés ? */
  uFournisseur: number;
  /** Le prestataire tient-il sa date de mise en service ? */
  uPrestataire: number;
  /** Le contrôleur découvre-t-il des accords antidatés ? */
  uDecouverte: number;
  /** L'échantillon du contrôleur : il tire plus ou moins de factures en retard. */
  echantillon: number;
  /** La part des remises sans justificatif que le contrôleur retrouve. */
  uRemises: number;
  /** L'administration revient-elle sur l'extrapolation qu'on conteste ? */
  uContestation: number;
  /** Y a-t-il un contrôle de suite en semaine 13 ? */
  uSuite: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000159 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({ retard: Math.min(1.15, Math.max(0.85, 1 + 0.06 * gauss(r))) });
  }
  const uFournisseur = r();
  const uPrestataire = r();
  const uDecouverte = r();
  const echantillon = Math.min(2, Math.max(-2, gauss(r)));
  const uRemises = r();
  const uContestation = r();
  const uSuite = r();
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
    uFournisseur,
    uPrestataire,
    uDecouverte,
    echantillon,
    uRemises,
    uContestation,
    uSuite,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux, le fournisseur de plaques suspend ses livraisons quand les paiements gèlent. */
export const fournisseurSuspend = (chemin: readonly number[], graine: number) =>
  chemin[D.audit] === 2 && hasard(graine).uFournisseur < 0.5;

/** Trois fois sur dix, la mise en service du nouveau circuit glisse de trois semaines. */
export const CHANCE_DE_GLISSEMENT = 0.3;
export const refonteGlisse = (chemin: readonly number[], graine: number) =>
  chemin[D.circuit] === 0 && hasard(graine).uPrestataire < CHANCE_DE_GLISSEMENT;

/** Un peu moins d'une fois sur deux, le contrôleur retrouve les accords antidatés. */
export const CHANCE_DE_DECOUVERTE = 0.45;
export const nettoyageDecouvert = (chemin: readonly number[], graine: number) =>
  chemin[D.remises] === 1 && hasard(graine).uDecouverte < CHANCE_DE_DECOUVERTE;

/** Une fois sur cinq, l'administration revient sur une partie de l'extrapolation contestée. */
export const contestationEntendue = (graine: number) => hasard(graine).uContestation < 0.2;

/** Une fois sur deux, l'administration revient vérifier en semaine 13 que l'injonction est suivie. */
export const controleDeSuite = (graine: number) => hasard(graine).uSuite < 0.5;

/**
 * CE QUE L'AUDIT INTERNE A APPRIS AVANT LA VENUE DU CONTRÔLEUR : la part des
 * écarts (retards et leurs causes, remises) qu'on peut lui présenter soi-même.
 * L'audit ciblé, priorisé par risque, a fini en semaine 3. L'audit exhaustif
 * finit en semaine 8 : trop tard pour une note construite.
 */
export function connaissance(chemin: readonly number[]): number {
  return [0.9, 0.6, 0.35, 0][chemin[D.audit]!] ?? 0;
}

/** Les remises sans justificatif connues en semaine 5, quand il faut décider quoi en faire. */
export function remisesConnues(chemin: readonly number[]): number {
  return [56, 46, REMISES_REPEREES, REMISES_REPEREES][chemin[D.audit]!] ?? REMISES_REPEREES;
}

export type Semaine = {
  /** La part des factures de la semaine payées au-delà du délai légal. */
  retard: number;
  /** Délai moyen de paiement, en jours. */
  delai: number;
  /** Factures échues non payées en fin de semaine. */
  echues: number;
  /** Remises sans justificatif apparentes dans les dossiers. */
  remises: number;
  /** Ce que la semaine a coûté : pénalités, intérêts, amendes, mise en conformité, temps. */
  cout: number;
  /** Les coûts cumulés depuis le début du trimestre. */
  couts: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de conformité : positif, la filiale est restée sous le budget. */
  objectif: number;
  couts: number;
  /** Pénalités et intérêts de retard payés aux fournisseurs. */
  penalites: number;
  amendeDelais: number;
  amendeRemises: number;
  amendeSuite: number;
  /** Le taux de retard que le contrôleur a mesuré sur son échantillon. */
  tauxControle: number;
  /** Ce que l'attitude de la filiale a fait à l'amende : 1, ni bonus ni malus. */
  coefficient: number;
  /** Les remises sans justificatif que le contrôleur a relevées lui-même. */
  remisesRelevees: number;
  /** Les paiements ont été gelés en semaines 2 et 3. */
  gel: boolean;
  fournisseurSuspend: boolean;
  /** Le circuit a été refondu ; sa mise en service a-t-elle glissé ? */
  refonte: boolean;
  refonteGlisse: boolean;
  /** Des accords de remise ont été antidatés ; le contrôleur l'a-t-il découvert ? */
  nettoyage: boolean;
  nettoyageDecouvert: boolean;
  /** La contestation du procès-verbal a été entendue. */
  contestationEntendue: boolean;
  controleDeSuite: boolean;
  /** Le contrôle de suite a relevé un manquement à l'injonction. */
  suiteManquee: boolean;
  retardFinal: number;
  /** Le taux de retard moyen des semaines 1 à 8, celles que le contrôleur examine. */
  retardControle: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Le circuit corrigé fait-il effet cette semaine ? */
function circuit(
  chemin: readonly number[],
  graine: number,
  w: number,
): "refonte" | "delegations" | null {
  const d2 = chemin[D.circuit];
  if (d2 === 0 && w >= (refonteGlisse(chemin, graine) ? 9 : 6)) return "refonte";
  if (d2 === 1 && w >= 4) return "delegations";
  return null;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const suspend = fournisseurSuspend(chemin, graine);
  const glisse = refonteGlisse(chemin, graine);
  const decouvert = nettoyageDecouvert(chemin, graine);
  const suite = controleDeSuite(graine);
  const k = connaissance(chemin);
  const connues = remisesConnues(chemin);
  const semaines: (Semaine | null)[] = [null];

  let echues = ECHUES_DEPART;
  let couts = 0;
  let penalites = 0;
  let sommeControle = 0;
  let tauxControle = 0;
  let coefficient = 1;
  let amendeDelais = 0;
  let amendeRemises = 0;
  let amendeSuite = 0;
  let remisesRelevees = 0;
  let suiteManquee = false;
  // Les remises régularisées, et celles qu'on continue d'accorder sans écrit.
  let documentees = 0;
  let nouvelles = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // LE TAUX DE RETARD : ce que le circuit de validation laisse passer.
    let taux = TAUX_DEPART;
    const c = circuit(chemin, graine, w);
    if (c === "refonte") taux = d1 === 0 || d1 === 1 ? 0.035 : 0.06;
    if (c === "delegations") taux = 0.1;
    // L'audit exhaustif mobilise la comptabilité fournisseurs pendant six semaines.
    if (d1 === 1 && w >= 2 && w <= 7) taux += 0.02;
    // Le gel : tout ce qui échoit pendant deux semaines est payé en retard, puis la file se résorbe.
    if (d1 === 2) {
      if (w === 2) taux = 0.45;
      if (w === 3) taux = 0.38;
      if (w === 4) taux += 0.06;
    }
    // Une fois le contrôleur parti : ce que deviennent les habitudes.
    if (w >= 12) {
      const corrige = c !== null;
      if (d6 === 0) taux *= corrige ? 0.7 : 0.9;
      // Le contrôleur parti, les bannettes du vendredi reviennent.
      if (d6 === 2) taux += 0.035;
    }
    for (const a of actifs) taux += a.imprevu.effet.retard ?? 0;
    taux = borne(taux * n.retard, 0.01, 0.8);
    if (w <= 8) sommeControle += taux;

    // LE STOCK DE FACTURES ÉCHUES : il suit le taux, avec retard.
    echues = 0.5 * echues + 0.5 * STOCK_PAR_TAUX * taux;
    if (d2 === 1 && w === 4) echues *= 0.75; // Les bannettes vidées une première fois.
    if (d2 === 2 && w === 4) echues *= 0.3; // L'arriéré payé en urgence : le stock repartira.
    const penalite = FACTURES * taux * INDEMNITE + echues * INTERETS;
    penalites += penalite;
    cout += penalite;
    for (const a of actifs) cout += w === a.semaine ? (a.imprevu.effet.cout ?? 0) : 0;

    // LE GEL : le fournisseur de plaques suspend ses livraisons, les agences vendent moins.
    if (suspend && (w === 3 || w === 4)) cout += 6000;

    // LES REMISES : régulariser, maquiller, supprimer, ou laisser.
    if (w === 6) {
      if (d3 === 0) documentees = connues;
      if (d3 === 1) documentees = 0;
    }
    if (d1 === 1 && d3 === 0 && w === 8) documentees = REMISES; // L'audit exhaustif finit d'inventorier.
    if (w >= 6) {
      // Les remises qu'on continue d'accorder sans écrit, par semaine.
      const rythme = d3 === 0 ? 0.5 : d3 === 2 ? 0 : 3;
      if (!(d6 === 0 && w >= 12)) nouvelles += rythme;
      if (d6 === 0 && w === 12) nouvelles = 0; // La formation les fait régulariser.
    }
    // Supprimer toutes les remises : des artisans partent chez les concurrents.
    if (d3 === 2 && w >= 6) cout += 2200;
    // Faire signer des accords antidatés : des artisans refusent, et s'en vont.
    if (d3 === 1 && w >= 6) cout += 1000;

    // LE CONTRÔLE : ce que le contrôleur mesure, en semaines 8 et 9.
    if (w === 8) {
      const moyen = sommeControle / 8;
      tauxControle = Math.max(0, 0.5 * TAUX_HISTORIQUE + 0.5 * moyen + 0.012 * h.echantillon);
      const corrigeAuControle = circuit(chemin, graine, 8) !== null;
      const enPlace = c === "refonte";
      if (d4 === 0) coefficient = (1 - 0.5 * k) * (enPlace ? 0.75 : corrigeAuControle ? 0.9 : 1);
      if (d4 === 1) coefficient = 0.95 * (enPlace ? 0.9 : 1);
      if (d4 === 2) coefficient = 1.25;
      if (d4 === 3) coefficient = enPlace ? 0.9 : 1;
      const retrouvees = d4 === 2 ? 0.95 : 0.55 + 0.3 * h.uRemises;
      const restantes = d3 === 1 ? 0 : REMISES - documentees;
      remisesRelevees = Math.round(restantes * retrouvees);
    }
    if (w === 9 && decouvert) {
      // Le faux découvert : le dossier change de nature.
      coefficient = Math.min(1.8, coefficient * 1.4);
      remisesRelevees = REMISES;
      cout += COUT_PENAL;
    }

    // LES OBSERVATIONS au procès-verbal, puis la sanction notifiée en semaine 12.
    if (w === 12) {
      let coef = coefficient;
      if (d5 === 0) coef *= 0.8;
      // Sans observations, l'administration lit un désintérêt pour l'injonction à venir.
      if (d5 === 2) coef *= 1.05;
      if (d5 === 1) coef *= contestationEntendue(graine) ? 0.85 : 1.1;
      amendeDelais = AMENDE_PAR_POINT * Math.max(0, (tauxControle - OBJECTIF_TAUX) * 100) * coef;
      coefficient = coef;
      const parRemise = d4 === 0 ? AMENDE_REMISE_SIGNALEE : AMENDE_REMISE_REGULARISEE;
      amendeRemises =
        (d3 === 0 ? documentees * parRemise : 0) +
        remisesRelevees * AMENDE_REMISE * (decouvert ? 2 : 1);
      cout += amendeDelais + amendeRemises;
    }

    // LE CONTRÔLE DE SUITE, une fois sur deux : l'injonction est-elle suivie ?
    if (w === 13 && suite) {
      const tauxFin = (semaines[12]!.retard + taux) / 2;
      const manquement = tauxFin > 0.06 ? AMENDE_SUITE : 0;
      amendeSuite = manquement + Math.round(nouvelles) * AMENDE_SUITE_REMISE;
      suiteManquee = amendeSuite > 0;
      cout += amendeSuite;
    }

    // CE QUE COÛTENT LES DÉCISIONS : mise en conformité et temps des équipes.
    let depense = 0;
    if (d1 === 0 && w === 2) depense += COUTS.auditCible;
    if (d1 === 1 && w === 2) depense += COUTS.cabinet;
    if (d1 === 1 && w === 8) depense += COUTS.auditExhaustif;
    if (d1 === 2 && w === 2) depense += COUTS.gel;
    if (d2 === 0 && w === 4) depense += COUTS.refonte;
    if (d2 === 1 && w === 4) depense += COUTS.delegations;
    if (d2 === 2 && w === 4) depense += COUTS.rattrapage;
    if (d3 === 0 && w === 6) depense += COUTS.documenter;
    if (d3 === 1 && w === 6) depense += COUTS.nettoyer;
    if (d4 === 0 && w === 8) depense += COUTS.note;
    if (d4 === 1 && w === 8) depense += COUTS.avocat;
    if (d5 === 0 && w === 10) depense += COUTS.reponse;
    if (d5 === 1 && w === 10) depense += COUTS.contestation;
    if (d6 === 0 && w === 12) depense += COUTS.formation;
    // Des avertissements : les chefs d'agence valident sans vérifier, des erreurs passent.
    if (d6 === 1 && w >= 12) depense += 2500;
    cout += depense;
    couts += cout;

    // Ce que les dossiers montrent : les remises inventoriées et pas encore régularisées.
    const inventoriees =
      (d1 === 0 && w >= 3) || (d1 === 1 && w >= 5 && w < 8)
        ? connues
        : d1 === 1 && w >= 8
          ? REMISES
          : REMISES_REPEREES;
    const apparentes =
      (d3 === 1 && w >= 6 ? 0 : Math.max(0, inventoriees - documentees)) + Math.round(nouvelles);

    semaines.push({
      retard: taux,
      delai: 44 + 45 * taux,
      echues,
      remises: apparentes,
      cout,
      couts,
    });
  }

  return {
    semaines,
    objectif: BUDGET - couts,
    couts,
    penalites,
    amendeDelais,
    amendeRemises,
    amendeSuite,
    tauxControle,
    coefficient,
    remisesRelevees,
    gel: d1 === 2,
    fournisseurSuspend: suspend,
    refonte: d2 === 0,
    refonteGlisse: glisse,
    nettoyage: d3 === 1,
    nettoyageDecouvert: decouvert,
    contestationEntendue: d5 === 1 && contestationEntendue(graine),
    controleDeSuite: suite,
    suiteManquee,
    retardFinal: semaines[SEMAINES]!.retard,
    retardControle: sommeControle / 8,
  };
}

/** Ce qui s'est passé pendant des semaines : suites des décisions, et imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    fournisseur: t.fournisseurSuspend && dans(3),
    miseEnService: chemin[D.circuit] === 0 && dans(6),
    decouverte: t.nettoyageDecouvert && dans(9),
    sanction: dans(12),
    suite: t.controleDeSuite && dans(13),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureControle {
  retard: number | null;
  delai: number | null;
  echues: number | null;
  remises: number | null;
  couts: number | null;
  budgetADate: number | null;
  /** Le taux mesuré par le contrôleur, une fois son échantillon tiré (semaine 8). */
  controle: number | null;
  /** Les remises sans justificatif qu'il a relevées. */
  relevees: number | null;
}

/** Ce qu'Émilie lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureControle {
  if (semaine === 0) {
    return {
      retard: TAUX_DEPART,
      delai: 44 + 45 * TAUX_DEPART,
      echues: ECHUES_DEPART,
      remises: REMISES_REPEREES,
      couts: 0,
      budgetADate: 0,
      controle: null,
      relevees: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    retard: s.retard,
    delai: s.delai,
    echues: s.echues,
    remises: s.remises,
    couts: s.couts,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    controle: semaine >= 8 ? t.tauxControle : null,
    relevees: semaine >= 9 ? t.remisesRelevees : null,
  };
}
