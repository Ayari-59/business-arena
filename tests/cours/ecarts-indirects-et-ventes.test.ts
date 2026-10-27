import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ECART_SUR_ACTIVITE_A_REBOURS,
  ECART_SUR_BUDGET_A_REBOURS,
  LES_ECARTS_SUR_CHARGES_INDIRECTES,
  VARIANTE_EN_SOUS_ACTIVITE,
  centreDeMontage,
} from "../../src/config/cours/chapitres/les-ecarts-sur-charges-indirectes";
import {
  COMPOSITION_PREVUE_VARIANTE,
  ECART_SUR_PRIX_A_REBOURS,
  LES_ECARTS_SUR_VENTES_ET_MARGE,
  PRIX_DE_LA_NOMADE_A_REBOURS,
  ventesEtMarge,
} from "../../src/config/cours/chapitres/les-ecarts-sur-ventes-et-marge";
import { L_USINE_DE_NOVA } from "../../src/config/cours/monde/nova-usine";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { LE_CENTRE_QUI_A_TROP_TOURNE, centreQuiATropTourne } from "../../src/config/cours/situations/par-chapitre/le-centre-qui-a-trop-tourne";
import { L_OBJECTIF_DU_COMMERCIAL, objectifDuCommercial } from "../../src/config/cours/situations/par-chapitre/l-objectif-du-commercial";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES ÉCARTS SUR CHARGES INDIRECTES ET LES ÉCARTS SUR VENTES ET MARGE, À L'USINE DU MONDE DU COURS,
 * ET LEURS CAS : LE CENTRE QUI A TROP TOURNÉ, L'OBJECTIF DU COMMERCIAL.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de l'usine (monde/nova-usine.ts),
 * sans les fonctions des chapitres ni le modèle (monde/ecarts.ts) ; les valeurs absolues sont
 * épinglées, les variantes (sous-activité, autre composition prévue, calculs à rebours) refaites
 * comme le reste, et les verdicts aussi. Puis les gardes de texte du pilote : rien d'indéfini, pas
 * de « de le », pas de tiret au milieu d'une phrase, des élisions faites, le signe moins, une seule
 * bonne réponse, aucune option qui en contient une autre, des libellés uniques, des notions qui
 * existent, des accords avec « enceinte ».
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = L_USINE_DE_NOVA;
const [nomade, salon] = f.modeles;
const r = f.realise;
const centime = (x: number) => Math.round(x * 100) / 100;

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
      return [e.titre, e.question(c), d.consigne, d.indice(depart), ...e.explication(c, d.solution), ...e.lecture(c, d.solution).map((l) => l.libelle), ...e.leviers(c).flatMap((l) => [l.libelle, l.unite])];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles du pilote). */
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|Nomade|Salon)\b/i);
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

/** Un laboratoire : sa lecture au départ et à la solution, par libellé (montant, effet sur le résultat). */
function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
  ["DCG UE11 · Contrôle de gestion", "dcg"],
  ["BUT GACO · Participer au pilotage interne de l'organisation", "but-gaco"],
  ["BUT GEA · Concevoir des outils de contrôle de gestion", "but-gea"],
] as const;

describe("les deux chapitres et leurs cas, à l'usine du monde du cours", () => {
  it("se jouent à l'usine de NOVA, au palier 4 du contrôle de gestion, avec leurs blocs", () => {
    for (const ch of [LES_ECARTS_SUR_CHARGES_INDIRECTES, LES_ECARTS_SUR_VENTES_ET_MARGE]) {
      expect(CHAPITRES).toContain(ch);
      expect(ch.parcours).toBe("controle-de-gestion");
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
    }
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(LE_CENTRE_QUI_A_TROP_TOURNE);
    expect(SITUATIONS).toContain(L_OBJECTIF_DU_COMMERCIAL);
  });
});

describe("les écarts sur charges indirectes : le centre de montage", () => {
  const ch = LES_ECARTS_SUR_CHARGES_INDIRECTES;
  const k = f.centre;
  // La fiche, refaite à la main.
  const partFixe = k.chargesFixes / k.activiteNormale;
  const cHm = k.coutVariableParHeure + partFixe;
  const qN = r.ventes.nomade.quantite;
  const qS = r.ventes.salon.quantite;
  const hN = qN * nomade!.heuresMachineParUnite;
  const hS = qS * salon!.heuresMachineParUnite;
  const hp = hN + hS;
  const hr = r.centre.heuresMachine;
  const preetabliProd = hp * cHm;
  const bf = k.chargesFixes + k.coutVariableParHeure * hr;
  const preetabliActivite = hr * cHm;
  const budget = r.centre.cout - bf;
  const activite = bf - preetabliActivite;
  const rendement = (hr - hp) * cHm;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([partFixe, cHm, hN, hS, hp, hr]).toEqual([24, 40, 2_750, 2_300, 5_050, 5_200]);
    expect([preetabliProd, bf, preetabliActivite]).toEqual([202_000, 203_200, 208_000]);
    expect([budget, activite, rendement]).toEqual([9_800, -4_800, 6_000]);
    expect(budget + activite + rendement).toBe(r.centre.cout - preetabliProd);
    expect(r.centre.cout - preetabliProd).toBe(11_000);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "l-heure-machine")).toEqual({ "Part fixe d'une heure-machine": partFixe, "Coût standard de l'heure-machine": cHm });
    expect(attendus(ch, "activite-preetablie")).toEqual({
      "Heures-machine préétablies des Nomade": hN,
      "Heures-machine préétablies des Salon": hS,
      "Activité préétablie de la production réelle": hp,
    });
    expect(attendus(ch, "ecart-global")).toEqual({ "Coût préétabli de la production réelle": preetabliProd, "Écart global du centre": 11_000 });
    expect(attendus(ch, "ecart-sur-budget")).toEqual({ "Budget flexible de l'activité réelle": bf, "Écart sur budget": budget });
  });

  it("les étapes autonomes : activité, rendement, imputation rationnelle", () => {
    expect(attendus(ch, "activite-et-rendement")).toEqual({
      "Coût préétabli de l'activité réelle": preetabliActivite,
      "Écart sur activité": activite,
      "Écart sur rendement": rendement,
    });
    const coefficient = hr / k.activiteNormale;
    expect(coefficient).toBe(1.04);
    expect(attendus(ch, "imputation-rationnelle")).toEqual({
      "Coefficient d'imputation rationnelle": 1.04,
      "Charges fixes imputées": 124_800,
      "Différence d'imputation": 4_800,
    });
    // Le boni de suractivité est l'écart sur activité, de l'autre côté.
    expect(k.chargesFixes * coefficient - k.chargesFixes).toBeCloseTo(-activite, 6);
  });

  it("les étapes d'expert : une heure perdue pèse sur l'activité et sur le rendement", () => {
    const perdues = hr - hp;
    expect(perdues).toBe(150);
    expect(attendus(ch, "les-heures-perdues")).toEqual({
      "Part de l'écart sur activité due aux heures perdues": -perdues * partFixe,
      "Écart sur activité aux seules heures de la production": -(hp - k.activiteNormale) * partFixe,
      "Coût net des heures perdues": perdues * k.coutVariableParHeure,
    });
    expect([-perdues * partFixe, -(hp - k.activiteNormale) * partFixe, perdues * k.coutVariableParHeure]).toEqual([-3_600, -1_200, 2_400]);
    // Les deux parts de l'écart sur activité refont l'écart sur activité.
    expect(-perdues * partFixe + -(hp - k.activiteNormale) * partFixe).toBe(activite);
    expect(juste(ch, "predire-l-activite")).toBe("Favorable : les charges fixes se répartissent sur plus d'heures");
    expect(juste(ch, "ce-que-coute-une-heure-perdue")).toBe("2\u202f400 € : leur seul coût variable");
  });

  it("la variante en sous-activité, refaite à la main : le tableau complet et ses trois écarts", () => {
    expect(VARIANTE_EN_SOUS_ACTIVITE).toEqual({ heuresMachine: 4_600, cout: 198_000, production: { nomade: 10_000, salon: 4_000 } });
    const hv = 4_600;
    const hpv = 10_000 * nomade!.heuresMachineParUnite + 4_000 * salon!.heuresMachineParUnite;
    const bfv = k.chargesFixes + k.coutVariableParHeure * hv;
    const v = {
      "Budget flexible de l'activité réelle": bfv,
      "Coût préétabli de l'activité réelle": hv * cHm,
      "Coût préétabli de la production réelle": hpv * cHm,
      "Écart sur budget": 198_000 - bfv,
      "Écart sur activité": bfv - hv * cHm,
      "Écart sur rendement": (hv - hpv) * cHm,
    };
    expect(attendus(ch, "en-sous-activite")).toEqual(v);
    expect(Object.values(v)).toEqual([193_600, 184_000, 180_000, 4_400, 9_600, 4_000]);
    // Sous l'activité normale, l'écart sur activité est défavorable : c'est le coût de la sous-activité.
    expect(v["Écart sur activité"]).toBe((k.activiteNormale - hv) * partFixe);
    expect(centreDeMontage(cas).variante.sousActivite).toBe(k.chargesFixes - k.chargesFixes * (hv / k.activiteNormale));
    expect(v["Écart sur budget"] + v["Écart sur activité"] + v["Écart sur rendement"]).toBe(198_000 - hpv * cHm);
  });

  it("le calcul à rebours, refait à la main", () => {
    expect([ECART_SUR_ACTIVITE_A_REBOURS, ECART_SUR_BUDGET_A_REBOURS]).toEqual([-2_400, 3_000]);
    const activiteReelle = k.activiteNormale + 2_400 / partFixe;
    const bfr = k.chargesFixes + k.coutVariableParHeure * activiteReelle;
    expect(attendus(ch, "a-rebours")).toEqual({
      "Activité réelle, en heures-machine": activiteReelle,
      "Budget flexible de cette activité": bfr,
      "Coût réel du centre": bfr + 3_000,
    });
    expect([activiteReelle, bfr, bfr + 3_000]).toEqual([5_100, 201_600, 204_600]);
    // Le coût réel retrouvé redonne bien les deux écarts reçus.
    expect(bfr - activiteReelle * cHm).toBe(-2_400);
  });

  it("les verdicts : la bonne référence, le boni n'est pas une économie, qui doit agir", () => {
    expect(juste(ch, "la-bonne-reference")).toBe(`Au coût préétabli de la production réelle, 202 000 €`);
    expect(juste(ch, "le-boni-de-suractivite")).toBe("Ce n'est pas une économie : le centre a payé toutes ses charges fixes, réparties sur plus d'heures");
    const tri = ch.etapes.find((e) => e.id === "qui-doit-agir") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Écart sur budget": [budget, "centre"],
      "Écart sur rendement": [rendement, "atelier"],
      "Écart sur activité": [activite, "direction"],
      "Écart sur activité de la variante": [9_600, "direction"],
    });
  });

  it("les curseurs du centre, refaits à la main : le croisement à l'activité normale, la limite des heures", () => {
    // Coût imputé 40 × h face au budget flexible 120 000 + 16 × h : ils se croisent à 120 000 ÷ 24.
    expect(curseur(ch, "faire-tourner-le-centre")).toEqual({
      attendu: 5_000,
      bornes: [4_000, 6_000],
      droites: [cHm * 4_000, k.chargesFixes + 16 * 4_000, cHm * 6_000, k.chargesFixes + 16 * 6_000],
      lecture: { "Coût imputé (coût préétabli de l'activité)": 200_000, "Budget flexible de ces heures": 200_000, "Charges fixes imputées": 120_000, "Écart sur activité": 0 },
    });
    // Sans dépense en plus, le centre tient le coût préétabli de la production tant que 120 000 + 16 × h ≤ 202 000.
    const limite = Math.floor((preetabliProd - k.chargesFixes) / k.coutVariableParHeure);
    expect(limite).toBe(5_125);
    expect(curseur(ch, "jusqu-ou-tourner")).toEqual({
      attendu: limite,
      bornes: [4_000, 6_000],
      droites: [preetabliProd, k.chargesFixes + 16 * 4_000, preetabliProd, k.chargesFixes + 16 * 6_000],
      lecture: {
        "Budget flexible de ces heures": k.chargesFixes + 16 * limite,
        "Écart sur activité": k.chargesFixes + 16 * limite - cHm * limite,
        "Écart sur rendement": (limite - hp) * cHm,
        "Écart global, sans écart sur budget": 0,
      },
    });
    expect([k.chargesFixes + 16 * limite - cHm * limite, (limite - hp) * cHm]).toEqual([-3_000, 3_000]);
  });

  it("le laboratoire du centre : annuler rendement et budget laisse l'écart sur activité", () => {
    const l = laboratoire(ch, "le-laboratoire-du-centre");
    expect(l.depart).toEqual({ heures: 5_200, cout: 213_000 });
    expect(l.solution).toEqual({ heures: hp, cout: k.chargesFixes + 16 * hp });
    expect(l.reussi).toEqual([false, true]);
    // Les lignes d'effet sont l'effet sur le résultat : l'opposé de l'écart sur une charge.
    expect(l.auDepart).toEqual({
      "Budget flexible de ces heures": bf,
      "Coût préétabli de la production réelle": preetabliProd,
      "Écart sur budget": -budget,
      "Écart sur activité": -activite,
      "Écart sur rendement": -rendement,
      "Écart global du centre": -(budget + activite + rendement),
    });
    const bfSolution = k.chargesFixes + 16 * hp;
    expect(l.aLaSolution).toEqual({
      "Budget flexible de ces heures": bfSolution,
      "Coût préétabli de la production réelle": preetabliProd,
      "Écart sur budget": 0,
      "Écart sur activité": -(bfSolution - cHm * hp),
      "Écart sur rendement": 0,
      "Écart global du centre": -(bfSolution - cHm * hp),
    });
    expect([bfSolution, bfSolution - cHm * hp]).toEqual([200_800, -1_200]);
  });

  it("le cas : le volume n'explique pas le dépassement", () => {
    const s = LE_CENTRE_QUI_A_TROP_TOURNE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le directeur de l'usine");
    expect(attendus(s, "les-heures")).toEqual({ "Activité préétablie de la production réelle": hp, "Heures-machine perdues": hr - hp });
    expect(attendus(s, "les-trois-ecarts")).toEqual({ "Écart sur budget": budget, "Écart sur activité": activite, "Écart sur rendement": rendement });
    // Le croisement : aux seules heures de la production, avec la même dépense au-delà du budget flexible.
    const coutSans = k.chargesFixes + k.coutVariableParHeure * hp + budget;
    expect(attendus(s, "sans-les-heures-perdues")).toEqual({
      "Écart sur activité aux seules heures de la production": -(hp - k.activiteNormale) * partFixe,
      "Coût du centre à ces heures": coutSans,
      "Dépassement restant": coutSans - preetabliProd,
    });
    expect([coutSans, coutSans - preetabliProd]).toEqual([210_600, 8_600]);
    // Le curseur du cas : à dépense égale (9 800 € au-delà du budget flexible), le centre ne tenait le coût
    // préétabli qu'à 120 000 + 16 × h + 9 800 ≤ 202 000.
    const auPlus = Math.floor((preetabliProd - k.chargesFixes - budget) / 16);
    expect(auPlus).toBe(4_512);
    expect(curseur(s, "le-volume-au-curseur")).toEqual({
      attendu: auPlus,
      bornes: [4_000, 6_000],
      droites: [preetabliProd, k.chargesFixes + 16 * 4_000 + budget, preetabliProd, k.chargesFixes + 16 * 6_000 + budget],
      lecture: {
        "Coût du centre, à la même dépense": k.chargesFixes + 16 * auPlus + budget,
        "Coût préétabli de la production réelle": preetabliProd,
        "Dépassement": k.chargesFixes + 16 * auPlus + budget - preetabliProd,
      },
    });
    expect(auPlus).toBeLessThan(hp);
    expect(centreQuiATropTourne(cas).verdict).toBe("le-volume-n-explique-pas");
    expect(juste(s, "reponse")).toBe("Non : sans aucune heure perdue, il resterait 8 600 € de dépassement, une dépense du centre");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_CENTRE_QUI_A_TROP_TOURNE));
});

describe("les écarts sur chiffre d'affaires et sur marge", () => {
  const ch = LES_ECARTS_SUR_VENTES_ET_MARGE;
  const N = { qp: nomade!.quantitePrevue, qr: r.ventes.nomade.quantite, pp: nomade!.prixPrevu, pr: r.ventes.nomade.prix };
  const S = { qp: salon!.quantitePrevue, qr: r.ventes.salon.quantite, pp: salon!.prixPrevu, pr: r.ventes.salon.prix };
  // Le coût préétabli d'une enceinte, refait à la main : matière + main-d'œuvre directe + centre.
  const cHm = f.centre.coutVariableParHeure + f.centre.chargesFixes / f.centre.activiteNormale;
  const cout = (m: typeof nomade) => m!.matiereParUnite * f.prixStandardDuKilo + m!.heuresParUnite * f.tauxHoraireStandard + m!.heuresMachineParUnite * cHm;
  const cN = cout(nomade);
  const cS = cout(salon);
  const mN = N.pp - cN;
  const mS = S.pp - cS;
  const caPrevu = N.qp * N.pp + S.qp * S.pp;
  const caReel = N.qr * N.pr + S.qr * S.pr;
  const prixN = (N.pr - N.pp) * N.qr;
  const prixS = (S.pr - S.pp) * S.qr;
  const quantites = (N.qr - N.qp) * N.pp + (S.qr - S.qp) * S.pp;
  const margePrevue = N.qp * mN + S.qp * mS;
  const margeReelle = N.qr * (N.pr - cN) + S.qr * (S.pr - cS);
  const qTp = N.qp + S.qp;
  const qTr = N.qr + S.qr;
  const moyenne = margePrevue / qTp;
  const mixN = (qTr * N.qp) / qTp;
  const mixS = (qTr * S.qp) / qTp;

  it("la fiche donne les chiffres de la consigne", () => {
    expect([cN, cS, mN, mS]).toEqual([32, 75, 27, 44]);
    expect([caPrevu, caReel, caReel - caPrevu]).toEqual([1_184_000, 1_183_600, -400]);
    expect([prixN, prixS, quantites]).toEqual([-22_000, 9_200, 12_400]);
    expect([margePrevue, margeReelle, margeReelle - margePrevue]).toEqual([500_000, 486_600, -13_400]);
    expect([moyenne, mixN, mixS]).toEqual([31.25, 11_700, 3_900]);
  });

  it("les étapes guidées : chiffre d'affaires, prix et quantités, marge préétablie, quantité globale", () => {
    expect(attendus(ch, "chiffre-d-affaires")).toEqual({ "Chiffre d'affaires prévu": caPrevu, "Chiffre d'affaires réel": caReel, "Écart sur chiffre d'affaires": caReel - caPrevu });
    expect(attendus(ch, "prix-et-quantites")).toEqual({ "Écart sur prix de la Nomade": prixN, "Écart sur prix de la Salon": prixS, "Écart sur quantités": quantites });
    expect(prixN + prixS + quantites).toBe(caReel - caPrevu);
    expect(attendus(ch, "la-marge-preetablie")).toEqual({ "Marge préétablie d'une Nomade": mN, "Marge préétablie d'une Salon": mS, "Marge préétablie prévue du trimestre": margePrevue });
    expect(attendus(ch, "quantite-globale")).toEqual({ "Marge préétablie moyenne prévue": moyenne, "Écart sur quantité globale": (qTr - qTp) * moyenne });
    expect((qTr - qTp) * moyenne).toBe(-12_500);
  });

  it("les étapes autonomes : écart sur marge, volume par modèle, composition", () => {
    const volume = (N.qr - N.qp) * mN + (S.qr - S.qp) * mS;
    expect(attendus(ch, "ecart-sur-marge")).toEqual({ "Marge réelle au coût préétabli": margeReelle, "Écart sur marge": margeReelle - margePrevue, "Écart sur volume": volume });
    // L'écart sur marge est l'écart sur prix plus l'écart sur volume.
    expect(prixN + prixS + volume).toBe(margeReelle - margePrevue);
    expect(attendus(ch, "volume-par-modele")).toEqual({ "Écart sur volume de la Nomade": (N.qr - N.qp) * mN, "Écart sur volume de la Salon": (S.qr - S.qp) * mS });
    const composition = (N.qr - mixN) * mN + (S.qr - mixS) * mS;
    expect(attendus(ch, "composition")).toEqual({ "Nomade à la composition prévue": mixN, "Salon à la composition prévue": mixS, "Écart sur composition des ventes": composition });
    expect([volume, composition]).toEqual([-600, 11_900]);
  });

  it("les étapes d'expert : les deux lectures du volume concordent, modèle par modèle", () => {
    const a = attendus(ch, "les-deux-lectures");
    expect(a).toEqual({
      "Écart sur quantité globale de la Nomade": (mixN - N.qp) * mN,
      "Écart sur composition de la Nomade": (N.qr - mixN) * mN,
      "Écart sur quantité globale de la Salon": (mixS - S.qp) * mS,
      "Écart sur composition de la Salon": (S.qr - mixS) * mS,
    });
    expect(Object.values(a)).toEqual([-8_100, -18_900, -4_400, 30_800]);
    // En ligne, le volume de chaque modèle ; en colonne, la quantité globale et la composition.
    expect(a["Écart sur quantité globale de la Nomade"]! + a["Écart sur composition de la Nomade"]!).toBe((N.qr - N.qp) * mN);
    expect(a["Écart sur quantité globale de la Salon"]! + a["Écart sur composition de la Salon"]!).toBe((S.qr - S.qp) * mS);
    expect(a["Écart sur quantité globale de la Nomade"]! + a["Écart sur quantité globale de la Salon"]!).toBe(-12_500);
    expect(a["Écart sur composition de la Nomade"]! + a["Écart sur composition de la Salon"]!).toBe(11_900);
    // La synthèse montre la même décomposition, et l'écart sur marge de chaque modèle.
    const t = ch.etapes.find((e) => e.id === "synthese")!.tableau!(cas);
    expect(t.lignes.find((l) => l.libelle === "Écart sur marge")!.valeurs).toEqual(["−49 000 €", "35 600 €", "−13 400 €"]);
  });

  it("la variante de composition, refaite à la main : le même réel donne un mix défavorable", () => {
    expect(COMPOSITION_PREVUE_VARIANTE).toEqual({ nomade: 0.6, salon: 0.4 });
    const vN = qTp * 0.6;
    const vS = qTp * 0.4;
    const moyenneV = (vN * mN + vS * mS) / qTp;
    const quantiteGlobaleV = (qTr - qTp) * moyenneV;
    const compositionV = (N.qr - (qTr * vN) / qTp) * mN + (S.qr - (qTr * vS) / qTp) * mS;
    expect(attendus(ch, "une-autre-composition")).toEqual({
      "Marge préétablie moyenne prévue de la variante": centime(moyenneV),
      "Écart sur quantité globale de la variante": centime(quantiteGlobaleV),
      "Écart sur composition de la variante": centime(compositionV),
    });
    expect([centime(moyenneV), centime(quantiteGlobaleV), centime(compositionV)]).toEqual([33.8, -13_520, -27_880]);
    // La concordance tient aussi dans la variante.
    expect(centime(quantiteGlobaleV + compositionV)).toBe((N.qr - vN) * mN + (S.qr - vS) * mS);
  });

  it("le calcul à rebours, refait à la main", () => {
    expect([PRIX_DE_LA_NOMADE_A_REBOURS, ECART_SUR_PRIX_A_REBOURS]).toEqual([58, -4_100]);
    const partN = (58 - N.pp) * N.qr;
    const partS = -4_100 - partN;
    expect(attendus(ch, "a-rebours")).toEqual({
      "Écart sur prix de la Nomade, au trimestre suivant": partN,
      "Écart sur prix de la Salon, au trimestre suivant": partS,
      "Prix réel de la Salon, au trimestre suivant": S.pp + partS / S.qr,
    });
    expect([partN, partS, S.pp + partS / S.qr]).toEqual([-11_000, 6_900, 120.5]);
  });

  it("les verdicts : un chiffre presque tenu, le volume à la marge, le mix qui masque, qui doit agir", () => {
    expect(juste(ch, "le-chiffre-presque-tenu")).toBe("Rien encore : deux gros écarts de sens contraire se compensent, et la marge reste à voir");
    expect(juste(ch, "le-volume-au-prix")).toBe("Une enceinte de plus ou de moins change le résultat de sa marge, et la baisse de prix porte sur ce qui a été vendu");
    expect(juste(ch, "le-mix-qui-masque")).toBe("Le volume total a baissé : 400 enceintes de moins coûtent 12 500 €, que le mix compense sans les effacer");
    const tri = ch.etapes.find((e) => e.id === "qui-doit-agir") as EtapeTri;
    expect(Object.fromEntries(tri.elements(cas).map((x) => [x.libelle, [x.montant, x.categorie]]))).toEqual({
      "Écart sur prix de la Nomade": [prixN, "commercial"],
      "Écart sur prix de la Salon": [prixS, "commercial"],
      "Écart sur composition des ventes": [11_900, "commercial"],
      "Écart sur quantité globale": [-12_500, "direction"],
    });
    expect(ventesEtMarge(cas).ecartSurMarge).toBe(margeReelle - margePrevue);
  });

  it("les curseurs des ventes, refaits à la main : le prix de la Nomade, le mix", () => {
    // La marge au coût préétabli, au prix p de la Nomade : 11 000 × (p − 32) + 4 600 × (121 − 75) ; il faut 500 000 €.
    const margeAuPrix = (p: number) => N.qr * (p - cN) + S.qr * (S.pr - cS);
    const prix = Math.ceil((margePrevue - S.qr * (S.pr - cS)) / N.qr + cN);
    expect(prix).toBe(59);
    expect(margeAuPrix(58)).toBeLessThan(margePrevue);
    const auPrix = {
      attendu: prix,
      bornes: [50, 65],
      droites: [margeAuPrix(50), margePrevue, margeAuPrix(65), margePrevue],
      lecture: {
        "Écart sur prix de la Nomade": (prix - N.pp) * N.qr,
        "Écart sur chiffre d'affaires": N.qr * prix + S.qr * S.pr - caPrevu,
        "Marge au coût préétabli": margeAuPrix(prix),
        "Écart sur marge": margeAuPrix(prix) - margePrevue,
      },
    };
    expect(curseur(ch, "le-prix-de-la-nomade")).toEqual(auPrix);
    expect(auPrix.lecture).toEqual({ "Écart sur prix de la Nomade": 0, "Écart sur chiffre d'affaires": 21_600, "Marge au coût préétabli": 508_600, "Écart sur marge": 8_600 });
    // Le chiffre d'affaires prévu, lui, est tenu dès 11 000 × p + 556 600 ≥ 1 184 000.
    expect(Math.ceil((caPrevu - S.qr * S.pr) / N.qr)).toBe(58);
    expect(ventesEtMarge(cas).prixQuiTientLeChiffre).toBe(58);
    // Le mix : sur 15 600 enceintes, s Salon ; la marge préétablie vaut 27 × (15 600 − s) + 44 × s.
    const margeAuMix = (s: number) => (qTr - s) * mN + s * mS;
    const salons = Math.ceil((margePrevue - qTr * mN) / (mS - mN));
    expect(salons).toBe(4_636);
    expect(curseur(ch, "le-mix-au-curseur")).toEqual({
      attendu: salons,
      bornes: [3_000, 6_000],
      droites: [margeAuMix(3_000), margePrevue, margeAuMix(6_000), margePrevue],
      lecture: {
        "Marge préétablie des ventes": margeAuMix(salons),
        "Écart sur quantité globale": (qTr - qTp) * moyenne,
        "Écart sur composition des ventes": (qTr - salons - mixN) * mN + (salons - mixS) * mS,
        "Écart sur volume": margeAuMix(salons) - margePrevue,
      },
    });
    expect([margeAuMix(salons), (qTr - salons - mixN) * mN + (salons - mixS) * mS]).toEqual([500_012, 12_512]);
    expect(juste(ch, "predire-le-mix")).toBe("Gagne 17 €, l'écart entre les deux marges");
  });

  it("le laboratoire des ventes : la marge prévue retrouvée avec moins d'enceintes", () => {
    const l = laboratoire(ch, "le-laboratoire-des-ventes");
    expect(l.depart).toEqual({ qa: N.qr, pa: N.pr, qb: S.qr, pb: S.pr });
    expect(l.reussi).toEqual([false, true]);
    const lire = (qa: number, pa: number, qb: number, pb: number) => {
      const total = qa + qb;
      const marge = qa * (pa - cN) + qb * (pb - cS);
      return {
        "Chiffre d'affaires": qa * pa + qb * pb,
        "Marge au coût préétabli": marge,
        "Écart sur prix de vente": (pa - N.pp) * qa + (pb - S.pp) * qb,
        "Écart sur quantité globale": (total - qTp) * moyenne,
        "Écart sur composition des ventes": (qa - (total * N.qp) / qTp) * mN + (qb - (total * S.qp) / qTp) * mS,
        "Écart sur marge": marge - margePrevue,
      };
    };
    expect(l.auDepart).toEqual(lire(N.qr, N.pr, S.qr, S.pr));
    expect(l.solution).toEqual({ qa: 10_300, pa: 57, qb: 5_300, pb: 121 });
    expect(l.aLaSolution).toEqual(lire(10_300, 57, 5_300, 121));
    expect(Object.values(l.aLaSolution)).toEqual([1_228_400, 501_300, -10_000, -12_500, 23_800, 1_300]);
    expect(10_300 + 5_300).toBeLessThan(qTp);
  });

  it("le cas : l'objectif de chiffre d'affaires est tenu, la marge ne l'est pas", () => {
    const s = L_OBJECTIF_DU_COMMERCIAL;
    casDedie(s, ch);
    expect(s.code).toBe("l-objectif-du-commercial");
    expect(s.titre).toBe("L'objectif du commercial");
    expect(attendus(s, "chiffre-d-affaires")).toEqual({ "Écart sur prix de la Nomade": prixN, "Écart sur prix de la Salon": prixS, "Écart sur quantités": quantites });
    expect(attendus(s, "la-marge")).toEqual({ "Marge préétablie prévue": margePrevue, "Marge réelle au coût préétabli": margeReelle, "Écart sur marge": margeReelle - margePrevue });
    expect(attendus(s, "le-volume")).toEqual({
      "Écart sur volume": (N.qr - N.qp) * mN + (S.qr - S.qp) * mS,
      "Écart sur quantité globale": (qTr - qTp) * moyenne,
      "Écart sur composition des ventes": (N.qr - mixN) * mN + (S.qr - mixS) * mS,
    });
    const o = objectifDuCommercial(cas);
    expect(o.verdict).toBe("tenu-sans-la-marge");
    expect(o.prixLePlusLourd.nom).toBe("Nomade");
    // Le curseur du cas : le prix de la Nomade qui tient la marge prévue, 59 €, quand 58 € tenait déjà l'objectif.
    expect(curseur(s, "le-prix-qui-tenait")).toEqual({
      attendu: 59,
      bornes: [50, 65],
      droites: [N.qr * (50 - cN) + S.qr * (S.pr - cS), margePrevue, N.qr * (65 - cN) + S.qr * (S.pr - cS), margePrevue],
      lecture: { "Écart sur chiffre d'affaires": N.qr * 59 + S.qr * S.pr - caPrevu, "Écart sur marge": N.qr * (59 - cN) + S.qr * (S.pr - cS) - margePrevue },
    });
    expect(juste(s, "reponse")).toBe("Objectif tenu, mais il coûte 13 400 € de marge : il faut le fixer en marge");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(L_OBJECTIF_DU_COMMERCIAL));
});
