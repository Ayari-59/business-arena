import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { BAISSE_DU_DEFI, REDEVANCES_DE_CREDIT_BAIL, SOLDES_INTERMEDIAIRES, soldesDeGestion } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CLOTURE_DE_LA_FICHE, EXERCICE_DE_NOVA as f } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DU_TAUX, PERTE_DE_RESULTAT_TOLEREE, QUAND_LE_TAUX_MONTE, tauxQuiMonte } from "../../src/config/cours/situations/par-chapitre/quand-le-taux-monte";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES SOLDES INTERMÉDIAIRES DE GESTION ET LA CAF, SUR L'EXERCICE DE NOVA DU MONDE DU COURS, ET LEUR
 * CAS : QUAND LE TAUX MONTE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/exercice-de-nova.ts) : la
 * balance avant inventaire, les travaux d'inventaire, l'impôt au taux réduit puis normal, sans les
 * fonctions du chapitre ni le modèle de la clôture. Le curseur de la ligne louée, le laboratoire de
 * l'EBE, la variante des retraitements, l'emprunt gardé pour être placé et le cas au nouveau taux sont
 * refaits comme le reste, et les verdicts épinglés. Les gardes de texte sont celles de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts). Enfin, l'export de compatibilité `soldesDeGestion`
 * que lisent d'autres chapitres redonne toujours l'année figée de l'arène, dans chaque entreprise.
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const c2 = (x: number) => Math.round(x * 100) / 100 + 0;
/** L'impôt du barème de la fiche : 15 % jusqu'à 42 500 €, 25 % au-delà, arrondi à l'euro. */
const impot = (rcai: number) => Math.round(42_500 * 0.15 + (rcai - 42_500) * 0.25);

// La fiche, relue une fois, et les travaux d'inventaire refaits à la main.
const JOURS = 25 + 11 * 30; // du 6 janvier au 31 décembre, jours compris, en mois de 30 jours
const VENTES = 1_385_556;
const FAE = 200 * 59;
const PCA = 120 * 59;
const ACHATS = 499_598;
const FNP = 1_500 * 23;
const STOCK = 600 * ((1_500 * 22 + 1_500 * 23) / 3_000);
const NON_STOCKES = 377_744;
const LOYER = 236_400;
const ASSURANCE = 6_000 - (6_000 * 9) / 12;
const SALAIRES = 12 * 7_500;
const CHARGES_SOCIALES = SALAIRES * 0.42;
const DOTATION = c2((60_000 / 6) * (JOURS / 360));
const DEPRECIATION = c2((33_630 / 1.2) * 0.4);
const PROVISION = 5_000;
const INTERETS_PAYES = (80_000 + 76_000 + 72_000) * (0.05 / 4);
const INTERETS_COURUS = c2(68_000 * (0.05 / 4) * (88 / 90));
const INTERETS = c2(INTERETS_PAYES + INTERETS_COURUS);
const ESCOMPTE = 448.4;
const PLACEMENT = c2(133_000 * 0.03 * (JOURS / 360));

const PRODUCTION = VENTES + FAE - PCA;
const ACHATS_CONSOMMES = ACHATS + FNP - STOCK;
const CONSOMMATIONS = ACHATS_CONSOMMES + NON_STOCKES + LOYER + ASSURANCE;
const VA = PRODUCTION - CONSOMMATIONS;
const PERSONNEL = SALAIRES + CHARGES_SOCIALES;
const EBE = VA - PERSONNEL;
const DOTATIONS = c2(DOTATION + DEPRECIATION + PROVISION);
const RE = c2(EBE - DOTATIONS);
const CHARGES_FINANCIERES = c2(INTERETS + ESCOMPTE);
const RF = c2(PLACEMENT - CHARGES_FINANCIERES);
const RCAI = c2(RE + RF);
const IS = impot(RCAI);
const RN = c2(RCAI - IS);
const CAF = c2(RN + DOTATIONS);

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|trente|cent) (enceintes?|heures?|trimestres?|mois|jours|points|échéances)\b/i);
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
      // Un solde qui peut être négatif : la question dit avec quel signe le donner.
      if (champs.some((x) => x.attendu < 0)) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un/);
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
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
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
  expect(e.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, sa lecture à l'attendu et à la position voisine. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => d.produit(q) - d.cout(q) >= -1e-9;
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c2),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
    voisine: Object.fromEntries(e.lecture(cas, e.sens === "plus-grande" ? k.attendu + 1 : k.attendu - 1).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, defi: d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), lire, reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P6 · Analyse de la situation financière", "bts-cg"],
  ["DCG UE6 · Finance d'entreprise", "dcg"],
  ["BUT GACO · Participer au pilotage interne de l'organisation", "but-gaco"],
  ["BUT GEA · Évaluer l'activité de l'organisation", "but-gea"],
] as const;

describe("les soldes intermédiaires de gestion, à l'exercice de NOVA du monde du cours", () => {
  const ch = SOLDES_INTERMEDIAIRES;

  it("se jouent chez NOVA seule, au palier 4 de la comptabilité générale, avec leurs blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.code).toBe("soldes-intermediaires-de-gestion");
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(SITUATIONS).toContain(QUAND_LE_TAUX_MONTE);
  });

  it("la cascade, refaite à la main sur la fiche, retombe sur les repères de la clôture", () => {
    expect([PRODUCTION, CONSOMMATIONS, VA, EBE, RE, RF, RCAI, IS, RN, CAF]).toEqual([1_390_276, 1_136_242, 254_034, 126_234, 100_162.89, -194.93, 99_967.96, 20_742, 79_225.96, 105_297.07]);
    const s = CLOTURE_DE_LA_FICHE.soldes;
    expect([s.production, s.consommations, s.valeurAjoutee, s.excedentBrutDExploitation, s.resultatDExploitation, s.resultatFinancier, s.resultatCourantAvantImpot]).toEqual([PRODUCTION, CONSOMMATIONS, VA, EBE, RE, RF, RCAI]);
    expect([CLOTURE_DE_LA_FICHE.resultatNet, CLOTURE_DE_LA_FICHE.capaciteDAutofinancement]).toEqual([RN, CAF]);
    // Le compte de résultat de l'intro se termine sur le résultat net, compte par compte.
    const t = ch.etapes[0]!.tableau!(cas);
    const lignes = Object.fromEntries(t.lignes.map((l) => [l.libelle, l.valeurs]));
    expect(lignes["Ventes de produits finis"]).toEqual(["701", "1 390 276 €"]);
    expect(lignes["Variation du stock de composants"]).toEqual(["6031", "−13 500 €"]);
    expect(lignes["Revenus du compte à terme"]).toEqual(["764", "3 934,58 €"]);
    expect(lignes["Résultat net"]).toEqual(["", "79 225,96 €"]);
    expect(t.lignes.length).toBe(16);
  });

  it("les étapes guidées : production, consommations, valeur ajoutée, EBE", () => {
    expect(attendus(ch, "production-et-consommations")).toEqual({
      "Production de l'exercice": PRODUCTION,
      "Achats consommés de composants": ACHATS_CONSOMMES,
      "Consommations en provenance des tiers": CONSOMMATIONS,
    });
    expect(ACHATS_CONSOMMES).toBe(520_598);
    expect(attendus(ch, "valeur-ajoutee")).toEqual({ "Valeur ajoutée": VA, "Taux de valeur ajoutée (%)": c2((VA / PRODUCTION) * 100) });
    expect(c2((VA / PRODUCTION) * 100)).toBe(18.27);
    expect(attendus(ch, "ebe")).toEqual({ "Charges de personnel": PERSONNEL, "Excédent brut d'exploitation": EBE });
  });

  it("les étapes autonomes : jusqu'au résultat net, la CAF par les deux méthodes, le partage de la valeur ajoutée", () => {
    expect(attendus(ch, "jusqu-au-resultat")).toEqual({ "Résultat d'exploitation": RE, "Résultat financier": RF, "Résultat courant avant impôt": RCAI, "Résultat net": RN });
    const soustractive = c2(EBE + PLACEMENT - CHARGES_FINANCIERES - IS);
    expect(soustractive).toBe(CAF);
    expect(attendus(ch, "caf")).toEqual({ "Dotations à rajouter au résultat": DOTATIONS, "CAF, méthode additive": CAF, "CAF, méthode soustractive": soustractive });
    const part = (x: number) => c2((x / VA) * 100);
    expect(attendus(ch, "partage-de-la-valeur-ajoutee")).toEqual({
      "Part du personnel (%)": part(PERSONNEL),
      "Part des prêteurs (%)": part(CHARGES_FINANCIERES),
      "Part de l'État (%)": part(IS),
    });
    expect([part(PERSONNEL), part(CHARGES_FINANCIERES), part(IS)]).toEqual([50.31, 1.63, 8.17]);
  });

  it("le curseur de la ligne louée, refait à la main : louer coûte autant qu'acheter à 11 800 € par an, et l'EBE perd le loyer", () => {
    // L'achat coûte à l'exercice la dotation et ce que les 60 000 € auraient rapporté placés à 3 %.
    const equilibre = 60_000 / 6 + 60_000 * 0.03;
    expect(equilibre).toBe(11_800);
    const parAn = (x: number) => (x * JOURS) / 360;
    const loyer = c2(parAn(11_800));
    const loyerVoisin = c2(parAn(11_801));
    const placementGarde = c2(parAn(60_000 * 0.03));
    expect([loyer, placementGarde]).toEqual([11_636.11, 1_775]);
    const rcaiVoisin = c2(RCAI + DOTATION + placementGarde - loyerVoisin);
    const rnVoisin = c2(rcaiVoisin - impot(rcaiVoisin));
    expect(curseur(ch, "louer-la-ligne")).toEqual({
      attendu: equilibre,
      bornes: [6_000, 18_000],
      droites: [c2(parAn(equilibre)), c2(parAn(6_000)), c2(parAn(equilibre)), c2(parAn(18_000))],
      lecture: {
        "Loyer de l'exercice": loyer,
        "Excédent brut d'exploitation, ligne louée": c2(EBE - loyer),
        "Résultat courant avant impôt, ligne louée": RCAI,
        "Résultat courant avant impôt, ligne achetée": RCAI,
        "Capacité d'autofinancement, ligne louée": c2(RN + DOTATIONS - DOTATION),
      },
      voisine: {
        "Loyer de l'exercice": loyerVoisin,
        "Excédent brut d'exploitation, ligne louée": c2(EBE - loyerVoisin),
        "Résultat courant avant impôt, ligne louée": rcaiVoisin,
        "Résultat courant avant impôt, ligne achetée": RCAI,
        "Capacité d'autofinancement, ligne louée": c2(rnVoisin + DOTATIONS - DOTATION),
      },
    });
    expect([c2(EBE - loyer), c2(RN + DOTATIONS - DOTATION)]).toEqual([114_597.89, 95_435.96]);
    expect(juste(ch, "predire-la-location")).toBe("Plus bas : le loyer est une consommation, la dotation ne l'était pas");
  });

  it("le laboratoire de l'EBE : moins de résultat courant, le même EBE, plus de CAF", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-ebe");
    expect(l.depart).toEqual({ mode: 0, perte: 40, taux: 5, ligne: 0 });
    expect(l.solution).toEqual({ mode: 1, perte: 50, taux: 5, ligne: 0 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Excédent brut d'exploitation": EBE,
      "Résultat d'exploitation": RE,
      "Résultat courant avant impôt": RCAI,
      "Impôt sur les sociétés": IS,
      "Capacité d'autofinancement": CAF,
      "L'EBE, face au départ": 0,
      "Le résultat courant, face au départ": 0,
      "La CAF, face au départ": 0,
    });
    // Le dégressif (1,75 ÷ 6, douze mois) et 50 % de perte sur les 28 025 € hors taxes de Sonora.
    const dotations = (60_000 * 1.75) / 6 + 28_025 * 0.5 + PROVISION;
    const re = c2(EBE - dotations);
    const rcai = c2(re + RF);
    const is = impot(rcai);
    const caf = c2(rcai - is + dotations);
    expect(l.aLaSolution).toEqual({
      "Excédent brut d'exploitation": EBE,
      "Résultat d'exploitation": re,
      "Résultat courant avant impôt": rcai,
      "Impôt sur les sociétés": is,
      "Capacité d'autofinancement": caf,
      "L'EBE, face au départ": 0,
      "Le résultat courant, face au départ": c2(rcai - RCAI),
      "La CAF, face au départ": c2(caf - CAF),
    });
    expect([dotations, rcai, is, caf, c2(rcai - RCAI), c2(caf - CAF)]).toEqual([36_512.5, 89_526.57, 18_132, 107_907.07, -10_441.39, 2_610]);
    expect(c2(RCAI - rcai)).toBeGreaterThanOrEqual(BAISSE_DU_DEFI);
    // Le taux de l'emprunt baisse le résultat et la CAF ensemble ; la ligne louée baisse l'EBE.
    const a9 = l.lire({ ...l.depart, taux: 9 });
    const interets9 = (80_000 + 76_000 + 72_000) * (0.09 / 4) + c2(68_000 * (0.09 / 4) * (88 / 90));
    expect(a9["Le résultat courant, face au départ"]).toBe(c2(INTERETS - interets9));
    expect(a9["La CAF, face au départ"]).toBeLessThan(0);
    expect(l.defi.atteint({ ...l.depart, taux: 9 })).toBe(false);
    const louee = l.lire({ ...l.depart, ligne: 1 });
    expect(louee["L'EBE, face au départ"]).toBe(-11_636.11);
    expect(louee["Le résultat courant, face au départ"]).toBe(0);
    expect(l.defi.atteint({ ...l.depart, ligne: 1 })).toBe(false);
    // Le dégressif seul : la CAF monte de l'impôt économisé, comme le pari le dit.
    const rcaiD = c2(RE - ((60_000 * 1.75) / 6 - DOTATION) + RF);
    expect(rcaiD).toBe(92_329.07);
    expect(l.lire({ ...l.depart, mode: 1 })["La CAF, face au départ"]).toBe(IS - impot(rcaiD));
    expect(juste(ch, "predire-la-caf")).toBe("Monte, alors que le résultat baisse");
  });

  it("la variante des retraitements, refaite à la main : la même valeur ajoutée et le même EBE, une fois retraités", () => {
    expect(REDEVANCES_DE_CREDIT_BAIL).toBe(13_000);
    const interim = PERSONNEL / 4;
    expect(interim).toBe(31_950);
    const vaBrute = VA - interim - REDEVANCES_DE_CREDIT_BAIL;
    const ebeBrut = vaBrute - (PERSONNEL - interim);
    expect(attendus(ch, "les-retraitements")).toEqual({
      "Valeur ajoutée de la variante, sans retraitement": vaBrute,
      "EBE de la variante, sans retraitement": ebeBrut,
      "Valeur ajoutée retraitée": VA,
      "EBE retraité": EBE,
      "Charges financières retraitées": c2(CHARGES_FINANCIERES + REDEVANCES_DE_CREDIT_BAIL - DOTATION),
    });
    expect([vaBrute, ebeBrut, c2(CHARGES_FINANCIERES + REDEVANCES_DE_CREDIT_BAIL - DOTATION)]).toEqual([209_084, 113_234, 7_268.4]);
    expect(juste(ch, "pourquoi-retraiter")).toBe("Pour que la façon de tenir l'équipement et d'employer le personnel ne change ni la valeur ajoutée ni l'EBE");
  });

  it("l'étape d'expert : emprunter à 5 % pour placer à 3 %, et le jugement", () => {
    const produit = c2(80_000 * 0.03 * (JOURS / 360));
    const net = c2(INTERETS - produit);
    expect(attendus(ch, "emprunter-pour-placer")).toEqual({
      "Ce que l'emprunt a coûté sur l'exercice": INTERETS,
      "Ce que les mêmes fonds ont rapporté placés": produit,
      "Coût net avant impôt": net,
      "Coût net après impôt": c2(net * 0.75),
    });
    expect([INTERETS, produit, net, c2(net * 0.75)]).toEqual([3_681.11, 2_366.67, 1_314.44, 985.83]);
    expect(juste(ch, "garder-l-emprunt")).toBe("Sur le rendement, oui ; il ne se justifie que par la réserve qu'il garde pour la gamme à venir");
  });

  it("les verdicts : ce que mesure l'EBE, la CAF face à la trésorerie", () => {
    expect(juste(ch, "ce-que-mesure-l-ebe")).toMatch(/^Parce qu'il ne dépend ni de la façon dont l'entreprise est financée/);
    // Du 6 janvier, la ligne payée, au 31 décembre : le compte courant et le compte à terme.
    const debut = 150_000 + 80_000 - 72_000;
    const fin = 115_734.87 + 133_000;
    const e = ch.etapes.find((x) => x.id === "caf-et-tresorerie") as EtapeChoix;
    expect(e.question(cas, etatVide)).toContain(`${(158_000).toLocaleString("fr-FR")} €`);
    expect(e.question(cas, etatVide)).toContain(`${c2(fin - debut).toLocaleString("fr-FR")} €`);
    expect(juste(ch, "caf-et-tresorerie")).toBe("Parce que la CAF compte l'encaissable, pas l'encaissé, et ignore les 12 000 € d'emprunt remboursés et les écarts de délais");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : quand le taux de l'emprunt monte", () => {
  const s = QUAND_LE_TAUX_MONTE;
  const ch = SOLDES_INTERMEDIAIRES;
  /** Les intérêts de l'exercice à un taux : trois échéances sur 80 000, 76 000 et 72 000 €, et 88 jours courus sur 68 000 €. */
  const interetsA = (t: number) => c2((80_000 + 76_000 + 72_000) * (t / 4) + c2(68_000 * (t / 4) * (88 / 90)));
  const aTaux = (t: number) => {
    const rcai = c2(RCAI - (interetsA(t) - INTERETS));
    const is = impot(rcai);
    return { interets: interetsA(t), rcai, is, rn: c2(rcai - is), caf: c2(rcai - is + DOTATIONS) };
  };

  it("tient la forme d'un cas dédié", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La directrice financière");
    expect([HAUSSE_DU_TAUX, PERTE_DE_RESULTAT_TOLEREE]).toEqual([0.02, 2_000]);
  });

  it("les soldes de l'exercice, puis l'exercice au nouveau taux, l'impôt recalculé au barème", () => {
    expect(attendus(s, "les-soldes-de-l-annee")).toEqual({ "Valeur ajoutée": VA, "Excédent brut d'exploitation": EBE, "Résultat d'exploitation": RE, "Résultat courant avant impôt": RCAI });
    const a = aTaux(0.07);
    expect(attendus(s, "au-nouveau-taux")).toEqual({
      "Intérêts de l'emprunt au nouveau taux": a.interets,
      "Résultat courant avant impôt": a.rcai,
      "Impôt sur les sociétés": a.is,
      "Résultat net": a.rn,
      "Capacité d'autofinancement": a.caf,
    });
    expect(Object.values(a)).toEqual([5_153.56, 98_495.51, 20_374, 78_121.51, 104_192.62]);
    // Le résultat net ne perd que les trois quarts du surcoût, l'impôt arrondi à l'euro près.
    expect(c2(RN - a.rn)).toBe(1_104.45);
    expect(Math.abs(c2(RN - a.rn) - (a.interets - INTERETS) * 0.75)).toBeLessThan(0.5);
    const tri = s.etapes.find((e) => e.id === "ce-qui-bouge") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Production de l'exercice": [PRODUCTION, "reste"],
      "Valeur ajoutée": [VA, "reste"],
      "Excédent brut d'exploitation": [EBE, "reste"],
      "Résultat d'exploitation": [RE, "reste"],
      "Résultat courant avant impôt": [a.rcai, "bouge"],
      "Résultat net": [a.rn, "bouge"],
      "Capacité d'autofinancement": [a.caf, "bouge"],
    });
  });

  it("le curseur du taux et le taux limite à rebours, refaits à la main", () => {
    const parPoint = INTERETS / 5;
    const a8 = aTaux(0.08);
    const a9 = aTaux(0.09);
    expect(curseur(s, "jusqu-ou-le-taux")).toEqual({
      attendu: 8,
      bornes: [5, 12],
      droites: [2_000, 0, 2_000, c2(7 * parPoint * 0.75)],
      lecture: {
        "Intérêts de l'emprunt sur l'exercice": a8.interets,
        "Impôt sur les sociétés": a8.is,
        "Résultat net": a8.rn,
        "Perte de résultat net": c2(RN - a8.rn),
        "Excédent brut d'exploitation": EBE,
      },
      voisine: {
        "Intérêts de l'emprunt sur l'exercice": a9.interets,
        "Impôt sur les sociétés": a9.is,
        "Résultat net": a9.rn,
        "Perte de résultat net": c2(RN - a9.rn),
        "Excédent brut d'exploitation": EBE,
      },
    });
    expect([a8.interets, c2(RN - a8.rn), a9.interets, c2(RN - a9.rn)]).toEqual([5_889.78, 1_656.67, 6_626, 2_208.89]);
    // À rebours : 2 000 € de résultat net, c'est 2 000 ÷ 0,75 d'intérêts, soit des points à 736,22 € chacun.
    const hausse = 2_000 / 0.75;
    const points = hausse / parPoint;
    expect(attendus(s, "le-taux-limite")).toEqual({
      "Hausse d'intérêts qui coûte le seuil de résultat net": c2(hausse),
      "Hausse du taux supportable, en points": c2(points),
      "Taux le plus haut acceptable (%)": c2(5 + points),
    });
    expect([c2(hausse), c2(points), c2(5 + points)]).toEqual([2_666.67, 3.62, 8.62]);
  });

  it("le verdict : la hausse passe, sous le seuil de la directrice", () => {
    expect(tauxQuiMonte(cas).verdict).toBe("acceptable");
    expect(juste(s, "reponse")).toBe("Accepter : le résultat net perd 1 104,45 €, sous vos 2 000 €");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("l'export de compatibilité : soldesDeGestion redonne l'année figée de l'arène, dans chaque entreprise", () => {
  it.each(ENTREPRISES_DU_COURS)("%s", (code) => {
    const c = casDeLEntreprise(code);
    const s = soldesDeGestion(c);
    const externes = s.achats + s.autres + s.commissions + s.publicite + s.entretien + s.loyerEtFrais;
    expect(s.valeurAjoutee).toBeCloseTo(s.ventes + s.variation - externes, 1);
    expect(s.marchandises ? s.production : s.margeCommerciale).toBe(0);
    expect(Math.abs(s.ebe - s.ebeDeLArene)).toBeLessThan(1);
    expect(Math.abs(s.rcai - s.arene.resultatAvantImpot)).toBeLessThan(2);
    expect(s.cafAdditive).toBeCloseTo(s.cafSoustractive, 2);
    expect(s.cafAdditive).toBeCloseTo(s.resultatNet + s.dotation, 2);
    const tours = anneeJouee(code).partie.rounds;
    expect(s.tresorerie.debut).toBeCloseTo(tours[0]!.results["joueur"]!.cashFlow.opening, 1);
    expect(s.tresorerie.fin).toBeCloseTo(tours[tours.length - 1]!.results["joueur"]!.cashFlow.closing, 1);
  });

  it("chez NOVA, l'année figée de l'arène n'est pas l'exercice du monde du cours : le chapitre ne la lit plus", () => {
    expect(soldesDeGestion(cas).resultatNet).toBe(74_416.67);
    expect(RN).toBe(79_225.96);
    expect(f.code).toBe("nova");
  });
});
