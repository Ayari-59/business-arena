import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import {
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "../../src/config/scenarios/periodicity";
import { situationDeLaPartie, textesDe } from "../../src/config/scenarios/situation-texte";
import type { EngineScenarioConfig } from "../../src/engine/types";
import { corrigerLesDates } from "./corrections-des-dates";

/**
 * MARTEL & FILS, MAILLE & CO ET PIXEL & CO : CHAQUE SITUATION SE REND À LA
 * DURÉE DU TOUR DE SA PARTIE.
 *
 * Au mois, MARTEL & FILS décaisse 56 000 € de structure et son parc traite
 * 500 m² ; ses énoncés disaient « 168 000 € par trimestre » et « 1 500 m² »
 * quelle que soit la partie. Même faute pour les 84 000 € et les 7 500 pièces
 * de MAILLE & CO, les 7 000 commandes de PIXEL & CO. Cette garde rend chaque
 * situation des cinq scénarios au mois, au trimestre et à l'année, et vérifie :
 *  · que chaque montant et chaque volume cité est l'un de ceux que le test
 *    recalcule du scénario JOUÉ à cette durée (monde figé), ou un invariant
 *    vérifié ici par le calcul ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran ;
 *  · qu'au trimestre, le texte est octet pour octet celui relevé sur 1c6bc002
 *    (tests/fixtures/situations-batiment-boutique-ecommerce-au-trimestre.json),
 *    aux deux corrections près que nomme `CORRECTIONS`, et à celles des dates
 *    fausses au trimestre même (`corrections-des-dates.ts`, décision du
 *    propriétaire : « février » au tour 2 de MARTEL & FILS, les situations
 *    détectées de MAILLE & CO et de PIXEL & CO).
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const GROUPE = ["batiment", "boutique", "boutique-mono", "ecommerce", "ecommerce-gamme"] as const;
type Code = (typeof GROUPE)[number];

const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-batiment-boutique-ecommerce-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<Code, Record<string, string[]>>;

/**
 * LES ERREURS QUE LE TEXTE PORTAIT DÉJÀ AU TRIMESTRE, corrigées ici et nulle part
 * ailleurs. MARTEL & FILS est passé de 138 000 à 168 000 € de structure
 * (b06e42d1) : le seuil cité devenait 168 000 ÷ 170 ≈ 990 m², soit 66 % des
 * 1 500 m² du parc. Le commit a corrigé l'énoncé, la correction et l'indice 4,
 * mais oublié l'indice 5 (« 54 % de capacité », soit 810 ÷ 1 500) et le levier
 * de production (« dépasser les 810 m² », soit 138 000 ÷ 170).
 */
const CORRECTIONS: Partial<Record<Code, Record<string, Record<number, [string, string]>>>> = {
  batiment: {
    batiment_t1_marge: {
      41: ["54 % de capacité", "66 % de capacité"],
      42: ["dépasser les 810 m²", "dépasser les 990 m²"],
    },
  },
};

const definition = (code: Code) => scenarioByCode(code);

/** L'instantané qu'une partie fige à cette durée, monde figé. */
const joue = (code: Code, periodicity: Periodicity): EngineScenarioConfig =>
  composerLeScenarioJoue({ scenario: definition(code).scenario, seed: 7, concurrents: 6, periodicity });

/** La capacité de l'entreprise de départ à cette durée, par l'autre chemin du moteur. */
const capaciteDeDepart = (code: Code, periodicity: Periodicity) =>
  applyPeriodicityToCompany(definition(code).company("t", "T", "human"), periodicity).machineCapacity;

const net = (x: number) => Number(x.toFixed(9));
const milliers = (n: number) => String(Math.round(net(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const dizaine = (x: number) => Math.round(net(x) / 10) * 10;

/**
 * Les montants et volumes qu'un énoncé peut citer à cette durée, recalculés ici
 * de l'instantané, sans passer par le module des jetons. Chaque entrée porte son
 * unité : « 56 000 € », « 500 m² ».
 */
function attendus(code: Code, periodicity: Periodicity): Set<string> {
  const s = joue(code, periodicity);
  const k = s.roundDays / 90;
  const charges = s.fixedCostsPerRound;
  const capacite = capaciteDeDepart(code, periodicity);
  const avec = (unite: string, ...xs: number[]) => xs.map((x) => `${milliers(x)} ${unite}`);
  switch (code) {
    case "batiment":
      return new Set([
        ...avec("€", charges, 2 * s.hr!.salaryPerEmployeePerRound, 11000 * k, 1800 * k),
        ...avec("m²", charges / 170, dizaine(charges / 170), capacite, 360 * k, 1200 * k),
      ]);
    case "boutique":
      return new Set([
        ...avec("€", charges),
        ...avec("pulls", charges / 30.5, charges / 26, dizaine(charges / 26)),
        ...avec("pièces", charges / 29.35, capacite),
      ]);
    case "boutique-mono":
      return new Set([
        ...avec("€", charges),
        ...avec("articles", Math.ceil(net(charges / 23.5)), charges / 20.26, dizaine(charges / 20.26), capacite),
      ]);
    case "ecommerce":
    case "ecommerce-gamme": {
      const stock = 9000 * k;
      return new Set(avec("commandes", capacite, stock, stock + capacite, (stock + capacite) / 2, stock - capacite));
    }
  }
}

/**
 * Ce que la durée ne change pas : prix, coûts et marges à l'unité, stocks,
 * ponctuels, hypothèses chiffrées du récit qui ne disent pas de durée. Le test
 * « les invariants » les recalcule de la configuration ou de leur arithmétique.
 */
const INVARIANTS: Record<Code, string[]> = {
  batiment: [
    "127 €", "162 €", "168 €", "170 €", "210 €", "212 €", "245 €", "268 €", "325 €", "372 €", "380 €",
    "42 €", "58 €", "6 400 €", "96 000 €",
  ],
  boutique: [
    "10 000 pièces", "10 000 €", "10 €", "11 600 €", "14 €", "17 980 €", "19 €", "23 600 €", "25 €", "25,00 €",
    "26 €", "29 €", "29,35 €", "29,50 €", "290 clients", "3,50 €", "30 €", "30,50 €", "34,00 €", "4,50 €",
    "400 pulls", "41 €", "5 800 visiteurs", "59 €", "59,00 €", "60 €", "62 €", "68 €", "70 €",
  ],
  "boutique-mono": [
    "1 200 articles", "10 000 articles", "17 980 €", "18 000 €", "18 €", "18,00 €", "2 000 articles", "20,26 €",
    "21,24 €", "22 €", "23 €", "23,50 €", "27,00 €", "290 clients", "3,24 €", "3,50 €", "36 000 €", "400 pièces",
    "45 €", "45,00 €", "5 800 visiteurs", "50 €", "53,10 €", "62 €", "7 200 €", "9 200 €", "90 m²",
  ],
  ecommerce: [
    "0,067 €", "1 500 commandes", "100 commandes", "11 €", "15 €", "16 €", "2 000 commandes", "2 000 références",
    "21,84 €", "26,40 €", "30 000 €", "30 €", "34 €", "38 €", "4 €", "40 €", "53 €", "60 000 €", "62 €", "68 €",
    "78 €", "8,16 €", "9 €",
  ],
  "ecommerce-gamme": [
    "0,067 €", "1 500 commandes", "100 commandes", "11 €", "125 €", "13,48 €", "15 €", "16 €", "18,75 €", "19 €",
    "2 000 commandes", "2 080 références", "20 000 €", "21,84 €", "26,40 €", "29,25 €", "30 000 €", "30 €", "34 €",
    "36 €", "38 €", "4 €", "40 €", "46 €", "48 €", "5,52 €", "53 €", "60 000 €", "62 €", "68 €", "78 €", "8,16 €",
    "9 €",
  ],
};

/** Tous les montants et volumes d'un texte, avec leur unité. */
const cites = (t: string) =>
  [
    ...t.matchAll(
      /(?<![\d,])(\d{1,3}(?: \d{3})*(?:,\d+)?) (€|m²|pièces|articles|pulls|commandes|visiteurs|clients|références)/g,
    ),
  ].map((m) => `${m[1]} ${m[2]}`);

for (const code of GROUPE) {
  const d = definition(code);

  describe(`${code} : chaque situation se rend à la durée du tour de sa partie`, () => {
    for (const periodicity of DUREES) {
      const permis = new Set([...attendus(code, periodicity), ...INVARIANTS[code]]);

      describe(NOM[periodicity], () => {
        for (const def of d.situations) {
          const textes = textesDe(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]));

          it(`${def.code} : chaque montant et chaque volume cité est celui du scénario joué`, () => {
            for (const t of textes) {
              for (const m of cites(t)) expect(permis.has(m), `« ${m} » dans « ${t} »`).toBe(true);
            }
          });

          it(`${def.code} : aucun jeton n'atteint l'écran${periodicity === "quarter" ? "" : ", aucun trimestre ne reste"}`, () => {
            for (const t of textes) {
              expect(t, t).not.toMatch(/\{\{|\}\}/);
              if (periodicity !== "quarter") expect(t, t).not.toMatch(/trimestr/i);
            }
          });
        }
      });
    }

    it("au trimestre, le texte est octet pour octet celui du relevé, aux corrections nommées près", () => {
      expect(Object.keys(AVANT[code]).sort()).toEqual(d.situations.map((x) => x.code).sort());
      for (const def of d.situations) {
        const corrections = CORRECTIONS[code]?.[def.code] ?? {};
        const attendu = AVANT[code][def.code]!.map((t, i) => {
          const c = corrections[i];
          if (!c) return t;
          expect(t, `${def.code}[${i}] porte l'erreur relevée`).toContain(c[0]);
          return t.replace(c[0], c[1]);
        });
        const corrige = corrigerLesDates(def.code, attendu);
        expect(textesDe(situationDeLaPartie(def, 90)), def.code).toEqual(corrige);
        // Le registre porte le texte au trimestre : c'est lui que lisent le
        // catalogue, l'éditeur et le référentiel semé.
        expect(textesDe(def), def.code).toEqual(corrige);
      }
    });
  });
}

describe("les corrections au trimestre disent ce que la configuration fait", () => {
  it("MARTEL & FILS : le seuil est de 990 m², les deux tiers du parc, et non 810 m²", () => {
    const s = joue("batiment", "quarter");
    const capacite = capaciteDeDepart("batiment", "quarter");
    expect(s.fixedCostsPerRound).toBe(168000);
    expect(380 - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit).toBe(170);
    expect(dizaine(s.fixedCostsPerRound / 170)).toBe(990);
    expect(Math.round((s.fixedCostsPerRound / 170 / capacite) * 100)).toBe(66);
    // Les deux chiffres faux sont ceux de l'ancienne structure (138 000 €).
    expect(dizaine(138000 / 170)).toBe(810);
    expect(Math.round((810 / capacite) * 100)).toBe(54);
  });
});

describe("au mois et à l'année, les énoncés disent ce que le moteur fait", () => {
  const situation = (code: Code, situationCode: string, periodicity: Periodicity) =>
    situationDeLaPartie(
      definition(code).situations.find((x) => x.code === situationCode)!,
      PERIODICITY_DAYS[periodicity],
    );

  it("MARTEL & FILS au mois : 56 000 € de structure, 500 m² de parc, un seuil vers 330 m²", () => {
    const s = joue("batiment", "month");
    expect(s.fixedCostsPerRound).toBe(56000);
    expect(capaciteDeDepart("batiment", "month")).toBe(500);
    const t1 = situation("batiment", "batiment_t1_marge", "month");
    expect(t1.quiz[1]!.prompt).toContain("56 000 € de charges de structure décaissées par mois");
    expect(t1.hints[3]!.text).toBe("Seuil = 56 000 ÷ 170 ≈ 330 m². Comparez-le à votre capacité de 500 m².");
    expect(t1.hints[4]!.text).toContain("66 % de capacité");
  });

  it("MARTEL & FILS : le débord, la location et l'entretien du récit suivent la durée du tour", () => {
    const mois = situation("batiment", "batiment_t5_sous_traiter", "month");
    const an = situation("batiment", "batiment_t5_sous_traiter", "year");
    expect(mois.narrative).toContain("déborde de deux cents mètres carrés");
    expect(mois.narrative).toContain(`${milliers(2 * joue("batiment", "month").hr!.salaryPerEmployeePerRound)} € par mois`);
    expect(an.narrative).toContain("déborde de deux mille quatre cents mètres carrés");
    expect(an.decisionLevers[0]!.hint).toMatch(/^Deux mille quatre cents mètres carrés/);
    const nacelle = situation("batiment", "batiment_t6_nacelle", "month");
    expect(nacelle.narrative).toContain("vingt jours par mois, pour 3 667 € à chaque fois");
    expect(nacelle.narrative).toContain("600 € d'entretien par mois");
    expect(nacelle.hints[4]!.text).toContain("que dix jours par mois");
  });

  it("MAILLE & CO au mois : 28 000 € de structure, 2 500 pièces, des seuils au tiers", () => {
    expect(joue("boutique", "month").fixedCostsPerRound).toBe(28000);
    expect(capaciteDeDepart("boutique", "month")).toBe(2500);
    const t1 = situation("boutique", "boutique_t1_reprise", "month");
    expect(t1.hints[4]!.text).toContain("28 000 ÷ 30,50 ≈ 918 pulls par mois");
    const mono = situation("boutique-mono", "bmono_t1_reprise", "month");
    // Un seuil s'atteint à l'article entier suivant : 28 000 ÷ 23,50 = 1 191,5.
    expect(mono.hints[4]!.text).toContain("28 000 ÷ 23,50 ≈ 1 192 articles par mois");
  });

  it("PIXEL & CO et sa gamme au mois : l'entrepôt prépare 2 333 commandes, chacun lit son propre scénario", () => {
    for (const [code, situationCode] of [
      ["ecommerce", "ecom_t4_pic"],
      ["ecommerce-gamme", "ecomg_t4_pic"],
    ] as const) {
      expect(capaciteDeDepart(code, "month")).toBeCloseTo(7000 / 3, 6);
      const pic = situation(code, situationCode, "month");
      expect(pic.narrative, code).toContain("2 333 commandes par mois");
      // La gamme hérite des SOURCES : la situation de sa partie au mois n'est pas
      // celle du registre.
      expect(pic, code).not.toBe(definition(code).situations.find((x) => x.code === situationCode));
    }
    const pic = situation("ecommerce", "ecom_t4_pic", "month");
    expect(pic.quiz[0]!.prompt).toBe(
      "Vous achetez pour 3 000 commandes de stock mais l'entrepôt n'en prépare que 2 333. Combien vendrez-vous au mieux ?",
    );
    expect(pic.quiz[0]!.explain).toContain("Les 667 commandes de stock excédentaire");
  });
});

describe("les invariants : ce que l'énoncé écrit en clair vaut à toutes les durées", () => {
  for (const periodicity of DUREES) {
    it(NOM[periodicity], () => {
      // MARTEL & FILS : coûts au mètre carré, marges, recrutement ponctuel, taux annuels.
      const b = joue("batiment", periodicity);
      const variable = b.product.materialCostPerUnit + b.product.otherVariableCostPerUnit;
      expect([b.product.materialCostPerUnit, b.product.otherVariableCostPerUnit, variable]).toEqual([168, 42, 210]);
      expect([380 - variable, 380 - 168, 372 - variable, 372 - 245, 268 - variable]).toEqual([170, 212, 162, 127, 58]);
      expect(2 * b.hr!.hiringCost).toBe(6400);
      expect(b.finance.overdraftAnnualRate).toBe(0.14);
      expect(b.treasury!.placementAnnualRate).toBe(0.02);
      // Le seuil en part de la capacité : charges et parc suivent le même facteur.
      expect(Math.round((b.fixedCostsPerRound / 170 / capaciteDeDepart("batiment", periodicity)) * 100)).toBe(66);

      // MAILLE & CO : la marge du pull col rond, la hausse de 18 %, les comptes de Noël et des soldes.
      const g = joue("boutique", periodicity);
      const pull = g.products!.find((p) => p.code === "pull-col-rond")!;
      expect([pull.materialCostPerUnit, pull.otherVariableCostPerUnit]).toEqual([25, 3.5]);
      expect(59 - 25 - 3.5).toBe(30.5);
      expect(net(25 * 1.18)).toBe(29.5);
      expect(net(59 - 29.5 - 3.5)).toBe(26);
      expect(g.finance.overdraftAnnualRate).toBe(0.13);
      expect(g.treasury!.placementAnnualRate).toBe(0.02);
      expect(5800 * 0.05).toBe(290);
      expect(290 * 62).toBe(17980);
      expect([400 * 29, 400 * 25, 400 * 59]).toEqual([11600, 10000, 23600]);

      // MAILLE & CO en un article.
      const m = joue("boutique-mono", periodicity);
      expect([m.product.materialCostPerUnit, m.product.otherVariableCostPerUnit]).toEqual([18, 3.5]);
      expect(45 - 18 - 3.5).toBe(23.5);
      expect(net(18 * 1.18)).toBe(21.24);
      expect(net(45 - 21.24 - 3.5)).toBe(20.26);
      expect(m.market.seasonality[3]).toBe(1.45);
      expect([2000 * 18, 400 * 23, 400 * 18, 400 * 45]).toEqual([36000, 9200, 7200, 18000]);

      // PIXEL & CO : la commande, le coût d'acquisition, la commission, le pic.
      const e = joue("ecommerce", periodicity);
      expect(e.product.materialCostPerUnit + e.product.otherVariableCostPerUnit).toBe(38);
      expect([68 - 38, 30000 / 2000, 68 - 38 - 15, net(68 * 0.12), net(68 - 38 - 8.16)]).toEqual([30, 15, 15, 8.16, 21.84]);
      expect(e.market.seasonality[3]).toBe(1.6);
      expect(e.finance.overdraftAnnualRate).toBe(0.14);
      // Le stock acheté pour le pic dépasse l'entrepôt d'autant à toutes les durées.
      const k = e.roundDays / 90;
      expect(net((9000 * k) / capaciteDeDepart("ecommerce", periodicity))).toBe(net(9 / 7));
    });
  }
});
