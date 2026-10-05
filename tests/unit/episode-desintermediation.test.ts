import { describe, expect, it } from "vitest";
import {
  ACHATS_ARVEL,
  ACHATS_MERINDAL,
  ANNUEL_MARQUE_MENUISERIES,
  ANNUEL_SEPARER,
  CONFLIT,
  CORBIERE,
  COUT_ALIGNEMENT,
  D,
  IMPREVUS,
  MARGES,
  MARGE_EXPOSEE,
  PERTE_CORBIERE,
  PERTE_EXTENSION,
  SCENARIOS,
  SEGMENTS,
  SERVICES,
  VALEUR_SERIE,
  VALEUR_SUR_MESURE,
  VENTES_MERINDAL_FRANCE,
  VENTES_MERINDAL_REGION,
  annuelMarquePlaques,
  annuelSerie,
  chancesReaction,
  hasard,
  litige,
  margeSurMesure,
  reaction,
  simuler,
} from "../../src/engine/episodes/fabricant-en-direct";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/fabricant-en-direct";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_DESINTERMEDIATION } from "../../src/pedagogy/episodes/fabricant-en-direct";
import { kE, taux } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le fabricant qui vend en direct » enseigne trois choses : la
 * vente directe ne menace que la clientèle qui n'a pas besoin de ce que le
 * négoce apporte, et le reste se défend en faisant payer les services ; la
 * dépendance se chiffre des deux côtés, et ni punir le fabricant ni
 * l'ignorer ne vaut une négociation menée avec une alternative en main ; les
 * coûts de changement des artisans décident de ce qui se remplace, et un
 * test dit ce qu'ils feront vraiment. Ces tests verrouillent les classements
 * qui le disent, et recalculent depuis le modèle les chiffres que les
 * sources affichent.
 */

const MEILLEUR = [3, 1, 1, 1, 1, 1];
const REFLEXE = [0, 3, 0, 0, 0, 0];
const ATTENTISTE = [1, 2, 2, 2, 3, 3];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_DESINTERMEDIATION.contexte(
    EPISODE_DESINTERMEDIATION.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la riposte", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).serie).toBe(simuler(ATTENTISTE, 12).serie);
    expect(simuler(MEILLEUR, 12).adoption).toBe(simuler(ATTENTISTE, 12).adoption);
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

  it("la plateforme connaît chacun des trois scénarios, à peu près aux fréquences dites", () => {
    const part = (id: string) =>
      GRAINES_DU_BILAN.filter((g) => hasard(g).scenario.id === id).length / GRAINES_DU_BILAN.length;
    for (const s of SCENARIOS) {
      expect(part(s.id), s.id).toBeGreaterThan(s.chance - 0.2);
      expect(part(s.id), s.id).toBeLessThan(s.chance + 0.2);
    }
  });

  it("la réaction de Mérindal dépend des choix d'Arvel : il négocie, il pousse, ou il riposte", () => {
    const accords = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => reaction(c, g) === "accord").length;
    const extensions = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => reaction(c, g) === "extension").length;
    expect(chancesReaction(MEILLEUR).accord).toBeGreaterThan(0.7);
    expect(chancesReaction(REFLEXE).accord).toBe(0);
    expect(chancesReaction(ATTENTISTE).extension).toBeGreaterThan(0.6);
    expect(accords(MEILLEUR)).toBeGreaterThan(18);
    expect(extensions(ATTENTISTE)).toBeGreaterThan(14);
    // Sans alternative en rayon, Mérindal a moins de raisons de négocier.
    expect(chancesReaction([3, 1, 2, 2, 1, 1]).accord).toBeLessThan(
      chancesReaction(MEILLEUR).accord - 0.3,
    );
  });

  it("la valeur part de zéro, et celle de la semaine 13 est l'objectif", () => {
    expect(EPISODE_DESINTERMEDIATION.lire([], 3, 0, 0).valeur).toBe(0);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });

  it("le procès pour rupture brutale ne tombe que sur qui rompt, environ une fois sur deux", () => {
    const rompt = [3, 1, 1, 1, 1, 0];
    const proces = GRAINES_DU_BILAN.filter((g) => litige(rompt, g)).length;
    expect(proces).toBeGreaterThan(8);
    expect(proces).toBeLessThan(22);
    expect(GRAINES_DU_BILAN.some((g) => litige(MEILLEUR, g))).toBe(false);
  });

  it("les valeurs restent réalistes : la bonne méthode limite la perte, ne rien faire coûte cher", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(-200000);
    expect(bon).toBeLessThan(100000);
    const rien = attendu(ATTENTISTE);
    expect(rien).toBeLessThan(-600000);
    expect(rien).toBeGreaterThan(-1500000);
    expect(attendu(REFLEXE)).toBeLessThan(rien);
    expect(attendu(REFLEXE)).toBeGreaterThan(-2500000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la marge exposée, que la semaine 1 demande, se calcule segment par segment", () => {
    const aLaMain =
      SEGMENTS.grandsComptes.ca * SEGMENTS.grandsComptes.taux * SEGMENTS.grandsComptes.eligible +
      SEGMENTS.pme.ca * SEGMENTS.pme.taux * SEGMENTS.pme.eligible;
    expect(MARGE_EXPOSEE).toBeCloseTo(aLaMain, 6);
    expect(MARGE_EXPOSEE).toBeCloseTo(550000, 6);
    expect(EPISODE_DESINTERMEDIATION.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(550, 6);
    const texte = source(0, "ventes", []);
    expect(texte).toContain(`soit ${kE(MARGES.grandsComptes)}, dont 60 %`);
    expect(texte).toContain(`soit ${kE(MARGES.pme)}, dont 20 %`);
    expect(MARGES.artisans).toBeCloseTo(1350000, 6);
    expect(texte).toContain("soit 1 350 k€ ; aucun");
    expect(texte).toContain("Grands comptes : 5 M€ à 13 % de marge");
  });

  it("la dépendance des deux côtés est celle que la source affiche", () => {
    expect(ACHATS_MERINDAL).toBeCloseTo(11200000, 6);
    expect(ACHATS_MERINDAL / ACHATS_ARVEL).toBeCloseTo(0.1, 6);
    expect(ACHATS_MERINDAL / VENTES_MERINDAL_REGION).toBeCloseTo(0.35, 6);
    expect(ACHATS_MERINDAL / VENTES_MERINDAL_FRANCE).toBeLessThan(0.03);
    const texte = source(0, "dependance", []);
    expect(texte).toContain("11,2 M€ d'achats, 10 % des 112 M€");
    expect(texte).toContain("35 % de ses 32 M€");
    expect(texte).toContain("une chance sur trois");
    expect(SCENARIOS.map((s) => s.chance)).toEqual([0.35, 0.45, 0.2]);
  });

  it("séparer les prix : la baisse sur les commandes complètes, et ce que rapportent les services", () => {
    expect(SERVICES.caCommandesCompletes).toBeCloseTo(3800000, 6);
    expect(SERVICES.baisseCommandesCompletes * SERVICES.caCommandesCompletes).toBeCloseTo(
      114000,
      6,
    );
    expect(ANNUEL_SEPARER).toBeCloseTo(16000, 6);
    const texte = source(1, "services", [3]);
    expect(texte).toContain("130 k€ par an");
    expect(texte).toContain("3,8 M€ par an, coûterait 114 k€");
    expect(COUT_ALIGNEMENT).toBeCloseTo(290000, 6);
    expect(ETAPES[0]!.options[2]!.d).toContain(`${kE(COUT_ALIGNEMENT)} de marge par an`);
    expect(PERTE_CORBIERE).toBeCloseTo(78000, 6);
    expect(source(1, "corbiere", [3])).toContain(`${kE(CORBIERE.ca * CORBIERE.taux)}. 60 %`);
  });

  it("la série de Solvane paie son déploiement, le sur-mesure non", () => {
    expect(annuelSerie(0.25)).toBeCloseTo(52500, 6);
    expect(margeSurMesure(0.05)).toBeCloseTo(8750, 6);
    expect(VALEUR_SERIE).toBeGreaterThan(30000);
    expect(VALEUR_SUR_MESURE).toBeLessThan(-80000);
    const texte = source(2, "bascule", [3, 1]);
    expect(texte).toContain("52,5 k€ de marge en plus par an, pour 45 k€ de déploiement");
    expect(texte).toContain("8,75 k€ par an, pour 80 k€ de déploiement");
    // En semaine 9, les chiffres du test sont ceux du hasard du trimestre.
    const h = hasard(4);
    const resultats = source(4, "resultats", [3, 1, 1, 1], 4);
    expect(resultats).toContain(`Solvane fait ${taux(h.serie, 0)} des fenêtres`);
    expect(resultats).toContain(`la série rapporterait ${kE(annuelSerie(h.serie))} de marge`);
  });

  it("la marque propre rapporte sur les plaques, pas sur les menuiseries", () => {
    const texte = source(3, "marque", [3, 1, 1]);
    expect(texte).toContain(`${kE(annuelMarquePlaques(0.25))} de marge par an, pour 60 k€`);
    expect(texte).toContain(`${kE(ANNUEL_MARQUE_MENUISERIES)} par an pour 120 k€`);
  });

  it("ce que Mérindal peut faire coûter : la remise retirée, la vente aux artisans", () => {
    expect(CONFLIT.retrait).toBeCloseTo(168000, 6);
    expect(Math.round(PERTE_EXTENSION / 1000)).toBe(185);
    const texte = source(5, "position", [3, 1, 1, 1, 1]);
    expect(texte).toContain(`${kE(CONFLIT.retrait)} par an`);
    expect(texte).toContain(`${kE(PERTE_EXTENSION)} de marge par an`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : chiffrer, défendre et négocier bat nettement punir le fabricant et l'ignorer", () => {
    expect(classement(MEILLEUR, D.posture)[0]).toBe(3);
    expect(ecart(MEILLEUR, D.posture, 3, 0)).toBeGreaterThan(400000);
    expect(ecart(MEILLEUR, D.posture, 3, 1)).toBeGreaterThan(150000);
    expect(ecart(MEILLEUR, D.posture, 3, 2)).toBeGreaterThan(250000);
  });

  it("D2 : séparer le prix des services bat la remise, les services offerts et l'inaction", () => {
    expect(classement(MEILLEUR, D.offre)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.offre, 1, 3)).toBeGreaterThan(200000);
    expect(ecart(MEILLEUR, D.offre, 1, 0)).toBeGreaterThan(200000);
    expect(ecart(MEILLEUR, D.offre, 1, 2)).toBeGreaterThan(150000);
  });

  it("D3 : tester avant de déployer bat déployer à l'aveugle et ne rien référencer", () => {
    expect(classement(MEILLEUR, D.solvane)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.solvane, 1, 0)).toBeGreaterThan(80000);
    expect(ecart(MEILLEUR, D.solvane, 1, 2)).toBeGreaterThan(20000);
  });

  it("D4 : la marque propre sur les plaques seules bat la marque propre partout et l'absence", () => {
    expect(classement(MEILLEUR, D.marque)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.marque, 1, 0)).toBeGreaterThan(80000);
    expect(ecart(MEILLEUR, D.marque, 1, 2)).toBeGreaterThan(100000);
  });

  it("D5 : réviser le plan sur les chiffres du test bat le tenir, d'autant plus qu'on a testé", () => {
    expect(classement(MEILLEUR, D.deploiement)[0]).toBe(1);
    expect(classement(MEILLEUR, D.deploiement).at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.deploiement, 1, 0)).toBeGreaterThan(120000);
    // Tout déployé en semaine 5, le sur-mesure est déjà payé : persister coûte moins.
    expect(ecart(MEILLEUR, D.deploiement, 1, 0)).toBeGreaterThan(
      ecart([3, 1, 0, 1, 1, 1], D.deploiement, 1, 0) + 50000,
    );
  });

  it("D6 : l'accord complet est le meilleur en moyenne, l'accord limité le plus sûr, la rupture la pire", () => {
    const r = rejeu(MEILLEUR, D.accord);
    expect(classement(MEILLEUR, D.accord)[0]).toBe(1);
    expect(classement(MEILLEUR, D.accord).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.accord)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(800000);
    // Exiger l'accord complet ne paie qu'avec une alternative en rayon.
    expect(ecart([3, 1, 1, 1, 2, 1], D.accord, 1, 2)).toBeLessThan(-10000);
  });

  it("chiffrer, défendre, négocier bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(500000);
    expect(bonne! - attentiste!).toBeGreaterThan(500000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_DESINTERMEDIATION, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["ventes", "dependance"],
      ["services"],
      ["bascule"],
      ["marque"],
      ["resultats"],
      ["position"],
    ],
    jours: JOURS,
    diagnostic: "exposition",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 550,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DESINTERMEDIATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de peser la dépendance plutôt que punir ou ignorer", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DESINTERMEDIATION.comportements(
      p,
      analyser(EPISODE_DESINTERMEDIATION, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DESINTERMEDIATION.axe(c).titre).toBe(
      "Ni punir, ni ignorer : peser la dépendance",
    );
  });

  it("à qui a décidé sans enquêter, propose de chiffrer avant de riposter", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DESINTERMEDIATION.comportements(
      p,
      analyser(EPISODE_DESINTERMEDIATION, p).trimestre,
    );
    expect(EPISODE_DESINTERMEDIATION.axe(c).titre).toBe("Chiffrer avant de riposter");
  });

  it("juge l'estimation de la semaine 1 : juste, proche, ou faute d'avoir trié les commandes", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_DESINTERMEDIATION.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(550)).toBe(1);
    expect(score(600)).toBe(0.6);
    // Toute la marge des grands comptes, sans trier les commandes : 650 k€.
    expect(score(650)).toBe(0);
    // Les seuls grands comptes, sans les commandes complètes des PME : 390 k€.
    expect(score(390)).toBe(0);
  });

  it("dit le résultat en valeur perdue, et juge la relation avec Mérindal", () => {
    expect(EPISODE_DESINTERMEDIATION.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur perdue/);
    const rompt = partie(REFLEXE);
    expect(
      EPISODE_DESINTERMEDIATION.comportements(rompt, simuler(REFLEXE, 11, JOURS))[4]!.score,
    ).toBe(0);
    const bon = partie(MEILLEUR);
    expect(
      EPISODE_DESINTERMEDIATION.comportements(bon, simuler(MEILLEUR, 11, JOURS))[4]!.score,
    ).toBe(1);
  });
});
