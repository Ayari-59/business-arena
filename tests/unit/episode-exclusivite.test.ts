import { describe, expect, it } from "vitest";
import {
  ANALYSE,
  CONTRAT,
  CONTRIBUTION_PROPOSEE,
  D,
  EXCLUS,
  EXTENSION,
  IMPREVUS,
  MARGE_EXCLUS,
  REGION,
  SCENARIOS,
  creditClient,
  hasard,
  partDeSarleve,
  posterieur,
  simuler,
  statut,
  valeurDeLExtension,
} from "../../src/engine/episodes/grand-compte-exclusif";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/grand-compte-exclusif";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  CONTRIBUTION_EN_KE,
  EPISODE_EXCLUSIVITE,
  VALEUR_D_UN_POINT,
  chiffresDeLExtension,
} from "../../src/pedagogy/episodes/grand-compte-exclusif";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le grand compte qui veut l'exclusivité » enseigne trois
 * choses : le volume d'un grand compte a un prix qui ne figure pas dans son
 * offre (la cellule, le crédit client, le stock, les clients exclus) ; la
 * dépendance donne au client le pouvoir de renégocier ; le risque de
 * concentration se borne par contrat et se révise au premier signal, et le
 * refuser par principe revient à donner le contrat au concurrent. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 2, 2, 2, 1, 2];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 0, 1, 0, 1];
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
const k = (v: number) => Math.round(v / 1000);
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_EXCLUSIVITE.contexte(
    EPISODE_EXCLUSIVITE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const messages = (etape: number, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx = EPISODE_EXCLUSIVITE.contexte(
    EPISODE_EXCLUSIVITE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  return ETAPES[etape]!.messages(ctx)
    .map((m) => m.texte)
    .join(" ");
};

describe("le modèle du contrat Sarlève", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).semaines[5]!.commandes).toBeCloseTo(
      simuler([1, 0, 0, 0, 0, 0], 12).semaines[5]!.commandes,
      6,
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

  it("le carnet de Sarlève tient environ une fois sur deux ; les trois carnets tombent", () => {
    const parCarnet = SCENARIOS.map(
      (_, s) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length,
    );
    expect(parCarnet.every((n) => n > 0)).toBe(true);
    expect(parCarnet[0]! / GRAINES_DU_BILAN.length).toBeGreaterThan(0.3);
    expect(parCarnet[0]! / GRAINES_DU_BILAN.length).toBeLessThan(0.7);
  });

  it("Sarlève signe toujours le contrat tel quel, part toujours si l'on décline, et répond au hasard aux contre-propositions", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(statut([0], g)).toBe("signe");
      expect(statut([3], g)).toBe("lestrade");
    }
    const issues = (d1: number) => new Set(GRAINES_DU_BILAN.map((g) => statut([d1], g)));
    expect(issues(1).has("signe")).toBe(true);
    expect(issues(1).has("plusTard")).toBe(true);
    expect(issues(2).has("lestrade")).toBe(true);
    // Refuser l'exclusivité fait partir Sarlève bien plus souvent que des clauses qui la bornent.
    const partis = (d1: number) =>
      GRAINES_DU_BILAN.filter((g) => statut([d1], g) === "lestrade").length;
    expect(partis(2)).toBeGreaterThan(partis(1) + 10);
  });

  it("la valeur part de zéro, et celle de la semaine 13 est l'objectif ; décliner a un coût", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(simuler(MEILLEUR, 5, 0).semaines[1]!.valeur).toBe(0);
    for (const g of GRAINES_DU_BILAN)
      expect(simuler(ATTENTISTE, g, 0).objectif).toBeLessThan(-50000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la contribution annuelle aux conditions proposées, que la semaine 1 demande, se pose ligne par ligne", () => {
    const credit = (CONTRAT.ca * 1.2 * 30 * 0.05) / 360;
    expect(creditClient(CONTRAT.ca)).toBeCloseTo(credit, 6);
    expect(k(credit)).toBe(25);
    expect(MARGE_EXCLUS).toBeCloseTo((EXCLUS.moulinier + EXCLUS.batival) * 0.11, 6);
    const aLaMain = 5_000_000 * 0.08 - 150_000 + 40_000 - credit - 400_000 * 0.08 - 88_000;
    expect(CONTRIBUTION_PROPOSEE).toBeCloseTo(aLaMain, 6);
    expect(CONTRIBUTION_EN_KE).toBeCloseTo(145, 6);
    expect(EPISODE_EXCLUSIVITE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(145, 6);
    const conditions = source(0, "conditions", []);
    expect(conditions).toContain(`${CONTRAT.ca / 1e6} M€ HT`);
    expect(conditions).toContain(`${CONTRAT.tauxMarge * 100} % de marge sur coût variable`);
    expect(conditions).toContain(`${CONTRAT.cellule / 1000} k€ par an, fixes`);
    expect(conditions).toContain(`${CONTRAT.stock / 1000} k€ de stock dédié`);
    const chiffrage = source(0, "chiffrage", []);
    expect(chiffrage).toContain(`${(EXCLUS.moulinier + EXCLUS.batival) / 1000} k€ HT`);
    expect(chiffrage).toContain(`${EXCLUS.taux * 100} % de marge`);
    expect(chiffrage).toContain(`${CONTRAT.remises / 1000} k€ de remises`);
    // Une année de marge des clients exclus, telle que la semaine 4 la donne.
    expect(source(2, "retour", [1, 2])).toContain(`${k(MARGE_EXCLUS)} k€`);
  });

  it("la part de Sarlève dans la région : près d'un quart, plus d'un quart avec la filiale", () => {
    const part = partDeSarleve(CONTRAT.ca);
    expect(part).toBeCloseTo(
      CONTRAT.ca / (REGION.ca - EXCLUS.moulinier - EXCLUS.batival + CONTRAT.ca),
      9,
    );
    expect(part).toBeGreaterThan(0.2);
    expect(part).toBeLessThan(0.25);
    const avecFiliale = partDeSarleve(CONTRAT.ca + EXTENSION.ca);
    expect(avecFiliale).toBeGreaterThan(0.25);
    expect(messages(3, [1, 2, 2])).toContain(`${Math.round(avecFiliale * 100)} %`);
    expect(simuler(MEILLEUR, 3).semaines[13]!.part).toBeCloseTo(part, 9);
  });

  it("la valeur de l'extension selon le carnet est celle que la source affiche, et l'analyse vaut son prix", () => {
    const c = chiffresDeLExtension(0.005);
    const texte = source(3, "extension", [1, 2, 2], 3);
    expect(texte).toContain(`crée ${k(c.parScenario[0]!)} k€`);
    expect(texte).toContain(`en détruit ${-k(c.parScenario[1]!)} k€`);
    expect(texte).toContain(`${-k(c.parScenario[2]!)} k€ si elle se retourne`);
    expect(texte).toContain(`+${k(c.esperance)} k€ en espérance`);
    expect(c.parScenario[0]).toBeCloseTo(valeurDeLExtension(0, { concession: 0.005 }), 6);
    // Accepter n'est qu'un pari à peine positif ; n'accepter qu'après une analyse favorable vaut bien plus.
    const informe =
      SCENARIOS.reduce(
        (acc, s, i) => acc + s.chance * ANALYSE.favorable[i]! * c.parScenario[i]!,
        0,
      ) - ANALYSE.cout;
    expect(informe).toBeGreaterThan(c.esperance + 15000);
    expect(informe).toBeGreaterThan(15000);
    // Une conclusion favorable rend le carnet solide bien plus probable.
    expect(posterieur(true)[0]!).toBeGreaterThan(0.75);
  });

  it("un point de prix sur deux ans et le coût de la rupture sont ceux de la revue des prix", () => {
    expect(VALEUR_D_UN_POINT).toBeCloseTo(50_000 / 1.08 ** 2 + 50_000 / 1.08 ** 3, 6);
    expect(k(VALEUR_D_UN_POINT)).toBe(83);
    expect(messages(5, [1, 2, 2, 2, 1])).toContain(`${k(VALEUR_D_UN_POINT)} k€ de valeur`);
    const rupture = source(5, "position", [1, 2, 2, 2, 1]);
    expect(rupture).toMatch(/perdrait \d+ k€ de valeur/);
    expect(rupture).toContain("une fois sur vingt");
    expect(source(5, "position", [0, 2, 2, 2, 1])).toContain("trois fois sur dix");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : borner la dépendance par contrat vaut bien plus que signer tel quel, refuser l'exclusivité ou décliner", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)).toEqual([1, 0, 2, 3]);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(80000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(80000);
  });

  it("D2 : le stock de sécurité bat le stock complet ; sans clause de reprise, le dépôt chez les fabricants le vaut", () => {
    const r = rejeu(MEILLEUR, D.stock);
    expect(classement(MEILLEUR, D.stock)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    // Sans reprise du stock par Sarlève, le stock complet coûte bien plus cher.
    const ecart = (c: readonly number[]) => {
      const x = rejeu(c, D.stock);
      return x[2]!.attendu - x[0]!.attendu;
    };
    expect(ecart([0, 2, 2, 2, 1, 2])).toBeGreaterThan(ecart(MEILLEUR) + 20000);
    expect(plusSure([0, 2, 2, 2, 1, 2], D.stock)).toBe(1);
  });

  it("D3 : préparer le retour des clients exclus bat la lettre et la campagne de conquête", () => {
    const r = rejeu(MEILLEUR, D.exclus);
    expect(classement(MEILLEUR, D.exclus)).toEqual([2, 1, 0]);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
  });

  it("D4 : s'informer avant d'étendre est le meilleur choix en moyenne ; refuser est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.extension);
    expect(classement(MEILLEUR, D.extension)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(plusSure(MEILLEUR, D.extension)).toBe(1);
  });

  it("D5 : au signal, réviser l'engagement bat le cap tenu et le seul gel du stock", () => {
    const r = rejeu(MEILLEUR, D.signal);
    expect(classement(MEILLEUR, D.signal)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : avec l'indexation, l'échange bat la baisse accordée ; sans elle, céder redevient le moins mauvais", () => {
    const r = rejeu(MEILLEUR, D.revue);
    expect(classement(MEILLEUR, D.revue)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    // Signé tel quel, rien ne borne la revue : tenir les prix devient un pari perdant.
    expect(classement([0, 2, 2, 2, 1, 2], D.revue)[0]).toBe(0);
  });

  it("la bonne méthode bat nettement prendre le volume et refuser par principe", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne!).toBeGreaterThan(200000);
    expect(bonne! - reflexe!).toBeGreaterThan(200000);
    expect(bonne! - attentiste!).toBeGreaterThan(200000);
    expect(attentiste!).toBeLessThan(0);
    expect(reflexe!).toBeGreaterThan(-150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_EXCLUSIVITE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["conditions", "chiffrage"],
      ["planning"],
      ["retour"],
      ["extension", "analyse"],
      ["signal"],
      ["position"],
    ],
    jours: JOURS,
    diagnostic: "dependance",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 145,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_EXCLUSIVITE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris le volume à chaque décision, propose de chiffrer la dépendance", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_EXCLUSIVITE.comportements(p, analyser(EPISODE_EXCLUSIVITE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EXCLUSIVITE.axe(c).titre).toBe(
      "Chiffrer la dépendance, pas seulement le volume",
    );
  });

  it("à qui a décidé sans enquêter, propose de chiffrer avant de signer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EXCLUSIVITE.comportements(p, analyser(EPISODE_EXCLUSIVITE, p).trimestre);
    expect(EPISODE_EXCLUSIVITE.axe(c).titre).toBe("Chiffrer avant de signer");
  });

  it("juge la contribution calculée en semaine 1 : juste, proche, ou faute d'avoir compté les clients exclus", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_EXCLUSIVITE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(145)).toBe(1);
    expect(score(158)).toBe(0.6);
    // Sans la marge de Moulinier et Batival : 145 + 88 = 233 k€.
    expect(score(233)).toBe(0);
    // Sans le crédit client : 170 k€.
    expect(score(170)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_EXCLUSIVITE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/valeur créée/);
    expect(EPISODE_EXCLUSIVITE.bilan.titre(simuler(ATTENTISTE, 11))).toMatch(/valeur détruite/);
  });
});
