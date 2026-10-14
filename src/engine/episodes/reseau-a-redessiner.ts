/**
 * LE RÉSEAU D'AGENCES À REDESSINER — le modèle de la carte du réseau d'Arvel
 * Distribution dans l'Est lyonnais.
 *
 * Trente et une agences, un concurrent régional (Talvère) qui cherche un
 * terrain à Mions, une zone d'aménagement qui se vote mi-décembre, une agence
 * (Bron) dernière du classement de la direction financière, une agence
 * décidée en juin à Villeurbanne-Nord dont le point de retrait d'essai donne
 * ses premiers chiffres. Treize semaines, six décisions.
 *
 * COMMENT LA VALEUR EST ESTIMÉE. Une carte de réseau se joue sur des années ;
 * un épisode dure un trimestre. Le trimestre est jugé sur la VALEUR CRÉÉE
 * ESTIMÉE en semaine 13, par rapport au réseau tel qu'il est (sans agence à
 * Mions, Bron ouverte, le point de retrait de Villeurbanne-Nord arrêté à la
 * fin de son essai) :
 *
 *   · chaque position prise vaut CINQ ANS DE MARGE INCRÉMENTALE DU RÉSEAU,
 *     actualisés au taux du groupe (1 € de marge annuelle vaut 3,99 €) : la
 *     marge sur coûts variables du chiffre d'affaires vraiment NOUVEAU pour le
 *     réseau, moins les coûts fixes propres du site ; le chiffre repris à une
 *     agence voisine ne compte pas, les frais communs du siège ne bougent pas ;
 *   · moins les sommes engagées et perdues : travaux, indemnités de
 *     fermeture, dédit de bail, réservation de terrain, études, remises ;
 *   · plus ce que le trimestre lui-même a gagné ou perdu (imprévus, test,
 *     remises) ;
 *   · recalculée chaque semaine avec ce que le trimestre a révélé : le report
 *     mesuré des clients de Bron, la part de clients nouveaux du point de
 *     retrait, la décision de Talvère (semaine 10), le vote de la zone
 *     d'aménagement (semaine 12). Ce qui n'est pas encore révélé est compté
 *     en espérance.
 *
 * Ne rien faire a un coût : sans site à Mions, Talvère s'y installe sept fois
 * sur dix et prend une part du chiffre que le réseau y fait déjà.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · LA CANNIBALISATION. Une agence ouverte près des agences existantes leur
 *     prend d'abord leurs clients : une agence complète à Mions reprendrait
 *     les trois quarts du chiffre que Saint-Priest et Vénissieux font dans la
 *     zone, un comptoir la moitié. Son compte d'exploitation affiche 244 k€
 *     par an ; ce qu'elle ajoute au réseau, 28 k€. De même, le point de
 *     retrait de Villeurbanne-Nord dépasse son plan de 40 %, mais sept clients
 *     sur dix y achètent ce qu'ils achetaient déjà à Villeurbanne.
 *   · LE REPORT DE CLIENTÈLE ET LES COÛTS COMMUNS. Fermer Bron, « −60 k€ sur
 *     le papier », n'économise que ses coûts fixes propres : les frais de
 *     siège répartis restent au réseau. Une partie de ses clients suit à
 *     Saint-Priest, le reste part chez les concurrents ; la fermeture ne paie
 *     que si plus de 45 % du chiffre suit, et personne ne le sait d'avance.
 *     Un test de six semaines le mesure.
 *   · LA DEMANDE INCERTAINE ET LA RÉACTION DU CONCURRENT. La zone de Mions ne
 *     vaut une agence complète que si la zone d'aménagement est votée (une
 *     chance sur deux). Un comptoir léger tient la place — Talvère n'ouvre
 *     plus que trois fois sur dix face à un comptoir —, garde ses clients,
 *     et, avec un terrain réservé, devient l'agence de la zone si le vote est
 *     positif. Une baisse de prix ne dissuade personne : elle n'engage à rien.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Données fictives.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe, et celui qu'il retient si les taux d'emprunt montent. */
export const TAUX = 0.08;
export const TAUX_RELEVE = 0.09;
/** Le comité valorise une position du réseau sur cinq ans de marge : la durée du plan stratégique. */
export const ANNEES = 5;
/** La valeur actuelle d'une annuité de fin d'année. */
export const annuite = (n: number, taux: number) => (1 - (1 + taux) ** -n) / taux;
/** Ce que vaut 1 € de marge annuelle, sur cinq ans, au taux du groupe : 3,99 €. */
export const MULTIPLE = annuite(ANNEES, TAUX);
/** Le taux de marge sur coûts variables du réseau (marge commerciale, moins livraison et commissions). */
export const TAUX_MCV = 0.24;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : la note au comité se boucle avec un cabinet payé à la journée. */
export const PERTE_PAR_JOUR = 3000;
/** La valeur que le président attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 150000;
/** Le plafond d'investissements du plan de réseau pour l'an prochain, terrains compris. */
export const ENVELOPPE = 1500000;

/* ---------------------------------------------------------------------------
 * LA ZONE DE MIONS : où ouvrir, et sous quel format.
 * ------------------------------------------------------------------------- */

/** Le chiffre que le réseau fait aujourd'hui avec les clients de la zone : 0,8 M€ à Saint-Priest, 0,4 M€ à Vénissieux. */
export const ZONE = { ca: 1200000, saintPriest: 800000, venissieux: 400000 } as const;

export type Format = "agence" | "tournee" | "comptoir" | "aucun";

export interface DefinitionFormat {
  /** Le chiffre d'affaires du site, à maturité, aux hypothèses de l'étude de zone. */
  ca: number;
  /** La part du chiffre des agences voisines dans la zone que le site leur reprend. */
  reprise: number;
  /** Les coûts fixes propres du site, par an : loyer, personnel, véhicules, frais financiers du stock. */
  fixes: number;
  /** Travaux, aménagement, enseigne : dépensés à l'ouverture, non récupérables. */
  travaux: number;
  /** Le chiffre supplémentaire que le site capte si la zone d'aménagement est votée. */
  croissance: number;
}

export const FORMATS: Record<Format, DefinitionFormat> = {
  agence: { ca: 2600000, reprise: 0.75, fixes: 380000, travaux: 350000, croissance: 1000000 },
  comptoir: { ca: 1350000, reprise: 0.5, fixes: 140000, travaux: 80000, croissance: 350000 },
  /** Une tournée quotidienne depuis Saint-Priest : du chiffre nouveau, aucun site à Mions. */
  tournee: { ca: 400000, reprise: 0, fixes: 80000, travaux: 20000, croissance: 250000 },
  aucun: { ca: 0, reprise: 0, fixes: 0, travaux: 0, croissance: 100000 },
};

/** Le format retenu en semaine 1, par son option. */
export const FORMAT_DE: readonly Format[] = ["agence", "tournee", "comptoir", "aucun"];

/** Le chiffre vraiment nouveau pour le réseau : celui du site, moins ce qu'il reprend aux voisines. */
export const nouveau = (f: DefinitionFormat) => f.ca - f.reprise * ZONE.ca;

/**
 * La marge incrémentale annuelle d'un site, cannibalisation déduite, hors
 * zone d'aménagement et sans Talvère : ce que la prévision de la semaine 1
 * demande pour l'agence complète (28 k€), quand son compte d'exploitation en
 * affiche 244.
 */
export const margeIncrementale = (f: DefinitionFormat) => TAUX_MCV * nouveau(f) - f.fixes;
/** Le résultat que le compte d'exploitation du site affiche, comme si tout son chiffre était nouveau. */
export const resultatAffiche = (f: DefinitionFormat) => TAUX_MCV * f.ca - f.fixes;

/** LA ZONE D'AMÉNAGEMENT DES ORMEAUX : votée ou repoussée mi-décembre, une chance sur deux. */
export const PROJET = { chance: 0.5, semaine: 12 } as const;

/**
 * L'AGENCE DE LA ZONE, si elle est votée : celle qu'on bâtit sur le terrain
 * du boulevard, ou, sans terrain réservé, sur un site moins bien placé. Un
 * comptoir déjà ouvert lui apporte ses clients ; partir de rien la retarde.
 */
export const ZAC = {
  nouveau: 1700000,
  croissance: 1200000,
  croissanceAutreSite: 1000000,
  fixes: 380000,
  travaux: 350000,
  retard: { comptoir: 20000, tournee: 100000, aucun: 150000 },
} as const;

/** Le dernier terrain commercial du boulevard : 900 k€, ou une réservation d'un an à 35 k€. */
export const TERRAIN = {
  prix: 900000,
  reservation: 35000,
  /** S'il faut le revendre sans le vote : 20 % de moins ; avec le vote, les frais seulement. */
  decote: 0.2,
  frais: 0.03,
} as const;

/* ---------------------------------------------------------------------------
 * TALVÈRE : elle ouvre à Mions, ou non, selon la présence d'Arvel.
 * ------------------------------------------------------------------------- */

/**
 * La chance que Talvère ouvre à Mions, selon ce qu'Arvel y a : elle n'est
 * jamais entrée face à une agence, rarement face à un comptoir. Acheter le
 * terrain du boulevard lui retire le meilleur emplacement.
 */
export const CHANCE_TALVERE: Record<Format, number> = {
  agence: 0.15,
  comptoir: 0.3,
  tournee: 0.6,
  aucun: 0.7,
};
export const TALVERE = {
  semaine: 10,
  /** Là où elle s'installe face à un négoce en place, elle lui prend 12 % de son chiffre de la zone. */
  part: 0.12,
  terrainAchete: 0.1,
  annonce: 4,
} as const;

/** Les contrats annuels avec les 25 plus gros comptes de la zone Est : 2 % de remise de fin d'année. */
export const CONTRATS = { comptes: 25, ca: 3000000, remise: 0.025, protection: 0.5 } as const;
/** La baisse de prix sur la zone Est : 3 % pendant six mois, et des prix qui ne remontent pas tout à fait. */
export const PRIX = {
  baisse: 0.03,
  ca: 5000000,
  semaines: 26,
  residuel: 0.005,
  part: 0.11,
} as const;
export const coutContrats = CONTRATS.remise * CONTRATS.ca;
export const coutPrix = PRIX.baisse * PRIX.ca * (PRIX.semaines / 52) + PRIX.residuel * PRIX.ca;

/* ---------------------------------------------------------------------------
 * BRON : la dernière du classement.
 * ------------------------------------------------------------------------- */

export const BRON = {
  ca: 2000000,
  /** Loyer, sept personnes, véhicules et énergie : ce que la fermeture supprime. */
  fixes: 360000,
  /** Frais de siège et de plateforme répartis au prorata du chiffre : ils restent au réseau. */
  communs: 180000,
  /** Indemnités, remise en état du local, transfert du stock. */
  fermeture: 90000,
  /** Un vendeur et un chauffeur de plus à Saint-Priest pour servir les clients qui suivent. */
  renfort: 75000,
  partComptoir: 0.55,
} as const;

/** La part du chiffre de Bron qui suivrait à Saint-Priest : personne ne la connaît d'avance. */
export const REPORT = { moyenne: 0.45, ecart: 0.11, min: 0.2, max: 0.72 } as const;
/** Le test : six semaines de livraisons depuis Saint-Priest et de comptoir fermé l'après-midi. */
export const TEST = { cout: 25000, seuil: 0.5, resultat: 8 } as const;
/** Quatre fois sur dix, un concurrent reprend le local de Bron laissé vide, et garde une partie de ses clients. */
export const LOCAL_REPRIS = { chance: 0.4, perte: 0.08, semaine: 10 } as const;
/** La semaine où le report des clients de Bron se mesure, après l'annonce de la fermeture. */
export const REPORT_MESURE = 9;

/** Le résultat que la direction financière affiche pour Bron : −60 k€. */
export const RESULTAT_BRON = TAUX_MCV * BRON.ca - BRON.fixes - BRON.communs;
/** Ce que Bron apporte au réseau : sa marge sur coûts spécifiques, 120 k€. */
export const CONTRIBUTION_BRON = TAUX_MCV * BRON.ca - BRON.fixes;
/** Ce que la fermeture change à la marge annuelle du réseau, selon la part qui suit. */
export const margeFermeture = (report: number) =>
  -TAUX_MCV * BRON.ca * (1 - report) + BRON.fixes - BRON.renfort;
/** La part du chiffre qui doit suivre pour que la fermeture ne coûte rien à la marge annuelle. */
export const REPORT_D_EQUILIBRE = 1 - (BRON.fixes - BRON.renfort) / (TAUX_MCV * BRON.ca);
export const valeurFermeture = (report: number, multiple = MULTIPLE) =>
  multiple * margeFermeture(report) - BRON.fermeture;

/* ---------------------------------------------------------------------------
 * VILLEURBANNE-NORD : l'agence décidée en juin, et son point de retrait d'essai.
 * ------------------------------------------------------------------------- */

export const VN = {
  /** Le point de retrait ouvert en septembre : 750 k€ de chiffre par an au rythme constaté. */
  pr: { ca: 750000, fixes: 40000 },
  /** L'agence du plan de juin : 2 M€ de chiffre, tout compté comme nouveau. */
  agence: { ca: 2000000, fixes: 230000, travaux: 100000 },
  /** Une agence complète attire des clients que le point de retrait ne voit pas : 20 points de plus. */
  bonusAgence: 0.2,
  /** Trois mois de loyer pour sortir du bail signé sous condition suspensive. */
  dedit: 27000,
  /** Le plan prévoyait 10 k€ de chiffre par semaine au point de retrait. */
  planHebdo: 10000,
  partNouvelle: { moyenne: 0.3, ecart: 0.03, min: 0.24, max: 0.36 },
  resultats: 6,
} as const;

/** Le résultat annuel que le plan de juin attendait de l'agence : 250 k€. */
export const RESULTAT_PLAN_VN = TAUX_MCV * VN.agence.ca - VN.agence.fixes;
export const margeAgenceVN = (part: number) =>
  TAUX_MCV * VN.agence.ca * Math.min(1, part + VN.bonusAgence) - VN.agence.fixes;
export const margePointDeRetrait = (part: number) => TAUX_MCV * VN.pr.ca * part - VN.pr.fixes;

/* ---------------------------------------------------------------------------
 * LES PRIMES DES DIRECTEURS D'AGENCE : chacun son compte, ou le bassin.
 * ------------------------------------------------------------------------- */

/**
 * Ce que coûte, sur l'année, le chiffre DISPUTÉ entre deux sites Arvel (celui
 * qu'un nouveau site reprend à un ancien), selon la règle des primes : chacun
 * jugé sur son agence, les remises entre sites Arvel ; le chiffre transféré
 * compté deux fois ; une part de la prime sur la marge du bassin.
 */
export const PRIMES = { chacun: 0.045, neutraliser: 0.018, bassin: 0.006 } as const;
export const TAUX_PRIMES = [PRIMES.bassin, PRIMES.neutraliser, PRIMES.chacun] as const;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  mions: 0,
  bron: 1,
  talvere: 2,
  villeurbanne: 3,
  terrain: 4,
  primes: 5,
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, 9, 11] as const;

/**
 * Ne rien changer, décision par décision : attendre le vote pour Mions, garder
 * Bron, ne pas réagir à Talvère, laisser le plan de juin suivre son cours,
 * ne rien réserver, garder les primes telles qu'elles sont.
 */
export const NEUTRE = [3, 0, 1, 0, 2, 2] as const;

/** Les options, par décision, nommées pour le modèle. */
export const BRON_OPTIONS = { garder: 0, fermer: 1, tester: 2 } as const;
export const TALVERE_OPTIONS = { contrats: 0, rien: 1, prix: 2 } as const;
export const VN_OPTIONS = { lancer: 0, garderPR: 1, renoncer: 2 } as const;
export const TERRAIN_OPTIONS = { reserver: 0, acheter: 1, rien: 2 } as const;

/* ---------------------------------------------------------------------------
 * LES IMPRÉVUS : ils frappent le trimestre quelles que soient les décisions.
 * ------------------------------------------------------------------------- */
export interface Imprevu {
  id: string;
  titre: string;
  de: string;
  role: string;
  texte: string;
  /** Ce que l'imprévu ajoute au résultat du trimestre, en euros. */
  effet: number;
  /** Le taux d'actualisation qu'il impose, s'il en change. */
  taux?: number;
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "taux",
    titre: "Le groupe relève son taux d'actualisation",
    de: "Solveig Arnaudon",
    role: "Directrice administrative et financière",
    texte:
      "Notre banque a relevé le coût de nos lignes de crédit : le comité valorisera désormais les projets à 9 % au lieu de 8 %, y compris ceux du plan de réseau.",
    effet: 0,
    taux: TAUX_RELEVE,
  },
  {
    id: "fermeture",
    titre: "Un négoce indépendant ferme à Saint-Fons",
    de: "Amaury Dutertre",
    role: "Directeur de l'agence de Vénissieux",
    texte:
      "Le négoce familial de Saint-Fons ferme : le fils ne reprend pas. Une partie de ses artisans arrive au comptoir. On aura une vingtaine de milliers d'euros de marge en plus ce trimestre.",
    effet: 20000,
  },
  {
    id: "impaye",
    titre: "Un client en redressement judiciaire",
    de: "Tobias Sauvat",
    role: "Responsable du crédit clients",
    texte:
      "Une entreprise de maçonnerie de Saint-Priest est placée en redressement judiciaire. Notre créance de 22 k€ ne sera pas payée : l'assurance-crédit l'avait exclue l'an dernier.",
    effet: -22000,
  },
  {
    id: "ciment",
    titre: "Le cimentier augmente ses tarifs",
    de: "Service achats",
    role: "Siège",
    texte:
      "Notre cimentier passe une hausse de 4 % au 1er novembre. Nous ne pourrons la répercuter qu'avec trois semaines de retard : environ 15 k€ de marge perdue sur le trimestre.",
    effet: -15000,
  },
  {
    id: "degat",
    titre: "Un dégât des eaux au dépôt de Vénissieux",
    de: "Amaury Dutertre",
    role: "Directeur de l'agence de Vénissieux",
    texte:
      "Une canalisation a cédé cette nuit dans le dépôt : plaques de plâtre et sacs d'enduit sont perdus. 12 k€ après la franchise, le temps que l'assurance se prononce.",
    effet: -12000,
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  /** L'écart du chiffre d'affaires de chaque semaine autour de sa tendance (indices 1 à 13). */
  bruit: readonly number[];
  /** La zone d'aménagement des Ormeaux est-elle votée en semaine 12 ? */
  projet: boolean;
  /** Talvère ouvre à Mions si ce tirage est sous sa chance d'y ouvrir. */
  uTalvere: number;
  /** La part du chiffre de Bron qui suivrait à Saint-Priest. */
  report: number;
  /** Un concurrent reprend-il le local de Bron, s'il ferme ? */
  uLocal: number;
  /** La part de clients nouveaux au point de retrait de Villeurbanne-Nord. */
  partNouvelle: number;
  /** La part des 25 gros comptes qui signeraient un contrat annuel. */
  signes: number;
  /** Le bailleur de Villeurbanne-Nord exige-t-il le dédit entier ? */
  uDedit: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000397 + 7);
  // L'ordre des tirages est fixé une fois pour toutes : le changer changerait tous les trimestres.
  const uDedit = r();
  const uLocal = r();
  const signes = Math.round(CONTRATS.comptes * (0.6 + 0.4 * r())) / CONTRATS.comptes;
  const uTalvere = r();
  const report = borne(REPORT.moyenne + REPORT.ecart * gauss(r), REPORT.min, REPORT.max);
  const projet = r() < PROJET.chance;
  const p = VN.partNouvelle;
  const partNouvelle = borne(p.moyenne + p.ecart * gauss(r), p.min, p.max);
  const bruit: number[] = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruit.push(borne(0.03 * gauss(r), -0.08, 0.08));
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
    projet,
    uTalvere,
    report,
    uLocal,
    partNouvelle,
    signes,
    uDedit,
    imprevus,
  };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

const formatDe = (chemin: readonly number[]): Format => FORMAT_DE[chemin[D.mions]!]!;

/** La chance que Talvère ouvre à Mions, selon les choix d'Arvel. */
export const chanceTalvere = (chemin: readonly number[]) =>
  Math.max(
    0,
    CHANCE_TALVERE[formatDe(chemin)] -
      (chemin[D.terrain] === TERRAIN_OPTIONS.acheter ? TALVERE.terrainAchete : 0),
  );

/** Talvère ouvre-t-elle à Mions ? Le tirage est le même quelles que soient les décisions. */
export const talvereOuvre = (chemin: readonly number[], graine: number) =>
  hasard(graine).uTalvere < chanceTalvere(chemin);

/** Bron ferme-t-elle : d'emblée, ou au vu du test ? */
export const bronFerme = (chemin: readonly number[], graine: number) =>
  chemin[D.bron] === BRON_OPTIONS.fermer ||
  (chemin[D.bron] === BRON_OPTIONS.tester && hasard(graine).report >= TEST.seuil);

/** Quatre fois sur dix, un concurrent reprend le local de Bron laissé vide. */
export const localRepris = (chemin: readonly number[], graine: number) =>
  bronFerme(chemin, graine) && hasard(graine).uLocal < LOCAL_REPRIS.chance;

/** Le report effectif : la part qui suit, moins ce que le repreneur du local garde. */
export const reportEffectif = (chemin: readonly number[], graine: number) =>
  hasard(graine).report - (localRepris(chemin, graine) ? LOCAL_REPRIS.perte : 0);

/** Le dédit que le bailleur de Villeurbanne-Nord exige : entier, ou la moitié. */
export const dedit = (graine: number) => (hasard(graine).uDedit < 0.5 ? VN.dedit : VN.dedit / 2);

/** Combien des 25 gros comptes signent le contrat annuel. */
export const comptesSignes = (graine: number) =>
  Math.round(hasard(graine).signes * CONTRATS.comptes);

/* ---------------------------------------------------------------------------
 * LA VALEUR DES POSITIONS.
 * ------------------------------------------------------------------------- */

/** La part que Talvère prendrait au chiffre de la zone, selon la réponse d'Arvel à son annonce. */
export function partTalvere(d3: number, signes: number): number {
  if (d3 === TALVERE_OPTIONS.contrats) return TALVERE.part * (1 - CONTRATS.protection * signes);
  if (d3 === TALVERE_OPTIONS.prix) return PRIX.part;
  return TALVERE.part;
}

export interface ValeurMions {
  valeur: number;
  /** La marge incrémentale annuelle de la zone. */
  marge: number;
  engage: number;
  /** Le format en fin de trimestre : celui de la semaine 1, ou l'agence de la zone. */
  final: Format | "zac";
  /** Le chiffre que le site reprend aux agences voisines. */
  repris: number;
}

/**
 * La valeur de ce qu'Arvel a pris à Mions, dans un état du monde : la zone
 * votée ou non, Talvère installée ou non. Si la zone est votée, Arvel bâtit
 * l'agence de la zone quand elle vaut plus que le format en place.
 */
export function valeurMions(
  f1: Format,
  d3: number,
  d5: number,
  signes: number,
  etat: { projet: boolean; talvere: boolean },
  multiple = MULTIPLE,
): ValeurMions {
  const f = FORMATS[f1];
  const part = etat.talvere ? partTalvere(d3, signes) : 0;
  const marge = (n: number, c: number, fixes: number) =>
    TAUX_MCV * (n + c - part * (ZONE.ca + n + c)) - fixes;
  const mGarde = marge(nouveau(f), etat.projet ? f.croissance : 0, f.fixes);
  let valeur = multiple * mGarde;
  let m = mGarde;
  let final: Format | "zac" = f1;
  let engage = f.travaux;
  if (etat.projet && f1 !== "agence") {
    const croissance = d5 === TERRAIN_OPTIONS.rien ? ZAC.croissanceAutreSite : ZAC.croissance;
    const mZac = marge(ZAC.nouveau, croissance, ZAC.fixes);
    const vZac = multiple * mZac - ZAC.travaux - ZAC.retard[f1];
    if (vZac > valeur) {
      valeur = vZac;
      m = mZac;
      final = "zac";
      engage += ZAC.travaux;
    }
  }
  const utilise = final === "zac" && d5 !== TERRAIN_OPTIONS.rien;
  if (d5 === TERRAIN_OPTIONS.reserver) {
    if (!utilise) valeur -= TERRAIN.reservation;
    engage += TERRAIN.reservation;
  } else if (d5 === TERRAIN_OPTIONS.acheter) {
    if (!utilise) valeur -= TERRAIN.prix * (etat.projet ? TERRAIN.frais : TERRAIN.decote);
    engage += TERRAIN.prix;
  }
  valeur -= f.travaux;
  const repris = final === "zac" ? FORMATS.agence.reprise * ZONE.ca : f.reprise * ZONE.ca;
  return { valeur, marge: m, engage, final, repris };
}

/** Une loi normale bornée, discrétisée une fois pour toutes : de quoi compter en espérance. */
const GRILLE = Array.from({ length: 81 }, (_, i) => {
  const z = -4 + i * 0.1;
  return { z, poids: Math.exp((-z * z) / 2) };
});
const POIDS = GRILLE.reduce((s, g) => s + g.poids, 0);
const esperanceReport = (f: (report: number) => number) =>
  GRILLE.reduce(
    (s, g) => s + g.poids * f(borne(REPORT.moyenne + REPORT.ecart * g.z, REPORT.min, REPORT.max)),
    0,
  ) / POIDS;

/** La valeur de la fermeture, avant de savoir si un concurrent reprendra le local. */
const fermetureSansLocal = (report: number, multiple: number) =>
  LOCAL_REPRIS.chance * valeurFermeture(report - LOCAL_REPRIS.perte, multiple) +
  (1 - LOCAL_REPRIS.chance) * valeurFermeture(report, multiple);
const margeSansLocal = (report: number) =>
  LOCAL_REPRIS.chance * margeFermeture(report - LOCAL_REPRIS.perte) +
  (1 - LOCAL_REPRIS.chance) * margeFermeture(report);

/** Ce que vaut chaque option pour Bron avant toute mesure : ce que la source du test chiffre. */
export function bronEnEsperance(multiple = MULTIPLE) {
  return {
    fermer: esperanceReport((r) => fermetureSansLocal(r, multiple)),
    tester: esperanceReport(
      (r) => -TEST.cout + (r >= TEST.seuil ? fermetureSansLocal(r, multiple) : 0),
    ),
    chanceDeFermer: esperanceReport((r) => (r >= TEST.seuil ? 1 : 0)),
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** La marge incrémentale annuelle du réseau, positions prises. */
  marge: number;
  /** Les sommes engagées : travaux, terrain, indemnités, études, remises. */
  engage: number;
  /** Le chiffre d'affaires de la semaine des agences de l'Est lyonnais, en euros. */
  ca: number;
  /** La chance estimée que Talvère ouvre à Mions, ou ce qu'elle a fait. */
  risque: number;
};

export interface Estimation {
  valeur: number;
  marge: number;
  engage: number;
  mions: number;
  bron: number;
  villeurbanne: number;
  talvere: number;
  primes: number;
  trimestre: number;
  risque: number;
}

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);

/** Le chiffre disputé entre sites Arvel, que la règle des primes fait coûter plus ou moins. */
export function chiffreDispute(chemin: readonly number[], graine: number): number {
  const f = FORMATS[formatDe(chemin)];
  const s = hasard(graine).partNouvelle;
  const vn =
    chemin[D.villeurbanne] === VN_OPTIONS.lancer
      ? VN.agence.ca * (1 - Math.min(1, s + VN.bonusAgence))
      : chemin[D.villeurbanne] === VN_OPTIONS.garderPR
        ? VN.pr.ca * (1 - s)
        : 0;
  return f.reprise * ZONE.ca + vn;
}

/** Ce que l'on sait en fin de semaine w ; ce qui n'est pas révélé est compté en espérance. */
function estimer(chemin: readonly number[], graine: number, w: number, jours: number): Estimation {
  const h = hasard(graine);
  const dit = (k: number) => w >= EFFET[k]!;
  const tombe = (id: string) => {
    const i = imprevu(h, id);
    return i !== undefined && i.semaine <= w;
  };
  const multiple = tombe("taux") ? annuite(ANNEES, TAUX_RELEVE) : MULTIPLE;

  let trimestre = -Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  for (const { imprevu: i, semaine } of h.imprevus) if (semaine <= w) trimestre += i.effet;

  let valeur = 0;
  let marge = 0;
  let engage = 0;

  // Mions : le format de la semaine 1, la réponse à Talvère, le terrain de la zone.
  const d3 = dit(D.talvere) ? chemin[D.talvere]! : TALVERE_OPTIONS.rien;
  const d5 = dit(D.terrain) ? chemin[D.terrain]! : TERRAIN_OPTIONS.rien;
  const effectif = [...chemin];
  effectif[D.terrain] = d5;
  const pT = chanceTalvere(effectif);
  let risque = dit(D.mions) ? pT : CHANCE_TALVERE.aucun;
  let vMions = 0;
  if (dit(D.mions)) {
    const f1 = formatDe(chemin);
    const projets = w >= PROJET.semaine ? [h.projet] : [true, false];
    const talveres = w >= TALVERE.semaine ? [h.uTalvere < pT] : pT > 0 ? [true, false] : [false];
    for (const projet of projets) {
      for (const talvere of talveres) {
        const poidsP = projets.length === 1 ? 1 : projet ? PROJET.chance : 1 - PROJET.chance;
        const poidsT = talveres.length === 1 ? 1 : talvere ? pT : 1 - pT;
        const v = valeurMions(f1, d3, d5, h.signes, { projet, talvere }, multiple);
        vMions += poidsP * poidsT * v.valeur;
        marge += poidsP * poidsT * v.marge;
        if (projets.length === 1 && talveres.length === 1) engage += v.engage;
      }
    }
    if (projets.length > 1 || talveres.length > 1) {
      engage += valeurMions(f1, d3, d5, h.signes, { projet: false, talvere: false }).engage;
    }
  }
  if (w >= TALVERE.semaine) risque = h.uTalvere < pT ? 1 : 0;

  // La réponse à l'annonce de Talvère : ce qu'elle coûte.
  let vTalvere = 0;
  if (dit(D.talvere)) {
    if (d3 === TALVERE_OPTIONS.contrats) vTalvere = -coutContrats;
    if (d3 === TALVERE_OPTIONS.prix) vTalvere = -coutPrix;
    engage -= vTalvere;
  }

  // Bron : garder, fermer, ou mesurer le report d'abord.
  let vBron = 0;
  if (dit(D.bron)) {
    const d2 = chemin[D.bron];
    const ferme = bronFerme(chemin, graine);
    const localConnu = w >= LOCAL_REPRIS.semaine;
    if (d2 === BRON_OPTIONS.fermer) {
      engage += BRON.fermeture;
      if (w < REPORT_MESURE) {
        vBron = bronEnEsperance(multiple).fermer;
        marge += esperanceReport(margeSansLocal);
      } else if (!localConnu) {
        vBron = fermetureSansLocal(h.report, multiple);
        marge += margeSansLocal(h.report);
      } else {
        vBron = valeurFermeture(reportEffectif(chemin, graine), multiple);
        marge += margeFermeture(reportEffectif(chemin, graine));
      }
    } else if (d2 === BRON_OPTIONS.tester) {
      engage += TEST.cout;
      if (w < TEST.resultat) {
        vBron = bronEnEsperance(multiple).tester;
        marge += esperanceReport((r) => (r >= TEST.seuil ? margeSansLocal(r) : 0));
      } else if (!ferme) {
        vBron = -TEST.cout;
      } else {
        engage += BRON.fermeture;
        if (!localConnu) {
          vBron = -TEST.cout + fermetureSansLocal(h.report, multiple);
          marge += margeSansLocal(h.report);
        } else {
          vBron = -TEST.cout + valeurFermeture(reportEffectif(chemin, graine), multiple);
          marge += margeFermeture(reportEffectif(chemin, graine));
        }
      }
    }
  }

  // Villeurbanne-Nord : lancer l'agence, garder le point de retrait, ou tout arrêter.
  let vVN = 0;
  if (dit(D.villeurbanne)) {
    const d4 = chemin[D.villeurbanne];
    const s = h.partNouvelle;
    if (d4 === VN_OPTIONS.lancer) {
      vVN = multiple * margeAgenceVN(s) - VN.agence.travaux;
      marge += margeAgenceVN(s);
      engage += VN.agence.travaux;
    } else {
      const sortie = dedit(graine);
      vVN = -sortie;
      engage += sortie;
      if (d4 === VN_OPTIONS.garderPR) {
        vVN += multiple * margePointDeRetrait(s);
        marge += margePointDeRetrait(s);
      }
    }
  }

  // Les primes de l'an prochain : ce que coûte le chiffre disputé entre sites Arvel.
  let vPrimes = 0;
  if (dit(D.primes)) {
    vPrimes = -TAUX_PRIMES[chemin[D.primes]!]! * chiffreDispute(chemin, graine);
    marge += vPrimes;
  }

  valeur = trimestre + vMions + vTalvere + vBron + vVN + vPrimes;
  return {
    valeur,
    marge,
    engage,
    mions: vMions,
    bron: vBron,
    villeurbanne: vVN,
    talvere: vTalvere,
    primes: vPrimes,
    trimestre,
    risque,
  };
}

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  format: Format;
  /** Le format à Mions en fin de trimestre : l'agence de la zone, si elle a été lancée. */
  final: Format | "zac";
  projet: boolean;
  talvere: boolean;
  /** La chance que Talvère avait d'ouvrir, vu les choix d'Arvel. */
  chanceTalvere: number;
  bronFerme: boolean;
  /** La part du chiffre de Bron qui a suivi (ou aurait suivi) à Saint-Priest. */
  report: number;
  localRepris: boolean;
  partNouvelle: number;
  dedit: number;
  signes: number;
  marge: number;
  engage: number;
  mions: number;
  bron: number;
  villeurbanne: number;
  talvereReponse: number;
  primes: number;
  dispute: number;
  taux: number;
}

/** Le chiffre d'affaires annuel des agences de l'Est lyonnais : Saint-Priest, Vénissieux, Bron, et le point de retrait. */
export const CA_SECTEUR = 6000000 + 8000000 + BRON.ca + VN.pr.ca;

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const semaines: (Semaine | null)[] = [null];
  const f1 = formatDe(chemin);
  let avant = 0;
  let fin: Estimation | null = null;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const e = estimer(chemin, graine, w, jours);
    let ca = CA_SECTEUR / 52;
    if (w >= 7 && f1 === "comptoir") ca += nouveau(FORMATS.comptoir) / 52;
    if (w >= 4 && f1 === "tournee") ca += nouveau(FORMATS.tournee) / 52;
    if (w >= 3 && w <= TEST.resultat && chemin[D.bron] === BRON_OPTIONS.tester) {
      ca -= (0.05 * BRON.ca) / 52;
    }
    if (w >= 5 && chemin[D.talvere] === TALVERE_OPTIONS.prix) ca -= (PRIX.baisse * PRIX.ca) / 52;
    const ferme = imprevu(h, "fermeture");
    if (ferme && w >= ferme.semaine) ca += 120000 / 52;
    semaines.push({
      valeur: e.valeur,
      variation: e.valeur - avant,
      marge: e.marge,
      engage: e.engage,
      ca: ca * (1 + h.bruit[w]!),
      risque: e.risque,
    });
    avant = e.valeur;
    fin = e;
  }
  const t = imprevu(h, "taux");
  return {
    semaines,
    objectif: fin!.valeur,
    format: f1,
    final: valeurMions(f1, chemin[D.talvere]!, chemin[D.terrain]!, h.signes, {
      projet: h.projet,
      talvere: talvereOuvre(chemin, graine),
    }).final,
    projet: h.projet,
    talvere: talvereOuvre(chemin, graine),
    chanceTalvere: chanceTalvere(chemin),
    bronFerme: bronFerme(chemin, graine),
    report: h.report,
    localRepris: localRepris(chemin, graine),
    partNouvelle: h.partNouvelle,
    dedit: chemin[D.villeurbanne] === VN_OPTIONS.lancer ? 0 : dedit(graine),
    signes: comptesSignes(graine),
    marge: fin!.marge,
    engage: fin!.engage,
    mions: fin!.mions,
    bron: fin!.bron,
    villeurbanne: fin!.villeurbanne,
    talvereReponse: fin!.talvere,
    primes: fin!.primes,
    dispute: chiffreDispute(chemin, graine),
    taux: t && t.semaine <= SEMAINES ? TAUX_RELEVE : TAUX,
  };
}

/** Ce qui s'est passé pendant des semaines : mesures, annonces, votes, imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  const d2 = chemin[D.bron];
  return {
    annonceTalvere: dans(TALVERE.annonce),
    resultatsVN: dans(VN.resultats),
    test: d2 === BRON_OPTIONS.tester && dans(TEST.resultat),
    report: d2 === BRON_OPTIONS.fermer && dans(REPORT_MESURE),
    local: bronFerme(chemin, graine) && dans(LOCAL_REPRIS.semaine),
    talvere: dans(TALVERE.semaine),
    projet: dans(PROJET.semaine),
    comptoir: chemin[D.mions] === 2 && dans(7),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureReseau {
  valeur: number | null;
  marge: number | null;
  engage: number | null;
  ca: number | null;
  risque: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  partNouvelle: number | null;
  hebdoPR: number | null;
  report: number | null;
  talvere: number | null;
  projet: number | null;
  dispute: number | null;
  taux: number | null;
}

/**
 * Ce que Mathurin lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  semaine: number,
): LectureReseau {
  const h = hasard(graine);
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const hebdoPR = (VN.pr.ca / 52) * (1 + h.bruit[Math.max(1, semaine)]! / 2);
  if (semaine === 0) {
    return {
      valeur: 0,
      marge: 0,
      engage: 0,
      ca: CA_SECTEUR / 52,
      risque: CHANCE_TALVERE.aucun,
      partNouvelle: h.partNouvelle,
      hebdoPR,
      report: null,
      talvere: null,
      projet: null,
      dispute: chiffreDispute(chemin, graine),
      taux: TAUX,
    };
  }
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[semaine]!;
  const tx = imprevu(h, "taux");
  return {
    valeur: s.valeur,
    marge: s.marge,
    engage: s.engage,
    ca: s.ca,
    risque: s.risque,
    partNouvelle: h.partNouvelle,
    hebdoPR,
    report: semaine >= TEST.resultat ? h.report : null,
    talvere: semaine >= TALVERE.semaine ? (t.talvere ? 1 : 0) : null,
    projet: semaine >= PROJET.semaine ? (h.projet ? 1 : 0) : null,
    dispute: chiffreDispute(chemin, graine),
    taux: tx && tx.semaine <= semaine ? TAUX_RELEVE : TAUX,
  };
}
