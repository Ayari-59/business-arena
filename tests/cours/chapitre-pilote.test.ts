import { describe, expect, it, vi } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { chapitreDuCas, etatAvant, etatApres, indexDeLEtape, journalAvant } from "../../src/pedagogy/cours/deroule";
import type { Etape } from "../../src/config/cours/types";
import type { Cas } from "../../src/config/cours/cas";

/**
 * LE CHAPITRE PILOTE TIENT DANS LES NEUF ENTREPRISES.
 *
 * Un chapitre s'écrit une fois et se joue partout : ce qui est juste chez NOVA doit
 * l'être chez L'ESCALE. On le vérifie entreprise par entreprise, à chaque étape :
 * l'écriture attendue est équilibrée et passe son propre correcteur, le bilan
 * s'équilibre, la banque ne passe jamais à découvert, les dates se suivent, et aucun
 * texte ne sort un « undefined » ou un « NaN ».
 */

const pilote = CHAPITRES[0]!;
const codesDesNotions = new Set(CONCEPTS.map((c) => c.code));

/** Tout le texte qu'une étape peut afficher, dans l'état où l'élève l'aborde. */
function textesDe(chapitre: typeof pilote, e: Etape, cas: Cas, i: number): string[] {
  const avant = etatAvant(chapitre, cas, i);
  const apres = etatApres(chapitre, cas, i);
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "ecriture": {
      const p = e.piece?.(cas);
      const a = e.ecriture(cas);
      return [
        e.evenement(cas),
        ...e.indices(cas),
        ...e.explication(cas, apres),
        a.libelle,
        a.date,
        ...a.lignes.flatMap((l) => [l.role, l.indice]),
        ...(p ? [p.nature, p.de, p.a, p.date, p.mention ?? "", ...p.lignes.map((l) => l.libelle + l.montant)] : []),
      ];
    }
    case "choix":
      return [e.question(cas, avant), ...e.options(cas, avant).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [e.question(cas, avant), ...e.champs(cas, avant).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, avant)];
    case "comparaison": {
      const k = indexDeLEtape(chapitre, e.avantLEtape);
      const av = etatAvant(chapitre, cas, k);
      const fin = etatAvant(chapitre, cas, chapitre.etapes.length);
      return [e.question(cas), ...e.options(cas, av, fin).flatMap((o) => [o.texte, o.retour]), ...e.explication(cas, av, fin)];
    }
    default:
      return [];
  }
}

describe.each(ENTREPRISES_DU_COURS)("le chapitre pilote chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(pilote, cas);

  it("le cas a ses deux ventes, un achat, un équipement, et des dates qui se suivent", () => {
    expect(cas.venteComptant.quantite).toBeGreaterThan(0);
    expect(cas.venteCredit.quantite).toBeGreaterThan(0);
    expect(cas.achat.ht).toBeGreaterThan(0);
    expect(cas.immobilisation.ht).toBeGreaterThan(0);
    // Le fournisseur et le client se règlent après le 31 janvier, le fournisseur d'abord.
    expect(cas.achat.echeance).toBeGreaterThan(31);
    expect(cas.venteCredit.echeance).toBeGreaterThan(cas.achat.echeance);
    expect(cas.venteCredit.date).toBeLessThan(cas.personnel.date);
    // La paie : le brut se partage entre net et cotisations, le coût ajoute la part patronale.
    const p = cas.personnel;
    expect(p.net + p.cotisationsSalariales).toBe(p.brut);
    expect(p.cout).toBe(p.brut + p.cotisationsPatronales);
    expect(p.dateUrssaf).toBeGreaterThan(31);
    const journal = journalAvant(chapitre, cas, chapitre.etapes.length);
    // Le journal reste chronologique, règlements compris, quelle que soit l'entreprise.
    const jours = chapitre.etapes.flatMap((e) =>
      e.type === "ecriture" ? [e.echeance?.(cas) ?? Number.NaN] : [],
    );
    const echeances = jours.filter((j) => !Number.isNaN(j));
    expect(echeances).toEqual([...echeances].sort((a, b) => a - b));
    expect(journal).toHaveLength(jours.length);
  });

  it("chaque écriture attendue est équilibrée, au plan du cours, et passe son propre correcteur", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const a = e.ecriture(cas);
      expect(equilibree(enEcriture(a)), e.id).toBe(true);
      for (const l of a.lignes) {
        expect(compteDuPlan(l.compte), `${e.id} ${l.compte}`).toBeDefined();
        expect(l.montant, `${e.id} ${l.compte}`).toBeGreaterThan(0);
      }
      expect(corriger(enSaisie(a), a), e.id).toEqual({ juste: true, remarques: [], notes: [] });
    }
  });

  it("à chaque étape, le bilan s'équilibre et la banque reste créditrice", () => {
    for (let i = 0; i <= chapitre.etapes.length; i++) {
      const { soldes } = etatAvant(chapitre, cas, i);
      const b = bilan(soldes);
      expect(b.totalActif, `étape ${i}`).toBeCloseTo(b.totalPassif, 2);
      expect(soldes["512"] ?? 0, `étape ${i}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("les échéances ne changent pas le résultat de janvier", () => {
    const k = indexDeLEtape(chapitre, "echeances");
    const finJanvier = compteDeResultat(etatAvant(chapitre, cas, k).soldes);
    const fin = compteDeResultat(etatAvant(chapitre, cas, chapitre.etapes.length).soldes);
    expect(fin.resultat).toBe(finJanvier.resultat);
    expect(finJanvier.totalProduits).toBeCloseTo(cas.venteComptant.ht + cas.venteCredit.ht, 2);
  });

  it("aucun texte ne sort undefined ou NaN ; chaque question a une seule bonne réponse ; chaque montant demandé est un nombre", () => {
    chapitre.etapes.forEach((e, i) => {
      for (const t of textesDe(chapitre, e, cas, i)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|\[object/);
      const avant = etatAvant(chapitre, cas, i);
      if (e.type === "choix") expect(e.options(cas, avant).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, avant)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    });
  });
});

describe("le chapitre pilote, quelle que soit l'entreprise", () => {
  const chapitre = pilote;
  it("ses notions sont des fiches du site, et ses identifiants d'étape sont uniques", () => {
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codesDesNotions.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });

  it("est libre d'accès (décision du propriétaire : le premier chapitre sert de démonstration)", () => {
    expect(pilote.libre).toBe(true);
    expect(CHAPITRES.filter((c) => c.libre)).toHaveLength(1);
  });

  it("le cas est déterministe : deux calculs, les mêmes montants", async () => {
    const a = JSON.stringify(casDeLEntreprise("nova"));
    vi.resetModules();
    const { casDeLEntreprise: recalcul } = await import("../../src/config/cours/cas");
    expect(JSON.stringify(recalcul("nova"))).toBe(a);
  });
});
