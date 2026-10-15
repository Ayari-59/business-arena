import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DECISIONS_DE_MODULE } from "@/engine/modules/ouverture";
import {
  ETAPES_DU_FORMULAIRE,
  ETAPE_DU_MODULE,
  etapesAffichees,
  moduleDuRefus,
  modulesDeLEtape,
  PREFIXE_D_ARRET,
  titreDeLEtape,
} from "@/config/etapes-des-modules";
import { arretDeModule, champDeModule } from "@/config/modules-saisis";
import { presetByLevel } from "@/config/difficulty";
import { novaScenario } from "@/config/scenarios/nova";
import { construireOffreDesModules } from "@/services/modules-offer";

/**
 * CHAQUE MODULE DANS L'ÉTAPE DE SON THÈME.
 *
 * Les modules du scénario s'empilaient dans une étape « Projets » sans ordre.
 * Ils vivent maintenant à la fin de l'étape dont ils prolongent les décisions,
 * selon UNE table (`config/etapes-des-modules`) que le formulaire et le
 * récapitulatif lisent tous les deux. Gardé ici : la table couvre chaque
 * module, suit le classement validé, n'ouvre aucune étape vide, et le
 * formulaire range bien chaque module dans la section de son étape. Depuis
 * le retrait de seize modules, les deux qui restent vivent à « Budgéter » :
 * une étape qui ne paraissait que pour un module retiré ne paraît plus.
 */

vi.mock("@/app/arena/[gameId]/actions", () => ({
  playRoundAction: async () => ({ error: null }),
}));

const { DecisionForm } = await import("@/components/decision-form");
const { SCENARIOS } = await import("@/config/scenarios/registry");

describe("la table des étapes des modules", () => {
  it("chaque décision de module a une étape du formulaire, et aucune autre clé n'y figure", () => {
    expect(Object.keys(ETAPE_DU_MODULE).sort()).toEqual([...DECISIONS_DE_MODULE].sort());
    for (const decision of DECISIONS_DE_MODULE) {
      expect(ETAPES_DU_FORMULAIRE, decision).toContain(ETAPE_DU_MODULE[decision]);
    }
  });

  it("suit le classement validé", () => {
    const parEtape: Record<string, string[]> = {};
    for (const d of DECISIONS_DE_MODULE) (parEtape[ETAPE_DU_MODULE[d]] ??= []).push(d);
    for (const liste of Object.values(parEtape)) liste.sort();
    expect(parEtape).toEqual({ budgets: ["qualityActions", "startedRdActionIds"] });
  });

  it("il n'y a plus d'étape « projets »", () => {
    expect(ETAPES_DU_FORMULAIRE as readonly string[]).not.toContain("projets");
    expect(Object.values(ETAPE_DU_MODULE) as string[]).not.toContain("projets");
  });

  it("l'assurance s'appelle « Assurance » ; en gamme, la première étape porte les références", () => {
    expect(titreDeLEtape("assurance")).toBe("Assurance");
    expect(titreDeLEtape("vendre", { gamme: true })).toBe("Vos références");
    expect(titreDeLEtape("vendre")).toBe("Vendre");
  });
});

describe("une étape paraît si elle a des champs ou des modules, jamais vide", () => {
  const rd = [{ decision: "startedRdActionIds" as const }];

  it("sans module : les seules étapes aux champs ouverts", () => {
    expect(etapesAffichees({ vendre: true, budgets: true, prevoir: true }, null)).toEqual([
      "vendre",
      "budgets",
      "prevoir",
    ]);
  });

  it("une étape aux champs fermés paraît pour ses modules, et pour eux seuls", () => {
    expect(etapesAffichees({ vendre: true, prevoir: true }, rd)).toEqual(["vendre", "budgets", "prevoir"]);
    expect(modulesDeLEtape(rd, "budgets")).toEqual(rd);
    expect(modulesDeLEtape(rd, "vendre")).toEqual([]);
  });

  it("une étape sans champ ni module n'apparaît pas", () => {
    expect(etapesAffichees({ vendre: true, prevoir: true }, [])).toEqual(["vendre", "prevoir"]);
  });
});

describe("le refus d'un module mène à son module", () => {
  const offre = [
    { decision: "startedRdActionIds" as const, titre: "Programmes de R&D", enCours: [{ id: "rd-process", arret: {} }] },
    { decision: "qualityActions" as const, titre: "Démarches qualité", enCours: [] },
  ];

  it("par son champ, par son titre, ou par la case d'arrêt cochée", () => {
    expect(moduleDuRefus({ champ: "module.qualityActions.amelioration_composants", message: "x" }, offre, null)).toBe(
      "qualityActions",
    );
    expect(
      moduleDuRefus({ champ: null, message: "Programmes de R&D : un même choix ne se coche qu'une fois." }, offre, null),
    ).toBe("startedRdActionIds");
    // L'arrêt de ce qui ne tourne pas : la case cochée qui ne vise rien d'arrêtable.
    expect(arretDeModule("startedRdActionIds", "rd-process").startsWith(PREFIXE_D_ARRET)).toBe(true);
    const saisie: [string, string][] = [
      [champDeModule("startedRdActionIds", "rd-emballage"), "rd-emballage"],
      [arretDeModule("startedRdActionIds", "rd-process"), "1"],
      [arretDeModule("qualityActions", "amelioration_composants"), "1"],
    ];
    expect(
      moduleDuRefus({ champ: null, message: "Cet arrêt ne porte sur rien qui tourne ce tour." }, offre, saisie),
    ).toBe("qualityActions");
  });

  it("un refus qui ne vise aucun module affiché reste au récapitulatif", () => {
    expect(moduleDuRefus({ champ: null, message: "Ce module n'est pas proposé dans cette partie." }, offre, [])).toBe(
      null,
    );
    expect(moduleDuRefus({ champ: "price", message: "x" }, offre, null)).toBe(null);
  });
});

describe("le formulaire range chaque module dans la section de son étape", () => {
  type Props = Parameters<typeof DecisionForm>[0];
  function rendu(niveau: 1 | 3 | 5) {
    const preset = presetByLevel.get(niveau)!;
    const modulesOffer = construireOffreDesModules({
      scenario: novaScenario,
      etat: {},
      tour: 3,
      leviers: preset.decisions,
    });
    const props: Props = {
      gameId: "partie-test",
      roundIndex: 3,
      periodName: "tour 3",
      defaults: {
        price: 79,
        productionPlan: 1000,
        marketingBudget: 5000,
        qualityBudget: 0,
        maintenanceBudget: 0,
      } as Props["defaults"],
      kind: "solo",
      alreadySubmitted: false,
      enabled: preset.decisions,
      vocabulary: SCENARIOS[0]!.vocabulary,
      modulesOffer,
    };
    return { html: renderToStaticMarkup(createElement(DecisionForm, props)), modulesOffer };
  }
  /** Les titres de la barre d'étapes, dans l'ordre. */
  const etapes = (html: string) => {
    const nav = /<nav aria-label="Étapes de décision"[\s\S]*?<\/nav>/.exec(html)![0];
    return [...nav.matchAll(/<button[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&").replace(/&#x27;/g, "'"));
  };
  /** L'index d'étape de la section qui contient chaque module. */
  const sectionDe = (html: string, decision: string) => {
    const ou = html.indexOf(`data-module-de-decision="${decision}"`);
    const sections = [...html.matchAll(/<section data-etape="(-?\d+)"/g)].filter((m) => m.index! < ou);
    return Number(sections.at(-1)![1]);
  };

  it("niveau 5 : les deux modules à « Budgéter », plus d'étape ouverte par un module retiré, pas de « Projets »", () => {
    const { html, modulesOffer } = rendu(5);
    const titres = etapes(html);
    expect(titres).not.toContain("Projets");
    expect(html).not.toContain("Quels projets engagez-vous");
    // Sans formule d'assurance dans la feuille, l'étape ne paraît plus : seuls les
    // plans de crise la faisaient paraître. Jamais « & risques ».
    expect(titres.some((x) => x.startsWith("Assurance"))).toBe(false);
    expect(modulesOffer!.map((m) => m.decision)).toEqual(["qualityActions", "startedRdActionIds"]);
    for (const m of modulesOffer!) expect(sectionDe(html, m.decision), m.decision).toBe(titres.indexOf("Budgéter"));
    // Chaque module est replié, sous l'intertitre des engagements.
    expect(html).toContain("Engagements du tour");
    for (const m of modulesOffer!) {
      const ou = html.indexOf(`data-module-de-decision="${m.decision}"`);
      const repli = /<details[^>]*>/.exec(html.slice(ou))![0];
      expect(repli, `${m.decision} replié`).not.toContain("open");
    }
  });

  it("niveau 3 : S'approvisionner ne paraît plus, faute de champ et de module", () => {
    const { html } = rendu(3);
    const titres = etapes(html);
    expect(titres).not.toContain("S'approvisionner");
    expect(html).not.toContain('name="supplierChoice"');
    expect(sectionDe(html, "qualityActions")).toBe(titres.indexOf("Budgéter"));
  });

  it("niveau 1 : aucun module, aucune étape de plus", () => {
    const { html, modulesOffer } = rendu(1);
    expect(modulesOffer).toBeNull();
    expect(etapes(html)).toEqual(["Vendre", "Budgéter", "S'informer & prévoir"]);
    expect(html).not.toContain("Engagements du tour");
  });
});
