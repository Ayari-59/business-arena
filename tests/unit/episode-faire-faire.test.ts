import { describe, expect, it } from "vitest";
import {
  CDI,
  COUT_COMPLET,
  COUT_COMPLET_AGGLO,
  COUT_SEMAINE,
  D,
  ECONOMIE_AFFICHEE,
  EVITABLE_AGGLO,
  EVITABLE_LOINTAINE,
  EVITABLE_LOINTAINE_APRES,
  FIXES_COMMUNS,
  HEURES_SUP_LOINTAINES,
  IMPREVUS,
  INTERIM,
  LIVRAISONS,
  LOUES,
  PROPRES,
  TARIFS,
  TOTAL_LIVRAISONS,
  VARIABLE,
  hasard,
  simuler,
} from "../../src/engine/episodes/faire-ou-faire-faire";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/faire-ou-faire-faire";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_FAIRE_FAIRE } from "../../src/pedagogy/episodes/faire-ou-faire-faire";
import type { Contexte, PartieJouee, Source } from "../../src/config/episodes/types";

/**
 * L'épisode « Faire ou faire faire » enseigne trois choses : un prix se
 * compare aux seuls coûts que la décision fait disparaître, pas au coût
 * complet ; un coût devient évitable à son échéance, et un coût déjà engagé
 * ne plaide ni pour ni contre ; faire faire là où c'est juste expose à un
 * prestataire qui peut déraper, et cela se prévoit. Ces tests verrouillent les
 * chiffres que les sources donnent et les classements qui le disent.
 */

const MEILLEUR = [1, 2, 1, 1, 1, 1];
const REFLEXE = [0, 0, 1, 1, 0, 0];
const ATTENTISTE = [2, 3, 2, 3, 1, 0];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const texte = (s: Source, ctx: Contexte = {}) =>
  typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
const source = (etape: number, id: string) => ETAPES[etape]!.sources.find((s) => s.id === id)!;
/** Un montant tel que les sources l'écrivent : « 19 500 € », « 83,7 € ». */
const ecrit = (v: number, d = 0) => `${v.toLocaleString("fr-FR", { maximumFractionDigits: d })} €`;

describe("les chiffres que les sources donnent", () => {
  it("le coût complet de 65 € se retrouve ligne par ligne", () => {
    const semaine =
      LIVRAISONS.agglo * VARIABLE.agglo +
      LIVRAISONS.lointaines * VARIABLE.lointaines +
      CDI.nombre * CDI.semaine +
      INTERIM.nombre * INTERIM.semaine +
      HEURES_SUP_LOINTAINES +
      PROPRES.nombre * PROPRES.amortissement +
      LOUES.nombre * LOUES.loyer +
      FIXES_COMMUNS;
    expect(semaine).toBe(19500);
    expect(COUT_SEMAINE).toBe(semaine);
    expect(COUT_COMPLET).toBe(65);
    const decompose = texte(source(0, "couts"));
    expect(decompose).toContain(ecrit(semaine));
    expect(decompose).toContain(`soit ${ecrit(semaine / TOTAL_LIVRAISONS)} par livraison`);
  });

  it("le coût évitable d'une livraison lointaine vaut 67 € d'ici la semaine 6, 83,7 € ensuite", () => {
    const avant = (90 * 27 + 3 * 1000 + 600) / 90;
    expect(avant).toBe(67);
    expect(EVITABLE_LOINTAINE).toBe(avant);
    expect(EPISODE_FAIRE_FAIRE.prevision.reel(simuler(MEILLEUR, 1))).toBe(67);
    // Les deux sources décisives de la semaine 1 donnent tout ce qu'il faut pour le refaire.
    const contrats = texte(source(0, "contrats"));
    expect(contrats).toMatch(/intérimaires tiennent les 90 livraisons lointaines/);
    expect(contrats).toMatch(/ferme jusqu'à la fin de la semaine 6/);
    const apres = avant + (3 * 500) / 90;
    expect(EVITABLE_LOINTAINE_APRES).toBeCloseTo(apres, 9);
    expect(texte(source(2, "evitable"), { prixLointaines: "62 €" })).toContain(ecrit(apres, 1));
    // En agglomération, seuls le carburant et l'usure disparaîtraient.
    expect(EVITABLE_AGGLO).toBe(12);
    expect(EVITABLE_AGGLO).toBeLessThan(TARIFS.agglo);
    expect(EVITABLE_LOINTAINE).toBeGreaterThan(TARIFS.lointaines);
  });

  it("l'économie affichée par la direction et le coût complet de l'agglomération sont justes", () => {
    expect(ECONOMIE_AFFICHEE).toBe(300 * 65 - (210 * 48 + 90 * 60));
    expect(ECONOMIE_AFFICHEE).toBe(4020);
    expect(ETAPES[0]!.options[0]!.d).toContain(ecrit(4020));
    // 52,3 € : coûts directs et part des frais communs au prorata des livraisons.
    const agglo = (210 * 12 + 6 * 800 + 6 * 230 + (3270 * 210) / 300) / 210;
    expect(COUT_COMPLET_AGGLO).toBeCloseTo(agglo, 9);
    const message = ETAPES[4]!.messages({ coutCompletAgglo: "57 €", prixAgglo: "50 €" });
    expect(message[0]!.texte).toContain(ecrit(agglo));
    expect(texte(source(4, "repartition"), {})).toContain(ecrit(FIXES_COMMUNS));
  });
});

describe("le modèle des livraisons", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.retard).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.retard,
      9,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("tout confier laisse les chauffeurs et les porteurs payés à l'arrêt", () => {
    const arret = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g, JOURS).arret));
    expect(arret(REFLEXE)).toBeGreaterThan(40000);
    expect(arret(MEILLEUR)).toBeLessThan(10000);
  });

  it("la pénalité de Sirand tombe selon le hasard, et un second transporteur l'écarte", () => {
    const sirand = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).grandCompte).length;
    const laisser = [...MEILLEUR];
    laisser[D.prestataire] = 0;
    expect(sirand(MEILLEUR)).toBeGreaterThan(3);
    expect(sirand(MEILLEUR)).toBeLessThan(25);
    expect(sirand(laisser)).toBeGreaterThan(sirand(MEILLEUR));
    const second = [...MEILLEUR];
    second[D.prestataire] = 3;
    expect(sirand(second)).toBe(0);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : confier les seules tournées lointaines ; tout confier sous le coût complet fait perdre gros", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(40000);
  });

  it("D2 : l'engagement de service bat le prix le plus bas contre un volume garanti", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D3 : à l'échéance, rendre les porteurs ; les grues déjà payées ne plaident pas pour renouveler", () => {
    const r = rejeu(MEILLEUR, D.location);
    expect(classement(MEILLEUR, D.location)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    // Même sans avoir rien confié en semaine 1, l'échéance change la décision.
    const garder = [2, 2, 1, 1, 1, 1];
    expect(classement(garder, D.location)[0]).toBe(1);
  });

  it("D4 : le surplus de pointe au transporteur bat les samedis ; avec des porteurs restés, le renfort l'emporte", () => {
    const r = rejeu(MEILLEUR, D.pointe);
    expect(classement(MEILLEUR, D.pointe)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(3000);
    // Les porteurs loués prolongés et libres : leur loyer est payé quoi qu'il arrive.
    const prolonges = [1, 2, 2, 1, 1, 1];
    expect(classement(prolonges, D.pointe)[0]).toBe(2);
  });

  it("D5 : garder l'agglomération quand seul le coût complet a monté", () => {
    const r = rejeu(MEILLEUR, D.coutComplet);
    expect(classement(MEILLEUR, D.coutComplet)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : la mise en demeure est la meilleure en moyenne, le second transporteur la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.prestataire);
    expect(classement(MEILLEUR, D.prestataire)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(plusSure(MEILLEUR, D.prestataire)).toBe(3);
  });

  it("comparer aux coûts évitables bat le coût complet et l'attentisme, en moyenne", () => {
    const [evitables, complet, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(evitables).toBeGreaterThan(attentiste! + 15000);
    expect(attentiste).toBeGreaterThan(complet!);
    expect(attendu(ATTENTISTE)).toBe(attentiste);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et la bonne méthode n'en contient aucun", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_FAIRE_FAIRE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const defendable = option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000;
      expect(option.qualite, `réflexe [${d}, ${o}]`).toBeLessThan(0.7);
      expect(defendable).toBe(false);
    }
    const bonneMethode: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonneMethode[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["couts", "contrats"],
      ["references"],
      ["evitable"],
      ["pointe"],
      ["repartition"],
      ["suivi"],
    ],
    jours: JOURS,
    diagnostic: "evitables",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 66,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_FAIRE_FAIRE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi le coût complet, propose de comparer aux seuls coûts évitables", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_FAIRE_FAIRE.comportements(p, analyser(EPISODE_FAIRE_FAIRE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_FAIRE_FAIRE.axe(c).titre).toBe("Comparer un prix aux seuls coûts évitables");
  });

  it("à qui a décidé sans enquêter, propose de lister ce qui disparaît vraiment", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_FAIRE_FAIRE.comportements(p, analyser(EPISODE_FAIRE_FAIRE, p).trimestre);
    expect(EPISODE_FAIRE_FAIRE.axe(c).titre).toBe("Lister ce qui disparaît vraiment");
  });

  it("calibre la prévision sur le coût évitable : juste à 2 €, proche à 7 €", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_FAIRE_FAIRE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(66)).toBe(1);
    expect(score(60.5)).toBe(0.6); // les heures supplémentaires oubliées
    expect(score(83.7)).toBe(0); // la location comptée trop tôt
    expect(score(65)).toBe(1);
    expect(score(44)).toBe(0); // les CDI comptés comme évitables
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_FAIRE_FAIRE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_FAIRE_FAIRE.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/au-delà du budget/);
  });
});
