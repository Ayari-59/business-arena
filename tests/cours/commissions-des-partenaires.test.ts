import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { COMMISSIONS_DES_PARTENAIRES } from "../../src/config/cours/chapitres/commissions-des-partenaires";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LA_MISE_EN_AVANT_PAYANTE, miseEnAvant } from "../../src/config/cours/situations/par-chapitre/la-mise-en-avant-payante";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES COMMISSIONS DES CANAUX PARTENAIRES, AU CABINET DU MONDE DU COURS, ET SON CAS : LA MISE EN AVANT
 * PAYANTE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche du cabinet (monde/atlas-conseil.ts),
 * sans les fonctions du chapitre ni le modèle (monde/relation-client.ts) : le compte moyen, l'attrition,
 * le coût d'acquisition, les commissions sur la vie, la commission plafond, les retours en direct, la
 * valeur vie actualisée et l'apporteur. Les curseurs (attendu, position voisine, droites aux bornes,
 * lecture), le laboratoire (au départ, à la solution, et les courbes de son graphique) et les verdicts
 * sont épinglés. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "conseil";
const cas = casDeLEntreprise(code);
const f = ATLAS_CONSEIL;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const dixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

// La fiche, refaite à la main.
const ca = somme(f.comptes.map((c) => c.chiffreDAffaires)) / f.comptes.length;
const marge = somme(f.comptes.map((c) => c.marge)) / f.comptes.length;
const anneeN = f.portefeuilleDesAnnees.find((a) => a.annee === "N")!;
const attrition = anneeN.perdus / anneeN.auPremierJanvier;
const cac = somme(f.canaux.map((k) => k.cout)) / somme(f.canaux.map((k) => k.contrats));
const vv = marge / attrition;
const enPropre = vv - cac;
const plateforme = f.partenaires.find((p) => p.code === "plateforme")!;
const apporteur = f.partenaires.find((p) => p.code === "apporteur")!;
const suivantes = (1 - attrition) / attrition;
const premiere = ca * plateforme.commission;
const suivante = premiere * (1 - plateforme.partQuiRevientEnDirect);
const vie = premiere + suivante * suivantes;
const facteur = 1 + (1 - plateforme.partQuiRevientEnDirect) * suivantes;
const r = f.tauxDActualisation;

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
      const ra = e.rates?.(c);
      return [e.titre, e.question(c), ...e.explication(c), ...e.lecture(c, k.attendu).map((l) => l.libelle), ...e.droites(c).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", ra?.dessous ?? "", ra?.dessus ?? "", e.montrer ?? ""];
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|vingt|trente|cent) (comptes?|journées?|trimestres?|années?|ans|devis|contrats?|commerciaux|consultants?|points?|canaux|partenaires)\b/i);
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
      if (champs.some((x) => /^Écart/.test(x.libelle))) expect(e.question(cas, etat), e.id).toMatch(/Négatif pour un écart (favorable|défavorable)/);
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

describe("les commissions des partenaires, au cabinet du monde du cours", () => {
  const ch = COMMISSIONS_DES_PARTENAIRES;

  it("se joue chez ATLAS CONSEIL seule, au palier 3 du BTS NDRC", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(LA_MISE_EN_AVANT_PAYANTE);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(3);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 3 · Relation client et animation de réseaux"]);
    expect(f.entreprise).toBe("ATLAS CONSEIL");
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    // Le délai de reversement a disparu : la fiche n'a ni délai ni taux de financement.
    expect(ch.etapes.map((e) => e.id)).not.toContain("delai");
    expect(ch.etapes.map((e) => e.id)).toContain("l-apporteur");
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([ca, marge, attrition, cac, vv, enPropre]).toEqual([43_200, 21_000, 0.25, 15_000, 84_000, 69_000]);
    expect([plateforme.commission, plateforme.partQuiRevientEnDirect, apporteur.commission, apporteur.partQuiRevientEnDirect]).toEqual([0.2, 0.4, 0.1, 1]);
    expect([premiere, suivante, suivantes, centime(vie), centime(vv - vie), facteur]).toEqual([8_640, 5_184, 3, 24_192, 59_808, 2.8]);
  });

  it("les étapes guidées : la commission de la première année, puis la vie du compte", () => {
    expect(attendus(ch, "la-commission")).toEqual({
      "Commission de la première année": 8_640,
      "Part de la marge du compte prélevée (%)": dixieme((premiere / marge) * 100),
      "Marge laissée au cabinet la première année": marge - premiere,
    });
    expect([dixieme((premiere / marge) * 100), marge - premiere]).toEqual([41.1, 12_360]);
    expect(attendus(ch, "sur-la-vie")).toEqual({
      "Commission d'une année suivante": suivante,
      "Années suivantes attendues": suivantes,
      "Commissions sur toute la vie du compte": centime(vie),
      "Valeur vie nette avec la plateforme": centime(vv - vie),
    });
  });

  it("le pari et le curseur du plafond : 12 %, et le piège de la première année à 34 %", () => {
    expect(juste(ch, "predire-le-plafond")).toBe("Sous 20 % : la commission revient chaque année sur les comptes restés chez elle");
    // La valeur vie nette à la commission t : 84 000 − 43 200 × t × 2,8 ; elle vaut la conquête tant qu'elle reste à 69 000 €.
    const net = (t: number) => vv - ((ca * t) / 100) * facteur;
    const plafond = Math.floor((cac / (ca * facteur)) * 100);
    expect(plafond).toBe(12);
    expect(net(12)).toBeGreaterThanOrEqual(enPropre);
    expect(net(13)).toBeLessThan(enPropre);
    expect(curseur(ch, "le-plafond-au-curseur")).toEqual({
      attendu: 12,
      bornes: [0, 40],
      droites: [vv, enPropre, centime(net(40)), enPropre],
      lecture: {
        "Commission de la première année": centime(ca * 0.12),
        "Commissions sur toute la vie du compte": centime(ca * 0.12 * facteur),
        "Valeur vie nette avec la plateforme": centime(net(12)),
        "Valeur vie nette en propre": enPropre,
        "Écart en faveur de la plateforme": centime(net(12) - enPropre),
      },
    });
    expect([centime(ca * 0.12), centime(ca * 0.12 * facteur), centime(net(12) - enPropre), centime(net(40))]).toEqual([5_184, 14_515.2, 484.8, 35_616]);
  });

  it("l'étape autonome du plafond : 2,8 €, 12,4 %, et 34,7 % sur la première année seule", () => {
    expect(attendus(ch, "le-plafond")).toEqual({
      "Ce que coûte 1 € de commission annuelle, sur la vie": facteur,
      "Commission plafond (%)": dixieme((cac / (ca * facteur)) * 100),
      "Commission plafond sur la première année seule (%)": dixieme((cac / ca) * 100),
    });
    expect([dixieme((cac / (ca * facteur)) * 100), dixieme((cac / ca) * 100)]).toEqual([12.4, 34.7]);
  });

  it("les retours en direct : le pari, le curseur à 76 %, puis 75,5 % et 8,7 % sans retour", () => {
    expect(juste(ch, "predire-les-retours")).toBe("Plus de la moitié : chaque compte resté chez elle repaie sa commission");
    // Les commissions sur la vie à une part d de retours : 8 640 + 8 640 × (1 − d) × 3, face aux 15 000 € de la conquête.
    const vieA = (d: number) => premiere + premiere * (1 - d / 100) * suivantes;
    expect(vieA(76)).toBeLessThanOrEqual(cac);
    expect(vieA(75)).toBeGreaterThan(cac);
    expect(curseur(ch, "les-retours-au-curseur")).toEqual({
      attendu: 76,
      bornes: [0, 100],
      droites: [cac, premiere * (1 + suivantes), cac, premiere],
      lecture: {
        "Commission d'une année suivante": centime(premiere * 0.24),
        "Commissions sur toute la vie du compte": centime(vieA(76)),
        "Coût de la conquête en propre": cac,
        "Écart en faveur de la plateforme": centime(cac - vieA(76)),
      },
    });
    expect([centime(premiere * 0.24), centime(vieA(76)), centime(cac - vieA(76))]).toEqual([2_073.6, 14_860.8, 139.2]);
    const payable = (cac - premiere) / suivantes;
    expect(attendus(ch, "les-retours-en-direct")).toEqual({
      "Commission annuelle que la conquête peut encore payer": payable,
      "Part des comptes revenus en direct nécessaire (%)": dixieme((1 - payable / premiere) * 100),
      "Commission plafond sans aucun retour en direct (%)": dixieme((cac / (ca * (1 + suivantes))) * 100),
    });
    expect([payable, dixieme((1 - payable / premiere) * 100), dixieme((cac / (ca * (1 + suivantes))) * 100)]).toEqual([2_120, 75.5, 8.7]);
    expect(juste(ch, "le-client")).toBe("Le compte de la plateforme repaie sa commission, s'il n'est pas revenu en direct");
  });

  it("le laboratoire : à la valeur vie actualisée, le plafond monte à 16 %", () => {
    expect(juste(ch, "predire-l-actualisation")).toBe("Monte : les commissions se paient plus tard, la conquête aujourd'hui");
    const l = laboratoire(ch, "le-laboratoire-des-partenaires");
    expect(l.depart).toEqual({ commission: 20, part: 40, horizon: 1, methode: 0 });
    expect(l.solution).toEqual({ commission: 16, part: 40, horizon: 12, methode: 10 });
    expect(l.reussi).toEqual([false, true]);
    // La solution est la plus haute commission qui tient : à 17 %, la plateforme ne vaut plus la conquête.
    expect(l.atteint({ ...l.solution, commission: 15 })).toBe(false);
    expect(l.atteint({ ...l.solution, commission: 17 })).toBe(false);
    expect(l.atteint({ ...l.solution, horizon: 3 })).toBe(true);
    // Les commissions actualisées sur la vie, à la main : p ÷ 1,1 + p × (1 − d) × 0,75 ÷ (1,1 × 0,35).
    const actualisees = (t: number, d: number) => (ca * t) / (1 + r) + (ca * t * (1 - d) * (1 - attrition)) / ((1 + r) * (attrition + r));
    const vva = marge / (attrition + r);
    expect(vva).toBeCloseTo(60_000, 9);
    expect(vva - actualisees(0.16, 0.4)).toBeGreaterThanOrEqual(vva - cac);
    expect(vva - actualisees(0.17, 0.4)).toBeLessThan(vva - cac);
    expect(l.auDepart).toEqual({
      "Commission de la première année": 8_640,
      "Commissions sur les années lues": 8_640,
      "Commissions sur toute la vie du compte": 24_192,
      "Valeur vie du compte": 84_000,
      "Valeur vie nette avec la plateforme": 59_808,
      "Valeur vie nette en propre": 69_000,
      "Écart en faveur de la plateforme": -9_192,
    });
    // À la solution : 16 % de 43 200 €, 40 % de retours, lus sur 12 ans, actualisés à 10 %.
    const p16 = ca * 0.16;
    const s16 = p16 * 0.6;
    const rho = (1 - attrition) / (1 + r);
    const sur12 = p16 / (1 + r) + (s16 / (1 + r)) * ((rho * (1 - Math.pow(rho, 11))) / (1 - rho));
    expect(l.aLaSolution).toEqual({
      "Commission de la première année": p16,
      "Commissions sur les années lues": centime(sur12),
      "Commissions sur toute la vie du compte": centime(actualisees(0.16, 0.4)),
      "Valeur vie du compte": 60_000,
      "Valeur vie nette avec la plateforme": centime(60_000 - centime(actualisees(0.16, 0.4))),
      "Valeur vie nette en propre": 45_000,
      "Écart en faveur de la plateforme": centime(60_000 - centime(actualisees(0.16, 0.4)) - 45_000),
    });
    expect([p16, centime(actualisees(0.16, 0.4)), centime(sur12)]).toEqual([6_912, 14_362.6, 14_243]);
  });

  it("le graphique du laboratoire : les commissions cumulées montent vite, puis de moins en moins, et passent la conquête à la 3e année", () => {
    const { e, depart } = laboratoire(ch, "le-laboratoire-des-partenaires");
    const g = e.graphique!(cas);
    expect(g.levier).toBe("horizon");
    const [cumul, conquete] = g.courbes;
    const a = (h: number) => cumul!.valeur({ ...depart, horizon: h });
    // À 20 %, 40 % de retours, valeur vie simple : 8 640, puis + 5 184 × 0,75, puis + 5 184 × 0,75².
    expect([a(1), a(2), a(3)]).toEqual([8_640, 12_528, 15_444]);
    expect(a(12)).toBeCloseTo(premiere + suivante * ((0.75 * (1 - Math.pow(0.75, 11))) / 0.25), 1);
    expect(a(2) - a(1)).toBeGreaterThan(a(3) - a(2));
    expect(a(2)).toBeLessThan(cac);
    expect(a(3)).toBeGreaterThan(cac);
    expect(conquete!.valeur({ ...depart, horizon: 7 })).toBe(cac);
  });

  it("les étapes d'expert : la valeur vie actualisée, l'apporteur payé une fois, et le canal le moins cher", () => {
    const a = attrition;
    const actualisees = premiere / (1 + r) + (suivante * (1 - a)) / ((1 + r) * (a + r));
    const facteurA = 1 / (1 + r) + ((1 - plateforme.partQuiRevientEnDirect) * (1 - a)) / ((1 + r) * (a + r));
    expect(attendus(ch, "la-valeur-actualisee")).toEqual({
      "Valeur vie actualisée du compte": 60_000,
      "Commissions sur la vie, actualisées": centime(actualisees),
      "Valeur vie nette actualisée avec la plateforme": centime(60_000 - actualisees),
      "Valeur vie nette actualisée en propre": 60_000 - cac,
      "Commission plafond actualisée (%)": dixieme((cac / (ca * facteurA)) * 100),
    });
    expect([centime(actualisees), centime(60_000 - actualisees), dixieme((cac / (ca * facteurA)) * 100)]).toEqual([17_953.25, 42_046.75, 16.7]);
    const commission = ca * apporteur.commission;
    expect(attendus(ch, "l-apporteur")).toEqual({
      "Commission de l'apporteur": commission,
      "Valeur vie nette avec l'apporteur": vv - commission,
      "Ce que l'apporteur laisse de plus que la conquête": vv - commission - enPropre,
      "Commission plafond de l'apporteur (%)": dixieme((cac / ca) * 100),
    });
    expect([commission, vv - commission, vv - commission - enPropre]).toEqual([4_320, 79_680, 10_680]);
    expect(juste(ch, "tout-par-l-apporteur")).toBe("Non : il n'a présenté que 4 entreprises dans l'année ; il complète la conquête");
  });

  it("la synthèse finit sur l'arène", () => {
    const s = ch.etapes.find((e) => e.id === "synthese");
    if (s?.type !== "lecture") throw new Error("Pas de synthèse");
    expect(s.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("la mise en avant payante : sur la vie, la mise en avant paie ; sur la première année, elle perd", () => {
  const s = LA_MISE_EN_AVANT_PAYANTE;
  const ch = COMMISSIONS_DES_PARTENAIRES;
  // Les deux offres, à la main : 5 comptes à 20 %, ou 6 comptes à 25 %.
  const offre = (t: number, n: number) => {
    const p = ca * t;
    const v = p + p * (1 - plateforme.partQuiRevientEnDirect) * suivantes;
    return { p, v, net: vv - v, valeur: n * (vv - v), premiereAnnee: n * (marge - p) };
  };
  const b = offre(0.2, 5);
  const m = offre(0.25, 6);

  it("est le cas dédié du chapitre, à la même entreprise", () => {
    casDedie(s, ch);
    expect(s.code).toBe("la-mise-en-avant-payante");
    expect(s.commanditaire).toBe("La directrice commerciale");
  });

  it("la première année, refaite à la main : la mise en avant laisse 600 € de moins", () => {
    expect(attendus(s, "la-premiere-annee")).toEqual({
      "Commission de la première année, offre de base": b.p,
      "Commission de la première année, mise en avant": m.p,
      "Marge de la première année, offre de base": b.premiereAnnee,
      "Marge de la première année, mise en avant": m.premiereAnnee,
    });
    expect([b.p, m.p, b.premiereAnnee, m.premiereAnnee]).toEqual([8_640, 10_800, 61_800, 61_200]);
  });

  it("la vie des comptes, refaite à la main : la mise en avant laisse 23 520 € de plus", () => {
    expect(attendus(s, "sur-la-vie")).toEqual({
      "Commissions sur la vie d'un compte, mise en avant": m.v,
      "Valeur vie nette d'un compte, offre de base": centime(b.net),
      "Valeur vie nette d'un compte, mise en avant": m.net,
      "Valeur vie nette des comptes d'une année, offre de base": centime(b.valeur),
      "Valeur vie nette des comptes d'une année, mise en avant": m.valeur,
    });
    expect([m.v, centime(b.net), m.net, centime(b.valeur), m.valeur, centime(m.valeur - b.valeur)]).toEqual([30_240, 59_808, 53_760, 299_040, 322_560, 23_520]);
  });

  it("le calcul à rebours croise les deux lectures : 11,25 % sur la vie, 21,2 % sur la première année, pour 20 % promis", () => {
    const n = b.valeur / m.net;
    const n1 = b.premiereAnnee / (marge - m.p);
    expect(attendus(s, "a-rebours")).toEqual({
      "Comptes nécessaires, sur la vie": centime(n),
      "Hausse nécessaire des comptes, sur la vie (%)": centime((n / 5 - 1) * 100),
      "Hausse nécessaire, sur la première année seule (%)": dixieme((n1 / 5 - 1) * 100),
    });
    expect([centime(n), centime((n / 5 - 1) * 100), dixieme((n1 / 5 - 1) * 100)]).toEqual([5.56, 11.25, 21.2]);
    expect(miseEnAvant(cas).promesse).toBe(20);
  });

  it("le curseur du cas : la mise en avant tient jusqu'à 28 % de commission", () => {
    const valeur = (t: number) => 6 * (vv - ((ca * t) / 100) * facteur);
    expect(valeur(28)).toBeGreaterThanOrEqual(b.valeur);
    expect(valeur(29)).toBeLessThan(b.valeur);
    expect(curseur(s, "jusqu-ou")).toEqual({
      attendu: 28,
      bornes: [20, 40],
      droites: [centime(valeur(20)), centime(b.valeur), centime(valeur(40)), centime(b.valeur)],
      lecture: {
        "Commissions sur la vie d'un compte": centime(ca * 0.28 * facteur),
        "Valeur vie nette des comptes promis": centime(valeur(28)),
        "Valeur vie nette des comptes de l'offre de base": centime(b.valeur),
        "Écart en faveur de la mise en avant": centime(valeur(28) - b.valeur),
      },
    });
    expect([centime(valeur(28)), centime(valeur(28) - b.valeur)]).toEqual([300_787.2, 1_747.2]);
  });

  it("le verdict : signer, et non refuser sur la première année", () => {
    expect(miseEnAvant(cas).signer).toBe(true);
    expect(juste(s, "reponse")).toBe("Signer : sur la vie, la mise en avant laisse 23 520 € de plus");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
