import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import type { EtapeCurseur } from "../../src/config/cours/types";

/**
 * CHAQUE CURSEUR DU COURS A SA RÉPONSE, ET UNE SEULE.
 *
 * Dans chaque chapitre et chaque entreprise où il se joue, la position attendue est dans les
 * bornes du curseur ; c'est la première (ou la dernière, selon le sens) où le produit couvre
 * le coût : un pas plus tôt (ou plus loin), il ne le couvre plus. Le graphique et la réponse
 * disent donc la même chose. La lecture ne sort ni NaN ni « undefined ».
 */

const curseurs = CHAPITRES.flatMap((chapitre) =>
  ENTREPRISES_DU_COURS.filter((code) => !chapitre.entreprises || chapitre.entreprises.codes.includes(code)).flatMap((code) => {
    const cas = casDeLEntreprise(code);
    return chapitreDuCas(chapitre, cas)
      .etapes.filter((e): e is EtapeCurseur => e.type === "curseur")
      .map((etape) => ({ nom: `${chapitre.code} / ${etape.id} chez ${code}`, cas, etape }));
  }),
);

it("le cours a des curseurs dans plusieurs chapitres", () => {
  expect(new Set(curseurs.map((x) => x.nom.split(" / ")[0])).size).toBeGreaterThanOrEqual(4);
});

describe.each(curseurs)("$nom", ({ cas, etape }) => {
  it("la position attendue est dans les bornes, et c'est la bonne", () => {
    const { attendu, max, min = 0 } = etape.cible(cas);
    expect(Number.isInteger(attendu)).toBe(true);
    expect(attendu).toBeGreaterThanOrEqual(min);
    expect(attendu).toBeLessThanOrEqual(max);
    const d = etape.droites(cas);
    const couvre = (x: number) => d.produit(x) - d.cout(x) >= -1e-9;
    expect(couvre(attendu)).toBe(true);
    if (etape.sens === "plus-grande") {
      if (attendu + 1 <= max) expect(couvre(attendu + 1)).toBe(false);
    } else if (attendu - 1 >= min) {
      expect(couvre(attendu - 1)).toBe(false);
    }
  });

  it("la lecture et les textes ne sortent ni NaN ni undefined", () => {
    const { attendu } = etape.cible(cas);
    for (const l of etape.lecture(cas, attendu)) expect(Number.isFinite(l.montant), l.libelle).toBe(true);
    const g = etape.grandeur?.(cas);
    const r = etape.rates?.(cas);
    for (const t of [etape.question(cas), ...etape.explication(cas), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? ""]) {
      expect(t).not.toMatch(/undefined|NaN|Infinity|\[object/);
    }
  });
});
