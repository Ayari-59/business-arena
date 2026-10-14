import { describe, expect, it } from "vitest";
import {
  AIDE_SEMAINE,
  BUDGET,
  APPRENTIS,
  CAPACITE_CONFIRMES,
  COUT_APPRENTI_MOYEN,
  COUT_EXTRA,
  COUT_EXTRA_DERNIERE_MINUTE,
  COUT_RUPTURE,
  COUVERTS,
  COUVERTS_PAR_SERVEUR,
  D,
  FRAIS_RUPTURE,
  GROUPES,
  IMPREVUS,
  SAISON,
  chanceQueBintouTienne,
  enCours,
  hasard,
  risqueDeRupture,
  simuler,
} from "../../src/engine/episodes/apprentis-qui-decrochent";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_DU_PLANNING,
  ETAPES,
  FACTURE_GROUPE,
  PART_TENUE_TOUSSAINT,
  REFERENCES,
  REFLEXES,
  REMISE_D_UNE_SOIREE,
} from "../../src/config/episodes/apprentis-qui-decrochent";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_APPRENTIS } from "../../src/pedagogy/episodes/apprentis-qui-decrochent";
import { euros, taux } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Les apprentis qui décrochent » enseigne qu'un apprenti se forme
 * s'il a un tuteur qui en a le temps et un parcours ; employé comme
 * main-d'œuvre d'appoint (seul au rang dans le coup de feu, retenu pendant ses
 * cours, remplacé par d'autres apprentis), il décroche, et sa rupture coûte
 * plus que le temps qu'on croyait gagner. Ces tests verrouillent les
 * classements qui le disent, et recalculent depuis le modèle les chiffres que
 * les sources affichent.
 */

const MEILLEUR = [0, 0, 1, 1, 2, 0];
const REFLEXE = [1, 2, 2, 3, 0, 1];
const ATTENTISTE = [3, 3, 3, 2, 2, 3];
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

describe("le modèle de la salle", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    // Deux chemins qui ne divergent qu'à partir de la décision de la semaine 4 vivent les mêmes quatre premières semaines.
    const a = simuler(MEILLEUR, 12);
    const b = simuler([0, 0, 3, 2, 2, 3], 12);
    for (let w = 1; w <= 4; w += 1) {
      expect(b.semaines[w]!.contribution).toBeCloseTo(a.semaines[w]!.contribution, 6);
      expect(b.semaines[w]!.autonomie).toBeCloseTo(a.semaines[w]!.autonomie, 9);
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

  it("former garde les apprentis ; les faire servir tout de suite les fait partir", () => {
    const ruptures = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).ruptures.filter((r) => !r.accord).length));
    expect(ruptures(MEILLEUR)).toBeLessThan(0.6);
    expect(ruptures(ATTENTISTE)).toBeGreaterThan(1);
    expect(ruptures(REFLEXE)).toBeGreaterThan(2.5);
    const autonomes = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).autonomes));
    expect(autonomes(MEILLEUR)).toBeGreaterThan(3);
    expect(autonomes(ATTENTISTE)).toBeLessThan(2);
    // Un apprenti confiant et suivi part bien moins qu'un apprenti lâché seul ; un nouveau, davantage.
    expect(risqueDeRupture(0.8, 1, false, false)).toBeLessThan(
      risqueDeRupture(0.3, 0, false, false) / 5,
    );
    expect(risqueDeRupture(0.5, 0, true, false)).toBeGreaterThan(
      risqueDeRupture(0.5, 0, false, false),
    );
    // Les indicateurs restent dans des plages réalistes.
    for (const c of [MEILLEUR, REFLEXE, ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g, JOURS);
        expect(t.objectif).toBeGreaterThan(60000);
        expect(t.objectif).toBeLessThan(140000);
        expect(t.ventesMoyennes).toBeGreaterThan(5);
        expect(t.ventesMoyennes).toBeLessThan(8);
        expect(t.incidentsTotal / 13).toBeLessThan(25);
      }
    }
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le coût d'une rupture, que la semaine 1 demande, se pose depuis le dossier de l'an dernier", () => {
    expect(COUT_APPRENTI_MOYEN).toBe(210);
    expect(COUT_APPRENTI_MOYEN).toBe(APPRENTIS.reduce((s, a) => s + a.cout, 0) / 5);
    expect(COUT_EXTRA).toBe(6 * 120);
    expect(COUT_RUPTURE).toBe(6 * (720 - 210) + 1400);
    expect(COUT_RUPTURE).toBe(4460);
    expect(EPISODE_APPRENTIS.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(4.46, 9);
    const dossier = source(0, "ruptures");
    expect(dossier).toContain("6 semaines");
    expect(dossier).toContain(`${euros(120)} le service`);
    expect(dossier).toContain(`${euros(COUT_APPRENTI_MOYEN)} par semaine`);
    expect(dossier).toContain(euros(FRAIS_RUPTURE));
    // Le faux ami : un extra coûte 720 €, mais l'apprenti parti ne coûte plus ses 210 €.
    expect(source(0, "salaires")).toContain(euros(COUT_EXTRA));
  });

  it("le planning de la Toussaint : ce que la salle tient sans apprentis, et ce que coûtent les extras", () => {
    expect(enCours(4)).toBe(3);
    expect(enCours(8)).toBe(5);
    expect(enCours(11)).toBe(5);
    expect(PART_TENUE_TOUSSAINT).toBeCloseTo(
      CAPACITE_CONFIRMES / ((COUVERTS * SAISON[8]) / COUVERTS_PAR_SERVEUR),
      9,
    );
    expect(Math.round(PART_TENUE_TOUSSAINT * 100)).toBe(75);
    expect(COUT_DU_PLANNING).toBe(4 * COUT_EXTRA);
    const planning = source(1, "planning");
    expect(planning).toContain(taux(PART_TENUE_TOUSSAINT, 0));
    expect(planning).toContain(euros(2880));
  });

  it("l'extra de dernière minute, les chances de Bintou, la remise d'un groupe raté, l'aide à l'embauche", () => {
    expect(source(2, "extra")).toContain(euros(2 * COUT_EXTRA_DERNIERE_MINUTE));
    expect(2 * COUT_EXTRA_DERNIERE_MINUTE).toBe(1680);
    expect(chanceQueBintouTienne(MEILLEUR)).toBeGreaterThan(0.8);
    expect(source(2, "bintou", { tutore: true })).toContain("plus de huit fois sur dix");
    expect(chanceQueBintouTienne(ATTENTISTE)).toBeCloseTo(1 / 3, 1);
    expect(source(2, "bintou", { tutore: false })).toContain("Une fois sur trois");
    expect(FACTURE_GROUPE).toBe(GROUPES.couverts * GROUPES.menu);
    expect(REMISE_D_UNE_SOIREE).toBe(520);
    const groupes = source(5, "groupes");
    expect(groupes).toContain(`${euros(520)} sur ${euros(2600)}`);
    expect(source(4, "recrues")).toContain(euros(AIDE_SEMAINE));
    expect(Math.round(AIDE_SEMAINE)).toBe(38);
    // « Un quart de couverts de moins qu'en septembre » en novembre.
    const novembre = moyenne([10, 11, 12, 13].map((w) => SAISON[w]!));
    expect(1 - novembre).toBeGreaterThan(0.2);
    expect(1 - novembre).toBeLessThan(0.3);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : des tuteurs et un parcours valent bien mieux que des renforts au rang dès la rentrée", () => {
    expect(classement(MEILLEUR, D.rentree)[0]).toBe(0);
    expect(classement(MEILLEUR, D.rentree).at(-1)).toBe(1);
    expect(ecart(MEILLEUR, D.rentree, 0, 1)).toBeGreaterThan(8000);
    expect(ecart(MEILLEUR, D.rentree, 0, 3)).toBeGreaterThan(4000);
  });

  it("D2 : un planning bâti sur le calendrier du CFA ; retenir les apprentis se paie", () => {
    expect(classement(MEILLEUR, D.calendrier)[0]).toBe(0);
    expect(classement(MEILLEUR, D.calendrier).at(-1)).toBe(2);
    expect(ecart(MEILLEUR, D.calendrier, 0, 2)).toBeGreaterThan(2000);
    // Sans tuteurs, le conflit avec le CFA coûte encore plus cher.
    expect(ecart(ATTENTISTE, D.calendrier, 3, 2)).toBeGreaterThan(4000);
  });

  it("D3 : Bintou préparée tient le rang en moyenne, l'extra protège mieux ; sans tutorat, c'est un pari perdant", () => {
    const c = classement(MEILLEUR, D.arret);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(2);
    // L'espérance et la robustesse s'opposent : l'option la meilleure en moyenne n'est pas la plus sûre.
    expect(plusSur(MEILLEUR, D.arret)).not.toBe(1);
    // L'interaction : sans tuteurs depuis la rentrée, confier le rang à Bintou devient le mauvais choix.
    expect(chanceQueBintouTienne(MEILLEUR)).toBeGreaterThan(2 * chanceQueBintouTienne(ATTENTISTE));
    expect(ecart(ATTENTISTE, D.arret, 0, 1)).toBeGreaterThan(2000);
  });

  it("D4 : traiter ce qui fait décrocher Sanaa ; la remplacer par deux apprentis coûte le plus", () => {
    const c = classement(MEILLEUR, D.sanaa);
    expect(c[0]).toBe(1);
    expect(c.at(-1)).toBe(3);
    expect(ecart(MEILLEUR, D.sanaa, 1, 2)).toBeGreaterThan(1000);
    expect(ecart(MEILLEUR, D.sanaa, 1, 3)).toBeGreaterThan(4000);
  });

  it("D5 : ne pas prendre d'apprentis qu'on ne peut pas former", () => {
    expect(classement(MEILLEUR, D.recrues)).toEqual([2, 1, 0]);
    expect(ecart(MEILLEUR, D.recrues, 2, 0)).toBeGreaterThan(3000);
  });

  it("D6 : des binômes pour les groupes, le rang seul sur les services calmes", () => {
    const c = classement(MEILLEUR, D.groupes);
    expect(c[0]).toBe(0);
    expect(ecart(MEILLEUR, D.groupes, 0, 1)).toBeGreaterThan(1500);
    expect(ecart(MEILLEUR, D.groupes, 0, 3)).toBeGreaterThan(1000);
  });

  it("former avant de faire servir bat nettement les bras pour la salle et l'attentisme", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode! - reflexe!).toBeGreaterThan(20000);
    expect(methode! - attentiste!).toBeGreaterThan(8000);
    expect(REFERENCES[0]!.chemin).toEqual(MEILLEUR);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni présente dans la méthode", () => {
    for (const [d, o] of REFLEXES) {
      expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_APPRENTIS, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(false);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["ruptures", "service"],
      ["planning"],
      ["bintou"],
      ["sanaa"],
      ["tuteurs"],
      ["pret"],
    ],
    jours: JOURS,
    diagnostic: "tutorat",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 4.5,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_APPRENTIS, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a fait servir ses apprentis tout de suite, propose de former avant de faire servir", () => {
    const p = partie(REFLEXE, { diagnostic: "effectif" });
    const c = EPISODE_APPRENTIS.comportements(p, analyser(EPISODE_APPRENTIS, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[1]!.score).toBe(0);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_APPRENTIS.axe(c).titre).toBe("Former avant de faire servir");
  });

  it("à qui a décidé sans enquêter, propose de regarder comment les apprentis décrochent", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_APPRENTIS.comportements(p, analyser(EPISODE_APPRENTIS, p).trimestre);
    expect(EPISODE_APPRENTIS.axe(c).titre).toBe("Regarder comment les apprentis décrochent");
  });

  it("calibre la prévision du coût d'une rupture au dixième de k€ près", () => {
    const t = simuler(MEILLEUR, 3);
    const juste = EPISODE_APPRENTIS.comportements(partie(MEILLEUR, { prevision: 4.5 }), t)[3]!;
    const oublieLApprenti = EPISODE_APPRENTIS.comportements(
      partie(MEILLEUR, { prevision: (6 * 720 + 1400) / 1000 }),
      t,
    )[3]!;
    expect(juste.score).toBe(1);
    expect(oublieLApprenti.score).toBe(0);
  });

  it("dit le résultat en contribution et en écart au budget", () => {
    // La méthode tient le budget la plupart du temps, le réflexe jamais.
    const tenus = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).objectif >= BUDGET).length;
    expect(tenus(MEILLEUR)).toBeGreaterThan(20);
    expect(tenus(REFLEXE)).toBe(0);
    const g = GRAINES_DU_BILAN.find((x) => simuler(MEILLEUR, x).objectif >= BUDGET)!;
    expect(EPISODE_APPRENTIS.bilan.titre(simuler(MEILLEUR, g))).toMatch(/au-dessus du budget/);
    expect(EPISODE_APPRENTIS.bilan.titre(simuler(REFLEXE, g))).toMatch(/sous le budget/);
    const t = simuler(MEILLEUR, 5);
    expect(EPISODE_APPRENTIS.bilan.tuiles(t)).toHaveLength(4);
    expect(EPISODE_APPRENTIS.recap(t, 1, 2)).toHaveLength(3);
  });
});
