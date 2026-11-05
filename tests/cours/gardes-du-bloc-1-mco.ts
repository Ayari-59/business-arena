import { expect } from "vitest";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { BOUTIQUE, gardesDeTexte } from "./gardes-de-la-boutique";

/**
 * LES GARDES DES CHAPITRES DU BLOC 1 DU BTS MCO ET DE LEURS CAS (la zone de chalandise, interroger les
 * clients, la vente conseil, fidéliser la clientèle), en plus des gardes communes de la boutique
 * (gardes-de-la-boutique.ts) : la bonne réponse d'un choix n'est jamais la plus longue ; un montant
 * attendu tient au centime ; un montant qui peut être négatif, la question dit avec quel signe le donner ;
 * aucun texte ne passe 40 mots par phrase ; les étapes ont des titres distincts.
 */

/** Les phrases d'un texte, coupées aux points. */
const phrases = (t: string) => t.split(/(?<=[.?!])\s+/u);
const mots = (p: string) => p.split(/\s+/u).filter((m) => /\p{L}|\d/u.test(m)).length;

export function gardesDuBloc1(source: Chapitre) {
  const ch = gardesDeTexte(source);
  expect(new Set(ch.etapes.map((e) => e.titre)).size, source.code).toBe(ch.etapes.length);
  for (const [i, e] of ch.etapes.entries()) {
    const etat = etatAvant(ch, BOUTIQUE, i);
    const textes: string[] = [];
    if (e.type === "choix") {
      const options = e.options(BOUTIQUE, etat);
      const juste = options.find((o) => o.juste)!;
      expect(juste.texte.length, `${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
      textes.push(e.question(BOUTIQUE, etat), ...options.flatMap((o) => [o.texte, o.retour]));
    }
    if (e.type === "montants") {
      const champs = e.champs(BOUTIQUE, etat);
      for (const c of champs) expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      if (champs.some((c) => c.attendu < 0)) expect(e.question(BOUTIQUE, etat), e.id).toMatch(/négatif s'il|négatif si elle/);
      textes.push(e.question(BOUTIQUE, etat), ...e.explication(BOUTIQUE, etat));
    }
    if (e.type === "lecture") textes.push(...e.texte(BOUTIQUE));
    if (e.type === "tri") textes.push(e.question(BOUTIQUE), ...e.explication(BOUTIQUE), ...e.elements(BOUTIQUE).map((x) => x.pourquoi));
    if (e.type === "curseur") textes.push(e.question(BOUTIQUE), ...e.explication(BOUTIQUE));
    if (e.type === "simulation") {
      const d = e.defi(BOUTIQUE);
      textes.push(e.question(BOUTIQUE), d.consigne, ...e.explication(BOUTIQUE, d.solution));
    }
    for (const t of textes) for (const p of phrases(t)) expect(mots(p), `${e.id} : ${p}`).toBeLessThanOrEqual(40);
  }
  return chapitreDuCas(source, BOUTIQUE);
}
