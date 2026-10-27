import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { LES_STOCKS, arrete } from "../../src/config/cours/chapitres/les-stocks";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { etatAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES STOCKS SE JOUENT DANS LES ENTREPRISES QUI EN ONT UN.
 *
 * Le chapitre ne s'ouvre que là où l'arène garde un stock de marchandises au début et à la
 * fin d'un trimestre, et partout où elle en garde un (le stock du bâtiment n'en est pas un :
 * ce sont des chantiers en cours) ; le stock final suit les quantités du
 * moteur ; le coût des ventes boucle ; après les deux écritures d'inventaire, le résultat
 * du chapitre est exactement la marge commerciale ; aucun texte ne sort un « undefined ».
 */

const CODES = LES_STOCKS.entreprises!.codes;

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "ecriture":
      return [e.evenement(cas), ...e.indices(cas), ...e.explication(cas, etat), ...e.ecriture(cas).lignes.flatMap((l) => [l.role, l.indice])];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

it("le chapitre s'ouvre exactement dans les entreprises qui ont un stock de marchandises dans l'arène", () => {
  for (const code of ENTREPRISES_DU_COURS) {
    const cas = casDeLEntreprise(code);
    // Des marchandises : achetées au compte 607 pour être revendues. Le stock du bâtiment,
    // acheté au compte 601, est un chantier en cours, qui se compte autrement (« La clôture »).
    const marchandises = cas.stock !== null && cas.achat.compte.startsWith("607");
    expect(marchandises, code).toBe(CODES.includes(code));
  }
  expect(CODES.length).toBeGreaterThan(0);
});

describe.each(CODES)("les stocks chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const a = arrete(cas);

  it("le stock suit les quantités du moteur, et le coût des ventes boucle au coût moyen", () => {
    expect(a.initial.quantite).toBeGreaterThan(0);
    expect(a.final.quantite).toBe(a.initial.quantite + a.achats.quantite - a.vendues);
    expect(a.final.quantite).toBeGreaterThan(0);
    expect(a.coutDAchatDesVendues).toBeCloseTo(a.initial.valeur + a.achats.ht - a.final.valeur, 2);
    // Au coût moyen, ce qui est vendu vaut ses unités au coût moyen, à l'arrondi du centime près.
    expect(Math.abs(a.coutDAchatDesVendues - a.vendues * a.cump)).toBeLessThan((a.initial.quantite + a.achats.quantite) * 0.01);
    expect(a.marge).toBeGreaterThan(0);
  });

  it("chaque écriture s'équilibre et se corrige juste ; le résultat du chapitre est la marge commerciale", () => {
    for (const e of LES_STOCKS.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const fin = etatAvant(LES_STOCKS, cas, LES_STOCKS.etapes.length).soldes;
    expect(fin["6037"]).toBeCloseTo(a.variation, 2);
    expect(compteDeResultat(fin).resultat).toBeCloseTo(a.marge, 2);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    for (const [k, e] of LES_STOCKS.etapes.entries()) {
      const etat = etatAvant(LES_STOCKS, cas, k);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("les stocks, quelle que soit l'entreprise", () => {
  it("est réservé, au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(LES_STOCKS.libre).toBe(false);
    expect(LES_STOCKS.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of LES_STOCKS.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(LES_STOCKS.etapes.map((e) => e.id)).size).toBe(LES_STOCKS.etapes.length);
  });

  it("le stock final passé à l'envers est refusé : il entre au bilan, au débit", () => {
    const cas = casDeLEntreprise(CODES[0]!);
    const a = arrete(cas);
    const etape = LES_STOCKS.etapes.find((x) => x.id === "constatation-stock-final")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const montant = String(a.final.valeur).replace(".", ",");
    const c = corriger(
      [
        { compte: "6037", debit: montant, credit: "" },
        { compte: "37", debit: "", credit: montant },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("se passe au débit");
  });
});
