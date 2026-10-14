import { describe, expect, it } from "vitest";
import {
  CHEVAUCHEMENT_12H,
  CHEVAUCHEMENT_7H30,
  COEXISTENCE,
  D,
  ECONOMIE_EUROS,
  ECONOMIE_HEURES,
  EXPERTISE,
  IMPREVUS,
  RELEVES_12H,
  RELEVES_7H30,
  SURCOUT_VACANCE,
  TAUX_HORAIRE,
  TAUX_INTERIM,
  TRAMES,
  exces,
  hasard,
  simuler,
} from "../../src/engine/episodes/postes-de-douze-heures";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/postes-de-douze-heures";
import { euros } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_DOUZE_HEURES } from "../../src/pedagogy/episodes/postes-de-douze-heures";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Passer en douze heures » enseigne qu'une réorganisation des
 * temps de travail se juge sur ses effets mesurés : le poste de 12 heures
 * économise une relève et attire des candidats, mais la fatigue de fin de
 * poste fait monter les erreurs selon la trame et l'équipe ; une
 * expérimentation sur un secteur, avec des indicateurs et le CSE consulté
 * avant, révèle ces effets et permet de corriger ; l'imposer ou la refuser par
 * principe coûte. Ces tests verrouillent les chiffres des sources et les
 * classements qui le disent.
 */

const MEILLEUR = [1, 1, 0, 1, 1, 1];
const REFLEXE = [0, 0, 1, 3, 2, 0];
const ATTENTISTE = [3, 0, 1, 0, 0, 3];
/** Toute l'unité en 12 heures d'emblée, sans indicateurs, le reste de la méthode inchangé. */
const UNITE = [2, 1, 0, 1, 1, 1];
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

const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les relèves des deux trames donnent les heures de chevauchement de la prévision", () => {
    const trames = texte(0, "trames");
    for (const r of [...RELEVES_7H30, ...RELEVES_12H]) {
      expect(trames).toContain(
        `à ${r.heure}, ${r.minutes} minutes de transmissions, ${r.arrivent} soignants`,
      );
    }
    // 7 × (15 min × 7 + 30 min × 5 + 15 min × 3) = 35 h ; 7 × (15 min × 7 + 15 min × 3) = 17,5 h.
    expect(CHEVAUCHEMENT_7H30).toBe(35);
    expect(CHEVAUCHEMENT_12H).toBe(17.5);
    expect(ECONOMIE_HEURES).toBe(17.5);
    expect(EPISODE_DOUZE_HEURES.prevision.reel(simuler(MEILLEUR, 1))).toBe(17.5);
  });

  it("le prix de l'heure d'intérim et du poste vacant sont ceux du modèle", () => {
    const trames = texte(0, "trames");
    expect(trames).toContain(euros(TAUX_INTERIM));
    expect(trames).toContain(euros(TAUX_HORAIRE));
    expect(TAUX_INTERIM).toBe(2 * TAUX_HORAIRE);
    // Un poste vacant : 35 heures payées 64 € au lieu de 32 €.
    expect(SURCOUT_VACANCE).toBe(1120);
    const rh = ETAPES[0]!.messages({}).find((m) => m.de === "Térence Mabru")!;
    expect(rh.texte).toContain(euros(SURCOUT_VACANCE));
    // L'économie des relèves vaut, en intérim évité, autant qu'un poste vacant pourvu.
    expect(ECONOMIE_EUROS).toBe(17.5 * 64);
  });

  it("l'excès d'erreurs mesuré en semaine 7 est celui que la trame donne à l'équipe", () => {
    for (const g of [3, 8, 21]) {
      const l = EPISODE_DOUZE_HEURES.lire(MEILLEUR.slice(0, 3), g, JOURS, 7);
      const ctx = EPISODE_DOUZE_HEURES.contexte(l, MEILLEUR.slice(0, 3));
      const attenduPct = Math.round(exces(hasard(g).s, TRAMES[1]!) * 100);
      expect(ctx.excesPct).toBe(`${attenduPct} %`);
      expect(texte(3, "heures", ctx)).toContain(`${attenduPct} % de plus après la dixième heure`);
    }
  });

  it("le coût des deux rythmes, de l'expertise, sont chiffrés comme dans le modèle", () => {
    expect(texte(4, "planning", { douze: 0.5 })).toContain(euros(COEXISTENCE));
    expect(texte(4, "planning", { douze: 0.5 })).toContain("il en resterait 30 %");
    expect(texte(2, "precedents")).toContain(euros(EXPERTISE));
  });
});

describe("le modèle de l'unité", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).semaines[2]!.absenteisme).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.absenteisme,
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

  it("imposer fait partir l'infirmière opposée, refuser fait partir la volontaire", () => {
    const departs = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => unknown) =>
      GRAINES_DU_BILAN.filter((g) => f(simuler(c, g)) !== null).length;
    expect(departs(MEILLEUR, (t) => t.departOpposee)).toBe(0);
    expect(departs(MEILLEUR, (t) => t.departVolontaire)).toBe(0);
    expect(departs(REFLEXE, (t) => t.departOpposee)).toBeGreaterThan(10);
    expect(departs(ATTENTISTE, (t) => t.departVolontaire)).toBeGreaterThan(10);
  });

  it("le CSE consulté avant, avec des données, entre rarement en conflit ; consulté après, souvent", () => {
    const conflits = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).conflit !== null).length;
    expect(conflits(MEILLEUR)).toBeLessThanOrEqual(6);
    expect(conflits([1, 1, 1, 1, 1, 1])).toBeGreaterThan(conflits(MEILLEUR) + 5);
    expect(conflits(REFLEXE)).toBeGreaterThan(18);
  });

  it("garde des chiffres réalistes", () => {
    for (const c of [MEILLEUR, ATTENTISTE, REFLEXE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.absenteismeMoyen).toBeGreaterThan(0.09);
        expect(t.absenteismeMoyen).toBeLessThan(0.2);
        expect(t.eiPourMille).toBeGreaterThan(2);
        expect(t.eiPourMille).toBeLessThan(6);
        for (const s of t.semaines.slice(1)) {
          expect(s!.ei).toBeLessThan(Math.max(...EPISODE_DOUZE_HEURES.courbe.graduations));
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : expérimenter sur un secteur bat généraliser, imposer à l'unité et refuser", () => {
    const r = rejeu(MEILLEUR, D.projet);
    expect(classement(MEILLEUR, D.projet)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(25000);
  });

  it("D2 : trois postes et une pause protégée rapportent le plus ; deux postes au plus est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.trame);
    expect(classement(MEILLEUR, D.trame)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.trame)).toBe(2);
    expect(r[2]!.p10).toBeGreaterThan(r[1]!.p10);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    // Sans indicateurs pour corriger à temps, la trame des volontaires coûte bien plus cher.
    const sans = rejeu(UNITE, D.trame);
    expect(sans[1]!.attendu - sans[0]!.attendu).toBeGreaterThan(15000);
  });

  it("D3 : consulter le CSE avant, avec des chiffres, vaut surtout quand on a des chiffres", () => {
    const r = rejeu(MEILLEUR, D.cse);
    expect(classement(MEILLEUR, D.cse)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    // Sans indicateurs (toute l'unité d'emblée), consulter avant ne vaut guère mieux qu'attendre janvier.
    const sans = rejeu(UNITE, D.cse);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(
      sans[0]!.attendu - sans[2]!.attendu + 10000,
    );
  });

  it("D4 : corriger au vu des chiffres paie, si on les a ; arrêter ou étendre coûte", () => {
    const r = rejeu(MEILLEUR, D.chiffres);
    expect(classement(MEILLEUR, D.chiffres)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(1500);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    // Sans indicateurs, « corriger » ne corrige rien : continuer vaut autant.
    const sans = rejeu(UNITE, D.chiffres);
    expect(sans[0]!.attendu).toBeGreaterThanOrEqual(sans[1]!.attendu);
  });

  it("D5 : aligner les horaires des deux rythmes bat le chacun-pour-soi, l'imposition et le retour en arrière", () => {
    const c = classement(MEILLEUR, D.rythmes);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    const r = rejeu(MEILLEUR, D.rythmes);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D6 : décider sur un bilan chiffré bat généraliser, revenir en arrière ou prolonger", () => {
    const r = rejeu(MEILLEUR, D.janvier);
    expect(classement(MEILLEUR, D.janvier)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("expérimenter et mesurer bat le réflexe et l'attentisme, en moyenne", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon).toBeGreaterThan(0);
    expect(bon! - attentiste!).toBeGreaterThan(20000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1]!.chemin).toEqual(REFLEXE);
    expect(REFERENCES[2]!.chemin).toEqual(ATTENTISTE);
    expect([...EPISODE_DOUZE_HEURES.neutre]).toEqual(ATTENTISTE);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et aucun n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_DOUZE_HEURES, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const bonne =
        option.qualite >= 0.7 ||
        (option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000);
      expect(bonne, `D${d + 1} option ${o}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["trames", "etudes"],
      ["nuits"],
      ["precedents"],
      ["heures"],
      ["planning"],
      ["bilan"],
    ],
    jours: JOURS,
    diagnostic: "effets",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 17.5,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DOUZE_HEURES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tranché par principe, propose d'expérimenter", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DOUZE_HEURES.comportements(p, analyser(EPISODE_DOUZE_HEURES, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DOUZE_HEURES.axe(c).titre).toBe("Ni imposer, ni refuser : expérimenter");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce que les 12 heures font vraiment", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DOUZE_HEURES.comportements(p, analyser(EPISODE_DOUZE_HEURES, p).trimestre);
    expect(EPISODE_DOUZE_HEURES.axe(c).titre).toBe("Chercher ce que les 12 heures font vraiment");
  });

  it("juge la prévision sur les 17,5 heures de relève économisées", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    expect(EPISODE_DOUZE_HEURES.comportements(partie(MEILLEUR), t)[3]!.score).toBe(1);
    // Compter les deux équipes à chaque relève double le chiffre : 35 heures, loin du compte.
    const double = EPISODE_DOUZE_HEURES.comportements(
      partie(MEILLEUR, { prevision: 35, confiance: 80 }),
      t,
    )[3]!;
    expect(double.score).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_DOUZE_HEURES.bilan.titre(simuler(MEILLEUR, 11))).toMatch(/sous le budget/);
    expect(EPISODE_DOUZE_HEURES.bilan.titre(simuler(REFLEXE, 11))).toMatch(/au-delà du budget/);
  });
});
