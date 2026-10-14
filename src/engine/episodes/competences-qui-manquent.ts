/**
 * LES COMPÉTENCES QUI MANQUENT — le modèle de l'atelier de découpe et de façonnage.
 *
 * Douze opérateurs, une machine de découpe à commande numérique, des
 * commandes sur mesure (plans de travail, panneaux usinés, caissons pour les
 * menuisiers et les agenceurs) qui augmentent chaque semaine. Deux opérateurs
 * savent piloter la machine : René part à la retraite en semaine 9, Joaquim
 * en semaine 12. Treize semaines, six décisions. Trois mécanismes font
 * l'épisode, et le joueur doit les découvrir :
 *
 *   · LE SAVOIR TIENT EN DEUX TÊTES, ET IL MET DES SEMAINES À PASSER. La
 *     maîtrise de la machine se gagne à côté de quelqu'un qui la possède, sur
 *     les vraies pièces, et seulement tant qu'il est là : un binôme lancé en
 *     semaine 2 a sept semaines pour former la relève de René ; lancé après
 *     son départ, il n'en a plus aucune. Les programmes et les réglages que
 *     personne n'a écrits partent avec lui : il faut les refaire, en
 *     sous-traitant ce qu'on n'a pas le temps de refaire.
 *   · UNE FORMATION GÉNÉRIQUE N'APPREND PAS LES VRAIES PIÈCES, ET UN EXPERT
 *     EXTERNE NE CONNAÎT PAS LES NÔTRES. Trois jours chez le fabricant
 *     apprennent l'interface sur des pièces d'exemple : un plafond, pas un
 *     métier. Un opérateur confirmé recruté dehors coûte cher, arrive tard,
 *     une fois sur deux seulement, et doit encore apprendre nos pièces.
 *   · LA POLYVALENCE COÛTE D'ABORD ET PROTÈGE ENSUITE. Former un troisième
 *     pilote prend du temps à l'atelier pendant des semaines, puis couvre une
 *     absence, un apprenti plus lent que prévu, et la hausse du sur-mesure.
 *     Faire tourner tout le monde sur la machine dilue la transmission et
 *     multiplie les reprises.
 *
 * Le trimestre est jugé en euros : la marge des commandes sur mesure faites à
 * l'atelier, moins ce que coûtent les reprises, la formation, le recrutement
 * et la sous-traitance des commandes qu'on n'a pas pu faire, en écart au
 * budget. Transmettre tôt n'y est pas une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const OPERATEURS = 12;
/** La première semaine sans René, puis sans Joaquim. */
export const DEPART_RENE = 9;
export const DEPART_JOAQUIM = 12;
/** Commandes sur mesure par semaine en semaine 1 ; elles augmentent de 2,5 % par semaine. */
export const DEMANDE = 30;
export const HAUSSE = 0.03;
/** La marge d'une commande sur mesure faite à l'atelier, et ce qu'il en reste quand on la sous-traite. */
export const MARGE_COMMANDE = 420;
export const MARGE_SOUS_TRAITEE = 80;
/** Panneau rebuté, reprise, deuxième livraison : ce que coûte une pièce ratée. */
export const COUT_REPRISE = 480;
/** Commandes sur mesure qu'un pilote qui maîtrise la machine fait par semaine. */
export const CAPACITE_PILOTE = 22;
/** Deux postes et leur chevauchement : la machine ne fait pas plus. */
export const CAPACITE_MACHINE = 54;
/** Au-delà de cette maîtrise, un pilote tient la machine seul. */
export const SEUIL_AUTONOME = 0.6;
/** L'enveloppe du trimestre pour la formation, le recrutement et les renforts spécialisés. */
export const ENVELOPPE = 12000;
/** Le budget de marge du sur-mesure sur le trimestre. */
export const BUDGET = 187000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : des commandes sur mesure refusées faute de réponse. */
export const PERTE_PAR_JOUR = 1200;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  savoir: 1,
  polyvalence: 2,
  contrat: 3,
  rene: 4,
  joaquim: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 2, 3, 3] as const;

export const COUTS = {
  /** Le cabinet : la moitié au lancement, l'autre à l'arrivée. */
  cabinet: 3500,
  /** Ce qu'un opérateur confirmé coûte de plus que la grille de l'atelier, par semaine. */
  surcoutRecrue: 600,
  /** Une place à la formation du fabricant, trois jours. */
  formation: 1900,
  /** Les heures que l'atelier rattrape quand un opérateur part trois jours en formation. */
  absenceFormation: 300,
  /** Un apprenti à mi-temps sur la machine : son travail de découpe repris en heures. */
  binome: 350,
  bibliotheque: 4000,
  /** Le troisième pilote, à temps partiel sur la machine. */
  appui: 300,
  rotation: 900,
  /** René en cumul emploi-retraite, deux jours par semaine. */
  cumul: 500,
  prolongation: 6000,
  interim: 2000,
  heuresSup: 900,
} as const;

/** Ce que coûte chaque commande sous-traitée du contrat de l'agenceur : retard et pénalité. */
export const PENALITE_CONTRAT = 400;
export const VOLUME_CONTRAT = [10, 5, 0] as const;
/** Deux semaines de retard de suite sur le contrat : l'agenceur répercute ses pénalités de chantier. */
export const LITIGE = 5000;
/** Au-delà de ce nombre de commandes sous-traitées dans la semaine, le contrat est livré en retard. */
export const SEUIL_RETARD = 2;

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
  effet: { demande?: number; machine?: number; hamzaAbsent?: boolean; novices?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "broche",
    titre: "Panne de la broche de la machine",
    de: "Service maintenance",
    role: "Site de Vénissieux",
    texte:
      "La broche de la machine numérique a lâché mardi : deux jours d'arrêt, le temps que le technicien du fabricant vienne la changer.",
    duree: 1,
    effet: { machine: 0.6 },
  },
  {
    id: "entorse",
    titre: "Hamza en arrêt",
    de: "Hamza Tlili",
    role: "Opérateur de découpe",
    texte:
      "Je me suis tordu la cheville en descendant du quai. Le médecin m'arrête deux semaines, désolé.",
    duree: 2,
    effet: { hamzaAbsent: true },
  },
  {
    id: "promoteur",
    titre: "Une grosse commande d'un promoteur",
    de: "Enguerrand Arnoux",
    role: "Chargé d'affaires sur-mesure",
    texte:
      "Un promoteur de Gerland nous confie les caissons de quarante cuisines de résidence, à livrer en deux semaines.",
    duree: 2,
    effet: { demande: 1.2 },
  },
  {
    id: "melamine",
    titre: "Rupture de panneaux mélaminés",
    de: "Dépôt régional",
    role: "Logistique",
    texte:
      "Le fournisseur de panneaux mélaminés est en rupture une semaine : une partie des commandes sur mesure attend la matière.",
    duree: 1,
    effet: { demande: 0.8 },
  },
  {
    id: "logiciel",
    titre: "Mise à jour du logiciel de la machine",
    de: "Fabricant de la machine",
    role: "Service après-vente",
    texte:
      "Nouvelle version du logiciel de pilotage : les menus ont changé, et les pilotes les moins aguerris tâtonnent une semaine.",
    duree: 1,
    effet: { novices: 0.75 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  reprises: number;
  /** Un tirage d'absence par personne susceptible de piloter : moins de 0,05, absente la semaine. */
  absences: readonly number[];
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** La vitesse à laquelle Hamza, Océane et Abdou apprennent : 1, la moyenne. */
  aptitudes: readonly [number, number, number];
  /** Le cabinet trouve-t-il un opérateur confirmé ? */
  uRecrue: number;
  /** S'il le trouve, arrive-t-il en semaine 10 ou 11 ? */
  uArrivee: number;
  /** René accepte-t-il de rester un peu ? */
  uRene: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000133 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.06 * gauss(r), 0.85, 1.15),
      reprises: borne(1 + 0.2 * gauss(r), 0.5, 1.6),
      absences: [r(), r(), r(), r()],
    });
  }
  const aptitudes: [number, number, number] = [
    borne(1 + 0.25 * gauss(r), 0.5, 1.4),
    borne(1 + 0.25 * gauss(r), 0.5, 1.4),
    borne(1 + 0.25 * gauss(r), 0.5, 1.4),
  ];
  const uRecrue = r();
  const uArrivee = r();
  const uRene = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h = { semaines, aptitudes, uRecrue, uArrivee, uRene, imprevus };
  tirages.set(graine, h);
  return h;
}

/** Une fois sur deux, le cabinet trouve un opérateur confirmé ; il arrive en semaine 10 ou 11. */
export const recrueTrouvee = (graine: number) => hasard(graine).uRecrue < 0.5;
export const semaineRecrue = (graine: number) => (hasard(graine).uArrivee < 0.5 ? 10 : 11);
export const recrueArrive = (chemin: readonly number[], graine: number) =>
  chemin[D.plan] === 0 && recrueTrouvee(graine);

/**
 * RENÉ RESTE-T-IL UN PEU ?
 *
 * Un cumul emploi-retraite de deux jours par semaine, pour transmettre :
 * René l'accepte bien plus souvent quand on lui a déjà confié la relève en
 * binôme, et qu'on lui a demandé d'écrire ce qu'il sait. On ne retient pas
 * quelqu'un à qui on n'a jamais montré que son savoir comptait. Une
 * prolongation à plein temps, elle, bouscule des projets de retraite déjà
 * faits : elle passe rarement, prime ou pas.
 */
export function chanceQueReneReste(chemin: readonly number[]): number {
  const valorise = (chemin[D.plan] === 1 ? 0.35 : 0) + (chemin[D.savoir] === 0 ? 0.15 : 0);
  if (chemin[D.rene] === 0) return 0.3 + valorise;
  if (chemin[D.rene] === 1) return 0.08 + valorise / 6;
  return 0;
}
export const reneReste = (chemin: readonly number[], graine: number) =>
  hasard(graine).uRene < chanceQueReneReste(chemin);

/** La part des commandes qu'un pilote peut faire, selon sa maîtrise : rien en dessous de 0,2. */
export const rendement = (m: number) => borne((m - 0.2) / 0.7, 0, 1);
/** La part de pièces à reprendre, selon la maîtrise du pilote. */
export const tauxReprise = (m: number) => 0.02 + 0.3 * (1 - m) ** 2;

export type Semaine = {
  /** La part des commandes sur mesure faites à l'atelier. */
  service: number;
  demande: number;
  faites: number;
  sousTraitees: number;
  reprises: number;
  /** Les pièces reprises, rapportées aux commandes faites. */
  tauxReprise: number;
  /** La maîtrise moyenne des deux meilleurs pilotes de la relève, de 0 à 1. */
  releve: number;
  /** Les pilotes présents qui tiennent la machine seuls. */
  pilotes: number;
  /** Formation, recrutement, cumul, renforts spécialisés : l'enveloppe consommée, cumulée. */
  depenses: number;
  /** Ce que la semaine apporte : marge, moins reprises, sous-traitance, pénalités et coûts. */
  contribution: number;
  /** Marge nette cumulée depuis le début du trimestre. */
  cumul: number;
  hamza: number;
  oceane: number;
  abdou: number;
  recrue: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge du sur-mesure : positif, l'atelier fait mieux que le budget. */
  objectif: number;
  margeNette: number;
  depenses: number;
  sousTraiteesTotal: number;
  reprisesTotal: number;
  demandeTotale: number;
  serviceMoyen: number;
  /** Le service des semaines 9 à 13, après le premier départ. */
  serviceApres: number;
  tauxRepriseMoyen: number;
  reneReste: boolean;
  recrueArrivee: number | null;
  /** La semaine où l'agenceur a appliqué ses pénalités de chantier, s'il l'a fait. */
  litige: number | null;
  pilotesFinaux: number;
  releveFinale: number;
}

/** Les opérateurs qui peuvent apprendre la machine : leurs maîtrises de départ. */
export const MAITRISES_DEPART = { hamza: 0.15, oceane: 0.12, abdou: 0.08 } as const;
/** Un opérateur confirmé recruté dehors connaît les machines, pas nos pièces. */
export const MAITRISE_RECRUE = 0.55;
/** Un intérimaire spécialisé en commande numérique : il connaît les machines, pas les nôtres. */
export const MAITRISE_INTERIM = 0.6;
/** Ce que trois jours chez le fabricant apprennent : l'interface, sur des pièces d'exemple. */
export const PLAFOND_FORMATION = 0.38;
/** Ce qu'un apprenti gagne en une semaine pleine de binôme, avant aptitude et documentation. */
const RYTHME_BINOME = 0.16;
/** Ce qu'il gagne en pilotant seul : bien moins. */
const RYTHME_PRATIQUE = 0.03;
/** La part des commandes sur mesure qui sont des pièces complexes : usinages, assemblages, formes. */
export const PART_COMPLEXE = 0.25;
/** La part des pièces complexes qu'un pilote sait faire, selon sa maîtrise. */
export const habilitation = (m: number) => borne((m - 0.55) / 0.35, 0, 1);

type Apprenant = "hamza" | "oceane" | "abdou" | "recrue";

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const reste = reneReste(chemin, graine);
  const arriveeRecrue = recrueArrive(chemin, graine) ? semaineRecrue(graine) : null;
  const semaines: (Semaine | null)[] = [null];
  const m: Record<Apprenant, number> = { ...MAITRISES_DEPART, recrue: MAITRISE_RECRUE };
  const aptitude: Record<Apprenant, number> = {
    hamza: h.aptitudes[0],
    oceane: h.aptitudes[1],
    abdou: h.aptitudes[2],
    recrue: 1,
  };
  let cumul = 0;
  let depenses = 0;
  let sousTraiteesTotal = 0;
  let reprisesTotal = 0;
  let demandeTotale = 0;
  let enRetard = 0;
  let litige: number | null = null;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  // Ce que la documentation change : la vitesse d'apprentissage, les programmes retrouvés, les reprises.
  const docRythme = [1.3, 1.08, 1, 1][d2 ?? 3]!;
  const docProgrammes = [1, 0.94, 1, 0.85][d2 ?? 3]!;
  const docReprises = [0.8, 0.95, 0.9, 1][d2 ?? 3]!;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let depense = 0;
    let cout = w === 1 ? perteEnquete : 0;

    // Qui est là : René à plein temps, en cumul deux jours par semaine, ou parti.
    const avant = w < DEPART_RENE;
    const reneLa = avant ? 1 : reste ? (d5 === 1 ? 1 : 0.4) : 0;
    const joaquimLa = w < DEPART_JOAQUIM;
    const absent = (k: number) => n.absences[k]! < 0.05;
    const la: Record<Apprenant, boolean> = {
      hamza: !absent(0) && !actifs.some((a) => a.imprevu.effet.hamzaAbsent),
      oceane: !absent(1),
      abdou: !absent(2),
      recrue: arriveeRecrue !== null && w >= arriveeRecrue && !absent(3),
    };

    // Les rôles de la semaine.
    const binome = d1 === 1 && w >= 2;
    const forme = d1 === 2 && w >= 4;
    // Sans relève préparée, Hamza est mis à la machine au départ de René, Océane à celui de Joaquim.
    const improvise = (d1 === 0 || d1 === 3) && !avant;
    const appui = (d3 === 0 && w >= 5) || (d3 === 1 && w >= 7);
    const rotation = d3 === 2 && w >= 5;
    const passation = d6 === 0 && w === 11;

    // Le temps que les experts donnent à transmettre, et qui leur manque pour produire.
    let tutorat = (reneLa === 1 ? 1 : reneLa > 0 ? 0.8 : 0) + (joaquimLa ? 1 : 0);
    if (rotation) tutorat *= 0.85;
    // [qui, ce qu'il apprend, ce qu'il prend aux experts] : Abdou apprend surtout des apprentis.
    const demandes: [Apprenant, number, number][] = [];
    if (binome || improvise) demandes.push(["hamza", 1, 1]);
    if (binome) demandes.push(["oceane", 1, 1]);
    if (forme) demandes.push(["hamza", 0.15, 0.15], ["oceane", 0.15, 0.15]);
    if (d3 === 0 && w >= 5) demandes.push(["abdou", 0.6, 0.25]);
    if (la.recrue) demandes.push(["recrue", 0.6, 0.6]);
    const presents = demandes.filter(([c]) => la[c]);
    const besoin = presents.reduce((s, [, , p]) => s + p, 0);
    const part = besoin > 0 ? Math.min(1, tutorat / besoin) : 0;
    // Expliquer un geste ralentit celui qui le fait ; écrire ses réglages aussi.
    const tempsExpert = 1 - 0.12 * (tutorat > 0 ? Math.min(1, besoin / tutorat) : 0);
    const ecriture = d2 === 0 && w >= 3 && joaquimLa ? 0.08 : 0;

    // Ce que chacun apprend à côté d'un expert, sur les vraies pièces.
    for (const [cle, poids] of presents) {
      m[cle] += RYTHME_BINOME * aptitude[cle] * docRythme * part * poids * (1 - m[cle]);
    }
    if (w === 3 && d1 === 2) {
      m.hamza = Math.max(m.hamza, PLAFOND_FORMATION);
      m.oceane = Math.max(m.oceane, PLAFOND_FORMATION);
      depense += 4 * COUTS.formation;
      cout += 4 * COUTS.absenceFormation;
    }
    if (w === 6 && d3 === 1) {
      m.abdou = Math.max(m.abdou, PLAFOND_FORMATION);
      depense += 3 * COUTS.formation;
      cout += 3 * COUTS.absenceFormation;
    }
    if (passation) {
      // Joaquim valide chaque pilote sur les pièces qu'il ne maîtrise pas encore.
      for (const cle of ["hamza", "oceane", "abdou", "recrue"] as const) {
        if (m[cle] > 0.3) m[cle] += 0.2 * (1 - m[cle]);
      }
    }

    // Les pilotes de la semaine : leur maîtrise, et leur part du temps sur la machine.
    const pilotes: { cle: Apprenant | null; m: number; temps: number }[] = [];
    if (reneLa > 0) {
      pilotes.push({ cle: null, m: 1, temps: reneLa === 1 ? tempsExpert - ecriture : 0.4 });
    }
    if (joaquimLa) {
      let t = tempsExpert - ecriture;
      if (passation) t -= 0.2;
      if (d6 === 2 && w === 11) t += 0.3;
      pilotes.push({ cle: null, m: 1, temps: t });
    }
    const pilote = (cle: Apprenant, temps: number) => {
      if (la[cle] && temps > 0) pilotes.push({ cle, m: m[cle], temps });
    };
    if (binome) {
      pilote("hamza", avant ? 0.5 : 1);
      pilote("oceane", joaquimLa ? 0.5 : 1);
    } else if (forme) {
      pilote("hamza", avant ? 0.2 : 1);
      pilote("oceane", avant ? 0.2 : joaquimLa ? 0.5 : 1);
    } else if (improvise) {
      pilote("hamza", joaquimLa ? 0.5 : 1);
      pilote("oceane", joaquimLa ? 0 : 1);
    }
    if (appui) {
      // Le troisième pilote couvre d'abord les absences, puis le surcroît.
      const manquants =
        binome || forme || improvise ? (la.hamza ? 0 : 1) + (la.oceane || avant ? 0 : 1) : 0;
      pilote("abdou", Math.min(1, (avant ? 0.25 : 0.4) + 0.5 * manquants));
    }
    pilote("recrue", 1);
    if (d6 === 1 && w >= DEPART_JOAQUIM) {
      pilotes.push({ cle: null, m: MAITRISE_INTERIM, temps: 1 });
      depense += COUTS.interim;
    }

    // Piloter seul fait progresser aussi, lentement.
    for (const p of pilotes) {
      if (p.cle) m[p.cle] += RYTHME_PRATIQUE * p.temps * docRythme * (1 - m[p.cle]);
    }
    for (const cle of ["hamza", "oceane", "abdou", "recrue"] as const) {
      m[cle] = borne(m[cle], 0, 0.97);
    }

    // Ce que l'atelier peut faire : la machine, les pilotes, les programmes retrouvés ou non.
    let facteurMachine = 1;
    let facteurNovices = 1;
    for (const a of actifs) {
      facteurMachine *= a.imprevu.effet.machine ?? 1;
      facteurNovices *= a.imprevu.effet.novices ?? 1;
    }
    // Les programmes de René, puis de Joaquim, que personne n'a rangés : il faut les refaire.
    const programmes =
      (w >= DEPART_RENE && w < DEPART_RENE + 3 && reneLa === 0) || (!joaquimLa && d6 !== 0)
        ? docProgrammes
        : 1;
    const expert = (p: { m: number }) => p.m >= 1;
    const capacites = pilotes.map(
      (p) =>
        CAPACITE_PILOTE *
        rendement(p.m) *
        Math.max(0, p.temps) *
        (expert(p) ? 1 : facteurNovices * programmes),
    );
    const brute = capacites.reduce((s, x) => s + x, 0);
    const capacite = Math.min(CAPACITE_MACHINE, brute) * facteurMachine;
    const echelle = brute > 0 ? capacite / brute : 0;
    const capaciteComplexe =
      pilotes.reduce((s, p, i) => s + capacites[i]! * habilitation(p.m), 0) * echelle;

    // Ce qui arrive : la demande qui monte, et le contrat de l'agenceur.
    let demande = DEMANDE * (1 + HAUSSE * (w - 1)) * n.demande;
    for (const a of actifs) demande *= a.imprevu.effet.demande ?? 1;
    const contrat = w >= 8 ? (VOLUME_CONTRAT[d4 ?? 2] ?? 0) : 0;
    demande += contrat;
    // Les pièces complexes ne vont qu'à ceux qui les maîtrisent ; les autres, à qui reste.
    const complexes = demande * PART_COMPLEXE;
    const faitesComplexes = Math.min(complexes, capaciteComplexe);
    const faitesSimples = Math.min(demande - complexes, capacite - faitesComplexes);
    const faites = faitesComplexes + faitesSimples;
    const sousTraitees = demande - faites;

    // Les reprises : chaque pilote rate selon sa maîtrise ; la rotation fait passer des novices.
    let reprises = 0;
    pilotes.forEach((p, i) => {
      if (brute <= 0) return;
      let taux = tauxReprise(p.m);
      if (!expert(p)) {
        if (w >= 3) taux *= docReprises;
        if (d6 === 0 && w >= DEPART_JOAQUIM) taux *= 0.6;
        if (d5 === 2 && !avant) taux *= 0.92;
        // René, deux jours par semaine, reprend les réglages et relit les programmes.
        if (reneLa > 0 && reneLa < 1) taux *= 0.8;
        taux /= facteurNovices;
      }
      reprises += faites * (capacites[i]! / brute) * taux;
    });
    if (rotation) reprises += faites * 0.12 * tauxReprise(0.3);
    reprises *= n.reprises;

    // Ce que la semaine coûte.
    if (d1 === 0 && w === 2) depense += COUTS.cabinet;
    if (arriveeRecrue !== null && w === arriveeRecrue) depense += COUTS.cabinet;
    if (arriveeRecrue !== null && w >= arriveeRecrue) cout += COUTS.surcoutRecrue;
    if (binome && joaquimLa) cout += 2 * COUTS.binome;
    if (d2 === 2 && w === 3) depense += COUTS.bibliotheque;
    if (d3 === 0 && w >= 5) cout += COUTS.appui;
    if (rotation) cout += COUTS.rotation;
    if (reste && !avant) {
      if (d5 === 0) depense += COUTS.cumul;
      if (d5 === 1 && w === DEPART_RENE) depense += COUTS.prolongation;
    }
    if (d6 === 2 && w === 11) cout += COUTS.heuresSup;
    let penalites = d4 === 0 ? Math.min(sousTraitees, contrat) * PENALITE_CONTRAT : 0;
    if (d4 === 0 && w >= 8) {
      enRetard = sousTraitees > SEUIL_RETARD ? enRetard + 1 : 0;
      if (enRetard >= 2 && litige === null) {
        litige = w;
        penalites += LITIGE;
      }
    }

    const contribution =
      faites * MARGE_COMMANDE +
      sousTraitees * MARGE_SOUS_TRAITEE -
      reprises * COUT_REPRISE -
      penalites -
      depense -
      cout;
    depenses += depense;
    cumul += contribution;
    sousTraiteesTotal += sousTraitees;
    reprisesTotal += reprises;
    demandeTotale += demande;

    // La relève : les deux meilleurs de ceux qu'on a mis sur la machine, ou qu'on aurait pu y mettre.
    const candidats = [
      m.hamza,
      m.oceane,
      d3 === 0 || d3 === 1 ? m.abdou : 0,
      arriveeRecrue !== null && w >= arriveeRecrue ? m.recrue : 0,
    ].sort((a, b) => b - a);
    const autonomes = pilotes.filter((p) => p.m >= SEUIL_AUTONOME && p.temps >= 0.35).length;

    semaines.push({
      service: faites / demande,
      demande,
      faites,
      sousTraitees,
      reprises,
      tauxReprise: faites > 0 ? reprises / faites : 0,
      releve: (candidats[0]! + candidats[1]!) / 2,
      pilotes: autonomes,
      depenses,
      contribution,
      cumul,
      hamza: m.hamza,
      oceane: m.oceane,
      abdou: m.abdou,
      recrue: m.recrue,
    });
  }

  const pleines = semaines.slice(1) as Semaine[];
  const apres = pleines.slice(DEPART_RENE - 1);
  const faitesTotal = pleines.reduce((s, x) => s + x.faites, 0);
  return {
    semaines,
    objectif: cumul - BUDGET,
    margeNette: cumul,
    depenses,
    sousTraiteesTotal,
    reprisesTotal,
    demandeTotale,
    serviceMoyen: faitesTotal / demandeTotale,
    serviceApres:
      apres.reduce((s, x) => s + x.faites, 0) / apres.reduce((s, x) => s + x.demande, 0),
    tauxRepriseMoyen: reprisesTotal / Math.max(1, faitesTotal),
    reneReste: reste,
    recrueArrivee: arriveeRecrue,
    litige,
    pilotesFinaux: pleines[SEMAINES - 1]!.pilotes,
    releveFinale: pleines[SEMAINES - 1]!.releve,
  };
}

/** Ce qui s'est passé pendant des semaines : départs, réponses, arrivée, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    /** La réponse de René à ce qu'on lui a proposé, en semaine 8. */
    reponseRene: (chemin[D.rene] === 0 || chemin[D.rene] === 1) && dans(8) ? t.reneReste : null,
    departRene: dans(DEPART_RENE),
    departJoaquim: dans(DEPART_JOAQUIM),
    /** Le cabinet rend son verdict en semaine 7. */
    cabinet: chemin[D.plan] === 0 && dans(7) ? recrueTrouvee(graine) : null,
    arriveeRecrue: t.recrueArrivee !== null && dans(t.recrueArrivee) ? t.recrueArrivee : null,
    litige: t.litige !== null && dans(t.litige) ? t.litige : null,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureAtelier {
  service: number | null;
  releve: number | null;
  pilotes: number | null;
  tauxReprise: number | null;
  depenses: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** Ce que le tableau de bord ne montre pas, mais que les messages lisent. */
  demande: number | null;
  sousTraitees: number | null;
  hamza: number | null;
  oceane: number | null;
  /** 1 si René est là en cumul emploi-retraite (ou prolongé) cette semaine. */
  reneLa: number | null;
}

/** Ce que Martine lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureAtelier {
  if (semaine === 0) {
    return {
      service: 0.97,
      releve: (MAITRISES_DEPART.hamza + MAITRISES_DEPART.oceane) / 2,
      pilotes: 2,
      tauxReprise: 0.025,
      depenses: 0,
      cumul: 0,
      budgetADate: 0,
      demande: DEMANDE,
      sousTraitees: 1,
      hamza: MAITRISES_DEPART.hamza,
      oceane: MAITRISES_DEPART.oceane,
      reneLa: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  return {
    service: s.service,
    releve: s.releve,
    pilotes: s.pilotes,
    tauxReprise: s.tauxReprise,
    depenses: s.depenses,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    demande: s.demande,
    sousTraitees: s.sousTraitees,
    hamza: s.hamza,
    oceane: s.oceane,
    reneLa: semaine >= DEPART_RENE && t.reneReste ? 1 : 0,
  };
}
