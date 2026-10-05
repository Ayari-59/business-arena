import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  ferlaneAccepte,
  hasard,
  niveauDeDemande,
  simuler,
} from "../../src/engine/episodes/nouveau-service";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/nouveau-service";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_INNOVATION } from "../../src/pedagogy/episodes/nouveau-service";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le nouveau service » enseigne trois choses : la demande réelle
 * se mesure, elle ne se devine pas, et un petit pilote l'apprend pour bien
 * moins cher qu'un parc de douze agences qui dort ; le terrain révèle ce
 * qu'aucune étude ne montre (retours en retard, casse, nettoyage), et c'est en
 * ajustant l'offre qu'on rend la marge ; on n'étend que ce qu'on a bien
 * mesuré, avec les chiffres qui disent si le service paie, pas les devis. Ces
 * tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [2, 0, 1, 2, 1, 0];
const PROMESSE = [0, 1, 0, 0, 0, 1];
const ATTENTE = [3, 3, 3, 1, 3, 2];
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
const plusSur = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;

describe("le modèle du service de location", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    // Même pilote, choix différents ensuite : la semaine 2 est la même.
    expect(simuler(MEILLEUR, 12).semaines[2]!.locations).toBeCloseTo(
      simuler([2, 1, 0, 0, 0, 1], 12).semaines[2]!.locations,
      6,
    );
    expect(simuler(MEILLEUR, 12).demandeReelle).toBe(simuler(PROMESSE, 12).demandeReelle);
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

  it("la demande réelle est tantôt faible, tantôt moyenne, tantôt forte", () => {
    const niveaux = GRAINES_DU_BILAN.map(niveauDeDemande);
    for (const n of ["faible", "moyenne", "forte"]) {
      expect(niveaux.filter((x) => x === n).length).toBeGreaterThan(5);
    }
  });

  it("le pilote fait tourner le parc ; la promesse le laisse dormir et ronge la marge", () => {
    const meilleur = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    const promesse = GRAINES_DU_BILAN.map((g) => simuler(PROMESSE, g));
    const loue = meilleur.filter((t) => t.agencesFinal > 0);
    expect(moyenne(loue.map((t) => t.utilisationFinale))).toBeGreaterThan(0.7);
    expect(moyenne(promesse.map((t) => t.utilisationFinale))).toBeLessThan(0.6);
    expect(moyenne(meilleur.map((t) => t.margeLocation))).toBeGreaterThan(80);
    expect(moyenne(promesse.map((t) => t.margeLocation))).toBeLessThan(45);
    expect(promesse.filter((t) => t.provision > 0).length).toBeGreaterThan(8);
    // Rien n'explose : douze agences au plus, une utilisation qui reste sous 100 %.
    for (const t of [...meilleur, ...promesse]) {
      expect(t.agencesMax).toBeLessThanOrEqual(12);
      for (const s of t.semaines.slice(1)) expect(s!.utilisation).toBeLessThanOrEqual(1);
    }
  });

  it("un échafaudage reloué sans contrôle finit souvent par céder ; avec le contrôle, presque jamais", () => {
    const accidents = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).incident !== null).length;
    expect(accidents(MEILLEUR)).toBeLessThanOrEqual(3);
    expect(accidents(PROMESSE)).toBeGreaterThan(15);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le pilote bat de loin les douze agences et l'étude, et protège le mieux", () => {
    const r = rejeu(MEILLEUR, D.lancement);
    expect(classement(MEILLEUR, D.lancement)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(plusSur(MEILLEUR, D.lancement)).toBe(2);
  });

  it("D2 : suivre l'utilisation, la marge et les retours bat les devis, qui font le pire", () => {
    const c = classement(MEILLEUR, D.mesure);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    const r = rejeu(MEILLEUR, D.mesure);
    expect(r[0]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(2500);
  });

  it("D3 : ajuster l'offre avec les clients bat la baisse de prix et la livraison gratuite", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu)).toBeGreaterThan(15000);
    // Avec douze agences ouvertes d'un coup, la casse et les retards se multiplient.
    const gain = (d1: number) => {
      const x = rejeu([d1, 0, 1, 2, 1, 0], D.offre);
      return x[1]!.attendu - x[3]!.attendu;
    };
    expect(gain(0)).toBeGreaterThan(gain(2) + 20000);
  });

  it("D4 : étendre selon des seuils est le meilleur en moyenne ; rester est le plus sûr", () => {
    const c = classement(MEILLEUR, D.extension);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    const r = rejeu(MEILLEUR, D.extension);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(plusSur(MEILLEUR, D.extension)).toBe(1);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
  });

  it("D4 : étendre « selon les résultats » ne vaut que si l'on mesure les bons résultats", () => {
    const avecDevis = rejeu([2, 1, 1, 2, 1, 0], D.extension);
    expect(avecDevis[1]!.attendu).toBeGreaterThan(avecDevis[2]!.attendu);
    const avecMesure = rejeu(MEILLEUR, D.extension);
    expect(avecMesure[2]!.attendu).toBeGreaterThan(avecMesure[1]!.attendu);
  });

  it("D4 : quand le parc des douze agences est engagé, savoir arrêter coûte le moins", () => {
    expect(classement(PROMESSE, D.extension)[0]).toBe(3);
  });

  it("D5 : jouer la proximité bat la guerre des prix ; Ferlane accepte le partenariat une fois sur deux", () => {
    const r = rejeu(MEILLEUR, D.ferlane);
    expect(classement(MEILLEUR, D.ferlane)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    const oui = GRAINES_DU_BILAN.filter(ferlaneAccepte).length;
    expect(oui).toBeGreaterThan(8);
    expect(oui).toBeLessThan(22);
    const g = GRAINES_DU_BILAN.find(ferlaneAccepte)!;
    expect(EPISODE_INNOVATION.reactions(D.ferlane, 2, g)).toHaveLength(1);
    expect(EPISODE_INNOVATION.reactions(D.ferlane, 1, g)).toBeNull();
    expect(simuler([2, 0, 1, 2, 2, 0], g).partenariat).toBe(true);
  });

  it("D6 : rappeler les clients du pilote bat l'e-mailing pour le comité", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)).toEqual([0, 2, 1]);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
  });

  it("tester, mesurer, étendre bat la promesse et l'attente, en moyenne", () => {
    const [tester, promesse, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(tester).toBeGreaterThan(0);
    expect(tester! - promesse!).toBeGreaterThan(50000);
    expect(tester! - attente!).toBeGreaterThan(15000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["comptoir", "ferlane"],
      ["devis"],
      ["clients"],
      ["seuils"],
      ["artisans"],
      ["fideles"],
    ],
    jours: JOURS,
    diagnostic: "inconnue",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 12,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_INNOVATION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout lancé pour tenir la promesse, propose de tester avant de généraliser", () => {
    const p = partie(PROMESSE);
    const c = EPISODE_INNOVATION.comportements(p, analyser(EPISODE_INNOVATION, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INNOVATION.axe(c).titre).toBe("Tester avant de généraliser");
  });

  it("à qui a attendu l'étude, propose d'apprendre sur le terrain", () => {
    const p = partie(ATTENTE);
    const c = EPISODE_INNOVATION.comportements(p, analyser(EPISODE_INNOVATION, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INNOVATION.axe(c).titre).toBe("Apprendre sur le terrain plutôt qu'attendre");
  });

  it("à qui a décidé sans enquêter, propose de mesurer la demande avant d'acheter le parc", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_INNOVATION.comportements(p, analyser(EPISODE_INNOVATION, p).trimestre);
    expect(EPISODE_INNOVATION.axe(c).titre).toBe("Mesurer la demande avant d'acheter le parc");
  });

  it("dit le résultat en écart au budget, et raconte la demande du trimestre", () => {
    const bons = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).objectif > 0);
    expect(bons.length).toBeGreaterThan(10);
    expect(EPISODE_INNOVATION.bilan.titre(simuler(MEILLEUR, bons[0]!))).toMatch(
      /au-dessus du budget/,
    );
    expect(EPISODE_INNOVATION.bilan.titre(simuler(PROMESSE, 4242))).toMatch(/sous le budget/);
    const h = EPISODE_INNOVATION.bilan.hasard(simuler(MEILLEUR, 3), 3);
    expect(h.some((x) => x.titre === "La demande")).toBe(true);
  });

  it("raconte l'extension et l'accident là où ils tombent", () => {
    const g = GRAINES_DU_BILAN.find((x) => simuler(PROMESSE, x).incident !== null)!;
    const t = simuler(PROMESSE, g);
    const ev = EPISODE_INNOVATION.evenements(PROMESSE, g, t.incident!, t.incident!);
    expect(ev.lies.some((m) => /échafaudage/.test(m.texte))).toBe(true);
    const fort = GRAINES_DU_BILAN.find((x) => niveauDeDemande(x) === "forte")!;
    const ext = EPISODE_INNOVATION.evenements(MEILLEUR, fort, 7, 7);
    expect(ext.lies.some((m) => /Nouvelles agences/.test(m.texte))).toBe(true);
  });
});
