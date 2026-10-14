import { describe, expect, it } from "vitest";
import {
  BAISSE_PAR_JOUR,
  COUT_INADAPTEE,
  D,
  DELAI_DEPART,
  DEPENDANCE,
  ETAPES_DU_DELAI,
  IMPREVUS,
  INACTIFS_DEPART,
  LISTE,
  MANQUE_A_GAGNER,
  NUITS_DE_RENFORT,
  NUIT_INTERIM,
  O,
  PERTE_BAISSE_JOUR,
  PLACES,
  PLACES_ASH,
  PLACES_LIBRES,
  PRIX_ASH,
  PRIX_LIBRE,
  PRIX_MOYEN,
  RECETTE_JOUR,
  RISQUE_INADAPTEE,
  chanceOrchidia,
  delaiAppels,
  hasard,
  simuler,
} from "../../src/engine/episodes/lits-vides";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES, centimes } from "../../src/config/episodes/lits-vides";
import { euros } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ADMISSIONS } from "../../src/pedagogy/episodes/lits-vides";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les lits qui restent vides » enseigne qu'un lit vide est un
 * délai d'admission, pas un manque de demande : 52 jours entre une chambre
 * libérée et l'entrée suivante, qui se raccourcissent étape par étape
 * (commission, liste, dossier, visite), quand une baisse de prix ou une
 * campagne n'y touchent pas. Il enseigne aussi qu'admettre vite ne dispense
 * pas d'évaluer, et que les prescripteurs se gagnent par la réponse rapide.
 * Ces tests verrouillent les chiffres des sources et les classements qui le
 * disent.
 */

const MEILLEUR = [1, 0, 0, 1, 1, 1];
const REFLEXE = [0, 3, 2, 0, 2, 2];
const ATTENTISTE = [3, 1, 3, 2, 0, 3];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne sur les trente tirages. */
const ecart = (chemin: readonly number[], d: number, o: number, autre: number) =>
  attendu(avec(chemin, d, o)) - attendu(avec(chemin, d, autre));
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le parcours des dernières entrées se décompose en 52 jours, et les appels en cinq appels sans suite", () => {
    const parcours = texte(0, "parcours");
    expect(DELAI_DEPART).toBe(52);
    expect(parcours).toContain(`${DELAI_DEPART} jours en moyenne`);
    for (const [etape, j] of Object.entries(ETAPES_DU_DELAI)) {
      expect(parcours, etape).toContain(`${j} jours`);
    }
    // Cinquante inscrits qui ne viendront pas pour dix qui viendront : cinq appels sans suite,
    // deux jours chacun, plus l'appel qui aboutit.
    expect(INACTIFS_DEPART / LISTE.actifs).toBe(5);
    expect(delaiAppels(INACTIFS_DEPART, LISTE.actifs)).toBe(ETAPES_DU_DELAI.appels);
    expect(simuler(ATTENTISTE, 1).semaines[1]!.delai).toBeCloseTo(DELAI_DEPART, 6);
  });

  it("une journée rapporte 94 € d'hébergement et de dépendance, et huit lits vides en coûtent 274,48 k€ par an", () => {
    const recettes = texte(0, "recettes");
    expect(PRIX_MOYEN).toBe(75);
    expect((PLACES_ASH * PRIX_ASH + PLACES_LIBRES * PRIX_LIBRE) / PLACES).toBe(75);
    expect(recettes).toContain(`${PLACES_ASH} places habilitées à l'aide sociale à ${PRIX_ASH} €`);
    expect(recettes).toContain(`${PLACES_LIBRES} places à tarif libre à ${PRIX_LIBRE} €`);
    expect(recettes).toContain(`${PRIX_MOYEN} € en moyenne`);
    expect(recettes).toContain(`${DEPENDANCE} € en moyenne`);
    expect(RECETTE_JOUR).toBe(94);
    expect(recettes).toContain(`${RECETTE_JOUR} € qui ne seront pas facturés`);
    // La prévision demandée en semaine 1 : 8 × 365 × 94 €, sans le forfait soins.
    expect(MANQUE_A_GAGNER).toBe(8 * 365 * 94);
    expect(EPISODE_ADMISSIONS.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(274.48, 6);
  });

  it("la baisse de 5 % retire 3,90 € par journée sur les places libres", () => {
    expect(BAISSE_PAR_JOUR).toBeCloseTo(3.9, 9);
    expect(ETAPES[0]!.options[O.lits.baisse]!.d).toContain(centimes(PRIX_LIBRE - BAISSE_PAR_JOUR));
    expect(centimes(PRIX_LIBRE - BAISSE_PAR_JOUR)).toBe("74,10 €");
    expect(PERTE_BAISSE_JOUR).toBeCloseTo((3.9 * 66) / 88, 9);
    // Sur un trimestre à 91 %, la baisse coûte une vingtaine de milliers d'euros.
    const coutTrimestre = PLACES * 0.91 * 91 * PERTE_BAISSE_JOUR;
    expect(coutTrimestre).toBeGreaterThan(20000);
    expect(coutTrimestre).toBeLessThan(23000);
  });

  it("la liste se décompose en soixante inscrits, dont dix prêts à entrer", () => {
    const { inscrits, ailleurs, pasMaintenant, partis, horsProfil, actifs } = LISTE;
    expect(ailleurs + pasMaintenant + partis + horsProfil + actifs).toBe(inscrits);
    const bilan = ETAPES[D.liste]!.reactions[O.liste.appeler]![0]!.texte;
    for (const n of [inscrits, ailleurs, pasMaintenant, partis, horsProfil, actifs]) {
      expect(bilan).toContain(`${n} `);
    }
  });

  it("une admission inadaptée coûte trois semaines de renfort de nuit : 8 400 €, trois fois sur dix sur dossier seul", () => {
    expect(COUT_INADAPTEE).toBe(NUITS_DE_RENFORT * NUIT_INTERIM);
    expect(COUT_INADAPTEE).toBe(8400);
    const chalon = texte(D.evaluation, "chalon");
    expect(chalon).toContain(`${NUITS_DE_RENFORT} nuits`);
    expect(chalon).toContain(euros(NUIT_INTERIM));
    expect(chalon).toContain(euros(COUT_INADAPTEE));
    expect(chalon).toContain("Dix admissions");
    expect(chalon).toContain("trois dépassaient");
    expect(RISQUE_INADAPTEE[O.evaluation.surDossier]).toBe(3 / 10);
    expect(RISQUE_INADAPTEE[O.evaluation.sous72h]).toBe(1 / 25);
  });
});

describe("le modèle des admissions", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.sorties).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.sorties,
      9,
    );
    expect(hasard(5)).toBe(hasard(5));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
      for (const i of hasard(g).imprevus) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("le bon circuit ramène l'occupation vers la cible ; l'attente la laisse filer", () => {
    const fin = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).occupationFin));
    expect(fin(MEILLEUR)).toBeGreaterThan(0.95);
    expect(fin(ATTENTISTE)).toBeLessThan(0.9);
    expect(fin(ATTENTISTE)).toBeGreaterThan(0.8);
    for (const g of GRAINES_DU_BILAN) {
      for (const s of simuler(ATTENTISTE, g).semaines.slice(1)) {
        expect(s!.occupation).toBeGreaterThan(0.8);
        expect(s!.occupation).toBeLessThanOrEqual(1);
      }
    }
  });

  it("admettre sur dossier seul multiplie les admissions inadaptées", () => {
    const inadaptees = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).inadaptees.length));
    const surDossier = avec(MEILLEUR, D.evaluation, O.evaluation.surDossier);
    expect(inadaptees(surDossier)).toBeGreaterThan(3 * inadaptees(MEILLEUR));
    // Le sort de chaque admission est tiré au hasard : le nombre varie d'un tirage à l'autre.
    const nombres = GRAINES_DU_BILAN.map((g) => simuler(surDossier, g).inadaptees.length);
    expect(Math.max(...nombres)).toBeGreaterThan(Math.min(...nombres) + 1);
  });

  it("Orchidia signe sa convention plus souvent quand vous répondez lentement", () => {
    expect(chanceOrchidia(MEILLEUR)).toBeLessThan(chanceOrchidia(ATTENTISTE));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : resserrer le circuit bat de loin la baisse de prix, la publicité et l'attente", () => {
    const c = classement(MEILLEUR, D.lits);
    expect(c[0]).toBe(O.lits.circuit);
    expect(ecart(MEILLEUR, D.lits, O.lits.circuit, O.lits.attendre)).toBeGreaterThan(20000);
    // La baisse est la pire : elle se paie sur toutes les journées des places libres.
    expect(c.at(-1)).toBe(O.lits.baisse);
    expect(ecart(MEILLEUR, D.lits, O.lits.campagne, O.lits.attendre)).toBeLessThan(0);
  });

  it("D2 : appeler toute la liste vaut plus que le courrier, et vaut d'autant plus que le circuit est rapide", () => {
    expect(classement(MEILLEUR, D.liste)[0]).toBe(O.liste.appeler);
    const rapide = ecart(MEILLEUR, D.liste, O.liste.appeler, O.liste.garder);
    const lent = ecart(ATTENTISTE, D.liste, O.liste.appeler, O.liste.garder);
    expect(rapide).toBeGreaterThan(lent + 5000);
    expect(ecart(MEILLEUR, D.liste, O.liste.enLigne, O.liste.appeler)).toBeLessThan(-20000);
  });

  it("D3 : la convention est la meilleure en moyenne, le réseau de proximité le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.prescripteurs);
    expect(classement(MEILLEUR, D.prescripteurs)[0]).toBe(O.prescripteurs.convention);
    expect(r[O.prescripteurs.convention]!.attendu).toBeGreaterThan(
      r[O.prescripteurs.reseau]!.attendu + 3000,
    );
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[O.prescripteurs.reseau]!.p10);
    expect(
      ecart(MEILLEUR, D.prescripteurs, O.prescripteurs.geste, O.prescripteurs.rien),
    ).toBeLessThan(2000);
  });

  it("D3 : la convention ne vaut que si la commission répond vite ; sinon, le réseau de proximité la bat", () => {
    const lent = avec(MEILLEUR, D.lits, O.lits.attendre);
    const rapide = ecart(
      MEILLEUR,
      D.prescripteurs,
      O.prescripteurs.convention,
      O.prescripteurs.reseau,
    );
    const sansCircuit = ecart(
      lent,
      D.prescripteurs,
      O.prescripteurs.convention,
      O.prescripteurs.reseau,
    );
    expect(rapide).toBeGreaterThan(0);
    expect(sansCircuit).toBeLessThan(0);
    expect(rapide).toBeGreaterThan(sansCircuit + 10000);
  });

  it("D4 : évaluer sous 72 heures bat l'admission sur dossier et la visite habituelle", () => {
    const c = classement(MEILLEUR, D.evaluation);
    expect(c[0]).toBe(O.evaluation.sous72h);
    expect(
      ecart(MEILLEUR, D.evaluation, O.evaluation.sous72h, O.evaluation.surDossier),
    ).toBeGreaterThan(10000);
    expect(
      ecart(MEILLEUR, D.evaluation, O.evaluation.sous72h, O.evaluation.garder),
    ).toBeGreaterThan(2000);
    expect(c.at(-1)).toBe(O.evaluation.sansHopital);
  });

  it("D5 : suspendre aux Tilleuls seulement est le meilleur pari, tout suspendre le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.grippe);
    expect(classement(MEILLEUR, D.grippe)[0]).toBe(O.grippe.cibler);
    expect(r[O.grippe.toutSuspendre]!.p10).toBeGreaterThan(r[O.grippe.cibler]!.p10);
    // Maintenir les entrées contre l'avis de l'équipe d'hygiène ne paie pas.
    expect(ecart(MEILLEUR, D.grippe, O.grippe.cibler, O.grippe.maintenir)).toBeGreaterThan(3000);
  });

  it("D6 : écrire la procédure bat la campagne et la baisse, et vaut d'autant plus que le délai a baissé", () => {
    const c = classement(MEILLEUR, D.printemps);
    expect(c[0]).toBe(O.printemps.procedure);
    expect(c.at(-1)).toBe(O.printemps.baisse);
    const gagne = ecart(MEILLEUR, D.printemps, O.printemps.procedure, O.printemps.rien);
    const rienGagne = ecart(ATTENTISTE, D.printemps, O.printemps.procedure, O.printemps.rien);
    expect(gagne).toBeGreaterThan(rienGagne + 5000);
  });

  it("fluidifier l'admission bat nettement la baisse de prix et l'attente", () => {
    const [methode, reflexe, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 50000);
    expect(methode).toBeGreaterThan(attente! + 50000);
    expect(reflexe).toBeLessThan(attente!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni pris par la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect((REFERENCES[0].chemin as readonly number[])[d]).not.toBe(o);
      const m = mesurerDecision(EPISODE_ADMISSIONS, avec(MEILLEUR, d, o), d, JOURS);
      expect(m.bonne, `réflexe [${d}, ${o}]`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["parcours", "recettes"],
      ["echantillon"],
      ["demandes"],
      ["chalon"],
      ["hygiene"],
      ["delai"],
    ],
    jours: JOURS,
    diagnostic: "circuit",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 274,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_ADMISSIONS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a baissé le prix et communiqué, propose de raccourcir le délai", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ADMISSIONS.comportements(p, analyser(EPISODE_ADMISSIONS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ADMISSIONS.axe(c).titre).toBe("Raccourcir le délai, pas baisser le prix");
  });

  it("à qui a décidé sans enquêter, propose de chronométrer une chambre vide", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ADMISSIONS.comportements(p, analyser(EPISODE_ADMISSIONS, p).trimestre);
    expect(EPISODE_ADMISSIONS.axe(c).titre).toBe(
      "Chronométrer une chambre vide avant de toucher au prix",
    );
  });

  it("juge la prévision au calcul près, et compte le forfait soins comme une erreur", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const juste = EPISODE_ADMISSIONS.comportements(partie(MEILLEUR, { prevision: 275 }), t);
    const avecSoins = EPISODE_ADMISSIONS.comportements(partie(MEILLEUR, { prevision: 380 }), t);
    expect(juste[3]!.score).toBe(1);
    expect(avecSoins[3]!.score).toBe(0);
  });

  it("dit le résultat en recettes et en effet sur le printemps", () => {
    expect(EPISODE_ADMISSIONS.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/printemps/);
    expect(simuler(MEILLEUR, 4242).printemps).toBeGreaterThan(0);
    expect(simuler(ATTENTISTE, 4242).printemps).toBeLessThan(0);
  });
});
