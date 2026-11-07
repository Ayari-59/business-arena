import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EtapeDeClassement, EtapeDeRectification } from "../../src/config/cours/bureaux/types";
import { LA_CLOTURE_DU_STAGIAIRE as e, grilleDuResultat } from "../../src/config/cours/enquetes/la-cloture-du-stagiaire";
import { dossierDuStagiaire, resultatDuStagiaire } from "../../src/config/cours/monde/cloture-du-stagiaire";
import { EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { espacesOrdinaires } from "../../src/lib/typographie";
import { corrigerAuBureau, servirLeBureau, type RetourDuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { enSaisie, montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LE_DOSSIER_DES_IMMOBILISATIONS } from "../../src/config/cours/enquetes/le-dossier-des-immobilisations";
import { LA_NOTE_DE_L_ANALYSTE } from "../../src/config/cours/enquetes/la-note-de-l-analyste";
import { gardesDuBureauServi } from "../helpers/activites-du-lot-c-servies";

/**
 * L'ENQUÊTE SERVIE : AUCUN CORRIGÉ DANS CE QUI PART AU NAVIGATEUR (pedagogy/cours/bureau-servi.ts, le
 * moteur du bureau ; app/cours/enquete/actions.ts).
 *
 * Cette garde lit ce que la page sert et refuse toute trace d'une réponse : le verdict d'une écriture,
 * la raison d'une erreur, une écriture juste, un pourquoi, une piste, une explication, et les chiffres
 * que seule la correction donne. Puis elle joue les gestes : trier, rectifier (juste, fausse raison,
 * écriture du stagiaire repassée, écriture juste qu'on voudrait rectifier), le tableau, la correction
 * demandée, un envoi qui n'en est pas un, un accès refusé.
 */

const acces = vi.hoisted(() => ({ ouvert: true }));
vi.mock("../../src/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
vi.mock("@/app/cours/acces", () => ({ chapitreOuvert: vi.fn(async () => acces.ouvert) }));
// Le suivi de la classe (migration 0057) écrit en base : ici, seule la correction compte
// (tests/unit/suivi-des-activites-actions.test.ts vérifie ce que l'action y envoie).
vi.mock("../../src/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));
vi.mock("@/app/cours/suivi-des-activites", () => ({ noterDansLaClasse: vi.fn(async () => undefined) }));

const tri = e.etapes.find((x) => x.id === "le-tri") as EtapeDeClassement;
const rectification = e.etapes.find((x) => x.id === "les-rectifications") as EtapeDeRectification;
const r = resultatDuStagiaire(f);
const dossier = dossierDuStagiaire(f);

function retour<G extends Exclude<RetourDuBureau, { refus: string }>["geste"]>(x: RetourDuBureau, geste: G) {
  expect("geste" in x && x.geste, JSON.stringify(x).slice(0, 200)).toBe(geste);
  return x as Extract<RetourDuBureau, { geste: G }>;
}

/** L'écriture du stagiaire, telle que le formulaire la propose. */
const saisieDuStagiaire = (id: string) => {
  const piece = e.pile.find((p) => p.code === tri.elements.find((x) => x.code === id)!.piece)!;
  const texte = (x: number) => x.toFixed(2).replace(".", ",").replace(/,00$/, "");
  return piece.comptes!.map((l) => ({ compte: l.compte, debit: l.debit ? texte(l.debit) : "", credit: l.credit ? texte(l.credit) : "" }));
};
const rectifier = (id: string, raison: string, saisie: { compte: string; debit: string; credit: string }[], faites: string[] = [], essais = 0) =>
  corrigerAuBureau(e, { etape: "les-rectifications", geste: "rectifier", ecriture: id, raison, saisie, faites, essais });

describe("ce que la page sert", () => {
  const servi = servirLeBureau(e);
  const texte = espacesOrdinaires(JSON.stringify(servi));

  it("garde le dossier, les consignes et les étapes, dans l'ordre, au format de l'enquête", () => {
    expect(servi.format).toBe("enquete");
    expect(espacesOrdinaires(servi.titre)).toBe(e.titre);
    expect(servi.pile.map((p) => p.code)).toEqual(e.pile.map((p) => p.code));
    expect(servi.etapes.map((x) => x.id)).toEqual(e.etapes.map((x) => x.id));
  });

  it("aucune clé de corrigé : ni catégorie, ni raison juste, ni écriture attendue, ni pourquoi, ni piste, ni explication", () => {
    for (const cle of ["categorie", "pourquoi", "juste", "retour", "calcul", "indice", "indices", "ecritures", "ecriture", "raison", "explication"]) {
      expect(texte, cle).not.toContain(`"${cle}":`);
    }
    const s = servi.etapes.find((x) => x.type === "rectification")!;
    expect(Object.keys(s).sort()).toEqual(["consigne", "depuis", "id", "pieces", "raisons", "titre", "type"]);
    for (const x of s.type === "rectification" ? s.raisons : []) expect(Object.keys(x).sort()).toEqual(["code", "libelle"]);
  });

  it("aucun texte de corrigé ne part : les pourquoi, les pistes, les explications, les rôles des lignes", () => {
    const corriges = [
      ...tri.elements.map((x) => x.pourquoi),
      ...rectification.ecritures.flatMap((x) => [x.pourquoi, ...x.indices, ...x.ecriture.lignes.map((l) => l.role), ...x.ecriture.lignes.map((l) => l.indice)]),
      ...e.etapes.flatMap((x) => x.explication),
    ];
    for (const t of corriges) expect(texte, t).not.toContain(espacesOrdinaires(t).slice(0, 40));
  });

  it("aucun chiffre que seule la correction donne : les montants justes des écritures fausses, l'effet des erreurs, le résultat corrigé", () => {
    // Les erreurs de montant : leur montant juste ne se lit nulle part, sauf la provision, dont le montant
    // probable est un fait du dossier (l'avis de l'avocat) et non un calcul.
    const deMontant = dossier.filter((d) => d.erreur && d.juste.montant !== d.stagiaire.montant).map((d) => d.code);
    expect(deMontant).toEqual(["dotation", "creanceDouteuse", "provision", "chargeConstateeDAvance"]);
    for (const d of dossier.filter((x) => deMontant.includes(x.code) && x.code !== "provision")) {
      expect(texte, d.code).not.toContain(espacesOrdinaires(montantEcrit(d.juste.montant)));
    }
    for (const x of [r.correction, r.corrige, r.impotCorrige]) {
      expect(texte, String(x)).not.toContain(espacesOrdinaires(montantEcrit(Math.abs(x))));
      expect(texte, String(x)).not.toContain(String(Math.abs(x)));
    }
    // Le dossier, lui, porte ce que le stagiaire a passé et ce qu'il annonce.
    expect(texte).toContain(espacesOrdinaires(montantEcrit(r.annonce)));
  });

  it("aucune case à saisir ne garde sa valeur", () => {
    const g = servi.etapes.find((x) => x.type === "etat")!;
    if (g.type !== "etat") throw new Error("le tableau");
    const cases = g.grille.lignes.flatMap((l) => l.cellules.filter((x) => x.saisir));
    expect(cases.length).toBe(2);
    for (const x of cases) expect(x.valeur).toBeNull();
  });
});

describe("ce que l'action serveur corrige", () => {
  beforeEach(() => {
    acces.ouvert = true;
  });
  const fausses = rectification.ecritures.map((x) => x.id);
  const justes = Object.fromEntries(tri.elements.map((x) => [x.code, x.categorie]));

  it("trier : tout marquer faux ne passe pas ; le bon tri passe, et dit pourquoi les justes le sont", () => {
    const toutFaux = retour(corrigerAuBureau(e, { etape: "le-tri", geste: "classer", choix: Object.fromEntries(tri.elements.map((x) => [x.code, "fausse"])) }), "classer");
    expect(toutFaux.juste).toBe(false);
    expect(toutFaux.fausses.sort()).toEqual(tri.elements.filter((x) => x.categorie === "juste").map((x) => x.code).sort());
    expect(toutFaux.pourquoi).toBeUndefined();
    const bon = retour(corrigerAuBureau(e, { etape: "le-tri", geste: "classer", choix: justes }), "classer");
    expect(bon.juste).toBe(true);
    expect(Object.keys(bon.pourquoi!).sort()).toEqual(Object.keys(justes).sort());
  });

  it("rectifier : la bonne raison et l'écriture juste passent, dans n'importe quel ordre ; la dernière finit l'étape", () => {
    const faites: string[] = [];
    for (const [i, x] of [...rectification.ecritures].reverse().entries()) {
      const ok = retour(rectifier(x.id, x.raison, enSaisie(x.ecriture), faites), "rectifier");
      expect([ok.juste, ok.raison], x.id).toEqual([true, true]);
      expect(ok.passee!.id).toBe(x.id);
      expect(espacesOrdinaires(ok.pourquoi!)).toBe(espacesOrdinaires(x.pourquoi));
      expect(ok.fini).toBe(i === fausses.length - 1);
      expect(Boolean(ok.explication)).toBe(i === fausses.length - 1);
      faites.push(x.id);
    }
    const deja = retour(rectifier(fausses[0]!, rectification.ecritures[0]!.raison, enSaisie(rectification.ecritures[0]!.ecriture), [fausses[0]!]), "rectifier");
    expect([deja.juste, deja.deja]).toEqual([false, true]);
  });

  it("rectifier : l'écriture du stagiaire repassée est refusée, avec une piste, puis la suivante", () => {
    for (const x of rectification.ecritures) {
      const non = retour(rectifier(x.id, x.raison, saisieDuStagiaire(x.id)), "rectifier");
      expect([non.juste, non.raison, non.correction.juste], x.id).toEqual([false, true, false]);
      expect(non.passee).toBeUndefined();
      expect(non.pourquoi).toBeUndefined();
      expect(espacesOrdinaires(non.indice!)).toBe(espacesOrdinaires(x.indices[0]!));
      const encore = retour(rectifier(x.id, x.raison, saisieDuStagiaire(x.id), [], 1), "rectifier");
      expect(espacesOrdinaires(encore.indice!)).toBe(espacesOrdinaires(x.indices[1]!));
    }
  });

  it("rectifier : l'écriture juste avec une fausse raison est refusée, et le dit sans donner la bonne", () => {
    const x = rectification.ecritures.find((y) => y.raison === "prorata")!;
    const non = retour(rectifier(x.id, "methode", enSaisie(x.ecriture)), "rectifier");
    expect([non.juste, non.raison, non.correction.juste]).toEqual([false, false, true]);
    expect(JSON.stringify(non)).not.toContain('"prorata"');
  });

  it("rectifier une écriture juste du dossier : elle n'a rien à rectifier ; une écriture inconnue se refuse", () => {
    const juste = tri.elements.find((x) => x.categorie === "juste")!;
    const non = retour(rectifier(juste.code, "sens", saisieDuStagiaire(juste.code)), "rectifier");
    expect(non.juste).toBe(false);
    expect(non.correction.remarques.join(" ")).toMatch(/rien à rectifier/);
    expect(rectifier("nulle-part", "sens", saisieDuStagiaire(juste.code))).toEqual({ refus: "envoi" });
  });

  it("le résultat corrigé : une case fausse se dit sans sa valeur ; juste, la grille entière revient", () => {
    const solutions = solutionsDuTableau(grilleDuResultat());
    const cle = Object.keys(solutions).at(-1)!;
    const faux = retour(corrigerAuBureau(e, { etape: "le-resultat", geste: "etat", saisies: { ...solutions, [cle]: "1" } }), "etat");
    expect(faux.juste).toBe(false);
    expect(JSON.stringify(faux)).not.toContain(String(r.corrige));
    const bon = retour(corrigerAuBureau(e, { etape: "le-resultat", geste: "etat", saisies: solutions }), "etat");
    expect(bon.juste).toBe(true);
    expect(bon.grille!.lignes.at(-1)!.cellules[0]!.valeur).toBe(r.corrige);
  });

  it("la correction demandée rend chaque erreur : sa raison, son écriture juste, son pourquoi", () => {
    const m = retour(corrigerAuBureau(e, { etape: "les-rectifications", geste: "montrer" }), "montrer");
    expect(m.ecritures!.map((x) => x.id).sort()).toEqual([...fausses].sort());
    expect(m.raisons).toEqual(Object.fromEntries(rectification.ecritures.map((x) => [x.id, x.raison])));
    expect(Object.keys(m.pourquoi!).sort()).toEqual([...fausses].sort());
  });

  it("un envoi qui n'en est pas un se refuse", () => {
    const x = rectification.ecritures[0]!;
    for (const envoi of [
      { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites: [] },
      { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites: [], essais: -1 },
      { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: 3, saisie: enSaisie(x.ecriture), faites: [], essais: 0 },
      { etape: "le-tri", geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites: [], essais: 0 },
    ]) {
      expect(corrigerAuBureau(e, envoi), JSON.stringify(envoi).slice(0, 120)).toEqual({ refus: "envoi" });
    }
  });

  it("l'action serveur contrôle l'accès à chaque geste, comme la page", async () => {
    const { corrigerALEnqueteAction } = await import("../../src/app/cours/enquete/actions");
    const envoi = { etape: "le-tri", geste: "montrer" };
    expect("geste" in (await corrigerALEnqueteAction(e.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerALEnqueteAction(e.code, envoi)).toEqual({ refus: "licence" });
    // Un bureau n'est pas une enquête : l'action des enquêtes ne le corrige pas.
    acces.ouvert = true;
    expect(await corrigerALEnqueteAction("rapprochement-de-mars", envoi)).toEqual({ refus: "bureau" });
  });
});

/**
 * L'ENQUÊTE DU CHAPITRE « LE DOSSIER DE RÉVISION », LOT B (novembre 2026) : le même contrat. Rien du
 * corrigé n'est servi ; le tri, chaque rectification (fausse raison, écriture de l'assistant repassée,
 * puis juste) et le résultat se jouent au serveur ; l'action contrôle l'accès.
 */
describe("la révision de l'assistant, servie et corrigée au serveur", async () => {
  const { LA_REVISION_DE_L_ASSISTANT: lot } = await import("../../src/config/cours/enquetes/la-revision-de-l-assistant");
  const triB = lot.etapes.find((x) => x.id === "le-tri") as EtapeDeClassement;
  const rectB = lot.etapes.find((x) => x.id === "les-rectifications") as EtapeDeRectification;
  const saisieDe = (id: string) => {
    const piece = lot.pile.find((p) => p.code === triB.elements.find((x) => x.code === id)!.piece)!;
    const texte = (x: number) => x.toFixed(2).replace(".", ",").replace(/,00$/, "");
    return piece.comptes!.map((l) => ({ compte: l.compte, debit: l.debit ? texte(l.debit) : "", credit: l.credit ? texte(l.credit) : "" }));
  };
  beforeEach(() => {
    acces.ouvert = true;
  });

  it("rien du corrigé n'est servi", () => {
    const t = espacesOrdinaires(JSON.stringify(servirLeBureau(lot)));
    for (const cle of ["categorie", "pourquoi", "retour", "calcul", "indice", "indices", "ecritures", "ecriture", "raison", "explication"]) expect(t, cle).not.toContain(`"${cle}":`);
    for (const x of rectB.ecritures) expect(t, x.pourquoi).not.toContain(espacesOrdinaires(x.pourquoi).slice(0, 40));
    expect(t).not.toContain("118 460");
  });

  it("le tri, puis chaque rectification : une fausse raison, l'écriture de l'assistant, puis la bonne", () => {
    const justes = Object.fromEntries(triB.elements.map((x) => [x.code, x.categorie]));
    expect(retour(corrigerAuBureau(lot, { etape: "le-tri", geste: "classer", choix: { ...justes, frais: "fausse" } }), "classer").fausses).toEqual(["frais"]);
    expect(retour(corrigerAuBureau(lot, { etape: "le-tri", geste: "classer", choix: justes }), "classer").juste).toBe(true);
    const juste = retour(corrigerAuBureau(lot, { etape: "les-rectifications", geste: "rectifier", ecriture: "frais", raison: "compte", saisie: saisieDe("frais"), faites: [], essais: 0 }), "rectifier");
    expect(juste.correction.remarques.join(" ")).toMatch(/juste/);
    const faites: string[] = [];
    for (const [i, x] of rectB.ecritures.entries()) {
      const autre = rectB.raisons.find((k) => k.code !== x.raison)!.code;
      const mauvaise = retour(corrigerAuBureau(lot, { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: autre, saisie: enSaisie(x.ecriture), faites, essais: 0 }), "rectifier");
      expect([mauvaise.juste, mauvaise.raison, mauvaise.passee]).toEqual([false, false, undefined]);
      const telle = retour(corrigerAuBureau(lot, { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: saisieDe(x.id), faites, essais: 1 }), "rectifier");
      expect([telle.juste, telle.raison, Boolean(telle.indice)]).toEqual([false, true, true]);
      const bonne = retour(corrigerAuBureau(lot, { etape: "les-rectifications", geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites, essais: 2 }), "rectifier");
      expect([bonne.juste, bonne.fini]).toEqual([true, i === rectB.ecritures.length - 1]);
      faites.push(x.id);
    }
    const g = lot.etapes.find((x) => x.id === "le-resultat")!;
    if (g.type !== "etat") throw new Error("le résultat");
    expect(retour(corrigerAuBureau(lot, { etape: "le-resultat", geste: "etat", saisies: solutionsDuTableau(g.grille) }), "etat").juste).toBe(true);
  });

  it("l'action serveur contrôle l'accès", async () => {
    const { corrigerALEnqueteAction } = await import("../../src/app/cours/enquete/actions");
    const envoi = { etape: "le-tri", geste: "montrer" };
    expect("geste" in (await corrigerALEnqueteAction(lot.code, envoi))).toBe(true);
    acces.ouvert = false;
    expect(await corrigerALEnqueteAction(lot.code, envoi)).toEqual({ refus: "licence" });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LES ENQUÊTES DU LOT C (novembre 2026) : les mêmes gardes, pour chacune (tests/helpers/activites-du-lot-c-servies.ts).
// ─────────────────────────────────────────────────────────────────────────────

describe.each([LE_DOSSIER_DES_IMMOBILISATIONS, LA_NOTE_DE_L_ANALYSTE])("l'enquête $code, servie et corrigée au serveur", (x) => {
  gardesDuBureauServi(x, async () => (await import("../../src/app/cours/enquete/actions")).corrigerALEnqueteAction, acces);
});
