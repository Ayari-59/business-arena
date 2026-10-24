import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { PROMOTION_QUI_PAIE, promotion } from "../../src/config/cours/chapitres/promotion-qui-paie";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { ECART_DE_PRIX, prixRejoues } from "../../src/config/cours/decision";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA PROMOTION, CALCULÉE PUIS JOUÉE PAR L'ARÈNE.
 *
 * La remise est l'écart de « Décider » ; elle se prend tout entière sur la marge d'une
 * unité ; le volume nécessaire garde la marge du trimestre ; ce que l'arène vend en
 * promotion décide si elle paie, et la bonne explication suit les chiffres : servir le
 * surplus, ou buter sur le stock et la capacité.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

it("les trois commerces ne réagissent pas pareil à la même remise", () => {
  const issues = COMMERCES.map((code) => promotion(casDeLEntreprise(code)).gain >= 0);
  expect(issues).toContain(true);
  expect(issues).toContain(false);
});

describe.each(COMMERCES)("la promotion chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = promotion(cas);
  const [baisse, normal] = prixRejoues(code);
  const chapitre = chapitreDuCas(PROMOTION_QUI_PAIE, cas);

  it("la remise est celle de « Décider », et elle se prend tout entière sur la marge", () => {
    expect(p.remise).toBe(ECART_DE_PRIX * 100);
    expect(p.prixPromo).toBeCloseTo(p.prix * (1 - ECART_DE_PRIX), 2);
    expect(p.mcv - p.mcvPromo).toBeCloseTo(p.prix - p.prixPromo, 2);
    expect(p.baisseDeLaMarge).toBeGreaterThan(p.remise);
  });

  it("le volume nécessaire garde la marge du trimestre, et pas une unité de moins", () => {
    expect(p.volumeNecessaire * p.mcvPromo).toBeGreaterThanOrEqual(p.margeNormale - 0.5);
    expect((p.volumeNecessaire - 1) * p.mcvPromo).toBeLessThan(p.margeNormale);
    expect(p.volumeNecessaire).toBeGreaterThan(p.quantite);
  });

  it("ce que l'arène vend en promotion décide, et la bonne explication suit les chiffres", () => {
    expect(p.quantite).toBe(normal!.quantite);
    expect(p.quantitePromo).toBe(baisse!.quantite);
    expect(p.gain).toBe(p.margePromo - p.margeNormale);
    expect(p.gain >= 0).toBe(p.quantitePromo >= p.volumeNecessaire);
    const pourquoi = chapitre.etapes.find((e) => e.id === "pourquoi");
    if (pourquoi?.type !== "choix") throw new Error("Pas d'étape pourquoi");
    const juste = pourquoi.options(cas, { soldes: {} }).find((o) => o.juste)!;
    // L'arène a-t-elle vendu plus en promotion ? Lu sur ses chiffres, pas sur l'indicateur du chapitre.
    const aVenduPlus = baisse!.quantite > normal!.quantite * 1.01;
    expect(p.aSuivi).toBe(aVenduPlus);
    expect(juste.texte).toMatch(aVenduPlus ? /ont répondu/ : /ne pouvait pas vendre plus/);
    if (!aVenduPlus) expect(baisse!.perdues).toBeGreaterThan(normal!.perdues);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
