import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import type { Cas } from "../../src/config/cours/cas";
import { CENTRES, REPARTITION_PRIMAIRE, REPARTITION_SECONDAIRE } from "../../src/config/cours/centres";
import { COUT_COMPLET, coutComplet } from "../../src/config/cours/chapitres/cout-complet";
import { chiffresDeGestion } from "../../src/config/cours/chapitres/seuil-de-rentabilite";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";

/**
 * LE COÛT COMPLET TIENT DANS LES NEUF ENTREPRISES.
 *
 * Les clés de répartition font 100 % ; rien ne se perd entre les charges, les centres
 * et le coût de revient ; le résultat analytique retrouve, au centime près, celui du
 * seuil de rentabilité sur le même mois ; la commande de la dernière question tombe
 * entre le coût variable et le coût complet, et elle rapporte. Aucun texte ne sort un
 * « undefined » ou un « NaN ».
 */

const chapitre = COUT_COMPLET;
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
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

const somme = (cles: Record<string, number>) => Object.values(cles).reduce((s, x) => s + x, 0);

describe("les clés de répartition du cours", () => {
  it("chaque ligne fait 100 %, sur les quatre centres pour la primaire, les trois principaux pour la secondaire", () => {
    for (const [charge, cles] of Object.entries(REPARTITION_PRIMAIRE)) {
      expect(Object.keys(cles).sort(), charge).toEqual(CENTRES.map((c) => c.code).sort());
      expect(somme(cles), charge).toBeCloseTo(1, 9);
    }
    expect(Object.keys(REPARTITION_SECONDAIRE)).not.toContain("administration");
    expect(somme(REPARTITION_SECONDAIRE)).toBeCloseTo(1, 9);
  });
});

describe.each(ENTREPRISES_DU_COURS)("le coût complet chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = coutComplet(cas);
  const g = chiffresDeGestion(cas);

  it("rien ne se perd : les centres font les charges indirectes, le tri range toutes les charges du mois", () => {
    expect(somme(k.primaire)).toBeCloseTo(k.indirectes, 2);
    expect(somme(k.final)).toBeCloseTo(k.indirectes, 2);
    expect(k.indirectes).toBeCloseTo(g.chargesFixes, 2);
    const tri = chapitre.etapes.find((e) => e.type === "tri")!;
    if (tri.type !== "tri") throw new Error("tri attendu");
    const elements = tri.elements(cas);
    const de = (cat: string) => elements.filter((x) => x.categorie === cat).reduce((s, x) => s + x.montant, 0);
    expect(de("indirecte")).toBeCloseTo(k.indirectes, 2);
    expect(de("directe")).toBeCloseTo(g.chargesVariables, 2);
    // Chaque centre principal reçoit bien sa part de l'administration, et la chaîne boucle.
    for (const p of ["approvisionnement", "production", "distribution"] as const) {
      expect(k.final[p]).toBeCloseTo(k.primaire[p] + k.primaire.administration * REPARTITION_SECONDAIRE[p], 1);
    }
    expect(k.coutDeRevient).toBeCloseTo(k.matieres + k.autres + k.indirectes, 2);
  });

  it("le résultat analytique est celui du seuil de rentabilité, au centime près", () => {
    expect(k.resultat).toBeCloseTo(g.resultat, 2);
    const meme = chapitre.etapes.find((e) => e.id === "meme-resultat")!;
    if (meme.type !== "choix") throw new Error("choix attendu");
    expect(meme.question(cas, etat)).toContain(montantEcrit(g.resultat));
    // Le champ du résultat se saisit sans signe moins : une perte s'écrit en positif.
    const champ = chapitre.etapes.find((e) => e.id === "resultat-analytique")!;
    if (champ.type !== "montants") throw new Error("montants attendu");
    const r = champ.champs(cas, etat)[0]!;
    expect(r.attendu).toBeGreaterThanOrEqual(0);
    expect(r.attendu).toBeCloseTo(Math.abs(g.resultat), 2);
    expect(r.libelle).toContain(g.resultat >= 0 ? "bénéfice" : "perte");
  });

  it("la commande se paie entre le coût variable et le coût complet, et elle rapporte", () => {
    expect(k.prixDeLaCommande).toBeGreaterThan(k.coutVariableUnitaire);
    expect(k.prixDeLaCommande).toBeLessThan(k.coutDeRevientUnitaire);
    expect(k.gainDeLaCommande).toBeGreaterThan(0);
  });

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question", () => {
    for (const e of chapitre.etapes) {
      for (const t of textesDe(e, cas)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
  });
});

describe("le coût complet, quelle que soit l'entreprise", () => {
  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 3, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(3);
    expect(chapitre.parcours).toBe("controle-de-gestion");
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
