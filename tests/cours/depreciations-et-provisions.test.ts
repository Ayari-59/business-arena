import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { ENTREPRISES_DU_COURS, METIERS } from "../../src/config/cours/metiers";
import { DEPRECIATIONS_ET_PROVISIONS, resultatApresProvisions } from "../../src/config/cours/chapitres/depreciations-et-provisions";
import { cloture } from "../../src/config/cours/chapitres/la-cloture";
import { MOIS_PROBABLES, MOIS_RECLAMES, PART_RECOUVREE, TAUX_DE_PERTE_ESTIME, creanceDouteuse, de, litige, nomDuClient } from "../../src/config/cours/provisions";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";
import { bilan, compteDeResultat, equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * DÉPRÉCIATIONS ET PROVISIONS TIENNENT DANS LES NEUF ENTREPRISES.
 *
 * La créance est celle que l'arène laisse au 31 décembre, hors taxes ; la balance
 * d'ouverture redonne le résultat avant impôt de « La clôture » et s'équilibre, au bilan
 * comme au journal ; la dépréciation porte sur le hors taxes, la provision sur le montant
 * probable ; après les deux dotations, le compte de résultat donne le résultat du chapitre ;
 * l'année suivante solde la créance douteuse et sa dépréciation, la perte et la TVA
 * récupérée refont la part perdue ; aucun texte ne sort un « undefined » ni un « de le ».
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

it("le client se nomme court, et « de » se contracte", () => {
  expect(nomDuClient("la société Brunet, pour ses repas d'affaires")).toBe("la société Brunet");
  expect(nomDuClient("un cabinet médical qui rénove ses locaux")).toBe("le cabinet médical");
  expect(nomDuClient("CampusTech")).toBe("CampusTech");
  expect(de("le groupe Vidal Industries")).toBe("du groupe Vidal Industries");
  expect(de("la place de marché MaisonPlus")).toBe("de la place de marché MaisonPlus");
  expect(de("l'agence Voyages Horizon")).toBe("de l'agence Voyages Horizon");
});

describe.each(ENTREPRISES_DU_COURS)("dépréciations et provisions chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const d = creanceDouteuse(cas);
  const l = litige(cas);
  const r = resultatApresProvisions(cas);
  const chapitre = chapitreDuCas(DEPRECIATIONS_ET_PROVISIONS, cas);

  it("la créance est celle que l'arène laisse au 31 décembre, hors taxes ; la TVA est celle du métier", () => {
    const { partie } = anneeJouee(code);
    const fin = partie.rounds[partie.rounds.length - 1]!.results["joueur"]!.balanceSheet.receivables;
    const tvaArene = scenarioByCode(code).scenario.finance.vatRate ?? 0;
    expect(d.ht).toBeGreaterThan(0);
    expect(d.ht).toBeCloseTo(fin / (1 + tvaArene), 1);
    expect(d.tauxTva).toBe(METIERS[code]!.vente.tauxTva);
    expect(d.ttc).toBeCloseTo(d.ht * (1 + d.tauxTva), 1);
  });

  it("la balance d'ouverture s'équilibre, au journal et au bilan, et redonne le résultat avant impôt de la clôture", () => {
    const ouverture = DEPRECIATIONS_ET_PROVISIONS.ouverture!(cas);
    expect(equilibree(ouverture)).toBe(true);
    for (const x of ouverture.lignes) expect(compteDuPlan(x.compte), x.compte).toBeDefined();
    const s = etatAvant(chapitre, cas, 0).soldes;
    expect(compteDeResultat(s).resultat).toBeCloseTo(cloture(cas).resultatAvantImpot, 2);
    expect(s["411"]).toBeCloseTo(d.ttc, 2);
    const b = bilan(s);
    expect(b.totalActif).toBeCloseTo(b.totalPassif, 2);
  });

  it("la dépréciation porte sur le hors taxes, la provision sur le montant probable", () => {
    expect(d.depreciation).toBeCloseTo(d.ht * TAUX_DE_PERTE_ESTIME, 1);
    expect(d.depreciation).not.toBeCloseTo(d.ttc * TAUX_DE_PERTE_ESTIME, 0);
    expect(l.salaire).toBeCloseTo(cas.personnel.brut / cas.personnel.effectif, 1);
    expect(l.provision).toBe(Math.round(l.salaire * MOIS_PROBABLES));
    expect(l.reclame).toBe(Math.round(l.salaire * MOIS_RECLAMES));
    expect(l.provision).toBeLessThan(l.reclame);
  });

  it("chaque écriture se corrige juste ; après les deux dotations, le résultat est celui du chapitre, et le bilan s'équilibre", () => {
    for (const e of chapitre.etapes) {
      if (e.type !== "ecriture") continue;
      const x = e.ecriture(cas);
      expect(equilibree(enEcriture(x)), e.id).toBe(true);
      for (const y of x.lignes) expect(compteDuPlan(y.compte), `${e.id} : ${y.compte}`).toBeDefined();
      expect(corriger(enSaisie(x), x).juste, e.id).toBe(true);
    }
    const s = etatAvant(chapitre, cas, indexDeLEtape(chapitre, "resultat")).soldes;
    expect(compteDeResultat(s).resultat).toBeCloseTo(r.resultat, 2);
    expect(r.resultat).toBeCloseTo(cloture(cas).resultatAvantImpot - d.depreciation - l.provision, 2);
    expect(r.impot).toBe(r.resultat > 0 ? Math.round(r.resultat * cloture(cas).tauxIS) : 0);
    const b = bilan(s);
    expect(b.totalActif).toBeCloseTo(b.totalPassif, 2);
    expect(-(s["1511"] ?? 0)).toBe(l.provision);
    expect(b.passif.find((x) => x.libelle === "Provisions")?.montant).toBe(l.provision);
    expect(b.actif.find((x) => x.libelle === "Clients")?.montant).toBeCloseTo(d.ttc - d.depreciation, 2);
  });

  it("l'année suivante solde la créance douteuse et sa dépréciation ; la perte et la TVA refont la part perdue", () => {
    expect(d.recouvre).toBeCloseTo(d.ttc * PART_RECOUVREE, 1);
    expect(d.perteHt + d.tvaRecuperee).toBeCloseTo(d.perdu, 2);
    expect(d.perteHt).toBeCloseTo(d.perdu / (1 + d.tauxTva), 1);
    const fin = etatAvant(chapitre, cas, chapitre.etapes.length).soldes;
    expect(fin["416"] ?? 0).toBeCloseTo(0, 2);
    expect(fin["491"] ?? 0).toBeCloseTo(0, 2);
    expect(fin["411"] ?? 0).toBeCloseTo(0, 2);
    expect(fin["654"]).toBeCloseTo(d.perteHt, 2);
    expect(-(fin["7817"] ?? 0)).toBeCloseTo(d.depreciation, 2);
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
