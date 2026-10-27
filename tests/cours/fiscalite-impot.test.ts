import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import {
  CHIFFRE_D_AFFAIRES_MAXIMAL_DU_TAUX_REDUIT,
  ENTREPRISES_IMPOSABLES,
  L_IMPOT_SUR_LES_SOCIETES,
  PLAFOND_DU_TAUX_REDUIT,
  TAUX_REDUIT_DU_DROIT,
  TRIMESTRE_DE_L_ACOMPTE,
  impotDeLAnnee,
} from "../../src/config/cours/chapitres/l-impot-sur-les-societes";
import {
  ENTREPRISES_EN_DEFICIT,
  FACTEUR_DU_GRAND_ENTRETIEN,
  LE_DEFICIT_REPORTE,
  PART_MINIMALE_DU_DEFICIT,
  PLAFOND_DU_REPORT_EN_AVANT,
  TRIMESTRES_PAR_EXERCICE,
  deficitReporte,
  deuxExercices,
  deuxExercicesDuChapitre,
} from "../../src/config/cours/chapitres/le-deficit-reporte";
import {
  LA_DEPENSE_DE_FIN_D_ANNEE,
  TRIMESTRE_DE_LA_DEPENSE,
  anneeAvecLaDepense,
  depenseDeFinDAnnee,
} from "../../src/config/cours/situations/par-chapitre/la-depense-de-fin-d-annee";
import {
  LA_DEPENSE_DE_L_ANNEE_EN_PERTE,
  deuxExercicesAvecLaDepense,
  depenseDeLAnneeEnPerte,
} from "../../src/config/cours/situations/par-chapitre/la-depense-de-l-annee-en-perte";
import { anneeDeReference } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { CompanyRoundResult } from "../../src/engine/types";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * LA FISCALITÉ DE L'ENTREPRISE : L'IMPÔT SUR LES SOCIÉTÉS ET LE DÉFICIT REPORTÉ, ET LEURS CAS.
 *
 * « L'impôt sur les sociétés » lit l'année du cours (`anneeJouee`), « Le déficit reporté » la
 * rejoue sur deux exercices, avec un grand entretien au premier ; leurs cas rejouent l'une et l'autre avec la maintenance du dernier
 * trimestre doublée. Ces gardes refont les calculs à partir du moteur, par un autre chemin (les
 * montants exacts de chaque trimestre), vérifient que le moteur fait bien ce que les textes disent
 * qu'il fait (un seul taux, l'impôt du cumul de l'exercice, le déficit imputé avant l'impôt), que
 * les entreprises retenues sont celles où le calcul a un objet, que les verdicts se lisent dans
 * les chiffres, et que les textes se lisent.
 */

const pres = (a: number, b: number, ecart = 0.02) => expect(Math.abs(a - b), `${a} et ${b}`).toBeLessThanOrEqual(ecart);
const tauxDe = (code: string) => scenarioByCode(code).scenario.finance.taxRate;
const avantImpot = (r: CompanyRoundResult) => r.incomeStatement.pretaxIncome;
const somme = (tours: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => tours.reduce((t, r) => t + f(r), 0);
const anneeDuCours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [e.titre];
  }
}

const permises = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function textesPropres(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculin = new RegExp(`\\bun ${u}\\b|\\b${u}s? (vendu|fabriqué|produit|servi|jeté|retourné)s?\\b(?!e)`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins, et retranché, il va entre parenthèses ; jamais « −0 € ».
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −|−0 €/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        // L'élève tape au centime : une valeur attendue n'a pas plus de deux décimales.
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const o of options) for (const p of options) if (o !== p) expect(p.texte.includes(o.texte), `${e.id} : ${o.texte}`).toBe(false);
    }
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, dans l'ordre. */
function attendus(ch: Chapitre, id: string, cas: Cas): number[] {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${ch.code} / ${id} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
}

/** La bonne option d'une étape de choix. */
function juste(ch: Chapitre, id: string, cas: Cas): string {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${ch.code} / ${id} n'est pas une étape de choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
}

/** Ce qu'un cas dédié doit tenir, en plus de ses textes (tests/cours/situations.test.ts). */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.code).not.toBe(ch.code);
  expect(s.commanditaire.length).toBeGreaterThan(3);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const code of permises(s)) {
    const cas = casDeLEntreprise(code);
    for (const e of s.etapes) {
      if (e.type !== "choix") continue;
      const options = e.options(cas, { soldes: {} });
      expect(options.filter((o) => o.juste), `${s.code} / ${code}`).toHaveLength(1);
      const bonne = options.find((o) => o.juste)!;
      const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(bonne.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
    }
  }
}

describe("les deux chapitres et leur place au programme", () => {
  it("leurs titres sont ceux du programme de la fiscalité, au palier 3, et chaque bloc se résout mot pour mot", () => {
    for (const ch of [L_IMPOT_SUR_LES_SOCIETES, LE_DEFICIT_REPORTE]) {
      expect(PROGRAMME.fiscalite[3]).toContain(ch.titre);
      expect(ch.parcours).toBe("fiscalite");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual([
        "BTS CG P3 · Gestion des obligations fiscales",
        "DCG UE4 · Droit fiscal",
        "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
      ]);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b)!;
        expect(r, b).not.toBeNull();
        const officiel = b.replace(/^BUT GEA · /, "").replace(/^(BTS CG|DCG) /, "");
        expect(r.referentiel.entrees, b).toContain(officiel);
        expect(blocOfficiel(b, r.code), b).toBe(officiel);
      }
    }
    expect(["bts-cg", "dcg", "but-gea"]).toEqual(L_IMPOT_SUR_LES_SOCIETES.blocs.map((b) => referentielDeCitation(b)!.code));
  });

  it("l'impôt se calcule là où l'année du cours finit en bénéfice, et là seulement", () => {
    const imposables = ENTREPRISES_DU_COURS.filter((code) => somme(anneeDuCours(code), avantImpot) > 0);
    expect([...ENTREPRISES_IMPOSABLES]).toEqual(imposables);
    // Tenue par le bon gestionnaire, l'année du cours finit en bénéfice partout : le chapitre ne
    // restreint pas ses entreprises, et n'a aucune année en perte à nommer.
    expect(imposables).toEqual([...ENTREPRISES_DU_COURS]);
    expect(L_IMPOT_SUR_LES_SOCIETES.entreprises).toBeUndefined();
    for (const code of imposables) expect(somme(anneeDuCours(code), (r) => r.incomeStatement.tax), code).toBeGreaterThan(0);
  });

  it("le déficit reporté se joue là où le premier exercice perd et le suivant le rattrape, et là seulement", () => {
    const rattrapees = (rejeu: (code: string) => CompanyRoundResult[], part = 0) =>
      ENTREPRISES_DU_COURS.filter((code) => {
        const tours = rejeu(code);
        const premier = somme(tours.slice(0, TRIMESTRES_PAR_EXERCICE), avantImpot);
        const second = somme(tours.slice(TRIMESTRES_PAR_EXERCICE), avantImpot);
        return premier < 0 && second >= -premier && -premier >= part * second;
      });
    // Sans décision de plus, aucune année du cours ne perd pour être rattrapée, même d'un euro : d'où le grand entretien.
    expect(rattrapees(deuxExercices)).toEqual([]);
    // Le chapitre garde les déficits qui pèsent au moins la part nommée du résultat suivant.
    expect(PART_MINIMALE_DU_DEFICIT).toBe(0.1);
    expect([...ENTREPRISES_EN_DEFICIT]).toEqual(rattrapees(deuxExercicesDuChapitre, PART_MINIMALE_DU_DEFICIT));
    expect(LE_DEFICIT_REPORTE.entreprises!.pourquoi).toContain(`au moins ${(PART_MINIMALE_DU_DEFICIT * 100).toLocaleString("fr-FR")} % du résultat suivant`);
    expect(LE_DEFICIT_REPORTE.entreprises!.codes).toEqual(ENTREPRISES_EN_DEFICIT);
    // Le texte nomme les entreprises du chapitre, et celles dont l'année du cours perd sans le grand
    // entretien : aucune, l'année du cours finit en bénéfice partout, et le texte le dit.
    const perdantes = ENTREPRISES_DU_COURS.filter((x) => !(ENTREPRISES_IMPOSABLES as readonly string[]).includes(x));
    expect(perdantes).toEqual([]);
    expect(LE_DEFICIT_REPORTE.entreprises!.pourquoi).toContain("L'année du cours finit en bénéfice dans toutes les entreprises");
    for (const code of ENTREPRISES_DU_COURS) {
      const nomme = (ENTREPRISES_EN_DEFICIT as readonly string[]).includes(code) || perdantes.includes(code);
      expect(LE_DEFICIT_REPORTE.entreprises!.pourquoi.includes(casDeLEntreprise(code).entreprise), code).toBe(nomme);
    }
    expect(LE_DEFICIT_REPORTE.entreprises!.pourquoi).toContain(`multipliée par ${FACTEUR_DU_GRAND_ENTRETIEN}`);
    // Les deux chapitres ne lisent pas la même année : l'année du cours paie l'impôt, c'est le grand
    // entretien qui la fait perdre, et l'année perdue ne paie rien.
    for (const code of ENTREPRISES_EN_DEFICIT) {
      expect((ENTREPRISES_IMPOSABLES as readonly string[]).includes(code), code).toBe(true);
      expect(somme(anneeDuCours(code), (r) => r.incomeStatement.tax), code).toBeGreaterThan(0);
      pres(somme(deuxExercicesDuChapitre(code).slice(0, TRIMESTRES_PAR_EXERCICE), (r) => r.incomeStatement.tax), 0);
    }
  });

  it("le grand entretien ne change que la maintenance du premier exercice : mêmes ventes, et le second exercice joue la même activité", () => {
    for (const code of ENTREPRISES_EN_DEFICIT) {
      const sans = deuxExercices(code);
      const avec = deuxExercicesDuChapitre(code);
      const k = deficitReporte(casDeLEntreprise(code));
      const premier = (t: CompanyRoundResult[]) => t.slice(0, TRIMESTRES_PAR_EXERCICE);
      const second = (t: CompanyRoundResult[]) => t.slice(TRIMESTRES_PAR_EXERCICE);
      expect(avec.map((r) => r.incomeStatement.revenue), code).toEqual(sans.map((r) => r.incomeStatement.revenue));
      // Le budget joué à chaque trimestre : le facteur fois celui de l'année du cours au premier exercice
      // (pas un facteur qui se compose d'un trimestre à l'autre), celui de l'année du cours au second.
      for (const [i, r] of premier(avec).entries()) pres(r.incomeStatement.maintenanceCost, FACTEUR_DU_GRAND_ENTRETIEN * sans[i]!.incomeStatement.maintenanceCost, 1e-6);
      for (const [i, r] of second(avec).entries()) pres(r.incomeStatement.maintenanceCost, sans[TRIMESTRES_PAR_EXERCICE + i]!.incomeStatement.maintenanceCost, 1e-6);
      const maintenance = somme(premier(avec), (r) => r.incomeStatement.maintenanceCost) - somme(premier(sans), (r) => r.incomeStatement.maintenanceCost);
      pres(k.entretien, maintenance);
      pres(somme(premier(avec), (r) => r.incomeStatement.operatingIncome), somme(premier(sans), (r) => r.incomeStatement.operatingIncome) - maintenance);
      pres(somme(second(avec), (r) => r.incomeStatement.operatingIncome), somme(second(sans), (r) => r.incomeStatement.operatingIncome));
      pres(k.sansLEntretien.avantImpot, somme(anneeDuCours(code), avantImpot));
      pres(k.sansLEntretien.impot, somme(anneeDuCours(code), (r) => r.incomeStatement.tax));
    }
  });

  it("le cours lit l'année du cours : la même que celle du rejeu sans changement", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      expect(anneeDeReference(code).map(avantImpot), code).toEqual(anneeDuCours(code).map(avantImpot));
      // Et le premier des deux exercices rejoués est l'année du cours, trimestre pour trimestre.
      expect(deuxExercices(code).slice(0, TRIMESTRES_PAR_EXERCICE).map(avantImpot), code).toEqual(anneeDuCours(code).map(avantImpot));
      expect(deuxExercices(code)).toHaveLength(2 * TRIMESTRES_PAR_EXERCICE);
    }
  });
});

describe.each([...ENTREPRISES_IMPOSABLES])("l'impôt sur les sociétés chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const taux = tauxDe(code);
  const tours = anneeDuCours(code);

  it("le moteur applique un seul taux à l'impôt du cumul de l'exercice, acompte après acompte, et le paie dans le trimestre", () => {
    let cumul = 0;
    let du = 0;
    for (const r of tours) {
      cumul += avantImpot(r);
      const duApres = taux * Math.max(0, cumul);
      expect(Math.abs(r.incomeStatement.tax - (duApres - du)), code).toBeLessThan(1e-6);
      du = duApres;
      // L'acompte sort de la trésorerie le trimestre même : la ligne « impot » du flux.
      pres(somme([r], (x) => -x.cashFlow.items.filter((i) => i.label === "impot").reduce((s, i) => s + i.amount, 0)), r.incomeStatement.tax, 1e-6);
      // Le bilan ne porte aucune dette d'impôt.
      expect(Object.keys(r.balanceSheet).filter((k) => /tax|impot/i.test(k)), code).toEqual([]);
    }
    const k = impotDeLAnnee(cas);
    pres(k.avantImpot, cumul);
    pres(k.impot, taux * cumul);
    pres(k.impotDeLArene, somme(tours, (r) => r.incomeStatement.tax));
    pres(k.impotDecaisse, k.impotDeLArene);
    expect(k.taux).toBe(taux);
  });

  it("les champs demandent l'impôt de l'exercice, le résultat net et le taux effectif", () => {
    const k = impotDeLAnnee(cas);
    const [r, impot, net, effectif] = attendus(L_IMPOT_SUR_LES_SOCIETES, "impot-de-l-exercice", cas);
    pres(r!, somme(tours, avantImpot));
    pres(impot!, somme(tours, (x) => x.incomeStatement.tax));
    pres(net!, somme(tours, (x) => x.incomeStatement.netIncome));
    pres(effectif!, (impot! / r!) * 100, 0.005);
    // Un seul taux, rien de réintégré ni de déduit : le taux effectif est le taux du scénario.
    expect(effectif).toBe(taux * 100);
    expect(k.trimestres.map((t) => t.avantImpot)).toEqual(tours.map((x) => Math.round(avantImpot(x) * 100) / 100));
  });

  it("l'acompte du dernier trimestre est l'impôt de l'exercice moins l'impôt du cumul d'avant, celui que l'arène prélève", () => {
    const [cumul3, du3, acompte] = attendus(L_IMPOT_SUR_LES_SOCIETES, "acomptes", cas);
    const avant = tours.slice(0, TRIMESTRE_DE_L_ACOMPTE - 1);
    pres(cumul3!, somme(avant, avantImpot));
    pres(du3!, taux * Math.max(0, somme(avant, avantImpot)));
    pres(acompte!, tours[TRIMESTRE_DE_L_ACOMPTE - 1]!.incomeStatement.tax);
    pres(acompte!, impotDeLAnnee(cas).impot - du3!, 0.005);
  });

  it("un trimestre de perte qui fait rendre une part des acomptes : la question n'existe que là où l'arène rend", () => {
    const k = impotDeLAnnee(cas);
    const rend = tours.findIndex((r) => r.incomeStatement.tax < -0.005);
    const etapes = chapitreDuCas(L_IMPOT_SUR_LES_SOCIETES, cas).etapes.map((e) => e.id);
    expect(etapes.includes("trimestre-de-perte"), code).toBe(rend >= 0);
    if (rend >= 0) {
      expect(k.rendu!.trimestre).toBe(rend + 1);
      pres(-k.rendu!.acompte, -tours[rend]!.incomeStatement.tax);
      expect(tours[rend]!.incomeStatement.pretaxIncome).toBeLessThan(0);
    }
  });

  it("le taux réduit, en hypothèse : 15 % jusqu'au plafond, le taux du scénario au-delà", () => {
    const k = impotDeLAnnee(cas);
    const r = somme(tours, avantImpot);
    const attendu = TAUX_REDUIT_DU_DROIT * Math.min(r, PLAFOND_DU_TAUX_REDUIT) + taux * Math.max(0, r - PLAFOND_DU_TAUX_REDUIT);
    const [impot, effectif] = attendus(L_IMPOT_SUR_LES_SOCIETES, "taux-reduit", cas);
    pres(impot!, attendu);
    pres(effectif!, (attendu / r) * 100, 0.01);
    expect(effectif!).toBeLessThan(taux * 100);
    pres(k.economieDuTauxReduit, k.impot - impot!, 0.005);
    // Le texte dit que le chiffre d'affaires reste sous le plafond du taux réduit.
    expect(cas.annee.ventes).toBeLessThan(CHIFFRE_D_AFFAIRES_MAXIMAL_DU_TAUX_REDUIT);
  });

  it("au 31 décembre, rien ne reste dû : la bonne réponse le dit", () => {
    expect(juste(L_IMPOT_SUR_LES_SOCIETES, "au-31-decembre", cas)).toMatch(/^Rien :/);
  });

  it("le cas : la maintenance doublée au dernier trimestre, l'impôt économisé et ce que la dépense coûte", () => {
    const d = depenseDeFinDAnnee(cas);
    const avec = anneeAvecLaDepense(code);
    const i = TRIMESTRE_DE_LA_DEPENSE - 1;
    // Le moteur passe la dépense, et elle seule : le résultat avant impôt baisse de son montant.
    expect(d.depense).toBeGreaterThan(0);
    pres(d.maintenanceEnPlus, d.depense);
    pres(somme(avec, avantImpot), somme(tours, avantImpot) - d.depense);
    // Le budget joué à chaque trimestre : celui de l'année du cours, doublé au seul trimestre de la dépense.
    for (const [k, r] of avec.entries()) pres(r.incomeStatement.maintenanceCost, (k === i ? 2 : 1) * tours[k]!.incomeStatement.maintenanceCost, 1e-6);
    expect(avec.slice(0, i).map(avantImpot)).toEqual(tours.slice(0, i).map(avantImpot));
    pres(somme(avec, (r) => r.incomeStatement.revenue), somme(tours, (r) => r.incomeStatement.revenue));
    const r = somme(tours, avantImpot);
    const economie = taux * r - taux * Math.max(0, r - d.depense);
    expect(attendus(LA_DEPENSE_DE_FIN_D_ANNEE, "economie", cas).map((x) => Math.round(x))).toEqual(
      [r - d.depense, taux * Math.max(0, r - d.depense), economie, d.depense - economie].map((x) => Math.round(x)),
    );
    const [impotEnMoins, netEnMoins] = attendus(LA_DEPENSE_DE_FIN_D_ANNEE, "arene", cas);
    pres(impotEnMoins!, somme(tours, (x) => x.incomeStatement.tax) - somme(avec, (x) => x.incomeStatement.tax));
    pres(netEnMoins!, somme(tours, (x) => x.incomeStatement.netIncome) - somme(avec, (x) => x.incomeStatement.netIncome));
    pres(impotEnMoins!, economie);
    expect(d.verdict).toBe(r - d.depense >= 0 ? "le-taux-seulement" : "jusqu-a-l-impot");
  });

  it("chapitre et cas : des textes propres", () => {
    textesPropres(L_IMPOT_SUR_LES_SOCIETES, code);
    textesPropres(LA_DEPENSE_DE_FIN_D_ANNEE, code);
  });
});

describe.each([...ENTREPRISES_EN_DEFICIT])("le déficit reporté chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const taux = tauxDe(code);
  const tours = deuxExercicesDuChapitre(code);
  const premier = tours.slice(0, TRIMESTRES_PAR_EXERCICE);
  const second = tours.slice(TRIMESTRES_PAR_EXERCICE);

  it("le moteur impute le déficit de la clôture sur le cumul du second exercice, avant l'impôt", () => {
    const deficit = -somme(premier, avantImpot);
    expect(deficit).toBeGreaterThan(0);
    pres(somme(premier, (r) => r.incomeStatement.tax), 0);
    let cumul = 0;
    let du = 0;
    for (const r of second) {
      cumul += avantImpot(r);
      const duApres = taux * Math.max(0, cumul - deficit);
      expect(Math.abs(r.incomeStatement.tax - (duApres - du)), code).toBeLessThan(1e-6);
      du = duApres;
    }
    // Au premier trimestre, l'arène affiche le déficit imputé.
    pres(second[0]!.incomeStatement.taxLossUsed ?? 0, Math.min(deficit, Math.max(0, avantImpot(second[0]!))));
    const k = deficitReporte(cas);
    pres(k.deficit, deficit);
    pres(k.impot2, du);
    pres(k.impotDeLArene2, somme(second, (r) => r.incomeStatement.tax));
    // Le plafond du droit ne joue pas à cette échelle : le moteur peut l'omettre.
    expect(somme(second, avantImpot)).toBeLessThan(PLAFOND_DU_REPORT_EN_AVANT);
  });

  it("les champs demandent ces chiffres-là", () => {
    const deficit = -somme(premier, avantImpot);
    const r2 = somme(second, avantImpot);
    const [r1, impot1, d] = attendus(LE_DEFICIT_REPORTE, "deficit", cas);
    pres(r1!, -deficit);
    expect(impot1).toBe(0);
    pres(d!, deficit);
    const [avant2, imposable, impot2] = attendus(LE_DEFICIT_REPORTE, "exercice-suivant", cas);
    pres(avant2!, r2);
    pres(imposable!, r2 - deficit);
    pres(impot2!, taux * (r2 - deficit));
    const [acompte, reste] = attendus(LE_DEFICIT_REPORTE, "premier-acompte", cas);
    pres(acompte!, second[0]!.incomeStatement.tax);
    pres(reste!, Math.max(0, deficit - Math.max(0, avantImpot(second[0]!))));
    const [sans, evite, effectif] = attendus(LE_DEFICIT_REPORTE, "impot-evite", cas);
    pres(sans!, taux * r2);
    pres(evite!, taux * deficit);
    pres(effectif!, ((taux * (r2 - deficit)) / r2) * 100, 0.01);
    expect(effectif!).toBeLessThan(taux * 100);
    // Le déficit pèse : l'impôt évité fait au moins la part nommée de l'impôt sans report.
    expect(evite! / sans!).toBeGreaterThanOrEqual(PART_MINIMALE_DU_DEFICIT);
  });

  it("sur les deux exercices, l'impôt vaut le taux du résultat cumulé : la bonne réponse le dit", () => {
    const k = deficitReporte(cas);
    expect(k.verdict).toBe("l-impot-a-attendu");
    expect(k.reportFinal).toBe(0);
    pres(k.tauxSurDeux, taux * 100, 0.01);
    expect(juste(LE_DEFICIT_REPORTE, "deux-exercices", cas)).toMatch(/^Sur les deux exercices, l'impôt vaut/);
    expect(juste(LE_DEFICIT_REPORTE, "imputation", cas)).toMatch(/^Sur le bénéfice/);
  });

  it("le cas : une révision de plus l'année de la perte grossit le déficit, et l'impôt suivant baisse du taux de la dépense", () => {
    const d = depenseDeLAnneeEnPerte(cas);
    const avec = deuxExercicesAvecLaDepense(code);
    const k = deficitReporte(cas);
    expect(d.depense).toBeGreaterThan(0);
    pres(d.maintenanceEnPlus, d.depense);
    // Le premier exercice perd la dépense de plus, et elle seule.
    pres(-somme(avec.slice(0, TRIMESTRES_PAR_EXERCICE), avantImpot), k.deficit + d.depense);
    pres(d.arene.deficit, d.deficitAvec);
    // Le budget joué à chaque trimestre : celui du chapitre, plus la révision au seul trimestre de la dépense.
    for (const [k, r] of avec.entries()) pres(r.incomeStatement.maintenanceCost, tours[k]!.incomeStatement.maintenanceCost + (k === TRIMESTRES_PAR_EXERCICE - 1 ? d.depense : 0), 1e-6);
    // Le second exercice : l'activité ne change pas ; seules les charges financières peuvent bouger.
    const deuxieme = avec.slice(TRIMESTRES_PAR_EXERCICE);
    pres(somme(deuxieme, (r) => r.incomeStatement.operatingIncome), somme(second, (r) => r.incomeStatement.operatingIncome));
    pres(d.ecartDuSecondExercice, -(somme(deuxieme, (r) => r.incomeStatement.interest) - somme(second, (r) => r.incomeStatement.interest)) + (somme(deuxieme, (r) => r.incomeStatement.financialIncome ?? 0) - somme(second, (r) => r.incomeStatement.financialIncome ?? 0)));
    pres(d.arene.impot2, taux * Math.max(0, somme(deuxieme, avantImpot) - d.deficitAvec));
    pres(d.arene.impot2, somme(deuxieme, (r) => r.incomeStatement.tax));
    const [deficitAvec, impot2Avec, economie] = attendus(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, "deficit", cas);
    pres(deficitAvec!, k.deficit + d.depense);
    pres(impot2Avec!, taux * (k.avantImpot2 - k.deficit - d.depense));
    pres(economie!, taux * d.depense);
    expect(attendus(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, "arene", cas)).toEqual([d.impot2EnMoins, d.ecartDuSecondExercice]);
    pres(d.impot2EnMoins, k.impotDeLArene2 - somme(deuxieme, (r) => r.incomeStatement.tax));
    // « Faite l'an prochain, la même dépense aurait fait économiser autant » : le bénéfice imposable la couvre.
    expect(k.imposable2).toBeGreaterThanOrEqual(d.depense);
    expect(d.verdict).toBe("l-economie-attend");
    expect(juste(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, "reponse", cas)).toMatch(/^Attendre ne fait rien gagner/);
  });

  it("chapitre et cas : des textes propres", () => {
    textesPropres(LE_DEFICIT_REPORTE, code);
    textesPropres(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, code);
  });
});

describe("les verdicts varient avec l'entreprise", () => {
  it("le trimestre de perte ne se lit pas partout ; l'acompte, le cas de fin d'année et le taux réduit disent la même chose partout", () => {
    const cas = ENTREPRISES_IMPOSABLES.map((c) => casDeLEntreprise(c));
    // Un trimestre de perte qui fait rendre une part des acomptes : quelque part, et pas ailleurs.
    expect(cas.some((c) => impotDeLAnnee(c).rendu === null)).toBe(true);
    expect(cas.some((c) => impotDeLAnnee(c).rendu !== null)).toBe(true);
    // Tenue par le bon gestionnaire, l'année du cours a partout un cumul en bénéfice à la fin du
    // trimestre 3 : le dernier acompte vaut partout le taux du résultat du trimestre. Les branches
    // « l'arène rend » et « le cumul partait d'une perte » de l'explication ne se lisent plus.
    const auTaux = (c: Cas) => Math.abs(impotDeLAnnee(c).acompte.acompte - impotDeLAnnee(c).acompte.avantImpot * impotDeLAnnee(c).taux) < 1;
    expect(cas.every((c) => impotDeLAnnee(c).avant.cumul > 0 && impotDeLAnnee(c).acompte.acompte >= 0 && auTaux(c))).toBe(true);
    // Partout, l'année gagne plus que la dépense de fin d'année, et plus que le plafond du taux
    // réduit : le verdict « jusqu'à l'impôt » du cas et la branche « tout le bénéfice sous le
    // plafond » du chapitre ne se lisent plus.
    expect(new Set(cas.map((c) => depenseDeFinDAnnee(c).verdict))).toEqual(new Set(["le-taux-seulement"]));
    expect(new Set(cas.map((c) => impotDeLAnnee(c).reduit.normale > 0))).toEqual(new Set([true]));
  });

  it("les deux cas tiennent ce qu'un cas dédié doit tenir", () => {
    casDedie(LA_DEPENSE_DE_FIN_D_ANNEE, L_IMPOT_SUR_LES_SOCIETES);
    casDedie(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, LE_DEFICIT_REPORTE);
  });
});
