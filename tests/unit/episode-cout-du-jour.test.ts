import { describe, expect, it } from "vitest";
import {
  ACCORD,
  ARMORINE,
  CHARGES_STRUCTURE,
  CONSULTANTS,
  COUT_JOUR,
  COUT_JOUR_GRILLE,
  COUT_MARGINAL_MISSION,
  D,
  DEPASSEMENT,
  FACTURABLES,
  GRADES,
  IMPREVUS,
  JOURS_MISSION,
  JOURS_TRAVAILLES,
  MARGE_AFFICHEE,
  MARGE_REELLE_2024,
  MISSION,
  PLANCHER,
  PRIX_ACTUEL,
  QUOTE_PART,
  QUOTE_PART_GRILLE,
  SALAIRE_CHARGE,
  TEMPS,
  VALMORIN,
  attribution,
  coutComplet,
  coutEquipe,
  coutGrille,
  hasard,
  simuler,
  sousEstimation,
} from "../../src/engine/episodes/forfait-trop-bas";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import {
  COUT_VALMORIN,
  ETAPES,
  PERTE_ARMORINE_2024,
  REFERENCES,
  REFLEXES,
  pourcent,
} from "../../src/config/episodes/forfait-trop-bas";
import { euros, nombre } from "../../src/config/episodes/format";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_COUT_DU_JOUR } from "../../src/pedagogy/episodes/forfait-trop-bas";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « Le forfait vendu sous son coût » enseigne qu'une journée vendue
 * doit payer aussi les jours qu'un consultant ne facture pas, et la structure
 * autour de lui : le coût de revient d'une journée facturable se calcule sur
 * les jours réellement facturables, pas sur les 218 jours du forfait annuel.
 * Puis qu'il faut le bon coût à la bonne question : le coût complet pour le
 * prix plancher durable, le coût marginal pour une mission qui n'occupe que de
 * l'intercontrat certain, et la pyramide de l'équipe autant que le TJM. Ces
 * tests verrouillent les classements qui le disent, et la cohérence des
 * chiffres que les sources donnent avec le modèle.
 */

const MEILLEUR = [2, 0, 3, 2, 2, 1];
const REFLEXE = [0, 1, 1, 0, 0, 0];
const ATTENTISTE = [3, 2, 0, 0, 3, 0];
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
const source = (etape: number, id: string, ctx: Contexte = {}) => {
  const r = ETAPES[etape]!.sources.find((s) => s.id === id)!.resultat;
  return typeof r === "string" ? r : r(ctx);
};

describe("le modèle du chiffrage des forfaits", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(simuler(MEILLEUR, 12).semaines[1]!.margeSemaine).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[1]!.margeSemaine,
      6,
    );
    // Le même tirage décide de chaque proposition, quel que soit le prix proposé.
    expect(hasard(12).propositions.map((p) => p.u)).toEqual(
      hasard(12).propositions.map((p) => p.u),
    );
    expect(attribution(MEILLEUR, 5)!.keroual).toBeCloseTo(attribution(REFLEXE, 5)!.keroual, 6);
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

  it("la grille de 2019 sous-estime le coût d'une journée de 25 à 40 % selon le grade", () => {
    for (const g of GRADES) {
      expect(sousEstimation(g)).toBeGreaterThan(0.25);
      expect(sousEstimation(g)).toBeLessThan(0.4);
    }
  });

  it("le comité de Valmorin ne tombe qu'avec la pyramide franche, et pas toujours", () => {
    const tombe = GRAINES_DU_BILAN.filter((g) => simuler(MEILLEUR, g).comite).length;
    expect(tombe).toBeGreaterThan(3);
    expect(tombe).toBeLessThan(20);
    const prudente = [...MEILLEUR];
    prudente[D.pyramide] = 1;
    expect(GRAINES_DU_BILAN.some((g) => simuler(prudente, g).comite)).toBe(false);
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("la grille : salaire chargé plus quote-part de 2019, divisés par 218 jours", () => {
    expect(JOURS_TRAVAILLES).toBe(218);
    expect(coutGrille("senior")).toBeCloseTo((96000 + 24000) / 218, 6);
    const grille = source(0, "grille");
    expect(grille).toContain(`${euros(QUOTE_PART_GRILLE)} de quote-part`);
    for (const g of GRADES) {
      expect(grille).toContain(`${euros(SALAIRE_CHARGE[g])} chargés → ${euros(coutGrille(g))}`);
    }
    expect(grille).toContain(pourcent(1 - coutGrille("senior") / 950));
  });

  it("Tempora et les comptes : 160 jours facturables, 36 000 € de structure, 825 € le jour", () => {
    const t = TEMPS.senior;
    expect(
      JOURS_TRAVAILLES - t.absences - t.formation - t.avantVente - t.intercontrat - t.interne,
    ).toBe(FACTURABLES.senior);
    expect(FACTURABLES.senior).toBe(160);
    expect(source(0, "tempora")).toContain(`consultant senior : ${FACTURABLES.senior} jours`);
    expect(QUOTE_PART).toBe(CHARGES_STRUCTURE / CONSULTANTS);
    expect(QUOTE_PART).toBe(36000);
    expect(source(0, "comptes")).toContain(`${euros(QUOTE_PART)} par consultant`);
    // La prévision de la semaine 1 se calcule depuis ces trois sources.
    expect(coutComplet("senior")).toBe((SALAIRE_CHARGE.senior + QUOTE_PART) / FACTURABLES.senior);
    expect(EPISODE_COUT_DU_JOUR.prevision.reel(simuler(MEILLEUR, 1))).toBe(825);
  });

  it("38 % affichés à la vente, −3 % à la clôture : la grille et le dépassement l'expliquent", () => {
    expect(MARGE_AFFICHEE).toBeCloseTo(1 - COUT_JOUR_GRILLE / PRIX_ACTUEL, 9);
    expect(Math.round(MARGE_AFFICHEE * 100)).toBe(38);
    expect(MARGE_REELLE_2024).toBeCloseTo(1 - (COUT_JOUR * (1 + DEPASSEMENT)) / PRIX_ACTUEL, 9);
    expect(Math.round(MARGE_REELLE_2024 * 100)).toBe(-3);
    expect(source(1, "forfaits")).toContain(`${pourcent(MARGE_REELLE_2024)}`);
    expect(source(1, "pertes", { grilleCorrigee: true })).toContain(euros(COUT_JOUR));
    expect(PLANCHER).toBeCloseTo(COUT_JOUR * (1 + DEPASSEMENT), 9);
  });

  it("la mission d'intercontrat : son coût complet, et ce qu'elle ajoute vraiment", () => {
    expect(JOURS_MISSION).toBe(72);
    const complet = JOURS_MISSION * coutComplet("analyste") + 6 * coutComplet("senior");
    expect(source(2, "chiffrage")).toContain(euros(complet));
    expect(COUT_MARGINAL_MISSION).toBe(JOURS_MISSION * MISSION.frais + 6 * coutComplet("senior"));
    expect(MISSION.prix).toBeLessThan(complet);
    expect(MISSION.prix).toBeGreaterThan(COUT_MARGINAL_MISSION);
  });

  it("Valmorin, l'accord-cadre et la mutuelle : coûts d'équipe, notes, perte de l'an dernier", () => {
    expect(COUT_VALMORIN.associe).toBe(80 * 562.5 + 80 * 825 + 80 * 1000);
    expect(source(3, "equipes")).toContain(euros(COUT_VALMORIN.revue));
    expect(COUT_VALMORIN.revue).toBe(coutEquipe(VALMORIN.revue));
    expect(source(4, "reglement")).toContain(
      `en vaut ${nombre((ACCORD.poidsPrix * ACCORD.prixKeroual) / ACCORD.prix.catalogue)}`,
    );
    expect(PERTE_ARMORINE_2024).toBeCloseTo(
      ARMORINE.jours * (coutEquipe(ARMORINE.pyramide) * 1.06 - ARMORINE.prix2024),
      6,
    );
    expect(source(5, "historique")).toContain(euros(PERTE_ARMORINE_2024));
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : recalculer le coût sur les jours facturables bat nettement la baisse de prix", () => {
    const r = rejeu(MEILLEUR, D.grille);
    expect(classement(MEILLEUR, D.grille)[0]).toBe(2);
    expect(classement(MEILLEUR, D.grille).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
    // Provisionner les dépassements aide, mais ne remplace pas le bon coût.
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(5000);
  });

  it("D2 : tenir le prix et trier les consultations ; s'aligner sur Kéroual est le pire", () => {
    const r = rejeu(MEILLEUR, D.pertes);
    expect(classement(MEILLEUR, D.pertes)[0]).toBe(0);
    expect(classement(MEILLEUR, D.pertes).at(-1)).toBe(1);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(3000);
  });

  it("D3 : sur de l'intercontrat certain, le coût marginal suffit ; au-delà, il saute", () => {
    const r = rejeu(MEILLEUR, D.intercontrat);
    expect(classement(MEILLEUR, D.intercontrat)[0]).toBe(3);
    // Refuser « sous le coût complet » est le piège dans l'autre sens.
    expect(classement(MEILLEUR, D.intercontrat).at(-1)).toBe(0);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(25000);
    // Prolonger au-delà de la fenêtre libre coûte des analystes de Freelancia.
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
  });

  it("D4 : la pyramide revue est la meilleure en moyenne, la pyramide prudente la plus sûre", () => {
    const r = rejeu(MEILLEUR, D.pyramide);
    expect(classement(MEILLEUR, D.pyramide)[0]).toBe(2);
    expect(Math.max(...r.map((x) => x.p10))).toBe(r[1]!.p10);
    expect(r[1]!.p10).toBeGreaterThan(r[2]!.p10);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(1000);
    expect(r[2]!.attendu - r[1]!.attendu).toBeLessThan(3000);
    // Baisser les TJM d'une équipe chargée en managers : la pire option.
    expect(classement(MEILLEUR, D.pyramide).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
  });

  it("D5 : le plancher est un plancher, pas une cible ; le tri de la semaine 3 renforce le mémoire", () => {
    const r = rejeu(MEILLEUR, D.accord);
    expect(classement(MEILLEUR, D.accord)[0]).toBe(2);
    expect(classement(MEILLEUR, D.accord).at(-1)).toBe(0);
    expect(r[2]!.attendu - r[1]!.attendu).toBeGreaterThan(5000);
    // L'interaction avec la décision 2 : sans go / no-go, le catalogue rapporte moitié moins.
    const sansTri = [...MEILLEUR];
    sansTri[D.pertes] = 2;
    const s = rejeu(sansTri, D.accord);
    expect(r[2]!.attendu - r[3]!.attendu).toBeGreaterThan(
      2 * (s[2]!.attendu - s[3]!.attendu) - 1000,
    );
  });

  it("D6 : relever le prix d'un client historique bat la reconduction « comme toujours »", () => {
    const r = rejeu(MEILLEUR, D.renouvellement);
    expect(classement(MEILLEUR, D.renouvellement)[0]).toBe(1);
    expect(classement(MEILLEUR, D.renouvellement).at(-1)).toBe(0);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(10000);
    expect(r[1]!.attendu - r[2]!.attendu).toBeGreaterThan(1000);
  });

  it("le coût d'un jour facturable bat nettement la grille de toujours et l'attentisme", () => {
    const [bonne, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(REFERENCES[0].chemin).toEqual(MEILLEUR);
    expect(REFERENCES[1].chemin).toEqual(REFLEXE);
    expect(REFERENCES[2].chemin).toEqual(ATTENTISTE);
    expect(bonne! - reflexe!).toBeGreaterThan(100000);
    expect(bonne! - attentiste!).toBeGreaterThan(60000);
    expect(attentiste!).toBeGreaterThan(reflexe!);
  });

  it("aucune option réflexe n'est jugée bonne sur le meilleur chemin, ni prise par la bonne méthode", () => {
    for (const [d, o] of REFLEXES) {
      const chemin = [...MEILLEUR];
      chemin[d] = o;
      expect(mesurerDecision(EPISODE_COUT_DU_JOUR, chemin, d, JOURS).bonne, `D${d + 1}`).toBe(
        false,
      );
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
    }
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["grille", "tempora", "comptes"],
      ["pertes"],
      ["planning"],
      ["equipes"],
      ["reglement"],
      ["historique"],
    ],
    jours: JOURS,
    diagnostic: "cout",
    reevaluation: { choix: "maintient", principal: null },
    prevision: 825,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_COUT_DU_JOUR, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a suivi la grille de toujours, propose de chiffrer au coût d'une journée facturable", () => {
    const p = partie(REFLEXE, { diagnostic: "prix" });
    const c = EPISODE_COUT_DU_JOUR.comportements(p, analyser(EPISODE_COUT_DU_JOUR, p).trimestre);
    expect(c).toHaveLength(5);
    expect(c[1]!.score).toBe(0);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_COUT_DU_JOUR.axe(c).titre).toBe("Chiffrer au coût d'une journée facturable");
  });

  it("à qui a décidé sans enquêter, propose de compter les jours facturables", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_COUT_DU_JOUR.comportements(p, analyser(EPISODE_COUT_DU_JOUR, p).trimestre);
    expect(EPISODE_COUT_DU_JOUR.axe(c).titre).toBe(
      "Compter les jours qu'un consultant facture vraiment",
    );
  });

  it("à qui a refusé l'intercontrat et baissé les TJM, propose de distinguer les deux coûts", () => {
    const chemin = [...MEILLEUR];
    chemin[D.intercontrat] = 0;
    chemin[D.pyramide] = 3;
    const p = partie(chemin);
    const c = EPISODE_COUT_DU_JOUR.comportements(p, simuler(chemin, 11, JOURS));
    expect(c[4]!.score).toBe(0);
    expect(EPISODE_COUT_DU_JOUR.axe(c).titre).toBe(
      "Le coût complet pour le prix, le coût marginal pour l'intercontrat",
    );
  });

  it("juge le calcul sur les jours facturables, pas celui de la grille ni celui à 218 jours", () => {
    const t = simuler(MEILLEUR, 11, JOURS);
    const score = (prevision: number) =>
      EPISODE_COUT_DU_JOUR.comportements(partie(MEILLEUR, { prevision }), t)[3]!.score;
    expect(score(825)).toBe(1);
    expect(score(800)).toBe(0.6);
    // La grille de 2019, et le coût complet divisé par 218 jours.
    expect(score(Math.round(coutGrille("senior")))).toBe(0);
    expect(score(Math.round((SALAIRE_CHARGE.senior + QUOTE_PART) / JOURS_TRAVAILLES))).toBe(0);
  });

  it("dit le résultat en écart au budget", () => {
    expect(EPISODE_COUT_DU_JOUR.bilan.titre(simuler(MEILLEUR, 11))).toMatch(/au-dessus du budget/);
    expect(EPISODE_COUT_DU_JOUR.bilan.titre(simuler(REFLEXE, 11))).toMatch(/sous le budget/);
  });
});
