import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { IMMOBILISATIONS, compteDAmortissement, planDAmortissement } from "../../src/config/cours/chapitres/immobilisations";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { etatAvant } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES IMMOBILISATIONS TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * Le plan d'amortissement répartit exactement la valeur brute ; la durée est celle de la
 * simulation ; la dotation s'enregistre sur un compte d'amortissement du plan et le bilan
 * montre la valeur nette ; la dotation ne touche pas la banque ; la revente donne une
 * moins-value, comme dans l'arène ; aucun texte ne sort un « undefined » ou un « NaN ».
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

describe.each(ENTREPRISES_DU_COURS)("les immobilisations chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = planDAmortissement(cas);

  it("le plan répartit exactement la valeur brute, sur la durée de la simulation", () => {
    expect(Number.isInteger(p.duree)).toBe(true);
    expect(p.duree * 12).toBe(cas.gestion.dureeAmortissementMois);
    expect(p.joursPremiereAnnee).toBeGreaterThan(0);
    expect(p.joursPremiereAnnee).toBeLessThanOrEqual(360);
    expect(p.premiere).toBeLessThan(p.annuite);
    expect(p.derniere).toBeGreaterThan(0);
    expect(p.premiere + p.annuite * (p.duree - 1) + p.derniere).toBeCloseTo(p.base, 2);
    expect(p.vncFinAnnee2).toBeGreaterThan(0);
  });

  it("la dotation s'enregistre sur un compte d'amortissement du plan ; le bilan montre la valeur nette, la banque ne bouge pas", () => {
    expect(compteDuPlan(p.compteAmortissement), p.compteAmortissement).toBeDefined();
    for (const e of IMMOBILISATIONS.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) {
        expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
        for (const x of l.acceptes ?? []) expect(compteDuPlan(x), `${e.id} : ${x}`).toBeDefined();
      }
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
    const i = IMMOBILISATIONS.etapes.findIndex((e) => e.id === "dotation");
    const avant = etatAvant(IMMOBILISATIONS, cas, i).soldes;
    const apres = etatAvant(IMMOBILISATIONS, cas, i + 1).soldes;
    expect(apres["512"]).toBe(avant["512"]);
    expect(compteDeResultat(apres).totalCharges).toBeCloseTo(p.premiere, 2);
    expect(bilan(apres).actif.find((l) => l.libelle === "Immobilisations")!.montant).toBeCloseTo(p.vncFinAnnee1, 2);
  });

  it("la revente se fait sous la valeur nette, comme dans l'arène : une moins-value", () => {
    expect(cas.immobilisation.ratioDeRevente).toBeLessThan(1);
    expect(p.vncRevente).toBeGreaterThan(0);
    expect(p.resultatRevente).toBeLessThan(0);
    expect(p.cumulRevente).toBeCloseTo(p.premiere + p.annuite + p.dotationRevente, 2);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    for (const [k, e] of IMMOBILISATIONS.etapes.entries()) {
      const etat = etatAvant(IMMOBILISATIONS, cas, k);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("les immobilisations, quelle que soit l'entreprise", () => {
  it("est réservé, au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(IMMOBILISATIONS.libre).toBe(false);
    expect(IMMOBILISATIONS.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of IMMOBILISATIONS.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(IMMOBILISATIONS.etapes.map((e) => e.id)).size).toBe(IMMOBILISATIONS.etapes.length);
  });

  it("le prorata compte le jour de mise en service : du 6 janvier, 355 jours ; le compte d'amortissement est 28 suivi du compte sans le 2", () => {
    expect(planDAmortissement(casDeLEntreprise("nova")).joursPremiereAnnee).toBe(355);
    expect(compteDAmortissement("2154")).toBe("28154");
    expect(compteDAmortissement("2182")).toBe("28182");
  });

  it("une dotation passée au crédit du compte de l'équipement est refusée : l'usure se cumule à part", () => {
    const cas = casDeLEntreprise("nova");
    const p = planDAmortissement(cas);
    const etape = IMMOBILISATIONS.etapes.find((x) => x.id === "dotation")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "6811", debit: String(p.premiere).replace(".", ","), credit: "" },
        { compte: cas.immobilisation.compte, debit: "", credit: String(p.premiere).replace(".", ",") },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
  });
});
