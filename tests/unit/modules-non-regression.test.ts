import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { presetByLevel } from "@/config/difficulty";
import { jouerSansModule, SECTEURS } from "../helpers/partie-sans-module";

/**
 * UNE PARTIE SANS MODULE NE BOUGE PAS D'UN CENTIME.
 *
 * Les correctifs du moteur (prix facturé, crise, arrêts, tours minimaux,
 * périodicité) et les sept modules rendus jouables ne doivent rien changer à
 * une partie qui n'en choisit aucun. Le témoin a été enregistré sur le moteur
 * d'AVANT, au centime, pour les quatre secteurs, au trimestre et au mois :
 * quatre entreprises pilotées par les bots (finance, RH, investissement et
 * trésorerie compris), six tours, compte de résultat, bilan, tableau de flux
 * et parts de marché.
 *
 * Le témoin ne se régénère pas : un écart est une régression, pas une mise à jour.
 */
const TEMOIN = JSON.parse(
  readFileSync(new URL("../fixtures/parties-sans-module.json", import.meta.url), "utf8"),
) as Record<string, unknown[]>;

describe("une partie sans module garde ses résultats d'avant, au centime", () => {
  for (const secteur of Object.keys(SECTEURS)) {
    for (const periodicity of ["quarter", "month"] as const) {
      it(`${secteur}, tour au ${periodicity === "quarter" ? "trimestre" : "mois"}`, () => {
        const attendu = TEMOIN[`${secteur}.${periodicity}`]!;
        expect(attendu.length).toBeGreaterThan(0);
        expect(jouerSansModule({ secteur, periodicity })).toEqual(attendu);
      });
    }
  }

  it("un niveau qui ne propose pas les plans de crise joue la même partie (nova, bistrot)", () => {
    // Niveau 3 : l'assurance, et donc les plans de crise, restent fermés.
    const niveau3 = presetByLevel.get(3)!.decisions;
    expect(niveau3.insurance).toBe(false);
    for (const secteur of ["nova", "bistrot"]) {
      expect(jouerSansModule({ secteur, leviers: niveau3 })).toEqual(TEMOIN[`${secteur}.quarter`]);
    }
  });

  it("le témoin a de la matière : des ventes, des résultats, des événements", () => {
    const nova = TEMOIN["nova.quarter"] as Record<string, { incomeStatement: { revenue: number } }>[];
    expect(nova).toHaveLength(6);
    expect(nova[0]!.e0!.incomeStatement.revenue).toBeGreaterThan(0);
  });
});
