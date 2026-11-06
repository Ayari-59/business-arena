import { describe, expect, it } from "vitest";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SCENARIOS, lienDuScenario, scenarioParCode, scenariosDuChapitre } from "../../src/config/cours/scenarios";
import { BOUCLER_LE_PLAN_DE_LA_GAMME as s } from "../../src/config/cours/scenarios/boucler-le-plan-de-la-gamme";
import {
  ARRONDI_DU_MANQUE,
  CHOIX_DU_PLAN,
  DUREES_DE_LA_BANQUE,
  JOUR_DU_PLAN,
  PAS_DE_L_EMPRUNT,
  ebaucheDuPlan,
  empruntDuManque,
  empruntQuiEquilibre,
  finDuPlan,
  meilleureSuiteDuPlan,
  planEnCreditBail,
  resultatDuPlan,
  toutesLesSuitesDuPlan,
} from "../../src/config/cours/monde/boucler-le-plan";
import { CREDIT_BAIL_DE_LA_LIGNE, EMPRUNT_DU_PLAN_EQUILIBRE, LIGNE_A_FINANCER, MOULES } from "../../src/config/cours/monde/financement-de-la-gamme";
import { LEVIERS_DU_PLAN } from "../../src/config/cours/chapitres/le-plan-de-financement";
import { CAS_PAR_CHAPITRE, SITUATIONS } from "../../src/config/cours/situations";
import { textesDuScenario, verifierLaLangue, verifierLesQuestions } from "../helpers/activites-du-lot-e";

/**
 * LE SCÉNARIO : BOUCLER LE PLAN DE LA GAMME (monde/boucler-le-plan.ts, scenarios/boucler-le-plan-de-la-gamme.ts).
 * Chaque chiffre refait à la main depuis le plan du chapitre ; les douze suites se calculent ; trois fins ;
 * une meilleure suite unique ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const r = (montant: string, duree: string) => resultatDuPlan({ montant, duree } as never);
const t = 0.25;
const taux = 0.05;

describe("le monde du plan en décisions : chaque chiffre à la main", () => {
  const ebauche = ebaucheDuPlan();

  it("l'ébauche manque de 60 292,50 € en N+1 ; le manque arrondi au millier au-dessus, 61 000 €", () => {
    expect(ebauche.annees[0]!.solde).toBe(-60_292.5);
    expect(ARRONDI_DU_MANQUE).toBe(1_000);
    expect(empruntDuManque()).toBe(61_000);
  });

  it("le plus petit emprunt qui équilibre, au pas de 10 000 € sur 5 ans, est celui du chapitre", () => {
    expect(PAS_DE_L_EMPRUNT).toBe(LEVIERS_DU_PLAN.emprunt.pas);
    expect(empruntQuiEquilibre()).toBe(EMPRUNT_DU_PLAN_EQUILIBRE);
    expect(empruntQuiEquilibre()).toBe(80_000);
  });

  it("les durées de la banque : les bornes du laboratoire du chapitre et la durée habituelle ; le jour, le 4 janvier N+1", () => {
    expect(DUREES_DE_LA_BANQUE).toEqual({ courte: LEVIERS_DU_PLAN.duree.min, habituelle: 5, longue: LEVIERS_DU_PLAN.duree.max });
    expect(JOUR_DU_PLAN).toEqual({ jour: 4, mois: 1, exercice: 1 });
  });

  it("le solde de N+1 : l'ébauche + l'emprunt − le capital remboursé − les intérêts après impôt", () => {
    const n1 = (e: number, n: number) => c(-60_292.5 + e - e / n - e * taux * (1 - t));
    expect(r("manque", "habituelle").plan.annees[0]!.solde).toBe(n1(61_000, 5));
    expect(n1(61_000, 5)).toBe(-13_780);
    expect(r("equilibre", "courte").plan.annees[0]!.solde).toBe(n1(80_000, 3));
    expect(n1(80_000, 3)).toBe(-9_959.17);
    expect(r("equilibre", "habituelle").plan.annees[0]!.solde).toBe(707.5);
    expect(r("ligne", "courte").plan.annees[0]!.solde).toBe(n1(LIGNE_A_FINANCER.montant, 3));
  });

  it("les intérêts sur toute la durée : le capital en parts égales, taux × capital ÷ n × (n + … + 1)", () => {
    const interets = (e: number, n: number) => c(taux * (e / n) * ((n * (n + 1)) / 2));
    for (const x of toutesLesSuitesDuPlan()) {
      const y = resultatDuPlan(x);
      expect(y.interetsDeLEmprunt, `${x.montant}/${x.duree}`).toBeCloseTo(interets(y.emprunt, y.duree), 1);
    }
    expect(r("equilibre", "habituelle").interetsDeLEmprunt).toBe(12_000);
    expect(r("equilibre", "longue").interetsDeLEmprunt).toBe(16_000);
    expect(r("equilibre", "habituelle").premiereAnnuite).toBe(16_000 + 4_000);
    // Sur 7 ans, 2 annuités tombent après le plan.
    expect(r("equilibre", "longue").restantDu).toBeCloseTo((80_000 * 2) / 7, 1);
  });
});

describe("la ligne en crédit-bail, l'option chiffrée de la première décision", () => {
  // Le cumul de l'ébauche fin N+5 : celui de la meilleure suite, plus ses intérêts après impôt (12 000 € × 75 %).
  const ebaucheFinN5 = c(246_192.5 + 12_000 * (1 - t));

  it("l'offre du chapitre, sans donnée nouvelle : 5 redevances de 33 000 €, une option de 15 000 €, aucun dépôt ; l'emprunt des moules, 40 000 €", () => {
    expect(CREDIT_BAIL_DE_LA_LIGNE).toMatchObject({ valeur: 150_000, redevance: 33_000, dureeAns: 5, option: 15_000, depot: 0 });
    expect(MOULES.montant).toBe(40_000);
    expect(ebaucheDuPlan().cumulFinal).toBe(ebaucheFinN5);
    for (const duree of ["courte", "habituelle", "longue"]) {
      const x = r("credit-bail", duree);
      expect(x.creditBail).toBe(true);
      expect(x.emprunt).toBe(MOULES.montant);
      expect(x.plan.leviers.creditBail).toBe(true);
      expect(x.loyers).toBe(5 * 33_000 + 15_000);
      expect(x.equilibre).toBe(true);
    }
  });

  it("ce que le crédit-bail coûte au plan, après impôt : 30 000 € de plus que le prix, moins 25 % de 40 000 € de charges déductibles en plus, 20 000 €", () => {
    // Les redevances (165 000 €) remplacent 5 dotations de la ligne (125 000 €) ; l'option s'amortit après le plan.
    const cout = c(5 * 33_000 + 15_000 - 150_000 - t * (5 * 33_000 - 5 * (150_000 / 6)));
    expect(cout).toBe(20_000);
    expect(planEnCreditBail().cumulFinal).toBe(c(ebaucheFinN5 - cout));
    expect(planEnCreditBail().cumulFinal).toBe(235_192.5);
    // Avec l'emprunt des moules : ses intérêts après impôt en plus, capital remboursé dans le plan.
    expect(r("credit-bail", "habituelle").laisse).toBe(c(ebaucheFinN5 - cout - 0.05 * 8_000 * 15 * (1 - t)));
    expect(r("credit-bail", "habituelle").laisse).toBe(230_692.5);
    expect(r("credit-bail", "courte").laisse).toBe(c(ebaucheFinN5 - cout - 0.05 * (40_000 / 3) * 6 * (1 - t)));
    // Sur 7 ans : les intérêts des 5 années du plan, et 2 septièmes du capital encore dus.
    const interets7 = 0.05 * (40_000 / 7) * (7 + 6 + 5 + 4 + 3);
    expect(r("credit-bail", "longue").restantDu).toBeCloseTo((40_000 * 2) / 7, 1);
    expect(r("credit-bail", "longue").laisse).toBeCloseTo(ebaucheFinN5 - cout - interets7 * (1 - t), 1);
  });

  it("le plan laissé fin N+5 : le cumul moins le capital encore dû, pour chaque suite", () => {
    for (const x of toutesLesSuitesDuPlan()) {
      const y = resultatDuPlan(x);
      expect(y.laisse, `${x.montant}/${x.duree}`).toBe(c(y.plan.cumulFinal - y.restantDu));
    }
    expect(r("equilibre", "habituelle").laisse).toBe(246_192.5);
  });
});

describe("les branches", () => {
  it("le manque de l'ébauche ne tient jamais, 80 000 € sur 3 ans non plus ; tout le reste tient", () => {
    const ne = toutesLesSuitesDuPlan().filter((x) => !resultatDuPlan(x).equilibre).map((x) => `${x.montant}/${x.duree}`);
    expect(ne).toEqual(["manque/courte", "manque/habituelle", "manque/longue", "equilibre/courte"]);
  });

  it("une meilleure suite unique : 80 000 € sur 5 ans, le plan qui tient et laisse le plus fin N+5, capital dû déduit", () => {
    const b = meilleureSuiteDuPlan();
    expect(b.suite).toEqual({ montant: "equilibre", duree: "habituelle" });
    const tenus = toutesLesSuitesDuPlan().map(resultatDuPlan).filter((x) => x.equilibre);
    expect(tenus.filter((x) => Math.abs(x.laisse - b.laisse) < 0.005)).toHaveLength(1);
    // Parmi les emprunts seuls, c'est aussi celui qui coûte le moins d'intérêts.
    const emprunts = tenus.filter((x) => !x.creditBail);
    expect(Math.min(...emprunts.map((x) => x.interetsDeLEmprunt))).toBe(b.interetsDeLEmprunt);
    // Le crédit-bail ne coûte presque rien en intérêts, mais laisse moins : la règle ne compte pas que les intérêts.
    expect(r("credit-bail", "courte").interetsDeLEmprunt).toBeLessThan(b.interetsDeLEmprunt);
    expect(Math.max(...tenus.filter((x) => x.creditBail).map((x) => x.laisse))).toBeLessThan(b.laisse);
  });

  it("trois fins, chacune atteinte", () => {
    const fins = toutesLesSuitesDuPlan().map((x) => finDuPlan(resultatDuPlan(x)));
    expect(new Set(fins)).toEqual(new Set(["deficit", "lourd", "tenu"]));
    expect(fins.filter((f) => f === "tenu")).toHaveLength(1);
  });

  it("le crédit-bail, rappelé au bilan, laisse moins que le plan bouclé fin N+5", () => {
    expect(planEnCreditBail().cumulFinal).toBeLessThan(meilleureSuiteDuPlan().plan.cumulFinal);
  });
});

describe("le scénario du plan", () => {
  it("est enregistré, réservé, repris du chapitre « Le plan de financement », sans compter parmi les cas dédiés", () => {
    expect(SCENARIOS).toContain(s);
    expect(scenarioParCode(s.code)).toBe(s);
    expect(scenariosDuChapitre("le-plan-de-financement")).toEqual([s]);
    expect(lienDuScenario(s)).toBe("/cours/scenario/boucler-le-plan-de-la-gamme");
    expect(s.libre).toBe(false);
    const ch = CHAPITRES.find((x) => x.code === "le-plan-de-financement")!;
    expect([s.parcours, s.palier]).toEqual([ch.parcours, ch.palier]);
    expect(CAS_PAR_CHAPITRE.length).toBe(197);
    expect(SITUATIONS.map((x) => x.code)).not.toContain(s.code);
  });

  it("deux décisions, de quatre puis de trois options, les codes du monde, et chaque bilan se dit chiffres à l'appui", () => {
    expect(s.decisions.map((d) => d.options)).toEqual(CHOIX_DU_PLAN);
    expect(CHOIX_DU_PLAN.map((x) => x.length)).toEqual([4, 3]);
    expect(s.situation([]).options.map((o) => o.code)).toEqual(CHOIX_DU_PLAN[0]);
    expect(s.situation([]).options.find((o) => o.code === "credit-bail")!.texte).toMatch(/crédit-bail.*40\s000\s€/u);
    expect(s.situation([]).pieces.map((x) => x.code)).toContain("credit-bail");
    for (const m of CHOIX_DU_PLAN[0]!) expect(s.situation([m]).options.map((o) => o.code)).toEqual(CHOIX_DU_PLAN[1]);
    expect(toutesLesSuitesDuPlan()).toHaveLength(12);
    for (const x of toutesLesSuitesDuPlan()) {
      const bl = s.bilan([x.montant, x.duree]);
      expect(bl.fin.code).toBe(finDuPlan(resultatDuPlan(x)));
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
