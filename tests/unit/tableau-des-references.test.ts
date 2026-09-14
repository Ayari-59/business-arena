import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableauDesReferences } from "@/components/tableau-des-references";
import type { GameView } from "@/services/game-view.service";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * UNE COLONNE QUI DIT LA MÊME CHOSE PARTOUT NE DIT RIEN.
 *
 * Le tableau des références comptait onze colonnes, et deux d'entre elles
 * répétaient la même valeur sur chaque ligne : « 0 € · +0 % » quand personne
 * n'avait investi en R&D, « Fournisseur standard » quand toutes les références
 * s'approvisionnent au même endroit. Ces colonnes-là prennent la largeur des
 * quatre chiffres qui décident vraiment — prix, vendu, manqué, CA — et
 * poussaient le tableau à défiler sur un téléphone.
 *
 * Les colonnes étaient masquées selon ce que le SCÉNARIO propose. Elles le sont
 * maintenant selon ce que le TOUR a réellement produit : c'est la règle que ce
 * test garde, avec son revers — ce qui distingue reste visible.
 */

type Produit = NonNullable<CompanyRoundResult["products"]>[string];
type Gamme = NonNullable<GameView["gamme"]>;

/** Une référence de gamme réduite à ce que le tableau lit. */
const reference = (code: string, name: string, extra: Partial<Gamme[number]> = {}) =>
  ({
    code,
    name,
    materialCostPerUnit: 10,
    otherVariableCostPerUnit: 2,
    hoursPerUnit: 0.5,
    refPrice: 30,
    marketSize: 1000,
    segments: [],
    seasonCoef: 1,
    stock: 0,
    suppliers: null,
    rd: null,
    ...extra,
  }) as unknown as Gamme[number];

const produit = (extra: Partial<Produit> = {}) =>
  ({
    planned: 100,
    produced: 100,
    defectUnits: 0,
    unitVariableCost: 12,
    price: 30,
    marketingBudget: 0,
    qualityBudget: 0,
    producedQuality: 1,
    perceivedQuality: 1,
    sold: 90,
    lost: 10,
    revenue: 2700,
    stock: { quantity: 10, unitCost: 12 },
    segments: [],
    ...extra,
  }) as unknown as Produit;

const rendu = (gamme: Gamme, produits: Record<string, Produit>, tour = 2) =>
  renderToStaticMarkup(
    createElement(TableauDesReferences, {
      gamme,
      produits: produits as NonNullable<CompanyRoundResult["products"]>,
      tour,
      leftoverLabel: "Stock",
    }),
  );

const RD_NEUVE = { budget: 0, techLevel: 0 };

/** Le catalogue porté par la gamme : plus riche que le fournisseur du tour. */
const catalogue = [
  {
    code: "std",
    name: "Fournisseur standard",
    narrative: "Le façonnier habituel.",
    costMultiplier: 1,
    qualityBonus: 0,
    paymentDelayDays: 30,
    supplyRiskProbability: 0.05,
    materialCostPerUnit: 10,
  },
];

/** Le fournisseur retenu, tel que le tour le rapporte. */
const retenu = (code: string, name: string, supplyDisruption = false) => ({
  code,
  name,
  costMultiplier: 1,
  qualityBonus: 0,
  supplyDisruption,
});

describe("TableauDesReferences", () => {
  it("garde les colonnes qui décident : prix, vendu, manqué, CA", () => {
    const html = rendu([reference("polo", "Polo")] as unknown as Gamme, { polo: produit() });
    for (const entete of ["Référence", "Prix", "En rayon", "Vendu", "Manqué", "CA", "Marge/u", "Stock"]) {
      expect(html).toContain(entete);
    }
  });

  it("la R&D disparaît quand personne n'a investi et qu'aucun niveau n'est acquis", () => {
    const gamme = [
      reference("polo", "Polo", { rd: { techLevel: 0, development: null } }),
      reference("pull", "Pull", { rd: { techLevel: 0, development: null } }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      polo: produit({ rd: RD_NEUVE }),
      pull: produit({ rd: RD_NEUVE }),
    });
    // La colonne aurait dit « 0 € · +0 % » sur chaque ligne.
    expect(html).not.toContain("R&amp;D");
    expect(html).not.toContain("+0 %");
  });

  it("…et revient dès qu'une seule référence a investi", () => {
    const gamme = [
      reference("polo", "Polo", { rd: { techLevel: 0, development: null } }),
      reference("pull", "Pull", { rd: { techLevel: 0, development: null } }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      polo: produit({ rd: { budget: 5000, techLevel: 0.08 } }),
      pull: produit({ rd: RD_NEUVE }),
    });
    expect(html).toContain("R&amp;D");
    expect(html).toContain("+8 %");
  });

  it("le fournisseur disparaît quand toute la gamme s'approvisionne au même endroit", () => {
    const gamme = [
      reference("polo", "Polo", { suppliers: catalogue }),
      reference("pull", "Pull", { suppliers: catalogue }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      polo: produit({ supplier: retenu("std", "Fournisseur standard") }),
      pull: produit({ supplier: retenu("std", "Fournisseur standard") }),
    });
    // Le mot répété deux fois n'apprend rien : il n'apparaît pas du tout.
    expect(html).not.toContain("Fournisseur standard");
  });

  it("…mais reste dès que deux références ne s'approvisionnent pas pareil", () => {
    const gamme = [
      reference("polo", "Polo", { suppliers: catalogue }),
      reference("pull", "Pull", { suppliers: catalogue }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      polo: produit({ supplier: retenu("std", "Fournisseur standard") }),
      pull: produit({ supplier: retenu("prem", "Atelier premium") }),
    });
    expect(html).toContain("Fournisseur standard");
    expect(html).toContain("Atelier premium");
  });

  it("une rupture reste signalée même quand la colonne Fournisseur est masquée", () => {
    const gamme = [
      reference("polo", "Polo", { suppliers: catalogue }),
      reference("pull", "Pull", { suppliers: catalogue }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      polo: produit({ supplier: retenu("std", "Fournisseur standard", true) }),
      pull: produit({ supplier: retenu("std", "Fournisseur standard") }),
    });
    // C'est le point délicat : masquer la colonne ne doit pas faire disparaître
    // l'incident qui explique le volume manqué de la ligne.
    expect(html).not.toContain("Fournisseur standard");
    expect(html).toContain("rupture");
  });

  it("une référence à bâtir n'a pas de ligne du tout", () => {
    const gamme = [
      reference("go", "Go", { rd: { techLevel: 0, development: null } }),
      reference("studio", "Studio", {
        rd: {
          techLevel: 0,
          development: { cost: 25000, availableFromRound: 2, invested: 12000, available: false, launchRound: null },
        },
      }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      go: produit({ price: 129, unitVariableCost: 70, perceivedQuality: 0.97, rd: { budget: 0, techLevel: 0 } }),
      // La Studio n'a rien produit ni vendu : le moteur force son plan à zéro.
      // Elle garde pourtant un prix — le champ caché du formulaire — et une
      // structure de coût, donc elle annonçait 59 € de marge sur une vente qui
      // n'a pas eu lieu.
      studio: produit({
        price: 129,
        unitVariableCost: 70,
        produced: 0,
        sold: 0,
        lost: 0,
        revenue: 0,
        stock: { quantity: 0, unitCost: 0 },
        rd: {
          budget: 12000,
          techLevel: 0,
          development: { cost: 25000, availableFromRound: 2, invested: 12000, launched: false },
        },
      }),
    });
    // Ni la ligne, ni sa pastille : une ligne de zéros n'apprend rien.
    expect(html).not.toContain("Studio");
    expect(html).not.toContain("en développement");
    // Et la colonne R&D part avec elle : son budget était le seul non nul, il
    // ne distingue donc plus rien parmi les références qui ont joué.
    expect(html).not.toContain("R&amp;D");
    // La référence qui a vendu garde tout.
    expect(html).toContain("Go");
    expect(html).toMatch(/59\s€/);
  });

  it("la seule référence de la gamme étant à bâtir, il n'y a pas de tableau", () => {
    // Un titre au-dessus d'un tableau vide serait une promesse non tenue.
    const gamme = [
      reference("studio", "Studio", {
        rd: {
          techLevel: 0,
          development: { cost: 25000, availableFromRound: 2, invested: 0, available: false, launchRound: null },
        },
      }),
    ] as unknown as Gamme;
    const html = rendu(gamme, {
      studio: produit({
        produced: 0,
        sold: 0,
        lost: 0,
        revenue: 0,
        stock: { quantity: 0, unitCost: 0 },
        rd: {
          budget: 0,
          techLevel: 0,
          development: { cost: 25000, availableFromRound: 2, invested: 0, launched: false },
        },
      }),
    });
    expect(html).toBe("");
  });

  it("« lancée ce tour » ne se dit que le tour du lancement", () => {
    const gamme = [reference("studio", "Studio", { rd: { techLevel: 0.1, development: null } })] as unknown as Gamme;
    const dev = { cost: 20000, availableFromRound: 2, invested: 20000, launched: true, launchRound: 2 };
    const auTour2 = rendu(gamme, { studio: produit({ rd: { budget: 0, techLevel: 0.1, development: dev } }) }, 2);
    const auTour3 = rendu(gamme, { studio: produit({ rd: { budget: 0, techLevel: 0.1, development: dev } }) }, 3);
    expect(auTour2).toContain("lancée ce tour");
    expect(auTour3).not.toContain("lancée ce tour");
  });

  it("sur téléphone, une carte par référence ; sur écran large, le tableau", () => {
    const html = rendu([reference("polo", "Polo")] as unknown as Gamme, { polo: produit() });
    // Neuf colonnes ne tiennent pas dans 390 px : le tableau s'y coupait après
    // « Manqué », et le CA — le chiffre que l'élève cherche — restait derrière
    // un défilement latéral que personne ne devine. Les deux formes coexistent,
    // chacune sur sa largeur.
    expect(html).toContain("sm:hidden");
    expect(html).toContain("hidden overflow-x-auto sm:block");
    // Et elles disent la même chose : le CA de la ligne est dans les deux.
    // (les milliers sont séparés par une espace fine insécable, d'où le \s)
    expect(html.match(/2\s700\s€/g)?.length).toBe(2);
  });

  it("les en-têtes ne se coupent pas en deux", () => {
    const html = rendu([reference("polo", "Polo")] as unknown as Gamme, { polo: produit() });
    // Une bande d'en-tête en dents de scie était la moitié du problème de
    // lisibilité : chaque en-tête tient sur une ligne.
    expect(html).toContain("whitespace-nowrap");
    expect(html).not.toContain("Mis en rayon");
    expect(html).not.toContain("Qualité perçue");
  });
});
