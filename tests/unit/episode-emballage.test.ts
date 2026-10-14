import { describe, expect, it } from "vitest";
import {
  ANNONCE,
  BOBINES,
  CAPACITE_PS,
  CELTIS,
  CONFORMAGE,
  COUT_POINT_CADENCE,
  COUT_REBUT,
  D,
  ECO,
  IMPREVUS,
  POTS_SEMAINE,
  PRIX,
  REBUT_PS,
  SURCOUT_CARTON,
  VOLUME_AN,
  chanceDAlignement,
  commandeDeBobines,
  coutAnnuel,
  coutAnnuelAnnonce,
  hasard,
  partCeltis,
  simuler,
} from "../../src/engine/episodes/pot-a-remplacer";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  MARGE_HIVER,
  PRIX_SEMAINE_DE_BOBINES,
  REFERENCES,
  REFLEXES,
  centimes,
} from "../../src/config/episodes/pot-a-remplacer";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_EMBALLAGE } from "../../src/pedagogy/episodes/pot-a-remplacer";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";
import { euros, kE, taux } from "../../src/config/episodes/format";

/**
 * L'épisode « Le pot en plastique qu'il faut remplacer » enseigne qu'un
 * changement d'emballage dans une usine de produits frais se teste avant de se
 * généraliser : le nouveau matériau change la cadence, les rebuts, la tenue de
 * la DLC et le coût ; on qualifie sur une ligne et une référence, on mesure,
 * on négocie le surcoût avec les enseignes, puis on déploie par étapes.
 * Basculer toute la gamme pour une annonce, ou attendre l'échéance, coûtent.
 * Ces tests verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 0, 0, 2, 3, 2];
const REFLEXE = [0, 2, 1, 0, 0, 0];
const ATTENTISTE = [3, 1, 2, 3, 2, 1];
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
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const somme = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
  GRAINES_DU_BILAN.reduce((s, g) => s + f(simuler(c, g)), 0);

describe("les chiffres que les sources donnent au joueur", () => {
  it("les offres et le barème donnent la prévision : 132 k€ de surcoût annuel pour le carton", () => {
    const offres = texte(0, "offres");
    const eco = texte(0, "eco");
    for (const m of ["ps", "pp", "carton"] as const) {
      expect(offres).toContain(centimes(PRIX[m]));
      expect(eco).toContain(centimes(ECO[m]));
    }
    expect(eco).toContain("40 millions de pots");
    expect(offres).toContain(euros(CONFORMAGE.pp));
    expect(offres).toContain(euros(CONFORMAGE.carton));
    // (1,82 + 0,17 − 1,30 − 0,36) centime par pot, sur 40 millions de pots.
    expect(SURCOUT_CARTON).toBe(Math.round(((1.82 + 0.17 - 1.3 - 0.36) / 100) * 40e6));
    expect(SURCOUT_CARTON).toBe(132000);
    expect(EPISODE_EMBALLAGE.prevision.reel(simuler(MEILLEUR, 1))).toBe(132);
    // Sans l'éco-contribution, on trouverait 208 k€ : hors des seuils du calibrage.
    expect(((PRIX.carton - PRIX.ps) / 100) * VOLUME_AN).toBeCloseTo(208000, 0);
  });

  it("les lignes ont un quart de marge en janvier ; un point de cadence coûte 3 000 € par an", () => {
    const lignes = texte(0, "lignes");
    expect(CAPACITE_PS).toBe(9000 * 75 * 0.7);
    expect(MARGE_HIVER).toBeCloseTo(1 - (POTS_SEMAINE * 0.92) / CAPACITE_PS, 9);
    expect(lignes).toContain(taux(MARGE_HIVER, 0));
    expect(taux(MARGE_HIVER, 0)).toBe(taux(0.25, 0));
    expect(lignes).toContain(euros(COUT_POINT_CADENCE));
  });

  it("le contrat de Styrel chiffre une semaine de bobines comme le modèle", () => {
    const contrat = texte(1, "contrat");
    expect(BOBINES.potsSemaine).toBe(Math.round((40e6 / 2 / 52) * 1.08));
    expect(PRIX_SEMAINE_DE_BOBINES).toBeCloseTo((BOBINES.potsSemaine * 1.3) / 100, 6);
    expect(contrat).toContain(euros(PRIX_SEMAINE_DE_BOBINES));
    expect(contrat).toContain(euros(BOBINES.urgenceFixe));
  });

  it("le chiffrage d'Iwan est celui du modèle, sur les fiches comme sur les mesures de l'essai", () => {
    // Sur les fiches : le pot et l'éco-contribution, 0,3 point de rebut, 4 points de cadence.
    const pp =
      ((PRIX.pp + ECO.pp - PRIX.ps - ECO.ps) / 100) * VOLUME_AN +
      (ANNONCE.pp.rebut - REBUT_PS) * VOLUME_AN * COUT_REBUT +
      4 * COUT_POINT_CADENCE;
    expect(coutAnnuelAnnonce("pp")).toBeCloseTo(pp, 6);
    expect(texte(2, "chiffrage", { essai: false })).toContain(kE(coutAnnuelAnnonce("pp")));
    expect(texte(2, "chiffrage", { essai: false })).toContain(kE(coutAnnuelAnnonce("carton")));
    // Avec l'essai : les mesures de la ligne 2, lues sur le tableau de bord de la semaine 4.
    const l = EPISODE_EMBALLAGE.lire([2, 0], 7, JOURS, 4);
    const ctx = EPISODE_EMBALLAGE.contexte(l, [2, 0]);
    expect(texte(2, "chiffrage", ctx)).toContain(kE(coutAnnuel("pp", 7, true)));
    expect(texte(2, "essai", ctx)).toContain(taux(hasard(7).carton.rebut));
    expect(texte(4, "maintenance")).toContain(taux(MARGE_HIVER, 0));
    expect(texte(3, "historique")).toContain(taux(CELTIS.mesure, 0));
    expect(partCeltis(MEILLEUR, GRAINES_DU_BILAN.find((g) => hasard(g).uCeltis < 0.7)!)).toBe(
      CELTIS.mesure,
    );
  });
});

describe("le modèle du changement d'emballage", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[2]!.service).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.service,
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

  it("la ligne fait moins bien que les fiches, surtout en carton", () => {
    for (const g of GRAINES_DU_BILAN) {
      const h = hasard(g);
      expect(h.carton.cadence).toBeGreaterThan(ANNONCE.carton.cadence);
      expect(h.carton.rebut).toBeGreaterThan(ANNONCE.carton.rebut);
      expect(h.pp.cadence).toBeGreaterThanOrEqual(ANNONCE.pp.cadence);
      expect(coutAnnuel("carton", g, true)).toBeGreaterThan(2.5 * coutAnnuel("pp", g, true));
    }
  });

  it("basculer sans essai et d'un coup multiplie les pots mal scellés et les ruptures", () => {
    const sansEssai = [1, 2, 0, 2, 0, 2];
    expect(somme(sansEssai, (t) => t.incidents.length)).toBeGreaterThan(
      3 *
        Math.max(
          1,
          somme(MEILLEUR, (t) => t.incidents.length),
        ),
    );
    expect(somme(sansEssai, (t) => t.ruptures)).toBeGreaterThan(
      5 * somme(MEILLEUR, (t) => t.ruptures),
    );
    expect(simuler(MEILLEUR, 3).serviceMoyen).toBeGreaterThan(0.985);
    expect(simuler(REFLEXE, 3).serviceMoyen).toBeLessThan(0.985);
  });

  it("la méthode tient dans des montants réalistes ; l'attente coûte, sans absurdité", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(-200000);
    expect(attendu(MEILLEUR)).toBeLessThan(-150000);
    expect(attendu(ATTENTISTE)).toBeLessThan(attendu(MEILLEUR) - 100000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-400000);
    expect(simuler(MEILLEUR, 3).trimestre).toBeLessThan(150000);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'essai sur une ligne bat la bascule sans essai, le carton pour le salon et l'attente", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(2);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(30000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(80000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
  });

  it("D2 : commander les bobines au plus juste ; la commande habituelle coûte selon le plan de la semaine 1", () => {
    const r = rejeu(MEILLEUR, D.bobines);
    expect(classement(MEILLEUR, D.bobines)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(80000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    // Qui n'engage rien en semaine 1 a raison de commander comme d'habitude.
    const n = rejeu(ATTENTISTE, D.bobines);
    expect(n[1]!.attendu).toBeCloseTo(n[0]!.attendu, 6);
    expect(commandeDeBobines(avec(MEILLEUR, D.plan, 3))).toEqual([13, 13]);
  });

  it("D3 : le PP bat de loin le carton ; garder le polystyrène reporte la bascule et l'alourdit", () => {
    const r = rejeu(MEILLEUR, D.matiere);
    expect(classement(MEILLEUR, D.matiere)).toEqual([0, 2, 1]);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    // Même avec les bobines de PS déjà commandées, le PP reste meilleur que l'attente.
    expect(classement(ATTENTISTE, D.matiere)[0]).toBe(0);
  });

  it("D3 dépend de D1 : renoncer au carton commandé en semaine 1 coûte un dédit, mais moins que le garder", () => {
    const carton = avec(MEILLEUR, D.plan, 0);
    const r = rejeu(carton, D.matiere);
    expect(classement(carton, D.matiere)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(150000);
  });

  it("D4 : le dossier chiffré est le meilleur en moyenne ; le forfait protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.celtis);
    expect(classement(MEILLEUR, D.celtis)[0]).toBe(2);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(1);
    expect(r[1]!.p10 - r[2]!.p10).toBeGreaterThan(5000);
  });

  it("D4 dépend de D1 : sans essai, le dossier ne vaut plus le forfait", () => {
    const sansEssai = avec(MEILLEUR, D.plan, 1);
    expect(classement(sansEssai, D.celtis)[0]).toBe(1);
    expect(partCeltis(sansEssai, 1)).toBeLessThanOrEqual(CELTIS.fiches);
  });

  it("D5 : basculer par étapes bat la bascule d'un coup, le report et le stock d'avance", () => {
    const r = rejeu(MEILLEUR, D.bascule);
    expect(classement(MEILLEUR, D.bascule)[0]).toBe(3);
    expect(classement(MEILLEUR, D.bascule).at(-1)).toBe(1);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[3]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D6 : annoncer ce qui est mesuré et daté ; l'annonce du carton se paie quand on ne le fait pas", () => {
    const r = rejeu(MEILLEUR, D.salon);
    expect(classement(MEILLEUR, D.salon)).toEqual([2, 1, 0]);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(chanceDAlignement(MEILLEUR)).toBeGreaterThan(chanceDAlignement(avec(MEILLEUR, 5, 1)));
    // D6 dépend de D4 : sans part obtenue de Celtis, Opaline n'a rien à suivre.
    const rien = avec(MEILLEUR, D.celtis, 3);
    expect(GRAINES_DU_BILAN.every((g) => !simuler(rien, g).alignement)).toBe(true);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_EMBALLAGE, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("qualifier, mesurer et déployer par étapes bat le carton pour le salon et l'attente", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(250000);
    expect(methode! - attentiste!).toBeGreaterThan(100000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["offres", "eco"],
      ["contrat"],
      ["essai"],
      ["compteRendu"],
      ["maintenance"],
      ["enseignes"],
    ],
    jours: JOURS,
    diagnostic: "qualifier",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 130,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_EMBALLAGE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout basculé au carton pour le salon, propose de qualifier avant d'annoncer", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_EMBALLAGE.comportements(p, analyser(EPISODE_EMBALLAGE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_EMBALLAGE.axe(c).titre).toBe("Qualifier avant d'annoncer");
  });

  it("à qui a décidé sans enquêter, propose de mesurer sur la ligne avant de choisir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_EMBALLAGE.comportements(p, analyser(EPISODE_EMBALLAGE, p).trimestre);
    expect(EPISODE_EMBALLAGE.axe(c).titre).toBe("Mesurer sur la ligne avant de choisir");
  });

  it("juge la prévision du surcoût du carton à la dizaine de k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_EMBALLAGE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(132)).toBe(1);
    expect(calibrage(160)).toBe(0.6);
    // Oublier l'éco-contribution : 208 k€.
    expect(calibrage(208)).toBe(0);
  });

  it("dit le résultat en coût du changement, et montre l'urgence de qui a attendu", () => {
    expect(EPISODE_EMBALLAGE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/coût estimé/);
    expect(EPISODE_EMBALLAGE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/urgence/);
    expect(EPISODE_EMBALLAGE.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
    expect(EPISODE_EMBALLAGE.recap(simuler(MEILLEUR, 4242), 1, 2)).toHaveLength(3);
  });
});
