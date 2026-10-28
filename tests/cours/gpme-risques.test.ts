import { describe, expect, it } from "vitest";
import { referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  DEFAILLANCE_EXTERNE_A_REBOURS,
  LE_COUT_DE_LA_NON_QUALITE,
  qualiteDeNova,
} from "../../src/config/cours/chapitres/le-cout-de-la-non-qualite";
import { S_ASSURER_CONTRE_LES_ALEAS, assuranceDeNova, formuleRetenue } from "../../src/config/cours/chapitres/s-assurer-contre-les-aleas";
import { NOVA_CAPACITE } from "../../src/config/cours/monde/nova-capacite";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { HAUSSE_DE_LA_PRIME, L_ASSUREUR_AUGMENTE_LA_PRIME, primeAugmentee } from "../../src/config/cours/situations/par-chapitre/l-assureur-augmente-la-prime";
import { HORIZON_DU_GERANT_EN_ANNEES, UNE_SEULE_DEMARCHE_QUALITE, deuxDemarches } from "../../src/config/cours/situations/par-chapitre/une-seule-demarche-qualite";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE LA GESTION DES RISQUES DU BTS GPME, CHEZ NOVA DU MONDE DU COURS, ET LEURS CAS :
 * S'ASSURER CONTRE LES ALÉAS (L'ASSUREUR AUGMENTE LA PRIME), LE COÛT DE LA NON-QUALITÉ (UNE SEULE
 * DÉMARCHE QUALITÉ).
 *
 * Chaque chiffre attendu est refait ici à la main sur la fiche de NOVA (monde/nova-capacite.ts), sans
 * les fonctions des chapitres ni le modèle (monde/capacite.ts) : la production de chaque trimestre, ce
 * qu'un aléa fait perdre, les formules, la capacité d'absorption, la courbe de la qualité. Les valeurs
 * absolues sont épinglées, les variantes (la panne, la ligne payée comptant, la prime augmentée, le
 * calcul à rebours) refaites comme le reste, et les verdicts aussi. Chaque curseur : son attendu, la
 * position voisine, ses droites aux bornes, sa lecture. Chaque laboratoire : sa lecture au départ et à
 * la solution, et les courbes de son graphique en quelques points. Puis les gardes de texte de l'étalon
 * (tests/cours/ecarts-indirects-et-ventes.test.ts).
 */

const etatVide: EtatDuCours = { soldes: {} };
const code = "nova";
const cas = casDeLEntreprise(code);
const f = NOVA_CAPACITE;
const centime = (x: number) => Math.round(x * 100) / 100 + 0;

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
        ...(e.graphique?.(c).courbes.map((x) => x.libelle) ?? []),
      ];
    }
    default:
      return [e.titre];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "perdu", "livré", "trouvé", "retourné"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|trente|cent) (enceintes?|heures?|trimestres?|ventes?|défauts?|ans|années?|formules?|aléas?)\b/i);
      // L'arène ne rejoue plus rien dans ces chapitres : le texte ne la fait pas parler.
      expect(x, `${e.id} : ${x}`).not.toMatch(/l'arène (a|rejoue|efface|compte|tire)|le moteur/i);
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
  expect(s.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
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
  return { e, depart, solution: d.solution, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), atteint: d.atteint, reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

// ─────────────────────────────────────────────────────────────────────────────
// LA FICHE, REFAITE À LA MAIN
// ─────────────────────────────────────────────────────────────────────────────

/** La marge d'une enceinte : prix − composants − autres coûts variables. */
const m = f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres;
const ligne = f.ligne.capaciteParTrimestre;
/** L'équipe d'un trimestre : opérateurs × heures du mois ÷ heures d'une enceinte × 3 mois. */
const equipe = (f.operateurs.nombre * f.operateurs.heuresParMois * 3) / f.operateurs.heuresParEnceinte;
const demande = f.anneeNPlus1.demande;
/** Les ventes du plan de N + 1 : min(demande, outil, équipe), la ligne à 100 %. */
const ventes = demande.map((d) => Math.min(d, ligne, equipe));
const volume = ventes.reduce((t, x) => t + x, 0);

describe("les deux chapitres et leurs cas, chez NOVA du monde du cours", () => {
  it("la fiche donne les chiffres de la consigne", () => {
    expect([m, ligne, equipe]).toEqual([21, 7_000, 7_200]);
    expect(ventes).toEqual([5_800, 7_000, 6_200, 7_000]);
    expect(volume).toBe(26_000);
  });

  it("se jouent chez NOVA seule, au palier 3 du BTS GPME, avec le bloc des risques, et leurs titres sont ceux du programme", () => {
    for (const ch of [S_ASSURER_CONTRE_LES_ALEAS, LE_COUT_DE_LA_NON_QUALITE]) {
      expect(CHAPITRES).toContain(ch);
      expect(PROGRAMME.gpme[3]).toContain(ch.titre);
      expect(ch.parcours).toBe("gpme");
      expect(ch.palier).toBe(3);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises?.codes).toEqual(["nova"]);
      expect(ch.entreprises!.pourquoi).toMatch(/^[a-zé].*\.$/);
      expect(ch.blocs).toEqual(["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"]);
      const r = referentielDeCitation(ch.blocs[0]!)!;
      expect(r.code).toBe("bts-gpme");
      expect(r.referentiel.entrees).toContain(ch.blocs[0]!.replace(/^BTS GPME /, ""));
      expect(ch.etapes[0]!.type).toBe("lecture");
      expect(ch.etapes.at(-1)!.id).toBe("synthese");
      const synthese = ch.etapes.at(-1)!;
      if (synthese.type !== "lecture") throw new Error("La synthèse est une lecture");
      expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.");
    }
    expect(f.entreprise).toBe(cas.entreprise);
    expect(SITUATIONS).toContain(L_ASSUREUR_AUGMENTE_LA_PRIME);
    expect(SITUATIONS).toContain(UNE_SEULE_DEMARCHE_QUALITE);
  });

  it("au gabarit de l'étalon : deux cycles pari, curseur ou laboratoire, formalisation ; un laboratoire ; des étapes d'expert à trois champs", () => {
    const cycles: Record<string, readonly (readonly [string, string, string])[]> = {
      [S_ASSURER_CONTRE_LES_ALEAS.code]: [
        ["predire-la-probabilite", "la-probabilite-qui-rentabilise", "prime-pure-et-chargement"],
        ["predire-l-incendie", "le-laboratoire-de-l-assurance", "ce-que-nova-peut-encaisser"],
      ],
      [LE_COUT_DE_LA_NON_QUALITE.code]: [
        ["predire-le-double", "le-cout-d-un-retour", "le-u"],
        ["predire-le-resultat", "la-qualite-percue", "le-resultat-de-la-qualite"],
      ],
    };
    const experts: Record<string, readonly string[]> = {
      [S_ASSURER_CONTRE_LES_ALEAS.code]: ["la-panne-selon-le-trimestre", "l-etendue-et-ses-franchises", "l-incendie-et-la-reserve", "croitre-et-s-assurer"],
      [LE_COUT_DE_LA_NON_QUALITE.code]: ["l-euro-de-prevention", "a-rebours"],
    };
    for (const ch of [S_ASSURER_CONTRE_LES_ALEAS, LE_COUT_DE_LA_NON_QUALITE]) {
      const ids = ch.etapes.map((e) => e.id);
      for (const [pari, manipuler, formaliser] of cycles[ch.code]!) {
        expect(ids.indexOf(pari), pari).toBeGreaterThanOrEqual(0);
        expect(ids.indexOf(manipuler), manipuler).toBe(ids.indexOf(pari) + 1);
        expect(ids.indexOf(formaliser), formaliser).toBeGreaterThan(ids.indexOf(manipuler));
        expect(ch.etapes[ids.indexOf(pari)]!.type).toBe("choix");
        expect(["curseur", "simulation"]).toContain(ch.etapes[ids.indexOf(manipuler)]!.type);
        expect(ch.etapes[ids.indexOf(formaliser)]!.type).toBe("montants");
      }
      expect(ch.etapes.filter((e) => e.type === "simulation")).toHaveLength(1);
      expect(ch.etapes.filter((e) => e.type === "curseur").length).toBeGreaterThanOrEqual(2);
      const labo = ch.etapes.find((e) => e.type === "simulation") as EtapeSimulation;
      expect(labo.graphique, ch.code).toBeDefined();
      for (const id of experts[ch.code]!) expect(Object.keys(attendus(ch, id)).length, id).toBeGreaterThanOrEqual(3);
    }
    // Le laboratoire de l'assurance compare des formules : un levier à choix.
    const formule = (S_ASSURER_CONTRE_LES_ALEAS.etapes.find((e) => e.type === "simulation") as EtapeSimulation).leviers(cas).find((l) => l.code === "formule")!;
    expect(formule.choix!.map((x) => x.libelle)).toEqual(["Sans assurance", "Basique", "Étendue", "Tous risques"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// S'ASSURER CONTRE LES ALÉAS
// ─────────────────────────────────────────────────────────────────────────────

describe("s'assurer contre les aléas, chez NOVA", () => {
  const ch = S_ASSURER_CONTRE_LES_ALEAS;
  const aleas = Object.fromEntries(f.aleas.map((a) => [a.code, a]));
  /** Les enceintes qu'un aléa sur l'outil fait perdre au trimestre où il tombe : ventes − min(demande, ligne amputée). */
  const perdues = (perte: number) => ventes.map((v, i) => v - Math.min(demande[i]!, Math.floor(ligne * (1 - perte)), equipe));
  const moyenne = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0) / xs.length;
  const cout: Record<string, number> = Object.fromEntries(
    f.aleas.map((a) => [a.code, a.dommages + (a.perteDeCapacite > 0 ? moyenne(perdues(a.perteDeCapacite)) : a.ventesPerdues) * m]),
  );
  const esperance = f.aleas.reduce((t, a) => t + a.probabilite * cout[a.code]!, 0);
  /** Une formule, à la main : la prime pure, le reste à charge espéré, le coût moyen, le pire reste à charge. */
  const formule = (primeT: number, franchise: number, couverts: readonly string[], fiche = f.aleas) => {
    const prime = primeT * 4;
    const reste = (code: string) => (couverts.includes(code) ? Math.min(cout[code]!, franchise) : cout[code]!);
    const primePure = centime(fiche.reduce((t, a) => t + a.probabilite * (cout[a.code]! - reste(a.code)), 0));
    const esp = fiche.reduce((t, a) => t + a.probabilite * cout[a.code]!, 0);
    return { prime, primePure, chargement: centime(prime - primePure), resteEspere: centime(esp - primePure), coutMoyen: centime(prime + esp - primePure), pire: Math.max(...fiche.map((a) => reste(a.code))) };
  };
  const [B, E, T] = f.formules;
  const sans = formule(0, 0, []);
  const basique = formule(B!.primeParTrimestre, B!.franchise, B!.couverts);
  const etendue = formule(E!.primeParTrimestre, E!.franchise, E!.couverts);
  const tous = formule(T!.primeParTrimestre, T!.franchise, T!.couverts);
  const k = f.absorption;
  const parTresorerie = (cc: number) => cc - k.matelas;
  const parCapitaux = k.capitauxPropres - k.capitalSocial * k.partDuCapitalAGarder;
  const capacite = (cc: number) => centime(Math.min(parTresorerie(cc), parCapitaux));

  it("les aléas, refaits à la main : ce qu'ils font perdre trimestre par trimestre, leur coût, l'espérance", () => {
    expect(perdues(1)).toEqual([5_800, 7_000, 6_200, 7_000]);
    expect(perdues(0.5)).toEqual([2_300, 3_500, 2_700, 3_500]);
    expect(perdues(0.2)).toEqual([200, 1_400, 600, 1_400]);
    expect(cout).toEqual({
      incendie: 220_000,
      "panne-majeure": 75_000,
      panne: 20_900,
      "degat-des-eaux": 6_000,
      cyberattaque: 25_000,
      "responsabilite-civile": 12_000,
      "defaillance-client": 15_000,
    });
    expect(centime(esperance)).toBe(13_330);
    expect(aleas.incendie!.probabilite).toBe(0.01);
  });

  it("les formules, refaites à la main : prime pure, chargement, reste à charge, coût moyen, pire", () => {
    expect(sans).toEqual({ prime: 0, primePure: 0, chargement: 0, resteEspere: 13_330, coutMoyen: 13_330, pire: 220_000 });
    expect(basique).toEqual({ prime: 6_000, primePure: 2_250, chargement: 3_750, resteEspere: 11_080, coutMoyen: 17_080, pire: 75_000 });
    expect(etendue).toEqual({ prime: 18_000, primePure: 11_660, chargement: 6_340, resteEspere: 1_670, coutMoyen: 19_670, pire: 15_000 });
    expect(tous).toEqual({ prime: 28_000, primePure: 12_820, chargement: 15_180, resteEspere: 510, coutMoyen: 28_510, pire: 1_000 });
    // Toute formule coûte en moyenne : le chargement est toujours positif.
    for (const x of [basique, etendue, tous]) expect(x.chargement).toBeGreaterThan(0);
    // L'ancienne règle (une année de prime sous le pire sinistre) dit oui à toutes : elle ne choisit rien.
    for (const x of [basique, etendue, tous]) expect(x.prime).toBeLessThan(sans.pire);
  });

  it("les étapes guidées : le coût de l'incendie, l'espérance, la capacité d'absorption", () => {
    expect(attendus(ch, "cout-de-l-incendie")).toEqual({ "Enceintes perdues, en moyenne": 6_500, "Marge perdue": 6_500 * m, "Coût d'un incendie": 220_000 });
    expect(attendus(ch, "esperance")).toEqual({
      "Espérance de l'incendie": 0.01 * 220_000,
      "Espérance de la panne de la ligne": 0.2 * cout.panne!,
      "Espérance des sinistres de l'année": 13_330,
    });
    expect(attendus(ch, "ce-que-nova-peut-encaisser")).toEqual({
      "Capacité par la trésorerie": centime(parTresorerie(k.compteCourant)),
      "Capacité par les capitaux propres": centime(parCapitaux),
      "Capacité d'absorption": capacite(k.compteCourant),
    });
    expect([centime(parTresorerie(k.compteCourant)), centime(parCapitaux)]).toEqual([105_734.87, 154_225.96]);
  });

  it("les étapes autonomes et d'expert : la prime pure, l'Étendue, la panne, l'incendie et la réserve, la ligne payée comptant", () => {
    expect(attendus(ch, "prime-pure-et-chargement")).toEqual({ "Prime pure de la formule": 2_250, "Chargement de la formule": 3_750, "Coût moyen de l'année, assurée": 17_080 });
    expect(attendus(ch, "l-etendue-et-ses-franchises")).toEqual({ "Prime pure de l'Étendue": 11_660, "Reste à charge espéré avec l'Étendue": 1_670, "Coût moyen de l'année avec l'Étendue": 19_670 });
    expect(attendus(ch, "la-panne-selon-le-trimestre")).toEqual({
      "Enceintes perdues, panne au trimestre 1": 200,
      "Enceintes perdues, panne au trimestre 2": 1_400,
      "Coût moyen de la panne": 2_000 + 900 * m,
    });
    // L'incendie échoue aux deux tests, même réserve comptée.
    const avecReserve = k.compteCourant + k.reserve - k.matelas;
    expect(attendus(ch, "l-incendie-et-la-reserve")).toEqual({
      "Compte courant après l'incendie": centime(k.compteCourant - 220_000),
      "Capitaux propres après l'incendie": centime(k.capitauxPropres - 220_000),
      "Capacité par la trésorerie, réserve comptée": centime(avecReserve),
    });
    expect([centime(k.compteCourant - 220_000), centime(k.capitauxPropres - 220_000), centime(avecReserve)]).toEqual([-104_265.13, 9_225.96, 238_734.87]);
    expect(k.capitauxPropres - 220_000).toBeLessThan(k.capitalSocial / 2);
    // La ligne automatisée payée comptant : la Basique ne s'encaisse plus, l'Étendue est retenue.
    const prix = f.machines.find((x) => x.code === "ligne-automatisee")!.prix;
    const apres = capacite(k.compteCourant - prix);
    expect(apres).toBe(45_734.87);
    expect(basique.pire).toBeGreaterThan(apres);
    expect(etendue.pire).toBeLessThanOrEqual(apres);
    expect(attendus(ch, "croitre-et-s-assurer")).toEqual({ "Capacité d'absorption après l'achat": apres, "Coût moyen de la formule retenue": 19_670, "Surcoût moyen de l'année": 19_670 - 17_080 });
  });

  it("les verdicts : la règle retient la Basique, l'incendie ne s'encaisse pas, une année sans sinistre coûte la prime", () => {
    // La règle, à la main : écarter ce qui ne s'encaisse pas, retenir la moins chère en moyenne.
    const options = { sans, basique, etendue, tous };
    const possibles = Object.entries(options).filter(([, o]) => o.pire <= capacite(k.compteCourant));
    expect(possibles.map(([n]) => n)).toEqual(["basique", "etendue", "tous"]);
    expect(possibles.reduce((a, b) => (b[1].coutMoyen < a[1].coutMoyen ? b : a))[0]).toBe("basique");
    expect(assuranceDeNova(cas).retenue.choix).toBe("basique");
    expect(assuranceDeNova(cas).laMoinsChere.choix).toBe("sans-assurance");
    expect(juste(ch, "la-regle")).toBe("La Basique : la moins chère en moyenne des options dont le pire s'encaisse");
    expect(juste(ch, "predire-l-incendie")).toBe("Non : ni sa trésorerie ni ses capitaux propres ne l'encaissent");
    expect(juste(ch, "predire-la-probabilite")).toBe("Entre 2 % et 4 % par an");
    expect(juste(ch, "l-annee-sans-sinistre")).toBe("Elle a coûté sa prime, 6 000 €, et a protégé d'un incendie qui ne s'encaissait pas");
    // La mission « jouez » fait souscrire la formule que la règle retient.
    expect(formuleRetenue("nova").formule.name).toBe("Basique");
  });

  it("les curseurs, refaits à la main : la probabilité qui rentabilise la prime, la trésorerie qui garde la Basique", () => {
    // La Basique rembourse en moyenne 100 € (le dégât des eaux) + p × 215 000 € ; sa prime, 6 000 €.
    const rembourse = (q: number) => 0.1 * (6_000 - 5_000) + (q / 1000) * (220_000 - 5_000);
    const p = Math.ceil(((6_000 - 0.1 * 1_000) / 215_000) * 1000);
    expect(p).toBe(28);
    expect(rembourse(27)).toBeLessThan(6_000);
    expect(curseur(ch, "la-probabilite-qui-rentabilise")).toEqual({
      attendu: p,
      bornes: [0, 60],
      droites: [rembourse(0), 6_000, rembourse(60), 6_000].map(centime),
      lecture: {
        "Espérance de l'incendie": centime((p / 1000) * 220_000),
        "Remboursé en moyenne par la formule": centime(rembourse(p)),
        "Prime de l'année": 6_000,
        "Chargement : prime moins remboursé en moyenne": centime(6_000 - rembourse(p)),
      },
    });
    expect([centime(rembourse(p)), centime(6_000 - rembourse(p))]).toEqual([6_120, -120]);
    // Le compte courant : matelas + pire de la Basique.
    const compte = k.matelas + basique.pire;
    expect(compte).toBe(85_000);
    expect(curseur(ch, "la-tresorerie-qui-garde-la-basique")).toEqual({
      attendu: compte,
      bornes: [0, 160_000],
      droites: [-k.matelas, basique.pire, 160_000 - k.matelas, basique.pire],
      lecture: {
        "Capacité par la trésorerie": compte - k.matelas,
        "Capacité par les capitaux propres": centime(parCapitaux),
        "Pire reste à charge avec la Basique": basique.pire,
        "Capacité qui reste après ce sinistre": 0,
      },
    });
    // Sur la course du curseur, la trésorerie borne seule la capacité : la droite ne ment pas.
    expect(parTresorerie(160_000)).toBeLessThan(parCapitaux);
    expect(centime(k.compteCourant - compte)).toBe(30_734.87);
  });

  it("le laboratoire de l'assurance : la gravité face à la capacité écarte, la moyenne départage", () => {
    const l = laboratoire(ch, "le-laboratoire-de-l-assurance");
    expect(l.depart).toEqual({ formule: 0, incendie: 10, compte: k.compteCourant });
    expect(l.solution).toEqual({ formule: 2, incendie: 10, compte: centime(k.compteCourant - 60_000) });
    expect(l.reussi).toEqual([false, true]);
    const lire = (o: ReturnType<typeof formule>, cc: number) => ({
      "Prime de l'année": o.prime,
      "Remboursé en moyenne : la prime pure": o.primePure,
      "Coût moyen de l'année, en effet sur le résultat": -o.coutMoyen + 0,
      "Pire reste à charge": o.pire,
      "Capacité d'absorption": capacite(cc),
      "Capacité qui reste après le pire sinistre": centime(capacite(cc) - o.pire),
    });
    expect(l.auDepart).toEqual(lire(sans, k.compteCourant));
    expect(l.aLaSolution).toEqual(lire(etendue, k.compteCourant - 60_000));
    expect(Object.values(l.aLaSolution)).toEqual([18_000, 11_660, -19_670, 15_000, 45_734.87, 30_734.87]);
    // D'autres positions réussissent : un compte plus bas encore, avec la formule que la règle y retient.
    expect(l.atteint({ formule: 3, incendie: 10, compte: centime(k.compteCourant - 95_000) })).toBe(true);
    expect(l.atteint({ formule: 2, incendie: 10, compte: centime(k.compteCourant - 95_000) })).toBe(false);
    // La probabilité d'incendie bouge les coûts moyens, pas le choix.
    expect(l.atteint({ formule: 2, incendie: 60, compte: centime(k.compteCourant - 60_000) })).toBe(true);
    // Le graphique : la capacité d'absorption plafonne quand les capitaux propres prennent le relais.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("compte");
    const [cap, pire] = g.courbes;
    const en = (cc: number, formuleChoisie = 1) => ({ formule: formuleChoisie, incendie: 10, compte: cc });
    expect(cap!.valeur(en(15_734.87))).toBe(5_734.87);
    expect(cap!.valeur(en(115_734.87))).toBe(105_734.87);
    expect(cap!.valeur(en(165_734.87))).toBe(154_225.96);
    expect(cap!.valeur(en(315_734.87))).toBe(154_225.96);
    expect(pire!.valeur(en(115_734.87, 1))).toBe(75_000);
    expect(pire!.valeur(en(115_734.87, 0))).toBe(220_000);
    expect(pire!.valeur(en(115_734.87, 3))).toBe(1_000);
  });

  it("le cas : la prime augmentée, le pire qui ne bouge pas, la prime plafond à rebours", () => {
    const s = L_ASSUREUR_AUGMENTE_LA_PRIME;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("La gérante");
    expect(HAUSSE_DE_LA_PRIME).toBe(0.2);
    const nouvelle = B!.primeParTrimestre * 1.2;
    expect(attendus(s, "prime")).toEqual({
      "Prime d'un trimestre après la hausse": nouvelle,
      "Prime de l'année après la hausse": nouvelle * 4,
      "Coût moyen de l'année, prime augmentée": nouvelle * 4 + basique.resteEspere,
    });
    expect([nouvelle, nouvelle * 4, nouvelle * 4 + basique.resteEspere]).toEqual([1_800, 7_200, 18_280]);
    expect(attendus(s, "le-pire-ne-bouge-pas")).toEqual({ "Pire reste à charge, formule renouvelée": 75_000, "Capacité qui reste après ce sinistre": centime(capacite(k.compteCourant) - 75_000) });
    // Le curseur : la plus haute prime d'un trimestre où 4 × q + 11 080 ≤ 19 670.
    const plafondT = Math.floor((etendue.coutMoyen - basique.resteEspere) / 4);
    expect(plafondT).toBe(2_147);
    expect(curseur(s, "le-plafond-au-curseur")).toEqual({
      attendu: plafondT,
      bornes: [1_500, 3_000],
      droites: [etendue.coutMoyen, 1_500 * 4 + basique.resteEspere, etendue.coutMoyen, 3_000 * 4 + basique.resteEspere],
      lecture: {
        "Prime de l'année": plafondT * 4,
        "Coût moyen de l'année avec la Basique": plafondT * 4 + basique.resteEspere,
        "Coût moyen de l'année avec l'Étendue": etendue.coutMoyen,
        "Avance de la Basique sur l'Étendue": etendue.coutMoyen - plafondT * 4 - basique.resteEspere,
      },
    });
    const plafondAn = etendue.coutMoyen - basique.resteEspere;
    expect(attendus(s, "plafond")).toEqual({
      "Prime plafond de l'année": plafondAn,
      "Prime plafond d'un trimestre": plafondAn / 4,
      "Hausse que la formule supporte encore, en %": centime((plafondAn / 4 / B!.primeParTrimestre - 1) * 100),
    });
    expect([plafondAn, plafondAn / 4, centime((plafondAn / 4 / B!.primeParTrimestre - 1) * 100)]).toEqual([8_590, 2_147.5, 43.17]);
    expect(primeAugmentee(cas).verdict).toBe("renouveler");
    expect(juste(s, "reponse")).toBe("Renouveler : même augmentée, la Basique reste la meilleure option qui s'encaisse");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(L_ASSUREUR_AUGMENTE_LA_PRIME));
});

// ─────────────────────────────────────────────────────────────────────────────
// LE COÛT DE LA NON-QUALITÉ
// ─────────────────────────────────────────────────────────────────────────────

describe("le coût de la non-qualité, chez NOVA", () => {
  const ch = LE_COUT_DE_LA_NON_QUALITE;
  const q = f.qualite;
  /** Le taux de défaut d'un budget, à la main : droite entre deux points de la courbe, plat au-delà du dernier. */
  const taux = (b: number) => {
    const c = q.courbe;
    if (b >= c.at(-1)!.budget) return c.at(-1)!.tauxDeDefaut;
    const i = c.findIndex((p) => p.budget >= b);
    if (i <= 0) return c[0]!.tauxDeDefaut;
    const a = c[i - 1]!;
    const z = c[i]!;
    return a.tauxDeDefaut + ((b - a.budget) / (z.budget - a.budget)) * (z.tauxDeDefaut - a.tauxDeDefaut);
  };
  /** Les coûts de la qualité, à la main, pour un budget et des leviers. */
  const qualite = (b: number, o: { detection?: number; ventes?: number; retour?: number } = {}) => {
    const d = o.detection ?? q.controleFinal.tauxDeDetection;
    // Des défauts attendus : ils ne s'arrondissent pas (le bruit des virgules flottantes, seul, est retiré).
    const defauts = Math.round(volume * taux(b) * 1e9) / 1e9;
    const detectes = defauts * d;
    const livres = defauts - detectes;
    const interne = centime(detectes * q.coutDUnDefautDetecte);
    const externe = centime(livres * (o.retour ?? q.coutDUnDefautLivre));
    const total = centime(b + q.controleFinal.cout + interne + externe);
    const ventesPerdues = livres * (o.ventes ?? q.ventesPerduesParDefautLivre);
    return { defauts, detectes, livres, interne, externe, total, ventesPerdues, margePerdue: centime(ventesPerdues * m), resultat: centime((volume - ventesPerdues) * m - total) };
  };
  const budgets = q.courbe.map((p) => p.budget);
  const [aucun, moitie, actuel, double] = budgets.map((b) => qualite(b));

  it("la fiche donne les chiffres de la consigne : les quatre budgets, et la défaillance externe qui n'est plus nulle", () => {
    expect(budgets).toEqual([0, 8_000, 16_000, 32_000]);
    expect([aucun, moitie, actuel, double].map((x) => centime(x!.defauts))).toEqual([2_080, 1_300, 910, 520]);
    expect([aucun, moitie, actuel, double].map((x) => [x!.interne, x!.externe])).toEqual([
      [33_280, 41_600],
      [20_800, 26_000],
      [14_560, 18_200],
      [8_320, 10_400],
    ]);
    expect([aucun, moitie, actuel, double].map((x) => x!.total)).toEqual([80_880, 60_800, 54_760, 56_720]);
    expect([aucun, moitie, actuel, double].map((x) => x!.resultat)).toEqual([438_912, 468_820, 479_774, 482_728]);
    // La défaillance externe pèse plus que l'interne, à chaque budget.
    for (const x of [aucun, moitie, actuel, double]) expect(x!.externe).toBeGreaterThan(x!.interne);
    // Le U : le coût le plus bas au budget actuel ; le piège : le meilleur résultat au double.
    expect(qualiteDeNova(cas).leMoinsCher.prevention).toBe(16_000);
    expect(qualiteDeNova(cas).leMeilleur.prevention).toBe(32_000);
    // Sans la qualité perçue, les deux lectures désigneraient le budget actuel.
    const sansVentes = budgets.map((b) => qualite(b, { ventes: 0 }).resultat);
    expect(budgets[sansVentes.indexOf(Math.max(...sansVentes))]).toBe(16_000);
    expect(qualiteDeNova(cas).sansLaQualitePercue).toEqual({ leMoinsCher: 16_000, leMeilleur: 16_000 });
  });

  it("les étapes guidées : les défauts et le coût total au budget actuel", () => {
    expect(attendus(ch, "les-defauts")).toEqual({ "Défauts de l'année": 910, "Défauts trouvés au contrôle": 728, "Défauts livrés aux clients": 182 });
    expect(attendus(ch, "cout-total")).toEqual({ "Défaillance interne": 728 * 20, "Défaillance externe": 182 * 100, "Coût total de la qualité": 16_000 + 6_000 + 14_560 + 18_200 });
  });

  it("les étapes autonomes : le U, le résultat de la qualité, la standardisation", () => {
    expect(attendus(ch, "le-u")).toEqual({ "Coût total sans prévention": aucun!.total, "Coût total à la moitié": moitie!.total, "Coût total au double": double!.total });
    expect(attendus(ch, "le-resultat-de-la-qualite")).toEqual({
      "Ventes perdues au budget actuel": 182 * 3,
      "Résultat de la qualité au budget actuel": (volume - 546) * m - 54_760,
      "Résultat de la qualité au double": (volume - 312) * m - 56_720,
    });
    // La standardisation : 0,5 point de taux en moins, au coût moyen d'un défaut (0,8 × 20 + 0,2 × 100 = 36 €).
    const evites = centime(volume * 0.005);
    expect(attendus(ch, "la-standardisation")).toEqual({ "Défauts évités sur l'année": evites, "Gain de l'année sur le coût total": evites * 36, "Délai de récupération sur les coûts": centime(5_000 / (evites * 36)) });
    expect([evites, evites * 36, centime(5_000 / (evites * 36))]).toEqual([130, 4_680, 1.07]);
  });

  it("les étapes d'expert : l'euro de prévention, le calcul à rebours", () => {
    const evitee = 14_560 + 18_200 - (8_320 + 10_400);
    const regagnee = (546 - 312) * m;
    expect(attendus(ch, "l-euro-de-prevention")).toEqual({
      "Non-qualité évitée": evitee,
      "Marge regagnée sur les ventes perdues": regagnee,
      "Ce que rapporte un euro de prévention ajouté": centime((evitee + regagnee) / 16_000),
    });
    expect([evitee, regagnee, centime((evitee + regagnee) / 16_000)]).toEqual([14_040, 4_914, 1.18]);
    // Sur les seuls coûts, un euro n'en évite que 0,88 : le coût total monte ; ventes comprises, il rapporte 1,18 €.
    expect(evitee / 16_000).toBeLessThan(1);
    expect(DEFAILLANCE_EXTERNE_A_REBOURS).toBe(22_100);
    const livres = 22_100 / 100;
    const defauts = livres / 0.2;
    const t = defauts / volume;
    const budget = 8_000 + ((0.05 - t) / (0.05 - 0.035)) * 8_000;
    expect(attendus(ch, "a-rebours")).toEqual({ "Défauts de cette année": centime(defauts), "Taux de défaut, en %": centime(t * 100), "Budget de prévention que ce taux suppose": centime(budget) });
    expect([centime(defauts), centime(t * 100), centime(budget)]).toEqual([1_105, 4.25, 12_000]);
  });

  it("les verdicts : le coût le plus bas, le piège, la critique", () => {
    expect(juste(ch, "predire-le-double")).toBe("Monte : la prévention ajoutée coûte plus que les défaillances évitées");
    expect(juste(ch, "par-le-cout")).toBe("Au budget actuel");
    expect(juste(ch, "predire-le-resultat")).toBe("Plus haut qu'au budget actuel : les ventes gardées paient la prévention en plus");
    expect(juste(ch, "par-le-resultat")).toBe("Le budget au meilleur résultat : les ventes gardées comptent autant que les coûts");
    expect(juste(ch, "la-critique")).toBe("Il peut exagérer la perte : au trimestre 2 ou 4, un client perdu peut être remplacé par une demande refusée");
    // Au-delà du double, le taux de défaut ne baisse plus : le résultat retombe.
    expect(qualite(36_000).resultat).toBe(478_728);
  });

  it("les curseurs, refaits à la main : le coût d'un retour qui fait doubler, les ventes perdues qui font doubler", () => {
    // Coût total à r € le retour : b + 6 000 + trouvés × 20 + livrés × r.
    const total = (b: number, r: number) => qualite(b, { retour: r }).total;
    const r = Math.ceil((32_000 + 8_320 - (16_000 + 14_560)) / (182 - 104));
    expect(r).toBe(126);
    expect(total(32_000, 125)).toBeGreaterThan(total(16_000, 125));
    expect(curseur(ch, "le-cout-d-un-retour")).toEqual({
      attendu: r,
      bornes: [50, 200],
      droites: [total(16_000, 50), total(32_000, 50), total(16_000, 200), total(32_000, 200)],
      lecture: {
        "Défaillance externe au budget actuel": 182 * r,
        "Coût total au budget actuel": total(16_000, r),
        "Coût total au double": total(32_000, r),
        "Ce que doubler fait gagner sur le coût total": centime(total(16_000, r) - total(32_000, r)),
      },
    });
    expect([total(16_000, r), total(32_000, r)]).toEqual([59_492, 59_424]);
    // Résultat à v ventes perdues pour 100 défauts livrés : (26 000 − livrés × v ÷ 100) × 21 − coût total.
    const res = (b: number, v: number) => qualite(b, { ventes: v / 100 }).resultat;
    const v = Math.ceil(((56_720 - 54_760) / ((182 - 104) * m)) * 100);
    expect(v).toBe(120);
    expect(res(32_000, 119)).toBeLessThan(res(16_000, 119));
    expect(curseur(ch, "la-qualite-percue")).toEqual({
      attendu: v,
      bornes: [0, 400],
      droites: [res(32_000, 0), res(16_000, 0), res(32_000, 400), res(16_000, 400)],
      lecture: {
        "Ventes perdues au budget actuel": centime(182 * 1.2),
        "Résultat de la qualité au budget actuel": res(16_000, v),
        "Résultat de la qualité au double": res(32_000, v),
        "Ce que doubler fait gagner au résultat": centime(res(32_000, v) - res(16_000, v)),
      },
    });
    expect(centime(res(32_000, v) - res(16_000, v))).toBe(5.6);
  });

  it("le laboratoire de la qualité : le meilleur résultat n'est pas au coût le plus bas, et le graphique trace les deux U", () => {
    const l = laboratoire(ch, "le-laboratoire-de-la-qualite");
    expect(l.depart).toEqual({ prevention: 16_000, detection: 80, ventes: 3, retour: 100 });
    expect(l.solution).toEqual({ prevention: 32_000, detection: 80, ventes: 3, retour: 100 });
    expect(l.reussi).toEqual([false, true]);
    const lire = (x: ReturnType<typeof qualite>) => ({
      "Défauts de l'année": x.defauts,
      "Défauts livrés aux clients": x.livres,
      "Coût total de la qualité": x.total,
      "Marge des ventes perdues": x.margePerdue,
      "Résultat de la qualité": x.resultat,
      "Écart de résultat face au départ": centime(x.resultat - actuel!.resultat),
    });
    const arrondi = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([cle, x]) => [cle, centime(x)]));
    expect(arrondi(l.auDepart)).toEqual(arrondi(lire(actuel!)));
    expect(arrondi(l.aLaSolution)).toEqual(arrondi(lire(double!)));
    expect(arrondi(l.aLaSolution)).toEqual({
      "Défauts de l'année": 520,
      "Défauts livrés aux clients": 104,
      "Coût total de la qualité": 56_720,
      "Marge des ventes perdues": 6_552,
      "Résultat de la qualité": 482_728,
      "Écart de résultat face au départ": 2_954,
    });
    // Sans ventes perdues, le budget actuel redevient le meilleur : une autre position réussit.
    expect(l.atteint({ prevention: 16_000, detection: 80, ventes: 0, retour: 100 })).toBe(true);
    expect(l.atteint({ prevention: 32_000, detection: 80, ventes: 0, retour: 100 })).toBe(false);
    // Le graphique : le coût total et le coût, ventes perdues comprises, selon la prévention.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("prevention");
    const [cout, complet] = g.courbes;
    const a = (b: number) => ({ prevention: b, detection: 80, ventes: 3, retour: 100 });
    expect([0, 16_000, 32_000, 40_000].map((b) => cout!.valeur(a(b)))).toEqual([80_880, 54_760, 56_720, 64_720]);
    expect([0, 16_000, 32_000, 40_000].map((b) => complet!.valeur(a(b)))).toEqual([80_880 + 26_208, 54_760 + 11_466, 56_720 + 6_552, 64_720 + 6_552]);
    expect(cout!.valeur(a(24_000))).toBe(qualite(24_000).total);
    expect(cout!.valeur(a(24_000))).toBe(55_740);
  });

  it("le cas : prévenir ou détecter, le délai de récupération face à l'horizon du gérant", () => {
    const s = UNE_SEULE_DEMARCHE_QUALITE;
    casDedie(s, ch);
    expect(s.commanditaire).toBe("Le gérant");
    expect(HORIZON_DU_GERANT_EN_ANNEES).toBe(3);
    const [stand, controle] = f.demarches;
    // La standardisation : 910 − 26 000 × 3 % = 130 défauts de moins ; 26 livrés de moins.
    const avecStand = qualite(16_000);
    const defautsStand = volume * (taux(16_000) - stand!.baisseDuTauxDeDefaut);
    const gainStandCouts = centime(avecStand.total - centime(16_000 + 6_000 + defautsStand * 0.8 * 20 + defautsStand * 0.2 * 100));
    const ventesStand = centime((182 - defautsStand * 0.2) * 3 * m);
    // Le contrôle en ligne : autant de défauts, 90 % trouvés au lieu de 80 %.
    const livresEvites = 910 * (controle!.tauxDeDetection! - 0.8);
    const gainControleCouts = centime(livresEvites * (100 - 20));
    const ventesControle = centime(livresEvites * 3 * m);
    expect([gainStandCouts, ventesStand, gainControleCouts, ventesControle]).toEqual([4_680, 1_638, 7_280, 5_733]);
    expect(attendus(s, "sur-les-couts")).toEqual({
      "Gain de l'année sur les coûts, standardisation": gainStandCouts,
      "Gain de l'année sur les coûts, contrôle en ligne": gainControleCouts,
      "Délai de récupération du contrôle en ligne, sur les coûts": centime(12_000 / gainControleCouts),
    });
    expect(attendus(s, "ventes-comprises")).toEqual({
      "Gain de l'année ventes comprises, standardisation": gainStandCouts + ventesStand,
      "Gain de l'année ventes comprises, contrôle en ligne": gainControleCouts + ventesControle,
      "Délai de récupération du contrôle en ligne, ventes comprises": centime(12_000 / (gainControleCouts + ventesControle)),
    });
    expect([centime(12_000 / gainControleCouts), centime(12_000 / (gainControleCouts + ventesControle)), centime(5_000 / (gainStandCouts + ventesStand))]).toEqual([1.65, 0.92, 0.79]);
    const netStand = (gainStandCouts + ventesStand) * 3 - 5_000;
    const netControle = (gainControleCouts + ventesControle) * 3 - 12_000;
    expect(attendus(s, "sur-l-horizon")).toEqual({
      "Gain net sur le plan, standardisation": netStand,
      "Gain net sur le plan, contrôle en ligne": netControle,
      "Avance du contrôle en ligne sur le plan": netControle - netStand,
    });
    expect([netStand, netControle, netControle - netStand]).toEqual([13_954, 27_039, 13_085]);
    // Le curseur : (t − 80) × 9,1 défauts × (100 − 20 + 3 × 21) € ≥ 12 000 €.
    const parPoint = 9.1 * (100 - 20 + 3 * m);
    const t = Math.ceil(80 + 12_000 / parPoint);
    expect(t).toBe(90);
    expect(curseur(s, "la-detection-au-curseur")).toEqual({
      attendu: t,
      bornes: [80, 100],
      droites: [0, 12_000, centime(20 * parPoint), 12_000],
      lecture: {
        "Défauts livrés de moins": centime(9.1 * (t - 80)),
        "Gain sur les coûts": centime(9.1 * (t - 80) * 80),
        "Marge des ventes gardées": centime(9.1 * (t - 80) * 3 * m),
        "Gain de l'année, ventes comprises": centime((t - 80) * parPoint),
      },
    });
    expect(deuxDemarches(cas).verdict).toBe("controle-en-ligne");
    expect(juste(s, "reponse")).toBe("Le contrôle en ligne : sur 3 ans, il rapporte le plus, ventes comprises");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(ch));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(UNE_SEULE_DEMARCHE_QUALITE));
});
