import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BAISSE_DE_PRIX_DU_COMMERCIAL,
  COUPE_DU_FINANCIER,
  DECIDER_ENSEMBLE,
  ENTREPRISES_DE_LA_DECISION,
  HAUSSE_DE_PUBLICITE_DU_COMMERCIAL,
  anneeDecidee,
  decisionsDeLAnneeDuCours,
  troisFacons,
} from "../../src/config/cours/chapitres/decider-ensemble";
import { anneeDeReference } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { CHACUN_SON_LEVIER, anneeDuPartage, chacunSonLevier } from "../../src/config/cours/situations/par-chapitre/chacun-son-levier";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE MANAGEMENT (BAC STMG) : LES ACTEURS ET LE PARTAGE DE LA VALEUR, DÉCIDER
 * ENSEMBLE ; ET LEURS CAS PRATIQUES.
 *
 * Les acteurs : ce que chacun reçoit dans l'année du cours, puis une hausse des salaires rejouée.
 * Décider ensemble : l'année rejouée par le commercial seul, par le financier seul, et celle de
 * l'équipe. Ces gardes recomposent les chiffres avec le moteur, par un autre chemin que les
 * chapitres (les achats et services par l'égalité du compte de résultat, les prix joués par les
 * ventes de chaque clientèle), dans chaque entreprise ; elles vérifient la valeur jouée à chaque
 * trimestre de chaque rejeu, les valeurs attendues des champs, des verdicts calculés et la variété
 * que l'année permet, et que les textes se lisent.
 */

/** Chaque entreprise rejoue plusieurs années : le premier test de chacune les calcule. */
const REJEUX = 120_000;

const etatVide: EtatDuCours = { soldes: {} };

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      throw new Error(`Étape ${e.id} : type ${e.type} non relu par la garde`);
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    // Le test de bout en bout attend le titre, puis clique « Vérifier » et « Étape suivante ».
    expect(e.titre, e.id).not.toMatch(/vérifier|étape suivante|terminer|valider|montrer/i);
    for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ...textesDe(e, cas, etat)]) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+−|\s{2,}/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const somme = (a: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(a.reduce((t, r) => t + f(r), 0));
const perdus = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0) + (r.subscription?.unserved ?? 0);

/**
 * Les prix joués à un trimestre, lus dans les ventes : le prix de chaque référence d'une gamme, ou
 * le chiffre d'affaires d'une clientèle divisé par ce qu'elle a acheté.
 */
function prixJoues(r: CompanyRoundResult): number[] {
  if (r.products) return Object.values(r.products).map((p) => p.price);
  return Object.values(r.market.bySegment)
    .filter((v) => v.sold > 0)
    .map((v) => v.revenue / v.sold);
}

const STMG_NUMERIQUE = "STMG Thème 2 · Numérique et intelligence collective";

describe("les deux chapitres de management et leurs cas, dans le parcours", () => {
  it("portent les titres du programme, au palier 1, et le thème du référentiel STMG qu'ils travaillent", () => {
    const paires: [Chapitre, string, string][] = [
      [DECIDER_ENSEMBLE, STMG_NUMERIQUE, "decider-ensemble"],
    ];
    for (const [ch, bloc, code] of paires) {
      expect(ch.code).toBe(code);
      expect(PROGRAMME["stmg-management"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("stmg-management");
      expect(ch.palier).toBe(1);
      expect(ch.blocs).toEqual([bloc]);
      expect(ch.libre).toBe(false);
      // Le bloc porte le préfixe du STMG, et désigne une entrée du texte, une seule.
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("stmg");
      expect(blocOfficiel(bloc, "stmg"), bloc).toBe(bloc.replace("STMG ", ""));
      // Un code neuf, qu'aucun autre chapitre du registre ne porte.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "stmg-management")!.formation).toBe("stmg");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [CHACUN_SON_LEVIER, DECIDER_ENSEMBLE],
    ];
    for (const [s, ch] of paires) {
      expect(s.reprend, s.code).toEqual([ch.code]);
      expect(s.palier, s.code).toBe(ch.palier);
      expect(s.parcours, s.code).toBe(ch.parcours);
      expect(s.entreprises?.codes, s.code).toEqual(ch.entreprises?.codes);
      expect(s.libre, s.code).toBe(false);
      expect(s.blocs, s.code).toEqual([]);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture"), s.code).toHaveLength(0);
      expect(s.etapes.at(-1)!.type, s.code).toBe("choix");
      expect(s.code, s.code).not.toBe(ch.code);
      expect(CHAPITRES.some((x) => x.code === s.code), s.code).toBe(false);
    }
  });

  it(
    "les deux chapitres se jouent partout : recompté sur le moteur, chaque entreprise paie des salaires, des intérêts et l'impôt, et aucune année rejouée ne fait défaillance",
    () => {
      expect(DECIDER_ENSEMBLE.entreprises).toBeUndefined();
      const decision = ENTREPRISES_DU_COURS.filter((code) =>
        (["commercial", "financier", "equipe"] as const).every((f) => !anneeDecidee(code, f).some((r) => r.defaillant) && somme(anneeDecidee(code, f), soldUnits) > 0),
      );
      expect(decision).toEqual([...ENTREPRISES_DE_LA_DECISION]);
    },
    REJEUX * 3,
  );
});

describe.each(ENTREPRISES_DE_LA_DECISION)("décider ensemble chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it(
    "chaque rôle pose ses valeurs à chaque trimestre, sur l'année du cours",
    () => {
      const ref = anneeDeReference(code);
      // Le relevé des décisions rejoue l'année sans rien changer : c'est l'année du cours.
      expect(decisionsDeLAnneeDuCours(code)).toHaveLength(ref.length);
      const commercial = anneeDecidee(code, "commercial");
      const financier = anneeDecidee(code, "financier");
      for (const [t, r] of ref.entries()) {
        const avant = prixJoues(r);
        prixJoues(commercial[t]!).forEach((p, i) => expect(p, `trimestre ${t + 1}`).toBeCloseTo(avant[i]! * (1 - BAISSE_DE_PRIX_DU_COMMERCIAL), 6));
        expect(commercial[t]!.incomeStatement.marketingCost).toBeCloseTo(r.incomeStatement.marketingCost * (1 + HAUSSE_DE_PUBLICITE_DU_COMMERCIAL), 6);
        expect(financier[t]!.incomeStatement.marketingCost).toBeCloseTo(r.incomeStatement.marketingCost * COUPE_DU_FINANCIER, 6);
        expect(financier[t]!.incomeStatement.qualityCost).toBeCloseTo(r.incomeStatement.qualityCost * COUPE_DU_FINANCIER, 6);
        expect(financier[t]!.incomeStatement.maintenanceCost).toBeCloseTo(r.incomeStatement.maintenanceCost * COUPE_DU_FINANCIER, 6);
      }
      // L'équipe, c'est l'année du cours.
      expect(anneeDecidee(code, "equipe")).toBe(ref);
    },
    REJEUX,
  );

  it("les champs attendent ce que le moteur donne, et les verdicts suivent", () => {
    const annee = (f: "commercial" | "financier" | "equipe") => {
      const a = anneeDecidee(code, f);
      const i = (r: CompanyRoundResult) => r.incomeStatement;
      return {
        ventes: somme(a, soldUnits),
        resultat: somme(a, (r) => i(r).netIncome),
        tresorerie: Math.round(a.at(-1)!.cashFlow.closing),
        perdus: somme(a, perdus),
        depenses: somme(a, (r) => i(r).marketingCost) + somme(a, (r) => i(r).qualityCost) + somme(a, (r) => i(r).maintenanceCost),
      };
    };
    const c = annee("commercial");
    const f = annee("financier");
    const e = annee("equipe");
    expect(attendus(DECIDER_ENSEMBLE, "commercial", cas)).toEqual({
      [`Écart de ventes (${cas.unites})`]: c.ventes - e.ventes,
      [`Écart de clients perdus (${cas.unites})`]: c.perdus - e.perdus,
      "Écart de résultat net": c.resultat - e.resultat,
    });
    expect(attendus(DECIDER_ENSEMBLE, "financier", cas)).toEqual({
      "Dépenses coupées": e.depenses - f.depenses,
      [`Écart de ventes (${cas.unites})`]: f.ventes - e.ventes,
      "Écart de résultat net": f.resultat - e.resultat,
      "Écart de trésorerie": f.tresorerie - e.tresorerie,
    });
    // Le meilleur résultat, sans égalité : une seule bonne réponse.
    const resultats = { commercial: c.resultat, financier: f.resultat, equipe: e.resultat };
    const meilleur = (Object.keys(resultats) as (keyof typeof resultats)[]).reduce((a, b) => (resultats[b] > resultats[a] ? b : a));
    expect(Object.values(resultats).filter((x) => x === resultats[meilleur])).toHaveLength(1);
    expect(juste(DECIDER_ENSEMBLE, "meilleur-resultat", cas).startsWith({ commercial: "Le commercial", financier: "Le financier", equipe: "L'équipe" }[meilleur])).toBe(true);
    // Critère par critère : l'équipe est-elle dernière quelque part, ou la meilleure partout ?
    const notes = [
      [c.ventes, f.ventes, e.ventes],
      [c.resultat, f.resultat, e.resultat],
      [c.tresorerie, f.tresorerie, e.tresorerie],
      [-c.perdus, -f.perdus, -e.perdus],
    ];
    const equipeDerniere = notes.some((n) => new Set(n).size > 1 && n[2] === Math.min(...n));
    const equipePartout = notes.every((n) => n[2] === Math.max(...n));
    expect(juste(DECIDER_ENSEMBLE, "criteres", cas)).toBe(
      equipePartout
        ? "L'équipe est la meilleure sur tous les critères"
        : equipeDerniere
          ? "L'équipe est dernière sur au moins un critère"
          : "L'équipe n'est dernière sur aucun critère, sans être la meilleure partout",
    );
    expect(troisFacons(cas).egaliteAuResultat).toBe(false);
  });

  it(
    "le cas : le prix du commercial et les budgets du financier posés à chaque trimestre, et les écarts recomposés",
    () => {
      const ref = anneeDeReference(code);
      const partage = anneeDuPartage(code);
      for (const [t, r] of ref.entries()) {
        const avant = prixJoues(r);
        prixJoues(partage[t]!).forEach((p, i) => expect(p, `trimestre ${t + 1}`).toBeCloseTo(avant[i]! * (1 - BAISSE_DE_PRIX_DU_COMMERCIAL), 6));
        expect(partage[t]!.incomeStatement.marketingCost).toBeCloseTo(r.incomeStatement.marketingCost * COUPE_DU_FINANCIER, 6);
        expect(partage[t]!.incomeStatement.maintenanceCost).toBeCloseTo(r.incomeStatement.maintenanceCost * COUPE_DU_FINANCIER, 6);
      }
      expect(partage.some((r) => r.defaillant)).toBe(false);
      const p = { ventes: somme(partage, soldUnits), perdus: somme(partage, perdus), resultat: somme(partage, (r) => r.incomeStatement.netIncome), tresorerie: Math.round(partage.at(-1)!.cashFlow.closing) };
      const e = { ventes: somme(ref, soldUnits), perdus: somme(ref, perdus), resultat: somme(ref, (r) => r.incomeStatement.netIncome), tresorerie: Math.round(ref.at(-1)!.cashFlow.closing) };
      expect(attendus(CHACUN_SON_LEVIER, "ventes", cas)).toEqual({
        [`Écart de ventes (${cas.unites})`]: p.ventes - e.ventes,
        [`Écart de clients perdus (${cas.unites})`]: p.perdus - e.perdus,
      });
      expect(attendus(CHACUN_SON_LEVIER, "resultat", cas)).toEqual({
        "Écart de résultat net": p.resultat - e.resultat,
        "Écart de trésorerie": p.tresorerie - e.tresorerie,
      });
      const gagnes = [p.ventes > e.ventes, p.resultat > e.resultat, p.tresorerie > e.tresorerie, p.perdus < e.perdus].filter(Boolean).length;
      expect(chacunSonLevier(cas).verdict).toBe(p.resultat > e.resultat ? "le-partage" : gagnes === 0 ? "equipe-partout" : "equipe-au-resultat");
    },
    REJEUX,
  );

  it("dans le cas, la bonne réponse ne se devine pas à sa longueur", () => {
    const options = (CHACUN_SON_LEVIER.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(DECIDER_ENSEMBLE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(CHACUN_SON_LEVIER, code));
});

describe("décider ensemble, sur les neuf entreprises", () => {
  it("les verdicts se calculent, et varient autant que l'année le permet", () => {
    const k = ENTREPRISES_DE_LA_DECISION.map((c) => troisFacons(casDeLEntreprise(c)));
    // Le meilleur résultat est celui de l'équipe chez les unes, du financier seul chez les autres ;
    // le commercial seul, qui vend plus à prix plus bas, ne le fait nulle part.
    expect([...new Set(k.map((x) => x.meilleurResultat))].sort()).toEqual(["equipe", "financier"]);
    expect(ENTREPRISES_DE_LA_DECISION.filter((_, i) => k[i]!.meilleurResultat === "financier")).toEqual(["nova", "boutique", "conseil", "fitness", "batiment"]);
    // L'équipe n'est dernière sur aucun critère, sans être la meilleure partout : c'est la seule
    // réponse que l'année permet. Le commercial seul vend toujours le plus, le financier seul le moins.
    expect([...new Set(k.map((x) => x.verdict))]).toEqual(["equipe-jamais-derniere"]);
    for (const x of k) {
      expect(x.premiers("ventes")).toEqual(["commercial"]);
      expect(x.derniers("ventes")).toEqual(["financier"]);
      expect(x.derniers("resultat")).toEqual(["commercial"]);
    }
    // Le cas : le partage vend plus chez les unes, moins chez les autres ; l'équipe fait toujours
    // le meilleur résultat.
    const cas = ENTREPRISES_DE_LA_DECISION.map((c) => chacunSonLevier(casDeLEntreprise(c)).verdict);
    expect([...new Set(cas)].sort()).toEqual(["equipe-au-resultat", "equipe-partout"]);
    expect(ENTREPRISES_DE_LA_DECISION.filter((_, i) => cas[i] === "equipe-partout")).toEqual(["nova", "conseil"]);
  });

  it("chez NOVA, les chiffres du chapitre", () => {
    const k = troisFacons(casDeLEntreprise("nova"));
    expect(k.b.commercial).toMatchObject({ ventes: 24778, resultat: -55149, tresorerie: -28200, clientsPerdus: 19034 });
    expect(k.b.financier).toMatchObject({ ventes: 23522, resultat: 77866, tresorerie: -1615, clientsPerdus: 9883 });
    expect(k.b.equipe).toMatchObject({ ventes: 24286, resultat: 74416, tresorerie: -6458, clientsPerdus: 10341 });
    expect(k.financier.depensesCoupees).toBe(21372);
    expect(k.meilleurResultat).toBe("financier");
  });
});
