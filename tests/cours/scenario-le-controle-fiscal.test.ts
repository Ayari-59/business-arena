import { describe, expect, it } from "vitest";
import { scenariosDuChapitre } from "../../src/config/cours/scenarios";
import { LE_CONTROLE_FISCAL as s } from "../../src/config/cours/scenarios/le-controle-fiscal";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { RAPPEL_DE_LA_TVA_SANS_FACTURE, TAUX_DU_RAPPEL, chiffresDuControle, meilleureSuite, resultatDeLaSuite, toutesLesSuites } from "../../src/config/cours/monde/controle-fiscal-de-nova";
import { verifierUnScenario } from "../helpers/activites-du-cours";

/**
 * LE SCÉNARIO DU CONTRÔLE FISCAL (monde/controle-fiscal-de-nova.ts, scenarios/le-controle-fiscal.ts).
 * Chaque chiffre refait à la main depuis l'exercice N de NOVA et le chapitre « Sécuriser les
 * processus » ; chaque suite se calcule ; puis la forme, le service et la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const k = chiffresDuControle();

describe("le contrôle, chaque chiffre à la main", () => {
  it("les chiffres du monde", () => {
    // La TVA des douze factures d'Électro-Composants Lyon de N, à 20 %.
    expect(k.factures).toBe(12);
    expect(k.tvaDuFournisseur).toBe(c(f.facturesDeComposantsHt.reduce((t, ht) => t + c(ht * 0.2), 0)));
    expect(RAPPEL_DE_LA_TVA_SANS_FACTURE).toBe(1);
    expect(k.amende).toBe(5_000);
    // L'écart du cadrage : 11 800 € de facture à établir, − 7 080 € de produit constaté d'avance, + 448,40 € d'escompte.
    expect(k.cadrage.ecart).toBe(c(11_800 - 7_080 + 448.4));
    expect(TAUX_DU_RAPPEL).toBe(0.2);
    expect(k.rappelSurLEcart).toBe(c(5_168.4 * 0.2));
    expect([k.conservation, k.reprise]).toEqual([10, 3]);
  });

  it("la meilleure suite ne coûte rien ; les autres se chiffrent", () => {
    const b = meilleureSuite();
    expect(b.suite).toEqual({ armoire: "dix-ans", fichier: "fec", ecart: "cadrage" });
    expect(b.cout).toBe(0);
    const pire = resultatDeLaSuite({ armoire: "jeter", fichier: "papier", ecart: "rouvrir" });
    expect(pire.cout).toBe(c(k.tvaDuFournisseur + 5_000 + 1_033.68));
    expect(pire.fin).toBe("reecrite");
    expect(resultatDeLaSuite({ armoire: "reprise", fichier: "fec", ecart: "cadrage" })).toMatchObject({ cout: 0, conforme: false, fin: "fragile" });
    expect(new Set(toutesLesSuites().map((x) => resultatDeLaSuite(x).fin)).size).toBe(6);
  });
});

describe("la forme, le service et la langue", () => {
  it("trois décisions à trois options, au moins deux fins, une meilleure suite, que le chapitre ouvre", () => {
    expect(verifierUnScenario(s)).toEqual(["dix-ans", "fec", "cadrage"]);
    expect(scenariosDuChapitre("securiser-les-processus").map((y) => y.code)).toContain(s.code);
  });
});
