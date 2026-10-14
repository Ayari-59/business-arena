import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  hasard,
  risqueAccident,
  risqueGrandCompte,
  simuler,
} from "../../src/engine/episodes/tournees-qui-debordent";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/tournees-qui-debordent";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_TRANSPORT } from "../../src/pedagogy/episodes/tournees-qui-debordent";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les tournées qui débordent » enseigne trois choses : la tournée
 * se fait au bureau (des créneaux réalistes et des livraisons regroupées
 * rendent la capacité qu'on croit manquer), une livraison ratée coûte deux
 * fois, et la capacité qu'on achète (camion, intérim, heures, sous-traitance
 * permanente) coûte plus que celle qu'on organise : le sous-traitant est fait
 * pour les pics. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 1, 1, 2, 1, 1];
const REFLEXE = [0, 2, 0, 0, 2, 0];
const ATTENTISTE = [3, 0, 3, 3, 3, 3];
const JOURS = 2;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const moyenneDe = (chemin: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
  moyenne(GRAINES_DU_BILAN.map((g) => f(simuler(chemin, g, JOURS))));

describe("le modèle du transport", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    // Mêmes décisions en semaine 1 : même semaine 1, quoi qu'on décide ensuite.
    expect(simuler(MEILLEUR, 12).semaines[1]).toEqual(simuler([1, 0, 3, 3, 3, 3], 12).semaines[1]);
    expect(hasard(12)).toBe(hasard(12));
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

  it("des créneaux réalistes remplissent les tournées et font baisser le coût par livraison", () => {
    expect(moyenneDe(MEILLEUR, (t) => t.arretsMoyens)).toBeGreaterThan(
      moyenneDe(ATTENTISTE, (t) => t.arretsMoyens) + 0.5,
    );
    expect(moyenneDe(MEILLEUR, (t) => t.coutParLivraison)).toBeLessThan(92);
    expect(moyenneDe(ATTENTISTE, (t) => t.coutParLivraison)).toBeGreaterThan(95);
    expect(moyenneDe(MEILLEUR, (t) => t.retardMoyen)).toBeLessThan(
      moyenneDe(ATTENTISTE, (t) => t.retardMoyen) * 0.6,
    );
    expect(moyenneDe(MEILLEUR, (t) => t.partSousTraitance)).toBeLessThan(
      moyenneDe(ATTENTISTE, (t) => t.partSousTraitance) / 2,
    );
  });

  it("les heures supplémentaires fatiguent : l'accident et le départ du grand compte suivent", () => {
    const accidents = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).semaineAccident > 0).length;
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).grandComptePart).length;
    expect(accidents(MEILLEUR)).toBe(0);
    expect(accidents(ATTENTISTE)).toBeGreaterThan(0);
    expect(departs(ATTENTISTE)).toBeGreaterThan(departs(MEILLEUR) + 2);
    expect(risqueAccident(0.4)).toBe(0);
    expect(risqueGrandCompte(0.06)).toBe(0);
    expect(risqueGrandCompte(0.2)).toBeGreaterThan(0.5);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : revoir les créneaux bat de loin le camion de plus et la sous-traitance de tout", () => {
    const r = rejeu(MEILLEUR, D.tournees);
    expect(classement(MEILLEUR, D.tournees)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
  });

  it("D2 : le contrat de pics paie quand les tournées ont été revues ; sinon il coûte", () => {
    const r = rejeu(MEILLEUR, D.soustraitant);
    expect(classement(MEILLEUR, D.soustraitant)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    // Internaliser avec un camion est le pire choix quand la flotte a de la place.
    expect(classement(MEILLEUR, D.soustraitant).at(-1)).toBe(2);
    // Sans tournées revues, la flotte ne peut pas reprendre le volume quotidien.
    const sansCreneaux = [3, 1, 1, 2, 1, 1];
    const s = rejeu(sansCreneaux, D.soustraitant);
    expect(s[1]!.attendu).toBeLessThan(s[0]!.attendu);
    expect(classement(sansCreneaux, D.soustraitant)[0]).not.toBe(1);
  });

  it("D3 : regrouper par chantier et par secteur bat la tournée express", () => {
    const r = rejeu(MEILLEUR, D.regroupement);
    const c = classement(MEILLEUR, D.regroupement);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D4 : livrer en avance est le meilleur en moyenne, réserver le plus sûr ; louer des camions coûte", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10 + 2000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("D5 : confirmer la veille bat la facturation et la relivraison en heures supplémentaires", () => {
    const r = rejeu(MEILLEUR, D.ratees);
    expect(classement(MEILLEUR, D.ratees)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2000);
  });

  it("D6 : le calendrier par secteur et le sous-traitant pour le surplus battent les samedis", () => {
    const r = rejeu(MEILLEUR, D.fin);
    expect(classement(MEILLEUR, D.fin)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("organiser les tournées bat l'achat de capacité et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 60000);
    expect(methode).toBeGreaterThan(attentiste! + 60000);
    expect(methode).toBeGreaterThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tournees", "retards"],
      ["capacite"],
      ["commandes"],
      ["historique"],
      ["echecs"],
      [],
    ],
    jours: JOURS,
    diagnostic: "creneaux",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 8,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_TRANSPORT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a acheté de la capacité partout, propose de l'organiser d'abord", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_TRANSPORT.comportements(p, analyser(EPISODE_TRANSPORT, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_TRANSPORT.axe(c).titre).toBe("Organiser la capacité avant de l'acheter");
  });

  it("à qui a décidé sans enquêter, propose d'analyser les tournées", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_TRANSPORT.comportements(p, analyser(EPISODE_TRANSPORT, p).trimestre);
    expect(EPISODE_TRANSPORT.axe(c).titre).toBe(
      "Analyser les tournées avant d'acheter des camions",
    );
  });

  it("dit le résultat en écart au budget logistique", () => {
    expect(EPISODE_TRANSPORT.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_TRANSPORT.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
