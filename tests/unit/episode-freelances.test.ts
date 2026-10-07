import { describe, expect, it } from "vitest";
import {
  ACCORD,
  COUT_CDI_AN,
  COUT_CDI_SEMAINE,
  COUT_REVIENT_JOUR,
  D,
  DEMANDE,
  DURABLE,
  IMPREVUS,
  INDEMNITE_ACCORD,
  PASSATION,
  SCENARIOS,
  SEUIL_JOURS,
  TJM_ACHAT,
  hasard,
  simuler,
} from "../../src/engine/episodes/freelances-ou-embauches";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_KEROUAL_AN,
  ECART_CDI_FREELANCE,
  ECONOMIE_ACCORD,
  ETAPES,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/freelances-ou-embauches";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_FREELANCES } from "../../src/pedagogy/episodes/freelances-ou-embauches";
import { euros, taux } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee, Source } from "../../src/config/episodes/types";

/**
 * L'épisode « Embaucher ou louer des freelances » enseigne qu'on dimensionne
 * le noyau permanent sur la demande sûre et qu'on couvre l'incertain par de
 * la flexibilité : tout embaucher crée de l'intercontrat si la vague retombe,
 * tout louer coûte la marge, placer des freelances sur une mission sensible
 * coûte le savoir-faire et parfois le poste, et une demande devenue sûre se
 * réinternalise. Ces tests verrouillent les chiffres que les sources donnent
 * et les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 1, 2, 1];
const REFLEXE = [0, 0, 1, 0, 0, 0];
const ATTENTISTE = [3, 3, 1, 3, 3, 3];
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
const texte = (s: Source, ctx: Contexte = {}) =>
  typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
const source = (etape: number, id: string) => ETAPES[etape]!.sources.find((s) => s.id === id)!;

describe("les chiffres que les sources donnent", () => {
  it("le coût d'un CDI, sa journée facturée et le TJM d'achat d'un freelance", () => {
    expect(56000 * 1.45 + 2000).toBe(83200);
    expect(COUT_CDI_AN).toBe(83200);
    expect(COUT_CDI_SEMAINE).toBe(1600);
    expect(COUT_REVIENT_JOUR).toBeCloseTo(83200 / 157.5, 9);
    expect(TJM_ACHAT).toBeCloseTo(770, 9);
    const couts = texte(source(0, "couts"));
    expect(couts).toContain(euros(83200));
    expect(couts).toContain(euros(528));
    expect(couts).toContain(euros(770));
    expect(couts).toContain("157,5 jours facturés sur 210");
  });

  it("le seuil d'intercontrat : 108 jours facturés par an, 1 095 € de marge par semaine d'écart", () => {
    expect(SEUIL_JOURS).toBeCloseTo(83200 / 770, 9);
    expect(Math.floor(SEUIL_JOURS)).toBe(108);
    // Un CDI en mission : 3,5 jours à 950 €, moins 1 600 € ; un freelance : 3,5 × (950 − 770).
    expect(ECART_CDI_FREELANCE).toBeCloseTo(3.5 * 950 - 1600 - 3.5 * (950 - 770), 9);
    expect(ECART_CDI_FREELANCE).toBeCloseTo(1095, 9);
    expect(texte(source(3, "voies"), { ouverts: 3 })).toContain(euros(1095));
    expect(texte(source(5, "departs"))).toContain(euros(1095));
  });

  it("la part durable de la demande vaut 33 ETP sur 38, et le carnet permet de la retrouver", () => {
    expect(10 + 7 + 6 + 4 + 6).toBe(33);
    expect(DURABLE).toBe(33);
    expect(DEMANDE).toBe(38);
    expect(EPISODE_FREELANCES.prevision.reel(simuler(MEILLEUR, 1))).toBe(33);
    const carnet = texte(source(0, "carnet"));
    expect(carnet).toContain("Banque Kervalis, 12 ETP, dont 10 sur la plateforme");
    expect(carnet).toContain("et 2 sur un bon de commande de mise en conformité");
    expect(carnet).toContain("Total : 38 ETP");
    const veille = texte(source(0, "veille"));
    expect(SCENARIOS.reportee.chance + SCENARIOS.maintenue.chance + SCENARIOS.elargie.chance).toBe(
      1,
    );
    for (const p of [0.45, 0.35, 0.2]) expect(veille).toContain(`environ ${taux(p, 0)}`);
  });

  it("l'accord-cadre de Freelancia : 315 € par semaine d'économie, 10 570 € par arrêt", () => {
    expect(INDEMNITE_ACCORD).toBe(4 * 3.5 * 755);
    expect(INDEMNITE_ACCORD).toBe(10570);
    expect(ECONOMIE_ACCORD).toBeCloseTo(315 * (ACCORD.jusqua - ACCORD.debut + 1), 6);
    const accord = texte(source(2, "accord"));
    expect(accord).toContain(euros(10570));
    expect(accord).toContain(euros(315));
    expect(accord).toContain(euros(11000));
  });

  it("la passation et le coût d'un senior de Kéroual sont justes", () => {
    expect(PASSATION).toBe(3 * 2 * 950);
    expect(texte(source(1, "kervalis"))).toContain(euros(5700));
    expect(COUT_KEROUAL_AN).toBe(63000 * 1.45 + 2000);
    expect(texte(source(4, "occupation"))).toContain(euros(93350));
  });
});

describe("le modèle de la practice", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).semaines[1]!.demande).toBe(
      simuler(REFLEXE, 12).semaines[1]!.demande,
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

  it("les trois issues du vote tombent sur les trente tirages", () => {
    const issues = new Set(GRAINES_DU_BILAN.map((g) => hasard(g).scenario));
    expect([...issues].sort()).toEqual(["elargie", "maintenue", "reportee"]);
  });

  it("huit CDI d'un coup laissent de l'intercontrat quand la vague retombe", () => {
    const intercontrat = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g, JOURS).intercontratProjete));
    expect(intercontrat(REFLEXE)).toBeGreaterThan(400);
    expect(intercontrat(MEILLEUR)).toBeLessThan(150);
  });

  it("Kervalis recrute en direct les freelances qu'on lui place, selon le hasard", () => {
    const demarches = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).demarches > 0).length;
    const exposes = [...MEILLEUR];
    exposes[D.placement] = 0;
    expect(demarches(exposes)).toBeGreaterThan(3);
    expect(demarches(exposes)).toBeLessThan(27);
    expect(demarches(MEILLEUR)).toBe(0);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : trois CDI pour la part durable ; huit d'un coup coûtent cher", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
  });

  it("D2 : des consultants d'Atlas chez Kervalis ; la sous-traitance est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.placement);
    expect(classement(MEILLEUR, D.placement)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(50000);
    expect(plusSure(MEILLEUR, D.placement)).toBe(2);
  });

  it("D3 : rester au contrat standard ; sans aucune embauche, s'engager sur trois freelances devient le meilleur choix", () => {
    const r = rejeu(MEILLEUR, D.accord);
    expect(classement(MEILLEUR, D.accord)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    const sansEmbauche = [2, 1, 1, 1, 2, 1];
    expect(classement(sansEmbauche, D.accord)[0]).toBe(2);
  });

  it("D4 : une demande devenue sûre se réinternalise ; avec huit recrues en route, non", () => {
    const r = rejeu(MEILLEUR, D.extension);
    expect(classement(MEILLEUR, D.extension)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    const huitEnRoute = [0, 1, 1, 1, 2, 1];
    expect(classement(huitEnRoute, D.extension)[0]).toBe(0);
  });

  it("D5 : s'informer auprès des clients avant d'embaucher ; ne rien faire est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.keroual);
    expect(classement(MEILLEUR, D.keroual)[0]).toBe(2);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(80000);
    expect(plusSure(MEILLEUR, D.keroual)).toBe(3);
  });

  it("D6 : remplacer les départs, garder les freelances sur la vague", () => {
    const r = rejeu(MEILLEUR, D.comite);
    expect(classement(MEILLEUR, D.comite)[0]).toBe(1);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(60000);
  });

  it("dimensionner sur la demande sûre bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(attentiste! + 150000);
    expect(methode).toBeGreaterThan(reflexe! + 150000);
    expect(attendu(ATTENTISTE)).toBe(attentiste);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et la bonne méthode n'en contient aucun", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_FREELANCES, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      const defendable = option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000;
      expect(option.qualite, `réflexe [${d}, ${o}]`).toBeLessThan(0.7);
      expect(defendable).toBe(false);
    }
    const bonneMethode: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonneMethode[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["carnet", "veille", "couts"],
      ["kervalis"],
      ["accord"],
      ["commande"],
      ["occupation"],
      ["departs"],
    ],
    jours: JOURS,
    diagnostic: "durable",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 33,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_FREELANCES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a embauché parce que la demande était là, propose d'embaucher sur la demande sûre", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_FREELANCES.comportements(p, analyser(EPISODE_FREELANCES, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_FREELANCES.axe(c).titre).toBe("Embaucher sur la demande sûre, louer le reste");
  });

  it("à qui a décidé sans enquêter, propose de compter les contrats avant les gens", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_FREELANCES.comportements(p, analyser(EPISODE_FREELANCES, p).trimestre);
    expect(EPISODE_FREELANCES.axe(c).titre).toBe("Compter les contrats avant les gens");
  });

  it("calibre la prévision de la part durable : juste à 0,5 ETP, proche à 2", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_FREELANCES.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(33)).toBe(1);
    expect(score(35)).toBe(0.6); // le bon de commande de conformité de Kervalis compté comme durable
    expect(score(30)).toBe(0); // l'équipe actuelle prise pour la demande sûre
    expect(score(38)).toBe(0); // toute la demande
  });

  it("dit la marge de l'année et celle du trimestre", () => {
    expect(EPISODE_FREELANCES.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /de marge attendue sur l'année, dont .* au trimestre/,
    );
  });
});
