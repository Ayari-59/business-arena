import { describe, expect, it } from "vitest";
import {
  COMMANDES_PAR_SEMAINE,
  D,
  DEMARQUE_TRIMESTRE_DERNIER,
  IMPREVUS,
  O,
  carrelageDecolle,
  hasard,
  simuler,
} from "../../src/engine/episodes/libre-service-qui-perd";
import {
  GRAINES_DU_BILAN,
  moyenne,
  rejouerAvec,
} from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PREVISION,
  REFERENCES,
} from "../../src/config/episodes/libre-service-qui-perd";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_LIBRE_SERVICE } from "../../src/pedagogy/episodes/libre-service-qui-perd";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le libre-service qui perd » fait jouer un équipier en CAP. Il
 * enseigne quatre gestes : écrire les réserves avant de signer, mettre devant
 * ce qui périme le plus tôt, tenir un stock juste (déclarer, compter), et
 * prendre le temps du client. Ces tests verrouillent les classements qui le
 * disent, et ce que le bilan en tire.
 */

const MEILLEUR = [1, 3, 2, 0, 3, 1];
const VITE = [0, 0, 3, 1, 1, 2];
const HABITUDE = [0, 0, 0, 1, 2, 0];
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

describe("le modèle du libre-service", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[3]!.commandes).toBeCloseTo(
      simuler(HABITUDE, 12).semaines[3]!.commandes,
      6,
    );
    expect(simuler(MEILLEUR, 12).semaines[1]!.incidents).toBe(
      simuler(VITE, 12).semaines[1]!.incidents,
    );
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

  it("la réception pèse le plus lourd dans la démarque du trimestre dernier : le bon diagnostic", () => {
    const { reception, dates, casse, vol } = DEMARQUE_TRIMESTRE_DERNIER;
    expect(reception).toBeGreaterThan(dates);
    expect(dates).toBeGreaterThan(casse);
    expect(casse).toBeGreaterThan(vol);
  });

  it("la prévision se fait par une multiplication guidée, que le réalisé suit de près", () => {
    expect(PREVISION.parJour * PREVISION.jours).toBe(COMMANDES_PAR_SEMAINE);
    for (const g of GRAINES_DU_BILAN) {
      const reel = EPISODE_LIBRE_SERVICE.prevision.reel(simuler(MEILLEUR, g));
      expect(Math.abs(reel - COMMANDES_PAR_SEMAINE)).toBeLessThan(
        0.15 * COMMANDES_PAR_SEMAINE,
      );
    }
  });

  it("les bons gestes tiennent les objectifs d'équipier ; l'habitude les manque", () => {
    const bien = simuler(MEILLEUR, 3);
    const habitude = simuler(HABITUDE, 3);
    expect(bien.aLHeureMoyen).toBeGreaterThan(habitude.aLHeureMoyen);
    expect(bien.semaines[13]!.aLHeure).toBeGreaterThanOrEqual(0.9);
    expect(bien.semaines[13]!.satisfaction).toBeGreaterThan(0.85);
    expect(habitude.semaines[13]!.satisfaction).toBeLessThan(0.8);
    expect(bien.demarque).toBeLessThan(habitude.demarque * 0.6);
    expect(bien.rupturesMoyennes).toBeLessThan(habitude.rupturesMoyennes);
  });

  it("signer sans réserve laisse les colis abîmés à la charge de l'agence", () => {
    const signer = [...MEILLEUR];
    signer[D.reception] = O.reception.signerVite;
    for (const g of [2, 11, 4242]) {
      expect(simuler(MEILLEUR, g).incidentsPerdus).toBeLessThan(
        simuler(signer, g).incidentsPerdus * 0.3,
      );
    }
  });

  it("cacher les produits abîmés baisse la démarque affichée, puis l'inventaire la retrouve", () => {
    const cacher = [...MEILLEUR];
    cacher[D.etiquettes] = O.etiquettes.cacher;
    const t = simuler(cacher, 4);
    const juste = simuler(MEILLEUR, 4);
    expect(t.demarqueCachee).toBeGreaterThan(0);
    expect(t.semaines[8]!.demarque).toBeLessThan(juste.semaines[8]!.demarque);
    expect(t.semaines[13]!.demarque).toBeGreaterThan(
      juste.semaines[13]!.demarque,
    );
    // Le stock devient faux : plus de références vides en fin de trimestre.
    expect(t.semaines[13]!.ruptures).toBeGreaterThan(
      juste.semaines[13]!.ruptures,
    );
  });

  it("la colle la moins chère se décolle une fois sur deux environ, et seulement elle", () => {
    const moinsChere = [...MEILLEUR];
    moinsChere[D.conseil] = O.conseil.moinsChere;
    const n = GRAINES_DU_BILAN.filter((g) =>
      carrelageDecolle(moinsChere, g),
    ).length;
    expect(n).toBeGreaterThan(8);
    expect(n).toBeLessThan(22);
    expect(GRAINES_DU_BILAN.some((g) => carrelageDecolle(MEILLEUR, g))).toBe(
      false,
    );
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : écrire les réserves avant de signer bat signer vite, vérifier après, ou tout refuser", () => {
    expect(classement(MEILLEUR, D.reception)[0]).toBe(O.reception.controler);
    expect(
      ecart(MEILLEUR, D.reception, O.reception.signerVite),
    ).toBeGreaterThan(3000);
    expect(
      ecart(MEILLEUR, D.reception, O.reception.refuserTout),
    ).toBeGreaterThan(3000);
  });

  it("D2 : ce qui périme le plus tôt devant, et les commandes préparées la veille", () => {
    const c = classement(MEILLEUR, D.rangement);
    expect(c[0]).toBe(O.rangement.rotationLaVeille);
    expect(c.at(-1)).toBe(O.rangement.vite);
  });

  it("D3 : réassortir d'après les ventes de la veille ; les palettes dans les allées sont le pire", () => {
    const c = classement(MEILLEUR, D.reassort);
    expect(c[0]).toBe(O.reassort.ventesDeLaVeille);
    expect(c.at(-1)).toBe(O.reassort.palettes);
  });

  it("D4 : tout faire, inventaire compris, bat le balisage seul et la démarque cachée", () => {
    const c = classement(MEILLEUR, D.etiquettes);
    expect(c[0]).toBe(O.etiquettes.tout);
    expect(c.at(-1)).toBe(O.etiquettes.balisageVite);
    expect(c.indexOf(O.etiquettes.cacher)).toBeGreaterThan(
      c.indexOf(O.etiquettes.sansInventaire),
    );
  });

  it("D5 : questionner et conseiller bat la vente forcée, la moins chère et le renvoi au comptoir", () => {
    const c = classement(MEILLEUR, D.conseil);
    expect(c[0]).toBe(O.conseil.decouverte);
    expect(c.at(-1)).toBe(O.conseil.forcer);
  });

  it("D6 : écouter et régler sur place bat renvoyer au service client ou rembourser sans vérifier", () => {
    const c = classement(MEILLEUR, D.reclamation);
    expect(c[0]).toBe(O.reclamation.ecouter);
    expect(c.at(-1)).toBe(O.reclamation.serviceClient);
    expect(
      ecart(MEILLEUR, D.reclamation, O.reclamation.rembourser),
    ).toBeGreaterThan(3000);
  });

  it("contrôler, ranger, conseiller bat aller vite et faire comme d'habitude, en moyenne", () => {
    const [bien, vite, habitude] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bien).toBeGreaterThan(0);
    expect(vite).toBeLessThan(0);
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
      ["bons", "feuille"],
      ["dates", "commandes"],
      ["ventes"],
      ["prix", "stock"],
      ["bertin", "retours"],
      ["commande"],
    ],
    jours: JOURS,
    diagnostic: "reception",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 48,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_LIBRE_SERVICE, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("juge faibles les gestes rapides, et propose de bien faire avant de faire vite", () => {
    const p = partie(VITE);
    const a = analyser(EPISODE_LIBRE_SERVICE, p);
    expect(a.decisions.filter((d) => d.bonne)).toHaveLength(0);
    const c = EPISODE_LIBRE_SERVICE.comportements(p, a.trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_LIBRE_SERVICE.axe(c).titre).toBe(
      "Bien faire avant de faire vite",
    );
  });

  it("à qui a décidé sans rien vérifier, propose de regarder où part l'argent", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_LIBRE_SERVICE.comportements(
      p,
      analyser(EPISODE_LIBRE_SERVICE, p).trimestre,
    );
    expect(EPISODE_LIBRE_SERVICE.axe(c).titre).toBe(
      "Regarder où part l'argent",
    );
  });

  it("dit le résultat en écart au plafond de pertes", () => {
    expect(EPISODE_LIBRE_SERVICE.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /sous le plafond de pertes/,
    );
    expect(EPISODE_LIBRE_SERVICE.bilan.titre(simuler(HABITUDE, 4242))).toMatch(
      /au-delà du plafond de pertes/,
    );
  });

  it("ne trahit pas la bonne réponse par sa longueur : la meilleure option n'est la plus longue que deux fois au plus", () => {
    // Un élève qui prend toujours l'option la plus longue, la plus détaillée,
    // ne doit pas trouver la méthode sans réfléchir.
    const longues = ETAPES.filter((e, d) => {
      const longueurs = e.options.map((o) => o.t.length);
      return longueurs[MEILLEUR[d]!]! >= Math.max(...longueurs);
    });
    expect(
      longues.map((e) => e.titre).length,
      longues.map((e) => e.titre).join(", "),
    ).toBeLessThanOrEqual(2);
  });

  it("n'écrit aucun tiret au milieu d'une phrase", () => {
    const textes: string[] = [];
    for (const e of ETAPES) {
      const ctx = {
        demarque: "1 €",
        ruptures: "1",
        aLHeure: "1 %",
        satisfaction: "1 %",
        pertes: "1 k€",
      };
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
      EPISODE_LIBRE_SERVICE.persona,
      EPISODE_LIBRE_SERVICE.resume,
      EPISODE_LIBRE_SERVICE.jugement,
    );
    for (const t of textes) expect(t, t).not.toMatch(/\s[–—]\s/);
  });
});
