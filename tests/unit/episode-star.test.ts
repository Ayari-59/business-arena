import { describe, expect, it } from "vitest";
import {
  CHANCES,
  CHARGES,
  COUT_DEPART_ANALYSTE,
  D,
  DEPART,
  EQUIPE,
  FREELANCE,
  IMPREVUS,
  JOURS_OUVRES,
  JOURS_PAR_AN,
  OCCUPATION_AUTRES,
  OCCUPATION_BASSE,
  OCCUPATION_STAR,
  OCCUPATION_VENDUE,
  P,
  chanceDuMentorat,
  hasard,
  maximilienChange,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/consultant-star";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  ETAPES,
  LIGNES_DU_DEPART,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/consultant-star";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { SEUIL_QUALITE, mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_STAR } from "../../src/pedagogy/episodes/consultant-star";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le consultant star » enseigne trois choses : le comportement
 * qu'on tolère chez un talent se paie en juniors (staffing perdu, engagement,
 * démissions) ; un recadrage fondé sur des faits, avec des attentes explicites
 * et un suivi, change ce comportement quand un reproche général ne change
 * rien ; et écarter le talent de ses clients le fait partir avec l'un d'eux.
 * Ces tests verrouillent les classements qui le disent, et recalculent depuis
 * le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 2, 1, 1, 1, 1];
const ECARTER = [3, 1, 2, 2, 3, 2];
const LAISSER = [0, 0, 0, 3, 0, 0];
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
/** Ce qu'une option rapporte de plus qu'une autre, en moyenne. */
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};
/** Le texte d'une source ou des messages, tels que le joueur les lit avec les décisions déjà prises. */
const contexte = (etape: number, decisions: readonly number[], graine = 3): Contexte => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  return EPISODE_STAR.contexte(EPISODE_STAR.lire(decisions, graine, 0, semaine), decisions);
};
const source = (etape: number, id: string, decisions: readonly number[]) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(contexte(etape, decisions));
};
const messages = (etape: number, decisions: readonly number[]) =>
  ETAPES[etape]!.messages(contexte(etape, decisions))
    .map((m) => m.texte)
    .join(" ");

describe("le modèle de l'équipe Data et SI", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Même première décision : les deux premières semaines sont identiques, quoi qu'on décide ensuite.
    expect(simuler(MEILLEUR, 12).semaines[2]).toEqual(simuler([1, 0, 0, 3, 0, 0], 12).semaines[2]);
    expect(simuler(MEILLEUR, 12).change).toBe(simuler([1, 0, 0, 3, 0, 0], 12).change);
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

  it("un recadrage fondé sur des faits change Maximilien bien plus souvent qu'un reproche général", () => {
    const changes = (d1: number) =>
      GRAINES_DU_BILAN.filter((g) => maximilienChange([d1], g)).length;
    expect(changes(0)).toBe(0);
    expect(changes(1)).toBeGreaterThan(changes(2) + 10);
    expect(changes(2)).toBeGreaterThan(0);
    expect(chanceDuMentorat(true)).toBeGreaterThan(4 * chanceDuMentorat(false));
  });

  it("fermer les yeux fait partir les analystes ; l'écarter le fait partir chez Halden, avec la banque", () => {
    const departs = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).departs));
    const halden = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).halden !== null).length;
    expect(departs(LAISSER)).toBeGreaterThan(2);
    expect(departs(MEILLEUR)).toBeLessThan(1);
    expect(halden(LAISSER)).toBe(0);
    expect(halden([3, 2, 1, 1, 1, 1])).toBeGreaterThan(18);
    expect(halden(MEILLEUR)).toBeLessThan(5);
    // La Banque Dauriac le suit : la marge s'effondre.
    const g = GRAINES_DU_BILAN.find((x) => simuler([3, 2, 1, 1, 1, 1], x).halden !== null)!;
    expect(simuler([3, 2, 1, 1, 1, 1], g).coutDeparts).toBeGreaterThan(55000);
  });

  it("la bonne méthode ramène l'équipe vers la cible d'occupation ; laisser faire la laisse sous 70 %", () => {
    const occupation = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).occupationMoyenne));
    expect(occupation(MEILLEUR)).toBeGreaterThan(0.73);
    expect(occupation(LAISSER)).toBeLessThan(0.7);
    expect(occupation(ECARTER)).toBeLessThan(0.65);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'un départ d'analyste, que la semaine 1 demande, se pose ligne par ligne : 22 k€", () => {
    const coutJour = (42000 * CHARGES) / JOURS_PAR_AN;
    expect(coutJour).toBeCloseTo(300, 9);
    const aLaMain = 0.2 * 42000 + 20 * (700 * 0.8 - 300) + 15 * 700 * 0.8;
    expect(COUT_DEPART_ANALYSTE).toBeCloseTo(aLaMain, 9);
    expect(COUT_DEPART_ANALYSTE).toBeCloseTo(22000, 9);
    expect(
      LIGNES_DU_DEPART.cabinet + LIGNES_DU_DEPART.vacance + LIGNES_DU_DEPART.integration,
    ).toBeCloseTo(COUT_DEPART_ANALYSTE, 9);
    expect(EPISODE_STAR.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(22, 9);
    const texte = source(0, "depart", []);
    expect(texte).toContain(`${DEPART.cabinet * 100} % du salaire annuel brut`);
    expect(texte).toContain(`${(42000).toLocaleString("fr-FR")} €`);
    expect(texte).toContain(`${DEPART.vacance} jours ouvrés`);
    expect(texte).toContain(`${Math.round(coutJour)} € par jour ouvré`);
    expect(texte).toContain(`${DEPART.integration} premiers jours`);
    expect(texte).toContain(`occupé à ${DEPART.occupation * 100} %`);
  });

  it("l'occupation de l'équipe (68 %) et le staffing vendu de ses équipiers sont ceux du modèle", () => {
    const occupation = (OCCUPATION_STAR + 4 * OCCUPATION_BASSE + 2 * OCCUPATION_AUTRES) / 7;
    expect(Math.round(occupation * 100)).toBe(68);
    expect(tableauDeBord([], 1, 0, 0).occupation).toBeCloseTo(occupation, 9);
    expect(messages(0, [])).toContain("68 %");
    expect(messages(0, [])).toContain(
      `${JOURS_OUVRES.reduce<number>((s, j) => s + j, 0)} jours ouvrés`,
    );
    const tempora = source(0, "tempora", []);
    expect(tempora).toContain(`${Math.round(OCCUPATION_VENDUE * 100)} %`);
    expect(tempora).toContain(`${Math.round(OCCUPATION_BASSE * 100)} %`);
    expect(tempora).toContain(`${Math.round(OCCUPATION_STAR * 100)} %`);
    expect(tempora).toContain(`${Math.round(OCCUPATION_AUTRES * 100)} %`);
  });

  it("Maximilien fait 30 % du chiffre de l'équipe, comme Ruben le dit", () => {
    // Le tableau de départ : chacun à son occupation, les analystes à l'engagement initial.
    const reel = 0.78 + 0.2 * 0.44;
    const ca = EQUIPE.map((p, i) => {
      const occ =
        i === P.maximilien
          ? OCCUPATION_STAR
          : p.mission === "autre"
            ? OCCUPATION_AUTRES
            : OCCUPATION_BASSE;
      return occ * p.tjm * (i === P.maximilien ? 1 : reel);
    });
    const part = ca[P.maximilien]! / ca.reduce((s, x) => s + x, 0);
    expect(Math.round(part * 100)).toBe(30);
    expect(messages(0, [])).toContain("30 % du chiffre");
  });

  it("la marge de l'indépendant, la chance de la banque et le bilan des mentorats sont ceux du modèle", () => {
    const plan = source(2, "plan", [1, 2]);
    expect(plan).toContain(`${FREELANCE.vente - FREELANCE.achat} € de marge par jour`);
    expect(plan).toContain(
      `${((FREELANCE.vente - FREELANCE.achat) * FREELANCE.jours).toLocaleString("fr-FR")} € par semaine`,
    );
    expect(CHANCES.banqueAccepte).toBeLessThan(0.5);
    expect(source(2, "banque", [1, 2])).toContain("moins d'une chance sur deux");
    expect(source(3, "retour", [1, 2, 1])).toContain(
      `${CHANCES.mentorChange * 10} mentorats sur 10`,
    );
    expect(CHANCES.mentorSansRecadrage).toBeCloseTo(1 / 7, 1);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le recadrage fondé sur des faits bat de loin le silence, le reproche général et la mise à l'écart", () => {
    expect(classement(MEILLEUR, D.maximilien)).toEqual([1, 2, 0, 3]);
    expect(ecart(MEILLEUR, D.maximilien, 1, 0)).toBeGreaterThan(30000);
    expect(ecart(MEILLEUR, D.maximilien, 1, 2)).toBeGreaterThan(30000);
    expect(ecart(MEILLEUR, D.maximilien, 0, 3)).toBeGreaterThan(20000);
  });

  it("D2 : changer le circuit de relecture bat le refus, l'intercontrat et la prime ; refuser n'est sûr qu'en apparence", () => {
    expect(classement(MEILLEUR, D.ilham)[0]).toBe(2);
    expect(ecart(MEILLEUR, D.ilham, 2, 0)).toBeGreaterThan(15000);
    expect(ecart(MEILLEUR, D.ilham, 2, 1)).toBeGreaterThan(5000);
  });

  it("D3 : la pyramide avec un plan de délégation vaut d'autant plus que Maximilien a été recadré", () => {
    expect(classement(MEILLEUR, D.lot)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.lot, 1, 0)).toBeGreaterThan(5000);
    // Sans recadrage fondé sur des faits, ses analystes subissent la pyramide : l'avantage fond.
    expect(ecart(MEILLEUR, D.lot, 1, 0)).toBeGreaterThan(
      ecart([2, 2, 1, 1, 1, 1], D.lot, 1, 0) + 5000,
    );
    expect(ecart(MEILLEUR, D.lot, 1, 0)).toBeGreaterThan(
      ecart([0, 2, 1, 1, 1, 1], D.lot, 1, 0) + 3000,
    );
  });

  it("D4 : l'essai avant le mentorat est le meilleur en moyenne ; Peio, le plus sûr ; s'engager sans essai, fragile", () => {
    expect(classement(MEILLEUR, D.mentor)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.mentor, 1, 0)).toBeGreaterThan(5000);
    expect(ecart(MEILLEUR, D.mentor, 1, 2)).toBeGreaterThan(2000);
    expect(plusSure(MEILLEUR, D.mentor)).toBe(2);
    // Le mentorat confié sans essai vaut moins encore si Maximilien n'a pas été recadré.
    expect(ecart(MEILLEUR, D.mentor, 2, 0)).toBeGreaterThan(0);
  });

  it("D5 : reprendre l'écart du comité avec le fait bat le laisser passer, l'avertissement et le retrait de Lagrave", () => {
    expect(classement(MEILLEUR, D.rechute)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.rechute, 1, 0)).toBeGreaterThan(20000);
    expect(ecart(MEILLEUR, D.rechute, 1, 2)).toBeGreaterThan(20000);
    expect(ecart(MEILLEUR, D.rechute, 1, 3)).toBeGreaterThan(30000);
  });

  it("D6 : faire présenter les analystes avec Maximilien en appui bat le laisser seul et l'écarter", () => {
    expect(classement(MEILLEUR, D.copil)[0]).toBe(1);
    expect(ecart(MEILLEUR, D.copil, 1, 0)).toBeGreaterThan(4000);
    expect(ecart(MEILLEUR, D.copil, 1, 2)).toBeGreaterThan(4000);
  });

  it("la bonne méthode bat nettement l'écarter et laisser faire", () => {
    const [bonne, ecarter, laisser] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne!).toBeGreaterThan(70000);
    expect(bonne! - laisser!).toBeGreaterThan(50000);
    expect(bonne! - ecarter!).toBeGreaterThan(50000);
    expect(laisser!).toBeGreaterThan(0);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni présent dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_STAR, MEILLEUR, d, JOURS);
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
      ["relectures", "tempora", "depart"],
      ["entretien"],
      ["plan"],
      ["retour"],
      ["faits"],
      [],
    ],
    jours: JOURS,
    diagnostic: "comportement",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 22,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_STAR, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a laissé faire, propose de ne ni fermer les yeux, ni écarter le talent", () => {
    const p = partie(LAISSER);
    const c = EPISODE_STAR.comportements(p, analyser(EPISODE_STAR, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_STAR.axe(c).titre).toBe("Ni fermer les yeux, ni écarter le talent");
  });

  it("à qui a décidé sans enquêter, propose d'aller chercher les faits", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_STAR.comportements(p, analyser(EPISODE_STAR, p).trimestre);
    expect(EPISODE_STAR.axe(c).titre).toBe("Aller chercher les faits");
  });

  it("juge le coût d'un départ calculé en semaine 1 : juste, proche, ou faute d'avoir compté le salaire épargné", () => {
    const score = (prevision: number) =>
      EPISODE_STAR.comportements(partie(MEILLEUR, { prevision }), simuler(MEILLEUR, 11))[3]!.score;
    expect(score(22)).toBe(1);
    expect(score(25)).toBe(0.6);
    // Sans le salaire épargné pendant la vacance : 8,4 + 11,2 + 8,4 = 28 k€.
    expect(score(28)).toBe(0);
    // Le seul cabinet : 8,4 k€.
    expect(score(8.4)).toBe(0);
  });

  it("dit le résultat en écart au budget de marge", () => {
    expect(EPISODE_STAR.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/au-dessus du budget/);
    expect(EPISODE_STAR.bilan.titre(simuler(LAISSER, 4242))).toMatch(/sous le budget/);
  });
});
