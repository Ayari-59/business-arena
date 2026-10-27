import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { GRAINE_DU_COURS, anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DU_TRANSPORT,
  LE_TAUX_DE_REMPLISSAGE,
  remplissage,
  transportees,
} from "../../src/config/cours/chapitres/le-taux-de-remplissage";
import {
  CARTE_DE_LA_PANNE,
  LIVRER_A_TEMPS,
  SEUIL_DE_SURCHAUFFE_PAR_DEFAUT,
  TRIMESTRE_DU_SERVICE,
  avecLaPanne,
  seuilDeSurchauffe,
  service,
} from "../../src/config/cours/chapitres/livrer-a-temps";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  COMBIEN_CHARGER_PENDANT_LA_PANNE,
  chargementPendantLaPanne,
} from "../../src/config/cours/situations/par-chapitre/combien-charger-pendant-la-panne";
import {
  LE_LOT_DE_LA_BOURSE_DE_FRET,
  TRIMESTRE_DU_LOT,
  lotDeLaBourse,
} from "../../src/config/cours/situations/par-chapitre/le-lot-de-la-bourse-de-fret";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { TRANSPORT_KPIS } from "../../src/config/scenarios/sector-kpis";
import { computeProducedQuality } from "../../src/engine/production";
import { orderOfferForRound } from "../../src/engine/simulation";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU PARCOURS 2DE PRO GATL SUR LE TRANSPORT, ET LEURS CAS PRATIQUES.
 *
 * Le taux de remplissage des véhicules (la capacité de la flotte, ce qu'elle a transporté, les
 * charges fixes d'une palette, ce que rapporterait de la remplir) et la livraison à temps (le taux
 * de service, le client refusé, la flotte trop chargée, la panne). Ces gardes recomposent leurs
 * chiffres avec le moteur chez ROUTE & CIE : la flotte du scénario, l'indicateur « Taux de
 * remplissage » de l'écran, le compte de résultat du trimestre, la demande des clientèles, les
 * années rejouées (la flotte remplie, toute la demande servie, toute la flotte chargée, la panne,
 * le lot de la bourse de fret, les trois chargements pendant la panne). Et elles vérifient que les
 * textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, des élisions faites, des
 * accords justes avec les palettes, une seule bonne réponse, aucune option qui en contienne une
 * autre, des libellés uniques.
 */

const CODE = "transport";

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas), ...tableau];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "demandé", "servi", "produit", "dernier", "préparé", "perdu", "livré", "prévu", "chargé", "transporté", "refusé", "proposé"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/« «|» »/);
      // Pas de capitales espacées, pas de nombre écrit en toutes lettres là où le registre donne un chiffre.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
      // Le tableau ne se montre qu'avec une lecture, un choix, des montants ou un tri.
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
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
      const codes = new Set(e.categories.map((k) => k.code));
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) {
        expect(codes.has(x.categorie), `${e.id} : ${x.libelle}`).toBe(true);
        expect(x.libelle, e.id).not.toContain('"');
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse du cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Les champs d'une étape de montants, par libellé. */
function champs(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants`);
  return Object.fromEntries(e.champs(cas, { soldes: {} }).map((c) => [c.libelle, c.attendu]));
}

const justeDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${id} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const elementsDuTri = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "tri") throw new Error(`${id} n'est pas un tri`);
  return e.elements(cas);
};

const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const demandeDe = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.demandForCompany, 0);
const sommeOp = (a: readonly CompanyRoundResult[]) => a.reduce((t, r) => t + r.incomeStatement.operatingIncome, 0);

/** Le taux de remplissage tel que l'écran le calcule (indicateurs du métier du transport). */
function tauxDeLEcran(r: CompanyRoundResult): number {
  const s = scenarioByCode(CODE).scenario;
  const segmentUnits = Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
  const totalUnits = segmentUnits + (r.extraOrders?.delivered ?? 0) + (r.orderOffer?.delivered ?? 0) + (r.subscription?.retained ?? 0);
  const kpi = TRANSPORT_KPIS.find((k) => k.key === "taux_remplissage")!;
  expect(kpi.label).toBe("Taux de remplissage");
  return kpi.compute({ result: r, previousSegments: null, segmentUnits, totalUnits, roundDays: s.roundDays, scenario: s })! * 100;
}

describe("les deux chapitres et leurs cas, dans le parcours 2de pro GATL · le transport et la logistique", () => {
  it("portent les titres du programme, au palier 1, et des blocs du référentiel de seconde pro GATL qui se résolvent", () => {
    const attendus: [Chapitre, string[]][] = [
      [
        LE_TAUX_DE_REMPLISSAGE,
        ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion", "2de pro GATL · 2 · Organiser et planifier l'activité"],
      ],
      [
        LIVRER_A_TEMPS,
        [
          "2de pro GATL · 2 · Organiser et planifier l'activité",
          "2de pro GATL · 5 · Assurer le respect de la réglementation, des normes et traiter les dysfonctionnements",
        ],
      ],
    ];
    for (const [ch, blocs] of attendus) {
      expect(PROGRAMME.logistique[1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("logistique");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(blocs);
      for (const bloc of blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite?.code, bloc).toBe("seconde-pro-gatl");
        expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace("2de pro GATL · ", ""));
      }
    }
    expect(LE_TAUX_DE_REMPLISSAGE.code).toBe("le-taux-de-remplissage");
    expect(LIVRER_A_TEMPS.code).toBe("livrer-a-temps");
  });

  it("se jouent chez le seul transporteur du cours, et le disent", () => {
    expect([...ENTREPRISES_DU_TRANSPORT]).toEqual(["transport"]);
    for (const ch of [LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS]) {
      expect(ch.entreprises?.codes, ch.code).toBe(ENTREPRISES_DU_TRANSPORT);
      expect(ch.entreprises?.pourquoi.length, ch.code).toBeGreaterThan(20);
    }
    // Une flotte de véhicules et la panne de la flotte : le transport seul, parmi les entreprises du cours.
    for (const code of ENTREPRISES_DU_COURS) {
      const def = scenarioByCode(code);
      const flotte = def.vocabulary.capacityLabel === "Capacité de la flotte";
      const panne = def.scenario.events.some((e) => e.code === CARTE_DE_LA_PANNE);
      expect(flotte || panne, code).toBe(code === CODE);
    }
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_LOT_DE_LA_BOURSE_DE_FRET, LE_TAUX_DE_REMPLISSAGE],
      [COMBIEN_CHARGER_PENDANT_LA_PANNE, LIVRER_A_TEMPS],
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
    }
  });

  it("textes propres, une seule bonne réponse, notions existantes, et des réponses qui ne se devinent pas à leur longueur", () => {
    for (const ch of [LE_TAUX_DE_REMPLISSAGE, LIVRER_A_TEMPS, LE_LOT_DE_LA_BOURSE_DE_FRET, COMBIEN_CHARGER_PENDANT_LA_PANNE]) verifierLesTextes(ch, CODE);
    for (const s of [LE_LOT_DE_LA_BOURSE_DE_FRET, COMBIEN_CHARGER_PENDANT_LA_PANNE]) reponseSansIndice(s, CODE);
  });

  it("l'année du cours est celle que rejoue la référence des comparaisons, sans défaillance", () => {
    const { partie } = anneeJouee(CODE);
    const reference = anneeDeReference(CODE);
    expect(reference).toHaveLength(partie.rounds.length);
    partie.rounds.forEach((t, k) => {
      expect(reference[k]!.incomeStatement.operatingIncome).toBeCloseTo(t.results["joueur"]!.incomeStatement.operatingIncome, 6);
      expect(t.results["joueur"]!.defaillant ?? false).toBe(false);
    });
  });
});

describe("le taux de remplissage chez ROUTE & CIE", () => {
  const cas = casDeLEntreprise(CODE);
  const def = scenarioByCode(CODE);
  const s = def.scenario;
  const { partie, depart } = anneeJouee(CODE);
  const annee = partie.rounds.map((t) => t.results["joueur"]!);
  const k = remplissage(cas);
  const r = annee[k.t - 1]!;

  it("la capacité de la flotte est celle du parc de départ, et celle que le moteur offre chaque trimestre", () => {
    const types = new Map(s.equipment!.types.map((t) => [t.code, t]));
    const parc = s.equipment!.initialFleet!.reduce((t, l) => t + l.count * types.get(l.typeCode)!.capacityPerUnit, 0);
    expect(champs(LE_TAUX_DE_REMPLISSAGE, "capacite", cas)["Capacité de la flotte (palettes)"]).toBe(parc);
    expect(parc).toBe(depart.machineCapacity);
    expect(k.vehicules.map((v) => v.nom)).toEqual(["Fourgon urbain", "Porteur 12 t", "Semi-remorque"]);
    expect(k.vehicules.reduce((t, v) => t + v.nombre, 0)).toBe(depart.fleet!.reduce((t, l) => t + l.count, 0));
    // La disponibilité est restée à 100 % toute l'année : la capacité offerte est celle du parc.
    for (const x of annee) expect(x.production.machineCapacity).toBeCloseTo(parc, 6);
    expect(k.toujoursDisponible).toBe(true);
    expect(def.vocabulary.capacityLabel).toBe("Capacité de la flotte");
    expect(def.vocabulary.productionPlanLabel).toBe("Palettes à charger");
  });

  it("le taux de remplissage est celui de l'écran, au trimestre le moins rempli de l'année", () => {
    const taux = annee.map(tauxDeLEcran);
    const t = taux.indexOf(Math.min(...taux)) + 1;
    expect(k.t).toBe(t);
    expect(k.t).toBe(2);
    const m = champs(LE_TAUX_DE_REMPLISSAGE, "remplissage", cas);
    expect(m[`Taux de remplissage du trimestre ${t} (%)`]).toBe(auDixieme(taux[t - 1]!));
    expect(m[`Taux de remplissage du trimestre ${t} (%)`]).toBe(60.9);
    expect(m[`Places vides au trimestre ${t} (palettes)`]).toBe(Math.round(r.production.machineCapacity - transportees(r)));
    expect(m[`Places vides au trimestre ${t} (palettes)`]).toBe(3909);
    k.trimestres.forEach((x, i) => expect(x.taux).toBe(auDixieme(taux[i]!)));
  });

  it("le trimestre lu n'a rien chargé pour rien, et n'a livré aucune commande exceptionnelle", () => {
    expect(r.production.produced).toBeCloseTo(transportees(r), 6);
    expect(r.production.produced).toBeCloseTo(r.production.planned, 6);
    expect(r.orderOffer?.delivered ?? 0).toBe(0);
    expect(r.extraOrders?.delivered ?? 0).toBe(0);
    expect(k.limiteeParLeChargement).toBe(true);
  });

  it("les charges du tri sont celles du compte de résultat du trimestre", () => {
    const el = Object.fromEntries(elementsDuTri(LE_TAUX_DE_REMPLISSAGE, "charges", cas).map((x) => [x.libelle, x]));
    const gazole = el[def.vocabulary.materialLabel]!;
    const autres = el[def.vocabulary.otherVariableLabel]!;
    expect(gazole.categorie).toBe("variable");
    expect(autres.categorie).toBe("variable");
    expect(auCentime(gazole.montant + autres.montant)).toBeCloseTo(r.incomeStatement.variableProductionCost, 1);
    expect(autres.montant).toBeCloseTo(r.production.produced * s.product.otherVariableCostPerUnit, 2);
    const structure = el["Charges de structure (chauffeurs, loyers, assurances)"]!;
    const amortissements = el["Dotations aux amortissements des véhicules"]!;
    expect(structure.categorie).toBe("fixe");
    expect(amortissements.categorie).toBe("fixe");
    expect(structure.montant).toBe(s.fixedCostsPerRound);
    expect(structure.montant).toBe(r.incomeStatement.fixedCosts);
    // Les amortissements des véhicules : le prix de chacun sur sa durée d'amortissement.
    const types = new Map(s.equipment!.types.map((t) => [t.code, t]));
    const dotation = depart.fleet!.reduce((t, l) => t + (l.count * types.get(l.typeCode)!.costPerUnit) / types.get(l.typeCode)!.depreciationRounds, 0);
    expect(amortissements.montant).toBeCloseTo(dotation, 2);
    expect(amortissements.montant).toBeCloseTo(r.incomeStatement.depreciation, 2);
  });

  it("les charges fixes d'une palette se recomposent", () => {
    const m = champs(LE_TAUX_DE_REMPLISSAGE, "charges-fixes", cas);
    const fixes = Math.round(r.incomeStatement.fixedCosts + r.incomeStatement.depreciation);
    expect(m[`Charges fixes du trimestre ${k.t}`]).toBe(fixes);
    expect(m[`Charges fixes du trimestre ${k.t}`]).toBe(206018);
    expect(m["Charges fixes par palette transportée"]).toBe(auCentime(fixes / Math.round(transportees(r))));
    expect(m["Charges fixes par palette transportée"]).toBe(33.82);
    expect(m["Charges fixes par palette, flotte pleine"]).toBe(auCentime(fixes / Math.round(r.production.machineCapacity)));
    expect(m["Charges fixes par palette, flotte pleine"]).toBe(20.6);
  });

  it("les clients refusés sont la demande que le moteur perd, et la flotte pouvait en prendre une partie", () => {
    const m = champs(LE_TAUX_DE_REMPLISSAGE, "refusees", cas);
    const perdues = Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
    expect(Math.abs(m[`Palettes refusées au trimestre ${k.t}`]! - perdues)).toBeLessThanOrEqual(1);
    expect(m[`Palettes refusées au trimestre ${k.t}`]).toBe(3302);
    expect(m["Palettes en plus que la flotte pouvait charger"]).toBe(Math.min(m[`Palettes refusées au trimestre ${k.t}`]!, k.placesVides));
    expect(m["Palettes en plus que la flotte pouvait charger"]).toBe(3302);
    // Toutes les palettes refusées tiennent dans les places vides : c'est cette explication que l'élève lit.
    expect(k.refusees).toBeLessThanOrEqual(k.placesVides);
    // Les trois clientèles du scénario, et la bourse de fret au prix du jour parmi elles.
    expect(k.clienteles.map((x) => x.code)).toEqual(s.market.segments.map((g) => g.code));
    expect(k.clienteles.map((x) => x.nom)).toContain("Bourse de fret (comptant, prix du jour)");
  });

  it("la marge d'une palette est le prix décidé moins le coût variable du trimestre", () => {
    const m = champs(LE_TAUX_DE_REMPLISSAGE, "marge", cas);
    const segments = Object.values(r.market.bySegment);
    const prix = segments.reduce((t, v) => t + v.revenue, 0) / segments.reduce((t, v) => t + v.sold, 0);
    // Le trimestre 2 précède la hausse du gazole scriptée au trimestre 3 : son gazole est celui du scénario.
    const gazole = s.events.find((e) => e.code === "transport_gazole")!;
    expect(s.scriptedEvents).toContainEqual({ round: 3, eventCode: "transport_gazole" });
    expect(k.t).toBeLessThan(3);
    const cv = s.product.materialCostPerUnit + s.product.otherVariableCostPerUnit;
    expect(r.breakeven.unitVariableCost).toBeCloseTo(cv, 6);
    // La hausse, elle, se lit au trimestre 3 : le chapitre ne la compte pas.
    expect(annee[2]!.breakeven.unitVariableCost).toBeCloseTo(s.product.materialCostPerUnit * gazole.modifiers[0]!.value + s.product.otherVariableCostPerUnit, 6);
    expect(m["Marge par palette"]).toBe(auCentime(prix - cv));
    expect(m["Marge par palette"]).toBe(43);
    const enPlus = champs(LE_TAUX_DE_REMPLISSAGE, "refusees", cas)["Palettes en plus que la flotte pouvait charger"]!;
    expect(m["Marge en plus, flotte remplie"]).toBe(auCentime(enPlus * m["Marge par palette"]!));
    expect(m["Marge en plus, flotte remplie"]).toBeCloseTo(141986, 2);
  });

  it("l'arène rejoue le trimestre, la flotte remplie : le résultat gagne toute la marge en plus", () => {
    // Rejouée ici, sous une clé du test : la flotte chargée autant qu'elle porte, sans dépasser la demande.
    const avec = rejouerAvec(CODE, `test-logistique:remplir-le-trimestre-${k.t}`, (tour, d) =>
      tour === k.t ? { ...d, productionPlan: Math.min(r.production.machineCapacity, demandeDe(r)) } : undefined,
    );
    const x = avec[k.t - 1]!;
    // Les trimestres d'avant n'ont pas bougé.
    for (let i = 0; i < k.t - 1; i++) expect(avec[i]!.incomeStatement.operatingIncome).toBeCloseTo(annee[i]!.incomeStatement.operatingIncome, 6);
    expect(x.defaillant ?? false).toBe(false);
    expect(x.production.produced).toBeCloseTo(Math.min(r.production.machineCapacity, demandeDe(r)), 6);
    expect(auDixieme(tauxDeLEcran(x))).toBe(k.tauxApres);
    // La demande du trimestre ne dépend pas du chargement du même trimestre.
    expect(demandeDe(x)).toBeCloseTo(demandeDe(r), 6);
    // Les charges fixes n'ont pas bougé ; l'écart de résultat est la marge des palettes en plus.
    expect(x.incomeStatement.fixedCosts).toBe(r.incomeStatement.fixedCosts);
    expect(x.incomeStatement.depreciation).toBeCloseTo(r.incomeStatement.depreciation, 6);
    const ecart = x.incomeStatement.operatingIncome - r.incomeStatement.operatingIncome;
    expect(ecart).toBeCloseTo((transportees(x) - transportees(r)) * (k.prix - r.breakeven.unitVariableCost), 0);
    expect(k.resultatApres).toBe(Math.round(x.incomeStatement.operatingIncome));
    expect(Math.abs(k.ecart - k.margeEnPlus)).toBeLessThanOrEqual(k.marge);
    expect(k.verdict).toBe("toute-la-marge");
    expect(justeDe(LE_TAUX_DE_REMPLISSAGE, "arene", cas)).toBe("Il monte de toute la marge en plus : les charges fixes ne bougent pas");
  });
});

describe("livrer à temps chez ROUTE & CIE", () => {
  const cas = casDeLEntreprise(CODE);
  const s = scenarioByCode(CODE).scenario;
  const { partie } = anneeJouee(CODE);
  const annee = partie.rounds.map((t) => t.results["joueur"]!);
  const k = service(cas);
  const T = TRIMESTRE_DU_SERVICE;
  const r = annee[T - 1]!;

  it("l'arène ne compte aucun délai de livraison : ses seuls délais en jours sont ceux des paiements", () => {
    const texte = JSON.stringify(s);
    const delais = [...texte.matchAll(/"([A-Za-z]*Days)"/g)].map((m) => m[1]!);
    expect(new Set(delais)).toEqual(new Set(["roundDays", "paymentDelayDays", "supplierPaymentDelayDays"]));
  });

  it("le taux de service se recompose avec la demande et les ventes du moteur", () => {
    annee.forEach((x, i) => {
      expect(k.trimestres[i]!.demandees).toBe(Math.round(demandeDe(x)));
      expect(k.trimestres[i]!.livrees).toBe(Math.round(soldUnits(x)));
    });
    const m = champs(LIVRER_A_TEMPS, "taux-de-service", cas);
    const demandees = annee.reduce((t, x) => t + demandeDe(x), 0);
    const livrees = annee.reduce((t, x) => t + soldUnits(x), 0);
    expect(Math.abs(m["Palettes refusées sur l'année"]! - (demandees - livrees))).toBeLessThanOrEqual(2);
    expect(m["Palettes refusées sur l'année"]).toBe(11515);
    expect(Math.abs(m["Taux de service de l'année (%)"]! - (livrees / demandees) * 100)).toBeLessThanOrEqual(0.1);
    expect(m["Taux de service de l'année (%)"]).toBe(69.9);
  });

  it("ce que coûte un client refusé : la marge perdue, que l'arène retrouve en servant toute la demande", () => {
    const m = champs(LIVRER_A_TEMPS, "client-refuse", cas);
    expect(m["Marge par palette au trimestre 1"]).toBe(auCentime(r.incomeStatement.revenue / soldUnits(r) - r.breakeven.unitVariableCost));
    expect(m["Marge par palette au trimestre 1"]).toBe(43);
    expect(m["Marge perdue au trimestre 1"]).toBe(71251);
    const servie = rejouerAvec(CODE, `test-logistique:toute-la-demande-au-trimestre-${T}`, (tour, d) => (tour === T ? { ...d, productionPlan: demandeDe(r) } : undefined));
    expect(k.tousServis.resultat).toBe(Math.round(servie[T - 1]!.incomeStatement.operatingIncome));
    const gain = servie[T - 1]!.incomeStatement.operatingIncome - r.incomeStatement.operatingIncome;
    const perdues = Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
    expect(gain).toBeCloseTo(perdues * (k.prix - r.breakeven.unitVariableCost), 0);
    expect(Math.abs(gain - m["Marge perdue au trimestre 1"]!)).toBeLessThanOrEqual(k.marge);
  });

  it("le client refusé revient : la demande suivante ne dépend pas de ce qui a été livré", () => {
    const servie = rejouerAvec(CODE, `test-logistique:toute-la-demande-au-trimestre-${T}`, (tour, d) => (tour === T ? { ...d, productionPlan: demandeDe(r) } : undefined));
    expect(k.tousServis.demandeSuivante).toBe(Math.round(demandeDe(servie[T]!)));
    // Le moteur garde, pour la fidélité, la part de la demande gagnée, pas la part livrée.
    const etat = anneeJouee(CODE).partie.rounds[T - 1]!.companies.find((x) => x.id === "joueur")!;
    for (const [seg, v] of Object.entries(r.market.bySegment)) expect(etat.lastMarketShare[seg]).toBeCloseTo(v.share, 9);
    expect(servie[T - 1]!.production.utilizationRate).toBeLessThanOrEqual(seuilDeSurchauffe(CODE));
    expect(servie[T - 1]!.production.producedQuality).toBeCloseTo(r.production.producedQuality, 9);
    expect(demandeDe(servie[T]!)).toBeCloseTo(demandeDe(annee[T]!), 6);
    expect(k.ecartDuClientRefuse).toBe("meme");
    expect(justeDe(LIVRER_A_TEMPS, "revient", cas)).toBe("La même : le client refusé revient avec la même demande");
  });

  it("toute la flotte chargée : la qualité de service baisse au-dessus du seuil, et la demande suivante avec elle", () => {
    expect(seuilDeSurchauffe(CODE)).toBe(SEUIL_DE_SURCHAUFFE_PAR_DEFAUT);
    expect(s.production.overheatThreshold).toBeUndefined();
    // Le seuil du moteur : rien ne baisse à 95 % de la capacité, la qualité baisse au-dessus.
    const qualite = (u: number) => computeProducedQuality({ qualityBudget: 0, qualitySensitivity: 0.3, qualityScale: 1000, utilizationRate: u });
    expect(qualite(SEUIL_DE_SURCHAUFFE_PAR_DEFAUT)).toBe(qualite(0.5));
    expect(qualite(SEUIL_DE_SURCHAUFFE_PAR_DEFAUT + 0.01)).toBeLessThan(qualite(0.5));
    const pleine = rejouerAvec(CODE, `test-logistique:toute-la-flotte-au-trimestre-${T}`, (tour, d) => (tour === T ? { ...d, productionPlan: r.production.machineCapacity } : undefined));
    expect(k.flottePleine.demandeSuivante).toBe(Math.round(demandeDe(pleine[T]!)));
    expect(pleine[T - 1]!.production.utilizationRate).toBeCloseTo(1, 9);
    expect(pleine[T - 1]!.production.producedQuality).toBeLessThan(r.production.producedQuality);
    expect(demandeDe(pleine[T]!)).toBeLessThan(demandeDe(annee[T]!) - 1);
    expect(k.flottePleine.demandeSuivante).toBe(9281);
    expect(k.ecartDeLaFlottePleine).toBe("moins");
    expect(justeDe(LIVRER_A_TEMPS, "flotte-pleine", cas)).toBe("La demande baisse : la flotte trop chargée a moins bien livré");
    // Les palettes chargées sans client : leur coût variable est perdu, à l'euro près.
    const servie = rejouerAvec(CODE, `test-logistique:toute-la-demande-au-trimestre-${T}`, (tour, d) => (tour === T ? { ...d, productionPlan: demandeDe(r) } : undefined));
    const perte = servie[T - 1]!.incomeStatement.operatingIncome - pleine[T - 1]!.incomeStatement.operatingIncome;
    expect(Math.abs(perte - k.flottePleine.gaspillage)).toBeLessThanOrEqual(1);
  });

  it("la clientèle la plus sensible à la qualité de service est celle des industriels, et la qualité perçue se retient", () => {
    const max = Math.max(...s.market.segments.map((g) => g.qualitySensitivity));
    expect(s.market.segments.find((g) => g.qualitySensitivity === max)!.code).toBe("industriels");
    expect(k.plusExigeante).toBe("Industriels sous contrat");
    expect(s.production.qualityInertia).toBeGreaterThan(0.5);
  });

  it("la panne : la capacité que le moteur offre, le seuil dépassé, et ce qu'elle laisse sur l'année", () => {
    const carte = s.events.find((e) => e.code === CARTE_DE_LA_PANNE)!;
    expect(carte.scope).toBe("company");
    expect(carte.probability).toBe(0);
    expect(carte.duration).toBe(1);
    expect(carte.modifiers).toEqual([{ target: "availability", op: "mul", value: 0.72 }]);
    const m = champs(LIVRER_A_TEMPS, "panne", cas);
    const enPanne = rejouerAvec(CODE, "test-logistique:panne-au-trimestre-1", () => undefined, (x) => ({
      ...x,
      scriptedEvents: [...x.scriptedEvents, { round: T, eventCode: CARTE_DE_LA_PANNE }],
    }));
    expect(avecLaPanne(T)(s).scriptedEvents).toContainEqual({ round: T, eventCode: CARTE_DE_LA_PANNE });
    const p = enPanne[T - 1]!;
    expect(m["Capacité de la flotte pendant la panne (palettes)"]).toBe(Math.round(p.production.machineCapacity));
    expect(m["Capacité de la flotte pendant la panne (palettes)"]).toBe(7200);
    expect(m["Part de la capacité chargée pendant la panne (%)"]).toBe(auDixieme(p.production.utilizationRate * 100));
    expect(m["Part de la capacité chargée pendant la panne (%)"]).toBe(99.5);
    // La panne ne dure qu'un trimestre, et toutes les palettes prévues partent.
    expect(enPanne[T]!.production.machineCapacity).toBeCloseTo(r.production.machineCapacity, 6);
    expect(transportees(p)).toBeCloseTo(transportees(r), 6);
    expect(p.production.producedQuality).toBeLessThan(r.production.producedQuality);
    for (const x of enPanne) expect(x.defaillant ?? false).toBe(false);
    // La qualité perdue fait baisser la demande des trimestres suivants. Mais la flotte y refuse encore des
    // clients : ce qu'elle charge, et donc ce qu'elle livre et gagne, ne bouge pas.
    const demandeEnsuite = (a: readonly CompanyRoundResult[]) => a.slice(T).reduce((t, x) => t + demandeDe(x), 0);
    expect(demandeEnsuite(enPanne)).toBeLessThan(demandeEnsuite(annee) - 1);
    expect(k.panne.demandeEnsuiteAvant - k.panne.demandeEnsuiteApres).toBe(Math.round(demandeEnsuite(annee)) - Math.round(demandeEnsuite(enPanne)));
    for (let i = T; i < enPanne.length; i++) {
      expect(soldUnits(enPanne[i]!)).toBeCloseTo(soldUnits(annee[i]!), 6);
      expect(demandeDe(enPanne[i]!) - soldUnits(enPanne[i]!)).toBeGreaterThanOrEqual(1);
    }
    expect(k.panne.refuseEnsuite).toBe(true);
    expect(sommeOp(enPanne)).toBeCloseTo(sommeOp(annee), 6);
    expect(k.panne.resultatAvant).toBe(Math.round(sommeOp(annee)));
    expect(k.panne.resultatApres).toBe(Math.round(sommeOp(enPanne)));
    expect(k.coutDeLaPanne).toBe("rien");
    expect(justeDe(LIVRER_A_TEMPS, "cout-de-la-panne", cas)).toBe("Rien : les clients perdus ensuite auraient été refusés");
  });
});

describe("le lot de la bourse de fret chez ROUTE & CIE", () => {
  const cas = casDeLEntreprise(CODE);
  const s = scenarioByCode(CODE).scenario;
  const { partie } = anneeJouee(CODE);
  const annee = partie.rounds.map((t) => t.results["joueur"]!);
  const T = TRIMESTRE_DU_LOT;
  const r = annee[T - 1]!;
  const k = lotDeLaBourse(cas);

  it("le lot est la commande que l'arène du cours propose au trimestre, au prix du catalogue", () => {
    const offre = orderOfferForRound(s, T, GRAINE_DU_COURS)!;
    expect(offre.code).toBe("transport_offer_bourse");
    expect(r.orderOffer?.code).toBe(offre.code);
    expect(r.orderOffer?.accepted).toBe(false);
    expect(k.unitesDuLot).toBe(offre.units);
    expect(k.prixDuLot).toBe(offre.price);
    expect(offre.paymentDelayDays).toBe(0);
  });

  it("les places, la marge et les charges fixes se recomposent", () => {
    const places = champs(LE_LOT_DE_LA_BOURSE_DE_FRET, "places", cas);
    expect(places["Places libres après les clients (palettes)"]).toBe(Math.round(r.production.machineCapacity) - Math.round(demandeDe(r)));
    expect(places["Places libres après les clients (palettes)"]).toBe(607);
    expect(places["Palettes du lot chargées"]).toBe(Math.min(k.unitesDuLot, 607));
    const marge = champs(LE_LOT_DE_LA_BOURSE_DE_FRET, "marge", cas);
    expect(marge["Marge par palette du lot"]).toBe(auCentime(k.prixDuLot - r.breakeven.unitVariableCost));
    expect(marge["Marge par palette du lot"]).toBe(27);
    expect(marge["Marge du lot"]).toBe(16389);
    const fixes = champs(LE_LOT_DE_LA_BOURSE_DE_FRET, "charges-fixes", cas);
    const charges = Math.round(r.incomeStatement.fixedCosts + r.incomeStatement.depreciation);
    expect(fixes["Charges fixes par palette, sans le lot"]).toBe(auCentime(charges / 9393));
    expect(fixes["Charges fixes par palette, avec le lot"]).toBe(auCentime(charges / 10000));
  });

  it("l'arène sert les clients d'abord, le lot sur les places qui restent, et l'année garde un gain", () => {
    const sans = rejouerAvec(CODE, "test-logistique:les-clients-seuls", (tour, d) => (tour === T ? { ...d, productionPlan: demandeDe(r), acceptOrder: false } : undefined));
    const avec = rejouerAvec(CODE, "test-logistique:les-clients-et-le-lot", (tour, d) =>
      tour === T ? { ...d, productionPlan: Math.min(r.production.machineCapacity, demandeDe(r) + k.unitesDuLot), acceptOrder: true } : undefined,
    );
    for (const a of [sans, avec]) for (const x of a) expect(x.defaillant ?? false).toBe(false);
    expect(sans[T - 1]!.orderOffer?.delivered ?? 0).toBe(0);
    expect(soldUnits(sans[T - 1]!)).toBeCloseTo(demandeDe(r), 6);
    expect(soldUnits(avec[T - 1]!)).toBeCloseTo(demandeDe(r), 6);
    const livre = avec[T - 1]!.orderOffer!.delivered;
    expect(livre).toBeCloseTo(r.production.machineCapacity - demandeDe(r), 6);
    expect(Math.abs(livre - k.palettesDuLot)).toBeLessThanOrEqual(1);
    const gainT = avec[T - 1]!.incomeStatement.operatingIncome - sans[T - 1]!.incomeStatement.operatingIncome;
    expect(gainT).toBeCloseTo(livre * (k.prixDuLot - r.breakeven.unitVariableCost), 0);
    const m = champs(LE_LOT_DE_LA_BOURSE_DE_FRET, "arene", cas);
    expect(m["Écart de résultat au trimestre 2"]).toBe(Math.round(avec[T - 1]!.incomeStatement.operatingIncome) - Math.round(sans[T - 1]!.incomeStatement.operatingIncome));
    expect(m["Écart de résultat sur l'année"]).toBe(Math.round(sommeOp(avec)) - Math.round(sommeOp(sans)));
    expect(m["Écart de résultat sur l'année"]).toBe(7652);
    expect(m["Écart de résultat sur l'année"]!).toBeLessThan(m["Écart de résultat au trimestre 2"]!);
    // Chargée à 100 %, la flotte a dépassé le seuil : la demande du trimestre suivant baisse.
    expect(demandeDe(avec[T]!)).toBeLessThan(demandeDe(sans[T]!));
    expect(k.reponse).toBe("accepter");
    expect(justeDe(LE_LOT_DE_LA_BOURSE_DE_FRET, "reponse", cas)).toBe("Accepter le lot, pour remplir les places vides");
  });
});

describe("combien charger pendant la panne chez ROUTE & CIE", () => {
  const cas = casDeLEntreprise(CODE);
  const { partie } = anneeJouee(CODE);
  const r = partie.rounds[TRIMESTRE_DU_SERVICE - 1]!.results["joueur"]!;
  const k = chargementPendantLaPanne(cas);

  it("la capacité pendant la panne et le chargement au seuil se recomposent", () => {
    const m = champs(COMBIEN_CHARGER_PENDANT_LA_PANNE, "flotte", cas);
    expect(m["Capacité pendant la panne (palettes)"]).toBe(7200);
    expect(m["Chargement à 95 % de la capacité (palettes)"]).toBe(6840);
    const c = champs(COMBIEN_CHARGER_PENDANT_LA_PANNE, "charger-moins", cas);
    expect(c["Palettes refusées en plus"]).toBe(Math.round(r.production.planned) - 6840);
    expect(c["Palettes refusées en plus"]).toBe(326);
    expect(c["Marge perdue au trimestre 1"]).toBe(14018);
  });

  it("les trois années rejouées : au seuil, la qualité tient ; le chargement prévu reprend l'année du chapitre", () => {
    const T = TRIMESTRE_DU_SERVICE;
    const panne = avecLaPanne(T);
    const avecLePlan = (cle: string, plan: number) => rejouerAvec(CODE, `test-logistique:panne-et-${cle}`, (tour, d) => (tour === T ? { ...d, productionPlan: plan } : undefined), panne);
    const enPanne = avecLePlan("le-chargement-prevu", r.production.planned);
    const auSeuil = avecLePlan("le-seuil", 6840);
    const plein = avecLePlan("toutes-les-places", 7200);
    expect(enPanne[T - 1]!.production.machineCapacity).toBe(7200);
    expect(auSeuil[T - 1]!.production.utilizationRate).toBeLessThanOrEqual(seuilDeSurchauffe(CODE));
    expect(auSeuil[T - 1]!.production.producedQuality).toBeCloseTo(r.production.producedQuality, 9);
    expect(plein[T - 1]!.production.utilizationRate).toBeCloseTo(1, 9);
    expect(k.annees.garder.resultatAnnee).toBe(Math.round(sommeOp(enPanne)));
    expect(k.annees.baisser.resultatAnnee).toBe(Math.round(sommeOp(auSeuil)));
    expect(k.annees.remplir.resultatAnnee).toBe(Math.round(sommeOp(plein)));
    for (const a of [enPanne, auSeuil, plein]) for (const x of a) expect(x.defaillant ?? false).toBe(false);
    // La marge perdue au trimestre 1 est l'écart de résultat du trimestre, à une palette près.
    const ecartT = enPanne[T - 1]!.incomeStatement.operatingIncome - auSeuil[T - 1]!.incomeStatement.operatingIncome;
    expect(Math.abs(ecartT - k.margePerdue)).toBeLessThanOrEqual(k.marge);
    const m = champs(COMBIEN_CHARGER_PENDANT_LA_PANNE, "arene", cas);
    expect(m["Écart des trimestres suivants, au seuil"]).toBe(k.annees.baisser.resultatEnsuite - k.annees.garder.resultatEnsuite);
    expect(m["Écart des trimestres suivants, au seuil"]).toBe(-36270);
    expect(m["Écart de résultat de l'année, au seuil"]).toBe(-50299);
    // Au seuil, la demande des trimestres suivants monte, mais la flotte y refuse encore des clients ; et la
    // gestion, qui charge d'après ses ventes du trimestre d'avant, charge moins ensuite : c'est ce que l'explication lit.
    const ensuite = (a: readonly CompanyRoundResult[]) => a.slice(T).reduce((t, x) => t + x.production.produced, 0);
    expect(k.annees.baisser.chargeesEnsuite).toBe(Math.round(ensuite(auSeuil)));
    expect(k.annees.garder.chargeesEnsuite).toBe(Math.round(ensuite(enPanne)));
    expect(k.annees.baisser.demandeEnsuite).toBeGreaterThan(k.annees.garder.demandeEnsuite);
    expect(k.annees.baisser.chargeesEnsuite).toBeLessThan(k.annees.garder.chargeesEnsuite);
    for (const x of auSeuil.slice(T)) expect(demandeDe(x) - soldUnits(x)).toBeGreaterThanOrEqual(1);
    expect(k.annees.baisser.refuseEnsuite).toBe(true);
    expect(k.annees.remplir.refuseEnsuite).toBe(true);
    expect(k.annees.remplir.resultatEnsuite).toBeGreaterThanOrEqual(k.annees.garder.resultatEnsuite);
    // La réponse est l'année la meilleure, et elle se calcule.
    const meilleur = (["garder", "baisser", "remplir"] as const).reduce((x, y) => (k.annees[y].resultatAnnee > k.annees[x].resultatAnnee ? y : x));
    expect(k.meilleur).toBe(meilleur);
    expect(k.meilleur).toBe("remplir");
    expect(justeDe(COMBIEN_CHARGER_PENDANT_LA_PANNE, "reponse", cas)).toBe("Remplir les 7 200 places de la flotte");
  });
});
