import { expect, it } from "vitest";
import type { Bureau } from "../../src/config/cours/bureaux/types";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { corrigerAuScenario, servirLeScenario, type RetourDuScenario } from "../../src/pedagogy/cours/scenario-servi";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { suitesDe } from "./activites-du-lot-c";

/**
 * CE QUE LES ACTIVITÉS DU LOT C SERVENT, ET CE QUE LE SERVEUR CORRIGE (novembre 2026). Les gardes des
 * prototypes (bureau-servi, enquete-servie, scenario-servi) les appellent pour chaque bureau, enquête ou
 * scénario du lot : rien de la correction ne part au navigateur, chaque geste juste passe, un geste faux
 * se refuse sans dire la réponse, l'action contrôle l'accès. Le fichier qui les appelle simule l'accès
 * (`acces.ouvert`) par son propre `vi.mock`.
 */

const texte = (x: unknown) => espacesOrdinaires(JSON.stringify(x));

function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

/** Les textes de corrigé d'un bureau : les pourquoi, les retours, les pistes, les explications, les rôles. */
function corrigesDe(b: Bureau): string[] {
  return b.etapes.flatMap((e) => [
    ...e.explication,
    ...(e.type === "classement" ? e.elements.map((x) => x.pourquoi) : []),
    ...(e.type === "reponse" ? e.questions.flatMap((q) => q.options.map((o) => o.retour)) : []),
    ...(e.type === "journal" ? e.ecritures.flatMap((x) => [...x.indices, ...x.ecriture.lignes.map((l) => l.role)]) : []),
    ...(e.type === "rectification" ? e.ecritures.flatMap((x) => [x.pourquoi, ...x.indices, ...x.ecriture.lignes.map((l) => l.role)]) : []),
  ]);
}

export function gardesDuBureauServi(b: Bureau, action: () => Promise<(code: unknown, envoi: unknown) => Promise<RetourDuBureau>>, acces: { ouvert: boolean }) {
  it("la page ne sert aucune clé ni aucun texte de corrigé, et aucune case à saisir ne garde sa valeur", () => {
    const servi = servirLeBureau(b);
    const t = texte(servi);
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "indices", "ecritures", "ecriture", "raison", "explication"]) expect(t, cle).not.toContain(`"${cle}":`);
    // Les textes assez longs pour ne pas se confondre avec un mot de la pile.
    for (const c of corrigesDe(b).filter((x) => x.length >= 40)) expect(t, c).not.toContain(espacesOrdinaires(c).slice(0, 40));
    for (const e of servi.etapes) if (e.type === "etat") for (const l of e.grille.lignes) for (const x of l.cellules) if (x.saisir) expect(x.valeur).toBeNull();
  });

  it("chaque étape, jouée juste, passe ; jouée fausse, se refuse sans dire la réponse ; la correction demandée rend tout", () => {
    acces.ouvert = true;
    for (const e of b.etapes) {
      if (e.type === "classement") {
        const autre = (code: string) => e.categories.find((k) => k.code !== code)!.code;
        const faux = retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: Object.fromEntries(e.elements.map((x) => [x.code, autre(x.categorie)])) }), "classer");
        expect([faux.juste, faux.pourquoi]).toEqual([false, undefined]);
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "classer", choix: Object.fromEntries(e.elements.map((x) => [x.code, x.categorie])) }), "classer").juste).toBe(true);
      }
      if (e.type === "etat") {
        const s = solutionsDuTableau(e.grille);
        const fausse = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, `${v}1`]));
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: fausse }), "etat").grille).toBeUndefined();
        expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "etat", saisies: s }), "etat").juste).toBe(true);
      }
      if (e.type === "journal") {
        const faites: string[] = [];
        for (const x of [...e.ecritures].reverse()) {
          const r = retour(corrigerAuBureau(b, { etape: e.id, geste: "ecriture", saisie: enSaisie(x.ecriture), faites }), "ecriture");
          expect(r.juste, x.id).toBe(true);
          faites.push(x.id);
          expect(r.fini).toBe(faites.length === e.ecritures.length);
        }
      }
      if (e.type === "rectification") {
        const faites: string[] = [];
        for (const x of e.ecritures) {
          const autre = e.raisons.find((k) => k.code !== x.raison)!.code;
          expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "rectifier", ecriture: x.id, raison: autre, saisie: enSaisie(x.ecriture), faites, essais: 0 }), "rectifier").juste).toBe(false);
          expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites, essais: 0 }), "rectifier").juste, x.id).toBe(true);
          faites.push(x.id);
        }
      }
      if (e.type === "reponse") {
        const justes: string[] = [];
        for (const q of e.questions) {
          const fausse = q.options.find((o) => !o.juste)!;
          expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: q.id, option: fausse.texte, justes }), "repondre").juste).toBe(false);
          const r = retour(corrigerAuBureau(b, { etape: e.id, geste: "repondre", question: q.id, option: q.options.find((o) => o.juste)!.texte, justes }), "repondre");
          justes.push(q.id);
          expect([r.juste, r.fini]).toEqual([true, justes.length === e.questions.length]);
        }
      }
      expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "montrer" }), "montrer").explication.map(espacesOrdinaires)).toEqual(e.explication.map(espacesOrdinaires));
    }
    expect(corrigerAuBureau(b, { etape: "ailleurs", geste: "montrer" })).toEqual({ refus: "etape" });
    expect(corrigerAuBureau(b, { geste: "classer" })).toEqual({ refus: "envoi" });
  });

  it("l'action serveur contrôle l'accès à chaque geste", async () => {
    const corriger = await action();
    const envoi = { etape: b.etapes[0]!.id, geste: "montrer" };
    acces.ouvert = true;
    expect("geste" in (await corriger(b.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corriger(b.code, envoi)).toMatchObject({ refus: "licence" });
    acces.ouvert = true;
  });
}

function choix(x: RetourDuScenario) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe("choisir");
  return x as Extract<RetourDuScenario, { geste: "choisir" }>;
}

export function gardesDuScenarioServi(sc: Scenario, acces: { ouvert: boolean }) {
  const meilleure = suitesDe(sc).find((s) => sc.bilan(s).meilleure)!;

  it("la page sert la première décision seule : ni conséquence, ni bilan, ni la situation suivante, ni corrigé", () => {
    const servi = servirLeScenario(sc);
    const t = texte(servi);
    expect(servi.premiere.index).toBe(0);
    expect(servi.premiere.options.map((o) => o.code)).toEqual(sc.decisions[0]!.options);
    for (const cle of ["consequence", "bilan", "meilleure", "reference", "juste", "retour", "explication", "questions", "comparaison"]) expect(t, cle).not.toContain(`"${cle}"`);
    expect(t).not.toContain(espacesOrdinaires(sc.situation([meilleure[0]!]).consigne));
    for (const p of sc.bilan(meilleure).comparaison) expect(t).not.toContain(espacesOrdinaires(p).slice(0, 40));
    for (const q of sc.questions.questions) for (const o of q.options) expect(t, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
  });

  it("chaque choix rend sa conséquence et la décision suivante seule ; la dernière, le bilan et des questions sans corrigé", () => {
    for (let n = 1; n < sc.decisions.length; n++) {
      const r = choix(corrigerAuScenario(sc, { geste: "choisir", suite: meilleure.slice(0, n) }));
      expect([r.index, r.suivante!.index, r.bilan]).toEqual([n - 1, n, undefined]);
      expect(texte(r)).not.toMatch(/"bilan"|"meilleure"|"juste"/);
    }
    for (const s of suitesDe(sc)) {
      const r = choix(corrigerAuScenario(sc, { geste: "choisir", suite: s }));
      expect(r.bilan!.fin.code).toBe(sc.bilan(s).fin.code);
      for (const x of r.bilan!.questions.questions) for (const o of x.options) expect(Object.keys(o)).toEqual(["texte"]);
    }
    expect(choix(corrigerAuScenario(sc, { geste: "choisir", suite: meilleure })).bilan!.meilleure).toBe(true);
  });

  it("les questions se corrigent au serveur ; une suite inconnue se refuse ; l'action contrôle l'accès", async () => {
    const justes: string[] = [];
    for (const q of sc.questions.questions) {
      const r = corrigerAuScenario(sc, { etape: sc.questions.id, geste: "repondre", question: q.id, option: q.options.find((o) => o.juste)!.texte, justes });
      justes.push(q.id);
      expect(r).toMatchObject({ juste: true, fini: justes.length === sc.questions.questions.length });
    }
    expect(corrigerAuScenario(sc, { geste: "choisir", suite: ["ailleurs"] })).toEqual({ refus: "envoi" });
    expect(corrigerAuScenario(sc, { geste: "choisir", suite: [...meilleure, meilleure[0]!] })).toEqual({ refus: "envoi" });
    const { corrigerAuScenarioAction } = await import("../../src/app/cours/scenario/actions");
    acces.ouvert = false;
    expect(await corrigerAuScenarioAction(sc.code, { geste: "choisir", suite: [meilleure[0]!] })).toEqual({ refus: "licence" });
    acces.ouvert = true;
    expect("geste" in (await corrigerAuScenarioAction(sc.code, { geste: "choisir", suite: [meilleure[0]!] }))).toBe(true);
  });
}
