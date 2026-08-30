import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  diplomesProposes,
  OBJECTIFS,
  recommander,
  type Semestre,
} from "../../src/config/orientation";
import { ATELIERS } from "../../src/config/ateliers";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";

/**
 * L'orientation vers la bonne simulation.
 *
 * Elle rend un réglage complet, et le pire défaut possible serait qu'elle en
 * rende un impossible à créer : un secteur inconnu, un niveau qui n'existe pas,
 * une partie plus longue que le secteur ne le permet. L'enseignant le
 * découvrirait au moment de créer sa partie, après avoir fait confiance à la
 * page.
 *
 * On éprouve donc TOUTES les combinaisons, pas un échantillon : elles sont peu
 * nombreuses, et une seule qui casse suffit à décevoir.
 */
const SEMESTRES: Semestre[] = ["s1", "s2"];
const COMBINAISONS = diplomesProposes().flatMap((d) =>
  SEMESTRES.flatMap((s) => OBJECTIFS.map((o) => ({ diplome: d.code, semestre: s, objectif: o.code }))),
);

describe("orientation", () => {
  it("chaque combinaison rend un réglage réellement créable", () => {
    expect(COMBINAISONS.length).toBeGreaterThan(50);
    for (const demande of COMBINAISONS) {
      const r = recommander(demande);
      const contexte = `${demande.diplome}/${demande.semestre}/${demande.objectif}`;
      expect(
        SCENARIOS.some((s) => s.code === r.scenarioCode),
        `${contexte} : secteur inconnu « ${r.scenarioCode} »`,
      ).toBe(true);
      expect(
        DIFFICULTY_PRESETS.some((p) => p.level === r.niveau && p.name === r.niveauNom),
        `${contexte} : niveau ${r.niveau} · ${r.niveauNom} inexistant`,
      ).toBe(true);
      expect(r.tours, `${contexte} : durée nulle`).toBeGreaterThan(0);
      expect(
        r.tours,
        `${contexte} : ${r.tours} tours pour un secteur qui n'en porte que ${scenarioByCode(r.scenarioCode).scenario.roundsCount}`,
      ).toBeLessThanOrEqual(scenarioByCode(r.scenarioCode).scenario.roundsCount);
      expect(["month", "quarter", "year"], contexte).toContain(r.periodicite);
    }
  });

  it("chaque recommandation dit ses raisons", () => {
    // Une recommandation sans raisons ne se discute pas, donc ne s'adopte pas :
    // l'enseignant la suit sans comprendre, ou l'ignore.
    for (const demande of COMBINAISONS) {
      const r = recommander(demande);
      const contexte = `${demande.diplome}/${demande.semestre}/${demande.objectif}`;
      expect(r.pourquoi.length, `${contexte} : aucune raison`).toBeGreaterThanOrEqual(2);
      for (const raison of r.pourquoi) {
        expect(raison.length, `${contexte} : raison trop courte`).toBeGreaterThan(40);
      }
    }
  });

  it("le premier semestre n'est jamais plus exigeant que le second", () => {
    // La règle qui structure tout : au premier semestre, la classe découvre
    // l'outil en même temps que la matière.
    for (const d of diplomesProposes()) {
      for (const o of OBJECTIFS) {
        const s1 = recommander({ diplome: d.code, semestre: "s1", objectif: o.code });
        const s2 = recommander({ diplome: d.code, semestre: "s2", objectif: o.code });
        const contexte = `${d.code}/${o.code}`;
        expect(s1.niveau, `${contexte} : niveau plus élevé au premier semestre`).toBeLessThanOrEqual(
          s2.niveau,
        );
        expect(s1.tours, `${contexte} : partie plus longue au premier semestre`).toBeLessThanOrEqual(
          s2.tours,
        );
      }
    }
  });

  it("l'atelier proposé est celui du diplôme, ou aucun", () => {
    for (const d of diplomesProposes()) {
      const r = recommander({ diplome: d.code, semestre: "s2", objectif: OBJECTIFS[0]!.code });
      if (d.code === "autre") {
        expect(r.atelierCode, "un atelier proposé à un diplôme inconnu").toBeNull();
      } else {
        expect(r.atelierCode, `${d.code} : atelier absent`).toBe(d.code);
        expect(ATELIERS.some((a) => a.code === r.atelierCode)).toBe(true);
      }
    }
  });

  it("le plancher d'un objectif n'est jamais franchi", () => {
    // Défaut trouvé en essayant de casser la garde précédente, qui était trop
    // étroite : la règle du premier semestre abaissait le niveau d'un cran SANS
    // regarder le minimum de l'objectif. « La trésorerie et le BFR » tombait
    // ainsi sur un niveau qui n'ouvre pas le financement, et l'enseignant
    // serait allé chercher une banque absente de sa partie.
    for (const demande of COMBINAISONS) {
      const o = OBJECTIFS.find((x) => x.code === demande.objectif)!;
      const r = recommander(demande);
      expect(
        r.niveau,
        `${demande.diplome}/${demande.semestre}/${o.code} : niveau ${r.niveau} sous le minimum ${o.niveauMinimum}`,
      ).toBeGreaterThanOrEqual(o.niveauMinimum);
    }
  });

  it("un objectif qui parle d'argent reçoit un niveau qui ouvre le financement", () => {
    // La garde qui compte vraiment : elle ne lit pas le minimum déclaré, qui
    // peut être baissé par erreur, mais ce que l'objectif PROMET à l'enseignant.
    const EXIGENCES = [
      { mots: /trésorerie|financement|bfr|emprunt/i, levier: "finance" as const },
      { mots: /risque|assurance|couverture/i, levier: "insurance" as const },
    ];
    for (const demande of COMBINAISONS) {
      const o = OBJECTIFS.find((x) => x.code === demande.objectif)!;
      const dit = `${o.libelle} ${o.raison}`;
      const r = recommander(demande);
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === r.niveau)!;
      for (const { mots, levier } of EXIGENCES) {
        if (!mots.test(o.libelle)) continue;
        expect(
          preset.decisions[levier],
          `${demande.semestre}/${o.code} : « ${dit.slice(0, 40)}… » au niveau ${r.niveau}, qui n'ouvre pas ${levier}`,
        ).toBe(true);
      }
    }
  });

  it("la page ne recopie ni les diplômes ni les objectifs", () => {
    const page = readFileSync("src/components/orientation-form.tsx", "utf-8");
    expect(page).toContain("diplomesProposes()");
    expect(page).toContain("OBJECTIFS");
    for (const a of ATELIERS) {
      expect(page, `« ${a.diplome} » est écrit en dur dans le formulaire`).not.toContain(a.diplome);
    }
  });
});
