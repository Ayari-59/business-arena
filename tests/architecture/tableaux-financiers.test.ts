import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FinancialStatements } from "@/components/financial-statements";
import { simulateRound } from "@/engine/simulation";
import { novaScenario, novaCompany } from "@/config/scenarios/nova";
import { NOVA_DEFINITION } from "@/config/scenarios/registry";
import { botDecisions } from "@/engine/bots";
import type { CompanyRoundResult, RoundDecisions } from "@/engine/types";

/**
 * DES TABLEAUX FINANCIERS DE PRESSE ÉCONOMIQUE.
 *
 * Les états de l'élève étaient des suites de `<div>` : aucun en-tête de
 * colonne, aucun rapport entre les lignes, des chiffres de 12 px, et — pour
 * dire si c'était bon — des jauges vertes, orange et rouges et des pastilles
 * « tenu / manqué ». C'est le CHIFFRE ET SON ÉCART qui le disent, et c'est tout
 * ce que la colonne d'écart apporte : un niveau ne se juge pas seul.
 *
 * Ce que cette garde tient, et qu'un rendu seul ne montrerait pas :
 *   · de vrais tableaux, avec en-têtes de colonne et de ligne (lecteurs d'écran) ;
 *   · la colonne d'écart VIDE au premier tour, jamais « 0 » ;
 *   · plus une jauge, plus une barre colorée dans les comptes ;
 *   · sur téléphone, le tableau défile dans SON conteneur, pas la page.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const CSS = readFileSync(join(SRC, "app", "globals.css"), "utf8");
const ETATS = lire("components/financial-statements.tsx");
const RATIOS = lire("components/ratio-gauges.tsx");

/**
 * LES COMPTES : les quatre écrans où le chiffre doit se suffire. Le tableau de
 * bord n'y est pas — son indice RSE garde ses trois barres en bleu donnée, qui
 * comparent trois mesures d'une même grandeur et ne jugent rien.
 */
const COMPTES = [
  "components/financial-statements.tsx",
  "components/ratio-gauges.tsx",
  "components/sales-history.tsx",
  "components/tableau-des-references.tsx",
];
/** Tous les tableaux de chiffres que l'élève lit sur ses résultats. */
const TABLEAUX = [...COMPTES, "components/period-dashboard.tsx"];

/** Un tour de NOVA, et le tour suivant : de quoi avoir un écart réel. */
function deuxTours(): { premier: CompanyRoundResult; second: CompanyRoundResult } {
  const decisions: RoundDecisions = {
    price: 59,
    productionPlan: 5000,
    marketingBudget: 5000,
    qualityBudget: 3000,
    maintenanceBudget: 4000,
  } as RoundDecisions;
  let entreprises = [
    novaCompany("player", "NOVA One", "human"),
    novaCompany("bot", "SoundBox", "bot", "price_aggressive"),
  ];
  const resultats: CompanyRoundResult[] = [];
  for (const roundIndex of [1, 2]) {
    const out = simulateRound({
      scenario: novaScenario,
      roundIndex,
      companies: entreprises,
      decisions: {
        player: { ...decisions, price: roundIndex === 1 ? 59 : 64 },
        bot: botDecisions("price_aggressive", {
          scenario: novaScenario,
          state: entreprises[1]!,
          roundIndex,
        }),
      },
      activeEvents: [],
      seed: 7,
    });
    resultats.push(out.results.player!);
    entreprises = out.companies;
  }
  return { premier: resultats[0]!, second: resultats[1]! };
}

const { premier, second } = deuxTours();

const rendu = (result: CompanyRoundResult, precedent: CompanyRoundResult | null) =>
  renderToStaticMarkup(
    createElement(FinancialStatements, {
      result,
      precedent,
      periode: "Trimestre 2",
      price: 64,
      otherVariableCostPerUnit: 4,
      vocabulary: NOVA_DEFINITION.vocabulary,
    }),
  ).replace(/[  ]/g, " ");

describe("les états sont de vrais tableaux", () => {
  const html = rendu(second, premier);

  it("chaque état a ses en-têtes de colonne et de ligne", () => {
    // Quatre tableaux dans le compte de résultat, le bilan (actif, passif),
    // l'analyse des coûts et la trésorerie.
    expect((html.match(/<table/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
    // Et une légende pour qui ne voit pas le tableau.
    expect(html).toContain("<caption");
  });

  it("les chiffres sont tabulaires, alignés à droite, en 14 px", () => {
    expect(html).toContain("tabular-nums");
    expect(html).toContain("text-right");
    // `text-sm` = 14 px sur la table : plus de 12 px pour une colonne de comptes.
    expect(html).toMatch(/<table class="[^"]*text-sm/);
  });

  it("les totaux et les soldes intermédiaires sont en gras, sur un filet", () => {
    // La cascade est conservée : marge sur coût variable, EBE, résultat
    // d'exploitation, résultat net, chacun au-dessous des charges qu'il absorbe.
    for (const solde of [
      "= Marge sur coût variable",
      "= Excédent brut d&#x27;exploitation (EBE)",
      "= Résultat d&#x27;exploitation",
      "= RÉSULTAT NET",
    ]) {
      const i = html.indexOf(solde);
      expect(i, `${solde} absent`).toBeGreaterThan(-1);
      // La ligne porte son filet et son gras : on remonte à son <tr>.
      const tr = html.lastIndexOf("<tr", i);
      expect(html.slice(tr, i), solde).toContain("border-t");
      expect(html.slice(tr, i + 400), solde).toContain("font-semibold");
    }
  });
});

describe("la colonne d'écart", () => {
  it("au deuxième tour, elle est signée et porte le vert ou le rouge", () => {
    const html = rendu(second, premier);
    expect(html).toContain("Écart");
    // Un écart signé, avec un vrai moins (U+2212) et non un trait d'union.
    expect(html).toMatch(/(?:\+|−)[\d  ]+ €/);
    expect(html).toMatch(/text-(?:emerald-300|red-400)/);
    // Et le pourcentage quand il a du sens.
    expect(html).toMatch(/(?:\+|−)\d+,\d %/);
  });

  it("au premier tour, elle reste VIDE : jamais « 0 »", () => {
    const html = rendu(premier, null);
    // La colonne existe (on dit qu'il n'y a pas de référence, on ne la cache pas)…
    expect(html).toContain("Écart");
    // … et aucune cellule n'y annonce un écart nul, qui dirait « rien n'a bougé ».
    // Les seules cellules en cause sont celles de l'écart : une VALEUR à zéro
    // (un poste de trésorerie sans mouvement) est un fait, pas une invention.
    const cellules = [...html.matchAll(/<td data-ecart="true"[^>]*>([^<]*)<\/td>/g)].map(
      (m) => m[1]!,
    );
    expect(cellules.length, "les cellules d'écart sont marquées").toBeGreaterThan(20);
    for (const c of cellules) {
      expect(c, `écart inventé : « ${c} »`).not.toMatch(/^[+−]?0 €$/);
      expect(c).not.toMatch(/^[+−]?0,0 %$/);
    }
    // Il reste donc des cellules vides, et c'est le bon dire.
    expect(cellules.filter((c) => c === "").length).toBeGreaterThan(10);
  });

  it("le calcul vit dans lecture-des-comptes, pas dans le composant", () => {
    expect(ETATS).toContain("ecartAuTourPrecedent");
    expect(ETATS).not.toMatch(/valeur - avant/);
  });
});

describe("plus de jauge, de barre colorée ni de pastille dans les comptes", () => {
  it("aucun tableau de chiffres ne dessine de barre de progression", () => {
    const fautes: string[] = [];
    for (const chemin of COMPTES) {
      const code = lire(chemin)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      // Une barre, c'est une largeur calculée posée sur un fond de couleur.
      for (const m of code.matchAll(/style=\{\{\s*width:\s*`\$\{/g)) {
        fautes.push(`${chemin} : ${m[0]}`);
      }
      for (const m of code.matchAll(/bg-(?:emerald|red|rose|amber|green)-\d{3}\b/g)) {
        fautes.push(`${chemin} : ${m[0]}`);
      }
    }
    expect(
      fautes,
      `une jauge décide à la place du lecteur ; le chiffre et son écart suffisent :\n${fautes.join("\n")}`,
    ).toEqual([]);
  });

  it("les ratios sont un tableau, avec un repère chiffré plutôt qu'un verdict coloré", () => {
    expect(RATIOS).toContain("<table");
    expect(RATIOS).not.toContain("GaugeBar");
    expect(RATIOS).not.toContain("thresholds");
    expect(RATIOS).toMatch(/repere: "/);
  });
});

describe("sur téléphone, un tableau défile dans son conteneur", () => {
  it("la page ne défile jamais latéralement : le conteneur s'en charge", () => {
    const bloc = CSS.slice(CSS.indexOf(".tableau-financier {"));
    expect(bloc.slice(0, bloc.indexOf("}"))).toContain("overflow-x: auto");
    // Et le geste ne se propage pas à la page.
    expect(bloc).toContain("overscroll-behavior-x: contain");
  });

  it("l'intitulé reste lisible pendant qu'on fait glisser les colonnes", () => {
    expect(CSS).toMatch(/\.tableau-financier :is\(th, td\):first-child \{[^}]*position: sticky/);
    // Le fond de la colonne gelée suit celui de son conteneur, sinon elle
    // laisse une bande d'une autre teinte sur la carte d'un tour passé.
    expect(CSS).toContain("--fond-du-tableau");
    expect(CSS).toContain("[data-tour-passe] {");
  });

  it("chaque tableau de chiffres est dans ce conteneur, et aucun autre", () => {
    for (const chemin of TABLEAUX) {
      const source = lire(chemin);
      if (!source.includes("<table")) continue;
      expect(source, `${chemin} : un tableau hors du conteneur qui défile`).toContain(
        "tableau-financier",
      );
      // L'ancien `overflow-x-auto` posé au cas par cas laissait la première
      // colonne partir avec les autres.
      expect(source, `${chemin} : défilement posé à la main`).not.toContain("overflow-x-auto");
    }
  });
});
