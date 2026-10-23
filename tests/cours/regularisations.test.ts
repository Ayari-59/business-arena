import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { REGULARISATIONS, resultatsDesRegularisations } from "../../src/config/cours/chapitres/regularisations";
import { cloture } from "../../src/config/cours/chapitres/la-cloture";
import { PART_LIVREE_EN_JANVIER, assurance, factureAEtablir, factureNonParvenue, produitDAvance } from "../../src/config/cours/regularisations";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES RÉGULARISATIONS TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * L'assurance est la première formule de l'arène, à son prix : la prime annuelle vaut quatre
 * trimestres, et l'année n'en garde qu'un. La balance d'ouverture s'équilibre et s'écarte du
 * résultat de « La clôture » de l'achat et de la vente livrés fin décembre, et de la moitié
 * de commande servie en janvier ; une fois les quatre régularisations passées, le compte de
 * résultat redonne le résultat de l'arène moins un trimestre d'assurance, et le bilan
 * s'équilibre avec ses comptes de régularisation ; l'extourne solde la charge constatée
 * d'avance ; aucun texte ne sort un « undefined » ni un « de le ».
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "ecriture":
      return [e.evenement(cas), ...e.indices(cas), ...e.explication(cas, etat), e.ecriture(cas).libelle, ...e.ecriture(cas).lignes.flatMap((l) => [l.role, l.indice])];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("les régularisations chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const a = assurance(cas);
  const fnp = factureNonParvenue(cas);
  const fae = factureAEtablir(cas);
  const pca = produitDAvance(cas);
  const r = resultatsDesRegularisations(cas);
  const k = cloture(cas);
  const chapitre = chapitreDuCas(REGULARISATIONS, cas);

  it("l'assurance est la première formule de l'arène : quatre trimestres payés, un seul gardé", () => {
    const ins = scenarioByCode(code).scenario.insurance!;
    expect(a.formule).toBe(ins.formulas![0]!.name);
    expect(a.parTrimestre).toBe(ins.formulas![0]!.premiumPerRound);
    expect(a.annuelle).toBeCloseTo(4 * a.parTrimestre, 2);
    expect(a.davance).toBeCloseTo((a.annuelle * 9) / 12, 2);
    expect(a.chargeDeLAnnee).toBeCloseTo(a.parTrimestre, 2);
    const paiement = chapitre.etapes.find((e) => e.id === "assurance");
    if (paiement?.type !== "ecriture") throw new Error("étape assurance");
    // Pas de TVA sur une assurance.
    expect(paiement.ecriture(cas).lignes.some((l) => l.compte.startsWith("445"))).toBe(false);
  });

  it("la balance d'ouverture s'équilibre et s'écarte de la clôture de l'achat, de la vente et de la moitié servie en janvier", () => {
    const ouverture = REGULARISATIONS.ouverture!(cas);
    expect(equilibree(ouverture)).toBe(true);
    for (const x of ouverture.lignes) expect(compteDuPlan(x.compte), x.compte).toBeDefined();
    expect(ouverture.lignes.filter((x) => x.compte === "512")).toHaveLength(1);
    expect(ouverture.lignes.every((x) => x.debit >= 0 && x.credit >= 0)).toBe(true);
    const s = etatAvant(chapitre, cas, 0).soldes;
    expect(compteDeResultat(s).resultat).toBeCloseTo(k.resultatAvantImpot + fnp.ht - fae.ht + pca.enJanvier, 2);
    expect(r.balance).toBeCloseTo(compteDeResultat(s).resultat, 2);
    expect(pca.enJanvier).toBeCloseTo(fae.ht * PART_LIVREE_EN_JANVIER, 2);
  });

  it("chaque écriture se corrige juste ; régularisée, l'année redonne l'arène moins un trimestre d'assurance, et le bilan s'équilibre", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const y of x.lignes) expect(compteDuPlan(y.compte), `${e.id} : ${y.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const s = etatAvant(chapitre, cas, indexDeLEtape(chapitre, "resultat")).soldes;
    expect(compteDeResultat(s).resultat).toBeCloseTo(r.apres, 2);
    expect(r.apres).toBeCloseTo(k.resultatAvantImpot - a.parTrimestre, 2);
    expect(r.effet).toBeCloseTo(a.davance - fnp.ht + fae.ht - pca.enJanvier, 2);
    expect(r.sans).toBeCloseTo(r.balance - a.annuelle, 2);
    expect(s["486"]).toBeCloseTo(a.davance, 2);
    expect(-(s["487"] ?? 0)).toBeCloseTo(pca.enJanvier, 2);
    expect(-(s["408"] ?? 0)).toBeCloseTo(fnp.ttc, 2);
    expect(s["418"]).toBeCloseTo(fae.ttc, 2);
    const b = bilan(s);
    expect(b.totalActif).toBeCloseTo(b.totalPassif, 2);
    expect(b.actif.find((x) => x.libelle === "Charges constatées d'avance")?.montant).toBeCloseTo(a.davance, 2);
    expect(b.passif.find((x) => x.libelle === "Produits constatés d'avance")?.montant).toBeCloseTo(pca.enJanvier, 2);
  });

  it("l'extourne solde la charge constatée d'avance", () => {
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(fin["486"] ?? 0).toBeCloseTo(0, 2);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) {
        expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(t, `${e.id} : ${t}`).not.toMatch(/\b(de|à) les? /);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
