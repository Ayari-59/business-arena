import { describe, expect, it } from "vitest";
import {
  D,
  DIRECTEUR,
  EBE_PUBLIE,
  EBE_RETRAITE,
  ETATS,
  IMPREVUS,
  INTEGRATION,
  FRAIS_TRANSACTION,
  MULTIPLE,
  OBJECTIF_VALEUR,
  PERTE_SERAC,
  PLAFOND,
  RETRAITEMENTS,
  STOCK_SURVALUE,
  SYNERGIES,
  VALEUR_SYNERGIES_COUTS,
  VALEUR_SYNERGIES_REVENUS,
  VE_AUTONOME,
  derouler,
  hasard,
  plafondSerac,
  simuler,
} from "../../src/engine/episodes/concurrent-a-racheter";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/concurrent-a-racheter";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision, SEUIL_QUALITE } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_RACHAT, MAX_SERAC } from "../../src/pedagogy/episodes/concurrent-a-racheter";
import { kE } from "../../src/config/episodes/format";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le concurrent à racheter » enseigne trois choses : le prix
 * maximal d'une acquisition se calcule avant de négocier, sur l'EBE retraité
 * et les seules synergies sûres ; surenchérir pour ne pas laisser la cible au
 * concurrent, c'est payer ses synergies au vendeur (la malédiction du
 * vainqueur) ; l'audit coûte, et ne vaut que si l'on révise ensuite l'offre
 * annoncée, ce qui reste incertain se couvrant par des garanties. Ces tests
 * verrouillent les classements qui le disent, et recalculent depuis le
 * modèle les chiffres que les sources affichent.
 */

const MEILLEUR = [0, 0, 1, 2, 1, 1];
const REFLEXE = [2, 2, 0, 0, 0, 0];
const ATTENTISTE = [3, 3, 0, 1, 0, 0];
const JOURS = 2;
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
/** Le texte d'une source, tel que le joueur le lit avec les décisions déjà prises. */
const source = (etape: number, id: string, decisions: readonly number[], graine = 1) => {
  const semaine = etape === 0 ? 0 : ETAPES[etape - 1]!.jusqua;
  const ctx: Contexte = EPISODE_RACHAT.contexte(
    EPISODE_RACHAT.lire(decisions, graine, 0, semaine),
    decisions,
  );
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const graineOu = (etat: string) => GRAINES_DU_BILAN.find((g) => hasard(g).etat === etat)!;

describe("le modèle du rachat", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).etat).toBe(simuler(REFLEXE, 12).etat);
    expect(derouler(MEILLEUR, 12).plafondSerac).toBe(derouler(ATTENTISTE, 12).plafondSerac);
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

  it("chacun des trois scénarios de la cible se produit, à peu près aux fréquences dites", () => {
    for (const etat of ["saine", "stock", "client"] as const) {
      const n = GRAINES_DU_BILAN.filter((g) => hasard(g).etat === etat).length;
      expect(n / GRAINES_DU_BILAN.length, etat).toBeGreaterThan(ETATS[etat] - 0.2);
      expect(n / GRAINES_DU_BILAN.length, etat).toBeLessThan(ETATS[etat] + 0.2);
    }
  });

  it("Sérac surenchérit d'autant moins que l'offre ferme d'Arvel est haute", () => {
    const retraits = (chemin: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => derouler(chemin, g).serac === "retrait").length;
    // Une offre révisée après l'audit le laisse plus souvent dans la vente qu'une offre confirmée.
    expect(retraits([0, 0, 1, 1, 1, 1])).toBeLessThan(retraits([0, 0, 0, 1, 1, 1]));
    expect(retraits([2, 0, 0, 1, 1, 1])).toBe(GRAINES_DU_BILAN.length);
    for (const g of GRAINES_DU_BILAN) {
      expect(plafondSerac(hasard(g))).toBeLessThanOrEqual(MAX_SERAC);
    }
  });

  it("ne pas faire d'offre laisse Mourgue à Sérac, et cela coûte à Arvel", () => {
    for (const g of GRAINES_DU_BILAN) {
      const t = simuler(ATTENTISTE, g, 0);
      expect(t.deroule.achete).toBe(false);
      expect(t.objectif).toBeLessThanOrEqual(-PERTE_SERAC);
      expect(t.objectif).toBeGreaterThan(-PERTE_SERAC - 50000);
    }
    const t = simuler(MEILLEUR, 5, JOURS);
    expect(t.semaines[13]!.valeur).toBe(t.objectif);
  });

  it("le directeur commercial ne part qu'après un rachat, et bien plus souvent sans accord", () => {
    const departs = (chemin: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(chemin, g).directeurParti).length;
    expect(departs([0, 0, 1, 2, 1, 0])).toBeGreaterThan(departs(MEILLEUR) + 5);
    expect(departs(ATTENTISTE)).toBe(0);
  });

  it("la bonne méthode atteint en moyenne l'objectif ; le réflexe détruit de la valeur", () => {
    expect(attendu(MEILLEUR)).toBeGreaterThan(OBJECTIF_VALEUR);
    expect(attendu(MEILLEUR)).toBeLessThan(400000);
    expect(attendu(REFLEXE)).toBeLessThan(-500000);
    expect(attendu(REFLEXE)).toBeGreaterThan(-1500000);
  });
});

describe("les chiffres des sources se recalculent depuis le modèle", () => {
  it("la valeur autonome, que la semaine 1 demande, se pose sur l'EBE retraité", () => {
    expect(EBE_RETRAITE).toBe(
      EBE_PUBLIE + RETRAITEMENTS.chantier + RETRAITEMENTS.remuneration + RETRAITEMENTS.litige,
    );
    expect(EBE_RETRAITE).toBe(1300000);
    expect(VE_AUTONOME).toBe(MULTIPLE * 1300000);
    expect(EPISODE_RACHAT.prevision.reel(simuler(MEILLEUR, 1))).toBe(7150);
    const comptes = source(0, "comptes", []);
    expect(comptes).toContain(`EBE du dernier exercice : ${kE(EBE_PUBLIE)}`);
    expect(comptes).toContain(`${kE(-RETRAITEMENTS.chantier)} de marge`);
    expect(comptes).toContain(`soit ${kE(-RETRAITEMENTS.remuneration)} de charges en plus`);
    expect(comptes).toContain(`${kE(RETRAITEMENTS.litige)} d'honoraires`);
    expect(source(0, "comparables", [])).toContain("médiane 5,5 fois");
  });

  it("les synergies et le prix plafond sont ceux que Mounia et l'offre affichent", () => {
    const texte = source(0, "synergies", []);
    expect(texte).toContain(`soit ${kE(VALEUR_SYNERGIES_COUTS)} de valeur au multiple de 5,5`);
    expect(texte).toContain(`${kE(VALEUR_SYNERGIES_REVENUS)} de valeur`);
    expect(texte).toContain(
      `${kE(INTEGRATION)} ; frais de la transaction : ${kE(FRAIS_TRANSACTION)}`,
    );
    expect(PLAFOND).toBeCloseTo(
      VE_AUTONOME +
        VALEUR_SYNERGIES_COUTS * SYNERGIES.realisationCouts -
        INTEGRATION -
        FRAIS_TRANSACTION,
      6,
    );
    expect(PLAFOND).toBe(7700000);
    expect(ETAPES[0]!.options[0]!.t).toContain("prix plafond de 7,7 M€");
    expect(source(3, "plafond", [0, 0, 0])).toContain(
      `tel que nous l'avons arrêté : ${kE(PLAFOND)}`,
    );
  });

  it("l'audit révise l'offre et le plafond de ce qu'il a chiffré", () => {
    const g = graineOu("stock");
    const texte = source(2, "rapport", [0, 0], g);
    expect(texte).toContain(`${kE(STOCK_SURVALUE)} de références dormantes`);
    expect(texte).toContain(
      `Offre révisée de ce que l'audit a chiffré : ${kE(7200000 - STOCK_SURVALUE)}`,
    );
    expect(texte).toContain(`Prix plafond recalculé : ${kE(PLAFOND - STOCK_SURVALUE)}`);
    const dr = derouler([0, 0, 1, 2, 1, 1], g);
    expect(dr.offreFerme).toBe(7200000 - STOCK_SURVALUE);
    expect(dr.plafond).toBe(PLAFOND - STOCK_SURVALUE);
    // L'audit ciblé ne voit pas les clients ; la data room ne chiffre rien.
    expect(source(2, "rapport", [0, 1], graineOu("client"))).toContain(
      "n'étaient pas dans le périmètre",
    );
    expect(source(2, "rapport", [0, 3], g)).toContain("Sans audit");
  });

  it("la perte si Sérac l'emporte, et le complément pour l'égaler, sont ceux du calcul", () => {
    const texte = source(3, "plafond", MEILLEUR.slice(0, 3));
    expect(texte).toContain(`perdront environ ${kE(PERTE_SERAC)} de valeur`);
    const g = GRAINES_DU_BILAN.find((x) => {
      const dr = derouler(MEILLEUR, x);
      return dr.serac === "surenchere" && dr.annonceSerac! + 50000 > dr.plafond;
    })!;
    const dr = derouler(MEILLEUR, g);
    const complement = Math.round((dr.annonceSerac! + 50000 - dr.plafond) / 0.8 / 10000) * 10000;
    expect(source(3, "plafond", MEILLEUR.slice(0, 3), g)).toContain(
      `un complément de prix de ${kE(complement)}`,
    );
    expect(source(5, "portefeuille", [])).toContain(`${kE(DIRECTEUR.clients)} de valeur`);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : l'offre sur l'EBE retraité, plafond fixé, est la meilleure ; ne pas offrir est la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.offre);
    expect(classement(MEILLEUR, D.offre)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(200000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(300000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(300000);
    // Espérance contre robustesse : ne rien offrir coûte à coup sûr, mais protège du pire tirage.
    expect(plusSure(MEILLEUR, D.offre)).toBe(3);
  });

  it("D2 : l'audit complet bat l'exclusivité sans audit, et ne vaut que si l'on révise ensuite", () => {
    const r = rejeu(MEILLEUR, D.diligence);
    expect(classement(MEILLEUR, D.diligence)[0]).toBe(0);
    expect(classement(MEILLEUR, D.diligence).at(-1)).toBe(2);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(400000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(100000);
    // L'interaction : sans révision de l'offre en semaine 5, l'audit n'est qu'une dépense.
    const valeurDeLAudit = (c: readonly number[]) => {
      const x = rejeu(c, D.diligence);
      return x[0]!.attendu - x[3]!.attendu;
    };
    expect(valeurDeLAudit([0, 0, 0, 2, 1, 1])).toBeLessThan(0);
    expect(valeurDeLAudit(MEILLEUR)).toBeGreaterThan(valeurDeLAudit([0, 0, 0, 2, 1, 1]) + 150000);
  });

  it("D3 : réviser l'offre de ce que l'audit a trouvé bat la défense de l'offre annoncée", () => {
    const r = rejeu(MEILLEUR, D.offreFerme);
    expect(classement(MEILLEUR, D.offreFerme)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(150000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(300000);
  });

  it("D4 : le complément de prix bat le plafond sec, et la surenchère est la pire", () => {
    const r = rejeu(MEILLEUR, D.enchere);
    expect(classement(MEILLEUR, D.enchere)).toEqual([2, 1, 0]);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(15000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(150000);
  });

  it("D5 : la garantie adossée à un séquestre bat celle de la cédante et l'absence de garantie", () => {
    const r = rejeu(MEILLEUR, D.garantie);
    expect(classement(MEILLEUR, D.garantie)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D6 : l'accord de fidélisation, condition du closing, bat la signature sans attendre", () => {
    const r = rejeu(MEILLEUR, D.directeur);
    expect(classement(MEILLEUR, D.directeur)[0]).toBe(1);
    expect(classement(MEILLEUR, D.directeur).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(50000);
  });

  it("le prix avant l'enchère bat le réflexe et l'attentisme, en moyenne", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(800000);
    expect(bonne! - attentiste!).toBeGreaterThan(400000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_RACHAT, MEILLEUR, d, JOURS);
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
      ["comptes", "comparables", "synergies"],
      ["auditeur"],
      ["rapport"],
      ["plafond"],
      ["urssaf"],
      ["portefeuille"],
    ],
    jours: JOURS,
    diagnostic: "prix",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 7150,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_RACHAT, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi tous les réflexes, propose de ne pas payer pour gagner", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_RACHAT.comportements(p, analyser(EPISODE_RACHAT, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_RACHAT.axe(c).titre).toBe("Ne pas payer pour gagner");
  });

  it("à qui a décidé sans enquêter, propose de chiffrer la cible avant d'offrir", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_RACHAT.comportements(p, analyser(EPISODE_RACHAT, p).trimestre);
    expect(EPISODE_RACHAT.axe(c).titre).toBe("Chiffrer la cible avant d'offrir");
  });

  it("juge la valeur calculée en semaine 1 : juste, proche, ou sur l'EBE publié", () => {
    const score = (prevision: number) => {
      const p = partie(MEILLEUR, { prevision });
      return EPISODE_RACHAT.comportements(p, simuler(MEILLEUR, 11, JOURS))[3]!.score;
    };
    expect(score(7150)).toBe(1);
    // Sans réintégrer le litige clos : 5,5 × 1 270 = 6 985 k€.
    expect(score(6985)).toBe(0.6);
    // Sur l'EBE publié, ou en retirant la dette nette : faux.
    expect(score(8250)).toBe(0);
    expect(score(5750)).toBe(0);
  });

  it("dit le résultat en valeur créée, ou détruite", () => {
    const g = GRAINES_DU_BILAN.find((x) => simuler(MEILLEUR, x).objectif > 0)!;
    expect(EPISODE_RACHAT.bilan.titre(simuler(MEILLEUR, g))).toMatch(/valeur créée/);
    expect(EPISODE_RACHAT.bilan.titre(simuler(REFLEXE, 2))).toMatch(/valeur détruite/);
  });
});
