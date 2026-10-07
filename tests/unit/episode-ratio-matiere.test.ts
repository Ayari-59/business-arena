import { describe, expect, it } from "vitest";
import {
  AOUT,
  CA_SEMAINE_AOUT,
  COUVERTS,
  D,
  DERIVE_GRAMMAGES,
  EXCES_CARTE,
  FACTEUR_STOCK,
  HAUSSE,
  HAUSSE_CARTE,
  IMPREVUS,
  PART_SIGNATURES,
  PERTE_ECART,
  PERTE_FERMETURE,
  PERTE_LOCAUX_HAUSSE,
  PERTE_NORMALE,
  POINTS,
  RATIO_AFFICHE_AOUT,
  RATIO_REEL_AOUT,
  RFA,
  STOCK_FRAIS,
  SURCOUT_HAUSSE,
  THEORIQUE,
  TICKET,
  carteRejetee,
  hasard,
  simuler,
} from "../../src/engine/episodes/ratio-matiere";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/ratio-matiere";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_RATIO_MATIERE } from "../../src/pedagogy/episodes/ratio-matiere";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le ratio matière qui dérape » enseigne qu'un ratio se
 * diagnostique avant de se corriger : la mesure (un inventaire raté), les
 * pertes (une carte trop longue), les grammages et les prix d'achat ne pèsent
 * pas pareil, et monter la carte fait baisser le ratio et la marge à la fois
 * quand les clients d'ici sont sensibles au prix. Ces tests verrouillent les
 * chiffres que les sources donnent et les classements qui disent la leçon.
 */

const MEILLEUR = [2, 1, 0, 1, 0, 0];
const REFLEXE = [0, 0, 1, 0, 2, 2];
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
const avec = (chemin: readonly number[], d: number, o: number) =>
  chemin.map((v, i) => (i === d ? o : v));
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r(ctx);
};
/** Un nombre à la française, avec la virgule décimale, comme les sources l'écrivent. */
const fr = (v: number, d = 1) => v.toFixed(d).replace(".", ",");

describe("le modèle de La Table d'Augustin", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.couverts).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.couverts,
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

  it("reproduit le vrai ratio d'août en semaine 1, quand rien n'a encore changé", () => {
    const s = simuler(ATTENTISTE, 3).semaines[1]!;
    expect(s.ratio).toBeGreaterThan(RATIO_REEL_AOUT - 0.015);
    expect(s.ratio).toBeLessThan(RATIO_REEL_AOUT + 0.025);
  });

  it("sans recomptage, la clôture de septembre affiche un ratio trop beau ; recomptée, le vrai", () => {
    const sans = simuler(ATTENTISTE, 5);
    const caSeptembre = sans.semaines.slice(1, 5).reduce((x, w) => x + w!.caNourriture, 0);
    expect(sans.reels[0]! - sans.affiches[0]!).toBeCloseTo(AOUT.negative / caSeptembre, 9);
    expect(sans.affiches[0]!).toBeLessThan(0.32);
    expect(sans.reels[0]!).toBeGreaterThan(0.34);
    const avecRecompte = simuler(avec(ATTENTISTE, D.ratio, 2), 5);
    expect(avecRecompte.affiches[0]).toBe(avecRecompte.reels[0]);
  });

  it("monter la carte fait baisser le ratio, et la marge avec", () => {
    const hausse = simuler(avec(ATTENTISTE, D.ratio, 0), 4);
    const rien = simuler(ATTENTISTE, 4);
    expect(hausse.ratio).toBeLessThan(rien.ratio);
    expect(attendu(avec(ATTENTISTE, D.ratio, 0))).toBeLessThan(attendu(ATTENTISTE) - 10000);
    expect(hausse.locaux).toBeLessThan(0.9 * rien.locaux);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("la clôture d'août et la prévision : 36,4 % affichés, 33,4 % réels", () => {
    const consomme = AOUT.stockInitial + AOUT.achats - AOUT.stockCompte;
    expect(consomme).toBe(50960);
    expect(RATIO_AFFICHE_AOUT).toBeCloseTo(0.364, 9);
    expect(RATIO_REEL_AOUT).toBeCloseTo(0.334, 9);
    expect(EPISODE_RATIO_MATIERE.prevision.reel(simuler(MEILLEUR, 1))).toBe(33.4);
    const [cloture, direction] = ETAPES[0]!.messages({});
    expect(cloture!.texte).toContain("140,0 k€");
    expect(cloture!.texte).toContain("50,96 k€");
    expect(cloture!.texte).toContain(`${fr(RATIO_AFFICHE_AOUT * 100)} %`);
    // 6,4 points au-dessus de 30 % sur 140 k€ : près de 9 k€.
    expect((RATIO_AFFICHE_AOUT - 0.3) * AOUT.ca).toBeCloseTo(8960, 6);
    expect(direction!.texte).toContain("près de 9 k€");
    const inventaire = texte(0, "inventaire");
    for (const v of ["16 800 €", "47 320 €", "13 160 €", "4 200 €", "140 000 €"]) {
      expect(inventaire).toContain(v);
    }
    expect(AOUT.negative).toBe(4200);
  });

  it("la cuisine : 950 € jetés par semaine, 3,0 % du CA, un ratio théorique de 28,5 %", () => {
    const jete = EXCES_CARTE + PERTE_NORMALE * CA_SEMAINE_AOUT;
    expect(Math.round(jete / 10) * 10).toBe(950);
    const cuisine = texte(0, "cuisine");
    expect(cuisine).toContain("950 €");
    expect(cuisine).toContain(`${fr((jete / CA_SEMAINE_AOUT) * 100)} %`);
    expect(cuisine).toContain(`${fr(PERTE_NORMALE * 100)} %`);
    expect(cuisine).toContain(`${fr(THEORIQUE * 100)} %`);
    // Les produits jetés au-delà de la normale : la plus grosse part de l'écart.
    expect(POINTS.carte).toBeGreaterThan(POINTS.grammages + POINTS.hausse);
    expect(
      POINTS.theorique + POINTS.normales + POINTS.carte + POINTS.hausse + POINTS.grammages,
    ).toBeCloseTo(RATIO_REEL_AOUT, 9);
  });

  it("la hausse des Halles : 1 200 € en août, 0,9 point de ratio", () => {
    expect(SURCOUT_HAUSSE).toBeCloseTo(1200, 9);
    const factures = texte(0, "factures");
    expect(factures).toContain(`+${HAUSSE.beurre.taux * 100} %`);
    expect(factures).toContain(`+${HAUSSE.veau.taux * 100} %`);
    expect(factures).toContain("3 000 €");
    expect(factures).toContain("4 600 €");
    expect(factures).toContain("1 200 €");
    expect(factures).toContain(`${fr(POINTS.hausse * 100)} point`);
  });

  it("les plats signatures : un point de ratio, qui grossit de 3 % par semaine", () => {
    const passe = texte(D.signatures, "passe");
    expect(passe).toContain(`${fr(POINTS.grammages * 100)} point`);
    expect(passe).toContain(`${DERIVE_GRAMMAGES * 100} %`);
    expect(passe).toContain(`${PART_SIGNATURES * 100} %`);
  });

  it("le grossiste : 4 500 € de remise perdue, 0,5 point gagné sur le catalogue", () => {
    expect(0.015 * 300000).toBe(RFA);
    expect(texte(D.fournisseur, "contrat")).toContain("4 500 €");
    expect(texte(D.fournisseur, "contrat")).toContain("300 000 €");
    expect(texte(D.fournisseur, "cotations")).toContain(
      `${fr(0.03 * 0.6 * THEORIQUE * 100)} point`,
    );
  });

  it("novembre : 17 % de couverts en moins, 6,60 € jetés par couvert qui ne vient pas", () => {
    const moyenneDe = (de: number, a: number) => moyenne(COUVERTS.slice(de, a + 1));
    const baisse = 1 - moyenneDe(10, 13) / moyenneDe(5, 9);
    expect(Math.round(baisse * 100)).toBe(17);
    expect(ETAPES[D.novembre]!.messages({ ratio: "33 %" })[0]!.texte).toContain("17 %");
    expect(PERTE_ECART * THEORIQUE * TICKET).toBeCloseTo(6.6, 1);
    expect(texte(D.novembre, "commandes")).toContain("6,60 €");
    // Chambéry : +7 % en octobre, 16 % des habitués perdus.
    expect(Math.round(((PERTE_LOCAUX_HAUSSE * 0.07) / HAUSSE_CARTE) * 100)).toBe(16);
    expect(texte(D.novembre, "chambery")).toContain("16 %");
    expect(texte(0, "conseil")).toContain("16 %");
  });

  it("la carte à +8 % et la fermeture : ce que les options et la source annoncent", () => {
    expect(ETAPES[0]!.options[0]!.d).toContain(`${fr(TICKET * (1 + HAUSSE_CARTE), 2)} €`);
    expect(PERTE_FERMETURE[3]).toBe(0.6);
    expect(PERTE_FERMETURE[1]).toBe(0.4);
    const stock = texte(D.fermeture, "stock", { stockFrais: "4 800 €" });
    expect(stock).toContain("six dixièmes");
    expect(stock).toContain("quatre sur dix");
    expect(STOCK_FRAIS * FACTEUR_STOCK[3]).toBe(4800);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : recompter et peser est le meilleur choix ; monter la carte est le pire", () => {
    const r = rejeu(MEILLEUR, D.ratio);
    expect(classement(MEILLEUR, D.ratio)[0]).toBe(2);
    expect(classement(MEILLEUR, D.ratio).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D2 : la carte courte vaut le plus quand on a pesé les pertes ; l'ardoise est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.carte);
    expect(classement(MEILLEUR, D.carte)[0]).toBe(1);
    // Espérance contre robustesse : l'ardoise protège mieux des mauvais tirages.
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(GRAINES_DU_BILAN.some((g) => carteRejetee(g))).toBe(true);
    // Sans pesée, on ne sait pas quels plats retirer : l'ardoise passe devant.
    const sansPesee = avec(MEILLEUR, D.ratio, 3);
    expect(classement(sansPesee, D.carte)[0]).toBe(2);
    expect(classement(MEILLEUR, D.carte).at(-1)).toBe(0);
  });

  it("D3 : refaire les fiches bat la hausse de prix des deux plats et leur retrait", () => {
    const c = classement(MEILLEUR, D.signatures);
    expect(c[0]).toBe(0);
    expect(c.indexOf(1)).toBeGreaterThan(c.indexOf(3));
  });

  it("D4 : traiter les deux produits bat le changement de grossiste, de loin le pire", () => {
    const r = rejeu(MEILLEUR, D.fournisseur);
    expect(classement(MEILLEUR, D.fournisseur)[0]).toBe(1);
    expect(classement(MEILLEUR, D.fournisseur).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
  });

  it("D5 : caler les commandes bat la formule et la hausse ; il vaut plus avec une carte longue", () => {
    expect(classement(MEILLEUR, D.novembre)[0]).toBe(0);
    expect(classement(MEILLEUR, D.novembre).at(-1)).toBe(2);
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.novembre);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(avec(MEILLEUR, D.carte, 0))).toBeGreaterThan(gain(MEILLEUR));
  });

  it("D6 : un plan de fin de stock bat la congélation ; la remise est le pire", () => {
    expect(classement(MEILLEUR, D.fermeture)[0]).toBe(0);
    expect(classement(MEILLEUR, D.fermeture).at(-1)).toBe(2);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni n'est dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_RATIO_MATIERE, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `D${d + 1} option ${o}`).toBe(false);
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
    }
  });

  it("mesurer puis traiter la cause bat la correction par le prix et l'attentisme, en moyenne", () => {
    const [methode, prix, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - prix!).toBeGreaterThan(30000);
    expect(methode! - attentiste!).toBeGreaterThan(10000);
    expect(attentiste!).toBeGreaterThan(prix!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["inventaire", "cuisine", "factures"],
      ["pertes"],
      ["septembre", "passe"],
      ["contrat"],
      ["commandes"],
      ["stock"],
    ],
    jours: JOURS,
    diagnostic: "carte",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 33.4,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RATIO_MATIERE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a corrigé par le prix, propose d'agir sur la cause", () => {
    const p = partie(REFLEXE, { diagnostic: "fournisseur" });
    const c = EPISODE_RATIO_MATIERE.comportements(p, analyser(EPISODE_RATIO_MATIERE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_RATIO_MATIERE.axe(c).titre).toBe("Agir sur la cause, pas sur le prix");
  });

  it("à qui a décidé sans enquêter, propose de recalculer avant de corriger", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RATIO_MATIERE.comportements(p, analyser(EPISODE_RATIO_MATIERE, p).trimestre);
    expect(EPISODE_RATIO_MATIERE.axe(c).titre).toBe("Recalculer avant de corriger");
  });

  it("juge la prévision au dixième de point, et le diagnostic selon la cause", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_RATIO_MATIERE.comportements(partie(MEILLEUR), t);
    expect(juste[1]!.score).toBe(1);
    expect(juste[3]!.score).toBe(1);
    const affiche = EPISODE_RATIO_MATIERE.comportements(
      partie(MEILLEUR, { prevision: 36.4, diagnostic: "grammages" }),
      t,
    );
    expect(affiche[1]!.score).toBe(0.6);
    expect(affiche[3]!.score).toBe(0);
    const proche = EPISODE_RATIO_MATIERE.comportements(
      partie(MEILLEUR, { prevision: 34, diagnostic: "inventaire" }),
      t,
    );
    expect(proche[1]!.score).toBe(0);
    expect(proche[3]!.score).toBe(0.6);
  });

  it("dit le résultat en marge brute, et le tableau de bord lit chaque indicateur", () => {
    expect(EPISODE_RATIO_MATIERE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/marge brute/);
    const depart = EPISODE_RATIO_MATIERE.lire([], 1, 0, 0);
    expect(depart.ratioMois).toBeCloseTo(RATIO_AFFICHE_AOUT, 9);
    // Recomptée, la clôture d'août est corrigée dès la semaine 1.
    expect(EPISODE_RATIO_MATIERE.lire([2], 1, 0, 1).ratioMois).toBeCloseTo(RATIO_REEL_AOUT, 9);
    for (const ind of EPISODE_RATIO_MATIERE.indicateurs) {
      expect(EPISODE_RATIO_MATIERE.lire([], 1, 0, 4)[ind.cle], ind.cle).not.toBeUndefined();
    }
  });
});
