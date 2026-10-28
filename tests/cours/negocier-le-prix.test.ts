import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DE_LA_NEGOCIATION,
  GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS,
  JOURS_LIBRES_DE_LA_VARIANTE,
  NEGOCIATIONS,
  NEGOCIER_LE_PRIX,
  negociation,
} from "../../src/config/cours/chapitres/negocier-le-prix";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import {
  BAISSE_QUI_REND_UNE_CONSIGNE_FRAGILE,
  BENEFICE_MINIMAL_SUR_COUT_COMPLET,
  LA_REMISE_AUTORISEE,
  remiseAutorisee,
} from "../../src/config/cours/situations/par-chapitre/la-remise-autorisee";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * NÉGOCIER LE PRIX, CHEZ LE CABINET DU MONDE DU COURS, ET SON CAS : LA REMISE AUTORISÉE.
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche d'ATLAS CONSEIL (monde/atlas-conseil.ts),
 * sans les fonctions du chapitre ni le modèle (monde/relation-client.ts) ; les valeurs absolues sont
 * épinglées, la variante (un trimestre presque plein) et le calcul à rebours du cas refaits comme le
 * reste, et les verdicts aussi. Chaque curseur : son attendu, la position voisine, ses droites aux bornes,
 * sa lecture ; le laboratoire : sa lecture au départ et à la solution, et les courbes de son graphique en
 * quelques points. Puis les gardes de texte de l'étalon (tests/cours/ecarts-indirects-et-ventes.test.ts),
 * avec l'accord de « journée » au féminin.
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "conseil";
const cas = casDeLEntreprise(code);
const f = ATLAS_CONSEIL;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

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

/** « journée » est féminin : ni « un journée », ni « journées vendus », ni « journées pris ». */
const JOURNEE_AU_MASCULIN = /\bun journée|\bjournées? (vendu|demandé|refusé|déplacé|gagné|perdu|libéré|remisé|payé|facturé|pris)s?(?![a-zàâçéèêëîïôûù])/i;

const DERNIERE_PHRASE = "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.";

/** Les gardes de texte et de forme, communes aux chapitres et aux cas (celles de l'étalon). */
function verifierLesTextes(ch: Chapitre) {
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|cent) (journées?|jours|comptes?|trimestres?|consultants?|commerciaux|clientèles?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(JOURNEE_AU_MASCULIN);
      // Le chapitre ne parle de l'arène que pour finir : la simulation est celle du cours.
      if (/arène/.test(x)) expect(x, e.id).toBe(DERNIERE_PHRASE);
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
      // Un gain ou un bilan peut être négatif : la question dit alors comment l'écrire.
      if (champs.some((x) => x.attendu < 0)) expect(e.question(cas, etat), e.id).toMatch(/négatif pour une perte/i);
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
  const couvre = (q: number) => d.produit(q) >= d.cout(q) - 1e-9;
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
/** Un nombre tel que le cours l'écrit (espace fine insécable des milliers). */
const nb = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

// La fiche, refaite à la main.
const cv = f.coutVariableDUneJournee.fraisDeMission + f.coutVariableDUneJournee.supports;
const chargesFixes = somme(Object.values(f.chargesFixes));
const journeesDeN = somme(f.comptes.map((k) => k.journees));
const partDesFixes = chargesFixes / journeesDeN;
const coutComplet = cv + partDesFixes;
const prix = f.prixCatalogue;
const mdm = prix - coutComplet;
const a = f.affaire;
const k = a.contreProposition;
const libresT3 = f.consultants.nombre * f.consultants.joursFacturablesParTrimestre - f.journeesVendues[2]!;
const libresT4 = f.consultants.nombre * f.consultants.joursFacturablesParTrimestre - f.journeesVendues[3]!;
/** Une affaire en plus, refaite à la main : marge, marge perdue sur les journées déplacées, gain, plancher. */
const affaire = (p: number, j: number, libres: number) => {
  const deplacees = Math.max(0, j - libres);
  const marge = j * (p - cv);
  const perdue = deplacees * (prix - cv);
  return { deplacees, marge, perdue, gain: marge - perdue, plancher: cv + (deplacees / j) * (prix - cv) };
};

describe("négocier le prix, chez le cabinet du monde du cours", () => {
  const ch = NEGOCIER_LE_PRIX;

  it("se joue chez ATLAS CONSEIL seule, au palier 2 du BTS NDRC, et garde les exports qu'on lit encore", () => {
    expect(CHAPITRES).toContain(ch);
    expect(ch.parcours).toBe("ndrc");
    expect(ch.palier).toBe(2);
    expect(ch.entreprises?.codes).toEqual(["conseil"]);
    expect(ENTREPRISES_DE_LA_NEGOCIATION).toEqual(["conseil"]);
    expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
    expect(ch.blocs).toEqual(["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BUT TC · Vendre une offre commerciale"]);
    expect(ch.etapes[0]!.type).toBe("lecture");
    expect(ch.etapes.at(-1)!.id).toBe("synthese");
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(LA_REMISE_AUTORISEE);
    // Les exports gardés pour remises-et-conditions, le tableau de bord commercial et leurs cas.
    expect([...NEGOCIATIONS]).toEqual(["conseil", "transport", "batiment"]);
    for (const c of NEGOCIATIONS) {
      const g = casDeLEntreprise(c).gestion;
      const n = negociation(casDeLEntreprise(c));
      expect(n.coutVariable).toBe(g.coutVariableUnitaire);
      expect(n.coutComplet).toBeCloseTo(g.coutVariableUnitaire + g.chargesFixes / g.quantite, 1);
    }
  });

  it("la fiche donne les chiffres de la consigne", () => {
    expect([cv, chargesFixes, journeesDeN, partDesFixes, coutComplet]).toEqual([150, 921_600, 1_920, 480, 630]);
    expect([mdm, mdm / prix]).toEqual([170, 0.2125]);
    expect([a.journees, a.remiseDemandee, k.journees, k.prix, libresT3, libresT4]).toEqual([30, 0.2, 50, 400, 270, 0]);
  });

  it("les étapes guidées attendent ce que la fiche donne", () => {
    expect(attendus(ch, "cout-complet")).toEqual({ "Coût variable d'une journée": cv, "Part des charges fixes par journée": partDesFixes, "Coût complet d'une journée": coutComplet });
    expect(attendus(ch, "marge-de-manoeuvre")).toEqual({
      "Marge de manœuvre par journée": mdm,
      "Remise maximale (%)": (mdm / prix) * 100,
      "Résultat de l'affaire à 21 % de remise": a.journees * (prix * 0.79 - coutComplet),
    });
    expect(a.journees * (prix * 0.79 - coutComplet)).toBeCloseTo(60, 6);
  });

  it("le premier cycle : le pari, puis le curseur de la remise maximale, 21 % et non 21,25 %", () => {
    expect(juste(ch, "predire-la-remise")).toBe("21 %");
    const pari = (ch.etapes.find((e) => e.id === "predire-la-remise") as EtapeChoix).options(cas, etatVide).map((o) => o.texte);
    // Les erreurs : la marge rapportée au coût complet (170 ÷ 630), la remise jusqu'au coût variable (650 ÷ 800).
    expect(pari).toEqual(["21 %", `${Math.round((mdm / coutComplet) * 100)} %`, `${Math.round(((prix - cv) / prix) * 100)} %`]);
    expect(pari.slice(1)).toEqual(["27 %", "81 %"]);
    // Le chiffre d'affaires de l'affaire, 30 × 800 × (1 − r), face à son coût complet, 30 × 630.
    expect(curseur(ch, "remise-maximale")).toEqual({
      attendu: 21,
      bornes: [0, 30],
      droites: [a.journees * prix, a.journees * coutComplet, a.journees * prix * 0.7, a.journees * coutComplet],
      lecture: { "Prix remisé de la journée": 632, "Chiffre d'affaires de l'affaire": 18_960, "Coût complet de l'affaire": 18_900, "Résultat de l'affaire": 60 },
    });
    // La position voisine : à 22 %, la journée tombe à 624 €, sous le coût complet.
    expect(prix * 0.78).toBeLessThan(coutComplet);
    expect(prix * 0.79).toBeGreaterThanOrEqual(coutComplet);
  });

  it("les étapes autonomes et d'expert : la remise demandée tient, et se paie en volume", () => {
    const prixRemise = prix * (1 - a.remiseDemandee);
    expect(prixRemise).toBe(640);
    expect(prixRemise - coutComplet).toBe(10);
    expect(prix * 0.75).toBeLessThan(coutComplet);
    expect(juste(ch, "remise-demandee")).toBe("Oui : le prix remisé reste au-dessus du coût complet");
    const margeSansRemise = a.journees * (prix - cv);
    const margeRemisee = prixRemise - cv;
    expect(attendus(ch, "contrepartie")).toEqual({
      "Marge sur coût variable de l'affaire au prix catalogue": margeSansRemise,
      "Marge sur coût variable d'une journée remisée": margeRemisee,
      "Journées à commander au prix remisé": Math.ceil(margeSansRemise / margeRemisee),
    });
    expect([margeSansRemise, margeRemisee, Math.ceil(margeSansRemise / margeRemisee)]).toEqual([19_500, 490, 40]);
    // 39 journées ne suffisent pas, 40 suffisent.
    expect(39 * margeRemisee).toBeLessThan(margeSansRemise);
    expect(40 * margeRemisee).toBeGreaterThanOrEqual(margeSansRemise);
  });

  it("le second cycle : le pari du T4, puis le curseur des jours libres", () => {
    expect(juste(ch, "predire-le-t4")).toBe("Fait perdre de l'argent au cabinet");
    // La marge de l'affaire, 50 × 250 €, face à la marge perdue, (50 − L) × 650 € : il faut L ≥ 50 − 12 500 ÷ 650.
    const libres = Math.ceil(k.journees - (k.journees * (k.prix - cv)) / (prix - cv));
    expect(libres).toBe(31);
    expect(affaire(k.prix, k.journees, 30).gain).toBeLessThan(0);
    expect(curseur(ch, "les-jours-libres")).toEqual({
      attendu: libres,
      bornes: [0, 50],
      droites: [12_500, 50 * 650, 12_500, 0],
      lecture: {
        "Marge sur coût variable de l'affaire": 12_500,
        "Marge perdue sur les journées déplacées": 19 * 650,
        "Plancher de l'affaire": centime(cv + (19 / 50) * 650),
        "Gain de l'affaire": 12_500 - 19 * 650,
      },
    });
    expect([19 * 650, centime(cv + (19 / 50) * 650), 12_500 - 19 * 650]).toEqual([12_350, 397, 150]);
  });

  it("les étapes d'expert : le plancher d'une affaire en plus au T4, et la variante d'un trimestre presque plein", () => {
    const t4 = affaire(k.prix, k.journees, libresT4);
    expect(attendus(ch, "deux-planchers")).toEqual({
      "Marge sur coût variable de l'affaire au T4": t4.marge,
      "Marge perdue sur les journées déplacées": t4.perdue,
      "Gain de l'affaire au T4": t4.gain,
      "Plancher de l'affaire au T4": t4.plancher,
    });
    expect([t4.marge, t4.perdue, t4.gain, t4.plancher]).toEqual([12_500, 32_500, -20_000, 800]);
    expect(affaire(k.prix, k.journees, libresT3).gain).toBe(12_500);
    expect(juste(ch, "au-t3-ou-au-t4")).toBe(`Oui, au T3 seulement : l'affaire y rapporte ${nb(12_500)} €`);
    expect(JOURS_LIBRES_DE_LA_VARIANTE).toBe(20);
    const v = affaire(k.prix, k.journees, 20);
    expect(attendus(ch, "vingt-jours-libres")).toEqual({
      "Journées prises à d'autres clients": v.deplacees,
      "Marge perdue sur ces journées": v.perdue,
      "Gain de l'affaire": v.gain,
      "Plancher de l'affaire": v.plancher,
    });
    expect([v.deplacees, v.perdue, v.gain, v.plancher]).toEqual([30, 19_500, -7_000, 540]);
    // Le plancher est la moyenne des deux planchers, pondérée par les journées.
    expect((20 * cv + 30 * prix) / 50).toBe(540);
  });

  it("le laboratoire de l'affaire : trois chemins vers un gain de 5 000 €, et un gain en ligne brisée", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-affaire");
    expect(GAIN_EXIGE_D_UNE_AFFAIRE_EN_PLUS).toBe(5_000);
    expect(l.depart).toEqual({ remise: 50, journees: 50, libres: 20 });
    expect(l.solution).toEqual({ remise: 50, journees: 20, libres: 20 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (remise: number, j: number, libres: number) => {
      const p = prix * (1 - remise / 100);
      const x = affaire(p, j, libres);
      return {
        "Prix de la journée": p,
        "Journées sur des jours libres": j - x.deplacees,
        "Journées prises à d'autres clients": x.deplacees,
        "Plancher de l'affaire": centime(x.plancher),
        "Marge sur coût variable de l'affaire": x.marge,
        "Marge perdue sur les journées déplacées": -x.perdue + 0,
        "Gain de l'affaire": x.gain,
      };
    };
    expect(l.auDepart).toEqual(lire(50, 50, 20));
    expect(Object.values(l.auDepart)).toEqual([400, 20, 30, 540, 12_500, -19_500, -7_000]);
    expect(l.aLaSolution).toEqual(lire(50, 20, 20));
    expect(Object.values(l.aLaSolution)).toEqual([400, 20, 0, 150, 5_000, 0, 5_000]);
    // Les deux autres chemins : un prix plus haut (20 % de remise) sur les 50 journées, ou un trimestre qui a de la place.
    expect(l.d.atteint({ remise: 20, journees: 50, libres: 20 })).toBe(true);
    expect(affaire(640, 50, 20).gain).toBe(5_000);
    expect(l.d.atteint({ remise: 50, journees: 50, libres: 270 })).toBe(true);
    expect(l.d.atteint({ remise: 21, journees: 50, libres: 20 })).toBe(false);
    // Le graphique : le gain selon les journées monte de 250 € par journée jusqu'aux jours libres, puis descend de 400 €.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("journees");
    const [marge, perdue, gain] = g.courbes;
    const au = (j: number) => ({ ...l.depart, journees: j });
    expect([10, 20, 40, 100].map((j) => [marge!.valeur(au(j)), perdue!.valeur(au(j)), gain!.valeur(au(j))])).toEqual([
      [2_500, 0, 2_500],
      [5_000, 0, 5_000],
      [10_000, 20 * 650, 10_000 - 20 * 650],
      [25_000, 80 * 650, 25_000 - 80 * 650],
    ]);
    expect(gain!.valeur(au(40))).toBe(-3_000);
    expect(gain!.valeur(au(25)) - gain!.valeur(au(20))).toBe(-5 * (prix - 400));
  });

  it("la baisse accordée à tous, refaite clientèle par clientèle : plus de ventes, moins de marge", () => {
    const baisse = 0.1;
    let journees = 0;
    let journeesApres = 0;
    let ca = 0;
    let caApres = 0;
    for (const kl of f.clienteles) {
      const comptes = f.comptes.filter((x) => x.clientele === kl.code);
      const j = somme(comptes.map((x) => x.journees));
      const c = somme(comptes.map((x) => x.chiffreDAffaires));
      const apres = Math.floor(j * (1 + -kl.elasticite * baisse) + 1e-9);
      journees += j;
      journeesApres += apres;
      ca += c;
      caApres += centime((c / j) * (1 - baisse) * apres);
    }
    expect([journees, journeesApres]).toEqual([1_920, 2_172]);
    expect(centime(caApres)).toBe(1_407_411.19);
    expect(centime(caApres - cv * journeesApres)).toBe(1_081_611.19);
    expect(ca - cv * journees).toBe(1_094_400);
    expect(journeesApres).toBeLessThanOrEqual(4 * 600);
    expect(juste(ch, "baisse-pour-tous")).toBe("Plus de ventes, mais moins de marge");
    // Qui tient le prix : une hausse de 10 % fait perdre −élasticité × 10 % de la demande.
    expect(f.clienteles.map((x) => Math.round(-x.elasticite * 10 * 100) / 100)).toEqual([7, 16, 15]);
    expect(juste(ch, "qui-tient-le-prix")).toBe("Grands comptes");
  });

  it("l'intro dit les hypothèses, et la synthèse finit sur l'arène", () => {
    const intro = ch.etapes[0]!;
    const synthese = ch.etapes.at(-1)!;
    if (intro.type !== "lecture" || synthese.type !== "lecture") throw new Error("Pas de lecture");
    expect(intro.texte(cas).join(" ")).toMatch(/Ce que la simulation suppose/);
    expect(synthese.texte(cas).at(-1)).toBe(DERNIERE_PHRASE);
    expect(synthese.texte(cas).join(" ")).toMatch(/Au niveau de l'examen/);
  });

  it("le cas : la consigne de 13 %, qui ne tient que si l'année vend 1 910 journées", () => {
    const s = LA_REMISE_AUTORISEE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La directrice commerciale");
    expect(BENEFICE_MINIMAL_SUR_COUT_COMPLET).toBe(0.1);
    const benefice = coutComplet * 0.1;
    const plancher = coutComplet + benefice;
    expect(attendus(s, "le-plancher-de-la-regle")).toEqual({ "Coût complet d'une journée": coutComplet, "Bénéfice minimal par journée": benefice, "Prix plancher de la règle": plancher });
    expect([benefice, plancher]).toEqual([63, 693]);
    const remise = prix - plancher;
    expect(attendus(s, "la-remise-autorisee")).toEqual({ "Remise autorisée par journée": remise, "Remise autorisée (%)": 13.4, "Remise au plus sur la commande": remise * a.journees });
    expect([remise, (remise / prix) * 100, remise * a.journees]).toEqual([107, 13.375, 3_210]);
    // Le curseur : le chiffre d'affaires de la commande, 30 × 800 × (1 − r), face à 30 × 693.
    expect(curseur(s, "la-consigne")).toEqual({
      attendu: 13,
      bornes: [0, 25],
      droites: [30 * prix, 30 * plancher, 30 * prix * 0.75, 30 * plancher],
      lecture: {
        "Prix remisé de la journée": 696,
        "Bénéfice par journée": 696 - coutComplet,
        "Chiffre d'affaires de la commande": 30 * 696,
        "Commande au plancher de la règle": 30 * plancher,
        "Marge au-dessus du plancher": 30 * (696 - plancher),
      },
    });
    expect(prix * 0.86).toBeLessThan(plancher);
    // À rebours : le coût complet le plus haut que tolèrent 696 € avec la règle, au centime inférieur.
    const ccMax = Math.floor((696 / 1.1) * 100) / 100;
    const partMax = centime(ccMax - cv);
    const jMin = Math.ceil(chargesFixes / partMax);
    expect(attendus(s, "a-rebours")).toEqual({ "Coût complet le plus haut": ccMax, "Part des fixes la plus haute": partMax, "Journées à vendre au moins dans l'année": jMin });
    expect([ccMax, partMax, jMin]).toEqual([632.72, 482.72, 1_910]);
    // La consigne tient à 1 910 journées, plus à 1 909.
    expect(696).toBeGreaterThanOrEqual(1.1 * (cv + chargesFixes / 1_910));
    expect(696).toBeLessThan(1.1 * (cv + chargesFixes / 1_909));
    expect(BAISSE_QUI_REND_UNE_CONSIGNE_FRAGILE).toBe(0.05);
    expect(remiseAutorisee(cas).verdict).toBe("fragile");
    expect(juste(s, "la-demande-d-orvane")).toBe("Il la soumet à la directrice : elle dépasse la règle");
    expect(juste(s, "reponse")).toBe(`13 % au plus, tant que l'année vend ${nb(1_910)} journées`);
    // Les erreurs de la réponse : la remise maximale du chapitre, le bénéfice pris sur le prix (630 ÷ 0,9 = 700 €),
    // le coût variable majoré de 10 % (165 €).
    const r = remiseAutorisee(cas);
    expect([r.n.remiseEntiere, r.consigneSurLePrix, r.consigneSansLesFixes]).toEqual([21, Math.floor((1 - coutComplet / 0.9 / prix) * 100 + 1e-9), Math.floor((1 - 165 / prix) * 100)]);
    expect([r.consigneSurLePrix, r.consigneSansLesFixes]).toEqual([12, 79]);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LA_REMISE_AUTORISEE));
});
