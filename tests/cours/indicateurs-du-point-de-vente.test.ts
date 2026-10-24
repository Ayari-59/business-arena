import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { INDICATEURS_DU_POINT_DE_VENTE, indicateurs } from "../../src/config/cours/chapitres/indicateurs-du-point-de-vente";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { OBJECTIF_DE_HAUSSE } from "../../src/config/cours/point-de-vente";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { ARTICLES_PAR_TICKET } from "../../src/config/scenarios/sector-kpis";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES INDICATEURS DU POINT DE VENTE SONT CEUX DE L'ARÈNE.
 *
 * Le mois de chaque clientèle est le premier trimestre de l'arène ramené à un mois ; le
 * panier, le taux de transformation, le coût d'acquisition et le remplissage se calculent
 * comme les indicateurs du métier de l'arène ; chaque commerce a l'indicateur de son métier,
 * et lui seul ; les deux leviers atteignent bien l'objectif.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
  }
}

const ids = (code: string) => chapitreDuCas(INDICATEURS_DU_POINT_DE_VENTE, casDeLEntreprise(code)).etapes.map((e) => e.id);

it("chaque commerce a l'indicateur de son métier, et lui seul", () => {
  expect(ids("boutique")).toEqual(expect.arrayContaining(["transformation", "pourquoi-manquees"]));
  expect(ids("boutique")).not.toEqual(expect.arrayContaining(["acquisition"]));
  expect(ids("ecommerce")).toContain("acquisition");
  expect(ids("ecommerce")).not.toContain("transformation");
  expect(ids("ecommerce")).not.toContain("remplissage");
  expect(ids("bistrot")).toContain("remplissage");
  expect(ids("bistrot")).not.toContain("acquisition");
  for (const code of COMMERCES) expect(ids(code)).toEqual(expect.arrayContaining(["intro", "le-mois", "le-panier", "deux-leviers", "quel-levier"]));
});

describe.each(COMMERCES)("les indicateurs chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = indicateurs(cas);
  const chapitre = chapitreDuCas(INDICATEURS_DU_POINT_DE_VENTE, cas);

  it("le mois est celui de l'arène : les ventes du marché retrouvent celles du cas", () => {
    expect(k.ventes).toBeGreaterThan(0);
    expect(k.ventes).toBeLessThanOrEqual(k.demande);
    expect(k.demande - k.ventes - k.manque).toBeLessThanOrEqual(cas.marche.clienteles.length);
    // Les deux lectures du même trimestre, arrondies chacune : à quelques unités près.
    expect(Math.abs(k.ventes - cas.gestion.quantite) / cas.gestion.quantite).toBeLessThan(0.01);
    expect(Math.abs(k.chiffreDAffaires - cas.gestion.chiffreDAffaires) / cas.gestion.chiffreDAffaires).toBeLessThan(0.01);
    expect(k.ventes).toBeLessThanOrEqual(k.capacite);
  });

  it("le panier se calcule comme dans l'arène, sous le nom qu'elle lui donne", () => {
    const parTicket = code === "boutique" ? ARTICLES_PAR_TICKET : 1;
    expect(k.client.unitesParClient).toBe(parTicket);
    expect(k.panier).toBeCloseTo(k.chiffreDAffaires / (k.ventes / parTicket), 0);
    expect(scenarioByCode(code).kpis.map((x) => x.label)).toContain(k.nomDuPanier);
  });

  it("l'indicateur du métier se calcule comme dans l'arène", () => {
    expect(k.transformation).toBeCloseTo((k.ventes / k.demande) * 100, 0);
    expect(k.caManque).toBeCloseTo(k.manque * k.prixMoyen, -1);
    expect(k.remplissage).toBeCloseTo((k.ventes / k.capacite) * 100, 0);
    if (code === "ecommerce") {
      const nouveaux = cas.marche.clienteles.find((x) => x.code === "acquisition")!.vendu;
      expect(k.cac).toBeCloseTo(cas.marche.marketing / nouveaux, 2);
      expect(k.margeParCommande).toBeCloseTo(cas.gestion.prixMoyen - cas.gestion.coutVariableUnitaire, 2);
    }
  });

  it("chacun des deux leviers atteint l'objectif, et il faut plus de l'un comme de l'autre", () => {
    expect(k.caVise).toBeCloseTo(k.chiffreDAffaires * (1 + OBJECTIF_DE_HAUSSE), -1);
    expect(k.panierVise * k.clients).toBeGreaterThanOrEqual(k.caVise - k.clients * 0.01);
    expect(k.clientsVises * k.panier).toBeGreaterThanOrEqual(k.caVise - 0.01);
    expect((k.clientsVises - 1) * k.panier).toBeLessThan(k.caVise);
    expect(k.panierVise).toBeGreaterThan(k.panier);
    expect(k.clientsVises).toBeGreaterThan(k.clients);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/_[a-z]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
