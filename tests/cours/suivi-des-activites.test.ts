import { describe, expect, it } from "vitest";
import { RAPPROCHEMENT_DE_MARS as b } from "../../src/config/cours/bureaux/rapprochement-de-mars";
import type { EtapeDeClassement, EtapeDEtat, EtapeDeReponse, EtapeDuJournal, EtapeDeRectification } from "../../src/config/cours/bureaux/types";
import { LA_CLOTURE_DU_STAGIAIRE as enquete } from "../../src/config/cours/enquetes/la-cloture-du-stagiaire";
import { LE_DECOUVERT_DE_NOVA as s } from "../../src/config/cours/scenarios/le-decouvert-de-nova";
import { corrigerAuBureau } from "../../src/pedagogy/cours/bureau-servi";
import { enSaisie } from "../../src/pedagogy/cours/correcteur";
import { corrigerAuScenario } from "../../src/pedagogy/cours/scenario-servi";
import {
  REMARQUE_MAX,
  REMARQUES_GARDEES_PAR_ETAPE,
  ajouterLesRemarques,
  suivreLeBureau,
  suivreLeScenario,
  vueDesActivites,
  type SuiviDActivite,
} from "../../src/pedagogy/cours/suivi-des-activites";
import { solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";

/**
 * LE SUIVI DES ACTIVITÉS, D'APRÈS LA CORRECTION DU SERVEUR (pedagogy/cours/suivi-des-activites.ts).
 *
 * Chaque geste passe d'abord par la vraie correction (bureau-servi.ts, scenario-servi.ts), puis par le
 * suivi, comme dans l'action serveur. Ce que le navigateur dit de lui-même (les écritures « faites »,
 * les questions « justes ») ne fait rien réussir : seules comptent les corrections justes du serveur.
 */

/** Un geste corrigé, puis suivi : ce que fait l'action serveur. */
const jouer = (avant: SuiviDActivite | null, envoi: unknown, bureau = b) => suivreLeBureau(bureau, avant, envoi, corrigerAuBureau(bureau, envoi));
const etape = <T>(id: string, bureau = b) => bureau.etapes.find((e) => e.id === id) as T;

const pile = etape<EtapeDeClassement>("la-pile");
const pointage = etape<EtapeDeClassement>("le-pointage");
const etat = etape<EtapeDEtat>("l-etat");
const journal = etape<EtapeDuJournal>("les-ecritures");
const reponse = etape<EtapeDeReponse>("la-reponse");

const classer = (e: EtapeDeClassement, juste = true) => ({
  etape: e.id,
  geste: "classer",
  choix: Object.fromEntries(e.elements.map((x) => [x.code, juste ? x.categorie : "pas-une-categorie"])),
});

describe("le suivi d'un bureau", () => {
  it("un essai manqué : en cours, un essai, et les remarques du correcteur sur ce qui est mal classé", () => {
    const apres = jouer(null, classer(pile, false))!;
    expect(apres.etat).toBe("en-cours");
    expect(apres.essais).toBe(1);
    expect(apres.etapes[pile.id]).toEqual({ essais: 1, manques: 1, reussi: false, aide: false });
    expect(apres.erreurs[pile.id]).toHaveLength(pile.elements.length);
    expect(apres.erreurs[pile.id]![0]).toBe(`Mal classé : ${pile.elements[0]!.libelle}.`);
  });

  it("toutes les étapes réussies au serveur : réussi ; les essais comptent chaque geste corrigé", () => {
    let t = jouer(null, classer(pile, false));
    t = jouer(t, classer(pile));
    t = jouer(t, classer(pointage));
    t = jouer(t, { etape: etat.id, geste: "etat", saisies: solutionsDuTableau(etat.grille) });
    const faites: string[] = [];
    for (const x of journal.ecritures) {
      t = jouer(t, { etape: journal.id, geste: "ecriture", saisie: enSaisie(x.ecriture), faites: [...faites] });
      faites.push(x.id);
    }
    expect(t!.etat).toBe("en-cours");
    const justes: string[] = [];
    for (const q of reponse.questions) {
      t = jouer(t, { etape: reponse.id, geste: "repondre", question: q.id, option: q.options.find((o) => o.juste)!.texte, justes: [...justes] });
      justes.push(q.id);
    }
    expect(t!.etat).toBe("reussi");
    expect(t!.essais).toBe(4 + journal.ecritures.length + reponse.questions.length);
    expect(t!.etapes[journal.id]!.faites!.sort()).toEqual(journal.ecritures.map((x) => x.id).sort());
    expect(Object.keys(t!.erreurs)).toEqual([pile.id]);
  });

  it("des écritures « faites » envoyées par le navigateur ne font pas réussir l'étape", () => {
    const [premiere, ...autres] = journal.ecritures;
    const envoi = { etape: journal.id, geste: "ecriture", saisie: enSaisie(premiere!.ecriture), faites: autres.map((x) => x.id) };
    const retour = corrigerAuBureau(b, envoi);
    // Le retour, lui, croit l'étape finie : il se fie à la liste du navigateur.
    expect("fini" in retour && retour.fini).toBe(true);
    const t = suivreLeBureau(b, null, envoi, retour)!;
    expect(t.etapes[journal.id]).toMatchObject({ reussi: false, faites: [premiere!.id] });
    // De même des questions « justes » : la réponse juste à une seule ne fait pas réussir l'étape.
    const [q, ...reste] = reponse.questions;
    const r = jouer(null, { etape: reponse.id, geste: "repondre", question: q!.id, option: q!.options.find((o) => o.juste)!.texte, justes: reste.map((x) => x.id) })!;
    if (reste.length > 0) expect(r.etapes[reponse.id]!.reussi).toBe(false);
  });

  it("une écriture déjà passée, repassée : rien à noter ; un envoi refusé, non plus", () => {
    const x = journal.ecritures[0]!;
    expect(jouer(null, { etape: journal.id, geste: "ecriture", saisie: enSaisie(x.ecriture), faites: [x.id] })).toBeNull();
    expect(jouer(null, { etape: "inconnue", geste: "montrer" })).toBeNull();
    expect(jouer(null, { geste: "classer" })).toBeNull();
  });

  it("la correction demandée : l'étape passée avec la correction, sans essai de plus ; toutes ainsi : terminé, pas réussi", () => {
    let t: SuiviDActivite | null = null;
    for (const e of b.etapes) t = jouer(t, { etape: e.id, geste: "montrer" });
    expect(t!.etat).toBe("termine");
    expect(t!.essais).toBe(0);
    expect(Object.values(t!.etapes).every((e) => e.reussi && e.aide)).toBe(true);
    // La correction demandée après une étape réussie ne la change pas.
    const r = jouer(jouer(null, classer(pile)), { etape: pile.id, geste: "montrer" })!;
    expect(r.etapes[pile.id]).toMatchObject({ reussi: true, aide: false });
  });

  it("l'enquête : une rectification manquée note la raison fausse et les remarques de l'écriture", () => {
    const rect = etape<EtapeDeRectification>("les-rectifications", enquete);
    const x = rect.ecritures[0]!;
    const fausse = rect.raisons.find((r) => r.code !== x.raison)!;
    const t = jouer(null, { etape: rect.id, geste: "rectifier", ecriture: x.id, raison: fausse.code, saisie: enSaisie(x.ecriture), faites: [], essais: 0 }, enquete)!;
    expect(t.etapes[rect.id]).toMatchObject({ essais: 1, manques: 1, reussi: false });
    expect(t.erreurs[rect.id]).toContain("La raison choisie n'est pas celle de l'erreur.");
    const juste = jouer(t, { etape: rect.id, geste: "rectifier", ecriture: x.id, raison: x.raison, saisie: enSaisie(x.ecriture), faites: [], essais: 1 }, enquete)!;
    expect(juste.etapes[rect.id]!.faites).toEqual([x.id]);
  });
});

describe("les bornes", () => {
  it("une remarque coupée, les vides écartées, les dernières gardées par étape", () => {
    let e: Record<string, string[]> = {};
    e = ajouterLesRemarques(e, "x", ["y".repeat(1000), "   ", ""]);
    expect(e.x).toEqual(["y".repeat(REMARQUE_MAX)]);
    for (let i = 0; i < 100; i += 1) e = ajouterLesRemarques(e, "x", [`r${i}`]);
    expect(e.x).toHaveLength(REMARQUES_GARDEES_PAR_ETAPE);
    expect(e.x!.at(-1)).toBe("r99");
  });

  it("cent essais manqués d'un bureau ne gardent que les dernières remarques de l'étape", () => {
    let t: SuiviDActivite | null = null;
    for (let i = 0; i < 100; i += 1) t = jouer(t, classer(pile, false));
    expect(t!.essais).toBe(100);
    expect(t!.erreurs[pile.id]).toHaveLength(REMARQUES_GARDEES_PAR_ETAPE);
  });
});

describe("le suivi d'un scénario", () => {
  const suites = s.decisions.reduce<string[][]>((acc, d) => acc.flatMap((a) => d.options.map((o) => [...a, o])), [[]]);
  const meilleure = suites.find((x) => s.bilan(x).meilleure)!;
  const autre = suites.find((x) => !s.bilan(x).meilleure)!;
  const partie = (avant: SuiviDActivite | null, suite: readonly string[]) => {
    let t = avant;
    for (let i = 1; i <= suite.length; i += 1) {
      const envoi = { geste: "choisir", suite: suite.slice(0, i) };
      t = suivreLeScenario(s, t, envoi, corrigerAuScenario(s, envoi));
    }
    return t!;
  };

  it("une partie commencée : en cours, une partie ; finie : la fin et si c'est la meilleure suite", () => {
    const envoi = { geste: "choisir", suite: [autre[0]!] };
    const t = suivreLeScenario(s, null, envoi, corrigerAuScenario(s, envoi))!;
    expect(t).toMatchObject({ etat: "en-cours", essais: 1, fin: null });
    const fini = partie(null, autre);
    expect(fini).toMatchObject({ etat: "fini", essais: 1, fin: s.bilan(autre).fin.titre, meilleure: false });
  });

  it("la meilleure suite atteinte reste, même après une autre partie", () => {
    const deux = partie(partie(null, meilleure), autre);
    expect(deux).toMatchObject({ essais: 2, etat: "fini", fin: s.bilan(meilleure).fin.titre, meilleure: true });
  });

  it("les questions se suivent comme une étape, sans compter une partie", () => {
    const q = s.questions.questions[0]!;
    const fausse = q.options.find((o) => !o.juste)!;
    const envoi = { etape: s.questions.id, geste: "repondre", question: q.id, option: fausse.texte, justes: [] };
    const t = suivreLeScenario(s, partie(null, autre), envoi, corrigerAuScenario(s, envoi))!;
    expect(t.essais).toBe(1);
    expect(t.etapes[s.questions.id]).toMatchObject({ manques: 1, reussi: false });
    expect(t.erreurs[s.questions.id]![0]).toContain(q.question);
  });
});

describe("la vue de l'enseignant", () => {
  it("un élève sans suivi n'a pas commencé ; les remarques fréquentes comptent les élèves", () => {
    const t = jouer(null, classer(pile, false))!;
    const vue = vueDesActivites(
      [{ nature: "bureau", code: b.code, titre: b.titre, etapes: b.etapes.map((e) => ({ id: e.id, titre: e.titre })) }],
      [
        { userId: "a", nom: "Léa" },
        { userId: "b", nom: "Yanis" },
        { userId: "c", nom: "Sami" },
      ],
      [
        { ...t, userId: "a", nature: "bureau", code: b.code, majLe: new Date() },
        { ...t, userId: "b", nature: "bureau", code: b.code, majLe: new Date() },
        // Une autre activité ne se mélange pas à celle-ci.
        { ...t, userId: "c", nature: "enquete", code: b.code, majLe: new Date() },
      ],
    )[0]!;
    expect(vue.eleves.map((l) => l.etat)).toEqual(["en-cours", "en-cours", "non-commence"]);
    expect(vue.compte).toMatchObject({ "en-cours": 2, "non-commence": 1 });
    expect(vue.frequentes).toHaveLength(5);
    expect(vue.frequentes.every((r) => r.eleves === 2 && t.erreurs[pile.id]!.includes(r.texte))).toBe(true);
    expect(vue.eleves[0]!.erreurs[0]!.etape).toBe(pile.titre);
  });
});
