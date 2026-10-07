/**
 * FORMER SES PROPRES SOIGNANTS — le modèle des parcours qualifiants de l'Association Solvanne.
 *
 * Septembre à novembre, la rentrée des instituts de formation. L'association
 * compte 34 postes d'aides-soignants (AS) vacants, et sur ses 110 agents de
 * service hospitaliers (ASH), 40 font fonction d'aide-soignant sans en avoir
 * le diplôme. Prisca Echeverria, responsable formation et compétences, décide
 * du plan. Treize semaines, six décisions. Quatre mécanismes font l'épisode,
 * et le joueur doit les découvrir :
 *
 *   · UN PARCOURS COÛTE MAINTENANT ET PAIE PLUS TARD. Une VAE accompagnée
 *     (3 200 € par candidat, dont 2 000 pris en charge par l'OPCO, dix mois
 *     jusqu'au jury) diplôme deux candidats sur trois en dix-huit mois : sur
 *     cent, 45 obtiennent une validation totale au premier jury, 35 une
 *     validation partielle dont 60 % complètent les blocs manquants. Une
 *     formation complète à l'institut diplôme neuf agents sur dix, mais les
 *     retire du terrain dix mois. Un apprenti coûte un salaire pendant
 *     dix-huit mois. Le trimestre ne voit que les coûts : la valeur vient des
 *     diplômés attendus.
 *   · LE FAISANT FONCTION EST UN GLISSEMENT DE TÂCHES. Un ASH qui fait seul,
 *     la nuit, un transfert ou une toilette d'AS expose le résident et
 *     l'association. Chaque semaine, un événement indésirable grave peut
 *     tomber, d'autant plus souvent que le faisant fonction est nombreux, non
 *     encadré, et de nuit. Une famille a saisi l'ARS : l'inspection peut venir,
 *     et ce qu'elle exige dépend de ce qu'elle trouve — un faisant fonction
 *     encadré, adossé à un plan de qualification, ou une organisation qui
 *     repose sur lui.
 *   · LES SOIGNANTS QU'ON A FORMÉS RESTENT. Neuf diplômés formés en interne
 *     sur dix sont encore là un an après, contre un peu plus d'une recrue
 *     externe sur deux : une prime d'embauche attire des personnes qui
 *     partiront pour la prime suivante, et Orchidia Résidences en offre une.
 *     Les départs sont tirés au hasard, semaine après semaine.
 *   · LES TUTRICES LIMITENT LES PARCOURS MENÉS DE FRONT. Une tutrice suit deux
 *     parcours. Au-delà, chaque candidat est moins suivi : les candidats VAE
 *     écrivent seuls leur livret, les apprentis apprennent seuls, et une part
 *     des diplômes attendus s'évapore. Former des tutrices coûte peu ; lancer
 *     plus de parcours qu'on n'en peut suivre coûte cher.
 *
 * LA VALEUR À LA SEMAINE 13. Le trimestre est jugé en euros : la valeur des
 * diplômés attendus et des soignants retenus, MOINS le coût des postes vacants
 * (intérim et heures supplémentaires), le coût des parcours (frais nets de
 * l'OPCO, heures remplacées, salaires d'apprentis, primes, campagne) et celui
 * des incidents (événements indésirables, injonctions de l'inspection). Un
 * diplômé attendu vaut la première année de surcoût qu'il évite, au surcoût
 * moyen d'un poste vacant, pondérée par la chance qu'il soit encore là un an
 * après : 90 % s'il a été formé en interne, 55 % pour une recrue externe. On
 * retranche de cette valeur ce que les parcours coûteront encore après le
 * trimestre. Le nombre de diplômés attendus se calcule avec les taux de
 * réussite des sources, corrigés de la qualité du suivi par les tutrices
 * pendant le trimestre ; au-delà d'un an d'exercice, l'estimation deviendrait
 * fragile, on ne la compte pas.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Association, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : Soralis reconduit les contrats de la semaine au tarif d'urgence. */
export const PERTE_PAR_JOUR = 2500;

/* ---------------------------------------------------------------------------
 * L'ASSOCIATION : les postes vacants, et ce qui les couvre aujourd'hui.
 * ------------------------------------------------------------------------- */
export const POSTES_VACANTS = 34;
export const AGENTS_DE_SERVICE = 110;
export const FAISANT_FONCTION = 40;
/** Ce qui couvre les 34 postes vacants chaque semaine, en équivalents temps plein. */
export const COUVERTURE = { interim: 20, heuresSup: 4, faisantFonction: 10 } as const;
/** Le faisant fonction, en équivalents temps plein : la nuit, et le jour. */
export const FF_NUIT = 4;
export const FF_JOUR = 6;
/** Une semaine d'aide-soignant salarié, charges comprises. */
export const COUT_AS_SEMAINE = 720;
/** L'intérim coûte deux fois une semaine salariée : le surcoût est d'une semaine salariée. */
export const SURCOUT_INTERIM = COUT_AS_SEMAINE;
/** Les heures supplémentaires sont majorées de 25 %. */
export const SURCOUT_HS = COUT_AS_SEMAINE * 0.25;
/** Le surcoût des postes vacants, chaque semaine, à la rentrée. */
export const COUT_VACANCE_SEMAINE =
  COUVERTURE.interim * SURCOUT_INTERIM + COUVERTURE.heuresSup * SURCOUT_HS;
/** Le surcoût moyen d'un poste vacant, par semaine : le faisant fonction n'y coûte rien en euros. */
export const SURCOUT_MOYEN = COUT_VACANCE_SEMAINE / POSTES_VACANTS;
export const SEMAINES_TRAVAILLEES = 47;
/** Ce qu'un poste pourvu évite sur une année. */
export const VALEUR_AN = SURCOUT_MOYEN * SEMAINES_TRAVAILLEES;
/** La part de ceux qui sont encore là un an après. */
export const MAINTIEN = { interne: 0.9, externe: 0.55, tutrice: 0.85, mutation: 0.7 } as const;
export const VALEUR_INTERNE = VALEUR_AN * MAINTIEN.interne;
export const VALEUR_EXTERNE = VALEUR_AN * MAINTIEN.externe;
/** Le coût des postes vacants que l'EPRD prévoit, par semaine. */
export const BUDGET_SEMAINE = 14000;

/* ---------------------------------------------------------------------------
 * LES PARCOURS : ce qu'ils coûtent, ce qu'ils diplôment.
 * ------------------------------------------------------------------------- */
export const VAE = {
  candidats: 20,
  frais: 3200,
  opco: 2000,
  /** Deux heures d'accompagnement par semaine, prises sur le temps de travail et remplacées. */
  heuresSemaine: 2,
  tauxHoraire: 26,
  /** Ce que le parcours coûtera encore après le trimestre : jury, dernières heures. */
  reste: 600,
  totale: 0.45,
  partielle: 0.35,
  /** La part des validations partielles qui complètent les blocs manquants dans les dix-huit mois. */
  completent: 0.6,
  mois: 10,
} as const;
/** Sur cent candidats accompagnés, combien sont diplômés en dix-huit mois. */
export const TAUX_VAE = VAE.totale + VAE.partielle * VAE.completent;
/** Ce que la semaine 1 demande : les diplômés attendus de vingt VAE accompagnées. */
export const DIPLOMES_VINGT_VAE = VAE.candidats * TAUX_VAE;
export const VAE_NET = VAE.frais - VAE.opco;
export const VAE_SEMAINE = VAE.heuresSemaine * VAE.tauxHoraire;

export const INSTITUT = {
  agents: 10,
  frais: 7800,
  opco: 5000,
  reussite: 0.9,
  mois: 10,
  /** La part de son temps que chaque agent passait à faire fonction : elle quitte le terrain. */
  partFF: 0.25,
  /** Dix mois de formation, soit 44 semaines, dont 32 après le trimestre. */
  semaines: 44,
  apres: 32,
} as const;
export const INSTITUT_NET = INSTITUT.frais - INSTITUT.opco;
/** Le faisant fonction que l'institut retire du terrain, en équivalents temps plein. */
export const INSTITUT_FF = INSTITUT.agents * INSTITUT.partFF;

export const APPRENTI = {
  /** Salaire chargé moyen d'un apprenti aide-soignant, souvent adulte. */
  salaire: 330,
  /** Ce qu'il apporte en binôme, à partir de sa troisième semaine : un tiers de poste, ou presque. */
  binome: 0.3,
  /** Compté seul dans l'effectif. */
  seul: 0.8,
  reussite: 0.8,
  reussiteSeul: 0.48,
  /** Semaines de contrat qui restent après le trimestre, sur dix-huit mois. */
  apres: 70,
  arrivee: 9,
} as const;
/** Ce qu'un apprenti coûtera encore, net de ce qu'il apporte en binôme. */
export const APPRENTI_RESTE =
  APPRENTI.apres * (APPRENTI.salaire - APPRENTI.binome * SURCOUT_INTERIM);

export const CAMPAGNE = {
  frais: 12000,
  prime: 3000,
  primeAlignee: 4000,
  /** Les candidats que la campagne peut toucher, et la chance que chacun signe. */
  vivier: 8,
  signe: 0.55,
} as const;

export const TUTRICES = 14;
export const PLACES_PAR_TUTRICE = 2;
export const NOUVELLES_TUTRICES = 8;
export const FORMATION_TUTRICE = 700;
export const HEURES_TUTRICE = 2;
export const TAUX_HORAIRE_TUTRICE = 28;
/** Ce que chaque parcours demande aux tutrices, en places. */
export const CHARGE = {
  vae: 1,
  vaeDistance: 0.5,
  institut: 0.5,
  apprenti: 1.5,
  apprentiSeul: 0.3,
  recrue: 0.5,
  module: 0.5,
} as const;
export const DISTANCE = { frais: 900, reussite: 0.95 } as const;
/** Ce que perd un parcours mal suivi : 1,2 point de réussite par point de suivi manquant. */
export const PERTE_DE_SUIVI = 1.2;
export const suivi = (qMoyen: number) =>
  Math.max(0.4, Math.min(1, 1 - PERTE_DE_SUIVI * (1 - qMoyen)));

/** La cohorte pilote de l'an dernier : douze candidats, jury de novembre. */
export const PILOTE = { candidats: 12, totale: 4, partielle: 8, jury: 10 } as const;
export const MODULES = {
  frais: 1500,
  reussite: 0.85,
  seul: 0.45,
  ff: 0.35,
  institut: 0.95,
} as const;

/** L'intérim de nuit qu'il faut pour que l'ASH ne fasse jamais seul un transfert la nuit. */
export const BINOMES_DE_NUIT = 1;
/** Le faisant fonction et ses risques. */
export const RISQUE = { nuit: 0.015, jour: 0.003 } as const;
export const COUT_EI = 6000;
export const INSPECTION = {
  base: 0.45,
  parEvenement: 0.25,
  max: 0.9,
  /** L'injonction engage dix semaines d'intérim, le temps que les parcours diplôment ou qu'on recrute. */
  semaines: 10,
  plan: 4000,
  observation: 2000,
  sanction: 8000,
  apprentis: 5000,
} as const;
export const ORCHIDIA = {
  partantes: 3,
  reste: [0.8, 0.6, 0, 0.45] as readonly number[],
  primeRetention: 2000,
  iniquite: 9000,
  tutorat: 1900,
} as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  plan: 0,
  tutrices: 1,
  faisant: 2,
  apprentis: 3,
  orchidia: 4,
  pilote: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 2, 2, 2, 1] as const;
/** La semaine où chaque décision commence à agir. */
export const EFFET = [1, 3, 5, 7, 9, 11] as const;

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
  effet: { tarif?: number; interim?: number; heuresSup?: number; tutrices?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "soralis",
    titre: "Soralis relève ses tarifs",
    de: "Soralis Intérim Santé",
    role: "Agence d'intérim",
    texte:
      "Soralis Intérim Santé relève de 6 % ses tarifs d'aides-soignants jusqu'à la fin de l'année : « la pénurie est régionale, nos intérimaires sont sollicités partout ».",
    duree: 13,
    effet: { tarif: 1.06 },
  },
  {
    id: "gastro",
    titre: "Gastro-entérite à Chalon-sur-Saône",
    de: "EHPAD de Chalon-sur-Saône",
    role: "Infirmière coordinatrice",
    texte:
      "Épidémie de gastro-entérite à l'EHPAD de Chalon : vingt résidents et six soignants touchés. Mesures d'hygiène renforcées, trois postes d'intérim de plus pendant deux semaines.",
    duree: 2,
    effet: { interim: 3 },
  },
  {
    id: "accident",
    titre: "Deux accidents du travail",
    de: "Service des ressources humaines",
    role: "Siège",
    texte:
      "Deux aides-soignantes de Dijon-Montchapet en accident du travail, une lombalgie et une entorse : un mois d'arrêt chacune, remplacées en intérim.",
    duree: 4,
    effet: { interim: 2 },
  },
  {
    id: "tutrice",
    titre: "Une tutrice en congé maternité",
    de: "EHPAD de Beaune",
    role: "Cadre de santé",
    texte:
      "Une des tutrices de Beaune part en congé maternité plus tôt que prévu : ses deux places de tutorat sont à redistribuer jusqu'à la fin de l'année.",
    duree: 13,
    effet: { tutrices: -1 },
  },
  {
    id: "carneo",
    titre: "Panne de Carnéo",
    de: "Service des systèmes d'information",
    role: "Siège",
    texte:
      "Carnéo, le dossier de soins informatisé, est tombé trois jours : transmissions sur papier, plans de soins ressaisis ensuite, et des heures supplémentaires pour rattraper.",
    duree: 1,
    effet: { heuresSup: 4 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** Le bruit des absences sur l'intérim, semaine par semaine (indice 0 vide). */
  bruit: readonly number[];
  /** Le tirage des événements indésirables, semaine par semaine. */
  uEvenement: readonly number[];
  uInspection: number;
  semaineInspection: number;
  /** Ce que l'inspection exige quand l'issue n'est pas écrite d'avance. */
  uSuite: number;
  /** Les candidats que la campagne externe touche : signent-ils, quand, et combien de temps tiennent-ils ? */
  candidats: readonly { u: number; semaine: number; seuil: number }[];
  /** Les seuils d'abandon (loi exponentielle) des candidats VAE, des agents à l'institut, des apprentis. */
  vae: readonly number[];
  institut: readonly number[];
  apprentis: readonly number[];
  /** Les trois aides-soignantes qu'Orchidia sollicite. */
  orchidia: readonly number[];
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();
const expo = (r: () => number) => -Math.log(1 - r());

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000999 + 7);
  const bruit = [0];
  const uEvenement = [1];
  for (let w = 1; w <= SEMAINES; w += 1) {
    bruit.push(Math.min(1.12, Math.max(0.88, 1 + 0.05 * gauss(r))));
    uEvenement.push(r());
  }
  const uInspection = r();
  const semaineInspection = 9 + Math.floor(r() * 3);
  const uSuite = r();
  const candidats = Array.from({ length: CAMPAGNE.vivier }, () => ({
    u: r(),
    semaine: 4 + Math.floor(r() * 8),
    seuil: expo(r),
  }));
  const vae = Array.from({ length: VAE.candidats }, () => expo(r));
  const institut = Array.from({ length: INSTITUT.agents }, () => expo(r));
  const apprentis = Array.from({ length: 10 }, () => expo(r));
  const orchidia = Array.from({ length: ORCHIDIA.partantes }, () => r());
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = {
    bruit,
    uEvenement,
    uInspection,
    semaineInspection,
    uSuite,
    candidats,
    vae,
    institut,
    apprentis,
    orchidia,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Le nombre d'apprentis que chaque option de la semaine 6 fait signer. */
export const APPRENTIS_PRIS = [10, 5, 0, 10] as const;

/** Combien des trois aides-soignantes sollicitées par Orchidia restent, selon l'offre : le hasard seul en décide. */
export const restentChezNous = (option: number, graine: number) =>
  hasard(graine).orchidia.filter((u) => u < (ORCHIDIA.reste[option] ?? 0)).length;

/** La chance, chaque semaine, d'un événement indésirable grave lié au faisant fonction. */
export const risqueDEvenement = (nuit: number, jour: number) =>
  RISQUE.nuit * nuit + RISQUE.jour * jour;

/** La chance d'une inspection, selon les événements indésirables graves survenus depuis Montbard. */
export const chanceDInspection = (evenements: number) =>
  Math.min(INSPECTION.max, INSPECTION.base + INSPECTION.parEvenement * evenements);

export type Issue = "observation" | "nuit" | "jour" | "totale";

/** Ce que l'inspection exige, selon le faisant fonction qu'elle trouve et le plan de qualification. */
export function issueDInspection(faisant: number, plan: boolean, uSuite: number): Issue {
  if (faisant === 2 || faisant === 3) return "totale";
  if (faisant === 1)
    return plan ? (uSuite < 0.5 ? "nuit" : "observation") : uSuite < 0.5 ? "totale" : "nuit";
  return plan ? "observation" : uSuite < 0.5 ? "jour" : "observation";
}

/** Le taux de réussite de la cohorte pilote en validation partielle, selon l'option de la semaine 10. */
export const TAUX_PILOTE = [MODULES.reussite, MODULES.seul, MODULES.ff, MODULES.institut] as const;

export type Semaine = {
  /** Postes d'aides-soignants vacants en fin de semaine. */
  vacants: number;
  /** Équivalents temps plein d'intérim de la semaine. */
  interim: number;
  /** Le coût des postes vacants de la semaine : intérim et heures supplémentaires. */
  coutSemaine: number;
  /** Le coût des postes vacants depuis la rentrée. */
  cumul: number;
  /** Faisant fonction exposé (non encadré, pondéré), en équivalents temps plein. */
  ffExpose: number;
  /** Personnes engagées dans un parcours qualifiant. */
  parcours: number;
  charge: number;
  capacite: number;
  /** Diplômés attendus d'ici dix-huit mois, selon les parcours engagés. */
  diplomes: number;
  /** Ce que coûtent les parcours, les primes et les incidents cette semaine. */
  autres: number;
  /** Événements indésirables graves depuis la rentrée. */
  evenements: number;
};

export interface Abandon {
  qui: "vae" | "institut" | "apprenti" | "recrue";
  semaine: number;
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur des diplômés attendus et des soignants retenus, moins les coûts du trimestre. */
  objectif: number;
  valeur: number;
  coutVacance: number;
  coutParcours: number;
  coutIncidents: number;
  diplomes: number;
  vacantsFinal: number;
  ffFinal: number;
  /** Les semaines des événements indésirables graves, Montbard compris. */
  evenements: readonly number[];
  inspection: { semaine: number; issue: Issue; cout: number } | null;
  recrues: readonly { semaine: number; depart: number | null }[];
  abandons: readonly Abandon[];
  restent: number | null;
  qMoyen: number;
  engagesVae: number;
  apprentis: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin as [number, number, number, number, number, number];
  const plan = d1 === 1 || d1 === 2;
  const pris = APPRENTIS_PRIS[d4] ?? 0;
  const restent = d5 === 2 ? 0 : restentChezNous(d5, graine);
  const semaines: (Semaine | null)[] = [null];

  const perte = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  let coutVacance = 0;
  let coutParcours = 0;
  let coutIncidents = perte;
  // Les cumuls de hasard des abandons, personne par personne.
  const hVae = new Array<number>(VAE.candidats).fill(0);
  const vaeParti = new Array<boolean>(VAE.candidats).fill(false);
  const hInst = new Array<number>(INSTITUT.agents).fill(0);
  const instParti = new Array<boolean>(INSTITUT.agents).fill(false);
  const hApp = new Array<number>(10).fill(0);
  const appParti = new Array<boolean>(10).fill(false);
  const recrues: { semaine: number; depart: number | null; h: number; seuil: number }[] = [];
  const abandons: Abandon[] = [];
  const evenements: number[] = [];
  let inspection: Trimestre["inspection"] = null;
  let sommeQ = 0;
  let nbQ = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let autres = w === 1 ? perte : 0;

    // Les recrues de la campagne externe arrivent.
    if (d1 === 0) {
      for (const c of h.candidats) {
        if (c.semaine === w && c.u < CAMPAGNE.signe) {
          recrues.push({ semaine: w, depart: null, h: 0, seuil: c.seuil });
          const prime = d5 === 0 && w >= 9 ? CAMPAGNE.primeAlignee : CAMPAGNE.prime;
          coutParcours += prime;
          autres += prime;
        }
      }
    }
    const vaeEngages = d1 === 1 ? vaeParti.filter((x) => !x).length : 0;
    const instEngages = d1 === 2 ? instParti.filter((x) => !x).length : 0;
    const appEngages = w >= APPRENTI.arrivee ? appParti.slice(0, pris).filter((x) => !x).length : 0;
    const presentes = recrues.filter((x) => x.depart === null);
    const enIntegration = presentes.filter((x) => w - x.semaine < 6).length;

    // Les tutrices, et ce qu'on leur demande.
    let tutrices = TUTRICES;
    if (d2 === 0 && w >= 5) tutrices += NOUVELLES_TUTRICES;
    for (const a of actifs) tutrices += a.imprevu.effet.tutrices ?? 0;
    if (d5 === 1 && w >= 10) tutrices += restent;
    const capacite = tutrices * PLACES_PAR_TUTRICE + (d2 === 1 && w >= 3 ? 3 : 0);
    let charge = 0;
    if (w >= 3) {
      charge += vaeEngages * (d2 === 2 ? CHARGE.vaeDistance : CHARGE.vae);
      charge += instEngages * CHARGE.institut;
    }
    charge += enIntegration * CHARGE.recrue;
    charge += appEngages * (d4 === 3 ? CHARGE.apprentiSeul : CHARGE.apprenti);
    if (d6 === 0 && w >= 11) charge += PILOTE.partielle * CHARGE.module;
    const q = charge > 0 ? Math.min(1, capacite / charge) : 1;
    if (w >= 3) {
      sommeQ += q;
      nbQ += 1;
    }

    // Les abandons : chacun part quand le hasard cumulé de la semaine dépasse son seuil.
    if (d1 === 1 && w >= 3) {
      const taux = 0.004 * (d3 === 3 && w >= 5 ? 2.5 : 1) + 0.03 * (1 - q);
      hVae.forEach((x, i) => {
        if (vaeParti[i]) return;
        hVae[i] = x + taux;
        if (hVae[i]! > h.vae[i]!) {
          vaeParti[i] = true;
          abandons.push({ qui: "vae", semaine: w });
        }
      });
    }
    if (d1 === 2 && w >= 3) {
      hInst.forEach((x, i) => {
        if (instParti[i]) return;
        hInst[i] = x + 0.002;
        if (hInst[i]! > h.institut[i]!) {
          instParti[i] = true;
          abandons.push({ qui: "institut", semaine: w });
        }
      });
    }
    if (w >= APPRENTI.arrivee) {
      const taux = d4 === 3 ? 0.03 : 0.006 + 0.04 * (1 - q);
      for (let i = 0; i < pris; i += 1) {
        if (appParti[i]) continue;
        hApp[i] = hApp[i]! + taux;
        if (hApp[i]! > h.apprentis[i]!) {
          appParti[i] = true;
          abandons.push({ qui: "apprenti", semaine: w });
        }
      }
    }
    const orchidiaOuverte = w >= 9;
    for (const x of recrues) {
      if (x.depart !== null || x.semaine === w) continue;
      x.h += orchidiaOuverte && d5 !== 0 ? 0.06 : 0.03;
      if (x.h > x.seuil) {
        x.depart = w;
        abandons.push({ qui: "recrue", semaine: w });
      }
    }
    const presentesFin = recrues.filter((x) => x.depart === null).length;

    // Le faisant fonction : ce qui reste exposé, la nuit et le jour.
    let nuit = FF_NUIT;
    let jour = FF_JOUR - (d1 === 2 && w >= 2 ? INSTITUT_FF : 0);
    let fNuit = 1;
    let fJour = 1;
    if (w >= 5) {
      if (d3 === 0) [fNuit, fJour] = [0, 0.5];
      if (d3 === 1) [fNuit, fJour] = [0.4, 0.5];
    }
    if (d6 === 2 && w >= 11) {
      nuit += 1;
      jour += 1;
    }
    nuit *= fNuit;
    jour *= fJour;
    if (d4 === 3 && w >= APPRENTI.arrivee) jour += 0.3 * appEngages;
    const ffExpose = nuit + jour;

    // Les événements indésirables graves : Montbard en semaine 4, puis le hasard.
    if (w === 4 || (w >= 5 && h.uEvenement[w]! < risqueDEvenement(nuit, jour))) {
      evenements.push(w);
      coutIncidents += COUT_EI;
      autres += COUT_EI;
    }

    // L'inspection, si la famille de Montbard et les événements suivants l'ont déclenchée.
    if (w === h.semaineInspection) {
      const depuis = evenements.filter((s) => s >= 5 && s <= 8).length;
      if (h.uInspection < chanceDInspection(depuis)) {
        const issue = issueDInspection(d3, plan, h.uSuite);
        const jourBrut = FF_JOUR - (d1 === 2 ? INSTITUT_FF : 0);
        const etp =
          issue === "nuit"
            ? FF_NUIT
            : issue === "jour"
              ? jourBrut
              : issue === "totale"
                ? FF_NUIT + jourBrut
                : 0;
        let cout =
          issue === "observation"
            ? INSPECTION.observation
            : etp * SURCOUT_INTERIM * INSPECTION.semaines + INSPECTION.plan;
        if (d3 === 3) cout += INSPECTION.sanction;
        if (d4 === 3) cout += INSPECTION.apprentis;
        inspection = { semaine: w, issue, cout };
        coutIncidents += cout;
        autres += cout;
      }
    }

    // L'intérim de la semaine.
    let interim = COUVERTURE.interim;
    if (d1 === 2 && w >= 2) interim += INSTITUT_FF;
    if (d2 === 1 && w >= 3) interim += 0.5;
    if (w >= 5) interim += d3 === 0 ? FF_NUIT : d3 === 1 ? BINOMES_DE_NUIT : 0;
    for (const a of actifs) interim += a.imprevu.effet.interim ?? 0;
    if (w >= 10) interim += ORCHIDIA.partantes - restent;
    if (d6 === 3 && w >= 11) interim += PILOTE.partielle * INSTITUT.partFF;
    if (d6 === 2 && w >= 11) interim -= 2;
    if (d4 === 3 && w >= APPRENTI.arrivee) interim -= APPRENTI.seul * appEngages;
    else if (w >= APPRENTI.arrivee + 2) interim -= APPRENTI.binome * appEngages;
    interim -= presentesFin;
    if (w >= 12) interim -= PILOTE.totale;
    interim = Math.max(0, interim) * h.bruit[w]!;
    let tarif = 1;
    let heuresSup: number = COUVERTURE.heuresSup;
    for (const a of actifs) {
      tarif *= a.imprevu.effet.tarif ?? 1;
      heuresSup += a.imprevu.effet.heuresSup ?? 0;
    }
    const coutSemaine = interim * SURCOUT_INTERIM * tarif + heuresSup * SURCOUT_HS;
    coutVacance += coutSemaine;

    // Ce que coûtent les parcours cette semaine.
    let parcoursSemaine = 0;
    if (d1 === 0 && w === 2) parcoursSemaine += CAMPAGNE.frais;
    if (d1 === 1 && w === 3) parcoursSemaine += VAE.candidats * VAE_NET;
    if (d1 === 1 && w >= 3) parcoursSemaine += vaeEngages * VAE_SEMAINE;
    if (d1 === 2 && w === 2) parcoursSemaine += INSTITUT.agents * INSTITUT_NET;
    if (d2 === 0 && w === 3) parcoursSemaine += (NOUVELLES_TUTRICES * FORMATION_TUTRICE) / 2;
    if (d2 === 0 && w >= 5)
      parcoursSemaine += NOUVELLES_TUTRICES * HEURES_TUTRICE * TAUX_HORAIRE_TUTRICE;
    if (d2 === 2 && w === 3) parcoursSemaine += VAE.candidats * DISTANCE.frais;
    if (w >= APPRENTI.arrivee) parcoursSemaine += appEngages * APPRENTI.salaire;
    if (d5 === 0 && w === 9) parcoursSemaine += restent * ORCHIDIA.primeRetention;
    if (d5 === 0 && w === 10) parcoursSemaine += ORCHIDIA.iniquite;
    if (d5 === 1 && w === 9) parcoursSemaine += restent * ORCHIDIA.tutorat;
    if (d6 === 0 && w === 11) parcoursSemaine += PILOTE.partielle * MODULES.frais;
    if (d6 === 3 && w === 11) parcoursSemaine += PILOTE.partielle * INSTITUT_NET;
    coutParcours += parcoursSemaine;
    autres += parcoursSemaine;

    // Les diplômés attendus, avec le suivi du trimestre jusqu'ici.
    const m = suivi(nbQ ? sommeQ / nbQ : 1);
    const vaeFin = d1 === 1 ? vaeParti.filter((x) => !x).length : 0;
    const instFin = d1 === 2 ? instParti.filter((x) => !x).length : 0;
    const appFin = w >= APPRENTI.arrivee ? appParti.slice(0, pris).filter((x) => !x).length : 0;
    const pilote =
      w >= PILOTE.jury
        ? PILOTE.totale + PILOTE.partielle * tauxPilote(d6, w, m)
        : PILOTE.candidats * TAUX_VAE;
    const diplomes =
      vaeFin * TAUX_VAE * m * (d2 === 2 ? DISTANCE.reussite : 1) +
      instFin * INSTITUT.reussite +
      appFin * (d4 === 3 ? APPRENTI.reussiteSeul : APPRENTI.reussite * m) +
      pilote;
    const parcours =
      vaeFin +
      instFin +
      appFin +
      (w < PILOTE.jury ? PILOTE.candidats : d6 === 0 || d6 === 3 ? PILOTE.partielle : 0);

    let vacants = POSTES_VACANTS - presentesFin - (w >= 12 ? PILOTE.totale : 0);
    for (const a of actifs) if (a.imprevu.id === "accident") vacants += 2;
    if (w >= 10) vacants += ORCHIDIA.partantes - restent;

    semaines.push({
      vacants,
      interim,
      coutSemaine,
      cumul: coutVacance,
      ffExpose,
      parcours,
      charge,
      capacite,
      diplomes,
      autres,
      evenements: evenements.length,
    });
  }

  // La valeur à la semaine 13.
  const qMoyen = nbQ ? sommeQ / nbQ : 1;
  const m = suivi(qMoyen);
  const s13 = semaines[SEMAINES]!;
  const vaeFin = d1 === 1 ? vaeParti.filter((x) => !x).length : 0;
  const instFin = d1 === 2 ? instParti.filter((x) => !x).length : 0;
  const appFin = appParti.slice(0, pris).filter((x) => !x).length;
  const presentes = recrues.filter((x) => x.depart === null).length;
  let valeur = 0;
  valeur +=
    vaeFin * (TAUX_VAE * m * (d2 === 2 ? DISTANCE.reussite : 1) * VALEUR_INTERNE - VAE.reste);
  valeur +=
    instFin * INSTITUT.reussite * VALEUR_INTERNE -
    INSTITUT_FF * SURCOUT_INTERIM * INSTITUT.apres * (d1 === 2 ? 1 : 0);
  valeur +=
    appFin *
    ((d4 === 3 ? APPRENTI.reussiteSeul : APPRENTI.reussite * m) * VALEUR_INTERNE - APPRENTI_RESTE);
  valeur += presentes * VALEUR_EXTERNE;
  valeur += restent * VALEUR_AN * [MAINTIEN.externe, MAINTIEN.tutrice, 0, MAINTIEN.mutation][d5]!;
  valeur += (PILOTE.totale + PILOTE.partielle * tauxPilote(d6, SEMAINES, m)) * VALEUR_INTERNE;
  // À l'institut, la cohorte pilote quitte le terrain dix mois, dont trois semaines dans le trimestre.
  if (d6 === 3)
    valeur -= PILOTE.partielle * INSTITUT.partFF * SURCOUT_INTERIM * (INSTITUT.semaines - 3);

  return {
    semaines,
    objectif: valeur - coutVacance - coutParcours - coutIncidents,
    valeur,
    coutVacance,
    coutParcours,
    coutIncidents,
    diplomes: s13.diplomes,
    vacantsFinal: s13.vacants,
    ffFinal: s13.ffExpose,
    evenements,
    inspection,
    recrues: recrues.map(({ semaine, depart }) => ({ semaine, depart })),
    abandons,
    restent: d5 === 2 ? null : restent,
    qMoyen,
    engagesVae: vaeFin,
    apprentis: appFin,
  };
}

/** Le taux de réussite de la cohorte pilote en validation partielle, une fois l'option prise. */
function tauxPilote(d6: number, w: number, m: number) {
  if (w < 11) return MODULES.seul;
  return d6 === 0 ? MODULES.reussite * m : TAUX_PILOTE[d6]!;
}

/** Ce qui s'est passé pendant des semaines : recrues, abandons, événements, inspection, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    arrivees: t.recrues.filter((r) => dans(r.semaine)).map((r) => r.semaine),
    departs: t.recrues.filter((r) => r.depart !== null && dans(r.depart)).map((r) => r.depart!),
    abandons: t.abandons.filter((x) => x.qui !== "recrue" && dans(x.semaine)),
    evenements: t.evenements.filter((w) => w >= 5 && dans(w)),
    inspection: t.inspection && dans(t.inspection.semaine) ? t.inspection : null,
    orchidia: dans(10) ? t.restent : undefined,
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureSoignants {
  vacants: number | null;
  ffExpose: number | null;
  parcours: number | null;
  cumul: number | null;
  diplomes: number | null;
  charge: number | null;
  capacite: number | null;
  evenements: number | null;
  budgetADate: number | null;
}

/** Ce que Prisca lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureSoignants {
  if (semaine === 0) {
    return {
      vacants: POSTES_VACANTS,
      ffExpose: FF_NUIT + FF_JOUR,
      parcours: PILOTE.candidats,
      cumul: 0,
      diplomes: PILOTE.candidats * TAUX_VAE,
      charge: 0,
      capacite: TUTRICES * PLACES_PAR_TUTRICE,
      evenements: 0,
      budgetADate: 0,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    vacants: s.vacants,
    ffExpose: s.ffExpose,
    parcours: s.parcours,
    cumul: s.cumul,
    diplomes: s.diplomes,
    charge: s.charge,
    capacite: s.capacite,
    evenements: s.evenements,
    budgetADate: BUDGET_SEMAINE * semaine,
  };
}
