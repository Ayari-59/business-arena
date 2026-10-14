import { describe, expect, it } from "vitest";
import {
  AMO_SEMAINE,
  AUDITS,
  CONSULTANTS,
  COUTS,
  COUT_JOUR,
  CREDIBILITE,
  D,
  IMPREVUS,
  INTERCONTRAT_SI_RIEN,
  JOURS_STAFFABLES,
  JOURS_SUIVANT,
  SEMAINES_SUIVANT,
  chanceDePartir,
  chanceDeRater,
  hasard,
  simuler,
} from "../../src/engine/episodes/practice-a-reorienter";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  LIBRES_PAR_SEMAINE,
  REFERENCES,
  REFLEXES,
  TRIMESTRE_D_INTERCONTRAT,
} from "../../src/config/episodes/practice-a-reorienter";
import { euros } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_RECONVERSION } from "../../src/pedagogy/episodes/practice-a-reorienter";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La practice dont le marché s'éteint » enseigne qu'une équipe se
 * reconvertit par étapes : on garde le métier actuel tant qu'il paie, on
 * forme sur de vraies missions en binôme avec des experts recrutés, et on
 * traite chacun selon sa situation. Attendre coûte l'intercontrat ; tout
 * basculer d'un coup coûte des missions ratées et des départs. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [...REFERENCES[0].chemin];
const BASCULE = [...REFERENCES[1].chemin];
const ATTENTE = [...REFERENCES[2].chemin];
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
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r(ctx);
};

describe("le modèle de la practice Énergie et bâtiment", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.occupation).toBeCloseTo(
      simuler(BASCULE, 12).semaines[1]!.occupation,
      9,
    );
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(ATTENTE, 12).scenario);
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

  it("les chiffres des sources se recalculent depuis les constantes du modèle", () => {
    // L'intercontrat de décembre à février si rien ne change : la prévision de la semaine 1.
    expect(INTERCONTRAT_SI_RIEN).toBe(
      CONSULTANTS * SEMAINES_SUIVANT * JOURS_STAFFABLES -
        (AUDITS.decembre + AUDITS.janvier + AUDITS.fevrier) -
        AMO_SEMAINE * SEMAINES_SUIVANT,
    );
    expect(INTERCONTRAT_SI_RIEN).toBe(506);
    expect(EPISODE_RECONVERSION.prevision.reel(simuler(MEILLEUR, 3))).toBe(506);
    const planDeCharge = texte(0, "plan-de-charge");
    expect(planDeCharge).toContain(`décembre ${AUDITS.decembre}, janvier ${AUDITS.janvier}`);
    expect(planDeCharge).toContain(`soit ${JOURS_SUIVANT} jours staffables par consultant`);
    // Ce que les audits et l'AMO laissent libre chaque semaine, en octobre et en novembre.
    expect(LIBRES_PAR_SEMAINE.octobre).toBe(72 - 185 / 5 - 22);
    expect(LIBRES_PAR_SEMAINE.octobre).toBe(13);
    expect(LIBRES_PAR_SEMAINE.novembre).toBe(24);
    expect(texte(2, "charge")).toContain(
      "13 jours libres par semaine en octobre et 24 en novembre",
    );
    // Un trimestre d'intercontrat, et le devis de certification.
    expect(TRIMESTRE_D_INTERCONTRAT).toBe(48 * COUT_JOUR);
    expect(texte(3, "couts")).toContain(euros(20160));
    expect(texte(2, "devis")).toContain(euros(CONSULTANTS * COUTS.certification));
    expect(euros(CONSULTANTS * COUTS.certification)).toBe(euros(32400));
    // Sans expert ni référence, une proposition sur cinq.
    expect(CREDIBILITE.depart).toBe(0.2);
    expect(texte(1, "propositions", { cap: 1 })).toContain("une proposition sur cinq");
  });

  it("attendre laisse venir l'intercontrat ; reconvertir par étapes le réduit de moitié au moins", () => {
    const moyenneInter = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).projection.intercontrat));
    expect(moyenneInter(ATTENTE)).toBeGreaterThan(380);
    expect(moyenneInter(MEILLEUR)).toBeLessThan(INTERCONTRAT_SI_RIEN / 2);
  });

  it("imposer la reconversion fait partir les réticents ; trop de binômes font rater la mission", () => {
    expect(chanceDePartir([1, 0, 1, 0], 1)).toBeGreaterThan(chanceDePartir([1, 0, 1, 1], 1));
    const subis = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).departs.some((x) => x.nature === "subi")).length;
    const imposer = [...MEILLEUR];
    imposer[D.reticents] = 0;
    expect(subis(imposer)).toBeGreaterThan(subis(MEILLEUR) + 10);
    const enc = { experts: 2, independants: 0 };
    expect(chanceDeRater(MEILLEUR, enc, 8)).toBeGreaterThan(chanceDeRater(MEILLEUR, enc, 4) + 0.1);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : reconvertir par étapes bat de loin les derniers audits et la bascule", () => {
    const r = rejeu(MEILLEUR, D.cap);
    expect(classement(MEILLEUR, D.cap)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(50000);
  });

  it("D2 : deux expertes valent le plus en moyenne, mais les indépendants protègent mieux", () => {
    const r = rejeu(MEILLEUR, D.experts);
    expect(classement(MEILLEUR, D.experts)[0]).toBe(0);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[2]!.p10).toBeGreaterThan(r[0]!.p10 + 10000);
  });

  it("D2 : des expertes sans avant-vente en décarbonation n'ont rien à faire", () => {
    const sansAvantVente = [...MEILLEUR];
    sansAvantVente[D.cap] = 0;
    const r = rejeu(sansAvantVente, D.experts);
    expect(r[2]!.attendu).toBeGreaterThan(r[0]!.attendu + 30000);
    expect(classement(sansAvantVente, D.experts)[0]).not.toBe(0);
  });

  it("D3 : quatre binômes sur de vraies missions battent la salle, la précipitation et l'attente", () => {
    const c = classement(MEILLEUR, D.binomes);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const r = rejeu(MEILLEUR, D.binomes);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D4 : traiter chacun selon sa situation bat la règle unique, l'attente et le plan de départs", () => {
    const r = rejeu(MEILLEUR, D.reticents);
    expect(classement(MEILLEUR, D.reticents)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(
      15000,
    );
  });

  it("D5 : garder les audits qui paient sans arrêter les binômes, et proposer la suite", () => {
    const c = classement(MEILLEUR, D.commande);
    expect(c[0]).toBe(1);
    expect(c.indexOf(0)).toBeGreaterThan(0);
    expect(c.indexOf(3)).toBeGreaterThan(c.indexOf(0));
  });

  it("D6 : planifier personne par personne bat l'attente, la bascule et la surenchère", () => {
    const c = classement(MEILLEUR, D.plan);
    expect(c[0]).toBe(1);
    const r = rejeu(MEILLEUR, D.plan);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("reconvertir par étapes bat la bascule et l'attente, en moyenne", () => {
    const [etapes, bascule, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(etapes).toBeGreaterThan(bascule! + 100000);
    expect(etapes).toBeGreaterThan(attente! + 100000);
  });

  it("aucun réflexe dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) expect(MEILLEUR[d]).not.toBe(o);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["plan-de-charge", "clients"],
      ["candidates", "propositions"],
      ["apprentissage"],
      ["situations", "couts"],
      ["novembre", "conserveries"],
      ["carnet"],
    ],
    jours: 2,
    diagnostic: "reconversion",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 500,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RECONVERSION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a vendu les audits en remettant la suite à plus tard, propose de ne ni attendre ni tout basculer", () => {
    const p = partie(ATTENTE, { diagnostic: "creux" });
    const c = EPISODE_RECONVERSION.comportements(p, analyser(EPISODE_RECONVERSION, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RECONVERSION.axe(c).titre).toBe("Ni attendre, ni tout basculer");
  });

  it("à qui a décidé sans enquêter, propose de lire le plan de charge", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RECONVERSION.comportements(p, analyser(EPISODE_RECONVERSION, p).trimestre);
    expect(EPISODE_RECONVERSION.axe(c).titre).toBe("Lire le plan de charge avant de décider");
  });

  it("calibre la prévision sur l'intercontrat de décembre à février", () => {
    const juste = partie(MEILLEUR, { prevision: 515 });
    const loin = partie(MEILLEUR, { prevision: 860 });
    const t = simuler(MEILLEUR, 11, 2);
    expect(EPISODE_RECONVERSION.comportements(juste, t)[3]!.score).toBe(1);
    expect(EPISODE_RECONVERSION.comportements(loin, t)[3]!.score).toBe(0);
  });

  it("dit le résultat en valeur, trimestre suivant compris", () => {
    expect(EPISODE_RECONVERSION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/de valeur/);
    expect(EPISODE_RECONVERSION.bilan.titre(simuler(BASCULE, 4242))).toMatch(/perdue/);
  });
});
