import type { EngineScenarioConfig } from "../../engine/types";
import {
  applyPeriodicity,
  composerPerte,
  PERIODICITY_DAYS,
  periodicityFromRoundDays,
  type Periodicity,
} from "./periodicity";
import type { SituationDef } from "./situation-kit";

/**
 * LE TEXTE D'UNE SITUATION SE REND À LA DURÉE DU TOUR DE SA PARTIE.
 *
 * Une partie se joue au mois, au trimestre ou à l'année (ADR-01) : le moteur
 * multiplie les flux par k = jours / 90. Les situations, elles, étaient écrites
 * au trimestre, montants compris. Une salle de VOLT FITNESS jouée au mois
 * facture 35 € par adhérent et en garde 30 de marge ; son énoncé disait « 105 €
 * par trimestre » et « 90 € de marge ». La situation entière était fausse, et
 * rien ne le signalait.
 *
 * DES JETONS DANS LES CHAÎNES, ET NON DES FONCTIONS DU SCÉNARIO. Le choix tient
 * à ce qu'une situation est une DONNÉE : on la sème en base
 * (`pedagogy-seed.service`), on la copie dans un scénario d'enseignant
 * (`serialize.ts`), on en édite le texte (`situation-patch.ts`), on en compte les
 * signes (`duree-du-tour.ts`). Une fonction ne survit à aucun de ces trajets ;
 * une chaîne à jetons, si. Le dépôt a déjà ce patron pour les guides
 * (`config/guides/jetons.ts`, `{{nom}}`), et un énoncé à jetons se lit encore
 * comme une phrase : « paient {{entier: abonnement}} € {{par trimestre}} ».
 *
 * Deux sortes de jetons.
 *  · Les MOTS DE DURÉE s'écrivent tels qu'au trimestre : `{{par trimestre}}`,
 *    `{{du trimestre}}`, `{{trimestrielle}}`. La table ci-dessous dit ce qu'ils
 *    deviennent au mois et à l'année. Les mots retenus sont masculins (mois,
 *    exercice), pour ne casser aucun accord ; l'article fait partie du jeton
 *    quand l'élision le change (« du trimestre », « de l'exercice »). Un jeton
 *    qui commence par une majuscule rend sa forme capitalisée.
 *  · Les MONTANTS s'écrivent `{{format: expression}}`. L'expression lit des
 *    grandeurs du scénario (`abonnement`, `marge`, `charges`, `attrition`…) :
 *    aucun montant de configuration n'est écrit à la main, conformément à la
 *    règle du dépôt.
 *
 * D'OÙ SE LISENT LES MONTANTS. Du scénario de la partie mis à SA durée de tour
 * par `applyPeriodicity` même : la règle du moteur, pas une copie. Le scénario
 * est celui de la définition (le registre pour un secteur intégré), et non
 * l'instantané brut de la partie : le monde variable, coché par défaut, tire les
 * charges de structure à plus ou moins 2 %, et l'instantané d'une partie au
 * trimestre aurait fait dire « 106 438 € » là où l'énoncé dit « 105 000 € »
 * depuis toujours. Le texte d'une partie au trimestre reste donc, octet pour
 * octet, celui d'avant ; au mois et à l'année, il dit ce que le moteur facture
 * dans le monde figé (garde : tests/scenarios/textes-a-la-duree.test.ts).
 *
 * LE REGISTRE GARDE LE TEXTE AU TRIMESTRE. `situationsAuTrimestre` rend les
 * sources une fois, au chargement, et c'est ce rendu que portent
 * `scenarioByCode(…).situations` et `situationByCode`. Un chemin qui n'a pas de
 * partie (catalogue, éditeur, référentiel semé) lit donc la version
 * trimestrielle sans rien faire, et un chemin oublié montrerait le texte d'hier,
 * jamais des accolades. Un chemin qui a une partie passe par
 * `situationDeLaPartie`, qui retrouve la source par l'identité de l'objet.
 */

// ---------------------------------------------------------------------------
// Les mots de durée
// ---------------------------------------------------------------------------

/** Ce que devient, au mois et à l'année, une tournure écrite au trimestre. */
const MOTS: Record<string, { month: string; year: string }> = {
  trimestre: { month: "mois", year: "exercice" },
  trimestres: { month: "mois", year: "exercices" },
  "par trimestre": { month: "par mois", year: "par an" },
  "le trimestre": { month: "le mois", year: "l'exercice" },
  "du trimestre": { month: "du mois", year: "de l'exercice" },
  "au trimestre": { month: "au mois", year: "à l'exercice" },
  "de trimestre": { month: "de mois", year: "d'exercice" },
  "de trimestres": { month: "de mois", year: "d'exercices" },
  "ce trimestre": { month: "ce mois-ci", year: "cet exercice" },
  "ce trimestre-ci": { month: "ce mois-ci", year: "cet exercice" },
  trimestriel: { month: "mensuel", year: "annuel" },
  trimestrielle: { month: "mensuelle", year: "annuelle" },
  trimestriels: { month: "mensuels", year: "annuels" },
  trimestrielles: { month: "mensuelles", year: "annuelles" },
  // À l'année, l'engagement annuel EST le tour : la tournure se décale d'un cran.
  "engagements annuels plutôt que trimestriels": {
    month: "engagements annuels plutôt que mensuels",
    year: "engagements pluriannuels plutôt qu'annuels",
  },
};

const capitaliser = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function motDeDuree(cle: string, periodicite: Periodicity): string | undefined {
  const exact = MOTS[cle];
  if (exact) return periodicite === "quarter" ? cle : exact[periodicite];
  const minuscule = cle.charAt(0).toLowerCase() + cle.slice(1);
  if (minuscule === cle || !MOTS[minuscule]) return undefined;
  return periodicite === "quarter" ? cle : capitaliser(MOTS[minuscule]![periodicite]);
}

// ---------------------------------------------------------------------------
// Les grandeurs et leurs expressions
// ---------------------------------------------------------------------------

/**
 * Un taux tel que le texte le montre : au dixième de point. L'élève refait le
 * calcul avec le taux qu'il lit ; la valeur vie se calcule donc avec lui, et
 * non avec les décimales que l'énoncé ne donne pas.
 */
const tauxLu = (x: number) => Math.round(x * 1000) / 1000;

/** Supprime le bruit des flottants avant d'arrondir : 90 ÷ 0,16 vaut 562,5, pas 562,4999… */
const net = (x: number) => Number(x.toFixed(9));

type Grandeur = (s: EngineScenarioConfig) => number;

const abonnementDe = (s: EngineScenarioConfig) => {
  if (!s.subscription) throw new Error("Situation : le jeton « abonnement » suppose un scénario par abonnement");
  return s.subscription;
};

/** Les grandeurs qu'un énoncé peut citer, lues du scénario mis à la durée du tour. */
const GRANDEURS: Record<string, Grandeur> = {
  /** Le prix d'un tour d'abonnement (référence du scénario). */
  abonnement: (s) => abonnementDe(s).refPrice,
  /** Le coût variable d'une unité vendue : matières et autres charges variables. */
  variable: (s) => s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit,
  /** La marge d'un tour d'abonnement. */
  marge: (s) => abonnementDe(s).refPrice - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit,
  /** Les charges de structure d'un tour. */
  charges: (s) => s.fixedCostsPerRound,
  /** L'attrition de base d'un tour, telle que le texte la montre. */
  attrition: (s) => tauxLu(abonnementDe(s).baseChurnRate),
  /** Le nombre de tours dans une année. */
  tours_par_an: (s) => 360 / s.roundDays,
};

const FONCTIONS: Record<string, (x: number, s: EngineScenarioConfig) => number> = {
  /** Un taux de perte écrit au trimestre, ramené à la durée du tour par la règle du moteur. */
  perte: (x, s) => tauxLu(composerPerte(x, s.roundDays / 90)),
  /** Un montant arrondi à l'unité, quand l'énoncé calcule avec un nombre qu'il a déjà arrondi. */
  arrondi: (x) => Math.round(net(x)),
  /**
   * Un flux du récit écrit au trimestre (un montant ou un volume par tour que le scénario
   * ne porte pas : une offre, un contrat), mis à la durée du tour comme le moteur met les
   * siens (× jours / 90). Un chiffre que le scénario porte se lit par sa grandeur, jamais
   * par `flux`.
   */
  flux: (x, s) => (x * s.roundDays) / 90,
};

/** Une petite arithmétique : nombres, grandeurs, fonctions, + − × ÷ et parenthèses. */
function evaluer(source: string, s: EngineScenarioConfig): number {
  const jetons = source.match(/\d+(?:\.\d+)?|[a-z_]+|[-+*/()]/g) ?? [];
  if (jetons.join("") !== source.replace(/\s+/g, "")) {
    throw new Error(`Situation : expression illisible « ${source} »`);
  }
  let i = 0;
  const lire = () => jetons[i++];
  const voir = () => jetons[i];
  const facteur = (): number => {
    const t = lire();
    if (t === undefined) throw new Error(`Situation : expression incomplète « ${source} »`);
    if (t === "-") return -facteur();
    if (t === "(") {
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return v;
    }
    if (/^\d/.test(t)) return Number(t);
    if (voir() === "(") {
      const f = FONCTIONS[t];
      if (!f) throw new Error(`Situation : fonction inconnue « ${t} »`);
      lire();
      const v = somme();
      if (lire() !== ")") throw new Error(`Situation : parenthèse non fermée « ${source} »`);
      return f(v, s);
    }
    const g = GRANDEURS[t];
    if (!g) throw new Error(`Situation : grandeur inconnue « ${t} »`);
    return g(s);
  };
  const produit = (): number => {
    let v = facteur();
    while (voir() === "*" || voir() === "/") v = lire() === "*" ? v * facteur() : v / facteur();
    return v;
  };
  const somme = (): number => {
    let v = produit();
    while (voir() === "+" || voir() === "-") v = lire() === "+" ? v + produit() : v - produit();
    return v;
  };
  const v = somme();
  if (i !== jetons.length) throw new Error(`Situation : expression illisible « ${source} »`);
  if (!Number.isFinite(v)) throw new Error(`Situation : expression sans valeur « ${source} »`);
  return v;
}

// ---------------------------------------------------------------------------
// Les formats
// ---------------------------------------------------------------------------

/** Les milliers séparés d'une espace, comme les énoncés l'ont toujours écrit. */
const milliers = (n: number) => String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const entier = (x: number) => {
  const n = Math.round(net(x));
  return (n < 0 ? "-" : "") + milliers(n);
};
const avecVirgule = (x: number, min: number, max: number) =>
  net(x).toLocaleString("fr-FR", { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: false });

const UNITES = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix",
  "onze", "douze", "treize", "quatorze", "quinze", "seize",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];

/** Un entier de 0 à 99 en toutes lettres (orthographe traditionnelle). */
function enMots(n: number, feminin: boolean): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  const un = feminin ? "une" : "un";
  if (n === 1) return un;
  if (n <= 16) return UNITES[n]!;
  if (n < 20) return `dix-${UNITES[n - 10]}`;
  if (n >= 80) {
    const reste = n - 80;
    return reste === 0 ? "quatre-vingts" : `quatre-vingt-${reste === 1 ? un : enMots(reste, feminin)}`;
  }
  const dizaine = n >= 60 ? 60 : Math.floor(n / 10) * 10;
  const reste = n - dizaine;
  const tete = DIZAINES[dizaine / 10]!;
  if (reste === 0) return tete;
  if (reste === 1) return `${tete} et ${un}`;
  if (reste === 11 && dizaine === 60) return "soixante et onze";
  return `${tete}-${enMots(reste, feminin)}`;
}

/** Des points d'écart : en toutes lettres quand c'est un entier, sinon au dixième ; singulier sous deux. */
function points(x: number): string {
  const v = Math.round(net(x * 100) * 10) / 10;
  const nombre = Number.isInteger(v) && v <= 16 ? enMots(v, false) : avecVirgule(v, 0, 1);
  return `${nombre} ${Math.abs(v) < 2 ? "point" : "points"}`;
}

const FORMATS: Record<string, (x: number) => string> = {
  /** Un montant à l'euro : « 105 000 ». */
  entier,
  /** Un montant au centime : « 13,50 ». */
  centimes: (x) => avecVirgule(x, 2, 2),
  /** Un taux en pour cent, au dixième : « 15 », « 5,3 ». */
  taux: (x) => avecVirgule(Math.round(net(x * 100) * 10) / 10, 0, 1),
  /** Un rapport en pour cent entier : « 50 ». */
  pourcent: (x) => entier(x * 100),
  /** Un taux en fraction, au millième : « 0,15 », « 0,053 ». */
  decimal: (x) => avecVirgule(x, 2, 3),
  /** La partie entière, en toutes lettres : « six ». */
  mots: (x) => enMots(Math.floor(net(x)), false),
  /** La même, au féminin : « une fois ». */
  mots_f: (x) => enMots(Math.floor(net(x)), true),
  /** Un écart de taux en points : « cinq points », « 1,8 point ». */
  points,
  Points: (x) => capitaliser(points(x)),
};

// ---------------------------------------------------------------------------
// Le rendu
// ---------------------------------------------------------------------------

const JETON = /\{\{([^{}]+)\}\}/g;

/** Le texte, ses jetons rendus pour ce scénario (déjà mis à la durée du tour). */
export function rendreTexte(texte: string, scenario: EngineScenarioConfig): string {
  if (!texte.includes("{{")) return texte;
  const periodicite = periodicityFromRoundDays(scenario.roundDays);
  return texte.replace(JETON, (_, brut: string) => {
    const contenu = brut.trim();
    const deuxPoints = contenu.indexOf(":");
    const format = deuxPoints > 0 ? contenu.slice(0, deuxPoints).trim() : "";
    if (format === "accord") {
      // {{accord: expression | singulier | pluriel}} : le verbe suit le nombre.
      const [expression, singulier, pluriel] = contenu.slice(deuxPoints + 1).split("|").map((p) => p.trim());
      if (!expression || singulier === undefined || pluriel === undefined) {
        throw new Error(`Situation : accord mal écrit {{${brut}}}`);
      }
      const v = Math.round(net(evaluer(expression, scenario) * 100) * 10) / 10;
      return Math.abs(v) < 2 ? singulier : pluriel;
    }
    if (format && FORMATS[format]) return FORMATS[format]!(evaluer(contenu.slice(deuxPoints + 1).trim(), scenario));
    const mot = motDeDuree(contenu, periodicite);
    if (mot === undefined) throw new Error(`Situation : jeton inconnu {{${brut}}}`);
    return mot;
  });
}

/** Les jetons d'un texte brut. */
export const jetonsDe = (texte: string): string[] => [...texte.matchAll(JETON)].map((m) => m[1]!.trim());

/** Tous les champs textuels d'une situation, rendus : ceux que l'élève ou l'enseignant lit. */
export function rendreSituation(def: SituationDef, scenario: EngineScenarioConfig): SituationDef {
  const r = (t: string) => rendreTexte(t, scenario);
  return {
    ...def,
    title: r(def.title),
    narrative: r(def.narrative),
    problem: r(def.problem),
    diagnosticOptions: def.diagnosticOptions.map((o) => ({ ...o, label: r(o.label) })),
    quiz: def.quiz.map((q) => ({
      ...q,
      prompt: r(q.prompt),
      explain: r(q.explain),
      options: q.options.map((o) => ({
        ...o,
        label: r(o.label),
        ...(o.aide !== undefined ? { aide: r(o.aide) } : {}),
      })),
    })),
    hints: def.hints.map((h) => ({ ...h, text: r(h.text) })),
    decisionLevers: def.decisionLevers.map((l) => ({ ...l, hint: r(l.hint) })),
  };
}

/** Tous les textes d'une situation, à plat : de quoi chercher un jeton ou un mot oublié. */
export function textesDe(def: SituationDef): string[] {
  return [
    def.title,
    def.narrative,
    def.problem,
    ...def.diagnosticOptions.map((o) => o.label),
    ...def.quiz.flatMap((q) => [q.prompt, q.explain, ...q.options.flatMap((o) => [o.label, o.aide ?? ""])]),
    ...def.hints.map((h) => h.text),
    ...def.decisionLevers.map((l) => l.hint),
  ];
}

// ---------------------------------------------------------------------------
// Le registre au trimestre, et la partie à sa durée
// ---------------------------------------------------------------------------

interface Rendus {
  source: SituationDef;
  parDuree: Record<Periodicity, SituationDef>;
}

/** Le rendu au trimestre que porte le registre → sa source et ses rendus à chaque durée. */
const RENDUS = new WeakMap<SituationDef, Rendus>();

/**
 * Les situations d'un scénario, rendues au trimestre pour le registre. Les trois
 * durées sont rendues dès le chargement : un jeton mal écrit lève à l'import, et
 * non au milieu d'une partie au mois. Une situation sans jeton est rendue telle
 * quelle, même objet.
 */
export function situationsAuTrimestre(sources: SituationDef[], scenario: EngineScenarioConfig): SituationDef[] {
  const auMois = applyPeriodicity(scenario, "month");
  const aLAnnee = applyPeriodicity(scenario, "year");
  return sources.map((source) => {
    if (!textesDe(source).some((t) => t.includes("{{"))) return source;
    const trimestre = rendreSituation(source, applyPeriodicity(scenario, "quarter"));
    RENDUS.set(trimestre, {
      source,
      parDuree: {
        quarter: trimestre,
        month: rendreSituation(source, auMois),
        year: rendreSituation(source, aLAnnee),
      },
    });
    return trimestre;
  });
}

/** La durée d'un tour lue dans un instantané de partie (90 jours par défaut). */
export function dureeDuTourDe(instantane: unknown): number {
  const jours = (instantane as { roundDays?: unknown } | null | undefined)?.roundDays;
  return typeof jours === "number" && jours > 0 ? jours : PERIODICITY_DAYS.quarter;
}

/**
 * La situation telle que SA partie la montre. `def` est celle du registre (ou
 * d'un scénario d'enseignant, rendue telle quelle : son texte est déjà écrit).
 * Au trimestre, c'est le même objet : rien ne change, au bit près.
 */
export function situationDeLaPartie(def: SituationDef, roundDays: number): SituationDef {
  const rendus = RENDUS.get(def);
  if (!rendus) return def;
  return rendus.parDuree[periodicityFromRoundDays(roundDays)];
}

/** La source à jetons d'une situation du registre ; la situation elle-même si elle n'en a pas. */
export function sourceDe(def: SituationDef): SituationDef {
  return RENDUS.get(def)?.source ?? def;
}
