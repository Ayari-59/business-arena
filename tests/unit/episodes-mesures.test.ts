import { describe, expect, it } from "vitest";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, PartieJouee } from "../../src/config/episodes/types";
import { GRAINES_DU_BILAN, mulberry32 } from "../../src/engine/episodes/commun";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import {
  SEUIL_QUALITE,
  mesurer,
  mesurerDecision,
  type DecisionMesuree,
} from "../../src/pedagogy/episodes/mesures";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * Les mesures prolongent le bilan sans le contredire : même jugement des
 * décisions, et les chiffres que le rapport en a tirés sur les trente épisodes.
 */
function partie(ep: Episode, chemin: readonly number[], graine = 1): PartieJouee {
  return {
    graine,
    chemin,
    consultes: ep.etapes.map(() => []),
    jours: ep.enquete.joursSansPerte,
    diagnostic: ep.diagnostics[0]!.id,
    reevaluation: { choix: "maintient", principal: null },
    prevision: 0,
    confiance: 50,
  };
}

/** Un chemin tiré au hasard, mais toujours le même. */
function cheminAuHasard(ep: Episode, graine: number): number[] {
  const r = mulberry32(graine);
  return ep.etapes.map((e) => Math.floor(r() * e.options.length));
}

describe("les mesures des 180 décisions, sur le meilleur chemin", () => {
  // Le calcul du rapport : chaque décision rejouée autour de la première référence, 1,5 jour d'enquête.
  const toutes: DecisionMesuree[] = EPISODES.flatMap((ep) =>
    ep.etapes.map((_, d) => mesurerDecision(ep, ep.references[0]!.chemin, d, 1.5)),
  );
  const options = toutes.flatMap((d) => d.options);

  it("retrouvent les chiffres du rapport", () => {
    expect(toutes).toHaveLength(180);
    expect(options).toHaveLength(701);
    expect(toutes.filter((d) => d.dominee)).toHaveLength(95);
    expect(options.filter((o) => o.trompeuse)).toHaveLength(59);
    expect(toutes.filter((d) => d.options.some((o) => o.trompeuse))).toHaveLength(43);
    expect(toutes.filter((d) => d.options.some((o) => o.victoires >= 0.5))).toHaveLength(19);
    const plusSures = toutes.flatMap((d) => d.options.filter((o) => o.p10 > d.meilleure.p10));
    expect(plusSures).toHaveLength(53);
  });

  it("restent entre 0 et 1, et donnent 1 et 0 aux extrêmes", () => {
    for (const d of toutes) {
      for (const o of d.options) {
        for (const x of [o.qualite, o.robustesse, o.victoires]) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(1);
        }
        expect(o.regret).toBeGreaterThanOrEqual(0);
        expect(o.p10).toBeLessThanOrEqual(o.moyenne + 1e-6);
        expect(o.p90).toBeGreaterThanOrEqual(o.p10);
      }
      expect(d.meilleure.qualite).toBe(1);
      expect(d.meilleure.victoires).toBe(0);
      expect(d.plusSure.robustesse).toBe(1);
      const pire = d.options.reduce((a, o) => (o.moyenne < a.moyenne ? o : a));
      if (d.meilleure.moyenne - pire.moyenne >= 1000) expect(pire.qualite).toBe(0);
    }
  });

  it("rangent chaque option dans la famille que disent sa qualité et sa robustesse", () => {
    for (const o of options) {
      const bonne = o.qualite >= SEUIL_QUALITE;
      const tient = o.robustesse >= 0.7;
      expect(o.famille).toBe(
        bonne ? (tient ? "robuste" : "fragile") : tient ? "prudente" : "faible",
      );
    }
    // Les quatre familles existent dans les trente épisodes.
    expect(new Set(options.map((o) => o.famille)).size).toBe(4);
  });

  it("ne trouvent aucune décision où le hasard ne joue sur rien et où une option trompe", () => {
    for (const d of toutes) if (d.dominee) expect(d.options.some((o) => o.trompeuse)).toBe(false);
  });

  it("ne jugent bonne aucune option réflexe sur le meilleur chemin", () => {
    // Une option que le bilan juge défendable sur le meilleur chemin ne peut pas être comptée
    // comme un réflexe : le bilan et le constat des réflexes se contrediraient.
    const bonnes: string[] = [];
    EPISODES.forEach((ep, i) => {
      for (const [d, o] of TRACES[ep.code]!.reflexes) {
        const decision = toutes[i * 6 + d]!;
        const option = decision.options[o]!;
        const bonne =
          option.qualite >= SEUIL_QUALITE ||
          (option === decision.plusSure && decision.meilleure.moyenne - option.moyenne < 3000);
        if (bonne) bonnes.push(`${ep.code} D${d + 1} option ${o}`);
      }
    });
    expect(bonnes).toEqual([]);
  });
});

describe("les mesures d'une partie", () => {
  it("donnent une qualité de 1 à chaque décision de la meilleure référence", () => {
    for (const ep of EPISODES) {
      const m = mesurer(ep, partie(ep, ep.references[0]!.chemin));
      for (const d of m.decisions) expect(d.choisie.qualite, `${ep.code} D${d.d + 1}`).toBe(1);
    }
  });

  it("donnent une qualité basse aux réflexes, même pris à la suite", () => {
    // Chaque décision qui offre un réflexe le prend ; les autres suivent la meilleure référence.
    // Un réflexe peut redevenir le bon choix dans la situation que les précédents ont créée :
    // on n'exige donc une qualité basse qu'en moyenne.
    const qualites: number[] = [];
    for (const ep of EPISODES) {
      const chemin = [...ep.references[0]!.chemin];
      const prises = new Set<number>();
      for (const [d, o] of TRACES[ep.code]!.reflexes) {
        if (prises.has(d)) continue;
        chemin[d] = o;
        prises.add(d);
      }
      const q = mesurer(ep, partie(ep, chemin))
        .decisions.filter((d) => prises.has(d.d))
        .map((d) => d.choisie.qualite);
      expect(q.reduce((a, b) => a + b) / q.length, ep.code).toBeLessThan(1);
      qualites.push(...q);
    }
    expect(qualites.reduce((a, b) => a + b) / qualites.length).toBeLessThan(0.3);
  });

  it("jugent chaque décision comme le bilan, sur des chemins variés", () => {
    for (const ep of EPISODES) {
      const chemins = [
        ...ep.references.map((r) => r.chemin),
        cheminAuHasard(ep, ep.numero),
        cheminAuHasard(ep, ep.numero + 100),
      ];
      for (const chemin of chemins) {
        const p = partie(ep, chemin, 17);
        const bilan = analyser(ep, p);
        const mesures = mesurer(ep, p);
        mesures.decisions.forEach((m, d) => {
          const b = bilan.decisions[d]!;
          const ici = `${ep.code} [${chemin.join("")}] D${d + 1}`;
          expect(m.bonne, ici).toBe(b.bonne);
          expect(m.choisie.moyenne, ici).toBeCloseTo(b.pris.attendu, 6);
          expect(m.meilleure.moyenne, ici).toBeCloseTo(b.meilleur.attendu, 6);
          expect(m.plusSure.p10, ici).toBeCloseTo(b.plusSur.p10, 6);
        });
        expect(mesures.tirage.attendu).toBeCloseTo(bilan.attendu, 6);
        expect(mesures.tirage.obtenu).toBeCloseTo(bilan.trimestre.objectif, 6);
      }
    }
  });

  it("ne dépendent du tirage joué que par sa place", () => {
    const ep = EPISODES[0]!;
    const chemin = cheminAuHasard(ep, 3);
    const [a, b] = [mesurer(ep, partie(ep, chemin, 4)), mesurer(ep, partie(ep, chemin, 5000))];
    expect(a.decisions).toEqual(b.decisions);
    expect(mesurer(ep, partie(ep, chemin, 4))).toEqual(a);
  });

  it("rangent le tirage joué parmi les trente : 1 pour le meilleur, 30 pour le pire", () => {
    for (const ep of EPISODES.slice(0, 5)) {
      const chemin = ep.references[0]!.chemin;
      const valeurs = GRAINES_DU_BILAN.map((g) => ep.simuler(chemin, g, 2).objectif);
      const p = { ...partie(ep, chemin), jours: 2 };
      const meilleur = GRAINES_DU_BILAN[valeurs.indexOf(Math.max(...valeurs))]!;
      const pire = GRAINES_DU_BILAN[valeurs.indexOf(Math.min(...valeurs))]!;
      expect(mesurer(ep, { ...p, graine: meilleur }).tirage.place, ep.code).toBe(1);
      const dernier = mesurer(ep, { ...p, graine: pire }).tirage;
      expect(dernier.place, ep.code).toBe(
        1 + valeurs.filter((v) => v > Math.min(...valeurs)).length,
      );
      expect(dernier.sur).toBe(30);
    }
  });
});
