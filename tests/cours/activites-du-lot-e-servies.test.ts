import { beforeEach, describe, expect, it, vi } from "vitest";
import { L_ECHEANCE_DE_JANVIER } from "../../src/config/cours/bureaux/l-echeance-de-janvier";
import { LE_BESOIN_DE_L_ANNEE_TYPE } from "../../src/config/cours/bureaux/le-besoin-de-l-annee-type";
import { LA_PREMIERE_CONSOLIDATION } from "../../src/config/cours/bureaux/la-premiere-consolidation";
import type { Bureau, EtapeDeClassement, EtapeDeReponse, EtapeDEtat } from "../../src/config/cours/bureaux/types";
import { BOUCLER_LE_PLAN_DE_LA_GAMME } from "../../src/config/cours/scenarios/boucler-le-plan-de-la-gamme";
import { LE_DOSSIER_VERT_DE_NOVA } from "../../src/config/cours/scenarios/le-dossier-vert-de-nova";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corrigerAuScenario, servirLeScenario, type RetourDuScenario } from "../../src/pedagogy/cours/scenario-servi";
import { cellulesASaisir, cleDeCellule, solutionsDuTableau, valeurASaisir } from "../../src/pedagogy/cours/tableau-a-completer";
import { suitesDe } from "../helpers/activites-du-lot-e";

/**
 * LES ACTIVITÉS DU LOT E, SERVIES : RIEN DE LA CORRECTION DANS CE QUI PART AU NAVIGATEUR
 * (pedagogy/cours/bureau-servi.ts, scenario-servi.ts). Les mêmes gardes que celles des prototypes
 * (bureau-servi.test.ts, scenario-servi.test.ts), pour les trois bureaux et les deux scénarios du lot :
 * ce que la page sert ne porte ni catégorie, ni valeur à saisir, ni bonne option, ni conséquence, ni
 * meilleure suite ; chaque geste est corrigé au serveur ; l'action contrôle l'accès.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));

const texte = (x: unknown) => espacesOrdinaires(JSON.stringify(x));
const BUREAUX_DU_LOT: readonly Bureau[] = [L_ECHEANCE_DE_JANVIER, LE_BESOIN_DE_L_ANNEE_TYPE, LA_PREMIERE_CONSOLIDATION];
const SCENARIOS_DU_LOT: readonly Scenario[] = [BOUCLER_LE_PLAN_DE_LA_GAMME, LE_DOSSIER_VERT_DE_NOVA];

function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

beforeEach(() => {
  acces.ouvert = true;
});

describe.each(BUREAUX_DU_LOT.map((b) => [b.code, b] as const))("le bureau %s, servi", (_code, b) => {
  const servi = servirLeBureau(b);
  const t = texte(servi);

  it("garde la pile et les étapes, dans l'ordre", () => {
    expect(servi.format).toBe("bureau");
    expect(servi.pile.map((p) => p.code)).toEqual(b.pile.map((p) => p.code));
    expect(servi.etapes.map((e) => e.id)).toEqual(b.etapes.map((e) => e.id));
  });

  it("aucune clé de corrigé, aucun texte de corrigé, aucune valeur à saisir", () => {
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "explication"]) expect(t, cle).not.toContain(`"${cle}":`);
    const corriges = b.etapes.flatMap((e) => [
      ...e.explication,
      ...(e.type === "classement" ? e.elements.map((x) => x.pourquoi) : []),
      ...(e.type === "reponse" ? e.questions.flatMap((q) => q.options.map((o) => o.retour)) : []),
      ...(e.type === "etat" ? cellulesASaisir(e.grille).flatMap(({ cellule }) => [cellule.calcul!, cellule.indice ?? ""]) : []),
    ]);
    for (const x of corriges.filter((y) => y.length > 20)) expect(t, x).not.toContain(espacesOrdinaires(x).slice(0, 40));
    for (const e of servi.etapes) if (e.type === "etat") for (const { cellule } of cellulesASaisir(e.grille)) expect(cellule.valeur).toBeNull();
  });

  it("chaque étape se corrige au serveur : un essai faux refusé, puis le juste", () => {
    for (const e of b.etapes) {
      if (e.type === "classement") {
        const k = e as EtapeDeClassement;
        const faux = Object.fromEntries(k.elements.map((x) => [x.code, k.categories.find((c) => c.code !== x.categorie)!.code]));
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: faux }), "classer").juste).toBe(false);
        const juste = retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: Object.fromEntries(k.elements.map((x) => [x.code, x.categorie])) }), "classer");
        expect(juste.juste).toBe(true);
      } else if (e.type === "etat") {
        const g = (e as EtapeDEtat).grille;
        const premiere = cellulesASaisir(g)[0]!;
        const faux = { ...solutionsDuTableau(g), [cleDeCellule(premiere.ligne, premiere.colonne)]: valeurASaisir((premiere.cellule.valeur ?? 0) + 1_000) };
        const non = retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: faux }), "etat");
        expect(non.juste).toBe(false);
        expect(non.grille).toBeUndefined();
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: solutionsDuTableau(g) }), "etat").juste).toBe(true);
      } else if (e.type === "reponse") {
        const q = (e as EtapeDeReponse).questions;
        const justes: string[] = [];
        const fausse = q[0]!.options.find((o) => !o.juste)!;
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: q[0]!.id, option: fausse.texte, justes }), "repondre").juste).toBe(false);
        for (const [i, x] of q.entries()) {
          const r = retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: x.id, option: x.options.find((o) => o.juste)!.texte, justes }), "repondre");
          justes.push(x.id);
          expect(r).toMatchObject({ juste: true, fini: i === q.length - 1 });
        }
      }
    }
  });

  it("un envoi qui n'en est pas un, une étape inconnue se refusent ; l'action contrôle l'accès", async () => {
    expect(corrigerAuBureau(b, null)).toEqual({ refus: "envoi" });
    expect(corrigerAuBureau(b, { etape: "ailleurs", geste: "montrer" })).toEqual({ refus: "etape" });
    const { corrigerAuBureauAction } = await import("../../src/app/cours/bureau/actions");
    const envoi = { etape: b.etapes[0]!.id, geste: "montrer" };
    expect("geste" in (await corrigerAuBureauAction(b.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerAuBureauAction(b.code, envoi)).toEqual({ refus: "licence" });
  });
});

function choix(x: RetourDuScenario) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe("choisir");
  return x as Extract<RetourDuScenario, { geste: "choisir" }>;
}

describe.each(SCENARIOS_DU_LOT.map((s) => [s.code, s] as const))("le scénario %s, servi", (_code, s) => {
  const servi = servirLeScenario(s);
  const t = texte(servi);

  it("la première décision seule : ni conséquence, ni bilan, ni meilleure suite, ni question, ni la décision suivante", () => {
    expect(servi.premiere.index).toBe(0);
    expect(servi.premiere.options.map((o) => o.code)).toEqual(s.decisions[0]!.options);
    for (const cle of ["consequence", "bilan", "meilleure", "reference", "juste", "retour", "explication", "questions", "comparaison"]) expect(t, cle).not.toContain(`"${cle}"`);
    for (const o of s.decisions[0]!.options) expect(t).not.toContain(espacesOrdinaires(s.situation([o]).consigne));
    for (const q of s.questions.questions) for (const o of q.options) expect(t, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
    for (const suite of suitesDe(s)) for (const p of s.bilan(suite).comparaison) expect(t).not.toContain(espacesOrdinaires(p).slice(0, 40));
  });

  it("un choix rend sa conséquence et la décision suivante ; le dernier, le bilan et des questions sans corrigé", () => {
    for (const suite of suitesDe(s)) {
      const premier = choix(corrigerAuScenario(s, { geste: "choisir", suite: suite.slice(0, 1) }));
      expect(premier.suivante!.index).toBe(1);
      expect(premier.bilan).toBeUndefined();
      const dernier = choix(corrigerAuScenario(s, { geste: "choisir", suite }));
      expect(dernier.suivante).toBeUndefined();
      expect(dernier.bilan!.fin.code).toBe(s.bilan(suite).fin.code);
      for (const x of dernier.bilan!.questions.questions) for (const o of x.options) expect(Object.keys(o)).toEqual(["texte"]);
    }
  });

  it("les questions se corrigent au serveur ; une suite inconnue se refuse ; l'action contrôle l'accès", async () => {
    const [q1] = s.questions.questions;
    expect(corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: q1!.id, option: q1!.options.find((o) => !o.juste)!.texte, justes: [] })).toMatchObject({ juste: false });
    expect(corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: q1!.id, option: q1!.options.find((o) => o.juste)!.texte, justes: [] })).toMatchObject({ juste: true });
    expect(corrigerAuScenario(s, { geste: "choisir", suite: ["inconnu"] })).toEqual({ refus: "envoi" });
    expect(corrigerAuScenario(s, { geste: "choisir", suite: [...suitesDe(s)[0]!, s.decisions[0]!.options[0]!] })).toEqual({ refus: "envoi" });
    const { corrigerAuScenarioAction } = await import("../../src/app/cours/scenario/actions");
    const envoi = { geste: "choisir", suite: [s.decisions[0]!.options[0]!] };
    expect("geste" in (await corrigerAuScenarioAction(s.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerAuScenarioAction(s.code, envoi)).toEqual({ refus: "licence" });
  });
});
