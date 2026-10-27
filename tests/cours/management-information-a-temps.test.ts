import { describe, expect, it } from "vitest";
import { UNITES_FEMININES } from "../../src/config/cours/accords";
import { blocOfficiel, referentielDeCitation } from "../../src/config/ateliers/referentiels";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { anneeJouee } from "../../src/config/cours/annee-de-l-arene";
import {
  ENTREPRISES_DE_L_INFORMATION,
  RETARD,
  RETARD_LONG,
  TRIMESTRE_DE_LA_QUESTION,
  UNE_INFORMATION_A_TEMPS,
  anneeEnRetard,
  informationATemps,
} from "../../src/config/cours/chapitres/une-information-a-temps";
import { anneeDeReference, rejouerAvec } from "../../src/config/cours/gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, PARCOURS, PROGRAMME } from "../../src/config/cours/registre";
import {
  LE_COMPTE_RENDU_EN_RETARD,
  TRIMESTRE_DECIDE,
  anneeDuCompteRendu,
  compteRendu,
} from "../../src/config/cours/situations/par-chapitre/le-compte-rendu-en-retard";
import type { Situation } from "../../src/config/cours/situations/types";
import type { Chapitre, Etape, EtapeChoix, EtapeMontants, EtatDuCours } from "../../src/config/cours/types";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { scenarioByCode } from "../../src/config/scenarios/registry";
import { soldUnits } from "../../src/engine/simulation/runGame";
import type { CompanyRoundResult, RoundDecisions } from "../../src/engine/types";
import { chapitreDuCas, etatAvant } from "../../src/pedagogy/cours/deroule";

/**
 * « UNE INFORMATION QUI CIRCULE À TEMPS » (BAC STMG, MANAGEMENT, PALIER 1) ET SON CAS PRATIQUE.
 *
 * L'année du cours rejouée avec une équipe où les chiffres des ventes arrivent en retard : le plan
 * et le prix joués au trimestre t sont ceux que le bon gestionnaire proposait au trimestre
 * t − retard. Ces gardes refont le rejeu avec leur propre mémoire, sans passer par le chapitre,
 * vérifient la décision jouée à chaque trimestre (une valeur posée, jamais composée ; l'équipe et
 * ses embauches gardées), recomposent chaque valeur attendue avec le moteur, recomptent les
 * entreprises du chapitre, vérifient que les verdicts se calculent et changent d'une entreprise à
 * l'autre, et que les textes se lisent.
 */

const etatVide: EtatDuCours = { soldes: {} };

/** L'écart à partir duquel deux coûts du retard se comparent sans dépendre d'un dernier chiffre. */
const MARGE_DU_VERDICT = 100;

const BLOC = "STMG Thème 2 · Numérique et intelligence collective";

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

const PARTICIPES = ["vendu", "fabriqué", "sous-traité", "demandé", "servi", "produit", "dernier", "gagné", "offert", "resté"];

/** Les gardes de texte et de forme, communes au chapitre et au cas. */
function verifierLesTextes(ch: Chapitre, code: string) {
  const cas = casDeLEntreprise(code);
  const chapitre = chapitreDuCas(ch, cas);
  const notions = new Set(CONCEPTS.map((x) => x.code));
  const u = cas.unite;
  const masculinFautif = new RegExp(`\\bun ${u}\\b|\\b${u} (${PARTICIPES.join("|")})\\b(?!e)|\\b${u}s (${PARTICIPES.join("|")})s\\b`, "i");
  const unitesAuMasculin = new RegExp(`\\b${cas.unites} (${PARTICIPES.join("|")})s\\b`, "i");
  const unitesAuFeminin = new RegExp(`\\b${cas.unites} (${PARTICIPES.join("|")})es\\b`, "i");
  for (const [i, e] of chapitre.etapes.entries()) {
    const etat = etatAvant(chapitre, cas, i);
    for (const x of textesDe(e, cas, etat)) {
      expect(x, `${e.id} : ${x}`).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|\s)(de|à) [Ll]es? /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/ [-–—] /);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])de [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s'(])que [aeiouyéèêAEIOUYÉ]/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/mises? en situation/i);
      // Pas de trait d'union devant un nombre affiché : un négatif prend le signe moins.
      if (!/^-?\d+(\.\d+)?$/.test(x)) expect(x, `${e.id} : ${x}`).not.toMatch(/(^|[\s(])-\d/);
      expect(x, `${e.id} : ${x}`).not.toMatch(/− −|\+−|\s{2,}/);
      // Les participes s'accordent avec l'unité, au masculin comme au féminin.
      if (UNITES_FEMININES.has(u)) {
        expect(x, `${e.id} : ${x}`).not.toMatch(masculinFautif);
        expect(x, `${e.id} : ${x}`).not.toMatch(unitesAuMasculin);
      } else {
        expect(x, `${e.id} : ${x}`).not.toMatch(unitesAuFeminin);
      }
    }
    if (e.tableau) {
      const t = e.tableau(cas);
      for (const l of t.lignes) expect(l.valeurs.length, `${e.id} : ${l.libelle}`).toBe(t.colonnes.length);
      expect(new Set(t.lignes.map((l) => l.libelle)).size, e.id).toBe(t.lignes.length);
      expect(["lecture", "choix", "montants", "tri"], e.id).toContain(e.type);
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
    // Le test de bout en bout cherche les boutons par leur nom : aucun titre ne les reprend.
    expect(e.titre, e.id).not.toMatch(/vérifier|valider|étape suivante|terminer/i);
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

const nonServie = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);
const somme = (a: readonly CompanyRoundResult[], f: (r: CompanyRoundResult) => number) => Math.round(a.reduce((t, r) => t + f(r), 0));
const dixieme = (x: number) => Math.round(x * 10) / 10;

/**
 * LE REJEU DES GARDES : sa propre mémoire des décisions proposées, et celles qu'il fait jouer.
 * Seuls le plan et le prix viennent du trimestre t − retard ; `seulement` limite le retard à un
 * trimestre (le cas pratique).
 */
interface Rejeu {
  annee: CompanyRoundResult[];
  proposees: RoundDecisions[];
  jouees: RoundDecisions[];
}
const rejeux = new Map<string, Rejeu>();
function rejeuDesGardes(code: string, retard: number, seulement?: number): Rejeu {
  const k = `${code}:${retard}:${seulement ?? "tous"}`;
  const deja = rejeux.get(k);
  if (deja) return deja;
  const proposees: RoundDecisions[] = [];
  const jouees: RoundDecisions[] = [];
  const annee = rejouerAvec(code, `une-information-a-temps:garde-${retard}-${seulement ?? "tous"}`, (t, d) => {
    proposees[t] = structuredClone(d);
    const source = seulement !== undefined && t !== seulement ? t : Math.max(1, t - retard);
    const p = proposees[source]!;
    const j: RoundDecisions =
      source === t
        ? d
        : {
            ...d,
            productionPlan: p.productionPlan,
            price: p.price,
            ...(d.products ? { products: Object.fromEntries(Object.entries(d.products).map(([c, x]) => [c, { ...x, productionPlan: p.products![c]!.productionPlan, price: p.products![c]!.price }])) } : {}),
          };
    jouees[t] = j;
    return j;
  });
  const r = { annee, proposees, jouees };
  rejeux.set(k, r);
  return r;
}

describe("le chapitre et son cas, dans le parcours du management", () => {
  it("porte le titre du programme, au palier 1, et le thème du référentiel STMG qui se résout", () => {
    const ch = UNE_INFORMATION_A_TEMPS;
    expect(ch.code).toBe("une-information-a-temps");
    expect(PROGRAMME["stmg-management"][1]).toContain(ch.titre);
    expect(ch.titre).toBe("Une information qui circule à temps");
    expect(ch.parcours).toBe("stmg-management");
    expect(PARCOURS.find((p) => p.code === "stmg-management")!.formation).toBe("stmg");
    expect(ch.palier).toBe(1);
    expect(ch.libre).toBe(false);
    expect(ch.blocs).toEqual([BLOC]);
    for (const bloc of ch.blocs) {
      expect(referentielDeCitation(bloc)?.code, bloc).toBe("stmg");
      expect(blocOfficiel(bloc, "stmg"), bloc).toBe("Thème 2 · Numérique et intelligence collective");
    }
    // Un code neuf, qu'aucun autre chapitre du registre ne porte.
    expect(CHAPITRES.some((x) => x.code === ch.code && x !== ch)).toBe(false);
  });

  it("le cas est dédié au chapitre : même palier, même parcours, mêmes entreprises, sans cours", () => {
    const s: Situation = LE_COMPTE_RENDU_EN_RETARD;
    const ch = UNE_INFORMATION_A_TEMPS;
    expect(s.reprend).toEqual([ch.code]);
    expect(s.palier).toBe(ch.palier);
    expect(s.parcours).toBe(ch.parcours);
    expect(s.entreprises?.codes).toEqual(ch.entreprises?.codes);
    expect(s.libre).toBe(false);
    expect(s.blocs).toEqual([]);
    expect(s.commanditaire.length).toBeGreaterThan(3);
    expect(s.etapes[0]!.type).toBe("lecture");
    expect(s.etapes.slice(1).filter((e) => e.type === "lecture")).toHaveLength(0);
    expect(s.etapes.at(-1)!.type).toBe("choix");
    expect(s.code).not.toBe(ch.code);
    expect(CHAPITRES.some((x) => x.code === s.code)).toBe(false);
  });

  it("les entreprises du chapitre, recomptées sur le moteur : celles où le retard laisse repartir des clients", () => {
    const recomptees = ENTREPRISES_DU_COURS.filter((code) => {
      const aJour = somme(anneeDeReference(code), nonServie);
      const enRetard = somme(rejeuDesGardes(code, RETARD).annee, nonServie);
      return enRetard - aJour >= 1;
    });
    expect(recomptees).toEqual([...ENTREPRISES_DE_L_INFORMATION]);
    expect(UNE_INFORMATION_A_TEMPS.entreprises!.codes).toEqual(ENTREPRISES_DE_L_INFORMATION);
    // VOLT FITNESS vend des abonnements : aucun client n'y repart sans être servi, à jour ou non.
    expect(ENTREPRISES_DU_COURS.filter((c) => !ENTREPRISES_DE_L_INFORMATION.includes(c))).toEqual(["fitness"]);
    expect(scenarioByCode("fitness").scenario.subscription).toBeDefined();
    for (const retard of [RETARD, RETARD_LONG]) expect(somme(rejeuDesGardes("fitness", retard).annee, nonServie)).toBe(0);
    expect(somme(anneeDeReference("fitness"), nonServie)).toBe(0);
    expect(UNE_INFORMATION_A_TEMPS.entreprises!.pourquoi).toContain("VOLT FITNESS");
  });
});

describe.each(ENTREPRISES_DE_L_INFORMATION)("une information qui circule à temps chez %s", (code) => {
  const cas = casDeLEntreprise(code);
  const reference = anneeDeReference(code);
  const ch = UNE_INFORMATION_A_TEMPS;

  it("l'équipe à jour, c'est l'année du cours ; l'équipe en retard, l'année rejouée par les gardes", () => {
    expect(reference.map((r) => r.incomeStatement.netIncome)).toEqual(anneeJouee(code).partie.rounds.map((t) => t.results["joueur"]!.incomeStatement.netIncome));
    for (const retard of [RETARD, RETARD_LONG]) {
      const chapitre = anneeEnRetard(code, retard);
      const garde = rejeuDesGardes(code, retard).annee;
      expect(chapitre.map((r) => r.incomeStatement.netIncome), `retard ${retard}`).toEqual(garde.map((r) => r.incomeStatement.netIncome));
      expect(chapitre.map((r) => r.production.planned), `retard ${retard}`).toEqual(garde.map((r) => r.production.planned));
      // Aucune défaillance : les quatre trimestres comptent.
      expect(chapitre.some((r) => r.defaillant), `retard ${retard}`).toBe(false);
    }
  });

  it("à chaque trimestre, le plan et le prix joués sont ceux proposés trimestre t − retard ; le reste, celui du trimestre", () => {
    for (const retard of [RETARD, RETARD_LONG]) {
      const { annee, proposees, jouees } = rejeuDesGardes(code, retard);
      annee.forEach((r, i) => {
        const t = i + 1;
        const source = Math.max(1, t - retard);
        // Une valeur posée, jamais un facteur composé : le plan joué est le plan proposé alors.
        expect(r.production.planned, `retard ${retard}, trimestre ${t}`).toBeCloseTo(proposees[source]!.productionPlan, 6);
        expect(jouees[t]!.price, `retard ${retard}, trimestre ${t}`).toBe(proposees[source]!.price);
        // L'équipe et ses embauches, la qualité, l'entretien et la publicité sont ceux du trimestre même.
        expect(jouees[t]!.hr, `retard ${retard}, trimestre ${t}`).toEqual(proposees[t]!.hr);
        expect(jouees[t]!.qualityBudget).toBe(proposees[t]!.qualityBudget);
        expect(jouees[t]!.maintenanceBudget).toBe(proposees[t]!.maintenanceBudget);
        expect(jouees[t]!.marketingBudget).toBe(proposees[t]!.marketingBudget);
      });
      // Le premier trimestre garde la décision du départ : c'est celui de l'année du cours.
      expect(annee[0]!.incomeStatement.netIncome).toBe(reference[0]!.incomeStatement.netIncome);
      // Le plan proposé au trimestre 2 ne dépend que du trimestre 1, le même à jour et en retard.
      expect(annee[2]!.production.planned).toBe(retard === 1 ? reference[1]!.production.planned : reference[0]!.production.planned);
    }
  });

  it("les champs attendent ce que le moteur donne, recomposé à la main, et les verdicts suivent", () => {
    const enRetard = rejeuDesGardes(code, RETARD).annee;
    const long = rejeuDesGardes(code, RETARD_LONG).annee;
    const plans = (a: readonly CompanyRoundResult[]) => a.map((r) => Math.round(r.production.planned));
    const ecarts = plans(enRetard).map((p, i) => p - plans(reference)[i]!);
    expect(ecarts[0]).toBe(0);
    expect(attendus(ch, "le-plan-en-retard", cas)).toEqual({
      [`Écart de plan au trimestre 2 (${cas.unites})`]: ecarts[1],
      [`Écart de plan au trimestre 3 (${cas.unites})`]: ecarts[2],
      [`Écart de plan au trimestre 4 (${cas.unites})`]: ecarts[3],
    });
    const resultat = (a: readonly CompanyRoundResult[]) => somme(a, (r) => r.incomeStatement.operatingIncome);
    const cout = resultat(reference) - resultat(enRetard);
    const coutLong = resultat(reference) - resultat(long);
    expect(attendus(ch, "ce-que-coute-le-retard", cas)).toEqual({
      [`Ventes perdues avec 1 trimestre de retard (${cas.unites})`]: somme(reference, soldUnits) - somme(enRetard, soldUnits),
      [`Demande non servie en plus avec 1 trimestre de retard (${cas.unites})`]: somme(enRetard, nonServie) - somme(reference, nonServie),
      "Résultat perdu avec 1 trimestre de retard": cout,
    });
    expect(attendus(ch, "deux-trimestres", cas)).toEqual({
      [`Demande non servie en plus avec 2 trimestres de retard (${cas.unites})`]: somme(long, nonServie) - somme(reference, nonServie),
      "Résultat perdu avec 2 trimestres de retard": coutLong,
    });
    // Chaque retard coûte, partout : l'information à jour vaut mieux que l'une et l'autre.
    expect(cout).toBeGreaterThan(0);
    expect(coutLong).toBeGreaterThan(0);
    expect(somme(enRetard, nonServie)).toBeGreaterThan(somme(reference, nonServie));

    // Les chiffres de la question : au trimestre 3, avec 1 trimestre de retard, ceux du trimestre 1.
    expect(juste(ch, "quels-chiffres", cas)).toBe(`Les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION - 1 - RETARD}`);

    // Le trimestre le plus touché : le plus grand écart, unique, et ce qu'il a produit.
    const absolus = ecarts.slice(1).map(Math.abs);
    const plusGrand = Math.max(...absolus);
    expect(absolus.filter((x) => x === plusGrand)).toHaveLength(1);
    const t = absolus.indexOf(plusGrand) + 2;
    const ecart = ecarts[t - 1]!;
    expect(juste(ch, "le-trimestre-le-plus-touche", cas)).toBe(
      ecart < 0 ? "Un plan trop bas : des clients sont repartis sans être servis" : "Un plan trop haut : une partie de la production ne s'est pas vendue",
    );
    // Ce que dit la réponse est vrai dans l'arène, ce trimestre-là.
    const r = enRetard[t - 1]!;
    if (ecart < 0) expect(Math.round(nonServie(r))).toBeGreaterThan(Math.round(nonServie(reference[t - 1]!)));
    else expect(Math.round(r.production.produced) - Math.round(soldUnits(r))).toBeGreaterThan(0);

    // Le retard le plus long : le verdict suit les deux coûts, loin de chaque seuil.
    expect(Math.abs(coutLong - cout)).toBeGreaterThan(MARGE_DU_VERDICT);
    expect(Math.abs(coutLong - 2 * cout)).toBeGreaterThan(MARGE_DU_VERDICT);
    expect(juste(ch, "un-chiffre-plus-vieux", cas)).toBe(
      coutLong >= 2 * cout
        ? "Au moins le double du retard le plus court"
        : coutLong >= cout
          ? "Plus que le retard le plus court, mais moins du double"
          : "Moins que le retard le plus court",
    );
    // L'explication lit la demande non servie : elle va dans le sens du coût.
    expect(somme(long, nonServie) > somme(enRetard, nonServie)).toBe(coutLong > cout);
    expect(informationATemps(cas).partDuResultat).toBe(dixieme((cout / resultat(reference)) * 100));
  });

  it("le cas : le trimestre 4 décidé sur le plan et le prix du trimestre 3, recomposé à la main", () => {
    const { annee, proposees, jouees } = rejeuDesGardes(code, RETARD, TRIMESTRE_DECIDE);
    expect(anneeDuCompteRendu(code).map((r) => r.incomeStatement.netIncome)).toEqual(annee.map((r) => r.incomeStatement.netIncome));
    // Les trimestres d'avant sont ceux de l'année du cours ; au trimestre 4, le plan et le prix du trimestre 3.
    for (let i = 0; i < TRIMESTRE_DECIDE - 1; i++) expect(annee[i]!.incomeStatement.netIncome).toBe(reference[i]!.incomeStatement.netIncome);
    expect(annee[TRIMESTRE_DECIDE - 1]!.production.planned).toBeCloseTo(proposees[TRIMESTRE_DECIDE - RETARD]!.productionPlan, 6);
    expect(jouees[TRIMESTRE_DECIDE]!.price).toBe(proposees[TRIMESTRE_DECIDE - RETARD]!.price);
    expect(compteRendu(cas).memesTrimestresAvant).toBe(true);

    const tj = reference[TRIMESTRE_DECIDE - 1]!;
    const tr = annee[TRIMESTRE_DECIDE - 1]!;
    const arrondi = (r: CompanyRoundResult) => ({
      plan: Math.round(r.production.planned),
      ventes: Math.round(soldUnits(r)),
      nonServie: Math.round(nonServie(r)),
      invendu: Math.max(0, Math.round(r.production.produced) - Math.round(soldUnits(r))),
      resultat: Math.round(r.incomeStatement.operatingIncome),
    });
    const j = arrondi(tj);
    const x = arrondi(tr);
    expect(attendus(LE_COMPTE_RENDU_EN_RETARD, "les-ecarts", cas)).toEqual({
      [`Écart de plan (${cas.unites})`]: x.plan - j.plan,
      [`Écart de ventes (${cas.unites})`]: x.ventes - j.ventes,
      [`Écart de demande non servie (${cas.unites})`]: x.nonServie - j.nonServie,
    });
    const cout = j.resultat - x.resultat;
    const resultatDeLAnnee = somme(reference, (r) => r.incomeStatement.operatingIncome);
    expect(attendus(LE_COMPTE_RENDU_EN_RETARD, "le-cout", cas)).toEqual({
      "Résultat perdu au trimestre": cout,
      "Part du résultat de l'année (%)": dixieme((cout / resultatDeLAnnee) * 100),
    });
    expect(cout).toBeGreaterThan(0);
    expect(juste(LE_COMPTE_RENDU_EN_RETARD, "reponse", cas)).toBe(
      x.nonServie - j.nonServie >= x.invendu - j.invendu ? "Des clients sont repartis sans être servis" : "Une partie de l'offre est restée sans acheteur",
    );
    // Dans le cas, la bonne réponse ne se devine pas à sa longueur.
    const options = (LE_COMPTE_RENDU_EN_RETARD.etapes.at(-1) as EtapeChoix).options(cas, etatVide);
    const bonne = options.find((o) => o.juste)!;
    expect(bonne.texte.length).toBeLessThanOrEqual(Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length)));
  });

  it("textes propres, une seule bonne réponse, notions existantes : le chapitre", () => verifierLesTextes(UNE_INFORMATION_A_TEMPS, code));
  it("textes propres, une seule bonne réponse, notions existantes : le cas", () => verifierLesTextes(LE_COMPTE_RENDU_EN_RETARD, code));
});

describe("une information qui circule à temps, sur les huit entreprises", () => {
  it("les verdicts changent d'une entreprise à l'autre", () => {
    const k = ENTREPRISES_DE_L_INFORMATION.map((c) => informationATemps(casDeLEntreprise(c)));
    // Un plan en retard trop haut ne se rencontre qu'à L'ESCALE, au trimestre 4 où la saison retombe.
    expect([...new Set(k.map((x) => x.sens))].sort()).toEqual(["trop-bas", "trop-haut"]);
    expect(ENTREPRISES_DE_L_INFORMATION.filter((_, i) => k[i]!.sens === "trop-haut")).toEqual(["hotel"]);
    // Deux trimestres de retard coûtent plus qu'un chez les unes, moins chez les autres (la saison) ;
    // jamais le double, sur l'année du cours.
    expect([...new Set(k.map((x) => x.verdict))].sort()).toEqual(["moins", "plus-mais-moins-du-double"]);
    expect(ENTREPRISES_DE_L_INFORMATION.filter((_, i) => k[i]!.verdict === "plus-mais-moins-du-double")).toEqual(["nova", "hotel", "batiment"]);
    // Le cas : des clients repartis partout, sauf à L'ESCALE, où des nuitées restent vides.
    const cas = ENTREPRISES_DE_L_INFORMATION.map((c) => compteRendu(casDeLEntreprise(c)).verdict);
    expect([...new Set(cas)].sort()).toEqual(["clients-repartis", "offre-invendue"]);
    expect(ENTREPRISES_DE_L_INFORMATION.filter((_, i) => cas[i] === "offre-invendue")).toEqual(["hotel"]);
  });

  it("chez NOVA, les chiffres du chapitre et du cas", () => {
    const k = informationATemps(casDeLEntreprise("nova"));
    expect(k.ecarts.map((e) => e.ecart)).toEqual([0, -1303, -679, 93]);
    expect(k.plusTouche.trimestre).toBe(2);
    expect(k.ventesPerdues).toBe(1889);
    expect(k.nonServieEnPlus).toBe(3729);
    expect(k.coutDuRetard).toBe(59329);
    expect(k.partDuResultat).toBe(57.6);
    expect(k.coutDuRetardLong).toBe(100951);
    expect(k.verdict).toBe("plus-mais-moins-du-double");
    const r = compteRendu(casDeLEntreprise("nova"));
    expect(r.ecartDePlan).toBe(93);
    expect(r.repartisEnPlus).toBe(1721);
    expect(r.coutDuRetard).toBe(17707);
    expect(r.partDuResultat).toBe(17.2);
    expect(r.verdict).toBe("clients-repartis");
  });
});
