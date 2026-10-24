import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { NEGOCIATIONS } from "../../src/config/cours/chapitres/negocier-le-prix";
import { REMISES_ET_CONDITIONS, affaire } from "../../src/config/cours/chapitres/remises-et-conditions";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_DE_REMISE, TAUX_D_ESCOMPTE } from "../../src/config/cours/remises";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA RENTABILITÉ D'UNE AFFAIRE, SUR LA COMMANDE ET LE DÉLAI DE L'ARÈNE.
 *
 * La facture enchaîne remise et escompte ; la marge cédée sort tout entière de la marge ; le
 * crédit client se finance au taux de l'emprunt de l'entreprise, sur le hors taxes ; la bonne réponse
 * sur l'escompte suit la comparaison des deux taux ; la commande qui paie la remise est la plus
 * petite qui retrouve la marge du prix catalogue.
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

describe.each(NEGOCIATIONS)("remises et conditions chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const a = affaire(cas);
  const chapitre = chapitreDuCas(REMISES_ET_CONDITIONS, cas);

  it("la facture enchaîne la remise sur le brut et l'escompte sur le net commercial", () => {
    expect(a.brut).toBeCloseTo(cas.venteCredit.quantite * cas.venteCredit.prixUnitaire, 2);
    expect(a.remise).toBeCloseTo(a.brut * TAUX_DE_REMISE, 2);
    expect(a.netCommercial).toBeCloseTo(a.brut - a.remise, 2);
    expect(a.escompte).toBeCloseTo(a.netCommercial * TAUX_D_ESCOMPTE, 2);
    expect(a.netFinancier).toBeCloseTo(a.netCommercial - a.escompte, 2);
  });

  it("la remise sort tout entière de la marge, et le crédit se finance au taux de l'emprunt, hors taxes", () => {
    expect(a.margeCedee).toBeCloseTo(a.remise, 2);
    expect(a.marge).toBeCloseTo(a.netCommercial - cas.venteCredit.quantite * cas.gestion.coutVariableUnitaire, 1);
    expect(a.coutDuCredit).toBeCloseTo((a.netCommercial * cas.pret.tauxAnnuel * cas.venteCredit.delai) / JOURS_PAR_AN, 1);
    expect(a.resultatDeLAffaire).toBeCloseTo(a.marge - a.coutDuCredit, 1);
  });

  it("la bonne réponse sur l'escompte suit la comparaison avec le taux de l'emprunt", () => {
    const taux = (TAUX_D_ESCOMPTE / (1 - TAUX_D_ESCOMPTE)) * (JOURS_PAR_AN / (cas.venteCredit.delai - JOURS_D_ESCOMPTE));
    expect(a.tauxAnnuelDeLEscompte).toBeCloseTo(taux * 100, 1);
    const etape = chapitre.etapes.find((e) => e.id === "escompte");
    if (etape?.type !== "choix") throw new Error("Pas d'étape escompte");
    const juste = etape.options(cas, { soldes: {} }).find((o) => o.juste)!;
    expect(juste.texte).toMatch(taux > cas.pret.tauxAnnuel ? /plus cher/ : /moins cher/);
  });

  it("la commande qui paie la remise est la plus petite qui retrouve la marge du prix catalogue", () => {
    const parUnite = a.prixRemise - cas.gestion.coutVariableUnitaire;
    expect(a.quantitePourLaMemeMarge * parUnite).toBeGreaterThanOrEqual(a.margeSansRemise - 0.01);
    expect((a.quantitePourLaMemeMarge - 1) * parUnite).toBeLessThan(a.margeSansRemise);
    expect(a.enPlus).toBeGreaterThan(0);
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
