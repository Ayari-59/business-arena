import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * LE PLAFOND EST UNE BORNE, PAS UN AVERTISSEMENT.
 *
 * Trois décisions ont un plafond connu avant la validation, que le moteur
 * applique en silence par un `Math.min` : l'emprunt, l'apport et le dividende.
 * Un chiffre tapé au-delà partait entier, se faisait raboter, et l'écart se
 * découvrait au tour suivant. Le curseur ne va pas plus loin que le plafond, et
 * la saisie porte le même maximum.
 *
 * Ce que la garde vérifie : que le maximum affiché est BIEN celui du moteur, et
 * que le bout du curseur vaut le plafond exact — pas le dernier cran rond.
 */

vi.mock("@/app/arena/[gameId]/actions", () => ({
  playRoundAction: async () => ({ error: null }),
}));

const { DecisionForm, cranDuCurseur, pasDuCurseur } = await import("@/components/decision-form");
const { presetByLevel } = await import("@/config/difficulty");
const { SCENARIOS } = await import("@/config/scenarios/registry");

type Props = Parameters<typeof DecisionForm>[0];

function rendu(extra: Partial<Props> = {}, niveau: 1 | 2 | 3 | 4 | 5 | 6 = 5): string {
  const preset = presetByLevel.get(niveau)!;
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
    kind: "class",
    alreadySubmitted: false,
    enabled: preset.decisions,
    vocabulary: SCENARIOS[0]!.vocabulary,
    ...extra,
  };
  return renderToStaticMarkup(createElement(DecisionForm, props));
}

/** Le `<input type="range">` qui précède ou suit le champ nommé `nom`. */
function curseurDe(html: string, nom: string): string | null {
  const champ = html.indexOf(`name="${nom}"`);
  if (champ === -1) return null;
  const range = html.indexOf('type="range"', champ);
  if (range === -1) return null;
  const debut = html.lastIndexOf("<input", range);
  const fin = html.indexOf(">", range);
  return html.slice(debut, fin + 1);
}

/** Le `<input type="number">` nommé `nom`. */
function saisieDe(html: string, nom: string): string | null {
  const champ = html.indexOf(`name="${nom}"`);
  if (champ === -1) return null;
  const debut = html.lastIndexOf("<input", champ);
  return html.slice(debut, html.indexOf(">", champ) + 1);
}

describe("le pas d'un curseur", () => {
  it("est 1, 2 ou 5 fois une puissance de dix", () => {
    expect(pasDuCurseur(312_453)).toBe(5_000);
    expect(pasDuCurseur(100_000)).toBe(1_000);
    expect(pasDuCurseur(150_000)).toBe(2_000);
    expect(pasDuCurseur(60_000)).toBe(1_000);
    expect(pasDuCurseur(900)).toBe(10);
  });

  it("ne descend jamais à zéro, même sans plafond à régler", () => {
    expect(pasDuCurseur(0)).toBe(1);
    expect(pasDuCurseur(-5)).toBe(1);
  });
});

describe("là où le curseur s'arrête", () => {
  const maximum = 312_453;
  const pas = pasDuCurseur(maximum);

  it("s'aligne sur un cran rond", () => {
    expect(cranDuCurseur(103_200, maximum, pas)).toBe(105_000);
    expect(cranDuCurseur(0, maximum, pas)).toBe(0);
  });

  it("vaut le plafond EXACT au bout, pas le dernier cran rond", () => {
    expect(cranDuCurseur(maximum, maximum, pas)).toBe(maximum);
    expect(cranDuCurseur(maximum - 1, maximum, pas)).toBe(maximum);
  });

  it("ne dépasse jamais, quoi qu'on lui donne", () => {
    expect(cranDuCurseur(999_999, maximum, pas)).toBe(maximum);
    expect(cranDuCurseur(-1, maximum, pas)).toBe(0);
    expect(cranDuCurseur(50_000, 0, pas)).toBe(0);
  });
});

describe("l'emprunt", () => {
  const capacite = { remaining: 312_453.7, ratio: 1, equity: 400_000, debt: 87_546.3 };

  it("porte un curseur borné à ce que la banque prête encore", () => {
    const html = rendu({ loanCapacity: capacite } as Partial<Props>);
    const curseur = curseurDe(html, "newLoan");
    expect(curseur).not.toBeNull();
    expect(curseur).toContain('max="312453"');
    expect(curseur).toContain('min="0"');
    // La molette ne décide de rien : Firefox change un curseur au survol.
    expect(html).toContain('type="range"');
  });

  it("oppose le même maximum à la saisie qu'au curseur", () => {
    const html = rendu({ loanCapacity: capacite } as Partial<Props>);
    expect(saisieDe(html, "newLoan")).toContain('max="312453"');
  });

  it("sans capacité connue, ni curseur ni maximum : on ne borne pas au hasard", () => {
    const html = rendu();
    expect(html).toContain('name="newLoan"');
    expect(curseurDe(html, "newLoan")).toBeNull();
    expect(saisieDe(html, "newLoan")).not.toContain("max=");
  });

  it("capacité épuisée : pas de curseur à régler, et la saisie est bloquée à zéro", () => {
    const html = rendu({
      loanCapacity: { remaining: 0, ratio: 1, equity: 100_000, debt: 140_000 },
    } as Partial<Props>);
    expect(curseurDe(html, "newLoan")).toBeNull();
    expect(saisieDe(html, "newLoan")).toContain('max="0"');
  });
});

describe("l'apport des associés", () => {
  it("est borné par ce qui reste de l'enveloppe, pas par l'enveloppe entière", () => {
    const html = rendu({
      capitalAllowance: { total: 200_000, remaining: 75_000 },
    } as Partial<Props>);
    const curseur = curseurDe(html, "capitalIncrease");
    expect(curseur).toContain('max="75000"');
    expect(saisieDe(html, "capitalIncrease")).toContain('max="75000"');
    // L'enveloppe totale reste dite : c'est elle qui se comprend, pas le reste.
    // (l'espace des milliers est celui de `toLocaleString`, insécable étroit)
    expect(html).toContain(`enveloppe de ${(200_000).toLocaleString("fr-FR")} € pour la partie`);
  });
});

describe("le dividende", () => {
  it("ne peut pas dépasser les réserves distribuables", () => {
    const html = rendu({ distributableReserves: 48_000 } as Partial<Props>, 6);
    const curseur = curseurDe(html, "dividend");
    expect(curseur).toContain('max="48000"');
    expect(saisieDe(html, "dividend")).toContain('max="48000"');
  });

  it("sans réserves, aucun curseur : il n'y a rien à régler", () => {
    const html = rendu({ distributableReserves: 0 } as Partial<Props>, 6);
    expect(html).toContain('name="dividend"');
    expect(curseurDe(html, "dividend")).toBeNull();
  });
});
