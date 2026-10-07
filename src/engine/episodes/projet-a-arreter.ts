/**
 * LE PROJET QU'ON N'OSE PAS ARRÊTER — le modèle d'Arvel Maison.
 *
 * Trois showrooms pour particuliers — Écully, Saint-Priest, Rillieux —
 * ouverts il y a dix-huit mois par le prédécesseur de la directrice générale
 * adjointe, 2,4 M€ de travaux, d'agencement et de lancement déjà dépensés, un
 * président qui a annoncé le projet à la presse, des visites qui montent et
 * des ventes qui ne suivent pas. Treize semaines, six décisions.
 *
 * Une stratégie se juge sur des années ; un épisode dure un trimestre. Le
 * trimestre est donc jugé sur la VALEUR CRÉÉE ESTIMÉE en semaine 13 :
 *
 *   · le résultat d'exploitation des trois showrooms pendant le trimestre,
 *     décisions comprises (campagnes, études, travaux, cessions) ;
 *   · PLUS la valeur des flux futurs de ce que chaque site est devenu à la
 *     fin du trimestre (showroom pour particuliers, showroom des artisans,
 *     site fermé ou cédé), actualisée au taux du groupe sur trois ans — la
 *     durée pour laquelle chaque bail repart si l'on ne donne pas congé avant
 *     la fin du trimestre —, recalculée avec ce que le trimestre a révélé : le
 *     potentiel réel du marché des particuliers, l'offre du concurrent, la
 *     décision du président ;
 *   · les 2,4 M€ déjà dépensés n'y entrent jamais : ils sont perdus dans
 *     tous les cas.
 *
 * Laisser tout tourner a donc une valeur, et elle est négative : trois ans de
 * pertes d'exploitation, baux compris.
 *
 * Trois mécanismes font l'épisode, et le joueur doit les découvrir :
 *
 *   · CE QUI EST DÉPENSÉ EST DÉPENSÉ ; SEUL COMPTE CE QUI VIENT. Le compte
 *     analytique du projet affiche une perte qui mêle l'amortissement des
 *     travaux déjà payés et une quote-part des frais du siège qui resterait
 *     de toute façon ; la perte que les showrooms font vraiment perdre est
 *     bien plus petite. Ni « on y a mis 2,4 M€ » ni « le compte perd 400 k€
 *     par an » ne disent quoi faire : chaque site se juge sur ses flux à
 *     venir, option par option. Rillieux ne couvrira ses charges dans aucun
 *     scénario ; Saint-Priest vaut plus en showroom des artisans, où les
 *     clients viennent choisir avec leur artisan ; Écully est un vrai pari.
 *   · LES INDICATEURS AVANCÉS FLATTENT, LE CRITÈRE TRANCHE. Les visites et
 *     les devis montent dans tous les scénarios, salon compris ; seuls le
 *     taux de transformation, les ventes et l'origine des clients disent si
 *     les particuliers achètent. Une analyse client par client coûte peu et
 *     change deux décisions : elle donne la liste des artisans qui amènent
 *     leurs clients (la transformation rapporte plus) et un critère d'arrêt
 *     lisible sur les ventes (celui écrit sur les visites ne se déclenche
 *     jamais). Fixer le critère avant de connaître les chiffres, c'est ce qui
 *     permet de réviser le pari sans se raconter d'histoire.
 *   · ARRÊTER TROP TÔT DÉTRUIT UNE OPTION ; LA FAÇON DE LE PRÉSENTER DÉCIDE
 *     DU PRÉSIDENT. Fermer Saint-Priest perd ce que les artisans y apportent ;
 *     transformer Écully tout de suite renonce à sa chance de décoller, le
 *     reconduire sans condition en garde tout le risque : l'essai sous un
 *     critère écrit garde l'option (le meilleur pari), la transformation
 *     immédiate protège mieux des mauvais tirages. Un concurrent qui veut
 *     Rillieux paiera le droit au bail, d'autant plus que le marché est bon,
 *     mais il peut renoncer tard. Et le président, qui a porté le projet,
 *     accepte un recentrage présenté sur des critères qu'il a signés ; il le
 *     gèle plus souvent quand on le présente comme l'erreur de quelqu'un, et
 *     toujours quand on ne lui présente rien. Un gel fait manquer l'échéance
 *     des baux : six mois de pertes de plus, et le repreneur s'en va.
 *
 * Pur et déterministe : une même graine donne les mêmes tirages, quelles que
 * soient les décisions. Entreprise, personnes et chiffres sont fictifs.
 */
import { gauss, mulberry32 } from "./commun";

export const SEMAINES = 13;
/** Le taux d'actualisation du groupe. */
export const TAUX = 0.08;
/** Les années de flux futurs comptées : sans congé avant la fin du trimestre, les baux repartent pour trois ans. */
export const HORIZON = 3;
/** Le taux de marge sur coût variable des ventes aux particuliers, et celui des ventes facturées aux artisans. */
export const MARGE = 0.36;
export const MARGE_PRO = 0.24;
/** Les travaux, l'agencement et le lancement déjà payés : perdus quelle que soit la décision. */
export const DEJA_DEPENSE = 2400000;
/** Leur amortissement sur dix ans, dans le compte analytique du projet. */
export const AMORTISSEMENT = 240000;
/** La quote-part des frais du siège imputée au projet : elle resterait aux agences si les showrooms fermaient. */
export const QUOTE_PART_SIEGE = 66000;
/** La semaine de l'échéance triennale des trois baux ; le congé se donne six mois avant, donc dans le trimestre. */
export const ECHEANCE = 39;
/** La valeur que la direction attend des décisions du trimestre : ne plus en détruire. */
export const OBJECTIF_VALEUR = 0;
export const JOURS_SANS_PERTE = 2;
/** Chaque jour d'enquête au-delà de deux : l'équipe du projet signe la suite de la campagne d'automne. */
export const PERTE_PAR_JOUR = 2000;

export type IdSite = "ecully" | "saintPriest" | "rillieux";

export interface Site {
  id: IdSite;
  nom: string;
  /** Les ventes annuelles aux particuliers, au rythme d'aujourd'hui. */
  ventes: number;
  loyer: number;
  personnel: number;
  autres: number;
  /** Ce que les ventes aux particuliers prennent par an, pendant deux ans, selon le scénario. */
  croissance: readonly [number, number, number];
  /** Les ventes annuelles aux artisans, au prix pro, qu'un showroom des artisans amènerait une fois lancé. */
  pro: number;
  /** Les charges fixes annuelles au format artisans : un poste et demi de moins, plus de publicité. */
  fixesArtisans: number;
  /** Déstockage et démontage, si l'on ferme. */
  fermeture: number;
  /** Les visites par semaine, au départ. */
  visites: number;
  /** Ce que le site a coûté en travaux et en agencement, déjà payé. */
  travaux: number;
}

export const ECULLY: Site = {
  id: "ecully",
  nom: "Écully",
  ventes: 950000,
  loyer: 105000,
  personnel: 210000,
  autres: 40000,
  croissance: [0.2, 0, -0.12],
  pro: 700000,
  fixesArtisans: 270000,
  fermeture: 30000,
  visites: 260,
  travaux: 1000000,
};

export const SAINT_PRIEST: Site = {
  id: "saintPriest",
  nom: "Saint-Priest",
  ventes: 640000,
  loyer: 80000,
  personnel: 150000,
  autres: 32000,
  croissance: [0.12, 0.02, -0.08],
  pro: 600000,
  fixesArtisans: 205000,
  fermeture: 25000,
  visites: 190,
  travaux: 760000,
};

export const RILLIEUX: Site = {
  id: "rillieux",
  nom: "Rillieux",
  ventes: 420000,
  loyer: 66000,
  personnel: 98000,
  autres: 28000,
  croissance: [0.08, 0, -0.1],
  pro: 200000,
  fixesArtisans: 170000,
  fermeture: 20000,
  visites: 150,
  travaux: 640000,
};

export const SITES: readonly Site[] = [ECULLY, SAINT_PRIEST, RILLIEUX];

export const fixes = (s: Site) => s.loyer + s.personnel + s.autres;
/** Ce que le site perd par an, aujourd'hui, hors sommes déjà engagées : marge sur coût variable moins charges fixes. */
export const resultatAnnuel = (s: Site) => s.ventes * MARGE - fixes(s);
/** La perte d'exploitation annuelle propre aux trois showrooms : ce que la prévision de la semaine 1 demande. */
export const PERTE_ANNUELLE = -SITES.reduce((t, s) => t + resultatAnnuel(s), 0);
/** Le résultat analytique que la direction financière affiche pour le projet. */
export const RESULTAT_ANALYTIQUE = -PERTE_ANNUELLE - AMORTISSEMENT - QUOTE_PART_SIEGE;

/**
 * LE POTENTIEL RÉEL DU MARCHÉ DES PARTICULIERS, tiré d'avance : sur une
 * quinzaine de showrooms comparables, un sur quatre a trouvé son public,
 * près de la moitié plafonnent, trois sur dix ont reculé une fois l'effet de
 * nouveauté passé. Les ventes aux artisans y sont peu sensibles.
 */
export const SCENARIOS = [
  { id: "decolle", nom: "le marché des particuliers décolle", chance: 0.25, pro: 1.05 },
  { id: "plafonne", nom: "le marché des particuliers plafonne", chance: 0.45, pro: 1 },
  { id: "recule", nom: "le marché des particuliers recule", chance: 0.3, pro: 0.95 },
] as const;
export type Scenario = 0 | 1 | 2;

/** Le plan de relance de l'équipe du projet : une campagne, l'ouverture le dimanche. */
export const RELANCE = {
  campagne: 90000,
  debut: 3,
  fin: 8,
  /** Le personnel du dimanche, par site et par an, tant que le site reste au format particuliers. */
  dimanche: 20000,
  effet: 0.1,
  parScenario: [1.4, 1, 0.5],
  visites: 0.25,
} as const;
/** La campagne d'automne déjà engagée par l'équipe : elle continue si rien ne l'arrête. */
export const AUTOMNE = {
  campagne: 40000,
  engage: 5000,
  debut: 2,
  fin: 5,
  effet: 0.03,
  visites: 0.1,
} as const;
/** Les trois façons d'en savoir plus. */
export const INFORMATION = {
  analyse: 18000,
  etude: 45000,
  satisfaction: 8000,
  /** Sans la liste des artisans qui amènent leurs clients, le format artisans démarre moins bien. */
  sansListe: 0.85,
  resultats: 6,
} as const;
/** Réduire la voilure à Rillieux : horaires, un poste, la publicité. */
export const REDUIRE = { fixes: 45000, ventes: 0.85, visites: 0.75, debut: 6 } as const;
/** Le salon de l'habitat : un stand déjà réservé, et ce que l'équipe veut y ajouter. */
export const SALON = {
  semaine: 9,
  stand: 20000,
  renfort: 10000,
  effet: 0.06,
  visites: 1.6,
} as const;
/** Le showroom des artisans : les particuliers qui viennent encore, une montée en charge d'un an. */
export const ARTISANS = { travaux: 30000, garde: 0.4, montee: 0.7, debut: 8 } as const;
/** L'offre de Brémond pour Rillieux : le droit au bail et l'agencement, le stock repris au prix d'achat. */
export const OFFRES = {
  haute: 70000,
  basse: 30000,
  /** Les chances d'une offre haute, puis basse, selon le scénario ; sinon, pas d'offre. */
  chances: [
    [0.6, 0.3],
    [0.45, 0.35],
    [0.3, 0.4],
  ],
} as const;
/** Le président accepte un recentrage selon la façon dont on le lui présente. */
export const PRESIDENT = {
  criteres: 0.7,
  correction: 0.4,
  /** Ce que des critères validés avec lui en semaine 1 ajoutent ; ce qu'une proposition d'arrêt sans chiffres retire. */
  bonusCriteres: 0.22,
  malusArret: 0.25,
} as const;
/** La cellule voisine d'Écully : les cuisines, comme le prévoyait le plan de départ. */
export const AGRANDIR = { travaux: 100000, loyer: 15000, effet: [0.18, 0.08, 0.03] } as const;
/** La campagne de printemps de la rallonge d'un an. */
export const PRINTEMPS = { campagne: 40000, effet: 0.03 } as const;
/** Une proposition d'arrêt sans chiffres fuite : les équipes se démobilisent. */
export const DEMOBILISATION = 0.06;
/** Les visites prennent 2,5 % de leur niveau de rentrée chaque semaine, dans tous les scénarios. */
export const HAUSSE_VISITES = 0.025;
/** Le taux de transformation des devis, aujourd'hui. */
export const TRANSFORMATION_DEPART = 0.22;
/** Les semaines où les décisions agissent d'abord, et celle du comité. */
export const COMITE = 10;
export const EXECUTION = 11;

/** Les décisions, par leur place dans le chemin. */
export const D = {
  relance: 0,
  information: 1,
  rillieux: 2,
  saintPriest: 3,
  comite: 4,
  ecully: 5,
} as const;

/** Les options de chaque décision, par leur place dans la liste. */
export const O = {
  relance: { relancer: 0, criteres: 1, arreter: 2, laisser: 3 },
  information: { analyse: 0, etude: 1, rien: 2, satisfaction: 3 },
  rillieux: { negocier: 0, fermer: 1, garder: 2, reduire: 3 },
  saintPriest: { attendre: 0, tenir: 1, artisans: 2, fermer: 3 },
  comite: { criteres: 0, rallonge: 1, correction: 2, rien: 3 },
  ecully: { telQuel: 0, artisans: 1, essai: 2, agrandir: 3 },
} as const;

/** La semaine où chaque décision prend effet. */
export const EFFET = [2, 3, 5, 7, COMITE, 12] as const;

/** Ne rien changer, décision par décision : laisser tourner, rien commander, garder, attendre. */
export const NEUTRE = [
  O.relance.laisser,
  O.information.rien,
  O.rillieux.garder,
  O.saintPriest.attendre,
  O.comite.rien,
  O.ecully.telQuel,
] as const;

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
  effet: { ventes?: number; site?: IdSite; montant?: number };
}

export const IMPREVUS: readonly Imprevu[] = [
  {
    id: "credit",
    titre: "Les banques resserrent le crédit travaux",
    de: "Hermance Chaboud",
    role: "Chargée d'affaires entreprises, banque du groupe",
    texte:
      "Nos réseaux durcissent les prêts travaux des particuliers pour un mois : apport exigé, délais allongés. Vos showrooms vont le sentir sur les signatures.",
    duree: 4,
    effet: { ventes: 0.92 },
  },
  {
    id: "degat",
    titre: "Un dégât des eaux à Saint-Priest",
    de: "Nathan Bouvreuil",
    role: "Responsable du showroom de Saint-Priest",
    texte:
      "Une canalisation du local voisin a lâché cette nuit : le showroom est fermé une semaine, le temps de sécher et de reposer l'exposition. 3 000 € de franchise.",
    duree: 1,
    effet: { ventes: 0, site: "saintPriest", montant: -3000 },
  },
  {
    id: "fabricant",
    titre: "Un fabricant finance les expositions",
    de: "Matteo Lunardi",
    role: "Directeur régional, fabricant de sanitaires",
    texte:
      "Nous renouvelons nos gammes : nous reprenons vos anciennes expositions de douches et vous en livrons de nouvelles à nos frais. Une économie de 15 000 € pour vous.",
    duree: 1,
    effet: { montant: 15000 },
  },
  {
    id: "depart",
    titre: "La responsable adjointe d'Écully s'en va",
    de: "Bettina Laforgue",
    role: "Responsable du showroom d'Écully",
    texte:
      "Mon adjointe part chez un cuisiniste. Trois semaines à deux au lieu de trois, et 6 000 € de cabinet pour la remplacer.",
    duree: 3,
    effet: { ventes: 0.85, site: "ecully", montant: -6000 },
  },
  {
    id: "taxe",
    titre: "La taxe foncière refacturée augmente",
    de: "Soukaïna Mernissi",
    role: "Contrôleuse de gestion",
    texte:
      "Les trois bailleurs refacturent la hausse de la taxe foncière, comme les baux le permettent : 9 000 € de plus sur l'année, à payer ce trimestre.",
    duree: 1,
    effet: { montant: -9000 },
  },
];

export interface ImprevuTire {
  imprevu: Imprevu;
  semaine: number;
}

export interface Hasard {
  scenario: Scenario;
  /** L'écart des ventes de chaque site, semaine par semaine (indices 1 à 13). */
  bruit: Readonly<Record<IdSite, readonly number[]>>;
  /** L'écart des visites, semaine par semaine. */
  bruitVisites: readonly number[];
  /** L'offre de Brémond : haute, basse, ou rien. */
  uOffre: number;
  /** Le président accepte-t-il le recentrage ? */
  uPresident: number;
  imprevus: readonly ImprevuTire[];
}

const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const tirages = new Map<number, Hasard>();

export function hasard(graine: number): Hasard {
  const deja = tirages.get(graine);
  if (deja) return deja;
  const r = mulberry32(graine * 1000393 + 7);
  const u = r();
  const scenario: Scenario =
    u < SCENARIOS[0].chance ? 0 : u < SCENARIOS[0].chance + SCENARIOS[1].chance ? 1 : 2;
  const bruit = {} as Record<IdSite, number[]>;
  for (const s of SITES) {
    const b = [0];
    for (let w = 1; w <= SEMAINES; w += 1) b.push(borne(0.035 * gauss(r), -0.08, 0.08));
    bruit[s.id] = b;
  }
  const bruitVisites = [0];
  for (let w = 1; w <= SEMAINES; w += 1) bruitVisites.push(borne(0.04 * gauss(r), -0.1, 0.1));
  const uOffre = r();
  const uPresident = r();
  const combien = r() < 0.5 ? 1 : 2;
  const restants = [...IMPREVUS];
  const imprevus: ImprevuTire[] = [];
  for (let k = 0; k < combien; k += 1) {
    const imprevu = restants.splice(Math.floor(r() * restants.length), 1)[0]!;
    imprevus.push({ imprevu, semaine: 2 + Math.floor(r() * 10) });
  }
  imprevus.sort((a, b) => a.semaine - b.semaine);
  const h: Hasard = { scenario, bruit, bruitVisites, uOffre, uPresident, imprevus };
  tirages.set(graine, h);
  return h;
}

/* ---------------------------------------------------------------------------
 * CE QUI DÉCOULE DES DÉCISIONS, ET TOMBE OU NON SELON LE HASARD.
 * ------------------------------------------------------------------------- */

/**
 * L'offre de Brémond, si l'on négocie : haute, basse, ou 0 s'il renonce. Il
 * lit le même marché que nous : plus les particuliers achètent, plus il paie.
 */
export function offreDeBremond(graine: number): number {
  const h = hasard(graine);
  const [haute, basse] = OFFRES.chances[h.scenario]!;
  if (h.uOffre < haute) return OFFRES.haute;
  if (h.uOffre < haute + basse) return OFFRES.basse;
  return 0;
}

/**
 * La chance que le président accepte le recentrage, selon la façon dont on le
 * lui présente : sept fois sur dix sur des critères, neuf avec des critères
 * qu'il a signés en semaine 1, quatre si on lui parle d'erreur ; moins encore
 * s'il a déjà dû refuser une proposition d'arrêt sans chiffres.
 */
export function chanceDAccord(chemin: readonly number[]): number {
  const c = chemin[D.comite];
  const d1 = chemin[D.relance];
  const malus = d1 === O.relance.arreter ? PRESIDENT.malusArret : 0;
  if (c === O.comite.criteres) {
    const bonus = d1 === O.relance.criteres ? PRESIDENT.bonusCriteres : 0;
    return borne(PRESIDENT.criteres + bonus - malus, 0, 1);
  }
  if (c === O.comite.correction) return borne(PRESIDENT.correction - malus, 0, 1);
  return 0;
}

/** Le président valide-t-il le recentrage au comité de la semaine 10 ? */
export const accordDuPresident = (chemin: readonly number[], graine: number) =>
  hasard(graine).uPresident < chanceDAccord(chemin);

/** Y a-t-il quelque chose à faire valider : une fermeture, une cession ? */
export const aValider = (chemin: readonly number[]) =>
  chemin[D.rillieux] === O.rillieux.negocier ||
  chemin[D.rillieux] === O.rillieux.fermer ||
  chemin[D.saintPriest] === O.saintPriest.fermer;

/** L'analyse client par client a-t-elle été commandée ? */
export const avecAnalyse = (chemin: readonly number[]) =>
  chemin[D.information] === O.information.analyse;
/** Un critère d'arrêt lisible sur les ventes : l'analyse, ou l'étude de marché. */
export const critereLisible = (chemin: readonly number[]) =>
  chemin[D.information] === O.information.analyse || chemin[D.information] === O.information.etude;

/* ---------------------------------------------------------------------------
 * LA VALEUR DES FLUX FUTURS DE CHAQUE SITE, à partir de la fin du trimestre.
 *
 * Les flux sont comptés par semestre sur trois ans, au taux du groupe.
 * ------------------------------------------------------------------------- */

export type Etat =
  /** Showroom pour particuliers, comme aujourd'hui ; avec ou sans campagnes, agrandi ou réduit. */
  | {
      type: "particuliers";
      relance?: boolean;
      printemps?: boolean;
      agrandi?: boolean;
      reduit?: boolean;
    }
  /** Showroom des artisans, ouvert dans le trimestre (debut 0) ou dans un semestre (debut 1). */
  | { type: "artisans"; debut: number; liste: boolean }
  /** Écully à l'essai jusqu'en juin, puis au format artisans si le critère n'est pas atteint. */
  | { type: "essai"; lisible: boolean; liste: boolean; relance?: boolean }
  /** Fermé dans le trimestre : le loyer jusqu'à l'échéance. */
  | { type: "ferme" }
  /** La fermeture attend le bilan annuel : un semestre de plus, puis la fermeture. */
  | { type: "fermeDiffere"; relance?: boolean; printemps?: boolean }
  /** Cédé à Brémond dans le trimestre : plus rien à payer. */
  | { type: "cede" };

/** Le facteur d'actualisation de la fin du semestre k (1 à 6). */
const actualise = (k: number, taux = TAUX) => (1 + taux) ** (k / 2);

/** Les ventes aux particuliers d'un semestre (1 à 6), en rythme annuel. */
function ventesAnnuelles(s: Site, sc: Scenario, k: number, hausse = 0): number {
  return s.ventes * (1 + s.croissance[sc]) ** (Math.min(k, 4) / 2) * (1 + hausse);
}

/** Ce que la relance et la campagne de printemps ajoutent aux ventes d'un semestre. */
function hausseDesCampagnes(sc: Scenario, k: number, relance?: boolean, printemps?: boolean) {
  const r = relance ? RELANCE.effet * RELANCE.parScenario[sc]! : 0;
  return (k <= 2 ? r : k <= 4 ? r / 2 : 0) + (printemps && k <= 2 ? PRINTEMPS.effet : 0);
}

/** Le flux d'un semestre d'un showroom pour particuliers. */
function fluxParticuliers(
  s: Site,
  sc: Scenario,
  k: number,
  o: { relance?: boolean; printemps?: boolean; agrandi?: boolean; reduit?: boolean } = {},
): number {
  let hausse = hausseDesCampagnes(sc, k, o.relance, o.printemps);
  let charges = fixes(s) + (o.relance ? RELANCE.dimanche : 0);
  if (o.agrandi && k >= 2) {
    hausse += AGRANDIR.effet[sc]!;
    charges += AGRANDIR.loyer;
  }
  let ventes = ventesAnnuelles(s, sc, k, hausse);
  if (o.reduit) {
    ventes *= REDUIRE.ventes;
    charges -= REDUIRE.fixes;
  }
  return (ventes * MARGE - charges) / 2;
}

/** Le flux d'un semestre d'un showroom des artisans, j semestres après son ouverture. */
function fluxArtisans(s: Site, sc: Scenario, k: number, j: number, liste: boolean): number {
  const pro =
    s.pro *
    MARGE_PRO *
    (j <= 2 ? ARTISANS.montee : 1) *
    (liste ? 1 : INFORMATION.sansListe) *
    SCENARIOS[sc].pro;
  const particuliers = ARTISANS.garde * ventesAnnuelles(s, sc, k) * MARGE;
  return (pro + particuliers - s.fixesArtisans) / 2;
}

/** Ce que coûte une fermeture dans le trimestre, à compter de la semaine 13 : le loyer jusqu'à l'échéance. */
export const loyerJusquALEcheance = (s: Site, taux = TAUX) =>
  (s.loyer * (ECHEANCE - SEMAINES)) / 52 / actualise(1, taux);

/** La valeur des flux futurs d'un site dans un état donné, sous un scénario, au taux du groupe. */
export function valeurFuture(s: Site, etat: Etat, sc: Scenario, taux = TAUX): number {
  let v = 0;
  if (etat.type === "particuliers") {
    if (etat.agrandi) v -= AGRANDIR.travaux;
    for (let k = 1; k <= 2 * HORIZON; k += 1) {
      v += fluxParticuliers(s, sc, k, etat) / actualise(k, taux);
    }
    return v;
  }
  if (etat.type === "artisans") {
    for (let k = 1; k <= 2 * HORIZON; k += 1) {
      const f =
        k <= etat.debut
          ? fluxParticuliers(s, sc, k)
          : fluxArtisans(s, sc, k, k - etat.debut, etat.liste);
      v += f / actualise(k, taux);
    }
    if (etat.debut > 0) v -= ARTISANS.travaux / actualise(etat.debut, taux);
    return v;
  }
  if (etat.type === "essai") {
    // Le critère se lit sur ce qu'on mesure. Sur les ventes, il fait basculer Écully en juin
    // si le marché ne décolle pas et que le format artisans vaut mieux ; sur les visites, qui
    // montent dans tous les scénarios, il ne se déclenche jamais.
    const continuer = valeurFuture(s, { type: "particuliers", relance: etat.relance }, sc, taux);
    if (!etat.lisible || sc === 0) return continuer;
    return Math.max(
      continuer,
      valeurFuture(s, { type: "artisans", debut: 1, liste: etat.liste }, sc, taux),
    );
  }
  if (etat.type === "ferme") return -loyerJusquALEcheance(s, taux);
  if (etat.type === "fermeDiffere") {
    return (fluxParticuliers(s, sc, 1, etat) - s.fermeture - s.loyer / 2) / actualise(1, taux);
  }
  return 0;
}

/* ---------------------------------------------------------------------------
 * CE QUE CHAQUE SITE DEVIENT, selon le chemin et le hasard.
 * ------------------------------------------------------------------------- */

/** Les fermetures et la cession passent-elles au comité ? Avant lui, on suppose que oui. */
export function valide(chemin: readonly number[], graine: number, vu = SEMAINES): boolean {
  if (vu < COMITE) return true;
  const c = chemin[D.comite];
  if (c === O.comite.rallonge || c === O.comite.rien) return false;
  return accordDuPresident(chemin, graine);
}

/** Brémond renonce-t-il ? Il le dit tard, en semaine 9 : la fermeture attend alors le bilan annuel. */
export const bremondRenonce = (chemin: readonly number[], graine: number, vu = SEMAINES) =>
  chemin[D.rillieux] === O.rillieux.negocier && vu >= SALON.semaine && offreDeBremond(graine) === 0;

export interface Etats {
  ecully: Etat;
  saintPriest: Etat;
  rillieux: Etat;
}

/** Ce que chaque site est à la fin du trimestre, vu en semaine `vu`. */
export function etats(chemin: readonly number[], graine: number, vu = SEMAINES): Etats {
  const relance = chemin[D.relance] === O.relance.relancer;
  const printemps = chemin[D.comite] === O.comite.rallonge;
  const ok = valide(chemin, graine, vu);
  const liste = avecAnalyse(chemin);
  const base = { type: "particuliers" as const, relance, printemps };
  const differe = { type: "fermeDiffere" as const, relance, printemps };

  let rillieux: Etat = base;
  const dR = chemin[D.rillieux];
  if (dR === O.rillieux.reduire) rillieux = { ...base, reduit: true };
  if (dR === O.rillieux.fermer) rillieux = ok ? { type: "ferme" } : differe;
  if (dR === O.rillieux.negocier) {
    rillieux = ok && !bremondRenonce(chemin, graine, vu) ? { type: "cede" } : differe;
  }

  let saintPriest: Etat = base;
  const dS = chemin[D.saintPriest];
  if (dS === O.saintPriest.artisans) saintPriest = { type: "artisans", debut: 0, liste };
  if (dS === O.saintPriest.fermer) saintPriest = ok ? { type: "ferme" } : differe;

  let ecully: Etat = base;
  const dE = chemin[D.ecully];
  if (dE === O.ecully.agrandir) ecully = { ...base, agrandi: true };
  if (dE === O.ecully.essai) {
    ecully = { type: "essai", lisible: critereLisible(chemin), liste, relance };
  }
  if (dE === O.ecully.artisans) ecully = { type: "artisans", debut: 0, liste };

  return { ecully, saintPriest, rillieux };
}

/* ---------------------------------------------------------------------------
 * LE TRIMESTRE, SEMAINE PAR SEMAINE.
 * ------------------------------------------------------------------------- */

const imprevu = (h: Hasard, id: string) => h.imprevus.find((i) => i.imprevu.id === id);
const actif = (h: Hasard, id: string, w: number) => {
  const i = imprevu(h, id);
  return i !== undefined && w >= i.semaine && w < i.semaine + i.imprevu.duree;
};

/** Le format d'un site une semaine donnée du trimestre. */
type Format = "particuliers" | "artisans" | "ferme" | "cede";

function formatDuSite(
  chemin: readonly number[],
  graine: number,
  s: Site,
  w: number,
  vu: number,
): Format {
  const execute = w >= EXECUTION && valide(chemin, graine, vu);
  if (s.id === "rillieux") {
    const d = chemin[D.rillieux];
    if (d === O.rillieux.negocier && execute && !bremondRenonce(chemin, graine, vu)) return "cede";
    if (d === O.rillieux.fermer && execute) return "ferme";
  }
  if (s.id === "saintPriest") {
    const d = chemin[D.saintPriest];
    if (d === O.saintPriest.artisans && w >= ARTISANS.debut) return "artisans";
    if (d === O.saintPriest.fermer && execute) return "ferme";
  }
  if (s.id === "ecully" && chemin[D.ecully] === O.ecully.artisans && w >= SEMAINES) {
    return "artisans";
  }
  return "particuliers";
}

export interface DetailSemaine {
  /** Le résultat d'exploitation de la semaine, décisions comprises, en euros. */
  resultat: number;
  /** Les ventes de la semaine, particuliers et artisans. */
  ventes: number;
  ventesParticuliers: number;
  visites: number;
  /** Le taux de transformation des devis des showrooms restés au format particuliers. */
  transformation: number;
  /** Les dépenses de la semaine qui tiennent aux décisions (campagnes, études, travaux) et la cession. */
  ponctuel: number;
}

/**
 * Une semaine du trimestre, sous un scénario, avec ou sans les écarts tirés
 * de la semaine et les imprévus. `vu` : la semaine d'où on la regarde (avant
 * le comité, on suppose que le recentrage passera).
 */
function semaine(
  chemin: readonly number[],
  graine: number,
  w: number,
  sc: Scenario,
  avecBruit: boolean,
  vu = SEMAINES,
): DetailSemaine {
  const h = hasard(graine);
  const [d1, d2, dR, dS, dC, dE] = chemin;
  const relance = d1 === O.relance.relancer;
  const automne = d1 === O.relance.arreter || d1 === O.relance.laisser;
  let resultat = 0;
  let ventes = 0;
  let ventesParticuliers = 0;
  let visites = 0;
  let ponctuel = 0;
  // Le taux de transformation suit les ventes rapportées aux visites, site par site.
  let signe = 0;
  let attendu = 0;

  for (const s of SITES) {
    const format = formatDuSite(chemin, graine, s, w, vu);
    if (format === "cede") continue;
    if (format === "ferme") {
      resultat -= s.loyer / 52;
      continue;
    }
    let hausse = 1 + (s.croissance[sc] * w) / 52;
    let visitesSite = s.visites * (1 + HAUSSE_VISITES * w);
    if (relance && w > RELANCE.debut) {
      hausse *= 1 + RELANCE.effet * RELANCE.parScenario[sc]!;
      visitesSite *= 1 + RELANCE.visites;
    }
    if (automne && w > AUTOMNE.debut && w <= AUTOMNE.fin + 3) {
      hausse *= 1 + AUTOMNE.effet;
      visitesSite *= 1 + AUTOMNE.visites;
    }
    if (d1 === O.relance.arreter && w >= 3) hausse *= 1 - DEMOBILISATION;
    if (w === SALON.semaine) visitesSite *= SALON.visites;
    const salon = dS === O.saintPriest.tenir || dS === O.saintPriest.attendre;
    if (s.id === "saintPriest" && salon && w >= SALON.semaine && w <= SALON.semaine + 2) {
      hausse *= 1 + (dS === O.saintPriest.tenir ? SALON.effet : SALON.effet / 2);
    }
    const reduit = s.id === "rillieux" && dR === O.rillieux.reduire && w >= REDUIRE.debut;
    if (reduit) {
      hausse *= REDUIRE.ventes;
      visitesSite *= REDUIRE.visites;
    }
    if (avecBruit) {
      hausse *= 1 + h.bruit[s.id][w]!;
      visitesSite *= 1 + h.bruitVisites[w]!;
      for (const { imprevu: i } of h.imprevus) {
        const ici = !i.effet.site || i.effet.site === s.id;
        if (i.effet.ventes !== undefined && ici && actif(h, i.id, w)) hausse *= i.effet.ventes;
      }
    }
    let part = (s.ventes / 52) * hausse;
    let charges = fixes(s) / 52;
    if (relance && w >= RELANCE.debut) charges += RELANCE.dimanche / 52;
    if (reduit) charges -= REDUIRE.fixes / 52;
    let pro = 0;
    if (format === "artisans") {
      part *= ARTISANS.garde;
      visitesSite *= ARTISANS.garde + 0.2;
      charges = s.fixesArtisans / 52;
      pro =
        ((s.pro * ARTISANS.montee * (avecAnalyse(chemin) ? 1 : INFORMATION.sansListe)) / 52) *
        SCENARIOS[sc].pro;
    }
    resultat += part * MARGE + pro * MARGE_PRO - charges;
    ventes += part + pro;
    ventesParticuliers += part;
    visites += visitesSite;
    if (format === "particuliers") {
      signe += part;
      attendu += (visitesSite / s.visites) * (s.ventes / 52);
    }
  }

  // Les dépenses qui tiennent aux décisions.
  if (relance && w >= RELANCE.debut && w <= RELANCE.fin) {
    ponctuel -= RELANCE.campagne / (RELANCE.fin - RELANCE.debut + 1);
  }
  if (w === 1) ponctuel -= AUTOMNE.engage;
  if (automne && w >= AUTOMNE.debut && w <= AUTOMNE.fin) {
    ponctuel -= (AUTOMNE.campagne - AUTOMNE.engage) / (AUTOMNE.fin - AUTOMNE.debut + 1);
  }
  if (w === EFFET[D.information]) {
    ponctuel -=
      d2 === O.information.analyse
        ? INFORMATION.analyse
        : d2 === O.information.etude
          ? INFORMATION.etude
          : d2 === O.information.satisfaction
            ? INFORMATION.satisfaction
            : 0;
  }
  if (w === SALON.semaine - 1) {
    // Le stand est réservé ; l'équipe ne le tient pas si Saint-Priest change de format.
    if (dS === O.saintPriest.tenir) ponctuel -= SALON.stand + SALON.renfort;
    if (dS === O.saintPriest.attendre) ponctuel -= SALON.stand;
  }
  if (dS === O.saintPriest.artisans && w === ARTISANS.debut - 1) ponctuel -= ARTISANS.travaux;
  if (dE === O.ecully.artisans && w === EFFET[D.ecully]) ponctuel -= ARTISANS.travaux;
  if (dC === O.comite.rallonge && w >= EXECUTION) {
    ponctuel -= PRINTEMPS.campagne / (SEMAINES - EXECUTION + 1);
  }
  if (w === EXECUTION) {
    for (const s of SITES) {
      const f = formatDuSite(chemin, graine, s, w, vu);
      if (f === "ferme") ponctuel -= s.fermeture;
      if (f === "cede") ponctuel += offreDeBremond(graine);
    }
  }
  if (avecBruit) {
    for (const { imprevu: i, semaine: ws } of h.imprevus) {
      if (ws === w && i.effet.montant) ponctuel += i.effet.montant;
    }
  }
  const transformation = attendu > 0 ? (TRANSFORMATION_DEPART * signe) / attendu : 0;
  return {
    resultat: resultat + ponctuel,
    ventes,
    ventesParticuliers,
    visites,
    transformation,
    ponctuel,
  };
}

/* ---------------------------------------------------------------------------
 * LA VALEUR CRÉÉE, TELLE QU'ON L'ESTIME À LA FIN D'UNE SEMAINE.
 * ------------------------------------------------------------------------- */

/**
 * Ce qu'on croit du scénario en fin de semaine w : les chances du panel au
 * départ ; l'analyse client par client, puis le salon, l'éclairent ; les
 * chiffres de l'automne le disent en semaine 13. Sans l'analyse, les ventes
 * de la semaine, trop bruitées, n'apprennent presque rien.
 */
export function croyance(chemin: readonly number[], graine: number, w: number): readonly number[] {
  const vrai = hasard(graine).scenario;
  const a = avecAnalyse(chemin);
  const poids =
    w >= SEMAINES
      ? 1
      : w >= SALON.semaine
        ? a
          ? 0.9
          : 0.4
        : w >= INFORMATION.resultats
          ? a
            ? 0.8
            : 0.2
          : 0;
  return SCENARIOS.map((s, i) => (1 - poids) * s.chance + (i === vrai ? poids : 0));
}

/** Les décisions connues en fin de semaine w ; les autres comptent comme « ne rien changer ». */
const connues = (chemin: readonly number[], w: number) =>
  NEUTRE.map((n, k) => (w >= EFFET[k]! ? chemin[k]! : n));

/** La valeur des flux futurs des trois sites, sous un scénario. */
export function valeurDesSites(
  chemin: readonly number[],
  graine: number,
  sc: Scenario,
  vu = SEMAINES,
) {
  const e = etats(chemin, graine, vu);
  return {
    ecully: valeurFuture(ECULLY, e.ecully, sc),
    saintPriest: valeurFuture(SAINT_PRIEST, e.saintPriest, sc),
    rillieux: valeurFuture(RILLIEUX, e.rillieux, sc),
  };
}

export type Semaine = {
  /** La valeur créée estimée en fin de semaine, en euros. */
  valeur: number;
  /** Ce que la semaine a changé à l'estimation. */
  variation: number;
  /** Le résultat d'exploitation des showrooms depuis le début du trimestre, décisions comprises. */
  resultat: number;
  /** Les ventes de la semaine, et la part des particuliers. */
  ventes: number;
  ventesParticuliers: number;
  visites: number;
  /** Le taux de transformation des devis de la semaine. */
  transformation: number;
};

export interface Trimestre {
  semaines: readonly (Semaine | null)[];
  /** La valeur estimée avant toute décision, si rien ne change. */
  depart: number;
  /** La valeur créée estimée en semaine 13, en euros. */
  objectif: number;
  scenario: Scenario;
  /** Le résultat du trimestre, et la valeur des flux futurs de chaque site. */
  resultat: number;
  futur: { ecully: number; saintPriest: number; rillieux: number };
  etats: Etats;
  /** L'offre de Brémond, si l'on a négocié ; 0 s'il a renoncé. */
  offre: number | null;
  /** Le président a-t-il validé le recentrage ? `null` : rien à valider, ou rien présenté. */
  accord: boolean | null;
  aValider: boolean;
  /** La chance que le président avait d'accepter, telle que la décision lui a été présentée. */
  chanceAccord: number;
  /** La perte de l'enquête, au-delà des jours sans perte. */
  perteEnquete: number;
}

/** La valeur estimée en fin de semaine w : le résultat acquis, le reste du trimestre et les flux futurs. */
function estimer(
  chemin: readonly number[],
  graine: number,
  w: number,
  acquis: number,
  perteEnquete: number,
): number {
  const c = connues(chemin, w);
  const p = croyance(chemin, graine, w);
  let v = acquis - perteEnquete;
  for (let i = 0; i < SCENARIOS.length; i += 1) {
    const sc = i as Scenario;
    if (p[sc]! <= 0) continue;
    let reste = 0;
    for (let k = w + 1; k <= SEMAINES; k += 1)
      reste += semaine(c, graine, k, sc, false, w).resultat;
    const f = valeurDesSites(c, graine, sc, w);
    v += p[sc]! * (reste + f.ecully + f.saintPriest + f.rillieux);
  }
  return v;
}

/** La valeur estimée en semaine 0 : rien ne change, les chances du panel. */
export const valeurDeDepart = (graine: number) => estimer(NEUTRE, graine, 0, 0, 0);

export function simuler(chemin: readonly number[], graine: number, jours = 0): Trimestre {
  const h = hasard(graine);
  const sc = h.scenario;
  const perteEnquete = Math.max(0, jours - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
  const semaines: (Semaine | null)[] = [null];
  let cumul = 0;
  let avant = 0;
  for (let w = 1; w <= SEMAINES; w += 1) {
    const s = semaine(chemin, graine, w, sc, true);
    cumul += s.resultat;
    const valeur = estimer(chemin, graine, w, cumul, perteEnquete);
    semaines.push({
      valeur,
      variation: valeur - avant,
      resultat: cumul,
      ventes: s.ventes,
      ventesParticuliers: s.ventesParticuliers,
      visites: s.visites,
      transformation: s.transformation,
    });
    avant = valeur;
  }
  const presente =
    chemin[D.comite] === O.comite.criteres || chemin[D.comite] === O.comite.correction;
  return {
    semaines,
    depart: valeurDeDepart(graine),
    objectif: semaines[SEMAINES]!.valeur,
    scenario: sc,
    resultat: cumul,
    futur: valeurDesSites(chemin, graine, sc),
    etats: etats(chemin, graine),
    offre: chemin[D.rillieux] === O.rillieux.negocier ? offreDeBremond(graine) : null,
    accord: aValider(chemin) && presente ? accordDuPresident(chemin, graine) : null,
    aValider: aValider(chemin),
    chanceAccord: chanceDAccord(chemin),
    perteEnquete,
  };
}

/** Ce qui s'est passé pendant des semaines : l'analyse, le salon, Brémond, le comité, les imprévus. */
export function evenements(chemin: readonly number[], graine: number, de: number, a: number) {
  const h = hasard(graine);
  const dans = (w: number) => w >= de && w <= a;
  return {
    analyse: avecAnalyse(chemin) && dans(INFORMATION.resultats),
    salon: dans(SALON.semaine),
    renonce: bremondRenonce(chemin, graine) && dans(SALON.semaine),
    comite: dans(COMITE),
    execution: dans(EXECUTION),
    automne: dans(12),
    imprevus: h.imprevus.filter((i) => dans(i.semaine)),
  };
}

export interface LectureMaison {
  valeur: number | null;
  resultat: number | null;
  visites: number | null;
  transformation: number | null;
  ventes: number | null;
  /** Non affichés : ce que les messages et les sources lisent. */
  visitesHausse: number | null;
  ventesHausse: number | null;
  visitesRillieux: number | null;
  /** Le scénario que l'analyse client par client lit dans les ventes d'Écully ; `null` sans elle. */
  scenarioLu: number | null;
  /** L'offre de Brémond, une fois faite ; 0 s'il a renoncé, `null` si l'on ne négocie pas. */
  offre: number | null;
}

/**
 * Ce que Malika lit à la fin d'une semaine ; les décisions à venir comptent
 * comme « ne rien changer ».
 */
export function tableauDeBord(
  decisions: readonly number[],
  graine: number,
  jours: number,
  w: number,
): LectureMaison {
  const v0 = SITES.reduce((t, s) => t + s.visites, 0);
  const p0 = SITES.reduce((t, s) => t + s.ventes / 52, 0);
  if (w === 0) {
    return {
      valeur: valeurDeDepart(graine),
      resultat: 0,
      visites: v0,
      transformation: TRANSFORMATION_DEPART,
      ventes: p0,
      visitesHausse: 0,
      ventesHausse: 0,
      visitesRillieux: RILLIEUX.visites,
      scenarioLu: null,
      offre: null,
    };
  }
  const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
  const t = simuler(chemin, graine, jours);
  const s = t.semaines[w]!;
  // Les hausses depuis la rentrée : les deux dernières semaines, contre la rentrée.
  const avant = t.semaines[Math.max(1, w - 1)]!;
  const vis = (s.visites + avant.visites) / 2;
  const ven = (s.ventesParticuliers + avant.ventesParticuliers) / 2;
  const h = hasard(graine);
  const visitesRillieux =
    RILLIEUX.visites *
    (1 + HAUSSE_VISITES * w) *
    (1 + h.bruitVisites[w]!) *
    (w === SALON.semaine ? SALON.visites : 1);
  return {
    valeur: s.valeur,
    resultat: s.resultat,
    visites: s.visites,
    transformation: s.transformation,
    ventes: s.ventes,
    visitesHausse: vis / v0 - 1,
    ventesHausse: ven / p0 - 1,
    visitesRillieux,
    scenarioLu: avecAnalyse(chemin) && w >= INFORMATION.resultats ? h.scenario : null,
    offre:
      chemin[D.rillieux] === O.rillieux.negocier && w >= EFFET[D.rillieux] - 1
        ? offreDeBremond(graine)
        : null,
  };
}
