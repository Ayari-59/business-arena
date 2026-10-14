/**
 * RESTER GÉNÉRALISTE OU SE SPÉCIALISER — le modèle du positionnement d'Atlas
 * Conseil face à l'arrivée de Halden Partners à Nantes.
 *
 * Halden Partners, cabinet national, ouvre un bureau à Nantes en semaine 3 et
 * vend ses missions généralistes (organisation, conduite du changement,
 * performance des services) 15 % sous les prix d'Atlas. Les bureaux de Nantes
 * et de Rennes font 11 700 jours généralistes par an à 900 € ; la petite
 * équipe « hôpitaux et médico-social » (14 consultants, des références dans
 * une trentaine d'établissements) en fait 2 288 à 1 050 €. Victoire Lanoë,
 * présidente, doit dire au comité de direction comment Atlas se positionne
 * pour les trois ans qui viennent. Septembre à novembre, treize semaines, six
 * décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE EN SEMAINE 13. Un positionnement se juge sur
 * des années, un épisode sur un trimestre. On compte, en écart au plan d'avant
 * Halden et sur le seul périmètre exposé (les missions généralistes de Nantes
 * et de Rennes, et les missions santé) :
 *
 *   · le RÉSULTAT DU TRIMESTRE : le chiffre d'affaires des jours facturés,
 *     semaine par semaine, moins ce qu'il faut dépenser en plus (étude,
 *     campagne, experte, formation, recrutements, temps des associés). Les
 *     salaires des consultants sont dus de toute façon : une journée non vendue
 *     est perdue, elle ne se stocke pas ;
 *   · PLUS LA VALEUR DE LA POSITION PRISE : une année pleine au régime atteint
 *     en semaine 13 — les volumes que Halden a pris ou non, les prix consentis,
 *     les clients historiques gardés ou partis, la demande santé que le
 *     positionnement attire dans le scénario de marché révélé, la capacité
 *     engagée pour janvier (consultants déplacés, formés, recrutés), le contrat
 *     du groupement hospitalier —, recalculée avec ce que le trimestre a
 *     révélé. Le reste du plan à trois ans est trop incertain pour être compté ;
 *   · ce qui reste inconnu en semaine 13 (la tranche optionnelle du contrat
 *     hospitalier) est compté en espérance.
 *
 * Ne rien faire n'est pas neutre : Halden prend des volumes, et des
 * consultants payés restent sans mission. Le hasard porte sur ce que le
 * trimestre révèle, jamais sur les règles du calcul.
 *
 * Quatre mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · SUR LE GÉNÉRALISTE, LE PRIX DÉCIDE, ET HALDEN PEUT SUIVRE. Quatre jours
 *     généralistes sur dix se rejouent chaque année en mise en concurrence, et
 *     Halden fait tomber notre taux de transformation de 28 % à 22,4 % : à nos
 *     prix, nous perdons 8 % des jours. S'aligner de 10 % garde les volumes,
 *     mais rend 10 % du prix sur tous les jours, ceux qui ne partaient pas
 *     compris, et ces 10 % sont de la marge pure, puisque les salaires ne
 *     baissent pas. Halden, qui a une pyramide plus large et des juniors moins
 *     chers, recasse ses prix six fois sur dix quand un cabinet régional
 *     s'aligne : l'écart revient, la baisse reste.
 *   · LÀ OÙ NOS RÉFÉRENCES COMPTENT, NOUS AVONS DU POUVOIR DE PRIX. Sur la
 *     transformation des hôpitaux et des établissements médico-sociaux, les
 *     acheteurs notent d'abord la technique et les références : Atlas y vend
 *     1 050 € et y transforme 46 % de ses propositions. La demande qu'un
 *     positionnement lisible y attire dépend des budgets publics : un plan
 *     régional de transformation renforcé (un peu plus d'une chance sur
 *     trois), reconduit (quatre sur dix) ou gelé (une sur quatre), connu à la
 *     mi-novembre.
 *   · SE SPÉCIALISER CONCENTRE LE RISQUE : ÇA SE FAIT PAR ÉTAPES, ET ÇA SE
 *     TESTE. Déplacer vers la santé des généralistes que Halden laisse sans
 *     mission ne coûte presque rien ; recruter des seniors pour une demande
 *     qui ne viendra peut-être pas coûte leur salaire. Un test — une étude
 *     publiée et le bureau de Rennes repositionné — dit en semaine 8, avec un
 *     bruit, si le marché répond : il faut alors savoir réviser l'étape
 *     suivante, à la hausse ou à la baisse.
 *   · SE SPÉCIALISER TROP VITE FAIT PARTIR LES CLIENTS HISTORIQUES. Trente pour
 *     cent des jours généralistes viennent de clients fidèles depuis des
 *     années ; s'ils entendent qu'Atlas « ne fait plus que de la santé », 30 %
 *     de leurs volumes s'en vont : plus de huit fois sur dix quand on bascule
 *     tout d'un coup, trois fois sur dix avec un pôle bien délimité. Un associé
 *     référent par compte les retient mieux qu'une remise, qui coûte sur tous
 *     leurs jours. Quand on ne se spécialise pas, ils ne s'inquiètent pas.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprises, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** L'horizon sur lequel le comité valorise la position prise : une année pleine. */
export const SEMAINES_PAR_AN = 52;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : le comité est reporté, deux propositions partent à prix cassé sans arbitrage. */
export const PERTE_PAR_JOUR = 4000;
/** Halden ouvre son bureau de Nantes au début de la semaine 3. */
export const OUVERTURE = 3;

/** Les missions généralistes des bureaux de Nantes et de Rennes : jours facturés par an, TJM moyen, consultants. */
export const GENERALISTE = { jours: 11700, tjm: 900, consultants: 80 } as const;
/** L'équipe hôpitaux et médico-social : jours facturés par an, TJM moyen, consultants. */
export const SANTE = { jours: 2288, tjm: 1050, consultants: 14 } as const;
/** Les jours ouvrés d'un consultant par an, et ce qu'il peut facturer au plus. */
export const JOURS_OUVRES = 210;
export const FACTURABLES_MAX = 175;
/** Ce qu'un consultant facture au plus par semaine. */
export const PAR_SEMAINE = FACTURABLES_MAX / SEMAINES_PAR_AN;
/** Le taux d'occupation cible du cabinet. */
export const OCCUPATION_CIBLE = 0.75;
/**
 * Ce que vaut en santé, la première année, un généraliste déplacé, rapporté à
 * un consultant de l'équipe : 85 % quand on choisit ceux qui ont déjà
 * travaillé sur le médico-social, 70 % quand on bascule toute une practice.
 */
export const EFFICACITE_DEPLACES = { choisis: 0.85, tous: 0.7 } as const;
export const efficacite = (d1: number) =>
  d1 === 2 ? EFFICACITE_DEPLACES.tous : EFFICACITE_DEPLACES.choisis;

/** Les jours généralistes et santé d'une semaine du plan d'avant Halden. */
export const JOURS_G = GENERALISTE.jours / SEMAINES_PAR_AN;
export const JOURS_H = SANTE.jours / SEMAINES_PAR_AN;
/** Le chiffre d'affaires d'une semaine du plan, sur le périmètre. */
export const PLAN = JOURS_G * GENERALISTE.tjm + JOURS_H * SANTE.tjm;

/* ---------------------------------------------------------------------------
 * HALDEN SUR LE GÉNÉRALISTE.
 * ------------------------------------------------------------------------- */

/** Le TJM affiché par Halden sur les missions généralistes : 15 % sous le nôtre. */
export const HALDEN = { tjm: 765, recasse: 700 } as const;
/** La part des jours généralistes remise en concurrence chaque année (renouvellements, nouveaux besoins). */
export const EN_CONCURRENCE = 0.4;
/** Notre taux de transformation sur les propositions généralistes, avant et après l'arrivée de Halden à Lille. */
export const TRANSFORMATION = { generaliste: 0.28, avecHalden: 0.224, sante: 0.46 } as const;
/** Les jours généralistes que Halden nous prend, au régime, si nous gardons nos prix. */
export const PERTE_AUX_PRIX =
  EN_CONCURRENCE * (1 - TRANSFORMATION.avecHalden / TRANSFORMATION.generaliste);
/** La baisse que le comité propose sur les TJM généralistes. */
export const ALIGNEMENT = 0.1;
/** La marge perdue par an à s'aligner, à volumes constants : les salaires ne baissent pas. */
export const COUT_ALIGNEMENT = ALIGNEMENT * GENERALISTE.jours * GENERALISTE.tjm;
/**
 * Les jours que Halden prend encore : alignés, presque rien ; s'il recasse
 * ses prix, l'écart revient. À nos prix, s'il recasse, il en prend un peu plus.
 */
export const PERTE = { aligne: 0.015, aligneRecasse: 0.06, recasse: 0.03 } as const;
/** Les missions durent trois à six mois : la perte atteint son régime en seize semaines. */
export const MONTEE = 16;
/** Halden recasse ses prix en semaine 8 : six fois sur dix si nous nous alignons, presque jamais sinon. */
export const RECASSE = { aligne: 0.6, autre: 0.05, brade: 0.25, semaine: 8 } as const;

/* ---------------------------------------------------------------------------
 * LA SANTÉ : un marché que les budgets publics décident.
 * ------------------------------------------------------------------------- */

export type CodeScenario = "porteur" | "moyen" | "gel";

/**
 * Le plan régional de transformation des établissements : renforcé, reconduit
 * ou gelé, annoncé par l'agence régionale de santé en semaine 11. `base` : ce
 * que devient la demande de nos clients actuels ; `marche` : les jours par
 * semaine qu'un positionnement pleinement lisible attirerait en plus.
 */
export const SCENARIOS: Readonly<
  Record<CodeScenario, { chance: number; base: number; marche: number; indice: number }>
> = {
  porteur: { chance: 0.35, base: 1.1, marche: 60, indice: 1 },
  moyen: { chance: 0.4, base: 1.0, marche: 35, indice: 0 },
  gel: { chance: 0.25, base: 0.88, marche: 5, indice: -1 },
};
export const CODES_SCENARIO: readonly CodeScenario[] = ["porteur", "moyen", "gel"];
export const ANNONCE_BUDGET = 11;

/** Le pôle santé de la semaine 1 : dix généralistes déplacés ; tout réorienter : trente. */
export const DEPLACES = [0, 10, 26, 0] as const;
/**
 * LE POSITIONNEMENT : la part du marché santé qu'Atlas peut attirer, de 0 à 1.
 * Le pôle compte ; l'étude, l'experte, la campagne y ajoutent leur part.
 */
export const POSITION = {
  d1: [0, 0.4, 0.35, 0],
  d2: [0.08, 0.15, 0.2, 0],
  /** La deuxième étape en janvier, le pôle créé tard, l'accélération. */
  etape2: 0.15,
  tardif: 0.25,
  accelerer: 0.25,
} as const;
/** La part de la demande attirée qui se signe dès le trimestre : les budgets se votent en fin d'année. */
export const PART_DANS_LE_TRIMESTRE = 0.25;

/** Le premier pas de la semaine 2 : ce qu'il coûte, et la clarté du signal qu'il donne en semaine 8. */
export const REPOSITIONNEMENT = 90000;
export const ETUDE = 35000;
/** L'experte : une ancienne directrice générale de CHU, associée, arrivée en semaine 6. */
export const EXPERTE = { salaire: 280000, jours: 60, tjm: 1400, arrivee: 6 } as const;
/** L'écart type du bruit sur le signal du test, selon le premier pas. */
export const BRUIT_DU_TEST = [0.9, 0.45, 0.7, 1.3] as const;
/** Les demandes entrantes santé sur six semaines, pour un signal donné. */
export const DEMANDES = { centre: 16, pente: 7 } as const;
export const demandesEntrantes = (z: number) =>
  Math.max(2, Math.round(DEMANDES.centre + DEMANDES.pente * z));
/** La règle fixée d'avance : le marché répond au-delà de 18 demandes entrantes en six semaines. */
export const SEUIL_DEMANDES = 18;
/** Le signal à partir duquel le compte dépasse 18 demandes. */
export const SEUIL_TEST = (SEUIL_DEMANDES + 0.5 - DEMANDES.centre) / DEMANDES.pente;

/* ---------------------------------------------------------------------------
 * LES CLIENTS HISTORIQUES.
 * ------------------------------------------------------------------------- */

export const HISTORIQUES = {
  /** Leur part des jours généralistes, et ce qu'ils retirent s'ils partent. */
  part: 0.3,
  perte: 0.3,
  semaine: 9,
  /** La chance qu'ils partent, selon le positionnement de la semaine 1. */
  chance: [0.03, 0.3, 0.85, 0.03],
  /** Repositionner les quatre bureaux d'un coup ajoute à l'inquiétude. */
  repositionnement: 0.15,
  /** La remise de 10 % les retient un peu ; un associé référent, beaucoup. */
  remise: 0.1,
  effetRemise: 0.6,
  effetReferent: 0.3,
  /** Le temps des associés référents, non facturé : ce trimestre, puis par an. */
  referent: { trimestre: 20000, an: 60000 },
} as const;

/* ---------------------------------------------------------------------------
 * L'INTERCONTRAT DES GÉNÉRALISTES.
 * ------------------------------------------------------------------------- */

/** Remplir à prix d'appel : la moitié des jours libres à −25 %, et les clients s'en souviennent. */
export const BRADAGE = { remise: 0.25, part: 0.5, ancrage: 0.03 } as const;
/**
 * Les pré-diagnostics : les généralistes sans mission, encadrés par l'équipe
 * santé, font des diagnostics gratuits de deux jours dans les établissements
 * qui hésitent. Leur temps est payé de toute façon ; il ne coûte que les
 * déplacements, et il rend le positionnement plus visible et plus crédible.
 */
export const PRE_DIAGNOSTICS = { cout: 15000, position: 0.2, de: 7 } as const;
/** Kéroual Consulting prend des consultants en régie, à prix coûtant, jusqu'à fin janvier. */
export const KEROUAL = { tjm: 520, oui: 3, non: 2, chance: 0.6, semainesEnJanvier: 4 } as const;

/* ---------------------------------------------------------------------------
 * LA DEUXIÈME ÉTAPE, ET LE GROUPEMENT HOSPITALIER.
 * ------------------------------------------------------------------------- */

/** La deuxième étape : six seniors santé recrutés pour janvier ; accélérer : douze. */
export const RECRUE = { salaire: 120000, honoraires: 12000 } as const;
export const ETAPE2 = { recrues: 6 } as const;
export const ACCELERER = { recrues: 12 } as const;
/** Le pôle créé en janvier par qui ne l'avait pas fait en septembre ; le repli d'un pôle trop gros. */
export const POLE_TARDIF = 12;
export const REPLI = 13;

/**
 * Le programme de transformation du GHT Loire-Océan : 520 jours l'an prochain.
 * L'acheteur demande 15 %. Ce qu'on lui consent devient le prix que les
 * autres acheteurs hospitaliers demandent : une part de l'ancrage sur tous nos
 * TJM santé.
 */
export const GHT = {
  jours: 520,
  remises: [0.15, 0, 0.07, 0],
  ancrage: [0.05, 0, 0.03, 0],
  /** Tranche ferme et tranche optionnelle : la seconde se confirme quatre fois sur cinq. */
  ferme: 260,
  optionnelle: 0.8,
  semaine: 12,
} as const;

/** La légitimité d'Atlas aux yeux d'un acheteur hospitalier : ses références, son pôle, son premier pas. */
export const LEGITIMITE = { base: 0.25, d1: [0, 0.15, 0.05, 0], d2: [0.05, 0.2, 0.3, 0] } as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  positionnement: 0,
  premierPas: 1,
  historiques: 2,
  intercontrat: 3,
  cap: 4,
  ght: 5,
} as const;

/** Ne rien changer : ni prix ni pôle, rien de plus, rien de particulier, attendre, tenir le cap, tenir le prix. */
export const NEUTRE = [3, 3, 2, 3, 0, 3] as const;

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
  effet: { generaliste?: number; permanent?: number; sante?: number; cout?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "gel",
    titre: "Un industriel gèle ses dépenses de conseil",
    de: "Soumaya Rahmouni",
    role: "Directrice générale des Laiteries Quénéhervé",
    texte:
      "Nos résultats du semestre sont mauvais : le groupe gèle toutes les dépenses de conseil trois semaines, le temps de refaire le budget. Vos deux missions s'arrêtent jusqu'à nouvel ordre.",
    duree: 3,
    effet: { generaliste: -0.06 },
  },
  {
    id: "avenant",
    titre: "Un distributeur prolonge sa mission",
    de: "Mahdi Ouertani",
    role: "Associé, missions généralistes",
    texte:
      "Bonne nouvelle : les Comptoirs Arzhel signent un avenant de quatre semaines sur la réorganisation de leurs entrepôts. Ça occupe six consultants jusqu'au mois prochain.",
    duree: 4,
    effet: { generaliste: 0.04 },
  },
  {
    id: "manager",
    titre: "Un manager part chez Halden",
    de: "Maëline Courtecuisse",
    role: "Directrice des ressources humaines",
    texte:
      "Oumar Tounkara, manager généraliste à Nantes, rejoint Halden à la fin du mois. Deux de ses clients ont déjà demandé s'il pourrait continuer leur mission là-bas.",
    duree: 13,
    effet: { permanent: -0.015 },
  },
  {
    id: "colloque",
    titre: "Le colloque des directeurs d'établissements",
    de: "Léopoldine Quéffelec",
    role: "Directrice du pôle santé",
    texte:
      "Les directeurs d'établissements médico-sociaux de la région m'invitent à leur colloque d'automne pour parler de nos missions sur les EHPAD : trois demandes de rendez-vous dès le lendemain.",
    duree: 3,
    effet: { sante: 3 },
  },
  {
    id: "tempora",
    titre: "Panne de Tempora",
    de: "Gustave Herbelin",
    role: "Directeur administratif et financier",
    texte:
      "Tempora est resté bloqué deux jours en fin de mois : les managers ressaisissent les temps à la main et la facturation part avec une semaine de retard. On estime le temps perdu à 12 k€.",
    duree: 1,
    effet: { cout: 12000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart de la demande généraliste de chaque semaine (indices 1 à 13). */
  bruit: readonly number[];
  scenario: CodeScenario;
  /** L'appétit réel des clients pour les prix de Halden, rapporté à ce qu'on attend. */
  sens: number;
  uRecasse: number;
  uHistoriques: number;
  /** Le bruit du test, en écarts types. */
  eTest: number;
  uKeroual: number;
  uGht: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000849 + 7);
  const u = r();
  const scenario: CodeScenario =
    u < SCENARIOS.porteur.chance
      ? "porteur"
      : u < SCENARIOS.porteur.chance + SCENARIOS.moyen.chance
        ? "moyen"
        : "gel";
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.02 * gauss(r), -0.05, 0.05));
  const sens = borne(1 + 0.12 * gauss(r), 0.75, 1.25);
  const uRecasse = r();
  const uHistoriques = r();
  const eTest = borne(gauss(r), -2.5, 2.5);
  const uKeroual = r();
  const uGht = r();
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
    scenario,
    sens,
    uRecasse,
    uHistoriques,
    eTest,
    uKeroual,
    uGht,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/** La probabilité que Halden recasse ses prix en semaine 8. */
export function chanceRecasse(chemin: readonly number[]): number {
  const base = chemin[D.positionnement] === 0 ? RECASSE.aligne : RECASSE.autre;
  return base + (chemin[D.intercontrat] === 0 ? RECASSE.brade : 0);
}
export const haldenRecasse = (chemin: readonly number[], graine: number) =>
  hasard(graine).uRecasse < chanceRecasse(chemin);

/** La probabilité que les clients historiques retirent un quart de leurs volumes, en semaine 9. */
export function chanceHistoriques(chemin: readonly number[]): number {
  const base =
    HISTORIQUES.chance[chemin[D.positionnement]!]! +
    (chemin[D.premierPas] === 0 ? HISTORIQUES.repositionnement : 0);
  const d3 = chemin[D.historiques];
  return base * (d3 === 0 ? HISTORIQUES.effetRemise : d3 === 1 ? HISTORIQUES.effetReferent : 1);
}
export const historiquesPartent = (chemin: readonly number[], graine: number) =>
  hasard(graine).uHistoriques < chanceHistoriques(chemin);

/** Le signal du test, lu en semaine 8 : l'indice du scénario, et un bruit qui dépend du premier pas. */
export const signal = (chemin: readonly number[], graine: number) => {
  const h = hasard(graine);
  return SCENARIOS[h.scenario].indice + BRUIT_DU_TEST[chemin[D.premierPas]!]! * h.eTest;
};
export const testBon = (chemin: readonly number[], graine: number) =>
  demandesEntrantes(signal(chemin, graine)) > SEUIL_DEMANDES;

/** Combien de consultants Kéroual accepte de prendre en régie : la réponse ne dépend que de lui. */
export const keroualPrend = (graine: number) =>
  hasard(graine).uKeroual < KEROUAL.chance ? KEROUAL.oui : KEROUAL.non;

export const legitimite = (chemin: readonly number[]) =>
  LEGITIMITE.base +
  LEGITIMITE.d1[chemin[D.positionnement]!]! +
  LEGITIMITE.d2[chemin[D.premierPas]!]!;

/** La probabilité que le GHT signe, selon ce qu'on lui répond et la légitimité d'Atlas. */
export function chanceGht(chemin: readonly number[]): number {
  const l = legitimite(chemin);
  switch (chemin[D.ght]) {
    case 0:
      return 0.98;
    case 1:
      return borne(0.45 + 0.6 * l, 0, 0.95);
    case 2:
      return 0.95;
    default:
      return borne(0.2 + 0.5 * l, 0, 0.9);
  }
}
export const ghtSigne = (chemin: readonly number[], graine: number) =>
  hasard(graine).uGht < chanceGht(chemin);

/* ---------------------------------------------------------------------------
 * LA STRUCTURE QUE LES DÉCISIONS DONNENT AU CABINET POUR JANVIER.
 * ------------------------------------------------------------------------- */

export interface Structure {
  aligne: boolean;
  /** Les généralistes passés à la santé : en septembre, formés, en janvier. */
  deplaces: number;
  recrues: number;
  position: number;
  experte: boolean;
  referents: boolean;
  /** La baisse de prix consentie aux clients historiques, et l'ancrage du bradage. */
  remiseHistoriques: boolean;
  brade: boolean;
  /** Le chemin pris en semaine 8 : la deuxième étape, le pôle tardif, le repli, le report. */
  janvier: "rien" | "etape2" | "tardif" | "repli" | "accelerer" | "report";
}

/** Ce que le cabinet sera en janvier, une fois le signal du test lu. */
export function structure(chemin: readonly number[], bon: boolean): Structure {
  const [d1, d2, d3, d4, d5] = chemin as readonly number[];
  let deplaces: number = DEPLACES[d1!]!;
  let position = POSITION.d1[d1!]! + POSITION.d2[d2!]! + (d4 === 1 ? PRE_DIAGNOSTICS.position : 0);
  let recrues = 0;
  let janvier: Structure["janvier"] = "rien";
  const pole = d1 === 1 || d1 === 2;
  const etape2 = () => {
    recrues += ETAPE2.recrues;
    position += POSITION.etape2;
    janvier = "etape2";
  };
  const tardif = () => {
    deplaces += POLE_TARDIF;
    position += POSITION.tardif;
    janvier = "tardif";
  };
  if (d5 === 0) {
    if (d1 === 1) etape2();
  } else if (d5 === 1) {
    if (bon) {
      if (d1 === 1) etape2();
      else if (!pole) tardif();
    } else if (d1 === 2) {
      deplaces -= REPLI;
      position -= 0.1;
      janvier = "repli";
    }
  } else if (d5 === 2) {
    if (!pole) tardif();
    recrues += ACCELERER.recrues;
    position += POSITION.accelerer;
    janvier = "accelerer";
  } else {
    janvier = "report";
  }
  return {
    aligne: d1 === 0,
    deplaces: Math.max(0, deplaces),
    recrues,
    position: borne(position, 0, 1),
    experte: d2 === 2,
    referents: d3 === 1,
    remiseHistoriques: d3 === 0,
    brade: d4 === 0,
    janvier,
  };
}

/* ---------------------------------------------------------------------------
 * UNE ANNÉE AU RÉGIME : ce que la position prise vaut, une fois tout connu.
 * ------------------------------------------------------------------------- */

export interface Monde {
  scenario: CodeScenario;
  recasse: boolean;
  historiques: boolean;
  ght: boolean;
  /** L'appétit des clients pour Halden, 1 tant qu'on ne le connaît pas. */
  sens: number;
  /** La part des jours généralistes que les imprévus ont retirée pour de bon. */
  permanent: number;
  keroual: number;
}

export interface Regime {
  /** La contribution de l'année, en écart au plan. */
  valeur: number;
  joursG: number;
  joursH: number;
  tjmG: number;
  tjmH: number;
  /** Les généralistes sans mission, en équivalents temps plein. */
  intercontrat: number;
}

/** La part des jours généralistes que Halden prend au régime. */
export function perteGeneraliste(aligne: boolean, recasse: boolean, sens: number): number {
  if (aligne) return recasse ? PERTE.aligneRecasse : PERTE.aligne;
  return PERTE_AUX_PRIX * sens + (recasse ? PERTE.recasse : 0);
}

export function regime(chemin: readonly number[], s: Structure, m: Monde): Regime {
  const sc = SCENARIOS[m.scenario];
  // Le généraliste : la demande que Halden et les départs laissent, la capacité qui reste.
  const perte = perteGeneraliste(s.aligne, m.recasse, m.sens);
  const demandeG =
    JOURS_G *
    (1 - perte) *
    (1 - (m.historiques ? HISTORIQUES.part * HISTORIQUES.perte : 0)) *
    (1 + m.permanent);
  const capG = (GENERALISTE.consultants - s.deplaces) * PAR_SEMAINE;
  const joursG = Math.min(demandeG, capG);
  const tjmG =
    GENERALISTE.tjm *
    (s.aligne ? 1 - ALIGNEMENT : 1) *
    (s.brade ? 1 - BRADAGE.ancrage : 1) *
    (s.remiseHistoriques ? 1 - HISTORIQUES.part * HISTORIQUES.remise : 1);
  const libres = capG - joursG;
  // La santé : la demande que le scénario et le positionnement donnent, la capacité du pôle.
  const capH =
    (SANTE.consultants + s.recrues) * PAR_SEMAINE +
    s.deplaces * PAR_SEMAINE * efficacite(chemin[D.positionnement]!);
  const demandeH = JOURS_H * sc.base + s.position * sc.marche;
  const d6 = chemin[D.ght]!;
  const ghtJours = m.ght
    ? (d6 === 1 ? GHT.ferme + GHT.optionnelle * (GHT.jours - GHT.ferme) : GHT.jours) /
      SEMAINES_PAR_AN
    : 0;
  const joursGht = Math.min(ghtJours, capH);
  const joursAutres = Math.min(demandeH, capH - joursGht);
  const ancrage = m.ght ? GHT.ancrage[d6]! : 0;
  const tjmH = SANTE.tjm * (1 - ancrage);
  let hebdo =
    joursG * tjmG +
    joursAutres * tjmH +
    joursGht * SANTE.tjm * (1 - GHT.remises[d6]!) -
    s.recrues * (RECRUE.salaire / SEMAINES_PAR_AN) -
    (s.referents ? HISTORIQUES.referent.an / SEMAINES_PAR_AN : 0);
  if (s.experte) {
    hebdo += (EXPERTE.jours * EXPERTE.tjm - EXPERTE.salaire) / SEMAINES_PAR_AN;
  }
  // Kéroual garde en régie, jusqu'à fin mars, ceux qu'il a pris.
  const regie = Math.min(m.keroual * PAR_SEMAINE, libres) * KEROUAL.tjm * KEROUAL.semainesEnJanvier;
  return {
    valeur: SEMAINES_PAR_AN * (hebdo - PLAN) + regie,
    joursG,
    joursH: joursAutres + joursGht,
    tjmG,
    tjmH,
    intercontrat: libres / PAR_SEMAINE,
  };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en écart au plan. */
  valeur: number;
  /** Le chiffre d'affaires du périmètre de la semaine. */
  ca: number;
  /** Ce que la semaine a apporté au résultat, en écart au plan, dépenses comprises. */
  ecart: number;
  joursG: number;
  joursH: number;
  tjmG: number;
  /** Le taux d'occupation des généralistes. */
  occupation: number;
  /** Les généralistes sans mission, en équivalents temps plein. */
  intercontrat: number;
  /** La position estimée : une année au régime, en espérance de ce qu'on sait. */
  position: number;
  /** Le résultat du trimestre à date, en écart au plan. */
  resultat: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  resultat: number;
  position: number;
  scenario: CodeScenario;
  recasse: boolean;
  historiques: boolean;
  ght: boolean;
  /** Le signal du test, et la décision qu'il a fait prendre. */
  signal: number;
  testBon: boolean;
  keroual: number | null;
  structure: Structure;
  regime: Regime;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/** Les probabilités des scénarios sachant ce qu'on sait en fin de semaine w. */
export function croyance(
  chemin: readonly number[],
  graine: number,
  w: number,
): Record<CodeScenario, number> {
  const h = hasard(graine);
  if (w >= ANNONCE_BUDGET) {
    return { porteur: 0, moyen: 0, gel: 0, [h.scenario]: 1 } as Record<CodeScenario, number>;
  }
  const p = {
    porteur: SCENARIOS.porteur.chance,
    moyen: SCENARIOS.moyen.chance,
    gel: SCENARIOS.gel.chance,
  };
  if (w >= 8) {
    const z = signal(chemin, graine);
    const s = BRUIT_DU_TEST[chemin[D.premierPas]!]!;
    let total = 0;
    for (const c of CODES_SCENARIO) {
      p[c] *= Math.exp(-((z - SCENARIOS[c].indice) ** 2) / (2 * s * s));
      total += p[c];
    }
    for (const c of CODES_SCENARIO) p[c] /= total;
  }
  return p;
}

/** La position estimée en fin de semaine w : l'année au régime, en espérance de ce qui reste inconnu. */
function positionEstimee(
  chemin: readonly number[],
  graine: number,
  w: number,
  s: Structure,
  monde: Omit<Monde, "scenario" | "recasse" | "historiques" | "ght">,
): Regime & { esperance: number } {
  const h = hasard(graine);
  const p = croyance(chemin, graine, w);
  const recasses =
    w >= RECASSE.semaine
      ? [[haldenRecasse(chemin, graine), 1] as const]
      : ([
          [true, chanceRecasse(chemin)],
          [false, 1 - chanceRecasse(chemin)],
        ] as const);
  const departs =
    w >= HISTORIQUES.semaine
      ? [[historiquesPartent(chemin, graine), 1] as const]
      : ([
          [true, chanceHistoriques(chemin)],
          [false, 1 - chanceHistoriques(chemin)],
        ] as const);
  const ghts =
    w >= GHT.semaine
      ? [[ghtSigne(chemin, graine), 1] as const]
      : ([
          [true, chanceGht(chemin)],
          [false, 1 - chanceGht(chemin)],
        ] as const);
  let esperance = 0;
  for (const c of CODES_SCENARIO) {
    if (p[c] === 0) continue;
    for (const [recasse, pr] of recasses) {
      for (const [historiques, ph] of departs) {
        for (const [ght, pg] of ghts) {
          const q = p[c] * pr * ph * pg;
          if (q === 0) continue;
          esperance +=
            q * regime(chemin, s, { ...monde, scenario: c, recasse, historiques, ght }).valeur;
        }
      }
    }
  }
  const scenario = w >= ANNONCE_BUDGET ? h.scenario : "moyen";
  const vu = regime(chemin, s, {
    ...monde,
    scenario,
    recasse: recasses[0]![0],
    historiques: departs.length === 1 ? departs[0]![0] : false,
    ght: ghts.length === 1 ? ghts[0]![0] : false,
  });
  return { ...vu, esperance };
}

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const [d1, d2, d3, d4] = chemin as readonly number[];
  const z = signal(chemin, graine);
  const bon = demandesEntrantes(z) > SEUIL_DEMANDES;
  // Avant la semaine 8, le cabinet suppose qu'il tiendra son cap ; ensuite, il sait.
  const s = structure(chemin, bon);
  const recasse = haldenRecasse(chemin, graine);
  const departs = historiquesPartent(chemin, graine);
  const signe = ghtSigne(chemin, graine);
  const keroual = d4 === 2 ? keroualPrend(graine) : 0;
  const manager = imprevu(h, "manager");
  const deplacesSept = DEPLACES[d1!]!;
  const position0 = POSITION.d1[d1!]! + POSITION.d2[d2!]!;
  const semaines: (Semaine | null)[] = [null];
  let resultat = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;

  for (let w = 1; w <= SEMAINES; w += 1) {
    const actifs = h.imprevus.filter((i) => w >= i.semaine && w < i.semaine + i.imprevu.duree);
    // Le généraliste : Halden prend des volumes à mesure que les missions se renouvellent.
    const ouvert = w >= OUVERTURE;
    const recasseVue = recasse && w >= RECASSE.semaine;
    const montee = ouvert ? Math.min(1, (w - OUVERTURE + 1) / MONTEE) : 0;
    const sens = w >= 6 ? h.sens : 1;
    let perte = perteGeneraliste(d1 === 0, recasseVue, sens) * montee;
    if (d1 === 0 && ouvert) perte = Math.min(perte, perteGeneraliste(true, recasseVue, sens));
    let demandeG = JOURS_G * (1 - perte) * (1 + h.bruit[w]!);
    if (departs && w > HISTORIQUES.semaine) {
      demandeG *=
        1 - HISTORIQUES.part * HISTORIQUES.perte * Math.min(1, (w - HISTORIQUES.semaine) / 8);
    }
    for (const a of actifs) demandeG *= 1 + (a.imprevu.effet.generaliste ?? 0);
    const permanent = manager && w >= manager.semaine ? manager.imprevu.effet.permanent! : 0;
    demandeG *= 1 + permanent;
    // Les consultants déplacés quittent leurs missions à mesure qu'elles se terminent.
    const deplaces = deplacesSept * Math.min(1, Math.max(0, (w - 2) / 6));
    const capG = (GENERALISTE.consultants - deplaces) * PAR_SEMAINE;
    const joursG = Math.min(demandeG, capG);
    let tjmG = GENERALISTE.tjm;
    if (d1 === 0 && ouvert) tjmG *= 1 - ALIGNEMENT * Math.min(1, (w - OUVERTURE + 1) / 8);
    if (d3 === 0 && w >= 5) tjmG *= 1 - HISTORIQUES.part * HISTORIQUES.remise;
    let libres = capG - joursG;
    let ca = joursG * tjmG;
    if (d4 === 0 && w >= 7) {
      const rempli = BRADAGE.part * libres;
      ca += rempli * GENERALISTE.tjm * (1 - BRADAGE.remise);
      libres -= rempli;
    }
    if (d4 === 2 && w >= 7) {
      const regie = Math.min(keroual * PAR_SEMAINE, libres);
      ca += regie * KEROUAL.tjm;
      libres -= regie;
    }
    // La santé : l'équipe actuelle, le pôle qui se forme, la demande que le positionnement attire.
    const pos = ouvert
      ? position0 + (d4 === 1 && w >= PRE_DIAGNOSTICS.de ? PRE_DIAGNOSTICS.position : 0)
      : 0;
    const montee2 = Math.min(1, Math.max(0, (w - 4) / 9));
    let demandeH = JOURS_H + pos * SCENARIOS[h.scenario].marche * PART_DANS_LE_TRIMESTRE * montee2;
    for (const a of actifs) demandeH += a.imprevu.effet.sante ?? 0;
    const capH =
      SANTE.consultants * PAR_SEMAINE +
      deplacesSept * Math.min(1, Math.max(0, (w - 2) / 6)) * PAR_SEMAINE * efficacite(d1!);
    const joursH = Math.min(demandeH, capH);
    ca += joursH * SANTE.tjm;
    // Ce que la semaine coûte en plus des salaires.
    let depense = 0;
    if (d2 === 0 && w >= 3 && w <= 5) depense += REPOSITIONNEMENT / 3;
    if (d2 === 1 && w >= 3 && w <= 7) depense += ETUDE / 5;
    if (d2 === 2 && w >= EXPERTE.arrivee) {
      depense += EXPERTE.salaire / SEMAINES_PAR_AN;
      ca += (EXPERTE.jours * EXPERTE.tjm) / SEMAINES_PAR_AN;
    }
    if (d3 === 1 && w >= 5) depense += HISTORIQUES.referent.trimestre / 9;
    if (d4 === 1 && w >= PRE_DIAGNOSTICS.de) {
      depense += PRE_DIAGNOSTICS.cout / (SEMAINES - PRE_DIAGNOSTICS.de + 1);
      libres *= 0.5;
    }
    if (w === 10) depense += s.recrues * RECRUE.honoraires;
    for (const a of actifs) if (a.semaine === w) depense += a.imprevu.effet.cout ?? 0;
    const ecart = ca - depense - PLAN;
    resultat += ecart;

    // La position : une année au régime, en espérance de ce que la semaine ne sait pas encore.
    const pe = positionEstimee(chemin, graine, w, s, { sens, permanent, keroual });
    semaines.push({
      valeur: resultat + pe.esperance,
      ca,
      ecart,
      joursG,
      joursH,
      tjmG,
      occupation:
        joursG / ((GENERALISTE.consultants - deplaces) * (JOURS_OUVRES / SEMAINES_PAR_AN)),
      intercontrat: libres / PAR_SEMAINE,
      position: pe.esperance,
      resultat,
    });
  }

  const fin = semaines[SEMAINES]!;
  const reg = regime(chemin, s, {
    scenario: h.scenario,
    recasse,
    historiques: departs,
    ght: signe,
    sens: h.sens,
    permanent: manager ? manager.imprevu.effet.permanent! : 0,
    keroual,
  });
  return {
    semaines,
    objectif: fin.valeur,
    resultat: fin.resultat,
    position: fin.position,
    scenario: h.scenario,
    recasse,
    historiques: departs,
    ght: signe,
    signal: z,
    testBon: bon,
    keroual: d4 === 2 ? keroual : null,
    structure: s,
    regime: reg,
  };
}

/* ---------------------------------------------------------------------------
 * CE QUE LES SOURCES CALCULENT POUR LE JOUEUR.
 * ------------------------------------------------------------------------- */

/** La fonction de répartition de la loi normale (approximation d'Abramowitz et Stegun). */
export function repartition(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? 1 - p : p;
}

/**
 * LA PART DES CAS OÙ LE TEST SE TROMPE, selon le premier pas : il dit « le
 * marché répond » quand le plan sera reconduit ou gelé, ou « il ne répond
 * pas » quand le plan sera renforcé.
 */
export function erreurDuTest(premierPas: number): number {
  const s = BRUIT_DU_TEST[premierPas]!;
  return CODES_SCENARIO.reduce((e, c) => {
    const p = repartition((SEUIL_TEST - SCENARIOS[c].indice) / s);
    return e + SCENARIOS[c].chance * (c === "porteur" ? p : 1 - p);
  }, 0);
}

/**
 * CE QUE VAUT L'ÉTAPE SUIVANTE, sur une année, dans un scénario donné : la
 * différence entre les deux branches de la révision — les six recrutements,
 * le pôle créé en janvier, ou le pôle de quarante gardé plutôt que réduit.
 */
export function valeurEtapeSuivante(
  chemin: readonly number[],
  graine: number,
  scenario: CodeScenario,
): number {
  const h = hasard(graine);
  const c = NEUTRE.map((n, i) => (i === D.cap ? 1 : (chemin[i] ?? n)));
  const monde: Monde = {
    scenario,
    recasse: haldenRecasse(c, graine),
    historiques: false,
    ght: false,
    sens: h.sens,
    permanent: 0,
    keroual: 0,
  };
  return regime(c, structure(c, true), monde).valeur - regime(c, structure(c, false), monde).valeur;
}

/** Ce qui s'est passé pendant des semaines : ouverture, riposte de Halden, test, départs, budget, GHT. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const t = simuler(chemin, graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    ouverture: dans(OUVERTURE),
    recasse: dans(RECASSE.semaine),
    historiques: dans(HISTORIQUES.semaine),
    budget: dans(ANNONCE_BUDGET),
    ght: dans(GHT.semaine),
    imprevus: hasard(graine).imprevus.filter((i) => dans(i.semaine)),
    t,
  };
}

export interface LecturePositionnement {
  valeur: number | null;
  occupation: number | null;
  tjmG: number | null;
  joursH: number | null;
  intercontrat: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  ca: number | null;
  demandes: number | null;
  porteur: number | null;
  chanceHistoriques: number | null;
  recasse: number | null;
  historiques: number | null;
  scenario: number | null;
  ght: number | null;
  etapePorteur: number | null;
  etapeMoyen: number | null;
  etapeGel: number | null;
  chanceGht1: number | null;
  chanceGht3: number | null;
}

/**
 * Ce que Victoire lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LecturePositionnement {
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const sansAssocie = chemin.map((c, i) => (i === D.historiques ? 2 : c));
  const communs = {
    chanceHistoriques: chanceHistoriques(sansAssocie),
    etapePorteur: valeurEtapeSuivante(chemin, graine, "porteur"),
    etapeMoyen: valeurEtapeSuivante(chemin, graine, "moyen"),
    etapeGel: valeurEtapeSuivante(chemin, graine, "gel"),
    chanceGht1: chanceGht(chemin.map((c, i) => (i === D.ght ? 1 : c))),
    chanceGht3: chanceGht(chemin.map((c, i) => (i === D.ght ? 3 : c))),
  };
  if (semaine === 0) {
    return {
      valeur: t.semaines[1]!.position,
      occupation: JOURS_G / (GENERALISTE.consultants * (JOURS_OUVRES / SEMAINES_PAR_AN)),
      tjmG: GENERALISTE.tjm,
      joursH: JOURS_H,
      intercontrat: GENERALISTE.consultants - JOURS_G / PAR_SEMAINE,
      ca: PLAN,
      demandes: null,
      porteur: SCENARIOS.porteur.chance,
      recasse: null,
      historiques: null,
      scenario: null,
      ght: null,
      ...communs,
    };
  }
  const s = t.semaines[semaine]!;
  return {
    valeur: s.valeur,
    occupation: s.occupation,
    tjmG: s.tjmG,
    joursH: s.joursH,
    intercontrat: s.intercontrat,
    ca: s.ca,
    demandes: semaine >= 8 ? demandesEntrantes(t.signal) : null,
    porteur: croyance(chemin, graine, semaine).porteur,
    recasse: semaine >= RECASSE.semaine ? (t.recasse ? 1 : 0) : null,
    historiques: semaine >= HISTORIQUES.semaine ? (t.historiques ? 1 : 0) : null,
    scenario: semaine >= ANNONCE_BUDGET ? SCENARIOS[t.scenario].indice : null,
    ght: semaine >= GHT.semaine ? (t.ght ? 1 : 0) : null,
    ...communs,
  };
}
