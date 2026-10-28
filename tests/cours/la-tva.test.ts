import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { ENTREPRISES_DE_LA_TVA, LA_DECLARATION_DE_TVA, TRIMESTRE_A_REBOURS } from "../../src/config/cours/chapitres/la-declaration-de-tva";
import { LA_TVA_ET_LA_TRESORERIE } from "../../src/config/cours/chapitres/la-tva-et-la-tresorerie";
import { MARTEL_ET_FILS } from "../../src/config/cours/monde/delais-et-tva";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { JOURS_DEMANDES, LA_TVA_AVANCEE_POUR_LE_CLIENT } from "../../src/config/cours/situations/par-chapitre/la-tva-avancee-pour-le-client";
import { LA_TVA_DU_DERNIER_TRIMESTRE, tvaDuDernierTrimestre } from "../../src/config/cours/situations/par-chapitre/la-tva-du-dernier-trimestre";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeEcriture, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { corriger, enEcriture, enSaisie } from "../../src/pedagogy/cours/correcteur";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";
import { equilibree } from "../../src/pedagogy/cours/etats";

/**
 * LA DÉCLARATION DE TVA ET LA TVA DANS LA TRÉSORERIE, CHEZ MARTEL & FILS, DANS LE MONDE DU COURS, ET
 * LEURS CAS : LA TVA DU DERNIER TRIMESTRE, LA TVA AVANCÉE POUR LE CLIENT.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche du bâtiment (monde/delais-et-tva.ts),
 * sans les fonctions des chapitres ni le modèle (monde/delais.ts) ; les valeurs absolues sont
 * épinglées, les variantes (l'option pour les débits, un autre délai, un autre fournisseur, les
 * calculs à rebours) refaites comme le reste, et les verdicts aussi. Chaque curseur : son attendu, sa
 * position voisine, ses droites aux bornes, sa lecture. Chaque laboratoire : sa lecture au départ et à
 * la solution, et les courbes de son graphique en quelques points. Puis les gardes de texte de
 * l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts), et deux gardes propres au lot : aucune
 * phrase ne dit la TVA des travaux due à la facture sans parler de l'option pour les débits (le défaut
 * 2 de l'audit), et chaque montant d'un tableau dit s'il est HT ou TTC (le défaut 4).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "batiment";
const cas = casDeLEntreprise(code);
const m = MARTEL_ET_FILS;
const centime = (x: number) => Math.round(x * 100) / 100;
const NNBSP = " ";

/** Les travaux de MARTEL & FILS, HT, aux rangs −1 à 4 (T3 et T4 de N − 1, puis T1 à T4 de N), refaits sur la fiche. */
const COMMERCES = [72_000, 90_000, 45_000, 120_000, 75_000, 105_000];
const COLLECTIVITES = [126_000, 120_000, 60_000, 150_000, 135_000, 120_000];
const ENTREPRISES = [117_000, 180_000, 90_000, 210_000, 120_000, 225_000];
const ACHATS = [144_000, 180_000, 90_000, 216_000, 150_000, 216_000];
const INVESTISSEMENT = 210_000;
const T = 0.2;
const ix = (r: number) => r + 1;
const ventes = (r: number) => COMMERCES[ix(r)]! + COLLECTIVITES[ix(r)]! + ENTREPRISES[ix(r)]!;
/** Encaissé dans le trimestre : comptant, 30 jours (60 ÷ 90 du trimestre, 30 ÷ 90 d'avant), entreprises à j jours. */
const encaisse = (r: number, j = 60) =>
  COMMERCES[ix(r)]! + (COLLECTIVITES[ix(r)]! * 60) / 90 + (COLLECTIVITES[ix(r - 1)]! * 30) / 90 + (ENTREPRISES[ix(r)]! * (90 - j)) / 90 + (ENTREPRISES[ix(r - 1)]! * j) / 90;
const investi = (r: number) => (r === 2 ? INVESTISSEMENT : 0);
const deductible = (r: number) => (ACHATS[ix(r)]! + investi(r)) * T;

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
    case "ecriture": {
      const p = e.piece?.(c);
      const piece = p ? [p.nature, p.de, p.a, p.date, p.mention ?? "", ...p.lignes.map((l) => l.libelle), ...p.totaux.map((x) => x.libelle)] : [];
      const ecriture = e.ecriture(c);
      return [e.titre, e.evenement(c), ...e.indices(c), ...e.explication(c, etat), ecriture.libelle, ...ecriture.lignes.flatMap((l) => [l.role, l.indice]), ...piece];
    }
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
  for (const x of [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""]) {
    expect(x, x).not.toMatch(/undefined|NaN/);
    expect(x, x).not.toMatch(/ [-–—] |mises? en situation/i);
  }
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|jours|factures)\b/i);
      // Le monde du cours ne rejoue plus l'arène : elle ne paraît que dans la phrase de la synthèse.
      if (x !== "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.") expect(x, `${e.id} : ${x}`).not.toMatch(/arène/i);
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
      // Un champ qui peut être négatif : la question dit avec quel signe le donner.
      if (champs.some((x) => x.attendu < 0 || /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/négati(f|ve)/i);
    }
    if (e.type === "ecriture") {
      const attendue = e.ecriture(cas);
      expect(equilibree(enEcriture(attendue)), e.id).toBe(true);
      expect(corriger(enSaisie(attendue), attendue).juste, e.id).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Tous les textes d'un chapitre ou d'un cas, à plat ; une option se lit avec son retour (une mauvaise réponse dit pourquoi elle l'est). */
const tousLesTextes = (ch: Chapitre) => {
  const chapitre = chapitreDuCas(ch, cas);
  return [
    ch.titre,
    ch.accroche,
    ...ch.objectifs,
    ...chapitre.etapes.flatMap((e, i) => {
      const etat = etatAvant(chapitre, cas, i);
      if (e.type !== "choix") return textesDe(e, cas, etat);
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).map((o) => `${o.texte} ${o.retour}`)];
    }),
  ];
};

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts), et sa réponse qui ne se devine pas. */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(casDuChapitre(ch.code)).toBe(s);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.entreprises?.pourquoi).toBe(ch.entreprises?.pourquoi);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes[0]!.tableau).toBeDefined();
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  expect(CHAPITRES.some((c) => c.code === s.code)).toBe(false);
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
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    sens: e.sens ?? "plus-petite",
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et ses courbes. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  const g = e.graphique!(cas);
  const courbes = (p: Record<string, number>, positions: number[]) =>
    Object.fromEntries(g.courbes.map((x) => [x.libelle, positions.map((v) => centime(x.valeur({ ...p, [g.levier]: v })))]));
  return {
    leviers: e.leviers(cas),
    depart,
    solution: d.solution,
    auDepart: lire(depart),
    aLaSolution: lire({ ...d.solution }),
    reussi: [d.atteint(depart), d.atteint(d.solution)],
    atteint: d.atteint,
    levierDuGraphique: g.levier,
    courbes,
  };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

/** Un montant tel que le cours l'écrit : « 10 400 € », avec l'espace fine insécable. */
const euros = (x: number) => `${x.toLocaleString("fr-FR").replace(/\s/g, NNBSP).replace(/^-/, "−")} €`;

const BLOCS_DE_LA_DECLARATION = [
  ["BTS CG P3 · Gestion des obligations fiscales", "bts-cg"],
  ["DCG UE4 · Droit fiscal", "dcg"],
  ["BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation", "but-gea"],
] as const;

describe("les deux chapitres de TVA et leurs cas, chez MARTEL & FILS dans le monde du cours", () => {
  it("se jouent chez MARTEL & FILS seule, au palier 3 de la fiscalité, avec leurs blocs et les titres du programme", () => {
    expect(ENTREPRISES_DE_LA_TVA).toEqual(["batiment"]);
    expect(m.code).toBe(code);
    expect(cas.entreprise).toBe(m.entreprise);
    expect(LA_DECLARATION_DE_TVA.blocs).toEqual(BLOCS_DE_LA_DECLARATION.map(([b]) => b));
    expect(LA_TVA_ET_LA_TRESORERIE.blocs).toEqual(BLOCS_DE_LA_DECLARATION.slice(0, 2).map(([b]) => b));
    for (const [b, ref] of BLOCS_DE_LA_DECLARATION) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    for (const ch of [LA_DECLARATION_DE_TVA, LA_TVA_ET_LA_TRESORERIE]) {
      expect(CHAPITRES).toContain(ch);
      expect(ch.parcours).toBe("fiscalite");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises?.codes).toEqual(["batiment"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.entreprises!.pourquoi).toMatch(/MARTEL & FILS/);
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
      expect(PROGRAMME.fiscalite[3], ch.code).toContain(ch.titre);
    }
    expect(PROGRAMME.fiscalite[3]![0]).toBe(LA_DECLARATION_DE_TVA.titre);
    expect(PROGRAMME.fiscalite[3]![1]).toBe(LA_TVA_ET_LA_TRESORERIE.titre);
    expect(SITUATIONS).toContain(LA_TVA_DU_DERNIER_TRIMESTRE);
    expect(SITUATIONS).toContain(LA_TVA_AVANCEE_POUR_LE_CLIENT);
  });

  it("la fiche du bâtiment donne les chiffres de la consigne : le régime nommé, les encaissements, les déclarations", () => {
    expect(m.declaration.regime).toBe("encaissements");
    expect(m.declaration.optionPourLesDebits).toBe(false);
    expect(m.clienteles.map((g) => g.ventesHT)).toEqual([COMMERCES, COLLECTIVITES, ENTREPRISES]);
    expect(m.achatsHT).toEqual(ACHATS);
    expect([0, 1, 2, 3, 4].map((r) => encaisse(r))).toEqual([350_000, 275_000, 370_000, 395_000, 385_000]);
    expect([1, 2, 3, 4].map((r) => encaisse(r) * T - deductible(r))).toEqual([37_000, -11_200, 49_000, 33_800]);
    expect([1, 2, 3, 4].map((r) => ventes(r) * T - deductible(r))).toEqual([21_000, 10_800, 36_000, 46_800]);
  });

  it("l'exigibilité est dite juste : aucune phrase ne rend la TVA des travaux due à la facture sans nommer l'option pour les débits", () => {
    for (const ch of [LA_DECLARATION_DE_TVA, LA_TVA_ET_LA_TRESORERIE, LA_TVA_DU_DERNIER_TRIMESTRE, LA_TVA_AVANCEE_POUR_LE_CLIENT]) {
      const textes = tousLesTextes(ch);
      for (const x of textes) if (/payée?s? ou non|due à la facture|à la facture, que|sur les (ventes|travaux) facturés/i.test(x)) expect(x, `${ch.code} : ${x}`).toMatch(/débits|option/);
      expect(textes.join(" "), ch.code).not.toMatch(/comme si .* avait opté/);
      // Le régime réel est nommé dans l'énoncé.
      const e = ch.etapes[0]!;
      expect(e.type === "lecture" ? e.texte(cas).join(" ") : "", ch.code).toMatch(/encaissements?/);
    }
    const intro = LA_DECLARATION_DE_TVA.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("L'intro est une lecture");
    expect(intro.texte(cas).join(" ")).toMatch(/à l'encaissement du prix, sauf si l'entreprise opte pour les débits/);
    expect(intro.texte(cas).join(" ")).toMatch(/n'a pas opté/);
  });

  it("chaque montant d'un tableau dit s'il est hors taxes ou toutes taxes comprises", () => {
    for (const ch of [LA_DECLARATION_DE_TVA, LA_TVA_ET_LA_TRESORERIE, LA_TVA_DU_DERNIER_TRIMESTRE, LA_TVA_AVANCEE_POUR_LE_CLIENT])
      for (const e of ch.etapes) {
        if (!e.tableau) continue;
        const t = e.tableau(cas);
        for (const l of t.lignes)
          if (/travaux|matériaux|matériel|créances|dettes|encaissements|paiements/i.test(l.libelle) && !/TVA|^Clients|^Fournisseur|^Aux /.test(l.libelle))
            expect(`${t.titre} ${t.colonnes.join(" ")} ${l.libelle}`, `${ch.code} / ${e.id} : ${l.libelle}`).toMatch(/\((HT|TTC)\)/);
      }
  });
});

describe("la déclaration de TVA", () => {
  const ch = LA_DECLARATION_DE_TVA;

  it("les étapes guidées : le premier trimestre encaissé, déclaré et passé en écriture", () => {
    // Collectivités : 60 000 × 60 ÷ 90 + 120 000 × 30 ÷ 90 ; entreprises : 90 000 × 30 ÷ 90 + 180 000 × 60 ÷ 90.
    expect(attendus(ch, "les-encaissements")).toEqual({
      "Encaissé des collectivités (HT)": 40_000 + 40_000,
      "Encaissé des entreprises (HT)": 30_000 + 120_000,
      "Encaissements du premier trimestre (HT)": 45_000 + 80_000 + 150_000,
    });
    expect(encaisse(1)).toBe(275_000);
    expect(attendus(ch, "calcul")).toEqual({ "TVA collectée": 275_000 * T, "TVA déductible": 90_000 * T, "TVA à payer": 275_000 * T - 90_000 * T });
    expect([275_000 * T, 90_000 * T, 37_000]).toEqual([55_000, 18_000, 37_000]);
    const e = ch.etapes.find((x) => x.id === "liquidation") as EtapeEcriture;
    expect(e.ecriture(cas).lignes.map((l) => [l.compte, l.sens, l.montant])).toEqual([
      ["44571", "debit", 55_000],
      ["44566", "credit", 18_000],
      ["44551", "credit", 37_000],
    ]);
    expect(juste(ch, "l-exigibilite")).toBe("À l'encaissement du prix : MARTEL & FILS fait des travaux, sans option pour les débits");
    expect(juste(ch, "deductible")).toBe("Sur les matériaux livrés, même pas encore payés au négoce");
  });

  it("les étapes autonomes : le crédit du printemps, son imputation à l'été, ce qui se verse dans l'année", () => {
    expect(attendus(ch, "le-credit")).toEqual({
      "Encaissements du deuxième trimestre (HT)": 120_000 + (150_000 * 60) / 90 + (60_000 * 30) / 90 + (210_000 * 30) / 90 + (90_000 * 60) / 90,
      "TVA collectée du deuxième trimestre": 370_000 * T,
      "TVA déductible du deuxième trimestre": (216_000 + INVESTISSEMENT) * T,
      "TVA nette du deuxième trimestre": 370_000 * T - (216_000 + INVESTISSEMENT) * T,
    });
    expect(370_000 * T - 426_000 * T).toBe(-11_200);
    expect(attendus(ch, "l-imputation")).toEqual({
      "TVA collectée du troisième trimestre": encaisse(3) * T,
      "TVA déductible du troisième trimestre": 150_000 * T,
      "TVA nette du troisième trimestre": encaisse(3) * T - 150_000 * T,
      "TVA à payer, crédit imputé": encaisse(3) * T - 150_000 * T - 11_200,
    });
    expect(encaisse(3) * T - 30_000 - 11_200).toBe(37_800);
    expect(attendus(ch, "aux-debits")).toEqual({
      "TVA collectée aux débits": 480_000 * T,
      "TVA à payer aux débits": 480_000 * T - 85_200,
      "Écart de TVA nette, encaissements moins débits": (370_000 - 480_000) * T,
    });
    expect([96_000, 10_800, -22_000]).toEqual([480_000 * T, 480_000 * T - 85_200, (370_000 - 480_000) * T]);
    // Versée dans l'année : la TVA du dernier trimestre de N − 1 et des trois premiers de N, crédit imputé.
    const ouverture = encaisse(0) * T - 180_000 * T;
    expect(ouverture).toBe(34_000);
    expect(attendus(ch, "echeance")).toEqual({ "TVA versée à l'État pendant l'année N": 34_000 + 37_000 + 0 + 37_800, "TVA due à l'État au 31 décembre": 33_800 });
    expect(juste(ch, "lire-le-credit")).toBe("Il s'impute sur la déclaration suivante");
  });

  it("les étapes d'expert : l'année aux deux régimes, la hausse des créances retrouvée par l'écart, le calcul à rebours", () => {
    const collecteeEnc = [1, 2, 3, 4].reduce((s, r) => s + encaisse(r), 0) * T;
    const collecteeDeb = [1, 2, 3, 4].reduce((s, r) => s + ventes(r), 0) * T;
    const ded = [1, 2, 3, 4].reduce((s, r) => s + deductible(r), 0);
    expect([collecteeEnc, collecteeDeb, ded]).toEqual([285_000, 291_000, 176_400]);
    const a = attendus(ch, "l-ecart-de-l-annee");
    expect(a).toEqual({
      "TVA nette de l'année aux encaissements": collecteeEnc - ded,
      "TVA nette de l'année aux débits": collecteeDeb - ded,
      "Écart de l'année, encaissements moins débits": collecteeEnc - collecteeDeb,
      "Hausse des créances clients de l'année (HT)": (collecteeDeb - collecteeEnc) / T,
    });
    // La hausse des créances, refaite sur les créances : collectivités au tiers, entreprises aux deux tiers du trimestre.
    const creances = (r: number) => COLLECTIVITES[ix(r)]! / 3 + (ENTREPRISES[ix(r)]! * 2) / 3;
    expect([creances(0), creances(4)]).toEqual([160_000, 190_000]);
    expect(a["Hausse des créances clients de l'année (HT)"]).toBe(creances(4) - creances(0));
    expect(TRIMESTRE_A_REBOURS).toEqual({ aPayer: 42_600, achatsHT: 108_000, immobilisationHT: 45_000, immobilisation: "une mini-pelle" });
    expect(attendus(ch, "a-rebours")).toEqual({
      "TVA déductible du trimestre": (108_000 + 45_000) * T,
      "TVA collectée du trimestre": 42_600 + (108_000 + 45_000) * T,
      "Encaissements du trimestre (HT)": (42_600 + 30_600) / T,
    });
    expect((42_600 + 30_600) / T).toBe(366_000);
    expect(juste(ch, "l-option-pour-les-debits")).toBe("L'option fait verser plus tôt la TVA des factures pas encore payées : de la trésorerie en moins, pas d'impôt en plus");
  });

  it("les paris : un crédit au printemps, des clients plus rapides qui le font fondre, une TVA à payer avec l'option", () => {
    expect(juste(ch, "predire-le-credit")).toBe("Un crédit de TVA : l'État devra de l'argent à MARTEL & FILS");
    expect(juste(ch, "predire-le-delai")).toBe("Fondrait, jusqu'à disparaître : la TVA collectée suit l'argent reçu");
    expect(juste(ch, "predire-l-option")).toBe("Avec une TVA à payer : la collectée suit les travaux facturés");
  });

  it("les curseurs, refaits à la main : l'investissement qui fait naître le crédit, le délai des entreprises qui le fait naître", () => {
    // La TVA collectée du printemps, 74 000 €, couvre (216 000 + 1 000 × i) × 20 % tant que i ≤ (370 000 − 216 000) ÷ 1 000.
    expect(curseur(ch, "jusqu-ou-investir")).toEqual({
      attendu: (370_000 - 216_000) / 1_000,
      sens: "plus-grande",
      bornes: [0, 300],
      droites: [74_000, 216_000 * T, 74_000, (216_000 + 300_000) * T],
      lecture: {
        "TVA collectée du trimestre": 74_000,
        "TVA déductible sur les matériaux": 216_000 * T,
        "TVA déductible sur l'investissement": 154_000 * T,
        "TVA nette du trimestre": 0,
      },
    });
    expect(74_000 - (216_000 + 155_000) * T).toBeLessThan(0);
    // Aux encaissements, la TVA collectée du printemps vaut 20 % × (450 000 − 1 333,33 × j) ; elle couvre 85 200 € jusqu'à 18 jours.
    const collectee = (j: number) => encaisse(2, j) * T;
    expect(collectee(18)).toBe(85_200);
    expect(collectee(19)).toBeLessThan(85_200);
    expect(curseur(ch, "le-delai-qui-fait-le-credit")).toEqual({
      attendu: 18,
      sens: "plus-grande",
      // Le curseur s'arrête au délai maximal convenu entre professionnels, 60 jours (art. L. 441-10).
      bornes: [0, 60],
      droites: [collectee(0), 85_200, collectee(60), 85_200],
      lecture: {
        "Encaissé des entreprises au printemps (HT)": (210_000 * 72) / 90 + (90_000 * 18) / 90,
        "TVA collectée du printemps": 85_200,
        "TVA déductible du printemps": 85_200,
        "TVA nette du printemps": 0,
      },
    });
    expect([collectee(0), collectee(60)]).toEqual([90_000, 74_000]);
  });

  it("le laboratoire de la déclaration : le printemps sans crédit, investissement gardé, par l'option pour les débits", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-declaration");
    expect(l.depart).toEqual({ regime: 0, entreprises: 60, investissement: 1, taux: 20 });
    expect(l.solution).toEqual({ regime: 1, entreprises: 60, investissement: 1, taux: 20 });
    expect(l.reussi).toEqual([false, true]);
    // Le régime, l'investissement et le taux sont des leviers à choix.
    expect(l.leviers.filter((x) => x.choix).map((x) => x.code)).toEqual(["regime", "investissement", "taux"]);
    // Aux encaissements, des entreprises à 18 jours relèvent aussi le défi ; sans l'investissement, il ne compte pas.
    expect(l.atteint({ regime: 0, entreprises: 18, investissement: 1, taux: 20 })).toBe(true);
    expect(l.atteint({ regime: 0, entreprises: 19, investissement: 1, taux: 20 })).toBe(false);
    expect(l.atteint({ regime: 0, entreprises: 60, investissement: 0, taux: 20 })).toBe(false);
    expect(l.auDepart).toEqual({
      "Base de la TVA collectée du printemps (HT)": 370_000,
      "TVA collectée du printemps": 74_000,
      "TVA déductible du printemps": 85_200,
      "TVA nette du printemps": -11_200,
      "Crédit reporté sur l'été": 11_200,
      "TVA à payer de l'été, crédit imputé": 49_000 - 11_200,
      "TVA versée à l'État dans l'année": 34_000 + 37_000 + 0 + 37_800,
      "TVA due au 31 décembre": 33_800,
    });
    // Aux débits : la base est le facturé ; l'ouverture (T4 de N − 1) se déclare sur 390 000 € facturés.
    expect(ventes(0) * T - 180_000 * T).toBe(42_000);
    expect(l.aLaSolution).toEqual({
      "Base de la TVA collectée du printemps (HT)": ventes(2),
      "TVA collectée du printemps": ventes(2) * T,
      "TVA déductible du printemps": 85_200,
      "TVA nette du printemps": ventes(2) * T - 85_200,
      "Crédit reporté sur l'été": 0,
      "TVA à payer de l'été, crédit imputé": ventes(3) * T - 30_000,
      "TVA versée à l'État dans l'année": 42_000 + 21_000 + 10_800 + 36_000,
      "TVA due au 31 décembre": ventes(4) * T - 43_200,
    });
    // Le graphique sur le délai des entreprises : aux encaissements, des TVA qui cassent à 18 jours.
    expect(l.levierDuGraphique).toBe("entreprises");
    const credit = (j: number) => Math.max(0, 85_200 - encaisse(2, j) * T);
    const ete = (j: number) => Math.max(0, encaisse(3, j) * T - 30_000 - credit(j));
    const points = [0, 18, 30, 45, 60, 90];
    expect(l.courbes(l.depart, points)).toEqual({
      "TVA à payer du printemps": points.map((j) => centime(Math.max(0, encaisse(2, j) * T - 85_200))),
      "Crédit reporté sur l'été": points.map((j) => centime(credit(j))),
      "TVA à payer de l'été, crédit imputé": points.map((j) => centime(ete(j))),
    });
    expect(l.courbes(l.depart, points)).toEqual({
      "TVA à payer du printemps": [4_800, 0, 0, 0, 0, 0],
      "Crédit reporté sur l'été": [0, 0, 3_200, 7_200, 11_200, 19_200],
      "TVA à payer de l'été, crédit imputé": [37_000, 40_600, 39_800, 38_800, 37_800, 35_800],
    });
    // Ce ne sont pas des droites : le crédit à 45 jours n'est pas la moyenne de 0 et de 90 jours.
    expect(7_200).not.toBe((0 + 19_200) / 2);
    // Aux débits, le délai n'y change rien.
    expect(l.courbes(l.solution, [0, 90])).toEqual({ "TVA à payer du printemps": [10_800, 10_800], "Crédit reporté sur l'été": [0, 0], "TVA à payer de l'été, crédit imputé": [36_000, 36_000] });
  });

  it("textes propres, une seule bonne réponse, notions existantes, une écriture juste", () => verifierLesTextes(ch));
});

describe("la TVA et la trésorerie", () => {
  const ch = LA_TVA_ET_LA_TRESORERIE;
  /** Au 30 juin : créances HT = collectivités 150 000 × 30 ÷ 90 + entreprises 210 000 × j ÷ 90 ; négoce 216 000 × 45 ÷ 90. */
  const creancesDeJuin = (j = 60, coll = 30) => (150_000 * coll) / 90 + (210_000 * j) / 90;
  const tvaNegoce = (d = 45, r = 2) => ((ACHATS[ix(r)]! * d) / 90) * T;
  const etatAuxDebits = (r: number) => ventes(r) * T - deductible(r);

  it("les étapes guidées : le 30 juin au régime réel, personne ne finance la TVA des clients", () => {
    expect(creancesDeJuin()).toBe(190_000);
    expect(attendus(ch, "au-30-juin")).toEqual({
      "TVA des créances clients": (190_000 * 1.2 * 20) / 120,
      "TVA des dettes au négoce": (108_000 * 1.2 * 20) / 120,
      "Ce que la TVA laisse en trésorerie au 30 juin": -11_200 + 21_600 - 0,
    });
    expect([(190_000 * 1.2 * 20) / 120, (108_000 * 1.2 * 20) / 120]).toEqual([38_000, 21_600]);
    expect(juste(ch, "qui-finance-au-regime-reel")).toBe("Personne : elle n'est pas encore due à l'État");
  });

  it("les étapes autonomes : avec l'option, l'entreprise avance ; le négoce à la limite ; les flux de l'été", () => {
    expect(attendus(ch, "aux-debits")).toEqual({
      "TVA avancée pour les clients": 38_000,
      "Dette envers l'État, aux débits": etatAuxDebits(2),
      "Ce que la TVA laisse en trésorerie, aux débits": etatAuxDebits(2) + 21_600 - 38_000,
    });
    expect(etatAuxDebits(2) + 21_600 - 38_000).toBe(-5_600);
    expect(juste(ch, "qui-fait-credit")).toBe("MARTEL & FILS elle-même, en partie");
    // Le négoce payé à 57 jours : 216 000 × 57 ÷ 90 = 136 800 € HT.
    expect(attendus(ch, "la-dette-au-negoce")).toEqual({
      "Dette au négoce à 57 jours (TTC)": ((216_000 * 57) / 90) * 1.2,
      "TVA due au négoce à 57 jours": ((216_000 * 57) / 90) * T,
      "Ce que la TVA laisse en trésorerie, négoce à 57 jours": 10_800 + ((216_000 * 57) / 90) * T - 38_000,
    });
    expect([((216_000 * 57) / 90) * 1.2, 10_800 + 27_360 - 38_000]).toEqual([164_160, 160]);
    expect(juste(ch, "sans-tva")).toBe(`Le même résultat, et ${euros(10_400)} de moins en trésorerie`);
    // L'été : encaissé 395 000 € HT (474 000 € TTC), payé au négoce la moitié des achats du printemps et de l'été (219 600 € TTC).
    const paye = (216_000 / 2 + 150_000 / 2) * 1.2;
    expect([encaisse(3) * 1.2, paye]).toEqual([474_000, 219_600]);
    expect(attendus(ch, "l-ete")).toEqual({
      "TVA encaissée des clients": (474_000 * 20) / 120,
      "TVA payée au négoce": (paye * 20) / 120,
      "TVA versée à l'État pendant le trimestre": 0,
      "Solde de TVA du trimestre": 79_000 - 36_600 - 0,
    });
  });

  it("les étapes d'expert : l'été avec l'option, les créances retrouvées à rebours, l'argent de la TVA", () => {
    expect(attendus(ch, "l-ete-aux-debits")).toEqual({
      "TVA versée à l'État pendant l'été, aux débits": etatAuxDebits(2),
      "Solde de TVA de l'été, aux débits": 79_000 - 36_600 - 10_800,
      "Ce que la TVA laisse en trésorerie au 30 septembre, aux débits": -5_600 + 31_600,
    });
    // Le 30 septembre, refait : aux débits, 36 000 + 150 000 × 45 ÷ 90 × 20 % − (135 000 ÷ 3 + 120 000 × 2 ÷ 3) × 20 %.
    expect(etatAuxDebits(3) + tvaNegoce(45, 3) - (135_000 / 3 + (120_000 * 2) / 3) * T).toBe(26_000);
    // Au 31 décembre, aux débits : 46 800 + 21 600 − 30 400.
    expect(etatAuxDebits(4) + tvaNegoce(45, 4) - (120_000 / 3 + (225_000 * 2) / 3) * T).toBe(30_400);
    expect(attendus(ch, "a-rebours")).toEqual({
      "TVA des créances déjà déclarée": 46_800 + 21_600 - 30_400,
      "Créances clients (HT)": 38_000 / T,
      "Créances clients (TTC)": (38_000 / T) * 1.2,
    });
    expect(juste(ch, "l-argent-de-la-tva")).toBe(`Cet argent part au trimestre suivant : ${euros(33_800)} à l'État, la TVA du négoce avec ses factures`);
    expect(juste(ch, "predire-l-option")).toBe("Deviendrait négatif : MARTEL & FILS avancerait de la TVA");
    expect(juste(ch, "predire-le-negoce")).toBe("Plus tard, sans sortir du délai légal");
  });

  it("les curseurs, refaits à la main : 48 jours pour les entreprises, 57 jours pour le négoce, avec l'option", () => {
    // Aux débits, au 30 juin : 10 800 + 21 600 couvrent (50 000 + 210 000 × j ÷ 90) × 20 % tant que j ≤ 48.
    const tvaDesCreances = (j: number) => creancesDeJuin(j) * T;
    expect(tvaDesCreances(48)).toBe(32_400);
    expect(tvaDesCreances(49)).toBeGreaterThan(32_400);
    expect(curseur(ch, "le-delai-au-curseur")).toEqual({
      attendu: 48,
      sens: "plus-grande",
      bornes: [0, 90],
      droites: [32_400, tvaDesCreances(0), 32_400, tvaDesCreances(90)],
      lecture: { "TVA des créances, déjà déclarée": 32_400, "Dette envers l'État": 10_800, "TVA due au négoce": 21_600, "Ce que la TVA laisse en trésorerie": 0 },
    });
    expect([tvaDesCreances(0), tvaDesCreances(90)]).toEqual([10_000, 52_000]);
    // Le négoce : 10 800 + 216 000 × d ÷ 90 × 20 % couvre 38 000 € dès d = 57 (56,67 jours).
    expect(10_800 + tvaNegoce(56)).toBeLessThan(38_000);
    expect(curseur(ch, "le-negoce-au-curseur")).toEqual({
      attendu: 57,
      sens: "plus-petite",
      bornes: [0, 60],
      droites: [10_800, 38_000, 10_800 + tvaNegoce(60), 38_000],
      lecture: {
        "Dette au négoce (TTC)": 164_160,
        "TVA due au négoce": tvaNegoce(57),
        "Dette envers l'État": 10_800,
        "TVA des créances, déjà déclarée": 38_000,
        "Ce que la TVA laisse en trésorerie": 10_800 + tvaNegoce(57) - 38_000,
      },
    });
    expect(10_800 + tvaNegoce(60)).toBe(39_600);
  });

  it("le laboratoire de la trésorerie : opter pour les débits sans rien avancer, et qui finance la TVA des créances", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-tresorerie");
    expect(l.depart).toEqual({ regime: 0, entreprises: 60, collectivites: 30, negoce: 45 });
    expect(l.solution).toEqual({ regime: 1, entreprises: 60, collectivites: 30, negoce: 60 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.leviers.filter((x) => x.choix).map((x) => x.code)).toEqual(["regime"]);
    // D'autres solutions : des collectivités payées comptant ; aux débits tels quels, le défi échoue.
    expect(l.atteint({ regime: 1, entreprises: 60, collectivites: 0, negoce: 45 })).toBe(true);
    expect(l.atteint({ regime: 1, entreprises: 60, collectivites: 30, negoce: 45 })).toBe(false);
    expect(l.atteint({ regime: 1, entreprises: 48, collectivites: 30, negoce: 45 })).toBe(false);
    // Au départ, au régime réel : les clôtures aux encaissements, 46 000, 10 400, 52 800, 55 400.
    const enc = [37_000 + tvaNegoce(45, 1), -11_200 + tvaNegoce(45, 2), 37_800 + tvaNegoce(45, 3), 33_800 + tvaNegoce(45, 4)];
    expect(enc).toEqual([46_000, 10_400, 52_800, 55_400]);
    expect(l.auDepart).toEqual({
      "TVA des créances clients": 38_000,
      "dont TVA déjà déclarée, avancée": 0,
      "Dette envers l'État (négative : un crédit)": -11_200,
      "TVA due au négoce": 21_600,
      "Ce que la TVA laisse en trésorerie au 30 juin": 10_400,
      "Au plus bas, sur les clôtures de l'année": Math.min(...enc),
    });
    // À la solution, aux débits avec le négoce à 60 jours : chaque clôture, refaite.
    const creances = (r: number) => (COLLECTIVITES[ix(r)]! * 30) / 90 + (ENTREPRISES[ix(r)]! * 60) / 90;
    const deb = [1, 2, 3, 4].map((r) => etatAuxDebits(r) + tvaNegoce(60, r) - creances(r) * T);
    expect(deb).toEqual([17_000, 1_600, 31_000, 37_600]);
    expect(l.aLaSolution).toEqual({
      "TVA des créances clients": 38_000,
      "dont TVA déjà déclarée, avancée": 38_000,
      "Dette envers l'État (négative : un crédit)": 10_800,
      "TVA due au négoce": tvaNegoce(60),
      "Ce que la TVA laisse en trésorerie au 30 juin": 10_800 + tvaNegoce(60) - 38_000,
      "Au plus bas, sur les clôtures de l'année": Math.min(...deb),
    });
    // Le graphique : qui finance la TVA des créances au 30 juin, selon le délai des entreprises.
    expect(l.levierDuGraphique).toBe("entreprises");
    const tva = (j: number) => creancesDeJuin(j) * T;
    const points = [0, 48, 60, 75, 90];
    // Au régime réel, toute la TVA des créances attend, et personne ne la finance.
    expect(l.courbes(l.depart, points)).toEqual({
      "TVA des créances, pas encore due": points.map((j) => centime(tva(j))),
      "TVA avancée, couverte par l'État et le négoce": points.map(() => 0),
      "TVA avancée par l'entreprise elle-même": points.map(() => 0),
    });
    // Aux débits, négoce à 45 jours : l'État et le négoce couvrent 32 400 €, au-delà l'entreprise avance.
    const aux45 = { ...l.solution, negoce: 45 };
    expect(l.courbes(aux45, points)).toEqual({
      "TVA des créances, pas encore due": points.map(() => 0),
      "TVA avancée, couverte par l'État et le négoce": points.map((j) => centime(Math.min(tva(j), 32_400))),
      "TVA avancée par l'entreprise elle-même": points.map((j) => centime(Math.max(0, tva(j) - 32_400))),
    });
    expect(l.courbes(aux45, points)["TVA avancée par l'entreprise elle-même"]).toEqual([0, 0, 5_600, 12_600, 19_600]);
    // À la solution, le négoce à 60 jours couvre 39 600 € : l'entreprise n'avance qu'au-delà de 63 jours, un retard.
    expect(l.courbes(l.solution, [60, 90])["TVA avancée par l'entreprise elle-même"]).toEqual([0, 52_000 - 39_600]);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(ch));
});

describe("le cas : la TVA du dernier trimestre", () => {
  const s = LA_TVA_DU_DERNIER_TRIMESTRE;

  it("est le cas dédié de la déclaration de TVA, au palier 3, chez MARTEL & FILS", () => {
    casDedie(s, LA_DECLARATION_DE_TVA);
    expect(s.commanditaire).toBe("L'expert-comptable");
  });

  it("les encaissements et la déclaration de l'automne, refaits à la main", () => {
    expect(attendus(s, "les-encaissements")).toEqual({
      "Encaissé des collectivités (HT)": (120_000 * 60) / 90 + (135_000 * 30) / 90,
      "Encaissé des entreprises (HT)": (225_000 * 30) / 90 + (120_000 * 60) / 90,
      "Encaissements du quatrième trimestre (HT)": 105_000 + 125_000 + 155_000,
    });
    expect(encaisse(4)).toBe(385_000);
    expect(attendus(s, "declaration")).toEqual({ "TVA collectée": 385_000 * T, "TVA déductible": 216_000 * T, "TVA à payer": 385_000 * T - 216_000 * T });
    expect(385_000 * T - 216_000 * T).toBe(33_800);
  });

  it("le calcul à rebours : du versement de l'automne au crédit, puis au matériel du printemps", () => {
    expect(attendus(s, "a-rebours")).toEqual({
      "TVA nette de l'été": 79_000 - 30_000,
      "Crédit imputé sur l'été": 49_000 - 37_800,
      "TVA déductible du printemps": 74_000 + 11_200,
      "Matériel neuf livré au printemps (HT)": 85_200 / T - 216_000,
    });
    expect(85_200 / T - 216_000).toBe(INVESTISSEMENT);
  });

  it("le croisement des régimes : plus léger au régime réel, plus lourd avec l'option", () => {
    expect(attendus(s, "comparer")).toEqual({
      "Écart, au régime des encaissements": 33_800 - 37_800,
      "TVA à payer du quatrième trimestre, aux débits": 450_000 * T - 43_200,
      "TVA versée à l'automne, aux débits": 330_000 * T - 30_000,
      "Écart, aux débits": 450_000 * T - 43_200 - (330_000 * T - 30_000),
    });
    expect([46_800, 36_000, 10_800]).toEqual([450_000 * T - 43_200, 330_000 * T - 30_000, 46_800 - 36_000]);
    const k = tvaDuDernierTrimestre(cas);
    expect([k.verdict, k.verdictAuxDebits]).toEqual(["plus-leger", "plus-lourd"]);
    expect(juste(s, "reponse")).toBe(`Plus léger : ${euros(33_800)} à verser, contre ${euros(37_800)} cet automne`);
  });

  it("le curseur du cas : il faudrait 405 milliers d'euros encaissés pour égaler le dernier versement", () => {
    // 20 % × 1 000 × e − 43 200 ≥ 37 800 dès e = (37 800 + 43 200) ÷ 0,2 ÷ 1 000.
    expect((37_800 + 43_200) / T / 1_000).toBe(405);
    expect(404_000 * T - 43_200).toBeLessThan(37_800);
    expect(curseur(s, "le-versement-au-curseur")).toEqual({
      attendu: 405,
      sens: "plus-petite",
      bornes: [300, 500],
      droites: [300_000 * T - 43_200, 37_800, 500_000 * T - 43_200, 37_800],
      lecture: {
        "TVA collectée du trimestre": 405_000 * T,
        "TVA déductible du trimestre": 43_200,
        "TVA à payer, versée en N + 1": 37_800,
        "Écart avec le versement de l'automne": 0,
      },
    });
    // Les encaissements réels sont sous la bascule : le verdict « plus léger » tient.
    expect(encaisse(4)).toBeLessThan(405_000);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(s));
});

describe("le cas : la TVA avancée pour le client", () => {
  const s = LA_TVA_AVANCEE_POUR_LE_CLIENT;

  it("est le cas dédié de la TVA et la trésorerie, au palier 3, chez MARTEL & FILS", () => {
    casDedie(s, LA_TVA_ET_LA_TRESORERIE);
    expect(s.commanditaire).toBe("La gérante");
    expect(JOURS_DEMANDES).toBe(30);
  });

  it("seuls les commerces peuvent payer 30 jours plus tard sans sortir de la loi", () => {
    // Commerces : 0 + 30 ≤ 60 ; collectivités : 30 + 30 > 30 ; entreprises : 60 + 30 > 60.
    expect([0 + 30 <= 60, 30 + 30 <= 30, 60 + 30 <= 60]).toEqual([true, false, false]);
    expect(juste(s, "la-clientele")).toBe("Commerces et cabinets, qui passeraient de comptant à 30 jours");
  });

  it("la créance en plus et ce qu'elle fait financer, aux deux régimes, refaites à la main", () => {
    expect(attendus(s, "la-creance-en-plus")).toEqual({
      "Créance en plus au 31 décembre (HT)": (105_000 * 30) / 90,
      "Créance en plus au 31 décembre (TTC)": ((105_000 * 30) / 90) * 1.2,
      "TVA contenue dans cette créance": ((105_000 * 30) / 90) * T,
    });
    const annee = 45_000 + 120_000 + 75_000 + 105_000;
    expect(annee).toBe(345_000);
    expect(attendus(s, "ce-qu-elle-finance")).toEqual({
      "Financé en plus, au régime réel": 35_000,
      "Coût du délai sur l'année, au régime réel": centime((annee * 0.09 * 30) / 360),
      "Financé en plus, avec l'option": 42_000,
      "Coût du délai sur l'année, avec l'option": centime((annee * 1.2 * 0.09 * 30) / 360),
    });
    expect([centime((annee * 0.09 * 30) / 360), centime((annee * 1.2 * 0.09 * 30) / 360)]).toEqual([2_587.5, 3_105]);
  });

  it("le croisement : la TVA laissée au 31 décembre baisse de 2 000 € au régime réel, de 7 000 € avec l'option", () => {
    // Avec le délai, les commerces paient à l'automne 105 000 × 60 ÷ 90 + 75 000 × 30 ÷ 90 = 95 000 € HT.
    const commerces = (105_000 * 60) / 90 + (75_000 * 30) / 90;
    expect(commerces).toBe(95_000);
    const collectee = (commerces + 125_000 + 155_000) * T;
    expect(attendus(s, "la-tva-laissee")).toEqual({
      "TVA collectée du quatrième trimestre, avec le délai": collectee,
      "Ce que la TVA laisse au 31 décembre, au régime réel": 55_400 - (77_000 - collectee),
      "Ce que la TVA laisse au 31 décembre, avec l'option": 30_400 - 7_000,
    });
    expect([collectee, 55_400 - (77_000 - collectee)]).toEqual([75_000, 53_400]);
    expect(juste(s, "reponse")).toBe(`Ce délai coûte ${euros(35_000)} de trésorerie, hors taxes : la TVA de ces factures n'est due qu'à leur encaissement`);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(s));
});
