import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  ENTREPRISES_DU_SERVICE,
  LA_PRODUCTIVITE_DU_SERVICE,
  productiviteDuService,
} from "../../src/config/cours/chapitres/la-productivite-du-service";
import {
  BAISSE_EN_BASSE_SAISON,
  ENTREPRISES_DE_LA_SAISON,
  HAUSSE_EN_HAUTE_SAISON,
  LE_PRIX_SELON_LA_SAISON,
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
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DU BTS MHR AU PALIER 3, ET LEURS CAS : LA PRODUCTIVITÉ DU SERVICE, LE PRIX
 * SELON LA SAISON.
 *
 * La productivité : l'année du service dans le monde du cours (monde/service.ts), trimestre par
 * trimestre, au bistrot et à l'hôtel, refaite à la main sur leurs fiches. Le prix selon la saison : la saisonnalité du scénario de l'hôtel, puis l'année rejouée
 * au prix de la saison et au prix du remplissage (gestion-de-la-pme.ts). Ces gardes recomposent
 * les chiffres avec le moteur, sans passer par les fonctions des chapitres ; elles vérifient que
 * chaque valeur attendue d'un champ est bien ce calcul, que le prix de l'hôtel est une décision
 * unique que le moteur honore, que la défaillance se tranche avant la somme, que les verdicts se
 * calculent, et que les textes se lisent : rien d'indéfini, pas de « de le », pas de tiret au
 * milieu d'une phrase, des élisions faites, une seule bonne réponse, aucune option qui en contient
 * une autre, des libellés uniques, des notions qui existent, des accords avec les unités féminines.
 */

const etatVide: EtatDuCours = { soldes: {} };

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const t = e.tableau?.(cas);
  const tableau = t ? [t.titre, ...t.colonnes, ...t.lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    default:
      return [];
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
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
    expect(coutDuTrimestreCreux(cas).verdict).toBe("demande");
    const reponse = LE_COUT_DU_TRIMESTRE_CREUX.etapes.find((e) => e.id === "reponse") as EtapeChoix;
    expect(reponse.options(cas, etatVide).find((o) => o.juste)!.texte).toBe("Non : il fallait plus de clients que le trimestre creux n'en a eu");
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
    expect(juste(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, "reponse", cas)).toBe("Montez-la au 3e trimestre : la hausse rapporte plus qu'elle ne coûte");
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LE_PRIX_SELON_LA_SAISON, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(PLUS_CHER_AU_PLUS_FORT_DE_LA_SAISON, code));
});
