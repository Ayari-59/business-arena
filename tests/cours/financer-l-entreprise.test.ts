import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { FINANCER_L_ENTREPRISE, financer } from "../../src/config/cours/chapitres/financer-l-entreprise";
import { rentabilite } from "../../src/config/cours/chapitres/rentabilite";
import { soldesDeGestion } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { ENDETTEMENT_MAXIMAL } from "../../src/config/cours/financement";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { Cas } from "../../src/config/cours/cas";
import type { Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * FINANCER L'ENTREPRISE, SUR L'ANNÉE ET LE BILAN DE L'ARÈNE.
 *
 * La capacité d'autofinancement est celle des soldes de gestion ; le coût de l'emprunt et
 * l'endettement se recomposent ; le financement choisi suit la règle : autofinancement si la
 * capacité suffit, emprunt si l'endettement reste sous le seuil, apport sinon.
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

describe.each(ENTREPRISES_DU_COURS)("le financement chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const k = financer(cas);
  const chapitre = chapitreDuCas(FINANCER_L_ENTREPRISE, cas);
  const juste = (id: string) => {
    const e = chapitre.etapes.find((x) => x.id === id);
    if (e?.type !== "choix") throw new Error(`Pas d'étape ${id}`);
    return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
  };

  it("la capacité d'autofinancement, le coût de l'emprunt et l'endettement se recomposent", () => {
    expect(k.caf).toBeCloseTo(soldesDeGestion(cas).cafAdditive, 1);
    expect(k.montant).toBe(cas.immobilisation.ht);
    expect(k.interets).toBeCloseTo(k.montant * cas.pret.tauxAnnuel, 1);
    expect(k.endettementApres).toBeCloseTo((k.emprunts + k.montant) / k.capitauxPropres, 2);
  });

  it("l'emprunt conseillé rappelle la rentabilité de l'activité quand elle ne couvre pas son taux", () => {
    // Le chapitre « La rentabilité » l'apprend : emprunter à un taux plus élevé que ce que
    // rapporte l'activité appauvrit les associés. Le conseil de financement ne peut pas l'oublier.
    expect(k.economique).toBe(rentabilite(cas).economique);
    const choisir = chapitre.etapes.find((e) => e.id === "choisir");
    if (choisir?.type !== "choix") throw new Error("Pas d'étape choisir");
    const juste = choisir.options(cas, { soldes: {} }).find((o) => o.juste)!;
    if (k.choix === "emprunt") expect(juste.retour.includes("Reste que son activité rapporte")).toBe(k.economique <= k.tauxDeLEmprunt);
    const textes = chapitre.etapes.flatMap((e) => (e.type === "choix" ? e.options(cas, { soldes: {} }).map((o) => o.retour) : []));
    expect(textes.join(" "), "une entreprise endettée « ne doit rien à personne »").not.toMatch(/ne doit rien à personne/);
  });

  it("le financement choisi suit la règle", () => {
    const attendu = k.caf >= k.montant ? "autofinancement" : (k.emprunts + k.montant) / k.capitauxPropres <= ENDETTEMENT_MAXIMAL ? "emprunt" : "apport";
    expect(k.choix).toBe(attendu);
    expect(juste("choisir")).toMatch(attendu === "autofinancement" ? /autofinancement/ : attendu === "emprunt" ? /emprunt/ : /apport/);
    expect(juste("suffit")).toMatch(k.caf >= k.montant ? /^Oui : sa capacité/ : /^Non/);
  });

  it("aucun texte ne sort undefined ni « de le » ; une seule bonne réponse ; les notions existent", () => {
    const codes = new Set(CONCEPTS.map((x) => x.code));
    for (const [i, e] of chapitre.etapes.entries()) {
      const etat = etatAvant(chapitre, cas, i);
      for (const x of textesDe(e, cas, etat)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
        expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
        expect(x, `${e.id} : ${x}`).not.toMatch(/\bque [AEIOUYÉ]/);
      }
      if (e.type === "choix") expect(e.options(cas, etat).filter((o) => o.juste), e.id).toHaveLength(1);
      for (const n of e.notions ?? []) expect(codes.has(n), `${e.id} : ${n}`).toBe(true);
    }
  });
});

describe("les cas que le chapitre distingue se rencontrent dans le cours", () => {
  const toutes = ENTREPRISES_DU_COURS.map((c) => financer(casDeLEntreprise(c)));
  it("autofinancement, emprunt et apport ; un emprunt conseillé sur une activité qui ne couvre pas son taux", () => {
    for (const choix of ["autofinancement", "emprunt", "apport"]) expect(toutes.some((k) => k.choix === choix), choix).toBe(true);
    expect(toutes.some((k) => k.choix === "emprunt" && k.economique <= k.tauxDeLEmprunt)).toBe(true);
  });
});
