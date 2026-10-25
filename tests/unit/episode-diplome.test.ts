import { describe, expect, it } from "vitest";
import {
  CANDIDATURES,
  D,
  GRILLE,
  IMPREVUS,
  O,
  PART_DE_CAP,
  TABLEAU_DES_DIPLOMES,
  hasard,
  simuler,
} from "../../src/engine/episodes/diplome-qui-compte";
import {
  GRAINES_DU_BILAN,
  moyenne,
  rejouerAvec,
} from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PREVISION,
  REFERENCES,
} from "../../src/config/episodes/diplome-qui-compte";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_DIPLOME } from "../../src/pedagogy/episodes/diplome-qui-compte";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le diplôme qui compte » fait recruter les saisonniers de l'été,
 * en seconde, sur la question de SES : quelles relations entre le diplôme,
 * l'emploi et le salaire ? Il enseigne que le diplôme protège du chômage et
 * se paie, que le poste demande ou non une qualification, que l'expérience
 * compte aussi, et que le réseau pèse. Ces tests verrouillent les classements
 * qui le disent.
 */

const MEILLEUR = [2, 0, 3, 2, 1, 3];
const HABITUDE = [0, 3, 1, 0, 0, 0];
const AXE_SANS_INFORMATION = "Lire le tableau avant de recruter";

const JOURS = 1.5;
const objectif = (c: readonly number[], g: number) =>
  simuler(c, g, JOURS).objectif;
const rejeu = (chemin: readonly number[], d: number) =>
  rejouerAvec(objectif, chemin, d, ETAPES[d]!.options.length);
const classement = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d)
    .sort((a, b) => b.attendu - a.attendu)
    .map((r) => r.option);
const attendu = (chemin: readonly number[]) =>
  moyenne(GRAINES_DU_BILAN.map((g) => objectif(chemin, g)));
/** Ce que la meilleure option fait de plus que l'option donnée, en moyenne sur trente tirages. */
const ecart = (chemin: readonly number[], d: number, option: number) => {
  const r = rejeu(chemin, d);
  return Math.max(...r.map((x) => x.attendu)) - r[option]!.attendu;
};

describe("le modèle de la saison", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).candidatsCap).toBe(
      simuler(HABITUDE, 12).candidatsCap,
    );
    expect(hasard(5)).toBe(hasard(5));
  });

  it("chaque saison a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
    for (const g of GRAINES_DU_BILAN) {
      expect(hasard(g).imprevus.length).toBeGreaterThanOrEqual(1);
      expect(hasard(g).imprevus.length).toBeLessThanOrEqual(2);
    }
    const vus = new Set(
      GRAINES_DU_BILAN.flatMap((g) =>
        hasard(g).imprevus.map((i) => i.imprevu.id),
      ),
    );
    expect([...vus].sort()).toEqual(IMPREVUS.map((i) => i.id).sort());
  });

  it("le tableau fictif dit qu'un diplôme plus élevé donne plus d'emploi et plus de salaire, et la grille suit le diplôme", () => {
    for (let i = 1; i < TABLEAU_DES_DIPLOMES.length; i += 1) {
      expect(TABLEAU_DES_DIPLOMES[i]!.emploi).toBeGreaterThan(
        TABLEAU_DES_DIPLOMES[i - 1]!.emploi,
      );
      expect(TABLEAU_DES_DIPLOMES[i]!.salaire).toBeGreaterThan(
        TABLEAU_DES_DIPLOMES[i - 1]!.salaire,
      );
    }
    expect(GRILLE.niveau2).toBeGreaterThan(GRILLE.niveau1);
    expect(GRILLE.niveau3).toBeGreaterThan(GRILLE.niveau2);
  });

  it("la prévision se fait par une multiplication guidée, que le réalisé suit de près", () => {
    expect(PREVISION.candidatures * PREVISION.part).toBeCloseTo(
      CANDIDATURES * PART_DE_CAP,
      6,
    );
    const calcul = CANDIDATURES * PART_DE_CAP;
    for (const g of GRAINES_DU_BILAN) {
      expect(Math.abs(hasard(g).candidatsCap - calcul)).toBeLessThanOrEqual(
        0.4 * calcul + 1,
      );
    }
  });

  it("chercher les diplômés là où ils sont remplit la cuisine avec des titulaires du CAP", () => {
    const bien = simuler(MEILLEUR, 3);
    const habitude = simuler(HABITUDE, 3);
    expect(bien.sansCapMoyens).toBeLessThan(habitude.sansCapMoyens);
    expect(bien.departs).toBeLessThan(habitude.departs);
    expect(bien.retours).toBeGreaterThan(habitude.retours);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : aller chercher les CAP dans les lycées et les CFA bat l'annonce unique, les étudiants et l'intérim", () => {
    expect(classement(MEILLEUR, D.recherche)[0]).toBe(O.recherche.lyceesEtCfa);
    expect(ecart(MEILLEUR, D.recherche, O.recherche.interim)).toBeGreaterThan(
      3000,
    );
  });

  it("D2 : chacun au poste qui demande sa qualification bat le CAP partout et les moins chers", () => {
    expect(classement(MEILLEUR, D.affectation)[0]).toBe(
      O.affectation.chacunSaPlace,
    );
  });

  it("D3 : la grille du diplôme et de l'expérience bat le minimum pour tous et le cas par cas", () => {
    const c = classement(MEILLEUR, D.salaires);
    expect(c[0]).toBe(O.salaires.grille);
    expect(c.at(-1)).toBe(O.salaires.minimum);
  });

  it("D4 : la cooptation parmi d'autres sources bat la cooptation seule et l'interdiction", () => {
    expect(classement(MEILLEUR, D.renfort)[0]).toBe(O.renfort.parmiDautres);
    expect(
      ecart(MEILLEUR, D.renfort, O.renfort.cooptationSeule),
    ).toBeGreaterThan(3000);
  });

  it("D5 : l'essai et la reconnaissance de l'expérience battent le diplôme comme seule règle", () => {
    expect(classement(MEILLEUR, D.chef)[0]).toBe(O.chef.essai);
    expect(ecart(MEILLEUR, D.chef, O.chef.diplome)).toBeGreaterThan(3000);
  });

  it("D6 : expliquer par la grille bat fermer la discussion ou aligner les salaires", () => {
    const c = classement(MEILLEUR, D.explication);
    expect(c[0]).toBe(O.explication.grille);
    expect(c.at(-1)).toBe(O.explication.commeCa);
  });

  it("le diplôme, l'expérience et la grille battent le moins cher et l'habitude, en moyenne", () => {
    const [bien, moinsCher, habitude] = REFERENCES.map((r) =>
      attendu(r.chemin),
    );
    expect(bien).toBeGreaterThan(0);
    expect(moinsCher).toBeLessThan(0);
    expect(habitude).toBeLessThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (
    chemin: readonly number[],
    extra: Partial<PartieJouee> = {},
  ): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["tableau", "candidatures"],
      ["postes", "saisons"],
      ["grille", "concurrents"],
      ["cooptation"],
      ["essai", "vae"],
      ["fiche"],
    ],
    jours: JOURS,
    diagnostic: "rarete",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 12,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_DIPLOME, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("juge faible, sur le meilleur chemin, chacun des choix de la deuxième référence", () => {
    REFERENCES[1].chemin.forEach((option, d) => {
      if (option === MEILLEUR[d]) return;
      const chemin = [...MEILLEUR];
      chemin[d] = option;
      expect(
        analyser(EPISODE_DIPLOME, partie(chemin)).decisions[d]!.bonne,
        `D${d + 1}`,
      ).toBe(false);
    });
  });

  it("à qui a décidé sans rien vérifier, propose de commencer par s'informer", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_DIPLOME.comportements(
      p,
      analyser(EPISODE_DIPLOME, p).trimestre,
    );
    expect(c[0]!.score).toBe(0);
    expect(EPISODE_DIPLOME.axe(c).titre).toBe(AXE_SANS_INFORMATION);
  });

  it("ne trahit pas la bonne réponse par sa longueur : la meilleure option n'est la plus longue que deux fois au plus", () => {
    // Un élève qui prend toujours l'option la plus longue, la plus détaillée,
    // ne doit pas trouver la méthode sans réfléchir.
    const longues = ETAPES.filter((e, d) => {
      const longueurs = e.options.map((o) => o.t.length);
      return longueurs[MEILLEUR[d]!]! >= Math.max(...longueurs);
    });
    expect(
      longues.length,
      longues.map((e) => e.titre).join(", "),
    ).toBeLessThanOrEqual(2);
  });

  it("n'écrit aucun tiret au milieu d'une phrase", () => {
    const textes: string[] = [];
    const ctx = {
      cap: "1",
      sansCap: "1",
      vides: "1",
      departs: "1",
      couts: "1 k€",
    };
    for (const e of ETAPES) {
      textes.push(e.titre, e.question, ...e.messages(ctx).map((m) => m.texte));
      for (const s of e.sources)
        textes.push(
          s.titre,
          typeof s.resultat === "string" ? s.resultat : s.resultat(ctx),
        );
      for (const o of e.options) textes.push(o.t, o.d);
      for (const r of e.reactions)
        for (const m of r ?? []) textes.push(m.texte);
    }
    textes.push(
      EPISODE_DIPLOME.persona,
      EPISODE_DIPLOME.resume,
      EPISODE_DIPLOME.jugement,
    );
    for (const t of textes) expect(t, t).not.toMatch(/\s[–—]\s/);
  });
});
