import { describe, expect, it } from "vitest";
import { estimerLeTour, repartitionDesVentes, ventesAPartEgale } from "@/engine/estimation";
import { proposedDecisionsFor } from "@/services/decision-baseline";
import { orderOfferForRound } from "@/engine/simulation";
import { ventesEstimeesParDefaut } from "@/config/ventes-estimees";
import type { CompanyRoundResult } from "@/engine/types";
import { jouerLaSeance } from "../helpers/seance-d-essai";
import { siVousVendez } from "@/components/resultat-estime";

/**
 * P1-7 DE LA SÉANCE D'ESSAI : LE RÉSULTAT ESTIMÉ QUI RASSURE À TORT.
 *
 * Au premier tour, la feuille proposait comme ventes estimées le plan de production :
 * l'équipe « vendait » tout ce qu'elle fabriquait, et le chiffre en haut de chaque écran
 * la rassurait (Écho Premium : −1 € estimé, −36 296 € réels). La proposition part
 * désormais d'une part de marché égale (`ventesAPartEgale`), et, ensuite, des ventes
 * réelles du tour précédent (comme avant).
 *
 * Mesuré ici sur la séance rejouée (4 équipes, 10 graines) : l'écart entre le résultat
 * net estimé AVEC LA PROPOSITION de la feuille et le résultat réel, au tour 1.
 */
const GRAINES = [1, 2, 3, 4, 5, 6, 7, 8, 20260101, 4242];

export function ecartsDuTour1(graine: number) {
  const ecarts: Record<string, { avant: number; apres: number; reel: number; estimeAvant: number; estimeApres: number }> = {};
  jouerLaSeance({
    graine,
    tours: 1,
    espion: (tour, sortie, decisions, o) => {
      for (const e of o.equipes) {
        const etat = o.etats.find((x) => x.id === e.id)!;
        const d = decisions[e.id]!;
        const dossier = {
          scenario: o.scenario,
          state: etat,
          roundIndex: tour,
          events: o.evenements,
          orderOffer: orderOfferForRound(o.scenario, tour, graine) ?? null,
          repartition: repartitionDesVentes(o.scenario, tour, null as Pick<CompanyRoundResult, "market"> | null),
        };
        const code = o.scenario.product.code;
        const avant = ventesEstimeesParDefaut({ planDeProduction: d.productionPlan, premierTour: true }).valeur;
        const egale = ventesAPartEgale({
          scenario: o.scenario,
          state: etat,
          decisions: proposedDecisionsFor({ snapshot: o.scenario, state: etat, roundIndex: tour, previousPayload: null }),
          concurrents: o.etats.length,
          roundIndex: tour,
          events: o.evenements,
        });
        const apres = ventesEstimeesParDefaut({ aPartEgale: egale[code], planDeProduction: d.productionPlan, premierTour: true }).valeur;
        const reel = sortie.results[e.id]!.incomeStatement.netIncome;
        const estimeAvant = estimerLeTour(dossier, d, { [code]: avant }).resultatNet;
        const estimeApres = estimerLeTour(dossier, d, { [code]: apres }).resultatNet;
        ecarts[e.nom] = { avant: Math.abs(estimeAvant - reel), apres: Math.abs(estimeApres - reel), reel, estimeAvant, estimeApres };
      }
    },
  });
  return ecarts;
}

describe("au tour 1, les ventes estimées proposées partent d'une part de marché égale", () => {
  it("la proposition du tour 1 est la part égale de la demande, et non le plan de production", () => {
    jouerLaSeance({
      graine: 1,
      tours: 1,
      espion: (tour, _sortie, _decisions, o) => {
        const etat = o.etats[0]!;
        const d = proposedDecisionsFor({ snapshot: o.scenario, state: etat, roundIndex: tour, previousPayload: null });
        const egale = ventesAPartEgale({
          scenario: o.scenario,
          state: etat,
          decisions: d,
          concurrents: o.etats.length,
          roundIndex: tour,
          events: o.evenements,
        })[o.scenario.product.code]!;
        expect(egale).toBeGreaterThan(0);
        expect(egale).not.toBe(d.productionPlan);
        expect(ventesEstimeesParDefaut({ aPartEgale: egale, planDeProduction: d.productionPlan, premierTour: true })).toEqual({
          valeur: Math.round(egale),
          proposition: true,
        });
      },
    });
  });

  it("ensuite, la proposition reste ce que l'équipe a vendu au tour précédent", () => {
    expect(ventesEstimeesParDefaut({ venduAuTourPasse: 3264, aPartEgale: 4000, premierTour: false })).toEqual({
      valeur: 3264,
      proposition: false,
    });
  });

  it("le chiffre estimé dit sa condition : « si vous vendez N enceintes »", () => {
    expect(siVousVendez(3200, { unit: "enceinte", units: "enceintes" })).toMatch(/^si vous vendez 3[\s\u202f]200 enceintes$/);
    expect(siVousVendez(1, { unit: "enceinte", units: "enceintes" })).toBe("si vous vendez 1 enceinte");
  });

  it("l'écart entre l'estimé et le réel, mesuré sur la séance rejouée (relevé pour le rapport)", () => {
    const lignes = GRAINES.flatMap((g) => Object.entries(ecartsDuTour1(g)).map(([nom, x]) => ({ graine: g, nom, ...x })));
    expect(lignes).toHaveLength(GRAINES.length * 4);
    if (process.env.RELEVE_P1_7) console.log(JSON.stringify(lignes));
  });
});
