import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  apercuDePhase,
  derouleConcours,
  etapeCourante,
  libelleApercuDePhase,
  nomDeLaPhase,
} from "@/config/concours";

/**
 * UN TOURNOI À TROIS PHASES.
 *
 * Le déroulé du concours était figé à quatre étapes — inscriptions, poules,
 * finale, podium — alors qu'un tournoi de campus en veut davantage :
 * préliminaires, demi-finales, finale. Ces tests décrivent ce qu'un
 * organisateur voit à chaque moment, et ce qui l'empêche de tirer une phase
 * qui ne trancherait rien.
 */

vi.mock("@/app/teacher/actions", () => ({
  startQualificationAction: vi.fn(),
  startIntermediateStageAction: vi.fn(),
  startFinalAction: vi.fn(),
  finishCompetitionAction: vi.fn(),
}));

const REGLES = { groupSize: 3, advancePerGroup: 1 };

function phase(
  kind: string,
  parties: number,
  format?: Record<string, unknown>,
  status = "finished",
) {
  return { kind, status, format: format ?? null, games: Array.from({ length: parties }, () => ({})) };
}

function concours(stages: ReturnType<typeof phase>[], status: string) {
  return { status, joinCode: "R4KT7B", entries: Array.from({ length: 8 }, () => ({})), stages, rules: REGLES };
}

describe("le nom d'une phase", () => {
  it("vient de son type, et du nom saisi quand il y en a un", () => {
    expect(nomDeLaPhase({ kind: "qualification" }, 1)).toBe("Qualifications");
    expect(nomDeLaPhase({ kind: "final" }, 3)).toBe("Finale");
    expect(nomDeLaPhase({ kind: "semifinal" }, 2)).toBe("Phase 2");
    expect(nomDeLaPhase({ kind: "semifinal", format: { nom: "Demi-finales" } }, 2)).toBe(
      "Demi-finales",
    );
    // Un nom vide ou blanc ne remplace pas le nom par défaut.
    expect(nomDeLaPhase({ kind: "semifinal", format: { nom: "   " } }, 2)).toBe("Phase 2");
    expect(nomDeLaPhase({ kind: "semifinal", format: { nom: 7 } }, 4)).toBe("Phase 4");
  });
});

describe("le déroulé suit les phases réellement créées", () => {
  it("avant le tirage, il annonce le plan par défaut", () => {
    const d = derouleConcours(concours([], "registration"));
    expect(d.etapes.map((e) => e.nom)).toEqual([
      "Inscriptions",
      "Qualifications",
      "Finale",
      "Podium",
    ]);
    expect(d.courante).toBe(0);
    expect(d.etapes[1]!.detail).toContain("poules de 3 équipes");
  });

  it("un tournoi à trois phases affiche cinq étapes, la demi-finale à son nom", () => {
    const stages = [
      phase("qualification", 4, { teamsPerGame: 2, advanceCount: 1 }),
      phase("semifinal", 2, { teamsPerGame: 2, advanceCount: 1, nom: "Demi-finales" }),
      phase("final", 1, { teamsPerGame: 2, advanceCount: 1 }, "running"),
    ];
    const d = derouleConcours(concours(stages, "running"));
    expect(d.etapes.map((e) => e.nom)).toEqual([
      "Inscriptions",
      "Qualifications",
      "Demi-finales",
      "Finale",
      "Podium",
    ]);
    // La finale est la phase en cours ; le podium reste à venir.
    expect(d.courante).toBe(3);
    expect(d.etapes.map((e) => e.etat)).toEqual([
      "passee",
      "passee",
      "passee",
      "courante",
      "a_venir",
    ]);
    expect(d.etapes[1]!.detail).toContain("4 poules de 2 équipes");
    expect(d.etapes[2]!.detail).toContain("2 poules de 2 équipes");
  });

  it("la demi-finale en cours n'efface pas la finale à venir", () => {
    const stages = [
      phase("qualification", 4, { teamsPerGame: 2, advanceCount: 1 }),
      phase("semifinal", 2, { teamsPerGame: 2, advanceCount: 1, nom: "Demi-finales" }, "running"),
    ];
    const d = derouleConcours(concours(stages, "running"));
    expect(d.etapes.map((e) => e.nom)).toEqual([
      "Inscriptions",
      "Qualifications",
      "Demi-finales",
      "Finale",
      "Podium",
    ]);
    expect(d.courante).toBe(2);
    expect(d.etapes[3]!.etat).toBe("a_venir");
  });

  it("un concours clos est au podium, quel que soit le nombre de phases", () => {
    const deux = [phase("qualification", 4), phase("final", 1)];
    const trois = [phase("qualification", 4), phase("semifinal", 2), phase("final", 1)];
    expect(etapeCourante({ status: "finished", stages: deux })).toBe(3);
    expect(etapeCourante({ status: "finished", stages: trois })).toBe(4);
    const d = derouleConcours(concours(trois, "finished"));
    expect(d.etapes[d.courante]!.nom).toBe("Podium");
    expect(d.etapes.every((e, i) => (i < d.courante ? e.etat === "passee" : true))).toBe(true);
  });
});

describe("l'aperçu d'une phase, avant de la tirer", () => {
  it("dit le nombre de poules, leur taille et les survivantes", () => {
    const a = apercuDePhase(8, 2, 1);
    expect(a).toMatchObject({ poules: 4, equipesParPoule: [2, 2, 2, 2], survivantes: 4 });
    expect(a.possible).toBe(true);
    expect(libelleApercuDePhase(a)).toBe(
      "4 poules de 2 équipes, 4 équipes encore en lice après cette phase.",
    );
  });

  it("répartit le reste comme le tirage, et le dit en fourchette", () => {
    // 7 équipes en poules de 3 : le quotient entier donne 2 poules, et la
    // septième va grossir l'une d'elles — pas une poule d'une seule équipe.
    const a = apercuDePhase(7, 3, 1);
    expect(a.poules).toBe(2);
    expect(a.equipesParPoule).toEqual([3, 4]);
    expect(a.survivantes).toBe(2);
    expect(libelleApercuDePhase(a)).toBe(
      "2 poules de 3 à 4 équipes, 2 équipes encore en lice après cette phase.",
    );
  });

  it("refuse une phase qui ne ferait qu'une poule : c'est une finale", () => {
    const a = apercuDePhase(3, 2, 1);
    expect(a.possible).toBe(false);
    expect(a.empechement).toContain("Lancez la finale");
    expect(libelleApercuDePhase(a)).toBe(a.empechement);
  });

  it("refuse une phase qui qualifierait toute sa plus petite poule", () => {
    const a = apercuDePhase(8, 4, 4);
    expect(a.possible).toBe(false);
    expect(a.empechement).toContain("ne trancherait rien");
  });

  it("deux poules qui qualifient chacune une équipe laissent toujours une finale", () => {
    for (let equipes = 4; equipes <= 24; equipes++) {
      for (let taille = 2; taille <= 6; taille++) {
        for (let qualifiees = 1; qualifiees <= 3; qualifiees++) {
          const a = apercuDePhase(equipes, taille, qualifiees);
          if (a.possible) expect(a.survivantes).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe("le contrôle « nouvelle phase »", () => {
  it("propose de lancer les demi-finales et montre l'aperçu", async () => {
    const { NouvellePhase } = await import("@/components/competition-controls");
    const html = renderToStaticMarkup(
      createElement(NouvellePhase, {
        competitionId: "c1",
        equipesEnLice: 8,
        taillePouleParDefaut: 2,
        qualifieesParDefaut: 1,
      }),
    );
    expect(html).toContain("Demi-finales");
    expect(html).toContain("4 poules de 2 équipes");
    expect(html).toContain("8 équipes qui sortent de la phase en cours");
    // L'attribut, pas les classes « disabled: » de Tailwind qui sont toujours là.
    expect(html).not.toContain('disabled=""');
  });

  it("grise le bouton quand la phase ne tranche rien, et dit pourquoi", async () => {
    const { NouvellePhase } = await import("@/components/competition-controls");
    const html = renderToStaticMarkup(
      createElement(NouvellePhase, {
        competitionId: "c1",
        equipesEnLice: 3,
        taillePouleParDefaut: 2,
        qualifieesParDefaut: 1,
      }),
    );
    expect(html).toContain("Lancez la finale");
    expect(html).toContain('disabled=""');
  });
});
