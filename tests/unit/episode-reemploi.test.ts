import { describe, expect, it } from "vitest";
import {
  ACCORD,
  CAPACITE_DEUX,
  COMPTOIRS,
  D,
  DEMOLISSEURS,
  ECOULEMENT,
  FILIERE,
  GISEMENT,
  IMPREVUS,
  LIGNE,
  NEUTRE,
  PLATEFORME,
  PRIX_DU_PLAN,
  REEMPLOI_METROPOLE,
  REPRISE,
  SCENARIOS,
  SUBVENTION,
  SUBVENTION_RELEVEE,
  VALEUR_RESIDUELLE,
  VOLUME_ACCESSIBLE,
  VOLUME_DES_SIX,
  VOLUME_RELEVE,
  annuite,
  chanceVercoran,
  coutAccord,
  hasard,
  margeParTonne,
  simuler,
  vanEquipement,
} from "../../src/engine/episodes/pari-du-reemploi";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/pari-du-reemploi";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_REEMPLOI,
  chiffresDesEquipements,
} from "../../src/pedagogy/episodes/pari-du-reemploi";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le pari du réemploi » enseigne qu'on n'est pas premier ou
 * suiveur en bloc : ce qui est rare et se signe une fois (les conventions
 * avec les grands démolisseurs, une référence publique) se prend tôt, ce
 * qui s'achète à tout moment (la plateforme, les comptoirs) se décide sur
 * les chiffres ; que la réaction du concurrent dépend de ce qu'on lui
 * laisse ; et que le plan se révise sur les premiers chiffres. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 0, 1, 1, 1, 1];
const REFLEXE = [0, 1, 0, 0, 0, 0];
const ATTENTISTE = [2, 2, 2, 2, 3, 2];
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
const k = (v: number) => Math.round(v / 1000);
/** Un nombre tel que les sources l'écrivent, avec l'espace fine des milliers. */
const fr = (v: number) => v.toLocaleString("fr-FR");
/** Le contexte d'une étape, tel que le joueur le lit avec les décisions déjà prises. */
const contexte = (etape: number, decisions: readonly number[], graine = 1): Contexte => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  return EPISODE_REEMPLOI.contexte(EPISODE_REEMPLOI.lire(decisions, graine, 0, semaine), decisions);
};
/** Le texte d'une source. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string"
    ? s.resultat
    : s.resultat(contexte(etape, decisions, graine));
};

describe("le modèle de la filière réemploi", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).scenario).toBe(simuler(REFLEXE, 12).scenario);
    expect(simuler(MEILLEUR, 12).ecoulement).toBe(simuler(ATTENTISTE, 12).ecoulement);
    expect(simuler(MEILLEUR, 12).reemploi).toBe(simuler(REFLEXE, 12).reemploi);
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

  it("le décret tombe dans chacun de ses trois états, à peu près aux chances que la fédération donne", () => {
    SCENARIOS.forEach((s, i) => {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).scenario === i).length;
      expect(n, s.id).toBeGreaterThan(0);
      expect(Math.abs(n / GRAINES_DU_BILAN.length - s.chance), s.id).toBeLessThan(0.2);
    });
  });

  it("Vercoran vient d'autant plus qu'on lui laisse les grands gisements, ou qu'on lui fait signe", () => {
    expect(chanceVercoran(MEILLEUR)).toBeCloseTo(0.2, 6);
    expect(chanceVercoran([1, 3])).toBeGreaterThan(chanceVercoran(MEILLEUR));
    expect(chanceVercoran([1, 2])).toBeGreaterThan(chanceVercoran([1, 1]));
    expect(chanceVercoran([0, 0])).toBeGreaterThan(chanceVercoran([1, 0]));
    expect(chanceVercoran([2, 0])).toBeGreaterThan(chanceVercoran([1, 0]));
    const entre = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).vercoran).length;
    expect(entre(MEILLEUR)).toBeLessThan(entre(REFLEXE));
    expect(entre(MEILLEUR)).toBeLessThan(entre(ATTENTISTE));
  });

  it("la valeur de la semaine 13 est l'objectif ; l'attente coûte, sans être absurde", () => {
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.semaines).toHaveLength(14);
    const neutre = attendu(NEUTRE);
    expect(neutre).toBeLessThan(0);
    expect(neutre).toBeGreaterThan(-100000);
  });

  it("le premier bilan fait tomber l'estimation du plan : c'est le signal à lire", () => {
    const t = simuler(MEILLEUR, 3, JOURS);
    expect(t.semaines[5]!.ecoulement).toBe(ECOULEMENT.plan);
    expect(t.semaines[6]!.ecoulement).toBeLessThan(ECOULEMENT.plan - 0.05);
    expect(t.semaines[6]!.valeur).toBeLessThan(t.semaines[5]!.valeur - 100000);
  });

  it("la bonne méthode atteint l'objectif en moyenne ; le premier visible détruit de la valeur", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(150000);
    expect(bon).toBeLessThan(300000);
    expect(attendu(REFLEXE)).toBeLessThan(-300000);
    expect(attendu(REFLEXE)).toBeGreaterThan(-800000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("le volume accessible, que la semaine 1 demande, s'obtient en enchaînant les filtres de l'étude", () => {
    expect(VOLUME_ACCESSIBLE).toBe(
      Math.round(GISEMENT.dechets * GISEMENT.deposables * GISEMENT.reemployables),
    );
    expect(VOLUME_ACCESSIBLE).toBe(9000);
    expect(EPISODE_REEMPLOI.prevision.reel(simuler(MEILLEUR, 1))).toBe(9000);
    // Les six démolisseurs, cités un par un, font bien 60 % du gisement.
    expect(
      DEMOLISSEURS.sartel + DEMOLISSEURS.grollier + DEMOLISSEURS.moyens * DEMOLISSEURS.parMoyen,
    ).toBe(VOLUME_DES_SIX);
    const texte = source(0, "etude", []);
    expect(texte).toContain(`${fr(GISEMENT.dechets)} t de déchets du bâtiment`);
    expect(texte).toContain("15 % de ce tonnage en produits et équipements déposables");
    expect(texte).toContain("dont 15 % en état d'être réemployés");
    expect(texte).toContain("Six démolisseurs traitent 60 %");
    expect(texte).toContain(`Sartel Déconstruction (${fr(DEMOLISSEURS.sartel)} t par an)`);
  });

  it("la marge d'une tonne au plan, et ce que coûte un point d'écoulement, sont ceux que la convention affiche", () => {
    const aLaMain =
      ECOULEMENT.plan * FILIERE.prix -
      FILIERE.prixGaranti -
      FILIERE.collecte -
      FILIERE.triSousTraite -
      (1 - ECOULEMENT.plan) * FILIERE.recyclage;
    expect(margeParTonne(ECOULEMENT.plan)).toBeCloseTo(aLaMain, 6);
    expect(Math.round(aLaMain)).toBe(69);
    const texte = source(1, "convention", [1]);
    expect(texte).toContain("une tonne collectée rapporte 69 €");
    expect(texte).toContain("chaque point d'écoulement en moins en retire 4,2 €");
    expect(margeParTonne(0.54) - margeParTonne(0.55)).toBeCloseTo(-4.2, 6);
  });

  it("le coût net d'une tonne de l'accord-cadre, et l'offre du plan, sont ceux du cahier des charges", () => {
    const aLaMain = (x: number) => ACCORD.depose - x * FILIERE.prix + (1 - x) * FILIERE.recyclage;
    expect(coutAccord(REEMPLOI_METROPOLE.plan)).toBeCloseTo(aLaMain(0.55), 6);
    expect(Math.round(aLaMain(0.55))).toBe(69);
    expect(PRIX_DU_PLAN).toBe(94);
    expect(source(2, "cahier", MEILLEUR.slice(0, 2))).toContain("Au taux du plan (55 %), 69 €");
    expect(ETAPES[2]!.options[0]!.t).toContain("94 € la tonne");
    // Au taux moyen que mesurent les concurrents, l'offre du plan perd de l'argent à chaque tonne.
    expect(coutAccord(REEMPLOI_METROPOLE.moyen)).toBeGreaterThan(PRIX_DU_PLAN + 10);
  });

  it("l'offre d'Orréa et le tarif standard sont ceux que la source chiffre", () => {
    const texte = source(4, "orrea", MEILLEUR.slice(0, 4));
    expect(REPRISE.cleEnMain * REPRISE.dechets).toBe(66000);
    expect(texte).toContain("soit 66 k€ par an");
    expect(texte).toContain(
      `soit ${k(REPRISE.cleEnMain * (REPRISE.dechets - REPRISE.reemployables))} k€ par an`,
    );
    expect(texte).toContain(`soit ${k(REPRISE.standard * REPRISE.dechets)} k€ par an`);
  });

  it("les comptoirs : deux suffisent au taux mesuré, six au taux du plan", () => {
    expect(CAPACITE_DEUX).toBe(2 * COMPTOIRS.capaciteBon + COMPTOIRS.direct);
    const volume = DEMOLISSEURS.sartel + DEMOLISSEURS.grollier + REPRISE.reemployables;
    expect(ECOULEMENT.plan * volume).toBeGreaterThan(CAPACITE_DEUX);
    expect(ECOULEMENT.max * volume).toBeLessThanOrEqual(CAPACITE_DEUX);
    const texte = source(3, "bilan", MEILLEUR.slice(0, 3), 3);
    expect(texte).toContain(`${fr(CAPACITE_DEUX)} t au plein prix`);
  });

  it("la VAN de la ligne et de la plateforme est celle que la source de la semaine 11 affiche", () => {
    const aLaMain = (eq: typeof LIGNE, v: number) =>
      -eq.prix * (1 - SUBVENTION) +
      (Math.min(v, eq.capacite) * (FILIERE.triSousTraite - eq.variable) - eq.fixe) *
        (annuite(5) - annuite(1)) +
      (eq.prix * VALEUR_RESIDUELLE) / 1.09 ** 5;
    expect(vanEquipement(LIGNE, 2700, { subvention: SUBVENTION })).toBeCloseTo(
      aLaMain(LIGNE, 2700),
      6,
    );
    expect(vanEquipement(PLATEFORME, 2700, { subvention: SUBVENTION })).toBeCloseTo(
      aLaMain(PLATEFORME, 2700),
      6,
    );
    const graine = 1;
    expect(simuler(MEILLEUR, graine).vercoran).toBe(false);
    const c = chiffresDesEquipements(2700, 2400, SUBVENTION);
    const texte = source(5, "dimensionnement", MEILLEUR.slice(0, 5), graine);
    expect(texte).toContain(`à ${fr(2700)} t par an si l'obligation s'applique et ${fr(2400)} t`);
    expect(texte).toContain(
      `la ligne de ${fr(LIGNE.capacite)} t, subvention déduite, +${k(c.ligne)} k€`,
    );
    expect(texte).toContain(
      `la plateforme de ${fr(PLATEFORME.capacite)} t, −${-k(c.plateforme)} k€`,
    );
    expect(c.ligne).toBeGreaterThan(0);
    expect(c.plateforme).toBeLessThan(0);
  });

  it("les imprévus annoncent les chiffres que le modèle applique", () => {
    const volume = IMPREVUS.find((i) => i.id === "volume")!.texte;
    expect(volume).toContain(`de ${fr(ACCORD.volume)} à ${fr(VOLUME_RELEVE)} t par an`);
    const subvention = IMPREVUS.find((i) => i.id === "subvention")!.texte;
    expect(subvention).toContain(`de ${SUBVENTION * 100} à ${SUBVENTION_RELEVEE * 100} %`);
  });

  it("tous les messages et toutes les sources se lisent, quel que soit le chemin", () => {
    for (const chemin of [MEILLEUR, REFLEXE, ATTENTISTE, [3, 3, 3, 3, 2, 0]]) {
      ETAPES.forEach((e, etape) => {
        const ctx = contexte(etape, chemin.slice(0, etape), 4);
        const textes = [
          ...e.messages(ctx).map((m) => m.texte),
          ...e.sources.map((s) => (typeof s.resultat === "string" ? s.resultat : s.resultat(ctx))),
        ];
        for (const t of textes) expect(t, `D${etape + 1}`).not.toMatch(/undefined|NaN/);
      });
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : prendre les gisements d'abord bat la plateforme annoncée et l'attente ; l'attente est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.posture);
    expect(classement(MEILLEUR, D.posture)[0]).toBe(1);
    expect(classement(MEILLEUR, D.posture).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(100000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(50000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(15000);
    expect(plusSure(MEILLEUR, D.posture)).toBe(2);
  });

  it("D2 : les conventions de cinq ans battent l'essai d'un an et l'attente", () => {
    const r = rejeu(MEILLEUR, D.conventions);
    expect(classement(MEILLEUR, D.conventions)[0]).toBe(0);
    expect(classement(MEILLEUR, D.conventions).at(-1)).toBe(2);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(100000);
  });

  it("D3 : caractériser avant de chiffrer bat l'offre du plan ; ne pas répondre est le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.accord);
    expect(classement(MEILLEUR, D.accord)[0]).toBe(1);
    expect(classement(MEILLEUR, D.accord).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(60000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
    expect(plusSure(MEILLEUR, D.accord)).toBe(2);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
  });

  it("D3 : sans convention à faire valoir, la caractérisation rapporte bien moins", () => {
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.accord);
      return x[1]!.attendu - x[2]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([1, 2, 1, 1, 1, 1]) + 20000);
  });

  it("D4 : réviser le rythme des comptoirs au vu du premier bilan bat tenir le plan", () => {
    const r = rejeu(MEILLEUR, D.comptoirs);
    expect(classement(MEILLEUR, D.comptoirs)[0]).toBe(1);
    expect(classement(MEILLEUR, D.comptoirs).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
  });

  it("D5 : garder les flux réemployables bat tout céder à Orréa, et l'attente du décret", () => {
    const r = rejeu(MEILLEUR, D.orrea);
    expect(classement(MEILLEUR, D.orrea)[0]).toBe(1);
    expect(classement(MEILLEUR, D.orrea).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : la ligne à la taille des gisements bat la grande plateforme, et n'a de valeur qu'avec des gisements", () => {
    const r = rejeu(MEILLEUR, D.equipement);
    expect(classement(MEILLEUR, D.equipement)).toEqual([1, 2, 0]);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(30000);
    // L'interaction : sans conventions, la même ligne détruit de la valeur.
    const sansGisement = rejeu([1, 2, 1, 1, 1, 1], D.equipement);
    expect(sansGisement[1]!.attendu).toBeLessThan(sansGisement[2]!.attendu);
    expect(classement(ATTENTISTE, D.equipement)[0]).toBe(2);
  });

  it("les gisements d'abord battent le premier visible et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(400000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, ni n'est dans la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_REEMPLOI, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1}`).toBeLessThan(SEUIL_QUALITE);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
    }
    expect(REFLEXES.some(([d, o]) => REFERENCES[0].chemin[d] === o)).toBe(false);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["etude", "grenoble"],
      ["convention", "vercoran"],
      ["cahier"],
      ["bilan"],
      ["orrea"],
      ["dimensionnement"],
    ],
    jours: JOURS,
    diagnostic: "gisements",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 9000,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_REEMPLOI, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi la mode, propose de distinguer ce qui se prend de ce qui s'achète", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_REEMPLOI.comportements(p, analyser(EPISODE_REEMPLOI, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_REEMPLOI.axe(c).titre).toBe("Distinguer ce qui se prend de ce qui s'achète");
  });

  it("à qui a tout attendu, le constat du domaine le dit", () => {
    const p = partie(ATTENTISTE);
    const c = EPISODE_REEMPLOI.comportements(p, simuler(ATTENTISTE, 11, JOURS));
    expect(c[4]!.score).toBe(0);
    expect(c[4]!.texte).toMatch(/Vous avez attendu sur tout/);
  });

  it("à qui a décidé sans enquêter, propose de mesurer le gisement et de lire le concurrent", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_REEMPLOI.comportements(p, analyser(EPISODE_REEMPLOI, p).trimestre);
    expect(EPISODE_REEMPLOI.axe(c).titre).toBe("Mesurer le gisement, et lire le concurrent");
  });

  it("juge l'estimation du gisement : juste, proche, ou faute d'avoir enchaîné les filtres", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_REEMPLOI.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(9000)).toBe(1);
    expect(score(9800)).toBe(0.6);
    // Un seul des deux filtres de 15 % : 400 000 × 0,15 = 60 000 t, les « 60 000 t » du salon.
    expect(score(60000)).toBe(0);
    // Les six démolisseurs pris pour tout le gisement.
    expect(score(5400)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_REEMPLOI.bilan.titre(simuler(MEILLEUR, 2))).toMatch(/valeur créée/);
    expect(EPISODE_REEMPLOI.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
