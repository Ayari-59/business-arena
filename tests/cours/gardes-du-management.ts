import { expect } from "vitest";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA } from "./gardes-de-nova";

/**
 * LES GARDES COMMUNES DU MANAGEMENT DE PREMIÈRE (lot B STMG), en plus de celles de NOVA
 * (gardes-de-nova.ts) : dans chaque question à choix, la bonne réponse n'est jamais la plus longue,
 * et le chapitre tient en vingt étapes au plus.
 */
export function bonneReponseJamaisLaPlusLongue(ch: Chapitre) {
  const servi = chapitreDuCas(ch, NOVA);
  expect(servi.etapes.length, `${ch.code} : plus de 20 étapes`).toBeLessThanOrEqual(20);
  servi.etapes.forEach((e, i) => {
    if (e.type !== "choix") return;
    const options = e.options(NOVA, etatAvant(servi, NOVA, i));
    const bonne = options.find((o) => o.juste)!;
    const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(bonne.texte.length, `${ch.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
  });
}
