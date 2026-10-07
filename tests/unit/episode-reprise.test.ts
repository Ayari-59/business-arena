import { describe, expect, it } from "vitest";
import {
  CET,
  D,
  DEFICIT_ESAT,
  DEFICIT_SOCIAL,
  ECONOMIES,
  ECONOMIES_NETTES,
  ECONOMIES_REPRISES,
  ESAT,
  IDR,
  IMPREVUS,
  PASSIF_SOCIAL,
  QUALITE,
  RANCUNE,
  RESULTAT_REGIME,
  RESULTAT_TRANSITION,
  SCENARIOS,
  TRANSITION,
  VALEUR_RECENTRAGE,
  hasard,
  issueDe,
  simuler,
} from "../../src/engine/episodes/association-a-reprendre";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/association-a-reprendre";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_REPRISE,
  PASSIF_SOCIAL_KE,
} from "../../src/pedagogy/episodes/association-a-reprendre";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'association qui demande à être reprise » enseigne qu'une
 * reprise se décide sur un diagnostic (comptes, passifs sociaux, bâtiments,
 * qualité, équipes), se négocie avec l'autorité de tarification (transition,
 * avenant au CPOM, reprise des passifs) et se prépare avec les équipes ; dire
 * oui pour plaire à l'ARS et non par prudence ont chacun leur coût. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le modèle
 * les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 3, 1, 1];
const REFLEXE = [0, 0, 0, 2, 0, 0];
const ATTENTISTE = [3, 0, 0, 0, 0, 0];
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
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const k = (v: number) => Math.round(v / 1000);
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_REPRISE.contexte(
    EPISODE_REPRISE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la reprise", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).travaux).toBe(simuler(ATTENTISTE, 12).travaux);
    expect(simuler(MEILLEUR, 12).semaines[5]!.tresorerie).toBe(
      simuler(REFLEXE, 12).semaines[5]!.tresorerie,
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

  it("l'enveloppe régionale prend ses trois états, à peu près aux fréquences dites", () => {
    const n = [0, 1, 2].map((s) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length);
    expect(n.every((x) => x > 0)).toBe(true);
    SCENARIOS.forEach((s, i) => {
      expect(n[i]! / 30).toBeGreaterThan(s.chance - 0.2);
      expect(n[i]! / 30).toBeLessThan(s.chance + 0.2);
    });
  });

  it("refuser fait reprendre les Primevères par un autre, et l'ARS s'en souvient parfois", () => {
    const refus = [2, 1, 1, 3, 1, 1];
    const valeurs = GRAINES_DU_BILAN.map((g) => simuler(refus, g, 0).objectif);
    for (const v of valeurs) expect(v).toBeLessThan(0);
    // Six fois sur dix environ, la rancune coûte cher ; sinon, quelques crédits.
    const cher = valeurs.filter((v) => v < -RANCUNE.leger - 1).length;
    expect(cher).toBeGreaterThan(10);
    expect(cher).toBeLessThan(26);
    for (const g of GRAINES_DU_BILAN) expect(issueDe(refus, g)).toBe("refus");
    // Les décisions suivantes ne changent plus rien.
    expect(simuler([2, 0, 0, 0, 0, 0], 5, 0).objectif).toBe(simuler(refus, 5, 0).objectif);
  });

  it("la valeur de la semaine 13 est l'objectif, et part de zéro", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(EPISODE_REPRISE.lire([], 5, 0, 0).valeur).toBe(0);
  });

  it("la bonne méthode atteint en moyenne l'objectif ; le oui pour plaire détruit beaucoup de valeur", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(100000);
    expect(bon).toBeLessThan(300000);
    expect(attendu(REFLEXE)).toBeLessThan(-500000);
    expect(attendu(REFLEXE)).toBeGreaterThan(-1000000);
    expect(attendu(ATTENTISTE)).toBeLessThan(-200000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le passif social, que la semaine 1 demande, se calcule depuis le registre du personnel", () => {
    expect(PASSIF_SOCIAL).toBe(
      IDR.salaries * IDR.mois * IDR.salaireCharge + CET.jours * CET.coutJour,
    );
    expect(PASSIF_SOCIAL_KE).toBeCloseTo(364.4, 6);
    expect(EPISODE_REPRISE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(364.4, 6);
    const texte = source(0, "personnel", []);
    expect(texte).toContain(`${IDR.salaries === 12 ? "Douze" : IDR.salaries} partiront`);
    expect(texte).toContain(`${IDR.mois === 6 ? "six" : IDR.mois} mois de salaire`);
    expect(texte).toContain(`${String(IDR.salaireCharge).replace(/(\d)(\d{3})$/, "$1 $2")} €`);
    expect(texte).toContain(`${CET.jours} jours, à ${CET.coutJour} €`);
  });

  it("le résultat des budgets repris et les économies de la fusion sont ceux des comptes affichés", () => {
    expect(ECONOMIES_NETTES).toBe(280000);
    expect(RESULTAT_TRANSITION).toBe(-70000);
    expect(RESULTAT_REGIME).toBe(70000);
    expect(DEFICIT_ESAT).toBe(55000);
    const texte = source(0, "comptes", []);
    expect(texte).toContain(`Déficit de l'IME : ${k(DEFICIT_SOCIAL - 35000)} k€`);
    expect(texte).toContain(`(250 k€ par an`);
    expect(texte).toContain(`${k(ECONOMIES.renfort)} k€ de renfort`);
    expect(texte).toContain(`${k(ECONOMIES.achats)} k€ d'achats`);
    expect(texte).toContain(`soit ${k(ECONOMIES_NETTES)} k€ par an en régime`);
    expect(texte).toContain(
      `passeraient de ${k(DEFICIT_SOCIAL)} k€ de déficit à ${k(RESULTAT_REGIME)} k€ d'excédent par an, après une première année à −${-k(RESULTAT_TRANSITION)} k€`,
    );
    expect(texte).toContain(`budget commercial de l'ESAT : ${k(DEFICIT_ESAT)} k€`);
  });

  it("ce que l'ARS peut financer, et ses chances selon le dossier, sont ceux du modèle", () => {
    expect(TRANSITION).toBe(70000);
    expect(ECONOMIES_REPRISES).toBe(210000);
    const texte = source(2, "financable", [1, 1]);
    expect(texte).toContain(`les ${k(TRANSITION)} k€ de déficit de la première année`);
    expect(texte).toContain(`dès la troisième année, ${k(ECONOMIES_REPRISES)} k€ sur le CPOM`);
    // « quatre fois sur cinq » avec un audit complet, « trois fois sur cinq » sans.
    expect(QUALITE.dossier[1] + QUALITE.audit[1]).toBeCloseTo(0.8, 9);
    expect(QUALITE.dossier[1] + QUALITE.audit[0]).toBeCloseTo(0.6, 9);
    expect(QUALITE.reponse[0]).toBeCloseTo(-0.3, 9);
    expect(source(2, "chances", [1, 1])).toContain("trois chances sur dix de moins");
    // Un retrait tardif : trois fois sur quatre, autour de 230 k€.
    expect(k(RANCUNE.retrait.facteur * RANCUNE.moyenne)).toBe(228);
    expect(source(4, "retrait", [1, 1, 1, 3])).toContain("autour de 230 k€");
  });

  it("le compte des ateliers de l'ESAT et le recentrage sont ceux du modèle", () => {
    const texte = source(3, "ateliers", [1, 1, 1]);
    expect(texte).toContain(`${k(DEFICIT_ESAT)} k€ de déficit par an`);
    expect(texte).toContain(`${k(ESAT.recentrage.cout)} k€ de transition`);
    expect(texte).toContain(`${-k(ESAT.recentrage.premiereAnnee)} k€ la première année`);
    expect(texte).toContain(`${-k(ESAT.recentrage.regime)} k€ par an`);
    expect(VALEUR_RECENTRAGE).toBe(-70000);
    const appel = source(3, "appel", [1, 1, 1]);
    expect(appel).toContain(`${k(ESAT.appel.gain)} k€ par an`);
    expect(appel).toContain(`${k(ESAT.appel.materiel)} k€ de matériel`);
  });

  it("les conclusions de l'audit disent ce que le hasard a caché, selon l'audit choisi", () => {
    const g = GRAINES_DU_BILAN.find((x) => hasard(x).prudhommes && hasard(x).travaux > 0)!;
    const complet = source(4, "conclusions", [1, 1, 1, 3], g);
    expect(complet).toContain("85 k€");
    expect(complet).toContain(`${k(hasard(g).travaux)} k€ de travaux`);
    const financier = source(4, "conclusions", [1, 2, 1, 3], g);
    expect(financier).toContain("85 k€");
    expect(financier).toContain("Les bâtiments n'ont pas été examinés");
    expect(source(4, "conclusions", [1, 0, 1, 3], g)).toContain("Aucun audit");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'accord de principe sous conditions bat le oui sans conditions et le refus", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(1);
    expect(classement(MEILLEUR, D.reponse).at(-1)).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
  });

  it("D2 : l'audit complet coûte, et rapporte le plus ; les comptes certifiés seuls, le moins", () => {
    const r = rejeu(MEILLEUR, D.audit);
    expect(classement(MEILLEUR, D.audit)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(100000);
  });

  it("D3 : chiffrer ce que l'ARS peut financer bat ne rien chiffrer et tout demander", () => {
    const r = rejeu(MEILLEUR, D.dossier);
    expect(classement(MEILLEUR, D.dossier)[0]).toBe(1);
    expect(classement(MEILLEUR, D.dossier).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
  });

  it("D4 : l'appel d'offres est le meilleur en moyenne, le recentrage seul le plus sûr ; imputer au budget social, le pire", () => {
    const r = rejeu(MEILLEUR, D.esat);
    expect(classement(MEILLEUR, D.esat)[0]).toBe(3);
    expect(classement(MEILLEUR, D.esat).at(-1)).toBe(2);
    expect(plusSure(MEILLEUR, D.esat)).toBe(1);
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
  });

  it("D5 : rouvrir la négociation bat le vote comme annoncé, d'autant plus que l'audit a été complet", () => {
    const r = rejeu(MEILLEUR, D.cap);
    expect(classement(MEILLEUR, D.cap)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.cap);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([1, 0, 1, 3, 1, 1]) + 100000);
  });

  it("D6 : associer les équipes bat le silence, l'alignement des salaires et le directeur de transition", () => {
    const r = rejeu(MEILLEUR, D.equipes);
    expect(classement(MEILLEUR, D.equipes)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
  });

  it("le oui sans conditions fait perdre au dossier chiffré une partie de sa valeur", () => {
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.dossier);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([0, 1, 1, 3, 1, 1]) + 20000);
  });

  it("la reprise négociée bat le oui pour plaire et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(500000);
    expect(bonne! - attentiste!).toBeGreaterThan(300000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_REPRISE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => (REFERENCES[0].chemin as readonly number[])[d] === o)).toBe(
      false,
    );
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["comptes", "personnel"],
      ["diligences"],
      ["financable"],
      ["ateliers"],
      ["conclusions", "regard"],
      ["directrice"],
    ],
    jours: JOURS,
    diagnostic: "conditions",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 364,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_REPRISE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de ne dire ni oui pour plaire ni non par principe", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_REPRISE.comportements(p, analyser(EPISODE_REPRISE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_REPRISE.axe(c).titre).toBe("Ni oui pour plaire, ni non par principe");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer avant de répondre", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_REPRISE.comportements(p, analyser(EPISODE_REPRISE, p).trimestre);
    expect(EPISODE_REPRISE.axe(c).titre).toBe("Chiffrer avant de répondre");
  });

  it("juge le passif social chiffré en semaine 1 : juste, proche, ou faute d'avoir compté les comptes épargne-temps", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_REPRISE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(364)).toBe(1);
    expect(score(395)).toBe(0.6);
    // Les seules indemnités de départ à la retraite : 280,8 k€.
    expect(score(281)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_REPRISE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/valeur créée/);
    expect(EPISODE_REPRISE.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
