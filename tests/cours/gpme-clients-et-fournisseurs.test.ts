import { describe, expect, it } from "vitest";
import { REFERENTIELS } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CHOISIR_SON_FOURNISSEUR,
  RISQUE_SOUS_LE_STOCK_DE_LIVRAISON,
  choixDuFournisseur,
} from "../../src/config/cours/chapitres/choisir-son-fournisseur";
import { COUT_RELEVE_A_REBOURS, LE_CLIENT_QUI_PAIE_TARD, clientQuiPaieTard, financerUneFacture } from "../../src/config/cours/chapitres/le-client-qui-paie-tard";
import { NOVA_DELAIS } from "../../src/config/cours/monde/delais-et-tva";
import { mobiliserUneFacture } from "../../src/config/cours/monde/delais";
import { CAPACITE_D_ABSORPTION } from "../../src/config/cours/monde/nova-capacite";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ESCOMPTER_CHAQUE_TRIMESTRE, escompteChaqueTrimestre } from "../../src/config/cours/situations/par-chapitre/escompter-chaque-trimestre";
import { JOURS_DE_DELAI_EN_PLUS, LE_FOURNISSEUR_ALLONGE_SON_DELAI, delaiAllonge } from "../../src/config/cours/situations/par-chapitre/le-fournisseur-allonge-son-delai";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * CHOISIR SON FOURNISSEUR ET LE CLIENT QUI PAIE TARD, CHEZ NOVA DU MONDE DU COURS, ET LEURS CAS : LE
 * FOURNISSEUR ALLONGE SON DÉLAI, ESCOMPTER CHAQUE TRIMESTRE (BTS GPME, palier 2).
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/delais-et-tva.ts : NOVA en N + 1,
 * ses trois offres de composants, CampusTech, sa banque), sans les fonctions des chapitres ni le modèle
 * (monde/delais.ts) ; les valeurs absolues sont épinglées. Chaque curseur : son attendu, sa position
 * voisine, ses droites aux bornes, sa lecture. Chaque laboratoire : sa lecture au départ et à la
 * solution, et les courbes de son graphique en quelques points. Les verdicts sont épinglés. Puis les
 * gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts) : rien d'indéfini, pas
 * de « de le », pas de tiret au milieu d'une phrase, des élisions faites, le signe moins, une seule
 * bonne réponse, aucune option qui en contient une autre, des libellés uniques, des notions qui
 * existent, des accords avec « enceinte ». S'y ajoutent deux gardes du lot : un montant dit s'il est
 * HT ou TTC, et le retard de CampusTech n'est jamais dit comme un délai convenu.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const centime = (x: number) => Math.round(x * 100) / 100;
/** Un montant tel que le cours l'écrit : « 120 633,33 € », l'espace fine insécable des milliers. */
const ecrit = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`.replace(/^-/, "−");

function textesDe(e: Etape, c: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(c);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(c), e.repere?.(c) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(c, etat), ...e.options(c, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(c, etat), ...e.champs(c, etat).flatMap((x) => [x.libelle, x.calcul, String(x.attendu)]), ...e.explication(c, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(c), ...e.categories.map((k) => k.libelle), ...e.elements(c).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(c), ...tableau];
    case "curseur": {
      const k = e.cible(c);
      const g = e.grandeur?.(c);
      const r = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(c);
      const depart = Object.fromEntries(e.leviers(c).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(e.graphique?.(c).courbes.map((x) => x.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|trente|soixante|quatre-vingts?|cent) (enceintes?|heures?|jours?|trimestres?|factures?|mois|jeux)\b/i);
      // Le retard de CampusTech n'est jamais dit comme un délai convenu.
      expect(x, `${e.id} : ${x}`).not.toMatch(/(convenu|délai de paiement) (de|à) 80 jours|conformément au contrat/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
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
      expect(new Set(champs.map((x) => x.libelle)).size, e.id).toBe(champs.length);
      for (const x of champs) {
        expect(Number.isFinite(x.attendu), `${e.id} : ${x.libelle}`).toBe(true);
        expect(Math.round(x.attendu * 100) / 100, `${e.id} : ${x.libelle}`).toBe(x.attendu);
      }
      // Sur un écart, la question dit avec quel signe le donner.
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
      // Un montant qui le peut dit s'il est hors taxes ou toutes taxes comprises (défaut 4 de l'audit).
      for (const x of champs) if (/^(Dettes?|Créances?|Stock|Crédit fournisseur|Achats|Coût des composants|Chiffre d'affaires|Effets)/.test(x.libelle)) expect(x.libelle, e.id).toMatch(/\((HT|TTC)\)$/);
    }
    if (e.type === "tri") {
      const codes = e.categories.map((k) => k.code);
      for (const x of e.elements(cas)) expect(codes, `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(SITUATIONS).toContain(s);
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  expect(s.etapes.filter((e) => e.type === "curseur"), s.code).toHaveLength(1);
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, sa position voisine, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre, ou la plus grande.
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et ses courbes en des points donnés. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  const g = e.graphique!(cas);
  const courbes = (p: Record<string, number>) => Object.fromEntries(g.courbes.map((c) => [c.libelle, centime(c.valeur(p))]));
  return { depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint, levier: g.levier, courbes };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOC_1 = `BTS GPME ${REFERENTIELS.gpme!.entrees[0]}`;

describe("les deux chapitres et leurs cas, chez NOVA du monde du cours", () => {
  it("se jouent chez NOVA seule, au palier 2 du BTS GPME, avec le bloc 1 du référentiel", () => {
    for (const ch of [CHOISIR_SON_FOURNISSEUR, LE_CLIENT_QUI_PAIE_TARD]) {
      expect(CHAPITRES).toContain(ch);
      expect(PROGRAMME.gpme[2], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(2);
      expect(ch.blocs).toEqual([BLOC_1]);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises?.codes).toEqual(["nova"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
      // Au gabarit de l'étalon : deux paris, deux curseurs, un laboratoire.
      expect(ch.etapes.filter((e) => e.type === "curseur").length, ch.code).toBeGreaterThanOrEqual(2);
      expect(ch.etapes.filter((e) => e.type === "simulation"), ch.code).toHaveLength(1);
      expect(ch.etapes.filter((e) => e.titre.startsWith("Pariez")).length, ch.code).toBeGreaterThanOrEqual(2);
    }
    expect(NOVA_DELAIS.entreprise).toBe(cas.entreprise);
  });
});

describe("choisir son fournisseur : trois offres de composants pour l'année N + 1", () => {
  const ch = CHOISIR_SON_FOURNISSEUR;
  // La fiche, refaite à la main : 26 000 enceintes, un jeu chacune ; 59 € HT, 16 € d'autres coûts variables.
  const ventes = [5_800, 7_000, 6_200, 7_000];
  const consommation = 26_000;
  const [EC, ASIA, EU] = [22, 19.8, 23.1];
  const coutAsia = consommation * ASIA;
  const coutEu = consommation * EU;
  const economie = consommation * (EC - ASIA);
  const margeAsia = 59 - ASIA - 16;
  const ventesPerdues = 4 * 0.1 * 700;
  const margePerdue = ventesPerdues * margeAsia;
  const resultatAsia = economie - margePerdue;
  // Le dernier trimestre : 7 000 jeux ; le stock d'AsiaComponents passe de 3 100 à 3 500 jeux (45 jours sur 90).
  const stockT3 = (6_200 * 45) / 90;
  const stockT4 = (7_000 * 45) / 90;
  const achatsT4 = { ec: 7_000 * EC, asia: (7_000 + stockT4 - stockT3) * ASIA, eu: 7_000 * EU };
  const detteEc = centime((achatsT4.ec * 30) / 90);
  const detteEu = (achatsT4.eu * 60) / 90;
  const stockAsia = stockT4 * ASIA;
  const tresoAsia = centime(resultatAsia - stockAsia - detteEc);
  const tresoEu = centime(-consommation * (EU - EC) + detteEu - detteEc);

  it("la fiche donne les chiffres de la consigne", () => {
    expect(NOVA_DELAIS.ventes).toEqual(ventes);
    expect([coutAsia, coutEu, centime(economie)]).toEqual([514_800, 600_600, 57_200]);
    expect([centime(margeAsia), centime(ventesPerdues), centime(margePerdue), centime(resultatAsia)]).toEqual([23.2, 280, 6_496, 50_704]);
    expect([achatsT4.ec, centime(achatsT4.asia), centime(achatsT4.eu)]).toEqual([154_000, 146_520, 161_700]);
    expect([detteEc, centime(detteEu), centime(stockAsia)]).toEqual([51_333.33, 107_800, 69_300]);
    expect([tresoAsia, tresoEu]).toEqual([-69_929.33, 27_866.67]);
  });

  it("les étapes guidées attendent ce que la fiche donne : le coût des composants, les ruptures, la dette et le stock", () => {
    expect(attendus(ch, "le-cout-des-composants")).toEqual({
      "Coût des composants avec AsiaComponents (HT)": 514_800,
      "Coût des composants avec EuroParts Premium (HT)": 600_600,
      "Économie d'AsiaComponents (HT)": 57_200,
    });
    expect(attendus(ch, "les-ruptures")).toEqual({
      "Marge d'une enceinte avec AsiaComponents": 23.2,
      "Enceintes perdues en moyenne sur l'année": 280,
      "Marge perdue par les ruptures": 6_496,
      "Écart de résultat d'AsiaComponents": 50_704,
    });
    // Le défaut de l'audit corrigé : la dette du bilan est TTC, celle de la comparaison HT.
    expect(attendus(ch, "dettes-et-stock")).toEqual({
      "Dettes envers l'offre habituelle (HT)": detteEc,
      "Dettes envers EuroParts Premium (HT)": 107_800,
      "Stock d'AsiaComponents au 31 décembre (HT)": 69_300,
      "Dettes envers l'offre habituelle au bilan (TTC)": (achatsT4.ec * 1.2 * 30) / 90,
    });
    expect((achatsT4.ec * 1.2 * 30) / 90).toBe(61_600);
    const synthese = ch.etapes.find((e) => e.id === "synthese")!;
    if (synthese.type !== "lecture") throw new Error("la synthèse est une lecture");
    expect(synthese.repere!(cas)).toContain("Dettes fournisseurs au bilan (TTC) = achats du trimestre (TTC) × délai ÷ 90");
    expect(synthese.repere!(cas)).not.toMatch(/achats du trimestre \(TTC\) × délai ÷ durée/);
  });

  it("les étapes autonomes : l'écart de trésorerie, le meilleur résultat, ce qui change quoi", () => {
    expect(attendus(ch, "l-ecart-de-tresorerie")).toEqual({ "Écart de trésorerie d'AsiaComponents": -69_929.33, "Écart de trésorerie d'EuroParts Premium": 27_866.67 });
    expect(juste(ch, "le-meilleur-resultat")).toBe("AsiaComponents, le prix le plus bas");
    const tri = ch.etapes.find((e) => e.id === "ce-qui-change-quoi") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Économie d'AsiaComponents sur les composants": [57_200, "resultat"],
      "Marge perdue par les ruptures d'AsiaComponents": [-6_496, "resultat"],
      "Stock d'AsiaComponents au 31 décembre": [69_300, "tresorerie"],
      "Dette envers l'offre habituelle au 31 décembre (HT)": [detteEc, "tresorerie"],
      "Gain de qualité d'EuroParts Premium": [6_318, "resultat"],
      "Dette envers EuroParts Premium au 31 décembre (HT)": [107_800, "tresorerie"],
      "Escompte d'Électro-Composants Lyon gagné sur l'année": [5_720, "resultat"],
    });
  });

  it("le curseur du délai : AsiaComponents rattrape l'offre habituelle en trésorerie à 43 jours", () => {
    expect(juste(ch, "predire-la-tresorerie")).toBe("Plus basse : payé comptant, avec du stock à payer d'avance");
    const attendu = Math.ceil((69_929.33 * 90) / achatsT4.asia);
    expect(attendu).toBe(43);
    // À 42 jours, il manque encore ; à 43, la trésorerie est rattrapée.
    expect(centime(-69_929.33 + (achatsT4.asia * 42) / 90)).toBe(-1_553.33);
    expect(centime(-69_929.33 + (achatsT4.asia * 43) / 90)).toBe(74.67);
    expect(curseur(ch, "le-delai-au-curseur")).toEqual({
      attendu: 43,
      bornes: [0, 60],
      droites: [0, 69_929.33, centime((achatsT4.asia * 60) / 90), 69_929.33],
      lecture: {
        "Écart de résultat": 50_704,
        "Stock d'AsiaComponents au 31 décembre (HT)": 69_300,
        "Dettes envers AsiaComponents au 31 décembre (HT)": centime((achatsT4.asia * 43) / 90),
        "Dettes envers l'offre habituelle au 31 décembre (HT)": detteEc,
        "Écart de trésorerie au 31 décembre": 74.67,
      },
    });
    expect([centime((achatsT4.asia * 60) / 90), centime((achatsT4.asia * 43) / 90)]).toEqual([97_680, 70_004]);
  });

  it("le curseur de l'escompte : 1 % paie le découvert jusqu'à 40 jours d'avance ; il en faut 20", () => {
    expect(juste(ch, "predire-l-escompte")).toBe("Rapporte : 1 % pour 20 jours, c'est bien plus que 9 % l'an");
    const escompte = 572_000 * 0.01;
    const avance = 572_000 - escompte;
    const parJour = (avance * 0.09) / 360;
    expect([escompte, avance, centime(parJour)]).toEqual([5_720, 566_280, 141.57]);
    expect(Math.floor(escompte / parJour)).toBe(40);
    expect(curseur(ch, "l-escompte-au-curseur")).toEqual({
      attendu: 40,
      bornes: [0, 60],
      droites: [5_720, 0, 5_720, centime(parJour * 60)],
      lecture: { "Escompte gagné sur l'année": 5_720, "Coût du découvert pour payer plus tôt": centime(parJour * 40), "Gain net de l'escompte": centime(5_720 - parJour * 40) },
    });
    expect([centime(parJour * 60), centime(parJour * 40)]).toEqual([8_494.2, 5_662.8]);
  });

  it("les étapes d'expert : l'escompte en taux annuel, le délai à rebours, le besoin financé, la qualité comptée", () => {
    // 1 % ÷ 99 % × 360 ÷ 20 ; le découvert de 20 jours sur les achats escompte déduit ; la dette payée à 10 jours.
    expect(attendus(ch, "l-escompte-en-taux-annuel")).toEqual({
      "Taux annuel de l'escompte (%)": centime((0.01 / 0.99) * (360 / 20) * 100),
      "Gain net de l'escompte sur l'année": centime(5_720 - (566_280 * 0.09 * 20) / 360),
      "Dette du 31 décembre qui disparaît (HT)": centime(detteEc - centime((154_000 * 10) / 90)),
    });
    expect([centime((0.01 / 0.99) * (360 / 20) * 100), centime(5_720 - (566_280 * 0.09 * 20) / 360), centime(detteEc - centime((154_000 * 10) / 90))]).toEqual([18.18, 2_888.6, 34_222.22]);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Achats d'AsiaComponents au dernier trimestre (HT)": 146_520,
      "Délai qui annule l'écart de trésorerie (jours)": centime((69_929.33 * 90) / 146_520),
      "Écart de trésorerie à 43 jours": 74.67,
    });
    expect(centime((69_929.33 * 90) / 146_520)).toBe(42.95);
    // Le besoin : le stock à porter et le crédit perdu ; financé un an au découvert.
    const besoin = centime(stockAsia + detteEc);
    expect(attendus(ch, "le-besoin-a-financer")).toEqual({
      "Besoin de financement en plus": besoin,
      "Coût du besoin sur un an": centime(besoin * 0.09),
      "Écart de résultat après financement": centime(50_704 - centime(besoin * 0.09)),
    });
    expect([besoin, centime(besoin * 0.09), centime(50_704 - centime(besoin * 0.09))]).toEqual([120_633.33, 10_857, 39_847]);
    // La qualité d'EuroParts (la fiche de capacité) : 26 000 × 0,5 % = 130 défauts de moins, à 36 € ; 26 livrés de moins, 3 ventes chacun, à 21 €.
    const gain = 130 * 36 + 26 * 3 * 21;
    expect(attendus(ch, "europarts-et-la-qualite")).toEqual({
      "Gain de qualité d'EuroParts Premium": gain,
      "Écart de résultat, qualité comptée": -28_600 + gain,
      "Écart de trésorerie, qualité comptée": centime(-28_600 + gain + 107_800 - detteEc),
    });
    expect([gain, -28_600 + gain, centime(-28_600 + gain + 107_800 - detteEc)]).toEqual([6_318, -22_282, 34_184.67]);
  });

  it("le laboratoire des offres : AsiaComponents gagne sur les deux tableaux à 43 jours, sans couper son stock", () => {
    const l = laboratoire(ch, "le-laboratoire-des-offres");
    expect(l.depart).toEqual({ offre: 1, delai: 0, stock: 45 });
    expect(l.solution).toEqual({ offre: 1, delai: 43, stock: 45 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Prix d'un jeu de composants (HT)": 19.8,
      "Économie sur les composants": 57_200,
      "Marge perdue par les ruptures": -6_496,
      "Écart de résultat": 50_704,
      "Stock au 31 décembre (HT)": 69_300,
      "Dettes fournisseurs au 31 décembre (HT)": 0,
      "Écart de trésorerie au 31 décembre": -69_929.33,
      "Écart de résultat après financement": 39_847,
    });
    // À 43 jours : 70 004 € de dettes ; le besoin tombe à 69 300 − (70 004 − 51 333,33).
    const besoin43 = centime(69_300 - (70_004 - detteEc));
    expect(besoin43).toBe(50_629.33);
    expect(l.aLaSolution).toEqual({
      "Prix d'un jeu de composants (HT)": 19.8,
      "Économie sur les composants": 57_200,
      "Marge perdue par les ruptures": -6_496,
      "Écart de résultat": 50_704,
      "Stock au 31 décembre (HT)": 69_300,
      "Dettes fournisseurs au 31 décembre (HT)": 70_004,
      "Écart de trésorerie au 31 décembre": 74.67,
      "Écart de résultat après financement": centime(50_704 - centime(besoin43 * 0.09)),
    });
    expect(centime(50_704 - centime(besoin43 * 0.09))).toBe(46_147.36);
    // Ni l'offre habituelle allongée (le résultat ne bouge pas), ni EuroParts (son prix) ne relèvent le défi.
    expect(l.atteint({ offre: 0, delai: 60, stock: 0 })).toBe(false);
    expect(l.atteint({ offre: 2, delai: 60, stock: 0 })).toBe(false);
    // Sous son stock de livraison, AsiaComponents rompt chaque trimestre : 4 × 700 enceintes à 23,20 €.
    expect(RISQUE_SOUS_LE_STOCK_DE_LIVRAISON).toBe(1);
    expect(l.atteint({ offre: 1, delai: 60, stock: 40 })).toBe(false);
    // Le graphique suit le stock : le résultat saute à 45 jours, la trésorerie baisse de 7 000 × j ÷ 90 × 19,80 €.
    expect(l.levier).toBe("stock");
    const sansStock = centime(57_200 - 4 * 700 * margeAsia);
    expect(sansStock).toBe(-7_760);
    expect(l.courbes({ offre: 1, delai: 0, stock: 0 })).toEqual({ "Écart de résultat": sansStock, "Écart de trésorerie au 31 décembre": centime(sansStock - detteEc) });
    expect(l.courbes({ offre: 1, delai: 0, stock: 40 })).toEqual({
      "Écart de résultat": sansStock,
      "Écart de trésorerie au 31 décembre": centime(sansStock - centime(((7_000 * 40) / 90) * ASIA) - detteEc),
    });
    expect(l.courbes({ offre: 1, delai: 0, stock: 45 })).toEqual({ "Écart de résultat": 50_704, "Écart de trésorerie au 31 décembre": -69_929.33 });
    expect(l.courbes({ offre: 1, delai: 0, stock: 90 })).toEqual({ "Écart de résultat": 50_704, "Écart de trésorerie au 31 décembre": centime(50_704 - 7_000 * ASIA - detteEc) });
  });

  it("les verdicts : AsiaComponents, si NOVA peut porter le besoin", () => {
    expect(juste(ch, "resultat-ou-tresorerie")).toBe(`AsiaComponents, si NOVA peut porter ${ecrit(120_633.33)} de besoin en plus`);
    const k = choixDuFournisseur(cas);
    expect([k.choix.meilleureEnResultat, k.choix.meilleureEnTresorerie, k.choix.meilleureApresFinancement]).toEqual(["asiacomponents", "europarts", "asiacomponents"]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le fournisseur allonge son délai : 60 jours face à AsiaComponents", () => {
  const s = LE_FOURNISSEUR_ALLONGE_SON_DELAI;
  const detteEc60 = centime((154_000 * 60) / 90);
  const tresoFace = centime(50_704 - 69_300 - detteEc60);
  const besoin = centime(69_300 + detteEc60);

  it("la contre-offre, refaite à la main : 30 jours de plus, le maximum permis", () => {
    casDedie(s, CHOISIR_SON_FOURNISSEUR);
    expect(s.commanditaire).toBe("La dirigeante");
    expect(JOURS_DE_DELAI_EN_PLUS).toBe(30);
    expect(30 + JOURS_DE_DELAI_EN_PLUS).toBe(60);
    expect(attendus(s, "le-credit-en-plus")).toEqual({
      "Crédit fournisseur en plus (HT)": centime((154_000 * 30) / 90),
      "Crédit fournisseur en plus au bilan (TTC)": (154_000 * 1.2 * 30) / 90,
      "Découvert évité sur un an": (572_000 * 30 * 0.09) / 360,
    });
    expect([centime((154_000 * 30) / 90), (154_000 * 1.2 * 30) / 90, (572_000 * 30 * 0.09) / 360]).toEqual([51_333.33, 61_600, 4_290]);
  });

  it("le croisement face à AsiaComponents, et le délai qu'il lui faudrait", () => {
    expect(attendus(s, "face-a-l-offre-la-moins-chere")).toEqual({
      "Écart de résultat d'AsiaComponents": 50_704,
      "Écart de trésorerie d'AsiaComponents": tresoFace,
      "Besoin de financement en plus": besoin,
    });
    expect([tresoFace, besoin]).toEqual([-121_262.67, 171_966.67]);
    // Il faudrait 121 262,67 × 90 ÷ 146 520 = 74,5 jours : 75, au-delà des 60 que la loi permet.
    expect(Math.ceil((121_262.67 * 90) / 146_520)).toBe(75);
    expect(curseur(s, "le-delai-qu-il-faudrait")).toEqual({
      attendu: 75,
      bornes: [0, 90],
      droites: [0, 121_262.67, 146_520, 121_262.67],
      lecture: {
        "Crédit d'AsiaComponents au 31 décembre (HT)": (146_520 * 75) / 90,
        "Écart de trésorerie face à la contre-offre": centime(-121_262.67 + (146_520 * 75) / 90),
        "Écart de résultat face à la contre-offre": 50_704,
      },
    });
    expect(centime(-121_262.67 + (146_520 * 75) / 90)).toBe(837.33);
    expect(centime(-121_262.67 + (146_520 * 74) / 90)).toBe(-790.67);
    expect(delaiAllonge(cas).auDelaiMaximal.ecartDeTresorerie).toBe(centime(-121_262.67 + (146_520 * 60) / 90));
    expect(centime(-121_262.67 + (146_520 * 60) / 90)).toBe(-23_582.67);
  });

  it("ce que NOVA peut porter : son compte courant moins son matelas, sous le besoin", () => {
    const capacite = centime(115_734.87 - 10_000);
    expect([CAPACITE_D_ABSORPTION.compteCourant, CAPACITE_D_ABSORPTION.matelas]).toEqual([115_734.87, 10_000]);
    expect(attendus(s, "ce-que-nova-peut-porter")).toEqual({
      "Coût du besoin sur un an": centime(besoin * 0.09),
      "Écart de résultat après financement": centime(50_704 - centime(besoin * 0.09)),
      "Besoin au-delà de ce que l'entreprise peut engager": centime(besoin - capacite),
    });
    expect([centime(besoin * 0.09), centime(50_704 - centime(besoin * 0.09)), centime(besoin - capacite)]).toEqual([15_477, 35_227, 66_231.8]);
    expect(delaiAllonge(cas).verdict).toBe("le-delai");
    expect(juste(s, "reponse")).toBe("La contre-offre : le besoin de l'autre dépasse ce que l'entreprise peut porter");
  });

  it("la demande dit « la réserve », 133 000 € placés et 22 656 € versés le 1er janvier, pas « le placement »", () => {
    expect(CAPACITE_D_ABSORPTION.reserve).toBe(133_000 + 22_656);
    const demande = s.etapes[0]!;
    const texte = demande.type === "lecture" ? demande.texte(cas).join(" ") : "";
    expect(texte).toContain(`la réserve, ${ecrit(155_656)} sur deux comptes à terme, est celle de la gamme à venir`);
    expect(texte).not.toMatch(/le placement de/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("le client qui paie tard : CampusTech, 60 jours convenus, payée à l'échéance ; et si elle payait à 80", () => {
  const ch = LE_CLIENT_QUI_PAIE_TARD;
  // La facture, refaite à la main : 320 enceintes à 59 € HT, 20 % de TVA.
  const HT = 320 * 59;
  const TVA = HT * 0.2;
  const TTC = HT + TVA;
  const parJour = (TTC * 0.09) / 360;
  const plancher = 3 * 0.0276;
  const loi = 0.0215 + 0.1;

  it("la fiche donne les chiffres de la consigne : payée à l'échéance, 60 jours, et un retard supposé de 20 jours", () => {
    expect([HT, TVA, TTC]).toEqual([18_880, 3_776, 22_656]);
    const ct = NOVA_DELAIS.campustech;
    expect([ct.delaiConvenu, ct.delaiReel, ct.retardSuppose, ct.delaiSiRetard]).toEqual([60, 60, 20, 60 + 20]);
    expect(parJour).toBeCloseTo(5.664, 12);
  });

  it("les étapes guidées : les créances facture par facture, le délai moyen, le crédit convenu", () => {
    // L'hypothèse : payées 80 jours après le 20 du mois, les factures d'octobre (jour 20), de novembre (50) et de décembre (80) tomberaient après le 31 décembre (jour 90).
    expect([20 + 80 > 90, 50 + 80 > 90, 80 + 80 > 90]).toEqual([true, true, true]);
    expect(attendus(ch, "les-creances")).toEqual({ "Montant d'une facture de CampusTech (TTC)": TTC, "Factures encore dues au 31 décembre, en retard": 3, "Créances clients au 31 décembre, en retard (TTC)": 3 * TTC });
    expect(3 * TTC).toBe(67_968);
    const caTTC = 7_000 * 59 * 1.2;
    expect(attendus(ch, "le-delai-moyen")).toEqual({
      "Chiffre d'affaires du dernier trimestre (TTC)": caTTC,
      "Délai moyen de paiement des clients, en retard (jours)": Math.round(((3 * TTC) / caTTC) * 90 * 10) / 10,
      "Part de CampusTech dans le chiffre d'affaires (%)": centime(((3 * HT) / (7_000 * 59)) * 100),
    });
    expect([caTTC, Math.round(((3 * TTC) / caTTC) * 90 * 10) / 10, centime(((3 * HT) / (7_000 * 59)) * 100)]).toEqual([495_600, 12.3, 13.71]);
    // NOVA vend des biens : elle finance le TTC, la TVA comprise.
    expect(attendus(ch, "le-cout-du-credit")).toEqual({
      "Coût du crédit convenu d'une facture": centime((TTC * 0.09 * 60) / 360),
      "Part qui finance la TVA": centime((TVA * 0.09 * 60) / 360),
      "Coût du crédit convenu sur l'année": centime(12 * centime((TTC * 0.09 * 60) / 360)),
    });
    expect([centime((TTC * 0.09 * 60) / 360), centime((TVA * 0.09 * 60) / 360), centime(12 * 339.84)]).toEqual([339.84, 56.64, 4_078.08]);
    expect(clientQuiPaieTard(cas).creditHorsTaxes).toBe(centime((HT * 0.09 * 60) / 360));
  });

  it("le curseur du retard : au plancher légal, l'indemnité couvre l'écart des taux jusqu'à 76 jours", () => {
    expect(juste(ch, "predire-le-retard")).toBe("Jusqu'à un certain retard : l'indemnité comble l'écart des taux, puis s'épuise");
    const parJourPlancher = (TTC * plancher) / 365;
    const attendu = Math.floor(40 / (parJour - parJourPlancher));
    expect(attendu).toBe(76);
    const reclame = (j: number, t: number) => centime((TTC * t * j) / 365 + 40);
    expect(curseur(ch, "le-retard-au-curseur")).toEqual({
      attendu: 76,
      bornes: [1, 120],
      droites: [centime(parJourPlancher + 40), centime(parJour), centime(parJourPlancher * 120 + 40), centime(parJour * 120)],
      lecture: {
        "Coût du retard au découvert": centime(parJour * 76),
        "Réclamable au plancher légal": reclame(76, plancher),
        "Réclamable au taux de la loi": reclame(76, loi),
        "Ce que le plancher laisse à l'entreprise": centime(reclame(76, plancher) - centime(parJour * 76)),
      },
    });
    expect([centime(parJour * 76), reclame(76, plancher), reclame(76, loi)]).toEqual([430.46, 430.6, 613.17]);
    // Un jour de plus, le découvert passe devant.
    expect(reclame(77, plancher)).toBeLessThan(centime(parJour * 77));
  });

  it("le coût du retard et ce qui se réclame : 113,28 € contre 150,83 € et 40 € par facture", () => {
    const penalites = centime((TTC * loi * 20) / 365);
    expect(attendus(ch, "le-cout-du-retard")).toEqual({
      "Coût du retard d'une facture": centime(parJour * 20),
      "Pénalités de retard d'une facture": penalites,
      "Coût du retard sur l'année": centime(12 * centime(parJour * 20)),
      "Réclamable sur l'année": centime(12 * (penalites + 40)),
    });
    expect([centime(parJour * 20), penalites, centime(12 * 113.28), centime(12 * (penalites + 40))]).toEqual([113.28, 150.83, 1_359.36, 2_289.96]);
    expect(juste(ch, "que-faire-du-retard")).toBe("Lui rappeler les pénalités et l'indemnité dues, pour obtenir le paiement à l'échéance");
    expect(juste(ch, "ce-que-cache-le-delai-moyen")).toBe("La moyenne cache le retard : les particuliers paient comptant, CampusTech paierait en retard");
  });

  it("le curseur de l'escompte : un escompte de 60 jours coûte autant que 40 jours de découvert", () => {
    expect(juste(ch, "predire-l-escompte")).toBe("Non : il se paie sur tous ses jours, le découvert seulement les jours où le compte est débiteur");
    const escompte = centime((TTC * 0.06 * 60) / 360);
    expect(escompte).toBe(226.56);
    expect((60 * 0.06) / 0.09).toBeCloseTo(40, 12);
    expect(curseur(ch, "l-escompte-ou-le-decouvert")).toEqual({
      attendu: 40,
      bornes: [0, 90],
      droites: [escompte, 0, escompte, centime(parJour * 90)],
      lecture: { "Coût de l'escompte jusqu'à l'échéance": escompte, "Coût du découvert de ces jours": centime(parJour * 40), "Ce que l'escompte coûte de plus": 0 },
    });
    expect(centime(parJour * 90)).toBe(509.76);
  });

  it("une facture mobilisée trois façons : l'escompte, puis le retard, reste le moins cher", () => {
    const escompte = centime((TTC * 0.06 * 60) / 360);
    expect(attendus(ch, "une-facture-mobilisee")).toEqual({
      "Escompte jusqu'à l'échéance": escompte,
      "Escompte, puis le retard au découvert": centime(escompte + centime(parJour * 20)),
      "Découvert seul jusqu'au paiement": centime(parJour * 80),
      "Affacturage jusqu'au paiement": centime(TTC * 0.01 + (TTC * 0.06 * 80) / 360),
    });
    expect([centime(escompte + 113.28), centime(parJour * 80), centime(TTC * 0.01 + (TTC * 0.06 * 80) / 360)]).toEqual([339.84, 453.12, 528.64]);
    expect(juste(ch, "le-prix-de-la-garantie")).toBe("Le factor achète la créance : il encaisse le client et garantit l'impayé");
    expect(centime(528.64 - 339.84)).toBe(188.8);
  });

  it("les étapes d'expert : la variante à l'échéance, le retard retrouvé à rebours", () => {
    // Au réel, à 60 jours, la facture d'octobre (jour 20) est payée au jour 80 : restent novembre et décembre.
    expect([20 + 60 > 90, 50 + 60 > 90, 80 + 60 > 90]).toEqual([false, true, true]);
    expect(attendus(ch, "a-l-echeance")).toEqual({
      "Créances clients au 31 décembre, à l'échéance (TTC)": 2 * TTC,
      "Délai moyen de paiement à l'échéance (jours)": Math.round(((2 * TTC) / 495_600) * 90 * 10) / 10,
      "Ce que le retard laisserait en plus au bilan (TTC)": TTC,
    });
    expect([2 * TTC, Math.round(((2 * TTC) / 495_600) * 90 * 10) / 10]).toEqual([45_312, 8.2]);
    // Le relevé : 396,48 € = 226,56 € d'escompte + j × 5,664 € de découvert.
    expect(COUT_RELEVE_A_REBOURS).toBe(396.48);
    const retard = (396.48 - 226.56) / parJour;
    expect(retard).toBeCloseTo(30, 9);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Jours de retard": 30,
      "Jour du paiement, après la facture": 90,
      "Réclamable pour cette facture": centime(centime((TTC * loi * 30) / 365) + 40),
    });
    expect(centime(centime((TTC * loi * 30) / 365) + 40)).toBe(266.25);
  });

  it("le laboratoire de la facture : au compte débiteur, l'escompte ; au compte créditeur, attendre", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-facture");
    expect(l.depart).toEqual({ delai: 80, compte: 9, base: 1, outil: 0 });
    expect(l.solution).toEqual({ delai: 80, compte: 9, base: 1, outil: 1 });
    expect(l.reussi).toEqual([false, true]);
    const auDepart = {
      "Jours de retard": 20,
      "Coût en attendant sur le compte": -centime(parJour * 80),
      "Coût par l'escompte": -339.84,
      "Coût par l'affacturage": -528.64,
      "Coût de la façon choisie": -centime(parJour * 80),
      "Pénalités et indemnité réclamables": centime(centime((TTC * loi * 20) / 365) + 40),
    };
    expect(l.auDepart).toEqual(auDepart);
    expect(l.aLaSolution).toEqual({ ...auDepart, "Coût de la façon choisie": -339.84 });
    // Au compte créditeur (le placement, 3 %), attendre devient le moins cher, et relève le défi.
    const attendre3 = centime((TTC * 0.03 * 80) / 360);
    const escompte3 = centime(226.56 + (TTC * 0.03 * 20) / 360);
    expect([attendre3, escompte3]).toEqual([151.04, 264.32]);
    expect(financerUneFacture(NOVA_DELAIS, { delaiReel: 80, tauxDuCompte: 0.03, base: "bce" }).couts).toEqual({ attendre: attendre3, escompte: escompte3, affacturage: 528.64 });
    expect(l.atteint({ delai: 80, compte: 3, base: 1, outil: 0 })).toBe(true);
    expect(l.atteint({ delai: 80, compte: 3, base: 1, outil: 1 })).toBe(false);
    // Le graphique suit le jour du paiement : l'escompte est plat jusqu'à l'échéance, puis monte au taux du compte.
    expect(l.levier).toBe("delai");
    const p = (delai: number) => ({ delai, compte: 9, base: 1, outil: 0 });
    expect(l.courbes(p(30))).toEqual({ "Coût en attendant sur le compte": centime(parJour * 30), "Coût par l'escompte": 226.56, "Coût par l'affacturage": centime(226.56 + (TTC * 0.06 * 30) / 360) });
    expect(l.courbes(p(60))).toEqual({ "Coût en attendant sur le compte": 339.84, "Coût par l'escompte": 226.56, "Coût par l'affacturage": centime(226.56 + (TTC * 0.06 * 60) / 360) });
    expect(l.courbes(p(120))).toEqual({ "Coût en attendant sur le compte": centime(parJour * 120), "Coût par l'escompte": centime(226.56 + parJour * 60), "Coût par l'affacturage": centime(226.56 + (TTC * 0.06 * 120) / 360) });
    expect([centime(parJour * 30), centime(226.56 + (TTC * 0.06 * 30) / 360), centime(226.56 + parJour * 60), centime(226.56 + (TTC * 0.06 * 120) / 360)]).toEqual([169.92, 339.84, 566.4, 679.68]);
    // Au plancher légal, seules les pénalités réclamables changent.
    expect(l.atteint({ delai: 80, compte: 9, base: 2, outil: 1 })).toBe(true);
    expect(financerUneFacture(NOVA_DELAIS, { delaiReel: 80, tauxDuCompte: 0.09, base: "taux-legal" }).reclamable).toBe(centime(centime((TTC * plancher * 20) / 365) + 40));
    // Au compte débiteur et au délai de la fiche, le laboratoire redonne la facture mobilisée du modèle.
    const m = mobiliserUneFacture(NOVA_DELAIS);
    expect(financerUneFacture(NOVA_DELAIS, { delaiReel: 80, tauxDuCompte: 0.09, base: "bce" }).couts).toEqual({ attendre: m.decouvert, escompte: m.escompteEtRetard, affacturage: m.affacturage });
  });

  it("le retard est une hypothèse : CampusTech paie à l'échéance, jamais « à 80 jours » au présent", () => {
    const intro = ch.etapes.find((e) => e.id === "intro")!;
    const t = intro.tableau!(cas);
    expect(t.lignes.find((l) => l.libelle === "Paiement réel")!.valeurs).toEqual(["à l'échéance, 60 jours après la facture"]);
    expect(t.lignes.find((l) => l.libelle === "Hypothèse du chapitre : un paiement en retard")!.valeurs).toEqual(["80 jours après la facture, 20 jours de retard"]);
    expect(intro.type === "lecture" && intro.texte(cas).join(" ")).toMatch(/CampusTech paie à l'échéance\. Ce chapitre pose une hypothèse : si CampusTech payait 20 jours en retard, à 80 jours/);
    const synthese = ch.etapes.find((e) => e.id === "synthese")!;
    expect(synthese.type === "lecture" && synthese.texte(cas)[0]).toContain(`paie à l'échéance et doit ${ecrit(2 * 22_656)} au 31 décembre, 2 factures. Si elle payait 20 jours en retard, elle en devrait ${ecrit(3 * 22_656)}`);
    for (const e of ch.etapes) for (const x of textesDe(e, cas, etatVide)) expect(x, `${e.id} : ${x}`).not.toMatch(/(paie|payée|tient son délai|délai réel) (à|de) 80 jours/);
    // Un délai de plus de 60 jours ne se convient pas : l'option qui le propose est fausse, et son retour rappelle le plafond.
    const o = (ch.etapes.find((e) => e.id === "que-faire-du-retard") as EtapeChoix).options(cas, etatVide).find((x) => /80 jours/.test(x.texte))!;
    expect(o.juste).toBe(false);
    expect(o.retour).toMatch(/la loi plafonne le délai convenu à 60 jours/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("escompter chaque trimestre : ni tout, ni rien", () => {
  const s = ESCOMPTER_CHAQUE_TRIMESTRE;
  const TTC = 320 * 59 * 1.2;
  const parFacture = centime((TTC * 0.06 * 60) / 360);

  it("ce que coûterait l'escompte, et le découvert qu'il éviterait", () => {
    casDedie(s, LE_CLIENT_QUI_PAIE_TARD);
    expect(s.commanditaire).toBe("Le dirigeant");
    expect(attendus(s, "ce-que-coute-l-escompte")).toEqual({ "Escompte d'une facture": parFacture, "Effets escomptés au plus fort (TTC)": 2 * TTC, "Escompte de l'année": centime(12 * parFacture) });
    expect([parFacture, 2 * TTC, centime(12 * parFacture)]).toEqual([226.56, 45_312, 2_718.72]);
    expect(2 * TTC).toBeLessThanOrEqual(50_000);
    expect(attendus(s, "le-decouvert-evite")).toEqual({
      "Découvert du 2e trimestre": (25_000 * 0.09 * 20) / 360,
      "Découvert du 4e trimestre": (40_000 * 0.09 * 50) / 360,
      "Surcoût de l'escompte de chaque facture": centime(2_718.72 - 625),
    });
    expect([(25_000 * 0.09 * 20) / 360, (40_000 * 0.09 * 50) / 360, centime(2_718.72 - 625)]).toEqual([125, 500, 2_093.72]);
  });

  it("le curseur du quatrième trimestre : le découvert de 40 000 € coûte moins que l'escompte de 2 factures jusqu'à 45 jours", () => {
    // 40 000 € demandent 2 factures (45 312 €) ; 453,12 € face à 40 000 × 9 % × j ÷ 360 = 10 € par jour.
    expect(Math.ceil(40_000 / TTC)).toBe(2);
    expect(Math.floor((2 * parFacture) / ((40_000 * 0.09) / 360))).toBe(45);
    expect(curseur(s, "le-quatrieme-trimestre")).toEqual({
      attendu: 45,
      bornes: [0, 90],
      droites: [453.12, 0, 453.12, 900],
      lecture: { "Escompte des factures qui couvrent le besoin": 453.12, "Découvert de ces jours": 450, "Ce que l'escompte coûte de plus": 3.12 },
    });
  });

  it("au mieux : le découvert au deuxième trimestre, l'escompte au quatrième", () => {
    expect(attendus(s, "au-mieux")).toEqual({
      "Jours de découvert qui valent l'escompte, au 2e trimestre": centime(453.12 / ((25_000 * 0.09) / 360)),
      "Coût du 2e trimestre, au mieux": 125,
      "Coût de l'année, au mieux": centime(125 + 453.12),
    });
    expect([centime(453.12 / ((25_000 * 0.09) / 360)), centime(125 + 453.12)]).toEqual([72.5, 578.12]);
    expect(escompteChaqueTrimestre(cas).verdict).toBe("au-cas-par-cas");
    expect(escompteChaqueTrimestre(cas).economie).toBe(centime(2_718.72 - 578.12));
    expect(juste(s, "reponse")).toBe("Escompter au 4e trimestre seulement, pas chaque trimestre");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
