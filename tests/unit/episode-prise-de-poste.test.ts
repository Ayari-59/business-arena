import { describe, expect, it } from "vitest";
import {
  ARTISANS_DEPART,
  D,
  IMPREVUS,
  chanceQueChristopheAccepte,
  hasard,
  risqueDeDepart,
  simuler,
} from "../../src/engine/episodes/cent-premiers-jours";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/cent-premiers-jours";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_PRISE_DE_POSTE } from "../../src/pedagogy/episodes/cent-premiers-jours";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les cent premiers jours » enseigne trois choses : comprendre
 * avant de changer évite de casser ce qui marche et montre les vrais
 * problèmes, une première victoire sur ce que l'équipe signale construit le
 * crédit dont tout plan a besoin, et l'adjoint déçu devient un allié ou un
 * opposant selon la place qu'on lui fait. Ces tests verrouillent les
 * classements qui le disent.
 */

const MEILLEUR = [1, 0, 0, 0, 0, 0];
const DIJON = [0, 1, 1, 1, 1, 1];
const ATTENTISTE = [3, 3, 2, 3, 3, 3];
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

describe("le modèle de l'agence de Meyzieu", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Avant toute décision qui agit, les deux chemins vivent la même semaine 1, au crédit près.
    expect(simuler(MEILLEUR, 12).semaines[1]!.artisans).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.artisans,
      0,
    );
    expect(simuler(MEILLEUR, 12).chantierGagne).toBe(simuler(MEILLEUR, 12).chantierGagne);
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

  it("supprimer les bons de la veille fait partir les artisans du matin", () => {
    const sansVeille = avec(MEILLEUR, D.irritant, 1);
    const t = simuler(sansVeille, 3);
    expect(t.veilleSupprimee).toBe(true);
    expect(t.artisansFinal).toBeLessThan(ARTISANS_DEPART - 5);
    expect(simuler(MEILLEUR, 3).artisansFinal).toBeGreaterThan(ARTISANS_DEPART);
  });

  it("recadrer Christophe le fait partir bien plus souvent ; l'associer le garde", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).christophePart).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(DIJON)).toBeGreaterThan(20);
    expect(risqueDeDepart(0.3)).toBe(0);
    expect(risqueDeDepart(1)).toBeGreaterThan(0.8);
  });

  it("garde des indicateurs dans des plages réalistes", () => {
    for (const c of [MEILLEUR, DIJON, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.marge).toBeGreaterThan(12000);
          expect(s!.marge).toBeLessThan(45000);
          expect(s!.artisans).toBeGreaterThan(90);
          expect(s!.artisans).toBeLessThan(175);
          expect(s!.confiance).toBeGreaterThanOrEqual(0.1);
          expect(s!.confiance).toBeLessThanOrEqual(0.95);
        }
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : écouter d'abord est le meilleur départ ; arriver avec son plan, le pire", () => {
    const r = rejeu(MEILLEUR, D.arrivee);
    expect(classement(MEILLEUR, D.arrivee)[0]).toBe(1);
    expect(classement(MEILLEUR, D.arrivee).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : régler l'irritant signalé bat la promesse et l'attente ; les horaires de Dijon coûtent cher", () => {
    const r = rejeu(MEILLEUR, D.irritant);
    expect(classement(MEILLEUR, D.irritant)[0]).toBe(0);
    expect(classement(MEILLEUR, D.irritant).at(-1)).toBe(1);
    expect(r[0]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(15000);
    // La promesse est un pari : quand la direction refuse, l'équipe s'en souvient.
    expect(r[2]!.p10).toBeLessThan(r[3]!.p10);
  });

  it("D3 : confier un vrai rôle à Christophe est le meilleur choix ; le recadrer, le pire", () => {
    expect(classement(MEILLEUR, D.adjoint)[0]).toBe(0);
    expect(classement(MEILLEUR, D.adjoint).at(-1)).toBe(1);
    // Il accepte bien plus souvent quand on l'a écouté en premier que quand on a présenté son plan le lundi.
    expect(chanceQueChristopheAccepte(MEILLEUR)).toBeGreaterThan(
      chanceQueChristopheAccepte(avec(MEILLEUR, D.arrivee, 0)) + 0.4,
    );
  });

  it("D4 : le plan construit avec l'équipe bat l'attente ; le plan de Dijon et les coupes coûtent", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu).toBeLessThan(r[3]!.attendu);
    expect(r[2]!.attendu).toBeLessThan(r[3]!.attendu);
    // Le même plan rapporte bien plus à qui a écouté en semaine 1.
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.plan);
      return x[0]!.attendu - x[3]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain(avec(MEILLEUR, D.arrivee, 3)));
  });

  it("D5 : avec Christophe allié, monter le devis avec lui vaut mieux en moyenne ; casser les prix est plus sûr", () => {
    const r = rejeu(MEILLEUR, D.chantier);
    expect(classement(MEILLEUR, D.chantier)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
  });

  it("D5 : sans Christophe allié, casser les prix devient le meilleur choix", () => {
    const menage = avec(MEILLEUR, D.adjoint, 2);
    expect(classement(menage, D.chantier)[0]).toBe(2);
  });

  it("D6 : présenter un plan partagé bat l'annonce d'une transformation et la promesse chiffrée", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
  });

  it("écouter puis agir avec l'équipe bat nettement le plan de Dijon et l'attentisme, en moyenne", () => {
    const [ecouter, dijon, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(ecouter! - attentiste!).toBeGreaterThan(40000);
    expect(ecouter! - dijon!).toBeGreaterThan(80000);
    expect(attentiste).toBeGreaterThan(dijon!);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [["comptoir", "devis"], ["irritants"], ["equipe"], ["dijon"], ["dorval"], ["bilan"]],
    jours: JOURS,
    diagnostic: "irritants",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 42,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PRISE_DE_POSTE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a appliqué la recette de Dijon, propose de ne pas importer son plan", () => {
    const p = partie(DIJON);
    const c = EPISODE_PRISE_DE_POSTE.comportements(
      p,
      analyser(EPISODE_PRISE_DE_POSTE, p).trimestre,
    );
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PRISE_DE_POSTE.axe(c).titre).toBe("Ni le plan d'ailleurs, ni l'immobilisme");
  });

  it("à qui a décidé sans enquêter, propose de comprendre avant de changer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PRISE_DE_POSTE.comportements(
      p,
      analyser(EPISODE_PRISE_DE_POSTE, p).trimestre,
    );
    expect(EPISODE_PRISE_DE_POSTE.axe(c).titre).toBe("Comprendre avant de changer");
  });

  it("à qui a tout bien fait, ne propose que de vérifier la chance", () => {
    const p = partie(MEILLEUR);
    const t = analyser(EPISODE_PRISE_DE_POSTE, p).trimestre;
    const c = EPISODE_PRISE_DE_POSTE.comportements(
      { ...p, prevision: Math.round(t.semaines[3]!.confiance * 100) },
      t,
    );
    expect(c.every((x) => x.score === 1)).toBe(true);
    expect(EPISODE_PRISE_DE_POSTE.axe(c).titre).toBe("Vérifier que ce n'était pas de la chance");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_PRISE_DE_POSTE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus/);
    expect(EPISODE_PRISE_DE_POSTE.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/en dessous/);
  });
});
