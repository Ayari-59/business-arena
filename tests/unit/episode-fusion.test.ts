import { describe, expect, it } from "vitest";
import {
  CHANCE_BASCULE_RATEE,
  D,
  IMPREVUS,
  NEUTRE,
  defense,
  hasard,
  risqueJoel,
  risqueSebastien,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/fusion-des-agences";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES } from "../../src/config/episodes/fusion-des-agences";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_FUSION } from "../../src/pedagogy/episodes/fusion-des-agences";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « La fusion des agences » enseigne trois choses : les clients d'un
 * négoce racheté suivent leurs vendeurs, et l'incertitude ou le choc des
 * procédures les font partir ; décider vite des rôles et unifier par étapes
 * vaut mieux que tout aligner d'un coup ou laisser deux agences côte à côte ;
 * ce que l'autre culture fait mieux, la réactivité, rapporte quand on l'étend
 * au lieu de l'effacer. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [0, 0, 0, 1, 0, 0];
const REFLEXE = [1, 1, 1, 0, 1, 1];
const ATTENTISTE = [3, 3, 2, 2, 3, 3];
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
const compte = (c: readonly number[], f: (t: ReturnType<typeof simuler>) => boolean) =>
  GRAINES_DU_BILAN.filter((g) => f(simuler(c, g))).length;

describe("le modèle de l'agence fusionnée", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.margeArvel).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.margeArvel,
      6,
    );
    expect(simuler([0, 0, 1, 0, 0, 0], 12).raymondVexe).toBe(
      simuler([1, 1, 1, 0, 1, 1], 12).raymondVexe,
    );
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

  it("la bonne méthode garde les clients et les vendeurs ; les réflexes les font partir", () => {
    const clients = (c: readonly number[]) =>
      moyenne(GRAINES_DU_BILAN.map((g) => simuler(c, g).clientsFinal));
    expect(clients(MEILLEUR)).toBeGreaterThan(0.88);
    expect(clients(REFLEXE)).toBeLessThan(0.6);
    expect(clients([...NEUTRE])).toBeLessThan(0.75);
    expect(compte(MEILLEUR, (t) => t.sebastienPart || t.joelPart || t.naimaPart)).toBe(0);
    expect(compte(REFLEXE, (t) => t.sebastienPart)).toBeGreaterThan(15);
    expect(compte([...NEUTRE], (t) => t.sebastienPart)).toBeGreaterThan(8);
  });

  it("l'incertitude et le choc font le risque de départ ; un rôle nouveau retient Pierrick", () => {
    expect(risqueSebastien(0.2, 0)).toBe(0);
    expect(risqueSebastien(0.6, 0)).toBeGreaterThan(0.35);
    expect(risqueSebastien(0.6, 0.3)).toBeGreaterThan(risqueSebastien(0.6, 0));
    expect(risqueJoel(0, 0.5, 0.3)).toBeLessThan(0.1);
    expect(risqueJoel(1, 0.2, 0)).toBeGreaterThan(0.5);
  });

  it("les doublons s'éteignent avec la bonne méthode, et coûtent encore sans décision", () => {
    expect(simuler(MEILLEUR, 3).doublonsFinal).toBe(0);
    expect(simuler([...NEUTRE], 3).doublonsFinal).toBeGreaterThan(6000);
  });

  it("une bascule en un week-end tourne mal environ une fois sur deux", () => {
    const ratees = compte(REFLEXE, (t) => t.basculeRatee);
    expect(ratees).toBeGreaterThan(30 * CHANCE_BASCULE_RATEE * 0.5);
    expect(ratees).toBeLessThan(30 * CHANCE_BASCULE_RATEE * 1.5);
    expect(compte(MEILLEUR, (t) => t.basculeRatee)).toBe(0);
  });

  it("le tableau de bord part de la situation du rachat et lit chaque indicateur", () => {
    const l = tableauDeBord([], 1, 0, 0);
    expect(l.clients).toBeCloseTo(0.97, 6);
    expect(l.inquietude).toBeCloseTo(0.55, 6);
    for (const ind of EPISODE_FUSION.indicateurs) {
      expect(EPISODE_FUSION.lire([0], 1, 0, 4)[ind.cle], ind.cle).toBeTypeOf("number");
    }
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const c of [MEILLEUR, REFLEXE, [...NEUTRE], ATTENTISTE]) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(c, g);
        for (const s of t.semaines.slice(1)) {
          expect(s!.marge).toBeGreaterThan(40000);
          expect(s!.marge).toBeLessThan(78000);
        }
        expect(t.objectif).toBeGreaterThan(-250000);
        expect(t.objectif).toBeLessThan(60000);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : clarifier vite les rôles bat tout aligner, séparer ou attendre le siège", () => {
    const r = rejeu(MEILLEUR, D.lancement);
    expect(classement(MEILLEUR, D.lancement)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(20000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D2 : un rôle construit sur les forces de Pierrick bat l'organigramme d'Arvel et l'attente", () => {
    const r = rejeu(MEILLEUR, D.comptoir);
    expect(classement(MEILLEUR, D.comptoir)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu).toBeGreaterThan(r[2]!.attendu);
    expect(r[1]!.attendu).toBeGreaterThan(r[3]!.attendu);
  });

  it("D3 : faire de Raymond un pont vers ses clients bat l'écarter, le laisser faire ou lui rendre le négoce", () => {
    const r = rejeu(MEILLEUR, D.raymond);
    expect(classement(MEILLEUR, D.raymond)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(10000);
  });

  it("D4 : basculer en deux temps bat le week-end de bascule et la double saisie", () => {
    const r = rejeu(MEILLEUR, D.logiciel);
    expect(classement(MEILLEUR, D.logiciel)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(4000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.p10).toBeGreaterThan(r[0]!.p10);
  });

  it("D5 : étendre la réactivité du négoce est le meilleur en moyenne, la délégation étroite le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.reactivite);
    expect(classement(MEILLEUR, D.reactivite)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.reactivite)).toBe(3);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
  });

  it("D5 : sans Pierrick pour la piloter, la délégation généralisée ne vaut plus la délégation étroite", () => {
    const sansJoel = [0, 1, 0, 1, 0, 0];
    expect(compte(sansJoel, (t) => t.joelPart)).toBeGreaterThan(10);
    expect(classement(sansJoel, D.reactivite)[0]).toBe(3);
    const ecart = (c: readonly number[]) => {
      const r = rejeu(c, D.reactivite);
      return r[0]!.attendu - r[3]!.attendu;
    };
    expect(ecart(MEILLEUR) - ecart(sansJoel)).toBeGreaterThan(5000);
  });

  it("D6 : les visites avec le vendeur habituel battent le courrier, la remise et l'inaction", () => {
    const r = rejeu(MEILLEUR, D.offensive);
    expect(classement(MEILLEUR, D.offensive)[0]).toBe(0);
    for (const o of [1, 2, 3]) expect(r[0]!.attendu - r[o]!.attendu).toBeGreaterThan(10000);
    // La visite protège moins quand le vendeur est parti.
    const avec = defense(MEILLEUR, { sebastien: false, naima: false, joel: false });
    const sans = defense(MEILLEUR, { sebastien: true, naima: false, joel: false });
    expect(sans.negoce.sebastien).toBeGreaterThan(3 * avec.negoce.sebastien);
  });

  it("clarifier vite et garder les clients bat tout aligner et attendre le siège, en moyenne", () => {
    const [bonne, reflexe, attente] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(50000);
    expect(bonne! - attente!).toBeGreaterThan(50000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["portefeuille", "dejeuner"],
      ["comptoir"],
      ["historiques"],
      ["bourgoin"],
      ["devis"],
      ["cibles"],
    ],
    jours: JOURS,
    diagnostic: "personnes",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 95,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_FUSION, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a tout aligné sur Arvel, propose de ne céder à aucun des deux réflexes", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_FUSION.comportements(p, analyser(EPISODE_FUSION, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_FUSION.axe(c).titre).toBe("Ni tout aligner, ni laisser deux agences");
  });

  it("à qui a décidé sans enquêter, propose de regarder à qui parlent les clients", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_FUSION.comportements(p, analyser(EPISODE_FUSION, p).trimestre);
    expect(EPISODE_FUSION.axe(c).titre).toBe("Regarder à qui parlent les clients");
  });

  it("dit le résultat en écart au plan de rachat", () => {
    expect(EPISODE_FUSION.bilan.titre(simuler(REFLEXE, 4242))).toMatch(/sous le plan de rachat/);
    const meilleurs = GRAINES_DU_BILAN.filter((g) =>
      /au-dessus du plan/.test(EPISODE_FUSION.bilan.titre(simuler(MEILLEUR, g))),
    );
    expect(meilleurs.length).toBeGreaterThan(15);
  });

  it("donne à chaque décision ses réactions, dont celle de Raymond tirée au hasard", () => {
    for (const e of ETAPES) expect(e.reactions).toHaveLength(e.options.length);
    const textes = new Set(
      GRAINES_DU_BILAN.map((g) => EPISODE_FUSION.reactions(D.raymond, 1, g)![0]!.texte),
    );
    expect(textes.size).toBe(2);
    expect(EPISODE_FUSION.reactions(D.raymond, 0, 1)).toBeNull();
  });
});
