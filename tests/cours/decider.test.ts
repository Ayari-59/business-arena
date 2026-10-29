import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { COMMANDE_AU_PRIX_DU_TRIMESTRE, COMMANDE_EXCEPTIONNELLE, DECIDER, decision } from "../../src/config/cours/chapitres/decider";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DE_PRIX, MONTER_SON_PRIX, monterSonPrix } from "../../src/config/cours/situations/par-chapitre/monter-son-prix";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * DÉCIDER : PRIX, FABRIQUER OU ACHETER, SUR LE PREMIER TRIMESTRE DE NOVA DU MONDE DU COURS, ET SON
 * CAS : MONTER SON PRIX ?
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de gestion (monde/nova-gestion.ts, la
 * décision : la droite de demande, la capacité, le sous-traitant, les charges fixes du trimestre),
 * sans les fonctions du chapitre ni le modèle (monde/couts-et-budgets.ts) ; les valeurs absolues sont
 * épinglées, la commande exceptionnelle et le calcul à rebours refaits comme le reste, les curseurs
 * (attendu, voisin, droites aux bornes, lecture), le laboratoire (départ, solution, courbes du
 * graphique en quelques points) et les verdicts aussi. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const cas = casDeLEntreprise("nova");
const d = NOVA_GESTION.decision;
const m = NOVA_GESTION.moisDeReference;
const c = (x: number) => Math.round(x * 100) / 100 + 0;

// ─── La fiche, refaite à la main ───
const cv = m.coutVariable.composants + m.coutVariable.autres;
const fixes = 3 * (m.chargesFixes.loyer + m.chargesFixes.personnel + m.chargesFixes.amortissement);
const demande = (p: number) => Math.floor(16_755 - 203 * p + 1e-9);
/** Le trimestre à la main : ventes = la plus petite de la demande et du disponible (fabriqué, puis sous-traité). */
function trimestre(p: number, production = 4_778, plafond = 0) {
  const dem = demande(p);
  const fab = Math.min(dem, production);
  const st = Math.min(plafond, dem - fab);
  const marge = c(fab * (p - cv) + st * (p - 52));
  return { demande: dem, fab, st, ventes: fab + st, nonServie: dem - fab - st, stock: production - fab, marge, resultat: c(marge - fixes) };
}

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
      const gr = e.grandeur?.(x);
      const r = e.rates?.(x);
      return [e.titre, e.question(x), ...e.explication(x), ...e.lecture(x, k.attendu).map((l) => l.libelle), ...e.droites(x).libelles, ...(e.zones ?? []), gr?.libelle ?? "", gr?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const dd = e.defi(x);
      const depart = Object.fromEntries(e.leviers(x).map((l) => [l.code, l.depart]));
      const gr = e.graphique?.(x);
      return [
        e.titre,
        e.question(x),
        dd.consigne,
        dd.indice(depart),
        ...e.explication(x, dd.solution),
        ...e.lecture(x, dd.solution).map((l) => l.libelle),
        ...e.leviers(x).flatMap((l) => [l.libelle, l.unite]),
        ...(gr?.courbes ?? []).map((y) => y.libelle),
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|Nomade|Salon)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/l'arène (rejoue|joue|a rejoué|simule)|rejoué par l'arène/);
      // Le défaut de l'audit : « les ventes passent de 4 778 à 4 778 ».
      expect(x, `${e.id} : ${x}`).not.toMatch(/de ([\d\s ]+) à \1 /);
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
    const j = options.find((o) => o.juste)!;
    expect(j.texte.length, `${s.code} / ${e.id} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
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
  const dr = e.droites(cas);
  const min = k.min ?? 0;
  const couvre = (q: number) => dr.produit(q) >= dr.cout(q);
  expect(couvre(k.attendu), `${id} : l'attendu couvre`).toBe(true);
  if (e.sens === "plus-grande") expect(couvre(k.attendu + 1), `${id} : la position suivante couvre encore`).toBe(false);
  else expect(couvre(k.attendu - 1), `${id} : la position d'avant couvre déjà`).toBe(false);
  return {
    attendu: k.attendu,
    bornes: [min, k.max],
    droites: [dr.produit(min), dr.cout(min), dr.produit(k.max), dr.cout(k.max)].map(c),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

function laboratoire(ch: Chapitre, id: string) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const dd = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, dd, depart, solution: dd.solution, auDepart: lire(depart), aLaSolution: lire({ ...dd.solution }), reussi: [dd.atteint(depart), dd.atteint(dd.solution)] };
}

const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const BLOCS = [
  ["BTS CG P5 · Analyse et prévision de l'activité", "bts-cg"],
  ["DCG UE11 · Contrôle de gestion", "dcg"],
  ["BUT GEA · Aider à la prise de décision", "but-gea"],
] as const;

describe("décider : prix, fabriquer ou acheter, chez NOVA du monde du cours", () => {
  const ch = DECIDER;

  it("se joue chez NOVA seule, au palier 4 du contrôle de gestion, avec ses blocs et son gabarit", () => {
    expect(CHAPITRES).toContain(ch);
    expect(SITUATIONS).toContain(MONTER_SON_PRIX);
    expect(ch.code).toBe("decider-prix-fabriquer-acheter");
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.libre).toBe(false);
    expect(ch.entreprises?.codes).toEqual(["nova"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(BLOCS.map(([b]) => b));
    for (const [b, ref] of BLOCS) {
      expect(referentielDeCitation(b)?.code, b).toBe(ref);
      expect(blocOfficiel(b, ref), b).not.toBeNull();
    }
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(ch.etapes.filter((e) => e.type === "choix" && /^Pariez/.test(e.titre)).length).toBeGreaterThanOrEqual(3);
    expect(ch.etapes.filter((e) => e.type === "curseur")).toHaveLength(2);
    expect(ch.etapes.filter((e) => e.type === "simulation")).toHaveLength(1);
    for (const id of ["le-prix-optimal", "la-commande-exceptionnelle"]) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    const intro = ch.etapes[0]!;
    if (intro.type !== "lecture") throw new Error("lecture attendue");
    const texte = intro.texte(cas).join(" ");
    expect(texte).toContain("Ce que la simulation suppose");
    // Les charges fixes du trimestre passent à 93 549 € : l'intro le dit, avec leur calcul.
    expect(texte).toContain("3 × 31 183 € = 93 549 €");
    const fin = ch.etapes.at(-1)!;
    if (fin.type !== "lecture") throw new Error("lecture attendue");
    expect(fin.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([cv, fixes, d.production, d.capacite, d.coutDuSousTraitant]).toEqual([38, 93_549, 1_590 + 1_450 + 1_738, 7_000, 52]);
    expect(d.production).toBe(4_778);
    const t = trimestre(59);
    expect(t).toEqual({ demande: 4_778, fab: 4_778, st: 0, ventes: 4_778, nonServie: 0, stock: 0, marge: 100_338, resultat: 6_789 });
    expect([trimestre(53.1).resultat, trimestre(59).resultat, trimestre(64.9).resultat]).toEqual([-21_401.2, 6_789, 2_753]);
  });

  it("les étapes guidées : à volume constant, puis le volume qu'une baisse exige", () => {
    expect(attendus(ch, "volume-constant")).toEqual({ "Marge à +10 %, à volume constant": c(100_338 + 0.1 * 281_902), "Marge à −10 %, à volume constant": c(100_338 - 0.1 * 281_902) });
    expect(Object.values(attendus(ch, "volume-constant"))).toEqual([128_528.2, 72_147.8]);
    const mb = c(21 - 0.1 * 59);
    const v = Math.ceil(100_338 / mb - 1e-9);
    expect(attendus(ch, "volume-necessaire")).toEqual({ "Marge par enceinte au prix baissé": mb, "Volume qui garde la marge": v, "Hausse des ventes nécessaire (%)": Math.round((v / 4_778 - 1) * 1_000) / 10 });
    expect([mb, v, Math.round((v / 4_778 - 1) * 1_000) / 10]).toEqual([15.1, 6_645, 39.1]);
    expect(juste(ch, "predire-le-volume")).toBe("De bien plus de 10 %");
  });

  it("le curseur du volume, refait à la main : 6 645 enceintes", () => {
    expect(curseur(ch, "volume-au-curseur")).toEqual({
      attendu: 6_645,
      bornes: [4_770, 8_640],
      droites: [c(4_770 * 15.1), 100_338, c(8_640 * 15.1), 100_338],
      lecture: { "Marge par enceinte au prix baissé": 15.1, "Marge au prix baissé": c(6_645 * 15.1), "Marge du trimestre, au prix actuel": 100_338, Différence: c(6_645 * 15.1 - 100_338) },
    });
    // La position voisine : 6 644 enceintes ne gardent pas la marge.
    expect(6_644 * 15.1).toBeLessThan(100_338);
  });

  it("le laboratoire du prix : le meilleur résultat sans demande non servie ni stock, à 60,30 €", () => {
    const l = laboratoire(ch, "le-laboratoire-du-prix");
    expect(l.depart).toEqual({ prix: 59, production: 4_778, sousTraitance: 0 });
    expect(l.solution).toEqual({ prix: 60.3, production: 4_514, sousTraitance: 0 });
    expect(l.reussi).toEqual([false, true]);
    // La solution refaite à la main : toute la demande servie, au prix de la grille de 0,10 € qui donne le plus.
    let meilleur = { prix: 0, resultat: -Infinity };
    for (let k = 0; k <= 300; k++) {
      const p = c(45 + k * 0.1);
      const dem = demande(p);
      const r = dem <= 7_000 ? dem * (p - cv) - fixes : 7_000 * (p - cv) + (dem - 7_000) * (p - 52) - fixes;
      if (r > meilleur.resultat + 1e-9) meilleur = { prix: p, resultat: c(r) };
    }
    expect(meilleur).toEqual({ prix: 60.3, resultat: 7_113.2 });
    expect(demande(60.3)).toBe(4_514);
    const lire = (t: ReturnType<typeof trimestre>) => ({
      "Enceintes demandées": t.demande,
      "Enceintes fabriquées et vendues": t.fab,
      "Enceintes sous-traitées et vendues": t.st,
      "Demande non servie": t.nonServie,
      "Enceintes en stock": t.stock,
      "Marge sur coût variable": t.marge,
      "Résultat d'exploitation": t.resultat,
      "Gain sur le trimestre joué": c(t.resultat - 6_789),
    });
    expect(l.auDepart).toEqual(lire(trimestre(59)));
    expect(l.aLaSolution).toEqual(lire(trimestre(60.3, 4_514)));
    expect(l.aLaSolution["Gain sur le trimestre joué"]).toBe(324.2);
    // Le défi ne se relève pas avec du stock, ni avec un prix voisin.
    expect(l.dd.atteint({ prix: 60.3, production: 7_000, sousTraitance: 0 })).toBe(false);
    expect(l.dd.atteint({ prix: 60.2, production: demande(60.2), sousTraitance: 0 })).toBe(false);
    expect(l.dd.atteint({ prix: 60.4, production: demande(60.4), sousTraitance: 0 })).toBe(false);
    expect(juste(ch, "predire-la-baisse")).toBe("Non : le plan de production les bornera");
  });

  it("le graphique du laboratoire : le résultat selon le prix, au plan et en servant toute la demande", () => {
    const l = laboratoire(ch, "le-laboratoire-du-prix");
    const gr = l.e.graphique!(cas);
    expect(gr.levier).toBe("prix");
    const [plan, tout] = gr.courbes;
    expect([plan!.libelle, tout!.libelle]).toEqual(["Résultat de votre plan", "Résultat en servant toute la demande"]);
    const p = (prix: number) => ({ prix, production: 4_778, sousTraitance: 0 });
    // Au plan du trimestre : une droite tant que le plan borne, puis la demande.
    expect(plan!.valeur(p(53.1))).toBe(c(4_778 * 15.1 - fixes));
    expect(plan!.valeur(p(59))).toBe(6_789);
    expect(plan!.valeur(p(64.9))).toBe(c(3_580 * 26.9 - fixes));
    // Toute la demande servie : une parabole, au sommet à 60,30 €, la sous-traitance au-delà de 7 000.
    expect(tout!.valeur(p(53.1))).toBe(c(5_975 * 15.1 - fixes));
    expect(tout!.valeur(p(60.3))).toBe(7_113.2);
    expect(tout!.valeur(p(75))).toBe(c(demande(75) * 37 - fixes));
    expect(tout!.valeur(p(45))).toBe(c(7_000 * 7 + (demande(45) - 7_000) * (45 - 52) - fixes));
    expect(tout!.valeur(p(45))).toBe(-48_889);
  });

  it("l'étape autonome des trois prix, et les verdicts : le plan borne la baisse, le prix du trimestre est le meilleur des trois", () => {
    expect(attendus(ch, "les-trois-prix")).toEqual({
      "Enceintes demandées à −10 %": demande(53.1),
      "Résultat d'exploitation à −10 %": trimestre(53.1).resultat,
      "Enceintes demandées à +10 %": demande(64.9),
      "Résultat d'exploitation à +10 %": trimestre(64.9).resultat,
    });
    expect(Object.values(attendus(ch, "les-trois-prix"))).toEqual([5_975, -21_401.2, 3_580, 2_753]);
    expect(juste(ch, "ce-qui-borne")).toBe("Le plan de production : le marché demandait plus que ce qui était fabriqué");
    expect(juste(ch, "meilleur-prix")).toBe("Prix du trimestre (59 €)");
    const borne = ch.etapes.find((e) => e.id === "ce-qui-borne") as EtapeChoix;
    expect(borne.question(cas, etatVide)).toBe("À −10 %, la demande monte à 5 975 enceintes, mais les ventes restent à 4 778. Qu'est-ce qui les borne ?");
  });

  it("l'expert : le prix qui maximise le résultat, par le calcul", () => {
    const p = c((16_755 / 203 + 38) / 2);
    expect(p).toBe(60.27);
    expect(attendus(ch, "le-prix-optimal")).toEqual({ "Prix qui rend le résultat le plus grand": p, "Enceintes demandées à ce prix": demande(p), "Résultat du trimestre à ce prix": c(demande(p) * (p - cv) - fixes) });
  });

  it("fabriquer ou acheter, et la commande au-delà de la capacité : 54 208 €", () => {
    expect(attendus(ch, "fabriquer-ou-acheter")).toEqual({ "Capacité restante du trimestre": 7_000 - 4_778, "Marge d'une enceinte fabriquée": 59 - 38, "Marge d'une enceinte sous-traitée": 59 - 52 });
    expect(COMMANDE_AU_PRIX_DU_TRIMESTRE).toBe(3_300);
    expect(2_222 * 21 + (3_300 - 2_222) * 7).toBe(54_208);
    expect(juste(ch, "la-commande")).toBe("Elle fabrique 2 222 enceintes et fait sous-traiter les 1 078 autres");
    expect(decision(cas).gainDeLaCommande).toBe(54_208);
  });

  it("l'expert : la commande exceptionnelle tient dans la capacité restante, son prix plancher est le coût variable", () => {
    expect(COMMANDE_EXCEPTIONNELLE).toEqual({ quantite: 2_000, prix: 50 });
    const libre = 7_000 - demande(59);
    expect(libre).toBe(2_222);
    const cout = 2_000 * 38;
    expect(attendus(ch, "la-commande-exceptionnelle")).toEqual({
      "Marge des enceintes fabriquées": 2_000 * 12,
      "Marge des enceintes sous-traitées": 0,
      "Marge de la commande entière": 2_000 * 50 - cout,
      "Prix plancher de la commande": 38,
    });
    expect(curseur(ch, "le-prix-plancher")).toEqual({
      attendu: 38,
      bornes: [30, 70],
      droites: [60_000, cout, 140_000, cout],
      lecture: { "Chiffre d'affaires de la commande": 76_000, "Ce qu'elle coûte en plus (fabriqué et sous-traité)": cout, "Marge de la commande": 0 },
    });
    expect(2_000 * 37).toBeLessThan(cout);
    expect(juste(ch, "predire-la-commande")).toBe("Peut rapporter : seul compte ce qu'elle rapporte face à ce qu'elle coûte en plus");
  });

  it("l'expert : sans sous-traitant, la commande ne chasse aucune vente : la capacité n'est plus le facteur rare", () => {
    expect(2_000 * (50 - 38)).toBe(24_000);
    expect(juste(ch, "sans-sous-traitant")).toBe("Accepter : 24"+"\u202f"+"000 € de plus, une fois perdue la marge des ventes qu'elle chasse");
    expect(decision(cas).coutDeRevientDeJanvier).toBe(c(91_603 / 1_590));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
});

describe("le cas : monter son prix ?", () => {
  const s = MONTER_SON_PRIX;
  const mh = c(21 + HAUSSE_DE_PRIX * 59);
  const qmin = Math.ceil(100_338 / mh - 1e-9);

  it("a la forme d'un cas dédié, chez NOVA seule", () => {
    casDedie(s, DECIDER);
    expect(s.commanditaire).toBe("La direction");
    expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
  });

  it("la marge d'une enceinte et les ventes que l'on peut perdre, refaites à la main", () => {
    expect(HAUSSE_DE_PRIX).toBe(0.05);
    expect(attendus(s, "marge-unitaire")).toEqual({ "Marge d'une enceinte aujourd'hui": 100_338 / 4_778, "Prix après la hausse": c(59 * 1.05), "Marge d'une enceinte après la hausse": mh });
    expect([100_338 / 4_778, c(59 * 1.05), mh]).toEqual([21, 61.95, 23.95]);
    expect(attendus(s, "ventes-perdues")).toEqual({ "Plus petite quantité qui garde la marge": qmin, "Ventes que l'on peut perdre, au plus": 4_778 - qmin, "Part des ventes du trimestre (%)": Math.round(((4_778 - qmin) / 4_778) * 1_000) / 10 });
    expect([qmin, 4_778 - qmin]).toEqual([4_190, 588]);
  });

  it("le curseur du cas : 588 ventes perdues au plus", () => {
    expect(curseur(s, "les-ventes-au-curseur")).toEqual({
      attendu: 588,
      bornes: [0, 1_000],
      droites: [c(4_778 * mh), 100_338, c(3_778 * mh), 100_338],
      lecture: { "Marge au nouveau prix": c(4_190 * mh), "Marge du trimestre": 100_338, Différence: c(4_190 * mh - 100_338) },
    });
  });

  it("le croisement avec la demande : à 61,95 €, 4 179 demandées, 599 ventes perdues ; 59 € est déjà le prix le plus haut qui garde toutes les ventes", () => {
    const dem = demande(61.95);
    let limite = 0;
    for (let k = 5_000; k <= 7_000; k++) if (demande(k / 100) >= 4_778) limite = k / 100;
    expect([dem, limite]).toEqual([4_179, 59]);
    expect(attendus(s, "la-demande-au-nouveau-prix")).toEqual({
      "Enceintes demandées au nouveau prix": dem,
      "Demande sans réponse au nouveau prix": 0,
      "Prix le plus haut qui garde toutes les ventes": limite,
      "Résultat du trimestre au nouveau prix": c(dem * mh - fixes),
    });
    expect(c(dem * mh - fixes)).toBe(6_538.05);
  });

  it("le verdict : 599 ventes perdues, plus que les 588 que la marge supporte : renoncer", () => {
    expect(monterSonPrix(cas).verdict).toBe("perte-trop-forte");
    expect(juste(s, "reponse")).toBe("Renoncer : 599 ventes perdues, plus que les 588 que la marge supporte");
    expect(demande(59) - demande(61.95)).toBe(599);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(s));
});
