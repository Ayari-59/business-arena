import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ARRONDI_DE_L_ETIQUETTE,
  ARTICLE_A_ETIQUETER,
  ARTICLE_EN_PROMOTION,
  ENTREPRISES_DU_MAGASIN,
  LE_PRIX_AFFICHE,
  REMISE_DE_LA_PROMOTION,
  TRIMESTRE_DE_LA_PROMOTION,
  arrondiDeLEtiquette,
  etiquettesDuRayon,
  promotionDuChapitre,
  ventesDeLArticle,
} from "../../src/config/cours/chapitres/le-prix-affiche";
import {
  BILLET_DU_CLIENT,
  ERREUR_DE_LA_JOURNEE,
  FOND_DE_CAISSE,
  PANIER_DU_CLIENT,
  PART_EN_ESPECES,
  TENIR_LA_CAISSE,
  TRIMESTRE_DE_LA_CAISSE,
  caisseDuJour,
  enCoupures,
} from "../../src/config/cours/chapitres/tenir-la-caisse";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { METIERS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  ERREUR_DU_SOIR,
  LA_CAISSE_DU_TRIMESTRE_DE_NOEL,
  TRIMESTRE_DU_CAS,
  caisseDeNoel,
} from "../../src/config/cours/situations/par-chapitre/la-caisse-du-trimestre-de-noel";
import { LA_PROMOTION_DE_NOEL, REMISE_DE_NOEL, TRIMESTRE_DE_NOEL, promotionDeNoel } from "../../src/config/cours/situations/par-chapitre/la-promotion-de-noel";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult } from "../../src/engine/types";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE PRIX AFFICHÉ ET LA CAISSE (CAP ÉQUIPIER POLYVALENT DU COMMERCE), ET LEURS CAS PRATIQUES.
 *
 * Ces gardes recomposent les chiffres avec le moteur : le prix hors taxes que l'arène pratique
 * pour chaque article, la TVA du métier, la promotion rejouée (seul le prix de l'article change,
 * au seul trimestre de la promotion), les ventes réglées en caisse d'un trimestre. Les hypothèses
 * du cours (le panier, le billet, le fond de caisse, la part en espèces, l'erreur du soir) se
 * retrouvent telles qu'elles sont nommées. Et elles vérifient que les textes se lisent.
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
    case "tri":
      return [e.titre, e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas)];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "demandé", "servi", "produit", "dernier", "perdu", "livré", "prévu"];

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
    expect(e.titre, e.id).not.toMatch(/v[ée]rifier|étape suivante|terminer|montrer la réponse|changer le signe/i);
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

const CODE = "boutique";
const cas = casDeLEntreprise(CODE);
const s = scenarioByCode(CODE).scenario;
const taux = METIERS[CODE]!.vente.tauxTva;
const { partie } = anneeJouee(CODE);
const joueur = (k: number) => partie.rounds[k - 1]!.results["joueur"]!;
const vendusDe = (r: CompanyRoundResult, a: string) => Math.round(r.products![a]!.sold);
const chiffreDe = (r: CompanyRoundResult, a: string) => Math.round(r.products![a]!.revenue);

/** Le trimestre rejoué par le test lui-même, avec le prix de l'article baissé : la recomposition. */
function rejoueParLeTest(article: string, trimestre: number, prixHt: number) {
  return rejouerAvec(CODE, `test-cap-prix:${article}:${trimestre}:${prixHt}`, (t, d) =>
    t === trimestre ? { ...d, products: { ...d.products!, [article]: { ...d.products![article]!, price: prixHt } } } : undefined,
  );
}

describe("les deux chapitres du CAP EPC et leurs cas", () => {
  it("portent les titres du programme, au palier 1, et des blocs du CAP EPC qui se résolvent", () => {
    const attendus: [Chapitre, string[]][] = [
      [LE_PRIX_AFFICHE, ["CAP EPC · Bloc 2 · Mettre en valeur et approvisionner"]],
      [TENIR_LA_CAISSE, ["CAP EPC · Bloc 3 · Conseiller et accompagner le client dans son parcours d'achat"]],
    ];
    for (const [ch, blocs] of attendus) {
      expect(PROGRAMME["cap-epc"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("cap-epc");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(blocs);
      for (const bloc of blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite?.code, bloc).toBe("cap-epc");
        expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace("CAP EPC · ", ""));
      }
    }
    expect(LE_PRIX_AFFICHE.code).toBe("le-prix-affiche");
    expect(TENIR_LA_CAISSE.code).toBe("tenir-la-caisse");
  });

  it("se jouent dans la boutique seule : la seule entreprise dont l'unité est un article en rayon", () => {
    expect([...ENTREPRISES_DU_MAGASIN]).toEqual(["boutique"]);
    expect(LE_PRIX_AFFICHE.entreprises?.codes).toBe(ENTREPRISES_DU_MAGASIN);
    expect(TENIR_LA_CAISSE.entreprises?.codes).toBe(ENTREPRISES_DU_MAGASIN);
    expect(s.products!.map((p) => p.code)).toContain(ARTICLE_EN_PROMOTION);
    expect(s.products!.map((p) => p.code)).toContain(ARTICLE_A_ETIQUETER);
    // Le commerce en ligne vend des commandes, le restaurant des couverts : pas d'étiquette d'article.
    expect(casDeLEntreprise("ecommerce").unite).toBe("commande");
    expect(casDeLEntreprise("bistrot").unite).toBe("couvert");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LA_PROMOTION_DE_NOEL, LE_PRIX_AFFICHE],
      [LA_CAISSE_DU_TRIMESTRE_DE_NOEL, TENIR_LA_CAISSE],
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

describe("le prix affiché, chez la boutique", () => {
  it("les prix hors taxes sont ceux que l'arène pratique, la TVA celle du métier, l'étiquette arrondie vers le bas", () => {
    expect(taux).toBe(0.2);
    expect(ARRONDI_DE_L_ETIQUETTE).toBe(0.1);
    const etiquettes = etiquettesDuRayon(cas);
    expect(etiquettes.map((e) => e.code)).toEqual(s.products!.map((p) => p.code));
    for (const e of etiquettes) {
      expect(e.ht).toBe(joueur(1).products![e.code]!.price);
      expect(e.tva).toBeCloseTo(e.ht * taux, 2);
      expect(e.ttc).toBeCloseTo(e.ht * (1 + taux), 2);
      expect(e.affiche).toBeLessThanOrEqual(e.ttc);
      expect(e.ttc - e.affiche).toBeLessThan(ARRONDI_DE_L_ETIQUETTE);
      expect(Math.round(e.affiche * 100) % 10).toBe(0);
    }
    expect(arrondiDeLEtiquette(71.04)).toBe(71);
    expect(arrondiDeLEtiquette(24.96)).toBe(24.9);
    expect(arrondiDeLEtiquette(52.8)).toBe(52.8);
    const col = etiquettes.find((e) => e.code === ARTICLE_EN_PROMOTION)!;
    const k = champs(LE_PRIX_AFFICHE, "prix-ttc", cas);
    expect(k[`TVA sur l'article « ${col.nom} »`]).toBe(auCentime(joueur(1).products![ARTICLE_EN_PROMOTION]!.price * taux));
    expect(k[`Prix TTC de l'article « ${col.nom} »`]).toBe(auCentime(joueur(1).products![ARTICLE_EN_PROMOTION]!.price * (1 + taux)));
    // Les chiffres de l'arène aujourd'hui : 55 € hors taxes, 66 € affichés.
    expect([col.ht, col.tva, col.ttc]).toEqual([55, 11, 66]);
    const echarpe = etiquettes.find((e) => e.code === ARTICLE_A_ETIQUETER)!;
    expect(justeDe(LE_PRIX_AFFICHE, "la-bonne-etiquette", cas)).toBe(`${echarpe.affiche.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`);
    expect(echarpe.affiche).toBe(43.2);
  });

  it("la remise et le nouveau prix se recomposent", () => {
    const p = promotionDuChapitre(cas);
    const k = champs(LE_PRIX_AFFICHE, "la-remise", cas);
    expect(REMISE_DE_LA_PROMOTION).toBe(0.2);
    expect(k["Montant de la remise"]).toBe(auCentime(66 * REMISE_DE_LA_PROMOTION));
    expect(k["Nouveau prix affiché"]).toBe(arrondiDeLEtiquette(66 - k["Montant de la remise"]!));
    expect(k["Nouveau prix affiché"]).toBe(52.8);
    expect(p.prixHtPromo).toBe(44);
  });

  it("la promotion rejouée : seul le prix de l'article change, au seul trimestre de la promotion", () => {
    const p = promotionDuChapitre(cas);
    const T = TRIMESTRE_DE_LA_PROMOTION;
    const reference = rejouerAvec(CODE, "reference", () => undefined);
    const avec = rejoueParLeTest(ARTICLE_EN_PROMOTION, T, p.nouveauPrix / (1 + taux));
    // La référence du rejeu est l'année du cours.
    expect(reference.map((r) => r.incomeStatement.revenue)).toEqual(partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.revenue));
    // Aucune défaillance jusqu'au trimestre comparé : rien à trancher.
    expect([...reference, ...avec].slice(0, T).some((r) => r.defaillant)).toBe(false);
    for (const r of avec.slice(0, T)) expect(r.defaillant).toBeFalsy();
    // Les trimestres d'avant ne bougent pas ; au trimestre de la promotion, l'article est au prix baissé.
    for (let k = 0; k < T - 1; k++) expect(avec[k]!.incomeStatement.revenue).toBe(reference[k]!.incomeStatement.revenue);
    expect(avec[T - 1]!.products![ARTICLE_EN_PROMOTION]!.price).toBeCloseTo(p.nouveauPrix / (1 + taux), 6);
    for (const autre of s.products!.map((x) => x.code).filter((x) => x !== ARTICLE_EN_PROMOTION)) {
      expect(avec[T - 1]!.products![autre]!.price, autre).toBe(reference[T - 1]!.products![autre]!.price);
    }
    expect(p.sans.vendus).toBe(vendusDe(reference[T - 1]!, ARTICLE_EN_PROMOTION));
    expect(p.avec.vendus).toBe(vendusDe(avec[T - 1]!, ARTICLE_EN_PROMOTION));
    expect(p.sans.chiffreDAffaires).toBe(chiffreDe(reference[T - 1]!, ARTICLE_EN_PROMOTION));
    expect(p.avec.chiffreDAffaires).toBe(chiffreDe(avec[T - 1]!, ARTICLE_EN_PROMOTION));
    const k = champs(LE_PRIX_AFFICHE, "ce-que-la-promotion-vend", cas);
    expect(k["Articles vendus en plus"]).toBe(vendusDe(avec[T - 1]!, ARTICLE_EN_PROMOTION) - vendusDe(reference[T - 1]!, ARTICLE_EN_PROMOTION));
    expect(k["Chiffre d'affaires en plus"]).toBe(chiffreDe(avec[T - 1]!, ARTICLE_EN_PROMOTION) - chiffreDe(reference[T - 1]!, ARTICLE_EN_PROMOTION));
    // Les chiffres de l'arène aujourd'hui, et le verdict qui en suit.
    expect(T).toBe(1);
    expect([p.sans.vendus, p.avec.vendus, p.sans.chiffreDAffaires, p.avec.chiffreDAffaires]).toEqual([1726, 1945, 94947, 85580]);
    expect([p.sans.manques, p.avec.manques]).toEqual([0, 938]);
    expect(p.bilan).toBe("plus-mais-moins");
    expect(justeDe(LE_PRIX_AFFICHE, "bilan", cas)).toBe("Elle fait vendre plus, mais le chiffre d'affaires baisse");
  });

  it("une défaillance avant le trimestre compté vaut zéro vente", () => {
    const r = joueur(1);
    const defaillante = [{ ...r, defaillant: true }, joueur(2)];
    expect(ventesDeLArticle(defaillante, 2, ARTICLE_EN_PROMOTION)).toEqual({ vendus: 0, chiffreDAffaires: 0, manques: 0 });
    expect(ventesDeLArticle([r, joueur(2)], 2, ARTICLE_EN_PROMOTION).vendus).toBe(vendusDe(joueur(2), ARTICLE_EN_PROMOTION));
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_PRIX_AFFICHE, CODE));
});

describe("la promotion de Noël, chez la boutique", () => {
  it("la remise de Noël rejouée au trimestre 4 ne fait rien vendre de plus : le rayon est déjà vide", () => {
    const p = promotionDeNoel(cas);
    expect([REMISE_DE_NOEL, TRIMESTRE_DE_NOEL]).toEqual([0.3, 4]);
    const k1 = champs(LA_PROMOTION_DE_NOEL, "l-etiquette", cas);
    expect(k1["Montant de la remise"]).toBe(auCentime(66 * REMISE_DE_NOEL));
    expect(k1["Nouveau prix affiché"]).toBe(arrondiDeLEtiquette(66 - k1["Montant de la remise"]!));
    const reference = rejouerAvec(CODE, "reference", () => undefined);
    const avec = rejoueParLeTest(ARTICLE_EN_PROMOTION, TRIMESTRE_DE_NOEL, p.nouveauPrix / (1 + taux));
    for (const r of [...reference, ...avec].filter((_, i) => i % 4 < TRIMESTRE_DE_NOEL)) expect(r.defaillant).toBeFalsy();
    const T = TRIMESTRE_DE_NOEL - 1;
    const k2 = champs(LA_PROMOTION_DE_NOEL, "le-trimestre-rejoue", cas);
    expect(k2["Articles vendus en plus"]).toBe(vendusDe(avec[T]!, ARTICLE_EN_PROMOTION) - vendusDe(reference[T]!, ARTICLE_EN_PROMOTION));
    expect(k2["Chiffre d'affaires en plus"]).toBe(chiffreDe(avec[T]!, ARTICLE_EN_PROMOTION) - chiffreDe(reference[T]!, ARTICLE_EN_PROMOTION));
    expect(reference[T]!.products![ARTICLE_EN_PROMOTION]!.lost).toBeGreaterThan(0);
    expect(p.ventesEnPlus).toBe(0);
    expect(p.chiffreEnPlus).toBe(-41415);
    expect(p.bilan).toBe("rien-de-plus");
    expect(justeDe(LA_PROMOTION_DE_NOEL, "reponse", cas)).toBe("Ne pas la faire : le rayon ne suit pas");
  });

  it("les soldes d'hiver et Noël ne donnent pas le même verdict", () => {
    expect(promotionDuChapitre(cas).bilan).not.toBe(promotionDeNoel(cas).bilan);
    // Le cas le dit à la responsable : la promotion des soldes d'hiver a fait vendre plus.
    expect(promotionDuChapitre(cas).ventesEnPlus).toBeGreaterThan(0);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_PROMOTION_DE_NOEL, CODE);
    reponseSansIndice(LA_PROMOTION_DE_NOEL, CODE);
  });
});

/** Les ventes réglées en caisse d'un trimestre, recomposées : les segments sans délai de paiement. */
function enCaisse(trimestre: number) {
  const segments = [...s.market.segments, ...(s.products ?? []).flatMap((p) => p.market?.segments ?? [])];
  const comptant = new Set(segments.filter((g) => (g.paymentDelayDays ?? 0) === 0).map((g) => g.code));
  const r = joueur(trimestre);
  const lignes = Object.entries(r.market.bySegment).filter(([g]) => comptant.has(g));
  return {
    ventes: Math.round(lignes.reduce((t, [, v]) => t + v.sold, 0)),
    chiffre: Math.round(lignes.reduce((t, [, v]) => t + v.revenue, 0)),
    total: Math.round(r.incomeStatement.revenue),
    factures: segments.some((g) => (g.paymentDelayDays ?? 0) > 0),
  };
}

const somme = (cs: readonly { valeur: number; nombre: number }[]) => auCentime(cs.reduce((t, x) => t + x.valeur * x.nombre, 0));

describe("tenir la caisse, chez la boutique", () => {
  it("le ticket au prix affiché, la monnaie sur le billet du client", () => {
    const k = caisseDuJour(cas);
    const etiquettes = etiquettesDuRayon(cas, TRIMESTRE_DE_LA_CAISSE);
    const total = auCentime(PANIER_DU_CLIENT.reduce((t, l) => t + l.quantite * auCentime(etiquettes.find((e) => e.code === l.article)!.ht * (1 + taux)), 0));
    const t = champs(TENIR_LA_CAISSE, "le-ticket", cas);
    expect(t["Total du ticket"]).toBe(total);
    expect(total).toBe(74.4);
    expect(total).toBeLessThan(BILLET_DU_CLIENT);
    const m = champs(TENIR_LA_CAISSE, "la-monnaie", cas);
    expect(m["Monnaie à rendre"]).toBe(auCentime(BILLET_DU_CLIENT - total));
    expect(somme(k.monnaie)).toBe(m["Monnaie à rendre"]);
    expect(somme(k.plus.coupures)).toBe(auCentime(m["Monnaie à rendre"]! + 10));
    expect(somme(k.moins.coupures)).toBeLessThan(m["Monnaie à rendre"]!);
    expect(justeDe(TENIR_LA_CAISSE, "rendre-juste", cas)).toBe("1 billet de 20 €, 1 billet de 5 €, 1 pièce de 50 centimes et 1 pièce de 10 centimes");
    // La décomposition prend toujours la plus grande coupure : rien ne se rend en deux pièces quand une suffit.
    expect(enCoupures(3.8)).toEqual([{ valeur: 2, nombre: 1 }, { valeur: 1, nombre: 1 }, { valeur: 0.5, nombre: 1 }, { valeur: 0.2, nombre: 1 }, { valeur: 0.1, nombre: 1 }]);
  });

  it("la journée moyenne vient des ventes réglées en caisse du trimestre, ÷ les jours du trimestre", () => {
    const e = enCaisse(TRIMESTRE_DE_LA_CAISSE);
    expect(e.factures).toBe(true);
    expect(e.chiffre).toBeLessThan(e.total);
    const j = champs(TENIR_LA_CAISSE, "la-journee", cas);
    expect(j["Articles vendus en un jour"]).toBe(Math.round(e.ventes / s.roundDays));
    expect(j["Chiffre d'affaires hors taxes d'un jour"]).toBe(auCentime(e.chiffre / s.roundDays));
    const ht = auCentime(e.chiffre / s.roundDays);
    const ttc = auCentime(ht + auCentime(ht * taux));
    const es = champs(TENIR_LA_CAISSE, "les-especes", cas);
    expect(es["Chiffre d'affaires TTC du jour"]).toBe(ttc);
    expect(es["Espèces encaissées dans la journée"]).toBe(auCentime(ttc * PART_EN_ESPECES));
    expect(champs(TENIR_LA_CAISSE, "le-fond-de-caisse", cas)["Espèces attendues le soir"]).toBe(auCentime(FOND_DE_CAISSE + auCentime(ttc * PART_EN_ESPECES)));
    // Les chiffres de l'arène aujourd'hui.
    expect([e.ventes, e.chiffre, s.roundDays]).toEqual([3949, 218777, 90]);
    expect(ttc).toBe(2917.03);
  });

  it("le tiroir compté fait l'erreur de la journée, et l'écart la retrouve", () => {
    const k = caisseDuJour(cas);
    const c = champs(TENIR_LA_CAISSE, "le-comptage", cas);
    expect(c["Total compté dans le tiroir"]).toBe(somme(k.jour.tiroir));
    expect(c["Écart de caisse"]).toBe(ERREUR_DE_LA_JOURNEE);
    expect(c["Écart de caisse"]).toBe(auCentime(c["Total compté dans le tiroir"]! - champs(TENIR_LA_CAISSE, "le-fond-de-caisse", cas)["Espèces attendues le soir"]!));
    expect(k.jour.auCoffre).toBe(auCentime(c["Total compté dans le tiroir"]! - FOND_DE_CAISSE));
    expect(justeDe(TENIR_LA_CAISSE, "que-faire-de-l-ecart", cas)).toBe("Noter l'écart et prévenir le responsable");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(TENIR_LA_CAISSE, CODE));
});

describe("la caisse du trimestre de Noël, chez la boutique", () => {
  it("les espèces attendues, le tiroir et l'écart se recomposent sur le trimestre 4", () => {
    const e = enCaisse(TRIMESTRE_DU_CAS);
    const j = caisseDeNoel(cas);
    const ht = auCentime(e.chiffre / s.roundDays);
    const ttc = auCentime(ht + auCentime(ht * taux));
    const k1 = champs(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, "les-especes", cas);
    expect(k1["Chiffre d'affaires hors taxes d'un jour"]).toBe(ht);
    expect(k1["Chiffre d'affaires TTC du jour"]).toBe(ttc);
    expect(k1["Espèces encaissées dans la journée"]).toBe(auCentime(ttc * PART_EN_ESPECES));
    const k2 = champs(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, "le-tiroir", cas);
    expect(k2["Total compté dans le tiroir"]).toBe(somme(j.tiroir));
    expect(k2["Écart de caisse"]).toBe(ERREUR_DU_SOIR);
    expect(k2["Écart de caisse"]).toBe(auCentime(k2["Total compté dans le tiroir"]! - auCentime(FOND_DE_CAISSE + k1["Espèces encaissées dans la journée"]!)));
    expect(k2["Espèces à remettre au coffre"]).toBe(auCentime(k2["Total compté dans le tiroir"]! - FOND_DE_CAISSE));
    expect([e.chiffre, ttc]).toEqual([274274, 3656.99]);
    // L'écart du cas n'est pas celui du chapitre : un excédent, pas un manquant.
    expect(Math.sign(ERREUR_DU_SOIR)).not.toBe(Math.sign(ERREUR_DE_LA_JOURNEE));
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, CODE);
    reponseSansIndice(LA_CAISSE_DU_TRIMESTRE_DE_NOEL, CODE);
  });
});
