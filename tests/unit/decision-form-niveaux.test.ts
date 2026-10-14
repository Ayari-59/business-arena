import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * LE FORMULAIRE N'AFFICHE PAS D'ENCADRÉ VIDE, ET DIT QUAND UNE DÉCISION S'OUVRE.
 *
 * Constaté en production, niveau 1 (Découverte) : l'encadré « Financer ·
 * emprunt, capital, investissement » était rendu avec son titre et rien
 * dedans, parce que seul son contenu dépendait du niveau. Au niveau 6
 * (Executive), l'affectation du résultat promise par la description du niveau
 * ne se trouvait pas au tour 1 : le champ existait sous un autre nom, sans
 * dire qu'il n'a rien à distribuer avant le premier résultat.
 */

// Le formulaire importe son action serveur, qui importe la base : on la
// remplace par une fonction inerte, le rendu statique ne l'appelle jamais.
vi.mock("@/app/arena/[gameId]/actions", () => ({
  playRoundAction: async () => ({ error: null }),
}));

const { DecisionForm } = await import("@/components/decision-form");
const { presetByLevel } = await import("@/config/difficulty");
const { SCENARIOS } = await import("@/config/scenarios/registry");
const { compter } = await import("@/lib/format");

type Props = Parameters<typeof DecisionForm>[0];

function rendu(niveau: 1 | 2 | 3 | 4 | 5 | 6, roundIndex: number, extra: Partial<Props> = {}) {
  const preset = presetByLevel.get(niveau)!;
  const props: Props = {
    gameId: "partie-test",
    roundIndex,
    periodName: "tour 1",
    defaults: {
      price: 79,
      productionPlan: 1000,
      marketingBudget: 5000,
      qualityBudget: 0,
      maintenanceBudget: 0,
    } as Props["defaults"],
    kind: "class",
    alreadySubmitted: false,
    enabled: preset.decisions,
    vocabulary: SCENARIOS[0]!.vocabulary,
    ...extra,
  };
  return renderToStaticMarkup(createElement(DecisionForm, props));
}

const TITRE_FINANCER = "Financer · emprunt, capital, investissement";
const TITRE_AFFECTATION = "Affectation du résultat";
const OUVERTURE_T2 = "à partir du tour 2";

describe("encadrés du formulaire de décisions selon le niveau", () => {
  it("niveau 1 : ni emprunt, ni apport, ni créances ; la banque se lit en lecture seule", () => {
    // Depuis octobre 2026, le financement s'ouvre au niveau 4 : aucun encadré
    // « Financer » vide, aucun champ, mais le découvert consenti reste dit.
    const html = rendu(1, 1, {
      bankFile: { trust: 1, overdraftLimit: 30000, fullOverdraftLimit: 30000, overdraftAnnualRate: 0.12, lastReliability: null },
      debtSchedule: { nextMandatory: 5000, outstanding: 80000 },
    });
    expect(html).not.toContain(TITRE_FINANCER);
    expect(html).not.toContain('name="newLoan"');
    expect(html).not.toContain('name="capitalIncrease"');
    expect(html).not.toContain('name="discount"');
    expect(html).toContain("data-banque-en-lecture");
    expect(html).toContain("Découvert autorisé");
    expect(html).toContain("Échéance d&#x27;emprunt du tour");
  });

  it("niveau 2 : même chose qu'au niveau 1 pour la banque", () => {
    const html = rendu(2, 1, {
      bankFile: { trust: 1, overdraftLimit: 30000, fullOverdraftLimit: 30000, overdraftAnnualRate: 0.12, lastReliability: null },
    });
    expect(html).not.toContain(TITRE_FINANCER);
    expect(html).not.toContain('name="newLoan"');
    expect(html).toContain("data-banque-en-lecture");
  });

  it("un niveau qui ne fait ni financer ni investir ne rend aucun encadré vide", () => {
    const html = rendu(1, 1);
    expect(html).not.toContain(TITRE_FINANCER);
    expect(html).not.toContain('name="newLoan"');
  });

  it("niveau 3 : l'escompte et l'affacturage, pas encore l'emprunt", () => {
    const html = rendu(3, 1, {
      treasuryOffer: {
        discountAnnualRate: 0.08,
        discountMaxShare: 0.8,
        factoringFeeRate: 0.04,
        overdraftLimit: 30000,
        placementAnnualRate: null,
        maturedPlacement: 0,
      },
    });
    expect(html).not.toContain(TITRE_FINANCER);
    expect(html).not.toContain('name="newLoan"');
    expect(html).toContain('name="discount"');
    expect(html).toContain('name="factoring"');
    expect(html).not.toContain(TITRE_AFFECTATION);
  });

  it("niveau 4 : l'encadré Financer est là, avec ses champs, et la banque n'est plus en lecture seule", () => {
    const html = rendu(4, 1, {
      bankFile: { trust: 1, overdraftLimit: 30000, fullOverdraftLimit: 30000, overdraftAnnualRate: 0.12, lastReliability: null },
    });
    expect(html).toContain(TITRE_FINANCER);
    expect(html).toContain('name="newLoan"');
    expect(html).toContain('name="capitalIncrease"');
    expect(html).not.toContain("data-banque-en-lecture");
  });

  it("niveau 6, tour 1 : l'affectation du résultat est nommée et annonce son ouverture", () => {
    const html = rendu(6, 1);
    expect(html).toContain(TITRE_AFFECTATION);
    expect(html).toContain('name="dividend"');
    expect(html).toContain(OUVERTURE_T2);
  });

  it("niveau 6, tour 3 sans réserve : rien à distribuer, sans parler du tour 2", () => {
    const html = rendu(6, 3, { distributableReserves: 0 });
    expect(html).toContain(TITRE_AFFECTATION);
    expect(html).not.toContain(OUVERTURE_T2);
    expect(html).toContain("Rien à distribuer");
  });

  it("niveau 6, avec des réserves : le montant distribuable est affiché", () => {
    const html = rendu(6, 3, { distributableReserves: 12_000 });
    // Le montant ne se lit plus dans une phrase : il borne le curseur, et
    // s'écrit au bout — c'est le même chiffre, devenu une limite.
    expect(html).toContain(`${(12_000).toLocaleString("fr-FR")} € · toutes les réserves`);
    expect(html).toContain('max="12000"');
    expect(html).not.toContain(OUVERTURE_T2);
  });
});

describe("textes de l'espace enseignant", () => {
  const source = readFileSync(join(process.cwd(), "src", "app", "teacher", "page.tsx"), "utf8");

  it("aucune référence interne « (§25) » n'est servie", () => {
    expect(source).not.toContain("§25");
  });

  it("les comptes d'équipes passent par l'accord singulier / pluriel", () => {
    expect(source).not.toMatch(/\{[a-zA-Z.]+Count\} équipes/);
    expect(source).toContain('compter(g.teamsCount, "équipe")');
    expect(source).toContain('compter(c.entriesCount, "équipe")');
  });

  it("compter accorde : le pluriel commence à deux", () => {
    expect(compter(0, "équipe")).toBe("0 équipe");
    expect(compter(1, "équipe")).toBe("1 équipe");
    expect(compter(2, "équipe")).toBe("2 équipes");
    expect(compter(8, "équipe")).toBe("8 équipes");
    expect(compter(1, "cheval", "chevaux")).toBe("1 cheval");
    expect(compter(3, "cheval", "chevaux")).toBe("3 chevaux");
  });
});
