import { describe, expect, it } from "vitest";
import { NEGOCIER_LE_PRIX } from "../../src/config/cours/chapitres/negocier-le-prix";
import { REMISES_ET_CONDITIONS } from "../../src/config/cours/chapitres/remises-et-conditions";
import { TABLEAU_DE_BORD_COMMERCIAL } from "../../src/config/cours/chapitres/tableau-de-bord-commercial";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import { CONTRATS_DE_NADIA_AU_T4 } from "../../src/config/cours/monde/equipe-commerciale-d-atlas";
import { APPEL_D_OFFRES_DE_VALBRUNE, CENTRE_D_ACHAT_D_ORVANE, PRIX_ENVISAGE_POUR_VALBRUNE } from "../../src/config/cours/monde/negociation-d-atlas";
import { attendus, centime, juste, somme } from "./gardes-d-atlas";

/**
 * LES COMPLÉMENTS DU BTS NDRC EN ENTIER, DANS TROIS CHAPITRES EXISTANTS D'ATLAS CONSEIL (novembre 2026).
 *
 *   · K1, « Négocier le prix » : l'entretien avec le groupe Orvane, son centre d'achat et l'objection de
 *     l'acheteur, traitée par la contrepartie (20 % sur 40 journées).
 *   · K2, « Négocier le prix » : le B to G, l'appel d'offres du centre hospitalier de Valbrune (560 € en N,
 *     17,86 et 16,74 de notes, 16,45 pour Bêta Conseil, 583 € au plus, 50 € de marge par journée).
 *   · K3, « Remises et conditions » : le cadre juridique (le délai de 90 jours refusé, la clause des
 *     pénalités : 8,28 % au plancher face à 12,15 %, une entente refusée).
 *   · K4, « Le tableau de bord commercial » : la dispersion des 13 contrats de Nadia au T4 (moyenne
 *     13 800 €, médiane 6 400 €, écart-type 13 380 €, 72,8 % pour les 4 plus gros), et ce qu'elle dit d'un
 *     challenge.
 * Chaque chiffre est refait à la main sur les fiches ; les gardes de texte des trois chapitres restent
 * celles de leurs tests, qui parcourent toutes leurs étapes, compléments compris.
 */

const f = ATLAS_CONSEIL;
const ids = (ch: { etapes: readonly { id: string }[] }) => ch.etapes.map((e) => e.id);

describe("K1 : l'entretien, dans « Négocier le prix »", () => {
  it("deux étapes après la contrepartie, avant le pari du T4", () => {
    const x = ids(NEGOCIER_LE_PRIX);
    const i = x.indexOf("contrepartie");
    expect(x.slice(i + 1, i + 4)).toEqual(["le-centre-d-achat", "l-objection-du-prix", "predire-le-t4"]);
  });

  it("le centre d'achat : quatre rôles, et la proposition bâtie sur le prescripteur et la contrepartie", () => {
    expect(CENTRE_D_ACHAT_D_ORVANE.map((m) => m.role)).toEqual(["decideur", "prescripteur", "acheteur", "utilisateur"]);
    expect(juste(NEGOCIER_LE_PRIX, "le-centre-d-achat")).toBe("Sur le délai de la DRH, et la remise contre du volume");
  });

  it("l'objection : 20 % sur 40 journées, la contrepartie qui garde la marge", () => {
    // 30 × (800 − 150) = 19 500 € ; une journée à 640 € laisse 490 € ; 19 500 ÷ 490 = 39,8 : 40 journées.
    const sans = f.affaire.journees * (f.prixCatalogue - 150);
    const parJournee = f.prixCatalogue * (1 - f.affaire.remiseDemandee) - 150;
    const j = Math.ceil(sans / parJournee);
    expect([sans, parJournee, j, j * parJournee]).toEqual([19_500, 490, 40, 19_600]);
    expect(juste(NEGOCIER_LE_PRIX, "l-objection-du-prix")).toBe(`« 20 % sur ${j} journées, d'accord »`);
  });
});

describe("K2 : le B to G, l'appel d'offres de Valbrune", () => {
  const valbrune = f.comptes.find((c) => c.code === "valbrune")!;
  const prix = valbrune.chiffreDAffaires / valbrune.journees;
  const frais = valbrune.frais / valbrune.journees;
  const note = (p: number, technique: number, bas = 500) => 0.6 * technique + 0.4 * ((20 * bas) / p);

  it("deux étapes avant la synthèse", () => {
    expect(ids(NEGOCIER_LE_PRIX).slice(-3)).toEqual(["l-appel-d-offres", "l-offre-a-remettre", "synthese"]);
  });

  it("la fiche : le compte de Valbrune à 560 €, 290 € de frais par journée ; la grille 60 % et 40 %", () => {
    expect([prix, frais, valbrune.journees]).toEqual([560, 290, 280]);
    expect(APPEL_D_OFFRES_DE_VALBRUNE.ponderation).toEqual({ technique: 0.6, prix: 0.4 });
    expect(APPEL_D_OFFRES_DE_VALBRUNE.concurrents.map((k) => [k.prix, k.noteTechnique])).toEqual([
      [500, 12],
      [640, 17],
    ]);
  });

  it("les notes : 17,86 et 16,74 pour ATLAS CONSEIL, 16,45 pour Bêta Conseil ; 583 € au plus", () => {
    const beta = note(640, 17);
    // 9,6 + 4 000 ÷ p > 16,45, soit p < 583,94.
    const limite = (0.4 * 20 * 500) / (beta - 0.6 * 16);
    expect(attendus(NEGOCIER_LE_PRIX, "l-appel-d-offres")).toEqual({
      "Note du prix d'ATLAS CONSEIL": centime((20 * 500) / 560),
      "Note globale d'ATLAS CONSEIL": centime(note(560, 16)),
      "Note globale de Bêta Conseil": centime(beta),
      "Prix le plus haut qui gagne encore": Math.floor(limite),
    });
    expect([centime((20 * 500) / 560), centime(note(560, 16)), centime(beta), Math.floor(limite)]).toEqual([17.86, 16.74, 16.45, 583]);
    expect(note(583, 16) > beta && note(584, 16) < beta).toBe(true);
  });

  it("l'offre à remettre : 580 € gagnent encore, et laissent 70 € par journée au lieu de 50 €", () => {
    const marge = (p: number) => p - frais - 220;
    expect([marge(560), marge(PRIX_ENVISAGE_POUR_VALBRUNE), marge(PRIX_ENVISAGE_POUR_VALBRUNE) * 280, marge(560) * 280]).toEqual([50, 70, 19_600, 14_000]);
    expect(marge(560) * 280).toBe(valbrune.marge);
    expect(note(PRIX_ENVISAGE_POUR_VALBRUNE, 16) > note(640, 17)).toBe(true);
    expect(note(640, 16) < note(640, 17)).toBe(true);
    expect(juste(NEGOCIER_LE_PRIX, "l-offre-a-remettre")).toBe("Viser 580 €, sous les 583 € qui gagnent");
  });
});

describe("K3 : le cadre juridique, dans « Remises et conditions »", () => {
  it("trois étapes après le client en retard, avant le pari de l'escompte", () => {
    const x = ids(REMISES_ET_CONDITIONS);
    const i = x.indexOf("le-client-en-retard");
    expect(x.slice(i + 1, i + 5)).toEqual(["la-demande-de-kerval", "les-penalites-des-cgv", "une-entente-sur-les-prix", "predire-l-escompte"]);
  });

  it("90 jours ne se convient pas, même contre la remise", () => {
    expect(juste(REMISES_ET_CONDITIONS, "la-demande-de-kerval")).toBe("Non : 60 jours au plus, même contre la remise");
  });

  it("la clause des pénalités : 8,28 % au plancher, 248,26 € au lieu de 364,30 € sur le retard de Kerval", () => {
    // La facture : 40 × 800 € × 95 % = 30 400 € HT, 36 480 € TTC ; 30 jours de retard.
    const ttc = 40 * 800 * 0.95 * 1.2;
    const plancher = 3 * 0.0276;
    const auPlancher = centime((ttc * plancher * 30) / 365);
    const auBce = centime((ttc * (0.0215 + 0.1) * 30) / 365);
    expect([ttc, centime(plancher * 100), auPlancher, auBce, centime(auBce - auPlancher)]).toEqual([36_480, 8.28, 248.26, 364.3, 116.04]);
    expect(attendus(REMISES_ET_CONDITIONS, "les-penalites-des-cgv")).toEqual({
      "Taux plancher des pénalités (%)": 8.28,
      "Pénalités au taux plancher": auPlancher,
      "Ce que la clause plancher fait perdre": centime(auBce - auPlancher),
    });
  });

  it("une entente sur les prix se refuse", () => {
    expect(juste(REMISES_ET_CONDITIONS, "une-entente-sur-les-prix")).toBe("Il refuse : c'est une entente sur les prix");
  });
});

describe("K4 : la dispersion et l'animation, dans « Le tableau de bord commercial »", () => {
  const prixDe = (code: string) => {
    const c = f.comptes.find((x) => x.code === code)!;
    return c.chiffreDAffaires / c.journees;
  };
  const montants = CONTRATS_DE_NADIA_AU_T4.map((k) => k.journees * prixDe(k.compte));

  it("une étape avant la synthèse, et le chapitre tient en 20 étapes", () => {
    expect(ids(TABLEAU_DE_BORD_COMMERCIAL).slice(-2)).toEqual(["la-dispersion-des-contrats", "synthese"]);
    expect(TABLEAU_DE_BORD_COMMERCIAL.etapes.length).toBeLessThanOrEqual(20);
  });

  it("les 13 contrats refont le T4 de Nadia, dans les journées de l'année de chaque compte", () => {
    const t4 = f.commerciaux.find((k) => k.code === "entreprises")!.n[3]!;
    expect([CONTRATS_DE_NADIA_AU_T4.length, somme(CONTRATS_DE_NADIA_AU_T4.map((k) => k.journees)), somme(montants)]).toEqual([t4.contrats, t4.journees, t4.chiffreDAffaires]);
    for (const k of CONTRATS_DE_NADIA_AU_T4) {
      const c = f.comptes.find((x) => x.code === k.compte)!;
      expect(c.commercial, k.compte).toBe("entreprises");
      expect(k.journees, k.compte).toBeLessThanOrEqual(c.journees);
    }
  });

  it("moyenne 13 800 €, médiane 6 400 €, écart-type 13 380 €, 72,8 % pour les 4 plus gros", () => {
    const moyenne = somme(montants) / montants.length;
    const ranges = [...montants].sort((a, b) => a - b);
    const ecart = Math.sqrt(somme(montants.map((x) => (x - moyenne) ** 2)) / montants.length);
    const gros = [...montants].sort((a, b) => b - a).slice(0, 4);
    expect([moyenne, ranges[6], Math.round(ecart), Math.round((somme(gros) / somme(montants)) * 1000) / 10]).toEqual([13_800, 6_400, 13_380, 72.8]);
    expect(attendus(TABLEAU_DE_BORD_COMMERCIAL, "la-dispersion-des-contrats")).toEqual({
      "Montant médian d'un contrat": 6_400,
      "Dispersion des montants, en écart-type": 13_380,
      "Part des 4 plus gros contrats (%)": 72.8,
    });
  });
});
