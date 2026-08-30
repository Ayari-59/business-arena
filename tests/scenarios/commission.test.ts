import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import { ATELIERS } from "../../src/config/ateliers";
import { computeFinance } from "../../src/engine/finance/statements";
import { runGame } from "../../src/engine/simulation/runGame";
import { botDecisions, type BotProfile } from "../../src/engine/bots";
import type {
  CompanyRoundResult,
  CompanyState,
  EngineScenarioConfig,
} from "../../src/engine/types";

/**
 * LA COMMISSION D'UN CANAL PARTENAIRE.
 *
 * PIXEL & CO annonçait depuis toujours une clientèle « Marketplaces tierces
 * (commission) », et n'en portait aucune. La place de marché était représentée
 * par un prix de référence plus bas : autrement dit par une REMISE. L'atelier
 * du BTS NDRC, lui, consacrait une séance entière à calculer la marge après
 * commission, et évaluait les élèves sur le critère « la commission est
 * traitée comme une charge qui réduit la marge, pas comme une remise sur le
 * prix ». Le jeu enseignait exactement le contraire de ce que la grille
 * demandait, et rien ne le disait : la fiche était juste, la séance jouable,
 * la partie tournait.
 *
 * Les gardes qui suivent tiennent les deux bouts. Un secteur ne peut plus
 * annoncer une commission sans la prélever, et une commission prélevée ne peut
 * plus se confondre avec une baisse de prix.
 */
const STRATEGIES: BotProfile[] = ["passive", "balanced", "growth"];

describe("la commission d'un canal partenaire", () => {
  it("un canal qui annonce une commission la prélève vraiment", () => {
    // La garde qui manquait. Le nom d'un segment est ce que l'élève lit à
    // l'écran et ce sur quoi l'enseignant bâtit sa séance : il engage le
    // scénario.
    const manquantes: string[] = [];
    for (const d of SCENARIOS) {
      for (const seg of d.scenario.market.segments) {
        if (!/commission|partenaire|apporteur|centrale/i.test(seg.name)) continue;
        if ((seg.commissionRate ?? 0) > 0) continue;
        manquantes.push(`${d.code}/${seg.code} : « ${seg.name} » ne prélève rien`);
      }
    }
    expect(
      manquantes,
      `un canal annoncé commissionné qui ne coûte rien :\n${manquantes.join("\n")}`,
    ).toEqual([]);
  });

  it("la commission est une charge, jamais une remise sur le prix", () => {
    // La distinction n'est pas de vocabulaire. Une remise se voit du client et
    // se lit sur le prix ; une commission ne se voit que dans les comptes. Si
    // elle diminuait le chiffre d'affaires, l'équipe qui compare son CA au
    // nombre de commandes trouverait un prix moyen qu'elle n'a jamais
    // pratiqué, et la marge après commission serait introuvable.
    const base = {
      opening: {
        cash: 100_000, receivables: 0, inventory: 0, inventoryValue: 0,
        fixedAssetsNet: 0, payables: 0, financialDebt: 0, overdraft: 0, equity: 100_000,
      },
      roundDays: 90, revenue: 200_000, receivableRatio: 0, purchases: 0, payableRatio: 0,
      otherVariableCash: 0, inventoryChange: 0, cogs: 120_000, marketingCost: 0,
      qualityCost: 0, maintenanceCost: 0, fixedCosts: 0, depreciation: 0,
      loanAnnualRate: 0, overdraftAnnualRate: 0, interestMultiplier: 1, taxRate: 0,
      vatRate: 0, newLoan: 0, loanRepayment: 0, capitalIncrease: 0, investmentOutlay: 0,
    };
    const sans = computeFinance(base).incomeStatement;
    const avec = computeFinance({ ...base, commissionCost: 24_000 }).incomeStatement;

    expect(avec.revenue, "la commission a rogné le chiffre d'affaires").toBe(sans.revenue);
    expect(avec.grossMargin, "la commission n'a pas touché la marge").toBe(
      sans.grossMargin - 24_000,
    );
    expect(avec.netIncome, "la commission n'est pas descendue jusqu'au résultat").toBeCloseTo(
      sans.netIncome - 24_000,
      6,
    );
    expect(avec.commissionCost, "la commission ne se lit nulle part").toBe(24_000);
    expect(sans.commissionCost, "une ligne à zéro dans un secteur sans partenaire").toBeUndefined();
  });

  it("la commission sort réellement de la caisse", () => {
    // Une charge qui ne se décaisse pas est un artifice comptable : le
    // résultat baisserait sans que la trésorerie bouge, et l'équipe
    // conclurait que le canal ne coûte rien à financer.
    const base = {
      opening: {
        cash: 100_000, receivables: 0, inventory: 0, inventoryValue: 0,
        fixedAssetsNet: 0, payables: 0, financialDebt: 0, overdraft: 0, equity: 100_000,
      },
      roundDays: 90, revenue: 200_000, receivableRatio: 0, purchases: 0, payableRatio: 0,
      otherVariableCash: 0, inventoryChange: 0, cogs: 120_000, marketingCost: 0,
      qualityCost: 0, maintenanceCost: 0, fixedCosts: 0, depreciation: 0,
      loanAnnualRate: 0, overdraftAnnualRate: 0, interestMultiplier: 1, taxRate: 0,
      vatRate: 0, newLoan: 0, loanRepayment: 0, capitalIncrease: 0, investmentOutlay: 0,
    };
    const sans = computeFinance(base);
    const avec = computeFinance({ ...base, commissionCost: 24_000 });
    expect(avec.cashFlow.closing).toBeCloseTo(sans.cashFlow.closing - 24_000, 6);
    expect(avec.cashFlow.items.some((i) => i.label === "commissions_partenaires")).toBe(true);
    expect(sans.cashFlow.items.some((i) => i.label === "commissions_partenaires")).toBe(false);
  });

  it("en partie, la commission vaut le taux du canal, ni plus ni moins", () => {
    // Le calcul du moteur contrôlé sur une partie entière : ce que le compte
    // de résultat retient doit être exactement le taux appliqué au chiffre
    // d'affaires du canal, faute de quoi la séance de négociation ferait
    // travailler des élèves sur un nombre que personne ne peut retrouver.
    for (const d of SCENARIOS) {
      const taux = new Map(
        d.scenario.market.segments.map((s) => [s.code, s.commissionRate ?? 0] as const),
      );
      if ([...taux.values()].every((t) => t === 0)) continue;
      for (const strategie of STRATEGIES) {
        const companies: CompanyState[] = [
          d.company("player", d.playerTeamName, "bot", strategie),
          ...d.bots.slice(0, 2).map((b) => d.company(b.id, b.name, "bot", b.profile)),
        ];
        const run = runGame({
          scenario: d.scenario,
          initialCompanies: companies,
          providers: Object.fromEntries(
            companies.map((c) => [
              c.id,
              (ctx: { state: CompanyState; roundIndex: number; lastResult?: CompanyRoundResult }) =>
                botDecisions(c.botProfile as BotProfile, {
                  scenario: d.scenario,
                  state: ctx.state,
                  roundIndex: ctx.roundIndex,
                }),
            ]),
          ),
          seed: 20260101,
        });
        let vue = 0;
        for (const round of run.rounds) {
          const r = round.results["player"]!;
          const attendu = Object.entries(r.market.bySegment).reduce(
            (t, [code, seg]) => t + seg.revenue * (taux.get(code) ?? 0),
            0,
          );
          expect(
            r.incomeStatement.commissionCost ?? 0,
            `${d.code}/${strategie} : la commission retenue ne suit pas le taux du canal`,
          ).toBeCloseTo(attendu, 6);
          vue += attendu;
        }
        expect(vue, `${d.code}/${strategie} : aucune commission sur toute la partie`).toBeGreaterThan(0);
      }
    }
  });

  it("aucune séance ne fait travailler un mécanisme que son secteur n'a pas", () => {
    // La garde qui relie les deux mondes, et celle qui aurait vu le défaut.
    // Une séance qui consacre trois heures à la marge après commission envoie
    // sa classe chercher à l'écran un chiffre qui doit s'y trouver.
    //
    // Une première version comparait le VOCABULAIRE de la séance à celui de la
    // situation de son tour. Elle signalait sept cas, tous faux : la séance
    // « Le coût, le prix, le seuil » travaille le seuil de rentabilité pendant
    // que la situation « Le prix fait la demande » travaille l'élasticité, et
    // les deux se complètent très bien sans partager un mot. La proximité de
    // sujet ne se mesure pas ; la présence d'un mécanisme, si.
    const MECANISMES: { mot: RegExp; nom: string; present: (s: EngineScenarioConfig) => boolean }[] = [
      {
        mot: /commission/i,
        nom: "un canal qui prélève une commission",
        present: (sc) => sc.market.segments.some((seg) => (seg.commissionRate ?? 0) > 0),
      },
      {
        mot: /affacturage|escompte de créance/i,
        nom: "la mobilisation des créances",
        present: (sc) => Boolean(sc.treasury),
      },
      {
        mot: /étude de marché achetée|étude achetée/i,
        nom: "des études à acheter",
        present: (sc) => Boolean(sc.studies),
      },
    ];
    // Ce que cette liste ne contient PAS, et pourquoi. La sous-traitance et
    // l'assurance se chiffrent très bien sur le papier : l'enseignant donne un
    // tarif de renfort ou une prime, et la classe compare. Les y mettre a
    // signalé une séance du BTS GPME qui compare, sur le papier, une embauche
    // à un renfort ponctuel — un exercice parfaitement légitime. La règle ne
    // retient donc que les mécanismes dont le CHIFFRE ne peut venir que de
    // l'écran : un taux de commission, le coût d'un affacturage, le prix d'une
    // étude. Aucun enseignant ne peut les inventer, ils appartiennent au jeu.
    //
    // La séance du GPME portait bien un défaut, trouvé par la première version
    // de cette garde : son débriefing opposait « une équipe qui a recruté et
    // une qui a sous-traité », alors qu'aucune équipe ne peut sous-traiter
    // dans ce secteur. Il est corrigé au registre, et la phrase dit maintenant
    // ce qui se joue et ce qui se calcule.
    const manquants: string[] = [];
    for (const a of ATELIERS) {
      const scenario = SCENARIOS.find((s) => s.code === a.reglages.scenarioCode)!;
      for (const seance of a.seances) {
        const dit = [
          seance.objectif,
          seance.livrable,
          ...seance.notions,
          ...seance.competences,
          ...seance.evaluation,
          ...seance.deroule.map((p) => p.detail),
        ].join(" ");
        for (const m of MECANISMES) {
          if (!m.mot.test(dit) || m.present(scenario.scenario)) continue;
          manquants.push(
            `${a.code}/S${seance.numero} « ${seance.titre} » travaille ${m.nom}, que « ${scenario.code} » n'a pas`,
          );
        }
      }
    }
    expect(
      manquants,
      `des séances promettent un travail que le jeu ne permet pas :\n${manquants.join("\n")}`,
    ).toEqual([]);
  });
});
