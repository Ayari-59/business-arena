import { describe, expect, it } from "vitest";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SCENARIOS, lienDuScenario, scenarioParCode, scenariosDuChapitre } from "../../src/config/cours/scenarios";
import { LE_DOSSIER_VERT_DE_NOVA as s } from "../../src/config/cours/scenarios/le-dossier-vert-de-nova";
import { CHOIX_DU_DOSSIER, ligneDuDossier, meilleurDossier, resultatDuDossier, toutesLesSuitesDuDossier, vanAuCoutDuCapital } from "../../src/config/cours/monde/dossier-vert-de-nova";
import { deuxProjetsDurables } from "../../src/config/cours/monde/investissement-durable";
import { van } from "../../src/config/cours/monde/finance";
import { CAS_PAR_CHAPITRE, SITUATIONS } from "../../src/config/cours/situations";
import { textesDuScenario, verifierLaLangue, verifierLesQuestions } from "../helpers/activites-du-lot-e";

/**
 * LE SCÉNARIO : LE DOSSIER VERT DE NOVA (monde/dossier-vert-de-nova.ts, scenarios/le-dossier-vert-de-nova.ts).
 * Chaque chiffre refait à la main depuis les flux du chapitre ; la règle de la banque ; quatre fins ; une
 * meilleure suite unique ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const r = (ligne: string, pret: string) => resultatDuDossier({ ligne, pret } as never);
const vanA = (flux: readonly number[], taux: number) => c(flux.reduce((t, f, k) => t + f * (1 + taux) ** -k, 0));

describe("le monde du dossier vert : chaque chiffre à la main", () => {
  const d = deuxProjetsDurables();

  it("les VAN à 9 %, le risque de l'électricité compris : A, A durable (A et ses équipements), B (et son risque)", () => {
    expect(vanAuCoutDuCapital("a")).toBe(vanA(d.a, 0.09));
    expect(vanAuCoutDuCapital("a-durable")).toBe(vanA(d.a.map((x, k) => x + d.efficacite.flux[k]!), 0.09));
    expect(vanAuCoutDuCapital("b")).toBe(vanA(d.b.map((x, k) => x + d.risque.flux[k]!), 0.09));
    expect([vanAuCoutDuCapital("a"), vanAuCoutDuCapital("a-durable"), vanAuCoutDuCapital("b")]).toEqual([58_847.24, 59_622.4, 62_562.81]);
  });

  it("le prêt vert : 9 % − 60 % × (5 % − 3 %) × 75 % = 8,1 %, et la VAN du projet A durable à ce taux", () => {
    const x = r("a-durable", "vert");
    expect(x.taux).toBeCloseTo(0.09 - 0.6 * 0.02 * 0.75, 9);
    expect(x.van).toBe(van(d.aDurable, 0.081));
    expect(x.van).toBe(65_694.39);
  });

  it("la part alignée : les équipements seuls, 12 000 € sur 112 000 € ; le CO2 évité face à B, 28 000 kWh × 0,052 kg × 5 ans", () => {
    expect(ligneDuDossier("a-durable").partAlignee).toBeCloseTo(12_000 / 112_000, 9);
    expect(ligneDuDossier("a").partAlignee).toBe(0);
    expect(ligneDuDossier("b").partAlignee).toBe(0);
    expect(r("a-durable", "vert").tonnesEviteesSurCinqAns).toBe(c((28_000 * 0.052 * 5) / 1_000));
    expect(r("a", "classique").tonnesEviteesSurCinqAns).toBe(c((20_000 * 0.052 * 5) / 1_000));
  });

  it("la règle de la banque : le prêt vert au seul projet aligné ; la façade refusée, la relation abîmée, au taux classique", () => {
    for (const ligne of ["a", "b"]) expect(r(ligne, "vert")).toMatchObject({ pretVert: false, taux: 0.09, fin: "refus", relation: "bonne" });
    for (const ligne of ["a", "a-durable", "b"]) expect(r(ligne, "facade")).toMatchObject({ pretVert: false, taux: 0.09, fin: "facade", relation: "abimee" });
    expect(r("a-durable", "classique")).toMatchObject({ pretVert: false, fin: "classique" });
  });
});

describe("les branches", () => {
  it("une meilleure suite unique : A durable et le prêt vert", () => {
    const b = meilleurDossier();
    expect(b.suite).toEqual({ ligne: "a-durable", pret: "vert" });
    const admises = toutesLesSuitesDuDossier().map(resultatDuDossier).filter((x) => x.relation !== "abimee");
    expect(admises.filter((x) => Math.abs(x.van - b.van) < 0.005)).toHaveLength(1);
  });

  it("le premier choix change le second : à 9 %, B est devant ; seul A durable ouvre le prêt vert", () => {
    expect(r("b", "classique").van).toBeGreaterThan(r("a-durable", "classique").van);
    expect(r("a-durable", "vert").van).toBeGreaterThan(r("b", "classique").van);
  });

  it("quatre fins, chacune atteinte", () => {
    expect(new Set(toutesLesSuitesDuDossier().map((x) => resultatDuDossier(x).fin))).toEqual(new Set(["vert", "classique", "refus", "facade"]));
  });
});

describe("le scénario du dossier vert", () => {
  it("est enregistré, réservé, repris du chapitre « Évaluer un investissement durable », sans compter parmi les cas dédiés", () => {
    expect(SCENARIOS).toContain(s);
    expect(scenarioParCode(s.code)).toBe(s);
    expect(scenariosDuChapitre("evaluer-un-investissement-durable")).toEqual([s]);
    expect(lienDuScenario(s)).toBe("/cours/scenario/le-dossier-vert-de-nova");
    expect(s.libre).toBe(false);
    const ch = CHAPITRES.find((x) => x.code === "evaluer-un-investissement-durable")!;
    expect([s.parcours, s.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(197);
    expect(SITUATIONS.map((x) => x.code)).not.toContain(s.code);
  });

  it("deux décisions de trois options, les codes du monde, et chaque bilan se dit chiffres à l'appui", () => {
    expect(s.decisions.map((d) => d.options)).toEqual(CHOIX_DU_DOSSIER);
    expect(s.situation([]).options.map((o) => o.code)).toEqual(CHOIX_DU_DOSSIER[0]);
    expect(s.situation(["b"]).options.map((o) => o.code)).toEqual(CHOIX_DU_DOSSIER[1]);
    for (const x of toutesLesSuitesDuDossier()) {
      const bl = s.bilan([x.ligne, x.pret]);
      expect(bl.fin.code).toBe(resultatDuDossier(x).fin);
      expect(bl.comparaison.join(" ")).toMatch(/\d €/);
    }
  });

  it("les questions : une seule bonne option, jamais la plus longue", () => {
    verifierLesQuestions(s.questions.questions);
  });

  it("la langue de tout ce qui est servi", () => {
    verifierLaLangue(textesDuScenario(s));
  });
});
