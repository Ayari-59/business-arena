import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { presetFromProfile, presetByLevel, LEGACY_PRESET } from "@/config/difficulty";
import { parseScenarioConfig } from "@/config/scenarios/schema";
import { rejouerLaPartieDeNiveau7, type TemoinDuNiveau7 } from "../helpers/partie-de-niveau-7";

/**
 * UNE PARTIE DE NIVEAU 7 « GROUPE » CRÉÉE AVANT LE RETRAIT DU NIVEAU SE REJOUE,
 * AU CENTIME.
 *
 * Le niveau 7 est retiré du produit (décision du propriétaire, octobre 2026) :
 * aucun écran ne le propose plus, aucune création ne l'accepte plus. Mais une
 * partie commencée se termine — c'est la règle de la maison, et elle ne souffre
 * pas d'exception : ni la grille tarifaire, ni la vitrine, ni le retrait d'un
 * niveau ne changent une partie en cours.
 *
 * CE QUI LA PROTÈGE, ET QUE CE REJEU TRAVERSE :
 *   · SON INSTANTANÉ. Elle rejoue le snapshot figé à sa création, bloc `groupe`
 *     compris, relu par `parseScenarioConfig` comme à chaque clôture. Le moteur
 *     du groupe (`engine/groupe`, `config/groupe`) est gardé pour cela.
 *   · LE GEL DE SES LEVIERS (`presetFromProfile`). Son `difficultyProfile` porte
 *     sa liste de leviers, croissance externe et externalisation comprises :
 *     c'est elle qui est relue, pas la configuration du produit, qui ne porte
 *     plus le niveau.
 *
 * Le témoin a été enregistré AVANT le retrait et ne se régénère pas : un écart
 * est une régression, et le retrait d'un niveau ne justifie pas d'y toucher.
 */
const TEMOIN = JSON.parse(
  readFileSync(new URL("../fixtures/partie-de-niveau-7.json", import.meta.url), "utf8"),
) as TemoinDuNiveau7;

describe("une partie créée au niveau 7 avant le retrait du niveau", () => {
  it("le témoin est bien une partie de niveau 7 : profil figé, bloc de groupe, six tours joués", () => {
    expect(TEMOIN.profil.difficulty.level).toBe(7);
    expect(TEMOIN.profil.difficulty.decisions.croissanceExterne).toBe(true);
    expect(TEMOIN.profil.difficulty.decisions.externalisation).toBe(true);
    expect(TEMOIN.scenario.groupe).toBeDefined();
    expect(TEMOIN.etats).toHaveLength(4);
    expect(TEMOIN.tours.length).toBeGreaterThan(1);
  });

  it("son instantané se charge encore, bloc de groupe compris", () => {
    const relu = parseScenarioConfig(TEMOIN.scenario);
    expect(relu.groupe).toEqual(TEMOIN.scenario.groupe);
    expect(relu.groupe!.sousTraitance).toBeDefined();
    expect(relu.groupe!.valorisation).toBeDefined();
  });

  it("le gel de ses leviers tient : son profil rend le monde du niveau 7, pas celui d'une partie sans niveau", () => {
    const preset = presetFromProfile(TEMOIN.profil);
    expect(preset.level).toBe(7);
    // Le monde du niveau : aucun indice, aléas doublés (ceux de l'Executive).
    expect(preset.hintMaxLevel).toBe(0);
    expect(preset.eventProbabilityMultiplier).toBe(presetByLevel.get(6)!.eventProbabilityMultiplier);
    // Ses deux leviers restent ouverts : sans eux, le rachat et la
    // sous-traitance disparaîtraient d'une partie qui les a toujours eus.
    expect(preset.decisions.croissanceExterne).toBe(true);
    expect(preset.decisions.externalisation).toBe(true);
    // Et ce n'est pas le repli d'un profil illisible (niveau 3, tous les indices).
    expect(preset.level).not.toBe(LEGACY_PRESET.level);
    expect(preset.decisions).toEqual(TEMOIN.profil.difficulty.decisions);
  });

  it("elle se rejoue au centime, du premier tour au dernier", () => {
    expect(rejouerLaPartieDeNiveau7(TEMOIN)).toEqual(TEMOIN.tours);
  });

  it("le témoin a de la matière : des ventes, une valeur pour l'actionnaire, la sous-traitance engagée", () => {
    const tours = TEMOIN.tours as Record<
      string,
      { incomeStatement: { revenue: number }; groupe: { valeur?: { valeurParAction: number }; achats?: Record<string, number> } | null }
    >[];
    expect(tours[0]!.e0!.incomeStatement.revenue).toBeGreaterThan(0);
    const dernier = tours[tours.length - 1]!.e0!;
    expect(dernier.groupe!.valeur!.valeurParAction).toBeGreaterThan(0);
    expect(Object.values(dernier.groupe!.achats ?? {}).some((x) => x > 0)).toBe(true);
  });
});
