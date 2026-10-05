import { describe, expect, it } from "vitest";
import {
  CHARIOTS,
  D,
  FLUX_DU_DOSSIER,
  IMPREVUS,
  MEZZANINE,
  RATTACHEMENT,
  STOCKEUR,
  TAUX,
  VALEUR_GEL,
  WMS,
  annuite,
  delaiDeRecuperation,
  hasard,
  renfortExige,
  simuler,
  tri,
  van,
  vanLithium,
  vanMezzanine,
} from "../../src/engine/episodes/investissement-a-choisir";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/investissement-a-choisir";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import {
  EPISODE_INVESTISSEMENT,
  VAN_DU_STOCKEUR,
  chiffresDeLExtension,
} from "../../src/pedagogy/episodes/investissement-a-choisir";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'investissement à choisir » enseigne trois choses : des
 * projets de tailles et de durées différentes se comparent à la VAN, pas au
 * TRI ni au délai de récupération, et l'enveloppe se remplit avec la
 * combinaison qui crée le plus de valeur ; ce qui est dépensé est dépensé,
 * seuls comptent les flux à venir, différés compris ; les prévisions du
 * fournisseur sont un pari, et garder le choix d'étendre vaut mieux que
 * parier. Ces tests verrouillent les classements qui le disent, et
 * recalculent depuis le modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [1, 2, 2, 0, 2, 0];
const REFLEXE = [0, 0, 0, 1, 1, 2];
const ATTENTISTE = [3, 3, 3, 1, 0, 1];
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_INVESTISSEMENT.contexte(
    EPISODE_INVESTISSEMENT.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};

describe("le modèle des investissements", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[5]!.volumes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[5]!.volumes,
      6,
    );
    expect(simuler(MEILLEUR, 12).rattachement).toBe(simuler(ATTENTISTE, 12).rattachement);
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

  it("le groupe rattache les agences du Nord-Isère environ quatre trimestres sur dix", () => {
    const oui = GRAINES_DU_BILAN.filter((g) => hasard(g).rattachement).length;
    expect(oui / GRAINES_DU_BILAN.length).toBeGreaterThan(RATTACHEMENT.chance - 0.2);
    expect(oui / GRAINES_DU_BILAN.length).toBeLessThan(RATTACHEMENT.chance + 0.2);
  });

  it("ne rien lancer ne crée ni ne détruit rien ; la valeur de la semaine 13 est l'objectif", () => {
    for (const g of GRAINES_DU_BILAN) expect(simuler(ATTENTISTE, g, 0).objectif).toBeCloseTo(0, 6);
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
    expect(t.semaines[1]!.valeur).toBe(0);
  });

  it("le renfort de la mezzanine ne tombe que sur qui la termine, environ une fois sur deux", () => {
    const termine = [1, 2, 0, 0, 2, 0];
    const renforts = GRAINES_DU_BILAN.filter((g) => renfortExige(termine, g)).length;
    expect(renforts).toBeGreaterThan(8);
    expect(renforts).toBeLessThan(22);
    expect(GRAINES_DU_BILAN.some((g) => renfortExige(MEILLEUR, g))).toBe(false);
  });

  it("la bonne méthode atteint en moyenne l'objectif de valeur ; le réflexe n'en crée presque pas", () => {
    const bon = attendu(MEILLEUR);
    expect(bon).toBeGreaterThan(150000);
    expect(bon).toBeLessThan(300000);
    expect(attendu(REFLEXE)).toBeLessThan(50000);
    expect(attendu(REFLEXE)).toBeGreaterThan(-100000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la VAN du stockeur, que la semaine 1 demande, se pose avec le stock et la valeur résiduelle", () => {
    const aLaMain =
      -STOCKEUR.investissement -
      STOCKEUR.bfr +
      (STOCKEUR.gains[0]! - STOCKEUR.maintenance) * annuite(10, TAUX) +
      (STOCKEUR.residuelle + STOCKEUR.bfr) / (1 + TAUX) ** 10;
    expect(VAN_DU_STOCKEUR).toBeCloseTo(aLaMain, 6);
    expect(VAN_DU_STOCKEUR / 1000).toBeCloseTo(137.7, 1);
    expect(EPISODE_INVESTISSEMENT.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(137.7, 1);
    const texte = source(0, "dossiers", []);
    expect(texte).toContain(`${STOCKEUR.investissement / 1000} k€ d'investissement`);
    expect(texte).toContain(`${STOCKEUR.bfr / 1000} k€ de stock`);
    expect(texte).toContain(
      `${(STOCKEUR.gains[0]! - STOCKEUR.maintenance) / 1000} k€ de flux nets`,
    );
    expect(texte).toContain(`${STOCKEUR.residuelle / 1000} k€ au bout de dix ans`);
  });

  it("la VAN, le TRI et le délai de récupération des chariots et du WMS sont ceux du dossier affiché", () => {
    const texte = source(0, "dossiers", []);
    const chariots = FLUX_DU_DOSSIER.chariots;
    const wms = FLUX_DU_DOSSIER.wms;
    expect(k(van(chariots, TAUX))).toBe(59);
    expect(Math.round(tri(chariots) * 100)).toBe(21);
    expect(delaiDeRecuperation(chariots)!.toFixed(1)).toBe("2.9");
    expect(texte).toContain("VAN à 8 % : 59 k€, TRI : 21 %, délai de récupération : 2,9 ans");
    expect(k(van(wms, TAUX))).toBe(57);
    expect(Math.round(tri(wms) * 100)).toBe(14);
    expect(Math.floor(delaiDeRecuperation(wms)! * 10) / 10).toBe(3.9);
    expect(texte).toContain("VAN à 8 % : 57 k€, TRI : 14 %, délai de récupération : 3,9 ans");
    expect(texte).toContain(`${CHARIOTS.renouvellement / 1000} k€`);
  });

  it("le piège : le stockeur a le pire TRI et le pire délai, mais la meilleure VAN, et la meilleure combinaison", () => {
    const [a, b, c] = [FLUX_DU_DOSSIER.stockeur, FLUX_DU_DOSSIER.chariots, FLUX_DU_DOSSIER.wms];
    expect(tri(a)).toBeLessThan(tri(c));
    expect(tri(c)).toBeLessThan(tri(b));
    expect(delaiDeRecuperation(a)!).toBeGreaterThan(delaiDeRecuperation(c)!);
    expect(delaiDeRecuperation(c)!).toBeGreaterThan(delaiDeRecuperation(b)!);
    expect(van(a, TAUX)).toBeGreaterThan(van(c, TAUX) + 50000);
    // L'enveloppe tient le stockeur et les chariots, pas le stockeur et le WMS.
    expect(STOCKEUR.investissement + CHARIOTS.investissement).toBeLessThanOrEqual(700000);
    expect(STOCKEUR.investissement + WMS.investissement).toBeGreaterThan(700000);
  });

  it("la sensibilité de l'extension au rattachement est celle que la source affiche", () => {
    const c = chiffresDeLExtension(STOCKEUR, false);
    expect(k(c.aLaSignature.siOui)).toBe(54);
    expect(k(c.aLaSignature.siNon)).toBe(-90);
    expect(c.aLaSignature.esperance).toBeCloseTo(
      RATTACHEMENT.chance * c.aLaSignature.siOui + (1 - RATTACHEMENT.chance) * c.aLaSignature.siNon,
      6,
    );
    const texte = source(1, "sensibilite", [1]);
    expect(texte).toContain(`elle crée ${k(c.aLaSignature.siOui)} k€ de VAN`);
    expect(texte).toContain(`elle en détruit ${-k(c.aLaSignature.siNon)} k€`);
    expect(texte).toContain(`−${-k(c.aLaSignature.esperance)} k€ en espérance`);
    // En semaine 8, avec la clause : attendre la décision du groupe vaut l'extension si oui, rien sinon.
    const avecClause = chiffresDeLExtension(STOCKEUR, true);
    const seuil = source(4, "seuil", [1, 2, 2, 0]);
    expect(seuil).toContain(`soit +${k(avecClause.attente.esperance)} k€ en espérance`);
    expect(seuil).toContain(`soit −${-k(avecClause.maintenant.esperance)} k€ en espérance`);
  });

  it("le lithium, plus cher à l'achat, crée de la valeur sur la vie des chariots", () => {
    const aLaMain =
      -CHARIOTS.lithium.surcout +
      CHARIOTS.lithium.economies * annuite(6, TAUX) +
      CHARIOTS.renouvellement / (1 + TAUX) ** 4 +
      CHARIOTS.lithium.residuelle / (1 + TAUX) ** 6;
    expect(vanLithium(TAUX)).toBeCloseTo(aLaMain, 6);
    expect(k(vanLithium(TAUX))).toBe(16);
    expect(source(3, "batteries", [1, 2, 2])).toContain(
      `Le lithium (${(CHARIOTS.plomb + CHARIOTS.lithium.surcout) / 1000} k€)`,
    );
  });

  it("finir la mezzanine coûte plus que la revendre, et plus encore avec le stockeur", () => {
    const o = { taux: TAUX, rattachement: false, renfort: false, offre: 30000 };
    const finie = vanMezzanine(0, { ...o, stockeur: false });
    const avecStockeur = vanMezzanine(0, { ...o, stockeur: true });
    expect(finie).toBeCloseTo(-MEZZANINE.reste + MEZZANINE.flux * annuite(10, TAUX), 6);
    expect(avecStockeur).toBeCloseTo(
      -MEZZANINE.reste + MEZZANINE.fluxAvecStockeur * annuite(10, TAUX),
      6,
    );
    expect(vanMezzanine(2, { ...o, stockeur: true })).toBe(30000 - MEZZANINE.demontage);
    expect(VALEUR_GEL).toBe(18500);
    expect(source(2, "rapport", [1, 2])).toContain("4 k€ seulement avec le stockeur");
    expect(source(2, "rapport", [0, 2])).not.toContain("avec le stockeur");
  });

  it("le prépaiement de la maintenance coûte plus que cinq annuités actualisées", () => {
    expect(STOCKEUR.maintenance * annuite(5, TAUX)).toBeLessThan(STOCKEUR.contrat.prepaye);
    expect(WMS.maintenance * annuite(5, TAUX)).toBeLessThan(WMS.contrat.prepaye);
    expect(STOCKEUR.contrat.prepaye).toBeCloseTo(0.85 * 5 * STOCKEUR.maintenance, 6);
    expect(WMS.contrat.prepaye).toBeCloseTo(0.85 * 5 * WMS.maintenance, 6);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : le stockeur et les chariots créent le plus de valeur ; les deux meilleurs TRI, nettement moins", () => {
    const r = rejeu(MEILLEUR, D.portefeuille);
    expect(classement(MEILLEUR, D.portefeuille)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(40000);
  });

  it("D2 : la clause d'extension est la meilleure en moyenne, la garantie la plus sûre, la version étendue la pire", () => {
    const r = rejeu(MEILLEUR, D.fournisseur);
    const c = classement(MEILLEUR, D.fournisseur);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.fournisseur)).toBe(1);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(2000);
  });

  it("D3 : arrêter la mezzanine et revendre bat la terminer, d'autant plus que le stockeur est lancé", () => {
    expect(classement(MEILLEUR, D.mezzanine)[0]).toBe(2);
    expect(classement(MEILLEUR, D.mezzanine).at(-1)).toBe(0);
    const ecart = (c: readonly number[]) => {
      const r = rejeu(c, D.mezzanine);
      return r[2]!.attendu - r[0]!.attendu;
    };
    expect(ecart(MEILLEUR)).toBeGreaterThan(ecart([0, 2, 2, 0, 2, 0]) + 30000);
  });

  it("D4 : le lithium bat le plomb du dossier, qu'il faudra renouveler, et le report", () => {
    const r = rejeu(MEILLEUR, D.batteries);
    expect(classement(MEILLEUR, D.batteries)).toEqual([0, 1, 2]);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
  });

  it("D5 : attendre la décision du groupe bat la commande immédiate, et vaut plus avec la clause", () => {
    const r = rejeu(MEILLEUR, D.extension);
    expect(classement(MEILLEUR, D.extension)[0]).toBe(2);
    expect(classement(MEILLEUR, D.extension).at(-1)).toBe(1);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    const gain = (c: readonly number[]) => {
      const x = rejeu(c, D.extension);
      return x[2]!.attendu - x[0]!.attendu;
    };
    expect(gain(MEILLEUR)).toBeGreaterThan(gain([1, 3, 2, 0, 2, 0]) + 3000);
  });

  it("D6 : le contrat annuel bat le prépaiement, qui oublie l'actualisation, et l'absence de contrat", () => {
    const r = rejeu(MEILLEUR, D.maintenance);
    expect(classement(MEILLEUR, D.maintenance)[0]).toBe(0);
    expect(classement(MEILLEUR, D.maintenance).at(-1)).toBe(2);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
  });

  it("la valeur avant le délai bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(150000);
    expect(bonne! - attentiste!).toBeGreaterThan(150000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_INVESTISSEMENT, MEILLEUR, d, JOURS);
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
      ["dossiers", "regles"],
      ["sensibilite"],
      ["rapport"],
      ["batteries"],
      ["seuil"],
      ["actualiser"],
    ],
    jours: JOURS,
    diagnostic: "van",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 138,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_INVESTISSEMENT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de juger en euros", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_INVESTISSEMENT.comportements(
      p,
      analyser(EPISODE_INVESTISSEMENT, p).trimestre,
    );
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INVESTISSEMENT.axe(c).titre).toBe(
      "Juger en euros, pas en pourcentage ni en années",
    );
  });

  it("à qui a décidé sans enquêter, propose de refaire le calcul avant de classer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_INVESTISSEMENT.comportements(
      p,
      analyser(EPISODE_INVESTISSEMENT, p).trimestre,
    );
    expect(EPISODE_INVESTISSEMENT.axe(c).titre).toBe("Refaire le calcul avant de classer");
  });

  it("juge la VAN calculée en semaine 1 : juste, proche, ou faute d'avoir compté le stock récupéré", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_INVESTISSEMENT.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(138)).toBe(1);
    expect(score(150)).toBe(0.6);
    // Sans récupérer le stock la dixième année : 137,7 − 80 / 1,08¹⁰ ≈ 100,6 k€.
    expect(score(101)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    expect(EPISODE_INVESTISSEMENT.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(/valeur créée/);
    expect(EPISODE_INVESTISSEMENT.bilan.titre(simuler(REFLEXE, 11))).toMatch(/valeur détruite/);
  });
});
