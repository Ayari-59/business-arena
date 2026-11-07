import { beforeEach, describe, expect, it, vi } from "vitest";
import { LE_DECOUVERT_DE_NOVA as s } from "../../src/config/cours/scenarios/le-decouvert-de-nova";
import { meilleureSuite, resultatDeLaSuite, toutesLesSuites } from "../../src/config/cours/monde/decouvert-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { corrigerAuScenario, servirLeScenario, type RetourDuScenario } from "../../src/pedagogy/cours/scenario-servi";
import { LA_LIGNE_EN_CREDIT_BAIL } from "../../src/config/cours/scenarios/la-ligne-en-credit-bail";
import { LE_PRIX_DES_RESSOURCES } from "../../src/config/cours/scenarios/le-prix-des-ressources";
import { gardesDuScenarioServi } from "../helpers/activites-du-lot-c-servies";

/**
 * LE SCÉNARIO SERVI : RIEN DES BRANCHES NI DE LA CORRECTION DANS CE QUI PART AU NAVIGATEUR
 * (pedagogy/cours/scenario-servi.ts).
 *
 * La page sert la première décision ; l'action serveur calcule chaque choix, après le même contrôle
 * d'accès que la page (app/cours/scenario/actions.ts). Cette garde lit ce qui est servi et refuse toute
 * trace d'une branche : une conséquence, un coût, la meilleure suite, une option juste. Puis elle joue
 * les choix : une suite rend la décision suivante et elle seule, la dernière rend le bilan et des
 * questions sans corrigé ; une suite inconnue, un envoi qui n'en est pas un, un accès refusé se refusent.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
// Le suivi de la classe (migration 0057) écrit en base : ici, seule la correction compte
// (tests/unit/suivi-des-activites-actions.test.ts vérifie ce que l'action y envoie).
vi.mock("../../src/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));
vi.mock("@/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));

const eur = (x: number) => espacesOrdinaires(montantEcrit(x).replace(/^-/, "−"));
const texte = (x: unknown) => espacesOrdinaires(JSON.stringify(x));
const b = meilleureSuite();

function choix(x: RetourDuScenario) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe("choisir");
  return x as Extract<RetourDuScenario, { geste: "choisir" }>;
}

describe("ce que la page sert", () => {
  const servi = servirLeScenario(s);
  const t = texte(servi);

  it("la première décision seule, ses trois options, et les titres des décisions", () => {
    expect(servi.premiere.index).toBe(0);
    expect(servi.premiere.options.map((o) => o.code)).toEqual(s.decisions[0]!.options);
    expect(servi.decisions.map((d) => d.titre)).toEqual(s.decisions.map((d) => d.titre));
    expect(Object.keys(servi)).not.toContain("questions");
  });

  it("aucune conséquence, aucun coût, aucune meilleure suite, aucune question", () => {
    for (const cle of ["consequence", "bilan", "meilleure", "reference", "juste", "retour", "explication", "questions", "comparaison"]) expect(t, cle).not.toContain(`"${cle}"`);
    // Le coût de la meilleure suite, et les textes des conséquences et du bilan.
    expect(t).not.toContain(eur(b.cout));
    expect(t).not.toMatch(/Le mois coûte|Ce que votre choix donne|La meilleure suite|Relancée, CampusTech/);
    for (const q of s.questions.questions) {
      expect(t).not.toContain(espacesOrdinaires(q.question).slice(0, 40));
      for (const o of q.options) expect(t, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
    }
  });

  it("ni la situation de la deuxième décision, ni celle de la troisième", () => {
    expect(t).not.toContain(espacesOrdinaires(s.situation(["attendre"]).consigne));
    expect(t).not.toContain(espacesOrdinaires(s.situation(["attendre", "payer"]).consigne));
  });
});

describe("ce que l'action serveur calcule", () => {
  beforeEach(() => {
    acces.ouvert = true;
  });

  it("un choix rend sa conséquence et la décision suivante, rien d'autre", () => {
    const r = choix(corrigerAuScenario(s, { geste: "choisir", suite: ["relancer"] }));
    expect(r.index).toBe(0);
    expect(r.suivante!.index).toBe(1);
    expect(r.bilan).toBeUndefined();
    expect(texte(r.consequence)).toContain(eur(-2_800));
    // Ni la troisième décision, ni le coût de la meilleure suite.
    expect(texte(r)).not.toContain(espacesOrdinaires(s.situation(["relancer", "payer"]).consigne));
    expect(texte(r)).not.toMatch(/"bilan"|"meilleure"|"juste"/);
  });

  it("la deuxième rend la banque, la situation calculée sur les deux premiers choix", () => {
    const r = choix(corrigerAuScenario(s, { geste: "choisir", suite: ["escompter", "payer"] }));
    expect(r.suivante!.index).toBe(2);
    expect(espacesOrdinaires(r.suivante!.options.find((o) => o.code === "dailly")!.texte)).toMatch(/avril/);
  });

  it("la dernière rend le bilan, la meilleure suite, et des questions sans corrigé", () => {
    const r = choix(corrigerAuScenario(s, { geste: "choisir", suite: ["attendre", "payer", "decouvert"] }));
    expect(r.suivante).toBeUndefined();
    expect(r.bilan!.fin.code).toBe("rejet");
    expect(r.bilan!.meilleure).toBe(false);
    expect(texte(r.bilan!.reference)).toContain(eur(b.cout));
    const q = texte(r.bilan!.questions);
    for (const cle of ["juste", "retour", "explication"]) expect(q, cle).not.toContain(`"${cle}"`);
    for (const x of r.bilan!.questions.questions) for (const o of x.options) expect(Object.keys(o)).toEqual(["texte"]);
    for (const x of s.questions.questions) for (const o of x.options) expect(q, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
  });

  it("chaque suite complète rend le résultat de son calcul", () => {
    for (const x of toutesLesSuites()) {
      const r = choix(corrigerAuScenario(s, { geste: "choisir", suite: [x.client, x.fournisseur, x.banque] }));
      expect(r.bilan!.fin.code).toBe(resultatDeLaSuite(x).fin);
      expect(texte(r.bilan!.eleve)).toContain(eur(resultatDeLaSuite(x).cout));
    }
  });

  it("les questions se corrigent au serveur, comme au bureau", () => {
    const [q1, q2] = s.questions.questions;
    const fausse = q1!.options.find((o) => !o.juste)!;
    const non = corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: q1!.id, option: fausse.texte, justes: [] });
    expect(non).toMatchObject({ geste: "repondre", juste: false, fini: false });
    const juste = (q: typeof q1, justes: string[]) => corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: q!.id, option: q!.options.find((o) => o.juste)!.texte, justes });
    expect(juste(q1, [])).toMatchObject({ juste: true, fini: false });
    expect(juste(q2, [q1!.id])).toMatchObject({ juste: true, fini: true });
    const m = corrigerAuScenario(s, { etape: s.questions.id, geste: "montrer" });
    expect("geste" in m && m.geste === "montrer" && m.reponses?.length).toBe(s.questions.questions.length);
  });

  it("une suite inconnue, un envoi qui n'en est pas un, une étape inconnue se refusent", () => {
    for (const x of [
      null,
      "choisir",
      { geste: "choisir" },
      { geste: "choisir", suite: [] },
      { geste: "choisir", suite: ["payer"] },
      { geste: "choisir", suite: ["relancer", "decouvert"] },
      { geste: "choisir", suite: ["relancer", "payer", "decouvert", "attendre"] },
      { geste: "choisir", suite: [1] },
      { geste: "classer", etape: "les-questions", choix: {} },
    ]) {
      expect(corrigerAuScenario(s, x), JSON.stringify(x)).toEqual({ refus: "envoi" });
    }
    expect(corrigerAuScenario(s, { etape: "ailleurs", geste: "montrer" })).toEqual({ refus: "etape" });
    expect(corrigerAuScenario(s, { geste: "choisir", suite: Array.from({ length: 50 }, () => "attendre") })).toEqual({ refus: "envoi" });
  });

  it("l'action serveur contrôle l'accès à chaque choix, comme la page", async () => {
    const { corrigerAuScenarioAction } = await import("../../src/app/cours/scenario/actions");
    const envoi = { geste: "choisir", suite: ["relancer"] };
    expect("geste" in (await corrigerAuScenarioAction(s.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerAuScenarioAction(s.code, envoi)).toEqual({ refus: "licence" });
    expect(await corrigerAuScenarioAction("un-autre-scenario", envoi)).toEqual({ refus: "scenario" });
  });
});

/**
 * LES SCÉNARIOS DES CHAPITRES, LOT B (novembre 2026) : le même contrat. La page sert la première
 * décision seule ; chaque suite complète rend le bilan de son calcul et des questions sans corrigé ; les
 * questions se corrigent au serveur ; l'action contrôle l'accès.
 */
describe("les scénarios du lot B, servis et calculés au serveur", async () => {
  const { L_OBJECTIF_DU_PRESIDENT } = await import("../../src/config/cours/scenarios/l-objectif-du-president");
  const { LE_CONTROLE_FISCAL } = await import("../../src/config/cours/scenarios/le-controle-fiscal");
  beforeEach(() => {
    acces.ouvert = true;
  });

  for (const lot of [L_OBJECTIF_DU_PRESIDENT, LE_CONTROLE_FISCAL]) {
    it(`${lot.code} : la première décision seule, sans conséquence ni bilan`, () => {
      const servi = servirLeScenario(lot);
      const t = texte(servi);
      expect(servi.premiere.index).toBe(0);
      for (const cle of ["consequence", "bilan", "meilleure", "reference", "juste", "retour", "explication", "questions", "comparaison"]) expect(t, cle).not.toContain(`"${cle}":`);
      expect(t).not.toContain(espacesOrdinaires(lot.situation([lot.decisions[0]!.options[0]!]).consigne));
    });

    it(`${lot.code} : chaque suite rend sa décision suivante, puis son bilan et des questions sans corrigé`, () => {
      const suites = (n: number): string[][] => (n === 0 ? [[]] : suites(n - 1).flatMap((x) => lot.decisions[n - 1]!.options.map((o) => [...x, o])));
      for (const suite of suites(lot.decisions.length)) {
        for (let n = 1; n < suite.length; n++) {
          const r = choix(corrigerAuScenario(lot, { geste: "choisir", suite: suite.slice(0, n) }));
          expect([r.index, r.suivante!.index, r.bilan]).toEqual([n - 1, n, undefined]);
        }
        const fin = choix(corrigerAuScenario(lot, { geste: "choisir", suite }));
        expect(fin.suivante).toBeUndefined();
        const q = texte(fin.bilan!.questions);
        for (const cle of ["juste", "retour", "explication"]) expect(q, cle).not.toContain(`"${cle}":`);
      }
      const [q1] = lot.questions.questions;
      expect(corrigerAuScenario(lot, { etape: lot.questions.id, geste: "repondre", question: q1!.id, option: q1!.options.find((o) => o.juste)!.texte, justes: [] })).toMatchObject({ juste: true });
      expect(corrigerAuScenario(lot, { geste: "choisir", suite: ["inconnu"] })).toEqual({ refus: "envoi" });
    });

    it(`${lot.code} : l'action serveur contrôle l'accès`, async () => {
      const { corrigerAuScenarioAction } = await import("../../src/app/cours/scenario/actions");
      const envoi = { geste: "choisir", suite: [lot.decisions[0]!.options[0]!] };
      expect("geste" in (await corrigerAuScenarioAction(lot.code, envoi))).toBe(true);
      acces.ouvert = false;
      expect(await corrigerAuScenarioAction(lot.code, envoi)).toEqual({ refus: "licence" });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LES SCÉNARIOS DU LOT C (novembre 2026) : les mêmes gardes, pour chacun (tests/helpers/activites-du-lot-c-servies.ts).
// ─────────────────────────────────────────────────────────────────────────────

describe.each([LA_LIGNE_EN_CREDIT_BAIL, LE_PRIX_DES_RESSOURCES])("le scénario $code, servi et calculé au serveur", (x) => {
  gardesDuScenarioServi(x, acces);
});
