import { describe, expect, it } from "vitest";
import {
  ARRETS_PAR_RAPPEL,
  BUDGET,
  COUT_ANNUEL_DEPART,
  COUT_MOYEN_DEPART,
  COUT_POOL_SEMAINE,
  D,
  EQUIPEMENT,
  ETP_AS,
  IMPREVUS,
  JOURNEE,
  JOURS_PLANNING,
  MATERIEL,
  MIX_DEPART,
  MONTANT_AIDE,
  PARTS,
  POOL,
  PRIME_SEMAINE,
  RAPPELS_DEPART,
  RECHUTE,
  TAUX_CIBLE,
  TAUX_DEPART,
  hasard,
  risqueDeDepart,
  risqueDeRechute,
  simuler,
} from "../../src/engine/episodes/absenteisme-qui-s-installe";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "../../src/config/episodes/absenteisme-qui-s-installe";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_ABSENTEISME } from "../../src/pedagogy/episodes/absenteisme-qui-s-installe";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'absentéisme qui s'installe » enseigne qu'un taux d'absentéisme
 * se lit par motifs et par causes : les arrêts pour le dos suivent les
 * manutentions sans matériel, les arrêts courts suivent les rappels sur repos,
 * et une prime d'assiduité ou des contre-visites soignent le symptôme en
 * pénalisant ceux qui se sont blessés en soignant. Ces tests verrouillent les
 * chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [1, 0, 1, 1, 0, 1];
const REFLEXE = [0, 2, 0, 0, 2, 0];
const ATTENTISTE = [3, 3, 3, 0, 3, 2];
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

/** Un nombre tel que les sources l'écrivent : « 26 800 ». */
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const pc = (v: number) => `${Math.round(v * 100)} %`;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("le coût des remplacements donne la prévision : environ 272 k€ par an", () => {
    const r = texte(0, "remplacements");
    expect(r).toContain(`${ETP_AS} ETP`);
    expect(r).toContain(`${JOURS_PLANNING} journées de travail par semaine`);
    expect(r).toContain(`${pc(MIX_DEPART.rappel)} par des rappels sur repos`);
    expect(r).toContain(`${pc(MIX_DEPART.cdd)} par des CDD`);
    expect(r).toContain(`${pc(MIX_DEPART.interim)} par Soralis Intérim Santé`);
    for (const v of [JOURNEE.rappel, JOURNEE.cdd, JOURNEE.interim, JOURNEE.salariee]) {
      expect(r).toContain(`${v} €`);
    }
    expect(JOURNEE.interim).toBe(2 * JOURNEE.salariee);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(`${pc(TAUX_DEPART)}`);
    // 16 % de 120 journées sur 52 semaines, à 272,50 € la journée remplacée.
    expect(COUT_MOYEN_DEPART).toBeCloseTo(272.5, 6);
    expect(COUT_ANNUEL_DEPART / 1000).toBeCloseTo(
      (TAUX_DEPART * JOURS_PLANNING * 52 * COUT_MOYEN_DEPART) / 1000,
      6,
    );
    expect(EPISODE_ABSENTEISME.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(272.06, 1);
    // Le budget de l'EPRD : les mêmes journées, à 12 %.
    expect(BUDGET).toBe(
      Math.round((TAUX_CIBLE * JOURS_PLANNING * 52 * COUT_MOYEN_DEPART) / 1000) * 1000,
    );
    expect(r).toContain(`${fr(BUDGET)} €`);
  });

  it("les motifs et les rappels sont ceux du modèle", () => {
    const m = texte(0, "motifs");
    expect(m).toContain(`${pc(PARTS.dos)} ; arrêts courts`);
    expect(m).toContain(`${pc(PARTS.courts)} ; longues maladies`);
    expect(m).toContain(`absences longues, ${pc(PARTS.longues)}`);
    // Quatre arrêts courts sur dix suivent un rappel : la part que les rappels fabriquent.
    expect(m).toContain("Quatre arrêts courts sur dix");
    const partDesRappels =
      (ARRETS_PAR_RAPPEL * RAPPELS_DEPART) / (PARTS.courts * TAUX_DEPART * JOURS_PLANNING);
    expect(partDesRappels).toBeCloseTo(0.4, 2);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(
      `${Math.round((RAPPELS_DEPART * 52) / 12)} rappels sur repos en mars`,
    );
    expect(texte(2, "rappelsParPersonne")).toContain(
      `${Math.round(RAPPELS_DEPART * 12)} rappels sur repos`,
    );
    expect(texte(0, "medecin")).toContain("divisée par deux");
    expect(EQUIPEMENT.effetMateriel).toBe(0.5);
  });

  it("le matériel, l'aide, la prime et le pool sont chiffrés comme dans le modèle", () => {
    const [prime, equiper] = ETAPES[0]!.options;
    expect(prime!.d).toContain(`${PRIME_SEMAINE} € par semaine`);
    expect(MATERIEL).toBe(
      EQUIPEMENT.chambres * EQUIPEMENT.rail +
        EQUIPEMENT.verticalisateurs * EQUIPEMENT.verticalisateur,
    );
    expect(equiper!.d).toContain(`${fr(MATERIEL)} €`);
    expect(equiper!.d).toContain(`${EQUIPEMENT.chambres} chambres`);
    expect(equiper!.d).toContain(
      `${fr(EQUIPEMENT.formation + EQUIPEMENT.journeesFormation * JOURNEE.cdd)} €`,
    );
    expect(REPONSES.aideAccordee).toContain(`${fr(MONTANT_AIDE)} €`);
    expect(COUT_POOL_SEMAINE).toBe(POOL.aides * 5 * JOURNEE.salariee);
    expect(texte(1, "pool")).toContain(`${fr(COUT_POOL_SEMAINE)} €`);
    expect(texte(1, "pool")).toContain(`environ ${POOL.aides * POOL.journees} journées`);
    expect(ETAPES[1]!.options[0]!.d).toContain(`${fr(COUT_POOL_SEMAINE)} €`);
  });

  it("le médecin du travail donne les risques de rechute du modèle", () => {
    for (const [equipe, k] of [
      [false, 0],
      [true, 1],
    ] as const) {
      const l = EPISODE_ABSENTEISME.lire(equipe ? [1, 0, 1] : [3, 0, 1], 1, 0, 6);
      const ctx = EPISODE_ABSENTEISME.contexte(l, equipe ? [1, 0, 1] : [3, 0, 1]);
      const avis = texte(3, "preReprise", ctx);
      expect(avis).toContain(`dans ${pc(RECHUTE.plein[k])} des cas`);
      expect(avis).toContain(`en binôme, dans ${pc(RECHUTE.amenagee[k])}`);
      expect(avis).toContain(`cinq semaines, dans ${pc(RECHUTE.tpt[k])}`);
    }
    // Dans une équipe ordinaire, le risque est celui que le médecin dit ; il monte quand les arrêts s'enchaînent.
    expect(risqueDeRechute([1, 0, 1, 0], 1)).toBe(RECHUTE.plein[1]);
    expect(risqueDeRechute([1, 0, 1, 1], 2)).toBeCloseTo(2.5 * RECHUTE.amenagee[1], 6);
    expect(risqueDeRechute([1, 0, 1, 2], 3)).toBe(RECHUTE.tpt[1]);
  });
});

describe("le modèle de l'EHPAD", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.longues).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.longues,
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
  });

  it("traiter les causes ramène l'absentéisme sous la cible ; l'attente le laisse monter", () => {
    const moyen = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => number) =>
      moyenne(GRAINES_DU_BILAN.map((g) => f(simuler(c, g))));
    expect(moyen(MEILLEUR, (t) => t.tauxFinal)).toBeLessThan(TAUX_CIBLE);
    expect(moyen(MEILLEUR, (t) => t.tauxProjete)).toBeLessThan(0.1);
    expect(moyen(ATTENTISTE, (t) => t.tauxFinal)).toBeGreaterThan(TAUX_DEPART);
    expect(moyen(ATTENTISTE, (t) => t.tauxProjete)).toBeCloseTo(TAUX_DEPART, 2);
    expect(moyen(MEILLEUR, (t) => t.rappelsTotal)).toBeLessThan(
      moyen(ATTENTISTE, (t) => t.rappelsTotal) / 2,
    );
  });

  it("le pool et le planning stable font tomber les rappels, donc les arrêts courts", () => {
    const pool = simuler(avec(ATTENTISTE, D.planning, 0), 4);
    const sans = simuler(ATTENTISTE, 4);
    expect(pool.semaines[8]!.rappels).toBeLessThan(sans.semaines[8]!.rappels / 2);
    expect(pool.semaines[8]!.courts).toBeLessThan(sans.semaines[8]!.courts - 1.5);
    // Majorer la prime de rappel fait l'inverse : plus de rappels, plus d'arrêts courts.
    const majore = simuler(avec(ATTENTISTE, D.planning, 2), 4);
    expect(majore.semaines[8]!.rappels).toBeGreaterThan(sans.semaines[8]!.rappels);
    expect(majore.semaines[8]!.courts).toBeGreaterThan(sans.semaines[8]!.courts);
  });

  it("le soupçon fait partir Conceição : contre-visites et prime pèsent, la répartition des rappels protège", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).conceicaoPart).length;
    expect(departs(MEILLEUR)).toBeLessThanOrEqual(1);
    expect(departs(REFLEXE)).toBeGreaterThan(15);
    expect(risqueDeDepart(avec(MEILLEUR, D.rappels, 0))).toBeGreaterThan(
      risqueDeDepart(MEILLEUR) + 0.3,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : équiper et former bat de loin la prime et les contre-visites", () => {
    const r = rejeu(MEILLEUR, D.causes);
    expect(classement(MEILLEUR, D.causes)[0]).toBe(1);
    expect(classement(MEILLEUR, D.causes).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(30000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("D2 : le planning à six semaines avec un pool bat le planning seul et la prime de rappel", () => {
    const r = rejeu(MEILLEUR, D.planning);
    expect(classement(MEILLEUR, D.planning)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(classement(MEILLEUR, D.planning).at(-1)).toBe(2);
  });

  it("D3 : répartir les rappels bat la contre-visite, et vaut bien plus sans pool", () => {
    const r = rejeu(MEILLEUR, D.rappels);
    expect(classement(MEILLEUR, D.rappels)[0]).toBe(1);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(2000);
    expect(classement(MEILLEUR, D.rappels).at(-1)).toBe(0);
    // L'interaction : sans pool, ni au trimestre ni après, les rappels restent nombreux, et les
    // répartir rapporte bien plus.
    const sansPool = rejeu(avec(avec(MEILLEUR, D.planning, 3), D.suite, 2), D.rappels);
    const gainAvecPool = r[1]!.attendu - r[3]!.attendu;
    const gainSansPool = sansPool[1]!.attendu - sansPool[3]!.attendu;
    expect(gainSansPool).toBeGreaterThan(gainAvecPool + 4000);
  });

  it("D4 : la reprise aménagée est la meilleure en moyenne ; le temps partiel thérapeutique protège mieux", () => {
    const r = rejeu(MEILLEUR, D.reprise);
    expect(classement(MEILLEUR, D.reprise)[0]).toBe(1);
    expect(classement(MEILLEUR, D.reprise).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2500);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10 - r[1]!.p10).toBeGreaterThan(2000);
    // Le matériel rend la reprise à plein poste moins risquée.
    expect(risqueDeRechute([3, 0, 1, 0])).toBeGreaterThan(risqueDeRechute([1, 0, 1, 0]));
  });

  it("D5 : réorganiser les matins bat l'intérim du matin et le glissement de tâches vers les ASH", () => {
    const r = rejeu(MEILLEUR, D.matin);
    expect(classement(MEILLEUR, D.matin)[0]).toBe(0);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    // Faire faire des transferts à des ASH non formées fait moins bien que ne rien changer.
    expect(r[2]!.attendu).toBeLessThan(r[3]!.attendu);
  });

  it("D6 : pérenniser le pool bat la prime pilote et la fin de l'essai", () => {
    const r = rejeu(MEILLEUR, D.suite);
    expect(classement(MEILLEUR, D.suite)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_ABSENTEISME, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("traiter les causes bat les réflexes et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(0);
    expect(methode! - reflexe!).toBeGreaterThan(100000);
    expect(methode! - attentiste!).toBeGreaterThan(80000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["motifs", "remplacements"],
      ["plannings"],
      ["rappelsParPersonne"],
      ["preReprise"],
      ["matin"],
      ["fam"],
    ],
    jours: JOURS,
    diagnostic: "causes",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 270,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_ABSENTEISME, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a pris la prime et les contre-visites, propose de traiter les causes", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_ABSENTEISME.comportements(p, analyser(EPISODE_ABSENTEISME, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_ABSENTEISME.axe(c).titre).toBe("Traiter les causes plutôt que l'assiduité");
  });

  it("à qui a décidé sans enquêter, propose de lire les absences par motif", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_ABSENTEISME.comportements(p, analyser(EPISODE_ABSENTEISME, p).trimestre);
    expect(EPISODE_ABSENTEISME.axe(c).titre).toBe("Lire les absences par motif");
  });

  it("juge la prévision du coût annuel à 10 k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_ABSENTEISME.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(272)).toBe(1);
    expect(calibrage(250)).toBe(0.6);
    expect(calibrage(200)).toBe(0);
  });

  it("dit le résultat en écart au budget de remplacement", () => {
    expect(EPISODE_ABSENTEISME.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/sous le budget/);
    expect(EPISODE_ABSENTEISME.bilan.titre(simuler(ATTENTISTE, 4242))).toMatch(/au-delà du budget/);
  });
});
