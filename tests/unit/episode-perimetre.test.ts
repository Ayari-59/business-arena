import { describe, expect, it } from "vitest";
import {
  COUT_JOUR,
  D,
  DEMANDES,
  FUITE_A_VENIR,
  HONORAIRES,
  HORS_PERIMETRE,
  IMPREVUS,
  JOURS_BUDGET,
  JOURS_DEMANDES,
  JOURS_DIRECTION,
  JOURS_EQUIPE,
  MARGE_BUDGET,
  MARGE_SUITE,
  MARGE_SUITE_REMISEE,
  REALISATION_SI_ABSORBE,
  RENFORT,
  SUITE,
  TJM,
  chanceAvenantDemarrage,
  chanceDeSuite,
  fuiteDeBase,
  hasard,
  risqueErreur,
  simuler,
} from "../../src/engine/episodes/client-qui-en-demande-plus";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/client-qui-en-demande-plus";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_PERIMETRE,
  PREVISION_EN_POURCENTS,
} from "../../src/pedagogy/episodes/client-qui-en-demande-plus";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le client qui en demande toujours plus » enseigne qu'un forfait
 * se protège en cadrant le périmètre : chaque demande absorbée gratuitement
 * coûte des jours non facturés et du retard sur le cœur de mission ; un
 * avenant proposé tôt est souvent signé, tard il passe pour une facture
 * surprise ; l'échange « ceci plutôt que cela » garde la marge et la
 * relation ; et la suite se joue sur la satisfaction de la sponsor. Ces
 * tests verrouillent les classements qui le disent, et recalculent depuis
 * le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 3, 0];
const ATTENTISTE = [3, 0, 0, 0, 2, 0];
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
/** L'option qui protège le mieux dans les mauvais tirages. */
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
/** Un nombre tel qu'une source l'écrit : « 94,5 ». */
const fr = (v: number) => String(v).replace(".", ",");
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_PERIMETRE.contexte(
    EPISODE_PERIMETRE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle de la mission Morvanel", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    const a = simuler(MEILLEUR, 12);
    const b = simuler(REFLEXE, 12);
    expect(a.semaines[1]!.retard).toBeCloseTo(b.semaines[1]!.retard, 9);
    expect(hasard(12)).toBe(hasard(12));
    expect(a.consolider).toBe(b.consolider);
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const n = hasard(g).imprevus.length;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(2);
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

  it("dire oui à tout détruit la marge, le taux de réalisation et la suite ; cadrer les tient", () => {
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g, JOURS));
    const oui = GRAINES_DU_BILAN.map((g) => simuler(REFLEXE, g, JOURS));
    expect(moyenne(bon.map((t) => t.realisation))).toBeGreaterThan(0.9);
    expect(moyenne(oui.map((t) => t.realisation))).toBeLessThan(0.75);
    expect(moyenne(bon.map((t) => t.marge))).toBeGreaterThan(MARGE_BUDGET);
    expect(moyenne(oui.map((t) => t.marge))).toBeGreaterThan(20000);
    expect(bon.filter((t) => t.suiteAccordee).length).toBeGreaterThan(
      2 * oui.filter((t) => t.suiteAccordee).length,
    );
    // L'équipe qui court livre une erreur bien plus souvent.
    expect(bon.filter((t) => t.erreur).length).toBe(0);
    expect(oui.filter((t) => t.erreur).length).toBeGreaterThan(10);
    expect(risqueErreur(20)).toBe(0);
  });

  it("l'avenant se signe mieux quand le cadre est posé tôt ; la suite suit la satisfaction", () => {
    const avec = (d1: number) => chanceAvenantDemarrage([d1, 1, 1, 1, 1, 1]);
    expect(avec(1)).toBeGreaterThan(avec(2));
    expect(avec(2)).toBeGreaterThan(avec(0));
    expect(avec(0)).toBe(avec(3));
    expect(chanceDeSuite(80, 1)).toBeGreaterThan(chanceDeSuite(60, 1));
    expect(chanceDeSuite(80, 0.55)).toBeLessThan(chanceDeSuite(80, 1));
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("les quatre demandes, et le taux de réalisation que la semaine 1 demande", () => {
    expect(JOURS_DEMANDES).toBe(40);
    expect(HORS_PERIMETRE).toBe(34);
    expect(JOURS_BUDGET).toBe(JOURS_EQUIPE + JOURS_DIRECTION);
    expect(HONORAIRES / JOURS_BUDGET).toBe(TJM);
    const texte = source(0, "tempora", []);
    for (const d of DEMANDES) expect(texte).toContain(`(${d.jours} jours)`);
    expect(texte).toContain(`${JOURS_DEMANDES} jours en tout`);
    expect(texte).toContain(`${COUT_JOUR} €`);
    expect(source(0, "proposition", [])).toContain(`${JOURS_BUDGET} jours`);
    // Le tableau de bord est au contrat : seuls 34 jours s'ajoutent aux 330 budgétés.
    expect(PREVISION_EN_POURCENTS).toBeCloseTo((100 * 330) / 364, 6);
    expect(EPISODE_PERIMETRE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(90.66, 2);
    expect(REALISATION_SI_ABSORBE).toBeLessThan(HONORAIRES / ((JOURS_BUDGET + 0) * TJM));
  });

  it("l'avenant de septembre, la marge prévue, et ce que coûte chaque jour offert", () => {
    expect(MARGE_BUDGET).toBe(132000);
    expect(ETAPES[D.demandes]!.options[1]!.d).toContain(`${(HORS_PERIMETRE * TJM) / 1000} k€`);
    // Ce que l'enveloppe laisse après l'avenant de septembre couvre celui de la ligne de surgelés.
    const reste = 60 - (HORS_PERIMETRE * TJM) / 1000;
    expect(reste).toBe(26);
    expect(reste).toBeGreaterThanOrEqual(24);
    const avenant = GRAINES_DU_BILAN.find((g) => simuler(MEILLEUR, g).avenant1)!;
    expect(source(D.demarrage, "budget", [1], avenant)).toContain(`il en reste ${reste}`);
  });

  it("la suite : sa marge, ce que vaut un accord ou une mise en concurrence, ce que coûte la remise", () => {
    const texte = source(D.suite, "chiffrage", [1, 1, 1, 1]);
    expect(MARGE_SUITE).toBe(105000);
    expect(texte).toContain(`${MARGE_SUITE / 1000} k€`);
    expect(texte).toContain(`${fr((SUITE.signature * MARGE_SUITE) / 1000)} k€`);
    expect(texte).toContain(`${fr((SUITE.concurrence * MARGE_SUITE) / 1000)} k€`);
    expect(texte).toContain(
      `${Math.round((MARGE_SUITE - MARGE_SUITE_REMISEE) / 1000)} k€ de marge`,
    );
  });

  it("les coups de main relevés en semaine 7, ceux à venir, et le renfort", () => {
    expect(fuiteDeBase(3)).toBe(1.5);
    expect(fuiteDeBase(7)).toBe(2.5);
    expect(Math.round(FUITE_A_VENIR)).toBe(20);
    expect(Math.round((FUITE_A_VENIR * COUT_JOUR) / 1000)).toBe(12);
    const texte = source(D.coupsDeMain, "releves", [1, 1, 1]);
    expect(texte).toContain("20 jours d'ici fin novembre, soit 12 k€");
    const lu = EPISODE_PERIMETRE.lire([1, 1, 1], 3, 0, 6).fuite!;
    expect(texte.startsWith(`${Math.round(lu)} jours`)).toBe(true);
    expect(source(D.comite, "renfort", [1, 1])).toContain(`(${RENFORT.cout} jours`);
    expect(source(D.comite, "renfort", [1, 1])).toContain(`${RENFORT.rattrapage} jours de retard`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : relire le contrat et chiffrer un avenant bat le oui, le non sec et l'attente", () => {
    const r = rejeu(MEILLEUR, D.demandes);
    expect(classement(MEILLEUR, D.demandes)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(30000);
  });

  it("D2 : l'avenant est le meilleur en moyenne, l'échange contre le benchmark le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.demarrage);
    expect(classement(MEILLEUR, D.demarrage)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.demarrage)).toBe(2);
    expect(r[2]!.attendu).toBeGreaterThan(r[0]!.attendu + 15000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(20000);
  });

  it("D3 : faire arbitrer la sponsor bat le silence ; la régularisation tardive est la pire", () => {
    const c = classement(MEILLEUR, D.comite);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
    // Sur le chemin du oui à tout, le comité reste le meilleur moment de reprendre la main.
    expect(classement(REFLEXE, D.comite)[0]).toBe(1);
  });

  it("D4 : au vu des relevés, transférer le reporting bat le laisser-faire et l'interdiction", () => {
    const r = rejeu(MEILLEUR, D.coupsDeMain);
    expect(classement(MEILLEUR, D.coupsDeMain)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
  });

  it("D5 : s'informer auprès de la sponsor bat la proposition toute prête, l'attente et la remise", () => {
    const r = rejeu(MEILLEUR, D.suite);
    expect(classement(MEILLEUR, D.suite)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(8000);
    expect(classement(MEILLEUR, D.suite).at(-1)).toBe(3);
    // La proposition toute prête gagne quand la sponsor veut consolider : elle trompe souvent.
    const m = mesurerDecision(EPISODE_PERIMETRE, MEILLEUR, D.suite, JOURS);
    expect(m.options[0]!.trompeuse).toBe(true);
  });

  it("D6 : un geste annoncé vaut quand le cœur est à l'heure ; en retard, mieux vaut ne rien ajouter", () => {
    expect(classement(MEILLEUR, D.presentation)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.presentation)).not.toBe(1);
    const r = rejeu(REFLEXE, D.presentation);
    expect(Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(r[1]!.attendu + 2000);
  });

  it("la bonne méthode bat nettement le oui à tout et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(80000);
    expect(bonne! - attentiste!).toBeGreaterThan(80000);
    expect(attentiste!).toBeGreaterThan(50000);
    expect(reflexe!).toBeGreaterThan(50000);
    expect(attendu(ATTENTISTE)).toBe(attentiste);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_PERIMETRE, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    const bonne: readonly number[] = REFERENCES[0].chemin;
    expect(REFLEXES.some(([d, o]) => bonne[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["proposition", "tempora"],
      ["budget"],
      ["registre"],
      ["releves"],
      ["orientations"],
      ["avancement"],
    ],
    jours: JOURS,
    diagnostic: "perimetre",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 90.7,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PERIMETRE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a dit oui à tout, propose de donner un prix avant de dire oui", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PERIMETRE.comportements(p, analyser(EPISODE_PERIMETRE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PERIMETRE.axe(c).titre).toBe("Donner un prix avant de dire oui");
  });

  it("à qui a décidé sans enquêter, propose de relire ce que le client a acheté", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PERIMETRE.comportements(p, analyser(EPISODE_PERIMETRE, p).trimestre);
    expect(EPISODE_PERIMETRE.axe(c).titre).toBe("Relire ce que le client a acheté");
  });

  it("juge le taux calculé en semaine 1 : juste, proche s'il compte le tableau de bord, faux sinon", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (prevision: number) =>
      EPISODE_PERIMETRE.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(90.7)).toBe(1);
    // Compter les 40 jours, tableau de bord compris : 330 / 370.
    expect(score((100 * 330) / 370)).toBe(0.6);
    expect(score(100)).toBe(0);
  });

  it("dit le résultat en marge et en suite espérée", () => {
    const t = simuler(MEILLEUR, 4242);
    expect(EPISODE_PERIMETRE.bilan.titre(t)).toMatch(/de marge à terminaison/);
    expect(EPISODE_PERIMETRE.bilan.tuiles(t)).toHaveLength(4);
  });
});
