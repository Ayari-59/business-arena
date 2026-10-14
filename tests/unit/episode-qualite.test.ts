import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  chanceQueLeFournisseurPaie,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/reclamation-qui-enfle";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/reclamation-qui-enfle";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_QUALITE } from "../../src/pedagogy/episodes/reclamation-qui-enfle";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La réclamation qui enfle » enseigne trois choses : remplacer à
 * chaque plainte nourrit le flux des pannes tant qu'on ne sait pas quel lot
 * casse ; une action ciblée (bloquer le lot, rappeler les usages intensifs)
 * coûte tout de suite et rapporte ensuite ; la franchise envers les clients
 * et les preuves face au fournisseur paient. Ces tests verrouillent les
 * classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 0, 0, 0];
const REFLEXE = [0, 1, 2, 3, 2, 1];
const ATTENTISTE = [3, 3, 3, 2, 1, 3];
/** Le même chemin, sans avoir tracé le lot en semaine 1. */
const SANS_TRACE = [3, 0, 0, 0, 0, 0];
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

describe("le modèle du service qualité", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.retours).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.retours,
      6,
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

  it("remplacer sans tracer fait enfler les retours ; bloquer le lot puis rappeler les fait baisser", () => {
    const remplacer = [0, 0, 3, 2, 1, 3];
    const enSemaine = (c: readonly number[], w: number) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).semaines[w]!.retours));
    expect(enSemaine(remplacer, 6)).toBeGreaterThan(enSemaine(remplacer, 1) + 1.2);
    expect(enSemaine(ATTENTISTE, 6)).toBeGreaterThan(enSemaine(ATTENTISTE, 1) + 1.5);
    expect(enSemaine(MEILLEUR, 13)).toBeLessThan(3.5);
  });

  it("Pélissier part bien plus souvent quand on le fait attendre", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).pelissierPart).length;
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(2);
    expect(departs(ATTENTISTE)).toBeGreaterThan(20);
    expect(risqueDeDepart(0.8)).toBe(0);
    expect(risqueDeDepart(0.1)).toBeGreaterThan(0.8);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g);
        for (const s of t.semaines.slice(1)) {
          expect(s!.retours).toBeGreaterThan(0);
          expect(s!.retours).toBeLessThan(25);
          expect(s!.satisfaction).toBeGreaterThanOrEqual(0.35);
          expect(s!.satisfaction).toBeLessThanOrEqual(0.95);
        }
        expect(t.objectif).toBeGreaterThan(-110000);
        expect(t.objectif).toBeLessThan(55000);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : tracer et bloquer le lot est de loin le meilleur choix ; remplacer ou tout retirer ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.retours);
    expect(classement(MEILLEUR, D.retours)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(25000);
  });

  it("D2 : échanger les appareils de Pélissier paie quand le lot est tracé ; sinon, le haut de gamme vaut mieux", () => {
    expect(classement(MEILLEUR, D.pelissier)[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.pelissier);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(classement(SANS_TRACE, D.pelissier)[0]).toBe(2);
  });

  it("D3 : le dossier tracé est le meilleur en moyenne, l'accord amiable le plus sûr ; sans trace, l'amiable l'emporte", () => {
    expect(chanceQueLeFournisseurPaie(MEILLEUR)).toBeGreaterThan(
      chanceQueLeFournisseurPaie(SANS_TRACE),
    );
    const r = rejeu(MEILLEUR, D.fournisseur);
    expect(classement(MEILLEUR, D.fournisseur)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[2]!.p10).toBeGreaterThan(r[0]!.p10);
    expect(classement(SANS_TRACE, D.fournisseur)[0]).toBe(2);
  });

  it("D4 : le rappel ciblé bat l'absence de rappel, le rappel du lot entier et le rappel général", () => {
    const c = classement(MEILLEUR, D.rappel);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(3);
    const r = rejeu(MEILLEUR, D.rappel);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(2500);
  });

  it("D5 : informer franchement les acheteurs du lot bat le silence, les bons d'achat et le déni", () => {
    const r = rejeu(MEILLEUR, D.information);
    expect(classement(MEILLEUR, D.information)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(
      2500,
    );
  });

  it("D6 : contrôler le lot corrigé bat la mise en rayon directe, la plus risquée", () => {
    const r = rejeu(MEILLEUR, D.nouveauLot);
    expect(classement(MEILLEUR, D.nouveauLot)[0]).toBe(0);
    expect(Math.min(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
  });

  it("trouver le lot puis agir bat nettement le geste à chaque plainte et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(30000);
    expect(reflexe!).toBeGreaterThan(attentiste!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["series", "atelier"],
      ["parcPelissier"],
      ["contrat"],
      ["ventes"],
      ["groupe"],
      ["essais"],
    ],
    jours: JOURS,
    diagnostic: "lot",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 8,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_QUALITE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a fait un geste à chaque plainte, propose de traiter la cause", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_QUALITE.comportements(p, analyser(EPISODE_QUALITE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_QUALITE.axe(c).titre).toBe("Traiter la cause, pas chaque plainte");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qui casse", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_QUALITE.comportements(p, analyser(EPISODE_QUALITE, p).trimestre);
    expect(EPISODE_QUALITE.axe(c).titre).toBe("Chercher ce qui casse avant de remplacer");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_QUALITE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_QUALITE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });

  it("la réponse de Vantrel et celle de Pélissier arrivent à leur semaine", () => {
    const e = EPISODE_QUALITE.evenements(MEILLEUR, 11, 5, 8);
    expect(e.lies.some((m) => m.heure === "sem. 5" && m.de === "Hervé Lacombe")).toBe(true);
    expect(e.lies.some((m) => m.heure === "sem. 7" && m.de === "Serge Pélissier")).toBe(true);
    const controle = EPISODE_QUALITE.reactions(D.nouveauLot, 0, 11);
    expect(controle).toHaveLength(1);
    expect(EPISODE_QUALITE.reactions(D.nouveauLot, 1, 11)).toBeNull();
  });
});
