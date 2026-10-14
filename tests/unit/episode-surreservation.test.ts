import { describe, expect, it } from "vitest";
import {
  CLIENT,
  COUT_DELOGEMENT_FIDELE,
  COUT_DELOGEMENT_PASSAGE,
  CV,
  CV_NUITEE,
  D,
  DEFECTION,
  DELOGEMENT,
  GARANTIES,
  HOTELS,
  IMPREVUS,
  SURRESERVATION_REFERENCE,
  TAUX_REFERENCE,
  auPlus,
  hasard,
  margeEsperee,
  simuler,
  surreservationDuSoir,
  surreservationOptimale,
  surreservationParLaRegle,
  SOIRS,
} from "../../src/engine/episodes/surreservation";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_DERNIER_ARRIVE,
  COUT_VILLE_PLEINE,
  ETAPES,
  REFERENCES,
  REFLEXES,
  SEUIL_REFERENCE,
  TABLE_REFERENCE,
  pc,
} from "../../src/config/episodes/surreservation";
import { euros } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_SURRESERVATION } from "../../src/pedagogy/episodes/surreservation";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les chambres vendues deux fois » enseigne qu'une politique de
 * surréservation se calcule en comparant, en espérance, le coût d'une chambre
 * vide (la marge perdue) et celui d'un délogement (nuit chez un confrère,
 * taxi, geste, client perdu), selon les défections de chaque segment ; que ce
 * calcul se refait quand la garantie, le client délogé ou le soir changent ;
 * et que refuser toute surréservation comme surréserver de 5 % partout coûtent
 * cher. Ces tests verrouillent les classements qui le disent, et la cohérence
 * des chiffres que les sources donnent avec le modèle.
 */

const MEILLEUR = [2, 1, 1, 2, 1, 1];
const REFLEXE = [1, 0, 3, 1, 2, 0];
const ATTENTISTE = [0, 0, 0, 0, 0, 1];
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

describe("le modèle de la surréservation", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    // Sans surréservation dans les deux cas, la semaine 1 est la même quelle que soit la suite.
    expect(simuler(ATTENTISTE, 12).semaines[1]!.vides).toBe(
      simuler([0, 1, 1, 2, 1, 1], 12).semaines[1]!.vides,
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

  it("refuser de surréserver laisse des chambres vides ; surréserver fait déloger", () => {
    const sans = simuler(ATTENTISTE, 3);
    const calcule = simuler(MEILLEUR, 3);
    expect(sans.vides).toBeGreaterThan(2 * calcule.vides);
    expect(sans.remplies).toBe(0);
    expect(calcule.deloges).toBeGreaterThan(sans.deloges);
    expect(calcule.to).toBeGreaterThan(sans.to);
  });

  it("le niveau calculé dépend de l'hôtel, de la règle de délogement et du soir", () => {
    const soir = (hotel: string, semaine: number) =>
      SOIRS.find((s) => s.hotel === hotel && s.semaine === semaine)!;
    // Beaucoup de défections d'affaires à Chambéry, presque aucune chez les curistes d'Aix.
    expect(surreservationDuSoir(MEILLEUR, soir("chambery", 3), 1)).toBeGreaterThan(
      surreservationDuSoir(MEILLEUR, soir("aix", 3), 1),
    );
    // Déloger des clients de passage coûte moins cher : on peut surréserver davantage.
    expect(surreservationDuSoir(MEILLEUR, soir("annemasse", 3), 1)).toBeGreaterThan(
      surreservationDuSoir([2, 0, 1, 2, 1, 1], soir("annemasse", 3), 1),
    );
    // Le soir du congrès, le calcul refait donne moins que d'habitude.
    expect(surreservationDuSoir(MEILLEUR, soir("annecy", 7), 1)).toBeLessThan(
      surreservationDuSoir([2, 1, 1, 0, 1, 1], soir("annecy", 7), 1),
    );
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("le coût d'une chambre vide et celui d'un délogement", () => {
    expect(CV).toBe(CV_NUITEE.linge + CV_NUITEE.accueil + CV_NUITEE.energie + CV_NUITEE.menage);
    expect(CV).toBe(21);
    expect(HOTELS.chambery.prix.normal - CV).toBe(121);
    expect(COUT_DELOGEMENT_PASSAGE).toBe(
      DELOGEMENT.confrere +
        DELOGEMENT.taxi +
        DELOGEMENT.geste +
        CLIENT.pertePassage * CLIENT.valeurPassage,
    );
    expect(COUT_DELOGEMENT_PASSAGE).toBe(260);
    expect(COUT_DELOGEMENT_FIDELE).toBe(230 + 0.2 * 4000);
    const couts = source(0, "couts");
    expect(couts).toContain("121 € de marge perdue");
    expect(couts).toContain(`${COUT_DELOGEMENT_PASSAGE} € pour un client de passage`);
    expect(couts).toContain(`${euros(1030)} pour un fidèle`);
  });

  it("la répartition des défections du soir de référence, et le taux de chaque hôtel", () => {
    expect(TAUX_REFERENCE).toBeCloseTo(0.15 * 0.02 + 0.2 * 0.06 + 0.5 * 0.16 + 0.15 * 0.03, 9);
    const defections = source(0, "defections");
    expect(defections).toContain(`tarifs d'entreprise sans garantie ${pc(DEFECTION.affaires)}`);
    expect(defections).toContain("10 % à Chambéry-Gare");
    for (const { k, p } of TABLE_REFERENCE) {
      expect(p).toBeCloseTo(auPlus(k, 72, TAUX_REFERENCE), 9);
    }
    expect(defections).toContain("au plus 5 : 27 %");
    expect(defections).toContain("au plus 6 : 42 %");
  });

  it("la prévision : la règle de la page donne l'optimum exact du modèle", () => {
    expect(SEUIL_REFERENCE).toBeCloseTo(121 / 381, 9);
    expect(auPlus(5, 72, TAUX_REFERENCE)).toBeLessThan(SEUIL_REFERENCE);
    expect(auPlus(6, 72, TAUX_REFERENCE)).toBeGreaterThanOrEqual(SEUIL_REFERENCE);
    expect(surreservationParLaRegle(72, TAUX_REFERENCE, 121, 260)).toBe(6);
    expect(SURRESERVATION_REFERENCE).toBe(6);
    expect(surreservationOptimale(72, TAUX_REFERENCE, 121, 260)).toBe(6);
    // Six chambres font mieux que la moyenne des défections (7) et que 5 % (4).
    const m = (x: number) => margeEsperee(72, x, TAUX_REFERENCE, 121, 260);
    expect(m(6)).toBeGreaterThan(m(7));
    expect(m(6)).toBeGreaterThan(m(4));
    expect(EPISODE_SURRESERVATION.prevision.reel(simuler(MEILLEUR, 1))).toBe(6);
  });

  it("le délogement au dernier arrivé, en ville pleine, et les garanties", () => {
    expect(COUT_DERNIER_ARRIVE).toBeCloseTo(230 + 0.55 * 0.2 * 4000 + 0.45 * 30, 9);
    expect(source(1, "arrivees")).toContain(`${COUT_DERNIER_ARRIVE} €`);
    expect(COUT_VILLE_PLEINE).toBe(260 + 120 + 50 + 0.12 * 400);
    expect(source(3, "villePleine")).toContain(`${COUT_VILLE_PLEINE} € par délogement`);
    expect(source(2, "garanties")).toContain(
      `de ${pc(DEFECTION.affaires)} à ${pc(DEFECTION.affaires * GARANTIES[1]!.defection.affaires)}`,
    );
    expect(pc(DEFECTION.affaires * GARANTIES[1]!.defection.affaires)).toBe("11,2 %");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le calcul bat nettement l'interdiction et les 5 % partout", () => {
    const r = rejeu(MEILLEUR, D.politique);
    expect(classement(MEILLEUR, D.politique)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    // Surréserver de la moyenne oublie que les deux erreurs n'ont pas le même coût.
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
  });

  it("D2 : déloger des clients de passage prévenus bat le dernier arrivé", () => {
    const r = rejeu(MEILLEUR, D.deloger);
    expect(classement(MEILLEUR, D.deloger)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("D3 : la carte est la meilleure en moyenne, la garantie société la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.garantie);
    expect(classement(MEILLEUR, D.garantie)[0]).toBe(1);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10 + 1000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D4 : pendant le congrès, surréserver moins ; surréserver davantage est le pire", () => {
    const r = rejeu(MEILLEUR, D.congres);
    expect(classement(MEILLEUR, D.congres)[0]).toBe(2);
    expect(classement(MEILLEUR, D.congres).at(-1)).toBe(1);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(1500);
  });

  it("D5 : mettre le calcul à jour pour novembre, ce qui ne vaut que si l'on calculait", () => {
    const r = rejeu(MEILLEUR, D.novembre);
    expect(classement(MEILLEUR, D.novembre)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    // L'interaction avec la décision 1 : une règle uniforme n'a rien à mettre à jour.
    const uniforme = [1, 1, 1, 2, 1, 1];
    const u = rejeu(uniforme, D.novembre);
    expect(u[1]!.attendu).toBeCloseTo(u[0]!.attendu, 6);
    expect(classement(uniforme, D.novembre)[0]).toBe(2);
  });

  it("D6 : suspendre sous la pression des directeurs coûte le plus", () => {
    const r = rejeu(MEILLEUR, D.pression);
    expect(classement(MEILLEUR, D.pression)[0]).toBe(1);
    expect(classement(MEILLEUR, D.pression).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("comparer les deux coûts bat nettement les réflexes et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(50000);
    expect(bonne! - attentiste!).toBeGreaterThan(50000);
    expect(attendu(REFLEXE)).toBeCloseTo(reflexe!, 6);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni prise par la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_SURRESERVATION, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(
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
    consultes: [
      ["defections", "couts"],
      ["arrivees"],
      ["garanties", "sarvelec"],
      ["villePleine", "inscrits"],
      ["constat"],
      ["compte"],
    ],
    jours: JOURS,
    diagnostic: "arbitrage",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 6,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_SURRESERVATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les réflexes, propose de comparer les deux coûts", () => {
    const p = partie(REFLEXE, { diagnostic: "image" });
    const c = EPISODE_SURRESERVATION.comportements(
      p,
      analyser(EPISODE_SURRESERVATION, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_SURRESERVATION.axe(c).titre).toBe("Comparer les deux coûts, en espérance");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer une chambre vide et un délogement", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_SURRESERVATION.comportements(
      p,
      analyser(EPISODE_SURRESERVATION, p).trimestre,
    );
    expect(EPISODE_SURRESERVATION.axe(c).titre).toBe("Chiffrer une chambre vide et un délogement");
  });

  it("juge le calcul de la surréservation, pas la moyenne des défections ni les 5 %", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (prevision: number) =>
      EPISODE_SURRESERVATION.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(6)).toBe(1);
    expect(score(7)).toBe(0.6);
    expect(score(4)).toBe(0);
    expect(score(0)).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_SURRESERVATION.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /au-dessus du budget/,
    );
    expect(EPISODE_SURRESERVATION.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
