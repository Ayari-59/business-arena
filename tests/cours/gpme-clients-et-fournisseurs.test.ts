import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { REFERENTIELS } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CHOISIR_SON_FOURNISSEUR,
  ENTREPRISES_A_UN_CATALOGUE,
  achatsDuTrimestre,
  choixDuFournisseur,
} from "../../src/config/cours/chapitres/choisir-son-fournisseur";
import { LE_CLIENT_QUI_PAIE_TARD, TRIMESTRE_DE_LA_MOBILISATION, clientQuiPaieTard } from "../../src/config/cours/chapitres/le-client-qui-paie-tard";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { ESCOMPTER_CHAQUE_TRIMESTRE, escompteChaqueTrimestre } from "../../src/config/cours/situations/par-chapitre/escompter-chaque-trimestre";
import {
  JOURS_DE_DELAI_EN_PLUS,
  LE_FOURNISSEUR_ALLONGE_SON_DELAI,
  delaiAllonge,
} from "../../src/config/cours/situations/par-chapitre/le-fournisseur-allonge-son-delai";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES « CLIENTS ET FOURNISSEURS » DU BTS GPME, ET LEURS CAS PRATIQUES.
 *
 * Choisir son fournisseur, et le client qui paie tard : chaque chapitre rejoue l'année du cours
 * avec une décision ou un paramètre changé (gestion-de-la-pme.ts). Ces gardes vérifient que leurs
 * chiffres se recomposent entre eux et avec le moteur, dans chaque entreprise où ils se jouent :
 * les dettes fournisseurs au délai de l'offre, les créances au délai des clientèles, l'escompte
 * et l'affacturage tels que le moteur les compte, l'écart de trésorerie tel que le bilan le
 * donne. Et que leurs textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase,
 * des élisions faites, une seule bonne réponse par question, des libellés uniques.
 */

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
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
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
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

const BLOC_1 = `BTS GPME ${REFERENTIELS.gpme!.entrees[0]}`;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

describe("les deux chapitres et leurs cas, dans le parcours BTS GPME", () => {
  it("portent les titres du programme, au palier 2, et le bloc 1 du référentiel", () => {
    for (const ch of [CHOISIR_SON_FOURNISSEUR, LE_CLIENT_QUI_PAIE_TARD]) {
      expect(PROGRAMME.gpme[2], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(2);
      expect(ch.blocs).toEqual([BLOC_1]);
      expect(ch.libre).toBe(false);
    }
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_FOURNISSEUR_ALLONGE_SON_DELAI, CHOISIR_SON_FOURNISSEUR],
      [ESCOMPTER_CHAQUE_TRIMESTRE, LE_CLIENT_QUI_PAIE_TARD],
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

  it("le choix du fournisseur se joue partout sauf à la boutique, dont chaque référence a son propre catalogue", () => {
    expect(ENTREPRISES_A_UN_CATALOGUE).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "boutique"));
    const boutique = scenarioByCode("boutique").scenario;
    expect(boutique.products!.some((p) => p.suppliers && p.suppliers.map((s) => s.code).join() !== boutique.suppliers!.map((s) => s.code).join())).toBe(true);
    expect(LE_CLIENT_QUI_PAIE_TARD.entreprises).toBeUndefined();
  });
});

describe.each(ENTREPRISES_A_UN_CATALOGUE)("choisir son fournisseur chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;

  it("les offres sont celles du scénario, et l'offre de référence est l'année du cours", () => {
    const f = choixDuFournisseur(cas);
    expect(f.offres.map((o) => o.code)).toEqual(s.suppliers!.map((x) => x.code));
    expect(f.reference.multiplicateur).toBe(1);
    expect(f.moinsChere.multiplicateur).toBeLessThan(1);
    expect(f.plusChere.multiplicateur).toBeGreaterThan(1);
    // Choisir l'offre de référence, c'est ne rien choisir : l'année du cours, au centime.
    const choisie = rejouerAvec(code, `fournisseur-${f.reference.code}`, (_t, d) => ({ ...d, supplierChoice: f.reference.code }));
    expect(choisie.map((r) => r.incomeStatement.netIncome)).toEqual(anneeDeReference(code).map((r) => r.incomeStatement.netIncome));
    for (const o of f.offres) {
      expect(o.prixUnitaire).toBeCloseTo(s.product.materialCostPerUnit * o.multiplicateur, 2);
      expect(o.achats).toBeGreaterThan(0);
    }
  });

  it("chaque offre est bien jouée toute l'année, et le moteur garde le délai de l'offre", () => {
    const f = choixDuFournisseur(cas);
    const m =rejouerAvec(code, `fournisseur-${f.moinsChere.code}`, (_t, d) => ({ ...d, supplierChoice: f.moinsChere.code }));
    for (const r of m) expect(r.supplier?.code).toBe(f.moinsChere.code);
    // La dette fournisseurs de clôture : achats du dernier trimestre (TTC) × délai de l'offre ÷ durée du trimestre.
    f.offres.forEach((o, k) => {
      expect(Math.abs(f.dettesAttendues[k]! - o.dettes), o.code).toBeLessThanOrEqual(1);
      expect(f.dettesAttendues[k]!).toBeCloseTo(o.achatsT4 * (1 + f.tva) * Math.min(1, o.delai / f.jours), 1);
    });
    expect(f.economieAProductionEgale).toBe(Math.round(f.reference.achats * (1 - f.moinsChere.multiplicateur)));
  });

  it("le taux de rebuts ne dépend pas du fournisseur (il suit le budget qualité)", () => {
    const f = choixDuFournisseur(cas);
    const taux = (c: string) =>
      rejouerAvec(code, `fournisseur-${c}`, (_t, d) => ({ ...d, supplierChoice: c })).map((r) =>
        r.production.produced > 0 ? (r.qualityCosts?.defectUnits ?? 0) / r.production.produced : 0,
      );
    for (const o of [f.moinsChere, f.plusChere]) taux(o.code).forEach((t, i) => expect(t, `${o.code} T${i + 1}`).toBeCloseTo(taux(f.reference.code)[i]!, 9));
  });

  it("l'écart de trésorerie se recompose : résultat, plus dettes et TVA à payer, moins créances et stocks", () => {
    const f = choixDuFournisseur(cas);
    expect(Math.abs(f.ecartDeTresorerie - (f.moinsChere.tresorerie - f.reference.tresorerie))).toBeLessThanOrEqual(3);
    expect(f.tresorerie).toBe(f.ecartDeTresorerie < 0 ? "baisse" : f.ecartDeTresorerie > f.d.resultat ? "plus-que-le-resultat" : "moins-que-le-resultat");
    expect(f.meilleure.resultat).toBe(Math.max(...f.offres.map((o) => o.resultat)));
    // Le chapitre dit qu'une offre fait mieux que l'habituelle : c'est vrai dans chaque entreprise.
    expect(f.meilleure).not.toBe(f.reference);
  });

  it("les achats du trimestre sont ceux que le moteur paie au fournisseur", () => {
    const ref = anneeDeReference(code);
    // Le dernier trimestre : la dette de clôture est la part non payée des achats TTC.
    const fin = ref.at(-1)!;
    const ratio = Math.min(1, s.suppliers![0]!.paymentDelayDays / s.roundDays);
    expect(fin.balanceSheet.payables).toBeCloseTo(achatsDuTrimestre(fin) * (1 + (s.finance.vatRate ?? 0)) * ratio, 2);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(CHOISIR_SON_FOURNISSEUR, code));
});

describe("choisir son fournisseur, sur les huit entreprises", () => {
  it("la trésorerie ne suit pas toujours le résultat : les trois lectures se rencontrent", () => {
    const lectures = new Set(ENTREPRISES_A_UN_CATALOGUE.map((c) => choixDuFournisseur(casDeLEntreprise(c)).tresorerie));
    expect([...lectures].sort()).toEqual(["baisse", "moins-que-le-resultat", "plus-que-le-resultat"]);
  });
});

describe.each(ENTREPRISES_DU_COURS)("le client qui paie tard chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const t = s.treasury!;

  it("les créances de clôture se recomposent clientèle par clientèle, et donnent le délai moyen", () => {
    const k = clientQuiPaieTard(cas);
    const fin = anneeDeReference(code)[TRIMESTRE_DE_LA_MOBILISATION - 1]!;
    const tr = fin.treasury;
    const nees = fin.balanceSheet.receivables + (tr?.discounted ?? 0) + (tr?.factored ?? 0) + (tr?.forcedFactored ?? 0);
    expect(k.clienteles.length).toBeGreaterThan(0);
    expect(Math.abs(k.creancesNees - nees)).toBeLessThanOrEqual(0.05);
    for (const x of k.clienteles) expect(x.creance).toBeCloseTo(x.caDuTrimestre * (1 + k.tva) * Math.min(1, x.delai / k.duree), 1);
    expect(k.delaiMoyen).toBeCloseTo((nees / (fin.incomeStatement.revenue * (1 + k.tva))) * k.duree, 1);
    expect(k.caComptant).toBeGreaterThanOrEqual(0);
    expect(k.sans.creances).toBe(Math.round(nees - (tr?.forcedFactored ?? 0)));
  });

  it("l'escompte et l'affacturage sont mobilisés et coûtés comme le moteur les compte", () => {
    const k = clientQuiPaieTard(cas);
    expect(k.mobilise).toBeLessThanOrEqual(t.discountMaxShare * k.creancesNees);
    expect(k.mobilise).toBeGreaterThan(0);
    const lire = (cle: "discount" | "factoring") => rejouerAvec(code, `${cle}-t${TRIMESTRE_DE_LA_MOBILISATION}`, () => undefined)[TRIMESTRE_DE_LA_MOBILISATION - 1]!.treasury!;
    const e = lire("discount");
    const a = lire("factoring");
    expect(e.discounted).toBeCloseTo(k.mobilise, 6);
    expect(a.factored).toBeCloseTo(k.mobilise, 6);
    expect(e.financingCost - e.forcedFactored * t.forcedFactoringFeeRate).toBeCloseTo(k.coutEscompte, 1);
    expect(a.financingCost - a.forcedFactored * t.forcedFactoringFeeRate).toBeCloseTo(k.coutAffacturage, 1);
    // Avant le dernier trimestre, rien ne change.
    const ref = anneeDeReference(code);
    const avec = rejouerAvec(code, `discount-t${TRIMESTRE_DE_LA_MOBILISATION}`, () => undefined);
    for (let i = 0; i < TRIMESTRE_DE_LA_MOBILISATION - 1; i++) expect(avec[i]!.incomeStatement.netIncome).toBe(ref[i]!.incomeStatement.netIncome);
  });

  it("la trésorerie gagne ce que les créances perdent, moins ce que le résultat perd", () => {
    const k = clientQuiPaieTard(cas);
    for (const [x, perdu, gain] of [
      [k.escompte, k.resultatPerduEscompte, k.gainEscompte],
      [k.affacturage, k.resultatPerduAffacturage, k.gainAffacturage],
    ] as const) {
      expect(Math.abs(gain - (k.sans.creances - x.creances - perdu))).toBeLessThanOrEqual(2);
      expect(perdu).toBeLessThanOrEqual(k.coutAffacturage + 0.5);
    }
    // Mobiliser n'améliore le résultat nulle part : le coût ne se rattrape qu'en évitant une cession d'office.
    expect(k.resultatPerduEscompte).toBeGreaterThan(0);
    expect(k.coutEscompte).toBeLessThan(k.coutAffacturage);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_CLIENT_QUI_PAIE_TARD, code));
});

describe.each(ENTREPRISES_A_UN_CATALOGUE)("le fournisseur allonge son délai chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;

  it("la contre-offre change le délai et rien d'autre, et sa dette de clôture est celle du moteur", () => {
    const k = delaiAllonge(cas);
    expect(k.nouveauDelai).toBe(s.suppliers![0]!.paymentDelayDays + JOURS_DE_DELAI_EN_PLUS);
    expect(k.nouveauDelai).toBeLessThanOrEqual(s.roundDays);
    expect(Math.abs(k.dettesAttendues - k.allonge.dettes)).toBeLessThanOrEqual(1);
    expect(k.creditEnPlus).toBeGreaterThan(0);
    expect(k.verdict).toBe(k.ecartDeResultat <= 0 ? "le-delai" : k.ecartDeTresorerie >= 0 ? "le-prix" : "chacun-son-avantage");
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LE_FOURNISSEUR_ALLONGE_SON_DELAI, code);
    const e = LE_FOURNISSEUR_ALLONGE_SON_DELAI.etapes.at(-1)!;
    if (e.type !== "choix") throw new Error("la réponse est un choix");
    const options = e.options(cas, { soldes: {} });
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });
});

describe("le fournisseur allonge son délai, sur les huit entreprises", () => {
  it("le prix gagne partout en résultat, mais pas partout en trésorerie", () => {
    const verdicts = new Set(ENTREPRISES_A_UN_CATALOGUE.map((c) => delaiAllonge(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["chacun-son-avantage", "le-prix"]);
  });
});

describe.each(ENTREPRISES_DU_COURS)("escompter chaque trimestre chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const t = scenarioByCode(code).scenario.treasury!;

  it("la banque escompte son plafond à chaque trimestre, au coût du moteur", () => {
    const k = escompteChaqueTrimestre(cas);
    for (const x of k.trimestres) expect(x.escompteDuMoteur, `T${x.numero}`).toBeCloseTo(x.escompte, 1);
    expect(k.escompteDeLAnnee).toBeCloseTo(somme(k.trimestres.map((x) => x.escompteDuMoteur)), 1);
    const annee = rejouerAvec(code, "escompte-chaque-trimestre", () => undefined);
    const coutDuMoteur = somme(annee.map((r) => (r.treasury?.financingCost ?? 0) - (r.treasury?.forcedFactored ?? 0) * t.forcedFactoringFeeRate));
    expect(Math.abs(coutDuMoteur - k.coutDeLAnnee)).toBeLessThanOrEqual(0.05);
    expect(k.resultatPerdu).toBeGreaterThan(0);
    expect(k.verdict).toBe(k.sans.plusBasse < 0 ? "evite-le-decouvert" : "inutile");
    if (k.verdict === "evite-le-decouvert") expect(k.avec.plusBasse).toBeGreaterThan(k.sans.plusBasse);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(ESCOMPTER_CHAQUE_TRIMESTRE, code);
    const e = ESCOMPTER_CHAQUE_TRIMESTRE.etapes.at(-1)!;
    if (e.type !== "choix") throw new Error("la réponse est un choix");
    const options = e.options(cas, { soldes: {} });
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });
});

describe("escompter chaque trimestre, sur les neuf entreprises", () => {
  it("l'escompte évite un découvert chez les unes, ne sert à rien chez les autres", () => {
    const verdicts = new Set(ENTREPRISES_DU_COURS.map((c) => escompteChaqueTrimestre(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["evite-le-decouvert", "inutile"]);
  });
});
