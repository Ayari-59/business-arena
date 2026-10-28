import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  BUDGET_DE_TRESORERIE,
  DECALAGE_DU_CURSEUR,
  DELAI_DU_PARI,
  LEVIERS_DU_LABORATOIRE,
  MOIS_AUTONOME,
  VENTES_DU_CURSEUR,
} from "../../src/config/cours/chapitres/budget-de-tresorerie";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { COMMANDE_EN_PLUS, MOIS_DE_LA_COMMANDE, UN_TRIMESTRE_DE_CROISSANCE } from "../../src/config/cours/situations/par-chapitre/un-trimestre-de-croissance";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE BUDGET DE TRÉSORERIE, SUR LE SEMESTRE DE NOVA DU MONDE DU COURS, ET SON CAS : UN TRIMESTRE DE
 * CROISSANCE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/nova-gestion.ts), par un budget
 * écrit en clair dans ce fichier, mois par mois, sans les fonctions du chapitre ni le modèle
 * (monde/couts-et-budgets.ts) ; les valeurs absolues sont épinglées, les curseurs (attendu, position
 * voisine, droites aux bornes, lecture), le laboratoire (au départ, à la solution, ce que chaque levier
 * doit valoir seul, ses courbes en quelques points) et les verdicts aussi. Puis les gardes de texte de
 * l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, RECOPIÉE, ET UN BUDGET DE TRÉSORERIE ÉCRIT À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

const PRIX = 59;
const COMPOSANTS = 22;
const AUTRES = 16;
const TVA = 0.2;
const LOYER = 19_700;
const NET = 5_850;
const COTISATIONS = 4_800;
const DEPART = 25_000;
const FIXES_DU_MOIS = 31_183;
const PARTICULIERS = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831];
const CAMPUSTECH = [320, 320, 320, 320, 320, 320];
const BANC = 30_000;
const NOMS = ["janvier", "février", "mars", "avril", "mai", "juin"];
/** Le mois de 30 jours : une facture du jour j à d jours se paie ⌈(j + d) ÷ 30⌉ − 1 mois plus tard. */
const decalage = (jour: number, delai: number) => (delai <= 0 ? 0 : Math.ceil((jour + delai) / 30) - 1);

interface Hypotheses {
  particuliers?: readonly number[];
  campustech?: readonly number[];
  delaiCampusTech?: number;
  delaiFournisseur?: number;
  hausse?: number;
  /** Le mois de l'achat du banc (0 pour janvier), ou rien. */
  banc?: number | null;
}

/** Le budget du semestre, mois par mois, refait en clair ; et le résultat du semestre. */
function budgetALaMain(h: Hypotheses = {}) {
  const p = (h.particuliers ?? PARTICULIERS).map((q) => Math.round(q * (1 + (h.hausse ?? 0))));
  const ct = (h.campustech ?? CAMPUSTECH).map((q) => Math.round(q * (1 + (h.hausse ?? 0))));
  const q = p.map((x, k) => x + ct[k]!);
  const mCT = decalage(20, h.delaiCampusTech ?? 80);
  const mF = decalage(10, h.delaiFournisseur ?? 22);
  const ttc = (x: number) => c(x * (1 + TVA));
  let tresorerie = DEPART;
  let credit = 0;
  let tvaDue = 0;
  let capital = 80_000;
  const mois = NOMS.map((nom, k) => {
    const encCT = ct.reduce((t, x, j) => (j + mCT === k ? c(t + ttc(x * PRIX)) : t), 0);
    const enc = c(ttc(p[k]! * PRIX) + encCT);
    const fournisseur = q.reduce((t, x, j) => (j + mF === k ? c(t + ttc(x * COMPOSANTS)) : t), 0);
    const echeance = k === 2 || k === 5 ? c(4_000 + (capital * 0.05) / 4) : 0;
    if (echeance) capital -= 4_000;
    const banc = h.banc === k ? ttc(BANC) : 0;
    const tvaPayee = tvaDue;
    const dec = c(fournisseur + ttc(q[k]! * AUTRES) + LOYER + NET + (k > 0 ? COTISATIONS : 0) + tvaPayee + echeance + banc);
    const debut = tresorerie;
    tresorerie = c(debut + enc - dec);
    const solde = c(q[k]! * PRIX * TVA - q[k]! * (COMPOSANTS + AUTRES) * TVA - (h.banc === k ? BANC * TVA : 0) - credit);
    tvaDue = Math.max(0, solde);
    credit = Math.max(0, -solde);
    return { nom, quantite: q[k]!, enc, dec, fournisseur, tvaPayee, echeance, debut, fin: tresorerie };
  });
  const creances = ct.reduce((t, x, j) => (j + mCT > 5 ? c(t + ttc(x * PRIX)) : t), 0);
  const plusBas = mois.reduce((a, b) => (b.fin < a.fin ? b : a));
  const usure = h.banc != null ? (6 - h.banc) * (BANC / 60) : 0;
  const resultat = q.reduce((t, x) => t + x * (PRIX - COMPOSANTS - AUTRES), 0) - 6 * FIXES_DU_MOIS - usure;
  return { mois, fins: mois.map((m) => m.fin), creances, plusBas, juin: tresorerie, resultat };
}

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS DE L'ÉTALON
// ─────────────────────────────────────────────────────────────────────────────

function textesDe(e: Etape, x: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(x);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(x), e.repere?.(x) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(x, etat), ...e.options(x, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(x, etat), ...e.champs(x, etat).flatMap((y) => [y.libelle, y.calcul, String(y.attendu)]), ...e.explication(x, etat), ...tableau];
    case "curseur": {
      const k = e.cible(x);
      const g = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      return [
        e.titre,
        e.question(x),
        d.consigne,
        d.indice(depart),
        ...e.explication(x, d.solution),
        ...e.lecture(x, d.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite, ...(l.choix ?? []).map((y) => y.libelle)]),
        ...(e.graphique?.(x).courbes.map((y) => y.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "payé", "facturé", "encaissé"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre, x: Cas = cas) {
  const chapitre = chapitreDuCas(ch, x);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((y) => y.code));
  const u = x.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, x, i);
    for (const t of textesDe(e, x, etat)) {
      expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(t, `${e.id} : ${t}`).not.toMatch(/ [-–—] /);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(t)) expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s(])-\d/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|mois|factures?|clientèles?|voyants?)\b/i);
      if (UNITES_FEMININES.has(u)) expect(t, `${e.id} : ${t}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(x);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(x, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(x, etat);
      expect(new Set(champs.map((y) => y.libelle)).size, e.id).toBe(champs.length);
      for (const y of champs) {
        expect(Number.isFinite(y.attendu), `${e.id} : ${y.libelle}`).toBe(true);
        expect(Math.round(y.attendu * 100) / 100, `${e.id} : ${y.libelle}`).toBe(y.attendu);
      }
      // Un montant négatif à donner : la question dit avec quel signe.
      if (champs.some((y) => y.attendu < 0)) expect(e.question(x, etat), e.id).toMatch(/négati(f|ve) (pour|sous)/);
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
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
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
  const couvre = (q: number) => d.produit(q) >= d.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(c),
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
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
  ["DCG UE11 · Contrôle de gestion", "dcg"],
  ["BUT GACO · Participer au pilotage interne de l'organisation", "but-gaco"],
  ["BUT GEA · Concevoir des outils de contrôle de gestion", "but-gea"],
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// LES TESTS
// ─────────────────────────────────────────────────────────────────────────────

const ch = BUDGET_DE_TRESORERIE;
const base = budgetALaMain();
const avecLeBanc = budgetALaMain({ banc: 3 });

describe("le budget de trésorerie, chez NOVA dans le monde du cours", () => {
  it("se joue chez NOVA seule, au palier 4 du contrôle de gestion, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(UN_TRIMESTRE_DE_CROISSANCE);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.libre).toBe(false);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    for (const [b, ref] of BLOCS) {
      expect(ch.blocs, b).toContain(b);
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(new Set(ch.etapes.map((e) => e.id)).size).toBe(ch.etapes.length);
  });

  it("la fiche recopiée est bien celle du monde, et le budget à la main retombe sur les trésoreries de la consigne", () => {
    const s = NOVA_GESTION.semestre;
    expect(s.clienteles.map((x) => [x.code, [...x.quantites], x.jourDeFacturation, x.delai])).toEqual([
      ["particuliers", PARTICULIERS, 30, 0],
      ["campustech", CAMPUSTECH, 20, 80],
    ]);
    expect([NOVA_GESTION.moisDeReference.prix, NOVA_GESTION.moisDeReference.coutVariable, s.tauxDeTva, s.tresorerieDeDepart, s.paie]).toEqual([PRIX, { composants: COMPOSANTS, autres: AUTRES }, TVA, DEPART, { net: NET, cotisations: COTISATIONS }]);
    expect([s.fournisseur.jourDeFacturation, s.fournisseur.delai, s.investissement.montantHt, s.investissement.mois, s.investissement.dureeDAmortissementMois]).toEqual([10, 22, BANC, 3, 60]);
    expect(NOVA_GESTION.moisDeReference.chargesFixes).toEqual({ loyer: LOYER, personnel: NET + COTISATIONS, amortissement: FIXES_DU_MOIS - LOYER - NET - COTISATIONS });
    expect(base.fins).toEqual([58_838, 31_998, 19_302.8, 33_810, 50_068, 63_641.6]);
    expect(avecLeBanc.fins).toEqual([58_838, 31_998, 19_302.8, -2_190, 20_068, 33_641.6]);
    expect(base.creances).toBe(3 * 320 * 59 * 1.2);
    expect(base.plusBas.nom).toBe("mars");
    expect(base.resultat).toBe(40_941);
  });

  it("les étapes guidées : l'échéance, les encaissements, la TVA et les décaissements d'avril", () => {
    expect(juste(ch, "le-mois-de-l-echeance")).toBe("En avril");
    expect(decalage(20, 80)).toBe(3);
    expect(attendus(ch, "les-encaissements-d-avril")).toEqual({
      "Ventes TTC d'avril aux particuliers": c(1_580 * 59 * 1.2),
      "Facture TTC de janvier de CampusTech": c(320 * 59 * 1.2),
      "Encaissements d'avril": c(1_580 * 59 * 1.2 + 320 * 59 * 1.2),
    });
    expect(Object.values(attendus(ch, "les-encaissements-d-avril"))).toEqual([111_864, 22_656, 134_520]);
    // La TVA de mars, payée en avril : 1 738 enceintes vendues, toutes clientèles.
    expect(attendus(ch, "la-tva-a-decaisser")).toEqual({
      "TVA collectée de mars": c(1_738 * 59 * 0.2),
      "TVA déductible de mars": c(1_738 * 38 * 0.2),
      "TVA à décaisser en avril": c(1_738 * 21 * 0.2),
    });
    expect(Object.values(attendus(ch, "la-tva-a-decaisser"))).toEqual([20_508.4, 13_208.8, 7_299.6]);
    const decAvril = c(1_738 * 22 * 1.2 + 1_900 * 16 * 1.2 + LOYER + NET + COTISATIONS + 7_299.6);
    expect(attendus(ch, "les-decaissements-d-avril")).toEqual({
      "Paiement au fournisseur en avril": c(1_738 * 22 * 1.2),
      "Autres coûts variables TTC d'avril": c(1_900 * 16 * 1.2),
      "Décaissements d'avril": decAvril,
      "Trésorerie de fin d'avril": c(19_302.8 + 134_520 - decAvril),
    });
    expect([decAvril, c(19_302.8 + 134_520 - decAvril)]).toEqual([120_012.8, 33_810]);
    expect(base.mois[3]!.dec).toBe(decAvril);
  });

  it("l'étape autonome : le mois de mars refait seul, avec l'échéance de l'emprunt", () => {
    expect(MOIS_AUTONOME).toBe(2);
    const mars = base.mois[2]!;
    expect(attendus(ch, "mars-sans-aide")).toEqual({
      "Encaissements de mars": c(1_418 * 59 * 1.2),
      "Paiement au fournisseur en mars": c(1_450 * 22 * 1.2),
      "TVA payée en mars": c(1_450 * 21 * 0.2),
      "Échéance de l'emprunt": 4_000 + (80_000 * 0.05 * 3) / 12,
      "Trésorerie de fin de mars": mars.fin,
    });
    expect([mars.enc, mars.fournisseur, mars.tvaPayee, mars.echeance, mars.fin]).toEqual([100_394.4, 38_280, 6_090, 5_000, 19_302.8]);
    expect(juste(ch, "le-point-bas")).toBe("CampusTech n'a encore rien payé, et l'échéance de l'emprunt tombe");
    // Février vend moins que mars : le point bas ne vient pas des ventes du mois.
    expect(base.mois[1]!.quantite).toBeLessThan(base.mois[2]!.quantite);
  });

  it("le curseur du délai de CampusTech, refait à la main : au plus 5 mois de décalage", () => {
    // Chaque mois de décalage repousse une facture de 22 656 € après le 30 juin : juin = 131 609,60 − 22 656 × m.
    const juin = (m: number) => budgetALaMain({ delaiCampusTech: 30 * (m + 1) - 20 }).juin;
    expect([0, 1, 2, 3, 4, 5, 6].map(juin)).toEqual([0, 1, 2, 3, 4, 5, 6].map((m) => c(63_641.6 + (3 - m) * 22_656)));
    expect(DECALAGE_DU_CURSEUR).toEqual({ min: 0, max: 6 });
    const a5 = budgetALaMain({ delaiCampusTech: 160 });
    expect(curseur(ch, "le-delai-au-curseur")).toEqual({
      attendu: 5,
      bornes: [0, 6],
      droites: [juin(0), 0, juin(6), 0],
      lecture: {
        "Encaissements de CampusTech sur le semestre": 22_656,
        "Créances sur CampusTech au 30 juin": 5 * 22_656,
        "Trésorerie la plus basse du semestre": a5.plusBas.fin,
        "Trésorerie au 30 juin": juin(5),
      },
    });
    expect([juin(0), juin(5), juin(6), a5.plusBas.fin, a5.plusBas.nom]).toEqual([131_609.6, 18_329.6, -4_326.4, 4_756, "mai"]);
    expect(juste(ch, "predire-le-delai")).toBe("Baisse, mais reste positive");
    expect(DELAI_DU_PARI).toBe(160);
  });

  it("le délai le plus long, à rebours : 160 jours", () => {
    // 20 + d ≤ 6 × 30 : à 160 jours, la facture de janvier tombe en juin ; à 161, en juillet.
    expect([decalage(20, 160), decalage(20, 161)]).toEqual([5, 6]);
    expect(attendus(ch, "le-delai-a-rebours")).toEqual({
      "Délai le plus long accordable, en jours": 6 * 30 - 20,
      "Créances sur CampusTech au 30 juin": 5 * 22_656,
      "Trésorerie au 30 juin, à ce délai": c(63_641.6 - (5 - 3) * 22_656),
    });
    expect(budgetALaMain({ delaiCampusTech: 160 }).creances).toBe(113_280);
  });

  it("le pari et le curseur du banc : le plus petit nombre d'enceintes d'avril qui évite le découvert", () => {
    expect(juste(ch, "predire-le-banc")).toBe("Négative : 36 000 € TTC sortent d'un coup");
    // Une enceinte de plus en avril : 70,80 € encaissés, 19,20 € d'autres coûts payés dans le mois.
    const avril = (q: number) => budgetALaMain({ banc: 3, particuliers: PARTICULIERS.map((x, k) => (k === 3 ? q : x)) }).mois[3]!;
    expect(avril(1_623).fin).toBe(c(-2_190 + 43 * (70.8 - 19.2)));
    expect(VENTES_DU_CURSEUR).toEqual({ min: 1_500, max: 1_700 });
    expect(curseur(ch, "les-ventes-au-curseur")).toEqual({
      attendu: 1_580 + Math.ceil(2_190 / 51.6),
      bornes: [1_500, 1_700],
      droites: [avril(1_500).fin, 0, avril(1_700).fin, 0],
      lecture: { "Encaissements du mois": avril(1_623).enc, "Décaissements du mois, banc compris": avril(1_623).dec, "Trésorerie de fin de mois": avril(1_623).fin },
    });
    expect([avril(1_500).fin, avril(1_622).fin, avril(1_623).fin, avril(1_623).enc, avril(1_623).dec]).toEqual([-6_318, -22.8, 28.8, 137_564.4, 156_838.4]);
  });

  it("le minimum de ventes, à rebours, et ce qu'il fait sortir le mois suivant", () => {
    expect(attendus(ch, "le-minimum-a-rebours")).toEqual({
      "Ce qu'une enceinte de plus laisse en banque fin d'avril": c(59 * 1.2 - 16 * 1.2),
      "Enceintes à vendre en plus": Math.ceil(2_190 / 51.6),
      "Ventes minimales d'avril aux particuliers": 1_580 + 43,
      "Ce que ces enceintes font sortir en mai": c(43 * (22 * 1.2 + 21 * 0.2)),
    });
    expect(Object.values(attendus(ch, "le-minimum-a-rebours"))).toEqual([51.6, 43, 1_623, 1_315.8]);
    // Le mois suivant le paie bien : mai garde ce que les 43 enceintes ont laissé en avril, moins 1 315,80 €.
    const plus = budgetALaMain({ banc: 3, particuliers: PARTICULIERS.map((x, k) => (k === 3 ? 1_623 : x)) });
    expect(c(plus.fins[4]! - avecLeBanc.fins[4]!)).toBe(c(43 * 51.6 - 1_315.8));
  });

  it("le laboratoire : le banc d'avril sans découvert, et ce que chaque levier doit valoir seul", () => {
    const l = laboratoire(ch, "le-laboratoire-de-tresorerie");
    expect(l.depart).toEqual({ campustech: 80, fournisseur: 22, hausse: 0, achat: 3 });
    expect(l.solution).toEqual({ campustech: 70, fournisseur: 22, hausse: 0, achat: 3 });
    expect(l.reussi).toEqual([false, true]);
    expect(LEVIERS_DU_LABORATOIRE).toEqual({ campustech: { min: 0, max: 180, pas: 10 }, fournisseur: { min: 0, max: 90, pas: 1 }, hausse: { min: -10, max: 20, pas: 1 } });
    const lire = (b: ReturnType<typeof budgetALaMain>) => ({
      "Trésorerie de fin d'avril": b.fins[3],
      "Trésorerie de fin de mai": b.fins[4],
      "Trésorerie au 30 juin": b.juin,
      "Créances clients au 30 juin": b.creances,
      "Dettes fournisseurs au 30 juin": c(2_151 * 22 * 1.2),
      "Résultat du semestre": b.resultat,
      "Trésorerie la plus basse du semestre": b.plusBas.fin,
    });
    expect(l.auDepart).toEqual(lire(avecLeBanc));
    const solution = budgetALaMain({ banc: 3, delaiCampusTech: 70 });
    expect(l.aLaSolution).toEqual(lire(solution));
    expect([solution.fins[3], solution.plusBas.fin, solution.resultat, solution.creances]).toEqual([20_466, 20_466, 40_941 - 1_500, 2 * 22_656]);
    // Chaque levier seul : CampusTech à 70 jours au plus (une facture de plus avant fin avril), le
    // fournisseur à 51 jours au moins, 2 % de ventes en plus, ou l'achat en mai.
    const passe = (h: Hypotheses) => budgetALaMain({ banc: 3, ...h }).plusBas.fin >= 0;
    expect([passe({ delaiCampusTech: 70 }), passe({ delaiCampusTech: 80 })]).toEqual([true, false]);
    expect([passe({ delaiFournisseur: 51 }), passe({ delaiFournisseur: 50 })]).toEqual([true, false]);
    expect([passe({ hausse: 0.02 }), passe({ hausse: 0.01 })]).toEqual([true, false]);
    expect(budgetALaMain({ banc: 4 }).plusBas.fin).toBeGreaterThanOrEqual(0);
    expect(budgetALaMain({ banc: 4 }).fins[4]).toBe(c(50_068 - 36_000));
    for (const [code, v, ok] of [
      ["campustech", 70, true],
      ["campustech", 80, false],
      ["fournisseur", 51, true],
      ["fournisseur", 50, false],
      ["hausse", 2, true],
      ["hausse", 1, false],
      ["achat", 4, true],
    ] as const) {
      expect(l.d.atteint({ ...l.depart, [code]: v }), `${code} à ${v}`).toBe(ok);
    }
    expect(l.e.explication(cas, l.solution).join(" ")).toMatch(/70 jours au plus.*51 jours au moins.*2 % de ventes en plus.*l'achat en mai/);
    // Les délais ne changent pas le résultat ; la hausse des ventes, si.
    const resultat = (p: Record<string, number>) => l.e.lecture(cas, p).find((x) => x.libelle === "Résultat du semestre")!.montant;
    expect(resultat({ ...l.depart, campustech: 0, fournisseur: 60 })).toBe(avecLeBanc.resultat);
    expect(resultat({ ...l.depart, hausse: 2 })).toBe(budgetALaMain({ banc: 3, hausse: 0.02 }).resultat);
  });

  it("le graphique du laboratoire : la trésorerie va par marches selon le délai de CampusTech", () => {
    const { e, depart } = laboratoire(ch, "le-laboratoire-de-tresorerie");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("campustech");
    const [avril, plusBas] = g.courbes;
    const en = (d: number) => [avril!.valeur({ ...depart, campustech: d }), plusBas!.valeur({ ...depart, campustech: d })];
    // Avril reçoit les factures de janvier à avril − m : 4, 3, 2, 1 ou 0 factures de 22 656 €.
    expect(en(0)).toEqual([c(-2_190 + 3 * 22_656), c(-2_190 + 3 * 22_656)]);
    expect(en(40)).toEqual([c(-2_190 + 2 * 22_656), c(-2_190 + 2 * 22_656)]);
    expect(en(70)).toEqual([20_466, 20_466]);
    expect(en(80)).toEqual([-2_190, -2_190]);
    expect(en(110)).toEqual([c(-2_190 - 22_656), c(-2_190 - 22_656)]);
    // À 140 jours, le point bas passe en mai ; à 170, en juin.
    expect(budgetALaMain({ banc: 3, delaiCampusTech: 140 }).plusBas).toMatchObject({ nom: "mai", fin: c(20_068 - 2 * 22_656) });
    expect(en(140)).toEqual([c(-2_190 - 22_656), c(20_068 - 2 * 22_656)]);
    expect(en(170)[1]).toBe(c(33_641.6 - 3 * 22_656));
  });

  it("la TVA du banc : la déclaration d'avril, payée en mai", () => {
    expect(attendus(ch, "la-tva-du-banc")).toEqual({
      "TVA collectée d'avril": c(1_900 * 59 * 0.2),
      "TVA déductible d'avril, banc compris": c(1_900 * 38 * 0.2 + BANC * 0.2),
      "TVA à décaisser en mai": c(1_900 * 21 * 0.2 - BANC * 0.2),
      "Trésorerie de fin de mai, banc acheté": avecLeBanc.fins[4],
    });
    expect(Object.values(attendus(ch, "la-tva-du-banc"))).toEqual([22_420, 20_440, 1_980, 20_068]);
    expect(avecLeBanc.mois[4]!.tvaPayee).toBe(1_980);
  });

  it("les verdicts : la TVA due à la livraison, le dirigeant qui négocie avant, la synthèse", () => {
    expect(juste(ch, "la-tva-de-campustech")).toBe("En février, avant d'être payée");
    expect(juste(ch, "que-faire-du-decouvert")).toBe("Il négocie dès janvier ce qui manquera : un découvert autorisé, un délai, ou il décale l'achat");
    const synthese = ch.etapes.find((e) => e.id === "synthese")!;
    if (synthese.type !== "lecture") throw new Error("lecture attendue");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const t = synthese.tableau!(cas);
    expect(t.lignes.find((l) => l.libelle === "Trésorerie de fin de mois")!.valeurs).toEqual(["58 838 €", "31 998 €", "19 302,80 €", "33 810 €", "50 068 €", "63 641,60 €"]);
    // La TVA de chaque mois, 4,20 € par enceinte, payée le mois suivant.
    expect([1_590, 1_450, 1_738, 1_900, 2_030].map((q) => c(q * 4.2))).toEqual([6_678, 6_090, 7_299.6, 7_980, 8_526]);
    expect(t.lignes.find((l) => l.libelle === "TVA à décaisser")!.valeurs).toEqual(["0 €", "6 678 €", "6 090 €", "7 299,60 €", "7 980 €", "8 526 €"]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : un trimestre de croissance", () => {
  const s = UN_TRIMESTRE_DE_CROISSANCE;
  const commande = CAMPUSTECH.map((q, k) => (k >= 3 ? q + 300 : q));
  const avec = budgetALaMain({ campustech: commande });
  const avecBanc = budgetALaMain({ campustech: commande, banc: 3 });

  it("est le cas dédié du chapitre, chez NOVA, et la commande tient dans la capacité", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le dirigeant");
    expect([COMMANDE_EN_PLUS, MOIS_DE_LA_COMMANDE]).toEqual([300, 3]);
    expect(1_900 + 2_030 + 2_151 + 3 * 300).toBeLessThanOrEqual(NOVA_GESTION.decision.capacite);
  });

  it("un mois de commande, et la trésorerie du trimestre, refaits à la main", () => {
    expect(attendus(s, "un-mois-de-commande")).toEqual({
      "Facture TTC du mois à CampusTech": c(300 * 59 * 1.2),
      "Autres coûts variables TTC, payés dans le mois": c(300 * 16 * 1.2),
      "Composants TTC, payés le mois suivant": c(300 * 22 * 1.2),
      "TVA à décaisser le mois suivant": c(300 * 21 * 0.2),
    });
    expect(Object.values(attendus(s, "un-mois-de-commande"))).toEqual([21_240, 5_760, 7_920, 1_260]);
    expect(attendus(s, "la-tresorerie-du-trimestre")).toEqual({
      "Trésorerie de fin d'avril": c(33_810 - 5_760),
      "Trésorerie de fin de mai": c(50_068 - 2 * 5_760 - (7_920 + 1_260)),
      "Trésorerie au 30 juin": c(63_641.6 - 3 * 5_760 - 2 * (7_920 + 1_260)),
      "Créances sur CampusTech au 30 juin": c(3 * 620 * 59 * 1.2),
    });
    expect(avec.fins.slice(3)).toEqual([28_050, 29_368, 28_001.6]);
    expect(avec.creances).toBe(131_688);
  });

  it("le croisement : le résultat monte de 18 900 €, la trésorerie baisse de 35 640 €", () => {
    expect(attendus(s, "le-croisement")).toEqual({
      "Résultat en plus sur le trimestre": 900 * 21,
      "Créances en plus au 30 juin": 3 * 21_240,
      "Dettes en plus au 30 juin": 7_920 + 1_260,
      "Variation de la trésorerie du 30 juin": c(28_001.6 - 63_641.6),
    });
    // Le passage : résultat − créances en plus + dettes en plus = variation de la trésorerie.
    expect(c(18_900 - 63_720 + 9_180)).toBe(-35_640);
    expect(c(avec.resultat - base.resultat)).toBe(18_900);
  });

  it("à rebours : avec la commande, le banc ne passe qu'avec CampusTech à 70 jours au plus", () => {
    expect(avecBanc.fins.slice(3)).toEqual([-7_950, -632, -1_998.4]);
    expect(attendus(s, "a-rebours")).toEqual({
      "Trésorerie de fin d'avril, banc compris": c(28_050 - 36_000),
      "Délai le plus long de CampusTech, en jours": 3 * 30 - 20,
      "Trésorerie de fin d'avril, à ce délai": c(-7_950 + 22_656),
    });
    const a70 = budgetALaMain({ campustech: commande, banc: 3, delaiCampusTech: 70 });
    const a71 = budgetALaMain({ campustech: commande, banc: 3, delaiCampusTech: 71 });
    expect(a70.fins.slice(3)).toEqual([14_706, 22_024, 41_897.6]);
    expect(a70.plusBas.fin).toBeGreaterThanOrEqual(0);
    expect(a71.plusBas.fin).toBeLessThan(0);
  });

  it("la réponse demande un jugement : accepter la commande, financer le banc", () => {
    expect(juste(s, "reponse")).toBe("Oui à la commande, mais le banc d'avril demande un financement, ou CampusTech à 70 jours");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
