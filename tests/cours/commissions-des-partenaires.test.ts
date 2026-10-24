import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise } from "../../src/config/cours/cas";
import { campagne } from "../../src/config/cours/chapitres/cout-d-acquisition";
import { COMMISSIONS_DES_PARTENAIRES, canalCommissionne, canaux } from "../../src/config/cours/chapitres/commissions-des-partenaires";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LES COMMISSIONS DES CANAUX PARTENAIRES, SUR LE TRIMESTRE DE L'ARÈNE.
 *
 * Le chapitre se joue là où l'arène vend par un canal commissionné ; la commission de chaque
 * commande et celle du trimestre sont celles du moteur ; les canaux font le chiffre d'affaires
 * du trimestre ; la commission plafond est la plus haute qui laisse
 * autant que la campagne ; la bonne réponse sur le canal suit les deux marges.
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
    case "curseur":
      return [e.question(cas), ...e.explication(cas), ...e.lecture(cas, e.cible(cas).attendu).map((l) => l.libelle)];
    default:
      return [];
  }
}

it("le chapitre se joue là où l'arène vend par un canal commissionné, et seulement là", () => {
  expect(COMMISSIONS_DES_PARTENAIRES.entreprises?.codes).toEqual(ENTREPRISES_DU_COURS.filter((code) => canalCommissionne(code)));
});

describe.each(COMMISSIONS_DES_PARTENAIRES.entreprises!.codes)("les commissions chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = canaux(cas);
  const chapitre = chapitreDuCas(COMMISSIONS_DES_PARTENAIRES, cas);
  const r = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;

  it("la commission est celle du moteur, par commande et sur le trimestre", () => {
    expect(k.taux).toBeCloseTo(canalCommissionne(code)!.commissionRate! * 100, 5);
    expect(k.place.commission).toBe(Math.round(r.incomeStatement.commissionCost ?? 0));
    expect(k.commissionParCommande * k.place.commandes).toBeCloseTo(k.place.commission, -1);
    expect(k.margeApresCommission).toBeCloseTo(k.prix - cas.gestion.coutVariableUnitaire - k.prix * (k.taux / 100), 1);
  });

  it("le coût d'acquisition est celui du chapitre sur la campagne, et les canaux font le chiffre d'affaires du trimestre", () => {
    expect(k.cac).toBe(campagne(cas).cac);
    const ca = k.lignes.reduce((t, l) => t + l.chiffreDAffaires, 0);
    expect(Math.abs(ca - r.incomeStatement.revenue)).toBeLessThan(3);
    expect(k.lignes[1]!.cout).toBe(Math.round(r.incomeStatement.marketingCost));
    expect(k.partDeLaMarge).toBeLessThan(k.partDesCommandes);
  });

  it("la commission plafond est la plus haute qui laisse autant que la campagne", () => {
    const curseur = chapitre.etapes.find((e) => e.id === "plafond");
    if (curseur?.type !== "curseur") throw new Error("Pas de curseur");
    const ecart = (t: number) => curseur.lecture(cas, t).find((l) => l.fort)!.montant;
    expect(ecart(k.plafond)).toBeGreaterThanOrEqual(0);
    expect(ecart(k.plafond + 1)).toBeLessThan(0);
    expect(curseur.cible(cas).attendu).toBe(k.plafond);
  });

  it("la bonne réponse sur le canal suit les deux marges", () => {
    const etape = chapitre.etapes.find((e) => e.id === "quel-canal");
    if (etape?.type !== "choix") throw new Error("Pas d'étape quel-canal");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toBe(k.margeApresCommission > k.margeApresAcquisition ? "La place de marché" : "La campagne");
  });

  it("le délai de reversement se finance TTC au taux de l'emprunt", () => {
    expect(k.attenteTtc).toBeCloseTo((k.place.chiffreDAffaires - k.place.commission) * (1 + cas.venteCredit.tauxTva), 1);
    expect(k.coutDuDelai).toBeCloseTo((k.attenteTtc * cas.pret.tauxAnnuel * k.delai) / 360, 1);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) les? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bde [aeiouyéèê]/i);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});
