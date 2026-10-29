import { expect } from "vitest";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { NOVA } from "./gardes-de-nova";

/**
 * LES GARDES PROPRES AUX CHAPITRES DE L'UE10 DU DCG (comptabilité approfondie), chez NOVA, en plus de
 * celles de gardes-de-nova.ts : à chaque question à choix, du chapitre ou de son cas, la bonne
 * réponse n'est jamais la plus longue (elle ne se devine pas à sa longueur).
 */
export function reponseSansIndice(source: Chapitre) {
  const ch = chapitreDuCas(source, NOVA);
  ch.etapes.forEach((e, i) => {
    if (e.type !== "choix") return;
    const options = e.options(NOVA, etatAvant(ch, NOVA, i));
    const bonne = options.find((o) => o.juste)!;
    const autres = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
    expect(bonne.texte.length, `${source.code} · ${e.id} : la bonne réponse est la plus longue`).toBeLessThan(autres);
  });
}
