import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { dateDuCours } from "../../src/config/cours/dates";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { L_EMPRUNT, coutDuCredit, echeance, premiereAnnee } from "../../src/config/cours/chapitres/l-emprunt";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { etatAvant } from "../../src/pedagogy/cours/deroule";
import { compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * L'EMPRUNT TIENT DANS LES NEUF ENTREPRISES.
 *
 * Le tableau d'amortissement rembourse tout le prêt, ni plus ni moins, en intérêts qui
 * baissent ; les échéances tombent à la date anniversaire du prêt du chapitre pilote ;
 * chaque écriture s'équilibre et se corrige juste ; le résultat ne porte que les
 * intérêts ; des échéances constantes coûtent plus ; aucun texte ne sort un
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
        ...(piece ? [...piece.lignes.map((l) => l.libelle), ...piece.totaux.map((t) => t.libelle)] : []),
      ];
    }
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("l'emprunt chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const n = cas.pret.nombreEcheances;

  it("le tableau rembourse tout le prêt, en intérêts qui baissent au quart du taux annuel", () => {
    expect(n * cas.pret.capitalParEcheance).toBe(cas.emprunt);
    const lignes = Array.from({ length: n }, (_, i) => echeance(cas, i + 1));
    expect(lignes[0]!.interets).toBeCloseTo((cas.emprunt * cas.pret.tauxAnnuel) / 4, 2);
    expect(lignes[n - 1]!.apres).toBe(0);
    for (let k = 1; k < n; k++) expect(lignes[k]!.interets, `échéance ${k + 1}`).toBeLessThan(lignes[k - 1]!.interets);
    expect(coutDuCredit(cas).echeancesConstantes).toBeGreaterThan(coutDuCredit(cas).amortissementConstant);
  });

  it("les échéances tombent tous les trois mois à la date anniversaire du prêt", () => {
    const jour = String(cas.dates.emprunt);
    expect(echeance(cas, 1).jour - cas.dates.emprunt).toBeGreaterThan(80);
    for (const [k, mois] of [[1, "avril"], [2, "juillet"], [3, "octobre"], [4, "janvier de l'année suivante"]] as const) {
      expect(dateDuCours(echeance(cas, k).jour)).toBe(`${jour} ${mois}`);
    }
  });

  it("au 31 décembre : le capital restant dû et sa part à moins d'un an", () => {
    const a = premiereAnnee(cas);
    expect(a.restant).toBe(cas.emprunt - a.payees.length * cas.pret.capitalParEcheance);
    expect(a.aMoinsDUnAn).toBeLessThan(a.restant);
    expect(a.payees.every((p) => p.jour <= 365)).toBe(true);
    expect(echeance(cas, a.payees.length + 1).jour).toBeGreaterThan(365);
  });

  it("chaque écriture s'équilibre et se corrige juste ; le résultat ne porte que les intérêts", () => {
    for (const e of L_EMPRUNT.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
      expect(corriger(enSaisie(a), a).juste, e.id).toBe(true);
    }
    const fin = etatAvant(L_EMPRUNT, cas, L_EMPRUNT.etapes.length).soldes;
    expect(compteDeResultat(fin).totalCharges).toBeCloseTo(echeance(cas, 1).interets + echeance(cas, 2).interets, 2);
    expect(-(fin["164"] ?? 0)).toBe(echeance(cas, 2).apres);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    for (const [i, e] of L_EMPRUNT.etapes.entries()) {
      const etat = etatAvant(L_EMPRUNT, cas, i);
      for (const t of textesDe(e, cas, etat)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("l'emprunt, quelle que soit l'entreprise", () => {
  it("est réservé, au palier 3 ; ses notions sont des fiches, ses étapes uniques", () => {
    expect(L_EMPRUNT.libre).toBe(false);
    expect(L_EMPRUNT.palier).toBe(3);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of L_EMPRUNT.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(L_EMPRUNT.etapes.map((e) => e.id)).size).toBe(L_EMPRUNT.etapes.length);
  });

  it("une échéance passée entière en charge est refusée : le capital n'est pas une charge", () => {
    const cas = casDeLEntreprise("nova");
    const e = echeance(cas, 1);
    const etape = L_EMPRUNT.etapes.find((x) => x.id === "echeance-1")!;
    if (etape.type !== "ecriture") throw new Error("écriture attendue");
    const c = corriger(
      [
        { compte: "6611", debit: String(e.total), credit: "" },
        { compte: "512", debit: "", credit: String(e.total) },
      ],
      etape.ecriture(cas),
    );
    expect(c.juste).toBe(false);
    expect(c.remarques.join(" ")).toContain("le capital remboursé");
  });

  it("au-delà du 31 décembre, la date dit l'année suivante", () => {
    expect(dateDuCours(365)).toBe("31 décembre");
    expect(dateDuCours(368)).toBe("3 janvier de l'année suivante");
  });
});
