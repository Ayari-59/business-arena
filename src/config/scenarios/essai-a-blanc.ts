import { botDecisions, type BotProfile } from "../../engine/bots";
import { runGame, soldUnits } from "../../engine/simulation/runGame";
import type { CompanyRoundResult, CompanyState } from "../../engine/types";
import type { ScenarioDefinition } from "./registry";

/**
 * L'ESSAI À BLANC — rejouer un scénario avant de le lâcher en classe.
 *
 * Un scénario syntaxiquement valide peut être injouable : le transport avait
 * été publié perdant pour toutes les stratégies, sans qu'aucun bilan ne le
 * signale (voir `calibrage.test.ts`, la même logique). Un enseignant qui règle
 * les coûts d'un scénario n'a aucun moyen de le voir à l'œil.
 *
 * Cette fonction joue les cinq stratégies types sur la config du scénario et
 * rend un verdict de jouabilité. Elle NE bloque PAS la publication (choix
 * « brouillon libre ») : c'est un filet, affiché à l'enseignant, pas une garde.
 * Pur moteur, déterministe (graine fixe) : mêmes entrées, même verdict.
 */

const STRATEGIES: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];
const GRAINE = 20260101;

const STRATEGIE_LABEL: Record<BotProfile, string> = {
  passive: "prudente",
  price_aggressive: "prix bas",
  premium: "haut de gamme",
  balanced: "équilibrée",
  growth: "croissance",
};

export interface EssaiStrategieResultat {
  strategie: BotProfile;
  label: string;
  /** Résultat net cumulé sur la partie (€). */
  cumul: number;
  /** Résultat net moyen par tour (€). */
  parTour: number;
  /** Capitaux propres en fin de partie (€). */
  capitauxPropres: number;
  /** L'entreprise a-t-elle perdu plus qu'elle ne valait au départ ? */
  ruineuse: boolean;
}

export interface EssaiVerdict {
  /** « jouable » | « à surveiller » | « injouable ». */
  verdict: "jouable" | "a-surveiller" | "injouable";
  /** Au moins une stratégie finit dans le vert. */
  gagnable: boolean;
  /** Écart de résultat/tour entre la meilleure et la pire stratégie (€). */
  ecart: number;
  meilleure: EssaiStrategieResultat;
  detail: EssaiStrategieResultat[];
  /** Capitaux propres de départ, repère de la ruine. */
  capitauxDepart: number;
  /** Explications lisibles du verdict. */
  remarques: string[];
}

function jouerStrategie(
  definition: ScenarioDefinition,
  strategie: BotProfile,
  capitauxDepart: number,
): EssaiStrategieResultat {
  const companies: CompanyState[] = [
    definition.company("player", definition.playerTeamName, "bot", strategie),
    ...definition.bots
      .slice(0, 2)
      .map((b) => definition.company(b.id, b.name, "bot", b.profile)),
  ];
  const run = runGame({
    scenario: definition.scenario,
    initialCompanies: companies,
    providers: Object.fromEntries(
      companies.map((c) => [
        c.id,
        (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
          botDecisions(c.botProfile as BotProfile, {
            scenario: definition.scenario,
            state: ctx.state,
            roundIndex: ctx.roundIndex,
            lastSoldUnits: ctx.lastResult ? soldUnits(ctx.lastResult) : undefined,
          }),
      ]),
    ),
    seed: GRAINE,
  });
  const resultats = run.rounds.map((r) => r.results["player"]!);
  const dernier = run.rounds[run.rounds.length - 1]!.companies.find((c) => c.id === "player")!;
  const cumul = resultats.reduce((t, r) => t + r.incomeStatement.netIncome, 0);
  const capitauxPropres = dernier.finance.equity;
  return {
    strategie,
    label: STRATEGIE_LABEL[strategie],
    cumul,
    parTour: cumul / resultats.length,
    capitauxPropres,
    ruineuse: capitauxPropres < -capitauxDepart,
  };
}

export function essaiABlanc(definition: ScenarioDefinition): EssaiVerdict {
  const capitauxDepart = definition.company("mesure", "mesure", "bot").finance.equity;
  const detail = STRATEGIES.map((s) => jouerStrategie(definition, s, capitauxDepart));
  const meilleure = detail.reduce((a, b) => (b.cumul > a.cumul ? b : a));
  const parTour = detail.map((d) => d.parTour);
  const ecart = Math.max(...parTour) - Math.min(...parTour);
  const gagnable = detail.some((d) => d.cumul > 0);
  const ruineuses = detail.filter((d) => d.ruineuse);

  const remarques: string[] = [];
  if (!gagnable) {
    remarques.push("Aucune stratégie type ne finit dans le vert : le scénario est perdant pour tous.");
  }
  for (const r of ruineuses) {
    remarques.push(
      `La stratégie ${r.label} perd plus que l'entreprise ne valait (${Math.round(r.capitauxPropres / 1000)} k€ pour ${Math.round(capitauxDepart / 1000)} k€ de départ).`,
    );
  }
  if (gagnable && ruineuses.length === 0) {
    if (ecart < 5000) {
      remarques.push("Toutes les stratégies se valent : le scénario n'oppose pas assez les choix.");
    } else if (ecart > 250000) {
      remarques.push("L'écart entre stratégies est énorme : une erreur ne se rattrape plus.");
    } else {
      remarques.push("Il existe une façon de gagner, et se tromper coûte sans tout emporter.");
    }
  }

  const verdict: EssaiVerdict["verdict"] =
    !gagnable || ruineuses.length > 0
      ? "injouable"
      : ecart < 5000 || ecart > 250000
        ? "a-surveiller"
        : "jouable";

  return { verdict, gagnable, ecart, meilleure, detail, capitauxDepart, remarques };
}
