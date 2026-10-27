import { describe, expect, it } from "vitest";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { machineDuChapitre } from "../../src/config/cours/chapitres/croitre-en-investissant";
import {
  COUT_DU_CAPITAL_ANNUEL,
  DUREE_DU_PROJET,
  ENTREPRISES_DE_L_ACTUALISATION,
  LA_VALEUR_ACTUELLE_NETTE,
  TAUX_TRIMESTRIEL,
  projet,
  projetAvec,
  projetSansInvestir,
  sansDefaillance,
  vanExacte,
} from "../../src/config/cours/chapitres/la-valeur-actuelle-nette";
import {
  LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS,
  deuxProjets,
  machineSuivante,
  tauxQuiAnnule,
} from "../../src/config/cours/chapitres/le-tri-et-le-choix-entre-deux-projets";
import {
  DUREE_AVANT_LA_REVENTE,
  REVENDRE_LA_MACHINE_PLUS_TOT,
  revendrePlusTot,
} from "../../src/config/cours/situations/par-chapitre/revendre-la-machine-plus-tot";
import { ACHETER_LES_DEUX_MACHINES, acheterLesDeux } from "../../src/config/cours/situations/par-chapitre/acheter-les-deux-machines";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { TOURS_MAX_AU_TRIMESTRE } from "../../src/config/scenarios/rounds";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import type { CompanyRoundResult, EquipmentTypeDef } from "../../src/engine/types";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";

/**
 * DSCG · FINANCE : LA VALEUR ACTUELLE NETTE, LE TRI ET LE CHOIX ENTRE DEUX PROJETS, ET LEURS CAS.
 *
 * Les deux chapitres rejouent la partie sur douze trimestres, avec et sans une machine (deux
 * machines pour le second, l'une ou l'autre ; les deux à la fois pour son cas). Ces gardes refont
 * les calculs à partir du moteur par un autre chemin (les montants exacts de chaque trimestre),
 * vérifient que le moteur fait ce que les textes disent qu'il fait (l'entrée en service au
 * trimestre suivant, l'amortissement linéaire, la valeur nette comptable, l'impôt à un seul taux
 * sur des exercices tous bénéficiaires, des flux qui ne dépendent pas du financement), que les
 * entreprises retenues sont celles où le calcul a un objet, que le TRI annule la VAN, que les
 * verdicts se lisent dans les chiffres et varient, et que les textes se lisent.
 */

const pres = (a: number, b: number, ecart = 0.02) => expect(Math.abs(a - b), `${a} et ${b}`).toBeLessThanOrEqual(ecart);
const is = (r: CompanyRoundResult) => r.incomeStatement;
const somme = (tours: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => tours.reduce((t, r) => t + f(r), 0);
const tn = (r: CompanyRoundResult) => r.balanceSheet.cash - r.balanceSheet.overdraft;
const exercices = (tours: readonly CompanyRoundResult[]) => [0, 1, 2].map((e) => tours.slice(4 * e, 4 * e + 4));
const permises = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));

/** Les flux exacts d'un projet, recomposés depuis le moteur : l'EBE gagné moins l'impôt du résultat d'exploitation gagné. */
function fluxExacts(code: string, machines: readonly EquipmentTypeDef[], duree = DUREE_DU_PROJET, paiement: "tresorerie" | "emprunt" = "tresorerie") {
  const t = scenarioByCode(code).scenario.finance.taxRate;
  const sans = projetSansInvestir(code);
  const avec = projetAvec(code, machines, paiement);
  return sans.slice(0, duree).map((a, k) => is(avec[k]!).ebitda - is(a).ebitda - t * (is(avec[k]!).operatingIncome - is(a).operatingIncome));
}

/** La valeur résiduelle exacte : la revente au ratio du catalogue, plus l'impôt économisé sur la moins-value. */
function residuelleExacte(code: string, machines: readonly EquipmentTypeDef[], duree = DUREE_DU_PROJET) {
  const t = scenarioByCode(code).scenario.finance.taxRate;
  return machines.reduce((x, m) => {
    const vnc = m.costPerUnit * (1 - (duree - 1) / m.depreciationRounds);
    const prix = vnc * (m.resaleRatio ?? 0.5);
    return x + prix + t * (vnc - prix);
  }, 0);
}

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
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculin = new RegExp(`\\bun ${u}\\b|\\b${u}s? (vendu|fabriqué|produit|servi|demandé)s?\\b(?!e)`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(douze|huit|trois|quatre|onze) (trimestres|exercices)\b/i);
      // Un négatif prend le signe moins, et retranché, il va entre parenthèses ; jamais « −0 € ».
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −|−0 €/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      expect(t.lignes.length, e.id).toBeGreaterThan(0);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(champs.length, e.id).toBeGreaterThan(0);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        // L'élève tape au centime : une valeur attendue n'a pas plus de deux décimales.
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
        expect(c.tolerance ?? 0.01, `${e.id} : ${c.libelle}`).toBeGreaterThan(0);
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
  it("leurs titres sont ceux du programme du DSCG, au palier 4, et leur bloc se résout mot pour mot", () => {
    for (const ch of [LA_VALEUR_ACTUELLE_NETTE, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS]) {
      expect(PROGRAMME["dscg-finance"][4]).toContain(ch.titre);
      expect(ch.parcours).toBe("dscg-finance");
      expect(ch.palier).toBe(4);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(["DSCG UE2 · Finance"]);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b)!;
        expect(r, b).not.toBeNull();
        expect(r.code).toBe("dscg");
        expect(r.referentiel.entrees).toContain("UE2 · Finance");
        expect(blocOfficiel(b, r.code), b).toBe("UE2 · Finance");
      }
      expect(ch.entreprises!.codes).toEqual(ENTREPRISES_DE_L_ACTUALISATION);
      for (const code of ENTREPRISES_DE_L_ACTUALISATION) expect(ch.entreprises!.pourquoi).toContain(casDeLEntreprise(code).entreprise);
    }
  });

  it("les hypothèses du cours : 8 % par an, 1,94 % par trimestre, un projet de douze trimestres", () => {
    expect(COUT_DU_CAPITAL_ANNUEL).toBe(0.08);
    expect(TAUX_TRIMESTRIEL).toBe(0.0194);
    pres(Math.pow(1 + COUT_DU_CAPITAL_ANNUEL, 1 / 4) - 1, TAUX_TRIMESTRIEL, 0.00005);
    expect(DUREE_DU_PROJET).toBe(TOURS_MAX_AU_TRIMESTRE);
    expect(DUREE_DU_PROJET).toBe(12);
    expect(attendus(LA_VALEUR_ACTUELLE_NETTE, "taux", casDeLEntreprise("hotel"))).toEqual([1.94]);
  });

  it("la décision d'investir s'ouvre au niveau 4, où le catalogue d'équipements est celui du cours", () => {
    expect(DIFFICULTY_PRESETS.find((p) => p.decisions.investment)!.level).toBe(4);
  });

  it("les entreprises écartées le sont pour la raison que le chapitre leur donne", () => {
    const ecartees = ENTREPRISES_DU_COURS.filter((x) => !(ENTREPRISES_DE_L_ACTUALISATION as readonly string[]).includes(x));
    expect(ecartees).toEqual(["nova", "bistrot", "conseil", "batiment"]);
    // NOVA touche le plafond de son découvert : l'écart de trésorerie n'y dit plus rien.
    const plafond = scenarioByCode("nova").scenario.finance.overdraftLimit;
    expect(projetSansInvestir("nova").filter((r) => tn(r) <= -plafond + 1).length).toBeGreaterThan(0);
    // LA TABLE D'AUGUSTIN et MARTEL & FILS finissent un exercice en perte.
    for (const code of ["bistrot", "batiment"]) {
      expect(exercices(projetSansInvestir(code)).some((ex) => somme(ex, (r) => is(r).pretaxIncome) < 0), code).toBe(true);
    }
    // Chez ATLAS CONSEIL, la machine ne fait rien vendre de plus.
    const m = machineDuChapitre("conseil");
    pres(somme(projetAvec("conseil", [m]), soldUnits), somme(projetSansInvestir("conseil"), soldUnits), 0.5);
  });

  it("une défaillance se tranche avant d'additionner : le rejeu qui défaille est refusé", () => {
    const suite = scenarioByCode("hotel").scenario.equipment!.types.find((t) => t.code === "suite_premium")!;
    const tours = projetAvec("hotel", [suite], "tresorerie");
    expect(tours.some((r) => r.defaillant)).toBe(true);
    expect(() => sansDefaillance(tours, "hotel")).toThrow(/défaillante/);
    expect(() => projet("hotel", [suite])).toThrow(/défaillante/);
  });
});

describe.each([...ENTREPRISES_DE_L_ACTUALISATION])("la valeur actuelle nette chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const t = s.finance.taxRate;
  const a = machineDuChapitre(code);
  const b = machineSuivante(code);

  it("le rejeu sans investir commence par l'année du cours, et aucun rejeu ne défaille", () => {
    const sans = projetSansInvestir(code);
    expect(sans).toHaveLength(DUREE_DU_PROJET);
    expect(sans.slice(0, 4).map((r) => is(r).netIncome)).toEqual(anneeJouee(code).partie.rounds.map((x) => is(x.results["joueur"]!).netIncome));
    for (const ms of [[a], [b]]) for (const p of ["tresorerie", "emprunt"] as const) expect(projetAvec(code, ms, p).some((r) => r.defaillant)).toBe(false);
    expect(projetAvec(code, [a, b], "emprunt").some((r) => r.defaillant)).toBe(false);
  });

  it("le moteur fait ce que dit le chapitre : décaissement au trimestre 1, service au trimestre 2, amortissement linéaire, valeur nette comptable", () => {
    const sans = projetSansInvestir(code);
    for (const m of [a, b]) {
      const avec = projetAvec(code, [m]);
      const investi = (r: CompanyRoundResult) => r.cashFlow.items.filter((i) => i.label === "investissement").reduce((x, i) => x + i.amount, 0);
      pres(investi(avec[0]!) - investi(sans[0]!), -m.costPerUnit);
      expect(is(avec[0]!).ebitda).toBe(is(sans[0]!).ebitda);
      for (let k = 1; k < DUREE_DU_PROJET; k++) pres(is(avec[k]!).depreciation - is(sans[k]!).depreciation, m.costPerUnit / m.depreciationRounds, 1e-6);
      const p = projet(code, [m]);
      pres(avec[DUREE_DU_PROJET - 1]!.balanceSheet.fixedAssetsNet - sans[DUREE_DU_PROJET - 1]!.balanceSheet.fixedAssetsNet, p.vr.vnc, 0.01);
      // Rien d'autre que l'exploitation, l'impôt, les intérêts et l'investissement ne bouge dans la trésorerie.
      for (const label of ["nouvel_emprunt", "remboursement_emprunt", "dividendes_verses", "augmentation_capital", "placement_souscrit"]) {
        const de = (r: CompanyRoundResult) => r.cashFlow.items.filter((i) => i.label === label).reduce((x, i) => x + i.amount, 0);
        pres(somme(avec, de), somme(sans, de), 0.01);
      }
    }
  });

  it("l'impôt sur les flux est celui du moteur : un seul taux, sur trois exercices tous bénéficiaires", () => {
    const sans = projetSansInvestir(code);
    for (const m of [a, b]) {
      const avec = projetAvec(code, [m]);
      for (const tours of [sans, avec]) for (const ex of exercices(tours)) expect(somme(ex, (r) => is(r).pretaxIncome)).toBeGreaterThan(0);
      exercices(avec).forEach((ex, e) => {
        const ref = exercices(sans)[e]!;
        const ecart = (f: (r: CompanyRoundResult) => number) => somme(ex, f) - somme(ref, f);
        pres(ecart((r) => is(r).tax), t * (ecart((r) => is(r).operatingIncome) - ecart((r) => is(r).interest)), 0.05);
      });
      const p = projet(code, [m]);
      pres(p.impotDeLArene, p.impotTotal - t * p.interetsEnPlus, 0.5);
    }
  });

  it("les flux ne dépendent pas du financement : payée comptant ou à l'emprunt, la machine laisse les mêmes flux", () => {
    for (const m of [a, b]) {
      const comptant = fluxExacts(code, [m], DUREE_DU_PROJET, "tresorerie");
      const emprunt = fluxExacts(code, [m], DUREE_DU_PROJET, "emprunt");
      comptant.forEach((f, k) => pres(f, emprunt[k]!, 0.01));
    }
  });

  it("les flux, la valeur résiduelle et la VAN se recomposent depuis le moteur", () => {
    const p = projet(code);
    const exacts = fluxExacts(code, [a]);
    p.lignes.forEach((l, k) => {
      pres(l.flux, exacts[k]!, 0.02);
      pres(l.flux, l.ebe - t * l.rex, 0.01);
    });
    pres(p.fluxTotal, exacts.reduce((x, f) => x + f, 0), 0.2);
    pres(p.vr.nette, residuelleExacte(code, [a]), 0.02);
    pres(p.van, vanExacte(a.costPerUnit, exacts, residuelleExacte(code, [a]), TAUX_TRIMESTRIEL), 1);
    pres(p.ip, (p.van + p.cout) / p.cout, 0.01);
    expect(p.verdict).toBe(p.van > 0 ? "investir" : "renoncer");
    // L'écart entre la trésorerie gagnée et les flux tient au besoin en fonds de roulement et aux agios après impôt.
    pres(p.ecartDeTresorerie, p.bfr + p.agiosApresImpot, 1);
  });

  it("les champs demandent ces chiffres-là", () => {
    const p = projet(code);
    expect(attendus(LA_VALEUR_ACTUELLE_NETTE, "flux", cas)).toEqual([p.ebeTotal, p.impotTotal, p.fluxTotal]);
    expect(attendus(LA_VALEUR_ACTUELLE_NETTE, "valeur-residuelle", cas)).toEqual([p.vr.vnc, p.vr.prix, p.vr.nette]);
    expect(attendus(LA_VALEUR_ACTUELLE_NETTE, "van", cas)).toEqual([p.va, p.vaResiduelle, p.van]);
    pres(p.impotTotal, t * p.rexTotal, 0.1);
    pres(p.van, p.va + p.vaResiduelle - p.cout, 0.01);
    expect(juste(LA_VALEUR_ACTUELLE_NETTE, "decision", cas)).toMatch(p.van > 0 ? /^Investir : la VAN est positive/ : /^Renoncer : la VAN est négative/);
  });

  it("le TRI annule la VAN, et une seule fois ; le délai actualisé est celui du cumul", () => {
    const k = deuxProjets(cas);
    for (const [p, r, m] of [
      [k.a, k.ra, a],
      [k.b, k.rb, b],
    ] as const) {
      const flux = fluxExacts(code, [m]);
      const vr = residuelleExacte(code, [m]);
      // Le TRI annule la VAN des flux du chapitre (au centime), et celle des flux exacts du moteur à l'euro près.
      expect(Math.abs(vanExacte(p.cout, p.flux, p.vr.nette, r.taux))).toBeLessThan(0.01);
      expect(Math.abs(vanExacte(m.costPerUnit, flux, vr, r.taux))).toBeLessThan(1);
      // Au TRI arrondi au centième de point, la VAN s'écarte de zéro d'au plus un demi-centième de la pente entre les deux bornes.
      expect(Math.abs(r.vanAuTri)).toBeLessThanOrEqual((r.vanLo - r.vanHi) * 0.005 + 1);
      // La VAN ne change de signe qu'une fois sur l'intervalle de la dichotomie : le TRI est unique.
      const signes = Array.from({ length: 551 }, (_, i) => Math.sign(vanExacte(m.costPerUnit, flux, vr, -0.5 + i * 0.01)));
      expect(signes.filter((x, i) => i > 0 && x !== signes[i - 1]).length).toBe(1);
      expect(r.vanLo).toBeGreaterThan(0);
      expect(r.vanHi).toBeLessThan(0);
      expect(r.lo).toBeLessThanOrEqual(r.triPct);
      expect(r.hi).toBeGreaterThanOrEqual(r.triPct);
      pres(r.triAnnuelPct, (Math.pow(1 + r.taux, 4) - 1) * 100, 0.01);
      expect(Math.abs(r.interpolation - r.triPct)).toBeLessThanOrEqual(r.toleranceTri);
      // Le TRI et la VAN disent la même chose d'un projet seul : VAN positive, TRI au-dessus du coût du capital.
      expect(p.van > 0).toBe(r.taux > TAUX_TRIMESTRIEL);
      if (p.delai !== null) {
        let cumul = 0;
        const cumuls = p.lignes.map((l) => (cumul += l.actualise));
        const entier = Math.floor(p.delai);
        expect(cumuls[entier - 1] ?? 0).toBeLessThan(p.cout + 0.5);
        expect(cumuls[Math.ceil(p.delai) - 1]!).toBeGreaterThanOrEqual(p.cout - 0.5);
        expect(cumuls.slice(Math.ceil(p.delai) - 1).every((x) => x >= p.cout - 0.5)).toBe(true);
      } else expect(p.lignes.reduce((x, l) => x + l.actualise, 0)).toBeLessThan(p.cout);
    }
    expect(tauxQuiAnnule(100, [10, 10], 0)).toBeNull();
  });

  it("Fisher : là où les critères divergent, les deux VAN se rejoignent au taux de Fisher, au-dessus du coût du capital", () => {
    const k = deuxProjets(cas);
    expect(k.vanPrefere).toBe(k.a.van >= k.b.van ? "A" : "B");
    expect(k.triPrefere).toBe(k.ra.triPct >= k.rb.triPct ? "A" : "B");
    expect(k.conflit).toBe(k.vanPrefere !== k.triPrefere);
    pres(k.dSansActualiser, k.b.fluxTotal - k.a.fluxTotal + k.b.vr.nette - k.a.vr.nette, 0.2);
    if (k.fisher) {
      const fa = vanExacte(k.a.cout, k.a.flux, k.a.vr.nette, k.fisher.taux);
      const fb = vanExacte(k.b.cout, k.b.flux, k.b.vr.nette, k.fisher.taux);
      pres(fa, fb, 0.01);
      expect(k.fisherAuDessus).toBe(k.vanPrefere === "B");
    } else expect(k.dSansActualiser).toBeLessThanOrEqual(k.dCout);
    if (k.conflit) {
      // Le cas du cours : le petit projet a le meilleur TRI, le grand la meilleure VAN, sous le taux de Fisher.
      expect(k.triPrefere).toBe("A");
      expect(k.fisher).not.toBeNull();
      expect(k.fisher!.taux).toBeGreaterThan(TAUX_TRIMESTRIEL);
      expect(k.fisher!.taux).toBeLessThan(Math.min(k.ra.taux, k.rb.taux));
    }
    const ch = chapitreDuCas(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, cas);
    expect(ch.etapes.some((e) => e.id === "fisher")).toBe(k.conflit);
    expect(attendus(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "van", cas)).toEqual([k.a.van, k.b.van]);
    expect(attendus(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "encadrer", cas)).toEqual([k.ra.vanLo, k.ra.vanHi, k.ra.interpolation]);
    expect(attendus(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "tri", cas)).toEqual([k.rb.triPct, k.ra.triAnnuelPct, k.rb.triAnnuelPct]);
    expect(attendus(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "indices", cas)).toEqual([k.a.ip, k.b.ip, ...(k.a.delai !== null ? [k.a.delai] : []), ...(k.b.delai !== null ? [k.b.delai] : [])]);
    if (k.conflit) expect(attendus(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "fisher", cas)).toEqual([k.fisher!.triPct, k.fisher!.triAnnuelPct]);
    expect(juste(LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, "choix", cas)).toBe(
      k.retenu === "aucun" ? "Aucun des deux : aucun ne crée de valeur au coût du capital" : `Le projet ${k.retenu}, « ${k.retenu === "A" ? a.name : b.name} »`,
    );
  });

  it("le cas « Revendre la machine plus tôt » : les huit premiers trimestres du projet, la revente au catalogue", () => {
    const v = revendrePlusTot(cas);
    expect(v.court.duree).toBe(DUREE_AVANT_LA_REVENTE);
    v.court.flux.forEach((f, k) => expect(f).toBe(v.long.flux[k]));
    pres(v.court.vr.nette, residuelleExacte(code, [a], DUREE_AVANT_LA_REVENTE), 0.02);
    pres(v.court.van, vanExacte(a.costPerUnit, fluxExacts(code, [a], DUREE_AVANT_LA_REVENTE), residuelleExacte(code, [a], DUREE_AVANT_LA_REVENTE), TAUX_TRIMESTRIEL), 1);
    expect(v.court.vr.nette).toBeGreaterThan(v.long.vr.nette);
    expect(attendus(REVENDRE_LA_MACHINE_PLUS_TOT, "revente", cas)).toEqual([v.court.vr.vnc, v.court.vr.prix, v.court.vr.nette]);
    expect(attendus(REVENDRE_LA_MACHINE_PLUS_TOT, "van", cas)).toEqual([v.court.va, v.court.vaResiduelle, v.court.van]);
    expect(v.verdict).toBe(v.court.van <= 0 ? "revendre-detruit" : v.court.van >= v.long.van ? "revendre-cree-plus" : "garder-cree-plus");
  });

  it("le cas « Acheter les deux machines » : l'ensemble ne vaut pas la somme, et sa VAN se recompose", () => {
    const v = acheterLesDeux(cas);
    const exacts = fluxExacts(code, [a, b], DUREE_DU_PROJET, "emprunt");
    v.ensemble.flux.forEach((f, k) => pres(f, exacts[k]!, 0.02));
    pres(v.ensemble.van, vanExacte(a.costPerUnit + b.costPerUnit, exacts, residuelleExacte(code, [a, b]), TAUX_TRIMESTRIEL), 1);
    // Payées comptant là où la trésorerie le permet, les deux machines laissent les mêmes flux qu'à l'emprunt.
    if (code !== "hotel") fluxExacts(code, [a, b], DUREE_DU_PROJET, "tresorerie").forEach((f, k) => pres(f, exacts[k]!, 0.01));
    else expect(() => sansDefaillance(projetAvec(code, [a, b], "tresorerie"), code)).toThrow();
    // Les deux machines se partagent la demande : la VAN de l'ensemble est sous la somme des deux.
    expect(v.perdu).toBeGreaterThan(0);
    expect(attendus(ACHETER_LES_DEUX_MACHINES, "van", cas)).toEqual([v.ensemble.va, v.ensemble.vaResiduelle, v.ensemble.van]);
    expect(attendus(ACHETER_LES_DEUX_MACHINES, "comparer", cas)).toEqual([v.somme, v.perdu, v.gain]);
    pres(v.somme, v.a.van + v.b.van);
    pres(v.gain, v.ensemble.van - Math.max(v.a.van, v.b.van));
    expect(v.verdict).toBe(v.gain > 0 && v.ensemble.van > 0 ? "les-deux" : Math.max(v.a.van, v.b.van) > 0 ? "le-meilleur-seul" : "aucune");
  });
});

describe("les verdicts varient avec l'entreprise", () => {
  const cas = ENTREPRISES_DE_L_ACTUALISATION.map((c) => casDeLEntreprise(c));
  it("le classement, le cas de la revente et celui des deux machines ne disent pas la même chose partout", () => {
    expect(new Set(cas.map((c) => deuxProjets(c).conflit))).toEqual(new Set([true, false]));
    expect(new Set(cas.map((c) => deuxProjets(c).retenu))).toEqual(new Set(["A", "B"]));
    expect(new Set(cas.map((c) => revendrePlusTot(c).verdict))).toEqual(new Set(["garder-cree-plus", "revendre-detruit"]));
    expect(new Set(cas.map((c) => acheterLesDeux(c).verdict))).toEqual(new Set(["les-deux", "le-meilleur-seul"]));
    // Le délai actualisé d'un projet manque quelque part : l'étape le dit sans le demander.
    expect(cas.some((c) => deuxProjets(c).b.delai === null)).toBe(true);
  });

  it("les deux cas tiennent ce qu'un cas dédié doit tenir", () => {
    casDedie(REVENDRE_LA_MACHINE_PLUS_TOT, LA_VALEUR_ACTUELLE_NETTE);
    casDedie(ACHETER_LES_DEUX_MACHINES, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS);
  });
});

for (const contenu of [LA_VALEUR_ACTUELLE_NETTE, LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, REVENDRE_LA_MACHINE_PLUS_TOT, ACHETER_LES_DEUX_MACHINES]) {
  describe.each(permises(contenu))(`${contenu.code} chez %s`, (code) => {
    it("des textes propres : rien d'indéfini, pas de « de le », pas de tiret, une seule bonne réponse, des libellés uniques", () => {
      textesPropres(contenu, code);
    });
  });
}
