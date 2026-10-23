import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import type { Cas } from "../../src/config/cours/cas";
import { COUT_PAR_PRODUIT, coutsParProduit } from "../../src/config/cours/chapitres/cout-par-produit";
import { gammeDuMois } from "../../src/config/cours/gamme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { SCENARIO_FAMILIES } from "../../src/config/scenarios/registry";

/**
 * LE COÛT PAR PRODUIT TIENT DANS LES SIX GAMMES DE L'ARÈNE.
 *
 * Le chapitre s'ouvre dans les entreprises qui jouent une gamme, et seulement elles ; les
 * charges communes se répartissent sans se perdre (au centime d'arrondi du coût de l'heure
 * près) ; les résultats des références font celui de la gamme ; l'abandon de la moins
 * rentable fait perdre, ni plus ni moins, sa marge sur coûts spécifiques. Les deux leçons
 * existent : une référence qui perd en coût complet, et une moins rentable qui se garde.
 */

const chapitre = COUT_PAR_PRODUIT;
const etat = { soldes: {} };
const AVEC_GAMME = chapitre.entreprises!.codes;

function textesDe(e: Etape, cas: Cas): string[] {
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

describe("les entreprises du chapitre", () => {
  it("sont celles qui jouent une gamme dans l'arène, six, chacune avec plusieurs références", () => {
    const familles = SCENARIO_FAMILIES.map((f) => f.head).filter((h) => ENTREPRISES_DU_COURS.includes(h));
    expect([...AVEC_GAMME].sort()).toEqual([...familles].sort());
    expect(AVEC_GAMME).toHaveLength(6);
    for (const code of ENTREPRISES_DU_COURS) {
      const g = gammeDuMois(code);
      if (AVEC_GAMME.includes(code)) expect(g!.references.length, code).toBeGreaterThanOrEqual(3);
      else expect(g, code).toBeNull();
    }
  });
});

describe.each(AVEC_GAMME)("le coût par produit chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = coutsParProduit(cas);

  it("chaque référence a ses ventes, son prix au-dessus de son coût variable, ses heures", () => {
    for (const l of k.parReference) {
      expect(l.quantite, l.nom).toBeGreaterThan(0);
      expect(l.prix, l.nom).toBeGreaterThan(l.coutVariableUnitaire);
      expect(l.heures, l.nom).toBeGreaterThan(0);
    }
  });

  it("le coût direct réunit le coût variable, la publicité et la qualité de la référence ; ses heures, celles de sa fiche", () => {
    const g = gammeDuMois(code)!;
    const communes = g.communes.structure + g.communes.entretien + g.communes.usure;
    expect(k.communes).toBeCloseTo(communes, 2);
    for (const r of g.references) {
      const l = k.parReference.find((x) => x.code === r.code)!;
      expect(l.direct, r.nom).toBeCloseTo(r.quantite * r.coutVariableUnitaire + r.publicite + r.qualite, 1);
      expect(l.heures, r.nom).toBeCloseTo(r.quantite * r.heuresParUnite, 1);
      expect(l.imputees, r.nom).toBeCloseTo(l.heures * k.coutDeLHeure, 1);
    }
  });

  it("les charges communes se répartissent sans se perdre, et les résultats font celui de la gamme", () => {
    // L'écart ne vient que du coût de l'heure arrondi au centime : un demi-centime par heure, au plus.
    expect(Math.abs(k.imputees - k.communes)).toBeLessThanOrEqual(k.heures * 0.005 + 0.01);
    const ca = k.parReference.reduce((s, l) => s + l.chiffreDAffaires, 0);
    const directs = k.parReference.reduce((s, l) => s + l.direct, 0);
    expect(k.resultat).toBeCloseTo(ca - directs - k.imputees, 1);
  });

  it("la moins rentable est bien la plus faible, et son abandon fait perdre sa marge sur coûts spécifiques", () => {
    for (const l of k.parReference) expect(k.faible.resultat).toBeLessThanOrEqual(l.resultat);
    const autres = k.parReference.filter((l) => l.code !== k.faible.code);
    // Sans elle : les autres références paient seules les mêmes charges communes.
    const sansElle = autres.reduce((s, l) => s + l.margeSpecifique, 0) - k.imputees;
    expect(k.resultatSansLaFaible).toBeCloseTo(sansElle, 1);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question ; des libellés uniques", () => {
    for (const e of chapitre.etapes) {
      for (const t of textesDe(e, cas)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") {
        const options = e.options(cas, etat);
        expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
        expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      }
      if (e.type === "montants") {
        const champs = e.champs(cas, etat);
        for (const c of champs) expect(Number.isFinite(c.attendu), e.id).toBe(true);
        expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      }
    }
  });
});

describe("le coût par produit, quelle que soit la gamme", () => {
  it("les deux leçons existent : une référence qui perd en coût complet, une moins rentable qui se garde", () => {
    const faibles = AVEC_GAMME.map((c) => coutsParProduit(casDeLEntreprise(c)).faible);
    expect(faibles.some((f) => f.resultat < 0)).toBe(true);
    expect(faibles.some((f) => f.resultat >= 0)).toBe(true);
    for (const f of faibles) expect(f.margeSpecifique, f.nom).toBeGreaterThan(0);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 3, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(3);
    expect(chapitre.parcours).toBe("controle-de-gestion");
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
