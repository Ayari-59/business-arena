import { describe, expect, it } from "vitest";
import {
  BARRIERE_CHUTES,
  CHUTES_ATTENDUES,
  CHUTES_SOUS_PSYCHOTROPES,
  CONTENTIONS_DEPART,
  COUTS,
  COUT_CONTENTION,
  COUT_FRACTURE,
  D,
  DOUZE,
  DOUZE_ETE,
  FRACTURE,
  HIVER,
  IMPREVUS,
  MATIN_ETE,
  NUIT_ETE,
  PART_FAMILLES_QUI_RECLAMENT,
  P_FRACTURE,
  P_FRACTURE_BARRIERE,
  SOUS_PSYCHOTROPES,
  TOTAL_ETE,
  chanceDePlainte,
  facteurPsychotrope,
  hasard,
  medecinAccepte,
  simuler,
} from "../../src/engine/episodes/chutes-la-nuit";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/chutes-la-nuit";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_CHUTES } from "../../src/pedagogy/episodes/chutes-la-nuit";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les chutes de la nuit » enseigne qu'on réduit les chutes en
 * analysant les événements et en traitant leurs causes (le lever de 5 h, les
 * psychotropes du soir, la marche, les contentions jamais réévaluées), pas
 * en contenant ni en surveillant sans cibler : la barrière fait baisser les
 * chutes comptées et monter les fractures, la revue des traitements agit
 * tard, et une fracture de trop déclenche l'inspection. Ces tests
 * verrouillent les chiffres des sources et les classements qui le disent.
 */

const MEILLEUR = [2, 0, 1, 0, 1, 1];
const REFLEXE = [0, 1, 0, 1, 0, 0];
const ATTENTISTE = [3, 3, 3, 3, 3, 3];
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
const fr = (v: number) => Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ");
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("les chiffres que les sources donnent au joueur", () => {
  it("l'analyse des déclarations donne la concentration des chutes, et de quoi prévoir le trimestre", () => {
    const analyse = texte(0, "declarations");
    expect(TOTAL_ETE).toBe(41);
    expect(analyse).toContain(`${DOUZE_ETE} des ${TOTAL_ETE} chutes concernent douze résidents`);
    expect(DOUZE).toBe(12);
    expect(analyse).toContain(`les 78 autres en totalisent ${TOTAL_ETE - DOUZE_ETE}`);
    expect(analyse).toContain(
      `Sur les ${NUIT_ETE} chutes de nuit, ${MATIN_ETE} ont eu lieu entre 5 h et 7 h`,
    );
    expect(analyse).toContain(
      `Neuf des douze reçoivent un hypnotique ou un anxiolytique à 20 h ; ils font ${CHUTES_SOUS_PSYCHOTROPES} de leurs ${DOUZE_ETE} chutes`,
    );
    expect(SOUS_PSYCHOTROPES).toBe(9);
    expect(analyse).toContain("un quart de chutes de plus");
    expect(HIVER).toBe(1.25);
    // 41 chutes en 13 semaines, au même rythme en octobre et novembre, un quart de plus en décembre.
    expect(CHUTES_ATTENDUES).toBeCloseTo((41 * (9 + 4 * 1.25)) / 13, 9);
    expect(Math.round(CHUTES_ATTENDUES)).toBe(44);
    expect(EPISODE_CHUTES.prevision.reel(simuler(MEILLEUR, 1))).toBe(CHUTES_ATTENDUES);
    expect(ETAPES[0]!.messages({})[0]!.texte).toContain(
      `${TOTAL_ETE} chutes déclarées, dont ${NUIT_ETE}`,
    );
  });

  it("si rien ne change, le modèle fait bien tomber le nombre de chutes prévu, imprévus en plus", () => {
    const neutre = moyenne(GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g).chutes));
    expect(neutre).toBeGreaterThan(CHUTES_ATTENDUES);
    expect(neutre).toBeLessThan(CHUTES_ATTENDUES * 1.08);
  });

  it("la barrière, la contention et la fracture sont chiffrées comme dans le modèle", () => {
    const contention = texte(0, "contention");
    expect(contention).toContain("un quart des chutes du lit");
    expect(BARRIERE_CHUTES).toBe(0.75);
    expect(contention).toContain("plus de trois fois plus de fractures");
    expect(P_FRACTURE_BARRIERE / P_FRACTURE).toBeGreaterThan(3);
    expect(P_FRACTURE_BARRIERE / P_FRACTURE).toBeLessThan(4);
    expect(contention).toContain("près de quatre heures d'aide-soignante par semaine");
    expect(COUT_CONTENTION / FRACTURE.heure).toBe(4);
    expect(COUT_FRACTURE).toBe(
      FRACTURE.jours * FRACTURE.parJour + FRACTURE.heures * FRACTURE.heure + FRACTURE.reclamation,
    );
    expect(texte(5, "familles")).toContain("une famille sur trois");
    expect(PART_FAMILLES_QUI_RECLAMENT).toBeCloseTo(1 / 3, 9);
  });

  it("les coûts des options sont ceux du modèle", () => {
    const [barriere, veilleuse, tournee] = ETAPES[0]!.options;
    expect(barriere!.d).toContain(`${COUTS.barriere} €`);
    // Les résidents qui ont chuté la nuit : les douze, et sept autres ; cinq des douze ont déjà la leur.
    expect(barriere!.d).toContain("Quatorze résidents de plus");
    expect(DOUZE - CONTENTIONS_DEPART.douze + 7).toBe(14);
    expect(veilleuse!.d).toContain(`${fr(COUTS.veilleuseInterim)} €`);
    expect(veilleuse!.d).toContain(`${fr(COUTS.veilleuseCdd)} €`);
    expect(tournee!.d).toContain(`(${COUTS.reunionsAnalyse} €)`);
    expect(tournee!.d).toContain(`(${fr(COUTS.equipementTournee)} €)`);
    expect(tournee!.d).toContain(`(${COUTS.tournee} € par semaine)`);
    expect(ETAPES[1]!.options[0]!.d).toContain(`${COUTS.revueCiblee} €`);
    expect(ETAPES[1]!.options[2]!.d).toContain(`${fr(COUTS.revueComplete)} €`);
    expect(ETAPES[2]!.options[1]!.d).toContain(`${fr(COUTS.litBas)} €`);
    expect(ETAPES[3]!.options[0]!.d).toContain(`${COUTS.apa} € par semaine`);
    expect(ETAPES[3]!.options[2]!.d).toContain(`${fr(COUTS.protecteurs)} €`);
    expect(ETAPES[4]!.options[0]!.d).toContain(`${fr(COUTS.capteursTous)} €`);
    expect(ETAPES[4]!.options[1]!.d).toContain(`${COUTS.capteursCibles} €`);
    expect(ETAPES[5]!.options[1]!.d).toContain(`${COUTS.reevaluation} €, et ${COUTS.levee} €`);
    expect(ETAPES[5]!.messages({ contentions: "14" })[0]!.texte).toContain(
      `${CONTENTIONS_DEPART.douze + CONTENTIONS_DEPART.autres} résidents`,
    );
  });
});

describe("le modèle de l'EHPAD", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.chutes).toBeCloseTo(
      simuler(avec(MEILLEUR, D.plan, 3), 12).semaines[1]!.chutes,
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

  it("la barrière fait baisser les chutes comptées et monter les fractures", () => {
    const barrieres = avec(ATTENTISTE, D.plan, 0);
    const chutes = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).chutes));
    const fractures = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).fracturesAttendues));
    expect(chutes(barrieres)).toBeLessThan(chutes(ATTENTISTE));
    expect(fractures(barrieres)).toBeGreaterThan(fractures(ATTENTISTE) * 1.3);
  });

  it("la méthode tient le repère de 30 chutes et laisse moins de risque ; l'attente ne le tient pas", () => {
    const bon = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    const neutre = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g));
    expect(moyenne(bon.map((t) => t.chutes))).toBeLessThanOrEqual(30.5);
    expect(moyenne(neutre.map((t) => t.chutes))).toBeGreaterThan(40);
    expect(moyenne(bon.map((t) => t.risqueLaisse))).toBeLessThan(
      moyenne(neutre.map((t) => t.risqueLaisse)) / 2,
    );
    expect(bon.filter((t) => t.inspection).length).toBeLessThan(
      neutre.filter((t) => t.inspection).length / 2,
    );
  });

  it("la revue des traitements agit avec retard ; le somnifère plus fort agit tout de suite, dans le mauvais sens", () => {
    expect(facteurPsychotrope(0, true, 4)).toBe(facteurPsychotrope(3, true, 4));
    expect(facteurPsychotrope(0, true, 8)).toBeLessThan(facteurPsychotrope(3, true, 8));
    expect(facteurPsychotrope(0, false, 13)).toBeGreaterThan(facteurPsychotrope(0, true, 13));
    expect(facteurPsychotrope(1, true, 3)).toBeGreaterThan(facteurPsychotrope(3, true, 3));
    const sixFois = GRAINES_DU_BILAN.filter(medecinAccepte).length;
    expect(sixFois).toBeGreaterThan(10);
    expect(sixFois).toBeLessThan(25);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : analyser et cibler le lever bat de loin les barrières et la veilleuse de plus", () => {
    const r = rejeu(MEILLEUR, D.plan);
    expect(classement(MEILLEUR, D.plan)[0]).toBe(2);
    expect(classement(MEILLEUR, D.plan).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(2500);
  });

  it("D2 : la revue ciblée des traitements est la meilleure ; le somnifère plus fort coûte", () => {
    const r = rejeu(MEILLEUR, D.traitements);
    expect(classement(MEILLEUR, D.traitements)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(2500);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(1200);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
  });

  it("D3 : recevoir le fils paie quand l'analyse est faite ; sans elle, il ne vaut pas mieux qu'un courrier", () => {
    const r = rejeu(MEILLEUR, D.famille);
    expect(classement(MEILLEUR, D.famille)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(2000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(chanceDePlainte(MEILLEUR)).toBeLessThan(chanceDePlainte(avec(MEILLEUR, D.plan, 3)));
    const sansAnalyse = rejeu(avec(MEILLEUR, D.plan, 3), D.famille);
    expect(sansAnalyse[3]!.attendu).toBeGreaterThanOrEqual(sansAnalyse[1]!.attendu - 500);
  });

  it("D4 : l'activité physique est la meilleure en moyenne ; les protecteurs de hanche protègent mieux des mauvais tirages", () => {
    const r = rejeu(MEILLEUR, D.activite);
    expect(classement(MEILLEUR, D.activite)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(1200);
    const plusSure = r.reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
    expect(plusSure).toBe(2);
    expect(r[2]!.p10).toBeGreaterThan(r[0]!.p10 + 1000);
  });

  it("D5 : des capteurs pour les douze battent les capteurs partout, et valent surtout après l'analyse", () => {
    const r = rejeu(MEILLEUR, D.capteurs);
    expect(classement(MEILLEUR, D.capteurs)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1500);
    const sansAnalyse = rejeu(avec(MEILLEUR, D.plan, 3), D.capteurs);
    const gain = (x: typeof r) => x[1]!.attendu - x[3]!.attendu;
    expect(gain(r)).toBeGreaterThan(gain(sansAnalyse) + 400);
  });

  it("D6 : réévaluer une à une bat tout renouveler, et tout lever d'un coup", () => {
    const r = rejeu(MEILLEUR, D.contentions);
    expect(classement(MEILLEUR, D.contentions)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_CHUTES, MEILLEUR, d, JOURS);
      expect(m.options[o]!.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(m.plusSure.option).not.toBe(o);
      expect(MEILLEUR[d]).not.toBe(o);
    }
  });

  it("analyser puis traiter les causes bat contenir et attendre, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(60000);
    expect(methode! - attentiste!).toBeGreaterThan(20000);
    expect(attentiste).toBeGreaterThan(-120000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["declarations", "nuit"],
      ["ordonnances"],
      ["mere"],
      ["bilan"],
      ["essai"],
      ["registre"],
    ],
    jours: JOURS,
    diagnostic: "causes",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 44,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 15, 4242]) {
      const a = analyser(EPISODE_CHUTES, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a contenu et surveillé partout, propose de traiter les causes", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CHUTES.comportements(p, analyser(EPISODE_CHUTES, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CHUTES.axe(c).titre).toBe("Traiter les causes plutôt que contenir");
  });

  it("à qui a décidé sans enquêter, propose de lire les déclarations", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CHUTES.comportements(p, analyser(EPISODE_CHUTES, p).trimestre);
    expect(EPISODE_CHUTES.axe(c).titre).toBe("Lire les déclarations avant de décider");
  });

  it("juge la prévision des chutes à deux chutes près", () => {
    const t = simuler(MEILLEUR, 11);
    const calibrage = (prevision: number) =>
      EPISODE_CHUTES.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(calibrage(44)).toBe(1);
    expect(calibrage(41)).toBe(0.6);
    expect(calibrage(30)).toBe(0);
  });

  it("dit le résultat en coût des chutes, risque laissé compris", () => {
    const t = simuler(MEILLEUR, 4242);
    expect(t.objectif).toBeCloseTo(-(t.coutTrimestre + t.risqueLaisse), 6);
    expect(EPISODE_CHUTES.bilan.titre(t)).toMatch(
      /^Coût des chutes : .* de risque laissé à janvier$/,
    );
  });
});
