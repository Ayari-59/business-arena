import { describe, expect, it } from "vitest";
import { SCENARIOS, scenarioByCode, ALL_SITUATIONS } from "../../src/config/scenarios/registry";
import { balanceGap } from "../../src/engine/finance/statements";

/**
 * Garde-fous du registre : ce qu'un scénario doit respecter pour être
 * jouable, quel que soit son secteur. Ajouter une entrée au registre sans
 * respecter ces règles fait tomber ce fichier — c'est le but.
 */
describe("registre des scénarios", () => {
  it("les codes de scénario sont uniques", () => {
    const codes = SCENARIOS.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("un code inconnu retombe sur NOVA plutôt que de casser une partie", () => {
    expect(scenarioByCode("secteur-inexistant").code).toBe("nova");
    expect(scenarioByCode(undefined).code).toBe("nova");
    expect(scenarioByCode(null).code).toBe("nova");
  });

  it("chaque scénario s'annonce : titre, pitch, vocabulaire", () => {
    for (const d of SCENARIOS) {
      expect(d.title.length, d.code).toBeGreaterThan(5);
      expect(d.summary.length, d.code).toBeGreaterThan(30);
      expect(d.tagline.length, d.code).toBeGreaterThan(10);
      expect(d.playerTeamName.length, d.code).toBeGreaterThan(1);
      // on ne vend pas des « unités » dans un hôtel
      expect(d.vocabulary.unit.length, d.code).toBeGreaterThan(2);
      expect(d.vocabulary.units.length, d.code).toBeGreaterThan(2);
      expect(d.vocabulary.priceLabel.length, d.code).toBeGreaterThan(3);
    }
  });

  it("les codes de situation sont uniques TOUS scénarios confondus", () => {
    // Les situations sont semées dans une table à clé unique : une collision
    // entre deux secteurs ferait jouer la situation d'un autre métier.
    const codes = ALL_SITUATIONS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("chaque scénario a ses propres situations, jamais celles d'un autre", () => {
    for (const d of SCENARIOS) {
      const own = new Set(d.situations.map((s) => s.code));
      for (const other of SCENARIOS) {
        if (other.code === d.code) continue;
        for (const s of other.situations) {
          expect(own.has(s.code), `${s.code} partagée entre ${d.code} et ${other.code}`).toBe(
            false,
          );
        }
      }
    }
  });

  it("le bilan d'ouverture de chaque entreprise est équilibré", () => {
    for (const d of SCENARIOS) {
      const opening = [
        d.company("player", d.playerTeamName, "human"),
        ...d.bots.map((b) => d.company(b.id, b.name, "bot", b.profile)),
      ];
      for (const c of opening) {
        expect(
          Math.abs(balanceGap(c.finance)),
          `bilan d'ouverture déséquilibré pour ${d.code}/${c.id}`,
        ).toBeLessThan(0.01);
      }
    }
  });

  it("la valeur du stock d'ouverture correspond aux quantités en réserve", () => {
    for (const d of SCENARIOS) {
      const c = d.company("player", d.playerTeamName, "human");
      const stockValue = c.finishedGoods.quantity * c.finishedGoods.unitCost;
      expect(c.finance.inventoryValue, `stock incohérent pour ${d.code}`).toBeCloseTo(
        stockValue,
        6,
      );
    }
  });

  it("une activité périssable n'ouvre jamais avec du stock", () => {
    for (const d of SCENARIOS) {
      if (!d.scenario.perishable) continue;
      const c = d.company("player", d.playerTeamName, "human");
      expect(c.finishedGoods.quantity, `${d.code} ouvre avec du stock périssable`).toBe(0);
      expect(c.finance.inventoryValue, d.code).toBe(0);
    }
  });

  it("chaque scénario propose assez de concurrents pour une classe", () => {
    for (const d of SCENARIOS) {
      expect(d.bots.length, d.code).toBeGreaterThanOrEqual(7);
      const ids = d.bots.map((b) => b.id);
      expect(new Set(ids).size, `identifiants de bots dupliqués dans ${d.code}`).toBe(ids.length);
      const names = d.bots.map((b) => b.name);
      expect(new Set(names).size, `noms de bots dupliqués dans ${d.code}`).toBe(names.length);
    }
  });

  it("l'échéancier d'emprunt d'ouverture est cohérent avec la dette", () => {
    for (const d of SCENARIOS) {
      const c = d.company("player", d.playerTeamName, "human");
      const scheduled = (c.loans ?? []).reduce((sum, l) => sum + l.remaining, 0);
      expect(scheduled, `${d.code} : échéancier ≠ dette financière`).toBeCloseTo(
        c.finance.financialDebt,
        6,
      );
    }
  });

  it("les offres de commande d'un scénario ont des codes uniques", () => {
    for (const d of SCENARIOS) {
      const codes = (d.scenario.orderOffers ?? []).map((o) => o.code);
      expect(new Set(codes).size, d.code).toBe(codes.length);
    }
  });

  it("la saisonnalité couvre tous les tours de la partie", () => {
    for (const d of SCENARIOS) {
      const s = d.scenario;
      expect(s.market.seasonality.length, `${d.code} : saisonnalité globale`).toBeGreaterThanOrEqual(
        s.roundsCount,
      );
      for (const segment of s.market.segments) {
        if (!segment.seasonality) continue;
        expect(
          segment.seasonality.length,
          `${d.code}/${segment.code} : saisonnalité du segment`,
        ).toBeGreaterThanOrEqual(s.roundsCount);
      }
    }
  });
});
