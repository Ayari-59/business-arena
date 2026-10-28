import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  CUISINES,
  FOURCHETTE_DE_LA_PROFESSION,
  HAUSSE_DU_CURSEUR,
  LE_COUT_MATIERE,
  MARGE_DU_LABORATOIRE,
  PLAT_DU_JOUR_TTC,
  PRIX_DU_CURSEUR,
  TICKET_DU_LABORATOIRE,
  coutMatiere,
} from "../../src/config/cours/chapitres/le-cout-matiere";
import {
  BAISSE_DE_LA_PROMOTION,
  CHAMBRES_DU_CONCURRENT,
  COUT_DU_LABORATOIRE,
  HOTELS,
  OCCUPATION_ET_REVENU_PAR_CHAMBRE,
  PRIX_DU_LABORATOIRE,
  occupation,
} from "../../src/config/cours/chapitres/occupation-et-revenu-par-chambre";
import { MONTER_LA_CARTE_OU_PREPARER_JUSTE, carteOuCuisine } from "../../src/config/cours/situations/par-chapitre/monter-la-carte-ou-preparer-juste";
import { MARGE_DE_PREPARATION } from "../../src/config/cours/monde/cuisine";
import { LA_TABLE_D_AUGUSTIN } from "../../src/config/cours/monde/la-table-d-augustin";
import { S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, alignement } from "../../src/config/cours/situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent";
import { L_ESCALE } from "../../src/config/cours/monde/l-escale";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU PALIER 2 DU BTS MHR, ET LEURS CAS PRATIQUES, DANS LE MONDE DU COURS.
 *
 * « Le coût matière et le prix d'un plat » (le bistrot) et « Le taux d'occupation, le prix moyen
 * et le revenu par chambre » (l'hôtel) prennent leurs chiffres dans les fiches figées du monde du
 * cours ; leurs cas les rejouent avec une décision changée. Ces gardes refont chaque chiffre À LA
 * MAIN sur les fiches, sans les fonctions des chapitres : les champs, chaque curseur (l'attendu, ses
 * droites aux deux bornes, sa lecture à l'attendu), chaque laboratoire (sa lecture au départ et à la
 * solution, son défi, ses courbes en quelques points), les variantes et les calculs à rebours ; elles
 * épinglent les verdicts, et vérifient que les textes se lisent : rien d'indéfini, pas de tiret au
 * milieu d'une phrase, une seule bonne réponse, aucune option qui en contient une autre, des
 * libellés uniques, et des accords justes avec « couverts » et « chambres ».
 */

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const etatVide: EtatDuCours = { soldes: {} };
const MHR = "bts-mhr";
const BLOC_1 = "BTS MHR Bloc 1 · Conception et production de services en hôtellerie restauration";
const BLOC_4 = "BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration";

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "curseur": {
      const k = e.cible(cas);
      const g = e.grandeur?.(cas);
      const r = e.rates?.(cas);
      return [e.titre, e.question(cas), ...e.explication(cas), ...e.lecture(cas, k.attendu).map((l) => l.libelle), ...e.droites(cas).libelles, ...(e.zones ?? []), g?.libelle ?? "", g?.unite ?? "", r?.dessous ?? "", r?.dessus ?? "", e.montrer ?? ""];
    }
    case "simulation": {
      const d = e.defi(cas);
      const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
      const g = e.graphique?.(cas);
      return [
        e.titre,
        e.question(cas),
        d.consigne,
        d.indice(depart),
        ...e.explication(cas, d.solution),
        ...e.lecture(cas, d.solution).map((l) => l.libelle),
        ...e.leviers(cas).flatMap((l) => [l.libelle, l.unite]),
        ...(g?.courbes.map((c) => c.libelle) ?? []),
        e.montrer ?? "",
      ];
    }
    default:
      return [e.titre];
  }
}

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function textesPropres(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  expect(chapitre.etapes.length, `${ch.code} : une étape a disparu chez ${code}`).toBe(ch.etapes.length);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculin = new RegExp(`\\bun ${u}\\b|\\b${u}s? (vendu|fabriqué|produit|servi|jeté|retourné|demandé)s?\\b(?!e)`, "i");
  // « chambres » et « nuitées » sont féminines, « couverts » masculin, dans toutes les entreprises.
  const fautes = [
    /\bchambres? (vendu|loué|occupé|resté|mis|servi|parti)s?\b(?!e)/i,
    /\bun chambre\b|\bune couvert\b|\bcouverts? (vendue|servie|préparée|perdue|ratée)s?\b/i,
    /\bnuitées? (vendu|demandé|servi|mis)s?\b(?!e)/i,
  ];
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(«])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/[A-ZÉ] [A-ZÉ] [A-ZÉ]/);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −|\+−|\s{2,}|\s$/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (couverts?|chambres?|nuitées?|clientèles?|salariés?|trimestres?)\b/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bà Le |\bde Le |\bà Les /);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
      for (const f of fautes) expect(x, `${e.id} : ${x}`).not.toMatch(f);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
    if (e.tableau) {
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(r2(c.attendu), `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      for (const o of options) for (const p of options) if (o !== p) expect(p.texte.toLowerCase().includes(o.texte.toLowerCase()), `${e.id} : ${o.texte}`).toBe(false);
    }
    if (e.type === "simulation") {
      const l = e.lecture(cas, e.defi(cas).solution);
      expect(new Set(l.map((x) => x.libelle)).size, e.id).toBe(l.length);
    }
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, dans l'ordre. */
function attendus(ch: Chapitre, id: string, cas: Cas): number[] {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${ch.code} / ${id} n'est pas une étape de montants`);
  return e.champs(cas, etatVide).map((c) => c.attendu);
}

/** Un curseur : son attendu, ses bornes, ses droites aux deux bornes, et sa lecture à l'attendu, par libellé. */
function curseur(ch: Chapitre, id: string, cas: Cas) {
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
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(r2),
    lecture: Object.fromEntries(e.lecture(cas, k.attendu).map((l) => [l.libelle, l.montant])),
  };
}

/** Un laboratoire : sa lecture au départ et à la solution, par libellé, et si chacun relève le défi. */
function laboratoire(ch: Chapitre, id: string, cas: Cas) {
  const e = ch.etapes.find((x) => x.id === id) as EtapeSimulation;
  expect(e.type, id).toBe("simulation");
  const d = e.defi(cas);
  const depart = Object.fromEntries(e.leviers(cas).map((l) => [l.code, l.depart]));
  const lire = (p: Record<string, number>) => Object.fromEntries(e.lecture(cas, p).map((l) => [l.libelle, l.montant]));
  return { e, d, depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
}

/** Ce qu'un cas dédié doit tenir (tests/cours/situations.test.ts). */
function casDedie(s: Situation, ch: Chapitre) {
  expect(s.reprend).toEqual([ch.code]);
  expect(s.palier).toBe(ch.palier);
  expect(s.parcours).toBe(ch.parcours);
  expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
  expect(s.libre).toBe(false);
  expect(s.blocs).toEqual([]);
  expect(s.code).not.toBe(ch.code);
  expect(s.commanditaire.length).toBeGreaterThan(3);
  expect(s.etapes[0]!.type).toBe("lecture");
  expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
  expect(s.etapes.at(-1)!.type).toBe("choix");
  for (const code of s.entreprises!.codes) {
    const cas = casDeLEntreprise(code);
    for (const e of s.etapes) {
      if (e.type !== "choix") continue;
      const options = e.options(cas, etatVide);
      const juste = options.find((o) => o.juste)!;
      const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(juste.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
    }
  }
}

/** L'expérience avant la formule : chaque pari juste avant son curseur, un laboratoire, au moins deux étapes d'expert. */
function lesTroisTemps(ch: Chapitre, paris: string[], curseurs: string[], labo: string, experts: string[]) {
  const ids = ch.etapes.map((e) => e.id);
  for (const [p, k] of paris.map((p, i) => [p, curseurs[i]!] as const)) {
    expect(ch.etapes.find((e) => e.id === p)?.type, p).toBe("choix");
    expect(ch.etapes.find((e) => e.id === k)?.type, k).toBe("curseur");
    expect(ids.indexOf(k), `${p} puis ${k}`).toBe(ids.indexOf(p) + 1);
  }
  expect(ch.etapes.filter((e) => e.type === "curseur").map((e) => e.id)).toEqual(curseurs);
  expect(ch.etapes.filter((e) => e.type === "simulation").map((e) => e.id)).toEqual([labo]);
  for (const x of experts) expect(ids, x).toContain(x);
  expect(experts.length).toBeGreaterThanOrEqual(2);
}

const bonne = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id);
  if (e?.type !== "choix") throw new Error(`${ch.code} / ${id} n'est pas un choix`);
  return (e as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!;
};

describe("les deux chapitres et leur place au programme", () => {
  it("leurs titres sont ceux du programme du BTS MHR, au palier 2, chacun chez son entreprise", () => {
    for (const ch of [LE_COUT_MATIERE, OCCUPATION_ET_REVENU_PAR_CHAMBRE]) {
      expect(PROGRAMME.mhr[2]).toContain(ch.titre);
      expect(ch.parcours).toBe("mhr");
      expect(ch.palier).toBe(2);
      expect(ch.libre).toBe(false);
      expect(ch.entreprises!.pourquoi).toMatch(/\.$/);
    }
    expect(LE_COUT_MATIERE.code).toBe("le-cout-matiere");
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.code).toBe("occupation-et-revenu-par-chambre");
    expect(LE_COUT_MATIERE.entreprises!.codes).toEqual(["bistrot"]);
    expect(CUISINES).toEqual(["bistrot"]);
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.entreprises!.codes).toEqual(["hotel"]);
    expect(HOTELS).toEqual(["hotel"]);
    // Les deux entreprises du métier sont bien un restaurant et un hôtel.
    expect(scenarioByCode("bistrot").sector).toBe("restauration");
    expect(scenarioByCode("hotel").sector).toBe("hotellerie");
  });

  it("chaque bloc cité se résout vers le référentiel du BTS MHR, mot pour mot", () => {
    expect(LE_COUT_MATIERE.blocs).toEqual([BLOC_1, BLOC_4]);
    expect(OCCUPATION_ET_REVENU_PAR_CHAMBRE.blocs).toEqual([BLOC_4]);
    for (const b of [...LE_COUT_MATIERE.blocs, ...OCCUPATION_ET_REVENU_PAR_CHAMBRE.blocs]) {
      const r = referentielDeCitation(b)!;
      expect(r.code, b).toBe(MHR);
      const officiel = b.replace(/^BTS MHR /, "");
      expect(r.referentiel.entrees).toContain(officiel);
      expect(blocOfficiel(b, MHR), b).toBe(officiel);
    }
  });

  it("les trois temps : deux cycles pari puis curseur, un laboratoire, au moins deux étapes d'expert", () => {
    lesTroisTemps(
      LE_COUT_MATIERE,
      ["predire-le-prix", "predire-la-marge-de-manoeuvre"],
      ["le-prix-au-curseur", "la-hausse-au-curseur"],
      "le-laboratoire-de-la-cuisine",
      ["les-denrees-perdues", "la-prime-au-ratio", "le-plat-du-jour"],
    );
    lesTroisTemps(
      OCCUPATION_ET_REVENU_PAR_CHAMBRE,
      ["predire-le-revpar", "predire-la-promotion"],
      ["le-terminus-au-curseur", "la-promotion-au-curseur"],
      "le-laboratoire-du-revpar",
      ["decomposer-l-ecart", "a-rebours", "la-limite-du-revpar"],
    );
    // La formule vient après l'expérience : chaque curseur précède l'étape de montants qui la fait calculer.
    const ids = (ch: Chapitre) => ch.etapes.map((e) => e.id);
    expect(ids(LE_COUT_MATIERE).indexOf("le-prix-au-curseur")).toBeLessThan(ids(LE_COUT_MATIERE).indexOf("le-prix-du-plat"));
    expect(ids(LE_COUT_MATIERE).indexOf("la-hausse-au-curseur")).toBeLessThan(ids(LE_COUT_MATIERE).indexOf("l-annee"));
    expect(ids(OCCUPATION_ET_REVENU_PAR_CHAMBRE).indexOf("le-terminus-au-curseur")).toBeLessThan(ids(OCCUPATION_ET_REVENU_PAR_CHAMBRE).indexOf("revpar"));
    expect(ids(OCCUPATION_ET_REVENU_PAR_CHAMBRE).indexOf("la-promotion-au-curseur")).toBeLessThan(ids(OCCUPATION_ET_REVENU_PAR_CHAMBRE).indexOf("deux-seuils"));
  });
});

describe("le coût matière et le prix d'un plat, au bistrot du monde du cours", () => {
  const code = "bistrot";
  const cas = casDeLEntreprise(code);
  const f = LA_TABLE_D_AUGUSTIN;
  const m = coutMatiere(cas);
  /**
   * La cuisine, refaite à la main sur la fiche : 100 couverts servables par jour, 90 jours par
   * trimestre ; la demande de chaque clientèle au ticket p vaut sa demande à 34 € × (p ÷ 34) ^ −1,8,
   * à l'unité ; le bistrot sert le plus petit de la demande et des couverts servables ; la cuisine
   * prépare la demande plus 5 %, à l'unité, dans la limite des couverts servables ; le couvert
   * coûte 10 € de denrées, 14 % de plus à partir du 3e trimestre ; 3 € d'autres coûts par couvert servi.
   */
  const servables = 100 * 90;
  const cout = (n: number) => (n >= 3 ? r2(10 * 1.14) : 10);
  const trimestre = (n: number, prix = 34, marge = 0.05) => {
    const p = r2(prix);
    const demande = f.clienteles.reduce((s, g) => s + Math.round(g.demande[n - 1]! * (p / 34) ** -1.8), 0);
    const servis = Math.min(demande, servables);
    const prepares = Math.min(Math.round(demande * (1 + marge)), servables);
    const denrees = r2(prepares * cout(n));
    const ca = r2(servis * p);
    return { demande, servis, prepares, denrees, ca, ratio: r1((denrees / ca) * 100), marge: r2(ca - denrees - servis * 3) };
  };
  const annee = [1, 2, 3, 4].map((n) => trimestre(n));

  it("la fiche est celle de LA TABLE D'AUGUSTIN, et la cuisine du cours ne lit pas l'arène", () => {
    expect(f.entreprise).toBe(cas.entreprise);
    expect([f.couvertsParJour, f.joursParTrimestre, f.prixDeLAnnee, f.tauxTva, f.coutMatiereParCouvert, f.autresCoutsParCouvert, f.elasticite]).toEqual([100, 90, 34, 0.1, 10, 3, -1.8]);
    expect(f.hausseDesDenrees).toEqual({ trimestre: 3, taux: 0.14 });
    expect(MARGE_DE_PREPARATION).toBe(0.05);
    // La fiche technique du menu du jour additionne bien le coût matière du couvert.
    expect(r2(f.cuisine.ficheTechnique.reduce((s, d) => s + d.cout, 0))).toBe(f.coutMatiereParCouvert);
    expect(FOURCHETTE_DE_LA_PROFESSION).toEqual({ min: 28, max: 32 });
    // La demande au ticket de l'année : le 4e trimestre dépasse ce que la salle peut servir.
    expect(annee.map((t) => t.demande)).toEqual([6400, 8500, 5480, 11_900]);
    expect(m.trimestres.map((t) => [t.demande, t.servis, t.prepares, t.coutDuCouvert, t.denrees, t.chiffreDAffaires, t.ratio])).toEqual(
      annee.map((t, i) => [t.demande, t.servis, t.prepares, cout(i + 1), t.denrees, t.ca, t.ratio]),
    );
    expect(annee.map((t) => t.prepares)).toEqual([6720, 8925, 5754, 9000]);
    expect(annee.map((t) => t.servis)).toEqual([6400, 8500, 5480, 9000]);
  });

  it("le couvert, la hausse et le prix qui garde le ratio : les champs attendent ce que la fiche donne", () => {
    const ratio = r1((10 / 34) * 100);
    const coefficient = r2(100 / ratio);
    expect([ratio, coefficient]).toEqual([29.4, 3.4]);
    expect(attendus(LE_COUT_MATIERE, "le-ratio-du-couvert", cas)).toEqual([ratio, coefficient]);
    expect(m.dansLaFourchette).toBe(true);
    expect(bonne(LE_COUT_MATIERE, "ce-qui-entre", cas).texte).toBe("Les denrées seules, hors taxes : 10 €");
    expect(m.matiereTtc).toBe(r2(10 * 1.055));
    const nouveau = r2(10 * 1.14);
    expect(attendus(LE_COUT_MATIERE, "la-hausse", cas)).toEqual([nouveau, r1((nouveau / 34) * 100)]);
    expect(attendus(LE_COUT_MATIERE, "la-hausse", cas)).toEqual([11.4, 33.5]);
    expect(m.hausse.trimestres).toEqual([3, 4]);
    const ht = r2(nouveau * coefficient);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([ht, r2(ht * 1.1)]);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([38.76, 42.64]);
  });

  it("le premier cycle : le pari, puis le ticket au curseur, refait à la main (le plus petit ticket entier où 29,4 % du prix couvrent 11,40 €)", () => {
    expect(bonne(LE_COUT_MATIERE, "predire-le-prix", cas).texte).toBe("De 14 %, comme les denrées");
    // 0,294 × p ≥ 11,40 dès p ≥ 38,78 : à l'euro, 39 €.
    const attendu = Math.ceil(11.4 / 0.294);
    expect(attendu).toBe(39);
    expect(PRIX_DU_CURSEUR).toEqual({ min: 30, max: 45 });
    expect(curseur(LE_COUT_MATIERE, "le-prix-au-curseur", cas)).toEqual({
      attendu,
      bornes: [30, 45],
      droites: [r2(0.294 * 30), 11.4, r2(0.294 * 45), 11.4],
      lecture: {
        "Ce que 29,4 % du ticket laisse aux denrées": r2(0.294 * 39),
        "Denrées du couvert, après la hausse": 11.4,
        "Ticket TTC de la carte": r2(39 * 1.1),
        "Ce que le ratio laisse de plus que les denrées": r2(0.294 * 39 - 11.4),
      },
    });
    expect([r2(0.294 * 39), r2(39 * 1.1)]).toEqual([11.47, 42.9]);
    // Le constat : à 39 €, les denrées prennent 29,2 % ; à 38 €, 30 % ; au seul montant de la hausse (35,40 €), 32,2 %.
    expect([r1((11.4 / 39) * 100), r1((11.4 / 38) * 100), r1((11.4 / 35.4) * 100)]).toEqual([29.2, 30, 32.2]);
    const e = LE_COUT_MATIERE.etapes.find((x) => x.id === "le-prix-au-curseur") as EtapeCurseur;
    expect(e.explication(cas).join(" ")).toContain("à 35,40 €, les denrées prendraient 32,2 % du prix");
  });

  it("le second cycle : la hausse que la fourchette absorbe, couverts jetés compris, refaite à la main", () => {
    expect(bonne(LE_COUT_MATIERE, "predire-la-marge-de-manoeuvre", cas).texte).toBe("De moins de 4 % : les couverts jetés prennent leur part");
    // 32 % de 34 € = 10,88 € pour les denrées d'un couvert servi ; il en porte 1,05 préparé : 10,50 € × (1 + h).
    const permis = r2(0.32 * 34);
    const attendu = Math.floor((permis / (10 * 1.05) - 1) * 100);
    expect([permis, attendu, Math.floor((permis / 10 - 1) * 100)]).toEqual([10.88, 3, 8]);
    expect(HAUSSE_DU_CURSEUR).toEqual({ min: 0, max: 20 });
    expect(curseur(LE_COUT_MATIERE, "la-hausse-au-curseur", cas)).toEqual({
      attendu,
      bornes: [0, 20],
      droites: [permis, 10.5, permis, r2(10.5 * 1.2)],
      lecture: {
        "Denrées d'une portion": r2(10 * 1.03),
        "Denrées d'un couvert servi, couverts jetés compris": r2(10.5 * 1.03),
        "Ce que 32 % du ticket laissent aux denrées": permis,
        "Ce qui reste avant de sortir de la fourchette": r2(permis - r2(10.5 * 1.03)),
      },
    });
  });

  it("le ratio de l'année et les plats préparés et non servis, refaits à la main", () => {
    const denrees = r2(annee.reduce((s, t) => s + t.denrees, 0));
    const ca = r2(annee.reduce((s, t) => s + t.ca, 0));
    expect(annee.map((t) => t.ratio)).toEqual([30.9, 30.9, 35.2, 33.5]);
    expect(m.pire).toBe(3);
    expect(attendus(LE_COUT_MATIERE, "l-annee", cas)).toEqual([denrees, r1((denrees / ca) * 100), annee[2]!.ratio]);
    expect(attendus(LE_COUT_MATIERE, "l-annee", cas)).toEqual([324_645.6, 32.5, 35.2]);
    const t3 = annee[2]!;
    const jetes = t3.prepares - t3.servis;
    const perdu = r2(jetes * 11.4);
    expect(attendus(LE_COUT_MATIERE, "les-denrees-perdues", cas)).toEqual([jetes, perdu, r1(((t3.denrees - perdu) / t3.ca) * 100)]);
    expect(attendus(LE_COUT_MATIERE, "les-denrees-perdues", cas)).toEqual([274, 3123.6, 33.5]);
    // Au 4e trimestre, la salle est pleine : la cuisine prépare juste les couverts servables.
    expect(annee[3]!.prepares - annee[3]!.servis).toBe(0);
  });

  it("les verdicts se calculent : le ratio du 3e trimestre se lit en trois morceaux, et l'année dépasse la fourchette", () => {
    // Sans les pertes, le ratio est celui d'un couvert servi au prix des denrées du trimestre.
    expect(m.ratioSansPerte).toBe(r1((11.4 / 34) * 100));
    const morceaux = [m.ratio, r1(m.ratioSansPerte - m.ratio), r1(m.trimestres[2]!.ratio - m.ratioSansPerte)];
    expect(morceaux).toEqual([29.4, 4.1, 1.7]);
    expect(r1(morceaux[0]! + morceaux[1]! + morceaux[2]!)).toBe(m.trimestres[2]!.ratio);
    expect(m.ratioDeLAnnee).toBeGreaterThan(FOURCHETTE_DE_LA_PROFESSION.max);
    expect(bonne(LE_COUT_MATIERE, "ce-que-dit-le-ratio", cas).texte).toBe("Le prix n'a pas suivi les denrées, et la cuisine a trop préparé.");
    const e = LE_COUT_MATIERE.etapes.find((x) => x.id === "les-denrees-perdues");
    if (e?.type !== "montants") throw new Error("les-denrees-perdues n'est pas une étape de montants");
    expect(e.explication(cas, etatVide)[0]).toContain("29,4 % pour la carte telle qu'elle est calculée, 4,1 points de plus pour le prix des denrées, et 1,7 point de plus");
    const synthese = LE_COUT_MATIERE.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre restaurant seront différents : la notion, elle, est la même.");
    expect(synthese.texte(cas).join(" ")).toContain("Au niveau de l'examen");
  });

  it("le laboratoire de la cuisine, refait à la main : le ratio dans la fourchette demande les deux leviers, et coûte de la marge", () => {
    const l = laboratoire(LE_COUT_MATIERE, "le-laboratoire-de-la-cuisine", cas);
    expect([TICKET_DU_LABORATOIRE, MARGE_DU_LABORATOIRE]).toEqual([
      { min: 30, max: 42, pas: 0.5 },
      { min: 0, max: 10, pas: 1 },
    ]);
    expect(l.depart).toEqual({ ticket: 34, marge: 5 });
    const joue = trimestre(3);
    const lire = (t: ReturnType<typeof trimestre>) => ({
      "Couverts demandés": t.demande,
      "Couverts préparés": t.prepares,
      "Couverts jetés": t.prepares - t.servis,
      "Chiffre d'affaires HT": t.ca,
      "Coût matière consommé": t.denrees,
      "Ratio coût matière": t.ratio,
      "Marge sur coûts variables": t.marge,
      "Écart de marge avec le trimestre joué": r2(t.marge - joue.marge),
    });
    expect(l.auDepart).toEqual(lire(joue));
    expect(joue.marge).toBe(104_284.4);
    // Les tickets du laboratoire, en préparant juste : le premier qui tient 32 % sans perdre de marge.
    const tickets = Array.from({ length: 25 }, (_, i) => 30 + i * 0.5);
    const reussit = (t: ReturnType<typeof trimestre>) => t.ratio <= 32 && t.marge >= joue.marge;
    const solution = tickets.find((p) => reussit(trimestre(3, p, 0)))!;
    expect(solution).toBe(36);
    expect(l.solution).toEqual({ ticket: 36, marge: 0 });
    const s = trimestre(3, 36, 0);
    expect(l.aLaSolution).toEqual(lire(s));
    expect([s.demande, s.ratio, s.marge]).toEqual([4944, 31.7, 106_790.4]);
    expect(l.reussi).toEqual([false, true]);
    // Il fallait les deux leviers : aucun ticket avec 5 % préparés en plus, aucune marge de préparation au ticket de 34 €.
    expect(tickets.some((p) => reussit(trimestre(3, p, 0.05)))).toBe(false);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some((k) => reussit(trimestre(3, 34, k / 100)))).toBe(false);
    // Le meilleur ticket en préparant juste : 32,50 €, à 35,1 %, hors de la fourchette.
    const meilleur = tickets.reduce((a, b) => (trimestre(3, b, 0).marge > trimestre(3, a, 0).marge ? b : a));
    expect([meilleur, trimestre(3, meilleur, 0).ratio, trimestre(3, meilleur, 0).marge]).toEqual([32.5, 35.1, 107_586.4]);
    expect(r2(trimestre(3, meilleur, 0).marge - s.marge)).toBe(796);
    expect(l.e.explication(cas, l.d.solution).join(" ")).toContain("Tenir la fourchette coûte ici 796 € de marge");
    // Le graphique, en quelques points : l'écart de marge à la marge de préparation choisie, et en préparant juste.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("ticket");
    const [aCetteMarge, juste] = g.courbes;
    for (const p of [30, 34, 38, 42]) {
      expect(aCetteMarge!.valeur({ ticket: p, marge: 5 }), `${p}`).toBe(r2(trimestre(3, p, 0.05).marge - joue.marge));
      expect(juste!.valeur({ ticket: p, marge: 5 }), `${p}`).toBe(r2(trimestre(3, p, 0).marge - joue.marge));
    }
    expect(juste!.valeur({ ticket: 34, marge: 5 })).toBe(3123.6);
    expect(bonne(LE_COUT_MATIERE, "la-prime-au-ratio", cas).texte).toBe("Elle pousserait à des choix qui coûtent de la marge");
  });

  it("le plat du jour, à rebours, refait à la main : 19,80 € TTC, un ratio de 28 %, 5 % de portions en plus", () => {
    expect(PLAT_DU_JOUR_TTC).toBe(19.8);
    const ht = r2(19.8 / 1.1);
    const servi = r2(ht * 0.28);
    const portion = r2(servi / 1.05);
    expect([ht, servi, portion]).toEqual([18, 5.04, 4.8]);
    expect(attendus(LE_COUT_MATIERE, "le-plat-du-jour", cas)).toEqual([ht, servi, portion]);
  });

  it("le cas : la carte montée et la cuisine juste, rejouées à la main, les clients que la carte peut perdre, et la meilleure façon", () => {
    const k = carteOuCuisine(cas);
    expect(k.trimestre).toBe(3);
    const prixMonte = r2(11.4 * 3.4);
    expect(k.prixMonte).toBe(prixMonte);
    expect(k.prixMonte).toBe(m.hausse.prixHt);
    const joue = trimestre(3);
    const carte = trimestre(3, prixMonte);
    const juste = trimestre(3, 34, 0);
    for (const [nom, x, y] of [["joué", joue, k.joue], ["carte", carte, k.carte], ["juste", juste, k.juste]] as const) {
      expect([y.servis, y.prepares, y.denrees, y.chiffreDAffaires, y.ratio, y.margeSurCoutsVariables], nom).toEqual([x.servis, x.prepares, x.denrees, x.ca, x.ratio, x.marge]);
    }
    // Au ticket monté, la demande baisse de (38,76 ÷ 34) ^ −1,8 ; préparer juste ne jette plus rien.
    expect([carte.servis, carte.prepares]).toEqual([4329, 4545]);
    expect(juste.prepares).toBe(juste.servis);
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "les-ratios", cas)).toEqual([carte.ratio, juste.ratio]);
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "les-ratios", cas)).toEqual([30.9, 33.5]);
    // À rebours : un couvert servi au ticket monté laisse 38,76 − 3 − 11,40 × 1,05 ; il en faut assez pour refaire la marge jouée.
    const parCouvert = r2(38.76 - 3 - r2(11.4 * 1.05));
    const aGarder = Math.ceil(joue.marge / parCouvert);
    expect([parCouvert, aGarder, joue.servis - aGarder]).toEqual([23.79, 4384, 1096]);
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "ce-que-la-carte-peut-perdre", cas)).toEqual([parCouvert, aGarder, joue.servis - aGarder]);
    expect(curseur(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "la-carte-au-curseur", cas)).toEqual({
      attendu: aGarder,
      bornes: [3200, 5480],
      droites: [r2(3200 * parCouvert), joue.marge, r2(5480 * parCouvert), joue.marge],
      lecture: {
        "Marge sur coûts variables, carte montée": r2(aGarder * parCouvert),
        "Marge sur coûts variables, trimestre joué": joue.marge,
        "Écart de marge": r2(r2(aGarder * parCouvert) - joue.marge),
      },
    });
    const attendu = [joue.servis - carte.servis, r2(carte.marge - joue.marge), r2(juste.marge - joue.marge)];
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "ce-que-ca-rapporte", cas)).toEqual(attendu);
    expect(attendu).toEqual([1151, -1292.36, 3123.6]);
    // Le croisement : la carte perd 1 151 clients, quand elle pouvait en perdre 1 096.
    expect(joue.servis - carte.servis).toBeGreaterThan(joue.servis - aGarder);
    // La carte montée a le meilleur ratio, mais rapporte moins que le trimestre joué ; préparer juste rapporte le plus.
    expect(carte.ratio).toBeLessThan(juste.ratio);
    expect(joue.marge).toBeGreaterThan(carte.marge);
    expect(juste.marge).toBeGreaterThan(joue.marge);
    expect(k.meilleure).toBe("juste");
    expect(bonne(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "reponse", cas).texte).toBe("Garder 34 € HT et préparer juste");
    const reponse = MONTER_LA_CARTE_OU_PREPARER_JUSTE.etapes.find((e) => e.id === "reponse");
    if (reponse?.type !== "choix") throw new Error("reponse n'est pas un choix");
    const carteRetour = reponse.options(cas, etatVide).find((o) => o.texte.startsWith("Monter"))!.retour;
    expect(carteRetour).toContain(`ne paient pas les ${(1151).toLocaleString("fr-FR")} clients perdus : la carte pouvait en perdre ${(1096).toLocaleString("fr-FR")}`);
    expect(carteRetour).not.toContain("Rien n'empêche");
  });

  it("chapitre et cas : des textes propres, et un cas qui tient ce qu'un cas dédié doit tenir", () => {
    textesPropres(LE_COUT_MATIERE, code);
    textesPropres(MONTER_LA_CARTE_OU_PREPARER_JUSTE, code);
    casDedie(MONTER_LA_CARTE_OU_PREPARER_JUSTE, LE_COUT_MATIERE);
  });
});

describe("le taux d'occupation, le prix moyen et le revenu par chambre, à l'hôtel du monde du cours", () => {
  const cas = casDeLEntreprise("hotel");
  const f = L_ESCALE;
  const o = occupation(cas);
  /**
   * L'année de l'hôtel, refaite à la main sur la fiche, comme la garde du pilote : toutes les
   * chambres en vente, la demande de chaque clientèle au prix p vaut sa demande au prix de l'année
   * × (p ÷ 88) ^ −1,5, à l'unité ; l'hôtel vend le plus petit de la demande et des chambres
   * disponibles (60 chambres × 90 nuits). Le coût d'une nuitée occupée est celui de la fiche, sauf
   * au laboratoire, qui le fait varier.
   */
  const dispo = f.chambres * f.joursParTrimestre;
  const trimestreAu = (k: number, prix: number, cv = f.coutVariableParNuitee) => {
    const demande = f.clienteles.reduce((s, g) => s + Math.round(g.demande[k]! * (prix / f.prixDeLAnnee) ** f.elasticite), 0);
    const v = Math.min(demande, dispo);
    const ca = r2(v * prix);
    return { demande, v, ca, refus: demande - v, resultat: r2(ca - v * cv - f.chargesFixesParTrimestre) };
  };
  const anneeAu = (prix: number) => {
    const ts = [0, 1, 2, 3].map((k) => trimestreAu(k, prix));
    const v = ts.reduce((s, t) => s + t.v, 0);
    const ca = r2(ts.reduce((s, t) => s + t.ca, 0));
    return { ts, v, ca, occupation: r1((v / (4 * dispo)) * 100), prixMoyen: r2(ca / v), revpar: r2(ca / (4 * dispo)), resultat: r2(ts.reduce((s, t) => s + t.resultat, 0)) };
  };
  const tarif = anneeAu(88);
  const texteDe = (ch: Chapitre, id: string) => {
    const e = ch.etapes.find((x) => x.id === id);
    if (e?.type !== "lecture") throw new Error(`${ch.code} / ${id} n'est pas une lecture`);
    return e.texte(cas).join(" ");
  };

  it("la fiche est celle de L'ESCALE, et son année au prix de l'année est celle du pilote", () => {
    expect(HOTELS).toEqual(["hotel"]);
    expect(f.entreprise).toBe(cas.entreprise);
    expect([f.chambres, f.joursParTrimestre, f.prixDeLAnnee, f.coutVariableParNuitee, f.chargesFixesParTrimestre, f.elasticite]).toEqual([60, 90, 88, 21, 210_000, -1.5]);
    expect([o.chambres, o.nuits, o.prix]).toEqual([60, 90, 88]);
    expect(dispo).toBe(5400);
    for (const x of o.trimestres) expect(x.disponibles).toBe(dispo);
    // L'année du chapitre « le prix selon la saison » au prix unique : même demande, même résultat.
    expect(tarif.ts.map((t) => t.demande)).toEqual([3400, 5000, 6400, 3900]);
    expect(tarif.resultat).toBe(345_900);
    expect(o.trimestres.map((x) => [x.vendues, x.chiffreDAffaires])).toEqual(tarif.ts.map((t) => [t.v, t.ca]));
    expect(o.trimestres.map((x) => x.vendues)).toEqual([3400, 5000, 5400, 3900]);
    // Au 3e trimestre, l'hôtel est complet et refuse des clients : le taux d'occupation ne le voit pas.
    expect(o.refus).toEqual({ trimestre: 2, nuitees: 6400 - dispo });
    expect(o.refus.nuitees).toBe(1000);
  });

  it("les champs du chapitre attendent ce que la fiche donne, recomposé à la main", () => {
    const t = tarif.ts;
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "occupation", cas)).toEqual(t.map((x) => r1((x.v / dispo) * 100)));
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "occupation", cas)).toEqual([63, 92.6, 100, 72.2]);
    expect(o.meilleur).toBe(2);
    expect(o.plusFaible).toBe(0);
    // Le prix est le même toute l'année : le prix moyen de chaque trimestre est le prix de la fiche.
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "prix-moyen", cas)).toEqual([2, 0].map((k) => r2(t[k]!.ca / t[k]!.v)));
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "prix-moyen", cas)).toEqual([88, 88]);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "revpar", cas)).toEqual(t.map((x) => r2(x.ca / dispo)));
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "revpar", cas)).toEqual([55.41, 81.48, 88, 63.56]);
    // RevPAR = occupation × prix moyen, à l'arrondi du taux près.
    for (const x of o.trimestres) expect(Math.abs(x.revpar - (x.occupation / 100) * x.prixMoyen)).toBeLessThanOrEqual(0.05);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "l-annee", cas)).toEqual([tarif.occupation, tarif.prixMoyen, tarif.revpar]);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "l-annee", cas)).toEqual([81.9, 88, 72.11]);
  });

  it("le premier cycle : le pari, puis les chambres que le concurrent plus cher devait vendre, refaites à la main", () => {
    const terminus = f.concurrents.find((x) => x.nom === "Le Grand Hôtel Terminus")!;
    expect(bonne(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "predire-le-revpar", cas).texte).toBe("Environ 48 % : son prix compense");
    // 114,26 × n ÷ 5 400 ≥ 299 200 ÷ 5 400 dès n ≥ 299 200 ÷ 114,26 = 2 618,6.
    const n = Math.ceil(299_200 / terminus.prix[0]);
    expect([n, r1((n / dispo) * 100)]).toEqual([2619, 48.5]);
    expect(CHAMBRES_DU_CONCURRENT.min).toBe(1000);
    expect(curseur(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "le-terminus-au-curseur", cas)).toEqual({
      attendu: n,
      bornes: [1000, dispo],
      droites: [r2((114.26 * 1000) / dispo), r2(299_200 / dispo), 114.26, r2(299_200 / dispo)],
      lecture: {
        "Chiffre d'affaires du Grand Hôtel Terminus": r2(114.26 * n),
        "RevPAR du Grand Hôtel Terminus": r2((114.26 * n) / dispo),
        "RevPAR de L'ESCALE": 55.41,
        "Écart de RevPAR": r2(r2((114.26 * n) / dispo) - 55.41),
      },
    });
  });

  it("le concurrent du trimestre comparé loue plus cher, remplit moins et rapporte moins par chambre disponible", () => {
    const k = o.comparaison;
    expect(k.trimestre).toBe(0);
    expect(k.rival.nom).toBe("Le Grand Hôtel Terminus");
    expect(k.autre.nom).toBe("Le Comptoir");
    const terminus = f.concurrents.find((x) => x.nom === "Le Grand Hôtel Terminus")!;
    const comptoir = f.concurrents.find((x) => x.nom === "Le Comptoir")!;
    // Ses chiffres, refaits à la main : chambres vendues × prix, sur 60 chambres × 90 nuits.
    const ca = r2(terminus.vendues[0] * terminus.prix[0]);
    expect(terminus.chambres * f.joursParTrimestre).toBe(dispo);
    expect(ca).toBe(219_950.5);
    expect([k.rival.disponibles, k.rival.vendues, k.rival.chiffreDAffaires]).toEqual([dispo, 1925, ca]);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "face-au-concurrent", cas)).toEqual([r2(ca / 1925), r2(ca / dispo)]);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "face-au-concurrent", cas)).toEqual([114.26, 40.73]);
    expect(k.rival.occupation).toBe(r1((1925 / dispo) * 100));
    expect(k.rival.prixMoyen).toBeGreaterThan(88);
    expect(k.rival.occupation).toBeLessThan(r1((3400 / dispo) * 100));
    expect(k.rival.revpar).toBeLessThan(r2(tarif.ts[0]!.ca / dispo));
    expect([k.autre.vendues, k.autre.chiffreDAffaires]).toEqual([comptoir.vendues[0], r2(comptoir.vendues[0] * comptoir.prix[0])]);
    expect(bonne(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "qui-vend-le-mieux", cas).texte).toBe("L'ESCALE : chaque chambre disponible lui a rapporté plus.");
    expect(bonne(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "pourquoi-le-revpar", cas).texte).toBe("Il compte les chambres remplies et le prix de chacune.");
    // Le texte dit à l'élève ce que la simulation suppose, et la synthèse finit sur l'arène.
    expect(texteDe(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "intro")).toContain("simulation du cours");
    expect(texteDe(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "synthese")).toMatch(/Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même\.$/);
    expect(texteDe(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "synthese")).toContain("Au niveau de l'examen");
  });

  it("le second cycle : la promotion de 10 % au trimestre creux, ses deux seuils, refaits à la main", () => {
    expect(BAISSE_DE_LA_PROMOTION).toBe(0.1);
    expect(bonne(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "predire-la-promotion", cas).texte).toBe("Plus : chaque chambre louée coûte aussi 21 €");
    const prix = r2(88 * 0.9);
    const marge = r2((88 - 21) * 3400);
    const parChambre = r2(prix - 21);
    const pourLeRevpar = Math.ceil(299_200 / prix);
    const pourLaMarge = Math.ceil(marge / parChambre);
    expect([prix, marge, parChambre, pourLeRevpar, pourLaMarge]).toEqual([79.2, 227_800, 58.2, 3778, 3915]);
    expect(curseur(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "la-promotion-au-curseur", cas)).toEqual({
      attendu: pourLaMarge,
      bornes: [3000, dispo],
      droites: [r2(58.2 * 3000), marge, r2(58.2 * dispo), marge],
      lecture: {
        "RevPAR à 79,20 €": r2((79.2 * pourLaMarge) / dispo),
        "RevPAR à 88 €": 55.41,
        "Marge sur coûts variables à 79,20 €": r2(58.2 * pourLaMarge),
        "Marge sur coûts variables à 88 €": marge,
        "Écart de marge": r2(r2(58.2 * pourLaMarge) - marge),
      },
    });
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "deux-seuils", cas)).toEqual([pourLeRevpar, parChambre, pourLaMarge]);
    // La simulation vend 3 982 nuitées à 79,20 € : au-delà des deux seuils, la promotion paie.
    const promo = trimestreAu(0, prix);
    expect([promo.v, r2(promo.resultat - tarif.ts[0]!.resultat)]).toEqual([3982, 3952.4]);
    expect(o.promotion.ecartDeResultat).toBe(3952.4);
  });

  it("le laboratoire du RevPAR, refait à la main : un prix qui remplit l'hôtel monte le RevPAR et fait baisser le résultat", () => {
    const l = laboratoire(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "le-laboratoire-du-revpar", cas);
    expect([PRIX_DU_LABORATOIRE, COUT_DU_LABORATOIRE]).toEqual([
      { min: 50, max: 100, pas: 0.1 },
      { min: 15, max: 30, pas: 1 },
    ]);
    expect(l.depart).toEqual({ prix: 88, cout: 21 });
    const lire = (prix: number, cv: number) => {
      const t = trimestreAu(0, prix, cv);
      const d = trimestreAu(0, 88, 21);
      return {
        "Nuitées demandées": t.demande,
        "Nuitées vendues": t.v,
        "Taux d'occupation": r1((t.v / dispo) * 100),
        "Prix moyen": r2(t.ca / t.v),
        RevPAR: r2(t.ca / dispo),
        "Résultat du trimestre": t.resultat,
        "Effet sur le résultat du trimestre": r2(t.resultat - d.resultat),
      };
    };
    expect(l.auDepart).toEqual(lire(88, 21));
    // Le défi : au même coût, un RevPAR au-dessus de celui de 88 € et un résultat en dessous. Le plus haut prix entier qui le relève : 63 €.
    const piege = (p: number, cv: number) => r2(trimestreAu(0, p, cv).ca / dispo) > r2(trimestreAu(0, 88, cv).ca / dispo) && trimestreAu(0, p, cv).resultat < trimestreAu(0, 88, cv).resultat;
    const solution = Array.from({ length: 51 }, (_, i) => 100 - i).find((p) => piege(p, 21));
    expect(solution).toBe(63);
    expect(l.solution).toEqual({ prix: 63, cout: 21 });
    expect(l.aLaSolution).toEqual(lire(63, 21));
    expect([trimestreAu(0, 63).v, r2(trimestreAu(0, 63).ca / dispo), trimestreAu(0, 63).resultat]).toEqual([5400, 63, 16_800]);
    expect(l.reussi).toEqual([false, true]);
    // À 64 €, le RevPAR monte encore, mais le résultat aussi : ce n'est plus un piège.
    expect(piege(64, 21)).toBe(false);
    // Un coût plus haut élargit le piège : à 30 €, 66 € en est un, et ne l'est pas à 21 €.
    expect([piege(66, 30), piege(66, 21)]).toEqual([true, false]);
    // Le graphique, en quelques points : le RevPAR et la marge par chambre disponible.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("prix");
    const [revpar, marge] = g.courbes;
    for (const p of [50, 64.6, 75, 88, 100]) {
      const t = trimestreAu(0, p);
      expect(revpar!.valeur({ prix: p, cout: 21 }), `${p}`).toBe(r2(t.ca / dispo));
      expect(marge!.valeur({ prix: p, cout: 21 }), `${p}`).toBe(r2((t.ca - t.v * 21) / dispo));
    }
    expect([revpar!.valeur({ prix: 64.6, cout: 21 }), marge!.valeur({ prix: 64.6, cout: 21 })]).toEqual([64.6, 43.6]);
    expect(bonne(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "la-limite-du-revpar", cas).texte).toBe("Le RevPAR ne voit pas ce que coûte une chambre occupée");
  });

  it("les étapes d'expert, refaites à la main : l'écart de RevPAR décomposé, le concurrent à rebours", () => {
    // Effet de l'occupation au prix moyen de L'ESCALE, effet du prix sur l'occupation du Terminus.
    const occupationSeule = r2(((1925 - 3400) * 88) / dispo);
    const prixSeul = r2(((114.26 - 88) * 1925) / dispo);
    const ecart = r2(r2(219_950.5 / dispo) - r2(299_200 / dispo));
    expect([occupationSeule, prixSeul, ecart]).toEqual([-24.04, 9.36, -14.68]);
    expect(r2(occupationSeule + prixSeul)).toBe(ecart);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "decomposer-l-ecart", cas)).toEqual([occupationSeule, prixSeul, ecart]);
    // Ce que publie l'observatoire pour Le Comptoir : son RevPAR au centime, son taux au dixième.
    const comptoir = f.concurrents.find((x) => x.nom === "Le Comptoir")!;
    const revpar = r2((comptoir.vendues[0] * comptoir.prix[0]) / dispo);
    const taux = r1((comptoir.vendues[0] / dispo) * 100);
    expect([revpar, taux]).toEqual([67.63, 87.3]);
    const aRebours = [r2(revpar / (taux / 100)), Math.round((taux / 100) * dispo), r2(revpar * dispo)];
    expect(aRebours).toEqual([77.47, 4714, 365_202]);
    expect(attendus(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "a-rebours", cas)).toEqual(aRebours);
    // Les arrondis des chiffres publiés écartent à peine du vrai : 77,44 €, 4 716 chambres, 365 207,04 €.
    expect(Math.abs(aRebours[0]! - comptoir.prix[0])).toBeLessThanOrEqual(0.05);
    expect(Math.abs(aRebours[1]! - comptoir.vendues[0])).toBeLessThanOrEqual(3);
  });

  it("le cas : l'année rejouée au prix du Comptoir remplit plus mais rapporte moins par chambre, et la marge demande plus de nuitées encore", () => {
    const a = alignement(cas);
    const comptoir = f.concurrents.find((x) => x.nom === "Le Comptoir")!;
    // Le concurrent qui remplit mieux que L'ESCALE sur l'année, moins cher.
    expect(a.rival).toBe("Le Comptoir");
    const vComptoir = comptoir.vendues.reduce((s, x) => s + x, 0);
    expect(a.leRival.occupation).toBe(r1((vComptoir / (4 * dispo)) * 100));
    expect(a.leRival.occupation).toBe(96.8);
    expect(a.prixDuConcurrent).toBe(77.44);
    expect(comptoir.prix).toEqual([77.44, 77.44, 77.44, 77.44]);
    const bas = anneeAu(77.44);
    expect(bas.ts.map((t) => t.v)).toEqual([4119, 5400, 5400, 4724]);
    expect(a.aligne.annee.vendues).toBe(bas.v);
    expect(a.aligne.annee.chiffreDAffaires).toBe(bas.ca);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "les-deux-prix", cas)).toEqual([tarif.occupation, tarif.revpar, bas.occupation, bas.revpar]);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "les-deux-prix", cas)).toEqual([81.9, 72.11, 90.9, 70.42]);
    // Le curseur et le croisement : les nuitées de l'année qui gardent le RevPAR, puis la marge, à 77,44 €.
    const pourLeRevpar = Math.ceil(tarif.ca / 77.44);
    const marge = r2(tarif.ca - tarif.v * 21);
    const pourLaMarge = Math.ceil(marge / r2(77.44 - 21));
    expect([pourLeRevpar, marge, pourLaMarge, pourLaMarge - bas.v]).toEqual([20_114, 1_185_900, 21_012, 1369]);
    expect(curseur(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "le-revpar-au-curseur", cas)).toEqual({
      attendu: pourLeRevpar,
      bornes: [17_000, 21_600],
      droites: [r2((77.44 * 17_000) / 21_600), r2(tarif.ca / 21_600), 77.44, r2(tarif.ca / 21_600)],
      lecture: {
        "RevPAR de l'année à 77,44 €": r2((77.44 * pourLeRevpar) / 21_600),
        "RevPAR de l'année à 88 €": 72.11,
        "Marge sur coûts variables à 77,44 €": r2(56.44 * pourLeRevpar),
        "Marge sur coûts variables à 88 €": marge,
        "Écart de RevPAR": r2(r2((77.44 * pourLeRevpar) / 21_600) - 72.11),
      },
    });
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "les-deux-seuils", cas)).toEqual([pourLeRevpar, pourLaMarge, pourLaMarge - bas.v]);
    expect(bas.v).toBeLessThan(pourLeRevpar);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "l-ecart", cas)).toEqual([bas.v - tarif.v, r2(tarif.ca - bas.ca)]);
    expect(attendus(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "l-ecart", cas)).toEqual([1943, 36_446.08]);
    // Le prix plus bas paie au 1er et au 4e trimestre, où il restait des chambres vides ; au 2e et au
    // 3e, l'hôtel est complet à ce prix et refuse encore des clients.
    expect(a.hausse).toEqual([0, 3]);
    expect(a.baisse).toEqual([1, 2]);
    expect(a.refuseesAuPrixBas).toEqual(bas.ts.map((t) => t.refus));
    expect(a.refuseesAuPrixBas).toEqual([0, 657, 2353, 0]);
    // LE CRITÈRE EST UN SEUL : le RevPAR de l'année baisse, et le résultat de l'année aussi.
    expect(bas.occupation).toBeGreaterThan(tarif.occupation);
    expect(bas.revpar).toBeLessThan(tarif.revpar);
    expect(bas.resultat).toBeLessThan(tarif.resultat);
    expect(a.ecartDeResultat).toBe(r2(tarif.resultat - bas.resultat));
    expect(a.ecartDeResultat).toBe(77_249.08);
    expect(a.verdict).toBe("garder");
    const reponse = bonne(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "reponse", cas);
    expect(reponse.texte).toBe("Garder 88 € : le RevPAR de l'année baisserait");
    // La question et la réponse disent le même critère, et le résultat le confirme.
    expect(texteDe(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "la-question")).toContain("Jugez-en au revenu par chambre disponible de l'année");
    const etape = S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT.etapes.find((e) => e.id === "reponse");
    if (etape?.type !== "choix") throw new Error("reponse n'est pas un choix");
    expect(etape.question(cas, etatVide)).toContain("revenu par chambre disponible de l'année");
    expect(reponse.retour).toContain("le RevPAR de l'année passerait de 72,11 € à 70,42 €");
    expect(reponse.retour).toContain(`le résultat de l'année baisserait de ${(77_249.08).toLocaleString("fr-FR")} €`);
  });

  it("chapitre et cas : des textes propres, et un cas qui tient ce qu'un cas dédié doit tenir", () => {
    textesPropres(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "hotel");
    textesPropres(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "hotel");
    casDedie(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, OCCUPATION_ET_REVENU_PAR_CHAMBRE);
  });
});
