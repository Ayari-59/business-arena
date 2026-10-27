import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import type { Cas } from "../../src/config/cours/cas";
import { DECIDER, commandeDeNova, meilleurPrix, volumeNecessaire } from "../../src/config/cours/chapitres/decider";
import { ECART_DE_PRIX, prixRejoues, sousTraitance } from "../../src/config/cours/decision";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import type { Etape } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";

/**
 * DÉCIDER : L'ARÈNE REJOUE LE TRIMESTRE, ET SEUL LE PRIX CHANGE.
 *
 * Le trimestre au prix d'origine est celui de l'année du cours ; les deux autres prix
 * déplacent bien le prix de 10 %, gamme comprise ; le volume nécessaire est le plus petit
 * qui garde la marge ; la sous-traitance n'existe que chez NOVA (décision du propriétaire),
 * et la commande s'y fabrique d'abord, se sous-traite ensuite.
 */

const chapitre = DECIDER;
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...tableau, ...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [...tableau, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [...tableau, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat)];
    default:
      return tableau;
  }
}

describe.each(ENTREPRISES_DU_COURS)("décider chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const [bas, base, haut] = prixRejoues(code);

  it("le prix d'origine rejoue le premier trimestre de l'année ; les deux autres déplacent le prix de 10 %", () => {
    const r1 = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    expect(base!.resultat).toBe(Math.round(r1.incomeStatement.operatingIncome));
    expect(base!.chiffreDAffaires).toBe(Math.round(r1.incomeStatement.revenue));
    if (base!.prixDesReferences) {
      // En gamme, chaque référence prend l'écart de prix, au centime de la décision près.
      for (const [ref, p] of Object.entries(base!.prixDesReferences)) {
        expect(bas!.prixDesReferences![ref]! / p, ref).toBeCloseTo(1 - ECART_DE_PRIX, 6);
        expect(haut!.prixDesReferences![ref]! / p, ref).toBeCloseTo(1 + ECART_DE_PRIX, 6);
      }
      // Le prix moyen suit aussi ce qui se vend de chaque référence : s'il ne bouge pas de 10 %,
      // le chapitre le dit.
      const melange = [bas!, haut!].some((x) => Math.abs(x.prix / base!.prix - x.facteur) >= 0.005);
      const arene = chapitreDuCas(chapitre, cas).etapes.find((e) => e.id === "l-arene-joue")!;
      if (arene.type !== "lecture") throw new Error("lecture attendue");
      expect(arene.texte(cas).join(" ").includes("ne se vendent pas dans les mêmes proportions")).toBe(melange);
    } else {
      expect(bas!.prix / base!.prix).toBeCloseTo(1 - ECART_DE_PRIX, 2);
      expect(haut!.prix / base!.prix).toBeCloseTo(1 + ECART_DE_PRIX, 2);
    }
  });

  it("le volume nécessaire est le plus petit qui garde la marge ; le meilleur prix est celui du meilleur résultat", () => {
    const v = volumeNecessaire(cas);
    expect(v.margeBaissee).toBeGreaterThan(0);
    expect(v.quantite * v.margeBaissee).toBeGreaterThanOrEqual(base!.marge - 0.01);
    expect((v.quantite - 1) * v.margeBaissee).toBeLessThan(base!.marge);
    expect(meilleurPrix(cas).resultat).toBe(Math.max(bas!.resultat, base!.resultat, haut!.resultat));
  });

  it("la sous-traitance n'est proposée que là où l'arène en a une", () => {
    const ids = chapitreDuCas(chapitre, cas).etapes.map((e) => e.id);
    const avec = sousTraitance(code) !== null;
    expect(ids.includes("fabriquer-ou-acheter")).toBe(avec);
    expect(ids.includes("la-commande")).toBe(avec);
  });

  if (code === "boutique") {
    it("en gamme, le prix moyen ne bouge pas de 10 % : à +10 %, il monte davantage, les références se vendant autrement", () => {
      expect(base!.prixDesReferences).not.toBeNull();
      expect(haut!.prix / base!.prix).toBeGreaterThan(1 + ECART_DE_PRIX + 0.005);
    });
  }

  it("aucun texte ne sort undefined ou NaN ; une seule bonne réponse par question ; des options distinctes", () => {
    for (const e of chapitreDuCas(chapitre, cas).etapes) {
      for (const t of textesDe(e, cas)) expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      if (e.type === "choix") {
        const options = e.options(cas, etat);
        expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
        expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      }
      if (e.type === "montants") for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), e.id).toBe(true);
    }
    // Ce qui borne les ventes à prix baissé : le plan si de la demande est restée sans réponse.
    const borne = chapitre.etapes.find((e) => e.id === "ce-qui-borne")!;
    if (borne.type !== "choix") throw new Error("choix attendu");
    const juste = borne.options(cas, etat).find((o) => o.juste)!;
    expect(juste.texte).toMatch(bas!.perdues > 0 ? /^Le plan de production/ : /^La demande/);
  });
});

describe("décider, quelle que soit l'entreprise", () => {
  it("seule NOVA a un sous-traitant ; sa commande se fabrique d'abord, se sous-traite ensuite", () => {
    expect(ENTREPRISES_DU_COURS.filter((c) => sousTraitance(c) !== null)).toEqual(["nova"]);
    const k = commandeDeNova(casDeLEntreprise("nova"));
    expect(k.coutUnitaire).toBeGreaterThan(k.coutVariableUnitaire);
    expect(k.fabriquee).toBe(Math.min(k.restante, k.commande));
    expect(k.soustraitee).toBeGreaterThan(0);
    expect(k.margeSousTraitee).toBeGreaterThan(0);
    expect(k.gain).toBeCloseTo(k.fabriquee * k.margeFabriquee + k.soustraitee * k.margeSousTraitee, 2);
  });

  it("les trois réponses du meilleur prix existent selon l'entreprise", () => {
    const facteurs = new Set(ENTREPRISES_DU_COURS.map((c) => meilleurPrix(casDeLEntreprise(c)).facteur));
    expect(facteurs.size).toBe(3);
  });

  it("est réservé (décision du propriétaire : la suite du cours sous licence), au palier 4, ses notions sont des fiches, ses étapes uniques", () => {
    expect(chapitre.libre).toBe(false);
    expect(chapitre.palier).toBe(4);
    const codes = new Set(CONCEPTS.map((c) => c.code));
    for (const e of chapitre.etapes) for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  });
});
