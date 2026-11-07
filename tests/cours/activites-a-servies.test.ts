import { beforeEach, describe, expect, it, vi } from "vitest";
import { LE_MOIS_DE_MARS_DE_NOVA } from "../../src/config/cours/bureaux/le-mois-de-mars-de-nova";
import { LES_JEUX_DE_NOEL } from "../../src/config/cours/bureaux/les-jeux-de-noel";
import { LES_PARTENAIRES_AU_31_MARS } from "../../src/config/cours/bureaux/les-partenaires-au-31-mars";
import type { Bureau, EtapeDuBureau } from "../../src/config/cours/bureaux/types";
import { LE_JOURNAL_DE_L_APPRENTI } from "../../src/config/cours/enquetes/le-journal-de-l-apprenti";
import { LES_EFFETS_DE_L_INTERIMAIRE } from "../../src/config/cours/enquetes/les-effets-de-l-interimaire";
import * as C from "../../src/config/cours/scenarios/les-comptes-que-voulait-le-president";
import * as E from "../../src/config/cours/scenarios/les-escomptes-de-janvier";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { enSaisie, type LigneSaisie } from "../../src/pedagogy/cours/correcteur";
import { corrigerAuScenario, servirLeScenario, type RetourDuScenario } from "../../src/pedagogy/cours/scenario-servi";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LES ACTIVITÉS DU LOT A, SERVIES ET CORRIGÉES AU SERVEUR (pedagogy/cours/bureau-servi.ts et
 * scenario-servi.ts). Ce qui part au navigateur ne porte aucun corrigé : ni catégorie, ni pourquoi, ni
 * valeur de case, ni écriture attendue, ni raison, ni option juste, ni explication ; un scénario ne sert
 * que sa première décision. Puis chaque activité se joue de bout en bout par l'action serveur : un geste
 * faux, refusé sans la réponse ; la bonne suite, jusqu'au bout ; un envoi qui n'en est pas un ; l'accès.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
// Le suivi de la classe (migration 0057) écrit en base : ici, seule la correction compte
// (tests/unit/suivi-des-activites-actions.test.ts vérifie ce que l'action y envoie).
vi.mock("../../src/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));
vi.mock("@/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));

const BUREAUX: readonly Bureau[] = [LE_MOIS_DE_MARS_DE_NOVA, LES_PARTENAIRES_AU_31_MARS, LES_JEUX_DE_NOEL, LE_JOURNAL_DE_L_APPRENTI, LES_EFFETS_DE_L_INTERIMAIRE];
const SCENARIOS: readonly { s: Scenario; meilleure: () => readonly string[] }[] = [
  { s: E.LES_ESCOMPTES_DE_JANVIER, meilleure: () => Object.values(E.meilleureSuite().suite) },
  { s: C.LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT, meilleure: () => Object.values(C.meilleureSuite().suite) },
];

function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 300)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

/** Les textes propres aux corrigés d'une étape : ce qui ne doit pas partir avec la page. */
function corrigesDe(e: EtapeDuBureau): string[] {
  const t: string[] = [...e.explication];
  if (e.type === "classement") t.push(...e.elements.map((x) => x.pourquoi));
  if (e.type === "reponse") t.push(...e.questions.flatMap((q) => q.options.map((o) => o.retour)));
  if (e.type === "journal") t.push(...e.ecritures.flatMap((x) => [x.ecriture.libelle, ...x.ecriture.lignes.map((l) => l.role), ...x.indices]));
  if (e.type === "rectification") t.push(...e.ecritures.flatMap((x) => [x.pourquoi, ...x.indices]));
  if (e.type === "etat") t.push(...e.grille.lignes.flatMap((l) => l.cellules.flatMap((c) => (c.saisir ? [c.calcul ?? "", c.indice ?? ""] : []))).filter((x) => x.length > 20));
  return t;
}

describe.each(BUREAUX.map((b) => [b.code, b] as const))("%s : ce que la page sert", (_code, b) => {
  const servi = servirLeBureau(b);
  const texte = espacesOrdinaires(JSON.stringify(servi));

  it("garde la pile et les étapes, sans aucune clé de corrigé", () => {
    expect(servi.pile.map((p) => p.code)).toEqual(b.pile.map((p) => p.code));
    expect(servi.etapes.map((e) => e.id)).toEqual(b.etapes.map((e) => e.id));
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "indices", "ecritures", "ecriture", "explication", "raison"]) expect(texte, cle).not.toContain(`"${cle}":`);
  });

  it("aucun texte de corrigé, aucune case remplie, les options sans rien qui dise la bonne", () => {
    for (const e of b.etapes) for (const t of corrigesDe(e)) expect(texte, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
    for (const e of servi.etapes) {
      if (e.type === "etat") for (const l of e.grille.lignes) for (const c of l.cellules) if (c.saisir) expect(c.valeur).toBeNull();
      if (e.type === "reponse") for (const q of e.questions) for (const o of q.options) expect(Object.keys(o)).toEqual(["texte"]);
    }
  });
});

/** Joue une étape juste ; renvoie le dernier retour. */
function jouerJuste(b: Bureau, e: EtapeDuBureau) {
  const envoyer = (envoi: object) => corrigerAuBureau(b, { etape: e.id, ...envoi });
  switch (e.type) {
    case "classement": {
      const ok = retour(envoyer({ geste: "classer", choix: Object.fromEntries(e.elements.map((x) => [x.code, x.categorie])) }), "classer");
      expect(ok.juste).toBe(true);
      return ok.explication;
    }
    case "etat": {
      const ok = retour(envoyer({ geste: "etat", saisies: solutionsDuTableau(e.grille) }), "etat");
      expect(ok.juste).toBe(true);
      return ok.explication;
    }
    case "journal": {
      const faites: string[] = [];
      let fin: readonly string[] | undefined;
      for (const x of [...e.ecritures].reverse()) {
        const ok = retour(envoyer({ geste: "ecriture", saisie: enSaisie(x.ecriture), faites }), "ecriture");
        expect(ok.juste, x.id).toBe(true);
        faites.push(x.id);
        fin = ok.explication;
      }
      return fin;
    }
    case "rectification": {
      const faites: string[] = [];
      let fin: readonly string[] | undefined;
      for (const x of e.ecritures) {
        const ok = retour(envoyer({ geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites, essais: 0 }), "rectifier");
        expect(ok.juste, x.id).toBe(true);
        faites.push(x.id);
        fin = ok.explication;
      }
      return fin;
    }
    case "reponse": {
      const justes: string[] = [];
      let fin: readonly string[] | undefined;
      for (const q of e.questions) {
        const ok = retour(envoyer({ geste: "repondre", question: q.id, option: q.options.find((o) => o.juste)!.texte, justes }), "repondre");
        expect(ok.juste, q.id).toBe(true);
        justes.push(q.id);
        fin = ok.explication;
      }
      return fin;
    }
  }
}

/** Un geste faux de l'étape : refusé, sans la réponse. */
function jouerFaux(b: Bureau, e: EtapeDuBureau) {
  const envoyer = (envoi: object) => corrigerAuBureau(b, { etape: e.id, ...envoi });
  switch (e.type) {
    case "classement": {
      const [premier] = e.elements;
      const autre = e.categories.find((k) => k.code !== premier!.categorie)!.code;
      const faux = retour(envoyer({ geste: "classer", choix: { ...Object.fromEntries(e.elements.map((x) => [x.code, x.categorie])), [premier!.code]: autre } }), "classer");
      expect([faux.juste, faux.fausses, faux.pourquoi, faux.explication]).toEqual([false, [premier!.code], undefined, undefined]);
      return;
    }
    case "etat": {
      const s = solutionsDuTableau(e.grille);
      const cle = Object.keys(s).at(-1)!;
      const faux = retour(envoyer({ geste: "etat", saisies: { ...s, [cle]: "1" } }), "etat");
      expect([faux.juste, faux.grille]).toEqual([false, undefined]);
      return;
    }
    case "journal": {
      const saisie: LigneSaisie[] = [
        { compte: "607", debit: "1", credit: "" },
        { compte: "530", debit: "", credit: "1" },
      ];
      const faux = retour(envoyer({ geste: "ecriture", saisie, faites: [] }), "ecriture");
      expect([faux.juste, faux.passee]).toEqual([false, undefined]);
      return;
    }
    case "rectification": {
      const x = e.ecritures[0]!;
      const piece = b.pile.find((p) => p.code === `ecriture-${x.id}`)!;
      const telleQuelle = piece.comptes!.map((l) => ({ compte: l.compte, debit: l.debit ? String(l.debit) : "", credit: l.credit ? String(l.credit) : "" }));
      const faux = retour(envoyer({ geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: telleQuelle, faites: [], essais: 0 }), "rectifier");
      expect([faux.juste, faux.raison, faux.pourquoi]).toEqual([false, true, undefined]);
      expect(espacesOrdinaires(faux.indice!)).toBe(espacesOrdinaires(x.indices[0]!));
      const mauvaise = e.raisons.find((r) => r.code !== x.raison)!.code;
      expect(retour(envoyer({ geste: "rectifier", ecriture: x.id, raison: mauvaise, saisie: enSaisie(x.ecriture), faites: [], essais: 1 }), "rectifier").raison).toBe(false);
      return;
    }
    case "reponse": {
      const q = e.questions[0]!;
      const faux = retour(envoyer({ geste: "repondre", question: q.id, option: q.options.find((o) => !o.juste)!.texte, justes: [] }), "repondre");
      expect([faux.juste, faux.fini, faux.explication]).toEqual([false, false, undefined]);
      return;
    }
  }
}

describe.each(BUREAUX.map((b) => [b.code, b] as const))("%s : ce que l'action serveur corrige", (_code, b) => {
  it("chaque étape : un geste faux refusé sans la réponse, puis la bonne suite, qui rend l'explication", () => {
    for (const e of b.etapes) {
      jouerFaux(b, e);
      expect(jouerJuste(b, e)?.length, e.id).toBe(e.explication.length);
      expect(retour(corrigerAuBureau(b, { etape: e.id, geste: "montrer" }), "montrer").explication.map(espacesOrdinaires)).toEqual(e.explication.map(espacesOrdinaires));
    }
  });

  it("un envoi qui n'en est pas un se refuse", () => {
    for (const x of [null, "classer", { etape: b.etapes[0]!.id }, { etape: "nulle-part", geste: "montrer" }]) expect("refus" in corrigerAuBureau(b, x), JSON.stringify(x)).toBe(true);
  });
});

describe("les actions serveur contrôlent l'accès, comme la page", () => {
  beforeEach(() => {
    acces.ouvert = true;
  });

  it("le bureau, l'enquête et le scénario", async () => {
    const { corrigerAuBureauAction } = await import("../../src/app/cours/bureau/actions");
    const { corrigerALEnqueteAction } = await import("../../src/app/cours/enquete/actions");
    const { corrigerAuScenarioAction } = await import("../../src/app/cours/scenario/actions");
    const montrer = (b: Bureau) => ({ etape: b.etapes[0]!.id, geste: "montrer" });
    expect("geste" in (await corrigerAuBureauAction(LES_JEUX_DE_NOEL.code, montrer(LES_JEUX_DE_NOEL)))).toBe(true);
    expect("geste" in (await corrigerALEnqueteAction(LE_JOURNAL_DE_L_APPRENTI.code, montrer(LE_JOURNAL_DE_L_APPRENTI)))).toBe(true);
    expect("geste" in (await corrigerAuScenarioAction(E.LES_ESCOMPTES_DE_JANVIER.code, { geste: "choisir", suite: ["aucun"] }))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerAuBureauAction(LES_JEUX_DE_NOEL.code, montrer(LES_JEUX_DE_NOEL))).toEqual({ refus: "licence" });
    expect(await corrigerALEnqueteAction(LES_EFFETS_DE_L_INTERIMAIRE.code, montrer(LES_EFFETS_DE_L_INTERIMAIRE))).toEqual({ refus: "licence" });
    expect(await corrigerAuScenarioAction(C.LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT.code, { geste: "choisir", suite: ["appliquer"] })).toEqual({ refus: "licence" });
  });
});

function choix(x: RetourDuScenario) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 300)).toBe("choisir");
  return x as Extract<RetourDuScenario, { geste: "choisir" }>;
}

describe.each(SCENARIOS.map((x) => [x.s.code, x] as const))("%s : servi une décision à la fois", (_code, { s, meilleure }) => {
  it("la page ne sert que la première décision : ni conséquence, ni bilan, ni corrigé", () => {
    const servi = servirLeScenario(s);
    const texte = espacesOrdinaires(JSON.stringify(servi));
    expect(servi.premiere.index).toBe(0);
    for (const cle of ["juste", "retour", "explication", "bilan", "consequence", "fin"]) expect(texte, cle).not.toContain(`"${cle}":`);
    expect(texte).not.toContain(espacesOrdinaires(s.situation([s.decisions[0]!.options[0]!]).consigne));
    for (const q of s.questions.questions) for (const o of q.options) expect(texte, o.retour).not.toContain(espacesOrdinaires(o.retour).slice(0, 40));
  });

  it("la meilleure suite se joue jusqu'au bilan ; les questions, sans corrigé, se corrigent au serveur", () => {
    const suite = meilleure();
    for (let n = 1; n <= suite.length; n++) {
      const r = choix(corrigerAuScenario(s, { geste: "choisir", suite: suite.slice(0, n) }));
      expect(r.index).toBe(n - 1);
      if (n < suite.length) {
        expect(r.suivante!.index).toBe(n);
        expect(r.bilan).toBeUndefined();
      } else {
        expect(r.bilan!.meilleure).toBe(true);
        expect(JSON.stringify(r.bilan!.questions)).not.toMatch(/"juste"|"retour"/);
      }
    }
    const [q] = s.questions.questions;
    const non = corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: q!.id, option: q!.options.find((o) => !o.juste)!.texte, justes: [] });
    expect("juste" in non && non.juste).toBe(false);
    let justes: string[] = [];
    for (const x of s.questions.questions) {
      const ok = corrigerAuScenario(s, { etape: s.questions.id, geste: "repondre", question: x.id, option: x.options.find((o) => o.juste)!.texte, justes });
      expect("juste" in ok && ok.juste).toBe(true);
      justes = [...justes, x.id];
    }
  });

  it("une autre suite finit ailleurs que la meilleure ; une suite inconnue se refuse", () => {
    const autre = s.decisions.map((d, i) => d.options.find((o) => o !== meilleure()[i])!);
    expect(choix(corrigerAuScenario(s, { geste: "choisir", suite: autre })).bilan!.meilleure).toBe(false);
    expect(corrigerAuScenario(s, { geste: "choisir", suite: ["nulle-part"] })).toEqual({ refus: "envoi" });
    expect(corrigerAuScenario(s, { geste: "choisir", suite: [] })).toEqual({ refus: "envoi" });
  });
});
