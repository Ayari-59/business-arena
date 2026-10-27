import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CE_QUE_COUTE_UNE_LIVRAISON,
  ENTREPRISES_DE_LA_LIVRAISON,
  coutDUneLivraison,
} from "../../src/config/cours/chapitres/ce-que-coute-une-livraison";
import {
  DELAI_DE_REAPPROVISIONNEMENT,
  ENTREPRISES_DU_STOCK_DE_SECURITE,
  JOURS_DE_SECURITE,
  LE_STOCK_DE_SECURITE,
  stockDeLAnnee,
  stockEtPointDeCommande,
} from "../../src/config/cours/chapitres/le-stock-de-securite";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_GAZOLE_QUI_AUGMENTE, gazoleQuiAugmente, hausseDuGazole } from "../../src/config/cours/situations/par-chapitre/le-gazole-qui-augmente";
import {
  LE_POINT_DE_COMMANDE_AVANT_LE_PIC,
  pointDeCommandeDuPic,
} from "../../src/config/cours/situations/par-chapitre/le-point-de-commande-avant-le-pic";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX PREMIERS CHAPITRES DU PARCOURS 2DE PRO GATL · LE TRANSPORT ET LA LOGISTIQUE, ET LEURS
 * CAS PRATIQUES.
 *
 * Le stock de sécurité et le point de commande (chez le commerçant en ligne, le seul qui garde le
 * stock d'un seul produit acheté) et ce que coûte une livraison (chez le transporteur). Ces gardes
 * recomposent leurs chiffres avec le moteur : le stock de l'année trimestre par trimestre, la
 * demande perdue, la valeur du stock au bilan, les charges de structure qui ne bougent pas avec le
 * stock ; le coût variable que le moteur compte avec chaque offre de carburant (rejoué), les
 * salaires des chauffeurs dans les charges de structure, l'amortissement du parc, le prix de chaque
 * clientèle ; la hausse du gazole que le scénario programme. Elles vérifient aussi ce que les
 * textes affirment du moteur (aucun délai de réapprovisionnement, aucun kilomètre) et que les
 * textes se lisent : rien d'indéfini, pas de tiret au milieu d'une phrase, des élisions faites, des
 * accords justes avec les unités féminines, une seule bonne réponse, aucune option qui en contienne
 * une autre, des libellés uniques.
 */

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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "préparé", "perdu", "livré", "prévu", "emporté"];
const AFFICHENT_LEUR_TABLEAU: readonly Etape["type"][] = ["lecture", "choix", "montants", "tri"];

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
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      expect(x, `${e.id} : ${x}`).not.toMatch(/« «|» »/);
      // Pas de capitales espacées, pas de nombre écrit en lettres devant ce qu'il compte.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-ZÉ] [A-ZÉ] [A-ZÉ]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (clientèles|trimestres|jours|chauffeurs|offres|entreprises)\b/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}/);
      if (UNITES_FEMININES.has(u)) expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
    }
    if (e.tableau) {
      expect(AFFICHENT_LEUR_TABLEAU, `${e.id} (${e.type})`).toContain(e.type);
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
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      const codes = new Set(e.categories.map((k) => k.code));
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      for (const x of elements) {
        expect(codes.has(x.categorie), `${e.id} : ${x.libelle}`).toBe(true);
        // Le test de bout en bout trouve l'élément par son libellé, dans un attribut entre guillemets.
        expect(x.libelle, e.id).not.toContain('"');
      }
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse du cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length, `${s.code} chez ${code}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

/** Les champs d'une étape de montants, par libellé. */
function champs(ch: Chapitre, id: string, cas: Cas): Record<string, number> {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "montants") throw new Error(`${id} n'est pas une étape de montants`);
  return Object.fromEntries(e.champs(cas, { soldes: {} }).map((c) => [c.libelle, c.attendu]));
}

const justeDe = (ch: Chapitre, id: string, cas: Cas) => {
  const e = ch.etapes.find((x) => x.id === id)!;
  if (e.type !== "choix") throw new Error(`${id} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const auCent = (x: number) => Math.round(x * 100) / 100;
const BLOC = "2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion";

describe("les deux chapitres et leurs cas, dans le parcours 2de pro GATL · Le transport et la logistique", () => {
  it("portent les titres du programme, au palier 1, et un bloc du vademecum qui se résout", () => {
    for (const ch of [LE_STOCK_DE_SECURITE, CE_QUE_COUTE_UNE_LIVRAISON]) {
      expect(PROGRAMME.logistique[1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("logistique");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual([BLOC]);
      for (const bloc of ch.blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite?.code, bloc).toBe("seconde-pro-gatl");
        expect(blocOfficiel(bloc, cite!.code), bloc).toBe(bloc.replace("2de pro GATL · ", ""));
      }
    }
    expect(LE_STOCK_DE_SECURITE.code).toBe("le-stock-de-securite");
    expect(CE_QUE_COUTE_UNE_LIVRAISON.code).toBe("ce-que-coute-une-livraison");
    expect(PROGRAMME.logistique[1]!.slice(0, 2)).toEqual([LE_STOCK_DE_SECURITE.titre, CE_QUE_COUTE_UNE_LIVRAISON.titre]);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const paires: [Situation, Chapitre][] = [
      [LE_POINT_DE_COMMANDE_AVANT_LE_PIC, LE_STOCK_DE_SECURITE],
      [LE_GAZOLE_QUI_AUGMENTE, CE_QUE_COUTE_UNE_LIVRAISON],
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
    }
  });

  it("le stock de sécurité se joue chez la seule entreprise qui garde le stock d'un seul produit acheté", () => {
    expect(LE_STOCK_DE_SECURITE.entreprises?.codes).toBe(ENTREPRISES_DU_STOCK_DE_SECURITE);
    expect(LE_STOCK_DE_SECURITE.entreprises?.pourquoi.length).toBeGreaterThan(20);
    // Celles qui gardent un stock d'un trimestre à l'autre : le commerçant en ligne, la boutique (une gamme), le bâtiment (des chantiers).
    const gardent = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.perishable && anneeJouee(code).depart.finishedGoods.quantity > 0);
    expect(gardent).toEqual(["boutique", "ecommerce", "batiment"]);
    expect(scenarioByCode("boutique").scenario.products!.length).toBeGreaterThan(1);
    expect(scenarioByCode("batiment").vocabulary.leftoverLabel).toBe("Chantiers en cours");
    expect(scenarioByCode("ecommerce").scenario.products ?? []).toHaveLength(0);
    // NOVA garde son stock, mais n'en a jamais : elle fabrique ce qu'elle vend.
    expect(anneeJouee("nova").partie.rounds.every((t) => t.companies.find((x) => x.id === "joueur")!.finishedGoods.quantity < 1)).toBe(true);
  });

  it("ce que coûte une livraison se joue chez le transporteur, qui vend des palettes et ne connaît pas les kilomètres", () => {
    expect(CE_QUE_COUTE_UNE_LIVRAISON.entreprises?.codes).toBe(ENTREPRISES_DE_LA_LIVRAISON);
    expect([...ENTREPRISES_DE_LA_LIVRAISON]).toEqual(["transport"]);
    expect(CE_QUE_COUTE_UNE_LIVRAISON.entreprises?.pourquoi).toContain("ROUTE & CIE");
    const def = scenarioByCode("transport");
    expect(def.vocabulary.unit).toBe("palette");
    // Aucune grandeur de kilomètres dans la configuration du scénario : il compte des palettes.
    expect(JSON.stringify(def.scenario)).not.toMatch(/kilom|"km/i);
  });
});

describe.each(ENTREPRISES_DU_STOCK_DE_SECURITE)("le stock de sécurité chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;
  const { partie, depart } = anneeJouee(code);
  const resultats = partie.rounds.map((t) => t.results["joueur"]!);
  const finDe = (k: number) => partie.rounds[k]!.companies.find((x) => x.id === "joueur")!.finishedGoods;

  it("le stock de l'année est celui que le moteur joue, trimestre par trimestre", () => {
    const a = stockDeLAnnee(cas);
    expect(a).toHaveLength(partie.rounds.length);
    expect(a[0]!.debut).toBe(depart.finishedGoods.quantity);
    for (const [k, t] of a.entries()) {
      const r = resultats[k]!;
      const segments = Object.values(r.market.bySegment);
      // Rien d'autre ne puise dans le stock : ni commande ferme, ni commande exceptionnelle.
      expect(r.orderOffer?.accepted ?? false, `T${k + 1}`).toBe(false);
      expect(soldUnits(r), `T${k + 1}`).toBeCloseTo(segments.reduce((x, v) => x + v.sold, 0), 6);
      expect(t.fin, `T${k + 1}`).toBe(Math.round(finDe(k).quantity));
      if (k > 0) expect(t.debut, `T${k + 1}`).toBe(a[k - 1]!.fin);
      expect(t.debut + t.entrees - t.ventes).toBe(t.fin);
      // Les entrées : ce que le moteur fait entrer en stock (le produit, moins les rebuts), au rond près.
      expect(Math.abs(t.entrees - (r.production.produced - (r.qualityCosts?.defectUnits ?? 0))), `T${k + 1}`).toBeLessThanOrEqual(1);
      expect(t.demande).toBe(Math.round(segments.reduce((x, v) => x + v.demandForCompany, 0)));
      expect(t.ventes).toBe(Math.round(soldUnits(r)));
      expect(Math.abs(t.perdues - segments.reduce((x, v) => x + v.lost, 0)), `T${k + 1}`).toBeLessThanOrEqual(1);
      for (const v of segments) if (v.sold > 0) expect(v.revenue / v.sold).toBeCloseTo(t.prix, 2);
      expect(t.valeurFin).toBe(auCent(r.balanceSheet.inventoryValue));
    }
  });

  it("le moteur ne pose aucun délai : ce qui est commandé dans un trimestre s'y vend ; le délai du cours est celui qu'annonce le fournisseur", () => {
    const a = stockDeLAnnee(cas);
    // Au premier trimestre, l'entreprise vend plus que son stock de départ : les entrées du trimestre ont servi dans le trimestre.
    expect(a[0]!.ventes).toBeGreaterThan(a[0]!.debut);
    const k = stockEtPointDeCommande(cas);
    const utilise = new Set(resultats.map((r) => r.supplier?.code));
    expect([...utilise]).toEqual([k.fournisseur.code]);
    expect(k.fournisseur.narrative).toContain(DELAI_DE_REAPPROVISIONNEMENT[code]!.annonce);
    expect(k.delai).toBe(DELAI_DE_REAPPROVISIONNEMENT[code]!.jours);
    // « Sous une semaine » : sept jours au plus.
    expect(k.delai).toBeLessThanOrEqual(7);
  });

  it("la demande par jour, le délai, la sécurité et le point de commande se recomposent", () => {
    const k = stockEtPointDeCommande(cas);
    const a = stockDeLAnnee(cas);
    // Le pic : le trimestre qui perd le plus ; la base, celui d'avant, qui sert toute sa demande.
    const pic = a.reduce((x, t) => (t.perdues > x.perdues ? t : x));
    expect(k.pic).toEqual(pic);
    expect(k.base).toEqual(a[pic.trimestre - 2]);
    expect(k.base.perdues).toBe(0);
    expect(k.jours).toBe(s.roundDays);
    const parJour = Math.ceil(k.base.demande / s.roundDays);
    expect(champs(LE_STOCK_DE_SECURITE, "par-jour", cas)["Demande par jour"]).toBe(parJour);
    expect(champs(LE_STOCK_DE_SECURITE, "pendant-le-delai", cas)["Consommation pendant le délai"]).toBe(parJour * k.delai);
    expect(champs(LE_STOCK_DE_SECURITE, "securite", cas)["Stock de sécurité"]).toBe(parJour * JOURS_DE_SECURITE);
    expect(champs(LE_STOCK_DE_SECURITE, "point-de-commande", cas)["Point de commande"]).toBe(parJour * (k.delai + JOURS_DE_SECURITE));
    expect(justeDe(LE_STOCK_DE_SECURITE, "commander", cas)).toBe(
      k.base.fin > k.pointDeCommande ? "Pas encore : le stock est au-dessus du point de commande" : "Tout de suite : le stock est sous le point de commande",
    );
    if (k.base.fin > k.pointDeCommande) expect(k.joursAvantDeCommander).toBe(Math.floor((k.base.fin - k.pointDeCommande) / parJour));
  });

  it("le stock qui déborde : sa couverture, sa valeur au bilan, et aucun coût de stockage dans le moteur", () => {
    const k = stockEtPointDeCommande(cas);
    expect(champs(LE_STOCK_DE_SECURITE, "deborde", cas)["Jours couverts par le stock"]).toBe(Math.floor(k.base.fin / k.parJour));
    expect(k.couverture).toBeGreaterThan(k.delai + JOURS_DE_SECURITE);
    const r = resultats[k.base.trimestre - 1]!;
    expect(k.base.valeurFin).toBe(auCent(r.balanceSheet.inventoryValue));
    expect(k.base.valeurFin).toBeGreaterThan(0);
    // Les charges de structure ne suivent pas le stock : les mêmes chaque trimestre, celles du scénario.
    for (const t of resultats) expect(t.incomeStatement.fixedCosts).toBe(s.fixedCostsPerRound);
    expect(k.base.chargesFixes).toBe(s.fixedCostsPerRound);
  });

  it("le stock qui manque : ce qui était disponible, la demande perdue et le chiffre d'affaires, comme le moteur", () => {
    const k = stockEtPointDeCommande(cas);
    const r = resultats[k.pic.trimestre - 1]!;
    const segments = Object.values(r.market.bySegment);
    const m = champs(LE_STOCK_DE_SECURITE, "manque", cas);
    const ouverture = finDe(k.pic.trimestre - 2).quantity;
    expect(Math.abs(m["Disponible pour les clients"]! - (ouverture + r.production.produced - (r.qualityCosts?.defectUnits ?? 0)))).toBeLessThanOrEqual(1);
    expect(m["Disponible pour les clients"]).toBe(k.pic.ventes);
    expect(m["Commandes perdues"]).toBe(k.pic.demande - k.disponibles);
    expect(Math.abs(m["Commandes perdues"]! - segments.reduce((x, v) => x + v.lost, 0))).toBeLessThanOrEqual(1);
    expect(m["Chiffre d'affaires perdu"]).toBe(auCent(m["Commandes perdues"]! * k.pic.prix));
    // Le stock s'est vidé : le moteur finit le trimestre sans rien.
    expect(k.pic.fin).toBe(0);
    expect(finDe(k.pic.trimestre - 1).quantity).toBeLessThan(0.5);
    // L'arène sert chaque clientèle au même taux.
    const taux = segments.map((v) => v.sold / v.demandForCompany);
    for (const t of taux) expect(t).toBeCloseTo(taux[0]!, 6);
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(LE_STOCK_DE_SECURITE, code));
});

describe.each(ENTREPRISES_DU_STOCK_DE_SECURITE)("le point de commande avant le pic chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("le point du pic se recompose, et l'ancien laisse sans réponse ce que le calcul dit", () => {
    const p = pointDeCommandeDuPic(cas);
    const k = stockEtPointDeCommande(cas);
    const parJour = Math.ceil(k.pic.demande / k.jours);
    const nouveau = champs(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "nouveau-point", cas);
    expect(nouveau[`Demande par jour au trimestre ${k.pic.trimestre}`]).toBe(parJour);
    expect(nouveau["Nouveau point de commande"]).toBe(parJour * (k.delai + JOURS_DE_SECURITE));
    const ancien = champs(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "ancien-point", cas);
    expect(ancien["Demande pendant le délai"]).toBe(parJour * k.delai);
    expect(ancien["Commandes sans réponse à chaque réassort"]).toBe(Math.max(0, parJour * k.delai - k.pointDeCommande));
    expect(p.chiffreDAffairesPerdu).toBe(auCent(p.perdues * k.pic.prix));
    expect(p.nouveauPoint).toBeGreaterThan(k.pointDeCommande);
    expect(justeDe(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, "reponse", cas)).toBe(
      p.perdues > 0 ? `Passer à ${p.nouveauPoint.toLocaleString("fr-FR")}, calculé sur la demande du pic` : `Garder ${k.pointDeCommande.toLocaleString("fr-FR")} : le stock de sécurité suffira`,
    );
    // Les ventes que la réponse cite sont celles que le moteur a perdues au pic.
    const r = anneeJouee(code).partie.rounds[k.pic.trimestre - 1]!.results["joueur"]!;
    expect(Math.abs(k.perdues - Object.values(r.market.bySegment).reduce((x, v) => x + v.lost, 0))).toBeLessThanOrEqual(1);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, code);
    reponseSansIndice(LE_POINT_DE_COMMANDE_AVANT_LE_PIC, code);
  });
});

describe.each(ENTREPRISES_DE_LA_LIVRAISON)("ce que coûte une livraison chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const def = scenarioByCode(code);
  const s = def.scenario;
  const { partie, depart } = anneeJouee(code);
  const r = partie.rounds[0]!.results["joueur"]!;

  it("au premier trimestre, chaque place mise en route a été remplie : les palettes livrées sont celles que le moteur vend", () => {
    const k = coutDUneLivraison(cas);
    expect(k.palettes).toBe(Math.round(soldUnits(r)));
    expect(Math.abs(r.production.produced - soldUnits(r))).toBeLessThan(0.5);
    expect(r.orderOffer?.accepted ?? false).toBe(false);
  });

  it("la route d'une palette est le coût variable du moteur, avec chaque offre de carburant (rejouée)", () => {
    const k = coutDUneLivraison(cas);
    expect(r.supplier?.code).toBe(k.fournisseur.code);
    expect(k.fournisseur.code).toBe(s.suppliers![0]!.code);
    expect(champs(CE_QUE_COUTE_UNE_LIVRAISON, "route", cas)["Coût de la route par palette"]).toBe(auCent(r.breakeven.unitVariableCost));
    expect(k.route).toBe(auCent(s.product.materialCostPerUnit * k.fournisseur.costMultiplier + s.product.otherVariableCostPerUnit));
    // Le moteur charge la route sur chaque place mise en route.
    expect(r.incomeStatement.variableProductionCost).toBeCloseTo(k.route * r.production.produced, 2);
    const autres = champs(CE_QUE_COUTE_UNE_LIVRAISON, "offres-de-carburant", cas);
    expect(Object.keys(autres)).toHaveLength(s.suppliers!.length - 1);
    for (const f of k.autresOffres) {
      const rejoue = rejouerAvec(code, `ce-que-coute-une-livraison:carburant-${f.code}`, (_tour, d) => ({ ...d, supplierChoice: f.code }))[0]!;
      expect(rejoue.supplier?.code, f.code).toBe(f.code);
      expect(auCent(rejoue.breakeven.unitVariableCost), f.code).toBe(f.route);
      expect(autres[`Route par palette, ${f.name.charAt(0).toLowerCase()}${f.name.slice(1)}`], f.code).toBe(f.route);
    }
  });

  it("le chauffeur et les camions : les charges du trimestre que le moteur compte, réparties sur les palettes livrées", () => {
    const k = coutDUneLivraison(cas);
    const hr = s.hr!;
    // Les chauffeurs de départ sont ceux que les charges de structure du scénario comprennent.
    expect(depart.headcount).toBe(hr.includedHeadcount);
    expect(r.incomeStatement.fixedCosts).toBe(s.fixedCostsPerRound);
    const ch = champs(CE_QUE_COUTE_UNE_LIVRAISON, "chauffeur", cas);
    expect(ch["Salaires des chauffeurs du trimestre"]).toBe(hr.includedHeadcount * hr.salaryPerEmployeePerRound);
    expect(ch["Part du chauffeur par palette"]).toBe(auCent(ch["Salaires des chauffeurs du trimestre"]! / k.palettes));
    expect(k.autresCharges).toBe(s.fixedCostsPerRound - ch["Salaires des chauffeurs du trimestre"]!);
    expect(k.capacite).toBe(Math.round(Math.min(r.production.machineCapacity, r.production.laborCapacity)));
    // L'usure des camions : l'amortissement du parc, lot par lot, tel que le moteur le compte.
    const types = new Map(s.equipment!.types.map((t) => [t.code, t]));
    const parc = depart.fleet!.reduce((x, l) => x + (l.count * types.get(l.typeCode)!.costPerUnit) / types.get(l.typeCode)!.depreciationRounds, 0);
    expect(r.incomeStatement.depreciation).toBeCloseTo(parc, 6);
    expect(k.amortissement).toBe(auCent(r.incomeStatement.depreciation));
    expect(k.entretienDeLaFlotte).toBe(auCent(r.incomeStatement.maintenanceCost));
    expect(champs(CE_QUE_COUTE_UNE_LIVRAISON, "camions", cas)["Part des camions par palette"]).toBe(auCent((k.amortissement + k.entretienDeLaFlotte) / k.palettes));
  });

  it("le coût d'une palette, ce qui reste au prix, et le prix de chaque clientèle", () => {
    const k = coutDUneLivraison(cas);
    const m = champs(CE_QUE_COUTE_UNE_LIVRAISON, "cout-et-prix", cas);
    expect(m["Coût d'une palette livrée"]).toBe(auCent(k.route + k.chauffeurParPalette + k.camionsParPalette));
    expect(m["Ce qui reste par palette"]).toBe(auCent(k.prix - m["Coût d'une palette livrée"]!));
    // Un seul prix par palette : le chiffre d'affaires du moteur, divisé par les palettes vendues.
    expect(k.prix).toBeCloseTo(r.incomeStatement.revenue / soldUnits(r), 2);
    expect(k.clienteles.map((l) => l.code)).toEqual(s.market.segments.map((g) => g.code));
    for (const l of k.clienteles) {
      const v = r.market.bySegment[l.code]!;
      expect(l.prix).toBe(auCent(v.revenue / v.sold));
      expect(l.prix).toBe(k.prix);
      expect(l.delai).toBe(s.market.segments.find((g) => g.code === l.code)!.paymentDelayDays);
    }
    const n = k.clienteles.length;
    const couvrent = k.clienteles.filter((l) => l.prix >= m["Coût d'une palette livrée"]!).length;
    expect(justeDe(CE_QUE_COUTE_UNE_LIVRAISON, "clienteles", cas)).toBe(
      couvrent === n
        ? "Toutes : chacune paie plus que la palette ne coûte"
        : couvrent === 0
          ? "Aucune : le prix ne couvre pas ce que coûte une palette"
          : "Une partie seulement : les autres paient moins que le coût",
    );
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(CE_QUE_COUTE_UNE_LIVRAISON, code));
});

describe.each(ENTREPRISES_DE_LA_LIVRAISON)("le gazole qui augmente chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const s = scenarioByCode(code).scenario;

  it("la hausse est celle que le scénario programme, et le moteur compte ce trimestre-là la route que l'élève trouve", () => {
    const h = hausseDuGazole(code);
    const programme = s.scriptedEvents!.find((p) => p.round === h.trimestre)!;
    const ev = s.events.find((e) => e.code === programme.eventCode)!;
    expect(ev.modifiers).toEqual([{ target: "material_cost", op: "mul", value: 1 + h.taux }]);
    const g = gazoleQuiAugmente(cas);
    const route = champs(LE_GAZOLE_QUI_AUGMENTE, "route", cas);
    expect(route["Hausse par palette"]).toBe(auCent(g.k.carburant * h.taux));
    expect(route["Nouveau coût de la route par palette"]).toBe(auCent(g.k.route + route["Hausse par palette"]!));
    const r = anneeJouee(code).partie.rounds[h.trimestre - 1]!.results["joueur"]!;
    expect(r.supplier?.code).toBe(g.k.fournisseur.code);
    expect(auCent(r.breakeven.unitVariableCost)).toBe(route["Nouveau coût de la route par palette"]);
    // Avant la hausse, le coût variable du moteur est celui du chapitre.
    const avant = anneeJouee(code).partie.rounds[h.trimestre - 2]!.results["joueur"]!;
    expect(auCent(avant.breakeven.unitVariableCost)).toBe(g.k.route);
  });

  it("le nouveau coût d'une palette, ce qui reste, et le verdict qui en découle", () => {
    const g = gazoleQuiAugmente(cas);
    const m = champs(LE_GAZOLE_QUI_AUGMENTE, "reste", cas);
    expect(m["Coût d'une palette livrée"]).toBe(auCent(g.route + g.k.chauffeurParPalette + g.k.camionsParPalette));
    expect(m["Ce qui reste par palette"]).toBe(auCent(g.k.prix - m["Coût d'une palette livrée"]!));
    expect(g.enPlusPourLeClient).toBeGreaterThan(g.hausse);
    expect(justeDe(LE_GAZOLE_QUI_AUGMENTE, "reponse", cas)).toBe(
      m["Ce qui reste par palette"]! >= 0 ? "Garder le prix : la palette couvre encore son coût" : "Monter le prix : la palette coûte plus qu'elle ne rapporte",
    );
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LE_GAZOLE_QUI_AUGMENTE, code);
    reponseSansIndice(LE_GAZOLE_QUI_AUGMENTE, code);
  });
});
