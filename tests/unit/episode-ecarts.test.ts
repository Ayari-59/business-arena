import { describe, expect, it } from "vitest";
import {
  CIMENT_COMPOSE,
  COMMANDE_ZAC,
  COUT_PREETABLI,
  D,
  ECARTS_MOIS_DERNIER,
  IMPREVUS,
  INTERIM,
  MARGE,
  MOIS_DERNIER,
  PRIX_CIMENT,
  STANDARD,
  TAUX_SUP,
  hasard,
  simuler,
  tableauDeBord,
  type Semaine,
} from "../../src/engine/episodes/ecarts-du-budget";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/ecarts-du-budget";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ECARTS } from "../../src/pedagogy/episodes/ecarts-du-budget";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les écarts du budget » enseigne l'analyse des écarts avec le
 * budget flexible : l'écart au budget statique mêle le volume et les coûts ;
 * l'écart sur coûts se décompose en prix et quantités, taux et temps ; et le
 * plus visible (le prix du ciment, le total, le taux horaire) n'est pas le
 * plus lourd. Ces tests verrouillent les chiffres que les sources donnent et
 * les classements qui disent la leçon.
 */

const MEILLEUR = [1, 0, 1, 2, 0, 1];
const REFLEXE = [0, 3, 0, 0, 2, 0];
const ATTENTISTE = [0, 2, 2, 3, 2, 2];
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
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
/** Un montant en k€ au dixième, comme les sources l'écrivent. */
const k1 = (v: number) =>
  `${(v / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} k€`;
const texte = (etape: number, id: string) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r({});
};

describe("le modèle de l'atelier béton", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.demande).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.demande,
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

  it("décompose exactement l'écart au budget flexible, et l'écart statique y ajoute le volume", () => {
    const t = simuler(ATTENTISTE, 5);
    for (const s of t.semaines.slice(1) as Semaine[]) {
      const somme =
        s.ecartPrixCiment +
        s.ecartQuantiteCiment +
        s.ecartPrixAutres +
        s.ecartQuantiteAutres +
        s.ecartTaux +
        s.ecartTemps;
      expect(s.coutProduction - s.flexible).toBeCloseTo(somme, 6);
    }
    const l = tableauDeBord(MEILLEUR, 5, 0, 7);
    expect(l.ecartStatique! - l.ecartFlexible!).toBeCloseTo(l.volume!, 6);
    expect(l.volume!).toBeGreaterThan(0);
  });

  it("reproduit la dérive du mois dernier en semaine 1", () => {
    const s = simuler(ATTENTISTE, 3).semaines[1]!;
    expect(s.rebut).toBeCloseTo(MOIS_DERNIER.rebut, 6);
    expect(s.ciment).toBeCloseTo((MOIS_DERNIER.ciment / MOIS_DERNIER.production) * 1000, 0);
    expect(s.heures).toBeCloseTo(MOIS_DERNIER.heures / MOIS_DERNIER.production, 2);
  });

  it("retirer le demi-sac sans régler la presse fait rebuter davantage", () => {
    const sansPresse = simuler([0, 0, 2, 3, 2, 2], 4).semaines[5]!;
    const avecPresse = simuler([1, 0, 2, 3, 2, 2], 4).semaines[5]!;
    const habitude = simuler(ATTENTISTE, 4).semaines[5]!;
    expect(sansPresse.rebut).toBeGreaterThan(habitude.rebut + 0.02);
    expect(avecPresse.rebut).toBeLessThan(habitude.rebut - 0.03);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("le message de clôture et le budget flexible du mois dernier", () => {
    const e = ECARTS_MOIS_DERNIER;
    const alerte = ETAPES[0]!.messages({})[0]!.texte;
    expect(COUT_PREETABLI).toBe(111);
    expect(alerte).toContain(k1(e.reel));
    expect(alerte).toContain(k1(e.statique));
    expect(alerte).toContain(k1(e.global));
    expect(alerte).toContain(k1(MOIS_DERNIER.ciment * MOIS_DERNIER.prixCiment));
    expect(alerte).toContain(k1(MOIS_DERNIER.budget * STANDARD.ciment * STANDARD.prixCiment));
    const fiche = texte(0, "flexible");
    expect(fiche).toContain(k1(MOIS_DERNIER.production * COUT_PREETABLI));
    expect(fiche).toContain(
      `${MOIS_DERNIER.ciment} t de ciment payées ${MOIS_DERNIER.prixCiment} €/t`,
    );
    expect(fiche).toContain("1 040");
    expect(fiche).toContain("1 470 heures payées 38,40 €/h");
  });

  it("la prévision : l'écart sur quantité de ciment vaut 3,3 k€ défavorable, trois fois l'écart sur prix", () => {
    const e = ECARTS_MOIS_DERNIER;
    expect(e.quantiteCiment).toBeCloseTo(
      (MOIS_DERNIER.ciment - STANDARD.ciment * MOIS_DERNIER.production) * STANDARD.prixCiment,
      6,
    );
    expect(e.quantiteCiment).toBeCloseTo(3300, 6);
    expect(EPISODE_ECARTS.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(3.3, 6);
    expect(e.prixCiment).toBeCloseTo(1068, 6);
    expect(e.quantiteCiment).toBeGreaterThan(3 * e.prixCiment);
    // Le temps pèse plus que tout le ciment ; le volume, le quart du dépassement.
    expect(e.temps).toBeGreaterThan(e.prixCiment + e.quantiteCiment);
    expect(e.volume / e.global).toBeCloseTo(0.25, 1);
    expect(
      e.volume +
        e.prixCiment +
        e.quantiteCiment +
        e.quantiteGranulats +
        e.quantiteAcier +
        e.taux +
        e.temps,
    ).toBeCloseTo(e.global, 6);
  });

  it("la commande de la ZAC : budget flexible, marge sur coût variable et taux horaires", () => {
    const calcul = texte(D.commande, "commande");
    expect(calcul).toContain(k1(COMMANDE_ZAC.tonnes * COUT_PREETABLI));
    expect(calcul).toContain(`${MARGE} €/t`);
    expect(calcul).toContain(k1(COMMANDE_ZAC.tonnes * MARGE));
    expect(calcul).toContain(
      `${TAUX_SUP.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €/h`,
    );
    expect(calcul).toContain(`${INTERIM.taux} €/h`);
  });

  it("le ciment composé : moins cher à la tonne, plus cher à la tonne de béton", () => {
    expect(texte(D.ciment, "fiche")).toContain(`${CIMENT_COMPOSE.dosage * 100} %`);
    expect(PRIX_CIMENT.compose * (1 + CIMENT_COMPOSE.dosage)).toBeGreaterThan(PRIX_CIMENT.hausse);
    const compose = simuler([1, 0, 0, 2, 0, 1], 6);
    const hausse = simuler(
      MEILLEUR.map((o, d) => (d === D.ciment ? 2 : o)),
      6,
    );
    // L'écart sur prix s'améliore ; l'écart sur quantité se dégrade davantage.
    const gainPrix = hausse.ecarts.prixCiment - compose.ecarts.prixCiment;
    const pertequantite = compose.ecarts.quantiteCiment - hausse.ecarts.quantiteCiment;
    expect(gainPrix).toBeGreaterThan(0);
    expect(pertequantite).toBeGreaterThan(gainPrix);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : régler la presse est de loin le meilleur choix ; poursuivre le prix ou accuser l'atelier ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.ecart);
    expect(classement(MEILLEUR, D.ecart)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    // Les moules, la cause secondaire, valent mieux que le prix.
    expect(r[2]!.attendu).toBeGreaterThan(r[0]!.attendu);
  });

  it("D2 : revenir à la formule paie quand la presse est réglée, et coûte quand elle ne l'est pas", () => {
    expect(classement(MEILLEUR, D.dosage)[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.dosage);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
    const sansPresse = rejeu(ATTENTISTE, D.dosage);
    expect(sansPresse[0]!.attendu).toBeLessThan(sansPresse[2]!.attendu - 15000);
  });

  it("D3 : négocier bat la hausse ; le ciment composé, moins cher, est le pire", () => {
    const c = classement(MEILLEUR, D.ciment);
    expect(c).toEqual([1, 2, 0]);
    const r = rejeu(MEILLEUR, D.ciment);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
  });

  it("D4 : accepter la commande avec de l'intérim est le meilleur en moyenne, les heures supplémentaires le plus sûr ; refuser est le pire", () => {
    const r = rejeu(MEILLEUR, D.commande);
    const c = classement(MEILLEUR, D.commande);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.commande)).toBe(1);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("D5 : former au réglage est le meilleur choix, et vaut bien plus quand la presse n'a jamais été réglée", () => {
    expect(classement(MEILLEUR, D.regleur)[0]).toBe(0);
    const gain = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.regleur);
      return r[0]!.attendu - r[2]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(3000);
    expect(gain(ATTENTISTE)).toBeGreaterThan(gain(MEILLEUR) + 10000);
  });

  it("D6 : l'entretien de la presse bat le statu quo ; baisser le dosage pour la revue est le pire, et le plus risqué", () => {
    const r = rejeu(MEILLEUR, D.revue);
    expect(classement(MEILLEUR, D.revue)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.p10).toBeLessThan(r[2]!.p10 - 5000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_ECARTS, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const bonne =
        option.qualite >= 0.7 ||
        (option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000);
      expect(bonne, `D${d + 1} option ${o}`).toBe(false);
    }
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
  });

  it("décomposer puis traiter la cause bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(40000);
    expect(bonne! - attentiste!).toBeGreaterThan(30000);
    expect(attentiste!).toBeGreaterThan(-150000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["flexible", "presse"],
      ["gachees"],
      ["fiche"],
      ["commande"],
      ["changements"],
      ["carnet"],
    ],
    jours: JOURS,
    diagnostic: "presse",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 3.3,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ECARTS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de décomposer avant de réagir", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ECARTS.comportements(p, analyser(EPISODE_ECARTS, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ECARTS.axe(c).titre).toBe("Décomposer avant de réagir");
  });

  it("à qui a décidé sans enquêter, propose de refaire le budget à la production réelle", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ECARTS.comportements(p, analyser(EPISODE_ECARTS, p).trimestre);
    expect(EPISODE_ECARTS.axe(c).titre).toBe("Refaire le budget à la production réelle");
  });

  it("juge la prévision au calcul exact, et le diagnostic selon la cause", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juge = (extra: Partial<PartieJouee>) =>
      EPISODE_ECARTS.comportements(partie(MEILLEUR, extra), t);
    expect(juge({ prevision: 3.3 })[3]!.score).toBe(1);
    // Valorisé au prix réel plutôt qu'au prix préétabli : (178 − 156) × 156 = 3,4 k€.
    expect(juge({ prevision: 3.4 })[3]!.score).toBe(0.6);
    // Calculé sur le budget statique : (178 − 150) × 150 = 4,2 k€.
    expect(juge({ prevision: 4.2 })[3]!.score).toBe(0);
    expect(juge({ diagnostic: "moules" })[1]!.score).toBe(0.6);
    expect(juge({ diagnostic: "prix" })[1]!.score).toBe(0);
  });

  it("dit le résultat en écart au budget flexible", () => {
    expect(EPISODE_ECARTS.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(
      /au-delà du budget flexible/,
    );
    expect(EPISODE_ECARTS.bilan.titre({ ...simuler(MEILLEUR, 4242), objectif: 2000 })).toMatch(
      /sous le budget flexible/,
    );
  });
});
