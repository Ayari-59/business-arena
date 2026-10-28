import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DEMANDE_DU_CURSEUR,
  PREVOIR_LES_VENTES,
  RANGS_DU_CURSEUR,
  SEUIL_DE_LA_DEUXIEME_BOUTIQUE,
  previsionDesVentes,
} from "../../src/config/cours/chapitres/prevoir-les-ventes";
import { MAILLE_ET_CO } from "../../src/config/cours/monde/maille-et-co";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { PREVOIR_LE_TRIMESTRE_CREUX, SEUIL_DU_RENFORT, trimestreCreux } from "../../src/config/cours/situations/par-chapitre/prevoir-le-trimestre-creux";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * PRÉVOIR LES VENTES, À LA BOUTIQUE DU MONDE DU COURS, ET SON CAS : PRÉVOIR LE TRIMESTRE CREUX.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la boutique (monde/maille-et-co.ts),
 * sans les fonctions du chapitre ni le modèle (monde/boutique.ts) : les moyennes mobiles centrées, la
 * droite des moindres carrés, les rapports à la tendance, les coefficients corrigés, la prévision, la
 * droite des trimestres bruts, la droite des totaux annuels et la série des ventes. Les valeurs absolues
 * sont épinglées, les curseurs (attendu, position voisine, droites aux bornes, lecture), le laboratoire
 * (départ, solution, courbes du graphique) et les verdicts aussi. Puis les gardes de texte de l'étalon.
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("boutique");
const f = MAILLE_ET_CO;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─── La méthode, refaite à la main sur la fiche ──────────────────────────────

const demande = f.historique.map((h) => h.demande);
const ventes = f.historique.map((h) => h.ventes);
/** La moyenne mobile centrée du rang t (de 3 à 10), sur une série de 12 trimestres. */
const mmc = (s: readonly number[], t: number) => (s[t - 3]! / 2 + s[t - 2]! + s[t - 1]! + s[t]! + s[t + 1]! / 2) / 4;
/** Les moindres carrés, par leurs sommes. */
function droite(points: readonly (readonly [number, number])[]) {
  const xm = somme(points.map(([x]) => x)) / points.length;
  const ym = somme(points.map(([, y]) => y)) / points.length;
  const sxx = somme(points.map(([x]) => (x - xm) ** 2));
  const sxy = somme(points.map(([x, y]) => (x - xm) * (y - ym)));
  const a = sxy / sxx;
  return { xm, ym, sxx, sxy, a, b: ym - a * xm, en: (x: number) => a * x + ym - a * xm };
}
/** La méthode du rapport à la tendance : coefficients bruts, corrigés, et prévision de N. */
function methode(s: readonly number[], surLesBruts: boolean) {
  const d = droite(surLesBruts ? s.map((y, i) => [i + 1, y] as const) : [3, 4, 5, 6, 7, 8, 9, 10].map((t) => [t, mmc(s, t)] as const));
  const bruts = [1, 2, 3, 4].map((q) => (s[q - 1]! / d.en(q) + s[q + 3]! / d.en(q + 4) + s[q + 7]! / d.en(q + 8)) / 3);
  const k = 4 / somme(bruts);
  const coefficients = bruts.map((c) => c * k);
  const prevision = (t: number) => d.en(t) * coefficients[(t - 1) % 4]!;
  return { d, bruts, sommeBrute: somme(bruts), coefficients, prevision, annee: somme([13, 14, 15, 16].map(prevision)) };
}
const m = methode(demande, false);
const brute = methode(demande, true);
const surLesVentes = methode(ventes, false);
const prixMoyen = centime(somme(f.gamme.map((r) => r.ventesDuMois * r.prixHt)) / somme(f.gamme.map((r) => r.ventesDuMois)));

// ─── Les aides des gardes, celles de l'étalon ────────────────────────────────

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

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (articles?|trimestres?|rangs?|points?|pulls?|jours?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(de|du) le\b/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(new RegExp(`\\bun ${u}\\b`, "i"));
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
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
  const k = e.cible(cas);
  const d = e.droites(cas);
  const min = k.min ?? 0;
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─── Les gardes ──────────────────────────────────────────────────────────────

describe("prévoir les ventes, à la boutique du monde du cours", () => {
  const ch = PREVOIR_LES_VENTES;

  it("se joue chez MAILLE & CO seule, au palier 3 du BTS MCO, avec son bloc ; la synthèse finit sur l'arène", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(PREVOIR_LE_TRIMESTRE_CREUX);
    expect([ch.parcours, ch.palier]).toEqual(["mco", 3]);
    expect(ch.entreprises?.codes).toEqual(["boutique"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"]);
    expect(referentielDeCitation(ch.blocs[0]!)?.code).toBe("bts-mco");
    expect(blocOfficiel(ch.blocs[0]!, "bts-mco")).not.toBeNull();
    expect(f.entreprise).toBe(cas.entreprise);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    const fin = (ch.etapes.at(-1) as Extract<Etape, { type: "lecture" }>).texte(cas).at(-1);
    expect(fin).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    // Les hypothèses de la simulation sont dites dès l'intro.
    const intro = (ch.etapes[0] as Extract<Etape, { type: "lecture" }>).texte(cas).join(" ");
    expect(intro).toMatch(/simulation du cours/);
    expect(intro).toMatch(/La simulation suppose/);
  });

  it("la fiche donne les chiffres de la consigne : moyennes mobiles, droite, coefficients, prévision", () => {
    expect([mmc(demande, 3), mmc(demande, 4), mmc(demande, 10)]).toEqual([6_158.5, 6_216.875, 6_883.875]);
    expect([m.d.xm, m.d.sxx, centime(m.d.sxy), centime(m.d.ym)]).toEqual([6.5, 42, 4_500.31, 6_497.36]);
    expect([centime(m.d.a), centime(m.d.b)]).toEqual([107.15, 5_800.88]);
    expect(m.coefficients.map(centime)).toEqual([0.7, 0.46, 0.8, 2.04]);
    expect(somme(m.coefficients)).toBeCloseTo(4, 12);
    expect([13, 14, 15, 16].map((t) => Math.round(m.prevision(t)))).toEqual([5_067, 3_354, 5_925, 15_305]);
    expect(Math.round(m.annee)).toBe(29_651);
    // Le budget du trimestre 1 reprend la prévision, à la dizaine.
    expect(somme(Object.values(f.budget.ventesPrevues))).toBe(Math.round(m.prevision(13) / 10) * 10);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "les-moyennes-mobiles")).toEqual({
      "Moyenne mobile centrée du rang 3": 6_158.5,
      "Moyenne mobile centrée du rang 4": centime(mmc(demande, 4)),
      "Moyenne mobile centrée du rang 10": centime(mmc(demande, 10)),
    });
    expect(attendus(ch, "la-droite")).toEqual({ "Rang moyen x̄": 6.5, "Moyenne des moyennes mobiles ȳ": 6_497.36, "Pente a": 107.15, "Ordonnée à l'origine b": 5_800.88 });
    expect(attendus(ch, "les-coefficients-corriges")).toEqual({
      "Coefficient corrigé du trimestre 1": 0.7,
      "Coefficient corrigé du trimestre 2": 0.46,
      "Coefficient corrigé du trimestre 3": 0.8,
      "Coefficient corrigé du trimestre 4": 2.04,
    });
    expect(centime(m.sommeBrute * 10_000) / 10_000).toBeCloseTo(4.0027, 4);
  });

  it("les étapes autonomes : les rapports du trimestre 4, la prévision de N", () => {
    const rapport = (t: number) => demande[t - 1]! / m.d.en(t);
    expect(attendus(ch, "les-rapports-a-la-tendance")).toEqual({
      "Rapport du trimestre 4 de N − 3": centime(rapport(4)),
      "Rapport du trimestre 4 de N − 2": centime(rapport(8)),
      "Rapport du trimestre 4 de N − 1": centime(rapport(12)),
      "Coefficient saisonnier brut du trimestre 4": centime(m.bruts[3]!),
    });
    expect([rapport(4), rapport(8), rapport(12), m.bruts[3]!].map(centime)).toEqual([2.03, 2.05, 2.04, 2.04]);
    expect(attendus(ch, "la-prevision")).toEqual({
      "Tendance du trimestre 1 de N": centime(m.d.en(13)),
      "Prévision du trimestre 1 de N": Math.round(m.prevision(13)),
      "Prévision du trimestre 4 de N": Math.round(m.prevision(16)),
      "Prévision de l'année N": Math.round(m.annee),
    });
    expect(centime(m.d.en(13))).toBe(7_193.84);
  });

  it("les étapes d'expert : le seuil à rebours, janvier corrigé de la saison", () => {
    expect(SEUIL_DE_LA_DEUXIEME_BOUTIQUE).toBe(8_000);
    const rang = (8_000 - m.d.b) / m.d.a;
    expect(attendus(ch, "a-rebours")).toEqual({ "Rang où la tendance atteint le seuil": centime(rang), "Premier rang entier au-delà du seuil": 21, "Tendance de ce rang": centime(m.d.en(21)) });
    expect([centime(rang), centime(m.d.en(21))]).toEqual([20.52, 8_051.04]);
    // Janvier : la demande des 5 références, au rythme du trimestre (3 mois égaux).
    const janvier = somme(f.gamme.map((r) => r.demandeDuMois));
    expect(janvier).toBe(600 + 384 + 90 + 330 + 150);
    expect(attendus(ch, "le-mois-de-janvier")).toEqual({
      "Demande du trimestre au rythme de janvier": 3 * janvier,
      "Écart à la prévision du trimestre (%)": centime(((3 * janvier - m.prevision(13)) / m.prevision(13)) * 100),
      "Demande corrigée des variations saisonnières": centime((3 * janvier) / m.coefficients[0]!),
    });
    expect([3 * janvier, centime(((3 * janvier - m.prevision(13)) / m.prevision(13)) * 100), centime((3 * janvier) / m.coefficients[0]!)]).toEqual([4_662, -8, 6_618.49]);
  });

  it("la critique des trimestres bruts : la pente monte à 405, les rapports du trimestre 4 dérivent", () => {
    expect([brute.d.sxx, brute.d.sxy, centime(brute.d.ym), centime(brute.d.a)]).toEqual([143, 57_968, 6_559.67, 405.37]);
    const rapport = (t: number) => demande[t - 1]! / brute.d.en(t);
    expect(attendus(ch, "la-critique")).toEqual({
      "Pente de la droite des trimestres bruts": 405.37,
      "Rapport du trimestre 4 de N − 3 à la tendance brute": centime(rapport(4)),
      "Rapport du trimestre 4 de N − 1 à la tendance brute": centime(rapport(12)),
    });
    expect([centime(rapport(4)), centime(rapport(12))]).toEqual([2.28, 1.64]);
    expect(Math.round(brute.prevision(16))).toBe(20_190);
    expect(Math.round(brute.annee)).toBe(39_979);
  });

  it("la variante des totaux annuels rejoint la méthode, à 17 articles près", () => {
    const totaux = [0, 1, 2].map((k) => somme(demande.slice(4 * k, 4 * k + 4)));
    expect(totaux).toEqual([24_537, 26_247, 27_932]);
    const d = droite(totaux.map((y, i) => [i + 1, y] as const));
    const k4 = somme([0, 1, 2].map((k) => demande[4 * k + 3]! / (totaux[k]! / 4))) / 3;
    expect(attendus(ch, "une-autre-methode")).toEqual({
      "Pente annuelle": 1_697.5,
      "Demande prévue pour l'année N": centime(d.en(4)),
      "Prévision du trimestre 4 de N par cette méthode": centime((d.en(4) / 4) * k4),
    });
    expect([centime(d.en(4)), centime((d.en(4) / 4) * k4)]).toEqual([29_633.67, 15_323.78]);
    expect(Math.round(m.annee - d.en(4))).toBe(17);
  });

  it("les verdicts sont épinglés", () => {
    expect(juste(ch, "quelle-serie")).toBe("Sur la demande : les ventes du trimestre fort ont été plafonnées");
    expect(juste(ch, "predire-la-pente")).toBe("107,15 articles par trimestre, saison retirée");
    expect(juste(ch, "predire-la-saison")).toBe("Environ 5 067 : la tendance × le coefficient");
    expect(juste(ch, "ce-que-dit-janvier")).toBe("La demande est en retard : la saison n'y est pour rien, la prévision la contient déjà");
    expect(juste(ch, "predire-les-trimestres-bruts")).toBe("Plus forte : chaque année finit sur le trimestre de Noël");
    expect(juste(ch, "pourquoi-la-droite-brute-trompe")).toBe("Le trimestre 4 tombe toujours en fin d'année : la droite prend la saison pour de la croissance");
  });

  it("le curseur de la tendance, refait à la main : le seuil d'une deuxième boutique au rang 21", () => {
    expect(RANGS_DU_CURSEUR).toEqual({ min: 13, max: 32 });
    expect(prixMoyen).toBe(57.16);
    expect(curseur(ch, "la-tendance-au-curseur")).toEqual({
      attendu: 21,
      bornes: [13, 32],
      droites: [centime(m.d.en(13)), 8_000, centime(m.d.en(32)), 8_000],
      lecture: {
        "Chiffre d'affaires de la tendance du trimestre": centime(m.d.en(21) * prixMoyen),
        "Chiffre d'affaires du seuil": 8_000 * prixMoyen,
        "Ce que la tendance a gagné depuis le rang 12": centime(9 * m.d.a * prixMoyen),
        "Tendance moins seuil": centime((m.d.en(21) - 8_000) * prixMoyen),
      },
    });
    // La position voisine : au rang 20, la tendance n'atteint pas le seuil.
    expect(m.d.en(20)).toBeLessThan(8_000);
  });

  it("le curseur de la saison, refait à la main : 5 068 articles tiennent la tendance du trimestre 1", () => {
    expect(DEMANDE_DU_CURSEUR).toEqual({ min: 4_000, max: 6_500 });
    const c1 = m.coefficients[0]!;
    const t13 = m.d.en(13);
    const q = Math.ceil(t13 * c1);
    expect(q).toBe(5_068);
    expect((q - 1) / c1).toBeLessThan(t13);
    expect(curseur(ch, "la-saison-au-curseur")).toEqual({
      attendu: q,
      bornes: [4_000, 6_500],
      droites: [centime(4_000 / c1), centime(t13), centime(6_500 / c1), centime(t13)],
      lecture: {
        "Chiffre d'affaires du trimestre": centime(q * prixMoyen),
        "Le même, corrigé des variations saisonnières": centime((q / c1) * prixMoyen),
        "Chiffre d'affaires de la tendance": centime(t13 * prixMoyen),
        "Corrigé moins tendance": centime((q / c1 - t13) * prixMoyen),
      },
    });
  });

  it("le laboratoire de la méthode : la prévision du consultant vient des trimestres bruts", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-methode");
    expect(l.depart).toEqual({ rang: 12, methode: 1, serie: 1 });
    expect(l.solution).toEqual({ rang: 16, methode: 2, serie: 1 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (x: ReturnType<typeof methode>, t: number) => ({
      "Pente de la droite": centime(x.d.a),
      "Tendance du trimestre lu": Math.round(x.d.en(t)),
      "Coefficient saisonnier du trimestre lu": centime(x.coefficients[(t - 1) % 4]!),
      "Modèle au trimestre lu (tendance × coefficient)": Math.round(x.prevision(t)),
      "Prévision du trimestre 4 de N": Math.round(x.prevision(16)),
      "Prévision de l'année N": Math.round(x.annee),
    });
    expect(l.auDepart).toEqual(lire(m, 12));
    expect(l.aLaSolution).toEqual(lire(brute, 16));
    expect(Object.values(l.aLaSolution)).toEqual([405.37, 10_411, 1.94, 20_190, 20_190, 39_979]);
    // Aucune autre série ni méthode ne donne le chiffre du consultant, et il faut le lire au rang 16.
    expect([1, 2].flatMap((methode) => [1, 2].map((serie) => l.atteint({ rang: 16, methode, serie })))).toEqual([false, false, true, false]);
    expect(l.atteint({ rang: 15, methode: 2, serie: 1 })).toBe(false);
    // Sur la série des ventes, la méthode reconduit la réserve trop petite.
    expect(Math.round(surLesVentes.prevision(16))).toBe(13_252);
  });

  it("le graphique du laboratoire : la série puis sa prévision, la droite, le modèle, en quelques points", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-methode");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("rang");
    const [serie, ligne, modele] = g.courbes;
    const a = (c: typeof serie, rang: number, methode = 1, s = 1) => c!.valeur({ rang, methode, serie: s });
    // La série observée, reliée trimestre à trimestre, puis la prévision.
    expect([a(serie, 1), a(serie, 1.5), a(serie, 12), a(serie, 16)]).toEqual([4_215, Math.round((4_215 + 2_741) / 2), 14_440, Math.round(m.prevision(16))]);
    expect([a(serie, 4, 1, 2), a(serie, 16, 1, 2)]).toEqual([11_500, 13_252]);
    // La droite : celle des moyennes mobiles, ou la droite brute, plus raide.
    expect([a(ligne, 1), a(ligne, 16), a(ligne, 1, 2), a(ligne, 16, 2)]).toEqual([m.d.en(1), m.d.en(16), brute.d.en(1), brute.d.en(16)].map(Math.round));
    expect([a(ligne, 1), a(ligne, 16), a(ligne, 1, 2), a(ligne, 16, 2)]).toEqual([5_908, 7_515, 4_330, 10_411]);
    // Le modèle : la tendance × le coefficient de chaque trimestre.
    expect([a(modele, 1), a(modele, 4), a(modele, 16, 2)]).toEqual([Math.round(m.prevision(1)), Math.round(m.prevision(4)), 20_190]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : prévoir le trimestre creux", () => {
  const s = PREVOIR_LE_TRIMESTRE_CREUX;
  const k2 = m.coefficients[1]!;

  it("est le cas dédié du chapitre, chez MAILLE & CO seule", () => {
    casDedie(s, PREVOIR_LES_VENTES);
    expect(s.commanditaire).toBe("La direction");
    expect(SEUIL_DU_RENFORT).toBe(3_500);
  });

  it("la saison du trimestre creux et sa prévision, refaites à la main", () => {
    const r = (t: number) => centime((demande[t - 1]! / m.d.en(t)) * 100);
    expect(attendus(s, "la-saison-du-creux")).toEqual({
      "Trimestre 2 de N − 3 (% de la tendance)": r(2),
      "Trimestre 2 de N − 2 (% de la tendance)": r(6),
      "Trimestre 2 de N − 1 (% de la tendance)": r(10),
      "Coefficient corrigé du trimestre 2 (%)": centime(k2 * 100),
    });
    expect([r(2), r(6), r(10), centime(k2 * 100)]).toEqual([45.57, 46.77, 45.57, 45.94]);
    expect(attendus(s, "la-prevision")).toEqual({
      "Tendance du trimestre 2 de N": centime(m.d.en(14)),
      "Prévision du trimestre 2 de N": Math.round(m.prevision(14)),
      "Évolution sur le trimestre 2 de N − 1 (%)": centime((m.prevision(14) / demande[9]! - 1) * 100),
    });
    expect([centime(m.d.en(14)), Math.round(m.prevision(14)), centime((m.prevision(14) / 3_132 - 1) * 100)]).toEqual([7_300.99, 3_354, 7.09]);
  });

  it("le calcul à rebours : le renfort attend le trimestre 2 de N + 1", () => {
    const tendance = 3_500 / k2;
    const rang = (tendance - m.d.b) / m.d.a;
    expect(attendus(s, "a-rebours")).toEqual({
      "Tendance qu'il faut au trimestre 2": centime(tendance),
      "Rang où la tendance l'atteint": centime(rang),
      "Prévision du trimestre 2 de N + 1": Math.round(m.prevision(18)),
    });
    expect([centime(tendance), centime(rang), Math.round(m.prevision(18))]).toEqual([7_618.51, 16.96, 3_551]);
    expect(m.prevision(14)).toBeLessThan(3_500);
    expect(m.prevision(18)).toBeGreaterThanOrEqual(3_500);
  });

  it("la réponse : la prévision de la méthode, et le renfort pour N + 1 ; les pièges sont chiffrés", () => {
    expect(juste(s, "reponse")).toBe("Prévoir 3 354 articles, et le renfort pour N + 1");
    const r = trimestreCreux(cas);
    expect([Math.round(r.prolonge), Math.round(r.brute), Math.round(r.sansSaison)]).toEqual([
      Math.round(3_132 * (27_932 / 26_247)),
      Math.round(brute.prevision(14)),
      Math.round(m.d.en(14)),
    ]);
    expect([Math.round(r.prolonge), Math.round(r.brute), Math.round(r.sansSaison)]).toEqual([3_333, 4_622, 7_301]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});

describe("la garde voit le chapitre", () => {
  it("previsionDesVentes lit la fiche : sa droite est celle de la main", () => {
    const x = previsionDesVentes(cas);
    expect(x.a).toBeCloseTo(m.d.a, 9);
    expect(x.b).toBeCloseTo(m.d.b, 9);
    expect(x.premierRang).toBe(21);
  });
});
