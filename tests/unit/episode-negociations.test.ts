import { describe, expect, it } from "vitest";
import {
  BUDGET_MARGE,
  COOPERATION,
  D,
  DEMANDE_CELTIS,
  FAIBLES,
  HAUSSE_CGV,
  HAUSSE_COUTS_VARIABLES,
  HAUSSE_LAIT,
  IMPREVUS,
  INDICATEURS,
  LEADERS,
  MARGE_PERDUE_DOUZE,
  MARQUE,
  O,
  PART_AGRICOLE,
  PART_LAIT,
  PLAN,
  PRIX_LAIT,
  RESTE,
  hasard,
  margeAnnuelle,
  risqueDeRefus,
  risqueDeSommeil,
  simuler,
} from "../../src/engine/episodes/negociations-annuelles";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  HAUSSE_INDICATEURS,
  MARGE_NOUVEAUTES,
  PART_SELON_CELTIS,
  PERTE_DU_PARTIEL,
  REFERENCES,
  REFLEXES,
  pct,
  points,
} from "../../src/config/episodes/negociations-annuelles";
import { kE } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_NEGOCIATIONS } from "../../src/pedagogy/episodes/negociations-annuelles";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les négociations du 1er mars » enseigne que la négociation
 * annuelle se prépare : la part de la matière première agricole se justifie
 * par les indicateurs du contrat avec les producteurs et sort de la
 * négociation ; le reste s'échange contre des contreparties ; et la menace de
 * déréférencement se chiffre, référence par référence. Céder la hausse pour
 * garder les références, ou rompre par principe, coûtent chacun. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 0, 1, 1];
const REFLEXE = [0, 1, 1, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const ecart = (chemin: readonly number[], d: number, o: number, autre: number) =>
  attendu(avec(chemin, d, o)) - attendu(avec(chemin, d, autre));
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("la part agricole vaut 3,9 points : 42 % du tarif, un lait passé de 421 à 460 €", () => {
    const op = texte(0, "op");
    expect(PRIX_LAIT).toEqual({ ancien: 421, nouveau: 460 });
    expect(PART_AGRICOLE).toBe(Math.round(0.42 * (460 / 421 - 1) * 1000) / 1000);
    expect(PART_AGRICOLE).toBe(0.039);
    // Les trois indicateurs pondérés donnent la même hausse du lait, au dixième.
    expect(INDICATEURS.reduce((s, i) => s + i.poids, 0)).toBeCloseTo(1, 9);
    expect(Math.round(HAUSSE_INDICATEURS * 1000)).toBe(Math.round(HAUSSE_LAIT * 1000));
    expect(op).toContain(
      `${pct(HAUSSE_INDICATEURS)}, soit 460 € les 1 000 litres au lieu de 421 €`,
    );
    expect(op).toContain(`la part agricole de la hausse est de ${points(PART_AGRICOLE)}`);
    expect(points(PART_AGRICOLE)).toBe("3,9 points");
    expect(PART_LAIT).toBe(0.42);
    // Le reste des CGV : 1,9 point, détaillé poste par poste.
    expect(HAUSSE_CGV).toBeCloseTo(0.058, 9);
    expect(RESTE).toBeCloseTo(0.019, 9);
    expect(op).toContain("Les 1,9 point restants : emballages 0,6 point, énergie 0,5 point");
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(pct(HAUSSE_CGV));
  });

  it("l'acheteuse ne compte que le prix moyen national : 0,42 × 5 %, soit 2,1 points", () => {
    expect(PART_SELON_CELTIS).toBeCloseTo(0.021, 9);
    const message = ETAPES[D.partAgricole]!.messages({ ventes: "", offre: "", marge: "" })[0]!;
    expect(message.texte).toContain(`cela fait ${points(PART_SELON_CELTIS)}, pas 3,9 points`);
  });

  it("douze références menacées, mais 1 371 k€ de marge réellement en jeu sur un an", () => {
    const marges = texte(0, "marges");
    const report = texte(0, "report");
    expect(marges).toContain(`${kE(LEADERS.mcv)} de marge sur coût variable`);
    expect(marges).toContain(`et ${kE(FAIBLES.mcv)}.`);
    expect(marges).toContain(`chaque point de prix vaut ${kE(MARQUE.ca / 100)} de marge par an`);
    expect(report).toContain("45 % des acheteurs vont l'acheter dans un autre magasin");
    expect(report).toContain("10 % seulement vont la chercher ailleurs");
    // La prévision demandée en semaine 1 : 1 020 × 55 % + 900 × 90 %.
    expect(MARGE_PERDUE_DOUZE).toBeCloseTo(1_020_000 * 0.55 + 900_000 * 0.9, 6);
    expect(EPISODE_NEGOCIATIONS.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(1371, 6);
  });

  it("le plan d'affaires et les simulations du contrôle de gestion se recalculent", () => {
    const plan = texte(D.contreparties, "plan");
    expect(MARGE_NOUVEAUTES).toBe(PLAN.nouveautes.ca * PLAN.nouveautes.taux);
    expect(MARGE_NOUVEAUTES).toBeCloseTo(132_000, 6);
    expect(plan).toContain(`soit ${kE(MARGE_NOUVEAUTES)}`);
    expect(plan).toContain(`${kE(PLAN.promotions)} de marge sur l'année`);
    expect(texte(D.contreparties, "cooperation")).toContain(`${kE(COOPERATION * MARQUE.ca)}`);
    // Chaque point de prix vaut 200 k€ ; la part agricole seule, 5,7 M€ ; le plan, 5,9 M€.
    expect(margeAnnuelle(DEMANDE_CELTIS)).toBeCloseTo(4_520_000, 6);
    expect(margeAnnuelle(PART_AGRICOLE)).toBeCloseTo(5_700_000, 6);
    expect(BUDGET_MARGE).toBeCloseTo(5_900_000, 6);
    expect(HAUSSE_COUTS_VARIABLES).toBeCloseTo(0.054, 9);
    const simulation = texte(D.offre, "simulation", { offreFinale: "+2,2 %", margeOffre: "" });
    expect(simulation).toContain(kE(5_700_000));
    expect(simulation).toContain(kE(5_900_000));
    // Neuf références faibles retirées douze semaines : 882 k€ de marge × (12/52 × 90 % + 40/52 × 25 %).
    expect(PERTE_DU_PARTIEL).toBeCloseTo(882_000 * ((12 / 52) * 0.9 + (40 / 52) * 0.25), 3);
    expect(simulation).toContain(`environ ${kE(PERTE_DU_PARTIEL)} de marge`);
  });
});

describe("le modèle de la négociation", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[2]!.ventes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.ventes,
      9,
    );
    expect(hasard(5)).toBe(hasard(5));
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

  it("la réponse de Celtis est tirée au hasard, et la préparation la rend plus favorable", () => {
    const issues = new Set(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).issue));
    expect(issues.has("accord")).toBe(true);
    expect(issues.size).toBeGreaterThanOrEqual(2);
    const sansPreparation = avec(MEILLEUR, D.ouverture, O.ouverture.ecouter);
    expect(risqueDeRefus(MEILLEUR, 1)).toBeLessThan(risqueDeRefus(sansPreparation, 1));
    // Signer sa dernière offre ne court aucun risque ; exiger les CGV entières, presque tous.
    expect(risqueDeRefus(avec(MEILLEUR, D.offre, O.offre.accepter), 1)).toBe(0);
    expect(risqueDeRefus(avec(MEILLEUR, D.offre, O.offre.cgv), 1)).toBeGreaterThan(0.5);
  });

  it("refuser de discuter fait mettre des références en sommeil en janvier", () => {
    const refus = avec(ATTENTISTE, D.ouverture, O.ouverture.refuser);
    expect(risqueDeSommeil(refus)).toBeGreaterThan(risqueDeSommeil(MEILLEUR) + 0.5);
    const enSommeil = GRAINES_DU_BILAN.filter((g) => simuler(refus, g).sommeil);
    expect(enSommeil.length).toBeGreaterThan(15);
    const t = simuler(refus, enSommeil[0]!);
    expect(t.semaines[7]!.references).toBe(MARQUE.references - 4);
  });

  it("garde des marges plausibles, et l'attente reste nettement moins bonne sans être absurde", () => {
    for (const g of GRAINES_DU_BILAN) {
      for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.marge).toBeGreaterThan(4_200_000);
          expect(s!.marge).toBeLessThan(6_200_000);
        }
      }
    }
    expect(attendu(ATTENTISTE)).toBeGreaterThan(4_500_000);
    expect(attendu(ATTENTISTE)).toBeLessThan(attendu(MEILLEUR) - 500_000);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : préparer le dossier bat l'ouverture sur la baisse, le refus et l'écoute", () => {
    const c = classement(MEILLEUR, D.ouverture);
    expect(c[0]).toBe(O.ouverture.preparer);
    expect(c.at(-1)).toBe(O.ouverture.ceder);
    expect(ecart(MEILLEUR, D.ouverture, O.ouverture.preparer, O.ouverture.refuser)).toBeGreaterThan(
      100_000,
    );
  });

  it("D2 : attester la part agricole bat le courriel, et vaut plus quand le dossier est prêt", () => {
    expect(classement(MEILLEUR, D.partAgricole)[0]).toBe(O.partAgricole.attester);
    expect(classement(MEILLEUR, D.partAgricole).at(-1)).toBe(O.partAgricole.ramener);
    // Céder sur la part agricole ne se rattrape pas : plus de 250 k€ perdus.
    expect(
      ecart(MEILLEUR, D.partAgricole, O.partAgricole.attester, O.partAgricole.ramener),
    ).toBeGreaterThan(250_000);
    const sansDossier = avec(MEILLEUR, D.ouverture, O.ouverture.ecouter);
    const avecDossier = ecart(
      MEILLEUR,
      D.partAgricole,
      O.partAgricole.attester,
      O.partAgricole.courriel,
    );
    const sans = ecart(
      sansDossier,
      D.partAgricole,
      O.partAgricole.attester,
      O.partAgricole.courriel,
    );
    expect(avecDossier).toBeGreaterThan(sans + 20_000);
  });

  it("D3 : le plan d'affaires chiffré bat la coopération sans service et la promotion massive", () => {
    const c = classement(MEILLEUR, D.contreparties);
    expect(c[0]).toBe(O.contreparties.plan);
    expect(
      ecart(MEILLEUR, D.contreparties, O.contreparties.plan, O.contreparties.cooperation),
    ).toBeGreaterThan(80_000);
    expect(
      ecart(MEILLEUR, D.contreparties, O.contreparties.plan, O.contreparties.promo),
    ).toBeGreaterThan(80_000);
  });

  it("D4 : montrer les sorties de caisse bat le retrait de références et l'appel du président", () => {
    const c = classement(MEILLEUR, D.pression);
    expect(c[0]).toBe(O.pression.donnees);
    expect(c.at(-1)).toBe(O.pression.retirer);
    expect(ecart(MEILLEUR, D.pression, O.pression.donnees, O.pression.rien)).toBeGreaterThan(
      20_000,
    );
  });

  it("D5 : échanger le reste est le meilleur pari, la part agricole seule le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(O.offre.echanger);
    expect(r[O.offre.echanger]!.attendu).toBeGreaterThan(
      r[O.offre.agricoleSeule]!.attendu + 50_000,
    );
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[O.offre.agricoleSeule]!.p10);
    // Céder la hausse pour garder les références, ou rompre par principe, coûtent chacun.
    expect(r[O.offre.echanger]!.attendu).toBeGreaterThan(r[O.offre.accepter]!.attendu + 300_000);
    expect(r[O.offre.echanger]!.attendu).toBeGreaterThan(r[O.offre.cgv]!.attendu + 300_000);
  });

  it("D5 : sans plan d'affaires à échanger, la part agricole seule vaut autant qu'échanger le reste", () => {
    const sansPlan = avec(MEILLEUR, D.contreparties, O.contreparties.tenir);
    const avecPlan = ecart(MEILLEUR, D.offre, O.offre.echanger, O.offre.agricoleSeule);
    const sans = ecart(sansPlan, D.offre, O.offre.echanger, O.offre.agricoleSeule);
    expect(avecPlan).toBeGreaterThan(50_000);
    expect(sans).toBeLessThan(0);
  });

  it("D6 : préparer la médiation et le report bat l'attente, la promesse de signer et la rupture", () => {
    const c = classement(MEILLEUR, D.echeance);
    expect(c[0]).toBe(O.echeance.mediation);
    expect(ecart(MEILLEUR, D.echeance, O.echeance.mediation, O.echeance.attendre)).toBeGreaterThan(
      50_000,
    );
    expect(ecart(MEILLEUR, D.echeance, O.echeance.mediation, O.echeance.ceder)).toBeGreaterThan(
      200_000,
    );
    expect(ecart(MEILLEUR, D.echeance, O.echeance.mediation, O.echeance.laisser)).toBeGreaterThan(
      200_000,
    );
  });

  it("préparer, justifier et échanger bat nettement céder et attendre", () => {
    const [methode, reflexe, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 500_000);
    expect(methode).toBeGreaterThan(attente! + 500_000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni pris par la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect((REFERENCES[0].chemin as readonly number[])[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_NEGOCIATIONS, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `réflexe [${d}, ${o}]`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["marges", "report", "op"],
      ["loi"],
      ["plan"],
      ["sortie"],
      ["simulation"],
      ["mediation"],
    ],
    jours: JOURS,
    diagnostic: "preparation",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1371,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_NEGOCIATIONS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a cédé pour garder les références, propose de justifier puis d'échanger", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_NEGOCIATIONS.comportements(p, analyser(EPISODE_NEGOCIATIONS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_NEGOCIATIONS.axe(c).titre).toBe("Ni céder ni rompre : justifier, puis échanger");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer sa position de repli", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_NEGOCIATIONS.comportements(p, analyser(EPISODE_NEGOCIATIONS, p).trimestre);
    expect(EPISODE_NEGOCIATIONS.axe(c).titre).toBe(
      "Chiffrer sa position de repli avant le premier rendez-vous",
    );
  });

  it("juge la prévision au calcul près, et compte comme une erreur d'oublier les acheteurs qui vont ailleurs", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_NEGOCIATIONS.comportements(partie(MEILLEUR, { prevision: 1380 }), t);
    const sansReport = EPISODE_NEGOCIATIONS.comportements(partie(MEILLEUR, { prevision: 1920 }), t);
    expect(juste[3]!.score).toBe(1);
    expect(sansReport[3]!.score).toBe(0);
  });

  it("dit le résultat en marge annuelle attendue et en réponse de Celtis", () => {
    const t = simuler(MEILLEUR, 2);
    expect(EPISODE_NEGOCIATIONS.bilan.titre(t)).toMatch(/Celtis/);
    expect(EPISODE_NEGOCIATIONS.bilan.tuiles(t)).toHaveLength(4);
  });
});
