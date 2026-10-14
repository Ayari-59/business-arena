import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EngagementDuTour,
  lireLEngagement,
  lireLesOptionsPonctuelles,
  type Engagement,
} from "@/components/engagement-du-tour";
import { NOVA_DEFINITION, NOVA_GAMME_DEFINITION } from "@/config/scenarios/registry";

/**
 * ON NE VALIDE PAS UN TOUR SANS AVOIR VU CE QU'ON ENGAGE.
 *
 * Six étapes de saisie, puis un bouton : une équipe à quatre, qui a rempli les
 * étapes chacune de son côté, validait sans que personne n'ait vu l'ensemble.
 *
 * Ce que ce test garde : les valeurs viennent du FORMULAIRE (jamais d'une copie
 * qui finirait par diverger), les budgets s'additionnent — c'est la seule
 * information vraiment neuve de l'écran — et la gamme se lit référence par
 * référence.
 */

const form = (champs: Record<string, string>): FormData => {
  const d = new FormData();
  for (const [k, v] of Object.entries(champs)) d.append(k, v);
  return d;
};

const sansEspacesFines = (t: string) => t.replace(/[  ]/g, " ").replace(/&#x27;/g, "'");

describe("ce qu'on engage, lu sur le formulaire", () => {
  it("mono-produit : le prix, le volume, et la somme des budgets", () => {
    const e = lireLEngagement(
      form({
        price: "59",
        productionPlan: "4800",
        marketingBudget: "6000",
        qualityBudget: "3000",
        maintenanceBudget: "4000",
        expectedUnits: "4600",
      }),
      [],
    );
    expect(e.prix).toBe(59);
    expect(e.volume).toBe(4800);
    expect(e.total).toBe(13_000);
    expect(e.budgets.map((b) => b.label)).toEqual(["Marketing", "Qualité", "Entretien"]);
    expect(e.ventesPrevues).toBe(4600);
  });

  it("un budget laissé à zéro n'encombre pas la liste", () => {
    const e = lireLEngagement(
      form({ price: "59", productionPlan: "100", marketingBudget: "0", maintenanceBudget: "500" }),
      [],
    );
    expect(e.budgets.map((b) => b.label)).toEqual(["Entretien"]);
    expect(e.total).toBe(500);
  });

  it("sans plan de trésorerie demandé, rien n'est annoncé", () => {
    expect(
      lireLEngagement(form({ price: "59", productionPlan: "100" }), []).ventesPrevues,
    ).toBeNull();
  });

  it("en gamme, le prix est une moyenne et les volumes s'additionnent", () => {
    const e = lireLEngagement(
      form({
        "product.GO.price": "49",
        "product.GO.productionPlan": "1000",
        "product.GO.marketingBudget": "2000",
        "product.ONE.price": "99",
        "product.ONE.productionPlan": "500",
        "product.ONE.marketingBudget": "3000",
        maintenanceBudget: "4000",
      }),
      ["GO", "ONE"],
    );
    expect(e.prix).toBe(74); // (49 + 99) / 2
    expect(e.volume).toBe(1500);
    // Le marketing des références est additionné, pas montré six fois.
    expect(e.budgets).toEqual([
      { label: "Marketing", montant: 5000 },
      { label: "Entretien", montant: 4000 },
    ]);
    expect(e.total).toBe(9000);
  });
});

/**
 * LES OPTIONS PONCTUELLES SONT REPLIÉES : LE RÉSUMÉ DOIT DONC LES COMPTER.
 *
 * Sur ordinateur, l'assurance, les études, la commande exceptionnelle, le
 * dividende et les outils de trésorerie sont rangés derrière un repli fermé —
 * ils ne se touchent qu'un tour sur trois, et dépliés ils poussaient le prix
 * hors de l'écran. Un repli ne doit jamais cacher qu'on a engagé quelque
 * chose : le compte vient du FORMULAIRE, et il est annoncé.
 */
describe("les options ponctuelles engagées", () => {
  const nom = (code: string) => (code === "ETENDUE" ? "Couverture étendue" : code);

  it("rien d'engagé : aucune option, et pas une ligne à zéro", () => {
    const e = lireLEngagement(form({ price: "59", productionPlan: "100" }), []);
    expect(e.optionsPonctuelles).toEqual([]);
  });

  it("chaque option engagée se range sous le repli qui la porte", () => {
    const options = lireLesOptionsPonctuelles(
      form({
        acceptOrder: "on",
        insurance: "ETENDUE",
        studyMarket: "on",
        studyPrice: "on",
        dividend: "12000",
        discount: "5000",
        factoring: "0",
        placement: "0",
      }),
      nom,
    );
    expect(options.map((o) => o.cle)).toEqual([
      "commande",
      "assurance",
      "etudes",
      "dividende",
      "mobilisation",
    ]);
    expect(options.find((o) => o.cle === "assurance")?.valeur).toBe("Couverture étendue");
    expect(options.find((o) => o.cle === "etudes")?.valeur).toBe("2 études");
    expect(sansEspacesFines(options.find((o) => o.cle === "dividende")!.valeur)).toBe("12 000 €");
    // Un montant à zéro n'est pas une option engagée.
    expect(options.some((o) => o.label === "Affacturage")).toBe(false);
    expect(options.some((o) => o.label === "Placement")).toBe(false);
  });

  it("une assurance à case unique se dit « souscrite », faute de formule", () => {
    const options = lireLesOptionsPonctuelles(form({ insurance: "on" }), nom);
    expect(options).toEqual([{ cle: "assurance", label: "Assurance", valeur: "souscrite" }]);
  });

  it("le résumé annonce le compte : il est le seul endroit où on les revoit", () => {
    const html = sansEspacesFines(
      renderToStaticMarkup(
        createElement(EngagementDuTour, {
          engagement: {
            prix: 59,
            volume: 100,
            budgets: [],
            total: 0,
            ventesPrevues: null,
            optionsPonctuelles: [
              { cle: "etudes", label: "Études", valeur: "2 études" },
              { cle: "dividende", label: "Dividende", valeur: "12 000 €" },
            ],
          },
          vocabulary: NOVA_DEFINITION.vocabulary,
          gamme: false,
        }),
      ),
    );
    expect(html).toContain("Options ponctuelles");
    expect(html).toContain("2 engagées");
    expect(html).toContain("Études");
    expect(html).toContain("Dividende");
  });

  it("aucune option : le résumé le dit, plutôt que de laisser croire à un oubli", () => {
    const html = renderToStaticMarkup(
      createElement(EngagementDuTour, {
        engagement: {
          prix: 59,
          volume: 100,
          budgets: [],
          total: 0,
          ventesPrevues: null,
          optionsPonctuelles: [],
        },
        vocabulary: NOVA_DEFINITION.vocabulary,
        gamme: false,
      }),
    );
    expect(html).toContain("aucune");
  });
});

describe("l'écran d'engagement", () => {
  const rendu = (engagement: Engagement, gamme = false) =>
    sansEspacesFines(
      renderToStaticMarkup(
        createElement(EngagementDuTour, {
          engagement,
          vocabulary: gamme ? NOVA_GAMME_DEFINITION.vocabulary : NOVA_DEFINITION.vocabulary,
          gamme,
        }),
      ),
    );

  it("met le total des budgets en avant : il n'existe nulle part ailleurs", () => {
    const html = rendu({
      prix: 59,
      volume: 4800,
      budgets: [
        { label: "Marketing", montant: 6000 },
        { label: "Entretien", montant: 4000 },
      ],
      total: 10_000,
      ventesPrevues: 4600,
      optionsPonctuelles: [],
    });
    expect(html).toContain("Ce que vous engagez");
    expect(html).toContain("10 000 €");
    expect(html).toContain("4 800");
    expect(html).toContain("Marketing");
    expect(html).toContain("Ventes annoncées");
  });

  it("en gamme, le prix se dit « moyen » — sinon il se lirait comme LE prix", () => {
    const html = rendu(
      {
        prix: 74,
        volume: 1500,
        budgets: [],
        total: 0,
        ventesPrevues: null,
        optionsPonctuelles: [],
      },
      true,
    );
    expect(html).toContain("Prix moyen");
    // Rien à annoncer : la ligne ne paraît pas plutôt que d'afficher un tiret.
    expect(html).not.toContain("Ventes annoncées");
  });
});
