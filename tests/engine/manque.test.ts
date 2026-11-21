import { describe, expect, it } from "vitest";
import { analyserLeManque, type EntreeDuManque, type ReferenceDuManque } from "../../src/engine/estimation/manque";
import { alerteDuManque, phrasesDuManque } from "../../src/lib/phrases-du-manque";

/**
 * POURQUOI IL MANQUERA DES VENTES : la cause, lue dans le tour estimé.
 *
 * Des cas construits, un par cause : machines seules, main-d'œuvre seule, plan
 * trop bas, référence pas encore lancée, rupture et rationnement fournisseur,
 * rebuts, en mono-produit et en gamme ; et aucun manque, aucune alerte.
 */

const v = { unit: "enceinte", units: "enceintes" };
const lisible = (t: string) => t.replace(/[   ]/g, " ");
const texte = (e: EntreeDuManque, embauches = true) =>
  lisible(alerteDuManque(analyserLeManque(e)!, v, { embauches }));

/** Une référence sans histoire : tout ce qu'elle planifie, elle le produit et le livre. */
function ref(p: Partial<ReferenceDuManque> & { code: string }): ReferenceDuManque {
  const plan = p.planSaisi ?? 0;
  return {
    nom: p.code,
    estimees: plan,
    livrables: plan,
    stockOuverture: 0,
    planSaisi: plan,
    planRetenu: plan,
    planApprovisionne: plan,
    produit: plan,
    rebuts: 0,
    heuresParUnite: 0.3,
    rupture: false,
    rationnement: 1,
    ...p,
  };
}

const atelier = {
  capaciteMachine: 7_000,
  capaciteMachineAPlein: 7_000,
  capaciteMainDOeuvre: 7_200,
  effectif: 4,
};

describe("aucun manque, aucune alerte", () => {
  it("tout ce qui est estimé se livre : l'analyse est nulle", () => {
    expect(
      analyserLeManque({ gamme: false, ...atelier, references: [ref({ code: "nova", planSaisi: 5_000 })] }),
    ).toBeNull();
  });

  it("un reste de virgule flottante n'est pas un manque", () => {
    expect(
      analyserLeManque({
        gamme: false,
        ...atelier,
        references: [ref({ code: "nova", planSaisi: 5_000, livrables: 4_999.9999999 })],
      }),
    ).toBeNull();
  });
});

describe("mono-produit", () => {
  it("machines seules, usées : la disponibilité, en pourcentage", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMachine: 5_740,
      references: [ref({ code: "nova", planSaisi: 7_000, estimees: 7_000, livrables: 5_740, produit: 5_740 })],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["machines"]);
    expect(a.capaciteDuTour).toBe(5_740);
    expect(a.disponibilite).toBeCloseTo(0.82, 6);
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 5 740 enceintes : 1 260 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 5 740 enceintes, pas 7 000 : vos machines ne sont disponibles qu'à 82,00 %. " +
        "Ce tour, ramenez vos ventes estimées à ce que l'atelier peut produire ; un meilleur entretien relèvera la disponibilité au tour suivant.",
    );
  });

  it("machines seules, à plein : une machine achetée n'arrive qu'au tour suivant", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMainDOeuvre: 9_000,
      references: [ref({ code: "nova", planSaisi: 8_000, estimees: 8_000, livrables: 7_000, produit: 7_000 })],
    };
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 7 000 enceintes : 1 000 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 7 000 enceintes, pas 8 000 : vos machines tournent déjà à plein. " +
        "Ce tour, ramenez vos ventes estimées à ce que l'atelier peut produire ; une machine achetée n'arriverait qu'au tour suivant.",
    );
  });

  it("main-d'œuvre seule : les heures des salariés", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMainDOeuvre: 6_383,
      references: [ref({ code: "nova", planSaisi: 7_000, estimees: 7_000, livrables: 6_383, produit: 6_383 })],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["main-d-oeuvre"]);
    expect(a.capaciteDuTour).toBe(6_383);
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 6 383 enceintes : 617 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 6 383 enceintes, pas 7 000 : vos 4 salariés n'ont pas assez d'heures. " +
        "Ce tour, ramenez vos ventes estimées à ce que l'atelier peut produire ; une embauche ne compterait qu'au tour suivant.",
    );
  });

  it("main-d'œuvre sans embauche au niveau : le conseil s'arrête au plan", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMainDOeuvre: 6_383,
      references: [ref({ code: "nova", planSaisi: 7_000, estimees: 7_000, livrables: 6_383, produit: 6_383 })],
    };
    expect(texte(e, true)).toContain("une embauche ne compterait qu'au tour suivant");
    const sans = texte(e, false);
    expect(sans).not.toMatch(/embauch/i);
    expect(sans).toMatch(/Ce tour, ramenez vos ventes estimées à ce que l'atelier peut produire\.$/);
  });

  it("plan trop bas : le plan, stock compris, ne couvre pas l'estimation", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      references: [ref({ code: "nova", planSaisi: 3_000, stockOuverture: 200, estimees: 4_000, livrables: 3_200 })],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["plan"]);
    // La capacité n'est pas en cause : pas de capacité du tour à annoncer.
    expect(a.capaciteDuTour).toBeNull();
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 3 200 enceintes : 800 de vos ventes estimées manqueraient. " +
        "Votre plan de production, stock compris, ne couvre que 3 200 enceintes sur les 4 000 de vos ventes estimées. " +
        "Pour livrer plus, montez ce plan de production.",
    );
  });

  it("rupture d'approvisionnement : elle ampute l'usine, et se dit comme telle", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMachine: 3_500,
      ruptureDeLUsine: true,
      references: [ref({ code: "nova", planSaisi: 5_000, estimees: 5_000, livrables: 3_500, produit: 3_500, rupture: true })],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["approvisionnement"]);
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 3 500 enceintes : 1 500 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 3 500 enceintes, pas 5 000 : une rupture d'approvisionnement arrête une partie de la production. " +
        "Pour livrer plus, choisissez un autre fournisseur ou ramenez vos ventes estimées à cette capacité.",
    );
  });

  it("rebuts : une part de la production ne se vend pas", () => {
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      references: [ref({ code: "nova", planSaisi: 5_000, estimees: 5_000, livrables: 4_750, rebuts: 250 })],
    };
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 4 750 enceintes : 250 de vos ventes estimées manqueraient. " +
        "Les rebuts retirent environ 250 enceintes de votre production. " +
        "Un budget qualité plus élevé réduirait les rebuts.",
    );
  });

  it("plusieurs causes : la plus contraignante d'abord", () => {
    // Plan de 6 000 pour 7 000 estimées (1 000 au plan), et l'atelier n'en sort que 5 600 (400 aux heures).
    const e: EntreeDuManque = {
      gamme: false,
      ...atelier,
      capaciteMainDOeuvre: 5_600,
      references: [ref({ code: "nova", planSaisi: 6_000, estimees: 7_000, livrables: 5_600, produit: 5_600 })],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => [l.cause, Math.round(l.unites)])).toEqual([
      ["plan", 1_000],
      ["main-d-oeuvre", 400],
    ]);
    const p = phrasesDuManque(a, v, { embauches: true });
    expect(lisible(p.causes[0]!)).toMatch(/^Votre plan de production/);
    expect(lisible(p.causes[1]!)).toMatch(/^Ce tour, votre atelier peut produire environ 5 600 enceintes, pas 6 000/);
    // Monter le plan au-delà des heures ne livrerait rien : le conseil dit la limite.
    expect(lisible(p.conseil!)).toBe(
      "Pour livrer plus, montez ce plan de production, dans la limite de votre atelier : environ 5 600 enceintes ce tour.",
    );
  });
});

describe("gamme", () => {
  const go = (p: Partial<ReferenceDuManque>) => ref({ code: "nova-go", nom: "NOVA Go", heuresParUnite: 0.18, ...p });
  const one = (p: Partial<ReferenceDuManque>) => ref({ code: "nova-one", nom: "NOVA One", heuresParUnite: 0.3, ...p });
  const studio = (p: Partial<ReferenceDuManque>) =>
    ref({ code: "nova-studio", nom: "NOVA Studio", heuresParUnite: 0.5, ...p });

  it("main-d'œuvre : tous les plans réduits du même facteur, chaque référence nommée", () => {
    // 2 160 h pour 2 250 h demandées : facteur 0,96 sur chaque plan.
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      capaciteMainDOeuvre: 6_048,
      references: [
        go({ planSaisi: 1_000, livrables: 960, produit: 960 }),
        one({ planSaisi: 2_900, livrables: 2_784, produit: 2_784 }),
        studio({ planSaisi: 2_400, livrables: 2_304, produit: 2_304 }),
      ],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["main-d-oeuvre"]);
    expect(a.references.map((r) => r.code)).toEqual(["nova-one", "nova-studio", "nova-go"]);
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 6 048 enceintes : 252 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 6 048 enceintes, pas 6 300 : vos 4 salariés n'ont pas assez d'heures. " +
        "Il manquerait 116 NOVA One, 96 NOVA Studio et 40 NOVA Go. " +
        "Pour livrer plus, baissez un plan de production, d'abord celui de NOVA Studio, la référence la plus longue à produire ; une embauche ne compterait qu'au tour suivant.",
    );
  });

  it("main-d'œuvre en gamme sans embauche : le plan de la référence la plus longue, rien d'autre", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      capaciteMainDOeuvre: 6_048,
      references: [
        go({ planSaisi: 1_000, livrables: 960, produit: 960 }),
        one({ planSaisi: 2_900, livrables: 2_784, produit: 2_784 }),
        studio({ planSaisi: 2_400, livrables: 2_304, produit: 2_304 }),
      ],
    };
    const sans = texte(e, false);
    expect(sans).not.toMatch(/embauch/i);
    expect(sans).toMatch(
      /Pour livrer plus, baissez un plan de production, d'abord celui de NOVA Studio, la référence la plus longue à produire\.$/,
    );
  });

  it("machines : la disponibilité de l'atelier partagé", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      capaciteMachine: 5_600,
      references: [
        go({ planSaisi: 3_000, livrables: 2_400, produit: 2_400 }),
        one({ planSaisi: 4_000, livrables: 3_200, produit: 3_200 }),
      ],
    };
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 5 600 enceintes : 1 400 de vos ventes estimées manqueraient. " +
        "Ce tour, votre atelier peut produire environ 5 600 enceintes, pas 7 000 : vos machines ne sont disponibles qu'à 80,00 %. " +
        "Il manquerait 800 NOVA One et 600 NOVA Go. " +
        "Pour livrer plus, baissez un plan de production ; un meilleur entretien relèvera la disponibilité au tour suivant.",
    );
  });

  it("plan trop bas pour une référence : celle-là seule, et son plan à monter", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      references: [
        go({ planSaisi: 2_000 }),
        one({ planSaisi: 2_500, estimees: 3_000, livrables: 2_500 }),
      ],
    };
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 4 500 enceintes : 500 de vos ventes estimées manqueraient. " +
        "Votre plan de NOVA One, stock compris, ne couvre que 2 500 enceintes sur les 3 000 de vos ventes estimées. " +
        "Il manquerait 500 NOVA One. " +
        "Pour livrer plus, montez ce plan de production.",
    );
  });

  it("rupture fournisseur : le plan de la seule référence touchée", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      references: [
        go({ planSaisi: 2_000, planApprovisionne: 1_000, produit: 1_000, livrables: 1_000, rupture: true }),
        one({ planSaisi: 3_000 }),
      ],
    };
    const a = analyserLeManque(e)!;
    expect(a.limites.map((l) => l.cause)).toEqual(["approvisionnement"]);
    expect(a.capaciteDuTour).toBeNull();
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 4 000 enceintes : 1 000 de vos ventes estimées manqueraient. " +
        "Le fournisseur de NOVA Go est en rupture : il ampute son plan de production. " +
        "Il manquerait 1 000 NOVA Go. " +
        "Pour livrer plus, choisissez un autre fournisseur ou baissez les ventes estimées de cette référence.",
    );
  });

  it("rationnement fournisseur : la part livrée, en pourcentage", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      references: [
        go({ planSaisi: 2_000, planApprovisionne: 1_200, produit: 1_200, livrables: 1_200, rationnement: 0.6 }),
        one({ planSaisi: 3_000 }),
      ],
    };
    expect(lisible(phrasesDuManque(analyserLeManque(e)!, v, { embauches: true }).causes[0]!)).toBe(
      "Le fournisseur de NOVA Go vous rationne : il ne livre que 60,00 % des composants.",
    );
  });

  it("une référence pas encore lancée ne se produit pas", () => {
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      references: [
        one({ planSaisi: 3_000 }),
        studio({ planSaisi: 500, planRetenu: 0, planApprovisionne: 0, produit: 0, livrables: 0 }),
      ],
    };
    expect(texte(e)).toBe(
      "Vous ne pourrez livrer que 3 000 enceintes : 500 de vos ventes estimées manqueraient. " +
        "Votre référence NOVA Studio n'est pas encore lancée : elle ne se produit pas ce tour. " +
        "Il manquerait 500 NOVA Studio. " +
        "Ramenez ses ventes estimées à zéro : elle ne se vendra qu'une fois sa R&D couverte.",
    );
  });

  it("une capacité qui coupe un plan en surplus ne crée pas de manque", () => {
    // Le Go planifié bien au-dessus de son estimation : la coupe ne mord que sur le surplus.
    const e: EntreeDuManque = {
      gamme: true,
      ...atelier,
      capaciteMachine: 6_300,
      references: [
        go({ planSaisi: 4_000, estimees: 3_000, produit: 3_600, livrables: 3_000 }),
        one({ planSaisi: 3_000, produit: 2_700, livrables: 2_700 }),
      ],
    };
    const a = analyserLeManque(e)!;
    expect(a.references.map((r) => [r.code, Math.round(r.manquantes)])).toEqual([["nova-one", 300]]);
    expect(a.limites.map((l) => l.cause)).toEqual(["machines"]);
  });
});
