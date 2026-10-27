import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CREER_DES_RICHESSES,
  comptesDuMarche,
  lignesDesComptes,
  richessesDuMarche,
} from "../../src/config/cours/chapitres/creer-des-richesses";
import {
  ENTREPRISES_DE_LA_CONCURRENCE,
  HAUSSE_DU_PRIX,
  LA_CONCURRENCE,
  laConcurrence,
  marcheAuPrixMonte,
  marcheDeReference,
  prixMonte,
} from "../../src/config/cours/chapitres/la-concurrence";
import { valeurAjoutee } from "../../src/config/cours/chapitres/valeur-ajoutee-et-partage";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import { DE_COMBIEN_MONTER_LE_PRIX, HAUSSE_DOUCE, troisPrix } from "../../src/config/cours/situations/par-chapitre/de-combien-monter-le-prix";
import {
  DERNIER_TRIMESTRE,
  LE_MARCHE_A_T_IL_GRANDI,
  PREMIER_TRIMESTRE,
  deuxTrimestres,
} from "../../src/config/cours/situations/par-chapitre/le-marche-a-t-il-grandi";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtapeTri, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult, RoundDecisions } from "../../src/engine/types";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX CHAPITRES DE SECONDE SES « LA CONCURRENCE » ET « CRÉER DES RICHESSES », ET LEURS CAS.
 *
 * La concurrence : les trois entreprises de l'arène sur l'année du cours, puis l'année rejouée
 * avec le prix de l'élève monté à un prix absolu. Créer des richesses : la production, les
 * consommations intermédiaires et la valeur ajoutée des trois entreprises, et son partage. Ces
 * gardes recomposent les chiffres avec le moteur, sans passer par les fonctions des chapitres,
 * dans chaque entreprise où ils se jouent ; elles vérifient la liste des entreprises, le prix
 * joué à chaque trimestre du rejeu, les valeurs attendues des champs, des verdicts calculés qui
 * changent d'une entreprise à l'autre quand l'année le permet, et des textes qui se lisent.
 */

const etatVide: EtatDuCours = { soldes: {} };

/**
 * Une garde qui rejoue l'année (trois parties de quatre trimestres par entreprise) : les cinq
 * secondes par défaut de vitest ne suffisent pas quand la suite entière tourne en parallèle.
 */
const REJOUE_L_ANNEE = 60_000;

function textesDe(e: Etape, cas: Cas, etat: EtatDuCours): string[] {
  const tableau = e.tableau ? [e.tableau(cas).titre, ...e.tableau(cas).colonnes, ...e.tableau(cas).lignes.flatMap((l) => [l.libelle, ...l.valeurs])] : [];
  switch (e.type) {
    case "lecture":
      return [e.titre, ...e.texte(cas), e.repere?.(cas) ?? "", ...tableau];
    case "choix":
      return [e.titre, e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour]), ...tableau];
    case "montants":
      return [e.titre, e.question(cas, etat), ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]), ...e.explication(cas, etat), ...tableau];
    case "tri":
      return [e.titre, e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas), ...tableau];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "demandé", "servi", "produit", "dernier", "perdu", "gagné", "monté"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(new Set(chapitre.etapes.map((e) => e.id)).size, ch.code).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size, ch.code).toBe(chapitre.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    // Le test de bout en bout clique les boutons par leur nom : aucun titre ne s'y confond.
    expect(e.titre, e.id).not.toMatch(/v[ée]rifier|étape suivante|terminer|montrer la réponse|changer le signe|valider/i);
    if (e.tableau) expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|\bnull\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      // Pas de trait d'union entre deux mots comme un tiret, ni devant un nombre affiché.
      expect(x, `${e.id} : ${x}`).not.toMatch(/[a-zé]-\s|\s-[a-zé]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])le [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/« «|» »/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b([A-Z] ){2,}[A-Z]\b/);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+−|\s{2,}/);
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
        // Au centime : le montant se saisit tel quel, au téléphone comme à l'ordinateur.
        expect(auCentime(c.attendu), `${e.id} : ${c.libelle}`).toBe(c.attendu);
      }
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) expect(e.categories.map((k) => k.code), `${e.id} : ${x.libelle}`).toContain(x.categorie);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse du cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, etatVide);
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Les valeurs attendues des champs d'une étape de montants, par libellé. */
function attendus(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id) as EtapeMontants;
  return Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
}

/** L'option juste d'une étape de choix. */
const juste = (ch: Chapitre, id: string, cas: Cas) => (ch.etapes.find((x) => x.id === id) as EtapeChoix).options(cas, etatVide).find((o) => o.juste)!.texte;

const somme = (rs: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(rs.reduce((t, r) => t + f(r), 0));
const dixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom, comme les chapitres l'écrivent dans leurs libellés. */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

const PRIX = "2de SES · Comment se forment les prix sur un marché ?";
const RICHESSES = "2de SES · Comment crée-t-on des richesses et comment les mesure-t-on ?";

/** Les trois entreprises d'une année jouée, l'élève d'abord, et leurs trimestres. */
function lesTrois(code: string, rounds: readonly { results: Record<string, CompanyRoundResult> }[]) {
  const ids = ["joueur", ...scenarioByCode(code).bots.slice(0, 2).map((b) => b.id)];
  return ids.map((id) => rounds.map((t) => t.results[id]!));
}

describe("les deux chapitres de seconde SES et leurs cas, dans le parcours", () => {
  it("portent les titres du programme, au palier 1, et la question du référentiel de seconde SES qu'ils travaillent", () => {
    const paires: [Chapitre, string][] = [
      [LA_CONCURRENCE, PRIX],
      [CREER_DES_RICHESSES, RICHESSES],
    ];
    for (const [ch, bloc] of paires) {
      expect(PROGRAMME["seconde-ses"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("seconde-ses");
      expect(ch.palier).toBe(1);
      expect(ch.blocs).toEqual([bloc]);
      expect(ch.libre).toBe(false);
      // Le bloc porte le préfixe de la seconde SES, et désigne une entrée du texte, une seule.
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("seconde-ses");
      expect(blocOfficiel(bloc, "seconde-ses"), bloc).toBe(bloc.replace("2de SES · ", ""));
      // Un code neuf, qu'aucun autre chapitre du registre ne porte déjà.
      expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch), ch.code).toBe(false);
    }
    expect(PARCOURS.find((p) => p.code === "seconde-ses")!.formation).toBe("seconde-ses");
    expect(LA_CONCURRENCE.code).toBe("la-concurrence");
    expect(CREER_DES_RICHESSES.code).toBe("creer-des-richesses");
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [DE_COMBIEN_MONTER_LE_PRIX, LA_CONCURRENCE],
      [LE_MARCHE_A_T_IL_GRANDI, CREER_DES_RICHESSES],
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

  it("la concurrence se joue là où les clients choisissent leur vendeur ; la richesse créée, partout", () => {
    // Recompté sur le moteur : les entreprises dont les ventes ne comptent pas d'abord des abonnés gardés.
    const attendues = ENTREPRISES_DU_COURS.filter((code) => {
      const r = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
      return r.subscription === undefined;
    });
    expect(LA_CONCURRENCE.entreprises?.codes).toEqual(attendues);
    expect(ENTREPRISES_DE_LA_CONCURRENCE).toEqual(attendues);
    expect(attendues).not.toContain("fitness");
    expect(attendues).toHaveLength(ENTREPRISES_DU_COURS.length - 1);
    expect(CREER_DES_RICHESSES.entreprises).toBeUndefined();
    // Chacune des trois entreprises de chaque marché a une valeur ajoutée positive sur l'année.
    for (const code of ENTREPRISES_DU_COURS) {
      for (const v of comptesDuMarche(casDeLEntreprise(code))) expect(v.valeurAjoutee, `${code} · ${v.nom}`).toBeGreaterThan(0);
    }
  });
});

describe.each(ENTREPRISES_DE_LA_CONCURRENCE)("la concurrence chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const reference = marcheDeReference(code);
  const monte = marcheAuPrixMonte(code, HAUSSE_DU_PRIX);

  it("l'année de référence est l'année du cours, pour les trois entreprises ; le rejeu est celui de rejouerAvec", () => {
    const annee = anneeJouee(code).partie;
    const [a, b] = [lesTrois(code, reference.partie.rounds), lesTrois(code, annee.rounds)];
    a.forEach((rs, i) => expect(rs.map((r) => r.incomeStatement.netIncome)).toEqual(b[i]!.map((r) => r.incomeStatement.netIncome)));
    // L'entreprise de l'élève fait dans le rejeu exactement ce que rejouerAvec lui fait faire.
    const p = prixMonte(code, HAUSSE_DU_PRIX);
    const memeChangement = rejouerAvec(code, "la-concurrence:verification-du-prix-monte", (_t, d) => ({
      ...d,
      price: p.apres,
      ...(d.products
        ? { products: Object.fromEntries(Object.entries(d.products).map(([k, x]) => [k, { ...x, price: p.articles!.find((y) => y.article === k)!.apres }])) }
        : {}),
    }));
    expect(monte.partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome)).toEqual(memeChangement.map((r) => r.incomeStatement.netIncome));
  }, REJOUE_L_ANNEE);

  it("le rejeu joue le prix absolu à chaque trimestre : la hausse ne se compose pas", () => {
    const d1 = reference.jouees[0]!;
    const p = prixMonte(code, HAUSSE_DU_PRIX);
    expect(p.avant).toBe(d1.price);
    expect(p.apres).toBe(auCentime(d1.price * (1 + HAUSSE_DU_PRIX)));
    expect(monte.jouees).toHaveLength(4);
    for (const d of monte.jouees) {
      expect(d.price).toBe(p.apres);
      if (d1.products) for (const [k, x] of Object.entries(d.products!)) expect(x.price, k).toBe(auCentime(d1.products[k]!.price * (1 + HAUSSE_DU_PRIX)));
    }
    // Sans gamme, le prix moyen du premier trimestre de l'année du cours est le prix de la décision.
    const t1 = anneeJouee(code).partie.rounds[0]!.results["joueur"]!;
    if (!d1.products) expect(auCentime(t1.incomeStatement.revenue / soldUnits(t1))).toBe(d1.price);
    // Personne ne fait défaillance, ni dans l'année ni dans le rejeu.
    for (const m of [reference, monte]) for (const t of m.partie.rounds) for (const r of Object.values(t.results)) expect(r.defaillant ?? false).toBe(false);
  }, REJOUE_L_ANNEE);

  it("les champs attendent ce que le moteur donne, recomposé à la main, et les verdicts suivent", () => {
    const avant = lesTrois(code, reference.partie.rounds);
    const apres = lesTrois(code, monte.partie.rounds);
    const ventes = (rs: CompanyRoundResult[]) => somme(rs, soldUnits);
    const benefice = (rs: CompanyRoundResult[]) => somme(rs, (r) => r.incomeStatement.netIncome);
    const v = avant.map(ventes);
    const v2 = apres.map(ventes);
    const total = v.reduce((t, x) => t + x, 0);
    const noms = [cas.entreprise, ...scenarioByCode(code).bots.slice(0, 2).map((b) => b.name)];
    expect(attendus(LA_CONCURRENCE, "parts", cas)).toEqual({
      "Ventes du marché": total,
      ...Object.fromEntries(noms.map((n, i) => [`Part de marché ${dE(n)} (%)`, dixieme((v[i]! / total) * 100)])),
    });
    const total2 = v2.reduce((t, x) => t + x, 0);
    expect(attendus(LA_CONCURRENCE, "hausse", cas)).toEqual({
      [`Ventes perdues par ${cas.entreprise}`]: v[0]! - v2[0]!,
      [`Ventes gagnées par ${noms[1]}`]: v2[1]! - v[1]!,
      [`Ventes gagnées par ${noms[2]}`]: v2[2]! - v[2]!,
      [`Nouvelle part de marché ${dE(cas.entreprise)} (%)`]: dixieme((v2[0]! / total2) * 100),
    });
    // Qui vend le plus, à quel rang de prix.
    const prix = avant.map((rs, i) => somme(rs, (r) => r.incomeStatement.revenue) / v[i]!);
    const plus = v.indexOf(Math.max(...v));
    const rang = [...prix].sort((a, b) => a - b).indexOf(prix[plus]!);
    expect(juste(LA_CONCURRENCE, "prix-et-ventes", cas)).toBe(["Le moins cher des trois", "Celui dont le prix est entre les deux autres", "Le plus cher des trois"][rang]);
    // Le bénéfice de l'élève, avec et sans la hausse.
    expect(juste(LA_CONCURRENCE, "benefice", cas)).toMatch(benefice(apres[0]!) > benefice(avant[0]!) ? /^Il augmente/ : /^Il baisse/);
    // Où partent les clients : chez le concurrent qui en gagne le plus, ou chez personne.
    const destinations = [v2[1]! - v[1]!, v2[2]! - v[2]!, v[0]! - v2[0]! - (v2[1]! - v[1]!) - (v2[2]! - v[2]!)];
    const ou = destinations.indexOf(Math.max(...destinations));
    expect(juste(LA_CONCURRENCE, "ou-vont-les-clients", cas)).toBe([`Chez ${noms[1]}`, `Chez ${noms[2]}`, "Nulle part : ils n'achètent chez personne"][ou]);
    // L'année du cours finit en bénéfice chez l'élève.
    expect(benefice(avant[0]!)).toBeGreaterThan(0);
  }, REJOUE_L_ANNEE);

  it("le cas « de combien monter le prix » rejoue deux prix absolus, et sa réponse est le meilleur bénéfice", () => {
    const douce = marcheAuPrixMonte(code, HAUSSE_DOUCE);
    const p = prixMonte(code, HAUSSE_DOUCE);
    for (const d of douce.jouees) expect(d.price).toBe(p.apres);
    const benefice = (m: typeof douce) => somme(m.partie.rounds.map((t) => t.results["joueur"]!), (r) => r.incomeStatement.netIncome);
    const b = [benefice(reference), benefice(douce), benefice(monte)];
    const k = troisPrix(cas);
    expect([k.garder.benefice, k.douce.benefice, k.forte.benefice]).toEqual(b);
    expect(k.ecartDouce).toBe(b[1]! - b[0]!);
    expect(k.ecartForte).toBe(b[2]! - b[0]!);
    const meilleur = b.indexOf(Math.max(...b));
    expect(juste(DE_COMBIEN_MONTER_LE_PRIX, "reponse", cas)).toBe(["Garder le prix", "Monter de 5 %", "Monter de 10 %"][meilleur]);
    reponseSansIndice(DE_COMBIEN_MONTER_LE_PRIX, code);
  }, REJOUE_L_ANNEE);

  it("les textes du chapitre et du cas se lisent", () => {
    verifierLesTextes(LA_CONCURRENCE, code);
    verifierLesTextes(DE_COMBIEN_MONTER_LE_PRIX, code);
  }, REJOUE_L_ANNEE);
});

describe("les verdicts de la concurrence changent d'une entreprise à l'autre, autant que l'année le permet", () => {
  it("la hausse paie ici et pas là, les clients partent chez un concurrent ou nulle part, et la réponse du cas varie", () => {
    const k = ENTREPRISES_DE_LA_CONCURRENCE.map((code) => laConcurrence(casDeLEntreprise(code)));
    expect(new Set(k.map((x) => x.verdict))).toEqual(new Set(["gagne-plus", "gagne-moins"]));
    expect(new Set(k.map((x) => (x.ouVontLesClients === "personne" ? "personne" : "un-concurrent")))).toEqual(new Set(["personne", "un-concurrent"]));
    // Sur l'année du cours, le moins cher vend le plus dans chaque marché : la question n'a qu'une réponse ici.
    expect(new Set(k.map((x) => x.place))).toEqual(new Set(["moins-cher"]));
    const reponses = ENTREPRISES_DE_LA_CONCURRENCE.map((code) => troisPrix(casDeLEntreprise(code)).meilleur);
    expect(new Set(reponses)).toEqual(new Set(["garder", "douce", "forte"]));
  }, REJOUE_L_ANNEE);
});

describe.each(ENTREPRISES_DU_COURS)("créer des richesses chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const hr = s.hr!;

  /** La valeur ajoutée d'un vendeur, recomposée sur le compte de résultat du moteur. */
  function recompose(rs: readonly CompanyRoundResult[]) {
    const is = (r: CompanyRoundResult) => r.incomeStatement;
    const salaires = rs.reduce((t, r) => t + hr.includedHeadcount * hr.salaryPerEmployeePerRound + (r.hr?.cost ?? 0), 0);
    const consommations = rs.reduce(
      (t, r) =>
        t + is(r).cogs + (is(r).commissionCost ?? 0) + is(r).marketingCost + is(r).qualityCost + is(r).maintenanceCost + (is(r).engagementRse ?? 0) + (is(r).rdCost ?? 0) + is(r).fixedCosts,
      0,
    ) - salaires;
    const production = rs.reduce((t, r) => t + is(r).revenue, 0);
    return { production, consommations, valeurAjoutee: production - consommations, salaires, fixes: rs.reduce((t, r) => t + is(r).fixedCosts, 0) };
  }

  it("la valeur ajoutée de chaque vendeur est celle du compte de résultat, et se partage à l'euro près", () => {
    const annee = lesTrois(code, anneeJouee(code).partie.rounds);
    const k = richessesDuMarche(cas);
    k.vendeurs.forEach((v, i) => {
      const x = recompose(annee[i]!);
      expect(v.production).toBe(Math.round(x.production));
      expect(Math.abs(v.consommations - x.consommations), v.nom).toBeLessThanOrEqual(3);
      expect(Math.abs(v.valeurAjoutee - x.valeurAjoutee), v.nom).toBeLessThanOrEqual(3);
      expect(v.salaires).toBe(Math.round(x.salaires));
      expect(Math.abs(v.loyerEtFrais - (x.fixes - x.salaires)), v.nom).toBeLessThanOrEqual(3);
      // L'année du cours n'a ni placement ni exceptionnel : le profit est le bénéfice plus l'usure de l'équipement.
      expect(v.horsActivite).toBe(0);
      expect(v.profit).toBe(v.benefice + v.amortissement);
      expect(v.valeurAjoutee).toBe(v.salaires + v.interets + v.impots + v.profit);
      expect(v.consommations).toBe(lignesDesComptes(v).filter((l) => l.categorie === "ci").reduce((t, l) => t + l.montant, 0));
    });
    // Sans embauche, la valeur ajoutée de l'élève est celle du chapitre de gestion et finance, à l'euro près.
    if (anneeJouee(code).partie.rounds.every((t) => (t.results["joueur"]!.hr?.cost ?? 0) === 0)) {
      expect(Math.abs(k.entreprise.valeurAjoutee - valeurAjoutee(cas).va)).toBeLessThanOrEqual(3);
    }
  });

  it("les champs attendent ce que le calcul donne, et les verdicts suivent les comptes", () => {
    const k = richessesDuMarche(cas);
    const [e, a, b] = k.vendeurs;
    expect(attendus(CREER_DES_RICHESSES, "valeur-ajoutee", cas)).toEqual({
      "Consommations intermédiaires": e!.production - e!.valeurAjoutee,
      [`Valeur ajoutée ${dE(cas.entreprise)}`]: e!.valeurAjoutee,
    });
    const va = k.vendeurs.reduce((t, v) => t + v.valeurAjoutee, 0);
    expect(attendus(CREER_DES_RICHESSES, "valeur-du-marche", cas)).toEqual({
      [`Valeur ajoutée ${dE(a!.nom)}`]: a!.production - a!.consommations,
      [`Valeur ajoutée ${dE(b!.nom)}`]: b!.production - b!.consommations,
      "Valeur ajoutée du marché": va,
    });
    const salaires = k.vendeurs.reduce((t, v) => t + v.salaires, 0);
    expect(attendus(CREER_DES_RICHESSES, "partage", cas)).toEqual({
      [`Profit ${dE(cas.entreprise)}`]: e!.valeurAjoutee - e!.salaires - e!.interets - e!.impots,
      "Salaires versés par les trois vendeurs": salaires,
      "Part des salaires dans la valeur ajoutée du marché (%)": dixieme((salaires / va) * 100),
    });
    const plus = k.vendeurs.reduce((g, v) => (v.valeurAjoutee > g.valeurAjoutee ? v : g));
    expect(juste(CREER_DES_RICHESSES, "qui-cree-le-plus", cas)).toBe(plus.nom);
    expect(juste(CREER_DES_RICHESSES, "richesse-et-benefice", cas)).toBe(
      k.vendeurs.some((v) => v.benefice < 0)
        ? "Chaque vendeur crée de la richesse, même celui qui finit en perte"
        : "Chaque vendeur crée de la richesse, et tous finissent en bénéfice",
    );
    // Le tri range chaque ligne là où le chapitre la compte.
    const tri = CREER_DES_RICHESSES.etapes.find((x) => x.id === "ranger") as EtapeTri;
    const ci = tri.elements(cas).filter((x) => x.categorie === "ci").reduce((t, x) => t + x.montant, 0);
    expect(ci).toBe(e!.consommations);
  });

  it("le cas « le marché a-t-il grandi » lit le premier et le dernier trimestre", () => {
    const tours = anneeJouee(code).partie.rounds;
    const vaDuTrimestre = (t: number) =>
      lesTrois(code, [tours[t - 1]!]).reduce((total, rs) => total + recompose(rs).valeurAjoutee, 0);
    const k = deuxTrimestres(cas);
    expect(Math.abs(k.va.debut - vaDuTrimestre(PREMIER_TRIMESTRE))).toBeLessThanOrEqual(9);
    expect(Math.abs(k.va.fin - vaDuTrimestre(DERNIER_TRIMESTRE))).toBeLessThanOrEqual(9);
    const e = LE_MARCHE_A_T_IL_GRANDI.etapes.find((x) => x.id === "la-croissance") as EtapeMontants;
    const champs = Object.fromEntries(e.champs(cas, etatVide).map((c) => [c.libelle, c.attendu]));
    expect(champs["Variation de la valeur ajoutée du marché (%)"]).toBe(dixieme((k.va.fin / k.va.debut - 1) * 100));
    expect(juste(LE_MARCHE_A_T_IL_GRANDI, "reponse", cas)).toBe(k.va.fin > k.va.debut ? "Oui, la richesse créée a augmenté" : "Non, la richesse créée a baissé");
    reponseSansIndice(LE_MARCHE_A_T_IL_GRANDI, code);
  });

  it("les textes du chapitre et du cas se lisent", () => {
    verifierLesTextes(CREER_DES_RICHESSES, code);
    verifierLesTextes(LE_MARCHE_A_T_IL_GRANDI, code);
  });
});

describe("les verdicts de la richesse créée changent d'une entreprise à l'autre", () => {
  it("le plus gros chiffre d'affaires ne crée pas toujours le plus de richesse ; un vendeur en perte en crée ; le marché grandit ou recule", () => {
    const k = ENTREPRISES_DU_COURS.map((code) => richessesDuMarche(casDeLEntreprise(code)));
    expect(new Set(k.map((x) => x.plusGrandeValeur === x.plusGrosChiffre))).toEqual(new Set([true, false]));
    expect(new Set(k.map((x) => x.verdict))).toEqual(new Set(["meme-en-perte", "tous-en-benefice"]));
    const croissances = ENTREPRISES_DU_COURS.map((code) => deuxTrimestres(casDeLEntreprise(code)).croissance);
    expect(new Set(croissances)).toEqual(new Set(["hausse", "baisse"]));
  });
});

/** La décision jouée n'est jamais reconduite multipliée : un garde-fou de plus sur la forme du rejeu. */
describe("le prix monté reste un prix absolu", () => {
  it("rejouer deux fois le même prix rend la même partie, sans la rejouer", () => {
    const code = ENTREPRISES_DE_LA_CONCURRENCE[0]!;
    expect(marcheAuPrixMonte(code, HAUSSE_DU_PRIX)).toBe(marcheAuPrixMonte(code, HAUSSE_DU_PRIX));
    const d: RoundDecisions = marcheDeReference(code).jouees[0]!;
    expect(prixMonte(code, HAUSSE_DU_PRIX).apres).toBeGreaterThan(d.price);
  });
});
