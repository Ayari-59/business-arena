import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CIBLE_DE_L_INDICE,
  DELAI_DU_PARI,
  DELAI_SI_RETARD,
  LEVIERS_DES_VOYANTS,
  MOIS_GUIDE,
  TABLEAU_DE_BORD,
  VENTES_DU_CURSEUR,
} from "../../src/config/cours/chapitres/tableau-de-bord";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { INDICE_DU_VOYANT, REGLER_LE_VOYANT, VENTES_DU_SEMESTRE_AU_CURSEUR } from "../../src/config/cours/situations/par-chapitre/regler-le-voyant";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LE TABLEAU DE BORD, SUR LE SEMESTRE DE NOVA DU MONDE DU COURS, ET SON CAS : RÉGLER LE VOYANT DE
 * SÉCURITÉ.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche (monde/nova-gestion.ts) : les
 * indicateurs de chaque mois, les voyants, et la trésorerie par un budget écrit en clair dans ce
 * fichier, sans les fonctions du chapitre ni le modèle (monde/couts-et-budgets.ts). Les valeurs
 * absolues sont épinglées, les curseurs (attendu, position voisine, droites aux bornes, lecture), le
 * laboratoire (au départ, à la solution, les autres solutions, ses courbes en quelques points) et les
 * verdicts aussi. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const dixieme = (x: number) => Math.round(x * 10) / 10 + 0;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, RECOPIÉE, ET LE SEMESTRE ÉCRIT À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

const PRIX = 59;
const CV = 38;
const FIXES = 31_183;
const Q = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151];
const PARTICULIERS = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831];
const MARCHE = [6_000, 5_600, 6_500, 7_400, 8_300, 9_200];
const NOMS = ["janvier", "février", "mars", "avril", "mai", "juin"];
const SEUIL = c((FIXES * PRIX) / (PRIX - CV));
const ALERTE = { indice: 0.05, resultat: 0, tresorerie: 10_000, part: 0.25 };

/** La trésorerie de fin de chaque mois, refaite en clair (le budget du chapitre précédent). CampusTech paie à 60 jours. */
function tresorerieALaMain(h: { prix?: number; publicite?: number; delaiCampusTech?: number; banc?: number | null } = {}) {
  const prix = h.prix ?? PRIX;
  const pub = h.publicite ?? 0;
  const mCT = (h.delaiCampusTech ?? 60) <= 0 ? 0 : Math.ceil((20 + (h.delaiCampusTech ?? 60)) / 30) - 1;
  let t = 25_000;
  let tvaDue = 0;
  let credit = 0;
  let capital = 80_000;
  return NOMS.map((_, k) => {
    const enc = c(PARTICULIERS[k]! * prix * 1.2 + (k - mCT >= 0 ? 320 * prix * 1.2 : 0));
    const echeance = k === 2 || k === 5 ? c(4_000 + (capital * 0.05) / 4) : 0;
    if (echeance) capital -= 4_000;
    const banc = h.banc === k ? 36_000 : 0;
    const dec = c((k > 0 ? Q[k - 1]! * 22 * 1.2 : 0) + Q[k]! * 16 * 1.2 + pub * 1.2 + 19_700 + 5_850 + (k > 0 ? 4_800 : 0) + tvaDue + echeance + banc);
    t = c(t + enc - dec);
    const solde = c(Q[k]! * prix * 0.2 - Q[k]! * 38 * 0.2 - pub * 0.2 - (h.banc === k ? 6_000 : 0) - credit);
    tvaDue = Math.max(0, solde);
    credit = Math.max(0, -solde);
    return t;
  });
}

const TRESORERIE = tresorerieALaMain();
/** L'hypothèse de la divergence : CampusTech paierait 20 jours en retard, à 80 jours. */
const TRESORERIE_EN_RETARD = tresorerieALaMain({ delaiCampusTech: 80 });
/** Un montant comme le cours l'écrit (montantEcrit), refait ici. */
const eur = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 }).replace("-", "−")} €`;
const MOIS = Q.map((q, k) => {
  const ca = q * PRIX;
  const resultat = q * (PRIX - CV) - FIXES;
  const indice = (ca - SEUIL) / ca;
  const part = q / MARCHE[k]!;
  return { nom: NOMS[k]!, q, ca, resultat, indice, part, tresorerie: TRESORERIE[k]!, voyants: { indice: indice < ALERTE.indice, resultat: resultat < 0, tresorerie: TRESORERIE[k]! < ALERTE.tresorerie, part: part < ALERTE.part } };
});

/** Le semestre d'une position du laboratoire, refait en clair. */
function semestreALaMain(p: { prix: number; publicite: number; campustech: number; banc: number }) {
  const ca = Q.reduce((t, q) => t + q * p.prix, 0);
  const fixes = 6 * FIXES + 6 * p.publicite + (p.banc > 0 ? (6 - p.banc) * 500 : 0);
  const marge = Q.reduce((t, q) => t + q * (p.prix - CV), 0);
  const seuil = c((fixes * ca) / marge);
  const tresorerie = tresorerieALaMain({ prix: p.prix, publicite: p.publicite, delaiCampusTech: p.campustech, banc: p.banc > 0 ? p.banc : null });
  const plusBas = Math.min(...tresorerie);
  const resultat = c(marge - fixes);
  const indice = (ca - seuil) / ca;
  const part = Q.reduce((t, q) => t + q, 0) / MARCHE.reduce((t, x) => t + x, 0);
  const voyants = [indice < ALERTE.indice, resultat < 0, plusBas < ALERTE.tresorerie, part < ALERTE.part];
  return { ca, resultat, indice, part, plusBas, voyants: voyants.filter(Boolean).length, tresorerieAllumee: voyants[2], resultatAllume: voyants[1] };
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
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((y) => y.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const t of textesDe(e, cas, etat)) {
      expect(t, `${e.id} : ${t}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(t, `${e.id} : ${t}`).not.toMatch(/ [-–—] /);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/mises? en situation/i);
      if (!/^-?\d+(\.\d+)?$/.test(t)) expect(t, `${e.id} : ${t}`).not.toMatch(/(^|[\s(])-\d/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\+ −/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(t, `${e.id} : ${t}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|mois|indices?|voyants?|comptes|budgets)\b/i);
      if (UNITES_FEMININES.has(u)) expect(t, `${e.id} : ${t}`).not.toMatch(masculinFautif);
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
      expect(new Set(champs.map((y) => y.libelle)).size, e.id).toBe(champs.length);
      for (const y of champs) {
        expect(Number.isFinite(y.attendu), `${e.id} : ${y.libelle}`).toBe(true);
        expect(Math.round(y.attendu * 100) / 100, `${e.id} : ${y.libelle}`).toBe(y.attendu);
      }
      // Un montant négatif à donner : la question dit avec quel signe.
      if (champs.some((y) => y.attendu < 0)) expect(e.question(cas, etat), e.id).toMatch(/négati(f|ve) (pour|sous)/);
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

function attendus(ch: Chapitre, id: string): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  expect(e?.type, id).toBe("montants");
  return Object.fromEntries(e.champs(cas, etatVide).map((x) => [x.libelle, x.attendu]));
}

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

function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

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

const ch = TABLEAU_DE_BORD;

describe("le tableau de bord, chez NOVA dans le monde du cours", () => {
  it("se joue chez NOVA seule, au palier 4 du contrôle de gestion, avec ses blocs", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(REGLER_LE_VOYANT);
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

  it("la fiche recopiée est celle du monde, et le semestre à la main donne les chiffres de la consigne", () => {
    const f = NOVA_GESTION;
    expect(f.semestre.clienteles.map((x) => x.quantites.map((q) => q)).reduce((a, b) => a.map((q, k) => q + b[k]!))).toEqual(Q);
    expect([...f.semestre.marche]).toEqual(MARCHE);
    expect(f.seuilsDAlerte).toEqual({ indiceDeSecurite: ALERTE.indice, resultat: ALERTE.resultat, tresorerie: ALERTE.tresorerie, partDeMarche: ALERTE.part });
    expect(MOIS.map((m) => m.resultat)).toEqual([2_207, -733, 5_315, 8_717, 11_447, 13_988]);
    // CampusTech paie à 60 jours : sa facture de janvier rentre en mars.
    expect(TRESORERIE).toEqual([58_838, 31_998, 41_958.8, 56_466, 72_724, 86_297.6]);
    expect(TRESORERIE_EN_RETARD).toEqual([58_838, 31_998, 19_302.8, 33_810, 50_068, 63_641.6]);
    expect(SEUIL).toBe(87_609.38);
    // Les voyants : le résultat et l'indice en février ; la part de marché en mai et en juin.
    expect(MOIS.map((m) => Object.entries(m.voyants).filter(([, v]) => v).map(([k]) => k))).toEqual([[], ["indice", "resultat"], [], [], ["part"], ["part"]]);
    // À 60 jours, aucun mois ne voit le résultat et la trésorerie aller en sens contraires.
    const sensContraires = (t: number[]) => MOIS.map((m, k) => k > 0 && (m.resultat - MOIS[k - 1]!.resultat) * (t[k]! - t[k - 1]!) < 0);
    expect(sensContraires(TRESORERIE).some(Boolean)).toBe(false);
    // Si CampusTech payait à 80 jours : de février à mars, le résultat monte de 6 048 € quand la trésorerie baisse de 12 695,20 €.
    expect(DELAI_SI_RETARD).toBe(80);
    expect(sensContraires(TRESORERIE_EN_RETARD).indexOf(true)).toBe(2);
    expect([MOIS[2]!.resultat - MOIS[1]!.resultat, c(TRESORERIE_EN_RETARD[2]! - TRESORERIE_EN_RETARD[1]!)]).toEqual([6_048, -12_695.2]);
  });

  it("l'étape guidée : les indicateurs de février", () => {
    expect(MOIS_GUIDE).toBe(1);
    const m = MOIS[1]!;
    expect(attendus(ch, "les-indicateurs-de-fevrier")).toEqual({
      "Taux de marge sur coût variable (%)": dixieme(((PRIX - CV) / PRIX) * 100),
      "Seuil de rentabilité du mois": SEUIL,
      "Indice de sécurité (%)": dixieme(m.indice * 100),
      "Résultat du mois": m.resultat,
    });
    expect(Object.values(attendus(ch, "les-indicateurs-de-fevrier"))).toEqual([35.6, 87_609.38, -2.4, -733]);
  });

  it("les étapes autonomes : le premier voyant d'un mois gagnant, la part de marché, le résultat et la trésorerie", () => {
    // Le premier mois où un voyant s'allume alors que le résultat est positif : mai (la part de marché).
    const premier = MOIS.find((m) => Object.values(m.voyants).some(Boolean) && m.resultat >= 0)!;
    expect(premier.nom).toBe("mai");
    expect(juste(ch, "les-voyants")).toBe("Mai");
    expect([dixieme(MOIS[0]!.part * 100), dixieme(MOIS[5]!.part * 100)]).toEqual([26.5, 23.4]);
    expect(juste(ch, "part-de-marche")).toBe("La position face aux concurrents : on peut gagner de l'argent sur un marché qui grandit tout en y perdant du terrain.");
    expect(juste(ch, "resultat-et-tresorerie")).toBe("Le résultat compte les ventes et les charges quand elles naissent, la trésorerie quand elles se paient : délais, TVA et emprunt les séparent.");
    expect(juste(ch, "choisir")).toBe("Le nombre d'écritures passées dans le journal ce mois-ci.");
    const t = ch.etapes.find((e) => e.id === "les-voyants")!.tableau!(cas);
    expect(t.lignes.find((l) => l.libelle === "Indice de sécurité")!.valeurs).toEqual(MOIS.map((m) => `${dixieme(m.indice * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1 }).replace("-", "−")} %`));
    // Le tableau de la question ne donne pas les voyants : c'est à l'élève de les lire.
    expect(t.lignes.some((l) => l.libelle === "Voyants allumés")).toBe(false);
    // L'étape du résultat et de la trésorerie montre l'hypothèse du retard à côté du délai convenu.
    const r = ch.etapes.find((e) => e.id === "resultat-et-tresorerie")!;
    if (r.type !== "choix") throw new Error("choix attendu");
    expect(r.question(cas, etatVide)).toBe(
      `Supposons que CampusTech paie 20 jours en retard, à 80 jours. De février à mars, le résultat du mois passe de ${eur(MOIS[1]!.resultat)} à ${eur(MOIS[2]!.resultat)}, la trésorerie de fin de mois de ${eur(TRESORERIE_EN_RETARD[1]!)} à ${eur(TRESORERIE_EN_RETARD[2]!)} : l'un monte quand l'autre baisse. Comment est-ce possible ?`,
    );
    expect(r.tableau!(cas).lignes.map((l) => [l.libelle, l.valeurs])).toEqual([
      ["Résultat du mois", MOIS.map((m) => eur(m.resultat))],
      ["Trésorerie de fin de mois, CampusTech à 60 jours", TRESORERIE.map(eur)],
      ["Trésorerie de fin de mois, si CampusTech payait à 80 jours", TRESORERIE_EN_RETARD.map(eur)],
    ]);
    expect(r.options(cas, etatVide).find((o) => o.juste)!.retour).toMatch(/^C'est cela\. À 60 jours, la facture de CampusTech qui rentre en mars compense celle de mars, et la trésorerie monte avec le résultat, à 41 958,80 €/);
  });

  it("le pari et le curseur du voyant de l'indice : il s'allume sous 1 564 enceintes, avant la perte", () => {
    expect(juste(ch, "predire-l-alerte")).toBe("Avant celui du résultat, quand NOVA gagne encore de l'argent");
    const seuilQ = Math.ceil(FIXES / (PRIX - CV));
    const alerteQ = Math.ceil(SEUIL / (1 - 0.05) / PRIX);
    expect([seuilQ, alerteQ]).toEqual([1_485, 1_564]);
    expect(VENTES_DU_CURSEUR).toEqual({ min: 1_400, max: 1_700 });
    expect(curseur(ch, "l-alerte-au-curseur")).toEqual({
      attendu: alerteQ,
      bornes: [1_400, 1_700],
      droites: [c(1_400 * PRIX - SEUIL), c(0.05 * 1_400 * PRIX), c(1_700 * PRIX - SEUIL), c(0.05 * 1_700 * PRIX)],
      lecture: {
        "Chiffre d'affaires du mois": 1_564 * PRIX,
        "Marge de sécurité": c(1_564 * PRIX - SEUIL),
        "5 % du chiffre d'affaires": c(0.05 * 1_564 * PRIX),
        "Résultat du mois": 1_564 * 21 - FIXES,
      },
    });
    expect([c(1_564 * PRIX - SEUIL), c(0.05 * 1_564 * PRIX), 1_564 * 21 - FIXES]).toEqual([4_666.62, 4_613.8, 1_661]);
  });

  it("construire un indicateur, à rebours : la cible et le seuil d'alerte en enceintes", () => {
    expect(CIBLE_DE_L_INDICE).toBe(0.2);
    expect(attendus(ch, "construire-un-indicateur")).toEqual({
      "Chiffre d'affaires du mois au seuil d'alerte": c(SEUIL / 0.95),
      "Ventes du mois au seuil d'alerte": Math.ceil(SEUIL / 0.95 / PRIX),
      "Ventes du mois de la cible": Math.ceil(SEUIL / 0.8 / PRIX),
    });
    expect(Object.values(attendus(ch, "construire-un-indicateur"))).toEqual([92_220.4, 1_564, 1_857]);
    // À la cible : avril, mai et juin ; sous l'alerte : février ; sous la cible de l'indice : janvier à mars.
    expect(MOIS.filter((m) => m.q >= 1_857).map((m) => m.nom)).toEqual(["avril", "mai", "juin"]);
    expect(MOIS.filter((m) => m.q < 1_564).map((m) => m.nom)).toEqual(["février"]);
    expect(MOIS.filter((m) => m.indice < 0.2).map((m) => m.nom)).toEqual(["janvier", "février", "mars"]);
    expect(juste(ch, "la-cible-et-l-alerte")).toBe("5 %, sous la cible : il s'allume avant la perte");
  });

  it("le pari et le laboratoire des voyants : la trésorerie s'allume, le résultat non", () => {
    expect(DELAI_DU_PARI).toBe(140);
    expect(juste(ch, "predire-la-divergence")).toBe("Ne bouge pas, mais la trésorerie baisse");
    const pari = ch.etapes.find((e) => e.id === "predire-la-divergence") as EtapeChoix;
    expect(pari.question(cas, etatVide)).toMatch(/140 jours au lieu des 60 convenus, bien au-delà du plafond légal de 60 jours/);
    expect(pari.options(cas, etatVide).find((o) => o.juste)!.retour).toMatch(/la loi plafonne le délai entre professionnels à 60 jours/);
    const l = laboratoire(ch, "le-laboratoire-des-voyants");
    expect(LEVIERS_DES_VOYANTS).toEqual({ prix: { min: 55, max: 63, pas: 0.1 }, publicite: { min: 0, max: 5_000, pas: 100 }, campustech: { min: 0, max: 180, pas: 10 } });
    expect(l.depart).toEqual({ prix: 59, publicite: 0, campustech: 60, banc: 0 });
    expect(l.solution).toEqual({ prix: 59, publicite: 0, campustech: 60, banc: 1 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (p: Parameters<typeof semestreALaMain>[0]) => {
      const s = semestreALaMain(p);
      return {
        "Chiffre d'affaires du semestre": s.ca,
        "Indice de sécurité du semestre": dixieme(s.indice * 100),
        "Part de marché du semestre": dixieme(s.part * 100),
        "Trésorerie la plus basse du semestre": s.plusBas,
        "Résultat du semestre, face à son seuil d'alerte": s.resultat,
        "Trésorerie la plus basse, face à son seuil d'alerte": c(s.plusBas - 10_000),
        "Voyants allumés sur le semestre": s.voyants,
      };
    };
    expect(l.auDepart).toEqual(lire({ prix: 59, publicite: 0, campustech: 60, banc: 0 }));
    expect(l.aLaSolution).toEqual(lire({ prix: 59, publicite: 0, campustech: 60, banc: 1 }));
    expect(Object.values(l.auDepart)).toEqual([640_681, 18, 25.3, 31_998, 40_941, 21_998, 0]);
    // Le banc en février : cinq mois d'usure (2 500 €) au résultat, 36 000 € TTC d'un coup à la banque.
    expect(Object.values(l.aLaSolution)).toEqual([640_681, 16.9, 25.3, -4_002, 38_441, -14_002, 1]);
    expect(c(31_998 - 36_000)).toBe(-4_002);
    // L'autre solution : CampusTech à 140 jours (une hypothèse au-delà du plafond légal). Aucune publicité
    // du laboratoire n'y suffit : elle retire au résultat presque tout ce qu'elle retire à la banque.
    // Une baisse de prix allume aussi le résultat.
    for (const [p, ok] of [
      [{ campustech: 140 }, true],
      [{ campustech: 130 }, false],
      [{ publicite: 5_000 }, false],
      [{ publicite: 2_500 }, false],
      [{ prix: 55 }, false],
    ] as const) {
      const pos = { ...l.depart, ...p };
      const s = semestreALaMain(pos as Parameters<typeof semestreALaMain>[0]);
      expect(l.d.atteint(pos), JSON.stringify(p)).toBe(ok);
      expect(s.tresorerieAllumee && !s.resultatAllume, JSON.stringify(p)).toBe(ok);
    }
    for (let pub = 0; pub <= 5_000; pub += 100) {
      const s = semestreALaMain({ prix: 59, campustech: 60, banc: 0, publicite: pub });
      expect(s.tresorerieAllumee && !s.resultatAllume, `publicité ${pub}`).toBe(false);
      expect(l.d.atteint({ ...l.depart, publicite: pub }), `publicité ${pub}`).toBe(false);
    }
    expect(semestreALaMain({ prix: 55, publicite: 0, campustech: 60, banc: 0 }).resultat).toBe(-2_495);
    expect(l.e.explication(cas, l.solution).join(" ")).toMatch(/500 € par mois dès février.*36 000 € TTC.*Si CampusTech payait à 140 jours, au-delà du plafond légal.*même à 5 000 € par mois, le voyant de trésorerie reste éteint/);
  });

  it("le graphique du laboratoire : le résultat reste plat, la trésorerie la plus basse descend par marches", () => {
    const { e, depart } = laboratoire(ch, "le-laboratoire-des-voyants");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("campustech");
    const [resultat, plusBas] = g.courbes;
    const en = (d: number) => [resultat!.valeur({ ...depart, campustech: d }), plusBas!.valeur({ ...depart, campustech: d })];
    // Payée dans le mois, CampusTech remplit la banque : le point bas reste en février.
    expect(en(0)).toEqual([40_941, Math.min(...tresorerieALaMain({ delaiCampusTech: 0 }))]);
    expect(Math.min(...tresorerieALaMain({ delaiCampusTech: 0 }))).toBe(c(31_998 + 2 * 22_656));
    expect(en(60)).toEqual([40_941, 31_998]);
    expect(en(80)).toEqual([40_941, 19_302.8]);
    expect(en(110)).toEqual([40_941, c(33_810 - 22_656)]);
    expect(en(140)).toEqual([40_941, c(50_068 - 2 * 22_656)]);
    expect(en(170)).toEqual([40_941, c(63_641.6 - 3 * 22_656)]);
  });

  it("du résultat à la trésorerie : le passage de mars, si CampusTech payait à 80 jours", () => {
    const a = attendus(ch, "du-resultat-a-la-tresorerie");
    expect(a).toEqual({
      "Ce que l'exploitation dégage avant les délais": 5_315 + 833,
      "Créance de mars sur CampusTech, non encaissée": c(320 * 59 * 1.2),
      "Échéance de l'emprunt": 4_000 + 80_000 * 0.05 * 0.25,
      "Variation de la trésorerie de mars": c(19_302.8 - 31_998),
    });
    // Le passage, refait : la dette fournisseur grandit de (1 738 − 1 450) × 26,40 €, la TVA due de (1 738 − 1 450) × 4,20 €.
    expect(c(6_148 - 22_656 + (1_738 - 1_450) * 26.4 + (1_738 - 1_450) * 4.2 - 5_000)).toBe(-12_695.2);
    // Au délai convenu, la facture de janvier rentre en mars et compense celle de mars : la trésorerie monte.
    expect(c(TRESORERIE[2]! - TRESORERIE[1]!)).toBe(c(-12_695.2 + 22_656));
    const e = ch.etapes.find((x) => x.id === "du-resultat-a-la-tresorerie") as EtapeMontants;
    expect(e.question(cas, etatVide)).toMatch(/^Toujours si CampusTech payait à 80 jours, retracez le passage de mars/);
    expect(e.explication(cas, etatVide).join(" ")).toMatch(/31 998 € − 12 695,20 € = 19 302,80 €.*Au délai convenu, 60 jours, la facture de janvier de CampusTech rentrerait en mars, 22 656 €/);
  });

  it("les verdicts d'expert, et la synthèse", () => {
    expect(juste(ch, "les-limites")).toBe("Ses voyants constatent le mois écoulé : le budget voyait le découvert de février dès janvier");
    const synthese = ch.etapes.find((e) => e.id === "synthese")!;
    if (synthese.type !== "lecture") throw new Error("lecture attendue");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    expect(synthese.tableau!(cas).lignes.find((l) => l.libelle === "Voyants allumés")!.valeurs).toEqual(["aucun", "indice de sécurité, résultat", "aucun", "aucun", "part de marché", "part de marché"]);
  });

  it("CampusTech paie à 60 jours : 80 jours ne s'écrit qu'en hypothèse de retard", () => {
    for (const x of [ch, REGLER_LE_VOYANT]) {
      const chapitre = chapitreDuCas(x, cas);
      for (const [i, e] of chapitre.etapes.entries()) {
        for (const t of textesDe(e, cas, etatAvant(chapitre, cas, i))) {
          for (const phrase of t.split(/(?<=[.?!])\s/)) if (/\b80 jours\b/.test(phrase)) expect(phrase, `${e.id} : ${phrase}`).toMatch(/retard|si CampusTech payait/);
        }
      }
    }
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : régler le voyant de sécurité", () => {
  const s = REGLER_LE_VOYANT;
  const ca = Q.reduce((t, q) => t + q * PRIX, 0);
  const marge = Q.reduce((t, q) => t + q * (PRIX - CV), 0);
  const fixes = 6 * FIXES;
  const seuil = c((fixes * ca) / marge);
  const cible = c(seuil / (1 - 0.15));

  it("est le cas dédié du chapitre, chez NOVA", () => {
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le dirigeant");
    expect(INDICE_DU_VOYANT).toBe(0.15);
  });

  it("les indicateurs du semestre, refaits à la main", () => {
    expect([ca, marge, fixes, seuil]).toEqual([640_681, 228_039, 187_098, 525_656.29]);
    expect(attendus(s, "le-semestre")).toEqual({
      "Chiffre d'affaires du semestre": ca,
      "Taux de marge sur coût variable du semestre (%)": dixieme((marge / ca) * 100),
      "Seuil de rentabilité du semestre": seuil,
      "Indice de sécurité du semestre (%)": dixieme(((ca - seuil) / ca) * 100),
    });
    expect(dixieme(((ca - seuil) / ca) * 100)).toBe(18);
    // L'indice du semestre n'est pas la moyenne des six indices.
    expect(dixieme((MOIS.reduce((t, m) => t + m.indice, 0) / 6) * 100)).toBe(16.4);
  });

  it("le curseur du voyant : 10 482 enceintes sur le semestre", () => {
    expect(VENTES_DU_SEMESTRE_AU_CURSEUR).toEqual({ min: 10_000, max: 11_000 });
    const q = Math.ceil(seuil / 0.85 / PRIX);
    expect(q).toBe(10_482);
    expect(curseur(s, "le-voyant-au-curseur")).toEqual({
      attendu: q,
      bornes: [10_000, 11_000],
      droites: [c(10_000 * PRIX - seuil), c(0.15 * 10_000 * PRIX), c(11_000 * PRIX - seuil), c(0.15 * 11_000 * PRIX)],
      lecture: { "Chiffre d'affaires du semestre": q * PRIX, "Marge de sécurité": c(q * PRIX - seuil), "15 % du chiffre d'affaires": c(0.15 * q * PRIX) },
    });
  });

  it("le niveau du voyant, à rebours", () => {
    expect(attendus(s, "le-voyant")).toEqual({
      "Chiffre d'affaires semestriel pour un indice de 15 %": cible,
      "Par mois, en moyenne": c(cible / 6),
      "Marge de sécurité à ce chiffre d'affaires": c(cible - seuil),
    });
    expect([cible, c(cible / 6), c(cible - seuil)]).toEqual([618_419.16, 103_069.86, 92_762.87]);
  });

  it("le jugement : le voyant ne voit pas le découvert du banc", () => {
    // Le banc en février : cinq mois d'usure, et février à découvert.
    const banc = semestreALaMain({ prix: 59, publicite: 0, campustech: 60, banc: 1 });
    expect([dixieme(banc.indice * 100), banc.plusBas]).toEqual([16.9, -4_002]);
    expect(banc.indice).toBeGreaterThan(0.15);
    expect(juste(s, "ce-que-le-voyant-ne-voit-pas")).toBe("Non : l'indice reste à 16,9 %, mais février finit à découvert");
    expect(juste(s, "reponse")).toBe("Sous 618 419,16 € par semestre ; et gardez à côté le voyant de trésorerie");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
