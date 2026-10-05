import { describe, expect, it } from "vitest";
import {
  COMPETENCES,
  ETIQUETTES,
  type CodeCompetence,
} from "../../src/config/episodes/competences";
import { FAMILLES } from "../../src/config/episodes/familles";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, PartieJouee } from "../../src/config/episodes/types";
import { EPISODES } from "../../src/pedagogy/episodes/registre";
import {
  traceCalibrage,
  traceDiagnostic,
  traceInformation,
  traceReflexes,
  traceRevision,
  tracesDeLaPartie,
} from "../../src/pedagogy/episodes/traces";

/**
 * Le référentiel n'a de sens que s'il colle aux épisodes : chaque
 * décision étiquetée une fois, chaque compétence observée assez souvent, et
 * des traces qui disent la même chose que le bilan de chaque épisode.
 */
const CODES = COMPETENCES.map((c) => c.code);
const toutes = Object.entries(ETIQUETTES).flatMap(([code, liste]) =>
  liste.map((e) => ({ code, ...e })),
);
const familleDe = (code: string) => FAMILLES.find((f) => f.episodes.includes(code))!.code;
/** Les trente premiers épisodes, ceux dont le rapport a donné les décomptes. */
const PREMIERS = new Set(EPISODES.filter((e) => e.numero <= 30).map((e) => e.code));
const premieres = toutes.filter((e) => PREMIERS.has(e.code));

/** Une partie qui suit la première référence, avec un diagnostic, une prévision et une confiance donnés. */
function partie(ep: Episode, change: Partial<PartieJouee> = {}): PartieJouee {
  return {
    graine: 1,
    chemin: [...ep.references[0]!.chemin],
    consultes: ep.etapes.map(() => []),
    jours: ep.enquete.joursSansPerte,
    diagnostic: TRACES[ep.code]!.diagnostic.juste,
    reevaluation: { choix: "maintient", principal: null },
    prevision: 0,
    confiance: 50,
    ...change,
  };
}

/** Les constats du bilan qui changent entre deux parties : [avant, après]. */
function changes(ep: Episode, a: PartieJouee, b: PartieJouee): [number, number][] {
  const sa = ep.comportements(a, ep.simuler(a.chemin, a.graine, a.jours)).map((c) => c.score);
  const sb = ep.comportements(b, ep.simuler(b.chemin, b.graine, b.jours)).map((c) => c.score);
  return sa.flatMap((s, i): [number, number][] => (s === sb[i] ? [] : [[s, sb[i]!]]));
}

describe("le référentiel des compétences", () => {
  it("compte dix compétences, R1 à R10, dont seul R7 n'a pas encore de score", () => {
    expect(CODES).toEqual(["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10"]);
    expect(COMPETENCES.filter((c) => !c.score).map((c) => c.code)).toEqual(["R7"]);
  });

  it("ne parle que de décisions, jamais de la personne", () => {
    const interdits =
      /personnalit|intelligen|potentiel|talent natur|leader n|tempérament|caractère|psycholog|\btraits?\b/i;
    for (const c of COMPETENCES) {
      for (const texte of [c.nom, c.definition, c.comportement, c.limite]) {
        expect(texte, c.code).not.toMatch(interdits);
      }
    }
  });

  it("donne aux cinq traces une compétence chacune", () => {
    const traces = COMPETENCES.flatMap((c) => (c.trace ? [c.trace] : []));
    expect([...traces].sort()).toEqual(
      ["calibrage", "diagnostic", "information", "reflexes", "revision"].sort(),
    );
  });
});

describe("l'étiquetage des décisions", () => {
  it("couvre tous les épisodes du registre, décision par décision", () => {
    expect(Object.keys(ETIQUETTES).sort()).toEqual(EPISODES.map((e) => e.code).sort());
    for (const ep of EPISODES) expect(ETIQUETTES[ep.code], ep.code).toHaveLength(ep.etapes.length);
    expect(premieres).toHaveLength(180);
    expect(toutes).toHaveLength(EPISODES.length * 6);
  });

  it("donne à chaque décision une compétence principale, et des secondaires distinctes d'elle", () => {
    for (const e of toutes) {
      expect(CODES).toContain(e.principale);
      for (const s of e.secondaires) expect(CODES).toContain(s);
      expect(e.secondaires, e.code).not.toContain(e.principale);
      expect(new Set(e.secondaires).size, e.code).toBe(e.secondaires.length);
    }
  });

  it("retrouve les décomptes du rapport, sur les trente premiers épisodes", () => {
    const n = (c: CodeCompetence) => premieres.filter((e) => e.principale === c).length;
    expect(Object.fromEntries(CODES.map((c) => [c, n(c)]))).toEqual({
      R1: 9,
      R2: 36,
      R3: 5,
      R4: 6,
      R5: 34,
      R6: 14,
      R7: 0,
      R8: 14,
      R9: 27,
      R10: 35,
    });
  });

  it("observe chaque compétence notée assez souvent pour qu'un score ait un sens", () => {
    for (const c of COMPETENCES.filter((c) => c.score)) {
      const siennes = toutes.filter((e) => e.principale === c.code);
      // Au moins cinq décisions principales ; sans trace pour la compléter, dix dans huit épisodes.
      expect(siennes.length, c.code).toBeGreaterThanOrEqual(5);
      if (!c.trace) {
        expect(siennes.length, c.code).toBeGreaterThanOrEqual(10);
        expect(new Set(siennes.map((e) => e.code)).size, c.code).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it("couvre les six familles du métier pour R2, R5, R6, R9 et R10", () => {
    for (const c of ["R2", "R5", "R6", "R9", "R10"] as const) {
      const familles = new Set(
        premieres.filter((e) => e.principale === c).map((e) => familleDe(e.code)),
      );
      expect(familles.size, c).toBe(6);
    }
  });
});

describe("les données de traces", () => {
  it("couvrent tous les épisodes, avec des diagnostics et des options qui existent", () => {
    expect(Object.keys(TRACES).sort()).toEqual(EPISODES.map((e) => e.code).sort());
    for (const ep of EPISODES) {
      const t = TRACES[ep.code]!;
      const ids = ep.diagnostics.map((d) => d.id);
      expect(ids, ep.code).toContain(t.diagnostic.juste);
      expect(ids, ep.code).toContain(t.diagnostic.proche);
      expect(t.diagnostic.juste).not.toBe(t.diagnostic.proche);
      expect(t.prevision.juste, ep.code).toBeLessThan(t.prevision.proche);
      expect(t.reflexes.length, ep.code).toBeGreaterThan(0);
      for (const [d, o] of t.reflexes) {
        expect(o, `${ep.code} D${d + 1}`).toBeLessThan(ep.etapes[d]!.options.length);
      }
    }
  });

  it("ne comptent jamais comme réflexe un choix de la meilleure référence", () => {
    for (const ep of EPISODES) {
      const chemin = ep.references[0]!.chemin;
      for (const [d, o] of TRACES[ep.code]!.reflexes) {
        expect(chemin[d], `${ep.code} D${d + 1}`).not.toBe(o);
      }
    }
  });

  it("jugent le diagnostic comme le bilan de chaque épisode", () => {
    for (const ep of EPISODES) {
      const t = TRACES[ep.code]!;
      const juste = partie(ep);
      const autre = ep.diagnostics.find(
        (d) => d.id !== t.diagnostic.juste && d.id !== t.diagnostic.proche,
      )!.id;
      for (const [id, attendu] of [
        [t.diagnostic.proche, 0.6],
        [autre, 0],
      ] as const) {
        const p = partie(ep, { diagnostic: id });
        expect(changes(ep, juste, p), `${ep.code} ${id}`).toContainEqual([1, attendu]);
        expect(traceDiagnostic(ep, p).valeur).toBe(attendu);
      }
      expect(traceDiagnostic(ep, juste).valeur).toBe(1);
    }
  });

  it("jugent la prévision comme le bilan de chaque épisode, de part et d'autre de chaque seuil", () => {
    for (const ep of EPISODES) {
      const s = TRACES[ep.code]!.prevision;
      const base = partie(ep);
      const reel = ep.prevision.reel(ep.simuler(base.chemin, base.graine, base.jours));
      const exacte = partie(ep, { prevision: reel });
      for (const [decalage, attendu] of [
        [s.juste * 0.98, 1],
        [s.juste * 1.02, 0.6],
        [s.proche * 0.98, 0.6],
        [s.proche * 1.02, 0],
      ] as const) {
        const p = partie(ep, { prevision: reel + decalage });
        const changements = changes(ep, exacte, p);
        expect(changements, `${ep.code} +${decalage}`).toEqual(attendu === 1 ? [] : [[1, attendu]]);
        const trace = traceCalibrage(ep, p, ep.simuler(p.chemin, p.graine, p.jours));
        expect(trace.valeur, `${ep.code} +${decalage}`).toBe(attendu);
      }
    }
  });
});

describe("les règles de traces", () => {
  const ep = EPISODES[0]!;
  const t = TRACES[ep.code]!;
  const faux = ep.diagnostics.find(
    (d) => d.id !== t.diagnostic.juste && d.id !== t.diagnostic.proche,
  )!.id;

  it("distinguent les cinq cas de la réévaluation, et disent quand elle était à l'épreuve", () => {
    const cas = (diagnostic: string, principal: string | null) =>
      traceRevision(
        ep,
        partie(ep, {
          diagnostic,
          reevaluation: { choix: principal ? "corrige" : "maintient", principal },
        }),
      );
    expect(cas(t.diagnostic.juste, null)).toMatchObject({
      cas: "maintient-juste",
      valeur: 1,
      aLEpreuve: false,
    });
    expect(cas(faux, t.diagnostic.juste)).toMatchObject({
      cas: "corrige",
      valeur: 1,
      aLEpreuve: true,
    });
    expect(cas(faux, null)).toMatchObject({ cas: "maintient-faux", valeur: 0, aLEpreuve: true });
    expect(cas(t.diagnostic.juste, faux)).toMatchObject({ cas: "abandonne", valeur: 0 });
    const autreFaux = ep.diagnostics.find(
      (d) => d.id !== faux && d.id !== t.diagnostic.juste && d.id !== t.diagnostic.proche,
    )!.id;
    expect(cas(faux, autreFaux)).toMatchObject({ cas: "corrige-a-tort", valeur: 0 });
  });

  it("comptent les réflexes par décision, pas par option", () => {
    const sans = traceReflexes(ep, partie(ep));
    expect(sans.valeur).toBe(1);
    const [d, o] = t.reflexes[0]!;
    const chemin = [...ep.references[0]!.chemin];
    chemin[d] = o;
    const avec = traceReflexes(ep, partie(ep, { chemin }));
    const decisions = new Set(t.reflexes.map(([dd]) => dd)).size;
    expect(avec.occasions).toBe(decisions);
    expect(avec.valeur).toBeCloseTo((decisions - 1) / decisions);
  });

  it("rapportent les informations consultées à ce que le niveau laissait atteindre", () => {
    for (const ep of EPISODES) {
      const decisivesParEtape = ep.etapes.map((e) =>
        e.sources.filter((s) => s.nature === "decisive").map((s) => s.id),
      );
      const tout = partie(ep, { consultes: decisivesParEtape });
      expect(traceInformation(ep, tout).valeur, ep.code).toBe(1);
      expect(traceInformation(ep, partie(ep)).valeur, ep.code).toBe(0);
      // En Expert, une vérification par décision après la première suffit à tout voir.
      const uneParEtape = decisivesParEtape.map((ids, d) => (d === 0 ? ids : ids.slice(0, 1)));
      const expert = partie(ep, { consultes: uneParEtape, niveau: "expert" });
      expect(traceInformation(ep, expert).valeur, ep.code).toBe(1);
    }
  });

  it("donnent cinq traces entre 0 et 1 sur tous les épisodes, sans regarder le résultat", () => {
    for (const ep of EPISODES) {
      for (const graine of [1, 7]) {
        const traces = tracesDeLaPartie(ep, partie(ep, { graine }));
        expect(traces.map((x) => x.competence)).toEqual(["R1", "R2", "R3", "R4", "R7"]);
        for (const x of traces.slice(0, 4)) {
          expect(x.valeur, `${ep.code} ${x.trace}`).toBeGreaterThanOrEqual(0);
          expect(x.valeur!, `${ep.code} ${x.trace}`).toBeLessThanOrEqual(1);
        }
        // Le hasard change le trimestre, pas les quatre premières traces.
        if (graine === 7) {
          const g1 = tracesDeLaPartie(ep, partie(ep, { graine: 1 }));
          expect(traces.slice(0, 4)).toEqual(g1.slice(0, 4));
        }
      }
    }
  });
});
