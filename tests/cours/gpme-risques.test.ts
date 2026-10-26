import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../../src/config/cours/gestion-de-la-pme";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import {
  LE_COUT_DE_LA_NON_QUALITE,
  NIVEAUX_DE_PREVENTION,
  QUALITES,
  demarchesContreLesDefauts,
  nonQualite,
} from "../../src/config/cours/chapitres/le-cout-de-la-non-qualite";
import {
  S_ASSURER_CONTRE_LES_ALEAS,
  assurance,
  formulesDe,
  poser,
  resultatDeLActivite,
} from "../../src/config/cours/chapitres/s-assurer-contre-les-aleas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { HAUSSE_DE_LA_PRIME, L_ASSUREUR_AUGMENTE_LA_PRIME, primeAugmentee } from "../../src/config/cours/situations/par-chapitre/l-assureur-augmente-la-prime";
import { HORIZON_DU_GERANT_EN_ANNEES, UNE_SEULE_DEMARCHE_QUALITE, deuxDemarches } from "../../src/config/cours/situations/par-chapitre/une-seule-demarche-qualite";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE LA GESTION DES RISQUES DU BTS GPME, ET LEURS CAS PRATIQUES.
 *
 * « S'assurer contre les aléas » et « Le coût de la non-qualité » rejouent l'année du cours avec
 * une décision changée (gestion-de-la-pme.ts). Ces gardes recomposent leurs chiffres avec le
 * moteur, rejoué ici par un autre chemin, dans chaque entreprise où ils se jouent, et vérifient
 * que leurs textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, une seule
 * bonne réponse, des libellés uniques, et pour un cas, une bonne réponse qui ne se devine pas à
 * sa longueur.
 */

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins, et retranché, il va entre parenthèses
      // (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −/);
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
      // L'élève saisit par le libellé : deux champs d'une étape ne se ressemblent pas.
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      // L'élève coche par le texte : aucun n'en contient un autre.
      for (const o of options) for (const p of options) if (o !== p) expect(p.texte.includes(o.texte), `${e.id} : ${o.texte}`).toBe(false);
    }
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, dans l'ordre. */
function attendus(ch: Chapitre, id: string, cas: Cas): number[] {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${ch.code} / ${id} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
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
      const juste = options.find((o) => o.juste)!;
      const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(juste.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
    }
  }
}

describe("les deux chapitres et leur place au programme", () => {
  it("leurs titres sont ceux du programme du BTS GPME, au palier 3, avec le bloc des risques", () => {
    for (const ch of [S_ASSURER_CONTRE_LES_ALEAS, LE_COUT_DE_LA_NON_QUALITE]) {
      expect(PROGRAMME.gpme[3]).toContain(ch.titre);
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"]);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b)!;
        expect(r.code).toBe("bts-gpme");
        expect(r.referentiel.entrees).toContain(b.replace(/^BTS GPME /, ""));
      }
    }
    expect(S_ASSURER_CONTRE_LES_ALEAS.entreprises).toBeUndefined();
  });

  it("le coût de la non-qualité se joue là où le moteur chiffre la non-qualité, et là seulement", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const chiffree = scenarioByCode(code).scenario.qualityCosts !== undefined;
      expect((QUALITES as readonly string[]).includes(code), code).toBe(chiffree);
      // Ailleurs, le moteur ne rend aucun coût de la qualité : le chapitre n'aurait rien à lire.
      if (!chiffree) expect(anneeDeReference(code).every((r) => r.qualityCosts === undefined), code).toBe(true);
    }
    expect(LE_COUT_DE_LA_NON_QUALITE.entreprises!.codes).toEqual(QUALITES);
  });
});

describe.each(ENTREPRISES_DU_COURS)("s'assurer contre les aléas chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;

  it("la formule est la moins chère qui couvre l'aléa le plus probable, et ses aléas pèsent sur le résultat de l'activité", () => {
    const a = assurance(cas);
    const formules = formulesDe(code);
    const tirables = s.events.filter((e) => e.probability > 0 && formules.some((f) => f.coveredEventCodes.includes(e.code)));
    const plusHaute = Math.max(...tirables.map((e) => e.probability));
    expect(a.aleaLePlusProbable.probabilite).toBe(plusHaute);
    const formule = formules.find((f) => f.code === a.formule.code)!;
    const candidates = formules.filter((f) => tirables.some((e) => e.probability === plusHaute && f.coveredEventCodes.includes(e.code)));
    expect(formule.premiumPerRound).toBe(Math.min(...candidates.map((f) => f.premiumPerRound)));
    // Les aléas couverts jouent sur la capacité et le coût des matières : le résultat de
    // l'activité dit tout ce qu'ils coûtent (ni intérêts, ni charge exceptionnelle).
    for (const e of s.events.filter((x) => formule.coveredEventCodes.includes(x.code))) {
      for (const m of e.modifiers) expect(["availability", "material_cost"], e.code).toContain(m.target);
    }
    expect(a.aleas.map((x) => x.code).sort()).toEqual([...formule.coveredEventCodes].sort());
    for (const x of a.aleas) expect(x.nom, x.code).not.toMatch(/_|[—–]/);
    expect(a.entreprisesDeLArene).toBe(3);
  });

  it("l'année assurée coûte sa prime, telle que le moteur la prélève", () => {
    const a = assurance(cas);
    const assuree = rejouerAvec(code, `garde-assurance-${a.formule.code}`, (_t, d) => ({ ...d, insurance: a.formule.code }));
    expect(assuree.map((r) => r.insurance?.premium)).toEqual(assuree.map(() => a.formule.prime));
    expect(a.primeDeLAnnee).toBe(a.formule.prime * a.trimestres);
    expect(a.trimestres).toBe(4);
    expect(a.resultatSans).toBe(resultatDeLActivite(anneeDeReference(code)));
    expect(a.resultatAssure).toBe(resultatDeLActivite(assuree));
    expect(a.ecartDeResultat).toBe(a.resultatAssure - a.resultatSans);
    expect(a.trimestresNeutralises).toBe(surLAnnee(assuree, (r) => r.insurance?.neutralizedEvents.length ?? 0));
    // Avec la graine du cours, aucun aléa couvert ne tombe : l'assurance coûte sa prime, et rien d'autre.
    expect(a.trimestresNeutralises).toBe(0);
    expect(a.ecartDeResultat).toBe(-a.primeDeLAnnee);
    expect(anneeDeReference(code).every((r) => !r.insurance), "la gestion équilibrée ne s'assure pas").toBe(true);
  });

  it("l'espérance est la somme des probabilités × trimestres × part × coût moyen, chaque coût rejoué par le moteur", () => {
    const a = assurance(cas);
    let esperance = 0;
    for (const x of a.tirables) {
      const e = s.events.find((d) => d.code === x.code)!;
      expect(x.trimestres).toBe(4 - (e.minRound ?? 1) + 1);
      expect(x.part).toBe(e.scope === "company" ? 1 / 3 : 1);
      // Le coût rejoué ici sous une autre clé : le même moteur, la même année.
      const couts = x.couts.map(({ trimestre }) => a.resultatSans - resultatDeLActivite(rejouerAvec(code, `garde-${x.code}-${trimestre}`, () => undefined, poser(e, trimestre))));
      expect(x.couts.map((k) => k.cout)).toEqual(couts);
      expect(x.coutMoyen).toBe(Math.round(couts.reduce((t, k) => t + k, 0) / couts.length));
      esperance += e.probability * x.trimestres * x.part * x.coutMoyen;
    }
    expect(Math.abs(a.esperance - esperance)).toBeLessThanOrEqual(0.5);
    expect(a.cartes).toBe(a.aleas.filter((x) => x.probabilite === 0).length);
  });

  it("le sinistre le plus lourd : son coût sans assurance, et assuré, la prime seule", () => {
    const a = assurance(cas);
    expect(a.pire.cout).toBe(Math.max(...a.aleas.flatMap((x) => x.couts.map((k) => k.cout))));
    expect(a.pire.cout).toBe(a.resultatSans - a.pire.resultatAvec);
    expect(a.pire.cout).toBeGreaterThan(0);
    // Le moteur efface l'aléa couvert chez l'assuré : il ne reste que la prime.
    expect(a.pire.resteACharge).toBe(a.primeDeLAnnee);
    const def = s.events.find((d) => d.code === a.pire.code)!;
    expect(a.pire.trimestresNeutralises).toBe(Math.min(def.duration, 4 - a.pire.trimestre + 1));
    // Poser l'aléa ne déplace pas le hasard : sans lui, l'année assurée est la même.
    expect(a.pire.resultatAssure).toBe(a.resultatAssure);
  });

  it("les champs du chapitre demandent ces chiffres-là", () => {
    const a = assurance(cas);
    expect(attendus(S_ASSURER_CONTRE_LES_ALEAS, "annee-assuree", cas)).toEqual([a.formule.prime * 4, a.resultatAssure - a.resultatSans]);
    expect(attendus(S_ASSURER_CONTRE_LES_ALEAS, "esperance", cas)).toEqual([a.esperance]);
    expect(attendus(S_ASSURER_CONTRE_LES_ALEAS, "pire", cas)).toEqual([a.resultatSans - a.pire.resultatAvec, a.resultatSans - a.pire.resultatAssure]);
  });

  it("le conseil suit l'espérance, puis la gravité", () => {
    const a = assurance(cas);
    expect(a.verdict).toBe(a.esperance > a.primeDeLAnnee ? "rapporte" : a.pire.cout > a.primeDeLAnnee ? "gravite" : "garder");
    expect(a.esperance).toBeLessThan(a.primeDeLAnnee);
  });

  it("le cas : la prime augmentée, ce que l'arène en fait, et la prime au-delà de laquelle garder le risque", () => {
    const p = primeAugmentee(cas);
    expect(p.nouvellePrime).toBeCloseTo(p.a.formule.prime * (1 + HAUSSE_DE_LA_PRIME), 2);
    expect(p.nouvellePrimeDeLAnnee).toBeCloseTo(p.nouvellePrime * 4, 2);
    expect(p.primePayee).toBeCloseTo(p.nouvellePrimeDeLAnnee, 2);
    expect(p.hausseDeLAnnee).toBeCloseTo(p.nouvellePrimeDeLAnnee - p.a.primeDeLAnnee, 2);
    expect(p.ecartAvecLaHausse).toBe(p.resultatAugmente - p.a.resultatSans);
    expect(p.coutDeLaHausse).toBe(p.resultatAugmente - p.a.resultatAssure);
    expect(-p.coutDeLaHausse).toBeCloseTo(p.hausseDeLAnnee, 0);
    expect(p.primeMaximale * 4).toBeCloseTo(p.a.pire.cout, 1);
    expect(p.verdict).toBe(p.a.pire.cout > p.nouvellePrimeDeLAnnee ? "renouveler" : "garder");
    const nouvelle = Math.round(p.a.formule.prime * (1 + HAUSSE_DE_LA_PRIME) * 100) / 100;
    expect(attendus(L_ASSUREUR_AUGMENTE_LA_PRIME, "prime", cas)).toEqual([nouvelle, nouvelle * 4, nouvelle * 4 - p.a.primeDeLAnnee]);
    expect(attendus(L_ASSUREUR_AUGMENTE_LA_PRIME, "arene", cas)).toEqual([p.resultatAugmente - p.a.resultatSans, p.resultatAugmente - p.a.resultatAssure]);
    expect(attendus(L_ASSUREUR_AUGMENTE_LA_PRIME, "plafond", cas)).toEqual([Math.round((p.a.pire.cout / 4) * 100) / 100]);
  });

  it("chapitre et cas : des textes propres", () => {
    textesPropres(S_ASSURER_CONTRE_LES_ALEAS, code);
    textesPropres(L_ASSUREUR_AUGMENTE_LA_PRIME, code);
  });
});

describe("les conseils du chapitre et du cas varient avec l'entreprise", () => {
  it("s'assurer contre la gravité ici, garder le risque là", () => {
    const verdicts = new Set(ENTREPRISES_DU_COURS.map((c) => assurance(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["garder", "gravite"]);
    const cas = new Set(ENTREPRISES_DU_COURS.map((c) => primeAugmentee(casDeLEntreprise(c)).verdict));
    expect([...cas].sort()).toEqual(["garder", "renouveler"]);
  });

  it("le cas d'assurance tient ce qu'un cas dédié doit tenir", () => {
    casDedie(L_ASSUREUR_AUGMENTE_LA_PRIME, S_ASSURER_CONTRE_LES_ALEAS);
  });

  it("le cas de la non-qualité tient ce qu'un cas dédié doit tenir", () => {
    casDedie(UNE_SEULE_DEMARCHE_QUALITE, LE_COUT_DE_LA_NON_QUALITE);
  });
});

describe.each([...QUALITES])("le coût de la non-qualité chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("les coûts de l'année sont ceux que le moteur rend, et se recomposent", () => {
    const q = nonQualite(cas);
    const ref = anneeDeReference(code);
    expect(q.annee.prevention).toBe(Math.round(surLAnnee(ref, (r) => r.qualityCosts!.prevention)));
    expect(q.annee.interne).toBe(Math.round(surLAnnee(ref, (r) => r.qualityCosts!.internalFailure)));
    expect(q.annee.externe).toBe(Math.round(surLAnnee(ref, (r) => r.qualityCosts!.externalFailure)));
    expect(q.annee.nonQualite).toBe(q.annee.interne + q.annee.externe);
    expect(q.annee.total).toBe(q.annee.prevention + q.annee.nonQualite);
    // La prévention est le budget qualité décidé, au compte de résultat comme dans les coûts de la qualité.
    expect(q.annee.prevention).toBe(Math.round(surLAnnee(ref, (r) => r.incomeStatement.qualityCost)));
    expect(q.budgetDuTrimestre * 4).toBe(q.annee.prevention);
    expect(q.annee.interne).toBeGreaterThan(0);
  });

  it("les quatre budgets rejoués : la prévention suit le budget, les rebuts baissent quand elle monte", () => {
    const q = nonQualite(cas);
    expect(q.niveaux.map((n) => n.part)).toEqual(NIVEAUX_DE_PREVENTION.map((n) => n.part));
    for (const n of q.niveaux) {
      const a = rejouerAvec(code, `garde-prevention-${n.part}`, (_t, d) => ({ ...d, qualityBudget: (d.qualityBudget ?? 0) * n.part }));
      expect(n.prevention).toBe(Math.round(q.annee.prevention * n.part));
      expect(n.interne).toBe(Math.round(surLAnnee(a, (r) => r.qualityCosts!.internalFailure)));
      expect(n.externe).toBe(Math.round(surLAnnee(a, (r) => r.qualityCosts!.externalFailure)));
      expect(n.total).toBe(n.prevention + n.interne + n.externe);
      expect(n.ventes).toBe(Math.round(surLAnnee(a, soldUnits)));
      expect(n.resultat).toBe(Math.round(surLAnnee(a, (r) => r.incomeStatement.operatingIncome)));
    }
    for (let i = 1; i < q.niveaux.length; i++) {
      expect(q.niveaux[i]!.interne).toBeLessThan(q.niveaux[i - 1]!.interne);
      expect(q.niveaux[i]!.ventes).toBeGreaterThanOrEqual(q.niveaux[i - 1]!.ventes);
    }
    expect(q.niveaux[q.actuel]!.total).toBe(q.annee.total);
    expect(q.evitees).toBe(q.niveaux[q.actuel]!.nonQualite - q.niveaux[q.double]!.nonQualite);
    expect(q.ajoutee).toBe(q.niveaux[q.double]!.prevention - q.niveaux[q.actuel]!.prevention);
    expect(q.eviteesPour100).toBeCloseTo((q.evitees / q.ajoutee) * 100, 2);
    // Un seul budget le moins cher, un seul meilleur résultat : les questions ont une réponse.
    const totaux = q.niveaux.map((n) => n.total);
    expect(totaux.filter((t) => t === Math.min(...totaux))).toHaveLength(1);
    expect(q.niveaux[q.leMoinsCher]!.total).toBe(Math.min(...totaux));
    const resultats = q.niveaux.map((n) => n.resultat);
    expect(resultats.filter((t) => t === Math.max(...resultats))).toHaveLength(1);
    expect(q.niveaux[q.leMeilleur]!.resultat).toBe(Math.max(...resultats));
    expect(q.leMeilleur).toBeGreaterThanOrEqual(q.leMoinsCher);
  });

  it("la démarche : son coût, ce qu'elle évite et économise, son délai de récupération", () => {
    const q = nonQualite(cas);
    const d = q.demarche;
    const action = demarchesContreLesDefauts(code)[0]!;
    const niveau = action.levels.find((l) => l.level === 1)!;
    expect(d.code).toBe(action.code);
    expect(d.cout).toBe(niveau.cost);
    const avec = rejouerAvec(code, `garde-demarche-${action.code}`, (t, x) => (t === 1 ? { ...x, qualityActions: [{ actionCode: action.code, level: 1 }] } : undefined));
    // Le coût est la charge exceptionnelle que le moteur passe, au premier trimestre seulement.
    expect(surLAnnee(avec, (r) => r.incomeStatement.exceptionalCharge ?? 0)).toBe(niveau.cost);
    const nq = (a: typeof avec) => Math.round(surLAnnee(a, (r) => r.qualityCosts!.internalFailure)) + Math.round(surLAnnee(a, (r) => r.qualityCosts!.externalFailure));
    expect(d.nonQualiteSans).toBe(nq(anneeDeReference(code)));
    expect(d.nonQualiteAvec).toBe(nq(avec));
    expect(d.economies).toBe(d.economiesAvec - d.economiesSans);
    expect(d.economies).toBeGreaterThan(0);
    expect(d.gain).toBe(d.nonQualiteSans - d.nonQualiteAvec + d.economies);
    expect(d.delai).toBeCloseTo(d.cout / d.gain, 1);
    expect(niveau.effects.qualityImageBonus ?? 0).toBe(0);
  });

  it("les champs du chapitre demandent ces chiffres-là", () => {
    const q = nonQualite(cas);
    const [aucun, , actuel, double] = q.niveaux;
    expect(attendus(LE_COUT_DE_LA_NON_QUALITE, "cout-total", cas)).toEqual([q.annee.interne + q.annee.externe, q.annee.prevention + q.annee.interne + q.annee.externe]);
    expect(attendus(LE_COUT_DE_LA_NON_QUALITE, "quatre-budgets", cas)).toEqual([
      aucun!.prevention + aucun!.interne + aucun!.externe,
      double!.prevention + double!.interne + double!.externe,
      Math.round(((actuel!.nonQualite - double!.nonQualite) / (double!.prevention - actuel!.prevention)) * 100 * 100) / 100,
    ]);
    const d = q.demarche;
    expect(attendus(LE_COUT_DE_LA_NON_QUALITE, "demarche", cas)).toEqual([d.nonQualiteSans - d.nonQualiteAvec + d.economiesAvec - d.economiesSans, Math.round((d.cout / d.gain) * 10) / 10]);
  });

  it("le cas : deux démarches contre les défauts, jouées chacune seule, et la plus rapide à se rembourser", () => {
    const r = deuxDemarches(cas);
    expect(r.premiere.code).not.toBe(r.deuxieme.code);
    expect(r.premiere.gain).toBe(nonQualite(cas).demarche.gain);
    for (const d of [r.premiere, r.deuxieme]) {
      expect(d.gain).toBeGreaterThan(0);
      expect(d.delai).toBeCloseTo(d.cout / d.gain, 1);
    }
    const plusCourt = Math.min(r.premiere.delai!, r.deuxieme.delai!);
    expect(r.verdict).toBe(plusCourt > HORIZON_DU_GERANT_EN_ANNEES ? "aucune" : r.premiere.delai! <= r.deuxieme.delai! ? "premiere" : "deuxieme");
    expect(attendus(UNE_SEULE_DEMARCHE_QUALITE, "gains", cas)).toEqual([r.premiere.gain, r.deuxieme.gain]);
    expect(attendus(UNE_SEULE_DEMARCHE_QUALITE, "delais", cas)).toEqual([r.premiere, r.deuxieme].map((d) => Math.round((d.cout / d.gain) * 10) / 10));
  });

  it("chapitre et cas : des textes propres", () => {
    textesPropres(LE_COUT_DE_LA_NON_QUALITE, code);
    textesPropres(UNE_SEULE_DEMARCHE_QUALITE, code);
  });
});
