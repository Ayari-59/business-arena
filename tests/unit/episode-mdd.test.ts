import { describe, expect, it } from "vitest";
import {
  CELTIS,
  CONTRAT,
  COUT_COMPLET,
  COUT_LAIT_KG,
  CV,
  CV_LIVRE,
  D,
  IMPREVUS,
  LIBRE_AFFICHE,
  LIBRE_DECEMBRE,
  LIGNE,
  MCV_CIBLE,
  MCV_CIBLE_CENTIMES,
  PART_FIXE,
  PERTE_EN_COUT_COMPLET,
  PONTIVY,
  PRIX_CIBLE,
  PRIX_MARQUE,
  exposition,
  hasard,
  simuler,
} from "../../src/engine/episodes/appel-d-offres-mdd";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PRIX_EQUIPE_NUIT,
  REFERENCES,
  REFLEXES,
  prixKg,
} from "../../src/config/episodes/appel-d-offres-mdd";
import { euros, kE } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_MDD } from "../../src/pedagogy/episodes/appel-d-offres-mdd";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La marque du distributeur » enseigne qu'une MDD se décide sur la
 * marge sur coût variable des volumes ajoutés, les frais fixes qu'elle ajoute
 * vraiment, la capacité réelle de décembre, le report de sa propre marque (qui
 * a lieu de toute façon) et les clauses du contrat ; remplir l'usine aux
 * conditions du client et refuser par principe coûtent chacun. Ces tests
 * verrouillent les classements qui le disent, et la cohérence des chiffres que
 * les sources donnent avec le modèle.
 */

const MEILLEUR = [2, 2, 2, 2, 2, 2];
const REFLEXE = [0, 0, 0, 3, 1, 0];
const PRINCIPE = [1, 2, 0, 1, 0, 1];
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
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r(ctx);
};

describe("le modèle de l'appel d'offres MDD", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    for (const c of [REFLEXE, PRINCIPE]) {
      expect(simuler(c, 12).nordal).toBe(simuler(MEILLEUR, 12).nordal);
      expect(simuler(c, 12).trsDecembre).toBe(simuler(MEILLEUR, 12).trsDecembre);
      expect(simuler(c, 12).lait).toBe(simuler(MEILLEUR, 12).lait);
    }
    // Les ventes de Kerbrélan avant la mise en rayon ne dépendent d'aucune décision.
    expect(simuler(MEILLEUR, 12).semaines[3]!.kerbrelan).toBeCloseTo(
      simuler(PRINCIPE, 12).semaines[3]!.kerbrelan,
      9,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const n = hasard(g).imprevus.length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(2);
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

  it("ne pas répondre n'empêche pas la MDD de sortir : Kerbrélan perd des ventes quand même", () => {
    const t = simuler([1, 2, 0, 1, 3, 1], 5);
    expect(t.gagne).toBe(false);
    expect(t.report).toBeGreaterThan(0.05);
    expect(t.marque).toBeLessThan(0);
  });

  it("sans clause indexée, une hausse du lait rend le contrat déficitaire", () => {
    const hausse = GRAINES_DU_BILAN.filter((g) => hasard(g).lait === 2);
    expect(hausse.length).toBeGreaterThan(3);
    for (const g of hausse) {
      const t = simuler([0, 2, 2, 2, 2, 1], g, 0);
      if (t.gagne) expect(t.contrat).toBeLessThan(0);
      expect(simuler([2, 2, 2, 2, 2, 1], g, 0).mcvKg).toBeGreaterThan(5);
    }
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("la fiche de coût : coût variable, frais fixes, coût complet, et la prévision", () => {
    expect(PRIX_CIBLE).toBe(1.56);
    expect(PRIX_CIBLE).toBeCloseTo(PRIX_MARQUE * 0.78, 9);
    expect(CV.lait).toBeCloseTo(COUT_LAIT_KG, 9);
    expect(CV_LIVRE).toBeCloseTo(
      CV.lait + CV.ferments + CV.emballage + CV.energie + CV.transport,
      9,
    );
    expect(CV_LIVRE).toBe(1.46);
    expect(PART_FIXE).toBeCloseTo(PONTIVY.fraisFixes / (PONTIVY.volume * 1000), 4);
    expect(COUT_COMPLET).toBe(1.71);
    expect(MCV_CIBLE_CENTIMES).toBe(10);
    expect(EPISODE_MDD.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(
      (PRIX_CIBLE - CV_LIVRE) * 100,
      6,
    );
    const fiche = source(0, "fiche");
    expect(fiche).toContain(`Coût variable livré : ${prixKg(CV_LIVRE)}`);
    expect(fiche).toContain(`coût de revient complet ${prixKg(COUT_COMPLET)}`);
    expect(fiche).toContain(kE(CONTRAT.cellule));
  });

  it("la « perte » en coût complet du directeur financier, et la marge réelle", () => {
    const iwan = ETAPES[0]!.messages({}).find((m) => m.de === "Iwan Szymanski")!.texte;
    expect(PERTE_EN_COUT_COMPLET).toBeCloseTo(
      (COUT_COMPLET - PRIX_CIBLE) * CONTRAT.volume * 1000,
      3,
    );
    expect(iwan).toContain(kE(PERTE_EN_COUT_COMPLET));
    expect(MCV_CIBLE * CONTRAT.volume * 1000).toBeCloseTo(420000, 3);
  });

  it("la capacité affichée et la capacité réelle de décembre", () => {
    expect(LIBRE_AFFICHE).toBe(LIGNE.theorique * LIGNE.trsAffiche - LIGNE.marqueMoyenne);
    expect(LIBRE_AFFICHE).toBe(410);
    expect(LIBRE_DECEMBRE).toBe(LIGNE.theorique * LIGNE.trsDecembre - LIGNE.marqueDecembre);
    expect(LIBRE_DECEMBRE).toBe(220);
    const cap = source(0, "capacite");
    expect(cap).toContain(`${LIBRE_DECEMBRE} tonnes de libres pour 420 demandées`);
    expect(cap).toContain(euros(700));
  });

  it("la clause du lait du contrat type, et le prix qui couvre l'équipe de nuit", () => {
    // Une hausse de 10 % : la révision n'en rend que 1 point, la laiterie en garde 9.
    expect(exposition(0.1, false)).toBeCloseTo(0.09, 9);
    expect(exposition(0.1, false) * COUT_LAIT_KG).toBeGreaterThan(MCV_CIBLE);
    expect(source(0, "lait")).toContain("10,4 centimes");
    expect(PRIX_EQUIPE_NUIT).toBeCloseTo(CV_LIVRE + CELTIS.equipeNuit / (CELTIS.volume * 1000), 9);
    expect(source(5, "pontivy", { gagne: true })).toContain(prixKg(PRIX_EQUIPE_NUIT));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : répondre avec clause et plafond bat de loin remplir l'usine et refuser", () => {
    const r = rejeu(MEILLEUR, D.reponse);
    expect(classement(MEILLEUR, D.reponse)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
  });

  it("D2 : tenir l'offre est le meilleur en moyenne, baisser de 2 % le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.prix);
    expect(classement(MEILLEUR, D.prix)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
    expect(classement(MEILLEUR, D.prix).at(-1)).toBe(0);
  });

  it("D3 : la suppléance de décembre est la bonne réponse avec le plafond ; sans lui, l'équipe de nuit", () => {
    const c = classement(MEILLEUR, D.decembre);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(1); // produire d'avance : la DLC le défait
    // L'interaction avec la décision 1 : sans plafond de décembre, il faut l'équipe de nuit.
    expect(classement([0, 2, 2, 2, 2, 2], D.decembre)[0]).toBe(3);
  });

  it("D4 : la clause de reprise des emballages bat les grandes séries sans protection", () => {
    const c = classement(MEILLEUR, D.emballages);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(3);
  });

  it("D5 : mesurer le report avant de défendre la marque bat toutes les défenses à l'aveugle", () => {
    const r = rejeu(MEILLEUR, D.marque);
    expect(classement(MEILLEUR, D.marque)[0]).toBe(2);
    for (const o of [0, 1, 3]) expect(r[2]!.attendu - r[o]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
  });

  it("D6 : un prix qui couvre ce que Celtis ajoute bat l'accepter et le refuser", () => {
    const r = rejeu(MEILLEUR, D.celtis);
    expect(classement(MEILLEUR, D.celtis)).toEqual([2, 1, 0]);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
  });

  it("chiffrer avant de remplir bat nettement remplir l'usine et protéger la marque par principe", () => {
    const [bonne, remplir, principe] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - remplir!).toBeGreaterThan(300000);
    expect(bonne! - principe!).toBeGreaterThan(300000);
    expect(attendu(EPISODE_MDD.neutre)).toBeLessThan(0);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni prise par la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_MDD, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(false);
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["fiche", "capacite", "lait"],
      ["nordal"],
      ["essais"],
      ["charte"],
      ["etude"],
      ["pontivy"],
    ],
    jours: JOURS,
    diagnostic: "marge",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 10,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_MDD, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a rempli l'usine, propose de décider sur la marge des volumes ajoutés", () => {
    const p = partie(REFLEXE, { diagnostic: "perte" });
    const c = EPISODE_MDD.comportements(p, analyser(EPISODE_MDD, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_MDD.axe(c).titre).toBe("Décider sur la marge des volumes ajoutés");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer ce que la MDD ajoute", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_MDD.comportements(p, analyser(EPISODE_MDD, p).trimestre);
    expect(EPISODE_MDD.axe(c).titre).toBe("Chiffrer ce que la MDD ajoute vraiment");
  });

  it("juge le calcul de la marge sur coût variable, pas celui de la perte en coût complet", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_MDD.comportements(partie(MEILLEUR, { prevision: 10 }), t)[3]!.score).toBe(1);
    expect(EPISODE_MDD.comportements(partie(MEILLEUR, { prevision: -15 }), t)[3]!.score).toBe(0);
  });

  it("dit le résultat en valeur créée ou détruite", () => {
    const gagnante = GRAINES_DU_BILAN.find((g) => simuler(MEILLEUR, g).gagne)!;
    expect(EPISODE_MDD.bilan.titre(simuler(MEILLEUR, gagnante))).toMatch(/valeur créée/);
    expect(EPISODE_MDD.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/valeur détruite/);
  });
});
