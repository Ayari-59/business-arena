import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  L_IMPOT_SUR_LES_SOCIETES,
  MACHINE_DE_DECEMBRE,
  PART_DES_FONDATEURS_APRES_LE_FONDS,
  SOLDE_DE_N2_A_REBOURS,
  TAUX_EFFECTIF_VISE,
  impotDeNova,
} from "../../src/config/cours/chapitres/l-impot-sur-les-societes";
import {
  CREANCE_A_REBOURS,
  FACTEUR_DU_GRAND_ENTRETIEN,
  LE_DEFICIT_REPORTE,
  TRIMESTRES_PAR_EXERCICE,
  VARIANTE_DU_PLAFOND,
} from "../../src/config/cours/chapitres/le-deficit-reporte";
import {
  DEPENSE_DE_FIN_D_ANNEE,
  DEPENSE_DE_L_ANNEE_EN_PERTE,
  EXERCICES_DE_PIXEL,
  EXERCICE_N1_DE_NOVA,
  IMPOT_DE_NOVA_EN_N,
  IMPOT_DE_PIXEL_EN_N_MOINS_1,
  MAJORATION_DE_RETARD,
  PIXEL_ET_LE_TAUX_REDUIT,
  VOITURE_DU_GERANT,
} from "../../src/config/cours/monde/projets-et-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LA_DEPENSE_DE_FIN_D_ANNEE, depenseDeFinDAnnee } from "../../src/config/cours/situations/par-chapitre/la-depense-de-fin-d-annee";
import { LA_DEPENSE_DE_L_ANNEE_EN_PERTE, depenseDeLAnneeEnPerte } from "../../src/config/cours/situations/par-chapitre/la-depense-de-l-annee-en-perte";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * L'IMPÔT SUR LES SOCIÉTÉS (CHEZ NOVA) ET LE DÉFICIT REPORTÉ (CHEZ PIXEL & CO), DANS LE MONDE DU
 * COURS, ET LEURS CAS : LA DÉPENSE DE FIN D'ANNÉE, LA DÉPENSE DE L'ANNÉE EN PERTE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/projets-et-financement.ts),
 * sans les fonctions des chapitres ni le modèle (monde/finance.ts) : le barème (15 % jusqu'à
 * 42 500 €, 25 % au-delà), les acomptes au quart de l'impôt de N, le déficit imputé sur le bénéfice,
 * la créance au quart du déficit reporté en arrière. Les valeurs absolues sont épinglées, les
 * variantes (un fonds au capital, au-delà du million) et les calculs à rebours refaits comme le
 * reste, les curseurs (leur attendu, la position voisine, les droites aux bornes, la lecture), les
 * laboratoires (la lecture au départ et à la solution, des points de leurs courbes) et les verdicts
 * aussi. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const nova = casDeLEntreprise("nova");
const pixel = casDeLEntreprise("ecommerce");
const centime = (x: number) => Math.round(x * 100) / 100;
const enPct = (x: number) => Math.round(x * 10_000) / 100;
/** Le barème refait à la main : 15 % jusqu'à 42 500 €, 25 % au-delà, à l'euro ; rien sur une perte. */
const impotPme = (b: number) => (b <= 0 ? 0 : Math.round(b <= 42_500 ? b * 0.15 : 6_375 + (b - 42_500) * 0.25));
const impotNormal = (b: number) => (b <= 0 ? 0 : Math.round(b * 0.25));

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
      const g = e.graphique?.(c);
      return [
        e.titre,
        e.question(c),
        d.consigne,
        d.indice(depart),
        ...e.explication(c, d.solution),
        ...e.lecture(c, d.solution).map((l) => l.libelle),
        ...e.leviers(c).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((x) => x.libelle)]),
        ...(g?.courbes ?? []).map((x) => x.libelle),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "livré", "retourné"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre, cas: Cas) {
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])ne [aeiouyéèê]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −|−0 €/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|commandes?|heures?|trimestres?|exercices?|acomptes?|ans)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/l'arène rejoue|\bmoteur\b/i);
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
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(ch.etapes.map((e) => e.id)).size, ch.code).toBe(ch.etapes.length);
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre, cas: Cas) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(SITUATIONS).toContain(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.commanditaire).toBe("Le gérant");
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
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e?.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
  // L'attendu est bien la position que le sens désigne : la plus petite qui couvre, ou la plus grande.
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et ses courbes. */
function laboratoire(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e?.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  const g = e.graphique!(cas);
  const courbe = (libelle: string, p: Record<string, number>) => g.courbes.find((x) => x.libelle === libelle)!.valeur(p);
  return { depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint, levier: g.levier, courbes: g.courbes.map((x) => x.libelle), courbe };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P3 · Gestion des obligations fiscales", "bts-cg"],
  ["DCG UE4 · Droit fiscal", "dcg"],
  ["BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation", "but-gea"],
] as const;

describe("les deux chapitres et leurs cas, dans le monde du cours", () => {
  it("se jouent chez NOVA et chez PIXEL & CO, au palier 3 de la fiscalité, avec leurs blocs", () => {
    for (const ch of [L_IMPOT_SUR_LES_SOCIETES, LE_DEFICIT_REPORTE]) {
      expect(CHAPITRES).toContain(ch);
      expect(PROGRAMME.fiscalite[3]).toContain(ch.titre);
      expect(ch.parcours).toBe("fiscalite");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
      for (const [b, ref] of BLOCS) {
        expect(referentielDeCitation(b)?.code, b).toBe(ref);
        expect(blocOfficiel(b, ref), b).not.toBeNull();
      }
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("fin");
    }
    expect(L_IMPOT_SUR_LES_SOCIETES.entreprises!.codes).toEqual(["nova"]);
    expect(LE_DEFICIT_REPORTE.entreprises!.codes).toEqual(["ecommerce"]);
    expect(EXERCICE_N1_DE_NOVA.entreprise).toBe(nova.entreprise);
    expect(EXERCICES_DE_PIXEL[0]!.entreprise).toBe(pixel.entreprise);
  });

  it("les exports que d'autres fichiers lisent restent là (la mission « jouez », la valeur actuelle nette)", () => {
    expect(FACTEUR_DU_GRAND_ENTRETIEN).toBe(6);
    expect(TRIMESTRES_PAR_EXERCICE).toBe(4);
  });

  it("la synthèse finit sur la phrase de l'arène, et l'intro dit les hypothèses de la simulation", () => {
    for (const [ch, cas] of [
      [L_IMPOT_SUR_LES_SOCIETES, nova],
      [LE_DEFICIT_REPORTE, pixel],
    ] as const) {
      const fin = ch.etapes.at(-1)!;
      const intro = ch.etapes[0]!;
      if (fin.type !== "lecture" || intro.type !== "lecture") throw new Error(ch.code);
      expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
      expect(intro.texte(cas).join(" ")).toMatch(/simulation du cours/);
      expect(intro.texte(cas).join(" ")).toMatch(/Les hypothèses de la simulation/);
    }
  });
});

describe("l'impôt sur les sociétés de NOVA en N+1", () => {
  const ch = L_IMPOT_SUR_LES_SOCIETES;
  // La fiche, refaite à la main.
  const rc = EXERCICE_N1_DE_NOVA.resultatComptable;
  const comptable = VOITURE_DU_GERANT.prixTtc / VOITURE_DU_GERANT.dureeDAmortissement;
  const deductible = VOITURE_DU_GERANT.plafondDeDeduction / VOITURE_DU_GERANT.dureeDAmortissement;
  const rf = rc + (comptable - deductible) + MAJORATION_DE_RETARD;
  const reduit = 42_500 * 0.15;
  const normal = (rf - 42_500) * 0.25;
  const impot = reduit + normal;
  const acompte = IMPOT_DE_NOVA_EN_N / 4;

  it("la fiche donne les chiffres du monde", () => {
    expect([rc, comptable, deductible, comptable - deductible, rf]).toEqual([118_460, 7_200, 3_660, 3_540, 122_480]);
    expect([reduit, normal, impot]).toEqual([6_375, 19_995, 26_370]);
    expect([IMPOT_DE_NOVA_EN_N, acompte, impot - IMPOT_DE_NOVA_EN_N]).toEqual([20_742, 5_185.5, 5_628]);
    expect(impotNormal(rf) - impot).toBe(4_250);
  });

  it("les étapes guidées : le résultat fiscal", () => {
    expect(attendus(ch, "le-resultat-fiscal", nova)).toEqual({
      "Amortissement déductible de la voiture": deductible,
      "Amortissement à réintégrer": comptable - deductible,
      "Résultat fiscal": rf,
    });
    expect(juste(ch, "la-majoration", nova)).toBe("Je la réintègre : une pénalité ne se déduit pas");
  });

  it("les étapes autonomes : l'impôt, le taux effectif, les acomptes, le solde, la dette au bilan", () => {
    expect(attendus(ch, "l-impot-de-l-exercice", nova)).toEqual({
      "Impôt au taux réduit": reduit,
      "Impôt au taux normal": normal,
      "Impôt sur les sociétés": impot,
      "Taux effectif (%)": enPct(impot / rc),
    });
    expect(enPct(impot / rc)).toBe(22.26);
    expect(enPct(impot / rf)).toBe(21.53);
    expect(attendus(ch, "les-acomptes-et-le-solde", nova)).toEqual({
      "Chaque acompte de N+1": acompte,
      "Acomptes versés en N+1": 4 * acompte,
      "Solde du 15 mai N+2": impot - 4 * acompte,
    });
    expect(juste(ch, "les-conditions-du-taux-reduit", nova)).toBe("Non : son capital n'est pas détenu à 75 % par des personnes physiques");
    expect(PIXEL_ET_LE_TAUX_REDUIT.partDesPersonnesPhysiques).toBeLessThan(0.75);
    expect(juste(ch, "au-31-decembre", nova)).toBe("Une dette de 5 628 € envers l'État");
  });

  it("les paris : le taux effectif monte vers le taux normal, et il reste un solde", () => {
    expect(juste(ch, "predire-le-taux-effectif", nova)).toBe("Monte vers 25 %, sans jamais l'atteindre");
    expect(juste(ch, "predire-le-solde", nova)).toBe("Elle paiera un solde : les acomptes ont suivi l'impôt de N");
  });

  it("le curseur du taux effectif : l'impôt rejoint 20 % du bénéfice à 85 000 €", () => {
    // 6 375 + 25 % × (b − 42 500) = 20 % × b donne b = 4 250 ÷ 5 % = 85 000.
    expect(TAUX_EFFECTIF_VISE).toBe(0.2);
    const seuil = (42_500 * 10) / 5;
    expect(seuil).toBe(85_000);
    expect(curseur(ch, "le-taux-effectif-au-curseur", nova)).toEqual({
      attendu: seuil,
      bornes: [42_500, 200_000],
      droites: [42_500 * 0.2, 6_375, 200_000 * 0.2, 6_375 + 157_500 * 0.25],
      lecture: { "Impôt sur les sociétés": 17_000, "20 % du bénéfice": 17_000, "Économie du taux réduit": 4_250, "Marge sous 20 % du bénéfice": 0 },
    });
    // La position voisine : à 85 001 €, l'impôt (17 000,25 €) passe au-dessus de 20 % (17 000,20 €).
    expect(6_375 + (85_001 - 42_500) * 0.25).toBeGreaterThan(85_001 * 0.2);
    expect(impotPme(85_000) / 85_000).toBe(0.2);
  });

  it("le curseur du solde : les acomptes de N couvrent l'impôt jusqu'à 99 968 € de bénéfice", () => {
    const seuil = 42_500 + (20_742 - 6_375) / 0.25;
    expect(seuil).toBe(99_968);
    expect(curseur(ch, "le-solde-au-curseur", nova)).toEqual({
      attendu: seuil,
      bornes: [42_500, 200_000],
      droites: [20_742, 6_375, 20_742, 45_750],
      lecture: { "Impôt de l'exercice": 20_742, "Acomptes versés, sur l'impôt de N": 20_742, "Solde du 15 mai N+2": 0 },
    });
    expect(6_375 + (seuil + 1 - 42_500) * 0.25).toBe(20_742.25);
  });

  it("le laboratoire : un taux effectif sous 20 % avec un taux marginal de 25 %", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-impot", nova);
    expect(l.depart).toEqual({ resultat: rc, reintegrations: 4_020, bareme: 1 });
    expect(l.solution).toEqual({ resultat: 60_000, reintegrations: 4_020, bareme: 1 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (r: number, reint: number, pme: boolean) => {
      const b = r + reint;
      const i = pme ? impotPme(b) : impotNormal(b);
      return {
        "Résultat fiscal": b,
        "Impôt sur les sociétés": i,
        "Économie du taux réduit": pme ? impotNormal(b) - impotPme(b) : 0,
        "Résultat net": r - i,
        "Taux effectif, sur le résultat comptable": enPct(i / r),
        "Taux marginal": pme && b < 42_500 ? 15 : 25,
      };
    };
    expect(l.auDepart).toEqual(lire(rc, 4_020, true));
    expect(l.aLaSolution).toEqual(lire(60_000, 4_020, true));
    expect(Object.values(l.aLaSolution)).toEqual([64_020, 11_755, 4_250, 48_245, 19.59, 25]);
    // Le bord du défi : à 64 800 €, 12 955 € d'impôt (19,99 %) ; à 64 900 €, 20 % juste ; sous 42 500 € de bénéfice, le taux marginal tombe à 15 %.
    expect(l.atteint({ resultat: 64_800, reintegrations: 4_020, bareme: 1 })).toBe(true);
    expect(l.atteint({ resultat: 64_900, reintegrations: 4_020, bareme: 1 })).toBe(false);
    expect(l.atteint({ resultat: 38_460, reintegrations: 4_020, bareme: 1 })).toBe(false);
    expect(l.atteint({ resultat: 60_000, reintegrations: 4_020, bareme: 0 })).toBe(false);
    // Les courbes : le taux effectif monte et n'est pas une droite, le taux marginal est une marche.
    expect(l.levier).toBe("resultat");
    expect(l.courbes).toEqual(["Taux effectif", "Taux marginal"]);
    const p = (resultat: number, bareme = 1) => ({ resultat, reintegrations: 4_020, bareme });
    expect(l.courbe("Taux effectif", p(30_000))).toBe(enPct(Math.round(34_020 * 0.15) / 30_000));
    expect(l.courbe("Taux effectif", p(30_000))).toBe(17.01);
    expect(l.courbe("Taux effectif", p(118_460))).toBe(22.26);
    expect(l.courbe("Taux effectif", p(200_000))).toBe(enPct((6_375 + 161_520 * 0.25) / 200_000));
    expect(l.courbe("Taux effectif", p(200_000))).toBe(23.38);
    expect(l.courbe("Taux effectif", p(100_000, 0))).toBe(26.01);
    expect(l.courbe("Taux marginal", p(30_000))).toBe(15);
    expect(l.courbe("Taux marginal", p(38_480))).toBe(25);
    expect(l.courbe("Taux marginal", p(200_000))).toBe(25);
  });

  it("les étapes d'expert : un fonds au capital, le calcul à rebours de N+2, la critique", () => {
    expect(PART_DES_FONDATEURS_APRES_LE_FONDS).toBe(0.7);
    expect(attendus(ch, "sans-le-taux-reduit", nova)).toEqual({
      "Impôt sans le taux réduit": rf * 0.25,
      "Impôt en plus": rf * 0.25 - impot,
      "Taux effectif sans le taux réduit (%)": enPct((rf * 0.25) / rc),
    });
    expect([rf * 0.25, rf * 0.25 - impot, enPct((rf * 0.25) / rc)]).toEqual([30_620, 4_250, 25.85]);
    // N+2 : les acomptes au quart de l'impôt de N+1, l'État rend 1 870 € ; le barème remonté.
    expect(SOLDE_DE_N2_A_REBOURS).toBe(-1_870);
    const impotN2 = impot - 1_870;
    const rfN2 = 42_500 + (impotN2 - 6_375) / 0.25;
    expect(attendus(ch, "a-rebours", nova)).toEqual({ "Acomptes versés en N+2": impot, "Impôt de N+2": impotN2, "Résultat fiscal de N+2": rfN2 });
    expect([impotN2, rfN2]).toEqual([24_500, 115_000]);
    expect(impotPme(rfN2)).toBe(impotN2);
    expect(MACHINE_DE_DECEMBRE).toBe(20_000);
    expect(juste(ch, "la-depense-de-decembre", nova)).toBe("Une charge inutile coûte 75 % de son montant : l'impôt n'en paie qu'un quart");
    // La synthèse reprend les chiffres.
    const t = ch.etapes.find((e) => e.id === "fin")!.tableau!(nova);
    expect(t.lignes.find((l) => l.libelle === "Solde du 15 mai N+2")!.valeurs).toEqual(["5 628 €"]);
    expect(impotDeNova(nova).tauxMarginal).toBe(25);
  });

  it("le cas : la dépense de décembre ne fait économiser que le taux marginal", () => {
    const s = LA_DEPENSE_DE_FIN_D_ANNEE;
    casDedie(s, ch, nova);
    expect(DEPENSE_DE_FIN_D_ANNEE).toBe(4_800);
    const avec = rf - 4_800;
    expect(attendus(s, "economie", nova)).toEqual({
      "Résultat fiscal avec la dépense": avec,
      "Impôt avec la dépense": 6_375 + (avec - 42_500) * 0.25,
      "Impôt économisé": 4_800 * 0.25,
      "Coût de la dépense après impôt": 4_800 * 0.75,
    });
    expect([avec, 6_375 + (avec - 42_500) * 0.25]).toEqual([117_680, 25_170]);
    // Le curseur du cas : la plus petite dépense d où 6 375 + 25 % × (79 980 − d) ≤ 20 742.
    const d = (impot - 20_742) / 0.25;
    expect(d).toBe(22_512);
    expect(curseur(s, "le-solde-au-curseur", nova)).toEqual({
      attendu: d,
      bornes: [0, 40_000],
      droites: [20_742, impot, 20_742, 6_375 + (79_980 - 40_000) * 0.25],
      lecture: { "Impôt avec la dépense": 20_742, "Solde du 15 mai": 0, "Impôt économisé": 5_628, "Résultat net en moins": d * 0.75 },
    });
    expect(attendus(s, "a-rebours", nova)).toEqual({ "Dépense qui annule le solde": d, "Impôt économisé par cette dépense": 5_628, "Baisse du résultat net": d - 5_628 });
    expect(d - 5_628).toBe(16_884);
    expect(depenseDeFinDAnnee(nova).verdict).toBe("le-taux-marginal");
    expect(juste(s, "reponse", nova)).toBe("Seulement si l'entretien sert : il coûte 3 600 € après impôt");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch, nova));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LA_DEPENSE_DE_FIN_D_ANNEE, nova));
});

describe("le déficit reporté de PIXEL & CO", () => {
  const ch = LE_DEFICIT_REPORTE;
  // La fiche, refaite à la main.
  const [nm1, n, n1, n2] = EXERCICES_DE_PIXEL;
  const rf = [nm1!.resultatComptable, n!.resultatComptable + 3_000 + 1_400, n1!.resultatComptable - 3_000, n2!.resultatComptable];
  const deficit = -rf[1]!;

  it("la fiche donne les chiffres du monde", () => {
    expect(rf).toEqual([36_000, -60_000, 27_000, 48_000]);
    expect(IMPOT_DE_PIXEL_EN_N_MOINS_1).toBe(36_000 * 0.25);
    expect(PIXEL_ET_LE_TAUX_REDUIT.partDesPersonnesPhysiques).toBe(0.4);
  });

  it("les étapes guidées : le déficit de N, ses acomptes rendus, sur quoi il s'impute", () => {
    expect(attendus(ch, "le-deficit-de-n", pixel)).toEqual({
      "Résultat fiscal de N": rf[1],
      "Impôt de N": 0,
      "Chaque acompte versé en N": 9_000 / 4,
      "Excédent rendu en mai N+1": 9_000,
    });
    expect(juste(ch, "sur-quoi-s-impute", pixel)).toBe("Sur le bénéfice des exercices suivants, avant le calcul de l'impôt");
    expect(juste(ch, "predire-l-impot-evite", pixel)).toBe("25 % de son montant, 15 000 € d'impôt");
  });

  it("le curseur de la perte : N+1 et N+2 absorbent 75 000 € de déficit", () => {
    const absorbable = rf[2]! + rf[3]!;
    expect(absorbable).toBe(75_000);
    expect(curseur(ch, "la-perte-au-curseur", pixel)).toEqual({
      attendu: absorbable,
      bornes: [0, 150_000],
      droites: [absorbable, 0, absorbable, 150_000],
      lecture: { "Déficit imputé sur N+1 et N+2": 75_000, "Déficit qui attend encore après N+2": 0, "Impôt de N+1 et N+2": 0, "Impôt évité par le report": absorbable * 0.25 },
    });
    // À la position voisine, 1 € de déficit attend encore après N+2.
    expect(absorbable + 1 - absorbable).toBe(1);
  });

  it("les étapes autonomes : le report en avant et l'impôt évité", () => {
    const restant = deficit - rf[2]!;
    expect(attendus(ch, "le-report-en-avant", pixel)).toEqual({
      "Déficit imputé sur N+1": rf[2],
      "Déficit qui reste après N+1": restant,
      "Bénéfice imposable de N+2": rf[3]! - restant,
      "Impôt de N+2": (rf[3]! - restant) * 0.25,
    });
    expect([restant, rf[3]! - restant, (rf[3]! - restant) * 0.25]).toEqual([33_000, 15_000, 3_750]);
    const sans = (rf[2]! + rf[3]!) * 0.25;
    expect(attendus(ch, "l-impot-evite", pixel)).toEqual({
      "Impôt de N+1 et N+2 sans déficit": sans,
      "Impôt évité par le report": sans - 3_750,
      "Taux effectif de N+2 (%)": enPct(3_750 / 48_000),
    });
    expect([sans, sans - 3_750, enPct(3_750 / 48_000)]).toEqual([18_750, deficit * 0.25, 7.81]);
  });

  it("le report en arrière : 36 000 € sur N−1, une créance de 9 000 €, le même impôt en tout", () => {
    expect(juste(ch, "predire-le-report-en-arriere", pixel)).toBe("Autant d'impôt en tout, mais avec une créance dès la clôture de N");
    const arriere = Math.min(deficit, rf[0]!, 1_000_000);
    const creance = arriere * 0.25;
    const enAvant = deficit - arriere;
    // N+1 : (27 000 − 24 000) × 25 % = 750, payés par la créance ; N+2 : 12 000 − (9 000 − 750).
    const payeN2 = rf[3]! * 0.25 - (creance - (rf[2]! - enAvant) * 0.25);
    expect(attendus(ch, "le-report-en-arriere", pixel)).toEqual({
      "Déficit reporté en arrière": arriere,
      "Créance sur l'État": creance,
      "Déficit reporté en avant": enAvant,
      "Impôt payé en N+2": payeN2,
    });
    expect([arriere, creance, enAvant, payeN2]).toEqual([36_000, 9_000, 24_000, 3_750]);
    const t = ch.etapes.find((e) => e.id === "fin")!.tableau!(pixel);
    expect(t.lignes.find((l) => l.libelle === "Impôt net, de N−1 à N+2")!.valeurs).toEqual(["12 750 €", "12 750 €"]);
    expect(t.lignes.find((l) => l.libelle === "Déficit imputé sur N+1")!.valeurs).toEqual(["27 000 €", "24 000 €"]);
  });

  it("le laboratoire : le report en arrière fait éviter plus quand N+1 et N+2 n'absorbent plus le déficit", () => {
    const l = laboratoire(ch, "le-laboratoire-du-deficit", pixel);
    expect(l.depart).toEqual({ perte: 60_000, resultatDeN2: 48_000, option: 0 });
    expect(l.solution).toEqual({ perte: 100_000, resultatDeN2: 48_000, option: 1 });
    expect(l.reussi).toEqual([false, true]);
    /** La suite refaite à la main, de N−1 à N+2, pour une perte, un résultat de N+2 et l'option. */
    const lire = (perte: number, r2: number, arriere: boolean) => {
      const reporte = arriere ? Math.min(perte, 36_000) : 0;
      const creance = reporte * 0.25;
      let d = perte - reporte;
      const i1 = Math.max(0, 27_000 - d) * 0.25;
      d = Math.max(0, d - 27_000);
      const i2 = Math.max(0, r2 - d) * 0.25;
      d = Math.max(0, d - r2);
      const utilise1 = Math.min(creance, i1);
      const utilise2 = Math.min(creance - utilise1, i2);
      const sans = 9_000 + 27_000 * 0.25 + r2 * 0.25;
      const net = 9_000 + i1 + i2 - creance;
      return {
        "Créance sur l'État, née en N": creance,
        "Impôt payé en N+1": i1 - utilise1,
        "Impôt payé en N+2": i2 - utilise2,
        "Déficit qui attend encore après N+2": d,
        "Créance qui reste après N+2": creance - utilise1 - utilise2,
        "Impôt évité, de N−1 à N+2": sans - net,
      };
    };
    expect(l.auDepart).toEqual(lire(60_000, 48_000, false));
    expect(l.aLaSolution).toEqual(lire(100_000, 48_000, true));
    expect(Object.values(l.aLaSolution)).toEqual([9_000, 0, 0, 0, 6_250, 25_000]);
    expect(lire(100_000, 48_000, false)["Impôt évité, de N−1 à N+2"]).toBe(18_750);
    // Tant que N+1 et N+2 absorbent le déficit, les deux reports font éviter autant.
    expect(l.atteint({ perte: 60_000, resultatDeN2: 48_000, option: 1 })).toBe(false);
    expect(l.atteint({ perte: 60_000, resultatDeN2: 20_000, option: 1 })).toBe(true);
    expect(l.atteint({ perte: 100_000, resultatDeN2: 48_000, option: 0 })).toBe(false);
    // Les courbes, selon la perte : 25 % de la perte jusqu'à 75 000 € (en avant) ou 111 000 € (en arrière), puis un plateau ; la créance plafonne à 9 000 €.
    expect(l.levier).toBe("perte");
    const p = (perte: number) => ({ perte, resultatDeN2: 48_000, option: 0 });
    const avant = (x: number) => l.courbe("Impôt évité, report en avant", p(x));
    const arr = (x: number) => l.courbe("Impôt évité, report en arrière", p(x));
    const creance = (x: number) => l.courbe("Créance née en N", p(x));
    expect([avant(10_000), avant(75_000), avant(150_000)]).toEqual([2_500, 18_750, 18_750]);
    expect([arr(10_000), arr(100_000), arr(111_000), arr(150_000)]).toEqual([2_500, 25_000, 27_750, 27_750]);
    expect([creance(10_000), creance(36_000), creance(150_000)]).toEqual([2_500, 9_000, 9_000]);
    expect(arr(60_000)).toBe(avant(60_000));
  });

  it("les étapes d'expert : le choix, la créance à rebours, le plafond au-delà du million", () => {
    expect(juste(ch, "le-choix-entre-les-deux", pixel)).toBe("L'option : une créance de 9 000 € dès N, sûre même sans bénéfice");
    expect(CREANCE_A_REBOURS).toBe(6_000);
    const reporte = 6_000 / 0.25;
    expect(attendus(ch, "a-rebours", pixel)).toEqual({ "Déficit reporté en arrière": reporte, "Bénéfice de N−1 distribué": rf[0]! - reporte, "Déficit reporté en avant": deficit - reporte });
    expect([reporte, rf[0]! - reporte, deficit - reporte]).toEqual([24_000, 12_000, 36_000]);
    expect(VARIANTE_DU_PLAFOND).toEqual({ deficit: 2_000_000, benefice: 1_600_000 });
    const plafond = 1_000_000 + 0.5 * (1_600_000 - 1_000_000);
    expect(attendus(ch, "le-plafond", pixel)).toEqual({
      "Déficit imputable cette année": plafond,
      "Bénéfice imposable": 1_600_000 - plafond,
      "Impôt de l'exercice": (1_600_000 - plafond) * 0.25,
      "Déficit qui reste à reporter": 2_000_000 - plafond,
    });
    expect([plafond, 1_600_000 - plafond, (1_600_000 - plafond) * 0.25, 2_000_000 - plafond]).toEqual([1_300_000, 300_000, 75_000, 700_000]);
  });

  it("le cas : faite cette année ou repoussée, la révision fait économiser 1 250 € en N+2", () => {
    const s = LA_DEPENSE_DE_L_ANNEE_EN_PERTE;
    casDedie(s, ch, pixel);
    expect(DEPENSE_DE_L_ANNEE_EN_PERTE).toBe(5_000);
    const avec = deficit + 5_000;
    const restant = avec - rf[2]!;
    expect(attendus(s, "faite-en-n", pixel)).toEqual({
      "Déficit de N avec la révision": avec,
      "Déficit qui reste après N+1": restant,
      "Impôt de N+2": (rf[3]! - restant) * 0.25,
      "Impôt économisé": 3_750 - (rf[3]! - restant) * 0.25,
    });
    expect([avec, restant, (rf[3]! - restant) * 0.25, 5_000 * 0.25]).toEqual([65_000, 38_000, 2_500, 1_250]);
    const rf1 = rf[2]! - 5_000;
    expect(attendus(s, "faite-en-n1", pixel)).toEqual({
      "Bénéfice fiscal de N+1 avec la révision": rf1,
      "Impôt de N+1": 0,
      "Impôt de N+2 avec la révision en N+1": (rf[3]! - (deficit - rf1)) * 0.25,
      "Créance de report en arrière, la révision faite en N": Math.min(avec, rf[0]!) * 0.25,
    });
    expect([(rf[3]! - (deficit - rf1)) * 0.25, Math.min(avec, rf[0]!) * 0.25]).toEqual([2_500, 9_000]);
    // Le curseur du cas : la plus grande dépense d où 60 000 + d ≤ 75 000.
    expect(curseur(s, "le-deficit-au-curseur", pixel)).toEqual({
      attendu: 15_000,
      bornes: [0, 30_000],
      droites: [75_000, 60_000, 75_000, 90_000],
      lecture: { "Déficit de N": 75_000, "Déficit qui attend encore après N+2": 0, "Impôt de N+2": 0, "Impôt économisé d'ici N+2": 3_750 },
    });
    expect(depenseDeLAnneeEnPerte(pixel).verdict).toBe("attendre-ne-gagne-rien");
    expect(juste(s, "reponse", pixel)).toBe("Attendre ne fait rien gagner : 1 250 € d'impôt en moins en N+2 dans les deux cas");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch, pixel));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LA_DEPENSE_DE_L_ANNEE_EN_PERTE, pixel));
});
