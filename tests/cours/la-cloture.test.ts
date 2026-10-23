import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { LA_CLOTURE, cloture } from "../../src/config/cours/chapitres/la-cloture";
import { echeance } from "../../src/config/cours/chapitres/l-emprunt";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, journalAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA CLÔTURE TIENT DANS LES NEUF ENTREPRISES.
 *
 * La balance avant inventaire, rangée en grandes masses, redonne le résultat avant impôt
 * de l'arène (au centime, à l'arrondi du stock près) ; elle s'équilibre et ne porte que
 * des comptes du plan ; les étapes de stock n'existent que là où il y a un stock, l'écriture
 * d'impôt que là où il y a un bénéfice ; au bout du journal, le compte de résultat donne le
 * résultat net du chapitre ; l'impôt se calcule sur l'année ; aucun texte ne sort un
 * « undefined ».
 */

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

describe.each(ENTREPRISES_DU_COURS)("la clôture chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = cloture(cas);
  const chapitre = chapitreDuCas(LA_CLOTURE, cas);

  it("la balance redonne le résultat avant impôt de l'arène, s'équilibre, et ne porte que des comptes du plan", () => {
    expect(Math.abs(k.resultatAvantImpot - k.arene.resultatAvantImpot)).toBeLessThan(2);
    const ouverture = LA_CLOTURE.ouverture!(cas);
    expect(equilibree(ouverture)).toBe(true);
    for (const l of ouverture.lignes) expect(compteDuPlan(l.compte), l.compte).toBeDefined();
    expect(journalAvant(chapitre, cas, 0)).toEqual([ouverture]);
    expect(compteDeResultat(etatAvant(chapitre, cas, 0).soldes).resultat).toBeCloseTo(k.resultatAvantInventaire, 2);
  });

  it("les étapes de stock n'existent que là où il y a un stock, l'écriture d'impôt que là où il y a un bénéfice", () => {
    const ids = new Set(chapitre.etapes.map((e) => e.id));
    expect(ids.has("stock-initial")).toBe((cas.annee.stock?.initial ?? 0) > 0);
    expect(ids.has("stock-final")).toBe((cas.annee.stock?.final ?? 0) > 0);
    expect(ids.has("ecriture-impot")).toBe(k.resultatAvantImpot > 0);
    expect(ids.has("la-perte")).toBe(k.resultatAvantImpot <= 0);
  });

  it("chaque écriture se corrige juste ; au bout du journal, le compte de résultat donne le résultat net ; l'impôt est celui de l'année", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(compteDeResultat(fin).resultat).toBeCloseTo(k.resultatNet, 2);
    expect(k.impot).toBe(k.resultatAvantImpot > 0 ? Math.round(k.resultatAvantImpot * k.tauxIS) : 0);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("la clôture, quelle que soit l'entreprise", () => {
  it("est réservée, au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(LA_CLOTURE.libre).toBe(false);
    expect(LA_CLOTURE.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of LA_CLOTURE.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(LA_CLOTURE.etapes.map((e) => e.id)).size).toBe(LA_CLOTURE.etapes.length);
  });

  it("les intérêts courus : du 3 octobre au 31 décembre, 87 jours sur 90 de l'échéance de janvier", () => {
    const cas = casDeLEntreprise("nova");
    const k = cloture(cas);
    expect(k.joursDansLExercice).toBe(87);
    expect(k.icne).toBeCloseTo((echeance(cas, 4).interets * 87) / 90, 2);
  });

  it("les deux cas de l'impôt existent : des entreprises imposées, d'autres en perte ; et l'arène s'écarte de l'impôt annuel quelque part", () => {
    const k = ENTREPRISES_DU_COURS.map((c) => cloture(casDeLEntreprise(c)));
    expect(k.some((x) => x.impot > 0)).toBe(true);
    expect(k.some((x) => x.impot === 0)).toBe(true);
    expect(k.some((x) => Math.abs(x.arene.impot - x.impot) >= 1)).toBe(true);
  });
});
