import { describe, expect, it } from "vitest";
import {
  ABSENCES_SOCLE,
  CONTRAT,
  D,
  ENVELOPPE,
  HEURES_AN,
  HEURES_POSTE,
  HIVER,
  IMPREVUS,
  INTERIM_ASSOCIATION,
  INTERIM_DEPART,
  INTERIM_HEURE,
  INTERIM_POSTE,
  POOL_AN,
  POOL_CAPACITE_AN,
  POOL_DEPLACEMENTS,
  POOLS,
  POOL_PRIME,
  SALAIRE_HEURE,
  SALAIRE_POSTE,
  SEUIL_POOL,
  SURCOUT_ANNUEL_IDE,
  VACANTS_DEPART,
  chanceDAccepter,
  hasard,
  recoursParMotif,
  remiseSoralis,
  reguliersQuiAcceptent,
  risqueDeDepart,
  risqueEI,
  simuler,
} from "../../src/engine/episodes/interim-qui-flambe";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/interim-qui-flambe";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_INTERIM } from "../../src/pedagogy/episodes/interim-qui-flambe";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'intérim qui flambe » enseigne que l'intérim est le symptôme
 * des postes vacants, des absences imprévues et des congés planifiés trop
 * tard : on le réduit par des plannings publiés tôt, un pool de remplacement
 * dimensionné sur le socle des absences, des contrats proposés aux
 * remplaçants réguliers, pas par un plafond ni par la seule négociation du
 * tarif. Ces tests verrouillent les chiffres des sources et les classements
 * qui le disent.
 */

const MEILLEUR = [2, 1, 0, 2, 0, 1];
const REFLEXE = [0, 0, 2, 0, 1, 0];
const ATTENTISTE = [3, 0, 2, 1, 2, 3];
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

/** Un nombre tel que les sources l'écrivent : « 51 480 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("la paie et le contrat donnent la prévision : 48,2 k€ de surcoût par poste d'infirmier", () => {
    const paie = texte(0, "paie");
    const contrat = texte(0, "contrat");
    expect(paie).toContain(`${SALAIRE_HEURE.ide} €`);
    expect(paie).toContain(`${fr(HEURES_AN)} heures par an`);
    expect(contrat).toContain(`${INTERIM_HEURE.ide} € l'heure d'infirmier`);
    expect(SURCOUT_ANNUEL_IDE).toBe((60 - 30) * 1607);
    expect(EPISODE_INTERIM.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(48.21, 2);
    // Un poste de 12 heures : 720 € en intérim, 360 € salarié, le double.
    expect(contrat).toContain(`${fr(INTERIM_POSTE.ide)} €`);
    expect(paie).toContain(`${fr(SALAIRE_POSTE.ide)} €`);
    expect(INTERIM_POSTE.ide).toBe(2 * SALAIRE_POSTE.ide);
    expect(INTERIM_POSTE.ide).toBe(INTERIM_HEURE.ide * HEURES_POSTE);
  });

  it("les recours par motif sont ceux du modèle, et les trois EHPAD pèsent les trois quarts de la facture", () => {
    const recours = texte(0, "recours");
    const ide = recoursParMotif("ide");
    const as = recoursParMotif("as");
    expect(recours).toContain(`${fr(ide.total)} postes de 12 heures d'infirmier`);
    expect(recours).toContain(`${fr(as.total)} d'aide-soignant`);
    expect(recours).toContain(
      `${Math.round((ide.vacants / ide.total) * 100)} % tiennent les ${VACANTS_DEPART.ide} postes vacants`,
    );
    expect(recours).toContain(
      `${Math.round((as.absences / as.total) * 100)} % pour des absences imprévues`,
    );
    expect(INTERIM_DEPART).toBeCloseTo(ide.euros + as.euros, 6);
    expect(recours).toContain(`${fr(Math.round((INTERIM_DEPART * 52) / 1000))} k€`);
    expect(recours).toContain(
      `${Math.round(((INTERIM_DEPART * 52) / INTERIM_ASSOCIATION) * 100)} %`,
    );
    expect((INTERIM_DEPART * 52) / INTERIM_ASSOCIATION).toBeGreaterThan(0.7);
  });

  it("le pool est chiffré comme dans le modèle, et son seuil est de 60 % de sa capacité", () => {
    const pool = texte(1, "pool");
    expect(POOL_AN.ide).toBe(SALAIRE_HEURE.ide * HEURES_AN + POOL_PRIME + POOL_DEPLACEMENTS.ide);
    expect(pool).toContain(`${fr(POOL_AN.ide)} €`);
    expect(pool).toContain(`${fr(POOL_AN.as)} €`);
    expect(pool).toContain(`${POOL_CAPACITE_AN} postes de 12 heures par an`);
    expect(pool).toContain(`au moins ${Math.round(SEUIL_POOL.ide)} postes par an`);
    expect(pool).toContain("60 % de sa capacité");
    expect(SEUIL_POOL.ide / POOL_CAPACITE_AN).toBeCloseTo(0.6, 1);
    expect(SEUIL_POOL.as / POOL_CAPACITE_AN).toBeCloseTo(0.6, 1);
    const absences = texte(1, "absences");
    expect(absences).toContain(`${ABSENCES_SOCLE.ide} postes de 12 heures d'infirmier`);
    expect(absences).toContain(
      `${Math.round(ABSENCES_SOCLE.ide * (HIVER + 1))} et ${Math.round(ABSENCES_SOCLE.as * (HIVER + 1))}`,
    );
  });

  it("la projection d'avril à décembre est celle du modèle, à comparer au volume minimal du contrat", () => {
    const l = EPISODE_INTERIM.lire(MEILLEUR.slice(0, 5), 3, JOURS, 11);
    const ctx = EPISODE_INTERIM.contexte(l, MEILLEUR.slice(0, 5));
    const t = simuler(avec(MEILLEUR, D.contrat, 3), 3, JOURS);
    expect(l.projectionInterim).toBeCloseTo(t.projection.interim, 6);
    expect(texte(5, "projection", ctx)).toContain(
      `${fr(Math.round(t.projection.interim / 1000))} k€`,
    );
    // Sur le meilleur chemin, le besoin restant est bien en dessous de l'engagement.
    expect(t.projection.interim).toBeLessThan(CONTRAT.engagement * 0.7);
    const neutre = simuler(ATTENTISTE, 3, JOURS);
    expect(neutre.projection.interim).toBeGreaterThan(CONTRAT.engagement * 1.5);
  });
});

describe("le modèle des remplacements", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.absences).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.absences,
      6,
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
    expect(new Set(GRAINES_DU_BILAN.map((g) => hasard(g).epidemie))).toEqual(
      new Set(["faible", "moyenne", "forte"]),
    );
  });

  it("plafonner l'intérim laisse des postes vides : événements graves, épuisement, démissions", () => {
    const note = avec(ATTENTISTE, D.premiere, 0);
    const somme = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      GRAINES_DU_BILAN.reduce((s, g) => s + f(simuler(c, g)), 0);
    expect(somme(note, (t) => t.nonPourvus)).toBeGreaterThan(
      2.5 * somme(ATTENTISTE, (t) => t.nonPourvus),
    );
    expect(somme(note, (t) => t.ei)).toBeGreaterThan(1.5 * somme(ATTENTISTE, (t) => t.ei));
    expect(somme(note, (t) => t.departs.ide + t.departs.as)).toBeGreaterThan(
      3 * somme(ATTENTISTE, (t) => t.departs.ide + t.departs.as),
    );
    // La note fait baisser la facture du trimestre... et coûte plus sur l'année.
    expect(somme(note, (t) => t.interimTrimestre)).toBeLessThan(
      somme(ATTENTISTE, (t) => t.interimTrimestre),
    );
    expect(attendu(note)).toBeLessThan(attendu(ATTENTISTE));
    expect(risqueEI(4, 0, 0)).toBeGreaterThan(risqueEI(0, 0, 0) + 0.07);
    expect(risqueEI(4, 0, 0, 1)).toBeGreaterThan(risqueEI(4, 0, 0));
    expect(risqueDeDepart(0.5)).toBe(0);
    expect(risqueDeDepart(1)).toBe(0.5);
  });

  it("les bonnes décisions tiennent l'enveloppe ; l'attente la dépasse de loin", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(0);
    expect(attendu(ATTENTISTE)).toBeLessThan(-400000);
    expect(attendu(ATTENTISTE)).toBeGreaterThan(-ENVELOPPE);
    const bon = simuler(MEILLEUR, 3);
    expect(bon.interimTrimestre).toBeLessThan(0.6 * simuler(ATTENTISTE, 3).interimTrimestre);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : publier les plannings tôt et ouvrir une bourse bat de loin la note et la négociation du tarif", () => {
    const r = rejeu(MEILLEUR, D.premiere);
    expect(classement(MEILLEUR, D.premiere)[0]).toBe(2);
    expect(classement(MEILLEUR, D.premiere).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(50000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    // La remise, tirée au hasard : −8 % une fois sur deux, sinon −5 %.
    expect(new Set(GRAINES_DU_BILAN.map(remiseSoralis))).toEqual(new Set([0.08, 0.05]));
  });

  it("D2 : le pool du socle paie ; le pool du pic coûte plus qu'il n'évite ; le renfort d'hiver protège sans payer", () => {
    const r = rejeu(MEILLEUR, D.pool);
    expect(classement(MEILLEUR, D.pool)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    // D'avril à décembre, le pool du socle est plein ; les membres de plus du pool du pic
    // évitent moins d'intérim que ce qu'ils coûtent.
    const pic = simuler(avec(MEILLEUR, D.pool, 2), 3);
    const socle = simuler(MEILLEUR, 3);
    expect(socle.projection.poolUtilisation).toBeGreaterThan(0.95);
    const coutEnPlus =
      ((POOLS.pic.ide - POOLS.socle.ide) * POOL_AN.ide +
        (POOLS.pic.as - POOLS.socle.as) * POOL_AN.as) *
      (39 / 52);
    const interimEvite = socle.projection.interim - pic.projection.interim;
    expect(interimEvite).toBeLessThan(0.6 * coutEnPlus);
  });

  it("D3 : le CDI aux remplaçants réguliers est le meilleur en moyenne ; le CDD long protège mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.vacants);
    expect(classement(MEILLEUR, D.vacants)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(8000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(80000);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(3);
    expect(r[3]!.p10 - r[0]!.p10).toBeGreaterThan(5000);
  });

  it("D3 dépend de D1 : des plannings publiés tôt font accepter les remplaçants réguliers", () => {
    const sansPlannings = avec(MEILLEUR, D.premiere, 3);
    expect(chanceDAccepter(MEILLEUR)).toBeGreaterThan(chanceDAccepter(sansPlannings) + 0.2);
    const acceptes = (c: readonly number[]) =>
      GRAINES_DU_BILAN.reduce((s, g) => s + reguliersQuiAcceptent(c, g), 0);
    expect(acceptes(MEILLEUR)).toBeGreaterThan(1.4 * acceptes(sansPlannings));
    // La remise négociée fait partir les réguliers de Soralis.
    expect(acceptes(avec(MEILLEUR, D.premiere, 1))).toBeLessThan(acceptes(sansPlannings));
    const avecPlannings = rejeu(MEILLEUR, D.vacants);
    const sans = rejeu(sansPlannings, D.vacants);
    expect(avecPlannings[0]!.attendu - avecPlannings[2]!.attendu).toBeGreaterThan(
      sans[0]!.attendu - sans[2]!.attendu + 20000,
    );
  });

  it("D4 : le plan de continuité gradué bat l'intérim pour chaque absence et l'interdiction pendant le pic", () => {
    const r = rejeu(MEILLEUR, D.pic);
    expect(classement(MEILLEUR, D.pic)[0]).toBe(2);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    // Sans pool ni bourse, tenir la ligne pendant le pic est un désastre.
    const n = rejeu(ATTENTISTE, D.pic);
    expect(n[1]!.attendu - n[0]!.attendu).toBeGreaterThan(150000);
  });

  it("D5 : préparer l'été tôt bat la limite des congés, qui coûte des départs", () => {
    const r = rejeu(MEILLEUR, D.ete);
    expect(classement(MEILLEUR, D.ete)).toEqual([0, 2, 1]);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : le contrat-cadre piège qui a réduit son besoin, et sert qui ne l'a pas fait", () => {
    const r = rejeu(MEILLEUR, D.contrat);
    expect(classement(MEILLEUR, D.contrat)[0]).toBe(1);
    expect(classement(MEILLEUR, D.contrat).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(simuler(avec(MEILLEUR, D.contrat, 0), 3).projection.dedit).toBeGreaterThan(30000);
    const n = rejeu(ATTENTISTE, D.contrat);
    expect(classement(ATTENTISTE, D.contrat)[0]).toBe(0);
    expect(n[0]!.attendu - n[3]!.attendu).toBeGreaterThan(100000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_INTERIM, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("traiter les causes bat le plafond et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(300000);
    expect(methode! - attentiste!).toBeGreaterThan(300000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["recours", "contrat", "paie"],
      ["absences", "pool"],
      ["reguliers"],
      ["pic"],
      ["ete"],
      ["projection"],
    ],
    jours: JOURS,
    diagnostic: "symptome",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 48,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_INTERIM, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a plafonné et négocié, propose de traiter les causes plutôt que plafonner la dépense", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_INTERIM.comportements(p, analyser(EPISODE_INTERIM, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INTERIM.axe(c).titre).toBe("Traiter les causes plutôt que plafonner la dépense");
  });

  it("à qui a décidé sans enquêter, propose de lire les recours par motif", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_INTERIM.comportements(p, analyser(EPISODE_INTERIM, p).trimestre);
    expect(EPISODE_INTERIM.axe(c).titre).toBe(
      "Lire les recours par motif avant de toucher à la facture",
    );
  });

  it("juge la prévision du surcoût au k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_INTERIM.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(48)).toBe(1);
    expect(calibrage(44)).toBe(0.6);
    expect(calibrage(30)).toBe(0);
  });

  it("dit le résultat en écart à l'enveloppe du CPOM", () => {
    expect(EPISODE_INTERIM.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous l'enveloppe/);
    expect(EPISODE_INTERIM.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(
      /au-delà de l'enveloppe/,
    );
  });
});
