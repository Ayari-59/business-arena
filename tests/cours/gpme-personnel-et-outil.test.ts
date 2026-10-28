import { describe, expect, it } from "vitest";
import { REFERENTIELS_DES_FORMATIONS } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DE_L_ENTRETIEN,
  ENTRETENIR_L_OUTIL,
  TRIMESTRE_SANS_ENTRETIEN,
  entretienDeLOutil,
} from "../../src/config/cours/chapitres/entretenir-l-outil";
import {
  ECART_SOUS_LE_MARCHE,
  ENTREPRISES_DU_DEPART,
  LE_DEPART_D_UN_SALARIE,
  MOIS_DE_LA_VARIANTE,
  MOIS_DU_RECRUTEMENT_A_REBOURS,
  TRIMESTRE_DE_LA_BAISSE,
  TRIMESTRE_DU_RECRUTEMENT,
} from "../../src/config/cours/chapitres/le-depart-d-un-salarie";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { ENTRETENIR_AU_SEUIL, entretienAuSeuil } from "../../src/config/cours/situations/par-chapitre/entretenir-au-seuil";
import { RECRUTER_DES_L_ANNONCE_DU_DEPART, recruterDesLAnnonce } from "../../src/config/cours/situations/par-chapitre/recruter-des-l-annonce-du-depart";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE PERSONNEL ET L'OUTIL DE LA PME, À L'ATELIER DU MONDE DU COURS (parcours BTS GPME, palier 3) :
 * LE DÉPART D'UN SALARIÉ ET ENTRETENIR L'OUTIL, ET LEURS CAS : RECRUTER DÈS L'ANNONCE DU DÉPART,
 * ENTRETENIR AU SEUIL.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de NOVA (monde/nova-capacite.ts), sans
 * les fonctions des chapitres ni le modèle (monde/capacite.ts) : la marge d'une enceinte, l'équipe
 * mois par mois, le goulot de chaque trimestre, la disponibilité trimestre après trimestre, les
 * défauts attendus. Les variantes (recruter en février, la demande de N, sauter le trimestre 2) et
 * les calculs à rebours sont refaits comme le reste ; chaque curseur a son attendu, sa position
 * voisine, ses droites aux bornes et sa lecture ; chaque laboratoire sa lecture au départ et à la
 * solution, et les courbes de son graphique en quelques points ; les verdicts sont épinglés. Puis
 * les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = NOVA_CAPACITE;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

// La fiche, refaite à la main : ce que les deux chapitres partagent.
const marge = f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres;
const ligne = f.ligne.capaciteParTrimestre;
const demandeN1 = f.anneeNPlus1.demande;
const demandeN = f.anneeN.demande;
const auPlan = demandeN1.map((d) => Math.min(d, ligne, 4 * 1_800));

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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "sauvé", "monté", "refusé"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|trente|cent) (enceintes?|heures?|trimestres?|mois|opérateurs?|points?|ventes?|défauts?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\barène (a )?rejou/i);
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
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
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
  expect(s.code).not.toBe(ch.code);
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
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et ses courbes en un point. */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  const g = e.graphique?.(cas);
  const courbes = (p: Record<string, number>) => Object.fromEntries((g?.courbes ?? []).map((x) => [x.libelle, centime(x.valeur(p))]));
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)], atteint: d.atteint, lire, g, courbes };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

describe("le personnel et l'outil : la place dans le parcours, chez NOVA seule", () => {
  it("les titres sont ceux du programme, au palier 3 du parcours gpme, et les blocs existent au registre", () => {
    const entrees = new Set(REFERENTIELS_DES_FORMATIONS["bts-gpme"]!.entrees.map((x) => `BTS GPME ${x}`));
    for (const ch of [LE_DEPART_D_UN_SALARIE, ENTRETENIR_L_OUTIL]) {
      expect(CHAPITRES).toContain(ch);
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(3);
      expect(PROGRAMME.gpme[3], ch.code).toContain(ch.titre);
      expect(ch.libre).toBe(false);
      for (const b of ch.blocs) expect(entrees.has(b), b).toBe(true);
      // Un choix assumé : une seule PME industrielle, celle de la comptabilité et du contrôle de gestion.
      expect(ch.entreprises?.codes).toEqual(["nova"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
      const synthese = ch.etapes.at(-1)!;
      if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
      expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    }
    expect([ENTREPRISES_DU_DEPART, ENTREPRISES_DE_L_ENTRETIEN]).toEqual([["nova"], ["nova"]]);
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(RECRUTER_DES_L_ANNONCE_DU_DEPART);
    expect(SITUATIONS).toContain(ENTRETENIR_AU_SEUIL);
  });

  it("le gabarit de l'étalon : deux paris au moins, deux curseurs, un laboratoire, et les expériences avant la formule", () => {
    for (const ch of [LE_DEPART_D_UN_SALARIE, ENTRETENIR_L_OUTIL]) {
      const types = ch.etapes.map((e) => e.type);
      expect(ch.etapes.filter((e) => e.titre.startsWith("Pariez")).length, ch.code).toBeGreaterThanOrEqual(3);
      expect(types.filter((t) => t === "curseur").length, ch.code).toBeGreaterThanOrEqual(2);
      expect(types.filter((t) => t === "simulation").length, ch.code).toBe(1);
      expect(ch.etapes.length, ch.code).toBeGreaterThanOrEqual(17);
      // Chaque pari est suivi de l'expérience qui le tranche.
      ch.etapes.forEach((e, i) => {
        if (e.titre.startsWith("Pariez")) expect(["curseur", "simulation"], `${ch.code} / ${e.id}`).toContain(ch.etapes[i + 1]!.type);
      });
    }
  });

  it("la mission « jouez » garde ses exports, qui ne servent plus qu'à l'arène", () => {
    expect([ECART_SOUS_LE_MARCHE, TRIMESTRE_DE_LA_BAISSE, TRIMESTRE_DU_RECRUTEMENT, TRIMESTRE_SANS_ENTRETIEN]).toEqual([0.1, 1, 2, 1]);
  });
});

describe("le départ d'un salarié : l'équipe qui devient le goulot", () => {
  const ch = LE_DEPART_D_UN_SALARIE;
  const p = f.personnel;
  const o = f.operateurs;
  // La fiche, refaite à la main.
  const parMois = o.heuresParMois / o.heuresParEnceinte;
  const coutMensuel = o.salaireBrutMensuel * (1 + o.tauxDesCotisationsPatronales);
  const auSeuil = p.salaireDuMarche.nPlus1 * p.seuilDeDemission;
  const augmentation = (auSeuil - o.salaireBrutMensuel) * (1 + o.tauxDesCotisationsPatronales) * 12 * 4;
  /**
   * L'équipe du trimestre 2 quand le recrutement est lancé le mois `m` : les 3 opérateurs restés
   * d'avril à juin, et le remplaçant, arrivé au mois m + 2, à 50 % son premier mois.
   */
  const remplacant = (mois: number, m: number | null) => (m === null || mois < m + 2 ? 0 : mois === m + 2 ? 0.5 : 1);
  const equipeT2 = (m: number | null) => [4, 5, 6].reduce((t, mois) => t + (3 + remplacant(mois, m)) * parMois, 0);
  /** Les mois de salaire que le poste n'a pas coûtés : de avril à l'arrivée, ou un mois payé en double si les deux se croisent. */
  const nonVerses = (m: number) => (m + 2 - 4) * coutMensuel;

  it("la fiche donne les chiffres du monde", () => {
    expect([marge, parMois, coutMensuel, auSeuil, augmentation]).toEqual([21, 600, 2_662.5, 1_900, 1_704]);
    expect(o.salaireBrutMensuel / p.salaireDuMarche.nPlus1).toBe(0.9375);
    expect(centime((o.salaireBrutMensuel / p.salaireDuMarche.n) * 100)).toBe(96.15);
    expect(auPlan).toEqual([5_800, 7_000, 6_200, 7_000]);
    expect([equipeT2(4), equipeT2(3), equipeT2(2), equipeT2(5), equipeT2(null)]).toEqual([5_700, 6_300, 6_900, 5_400, 5_400]);
  });

  it("le pari et le curseur du salaire : 1 900 € gardent l'opérateur", () => {
    expect(juste(ch, "predire-le-depart")).toBe("Oui : 1 875 € tombent sous 95 % du nouveau marché");
    expect(curseur(ch, "le-salaire-qui-garde")).toEqual({
      attendu: auSeuil,
      bornes: [1_800, 2_000],
      droites: [1_800, auSeuil, 2_000, auSeuil],
      lecture: {
        "Salaire au seuil de démission": auSeuil,
        "Augmentation mensuelle d'un opérateur": 25,
        "Hausse de la masse salariale sur un an, cotisations comprises": augmentation,
      },
    });
  });

  it("les étapes guidées : le seuil de démission, le poste vide mois par mois", () => {
    expect(attendus(ch, "le-seuil-de-demission")).toEqual({
      "Part du marché payée en N (%)": 96.15,
      "Part du marché payée en N + 1 (%)": 93.75,
      "Salaire au seuil de démission": auSeuil,
      "Coût de l'augmentation sur un an": augmentation,
    });
    // Le recrutement lancé le 1er avril : le remplaçant arrive le 1er juin, à 50 %.
    expect(attendus(ch, "le-poste-vide")).toEqual({
      "Capacité de l'équipe en avril (enceintes)": 3 * parMois,
      "Capacité de l'équipe en mai (enceintes)": 3 * parMois,
      "Capacité de l'équipe en juin (enceintes)": 3.5 * parMois,
      "Capacité de l'équipe au trimestre 2 (enceintes)": equipeT2(4),
    });
  });

  it("les étapes autonomes : le goulot, le coût complet du départ, le verdict", () => {
    // Trimestre 2 : la plus petite de 7 400 demandées, 7 000 pour la ligne, 5 700 pour l'équipe.
    const ventes = Math.min(demandeN1[1]!, ligne, equipeT2(4));
    expect(ventes).toBe(5_700);
    const perdues = auPlan[1]! - ventes;
    expect(attendus(ch, "les-ventes-perdues")).toEqual({ "Ventes du trimestre 2 (enceintes)": ventes, "Ventes perdues par le départ (enceintes)": perdues, "Marge perdue": perdues * marge });
    expect([perdues, perdues * marge]).toEqual([1_300, 27_300]);
    const cout = perdues * marge + p.coutDUnRecrutement - nonVerses(4);
    expect(attendus(ch, "le-cout-du-depart")).toEqual({ "Salaires non versés": 2 * coutMensuel, "Coût du départ": cout, "Coût du départ ÷ coût de l'augmentation": centime(cout / augmentation) });
    expect([cout, centime(cout / augmentation)]).toEqual([24_975, 14.66]);
    expect(juste(ch, "verdict")).toBe("Il fallait suivre le marché : le départ coûte près de 15 fois l'augmentation");
  });

  it("le pari et le curseur de l'augmentation : jusqu'à 366 € par mois, garder l'équipe coûte moins que le départ", () => {
    const parEuro = (1 + o.tauxDesCotisationsPatronales) * 12 * 4;
    const limite = Math.floor(24_975 / parEuro);
    expect(limite).toBe(366);
    expect(juste(ch, "predire-l-augmentation")).toBe("Plus de 300 € par mois et par opérateur");
    expect(curseur(ch, "jusqu-ou-augmenter")).toEqual({
      attendu: limite,
      bornes: [25, 500],
      droites: [24_975, 25 * parEuro, 24_975, centime(500 * parEuro)],
      lecture: {
        "Hausse de la masse salariale sur un an": centime(limite * parEuro),
        "Coût du départ, recruté au départ": 24_975,
        "Ce que garder l'équipe fait gagner": centime(24_975 - limite * parEuro),
      },
    });
    expect(centime(limite * parEuro)).toBe(24_946.56);
  });

  it("le laboratoire du départ : ne perdre aucune vente au moindre coût, c'est rester au seuil", () => {
    expect(juste(ch, "predire-l-integration")).toBe("Non : le premier mois, le remplaçant ne monte que la moitié");
    const l = laboratoire(ch, "le-laboratoire-du-depart");
    expect(l.depart).toEqual({ part: 93.75, lancement: 4, demande: 1 });
    expect(l.solution).toEqual({ part: 95, lancement: 4, demande: 1 });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Salaire brut mensuel d'un opérateur": o.salaireBrutMensuel,
      "Démissions": 1,
      "Mois de poste vide": 2,
      "Capacité de l'équipe au trimestre 2": equipeT2(4),
      "Ventes perdues sur l'année": 1_300,
      "Marge perdue": -27_300,
      "Recrutement": -3_000,
      "Salaires non versés": 2 * coutMensuel,
      "Hausse des salaires": 0,
      "Effet sur le résultat de l'année": -24_975,
    });
    expect(l.aLaSolution).toEqual({
      "Salaire brut mensuel d'un opérateur": auSeuil,
      "Démissions": 0,
      "Mois de poste vide": 0,
      "Capacité de l'équipe au trimestre 2": 4 * 3 * parMois,
      "Ventes perdues sur l'année": 0,
      "Marge perdue": 0,
      "Recrutement": 0,
      "Salaires non versés": 0,
      "Hausse des salaires": -augmentation,
      "Effet sur le résultat de l'année": -augmentation,
    });
    // En janvier, aucune vente perdue non plus, mais le recrutement et un mois payé en double : plus cher.
    const janvier = l.lire({ part: 93.75, lancement: 1, demande: 1 });
    expect(janvier["Ventes perdues sur l'année"]).toBe(0);
    expect(janvier["Effet sur le résultat de l'année"]).toBe(-(3_000 + coutMensuel));
    expect(l.atteint({ part: 93.75, lancement: 1, demande: 1 })).toBe(false);
    expect(l.atteint({ part: 95.25, lancement: 4, demande: 1 })).toBe(false);
    // Sur la demande de N, recruter dès l'annonce suffit : 3 000 € − un mois de salaire non versé ; mais le défi est en N + 1.
    const surN = l.lire({ part: 93.75, lancement: 3, demande: 0 });
    expect([surN["Ventes perdues sur l'année"], surN["Effet sur le résultat de l'année"]]).toEqual([0, -(3_000 - coutMensuel)]);
    expect(l.atteint({ part: 93.75, lancement: 3, demande: 0 })).toBe(false);
    // Sans remplaçant : 1 600 + 800 + 1 600 enceintes perdues aux trimestres 2 à 4, 9 mois de salaire non versés.
    const personne = l.lire({ part: 93.75, lancement: 0, demande: 1 });
    expect(personne["Ventes perdues sur l'année"]).toBe(ligne - 5_400 + (demandeN1[2]! - 5_400) + (ligne - 5_400));
    expect(personne["Effet sur le résultat de l'année"]).toBe(-(4_000 * marge) + 9 * coutMensuel);
  });

  it("le graphique du laboratoire : l'effet saute au seuil de démission", () => {
    const l = laboratoire(ch, "le-laboratoire-du-depart");
    expect(l.g!.levier).toBe("part");
    const a = (part: number) => l.courbes({ part, lancement: 4, demande: 1 });
    expect(a(93.75)).toEqual({ "Effet du départ": -24_975, "Hausse des salaires": 0, "Effet sur le résultat de l'année": -24_975 });
    // À 94,75 % (1 895 €), l'opérateur part encore ; les salaires non versés se comptent au salaire payé.
    const c = 1_895 * 1.42;
    expect(a(94.75)).toEqual({
      "Effet du départ": centime(-27_300 - 3_000 + 2 * c),
      "Hausse des salaires": centime(-(c - coutMensuel) * 48),
      "Effet sur le résultat de l'année": centime(-27_300 - 3_000 + 2 * c - (c - coutMensuel) * 48),
    });
    expect(a(95)).toEqual({ "Effet du départ": 0, "Hausse des salaires": -1_704, "Effet sur le résultat de l'année": -1_704 });
    expect(a(100)).toEqual({ "Effet du départ": 0, "Hausse des salaires": -(2_000 - 1_875) * 1.42 * 48, "Effet sur le résultat de l'année": -8_520 });
  });

  it("les étapes d'expert : recruter en février, la demande de N, le calcul à rebours, la critique", () => {
    expect(MOIS_DE_LA_VARIANTE).toBe(2);
    // Lancé le 1er février : arrivé le 1er avril, à 50 % en avril ; aucun mois vacant, et 100 enceintes perdues encore.
    expect(attendus(ch, "recruter-en-fevrier")).toEqual({
      "Capacité de l'équipe au trimestre 2 (enceintes)": equipeT2(2),
      "Ventes perdues (enceintes)": auPlan[1]! - equipeT2(2),
      "Salaires non versés": nonVerses(2),
      "Coût du départ": (auPlan[1]! - equipeT2(2)) * marge + 3_000 - nonVerses(2),
    });
    expect([equipeT2(2), auPlan[1]! - equipeT2(2), nonVerses(2), 100 * marge + 3_000]).toEqual([6_900, 100, 0, 5_100]);
    // La demande de N : 6 081 au trimestre 2, que la ligne et l'équipe complète servaient toute.
    const perduesN = demandeN[1]! - equipeT2(4);
    expect(attendus(ch, "la-demande-de-n")).toEqual({
      "Ventes perdues, recrutement lancé au départ (enceintes)": perduesN,
      "Coût du départ, recrutement lancé au départ": perduesN * marge + 3_000 - nonVerses(4),
      "Coût du départ, recrutement lancé dès l'annonce": Math.max(0, demandeN[1]! - equipeT2(3)) * marge + 3_000 - nonVerses(3),
    });
    expect([perduesN, perduesN * marge + 3_000 - nonVerses(4), 3_000 - nonVerses(3)]).toEqual([381, 5_676, 337.5]);
    // À rebours : lancé le 1er mai, arrivé le 1er juillet ; avril, mai et juin vides.
    expect(MOIS_DU_RECRUTEMENT_A_REBOURS).toBe(5);
    const perduesR = auPlan[1]! - equipeT2(5);
    const coutR = perduesR * marge + 3_000 - nonVerses(5);
    expect(coutR).toBe(28_612.5);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Mois de poste vide": 3,
      "Salaires non versés": 3 * coutMensuel,
      "Marge perdue": coutR - 3_000 + 3 * coutMensuel,
      "Enceintes perdues": (coutR - 3_000 + 3 * coutMensuel) / marge,
    });
    expect((coutR - 3_000 + 3 * coutMensuel) / marge).toBe(1_600);
    // Au trimestre 3, le remplaçant porte l'équipe à 2 100 + 2 400 + 2 400, au-dessus des 6 200 demandées.
    expect(3.5 * parMois + 4 * parMois * 2).toBeGreaterThan(demandeN1[2]!);
    expect(juste(ch, "ce-que-le-calcul-ne-compte-pas")).toBe("Le savoir-faire qui part, et les autres opérateurs qui pourraient suivre");
  });

  it("le cas : recruter dès l'annonce rapporte dès 5 827 enceintes demandées au trimestre 2", () => {
    const s = RECRUTER_DES_L_ANNONCE_DU_DEPART;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La gérante");
    expect(attendus(s, "les-deux-dates")).toEqual({
      "Équipe du trimestre, lancé au départ": equipeT2(4),
      "Équipe du trimestre, lancé dès l'annonce": equipeT2(3),
      "Ventes perdues, lancé au départ": auPlan[1]! - equipeT2(4),
      "Ventes perdues, lancé dès l'annonce": auPlan[1]! - equipeT2(3),
    });
    const tard = 1_300 * marge + 3_000 - nonVerses(4);
    const tot = 700 * marge + 3_000 - nonVerses(3);
    expect(attendus(s, "le-cout-a-chaque-date")).toEqual({ "Coût du départ, lancé au départ": tard, "Coût du départ, lancé dès l'annonce": tot, "Gain du recrutement dès l'annonce": tard - tot });
    expect([tard, tot, tard - tot]).toEqual([24_975, 15_037.5, 9_937.5]);
    // Le recrutement dès l'annonce paie un mois de salaire de plus : il faut 2 662,50 ÷ 21 = 126,79, soit 127 ventes sauvées.
    const enPlus = nonVerses(4) - nonVerses(3);
    const aSauver = Math.ceil(enPlus / marge);
    expect([enPlus, aSauver, equipeT2(4) + aSauver]).toEqual([2_662.5, 127, 5_827]);
    expect(curseur(s, "la-demande-qui-fait-pencher")).toEqual({
      attendu: 5_827,
      bornes: [5_700, 6_300],
      droites: [0, enPlus, (6_300 - 5_700) * marge, enPlus],
      lecture: { "Marge sauvée par le recrutement dès l'annonce": 127 * marge, "Salaire payé de plus": enPlus, "Gain du recrutement dès l'annonce": 127 * marge - enPlus },
    });
    // Le croisement : sur la demande de N (6 081), recruter dès l'annonce rapporte encore.
    expect(attendus(s, "a-rebours")).toEqual({
      "Ventes à sauver pour payer le salaire de plus": aSauver,
      "Demande à partir de laquelle recruter dès l'annonce rapporte": equipeT2(4) + aSauver,
      "Gain du recrutement dès l'annonce, demande de N": (demandeN[1]! - equipeT2(4)) * marge - enPlus,
    });
    expect((demandeN[1]! - equipeT2(4)) * marge - enPlus).toBe(5_338.5);
    expect(recruterDesLAnnonce(cas).verdict).toBe("recruter-des-l-annonce");
    expect(juste(s, "reponse")).toBe("Lançons-le dès aujourd'hui : un mois de salaire en plus sauve 600 ventes");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(RECRUTER_DES_L_ANNONCE_DU_DEPART));
});

describe("entretenir l'outil : la ligne, goulot en N + 1", () => {
  const ch = ENTRETENIR_L_OUTIL;
  const e = f.entretien;
  const q = f.qualite;
  // La fiche, refaite à la main.
  const ref = e.budgetDeReference;
  const unPoint = ref / (e.reparationAuBudgetDeReference * 100);
  const seuil = e.usureParTrimestre * 100 * unPoint;
  const coutMoyen = q.controleFinal.tauxDeDetection * q.coutDUnDefautDetecte + (1 - q.controleFinal.tauxDeDetection) * q.coutDUnDefautLivre;
  const parDefautLivre = q.ventesPerduesParDefautLivre;
  /** La disponibilité de chaque trimestre et du 1er janvier suivant, à 4 budgets : + 1 point par 600 €, au plus 7,5, − 5, entre 30 % et 100 %. */
  const disponibilites = (budgets: number[]) => {
    const d = [1];
    for (let i = 0; i < 4; i++) d.push(Math.min(1, Math.max(0.3, d[i]! + Math.min(budgets[i]!, ref) / unPoint / 100 - e.usureParTrimestre)));
    return d.map((x) => Math.round(x * 1e9) / 1e9);
  };
  /** L'année jouée à 4 budgets, refaite à la main sur la demande donnée : ventes, défauts, effets. */
  const annee = (budgets: number[], demande: readonly number[] = demandeN1) => {
    const d = disponibilites(budgets);
    const plan = demande.map((x) => Math.min(x, ligne, 7_200));
    const ventes = demande.map((x, i) => Math.min(x, Math.floor(ligne * d[i]! + 1e-9), 7_200));
    const perdues = plan.reduce((t, x, i) => t + x - ventes[i]!, 0);
    const defauts = ventes.reduce((t, v, i) => t + v * e.defautsEnPlusSansEntretien * (1 - Math.min(budgets[i]!, ref) / ref), 0);
    const economie = 4 * ref - budgets.reduce((t, b) => t + b, 0);
    const sansLesDefauts = economie - perdues * marge;
    const coutDesDefauts = centime(defauts * coutMoyen);
    const ventesQualite = defauts * (1 - q.controleFinal.tauxDeDetection) * parDefautLivre;
    return { d, ventes, perdues, defauts: centime(defauts), economie, sansLesDefauts, coutDesDefauts, ventesQualite: centime(ventesQualite), avecLesDefauts: centime(sansLesDefauts - coutDesDefauts - ventesQualite * marge) };
  };
  const sansT1 = annee([0, ref, ref, ref]);

  it("la fiche donne les chiffres du monde", () => {
    expect([unPoint, seuil, ref - seuil, coutMoyen]).toEqual([600, 3_000, 1_500, 36]);
    expect(sansT1.d).toEqual([1, 0.95, 0.975, 1, 1]);
    expect(sansT1.ventes).toEqual([5_800, 6_650, 6_200, 7_000]);
    expect([sansT1.perdues, sansT1.sansLesDefauts, sansT1.defauts, sansT1.coutDesDefauts, sansT1.ventesQualite, sansT1.avecLesDefauts]).toEqual([350, -2_850, 174, 6_264, 104.4, -11_306.4]);
  });

  it("le pari et le curseur du seuil : la ligne tient dès 3 000 €, mais les défauts restent", () => {
    expect(juste(ch, "predire-le-seuil")).toBe("Sous un seuil plus bas : la référence répare plus que l'usure");
    expect(curseur(ch, "le-seuil-au-curseur")).toEqual({
      attendu: seuil,
      bornes: [0, ref],
      droites: [0, seuil, ref, seuil],
      lecture: {
        "Coût de la réparation de l'usure": seuil,
        "Économie face au budget de référence": ref - seuil,
        "Marge perdue au trimestre suivant, si l'outil y est le goulot": 0,
        "Coût des défauts en plus, sur les 5 800 enceintes du trimestre": centime(5_800 * 0.01 * coutMoyen),
      },
    });
    expect(centime(5_800 * 0.01 * coutMoyen)).toBe(2_088);
  });

  it("les étapes guidées : le seuil, la ligne après le trimestre sans entretien", () => {
    expect(attendus(ch, "le-seuil")).toEqual({ "Budget qui répare un point": unPoint, "Seuil d'entretien": seuil, "Économie par trimestre au seuil": ref - seuil });
    expect(attendus(ch, "la-disponibilite")).toEqual({
      "Disponibilité au trimestre 2 (%)": 95,
      "Capacité de la ligne au trimestre 2 (enceintes)": ligne * 0.95,
      "Disponibilité au trimestre 3 (%)": 97.5,
      "Capacité de la ligne au trimestre 3 (enceintes)": ligne * 0.975,
    });
  });

  it("le pari et le curseur de la demande : dès 6 865 enceintes au trimestre 2, l'économie se perd", () => {
    expect(juste(ch, "predire-la-perte")).toBe("350 : au plan, la ligne n'en servait que 7 000");
    const outil = ligne * 0.95;
    const demande = outil + Math.ceil(ref / marge);
    expect(demande).toBe(6_865);
    expect(curseur(ch, "la-demande-qui-coute")).toEqual({
      attendu: demande,
      bornes: [outil, ligne],
      droites: [0, ref, (ligne - outil) * marge, ref],
      lecture: { "Marge perdue au trimestre": (demande - outil) * marge, "Entretien économisé": ref, "Effet sur le résultat, sans les défauts": ref - (demande - outil) * marge },
    });
    // La demande de N (6 081) reste sous la ligne amoindrie ; celle de N + 1, plafonnée à 7 000, au-dessus.
    expect(demandeN[1]!).toBeLessThan(outil);
    expect(Math.min(demandeN1[1]!, ligne)).toBeGreaterThan(demande);
  });

  it("les étapes autonomes : le goulot, le verdict, les défauts", () => {
    expect(attendus(ch, "le-goulot")).toEqual({
      "Ventes perdues au trimestre 2 (enceintes)": 350,
      "Ventes perdues au trimestre 3 (enceintes)": 0,
      "Marge perdue sur l'année": 350 * marge,
      "Effet sur le résultat, sans les défauts": ref - 350 * marge,
    });
    // Le distracteur que l'audit trouvait vrai aussi ne l'est plus : l'économie ne tient pas.
    expect(juste(ch, "verdict")).toBe("L'économie se perd : l'outil limitait les ventes au trimestre 2");
    expect(entretienDeLOutil(cas).verdict).toBe("l-economie-se-perd");
    expect(attendus(ch, "les-defauts")).toEqual({
      "Défauts en plus": 5_800 * 0.03,
      "Coût des défauts en plus": 174 * coutMoyen,
      "Ventes perdues par la qualité": 104.4,
      "Effet sur le résultat, défauts compris": centime(ref - 350 * marge - 174 * coutMoyen - 104.4 * marge),
    });
  });

  it("le contraste : sur la demande de N, le même entretien sauté ne coûte aucune vente", () => {
    const n = annee([0, ref, ref, ref], demandeN);
    expect(n.perdues).toBe(0);
    expect(attendus(ch, "la-demande-de-n")).toEqual({
      "Capacité restée libre au trimestre 2 (enceintes)": ligne * 0.95 - demandeN[1]!,
      "Ventes perdues sur l'année, demande de N (enceintes)": 0,
      "Effet sur le résultat, sans les défauts, demande de N": ref,
    });
    expect(ligne * 0.95 - demandeN[1]!).toBe(569);
  });

  it("le pari et le laboratoire de l'entretien : 12 000 € au moins pour ne rien perdre, la référence au meilleur résultat défauts compris", () => {
    expect(juste(ch, "predire-le-meilleur-budget")).toBe("La référence, 4 500 €");
    const l = laboratoire(ch, "le-laboratoire-de-l-entretien");
    expect(l.depart).toEqual({ t1: ref, t2: ref, t3: ref, t4: ref });
    expect(l.solution).toEqual({ t1: seuil, t2: seuil, t3: seuil, t4: seuil });
    expect(l.reussi).toEqual([false, true]);
    expect(l.auDepart).toEqual({
      "Disponibilité au trimestre 2": 100,
      "Disponibilité au trimestre 3": 100,
      "Disponibilité au trimestre 4": 100,
      "Disponibilité au 1er janvier suivant": 100,
      "Ventes perdues par la ligne": 0,
      "Défauts en plus": 0,
      "Entretien économisé": 0,
      "Marge perdue par la ligne": 0,
      "Coût des défauts en plus": 0,
      "Marge des ventes perdues par la qualité": 0,
      "Effet sur le résultat, sans les défauts": 0,
      "Effet sur le résultat, défauts compris": 0,
    });
    const s = annee([seuil, seuil, seuil, seuil]);
    expect([s.defauts, s.coutDesDefauts, s.ventesQualite, s.avecLesDefauts]).toEqual([260, 9_360, 156, -6_636]);
    expect(l.aLaSolution).toEqual({
      "Disponibilité au trimestre 2": 100,
      "Disponibilité au trimestre 3": 100,
      "Disponibilité au trimestre 4": 100,
      "Disponibilité au 1er janvier suivant": 100,
      "Ventes perdues par la ligne": 0,
      "Défauts en plus": s.defauts,
      "Entretien économisé": 4 * (ref - seuil),
      "Marge perdue par la ligne": 0,
      "Coût des défauts en plus": -s.coutDesDefauts,
      "Marge des ventes perdues par la qualité": -s.ventesQualite * marge,
      "Effet sur le résultat, sans les défauts": 4 * (ref - seuil),
      "Effet sur le résultat, défauts compris": s.avecLesDefauts,
    });
    // Le défi, cherché à la main sur la grille des 500 € : 12 000 € au moins, le seuil quatre fois ou 3 000, 1 500, 4 500 et 3 000 €.
    let meilleur = Number.POSITIVE_INFINITY;
    const pas = Array.from({ length: 10 }, (_, i) => i * 500);
    for (const a of pas) for (const b of pas) for (const c of pas) for (const d of pas) {
      const x = annee([a, b, c, d]);
      if (x.perdues === 0 && x.d[4] === 1) meilleur = Math.min(meilleur, a + b + c + d);
    }
    expect(meilleur).toBe(4 * seuil);
    expect(l.atteint({ t1: seuil, t2: seuil / 2, t3: ref, t4: seuil })).toBe(true);
    // Sauter le trimestre 2 empêche la ligne de revenir à 100 % au trimestre 4 : 175 enceintes perdues.
    expect(annee([seuil, 0, ref, seuil]).perdues).toBe(ligne - ligne * 0.975);
    expect(l.atteint({ t1: seuil, t2: 0, t3: ref, t4: seuil })).toBe(false);
    expect(l.atteint({ t1: 2_500, t2: seuil, t3: seuil, t4: seuil })).toBe(false);
  });

  it("le graphique du laboratoire : l'effet sans les défauts culmine au seuil, l'effet défauts compris à la référence", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-entretien");
    expect(l.g!.levier).toBe("t1");
    const a = (t1: number) => l.courbes({ t1, t2: ref, t3: ref, t4: ref });
    const attendu = (t1: number) => {
      const x = annee([t1, ref, ref, ref]);
      return { "Effet sur le résultat, sans les défauts": x.sansLesDefauts, "Effet sur le résultat, défauts compris": x.avecLesDefauts };
    };
    for (const t1 of [0, 1_500, 3_000, 4_500]) expect(a(t1), String(t1)).toEqual(attendu(t1));
    expect(Object.values(a(0))).toEqual([-2_850, -11_306.4]);
    expect(Object.values(a(1_500))).toEqual([3_000 - 175 * marge, centime(3_000 - 175 * marge - (2 / 3) * 174 * (coutMoyen + 0.2 * 3 * marge))]);
    expect(Object.values(a(3_000))).toEqual([1_500, centime(1_500 - 58 * (coutMoyen + 0.2 * 3 * marge))]);
    expect(Object.values(a(4_500))).toEqual([0, 0]);
  });

  it("les étapes d'expert : sauter le trimestre 2, le calcul à rebours, la critique", () => {
    const v = annee([ref, 0, ref, ref]);
    expect(v.d).toEqual([1, 1, 0.95, 0.975, 1]);
    expect(attendus(ch, "au-trimestre-2")).toEqual({
      "Ventes perdues au trimestre 4 (enceintes)": ligne - ligne * 0.975,
      "Effet sur le résultat, sans les défauts": v.sansLesDefauts,
      "Défauts en plus": 7_000 * 0.03,
      "Effet sur le résultat, défauts compris": v.avecLesDefauts,
    });
    expect([v.perdues, v.sansLesDefauts, v.defauts, v.avecLesDefauts]).toEqual([175, 825, 210, -9_381]);
    // À rebours : 98 % au trimestre 4, la ligne à 100 % au trimestre 3 : 2 points perdus, (5 − 2) × 600 € dépensés.
    const budget = (5 - 2) * unPoint;
    const r = annee([ref, ref, budget, ref]);
    expect(r.d[3]).toBe(0.98);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Points de disponibilité perdus": 2,
      "Budget d'entretien du trimestre 3": budget,
      "Effet sur le résultat, sans les défauts": r.sansLesDefauts,
    });
    expect([budget, r.ventes[3], r.sansLesDefauts]).toEqual([1_800, 6_860, -240]);
    expect(juste(ch, "ce-que-vaut-le-chiffre")).toBe("C'est un maximum : aux trimestres 2 et 4, une demande refusée peut remplacer une vente perdue");
  });

  it("le cas : au seuil, la ligne tient, mais les défauts coûtent plus que l'économie", () => {
    const s = ENTRETENIR_AU_SEUIL;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le gérant");
    expect(attendus(s, "economie")).toEqual({ "Seuil d'entretien": seuil, "Économie par trimestre": ref - seuil, "Économie sur l'année": 4 * (ref - seuil) });
    const volume = auPlan.reduce((t, x) => t + x, 0);
    expect(volume).toBe(26_000);
    const points = e.defautsEnPlusSansEntretien * (1 - seuil / ref);
    const defauts = volume * points;
    expect(attendus(s, "les-defauts-au-seuil")).toEqual({
      "Points de taux de défaut en plus": 1,
      "Défauts en plus sur l'année": centime(defauts),
      "Coût des défauts en plus": centime(defauts * coutMoyen),
      "Ventes perdues par la qualité": centime(defauts * 0.2 * parDefautLivre),
    });
    expect([centime(defauts), centime(defauts * coutMoyen), centime(defauts * 0.2 * parDefautLivre)]).toEqual([260, 9_360, 156]);
    // Un défaut en plus coûte 36 € et 0,6 vente à 21 € : 48,60 €. L'économie et les défauts suivent tous deux (référence − budget) : ils ne se croisent qu'à la référence.
    const parDefaut = coutMoyen + 0.2 * parDefautLivre * marge;
    expect(centime(parDefaut)).toBe(48.6);
    expect(curseur(s, "le-budget-qui-paie")).toEqual({
      attendu: ref,
      bornes: [seuil, ref],
      droites: [4 * (ref - seuil), centime(defauts * parDefaut), 0, 0],
      lecture: { "Entretien économisé sur l'année": 0, "Coût des défauts en plus": 0, "Marge des ventes perdues par la qualité": 0, "Effet sur le résultat de l'année": 0 },
    });
    expect(attendus(s, "a-rebours")).toEqual({
      "Coût d'un défaut en plus, ventes perdues comprises": 48.6,
      "Défauts que l'économie pourrait payer": centime(6_000 / 48.6),
      "Effet de l'entretien au seuil sur le résultat": 6_000 - 260 * 48.6,
      "Défauts coûtés par euro coupé": centime((260 * 48.6) / 6_000),
    });
    expect([centime(6_000 / 48.6), 6_000 - 260 * 48.6, centime((260 * 48.6) / 6_000)]).toEqual([123.46, -6_636, 2.11]);
    expect(entretienAuSeuil(cas).verdict).toBe("les-defauts-coutent-plus");
    expect(juste(s, "reponse")).toBe("Refusons : au seuil, les défauts coûtent plus que l'économie");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(ENTRETENIR_AU_SEUIL));
});
