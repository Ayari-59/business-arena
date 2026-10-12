import { describe, expect, it } from "vitest";
import {
  bandeauDeLEssai,
  CLES_DE_JEU_DU_PROFIL,
  EXPLICATION_DU_TOUR_D_ESSAI,
  enEssai,
  graineDEssai,
  lireLEssai,
  lireLeChoixDEssai,
  profilDeDepart,
  scenarioDEssai,
  tourAffiche,
  TOURS_D_ESSAI,
  type TourDEssai,
} from "@/config/tour-d-essai";
import { SCENARIO_CHOICES, scenarioByCode } from "@/config/scenarios/registry";
import { composerLeScenarioJoue } from "@/config/scenarios/scenario-joue";

/**
 * LE TOUR D'ESSAI, CE QUI SE DÉCIDE SANS BASE (config/tour-d-essai.ts) : la graine de
 * l'essai, son scénario, la remise du profil à l'état de départ, la numérotation et le
 * bandeau que les équipes lisent. Le parcours complet, base comprise, est gardé par
 * tests/integration/tour-d-essai.test.ts.
 */

const essai = (phase: TourDEssai["phase"], tours: 1 | 2 = 2): TourDEssai => ({
  tours,
  enchainement: "manuel",
  phase,
  graine: 1234,
});

describe("la graine de l'essai", () => {
  it("n'est jamais celle de la vraie partie, et reste dans les bornes des graines", () => {
    for (const graine of [1, 2, 7, 42, 4242, 65_535, 1_000_003, 2 ** 31 - 2, 2 ** 31 - 1]) {
      const g = graineDEssai(graine);
      expect(g, `graine ${graine}`).not.toBe(graine);
      expect(Number.isInteger(g)).toBe(true);
      expect(g).toBeGreaterThanOrEqual(1);
      expect(g).toBeLessThanOrEqual(2 ** 31 - 1);
    }
  });

  it("est déterministe : un monde à graine imposée garde un essai reproductible", () => {
    expect(graineDEssai(4242)).toBe(graineDEssai(4242));
    expect(graineDEssai(4242)).not.toBe(graineDEssai(4243));
  });

  it("ne dévoile pas le monde variable de la vraie partie", () => {
    const base = scenarioByCode("nova").scenario;
    const reglages = { scenario: base, variableWorld: true, concurrents: 4, periodicity: "quarter" as const };
    const reel = composerLeScenarioJoue({ ...reglages, seed: 4242 });
    const deLEssai = composerLeScenarioJoue({ ...reglages, seed: graineDEssai(4242) });
    expect(deLEssai.market).not.toEqual(reel.market);
  });
});

describe("le scénario de l'essai", () => {
  it("se joue sur les seuls tours d'essai, sans aucun événement scripté", () => {
    for (const def of SCENARIO_CHOICES) {
      const avecHistoires = composerLeScenarioJoue({
        scenario: def.scenario,
        seed: 5,
        level: 4,
        investmentStories: true,
        concurrents: 3,
        periodicity: "quarter",
      });
      for (const tours of TOURS_D_ESSAI) {
        const s = scenarioDEssai(avecHistoires, tours);
        expect(s.roundsCount, def.code).toBe(tours);
        expect(s.scriptedEvents, `${def.code} : un événement scripté rejoué à blanc`).toEqual([]);
        // Le reste du monde est celui de la partie : mêmes règles, mêmes écrans.
        expect(s.market).toEqual(avecHistoires.market);
        expect(s.events).toEqual(avecHistoires.events);
      }
    }
  });

  it("garde des événements scriptés au vrai tour 1 hors de l'essai", () => {
    const base = scenarioByCode("nova").scenario;
    const avecUnScript = { ...base, scriptedEvents: [{ round: 1, eventCode: base.events[0]!.code }] };
    expect(scenarioDEssai(avecUnScript, 1).scriptedEvents).toEqual([]);
    expect(avecUnScript.scriptedEvents, "le scénario réel n'est pas touché").toHaveLength(1);
  });
});

describe("la remise à l'état initial", () => {
  it("le profil de la partie perd tout son état de jeu, et garde ses réglages", () => {
    const profil = {
      level: 3,
      periodicity: "quarter",
      kind: "class",
      quizMode: "model",
      answerFormat: "open",
      missedSituationPolicy: "readonly",
      variableWorld: true,
      activeEvents: [{ code: "x", roundsLeft: 2 }],
      pendingEvents: [{ code: "y", teamId: null }],
      pendingEventCodes: ["z"],
      gazette: { parus: { "1": { tour: 1 } }, enseignant: {} },
    };
    const depart = profilDeDepart(profil);
    for (const cle of CLES_DE_JEU_DU_PROFIL) expect(depart, cle).not.toHaveProperty(cle);
    expect(depart).toEqual({
      level: 3,
      periodicity: "quarter",
      kind: "class",
      quizMode: "model",
      answerFormat: "open",
      missedSituationPolicy: "readonly",
      variableWorld: true,
    });
    expect(profil.activeEvents, "le profil lu n'est pas modifié").toHaveLength(1);
  });
});

describe("la numérotation affichée", () => {
  it("pendant l'essai : « Tour d'essai 1/2 » ; ensuite, la vraie partie repart à 1", () => {
    expect(tourAffiche({ essai: essai("en_cours"), tour: 1, tours: 2 })).toBe("Tour d'essai 1/2");
    expect(tourAffiche({ essai: essai("en_cours"), tour: 2, tours: 2 })).toBe("Tour d'essai 2/2");
    expect(tourAffiche({ essai: essai("termine", 1), tour: 1, tours: 1 })).toBe("Tour d'essai 1/1");
    expect(tourAffiche({ essai: essai("fini"), tour: 1, tours: 6 })).toBe("Tour 1/6");
    expect(tourAffiche({ essai: null, tour: 3, tours: 6 })).toBe("Tour 3/6");
  });

  it("le bandeau dit l'essai, puis le départ de la vraie partie, puis se tait", () => {
    expect(bandeauDeLEssai({ essai: essai("en_cours"), tour: 2, vraiTourJoue: false })?.titre).toBe(
      "Tour d'essai 2/2 · ne compte pas",
    );
    expect(bandeauDeLEssai({ essai: essai("termine"), tour: 2, vraiTourJoue: false })?.titre).toBe(
      "Tour d'essai terminé · ne compte pas",
    );
    expect(bandeauDeLEssai({ essai: essai("fini"), tour: 1, vraiTourJoue: false })?.titre).toBe(
      "La vraie partie commence",
    );
    expect(bandeauDeLEssai({ essai: essai("fini"), tour: 1, vraiTourJoue: true })).toBeNull();
    expect(bandeauDeLEssai({ essai: essai("fini"), tour: 2, vraiTourJoue: true })).toBeNull();
    expect(bandeauDeLEssai({ essai: null, tour: 1, vraiTourJoue: false })).toBeNull();
  });

  it("la prose ne porte ni tiret en milieu de phrase ni chiffre écrit à la main", () => {
    const textes = [
      EXPLICATION_DU_TOUR_D_ESSAI,
      ...(["en_cours", "termine", "fini"] as const).flatMap((p) => {
        const b = bandeauDeLEssai({ essai: essai(p), tour: 1, vraiTourJoue: false })!;
        return [b.texte];
      }),
    ];
    for (const t of textes) {
      expect(t).not.toMatch(/\s[-–—]\s/);
      expect(t).not.toMatch(/\d/);
    }
  });
});

describe("la lecture de l'essai et du formulaire", () => {
  it("« aucun » reste le défaut, et toute valeur inconnue aussi", () => {
    expect(lireLeChoixDEssai("", null)).toBeUndefined();
    expect(lireLeChoixDEssai(null, "on")).toBeUndefined();
    expect(lireLeChoixDEssai("3", null)).toBeUndefined();
    expect(lireLeChoixDEssai("1", null)).toEqual({ tours: 1, enchainement: "manuel" });
    expect(lireLeChoixDEssai("2", "on")).toEqual({ tours: 2, enchainement: "auto" });
  });

  it("une partie sans essai, ou à l'essai illisible, n'est pas en essai", () => {
    expect(lireLEssai(null)).toBeNull();
    expect(lireLEssai({ tours: 5, phase: "en_cours", graine: 1 })).toBeNull();
    expect(enEssai({ essai: null })).toBe(false);
    expect(enEssai({ essai: essai("en_cours") })).toBe(true);
    expect(enEssai({ essai: essai("termine") })).toBe(true);
    expect(enEssai({ essai: essai("bascule") })).toBe(true);
    expect(enEssai({ essai: essai("fini") })).toBe(false);
  });
});
