import { describe, expect, it } from "vitest";
import { BUREAUX, bureauParCode, bureauxDuChapitre, lienDuBureau } from "../../src/config/cours/bureaux";
import { LE_BESOIN_DE_L_ANNEE_TYPE as b, grilleDesDelais, grilleDuBesoinEnEuros, grilleNormativeDuBureau } from "../../src/config/cours/bureaux/le-besoin-de-l-annee-type";
import type { EtapeDeClassement, EtapeDeReponse } from "../../src/config/cours/bureaux/types";
import { bfrNormatif } from "../../src/config/cours/monde/bfr-normatif";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { textesDuBureau, verifierLaLangue, verifierLesQuestions } from "../helpers/activites-du-lot-e";

/**
 * LE BUREAU : LE BESOIN DE L'ANNÉE TYPE (bureaux/le-besoin-de-l-annee-type.ts, monde/bfr-normatif.ts).
 * Chaque délai et chaque chiffre refait à la main ; les tableaux justes avec leurs propres valeurs ; la
 * pile, les étapes, la langue.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = bfrNormatif();
const valeurs = (g: ReturnType<typeof grilleDesDelais>) => g.lignes.map((l) => l.cellules[0]!.valeur);

describe("les chiffres du besoin, à la main", () => {
  it("les délais relevés : 15 jours de stock, CampusTech à 80 (et non 60), 0, la TVA à 15 + 20, le fournisseur à 22, la paie à 13 et 30", () => {
    expect(valeurs(grilleDesDelais())).toEqual([30 / 2, 60 + 20, 0, 15 + 20, 22, 15 + 20, 28 - 15, 30 - 15 + 15]);
  });

  it("le chiffre d'affaires de l'année type : (18 789 + 12 × 320) × 59 €", () => {
    expect(x.caHt).toBe((18_789 + 12 * 320) * 59);
  });

  it("CampusTech : 3 840 × 59 × 1,2 ÷ le chiffre d'affaires, au dix-millième, × 80 jours", () => {
    const k = Math.round(((3_840 * 59 * 1.2) / x.caHt) * 10_000) / 10_000;
    expect(x.poste("campustech").coefficient).toBe(k);
    expect(x.poste("campustech").jours).toBe(c(80 * k));
  });

  it("la part fixe : le net × 13 ÷ 30, les cotisations × 30 ÷ 30 ; le besoin, la part variable moins la part fixe", () => {
    expect(x.paie.salairesNets).toBe(c((x.paie.netAPayer * 13) / 30));
    expect(x.paie.cotisations).toBe(x.paie.aVerser);
    expect(x.partVariable).toBe(c((x.joursVariables * x.caHt) / 360));
    expect(x.bfre).toBe(c(x.partVariable - x.paie.salairesNets - x.paie.cotisations));
    expect(x.bfre).toBe(27_976.72);
  });
});

describe("le bureau du besoin", () => {
  it("est enregistré, réservé, repris du chapitre « Le BFR d'exploitation normatif », sans compter parmi les cas dédiés", () => {
    expect(BUREAUX).toContain(b);
    expect(bureauParCode(b.code)).toBe(b);
    expect(bureauxDuChapitre("le-bfr-d-exploitation-normatif")).toEqual([b]);
    expect(lienDuBureau(b)).toBe("/cours/bureau/le-besoin-de-l-annee-type");
    expect(b.libre).toBe(false);
    const ch = CHAPITRES.find((y) => y.code === "le-bfr-d-exploitation-normatif")!;
    expect([b.parcours, b.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(197);
  });

  it("une pile de 5 à 9 pièces, 3 à 6 étapes, et chaque pièce que montre une étape existe", () => {
    expect(b.pile.length).toBeGreaterThanOrEqual(5);
    expect(b.pile.length).toBeLessThanOrEqual(9);
    expect(b.etapes.length).toBeGreaterThanOrEqual(3);
    expect(b.etapes.length).toBeLessThanOrEqual(6);
    for (const e of b.etapes) for (const p of e.pieces) expect(b.pile.map((y) => y.code), `${e.id} ${p}`).toContain(p);
  });

  it("classer la pile : la paie seule en part fixe, Sonora et l'emprunt écartés", () => {
    const e = b.etapes[0] as EtapeDeClassement;
    expect(e.elements.filter((y) => y.categorie === "fixe").map((y) => y.code)).toEqual(["paie"]);
    expect(e.elements.filter((y) => y.categorie === "ecarter").map((y) => y.code)).toEqual(["sonora", "emprunt"]);
    for (const y of e.elements) if (y.piece) expect(b.pile.map((p) => p.code)).toContain(y.piece);
  });

  it("les tableaux : cohérents, justes avec leurs propres valeurs ; le besoin tombe sur celui du monde", () => {
    for (const g of [grilleDesDelais(), grilleNormativeDuBureau(), grilleDuBesoinEnEuros()]) {
      expect(incoherencesDuTableau(g), g.titre).toEqual([]);
      expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste, g.titre).toBe(true);
    }
    expect(grilleDuBesoinEnEuros().lignes[4]!.cellules[0]!.valeur).toBe(x.bfre);
  });

  it("répondre au président : une seule bonne option, jamais la plus longue", () => {
    verifierLesQuestions((b.etapes.at(-1) as EtapeDeReponse).questions);
  });

  it("la langue de tout ce qui est servi", () => {
    verifierLaLangue(textesDuBureau(b));
  });
});
