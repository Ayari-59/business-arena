import { describe, expect, it } from "vitest";
import {
  CHANTIER_HEBDO,
  COUT_STOCK_BRONDEL,
  CREANCE_BRONDEL,
  D,
  ENCOURS_PALIER,
  GUENARD_HEBDO,
  IMPREVUS,
  LIMITE_DEMANDEE,
  PD_CORVELLE,
  PERTE_ATTENDUE_DEMANDEE,
  PRIX_CESSION,
  RECUPERATION_MOYENNE,
  SEMAINES_CHANTIER,
  TAUX_MARGE_CHANTIER,
  TAUX_MARGE_GUENARD,
  agrementAccorde,
  corvelleDegrade,
  hasard,
  semaineDefautCorvelle,
  semaineReduction,
  simuler,
} from "../../src/engine/episodes/client-a-risque";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/client-a-risque";
import { euros, kE, taux } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_CLIENT_A_RISQUE } from "../../src/pedagogy/episodes/client-a-risque";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le client à risque » enseigne trois choses : une vente à
 * crédit ne vaut que sa marge moins la perte attendue (probabilité de
 * défaut × exposition × (1 − taux de récupération)) ; une garantie ne vaut
 * que si elle coûte moins que le risque qu'elle couvre ; la limite s'ajuste
 * au fil des signaux qui s'accumulent, ni sur le chiffre d'affaires, ni au
 * premier retard. Ces tests verrouillent les classements qui le disent, et
 * la cohérence des chiffres que les sources donnent avec le modèle.
 */

const MEILLEUR = [1, 2, 3, 1, 2, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [3, 0, 1, 2, 1, 3];
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
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source, quand il ne dépend pas de la situation. */
const source = (etape: number, id: string) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat({});
};

describe("le modèle du crédit clients", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).corvelleDefaut).toBe(simuler(ATTENTISTE, 12).corvelleDefaut);
    expect(simuler(MEILLEUR, 12).recuperationBrondel).toBe(
      simuler(REFLEXE, 12).recuperationBrondel,
    );
    expect(simuler(MEILLEUR, 12).semaines[1]!.ventes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.ventes,
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

  it("fait défaut Corvelle environ une fois sur dix, et seulement quand elle s'est dégradée", () => {
    const defauts = GRAINES_DU_BILAN.filter((g) => semaineDefautCorvelle(g) > 0);
    expect(defauts.length).toBeGreaterThanOrEqual(2);
    expect(defauts.length).toBeLessThanOrEqual(5);
    for (const g of defauts) expect(corvelleDegrade(g)).toBe(true);
    // L'assureur répond trois fois : tout, la moitié, rien.
    const reponses = new Set(GRAINES_DU_BILAN.map(agrementAccorde));
    expect([...reponses].sort((a, b) => a - b)).toEqual([0, 250000, 500000]);
  });

  it("donne dans les sources les chiffres du modèle", () => {
    // La perte attendue sur l'encours demandé : PD × exposition × (1 − récupération).
    expect(PERTE_ATTENDUE_DEMANDEE).toBeCloseTo(
      PD_CORVELLE * LIMITE_DEMANDEE * (1 - RECUPERATION_MOYENNE),
      6,
    );
    expect(PERTE_ATTENDUE_DEMANDEE).toBeCloseTo(42500, 6);
    expect(source(0, "dossier")).toContain(taux(PD_CORVELLE, 0));
    expect(source(0, "procedures")).toContain(taux(RECUPERATION_MOYENNE, 0));
    expect(EPISODE_CLIENT_A_RISQUE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(42.5, 6);

    // La marge du chantier, et l'encours qu'il porte : c'est ce que le modèle livre.
    const margeChantier = CHANTIER_HEBDO * SEMAINES_CHANTIER * TAUX_MARGE_CHANTIER;
    expect(margeChantier).toBeCloseTo(54000, 6);
    expect(source(0, "chantier")).toContain(kE(margeChantier));
    expect(source(0, "chantier")).toContain(kE(ENCOURS_PALIER));
    const ouvert = simuler([0, 2, 3, 2, 2, 3], 1);
    expect(ouvert.corvelleDegrade).toBe(false);
    expect(ouvert.semaines[9]!.encoursCorvelle).toBeCloseTo(ENCOURS_PALIER, 6);
    expect(ouvert.chantierLivre).toBeCloseTo(CHANTIER_HEBDO * SEMAINES_CHANTIER, 6);

    // Ce que Guénard rapporte chaque semaine.
    expect(source(1, "historique")).toContain(euros(GUENARD_HEBDO * TAUX_MARGE_GUENARD));
    expect(euros(GUENARD_HEBDO * TAUX_MARGE_GUENARD)).toBe(euros(1320));

    // Brondel : la créance déclarée se déprécie du hors-taxe que le dividende ne rendra pas.
    expect(source(4, "stock")).toContain(kE(COUT_STOCK_BRONDEL));
    for (const g of [1, 2, 3]) {
      const t = simuler([1, 2, 3, 1, 1, 1], g);
      expect(t.perteBrondel).toBeCloseTo(CREANCE_BRONDEL * (1 - t.recuperationBrondel), 6);
      expect(simuler([1, 2, 3, 1, 3, 1], g).perteBrondel).toBeCloseTo(
        CREANCE_BRONDEL * (1 - PRIX_CESSION),
        6,
      );
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : assurer l'encours de Corvelle bat l'accorder en blanc, l'acompte et le refus", () => {
    const c = classement(MEILLEUR, D.corvelle);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.corvelle, 1, 0)).toBeGreaterThan(10000);
    // L'acompte fait fuir la moitié du chantier : il coûte plus que le risque qu'il couvre.
    expect(c.indexOf(2)).toBeGreaterThan(c.indexOf(0));
    expect(c.at(-1)).toBe(3);
  });

  it("D2 : garder l'artisan fidèle bat le bloquer, le passer au comptant ou lui imposer une caution", () => {
    const c = classement(MEILLEUR, D.guenard);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(ecart(MEILLEUR, D.guenard, 2, 0)).toBeGreaterThan(5000);
    expect(ecart(MEILLEUR, D.guenard, 2, 3)).toBeGreaterThan(3000);
  });

  it("D3 : la caution d'un dirigeant solvable vaut mieux que le compte en blanc, le comptant ou le refus", () => {
    const c = classement(MEILLEUR, D.halvane);
    expect(c[0]).toBe(3);
    expect(c.at(-1)).toBe(1);
    expect(ecart(MEILLEUR, D.halvane, 3, 0)).toBeGreaterThan(10000);
  });

  it("D4 : surveiller les signaux est le meilleur choix en moyenne ; bloquer est le plus sûr, et coûte cher", () => {
    const r = rejeu(MEILLEUR, D.signaux);
    expect(classement(MEILLEUR, D.signaux)[0]).toBe(1);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSur).toBe(3);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D4 dépend de D1 : assuré, l'alerte de l'assureur arrive à temps, et la surveillance paie", () => {
    const assure = [1, 2, 3, 1, 2, 1];
    const enBlanc = [0, 2, 3, 1, 2, 1];
    const degradees = GRAINES_DU_BILAN.filter(corvelleDegrade);
    for (const g of degradees) {
      const tot = semaineReduction(assure, g);
      const tard = semaineReduction(enBlanc, g);
      expect(tard).toBe(10);
      if (agrementAccorde(g) > 0) expect(tot).toBe(8);
    }
    expect(ecart(assure, D.signaux, 1, 2)).toBeGreaterThan(3000);
    expect(Math.abs(ecart(enBlanc, D.signaux, 1, 2))).toBeLessThan(1000);
  });

  it("D5 : déclarer et revendiquer bat la cession et la perte passée sans déclaration", () => {
    const c = classement(MEILLEUR, D.brondel);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(c.indexOf(1)).toBeLessThan(c.indexOf(3));
  });

  it("D6 : trier les comptes selon les signaux bat tout bloquer, tout assurer ou ne rien faire", () => {
    const c = classement(MEILLEUR, D.cloture);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.cloture, 1, 0)).toBeGreaterThan(15000);
    expect(ecart(MEILLEUR, D.cloture, 1, 2)).toBeGreaterThan(15000);
  });

  it("aucun réflexe n'est un bon choix sur le meilleur chemin, ni dans la meilleure référence", () => {
    for (const [d, o] of REFLEXES) {
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_CLIENT_A_RISQUE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
  });

  it("chiffrer le risque et le couvrir bat les réflexes et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 50000);
    expect(methode).toBeGreaterThan(attentiste! + 50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["dossier", "procedures", "chantier"],
      ["historique"],
      ["greffe"],
      ["signaux"],
      ["procedure"],
      ["balance"],
    ],
    jours: JOURS,
    diagnostic: "perteAttendue",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 42,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CLIENT_A_RISQUE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de raisonner en perte attendue", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CLIENT_A_RISQUE.comportements(
      p,
      analyser(EPISODE_CLIENT_A_RISQUE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CLIENT_A_RISQUE.axe(c).titre).toBe(
      "Raisonner en perte attendue, pas en chiffre d'affaires",
    );
  });

  it("à qui a décidé sans enquêter, propose de chiffrer avant d'accorder", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CLIENT_A_RISQUE.comportements(
      p,
      analyser(EPISODE_CLIENT_A_RISQUE, p).trimestre,
    );
    expect(EPISODE_CLIENT_A_RISQUE.axe(c).titre).toBe("Chiffrer avant d'accorder");
  });

  it("juge la prévision sur la perte attendue, à 2 k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const score = (prevision: number) =>
      EPISODE_CLIENT_A_RISQUE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(42.5)).toBe(1);
    expect(score(50)).toBe(0.6); // la récupération oubliée
    expect(score(7.5)).toBe(0); // le taux de récupération pris pour la perte
  });

  it("dit le résultat en écart au budget, et la courbe couvre les valeurs atteintes", () => {
    expect(EPISODE_CLIENT_A_RISQUE.bilan.titre(simuler(MEILLEUR, 2))).toMatch(
      /au-dessus du budget/,
    );
    expect(EPISODE_CLIENT_A_RISQUE.bilan.titre(simuler(ATTENTISTE, 2))).toMatch(/sous le budget/);
    const haut = EPISODE_CLIENT_A_RISQUE.courbe.graduations.at(-1)!;
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.perteAttendue).toBeLessThanOrEqual(haut);
        }
      }
    }
  });
});
