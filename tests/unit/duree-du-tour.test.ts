import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { SCENARIOS } from "@/config/scenarios/registry";
import {
  champsOuverts,
  dureeDuTour,
  MINUTES_ANALYSE_SITUATION,
  MINUTES_PRISE_EN_MAIN,
  signesDeCadrage,
  signesDeSituation,
} from "@/config/duree-du-tour";
import { DureeDuTourAffichee } from "@/components/duree-du-tour";

/**
 * COMBIEN DE TEMPS PREND UN TOUR.
 *
 * L'enseignant pose une fenêtre, annonce un temps, décide s'il fait un tour ou
 * deux dans l'heure — sans rien pour trancher, alors que l'application connaît
 * le texte qu'elle fait lire et les champs qu'elle fait remplir.
 */

const FAITS = {
  signesDeCadrage: 900,
  signesDeSituation: 900,
  champs: 10,
  premierTour: false,
  avecQuiz: true,
};

describe("le modèle", () => {
  it("ne compte le cadrage qu'au premier tour : ensuite il est connu", () => {
    const apres = dureeDuTour(FAITS);
    const premier = dureeDuTour({ ...FAITS, premierTour: true });
    expect(apres.lecture).toBe(1); // 900 signes de situation
    expect(premier.lecture).toBe(2); // + 900 de cadrage
  });

  it("la prise en main ne se paie qu'une fois", () => {
    expect(dureeDuTour({ ...FAITS, premierTour: true }).priseEnMain).toBe(MINUTES_PRISE_EN_MAIN);
    expect(dureeDuTour(FAITS).priseEnMain).toBe(0);
  });

  it("sans situation ce tour, rien à analyser, même questions activées", () => {
    const sans = dureeDuTour({ ...FAITS, signesDeSituation: 0 });
    expect(sans.analyse).toBe(0);
    expect(dureeDuTour(FAITS).analyse).toBe(MINUTES_ANALYSE_SITUATION);
  });

  it("questions coupées : l'analyse tombe, la lecture reste", () => {
    const sans = dureeDuTour({ ...FAITS, avecQuiz: false });
    expect(sans.analyse).toBe(0);
    expect(sans.lecture).toBe(dureeDuTour(FAITS).lecture);
  });

  it("le total est la somme de ses postes, et jamais nul", () => {
    const d = dureeDuTour({ ...FAITS, premierTour: true });
    expect(d.minutes).toBe(d.lecture + d.saisie + d.analyse + d.priseEnMain);
    expect(dureeDuTour({ signesDeCadrage: 0, signesDeSituation: 0, champs: 0, premierTour: false, avecQuiz: false }).minutes).toBe(1);
  });
});

describe("les champs comptés sont ceux du formulaire", () => {
  const presets = DIFFICULTY_PRESETS as unknown as {
    level: number;
    decisions: Record<string, boolean>;
  }[];

  it("le niveau 1 n'ouvre que le socle, le niveau 6 tout le reste", () => {
    const parNiveau = new Map(presets.map((p) => [p.level, champsOuverts(p.decisions)]));
    expect(parNiveau.get(1)).toBe(4); // prix, volume, communication, note
    expect(parNiveau.get(6)).toBe(23);
  });

  it("le compte croît avec le niveau, sans jamais redescendre", () => {
    const suite = [...presets].sort((a, b) => a.level - b.level).map((p) => champsOuverts(p.decisions));
    for (let i = 1; i < suite.length; i++) expect(suite[i]!).toBeGreaterThanOrEqual(suite[i - 1]!);
  });
});

describe("appliqué aux scénarios réels", () => {
  const scenarios = SCENARIOS as unknown as Record<string, unknown>[];
  const niveau3 = (DIFFICULTY_PRESETS as unknown as { level: number; decisions: Record<string, boolean> }[])
    .find((p) => p.level === 3)!;

  it("un tour tient dans une heure de cours, premier tour compris", () => {
    // La garde de l'audit : si un tour dépasse l'heure, la séance ne rentre
    // plus et c'est le contenu qu'il faut couper, pas l'estimation.
    for (const s of scenarios) {
      for (const tour of [1, 2, 3, 4]) {
        const d = dureeDuTour({
          signesDeCadrage: signesDeCadrage(s),
          signesDeSituation: signesDeSituation(
            (s.situations as Parameters<typeof signesDeSituation>[0]) ?? [],
            tour,
          ),
          champs: champsOuverts(niveau3.decisions),
          premierTour: tour === 1,
          avecQuiz: true,
        });
        expect(d.minutes, `${String(s.code)} tour ${tour}`).toBeLessThanOrEqual(55);
      }
    }
  });

  it("le premier tour coûte nettement plus que les suivants", () => {
    const s = scenarios[0]!;
    const commun = {
      signesDeCadrage: signesDeCadrage(s),
      champs: champsOuverts(niveau3.decisions),
      avecQuiz: true,
    };
    const sit = (tour: number) =>
      signesDeSituation((s.situations as Parameters<typeof signesDeSituation>[0]) ?? [], tour);
    const premier = dureeDuTour({ ...commun, signesDeSituation: sit(1), premierTour: true });
    const suivant = dureeDuTour({ ...commun, signesDeSituation: sit(3), premierTour: false });
    expect(premier.minutes).toBeGreaterThan(suivant.minutes + 5);
  });

  it("ne compte que les situations du tour dit : une détection ne se prévoit pas", () => {
    const s = scenarios.find((x) =>
      (x.situations as { trigger?: { detect?: string } }[]).some((sit) => sit.trigger && "detect" in sit.trigger),
    )!;
    const situations = s.situations as Parameters<typeof signesDeSituation>[0];
    const detectees = situations.filter((sit) => sit.trigger && "detect" in sit.trigger);
    expect(detectees.length).toBeGreaterThan(0);
    // Aucune ne tombe dans un tour : leur texte n'entre jamais dans le calcul.
    const total = [1, 2, 3, 4, 5, 6].reduce((t, r) => t + signesDeSituation(situations, r), 0);
    const toutes = signesDeSituation(
      situations.map((sit) => ({ ...sit, trigger: { round: 1 } })),
      1,
    );
    expect(total).toBeLessThan(toutes);
  });
});

describe("ce que l'enseignant lit", () => {
  const estimation = dureeDuTour({ ...FAITS, premierTour: true });

  it("sans mesure : le chiffre, son détail, et d'où il sort", () => {
    const html = renderToStaticMarkup(
      createElement(DureeDuTourAffichee, { estimation, mesure: null, libelleTourMesure: null }),
    );
    expect(html).toContain("Comptez environ");
    expect(html).toContain("min de lecture");
    expect(html).toContain("min de prise en main");
    // Une estimation qui se présente comme une mesure se fait croire une fois,
    // puis plus jamais.
    expect(html).toContain("pas une mesure");
  });

  it("avec mesure : elle passe devant, et l'estimation devient une note", () => {
    const html = renderToStaticMarkup(
      createElement(DureeDuTourAffichee, {
        estimation,
        mesure: 18,
        libelleTourMesure: "Trimestre 2",
      }),
    );
    expect(html).toContain("18 minutes");
    expect(html).toContain("trimestre 2");
    expect(html).toContain("médiane");
    expect(html).not.toContain("Comptez environ");
  });

  it("la version compacte dit laquelle des deux sources parle", () => {
    const rendre = (mesure: number | null) =>
      renderToStaticMarkup(
        createElement(DureeDuTourAffichee, {
          estimation,
          mesure,
          libelleTourMesure: null,
          compact: true,
        }),
      );
    expect(rendre(null)).toContain("(estimé)");
    expect(rendre(18)).toContain("18 min (mesuré)");
  });
});

describe("branché à la séance", () => {
  const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");

  it("la vue enseignant fournit les faits, la page en tire les minutes", () => {
    expect(lire("src/services/game.service.ts")).toContain("chargeDuTour");
    const page = lire("src/app/teacher/games/[gameId]/page.tsx");
    expect(page).toContain("dureeDuTour({");
    expect(page).toContain("<DureeDuTourAffichee");
  });

  it("le chiffre est là où l'on pose les bornes, et dans la rubrique du tour", () => {
    const page = lire("src/app/teacher/games/[gameId]/page.tsx");
    const planning = page.indexOf("Planning des tours");
    expect(page.indexOf("<DureeDuTourAffichee")).toBeGreaterThan(planning);
    expect(page).toContain("(mesuré)");
  });

  it("la mesure ne dépend plus du planning : la clôture du tour précédent suffit", () => {
    const obs = lire("src/services/observation.service.ts");
    expect(obs).toContain("tours[rang - 1]?.resolvedAt");
    expect(obs).toContain("const ouverture = tour.opensAt ??");
  });
});
