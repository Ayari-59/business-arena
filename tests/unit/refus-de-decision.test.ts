import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * LA DÉCISION QUI NE PASSE PAS DIT POURQUOI, ET OÙ.
 *
 * Chaque règle qui peut refuser une décision (bornes de la feuille, garde-fous
 * du schéma serveur, volume nul, sauvetage, refus des services) produit :
 *   · un message LISIBLE, qui nomme le champ dans la langue du secteur et dit
 *     comment corriger (le minimum, le maximum, le pas accepté) ;
 *   · le CHEMIN DU CHAMP du formulaire, pour que l'écran le marque, l'ouvre et
 *     y pose le focus ;
 *   · jamais un texte de bibliothèque (« Invalid input », « Too big »…).
 */

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
vi.mock("@/services/game-view.service", () => ({ getGameView: vi.fn(async () => null) }));
vi.mock("@/lib/guest", () => ({ getGuestUserId: async () => "invite-1" }));
vi.mock("@/services/debrief.service", () => ({ retakeSituation: vi.fn() }));
vi.mock("@/services/pedagogy.service", () => ({
  submitDiagnosis: vi.fn(),
  submitQuiz: vi.fn(),
  unlockHint: vi.fn(),
}));
vi.mock("@/services/game.service", () => ({
  getGameKind: vi.fn(async () => "class"),
  getGameVocabulary: vi.fn(async () => ({
    productionPlanLabel: "Production",
    units: "enceintes",
    unit: "enceinte",
    priceLabel: "Prix de vente",
  })),
  nommerEquipe: vi.fn(),
  resolveCurrentRound: vi.fn(),
  submitTeamDecisions: vi.fn(async () => ({ roundIndex: 1 })),
}));

const {
  BORNES_DES_CHAMPS,
  BORNES_PAR_REFERENCE,
  MESSAGE_DE_PANNE,
  champDuChemin,
  erreurDuChamp,
  erreursDuSchema,
  libelleDuChamp,
  messageDuRefusServeur,
  refusDuVolume,
} = await import("@/config/refus-de-decision");
const { roundDecisionsSchema } = await import("@/services/decision-schema");
const { playRoundAction } = await import("@/app/arena/[gameId]/actions");
const { submitTeamDecisions } = await import("@/services/game.service");
const { enrichError } = await import("@/services/stabilization.service");
const { PARTIE_ARCHIVEE } = await import("@/services/archivage");
const { playLockMessage } = await import("@/services/play-lock");

const ctx = {
  vocabulaire: {
    priceLabel: "Prix de vente",
    productionPlanLabel: "Production",
    units: "enceintes",
    unit: "enceinte",
  },
  references: [
    { code: "one", name: "NOVA One" },
    { code: "max", name: "NOVA Max" },
  ],
};

/** Le texte d'une bibliothèque, ou d'un code : rien de cela n'arrive au joueur. */
const BRUT = /Invalid|expected|received|too_small|too_big|Too (big|small)|Number must|\bundefined\b|\bnull\b|\bpath\b/i;
const BRUT_CASSE = /\bNaN\b/;
/** Intl écrit les milliers avec une espace fine insécable : on la lit comme une espace. */
const espaces = (t: string) => t.replace(/[\u202f\u00a0]/g, " ");

function lisible(message: string, libelle: string) {
  expect(message, message).not.toMatch(BRUT);
  expect(message, message).not.toMatch(BRUT_CASSE);
  expect(message.startsWith(`${libelle} : `), message).toBe(true);
  // Aucun tiret en milieu de phrase (consignes d'écriture du dépôt).
  expect(message, message).not.toMatch(/ [—–-] /);
}

describe("chaque borne de la feuille refuse avec un message et un champ", () => {
  it("les champs du tour : sous le minimum, au-dessus du maximum", () => {
    for (const [nom, borne] of Object.entries(BORNES_DES_CHAMPS)) {
      const libelle = libelleDuChamp(nom, ctx);
      expect(libelle, `${nom} n'a pas de nom de joueur`).not.toBe("Ce champ");
      const bas = erreurDuChamp({ nom, brut: String(borne.min - 1), requis: true }, ctx);
      expect(bas?.champ, nom).toBe(nom);
      lisible(bas!.message, libelle);
      expect(bas!.message).toContain("Minimum accepté");
      const haut = erreurDuChamp({ nom, brut: String(borne.max + 1), requis: true }, ctx);
      expect(haut?.champ, nom).toBe(nom);
      lisible(haut!.message, libelle);
      expect(haut!.message).toContain("Maximum accepté");
      // Et la valeur juste à la borne passe.
      expect(erreurDuChamp({ nom, brut: String(borne.max), requis: true }, ctx)).toBeNull();
      expect(erreurDuChamp({ nom, brut: String(borne.min), requis: true }, ctx)).toBeNull();
    }
  });

  it("les champs d'une référence nomment la référence", () => {
    for (const [champ, borne] of Object.entries(BORNES_PAR_REFERENCE)) {
      const nom = `product.one.${champ}`;
      const libelle = libelleDuChamp(nom, ctx);
      expect(libelle).toMatch(/ de NOVA One$/);
      const haut = erreurDuChamp({ nom, brut: String(borne.max + 10), requis: true }, ctx);
      expect(haut?.champ).toBe(nom);
      lisible(haut!.message, libelle);
    }
    const prix = erreurDuChamp({ nom: "product.one.price", brut: "0", requis: true }, ctx)!;
    expect(prix.message).toBe(
      "Prix de vente de NOVA One : 0 € est sous le minimum accepté. Minimum accepté : 1 €.",
    );
  });

  it("une case vide, une saisie illisible, un entier attendu, un pas de saisie", () => {
    const vide = erreurDuChamp({ nom: "price", brut: "", requis: true }, ctx)!;
    expect(vide).toEqual({
      champ: "price",
      message: "Prix de vente : la case est vide. Saisissez au moins 1 €.",
    });
    const budget = erreurDuChamp({ nom: "marketingBudget", brut: " ", requis: true }, ctx)!;
    expect(budget.message).toBe(
      "Budget marketing : la case est vide. Saisissez une valeur (0 € si vous n'engagez rien).",
    );
    // Une case facultative vide (une colonne de gamme masquée) passe.
    expect(erreurDuChamp({ nom: "product.max.price", brut: "", requis: false }, ctx)).toBeNull();
    const illisible = erreurDuChamp({ nom: "price", brut: "", illisible: true, requis: true }, ctx)!;
    lisible(illisible.message, "Prix de vente");
    expect(illisible.message).toContain("n'est pas un nombre");
    const embauche = erreurDuChamp({ nom: "hire", brut: "1,5", requis: true }, ctx)!;
    expect(embauche.message).toBe(
      "Embauches : 1,5 personne n'est pas un nombre entier. Saisissez 1 personne ou 2 personnes.",
    );
    const prix = erreurDuChamp({ nom: "price", brut: "12,34", requis: true, pas: 0.1 }, ctx)!;
    expect(prix.message).toBe(
      "Prix de vente : 12,34 € ne tombe pas sur le pas de saisie (0,1 €). Saisissez 12,3 € ou 12,4 €.",
    );
    expect(erreurDuChamp({ nom: "price", brut: "12,3", requis: true, pas: 0.1 }, ctx)).toBeNull();
  });

  it("un plafond de l'écran dit d'où il vient", () => {
    const emprunt = erreurDuChamp({ nom: "newLoan", brut: "90000", requis: true, max: 61234 }, ctx)!;
    expect(espaces(emprunt.message)).toBe(
      "Nouvel emprunt : 90 000 € dépasse ce que la banque prête encore. Maximum accepté : 61 234 €.",
    );
    const apport = erreurDuChamp({ nom: "capitalIncrease", brut: "5", requis: true, max: 0 }, ctx)!;
    expect(apport.message).toContain("dépasse ce qui reste de l'enveloppe des associés");
    const dividende = erreurDuChamp({ nom: "dividend", brut: "100", requis: true, max: 0 }, ctx)!;
    expect(dividende.message).toContain("dépasse les réserves distribuables");
  });

  it("le volume nul, en mono-produit et en gamme", () => {
    const mono = refusDuVolume("productionPlan", ctx);
    expect(mono.champ).toBe("productionPlan");
    lisible(mono.message, "Production");
    const gamme = refusDuVolume("product.one.productionPlan", ctx);
    expect(gamme.champ).toBe("product.one.productionPlan");
    expect(gamme.message).toContain("volume total de vos références");
  });
});

describe("chaque refus du schéma serveur nomme son champ, jamais en langue zod", () => {
  const VALIDE = {
    price: 59,
    productionPlan: 4000,
    marketingBudget: 8000,
    qualityBudget: 0,
    maintenanceBudget: 0,
    rdBudget: 0,
    brandMarketingBudget: 0,
    products: { one: { price: 59, productionPlan: 10, marketingBudget: 0, qualityBudget: 0, rdBudget: 0 } },
    hr: { hire: 0, fire: 0, trainingBudget: 0, salaryIndex: 1 },
    investment: { machineCapacityUnits: 0 },
    finance: { newLoan: 0, loanRepayment: 0, capitalIncrease: 0, dividend: 0 },
    treasury: { discount: 0, factoring: 0, placement: 0 },
    rse: { budget: 0, investment: 0 },
    salesEstimate: { byProduct: { one: 10 }, units: 10 },
    communicationAxis: "prix",
  };
  const poser = (chemin: (string | number)[], valeur: unknown) => {
    const copie = structuredClone(VALIDE) as Record<string, unknown>;
    let x = copie;
    for (const p of chemin.slice(0, -1)) x = x[p] as Record<string, unknown>;
    x[chemin.at(-1)!] = valeur;
    return copie;
  };
  // Tous les chemins bornés du schéma, au-delà de leur borne (et sous elle).
  const CAS: [(string | number)[], unknown, string][] = [
    // En gamme, le prix est dérivé des références : son refus vise la première.
    [["price"], 20000, "product.one.price"],
    [["price"], 0, "product.one.price"],
    [["productionPlan"], 60000, "product.one.productionPlan"],
    [["marketingBudget"], -1, "product.one.marketingBudget"],
    [["maintenanceBudget"], 100001, "maintenanceBudget"],
    [["brandMarketingBudget"], 300000, "brandMarketingBudget"],
    [["products", "one", "price"], 0.5, "product.one.price"],
    [["products", "one", "productionPlan"], 70000, "product.one.productionPlan"],
    [["products", "one", "marketingBudget"], 999999, "product.one.marketingBudget"],
    [["products", "one", "qualityBudget"], -5, "product.one.qualityBudget"],
    [["products", "one", "rdBudget"], 600000, "product.one.rdBudget"],
    [["hr", "hire"], 11, "hire"],
    [["hr", "fire"], 1.5, "fire"],
    [["hr", "trainingBudget"], 100001, "trainingBudget"],
    [["hr", "salaryIndex"], 0.7, "salaryPercent"],
    [["investment", "machineCapacityUnits"], 60000, "machineCapacityUnits"],
    [["finance", "newLoan"], 600000, "newLoan"],
    [["finance", "loanRepayment"], -1, "loanRepayment"],
    [["finance", "capitalIncrease"], 600000, "capitalIncrease"],
    [["finance", "dividend"], 2000000, "dividend"],
    [["treasury", "discount"], 2000000, "discount"],
    [["treasury", "factoring"], -3, "factoring"],
    [["treasury", "placement"], 2000000, "placement"],
    [["rse", "budget"], 600000, "rseBudget"],
    [["rse", "investment"], -1, "rseInvestment"],
    [["salesEstimate", "byProduct", "one"], -2, "ventesEstimees.one"],
    [["communicationAxis"], "couleur", "communicationAxis"],
    [["price"], Number.NaN, "product.one.price"],
  ];

  it("la base de ces cas est une décision valide", () => {
    expect(roundDecisionsSchema.safeParse(VALIDE).success).toBe(true);
  });

  it.each(CAS)("%j = %j → %s", (chemin, valeur, attendu) => {
    const entree = poser(chemin, valeur);
    const r = roundDecisionsSchema.safeParse(entree);
    expect(r.success).toBe(false);
    const erreurs = erreursDuSchema(r.error!.issues, entree, ctx);
    expect(erreurs.length).toBeGreaterThanOrEqual(1);
    const e = erreurs.find((x) => x.champ === attendu);
    expect(e, JSON.stringify(erreurs)).toBeDefined();
    lisible(e!.message, libelleDuChamp(attendu, ctx));
  });

  it("en mono-produit, le prix vise son propre champ", () => {
    const { products: _p, ...mono } = structuredClone(VALIDE);
    const ctxMono = { vocabulaire: ctx.vocabulaire };
    for (const valeur of [20000, 0, Number.NaN]) {
      const entree = { ...mono, price: valeur };
      const r = roundDecisionsSchema.safeParse(entree);
      const erreurs = erreursDuSchema(r.error!.issues, entree, ctxMono);
      expect(erreurs.map((e) => e.champ)).toEqual(["price"]);
      lisible(erreurs[0]!.message, "Prix de vente");
    }
  });

  it("l'indice de salaire se dit en pour cent, comme il se saisit", () => {
    const entree = poser(["hr", "salaryIndex"], 0.7);
    const r = roundDecisionsSchema.safeParse(entree);
    const [e] = erreursDuSchema(r.error!.issues, entree, ctx);
    expect(e!.message).toBe(
      "Salaires (marché = 100) : 70 % est sous le minimum accepté. Minimum accepté : 80 %.",
    );
  });

  it("le parc de machines n'a pas de case : son refus se lit au récapitulatif", () => {
    const entree = poser(["investment", "equipmentBuy"], [{ typeCode: "x", quantity: 500 }]);
    const r = roundDecisionsSchema.safeParse(entree);
    const erreurs = erreursDuSchema(r.error!.issues, entree, ctx);
    expect(erreurs).toHaveLength(1);
    expect(erreurs[0]!.champ).toBeNull();
    expect(erreurs[0]!.message).not.toMatch(BRUT);
    expect(champDuChemin(["investment", "equipmentBuy", 0, "quantity"])).toBe("equipmentBuyJson");
  });
});

describe("les refus des services se disent au joueur, la panne ne montre pas le moteur", () => {
  it("un refus enveloppé par la résolution perd son préfixe technique", () => {
    const enveloppee = enrichError(new Error("Ce tour n'est pas ouvert"), {
      gameId: "4f1c-partie",
      roundIndex: 0,
      teamId: undefined,
    });
    const m = messageDuRefusServeur(enveloppee);
    expect(m).not.toMatch(/Résolution tour|partie 4f1c/);
    expect(m).toMatch(/^Ce tour n'est plus ouvert aux décisions/);
    expect(m).toContain("Rechargez la page");
  });

  it("chaque refus connu a sa phrase, et dit quoi faire", () => {
    for (const brut of [
      "Ce tour n'est pas ouvert",
      "Ce tour est déjà en cours de résolution",
      "Cette partie est terminée",
      "Partie introuvable",
      "Vous n'êtes pas membre de cette partie",
      "Mode compétition : vos décisions sont verrouillées après validation",
      PARTIE_ARCHIVEE,
      playLockMessage({ playable: false, state: "after", closesAt: new Date("2026-10-10T16:00:00Z") } as never)!,
      playLockMessage({ playable: false, state: "before", opensAt: null } as never)!,
    ]) {
      const m = messageDuRefusServeur(new Error(brut));
      expect(m, brut).not.toBe(MESSAGE_DE_PANNE);
      expect(m, brut).not.toMatch(/ [—–-] /);
    }
  });

  it("une panne du moteur devient une phrase générale", () => {
    for (const brut of [
      "Bilan déséquilibré (0.0004 €) pour team-1",
      "État NOVA invalide: cash NaN",
      "relation \"decisions\" does not exist",
      "",
    ]) {
      expect(messageDuRefusServeur(new Error(brut))).toBe(MESSAGE_DE_PANNE);
    }
    expect(messageDuRefusServeur(undefined)).toBe(MESSAGE_DE_PANNE);
  });
});

describe("l'action serveur rend ses refus champ par champ", () => {
  const formulaire = (champs: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(champs)) fd.append(k, v);
    return fd;
  };
  const BASE = { price: "59", productionPlan: "4000", marketingBudget: "8000", qualityBudget: "0", maintenanceBudget: "0" };

  it("un prix hors bornes (un formulaire périmé) vise le champ du prix", async () => {
    vi.mocked(submitTeamDecisions).mockClear();
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, price: "20000" }));
    expect(etat.erreurs).toHaveLength(1);
    expect(etat.erreurs![0]!.champ).toBe("price");
    expect(espaces(etat.erreurs![0]!.message)).toBe(
      "Prix de vente : 20 000 € dépasse le maximum accepté. Maximum accepté : 10 000 €.",
    );
    expect(etat.error).toBe(etat.erreurs![0]!.message);
    expect(submitTeamDecisions).not.toHaveBeenCalled();
  });

  it("plusieurs refus : un par champ, et un résumé qui les compte", async () => {
    const etat = await playRoundAction(
      "partie",
      { error: null },
      formulaire({ ...BASE, price: "0", newLoan: "900000", hire: "40", salaryPercent: "100" }),
    );
    expect(etat.erreurs!.map((e) => e.champ).sort()).toEqual(["hire", "newLoan", "price"]);
    expect(etat.error).toMatch(/^3 décisions ne passent pas/);
    for (const e of etat.erreurs!) expect(e.message).not.toMatch(BRUT);
  });

  it("le volume nul vise le plan de production", async () => {
    const etat = await playRoundAction("partie", { error: null }, formulaire({ ...BASE, productionPlan: "0" }));
    expect(etat.erreurs).toEqual([{ champ: "productionPlan", message: expect.stringContaining("≥ 1") }]);
  });

  it("le sauvetage exigé vise le nouvel emprunt", async () => {
    const { getGameView } = await import("@/services/game-view.service");
    vi.mocked(getGameView).mockResolvedValueOnce({
      exigenceSauvetage: { manque: 46000, capaciteEmprunt: 70000, enveloppeApport: 100000 },
    } as never);
    const etat = await playRoundAction("partie", { error: null }, formulaire(BASE));
    expect(etat.erreurs).toHaveLength(1);
    expect(etat.erreurs![0]!.champ).toBe("newLoan");
    expect(etat.erreurs![0]!.message).toMatch(/^Financement de sauvetage exigé : .*46\s000\s€/);
  });

  it("un tour clos par le service : sans champ, dans la langue du joueur", async () => {
    vi.mocked(submitTeamDecisions).mockRejectedValueOnce(
      enrichError(new Error("Ce tour n'est pas ouvert"), { gameId: "g", roundIndex: 0, teamId: undefined }),
    );
    const etat = await playRoundAction("partie", { error: null }, formulaire(BASE));
    expect(etat.erreurs).toHaveLength(1);
    expect(etat.erreurs![0]!.champ).toBeNull();
    expect(etat.error).toMatch(/^Ce tour n'est plus ouvert aux décisions/);
  });
});

describe("la feuille de décision montre ses refus", () => {
  const source = readFileSync(join(process.cwd(), "src/components/decision-form.tsx"), "utf8");

  it("elle juge elle-même sa saisie : plus de bulle du navigateur", () => {
    expect(source).toMatch(/<form[\s\S]*?noValidate[\s\S]*?onSubmit=\{verifierPivots\}/);
    expect(source).not.toContain("reportValidity(");
  });

  it("chaque champ chiffré nommé porte son refus (aria-invalid, aria-describedby, identifiant)", () => {
    const champs = [...source.matchAll(/<input\b[\s\S]*?\/>/g)]
      .map((m) => m[0])
      .filter((t) => /type="number"/.test(t) && /\bname=\{/.test(t));
    expect(champs.length).toBeGreaterThanOrEqual(6);
    for (const t of champs) {
      expect(t, t.slice(0, 200)).toContain("{...refus.attributs}");
      expect(t, t.slice(0, 200)).toContain("id={refus.id}");
    }
  });

  it("un récapitulatif annoncé, en tête de la feuille, aux liens qui mènent au champ", () => {
    const recap = source.slice(source.indexOf("data-recapitulatif-des-erreurs"));
    expect(source).toMatch(/role="alert"\s+data-recapitulatif-des-erreurs=""/);
    expect(recap).toContain("allerAuChamp(x.champ!)");
    // En tête : avant la piste des étapes, après le cadran du résultat estimé.
    expect(source.indexOf("data-recapitulatif-des-erreurs")).toBeLessThan(source.indexOf("data-piste-des-etapes"));
    expect(source.indexOf("<EncartResultatEstime")).toBeLessThan(source.indexOf("data-recapitulatif-des-erreurs"));
    // Le rouge des refus déjà en usage, jamais l'orange de l'action.
    expect(recap.slice(0, 1500)).toContain("encadre-perte");
    expect(recap.slice(0, 1500)).not.toMatch(/amber|orange|bouton-plein/);
  });
});
