import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { simulateRound } from "@/engine/simulation";
import { botDecisions } from "@/engine/bots";
import { SCENARIOS } from "@/config/scenarios/registry";
import type { CompanyState, SimulationInput } from "@/engine/types";
import {
  decompositionDuResultat,
  type DecompositionDuResultat,
  type MarcheDuResultat,
} from "@/components/lecture-du-resultat";
import {
  CeQuiAFaitLeResultat,
  geometrieDeLaCascade,
} from "@/components/ce-qui-a-fait-le-resultat";

/**
 * UNE VRAIE CASCADE AU VERDICT (lot P3).
 *
 * « Ce qui a fait le résultat » était fait de barres indépendantes, chacune sur
 * son rail : on ne voyait pas le chiffre d'affaires fondre jusqu'au résultat.
 * C'est désormais un graphique en cascade. Ce que cette garde fige, sur les
 * comptes de VRAIS tours de chaque scénario et sur un tour en perte :
 *
 *   · AUTANT DE MARCHES QUE DE LIGNES : une marche dessinée par ligne de la
 *     décomposition, dans son ordre, ni plus ni moins ;
 *   · UNE SEULE ÉCHELLE : toutes les marches se posent sur le même axe, qui va
 *     du plus bas au plus haut niveau atteint (zéro compris) ;
 *   · LA PREMIÈRE MARCHE PART DE ZÉRO (le chiffre d'affaires, pleine) ;
 *   · LES MARCHES SONT RELIÉES : chaque charge commence au niveau que la
 *     précédente a laissé, et le filet qui les relie est à ce niveau-là ;
 *   · LA DERNIÈRE MARCHE PART DE ZÉRO : le résultat net est ancré à la ligne
 *     de base, et le filet qui y arrive tombe sur son extrémité ;
 *   · LA LIGNE DU ZÉRO EST VISIBLE QUAND LE RÉSULTAT EST NÉGATIF : elle passe
 *     au-dessus du bas de l'échelle, et la dernière marche plonge dessous ;
 *   · LE TEXTE EST À L'ENCRE ET SIGNÉ : aucun libellé ni montant à la couleur
 *     de sa série, et chaque montant porte son signe ;
 *   · LE TABLEAU LISIBLE PAR LECTEUR D'ÉCRAN : la liste porte un nom, chaque
 *     marche son libellé et son montant en texte, le dessin est `aria-hidden`.
 */

/** Trois tours d'un scénario, chaque entreprise jouée par un robot. */
function comptes(code: string) {
  const def = SCENARIOS.find((d) => d.code === code)!;
  let etats: CompanyState[] = [
    def.company("joueur", def.playerTeamName, "bot", "balanced"),
    ...def.bots.map((b) => def.company(b.id, b.name, "bot", b.profile)),
  ];
  const profils: Record<string, Parameters<typeof botDecisions>[0]> = {
    joueur: "balanced",
    ...Object.fromEntries(def.bots.map((b) => [b.id, b.profile])),
  };
  const sortie = [];
  for (let roundIndex = 1; roundIndex <= 3; roundIndex++) {
    const input = {
      scenario: def.scenario,
      roundIndex,
      companies: etats,
      decisions: Object.fromEntries(
        etats.map((e) => [
          e.id,
          botDecisions(profils[e.id]!, { scenario: def.scenario, state: e, roundIndex }),
        ]),
      ),
      activeEvents: [],
      seed: 23 + roundIndex,
    } as unknown as SimulationInput;
    const s = simulateRound(input);
    etats = s.companies;
    for (const e of etats) sortie.push(s.results[e.id]!.incomeStatement);
  }
  return sortie;
}

/** Une cascade écrite à la main, comme `decompositionDuResultat` la pose : un tour en perte. */
function enPerte(): DecompositionDuResultat {
  const lignes: [MarcheDuResultat["cle"], string, number][] = [
    ["ca", "Chiffre d'affaires", 297_124],
    ["variables", "Coûts variables", -207_013],
    ["structure", "Charges de structure", -103_096],
    ["sous-ebe", "Amortissements, intérêts, impôt", -8_605],
  ];
  const marches: MarcheDuResultat[] = [];
  let niveau = 0;
  for (const [cle, libelle, montant] of lignes) {
    marches.push({ cle, libelle, montant, debut: niveau, fin: niveau + montant });
    niveau += montant;
  }
  marches.push({ cle: "resultat", libelle: "Résultat net", montant: niveau, debut: 0, fin: niveau });
  return {
    chiffreDAffaires: 297_124,
    coutsVariables: 207_013,
    marge: 90_111,
    structure: 103_096,
    sousLExcedent: 8_605,
    resultat: niveau,
    marches,
  };
}

const proche = (a: number, b: number) => Math.abs(a - b) < 1e-9;

function verifierLaGeometrie(d: DecompositionDuResultat, nom: string) {
  const g = geometrieDeLaCascade(d.marches);
  // Autant de marches que de lignes, dans l'ordre.
  expect(g.map((m) => m.cle), nom).toEqual(d.marches.map((m) => m.cle));
  // Une seule échelle : tout entre 0 et 1, et les deux bornes atteintes.
  const toutes = g.flatMap((m) => [m.bas, m.haut, m.fin, m.zero]);
  for (const v of toutes) expect(v, nom).toBeGreaterThanOrEqual(-1e-9);
  for (const v of toutes) expect(v, nom).toBeLessThanOrEqual(1 + 1e-9);
  expect(Math.min(...toutes), nom).toBeCloseTo(0, 9);
  expect(Math.max(...toutes), nom).toBeCloseTo(1, 9);
  // Le zéro est le même pour toutes les marches.
  expect(new Set(g.map((m) => m.zero.toFixed(9))).size, nom).toBe(1);
  const zero = g[0]!.zero;
  // La première marche part de zéro, pleine.
  expect(g[0]!.ancree, nom).toBe(true);
  expect(proche(g[0]!.bas, zero) || proche(g[0]!.haut, zero), nom).toBe(true);
  // Les marches sont reliées : chacune reçoit le niveau que la précédente laisse,
  // et (sauf la dernière) commence là.
  for (let i = 1; i < g.length; i++) {
    expect(g[i]!.entree, `${nom} : marche ${i}`).toBeCloseTo(g[i - 1]!.fin, 9);
    if (i < g.length - 1) {
      const depart = g[i]!.sens === "baisse" ? g[i]!.haut : g[i]!.bas;
      expect(depart, `${nom} : la marche ${i} part du niveau atteint`).toBeCloseTo(g[i - 1]!.fin, 9);
    }
  }
  // La dernière part de zéro, et le filet qui y arrive tombe sur son extrémité.
  const der = g.at(-1)!;
  expect(der.cle).toBe("resultat");
  expect(der.ancree, nom).toBe(true);
  expect(proche(der.bas, zero) || proche(der.haut, zero), nom).toBe(true);
  expect(der.entree!, nom).toBeCloseTo(der.fin, 9);
  return { g, zero };
}

describe("la cascade du résultat : sa géométrie", () => {
  it.each(SCENARIOS.map((d) => d.code))("%s : sur de vrais tours", (code) => {
    let vus = 0;
    for (const cr of comptes(code)) {
      const d = decompositionDuResultat(cr);
      // Un tour sans aucun mouvement (rien vendu, rien dépensé) n'a pas d'échelle.
      if (d.marches.every((m) => m.montant === 0)) continue;
      verifierLaGeometrie(d, code);
      vus++;
    }
    expect(vus, `${code} : aucun tour à dessiner`).toBeGreaterThan(0);
  });

  it("un tour en perte : la ligne du zéro passe au-dessus du bas, la dernière marche plonge dessous", () => {
    const { g, zero } = verifierLaGeometrie(enPerte(), "perte");
    expect(zero).toBeGreaterThan(0.01);
    const der = g.at(-1)!;
    expect(der.sens).toBe("baisse");
    expect(der.haut).toBeCloseTo(zero, 9);
    expect(der.bas).toBeCloseTo(0, 9);
  });
});

describe("la cascade du résultat : son rendu", () => {
  const rendre = (d: DecompositionDuResultat, forme: "rituel" | "synthese" = "rituel") =>
    renderToStaticMarkup(createElement(CeQuiAFaitLeResultat, { decomposition: d, causes: [], forme }));

  it("autant de marches dessinées que de lignes, chacune avec sa géométrie et ses filets", () => {
    const d = enPerte();
    const html = rendre(d);
    const marches = [...html.matchAll(/<li data-marche="([\w-]+)"/g)].map((m) => m[1]);
    expect(marches).toEqual(d.marches.map((m) => m.cle));
    // Une barre par marche, un filet entrant sauf pour la première, un sortant sauf pour la dernière.
    expect(html.match(/class="cascade-barre /g)).toHaveLength(d.marches.length);
    expect(html.match(/cascade-lien-entrant/g)).toHaveLength(d.marches.length - 1);
    expect(html.match(/cascade-lien-sortant/g)).toHaveLength(d.marches.length - 1);
    // La ligne du zéro, sur chaque marche (elle est continue d'une colonne à l'autre).
    expect(html.match(/class="cascade-zero"/g)).toHaveLength(d.marches.length);
    // La première et la dernière partent de zéro.
    expect(html).toMatch(/<li data-marche="ca" data-sens="hausse" data-ancree=""/);
    expect(html).toMatch(/<li data-marche="resultat" data-sens="baisse" data-ancree=""/);
  });

  it("le texte est à l'encre et chaque montant porte son signe ; la couleur ne va qu'aux barres", () => {
    const html = rendre(enPerte(), "synthese");
    const valeurs = [...html.matchAll(/class="cascade-valeur ([^"]*)">([^<]*)</g)];
    expect(valeurs).toHaveLength(5);
    for (const [, classes, texte] of valeurs) {
      expect(classes).not.toMatch(/emerald|red|rose|donnee/);
      expect(texte).toMatch(/^[+−]/);
    }
    expect(valeurs[0]![2]).toMatch(/^\+297/);
    expect(valeurs[1]![2]).toMatch(/^−207/);
    expect(valeurs[4]![2]).toMatch(/^−21/);
    const libelles = [...html.matchAll(/class="cascade-libelle ([^"]*)"/g)];
    for (const [, classes] of libelles) expect(classes).not.toMatch(/emerald|red|rose|donnee/);
    // Les couleurs : produit en bleu donnée, charges en neutre, résultat en rouge franc.
    expect(html).toMatch(/data-marche="ca"[\s\S]*?cascade-barre bg-\[var\(--donnee\)\]/);
    expect(html).toMatch(/data-marche="variables"[\s\S]*?cascade-barre bg-\[var\(--cascade-charge\)\]/);
    expect(html).toMatch(/data-marche="resultat"[\s\S]*?cascade-barre bg-red-400/);
  });

  it("se lit au lecteur d'écran : une liste nommée, le dessin caché", () => {
    const html = rendre(enPerte());
    expect(html).toMatch(/<ol aria-label="La cascade du résultat[^"]*"/);
    expect(html.match(/<span aria-hidden="true" class="cascade-piste">/g)).toHaveLength(5);
    // Le dernier enfant de la marche du résultat est son montant (lu par l'e2e du rituel).
    expect(html).toMatch(/data-marche="resultat"[\s\S]*?<span class="cascade-valeur[^"]*">−21[^<]*<\/span><\/li>/);
  });
});
