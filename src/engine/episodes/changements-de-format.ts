/**
 * LES CHANGEMENTS QUI MANGENT LA LIGNE — le modèle de la ligne 3 de Loudéac.
 *
 * La ligne 3 de la Laiterie de Kerbrélan conditionne des yaourts aromatisés en
 * pots de 125 g, en packs de 4, 8 et 12 : une thermoformeuse-remplisseuse-
 * scelleuse de 20 000 pots à l'heure, ouverte 80 heures par semaine en deux
 * équipes, du lundi au vendredi. Son taux de rendement synthétique (TRS) est
 * de 57 % ; d'avril à juin, les commandes montent de près d'un tiers avec
 * l'été, et la ligne ne les suivra pas. Le directeur industriel propose une
 * deuxième ligne, ou des samedis. Treize semaines, six décisions. Cinq
 * mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · UN TRS SE DÉCOMPOSE AVANT DE SE SOIGNER. Sur 80 heures d'ouverture, la
 *     ligne en perd 34,4 : 17 aux changements de format et aux nettoyages en
 *     place (NEP) entre recettes (49 %), 9,8 aux micro-arrêts du doseur
 *     (28 %), 7,6 en pots écartés, mal scellés ou purgés au redémarrage
 *     (22 %). La capacité de l'été est dans la ligne, pas dans une ligne de
 *     plus : seul le relevé des arrêts, qui coûte un jour et demi, le montre.
 *   · LE SMED PAIE AVEC RETARD, ET SELON LES CONDUCTEURS. Préparer hors arrêt
 *     ce qui peut l'être (outil de découpe, bobines, fourreaux, recette
 *     suivante, démontage du doseur) fait passer un changement de format de
 *     65 à 32 minutes et la part d'un NEP qui n'est pas le cycle validé de 25
 *     à 7 minutes. Le gain arrive deux semaines après le début du chantier si
 *     les deux équipes s'en emparent, quatre semaines et à moitié sinon ;
 *     l'adhésion de l'équipe d'après-midi dépend de la façon dont la ligne a
 *     été traitée en semaine 1.
 *   · L'ORDONNANCEMENT RETIRE DES NETTOYAGES ; LES LONGUES SÉRIES COÛTENT EN
 *     DLC. Enchaîner chaque jour les recettes du nature vers l'aromatisé, du
 *     clair au foncé, et finir par les recettes avec allergène avant le NEP du
 *     soir fait passer les NEP en production de 9 à 5 par semaine, sans
 *     allonger les séries. Des campagnes hebdomadaires par parfum en retirent
 *     davantage, mais un parfum fabriqué une fois par semaine reste en
 *     chambre froide : une partie arrive chez les enseignes avec moins des
 *     deux tiers de sa DLC, et se casse. Quand le SMED a raccourci les
 *     changements, les longues séries ne rapportent plus rien.
 *   · ÉCOURTER UN NETTOYAGE EST UNE FAUTE SANITAIRE. Gagner 25 minutes par NEP
 *     en sortant du cycle validé expose à une analyse environnementale
 *     positive : lots bloqués, une journée de décontamination, des produits
 *     libérés trop tard pour leur DLC, des ruptures.
 *   · LE SAMEDI COÛTE ET FATIGUE. Une journée de deux équipes coûte 6 500 €
 *     d'heures majorées ; elle n'a de valeur que si la ligne manque de
 *     capacité, et la fatigue fait monter les micro-arrêts, les rebuts et le
 *     risque d'accident.
 *
 * Le trimestre est jugé en euros : la marge sur coût variable des pots
 * livrés, moins les pénalités logistiques des ruptures, les rebuts et la
 * casse (au coût variable des pots perdus), les heures majorées et le coût
 * des mesures, PLUS la capacité gagnée pour juillet. Celle-ci est estimée
 * comme les sources le permettent : les pots par semaine que la ligne livre
 * de plus qu'au départ (structure de la semaine 13, sans samedi), multipliés
 * par la part que le standard tiendra pendant les congés et l'arrivée des
 * intérimaires, plafonnés au manque de juillet que chiffre le plan
 * industriel et commercial, valorisés quatre semaines à la marge sur coût
 * variable et à la pénalité évitée. Une ligne neuve, livrée en janvier, n'y
 * entre pas.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;

/* ---------------------------------------------------------------------------
 * LA LIGNE 3 ET SES PERTES, telles que le relevé des arrêts les donne.
 * ------------------------------------------------------------------------- */
/** Heures d'ouverture par semaine : deux équipes de huit heures, du lundi au vendredi. */
export const OUVERTURE = 80;
/** Pots de 125 g par heure, à la cadence nominale de la thermoformeuse. */
export const CADENCE = 20000;
/** Le TRS que vise l'usine. */
export const OBJECTIF_TRS = 0.7;

/** Ce que le relevé des arrêts de quatre semaines donne, semaine moyenne. */
export const RELEVE = {
  formats: 6,
  /** Minutes par changement de format (outil de découpe, film, fourreaux, réglages). */
  dureeFormat: 65,
  nep: 9,
  /** Minutes par NEP entre deux recettes, dont le cycle validé. */
  dureeNep: 70,
  cycleNep: 45,
  microArrets: 470,
  /** Minutes par micro-arrêt du doseur. */
  dureeMicro: 1.25,
  /** La part des pots produits écartés par le contrôle d'étanchéité. */
  malScelles: 0.072,
  /** Les pots jetés à chaque redémarrage, après un changement ou un NEP. */
  purge: 5000,
} as const;

/** Les heures perdues chaque semaine aux changements de format et aux NEP : 17. */
export const HEURES_CHANGEMENTS =
  (RELEVE.formats * RELEVE.dureeFormat + RELEVE.nep * RELEVE.dureeNep) / 60;
/** Les heures perdues aux micro-arrêts du doseur : 9,8. */
export const HEURES_MICRO = (RELEVE.microArrets * RELEVE.dureeMicro) / 60;

/* ---------------------------------------------------------------------------
 * L'ÉCONOMIE D'UN POT.
 * ------------------------------------------------------------------------- */
/** Prix net moyen d'un pot, marque et MDD confondues, après remises et coopération commerciale. */
export const PRIX = 0.19;
/** Le coût variable d'un pot, poste par poste. */
export const COUTS = {
  lait: 0.06,
  ingredients: 0.026,
  emballages: 0.032,
  energieNep: 0.012,
} as const;
export const COUT_VARIABLE = Object.values(COUTS).reduce((s, x) => s + x, 0);
export const MCV = PRIX - COUT_VARIABLE;
/** Taux de service exigé par les enseignes ; au-delà, chaque pot manquant est pénalisé. */
export const TAUX_SERVICE = 0.985;
/** Pénalité logistique : 20 % de la valeur des pots manquants au-delà de la tolérance. */
export const PENALITE = 0.2 * PRIX;

/** Les commandes des enseignes, en pots par semaine, d'après le plan industriel et commercial. */
export const DEMANDE = [
  0, 920000, 935000, 950000, 965000, 985000, 1010000, 1040000, 1070000, 1100000, 1130000, 1160000,
  1190000, 1200000,
] as const;
/** Les commandes de juillet, que le plan industriel et commercial chiffre déjà. */
export const DEMANDE_JUILLET = 1190000;
export const SEMAINES_JUILLET = 4;

export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux, la ligne tourne comme avant : purges et ruptures. */
export const PERTE_PAR_JOUR = 2000;

/* ---------------------------------------------------------------------------
 * LES DÉCISIONS.
 * ------------------------------------------------------------------------- */
export const D = {
  reponse: 0,
  smed: 1,
  ordonnancement: 2,
  juin: 3,
  scellage: 4,
  ete: 5,
} as const;

/** Ne rien changer, décision par décision. */
export const NEUTRE = [3, 3, 3, 3, 3, 3] as const;

/** La deuxième ligne : le devis, et ce que l'étude coûte au trimestre. */
export const DEUXIEME_LIGNE = {
  investissement: 2400000,
  cadence: 24000,
  livraisonMois: 9,
  etude: 24000,
  /** Les méthodes et la maintenance sont prises par le cahier des charges : le chantier attend. */
  retard: 2,
} as const;

/** Un samedi : deux équipes de huit heures, heures majorées, laboratoire et maintenance d'astreinte. */
export const SAMEDI = { heures: 16, cout: 6500 } as const;

/** Les trois façons de mener le chantier de réduction des temps de changement (D2). */
export const SMED = {
  /** Avec les conducteurs : vidéo, tri de ce qui se fait ligne arrêtée ou non, chariot et kits. */
  conducteurs: {
    cout: 3500,
    format: 32,
    nep: 52,
    /** Si l'équipe d'après-midi ne suit pas : la moitié du gain, deux semaines plus tard. */
    formatPartiel: 50,
    nepPartiel: 62.5,
    delai: 2,
    delaiPartiel: 4,
  },
  /** Le service méthodes écrit le nouveau standard : moins de gain, plus tard. */
  methodes: { cout: 0, format: 52, nep: 66, delai: 4 },
  /** Le fabricant de la machine : outils à serrage rapide, livrés en semaine 8. */
  fabricant: { cout: 16000, format: 42, debut: 8 },
  /** Le chantier commence la semaine qui suit la décision (semaine 4). */
  debut: 4,
} as const;

/** Dès la semaine 2, ce que la décomposition fait gagner sans attendre le chantier. */
export const PREMIERS_GAINS = { format: 54, nep: 62 } as const;

/** L'adhésion de l'équipe d'après-midi au chantier, selon la réponse de la semaine 1. */
export function chanceDAdhesion(chemin: readonly number[]): number {
  const d1 = chemin[D.reponse];
  if (d1 === 2) return 0.85;
  if (d1 === 1) return 0.55;
  if (d1 === 0) return 0.65;
  return 0.45;
}

/** L'ordonnancement des fabrications (D3), à partir de la semaine 6. */
export const ORDONNANCEMENT = [
  /** Campagnes hebdomadaires : un parfum par série longue. */
  { formats: 3, nep: 2, casse: 0.04, sensibilite: 0.6, stockage: 3500 },
  /** Roue quotidienne : nature, clair, foncé, allergènes avant le NEP du soir. */
  { formats: 5, nep: 5, casse: 0.006, sensibilite: 0, stockage: 0 },
  /** Les recettes avec allergène regroupées le vendredi. */
  { formats: 6, nep: 6, casse: 0.012, sensibilite: 0.1, stockage: 0 },
  /** L'ordre des commandes, au jour le jour. */
  { formats: 6, nep: 9, casse: 0.006, sensibilite: 0, stockage: 0 },
] as const;
export const DEBUT_ORDONNANCEMENT = 6;

/** Juin (D4), à partir de la semaine 8. */
export const JUIN = {
  /** NEP écourté : rinçage acide supprimé, désinfection raccourcie. */
  nepEcourte: 25,
  risqueSanitaire: 0.45,
  /** La révision du doseur, faite un samedi : pièces et majorations. */
  doseur: 7700,
  microApres: 6.5,
  debut: 8,
  samedisDe: 9,
} as const;

/** Une analyse environnementale positive : ce qu'elle coûte. */
export const POSITIVE = {
  /** Une journée de décontamination et de NEP renforcés. */
  arret: 16,
  /** La part de la production de la semaine bloquée en attendant les analyses des produits. */
  bloque: 0.6,
  /** La part des lots bloqués libérés trop tard pour les deux tiers de leur DLC. */
  declasse: 0.5,
  laboratoire: 6000,
} as const;

/** Le scellage (D5), à partir de la semaine 10. */
export const SCELLAGE = {
  debut: 10,
  /** Un film d'opercule à plage de scellage plus large : un peu plus cher, à essayer. */
  film: { surcout: 0.001, reussite: 0.65, apres: 0.05, essaiRate: 0.095, semainesEssai: 2 },
  /** Le fabricant règle la tête de scellage et change ses joints : six heures d'arrêt. */
  reglage: { cout: 4500, arret: 6, apres: 0.06 },
  /** Ralentir la ligne pour laisser le scellage se faire. */
  ralentir: { cadence: 0.95, apres: 0.058 },
} as const;

/** L'été (D6) : la part des gains que le standard tient en juillet, et ce que l'option coûte. */
export const ETE = [
  { durabilite: 0.9, cout: 4200 },
  { durabilite: 0.5, cout: DEUXIEME_LIGNE.etude },
  { durabilite: 0.6, cout: 1500 },
  { durabilite: 0.5, cout: 0 },
] as const;

/** La fatigue de l'équipe : au départ, ce qu'un samedi ajoute, ce qu'une semaine sans samedi retire. */
export const FATIGUE = { depart: 0.3, samedi: 0.08, repos: 0.03 } as const;
/** Le risque d'accident, lu sur la fatigue de la semaine tirée. */
export const risqueDAccident = (fatigue: number) => Math.min(0.4, Math.max(0, fatigue - 0.45));
export const COUT_ACCIDENT = 6000;

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
  effet: { heures?: number; demande?: number; changement?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "compresseur",
    titre: "Panne du compresseur d'air",
    de: "Klervi Nédélec",
    role: "Responsable maintenance",
    texte:
      "Le compresseur d'air comprimé de l'atelier a lâché mardi : dix heures sans air, la ligne 3 à l'arrêt le temps de brancher le compresseur de secours.",
    duree: 1,
    effet: { heures: 10 },
  },
  {
    id: "opercules",
    titre: "Opercules livrés en retard",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Le fournisseur d'opercules a livré avec un jour et demi de retard : la ligne 3 a attendu ses bobines, douze heures perdues.",
    duree: 1,
    effet: { heures: 12 },
  },
  {
    id: "absences",
    titre: "Trois conducteurs absents",
    de: "Maëwenn Postec",
    role: "Directrice des ressources humaines",
    texte:
      "Une gastro-entérite touche l'atelier : trois conducteurs absents deux semaines, remplacés par des intérimaires qui découvrent la ligne. Chaque changement prend un quart d'heure de plus.",
    duree: 2,
    effet: { changement: 15 },
  },
  {
    id: "opaline",
    titre: "Commande exceptionnelle d'Opaline",
    de: "Naïm Lefeuvre",
    role: "Directeur des grands comptes et des MDD",
    texte:
      "Opaline a perdu un fournisseur de yaourts aromatisés pour sa marque de distributeur : elle nous demande 8 % de volumes en plus pendant deux semaines.",
    duree: 2,
    effet: { demande: 1.08 },
  },
  {
    id: "chaleur",
    titre: "Chaleur précoce",
    de: "Ysée Bescond",
    role: "Responsable supply chain",
    texte:
      "Premières chaleurs sur tout l'Ouest : les enseignes relèvent leurs commandes de produits frais de 7 % pendant deux semaines.",
    duree: 2,
    effet: { demande: 1.07 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

interface Bruit {
  /** Les commandes de la semaine, rapportées au plan. */
  demande: number;
  /** La durée des changements, rapportée à la normale. */
  changements: number;
  /** Les micro-arrêts, rapportés à la normale. */
  micro: number;
}

export interface Hasard {
  semaines: readonly (Bruit | null)[];
  /** L'équipe d'après-midi s'empare-t-elle du chantier ? */
  uAdhesion: number;
  /** Le prélèvement de surface revient-il positif, quand les NEP sont écourtés ? */
  uSanitaire: number;
  /** La semaine où il reviendrait positif, de 9 à 12. */
  semaineSanitaire: number;
  /** L'essai du nouveau film réussit-il ? */
  uFilm: number;
  /** Un accident, si l'équipe est fatiguée, et la semaine où il arriverait. */
  uAccident: number;
  semaineAccident: number;
  imprevus: readonly ImprevuTire[];
}

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1001041 + 7);
  const semaines: (Bruit | null)[] = [null];
  for (let w = 1; w <= SEMAINES; w += 1) {
    semaines.push({
      demande: Math.min(1.08, Math.max(0.92, 1 + 0.035 * gauss(r))),
      changements: Math.min(1.15, Math.max(0.85, 1 + 0.05 * gauss(r))),
      micro: Math.min(1.25, Math.max(0.8, 1 + 0.08 * gauss(r))),
    });
  }
  const uAdhesion = r();
  const uSanitaire = r();
  const semaineSanitaire = 9 + Math.floor(r() * 4);
  const uFilm = r();
  const uAccident = r();
  const semaineAccident = 6 + Math.floor(r() * 7);
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
    uAdhesion,
    uSanitaire,
    semaineSanitaire,
    uFilm,
    uAccident,
    semaineAccident,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** L'équipe d'après-midi suivrait-elle un chantier mené avec elle, après la réponse de la semaine 1 ? */
export const suivrait = (chemin: readonly number[], graine: number) =>
  hasard(graine).uAdhesion < chanceDAdhesion(chemin);

/** L'équipe d'après-midi s'empare-t-elle du chantier mené avec les conducteurs ? */
export const adhesion = (chemin: readonly number[], graine: number) =>
  chemin[D.smed] === 0 && suivrait(chemin, graine);

/** La semaine où le chantier commence : retardé par l'étude d'une deuxième ligne, avancé si la décomposition l'a lancé. */
export function debutDuChantier(chemin: readonly number[]): number {
  const d1 = chemin[D.reponse];
  return (
    SMED.debut + (d1 === 0 ? DEUXIEME_LIGNE.retard : 0) - (d1 === 2 && chemin[D.smed] === 0 ? 2 : 0)
  );
}

/** La semaine où l'on voit si l'équipe d'après-midi suit le chantier. */
export const semaineAdhesion = (chemin: readonly number[]) =>
  Math.max(SMED.debut, debutDuChantier(chemin) + 1);

/** La semaine où un prélèvement de surface revient positif ; 0 s'il n'y en a pas. */
export function semainePositive(chemin: readonly number[], graine: number): number {
  const h = hasard(graine);
  return chemin[D.juin] === 0 && h.uSanitaire < JUIN.risqueSanitaire ? h.semaineSanitaire : 0;
}

/** L'essai du nouveau film réussit-il ? Le hasard seul en décide. */
export const filmReussi = (graine: number) => hasard(graine).uFilm < SCELLAGE.film.reussite;

/** Les durées d'un changement de format et d'un NEP, en minutes, une semaine donnée. */
export function durees(chemin: readonly number[], graine: number, w: number) {
  const [d1, d2, , d4] = chemin;
  const retard = d1 === 0 ? DEUXIEME_LIGNE.retard : 0;
  // Lancé dès la décomposition de la semaine 1, le chantier des conducteurs a deux semaines d'avance.
  const debut = debutDuChantier(chemin);
  let format: number = RELEVE.dureeFormat;
  let nep: number = RELEVE.dureeNep;
  if (d2 === 0) {
    const c = SMED.conducteurs;
    if (adhesion(chemin, graine)) {
      if (w >= debut + c.delai) [format, nep] = [c.format, c.nep];
    } else if (w >= debut + c.delaiPartiel) [format, nep] = [c.formatPartiel, c.nepPartiel];
  } else if (d2 === 1) {
    if (w >= debut + SMED.methodes.delai) [format, nep] = [SMED.methodes.format, SMED.methodes.nep];
  } else if (d2 === 2) {
    if (w >= SMED.fabricant.debut + retard) format = SMED.fabricant.format;
  }
  // Les premiers gains de la décomposition : la recette suivante et l'outil préparés ligne en marche.
  if (d1 === 2 && w >= 2) {
    format = Math.min(format, PREMIERS_GAINS.format);
    nep = Math.min(nep, PREMIERS_GAINS.nep);
  }
  if (d4 === 0 && w >= JUIN.debut) nep -= JUIN.nepEcourte;
  return { format, nep };
}

/** Le nombre de changements de format et de NEP par semaine, selon l'ordonnancement. */
export function enchainements(chemin: readonly number[], w: number) {
  const o = w >= DEBUT_ORDONNANCEMENT ? ORDONNANCEMENT[chemin[D.ordonnancement]!]! : null;
  return o
    ? { formats: o.formats, nep: o.nep }
    : { formats: RELEVE.formats as number, nep: RELEVE.nep as number };
}

/** Les samedis travaillés : quatre au printemps (semaines 3 à 6), cinq en juin (9 à 13). */
export function samedi(chemin: readonly number[], w: number): boolean {
  return (
    (chemin[D.reponse] === 1 && w >= 3 && w <= 6) || (chemin[D.juin] === 2 && w >= JUIN.samedisDe)
  );
}

/** Le taux de pots mal scellés, une semaine donnée, avant la fatigue. */
export function malScelles(chemin: readonly number[], graine: number, w: number): number {
  const d5 = chemin[D.scellage];
  if (w < SCELLAGE.debut) return RELEVE.malScelles;
  if (d5 === 0) {
    if (filmReussi(graine)) return SCELLAGE.film.apres;
    return w < SCELLAGE.debut + SCELLAGE.film.semainesEssai
      ? SCELLAGE.film.essaiRate
      : RELEVE.malScelles;
  }
  if (d5 === 1) return SCELLAGE.reglage.apres;
  if (d5 === 2) return SCELLAGE.ralentir.apres;
  return RELEVE.malScelles;
}

/* ---------------------------------------------------------------------------
 * LA SEMAINE DE LA LIGNE.
 * ------------------------------------------------------------------------- */
export type Semaine = {
  /** Le TRS de la semaine : pots bons, rapportés à ce que la cadence nominale ferait sur l'ouverture. */
  trs: number;
  disponibilite: number;
  performance: number;
  qualite: number;
  /** Les heures perdues aux changements de format et aux NEP, ramenées à une semaine de 80 heures. */
  heuresChangements: number;
  heuresMicro: number;
  /** Les pots commandés, livrés, et ce que la ligne pouvait livrer. */
  demande: number;
  livres: number;
  capacite: number;
  /** Le taux de service cumulé depuis le début du trimestre. */
  service: number;
  /** Les pots non livrés, cumulés. */
  manque: number;
  /** Rebuts et casse de la semaine, au coût variable. */
  pertes: number;
  /** Rebuts et casse cumulés, au coût variable. */
  pertesCumul: number;
  /** Ce que la semaine apporte : marge sur coût variable, moins pénalités, pertes et frais. */
  contribution: number;
  /** La contribution cumulée depuis le début du trimestre. */
  cumul: number;
  samedi: number;
  fatigue: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** Contribution du trimestre, plus la capacité gagnée pour juillet. */
  objectif: number;
  contribution: number;
  mcv: number;
  penalites: number;
  /** Rebuts et casse, au coût variable. */
  pertes: number;
  casse: number;
  /** Samedis, mesures, étude, analyses, accident, enquête. */
  frais: number;
  samedis: number;
  coutSamedis: number;
  /** La valeur de la capacité gagnée pour juillet. */
  juillet: number;
  /** Les pots par semaine que la ligne livre de plus qu'au départ, en fin de trimestre. */
  gainPots: number;
  durabilite: number;
  service: number;
  manque: number;
  trsMoyen: number;
  trsFinal: number;
  heuresChangementsFinal: number;
  /** Le chantier a-t-il été mené avec les conducteurs, et l'équipe d'après-midi a-t-elle suivi ? */
  chantierConducteurs: boolean;
  adhesion: boolean;
  /** L'équipe d'après-midi aurait-elle suivi, sous ce hasard ? */
  suivrait: boolean;
  positive: number;
  accident: number;
  filmReussi: boolean;
}

/** La structure d'une semaine de 80 heures : les heures perdues, et les pots bons qu'elle peut sortir. */
function structure(
  chemin: readonly number[],
  graine: number,
  w: number,
  bruit: { changements: number; micro: number },
  extraChangement: number,
  fatigue: number,
) {
  const { formats, nep } = enchainements(chemin, w);
  const { format, nep: dureeNep } = durees(chemin, graine, w);
  const heuresChangements =
    ((formats * (format + extraChangement) + nep * (dureeNep + extraChangement)) / 60) *
    bruit.changements;
  let micro = chemin[D.juin] === 1 && w >= JUIN.debut ? JUIN.microApres : HEURES_MICRO;
  micro *= bruit.micro * (1 + 0.8 * Math.max(0, fatigue - FATIGUE.depart));
  const ralentie = chemin[D.scellage] === 2 && w >= SCELLAGE.debut ? SCELLAGE.ralentir.cadence : 1;
  const ms = malScelles(chemin, graine, w) + 0.04 * Math.max(0, fatigue - FATIGUE.depart);
  return { formats, nep, heuresChangements, micro, ralentie, ms, redemarrages: formats + nep };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [, d2, d3, , d5, d6] = chemin;
  const adhere = adhesion(chemin, graine);
  const positive = semainePositive(chemin, graine);
  const semaines: (Semaine | null)[] = [null];
  let fatigue: number = FATIGUE.depart;
  let cumul = 0;
  let mcvTotal = 0;
  let penalites = 0;
  let pertes = 0;
  let casseTotal = 0;
  let frais = 0;
  let samedis = 0;
  let coutSamedis = 0;
  let demandeTotale = 0;
  let livresTotal = 0;
  let trsTotal = 0;
  let accident = 0;
  let report = 0;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const n = h.semaines[w]!;
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    let cout = w === 1 ? Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR : 0;

    // La fatigue : chaque samedi l'alourdit, chaque semaine sans samedi la soulage.
    const travailleSamedi = samedi(chemin, w);
    fatigue = travailleSamedi
      ? Math.min(1, fatigue + FATIGUE.samedi)
      : Math.max(FATIGUE.depart, fatigue - FATIGUE.repos);

    // La structure de la semaine.
    let extra = 0;
    let arrets = 0;
    let demandeFacteur = 1;
    for (const a of actifs) {
      extra += a.imprevu.effet.changement ?? 0;
      arrets += a.imprevu.effet.heures ?? 0;
      demandeFacteur *= a.imprevu.effet.demande ?? 1;
    }
    const s = structure(chemin, graine, w, n, extra, fatigue);
    if (d5 === 1 && w === SCELLAGE.debut) arrets += SCELLAGE.reglage.arret;
    if (positive && w === positive) arrets += POSITIVE.arret;
    if (accident === 0 && w === h.semaineAccident && travailleSamedi) {
      if (h.uAccident < risqueDAccident(fatigue)) {
        accident = w;
        arrets += 2;
        cout += COUT_ACCIDENT;
      }
    }

    // Les heures et les pots : la semaine, et le samedi s'il est travaillé, à la même structure.
    const ouverture = OUVERTURE + (travailleSamedi ? SAMEDI.heures : 0);
    const echelle = ouverture / OUVERTURE;
    const changements = s.heuresChangements * echelle;
    const micro = s.micro * echelle;
    const disponible = Math.max(0, ouverture - changements - arrets);
    const marche = Math.max(0, disponible - micro);
    const produitsMax = marche * CADENCE * s.ralentie;
    const purges = s.redemarrages * echelle * RELEVE.purge;
    const bonsMax = Math.max(0, produitsMax * (1 - s.ms) - purges);

    // La casse : les séries longues gardent les pots en chambre froide, surtout quand les
    // commandes fléchissent.
    const o = w >= DEBUT_ORDONNANCEMENT ? ORDONNANCEMENT[d3!]! : ORDONNANCEMENT[3]!;
    const tauxCasse = o.casse + o.sensibilite * Math.max(0, 1 - n.demande);

    // Les commandes, et ce que la ligne livre : elle ne produit que ce qui part.
    const demande = DEMANDE[w]! * n.demande * demandeFacteur;
    let vendables = bonsMax * (1 - tauxCasse) + report;
    report = 0;
    let bloques = 0;
    if (positive && w === positive) {
      bloques = bonsMax * POSITIVE.bloque;
      vendables -= bloques;
      report = bloques * (1 - POSITIVE.declasse);
      cout += POSITIVE.laboratoire;
    }
    const livres = Math.min(demande, Math.max(0, vendables));
    // La part de la capacité utilisée : si la ligne peut livrer plus que commandé, elle s'arrête plus tôt.
    const charge = vendables > demande && bonsMax > 0 ? demande / vendables : 1;
    const produits = produitsMax * charge;
    const bons = bonsMax * charge;
    const rebuts = produits * s.ms + purges;
    const casse = bons * tauxCasse + bloques * POSITIVE.declasse;
    const manque = demande - livres;
    const penalite = Math.max(0, manque - (1 - TAUX_SERVICE) * demande) * PENALITE;
    const perte = (rebuts + casse) * COUT_VARIABLE;

    // Les frais des décisions.
    if (chemin[D.reponse] === 0 && w >= 2 && w <= 3) cout += DEUXIEME_LIGNE.etude / 2;
    if (d2 === 0 && w === SMED.debut) cout += SMED.conducteurs.cout;
    if (d2 === 2 && w === SMED.debut) cout += SMED.fabricant.cout;
    if (chemin[D.juin] === 1 && w === JUIN.debut) cout += JUIN.doseur;
    if (d5 === 0 && w >= SCELLAGE.debut) {
      const enEssai = w < SCELLAGE.debut + SCELLAGE.film.semainesEssai;
      if (filmReussi(graine) || enEssai) cout += produits * SCELLAGE.film.surcout;
    }
    if (d5 === 1 && w === SCELLAGE.debut) cout += SCELLAGE.reglage.cout;
    cout += o.stockage;
    if (w === 12) cout += ETE[d6!]!.cout / 2;
    if (w === 13) cout += ETE[d6!]!.cout / 2;
    if (travailleSamedi) {
      samedis += 1;
      coutSamedis += SAMEDI.cout;
      cout += SAMEDI.cout;
    }

    const mcv = livres * MCV;
    const contribution = mcv - penalite - perte - cout;
    cumul += contribution;
    mcvTotal += mcv;
    penalites += penalite;
    pertes += perte;
    casseTotal += casse;
    frais += cout;
    demandeTotale += demande;
    livresTotal += livres;

    const trs = bonsMax / (ouverture * CADENCE);
    trsTotal += trs;
    semaines.push({
      trs,
      disponibilite: disponible / ouverture,
      performance: disponible > 0 ? (marche * s.ralentie) / disponible : 0,
      qualite: produitsMax > 0 ? bonsMax / produitsMax : 0,
      heuresChangements: s.heuresChangements,
      heuresMicro: s.micro,
      demande,
      livres,
      capacite: bonsMax * (1 - tauxCasse),
      service: livresTotal / demandeTotale,
      manque: demandeTotale - livresTotal,
      pertes: perte,
      pertesCumul: pertes,
      contribution,
      cumul,
      samedi: travailleSamedi ? 1 : 0,
      fatigue,
    });
  }

  // La capacité gagnée pour juillet : la semaine 13 sans samedi ni imprévu, rapportée au départ.
  const fin = structure(chemin, graine, SEMAINES, { changements: 1, micro: 1 }, 0, FATIGUE.depart);
  const marcheFin = OUVERTURE - fin.heuresChangements - fin.micro;
  const bonsFin =
    marcheFin * CADENCE * fin.ralentie * (1 - fin.ms) - fin.redemarrages * RELEVE.purge;
  const oFin = ORDONNANCEMENT[d3!]!;
  const gainPots = Math.max(0, bonsFin * (1 - oFin.casse) - CAPACITE_DEPART);
  const durabilite = ETE[d6!]!.durabilite;
  const manqueJuillet = DEMANDE_JUILLET - CAPACITE_DEPART;
  const juillet =
    SEMAINES_JUILLET * Math.min(manqueJuillet, gainPots * durabilite) * (MCV + PENALITE);

  const pleines = semaines.slice(1) as Semaine[];
  return {
    semaines,
    objectif: cumul + juillet,
    contribution: cumul,
    mcv: mcvTotal,
    penalites,
    pertes,
    casse: casseTotal,
    frais,
    samedis,
    coutSamedis,
    juillet,
    gainPots,
    durabilite,
    service: livresTotal / demandeTotale,
    manque: demandeTotale - livresTotal,
    trsMoyen: trsTotal / SEMAINES,
    trsFinal: pleines[SEMAINES - 1]!.trs,
    heuresChangementsFinal: pleines[SEMAINES - 1]!.heuresChangements,
    chantierConducteurs: d2 === 0,
    adhesion: adhere,
    suivrait: suivrait(chemin, graine),
    positive,
    accident,
    filmReussi: filmReussi(graine),
  };
}

/** La ligne au départ : ce qu'elle livre par semaine, TRS de 57 %, casse ordinaire déduite. */
export const DEPART = (() => {
  const marche = OUVERTURE - HEURES_CHANGEMENTS - HEURES_MICRO;
  const produits = marche * CADENCE;
  const bons = produits * (1 - RELEVE.malScelles) - (RELEVE.formats + RELEVE.nep) * RELEVE.purge;
  return {
    produits,
    bons,
    trs: bons / (OUVERTURE * CADENCE),
    disponibilite: (OUVERTURE - HEURES_CHANGEMENTS) / OUVERTURE,
    performance: marche / (OUVERTURE - HEURES_CHANGEMENTS),
    qualite: bons / produits,
    rebuts: produits - bons,
  };
})();
/** Ce que la ligne livre par semaine au départ, casse ordinaire déduite. */
export const CAPACITE_DEPART = DEPART.bons * (1 - ORDONNANCEMENT[3]!.casse);

/** Ce qui s'est passé pendant des semaines : l'équipe, l'analyse, l'accident, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    adhesion: chemin[D.smed] === 0 && dans(semaineAdhesion(chemin)),
    positive: t.positive > 0 && dans(t.positive),
    accident: t.accident > 0 && dans(t.accident),
    casse: chemin[D.ordonnancement] === 0 && dans(8),
    doseur: chemin[D.juin] === 1 && dans(JUIN.debut),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureLigne {
  trs: number | null;
  heuresChangements: number | null;
  service: number | null;
  pertesCumul: number | null;
  cumul: number | null;
  budgetADate: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  demande: number | null;
  capacite: number | null;
  manque: number | null;
  heuresMicro: number | null;
}

/** La contribution que le budget attend de la ligne sur le trimestre. */
export const BUDGET = 420000;

/** Ce que Gurvan lit à la fin d'une semaine ; les décisions à venir comptent comme « ne rien changer ». */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureLigne {
  if (semaine === 0) {
    return {
      trs: DEPART.trs,
      heuresChangements: HEURES_CHANGEMENTS,
      service: 0.99,
      pertesCumul: 0,
      cumul: 0,
      budgetADate: 0,
      demande: DEMANDE[1]!,
      capacite: CAPACITE_DEPART,
      manque: 0,
      heuresMicro: HEURES_MICRO,
    };
  }
  const chemin = NEUTRE.map((x, i) => decisions[i] ?? x);
  const s = simuler(chemin, graine, jours).semaines[semaine]!;
  return {
    trs: s.trs,
    heuresChangements: s.heuresChangements,
    service: s.service,
    pertesCumul: s.pertesCumul,
    cumul: s.cumul,
    budgetADate: (BUDGET * semaine) / SEMAINES,
    demande: s.demande,
    capacite: s.capacite,
    manque: s.manque,
    heuresMicro: s.heuresMicro,
  };
}
