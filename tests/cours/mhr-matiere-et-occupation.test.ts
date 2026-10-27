import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { METIERS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  CUISINES,
  FOURCHETTE_DE_LA_PROFESSION,
  LE_COUT_MATIERE,
  coutMatiere,
} from "../../src/config/cours/chapitres/le-cout-matiere";
import {
  HOTELS,
  OCCUPATION_ET_REVENU_PAR_CHAMBRE,
  occupation,
} from "../../src/config/cours/chapitres/occupation-et-revenu-par-chambre";
import { MONTER_LA_CARTE_OU_PREPARER_JUSTE, carteOuCuisine } from "../../src/config/cours/situations/par-chapitre/monter-la-carte-ou-preparer-juste";
import { S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, alignement } from "../../src/config/cours/situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU PALIER 2 DU BTS MHR, ET LEURS CAS PRATIQUES.
 *
 * « Le coût matière et le prix d'un plat » (le bistrot) et « Le taux d'occupation, le prix moyen
 * et le revenu par chambre » (l'hôtel) prennent leurs chiffres dans l'année du cours ; leurs cas
 * la rejouent avec une décision changée. Ces gardes recomposent les chiffres par un autre chemin
 * (le scénario, le moteur, les indicateurs que l'arène affiche, un rejeu sous une autre clé),
 * vérifient les valeurs attendues des champs, et que les textes se lisent : rien d'indéfini, pas
 * de tiret au milieu d'une phrase, une seule bonne réponse, aucune option qui en contient une
 * autre, des libellés uniques, et des accords justes avec « couverts » et « chambres ».
 */

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const MHR = "bts-mhr";
const BLOC_1 = "BTS MHR Bloc 1 · Conception et production de services en hôtellerie restauration";
const BLOC_4 = "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration";

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

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function textesPropres(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu chez ${code}`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculin = new RegExp(`\\bun ${u}\\b|\\b${u}s? (vendu|fabriqué|produit|servi|jeté|retourné|demandé)s?\\b(?!e)`, "i");
  // « chambres » et « nuitées » sont féminines, « couverts » masculin, dans toutes les entreprises.
  const fautes = [
    /\bchambres? (vendu|loué|occupé|resté|mis|servi|parti)s?\b(?!e)/i,
    /\bun chambre\b|\bune couvert\b|\bcouverts? (vendue|servie|préparée|perdue|ratée)s?\b/i,
    /\bnuitées? (vendu|demandé|servi|mis)s?\b(?!e)/i,
  ];
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/[A-ZÉ] [A-ZÉ] [A-ZÉ]/);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
      for (const f of fautes) expect(x, `${e.id} : ${x}`).not.toMatch(f);
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
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
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

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts). */
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
  for (const code of s.entreprises!.codes) {
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

const vendues = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, s) => t + s.sold, 0);
const perdues = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, s) => t + s.lost, 0);

describe("les deux chapitres et leur place au programme", () => {
  it("leurs titres sont ceux du programme du BTS MHR, au palier 2, chacun chez son entreprise", () => {
    for (const ch of [LE_COUT_MATIERE, OCCUPATION_ET_REVENU_PAR_CHAMBRE]) {
      expect(PROGRAMME.mhr[2]).toContain(ch.titre);
      expect(ch.parcours).toBe("mhr");
      expect(ch.palier).toBe(2);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises!.pourquoi).toMatch(/\.$/);
    }
    expect(LE_COUT_MATIERE.code).toBe("le-cout-matiere");
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.code).toBe("occupation-et-revenu-par-chambre");
    expect(LE_COUT_MATIERE.entreprises!.codes).toEqual(["bistrot"]);
    expect(CUISINES).toEqual(["bistrot"]);
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.entreprises!.codes).toEqual(["hotel"]);
    expect(HOTELS).toEqual(["hotel"]);
    // Les deux entreprises du métier sont bien un restaurant et un hôtel.
    expect(scenarioByCode("bistrot").sector).toBe("restauration");
    expect(scenarioByCode("hotel").sector).toBe("hotellerie");
  });

  it("chaque bloc cité se résout vers le référentiel du BTS MHR, mot pour mot", () => {
    expect(LE_COUT_MATIERE.blocs).toEqual([BLOC_1, BLOC_4]);
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.blocs).toEqual([BLOC_4]);
    for (const b of [...LE_COUT_MATIERE.blocs, ...OCCUPATION_ET_REVENU_PAR_CHAMBRE.blocs]) {
      const r = referentielDeCitation(b)!;
      expect(r.code, b).toBe(MHR);
      const officiel = b.replace(/^BTS MHR /, "");
      expect(r.referentiel.entrees).toContain(officiel);
      expect(blocOfficiel(b, MHR), b).toBe(officiel);
    }
  });
});

describe("le coût matière et le prix d'un plat, chez le bistrot", () => {
  const cas = casDeLEntreprise("bistrot");
  const def = scenarioByCode("bistrot");
  const s = def.scenario;
  const m = coutMatiere(cas);

  it("le couvert est celui du scénario, et son ticket celui que l'arène joue toute l'année", () => {
    expect(m.matiere).toBe(s.product.materialCostPerUnit);
    expect(m.autres).toBe(s.product.otherVariableCostPerUnit);
    expect(m.coutVariable).toBe(m.matiere + m.autres);
    expect(s.suppliers!.find((x) => x.name === m.fournisseur)!.costMultiplier).toBe(1);
    // Le ticket du cas est celui de chaque trimestre de l'année jouée, au centime.
    for (const tour of anneeJouee("bistrot").partie.rounds) {
      const r = tour.results["joueur"]!;
      expect(r2(r.incomeStatement.revenue / soldUnits(r))).toBe(m.prix);
    }
    // La TVA des repas est celle que le cours pose au bistrot ; le scénario n'en pose aucune.
    expect(m.tauxTva).toBe(METIERS.bistrot!.vente.tauxTva);
    expect(m.tauxTva).toBe(0.1);
    expect(m.tauxTvaAchat).toBe(METIERS.bistrot!.achat.tauxTva);
    expect(m.prixTtc).toBe(r2(m.prix * 1.1));
    expect(m.ratio).toBe(r1((m.matiere / m.prix) * 100));
    expect(m.coefficient).toBe(r2(100 / m.ratio));
    expect(Math.abs(m.coefficient - m.prix / m.matiere)).toBeLessThanOrEqual(0.01);
  });

  it("la fourchette de la profession est celle que l'arène écrit sous son ratio matières", () => {
    const kpi = def.kpis.find((k) => k.key === "ratio_matieres")!;
    expect(kpi.hint).toContain(`${FOURCHETTE_DE_LA_PROFESSION.min} à ${FOURCHETTE_DE_LA_PROFESSION.max} %`);
    expect(m.dansLaFourchette).toBe(true);
  });

  it("le coût matière de chaque trimestre se recompose : couverts préparés × denrées du scénario × la hausse de l'année", () => {
    const hausse = s.scriptedEvents!.map((x) => ({ ...x, def: s.events.find((e) => e.code === x.eventCode)! })).find((x) =>
      x.def.modifiers.some((mod) => mod.target === "material_cost"),
    )!;
    const facteur = hausse.def.modifiers.find((mod) => mod.target === "material_cost")!.value;
    const touche = (k: number) => k + 1 >= hausse.round && k + 1 < hausse.round + hausse.def.duration;
    const rounds = anneeJouee("bistrot").partie.rounds;
    expect(rounds).toHaveLength(4);
    m.trimestres.forEach((x, k) => {
      const r = rounds[k]!.results["joueur"]!;
      const cout = s.product.materialCostPerUnit * (touche(k) ? facteur : 1);
      expect(x.coutDuCouvert, `trimestre ${k + 1}`).toBeCloseTo(cout, 6);
      expect(Math.abs(x.denrees - r.production.produced * cout), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.5);
      expect(x.prepares).toBe(Math.round(r.production.produced));
      expect(x.servis).toBe(Math.round(vendues(r)));
      expect(x.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
      expect(x.ratio).toBe(r1((x.denrees / x.chiffreDAffaires) * 100));
      // Le bistrot ne stocke rien : tout ce qui est préparé passe en coût des ventes.
      expect(r.incomeStatement.cogs).toBeCloseTo(r.incomeStatement.variableProductionCost, 6);
      if (!touche(k)) {
        // Sans hausse, le ratio est celui que l'arène affiche dans ses indicateurs du métier.
        const kpi = def.kpis.find((q) => q.key === "ratio_matieres")!;
        const affiche = kpi.compute({ result: r, previousSegments: null, segmentUnits: soldUnits(r), totalUnits: soldUnits(r), roundDays: s.roundDays, scenario: s })!;
        expect(Math.abs(x.ratio - affiche * 100), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.1);
      }
    });
    expect(m.hausse.trimestres).toEqual([0, 1, 2, 3].filter(touche));
    expect(m.hausse.taux).toBe(r1((facteur - 1) * 100));
    expect(m.hausse.cout).toBe(r2(s.product.materialCostPerUnit * facteur));
    expect(m.hausse.motif).toBe("la hausse des prix du beurre, de la crème et de la viande");
  });

  it("les champs du chapitre demandent ces chiffres-là", () => {
    expect(attendus(LE_COUT_MATIERE, "le-ratio-du-couvert", cas)).toEqual([r1((10 / 34) * 100), r2(100 / r1((10 / 34) * 100))]);
    expect(attendus(LE_COUT_MATIERE, "le-ratio-du-couvert", cas)).toEqual([29.4, 3.4]);
    expect(attendus(LE_COUT_MATIERE, "la-hausse", cas)).toEqual([12.4, r1((12.4 / 34) * 100)]);
    const ht = r2(12.4 * 3.4);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([ht, r2(ht * 1.1)]);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([42.16, 46.38]);
    const t = m.trimestres;
    const denrees = t.reduce((a, x) => a + x.denrees, 0);
    const ca = t.reduce((a, x) => a + x.chiffreDAffaires, 0);
    const ratios = t.map((x) => x.ratio);
    const pire = ratios.indexOf(Math.max(...ratios));
    expect(pire).toBe(2);
    expect(attendus(LE_COUT_MATIERE, "l-annee", cas)).toEqual([denrees, r1((denrees / ca) * 100), t[pire]!.ratio]);
    const p = t[pire]!;
    const perdus = p.prepares - p.servis;
    const cout = r2(perdus * p.coutDuCouvert);
    expect(attendus(LE_COUT_MATIERE, "les-denrees-perdues", cas)).toEqual([perdus, cout, r1(((p.denrees - cout) / p.chiffreDAffaires) * 100)]);
    expect(perdus).toBeGreaterThan(0);
  });

  it("le ratio du pire trimestre se lit en trois morceaux : la carte, le prix des denrées, les plats jetés", () => {
    const p = m.trimestres[m.pire]!;
    // Sans les pertes, le ratio est celui d'un couvert servi au prix des denrées du trimestre.
    expect(Math.abs(m.ratioSansPerte - r1((p.coutDuCouvert / m.prix) * 100))).toBeLessThanOrEqual(0.2);
    const morceaux = m.ratio + (m.ratioSansPerte - m.ratio) + (p.ratio - m.ratioSansPerte);
    expect(r1(morceaux)).toBe(p.ratio);
    expect(m.ratioDeLAnnee).toBeGreaterThan(m.ratio);
    expect(m.ratioDeLAnnee).toBeGreaterThan(FOURCHETTE_DE_LA_PROFESSION.max);
  });

  it("le cas : la carte montée et la cuisine juste, rejouées sous une autre clé, et la meilleure façon", () => {
    const k = carteOuCuisine(cas);
    const tour = k.trimestre + 1;
    const rebut = s.qualityCosts!.baseDefectRate;
    expect(k.rebut).toBe(rebut);
    expect(k.prixMonte).toBe(r2(m.trimestres[k.trimestre]!.coutDuCouvert * m.coefficient));
    expect(k.prixMonte).toBe(m.hausse.prixHt);
    // Le prix monté seul, puis avec la cuisine préparant pour ce qu'il sert.
    const seul = rejouerAvec("bistrot", "garde-mhr-prix-seul", (t, d) => (t === tour ? { ...d, price: k.prixMonte } : undefined))[k.trimestre]!;
    const planCarte = Math.ceil(Math.round(vendues(seul)) / (1 - rebut));
    const carte = rejouerAvec("bistrot", "garde-mhr-carte", (t, d) => (t === tour ? { ...d, price: k.prixMonte, productionPlan: planCarte } : undefined))[k.trimestre]!;
    const planJuste = Math.ceil(m.trimestres[k.trimestre]!.servis / (1 - rebut));
    const juste = rejouerAvec("bistrot", "garde-mhr-juste", (t, d) => (t === tour ? { ...d, productionPlan: planJuste } : undefined))[k.trimestre]!;
    for (const [nom, r, x] of [["carte", carte, k.carte], ["juste", juste, k.juste]] as const) {
      expect(x.prepares, nom).toBe(Math.round(r.production.produced));
      expect(x.servis, nom).toBe(Math.round(vendues(r)));
      expect(x.resultat, nom).toBe(Math.round(r.incomeStatement.operatingIncome));
      expect(x.denrees, nom).toBe(Math.round(r.incomeStatement.variableProductionCost - r.production.produced * s.product.otherVariableCostPerUnit));
      // La cuisine prépare de quoi servir chaque client : personne ne repart.
      expect(perdues(r), nom).toBeLessThan(0.5);
    }
    expect(k.carte.prepares).toBe(planCarte);
    expect(k.juste.prepares).toBe(planJuste);
    expect(k.carte.prix).toBe(k.prixMonte);
    expect(k.juste.prix).toBe(m.prix);
    expect(k.juste.servis).toBe(k.joue.servis);
    // Le prix monté garde le ratio ; il fait partir des clients.
    expect(Math.abs(k.carte.ratio - r1((k.carte.denrees / k.carte.chiffreDAffaires) * 100))).toBe(0);
    expect(k.carte.servis).toBeLessThan(k.joue.servis);
    expect(k.carte.ratio).toBeLessThan(k.juste.ratio);
    expect(k.meilleure).toBe("juste");
    expect(k.juste.resultat).toBeGreaterThan(k.carte.resultat);
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "les-ratios", cas)).toEqual([k.carte.ratio, k.juste.ratio]);
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "ce-que-ca-rapporte", cas)).toEqual([
      k.joue.servis - Math.round(vendues(carte)),
      Math.round(carte.incomeStatement.operatingIncome) - k.joue.resultat,
      Math.round(juste.incomeStatement.operatingIncome) - k.joue.resultat,
    ]);
    expect(k.joue.resultat).toBe(Math.round(anneeJouee("bistrot").partie.rounds[k.trimestre]!.results["joueur"]!.incomeStatement.operatingIncome));
  });

  it("chapitre et cas : des textes propres, et un cas qui tient ce qu'un cas dédié doit tenir", () => {
    textesPropres(LE_COUT_MATIERE, "bistrot");
    textesPropres(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "bistrot");
    casDedie(MONTER_LA_CARTE_OU_PREPARER_JUSTE, LE_COUT_MATIERE);
  });
});

describe("le taux d'occupation, le prix moyen et le revenu par chambre, chez l'hôtel", () => {
  const cas = casDeLEntreprise("hotel");
  const def = scenarioByCode("hotel");
  const s = def.scenario;
  const o = occupation(cas);
  const rounds = anneeJouee("hotel").partie.rounds;

  it("les chambres disponibles sont la capacité du scénario : ses chambres, une fois par nuit du trimestre", () => {
    const parc = s.equipment!.initialFleet.reduce((t, f) => t + f.count * s.equipment!.types.find((x) => x.code === f.typeCode)!.capacityPerUnit, 0);
    expect(o.nuits).toBe(s.roundDays);
    expect(o.chambres * o.nuits).toBe(parc);
    expect(o.chambres).toBe(60);
    for (const x of o.trimestres) expect(x.disponibles).toBe(parc);
  });

  it("les trois indicateurs de chaque trimestre sont ceux que l'arène affiche", () => {
    const kpi = (key: string, r: CompanyRoundResult) =>
      def.kpis.find((k) => k.key === key)!.compute({ result: r, previousSegments: null, segmentUnits: soldUnits(r), totalUnits: soldUnits(r), roundDays: s.roundDays, scenario: s })!;
    expect(rounds).toHaveLength(4);
    o.trimestres.forEach((x, k) => {
      const r = rounds[k]!.results["joueur"]!;
      expect(x.vendues).toBe(Math.round(vendues(r)));
      expect(x.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
      expect(x.occupation).toBe(r1((x.vendues / x.disponibles) * 100));
      expect(x.prixMoyen).toBe(r2(x.chiffreDAffaires / x.vendues));
      expect(x.revpar).toBe(r2(x.chiffreDAffaires / x.disponibles));
      expect(Math.abs(x.occupation - kpi("taux_occupation", r) * 100), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.1);
      expect(Math.abs(x.prixMoyen - kpi("pmc", r)), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.02);
      expect(Math.abs(x.revpar - kpi("revpar", r)), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.01);
      // RevPAR = occupation × prix moyen, à l'arrondi du taux près.
      expect(Math.abs(x.revpar - (x.occupation / 100) * x.prixMoyen), `trimestre ${k + 1}`).toBeLessThanOrEqual(0.05 * x.prixMoyen / 100 + 0.01);
    });
    expect(o.tarifTenu).toBe(true);
    expect(o.prixExacts).toEqual(rounds.map((t) => r2(t.results["joueur"]!.incomeStatement.revenue / soldUnits(t.results["joueur"]!))));
    expect(o.perdues).toBe(Math.round(perdues(rounds[o.plusFaible]!.results["joueur"]!)));
    // Dans l'année du bon gestionnaire, le trimestre le moins rempli a servi toute sa demande : la
    // phrase des nuitées demandées et non servies n'y est plus lue. Si elle revient, cette garde le dira.
    expect(o.perdues).toBe(0);
  });

  it("le concurrent du trimestre comparé loue plus cher, remplit moins et rapporte moins par chambre disponible", () => {
    const k = o.comparaison;
    const rival = def.bots.find((b) => b.name === k.rival.nom)!;
    expect(def.bots.slice(0, 2)).toContainEqual(rival);
    const r = rounds[k.trimestre]!.results[rival.id]!;
    expect(k.rival.vendues).toBe(Math.round(vendues(r)));
    expect(k.rival.chiffreDAffaires).toBe(Math.round(r.incomeStatement.revenue));
    expect(k.rival.disponibles).toBe(k.hotel.disponibles);
    expect(k.rival.prixMoyen).toBe(r2(Math.round(r.incomeStatement.revenue) / Math.round(vendues(r))));
    expect(k.rival.prixMoyen).toBeGreaterThan(k.hotel.prixMoyen);
    expect(k.rival.occupation).toBeLessThan(k.hotel.occupation);
    expect(k.rival.revpar).toBeLessThan(k.hotel.revpar);
    expect(k.rival.chiffreDAffaires).toBeLessThan(k.hotel.chiffreDAffaires);
    // Aucun trimestre plus tôt ne montrait un concurrent plus cher et moins rentable.
    for (let q = 0; q < k.trimestre; q++) {
      for (const b of def.bots.slice(0, 2)) {
        const x = rounds[q]!.results[b.id]!;
        const pm = r2(Math.round(x.incomeStatement.revenue) / Math.round(vendues(x)));
        const rp = r2(Math.round(x.incomeStatement.revenue) / o.trimestres[q]!.disponibles);
        expect(pm > o.trimestres[q]!.prixMoyen && rp < o.trimestres[q]!.revpar, `${b.name}, trimestre ${q + 1}`).toBe(false);
      }
    }
    // Dans l'année corrigée, aucun concurrent ne remplit mieux sans mieux vendre : celui qui remplit
    // le plus (Le Comptoir) a aussi le RevPAR le plus haut, à chaque trimestre.
    for (let q = 0; q < rounds.length; q++) {
      for (const b of def.bots.slice(0, 2)) {
        const x = rounds[q]!.results[b.id]!;
        const occ = r1((Math.round(vendues(x)) / o.trimestres[q]!.disponibles) * 100);
        const rp = r2(Math.round(x.incomeStatement.revenue) / o.trimestres[q]!.disponibles);
        expect(occ > o.trimestres[q]!.occupation && rp < o.trimestres[q]!.revpar, `${b.name}, trimestre ${q + 1}`).toBe(false);
      }
    }
    expect(k.rival.nom).toBe("Grand Hôtel Terminus");
    expect(k.autre.nom).toBe("Le Comptoir");
    expect(k.trimestre).toBe(0);
  });

  it("les champs du chapitre demandent ces chiffres-là", () => {
    const t = o.trimestres;
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "occupation", cas)).toEqual(t.map((x) => r1((x.vendues / x.disponibles) * 100)));
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "occupation", cas)).toEqual([63.4, 79.1, 87.2, 69]);
    expect(o.meilleur).toBe(2);
    expect(o.plusFaible).toBe(0);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "prix-moyen", cas)).toEqual([2, 0].map((k) => r2(t[k]!.chiffreDAffaires / t[k]!.vendues)));
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "revpar", cas)).toEqual(t.map((x) => r2(x.chiffreDAffaires / x.disponibles)));
    const dispo = t.reduce((a, x) => a + x.disponibles, 0);
    const vend = t.reduce((a, x) => a + x.vendues, 0);
    const ca = t.reduce((a, x) => a + x.chiffreDAffaires, 0);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "l-annee", cas)).toEqual([r1((vend / dispo) * 100), r2(ca / vend), r2(ca / dispo)]);
    const r = o.comparaison.rival;
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "face-au-concurrent", cas)).toEqual([r2(r.chiffreDAffaires / r.vendues), r2(r.chiffreDAffaires / r.disponibles)]);
  });

  it("le cas : toutes les chambres en vente, au tarif puis au prix du concurrent, rejouées sous une autre clé", () => {
    const a = alignement(cas);
    const k = a.trimestre;
    const tour = k + 1;
    // Le trimestre le plus faible, où des nuitées demandées n'ont pas été servies.
    // Le moins rempli des trimestres où l'hôtel a refusé des clients, et où un concurrent a rempli
    // mieux que lui à un prix plus bas : tout mettre en vente au tarif y change quelque chose.
    const candidats = o.trimestres
      .map((x, q) => ({ q, occupation: x.occupation }))
      .filter(({ q }) => {
        if (perdues(rounds[q]!.results["joueur"]!) < 0.5) return false;
        return def.bots.slice(0, 2).some((b) => {
          const y = rounds[q]!.results[b.id]!;
          return r1((Math.round(vendues(y)) / o.trimestres[q]!.disponibles) * 100) > o.trimestres[q]!.occupation && r2(Math.round(y.incomeStatement.revenue) / Math.round(vendues(y))) < o.trimestres[q]!.prixMoyen;
        });
      });
    expect(k).toBe(candidats.reduce((m, x) => (x.occupation < m.occupation ? x : m)).q);
    expect(k).toBe(3);
    expect(a.perdues).toBe(Math.round(perdues(rounds[k]!.results["joueur"]!)));
    expect(a.perdues).toBeGreaterThan(0);
    const rival = def.bots.find((b) => b.name === a.rival)!;
    expect(def.bots.slice(0, 2)).toContainEqual(rival);
    const x = rounds[k]!.results[rival.id]!;
    expect(a.prixDuConcurrent).toBe(r2(x.incomeStatement.revenue / soldUnits(x)));
    // Ce concurrent a rempli mieux que l'hôtel, à un prix moyen plus bas.
    expect(a.leRival.occupation).toBe(r1((Math.round(vendues(x)) / o.trimestres[k]!.disponibles) * 100));
    expect(a.leRival.occupation).toBeGreaterThan(o.trimestres[k]!.occupation);
    expect(a.leRival.prixMoyen).toBeLessThan(o.trimestres[k]!.prixMoyen);
    expect(a.rival).toBe("Le Comptoir");
    const dispo = o.trimestres[k]!.disponibles;
    const tarif = rejouerAvec("hotel", "garde-mhr-tarif", (t, d) => (t === tour ? { ...d, productionPlan: dispo } : undefined))[k]!;
    const prixBas = rejouerAvec("hotel", "garde-mhr-prix-bas", (t, d) => (t === tour ? { ...d, productionPlan: dispo, price: a.prixDuConcurrent } : undefined))[k]!;
    for (const [nom, r, y] of [["tarif", tarif, a.tarif], ["concurrent", prixBas, a.concurrent]] as const) {
      expect(y.vendues, nom).toBe(Math.round(vendues(r)));
      expect(y.chiffreDAffaires, nom).toBe(Math.round(r.incomeStatement.revenue));
      expect(y.resultat, nom).toBe(Math.round(r.incomeStatement.operatingIncome));
      expect(Math.round(r.production.produced), nom).toBe(dispo);
    }
    // Au tarif, le prix ne change pas ; au prix du concurrent, c'est son prix que l'hôtel fait.
    expect(r2(tarif.incomeStatement.revenue / soldUnits(tarif))).toBe(a.prixAuTarif);
    expect(r2(prixBas.incomeStatement.revenue / soldUnits(prixBas))).toBe(a.prixDuConcurrent);
    expect(a.misesEnVente).toBe(Math.round(rounds[k]!.results["joueur"]!.production.produced));
    expect(a.misesEnVente).toBeLessThan(dispo);
    // Le prix bas remplit plus. Le meilleur choix est le RevPAR le plus haut, seul de son rang :
    // dans l'année corrigée, c'est le prix du concurrent, qui rapporte plus par chambre disponible.
    expect(a.concurrent.occupation).toBeGreaterThan(a.tarif.occupation);
    const revpars = { joue: r2(Math.round(rounds[k]!.results["joueur"]!.incomeStatement.revenue) / dispo), tarif: a.tarif.revpar, concurrent: a.concurrent.revpar };
    expect(a.joue.revpar).toBe(revpars.joue);
    const max = Math.max(...Object.values(revpars));
    expect(Object.entries(revpars).filter(([, v]) => v === max).map(([n]) => n)).toEqual([a.meilleur]);
    expect(a.concurrent.revpar).toBeGreaterThan(a.tarif.revpar);
    expect(a.meilleur).toBe("concurrent");
    expect(a.ecartDeChiffre).toBeLessThan(0);
    // Les mêmes chambres en vente, les mêmes charges : l'écart de résultat est celui du chiffre d'affaires.
    expect(a.ecartDeResultat).toBe(a.ecartDeChiffre);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "les-deux-prix", cas)).toEqual([
      r1((Math.round(vendues(tarif)) / dispo) * 100),
      r2(Math.round(tarif.incomeStatement.revenue) / dispo),
      r1((Math.round(vendues(prixBas)) / dispo) * 100),
      r2(Math.round(prixBas.incomeStatement.revenue) / dispo),
    ]);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "l-ecart", cas)).toEqual([
      Math.round(vendues(prixBas)) - Math.round(vendues(tarif)),
      Math.round(tarif.incomeStatement.revenue) - Math.round(prixBas.incomeStatement.revenue),
    ]);
  });

  it("chapitre et cas : des textes propres, et un cas qui tient ce qu'un cas dédié doit tenir", () => {
    textesPropres(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "hotel");
    textesPropres(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "hotel");
    casDedie(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, OCCUPATION_ET_REVENU_PAR_CHAMBRE);
  });
});
