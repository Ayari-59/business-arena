import { describe, expect, it } from "vitest";
import { DIFFICULTES, PEU_DISCRIMINANTS } from "../../src/config/episodes/difficultes";
import {
  decompterLaDifficulte,
  departageMal,
  difficulteDesPoints,
} from "../../src/pedagogy/episodes/difficulte";
import { FAMILLES } from "../../src/config/episodes/familles";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, PartieJouee } from "../../src/config/episodes/types";
import type { CodeNiveau } from "../../src/config/episodes/niveaux";
import { EPISODES, episodeParCode } from "../../src/pedagogy/episodes/registre";
import {
  BILAN_D_ENTREE,
  MENTION,
  OBJECTIFS_POSSIBLES,
  conseillerUnNiveau,
  ceQuObserve,
  comparer,
  construireProfil,
  niveauDeConfiance,
} from "../../src/pedagogy/profil/profil";
import type { PartieEnregistree } from "../../src/pedagogy/profil/types";

/**
 * Le profil ne dit que ce que les parties observent, avec la confiance que
 * leur nombre et leur variété autorisent ; jamais le résultat, jamais la
 * personne.
 */
let n = 0;

/** Une partie bien menée : la meilleure référence, tout consulté, bon diagnostic, prévision exacte. */
function bienJouee(
  code: string,
  change: Partial<PartieJouee> & { niveau?: CodeNiveau } = {},
  jour = ++n,
): PartieEnregistree {
  const ep = episodeParCode(code)!;
  const t = TRACES[code]!;
  const chemin = change.chemin ?? ep.references[0]!.chemin;
  const base: PartieJouee = {
    graine: 3,
    chemin,
    consultes: ep.etapes.map((e) =>
      e.sources.filter((s) => s.nature === "decisive").map((s) => s.id),
    ),
    jours: ep.enquete.joursSansPerte,
    diagnostic: t.diagnostic.juste,
    reevaluation: { choix: "maintient", principal: null },
    prevision: ep.prevision.reel(ep.simuler(chemin, change.graine ?? 3, ep.enquete.joursSansPerte)),
    confiance: 60,
    niveau: "standard",
  };
  return {
    id: `p${jour}`,
    code,
    versionModele: 1,
    date: new Date(Date.UTC(2026, 9, 1) + jour * 3600_000).toISOString(),
    premiere: true,
    partie: { ...base, ...change },
  };
}

/** Une partie qui prend tous les réflexes, sans rien consulter, avec un diagnostic faux. */
function reflexe(code: string): PartieEnregistree {
  const ep = episodeParCode(code)!;
  const t = TRACES[code]!;
  const chemin = [...ep.references[0]!.chemin];
  const prises = new Set<number>();
  for (const [d, o] of t.reflexes) {
    if (prises.has(d)) continue;
    chemin[d] = o;
    prises.add(d);
  }
  const faux = ep.diagnostics.find(
    (d) => d.id !== t.diagnostic.juste && d.id !== t.diagnostic.proche,
  )!.id;
  return bienJouee(code, {
    chemin,
    consultes: [],
    diagnostic: faux,
    prevision: ep.prevision.max,
    confiance: 90,
  });
}

// Quatre épisodes dans trois familles : opérations, vendre, chiffres, chiffres.
const QUATRE = [
  "depot-qui-deborde",
  "agence-qui-demarre",
  "tresorerie-qui-fond",
  "budget-qui-ne-tient-pas",
];

const ligne = (p: ReturnType<typeof construireProfil>, code: string) =>
  p.competences.find((l) => l.competence.code === code)!;

describe("les parties qui comptent", () => {
  it("ne comptent que la première partie de chaque épisode, et jamais en Découverte", () => {
    const profil = construireProfil([
      bienJouee("depot-qui-deborde"),
      bienJouee("depot-qui-deborde", { graine: 9 }),
      bienJouee("agence-qui-demarre", { niveau: "decouverte" }),
      bienJouee("agence-qui-demarre"),
      { ...bienJouee("tresorerie-qui-fond"), code: "episode-disparu" },
    ]);
    expect(profil.comptees.map((p) => p.ep.code)).toEqual(["depot-qui-deborde"]);
    expect(profil.ignorees.map((p) => p.raison).sort()).toEqual(
      ["decouverte", "inconnue", "rejouee", "rejouee"].sort(),
    );
  });

  it("lisent les parties dans l'ordre où elles ont été jouées, pas dans l'ordre reçu", () => {
    const [a, b] = [bienJouee("depot-qui-deborde"), bienJouee("depot-qui-deborde", { graine: 9 })];
    expect(construireProfil([b, a]).comptees[0]!.enregistree.id).toBe(a.id);
  });

  it("signalent une partie jouée sous une version antérieure du modèle", () => {
    const vieille = { ...bienJouee("depot-qui-deborde"), versionModele: 0 };
    expect(construireProfil([vieille]).comptees[0]!.ancienneVersion).toBe(true);
  });
});

describe("le score et sa confiance", () => {
  it("ne donne aucun score sur un seul épisode, mais montre les observations", () => {
    const profil = construireProfil([bienJouee("depot-qui-deborde")]);
    for (const l of profil.competences) {
      expect(l.score, l.competence.code).toBeNull();
      expect(l.confiance).toBe("aucun");
    }
    expect(ligne(profil, "R2").observations.length).toBeGreaterThan(0);
    expect(ligne(profil, "R2").preuve).toMatch(/Diagnostic de la semaine 1 juste 1 fois sur 1/);
  });

  it("établit un score haut, à intervalle étroit, pour qui suit toujours la meilleure référence", () => {
    const profil = construireProfil(QUATRE.map((c) => bienJouee(c)));
    const r2 = ligne(profil, "R2");
    expect(r2.episodes).toBe(4);
    expect(r2.familles).toBe(3);
    expect(r2.confiance).toBe("etabli");
    expect(r2.score).toBe(100);
    expect(r2.intervalle).toEqual([100, 100]);
    // Ce qu'on sait le mieux vient d'abord.
    const rangs = profil.competences.map((l) =>
      ["aucun", "indicatif", "etabli", "solide"].indexOf(l.confiance),
    );
    expect(rangs).toEqual([...rangs].sort((a, b) => b - a));
  });

  it("donne moins à qui prend les réflexes, sur les mêmes épisodes", () => {
    const bon = construireProfil(QUATRE.map((c) => bienJouee(c)));
    const mauvais = construireProfil(QUATRE.map((c) => reflexe(c)));
    for (const c of ["R1", "R2", "R4"]) {
      expect(ligne(mauvais, c).score!, c).toBeLessThan(ligne(bon, c).score!);
    }
    expect(ligne(mauvais, "R4").preuve).toMatch(/Prise : /);
    expect(ligne(mauvais, "R7").preuve).toMatch(/Confiance de 70 % ou plus 4 fois/);
  });

  it("ne change pas d'un tirage à l'autre : le résultat obtenu n'entre dans aucun score", () => {
    const a = construireProfil(QUATRE.map((c) => reflexe(c)));
    const b = construireProfil(
      QUATRE.map((c) => {
        const p = reflexe(c);
        return { ...p, partie: { ...p.partie, graine: 4321 } };
      }),
    );
    const resume = (p: typeof a) =>
      p.competences
        .filter((l) => l.competence.code !== "R7")
        .map((l) => [l.competence.code, l.score, l.intervalle, l.confiance]);
    expect(resume(b)).toEqual(resume(a));
  });

  it("calcule toujours le même intervalle pour le même profil", () => {
    const parties = [...QUATRE.map((c) => reflexe(c)), bienJouee("projet-qui-glisse")];
    const a = construireProfil(parties).competences.map((l) => l.intervalle);
    expect(construireProfil(parties).competences.map((l) => l.intervalle)).toEqual(a);
  });

  it("applique les seuils de confiance du rapport", () => {
    expect(niveauDeConfiance(1, 1, 5, 0)).toBe("aucun");
    expect(niveauDeConfiance(2, 1, 2.5, 0)).toBe("aucun");
    expect(niveauDeConfiance(2, 1, 3, 50)).toBe("indicatif");
    expect(niveauDeConfiance(4, 3, 6, 30)).toBe("etabli");
    expect(niveauDeConfiance(4, 3, 6, 31)).toBe("indicatif");
    expect(niveauDeConfiance(6, 4, 10, 20)).toBe("solide");
    expect(niveauDeConfiance(6, 3, 10, 20)).toBe("etabli");
  });

  it("ne note pas encore le calibrage, mais en montre les observations", () => {
    const profil = construireProfil(QUATRE.map((c) => bienJouee(c)));
    const r7 = ligne(profil, "R7");
    expect(r7.score).toBeNull();
    expect(r7.preuve).toMatch(/4 prévisions : 4 justes/);
  });
});

describe("les phrases du profil", () => {
  it("décrivent des décisions, jamais la personne", () => {
    const profils = [
      construireProfil(QUATRE.map((c) => bienJouee(c))),
      construireProfil(QUATRE.map((c) => reflexe(c))),
      construireProfil([]),
    ];
    const interdits =
      /vous êtes|personnalit|potentiel|talent|leader|impulsi|analytique|aversion|tempérament|caractère|niveau réel/i;
    for (const p of profils) {
      const textes = [
        ...p.competences.map((l) => l.preuve),
        p.robustesse.phrase,
        p.risque.phrase,
        p.cible?.pourquoi ?? "",
        ...p.recommandations.map((r) => r.raison),
        MENTION.replace("ni la personnalité, ni le potentiel", ""),
      ];
      for (const t of textes) expect(t).not.toMatch(interdits);
    }
  });

  it("disent où observer une compétence qu'aucun épisode joué n'observe", () => {
    const profil = construireProfil([bienJouee("depot-qui-deborde")]);
    const sans = profil.competences.filter((l) => l.observations.length === 0);
    for (const l of sans) {
      expect(l.preuve).toMatch(/Aucun épisode joué/);
      expect(l.ouLObserver.length, l.competence.code).toBeGreaterThan(0);
      expect(l.ouLObserver).not.toContain("depot-qui-deborde");
    }
  });
});

describe("la progression", () => {
  it("ne parle de progrès que quand les premiers et les derniers ne se recouvrent plus", () => {
    expect(comparer([0.5, 0.6]).verdict).toBe("insuffisant");
    expect(comparer([0.5, 0.6, 0.8, 0.9]).verdict).toBe("progres");
    expect(comparer([0.5, 0.85, 0.8, 0.9]).verdict).toBe("stable");
    expect(comparer([0.9, 0.95, 0.4, 0.5]).verdict).toBe("recul");
    expect(comparer([0.4, 0.5, 0.45, 0.6, 0.9, 0.95]).verdict).toBe("progres");
  });

  it("suit la qualité, la robustesse et les réflexes, épisode après épisode", () => {
    const profil = construireProfil([
      ...QUATRE.slice(0, 2).map((c) => reflexe(c)),
      ...QUATRE.slice(2).map((c) => bienJouee(c)),
    ]);
    const pts = profil.progression.points;
    expect(pts.map((p) => p.code)).toEqual(QUATRE);
    expect(pts[3]!.qualite).toBe(1);
    expect(pts[0]!.reflexes!).toBeGreaterThan(0);
    expect(profil.progression.qualite.verdict).toBe("progres");
  });
});

describe("la recommandation", () => {
  it("propose le bilan d'entrée à qui n'a rien joué", () => {
    const profil = construireProfil([]);
    expect(profil.cible).toBeNull();
    expect(profil.recommandations.map((r) => r.code)).toEqual([...BILAN_D_ENTREE]);
  });

  it("vise la compétence la moins observée tant que le profil a moins de six épisodes", () => {
    const profil = construireProfil(QUATRE.map((c) => bienJouee(c)));
    const notees = profil.competences.filter((l) => l.competence.score);
    const minimum = Math.min(...notees.map((l) => l.points));
    expect(ligne(profil, profil.cible!.competence).points).toBe(minimum);
    expect(profil.recommandations.length).toBeGreaterThan(0);
    expect(profil.recommandations.length).toBeLessThanOrEqual(3);
    for (const r of profil.recommandations) {
      expect(QUATRE).not.toContain(r.code);
      expect(r.competence).toBe(profil.cible!.competence);
      expect(ceQuObserve(episodeParCode(r.code)!, r.competence).poids).toBeGreaterThan(0);
      expect(r.raison).toMatch(/Famille « .+ », (jamais jouée|déjà jouée \d+ fois)\. Difficulté/);
    }
  });

  it("ne propose les épisodes de direction qu'à qui en a déjà joué un", () => {
    // Toutes les familles de direction, de tous les secteurs : un épisode de
    // direction d'un autre secteur peut passer devant ceux du premier.
    const direction = FAMILLES.filter((f) => f.direction).flatMap((f) => f.episodes);
    expect(direction.length).toBeGreaterThan(0);
    // R3 est observé au premier plan par chacun d'eux : sans la règle, ils seraient proposés.
    const manager = construireProfil(
      QUATRE.map((c) => bienJouee(c)),
      undefined,
      { objectif: "R3" },
    );
    expect(manager.recommandations.length).toBeGreaterThan(0);
    for (const r of manager.recommandations) expect(direction).not.toContain(r.code);
    const directeur = construireProfil(
      [...QUATRE, direction[0]!].map((c) => bienJouee(c)),
      undefined,
      { objectif: "R3" },
    );
    expect(directeur.recommandations.some((r) => direction.includes(r.code))).toBe(true);
  });

  it("ne repropose jamais un épisode déjà joué, même en Découverte", () => {
    const parties = [...QUATRE, ...BILAN_D_ENTREE].map((c) =>
      bienJouee(c, { niveau: "decouverte" }),
    );
    const profil = construireProfil(parties);
    expect(profil.recommandations.length).toBeGreaterThan(0);
    for (const r of profil.recommandations)
      expect(parties.map((p) => p.code)).not.toContain(r.code);
  });
});

describe("les données de la recommandation", () => {
  it("donnent une difficulté à chacun des épisodes", () => {
    expect(Object.keys(DIFFICULTES).sort()).toEqual(EPISODES.map((e) => e.code).sort());
  });

  it("font observer le diagnostic, la révision et la prévision par chaque épisode", () => {
    for (const ep of EPISODES as readonly Episode[]) {
      for (const c of ["R2", "R3", "R7"] as const) {
        expect(ceQuObserve(ep, c).poids, `${ep.code} ${c}`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe("la personnalisation du parcours", () => {
  it("suit la compétence que la personne a choisie, même si le profil en visait une autre", () => {
    const parties = QUATRE.map((c) => bienJouee(c));
    const parDefaut = construireProfil(parties);
    const autre = OBJECTIFS_POSSIBLES.find((c) => c !== parDefaut.cible!.competence)!;
    const choisi = construireProfil(parties, undefined, { objectif: autre });
    expect(choisi.cible).toMatchObject({ competence: autre, choisie: true });
    expect(choisi.cible!.pourquoi).toMatch(/^Vous avez choisi de travailler « .+ »/);
    expect(choisi.recommandations.length).toBeGreaterThan(0);
    for (const r of choisi.recommandations) {
      expect(r.competence).toBe(autre);
      expect(ceQuObserve(episodeParCode(r.code)!, autre).poids).toBeGreaterThan(0);
    }
    expect(parDefaut.cible!.choisie).toBe(false);
  });

  it("vaut dès la première partie, avant même le bilan d'entrée", () => {
    const profil = construireProfil([], undefined, { objectif: "R9" });
    expect(profil.cible).toMatchObject({ competence: "R9", choisie: true });
    expect(profil.recommandations.map((r) => r.code)).not.toEqual([...BILAN_D_ENTREE]);
  });

  it("ignore un objectif qu'on ne peut pas choisir : le calibrage, ou un code inconnu", () => {
    expect(OBJECTIFS_POSSIBLES).not.toContain("R7");
    for (const objectif of ["R7", "R42"] as const) {
      const p = construireProfil([], undefined, { objectif: objectif as "R7" });
      expect(p.cible).toBeNull();
    }
  });

  it("conseille un niveau d'après les deux derniers épisodes, et dit pourquoi", () => {
    const point = (qualite: number) => ({
      code: "x",
      numero: 1,
      date: "",
      niveau: "standard",
      qualite,
      robustesse: 0.5,
      reflexes: null,
    });
    expect(conseillerUnNiveau([]).niveau).toBe("standard");
    expect(conseillerUnNiveau([point(0.95)]).niveau).toBe("standard");
    expect(conseillerUnNiveau([point(0.2), point(0.85), point(0.9)])).toMatchObject({
      niveau: "expert",
    });
    expect(conseillerUnNiveau([point(0.9), point(0.3), point(0.4)]).niveau).toBe("decouverte");
    expect(conseillerUnNiveau([point(0.6), point(0.7)]).niveau).toBe("standard");
    expect(conseillerUnNiveau([point(0.3), point(0.4)]).pourquoi).toMatch(
      /35 % de qualité.*ne compteront dans votre profil/,
    );
  });

  it("propose l'Expert à qui suit la meilleure référence, pas à qui prend les réflexes", () => {
    const bon = construireProfil(QUATRE.map((c) => bienJouee(c)));
    const reflexes = construireProfil(QUATRE.map((c) => reflexe(c)));
    expect(bon.conseil.niveau).toBe("expert");
    expect(reflexes.conseil.niveau).not.toBe("expert");
    expect(reflexes.conseil.pourquoi).toMatch(/Vos deux derniers épisodes : \d+ % de qualité/);
  });
});

describe("la difficulté des épisodes", () => {
  const decomptes = EPISODES.map((ep) => ({ ep, d: decompterLaDifficulte(ep) }));

  it("suit une seule règle pour tous les épisodes", () => {
    for (const { ep, d } of decomptes) {
      expect(DIFFICULTES[ep.code], ep.code).toBe(difficulteDesPoints(d.points));
    }
  });

  it("garde en dernier les épisodes qui départagent mal, et seulement eux", () => {
    expect([...PEU_DISCRIMINANTS].sort()).toEqual(
      decomptes
        .filter(({ d }) => departageMal(d))
        .map(({ ep }) => ep.code)
        .sort(),
    );
  });
});
