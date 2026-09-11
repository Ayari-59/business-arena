import { cockpitSpec, type ClasseurSpec, type HistoriqueEquipe } from "@/config/ateliers/cockpit";
import { scenarioByCode } from "@/config/scenarios/registry";
import { toGamme } from "@/engine/gamme";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import type { GameView } from "@/services/game-view.service";
import { db } from "@/db";
import { games, teams } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Le cockpit d'UNE équipe en cours de partie : le même classeur que celui de
 * l'atelier, mais sur le scénario réellement joué (réglages de l'enseignant
 * compris), les tours qui restent, l'état d'où l'équipe repart, et une
 * feuille d'historique de ce que ses tours ont donné, référence par référence.
 */

/** Le moteur calcule en flottants ; un classeur d'élève montre des unités et des euros entiers. */
const entier = (x: number) => Math.round(x);

/** L'historique d'une équipe, lu dans sa vue de partie. */
export function historiqueEquipe(view: GameView, codeProduitMono: string): HistoriqueEquipe {
  const tours = view.periods.map((p) => {
    const r = p.result;
    const produits = r.products
      ? Object.entries(r.products).map(([code, x]) => ({
          code,
          prix: x.price,
          misEnRayon: entier(x.produced),
          vendu: entier(x.sold),
          manque: entier(x.lost),
          stockFin: entier(x.stock.quantity),
          chiffreAffaires: entier(x.revenue),
          ...(x.rd ? { rdEngage: entier(x.rd.budget) } : {}),
        }))
      : [
          {
            code: codeProduitMono,
            prix: p.decisions?.price ?? 0,
            misEnRayon: entier(r.production.produced),
            vendu: entier(Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0)),
            manque: entier(Object.values(r.market.bySegment).reduce((s, d) => s + d.lost, 0)),
            stockFin: entier(
              r.production.produced - Object.values(r.market.bySegment).reduce((s, d) => s + d.sold, 0),
            ),
            chiffreAffaires: entier(r.incomeStatement.revenue),
            ...(r.rd ? { rdEngage: entier(r.rd.budget) } : {}),
          },
        ];
    return {
      tour: p.round,
      produits,
      chiffreAffaires: entier(r.incomeStatement.revenue),
      resultatNet: entier(r.incomeStatement.netIncome),
      tresorerieNette: entier(r.functionalBalance.netTreasury),
    };
  });
  return {
    equipe: view.playerTeamName,
    tours,
    ouverture: {
      tour: view.currentRound,
      stocks: view.ouverture.stocks,
      caisse: view.ouverture.cash,
      creances: view.ouverture.receivables,
      dettesFournisseurs: view.ouverture.payables,
      // Où en est chaque référence à développer : une référence déjà vendable
      // au tour à jouer n'a plus rien à financer.
      ...(view.gamme?.some((g) => g.rd?.development)
        ? {
            developpement: Object.fromEntries(
              view.gamme
                .filter((g) => g.rd?.development)
                .map((g) => [g.code, { engage: entier(g.rd!.development!.invested), lancee: g.rd!.development!.available }]),
            ),
          }
        : {}),
    },
  };
}

/** Le classeur d'une équipe, ou null si la partie n'est pas la sienne. */
export async function cockpitEquipe(view: GameView): Promise<ClasseurSpec | null> {
  const game = (await db.select().from(games).where(eq(games.id, view.gameId)))[0];
  if (!game) return null;
  const config = parseScenarioConfig(game.scenarioSnapshot);
  const definition = scenarioByCode(config.code);
  const concurrents = (await db.select({ id: teams.id }).from(teams).where(eq(teams.gameId, view.gameId))).length;
  const restants = Array.from(
    { length: Math.max(0, view.roundsCount - view.currentRound + 1) },
    (_, i) => view.currentRound + i,
  );
  const mono = toGamme(config)[0]!.code;
  return cockpitSpec({
    scenario: definition,
    config,
    tours: restants.length > 0 ? restants : [view.roundsCount],
    concurrents: Math.max(1, concurrents),
    historique: historiqueEquipe(view, mono),
  });
}
