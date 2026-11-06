import { describe, expect, it } from "vitest";
import { scenariosDuChapitre } from "../../src/config/cours/scenarios";
import { L_OBJECTIF_DU_PRESIDENT as s } from "../../src/config/cours/scenarios/l-objectif-du-president";
import { OBJECTIF_ANNONCE_A_LA_BANQUE, PRIX_DU_JEU_APRES_NOEL } from "../../src/config/cours/chapitres/depreciations-et-provisions";
import { meilleureSuite, prudenceDuScenario, resultatDeLaSuite, toutesLesSuites } from "../../src/config/cours/monde/objectif-du-president";
import { verifierUnScenario } from "../helpers/activites-du-cours";

/**
 * LE SCÉNARIO DE L'OBJECTIF DU PRÉSIDENT (monde/objectif-du-president.ts,
 * scenarios/l-objectif-du-president.ts). Chaque chiffre refait à la main depuis la prudence du chapitre
 * « Dépréciations et provisions » ; chaque suite se calcule ; puis la forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const p = prudenceDuScenario();

describe("la prudence de NOVA, chaque chiffre à la main", () => {
  it("les chiffres du chapitre", () => {
    expect(p.resultatSansPrudence).toBe(106_957.96);
    expect(OBJECTIF_ANNONCE_A_LA_BANQUE).toBe(90_000);
    // Sonora : 33 630 € TTC, 28 025 € HT, 40 % de perte probable.
    expect(p.depreciation).toEqual({ attendre: 0, "hors-taxes": c(28_025 * 0.4), "toutes-taxes": c(33_630 * 0.4) });
    expect(p.provision).toEqual({ rien: 0, probable: 5_000, demande: 12_000 });
    // Le stock : 600 jeux à 22,50 €, soldés 21,50 € ; la ligne : 50 138,89 € de valeur nette, 40 % à l'occasion.
    expect(PRIX_DU_JEU_APRES_NOEL).toBe(21.5);
    expect(p.autres).toEqual({ garder: 0, stock: c(600 * (22.5 - 21.5)), ligne: c(50_138.89 - c(50_138.89 * 0.4)) });
  });

  it("la meilleure suite : la seule fidèle, 90 747,96 €, l'objectif tenu", () => {
    const b = meilleureSuite();
    expect(b.suite).toEqual({ creance: "hors-taxes", litige: "probable", stock: "garder" });
    expect(b.resultat).toBe(c(106_957.96 - 11_210 - 5_000));
    expect(b.objectifTenu).toBe(true);
    expect(b.impot).toBe(18_437);
  });

  it("chaque suite se calcule : 27 suites, trois fins", () => {
    const toutes = toutesLesSuites().map(resultatDeLaSuite);
    expect(toutes).toHaveLength(27);
    expect(new Set(toutes.map((r) => r.fin))).toEqual(new Set(["oubliee", "excessive", "fidele"]));
    // Sans aucune prudence : 106 957,96 €, l'objectif tenu, mais 16 210 € de trop.
    const rien = resultatDeLaSuite({ creance: "attendre", litige: "rien", stock: "garder" });
    expect([rien.resultat, rien.ecartALImageFidele, rien.fin]).toEqual([106_957.96, 16_210, "oubliee"]);
    // Trop prudent : le toutes taxes comprises et la demande du client font manquer l'objectif.
    const trop = resultatDeLaSuite({ creance: "toutes-taxes", litige: "demande", stock: "garder" });
    expect(trop.resultat).toBe(c(106_957.96 - 13_452 - 12_000));
    expect(trop.objectifTenu).toBe(false);
  });
});

describe("la forme, le service et la langue", () => {
  it("trois décisions à trois options, au moins deux fins, une meilleure suite, que le chapitre ouvre", () => {
    expect(verifierUnScenario(s)).toEqual(["hors-taxes", "probable", "garder"]);
    expect(scenariosDuChapitre("depreciations-et-provisions").map((y) => y.code)).toContain(s.code);
  });
});
