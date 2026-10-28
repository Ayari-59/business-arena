import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DU_SERVICE,
  LA_PRODUCTIVITE_DU_SERVICE,
  PART_DU_PRIX_POUR_LE_PERSONNEL,
  SALARIES_EN_PLUS,
  productiviteDuService,
} from "../../src/config/cours/chapitres/la-productivite-du-service";
import {
  BAISSE_EN_BASSE_SAISON,
  ENTREPRISES_DE_LA_SAISON,
  HAUSSE_EN_HAUTE_SAISON,
  LE_PRIX_SELON_LA_SAISON,
  PETITE_BAISSE,
  PRIX_DU_LABORATOIRE,
  prixSelonLaSaison,
  saisonDuMarche,
} from "../../src/config/cours/chapitres/le-prix-selon-la-saison";
import { anneeDeLHotel } from "../../src/config/cours/monde/hotel";
import { L_ESCALE } from "../../src/config/cours/monde/l-escale";
import { LA_TABLE_D_AUGUSTIN } from "../../src/config/cours/monde/la-table-d-augustin";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import { LE_COUT_DU_TRIMESTRE_CREUX, coutDuTrimestreCreux } from "../../src/config/cours/situations/par-chapitre/le-cout-du-trimestre-creux";
import {
  PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON,
  plusCherAuPlusFort,
} from "../../src/config/cours/situations/par-chapitre/plus-cher-au-plus-fort-de-la-saison";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeCurseur, EtapeMontants, EtapeSimulation, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU BTS MHR AU PALIER 3, ET LEURS CAS : LA PRODUCTIVITÉ DU SERVICE, LE PRIX
 * SELON LA SAISON, DANS LE MONDE DU COURS.
 *
 * La productivité : l'année du service (monde/service.ts), trimestre par trimestre, au bistrot et à
 * l'hôtel, refaite à la main sur leurs fiches. Le prix selon la saison : la saisonnalité de la fiche de
 * l'hôtel, puis l'année rejouée au prix de la saison, au prix du remplissage et aux quatre prix du
 * laboratoire, refaite à la main par le modèle de demande de la fiche (élasticité, capacité). Ces
 * gardes ne passent jamais par les fonctions des chapitres pour obtenir un attendu : chaque champ,
 * chaque curseur (l'attendu, ses droites aux deux bornes, sa lecture à l'attendu), chaque laboratoire
 * (sa lecture au départ et à la solution, son défi, ses courbes en quelques points), les variantes et
 * les calculs à rebours sont refaits ici ; les verdicts sont épinglés ; et les textes se lisent : rien
 * d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions faites, une seule
 * bonne réponse, aucune option qui en contient une autre, des libellés uniques, des notions qui
 * existent, des accords avec les unités féminines.
 */

const etatVide: EtatDuCours = { soldes: {} };

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(cas);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-|\s$/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\bà Le |\bde Le |\bce que ce que\b/);
      // Pas de capitales espacées, pas de nombre en toutes lettres devant ce qui se compte.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (clientèles?|trimestres?|salariés?|chambres?|nuitées?|couverts?)\b/i);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
    }
    if (e.type === "choix") {
      const options = e.options(cas, etat);
      expect(options.filter((o) => o.juste), e.id).toHaveLength(1);
      expect(new Set(options.map((o) => o.texte)).size, e.id).toBe(options.length);
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        // L'élève tape un montant au centime, un pourcentage au dixième : l'attendu aussi.
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, etatVide);
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
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
    droites: [d.produit(min), d.cout(min), d.produit(k.max), d.cout(k.max)].map(centime),
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
  return { e, d, leviers: e.leviers(cas), depart, solution: { ...d.solution }, auDepart: lire(depart), aLaSolution: lire({ ...d.solution }), reussi: [d.atteint(depart), d.atteint(d.solution)] };
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

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const centime = (x: number) => Math.round(x * 100) / 100;
const dixieme = (x: number) => Math.round(x * 10) / 10;

const BLOC_3 = "BTS MHR Bloc 3 · Management de la production de services en hôtellerie restauration";
const BLOC_2 = "BTS MHR Bloc 2 · Mercatique des services en hôtellerie restauration";

describe("les deux chapitres et leurs cas, dans le parcours du BTS MHR", () => {
  it("portent les titres du programme, au palier 3, et le bloc du référentiel du BTS MHR qu'ils travaillent", () => {
    const paires: [Chapitre, string, string, string][] = [
      [LA_PRODUCTIVITE_DU_SERVICE, BLOC_3, "la-productivite-du-service", "La productivité du service : couverts et chambres par salarié"],
      [LE_PRIX_SELON_LA_SAISON, BLOC_2, "le-prix-selon-la-saison", "Remplir l'hôtel : le prix selon la saison"],
    ];
    for (const [ch, bloc, code, titre] of paires) {
      expect(ch.code).toBe(code);
      expect(ch.titre).toBe(titre);
      expect(PROGRAMME.mhr[3], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("mhr");
      expect(ch.palier).toBe(3);
      expect(ch.blocs).toEqual([bloc]);
      expect(ch.libre).toBe(false);
      // Le bloc porte le préfixe du BTS MHR, et désigne une entrée du texte, une seule.
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("bts-mhr");
      expect(blocOfficiel(bloc, "bts-mhr"), bloc).toBe(bloc.replace("BTS MHR ", ""));
      // Un code neuf, qu'aucun chapitre du registre ni aucun cas ne porte déjà.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
      expect(SITUATIONS.some((x) => x.code === ch.code), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "mhr")!.formation).toBe("bts-mhr");
    expect(LA_PRODUCTIVITE_DU_SERVICE.entreprises!.codes).toEqual(["bistrot", "hotel"]);
    expect(LE_PRIX_SELON_LA_SAISON.entreprises!.codes).toEqual(["hotel"]);
  });

  it("les trois temps : deux cycles pari puis curseur, un laboratoire, au moins deux étapes d'expert", () => {
    lesTroisTemps(
      LA_PRODUCTIVITE_DU_SERVICE,
      ["predire-le-cout", "predire-l-equipe"],
      ["remplir-le-creux-au-curseur", "l-equipe-au-curseur"],
      "le-laboratoire-de-l-equipe",
      ["l-equipe-du-creux", "une-equipe-de-plus", "juger-l-equipe"],
    );
    lesTroisTemps(
      LE_PRIX_SELON_LA_SAISON,
      ["predire-la-baisse", "predire-la-hausse"],
      ["la-baisse-au-curseur", "la-hausse-au-curseur"],
      "le-laboratoire-des-quatre-prix",
      ["le-prix-qui-remplit-juste", "une-petite-baisse", "la-regle-des-15-pour-cent"],
    );
    // La formule vient après l'expérience : chaque curseur précède l'étape de montants qui la fait calculer.
    const avant = (ch: Chapitre, a: string, b: string) => expect(ch.etapes.findIndex((e) => e.id === a), `${a} avant ${b}`).toBeLessThan(ch.etapes.findIndex((e) => e.id === b));
    avant(LA_PRODUCTIVITE_DU_SERVICE, "remplir-le-creux-au-curseur", "ecart");
    avant(LA_PRODUCTIVITE_DU_SERVICE, "l-equipe-au-curseur", "l-equipe-du-creux");
    avant(LE_PRIX_SELON_LA_SAISON, "la-baisse-au-curseur", "ce-qu-une-baisse-doit-vendre");
    avant(LE_PRIX_SELON_LA_SAISON, "la-hausse-au-curseur", "ce-qu-une-hausse-peut-perdre");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_COUT_DU_TRIMESTRE_CREUX, LA_PRODUCTIVITE_DU_SERVICE],
      [PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, LE_PRIX_SELON_LA_SAISON],
    ];
    for (const [s, ch] of paires) {
      expect(s.reprend, s.code).toEqual([ch.code]);
      expect(s.palier, s.code).toBe(ch.palier);
      expect(s.parcours, s.code).toBe(ch.parcours);
      expect(s.entreprises?.codes, s.code).toEqual(ch.entreprises?.codes);
      expect(s.libre, s.code).toBe(false);
      expect(s.blocs, s.code).toEqual([]);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture"), s.code).toHaveLength(0);
      expect(s.etapes.at(-1)!.type, s.code).toBe("choix");
      expect(s.code, s.code).not.toBe(ch.code);
      expect(CHAPITRES.some((x) => x.code === s.code), s.code).toBe(false);
      expect(SITUATIONS.some((x) => x.code === s.code && x !== s), s.code).toBe(false);
      for (const code of s.entreprises!.codes) reponseSansIndice(s, code);
    }
  });
});

describe.each(ENTREPRISES_DU_SERVICE)("la productivité du service chez %s, dans le monde du cours", (code) => {
  const cas = casDeLEntreprise(code);
  const bistrot = code === "bistrot";
  const f = bistrot ? LA_TABLE_D_AUGUSTIN : L_ESCALE;
  /**
   * L'année du service, refaite à la main sur la fiche, au prix de l'année : la demande d'un
   * trimestre est la somme de celles des clientèles ; l'établissement en sert au plus ses couverts
   * par jour (le bistrot) ou ses chambres (l'hôtel) × 90 jours. L'équipe est celle de la fiche,
   * payée pareil chaque trimestre.
   */
  const jours = f.joursParTrimestre;
  const capacite = (bistrot ? LA_TABLE_D_AUGUSTIN.couvertsParJour : L_ESCALE.chambres) * jours;
  const demandes = [0, 1, 2, 3].map((i) => f.clienteles.reduce((t, g) => t + g.demande[i]!, 0));
  const vendues = demandes.map((d) => Math.min(d, capacite));
  const { effectif } = f.equipe;
  const personnel = effectif * f.equipe.coutParSalarieParTrimestre;
  const unite = bistrot ? "couvert" : "nuitée";
  const U = bistrot ? "Couverts" : "Nuitées";
  const iPlein = vendues.indexOf(Math.max(...vendues));
  const iCreux = vendues.indexOf(Math.min(...vendues));

  it("la fiche donne l'année : une équipe fixe, payée dans les charges fixes, et une activité qui change", () => {
    expect(f.entreprise).toBe(cas.entreprise);
    expect(f.entreprise).toBe(bistrot ? "LA TABLE D'AUGUSTIN" : "L'ESCALE");
    expect([effectif, f.equipe.coutParSalarieParTrimestre, jours]).toEqual(bistrot ? [10, 7200, 90] : [14, 8600, 90]);
    expect(personnel).toBeLessThan(f.chargesFixesParTrimestre);
    // Le bistrot refuse des couverts au 4e trimestre (les banquets), l'hôtel des nuitées l'été.
    expect(capacite).toBe(bistrot ? 9000 : 5400);
    expect(demandes).toEqual(bistrot ? [6400, 8500, 5480, 11_900] : [3400, 5000, 6400, 3900]);
    expect(vendues).toEqual(bistrot ? [6400, 8500, 5480, 9000] : [3400, 5000, 5400, 3900]);
    // L'hôtel du service est celui du modèle de l'hôtel, au prix de l'année les quatre trimestres.
    if (!bistrot) expect(anneeDeLHotel(L_ESCALE, [88, 88, 88, 88]).trimestres.map((t) => [t.demande, t.vendues])).toEqual(demandes.map((d, i) => [d, vendues[i]]));
    const p = productiviteDuService(cas);
    expect(p.entreprise).toBe(f.entreprise);
    expect(p.trimestres.map((t) => [t.effectif, t.personnel, t.demande, t.vendues, t.capacite])).toEqual(
      demandes.map((d, i) => [effectif, personnel, d, vendues[i], capacite]),
    );
  });

  it("les champs attendent ce que la fiche donne, recomposé à la main", () => {
    const p = productiviteDuService(cas);
    expect([iPlein + 1, iCreux + 1]).toEqual(bistrot ? [4, 3] : [3, 1]);
    expect(p.plein.numero).toBe(iPlein + 1);
    expect(p.creux.numero).toBe(iCreux + 1);
    const champs = (i: number) => ({
      [`${U} par salarié sur le trimestre`]: dixieme(vendues[i]! / effectif),
      [`${U} par salarié et par jour`]: centime(vendues[i]! / (effectif * jours)),
      [`Coût du personnel par ${unite}`]: centime(personnel / vendues[i]!),
    });
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "plein", cas)).toEqual(champs(iPlein));
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "creux", cas)).toEqual(champs(iCreux));
    // Les chiffres clés, épinglés : le coût du personnel par client au plein et au creux.
    expect([centime(personnel / vendues[iPlein]!), centime(personnel / vendues[iCreux]!)]).toEqual(bistrot ? [8, 13.14] : [22.3, 35.41]);
    const prodPlein = dixieme(vendues[iPlein]! / effectif);
    const prodCreux = dixieme(vendues[iCreux]! / effectif);
    const coutPlein = centime(personnel / vendues[iPlein]!);
    const coutCreux = centime(personnel / vendues[iCreux]!);
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "ecart", cas)).toEqual({
      "Variation de la productivité (%)": dixieme((prodCreux / prodPlein - 1) * 100),
      [`Variation du coût du personnel par ${unite} (%)`]: dixieme((coutCreux / coutPlein - 1) * 100),
    });
    // Le coût par client monte plus que la productivité ne baisse : le même coût, moins de clients.
    expect(p.variationDuCout).toBeGreaterThan(-p.variationDeLaProductivite);
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "plafond", cas)).toEqual({
      "Productivité à pleine capacité": dixieme(capacite / effectif),
      [`Coût du personnel par ${unite} à pleine capacité`]: centime(personnel / capacite),
    });
  });

  it("les verdicts se calculent : la même équipe, un trimestre plein qui refuse des clients, un creux qui a de la place", () => {
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "pourquoi", cas)).toBe("La même équipe, payée pareil, pour moins de clients");
    // Le trimestre le plus chargé est plein : il refuse des clients, sa productivité est déjà la plus haute.
    expect(vendues[iPlein]).toBe(capacite);
    expect(demandes[iPlein]! - vendues[iPlein]!).toBe(bistrot ? 2900 : 1000);
    expect(productiviteDuService(cas).remplissageDuPlein).toBe(100);
    // Le trimestre creux a servi tous ses clients, et il lui reste de la place : il faut en attirer.
    expect(demandes[iCreux]).toBe(vendues[iCreux]);
    expect(capacite - vendues[iCreux]!).toBe(bistrot ? 3520 : 2000);
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "remplir-le-creux", cas)).toBe("Attirer plus de clients au trimestre creux : il reste de la place");
  });

  it("le cas : le coût moyen de l'année, ce qu'il fallait servir au trimestre creux, et si c'était possible", () => {
    const total = vendues.reduce((t, x) => t + x, 0);
    const coutAnnee = centime((personnel * 4) / total);
    const aServir = Math.ceil(personnel / coutAnnee - 1e-9);
    expect(aServir * coutAnnee).toBeGreaterThanOrEqual(personnel);
    expect((aServir - 1) * coutAnnee).toBeLessThan(personnel);
    expect([total, coutAnnee, aServir]).toEqual(bistrot ? [29_380, 9.8, 7347] : [17_700, 27.21, 4425]);
    expect(attendus(LE_COUT_DU_TRIMESTRE_CREUX, "l-annee", cas)).toEqual({
      "Coût du personnel de l'année": personnel * 4,
      [`${U} de l'année`]: total,
      [`Coût du personnel par ${unite} sur l'année`]: coutAnnee,
    });
    expect(attendus(LE_COUT_DU_TRIMESTRE_CREUX, "le-creux", cas)).toEqual({
      [`${U} à servir au ${iCreux === 0 ? "1er" : `${iCreux + 1}e`} trimestre`]: aServir,
      [`${U} en plus`]: aServir - vendues[iCreux]!,
      "Productivité par salarié visée": dixieme(aServir / effectif),
    });
    // Il fallait plus que la demande du trimestre creux, et moins que la capacité : il manquait des clients.
    expect(aServir).toBeGreaterThan(demandes[iCreux]!);
    expect(aServir).toBeLessThanOrEqual(capacite);
    // Le curseur du cas : le coût moyen de l'année × n face au personnel du trimestre creux.
    const min = Math.floor(vendues[iCreux]! / 1000) * 1000;
    expect(curseur(LE_COUT_DU_TRIMESTRE_CREUX, "le-cout-moyen-au-curseur", cas)).toEqual({
      attendu: aServir,
      bornes: [min, capacite],
      droites: [centime(coutAnnee * min), personnel, centime(coutAnnee * capacite), personnel],
      lecture: {
        "Ce que le coût moyen laisse au personnel": centime(coutAnnee * aServir),
        "Coût du personnel du trimestre": personnel,
        [`Coût du personnel par ${unite}`]: centime(personnel / aServir),
        "Écart avec le coût du personnel": centime(centime(coutAnnee * aServir) - personnel),
      },
    });
    // L'autre levier, à rebours : l'équipe la plus grande qui tenait le coût moyen sans un client de plus.
    const equipe = Math.floor((coutAnnee * vendues[iCreux]!) / f.equipe.coutParSalarieParTrimestre);
    const parJour = centime(vendues[iCreux]! / (equipe * jours));
    expect([equipe, parJour]).toEqual(bistrot ? [7, 8.7] : [10, 3.78]);
    expect(attendus(LE_COUT_DU_TRIMESTRE_CREUX, "l-autre-levier", cas)).toEqual({
      "Salariés au plus, sans client de plus": equipe,
      [`Coût du personnel par ${unite}, équipe réduite`]: centime((equipe * f.equipe.coutParSalarieParTrimestre) / vendues[iCreux]!),
      [`${U} par salarié et par jour, équipe réduite`]: parJour,
    });
    // Le croisement : cette équipe sert moins par salarié et par jour qu'au trimestre le plus chargé.
    expect(parJour).toBeLessThanOrEqual(centime(vendues[iPlein]! / (effectif * jours)));
    expect(coutDuTrimestreCreux(cas).verdict).toBe("equipe");
    const reponse = LE_COUT_DU_TRIMESTRE_CREUX.etapes.find((e) => e.id === "reponse") as EtapeChoix;
    expect(reponse.options(cas, etatVide).find((o) => o.juste)!.texte).toBe("Pas avec la même équipe ; une équipe réduite y arrivait");
  });

  it("les deux cycles, refaits à la main : les clients qu'il fallait au creux, puis l'équipe qu'il pouvait payer, à 30 % du prix", () => {
    expect(PART_DU_PRIX_POUR_LE_PERSONNEL).toBe(0.3);
    const prix = f.prixDeLAnnee;
    const vise = centime(0.3 * prix);
    expect(vise).toBe(bistrot ? 10.2 : 26.4);
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "predire-le-cout", cas)).toBe(bistrot ? "De plus de 39,1 %" : "De plus de 37 %");
    const clients = Math.ceil(personnel / vise);
    const min = Math.floor(vendues[iCreux]! / 1000) * 1000;
    expect(clients).toBe(bistrot ? 7059 : 4561);
    expect(curseur(LA_PRODUCTIVITE_DU_SERVICE, "remplir-le-creux-au-curseur", cas)).toEqual({
      attendu: clients,
      bornes: [min, capacite],
      droites: [centime(vise * min), personnel, centime(vise * capacite), personnel],
      lecture: {
        "Chiffre d'affaires du trimestre": centime(prix * clients),
        "Ce que 30 % du prix laissent au personnel": centime(vise * clients),
        "Coût du personnel du trimestre": personnel,
        [`Coût du personnel par ${unite}`]: centime(personnel / clients),
        "Ce que le repère laisse de plus que le personnel": centime(centime(vise * clients) - personnel),
      },
    });
    // Sans un client de plus : 30 % du chiffre d'affaires du creux, divisés par le coût d'un salarié.
    const permis = centime(vise * vendues[iCreux]!);
    const cs = f.equipe.coutParSalarieParTrimestre;
    const equipe = Math.floor(permis / cs);
    expect([permis, equipe]).toEqual(bistrot ? [55_896, 7] : [89_760, 10]);
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "predire-l-equipe", cas)).toBe(bistrot ? "Environ 7, au lieu de 10" : "Environ 10, au lieu de 14");
    expect(curseur(LA_PRODUCTIVITE_DU_SERVICE, "l-equipe-au-curseur", cas)).toEqual({
      attendu: equipe,
      bornes: [1, 2 * effectif],
      droites: [permis, cs, permis, 2 * effectif * cs],
      lecture: {
        "Ce que 30 % du chiffre d'affaires laissent au personnel": permis,
        "Coût du personnel de cette équipe": equipe * cs,
        [`Coût du personnel par ${unite}`]: centime((equipe * cs) / vendues[iCreux]!),
        "Ce que le repère laisse de plus que l'équipe": centime(permis - equipe * cs),
      },
    });
    const parJour = centime(vendues[iCreux]! / (equipe * jours));
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "l-equipe-du-creux", cas)).toEqual({
      "Salariés au plus": equipe,
      [`Coût du personnel par ${unite}, équipe réduite`]: centime((equipe * cs) / vendues[iCreux]!),
      [`${U} par salarié et par jour, équipe réduite`]: parJour,
    });
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "l-equipe-du-creux", cas)).toEqual(
      bistrot
        ? { "Salariés au plus": 7, "Coût du personnel par couvert, équipe réduite": 9.2, "Couverts par salarié et par jour, équipe réduite": 8.7 }
        : { "Salariés au plus": 10, "Coût du personnel par nuitée, équipe réduite": 25.29, "Nuitées par salarié et par jour, équipe réduite": 3.78 },
    );
    // Le croisement : l'équipe réduite sert moins par jour qu'au trimestre le plus chargé ; elle pouvait tenir le creux.
    expect(parJour).toBeLessThanOrEqual(centime(vendues[iPlein]! / (effectif * jours)));
  });

  it("le laboratoire de l'équipe, refait à la main : le coût du plein ne revient qu'à la productivité du plein", () => {
    const l = laboratoire(LA_PRODUCTIVITE_DU_SERVICE, "le-laboratoire-de-l-equipe", cas);
    const cs = f.equipe.coutParSalarieParTrimestre;
    expect(l.leviers.map((x) => [x.code, x.min, x.max, x.pas])).toEqual([
      ["effectif", 1, 2 * effectif, 1],
      ["servis", demandes[iCreux], capacite, 10],
    ]);
    expect(l.depart).toEqual({ effectif, servis: vendues[iCreux] });
    // Le défi, en nombres entiers : e × coût d'un salarié × ventes du plein ≤ personnel × n, et n × effectif ≤ ventes du plein × e.
    const atteint = (e: number, n: number) => e * cs * vendues[iPlein]! <= personnel * n && n * effectif <= vendues[iPlein]! * e;
    let solution: { effectif: number; servis: number } | undefined;
    for (let n = demandes[iCreux]!; n <= capacite && !solution; n += 10) for (let e = 1; e <= 2 * effectif && !solution; e++) if (atteint(e, n)) solution = { effectif: e, servis: n };
    expect(solution).toEqual(bistrot ? { effectif: 7, servis: 6300 } : { effectif: 14, servis: 5400 });
    expect(l.solution).toEqual(solution);
    expect(l.reussi).toEqual([false, true]);
    const lire = (e: number, n: number) => ({
      "Coût du personnel du trimestre": e * cs,
      [`${U} par salarié et par jour`]: centime(n / (e * jours)),
      [`${U} par salarié et par jour, au trimestre le plus chargé`]: centime(vendues[iPlein]! / (effectif * jours)),
      "Part du personnel dans le chiffre d'affaires": dixieme(((e * cs) / (n * f.prixDeLAnnee)) * 100),
      [`Coût du personnel par ${unite}`]: centime((e * cs) / n),
      [`Coût du personnel par ${unite}, au trimestre le plus chargé`]: centime(personnel / vendues[iPlein]!),
      "Économie sur le coût du personnel": personnel - e * cs,
    });
    expect(l.auDepart).toEqual(lire(effectif, vendues[iCreux]!));
    expect(l.aLaSolution).toEqual(lire(solution!.effectif, solution!.servis));
    expect(l.aLaSolution[`Coût du personnel par ${unite}`]).toBe(bistrot ? 8 : 22.3);
    // Une équipe plus petite, à ces clients, demanderait plus que le plein à chaque salarié.
    expect(atteint(solution!.effectif - 1, solution!.servis)).toBe(false);
    // Le graphique, en quelques points : le coût par client se divise par les clients servis.
    const g = l.e.graphique!(cas);
    expect(g.levier).toBe("servis");
    const [parClient, auPlein] = g.courbes;
    for (const n of [demandes[iCreux]!, 5000, capacite]) {
      expect(parClient!.valeur({ effectif, servis: n }), `${n}`).toBe(centime(personnel / n));
      expect(auPlein!.valeur({ effectif, servis: n }), `${n}`).toBe(centime(personnel / vendues[iPlein]!));
    }
  });

  it("les étapes d'expert, refaites à la main : un salarié de plus sur l'année, et ce que la productivité ne mesure pas", () => {
    expect(SALARIES_EN_PLUS).toBe(1);
    const cs = f.equipe.coutParSalarieParTrimestre;
    const annee = (effectif + 1) * cs * 4;
    const clients = Math.ceil(annee / centime(0.3 * f.prixDeLAnnee));
    const total = vendues.reduce((t, x) => t + x, 0);
    expect([annee, clients, clients - total]).toEqual(bistrot ? [316_800, 31_059, 1679] : [516_000, 19_546, 1846]);
    expect(attendus(LA_PRODUCTIVITE_DU_SERVICE, "une-equipe-de-plus", cas)).toEqual({
      "Coût du personnel de l'année, équipe renforcée": annee,
      [`${U} à servir sur l'année`]: clients,
      [`${U} de plus que l'année jouée`]: clients - total,
    });
    expect(juste(LA_PRODUCTIVITE_DU_SERVICE, "juger-l-equipe", cas)).toBe("Elle mesure surtout le remplissage, que l'équipe ne décide pas");
    const synthese = LA_PRODUCTIVITE_DU_SERVICE.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
    expect(synthese.texte(cas).join(" ")).toContain("Au niveau de l'examen");
    expect(synthese.texte(cas).at(-1)).toMatch(/^Dans l'arène, les chiffres de votre (bistrot|hôtel) seront différents : la notion, elle, est la même\.$/);
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LA_PRODUCTIVITE_DU_SERVICE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_COUT_DU_TRIMESTRE_CREUX, code));
});

describe("le prix selon la saison, à l'hôtel du monde du cours", () => {
  const code = "hotel";
  const cas = casDeLEntreprise(code);
  const f = L_ESCALE;
  /**
   * L'année de l'hôtel, refaite à la main sur la fiche : toutes les chambres en vente, la demande
   * de chaque clientèle au prix p vaut sa demande au prix de l'année × (p ÷ 88) ^ −1,5, à l'unité,
   * l'hôtel vend le plus petit de la demande et des nuitées offertes.
   */
  const offertes = f.chambres * f.joursParTrimestre;
  const trimestre = (k: number, prix: number) => {
    const p = centime(prix);
    const demande = f.clienteles.reduce((s, g) => s + Math.round(g.demande[k - 1]! * (p / f.prixDeLAnnee) ** f.elasticite), 0);
    const vendues = Math.min(demande, offertes);
    const ca = centime(vendues * p);
    return { p, demande, vendues, ca, resultat: centime(ca - vendues * f.coutVariableParNuitee - f.chargesFixesParTrimestre) };
  };
  const annee = (facteurs: readonly number[]) => {
    const ts = facteurs.map((x, i) => trimestre(i + 1, f.prixDeLAnnee * x));
    const v = ts.reduce((s, t) => s + t.vendues, 0);
    const o = offertes * ts.length;
    const ca = centime(ts.reduce((s, t) => s + t.ca, 0));
    return { ts, v, o, ca, occupation: dixieme((v / o) * 100), prixMoyen: centime(ca / v), revpar: centime(ca / o), resultat: centime(ts.reduce((s, t) => s + t.resultat, 0)) };
  };
  const haut = 1 + HAUSSE_EN_HAUTE_SAISON;
  const bas = 1 - BAISSE_EN_BASSE_SAISON;
  const u = annee([1, 1, 1, 1]);

  it("la fiche est celle de L'ESCALE, et la simulation ne dépend pas de l'arène", () => {
    expect(ENTREPRISES_DE_LA_SAISON).toEqual(["hotel"]);
    expect(f.entreprise).toBe(cas.entreprise);
    expect([f.chambres, f.joursParTrimestre, f.prixDeLAnnee, f.coutVariableParNuitee, f.chargesFixesParTrimestre, f.elasticite]).toEqual([60, 90, 88, 21, 210_000, -1.5]);
    const p = prixSelonLaSaison(cas);
    expect(p.unique.trimestres.map((t) => [t.prix, t.demande, t.vendues, t.resultat])).toEqual(u.ts.map((t) => [t.p, t.demande, t.vendues, t.resultat]));
    // L'année au prix unique : l'été refuse des clients, le reste de l'année laisse des chambres vides.
    expect(u.ts.map((t) => t.demande)).toEqual([3400, 5000, 6400, 3900]);
    expect(u.resultat).toBe(345_900);
  });

  it("la saisonnalité est celle de la fiche : haute saison au 2e et au 3e trimestre, basse au 1er et au 4e", () => {
    const totaux = [0, 1, 2, 3].map((i) => f.clienteles.reduce((s, g) => s + g.demande[i]!, 0));
    const moyenne = centime(totaux.reduce((s, x) => s + x, 0) / 4);
    const m = saisonDuMarche(cas);
    expect(m.totaux).toEqual(totaux);
    expect(m.haute).toEqual([2, 3]);
    expect(m.basse).toEqual([1, 4]);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "coefficients", cas)).toEqual({
      "Demande moyenne d'un trimestre": moyenne,
      "Coefficient du 3e trimestre": centime(totaux[2]! / moyenne),
      "Coefficient du 1er trimestre": centime(totaux[0]! / moyenne),
    });
  });

  it("les champs attendent ce que la fiche donne, recomposé à la main", () => {
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-unique", cas)).toEqual({
      "Nuitées refusées au 3e trimestre": 6400 - offertes,
      "Nuitées vides au 1er trimestre": offertes - 3400,
      "Nuitées vides au 2e trimestre": offertes - 5000,
      "Nuitées vides au 4e trimestre": offertes - 3900,
    });
    // Le revenu par chambre disponible est bien le prix moyen fois le taux d'occupation.
    expect(Math.abs(u.revpar - (u.prixMoyen * u.v) / u.o)).toBeLessThanOrEqual(0.01);
    const s = annee([bas, haut, haut, bas]);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-de-la-saison", cas)).toEqual({
      "Taux d'occupation au prix de la saison (%)": s.occupation,
      "Prix moyen au prix de la saison": s.prixMoyen,
      "Revenu par chambre disponible au prix de la saison": s.revpar,
      "Écart de résultat, saison moins prix unique": centime(s.resultat - u.resultat),
    });
    // Ce qu'une baisse doit faire vendre pour garder la marge : vendues × 15 % × 88 € ÷ (74,80 € − 21 €).
    const aGagner = (n: number) => Math.ceil((n * 0.15 * 88) / (74.8 - 21) - 1e-9);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "ce-qu-une-baisse-doit-vendre", cas)).toEqual({
      "Nuitées à gagner au 1er trimestre": aGagner(3400),
      "Nuitées à gagner au 2e trimestre": aGagner(5000),
      "Nuitées à gagner au 4e trimestre": aGagner(3900),
    });
    // Au 1er et au 4e, assez de chambres vides pour payer la baisse ; au 2e, trop peu.
    const p = prixSelonLaSaison(cas);
    expect(p.baisses).toEqual([1, 4]);
    expect(p.tropPeuDeVides).toEqual([2]);
    expect(p.refus).toEqual([3]);
    const r = annee([bas, 1, haut, bas]);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "prix-du-remplissage", cas)).toEqual({
      "Taux d'occupation au prix du remplissage (%)": r.occupation,
      "Revenu par chambre disponible au prix du remplissage": r.revpar,
      "Écart de résultat, remplissage moins prix unique": centime(r.resultat - u.resultat),
    });
  });

  it("les verdicts se calculent : le prix du remplissage gagne, le calendrier se trompe au 2e trimestre", () => {
    const p = prixSelonLaSaison(cas);
    const s = annee([bas, haut, haut, bas]);
    const r = annee([bas, 1, haut, bas]);
    expect(s.resultat).toBeGreaterThan(u.resultat);
    expect(r.resultat).toBeGreaterThan(s.resultat);
    expect(p.meilleur).toBe("remplissage");
    expect(juste(LE_PRIX_SELON_LA_SAISON, "verdict-de-la-saison", cas)).toBe("Oui : le résultat de l'année monte");
    expect(juste(LE_PRIX_SELON_LA_SAISON, "la-regle", cas)).toBe("Regarder s'il reste des chambres à vendre ou des clients refusés, pas seulement le calendrier");
    expect(juste(LE_PRIX_SELON_LA_SAISON, "lire-l-annee", cas)).toBe("Trop bas quand des clients repartaient, trop haut quand des chambres restaient vides");
    // Au 2e trimestre, haute saison sans clients refusés : la hausse fait perdre des ventes et du résultat.
    expect(p.hausseMalPlacee).toEqual([2]);
    expect(p.baisseMalPlacee).toEqual([]);
    expect(s.ts[1]!.vendues).toBeLessThan(u.ts[1]!.vendues);
    expect(s.ts[1]!.resultat).toBeLessThan(u.ts[1]!.resultat);
    const retour = LE_PRIX_SELON_LA_SAISON.etapes.find((e) => e.id === "verdict-de-la-saison");
    if (retour?.type !== "choix") throw new Error("verdict-de-la-saison n'est pas un choix");
    const n = (x: number) => x.toLocaleString("fr-FR");
    expect(retour.options(cas, { soldes: {} }).find((o) => o.juste)!.retour).toContain(
      `la hausse a fait partir des clients (${n(s.ts[1]!.vendues)} nuitées vendues contre ${n(u.ts[1]!.vendues)})`,
    );
  });

  it("le cas : le seul trimestre le plus fort, plus cher, et ce que l'année y gagne", () => {
    const x = plusCherAuPlusFort(cas);
    expect(x.k).toBe(3);
    const releve = annee([1, 1, haut, 1]);
    const avant = u.ts[2]!;
    const apres = releve.ts[2]!;
    expect(attendus(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "le-trimestre", cas)).toEqual({
      "Taux d'occupation au prix unique (%)": dixieme((avant.vendues / offertes) * 100),
      "Taux d'occupation au prix relevé (%)": dixieme((apres.vendues / offertes) * 100),
      "Revenu par chambre disponible au prix unique": centime(avant.ca / offertes),
      "Revenu par chambre disponible au prix relevé": centime(apres.ca / offertes),
    });
    const ecart = centime(releve.resultat - u.resultat);
    expect(attendus(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "l-annee", cas)).toEqual({ "Écart de résultat de l'année, prix relevé moins prix unique": ecart });
    expect(ecart).toBeGreaterThan(0);
    expect(x.verdict).toBe("monter");
    // Le curseur du cas : le revenu par chambre à 101,20 € face à celui du prix unique, 88 €.
    const pourLeRevpar = Math.ceil(avant.ca / 101.2);
    expect(pourLeRevpar).toBe(4696);
    expect(curseur(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "le-revpar-au-curseur", cas)).toEqual({
      attendu: pourLeRevpar,
      bornes: [4000, offertes],
      droites: [centime((101.2 * 4000) / offertes), 88, 101.2, 88],
      lecture: {
        "Revenu par chambre disponible à 101,20 €": centime((101.2 * pourLeRevpar) / offertes),
        "Revenu par chambre disponible à 88 €": 88,
        "Marge sur coûts variables à 101,20 €": centime(80.2 * pourLeRevpar),
        "Marge sur coûts variables à 88 €": 361_800,
        "Écart de revenu par chambre disponible": centime(centime((101.2 * pourLeRevpar) / offertes) - 88),
      },
    });
    // Le croisement, à rebours : la hausse peut perdre 704 nuitées pour le revenu par chambre, 888 pour la marge ; elle en perd 210.
    const pourLaMarge = Math.ceil(361_800 / 80.2);
    expect(attendus(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "deux-seuils", cas)).toEqual({
      "Nuitées que la hausse peut perdre, revenu par chambre gardé": offertes - pourLeRevpar,
      "Nuitées que la hausse peut perdre, marge gardée": offertes - pourLaMarge,
      "Nuitées que la hausse fait perdre": avant.vendues - apres.vendues,
    });
    expect([offertes - pourLeRevpar, offertes - pourLaMarge, avant.vendues - apres.vendues]).toEqual([704, 888, 210]);
    expect(juste(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "reponse", cas)).toBe("Montez-la au 3e trimestre : la hausse rapporte plus qu'elle ne coûte");
  });

  it("les deux cycles, refaits à la main : ce qu'une baisse de 15 % doit vendre au 2e trimestre, ce qu'une hausse de 15 % peut perdre au 3e", () => {
    expect(juste(LE_PRIX_SELON_LA_SAISON, "predire-la-baisse", cas)).toBe("Non : il faudrait plus de nuitées que l'hôtel n'en offre");
    // Au 2e trimestre : (88 − 21) × 5 000 de marge à garder, 74,80 − 21 par nuitée vendue en baisse.
    const margeT2 = (88 - 21) * 5000;
    const baisse = Math.ceil(margeT2 / centime(74.8 - 21));
    expect([margeT2, baisse]).toEqual([335_000, 6227]);
    expect(baisse).toBeGreaterThan(offertes);
    expect(curseur(LE_PRIX_SELON_LA_SAISON, "la-baisse-au-curseur", cas)).toEqual({
      attendu: baisse,
      bornes: [5000, 7000],
      droites: [centime(53.8 * 5000), margeT2, centime(53.8 * 7000), margeT2],
      lecture: { "Marge sur coûts variables à 74,80 €": centime(53.8 * baisse), "Marge sur coûts variables à 88 €": margeT2, "Écart de marge": centime(centime(53.8 * baisse) - margeT2) },
    });
    expect(juste(LE_PRIX_SELON_LA_SAISON, "predire-la-hausse", cas)).toBe("Plus de 800 : chaque nuitée gardée rapporte plus");
    // Au 3e trimestre : (88 − 21) × 5 400 de marge à garder, 101,20 − 21 par nuitée vendue en hausse.
    const margeT3 = (88 - 21) * offertes;
    const hausse = Math.ceil(margeT3 / centime(101.2 - 21));
    expect([margeT3, hausse, offertes - hausse]).toEqual([361_800, 4512, 888]);
    expect(curseur(LE_PRIX_SELON_LA_SAISON, "la-hausse-au-curseur", cas)).toEqual({
      attendu: hausse,
      bornes: [4000, offertes],
      droites: [centime(80.2 * 4000), margeT3, centime(80.2 * offertes), margeT3],
      lecture: { "Marge sur coûts variables à 101,20 €": centime(80.2 * hausse), "Marge sur coûts variables à 88 €": margeT3, "Écart de marge": centime(centime(80.2 * hausse) - margeT3) },
    });
    const gain = centime(offertes * (101.2 - 88));
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "ce-qu-une-hausse-peut-perdre", cas)).toEqual({
      "Gain de la hausse, sans nuitée perdue": gain,
      "Marge d'une nuitée perdue": 80.2,
      "Nuitées que la hausse peut perdre": Math.floor(gain / 80.2),
    });
    expect([gain, Math.floor(gain / 80.2)]).toEqual([71_280, 888]);
    // La simulation en fait perdre 210 : la hausse paie.
    expect(offertes - trimestre(3, 101.2).vendues).toBe(210);
  });

  it("le laboratoire des quatre prix, refait à la main : la hausse de 15 % dépasse le prix qui remplit juste l'hôtel", () => {
    const l = laboratoire(LE_PRIX_SELON_LA_SAISON, "le-laboratoire-des-quatre-prix", cas);
    expect(PRIX_DU_LABORATOIRE).toEqual({ min: 60, max: 110, pas: 0.1 });
    expect(l.leviers.map((x) => [x.code, x.min, x.max, x.pas])).toEqual(["t1", "t2", "t3", "t4"].map((k) => [k, 60, 110, 0.1]));
    const r = annee([bas, 1, haut, bas]);
    expect(l.depart).toEqual({ t1: 74.8, t2: 88, t3: 101.2, t4: 74.8 });
    // Les prix du laboratoire, du plus haut au plus bas : le premier où la demande remplit encore les 5 400 nuitées.
    const grille = Array.from({ length: 501 }, (_, i) => centime(110 - i * 0.1));
    const remplit = (k: number) => grille.find((p) => trimestre(k, p).demande >= offertes)!;
    expect([1, 2, 3, 4].map(remplit)).toEqual([64.6, 83.6, 98.5, 70.8]);
    expect(l.solution).toEqual({ t1: 74.8, t2: 88, t3: 98.5, t4: 74.8 });
    const auxPrix = (p: readonly number[]) => {
      const ts = p.map((x, i) => trimestre(i + 1, x));
      const v = ts.reduce((s, t) => s + t.vendues, 0);
      const ca = centime(ts.reduce((s, t) => s + t.ca, 0));
      return { ts, v, ca, resultat: centime(ts.reduce((s, t) => s + t.resultat, 0)) };
    };
    const lire = (p: readonly number[]) => {
      const a = auxPrix(p);
      const d = auxPrix([74.8, 88, 101.2, 74.8]);
      return {
        "Nuitées vendues au 1er trimestre": a.ts[0]!.vendues,
        "Nuitées vendues au 2e trimestre": a.ts[1]!.vendues,
        "Nuitées vendues au 3e trimestre": a.ts[2]!.vendues,
        "Nuitées vendues au 4e trimestre": a.ts[3]!.vendues,
        "Taux d'occupation de l'année": dixieme((a.v / (4 * offertes)) * 100),
        "Revenu par chambre disponible de l'année": centime(a.ca / (4 * offertes)),
        "Résultat de l'année": a.resultat,
        "Écart avec le prix du remplissage": centime(a.resultat - d.resultat),
      };
    };
    expect(l.auDepart).toEqual(lire([74.8, 88, 101.2, 74.8]));
    expect(l.aLaSolution).toEqual(lire([74.8, 88, 98.5, 74.8]));
    expect(auxPrix([74.8, 88, 101.2, 74.8]).resultat).toBe(r.resultat);
    expect([r.resultat, auxPrix([74.8, 88, 98.5, 74.8]).resultat]).toEqual([412_438.8, 414_700.8]);
    // Au 3e trimestre, 98,50 € remplissent l'hôtel (5 405 demandées) et rapportent 2 262 € de plus que 101,20 €.
    expect([trimestre(3, 98.5).demande, centime(trimestre(3, 98.5).resultat - trimestre(3, 101.2).resultat)]).toEqual([5405, 2262]);
    expect(l.reussi).toEqual([false, true]);
    // Aux quatre prix qui remplissent juste l'hôtel, l'année ferait mieux encore.
    expect(auxPrix([64.6, 83.6, 98.5, 70.8]).resultat).toBe(420_900);
    // Le graphique, en quelques points : la demande du 3e trimestre selon son prix, face aux nuitées offertes.
    const g = l.e.graphique!(cas);
    expect([g.levier, g.unite]).toEqual(["t3", "nuitées"]);
    const [demande, offre] = g.courbes;
    for (const p of [60, 88, 98.5, 110]) {
      expect(demande!.valeur({ ...l.depart, t3: p }), `${p}`).toBe(trimestre(3, p).demande);
      expect(offre!.valeur({ ...l.depart, t3: p }), `${p}`).toBe(offertes);
    }
    expect([60, 88, 110].map((p) => trimestre(3, p).demande)).toEqual([11_367, 6400, 4579]);
  });

  it("les étapes d'expert, refaites à la main : le prix qui remplit juste l'hôtel, à rebours ; la petite baisse ; la règle des 15 %", () => {
    // 6 400 × (p ÷ 88) ^ −1,5 = 5 400 : p = 88 × (6 400 ÷ 5 400) ^ (1 ÷ 1,5).
    const p = centime(88 * (6400 / 5400) ** (1 / 1.5));
    const resultat = centime((p - 21) * offertes - 210_000);
    expect([p, resultat, centime(resultat - trimestre(3, 101.2).resultat)]).toEqual([98.55, 208_770, 2532]);
    // La simulation vend bien toutes les nuitées offertes à ce prix.
    expect(trimestre(3, p).demande).toBeGreaterThanOrEqual(offertes);
    expect(trimestre(3, p).resultat).toBe(resultat);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "le-prix-qui-remplit-juste", cas)).toEqual({
      "Prix qui remplit juste l'hôtel": p,
      "Résultat du trimestre à ce prix": resultat,
      "Ce qu'il rapporte de plus que la hausse": centime(resultat - trimestre(3, 101.2).resultat),
    });
    // La petite baisse de 5 % au 2e trimestre : 4,40 € perdus par nuitée vendue, 62,60 € gagnés par nuitée en plus.
    expect(PETITE_BAISSE).toBe(0.05);
    const petit = centime(88 * 0.95);
    const aGagner = Math.ceil((5000 * centime(88 - petit)) / centime(petit - 21));
    const t2 = trimestre(2, petit);
    expect([petit, aGagner, t2.demande, t2.vendues - 5000, centime(t2.resultat - 125_000)]).toEqual([83.6, 352, 5400, 400, 3040]);
    expect(attendus(LE_PRIX_SELON_LA_SAISON, "une-petite-baisse", cas)).toEqual({
      "Nuitées à gagner, petite baisse": aGagner,
      "Nuitées gagnées, petite baisse": t2.vendues - 5000,
      "Écart de résultat du trimestre, petite baisse": centime(t2.resultat - 125_000),
    });
    expect(juste(LE_PRIX_SELON_LA_SAISON, "la-regle-des-15-pour-cent", cas)).toBe("Un écart fixe rate le prix qui remplit juste l'hôtel");
    const synthese = LE_PRIX_SELON_LA_SAISON.etapes.at(-1)!;
    if (synthese.type !== "lecture") throw new Error("la synthèse n'est pas une lecture");
    expect(synthese.texte(cas).join(" ")).toContain("Au niveau de l'examen");
    expect(synthese.texte(cas).at(-1)).toBe("Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même.");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LE_PRIX_SELON_LA_SAISON, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, code));
});
