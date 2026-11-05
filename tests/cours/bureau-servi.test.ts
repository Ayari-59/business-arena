import { beforeEach, describe, expect, it, vi } from "vitest";
import { RAPPROCHEMENT_DE_MARS as b } from "../../src/config/cours/bureaux/rapprochement-de-mars";
import type { EtapeDeClassement, EtapeDeReponse, EtapeDEtat, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { rapprochementDeMars } from "../../src/config/cours/monde/bureau-de-la-boutique";
import { MAILLE_ET_CO as f } from "../../src/config/cours/monde/maille-et-co";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { enSaisie, montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LE BUREAU SERVI : AUCUN CORRIGÉ DANS CE QUI PART AU NAVIGATEUR (pedagogy/cours/bureau-servi.ts).
 *
 * La page sert la pile et les consignes ; l'action serveur corrige chaque geste, après le même contrôle
 * d'accès que la page (app/cours/bureau/actions.ts). Cette garde lit ce qui est servi et refuse toute
 * trace d'une réponse : une catégorie, une valeur de case à saisir, une écriture attendue, une option
 * juste, une explication, et le solde rectifié lui-même. Puis elle joue les gestes : juste, faux, la
 * correction demandée, un envoi qui n'en est pas un, un accès refusé.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));

const etape = <T>(id: string) => b.etapes.find((e) => e.id === id) as T;
const pile = etape<EtapeDeClassement>("la-pile");
const pointage = etape<EtapeDeClassement>("le-pointage");
const etat = etape<EtapeDEtat>("l-etat");
const journal = etape<EtapeDuJournal>("les-ecritures");
const reponse = etape<EtapeDeReponse>("la-reponse");
const r = rapprochementDeMars(f);

/** Le retour d'un geste, du genre attendu. */
function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

describe("ce que la page sert", () => {
  const servi = servirLeBureau(b);
  const texte = espacesOrdinaires(JSON.stringify(servi));

  it("garde la pile, les consignes et les étapes, dans l'ordre", () => {
    expect(espacesOrdinaires(servi.titre)).toBe(b.titre);
    expect(servi.pile.map((p) => p.code)).toEqual(b.pile.map((p) => p.code));
    expect(servi.etapes.map((e) => e.id)).toEqual(b.etapes.map((e) => e.id));
  });

  it("aucune clé de corrigé : ni catégorie, ni pourquoi, ni option juste, ni retour, ni calcul, ni indice, ni écriture, ni explication", () => {
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "ecritures", "ecriture", "explication", "lignes\":[{\"role"]) {
      expect(texte, cle).not.toContain(`"${cle}"`);
    }
  });

  it("aucune case à saisir ne garde sa valeur, et aucun texte de corrigé ne part", () => {
    const g = servi.etapes.find((e) => e.id === "l-etat")!;
    if (g.type !== "etat") throw new Error("l'état");
    const cases = g.grille.lignes.flatMap((l) => l.cellules.filter((x) => x.saisir));
    expect(cases.length).toBe(9);
    for (const x of cases) expect(x.valeur).toBeNull();
    // Les textes propres aux corrigés : les pourquoi, les retours, les explications, les rôles des lignes.
    const corriges = [
      ...pile.elements.map((x) => x.pourquoi),
      ...reponse.questions.flatMap((q) => q.options.map((o) => o.retour)),
      ...b.etapes.flatMap((e) => e.explication),
      ...journal.ecritures.flatMap((x) => [x.ecriture.libelle, ...x.ecriture.lignes.map((l) => l.role), ...x.indices]),
    ];
    for (const t of corriges) expect(texte, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
  });

  it("le solde rectifié et l'erreur de saisie ne s'écrivent nulle part, sauf le solde parmi les options chiffrées de la gérante", () => {
    // Une question chiffrée montre la bonne réponse parmi d'autres : le solde rectifié n'y est qu'une
    // option sur quatre, chacune un solde, et rien ne dit laquelle est juste.
    const sansLesOptions = espacesOrdinaires(JSON.stringify({ ...servi, etapes: servi.etapes.filter((e) => e.type !== "reponse") }));
    expect(sansLesOptions).not.toContain(espacesOrdinaires(montantEcrit(r.compteRectifie)));
    expect(sansLesOptions).not.toContain(String(r.compteRectifie));
    expect(texte).not.toContain(espacesOrdinaires(montantEcrit(r.erreur)));
    const q = servi.etapes.find((e) => e.type === "reponse")!;
    if (q.type !== "reponse") throw new Error("la réponse");
    expect(q.questions[0]!.options.filter((o) => /\d €/.test(espacesOrdinaires(o.texte))).length).toBe(4);
  });

  it("les options des questions, mélangées, sans rien qui dise la bonne", () => {
    const q = servi.etapes.find((e) => e.id === "la-reponse")!;
    if (q.type !== "reponse") throw new Error("la réponse");
    for (const x of q.questions) for (const o of x.options) expect(Object.keys(o)).toEqual(["texte"]);
  });
});

describe("ce que l'action serveur corrige", () => {
  beforeEach(() => {
    acces.ouvert = true;
  });

  it("classer la pile : faux, il dit lesquelles sans dire où ; juste, il dit pourquoi", () => {
    const justes = Object.fromEntries(pile.elements.map((x) => [x.code, x.categorie]));
    const faux = retour(corrigerAuBureau(b, { etape: "la-pile", geste: "classer", choix: { ...justes, lettre: "a-saisir" } }), "classer");
    expect(faux.juste).toBe(false);
    expect(faux.fausses).toEqual(["lettre"]);
    expect(faux.pourquoi).toBeUndefined();
    expect(faux.explication).toBeUndefined();
    const bon = retour(corrigerAuBureau(b, { etape: "la-pile", geste: "classer", choix: justes }), "classer");
    expect(bon.juste).toBe(true);
    expect(Object.keys(bon.pourquoi!).sort()).toEqual(Object.keys(justes).sort());
  });

  it("pointer : le chèque de l'atelier, pointé comme les autres, est refusé", () => {
    const justes = Object.fromEntries(pointage.elements.map((x) => [x.code, x.categorie]));
    const faux = retour(corrigerAuBureau(b, { etape: "le-pointage", geste: "classer", choix: { ...justes, "r-atelier": "pointee" } }), "classer");
    expect(faux.fausses).toEqual(["r-atelier"]);
    expect(retour(corrigerAuBureau(b, { etape: "le-pointage", geste: "classer", choix: justes }), "classer").juste).toBe(true);
  });

  it("l'état : une case fausse se dit sans sa valeur ; juste, la grille entière revient", () => {
    const solutions = solutionsDuTableau(etat.grille);
    const cle = Object.keys(solutions).at(-1)!;
    const faux = retour(corrigerAuBureau(b, { etape: "l-etat", geste: "etat", saisies: { ...solutions, [cle]: "1" } }), "etat");
    expect(faux.juste).toBe(false);
    expect(faux.grille).toBeUndefined();
    expect(JSON.stringify(faux)).not.toContain(String(r.compteRectifie));
    const bon = retour(corrigerAuBureau(b, { etape: "l-etat", geste: "etat", saisies: solutions }), "etat");
    expect(bon.juste).toBe(true);
    expect(bon.grille!.lignes.at(-1)!.cellules[0]!.valeur).toBe(r.compteRectifie);
  });

  it("le journal : les écritures dans n'importe quel ordre, une déjà passée le dit, une inconnue aussi, la dernière finit l'étape", () => {
    const ordre = ["erreur", "publicite", "comite", "frais"];
    const faites: string[] = [];
    for (const [i, id] of ordre.entries()) {
      const x = journal.ecritures.find((e) => e.id === id)!;
      const ok = retour(corrigerAuBureau(b, { etape: "les-ecritures", geste: "ecriture", saisie: enSaisie(x.ecriture), faites }), "ecriture");
      expect(ok.juste, id).toBe(true);
      expect(ok.passee!.id).toBe(id);
      expect(ok.fini).toBe(i === ordre.length - 1);
      expect(Boolean(ok.explication)).toBe(i === ordre.length - 1);
      faites.push(id);
    }
    const premiere = journal.ecritures.find((e) => e.id === "erreur")!;
    const deja = retour(corrigerAuBureau(b, { etape: "les-ecritures", geste: "ecriture", saisie: enSaisie(premiere.ecriture), faites: ["erreur"] }), "ecriture");
    expect([deja.juste, deja.deja]).toEqual([false, true]);
    // L'annuaire saisi en charge : aucune régularisation ne lui correspond.
    const annuaire = [
      { compte: "6227", debit: "59,9", credit: "" },
      { compte: "512", debit: "", credit: "59,9" },
    ];
    const non = retour(corrigerAuBureau(b, { etape: "les-ecritures", geste: "ecriture", saisie: annuaire, faites: [] }), "ecriture");
    expect(non.juste).toBe(false);
    expect(non.correction.remarques.join(" ")).toMatch(/aucune régularisation/);
    // La publicité au bon compte, au mauvais montant : la remarque vient de la bonne écriture, sans son montant.
    const mauvais = [
      { compte: "623", debit: "1800", credit: "" },
      { compte: "512", debit: "", credit: "1800" },
    ];
    const pub = retour(corrigerAuBureau(b, { etape: "les-ecritures", geste: "ecriture", saisie: mauvais, faites: [] }), "ecriture");
    expect(pub.juste).toBe(false);
    expect(pub.correction.remarques.join(" ")).toMatch(/TVA déductible/);
  });

  it("répondre : une option fausse dit pourquoi ; l'explication ne vient qu'avec la dernière bonne réponse", () => {
    const [q1, q2, q3] = reponse.questions;
    const fausse = q1!.options.find((o) => !o.juste)!;
    const non = retour(corrigerAuBureau(b, { etape: "la-reponse", geste: "repondre", question: q1!.id, option: fausse.texte, justes: [] }), "repondre");
    expect([non.juste, non.fini, non.explication]).toEqual([false, false, undefined]);
    const juste = (q: typeof q1, justes: string[]) =>
      retour(corrigerAuBureau(b, { etape: "la-reponse", geste: "repondre", question: q!.id, option: q!.options.find((o) => o.juste)!.texte, justes }), "repondre");
    expect(juste(q1, []).fini).toBe(false);
    expect(juste(q2, [q1!.id]).fini).toBe(false);
    const fin = juste(q3, [q1!.id, q2!.id]);
    expect(fin.fini).toBe(true);
    expect(fin.explication?.length).toBe(reponse.explication.length);
  });

  it("la correction demandée rend tout ce que l'étape attendait", () => {
    const m = retour(corrigerAuBureau(b, { etape: "les-ecritures", geste: "montrer" }), "montrer");
    expect(m.ecritures!.map((x) => x.id).sort()).toEqual(["comite", "erreur", "frais", "publicite"]);
    const p = retour(corrigerAuBureau(b, { etape: "la-pile", geste: "montrer" }), "montrer");
    expect(p.choix!.lettre).toBe("a-signaler");
  });

  it("un envoi qui n'en est pas un se refuse", () => {
    for (const x of [null, "classer", { etape: "la-pile" }, { etape: "la-pile", geste: "classer", choix: [1] }, { etape: "nulle-part", geste: "montrer" }, { etape: "la-pile", geste: "etat", saisies: {} }]) {
      expect("refus" in corrigerAuBureau(b, x), JSON.stringify(x)).toBe(true);
    }
    const trop = { etape: "les-ecritures", geste: "ecriture", saisie: Array.from({ length: 50 }, () => ({ compte: "512", debit: "1", credit: "" })), faites: [] };
    expect(corrigerAuBureau(b, trop)).toEqual({ refus: "envoi" });
  });

  it("l'action serveur contrôle l'accès à chaque geste, comme la page", async () => {
    const { corrigerAuBureauAction } = await import("../../src/app/cours/bureau/actions");
    const envoi = { etape: "la-pile", geste: "montrer" };
    expect("geste" in (await corrigerAuBureauAction(b.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerAuBureauAction(b.code, envoi)).toEqual({ refus: "licence" });
    expect(await corrigerAuBureauAction("un-autre-bureau", envoi)).toEqual({ refus: "bureau" });
  });
});
