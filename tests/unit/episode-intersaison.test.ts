import { describe, expect, it } from "vitest";
import {
  ACOMPTE_ACTUEL,
  ACOMPTE_TO,
  AUTORISATION,
  BFR_DEPART,
  CALENDRIER_TRAVAUX,
  CREANCE_TO,
  D,
  DETTES_DEPART,
  ECHEANCES,
  FACTURES_HIVER,
  FOURNISSEURS_HIVER,
  FRAIS_ECHEANCIER,
  FRNG_DEPART,
  IMPREVUS,
  INDEMNITE_FORFAITAIRE,
  LIGNE,
  NUITEES_BASSES,
  NUITEES_HAUTES,
  PART_ECHEANCIER,
  POINT_BAS_PLAN,
  POLITIQUES,
  PRIX_PLANCHER,
  PRIX_TO,
  REMISE_VINS,
  RESERVATIONS,
  RESERVATIONS_PAR_SEMAINE,
  SEMAINE_POINT_BAS_PLAN,
  SENSIBILITE,
  SURCOUT_ECHEANCIER_TRAVAUX,
  TOTAL_FOURNISSEURS,
  TOTAL_TRAVAUX,
  TRAVAUX,
  TRESORERIE_DEPART,
  TRESORERIE_DU_PLAN,
  VINS_ETE,
  fluxDuPlan,
  gainBasses,
  hasard,
  perteHautes,
  prevoir,
  simuler,
} from "../../src/engine/episodes/intersaison";
import { GRAINES_DU_BILAN, moyenne, rejouerAvec } from "../../src/engine/episodes/commun";
import { ETAPES, REFERENCES, REFLEXES } from "../../src/config/episodes/intersaison";
import { analyser } from "../../src/pedagogy/episodes/bilan";
import { mesurerDecision } from "../../src/pedagogy/episodes/mesures";
import { EPISODE_INTERSAISON } from "../../src/pedagogy/episodes/intersaison";
import type { Contexte, PartieJouee } from "../../src/config/episodes/types";

/**
 * L'épisode « L'intersaison qui assèche la caisse » enseigne qu'une
 * entreprise saisonnière finance son creux par un plan de trésorerie et un
 * financement adapté au cycle — une ligne saisonnière négociée en avril, des
 * acomptes là où la demande déborde, un échéancier signé d'avance — et non en
 * sacrifiant ce qui fera la saison suivante : travaux reportés, fournisseurs
 * étalés « au feeling », hiver prochain vendu au rabais. Ces tests verrouillent
 * les classements qui le disent, et les chiffres que les sources donnent.
 */

const MEILLEUR = [0, 3, 0, 3, 0, 1];
const REFLEXE = [1, 1, 1, 1, 1, 0];
const ATTENTISTE = [1, 0, 0, 0, 1, 2];
/** Le même chemin, sans ligne saisonnière en avril. */
const SANS_LIGNE = [1, 3, 0, 3, 0, 1];
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
const plusSure = (chemin: readonly number[], d: number) =>
  rejeu(chemin, d).reduce((x, o) => (o.p10 > x.p10 ? o : x)).option;
const texte = (etape: number, id: string, ctx: Contexte = {}) => {
  const s = ETAPES[etape]!.sources.find((x) => x.id === id)!;
  return typeof s.resultat === "string" ? s.resultat : s.resultat(ctx);
};
const k = (v: number) => `${Math.round(v / 1000)} k€`;

describe("le modèle de L'Escale Megève", () => {
  it("est déterministe, et le hasard ne dépend pas des décisions", () => {
    expect(simuler(MEILLEUR, 7, 1)).toEqual(simuler(MEILLEUR, 7, 1));
    expect(hasard(12)).toBe(hasard(12));
    expect(simuler(MEILLEUR, 12).recettesEte).toBeCloseTo(simuler(ATTENTISTE, 12).recettesEte, 6);
    expect(simuler(MEILLEUR, 12).semaines[2]!.acomptes).toBeCloseTo(
      simuler(REFLEXE, 12).semaines[2]!.acomptes,
      6,
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

  it("tient le fonds de roulement égal à la trésorerie nette plus le BFR, et le BFR s'inverse", () => {
    const t = simuler(MEILLEUR, 3);
    for (let w = 1; w <= 13; w += 1) {
      const s = t.semaines[w]!;
      expect(s.frng).toBeCloseTo(s.tresorerie + s.bfr, 6);
    }
    // L'hiver a laissé un BFR très négatif ; la fermeture le fait remonter de plus de 250 k€.
    const plan = prevoir([]);
    expect(BFR_DEPART).toBeLessThan(-400000);
    expect(plan.semaines[11]!.bfr - BFR_DEPART).toBeGreaterThan(250000);
  });

  it("sans financement, la banque rejette des paiements ; avec la méthode, presque jamais", () => {
    const avecIncident = (c: readonly number[]) =>
      GRAINES_DU_BILAN.filter((g) => simuler(c, g).incidents.length > 0).length;
    expect(avecIncident(ATTENTISTE)).toBe(30);
    // Seuls les refus du comité exposent la méthode.
    expect(avecIncident(MEILLEUR)).toBeLessThanOrEqual(5);
    // Le réflexe ne passe jamais au-delà : il a trouvé l'argent ailleurs, et le paie autrement.
    expect(avecIncident(REFLEXE)).toBe(0);
  });

  it("garde des indicateurs réalistes", () => {
    for (const r of REFERENCES) {
      for (const g of GRAINES_DU_BILAN) {
        const t = simuler(r.chemin, g, JOURS);
        expect(t.pointBas).toBeGreaterThan(-500000);
        expect(t.fraisFinanciers).toBeLessThan(40000);
        expect(Math.max(...t.semaines.slice(1).map((s) => s!.tresorerie))).toBeLessThan(
          TRESORERIE_DEPART,
        );
      }
    }
  });
});

describe("les chiffres des sources sont ceux du modèle", () => {
  it("le plan de trésorerie : le point bas de −285 k€, fin juin, se recalcule des échéances et des encaissements", () => {
    const echeances = texte(0, "echeances");
    for (const e of Object.values(ECHEANCES)) expect(echeances).toContain(k(e.montant));
    for (const m of Object.values(FOURNISSEURS_HIVER)) expect(echeances).toContain(k(m));
    for (const part of Object.values(CALENDRIER_TRAVAUX)) {
      expect(echeances).toContain(k(part * TOTAL_TRAVAUX));
    }
    const encaissements = texte(0, "encaissements");
    expect(encaissements).toContain(`+${k(TRESORERIE_DEPART)}`);
    expect(encaissements).toContain(k(CREANCE_TO));
    expect(RESERVATIONS_PAR_SEMAINE).toBe(33000);
    expect(RESERVATIONS_PAR_SEMAINE * ACOMPTE_ACTUEL).toBeCloseTo(6600, 6);
    expect(encaissements).toContain("6,6 k€");
    // Le point bas se lit en cumulant les flux, semaine après semaine, depuis 420 k€.
    let cumul = TRESORERIE_DEPART;
    for (let w = 1; w <= 11; w += 1) cumul += fluxDuPlan(w);
    expect(cumul).toBeCloseTo(POINT_BAS_PLAN, 6);
    expect(POINT_BAS_PLAN).toBeCloseTo(-285400, 6);
    expect(SEMAINE_POINT_BAS_PLAN).toBe(11);
    expect(TRESORERIE_DU_PLAN[12]!).toBeGreaterThan(POINT_BAS_PLAN);
    expect(EPISODE_INTERSAISON.prevision.reel(simuler(MEILLEUR, 1))).toBeCloseTo(-285.4, 6);
    // La ligne et la facilité de caisse couvrent ce point bas, et pas davantage.
    expect(LIGNE + AUTORISATION).toBeGreaterThan(-POINT_BAS_PLAN);
    expect(LIGNE + AUTORISATION + POINT_BAS_PLAN).toBeLessThan(20000);
  });

  it("le bilan du 13 avril : un BFR de −406 k€, des dettes de 454 k€, un FRNG de 14 k€", () => {
    expect(DETTES_DEPART).toBe(454000);
    expect(BFR_DEPART).toBe(-406000);
    expect(FRNG_DEPART).toBe(14000);
    const s = texte(0, "encaissements");
    expect(s).toContain("−406 k€");
    expect(s).toContain("454 k€");
    expect(s).toContain("14 k€");
  });

  it("les acomptes : 6,6 k€, 16 k€, 10 k€ ou 10,8 k€ par semaine, et ce qu'ils font perdre", () => {
    const parSemaine = (o: number) =>
      (Object.keys(RESERVATIONS) as (keyof typeof RESERVATIONS)[]).reduce(
        (s, p) => s + RESERVATIONS[p] * POLITIQUES[o]![p],
        0,
      );
    expect(parSemaine(0)).toBeCloseTo(6600, 6);
    expect(parSemaine(1)).toBeCloseTo(16500, 6);
    expect(parSemaine(2)).toBeCloseTo(9900, 6);
    expect(parSemaine(3)).toBeCloseTo(10800, 6);
    expect(ETAPES[1]!.options[3]!.d).toContain("10,8 k€");
    // Évian : 20 points d'acompte de plus, 10 % de réservations d'été perdues.
    expect(SENSIBILITE.ete * 0.2).toBeCloseTo(0.1, 6);
    // Les semaines creuses : un client sur huit ; les fêtes et février, 1 à 2 %.
    expect(SENSIBILITE.autres * 0.2).toBeCloseTo(0.12, 6);
    expect(SENSIBILITE.fetes * 0.2).toBeCloseTo(0.01, 6);
    expect(SENSIBILITE.fevrier * 0.2).toBeCloseTo(0.02, 6);
    expect(texte(1, "reservations")).toContain("un client sur huit");
  });

  it("les travaux : 66 k€ d'acompte, 125 k€ sans les chambres, 5,5 k€ pour l'échéancier", () => {
    expect(TOTAL_TRAVAUX).toBe(220000);
    expect(0.3 * TOTAL_TRAVAUX).toBeCloseTo(66000, 6);
    expect(TRAVAUX.reglementaire + TRAVAUX.preventif + TRAVAUX.cuisine).toBe(125000);
    expect(TOTAL_TRAVAUX - TRAVAUX.reglementaire).toBe(180000);
    expect(TOTAL_TRAVAUX * SURCOUT_ECHEANCIER_TRAVAUX).toBeCloseTo(5500, 6);
    expect(texte(2, "echeancier")).toContain("5,5 k€");
  });

  it("les fournisseurs : 34 indemnités de 40 €, 750 € d'échéancier, 2,5 k€ de remise", () => {
    expect(TOTAL_FOURNISSEURS).toBe(150000);
    expect(FACTURES_HIVER * INDEMNITE_FORFAITAIRE).toBe(1360);
    expect(TOTAL_FOURNISSEURS * PART_ECHEANCIER * FRAIS_ECHEANCIER).toBeCloseTo(750, 6);
    expect(ETAPES[3]!.options[2]!.d).toContain("750 €");
    expect(VINS_ETE * REMISE_VINS).toBeCloseTo(2480, 6);
    expect(ETAPES[3]!.options[3]!.d).toContain("2,5 k€");
  });

  it("Alpine Horizons : 714 nuitées, des acomptes de 60, 39 et 35 k€, et le coût de déplacement", () => {
    expect(NUITEES_HAUTES + NUITEES_BASSES).toBe(714);
    expect(NUITEES_HAUTES).toBe(252);
    expect(NUITEES_BASSES).toBe(462);
    expect(texte(5, "hiver")).toContain("714 nuitées, dont 252");
    expect(ACOMPTE_TO * 714 * PRIX_TO).toBeCloseTo(59976, 6);
    expect(ACOMPTE_TO * 462 * PRIX_TO).toBeCloseTo(38808, 6);
    expect(ACOMPTE_TO * 462 * PRIX_PLANCHER).toBeCloseTo(34650, 6);
    // 462 nuitées payées 280 €, quand 60 % se seraient vendues 300 €, moins 21 € par nuitée en plus.
    expect(gainBasses(PRIX_TO)).toBeCloseTo(462 * 280 - 462 * 0.6 * 300 - 462 * 0.4 * 21, 6);
    // Les semaines de pointe vendues 280 € au lieu de 560 € : le contrat entier détruit de la valeur.
    expect(gainBasses(PRIX_TO) - perteHautes(PRIX_TO)).toBeLessThan(-20000);
    expect(gainBasses(PRIX_PLANCHER)).toBeGreaterThan(20000);
  });
});

describe("ce que l'épisode enseigne, décision par décision", () => {
  it("D1 : la ligne saisonnière négociée en avril est la meilleure ; ne rien demander coûte cher", () => {
    const r = rejeu(MEILLEUR, D.financement);
    expect(classement(MEILLEUR, D.financement)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    // Un prêt à cinq ans pour un besoin de quelques semaines : trop tard, et trop cher.
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(4000);
    expect(r[0]!.attendu - r[3]!.attendu).toBeGreaterThan(4000);
  });

  it("D2 : des acomptes plus forts là où la demande déborde ; 50 % partout fait fuir les clients", () => {
    const r = rejeu(MEILLEUR, D.acomptes);
    expect(classement(MEILLEUR, D.acomptes)[0]).toBe(3);
    expect(classement(MEILLEUR, D.acomptes).at(-1)).toBe(1);
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[3]!.attendu - r[0]!.attendu).toBeGreaterThan(1000);
  });

  it("D3 : faire tous les travaux au printemps ; les reporter est le pire calcul", () => {
    const r = rejeu(MEILLEUR, D.travaux);
    expect(classement(MEILLEUR, D.travaux)).toEqual([0, 3, 2, 1]);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(40000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(20000);
  });

  it("D4 : payer à l'échéance, et même prendre la remise ; étaler « au feeling » coûte", () => {
    const r = rejeu(MEILLEUR, D.fournisseurs);
    expect(classement(MEILLEUR, D.fournisseurs)[0]).toBe(3);
    expect(classement(MEILLEUR, D.fournisseurs).at(-1)).toBe(1);
    expect(r[3]!.attendu - r[1]!.attendu).toBeGreaterThan(8000);
  });

  it("D5 : revoir le financement au vu du plan à jour ; persister mène au rejet", () => {
    const r = rejeu(MEILLEUR, D.legionelle);
    expect(classement(MEILLEUR, D.legionelle)[0]).toBe(0);
    expect(r[0]!.attendu - r[1]!.attendu).toBeGreaterThan(10000);
    expect(r[0]!.attendu - r[2]!.attendu).toBeGreaterThan(25000);
    // L'avance du siège est presque aussi bonne.
    expect(r[0]!.attendu - r[3]!.attendu).toBeLessThan(1500);
  });

  it("D5, l'interaction : la ligne relevée vaut 10 k€ de plus que la persistance avec une ligne d'avril, presque rien sans", () => {
    const avec = rejeu(MEILLEUR, D.legionelle);
    const sans = rejeu(SANS_LIGNE, D.legionelle);
    expect(avec[0]!.attendu - avec[1]!.attendu).toBeGreaterThan(10000);
    expect(Math.abs(sans[0]!.attendu - sans[1]!.attendu)).toBeLessThan(2000);
  });

  it("D6 : la contre-proposition sans les semaines de pointe est la meilleure en moyenne, le prix plancher le plus sûr", () => {
    const r = rejeu(MEILLEUR, D.alpine);
    expect(classement(MEILLEUR, D.alpine)[0]).toBe(1);
    expect(classement(MEILLEUR, D.alpine).at(-1)).toBe(0);
    expect(plusSure(MEILLEUR, D.alpine)).toBe(3);
    expect(r[3]!.p10).toBeGreaterThan(r[1]!.p10 + 5000);
    expect(r[1]!.attendu - r[3]!.attendu).toBeGreaterThan(1000);
    expect(r[1]!.attendu - r[0]!.attendu).toBeGreaterThan(40000);
  });

  it("aucun réflexe n'est un bon choix sur le meilleur chemin, et aucun n'y figure", () => {
    for (const [d, o] of REFLEXES) {
      expect(MEILLEUR[d]).not.toBe(o);
      expect(REFERENCES[0].chemin[d]).not.toBe(o);
      const autre = [...MEILLEUR];
      autre[d] = o;
      expect(
        mesurerDecision(EPISODE_INTERSAISON, autre, d, JOURS).bonne,
        `D${d + 1} option ${o}`,
      ).toBe(false);
    }
  });

  it("faire le plan et financer le creux bat le réflexe et l'attentisme, en moyenne", () => {
    const [methode, reflexe, attentiste] = REFERENCES.map((r) => attendu(r.chemin));
    expect(methode).toBeGreaterThan(reflexe! + 80000);
    expect(methode).toBeGreaterThan(attentiste! + 30000);
    expect(attentiste).toBeGreaterThan(-450000);
  });
});

describe("le bilan de l'épisode", () => {
  const partie = (chemin: readonly number[], extra: Partial<PartieJouee> = {}): PartieJouee => ({
    graine: 11,
    chemin,
    consultes: [
      ["echeances", "encaissements"],
      ["reservations"],
      ["reports"],
      ["conditions"],
      ["plan"],
      ["hiver"],
    ],
    jours: JOURS,
    diagnostic: "cycle",
    reevaluation: { choix: "maintient", principal: null },
    prevision: -285,
    confiance: 60,
    ...extra,
  });

  it("juge bonnes les décisions du meilleur chemin, quel que soit le hasard", () => {
    for (const graine of [2, 11, 4242]) {
      const a = analyser(EPISODE_INTERSAISON, partie(MEILLEUR, { graine }));
      expect(
        a.decisions.every((d) => d.bonne),
        `graine ${graine}`,
      ).toBe(true);
    }
  });

  it("à qui a passé le creux sans emprunter, propose de financer le creux", () => {
    const p = partie(REFLEXE);
    const c = EPISODE_INTERSAISON.comportements(p, analyser(EPISODE_INTERSAISON, p).trimestre);
    expect(c[2]!.score).toBe(0);
    expect(EPISODE_INTERSAISON.axe(c).titre).toBe(
      "Financer le creux, pas l'emprunter à la saison suivante",
    );
  });

  it("à qui a décidé sans enquêter, propose de faire le plan avant le creux", () => {
    const p = partie(MEILLEUR, { consultes: [[], [], [], [], [], []], jours: 0 });
    const c = EPISODE_INTERSAISON.comportements(p, analyser(EPISODE_INTERSAISON, p).trimestre);
    expect(EPISODE_INTERSAISON.axe(c).titre).toBe("Faire le plan avant le creux");
  });

  it("juge le diagnostic, et la prévision du point bas à 10 k€ près", () => {
    const t = simuler(MEILLEUR, 11);
    const juste = EPISODE_INTERSAISON.comportements(partie(MEILLEUR, { prevision: -292 }), t);
    expect(juste[1]!.score).toBe(1);
    expect(juste[3]!.score).toBe(1);
    // Oublier les travaux, ou compter le point bas en semaine 13 : loin du compte.
    const sansTravaux = EPISODE_INTERSAISON.comportements(
      partie(MEILLEUR, { prevision: -65, diagnostic: "travaux" }),
      t,
    );
    expect(sansTravaux[1]!.score).toBe(0.6);
    expect(sansTravaux[3]!.score).toBe(0);
    const finDeTrimestre = EPISODE_INTERSAISON.comportements(
      partie(MEILLEUR, { prevision: -246, diagnostic: "fixes" }),
      t,
    );
    expect(finDeTrimestre[1]!.score).toBe(0);
    expect(finDeTrimestre[3]!.score).toBe(0);
  });

  it("dit la trésorerie corrigée, et la compare au plan d'avril", () => {
    expect(EPISODE_INTERSAISON.bilan.titre(simuler(MEILLEUR, 4242))).toMatch(
      /de trésorerie corrigée à mi-juillet, pour −332 k€ au plan d'avril/,
    );
    expect(EPISODE_INTERSAISON.bilan.tuiles(simuler(MEILLEUR, 4242))).toHaveLength(4);
  });
});
