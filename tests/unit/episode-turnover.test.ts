import { describe, expect, it } from "vitest";
import {
  COUT_DEPART,
  COUT_HAUSSE_CIBLEE,
  COUT_HAUSSE_GENERALE,
  D,
  DEPARTS_AN_DERNIER,
  ENVELOPPE,
  HAUSSE_GENERALE,
  IMPREVUS,
  MASSE_CONSULTANTS,
  MASSE_DATA,
  PLAN,
  RATTRAPAGE_DATA,
  TAUX_AN_DERNIER,
  chanceQueKerzerhoParte,
  coutDUnDepart,
  departsAnDernier,
  hasard,
  simuler,
} from "../../src/engine/episodes/departs-a-deux-ans";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/departs-a-deux-ans";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { COUT_A_DEUX_ANS, EPISODE_TURNOVER } from "../../src/pedagogy/episodes/departs-a-deux-ans";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les consultants qui partent à deux ans » enseigne qu'on retient
 * d'abord par l'intérêt des missions, la progression visible et la mobilité
 * interne ; qu'une hausse générale coûte cher et retient peu ceux qui partent
 * pour d'autres raisons ; qu'il faut lire les entretiens de départ par
 * segment avant d'agir. Ces tests verrouillent les classements qui le
 * disent, et recalculent depuis le modèle les chiffres que les sources
 * affichent.
 */

const MEILLEUR = [1, 1, 1, 1, 1, 1];
const REFLEXE = [0, 0, 0, 0, 0, 0];
const ATTENTISTE = [2, 3, 3, 0, 0, 3];
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
const avec = (chemin: readonly number[], d: number, o: number) => {
  const c = [...chemin];
  c[d] = o;
  return c;
};
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_TURNOVER.contexte(
    EPISODE_TURNOVER.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const option = (etape: number, o: number) => ETAPES[etape]!.options[o]!.d;

describe("le modèle des départs", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Les décisions n'agissent qu'à partir de la semaine 3 : les deux premières sont les mêmes.
    expect(simuler(MEILLEUR, 12).semaines[2]).toEqual(simuler(REFLEXE, 12).semaines[2]);
    expect(simuler(MEILLEUR, 12).halden).toBe(simuler(REFLEXE, 12).halden);
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

  it("Halden ouvre à Nantes environ un trimestre sur deux", () => {
    const n = GRAINES_DU_BILAN.filter((g) => hasard(g).halden).length;
    expect(n).toBeGreaterThan(8);
    expect(n).toBeLessThan(22);
  });

  it("Halden débauche Jakez Kerzerho bien plus souvent quand rien ne lui montre la suite", () => {
    const departs = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).kerzerhoPart).length;
    expect(departs(ATTENTISTE)).toBeGreaterThan(departs(MEILLEUR) + 4);
    expect(chanceQueKerzerhoParte(MEILLEUR, 1)).toBeLessThan(chanceQueKerzerhoParte(ATTENTISTE, 1));
  });

  it("la bonne méthode ramène le taux de départ vers 20 % ; l'attentisme le laisse monter", () => {
    const tauxMoyen = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g, JOURS).taux));
    expect(tauxMoyen(MEILLEUR)).toBeLessThan(0.205);
    expect(tauxMoyen(ATTENTISTE)).toBeGreaterThan(TAUX_AN_DERNIER);
    expect(tauxMoyen(ATTENTISTE)).toBeLessThan(0.3);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'un départ à deux ans, que la semaine 1 demande, se pose en quatre postes", () => {
    const j = COUT_DEPART.juniors;
    const aLaMain =
      j.recrutement +
      j.semainesVides * j.margeParSemaine +
      j.joursDeMontee * j.tjm +
      j.margeClient / j.client;
    expect(coutDUnDepart("juniors")).toBe(aLaMain);
    expect(COUT_A_DEUX_ANS).toBeCloseTo(47.5, 6);
    expect(EPISODE_TURNOVER.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(47.5, 6);
    const texte = source(0, "cout", []);
    expect(texte).toContain("11 k€");
    expect(texte).toContain("8 semaines");
    expect(texte).toContain("1,5 k€ de marge perdue par semaine");
    expect(texte).toContain("25 jours");
    expect(texte).toContain("700 €");
    expect(texte).toContain("un départ sur 8");
    expect(texte).toContain("56 k€");
    expect(texte).toContain(`${Math.round(coutDUnDepart("seniors") / 1000)} k€ pour un senior`);
  });

  it("les entretiens de départ, lus par segment, sont ceux qui fixent les taux du modèle", () => {
    expect(DEPARTS_AN_DERNIER).toBe(46);
    expect(Math.round(TAUX_AN_DERNIER * 100)).toBe(24);
    expect(departsAnDernier("juniors")).toBe(28);
    const texte = source(0, "entretiens", []);
    expect(texte).toContain("Analystes et consultants (92, 28 départs, 30 %)");
    expect(texte).toContain("Profils data (26, 7 départs, 27 %)");
    expect(texte).toContain("rémunération 4, autres raisons 1");
  });

  it("la hausse générale et le rattrapage ciblé coûtent ce que l'étude et les options affichent", () => {
    expect(COUT_HAUSSE_GENERALE).toBeCloseTo(
      (HAUSSE_GENERALE - ENVELOPPE) * MASSE_CONSULTANTS * (11 / 12),
      6,
    );
    expect(Math.round(COUT_HAUSSE_GENERALE / 1000)).toBe(459);
    expect(option(0, 0)).toContain("459 k€");
    expect(Math.round(COUT_HAUSSE_CIBLEE / 1000)).toBe(46);
    expect(option(0, 1)).toContain("46 k€");
    const texte = source(0, "remuneration", []);
    expect(texte).toContain("3 points de plus");
    expect(texte).toContain(`${Math.round((RATTRAPAGE_DATA * MASSE_DATA) / 1000)} k€ par an`);
  });

  it("le besoin de juniors au printemps est celui que le modèle compte", () => {
    const decisions = MEILLEUR.slice(0, 4);
    const lu = EPISODE_TURNOVER.lire(decisions, 3, 0, 8);
    expect(source(4, "besoin", decisions, 3)).toContain(
      `il faut ${Math.round(lu.besoin!)} juniors au printemps`,
    );
    // Moins de départs, moins de juniors à remplacer ; au rythme de l'an dernier, le plan tient.
    const besoin = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g, JOURS).besoin));
    expect(besoin(MEILLEUR)).toBeLessThan(PLAN.printemps - 2);
    expect(besoin(ATTENTISTE)).toBeGreaterThan(PLAN.printemps);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la hausse ciblée bat tout ; 6 % pour tous coûte plus qu'il ne retient", () => {
    const c = classement(MEILLEUR, D.augmentations);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
    const r = rejeu(MEILLEUR, D.augmentations);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(200000);
    // Moins bien que ne rien changer : la hausse générale paie tout le monde pour retenir peu.
    expect(r[0]!.attendu).toBeLessThan(r[2]!.attendu - 50000);
  });

  it("D2 : la bourse aux missions bat la formation ; les régies longues sont le pire choix", () => {
    const c = classement(MEILLEUR, D.intercontrat);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("D3 : demander aux seniors avant de publier vaut mieux, sauf quand ils ne voulaient que manager", () => {
    expect(classement(MEILLEUR, D.parcours)[0]).toBe(1);
    const r = rejeu(MEILLEUR, D.parcours);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
    // L'information change la réponse : quand les seniors ne veulent que manager, publier vite suffit.
    const ecart = (g: number) => objectif(avec(MEILLEUR, D.parcours, 0), g) - objectif(MEILLEUR, g);
    const manager = GRAINES_DU_BILAN.filter((g) => !hasard(g).expertise);
    const expertise = GRAINES_DU_BILAN.filter((g) => hasard(g).expertise);
    expect(moyenne(expertise.map(ecart))).toBeLessThan(-100000);
    expect(moyenne(manager.map(ecart))).toBeGreaterThan(moyenne(expertise.map(ecart)) + 80000);
  });

  it("D4 : la mobilité est la meilleure en moyenne, le prêt le plus sûr ; sans bourse, le prêt l'emporte", () => {
    expect(classement(MEILLEUR, D.mobilite)[0]).toBe(1);
    expect(plusSure(MEILLEUR, D.mobilite)).toBe(2);
    const sansBourse = avec(MEILLEUR, D.intercontrat, 3);
    expect(classement(sansBourse, D.mobilite)[0]).toBe(2);
  });

  it("D5 : recaler le plan sur les départs constatés bat le budget, quand les départs ont baissé", () => {
    expect(classement(MEILLEUR, D.recrutement)[0]).toBe(1);
    const r = rejeu(MEILLEUR, D.recrutement);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    // Au rythme de l'an dernier, le plan du budget était le bon : c'est le signal qui décide.
    expect(classement(ATTENTISTE, D.recrutement)[0]).toBe(0);
  });

  it("D6 : promouvoir sur critères bat les seniors achetés au prix du marché", () => {
    const c = classement(MEILLEUR, D.pyramide);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(0);
  });

  it("lire par segment bat l'alignement sur le marché et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(300000);
    expect(bonne! - attentiste!).toBeGreaterThan(300000);
    expect(attentiste!).toBeLessThan(0);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_TURNOVER, MEILLEUR, d, JOURS);
      const opt = m.options[o]!;
      expect(opt.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(opt === m.plusSure && m.meilleure.moyenne - opt.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => (REFERENCES[0].chemin as readonly number[])[d] === o)).toBe(
      false,
    );
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["entretiens", "cout"],
      ["tempora"],
      ["seniors"],
      ["certification"],
      ["besoin"],
      ["pyramide"],
    ],
    jours: JOURS,
    diagnostic: "segments",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 47,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_TURNOVER, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de traiter la raison de partir", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_TURNOVER.comportements(p, analyser(EPISODE_TURNOVER, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_TURNOVER.axe(c).titre).toBe(
      "Traiter la raison de partir, pas le salaire de tous",
    );
  });

  it("à qui a décidé sans enquêter, propose de lire les entretiens par segment", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_TURNOVER.comportements(p, analyser(EPISODE_TURNOVER, p).trimestre);
    expect(EPISODE_TURNOVER.axe(c).titre).toBe("Lire les entretiens de départ par segment");
  });

  it("juge le coût calculé en semaine 1 : juste, proche, ou faute d'avoir compté le client", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_TURNOVER.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(47)).toBe(1);
    expect(score(43)).toBe(0.6);
    // Sans le client perdu une fois sur huit : 47,5 − 7 = 40,5 k€.
    expect(score(40.5)).toBe(0);
  });

  it("dit le résultat en économie nette, ou en surcoût", () => {
    expect(EPISODE_TURNOVER.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/économie nette/);
    expect(EPISODE_TURNOVER.bilan.titre(simuler(REFLEXE, 11))).toMatch(/surcoût net/);
  });
});
