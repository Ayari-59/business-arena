import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  simuler,
  tauxDeDeclaration,
  traitementDesCamions,
} from "../../src/engine/episodes/quai-dangereux";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/quai-dangereux";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_SECURITE } from "../../src/pedagogy/episodes/quai-dangereux";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le quai dangereux » enseigne trois choses : les presque-accidents
 * annoncent l'accident et ne servent que s'ils sont déclarés puis analysés,
 * sanctionner celui qui déclare fait taire les signaux sans retirer le danger,
 * et un danger se traite à la source (séparer les flux) plutôt que par une
 * consigne ou en poussant la cadence. Ces tests verrouillent les classements
 * qui le disent.
 */

const MEILLEUR = [2, 0, 0, 2, 1, 0];
const REFLEXE = [0, 1, 1, 0, 0, 1];
const ATTENTISTE = [3, 1, 3, 3, 3, 3];
const JOURS = 2;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** Les fiches déclarées et l'indice de risque en semaine 4, en moyenne sur les trente tirages. */
function aLaSemaine4(chemin: readonly number[]) {
  const ts = GRAINES_DU_BILAN.map((g) => simuler(chemin, g));
  return {
    declares: moyenne(ts.map((t) => t.semaines[4]!.declaresCumul)),
    risque: moyenne(ts.map((t) => t.semaines[4]!.risque)),
  };
}
const graves = (chemin: readonly number[]) =>
  GRAINES_DU_BILAN.filter((g) => simuler(chemin, g).semaineGrave > 0).length;

describe("le modèle de la plateforme", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    // Mêmes décisions en semaines 1 et 2 : mêmes semaines 1 et 2, quoi qu'on décide ensuite.
    const autre = [2, 1, 3, 3, 3, 3];
    expect(simuler(MEILLEUR, 12).semaines[2]).toEqual(simuler(autre, 12).semaines[2]);
    expect(hasard(12)).toBe(hasard(12));
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

  it("l'accident grave est un tirage, bien plus fréquent quand le danger n'est pas traité", () => {
    expect(graves(MEILLEUR)).toBeLessThanOrEqual(3);
    expect(graves(REFLEXE)).toBeGreaterThanOrEqual(6);
    expect(graves(ATTENTISTE)).toBeGreaterThanOrEqual(6);
  });

  it("sanctionner fait baisser les déclarations sans baisser le danger", () => {
    expect(tauxDeDeclaration([0, 1, 3, 3, 3, 3], 4)).toBeLessThan(
      tauxDeDeclaration([3, 1, 3, 3, 3, 3], 4),
    );
    expect(tauxDeDeclaration([2, 1, 3, 3, 3, 3], 4)).toBeGreaterThan(0.4);
    expect(tauxDeDeclaration([2, 1, 3, 3, 0, 3], 10)).toBeLessThan(
      tauxDeDeclaration([2, 1, 3, 3, 3, 3], 10),
    );
    // Moins de fiches avec la sanction, mais un danger qui ne baisse pas pour autant.
    const sanction = aLaSemaine4([0, 1, 3, 3, 3, 3]);
    const rien = aLaSemaine4([3, 1, 3, 3, 3, 3]);
    expect(sanction.declares).toBeLessThan(rien.declares * 0.7);
    expect(sanction.risque).toBeGreaterThan(rien.risque * 0.95);
    // L'analyse ne trouve que ce qui a été déclaré.
    expect(traitementDesCamions(0.5)).toBeGreaterThan(2 * traitementDesCamions(0.1));
  });

  it("les bonnes décisions ramènent le risque sous l'objectif ; l'attente le laisse monter", () => {
    expect(simuler(MEILLEUR, 3).risqueFinal).toBeLessThan(30);
    expect(simuler(ATTENTISTE, 3).risqueFinal).toBeGreaterThan(60);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : analyser l'incident sans coupable est de loin le meilleur choix ; la sanction ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.presque);
    expect(classement(MEILLEUR, D.presque)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
  });

  it("D2 : retirer Dylan des chariots et le former bat le laisser conduire", () => {
    const r = rejeu(MEILLEUR, D.dylan);
    expect(classement(MEILLEUR, D.dylan)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
    // Sans habilitation, Dylan peut être en cause dans l'accident grave : la faute inexcusable.
    const fautes = GRAINES_DU_BILAN.filter((g) => simuler(ATTENTISTE, g).faute).length;
    expect(fautes).toBeGreaterThan(0);
    expect(GRAINES_DU_BILAN.some((g) => simuler(MEILLEUR, g).faute)).toBe(false);
  });

  it("D3 : séparer les flux bat la campagne de consignes, qui ne vaut pas mieux que rien", () => {
    const r = rejeu(MEILLEUR, D.flux);
    expect(classement(MEILLEUR, D.flux)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu).toBeLessThan(r[3]!.attendu + 1000);
  });

  it("D4 : lisser les commandes est le meilleur en moyenne, le samedi le plus sûr ; la prime coûte", () => {
    const r = rejeu(MEILLEUR, D.saison);
    expect(classement(MEILLEUR, D.saison)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10 + 5000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(3000);
    // Sans flux séparés, la prime au rendement pousse des chariots pressés au milieu des piétons.
    const sansSeparer = [2, 0, 3, 2, 1, 0];
    const s = rejeu(sansSeparer, D.saison);
    expect(r[2]!.attendu - r[0]!.attendu).toBeLessThan(s[2]!.attendu - s[0]!.attendu);
  });

  it("D5 : analyser les fiches vaut quand on a fait déclarer ; après une sanction, l'audit fait mieux", () => {
    expect(classement(MEILLEUR, D.retour)[0]).toBe(1);
    const r = rejeu(MEILLEUR, D.retour);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    // Le challenge « zéro accident » fait taire les fiches : pire que ne rien faire.
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
    const apresSanction = [0, 0, 0, 2, 1, 0];
    const s = rejeu(apresSanction, D.retour);
    expect(s[2]!.attendu).toBeGreaterThan(s[1]!.attendu);
  });

  it("D6 : prioriser les chantiers et donner une date bat le double chargement", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(2500);
  });

  it("écouter les signaux et traiter à la source bat les réflexes et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 50000);
    expect(methode).toBeGreaterThan(attentiste! + 50000);
    expect(aLaSemaine4(MEILLEUR).declares).toBeGreaterThan(aLaSemaine4(REFLEXE).declares);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["registre", "quais"],
      ["reglement"],
      ["plan"],
      ["vagues"],
      ["fiches"],
      ["attente"],
    ],
    jours: JOURS,
    diagnostic: "signaux",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 8,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SECURITE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de traiter le danger plutôt que le coupable", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_SECURITE.comportements(p, analyser(EPISODE_SECURITE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SECURITE.axe(c).titre).toBe("Traiter le danger, pas le coupable");
  });

  it("à qui a décidé sans enquêter, propose de compter les presque-accidents", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SECURITE.comportements(p, analyser(EPISODE_SECURITE, p).trimestre);
    expect(EPISODE_SECURITE.axe(c).titre).toBe("Compter les presque-accidents");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_SECURITE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_SECURITE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
