import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SCENARIOS, SECTOR_LABELS } from "@/config/scenarios/registry";
import { DIFFICULTY_PRESETS, QUIZ_MODES } from "@/config/difficulty";
import { MISSED_POLICY_LABELS, MISSED_POLICY_HELP } from "@/config/missed-situation";
import { BPI_V2_DIMENSIONS, V2_DIMENSION_LABELS, scoringWeightsV2 } from "@/scoring/bpi";
import { champsOuverts } from "@/config/duree-du-tour";
import { manuel, type FaitsDuManuel } from "@/config/manuel";

/**
 * LE MANUEL NE RECOPIE RIEN.
 *
 * Un manuel qui écrit « sept secteurs » est faux le jour où un huitième
 * arrive, et personne ne s'en aperçoit parce qu'aucun test ne lit la prose.
 * Ces gardes vérifient que les listes viennent des registres, et que le manuel
 * n'envoie pas chercher un écran qui n'existe pas.
 */

const ref = SCENARIOS[0]!;
const poids = scoringWeightsV2(ref.scenario.scoring);
const hints = ref.situations[0]?.hints ?? [];

const FAITS: FaitsDuManuel = {
  scenarios: SCENARIOS.map((s) => ({
    nom: s.shortName ?? s.title,
    secteur: SECTOR_LABELS[s.sector],
    accroche: s.tagline,
  })),
  niveaux: DIFFICULTY_PRESETS.map((p) => ({
    rang: p.level,
    nom: p.name,
    accroche: p.tagline,
    champs: champsOuverts(p.decisions),
  })),
  dimensions: BPI_V2_DIMENSIONS.map((d) => ({ nom: V2_DIMENSION_LABELS[d], poids: poids[d] })),
  scenarioDesPoids: ref.shortName ?? ref.title,
  modesDeQuestions: QUIZ_MODES.map((m) => ({ nom: m.name, aide: m.help })),
  situationsManquees: (
    Object.keys(MISSED_POLICY_LABELS) as (keyof typeof MISSED_POLICY_LABELS)[]
  ).map((k) => ({ nom: MISSED_POLICY_LABELS[k], aide: MISSED_POLICY_HELP[k] })),
  scoreRestantParIndice: hints.map((_, i) =>
    Math.max(0.2, 1 - hints.slice(0, i + 1).reduce((t, h) => t + h.costRatio, 0)),
  ),
  adresse: "www.business-arena.fr/join",
};

const chapitres = manuel(FAITS);
const tout = JSON.stringify(chapitres);

describe("la structure", () => {
  it("couvre le cycle complet, du principe au dépannage", () => {
    const ids = chapitres.map((c) => c.id);
    expect(ids[0]).toBe("principe");
    expect(ids[ids.length - 1]).toBe("depannage");
    for (const attendu of ["scenarios", "entree", "tour-eleve", "animer", "resultats"]) {
      expect(ids, attendu).toContain(attendu);
    }
  });

  it("chaque chapitre s'annonce et porte quelque chose", () => {
    for (const c of chapitres) {
      expect(c.titre.length, c.id).toBeGreaterThan(8);
      expect(c.chapeau.length, c.id).toBeGreaterThan(30);
      expect(c.blocs.length, c.id).toBeGreaterThan(0);
    }
  });

  it("aucun tableau n'a de ligne dépareillée", () => {
    for (const c of chapitres) {
      for (const b of c.blocs) {
        if (b.type !== "table") continue;
        for (const ligne of b.lignes ?? []) {
          expect(ligne.length, `${c.id} · ${b.titre}`).toBe((b.colonnes ?? []).length);
        }
      }
    }
  });
});

describe("les chiffres viennent des registres", () => {
  it("tous les scénarios du registre sont au tableau, aucun de plus", () => {
    const table = chapitres
      .flatMap((c) => c.blocs)
      .find((b) => b.type === "table" && b.titre?.includes("secteurs"));
    expect(table?.lignes).toHaveLength(SCENARIOS.length);
    for (const s of SCENARIOS) {
      expect(tout, s.shortName ?? s.title).toContain(s.shortName ?? s.title);
    }
  });

  it("les niveaux portent le compte de champs calculé, pas un compte écrit", () => {
    const table = chapitres
      .flatMap((c) => c.blocs)
      .find((b) => b.type === "table" && b.titre === "Les niveaux");
    expect(table?.lignes).toHaveLength(DIFFICULTY_PRESETS.length);
    for (const p of DIFFICULTY_PRESETS) {
      const ligne = table!.lignes!.find((l) => l[0] === String(p.level))!;
      expect(ligne[2], `niveau ${p.level}`).toBe(String(champsOuverts(p.decisions)));
    }
  });

  it("l'IPG expose ses dimensions courantes et des poids qui font 100 %", () => {
    const table = chapitres
      .flatMap((c) => c.blocs)
      .find((b) => b.type === "table" && b.titre?.includes("dimensions"));
    expect(table?.lignes).toHaveLength(BPI_V2_DIMENSIONS.length);
    const somme = BPI_V2_DIMENSIONS.reduce((t, d) => t + poids[d], 0);
    expect(somme).toBeCloseTo(1, 5);
    // Le scénario dont viennent les poids est nommé : sinon on les prend pour
    // une règle générale, alors qu'ils se règlent par scénario.
    expect(tout).toContain(FAITS.scenarioDesPoids);
  });

  it("le barème des indices annonce ce qui reste, lu sur une situation réelle", () => {
    const dernier = FAITS.scoreRestantParIndice[FAITS.scoreRestantParIndice.length - 1]!;
    expect(dernier).toBeGreaterThan(0.5);
    expect(tout).toContain(`${Math.round(dernier * 100)} %`);
  });

  it("aucun nombre de secteurs écrit en toutes lettres", () => {
    expect(tout).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+secteurs?\b/i);
  });
});

describe("il n'envoie pas chercher ce qui n'existe pas", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("chaque écran cité porte son intitulé exact dans le code", () => {
    const pilotage = lire("src/app/teacher/games/[gameId]/page.tsx");
    const projection = lire("src/components/vue-de-projection.tsx");
    for (const [ecran, source] of [
      ["Projeter pour la classe", pilotage],
      ["Composition des équipes", pilotage],
      ["Planning des tours", pilotage],
      ["Observation de séance", pilotage],
      ["Code d'entrée", projection],
    ] as const) {
      expect(tout, `${ecran} : cité par le manuel`).toContain(ecran);
      expect(source, `${ecran} : absent de l'écran`).toContain(ecran);
    }
  });

  it("la page lit les registres plutôt que de recopier", () => {
    const page = lire("src/app/teacher/manuel/page.tsx");
    for (const source of [
      "SCENARIOS.map",
      "DIFFICULTY_PRESETS.map",
      "BPI_V2_DIMENSIONS.map",
      "QUIZ_MODES.map",
      "champsOuverts",
    ]) {
      expect(page, source).toContain(source);
    }
  });

  it("elle s'imprime, et l'espace enseignant y mène", () => {
    const page = lire("src/app/teacher/manuel/page.tsx");
    expect(page).toContain('data-theme="clair"');
    expect(page).toContain("@page { size: A4 portrait");
    expect(lire("src/components/en-tete-enseignant.tsx")).toContain("/teacher/manuel");
  });
});
