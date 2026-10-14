import type { EngineScenarioConfig, EventInstance, EventModifier } from "@/engine/types";
import { toGamme } from "@/engine/gamme";
import type { Sector } from "@/config/scenarios/registry";
import { PERIODICITY_LABELS, periodicityFromRoundDays } from "@/config/scenarios/periodicity";
import { courrierParCode } from "@/config/courriers/registre";
import {
  AMPLEURS,
  ANNONCES_DE_FAIT,
  ANNONCES_DE_PREVISION,
  CALMES,
  CAUSES_DE_FAIT,
  CAUSES_DE_PREVISION,
  CLIENTELES,
  COTES,
  LEXIQUES,
  MOTIFS,
  MOTIFS_D_INVESTISSEMENT,
  MOTIFS_PAR_DEFAUT,
  OBJETS,
  SAISONS_EN_FOND,
  SOURCE_DU_CREDIT,
  SUITES,
  TITRES,
  type CleDeGabarit,
  type LexiqueDuSecteur,
  type MotifDeLEvenement,
} from "./banque";
import { alea, ecritDesPrevisions, tourOuvertAuDementi } from "./incertitude";
import type {
  ArticleDeLaGazette,
  ElementDeLArticle,
  SensDuSujet,
  SujetDeLaGazette,
} from "./types";

/**
 * LE GÉNÉRATEUR D'ARTICLE (module pur, sans base ni horloge).
 *
 * Il reçoit ce que le moteur a DÉJÀ décidé pour le tour : les événements de
 * marché qui tombent (tirage seedé, calendrier du niveau, courrier de marché
 * distribué par l'enseignant) et ceux qui pèsent encore. Il en tire un titre,
 * un chapô de trois ou quatre lignes, une rubrique, et la liste de ce qu'il
 * affirme. Même entrée, même article : la clôture le recalcule à l'identique
 * pour l'archiver, et l'aperçu de l'enseignant voit ce que la classe lira.
 *
 * PAS DE FUITE : aucun chiffre du tirage. Aux niveaux 1 et 2, un ordre de
 * grandeur (« de l'ordre de 15 à 25 % »), toujours une fourchette de dix
 * points dont aucune borne n'est la valeur exacte ; plus haut, des mots
 * seulement (« une forte hausse »).
 */

export interface EntreeDeLaGazette {
  secteur: Sector;
  scenario: EngineScenarioConfig;
  tour: number;
  niveau: number;
  graine: number;
  /** Les événements de MARCHÉ qui tombent ce tour. */
  nouveaux: readonly EventInstance[];
  /** Les événements de MARCHÉ tombés avant, qui pèsent encore sur ce tour. */
  enCours: readonly EventInstance[];
  /**
   * L'emprunt est-il une décision du niveau joué ? Fermé (niveaux 1 à 3), le
   * journal parle encore des taux (le découvert les suit), mais aucun titre
   * n'invite à emprunter. Absent : ouvert (les parties d'avant la répartition).
   */
  financementOuvert?: boolean;
}

/**
 * LES TITRES QUI INVITENT À EMPRUNTER : ils ne paraissent pas là où l'emprunt
 * n'est pas une décision du niveau. « Le crédit devrait se renchérir » constate ;
 * « Emprunter devrait coûter moins cher » appelle un geste que l'élève n'a pas.
 */
export const INVITE_A_EMPRUNTER = /\bemprunt|\bfinancer\b/i;

/** Ce que le journal lit d'un événement : son sujet, son sens, son intensité. */
export interface LectureDeLEvenement {
  code: string;
  sujet: Exclude<SujetDeLaGazette, "calme">;
  sens: "hausse" | "baisse";
  /** |multiplicateur − 1| du modificateur principal. */
  intensite: number;
  /** La clientèle visée (code de segment), quand l'événement ne touche qu'elle. */
  segment: string | null;
  /** Combien de tours il pèse encore, celui-ci compris. */
  duree: number;
  nouveau: boolean;
  /** « macro » quand le courrier est de conjoncture : la rubrique en dépend. */
  nature: string | null;
}

/** Le modificateur qui dit l'événement : celui qui pèse le plus. */
function modificateurPrincipal(modifiers: readonly EventModifier[]): EventModifier | null {
  let meilleur: EventModifier | null = null;
  let poids = 0;
  for (const m of modifiers) {
    if (m.op !== "mul" || m.value <= 0) continue;
    const lu =
      m.target === "demand" ||
      m.target.startsWith("demand:") ||
      m.target === "material_cost" ||
      m.target === "interest_rate" ||
      m.target === "availability";
    if (!lu) continue;
    const p = Math.abs(Math.log(m.value));
    if (p > poids) {
      poids = p;
      meilleur = m;
    }
  }
  return meilleur;
}

/** Un événement de marché, lu par le journal. Null : rien qu'un journal puisse en dire. */
export function lireLEvenement(
  evenement: Pick<EventInstance, "code" | "modifiers" | "roundsLeft">,
  nouveau: boolean,
): LectureDeLEvenement | null {
  const m = modificateurPrincipal(evenement.modifiers);
  if (!m || Math.abs(m.value - 1) < 0.005) return null;
  const sens = m.value > 1 ? "hausse" : "baisse";
  const nature = courrierParCode.get(evenement.code)?.nature ?? null;
  const surLaDemande = m.target === "demand" || m.target.startsWith("demand:");
  const sujet: LectureDeLEvenement["sujet"] = surLaDemande
    ? nature === "competition"
      ? "concurrence"
      : "demande"
    : m.target === "material_cost"
      ? "couts"
      : m.target === "interest_rate"
        ? "taux"
        : "activite";
  return {
    code: evenement.code,
    sujet,
    sens,
    intensite: Math.abs(m.value - 1),
    segment: m.target.startsWith("demand:") ? m.target.slice("demand:".length) : null,
    duree: Math.max(1, evenement.roundsLeft),
    nouveau,
    nature,
  };
}

/** Le domaine d'un sujet : la demande et la concurrence parlent de la même chose. */
const domaine = (s: SujetDeLaGazette) => (s === "concurrence" ? "demande" : s);

/**
 * LA TENDANCE DE FOND : la demande de base du tour (taille × croissance ×
 * saison, sans événement) comparée à celle du tour précédent ; au premier
 * tour, à une saison normale. C'est ce que le scénario rend public par ses
 * notes de saison : le journal ne révèle rien en le disant.
 */
export function tendanceDeSaison(scenario: EngineScenarioConfig, tour: number): SensDuSujet {
  const demandeDeBase = (t: number, saison: boolean) => {
    let total = 0;
    for (const p of toGamme(scenario)) {
      for (const s of p.market.segments) {
        const coef = saison ? ((s.seasonality ?? p.market.seasonality ?? scenario.market.seasonality)[t - 1] ?? 1) : 1;
        total += s.size * Math.pow(1 + s.growth, t - 1) * coef;
      }
    }
    return total;
  };
  const maintenant = demandeDeBase(tour, true);
  const avant = tour >= 2 ? demandeDeBase(tour - 1, true) : demandeDeBase(1, false);
  if (avant <= 0) return "stable";
  const r = maintenant / avant;
  return r >= 1.04 ? "hausse" : r <= 0.96 ? "baisse" : "stable";
}

/** Le motif d'un événement : la banque, l'histoire d'investissement, ou le repli. */
export function motifDe(code: string, sujet: Exclude<SujetDeLaGazette, "calme">): MotifDeLEvenement {
  const direct = MOTIFS[code];
  if (direct) return direct;
  const etape = code.match(/_inv_(\w+)$/)?.[1];
  if (etape && MOTIFS_D_INVESTISSEMENT[etape]) return MOTIFS_D_INVESTISSEMENT[etape]!;
  return { motif: MOTIFS_PAR_DEFAUT[sujet] };
}

// ── Écriture ────────────────────────────────────────────────────────────────

/** « de » devant un groupe nominal, contracté comme on l'écrit. */
export function deDevant(groupe: string): string {
  if (groupe.startsWith("le ")) return `du ${groupe.slice(3)}`;
  if (groupe.startsWith("les ")) return `des ${groupe.slice(4)}`;
  if (groupe.startsWith("des ")) return `de ${groupe.slice(4)}`;
  if (groupe.startsWith("un ")) return `d'un ${groupe.slice(3)}`;
  if (groupe.startsWith("une ")) return `d'une ${groupe.slice(4)}`;
  if (/^[aeiouyéèêàâîôûh]/i.test(groupe)) return `d'${groupe}`;
  return `de ${groupe}`;
}

/**
 * LA TYPOGRAPHIE FRANÇAISE : une espace insécable avant les deux-points, le
 * point-virgule et les points d'exclamation et d'interrogation, pour qu'un
 * titre ne commence jamais une ligne par « : ».
 */
export function typographie(s: string): string {
  return s.replace(/ ([:;!?])/g, "\u00a0$1");
}

/** La première lettre en capitale, « l'électronique » compris. */
export function capitaliser(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
}

/** Remplit un gabarit à trous ; une clé en capitale ({Source}) donne la valeur capitalisée. */
export function remplir(gabarit: string, valeurs: Record<string, string>): string {
  return gabarit.replace(/\{(\w+)\}/g, (_, cle: string) => {
    const brute = valeurs[cle];
    if (brute !== undefined) return brute;
    const minuscule = cle.charAt(0).toLowerCase() + cle.slice(1);
    const v = valeurs[minuscule];
    if (v !== undefined && cle !== minuscule) return capitaliser(v);
    throw new Error(`Gabarit de la Gazette : « ${cle} » sans valeur`);
  });
}

/** Les valeurs du lexique, prêtes pour un gabarit. */
function valeursDuLexique(lex: LexiqueDuSecteur): Record<string, string> {
  return {
    profession: lex.profession,
    domaine: lex.domaine,
    marche: lex.marche,
    clients: lex.clients,
    intrants: lex.intrants,
    Intrants: lex.intrantsTitre,
    prixDesIntrants: lex.prixDesIntrants,
    outil: lex.outil,
  };
}

const NOMBRES = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit"];

/** Les mots du temps de la partie : un trimestre, un mois, une année. */
function motsDuTemps(roundDays: number) {
  const p = periodicityFromRoundDays(roundDays);
  const feminin = p === "year";
  const singulier = PERIODICITY_LABELS[p].singular.toLowerCase();
  const pluriel = PERIODICITY_LABELS[p].plural;
  const n = (k: number) => NOMBRES[k] ?? String(k);
  return {
    ce: p === "month" ? "ce mois-ci" : feminin ? `cette ${singulier}` : `ce ${singulier}`,
    prochains: (k: number) => `pour les ${n(k)} ${feminin ? "prochaines" : "prochains"} ${pluriel}`,
    encore: (k: number) => (k <= 1 ? `encore ${p === "month" ? "ce mois-ci" : feminin ? `cette ${singulier}` : `ce ${singulier}`}` : `encore ${n(k)} ${pluriel}`),
  };
}

/** L'ampleur en mots, de la plus faible à la plus forte. Les taux bougent plus fort, en relatif. */
function rangDAmpleur(l: LectureDeLEvenement): 0 | 1 | 2 | 3 {
  const x = l.sujet === "taux" ? l.intensite / 2 : l.intensite;
  return x < 0.06 ? 0 : x < 0.13 ? 1 : x < 0.22 ? 2 : 3;
}

/**
 * L'ORDRE DE GRANDEUR, aux seuls niveaux où la presse est fiable, et pour la
 * demande et les coûts : une fourchette de dix points, bornée sur des
 * multiples de cinq, dont aucune borne n'est la valeur exacte.
 */
export function fourchette(intensite: number): string {
  const pct = Math.round(intensite * 100);
  if (pct < 5) return "";
  const centre = Math.round(pct / 5) * 5;
  const bas = Math.max(1, centre - 5);
  const haut = centre + 5;
  return `, de l'ordre de ${bas} à ${haut} %`;
}

interface Contexte {
  e: EntreeDeLaGazette;
  lex: LexiqueDuSecteur;
  temps: ReturnType<typeof motsDuTemps>;
  /** Un tirage stable par usage, pour varier les tournures. */
  choisir: <T>(liste: readonly T[], sel: number) => T;
}

function objetDe(l: LectureDeLEvenement, ctx: Contexte): string {
  const clientele = l.segment
    ? ` ${CLIENTELES[`${ctx.e.secteur}:${l.segment}`] ?? "d'une partie de la clientèle"}`
    : "";
  return remplir(OBJETS[l.sujet], { clientele, prixDesIntrants: ctx.lex.prixDesIntrants });
}

/** La phrase d'annonce d'un événement qui tombe : fait ou prévision. */
function annonce(
  l: LectureDeLEvenement,
  ctx: Contexte,
  prevision: boolean,
  avecFourchette: boolean,
  gabarit?: string,
): string {
  const ampleur = AMPLEURS[l.sens][rangDAmpleur(l)];
  // Une prévision ne promet pas de durée : elle dit un mouvement, pas un calendrier.
  const duree = prevision ? "" : ` ${l.duree >= 2 ? ctx.temps.prochains(l.duree) : ctx.temps.ce}`;
  const fourch =
    !prevision && avecFourchette && (l.sujet === "demande" || l.sujet === "couts" || l.sujet === "concurrence")
      ? fourchette(l.intensite)
      : "";
  // La source suit le sujet : le crédit, les banques ; les coûts et l'outil de
  // travail, la fédération du métier ; la demande, l'une des voix du secteur.
  const source =
    l.sujet === "taux"
      ? SOURCE_DU_CREDIT
      : l.sujet === "couts" || l.sujet === "activite"
        ? ctx.lex.sources[0]!
        : ctx.choisir(ctx.lex.sources, 11);
  const g = gabarit ?? ctx.choisir(prevision ? ANNONCES_DE_PREVISION : ANNONCES_DE_FAIT, 13);
  return remplir(g, {
    source,
    ampleur,
    objet: objetDe(l, ctx),
    fourchette: fourch,
    duree,
  });
}

function suite(l: LectureDeLEvenement, ctx: Contexte): string {
  const clientele = l.segment
    ? ` ${CLIENTELES[`${ctx.e.secteur}:${l.segment}`] ?? "d'une partie de la clientèle"}`
    : "";
  return remplir(SUITES[`${l.sujet}:${l.sens}`], {
    clientele,
    prixDesIntrants: ctx.lex.prixDesIntrants,
    duree: ` ${ctx.temps.encore(l.duree)}`,
  });
}

/** Le paragraphe de tête, pour la nouvelle principale. */
function paragrapheDeTete(l: LectureDeLEvenement, ctx: Contexte, prevision: boolean): string {
  const { motif } = motifDe(l.code, l.sujet);
  if (!l.nouveau) {
    return `${capitaliser(suite(l, ctx))}. Toujours en cause : ${motif}.`;
  }
  if (prevision) {
    const a = annonce(l, ctx, true, false);
    const c = remplir(ctx.choisir(CAUSES_DE_PREVISION, 17), { deMotif: deDevant(motif) });
    return `${a} ${c}`;
  }
  const c = remplir(ctx.choisir(CAUSES_DE_FAIT, 19), { motif });
  const a = annonce(l, ctx, false, ctx.e.niveau <= 2);
  return `${c} ${a}`;
}

/** Une seconde nouvelle, en une phrase. */
function phraseSeconde(l: LectureDeLEvenement, ctx: Contexte, prevision: boolean): string {
  const cote = COTES[l.sujet];
  if (!l.nouveau) return `${cote}, ${suite(l, ctx)}.`;
  const corps = prevision
    ? annonce(l, ctx, true, false, "les analystes s'attendent à {ampleur} {objet}{duree}.")
    : annonce(l, ctx, false, false, "{source} annonce {ampleur} {objet}{duree}.");
  return `${cote}, ${corps}`;
}

/** La rubrique de la nouvelle principale. */
function rubriqueDe(l: LectureDeLEvenement | null, ctx: Contexte): string {
  if (!l) return "Conjoncture";
  const propre = motifDe(l.code, l.sujet).rubrique;
  if (propre) return propre;
  switch (l.sujet) {
    case "demande":
      return l.nature === "macro" ? "Conjoncture" : "Consommation";
    case "concurrence":
      return "Concurrence";
    case "couts":
      return ctx.lex.rubriqueDesCouts;
    case "taux":
      return "Financement";
    case "activite":
      return "Activité";
  }
}

/** Un nombre stable tiré d'une chaîne : la clé d'un gabarit décale son départ. */
function empreinte(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * LE TITRE : la clé (sujet, sens) donne la liste ; la graine décale le point de
 * départ, le tour avance d'un cran. Deux tours de la même partie sur la même
 * clé ne lisent donc jamais le même titre tant que la liste est au moins
 * aussi longue que la partie.
 */
export function titreDe(
  cle: CleDeGabarit,
  entree: Pick<EntreeDeLaGazette, "graine" | "tour" | "secteur" | "financementOuvert">,
): string {
  const liste =
    entree.financementOuvert === false ? TITRES[cle]?.filter((t) => !INVITE_A_EMPRUNTER.test(t)) : TITRES[cle];
  if (!liste || liste.length === 0) throw new Error(`Gazette : aucun titre pour ${cle}`);
  const depart = Math.floor(alea(entree.graine, 0, empreinte(cle)) * liste.length);
  const g = liste[(depart + entree.tour) % liste.length]!;
  return typographie(capitaliser(remplir(g, valeursDuLexique(LEXIQUES[entree.secteur]))));
}

/** Choisit, parmi les événements que le marché peut produire, la prévision qui sera démentie. */
function choisirLeDementi(
  e: EntreeDeLaGazette,
  lectures: readonly LectureDeLEvenement[],
  tendance: SensDuSujet,
): LectureDeLEvenement | null {
  if (!ecritDesPrevisions(e.niveau) || !tourOuvertAuDementi(e.graine, e.niveau, e.tour)) return null;
  const occupes = new Set(lectures.map((l) => domaine(l.sujet)));
  const presents = new Set([...e.nouveaux, ...e.enCours].map((x) => x.code));
  const candidats: LectureDeLEvenement[] = [];
  for (const def of e.scenario.events) {
    if (def.scope !== "market" || def.probability <= 0) continue;
    if ((def.minRound ?? 1) > e.tour || presents.has(def.code)) continue;
    const l = lireLEvenement({ code: def.code, modifiers: def.modifiers, roundsLeft: def.duration }, true);
    if (!l || occupes.has(domaine(l.sujet))) continue;
    // Une prévision de demande démentie ne va jamais contre la saison.
    if (domaine(l.sujet) === "demande" && tendance !== "stable" && l.sens !== tendance) continue;
    candidats.push(l);
  }
  if (candidats.length === 0) return null;
  return candidats[Math.floor(alea(e.graine, e.tour, 0x5e) * candidats.length)]!;
}

/** L'ARTICLE DU TOUR. */
export function articleDeLaGazette(e: EntreeDeLaGazette): ArticleDeLaGazette {
  const lex = LEXIQUES[e.secteur];
  const ctx: Contexte = {
    e,
    lex,
    temps: motsDuTemps(e.scenario.roundDays),
    choisir: (liste, sel) => liste[Math.floor(alea(e.graine, e.tour, sel) * liste.length)]!,
  };
  const prevision = ecritDesPrevisions(e.niveau);
  const tendance = tendanceDeSaison(e.scenario, e.tour);

  // Ce qui tombe d'abord, du plus fort au plus faible ; puis ce qui continue.
  const lus = (liste: readonly EventInstance[], nouveau: boolean) =>
    liste
      .filter((x) => x.scope === "market")
      .map((x) => lireLEvenement(x, nouveau))
      .filter((l): l is LectureDeLEvenement => l !== null)
      .sort((a, b) => b.intensite - a.intensite || a.code.localeCompare(b.code));
  const lectures = [...lus(e.nouveaux, true), ...lus(e.enCours, false)];

  const tete = lectures[0] ?? null;
  let seconde = tete ? (lectures.find((l) => l !== tete && l.sujet !== tete.sujet) ?? null) : null;
  const dementi = choisirLeDementi(e, lectures, tendance);

  const elements: ElementDeLArticle[] = [];
  const element = (l: LectureDeLEvenement, estDementi: boolean): ElementDeLArticle => ({
    sujet: l.sujet,
    sens: l.sens,
    fiabilite: estDementi || (prevision && l.nouveau) ? "prevision" : "fait",
    dementi: estDementi,
    code: l.code,
    nouveau: l.nouveau,
  });

  const phrases: string[] = [];
  let cle: CleDeGabarit;
  let rubrique: string;
  let dementiEcrit = false;

  if (tete) {
    cle = `${tete.sujet}:${tete.sens}`;
    rubrique = rubriqueDe(tete, ctx);
    phrases.push(paragrapheDeTete(tete, ctx, prevision && tete.nouveau));
    elements.push(element(tete, false));
    if (!seconde && dementi) {
      seconde = dementi;
      dementiEcrit = true;
    }
    if (seconde) {
      phrases.push(phraseSeconde(seconde, ctx, dementiEcrit || (prevision && seconde.nouveau)));
      elements.push(element(seconde, dementiEcrit));
    }
  } else if (dementi) {
    cle = `${dementi.sujet}:${dementi.sens}`;
    rubrique = rubriqueDe(dementi, ctx);
    phrases.push(paragrapheDeTete(dementi, ctx, true));
    elements.push(element(dementi, true));
    dementiEcrit = true;
  } else {
    cle = `calme:${tendance}`;
    rubrique = "Conjoncture";
    phrases.push(
      remplir(ctx.choisir(CALMES[tendance], 23), {
        ...valeursDuLexique(lex),
        periode: ctx.temps.ce,
      }),
    );
    elements.push({ sujet: "calme", sens: tendance, fiabilite: "fait", dementi: false, code: null, nouveau: true });
  }

  // LA SAISON EN FOND : seulement quand rien ne touche la demande ce tour-là,
  // ni dans l'article ni hors de lui (elle ne contredit alors rien).
  const demandeTouchee =
    lectures.some((l) => domaine(l.sujet) === "demande") ||
    (dementiEcrit && dementi !== null && domaine(dementi.sujet) === "demande");
  if (elements[0]!.sujet !== "calme" && !demandeTouchee) {
    phrases.push(SAISONS_EN_FOND[tendance]);
  }

  return {
    tour: e.tour,
    rubrique,
    titre: titreDe(cle, e),
    chapo: typographie(phrases.join(" ")),
    fiabilite: elements.some((x) => x.fiabilite === "prevision") ? "prevision" : "fait",
    sujets: elements,
    auteur: "gazette",
  };
}
