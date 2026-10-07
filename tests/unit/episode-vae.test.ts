import { describe, expect, it } from "vitest";
import {
  APPRENTI,
  APPRENTI_RESTE,
  COUT_VACANCE_SEMAINE,
  D,
  DIPLOMES_VINGT_VAE,
  FF_NUIT,
  IMPREVUS,
  MAINTIEN,
  SURCOUT_INTERIM,
  TAUX_VAE,
  VAE,
  VAE_NET,
  VALEUR_AN,
  chanceDInspection,
  hasard,
  issueDInspection,
  risqueDEvenement,
  simuler,
} from "../../src/engine/episodes/former-ses-soignants";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_BINOMES,
  COUT_NUIT_SANS_FF,
  COUT_TUTRICES_SEMAINE,
  ETAPES,
  PLACES_DE_TUTORAT,
  REFERENCES,
  REFLEXES,
} from "../../src/config/episodes/former-ses-soignants";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_VAE } from "../../src/pedagogy/episodes/former-ses-soignants";
import { euros, taux } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Former ses propres soignants » enseigne que, dans un métier en
 * pénurie, on construit ses soignants : une VAE accompagnée, des apprentis et
 * des modules coûtent du tutorat et des remplacements pendant le trimestre, et
 * paient en diplômés qui restent ; recruter dehors à coups de primes ou laisser
 * des agents faire fonction coûte plus et expose. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres que
 * les sources affichent.
 */

const MEILLEUR = [1, 0, 1, 0, 1, 0];
const REFLEXE = [0, 3, 2, 3, 0, 2];
const ATTENTISTE = [3, 3, 2, 2, 2, 1];
const SANS_TUTRICES = [1, 3, 1, 0, 1, 0];
const EXTERNE = [0, 3, 1, 0, 1, 0];
const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) => simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const plusSur = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
const ecart = (chemin: readonly number[], d: number, a: number, b: number) => {
  const r = rejeu(chemin, d);
  return r[a]!.attendu - r[b]!.attendu;
};

/** Le texte d'une source, tel que le joueur le lit. */
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle des parcours qualifiants", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à partir de la décision de la semaine 4 vivent les mêmes quatre premières semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([1, 0, 2, 2, 2, 1], 12);
    for (let w = 1; w <= 4; w += 1) {
      expect(b.semaines[w]!.coutSemaine).toBeCloseTo(a.semaines[w]!.coutSemaine, 6);
      expect(b.semaines[w]!.diplomes).toBeCloseTo(a.semaines[w]!.diplomes, 9);
    }
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      const i = hasard(g).imprevus;
      expect(i.length).toBeGreaterThanOrEqual(1);
      expect(i.length).toBeLessThanOrEqual(2);
      for (const x of i) {
        expect(x.semaine).toBeGreaterThanOrEqual(2);
        expect(x.semaine).toBeLessThanOrEqual(11);
      }
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) => hasard(g).imprevus.map((i) => i.imprevu.id)),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("le faisant fonction non encadré expose : plus d'événements graves, des injonctions", () => {
    expect(risqueDEvenement(FF_NUIT, 6)).toBeGreaterThan(2 * risqueDEvenement(0.4 * FF_NUIT, 3));
    expect(chanceDInspection(2)).toBeGreaterThan(chanceDInspection(0));
    expect(issueDInspection(2, true, 0.9)).toBe("totale");
    expect(issueDInspection(1, true, 0.9)).toBe("observation");
    expect(issueDInspection(0, true, 0.1)).toBe("observation");
    const graves = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).evenements.filter((w) => w >= 5).length));
    expect(graves(ATTENTISTE)).toBeGreaterThan(2 * graves(MEILLEUR));
    const injonctions = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => {
        const i = simuler(c, g).inspection;
        return i !== null && i.issue !== "observation";
      }).length;
    expect(injonctions(ATTENTISTE)).toBeGreaterThan(injonctions(MEILLEUR));
  });

  it("les recrues externes repartent, les tutrices limitent les parcours menés de front", () => {
    const parties = GRAINES_DU_BILAN.flatMap((g) => simuler(EXTERNE, g).recrues).filter(
      (r) => r.depart !== null,
    ).length;
    expect(parties).toBeGreaterThan(5);
    expect(MAINTIEN.interne).toBeGreaterThan(MAINTIEN.externe + 0.3);
    // Dix apprentis sans tutrices de plus débordent les places : une part des diplômes se perd.
    const t = simuler(SANS_TUTRICES, 3);
    expect(t.qMoyen).toBeLessThan(0.95);
    expect(simuler(MEILLEUR, 3).qMoyen).toBe(1);
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(-250000);
        expect(t.objectif).toBeLessThan(400000);
        expect(t.coutVacance).toBeGreaterThan(100000);
        expect(t.coutVacance).toBeLessThan(260000);
        expect(t.vacantsFinal).toBeGreaterThan(20);
        expect(t.vacantsFinal).toBeLessThanOrEqual(40);
        for (const s of t.semaines.slice(1)) expect(s!.coutSemaine).toBeLessThan(30000);
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("les diplômés attendus de vingt VAE, que la semaine 1 demande", () => {
    expect(TAUX_VAE).toBeCloseTo(0.45 + 0.35 * 0.6, 9);
    expect(DIPLOMES_VINGT_VAE).toBeCloseTo(13.2, 9);
    expect(EPISODE_VAE.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(13.2, 9);
    const opco = source(0, "parcours");
    expect(opco).toContain(euros(VAE.frais));
    expect(opco).toContain(euros(VAE.opco));
    expect(opco).toContain("45 obtiennent une validation totale");
    expect(opco).toContain("35 une validation partielle");
    expect(opco).toContain("6 validations partielles sur dix");
    expect(VAE_NET).toBe(1200);
    expect(ETAPES[0]!.options[1]!.d).toContain(euros(1200));
    // Les recrues externes : un peu plus d'une sur deux encore là un an après.
    expect(source(0, "marche")).toContain(taux(MAINTIEN.externe, 0));
  });

  it("le coût des postes vacants, et ce que vaut un poste pourvu", () => {
    expect(COUT_VACANCE_SEMAINE).toBe(20 * 720 + 4 * 180);
    expect(COUT_VACANCE_SEMAINE).toBe(15120);
    const alerte = ETAPES[0]!.messages({})[0]!.texte;
    expect(alerte).toContain(euros(15120));
    expect(VALEUR_AN).toBeCloseTo((15120 / 34) * 47, 6);
    expect(Math.round(VALEUR_AN / 100) / 10).toBe(20.9);
  });

  it("les tutrices, les nuits, les apprentis", () => {
    expect(PLACES_DE_TUTORAT).toBe(28);
    expect(source(1, "tutorat", { placesDuPlan: "vingt" })).toContain("28 places");
    expect(COUT_TUTRICES_SEMAINE).toBe(8 * 2 * 28);
    expect(source(1, "formation")).toContain(euros(448));
    expect(COUT_NUIT_SANS_FF).toBe(FF_NUIT * SURCOUT_INTERIM);
    expect(COUT_BINOMES).toBe(720);
    const analyse = source(2, "analyse");
    expect(analyse).toContain(euros(2880));
    expect(analyse).toContain(euros(720));
    expect(APPRENTI_RESTE).toBe(70 * (330 - 0.3 * 720));
    expect(APPRENTI_RESTE).toBe(7980);
    const cout = source(3, "cout");
    expect(cout).toContain(euros(APPRENTI.salaire));
    expect(cout).toContain(euros(216));
    expect(cout).toContain(euros(7980));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la VAE accompagnée bat de loin la campagne à prime et l'attente", () => {
    const c = classement(MEILLEUR, D.plan);
    expect(c[0]).toBe(1);
    expect(c.indexOf(2)).toBeLessThan(c.indexOf(0));
    expect(ecart(MEILLEUR, D.plan, 1, 0)).toBeGreaterThan(100000);
    expect(ecart(MEILLEUR, D.plan, 1, 3)).toBeGreaterThan(150000);
  });

  it("D2 : former des tutrices paie quand les parcours se multiplient, pas quand on recrute dehors", () => {
    expect(classement(MEILLEUR, D.tutrices)[0]).toBe(0);
    expect(ecart(MEILLEUR, D.tutrices, 0, 3)).toBeGreaterThan(20000);
    // L'interaction : sans parcours à suivre, les tutrices de plus ne servent à rien.
    expect(classement(EXTERNE, D.tutrices)[0]).toBe(3);
  });

  it("D3 : encadrer le faisant fonction est le meilleur en moyenne ; le supprimer la nuit est le plus sûr", () => {
    const c = classement(MEILLEUR, D.faisant);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.faisant, 1, 2)).toBeGreaterThan(8000);
    expect(ecart(MEILLEUR, D.faisant, 1, 3)).toBeGreaterThan(15000);
    // L'espérance et la robustesse s'opposent.
    expect(plusSur(MEILLEUR, D.faisant)).toBe(0);
  });

  it("D4 : dix apprentis avec des tutrices ; sans tutrices de plus, cinq valent mieux", () => {
    expect(classement(MEILLEUR, D.apprentis)[0]).toBe(0);
    expect(ecart(MEILLEUR, D.apprentis, 0, 3)).toBeGreaterThan(20000);
    expect(ecart(MEILLEUR, D.apprentis, 0, 2)).toBeGreaterThan(30000);
    // L'interaction : le nombre de tutrices décidé en semaine 2 change le bon nombre d'apprentis.
    expect(classement(SANS_TUTRICES, D.apprentis)[0]).toBe(1);
  });

  it("D5 : un rôle de tutrice retient mieux qu'une prime alignée sur Orchidia", () => {
    const c = classement(MEILLEUR, D.orchidia);
    expect(c[0]).toBe(1);
    expect(ecart(MEILLEUR, D.orchidia, 1, 0)).toBeGreaterThan(8000);
    expect(c.at(-1)).toBe(2);
  });

  it("D6 : financer les modules ; placer les candidats sur des postes d'aide-soignant coûte cher", () => {
    expect(classement(MEILLEUR, D.pilote)[0]).toBe(0);
    expect(ecart(MEILLEUR, D.pilote, 0, 2)).toBeGreaterThan(40000);
    expect(ecart(MEILLEUR, D.pilote, 1, 2)).toBeGreaterThan(5000);
  });

  it("former ses soignants bat nettement le recrutement à primes et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(150000);
    expect(methode! - attentiste!).toBeGreaterThan(200000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni présente dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_VAE, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["marche", "parcours"],
      ["tutorat"],
      ["analyse"],
      ["charge"],
      ["entretiens"],
      ["jury"],
    ],
    jours: JOURS,
    diagnostic: "penurie",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 13,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_VAE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a recruté à coups de primes, propose de former plutôt", () => {
    const p = partie(REFLEXE, { diagnostic: "attractivite" });
    const c = EPISODE_VAE.comportements(p, analyser(EPISODE_VAE, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[1]!.score).toBe(0);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_VAE.axe(c).titre).toBe("Former plutôt que recruter à coups de primes");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer ce que rapporte chaque voie", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_VAE.comportements(p, analyser(EPISODE_VAE, p).trimestre);
    expect(EPISODE_VAE.axe(c).titre).toBe("Chiffrer ce que rapporte chaque voie");
  });

  it("calibre la prévision au demi-diplômé près ; oublier les validations partielles ne passe pas", () => {
    const t = simuler(MEILLEUR, 3);
    expect(EPISODE_VAE.comportements(partie(MEILLEUR, { prevision: 13.2 }), t)[3]!.score).toBe(1);
    expect(EPISODE_VAE.comportements(partie(MEILLEUR, { prevision: 9 }), t)[3]!.score).toBe(0);
    expect(EPISODE_VAE.comportements(partie(MEILLEUR, { prevision: 16 }), t)[3]!.score).toBe(0);
  });

  it("dit le résultat, et lit le tableau de bord", () => {
    const t = simuler(MEILLEUR, 5);
    expect(EPISODE_VAE.bilan.titre(t)).toMatch(/diplômés attendus/);
    expect(EPISODE_VAE.bilan.tuiles(t)).toHaveLength(4);
    expect(EPISODE_VAE.recap(t, 1, 2)).toHaveLength(3);
    expect(t.diplomes).toBeGreaterThan(20);
    expect(simuler(ATTENTISTE, 5).diplomes).toBeLessThan(10);
    const l = EPISODE_VAE.lire([], 1, 0, 4);
    for (const ind of EPISODE_VAE.indicateurs) expect(l[ind.cle], ind.cle).not.toBeUndefined();
    expect(EPISODE_VAE.lire([], 1, 0, 0).vacants).toBe(34);
  });
});
