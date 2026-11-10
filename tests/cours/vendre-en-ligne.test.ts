import { describe, expect, it } from "vitest";
import { VENDRE_EN_LIGNE as CH } from "../../src/config/cours/chapitres/vendre-en-ligne";
import { cannibalisationSupportable, trimestreSurLaPlace } from "../../src/config/cours/monde/vente-en-ligne-de-nova";
import { LA_PLACE_DE_MARCHE_NEGOCIE, laPlaceNegocie } from "../../src/config/cours/situations/par-chapitre/la-place-de-marche-negocie";
import { attendusMk, casDuChapitreMk, gardeDuCasMk, gardeDuLaboratoireMk, gardeDuProgrammeMk, gardesDeTexteMk, justeMk } from "./gardes-de-la-mercatique";

/**
 * « VENDRE EN LIGNE » (mercatique 2.3), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main sur nova-gestion.ts : 1 270 + 1 130 + 1 418 = 3 818 enceintes en ligne ; 62 % : 2 367
 * depuis un téléphone, 2 367 × 59 = 139 653 €. La place de marché : 15 % de 59 € = 8,85 € ; 59 − 8,85 − 38 =
 * 12,15 €. Sur 600 ventes, une part c prise au site : 600 (1 − c) × 12,15 − 600 c × 8,85 − 400 ; à 54 %,
 * 276 × 12,15 − 324 × 8,85 − 400 = 86 € ; à 55 %, −40 €. Le cas, à 30 % : 420 × 12,15 − 180 × 8,85 − 400 =
 * 3 110 € ; 420 × 13,92 − 180 × 7,08 − 1 200 = 3 372 € : la seconde, 262 € de plus.
 */

describe("le chapitre, dans son parcours", () => {
  it("cite le thème 2 de la mercatique, se joue chez NOVA", () => {
    gardeDuProgrammeMk(CH, "STMG Thème 2 · La distribution de l'offre");
    expect(CH.entreprises?.codes).toEqual(["nova"]);
  });

  it("textes propres, une seule bonne réponse, jamais la plus longue, chaque objectif travaillé", () => {
    gardesDeTexteMk(CH);
  });
});

describe("le site, le téléphone, la place de marché", () => {
  it("2 367 commandes depuis un téléphone, 139 653 €", () => {
    expect(attendusMk(CH, "le-m-commerce")).toEqual([2_367, 139_653]);
  });

  it("8,85 € de commission, 12,15 € de marge", () => {
    expect(attendusMk(CH, "la-commission")).toEqual([8.85, 12.15]);
  });

  it("le laboratoire : 54 % de ventes prises au site, pas 55 % ; une seule solution", () => {
    expect(cannibalisationSupportable()).toBe(54);
    expect(trimestreSurLaPlace(0.54).gain).toBe(86);
    expect(trimestreSurLaPlace(0.55).gain).toBe(-40);
    expect(gardeDuLaboratoireMk(CH, "le-laboratoire-des-ventes-prises").defi(casDuChapitreMk(CH)).solution).toEqual({ prises: 54 });
  });
});

describe("le cas du chapitre", () => {
  it("à 30 % : 3 110 € et 3 372 € ; la seconde offre, 262 € de plus", () => {
    gardeDuCasMk(LA_PLACE_DE_MARCHE_NEGOCIE, CH);
    const r = laPlaceNegocie();
    expect([r.margePremiere, r.margeSeconde, r.premiere.gain, r.seconde.gain, r.meilleure, r.ecart]).toEqual([12.15, 13.92, 3_110, 3_372, "seconde", 262]);
    expect(justeMk(LA_PLACE_DE_MARCHE_NEGOCIE, "reponse")[0]).toMatch(/^Prenons la seconde/);
  });
});
