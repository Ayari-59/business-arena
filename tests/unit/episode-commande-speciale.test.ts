import { describe, expect, it } from "vitest";
import {
  CHARGES_FIXES,
  COMMANDE,
  COUT_COMPLET,
  COUT_VARIABLE,
  CV,
  D,
  IMPREVUS,
  MARGE_TARIF,
  MCV_COMMANDE,
  MCV_REGULIERE,
  PRIX_REGULIER,
  SURCOUT_HS,
  hasard,
  risqueRioult,
  simuler,
} from "../../src/engine/episodes/commande-a-prix-casse";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_ARRET_EN_POINTE,
  ETAPES,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/commande-a-prix-casse";
import { euros } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_COMMANDE_SPECIALE } from "../../src/pedagogy/episodes/commande-a-prix-casse";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La commande à prix cassé » enseigne trois choses : tant que
 * l'atelier a de la capacité libre, une commande se juge à son coût marginal
 * et non à son coût complet ; quand il est plein, le coût marginal saute et
 * comprend la marge des clients qu'on fait attendre ; et un prix de chantier
 * ne reste un prix de chantier que s'il est attaché à des conditions. Ces
 * tests verrouillent les classements qui le disent, et la cohérence des
 * chiffres que les sources donnent avec le modèle.
 */

const MEILLEUR = [2, 1, 2, 1, 2, 2];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [0, 0, 1, 3, 3, 1];
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

describe("le modèle du centre de découpe", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.volume).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.volume,
      6,
    );
    expect(simuler(MEILLEUR, 12).semaines[2]!.volume).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[2]!.volume,
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

  it("le coût complet unitaire baisse quand l'atelier est plein, sans qu'un coût réel change", () => {
    const t = simuler(MEILLEUR, 3);
    expect(t.semaines[1]!.coutComplet).toBeGreaterThan(COUT_COMPLET);
    expect(t.semaines[9]!.coutComplet).toBeLessThan(COUT_COMPLET);
    expect(t.coutCompletRecalcule).toBeLessThan(COUT_COMPLET);
    expect(simuler(ATTENTISTE, 3).coutCompletRecalcule).toBeGreaterThan(COUT_COMPLET);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("la fiche de coût : coût variable, part fixe, coût complet", () => {
    expect(COUT_VARIABLE).toBe(CV.panneau + CV.chants + CV.energie);
    expect(COUT_VARIABLE).toBe(26);
    expect(COUT_COMPLET).toBe(COUT_VARIABLE + CHARGES_FIXES / 800);
    expect(COUT_COMPLET).toBe(46);
    const fiche = source(0, "fiche");
    expect(fiche).toContain(`${COUT_COMPLET} €`);
    expect(fiche).toContain(`${COUT_VARIABLE} € de coût variable`);
    expect(fiche).toContain(`${COUT_COMPLET - COUT_VARIABLE} € de charges fixes`);
    // Le tarif catalogue est bien le coût complet plus 26 %.
    expect(Math.round(COUT_COMPLET * (1 + MARGE_TARIF))).toBe(PRIX_REGULIER);
  });

  it("la perte « en coût complet » annoncée par la contrôleuse, et la vraie marge de la commande", () => {
    const yuna = ETAPES[0]!.messages({}).find((m) => m.de === "Yuna Kerdraon")!.texte;
    expect(yuna).toContain(euros((COUT_COMPLET - COMMANDE.prix) * COMMANDE.quantite));
    expect(MCV_COMMANDE).toBe((COMMANDE.prix - COUT_VARIABLE) * COMMANDE.quantite);
    expect(MCV_COMMANDE).toBe(20800);
    expect(EPISODE_COMMANDE_SPECIALE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(20.8, 6);
  });

  it("le coût marginal en pleine saison, et le coût d'un arrêt de la scie", () => {
    const marginal = source(3, "marginal");
    expect(marginal).toContain(`${COUT_VARIABLE + SURCOUT_HS} €`);
    expect(marginal).toContain(`${COUT_VARIABLE + MCV_REGULIERE / 2} €`);
    expect(COUT_ARRET_EN_POINTE).toBe(100 * SURCOUT_HS + 300 * 0.5 * MCV_REGULIERE);
    expect(source(4, "arret")).toContain(euros(COUT_ARRET_EN_POINTE));
    expect(source(2, "rioult")).toContain(`${MCV_REGULIERE} € de marge sur coût variable`);
  });

  it("le tarif recalculé est le coût complet des dix semaines, plus 26 %", () => {
    const t = simuler(MEILLEUR, 5);
    let volume = 0;
    for (let w = 1; w <= 10; w += 1) volume += t.semaines[w]!.volume;
    const cc = COUT_VARIABLE + (CHARGES_FIXES * 10) / volume;
    expect(t.coutCompletRecalcule).toBeCloseTo(cc, 6);
    expect(t.tarifRecalcule).toBeCloseTo(Math.round(cc * (1 + MARGE_TARIF) * 10) / 10, 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : accepter à nos conditions bat nettement le refus « sous le coût complet »", () => {
    const r = rejeu(MEILLEUR, D.commande);
    expect(classement(MEILLEUR, D.commande)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
    // Aux conditions de Cévral, le prix se voit : c'est moins bien.
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D2 : fabriquer d'avance dans les creux bat les heures sup ; la deuxième équipe est la pire", () => {
    const c = classement(MEILLEUR, D.planning);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
  });

  it("D3 : un prix de chantier pour du volume en plus ; jamais sur le volume existant", () => {
    const c = classement(MEILLEUR, D.rioult);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    // Livré comme le catalogue, le prix de Cévral rend Rioult plus difficile à garder.
    const vu = [3, 1, 2, 1, 2, 2];
    expect(risqueRioult(vu)).toBeGreaterThan(risqueRioult(MEILLEUR));
  });

  it("D4 : en pleine saison, 39 € ne couvrent plus le coût marginal — sauf avec une deuxième équipe", () => {
    const r = rejeu(MEILLEUR, D.lot);
    expect(classement(MEILLEUR, D.lot)[0]).toBe(1);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    // La capacité déjà payée change la réponse : l'interaction avec la décision 2.
    const deuxEquipes = [2, 2, 2, 1, 2, 2];
    expect(classement(deuxEquipes, D.lot)[0]).toBe(0);
  });

  it("D5 : reporter sous surveillance est le meilleur en moyenne, le week-end le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.revision);
    expect(classement(MEILLEUR, D.revision)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeLessThan(3000);
    expect(classement(MEILLEUR, D.revision).at(-1)).toBe(0);
  });

  it("D6 : répercuter un coût complet qui ne bouge qu'avec le volume coûte de la marge", () => {
    const r = rejeu(MEILLEUR, D.tarif);
    expect(classement(MEILLEUR, D.tarif)[0]).toBe(2);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
  });

  it("raisonner à la marge, capacité comprise, bat nettement les réflexes et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(20000);
    expect(bonne! - attentiste!).toBeGreaterThan(15000);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni prise par la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_COMMANDE_SPECIALE, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(
        false,
      );
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["fiche", "charge"], ["plan"], ["rioult"], ["marginal"], ["arret"], ["cout"]],
    jours: JOURS,
    diagnostic: "marginal",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 20.8,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_COMMANDE_SPECIALE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes du coût, propose de raisonner à la marge", () => {
    const p = partie(REFLEXE, { diagnostic: "perte" });
    const c = EPISODE_COMMANDE_SPECIALE.comportements(
      p,
      analyser(EPISODE_COMMANDE_SPECIALE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_COMMANDE_SPECIALE.axe(c).titre).toBe("Raisonner à la marge, capacité comprise");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce que la commande ajoute aux coûts", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_COMMANDE_SPECIALE.comportements(
      p,
      analyser(EPISODE_COMMANDE_SPECIALE, p).trimestre,
    );
    expect(EPISODE_COMMANDE_SPECIALE.axe(c).titre).toBe(
      "Chercher ce que la commande ajoute aux coûts",
    );
  });

  it("juge le calcul de la marge sur coût variable, pas celui de la perte en coût complet", () => {
    const juste = partie(MEILLEUR, { prevision: 20.8 });
    const complet = partie(MEILLEUR, { prevision: -11.2 });
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_COMMANDE_SPECIALE.comportements(juste, t)[3]!.score).toBe(1);
    expect(EPISODE_COMMANDE_SPECIALE.comportements(complet, t)[3]!.score).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_COMMANDE_SPECIALE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /au-dessus du budget/,
    );
    expect(EPISODE_COMMANDE_SPECIALE.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/sous le budget/);
  });
});
