import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  morelAccepte,
  morelFragile,
  simuler,
} from "../../src/engine/episodes/agence-qui-demarre";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/agence-qui-demarre";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_LANCEMENT } from "../../src/pedagogy/episodes/agence-qui-demarre";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'agence qui démarre » enseigne trois choses : on ne fait pas
 * changer un artisan de négoce avec un prix, mais avec un service que le
 * concurrent ne rend pas ; le bouche-à-oreille se gagne client par client, et
 * c'est un pari sur le réseau ; un stock et un encours d'agence mature coûtent
 * à une agence qui démarre. Ces tests verrouillent les classements qui le
 * disent.
 */

const MEILLEUR = [1, 0, 0, 1, 0, 1];
const PRIX_BAS = [0, 2, 1, 0, 2, 0];
const ATTENTE = [3, 3, 3, 2, 3, 2];
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
    expect(simuler(MEILLEUR, 12).semaines[1]!.ca).toBeCloseTo(
      simuler(PRIX_BAS, 12).semaines[1]!.ca,
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

  it("le service atteint le point mort ; l'attente le manque, le prix détruit la marge", () => {
    const meilleur = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    const attente = GRAINES_DU_BILAN.map((g) => simuler(ATTENTE, g));
    const prix = GRAINES_DU_BILAN.map((g) => simuler(PRIX_BAS, g));
    expect(moyenne(meilleur.map((t) => t.margeFinale))).toBeGreaterThan(11000);
    expect(moyenne(attente.map((t) => t.margeFinale))).toBeLessThan(8000);
    expect(moyenne(meilleur.map((t) => t.reguliersFinal))).toBeGreaterThan(45);
    expect(moyenne(attente.map((t) => t.reguliersFinal))).toBeLessThan(25);
    expect(moyenne(prix.map((t) => t.tauxMoyen))).toBeLessThan(0.18);
    expect(moyenne(prix.map((t) => t.chasseursMax))).toBeGreaterThan(25);
    // Rien n'explose : le secteur compte 140 artisans.
    for (const t of meilleur) expect(t.reguliersFinal).toBeLessThan(90);
  });

  it("Morel est fragile une fois sur trois environ, et accepte des conditions pro une fois sur deux", () => {
    const fragiles = GRAINES_DU_BILAN.filter(morelFragile).length;
    const acceptes = GRAINES_DU_BILAN.filter(morelAccepte).length;
    expect(fragiles).toBeGreaterThan(5);
    expect(fragiles).toBeLessThan(18);
    expect(acceptes).toBeGreaterThan(8);
    expect(acceptes).toBeLessThan(25);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le service bat de loin la promotion, qui fait moins bien que l'attente", () => {
    const r = rejeu(MEILLEUR, D.frequentation);
    expect(classement(MEILLEUR, D.frequentation)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[0]!.attendu, r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(
      10000,
    );
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D2 : la prospection ciblée vaut d'autant plus que le service suit", () => {
    expect(classement(MEILLEUR, D.prospection)[0]).toBe(0);
    expect(classement(MEILLEUR, D.prospection).at(-1)).toBe(2);
    const gain = (d1: number) => {
      const r = rejeu([d1, 0, 0, 1, 0, 1], D.prospection);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(gain(1)).toBeGreaterThan(gain(3) + 8000);
  });

  it("D3 : ajuster l'assortiment bat le déstockage et la coupe générale", () => {
    const c = classement(MEILLEUR, D.stock);
    expect(c[0]).toBe(0);
    expect(c.indexOf(1)).toBeGreaterThan(c.indexOf(3));
    expect(c.at(-1)).toBe(2);
  });

  it("D4 : des conditions de professionnel paient le plus ; refuser est le plus sûr ; tout accepter, le pire", () => {
    const r = rejeu(MEILLEUR, D.morel);
    expect(classement(MEILLEUR, D.morel)).toEqual([1, 2, 0]);
    const plusSur = r.reduce((x, o) => (o.p10 > x.p10 ? o : x));
    expect(plusSur.option).toBe(2);
    expect(r[0]!.p10).toBeLessThan(r[2]!.p10 - 10000);
  });

  it("D5 : le parrainage paie quand le service se raconte, pas sans lui", () => {
    const c = classement(MEILLEUR, D.reseau);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(2);
    const sansService = rejeu([3, 0, 0, 1, 0, 1], D.reseau);
    expect(sansService[0]!.attendu).toBeLessThan(sansService[3]!.attendu);
  });

  it("D6 : relancer les artisans perdus bat la promotion de fin de trimestre", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu).toBeLessThan(r[2]!.attendu);
  });

  it("connaître ses clients puis les servir bat le prix et l'attente, en moyenne", () => {
    const [servir, prix, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(servir! - prix!).toBeGreaterThan(20000);
    expect(servir! - attente!).toBeGreaterThan(20000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tickets", "artisans"],
      ["liste"],
      ["familles"],
      ["credit"],
      ["origine"],
      ["perdus"],
    ],
    jours: JOURS,
    diagnostic: "service",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 25,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_LANCEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a cassé les prix partout, propose de gagner les clients par le service", () => {
    const p = partie(PRIX_BAS);
    const c = EPISODE_LANCEMENT.comportements(p, analyser(EPISODE_LANCEMENT, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_LANCEMENT.axe(c).titre).toBe(
      "Gagner les clients par le service, pas par le prix",
    );
  });

  it("à qui a attendu que la clientèle vienne, propose d'aller la chercher", () => {
    const p = partie(ATTENTE);
    const c = EPISODE_LANCEMENT.comportements(p, analyser(EPISODE_LANCEMENT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_LANCEMENT.axe(c).titre).toBe(
      "Aller chercher les clients plutôt que les attendre",
    );
  });

  it("à qui a décidé sans enquêter, propose d'aller voir les clients avant d'agir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_LANCEMENT.comportements(p, analyser(EPISODE_LANCEMENT, p).trimestre);
    expect(EPISODE_LANCEMENT.axe(c).titre).toBe("Aller voir les clients avant d'agir");
  });

  it("dit le résultat en écart au plan d'affaires", () => {
    const bons = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).objectif > 0);
    expect(bons.length).toBeGreaterThan(10);
    expect(EPISODE_LANCEMENT.bilan.titre(simuler(MEILLEUR, bons[0]!))).toMatch(/au-dessus du plan/);
    expect(EPISODE_LANCEMENT.bilan.titre(simuler(ATTENTE, 4242))).toMatch(/sous le plan/);
  });

  it("raconte Morel selon le hasard : accord ou refus, impayé ou blocage à l'encours", () => {
    const g = GRAINES_DU_BILAN.find((x) => morelFragile(x) && morelAccepte(x))!;
    expect(g).toBeDefined();
    const pro = simuler(MEILLEUR, g);
    const tout = simuler([1, 0, 0, 0, 0, 1], g);
    expect(pro.morelBloque).toBe(true);
    expect(tout.morelImpaye).toBeGreaterThan(pro.morelImpaye * 2);
    const ev = EPISODE_LANCEMENT.evenements([1, 0, 0, 0, 0, 1], g, 12, 13);
    expect(ev.lies.some((m) => /redressement judiciaire/.test(m.texte))).toBe(true);
    const reponse = EPISODE_LANCEMENT.reactions(D.morel, 1, g)!;
    expect(reponse).toHaveLength(1);
    expect(EPISODE_LANCEMENT.reactions(D.morel, 0, g)).toBeNull();
  });
});
