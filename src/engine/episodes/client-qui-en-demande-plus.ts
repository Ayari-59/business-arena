/**
 * LE CLIENT QUI EN DEMANDE TOUJOURS PLUS — le modèle d'une mission au forfait.
 *
 * Atlas Conseil mène chez Morvanel, industriel de l'agroalimentaire (plats
 * cuisinés et conserves, usine de Loudéac), une mission d'excellence
 * opérationnelle vendue au forfait : 420 k€ pour 420 jours. La phase 1
 * (diagnostic, juin-juillet) est livrée et facturée ; restent les phases 2 et
 * 3, de septembre à fin novembre : 330 jours budgétés, 330 k€ d'honoraires,
 * cinq consultants à temps plein (310 jours) et les vingt jours de direction
 * de mission d'Amélie Trégouët. Chaque semaine, le directeur des opérations
 * du client ajoute une demande « rapide ». Treize semaines, six décisions.
 *
 * LE TEMPS NE SE STOCKE PAS, ET LE FORFAIT NE BOUGE PAS. Un jour passé sur une
 * demande hors périmètre est un jour de plus à la charge du cabinet : il
 * coûte son coût de revient (600 €), ne rapporte rien, et fait baisser le
 * TAUX DE RÉALISATION (honoraires rapportés à la valeur des jours passés au
 * TJM du forfait, 1 000 €). Et l'équipe étant pleine, c'est aussi un jour
 * pris au cœur de la mission : les livrables que la sponsor a achetés
 * glissent d'autant.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA DEMANDE ABSORBÉE COÛTE DEUX FOIS. Des jours non facturés (la marge
 *     et le taux de réalisation baissent) et du retard sur le cœur de
 *     mission (la sponsor juge sur les livrables qu'elle a achetés, et une
 *     équipe surchargée finit par livrer une erreur).
 *   · UN AVENANT SE PROPOSE TÔT. Tant que le client a du budget (l'enveloppe
 *     d'amélioration continue de l'usine, à engager avant la revue
 *     budgétaire de fin octobre) et qu'il n'a pas pris l'habitude du
 *     gratuit, un avenant chiffré est souvent signé. Tard, pour régulariser
 *     ce qui a déjà été fait, il passe pour une facture surprise.
 *   · L'ARBITRAGE « CECI PLUTÔT QUE CELA ». Échanger une demande nouvelle
 *     contre un livrable devenu moins utile garde la marge et la relation ;
 *     un registre des demandes tranché par la sponsor fait le même travail
 *     chaque semaine. Dire non sèchement protège la marge et abîme la
 *     relation : le directeur des opérations s'en plaint à sa patronne.
 *   · LA SUITE SE JOUE SUR LA SATISFACTION DE LA SPONSOR. Une deuxième
 *     mission de 300 k€ dépend de son verdict au comité final, tiré au
 *     hasard selon sa satisfaction : les livrables à l'heure, la relation
 *     avec le directeur des opérations, la transparence, et une proposition
 *     qui répond à SES priorités (qu'on ne connaît qu'en les lui demandant).
 *
 * L'OBJECTIF, en euros : la marge à terminaison de la mission (honoraires,
 * avenants compris, moins le coût de revient de tous les jours qu'il faudra
 * pour la finir) plus la valeur espérée de la mission suivante telle que le
 * comité final la laisse : un accord de principe (signé neuf fois sur dix)
 * ou une mise en concurrence (gagnée trois fois sur dix), appliqués à la
 * marge de la suite.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le forfait signé : 420 k€ pour 420 jours, dont la phase 1, livrée et facturée. */
export const FORFAIT = 420_000;
export const PHASE1 = { jours: 90, honoraires: 90_000 } as const;
/** Les phases 2 et 3, le trimestre : 330 jours budgétés, 330 k€ d'honoraires. */
export const JOURS_EQUIPE = 310;
export const JOURS_DIRECTION = 20;
export const JOURS_BUDGET = JOURS_EQUIPE + JOURS_DIRECTION;
export const HONORAIRES = 330_000;
/** Le TJM moyen du forfait : ce que vaut un jour au prix de vente. */
export const TJM = 1_000;
/** Le coût de revient journalier moyen de l'équipe : salaire chargé rapporté aux jours facturables. */
export const COUT_JOUR = 600;
/** Le TJM d'un analyste en régie. */
export const TJM_ANALYSTE = 650;
/** La marge à terminaison prévue au budget. */
export const MARGE_BUDGET = HONORAIRES - JOURS_BUDGET * COUT_JOUR;
/** Ce que l'équipe produit par semaine sur le cœur de mission : 310 jours sur 13 semaines. */
export const CAPACITE = JOURS_EQUIPE / SEMAINES;
/** Le taux de réalisation que la practice vise sur ses forfaits. */
export const OBJECTIF_REALISATION = 0.9;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, le directeur des opérations met deux consultants sur ses demandes. */
export const PERTE_PAR_JOUR = 2 * COUT_JOUR;

/** Les quatre demandes en attente en semaine 1 ; une seule figure déjà au contrat. */
export const DEMANDES = [
  { id: "ligne4", jours: 14, perimetre: false },
  { id: "tableau", jours: 6, perimetre: true },
  { id: "nuit", jours: 8, perimetre: false },
  { id: "stocks", jours: 12, perimetre: false },
] as const;
export const JOURS_DEMANDES = DEMANDES.reduce((s, d) => s + d.jours, 0);
/** Ce qui sort vraiment du périmètre : le tableau de bord des arrêts est déjà au contrat. */
export const HORS_PERIMETRE = DEMANDES.filter((d) => !d.perimetre).reduce((s, d) => s + d.jours, 0);
/** Le taux de réalisation si les demandes en cours sont toutes absorbées gratuitement : ce que la semaine 1 demande. */
export const REALISATION_SI_ABSORBE = HONORAIRES / ((JOURS_BUDGET + HORS_PERIMETRE) * TJM);

/** L'accompagnement du démarrage de la ligne de surgelés, demandé en semaine 3. */
export const DEMARRAGE = 24;
/** Le benchmark des quatre usines, livrable du lot 3 que l'échange retirerait. */
export const BENCHMARK = 30;
/** La présentation des résultats au comité exécutif du groupe, demandée en semaine 11. */
export const PRESENTATION = 6;
/** L'entretien de cadrage de la suite avec la sponsor : préparation comprise. */
export const ENTRETIEN = 2;
/** Le renfort : un consultant de la practice, à former, qui reprend du retard tant qu'il y en a. */
export const RENFORT = { cout: 9, rattrapage: 27 } as const;
/** Former l'analyste de l'usine à produire le reporting elle-même. */
export const TRANSFERT = 2;

/** La deuxième mission que la sponsor envisage, et ce que vaut son verdict. */
export const SUITE = {
  honoraires: 300_000,
  tauxMarge: 0.35,
  /** Un accord de principe au comité final : signé neuf fois sur dix. */
  signature: 0.9,
  /** Une mise en concurrence avec Halden Partners et Kéroual Consulting : gagnée trois fois sur dix. */
  concurrence: 0.3,
  remise: 0.1,
} as const;
export const MARGE_SUITE = SUITE.honoraires * SUITE.tauxMarge;
export const MARGE_SUITE_REMISEE = SUITE.honoraires * (SUITE.tauxMarge - SUITE.remise);

/** La satisfaction de la sponsor en septembre, après une phase 1 bien reçue, sur 100. */
export const SATISFACTION_DEPART = 62;
/** La provision pour aléas du plan : trente jours d'équipe, que le retard consomme avant de se voir. */
export const PROVISION = 30;
/** Ce que coûte à la satisfaction chaque semaine de retard du cœur au-delà de la provision. */
export const POIDS_RETARD = 6;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  demandes: 0,
  demarrage: 1,
  comite: 2,
  coupsDeMain: 3,
  suite: 4,
  presentation: 5,
} as const;

/** Ne rien changer, décision par décision : laisser les demandes passer. */
export const NEUTRE = [3, 0, 0, 0, 2, 0] as const;

/** La chance qu'un avenant soit signé : tôt, avec du budget, avant l'habitude du gratuit. */
export const AVENANT_SEMAINE1 = 0.7;
export function chanceAvenantDemarrage(chemin: readonly number[]): number {
  if (chemin[D.demarrage] !== 1) return 0;
  const d1 = chemin[D.demandes];
  // Le cadre posé en semaine 1 rend l'avenant normal ; trois semaines de gratuit le rendent incongru.
  return d1 === 1 ? 0.88 : d1 === 2 ? 0.6 : 0.45;
}
/**
 * Une régularisation après coup : une facture surprise. Payée à moitié une fois sur quatre
 * quand elle reste modeste, d'autant plus rarement qu'elle est grosse.
 */
export const REGULARISATION = { chance: 0.25, part: 0.5, seuil: 20 } as const;
export const chanceRegularisation = (absorbes: number) =>
  absorbes <= 5 ? 0 : REGULARISATION.chance * Math.min(1, REGULARISATION.seuil / absorbes);
/** Le reporting en régie : le directeur des opérations accepte de payer ce qu'il avait gratuitement un peu plus d'une fois sur deux. */
export const REGIE = 0.55;

/** La fuite par le bas : les coups de main de l'équipe aux chefs d'atelier, en jours par semaine. */
export const fuiteDeBase = (w: number) => (w >= 3 ? 1.5 + 0.25 * (w - 3) : 0);

/** Les coups de main déjà donnés en fin de semaine 7, et ceux à venir si rien ne change. */
export const sommeFuite = (de: number, a: number) => {
  let s = 0;
  for (let w = de; w <= a; w += 1) s += fuiteDeBase(w);
  return s;
};
export const FUITE_A_VENIR = sommeFuite(8, SEMAINES);

/** Le risque que le directeur des opérations se plaigne à la sponsor, lu sur la relation en semaine 8. */
export const risqueEscalade = (relation: number, gouvernance: boolean) =>
  Math.min(0.75, Math.max(0, -relation * 0.07)) * (gouvernance ? 0.3 : 1);
/** Le risque qu'une équipe surchargée livre une erreur, lu sur les jours détournés jusqu'en semaine 9. */
export const risqueErreur = (detournes: number) =>
  Math.min(0.6, Math.max(0, (detournes - 20) * 0.012));

/** La chance d'un accord de principe sur la suite, selon la satisfaction et l'adéquation de la proposition. */
export const chanceDeSuite = (satisfaction: number, adequation: number) =>
  Math.min(0.92, Math.max(0.05, (satisfaction - 30) / 60) * adequation);

/** Les deux priorités entre lesquelles la sponsor hésite pour l'an prochain. */
export const PRIORITES = { consolider: 0.5 } as const;
/** L'adéquation de la proposition de suite à la priorité de la sponsor. */
export function adequation(d5: number, consolider: boolean): number {
  if (d5 === 1) return 1;
  if (d5 === 2) return 0.7;
  if (d5 === 3) return consolider ? 1.1 : 0.6;
  return consolider ? 1 : 0.55;
}

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * `jours` : jours passés sans avancer, à la charge de la mission ; `retard` :
 * ce que le cœur de mission prend de retard.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  jours: number;
  retard: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "audit",
    titre: "Audit de certification de l'usine",
    de: "Gwendal Le Moal",
    role: "Responsable qualité, usine de Loudéac",
    texte:
      "L'auditeur de certification est là toute la semaine : les chefs d'équipe sont mobilisés, nos ateliers avec vous sont annulés.",
    jours: 4,
    retard: 6,
  },
  {
    id: "grippe",
    titre: "Une consultante arrêtée",
    de: "Rokia Keïta",
    role: "Manager de la mission, Atlas Conseil",
    texte:
      "Mai-Linh a la grippe, elle est arrêtée jusqu'à vendredi. Ses ateliers de la ligne 1 sont décalés d'une semaine.",
    jours: 0,
    retard: 5,
  },
  {
    id: "panne",
    titre: "Panne de l'autoclave de la ligne 3",
    de: "Alan Castanyer",
    role: "Chef d'atelier, ligne 3",
    texte:
      "L'autoclave de la ligne 3 est en panne, la ligne est arrêtée quatre jours : les essais de changement de série sont reportés.",
    jours: 3,
    retard: 6,
  },
  {
    id: "avantVente",
    titre: "Une avant-vente urgente",
    de: "Lothaire Demazure",
    role: "Associé, practice Performance opérationnelle",
    texte:
      "J'ai besoin de Théodule trois jours pour le mémoire technique d'Achats Publics de l'Ouest. Je sais que ça tombe mal.",
    jours: 0,
    retard: 3,
  },
  {
    id: "rappel",
    titre: "Retrait d'un lot de plats cuisinés",
    de: "Brieuc Guilcher",
    role: "Directeur des opérations, Morvanel",
    texte:
      "On retire un lot de plats cuisinés des magasins, par précaution. Tout l'encadrement de l'usine est sur la crise cette semaine.",
    jours: 3,
    retard: 4,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Les demandes « rapides » du directeur des opérations, en jours, semaine par semaine. */
  demandes: readonly number[];
  uAvenant1: number;
  uAvenant2: number;
  uRegularisation: number;
  uRegie: number;
  uEscalade: number;
  uErreur: number;
  /** La priorité de la sponsor pour l'an prochain : consolider Loudéac, ou déployer aux autres usines. */
  uPriorite: number;
  /** Le verdict de la sponsor au comité final. */
  uSuite: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000639 + 7);
  const demandes: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) demandes.push(1.5 + 3 * r());
  const uAvenant1 = r();
  const uAvenant2 = r();
  const uRegularisation = r();
  const uRegie = r();
  const uEscalade = r();
  const uErreur = r();
  const uPriorite = r();
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
    demandes,
    uAvenant1,
    uAvenant2,
    uRegularisation,
    uRegie,
    uEscalade,
    uErreur,
    uPriorite,
    uSuite,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

export const avenant1Signe = (chemin: readonly number[], graine: number) =>
  chemin[D.demandes] === 1 && hasard(graine).uAvenant1 < AVENANT_SEMAINE1;
export const avenant2Signe = (chemin: readonly number[], graine: number) =>
  hasard(graine).uAvenant2 < chanceAvenantDemarrage(chemin);
export const regieAcceptee = (chemin: readonly number[], graine: number) =>
  chemin[D.coupsDeMain] === 2 && hasard(graine).uRegie < REGIE;
export const priorite = (graine: number): "consolider" | "deployer" =>
  hasard(graine).uPriorite < PRIORITES.consolider ? "consolider" : "deployer";

export type Semaine = {
  /** Le taux de réalisation à terminaison, si plus rien ne s'ajoute. */
  realisation: number;
  /** La marge à terminaison, si plus rien ne s'ajoute. */
  marge: number;
  /** Le retard du cœur de mission sur le plan, en jours d'équipe. */
  retard: number;
  /** Les jours hors périmètre absorbés gratuitement depuis septembre, coups de main compris. */
  absorbes: number;
  /** La satisfaction de la sponsor, sur 100. */
  satisfaction: number;
  /** Les honoraires ajoutés au forfait : avenants et régie. */
  avenants: number;
  /** Les jours absorbés dans la semaine. */
  semaine: number;
  /** Les coups de main de l'équipe aux ateliers, cumulés. */
  fuite: number;
  /** La relation avec le directeur des opérations, de −15 à +10. */
  relation: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La marge à terminaison plus la valeur espérée de la suite. */
  objectif: number;
  marge: number;
  realisation: number;
  honoraires: number;
  avenants: number;
  /** Tous les jours qu'il faudra pour finir les phases 2 et 3. */
  joursTerminaison: number;
  absorbes: number;
  fuite: number;
  /** Le retard du cœur au comité final, en jours d'équipe. */
  retardFinal: number;
  satisfaction: number;
  relation: number;
  chanceSuite: number;
  suiteAccordee: boolean;
  valeurSuite: number;
  avenant1: boolean;
  avenant2: boolean;
  regularisation: boolean;
  regie: boolean;
  escalade: boolean;
  erreur: boolean;
  consolider: boolean;
  pertes: number;
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const RELATION = { min: -15, max: 10 } as const;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const signe1 = avenant1Signe(chemin, graine);
  const signe2 = d2 === 1 && avenant2Signe(chemin, graine);
  const regie = regieAcceptee(chemin, graine);
  const consolider = priorite(graine) === "consolider";
  const pertes = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const gouvernance = d3 === 1;

  let absorbes = 0;
  let fuite = 0;
  let joursEnPlus = 0;
  let joursFactures = 0;
  let avenants = 0;
  let retard = 0;
  let relation = 0;
  let evenements = 0;
  let regularisation = false;
  let escalade = false;
  let erreur = false;
  let renfort = 0;
  const semaines: (Semaine | null)[] = [null];

  // La relation se forme dès la réponse de la semaine 1.
  if (d1 === 0) relation += 5;
  if (d1 === 1) relation += signe1 ? 2 : -2;
  // Refuser en bloc, c'est refuser aussi le tableau de bord, qui était au contrat.
  if (d1 === 2) relation -= 7;
  if (d1 === 3) relation -= 1;

  for (let w = 1; w <= SEMAINES; w += 1) {
    let absorbe = 0;
    let facture = 0;
    let honoraires = 0;
    let retardSemaine = 0;

    // Les quatre demandes de la semaine 1 : 34 jours hors périmètre.
    if (d1 === 0 && w >= 2 && w <= 5) absorbe += HORS_PERIMETRE / 4;
    if (d1 === 3 && w >= 3 && w <= 6) absorbe += (HORS_PERIMETRE * 0.6) / 4;
    if (signe1 && w >= 2 && w <= 7) {
      facture += HORS_PERIMETRE / 6;
      honoraires += (HORS_PERIMETRE / 6) * TJM;
    }

    // Le démarrage de la ligne de surgelés : 24 jours, semaines 4 à 6.
    if (d2 === 1 && w === 4) relation += signe2 ? 2 : -2;
    if ((d2 === 0 || d2 === 2) && w >= 4 && w <= 6) absorbe += DEMARRAGE / 3;
    if (signe2 && w >= 4 && w <= 6) {
      facture += DEMARRAGE / 3;
      honoraires += (DEMARRAGE / 3) * TJM;
    }
    if ((d2 === 0 || d2 === 2) && w === 4) relation += 3;
    if (d2 === 3 && w === 4) relation -= 4;
    // L'échange : le benchmark des quatre usines sort du périmètre.
    if (d2 === 2 && w === 6) {
      retardSemaine -= BENCHMARK;
      joursEnPlus -= BENCHMARK;
    }

    // Le comité de pilotage intermédiaire, en semaine 6 : ses suites à partir de la semaine 7.
    if (w === 7) {
      if (d3 === 1 && d1 !== 1) relation -= 1;
      if (d3 === 2) {
        relation -= 5;
        regularisation = h.uRegularisation < chanceRegularisation(absorbes);
        if (regularisation) {
          honoraires += absorbes * REGULARISATION.part * TJM;
        }
      }
    }

    // Les demandes « rapides » de la semaine, selon la façon dont on les traite.
    if (w >= 2 && w <= 12) {
      const f = h.demandes[w]!;
      let mode = d1 === 1 ? "registre" : d1 === 2 ? "refus" : "filDeLEau";
      if (w >= 7 && d3 === 1) mode = "registre";
      if (mode === "filDeLEau") {
        absorbe += f;
        relation += 0.15 * f;
      } else if (mode === "registre") {
        // Le directeur trie lui-même ce qui a un prix ; la moitié de ce qui reste est
        // facturée, un tiers échangée contre un livrable moins utile, le reste offert.
        const g = f * (w >= 7 && gouvernance ? 0.35 : 0.5);
        facture += 0.5 * g;
        honoraires += 0.5 * g * TJM;
        absorbe += 0.2 * g;
        relation += 0.05 * g;
      } else {
        relation -= 0.25 * f * 0.4;
      }
    }

    // La fuite par le bas : les coups de main de l'équipe aux chefs d'atelier.
    let coupDeMain = fuiteDeBase(w);
    if (w >= 8) {
      if (d4 === 1) coupDeMain = (w === 8 ? TRANSFERT : 0) + 0.3;
      if (d4 === 3) {
        // Interdits de coups de main, les chefs d'atelier rendent leurs relevés en retard.
        coupDeMain = 0;
        retardSemaine += 1;
      }
      if (regie) {
        facture += coupDeMain;
        honoraires += coupDeMain * TJM_ANALYSTE;
        coupDeMain = 0;
      }
    }
    if (w === 8) {
      if (d4 === 0) relation += 1;
      if (d4 === 1) relation += 2;
      if (d4 === 2) relation += regie ? 1 : -1;
      if (d4 === 3) relation -= 5;
    }

    // La suite : l'entretien de cadrage prend deux jours de direction de mission.
    if (d5 === 1 && w === 10) joursEnPlus += ENTRETIEN;

    // La présentation au comité exécutif du groupe.
    if ((d6 === 0 || d6 === 1) && w >= 12) absorbe += PRESENTATION / 2;
    if (w === 12) {
      if (d6 === 0 || d6 === 1) relation += 2;
      if (d6 === 2) relation -= 1;
      if (d6 === 3) relation -= 3;
    }

    // Les imprévus.
    for (const i of h.imprevus) {
      if (i.semaine === w) {
        joursEnPlus += i.imprevu.jours;
        retardSemaine += i.imprevu.retard;
      }
    }

    // L'escalade : un directeur des opérations froissé se plaint à sa patronne.
    if (w === 8 && h.uEscalade < risqueEscalade(relation, gouvernance && w >= 7)) {
      escalade = true;
      evenements -= 6;
    }
    // L'erreur : une équipe qui court finit par livrer un standard faux.
    if (w === 10 && h.uErreur < risqueErreur(absorbes + fuite)) {
      erreur = true;
      evenements -= 7;
    }
    if (erreur && (w === 10 || w === 11)) absorbe += 3;

    absorbes += absorbe;
    fuite += coupDeMain;
    joursEnPlus += absorbe + coupDeMain;
    joursFactures += facture;
    avenants += honoraires;
    retard += absorbe + coupDeMain + retardSemaine;

    // Le renfort, décidé au comité : il reprend le retard tant qu'il y en a, et coûte sa formation.
    if (d3 === 3 && w >= 7) {
      if (w === 7) joursEnPlus += RENFORT.cout;
      const reprise = Math.min(
        Math.max(0, retard),
        RENFORT.rattrapage / 7,
        RENFORT.rattrapage - renfort,
      );
      renfort += reprise;
      retard -= reprise;
    }

    relation = borne(relation, RELATION.min, RELATION.max);
    const joursTerminaison = JOURS_BUDGET + joursEnPlus + joursFactures;
    const total = HONORAIRES + avenants;
    let satisfaction =
      SATISFACTION_DEPART +
      relation -
      (POIDS_RETARD * Math.max(0, retard - PROVISION)) / CAPACITE +
      evenements;
    if (w >= 7 && d3 === 1) satisfaction += 6;
    if (w >= 7 && d3 === 2) satisfaction -= 8;
    if (w >= 6 && d2 === 2) satisfaction -= 2;
    if (w >= 10 && d5 === 1) satisfaction += 2;
    semaines.push({
      realisation: total / (joursTerminaison * TJM),
      marge: total - joursTerminaison * COUT_JOUR - pertes,
      retard,
      absorbes: absorbes + fuite,
      satisfaction: borne(satisfaction, 0, 100),
      avenants,
      semaine: absorbe + coupDeMain,
      fuite,
      relation,
    });
  }

  // Le geste de la semaine 11 : il ne vaut que si l'essentiel est livré à l'heure.
  const s13 = semaines[SEMAINES]!;
  let satisfaction = s13.satisfaction;
  if (d6 === 1) satisfaction += semaines[11]!.retard - PROVISION <= CAPACITE ? 5 : 1;
  satisfaction = borne(satisfaction, 0, 100);
  semaines[SEMAINES] = { ...s13, satisfaction };

  const joursTerminaison = JOURS_BUDGET + joursEnPlus + joursFactures;
  const honoraires = HONORAIRES + avenants;
  const marge = honoraires - joursTerminaison * COUT_JOUR - pertes;
  const chance = chanceDeSuite(satisfaction, adequation(d5!, consolider));
  const suiteAccordee = h.uSuite < chance;
  const margeSuite = d5 === 3 ? MARGE_SUITE_REMISEE : MARGE_SUITE;
  const valeurSuite = (suiteAccordee ? SUITE.signature : SUITE.concurrence) * margeSuite;

  return {
    semaines,
    objectif: marge + valeurSuite,
    marge,
    realisation: honoraires / (joursTerminaison * TJM),
    honoraires,
    avenants,
    joursTerminaison,
    absorbes: absorbes + fuite,
    fuite,
    retardFinal: Math.max(0, retard),
    satisfaction,
    relation,
    chanceSuite: chance,
    suiteAccordee,
    valeurSuite,
    avenant1: signe1,
    avenant2: signe2,
    regularisation,
    regie,
    escalade,
    erreur,
    consolider,
    pertes,
  };
}

/** Ce qui s'est passé pendant des semaines : les réponses du client, les suites, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    avenant2: chemin[D.demarrage] === 1 && dans(4) ? t.avenant2 : null,
    regularisation: chemin[D.comite] === 2 && dans(7) ? t.regularisation : null,
    escalade: t.escalade && dans(8),
    erreur: t.erreur && dans(10),
    priorite: chemin[D.suite] === 1 && dans(10) ? (t.consolider ? "consolider" : "deployer") : null,
    verdict: dans(13) ? t.suiteAccordee : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureMission {
  realisation: number | null;
  marge: number | null;
  retard: number | null;
  absorbes: number | null;
  satisfaction: number | null;
  avenants: number | null;
  fuite: number | null;
  relation: number | null;
  /** 1 si l'avenant de septembre est signé. */
  avenant1: number | null;
}

/** Ce qu'Amélie lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureMission {
  if (semaine === 0) {
    return {
      realisation: 1,
      marge: MARGE_BUDGET,
      retard: 0,
      absorbes: 0,
      satisfaction: SATISFACTION_DEPART,
      avenants: 0,
      fuite: 0,
      relation: 0,
      avenant1: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    realisation: s.realisation,
    marge: s.marge,
    retard: s.retard,
    absorbes: s.absorbes,
    satisfaction: s.satisfaction,
    avenants: s.avenants,
    fuite: s.fuite,
    relation: s.relation,
    avenant1: t.avenant1 ? 1 : 0,
  };
}
