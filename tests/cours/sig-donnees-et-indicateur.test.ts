import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { anneeJouee, casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import {
  CONSTRUIRE_UN_INDICATEUR_JUSTE,
  ECART_ALIGNE,
  indicateurDuPrix,
  positionDe,
} from "../../src/config/cours/chapitres/construire-un-indicateur-juste";
import {
  DES_DONNEES_A_L_INFORMATION,
  PART_STABLE,
  donneesALInformation,
  extraitDesVentes,
} from "../../src/config/cours/chapitres/des-donnees-a-l-information";
import { MARCHES } from "../../src/config/cours/chapitres/marche-et-part-de-marche";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { ECART_NEGLIGEABLE, LA_PART_DE_MARCHE_ANNONCEE, partAnnoncee } from "../../src/config/cours/situations/par-chapitre/la-part-de-marche-annoncee";
import { LE_TRIMESTRE_LE_PLUS_FORT, trimestreLePlusFort } from "../../src/config/cours/situations/par-chapitre/le-trimestre-le-plus-fort";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import type { CompanyRoundResult } from "../../src/engine/types";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LES DEUX PREMIERS CHAPITRES DU PARCOURS « SYSTÈMES D'INFORMATION DE GESTION » (BAC STMG), ET
 * LEURS CAS PRATIQUES.
 *
 * Des données à l'information : la table des ventes de l'année du cours, une ligne par trimestre
 * et par enseigne, filtrée, regroupée et calculée. Construire un indicateur juste : le prix moyen
 * du marché en moyenne simple des prix et en prix pondéré par les ventes. Ces gardes recomposent
 * leurs chiffres avec le moteur, dans chaque entreprise où ils se jouent, vérifient que les
 * champs attendent ces chiffres et que les verdicts se calculent, et que les textes se lisent :
 * rien d'indéfini, pas de tiret au milieu d'une phrase, des élisions faites, une seule bonne
 * réponse, des libellés uniques, des notions qui existent.
 */

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
    case "tri":
      return [e.question(cas), ...e.categories.map((k) => k.libelle), ...e.elements(cas).flatMap((x) => [x.libelle, x.pourquoi]), ...e.explication(cas), ...tableau];
    default:
      return [];
  }
}

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier"];

/** Les gardes de texte et de forme, communes aux chapitres et aux cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  expect(chapitre.etapes.length).toBe(ch.etapes.length);
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Un négatif prend le signe moins (la valeur attendue brute, que l'élève ne lit pas, garde son trait d'union).
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\s{2,}|\+−|\+-/);
      // Pas de capitales espacées, pas de nombre en toutes lettres devant ce qui se compte.
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b[A-Z] [A-Z] [A-Z]\b/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(quatre|cinq|six|sept|huit|neuf|dix) (entreprises?|trimestres?|enseignes?|points?|lignes?)\b/i);
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
      for (const c of champs) expect(Number.isFinite(c.attendu), `${e.id} : ${c.libelle}`).toBe(true);
    }
    if (e.type === "tri") {
      const elements = e.elements(cas);
      expect(new Set(elements.map((x) => x.libelle)).size, e.id).toBe(elements.length);
      // Le test de bout en bout trouve l'élément par son libellé, dans un attribut entre guillemets.
      for (const x of elements) expect(x.libelle, e.id).not.toMatch(/"/);
      for (const x of elements) expect(e.categories.map((k) => k.code), x.libelle).toContain(x.categorie);
      for (const x of elements) expect(Number.isFinite(x.montant), x.libelle).toBe(true);
    }
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur. */
function reponseSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  const e = s.etapes.at(-1)!;
  if (e.type !== "choix") throw new Error("la réponse est un choix");
  const options = e.options(cas, { soldes: {} });
  const juste = options.find((o) => o.juste)!;
  expect(juste.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
}

const etapeDe = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === etape);
  if (!e) throw new Error(`pas d'étape ${etape}`);
  return e;
};

const champ = (ch: Chapitre, etape: string, cas: Cas, debut: string) => {
  const e = etapeDe(ch, etape, cas);
  if (e.type !== "montants") throw new Error(`${etape} n'est pas une étape de montants`);
  const c = e.champs(cas, { soldes: {} }).find((x) => x.libelle.startsWith(debut));
  if (!c) throw new Error(`pas de champ « ${debut} » dans ${etape}`);
  return c.attendu;
};

const optionJuste = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = etapeDe(ch, etape, cas);
  if (e.type !== "choix") throw new Error(`${etape} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const vendus = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);
const potentiel = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.potential, 0);
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const idsDe = (code: string) => ["joueur", ...scenarioByCode(code).bots.slice(0, 2).map((b) => b.id)];

const CHAPITRES_SIG = [DES_DONNEES_A_L_INFORMATION, CONSTRUIRE_UN_INDICATEUR_JUSTE];
const PAIRES: [Situation, Chapitre][] = [
  [LE_TRIMESTRE_LE_PLUS_FORT, DES_DONNEES_A_L_INFORMATION],
  [LA_PART_DE_MARCHE_ANNONCEE, CONSTRUIRE_UN_INDICATEUR_JUSTE],
];

describe("les deux chapitres et leurs cas, dans le parcours systèmes d'information de gestion", () => {
  it("portent les titres du programme, au palier 1, et des blocs qui existent tels quels", () => {
    for (const ch of CHAPITRES_SIG) {
      expect(PROGRAMME["stmg-sig"][1], ch.code).toContain(ch.titre);
      expect(ch.parcours).toBe("stmg-sig");
      expect(ch.palier).toBe(1);
      expect(ch.libre).toBe(false);
      expect(ch.blocs).toEqual(["STMG Thème 3 · Information, action et décision"]);
      for (const b of ch.blocs) {
        const cite = referentielDeCitation(b);
        expect(cite, b).not.toBeNull();
        expect(cite!.code, b).toBe("stmg");
        expect(cite!.referentiel.entrees.some((x) => b.endsWith(` ${x}`)), b).toBe(true);
        expect(blocOfficiel(b, cite!.code), b).toBe(b.replace("STMG ", ""));
      }
    }
  });

  it("ne doublent aucun chapitre du registre : ni leur code, ni leur titre", () => {
    for (const ch of CHAPITRES_SIG) {
      expect(CHAPITRES.filter((x) => x !== ch && x.code === ch.code), ch.code).toEqual([]);
      expect(CHAPITRES.filter((x) => x !== ch && x.titre === ch.titre), ch.code).toEqual([]);
    }
  });

  it("des données à l'information se joue partout ; l'indicateur juste, partout sauf chez VOLT FITNESS", () => {
    expect(DES_DONNEES_A_L_INFORMATION.entreprises).toBeUndefined();
    expect(MARCHES).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "fitness"));
    expect(scenarioByCode("fitness").scenario.subscription).toBeTruthy();
    expect(CONSTRUIRE_UN_INDICATEUR_JUSTE.entreprises?.codes).toEqual(MARCHES);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    for (const [s, ch] of PAIRES) {
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

  it("la moyenne du marché que cite le chapitre est bien, dans l'arène, la moyenne simple des prix", () => {
    const service = readFileSync(join(process.cwd(), "src/services/game-view.service.ts"), "utf8");
    expect(service).toContain("withPrice.reduce((s, c) => s + c.avgPrice!, 0) / withPrice.length");
    const ecran = readFileSync(join(process.cwd(), "src/components/competitive-benchmark.tsx"), "utf8");
    expect(ecran).toContain("Moyenne du marché");
    expect(ecran).toContain("playerIdx >= 1.05");
    expect(ecran).toContain("playerIdx < 0.95");
  });
});

describe.each(ENTREPRISES_DU_COURS)("des données à l'information chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const { partie } = anneeJouee(code);

  it("chaque ligne de l'extrait est une donnée du moteur, et une enseigne qui ne vend pas n'a pas de ligne", () => {
    const lignes = extraitDesVentes(cas);
    const attendues = partie.rounds.flatMap((tour, k) =>
      idsDe(code).map((id) => ({
        trimestre: k + 1,
        id,
        ventes: Math.round(vendus(tour.results[id]!)),
        chiffreDAffaires: Math.round(tour.results[id]!.incomeStatement.revenue),
      })),
    );
    expect(lignes.map(({ trimestre, id, ventes, chiffreDAffaires }) => ({ trimestre, id, ventes, chiffreDAffaires }))).toEqual(
      attendues.filter((l) => l.ventes > 0),
    );
    expect(lignes.map((l) => l.numero)).toEqual(lignes.map((_, i) => i + 1));
    // L'entreprise vend à chaque trimestre : elle a ses quatre lignes.
    expect(lignes.filter((l) => l.id === "joueur").map((l) => l.trimestre)).toEqual([1, 2, 3, 4]);
  });

  it("les regroupements, le critère et la part se recomposent, et les champs les attendent", () => {
    const k = donneesALInformation(cas);
    const lignes = extraitDesVentes(cas);
    for (const e of k.enseignes) {
      const total = lignes.filter((l) => l.id === e.id).reduce((t, l) => t + l.chiffreDAffaires, 0);
      expect(e.chiffreDeLAnnee, e.id).toBe(total);
      // La somme des lignes arrondies reste à quelques euros du chiffre d'affaires de l'année.
      const annee = partie.rounds.reduce((t, tour) => t + tour.results[e.id]!.incomeStatement.revenue, 0);
      expect(Math.abs(e.chiffreDeLAnnee - annee), e.id).toBeLessThanOrEqual(2);
      expect(champ(DES_DONNEES_A_L_INFORMATION, "regrouper", cas, `Chiffre d'affaires de l'année, ${e.nom}`)).toBe(total);
    }
    const ventes = Math.round(lignes.filter((l) => l.id === "joueur").reduce((t, l) => t + l.ventes, 0));
    expect(champ(DES_DONNEES_A_L_INFORMATION, "regrouper", cas, "Ventes de l'année")).toBe(ventes);
    const semestre = (a: number, b: number) => {
      const du = lignes.filter((l) => l.trimestre >= a && l.trimestre <= b);
      const total = du.reduce((t, l) => t + l.chiffreDAffaires, 0);
      const ent = du.filter((l) => l.id === "joueur").reduce((t, l) => t + l.chiffreDAffaires, 0);
      return { total, part: auDixieme((ent / total) * 100) };
    };
    const s1 = semestre(1, 2);
    const s2 = semestre(3, 4);
    expect(champ(DES_DONNEES_A_L_INFORMATION, "critere-et-part", cas, "Chiffre d'affaires des enseignes, premier")).toBe(s1.total);
    expect(champ(DES_DONNEES_A_L_INFORMATION, "critere-et-part", cas, "Chiffre d'affaires des enseignes, second")).toBe(s2.total);
    expect(champ(DES_DONNEES_A_L_INFORMATION, "critere-et-part", cas, "Part")).toBe(s1.part);
    const e = etapeDe(DES_DONNEES_A_L_INFORMATION, "critere-et-part", cas);
    if (e.type !== "montants") throw new Error("montants");
    expect(e.champs(cas, { soldes: {} }).find((c) => c.libelle.includes("second semestre (%)"))!.attendu).toBe(s2.part);
    // La requête des concurrents réunis, au 1er trimestre.
    expect(k.concurrentsAuPremier).toBe(lignes.filter((l) => l.trimestre === 1 && l.id !== "joueur").reduce((t, l) => t + l.chiffreDAffaires, 0));
  });

  it("le tri range les cases en données et les calculs en informations, aux bons montants", () => {
    const e = etapeDe(DES_DONNEES_A_L_INFORMATION, "donnee-ou-information", cas);
    if (e.type !== "tri") throw new Error("tri");
    const k = donneesALInformation(cas);
    const lignes = extraitDesVentes(cas);
    const elements = e.elements(cas);
    for (const x of elements.filter((y) => y.categorie === "donnee")) expect(lignes.some((l) => l.chiffreDAffaires === x.montant), x.libelle).toBe(true);
    expect(elements.find((x) => x.libelle.includes("sur l'année"))!.montant).toBe(k.entreprise.chiffreDeLAnnee);
    expect(elements.find((x) => x.libelle.includes("moyen"))!.montant).toBe(auCentime(k.entreprise.chiffreDeLAnnee / 4));
    expect(elements.find((x) => x.libelle.includes("réunies"))!.montant).toBe(lignes.filter((l) => l.trimestre === 1).reduce((t, l) => t + l.chiffreDAffaires, 0));
  });

  it("le verdict se calcule : l'écart des parts, et le concurrent qui a cessé de vendre", () => {
    const k = donneesALInformation(cas);
    const fin = partie.rounds.at(-1)!;
    const partis = idsDe(code).slice(1).filter((id) => Math.round(vendus(fin.results[id]!)) === 0);
    expect(k.partis.map((e) => e.id)).toEqual(partis);
    const ecart = auDixieme(k.second.part - k.premier.part);
    expect(k.ecart).toBe(ecart);
    expect(k.lecture).toBe(ecart > PART_STABLE ? (partis.length > 0 ? "monte-depart" : "monte") : ecart < -PART_STABLE ? "baisse" : "stable");
    const textes = { "monte-depart": "surtout parce qu'un concurrent", monte: "qui vendent toujours", stable: "garde sa place", baisse: "perd du terrain" };
    expect(optionJuste(DES_DONNEES_A_L_INFORMATION, "decider", cas)).toContain(textes[k.lecture]);
    // La question de la requête est une question de méthode : la même réponse partout.
    expect(optionJuste(DES_DONNEES_A_L_INFORMATION, "la-requete", cas)).toBe("Garder les lignes des concurrents, regrouper par trimestre, additionner");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(DES_DONNEES_A_L_INFORMATION, code));
});

describe("des données à l'information, sur les entreprises du cours", () => {
  it("la lecture des semestres dépend de l'entreprise : gain, place gardée ou terrain perdu", () => {
    const k = ENTREPRISES_DU_COURS.map((c) => donneesALInformation(casDeLEntreprise(c)));
    expect([...new Set(k.map((x) => x.lecture))].sort()).toEqual(["baisse", "monte", "stable"]);
    // Sur l'année du cours (concurrents assainis), aucune enseigne ne cesse de vendre : chaque table
    // compte ses douze lignes, et la lecture « un concurrent a cessé de vendre » n'est lue nulle part.
    for (const x of k) expect([x.lignes.length, x.partis]).toEqual([12, []]);
  });

  it("chez NOVA, les chiffres de l'année du cours", () => {
    const k = donneesALInformation(casDeLEntreprise("nova"));
    expect(k.lignes).toHaveLength(12);
    expect(k.premier.part).toBe(34.8);
    expect(k.second.part).toBe(34.2);
    expect(k.lecture).toBe("stable");
    expect(k.partis).toEqual([]);
  });
});

describe.each(MARCHES)("construire un indicateur juste chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const { partie } = anneeJouee(code);

  it("chaque enseigne se recompose avec l'année du cours", () => {
    const k = indicateurDuPrix(cas);
    expect(k.enseignes.map((e) => e.id)).toEqual(idsDe(code));
    for (const e of k.enseignes) {
      const a = partie.rounds.map((t) => t.results[e.id]!);
      const ventes = Math.round(a.reduce((t, r) => t + vendus(r), 0));
      const ca = Math.round(a.reduce((t, r) => t + r.incomeStatement.revenue, 0));
      expect(e.ventes, e.id).toBe(ventes);
      expect(e.chiffreDAffaires, e.id).toBe(ca);
      expect(e.prix, e.id).toBe(auCentime(ca / ventes));
    }
  });

  it("les deux moyennes, les deux indices, et les champs qui les attendent", () => {
    const k = indicateurDuPrix(cas);
    const prix = k.enseignes.map((e) => e.prix);
    const simple = auCentime(prix.reduce((a, b) => a + b, 0) / prix.length);
    const pondere = auCentime(k.enseignes.reduce((t, e) => t + e.chiffreDAffaires, 0) / k.enseignes.reduce((t, e) => t + e.ventes, 0));
    expect(k.moyenneSimple).toBeCloseTo(simple, 2);
    expect(k.prixPondere).toBe(pondere);
    expect(k.indiceSimple).toBe(Math.round((k.entreprise.prix / k.moyenneSimple) * 100));
    expect(k.indicePondere).toBe(Math.round((k.entreprise.prix / k.prixPondere) * 100));
    expect(champ(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-calculs", cas, "Moyenne simple")).toBe(k.moyenneSimple);
    expect(champ(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-calculs", cas, "Prix moyen pondéré")).toBe(pondere);
    expect(champ(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-indices", cas, "Indice de prix, avec la moyenne simple")).toBe(k.indiceSimple);
    expect(champ(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-indices", cas, "Indice de prix, avec le prix pondéré")).toBe(k.indicePondere);
  });

  it("le verdict se calcule : la position de chaque indice, et ce que l'erreur ferait décider", () => {
    const k = indicateurDuPrix(cas);
    const position = (i: number) => (i < 100 - ECART_ALIGNE ? "dessous" : i > 100 + ECART_ALIGNE ? "dessus" : "aligne");
    expect(k.positionSimple).toBe(position(k.indiceSimple));
    expect(k.positionPonderee).toBe(position(k.indicePondere));
    expect(positionDe(k.indicePondere)).toBe(k.positionPonderee);
    const erreur =
      k.positionSimple === k.positionPonderee ? "aucune" : k.positionSimple === "dessous" ? "monter" : k.positionSimple === "dessus" ? "baisser" : "rester";
    expect(k.erreur).toBe(erreur);
    const textes = { monter: "Monter son prix à tort", baisser: "Baisser son prix à tort", rester: "Garder son prix à tort", aucune: "La même chose" };
    expect(optionJuste(CONSTRUIRE_UN_INDICATEUR_JUSTE, "ce-que-l-erreur-ferait-decider", cas)).toContain(textes[k.erreur]);
    // Le juste est le ratio des sommes, et la fiche complète : les mêmes réponses partout.
    expect(optionJuste(CONSTRUIRE_UN_INDICATEUR_JUSTE, "lequel-est-juste", cas)).toContain("Le prix pondéré");
    expect(optionJuste(CONSTRUIRE_UN_INDICATEUR_JUSTE, "la-fiche", cas)).toContain("divisé par leurs ventes");
  });

  it("textes propres, une seule bonne réponse, notions existantes", () => verifierLesTextes(CONSTRUIRE_UN_INDICATEUR_JUSTE, code));
});

describe("construire un indicateur juste, sur les entreprises du chapitre", () => {
  it("partout, l'enseigne la moins chère vend le plus, et la moyenne simple surestime le prix du marché", () => {
    for (const c of MARCHES) {
      const k = indicateurDuPrix(casDeLEntreprise(c));
      expect(k.plusVendue, c).toBe(k.moinsChere);
      expect(k.moyenneSimple, c).toBeGreaterThan(k.prixPondere);
    }
  });

  it("l'erreur fait monter le prix à tort chez les unes, le fait garder à tort ailleurs, ne change rien chez les autres", () => {
    const erreurs = new Set(MARCHES.map((c) => indicateurDuPrix(casDeLEntreprise(c)).erreur));
    expect([...erreurs].sort()).toEqual(["aucune", "monter"]);
    // Sur l'année du bon gestionnaire, l'erreur fait monter le prix à tort chez NOVA, L'ESCALE et
    // ATLAS CONSEIL (moins chères que le marché sur la moyenne simple, alignées sur le prix pondéré).
    // MAILLE & CO, qui se croyait au prix du marché quand le prix pondéré la plaçait au-dessus,
    // reste alignée sur les deux (indices 103 et 105) : les branches « garder son prix à tort » et
    // « baisser son prix à tort » ne sont lues dans aucune entreprise.
    expect(MARCHES.filter((c) => indicateurDuPrix(casDeLEntreprise(c)).erreur === "monter")).toEqual(["nova", "hotel", "conseil"]);
    const boutique = indicateurDuPrix(casDeLEntreprise("boutique"));
    expect([boutique.indiceSimple, boutique.indicePondere, boutique.erreur]).toEqual([103, 105, "aucune"]);
  });

  it("chez NOVA, les chiffres de l'année du cours", () => {
    const k = indicateurDuPrix(casDeLEntreprise("nova"));
    expect(k.moyenneSimple).toBe(63.71);
    expect(k.prixPondere).toBe(61.65);
    expect(k.indiceSimple).toBe(94);
    expect(k.indicePondere).toBe(97);
    expect(k.erreur).toBe("monter");
  });
});

describe.each(ENTREPRISES_DU_COURS)("le trimestre le plus fort chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("le regroupement par trimestre et les parts se recomposent, le plus fort est unique, et les champs les attendent", () => {
    const k = trimestreLePlusFort(cas);
    const lignes = extraitDesVentes(cas);
    const totaux = [1, 2, 3, 4].map((t) => lignes.filter((l) => l.trimestre === t).reduce((s, l) => s + l.chiffreDAffaires, 0));
    expect(k.trimestres.map((x) => x.total)).toEqual(totaux);
    const max = Math.max(...totaux);
    expect(totaux.filter((x) => x === max), "un seul trimestre le plus fort").toHaveLength(1);
    expect(k.plusFort.trimestre).toBe(totaux.indexOf(max) + 1);
    const ent = lignes.filter((l) => l.trimestre === k.plusFort.trimestre && l.id === "joueur")[0]!.chiffreDAffaires;
    expect(k.plusFort.part).toBe(auDixieme((ent / max) * 100));
    const annee = lignes.filter((l) => l.id === "joueur").reduce((s, l) => s + l.chiffreDAffaires, 0);
    expect(k.partDeLAnnee).toBe(auDixieme((annee / totaux.reduce((a, b) => a + b, 0)) * 100));
    const ecart = auDixieme(k.plusFort.part - k.partDeLAnnee);
    expect(k.place).toBe(ecart < -PART_STABLE ? "moins" : ecart > PART_STABLE ? "plus" : "autant");
    for (const [i, t] of totaux.entries()) {
      expect(champ(LE_TRIMESTRE_LE_PLUS_FORT, "par-trimestre", cas, `Chiffre d'affaires des enseignes, ${i === 0 ? "1er" : `${i + 1}e`} trimestre`)).toBe(t);
    }
    expect(champ(LE_TRIMESTRE_LE_PLUS_FORT, "la-part", cas, `Part`)).toBe(k.plusFort.part);
    const e = etapeDe(LE_TRIMESTRE_LE_PLUS_FORT, "la-part", cas);
    if (e.type !== "montants") throw new Error("montants");
    expect(e.champs(cas, { soldes: {} }).find((c) => c.libelle.includes("année entière"))!.attendu).toBe(k.partDeLAnnee);
    const noms = ["premier", "deuxième", "troisième", "quatrième"];
    expect(optionJuste(LE_TRIMESTRE_LE_PLUS_FORT, "reponse", cas)).toBe(`Le ${noms[k.plusFort.trimestre - 1]} trimestre`);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LE_TRIMESTRE_LE_PLUS_FORT, code);
    reponseSansIndice(LE_TRIMESTRE_LE_PLUS_FORT, code);
  });
});

describe("le trimestre le plus fort, sur les entreprises du cours", () => {
  it("le trimestre le plus fort change d'une entreprise à l'autre", () => {
    const plusForts = new Set(ENTREPRISES_DU_COURS.map((c) => trimestreLePlusFort(casDeLEntreprise(c)).plusFort.trimestre));
    expect(plusForts.size).toBeGreaterThan(1);
  });
});

describe.each(MARCHES)("la part de marché annoncée chez %s", (code) => {
  const cas = casDeLEntreprise(code);

  it("les parts, leur moyenne et la part de l'année se recomposent avec le moteur, et les champs les attendent", () => {
    const k = partAnnoncee(cas);
    const tours = anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);
    const ventes = tours.map((r) => Math.round(vendus(r)));
    const marche = tours.map((r) => Math.round(potentiel(r)));
    expect(k.trimestres.map((x) => x.ventes)).toEqual(ventes);
    expect(k.trimestres.map((x) => x.marche)).toEqual(marche);
    const parts = ventes.map((v, i) => auDixieme((v / marche[i]!) * 100));
    expect(k.trimestres.map((x) => x.part)).toEqual(parts);
    const moyenne = auDixieme(auDixieme(parts.reduce((a, b) => a + b, 0)) / parts.length);
    const totalVentes = ventes.reduce((a, b) => a + b, 0);
    const totalMarche = marche.reduce((a, b) => a + b, 0);
    const annee = auDixieme((totalVentes / totalMarche) * 100);
    expect(k.moyenne).toBe(moyenne);
    expect(k.partDeLAnnee).toBe(annee);
    expect(k.ecart).toBe(auDixieme(annee - moyenne));
    expect(k.verdict).toBe(k.ecart < -ECART_NEGLIGEABLE ? "plus-basse" : k.ecart > ECART_NEGLIGEABLE ? "plus-haute" : "la-meme");
    expect(champ(LA_PART_DE_MARCHE_ANNONCEE, "la-moyenne", cas, "Moyenne des parts")).toBe(moyenne);
    expect(champ(LA_PART_DE_MARCHE_ANNONCEE, "la-part-de-l-annee", cas, "Ventes de l'année")).toBe(totalVentes);
    expect(champ(LA_PART_DE_MARCHE_ANNONCEE, "la-part-de-l-annee", cas, "Demande du marché")).toBe(totalMarche);
    expect(champ(LA_PART_DE_MARCHE_ANNONCEE, "la-part-de-l-annee", cas, "Part de marché de l'année")).toBe(annee);
    expect(champ(LA_PART_DE_MARCHE_ANNONCEE, "la-part-de-l-annee", cas, "Écart")).toBe(auDixieme(annee - moyenne));
    const textes = { "plus-basse": "plus basse", "plus-haute": "plus haute", "la-meme": "Oui" };
    expect(optionJuste(LA_PART_DE_MARCHE_ANNONCEE, "reponse", cas)).toContain(textes[k.verdict]);
  });

  it("textes propres, une seule bonne réponse qui ne se devine pas à sa longueur", () => {
    verifierLesTextes(LA_PART_DE_MARCHE_ANNONCEE, code);
    reponseSansIndice(LA_PART_DE_MARCHE_ANNONCEE, code);
  });
});

describe("la part de marché annoncée, sur les entreprises du cas", () => {
  it("la moyenne annoncée embellit l'année chez les unes, tombe juste chez les autres", () => {
    const verdicts = new Set(MARCHES.map((c) => partAnnoncee(casDeLEntreprise(c)).verdict));
    expect([...verdicts].sort()).toEqual(["la-meme", "plus-basse"]);
  });

  it("chez NOVA, les chiffres de l'année du cours", () => {
    const k = partAnnoncee(casDeLEntreprise("nova"));
    expect(k.moyenne).toBe(24.3);
    expect(k.partDeLAnnee).toBe(21.4);
    expect(k.verdict).toBe("plus-basse");
  });
});
