import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * LA TRACE DU MOTEUR EST UNE LISTE BLANCHE.
 *
 * Le moteur produit un résultat riche ; la base n'en garde qu'une sélection,
 * écrite à la clôture dans `engineTrace`, et la vue la relit avec un type qui
 * décrit ce qu'elle espère y trouver. Rien ne relie les deux listes : ajouter
 * un bloc au moteur et le lire à la relecture SANS l'écrire compile, passe les
 * tests unitaires, et le bloc disparaît simplement à la clôture.
 *
 * C'est arrivé : `supplier` était relu et jamais écrit, si bien que le
 * fournisseur choisi ne figurait dans aucun panneau de résultats. Ce test
 * confronte les deux listes.
 */

const RESOLUTION_SOURCE = readFileSync("src/services/round-resolution.service.ts", "utf-8");
const GAME_SOURCE = readFileSync("src/services/game-view.service.ts", "utf-8");

/** Contenu d'un littéral `{ … }` qui démarre à `ancre`, accolades comptées. */
function corpsApres(ancre: string, source: string, fichier: string): string {
  const debut = source.indexOf(ancre);
  expect(debut, `ancre introuvable dans ${fichier} : « ${ancre} »`).toBeGreaterThan(-1);
  let i = debut + ancre.length;
  let profondeur = 1;
  while (i < source.length && profondeur > 0) {
    if (source[i] === "{") profondeur += 1;
    else if (source[i] === "}") profondeur -= 1;
    i += 1;
  }
  return source.slice(debut + ancre.length, i - 1);
}

/** Clés de premier niveau d'un littéral (objet ou type). */
function clesDePremierNiveau(corps: string): Set<string> {
  const cles = new Set<string>();
  let profondeur = 0;
  for (const ligne of corps.split("\n")) {
    if (profondeur === 0) {
      const m = /^\s*(\w+)\??\s*:/.exec(ligne);
      if (m) cles.add(m[1]!);
    }
    for (const c of ligne) {
      if (c === "{") profondeur += 1;
      else if (c === "}") profondeur -= 1;
    }
  }
  return cles;
}

describe("trace du moteur persistée", () => {
  it("tout bloc relu à l'affichage est bien écrit à la clôture", () => {
    const ecrites = clesDePremierNiveau(corpsApres("engineTrace: {", RESOLUTION_SOURCE, "round-resolution.service.ts"));
    const relues = clesDePremierNiveau(corpsApres("const trace = row.engineTrace as {", GAME_SOURCE, "game-view.service.ts"));

    expect(ecrites.size, "la liste écrite n'a pas été trouvée").toBeGreaterThan(5);
    expect(relues.size, "la liste relue n'a pas été trouvée").toBeGreaterThan(5);

    const manquantes = [...relues].filter((k) => !ecrites.has(k));
    expect(
      manquantes,
      `bloc(s) relu(s) mais jamais écrit(s) à la clôture : ${manquantes.join(", ")}`,
    ).toEqual([]);
  });
});
