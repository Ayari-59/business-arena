import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ARTICLES_COMPARES,
  ARTICLE_DU_CLIENT,
  CLES_DU_PANIER,
  ENTREPRISES_DE_LA_VENTE,
  LE_PANIER_MOYEN,
  TRIMESTRE_DU_PANIER,
  VENTES_DE_PLUS_PAR_JOUR,
} from "../../src/config/cours/chapitres/le-panier-moyen";
import {
  SEUIL_DE_PRIX,
  PROGRESSION_EN_POURCENT,
  SUIVRE_SES_VENTES,
  TRIMESTRE_SUIVI,
  objectifSur,
  suiviDeLAnnee,
} from "../../src/config/cours/chapitres/suivre-ses-ventes";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { L_OBJECTIF_DE_L_ETE, TRIMESTRE_DE_L_ETE } from "../../src/config/cours/situations/par-chapitre/l-objectif-de-l-ete";
import {
  LE_PANIER_DE_FIN_D_ANNEE,
  SEUIL_DE_VARIATION,
  TRIMESTRE_DE_FIN_D_ANNEE,
  panierDeFinDAnnee,
} from "../../src/config/cours/situations/par-chapitre/le-panier-de-fin-d-annee";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { ARTICLES_PAR_TICKET } from "../../src/config/scenarios/sector-kpis";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { auCentime } from "../../src/pedagogy/cours/etats";

/**
 * LE PANIER MOYEN ET LE SUIVI DES VENTES (BAC PRO MCV, PALIER 1), ET LEURS CAS PRATIQUES.
 *
 * Ces gardes recomposent les chiffres avec le moteur, sans passer par les fonctions des
 * chapitres : le chiffre d'affaires, les ventes, la marge sur coût variable et la demande de
 * chaque trimestre de l'année du cours, dans chaque entreprise où les chapitres se jouent. Elles
 * recomptent ces entreprises sur les indicateurs de l'arène, vérifient chaque valeur attendue,
 * des verdicts qui changent d'une entreprise à l'autre, et des textes qui se lisent.
 */

const etatVide: EtatDuCours = { soldes: {} };
const ENTREPRISES = [...ENTREPRISES_DE_LA_VENTE];

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
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "demandé", "servi", "produit", "dernier", "perdu", "livré", "prévu", "reparti"];

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
    // Le test de bout en bout clique les boutons par leur nom : aucun titre ne s'y confond.
    expect(e.titre, e.id).not.toMatch(/v[ée]rifier|étape suivante|terminer|montrer la réponse|changer le signe|valider/i);
    if (e.tableau) expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/« «|» »/);
      // Pas de capitales espacées, pas de nombre en lettres là où il se calcule.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b([A-Z] ){2,}[A-Z]\b/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
      // « Les clients ont demandés » : un participe avec avoir ne s'accorde pas avec ce qui le suit.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bont (demandés|demandées|vendus|vendues)\s+\d/);
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
        // Au centime : le montant se saisit tel quel, au téléphone comme à l'ordinateur.
        expect(auCentime(c.attendu), `${e.id} : ${c.libelle}`).toBe(c.attendu);
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
  const options = e.options(cas, etatVide);
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Les champs d'une étape de montants, par libellé, dans l'entreprise donnée. */
function champs(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === id);
  if (!e || e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants chez ${cas.code}`);
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

const justeDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === id);
  if (!e || e.type !== "choix") throw new Error(`${id} n'est pas un choix chez ${cas.code}`);
  return e.options(cas, etatVide).find((o) => o.juste)!.texte;
};

const aEtapes = (ch: Chapitre, code: string) => chapitreDuCas(ch, casDeLEntreprise(code)).etapes.map((e) => e.id);

/** Le trimestre de l'élève, tel que le moteur l'a joué. */
const joueur = (code: string, t: number): CompanyRoundResult => anneeJouee(code).partie.rounds[t - 1]!.results["joueur"]!;
const vendusDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((s, v) => s + v.sold, 0);
const demandeDu = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((s, v) => s + v.demandForCompany, 0);
const gamme = (code: string) => (scenarioByCode(code).scenario.products?.length ?? 0) > 1;

/** Le trimestre recomposé par le test : panier, coût et marge d'une vente. */
function venteRecomposee(code: string, t: number) {
  const r = joueur(code, t);
  const unites = Math.round(vendusDu(r));
  const ca = Math.round(r.incomeStatement.revenue);
  // Le coût des ventes : le coût des unités vendues et les commissions, ce que la marge sur coût variable retranche.
  const cout = Math.round(r.incomeStatement.cogs + (r.incomeStatement.commissionCost ?? 0));
  const ventes = gamme(code) ? Math.round(unites / ARTICLES_PAR_TICKET) : unites;
  const panier = auCentime(ca / ventes);
  const coutDUneVente = auCentime(cout / ventes);
  return { r, unites, ca, cout, ventes, panier, coutDUneVente, marge: auCentime(panier - coutDUneVente) };
}

describe("les deux chapitres du Bac pro MCV et leurs cas", () => {
  it("portent les titres du programme, au palier 1, et des blocs qui se résolvent", () => {
    const attendus: [Chapitre, string[]][] = [
      [LE_PANIER_MOYEN, ["Bac pro MCV · Bloc 1 · Conseiller et vendre", "Bac pro MCV · Bloc 2 · Suivre les ventes"]],
      [SUIVRE_SES_VENTES, ["Bac pro MCV · Bloc 2 · Suivre les ventes", "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client"]],
    ];
    for (const [ch, blocs] of attendus) {
      expect(PROGRAMME.vente[1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("vente");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(blocs);
      for (const bloc of blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite?.code, bloc).toBe(bloc.startsWith("Bac pro MCV") ? "bac-pro-mcv" : "seconde-pro-rc");
        expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace(/^(Bac pro MCV|2de pro RC) · /, ""));
      }
    }
    expect(LE_PANIER_MOYEN.code).toBe("le-panier-moyen");
    expect(SUIVRE_SES_VENTES.code).toBe("suivre-ses-ventes");
  });

  it("se jouent là où un vendeur vend à un client et où l'arène affiche un panier, recomptées sur le moteur", () => {
    const recomptees = ENTREPRISES_DU_COURS.filter((code) => scenarioByCode(code).kpis.some((k) => ["panier_moyen", "ticket_moyen", "pmc"].includes(k.key)));
    expect(recomptees).toEqual(ENTREPRISES);
    expect([...CLES_DU_PANIER].sort()).toEqual(["panier_moyen", "pmc", "ticket_moyen"]);
    expect(ENTREPRISES).toEqual(["boutique", "hotel", "bistrot", "ecommerce"]);
    expect(LE_PANIER_MOYEN.entreprises?.codes).toBe(ENTREPRISES_DE_LA_VENTE);
    expect(SUIVRE_SES_VENTES.entreprises?.codes).toBe(ENTREPRISES_DE_LA_VENTE);
    // Une vente au client, et un seul prix pour toutes les clientèles hors de la gamme : le panier y est le prix.
    for (const code of ENTREPRISES) {
      const r = joueur(code, 1);
      expect(Object.values(r.market.bySegment).some((v) => v.sold > 0), code).toBe(true);
      expect(r.extraOrders ?? null, code).toBeNull();
      expect(r.orderOffer?.delivered ?? 0, code).toBe(0);
    }
    // Les autres ne vendent pas au client un par un : une fabrique, un cabinet, un club, un chantier, un transporteur.
    expect(ENTREPRISES_DU_COURS.filter((x) => !ENTREPRISES.includes(x as (typeof ENTREPRISES)[number])).sort()).toEqual(["batiment", "conseil", "fitness", "nova", "transport"]);
    // L'année du cours ne connaît aucune défaillance dans ces entreprises : rien à trancher.
    for (const code of ENTREPRISES) for (let t = 1; t <= 4; t++) expect(joueur(code, t).defaillant, `${code} T${t}`).toBeFalsy();
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_PANIER_DE_FIN_D_ANNEE, LE_PANIER_MOYEN],
      [L_OBJECTIF_DE_L_ETE, SUIVRE_SES_VENTES],
    ];
    for (const [sit, ch] of paires) {
      expect(sit.reprend, sit.code).toEqual([ch.code]);
      expect(sit.palier, sit.code).toBe(ch.palier);
      expect(sit.parcours, sit.code).toBe(ch.parcours);
      expect(sit.entreprises?.codes, sit.code).toEqual(ch.entreprises?.codes);
      expect(sit.libre, sit.code).toBe(false);
      expect(sit.blocs, sit.code).toEqual([]);
      expect(sit.commanditaire.length, sit.code).toBeGreaterThan(3);
      expect(sit.etapes[0]!.type, sit.code).toBe("lecture");
      expect(sit.etapes.slice(1).filter((e) => e.type === "lecture"), sit.code).toHaveLength(0);
      expect(sit.etapes.at(-1)!.type, sit.code).toBe("choix");
      expect(sit.code, sit.code).not.toBe(ch.code);
    }
  });
});

describe("le panier moyen et la marge d'une vente", () => {
  it("le panier, le coût et la marge d'une vente se recomposent sur le trimestre de l'arène, partout", () => {
    expect(TRIMESTRE_DU_PANIER).toBe(1);
    expect(ARTICLES_PAR_TICKET).toBe(1.6);
    for (const code of ENTREPRISES) {
      const cas = casDeLEntreprise(code);
      const v = venteRecomposee(code, TRIMESTRE_DU_PANIER);
      // Le coût des ventes est bien ce que la marge sur coût variable de l'arène retranche.
      expect(v.cout, code).toBe(Math.round(v.r.incomeStatement.revenue - v.r.incomeStatement.grossMargin));
      const p = champs(LE_PANIER_MOYEN, "le-panier", cas);
      expect(p["Panier moyen"], code).toBe(v.panier);
      if (gamme(code)) expect(p["Passages en caisse"], code).toBe(v.ventes);
      else expect(p["Passages en caisse"], code).toBeUndefined();
      // Le panier que l'arène affiche (ses unités non arrondies) : à quelques centimes près, comme le texte le dit.
      const arene = v.r.incomeStatement.revenue / (vendusDu(v.r) / (gamme(code) ? ARTICLES_PAR_TICKET : 1));
      expect(Math.abs(arene - v.panier), code).toBeLessThanOrEqual(0.05);
      const m = champs(LE_PANIER_MOYEN, "la-marge", cas);
      expect(m["Coût d'une vente"], code).toBe(v.coutDUneVente);
      expect(m["Marge d'une vente"], code).toBe(v.marge);
      expect(justeDe(LE_PANIER_MOYEN, "une-vente-de-plus", cas), code).toBe(`${v.marge.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(v.marge) ? 0 : 2 })} €, la marge d'une vente`);
      const j = champs(LE_PANIER_MOYEN, "chaque-jour", cas);
      const jours = scenarioByCode(code).scenario.roundDays;
      expect(j["Ventes en plus sur le trimestre"], code).toBe(VENTES_DE_PLUS_PAR_JOUR * jours);
      expect(j["Chiffre d'affaires en plus"], code).toBe(auCentime(VENTES_DE_PLUS_PAR_JOUR * jours * v.panier));
      expect(j["Marge en plus"], code).toBe(auCentime(VENTES_DE_PLUS_PAR_JOUR * jours * v.marge));
    }
    // Les chiffres de l'arène aujourd'hui : chiffre d'affaires, ventes, coût des ventes, panier, coût et marge d'une vente.
    const resume = (code: string) => {
      const v = venteRecomposee(code, 1);
      return [v.ca, v.ventes, v.cout, v.panier, v.coutDUneVente, v.marge];
    };
    expect(resume("boutique")).toEqual([255320, 2876, 124670, 88.78, 43.35, 45.43]);
    expect(resume("hotel")).toEqual([301441, 3425, 77406, 88.01, 22.6, 65.41]);
    expect(resume("bistrot")).toEqual([205091, 6032, 79859, 34, 13.24, 20.76]);
    expect(resume("ecommerce")).toEqual([198590, 3203, 116297, 62, 36.31, 25.69]);
    expect(VENTES_DE_PLUS_PAR_JOUR).toBe(2);
  });

  it("hors de la gamme, chaque clientèle paie le même prix : le texte dit que le panier est le prix", () => {
    for (const code of ENTREPRISES.filter((x) => !gamme(x))) {
      const r = joueur(code, 1);
      const prix = Object.values(r.market.bySegment).filter((v) => v.sold > 0).map((v) => v.revenue / v.sold);
      expect(Math.max(...prix) / Math.min(...prix), code).toBeLessThanOrEqual(1.01);
      const e = chapitreDuCas(LE_PANIER_MOYEN, casDeLEntreprise(code)).etapes.find((x) => x.id === "le-panier")!;
      if (e.type !== "montants") throw new Error("montants");
      expect(e.explication(casDeLEntreprise(code), etatVide).join(" "), code).toContain("le panier moyen est le prix");
    }
  });

  it("à la boutique, le panier se lit article par article, et l'article à proposer est celui qui laisse le plus de marge", () => {
    const code = "boutique";
    const cas = casDeLEntreprise(code);
    const r = joueur(code, TRIMESTRE_DU_PANIER);
    const { ventes, panier } = venteRecomposee(code, TRIMESTRE_DU_PANIER);
    const noms = new Map(scenarioByCode(code).scenario.products!.map((p) => [p.code, p.name]));
    const parts = champs(LE_PANIER_MOYEN, "le-panier-par-article", cas);
    for (const a of ARTICLES_COMPARES) {
      expect(parts[`Part de l'article « ${noms.get(a)} » dans le panier`], a).toBe(auCentime(Math.round(r.products![a]!.revenue) / ventes));
    }
    expect([...ARTICLES_COMPARES]).toEqual(["echarpe", "pull-merinos"]);
    expect(Object.values(parts)).toEqual([11.16, 15.61]);
    // Toutes les parts ensemble refont le panier, à quelques centimes près, comme le texte le dit.
    const somme = Object.values(r.products!).reduce((t, p) => t + auCentime(Math.round(p.revenue) / ventes), 0);
    expect(Math.abs(somme - panier)).toBeLessThanOrEqual(0.05);
    // L'écharpe se vend plus que le mérinos, mais pèse moins dans le panier.
    expect(r.products!.echarpe!.sold).toBeGreaterThan(r.products!["pull-merinos"]!.sold);
    expect(parts["Part de l'article « Mérinos » dans le panier"]).toBeGreaterThan(parts["Part de l'article « Écharpe » dans le panier"]!);
    // L'article à proposer : la plus grande marge (prix moins coût de l'arène), hors de l'article déjà pris.
    const marges = Object.entries(r.products!)
      .filter(([k]) => k !== ARTICLE_DU_CLIENT)
      .map(([k, p]) => ({ nom: noms.get(k)!, marge: auCentime(auCentime(p.price) - auCentime(p.unitVariableCost)) }))
      .sort((a, b) => b.marge - a.marge);
    expect(justeDe(LE_PANIER_MOYEN, "l-article-a-proposer", cas)).toBe(marges[0]!.nom);
    expect(marges[0]).toEqual({ nom: "Mérinos", marge: 74 });
    // Les étapes de la gamme ne se jouent qu'à la boutique.
    for (const autre of ENTREPRISES.filter((x) => x !== code)) {
      expect(aEtapes(LE_PANIER_MOYEN, autre), autre).not.toContain("le-panier-par-article");
      expect(aEtapes(LE_PANIER_MOYEN, autre), autre).not.toContain("l-article-a-proposer");
    }
    expect(aEtapes(LE_PANIER_MOYEN, code)).toContain("l-article-a-proposer");
  });

  it.each(ENTREPRISES)("textes propres, une seule bonne réponse, notions existantes, chez %s", (code) => verifierLesTextes(LE_PANIER_MOYEN, code));
});

/** Le suivi recomposé par le test : l'objectif posé sur le trimestre d'avant, et ce qui l'explique. */
function suiviRecompose(code: string, t: number) {
  const avant = Math.round(vendusDu(joueur(code, t - 1)));
  const r = joueur(code, t);
  const ventes = Math.round(vendusDu(r));
  const demande = Math.round(demandeDu(r));
  // L'objectif : les ventes d'avant, plus 10 %, à l'unité du dessus (calculé en entiers).
  const objectif = Math.ceil((avant * 110) / 100);
  const ecart = ventes - objectif;
  return {
    objectif,
    ventes,
    demande,
    ecart,
    ecartPct: Math.round((ecart / objectif) * 1000) / 10,
    taux: Math.round((ventes / objectif) * 1000) / 10,
    verdict: ecart >= 0 ? "atteint" : demande < objectif ? "clients" : "service",
  };
}

/** Les prix d'un trimestre, référence par référence (ou le prix unique). */
function prixDu(code: string, t: number): number[] {
  const r = joueur(code, t);
  if (gamme(code)) return Object.values(r.products!).map((p) => p.price);
  return [r.incomeStatement.revenue / vendusDu(r)];
}

describe("suivre ses ventes : l'objectif, le réalisé, l'écart", () => {
  it("l'objectif se calcule en entiers, à l'unité du dessus", () => {
    expect(PROGRESSION_EN_POURCENT).toBe(10);
    expect(objectifSur(3425)).toBe(3768);
    expect(objectifSur(4600)).toBe(5060);
    expect(objectifSur(4270)).toBe(4697);
    expect(objectifSur(4601)).toBe(5062);
  });

  it("l'objectif, l'écart, le taux et les clients se recomposent au trimestre suivi, partout", () => {
    expect(TRIMESTRE_SUIVI).toBe(2);
    for (const code of ENTREPRISES) {
      const cas = casDeLEntreprise(code);
      const k = suiviRecompose(code, TRIMESTRE_SUIVI);
      expect(champs(SUIVRE_SES_VENTES, "l-objectif", cas)[`Objectif du trimestre ${TRIMESTRE_SUIVI}`], code).toBe(k.objectif);
      const e = champs(SUIVRE_SES_VENTES, "l-ecart", cas);
      expect(e[`Écart en ${cas.unites}`], code).toBe(k.ecart);
      expect(e["Écart en pourcentage (%)"], code).toBe(k.ecartPct);
      expect(champs(SUIVRE_SES_VENTES, "le-taux-de-realisation", cas)["Taux de réalisation (%)"], code).toBe(k.taux);
      // Le taux, c'est 100 % plus l'écart, au dixième près : l'explication le dit.
      expect(Math.abs(k.taux - (100 + k.ecartPct)), code).toBeLessThanOrEqual(0.1 + 1e-9);
      const cl = Object.values(champs(SUIVRE_SES_VENTES, "les-clients", cas));
      expect(cl, code).toEqual([k.demande - k.ventes, k.demande - k.objectif]);
      // Les prix n'ont pas bougé : le verdict se lit sur les clients venus et servis.
      const [p1, p2] = [prixDu(code, TRIMESTRE_SUIVI - 1), prixDu(code, TRIMESTRE_SUIVI)];
      p1.forEach((p, i) => expect(Math.abs(p2[i]! - p), code).toBeLessThanOrEqual(p * SEUIL_DE_PRIX));
    }
    // Les chiffres de l'arène aujourd'hui : objectif, réalisé, demande, et le verdict.
    const resume = (code: string) => {
      const k = suiviRecompose(code, TRIMESTRE_SUIVI);
      return [k.objectif, k.ventes, k.demande, k.taux, k.verdict];
    };
    expect(resume("boutique")).toEqual([5062, 2969, 2980, 58.7, "clients"]);
    expect(resume("hotel")).toEqual([3768, 4270, 4427, 113.3, "atteint"]);
    expect(resume("bistrot")).toEqual([6636, 7325, 8506, 110.4, "atteint"]);
    expect(resume("ecommerce")).toEqual([3524, 3372, 3712, 95.7, "service"]);
  });

  it("le verdict se calcule, et les trois se rencontrent d'une entreprise à l'autre", () => {
    const pourquoi: Record<string, string> = {
      atteint: "Assez de clients ont été servis pour l'atteindre",
      clients: "Il est venu moins de clients que l'objectif",
      service: "Assez de clients sont venus, mais tous n'ont pas été servis",
    };
    const ensuite: Record<string, string> = {
      atteint: "Garder sa façon de vendre, et viser plus haut",
      clients: "Faire venir plus de clients",
      service: "Servir tous les clients qui viennent",
    };
    const vus = new Set<string>();
    for (const code of ENTREPRISES) {
      const cas = casDeLEntreprise(code);
      const { verdict } = suiviRecompose(code, TRIMESTRE_SUIVI);
      vus.add(verdict);
      expect(justeDe(SUIVRE_SES_VENTES, "pourquoi", cas), code).toBe(pourquoi[verdict]);
      expect(justeDe(SUIVRE_SES_VENTES, "et-ensuite", cas), code).toBe(ensuite[verdict]);
    }
    expect([...vus].sort()).toEqual(["atteint", "clients", "service"]);
  });

  it("le tableau de l'année suit la même règle à chaque trimestre", () => {
    for (const code of ENTREPRISES) {
      const annee = suiviDeLAnnee(casDeLEntreprise(code));
      expect(annee.map((k) => k.trimestre), code).toEqual([2, 3, 4]);
      for (const k of annee) {
        const r = suiviRecompose(code, k.trimestre);
        expect([k.objectif, k.pendant.ventes, k.tauxDeRealisation, k.verdict], `${code} T${k.trimestre}`).toEqual([r.objectif, r.ventes, r.taux, r.verdict]);
        expect(k.prixChanges, `${code} T${k.trimestre}`).toBe(false);
      }
    }
  });

  it.each(ENTREPRISES)("textes propres, une seule bonne réponse, notions existantes, chez %s", (code) => verifierLesTextes(SUIVRE_SES_VENTES, code));
});

describe("le panier de fin d'année", () => {
  it("le trimestre 4 se recompose, et son écart avec le trimestre 1 donne le verdict", () => {
    expect([TRIMESTRE_DE_FIN_D_ANNEE, SEUIL_DE_VARIATION]).toEqual([4, 0.01]);
    const bilans = new Set<string>();
    for (const code of ENTREPRISES) {
      const cas = casDeLEntreprise(code);
      const debut = venteRecomposee(code, 1);
      const fin = venteRecomposee(code, TRIMESTRE_DE_FIN_D_ANNEE);
      const k = champs(LE_PANIER_DE_FIN_D_ANNEE, "la-fin-d-annee", cas);
      expect([k["Panier moyen"], k["Coût d'une vente"], k["Marge d'une vente"]], code).toEqual([fin.panier, fin.coutDUneVente, fin.marge]);
      if (gamme(code)) expect(k["Passages en caisse"], code).toBe(fin.ventes);
      const e = champs(LE_PANIER_DE_FIN_D_ANNEE, "les-ecarts", cas);
      expect(e["Écart du panier moyen"], code).toBe(auCentime(fin.panier - debut.panier));
      expect(e["Écart de la marge d'une vente"], code).toBe(auCentime(fin.marge - debut.marge));
      const bilan = panierDeFinDAnnee(cas).bilan;
      bilans.add(bilan);
      // La marge baisse partout au-delà du seuil : la fin d'année vend plus, pas mieux.
      expect(fin.marge - debut.marge, code).toBeLessThan(-debut.marge * SEUIL_DE_VARIATION);
      expect(fin.ventes, code).toBeGreaterThan(debut.ventes);
      const panierBaisse = fin.panier - debut.panier < -debut.panier * SEUIL_DE_VARIATION;
      expect(bilan, code).toBe(panierBaisse ? "panier-baisse" : "cout-monte");
      expect(justeDe(LE_PANIER_DE_FIN_D_ANNEE, "reponse", cas), code).toBe(
        panierBaisse ? "Non : le panier a baissé, et la marge avec lui" : "Non : le panier tient, mais chaque vente coûte plus",
      );
    }
    expect([...bilans].sort()).toEqual(["cout-monte", "panier-baisse"]);
    expect(panierDeFinDAnnee(casDeLEntreprise("boutique")).bilan).toBe("panier-baisse");
    expect(venteRecomposee("boutique", 4).panier).toBe(86);
  });

  it.each(ENTREPRISES)("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur, chez %s", (code) => {
    verifierLesTextes(LE_PANIER_DE_FIN_D_ANNEE, code);
    reponseSansIndice(LE_PANIER_DE_FIN_D_ANNEE, code);
  });
});

describe("l'objectif de l'été", () => {
  it("l'objectif, le taux et les clients de l'été se recomposent, et la prime suit le verdict", () => {
    expect(TRIMESTRE_DE_L_ETE).toBe(3);
    const reponses: Record<string, string> = {
      atteint: "Prime gagnée : les ventes atteignent l'objectif",
      clients: "Pas de prime : trop peu de clients sont venus",
      service: "Pas de prime : des clients n'ont pas été servis",
    };
    const verdicts: Record<string, string> = {};
    for (const code of ENTREPRISES) {
      const cas = casDeLEntreprise(code);
      const k = suiviRecompose(code, TRIMESTRE_DE_L_ETE);
      const a = champs(L_OBJECTIF_DE_L_ETE, "l-objectif-et-le-realise", cas);
      expect([a["Objectif de l'été"], a[`Écart en ${cas.unites}`], a["Taux de réalisation (%)"]], code).toEqual([k.objectif, k.ecart, k.taux]);
      expect(Object.values(champs(L_OBJECTIF_DE_L_ETE, "les-clients-de-l-ete", cas)), code).toEqual([k.demande - k.ventes, k.demande - k.objectif]);
      const [p1, p2] = [prixDu(code, TRIMESTRE_DE_L_ETE - 1), prixDu(code, TRIMESTRE_DE_L_ETE)];
      p1.forEach((p, i) => expect(Math.abs(p2[i]! - p), code).toBeLessThanOrEqual(p * SEUIL_DE_PRIX));
      expect(justeDe(L_OBJECTIF_DE_L_ETE, "reponse", cas), code).toBe(reponses[k.verdict]);
      verdicts[code] = k.verdict;
    }
    // L'été n'est pas le printemps du chapitre : d'autres entreprises gagnent leur prime.
    expect(verdicts).toEqual({ boutique: "atteint", hotel: "atteint", bistrot: "clients", ecommerce: "clients" });
  });

  it.each(ENTREPRISES)("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur, chez %s", (code) => {
    verifierLesTextes(L_OBJECTIF_DE_L_ETE, code);
    reponseSansIndice(L_OBJECTIF_DE_L_ETE, code);
  });
});
