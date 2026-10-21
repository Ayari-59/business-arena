import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import { composerLeScenarioJoue } from "../../src/config/scenarios/scenario-joue";
import {
  applyPeriodicityToCompany,
  PERIODICITY_DAYS,
  type Periodicity,
} from "../../src/config/scenarios/periodicity";
import {
  rendreTexte,
  situationDeLaPartie,
  textesDe,
} from "../../src/config/scenarios/situation-texte";
import { dossierEnseignant } from "../../src/config/ateliers/dossiers";
import { ATELIERS } from "../../src/config/ateliers";
import type { EngineScenarioConfig } from "../../src/engine/types";

/**
 * LE TEXTE D'UNE SITUATION SUIT LA DURÉE DU TOUR DE SA PARTIE.
 *
 * VOLT FITNESS vend un tour d'abonnement : au mois, le moteur facture 35 € et
 * garde 30 € de marge ; à l'année, 420 € et 360 €. Ses énoncés disaient « 105 €
 * par trimestre » quelle que soit la partie. Cette garde rend chaque situation
 * au mois, au trimestre et à l'année, et vérifie :
 *  · que chaque montant cité est l'un de ceux du scénario JOUÉ à cette durée
 *    (l'instantané que la partie fige, monde figé), ou une grandeur que la
 *    durée ne change pas, vérifiée ici par le calcul ;
 *  · qu'aucun « trimestre » ne reste au mois ni à l'année, et qu'aucun jeton
 *    n'atteint l'écran ;
 *  · qu'au trimestre, le texte est octet pour octet celui d'avant les jetons
 *    (tests/fixtures/situations-fitness-au-trimestre.json, relevé sur 5357b884).
 */

const DUREES: Periodicity[] = ["month", "quarter", "year"];
const NOM: Record<Periodicity, string> = { month: "au mois", quarter: "au trimestre", year: "à l'année" };
const fitness = scenarioByCode("fitness");
const AVANT = JSON.parse(
  readFileSync(new URL("../fixtures/situations-fitness-au-trimestre.json", import.meta.url), "utf-8"),
) as Record<string, string[]>;

/** L'instantané qu'une partie de VOLT FITNESS fige à cette durée, monde figé. */
const joue = (periodicity: Periodicity): EngineScenarioConfig =>
  composerLeScenarioJoue({ scenario: fitness.scenario, seed: 7, concurrents: 6, periodicity });

const milliers = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const auMillieme = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Les montants qu'un énoncé peut citer à cette durée, calculés ici de
 * l'instantané, sans passer par le module des jetons.
 */
function montantsAttendus(s: EngineScenarioConfig): Set<string> {
  const sub = s.subscription!;
  const prix = sub.refPrice;
  const variable = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
  const marge = prix - variable;
  const k = s.roundDays / 90;
  // L'attrition au dixième de point, comme le texte la montre.
  const attrition = auMillieme(sub.baseChurnRate);
  const perte = (q: number) => auMillieme(1 - Math.pow(1 - q, k));
  const vie = (c: number) => Math.round(Number((marge / c).toFixed(9)));
  return new Set([
    milliers(prix),
    milliers(variable),
    milliers(marge),
    milliers(s.fixedCostsPerRound),
    milliers(vie(attrition)),
    milliers(vie(perte(0.1))),
    milliers(vie(perte(0.16))),
    milliers(vie(perte(0.1)) - vie(attrition)),
    milliers(marge * 300),
    milliers(marge * 300 * marge),
    milliers(marge * attrition * 100),
    (marge * attrition).toFixed(2).replace(".", ","),
  ]);
}

/**
 * Ce que la durée ne change pas, vérifié par le calcul à chaque durée dans le
 * test « les invariants » ci-dessous : l'abonnement annuel et sa remise,
 * l'aménagement de la seconde salle et ses deux issues actualisées.
 */
const INVARIANTS = new Set(["420", "340", "80", "220 000", "90 000"]);

/** Tous les montants en euros d'un texte : « 35 € », « 105 000 € », « 1,59 € ». */
const euros = (t: string) => [...t.matchAll(/(\d{1,3}(?: \d{3})*(?:,\d+)?) €/g)].map((m) => m[1]!);

describe("VOLT FITNESS : chaque situation se rend à la durée du tour de sa partie", () => {
  for (const periodicity of DUREES) {
    const s = joue(periodicity);
    const attendus = montantsAttendus(s);

    describe(NOM[periodicity], () => {
      for (const def of fitness.situations) {
        const rendue = situationDeLaPartie(def, PERIODICITY_DAYS[periodicity]);
        const textes = textesDe(rendue);

        it(`${def.code} : chaque montant cité est celui du scénario joué`, () => {
          for (const t of textes) {
            for (const m of euros(t)) {
              expect(attendus.has(m) || INVARIANTS.has(m), `« ${m} € » dans « ${t} »`).toBe(true);
            }
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

  it("au trimestre, le texte est octet pour octet celui d'avant les jetons", () => {
    expect(Object.keys(AVANT).sort()).toEqual(fitness.situations.map((d) => d.code).sort());
    for (const def of fitness.situations) {
      expect(textesDe(situationDeLaPartie(def, 90)), def.code).toEqual(AVANT[def.code]);
      // Le registre porte le texte au trimestre : c'est lui que lisent le
      // catalogue, l'éditeur et le référentiel semé.
      expect(textesDe(def), def.code).toEqual(AVANT[def.code]);
    }
  });

  it("au mois, l'énoncé d'ouverture dit ce que le moteur facture", () => {
    const s = joue("month");
    const t1 = situationDeLaPartie(fitness.situations.find((d) => d.code === "fitness_t1_recurrent")!, 30);
    const prix = s.subscription!.refPrice;
    const marge = prix - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit;
    expect(prix).toBe(35);
    expect(marge).toBe(30);
    expect(t1.narrative).toContain(`1 600 adhérents qui paient ${prix} € par mois`);
    expect(t1.hints[2]!.text).toContain(`= ${marge} € par mois`);
    expect(t1.quiz[1]!.prompt).toContain(`${milliers(s.fixedCostsPerRound)} € de charges de structure`);
  });

  it("au mois, la valeur vie se calcule avec l'attrition que le moteur applique", () => {
    const s = joue("month");
    const t2 = situationDeLaPartie(fitness.situations.find((d) => d.code === "fitness_t2_attrition")!, 30);
    const taux = auMillieme(s.subscription!.baseChurnRate);
    expect(taux).toBe(0.053);
    expect(t2.quiz[0]!.prompt).toContain("le taux d'attrition mensuel est de 5,3 %");
    expect(t2.quiz[0]!.explain).toContain(`30 ÷ 0,053 = ${Math.round(30 / taux)} €`);
  });

  it("les invariants : ce que l'énoncé écrit en clair vaut à toutes les durées", () => {
    for (const periodicity of DUREES) {
      const s = joue(periodicity);
      const prix = s.subscription!.refPrice;
      const marge = prix - s.product.materialCostPerUnit - s.product.otherVariableCostPerUnit;
      // Le seuil en adhérents : charges et marge suivent le même facteur.
      expect(Math.round(s.fixedCostsPerRound / marge), periodicity).toBe(1167);
      expect(Math.round(s.fixedCostsPerRound / marge / 10) * 10, periodicity).toBe(1170);
      expect(Math.round((s.fixedCostsPerRound / marge / 2200) * 100), periodicity).toBe(53);
      // La capacité d'accueil est un stock de places ; l'encadrement, des heures
      // par tour divisées par des heures par adhérent et par tour.
      const salle = applyPeriodicityToCompany(fitness.company("t", "T", "human"), periodicity, { abonnement: true });
      expect(salle.machineCapacity, periodicity).toBe(2200);
      expect(Math.round((salle.headcount * salle.hoursPerEmployee) / s.product.hoursPerUnit), periodicity).toBe(2427);
      // L'abonnement annuel : quatre trimestres, douze mois ou un an.
      expect(Math.round(prix * (360 / s.roundDays)), periodicity).toBe(420);
      expect(420 - 340).toBe(80);
      // Les taux du banquier sont annuels.
      expect(s.finance.overdraftAnnualRate, periodicity).toBe(0.13);
      expect(s.treasury!.placementAnnualRate, periodicity).toBe(0.02);
    }
  });

  it("le dossier d'un atelier se lit à la durée de tour que l'atelier fixe", () => {
    const atelier = ATELIERS.find((a) => a.reglages.scenarioCode === "fitness")!;
    const auMois = { ...atelier, reglages: { ...atelier.reglages, periodicite: "month" as const } };
    const textes = dossierEnseignant(auMois).situations.flatMap((x) => [
      x.situation.narrative,
      ...x.attendus,
      ...x.leurres,
      ...x.corriges.flatMap((c) => [c.question, c.reponse, c.explication]),
    ]);
    expect(textes.join(" ")).not.toMatch(/trimestr/i);
    expect(textes.join(" ")).toContain("35 € par mois");
  });
});

describe("les quatorze autres scénarios ne bougent à aucune durée", () => {
  for (const d of SCENARIOS.filter((x) => !["fitness", "transport", "bistrot", "bistrot-gamme"].includes(x.code))) {
    it(`${d.code} : sans jeton, la situation de la partie est celle du registre`, () => {
      for (const def of d.situations) {
        for (const periodicity of DUREES) {
          expect(situationDeLaPartie(def, PERIODICITY_DAYS[periodicity])).toBe(def);
        }
        for (const t of textesDe(def)) expect(t).not.toMatch(/\{\{|\}\}/);
      }
    });
  }
});

describe("les jetons", () => {
  const s = joue("month");
  it("un jeton inconnu lève plutôt que de laisser des accolades à l'écran", () => {
    expect(() => rendreTexte("{{semestre}}", s)).toThrow(/jeton inconnu/);
    expect(() => rendreTexte("{{entier: loyer}}", s)).toThrow(/grandeur inconnue/);
  });
  it("les mots de durée gardent l'élision et la majuscule", () => {
    const an = joue("year");
    expect(rendreTexte("jusqu'{{au trimestre}} suivant", an)).toBe("jusqu'à l'exercice suivant");
    expect(rendreTexte("{{Le trimestre}} s'achève", an)).toBe("L'exercice s'achève");
    expect(rendreTexte("combien {{de trimestres}}", an)).toBe("combien d'exercices");
    expect(rendreTexte("{{ce trimestre-ci}}", s)).toBe("ce mois-ci");
  });
});
