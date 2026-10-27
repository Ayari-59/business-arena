import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import {
  COUTS_OU_DIFFERENCIATION,
  STRATEGIE_DE_COUTS,
  STRATEGIE_DE_DIFFERENCIATION,
  coutsOuDifferenciation,
  strategie,
} from "../../src/config/cours/chapitres/couts-ou-differenciation";
import {
  ECART_D_UNE_STRATEGIE,
  LIRE_LA_STRATEGIE_DES_CONCURRENTS,
  lireLeMarche,
  strategiesDesConcurrents,
} from "../../src/config/cours/chapitres/lire-la-strategie-des-concurrents";
import { MARCHES } from "../../src/config/cours/chapitres/marche-et-part-de-marche";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { ALLER_DANS_L_ESPACE_LIBRE, espaceLibre } from "../../src/config/cours/situations/par-chapitre/aller-dans-l-espace-libre";
import {
  BAISSER_LES_PRIX_SANS_RIEN_COUPER,
  DEMI_MESURE,
  prixBasSansRienCouper,
} from "../../src/config/cours/situations/par-chapitre/baisser-les-prix-sans-rien-couper";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import type { CompanyRoundResult } from "../../src/engine/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { PART_DE_QUALITE_NEUTRE } from "../../src/engine/bots";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES « CHOIX CONCURRENTIELS » DU PARCOURS STRATÉGIE ET MANAGEMENT, ET LEURS CAS.
 *
 * Domination par les coûts ou différenciation : l'année du cours rejouée avec chaque stratégie
 * générique (gestion-de-la-pme.ts). Lire la stratégie de ses concurrents : ce que chaque enseigne
 * a fait dans l'année du cours (`anneeJouee`). Ces gardes recomposent leurs chiffres avec le
 * moteur, dans chaque entreprise où ils se jouent, vérifient que chaque levier agit vraiment, que
 * les verdicts se calculent, et que les textes se lisent : rien d'indéfini, pas de tiret au milieu
 * d'une phrase, des élisions faites, une seule bonne réponse, des libellés uniques.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(cas);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas), ...tableau];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(chapitre.etapes.length).toBe(ch.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
      // Pas de capitales espacées, pas de nombre en toutes lettres devant ce qui se compte.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(quatre|cinq|six|sept|huit|neuf|dix) (entreprises?|trimestres?|enseignes?|points?)\b/i);
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
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      // Le test de bout en bout trouve l'élément par son libellé, dans un attribut entre guillemets.
      for (const x of elements) expect(x.libelle, e.id).not.toMatch(/"/);
      for (const x of elements) expect(e.categories.map((k) => k.code), x.libelle).toContain(x.categorie);
      for (const x of elements) expect(Number.isFinite(x.montant), x.libelle).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

const champ = (ch: Chapitre, etape: string, cas: Cas, debut: string) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === etape)!;
  if (e.type !== "montants") throw new Error(`${etape} n'est pas une étape de montants`);
  const c = e.champs(cas, { soldes: {} }).find((x) => x.libelle.startsWith(debut));
  if (!c) throw new Error(`pas de champ « ${debut} » dans ${etape}`);
  return c.attendu;
};

const somme = (annee: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => annee.reduce((t, r) => t + f(r), 0);
const vendus = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
const potentiel = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.potential, 0);
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/**
 * Le budget qualité de l'année du cours sur ces trimestres ; nul, celui de la gestion neutre du
 * secteur (la moitié de l'échelle de qualité du scénario), d'où part la stratégie qui le monte.
 */
const budgetDeQualite = (code: string, annee: readonly CompanyRoundResult[]) => {
  const q = somme(annee, (r) => r.incomeStatement.qualityCost);
  return q > 0 ? q : PART_DE_QUALITE_NEUTRE * scenarioByCode(code).scenario.production.qualityScale * annee.length;
};

const PAIRES: [Situation, Chapitre][] = [
  [BAISSER_LES_PRIX_SANS_RIEN_COUPER, COUTS_OU_DIFFERENCIATION],
  [ALLER_DANS_L_ESPACE_LIBRE, LIRE_LA_STRATEGIE_DES_CONCURRENTS],
];

describe("les deux chapitres et leurs cas, dans le parcours stratégie et management", () => {
  it("portent les titres du programme, au palier 2, et des blocs qui existent tels quels", () => {
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS]) {
      expect(PROGRAMME.strategie[2], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("strategie");
      expect(ch.palier).toBe(2);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toContain("STMG Thème 3 · Les choix stratégiques des organisations");
      for (const b of ch.blocs) {
        const cite = referentielDeCitation(b);
        expect(cite, b).not.toBeNull();
        expect(cite!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
      }
    }
  });

  it("se jouent partout sauf chez VOLT FITNESS, dont le marché se compte en abonnés gardés", () => {
    expect(MARCHES).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "fitness"));
    expect(scenarioByCode("fitness").scenario.subscription).toBeTruthy();
    for (const ch of [COUTS_OU_DIFFERENCIATION, LIRE_LA_STRATEGIE_DES_CONCURRENTS]) expect(ch.entreprises?.codes).toEqual(MARCHES);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    for (const [s, ch] of PAIRES) {
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
    }
  });

  it("les stratégies sont cohérentes : les coûts baissent tout, la différenciation monte tout", () => {
    expect(STRATEGIE_DE_COUTS.prix).toBeLessThan(1);
    expect(STRATEGIE_DE_COUTS.qualite).toBeLessThan(1);
    expect(STRATEGIE_DE_COUTS.marketing).toBeLessThan(1);
    expect(STRATEGIE_DE_DIFFERENCIATION.prix).toBeGreaterThan(1);
    expect(STRATEGIE_DE_DIFFERENCIATION.qualite).toBeGreaterThan(1);
    expect(STRATEGIE_DE_DIFFERENCIATION.marketing).toBeGreaterThan(1);
    expect(DEMI_MESURE).toEqual({ prix: STRATEGIE_DE_COUTS.prix, qualite: 1, marketing: 1, production: STRATEGIE_DE_COUTS.production });
  });
});

describe.each(MARCHES)("domination par les coûts ou différenciation chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const gamme = !!scenarioByCode(code).scenario.products;

  it("le milieu est l'année du cours, au centime", () => {
    const k = coutsOuDifferenciation(cas);
    const jouee = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
    expect(k.milieu.resultat).toBe(Math.round(somme(jouee, (r) => r.incomeStatement.netIncome)));
    expect(k.milieu.ventes).toBe(Math.round(somme(jouee, vendus)));
  });

  it("chaque levier agit, seul, dans l'entreprise", () => {
    const ref = anneeDeReference(code);
    const seul = (cle: string, l: Partial<typeof STRATEGIE_DE_COUTS>) =>
      rejouerAvec(code, `couts-ou-differenciation-test-${cle}`, strategie(code, { prix: 1, qualite: 1, marketing: 1, production: 1, ...l }));
    const prix = seul("prix", { prix: STRATEGIE_DE_COUTS.prix });
    expect(somme(prix, (r) => r.incomeStatement.revenue) / somme(prix, vendus)).toBeLessThan(somme(ref, (r) => r.incomeStatement.revenue) / somme(ref, vendus));
    const qualite = seul("qualite", { qualite: STRATEGIE_DE_DIFFERENCIATION.qualite });
    expect(qualite[0]!.production.producedQuality).toBeGreaterThan(ref[0]!.production.producedQuality);
    // Un budget qualité nul ne se double pas : la différenciation part alors du budget usuel du secteur.
    expect(somme(qualite, (r) => r.incomeStatement.qualityCost)).toBeCloseTo(budgetDeQualite(code, ref) * STRATEGIE_DE_DIFFERENCIATION.qualite, 0);
    const marketing = seul("marketing", { marketing: STRATEGIE_DE_DIFFERENCIATION.marketing });
    expect(somme(marketing, (r) => r.incomeStatement.marketingCost)).toBeCloseTo(somme(ref, (r) => r.incomeStatement.marketingCost) * STRATEGIE_DE_DIFFERENCIATION.marketing, 0);
    // Le marketing fait vendre : la demande adressée monte (au trimestre même, ou au suivant par la marque).
    const demande = (a: readonly CompanyRoundResult[]) => somme(a, (r) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0));
    expect(demande(marketing)).toBeGreaterThan(demande(ref));
    const production = seul("production", { production: STRATEGIE_DE_COUTS.production });
    expect(somme(production, (r) => r.production.produced)).toBeGreaterThan(somme(ref, (r) => r.production.produced));
  });

  it("chaque stratégie est jouée à chaque trimestre, et personne ne fait défaillance", () => {
    const ref = anneeDeReference(code);
    const couts = rejouerAvec(code, "couts-ou-differenciation-couts", strategie(code, STRATEGIE_DE_COUTS));
    const diff = rejouerAvec(code, "couts-ou-differenciation-differenciation", strategie(code, STRATEGIE_DE_DIFFERENCIATION));
    ref.forEach((r, i) => {
      expect(couts[i]!.incomeStatement.qualityCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.qualityCost * STRATEGIE_DE_COUTS.qualite, 6);
      expect(diff[i]!.incomeStatement.marketingCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.marketingCost * STRATEGIE_DE_DIFFERENCIATION.marketing, 6);
      expect(diff[i]!.incomeStatement.qualityCost, `T${i + 1}`).toBeCloseTo(budgetDeQualite(code, [r]) * STRATEGIE_DE_DIFFERENCIATION.qualite, 6);
      // Les leviers se posent sur l'année du cours au même trimestre : aucun ne se compose d'un trimestre à l'autre.
      expect(couts[i]!.incomeStatement.marketingCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.marketingCost * STRATEGIE_DE_COUTS.marketing, 6);
      if (!gamme) {
        expect(diff[i]!.incomeStatement.revenue / vendus(diff[i]!), `T${i + 1}`).toBeCloseTo((r.incomeStatement.revenue / vendus(r)) * STRATEGIE_DE_DIFFERENCIATION.prix, 6);
      }
      if (!gamme) {
        // Un seul prix : le prix moyen du trimestre est celui de la décision.
        expect(couts[i]!.incomeStatement.revenue / vendus(couts[i]!), `T${i + 1}`).toBeCloseTo((r.incomeStatement.revenue / vendus(r)) * STRATEGIE_DE_COUTS.prix, 6);
      }
    });
    for (const a of [ref, couts, diff]) expect(a.some((r) => r.defaillant)).toBe(false);
  });

  it("les chiffres se recomposent avec le moteur, et les champs attendent ces chiffres", () => {
    const k = coutsOuDifferenciation(cas);
    const annees = {
      couts: rejouerAvec(code, "couts-ou-differenciation-couts", strategie(code, STRATEGIE_DE_COUTS)),
      milieu: anneeDeReference(code),
      differenciation: rejouerAvec(code, "couts-ou-differenciation-differenciation", strategie(code, STRATEGIE_DE_DIFFERENCIATION)),
    };
    for (const x of k.trois) {
      const a = annees[x.code];
      const ventes = Math.round(somme(a, vendus));
      const marche = Math.round(somme(a, potentiel));
      expect(x.ventes, x.code).toBe(ventes);
      expect(x.marche, x.code).toBe(marche);
      expect(x.part, x.code).toBe(auDixieme((ventes / marche) * 100));
      expect(x.margeUnitaire, x.code).toBeCloseTo(Math.round(somme(a, (r) => r.incomeStatement.grossMargin)) / ventes, 2);
      expect(x.resultat, x.code).toBe(Math.round(somme(a, (r) => r.incomeStatement.netIncome)));
      expect(x.coutComplet, x.code).toBeCloseTo((x.chiffreDAffaires - x.exploitation) / ventes, 2);
    }
    // Le marché ne dépend pas de l'entreprise : le même dans les trois années.
    expect(new Set(k.trois.map((x) => x.marche)).size).toBe(1);
    expect(champ(COUTS_OU_DIFFERENCIATION, "volume", cas, "Part de marché, domination")).toBe(k.couts.part);
    expect(champ(COUTS_OU_DIFFERENCIATION, "volume", cas, "Part de marché, différenciation")).toBe(k.differenciation.part);
    expect(champ(COUTS_OU_DIFFERENCIATION, "marge", cas, "Marge par unité, domination")).toBe(k.couts.margeUnitaire);
    expect(champ(COUTS_OU_DIFFERENCIATION, "marge", cas, "Marge par unité, différenciation")).toBe(k.differenciation.margeUnitaire);
    expect(champ(COUTS_OU_DIFFERENCIATION, "resultat", cas, "Écart de résultat, domination")).toBe(k.couts.resultat - k.milieu.resultat);
    expect(champ(COUTS_OU_DIFFERENCIATION, "resultat", cas, "Écart de résultat, différenciation")).toBe(k.differenciation.resultat - k.milieu.resultat);
  });

  it("le verdict se calcule : la meilleure stratégie, et la place du milieu", () => {
    const k = coutsOuDifferenciation(cas);
    expect(k.meilleure.resultat).toBe(Math.max(...k.trois.map((x) => x.resultat)));
    expect(k.pire.resultat).toBe(Math.min(...k.trois.map((x) => x.resultat)));
    expect(k.rangDuMilieu).toBe(k.meilleure === k.milieu ? "premier" : k.pire === k.milieu ? "dernier" : "entre");
    // Ce que le chapitre dit du milieu : ni le volume des coûts, ni la marge de la différenciation.
    expect(k.coince).toBe(true);
    expect(k.couts.coutComplet).toBeLessThan(k.milieu.coutComplet);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(COUTS_OU_DIFFERENCIATION, code));
});

describe("domination par les coûts ou différenciation, sur les entreprises du chapitre", () => {
  it("la bonne stratégie dépend de l'entreprise, et le milieu n'est pas partout le pire", () => {
    const k = MARCHES.map((c) => coutsOuDifferenciation(casDeLEntreprise(c)));
    // Le bon gestionnaire, au milieu, tient son marché : les trois choix sont le meilleur quelque
    // part, et le milieu se classe premier ici, entre les deux là, dernier ailleurs.
    expect([...new Set(k.map((x) => x.meilleure.code))].sort()).toEqual(["couts", "differenciation", "milieu"]);
    expect([...new Set(k.map((x) => x.rangDuMilieu))].sort()).toEqual(["dernier", "entre", "premier"]);
    // Le budget qualité de l'année du cours est nul chez les unes (la différenciation part alors
    // du budget usuel du secteur), positif chez les autres.
    expect([...new Set(k.map((x) => x.milieu.qualite > 0))].sort()).toEqual([false, true]);
  });
});

describe.each(MARCHES)("lire la stratégie de ses concurrents chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const def = scenarioByCode(code);

  it("chaque enseigne se recompose avec l'année du cours", () => {
    const k = strategiesDesConcurrents(cas);
    const { partie } = anneeJouee(code);
    expect(k.enseignes.map((e) => e.id)).toEqual(["joueur", ...def.bots.slice(0, 2).map((b) => b.id)]);
    for (const e of k.enseignes) {
      const a = partie.rounds.map((t) => t.results[e.id]!);
      const ventes = Math.round(somme(a, vendus));
      const ca = Math.round(somme(a, (r) => r.incomeStatement.revenue));
      const actifs = a.map((r, i) => (vendus(r) > 0 ? i : -1)).filter((i) => i >= 0);
      expect(e.ventes, e.id).toBe(ventes);
      expect(e.prix, e.id).toBeCloseTo(ca / ventes, 2);
      expect(e.qualite, e.id).toBeCloseTo(partie.rounds[actifs.at(-1)!]!.companies.find((x) => x.id === e.id)!.perceivedQuality, 2);
      expect(e.budgetQualite, e.id).toBe(Math.round(somme(a, (r) => r.incomeStatement.qualityCost) / actifs.length));
      expect(e.part, e.id).toBe(auDixieme((ventes / Math.round(somme(partie.rounds.map((t) => t.results["joueur"]!), potentiel))) * 100));
      expect(e.resultat, e.id).toBe(Math.round(somme(a, (r) => r.incomeStatement.netIncome)));
      expect(e.trimestresDeVente, e.id).toBe(actifs.length);
      expect(e.defaillante, e.id).toBe(a.at(-1)!.defaillant === true);
    }
    // L'entreprise elle-même ne fait jamais défaillance dans l'année du cours.
    expect(k.entreprise.defaillante).toBe(false);
  });

  it("la carte : le prix moyen du marché, la qualité moyenne et les indices, tels que les champs les attendent", () => {
    const k = strategiesDesConcurrents(cas);
    const ca = k.enseignes.reduce((t, e) => t + e.chiffreDAffaires, 0);
    const ventes = k.enseignes.reduce((t, e) => t + e.ventes, 0);
    expect(k.prixDuMarche).toBeCloseTo(ca / ventes, 2);
    expect(k.qualiteMoyenneEcrite).toBeCloseTo(k.enseignes.reduce((t, e) => t + e.qualite, 0) / 3, 2);
    for (const e of k.enseignes) {
      expect(e.indicePrix, e.id).toBe(Math.round((e.prix / k.prixDuMarche) * 100));
      expect(e.indiceQualite, e.id).toBe(Math.round((e.qualite / k.qualiteMoyenneEcrite) * 100));
      const lue =
        e.indicePrix < 100 - ECART_D_UNE_STRATEGIE && e.indiceQualite < 100
          ? "couts"
          : e.indicePrix > 100 + ECART_D_UNE_STRATEGIE && e.indiceQualite > 100
            ? "differenciation"
            : "intermediaire";
      expect(e.strategie, e.id).toBe(lue);
    }
    expect(champ(LIRE_LA_STRATEGIE_DES_CONCURRENTS, "carte", cas, "Prix moyen du marché")).toBe(k.prixDuMarche);
    expect(champ(LIRE_LA_STRATEGIE_DES_CONCURRENTS, "carte", cas, "Indice de prix")).toBe(k.entreprise.indicePrix);
    expect(champ(LIRE_LA_STRATEGIE_DES_CONCURRENTS, "carte", cas, "Qualité moyenne")).toBe(k.qualiteMoyenneEcrite);
    expect(champ(LIRE_LA_STRATEGIE_DES_CONCURRENTS, "carte", cas, "Indice de qualité")).toBe(k.entreprise.indiceQualite);
  });

  it("la stratégie lue est celle que le robot joue, et l'entreprise reste au milieu", () => {
    const k = strategiesDesConcurrents(cas);
    const attendue = { price_aggressive: "couts", premium: "differenciation" } as const;
    for (const [i, b] of def.bots.slice(0, 2).entries()) {
      expect(b.profile in attendue, b.profile).toBe(true);
      expect(k.concurrents[i]!.strategie, b.name).toBe(attendue[b.profile as keyof typeof attendue]);
    }
    // Le bon gestionnaire se place entre ses deux concurrents en prix. En qualité, il reste sous le
    // haut de gamme et ne tombe pas sous le concurrent qui casse les prix : sans budget qualité,
    // comme lui, il peut finir à sa hauteur (voir plus bas).
    const [a, b] = k.concurrents;
    expect(k.entreprise.indicePrix).toBeGreaterThan(Math.min(a!.indicePrix, b!.indicePrix));
    expect(k.entreprise.indicePrix).toBeLessThan(Math.max(a!.indicePrix, b!.indicePrix));
    expect(k.entreprise.indiceQualite).toBeGreaterThanOrEqual(Math.min(a!.indiceQualite, b!.indiceQualite));
    expect(k.entreprise.indiceQualite).toBeLessThan(Math.max(a!.indiceQualite, b!.indiceQualite));
  });

  it("l'espace libre et la meilleure année se calculent", () => {
    const k = strategiesDesConcurrents(cas);
    expect(k.partie).toBe(k.enseignes.find((e) => e.defaillante) ?? null);
    const restantes = k.enseignes.filter((e) => !e.defaillante).map((e) => e.indicePrix).sort((a, b) => a - b);
    const ecarts = restantes.slice(1).map((x, i) => x - restantes[i]!);
    expect(k.plusGrand.points).toBe(Math.max(...ecarts));
    expect(k.meilleure.resultat).toBe(Math.max(...k.enseignes.map((e) => e.resultat)));
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LIRE_LA_STRATEGIE_DES_CONCURRENTS, code));
});

describe("lire la stratégie de ses concurrents, sur les entreprises du chapitre", () => {
  it("l'espace libre est un écart, tantôt sous le prix de l'entreprise, tantôt au-dessus ; et les deux stratégies réussissent quelque part", () => {
    const k = MARCHES.map((c) => strategiesDesConcurrents(casDeLEntreprise(c)));
    // Sur l'année du cours (concurrents assainis), aucune enseigne ne quitte le marché : la place
    // laissée par une défaillante n'est lue nulle part, l'espace libre est toujours un écart.
    expect(k.map((x) => x.partie)).toEqual(MARCHES.map(() => null));
    const cote = (x: (typeof k)[number]) => (x.plusGrand.bas === x.entreprise ? "au-dessus" : x.plusGrand.haut === x.entreprise ? "en dessous" : "ailleurs");
    expect([...new Set(k.map(cote))].sort()).toEqual(["au-dessus", "en dessous"]);
    // Le meilleur résultat de l'année revient tantôt à un concurrent (coûts ou différenciation),
    // tantôt à l'entreprise elle-même, au milieu avec le bon gestionnaire.
    expect([...new Set(k.map((x) => x.meilleure.strategie))].sort()).toEqual(["couts", "differenciation", "intermediaire"]);
    expect([...new Set(k.map((x) => x.meilleure === x.entreprise))].sort()).toEqual([false, true]);
    // La règle de lecture place l'entreprise en position intermédiaire partout : le bon
    // gestionnaire part du prix que le formulaire propose et l'y ramène, sans budget de
    // différenciation. Sa qualité finit à la hauteur de celle du concurrent qui casse les prix
    // chez les unes, au-dessus chez les autres.
    expect(k.every((x) => x.entreprise.strategie === "intermediaire")).toBe(true);
    const aLaHauteur = k.map((x) => x.entreprise.indiceQualite === Math.min(...x.concurrents.map((y) => y.indiceQualite)));
    expect([...new Set(aLaHauteur)].sort()).toEqual([false, true]);
  });

  it("le marché d'un seul trimestre se lit comme celui de l'année", () => {
    const m = lireLeMarche(casDeLEntreprise("nova"), [1]);
    const r = anneeJouee("nova").partie.rounds[0]!.results["joueur"]!;
    expect(m.entreprise.ventes).toBe(Math.round(vendus(r)));
    expect(m.entreprise.trimestresDeVente).toBe(1);
  });
});

describe.each(MARCHES)("baisser les prix sans rien couper chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const gamme = !!scenarioByCode(code).scenario.products;

  it("la demi-mesure garde les budgets et prend le prix et la production de la stratégie de coûts", () => {
    const k = prixBasSansRienCouper(cas);
    const ref = anneeDeReference(code);
    const demi = rejouerAvec(code, "couts-ou-differenciation-demi-mesure", strategie(code, DEMI_MESURE));
    const couts = rejouerAvec(code, "couts-ou-differenciation-couts", strategie(code, STRATEGIE_DE_COUTS));
    ref.forEach((r, i) => {
      expect(demi[i]!.incomeStatement.qualityCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.qualityCost, 6);
      expect(demi[i]!.incomeStatement.marketingCost, `T${i + 1}`).toBeCloseTo(r.incomeStatement.marketingCost, 6);
      if (!gamme) expect(demi[i]!.incomeStatement.revenue / vendus(demi[i]!), `T${i + 1}`).toBeCloseTo(couts[i]!.incomeStatement.revenue / vendus(couts[i]!), 6);
    });
    expect(demi.some((r) => r.defaillant)).toBe(false);
    expect(k.demi.resultat).toBe(Math.round(somme(demi, (r) => r.incomeStatement.netIncome)));
    expect(k.demi.part).toBe(auDixieme((Math.round(somme(demi, vendus)) / Math.round(somme(demi, potentiel))) * 100));
    expect(k.couts).toEqual(coutsOuDifferenciation(cas).couts);
    expect(k.budgetsEnPlus).toBe(k.demi.qualite + k.demi.marketing - k.couts.qualite - k.couts.marketing);
    expect(k.budgetsEnPlus).toBeGreaterThan(0);
    const meilleur = Math.max(...k.trois.map((x) => x.resultat));
    expect(k.verdict).toBe(meilleur === k.demi.resultat ? "demi-mesure" : meilleur === k.couts.resultat ? "couts" : "annee-du-cours");
    expect(champ(BAISSER_LES_PRIX_SANS_RIEN_COUPER, "volume", cas, "Part de marché")).toBe(k.demi.part);
    expect(champ(BAISSER_LES_PRIX_SANS_RIEN_COUPER, "volume", cas, "Marge par unité")).toBe(k.demi.margeUnitaire);
    expect(champ(BAISSER_LES_PRIX_SANS_RIEN_COUPER, "resultat", cas, "Écart de résultat, proposition moins stratégie")).toBe(k.demi.resultat - k.couts.resultat);
    expect(champ(BAISSER_LES_PRIX_SANS_RIEN_COUPER, "resultat", cas, "Écart de résultat, proposition moins année")).toBe(k.demi.resultat - k.annee.resultat);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(BAISSER_LES_PRIX_SANS_RIEN_COUPER, code);
    reponseSansIndice(BAISSER_LES_PRIX_SANS_RIEN_COUPER, code);
  });
});

describe("baisser les prix sans rien couper, sur les entreprises du cas", () => {
  it("les trois réponses se rencontrent", () => {
    const verdicts = new Set(MARCHES.map((c) => prixBasSansRienCouper(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["annee-du-cours", "couts", "demi-mesure"]);
  });
});

describe.each(MARCHES)("aller dans l'espace libre chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const gamme = !!scenarioByCode(code).scenario.products;

  it("le prix de la place suit la règle du cours, et l'arène le joue", () => {
    const x = espaceLibre(cas);
    const k = strategiesDesConcurrents(cas);
    // Le prix de la place se donne au centime, comme l'élève l'écrit.
    expect(x.prixVise).toBe(k.partie ? k.partie.prix : auCentime((k.plusGrand.bas.prix + k.plusGrand.haut.prix) / 2));
    expect(x.indiceVise).toBe(Math.round((x.prixVise / k.prixDuMarche) * 100));
    expect(x.variation).toBe(auDixieme((x.prixVise / k.entreprise.prix - 1) * 100));
    const rejouee = rejouerAvec(code, "lire-la-strategie-des-concurrents-espace-libre", () => undefined);
    // En mono-produit, le prix de chaque trimestre où l'entreprise vend est celui de la place.
    if (!gamme) for (const r of rejouee.filter((y) => vendus(y) > 0)) expect(r.incomeStatement.revenue / vendus(r)).toBeCloseTo(x.prixVise, 1);
    const k1 = rejouee.findIndex((r) => r.defaillant === true);
    expect(x.defaillance).toBe(k1 < 0 ? null : k1 + 1);
    expect(x.apres.resultat).toBe(Math.round(somme(rejouee, (r) => r.incomeStatement.netIncome)));
    expect(x.verdict).toBe(x.defaillance === null && x.ecartDeResultat > 0 ? "y-aller" : "rester");
    expect(champ(ALLER_DANS_L_ESPACE_LIBRE, "prix", cas, "Prix de la place")).toBe(x.prixVise);
    expect(champ(ALLER_DANS_L_ESPACE_LIBRE, "arene", cas, "Part de marché")).toBe(x.apres.part);
    expect(champ(ALLER_DANS_L_ESPACE_LIBRE, "arene", cas, "Écart de résultat")).toBe(x.apres.resultat - x.avant.resultat);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(ALLER_DANS_L_ESPACE_LIBRE, code);
    reponseSansIndice(ALLER_DANS_L_ESPACE_LIBRE, code);
  });
});

describe("aller dans l'espace libre, sur les entreprises du cas", () => {
  it("la place paie chez les unes, pas chez les autres, et c'est le résultat qui tranche", () => {
    const x = MARCHES.map((c) => espaceLibre(casDeLEntreprise(c)));
    expect([...new Set(x.map((y) => y.verdict))].sort()).toEqual(["rester", "y-aller"]);
    // Sur l'année du cours, le prix de la place ne mène nulle part à la défaillance : la branche
    // « l'entreprise tombe en défaillance » du cas n'est lue dans aucune entreprise, et le verdict
    // suit le signe de l'écart de résultat.
    expect(x.map((y) => y.defaillance)).toEqual(MARCHES.map(() => null));
    for (const y of x) expect(y.verdict).toBe(y.ecartDeResultat > 0 ? "y-aller" : "rester");
    // La place se trouve tantôt au-dessus du prix de l'entreprise, tantôt en dessous.
    expect([...new Set(x.map((y) => Math.sign(y.variation)))].sort()).toEqual([-1, 1]);
  });
});
