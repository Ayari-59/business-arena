import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { VALEUR_AJOUTEE, valeurAjoutee } from "../../src/config/cours/chapitres/valeur-ajoutee-et-partage";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA VALEUR AJOUTÉE ET SON PARTAGE, SUR L'ANNÉE DE L'ARÈNE.
 *
 * La valeur ajoutée est celle des soldes de gestion ; ses parts la refont sans reste ; la plus
 * grosse part suit les montants.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("la valeur ajoutée chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const v = valeurAjoutee(cas);
  const chapitre = chapitreDuCas(VALEUR_AJOUTEE, cas);

  it("la valeur ajoutée est celle des soldes de gestion, et ses parts la refont sans reste", () => {
    expect(v.va).toBeCloseTo(v.k.s.valeurAjoutee, 1);
    expect(v.parts.reduce((t, p) => t + p.montant, 0)).toBeCloseTo(v.va, 1);
    expect(v.parts.reduce((t, p) => t + p.part, 0)).toBeCloseTo(100, 0);
    expect(v.tauxDeValeurAjoutee).toBeCloseTo((v.va / v.k.s.ventes) * 100, 1);
    expect(v.entreprise).toBeCloseTo(v.k.s.dotation + v.k.resultat, 1);
  });

  it("la plus grosse part suit les montants", () => {
    const etape = chapitre.etapes.find((e) => e.id === "premiere-part");
    if (etape?.type !== "choix") throw new Error("Pas d'étape premiere-part");
    const max = v.parts.reduce((a, b) => (b.montant > a.montant ? b : a));
    expect(etape.options(cas, { soldes: {} }).find((o) => o.juste)!.texte).toBe(max.nom);
  });

  it("la production se distingue des ventes quand le stock a bougé, et une part négative se dit négative", () => {
    const intro = chapitre.etapes.find((e) => e.id === "intro");
    if (intro?.type !== "lecture") throw new Error("Pas d'étape intro");
    const texte = intro.texte(cas).join(" ");
    expect(texte.includes("n'est pas tout à fait ses ventes"), "la production face aux ventes").toBe(v.k.produits !== v.k.s.ventes);
    expect(intro.tableau!(cas).lignes[0]!.libelle).toBe(v.k.produits === v.k.s.ventes ? "Ventes de l'année" : "Production de l'année (ventes et variation du stock de produits)");
    const synthese = chapitre.etapes.find((e) => e.id === "synthese");
    if (synthese?.type !== "lecture") throw new Error("Pas d'étape synthese");
    const fin = synthese.texte(cas).join(" ");
    expect(fin.includes("en garde -"), "« garder » une part négative").toBe(false);
    expect(fin.includes("est négative")).toBe(v.entreprise < 0);
    const partage = chapitre.etapes.find((e) => e.id === "partage");
    if (partage?.type !== "montants") throw new Error("Pas d'étape partage");
    const dit = partage.explication(cas, { soldes: {} }).join(" ");
    expect(dit.includes("financer sa croissance"), "une perte ne finance pas la croissance").toBe(v.entreprise >= 0);
    expect(dit.includes("Elle n'a rien pour financer sa croissance")).toBe(v.entreprise >= 0 && v.k.resultat < 0);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});

describe("les cas que le chapitre distingue se rencontrent dans le cours", () => {
  const toutes = ENTREPRISES_DU_COURS.map((c) => valeurAjoutee(casDeLEntreprise(c)));
  it("une production qui n'est pas les ventes, et une perte qui entame la part de l'entreprise", () => {
    expect(toutes.some((v) => v.k.produits !== v.k.s.ventes)).toBe(true);
    // Une perte que l'usure de l'équipement couvre encore : la part de l'entreprise reste positive.
    expect(toutes.some((v) => v.k.resultat < 0 && v.entreprise >= 0)).toBe(true);
    // Dans l'année corrigée, aucune perte ne dépasse plus l'usure de l'équipement : la branche
    // « part négative » n'est plus lue. Si une part négative revient, cette garde le dira.
    expect(toutes.filter((v) => v.entreprise < 0)).toHaveLength(0);
  });
});
