import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { PREMIERE_PARTIE_DE_LA_SUITE } from "../../src/config/cours/jouez";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS } from "../../src/config/cours/registre";
import { SITUATIONS } from "../../src/config/cours/situations";
import type { Chapitre, Etape } from "../../src/config/cours/types";
import { chapitreDuCas, etatApres, etatAvant, indexDeLEtape } from "../../src/pedagogy/cours/deroule";

/**
 * AUCUN TEXTE DU COURS NE PRÉSENTE UN DÉLAI DE PAIEMENT DE PLUS DE 60 JOURS COMME CONVENU OU ACCEPTÉ.
 *
 * Entre professionnels, le délai convenu ne peut pas dépasser 60 jours après la facture, ou 45 jours
 * fin de mois (code de commerce, article L. 441-10). Décision du propriétaire : dans le monde du cours,
 * CampusTech paie à 60 jours, le délai convenu, et à l'heure ; un délai plus long ne se présente jamais
 * comme convenu ou acceptable. Un client qui paie au-delà est en retard : le texte peut le dire en
 * hypothèse de retard, ou rappeler le plafond.
 *
 * La garde rend tous les textes de tous les chapitres et de tous les cas, dans chacune des entreprises
 * où ils se jouent (questions, options et retours, champs et calculs, tableaux, pièces, curseurs,
 * laboratoires), et refuse :
 * - un délai de plus de 60 jours écrit comme une condition (« payable à 80 jours », « paie NOVA à
 *   80 jours », « accorder 140 jours », « Délai de paiement : 80 jours ») ou jugé « acceptable » ; une
 *   demande (« délai demandé : 90 jours ») n'est pas un accord, sauf « demande à payer à 160 jours »,
 *   qui se lit comme une condition ;
 * - une échéance datée à plus de 60 jours de la facture (« facture du 20 janvier, payable le 10 avril »).
 * Un texte qui parle de retard, d'hypothèse ou du plafond légal est permis.
 */

const PARCOURT_TOUT_LE_CATALOGUE = 120_000;

/** Le délai maximal qu'un professionnel peut convenir avec un autre (code de commerce, art. L. 441-10). */
const PLAFOND = 60;

interface Texte {
  code: string;
  entreprise: string;
  etape: string;
  texte: string;
}

/** Tout ce qu'une étape montre à l'élève, rendu dans une entreprise. */
function textesDeLEtape(ch: Chapitre, e: Etape, i: number, cas: Cas): string[] {
  const t: string[] = [e.titre];
  if (e.tableau) {
    const tb = e.tableau(cas);
    // Chaque ligne se lit dans les deux sens : « Délai demandé | 110 jours », et la date de la facture avant son échéance.
    t.push(tb.titre, tb.colonnes.join(" | "), ...tb.lignes.flatMap((l) => [`${l.libelle} | ${l.valeurs.join(" | ")}`, `${l.valeurs.join(" | ")} | ${l.libelle}`]));
  }
  const avant = etatAvant(ch, cas, i);
  switch (e.type) {
    case "lecture":
      t.push(...e.texte(cas), e.repere?.(cas) ?? "");
      break;
    case "ecriture": {
      t.push(e.evenement(cas), ...e.indices(cas), ...e.explication(cas, etatApres(ch, cas, i)));
      const p = e.piece?.(cas);
      if (p) t.push([p.nature, p.de, p.a, p.date, ...p.lignes.map((l) => l.libelle), ...p.totaux.map((x) => x.libelle), p.mention ?? ""].join(" | "));
      break;
    }
    case "choix":
      t.push(e.question(cas, avant), ...e.options(cas, avant).flatMap((o) => [o.texte, o.retour]));
      break;
    case "montants":
      t.push(e.question(cas, avant), ...e.champs(cas, avant).flatMap((c) => [c.libelle, c.calcul]), ...e.explication(cas, etatApres(ch, cas, i)));
      break;
    case "comparaison": {
      const k = indexDeLEtape(ch, e.avantLEtape);
      const a = etatAvant(ch, cas, k);
      const b = etatApres(ch, cas, k);
      t.push(e.question(cas), e.libelles.avant, e.libelles.apres, ...e.options(cas, a, b).flatMap((o) => [o.texte, o.retour]), ...e.explication(cas, a, b));
      break;
    }
    case "tri":
      t.push(e.question(cas), ...e.categories.map((c) => c.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas));
      break;
    case "curseur": {
      const cible = e.cible(cas);
      const g = e.grandeur?.(cas);
      const r = e.rates?.(cas);
      t.push(e.question(cas), g ? `${g.libelle} (${g.unite})` : "", r?.dessous ?? "", r?.dessus ?? "", ...(e.zones ?? []), ...e.droites(cas).libelles);
      t.push(...e.lecture(cas, cible.attendu).map((l) => l.libelle), ...e.explication(cas));
      break;
    }
    case "simulation": {
      const leviers = e.leviers(cas);
      const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
      const d = e.defi(cas);
      t.push(e.question(cas), ...leviers.flatMap((l) => [`${l.libelle} (${l.unite}) : de ${l.min} à ${l.max}, au départ ${l.depart}`, ...(l.choix ?? []).map((c) => c.libelle)]));
      t.push(d.consigne, d.indice(depart), ...e.lecture(cas, depart).map((l) => l.libelle), ...e.lecture(cas, d.solution).map((l) => l.libelle), ...e.explication(cas, d.solution));
      break;
    }
  }
  return t;
}

/** Tous les textes du catalogue, chapitre par chapitre et cas par cas, dans chaque entreprise permise. */
function tousLesTextes(): Texte[] {
  const sortie: Texte[] = [];
  for (const chapitre of [...CHAPITRES, ...SITUATIONS]) {
    for (const entreprise of chapitre.entreprises?.codes ?? ENTREPRISES_DU_COURS) {
      const cas = casDeLEntreprise(entreprise);
      const ch = chapitreDuCas(chapitre, cas);
      const ajoute = (etape: string, texte: string) => sortie.push({ code: chapitre.code, entreprise, etape, texte: texte.replace(/[  ]/g, " ") });
      [ch.titre, ch.accroche, ...ch.objectifs, ch.entreprises?.pourquoi ?? ""].forEach((x) => ajoute("en-tête", x));
      ch.etapes.forEach((e, i) => textesDeLEtape(ch, e, i, cas).forEach((x) => ajoute(e.id, x)));
    }
  }
  return sortie;
}

/** Un texte qui dit le retard, l'hypothèse ou le plafond légal : il ne présente pas le délai comme convenu. */
const DIT_LE_RETARD_OU_LE_PLAFOND =
  /retard|plafond|constaté|en fait|vraiment|L\. ?441-10|\bla loi\b|légal|interdit|au-delà des \d+ jours convenus|au-delà du délai|hypothèse|\bsi [^.]{0,60}\b(payait|paie|réglait|allongeait)\b|ne peut pas (dépasser|convenir)/i;

const N = String.raw`(\d{2,3}) ?(?:jours|j\b)`;

/** Les tournures qui présentent un délai comme une condition de paiement, ou l'acceptent. */
const CONDITIONS: RegExp[] = [
  new RegExp(String.raw`payables?\s+(?:à\s+)?${N}`, "gi"),
  new RegExp(String.raw`(?:pa(?:ie|ient|iera|ieront|yer|yée?s?)|règlen?t?|réglera|régleront|régler|reverse(?:ra)?|reverser)\s+(?:\S+\s+){0,3}?à\s+${N}`, "gi"),
  new RegExp(String.raw`accord(?:e|er|ée?|ent|erait|eriez)?\s+(?:\S+\s+){0,3}?${N}`, "gi"),
  new RegExp(String.raw`(?:délai de paiement(?! demandé)|délai accordé|délai du client|conditions?)[^.|]{0,40}?(?:\||:|de|à)\s*${N}`, "gi"),
  new RegExp(String.raw`demand\w*\s+(?:\S+\s+){0,3}?(?:payer|paiement|délai)[^.|]{0,30}?à\s+${N}`, "gi"),
];

/** « Acceptable » ou « accepter » à moins de 160 caractères d'un délai de plus de 60 jours. */
const ACCEPTE = /accept\w*/gi;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DEBUT_DU_MOIS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const DATE = new RegExp(String.raw`\b(1er|\d{1,2}) (${MOIS.join("|")})\b`, "g");
const jourDeLAnnee = (jour: string, mois: string) => DEBUT_DU_MOIS[MOIS.indexOf(mois)]! + (jour === "1er" ? 1 : Number(jour));

/** Une échéance datée (« payable le 10 avril », « paie le reste le 20 avril ») après une facture datée du même texte. */
const ECHEANCE_DATEE = new RegExp(String.raw`(?:payables?|pai(?:e|ent|era)|réglée?s?|entreront|arrivera)\s+(?:(?!\S*(?:après|avant))\S+\s+){0,4}?le (1er|\d{1,2}) (${MOIS.join("|")})`, "gi");

/** Une facture désignée par son mois (« Facture de janvier ») : elle court au plus tard du dernier jour de ce mois. */
const FACTURE_DU_MOIS = new RegExp(String.raw`\b(?:facture|vente|achat|livraison)s? de (${MOIS.join("|")})\b`, "gi");

/** Les défauts d'un texte : la tournure fautive et le délai qu'elle présente comme convenu. */
function delaisPresentesCommeConvenus(texte: string): string[] {
  if (DIT_LE_RETARD_OU_LE_PLAFOND.test(texte)) return [];
  const fautes: string[] = [];
  for (const re of CONDITIONS) for (const m of texte.matchAll(re)) if (Number(m[1]) > PLAFOND) fautes.push(m[0]);
  for (const m of texte.matchAll(ACCEPTE)) {
    const autour = texte.slice(Math.max(0, m.index! - 160), m.index! + 160);
    for (const d of autour.matchAll(new RegExp(N, "g"))) if (Number(d[1]) > PLAFOND) fautes.push(`${m[0]} … ${d[0]}`);
  }
  for (const m of texte.matchAll(ECHEANCE_DATEE)) {
    const echeance = jourDeLAnnee(m[1]!, m[2]!.toLowerCase());
    // La facture est la dernière date écrite avant l'échéance.
    const precedent = texte.slice(0, m.index!);
    const avant = [...precedent.matchAll(DATE)].at(-1);
    const duMois = [...precedent.matchAll(FACTURE_DU_MOIS)].at(-1);
    const facture = avant ? jourDeLAnnee(avant[1]!, avant[2]!) : duMois ? DEBUT_DU_MOIS[MOIS.indexOf(duMois[1]!.toLowerCase()) + 1] ?? 365 : null;
    if (facture === null) continue;
    const ecart = echeance - facture;
    if (ecart > PLAFOND && ecart < 365) fautes.push(`${(avant ?? duMois)![0]} … ${m[0]} (${ecart} jours)`);
  }
  return fautes;
}

describe("les délais de paiement entre professionnels", () => {
  it("la garde reconnaît un délai présenté comme convenu, et laisse passer le retard et le plafond", () => {
    expect(delaisPresentesCommeConvenus("La facture est payable à 80 jours.")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Un commercial accorderait 140 jours à CampusTech.")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Une chaîne de magasins qui revend ses produits et paie NOVA à 80 jours.")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Délai de paiement aujourd'hui | 80 jours")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Acceptable : le délai passe à 110 jours, chaque vente garde sa marge.")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Livraison et facture au cabinet, le 20 janvier, le reste payable le 20 avril")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("Facture de janvier du cabinet, payable par le client le 20 avril")).not.toEqual([]);
    expect(delaisPresentesCommeConvenus("La facture est payable à 60 jours, le 21 mars.")).toEqual([]);
    expect(delaisPresentesCommeConvenus("Facture de janvier du cabinet, payable le 21 mars, réglée en fait le 20 avril, en retard")).toEqual([]);
    expect(delaisPresentesCommeConvenus("Le cabinet paie à 90 jours, 30 jours au-delà des 60 jours convenus : il est en retard.")).toEqual([]);
    expect(delaisPresentesCommeConvenus("Impossible : la loi plafonne le délai convenu à 60 jours, 90 jours ne se négocient pas.")).toEqual([]);
    expect(delaisPresentesCommeConvenus("Le client paie à 30 jours.")).toEqual([]);
  });

  it(
    "aucun chapitre ni cas ne présente un délai de plus de 60 jours comme convenu ou acceptable",
    () => {
      const fautes = tousLesTextes().flatMap((t) => delaisPresentesCommeConvenus(t.texte).map((f) => `${t.code} @ ${t.entreprise} · ${t.etape} : « ${f} »`));
      expect([...new Set(fautes)]).toEqual([]);
    },
    PARCOURT_TOUT_LE_CATALOGUE,
  );
});

/** Les fautes de langue que la composition des textes produit : une élision ou une contraction manquée, un « −0 », un pluriel après 1. */
const FAUTES_DE_COMPOSITION: [string, RegExp][] = [
  // « à le comité », « à les laboratoires » ; pas « à le faire », où « le » est un pronom.
  ["contraction manquée", /(?<!\p{L})à les? (?!\p{L}+(?:er|ir|re)\b)\p{L}/u],
  // « de ATLAS CONSEIL », « que ATLAS CONSEIL », « de Électro-Composants » : un nom propre qui commence par une voyelle.
  ["élision manquée", /(?<!\p{L})(?:de|que|jusque|lorsque|puisque) [AEIOUYÉÈÊ]/u],
  ["zéro négatif", /[−-]0(?:,0+)? ?(?:€|%)/],
  ["pluriel après 1", /(?<![\d,.]|\d )(?<!\p{L})1 (?:articles|clients|enceintes|unités|pulls|chambres|couverts|repas|jours|heures|commandes)(?!\p{L})/u],
];

describe("les textes composés du catalogue", () => {
  it(
    "aucun texte n'a une élision ou une contraction manquée, un « −0 € », ni un pluriel après 1",
    () => {
      const fautes = tousLesTextes().flatMap((t) =>
        FAUTES_DE_COMPOSITION.flatMap(([nom, re]) => {
          const m = re.exec(t.texte);
          return m ? [`${t.code} @ ${t.entreprise} · ${t.etape} : ${nom}, « …${t.texte.slice(Math.max(0, m.index - 40), m.index + 40)}… »`] : [];
        }),
      );
      expect([...new Set(fautes)]).toEqual([]);
    },
    PARCOURT_TOUT_LE_CATALOGUE,
  );
});

/**
 * LES CHAPITRES ET LES CAS PASSÉS SUR LE MONDE DU COURS NE PARLENT DE L'ARÈNE QU'À LA FIN. Leurs chiffres
 * sont ceux de la simulation du cours : « le prix de l'arène », « l'année dans l'arène », « le résultat que
 * l'arène affiche » seraient faux. Seule la dernière étape renvoie à l'arène (« Dans l'arène, les chiffres
 * de votre entreprise seront différents »). Le registre de ces fichiers est celui de la garde
 * d'architecture (tests/architecture/monde-du-cours.test.ts), lu tel quel.
 */
function codesDuMonde(): Set<string> {
  const cours = join(process.cwd(), "src", "config", "cours");
  const garde = readFileSync(join(process.cwd(), "tests", "architecture", "monde-du-cours.test.ts"), "utf8");
  const registre = garde.slice(garde.indexOf("PASSES_SUR_LE_MONDE"), garde.indexOf("];", garde.indexOf("PASSES_SUR_LE_MONDE")));
  const fichiers = [...registre.matchAll(/"((?:chapitres|situations)\/[^"]+\.ts)"/g)].map((m) => m[1]!);
  const codes = new Set(fichiers.flatMap((f) => /\bcode: "([^"]+)",\s+parcours:/.exec(readFileSync(join(cours, f), "utf8"))?.slice(1) ?? []));
  // La suite d'un chapitre découpé vit dans le fichier de sa première partie, sur le même monde.
  for (const [suite, premiere] of Object.entries(PREMIERE_PARTIE_DE_LA_SUITE)) if (codes.has(premiere)) codes.add(suite);
  return codes;
}

describe("le monde du cours ne se dit pas l'arène", () => {
  it(
    "aucun chapitre ni cas sur le monde du cours ne parle de l'arène avant sa dernière étape",
    () => {
      const monde = codesDuMonde();
      expect(monde.size).toBeGreaterThan(130);
      const derniere = new Map([...CHAPITRES, ...SITUATIONS].map((ch) => [ch.code, ch.etapes.at(-1)!.id]));
      const fautes = tousLesTextes()
        .filter((t) => monde.has(t.code) && t.etape !== derniere.get(t.code) && /\barène\b/i.test(t.texte))
        .map((t) => `${t.code} · ${t.etape} : « ${t.texte.slice(0, 160)} »`);
      expect([...new Set(fautes)]).toEqual([]);
    },
    PARCOURT_TOUT_LE_CATALOGUE,
  );

  it("le résumé d'un parcours passé tout entier sur le monde du cours ne parle pas de l'arène", () => {
    const monde = codesDuMonde();
    const passes = PARCOURS.filter((p) => CHAPITRES.filter((ch) => ch.parcours === p.code).every((ch) => monde.has(ch.code)));
    expect(passes.map((p) => p.code)).toEqual(expect.arrayContaining(["mco", "ndrc", "stmg-gf", "gpme", "mhr", "fiscalite", "dscg-finance"]));
    expect(passes.filter((p) => /arène/.test(p.resume)).map((p) => `${p.code} : ${p.resume}`)).toEqual([]);
  });
});
