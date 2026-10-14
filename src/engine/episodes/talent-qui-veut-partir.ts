/**
 * LE TALENT QUI VEUT PARTIR — le modèle de la direction commerciale régionale.
 *
 * Six agences, six chefs d'agence, treize semaines, six décisions. La
 * meilleure d'entre eux, Héloïse Kervella (Vénissieux), a été approchée par un
 * concurrent ; Habib Amrani (Givors) et Mathilde Guérin (Tassin) montrent
 * des signes de lassitude ; la politique salariale du groupe est contrainte,
 * et un poste de responsable régional pourrait s'ouvrir dans six mois. Trois
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · ON NE RETIENT PAS PAR L'ARGENT. Chacun a une raison de rester qui lui
 *     est propre — des PERSPECTIVES pour Héloïse, une CHARGE tenable pour
 *     Habib, de la RECONNAISSANCE et de l'autonomie pour Mathilde. Leur
 *     engagement tend vers ce que leur besoin satisfait permet ; une
 *     augmentation le fait monter d'un coup, puis il redescend en quelques
 *     semaines vers le même point, parce que la raison de partir est restée.
 *     L'entretien de rétention, mené AVANT la démission, fait remonter ces
 *     raisons : les mesures qui suivent tombent juste, et portent deux fois
 *     plus.
 *   · LA CONTRE-OFFRE ACHÈTE DU TEMPS, ET SE SAIT. S'aligner sur le
 *     concurrent retient souvent sur le moment ; mais la personne a déjà dit
 *     oui dans sa tête, le concurrent revient, et elle part quelques mois plus
 *     tard. Une augmentation hors politique finit par se savoir : ceux qui
 *     n'en ont pas eu se sentent floués, et leur engagement baisse.
 *   · PROMETTRE CE QU'ON NE TIENT PAS DÉTRUIT LA CONFIANCE. Le poste régional
 *     n'est pas au directeur commercial : le comité de direction le crée ou le
 *     gèle, une fois sur deux. Une promesse retient très bien jusqu'au jour
 *     où elle est rompue ; alors l'engagement s'effondre, plus bas qu'avant.
 *     Un parcours de préparation, avec des critères écrits, vaut quelle que
 *     soit la décision du comité.
 *
 * Un départ coûte cher, et le modèle le compte dès la démission : le
 * recrutement du successeur et son intégration, l'agence sans chef, et les
 * clients qui suivent un chef d'agence parti chez un concurrent.
 *
 * Le trimestre est jugé en euros : la marge des trois agences concernées,
 * moins le coût des mesures et des départs, en écart au budget. Fidéliser
 * n'y est pas une vertu, c'est un calcul.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** La marge brute hebdomadaire de chaque agence quand son chef est pleinement engagé. */
export const MARGE = { venissieux: 36000, givors: 24000, tassin: 28000 } as const;
/** Le budget de marge nette des trois agences sur le trimestre, mesures et départs compris. */
export const BUDGET = 1110000;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : Valdane avance ses pions chez les clients de Vénissieux. */
export const PERTE_PAR_JOUR = 1500;
/** Recrutement par cabinet et intégration du successeur, provisionnés dès la démission. */
export const COUT_DEPART_CHEF = 30000;
export const COUT_DEPART_ADJOINT = 12000;
/** Au-dessus de ce niveau d'engagement, les départs deviennent rares. */
export const SEUIL_ENGAGEMENT = 0.6;
/** La charge de Habib : 1, une semaine tenable ; 1,3, ses 52 heures actuelles. */
export const CHARGE_DEPART = 1.3;

/** Les personnes clés, par leur place dans les tableaux. */
export const P = { heloise: 0, habib: 1, mathilde: 2, kofi: 3 } as const;
export const NOMS = ["Héloïse", "Habib", "Mathilde", "Kofi"] as const;
export const ENGAGEMENT_DEPART = [0.48, 0.42, 0.5, 0.58] as const;
/** Ce que leur besoin propre a de satisfait au départ : perspectives, charge, reconnaissance, perspectives. */
const BESOIN_DEPART = [0.2, 0.25, 0.25, 0.4] as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  ecoute: 0,
  offre: 1,
  habib: 2,
  mathilde: 3,
  poste: 4,
  kofi: 5,
} as const;

/** Ne rien changer, ou laisser faire, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 1, 2] as const;

export const COUTS = {
  augmentationHeloise: 1500,
  seminaire: 4500,
  contreOffre: 5500,
  parcours: 3500,
  prime: 3000,
  cabinet: 4000,
  vendeur: 800,
  interim: 1500,
  projet: 2500,
  augmentationMathilde: 900,
  preparation: 2000,
  contreOffreKofi: 2500,
  delegation: 1000,
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
  effet: {
    /** Sur la marge des trois agences. */
    marge?: number;
    venissieux?: number;
    givors?: number;
    /** Sur l'engagement des chefs d'agence, chaque semaine. */
    engagement?: number;
    /** Ce que la présence d'un concurrent à côté ajoute au risque que Habib parte. */
    attrait?: number;
  };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "chantier",
    titre: "Démarrage d'un grand chantier à Vénissieux",
    de: "Kofi Mensah",
    role: "Adjoint de l'agence de Vénissieux",
    texte:
      "Le chantier de l'écoquartier des Minguettes démarre : ses entreprises viennent s'équiper chez nous pendant deux semaines.",
    duree: 2,
    effet: { venissieux: 1.08 },
  },
  {
    id: "pluies",
    titre: "Une semaine de pluies continues",
    de: "Météo des chantiers",
    role: "Service commercial",
    texte:
      "Une semaine de pluies continues : les chantiers s'arrêtent, les artisans ne viennent plus aux comptoirs.",
    duree: 1,
    effet: { marge: 0.9 },
  },
  {
    id: "audit",
    titre: "Audit interne des stocks",
    de: "Contrôle interne",
    role: "Siège",
    texte:
      "Le siège lance un audit des stocks dans toutes les agences : une semaine d'inventaires et de justificatifs pour les chefs d'agence, en plus du reste.",
    duree: 1,
    effet: { marge: 0.98, engagement: -0.03 },
  },
  {
    id: "ravier",
    titre: "Valdane ouvre une agence à Givors",
    de: "Ambroise Ancelin",
    role: "Contrôleur de gestion régional",
    texte:
      "Les Comptoirs Valdane ouvrent une agence à deux kilomètres de celle de Givors, et recrutent dans la région.",
    duree: 3,
    effet: { givors: 0.95, attrait: 0.12 },
  },
  {
    id: "ciment",
    titre: "Rupture de ciment chez le fournisseur",
    de: "Achats régionaux",
    role: "Siège",
    texte:
      "La cimenterie qui fournit la région arrête un four deux semaines : les ventes de ciment sont rationnées dans toutes les agences.",
    duree: 2,
    effet: { marge: 0.95 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  demande: number;
  /** Les petites variations d'humeur de chacun, semaine après semaine. */
  humeur: readonly number[];
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** Héloïse répond-elle oui à Valdane en semaine 3 ? */
  uHeloise: number;
  /** Valdane revient-il la chercher en semaine 11 ? */
  uRetour: number;
  uHabib: number;
  uMathilde: number;
  uKofi: number;
  /** Chaque augmentation hors politique se sait-elle ? Un tirage par augmentation. */
  uFuites: readonly number[];
  /** Le comité de direction crée-t-il le poste de responsable régional ? */
  uComite: number;
  /** Le cabinet trouve-t-il un vendeur pour Givors avant la semaine 7 ? */
  uCabinet: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000121 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let i = 1; i <= SEMAINES; i += 1) {
    semaines.push({
      demande: borne(1 + 0.05 * gauss(r), 0.88, 1.12),
      humeur: [0, 1, 2, 3].map(() => borne(0.015 * gauss(r), -0.04, 0.04)),
    });
  }
  const uHeloise = r();
  const uRetour = r();
  const uHabib = r();
  const uMathilde = r();
  const uKofi = r();
  const uFuites = [r(), r(), r()];
  const uComite = r();
  const uCabinet = r();
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
    uHeloise,
    uRetour,
    uHabib,
    uMathilde,
    uKofi,
    uFuites,
    uComite,
    uCabinet,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/** Le risque qu'un chef d'agence parte, lu sur son engagement. */
export const risqueDeDepart = (engagement: number) => borne((0.6 - engagement) * 1.8, 0.02, 0.85);

/**
 * CE QUE L'ENTRETIEN DE RÉTENTION APPREND.
 *
 * Sans lui, on devine ce qui manque à chacun, et les mesures tombent à côté :
 * on propose à Héloïse des dossiers quand elle veut une équipe, un projet à
 * Mathilde qui n'est pas le sien. Un séminaire collectif en apprend un peu.
 */
export function ciblage(chemin: readonly number[]): number {
  return chemin[D.ecoute] === 1 ? 1 : chemin[D.ecoute] === 2 ? 0.5 : 0.3;
}

/** Une fois sur deux, le comité de direction crée le poste de responsable régional. */
export const posteCree = (graine: number) => hasard(graine).uComite < 0.5;

/** Six fois sur dix, le cabinet trouve un vendeur pour Givors en semaine 7 ; sinon, en semaine 11. */
export const vendeurRapide = (graine: number) => hasard(graine).uCabinet < 0.6;

/** La chance qu'Héloïse reste en semaine 3, selon la réponse faite à l'offre de Valdane et son engagement. */
export function chanceQuHeloiseReste(chemin: readonly number[], engagement: number): number {
  const base = [0.78, 0.72, 0.62 + 0.33 * ciblage(chemin), 0.25][chemin[D.offre] ?? 3]!;
  return borne(base + 0.6 * (engagement - 0.4), 0.05, 0.98);
}

export type Semaine = {
  /** Marge brute des trois agences dans la semaine. */
  marge: number;
  /** Ce que la semaine apporte : marge, moins mesures et départs. */
  contribution: number;
  /** Marge nette cumulée depuis le début du trimestre. */
  cumul: number;
  /** Coût des mesures cumulé : augmentations, primes, intérim, recrutements, formations. */
  depenses: number;
  /** Engagement moyen des chefs d'agence clés encore en poste, sur 100. */
  engagement: number;
  /** Le risque de départ le plus élevé parmi eux. */
  risque: number;
  /** Qui porte ce risque (indice dans NOMS). */
  qui: number;
  /** Les personnes clés qui n'ont pas démissionné, sur quatre. */
  postes: number;
  /** L'engagement de chacun, de 0 à 1. */
  eHeloise: number;
  eHabib: number;
  eMathilde: number;
  eKofi: number;
  chargeHabib: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** L'écart au budget de marge nette des trois agences : positif, la région fait mieux que prévu. */
  objectif: number;
  margeNette: number;
  depenses: number;
  coutDeparts: number;
  /** La semaine où chacun a démissionné, ou null. */
  demissions: readonly (number | null)[];
  /** Héloïse est-elle partie dès l'offre de Valdane ? */
  heloisePartieTot: boolean;
  /** La semaine où une augmentation hors politique s'est sue, ou null. */
  fuite: number | null;
  augmentations: number;
  posteCree: boolean;
  /** À qui l'on a promis le poste régional, en privé ou devant tous, ou null. */
  promis: number | null;
  promesseRompue: boolean;
  /** La semaine où un vendeur renforce Givors, ou null. */
  renfortGivors: number | null;
  engagementFinal: number;
  postesFinal: number;
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4, d5, d6] = chemin;
  const cible = ciblage(chemin);
  const ecoute = d1 === 1;
  const cree = posteCree(graine);
  const renfort = d3 === 1 ? (vendeurRapide(graine) ? 7 : 11) : d3 === 2 ? 5 : null;

  const e: number[] = [...ENGAGEMENT_DEPART];
  const besoin: number[] = [...BESOIN_DEPART];
  /** Le sentiment d'être traité justement : 1, rien à redire. */
  const equite = [1, 1, 1, 1];
  /** Ce que la préparation au poste ajoute aux perspectives de Habib. */
  let perspectiveHabib = 0;
  let charge = CHARGE_DEPART;
  const demissions: (number | null)[] = [null, null, null, null];
  const augmentes = new Set<number>();
  let nbAugmentations = 0;
  let fuite: number | null = null;
  const fuitesAVenir: number[] = [];
  /** À qui l'on a promis le poste régional, s'il s'ouvre. */
  let promis: number | null = null;
  let promesseRompue = false;
  let heloisePartieTot = false;
  let projet = 0;
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let depenses = 0;
  let coutDeparts = 0;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  /** Une augmentation hors politique : un sursaut d'engagement, et une chance qu'elle se sache. */
  const augmenter = (qui: number, w: number, sursaut: number) => {
    e[qui] = e[qui]! + sursaut;
    augmentes.add(qui);
    if (nbAugmentations < h.uFuites.length && h.uFuites[nbAugmentations]! < 0.5) {
      fuitesAVenir.push(w + 2);
    }
    nbAugmentations += 1;
  };
  const enPoste = (qui: number) => demissions[qui] === null;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let depense = 0;
    let depart = 0;

    // Ce que les décisions changent, le jour où elles prennent effet.
    if (w === 1) {
      if (d1 === 0) {
        augmenter(P.heloise, w, 0.12);
        depense += COUTS.augmentationHeloise;
      }
      if (d1 === 1) [P.heloise, P.habib, P.mathilde].forEach((i) => (e[i] = e[i]! + 0.05));
      if (d1 === 2) {
        [P.heloise, P.habib, P.mathilde, P.kofi].forEach((i) => (e[i] = e[i]! + 0.05));
        depense += COUTS.seminaire;
      }
    }
    if (w === 3) {
      // Héloïse doit répondre à Valdane : elle décide sur ce qu'on lui a proposé, et sur ce qu'elle vit.
      const reste = h.uHeloise < chanceQuHeloiseReste(chemin, e[P.heloise]!);
      if (!reste) {
        demissions[P.heloise] = 3;
        heloisePartieTot = true;
        depart += COUT_DEPART_CHEF;
        // Les départs sont contagieux : si même Héloïse s'en va…
        [P.habib, P.mathilde].forEach((i) => (e[i] = e[i]! - 0.05));
        besoin[P.kofi] = 0.7; // Kofi tient l'agence par intérim.
      } else if (d2 === 0) {
        augmenter(P.heloise, w, 0.12);
        depense += COUTS.contreOffre;
      } else if (d2 === 1) {
        besoin[P.heloise] = 0.85;
        promis = P.heloise;
      } else if (d2 === 2) {
        besoin[P.heloise] = 0.55 + 0.25 * cible;
        besoin[P.kofi] = besoin[P.kofi]! + 0.25; // Il tient l'agence quand elle est en mission.
        depense += COUTS.parcours;
      }
    }
    if (w === 5) {
      if (d3 === 0) {
        e[P.habib] = e[P.habib]! + 0.1;
        depense += COUTS.prime;
      }
      if (d3 === 1 || d3 === 2) charge -= 0.05; // Le reporting en double supprimé.
      if (d3 === 1) depense += COUTS.cabinet;
    }
    // Sans renfort ni allègement, la charge s'accumule.
    if (d3 === 3 && w >= 5) charge += 0.01;
    if (renfort !== null && w === renfort) charge -= d3 === 2 ? 0.15 : 0.25;
    // Le cabinet n'a trouvé personne pour la semaine 7 : Habib avait cru au renfort.
    if (d3 === 1 && renfort !== 7 && w === 7) e[P.habib] = e[P.habib]! - 0.12;
    if (renfort !== null && w >= renfort) depense += d3 === 2 ? COUTS.interim : COUTS.vendeur;
    if (w === 7) {
      if (d4 === 0) {
        besoin[P.mathilde] = 0.55 + 0.3 * cible;
        projet = 0.6 + 0.4 * cible;
        depense += COUTS.projet;
      }
      if (d4 === 1) {
        augmenter(P.mathilde, w, 0.12);
        depense += COUTS.augmentationMathilde;
      }
      if (d4 === 2) {
        // Une revue des salaires des six chefs d'agence, dans l'enveloppe, sur critères publiés.
        besoin[P.mathilde] = besoin[P.mathilde]! + 0.15;
        for (let i = 0; i < 4; i += 1) equite[i] = 1 - (1 - equite[i]!) * 0.3;
      }
      if (d4 === 3) besoin[P.mathilde] = besoin[P.mathilde]! - 0.05;
    }
    if (w === 9) {
      if (d5 === 0) {
        // Un nom annoncé avant que le comité ait tranché : c'est une promesse, devant tous.
        if (enPoste(P.heloise)) {
          besoin[P.heloise] = Math.max(besoin[P.heloise]!, 0.95);
          promis = P.heloise;
          equite[P.habib] = equite[P.habib]! - 0.2; // Quinze ans de maison, et pas même consulté.
        } else if (enPoste(P.habib)) {
          perspectiveHabib += 0.15;
          promis = P.habib;
        }
        equite[P.mathilde] = equite[P.mathilde]! - 0.05;
      }
      if (d5 === 1) {
        // Les rumeurs remplissent le silence : chacun se demande s'il a un avenir ici.
        besoin[P.heloise] = besoin[P.heloise]! - 0.15;
        equite[P.habib] = equite[P.habib]! - 0.1;
        equite[P.mathilde] = equite[P.mathilde]! - 0.05;
      }
      if (d5 === 2) {
        besoin[P.heloise] = besoin[P.heloise]! + 0.08;
        perspectiveHabib += 0.1;
        besoin[P.mathilde] = besoin[P.mathilde]! + 0.08;
        besoin[P.kofi] = besoin[P.kofi]! + 0.05;
        [P.heloise, P.habib, P.mathilde].forEach((i) => (e[i] = e[i]! + 0.04));
        depense += COUTS.preparation;
      }
      if (d5 === 3) {
        // Le poste pour lequel on se préparait ira à quelqu'un de l'extérieur.
        besoin[P.heloise] = besoin[P.heloise]! - 0.45;
        e[P.heloise] = e[P.heloise]! - 0.1;
        perspectiveHabib -= 0.15;
        e[P.habib] = e[P.habib]! - 0.05;
        besoin[P.mathilde] = besoin[P.mathilde]! - 0.1;
        besoin[P.kofi] = besoin[P.kofi]! - 0.1;
      }
    }
    if (w === 10) {
      // Le comité de direction tranche : il crée le poste, ou il le gèle.
      if (!cree && promis !== null && enPoste(promis)) {
        promesseRompue = true;
        if (promis === P.heloise) {
          besoin[P.heloise] = 0.05;
          e[P.heloise] = e[P.heloise]! - 0.2;
        } else {
          perspectiveHabib -= 0.25;
          e[P.habib] = e[P.habib]! - 0.15;
        }
        // La personne ne s'en cache pas, et chacun mesure ce que vaut votre parole.
        const perte = d5 === 0 ? 0.15 : 0.1;
        for (let i = 0; i < 4; i += 1) if (i !== promis) equite[i] = equite[i]! - perte;
      }
      if (cree && d5 === 2) perspectiveHabib += 0.04;
    }
    if (w === 12) {
      if (d6 === 0) {
        augmenter(P.kofi, w, 0.12);
        depense += COUTS.contreOffreKofi;
      }
      if (d6 === 1) {
        e[P.kofi] = e[P.kofi]! + 0.1;
        depense += COUTS.delegation;
      }
    }
    // Une augmentation qui se sait : ceux qui n'en ont pas eu se sentent floués.
    if (fuitesAVenir.includes(w)) {
      fuite ??= w;
      for (let i = 0; i < 4; i += 1) if (!augmentes.has(i)) equite[i] = equite[i]! - 0.15;
    }

    // L'engagement de chacun tend vers ce que son besoin satisfait permet.
    besoin[P.habib] = borne(0.2 + (CHARGE_DEPART - charge) * 2 + perspectiveHabib, 0, 1);
    let choc = 0;
    for (const a of actifs) choc += a.imprevu.effet.engagement ?? 0;
    for (let i = 0; i < 4; i += 1) {
      const vise =
        0.22 +
        0.6 * borne(besoin[i]!, 0, 1) +
        0.3 * (equite[i]! - 1) +
        (ecoute && i !== P.kofi ? 0.04 : 0);
      e[i] = borne(e[i]! + 0.25 * (vise - e[i]!) + n.humeur[i]! + choc, 0.05, 0.95);
    }

    // Qui démissionne, et quand.
    if (w === 10 && enPoste(P.habib)) {
      // Un concurrent qui ouvre à deux kilomètres, et qui recrute, rend l'offre concrète.
      const attrait = h.imprevus
        .filter((i) => i.semaine <= 10)
        .reduce((x, i) => x + (i.imprevu.effet.attrait ?? 0), 0);
      const p = 0.9 * risqueDeDepart(e[P.habib]!) + attrait;
      if (h.uHabib < p) {
        demissions[P.habib] = w;
        depart += COUT_DEPART_CHEF;
      }
    }
    if (w === 11 && enPoste(P.mathilde)) {
      if (h.uMathilde < 0.85 * risqueDeDepart(e[P.mathilde]!)) {
        demissions[P.mathilde] = w;
        depart += COUT_DEPART_CHEF;
      }
    }
    if (w === 11 && enPoste(P.heloise)) {
      // Valdane revient à la charge : une contre-offre acceptée laisse la porte ouverte.
      const p =
        0.7 * risqueDeDepart(e[P.heloise]!) +
        (d2 === 0 ? 0.15 : 0) +
        (promesseRompue && promis === P.heloise ? 0.5 : 0);
      if (h.uRetour < p) {
        demissions[P.heloise] = w;
        depart += COUT_DEPART_CHEF;
      }
    }
    if (w === 12 && enPoste(P.kofi)) {
      const reelle = heloisePartieTot || (d2 === 2 && enPoste(P.heloise));
      const base = [
        0.2 + (heloisePartieTot ? 0.1 : 0),
        reelle ? 0.05 : 0.4,
        0.6 + (heloisePartieTot ? 0.15 : 0),
      ][d6 ?? 2]!;
      if (h.uKofi < borne(base + 0.5 * (0.55 - e[P.kofi]!), 0.02, 0.9)) {
        demissions[P.kofi] = w;
        depart += COUT_DEPART_ADJOINT;
      }
    }

    // Ce que chaque agence dégage : son chef, son équipe, et le hasard de la semaine.
    const chef = (qui: number, preavis: number) => {
      const dem = demissions[qui] ?? null;
      if (dem === null || w <= dem) return 0.95 + 0.1 * e[qui]!;
      if (w <= dem + preavis) return 0.95; // En préavis : présent, mais déjà ailleurs.
      return 0.9; // Le poste est vide.
    };
    let facteur = n.demande;
    for (const a of actifs) facteur *= a.imprevu.effet.marge ?? 1;
    const effet = (cle: "venissieux" | "givors") =>
      actifs.reduce((x, a) => x * (a.imprevu.effet[cle] ?? 1), 1);
    const mission = d2 === 2 && enPoste(P.heloise) && w >= 6 ? 1.015 : 1;
    let venissieux = MARGE.venissieux * facteur * effet("venissieux");
    if (heloisePartieTot) {
      // Kofi tient l'agence par intérim ; à partir de la semaine 8, des clients ont suivi Héloïse.
      venissieux *= w <= 5 ? 0.95 : 0.92;
      if (w >= 8) venissieux *= 0.93;
    } else {
      venissieux *= chef(P.heloise, 2);
    }
    if (demissions[P.kofi] !== null && w > demissions[P.kofi]!) venissieux *= 0.97;
    const givors =
      MARGE.givors *
      facteur *
      effet("givors") *
      chef(P.habib, 1) *
      (1 - 0.15 * (charge - 1)) *
      // Le vendeur recruté en CDI vient d'un concurrent, avec une partie de ses clients.
      (d3 === 1 && renfort !== null && w >= renfort ? 1.05 : 1) *
      mission;
    const tassin =
      MARGE.tassin * facteur * chef(P.mathilde, 1) * (w >= 9 ? 1 + 0.03 * projet : 1) * mission;
    const marge = venissieux + givors + tassin;

    const contribution = marge - depense - depart - (w === 1 ? perteEnquete : 0);
    depenses += depense;
    coutDeparts += depart;
    cumul += contribution;

    const chefs: number[] = [P.heloise, P.habib, P.mathilde].filter(enPoste);
    const risques = chefs.map((i) =>
      i === P.heloise && w < 3
        ? borne(risqueDeDepart(e[i]!) + 0.3, 0, 0.95)
        : risqueDeDepart(e[i]!),
    );
    const max = risques.length ? Math.max(...risques) : 0;
    semaines.push({
      marge,
      contribution,
      cumul,
      depenses,
      engagement: chefs.length ? (100 * chefs.reduce((x, i) => x + e[i]!, 0)) / chefs.length : 0,
      risque: max,
      qui: chefs.length ? chefs[risques.indexOf(max)]! : 0,
      postes: demissions.filter((x) => x === null).length,
      eHeloise: e[P.heloise]!,
      eHabib: e[P.habib]!,
      eMathilde: e[P.mathilde]!,
      eKofi: e[P.kofi]!,
      chargeHabib: charge,
    });
  }

  const fin = semaines[SEMAINES]!;
  return {
    semaines,
    objectif: cumul - BUDGET,
    margeNette: cumul,
    depenses,
    coutDeparts,
    demissions,
    heloisePartieTot,
    fuite,
    augmentations: nbAugmentations,
    posteCree: cree,
    promis,
    promesseRompue,
    renfortGivors: renfort,
    engagementFinal: fin.engagement,
    postesFinal: fin.postes,
  };
}

/** Ce qui s'est passé pendant des semaines : réponses, démissions, comité, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  const dem = (qui: number) => {
    const w = t.demissions[qui];
    return w !== null && w !== undefined && dans(w);
  };
  return {
    /** La réponse d'Héloïse à Valdane, en semaine 3. */
    heloise: dans(3) ? (t.heloisePartieTot ? ("part" as const) : ("reste" as const)) : null,
    heloiseQuitte: t.heloisePartieTot && dans(6),
    heloiseRepart: !t.heloisePartieTot && dem(P.heloise),
    habibPart: dem(P.habib),
    mathildePart: dem(P.mathilde),
    kofi: dans(12) ? (dem(P.kofi) ? ("part" as const) : ("reste" as const)) : null,
    fuite: t.fuite !== null && dans(t.fuite),
    renfort: t.renfortGivors !== null && dans(t.renfortGivors) ? t.renfortGivors : null,
    comite: dans(10) ? t.posteCree : null,
    promesseRompue: t.promesseRompue && dans(10),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureRegion {
  cumul: number | null;
  budgetADate: number | null;
  engagement: number | null;
  risque: number | null;
  qui: number | null;
  postes: number | null;
  depenses: number | null;
  /** Ce que le tableau de bord ne montre pas, mais que les messages lisent. */
  heloisePartie: number | null;
  /** Héloïse est-elle partie dès l'offre de Valdane ? */
  heloiseTot: number | null;
  habibParti: number | null;
  mathildePartie: number | null;
  fuite: number | null;
  eHeloise: number | null;
  eHabib: number | null;
  eMathilde: number | null;
  eKofi: number | null;
  chargeHabib: number | null;
}

/** Ce que Grégoire lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureRegion {
  if (semaine === 0) {
    return {
      cumul: 0,
      budgetADate: 0,
      engagement: (100 * (ENGAGEMENT_DEPART[0] + ENGAGEMENT_DEPART[1] + ENGAGEMENT_DEPART[2])) / 3,
      risque: risqueDeDepart(ENGAGEMENT_DEPART[0]) + 0.3,
      qui: P.heloise,
      postes: 4,
      depenses: 0,
      heloisePartie: 0,
      heloiseTot: 0,
      habibParti: 0,
      mathildePartie: 0,
      fuite: 0,
      eHeloise: ENGAGEMENT_DEPART[0],
      eHabib: ENGAGEMENT_DEPART[1],
      eMathilde: ENGAGEMENT_DEPART[2],
      eKofi: ENGAGEMENT_DEPART[3],
      chargeHabib: CHARGE_DEPART,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const parti = (qui: number) => {
    const w = t.demissions[qui];
    return w !== null && w !== undefined && w <= semaine ? 1 : 0;
  };
  return {
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    engagement: s.engagement,
    risque: s.risque,
    qui: s.qui,
    postes: s.postes,
    depenses: s.depenses,
    heloisePartie: parti(P.heloise),
    heloiseTot: t.heloisePartieTot && semaine >= 3 ? 1 : 0,
    habibParti: parti(P.habib),
    mathildePartie: parti(P.mathilde),
    fuite: t.fuite !== null && t.fuite <= semaine ? 1 : 0,
    eHeloise: s.eHeloise,
    eHabib: s.eHabib,
    eMathilde: s.eMathilde,
    eKofi: s.eKofi,
    chargeHabib: s.chargeHabib,
  };
}
