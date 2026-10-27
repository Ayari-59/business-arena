import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import {
  ENTREPRISES_DU_MARCHE,
  L_OFFRE_ET_LA_DEMANDE,
  PRIX_BAS,
  PRIX_HAUT,
  anneeAuPrix,
  demandeSelonLePrix,
} from "../../src/config/cours/chapitres/l-offre-et-la-demande";
import {
  ESSAIS_AU_PLUS,
  LE_PRIX_D_EQUILIBRE,
  MARGE_D_EQUILIBRE,
  PAS_DU_TATONNEMENT,
  chercherLePrix,
  prixDEquilibre,
} from "../../src/config/cours/chapitres/le-prix-d-equilibre";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { LE_PRIX_DE_FIN_D_ANNEE, TRIMESTRE_DE_FIN_D_ANNEE, prixDeFinDAnnee } from "../../src/config/cours/situations/par-chapitre/le-prix-de-fin-d-annee";
import {
  HAUSSE_DE_LA_MISE_EN_VENTE,
  METTRE_PLUS_EN_VENTE,
  miseEnVenteAugmentee,
} from "../../src/config/cours/situations/par-chapitre/mettre-plus-en-vente";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE SECONDE SES SUR LE MARCHÉ ET LES PRIX, ET LEURS CAS.
 *
 * « L'offre et la demande sur un marché » : la demande reçue et ce qui la fait varier, l'offre,
 * la quantité échangée, l'année rejouée à trois prix. « Le prix qui équilibre le marché » : le
 * 1er trimestre rejoué prix après prix, jusqu'au prix où la demande et l'offre se valent. Ces
 * gardes recomposent les chiffres avec le moteur, sans passer par les fonctions des chapitres,
 * dans chaque entreprise où ils se jouent : la quantité mise en vente est bien ce que le moteur
 * sert, les prix rejoués sont bien ceux qui sont posés, la quantité mise en vente ne bouge pas
 * quand le prix change, la demande ne bouge pas quand la quantité mise en vente change. Puis
 * elles vérifient les valeurs attendues des champs, que les verdicts se calculent et changent
 * d'une entreprise à l'autre, et que les textes se lisent.
 */

const etatVide: EtatDuCours = { soldes: {} };
const BLOC = "2de SES · Comment se forment les prix sur un marché ?";

/** Les entreprises du chapitre, recomptées sur le moteur : ni gamme ni abonnés dans l'année jouée. */
const UNE_SEULE_OFFRE = ENTREPRISES_DU_COURS.filter((code) => {
  const r = anneeDeReference(code)[0]!;
  return !r.products && !r.subscription;
});

const somme = (r: CompanyRoundResult, f: (v: CompanyRoundResult["market"]["bySegment"][string]) => number) =>
  Object.values(r.market.bySegment).reduce((t, v) => t + f(v), 0);
const demande = (r: CompanyRoundResult) => somme(r, (v) => v.demandForCompany);
const vendu = (r: CompanyRoundResult) => somme(r, (v) => v.sold);
const prixJoue = (r: CompanyRoundResult) => somme(r, (v) => v.revenue) / vendu(r);
const centime = (x: number) => Math.round(x * 100) / 100;

/** Le stock du début du trimestre `t`, lu dans l'état de l'entreprise que le moteur rend. */
function stockAuDebut(code: string, t: number): number {
  if (scenarioByCode(code).scenario.perishable) return 0;
  const { partie, depart } = anneeJouee(code);
  return t === 1 ? depart.finishedGoods.quantity : partie.rounds[t - 2]!.companies.find((x) => x.id === "joueur")!.finishedGoods.quantity;
}
/** Ce que l'entreprise avait à vendre dans le trimestre : le stock du début, plus la production, moins les rebuts. */
const offreDuTrimestre = (r: CompanyRoundResult, stock: number) => stock + r.production.produced - (r.qualityCosts?.defectUnits ?? 0);

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "mis", "ajouté"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    // Le test de bout en bout attend le titre de l'étape, et clique des boutons par leur nom.
    expect(e.titre, e.id).not.toMatch(/vérifier|étape suivante|terminer|valider/i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un nombre au singulier ne prend pas l'unité au pluriel : « 1 jours-conseil ».
      expect(x, `${e.id} : ${x}`).not.toMatch(new RegExp(`(^|\\s)[01] ${cas.unites}\\b`));
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+−|\s{2,}/);
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
      // Le test de bout en bout clique l'option par son texte : aucun ne doit en contenir un autre.
      for (const a of options) for (const b of options) if (a !== b) expect(a.texte.toLowerCase().includes(b.texte.toLowerCase()), `${e.id} : ${b.texte}`).toBe(false);
    }
    if (e.type === "montants") {
      const champs = e.champs(cas, etat);
      expect(new Set(champs.map((c) => c.libelle)).size, e.id).toBe(champs.length);
      for (const c of champs) {
        expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
        expect(Math.round(c.attendu * 100) / 100, `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const eur = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;

/** Pénurie, excédent ou équilibre, recomptés : l'écart rapporté à la marge d'équilibre. */
const situation = (d: number, o: number) => (Math.abs(d - o) <= MARGE_D_EQUILIBRE * o ? "equilibre" : d > o ? "penurie" : "excedent");

/**
 * LE TÂTONNEMENT, REFAIT À LA MAIN sur le moteur : le trimestre `t` rejoué (clés propres au test)
 * avec le prix posé, prix après prix ; chaque rejeu garde la quantité mise en vente et ne change
 * rien aux trimestres d'avant.
 */
function tatonnementALaMain(code: string, t: number) {
  const ref = anneeDeReference(code);
  const stock = stockAuDebut(code, t);
  const offreDeReference = Math.round(offreDuTrimestre(ref[t - 1]!, stock));
  const p0 = centime(prixJoue(ref[t - 1]!));
  const jouer = (prix: number, cle: string) => {
    const a = rejouerAvec(code, `le-prix-d-equilibre:test-t${t}-${cle}`, (tour, d) => (tour === t ? { ...d, price: prix } : undefined));
    const r = a[t - 1]!;
    // Le prix joué est celui qui est posé, et la quantité mise en vente n'a pas bougé.
    expect(prixJoue(r), `${code} à ${prix}`).toBeCloseTo(prix, 6);
    expect(Math.round(offreDuTrimestre(r, stock)), `${code} à ${prix}`).toBe(offreDeReference);
    // Les trimestres d'avant sont ceux de l'année de référence.
    for (let k = 0; k < t - 1; k++) expect(a[k]!.incomeStatement.netIncome, `${code} trimestre ${k + 1}`).toBe(ref[k]!.incomeStatement.netIncome);
    return { prix, demande: Math.round(demande(r)), offre: offreDeReference };
  };
  const depart = { prix: p0, demande: Math.round(demande(ref[t - 1]!)), offre: offreDeReference };
  const sens = depart.demande >= depart.offre ? 1 : -1;
  const essais = [depart];
  for (let k = 1; k <= ESSAIS_AU_PLUS; k++) {
    const f = Math.round((1 + sens * k * PAS_DU_TATONNEMENT) * 100) / 100;
    const m = jouer(centime(p0 * f), `x${f}`);
    essais.push(m);
    if ((m.demande - m.offre) * sens <= 0) break;
  }
  const dernier = essais.at(-1)!;
  const avant = essais.at(-2)!;
  const [bas, haut] = avant.prix < dernier.prix ? [avant, dernier] : [dernier, avant];
  const milieu = jouer(centime((bas.prix + haut.prix) / 2), "milieu");
  return { depart, sens, essais, dernier, avant, bas, haut, milieu };
}

describe("les deux chapitres de seconde SES et leurs cas, dans leur parcours", () => {
  it("portent les titres du programme, au palier 1, et la question du programme de SES qu'ils travaillent", () => {
    for (const ch of [L_OFFRE_ET_LA_DEMANDE, LE_PRIX_D_EQUILIBRE]) {
      expect(PROGRAMME["seconde-ses"]![1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("seconde-ses");
      expect(ch.palier).toBe(1);
      expect(ch.blocs).toEqual([BLOC]);
      expect(ch.libre).toBe(false);
      // Un code neuf, qu'aucun autre chapitre du registre ne porte.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
    }
    // Le bloc porte le préfixe de la seconde SES, et désigne une question du texte, une seule.
    expect(referentielDeCitation(BLOC)?.code).toBe("seconde-ses");
    expect(blocOfficiel(BLOC, "seconde-ses")).toBe("Comment se forment les prix sur un marché ?");
    expect(PARCOURS.find((p) => p.code === "seconde-ses")!.formation).toBe("seconde-ses");
    expect(L_OFFRE_ET_LA_DEMANDE.code).toBe("l-offre-et-la-demande");
    expect(LE_PRIX_D_EQUILIBRE.code).toBe("le-prix-d-equilibre");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [METTRE_PLUS_EN_VENTE, L_OFFRE_ET_LA_DEMANDE],
      [LE_PRIX_DE_FIN_D_ANNEE, LE_PRIX_D_EQUILIBRE],
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
    }
  });

  it("se jouent dans les entreprises à une seule offre, recomptées sur le moteur", () => {
    // Une gamme a un marché par article (la boutique) ; le club sert d'abord ses abonnés.
    expect(UNE_SEULE_OFFRE).toEqual(["nova", "hotel", "bistrot", "conseil", "ecommerce", "batiment", "transport"]);
    expect(ENTREPRISES_DU_MARCHE).toEqual(UNE_SEULE_OFFRE);
    expect(L_OFFRE_ET_LA_DEMANDE.entreprises?.codes).toEqual(UNE_SEULE_OFFRE);
    expect(LE_PRIX_D_EQUILIBRE.entreprises?.codes).toEqual(UNE_SEULE_OFFRE);
    expect(L_OFFRE_ET_LA_DEMANDE.entreprises?.pourquoi.length).toBeGreaterThan(20);
  });
});

describe.each(UNE_SEULE_OFFRE)("l'offre et la demande chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const ref = anneeDeReference(code);

  it("l'année de référence est l'année du cours, et le moteur sert la demande avec ce qui est mis en vente", () => {
    expect(ref.map((r) => r.incomeStatement.netIncome)).toEqual(anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome));
    const { partie } = anneeJouee(code);
    ref.forEach((r, k) => {
      const offre = offreDuTrimestre(r, stockAuDebut(code, k + 1));
      // Ce qui se vend est la plus petite de la demande et de ce qui est mis en vente.
      expect(Math.abs(vendu(r) - Math.min(demande(r), offre)), `trimestre ${k + 1}`).toBeLessThan(1e-6);
      // Et ce qui ne se vend pas reste en stock, sauf pour un service.
      if (!scenarioByCode(code).scenario.perishable) {
        const fin = partie.rounds[k]!.companies.find((x) => x.id === "joueur")!.finishedGoods.quantity;
        expect(Math.abs(fin - (offre - vendu(r))), `trimestre ${k + 1}`).toBeLessThan(1e-6);
      }
      expect(r.defaillant ?? false).toBe(false);
    });
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main", () => {
    const parTrimestre = ref.map((r) => Math.round(somme(r, (v) => v.potential)));
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "la-saison", cas)).toEqual({
      "Demande du marché sur l'année": parTrimestre.reduce((t, x) => t + x, 0),
      "Écart entre le trimestre le plus fort et le plus faible": Math.max(...parTrimestre) - Math.min(...parTrimestre),
    });
    const r1 = ref[0]!;
    const d = Math.round(demande(r1));
    const o = Math.round(offreDuTrimestre(r1, stockAuDebut(code, 1)));
    const e = Math.round(vendu(r1));
    expect(e).toBe(Math.min(d, o));
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "l-offre-et-l-echange", cas)).toEqual({
      "Quantité échangée": e,
      "Demande non servie": d - e,
      "Offre non vendue": o - e,
    });
  });

  it("l'année rejouée à trois prix pose, à chaque trimestre, le prix de l'année multiplié, sans défaillance", () => {
    const prix = ref.map(prixJoue);
    const lire = (facteur: number) => {
      const a = anneeAuPrix(code, facteur);
      a.forEach((r, k) => {
        expect(prixJoue(r), `×${facteur}, trimestre ${k + 1}`).toBeCloseTo(prix[k]! * facteur, 6);
        expect(r.defaillant ?? false, `×${facteur}, trimestre ${k + 1}`).toBe(false);
      });
      return { demande: Math.round(a.reduce((t, r) => t + demande(r), 0)), echangee: Math.round(a.reduce((t, r) => t + vendu(r), 0)) };
    };
    // Au facteur 1, c'est l'année de référence elle-même.
    expect(anneeAuPrix(code, 1)).toBe(ref);
    const bas = lire(PRIX_BAS);
    const base = lire(1);
    const haut = lire(PRIX_HAUT);
    // La loi de la demande, partout : plus le prix est bas, plus la demande reçue est grande.
    expect(bas.demande).toBeGreaterThan(base.demande);
    expect(base.demande).toBeGreaterThan(haut.demande);
    expect(juste(L_OFFRE_ET_LA_DEMANDE, "la-loi-de-la-demande", cas)).toBe("Plus le prix est bas, plus la demande reçue est grande");
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "au-prix-bas", cas)).toEqual({
      "Demande reçue en plus, au prix bas": bas.demande - base.demande,
      "Quantité échangée en plus, au prix bas": bas.echangee - base.echangee,
    });
    // Au prix bas, l'offre ne suit pas toute la demande ajoutée : l'explication le dit.
    expect(bas.echangee - base.echangee).toBeLessThan(bas.demande - base.demande);
  });

  it("la clientèle qui réagit le plus au prix est celle dont l'élasticité du scénario est la plus forte, et elle est unique", () => {
    const segments = scenarioByCode(code).scenario.market.segments;
    const max = Math.max(...segments.map((g) => Math.abs(g.priceElasticity)));
    expect(segments.filter((g) => Math.abs(g.priceElasticity) === max)).toHaveLength(1);
    const g = segments.find((x) => Math.abs(x.priceElasticity) === max)!;
    expect(juste(L_OFFRE_ET_LA_DEMANDE, "qui-reagit-au-prix", cas)).toBe(g.name.replace(/\s*\(.*\)\s*$/, ""));
  });

  it("le cas : mettre plus en vente ne change pas la demande reçue, et l'on vend plus seulement là où des acheteurs repartaient", () => {
    const r1 = ref[0]!;
    const pose = r1.production.planned * (1 + HAUSSE_DE_LA_MISE_EN_VENTE);
    const a = rejouerAvec(code, "l-offre-et-la-demande:test-mise-en-vente", (tour, d) => (tour === 1 ? { ...d, productionPlan: pose } : undefined));
    const r = a[0]!;
    expect(r.production.planned).toBeCloseTo(pose, 6);
    // La capacité ne plafonne pas : tout le plan est produit.
    expect(r.production.produced).toBeCloseTo(pose, 6);
    // La demande reçue, clientèle par clientèle, est exactement celle du trimestre joué.
    for (const [seg, v] of Object.entries(r1.market.bySegment)) expect(r.market.bySegment[seg]!.demandForCompany, seg).toBe(v.demandForCompany);
    const d = Math.round(demande(r1));
    const oSans = Math.round(offreDuTrimestre(r1, stockAuDebut(code, 1)));
    const oAvec = Math.round(offreDuTrimestre(r, stockAuDebut(code, 1)));
    expect(Math.round(vendu(r))).toBe(Math.min(d, oAvec));
    expect(attendus(METTRE_PLUS_EN_VENTE, "ce-qui-s-echange", cas)).toEqual({
      "Quantité échangée, trimestre joué": Math.min(d, oSans),
      "Quantité échangée, avec 20 % de plus": Math.min(d, oAvec),
    });
    expect(attendus(METTRE_PLUS_EN_VENTE, "ce-qui-reste", cas)).toEqual({
      "Demande non servie, avec 20 % de plus": d - Math.min(d, oAvec),
      "Offre non vendue, avec 20 % de plus": oAvec - Math.min(d, oAvec),
    });
    const m = miseEnVenteAugmentee(cas);
    expect(m.demandeEnPlus).toBe(0);
    expect(m.verdict).toBe(d > oSans ? "vend-plus" : "rien-de-plus");
    expect(juste(METTRE_PLUS_EN_VENTE, "reponse", cas)).toBe(
      d > oSans ? "Elle vend plus, sans attirer un acheteur de plus" : "Elle ne vend rien de plus : la demande était servie",
    );
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(L_OFFRE_ET_LA_DEMANDE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(METTRE_PLUS_EN_VENTE, code));
});

describe.each(UNE_SEULE_OFFRE)("le prix qui équilibre le marché chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("le tâtonnement du chapitre est celui que le moteur joue, refait à la main", () => {
    const main = tatonnementALaMain(code, 1);
    const p = prixDEquilibre(cas);
    expect(p.essais.map((e) => [e.prix, e.demande, e.offre])).toEqual(main.essais.map((e) => [e.prix, e.demande, e.offre]));
    expect([p.milieu.prix, p.milieu.demande, p.milieu.offre]).toEqual([main.milieu.prix, main.milieu.demande, main.milieu.offre]);
    // Tous les essais d'avant le dernier sont du même côté que le prix de l'année ; le dernier passe de l'autre.
    for (const e of main.essais.slice(0, -1)) expect((e.demande - e.offre) * main.sens).toBeGreaterThan(0);
    expect((main.dernier.demande - main.dernier.offre) * main.sens).toBeLessThanOrEqual(0);
    expect(main.bas.prix).toBeLessThan(main.milieu.prix);
    expect(main.milieu.prix).toBeLessThan(main.haut.prix);
  });

  it("les champs attendent les écarts recomposés, et les verdicts suivent", () => {
    const m = tatonnementALaMain(code, 1);
    expect(attendus(LE_PRIX_D_EQUILIBRE, "le-tatonnement", cas)).toEqual({
      [`Demande − offre, à ${eur(m.depart.prix)}`]: m.depart.demande - m.depart.offre,
      [`Demande − offre, à ${eur(m.dernier.prix)}`]: m.dernier.demande - m.dernier.offre,
    });
    expect(attendus(LE_PRIX_D_EQUILIBRE, "au-milieu", cas)).toEqual({ [`Demande − offre, à ${eur(m.milieu.prix)}`]: m.milieu.demande - m.milieu.offre });
    const s = situation(m.depart.demande, m.depart.offre);
    expect(juste(LE_PRIX_D_EQUILIBRE, "penurie-ou-excedent", cas)).toBe(
      { penurie: "En pénurie : des acheteurs repartent sans être servis", excedent: "En excédent : une partie de l'offre reste invendue", equilibre: "À l'équilibre : la demande et l'offre se valent à peu près" }[s],
    );
    expect(juste(LE_PRIX_D_EQUILIBRE, "dans-quel-sens", cas)).toBe({ penurie: "Monter le prix", excedent: "Baisser le prix", equilibre: "Ne pas toucher au prix" }[s]);
    expect(juste(LE_PRIX_D_EQUILIBRE, "l-intervalle", cas)).toBe(`Entre ${eur(m.bas.prix)} et ${eur(m.haut.prix)}`);
    const sm = situation(m.milieu.demande, m.milieu.offre);
    expect(juste(LE_PRIX_D_EQUILIBRE, "le-prix-trouve", cas)).toBe(
      sm === "equilibre"
        ? `Tout près de ${eur(m.milieu.prix)}`
        : sm === "penurie"
          ? `Entre ${eur(m.milieu.prix)} et ${eur(m.haut.prix)}`
          : `Entre ${eur(m.bas.prix)} et ${eur(m.milieu.prix)}`,
    );
  });

  it("le cas : la fin d'année, rejouée à la main, et la réponse qui suit l'essai du milieu", () => {
    const m = tatonnementALaMain(code, TRIMESTRE_DE_FIN_D_ANNEE);
    const p = prixDeFinDAnnee(cas);
    expect(p.essais.map((e) => [e.prix, e.demande, e.offre])).toEqual(m.essais.map((e) => [e.prix, e.demande, e.offre]));
    expect(attendus(LE_PRIX_DE_FIN_D_ANNEE, "les-essais", cas)).toEqual({
      [`Demande − offre, à ${eur(m.depart.prix)}`]: m.depart.demande - m.depart.offre,
      [`Demande − offre, à ${eur(m.dernier.prix)}`]: m.dernier.demande - m.dernier.offre,
    });
    expect(attendus(LE_PRIX_DE_FIN_D_ANNEE, "le-milieu", cas)).toEqual({ [`Demande − offre, à ${eur(m.milieu.prix)}`]: m.milieu.demande - m.milieu.offre });
    const sm = situation(m.milieu.demande, m.milieu.offre);
    expect(juste(LE_PRIX_DE_FIN_D_ANNEE, "reponse", cas)).toBe(
      sm === "equilibre"
        ? `Tout près de ${eur(m.milieu.prix)}`
        : sm === "penurie"
          ? `Entre ${eur(m.milieu.prix)} et ${eur(m.haut.prix)}`
          : `Entre ${eur(m.bas.prix)} et ${eur(m.milieu.prix)}`,
    );
  });

  it("dans les cas, la bonne réponse ne se devine pas à sa longueur", () => {
    for (const s of [METTRE_PLUS_EN_VENTE, LE_PRIX_DE_FIN_D_ANNEE]) {
      const options = (s.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
      const bonne = options.find((o) => o.juste)!;
      expect(bonne.texte.length, s.code).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
    }
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(LE_PRIX_D_EQUILIBRE, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_PRIX_DE_FIN_D_ANNEE, code));
});

describe("les verdicts, sur les sept entreprises", () => {
  it("au prix de l'année, pénurie chez les unes, excédent chez les autres ; l'essai du milieu se lit de plusieurs façons", () => {
    const p = UNE_SEULE_OFFRE.map((c) => prixDEquilibre(casDeLEntreprise(c)));
    expect(UNE_SEULE_OFFRE.filter((_, i) => p[i]!.situation === "excedent")).toEqual(["hotel", "ecommerce"]);
    expect(UNE_SEULE_OFFRE.filter((_, i) => p[i]!.situation === "penurie")).toEqual(["nova", "bistrot", "conseil", "batiment", "transport"]);
    expect(new Set(p.map((x) => x.equilibre)).size).toBeGreaterThanOrEqual(2);
    // Chez ATLAS CONSEIL, peu de jours mis en vente pour beaucoup de demande : il faut cinq pas.
    expect(prixDEquilibre(casDeLEntreprise("conseil")).essais).toHaveLength(6);
  });

  it("le cas de l'offre : les deux réponses se rencontrent", () => {
    const v = UNE_SEULE_OFFRE.map((c) => miseEnVenteAugmentee(casDeLEntreprise(c)).verdict);
    expect(UNE_SEULE_OFFRE.filter((_, i) => v[i] === "rien-de-plus")).toEqual(["hotel", "ecommerce"]);
  });

  it("le cas de fin d'année : un prix d'équilibre au-dessus du prix de l'année chez les unes, en dessous chez les autres", () => {
    const p = UNE_SEULE_OFFRE.map((c) => prixDeFinDAnnee(casDeLEntreprise(c)));
    expect(UNE_SEULE_OFFRE.filter((_, i) => !p[i]!.auDessus)).toEqual(["batiment"]);
    expect(new Set(p.map((x) => x.equilibre)).size).toBeGreaterThanOrEqual(2);
    expect(() => chercherLePrix("nova", TRIMESTRE_DE_FIN_D_ANNEE)).not.toThrow();
  });

  it("chez NOVA, les chiffres des deux chapitres", () => {
    const nova = casDeLEntreprise("nova");
    expect(attendus(L_OFFRE_ET_LA_DEMANDE, "l-offre-et-l-echange", nova)).toEqual({ "Quantité échangée": 4778, "Demande non servie": 984, "Offre non vendue": 0 });
    const d = demandeSelonLePrix(nova);
    expect([d.bas.demande, d.base.demande, d.haut.demande]).toEqual([42644, 34627, 27625]);
    expect(d.echangeeEnPlus).toBe(492);
    const p = prixDEquilibre(nova);
    expect(p.essais.map((e) => e.prix)).toEqual([59, 64.9]);
    expect(p.milieu.prix).toBe(61.95);
    expect(p.milieu.demande - p.milieu.offre).toBe(175);
    expect(p.equilibre).toBe("au-dessus-du-milieu");
    const h = prixDEquilibre(casDeLEntreprise("hotel"));
    expect([h.milieu.prix, h.equilibre]).toEqual([83.6, "au-milieu"]);
  });
});
