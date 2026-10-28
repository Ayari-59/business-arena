import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CROITRE_EN_INVESTISSANT,
  HAUSSE_DE_LA_CRITIQUE,
  HAUSSE_DE_LA_VARIANTE,
  TRIMESTRE_DE_L_ACHAT,
  croissance,
  hausseOuLOperateurPaie,
  machineDuChapitre,
} from "../../src/config/cours/chapitres/croitre-en-investissant";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { VOIR_PLUS_GRAND, voirPlusGrand } from "../../src/config/cours/situations/par-chapitre/voir-plus-grand";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * CROÎTRE EN INVESTISSANT, À L'ATELIER DE NOVA DU MONDE DU COURS, ET SON CAS : VOIR PLUS GRAND.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de la capacité
 * (monde/nova-capacite.ts), sans les fonctions du chapitre ni le modèle (monde/capacite.ts) : la
 * demande de N + 1, l'outil, l'équipe, la production min(demande, outil, équipe), les charges de
 * l'année, les flux, la VAN au facteur (1 − 1,08^−6) ÷ 0,08. Les valeurs absolues sont épinglées,
 * la variante (la demande haussée de 5 %) et les calculs à rebours refaits comme le reste, les
 * curseurs (attendu, droites aux bornes, lecture), le laboratoire (départ, solution, courbes du
 * graphique) et les verdicts aussi. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = NOVA_CAPACITE;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// ─── La fiche, à la main ────────────────────────────────────────────────────────────────────────
const MARGE = 59 - 22 - 16;
const DEMANDE = [5_800, 7_400, 6_200, 7_800];
const OUTIL = 7_000;
const EQUIPE = 4 * (180 / 0.3) * 3;
const FACTEUR = (1 - 1.08 ** -6) / 0.08;
const SALAIRE = 1_875 * 1.42 * 12;

interface MachineALaMain {
  prix: number;
  capaciteEnPlus: number;
  equipeEnPlus: number;
  salaires: number;
  entretien: number;
  recrutement: number;
  taux?: number;
}
const POSTE: MachineALaMain = { prix: 15_000, capaciteEnPlus: 1_750, equipeEnPlus: 3 * (180 / 0.3), salaires: SALAIRE, entretien: 4_500, recrutement: 3_000 };
const POSTE_SEUL: MachineALaMain = { ...POSTE, equipeEnPlus: 0, salaires: 0, recrutement: 0 };
const LIGNE: MachineALaMain = { prix: 60_000, capaciteEnPlus: 3_500, equipeEnPlus: 3 * (180 / 0.15), salaires: SALAIRE, entretien: 6_000, recrutement: 3_000 };
const LIGNE_SEULE: MachineALaMain = { ...LIGNE, equipeEnPlus: 0, salaires: 0, recrutement: 0 };

/** Une machine refaite à la main : la demande haussée (à l'enceinte), les ventes gagnées, le flux, la VAN. */
function aLaMain(m: MachineALaMain, hausse = 0) {
  const d = DEMANDE.map((x) => Math.round(x * (1 + hausse)));
  const sans = d.map((x) => Math.min(x, OUTIL, EQUIPE));
  const avec = d.map((x) => Math.min(x, OUTIL + m.capaciteEnPlus, EQUIPE + m.equipeEnPlus));
  const gagnees = somme(avec) - somme(sans);
  const amortissement = m.prix / 6;
  const interets = m.prix * 0.05;
  const charges = amortissement + interets + m.salaires + m.entretien;
  const flux = centime((gagnees * MARGE - m.salaires - m.entretien - amortissement) * 0.75 + amortissement);
  const facteur = m.taux === undefined ? FACTEUR : (1 - (1 + m.taux) ** -6) / m.taux;
  const investissement = m.prix + m.recrutement;
  return { d, sans, avec, gagnees, marge: gagnees * MARGE, amortissement, interets, charges, resultat: gagnees * MARGE - charges, flux, investissement, van: centime(-investissement + flux * facteur) };
}

// ─── Les gardes de l'étalon ─────────────────────────────────────────────────────────────────────
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
        ...(e.graphique?.(c).courbes ?? []).map((x) => x.libelle),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "refusé", "monté"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|ans|années|opérateurs?|postes?)\b/i);
      // L'arène ne se rejoue plus : le chapitre ne dit plus qu'elle rejoue.
      expect(x, `${e.id} : ${x}`).not.toMatch(/l'arène (rejoue|a rejoué|en fait|en a tiré)/i);
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
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
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

/** Un curseur : son attendu, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeCurseur;
  expect(e.type, id).toBe("curseur");
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

const ch = CROITRE_EN_INVESTISSANT;

describe("croître en investissant : la place dans le parcours, chez NOVA seule", () => {
  it("le titre du programme, au palier 3 du parcours stratégie, ses blocs, NOVA seule, et son cas", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("strategie");
    expect(ch.palier).toBe(3);
    expect(PROGRAMME.strategie[3]).toContain(ch.titre);
    expect(ch.libre).toBe(false);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir la stratégie de création de valeur"]);
    for (const b of ch.blocs) {
      const r = referentielDeCitation(b);
      expect(r, b).not.toBeNull();
      expect(r!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
    }
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(VOIR_PLUS_GRAND);
  });

  it("la synthèse finit sur l'arène, et l'intro dit les hypothèses de la simulation", () => {
    const synthese = ch.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("L'intro est une lecture");
    const texte = intro.texte(cas).join(" ");
    for (const h of ["simulation du cours", "21 € de marge", "est perdue", "prévision", "1er janvier N + 1", "emprunt du même montant à 5 %", "8 %", "25 %", "économiser l'impôt", "recrutement compté au départ", "gardée la même toute la durée"]) expect(texte, h).toContain(h);
  });

  it("la mission « jouez » garde ses exports : le poste manuel tel que l'arène le nomme", () => {
    expect(TRIMESTRE_DE_L_ACHAT).toBe(1);
    const m = machineDuChapitre(code);
    expect(m).toEqual({ code: "poste-manuel", name: "Ligne manuelle", costPerUnit: 15_000, depreciationRounds: 24 });
    // Le nom recopié est bien celui du premier équipement de l'arène, au même prix et sur la même durée.
    const equipement = scenarioByCode(code).scenario.equipment!;
    const arene = equipement.types.find((t) => t.code === equipement.initialFleet[0]!.typeCode)!;
    expect([arene.name, arene.costPerUnit, arene.depreciationRounds]).toEqual([m.name, m.costPerUnit, m.depreciationRounds]);
  });
});

describe("croître en investissant : les chiffres, refaits à la main sur la fiche", () => {
  const poste = aLaMain(POSTE);
  const seul = aLaMain(POSTE_SEUL);

  it("la fiche donne les chiffres de la consigne", () => {
    expect(f.anneeNPlus1.demande).toEqual(DEMANDE);
    expect(f.ligne.capaciteParTrimestre).toBe(OUTIL);
    expect([MARGE, EQUIPE, SALAIRE]).toEqual([21, 7_200, 31_950]);
    expect(f.machines.map((m) => [m.code, m.prix, m.capaciteEnPlus, m.embauches, m.heuresParEnceinte, m.entretienParAn, m.dureeEnAnnees])).toEqual([
      ["poste-manuel", 15_000, 1_750, 1, 0.3, 4_500, 6],
      ["ligne-automatisee", 60_000, 3_500, 1, 0.15, 6_000, 6],
    ]);
    expect([f.investissement.tauxDeLEmprunt, f.investissement.tauxDActualisation, f.investissement.tauxDImpot, f.personnel.coutDUnRecrutement]).toEqual([0.05, 0.08, 0.25, 3_000]);
    expect(f.investissement.haussesDeLaDemande).toContain(HAUSSE_DE_LA_VARIANTE);
    expect(f.investissement.haussesDeLaDemande).toContain(HAUSSE_DE_LA_CRITIQUE);
    expect(Math.round(FACTEUR * 10_000) / 10_000).toBe(4.6229);
  });

  it("les étapes guidées : ce que l'outil refuse, le goulot qui se déplace, les charges, la VAN", () => {
    const ventes = DEMANDE.map((d) => Math.min(d, OUTIL, EQUIPE));
    const refusees = somme(DEMANDE) - somme(ventes);
    expect(attendus(ch, "ce-que-l-outil-refuse")).toEqual({ "Ventes du trimestre 4": 7_000, "Enceintes refusées sur l'année": refusees, "Marge refusée sur l'année": refusees * MARGE });
    expect([refusees, refusees * MARGE]).toEqual([1_200, 25_200]);
    // Sans embauche, l'équipe borne à 7 200 aux T2 et T4 : 200 de plus à chacun.
    expect(seul.avec).toEqual([5_800, 7_200, 6_200, 7_200]);
    expect(poste.avec).toEqual([5_800, 7_400, 6_200, 7_800]);
    expect(attendus(ch, "le-goulot-se-deplace")).toEqual({
      "Capacité de l'outil avec le poste": OUTIL + 1_750,
      "Ventes gagnées sans embauche": seul.gagnees,
      "Capacité de l'équipe avec l'opérateur": EQUIPE + 1_800,
      "Ventes gagnées avec l'opérateur": poste.gagnees,
    });
    expect([OUTIL + 1_750, seul.gagnees, EQUIPE + 1_800, poste.gagnees]).toEqual([8_750, 400, 9_000, 1_200]);
    expect(attendus(ch, "les-charges-de-l-annee")).toEqual({
      "Amortissement de l'année": 15_000 / 6,
      "Intérêts de la première année": 15_000 * 0.05,
      "Coût de l'opérateur sur l'année": SALAIRE,
      "Charges de l'année": poste.charges,
    });
    expect(poste.charges).toBe(39_700);
    expect(attendus(ch, "les-flux-et-la-van")).toEqual({ "Investissement du départ": 18_000, "Flux de chaque année": poste.flux, "VAN du poste avec son opérateur": poste.van });
    expect([poste.flux, poste.van]).toEqual([-7_812.5, -54_116.25]);
  });

  it("les étapes autonomes : le résultat gagné, la VAN du poste seul", () => {
    expect(attendus(ch, "le-resultat-gagne")).toEqual({
      "Marge gagnée": 25_200,
      "Résultat gagné de l'année": 25_200 - 39_700,
      "Part de l'opérateur dans les charges (%)": centime((SALAIRE / 39_700) * 100),
      "Ventes gagnées qui rendent le résultat nul": Math.ceil(39_700 / MARGE),
    });
    expect([centime((SALAIRE / 39_700) * 100), Math.ceil(39_700 / MARGE)]).toEqual([80.48, 1_891]);
    // 1 890 ventes ne suffisent pas, 1 891 oui.
    expect(1_890 * MARGE).toBeLessThan(39_700);
    expect(attendus(ch, "la-van-du-poste-seul")).toEqual({
      "Investissement du départ, sans recrutement": 15_000,
      "Flux de chaque année du poste seul": seul.flux,
      "VAN du poste seul": seul.van,
      "Délai de récupération (années)": centime(15_000 / seul.flux),
    });
    expect([seul.flux, seul.van, centime(15_000 / seul.flux), seul.resultat]).toEqual([3_550, 1_411.22, 4.23, 650]);
  });

  it("les étapes d'expert : la variante à 5 %, puis le rebours de la VAN nulle à la demande", () => {
    const v = aLaMain(POSTE, 0.05);
    expect(v.d).toEqual([6_090, 7_770, 6_510, 8_190]);
    expect(v.sans).toEqual([6_090, 7_000, 6_510, 7_000]);
    expect(attendus(ch, "a-plus-cinq")).toEqual({
      "Ventes gagnées sur l'année": v.gagnees,
      "Flux de chaque année à 5 %": v.flux,
      "VAN à 5 %": v.van,
      "Délai de récupération à 5 % (années)": centime(18_000 / v.flux),
    });
    expect([v.gagnees, v.flux, v.van, centime(18_000 / v.flux)]).toEqual([1_960, 4_157.5, 1_219.62, 4.33]);
    // À rebours : le flux qui annule la VAN, le résultat avant impôt, les ventes, la hausse.
    const flux = centime(18_000 / FACTEUR);
    const resultat = centime((flux - 2_500) / 0.75);
    const ventes = Math.ceil((resultat + SALAIRE + 4_500 + 2_500) / MARGE);
    const hausse = centime(((ventes - 1_200) / (7_400 + 7_800)) * 100);
    expect(attendus(ch, "a-rebours")).toEqual({
      "Flux de chaque année qui annule la VAN": flux,
      "Ventes gagnées par an qui annulent la VAN": ventes,
      "Hausse de la demande qui annule la VAN (%)": hausse,
    });
    expect([flux, resultat, ventes, hausse]).toEqual([3_893.68, 1_858.24, 1_944, 4.89]);
    // Le rebours redonne la hausse du curseur, au dixième près : à 4,9 % la VAN est positive, à 4,8 % non.
    expect(aLaMain(POSTE, 0.049).van).toBeGreaterThan(0);
    expect(aLaMain(POSTE, 0.048).van).toBeLessThan(0);
  });

  it("la demande qui fait payer l'opérateur, et la critique du ratio d'une année", () => {
    // L'opérateur se paie à partir de 5,1 % : à 5 %, le poste seul vaut encore mieux.
    expect(hausseOuLOperateurPaie(f, "poste-manuel")).toBe(0.051);
    expect(aLaMain(POSTE, 0.051).van).toBeGreaterThanOrEqual(aLaMain(POSTE_SEUL, 0.051).van);
    expect(aLaMain(POSTE, 0.05).van).toBeLessThan(aLaMain(POSTE_SEUL, 0.05).van);
    // À 10 % : le résultat gagné de la première année, le « ratio » du collègue, la VAN et le délai.
    const k = aLaMain(POSTE, 0.1);
    expect([k.gagnees, k.resultat, centime((k.resultat / 15_000) * 100), k.flux, k.van, centime(18_000 / k.flux)]).toEqual([2_720, 17_420, 116.13, 16_127.5, 56_555.49, 1.12]);
    const x = croissance(cas);
    expect([x.rentabiliteDuCollegue, x.critique.van]).toEqual([116.13, 56_555.49]);
    // Le plan de l'emprunt : les intérêts changent le résultat, pas la VAN.
    expect(x.emprunt.map((l) => l.interets)).toEqual([750, 625, 500, 375, 250, 125]);
  });

  it("les verdicts sont épinglés", () => {
    expect(juste(ch, "predire-le-goulot")).toBe("400 : l'équipe devient le goulot");
    expect(juste(ch, "predire-le-point-mort")).toBe("Environ 1 900 : plus que la demande refusée");
    expect(juste(ch, "predire-la-hausse")).toBe("D'environ 5 %");
    expect(juste(ch, "les-interets")).toBe("Non : le taux de 8 % rémunère déjà l'argent engagé, emprunté ou non");
    expect(juste(ch, "la-rentabilite-d-une-annee")).toBe("Ce ratio ne juge rien : seule la VAN compte tous les flux de la durée, actualisés");
    expect(croissance(cas).verdict).toBe("attendre-la-demande");
    expect(juste(ch, "verdict")).toBe("Pas sur la demande prévue : avec son opérateur, il lui faut 4,9 % de demande en plus, chaque année");
  });

  it("le curseur du point mort : la marge des ventes gagnées face aux charges de l'année", () => {
    expect(curseur(ch, "le-point-mort-de-la-machine")).toEqual({
      attendu: 1_891,
      bornes: [0, 3_000],
      droites: [0, 39_700, 3_000 * MARGE, 39_700],
      lecture: { "Marge gagnée": 1_891 * MARGE, "Charges de l'année": 39_700, "Résultat gagné de l'année": 1_891 * MARGE - 39_700 },
    });
    expect(1_891 * MARGE - 39_700).toBe(11);
  });

  it("le curseur de la hausse : la VAN s'annule à 49 ‰", () => {
    const a49 = aLaMain(POSTE, 0.049);
    expect(a49.gagnees).toBe(1_945);
    expect(curseur(ch, "la-hausse-qui-annule-la-van")).toEqual({
      attendu: 49,
      bornes: [0, 100],
      droites: [centime(poste.van + 18_000), 18_000, centime(aLaMain(POSTE, 0.1).van + 18_000), 18_000],
      lecture: { "Marge gagnée sur l'année": a49.marge, "Flux de chaque année": a49.flux, "Flux actualisés sur la durée": centime(a49.van + 18_000), "VAN du poste avec son opérateur": a49.van },
    });
    expect([a49.marge, a49.flux, a49.van]).toEqual([40_845, 3_921.25, 127.47]);
    // Jusqu'à 10 %, la VAN est une droite de la hausse : au milieu, elle vaut la moyenne des bornes, à l'arrondi près.
    expect(Math.abs(aLaMain(POSTE, 0.05).van - (poste.van + aLaMain(POSTE, 0.1).van) / 2)).toBeLessThan(10);
  });

  it("le laboratoire de l'atelier : sans embauche, le poste seul paie sur la demande prévue", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-atelier");
    expect(l.depart).toEqual({ machine: 1, embauches: 1, hausse: 0, taux: 8 });
    expect(l.solution).toEqual({ machine: 1, embauches: 0, hausse: 0, taux: 8 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (m: MachineALaMain, r: ReturnType<typeof aLaMain>) => ({
      "Capacité de l'outil, par trimestre": OUTIL + m.capaciteEnPlus,
      "Capacité de l'équipe, par trimestre": EQUIPE + m.equipeEnPlus,
      "Ventes gagnées sur l'année": r.gagnees,
      "Marge gagnée": r.marge,
      "Charges de l'année (amortissement, intérêts, salaires, entretien)": -r.charges,
      "Résultat gagné de l'année": r.resultat,
      "VAN de la machine": r.van,
    });
    expect(l.auDepart).toEqual(lire(POSTE, poste));
    expect(l.aLaSolution).toEqual(lire(POSTE_SEUL, seul));
    expect(Object.values(l.aLaSolution)).toEqual([8_750, 7_200, 400, 8_400, -7_750, 650, 1_411.22]);
    // Le défi ne se relève qu'avec le poste seul : la ligne, avec ou sans opérateur, et le poste avec le sien échouent.
    for (const p of [
      { machine: 2, embauches: 0, hausse: 0, taux: 8 },
      { machine: 2, embauches: 1, hausse: 0, taux: 8 },
      { machine: 1, embauches: 0, hausse: 0, taux: 12 },
      { machine: 1, embauches: 1, hausse: 10, taux: 8 },
    ])
      expect(l.d.atteint(p), JSON.stringify(p)).toBe(false);
    expect([aLaMain(LIGNE).van, aLaMain(LIGNE_SEULE).van, aLaMain({ ...POSTE_SEUL, taux: 0.12 }).van]).toEqual([-95_649.09, -40_121.62, -404.5]);
    // Le levier à choix : les deux machines du catalogue.
    expect(l.e.leviers(cas).find((x) => x.code === "machine")!.choix).toEqual([
      { valeur: 1, libelle: "Un cinquième poste manuel" },
      { valeur: 2, libelle: "Une ligne automatisée" },
    ]);
  });

  it("le graphique du laboratoire : la VAN selon la demande, avec et sans l'opérateur, en quelques points", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-atelier");
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("hausse");
    expect(g.courbes.map((x) => x.libelle)).toEqual(["VAN avec l'opérateur", "VAN sans embauche"]);
    const [avec, sans] = g.courbes;
    const point = (machine: number, h: number) => [avec!.valeur({ ...l.depart, machine, hausse: h }), sans!.valeur({ ...l.depart, machine, hausse: h })];
    for (const h of [0, 5, 10, 20, 30]) {
      expect(point(1, h), `poste à ${h} %`).toEqual([aLaMain(POSTE, h / 100).van, aLaMain(POSTE_SEUL, h / 100).van]);
      expect(point(2, h), `ligne à ${h} %`).toEqual([aLaMain(LIGNE, h / 100).van, aLaMain(LIGNE_SEULE, h / 100).van]);
    }
    expect(point(1, 20)).toEqual([145_384.12, 15_973.29]);
    // Sans embauche, la VAN plafonne : l'équipe borne, quelle que soit la demande jusqu'à 10 %.
    expect(point(1, 0)[1]).toBe(point(1, 10)[1]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : voir plus grand", () => {
  const s = VOIR_PLUS_GRAND;
  const poste = aLaMain(POSTE);
  const ligne = aLaMain(LIGNE);

  it("un cas dédié, à NOVA seule", () => {
    casDedie(s, ch);
    expect(s.code).toBe("voir-plus-grand");
    expect(s.commanditaire).toBe("La direction");
  });

  it("sur la demande prévue, la ligne vend exactement autant que le poste : le « 952 = 952 » de l'audit", () => {
    expect(attendus(s, "ce-que-vend-la-ligne")).toEqual({
      "Capacité de l'outil avec la ligne": OUTIL + 3_500,
      "Capacité de l'équipe avec son opérateur": EQUIPE + 3_600,
      "Ventes gagnées sur l'année": ligne.gagnees,
      "Ventes de plus que le poste": ligne.gagnees - poste.gagnees,
    });
    expect([OUTIL + 3_500, EQUIPE + 3_600, ligne.gagnees, ligne.gagnees - poste.gagnees]).toEqual([10_500, 10_800, 1_200, 0]);
    expect(attendus(s, "ce-que-coute-la-ligne")).toEqual({
      "Investissement du départ": 63_000,
      "Charges de la première année": ligne.charges,
      "Ventes gagnées qui rendent l'année nulle": Math.ceil(ligne.charges / MARGE),
      "VAN de la ligne sur la demande prévue": ligne.van,
    });
    expect([ligne.charges, Math.ceil(ligne.charges / MARGE), ligne.flux, ligne.van]).toEqual([50_950, 2_427, -7_062.5, -95_649.09]);
  });

  it("le curseur du rattrapage : 571 ventes de plus que le poste", () => {
    // La ligne coûte 45 000 € de plus au départ, 1 500 € d'entretien et 7 500 € d'amortissement de plus par an.
    const fluxEnPlus = (q: number) => centime((q * MARGE - 1_500 - 7_500) * 0.75 + 7_500);
    expect(curseur(s, "le-rattrapage-au-curseur")).toEqual({
      attendu: 571,
      bornes: [0, 1_500],
      droites: [centime(fluxEnPlus(0) * FACTEUR), 45_000, centime(fluxEnPlus(1_500) * FACTEUR), 45_000],
      lecture: {
        "Flux de chaque année en plus": fluxEnPlus(571),
        "Flux actualisés en plus": centime(fluxEnPlus(571) * FACTEUR),
        "Investissement en plus": 45_000,
        "VAN de la ligne moins celle du poste": centime(-45_000 + fluxEnPlus(571) * FACTEUR),
      },
    });
    expect([fluxEnPlus(571), centime(-45_000 + fluxEnPlus(571) * FACTEUR)]).toEqual([9_743.25, 41.87]);
    expect(-45_000 + fluxEnPlus(570) * FACTEUR).toBeLessThan(0);
  });

  it("le rebours : la demande où la ligne passe devant, 18,89 %", () => {
    const flux = centime(45_000 / FACTEUR);
    const resultat = centime((flux - 7_500) / 0.75);
    const ventes = Math.ceil((resultat + 1_500 + 7_500) / MARGE);
    // Au-delà de 18,2 %, l'outil du poste (8 750) borne aux T2 et T4 : la ligne vend la demande au-delà.
    const hausse = centime(((ventes + 2 * 8_750) / (7_400 + 7_800) - 1) * 100);
    expect(attendus(s, "la-demande-ou-la-ligne-passe-devant")).toEqual({
      "Flux de chaque année en plus qui égalise les VAN": flux,
      "Ventes de plus que le poste qui égalisent les VAN": ventes,
      "Hausse de la demande où la ligne passe devant (%)": hausse,
    });
    expect([flux, resultat, ventes, hausse]).toEqual([9_734.19, 2_978.92, 571, 18.89]);
    // Le modèle le voit au ‰ près : à 18,9 %, la ligne passe devant ; à 18,8 %, pas encore.
    const v = voirPlusGrand(cas);
    expect(v.devant).toBe(0.189);
    expect(aLaMain(LIGNE, 0.189).van).toBeGreaterThan(aLaMain(POSTE, 0.189).van);
    expect(aLaMain(LIGNE, 0.188).van).toBeLessThan(aLaMain(POSTE, 0.188).van);
    expect(aLaMain(POSTE, 0.189).avec).toEqual([6_896, 8_750, 7_372, 8_750]);
    // Le tableau des VAN, refait à la main aux hausses de la fiche.
    expect(v.vanParHausse).toEqual([0, 0.05, 0.1, 0.25].map((h) => ({ hausse: h, petite: aLaMain(POSTE, h).van, grande: aLaMain(LIGNE, h).van })));
    expect([aLaMain(POSTE, 0.25).van, aLaMain(LIGNE, 0.25).van, aLaMain(LIGNE, 0.25).gagnees, aLaMain(POSTE, 0.25).gagnees]).toEqual([186_157.92, 253_840.61, 6_000, 4_500]);
  });

  it("la réponse : aucune des deux sur la demande prévue", () => {
    expect(voirPlusGrand(cas).verdict).toBe("aucune");
    expect(juste(s, "reponse")).toBe("Aucune des deux sur la demande prévue ; la ligne ne passe devant qu'à 18,9 % de demande en plus");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
