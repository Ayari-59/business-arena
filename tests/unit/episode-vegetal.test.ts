import { describe, expect, it } from "vitest";
import {
  CANNIBALISATION,
  CAPACITE_FACONNIER_EUROS,
  CA_CENTRAL_TROIS_ANS,
  D,
  FACONNIER,
  IMPREVUS,
  LIGNE,
  MARCHE,
  NORDAL,
  PART_VISEE,
  PASSAGE,
  SCENARIOS,
  SEUILS,
  TAUX_CANNIBALISATION,
  caGamme,
  erosionSurCinqAns,
  etatApres,
  hasard,
  probaNordal,
  riposteNordal,
  signalDuTest,
  simuler,
  valeurPosition,
} from "../../src/engine/episodes/gamme-vegetale";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/gamme-vegetale";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { CA_TROIS_ANS_K, EPISODE_VEGETAL } from "../../src/pedagogy/episodes/gamme-vegetale";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La gamme végétale » enseigne qu'une innovation sur un marché
 * incertain se lance par étapes réversibles : un test chez un façonnier,
 * dans une enseigne, achète l'information avant la ligne ; il ne vaut que
 * s'il mesure ce qui compte, le réachat, et s'il fait changer de cap ;
 * investir d'emblée ou laisser passer coûtent selon le scénario, et
 * persister contre un test décevant est le piège. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres
 * que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 1, 2, 2, 1];
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
  const ctx: Contexte = EPISODE_VEGETAL.contexte(
    EPISODE_VEGETAL.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  // Les milliers s'écrivent avec une espace fine insécable : on la lit comme une espace.
  return (typeof s.resultat === "string" ? s.resultat : s.resultat(ctx)).replace(
    /[\u202f\u00a0]/g,
    " ",
  );
};

describe("le modèle de la gamme végétale", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    for (const g of [3, 12, 25]) {
      expect(simuler(MEILLEUR, g).scenario).toBe(simuler(REFLEXE, g).scenario);
      expect(simuler(MEILLEUR, g).reachat).toBe(simuler(ATTENTISTE, g).reachat);
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

  it("tire les trois scénarios du rayon à peu près aux probabilités que l'étude annonce", () => {
    for (const s of ["essor", "central", "repli"] as const) {
      const part = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length / 30;
      expect(part, s).toBeGreaterThan(SCENARIOS[s].chance - 0.15);
      expect(part, s).toBeLessThan(SCENARIOS[s].chance + 0.15);
    }
  });

  it("Nordal riposte au bruit : plus souvent à une ligne annoncée qu'à un test discret", () => {
    expect(probaNordal(MEILLEUR)).toBe(NORDAL.base[1]);
    expect(probaNordal([1, 1, 0, 1, 1, 1])).toBeGreaterThan(probaNordal(MEILLEUR) + 0.3);
    expect(probaNordal(ATTENTISTE)).toBe(0);
    const ripostes = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => riposteNordal(c, g)).length;
    expect(ripostes(REFLEXE)).toBeGreaterThan(ripostes(MEILLEUR) + 5);
    expect(ripostes(MEILLEUR)).toBeGreaterThan(0);
  });

  it("le test lit le bon scénario par la carte, et se trompe vers le haut par les commandes", () => {
    const bons = GRAINES_DU_BILAN.filter((g) => {
      const e = etatApres(MEILLEUR, g);
      const s = hasard(g).scenario;
      return (
        (s === "essor" && e === "large") ||
        (s === "central" && e === "pivot") ||
        (s === "repli" && e === "aucune")
      );
    }).length;
    expect(bons).toBeGreaterThanOrEqual(28);
    // Les commandes comptent le remplissage et la nouveauté : le réachat qu'on en déduit est surestimé.
    const parCommandes = [1, 0, 1, 1, 1, 1];
    const ecart = moyenne(
      GRAINES_DU_BILAN.map((g) => signalDuTest(parCommandes, g)! - hasard(g).reachat),
    );
    expect(ecart).toBeGreaterThan(6);
    const larges = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => etatApres(c, g) === "large").length;
    expect(larges(parCommandes)).toBeGreaterThan(larges(MEILLEUR) + 8);
  });

  it("laisser passer vaut l'érosion des crèmes desserts sur cinq ans, et c'est négatif", () => {
    for (const g of GRAINES_DU_BILAN) {
      const t = simuler(ATTENTISTE, g, 0);
      expect(t.objectif).toBeCloseTo(-erosionSurCinqAns(t.scenario, t.taux), 6);
      expect(t.objectif).toBeLessThan(0);
    }
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });

  it("reste dans des plages réalistes, et la ligne en avance perd gros quand le rayon déçoit", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(objectif(MEILLEUR, g)).toBeGreaterThan(-300000);
      expect(objectif(MEILLEUR, g)).toBeLessThan(1500000);
      expect(objectif(REFLEXE, g)).toBeGreaterThan(-3000000);
    }
    const repli = GRAINES_DU_BILAN.find((g) => hasard(g).scenario === "repli")!;
    expect(objectif(REFLEXE, repli)).toBeLessThan(objectif(MEILLEUR, repli) - 1500000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le chiffre d'affaires de la troisième année, scénario central, que la semaine 1 demande", () => {
    const aLaMain = MARCHE * 1.06 ** 3 * PART_VISEE * PASSAGE;
    expect(CA_CENTRAL_TROIS_ANS).toBeCloseTo(aLaMain, 6);
    expect(caGamme("central", 3)).toBeCloseTo(aLaMain, 6);
    expect(Math.round(CA_TROIS_ANS_K)).toBe(3249);
    expect(EPISODE_VEGETAL.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(3249.1, 1);
    const etude = source(0, "etude", []);
    expect(etude).toContain("110 M€ de ventes consommateurs");
    expect(etude).toContain("retombe à 6 % par an");
    const plan = source(0, "plan", []);
    expect(plan).toContain("4 % du rayon en valeur la troisième année");
    expect(plan).toContain("62 % du prix consommateur");
  });

  it("la cannibalisation coûte 3,6 % du chiffre d'affaires de la gamme, comme la source le dit", () => {
    expect(TAUX_CANNIBALISATION).toBeCloseTo(CANNIBALISATION.part * CANNIBALISATION.marge, 9);
    expect(TAUX_CANNIBALISATION).toBeCloseTo(0.036, 9);
    expect(source(0, "plan", [])).toContain("la cannibalisation coûte 3,6 % du chiffre d'affaires");
    expect(source(0, "plan", [])).toContain(
      `${SCENARIOS.central.erosion / 1000} k€ de marge par an dans le scénario central`,
    );
  });

  it("la capacité du façonnier et le seuil de la ligne sont ceux que les sources affichent", () => {
    expect(CAPACITE_FACONNIER_EUROS).toBe(2790000);
    expect(source(0, "ligne", [])).toContain("soit 2,8 M€ de chiffre d'affaires");
    // La ligne gagne 20 points de marge et coûte 200 k€ de frais fixes : 1 M€ de chiffre d'affaires pour les couvrir.
    expect(LIGNE.fixes / (LIGNE.marge - FACONNIER.marge)).toBeCloseTo(1000000, 6);
    const volumes = source(5, "volumes", [1, 1, 1, 1, 1], 1);
    expect(volumes).toContain("20 points de marge");
    expect(volumes).toContain("plus de 1 M€ de chiffre d'affaires");
  });

  it("la pénalité du contrat d'un an est celle que la source chiffre", () => {
    const penalite = FACONNIER.engagement.packs * FACONNIER.engagement.penalite;
    expect(penalite).toBe(240000);
    const texte = source(3, "contrat", [1, 1, 1]);
    expect(texte).toContain("800 000 packs");
    expect(texte).toContain("0,30 €");
    expect(texte).toContain("240 k€ si la gamme s'arrête");
    // Arrêtée, la gamme paie toute la pénalité ; élargie, elle enlève assez de packs pour n'en rien payer.
    const repli = GRAINES_DU_BILAN.find((g) => etatApres([1, 1, 1, 0, 1, 1], g) === "aucune")!;
    expect(simuler([1, 1, 1, 0, 1, 1], repli).penalite).toBeCloseTo(penalite, 6);
    const hyp = { taux: 0.09, nordal: false, emballage: false, incident: false, partielle: false };
    expect(valeurPosition([1, 1, 1, 0, 0, 1], 1, "essor", hyp).penalite).toBe(0);
  });

  it("les seuils de réachat encadrent les scénarios, et la source du test les affiche", () => {
    expect(SCENARIOS.essor.reachat).toBeGreaterThan(SEUILS.elargir + 4);
    expect(SCENARIOS.central.reachat).toBeGreaterThan(SEUILS.garder + 4);
    expect(SCENARIOS.central.reachat).toBeLessThan(SEUILS.elargir - 4);
    expect(SCENARIOS.repli.reachat).toBeLessThan(SEUILS.garder - 4);
    const g = 5;
    const texte = source(4, "resultats", [1, 1, 1, 1], g);
    expect(texte).toContain(`${Math.round(signalDuTest(MEILLEUR, g)!)} %`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : tester chez le façonnier bat la ligne en avance, le lancement partout et l'abandon", () => {
    const r = rejeu(MEILLEUR, D.strategie);
    expect(classement(MEILLEUR, D.strategie)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(500000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(200000);
  });

  it("D2 : la carte de fidélité vaut son prix, parce qu'elle fait changer la proposition de mars", () => {
    const r = rejeu(MEILLEUR, D.mesure);
    expect(classement(MEILLEUR, D.mesure)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
    // L'interaction : si l'on élargit de toute façon, la mesure n'est plus qu'un coût.
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.mesure);
      return x[1]!.attendu - x[0]!.attendu;
    };
    expect(gain([1, 1, 1, 1, 0, 1])).toBeLessThan(0);
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([1, 1, 1, 1, 0, 1]) + 60000);
  });

  it("D3 : le lancement en magasin bat la campagne qui réveille Nordal et la promotion qui fausse la mesure", () => {
    const r = rejeu(MEILLEUR, D.lancement);
    expect(classement(MEILLEUR, D.lancement)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
  });

  it("D4 : réserver les créneaux est le meilleur pari, ne rien réserver le plus sûr, le contrat d'un an le pire", () => {
    const r = rejeu(MEILLEUR, D.faconnier);
    const c = classement(MEILLEUR, D.faconnier);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.faconnier)).toBe(2);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(80000);
  });

  it("D5 : appliquer les critères écrits bat l'élargissement annoncé, le test prolongé et l'arrêt", () => {
    const r = rejeu(MEILLEUR, D.revision);
    expect(classement(MEILLEUR, D.revision)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(300000);
  });

  it("D6 : rester chez le façonnier bat la ligne commandée trop tôt et la ligne lactée partagée", () => {
    const r = rejeu(MEILLEUR, D.production);
    expect(classement(MEILLEUR, D.production)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(300000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(500000);
  });

  it("tester, mesurer, réviser bat l'occupation du terrain et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne!).toBeGreaterThan(50000);
    expect(bonne! - reflexe!).toBeGreaterThan(500000);
    expect(bonne! - attentiste!).toBeGreaterThan(200000);
    expect(attentiste!).toBeLessThan(0);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_VEGETAL, MEILLEUR, d, JOURS);
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
      ["etude", "plan"],
      ["mesure"],
      ["nordal"],
      ["contrat"],
      ["resultats"],
      ["allergenes"],
    ],
    jours: JOURS,
    diagnostic: "test",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 3250,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_VEGETAL, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne rien figer avant de savoir", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_VEGETAL.comportements(p, analyser(EPISODE_VEGETAL, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_VEGETAL.axe(c).titre).toBe("Ne rien figer avant de savoir");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer le rayon avant de choisir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_VEGETAL.comportements(p, analyser(EPISODE_VEGETAL, p).trimestre);
    expect(EPISODE_VEGETAL.axe(c).titre).toBe("Chiffrer le rayon avant de choisir");
  });

  it("à qui a élargi contre son test, propose de lire le test et de changer de cap", () => {
    const p = partie([1, 1, 1, 1, 0, 1]);
    const c = EPISODE_VEGETAL.comportements(p, simuler([1, 1, 1, 1, 0, 1], 11, JOURS));
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_VEGETAL.axe(c).titre).toBe("Lire le test, et changer de cap");
  });

  it("juge le chiffre d'affaires prévu en semaine 1 : juste, proche, ou faute d'avoir ralenti la croissance", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_VEGETAL.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(3250)).toBe(1);
    expect(score(3500)).toBe(0.6);
    // Avec les 15 % de l'an dernier prolongés : 110 × 1,15³ × 4 % × 62 % ≈ 4 149 k€.
    expect(score(4149)).toBe(0);
    // Sans passer du prix consommateur au prix net : 110 × 1,06³ × 4 % ≈ 5 240 k€.
    expect(score(5240)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    const essor = GRAINES_DU_BILAN.find((g) => hasard(g).scenario === "essor")!;
    expect(EPISODE_VEGETAL.bilan.titre(simuler(MEILLEUR, essor))).toMatch(/valeur créée/);
    expect(EPISODE_VEGETAL.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
