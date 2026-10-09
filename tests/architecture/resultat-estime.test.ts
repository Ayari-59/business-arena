import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { IncomeStatement } from "../../src/engine/types";
import { lignesDuCompte, POSTES_HORS_CASCADE } from "../../src/components/lecture-des-comptes";

/**
 * L'ENCART « RÉSULTAT ESTIMÉ » : CE QU'IL NE DOIT JAMAIS DEVENIR.
 *
 * Trois fautes sont possibles ici, et aucune ne se verrait à l'écran :
 *   1. L'ESTIMATEUR PASSERAIT PAR LE SERVEUR. Il tourne dans le navigateur, à
 *      la frappe, parce qu'un aller-retour par tour de touche rendrait l'encart
 *      inutilisable — et parce que ce qui ne part pas au serveur n'a pas besoin
 *      d'en revenir. Un import de base de données, de `next` ou d'un service
 *      dans la chaîne du moteur le casserait sans qu'un test fonctionnel le
 *      voie : la page tomberait seulement en production.
 *   2. UNE ESTIMATION PRENDRAIT LA COULEUR D'UN RÉSULTAT. Le vert et le rouge
 *      francs sont au RÉSULTAT ; l'orange est à l'action. Une estimation
 *      s'écrit à l'encre, et une trésorerie estimée négative se signale par le
 *      texte et une pastille neutre.
 *   3. UNE LIGNE DU COMPTE MANQUERAIT à la cascade estimée. Le moteur ajoute un
 *      poste, le compte réel le montre, le compte estimé l'oublie : les deux
 *      divergeraient sous les yeux de l'élève.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf8");
const ENCART = lire("src/components/resultat-estime.tsx");
const ECART = lire("src/components/ecart-d-estimation.tsx");

// ---------------------------------------------------------------------------
// 1. L'estimateur tourne dans le navigateur
// ---------------------------------------------------------------------------

/** Résout un import relatif ou en `@/` vers un fichier du dépôt. */
function resoudre(depuis: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join("src", specifier.slice(2))
    : specifier.startsWith(".")
      ? join(dirname(depuis), specifier)
      : null;
  if (base === null) return null;
  for (const candidat of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), base]) {
    if (existsSync(candidat) && statSync(candidat).isFile()) return candidat;
  }
  return null;
}

/** Tous les modules du dépôt qu'un fichier atteint, directement ou non. */
function chaineDImports(entree: string): Set<string> {
  const vus = new Set<string>();
  const aVoir = [entree];
  while (aVoir.length > 0) {
    const fichier = aVoir.pop()!;
    if (vus.has(fichier)) continue;
    vus.add(fichier);
    const source = lire(fichier);
    for (const m of source.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)) {
      const cible = resoudre(fichier, m[1]!);
      if (cible && !vus.has(cible)) aVoir.push(cible);
    }
  }
  return vus;
}

describe("l'estimateur tourne dans le navigateur, pas sur le serveur", () => {
  const chaine = [...chaineDImports("src/engine/estimation/index.ts")];

  it("la chaîne du moteur d'estimation existe et passe par la simulation réelle", () => {
    expect(chaine.length, "chaîne vide : la résolution d'imports est cassée").toBeGreaterThan(5);
    expect(chaine, "l'estimation n'appelle pas le moteur du tour").toContain(
      resolve("src/engine/simulation/index.ts").slice(process.cwd().length + 1),
    );
  });

  it("aucun module de la chaîne n'importe la base, next, drizzle ni un service", () => {
    const interdits = [
      /from ["']next/,
      /from ["']drizzle/,
      /from ["']@\/db/,
      /from ["']@\/services\//,
      /from ["']server-only["']/,
      /from ["']node:/,
    ];
    const fautes: string[] = [];
    for (const fichier of chaine) {
      const source = lire(fichier);
      for (const motif of interdits) {
        if (motif.test(source)) fautes.push(`${fichier} : ${motif}`);
      }
    }
    expect(
      fautes,
      `imports serveur dans la chaîne de l'estimation :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("l'encart est un composant client, et il appelle l'estimateur lui-même", () => {
    expect(ENCART.startsWith('"use client"')).toBe(true);
    expect(ENCART).toContain('from "@/engine/estimation"');
    expect(ENCART).toContain("estimerLeTour(");
    // Aucune action serveur : pas d'aller-retour par touche.
    expect(ENCART).not.toMatch(/use server|fetch\(|Action\(/);
  });

  it("la lecture du formulaire est la même des deux côtés", () => {
    // Le navigateur et l'action serveur lisent la feuille par la MÊME fonction.
    expect(ENCART).toContain('from "@/config/decisions-saisies"');
    expect(lire("src/app/arena/[gameId]/actions.ts")).toContain(
      'from "@/config/decisions-saisies"',
    );
  });

  it("le dossier envoyé au navigateur n'emporte jamais la graine", () => {
    const vue = lire("src/services/game-view.service.ts");
    const debut = vue.indexOf("const dossierDEstimation");
    expect(debut, "le dossier d'estimation a disparu de la vue").toBeGreaterThan(0);
    expect(vue.slice(debut)).toContain("expurgerLeScenario(snapshot)");
    // La graine SERT, côté serveur, à lire le tirage d'avance ; elle ne figure
    // jamais parmi les champs RENDUS. On lit donc l'objet rendu, du premier
    // champ au dernier.
    const rendu = vue.indexOf("      scenario: expurgerLeScenario(snapshot),", debut);
    expect(rendu, "l'objet rendu du dossier a changé de forme").toBeGreaterThan(0);
    const objet = vue.slice(rendu, vue.indexOf("\n  })();", rendu));
    expect(objet, "la graine part au navigateur").not.toMatch(/^\s*seed\s*:/m);
    expect(objet).toContain("deposees:");
    // Et le TYPE du dossier ne porte aucun champ de graine : ce qu'on ne
    // déclare pas ne peut pas être envoyé par distraction.
    const type = vue.slice(
      vue.indexOf("  estimation: {"),
      vue.indexOf("  } | null;", vue.indexOf("  estimation: {")),
    );
    expect(type.length, "le type du dossier a disparu").toBeGreaterThan(50);
    expect(type).not.toMatch(/seed/);
    // La commande du tour est RÉSOLUE côté serveur : le navigateur en reçoit
    // l'offre, jamais de quoi la retirer.
    expect(objet).toContain("orderOfferForRound(snapshot, game.currentRound, game.seed)");
  });
});

// ---------------------------------------------------------------------------
// 2. Une estimation n'est pas un résultat
// ---------------------------------------------------------------------------

describe("une estimation n'est pas un résultat : la charte le dit", () => {
  /** Le code seul : les commentaires racontent la règle, ils ne la violent pas. */
  const codeDe = (source: string) =>
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  it("l'encart n'écrit aucun chiffre en vert, en rouge ni en orange", () => {
    const code = codeDe(ENCART);
    const fautes = code.match(/text-(?:emerald|red|rose|green|amber|orange)-\d{3}/g) ?? [];
    expect(fautes, `une estimation prend la couleur d'un résultat : ${fautes.join(", ")}`).toEqual(
      [],
    );
    // Ni un aplat de ces familles.
    expect(code.match(/bg-(?:emerald|red|rose|green|amber|orange)-\d{2,3}/g) ?? []).toEqual([]);
  });

  it("une trésorerie estimée négative se dit par le texte et une pastille neutre", () => {
    expect(ENCART).toContain("pastille-etat");
    expect(ENCART).toContain("passe sous zéro");
    expect(ENCART).toContain("Vous ne pourrez livrer que");
  });

  it("le libellé est sans ambiguïté, et il vient d'un seul endroit", () => {
    expect(ENCART).toContain('export const TITRE_ESTIME = "Résultat estimé"');
    expect(ENCART).toContain('export const SOUS_TITRE_ESTIME = "selon vos ventes estimées"');
    expect(ENCART).toContain("{TITRE_ESTIME}");
  });

  it("au rituel, le réel garde sa couleur et l'estimation reste à l'encre", () => {
    const i = ECART.indexOf("Vous aviez estimé");
    expect(i, "la ligne du rituel a disparu").toBeGreaterThan(0);
    const bloc = ECART.slice(i, i + 900);
    // L'estimation : l'encre. Le réel : la couleur du résultat.
    expect(bloc).toContain("text-slate-100");
    expect(bloc).toMatch(/text-emerald-300[\s\S]{0,40}text-red-300/);
  });

  it("le mouvement est celui du lot 5B : l'éclat, pas un compteur qui défile", () => {
    expect(ENCART).toContain("ValeurRafraichie");
    expect(ENCART).not.toContain("ChiffreQuiArrive");
    // L'anti-rebond prend sa durée au jeton, jamais à une constante.
    expect(ENCART).toContain('dureeDuJeton("--duree-saisie")');
    expect(ENCART).not.toMatch(/setTimeout\([^,]+,\s*\d+\s*\)/);
    // Une seule annonce, courte et polie.
    expect((ENCART.match(/aria-live="polite"/g) ?? []).length).toBe(1);
    expect(ENCART).not.toContain('aria-live="assertive"');
  });
});

// ---------------------------------------------------------------------------
// 3. Aucune ligne du compte ne manque à la cascade
// ---------------------------------------------------------------------------

describe("la cascade du compte estimé est celle du compte réel", () => {
  /** Un compte de résultat dont CHAQUE poste est servi, y compris les optionnels. */
  const compteComplet: IncomeStatement = {
    revenue: 100,
    productionStocked: 10,
    cogs: 40,
    variableProductionCost: 45,
    commissionCost: 3,
    grossMargin: 57,
    marketingCost: 5,
    qualityCost: 4,
    maintenanceCost: 3,
    engagementRse: 2,
    rdCost: 6,
    fixedCosts: 20,
    ebitda: 17,
    depreciation: 7,
    operatingIncome: 10,
    interest: 2,
    financialIncome: 1,
    exceptionalCharge: 3,
    exceptionalIncome: 4,
    rescueSubsidy: 5,
    pretaxIncome: 15,
    taxLossUsed: 2,
    tax: 3,
    netIncome: 12,
  };

  it("chaque poste du compte est soit dans la cascade, soit nommé hors d'elle", () => {
    const dansLaCascade = new Set(lignesDuCompte(compteComplet).map((l) => l.cle));
    const oublies = (Object.keys(compteComplet) as (keyof IncomeStatement)[]).filter(
      (cle) => !dansLaCascade.has(cle) && !POSTES_HORS_CASCADE.includes(cle),
    );
    expect(
      oublies,
      `postes du compte absents de la cascade estimée : ${oublies.join(", ")}`,
    ).toEqual([]);
  });

  it("les charges s'y lisent en négatif, et les soldes portent leur filet", () => {
    const lignes = lignesDuCompte(compteComplet);
    const par = (cle: string) => lignes.find((l) => l.cle === cle)!;
    expect(par("cogs").valeur).toBe(-40);
    expect(par("tax").valeur).toBe(-3);
    // Un impôt nul s'écrit « 0 € », jamais « −0 € ».
    const sansImpot = lignesDuCompte({ ...compteComplet, tax: 0 });
    expect(Object.is(sansImpot.find((l) => l.cle === "tax")!.valeur, -0)).toBe(false);
    expect(par("revenue").valeur).toBe(100);
    for (const solde of ["grossMargin", "ebitda", "operatingIncome", "pretaxIncome", "netIncome"]) {
      expect(par(solde).fort, `${solde} n'est pas un solde`).toBe(true);
    }
  });

  it("une ligne que le tour n'a pas servie ne s'écrit pas", () => {
    const sobre: IncomeStatement = {
      ...compteComplet,
      commissionCost: 0,
      engagementRse: 0,
      rdCost: 0,
      financialIncome: 0,
      exceptionalCharge: 0,
      exceptionalIncome: 0,
      rescueSubsidy: 0,
      taxLossUsed: 0,
      productionStocked: 0,
    };
    const cles = lignesDuCompte(sobre).map((l) => l.cle);
    for (const absente of [
      "commissionCost",
      "engagementRse",
      "rdCost",
      "financialIncome",
      "exceptionalCharge",
      "exceptionalIncome",
      "rescueSubsidy",
      "taxLossUsed",
      "productionStocked",
    ]) {
      expect(cles, `${absente} s'écrit alors qu'elle est nulle`).not.toContain(absente);
    }
    // Et la cascade reste lisible : les soldes et les charges servies restent.
    expect(cles).toContain("netIncome");
    expect(cles).toContain("fixedCosts");
  });
});
