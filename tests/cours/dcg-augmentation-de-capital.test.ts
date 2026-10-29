import { describe, expect, it } from "vitest";
import { L_AUGMENTATION_DE_CAPITAL as CH } from "../../src/config/cours/chapitres/l-augmentation-de-capital";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_PRIX_DE_L_INVESTISSEUSE, prixDeLInvestisseuse } from "../../src/config/cours/situations/par-chapitre/le-prix-de-l-investisseuse";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * L'AUGMENTATION DE CAPITAL (DCG UE10), ET SON CAS, CHEZ NOVA.
 *
 * Refait à la main : 15 000 actions de 10 € (150 000 €), 79 225,96 € de bénéfice en N, affecté sans
 * dividende ; 1 action nouvelle pour 3 anciennes, à 12 €.
 */

const r2 = (x: number) => Math.round(x * 100) / 100;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 4, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(CH, PROGRAMME["dcg-comptabilite-approfondie"][4]!);
    expect(CH.blocs).toContain("DCG UE10 · Comptabilité approfondie");
    gardeDuCas(LE_PRIX_DE_L_INVESTISSEUSE, CH);
    reponseSansIndice(LE_PRIX_DE_L_INVESTISSEUSE);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });
});

describe("l'affectation et l'augmentation", () => {
  it("la réserve légale : 5 % de 79 225,96 € = 3 961,30 € ; 229 225,96 € de capitaux propres", () => {
    expect(attendus(CH, "l-affectation")).toEqual([r2(79_225.96 * 0.05), r2(79_225.96 - 3_961.3), r2(150_000 + 79_225.96)]);
  });

  it("15,28 € avant, 5 000 actions nouvelles, 10 000 € de prime, 14,46 € après, 0,82 € de droit", () => {
    const avant = 229_225.96 / 15_000;
    const apres = (229_225.96 + 5_000 * 12) / 20_000;
    expect(attendus(CH, "les-valeurs")).toEqual([r2(avant), 15_000 / 3, 5_000 * (12 - 10), r2(apres), r2((avant - 12) / 4)]);
    expect(r2(avant) - r2(apres)).toBeCloseTo(0.82, 10);
    expect(juste(CH, "le-role-du-droit")[0]).toMatch(/^Il les vend/);
  });

  it("le curseur : 15 € ne dépassent pas les 15,28 € de l'action, 16 € si", () => {
    gardeDuCurseur(CH, "le-prix-le-plus-haut", 15);
  });

  it("le laboratoire : 1 pour 3 lève 60 000 € ; 1 pour 4, 45 000 €, ne suffit pas", () => {
    expect([(15_000 / 3) * 12, (15_000 / 4) * 12]).toEqual([60_000, 45_000]);
    const e = gardeDuLaboratoire(CH, "le-laboratoire-de-la-parite");
    expect(e.defi(NOVA).solution).toEqual({ parite: 3 });
  });
});

describe("le cas du chapitre", () => {
  it("à 11 € : 55 000 € levés, 5 000 € manquants, 5 000 € de prime, 1,07 € de droit", () => {
    const k = prixDeLInvestisseuse();
    expect([k.propose.fonds, k.manque, k.propose.prime, k.propose.droit]).toEqual([5_000 * 11, 60_000 - 55_000, 5_000 * 1, r2((229_225.96 / 15_000 - 11) / 4)]);
  });
});
