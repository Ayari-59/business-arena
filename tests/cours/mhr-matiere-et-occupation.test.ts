import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { PROGRAMME } from "../../src/config/cours/registre";
import {
  CUISINES,
  FOURCHETTE_DE_LA_PROFESSION,
  LE_COUT_MATIERE,
  coutMatiere,
} from "../../src/config/cours/chapitres/le-cout-matiere";
import {
  HOTELS,
  OCCUPATION_ET_REVENU_PAR_CHAMBRE,
  occupation,
} from "../../src/config/cours/chapitres/occupation-et-revenu-par-chambre";
import { MONTER_LA_CARTE_OU_PREPARER_JUSTE, carteOuCuisine } from "../../src/config/cours/situations/par-chapitre/monter-la-carte-ou-preparer-juste";
import { MARGE_DE_PREPARATION } from "../../src/config/cours/monde/cuisine";
import { LA_TABLE_D_AUGUSTIN } from "../../src/config/cours/monde/la-table-d-augustin";
import { S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, alignement } from "../../src/config/cours/situations/par-chapitre/s-aligner-sur-le-prix-du-concurrent";
import { L_ESCALE } from "../../src/config/cours/monde/l-escale";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU PALIER 2 DU BTS MHR, ET LEURS CAS PRATIQUES.
 *
 * « Le coût matière et le prix d'un plat » (le bistrot) et « Le taux d'occupation, le prix moyen
 * et le revenu par chambre » (l'hôtel) prennent leurs chiffres dans l'année du cours ; leurs cas
 * la rejouent avec une décision changée. Ces gardes recomposent les chiffres par un autre chemin
 * (le scénario, le moteur, les indicateurs que l'arène affiche, un rejeu sous une autre clé),
 * vérifient les valeurs attendues des champs, et que les textes se lisent : rien d'indéfini, pas
 * de tiret au milieu d'une phrase, une seule bonne réponse, aucune option qui en contient une
 * autre, des libellés uniques, et des accords justes avec « couverts » et « chambres ».
 */

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [AEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/[A-ZÉ] [A-ZÉ] [A-ZÉ]/);
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+ −/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculin);
      for (const f of fautes) expect(x, `${e.id} : ${x}`).not.toMatch(f);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      for (const o of options) for (const p of options) if (o !== p) expect(p.texte.includes(o.texte), `${e.id} : ${o.texte}`).toBe(false);
    }
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, dans l'ordre. */
function attendus(ch: Chapitre, id: string, cas: Cas): number[] {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${ch.code} / ${id} n'est pas une étape de montants`);
  return e.champs(cas, { soldes: {} }).map((c) => c.attendu);
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
      const options = e.options(cas, { soldes: {} });
      const juste = options.find((o) => o.juste)!;
      const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
      expect(juste.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
    }
  }
}

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
  const bonne = (ch: Chapitre, id: string) => {
    const e = ch.etapes.find((x) => x.id === id)!;
    if (e.type !== "choix") throw new Error(`${ch.code} / ${id} n'est pas un choix`);
    return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
  };

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
    expect(bonne(LE_COUT_MATIERE, "ce-qui-entre")).toBe("Les denrées seules, hors taxes : 10 €");
    expect(m.matiereTtc).toBe(r2(10 * 1.055));
    const nouveau = r2(10 * 1.14);
    expect(attendus(LE_COUT_MATIERE, "la-hausse", cas)).toEqual([nouveau, r1((nouveau / 34) * 100)]);
    expect(attendus(LE_COUT_MATIERE, "la-hausse", cas)).toEqual([11.4, 33.5]);
    expect(m.hausse.trimestres).toEqual([3, 4]);
    const ht = r2(nouveau * coefficient);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([ht, r2(ht * 1.1)]);
    expect(attendus(LE_COUT_MATIERE, "le-prix-du-plat", cas)).toEqual([38.76, 42.64]);
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
    expect(bonne(LE_COUT_MATIERE, "ce-que-dit-le-ratio")).toBe("Le prix n'a pas suivi les denrées, et la cuisine a trop préparé.");
    const e = LE_COUT_MATIERE.etapes.find((x) => x.id === "les-denrees-perdues");
    if (e?.type !== "montants") throw new Error("les-denrees-perdues n'est pas une étape de montants");
    expect(e.explication(cas, { soldes: {} })[0]).toContain("29,4 % pour la carte telle qu'elle est calculée, 4,1 points de plus pour le prix des denrées, et 1,7 point de plus");
    const synthese = LE_COUT_MATIERE.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre restaurant seront différents : la notion, elle, est la même.");
  });

  it("le cas : la carte montée et la cuisine juste, rejouées à la main, et la meilleure façon", () => {
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
    const attendu = [joue.servis - carte.servis, r2(carte.marge - joue.marge), r2(juste.marge - joue.marge)];
    expect(attendus(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "ce-que-ca-rapporte", cas)).toEqual(attendu);
    expect(attendu).toEqual([1151, -1292.36, 3123.6]);
    // La carte montée a le meilleur ratio, mais rapporte moins que le trimestre joué ; préparer juste rapporte le plus.
    expect(carte.ratio).toBeLessThan(juste.ratio);
    expect(joue.marge).toBeGreaterThan(carte.marge);
    expect(juste.marge).toBeGreaterThan(joue.marge);
    expect(k.meilleure).toBe("juste");
    expect(bonne(MONTER_LA_CARTE_OU_PREPARER_JUSTE, "reponse")).toBe("Garder 34 € HT et préparer juste");
    const reponse = MONTER_LA_CARTE_OU_PREPARER_JUSTE.etapes.find((e) => e.id === "reponse");
    if (reponse?.type !== "choix") throw new Error("reponse n'est pas un choix");
    const carteRetour = reponse.options(cas, { soldes: {} }).find((o) => o.texte.startsWith("Monter"))!.retour;
    expect(carteRetour).toContain(`ne paient pas les ${(1151).toLocaleString("fr-FR")} clients perdus`);
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
   * disponibles (60 chambres × 90 nuits).
   */
  const dispo = f.chambres * f.joursParTrimestre;
  const trimestreAu = (k: number, prix: number) => {
    const demande = f.clienteles.reduce((s, g) => s + Math.round(g.demande[k]! * (prix / f.prixDeLAnnee) ** f.elasticite), 0);
    const v = Math.min(demande, dispo);
    const ca = r2(v * prix);
    return { demande, v, ca, refus: demande - v, resultat: r2(ca - v * f.coutVariableParNuitee - f.chargesFixesParTrimestre) };
  };
  const anneeAu = (prix: number) => {
    const ts = [0, 1, 2, 3].map((k) => trimestreAu(k, prix));
    const v = ts.reduce((s, t) => s + t.v, 0);
    const ca = r2(ts.reduce((s, t) => s + t.ca, 0));
    return { ts, v, ca, occupation: r1((v / (4 * dispo)) * 100), prixMoyen: r2(ca / v), revpar: r2(ca / (4 * dispo)), resultat: r2(ts.reduce((s, t) => s + t.resultat, 0)) };
  };
  const tarif = anneeAu(88);
  const juste = (ch: Chapitre, id: string) => {
    const e = ch.etapes.find((x) => x.id === id);
    if (e?.type !== "choix") throw new Error(`${ch.code} / ${id} n'est pas un choix`);
    return e.options(cas, { soldes: {} }).find((x) => x.juste)!;
  };
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
    expect(juste(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "qui-vend-le-mieux").texte).toBe("L'ESCALE : chaque chambre disponible lui a rapporté plus.");
    expect(juste(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "pourquoi-le-revpar").texte).toBe("Il compte les chambres remplies et le prix de chacune.");
    // Le texte dit à l'élève ce que la simulation suppose, et la synthèse finit sur l'arène.
    expect(texteDe(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "intro")).toContain("simulation du cours");
    expect(texteDe(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "synthese")).toMatch(/Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même\.$/);
  });

  it("le cas : l'année rejouée au prix du Comptoir remplit plus mais rapporte moins par chambre, et le résultat dit pareil", () => {
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
    const reponse = juste(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "reponse");
    expect(reponse.texte).toBe("Garder 88 € : le RevPAR de l'année baisserait");
    // La question et la réponse disent le même critère, et le résultat le confirme.
    expect(texteDe(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "la-question")).toContain("Jugez-en au revenu par chambre disponible de l'année");
    const etape = S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT.etapes.find((e) => e.id === "reponse");
    if (etape?.type !== "choix") throw new Error("reponse n'est pas un choix");
    expect(etape.question(cas, { soldes: {} })).toContain("revenu par chambre disponible de l'année");
    expect(reponse.retour).toContain("le RevPAR de l'année passerait de 72,11 € à 70,42 €");
    expect(reponse.retour).toContain(`le résultat de l'année baisserait de ${(77_249.08).toLocaleString("fr-FR")} €`);
  });

  it("chapitre et cas : des textes propres, et un cas qui tient ce qu'un cas dédié doit tenir", () => {
    textesPropres(OCCUPATION_ET_REVENU_PAR_CHAMBRE, "hotel");
    textesPropres(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, "hotel");
    casDedie(S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT, OCCUPATION_ET_REVENU_PAR_CHAMBRE);
  });
});
