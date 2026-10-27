import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { achatsDuTrimestre } from "../../src/config/cours/chapitres/choisir-son-fournisseur";
import {
  ENTREPRISES_OU_LA_TVA_JOUE,
  LA_DECLARATION_DE_TVA,
  TRIMESTRE_DECLARE,
  declarationDeTva,
} from "../../src/config/cours/chapitres/la-declaration-de-tva";
import { LA_TVA_ET_LA_TRESORERIE, TRIMESTRE_DES_FLUX, tvaEtTresorerie } from "../../src/config/cours/chapitres/la-tva-et-la-tresorerie";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { JOURS_DEMANDES, LA_TVA_AVANCEE_POUR_LE_CLIENT, tvaAvanceePourLeClient } from "../../src/config/cours/situations/par-chapitre/la-tva-avancee-pour-le-client";
import { LA_TVA_DU_DERNIER_TRIMESTRE, tvaDuDernierTrimestre } from "../../src/config/cours/situations/par-chapitre/la-tva-du-dernier-trimestre";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult } from "../../src/engine/types";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { equilibree } from "../../src/pedagogy/cours/etats";

/**
 * LES DEUX CHAPITRES DE TVA DU PARCOURS « FISCALITÉ DE L'ENTREPRISE », ET LEURS CAS PRATIQUES.
 *
 * La déclaration de TVA et la TVA dans la trésorerie : leurs chiffres sont ceux que le moteur
 * compte dans l'année du cours (src/engine/finance/statements.ts), et ces gardes les recomposent
 * avec lui : la TVA nette du trimestre au bilan, versée au trimestre suivant, les créances et les
 * dettes TTC, l'année rejouée sans TVA qui garde le même résultat et dont la trésorerie s'écarte
 * de ce que la TVA laisse en caisse. Les chapitres ne se jouent que là où le scénario fixe un
 * taux de TVA. Et leurs textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase,
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
    case "ecriture": {
      const p = e.piece?.(cas);
      const piece = p ? [p.nature, p.de, p.a, p.date, p.mention ?? "", ...p.lignes.map((l) => l.libelle), ...p.totaux.map((t) => t.libelle)] : [];
      const ecriture = e.ecriture(cas);
      return [e.evenement(cas), ...e.indices(cas), ...e.explication(cas, etat), ecriture.libelle, ...ecriture.lignes.flatMap((l) => [l.role, l.indice]), ...piece, ...tableau];
    }
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
  const textes = [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""];
  for (const x of textes) expect(x, x).not.toMatch(/undefined|NaN| [-–—] |mises? en situation/i);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of [e.titre, ...textesDe(e, cas, etat)]) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|−0 €|\s{2,}/);
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
    if (e.type === "ecriture") {
      const attendue = e.ecriture(cas);
      expect(equilibree(enEcriture(attendue)), e.id).toBe(true);
      // L'écriture attendue, saisie telle quelle, est jugée juste par le correcteur.
      expect(corriger(enSaisie(attendue), attendue).juste, e.id).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(casDeLEntreprise(code), { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

const annee = (code: string): CompanyRoundResult[] => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
const flux = (r: CompanyRoundResult, label: string) => r.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;
const etape = (ch: Chapitre, id: string) => ch.etapes.find((e) => e.id === id)!;
const champsDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = etape(ch, id);
  if (e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
};
const BLOCS_DE_LA_DECLARATION = [
  "BTS CG P3 · Gestion des obligations fiscales",
  "DCG UE4 · Droit fiscal",
  "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
];

describe("les deux chapitres de TVA et leurs cas, dans le parcours de fiscalité", () => {
  it("portent les titres du programme, au palier 3, et des blocs qui se résolvent mot pour mot", () => {
    expect(LA_DECLARATION_DE_TVA.blocs).toEqual(BLOCS_DE_LA_DECLARATION);
    expect(LA_TVA_ET_LA_TRESORERIE.blocs).toEqual(BLOCS_DE_LA_DECLARATION.slice(0, 2));
    for (const ch of [LA_DECLARATION_DE_TVA, LA_TVA_ET_LA_TRESORERIE]) {
      expect(PROGRAMME.fiscalite[3], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("fiscalite");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      for (const b of ch.blocs) {
        const r = referentielDeCitation(b);
        expect(r, b).not.toBeNull();
        // « BTS CG P3 · … » : l'entrée est « P3 · … » ; « BUT GEA · … » : l'entrée est le seul intitulé.
        const officiel = b.replace(/^(BTS CG|DCG) /, "").replace(/^BUT GEA · /, "");
        expect(r!.referentiel.entrees, b).toContain(officiel);
        expect(blocOfficiel(b, r!.code), b).toBe(officiel);
      }
      // Un seul objet par code, qu'il soit déjà inscrit au registre ou pas encore.
      expect(CHAPITRES.filter((c) => c.code === ch.code).every((c) => c === ch), ch.code).toBe(true);
      expect(SITUATIONS.some((s) => s.code === ch.code), ch.code).toBe(false);
    }
    expect(PROGRAMME.fiscalite[3]![0]).toBe(LA_DECLARATION_DE_TVA.titre);
    expect(PROGRAMME.fiscalite[3]![1]).toBe(LA_TVA_ET_LA_TRESORERIE.titre);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LA_TVA_DU_DERNIER_TRIMESTRE, LA_DECLARATION_DE_TVA],
      [LA_TVA_AVANCEE_POUR_LE_CLIENT, LA_TVA_ET_LA_TRESORERIE],
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
      expect(CHAPITRES.some((c) => c.code === s.code), s.code).toBe(false);
      expect(SITUATIONS.filter((x) => x.code === s.code).every((x) => x === s), s.code).toBe(true);
    }
  });

  it("ne se jouent que là où le moteur compte la TVA : le bâtiment et le transport", () => {
    expect(ENTREPRISES_OU_LA_TVA_JOUE).toEqual(["batiment", "transport"]);
    for (const ch of [LA_DECLARATION_DE_TVA, LA_TVA_ET_LA_TRESORERIE]) expect(ch.entreprises?.codes).toEqual(ENTREPRISES_OU_LA_TVA_JOUE);
    // Ailleurs, pas de taux dans le scénario : le moteur ne porte ni dette de TVA, ni versement.
    for (const code of ENTREPRISES_DU_COURS.filter((c) => !ENTREPRISES_OU_LA_TVA_JOUE.includes(c))) {
      expect(scenarioByCode(code).scenario.finance.vatRate ?? 0, code).toBe(0);
      for (const r of annee(code)) {
        expect(r.balanceSheet.vatLiability ?? 0, code).toBe(0);
        expect(flux(r, "tva_decaissee"), code).toBe(0);
      }
    }
    // Là où il la compte, un seul taux, le taux normal, pour les ventes comme pour les achats.
    for (const code of ENTREPRISES_OU_LA_TVA_JOUE) expect(scenarioByCode(code).scenario.finance.vatRate, code).toBe(0.2);
  });
});

describe.each(ENTREPRISES_OU_LA_TVA_JOUE)("la déclaration de TVA chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const taux = scenarioByCode(code).scenario.finance.vatRate!;
  const ref = annee(code);

  it("la TVA de chaque trimestre est celle du moteur : collectée sur les ventes, déductible sur les achats, versée au trimestre suivant", () => {
    const d = declarationDeTva(cas);
    expect(d.taux).toBe(taux);
    expect(d.ouverture).toBe(0);
    expect(anneeJouee(code).depart.finance.vatLiability ?? 0).toBe(0);
    ref.forEach((r, k) => {
      const x = d.trimestres[k]!;
      // Le moteur : TVA nette = taux × (chiffre d'affaires − achats), au bilan de clôture.
      expect(r.balanceSheet.vatLiability!, `T${k + 1}`).toBeCloseTo(taux * (r.incomeStatement.revenue - achatsDuTrimestre(r)), 6);
      expect(Math.abs(x.nette - r.balanceSheet.vatLiability!), `T${k + 1}`).toBeLessThanOrEqual(1);
      expect(x.aDecaisser, `T${k + 1}`).toBe(Math.round(r.balanceSheet.vatLiability!));
      expect(x.collectee).toBe(Math.round(x.ventes * taux));
      expect(x.deductible).toBe(Math.round(x.achats * taux));
      // Versée au trimestre suivant : la « TVA décaissée » est la dette du bilan précédent.
      const avant = k === 0 ? 0 : ref[k - 1]!.balanceSheet.vatLiability!;
      expect(-flux(r, "tva_decaissee"), `T${k + 1}`).toBeCloseTo(avant, 6);
      expect(x.versee, `T${k + 1}`).toBe(Math.round(avant));
    });
    expect(d.verseeDansLAnnee).toBe(d.trimestres.reduce((t, x) => t + x.versee, 0));
    expect(Math.abs(d.verseeDansLAnnee + ref.reduce((t, r) => t + flux(r, "tva_decaissee"), 0))).toBeLessThanOrEqual(2);
    expect(d.dueAuBilan).toBe(Math.round(ref.at(-1)!.balanceSheet.vatLiability!));
  });

  it("les valeurs attendues des champs sont celles de la déclaration", () => {
    const d = declarationDeTva(cas);
    const x = d.declare;
    expect(x.numero).toBe(TRIMESTRE_DECLARE);
    expect(x.nette).toBeGreaterThan(0);
    expect(champsDe(LA_DECLARATION_DE_TVA, "calcul", cas)).toEqual([x.collectee, x.deductible, x.nette]);
    expect(champsDe(LA_DECLARATION_DE_TVA, "echeance", cas)).toEqual([d.verseeDansLAnnee, d.dueAuBilan]);
    expect(champsDe(LA_DECLARATION_DE_TVA, "credit", cas)).toEqual([d.credit]);
    // L'hypothèse du crédit : les achats de l'année au trimestre déclaré, pour ses mêmes ventes.
    expect(d.achatsDeLAnnee).toBe(d.trimestres.reduce((t, y) => t + y.achats, 0));
    expect(d.credit).toBe(Math.round(x.ventes * taux) - Math.round(d.achatsDeLAnnee * taux));
    expect(d.credit).toBeLessThan(0);
    const e = etape(LA_DECLARATION_DE_TVA, "liquidation");
    if (e.type !== "ecriture") throw new Error("la liquidation est une écriture");
    expect(e.ecriture(cas).lignes.map((l) => [l.compte, l.sens, l.montant])).toEqual([
      ["44571", "debit", x.collectee],
      ["44566", "credit", x.deductible],
      ["44551", "credit", x.nette],
    ]);
  });

  it("les dépenses que la question nomme sont bien payées ce trimestre, et sans TVA dans le moteur", () => {
    const r = ref[TRIMESTRE_DECLARE - 1]!;
    for (const label of ["couts_fixes", "marketing", "maintenance"]) expect(flux(r, label), label).toBeLessThan(0);
    // Elles ne changent pas la TVA : la dette du bilan ne tient qu'aux ventes et aux achats.
    expect(r.balanceSheet.vatLiability!).toBeCloseTo(taux * (r.incomeStatement.revenue - achatsDuTrimestre(r)), 6);
    expect(flux(r, "investissement")).toBe(0);
  });

  it("textes propres, une seule bonne réponse, notions existantes, une écriture juste", () => verifierLesTextes(LA_DECLARATION_DE_TVA, code));
});

describe.each(ENTREPRISES_OU_LA_TVA_JOUE)("la TVA et la trésorerie chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const taux = s.finance.vatRate!;
  const ref = annee(code);

  it("les créances et les dettes du bilan sont TTC, aux délais des clientèles et du fournisseur", () => {
    const k = tvaEtTresorerie(cas);
    for (const r of ref) {
      const creances = s.market.segments.reduce((t, g) => t + (r.market.bySegment[g.code]?.revenue ?? 0) * (1 + taux) * Math.min(1, g.paymentDelayDays / s.roundDays), 0);
      expect(r.balanceSheet.receivables).toBeCloseTo(creances, 4);
      expect(r.balanceSheet.payables).toBeCloseTo(achatsDuTrimestre(r) * (1 + taux) * Math.min(1, k.fournisseur.delai / s.roundDays), 4);
    }
    expect(k.clienteles.map((g) => g.delai)).toEqual(s.market.segments.map((g) => g.paymentDelayDays));
  });

  it("rejouée sans TVA, l'année garde son résultat, et sa trésorerie s'écarte de ce que la TVA laisse en caisse", () => {
    const k = tvaEtTresorerie(cas);
    expect(k.resultatsEgaux).toBe(true);
    k.clotures.forEach((x, i) => {
      const r = ref[i]!;
      const exact = r.balanceSheet.vatLiability! + (r.balanceSheet.payables - r.balanceSheet.receivables) * (taux / (1 + taux));
      expect(Math.abs(x.effet - exact), `T${i + 1}`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(k.ecartAuxDates[i]! - exact), `T${i + 1}`).toBeLessThanOrEqual(1);
      expect(x.resultat).toBe(x.resultatSansTva);
    });
    expect(champsDe(LA_TVA_ET_LA_TRESORERIE, "au-30-juin", cas)).toEqual([k.juin.tvaClients, k.juin.tvaFournisseur, k.juin.effet]);
    expect(k.juin.effet).toBe(k.juin.tvaEtat + k.juin.tvaFournisseur - k.juin.tvaClients);
    expect(k.juin.tvaEtat).toBe(declarationDeTva(cas).declare.aDecaisser);
    expect(k.quiFaitCredit).toBe(k.juin.effet < 0 ? "l-entreprise" : k.juin.tvaEtat >= k.juin.tvaClients ? "l-etat" : "le-fournisseur");
  });

  it("le budget de trésorerie du troisième trimestre : la TVA encaissée, payée et versée fait passer l'effet d'une clôture à l'autre", () => {
    const k = tvaEtTresorerie(cas);
    const t = k.troisieme;
    const r = ref[TRIMESTRE_DES_FLUX - 1]!;
    expect(t.encaissements).toBe(Math.round(flux(r, "encaissements_clients")));
    expect(t.paiements).toBe(Math.round(-flux(r, "paiements_fournisseurs")));
    expect(t.tvaVersee).toBe(declarationDeTva(cas).trimestres[TRIMESTRE_DES_FLUX - 1]!.versee);
    expect(t.solde).toBe(t.tvaEncaissee - t.tvaPayee - t.tvaVersee);
    // Le solde du trimestre est la variation de ce que la TVA laisse en trésorerie.
    expect(Math.abs(t.solde - (t.apres - t.avant))).toBeLessThanOrEqual(3);
    expect(champsDe(LA_TVA_ET_LA_TRESORERIE, "troisieme-trimestre", cas)).toEqual([t.tvaEncaissee, t.tvaPayee, t.solde]);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LA_TVA_ET_LA_TRESORERIE, code));
});

describe("la TVA et la trésorerie, sur les deux entreprises", () => {
  it("l'État fait crédit chez l'une ; chez l'autre, il y faut aussi le fournisseur", () => {
    const lectures = ENTREPRISES_OU_LA_TVA_JOUE.map((c) => tvaEtTresorerie(casDeLEntreprise(c)).quiFaitCredit);
    expect([...new Set(lectures)].sort()).toEqual(["l-etat", "le-fournisseur"]);
  });

  it("la TVA soulage la trésorerie à un trimestre et pèse à un autre", () => {
    // Au troisième trimestre, celui que le chapitre lit, la TVA pèse chez les deux entreprises : dans
    // l'année du cours tenue par le bon gestionnaire, la branche « la TVA a soulagé la trésorerie »
    // de l'explication ne se lit plus.
    const soldes = ENTREPRISES_OU_LA_TVA_JOUE.map((c) => Math.sign(tvaEtTresorerie(casDeLEntreprise(c)).troisieme.solde));
    expect([...new Set(soldes)].sort()).toEqual([-1]);
    // Mais l'explication le dit : d'un trimestre à l'autre, elle soulage ou elle pèse. Le solde de TVA
    // de chaque trimestre, recalculé sur le budget de trésorerie de l'arène, change de signe dans l'année.
    for (const code of ENTREPRISES_OU_LA_TVA_JOUE) {
      const part = scenarioByCode(code).scenario.finance.vatRate! / (1 + scenarioByCode(code).scenario.finance.vatRate!);
      const flux = (r: CompanyRoundResult, label: string) => r.cashFlow.items.find((i) => i.label === label)?.amount ?? 0;
      const signes = annee(code).map((r) => Math.sign((flux(r, "encaissements_clients") + flux(r, "paiements_fournisseurs")) * part + flux(r, "tva_decaissee")));
      expect([...new Set(signes)].sort(), code).toEqual([-1, 1]);
    }
  });
});

describe.each(ENTREPRISES_OU_LA_TVA_JOUE)("la TVA du dernier trimestre chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const ref = annee(code);

  it("la déclaration du quatrième trimestre est la dette du bilan de fin d'année, et l'écart se compare au dernier versement", () => {
    const k = tvaDuDernierTrimestre(cas);
    expect(Math.abs(k.quatrieme.nette - ref[3]!.balanceSheet.vatLiability!)).toBeLessThanOrEqual(1);
    expect(k.quatrieme.versee).toBe(Math.round(ref[2]!.balanceSheet.vatLiability!));
    expect(k.ecart).toBe(k.quatrieme.nette - k.quatrieme.versee);
    expect(k.verdict).toBe(k.ecart > 0 ? "plus-lourde" : "plus-legere");
    expect(champsDe(LA_TVA_DU_DERNIER_TRIMESTRE, "declaration", cas)).toEqual([k.quatrieme.collectee, k.quatrieme.deductible, k.quatrieme.nette]);
    expect(champsDe(LA_TVA_DU_DERNIER_TRIMESTRE, "comparer", cas)).toEqual([k.ecart]);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_TVA_DU_DERNIER_TRIMESTRE, code);
    reponseSansIndice(LA_TVA_DU_DERNIER_TRIMESTRE, code);
  });
});

describe.each(ENTREPRISES_OU_LA_TVA_JOUE)("la TVA avancée pour le client chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const taux = s.finance.vatRate!;
  const ref = annee(code);

  it("l'année rejouée ne change que le délai de la clientèle, et sa créance de fin d'année est celle du moteur", () => {
    const k = tvaAvanceePourLeClient(cas);
    expect(k.delai).toBe(k.clientele.delai + JOURS_DEMANDES);
    expect(k.clientele.delai).toBeGreaterThan(0);
    expect(k.delai).toBeLessThanOrEqual(s.roundDays);
    const fin = ref.at(-1)!;
    const alt = k.annee.at(-1)!;
    // La même activité : mêmes ventes, même TVA à décaisser, seule la créance grandit.
    k.annee.forEach((r, i) => expect(r.incomeStatement.revenue, `T${i + 1}`).toBeCloseTo(ref[i]!.incomeStatement.revenue, 6));
    expect(alt.balanceSheet.vatLiability!).toBeCloseTo(fin.balanceSheet.vatLiability!, 6);
    expect(Math.abs(alt.balanceSheet.receivables - fin.balanceSheet.receivables - k.creanceEnPlus)).toBeLessThanOrEqual(1);
    expect(k.creanceEnPlus).toBe(Math.round((k.ventes * (1 + taux) * JOURS_DEMANDES) / s.roundDays));
    expect(k.tvaEnPlus).toBe(Math.round((k.ventes * taux * JOURS_DEMANDES) / s.roundDays));
    // La trésorerie perd la créance en plus, et ce que le résultat perd en intérêts.
    expect(Math.abs(k.perte - k.creanceEnPlus - k.resultatPerdu)).toBeLessThanOrEqual(2);
    if (k.resultatPerdu > 0) expect(k.decouvert).toBe(true);
    // Ce que la TVA laisse encore en caisse, tel que le bilan rejoué le donne.
    const exact = alt.balanceSheet.vatLiability! + (alt.balanceSheet.payables - alt.balanceSheet.receivables) * (taux / (1 + taux));
    expect(Math.abs(k.effetAvecLeDelai - exact)).toBeLessThanOrEqual(3);
    expect(champsDe(LA_TVA_AVANCEE_POUR_LE_CLIENT, "creance", cas)).toEqual([k.creanceEnPlus, k.tvaEnPlus]);
    expect(champsDe(LA_TVA_AVANCEE_POUR_LE_CLIENT, "arene", cas)).toEqual([k.perte, k.effetAvecLeDelai]);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_TVA_AVANCEE_POUR_LE_CLIENT, code);
    reponseSansIndice(LA_TVA_AVANCEE_POUR_LE_CLIENT, code);
  });
});

describe("la TVA du dernier trimestre, sur les deux entreprises", () => {
  it("le versement suivant est plus lourd chez les deux", () => {
    // Dans l'année du cours tenue par le bon gestionnaire, la TVA du quatrième trimestre dépasse
    // partout celle du troisième : la réponse « plus léger » ne se lit plus, elle reste juste pour une
    // autre année.
    const verdicts = new Set(ENTREPRISES_OU_LA_TVA_JOUE.map((c) => tvaDuDernierTrimestre(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["plus-lourde"]);
  });
});

describe("l'exigibilité de la TVA est dite juste (travaux et services)", () => {
  // MARTEL & FILS (travaux) et ROUTE & CIE (transport) vendent des services : leur TVA n'est due
  // par défaut qu'à l'encaissement. L'arène la fait verser sur les factures : c'est l'option pour
  // les débits, et chaque texte qui s'en sert doit la nommer (audit d'octobre 2026, défaut 2).
  it.each(ENTREPRISES_OU_LA_TVA_JOUE)("chez %s, les deux chapitres et le cas disent l'option pour les débits", (code) => {
    const cas = casDeLEntreprise(code);
    const intro = (c: Chapitre) => {
      const e = c.etapes[0]!;
      return e.type === "lecture" ? e.texte(cas).join(" ") : "";
    };
    expect(intro(LA_DECLARATION_DE_TVA)).toMatch(/opté pour la TVA « d'après les débits »/);
    expect(intro(LA_DECLARATION_DE_TVA)).toMatch(/à l'encaissement du prix, sauf si l'entreprise opte pour les débits/);
    expect(intro(LA_TVA_ET_LA_TRESORERIE)).toMatch(/opté pour la TVA d'après les débits/);
    expect(intro(LA_TVA_AVANCEE_POUR_LE_CLIENT)).toMatch(/a opté pour la TVA d'après les débits/);
    const reponse = LA_TVA_AVANCEE_POUR_LE_CLIENT.etapes.at(-1)!;
    if (reponse.type !== "choix") throw new Error("La réponse du cas est un choix");
    const piege = reponse.options(cas, { soldes: {} }).find((o) => /qu'une fois payée par le client/.test(o.texte))!;
    expect(piege.juste).toBe(false);
    expect(piege.retour).toMatch(/ce serait vrai sans l'option/);
  });
});
