import { describe, expect, it } from "vitest";
import { DIFFICULTY_PRESETS, presetByLevel } from "@/config/difficulty";
import { NOVA_DEFINITION, SCENARIOS } from "@/config/scenarios/registry";
import { aLaMesureDuNiveau, botDecisions, neutralDecisions, type BotProfile } from "@/engine/bots";
import { fallbackDecisions } from "@/services/decision.service";

/**
 * UN MARCHÉ ÉQUITABLE : LES CONCURRENTS PILOTÉS DÉCIDENT AVEC LES LEVIERS DU NIVEAU.
 *
 * Le joueur ne voit que les leviers que son niveau ouvre ; les autres partent à
 * la valeur que la feuille propose (la gestion neutre), ou ne partent pas. Un
 * bot « premium » soignait sa qualité au niveau 1, où le joueur ne le peut pas.
 */

const PROFILS: BotProfile[] = ["passive", "price_aggressive", "premium", "balanced", "growth"];

describe("les bots, à la mesure du niveau", () => {
  it("niveau 1 : la qualité et l'entretien de chaque bot sont ceux que le joueur envoie sans les choisir", () => {
    const ctx = {
      scenario: NOVA_DEFINITION.scenario,
      state: NOVA_DEFINITION.company("bot", "Bot", "bot", "premium"),
      roundIndex: 2,
      lastSoldUnits: 5000,
    };
    const neutre = neutralDecisions(ctx);
    const libre = botDecisions("premium", ctx);
    expect(libre.qualityBudget, "le cas ne teste rien").not.toBe(neutre.qualityBudget);
    const n1 = botDecisions("premium", { ...ctx, leviers: presetByLevel.get(1)!.decisions });
    expect(n1.qualityBudget).toBe(neutre.qualityBudget);
    expect(n1.maintenanceBudget).toBe(neutre.maintenanceBudget);
    // Le prix et le volume restent ceux du profil : ce sont les leviers du niveau 1.
    expect(n1.price).toBe(libre.price);
    // Au niveau 2, la qualité est ouverte : le bot premium la soigne de nouveau.
    expect(botDecisions("premium", { ...ctx, leviers: presetByLevel.get(2)!.decisions }).qualityBudget).toBe(
      libre.qualityBudget,
    );
  });

  for (const p of DIFFICULTY_PRESETS) {
    it(`niveau ${p.level} : aucun bot, aucun secteur, n'emploie un levier fermé`, () => {
      for (const d of SCENARIOS) {
        const scenario = { ...d.scenario, enrichedBots: true };
        for (const profil of PROFILS) {
          const state = d.company("bot", "Bot", "bot", profil);
          const ctx = { scenario, state, roundIndex: 3, lastSoldUnits: 1e6, leviers: p.decisions };
          const dec = botDecisions(profil, ctx);
          const o = p.decisions;
          const ou = `${d.code}/${profil}`;
          if (!o.hr) expect(dec.hr, ou).toBeUndefined();
          if (!o.investment) expect(dec.investment, ou).toBeUndefined();
          if (!o.insurance) expect(dec.insurance ?? false, ou).toBe(false);
          if (!o.rse) expect(dec.rse, ou).toBeUndefined();
          if (!o.creances) expect(dec.treasury, ou).toBeUndefined();
          if (!o.placement) expect(dec.treasury?.placement ?? 0, ou).toBe(0);
          if (!o.finance) {
            expect(dec.finance?.newLoan ?? 0, ou).toBe(0);
            expect(dec.finance?.capitalIncrease ?? 0, ou).toBe(0);
          }
          if (!o.dividend) expect(dec.finance?.dividend ?? 0, ou).toBe(0);
        }
      }
    });
  }

  it("l'équipe absente sans historique ne décide, elle aussi, qu'avec les leviers du niveau", () => {
    const scenario = { ...NOVA_DEFINITION.scenario, enrichedBots: true };
    const state = NOVA_DEFINITION.company("absente", "Absente", "human");
    const n1 = fallbackDecisions(scenario, state, 3, presetByLevel.get(1)!.decisions);
    expect(n1.hr).toBeUndefined();
    expect(n1.insurance ?? false).toBe(false);
    expect(n1.finance).toEqual({ newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 });
  });

  it("sans leviers (partie d'avant la répartition), rien ne change", () => {
    const d = { price: 50, productionPlan: 10, marketingBudget: 1, qualityBudget: 2, maintenanceBudget: 3, hr: { salaryIndex: 1.1 } };
    expect(aLaMesureDuNiveau(d, null)).toBe(d);
  });
});
