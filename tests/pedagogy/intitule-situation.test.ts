import { describe, expect, it } from "vitest";
import { SCENARIOS } from "../../src/config/scenarios/registry";
import type { SituationDef } from "../../src/config/scenarios/situation-kit";

/**
 * L'INTITULÉ DIT CE QUE LA SITUATION EST.
 *
 * « Des clients repartis sans acheter » se lisait sous l'intitulé « Alerte
 * comptable ». Toutes les alertes se détectent dans les chiffres du tour,
 * mais une rupture de stock ou un atelier saturé ne sont pas des alertes
 * comptables : c'est la production, le stock ou les équipes qui n'ont pas
 * suivi. L'élève lit l'intitulé avant l'énoncé ; s'il annonce la comptabilité
 * et que l'énoncé parle de clients refusés, il cherche au mauvais endroit.
 *
 * La règle est tenue par le déclencheur, qui ne ment pas sur ce qu'il mesure.
 */
const COMPTABLE = new Set(["below_breakeven", "profitable_illiquid"]);
const OPERATIONNEL = new Set(["stockout", "capacity_saturated"]);

const situations: { secteur: string; s: SituationDef }[] = SCENARIOS.flatMap((d) =>
  d.situations.map((s) => ({ secteur: d.code, s })),
);

describe("l'intitulé d'une alerte dit ce qu'elle mesure", () => {
  it("le corpus est lu", () => {
    expect(situations.length).toBeGreaterThan(50);
  });

  it("une alerte détectée dans le résultat ou la trésorerie est comptable", () => {
    const fautives = situations.filter(
      ({ s }) => "detect" in s.trigger && COMPTABLE.has(s.trigger.detect) && s.category !== "alerte_comptable",
    );
    expect(fautives.map((f) => `${f.secteur} · ${f.s.title}`)).toEqual([]);
  });

  it("une alerte détectée dans le stock ou la capacité est opérationnelle", () => {
    const fautives = situations.filter(
      ({ s }) =>
        "detect" in s.trigger && OPERATIONNEL.has(s.trigger.detect) && s.category !== "alerte_operationnelle",
    );
    expect(fautives.map((f) => `${f.secteur} · ${f.s.title}`)).toEqual([]);
  });

  it("l'inverse aussi : rien d'opérationnel sous l'intitulé comptable", () => {
    // Les alertes à date (banc d'été, heures de pointe) n'ont pas de
    // déclencheur ; c'est leur énoncé qui les classe, et la garde est
    // que l'intitulé comptable n'accueille que des déclencheurs comptables.
    const fautives = situations.filter(
      ({ s }) => s.category === "alerte_comptable" && "detect" in s.trigger && !COMPTABLE.has(s.trigger.detect),
    );
    expect(fautives.map((f) => `${f.secteur} · ${f.s.title}`)).toEqual([]);
  });
});
