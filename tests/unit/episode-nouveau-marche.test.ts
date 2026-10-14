import { describe, expect, it } from "vitest";
import {
  AGENCES,
  CABINET,
  D,
  FABRICANT,
  FACTEUR,
  FIXE,
  IMPREVUS,
  MARCHE,
  MARCHE_ACCESSIBLE,
  MARGE,
  MULTIPLE,
  OUVERTURE,
  RIPOSTE,
  SCENARIOS,
  SEUIL,
  SEUIL_OUVERTURE,
  TAUX,
  annuite,
  bouquetsDuPlan,
  hasard,
  planJustifie,
  probaSolveane,
  rythmeMesure,
  simuler,
  solveaneEntre,
} from "../../src/engine/episodes/marche-qui-s-ouvre";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  CHIFFRES,
  ETAPES,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/marche-qui-s-ouvre";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_NOUVEAU_MARCHE,
  MARCHE_EN_MILLIONS,
} from "../../src/pedagogy/episodes/marche-qui-s-ouvre";
import { kE, nombre } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le marché qui s'ouvre » enseigne trois choses : un marché se
 * compte par le bas, et un test est une option réelle — il coûte peu, et
 * garde le droit d'étendre ou d'arrêter ; un test ne vaut que ce qu'il
 * mesure, et le plan doit suivre ses chiffres, à la hausse comme à la
 * baisse ; la ressource rare, ce sont les artisans, et les engagements de
 * volume se paient quand le marché déçoit. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres
 * que les sources affichent.
 */

const MEILLEUR = [2, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 2, 2, 2, 0, 2];
const VITRINE = [2, 0, 1, 1, 1, 1];
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_NOUVEAU_MARCHE.contexte(
    EPISODE_NOUVEAU_MARCHE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle du marché qui s'ouvre", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    for (const g of [3, 12, 25]) {
      expect(simuler(MEILLEUR, g).scenario).toBe(simuler(REFLEXE, g).scenario);
      expect(simuler(MEILLEUR, g).justifie).toEqual(simuler(ATTENTISTE, g).justifie);
    }
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

  it("tire les trois scénarios à peu près aux probabilités que l'économiste annonce", () => {
    expect(moyenne(SCENARIOS.map((s) => s.chance)) * 3).toBeCloseTo(1, 9);
    for (const s of SCENARIOS) {
      const part = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s.id).length / 30;
      expect(part, s.id).toBeGreaterThan(s.chance - 0.12);
      expect(part, s.id).toBeLessThan(s.chance + 0.12);
    }
  });

  it("Solvéane vient plus souvent après un lancement à grand bruit, moins quand les artisans sont engagés", () => {
    // Sans engagement des artisans : trois chances sur quatre après un lancement massif, quatre sur dix après un test.
    expect(probaSolveane([0, 1, 2, 1, 1, 2])).toBeCloseTo(0.75, 9);
    expect(probaSolveane([2, 1, 2, 1, 1, 2])).toBeCloseTo(0.4, 9);
    expect(probaSolveane(MEILLEUR)).toBeCloseTo(0.4 - 0.12, 9);
    expect(probaSolveane(ATTENTISTE)).toBeGreaterThan(probaSolveane(MEILLEUR));
    const venues = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => solveaneEntre(c, g)).length;
    expect(venues(REFLEXE)).toBeGreaterThan(venues(MEILLEUR));
    expect(venues([0, 0, 2, 0, 0, 2])).toBeGreaterThan(venues(MEILLEUR) + 5);
  });

  it("la valeur de la semaine 13 est l'objectif ; attendre ne vaut que ce que Solvéane coûte au négoce", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.semaines[1]!.valeur).toBeCloseTo(0, 6);
    expect(simuler(MEILLEUR, 5, 3).semaines[1]!.valeur).toBeCloseTo(-2000, 6);
    const attente = attendu(ATTENTISTE);
    expect(attente).toBeLessThan(0);
    expect(attente).toBeGreaterThan(-80000);
  });

  it("les valeurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(-900000);
        expect(t.objectif).toBeLessThan(1000000);
        expect(t.engage).toBeLessThan(700000);
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le marché accessible, que la semaine 1 demande, se compte par le bas : 72 M€, pas les 97,5 du cabinet", () => {
    expect(MARCHE_ACCESSIBLE).toBe(
      MARCHE.maisons * MARCHE.renovation * MARCHE.bouquet * MARCHE.panier,
    );
    expect(MARCHE_EN_MILLIONS).toBeCloseTo(72, 9);
    expect(EPISODE_NOUVEAU_MARCHE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(72, 9);
    expect(CHIFFRES.chantiers).toBe(12000);
    expect(CHIFFRES.cabinet).toBeCloseTo(97.5e6, 3);
    expect(source(0, "logements", [])).toContain(`${(400000).toLocaleString("fr-FR")} maisons`);
    expect(source(0, "logements", [])).toContain(
      `${CHIFFRES.chantiers.toLocaleString("fr-FR")} chantiers`,
    );
    expect(source(0, "artisans", [])).toContain("4 chantiers de rénovation sur 10");
    expect(source(0, "artisans", [])).toContain(`${kE(MARCHE.panier)} hors taxes`);
    expect(source(0, "etude", [])).toContain(`soit ${nombre(CHIFFRES.cabinet / 1e6, 1)} M€`);
    expect(source(0, "etude", [])).toContain(`${nombre(CABINET.marche / 1e6, 1)} M€ par an`);
  });

  it("le seuil de rentabilité d'une agence est celui que la source affiche", () => {
    expect(SEUIL).toBeCloseTo(FIXE / MARGE, 9);
    expect(SEUIL).toBe(11);
    expect(SEUIL_OUVERTURE).toBeCloseTo((FIXE + OUVERTURE / annuite(3, TAUX)) / MARGE, 9);
    expect(nombre(SEUIL_OUVERTURE, 1)).toBe("12,6");
    expect(MULTIPLE).toBeCloseTo(annuite(3, 0.1), 9);
    const texte = source(4, "seuil", [2, 1, 1, 1]);
    expect(texte).toContain("à partir de 11 bouquets par an");
    expect(texte).toContain("il en faut 12,6");
  });

  it("le plan justifié par chaque scénario est celui que le seuil désigne, agence par agence", () => {
    for (const s of SCENARIOS) {
      const plan = planJustifie(s.id);
      const grande = s.bouquets * FACTEUR.grande > SEUIL_OUVERTURE;
      const autre = s.bouquets * FACTEUR.autre > SEUIL_OUVERTURE;
      expect(plan.grandes, s.id).toBe(grande ? AGENCES.grandes : 0);
      expect(plan.autres, s.id).toBe(autre ? AGENCES.autres : 0);
    }
    // Les rythmes mesurés par le test restent du même côté du seuil, quel que soit le tirage.
    for (const g of GRAINES_DU_BILAN) {
      const s = SCENARIOS.find((x) => x.id === hasard(g).scenario)!;
      const plan = planJustifie(s.id);
      expect(rythmeMesure(g, "grande") > SEUIL_OUVERTURE).toBe(plan.grandes > 0);
      expect(rythmeMesure(g, "autre") > SEUIL_OUVERTURE).toBe(plan.autres > 0);
    }
    // Trois agences représentatives donnent le rythme moyen du réseau ; trois grandes, 40 % de plus.
    expect((FACTEUR.grande + 2 * FACTEUR.autre) / 3).toBeCloseTo(1, 9);
    expect(source(1, "representativite", [2])).toContain("40 % au-dessus");
  });

  it("les résultats du test sont ceux que le modèle mesure", () => {
    const g = 4;
    const texte = source(4, "resultats", [2, 1, 1, 1], g);
    expect(texte).toContain(`la grande agence signe ${nombre(rythmeMesure(g, "grande"), 1)}`);
    expect(texte).toContain(`rurale, ${nombre(rythmeMesure(g, "autre"), 1)} chacune`);
    expect(source(4, "resultats", [2, 0, 1, 1], g)).toContain("Aucune agence périurbaine");
  });

  it("l'engagement de volume du fabricant se rapporte aux bouquets de chaque scénario", () => {
    expect(CHIFFRES.volumeFabricant).toBe(750);
    expect(CHIFFRES.reseauPorteur).toBeCloseTo(600, 9);
    expect(CHIFFRES.grandesMoyen).toBeCloseTo(182, 9);
    expect(FABRICANT.exclusivite.remise).toBeCloseTo(80, 9);
    expect(FABRICANT.referencement.remise).toBeCloseTo(30, 9);
    const texte = source(3, "volumes", [2, 1, 1]);
    expect(texte).toContain("300 pompes, c'est 750 bouquets par an");
    expect(texte).toContain(`signeraient ${CHIFFRES.reseauPorteur} dans le scénario porteur`);
    expect(texte).toContain(`${nombre(FABRICANT.exclusivite.remise, 0)} € de marge en plus`);
  });

  it("la riposte par les prix coûte ce que la source affiche, avec le plan engagé", () => {
    const decisions = [2, 1, 1, 1, 1];
    const g = 2;
    const n = bouquetsDuPlan(decisions.concat(2), g);
    expect(n).toBeGreaterThan(0);
    const cout = RIPOSTE.annonce + (RIPOSTE.prix * n) / (1 + TAUX);
    const texte = source(5, "riposte", decisions, g);
    expect(texte).toContain(`${kE(cout)} en valeur actuelle`);
    expect(texte).toContain(`${nombre(n, 0)} bouquets par an`);
    expect(RIPOSTE.prix).toBe(150);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le test bat le lancement massif, le lancement dans les grandes agences et l'attente", () => {
    const r = rejeu(MEILLEUR, D.entree);
    expect(classement(MEILLEUR, D.entree)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(30000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(150000);
    // Le lancement massif gagne un peu de vitesse, et expose à tout perdre.
    expect(r[0]!.p10).toBeLessThan(r[2]!.p10 - 300000);
    // Attendre est le plus sûr, et de loin le moins rentable : l'espérance et la robustesse s'opposent.
    expect(plusSure(MEILLEUR, D.entree)).toBe(3);
  });

  it("D2 : un test sur des agences représentatives bat le test en vitrine et les volontaires", () => {
    const r = rejeu(MEILLEUR, D.test);
    expect(classement(MEILLEUR, D.test)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
  });

  it("D3 : la charte bat l'exclusivité à volume garanti et l'absence d'engagement, d'autant plus après un lancement massif", () => {
    const r = rejeu(MEILLEUR, D.artisans);
    expect(classement(MEILLEUR, D.artisans)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.artisans);
      return x[1]!.attendu - x[2]!.attendu;
    };
    expect(gain([0, 1, 1, 1, 1, 1])).toBeGreaterThan(gain(MEILLEUR) + 30000);
  });

  it("D4 : le référencement sans volume est le meilleur, l'exclusivité du fabricant nettement moins bonne, le partage du risque le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.fabricant);
    expect(classement(MEILLEUR, D.fabricant)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(plusSure(MEILLEUR, D.fabricant)).toBe(3);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D5 : réviser l'ambition sur les chiffres bat tenir le plan, prolonger et accélérer — sauf si le test était en vitrine", () => {
    const r = rejeu(MEILLEUR, D.extension);
    const c = classement(MEILLEUR, D.extension);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    // Un test mené dans les plus grosses agences fait passer le marché moyen pour porteur :
    // suivre ses chiffres fait alors étendre à tort, et tenir le plan vaut mieux.
    const v = rejeu(VITRINE, D.extension);
    expect(v[0]!.attendu).toBeGreaterThan(v[1]!.attendu);
    // Réviser, c'est à la hausse comme à la baisse.
    const plans = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).plan);
    expect(plans.some((p) => p.autres === AGENCES.autres)).toBe(true);
    expect(plans.some((p) => p.grandes + p.autres === 0)).toBe(true);
  });

  it("D6 : la riposte ciblée, déclenchée seulement si Solvéane vient, bat la baisse de prix préventive", () => {
    const r = rejeu(MEILLEUR, D.riposte);
    expect(classement(MEILLEUR, D.riposte)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
  });

  it("tester puis décider sur les chiffres bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne!).toBeGreaterThan(200000);
    expect(bonne! - reflexe!).toBeGreaterThan(150000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_NOUVEAU_MARCHE, MEILLEUR, d, JOURS);
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
      ["logements", "artisans"],
      ["representativite"],
      ["solveane", "contrats"],
      ["volumes"],
      ["resultats", "seuil"],
      ["riposte"],
    ],
    jours: JOURS,
    diagnostic: "option",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 72,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_NOUVEAU_MARCHE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de tester avant d'engager", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_NOUVEAU_MARCHE.comportements(
      p,
      analyser(EPISODE_NOUVEAU_MARCHE, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_NOUVEAU_MARCHE.axe(c).titre).toBe("Tester avant d'engager");
  });

  it("à qui a décidé sans enquêter, propose de compter le marché avant d'y entrer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_NOUVEAU_MARCHE.comportements(
      p,
      analyser(EPISODE_NOUVEAU_MARCHE, p).trimestre,
    );
    expect(EPISODE_NOUVEAU_MARCHE.axe(c).titre).toBe("Compter le marché avant d'y entrer");
  });

  it("à qui a tenu le plan contre les chiffres, propose de réviser l'ambition", () => {
    const p = partie([2, 1, 1, 1, 0, 1]);
    const c = EPISODE_NOUVEAU_MARCHE.comportements(p, simuler(p.chemin, 11, JOURS));
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_NOUVEAU_MARCHE.axe(c).titre).toBe("Réviser l'ambition sur les faits");
  });

  it("juge le marché compté en semaine 1 : juste, proche, ou repris du cabinet", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_NOUVEAU_MARCHE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(72)).toBe(1);
    expect(score(80)).toBe(0.6);
    // Le chiffre du cabinet, et tous les chantiers sans la part vendue en bouquet.
    expect(score(97.5)).toBe(0);
    expect(score(180)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    const porteur = GRAINES_DU_BILAN.find((g) => hasard(g).scenario === "porteur")!;
    const difficile = GRAINES_DU_BILAN.find((g) => hasard(g).scenario === "difficile")!;
    expect(EPISODE_NOUVEAU_MARCHE.bilan.titre(simuler(MEILLEUR, porteur))).toMatch(/valeur créée/);
    expect(EPISODE_NOUVEAU_MARCHE.bilan.titre(simuler(REFLEXE, difficile))).toMatch(
      /valeur détruite/,
    );
  });
});
