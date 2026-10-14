import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EncartResultatEstime,
  LigneEstimeeCompacte,
  aideDesVentesEstimees,
  resumeDeLEstimation,
} from "@/components/resultat-estime";
import {
  LigneEstimeEtReel,
  TableauEstimeReel,
  lignesDEcart,
  unitesVendues,
} from "@/components/ecart-d-estimation";
import {
  champDesVentesEstimees,
  propositionIntacte,
  ventesEstimeesParDefaut,
  ventesEstimeesParReference,
  ventesEstimeesSaisies,
} from "@/config/ventes-estimees";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { NOVA_DEFINITION } from "@/config/scenarios/registry";
import { applyMarketScale } from "@/config/scenarios/market-scale";
import { estimerLeTour, expurgerLeScenario, repartitionDesVentes } from "@/engine/estimation";
import type { CompanyRoundResult, RoundDecisions, SalesEstimate } from "@/engine/types";

/**
 * L'ENCART ESTIMÉ, ET L'ÉCART QUE LE MARCHÉ RÉVÈLE — TELS QU'ILS S'AFFICHENT.
 *
 * Les gardes de source disent ce qui est interdit ; celles-ci disent ce qui est
 * RENDU : les quatre chiffres, l'alerte de rupture, l'alerte de trésorerie, la
 * ligne du rituel, le tableau estimé / réel, et le silence quand rien n'a été
 * estimé.
 */

const v = NOVA_DEFINITION.vocabulary;
const scenario = applyMarketScale(NOVA_DEFINITION.scenario, 1 + NOVA_DEFINITION.bots.length);
const CODE = scenario.product.code;
const ouverture = NOVA_DEFINITION.company("player", "NOVA", "human");
const dossier = {
  scenario: expurgerLeScenario(scenario),
  state: ouverture,
  roundIndex: 1,
  events: [],
  orderOffer: null,
  repartition: repartitionDesVentes(scenario, 1, null),
};
const decisions: RoundDecisions = {
  price: 69,
  productionPlan: 2_000,
  marketingBudget: 8_000,
  qualityBudget: 2_000,
  maintenanceBudget: 5_000,
};
const lisible = (t: string) => t.replace(/[\u202f\u00a0\u2009]/g, " ").replace(/&#x27;/g, "'");
const rendu = (noeud: Parameters<typeof renderToStaticMarkup>[0]) =>
  lisible(renderToStaticMarkup(noeud));

describe("l'encart « Résultat estimé »", () => {
  it("montre les quatre chiffres, et dit d'où ils viennent", () => {
    const estime = estimerLeTour(dossier, decisions, { [CODE]: 1_500 });
    const html = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v }));
    expect(html).toContain("Résultat estimé");
    expect(html).toContain("selon vos ventes estimées");
    for (const titre of [
      "Chiffre d'affaires",
      "Résultat net",
      "Trésorerie fin de tour",
      "Stock final",
    ]) {
      expect(html, `${titre} absent de l'encart`).toContain(titre);
    }
    // Le compte ligne à ligne, replié : un `<details>` fermé reste dans le DOM.
    expect(html).toContain("Compte de résultat estimé");
    expect(html).toContain("= RÉSULTAT NET");
    expect(html).not.toContain("<details open");
  });

  it("une estimation qu'on ne pourra pas livrer se dit, avec le nombre", () => {
    const estime = estimerLeTour(dossier, decisions, { [CODE]: 5_000 });
    const html = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v }));
    expect(html).toContain("Vous ne pourrez livrer que");
    expect(estime.manquantes).toBeGreaterThan(0);
  });

  it("une trésorerie estimée négative se dit par le texte, pas par une couleur", () => {
    const estime = estimerLeTour(
      dossier,
      { ...decisions, productionPlan: 7_000, marketingBudget: 60_000 },
      { [CODE]: 0 },
    );
    // Sans vente estimée, pas de zéros : le cadran invite à estimer (lot P7).
    const sansVentes = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v }));
    expect(sansVentes).toContain("Estimez vos ventes pour voir le résultat");
    expect(sansVentes).not.toContain("<dl");
    expect(sansVentes).not.toContain("passe sous zéro");
    const avecVentes = estimerLeTour(
      dossier,
      { ...decisions, productionPlan: 7_000, marketingBudget: 60_000 },
      { [CODE]: 100 },
    );
    expect(avecVentes.tresorerieNette).toBeLessThan(0);
    const html = rendu(createElement(EncartResultatEstime, { estime: avecVentes, vocabulary: v }));
    expect(html).toContain("passe sous zéro");
    expect(html).toContain("pastille-etat");
    expect(html).not.toMatch(/text-(?:red|emerald)-\d{3}/);
  });

  /*
   * LOT P7 : LE CADRAN NE DISPARAÎT PLUS, IL NE MONTRE JAMAIS DE ZÉROS. Cette
   * garde disait « rien n'est estimé : rien ne paraît » — un encart de zéros
   * est un meuble. Le cadran collant reste à sa place (il ne saute pas quand le
   * compte arrive), mais la règle tient : aucun chiffre tant que rien n'est
   * estimé ; une invitation et un lien vers le champ quand les ventes valent 0.
   */
  it("rien n'est estimé : aucun chiffre, et zéro vente invite à estimer", () => {
    const attente = rendu(createElement(EncartResultatEstime, { estime: null, vocabulary: v }));
    expect(attente).toContain("Résultat estimé");
    expect(attente).not.toContain("<dl");
    expect(attente).not.toMatch(/\d\s?€/);
    const zero = estimerLeTour(dossier, decisions, { [CODE]: 0 });
    const html = rendu(createElement(EncartResultatEstime, { estime: zero, vocabulary: v }));
    expect(html).toContain("Estimez vos ventes pour voir le résultat");
    expect(html).toMatch(/<a [^>]*href="#decisions"/);
    expect(html).not.toContain("<dl");
    expect(html).not.toMatch(/\d\s?€/);
  });

  it("le cadran est collant, relevé, et porte le résultat net et la trésorerie en grand", () => {
    const estime = estimerLeTour(dossier, decisions, { [CODE]: 1_500 });
    const html = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v }));
    expect(html).toMatch(/^<section[^>]*class="cadran-estime"/);
    // Le résultat net est le premier chiffre du bandeau, marqué pour l'e2e.
    const bande = html.slice(html.indexOf("cadran-bande"), html.indexOf("cadran-detail"));
    expect(bande.indexOf("Résultat net")).toBeLessThan(bande.indexOf("Trésorerie fin de tour"));
    expect(bande).toContain("data-resultat-net-estime");
    expect(bande.match(/chiffre-estime/g)?.length).toBe(3);
    // Le stock final et le compte sont dans le repli, pas dans le bandeau.
    expect(bande).not.toContain("Stock final");
  });

  it("sur téléphone, une ligne compacte pour la barre : le résultat, et le détail dans un tiroir", () => {
    const estime = estimerLeTour(dossier, decisions, { [CODE]: 1_500 });
    const resume = resumeDeLEstimation(estime, v.units);
    const html = rendu(createElement(LigneEstimeeCompacte, { estimation: resume }));
    expect(html).toContain("Rés. estimé");
    expect(html).toContain("data-resultat-net-estime");
    // Le détail : chiffre d'affaires, stock, trésorerie, dans un tiroir fermé.
    expect(html).toContain("<details");
    expect(html).not.toContain("<details open");
    expect(html).toContain("tiroir-estime");
    for (const titre of ["Chiffre d'affaires", "Stock final", "Trésorerie fin de tour"]) {
      expect(html).toContain(titre);
    }
    expect(rendu(createElement(LigneEstimeeCompacte, { estimation: null }))).toBe("");
    // Zéro vente estimée : une invitation, pas de zéros.
    const zero = resumeDeLEstimation(estimerLeTour(dossier, decisions, { [CODE]: 0 }), v.units);
    const vide = rendu(createElement(LigneEstimeeCompacte, { estimation: zero }));
    expect(vide).toContain("Estimez vos ventes");
    expect(vide).toContain('aria-label="Estimez vos ventes pour voir le résultat"');
    expect(vide).not.toMatch(/\d\s?€/);
  });

  it("l'aide du champ rappelle les ventes ET les manques du tour passé", () => {
    expect(lisible(aideDesVentesEstimees({ tour: 2, vendu: 4_200, manque: 380 }, v)!)).toBe(
      "Tour 2 : 4 200 enceintes vendues, 380 de demande non servie",
    );
    expect(lisible(aideDesVentesEstimees({ tour: 1, vendu: 900, manque: 0 }, v)!)).toBe(
      "Tour 1 : 900 enceintes vendues, rien n'a manqué",
    );
    // Un métier dont l'unité est masculine ne reçoit pas l'accord féminin.
    expect(
      lisible(
        aideDesVentesEstimees(
          { tour: 3, vendu: 12, manque: 0 },
          {
            units: "couverts",
            unitsGender: "m",
          },
        )!,
      ),
    ).toBe("Tour 3 : 12 couverts vendus, rien n'a manqué");
    // Au premier tour, rien à rappeler : pas de ligne plutôt qu'un zéro.
    expect(aideDesVentesEstimees(undefined, v)).toBeUndefined();
  });
});

describe("les ventes estimées, lues sur le formulaire", () => {
  const form = (champs: Record<string, string>) => {
    const d = new FormData();
    for (const [k, x] of Object.entries(champs)) d.append(k, x);
    return d;
  };

  it("un champ par référence, sous un nom construit une seule fois", () => {
    expect(champDesVentesEstimees("ENC-01")).toBe("ventesEstimees.ENC-01");
    const lu = ventesEstimeesParReference(
      form({ "ventesEstimees.A": "120", "ventesEstimees.B": "80", price: "59" }).entries(),
    );
    expect(lu).toEqual({ A: 120, B: 80 });
  });

  it("aucun champ : aucune estimation (et non une estimation à zéro)", () => {
    expect(ventesEstimeesParReference(form({ price: "59" }).entries())).toBeNull();
    expect(ventesEstimeesSaisies(form({ price: "59" }))).toBeNull();
  });

  it("zéro vente estimée n'est pas une estimation", () => {
    expect(ventesEstimeesSaisies(form({ "ventesEstimees.A": "0" }))).toBeNull();
    expect(ventesEstimeesSaisies(form({ "ventesEstimees.A": "" }))).toBeNull();
    const saisie = ventesEstimeesSaisies(
      form({ "ventesEstimees.A": "40", "ventesEstimees.B": "0" }),
    );
    expect(saisie?.units).toBe(40);
    expect(saisie?.byProduct).toEqual({ A: 40, B: 0 });
  });

  it("une proposition laissée telle quelle n'est pas une estimation (lot P4)", () => {
    // Le témoin caché part tant que le joueur n'a pas touché aux ventes
    // estimées : la validation ne garde rien, la fin de tour n'oppose rien.
    const intacte = form({ "ventesEstimees.A": "1800", propositionDeVentes: "1" });
    expect(propositionIntacte(intacte)).toBe(true);
    expect(ventesEstimeesSaisies(intacte)).toBeNull();
    // L'encart, lui, lit bien la proposition : c'est ce qui le fait parler.
    expect(ventesEstimeesParReference(intacte.entries())).toEqual({ A: 1800 });
    // Touchée (le témoin ne part plus), la même valeur devient l'estimation.
    const touchee = form({ "ventesEstimees.A": "1800" });
    expect(propositionIntacte(touchee)).toBe(false);
    expect(ventesEstimeesSaisies(touchee)?.units).toBe(1800);
    // Un témoin à une autre valeur ne vaut rien.
    expect(ventesEstimeesSaisies(form({ "ventesEstimees.A": "1800", propositionDeVentes: "0" }))?.units).toBe(1800);
  });

  it("une saisie négative ou illisible vaut zéro, jamais NaN", () => {
    expect(
      ventesEstimeesParReference(
        form({ "ventesEstimees.A": "-12", "ventesEstimees.B": "abc" }).entries(),
      ),
    ).toEqual({ A: 0, B: 0 });
  });

  it("l'estimation ne descend pas dans les décisions du tour", () => {
    // Le champ est lu par SON module ; la lecture des décisions l'ignore,
    // et le moteur ne le voit jamais.
    const { decisions: lues } = decisionsSaisies(
      form({
        price: "59",
        productionPlan: "100",
        marketingBudget: "0",
        qualityBudget: "0",
        maintenanceBudget: "0",
        "ventesEstimees.A": "999",
      }),
    );
    expect(JSON.stringify(lues)).not.toContain("999");
    expect("salesEstimate" in lues).toBe(false);
  });
});

describe("« le marché répond » : l'écart entre l'estimation et la réalité", () => {
  /** Un résultat de tour minimal, suffisant pour la comparaison. */
  const resultat = (over: Partial<CompanyRoundResult> = {}): CompanyRoundResult =>
    ({
      market: {
        totalShare: 0.2,
        bySegment: {
          etudiants: {
            potential: 5_000,
            attraction: 1,
            share: 0.2,
            demandForCompany: 1_200,
            sold: 1_200,
            lost: 0,
            revenue: 70_000,
            commission: 0,
          },
        },
      },
      incomeStatement: { revenue: 82_800, netIncome: 4_300 },
      functionalBalance: { netTreasury: 21_000 },
      orderOffer: { delivered: 200 },
      ...over,
    }) as unknown as CompanyRoundResult;

  const estimation: SalesEstimate = {
    byProduct: { [CODE]: 1_500 },
    units: 1_500,
    estimate: { revenue: 90_000, netIncome: 7_000, netTreasury: 25_000, deliverableUnits: 1_500 },
  };

  it("ce qui a été vendu compte la commande exceptionnelle", () => {
    expect(unitesVendues(resultat())).toBe(1_400);
  });

  it("quatre lignes : ventes, chiffre d'affaires, résultat, trésorerie", () => {
    const lignes = lignesDEcart(estimation, resultat(), v)!;
    expect(lignes.map((l) => l.cle)).toEqual(["ventes", "ca", "resultat", "tresorerie"]);
    expect(lignes[0]!.estime).toBe(1_500);
    expect(lignes[0]!.reel).toBe(1_400);
    expect(lignes[2]!.estime).toBe(7_000);
    expect(lignes[2]!.reel).toBe(4_300);
  });

  it("une estimation de ventes sans compte ne donne que la ligne des ventes", () => {
    const lignes = lignesDEcart({ byProduct: { [CODE]: 900 }, units: 900 }, resultat(), v)!;
    expect(lignes.map((l) => l.cle)).toEqual(["ventes"]);
  });

  it("aucune estimation déposée : rien du tout", () => {
    expect(lignesDEcart(null, resultat(), v)).toBeNull();
    expect(lignesDEcart({ byProduct: {}, units: 0 }, resultat(), v)).toBeNull();
    expect(
      rendu(
        createElement(LigneEstimeEtReel, { estimation: null, result: resultat(), vocabulary: v }),
      ),
    ).toBe("");
    expect(
      rendu(
        createElement(TableauEstimeReel, {
          estimation: null,
          result: resultat(),
          vocabulary: v,
          periode: "Trimestre 2",
        }),
      ),
    ).toBe("");
  });

  it("la ligne du rituel : « Vous aviez estimé … le marché a donné … »", () => {
    const html = rendu(
      createElement(LigneEstimeEtReel, { estimation, result: resultat(), vocabulary: v }),
    );
    expect(html).toContain("Vous aviez estimé");
    expect(html).toContain("le marché a donné");
    expect(html).toContain("Ventes estimées");
    expect(html).toContain("vendues");
    // L'estimation à l'encre, le réel à la couleur du résultat.
    expect(html).toMatch(/text-slate-100[^>]*>\+7 000 €/);
    expect(html).toMatch(/text-emerald-300[^>]*>\+4 300 €/);
  });

  it("un résultat réel négatif garde sa couleur de perte", () => {
    const html = rendu(
      createElement(LigneEstimeEtReel, {
        estimation,
        result: resultat({
          incomeStatement: {
            revenue: 10,
            netIncome: -5_000,
          } as CompanyRoundResult["incomeStatement"],
        }),
        vocabulary: v,
      }),
    );
    expect(html).toMatch(/text-red-300[^>]*>−5 000 €/);
  });

  it("le tableau d'un tour passé : estimé, réel, écart signé", () => {
    const html = rendu(
      createElement(TableauEstimeReel, {
        estimation,
        result: resultat(),
        vocabulary: v,
        periode: "Trimestre 2",
      }),
    );
    expect(html).toContain("Estimé");
    expect(html).toContain("Réel");
    expect(html).toContain("Écart");
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
    expect(html).toContain("<caption");
    expect(html).toContain("tableau-financier");
    // Le réel moins l'estimé : −2 700 € de résultat, −100 enceintes.
    expect(html).toContain("−2 700 €");
    expect(html).toContain("−100");
    // Un écart EST un résultat : il porte le rouge.
    expect(html).toMatch(/data-ecart="true"[^>]*text-red-400/);
  });
});

describe("la valeur de départ des ventes estimées (lot P4)", () => {
  it("au premier tour, le plan de production proposé, marqué comme une proposition", () => {
    expect(ventesEstimeesParDefaut({ planDeProduction: 2_000.4, premierTour: true })).toEqual({
      valeur: 2_000,
      proposition: true,
    });
  });

  it("ce qui est déjà déposé ce tour-ci l'emporte, et n'est pas une proposition", () => {
    expect(
      ventesEstimeesParDefaut({ deposee: 1_250, planDeProduction: 2_000, premierTour: true }),
    ).toEqual({ valeur: 1_250, proposition: false });
  });

  it("à partir du deuxième tour, la règle d'avant : les ventes du tour passé", () => {
    expect(
      ventesEstimeesParDefaut({ venduAuTourPasse: 900, planDeProduction: 2_000, premierTour: false }),
    ).toEqual({ valeur: 900, proposition: false });
    // Déposé l'emporte sur vendu.
    expect(
      ventesEstimeesParDefaut({ deposee: 950, venduAuTourPasse: 900, premierTour: false }),
    ).toEqual({ valeur: 950, proposition: false });
    // Une référence sans repère après le premier tour (lancée en cours de
    // partie) part à zéro : on ne lui propose pas son plan.
    expect(ventesEstimeesParDefaut({ planDeProduction: 2_000, premierTour: false })).toEqual({
      valeur: 0,
      proposition: false,
    });
  });

  it("sans plan de production, rien n'est proposé", () => {
    expect(ventesEstimeesParDefaut({ premierTour: true })).toEqual({ valeur: 0, proposition: false });
    expect(ventesEstimeesParDefaut({ planDeProduction: 0, premierTour: true })).toEqual({
      valeur: 0,
      proposition: false,
    });
  });

  it("la proposition ne touche pas le marché : l'estimation ne descend pas dans les décisions", () => {
    // Le plan de production proposé, repris en ventes estimées, laisse les
    // décisions lues IDENTIQUES à ce qu'elles sont sans lui.
    const sans = new FormData();
    for (const [k, x] of Object.entries({ price: "59", productionPlan: "2000", marketingBudget: "0", qualityBudget: "0", maintenanceBudget: "0" })) sans.append(k, x);
    const avec = new FormData();
    for (const [k, x] of sans.entries()) avec.append(k, x);
    avec.append(`ventesEstimees.${CODE}`, "2000");
    avec.append("propositionDeVentes", "1");
    expect(JSON.stringify(decisionsSaisies(avec).decisions)).toBe(
      JSON.stringify(decisionsSaisies(sans).decisions),
    );
    // Et l'estimation que la proposition fait parler est un compte, pas un vide.
    const estime = estimerLeTour(dossier, decisions, { [CODE]: decisions.productionPlan });
    const html = rendu(createElement(EncartResultatEstime, { estime, vocabulary: v }));
    expect(html).toContain("data-resultat-estime");
  });
});
