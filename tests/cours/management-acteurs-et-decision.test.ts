import { describe, expect, it } from "vitest";
import { DECIDER_ENSEMBLE, troisFacons } from "../../src/config/cours/chapitres/decider-ensemble";
import { anneeDecidee } from "../../src/config/cours/monde/direction-de-nova";
import { PROGRAMME } from "../../src/config/cours/registre";
import { CHACUN_SON_LEVIER, chacunSonLevier } from "../../src/config/cours/situations/par-chapitre/chacun-son-levier";
import type { Situation } from "../../src/config/cours/situations/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * DÉCIDER ENSEMBLE SUR LE MONDE DU COURS (lot M6), ET SON CAS, CHEZ NOVA. « Les acteurs et la
 * valeur », l'autre chapitre de management de ce fichier, est gardé par gestion-de-base.test.ts.
 *
 * Refait à la main sur l'année N + 1 de NOVA : la demande de 5 800, 7 400, 6 200 et 7 800 enceintes,
 * la ligne de 7 000 et l'équipe de 7 200, 59 € et 38 € de coût variable, la droite 16 755 − 203 ×
 * prix, l'entretien de 4 500 € par trimestre (réparation de 7,5 points au budget de référence, usure
 * de 5), la prévention de 16 000 € (3,5 % de défauts, 5 % à 8 000 €), un contrôle de 6 000 € qui
 * trouve 80 % des défauts, 20 € une retouche, 100 € un retour, 3 ventes perdues par défaut livré.
 */

const c2 = (x: number) => Math.round(x * 100) / 100 + 0;

function reponseSansIndice(s: Situation) {
  const e = etape(chapitreDuCas(s, NOVA), s.etapes.at(-1)!.id, "choix");
  const options = e.options(NOVA, VIDE);
  const bonne = options.find((o) => o.juste)!;
  expect(bonne.texte.length, `${s.code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Le résultat des choix d'une année, refait à la main : marge − entretien − coûts de la qualité − marge des ventes perdues par les défauts. */
function resultatALaMain(production: number, prix: number, entretien: number, prevention: number, tauxDeDefaut: number) {
  const m = prix - 38;
  const defauts = production * tauxDeDefaut;
  const qualite = prevention + 6_000 + defauts * 0.8 * 20 + defauts * 0.2 * 100;
  return c2(production * m - entretien - qualite - defauts * 0.2 * 3 * m);
}

describe("le chapitre et son cas, dans leur parcours", () => {
  it("porte le titre du programme, au palier 1, chez NOVA seule, et son cas lui est dédié", () => {
    gardeDuProgramme(DECIDER_ENSEMBLE, PROGRAMME["stmg-management"][1]!);
    gardeDuCas(CHACUN_SON_LEVIER, DECIDER_ENSEMBLE);
    reponseSansIndice(CHACUN_SON_LEVIER);
  });

  it("textes propres, une seule bonne réponse, notions existantes, servis par le serveur", () => {
    gardesDeTexte(DECIDER_ENSEMBLE);
  });
});

describe("décider ensemble", () => {
  it("l'équipe garde le plan : 26 000 enceintes, 1 200 refusées, 461 774 € de résultat des choix", () => {
    const e = anneeDecidee();
    expect([e.production, e.refusees]).toEqual([5_800 + 7_000 + 6_200 + 7_000, 1_200]);
    expect(e.resultat).toBe(resultatALaMain(26_000, 59, 4 * 4_500, 16_000, 0.035));
    expect(e.resultat).toBe(461_774);
  });

  it("le commercial seul : à 53,10 €, 34 014 enceintes demandées, 28 000 vendues, 338 641,20 €", () => {
    // La droite : 16 755 − 203 × 53,10 = 5 975 enceintes, contre 4 778 à 59 €.
    const k = 5_975 / 4_778;
    const demande = [5_800, 7_400, 6_200, 7_800].map((d) => Math.round(d * k));
    expect(demande).toEqual([7_253, 9_254, 7_753, 9_754]);
    const c = troisFacons().b.commercial;
    expect([c.demande, c.production, c.refusees]).toEqual([34_014, 4 * 7_000, 34_014 - 28_000]);
    expect(c.resultat).toBe(resultatALaMain(28_000, 53.1, 18_000, 16_000, 0.035));
    expect(attendus(DECIDER_ENSEMBLE, "commercial")).toEqual([28_000 - 26_000, 6_014 - 1_200, c2(338_641.2 - 461_774)]);
  });

  it("le financier seul : la ligne à 2 250 € par trimestre perd 1,25 point par trimestre, 25 649 enceintes, 453 301,93 €", () => {
    // Réparation 7,5 points au budget de référence, usure 5 : 7,5 × 2 250 ÷ 4 500 − 5 = −1,25 point par trimestre.
    const outil = [1, 0.9875, 0.975, 0.9625].map((d) => Math.floor(7_000 * d + 1e-9));
    const production = Math.min(5_800, outil[0]!) + Math.min(7_400, outil[1]!) + Math.min(6_200, outil[2]!) + Math.min(7_800, outil[3]!);
    expect(production).toBe(25_649);
    const f = troisFacons().b.financier;
    expect(f.production).toBe(production);
    expect(f.resultat).toBe(resultatALaMain(25_649, 59, 4 * 2_250, 8_000, 0.05));
    expect(attendus(DECIDER_ENSEMBLE, "financier")).toEqual([(18_000 + 16_000) - (9_000 + 8_000), 25_649 - 26_000, c2(453_301.93 - 461_774)]);
    expect(juste(DECIDER_ENSEMBLE, "meilleur-resultat")).toEqual(["L'équipe"]);
  });

  it("le curseur : à 62 €, Noël demande 6 806 enceintes, sous les 7 000 de la ligne ; à 61 €, 7 137", () => {
    gardeDuCurseur(DECIDER_ENSEMBLE, "le-prix-qui-sert-noel", 62);
    expect(Math.round((7_800 * (16_755 - 203 * 62)) / 4_778)).toBe(6_806);
    expect(Math.round((7_800 * (16_755 - 203 * 61)) / 4_778)).toBe(7_137);
  });

  it("le laboratoire : seuls 62 € et les budgets du plan ne refusent aucun client ; budgets coupés, la ligne usée en refuse 69", () => {
    const e = gardeDuLaboratoire(DECIDER_ENSEMBLE, "le-laboratoire-de-l-equipe");
    expect(e.defi(NOVA).solution).toEqual({ prix: 62, budgets: 1 });
    // Noël à 62 € : 6 806 demandées, 6 737 que la ligne usée peut monter.
    expect(anneeDecidee({ prix: 62, budgets: 0.5 }).refusees).toBe(6_806 - Math.floor(7_000 * 0.9625));
  });
});

describe("le cas du chapitre", () => {
  it("chacun son levier : 53,10 € et les budgets coupés refusent 6 540 enceintes et font 329 958,48 €", () => {
    const k = chacunSonLevier();
    expect([k.p.refusees, k.p.resultat, k.verdict]).toEqual([6_540, 329_958.48, "l-equipe"]);
    expect(k.p.resultat).toBe(resultatALaMain(k.p.production, 53.1, 9_000, 8_000, 0.05));
  });
});
