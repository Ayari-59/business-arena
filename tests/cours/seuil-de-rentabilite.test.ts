import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { SEUIL_DE_RENTABILITE, chiffresDeGestion } from "../../src/config/cours/chapitres/seuil-de-rentabilite";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import type { Etape } from "../../src/config/cours/types";
import type { Cas } from "../../src/config/cours/cas";

/**
 * LE SEUIL DE RENTABILITÉ TIENT DANS LES NEUF ENTREPRISES.
 *
 * Le seuil est la plus petite quantité qui ne fait pas perdre d'argent : la simulation
 * le confirme à l'unité près (résultat positif ou nul au seuil, négatif juste avant).
 * Le compte de résultat différentiel boucle, une baisse de prix relève le seuil, les
 * deux cas (seuil atteint ou non en janvier) existent et se disent, et aucun texte ne
 * sort un « undefined » ou un « NaN ».
 */

const chapitre = SEUIL_DE_RENTABILITE;
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi, String(x.montant)]), ...e.explication(cas)];
    case "curseur": {
      const { attendu } = e.cible(cas);
      return [e.question(cas), ...e.lecture(cas, attendu).map((l) => `${l.libelle} ${l.montant}`), ...e.explication(cas)];
    }
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le seuil de rentabilité chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const g = chiffresDeGestion(cas);

  it("le compte de résultat différentiel boucle, et les charges fixes sont celles du tri", () => {
    expect(g.marge).toBeCloseTo(g.chiffreDAffaires - g.chargesVariables, 2);
    expect(g.resultat).toBeCloseTo(g.marge - g.chargesFixes, 2);
    const tri = chapitre.etapes.find((e) => e.type === "tri")!;
    if (tri.type !== "tri") throw new Error("tri attendu");
    const elements = tri.elements(cas);
    const fixes = elements.filter((x) => x.categorie === "fixe").reduce((s, x) => s + x.montant, 0);
    const variables = elements.filter((x) => x.categorie === "variable").reduce((s, x) => s + x.montant, 0);
    expect(fixes).toBeCloseTo(g.chargesFixes, 2);
    expect(variables).toBeCloseTo(g.chargesVariables, 2);
  });

  it("la simulation confirme le seuil à l'unité près, et le curseur va au-delà", () => {
    const curseur = chapitre.etapes.find((e) => e.type === "curseur")!;
    if (curseur.type !== "curseur") throw new Error("curseur attendu");
    const { attendu, max } = curseur.cible(cas);
    expect(attendu).toBe(g.seuilQuantite);
    expect(max).toBeGreaterThan(attendu);
    const resultatA = (q: number) => curseur.lecture(cas, q).find((l) => l.fort)!.montant;
    expect(resultatA(attendu)).toBeGreaterThanOrEqual(-0.01);
    expect(resultatA(attendu - 1)).toBeLessThan(0);
  });

  it("une baisse de prix relève le seuil ; aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    expect(g.seuilBaisse === null || g.seuilBaisse > g.seuilQuantite).toBe(true);
    for (const e of chapitre.etapes) {
      for (const t of textesDe(e, cas)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("le seuil de rentabilité, quelle que soit l'entreprise", () => {
  it("les deux cas existent : des entreprises au-dessus du seuil en janvier, au moins une en dessous", () => {
    const resultats = ENTREPRISES_DU_COURS.map((c) => chiffresDeGestion(casDeLEntreprise(c)).resultat);
    expect(resultats.some((r) => r > 0)).toBe(true);
    expect(resultats.some((r) => r < 0)).toBe(true);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
