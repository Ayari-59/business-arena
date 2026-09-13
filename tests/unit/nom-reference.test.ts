import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NomReference } from "@/components/nom-reference";
import { toGamme } from "@/engine/gamme";
import { conseilGammeScenario } from "@/config/scenarios/conseil-gamme";
import { SCENARIOS } from "@/config/scenarios/registry";
import { parseScenarioConfig } from "@/config/scenarios/schema";

/**
 * UN NOM DE MÉTIER ENTIER, QUI TIENT QUAND MÊME SUR UN TÉLÉPHONE.
 *
 * Certaines références portent un nom que le métier exige complet
 * (« Transformation et Stratégie ») et qui déborde du bouton sur un écran de
 * 390 px. Plutôt que de choisir entre un nom juste et un bouton lisible, la
 * référence déclare un `shortName` : le repli du téléphone.
 *
 * Ce test garde les deux moitiés de la règle — le nom complet reste affiché dès
 * qu'il y a de la place, et rien ne change pour les références qui n'ont pas de
 * nom court.
 */

const rendu = (reference: { name: string; shortName?: string | null }) =>
  renderToStaticMarkup(createElement(NomReference, { reference }));

describe("NomReference", () => {
  it("sans nom court : un seul nœud de texte, aucun balisage ajouté", () => {
    expect(rendu({ name: "Col rond" })).toBe("Col rond");
    expect(rendu({ name: "Col rond", shortName: null })).toBe("Col rond");
    // Un nom court identique au nom n'a rien à apporter : on ne double pas.
    expect(rendu({ name: "Audit", shortName: "Audit" })).toBe("Audit");
  });

  it("avec nom court : le court sous 640 px, le complet au-delà", () => {
    const html = rendu({ name: "Transformation et Stratégie", shortName: "Stratégie" });
    expect(html).toContain('class="sm:hidden">Stratégie<');
    expect(html).toContain('class="hidden sm:inline">Transformation et Stratégie<');
  });

  it("l'inventaire des noms courts : qui abrège quoi, et pourquoi", () => {
    // La liste EXHAUSTIVE des références qui déclarent un nom court, sur les 15
    // scénarios. Elle tient ici plutôt qu'éparpillée : ajouter un nom court
    // sans le déclarer ici fait rougir ce test, ce qui est exactement le
    // moment de se demander si le mot choisi est le bon.
    //
    //  · ATLAS CONSEIL : « Transformation et Stratégie » est le nom du métier,
    //    entier, et ne tient pas sur un bouton.
    //  · L'ESCALE : les deux chambres partagent leur premier mot ; seul ce qui
    //    les distingue mérite la place. La Suite tient d'elle-même.
    //  · LE COMPTOIR : le mot qui identifie le service suffit ; le reste du nom
    //    dit à qui on vend, ce que la carte de la référence redit en dessous.
    //  · PIXEL & CO : la tête de rayon suffit à choisir l'onglet.
    const inventaire: Record<string, Record<string, string>> = {};
    for (const s of SCENARIOS) {
      const courts = toGamme(s.scenario).filter((p) => p.shortName);
      if (courts.length === 0) continue;
      inventaire[s.code] = Object.fromEntries(courts.map((p) => [p.name, p.shortName!]));
    }
    expect(inventaire).toEqual({
      "conseil-gamme": { "Transformation et Stratégie": "Stratégie" },
      "hotel-gamme": { "Chambre standard": "Standard", "Chambre supérieure": "Supérieure" },
      "bistrot-gamme": {
        "Banquets et repas d'entreprise": "Banquets",
        "Traiteur · buffets livrés": "Traiteur",
      },
      "ecommerce-gamme": {
        "Décoration et textile": "Décoration",
        "Collection de créateurs": "Créateurs",
      },
    });
  });

  it("un nom court est toujours plus court que le nom, dans tous les scénarios", () => {
    for (const s of SCENARIOS) {
      for (const p of toGamme(s.scenario)) {
        if (!p.shortName) continue;
        expect(p.shortName.length, `${s.code} · ${p.code}`).toBeLessThan(p.name.length);
      }
    }
  });

  it("le schéma accepte un nom court et le conserve au parse", () => {
    // Le parse est le seul chemin vers un scénario : une clé qu'il ne déclare
    // pas est retirée en silence, et le nom court disparaîtrait des parties
    // enregistrées par l'enseignant sans que rien ne le signale.
    const relu = parseScenarioConfig(JSON.parse(JSON.stringify(conseilGammeScenario)));
    expect(relu.products?.find((p) => p.code === "transformation")?.shortName).toBe("Stratégie");
  });

  it("tous les affichages par référence passent par le composant", () => {
    // Un `{p.name}` oublié dans un bouton, et le débordement revient sur
    // l'écran qu'on vient de corriger.
    const racine = join(import.meta.dirname, "..", "..", "src", "components");
    for (const fichier of ["decision-form.tsx", "period-dashboard.tsx", "period-decisions-recap.tsx"]) {
      const src = readFileSync(join(racine, fichier), "utf8");
      expect(src, fichier).toContain("NomReference");
    }
  });
});
