import { describe, expect, it } from "vitest";
import { LES_CONTRATS_A_LONG_TERME as CH } from "../../src/config/cours/chapitres/les-contrats-a-long-terme";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_CHANTIER_QUI_DERAPE, chantierQuiDerape } from "../../src/config/cours/situations/par-chapitre/le-chantier-qui-derape";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { reponseSansIndice } from "./gardes-de-l-ue10";

/**
 * LES CONTRATS À LONG TERME (DCG UE10), ET LEUR CAS, CHEZ NOVA.
 *
 * Refait à la main : 180 000 € de prix, 150 000 € de coût total estimé, 60 000 € engagés et
 * 50 000 € facturés au 31 décembre N + 1 ; le cas réestime le coût à 195 000 €.
 */

const r2 = (x: number) => Math.round(x * 100) / 100;

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 4, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(CH, PROGRAMME["dcg-comptabilite-approfondie"][4]!);
    expect(CH.blocs).toContain("DCG UE10 · Comptabilité approfondie");
    gardeDuCas(LE_CHANTIER_QUI_DERAPE, CH);
    reponseSansIndice(LE_CHANTIER_QUI_DERAPE);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(CH);
    reponseSansIndice(CH);
  });
});

describe("le contrat à l'avancement", () => {
  it("40 % d'avancement, 72 000 € de chiffre d'affaires, 12 000 € de marge, 22 000 € à facturer", () => {
    const av = 60_000 / 150_000;
    expect(attendus(CH, "l-avancement")).toEqual([av * 100, 180_000 * av, 180_000 * av - 60_000, 180_000 * av - 50_000]);
    expect(attendus(CH, "l-avancement")).toEqual([40, 72_000, 12_000, 22_000]);
    expect(juste(CH, "l-achevement")).toEqual(["Une marge nulle : les coûts passent en travaux en cours"]);
  });

  it("à 195 000 €, 15 000 € de perte, dont 4 615,38 € par l'avancement et 10 384,62 € de provision", () => {
    const av = 60_000 / 195_000;
    const parLAvancement = r2(180_000 * av) - 60_000;
    expect(r2(parLAvancement)).toBe(-4_615.38);
    expect(attendus(CH, "la-perte-a-terminaison")).toEqual([15_000, r2(parLAvancement), r2(15_000 + parLAvancement)]);
  });

  it("le curseur : à 180 milliers d'euros de coût, le contrat s'équilibre ; à 181, il perd", () => {
    gardeDuCurseur(CH, "le-cout-qui-fait-perdre", 180);
  });

  it("le laboratoire : 18 000 € de résultat à 90 000 € engagés, 60 % de 30 000 € de marge", () => {
    expect(0.6 * 30_000).toBe(18_000);
    const e = gardeDuLaboratoire(CH, "le-laboratoire-de-l-avancement");
    expect(e.defi(NOVA).solution).toEqual({ couts: 90_000 });
  });
});

describe("le cas du chapitre", () => {
  it("le chantier qui dérape : 30,77 %, 10 384,62 € de provision, 15 000 € de perte en N + 1", () => {
    const a = chantierQuiDerape();
    expect([a.avancementPct, a.provisionPourPerte, a.resultatDeLExercice]).toEqual([Math.round((60_000 / 195_000) * 10_000) / 100, r2(15_000 * (1 - 60_000 / 195_000)), -15_000]);
  });
});
