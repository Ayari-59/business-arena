import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES, UNITES_MASCULINES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ARTICLES_DE_LA_BOUTIQUE,
  ARTICLES_PAR_CARTON,
  CARTONS_MANQUANTS,
  MAGASINS,
  RECEVOIR_UNE_LIVRAISON,
  TRIMESTRE_DE_LA_LIVRAISON,
  livraison,
} from "../../src/config/cours/chapitres/recevoir-une-livraison";
import { DELAI_DE_REASSORT, REMPLIR_LE_RAYON, articleEnRupture, rayon } from "../../src/config/cours/chapitres/remplir-le-rayon";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CARTONS_DE_CHAQUE_ECART, LES_DEUX_ECARTS, TRIMESTRE_DU_CAS, deuxEcarts } from "../../src/config/cours/situations/par-chapitre/les-deux-ecarts";
import { TENIR_JUSQU_AU_REASSORT, reassortAttendu } from "../../src/config/cours/situations/par-chapitre/tenir-jusqu-au-reassort";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX PREMIERS CHAPITRES DU PARCOURS « CAP ÉQUIPIER POLYVALENT DU COMMERCE », ET LEURS CAS
 * PRATIQUES.
 *
 * Recevoir une livraison : la commande de l'arène au premier trimestre, référence par référence,
 * le bon de livraison, le carton manquant (hypothèse du cours), la réserve, le stock après la
 * réception. Remplir le rayon : l'article qui part en rupture sans commande, ses ventes par jour,
 * les jours avant la rupture, le délai du réassort (hypothèse prise dans la fiche du fournisseur),
 * les ventes perdues comptées par le moteur. Ces gardes recomposent les chiffres avec le moteur,
 * vérifient que les champs les attendent et que les verdicts se calculent, et que les textes se
 * lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, des élisions faites, une seule
 * bonne réponse, des libellés uniques, des notions qui existent, des accords justes.
 */

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(cas);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
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
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier"];
/** Les participes que ces chapitres accordent avec un article au féminin (« écharpes vendues »). */
const ACCORDS_DES_ARTICLES = ["vendu", "demandé", "commandé", "manquant", "trouvé", "livré", "arrivé", "payé"];
/** Les boutons de la page : un titre d'étape qui en contient un gênerait le test de bout en bout. */
const BOUTONS = ["vérifier", "étape suivante", "terminer", "valider", "montrer", "changer le signe"];
const AFFICHENT_LEUR_TABLEAU: readonly Etape["type"][] = ["lecture", "choix", "montants", "tri"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  const feminins = Object.values(ARTICLES_DE_LA_BOUTIQUE).filter((a) => a.feminin).map((a) => a.pluriel);
  const articleFautif = new RegExp(`\\b(${feminins.join("|")}) (non )?(${ACCORDS_DES_ARTICLES.join("|")})s\\b`, "i");
  expect(chapitre.etapes.length).toBe(ch.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const b of BOUTONS) expect(e.titre.toLowerCase(), `${e.id} : titre`).not.toContain(b);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (articles?|cartons?|jours|trimestres?|pulls?|écharpes?|bonnets?|cardigans?)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
      expect(x, `${e.id} : ${x}`).not.toMatch(articleFautif);
    }
    if (e.tableau) {
      expect(AFFICHENT_LEUR_TABLEAU, `${e.id} (${e.type})`).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
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

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

const etapeDe = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === etape);
  if (!e) throw new Error(`pas d'étape ${etape}`);
  return e;
};

const champs = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = etapeDe(ch, etape, cas);
  if (e.type !== "montants") throw new Error(`${etape} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
};

const optionJuste = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = etapeDe(ch, etape, cas);
  if (e.type !== "choix") throw new Error(`${etape} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const CHAPITRES_CAP = [RECEVOIR_UNE_LIVRAISON, REMPLIR_LE_RAYON];
const PAIRES: [Situation, Chapitre][] = [
  [LES_DEUX_ECARTS, RECEVOIR_UNE_LIVRAISON],
  [TENIR_JUSQU_AU_REASSORT, REMPLIR_LE_RAYON],
];
const tours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
const gamme = (code: string) => scenarioByCode(code).scenario.products ?? [];

describe("les deux chapitres et leurs cas, dans le parcours CAP EPC", () => {
  it("portent les titres du programme, au palier 1, et des blocs qui se résolvent dans le référentiel du CAP", () => {
    const blocs = { "recevoir-une-livraison": "Bloc 1 · Recevoir et suivre les commandes", "remplir-le-rayon": "Bloc 2 · Mettre en valeur et approvisionner" };
    for (const ch of CHAPITRES_CAP) {
      expect(PROGRAMME["cap-epc"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("cap-epc");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual([`CAP EPC ${blocs[ch.code as keyof typeof blocs]}`]);
      for (const b of ch.blocs) {
        const cite = referentielDeCitation(b);
        expect(cite, b).not.toBeNull();
        expect(cite!.code, b).toBe("cap-epc");
        expect(cite!.referentiel.entrees, b).toContain(b.replace("CAP EPC ", ""));
        expect(blocOfficiel(b, cite!.code), b).toBe(b.replace("CAP EPC ", ""));
      }
    }
  });

  it("ne doublent aucun chapitre du registre : ni leur code, ni leur titre", () => {
    for (const ch of [...CHAPITRES_CAP, ...PAIRES.map(([s]) => s)]) {
      expect(CHAPITRES.filter((x) => x !== ch && x.code === ch.code), ch.code).toEqual([]);
      expect(CHAPITRES.filter((x) => x !== ch && x.titre === ch.titre), ch.code).toEqual([]);
    }
  });

  it("se jouent au seul magasin du cours, une boutique à plusieurs articles, qui ont chacun leur nom de phrase", () => {
    expect(MAGASINS).toEqual(["boutique"]);
    for (const ch of CHAPITRES_CAP) expect(ch.entreprises?.codes, ch.code).toEqual(MAGASINS);
    expect(UNITES_MASCULINES.has(casDeLEntreprise("boutique").unite)).toBe(true);
    expect(gamme("boutique").length).toBeGreaterThan(1);
    expect(Object.keys(ARTICLES_DE_LA_BOUTIQUE).sort()).toEqual(gamme("boutique").map((p) => p.code).sort());
    // Chez PIXEL & CO, l'unité est la commande du client : le mot y heurterait la commande au fournisseur.
    expect(casDeLEntreprise("ecommerce").unite).toBe("commande");
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
      expect(CHAPITRES.some((x) => x.code === s.code), s.code).toBe(false);
    }
  });

  it("l'arène ne simule aucun écart de livraison : tout ce qui est commandé entre en stock, sans rupture du fournisseur", () => {
    for (const r of tours("boutique")) {
      for (const p of Object.values(r.products!)) {
        expect(p.produced).toBeCloseTo(p.planned, 6);
        expect(p.supplier?.supplyDisruption).toBe(false);
      }
    }
    // Les hypothèses du cours : des cartons de dix, un carton qui manque.
    expect(ARTICLES_PAR_CARTON).toBe(10);
    expect(CARTONS_MANQUANTS).toBe(1);
    expect(CARTONS_DE_CHAQUE_ECART).toBe(1);
  });

  it("le délai de réassort est celui que la fiche du fournisseur annonce, en jours", () => {
    const x = articleEnRupture("boutique");
    const fiche = gamme("boutique").find((p) => p.code === x.code)!.suppliers!.find((s) => s.code === x.fournisseur)!;
    expect(fiche.narrative).toContain(DELAI_DE_REASSORT.annonce);
    expect(DELAI_DE_REASSORT.annonce).toContain("six semaines");
    expect(DELAI_DE_REASSORT.jours).toBe(6 * 7);
  });
});

describe.each(MAGASINS)("recevoir une livraison chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("la commande, le stock d'avant et le fournisseur sont ceux du moteur, article par article", () => {
    const l = livraison(cas);
    const r = tours(code)[TRIMESTRE_DE_LA_LIVRAISON - 1]!;
    const ouverture = anneeJouee(code).depart.finishedGoodsByProduct!;
    expect(l.lignes.map((x) => x.code)).toEqual(gamme(code).map((p) => p.code));
    for (const x of l.lignes) {
      expect(x.commandee, x.code).toBe(Math.round(r.products![x.code]!.planned));
      expect(x.commandee, x.code).toBeGreaterThan(ARTICLES_PAR_CARTON);
      expect(x.avant, x.code).toBe(Math.round(ouverture[x.code]!.quantity));
      expect(x.nom, x.code).toBe(gamme(code).find((p) => p.code === x.code)!.name);
    }
    expect(new Set(Object.values(r.products!).map((p) => p.supplier!.name))).toEqual(new Set([l.fournisseur]));
    expect(l.totalCommande).toBe(l.lignes.reduce((t, x) => t + x.commandee, 0));
    expect(l.totalAvant).toBe(l.lignes.reduce((t, x) => t + x.avant, 0));
    // Une seule ligne la plus grosse : celle qui perd son carton.
    const max = Math.max(...l.lignes.map((x) => x.commandee));
    expect(l.lignes.filter((x) => x.commandee === max)).toHaveLength(1);
    expect(l.ecart.commandee).toBe(max);
  });

  it("le contrôle, l'écart et le stock après se recomposent, et les champs les attendent", () => {
    const l = livraison(cas);
    expect(l.manquants).toBe(CARTONS_MANQUANTS * ARTICLES_PAR_CARTON);
    for (const x of l.comptes) {
      expect(x.surLeBon, x.code).toBe(x.commandee);
      expect(x.comptee, x.code).toBe(x.code === l.ecart.code ? x.commandee - l.manquants : x.commandee);
    }
    expect(l.totalRecu).toBe(l.totalCommande - l.manquants);
    expect(l.apresDeLEcart).toBe(l.ecart.avant + l.ecart.commandee - l.manquants);
    expect(l.totalApres).toBe(l.totalAvant + l.totalRecu);
    expect(l.entreDansLArene).toBe(l.ecart.commandee);
    expect(champs(RECEVOIR_UNE_LIVRAISON, "total-commande", cas)).toEqual([l.totalCommande]);
    expect(champs(RECEVOIR_UNE_LIVRAISON, "l-ecart", cas)).toEqual([l.manquants, l.totalRecu]);
    expect(champs(RECEVOIR_UNE_LIVRAISON, "stock-apres", cas)).toEqual([l.apresDeLEcart, l.totalApres]);
    expect(optionJuste(RECEVOIR_UNE_LIVRAISON, "la-ligne", cas)).toBe(`Les ${l.ecart.pluriel}`);
    expect(optionJuste(RECEVOIR_UNE_LIVRAISON, "signer", cas)).toContain(`${l.manquants} ${l.ecart.pluriel}`);
    expect(optionJuste(RECEVOIR_UNE_LIVRAISON, "le-document", cas)).toBe("Le bon de livraison");
  });

  it("chez MAILLE & CO, les chiffres de l'année du cours", () => {
    const l = livraison(cas);
    expect(l.lignes.map((x) => x.commandee)).toEqual([1022, 553, 234, 457, 399]);
    expect(l.totalCommande).toBe(2665);
    expect(l.ecart.code).toBe("pull-col-rond");
    expect(l.totalRecu).toBe(2655);
    expect(l.apresDeLEcart).toBe(1412);
    expect(l.totalApres).toBe(3765);
    expect(l.fournisseur).toBe("Façonnier de référence");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(RECEVOIR_UNE_LIVRAISON, code));
});

describe.each(MAGASINS)("remplir le rayon chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("l'article est, dans l'année du cours, la rupture sans commande qui a coûté le plus", () => {
    const { x } = rayon(cas);
    const rs = tours(code);
    const ouverture = anneeJouee(code).depart.finishedGoodsByProduct!;
    const candidats = rs.flatMap((r, k) =>
      Object.entries(r.products!).map(([article, p]) => ({
        trimestre: k + 1,
        article,
        stock: Math.round(k === 0 ? ouverture[article]!.quantity : rs[k - 1]!.products![article]!.stock.quantity),
        commandee: Math.round(p.planned),
        perdues: Math.round(p.lost),
        perte: Math.round(p.lost) * p.price,
      })),
    );
    const retenus = candidats.filter((y) => y.commandee === 0 && y.stock > 0 && y.perdues > 0).sort((a, b) => b.perte - a.perte);
    expect(retenus.length).toBeGreaterThan(0);
    // Pas d'égalité en tête : le choix ne dépend pas de l'ordre.
    if (retenus.length > 1) expect(retenus[0]!.perte).toBeGreaterThan(retenus[1]!.perte);
    expect([x.trimestre, x.code]).toEqual([retenus[0]!.trimestre, retenus[0]!.article]);
    const p = rs[x.trimestre - 1]!.products![x.code]!;
    expect(x.stock).toBe(retenus[0]!.stock);
    expect(x.vendues).toBe(Math.round(p.sold));
    expect(x.perdues).toBe(Math.round(p.lost));
    expect(Math.abs(x.demande - Math.round(p.sold + p.lost))).toBeLessThanOrEqual(1);
    expect(x.prix).toBe(auCentime(p.price));
    expect(x.jours).toBe(scenarioByCode(code).scenario.roundDays);
    // Sans commande, la boutique vend ce qu'elle a : tout son stock part.
    expect(Math.abs(x.vendues - x.stock)).toBeLessThanOrEqual(1);
  });

  it("le rythme, les jours avant la rupture, le réassort et la perte se recomposent, et les champs les attendent", () => {
    const r = rayon(cas);
    const parJour = Math.round(r.x.demande / r.x.jours);
    const joursAvant = Math.floor(r.x.stock / parJour);
    expect(r.parJour).toBe(parJour);
    expect(r.joursAvant).toBe(joursAvant);
    expect(r.aTemps).toBe(joursAvant >= DELAI_DE_REASSORT.jours);
    expect(r.joursSans).toBe(Math.max(0, DELAI_DE_REASSORT.jours - joursAvant));
    expect(r.ventesPerdues).toBe(auCentime(r.x.perdues * r.x.prix));
    expect(champs(REMPLIR_LE_RAYON, "par-jour", cas)).toEqual([parJour]);
    expect(champs(REMPLIR_LE_RAYON, "jours-avant", cas)).toEqual([joursAvant]);
    expect(champs(REMPLIR_LE_RAYON, "reassort", cas)).toEqual([r.joursSans]);
    expect(champs(REMPLIR_LE_RAYON, "ce-que-coute", cas)).toEqual([r.x.demande - r.x.vendues, r.ventesPerdues]);
    expect(optionJuste(REMPLIR_LE_RAYON, "le-geste", cas)).toBe("Prévenir votre responsable aujourd'hui, avec vos chiffres");
    expect(optionJuste(REMPLIR_LE_RAYON, "lire-la-rupture", cas)).toBe(
      r.x.perdues > r.x.vendues ? "Plus d'articles ont manqué que d'articles vendus" : "La plupart des articles demandés ont été vendus",
    );
  });

  it("chez MAILLE & CO, les chiffres de l'année du cours", () => {
    const r = rayon(cas);
    expect([r.x.trimestre, r.x.code]).toEqual([4, "echarpe"]);
    expect(r.x.stock).toBe(1745);
    expect(r.x.demande).toBe(4225);
    expect(r.parJour).toBe(47);
    expect(r.joursAvant).toBe(37);
    expect(r.joursSans).toBe(5);
    expect(r.x.perdues).toBe(2480);
    expect(r.ventesPerdues).toBe(89280);
    expect(r.x.demandeAvant).toBe(1370);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(REMPLIR_LE_RAYON, code));
});

describe.each(MAGASINS)("les deux écarts chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("la commande est celle du moteur, les deux écarts s'annulent, le prix d'achat est celui du fournisseur", () => {
    const s = deuxEcarts(cas);
    const r = tours(code)[TRIMESTRE_DU_CAS - 1]!;
    for (const x of s.comptes) expect(x.surLeBon, x.code).toBe(Math.round(r.products![x.code]!.planned));
    expect(s.manque.code).not.toBe(s.enTrop.code);
    expect(s.totalSurLeBon).toBe(s.comptes.reduce((t, x) => t + x.surLeBon, 0));
    expect(s.totalCompte).toBe(s.totalSurLeBon);
    expect(s.manque.surLeBon - s.manque.comptee).toBe(s.ecart);
    expect(s.enTrop.comptee - s.enTrop.surLeBon).toBe(s.ecart);
    const p = gamme(code).find((y) => y.code === s.manque.code)!;
    expect(s.prixDAchat).toBe(auCentime(p.materialCostPerUnit * r.products![s.manque.code]!.supplier!.costMultiplier));
    expect(s.payesSansEtreRecus).toBe(auCentime(s.ecart * s.prixDAchat));
    expect(champs(LES_DEUX_ECARTS, "totaux", cas)).toEqual([s.totalSurLeBon, s.totalCompte]);
    expect(champs(LES_DEUX_ECARTS, "lignes", cas)).toEqual([s.ecart, s.ecart]);
    expect(champs(LES_DEUX_ECARTS, "sans-reserve", cas)).toEqual([s.payesSansEtreRecus]);
    expect(optionJuste(LES_DEUX_ECARTS, "reponse", cas)).toBe("Écrire les deux écarts sur le bon, puis signer");
  });

  it("chez MAILLE & CO, les chiffres de l'année du cours", () => {
    const s = deuxEcarts(cas);
    expect(s.totalSurLeBon).toBe(7500);
    expect([s.manque.code, s.enTrop.code]).toEqual(["pull-col-rond", "pull-merinos"]);
    expect(s.prixDAchat).toBe(25);
    expect(s.payesSansEtreRecus).toBe(250);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LES_DEUX_ECARTS, code);
    reponseSansIndice(LES_DEUX_ECARTS, code);
  });
});

describe.each(MAGASINS)("tenir jusqu'au réassort chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("l'article livré et pourtant en rupture se retrouve dans le moteur, et le verdict se calcule", () => {
    const s = reassortAttendu(cas);
    const trimestre = articleEnRupture(code).trimestre;
    expect(s.x.trimestre).toBe(trimestre);
    const r = tours(code)[trimestre - 1]!;
    const retenus = Object.entries(r.products!)
      .filter(([, p]) => Math.round(p.planned) > 0 && Math.round(p.lost) > 0)
      .sort((a, b) => Math.round(b[1].lost) * b[1].price - Math.round(a[1].lost) * a[1].price);
    expect(s.x.code).toBe(retenus[0]![0]);
    const p = r.products![s.x.code]!;
    expect(s.x.commandee).toBe(Math.round(p.planned));
    expect(s.stockApres).toBe(s.x.stock + s.x.commandee);
    const parJour = Math.round(s.x.demande / s.x.jours);
    const joursAvant = Math.floor(s.stockApres / parJour);
    expect(s.parJour).toBe(parJour);
    expect(s.joursAvant).toBe(joursAvant);
    expect(s.aTemps).toBe(joursAvant >= DELAI_DE_REASSORT.jours);
    expect(s.joursSans).toBe(Math.max(0, DELAI_DE_REASSORT.jours - joursAvant));
    expect(s.ventesPerdues).toBe(auCentime(Math.round(p.lost) * p.price));
    expect(champs(TENIR_JUSQU_AU_REASSORT, "stock-et-rythme", cas)).toEqual([s.stockApres, parJour]);
    expect(champs(TENIR_JUSQU_AU_REASSORT, "jours", cas)).toEqual([joursAvant, s.joursSans]);
    expect(champs(TENIR_JUSQU_AU_REASSORT, "arene", cas)).toEqual([s.x.demande - s.x.vendues, s.ventesPerdues]);
    expect(optionJuste(TENIR_JUSQU_AU_REASSORT, "reponse", cas)).toBe(
      s.aTemps ? "Oui, la livraison suffit jusqu'au réassort" : "Non, ça ne tient pas : commander aujourd'hui",
    );
  });

  it("chez MAILLE & CO, les chiffres de l'année du cours", () => {
    const s = reassortAttendu(cas);
    expect(s.x.code).toBe("pull-col-rond");
    expect(s.stockApres).toBe(1487);
    expect(s.parJour).toBe(50);
    expect(s.joursAvant).toBe(29);
    expect(s.joursSans).toBe(13);
    expect(s.x.perdues).toBe(2991);
    expect(s.ventesPerdues).toBe(164505);
    expect(s.aTemps).toBe(false);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(TENIR_JUSQU_AU_REASSORT, code);
    reponseSansIndice(TENIR_JUSQU_AU_REASSORT, code);
  });
});
