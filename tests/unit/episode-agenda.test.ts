import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceOffre,
  hasard,
  risqueDArret,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/agenda-qui-deborde";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/agenda-qui-deborde";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_AGENDA } from "../../src/pedagogy/episodes/agenda-qui-deborde";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'agenda qui déborde » enseigne trois choses : ce qui passe par
 * le directeur attend, et seule une délégation cadrée en retire durablement ;
 * l'important sans temps protégé devient une crise ; travailler plus se paie
 * en fatigue, et la fatigue en erreurs. Ces tests verrouillent les
 * classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 2, 1, 1];
const REFLEXE = [0, 1, 2, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
/** Sans délégation, mais avec de bonnes décisions ensuite. */
const SANS_DELEGUER = [3, 0, 1, 0, 1, 1];
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

describe("le modèle de l'agence", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    // Deux chemins qui ne diffèrent qu'en semaine 11 vivent les mêmes dix premières semaines.
    const a = simuler([1, 0, 1, 2, 1, 1], 12);
    const b = simuler([1, 0, 1, 2, 1, 3], 12);
    expect(a.semaines.slice(0, 11)).toEqual(b.semaines.slice(0, 11));
    expect(simuler(REFLEXE, 12).semaines[5]!.ca).not.toBe(a.semaines[5]!.ca);
    expect(hasard(12).talentTariq).toBe(hasard(12).talentTariq);
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

  it("déléguer avec un cadre vide le bureau et rend des heures ; attendre laisse la pile monter", () => {
    const bon = simuler(MEILLEUR, 3);
    const attente = simuler(ATTENTISTE, 3);
    expect(bon.fileFinale).toBeLessThanOrEqual(25);
    expect(bon.heuresFinales).toBeLessThanOrEqual(50);
    expect(attente.fileFinale).toBeGreaterThan(90);
    expect(attente.heuresFinales).toBeGreaterThanOrEqual(60);
    // Sans temps protégé, le drive devient une crise et ouvre en retard.
    expect(attente.crise).toBe(true);
    expect(attente.ouverture ?? 99).toBeGreaterThan(9);
  });

  it("travailler plus fatigue, et la fatigue arrête le directeur et multiplie les erreurs", () => {
    const arrets = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).maximeArrete).length;
    const erreurs = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).erreursTotales));
    expect(arrets(MEILLEUR)).toBe(0);
    expect(arrets(REFLEXE)).toBeGreaterThan(8);
    expect(erreurs(REFLEXE)).toBeGreaterThan(erreurs(MEILLEUR) * 1.3);
    expect(risqueDArret(0.7)).toBe(0);
    expect(risqueDArret(1)).toBeGreaterThan(0.4);
  });

  it("Gwenaëlle part plus souvent quand on lui reprend tout, et moins quand on lui confie un cadre", () => {
    expect(risqueDeDepart(0.5, [1, 0, 1, 2, 0, 1], true)).toBeGreaterThan(
      risqueDeDepart(0.5, MEILLEUR, true) + 0.2,
    );
    expect(risqueDeDepart(0.5, MEILLEUR, true)).toBeLessThan(
      risqueDeDepart(0.5, ATTENTISTE, false),
    );
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).gwenaellePart).length;
    expect(departs(REFLEXE)).toBeGreaterThan(departs(MEILLEUR) + 5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : déléguer par paliers avec un cadre bat travailler plus et tout lâcher d'un coup", () => {
    const r = rejeu(MEILLEUR, D.delegation);
    expect(classement(MEILLEUR, D.delegation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
  });

  it("D2 : alléger les réunions est le meilleur choix ; le point de contrôle quotidien le pire", () => {
    const c = classement(MEILLEUR, D.reunions);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
  });

  it("D3 : confier le drive à Tariq vaut le plus en moyenne, le piloter soi-même est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.drive);
    expect(classement(MEILLEUR, D.drive)[0]).toBe(1);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeLessThan(3000);
    // Le soir et le week-end, ou le laisser aux urgences, coûtent nettement plus.
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
  });

  it("D3 : sans délégation, le temps protégé se paie en dossiers qui attendent", () => {
    const avec = rejeu(MEILLEUR, D.drive);
    const sans = rejeu(SANS_DELEGUER, D.drive);
    const ecartAvec = avec[1]!.attendu - avec[0]!.attendu;
    const ecartSans = sans[1]!.attendu - sans[0]!.attendu;
    expect(ecartSans).toBeGreaterThan(ecartAvec + 10000);
  });

  it("D4 : confier les entretiens aux adjoints préparés bat la journée expédiée et le report", () => {
    const c = classement(MEILLEUR, D.entretiens);
    expect(c[0]).toBe(2);
    expect(c.indexOf(1)).toBeGreaterThan(c.indexOf(0));
    expect(c.indexOf(3)).toBeGreaterThan(c.indexOf(0));
  });

  it("D5 : chercher la cause et ajuster le cadre bat tout reprendre, qui est le pire", () => {
    const c = classement(MEILLEUR, D.erreur);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("D6 : confier l'offre à Gwenaëlle gagne, à condition qu'elle ait appris à décider", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(chanceOffre(1, 0.5, 0.9, false)).toBeGreaterThan(chanceOffre(0, 0.5, 0.9, false));
    expect(chanceOffre(1, 0.5, 0.3, false)).toBeLessThan(chanceOffre(1, 0.5, 0.9, false) - 0.3);
    expect(chanceOffre(1, 0.5, 0.9, true)).toBeLessThan(chanceOffre(0, 0.5, 0.9, false));
  });

  it("déléguer avec un cadre bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(50000);
    expect(bonne! - attentiste!).toBeGreaterThan(80000);
  });
});

describe("le bilan de l'épisode", () => {
  it("ne compte pas comme tenus des entretiens expédiés en une journée", () => {
    const tuile = (c: readonly number[]) =>
      EPISODE_AGENDA.bilan.tuiles(simuler(c, 11)).find((t) => t.nom === "Entretiens annuels")!;
    const expedies = [...MEILLEUR];
    expedies[D.entretiens] = 1;
    expect(tuile(expedies).tenu).toBe(false);
    expect(tuile(expedies).aide).toMatch(/expédiés/);
  });

  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["agenda", "attente"], ["reunions"], ["reste"], ["anciens"], ["cause"], ["marche"]],
    jours: JOURS,
    diagnostic: "goulot",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 55,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_AGENDA, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a travaillé plus et tout contrôlé, propose de déléguer avec un cadre", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_AGENDA.comportements(p, analyser(EPISODE_AGENDA, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_AGENDA.axe(c).titre).toBe("Déléguer avec un cadre plutôt que travailler plus");
  });

  it("à qui a décidé sans enquêter, propose de mesurer où va son temps", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_AGENDA.comportements(p, analyser(EPISODE_AGENDA, p).trimestre);
    expect(EPISODE_AGENDA.axe(c).titre).toBe("Mesurer où va votre temps");
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_AGENDA.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_AGENDA.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous le budget/);
  });
});
