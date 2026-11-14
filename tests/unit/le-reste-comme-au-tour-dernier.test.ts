import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cartesARepliser, CLE_DU_RESTE, QUESTION_DU_RESTE } from "@/config/le-reste";
import { scenarioByCode } from "@/config/scenarios/registry";
const NOVA_SITUATIONS = scenarioByCode("nova").situations;

/**
 * P1-8 DE LA SÉANCE D'ESSAI, ET SES FINITIONS (P1-3, P1-4, P1-9, P2-4, P2-6, P2-9).
 *
 * Au niveau 3, les onze cartes de décision du téléphone (commande, ventes estimées, prix,
 * production, fournisseur, budgets, programmes, équipe, créances, études, note) : à partir
 * du tour 2, celles dont l'équipe garde les valeurs se replient en une seule.
 */
const CLES_DU_NIVEAU_3 = [
  "commande", "ventes-estimees", "prix", "volume", "fournisseur", "budgets",
  "modules-budgets", "rh", "mobilisation", "etudes", "justification", "recap",
];
const TOUR_1 = { supplierChoice: "premium", marketingBudget: 8000, qualityBudget: 5000, maintenanceBudget: 4686, hr: { hire: 0, salaryIndex: 1 }, studies: { market: true } };
const PROPOSE_AU_TOUR_2 = { supplierChoice: "premium", marketingBudget: 8000, qualityBudget: 5000, maintenanceBudget: 4686, hr: { salaryIndex: 1 } };

describe("« Le reste, comme au tour dernier »", () => {
  it("au tour 2, les leviers gardés se replient : six cartes en une", () => {
    expect(cartesARepliser({ cles: CLES_DU_NIVEAU_3, tour: 2, proposees: PROPOSE_AU_TOUR_2, precedentes: TOUR_1 })).toEqual([
      "fournisseur", "budgets", "modules-budgets", "rh", "mobilisation", "etudes",
    ]);
    expect(CLE_DU_RESTE).toBe("reste");
    expect(QUESTION_DU_RESTE).toBe("Le reste, comme au tour dernier");
  });

  it("au tour 1, rien n'est replié", () => {
    expect(cartesARepliser({ cles: CLES_DU_NIVEAU_3, tour: 1, proposees: PROPOSE_AU_TOUR_2, precedentes: null })).toEqual([]);
  });

  it("un levier qui change ne se replie pas, et le prix, la production, la commande jamais", () => {
    const r = cartesARepliser({ cles: CLES_DU_NIVEAU_3, tour: 3, proposees: { ...PROPOSE_AU_TOUR_2, supplierChoice: "standard" }, precedentes: TOUR_1 });
    expect(r).not.toContain("fournisseur");
    for (const cle of ["commande", "ventes-estimees", "prix", "volume", "justification", "recap"]) expect(r).not.toContain(cle);
  });

  it("la feuille replie ces cartes, les garde au récapitulatif, et les rouvre une à une", () => {
    const feuille = readFileSync("src/components/decision-form.tsx", "utf8");
    expect(feuille).toContain("cartesARepliser({");
    expect(feuille).toContain("toutesLesCartes\n                .filter((c) => c.resume)");
    expect(feuille).toContain("<LeResteCommeAuTourDernier");
    expect(feuille).toContain("allerALaCarteDeCle(");
    const page = readFileSync("src/app/arena/[gameId]/page.tsx", "utf8");
    expect(page).toContain("decisionsDuTourPasse={view.lastDecisions}");
  });
});

describe("l'équipe qui a validé, et l'attente (P1-3, P1-4)", () => {
  it("le parcours s'ouvre sur le récapitulatif, sans aplat qui invite à refaire", () => {
    const page = readFileSync("src/app/arena/[gameId]/page.tsx", "utf8");
    expect(page).toContain("ouvrirSurLesDecisions={view.kind !== \"solo\" && view.pendingDecisions !== null}");
    expect(page).toContain("<EnAttenteDeLaCloture");
    const feuille = readFileSync("src/components/decision-form.tsx", "utf8");
    expect(feuille).not.toContain('? "Mettre à jour mes décisions validées"');
    expect(feuille).toContain('export const LIBELLE_REMPLACER = "Remplacer les décisions validées";');
    expect(feuille).toMatch(/remplacement\s*\?\s*`\$\{bouton\(\{ variante: "secondaire"/);
  });
});

describe("les finitions", () => {
  it("P1-9 : le bouton de l'étape Analyse dit ce qui reste", () => {
    const parcours = readFileSync("src/components/parcours-mobile.tsx", "utf8");
    expect(parcours).toContain('"Il vous reste 1 situation à analyser"');
    expect(parcours).toContain("{resteAAnalyserEnClair(resteAAnalyser)}");
    expect(readFileSync("src/components/situation-panel.tsx", "utf8")).toContain("definirEntete?.({ titre: titreDeLEcran, amorce, reste });");
  });

  it("P2-4 : la situation du tour 1 ne nomme aucun concurrent absent de la partie", () => {
    const t1 = NOVA_SITUATIONS.find((s) => s.code === "nova_t1_takeover")!;
    expect(t1.narrative).not.toMatch(/Auris|SoundBox/);
  });

  it("P2-6 : « Produire n'est pas vendre » attend un atelier saturé qui a refusé des clients", () => {
    const s = NOVA_SITUATIONS.find((x) => x.code === "nova_t3_capacity")!;
    expect("round" in s.trigger && s.trigger.requires).toBe("capacity_saturated");
  });

  it("P2-9 : le titre long prend un cran de moins, et le « ? » ne part plus seul", () => {
    const barre = readFileSync("src/components/barre-de-jeu.tsx", "utf8");
    expect(barre).toContain('{titreInsecable(enTete?.titre ?? "")}');
    expect(barre).toContain('titre.length > TITRE_D_ETAPE_LONG ? "text-base" : "text-lg"');
    expect("Chez qui vous approvisionnez-vous ?".length).toBeGreaterThan(30);
  });
});
