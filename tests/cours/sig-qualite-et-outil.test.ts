import { describe, expect, it } from "vitest";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import {
  ENTREPRISES_A_PRIX_UNIQUE,
  FACTEUR_DE_LA_VIRGULE,
  TRIMESTRE_DECIDE,
  TRIMESTRE_DE_L_ERREUR,
  TRIMESTRES_DE_L_EXTRAIT,
  UNE_DONNEE_FAUSSE,
  donneeFausse,
} from "../../src/config/cours/chapitres/une-donnee-fausse";
import {
  ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS,
  ADOPTION_DE_LA_PREMIERE_ANNEE,
  CE_QUE_COUTE_UN_OUTIL_NUMERIQUE,
  ENTREPRISES_DE_L_OUTIL,
  FORMATION_PAR_UTILISATEUR,
  MISE_EN_PLACE,
  PART_DES_VENTES_RETROUVEES,
  outilNumerique,
} from "../../src/config/cours/chapitres/ce-que-coute-un-outil-numerique";
import { LA_CASE_VIDE, TRIMESTRE_SANS_SAISIE, caseVide } from "../../src/config/cours/situations/par-chapitre/la-case-vide";
import {
  ADOPTION_APRES_LA_SECONDE_JOURNEE,
  HORIZON_EN_ANNEES,
  UNE_SECONDE_JOURNEE_DE_FORMATION,
  secondeJournee,
} from "../../src/config/cours/situations/par-chapitre/une-seconde-journee-de-formation";
import { rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * LA QUALITÉ DES DONNÉES ET LE COÛT D'UN OUTIL NUMÉRIQUE (parcours Bac STMG, systèmes d'information
 * de gestion, palier 1), ET LEURS CAS PRATIQUES.
 *
 * « Une donnée fausse, une décision fausse » : un extrait de l'année du cours (`anneeJouee`), une
 * virgule déplacée, et le trimestre 4 rejoué avec le plan calé sur chaque prévision (`rejouerAvec`).
 * « Ce que coûte et rapporte un outil numérique » : un abonnement, une mise en place, une formation,
 * face à un gain chiffré sur les ventes manquées de l'arène. Ces gardes recomposent les chiffres avec
 * le moteur dans chaque entreprise où ils se jouent, vérifient les valeurs attendues des champs, que
 * les verdicts se calculent, que les restrictions disent vrai, et que les textes se lisent : rien
 * d'indéfini, pas de « de le », pas de tiret au milieu d'une phrase, des élisions faites, une seule
 * bonne réponse, aucune option qui en contient une autre, des libellés uniques, des notions qui
 * existent, des accords justes avec les unités féminines.
 */

const pres = (a: number, b: number, ecart = 1) => expect(Math.abs(a - b)).toBeLessThanOrEqual(ecart);
const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const lost = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
const anneeDuCours = (code: string) => anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!);

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

const PARTICIPES = ["vendu", "fabriqué", "demandé", "servi", "produit", "perdu", "retrouvé", "dernier"];

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
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|null|\[object/);
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
      expect(x, `${e.id} : ${x}`).not.toMatch(/\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix) (entreprises?|trimestres?|ans|années|mois|utilisateurs|salariés|fois)\b/i);
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
    for (const n of e.notions ?? []) expect(notions.has(n), `${e.id} : ${n}`).toBe(true);
  }
  expect(new Set(chapitre.etapes.map((e) => e.id)).size).toBe(chapitre.etapes.length);
  expect(new Set(chapitre.etapes.map((e) => e.titre)).size).toBe(chapitre.etapes.length);
}

/** La bonne réponse d'un cas ne se devine pas à sa longueur, à aucune de ses questions. */
function reponsesSansIndice(s: Situation, code: string) {
  const cas = casDeLEntreprise(code);
  for (const e of s.etapes) {
    if (e.type !== "choix") continue;
    const options = e.options(cas, { soldes: {} });
    const juste = options.find((o) => o.juste)!;
    expect(juste.texte.length, `${s.code} / ${e.id}`).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  }
}

/** La valeur qu'attend un champ, retrouvé par le début de son libellé. */
const champ = (ch: Chapitre, etape: string, cas: Cas, debut: string) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === etape)!;
  if (e.type !== "montants") throw new Error(`${etape} n'est pas une étape de montants`);
  const c = e.champs(cas, { soldes: {} }).find((x) => x.libelle.startsWith(debut));
  if (!c) throw new Error(`pas de champ « ${debut} » dans ${etape}`);
  return c.attendu;
};

/** La bonne réponse d'une question, par son texte. */
const reponse = (ch: Chapitre, etape: string, cas: Cas) => {
  const e = chapitreDuCas(ch, cas).etapes.find((x) => x.id === etape)!;
  if (e.type !== "choix") throw new Error(`${etape} n'est pas un choix`);
  return e.options(cas, { soldes: {} }).find((o) => o.juste)!.texte;
};

const DEUX_CHAPITRES: readonly Chapitre[] = [UNE_DONNEE_FAUSSE, CE_QUE_COUTE_UN_OUTIL_NUMERIQUE];
const DEUX_CAS: readonly Situation[] = [LA_CASE_VIDE, UNE_SECONDE_JOURNEE_DE_FORMATION];
const entreprisesDe = (ch: Chapitre) => ENTREPRISES_DU_COURS.filter((x) => !ch.entreprises || ch.entreprises.codes.includes(x));

describe("la qualité des données et l'outil numérique : la place dans le parcours", () => {
  it("les titres sont ceux du programme, au palier 1 du parcours stmg-sig, et chaque bloc se résout dans le registre", () => {
    for (const ch of DEUX_CHAPITRES) {
      expect(ch.parcours).toBe("stmg-sig");
      expect(ch.palier).toBe(1);
      expect(PROGRAMME["stmg-sig"][1], ch.code).toContain(ch.titre);
      expect(ch.libre).toBe(false);
      expect(ch.blocs.length).toBeGreaterThan(0);
      for (const b of ch.blocs) {
        const cite = referentielDeCitation(b);
        expect(cite, b).not.toBeNull();
        expect(cite!.code, b).toBe("stmg");
        expect(cite!.referentiel.entrees.some((x) => b === `STMG ${x}`), b).toBe(true);
        expect(blocOfficiel(b, "stmg"), b).toBe(b.slice("STMG ".length));
      }
    }
  });

  it("rien n'est doublé : ni le code ni le titre d'un autre chapitre", () => {
    for (const ch of DEUX_CHAPITRES) {
      expect(CHAPITRES.filter((x) => x.code === ch.code && x !== ch)).toEqual([]);
      expect(CHAPITRES.filter((x) => x.titre === ch.titre && x !== ch)).toEqual([]);
    }
    for (const s of DEUX_CAS) expect(CHAPITRES.some((x) => x.code === s.code), s.code).toBe(false);
  });

  it("chaque cas est dédié à son chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    for (const [s, ch] of [
      [LA_CASE_VIDE, UNE_DONNEE_FAUSSE],
      [UNE_SECONDE_JOURNEE_DE_FORMATION, CE_QUE_COUTE_UN_OUTIL_NUMERIQUE],
    ] as const) {
      expect(s.reprend).toEqual([ch.code]);
      expect(s.palier).toBe(ch.palier);
      expect(s.parcours).toBe(ch.parcours);
      expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
      expect(s.libre).toBe(false);
      expect(s.blocs).toEqual([]);
      expect(s.code).not.toBe(ch.code);
      expect(s.commanditaire.length).toBeGreaterThan(3);
      // Sans cours : la question d'abord, aucune autre lecture, la réponse pour finir.
      expect(s.etapes[0]!.type).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
      expect(s.etapes.at(-1)!.type).toBe("choix");
    }
  });

  it("les restrictions disent vrai : un prix unique par unité vendue, et pas d'abonnés", () => {
    expect([...ENTREPRISES_A_PRIX_UNIQUE]).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "boutique" && c !== "fitness"));
    expect([...ENTREPRISES_DE_L_OUTIL]).toEqual(ENTREPRISES_DU_COURS.filter((c) => c !== "fitness"));
    expect(scenarioByCode("fitness").scenario.subscription).toBeTruthy();
    // Chez MAILLE & CO, le chiffre d'affaires divisé par les ventes change d'un trimestre à l'autre : ce n'est pas un prix.
    const prixDeLaBoutique = new Set(anneeDuCours("boutique").map((r) => auCentime(r.incomeStatement.revenue / soldUnits(r))));
    expect(prixDeLaBoutique.size).toBeGreaterThan(1);
    for (const code of ENTREPRISES_A_PRIX_UNIQUE) {
      const annee = anneeDuCours(code);
      // Chaque trimestre, un seul prix au centime pour toutes les unités vendues.
      for (const r of annee) pres(r.incomeStatement.revenue, soldUnits(r) * auCentime(r.incomeStatement.revenue / soldUnits(r)), 0.01);
      // Le bon gestionnaire peut changer son prix au trimestre 4 ; sur les trimestres de l'extrait, le prix est le même.
      const prix = auCentime(annee[0]!.incomeStatement.revenue / soldUnits(annee[0]!));
      for (const t of TRIMESTRES_DE_L_EXTRAIT) pres(annee[t - 1]!.incomeStatement.revenue, soldUnits(annee[t - 1]!) * prix, 0.01);
    }
  });

  it("les verdicts se calculent : l'outil se rembourse ici dans l'année, là plus tard, ailleurs jamais", () => {
    const verdicts = (f: (c: Cas) => { verdict: string }, codes: readonly string[]) => new Set(codes.map((c) => f(casDeLEntreprise(c)).verdict));
    expect(verdicts(outilNumerique, ENTREPRISES_DE_L_OUTIL).size).toBe(3);
    expect(verdicts(secondeJournee, ENTREPRISES_DE_L_OUTIL).size).toBeGreaterThanOrEqual(2);
    // La virgule fait baisser la prévision, et dans les entreprises du chapitre la demande du trimestre 4 la dépasse :
    // l'erreur coûte partout. Le verdict se calcule quand même, et la garde le dit.
    expect([...verdicts(donneeFausse, ENTREPRISES_A_PRIX_UNIQUE)]).toEqual(["l-erreur-coute"]);
  });
});

describe.each(ENTREPRISES_A_PRIX_UNIQUE)("une donnée fausse chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const annee = anneeDuCours(code);
  const ch = UNE_DONNEE_FAUSSE;

  it("l'extrait est l'année du cours : les ventes à l'unité, le prix de l'arène, la virgule glissée au seul trimestre de l'erreur", () => {
    const r = donneeFausse(cas);
    expect(r.lignes.map((l) => l.trimestre)).toEqual([1, 2, 3]);
    for (const l of r.lignes) {
      const t = annee[l.trimestre - 1]!;
      expect(l.ventes).toBe(Math.round(soldUnits(t)));
      pres(l.prix, t.incomeStatement.revenue / soldUnits(t), 0.005);
      // Le chiffre d'affaires de l'extrait est celui des ventes à l'unité : à moins d'un demi-prix de celui de l'arène.
      pres(l.chiffreDAffaires, t.incomeStatement.revenue, l.prix / 2 + 0.01);
      expect(l.chiffreDAffaires).toBe(auCentime(l.ventes * l.prix));
      expect(l.saisie).toBe(l.trimestre === TRIMESTRE_DE_L_ERREUR ? l.ventes / FACTEUR_DE_LA_VIRGULE : l.ventes);
      expect(l.ecart === 0).toBe(l.trimestre !== TRIMESTRE_DE_L_ERREUR);
    }
    expect(new Set(r.lignes.map((l) => l.prix)).size).toBe(1);
  });

  it("les champs attendent les chiffres de l'extrait : le contrôle de cohérence, la correction, les deux prévisions", () => {
    const r = donneeFausse(cas);
    const [v1, v2, v3] = r.lignes.map((l) => l.ventes) as [number, number, number];
    for (const l of r.lignes) expect(champ(ch, "coherence", cas, `Ventes × prix, trimestre ${l.trimestre}`)).toBe(auCentime(l.saisie * l.prix));
    expect(champ(ch, "prevision", cas, "Ventes corrigées")).toBe(v3);
    expect(champ(ch, "prevision", cas, "Prévision avec la donnée fausse")).toBe(Math.round((v1 + v2 + v3 / FACTEUR_DE_LA_VIRGULE) / 3));
    expect(champ(ch, "prevision", cas, "Prévision avec la donnée corrigée")).toBe(Math.round((v1 + v2 + v3) / 3));
    expect(r.previsionFausse).toBeLessThan(r.previsionJuste);
    expect(reponse(ch, "donnee", cas)).toBe(`Les ventes du trimestre ${TRIMESTRE_DE_L_ERREUR}`);
  });

  it("l'arène rejoue le seul trimestre 4 avec chaque plan, et les écarts se recomposent avec le moteur", () => {
    const r = donneeFausse(cas);
    // Un rejeu à part, sous d'autres clés : le moteur, pas le cache du chapitre.
    const rejoue = (plan: number) =>
      rejouerAvec(code, `garde-sig:${plan}`, (t, d) => (t === TRIMESTRE_DECIDE ? { ...d, productionPlan: plan } : undefined));
    const juste = rejoue(r.previsionJuste);
    const faux = rejoue(r.previsionFausse);
    for (let k = 0; k < TRIMESTRE_DECIDE - 1; k++) {
      expect(juste[k]!.incomeStatement.operatingIncome).toBeCloseTo(annee[k]!.incomeStatement.operatingIncome, 6);
      expect(faux[k]!.incomeStatement.operatingIncome).toBeCloseTo(annee[k]!.incomeStatement.operatingIncome, 6);
    }
    const k = TRIMESTRE_DECIDE - 1;
    expect(juste[k]!.production.planned).toBeCloseTo(r.previsionJuste, 6);
    expect(faux[k]!.production.planned).toBeCloseTo(r.previsionFausse, 6);
    const ventesPerdues = Math.round(soldUnits(juste[k]!)) - Math.round(soldUnits(faux[k]!));
    const margePerdue = Math.round(juste[k]!.incomeStatement.grossMargin) - Math.round(faux[k]!.incomeStatement.grossMargin);
    const cout = Math.round(juste[k]!.incomeStatement.operatingIncome) - Math.round(faux[k]!.incomeStatement.operatingIncome);
    expect(champ(ch, "arene", cas, "Ventes perdues")).toBe(ventesPerdues);
    expect(champ(ch, "arene", cas, "Marge perdue")).toBe(margePerdue);
    expect(champ(ch, "arene", cas, "Coût de l'erreur")).toBe(cout);
    expect(r.manqueesFausse).toBe(Math.round(lost(faux[k]!)));
    // Le verdict se lit dans ces chiffres.
    expect(r.verdict).toBe(cout > 0 ? "l-erreur-coute" : ventesPerdues === 0 ? "rien-ne-change" : "l-erreur-rapporte");
    expect(reponse(ch, "controle", cas)).toBe("Comparer ventes × prix au chiffre d'affaires saisi");
  });

  it("le cas : la case vide comptée pour zéro, le plan qu'elle fait prendre, et ce qu'il coûte", () => {
    const s = caseVide(cas);
    const r = donneeFausse(cas);
    const v = r.lignes.map((l) => l.ventes);
    const saisis = r.lignes.filter((l) => l.trimestre !== TRIMESTRE_SANS_SAISIE).reduce((t, l) => t + l.ventes, 0);
    expect(s.lignes.find((l) => l.trimestre === TRIMESTRE_SANS_SAISIE)!.saisie).toBeNull();
    expect(s.totalDuTableur).toBe(saisis);
    expect(s.planDuResponsable).toBe(Math.round(saisis / 3));
    expect(s.moyenneDesSaisis).toBe(Math.round(saisis / 2));
    expect(champ(LA_CASE_VIDE, "completer", cas, `Ventes du trimestre ${TRIMESTRE_SANS_SAISIE}`)).toBe(v[TRIMESTRE_SANS_SAISIE - 1]);
    expect(champ(LA_CASE_VIDE, "completer", cas, "Total des ventes")).toBe(v.reduce((a, b) => a + b, 0));
    expect(champ(LA_CASE_VIDE, "completer", cas, "Prévision du trimestre")).toBe(r.previsionJuste);
    const k = TRIMESTRE_DECIDE - 1;
    const vide = rejouerAvec(code, `garde-sig:case-vide:${s.planDuResponsable}`, (t, d) =>
      t === TRIMESTRE_DECIDE ? { ...d, productionPlan: s.planDuResponsable } : undefined,
    );
    for (let q = 0; q < k; q++) expect(vide[q]!.incomeStatement.operatingIncome).toBeCloseTo(annee[q]!.incomeStatement.operatingIncome, 6);
    expect(champ(LA_CASE_VIDE, "arene", cas, "Ventes perdues")).toBe(r.venduesJuste - Math.round(soldUnits(vide[k]!)));
    expect(champ(LA_CASE_VIDE, "arene", cas, "Coût de la case vide")).toBe(r.resultatJuste - Math.round(vide[k]!.incomeStatement.operatingIncome));
    expect(s.resultatJuste).toBe(r.resultatJuste);
    expect(s.ventesPerdues).toBeGreaterThan(0);
    expect(reponse(LA_CASE_VIDE, "reponse", cas)).toBe("Remplir la case, puis refaire la moyenne");
  });
});

describe.each(ENTREPRISES_DE_L_OUTIL)("ce que coûte et rapporte un outil numérique chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const annee = anneeDuCours(code);
  const ch = CE_QUE_COUTE_UN_OUTIL_NUMERIQUE;

  /** Le calcul refait de bout en bout, sur l'année du cours et les constantes du cours. */
  function recompose() {
    const utilisateurs = anneeJouee(code).depart.headcount;
    const manqueesAvecDeLaPlace = Math.round(
      annee.reduce(
        (t, r) => t + Math.min(lost(r), Math.max(0, Math.min(r.production.machineCapacity, r.production.laborCapacity) - r.production.produced)),
        0,
      ),
    );
    const marge = auCentime(annee.reduce((t, r) => t + r.incomeStatement.grossMargin, 0) / annee.reduce((t, r) => t + soldUnits(r), 0));
    const abonnement = utilisateurs * ABONNEMENT_PAR_UTILISATEUR_ET_PAR_MOIS * 12;
    const formation = utilisateurs * FORMATION_PAR_UTILISATEUR;
    const depart = MISE_EN_PLACE + formation;
    const retrouvees = Math.round(manqueesAvecDeLaPlace * PART_DES_VENTES_RETROUVEES);
    const gain = auCentime(retrouvees * marge);
    const gainNet = auCentime(gain - abonnement);
    const gainAdopte = auCentime(gain * ADOPTION_DE_LA_PREMIERE_ANNEE);
    return { utilisateurs, manqueesAvecDeLaPlace, marge, abonnement, formation, depart, retrouvees, gain, gainNet, gainAdopte };
  }

  it("les chiffres viennent de l'arène : l'effectif, les ventes manquées avec de quoi produire, la marge moyenne", () => {
    const o = outilNumerique(cas);
    const x = recompose();
    expect(o.utilisateurs).toBe(x.utilisateurs);
    expect(o.utilisateurs).toBe(cas.personnel.effectif);
    expect(o.manqueesAvecDeLaPlace).toBe(x.manqueesAvecDeLaPlace);
    expect(o.manqueesAvecDeLaPlace).toBeGreaterThan(0);
    expect(o.manqueesAvecDeLaPlace).toBeLessThanOrEqual(o.ventesManquees);
    expect(o.ventesManquees).toBe(Math.round(annee.reduce((t, r) => t + lost(r), 0)));
    expect(o.marge).toBe(x.marge);
    expect(o.marge).toBeGreaterThan(0);
  });

  it("les champs attendent le coût, le gain, le délai et le seuil d'adoption recalculés", () => {
    const x = recompose();
    expect(champ(ch, "cout", cas, "Abonnement de l'année")).toBe(x.abonnement);
    expect(champ(ch, "cout", cas, "Formation des utilisateurs")).toBe(x.formation);
    expect(champ(ch, "cout", cas, "Coût total de la première année")).toBe(x.abonnement + x.depart);
    expect(champ(ch, "gain", cas, "Ventes retrouvées")).toBe(x.retrouvees);
    expect(champ(ch, "gain", cas, "Gain annuel")).toBe(x.gain);
    // L'outil couvre son abonnement quand toute l'équipe s'en sert : le délai existe partout.
    expect(x.gainNet).toBeGreaterThan(0);
    expect(champ(ch, "delai", cas, "Gain net de l'année")).toBe(x.gainNet);
    expect(champ(ch, "delai", cas, "Délai de récupération")).toBe(auDixieme((x.depart / x.gainNet) * 12));
    expect(champ(ch, "adoption", cas, "Taux d'adoption minimal")).toBe(auDixieme((x.abonnement / x.gain) * 100));
    expect(champ(ch, "adoption", cas, "Gain de l'année")).toBe(x.gainAdopte);
    expect(champ(ch, "adoption", cas, "Gain net de l'année")).toBe(auCentime(x.gainAdopte - x.abonnement));
  });

  it("le verdict de la première année se lit dans ces chiffres", () => {
    const o = outilNumerique(cas);
    const x = recompose();
    const net = auCentime(x.gainAdopte - x.abonnement);
    expect(o.verdict).toBe(net <= 0 ? "ne-couvre-pas-l-abonnement" : x.gainAdopte >= x.abonnement + x.depart ? "rembourse-dans-l-annee" : "rembourse-en-plus-d-un-an");
    // Sous le taux d'adoption minimal, et sous lui seul, le gain ne couvre pas l'abonnement.
    expect(net <= 0).toBe(ADOPTION_DE_LA_PREMIERE_ANNEE * 100 <= o.seuilDAdoption + 0.05);
  });

  it("le cas : la seconde journée, ce qu'elle coûte, ce qu'elle ajoute chaque année, et quand elle se paie", () => {
    const s = secondeJournee(cas);
    const x = recompose();
    const cout = x.utilisateurs * FORMATION_PAR_UTILISATEUR;
    const apres = auCentime(x.gain * ADOPTION_APRES_LA_SECONDE_JOURNEE);
    const enPlus = auCentime(apres - x.gainAdopte);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "gain", cas, "Gain annuel si toute")).toBe(x.gain);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "gain", cas, `Gain annuel à ${Math.round(ADOPTION_DE_LA_PREMIERE_ANNEE * 100)} %`)).toBe(x.gainAdopte);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "gain", cas, `Gain annuel à ${Math.round(ADOPTION_APRES_LA_SECONDE_JOURNEE * 100)} %`)).toBe(apres);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "journee", cas, "Coût de la seconde journée")).toBe(cout);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "journee", cas, "Gain en plus")).toBe(enPlus);
    expect(champ(UNE_SECONDE_JOURNEE_DE_FORMATION, "journee", cas, "Solde de la première année")).toBe(auCentime(enPlus - cout));
    expect(s.verdict).toBe(enPlus >= cout ? "des-la-premiere-annee" : enPlus * HORIZON_EN_ANNEES >= cout ? "sur-l-horizon" : "pas-sur-l-horizon");
  });
});

for (const contenu of [...DEUX_CHAPITRES, ...DEUX_CAS]) {
  describe.each(entreprisesDe(contenu))(`${contenu.code} chez %s`, (code) => {
    it("textes propres, une seule bonne réponse, aucune option qui en contient une autre, notions existantes", () => verifierLesTextes(contenu, code));
    if (DEUX_CAS.includes(contenu as Situation)) {
      it("la bonne réponse ne se devine pas à sa longueur", () => reponsesSansIndice(contenu as Situation, code));
    }
  });
}
