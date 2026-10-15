import { describe, expect, it } from "vitest";
import { scenarioByCode, scenarioCodeForLevel } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";
import { presetByLevel } from "@/config/difficulty";
import { applyPeriodicityToCompany } from "@/config/scenarios/periodicity";
import { botDecisions, botPersonalityFromSeed, soldByProduct, type BotProfile } from "@/engine/bots";
import { peekEventDraw } from "@/engine/events";
import { orderOfferForRound, simulateRound } from "@/engine/simulation";
import { estimerLeTour, expurgerLeScenario } from "@/engine/estimation";
import { toGamme } from "@/engine/gamme";
import { proposedDecisionsFor } from "@/services/decision-baseline";
import type { CompanyRoundResult, CompanyState, EventInstance, RoundDecisions } from "@/engine/types";

/**
 * ESTIMÉ = RÉEL DANS UNE VRAIE PARTIE SOLO, SOUS UNE GRAINE QUELCONQUE.
 *
 * `estimation.test.ts` tient la garde sur une partie montée à la main, sous une
 * graine. Celle-ci rejoue des parties comme `createSoloGame` les crée (l'équipe et
 * deux concurrents du scénario, monde variable tiré de la graine, histoires
 * d'investissement, trimestre, scénario composé au niveau), six tours durant,
 * l'équipe validant ce que le formulaire lui propose. À chaque tour, le dossier est
 * celui que le serveur prépare : scénario EXPURGÉ, état d'ouverture, événements
 * connus à l'ouverture (le tirage du tour compris), commande annoncée ; et jamais la
 * graine. Rejoué sur les ventes réellement constatées, il doit rendre le compte
 * réel au centime.
 *
 * C'est la garde qui manquait quand l'indice de cours des fournisseurs (retiré
 * depuis) faisait dépendre le coût matières de la graine : l'estimation, qui ne la
 * connaît pas, s'écartait du réel de 6,3 k€ par tour en moyenne en NOVA et en
 * PIXEL & CO mono, sans qu'aucun test ne le voie.
 *
 * Seuls les tirages de la clôture (carte RSE, rupture d'approvisionnement) peuvent
 * creuser un écart (`estimation.test.ts` les nomme) : un tour où l'un d'eux tombe
 * est écarté, et il en reste assez pour que la garde morde.
 */

const GRAINES = [8_919, 16_838, 424_242];

function partieSolo(secteur: string, niveau: number, graine: number) {
  const def = scenarioByCode(scenarioCodeForLevel(secteur, niveau));
  const leviers = presetByLevel.get(niveau as 1 | 2 | 3)!.decisions;
  const scenario = composerLeScenarioJoue({
    scenario: def.scenario,
    seed: graine,
    variableWorld: true,
    level: niveau,
    concurrents: 3,
    periodicity: "quarter",
    investmentStories: true,
  });
  const expurge = expurgerLeScenario(scenario);
  const equipes = [
    { id: "a-equipe", nom: def.playerTeamName, ctl: "human" as const, profil: undefined as BotProfile | undefined },
    ...def.bots.slice(0, 2).map((b, i) => ({ id: `b-bot${i}`, nom: b.name, ctl: "bot" as const, profil: b.profile as BotProfile })),
  ];
  let etats: CompanyState[] = equipes.map((e) =>
    applyPeriodicityToCompany(def.company(e.id, e.nom, e.ctl, e.profil), "quarter", {
      abonnement: def.scenario.subscription !== undefined,
    }),
  );
  let actifs: EventInstance[] = [];
  let precedents: Record<string, CompanyRoundResult> = {};
  let precedente: RoundDecisions | null = null;
  const tours: { tour: number; reel: CompanyRoundResult; estime: ReturnType<typeof estimerLeTour>; tirage: boolean }[] = [];
  for (let tour = 1; tour <= scenario.roundsCount; tour += 1) {
    const ouverture = etats.find((c) => c.id === "a-equipe")!;
    const vendu = (r?: CompanyRoundResult) =>
      r ? Object.values(r.market.bySegment).reduce((s, x) => s + x.sold, 0) : undefined;
    const decisions: Record<string, RoundDecisions> = {};
    for (const e of equipes) {
      const etat = etats.find((c) => c.id === e.id)!;
      const p = precedents[e.id];
      decisions[e.id] =
        e.ctl === "human"
          ? proposedDecisionsFor({
              snapshot: scenario,
              state: etat,
              roundIndex: tour,
              previousPayload: precedente,
              lastMarket: p?.market.bySegment ?? null,
              leviers,
            })
          : botDecisions(e.profil!, {
              scenario,
              state: etat,
              roundIndex: tour,
              lastSoldUnits: vendu(p),
              lastSoldByProduct: p ? soldByProduct(scenario, p.market.bySegment) : undefined,
              humanAvgPrice: precedente?.price,
              personality: botPersonalityFromSeed(graine, e.profil!),
              leviers,
            });
    }
    // Ce que l'équipe sait du tour avant de décider : les événements en cours, et
    // le tirage, que l'arène retourne face visible à l'ouverture.
    const connus = [
      ...actifs,
      ...peekEventDraw({
        scenario,
        roundIndex: tour,
        companies: [...etats].sort((a, b) => a.id.localeCompare(b.id)),
        activeEvents: actifs,
        seed: graine,
      }),
    ].filter((e) => e.scope === "market" || e.companyId === "a-equipe");
    const sortie = simulateRound({ scenario, roundIndex: tour, companies: etats, decisions, activeEvents: actifs, seed: graine });
    const reel = sortie.results["a-equipe"]!;
    const ventes = Object.fromEntries(
      toGamme(scenario).map((p) => [
        p.code,
        p.market.segments.reduce((s, seg) => s + (reel.market.bySegment[seg.code]?.sold ?? 0), 0),
      ]),
    );
    const estime = estimerLeTour(
      {
        scenario: expurge,
        state: ouverture,
        roundIndex: tour,
        events: connus,
        orderOffer: orderOfferForRound(scenario, tour, graine) ?? null,
        repartition: Object.fromEntries(Object.entries(reel.market.bySegment).map(([code, d]) => [code, d.sold])),
      },
      decisions["a-equipe"]!,
      ventes,
    );
    tours.push({
      tour,
      reel,
      estime,
      tirage:
        Boolean(reel.supplier?.supplyDisruption) || sortie.newEvents.some((e) => e.code.startsWith("rse_")),
    });
    precedente = decisions["a-equipe"]!;
    precedents = sortie.results;
    etats = sortie.companies;
    actifs = sortie.events;
  }
  return tours;
}

describe("estimé = réel dans une vraie partie solo, graine non nulle", () => {
  for (const [secteur, niveaux] of [
    ["nova", [1, 3]],
    ["ecommerce", [1, 2]],
  ] as const) {
    for (const niveau of niveaux) {
      it(`${secteur} mono, niveau ${niveau} : six tours, trois graines, au centime`, () => {
        let compares = 0;
        for (const graine of GRAINES) {
          for (const t of partieSolo(secteur, niveau, graine)) {
            if (t.tirage) continue;
            compares += 1;
            const ou = `${secteur} n${niveau} · graine ${graine} · tour ${t.tour}`;
            const a = t.estime.resultat.incomeStatement as unknown as Record<string, number>;
            const b = t.reel.incomeStatement as unknown as Record<string, number>;
            for (const poste of Object.keys(b)) {
              if (typeof b[poste] !== "number") continue;
              expect(a[poste], `${ou} · ${poste}`).toBeCloseTo(b[poste]!, 2);
            }
            expect(t.estime.tresorerieNette, `${ou} · trésorerie nette`).toBeCloseTo(
              t.reel.functionalBalance.netTreasury,
              2,
            );
            expect(t.estime.stockFinal.valeur, `${ou} · stock`).toBeCloseTo(t.reel.balanceSheet.inventoryValue, 2);
          }
        }
        // La garde mord : la plupart des tours sont comparés, et le compte n'est pas nul.
        expect(compares).toBeGreaterThanOrEqual(12);
      });
    }
  }
});
