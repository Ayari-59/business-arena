import { formatEuro, formatUnits } from "@/lib/format";
import type { ArticleDeLaGazette, ElementDeLArticle, SensDuSujet, SujetDeLaGazette } from "./types";

/**
 * CE QUE LA PRESSE ANNONÇAIT : UNE À TROIS LIGNES AU BILAN.
 *
 * Chaque ligne relie un article paru à ce qui s'est passé (le journal ne
 * mentait pas, ou la prévision a été démentie), puis à ce que l'entreprise a
 * décidé ce tour-là : son prix, son volume, son emprunt. Elle constate, elle ne
 * juge pas : pas de « vous auriez dû ». Le joueur fait le lien lui-même.
 *
 * Priorité : les prévisions démenties d'abord (c'est la leçon des niveaux
 * hauts), puis les vraies nouvelles, puis le calme ; une seule ligne par
 * nouvelle (même sujet, même sens). Un article d'enseignant
 * n'a pas de ligne : on ne sait pas ce qu'il annonçait.
 */

/** Ce que l'entreprise a décidé à un tour, pour la phrase de réaction. */
export interface DecisionsPourLaPresse {
  tour: number;
  price?: number | null;
  productionPlan?: number | null;
  newLoan?: number | null;
}

interface Formule {
  /** Ce que la presse annonçait, en groupe nominal. */
  quoi: string;
  /** Il est arrivé. */
  arrive: string;
  /** Il n'est pas venu. */
  dementi: string;
}

const FORMULES: Record<`${SujetDeLaGazette}:${SensDuSujet}`, Formule | undefined> = {
  "demande:hausse": { quoi: "une hausse de la demande", arrive: "elle a eu lieu", dementi: "elle n'est pas venue" },
  "demande:baisse": { quoi: "un repli de la demande", arrive: "il a eu lieu", dementi: "il n'est pas venu" },
  "demande:stable": undefined,
  "concurrence:baisse": {
    quoi: "un durcissement de la concurrence",
    arrive: "il a eu lieu",
    dementi: "il n'est pas venu",
  },
  "concurrence:hausse": { quoi: "le départ d'un concurrent", arrive: "il a eu lieu", dementi: "il n'a pas eu lieu" },
  "concurrence:stable": undefined,
  "couts:hausse": { quoi: "une hausse des coûts d'achat", arrive: "elle a eu lieu", dementi: "elle n'est pas venue" },
  "couts:baisse": { quoi: "une baisse des coûts d'achat", arrive: "elle a eu lieu", dementi: "elle n'est pas venue" },
  "couts:stable": undefined,
  "taux:hausse": { quoi: "une hausse des taux d'intérêt", arrive: "elle a eu lieu", dementi: "elle n'est pas venue" },
  "taux:baisse": { quoi: "une baisse des taux d'intérêt", arrive: "elle a eu lieu", dementi: "elle n'est pas venue" },
  "taux:stable": undefined,
  "activite:baisse": {
    quoi: "une baisse des capacités disponibles",
    arrive: "elle a eu lieu",
    dementi: "elle n'est pas venue",
  },
  "activite:hausse": {
    quoi: "une hausse des capacités disponibles",
    arrive: "elle a eu lieu",
    dementi: "elle n'est pas venue",
  },
  "activite:stable": undefined,
  "calme:hausse": { quoi: "une saison porteuse", arrive: "elle l'a été", dementi: "elle ne l'a pas été" },
  "calme:baisse": { quoi: "une saison creuse", arrive: "elle l'a été", dementi: "elle ne l'a pas été" },
  "calme:stable": { quoi: "un marché sans secousse", arrive: "il l'a été", dementi: "il ne l'a pas été" },
};

function variation(avant: number, apres: number): number {
  return avant > 0 ? apres / avant - 1 : 0;
}

/** La phrase de réaction : ce que l'entreprise a décidé ce tour-là, sans jugement. */
function reaction(
  sujet: SujetDeLaGazette,
  maintenant: DecisionsPourLaPresse | undefined,
  avant: DecisionsPourLaPresse | undefined,
  unites: string,
): string | null {
  if (!maintenant) return null;
  if (sujet === "couts") {
    const p = maintenant.price;
    if (typeof p !== "number" || p <= 0) return null;
    const q = avant?.price;
    if (typeof q !== "number" || q <= 0) return `Vous aviez fixé votre prix à ${formatEuro(p)}.`;
    const v = variation(q, p);
    const pts = Math.round(Math.abs(v) * 100);
    if (pts === 0) return "Vous aviez laissé vos prix inchangés.";
    return `Vous aviez ${v > 0 ? "relevé" : "baissé"} vos prix de ${pts} %.`;
  }
  if (sujet === "taux") {
    const e = maintenant.newLoan ?? 0;
    return e > 0 ? `Vous aviez emprunté ${formatEuro(e)} ce tour-là.` : "Vous n'aviez pas emprunté ce tour-là.";
  }
  const v = maintenant.productionPlan;
  if (typeof v !== "number" || v <= 0) return null;
  const w = avant?.productionPlan;
  if (typeof w !== "number" || w <= 0) return `Vous aviez prévu ${formatUnits(v)} ${unites}.`;
  if (Math.round(v) === Math.round(w)) return `Vous aviez gardé votre volume prévu à ${formatUnits(v)} ${unites}.`;
  return `Vous aviez ${v > w ? "porté" : "réduit"} votre volume prévu de ${formatUnits(w)} à ${formatUnits(v)} ${unites}.`;
}

/** L'élément d'un article qui mérite sa ligne : le démenti s'il y en a un, sinon la tête. */
function elementRetenu(a: ArticleDeLaGazette): ElementDeLArticle | null {
  return a.sujets.find((s) => s.dementi) ?? a.sujets[0] ?? null;
}

/** Les démentis, puis ce qui est tombé, puis ce qui se poursuivait, puis le calme. */
const rang = (x: ElementDeLArticle) => (x.dementi ? 0 : x.sujet === "calme" ? 3 : x.nouveau ? 1 : 2);

/**
 * Les lignes du bilan. `libelle(tour)` dit le tour comme la partie le nomme ;
 * `unites`, ce que l'entreprise vend (« enceintes »).
 */
export function lignesDeLaPresse({
  articles,
  decisions,
  libelle,
  unites,
  nomDuJournal,
  maximum = 3,
}: {
  articles: readonly ArticleDeLaGazette[];
  decisions: readonly DecisionsPourLaPresse[];
  libelle: (tour: number) => string;
  unites: string;
  nomDuJournal: string;
  maximum?: number;
}): string[] {
  const candidats = articles
    .filter((a) => a.auteur === "gazette")
    .map((a) => ({ a, x: elementRetenu(a) }))
    .filter((c): c is { a: ArticleDeLaGazette; x: ElementDeLArticle } => c.x !== null && !!FORMULES[`${c.x.sujet}:${c.x.sens}`])
    .sort((p, q) => rang(p.x) - rang(q.x) || p.a.tour - q.a.tour)
    // Une ligne par nouvelle : trois tours de suite de demande en hausse ne
    // font pas trois lignes, ils en font une (la première, celle qui annonçait).
    .filter((c, i, tous) => tous.findIndex((d) => d.x.sujet === c.x.sujet && d.x.sens === c.x.sens && d.x.dementi === c.x.dementi) === i)
    .slice(0, maximum)
    .sort((p, q) => p.a.tour - q.a.tour);
  const parTour = new Map(decisions.map((d) => [d.tour, d]));
  const court = nomDuJournal.replace(/ de l'Arène$/, "");
  return candidats.map(({ a, x }) => {
    const f = FORMULES[`${x.sujet}:${x.sens}`]!;
    const verbe = x.fiabilite === "prevision" ? "prévoyait" : "annonçait";
    const issue = x.dementi ? f.dementi : f.arrive;
    const quand = libelle(a.tour).toLowerCase();
    const r = reaction(x.sujet, parTour.get(a.tour), parTour.get(a.tour - 1), unites);
    return `${court} ${verbe} ${f.quoi} au ${quand}\u00a0: ${issue}.${r ? ` ${r}` : ""}`;
  });
}
