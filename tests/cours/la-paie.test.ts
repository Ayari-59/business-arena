import { describe, expect, it } from "vitest";
import { casDeLEntreprise, TAUX_PATRONAL, TAUX_SALARIAL } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { LA_PAIE } from "../../src/config/cours/chapitres/la-paie";
import { paieDuMois, TAUX_DE_LA_PAIE } from "../../src/config/cours/paie";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, journalAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";
import type { Cas } from "../../src/config/cours/cas";

/**
 * LA PAIE EN DÉTAIL TIENT DANS LES NEUF ENTREPRISES.
 *
 * Le détail du bulletin redonne les totaux du chapitre pilote (le brut, le net, le coût
 * du personnel) ; chaque écriture s'équilibre et se corrige juste ; après le règlement
 * du 15 février, tous les comptes de la paie sont soldés et la banque a versé exactement
 * le coût du personnel ; le tri boucle sur le bulletin ; aucun texte ne sort un
 * « undefined » ou un « NaN ».
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "ecriture": {
      const piece = e.piece?.(cas);
      return [
        e.evenement(cas),
        ...e.indices(cas),
        ...e.explication(cas, etat),
        ...e.ecriture(cas).lignes.flatMap((l) => [l.role, l.indice]),
        ...(piece ? [piece.a, ...piece.lignes.map((l) => l.libelle), ...piece.totaux.map((t) => t.libelle)] : []),
      ];
    }
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    case "tri":
      return [e.question(cas), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi, String(x.montant)]), ...e.explication(cas)];
    default:
      return [];
  }
}

it("les parts URSSAF et retraite redonnent les taux du chapitre pilote", () => {
  expect(TAUX_DE_LA_PAIE.salarial.urssaf + TAUX_DE_LA_PAIE.salarial.retraite).toBeCloseTo(TAUX_SALARIAL, 10);
  expect(TAUX_DE_LA_PAIE.patronal.urssaf + TAUX_DE_LA_PAIE.patronal.retraite).toBeCloseTo(TAUX_PATRONAL, 10);
});

describe.each(ENTREPRISES_DU_COURS)("la paie chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const p = paieDuMois(cas);
  const chapitre = chapitreDuCas(LA_PAIE, cas);

  it("le bulletin détaillé redonne le brut, le net et le coût du chapitre pilote", () => {
    expect(p.urssafSalariale + p.retraiteSalariale).toBe(cas.personnel.cotisationsSalariales);
    expect(p.urssafPatronale + p.retraitePatronale).toBe(cas.personnel.cotisationsPatronales);
    expect(p.netAvantImpot).toBe(cas.personnel.net);
    expect(p.netImposable).toBeGreaterThan(p.netAvantImpot);
    expect(p.acompte).toBeGreaterThan(0);
    expect(p.acompte).toBeLessThan(p.netAvantImpot / p.effectif);
    expect(p.netAPayer).toBeGreaterThan(0);
    expect(p.netAPayer + p.acompte + p.pas).toBeCloseTo(p.netAvantImpot, 2);
  });

  it("chaque écriture est équilibrée, sur des comptes du plan, et la correction se corrige juste", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
  });

  it("au 15 février, les comptes de la paie sont soldés ; la banque a versé le coût du personnel, qui fait tout le résultat", () => {
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    for (const c of ["421", "425", "431", "437", "442"]) expect(fin[c] ?? 0, c).toBeCloseTo(0, 2);
    expect(-(fin["512"] ?? 0)).toBeCloseTo(p.cout, 2);
    expect(compteDeResultat(fin).totalCharges).toBeCloseTo(p.cout, 2);
    expect(journalAvant(chapitre, cas, chapitre.etapes.length)).toHaveLength(5);
  });

  it("le tri boucle sur le bulletin ; une seule bonne réponse ; aucun texte ne sort undefined ou NaN", () => {
    const tri = chapitre.etapes.find((e) => e.type === "tri")!;
    if (tri.type !== "tri") throw new Error("tri attendu");
    const somme = (k: string) => tri.elements(cas).filter((x) => x.categorie === k).reduce((s, x) => s + x.montant, 0);
    expect(somme("charge")).toBeCloseTo(p.cotisationsPatronales, 2);
    expect(somme("retenue")).toBeCloseTo(p.brut - p.netAPayer, 2);
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
    }
  });
});

describe("la paie, quelle que soit l'entreprise", () => {
  it("est réservée (la suite du cours sous licence), au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(LA_PAIE.libre).toBe(false);
    expect(LA_PAIE.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of LA_PAIE.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(LA_PAIE.etapes.map((e) => e.id)).size).toBe(LA_PAIE.etapes.length);
  });

  it("une cotisation de retraite passée à l'URSSAF est signalée : les deux organismes ne se confondent pas ici", () => {
    const cas = casDeLEntreprise("nova");
    const p = paieDuMois(cas);
    const etape = LA_PAIE.etapes.find((e) => e.id === "cotisations-patronales")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const saisie = [
      { compte: "645", debit: String(p.cotisationsPatronales), credit: "" },
      { compte: "431", debit: "", credit: String(p.cotisationsPatronales) },
    ];
    const c = corriger(saisie, etape.ecriture(cas));
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("la caisse de retraite");
  });
});
