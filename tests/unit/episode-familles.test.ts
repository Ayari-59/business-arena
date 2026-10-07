import { describe, expect, it } from "vitest";
import {
  APPELS,
  AS_SEMAINE_MATIN,
  AS_WEEK_END_MATIN,
  COUTS,
  D,
  HEURE_AS,
  HEURE_AS_DIMANCHE,
  HEURE_INTERIM,
  HEURES_RENFORT,
  IMPREVUS,
  INTERIM_WEEK_END,
  LINGE,
  MINIMUM_INTERIM,
  PART_APPELS_LONGS,
  RENFORT_TRIMESTRE,
  RENFORT_WEEK_END,
  SEMAINES,
  chanceDApaisement,
  chanceDInspection,
  chanceQueLesVolontairesTiennent,
  hasard,
  perteDAdmissions,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/famille-qui-ecrit";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/famille-qui-ecrit";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_FAMILLES } from "../../src/pedagogy/episodes/famille-qui-ecrit";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La famille qui écrit à l'ARS » enseigne qu'une réclamation est
 * une information : on établit les faits, on reçoit la famille, on répond à
 * l'ARS avec des faits et un plan daté, on corrige l'organisation (le matin du
 * week-end, le linge) et on associe les familles. La défense de principe et la
 * sanction rapide d'une soignante aggravent la situation. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [0, 0, 0, 0, 0, 0];
const DEFENSE = [1, 1, 1, 3, 3, 1];
const ATTENTISTE = [3, 2, 3, 3, 3, 3];
const SANCTION = [2, 0, 0, 0, 0, 0];
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

/** Un montant tel que les sources l'écrivent : « 1 560 € ». */
const euros = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("les plannings donnent de quoi calculer le coût du renfort du week-end", () => {
    const plannings = texte(0, "plannings");
    expect(plannings).toContain(`${AS_SEMAINE_MATIN} aides-soignantes prennent leur poste à 7 h`);
    expect(plannings).toContain(`${AS_WEEK_END_MATIN} de 7 h à 9 h`);
    expect(plannings).toContain(`coûte ${euros(HEURE_AS)} charges comprises`);
    expect(plannings).toContain(`${euros(HEURE_AS_DIMANCHE)} le dimanche`);
    // 2 h × 28 € le samedi + 2 h × 32 € le dimanche, sur treize week-ends : 1 560 €.
    expect(RENFORT_WEEK_END).toBe(HEURES_RENFORT * (28 + 32));
    expect(RENFORT_TRIMESTRE).toBe(13 * 2 * 28 + 13 * 2 * 32);
    expect(RENFORT_TRIMESTRE).toBe(1560);
    expect(EPISODE_FAMILLES.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(1.56, 9);
  });

  it("le journal des appels et le linge tiennent les chiffres du modèle", () => {
    const appels = texte(0, "appels");
    expect(appels).toContain(`en ${APPELS.semaine} minutes en moyenne`);
    expect(appels).toContain(`en ${APPELS.weekEnd} minutes`);
    expect(appels).toContain(`${Math.round(PART_APPELS_LONGS * 100)} % des appels`);
    // Le tableau de bord de départ montre le même délai.
    expect(tableauDeBord([], 1, 0, 0).appels).toBe(APPELS.weekEnd);
    const linge = texte(0, "linge");
    // 8 pièces par semaine sur huit semaines : 64.
    expect(LINGE.depuis * 8).toBe(64);
    expect(linge).toContain("64 pièces");
    expect(linge).toContain(`${Math.round(LINGE.nonMarquees * 100)} %`);
    expect(linge).toContain(`pénalité de ${euros(LINGE.penalite)}`);
    expect(linge).toContain(`${euros(LINGE.remboursement)} par pièce`);
  });

  it("les devis du renfort, de l'intérim et du linge sont ceux du modèle", () => {
    const volontaires = texte(D.weekEnd, "volontaires", { sanction: false });
    expect(volontaires).toContain(`${euros(RENFORT_WEEK_END)} par week-end`);
    expect(volontaires).toContain("une chance sur cinq");
    expect(chanceQueLesVolontairesTiennent(MEILLEUR)).toBe(0.8);
    // 4 heures au moins, deux jours, à 60 € : 480 € par week-end.
    expect(INTERIM_WEEK_END).toBe(2 * MINIMUM_INTERIM * HEURE_INTERIM);
    expect(INTERIM_WEEK_END).toBe(480);
    expect(texte(D.weekEnd, "soralis")).toContain(`${euros(INTERIM_WEEK_END)} par week-end`);
    expect(ETAPES[D.weekEnd]!.options[1]!.d).toContain(euros(INTERIM_WEEK_END));
    expect(texte(D.linge, "lingerie")).toContain(`${euros(COUTS.lingerie)} par semaine`);
    expect(ETAPES[D.linge]!.options[0]!.d).toContain(euros(COUTS.marquage));
  });

  it("le siège dit à peu près les chances d'inspection du modèle", () => {
    expect(texte(D.ars, "precedents")).toContain("neuf fois sur dix");
    expect(texte(D.ars, "precedents")).toContain("deux fois sur trois");
    expect(chanceDInspection(MEILLEUR, false)).toBeCloseTo(0.1, 9);
    expect(chanceDInspection([0, 0, 1, 0, 0, 0], false)).toBeCloseTo(0.7, 9);
    // Des faits établis rendent la même réponse factuelle bien plus convaincante.
    expect(chanceDInspection([3, 0, 0, 0, 0, 0], false)).toBeGreaterThan(0.25);
  });
});

describe("le modèle de l'EHPAD", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(5)).toBe(hasard(5));
    expect(simuler(MEILLEUR, 12).semaines[1]!.linge).toBeCloseTo(
      simuler(DEFENSE, 12).semaines[1]!.linge,
      9,
    );
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const imp = hasard(g).imprevus;
      expect(imp.length).toBeGreaterThanOrEqual(1);
      expect(imp.length).toBeLessThanOrEqual(2);
      for (const i of imp) {
        expect(i.semaine).toBeGreaterThanOrEqual(2);
        expect(i.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("la famille reçue avec des faits s'apaise ; sinon d'autres familles s'en mêlent souvent", () => {
    expect(chanceDApaisement(MEILLEUR)).toBeGreaterThan(0.8);
    expect(chanceDApaisement([1, 0, 0, 0, 0, 0])).toBeLessThan(0.4);
    const apaisees = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).apaisee).length;
    expect(apaisees).toBeGreaterThanOrEqual(22);
    const autres = GRAINES_DU_BILAN.filter((g) => simuler(DEFENSE, g).autres).length;
    expect(autres).toBeGreaterThan(10);
  });

  it("une réponse défensive fait venir l'inspection bien plus souvent", () => {
    const inspections = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).inspection).length;
    expect(inspections(MEILLEUR)).toBeLessThanOrEqual(6);
    expect(inspections([0, 0, 1, 0, 0, 0])).toBeGreaterThanOrEqual(15);
  });

  it("une sanction sans faits met l'équipe en arrêt et fait partir quelqu'un", () => {
    const ts = GRAINES_DU_BILAN.map((g) => simuler(SANCTION, g));
    expect(ts.filter((t) => t.arrets).length).toBeGreaterThan(10);
    expect(ts.filter((t) => t.depart).length).toBeGreaterThan(6);
    expect(GRAINES_DU_BILAN.some((g) => simuler(MEILLEUR, g).arrets)).toBe(false);
  });

  it("garde des chiffres réalistes, et le renfort ramène la sonnette sous l'objectif", () => {
    for (const c of [MEILLEUR, DEFENSE, ATTENTISTE, SANCTION]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeLessThan(0);
        expect(t.objectif).toBeGreaterThan(-90000);
        expect(t.listeFinale).toBeGreaterThan(8);
        expect(t.listeFinale).toBeLessThan(40);
        expect(t.absenteismeMoyen).toBeLessThan(0.2);
        for (const s of t.semaines.slice(1)) {
          expect(s!.appels).toBeLessThanOrEqual(28);
          expect(s!.appels).toBeGreaterThanOrEqual(5);
        }
      }
    }
    const t = simuler(MEILLEUR, 2);
    expect(t.semaines.length).toBe(SEMAINES + 1);
    // Sans renfort, la sonnette reste lente, sauf quand l'ARS l'impose après une inspection.
    const sansRenfort = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g));
    for (const t of sansRenfort) if (!t.inspection) expect(t.appelsFin).toBeGreaterThan(15);
    // Quand le renfort tient, la sonnette du week-end matin passe sous l'objectif.
    const tenus = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g)).filter(
      (t) => t.finDuRenfort === null,
    );
    expect(tenus.length).toBeGreaterThanOrEqual(20);
    expect(moyenne(tenus.map((t) => t.appelsFin))).toBeLessThan(APPELS.objectif);
    // Une liste d'attente qui fond allonge le délai d'admission du trimestre suivant.
    expect(perteDAdmissions(20)).toBeGreaterThan(perteDAdmissions(30));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : établir les faits avec l'équipe ; défendre en bloc et sanctionner coûtent cher", () => {
    const r = rejeu(MEILLEUR, D.equipe);
    expect(classement(MEILLEUR, D.equipe)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D2 : recevoir la famille vaut d'autant plus que les faits ont été établis", () => {
    expect(classement(MEILLEUR, D.famille)[0]).toBe(0);
    expect(classement(MEILLEUR, D.famille).at(-1)).toBe(1);
    const gain = (c: readonly number[]) => {
      const r = rejeu(c, D.famille);
      // Recevoir plutôt qu'écrire : l'écart double quand on a des faits à montrer.
      return r[0]!.attendu - r[1]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([3, 0, 0, 0, 0, 0]));
  });

  it("D3 : une réponse factuelle avec un plan daté bat la défense et le bouc émissaire", () => {
    const c = classement(MEILLEUR, D.ars);
    expect(c[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.ars);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
    expect(c.at(-1)).toBe(2);
  });

  it("D4 : le renfort des volontaires est le meilleur en moyenne, l'intérim le plus sûr ; après une sanction, l'intérim gagne", () => {
    const r = rejeu(MEILLEUR, D.weekEnd);
    expect(classement(MEILLEUR, D.weekEnd)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(classement(SANCTION, D.weekEnd)[0]).toBe(1);
  });

  it("D5 : exiger un plan du blanchisseur et marquer le linge bat les remboursements", () => {
    const c = classement(MEILLEUR, D.linge);
    expect(c[0]).toBe(0);
    const r = rejeu(MEILLEUR, D.linge);
    expect(r[0]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(1500);
  });

  it("D6 : associer les familles au conseil de la vie sociale ; le droit de réponse est le pire", () => {
    expect(classement(MEILLEUR, D.cvs)[0]).toBe(0);
    expect(classement(MEILLEUR, D.cvs).at(-1)).toBe(1);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et la méthode n'en contient aucun", () => {
    for (const [d, o] of REFLEXES) {
      const c = [...MEILLEUR];
      c[d] = o;
      expect(mesurerDecision(EPISODE_FAMILLES, c, d, JOURS).bonne, `${d}:${o}`).toBe(false);
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
    }
  });

  it("établir les faits bat nettement la défense de l'établissement et l'attentisme", () => {
    const [methode, defense, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - defense!).toBeGreaterThan(15000);
    expect(methode! - attente!).toBeGreaterThan(10000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["appels", "plannings"],
      ["lettre"],
      ["courrier"],
      ["volontaires"],
      ["contrat"],
      ["cvs"],
    ],
    jours: JOURS,
    diagnostic: "organisation",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 1.5,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_FAMILLES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a défendu l'établissement partout, propose de corriger l'organisation", () => {
    const p = partie(DEFENSE);
    const c = EPISODE_FAMILLES.comportements(p, analyser(EPISODE_FAMILLES, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_FAMILLES.axe(c).titre).toBe(
      "Corriger l'organisation, ni défendre ni sanctionner",
    );
  });

  it("à qui a décidé sans enquêter, propose d'établir les faits", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_FAMILLES.comportements(p, analyser(EPISODE_FAMILLES, p).trimestre);
    expect(EPISODE_FAMILLES.axe(c).titre).toBe("Établir les faits avant de répondre");
  });

  it("calibre la prévision du coût du renfort en k€", () => {
    const juste = partie(MEILLEUR, { prevision: 1.56 });
    const c = EPISODE_FAMILLES.comportements(juste, simuler(MEILLEUR, 11, JOURS));
    expect(c[3]!.score).toBe(1);
    const loin = partie(MEILLEUR, { prevision: 3.12 });
    expect(EPISODE_FAMILLES.comportements(loin, simuler(MEILLEUR, 11, JOURS))[3]!.score).toBe(0);
  });

  it("dit ce que la réclamation a coûté", () => {
    expect(EPISODE_FAMILLES.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /^La réclamation a coûté \d+ k€, admissions comprises$/,
    );
    expect(EPISODE_FAMILLES.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
  });
});
