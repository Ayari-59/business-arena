import { describe, expect, it } from "vitest";
import {
  BESOIN,
  COUT_CUISINIER_VACANT,
  D,
  DEJEUNER,
  FIDELES,
  IMPREVUS,
  INTERIM,
  LOGEMENT,
  MASSE_ETE,
  METIERS,
  ORGANISATION,
  PERMANENTS,
  SALAIRE_MOYEN,
  SCENARIOS,
  SURCOUT_INTERIM,
  VALEUR_POSTE,
  bailCourt,
  continuTient,
  coutDeVacance,
  coutDuLogement,
  departDuSecond,
  finissentSurCent,
  hasard,
  simuler,
} from "../../src/engine/episodes/postes-introuvables";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/postes-introuvables";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  CUISINIER_VACANT_EN_KE,
  EPISODE_PENURIE,
} from "../../src/pedagogy/episodes/postes-introuvables";
import { euros, kE } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les postes qu'on ne pourvoit plus » enseigne qu'on recrute
 * dans un métier en pénurie avec ce qui fait venir et rester — un toit, des
 * horaires sans coupure, un planning connu, la cooptation —, pas avec le
 * salaire des seuls nouveaux, qui fait partir les anciens ; qu'un poste vide
 * a un coût qu'on chiffre ; et qu'on révise la répartition des recrues quand
 * le pick-up de l'été parle. Ces tests verrouillent les classements qui le
 * disent, et recalculent depuis le modèle les chiffres que les sources
 * affichent.
 */

const MEILLEUR = [1, 1, 0, 0, 1, 2];
const REFLEXE = [0, 0, 3, 2, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 0, 3];
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 3) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_PENURIE.contexte(
    EPISODE_PENURIE.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle des recrutements de l'été", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).semaines[1]!.candidatures).toBeCloseTo(
      simuler(ATTENTISTE, 12).semaines[1]!.candidatures,
      9,
    );
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

  it("les trois saisons tombent ; le bail et le service sans coupure se jouent au hasard", () => {
    const parSaison = SCENARIOS.map(
      (_, s) => GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === s).length,
    );
    expect(parSaison.every((n) => n > 0)).toBe(true);
    const baux = new Set(GRAINES_DU_BILAN.map(bailCourt));
    expect(baux).toEqual(new Set([true, false]));
    const tenues = GRAINES_DU_BILAN.filter(continuTient).length;
    expect(tenues).toBeGreaterThan(10);
    expect(tenues).toBeLessThan(28);
  });

  it("le second du Lac ne part jamais sans iniquité, et souvent quand on paie mieux les nouveaux", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => departDuSecond(c, g) !== null).length;
    expect(departs(MEILLEUR)).toBe(0);
    expect(departs(ATTENTISTE)).toBe(0);
    expect(departs(REFLEXE)).toBeGreaterThan(15);
  });

  it("les indicateurs restent réalistes ; l'attente laisse des dizaines de postes vides", () => {
    for (const g of GRAINES_DU_BILAN) {
      const t = simuler(MEILLEUR, g, JOURS);
      expect(t.effectif).toBeLessThanOrEqual(t.besoin + 6);
      expect(t.couts).toBeGreaterThan(0);
      expect(t.couts).toBeLessThan(250000);
      expect(t.semaines[13]!.pourvus).toBeLessThanOrEqual(BESOIN + 8);
      const a = simuler(ATTENTISTE, g, 0);
      expect(a.vacants).toBeGreaterThan(15);
      expect(a.objectif).toBeGreaterThan(0);
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'un cuisinier vacant, que la semaine 1 demande, se pose ligne par ligne", () => {
    const aLaMain = 12 * (2 * 75 * 30 * (1 - 0.3) - 650);
    expect(COUT_CUISINIER_VACANT).toBeCloseTo(aLaMain, 6);
    expect(CUISINIER_VACANT_EN_KE).toBeCloseTo(30, 6);
    expect(EPISODE_PENURIE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(30, 6);
    const cuisine = source(0, "cuisine", []);
    expect(cuisine).toContain(`${DEJEUNER.couverts} couverts à ${DEJEUNER.ticket} €`);
    expect(cuisine).toContain("ratio matière est à 30");
    expect(cuisine).toContain(`${euros(METIERS[0].salaire)} par semaine`);
    expect(cuisine).toContain("le déjeuner deux jours par semaine");
  });

  it("ce qu'un poste vide coûte, métier par métier, est ce que le contrôle de gestion affiche", () => {
    const texte = source(5, "metiers", MEILLEUR.slice(0, 5));
    expect(coutDeVacance(METIERS[0].perte, METIERS[0].salaire)).toBe(2500);
    expect(coutDeVacance(METIERS[1].perte, METIERS[1].salaire)).toBe(920);
    expect(coutDeVacance(METIERS[2].perte, METIERS[2].salaire)).toBe(700);
    expect(coutDeVacance(METIERS[3].perte, METIERS[3].salaire)).toBe(1840);
    for (const m of METIERS) expect(texte).toContain(euros(m.perte - m.salaire));
    expect(METIERS[3].perte).toBe(20 * 120);
    expect(METIERS[1].perte).toBe(50 * 30);
    expect(VALEUR_POSTE).toBeCloseTo((12 * (35000 + 16560 + 5600 + 44160)) / 64, 6);
    expect(texte).toContain(`${kE(VALEUR_POSTE)} par poste`);
    // L'intérim : le coefficient sur le salaire chargé moyen, moins le salaire qu'on aurait versé.
    expect(SALAIRE_MOYEN).toBeCloseTo(37780 / 64, 9);
    expect(SURCOUT_INTERIM).toBeCloseTo((INTERIM.coefficient - 1) * (37780 / 64), 9);
    expect(source(5, "interim", MEILLEUR.slice(0, 5))).toContain(
      `${euros(SURCOUT_INTERIM)} de plus par semaine`,
    );
  });

  it("la masse salariale d'été et le coût du service sans coupure sont ceux que le DAF donne", () => {
    expect(MASSE_ETE).toBeCloseTo((110 + 26 + 64) * (37780 / 64) * 12, 6);
    const texte = source(2, "masse", MEILLEUR.slice(0, 2));
    expect(texte).toContain(`${PERMANENTS + FIDELES + BESOIN} personnes`);
    expect(texte).toContain("1,42 M€");
    expect(texte).toContain(`c'est ${kE(MASSE_ETE * ORGANISATION.tient)}`);
    expect(kE(MASSE_ETE * ORGANISATION.tient)).toBe(kE(28000));
    expect(texte).toContain(kE(MASSE_ETE * ORGANISATION.malTenu));
  });

  it("sur cent candidats venus d'ailleurs, treize finissent la saison sans logement, vingt logés", () => {
    expect(finissentSurCent(false)).toBeCloseTo(100 * 0.2 * 0.985 ** 12 * 0.76, 9);
    expect(finissentSurCent(true)).toBeCloseTo(100 * 0.24 * 0.996 ** 12 * 0.88, 9);
    expect(Math.round(finissentSurCent(false))).toBe(13);
    expect(Math.round(finissentSurCent(true))).toBe(20);
    const refus = source(0, "refus", []);
    expect(refus).toContain("13 ont fini la saison");
    expect(refus).toContain("20 quand le groupe");
  });

  it("le logement coûte ce que l'option et la SCI annoncent", () => {
    expect(coutDuLogement(true)).toBe(8400 * 5 + 10 * 420 * 3);
    expect(coutDuLogement(false) - coutDuLogement(true)).toBe(LOGEMENT.loyer * 2);
    expect(ETAPES[0]!.options[1]!.d).toContain("54,6 k€");
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : loger bat l'indemnité et la campagne habituelle ; payer plus les nouveaux fait pire que rien", () => {
    const r = rejeu(MEILLEUR, D.axe);
    expect(classement(MEILLEUR, D.axe)[0]).toBe(1);
    expect(r[1]!.attendu - Math.max(r[2]!.attendu, r[3]!.attendu)).toBeGreaterThan(40000);
    expect(r[0]!.attendu).toBeLessThan(r[3]!.attendu - 50000);
  });

  it("D2 : la prime de fin de saison pour tous bat la prime d'embauche des seuls nouveaux, et ne rien faire", () => {
    const r = rejeu(MEILLEUR, D.primes);
    expect(classement(MEILLEUR, D.primes)[0]).toBe(1);
    expect(classement(MEILLEUR, D.primes).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
  });

  it("D3 : supprimer la coupure est le meilleur en moyenne ; le planning connu est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.horaires);
    expect(classement(MEILLEUR, D.horaires)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    expect(plusSure(MEILLEUR, D.horaires)).toBe(2);
  });

  it("D4 : la cooptation bat le forum et les annonces ; après une prime aux seuls nouveaux, elle se tarit", () => {
    const r = rejeu(MEILLEUR, D.vivier);
    expect(classement(MEILLEUR, D.vivier)[0]).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    // Les anciens ne cooptent plus ceux qu'on paierait mieux qu'eux : le forum passe devant.
    const apresPrime = [1, 0, 0, 0, 1, 2];
    expect(classement(apresPrime, D.vivier)[0]).toBe(1);
    const x = rejeu(apresPrime, D.vivier);
    expect(x[1]!.attendu - x[0]!.attendu).toBeGreaterThan(20000);
  });

  it("D5 : au pick-up, réaffecter les recrues bat la répartition de février et l'attente de fin mai", () => {
    const r = rejeu(MEILLEUR, D.pickup);
    expect(classement(MEILLEUR, D.pickup)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
  });

  it("D6 : organiser l'été pour l'effectif réel bat l'intérim et l'attente ; la surenchère est la pire", () => {
    const r = rejeu(MEILLEUR, D.ete);
    expect(classement(MEILLEUR, D.ete)[0]).toBe(2);
    expect(classement(MEILLEUR, D.ete).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("faire venir et faire rester bat nettement le salaire des nouveaux et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(300000);
    expect(bonne! - attentiste!).toBeGreaterThan(300000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_PENURIE, MEILLEUR, d, JOURS);
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
    consultes: [["refus", "cuisine"], ["fideles"], ["evian"], ["equipes"], ["pickup"], ["metiers"]],
    jours: JOURS,
    diagnostic: "logement",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 30,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_PENURIE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a payé les nouveaux et multiplié les annonces, propose ce qui fait venir et rester", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_PENURIE.comportements(p, analyser(EPISODE_PENURIE, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_PENURIE.axe(c).titre).toBe("Recruter avec ce qui fait venir et rester");
  });

  it("à qui a décidé sans enquêter, propose de chercher ce qui fait renoncer les candidats", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_PENURIE.comportements(p, analyser(EPISODE_PENURIE, p).trimestre);
    expect(EPISODE_PENURIE.axe(c).titre).toBe("Chercher ce qui fait renoncer les candidats");
  });

  it("juge le coût calculé en semaine 1 : juste, proche, ou faute d'avoir déduit le salaire ou le coût matière", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_PENURIE.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(30)).toBe(1);
    expect(score(34)).toBe(0.6);
    // Sans déduire le salaire non versé : 12 × 3 150 € = 37,8 k€.
    expect(score(37.8)).toBe(0);
    // Le chiffre d'affaires au lieu de la marge sur coût matière : 12 × (4 500 − 650) = 46,2 k€.
    expect(score(46.2)).toBe(0);
  });

  it("dit le résultat en marge de l'été préservée", () => {
    expect(EPISODE_PENURIE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /de marge de l'été préservée/,
    );
  });
});
