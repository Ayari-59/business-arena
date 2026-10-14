import { describe, expect, it } from "vitest";
import {
  D,
  IMPREVUS,
  RISQUE_REINFECTION,
  chanceQueFerrandReste,
  hasard,
  redemarrage,
  risqueDArret,
  simuler,
} from "../../src/engine/episodes/panne-qui-paralyse";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/panne-qui-paralyse";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_CRISE } from "../../src/pedagogy/episodes/panne-qui-paralyse";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La panne qui paralyse » enseigne trois choses : un mode dégradé
 * organisé tient l'activité bien mieux que l'attente ou l'effort désordonné,
 * redémarrer sans nettoyer (ou payer) est un pari qui se perd une fois sur
 * deux, et le silence ou la promesse non tenue coûtent plus que la mauvaise
 * nouvelle. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [0, 0, 2, 0, 0, 0];
const REFLEXE = [1, 1, 0, 2, 1, 1];
const ATTENTISTE = [3, 2, 3, 3, 2, 2];
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

describe("le modèle de la région pendant la crise", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Le même tirage de terrain et de marché, quelles que soient les décisions.
    const a = simuler(MEILLEUR, 12);
    const b = simuler(REFLEXE, 12);
    expect(a.semaines[1]!.systemes).toBe(0);
    expect(b.semaines[1]!.systemes).toBe(0);
    expect(redemarrage(2, 12)).toEqual(redemarrage(2, 12));
    expect(hasard(12).semaines[3]).toEqual(hasard(12).semaines[3]);
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

  it("redémarrer sans nettoyer fait revenir l'intrus bien plus souvent", () => {
    const reinfections = (choix: number) =>
      GRAINES_DU_BILAN.filter((g) => redemarrage(choix, g).reinfection).length;
    expect(RISQUE_REINFECTION[0]).toBeGreaterThan(RISQUE_REINFECTION[2]!);
    expect(reinfections(0)).toBeGreaterThan(10);
    expect(reinfections(3)).toBe(0);
    expect(reinfections(2)).toBeLessThan(reinfections(0) / 3);
  });

  it("le mode dégradé organisé tient l'activité ; l'attente la laisse s'effondrer", () => {
    const panne = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).activitePanne));
    expect(panne(MEILLEUR)).toBeGreaterThan(0.6);
    expect(panne(ATTENTISTE)).toBeLessThan(0.4);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        for (const s of t.semaines.slice(1)) {
          expect(s!.activite).toBeGreaterThan(0.1);
          expect(s!.activite).toBeLessThan(1.25);
          expect(s!.confiance).toBeGreaterThanOrEqual(0);
          expect(s!.confiance).toBeLessThanOrEqual(100);
          expect(s!.fatigue).toBeLessThanOrEqual(1);
        }
        // Un trimestre normal fait 910 k€ de marge : la crise en coûte une part, pas tout.
        expect(t.objectif).toBeLessThan(0);
        expect(t.objectif).toBeGreaterThan(-800000);
      }
    }
  });

  it("des équipes usées font s'arrêter un chef d'agence bien plus souvent", () => {
    const arrets = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).arretChef).length;
    expect(arrets(REFLEXE)).toBeGreaterThan(3 * arrets(MEILLEUR));
    expect(risqueDArret(0.4)).toBe(0);
    expect(risqueDArret(0.9)).toBeGreaterThan(0.7);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la cellule de crise et le mode dégradé priorisé battent nettement tout le reste", () => {
    const r = rejeu(MEILLEUR, D.organisation);
    expect(classement(MEILLEUR, D.organisation)[0]).toBe(0);
    expect(r[0]!.attendu - Math.max(r[1]!.attendu, r[2]!.attendu)).toBeGreaterThan(50000);
  });

  it("D2 : parler tôt et honnêtement bat la promesse et le silence", () => {
    const r = rejeu(MEILLEUR, D.communication);
    const c = classement(MEILLEUR, D.communication);
    expect(c[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("D3 : le redémarrage par étapes est le meilleur en moyenne, le bloc nettoyé le plus sûr ; relancer ou payer est un pari perdant", () => {
    const r = rejeu(MEILLEUR, D.redemarrage);
    expect(classement(MEILLEUR, D.redemarrage)[0]).toBe(2);
    // L'espérance et la robustesse ne désignent pas la même option.
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[3]!.p10);
    expect(r[3]!.p10).toBeGreaterThan(r[2]!.p10);
    // Le réflexe : nettement moins bon, et terrible dans les mauvais tirages.
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
    expect(r[0]!.p10).toBeLessThan(r[2]!.p10 - 150000);
  });

  it("D4 : le plan de livraison vaut mieux que la remise, si le mode dégradé permet de le tenir", () => {
    expect(chanceQueFerrandReste(MEILLEUR, 6)).toBeGreaterThan(
      chanceQueFerrandReste([1, ...MEILLEUR.slice(1)], 6),
    );
    expect(classement(MEILLEUR, D.ferrand)[0]).toBe(0);
    // Sans tableau des stocks, le plan ne convainc pas : la remise redevient le meilleur choix.
    const sansModeDegrade = [1, 2, 3, 0, 2, 2];
    expect(classement(sansModeDegrade, D.ferrand)[0]).toBe(1);
    // La promesse sans moyens ne vaut pas le plan.
    const r = rejeu(MEILLEUR, D.ferrand);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(15000);
  });

  it("D5 : les renforts sur la ressaisie battent les heures supplémentaires et le « tenir »", () => {
    const r = rejeu(MEILLEUR, D.equipes);
    expect(classement(MEILLEUR, D.equipes)[0]).toBe(0);
    expect(classement(MEILLEUR, D.equipes).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D6 : rapprocher bons et livraisons avec un renfort bat les samedis et l'oubli", () => {
    const c = classement(MEILLEUR, D.sortie);
    expect(c).toEqual([0, 1, 2]);
  });

  it("la cellule de crise bat nettement le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(100000);
    expect(methode! - attentiste!).toBeGreaterThan(100000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["informatique", "agences"],
      ["appels"],
      ["rapport"],
      ["chantiers"],
      ["charge"],
      ["rapprochement"],
    ],
    jours: JOURS,
    diagnostic: "duree",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 65,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_CRISE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("juge faibles les réflexes de la crise", () => {
    const a = analyser(EPISODE_CRISE, partie(REFLEXE));
    for (const d of [D.organisation, D.redemarrage, D.equipes]) {
      expect(a.decisions[d]!.bonne, `décision ${d + 1}`).toBe(false);
    }
  });

  it("à qui a suivi tous les réflexes, propose de résister au réflexe d'aller vite", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_CRISE.comportements(p, analyser(EPISODE_CRISE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_CRISE.axe(c).titre).toBe("Résister au réflexe d'aller vite");
  });

  it("à qui a décidé sans enquêter, propose de mesurer la panne", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_CRISE.comportements(p, analyser(EPISODE_CRISE, p).trimestre);
    expect(EPISODE_CRISE.axe(c).titre).toBe("Mesurer la panne avant de la combattre");
  });

  it("dit le résultat au regard du plafond de la direction", () => {
    expect(EPISODE_CRISE.bilan.titre(simuler(MEILLEUR, 1))).toMatch(/dans le plafond/);
    expect(EPISODE_CRISE.bilan.titre(simuler(ATTENTISTE, 1))).toMatch(/au-delà du plafond/);
  });

  it("donne la réponse de l'attaquant selon le hasard, et les suites liées aux décisions", () => {
    const cles = GRAINES_DU_BILAN.map((g) => EPISODE_CRISE.reactions(D.redemarrage, 1, g)![0]!);
    expect(new Set(cles.map((m) => m.texte)).size).toBe(2);
    expect(EPISODE_CRISE.reactions(D.redemarrage, 2, 1)).toBeNull();
    const g = GRAINES_DU_BILAN.find((x) => simuler(REFLEXE, x).reinfection)!;
    const t = simuler(REFLEXE, g);
    const w = Math.ceil(t.momentReinfection!);
    const lies = EPISODE_CRISE.evenements(REFLEXE, g, w, w).lies;
    expect(lies.some((m) => m.alerte && m.heure === `sem. ${w}`)).toBe(true);
  });
});
