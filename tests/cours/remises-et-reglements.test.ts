import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { REMISES_ET_REGLEMENTS, factureDAchat, factureDeVente } from "../../src/config/cours/chapitres/remises-et-reglements";
import { TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../../src/config/cours/remises";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * REMISES ET RÈGLEMENTS TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * La facture se calcule en cascade (brut, net commercial, net financier, TVA sur le net
 * financier) ; la vente s'enregistre au net commercial, la remise n'apparaît nulle part ;
 * au bout du journal, client et fournisseur sont soldés et le résultat ne porte que les
 * ventes, l'achat et les deux escomptes ; l'escompte ramené à l'année dépasse le taux de
 * l'emprunt, et la question le dit ; aucun texte ne sort un « undefined ».
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

describe.each(ENTREPRISES_DU_COURS)("remises et règlements chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const v = factureDeVente(cas);
  const a = factureDAchat(cas);
  const chapitre = chapitreDuCas(REMISES_ET_REGLEMENTS, cas);

  it("la facture se calcule en cascade, la TVA sur le net financier", () => {
    expect(v.brut).toBe(cas.venteCredit.ht);
    expect(v.netCommercial).toBeCloseTo(v.brut * (1 - TAUX_DE_REMISE), 1);
    expect(v.netFinancier).toBeCloseTo(v.netCommercial * (1 - TAUX_D_ESCOMPTE), 1);
    expect(v.tva).toBeCloseTo(v.netFinancier * v.tauxTva, 2);
    expect(v.ttc).toBeCloseTo(v.netFinancier + v.tva, 2);
    expect(a.tva).toBeCloseTo(a.netFinancier * a.tauxTva, 2);
  });

  it("chaque écriture se corrige juste ; client et fournisseur soldés ; le résultat ne porte que les ventes, l'achat et les escomptes", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const l of x.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(fin["411"] ?? 0).toBeCloseTo(0, 2);
    expect(fin["401"] ?? 0).toBeCloseTo(0, 2);
    expect(compteDeResultat(fin).resultat).toBeCloseTo(v.netCommercial - a.netCommercial - v.escompte + a.escompte, 2);
    // La remise ne s'écrit nulle part : la vente est au net commercial.
    expect(-(fin[cas.venteCredit.compte] ?? 0)).toBeCloseTo(v.netCommercial, 2);
  });

  it("l'escompte ramené à l'année dépasse le taux de l'emprunt ; aucun texte ne sort undefined ; une seule bonne réponse", () => {
    expect(a.joursGagnes).toBeGreaterThan(0);
    expect(a.vautLaPeine).toBe(true);
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
    }
  });
});

describe("remises et règlements, quelle que soit l'entreprise", () => {
  it("est réservé, au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(REMISES_ET_REGLEMENTS.libre).toBe(false);
    expect(REMISES_ET_REGLEMENTS.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of REMISES_ET_REGLEMENTS.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(REMISES_ET_REGLEMENTS.etapes.map((e) => e.id)).size).toBe(REMISES_ET_REGLEMENTS.etapes.length);
  });

  it("une vente passée au brut, remise en charge, est refusée : la remise baisse le prix", () => {
    const cas = casDeLEntreprise("nova");
    const v = factureDeVente(cas);
    const etape = REMISES_ET_REGLEMENTS.etapes.find((e) => e.id === "ecriture-de-vente")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const m = (x: number) => String(x).replace(".", ",");
    const c = corriger(
      [
        { compte: "411", debit: m(v.ttc), credit: "" },
        { compte: "665", debit: m(v.escompte + v.remise), credit: "" },
        { compte: "701", debit: "", credit: m(v.brut) },
        { compte: "44571", debit: "", credit: m(v.tva) },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("La vente, au net commercial : le montant ne convient pas. Pensez au net commercial");
  });
});
