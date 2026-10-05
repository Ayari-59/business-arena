import { describe, expect, it } from "vitest";
import {
  ANCIENNES,
  CONTRAT_SAISON,
  COUT_TOTAL_ACHAT_MP,
  COUT_TOTAL_CREDIT_BAIL,
  COUT_TOTAL_LLD_MP,
  COUT_TOTAL_LLD_NA,
  CREDIT_BAIL,
  D,
  DECOTE_QUASI_NEUVE,
  EMPRUNT,
  GANIVET,
  IMPREVUS,
  INTERETS_MP,
  LLD_NA,
  LLD_TT,
  MENSUALITE_MP,
  MP,
  NA,
  PARTENAIRE,
  RALENTISSEMENT,
  SEUIL_EMPLOI,
  SEUIL_JOURS_PAR_MOIS,
  TAUX_CREDIT_BAIL,
  TT,
  hasard,
  phase2Reportee,
  simuler,
  tableauDeBord,
} from "../../src/engine/episodes/louer-ou-acheter";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/louer-ou-acheter";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_LOUER_ACHETER } from "../../src/pedagogy/episodes/louer-ou-acheter";
import type { PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Louer ou acheter » enseigne trois choses : une machine se
 * compare en coût total sur la même durée — prix, moins revente, plus
 * intérêts et entretien — et ne se possède qu'au-delà d'un certain taux
 * d'utilisation ; face à une demande incertaine, l'achat est moins cher en
 * moyenne mais fragile, la location se rend ; et une machine amortie n'est
 * pas gratuite. Ces tests verrouillent les chiffres que les sources donnent
 * et les classements qui font la leçon.
 */

const MEILLEUR = [1, 0, 0, 0, 2, 0];
const REFLEXE = [0, 1, 2, 1, 0, 2];
const ATTENTISTE = [3, 3, 3, 2, 3, 2];
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
/** Un montant comme les sources l'écrivent : « 1 345 € ». */
const eu = (v: number) => `${Math.round(v).toLocaleString("fr-FR").replace(/\s/g, " ")} €`;
const source = (etape: number, id: string) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat({});
};

describe("les chiffres que donnent les sources", () => {
  it("l'offre de la semaine 1 : la mensualité, les intérêts et le coût total de l'achat se recalculent", () => {
    const offres = source(0, "offres");
    // 45 000 € sur 36 mois à 4,8 % : une mensualité de 1 345 €.
    expect(Math.round(MENSUALITE_MP)).toBe(1345);
    for (const v of [MP.prix, MENSUALITE_MP, MP.entretien, MP.revente, MP.lld]) {
      expect(offres).toContain(eu(v));
    }
    expect(offres).toContain(`${EMPRUNT.mois} mois à 4,8 %`);
    // 36 mensualités moins le capital : 3 408 € d'intérêts.
    expect(Math.round(INTERETS_MP)).toBe(3408);
    // Prix, moins revente, plus intérêts, plus trois ans d'entretien : 33,6 k€.
    expect(COUT_TOTAL_ACHAT_MP).toBeCloseTo(
      MP.prix - MP.revente + (36 * MENSUALITE_MP - MP.prix) + 3 * MP.entretien,
      6,
    );
    expect(COUT_TOTAL_ACHAT_MP / 1000).toBeCloseTo(33.6, 1);
    expect(EPISODE_LOUER_ACHETER.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(33.6, 1);
    // La LLD coûte 46 440 € sur la même durée, sans rien à revendre.
    expect(COUT_TOTAL_LLD_MP).toBe(46440);
  });

  it("le planning donne le seuil : huit jours par mois environ, au tarif du partenaire", () => {
    const planning = source(0, "planning");
    for (const v of [PARTENAIRE.mp.hors, PARTENAIRE.mp.saison, MP.tarif]) {
      expect(planning).toContain(eu(v));
    }
    // 33 608 € sur 36 mois, soit 934 € par mois, à 115 € la journée : 8,1 jours.
    expect(SEUIL_JOURS_PAR_MOIS).toBeCloseTo(COUT_TOTAL_ACHAT_MP / 36 / 115, 6);
    expect(SEUIL_JOURS_PAR_MOIS).toBeGreaterThan(7.5);
    expect(SEUIL_JOURS_PAR_MOIS).toBeLessThan(8.5);
    // La courbe trace ce seuil, en part des 21 jours ouvrés d'un mois.
    expect(EPISODE_LOUER_ACHETER.courbe.cible).toBeCloseTo(0.39, 2);
  });

  it("le carnet d'entretien des anciennes : douze pannes par an, 4 800 € en moyenne", () => {
    const carnet = source(0, "carnet");
    expect(carnet).toContain("Douze pannes");
    expect(ANCIENNES.risque * 52 * ANCIENNES.nombre).toBeCloseTo(12, 0);
    expect((ANCIENNES.reparationMin + ANCIENNES.reparationMax) / 2).toBe(4800);
    expect(carnet).toContain(eu(ANCIENNES.entretien));
  });

  it("les nacelles d'Elvatec : le crédit-bail coûte un emprunt, la LLD bien plus sur trois ans", () => {
    const offres = source(1, "offres-nacelles");
    for (const v of [
      NA.prix,
      NA.revente,
      NA.entretien,
      CREDIT_BAIL.loyer,
      CREDIT_BAIL.option,
      LLD_NA,
    ]) {
      expect(offres).toContain(eu(v));
    }
    // 36 × 830 € + 280 € + 3 × 1 200 € − 11 200 € = 22 560 € ; 36 × 920 € = 33 120 €.
    expect(COUT_TOTAL_CREDIT_BAIL).toBe(22560);
    expect(COUT_TOTAL_LLD_NA).toBe(33120);
    // Le taux implicite du crédit-bail est celui de l'emprunt, à un dixième de point près.
    expect(Math.abs(TAUX_CREDIT_BAIL - EMPRUNT.taux)).toBeLessThan(0.001);
  });

  it("le chantier de Ganivet et le marché de l'occasion : les probabilités et les décotes dites", () => {
    const tt = source(2, "tout-terrain");
    for (const v of [TT.prix, TT.revente, TT.entretien, TT.fraisRevente, LLD_TT]) {
      expect(tt).toContain(eu(v));
    }
    expect(tt).toContain(`${Math.round(DECOTE_QUASI_NEUVE * 100)} %`);
    // « Une dizaine de points de moins » quand les loueurs déstockent.
    expect(DECOTE_QUASI_NEUVE * (1 - RALENTISSEMENT.occasion) * 100).toBeCloseTo(10, 0);
    // « Une phase sur sept », « deux sur cinq » l'année où les ventes calent.
    expect(GANIVET.chanceReport.normale).toBeCloseTo(1 / 7, 1);
    expect(GANIVET.chanceReport.ralentie).toBe(2 / 5);
    // La fédération : une chance sur trois, une demande divisée par deux, 4 jours sur 10.
    expect(RALENTISSEMENT.chance).toBeCloseTo(1 / 3, 1);
    expect(RALENTISSEMENT.mp).toBe(0.5);
    expect(SEUIL_EMPLOI / 15).toBe(0.4);
  });

  it("le contrat de saison du partenaire dit son prix et son minimum", () => {
    const texte = ETAPES[D.saison]!.messages({})[0]!.texte;
    expect(texte).toContain(eu(PARTENAIRE.mp.saison));
    expect(texte).toContain(`${CONTRAT_SAISON.minimum} journées`);
    expect(CONTRAT_SAISON.prix).toBe(PARTENAIRE.mp.hors);
  });
});

describe("le modèle d'Arvel Location", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).semaines[1]!.demandeMP).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.demandeMP,
      6,
    );
    expect(simuler(MEILLEUR, 12).ralentissement).toBe(simuler(ATTENTISTE, 12).ralentissement);
    expect(simuler(MEILLEUR, 12).phase2Reportee).toBe(simuler(REFLEXE, 12).phase2Reportee);
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

  it("la saison se retourne environ une fois sur trois, et Ganivet reporte plus souvent quand elle se retourne", () => {
    const ralentis = GRAINES_DU_BILAN.filter((g) => hasard(g).ralentissement);
    expect(ralentis.length / 30).toBeGreaterThan(0.2);
    expect(ralentis.length / 30).toBeLessThan(0.5);
    const part = (gs: number[]) => gs.filter(phase2Reportee).length / gs.length;
    const normales = GRAINES_DU_BILAN.filter((g) => !hasard(g).ralentissement);
    expect(part(ralentis)).toBeGreaterThan(part(normales));
  });

  it("acheter pour un chantier reporté laisse des machines sans emploi, ramenées à leur valeur de revente", () => {
    const reportes = GRAINES_DU_BILAN.filter(phase2Reportee);
    expect(reportes.length).toBeGreaterThan(3);
    for (const g of reportes) {
      const achat = simuler(MEILLEUR, g);
      const location = simuler([1, 0, 1, 0, 2, 0], g);
      expect(achat.excedentairesNA).toBeGreaterThanOrEqual(3);
      expect(achat.valeurDuParc).toBeGreaterThan(10000);
      expect(location.valeurDuParc).toBe(0);
    }
  });

  it("les anciennes mini-pelles tombent en panne et font partir un client ; le parc neuf, non", () => {
    const vieux = GRAINES_DU_BILAN.map((g) => simuler(ATTENTISTE, g));
    const neufs = GRAINES_DU_BILAN.map((g) => simuler(MEILLEUR, g));
    expect(moyenne(vieux.map((t) => t.reparations))).toBeGreaterThan(12000);
    expect(vieux.filter((t) => t.clientParti).length).toBeGreaterThan(5);
    expect(neufs.filter((t) => t.clientParti).length).toBe(0);
    for (const t of neufs) expect(t.pannes.every((p) => p.semaine <= 2)).toBe(true);
  });

  it("le tableau de bord part de la situation de janvier, puis suit les décisions prises", () => {
    expect(tableauDeBord([], 4, 0, 0).flotteMP).toBe(ANCIENNES.nombre);
    expect(tableauDeBord([0], 4, 0, 4).flotteMP).toBe(6);
    expect(tableauDeBord([1], 4, 0, 4).flotteMP).toBe(4);
    const l = EPISODE_LOUER_ACHETER.lire([1, 0], 4, 0, 4);
    for (const ind of EPISODE_LOUER_ACHETER.indicateurs) expect(l[ind.cle]).not.toBeNull();
  });

  it("les indicateurs restent dans des plages réalistes", () => {
    for (const r of REFERENCES) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(r.chemin, g, JOURS);
        expect(t.utilisationMP).toBeGreaterThan(0.3);
        expect(t.utilisationMP).toBeLessThanOrEqual(1);
        expect(Math.abs(t.objectif)).toBeLessThan(150000);
      }
    }
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : posséder le socle et louer la pointe ; six machines achetées ou en LLD coûtent bien plus", () => {
    const r = rejeu(MEILLEUR, D.minipelles);
    expect(classement(MEILLEUR, D.minipelles)[0]).toBe(1);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(10000);
    // Garder les anciennes : moins bien en moyenne, et plus exposé aux pannes.
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(3000);
    expect(r[1]!.p10).toBeGreaterThan(r[3]!.p10);
  });

  it("D2 : pour une demande sûre, le crédit-bail ; la location à la journée coûte le plus cher", () => {
    const r = rejeu(MEILLEUR, D.elvatec);
    const c = classement(MEILLEUR, D.elvatec);
    expect(c[0]).toBe(0);
    expect(c[1]).toBe(2);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
  });

  it("D3 : acheter est le meilleur pari en moyenne, louer le plus sûr ; la LLD est le pire des deux", () => {
    const r = rejeu(MEILLEUR, D.ganivet);
    expect(classement(MEILLEUR, D.ganivet)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.ganivet)).toBe(1);
    // La sécurité coûte moins de 3 000 € d'espérance : les deux choix se défendent.
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(500);
    expect(r[0]!.attendu - r[1]!.attendu).toBeLessThan(3000);
    // Dans les mauvais tirages, l'achat perd beaucoup plus.
    expect(r[1]!.p10 - r[0]!.p10).toBeGreaterThan(15000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(2500);
    expect(r[2]!.p10).toBeLessThan(r[0]!.p10);
  });

  it("D4 : le contrat de saison bat l'achat de deux machines ; il ne vaut que si l'on sous-loue", () => {
    const r = rejeu(MEILLEUR, D.saison);
    const c = classement(MEILLEUR, D.saison);
    expect(c[0]).toBe(0);
    expect(c.at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(4000);
    // Avec six mini-pelles achetées en semaine 1, il n'y a presque plus rien à sous-louer :
    // payer au jour le jour devient meilleur que s'engager sur un minimum.
    const sixMachines = [0, 0, 0, 0, 2, 0];
    const r6 = rejeu(sixMachines, D.saison);
    expect(r6[2]!.attendu).toBeGreaterThan(r6[0]!.attendu);
  });

  it("D5 : une machine amortie n'est pas gratuite ; la réparer est le pire choix", () => {
    const r = rejeu(MEILLEUR, D.vieille);
    const c = classement(MEILLEUR, D.vieille);
    expect(c[0]).toBe(2);
    expect(c.at(-1)).toBe(0);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(5000);
  });

  it("D6 : sécuriser l'utilisation avant le retournement est le meilleur choix et le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.cadre);
    expect(classement(MEILLEUR, D.cadre)[0]).toBe(0);
    expect(plusSure(MEILLEUR, D.cadre)).toBe(0);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
  });

  it("aucun réflexe n'est jugé bon sur le meilleur chemin, et la bonne méthode n'en prend aucun", () => {
    for (const [d, o] of REFLEXES) {
      const m = mesurerDecision(EPISODE_LOUER_ACHETER, MEILLEUR, d, JOURS);
      const option = m.options[o]!;
      expect(option.qualite, `D${d + 1} option ${o}`).toBeLessThan(0.7);
      expect(option === m.plusSure && m.meilleure.moyenne - option.moyenne < 3000).toBe(false);
      expect(REFERENCES[0]!.chemin[d]).not.toBe(o);
    }
  });

  it("le coût total et la souplesse battent nettement les mensualités et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(bonne! - reflexe!).toBeGreaterThan(30000);
    expect(bonne! - attentiste!).toBeGreaterThan(15000);
    expect(bonne!).toBeGreaterThan(0);
    expect(attentiste!).toBeLessThan(0);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["offres", "planning"],
      ["offres-nacelles"],
      ["ganivet", "tout-terrain"],
      ["besoins"],
      ["atelier"],
      ["federation"],
    ],
    jours: JOURS,
    diagnostic: "utilisation",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 33.6,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 7, 11, 4242]) {
      const a = analyser(EPISODE_LOUER_ACHETER, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi les mensualités et la trésorerie, propose de comparer des coûts totaux", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_LOUER_ACHETER.comportements(p, analyser(EPISODE_LOUER_ACHETER, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_LOUER_ACHETER.axe(c).titre).toBe(
      "Comparer des coûts totaux, pas des mensualités",
    );
  });

  it("à qui a décidé sans enquêter, propose de chiffrer avant de signer", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_LOUER_ACHETER.comportements(p, analyser(EPISODE_LOUER_ACHETER, p).trimestre);
    expect(EPISODE_LOUER_ACHETER.axe(c).titre).toBe("Chiffrer avant de signer");
  });

  it("note le calcul du coût total : juste à 1 k€ près, proche à 3,5 k€", () => {
    const t = simuler(MEILLEUR, 11);
    const note = (prevision: number) =>
      EPISODE_LOUER_ACHETER.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(note(33.6)).toBe(1);
    // Oublier les intérêts : 30,2 k€, proche. Oublier l'entretien ou la revente : faux.
    expect(note(30.2)).toBe(0.6);
    expect(note(26.4)).toBe(0);
    expect(note(55.6)).toBe(0);
  });

  it("dit le résultat en écart au budget, valeur du parc comprise", () => {
    expect(EPISODE_LOUER_ACHETER.bilan.titre(simuler(MEILLEUR, 7))).toMatch(/au-dessus du budget/);
    expect(EPISODE_LOUER_ACHETER.bilan.titre(simuler(ATTENTISTE, 7))).toMatch(/sous le budget/);
  });
});
