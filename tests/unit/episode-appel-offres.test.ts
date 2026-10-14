import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  PLANCHER,
  chanceQueVauclairReste,
  hasard,
  qualite,
  simuler,
} from "../../src/engine/episodes/appel-d-offres";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/appel-d-offres";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_APPEL_OFFRES } from "../../src/pedagogy/episodes/appel-d-offres";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'appel d'offres » enseigne trois choses : répondre à tout
 * dilue l'effort et fait perdre le dossier qui compte, la grille de notation
 * dit où les points coûtent le moins (la valeur technique, pas la remise), et
 * un marché gagné sous le plancher coûte toute sa durée. Ces tests
 * verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 2, 2, 0, 0, 0];
const ATTENTISTE = [0, 0, 0, 2, 2, 3];
const TOUT = [0, 1, 1, 1, 1, 1];
const PRUDENT = [1, 1, 1, 2, 1, 1];
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
const gagnes = (chemin: readonly number[]) =>
  GRAINES_DU_BILAN.filter((g) => simuler(chemin, g).balmes.gagne).length;

describe("le modèle de l'équipe grands comptes", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    simuler(REFLEXE, 12);
    expect(hasard(12).gabriac).toEqual(hasard(12).gabriac);
    expect(simuler(MEILLEUR, 12).semaines[1]!.charge).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.charge - 3 / 20,
      6,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const imprevus = hasard(g).imprevus;
      expect(imprevus.length).toBeGreaterThanOrEqual(1);
      expect(imprevus.length).toBeLessThanOrEqual(2);
      for (const i of imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("répondre à tout surcharge l'équipe, laisse les devis en attente et fait perdre Balmes", () => {
    const tout = simuler(TOUT, 3);
    const choisi = simuler(MEILLEUR, 3);
    expect(tout.semaines[3]!.charge).toBeGreaterThan(1.1);
    expect(choisi.semaines[3]!.charge).toBeLessThan(1);
    expect(tout.devisMax).toBeGreaterThan(choisi.devisMax + 10);
    expect(gagnes(MEILLEUR)).toBeGreaterThan(gagnes(TOUT) + 10);
    expect(qualite(0)).toBe(1);
    expect(qualite(20)).toBe(0.5);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of [1, 9, 23]) {
        const t = simuler(c, g);
        for (const s of t.semaines.slice(1)) {
          expect(s!.charge).toBeGreaterThan(0.5);
          expect(s!.charge).toBeLessThan(1.8);
          expect(s!.devis).toBeLessThan(60);
        }
        expect(t.balmes.technique).toBeGreaterThan(30);
        expect(t.balmes.technique).toBeLessThanOrEqual(60);
        expect(Math.abs(t.objectif)).toBeLessThan(350000);
      }
    }
  });

  it("gagné à coups de remises, Balmes passe sous le plancher", () => {
    const g = GRAINES_DU_BILAN.find((x) => simuler(REFLEXE, x).balmes.gagne)!;
    expect(simuler(REFLEXE, g).balmes.marge).toBeLessThan(0);
    expect(simuler(MEILLEUR, 3).balmes.marge).toBeGreaterThan(PLANCHER);
  });

  it("Vauclair se lasse quand l'équipe l'a négligé", () => {
    expect(chanceQueVauclairReste(0, 10)).toBe(1);
    expect(chanceQueVauclairReste(1, 0)).toBeGreaterThan(chanceQueVauclairReste(1, 8));
    expect(chanceQueVauclairReste(2, 0)).toBeLessThan(chanceQueVauclairReste(1, 0));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : qualifier les consultations bat de loin répondre à tout ; tout miser sur Balmes est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.tri);
    expect(classement(MEILLEUR, D.tri)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(2);
  });

  it("D2 : poser des questions écrites bat le silence et l'appel en direct", () => {
    const r = rejeu(MEILLEUR, D.questions);
    expect(classement(MEILLEUR, D.questions)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(30000);
    expect(r[3]!.attendu).toBeLessThan(r[1]!.attendu);
  });

  it("D3 : le mémoire critère par critère gagne quand l'équipe a du temps ; débordée, le cabinet fait mieux", () => {
    const c = classement(MEILLEUR, D.memoire);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
    const deborde = rejeu(TOUT, D.memoire);
    expect(deborde[3]!.attendu).toBeGreaterThan(deborde[1]!.attendu);
  });

  it("D4 : le tarif défendu par l'offre technique paie le plus ; le plancher est plus sûr ; la remise de 6 % est la pire", () => {
    const r = rejeu(MEILLEUR, D.prix);
    const c = classement(MEILLEUR, D.prix);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(3);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(60000);
  });

  it("D5 : échanger une concession contre une contrepartie bat la remise ; la remise ne se rattrape que si le prix avait de la marge", () => {
    const r = rejeu(MEILLEUR, D.negociation);
    expect(classement(MEILLEUR, D.negociation)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    const prudent = rejeu(PRUDENT, D.negociation);
    const ecart = (x: typeof r) => x[1]!.attendu - x[0]!.attendu;
    expect(ecart(prudent)).toBeLessThan(ecart(r) - 40000);
  });

  it("D6 : la revue d'affaires bat l'alignement et le laisser-faire", () => {
    const r = rejeu(MEILLEUR, D.vauclair);
    expect(classement(MEILLEUR, D.vauclair)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
  });

  it("qualifier, lire la grille et tenir son prix bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode!).toBeGreaterThan(0);
    expect(methode! - attentiste!).toBeGreaterThan(60000);
    expect(methode! - reflexe!).toBeGreaterThan(60000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["grille", "charge"], ["dce"], ["criteres"], ["plancher"], ["marge"], ["devis"]],
    jours: JOURS,
    diagnostic: "grille",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 90,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_APPEL_OFFRES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a répondu à tout et baissé ses prix, propose de choisir ses combats", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_APPEL_OFFRES.comportements(p, analyser(EPISODE_APPEL_OFFRES, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_APPEL_OFFRES.axe(c).titre).toBe("Choisir ses combats, et tenir son prix");
  });

  it("à qui a décidé sans enquêter, propose de lire la grille et de compter ses jours", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_APPEL_OFFRES.comportements(p, analyser(EPISODE_APPEL_OFFRES, p).trimestre);
    expect(EPISODE_APPEL_OFFRES.axe(c).titre).toBe("Lire la grille et compter ses jours");
  });

  it("dit le résultat en écart à l'objectif", () => {
    const gagne = GRAINES_DU_BILAN.find((g) => simuler(MEILLEUR, g).balmes.gagne)!;
    expect(EPISODE_APPEL_OFFRES.bilan.titre(simuler(MEILLEUR, gagne))).toMatch(
      /au-dessus de l'objectif/,
    );
    expect(EPISODE_APPEL_OFFRES.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/sous l'objectif/);
  });
});
