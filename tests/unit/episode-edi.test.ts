import { describe, expect, it } from "vitest";
import {
  COMMANDES_PAR_SEMAINE,
  D,
  IMPREVUS,
  O,
  hasard,
  incidentDeSecurite,
  simuler,
} from "../../src/engine/episodes/edi-qui-s-impose";
import {
  GRAINES_DU_BILAN,
  moyenne,
  rejouerAvec,
} from "../../src/engine/episodes/commun";
import {
  ETAPES,
  PREVISION,
  REFERENCES,
} from "../../src/config/episodes/edi-qui-s-impose";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { EPISODE_EDI } from "../../src/pedagogy/episodes/edi-qui-s-impose";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'EDI qui s'impose » fait jouer l'administration des ventes de
 * la laiterie, en terminale STMG. Il enseigne qu'un échange entre
 * organisations ne marche que sur un langage commun : ne plus ressaisir,
 * mettre ses codes au standard, sécuriser sans s'isoler, partager le format
 * avec le transporteur, raccorder d'abord les gros volumes. Ces tests
 * verrouillent les classements qui le disent.
 */

const MEILLEUR = [2, 1, 3, 0, 3, 1];
const HABITUDE = [0, 0, 0, 1, 0, 2];
const AXE_SANS_INFORMATION = "Compter ce que coûte une ressaisie";

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

describe("le modèle des échanges", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[3]!.commandes).toBeCloseTo(
      simuler(HABITUDE, 12).semaines[3]!.commandes,
      6,
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

  it("la prévision se fait par une multiplication guidée", () => {
    expect(PREVISION.magasins * PREVISION.parMagasin).toBe(
      COMMANDES_PAR_SEMAINE,
    );
  });

  it("le logiciel relié fait presque disparaître les erreurs ; la ressaisie les garde", () => {
    expect(simuler(MEILLEUR, 3).semaines[13]!.erreurs).toBeLessThan(0.01);
    expect(simuler(HABITUDE, 3).semaines[13]!.erreurs).toBeGreaterThan(0.05);
    expect(simuler(MEILLEUR, 3).rejets).toBeLessThan(
      simuler(HABITUDE, 3).rejets / 2,
    );
  });

  it("un canal mal protégé expose à un incident ; le canal reconnu jamais", () => {
    const serveur = [...MEILLEUR];
    serveur[D.securite] = O.securite.serveur;
    const n = GRAINES_DU_BILAN.filter((g) =>
      incidentDeSecurite(serveur, g),
    ).length;
    expect(n).toBeGreaterThan(3);
    expect(GRAINES_DU_BILAN.some((g) => incidentDeSecurite(MEILLEUR, g))).toBe(
      false,
    );
  });

  it("un PDF n'est pas une facture électronique : refusé à partir de la semaine 9", () => {
    const pdf = [...MEILLEUR];
    pdf[D.facture] = O.facture.pdf;
    expect(simuler(pdf, 4).facturesRefusees).toBeGreaterThan(100);
    expect(simuler(MEILLEUR, 4).facturesRefusees).toBe(0);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : relier le logiciel à l'EDI bat la ressaisie, l'écran web et la dérogation", () => {
    expect(classement(MEILLEUR, D.reception)[0]).toBe(O.reception.relier);
    expect(ecart(MEILLEUR, D.reception, O.reception.ecranWeb)).toBeGreaterThan(
      3000,
    );
  });

  it("D2 : mettre les fiches au standard bat corriger chaque rejet", () => {
    const c = classement(MEILLEUR, D.rejets);
    expect(c[0]).toBe(O.rejets.fiches);
    expect(c.at(-1)).toBe(O.rejets.pdf);
  });

  it("D3 : le canal sécurisé reconnu bat le serveur partagé et le chiffrement maison", () => {
    expect(classement(MEILLEUR, D.securite)[0]).toBe(O.securite.canalReconnu);
    expect(
      ecart(MEILLEUR, D.securite, O.securite.chiffrementMaison),
    ).toBeGreaterThan(3000);
  });

  it("D4 : la plateforme agréée bat le PDF, le portail et le papier", () => {
    expect(classement(MEILLEUR, D.facture)[0]).toBe(O.facture.plateforme);
  });

  it("D5 : le standard partagé avec le transporteur bat le papier et le tableur maison", () => {
    const c = classement(MEILLEUR, D.transport);
    expect(c[0]).toBe(O.transport.standard);
    expect(c.at(-1)).toBe(O.transport.papier);
  });

  it("D6 : raccorder d'abord les gros volumes bat tout raccorder ou chacun son format", () => {
    const c = classement(MEILLEUR, D.clients);
    expect(c[0]).toBe(O.clients.parVolume);
    expect(c.at(-1)).toBe(O.clients.tous);
  });

  it("un langage commun bat le moins cher tout de suite et l'habitude, en moyenne", () => {
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
      ["erreurs", "cahier"],
      ["rejets", "guide"],
      ["risques", "partenaires"],
      ["reforme"],
      ["quai", "transporteur"],
      ["cout"],
    ],
    jours: JOURS,
    diagnostic: "ressaisie",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 126,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_EDI, partie(MEILLEUR, { graine }));
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
        analyser(EPISODE_EDI, partie(chemin)).decisions[d]!.bonne,
        `D${d + 1}`,
      ).toBe(false);
    });
  });

  it("à qui a décidé sans rien vérifier, propose de commencer par s'informer", () => {
    const p = partie(MEILLEUR, {
      consultes: [[], [], [], [], [], []],
      jours: 0,
    });
    const c = EPISODE_EDI.comportements(p, analyser(EPISODE_EDI, p).trimestre);
    expect(c[0]!.score).toBe(0);
    expect(EPISODE_EDI.axe(c).titre).toBe(AXE_SANS_INFORMATION);
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
      erreurs: "1 %",
      rejets: "1",
      palettes: "1",
      factures: "1",
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
    textes.push(EPISODE_EDI.persona, EPISODE_EDI.resume, EPISODE_EDI.jugement);
    for (const t of textes) expect(t, t).not.toMatch(/\s[–—]\s/);
  });
});
