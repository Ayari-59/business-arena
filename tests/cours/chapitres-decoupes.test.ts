import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { PREMIERE_PARTIE_DE_LA_SUITE } from "../../src/config/cours/jouez";
import { CHAPITRES } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE, casDuChapitre } from "../../src/config/cours/situations";
import { LA_BAISSE_DE_PRIX_PROMISE, baisseDePrixPromise } from "../../src/config/cours/situations/par-chapitre/la-baisse-de-prix-promise";
import { LA_PRIME_DU_CHEF_D_ATELIER, primeDuChefDAtelier } from "../../src/config/cours/situations/par-chapitre/la-prime-du-chef-d-atelier";
import { LE_CENTRE_TOURNE_PLUS, leCentreTournePlus } from "../../src/config/cours/situations/par-chapitre/le-centre-tourne-plus";
import { LE_COMPTE_A_TERME_MIEUX_REMUNERE, compteATermeMieuxRemunere } from "../../src/config/cours/situations/par-chapitre/le-compte-a-terme-mieux-remunere";
import { LE_CONCURRENT_SOLDE, concurrentSolde } from "../../src/config/cours/situations/par-chapitre/le-concurrent-solde";
import { LE_LIQUIDATEUR_VERSE_DAVANTAGE, liquidateurPlusGenereux } from "../../src/config/cours/situations/par-chapitre/le-liquidateur-verse-davantage";
import { LES_ENTREPRISES_PAIENT_PLUS_VITE, entreprisesPaientPlusVite } from "../../src/config/cours/situations/par-chapitre/les-entreprises-paient-plus-vite";
import { UN_ENGAGEMENT_PLUS_MODESTE, engagementPlusModeste } from "../../src/config/cours/situations/par-chapitre/un-engagement-plus-modeste";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, EtatDuCours } from "../../src/config/cours/types";
import { servirLeChapitre } from "../../src/pedagogy/cours/chapitre-servi";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";

/**
 * LES CHAPITRES DÉCOUPÉS (audit pédagogique : aucun chapitre de plus de 20 étapes).
 *
 * Huit chapitres dépassaient 20 étapes ; chacun est coupé en deux, sur le modèle de « De la création
 * au premier bilan » suivi de « Du résultat à la trésorerie » : la suite est un chapitre à part,
 * avec ses objectifs, ses blocs, son prérequis vers la première partie, sa mission dans l'arène et
 * son cas dédié. Cette garde vérifie la règle, la forme des suites, et refait à la main le calcul de
 * chacun des huit cas.
 */

const ETAPES_AU_PLUS = 20;
const VIDE: EtatDuCours = { soldes: {} };
const c = (x: number) => Math.round(x * 100) / 100;
const SUITES = Object.entries(PREMIERE_PARTIE_DE_LA_SUITE);
const chapitre = (code: string) => CHAPITRES.find((x) => x.code === code)!;
const casDe = (ch: Chapitre) => casDeLEntreprise(ch.entreprises!.codes[0]!);

/** Les fautes que la composition des textes produit (celles de gardes-de-nova.ts). */
const FAUTES: [string, RegExp][] = [
  ["valeur absente", /undefined|NaN|Infinity|\[object|\bnull\b/],
  ["tiret au milieu d'une phrase", / [-–—] /],
  ["signe moins de traits d'union", /(^|[\s(])-\d/],
  ["nombre en lettres", /\b(vingt|trente|quarante|cinquante|soixante|quatre-vingts?)\b/i],
  ["quantité en lettres", /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze) (enceintes?|clients|jours|mois|trimestres?|ventes?|salariés|euros?|heures?)\b/i],
  ["espaces doublés ou signes accolés", /− −|\s{2,}|\+−|\+-/],
];

/** Tout ce qu'un cas affiche, servi comme le serveur le sert. */
const textes = (s: Chapitre) => JSON.stringify(servirLeChapitre(s, casDe(s)));

/** Les gardes d'un cas dédié : sa forme, ses textes, une seule bonne réponse, jamais la plus longue. */
function gardeDuCas(s: Situation, suite: Chapitre) {
  expect(s.reprend, s.code).toEqual([suite.code]);
  expect(casDuChapitre(suite.code), s.code).toBe(s);
  expect([s.parcours, s.palier, s.libre, s.blocs]).toEqual([suite.parcours, suite.palier, false, []]);
  expect(s.entreprises?.codes, s.code).toEqual(suite.entreprises?.codes);
  expect(s.etapes[0]!.type, s.code).toBe("lecture");
  expect(s.etapes.at(-1)!.type, s.code).toBe("choix");
  const t = textes(s);
  for (const [nom, re] of FAUTES) expect(t, `${s.code} · ${nom}`).not.toMatch(re);
  expect(t, `${s.code} : l'arène`).not.toMatch(/\barène\b/i);
  const cas = casDe(s);
  for (const e of chapitreDuCas(s, cas).etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, VIDE);
    const justes = options.filter((o) => o.juste);
    expect(justes, `${s.code} · ${e.id}`).toHaveLength(1);
    const plusLongue = Math.max(...options.map((o) => o.texte.length));
    expect(justes[0]!.texte.length, `${s.code} · ${e.id} : la bonne réponse est la plus longue`).toBeLessThan(plusLongue);
  }
}

const attendus = (s: Chapitre, id: string) => {
  const e = s.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(id);
  return Object.fromEntries(e.champs(casDe(s), VIDE).map((x) => [x.libelle, x.attendu]));
};
const juste = (s: Chapitre) => {
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error(s.code);
  return e.options(casDe(s), VIDE).find((o) => o.juste)!.texte;
};

describe("aucun chapitre de plus de 20 étapes", () => {
  it("chaque chapitre du registre tient en 20 étapes au plus", () => {
    const longs = CHAPITRES.filter((ch) => ch.etapes.length > ETAPES_AU_PLUS).map((ch) => `${ch.code} : ${ch.etapes.length}`);
    expect(longs).toEqual([]);
  });
});

describe("les huit suites", () => {
  it("sont au registre, chacune juste après sa première partie, et ont leur cas dédié", () => {
    expect(SUITES).toHaveLength(8);
    const codes = CHAPITRES.map((x) => x.code);
    for (const [suite, premiere] of SUITES) {
      expect(codes.indexOf(suite), suite).toBe(codes.indexOf(premiere) + 1);
      expect(CAS_PAR_CHAPITRE.filter((s) => s.reprend[0] === suite), suite).toHaveLength(1);
    }
  });

  it.each(SUITES)("%s : un chapitre à part, avec ses objectifs, ses blocs et son prérequis vers %s", (code, premiere) => {
    const s = chapitre(code);
    const p = chapitre(premiere);
    expect(s.prerequis).toEqual([premiere]);
    expect([s.parcours, s.palier, s.blocs, s.libre, s.entreprises?.codes]).toEqual([p.parcours, p.palier, p.blocs, p.libre, p.entreprises?.codes]);
    expect(s.titre).not.toBe(p.titre);
    expect(s.objectifs.length).toBeGreaterThan(0);
    // Chaque partie s'ouvre par une lecture et finit par sa synthèse, qui finit par l'arène.
    for (const ch of [p, s]) {
      expect(ch.etapes[0]!.type, ch.code).toBe("lecture");
      const fin = ch.etapes.at(-1)!;
      if (fin.type !== "lecture") throw new Error(`${ch.code} : la synthèse est une lecture`);
      expect(fin.texte(casDe(ch)).at(-1), ch.code).toMatch(/^Dans l'arène, les chiffres de votre (entreprise|usine) seront différents : la notion, elle, est la même\.$/);
    }
    // L'intro de la suite nomme la première partie ; la synthèse de la première annonce la suite.
    const intro = s.etapes[0]!;
    if (intro.type !== "lecture") throw new Error(code);
    expect(intro.texte(casDe(s)).join(" ")).toContain(`« ${p.titre} »`);
    const fin = p.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error(premiere);
    expect(fin.texte(casDe(p)).join(" ")).toContain(`« ${s.titre} »`);
    // Aucune étape n'est en double d'une partie à l'autre, sauf l'intro et la synthèse.
    const ids = new Set(p.etapes.map((e) => e.id));
    expect(s.etapes.filter((e) => ids.has(e.id) && !["intro", "synthese", "fin"].includes(e.id)).map((e) => e.id)).toEqual([]);
  });
});

describe("les cas dédiés des suites, refaits à la main", () => {
  it("le compte à terme à 4 % : l'emprunt placé coûte encore, après impôt", () => {
    gardeDuCas(LE_COMPTE_A_TERME_MIEUX_REMUNERE, chapitre("decider-apres-la-cloture"));
    // 80 000 € × 4 % × 355 jours ÷ 360 ; l'emprunt a coûté 3 681,11 € ; l'impôt au taux marginal de 25 %.
    const produit = c((80_000 * 0.04 * 355) / 360);
    expect(produit).toBe(3_155.56);
    expect(attendus(LE_COMPTE_A_TERME_MIEUX_REMUNERE, "les-chiffres")).toEqual({
      "Intérêts du placement": produit,
      "Coût net avant impôt": c(3_681.11 - produit),
      "Coût net après impôt": c(c(3_681.11 - produit) * 0.75),
    });
    expect(compteATermeMieuxRemunere().coutNetApresImpot).toBe(394.16);
    expect(juste(LE_COMPTE_A_TERME_MIEUX_REMUNERE)).toBe("Non : il coûte encore 394,16 € après impôt");
  });

  it("le liquidateur verse 70 % : N+1 gagne ce que la dépréciation avait de trop", () => {
    gardeDuCas(LE_LIQUIDATEUR_VERSE_DAVANTAGE, chapitre("le-denouement-des-risques"));
    const ttc = 33_630;
    const perteTtc = c(ttc - ttc * 0.7);
    const perteHt = c(perteTtc / 1.2);
    expect(attendus(LE_LIQUIDATEUR_VERSE_DAVANTAGE, "les-chiffres")).toEqual({
      "Perte toutes taxes comprises": perteTtc,
      "Perte hors taxes": perteHt,
      "TVA récupérée": c(perteTtc - perteHt),
      "Charge nette de N+1": c(perteHt - 11_210),
    });
    expect([perteTtc, perteHt, c(perteHt - 11_210)]).toEqual([10_089, 8_407.5, -2_802.5]);
    expect(liquidateurPlusGenereux().gain).toBe(true);
    expect(juste(LE_LIQUIDATEUR_VERSE_DAVANTAGE)).toBe("N+1 gagne 2 802,50 €, et N ne se corrige pas");
  });

  it("5 % moins cher : la marge fond, les ventes promises ne gardent pas le résultat", () => {
    gardeDuCas(LA_BAISSE_DE_PRIX_PROMISE, chapitre("les-leviers-du-seuil"));
    const prix = c(59 * 0.95);
    const marge = c(prix - 38);
    expect([prix, marge]).toEqual([56.05, 18.05]);
    expect(attendus(LA_BAISSE_DE_PRIX_PROMISE, "les-chiffres")).toEqual({
      "Marge sur coût variable unitaire": marge,
      "Seuil de rentabilité en quantité": Math.ceil(31_183 / marge),
      "Ventes qui gardent le résultat": Math.ceil((31_183 + 2_207) / marge),
    });
    expect([Math.ceil(31_183 / marge), Math.ceil((31_183 + 2_207) / marge), Math.floor(1_590 * 1.05)]).toEqual([1_728, 1_850, 1_669]);
    expect(baisseDePrixPromise().suffit).toBe(false);
    expect(juste(LA_BAISSE_DE_PRIX_PROMISE)).toBe("Non : il faudrait 1 850 ventes, pas 1 669");
  });

  it("le centre à 5 600 heures-machine : un écart sur activité favorable, des fixes mieux absorbés", () => {
    gardeDuCas(LE_CENTRE_TOURNE_PLUS, chapitre("le-budget-flexible"));
    const flexible = 120_000 + 16 * 5_600;
    const preetabli = (16 + 120_000 / 5_000) * 5_600;
    expect(attendus(LE_CENTRE_TOURNE_PLUS, "les-chiffres")).toEqual({
      "Budget flexible du centre": flexible,
      "Coût préétabli de l'activité": preetabli,
      "Écart sur activité": flexible - preetabli,
    });
    expect([flexible, preetabli, flexible - preetabli]).toEqual([209_600, 224_000, -14_400]);
    expect(leCentreTournePlus().favorable).toBe(true);
    expect(juste(LE_CENTRE_TOURNE_PLUS)).toBe("Favorable, mais les fixes n'ont pas baissé : ils sont mieux absorbés");
  });

  it("la prime du chef d'atelier : le temps gagné, la matière et le rendement perdus", () => {
    gardeDuCas(LA_PRIME_DU_CHEF_D_ATELIER, chapitre("les-ecarts-et-leurs-responsables"));
    // L'atelier répond de la quantité de matière, du temps de la main-d'œuvre et du rendement du centre.
    const part = -7_500 + 5_000 - 6_000;
    expect(primeDuChefDAtelier().lignes.map((l) => l.poste)).toEqual(["Matière : écart sur quantité", "Main-d'œuvre directe : écart sur temps", "Centre de montage : écart sur rendement"]);
    expect(attendus(LA_PRIME_DU_CHEF_D_ATELIER, "les-chiffres")).toEqual({ "Écart sur temps": 5_000, "Part de l'atelier": part, "Ses autres écarts": part - 5_000 });
    expect(juste(LA_PRIME_DU_CHEF_D_ATELIER)).toBe("Pas sur ce seul écart : sa part est de −8 500 €");
  });

  it("le concurrent solde à 57 € : le prix d'achat qui garde 54,5 % de marque", () => {
    gardeDuCas(LE_CONCURRENT_SOLDE, chapitre("s-aligner-sur-le-concurrent"));
    const ht = c(57 / 1.2);
    const achat = c(ht * (1 - 30 / 55));
    expect(attendus(LE_CONCURRENT_SOLDE, "les-chiffres")).toEqual({ "Prix de vente hors taxes": ht, "Prix d'achat qui garde le taux de marque": achat, "Marge commerciale d'un article": c(ht - achat) });
    expect([ht, achat, c(ht - achat)]).toEqual([47.5, 21.59, 25.91]);
    expect(concurrentSolde().baisseDuPrixDAchat).toBe(c(25 - 21.59));
    expect(juste(LE_CONCURRENT_SOLDE)).toBe("Obtenir 21,59 € au plus, et la marge baisse quand même");
  });

  it("un engagement plus modeste : moins de perte dans l'année, et jamais de label", () => {
    gardeDuCas(UN_ENGAGEMENT_PLUS_MODESTE, chapitre("ce-que-rapporte-l-engagement"));
    const k = engagementPlusModeste();
    expect(k.l.cout).toBe(4 * 6_000);
    expect(k.l.premier).toBeNull();
    expect(k.l.trimestresDeLabel).toBe(0);
    expect(k.ventesGagnees).toBeGreaterThan(0);
    expect(k.ventesGagnees).toBeLessThan(k.x.annee.ventesGagnees);
    expect(k.l.ecart).toBeGreaterThan(k.x.annee.ecart);
    expect(k.l.ecart).toBeLessThan(0);
    expect(attendus(UN_ENGAGEMENT_PLUS_MODESTE, "les-chiffres")).toEqual({ "Coût de l'engagement sur l'année": 24_000, "Enceintes vendues en plus": k.ventesGagnees, "Effet sur le résultat de l'année": k.l.ecart });
    expect(juste(UN_ENGAGEMENT_PLUS_MODESTE)).toBe("Il perd moins cette année, mais renonce au label");
  });

  it("les entreprises paient à 30 jours : le crédit de TVA du printemps fond", () => {
    gardeDuCas(LES_ENTREPRISES_PAIENT_PLUS_VITE, chapitre("encaissements-ou-debits"));
    const k = entreprisesPaientPlusVite();
    expect(k.delaiDeLaFiche).toBe(60);
    expect([k.avant.nette, k.apres.nette]).toEqual([-11_200, -3_200]);
    expect(attendus(LES_ENTREPRISES_PAIENT_PLUS_VITE, "les-chiffres")).toEqual({ "Encaissements hors taxes du printemps": 410_000, "TVA collectée": 410_000 * 0.2, "TVA nette": 410_000 * 0.2 - 85_200 });
    expect(juste(LES_ENTREPRISES_PAIENT_PLUS_VITE)).toBe("Il fond de 8 000 € : la TVA suit l'argent reçu");
  });
});
