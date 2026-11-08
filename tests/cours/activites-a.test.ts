import { describe, expect, it } from "vitest";
import { BUREAUX, bureauxDuChapitre, lienDuBureau } from "../../src/config/cours/bureaux";
import { LE_MOIS_DE_MARS_DE_NOVA, grilleDuMois, moisDeMars } from "../../src/config/cours/bureaux/le-mois-de-mars-de-nova";
import { LES_JEUX_DE_NOEL, JEUX_DE_NOEL, grilleDuControle, jeuxDeNoel } from "../../src/config/cours/bureaux/les-jeux-de-noel";
import { LES_PARTENAIRES_AU_31_MARS, grilleDuReste, resteAuTrenteEtUnMars } from "../../src/config/cours/bureaux/les-partenaires-au-31-mars";
import type { Bureau, EtapeDeClassement, EtapeDeRectification, EtapeDeReponse, EtapeDuJournal } from "../../src/config/cours/bureaux/types";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { janvierDe } from "../../src/config/cours/chapitres/creation-premier-bilan";
import { ENQUETES, enquetesDuChapitre } from "../../src/config/cours/enquetes";
import { DOSSIER_DE_L_APPRENTI, LE_JOURNAL_DE_L_APPRENTI, grilleDuJournalCorrige, journalDeLApprenti } from "../../src/config/cours/enquetes/le-journal-de-l-apprenti";
import { DOSSIER_DE_L_INTERIMAIRE, LES_EFFETS_DE_L_INTERIMAIRE, effetsDesRectifications, grilleDesEffets } from "../../src/config/cours/enquetes/les-effets-de-l-interimaire";
import { resultatSelonLesPrincipes } from "../../src/config/cours/monde/cadre-de-la-comptabilite";
import { CLOTURE_DE_LA_FICHE } from "../../src/config/cours/monde/exercice-de-nova";
import { CHAPITRES } from "../../src/config/cours/registre";
import { SCENARIOS, scenariosDuChapitre } from "../../src/config/cours/scenarios";
import * as C from "../../src/config/cours/scenarios/les-comptes-que-voulait-le-president";
import * as E from "../../src/config/cours/scenarios/les-escomptes-de-janvier";
import type { Scenario } from "../../src/config/cours/scenarios/types";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { servirLeBureau } from "../../src/pedagogy/cours/bureau-servi";
import { corriger, enEcriture, enSaisie, montantEcrit } from "../../src/pedagogy/cours/correcteur";
import { equilibree } from "../../src/pedagogy/cours/etats";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { corrigerAuScenario, servirLeScenario } from "../../src/pedagogy/cours/scenario-servi";
import { corrigerLeTableau, incoherencesDuTableau, solutionsDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { LEXIQUE_INTERDIT, espacesOrdinairesFautives, phrasesLongues, tiretsAuMilieu, tutoiements } from "../helpers/textes-du-depot";

/**
 * LES ACTIVITÉS DU LOT A (décision du propriétaire, novembre 2026) : une activité par chapitre, pour
 * sept chapitres de la comptabilité générale. Trois bureaux (le mois de mars de NOVA, les partenaires au
 * 31 mars, les jeux de Noël), deux enquêtes (le journal de l'apprenti, les effets de l'intérimaire), deux
 * scénarios (les escomptes de janvier, les comptes que voulait le président).
 *
 * Chaque chiffre refait à la main depuis le monde du cours ; chaque tableau cohérent et juste avec ses
 * propres valeurs ; chaque écriture équilibrée, au plan du cours ; les tailles du brief ; une seule bonne
 * option par question, jamais la plus longue ; l'activité au chapitre qu'elle reprend, hors des cas
 * dédiés ; les textes suivent les règles de la maison.
 */

const c = (v: number) => Math.round(v * 100) / 100 + 0;
const nova = casDeLEntreprise("nova");

const LES_BUREAUX: readonly Bureau[] = [LE_MOIS_DE_MARS_DE_NOVA, LES_PARTENAIRES_AU_31_MARS, LES_JEUX_DE_NOEL];
const LES_ENQUETES = [LE_JOURNAL_DE_L_APPRENTI, LES_EFFETS_DE_L_INTERIMAIRE];
const LES_SCENARIOS: readonly Scenario[] = [E.LES_ESCOMPTES_DE_JANVIER, C.LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT];

const CHAPITRES_DU_LOT: Readonly<Record<string, string>> = {
  "charges-produits-encaissements": LE_MOIS_DE_MARS_DE_NOVA.code,
  "les-flux-de-l-entreprise": LES_PARTENAIRES_AU_31_MARS.code,
  "creation-premier-bilan": LE_JOURNAL_DE_L_APPRENTI.code,
  "le-cadre-de-la-comptabilite": C.LES_COMPTES_QUE_VOULAIT_LE_PRESIDENT.code,
  "ventes-et-achats-au-complet": LES_JEUX_DE_NOEL.code,
  "remises-et-reglements": E.LES_ESCOMPTES_DE_JANVIER.code,
  "le-compte-client": LES_EFFETS_DE_L_INTERIMAIRE.code,
};

const etapeDe = <T>(b: Bureau, id: string) => b.etapes.find((e) => e.id === id) as T;

describe("le registre : une activité par chapitre, hors des cas dédiés", () => {
  it("chaque chapitre du lot a son activité, au même parcours, et le registre y mène", () => {
    for (const [chapitre, code] of Object.entries(CHAPITRES_DU_LOT)) {
      const ch = CHAPITRES.find((x) => x.code === chapitre)!;
      expect(ch, chapitre).toBeDefined();
      const toutes = [...bureauxDuChapitre(chapitre), ...enquetesDuChapitre(chapitre), ...scenariosDuChapitre(chapitre)].map((x) => x.code);
      expect(toutes, chapitre).toContain(code);
      const a = [...BUREAUX, ...ENQUETES, ...SCENARIOS].find((x) => x.code === code)!;
      expect(a.parcours).toBe(ch.parcours);
      expect(a.libre).toBe(false);
    }
    expect(lienDuBureau(LE_MOIS_DE_MARS_DE_NOVA)).toBe("/cours/bureau/le-mois-de-mars-de-nova");
  });

  it("aucune activité n'entre dans les cas dédiés : le compte reste 205", () => {
    expect(CAS_PAR_CHAPITRE.length).toBe(205);
    const codes = new Set(CAS_PAR_CHAPITRE.map((x) => x.code));
    for (const code of Object.values(CHAPITRES_DU_LOT)) expect(codes.has(code), code).toBe(false);
  });

  it("les tailles du brief : un bureau 5 à 9 pièces et 3 à 6 étapes ; une enquête 6 à 10 écritures, 2 ou 3 justes, 4 à 6 erreurs ; un scénario 2 ou 3 décisions à 3 options", () => {
    for (const b of LES_BUREAUX) {
      expect(b.pile.length, b.code).toBeGreaterThanOrEqual(5);
      expect(b.pile.length, b.code).toBeLessThanOrEqual(9);
      expect(b.etapes.length, b.code).toBeGreaterThanOrEqual(3);
      expect(b.etapes.length, b.code).toBeLessThanOrEqual(6);
    }
    for (const [e, n, erreurs] of [
      [LE_JOURNAL_DE_L_APPRENTI, DOSSIER_DE_L_APPRENTI.length, DOSSIER_DE_L_APPRENTI.filter((x) => x.erreur).map((x) => x.erreur)],
      [LES_EFFETS_DE_L_INTERIMAIRE, DOSSIER_DE_L_INTERIMAIRE.length, DOSSIER_DE_L_INTERIMAIRE.filter((x) => x.erreur).map((x) => x.erreur)],
    ] as const) {
      expect(n, e.code).toBeGreaterThanOrEqual(6);
      expect(n, e.code).toBeLessThanOrEqual(10);
      expect(n - erreurs.length, e.code).toBeGreaterThanOrEqual(2);
      expect(n - erreurs.length, e.code).toBeLessThanOrEqual(3);
      expect(new Set(erreurs).size, e.code).toBe(erreurs.length);
      const r = e.etapes.find((x) => x.type === "rectification") as EtapeDeRectification;
      expect(r.ecritures.length).toBe(erreurs.length);
    }
    for (const s of LES_SCENARIOS) {
      expect(s.decisions.length).toBeGreaterThanOrEqual(2);
      expect(s.decisions.length).toBeLessThanOrEqual(3);
      for (const d of s.decisions) expect(d.options.length, d.id).toBe(3);
    }
  });
});

describe("le mois de mars de NOVA : chaque chiffre à la main", () => {
  const x = moisDeMars();

  it("les ventes, les charges et le résultat de mars", () => {
    expect([x.particuliers.quantite, x.campustech.quantite]).toEqual([1_418, 320]);
    expect(x.produits).toBe(c(1_418 * 59 + 320 * 59));
    expect(x.produits).toBe(102_542);
    // Composants 22 €, autres 16 € par enceinte ; loyer, personnel, usure ; les intérêts d'un trimestre sur 80 000 € à 5 %.
    expect(x.echeance).toEqual({ capital: 4_000, interets: c((80_000 * 0.05 * 3) / 12) });
    expect(x.charges).toBe(c(1_738 * 22 + 1_738 * 16 + 19_700 + 10_650 + 833 + 1_000));
    expect(x.resultat).toBe(4_315);
  });

  it("la banque de mars : les cartes seules entrent ; février, la paie, la TVA et l'échéance sortent", () => {
    expect(x.encaissements).toBe(c(83_662 * 1.2));
    expect(x.decaissements).toBe(c(1_450 * 22 * 1.2 + 1_738 * 16 * 1.2 + 19_700 + 5_850 + 4_800 + 6_090 + 5_000));
    expect(x.variation).toBe(-12_695.2);
    expect(c(x.debut + x.variation)).toBe(x.fin);
    expect([x.debut, x.fin]).toEqual([31_998, 19_302.8]);
    expect(x.aPayerEnAvril).toBe(c(1_738 * 22 * 1.2 + 4_800));
  });

  it("les deux tris : chaque opération une fois, les catégories du chapitre ; l'échéance sépare capital et intérêts", () => {
    const res = etapeDe<EtapeDeClassement>(LE_MOIS_DE_MARS_DE_NOVA, "au-resultat");
    const charges = res.elements.filter((e) => e.categorie === "charge").reduce((t, e) => t + e.montant!, 0);
    const produits = res.elements.filter((e) => e.categorie === "produit").reduce((t, e) => t + e.montant!, 0);
    expect(c(charges)).toBe(x.charges);
    expect(c(produits)).toBe(x.produits);
    expect(res.elements.find((e) => e.code === "capital")!.categorie).toBe("ni");
    expect(res.elements.find((e) => e.code === "interets")!.categorie).toBe("charge");
    const ban = etapeDe<EtapeDeClassement>(LE_MOIS_DE_MARS_DE_NOVA, "a-la-banque");
    expect(c(ban.elements.filter((e) => e.categorie === "decaissement").reduce((t, e) => t + e.montant!, 0))).toBe(x.decaissements);
    expect(c(ban.elements.filter((e) => e.categorie === "encaissement").reduce((t, e) => t + e.montant!, 0))).toBe(x.encaissements);
  });

  it("le tableau du mois : cohérent et juste", () => {
    const g = grilleDuMois();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    expect(g.lignes.at(-1)!.cellules.map((k) => k.valeur)).toEqual([4_315, -12_695.2]);
  });
});

describe("les partenaires au 31 mars : chaque chiffre à la main", () => {
  const r = resteAuTrenteEtUnMars();

  it("CampusTech doit ses trois factures ; NOVA doit la facture de mars, les cotisations, la TVA et le capital", () => {
    expect(r.attend).toBe(c(3 * 320 * 59 * 1.2));
    expect(r.doit).toEqual({ fournisseur: c(1_738 * 22 * 1.2), urssaf: 4_800, etat: c(20_508.4 - 13_208.8), banque: 80_000 - 4_000, salaries: 0 });
    expect(r.totalDu).toBe(c(45_883.2 + 4_800 + 7_299.6 + 76_000));
    // Au délai convenu, la facture de janvier (20 janvier + 60 jours) entre en mars.
    expect(r.banqueAuDelaiConvenu).toBe(c(19_302.8 + 22_656));
  });

  it("le tableau du reste : cohérent et juste ; un partenaire par flux", () => {
    const g = grilleDuReste();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    const p = etapeDe<EtapeDeClassement>(LES_PARTENAIRES_AU_31_MARS, "qui-est-en-face");
    expect(p.elements.find((e) => e.code === "loyer")!.categorie).toBe("fournisseurs");
    expect(p.elements.find((e) => e.code === "emprunt")!.categorie).toBe("banque");
  });
});

describe("les jeux de Noël : chaque chiffre à la main", () => {
  const x = jeuxDeNoel();

  it("l'acompte, la facture et l'avoir : 2 000 jeux à 22 €, 40 % d'acompte, 150 € de port, 20 jeux manquants", () => {
    expect(JEUX_DE_NOEL.jeux).toBe(2_000);
    expect(JEUX_DE_NOEL.manquants).toBe(20);
    expect(x.acompte).toEqual({ ttc: c(2_000 * 22 * 1.2 * 0.4), ht: 17_600, tva: 3_520 });
    expect(x.facture).toEqual({ jeux: 44_000, port: 150, ht: 44_150, tva: 8_830, ttc: 52_980, netAPayer: c(52_980 - 21_120), tvaRestante: c(8_830 - 3_520) });
    expect(x.avoir).toEqual({ ht: 20 * 22, tva: c(20 * 22 * 0.2), ttc: 528 });
    expect(x.resteDu).toBe(c(31_860 - 528));
    expect(x.coutHt).toBe(1_980 * 22 + 150);
  });

  it("le contrôle : cohérent et juste ; les écritures équilibrées, au plan du cours, et le 4091 soldé", () => {
    const g = grilleDuControle();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
    const j = etapeDe<EtapeDuJournal>(LES_JEUX_DE_NOEL, "les-ecritures");
    let acompte = 0;
    for (const e of j.ecritures) {
      const ec = enEcriture(e.ecriture);
      expect(equilibree(ec), e.id).toBe(true);
      expect(corriger(enSaisie(e.ecriture), e.ecriture).juste, e.id).toBe(true);
      for (const l of e.ecriture.lignes) expect(compteDuPlan(l.compte), l.compte).toBeDefined();
      acompte = c(acompte + ec.lignes.filter((l) => l.compte === "4091").reduce((t, l) => t + l.debit - l.credit, 0));
    }
    expect(acompte).toBe(0);
  });
});

describe("le journal de l'apprenti : chaque chiffre à la main", () => {
  const r = journalDeLApprenti();

  it("le journal juste est celui du chapitre ; celui de l'apprenti s'en écarte de six erreurs", () => {
    const j = janvierDe(nova);
    expect(r.juste).toEqual({ resultat: j.resultat, banque: j.banque });
    expect(r.juste.resultat).toBe(c(74_930 + 18_880 - 19_700 - 34_980 - 7_500 - 3_150));
    // Le loyer découpé à tort (19 700 ÷ 1,2), l'équipement en charge, la TVA de la vente en produit, les cotisations patronales oubliées.
    expect(r.annonce.resultat).toBe(c(r.juste.resultat + c(19_700 - c(19_700 / 1.2)) - 60_000 + 3_776 + 3_150));
    // Le virement des salaires à l'envers : la banque compte deux fois le net en trop.
    expect(r.annonce.banque).toBe(c(r.juste.banque + 2 * 5_850));
    expect(r.ecarts.find((x) => x.code === "emprunt")).toEqual({ code: "emprunt", resultat: 0, banque: 0 });
  });

  it("chaque écriture de l'apprenti est équilibrée ; les justes au plan du cours ; le tableau corrigé tombe juste", () => {
    for (const x of DOSSIER_DE_L_APPRENTI) {
      expect(c(x.apprenti.reduce((t, l) => t + l.debit - l.credit, 0)), x.code).toBe(0);
      expect(corriger(enSaisie(x.juste), x.juste).juste).toBe(true);
      for (const l of x.apprenti) expect(compteDuPlan(l.compte), l.compte).toBeDefined();
    }
    const g = grilleDuJournalCorrige();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
  });
});

describe("les effets de l'intérimaire : chaque chiffre à la main", () => {
  const r = effetsDesRectifications();

  it("le doublon repassé, la retenue en charge, l'impayé en portefeuille ; deux erreurs sans effet", () => {
    const de = (code: string) => r.effets.find((x) => x.code === code)!;
    expect(de("doublon")).toEqual({ code: "doublon", resultat: 0, clients: 2 * 22_656, banque: -2 * 22_656 });
    expect(de("factor").resultat).toBe(c(40_356 * 0.1));
    expect(de("impaye").clients).toBe(c(100 * 59 * 1.2));
    for (const code of ["escompte", "bordereau"]) expect(de(code)).toEqual({ code, resultat: 0, clients: 0, banque: 0 });
    expect(r.total).toEqual({ resultat: 4_035.6, clients: c(45_312 + 7_080), banque: -45_312 });
  });

  it("chaque écriture de l'intérimaire est équilibrée ; le tableau des effets tombe juste", () => {
    for (const x of DOSSIER_DE_L_INTERIMAIRE) expect(c(x.interimaire.reduce((t, l) => t + l.debit - l.credit, 0)), x.code).toBe(0);
    const g = grilleDesEffets();
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(corrigerLeTableau(g, solutionsDuTableau(g)).juste).toBe(true);
  });
});

describe("les escomptes de janvier : chaque chiffre à la main", () => {
  it("l'escompte accordé face au découvert de la banque de NOVA à 12 %, 70 jours d'avance, sur le net commercial remisé de 5 %", () => {
    expect(E.JOURS_AVANCES).toBe(80 - 10);
    const net = c(320 * 59 * 0.95);
    const deux = E.escompteAccorde(0.02);
    expect(deux.escompte).toBe(c(net * 0.02));
    expect(deux.agiosEpargnes).toBe(c((c(net * 0.98) * 0.12 * 70) / 360));
    // À 12 %, les 2 % des conditions (10,5 % l'an pour 70 jours) rapportent ; les 3 % demandés coûtent encore.
    expect(deux.gain).toBe(51.42);
    expect(E.escompteAccorde(0.03).gain).toBe(-132.13);
    // L'escompte maximal : x = 12 % × 70 ÷ 360 ; x ÷ (1 + x) = 2,28 %, au dixième inférieur 2,2 %.
    expect(E.ESCOMPTE_MAXIMAL).toBe(0.022);
    expect(E.escompteAccorde(0.022).gain).toBe(14.71);
  });

  it("l'escompte d'Électro-Composants : 2 % de 34 980 €, 12 jours de découvert sur le net financier", () => {
    const x = E.reglementDuFournisseur("escompte");
    expect(x.escompte).toBe(c(34_980 * 0.02));
    expect(x.agios).toBe(c((c(34_980 * 0.98) * 0.12 * 12) / 360));
    expect(x.gain).toBe(562.48);
    expect(E.reglementDuFournisseur("deduire")).toMatchObject({ gain: 0, abimee: true });
  });

  it("vingt-sept suites, trois fins, une meilleure suite unique", () => {
    const toutes = E.toutesLesSuites();
    expect(toutes.length).toBe(27);
    expect(new Set(toutes.map((x) => x.fin))).toEqual(new Set(["fournisseur", "marge", "gagnant"]));
    const b = E.meilleureSuite();
    // À 12 %, les 2 % des conditions rapportent sur la facture de janvier : la meilleure suite les offre (à 8 %, elle n'offrait rien).
    expect(b.suite).toEqual({ client: "conditions", fournisseur: "escompte", suite: "maximal" });
    // Les factures suivantes de CampusTech dans le semestre : février à juin.
    expect(E.FACTURES_SUIVANTES).toBe(5);
    expect(b.total).toBe(c(51.42 + 562.48 + 5 * 14.71));
    expect(toutes.filter((x) => x.fin !== "fournisseur" && x.total >= b.total - 0.005).length).toBe(1);
  });

  it("le bilan dit ce que valent les 2 % à 12 %, et la lettre de la banque dit le crédit de trésorerie au-delà des 5 000 €", () => {
    const comparaison = E.LES_ESCOMPTES_DE_JANVIER.bilan(["aucun", "escompte", "maximal"]).comparaison;
    expect(comparaison).toContain("Les 2 % des conditions coûtent 10,5 % l'an pour 70 jours d'avance, moins que le découvert : sur la facture de janvier, ils rapportent 51,42 €.");
    const lettre = E.LES_ESCOMPTES_DE_JANVIER.situation([]).pieces.find((x) => x.code === "decouvert")!;
    expect(lettre.paragraphes).toEqual([
      "Découvert autorisé à 12 % l'an, sur le solde débiteur de chaque jour, l'année comptée pour 360 jours.",
      `Au-delà de l'autorisation de découvert, ${montantEcrit(5_000)}, la banque finance au même taux par un crédit de trésorerie.`,
    ]);
  });
});

describe("les comptes que voulait le président : chaque chiffre à la main", () => {
  it("la suite fidèle redonne les comptes publiés ; oublier un principe redonne le laboratoire du chapitre", () => {
    expect(C.meilleureSuite().resultatNet).toBe(CLOTURE_DE_LA_FICHE.resultatNet);
    expect(C.meilleureSuite().ecart).toBe(0);
    expect(C.clotureDeLaSuite({ prudence: "oublier", independance: "rattacher", permanence: "garder" }).ecart).toBe(resultatSelonLesPrincipes({ prudence: 0, independance: 1 }).ecart);
    expect(C.clotureDeLaSuite({ prudence: "appliquer", independance: "oublier", permanence: "garder" }).ecart).toBe(resultatSelonLesPrincipes({ prudence: 1, independance: 0 }).ecart);
    expect(C.TRAVAUX_QUI_BAISSENT).toEqual(["factureNonParvenue", "produitConstateDAvance", "interetsCourus"]);
  });

  it("vingt-sept suites, trois fins, une seule fidèle ; le pire assombrit les comptes", () => {
    const toutes = C.toutesLesSuites();
    expect(toutes.length).toBe(27);
    expect(new Set(toutes.map((x) => x.fin))).toEqual(new Set(["fidele", "embellis", "assombris"]));
    expect(toutes.filter((x) => x.fin === "fidele").length).toBe(1);
    expect(C.clotureDeLaSuite({ prudence: "au-pire", independance: "rattacher", permanence: "garder" }).ecart).toBeLessThan(0);
  });
});

describe("les questions : une seule bonne option, jamais la plus longue", () => {
  const etapes: EtapeDeReponse[] = [...LES_BUREAUX.flatMap((b) => b.etapes.filter((e): e is EtapeDeReponse => e.type === "reponse")), ...LES_SCENARIOS.map((s) => s.questions)];
  it("chaque question", () => {
    expect(etapes.length).toBe(5);
    for (const e of etapes)
      for (const q of e.questions) {
        const justes = q.options.filter((o) => o.juste);
        expect(justes, q.id).toHaveLength(1);
        expect(new Set(q.options.map((o) => o.texte)).size).toBe(q.options.length);
        const plusLongue = Math.max(...q.options.filter((o) => !o.juste).map((o) => o.texte.length));
        expect(justes[0]!.texte.length, q.id).toBeLessThan(plusLongue);
      }
  });

  it("dans les enquêtes, la raison la plus longue est un leurre", () => {
    for (const e of LES_ENQUETES) {
      const r = e.etapes.find((x) => x.type === "rectification") as EtapeDeRectification;
      const vraies = new Set(r.ecritures.map((x) => x.raison));
      const longue = [...r.raisons].sort((a, b) => b.libelle.length - a.libelle.length)[0]!;
      expect(vraies.has(longue.code), e.code).toBe(false);
    }
  });
});

/** Toutes les chaînes d'une valeur, sauf les codes. */
function chaines(x: unknown, sortie: string[] = []): string[] {
  if (typeof x === "string") sortie.push(x);
  else if (Array.isArray(x)) x.forEach((v) => chaines(v, sortie));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!["code", "id", "categorie", "piece", "pieces", "compte", "sens", "type", "nature", "raison", "format", "parcours"].includes(k)) chaines(v, sortie);
  return sortie;
}

/** Tout ce qu'un scénario peut rendre : chaque situation, conséquence et bilan de chaque suite, et ses questions. */
function textesDuScenario(s: Scenario): string[] {
  const suites = (n: number): string[][] => (n === 0 ? [[]] : suites(n - 1).flatMap((x) => s.decisions[n - 1]!.options.map((o) => [...x, o])));
  const sortie = chaines({ titre: s.titre, accroche: s.accroche, objectifs: s.objectifs, accueil: s.accueil, questions: s.questions });
  for (let n = 0; n < s.decisions.length; n++) for (const x of suites(n)) chaines(s.situation(x), sortie);
  for (let n = 1; n <= s.decisions.length; n++) for (const x of suites(n)) chaines(s.consequence(x), sortie);
  for (const x of suites(s.decisions.length)) chaines(s.bilan(x), sortie);
  return sortie;
}

describe("la langue des activités", () => {
  const textes = [...LES_BUREAUX, ...LES_ENQUETES].flatMap((b) => chaines(b)).concat(LES_SCENARIOS.flatMap(textesDuScenario));
  const servis = [...[...LES_BUREAUX, ...LES_ENQUETES].flatMap((b) => chaines(servirLeBureau(b))), ...LES_SCENARIOS.flatMap((s) => chaines(servirLeScenario(s))), ...LES_SCENARIOS.flatMap((s) => chaines(corrigerAuScenario(s, { geste: "choisir", suite: [s.decisions[0]!.options[0]!] })))];

  it("se relève", () => {
    expect(textes.length).toBeGreaterThan(800);
  });

  it("ni tiret au milieu d'une phrase, ni tutoiement, ni le lexique que la maison n'emploie plus", () => {
    expect(textes.flatMap(tiretsAuMilieu)).toEqual([]);
    expect(textes.flatMap(tutoiements)).toEqual([]);
    for (const { mot, re } of LEXIQUE_INTERDIT) expect(textes.filter((t) => re.test(t)), mot).toEqual([]);
  });

  it("le signe « − » pour les négatifs, aucun nombre en lettres, aucune valeur absente, le président de la SAS", () => {
    for (const t of new Set(textes)) {
      expect(t, t).not.toMatch(/(^|[\s(])-\d/);
      expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object|null/);
      expect(t, t).not.toMatch(/\b(vingt|trente|quarante|cinquante|soixante|cent|mille)\b/i);
      expect(t, t).not.toMatch(/\bla présidente\b|\ble gérant\b|\bla gérante\b/i);
      expect(t, t).not.toMatch(/évènement/i);
    }
  });

  it("des phrases courtes, et les insécables de la typographie française dans ce qui est servi", () => {
    expect([...phrasesLongues(new Set(textes))]).toEqual([]);
    expect(servis.flatMap(espacesOrdinairesFautives)).toEqual([]);
  });
});
