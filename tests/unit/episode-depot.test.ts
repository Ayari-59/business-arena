import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  fournisseurTient,
  hasard,
  risqueDePerdreLeClient,
  simuler,
} from "../../src/engine/episodes/depot-qui-deborde";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/depot-qui-deborde";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_DEPOT } from "../../src/pedagogy/episodes/depot-qui-deborde";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le dépôt qui déborde » enseigne trois choses : le stock doit
 * être là où sont les ventes (classe ABC) plutôt qu'augmenté partout, un
 * inventaire faux fait rompre ce qu'on croit avoir, et commander plus quand
 * on rompt — au fournisseur en retard, pour suivre les agences, « pour être
 * prêts » — amplifie les ruptures puis le surstock dans un dépôt déjà plein.
 * Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 1, 1, 1];
const REFLEXE = [0, 3, 0, 0, 2, 0];
const ATTENTISTE = [3, 2, 3, 3, 0, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) =>
  chemin.map((x, i) => (i === d ? o : x));

describe("le modèle du dépôt", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.service).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.service,
      6,
    );
    expect(hasard(12)).toBe(hasard(12));
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

  it("le bon chemin remonte le service et vide les allées ; l'attente laisse le service filer", () => {
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    const attente = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g));
    expect(moyenne(bon.map((t) => t.serviceFin))).toBeGreaterThan(0.95);
    expect(moyenne(attente.map((t) => t.serviceFin))).toBeLessThan(0.85);
    expect(moyenne(bon.map((t) => t.occupationFinale))).toBeLessThan(0.8);
    expect(moyenne(attente.map((t) => t.ecartFinal))).toBeGreaterThan(100000);
  });

  it("les indicateurs restent dans des plages réalistes, même sur les chemins extrêmes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE, [2, 2, 1, 2, 0, 0]]) {
      for (const g of [1, 2, 3]) {
        for (const s of simuler(c, g).semaines.slice(1)) {
          expect(s!.service).toBeGreaterThan(0.5);
          expect(s!.service).toBeLessThanOrEqual(1);
          expect(s!.occupation).toBeLessThan(1.1);
          expect(s!.stock).toBeLessThan(2500000);
        }
      }
    }
  });

  it("un service dégradé fait partir le grand compte bien plus souvent", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).clientPerdu).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(ATTENTISTE)).toBeGreaterThan(10);
    expect(departs(ATTENTISTE)).toBeLessThan(30);
    expect(risqueDePerdreLeClient(0.97)).toBe(0);
    expect(risqueDePerdreLeClient(0.8)).toBeGreaterThan(0.5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : recalculer par classe ABC est de loin le meilleur choix ; relever tout ne paie pas", () => {
    const r = rejeu(MEILLEUR, D.stocks);
    expect(classement(MEILLEUR, D.stocks)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
  });

  it("D2 : les comptages tournants battent l'inventaire complet et la marge sur les commandes", () => {
    const r = rejeu(MEILLEUR, D.inventaire);
    expect(classement(MEILLEUR, D.inventaire)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
  });

  it("D2 : les comptages tournants valent surtout quand les A sont classées", () => {
    const gain = (chemin: readonly number[]) => {
      const r = rejeu(chemin, D.inventaire);
      return r[0]!.attendu - r[1]!.attendu;
    };
    const nonClasse = avec(MEILLEUR, D.stocks, 3);
    expect(gain(MEILLEUR)).toBeGreaterThan(8000);
    expect(gain(MEILLEUR) - gain(nonClasse)).toBeGreaterThan(5000);
  });

  it("D3 : commander à date fixe est le meilleur pari, le second fournisseur le plus sûr ; doubler est le pire", () => {
    const r = rejeu(MEILLEUR, D.fournisseur);
    const c = classement(MEILLEUR, D.fournisseur);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[2]!.p10);
    expect(r[1]!.attendu - r[2]!.attendu).toBeLessThan(3000);
    // Le pari se joue sur le hasard du trimestre : le fournisseur tient sept fois sur dix.
    const tient = GRAINES_DU_BILAN.filter(fournisseurTient).length;
    expect(tient).toBeGreaterThan(12);
    expect(tient).toBeLessThan(30);
  });

  it("D4 : sortir les dormants bat l'entrepôt de débord, le gel des achats et le statu quo", () => {
    const c = classement(MEILLEUR, D.place);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("D5 : allouer sur les ventes réelles bat le fait de suivre les commandes gonflées", () => {
    const c = classement(MEILLEUR, D.agences);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
  });

  it("D5 : les agences se couvrent d'autant plus qu'elles ont manqué avant", () => {
    const surcommande = (chemin: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(chemin, g).surcommande));
    expect(surcommande(MEILLEUR)).toBeLessThan(0.25);
    expect(surcommande(ATTENTISTE)).toBeGreaterThan(0.3);
    expect(moyenne(GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g).stocksAgences))).toBe(0);
  });

  it("D6 : commander la liste du chantier bat le stock « pour être prêts » et l'automatisme", () => {
    const r = rejeu(MEILLEUR, D.cloture);
    expect(classement(MEILLEUR, D.cloture)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(4000);
  });

  it("mettre le stock au bon endroit bat le réflexe et l'attentisme, en moyenne", () => {
    const [bon, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bon).toBeGreaterThan(reflexe! + 50000);
    expect(bon).toBeGreaterThan(attentiste! + 50000);
    expect(bon).toBeGreaterThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["abc", "parametres"],
      ["compter"],
      ["visseries"],
      ["dormants"],
      ["ventes"],
      ["liste"],
    ],
    jours: JOURS,
    diagnostic: "repartition",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 90,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 42, 4242]) {
      const a = analyser(EPISODE_DEPOT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a commandé plus de tout, propose de mettre le stock au bon endroit", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_DEPOT.comportements(p, analyser(EPISODE_DEPOT, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_DEPOT.axe(c).titre).toBe("Mettre le stock au bon endroit avant d'en ajouter");
  });

  it("à qui a décidé sans enquêter, propose de regarder le stock référence par référence", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_DEPOT.comportements(p, analyser(EPISODE_DEPOT, p).trimestre);
    expect(EPISODE_DEPOT.axe(c).titre).toBe("Regarder le stock référence par référence");
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_DEPOT.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_DEPOT.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });

  it("donne la réponse du fournisseur selon le hasard, et seulement à qui lui a proposé un rythme", () => {
    const g = GRAINES_DU_BILAN.find((x) => !fournisseurTient(x))!;
    expect(EPISODE_DEPOT.reactions(D.fournisseur, 1, g)![0]!.alerte).toBe(true);
    expect(EPISODE_DEPOT.reactions(D.fournisseur, 2, g)).toBeNull();
    expect(EPISODE_DEPOT.reactions(D.place, 1, g)).toBeNull();
  });
});
