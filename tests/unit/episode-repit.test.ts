import { describe, expect, it } from "vitest";
import {
  D,
  FAMILLES_SUIVIES,
  IMPREVUS,
  O,
  hasard,
  ouverture,
  simuler,
} from "../../src/engine/episodes/repit-a-creer";
import {
  GRAINES_DU_BILAN,
  moyenne,
  rejouerAvec,
} from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PREVISION,
  REFERENCES,
} from "../../src/config/episodes/repit-a-creer";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_REPIT } from "../../src/pedagogy/episodes/repit-a-creer";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le répit à créer » fait porter un projet, de l'intention à la
 * création, en seconde option management et gestion. Il enseigne qu'un projet
 * part du besoin vérifié chez ceux qui l'ont, s'appuie sur une forme et des
 * partenaires, se prépare depuis sa date d'ouverture, et se finance par un
 * modèle calculé. Ces tests verrouillent les classements qui le disent.
 */

const MEILLEUR = [1, 0, 2, 3, 1, 2];
const RIEN = [3, 3, 1, 0, 0, 0];
const AXE_SANS_INFORMATION = "Aller voir les familles";

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

describe("le modèle du projet", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).aidants).toBe(simuler(RIEN, 12).aidants);
    expect(hasard(5)).toBe(hasard(5));
  });

  it("chaque trimestre a un ou deux imprévus, et chacun tombe au moins une fois sur trente", () => {
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

  it("la prévision se fait par une seule multiplication, que le réalisé suit de près", () => {
    const attenduParLeCalcul = PREVISION.familles / PREVISION.unSur;
    expect(PREVISION.familles).toBe(FAMILLES_SUIVIES);
    for (const g of GRAINES_DU_BILAN) {
      expect(
        Math.abs(hasard(g).aidants - attenduParLeCalcul),
      ).toBeLessThanOrEqual(0.25 * attenduParLeCalcul);
    }
  });

  it("la forme décide de l'ouverture : un service de Solvanne ouvre en semaine 9, une coopérative à la fin", () => {
    expect(ouverture(MEILLEUR)).toBe(9);
    const cooperative = [...MEILLEUR];
    cooperative[D.forme] = O.forme.cooperative;
    expect(ouverture(cooperative)).toBe(13);
  });

  it("vérifier le besoin chez les familles fait venir bien plus de monde qu'un sondage", () => {
    const sondage = [...MEILLEUR];
    sondage[D.besoin] = O.besoin.sondage;
    expect(simuler(MEILLEUR, 3).heures).toBeGreaterThan(
      simuler(sondage, 3).heures * 1.4,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : rencontrer les familles bat le sondage, l'avis de la directrice et l'ouverture sans vérifier", () => {
    expect(classement(MEILLEUR, D.besoin)[0]).toBe(O.besoin.rencontrer);
    expect(ecart(MEILLEUR, D.besoin, O.besoin.sondage)).toBeGreaterThan(3000);
  });

  it("D2 : un service de Solvanne bat l'association nouvelle, la coopérative et l'absence de forme", () => {
    expect(classement(MEILLEUR, D.forme)[0]).toBe(O.forme.service);
  });

  it("D3 : réunir les acteurs bat écrire seul, tout faire seul ou recruter sans former", () => {
    const c = classement(MEILLEUR, D.acteurs);
    expect(c[0]).toBe(O.acteurs.reunir);
    expect(c.at(-1)).toBe(O.acteurs.seul);
  });

  it("D4 : remonter depuis la date d'ouverture bat ouvrir tout de suite ou attendre la perfection", () => {
    const c = classement(MEILLEUR, D.calendrier);
    expect(c[0]).toBe(O.calendrier.retroplanning);
    expect(c.at(-1)).toBe(O.calendrier.parfait);
  });

  it("D5 : le modèle calculé bat la gratuité, le prix fort et le mécène unique", () => {
    expect(classement(MEILLEUR, D.modele)[0]).toBe(O.modele.participation);
    expect(ecart(MEILLEUR, D.modele, O.modele.grandMecene)).toBeGreaterThan(
      3000,
    );
  });

  it("D6 : trois indicateurs simples battent les passages, les belles histoires et le cabinet", () => {
    expect(classement(MEILLEUR, D.utilite)[0]).toBe(O.utilite.indicateurs);
  });

  it("écouter, s'appuyer, calculer bat aller vite et ne rien préparer, en moyenne", () => {
    const [bien, vite, rien] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bien).toBeGreaterThan(vite! + 10000);
    expect(bien).toBeGreaterThan(rien! + 10000);
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
      ["familles", "dossiers"],
      ["formes"],
      ["acteurs"],
      ["liste", "soignants"],
      ["seuil"],
      ["utilite"],
    ],
    jours: JOURS,
    diagnostic: "besoin",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 30,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_REPIT, partie(MEILLEUR, { graine }));
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
        analyser(EPISODE_REPIT, partie(chemin)).decisions[d]!.bonne,
        `D${d + 1}`,
      ).toBe(false);
    });
  });

  it("à qui a décidé sans rien vérifier, propose de commencer par s'informer", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_REPIT.comportements(
      p,
      analyser(EPISODE_REPIT, p).trimestre,
    );
    expect(c[0]!.score).toBe(0);
    expect(EPISODE_REPIT.axe(c).titre).toBe(AXE_SANS_INFORMATION);
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
    const ctx = { familles: "1", heures: "1", caisse: "1 €", places: "1" };
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
      EPISODE_REPIT.persona,
      EPISODE_REPIT.resume,
      EPISODE_REPIT.jugement,
    );
    for (const t of textes) expect(t, t).not.toMatch(/\s[–—]\s/);
  });
});
