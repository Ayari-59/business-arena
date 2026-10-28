import { describe, expect, it } from "vitest";
import { casDeLEntreprise } from "../../src/config/cours/cas";
import { DEPRECIATIONS_ET_PROVISIONS } from "../../src/config/cours/chapitres/depreciations-et-provisions";
import { CAS_DES_ENTREPRISES } from "../../src/config/cours/monde/cas-des-entreprises";
import { cloture } from "../../src/config/cours/monde/cloture";
import { DELAI_MAXIMAL_CONVENU, NOVA_DELAIS } from "../../src/config/cours/monde/delais-et-tva";
import { creancesDuTrimestre, retardDeCampusTech } from "../../src/config/cours/monde/delais";
import { CAMPUSTECH, CREANCES_AU_31_DECEMBRE, EXERCICES_DU_COURS } from "../../src/config/cours/monde/exercice-de-nova";
import {
  AGENCEMENTS_DORIAC,
  CAMPUSTECH_MAUVAIS_PAYEUR,
  CSE_DES_LABORATOIRES_VERNAL,
  KERVAL_DISTRIBUTION,
  LOGISTIQUE_VARENNE,
  MAUVAIS_PAYEURS,
  RELANCES,
  clientDefaillant,
  suivreUnMauvaisPayeur,
} from "../../src/config/cours/monde/mauvais-payeurs";
import { DELAI_CONVENU_DE_CAMPUSTECH, DELAI_DE_CAMPUSTECH, NOVA_GESTION, RETARD_DE_CAMPUSTECH } from "../../src/config/cours/monde/nova-gestion";

/**
 * LES MAUVAIS PAYEURS DU MONDE DU COURS (décision du propriétaire, octobre 2026) : le délai convenu
 * est plafonné à 60 jours, mais des clients paient en retard. CampusTech, le client de NOVA, est un
 * mauvais payeur de base ; les autres entreprises en ont un en hypothèse ; un retard reste au 411, une
 * procédure collective fait une créance douteuse, dépréciée sur son hors taxes.
 */

describe("CampusTech, le mauvais payeur de base de NOVA", () => {
  it("60 jours convenus, le plafond légal, et 20 jours de retard : l'argent arrive au 80e jour", () => {
    expect(DELAI_CONVENU_DE_CAMPUSTECH).toBe(DELAI_MAXIMAL_CONVENU.joursDeLaFacture);
    expect(RETARD_DE_CAMPUSTECH).toBe(20);
    expect(DELAI_DE_CAMPUSTECH).toBe(80);
  });

  it("toutes les fiches de NOVA l'encaissent au 80e jour, et le cas le dit", () => {
    expect(NOVA_GESTION.semestre.clienteles.find((c) => c.code === "campustech")!.delai).toBe(DELAI_DE_CAMPUSTECH);
    expect(CAMPUSTECH.delai).toBe(DELAI_DE_CAMPUSTECH);
    expect(NOVA_DELAIS.campustech).toMatchObject({ delaiConvenu: 60, retard: 20, delaiReel: 80 });
    const v = CAS_DES_ENTREPRISES["nova"]!.venteCredit!;
    expect(v.delai).toBe(DELAI_DE_CAMPUSTECH);
    expect(v.echeance).toBe(v.date + DELAI_DE_CAMPUSTECH);
  });

  it("au 31 décembre N, trois factures en retard ou à venir, au 411, et aucune n'est douteuse", () => {
    const ct = CREANCES_AU_31_DECEMBRE.filter((c) => c.client === "CampusTech");
    expect(ct.map((c) => c.date.mois)).toEqual([10, 11, 12]);
    expect(ct.every((c) => !c.litigieuse)).toBe(true);
    // La facture d'octobre est échue le 20 décembre, 60 jours après sa date : elle est en retard à la clôture.
    expect(ct[0]!.echeance).toEqual({ jour: 10, mois: 1, exercice: 1 });
    const cl = cloture(EXERCICES_DU_COURS["nova"]!);
    const sonora = CREANCES_AU_31_DECEMBRE.find((c) => c.litigieuse)!;
    expect(cl.soldes["411"]).toBe(3 * 22_656);
    expect(cl.soldes["416"]).toBe(sonora.ttc);
  });

  it("le retard de base : 113,28 € de découvert et 150,83 € de pénalités par facture, une facture de plus au bilan", () => {
    const r = retardDeCampusTech(NOVA_DELAIS);
    expect(r.joursDeRetard).toBe(20);
    expect(r.coutDuRetardParFacture).toBe(113.28);
    expect(r.penalitesParFacture).toBe(150.83);
    expect(r.creanceEnPlusTTC).toBe(22_656);
    expect(creancesDuTrimestre(NOVA_DELAIS, 4).creancesTTC).toBe(3 * 22_656);
  });
});

describe("les mauvais payeurs des autres entreprises, en hypothèses", () => {
  it("aucun délai convenu ne dépasse le plafond légal ; chacun paie en retard", () => {
    for (const m of MAUVAIS_PAYEURS) {
      const s = suivreUnMauvaisPayeur(m);
      expect(s.delaiConvenuPermis, m.client).toBe(true);
      expect(s.retard, m.client).toBeGreaterThan(0);
      expect(s.compte).toBe("411");
      expect(s.depreciation).toBe(0);
    }
    expect(MAUVAIS_PAYEURS.map((m) => m.entreprise)).toEqual(["nova", "batiment", "conseil", "boutique"]);
    expect(MAUVAIS_PAYEURS.filter((m) => m.statut === "fait-de-la-fiche").map((m) => m.client)).toEqual(["CampusTech"]);
  });

  it("CampusTech : relancée le 68e jour, mise en demeure le 75e, payée le 80e ; NOVA finance le TTC", () => {
    const s = suivreUnMauvaisPayeur(CAMPUSTECH_MAUVAIS_PAYEUR);
    expect([s.echeance, s.relanceAmiable, s.miseEnDemeure, s.paiement]).toEqual([60, 60 + RELANCES.relanceAmiable, 60 + RELANCES.miseEnDemeure, 80]);
    expect(s.finance).toBe(22_656);
    expect(s.tvaAvanceeALEtat).toBe(3_776);
    expect(s.coutDuRetard).toBe(113.28);
    expect(s.reclamable).toBe(190.83);
  });

  it("MARTEL & FILS : Logistique Varenne, 36 000 € HT à 60 jours, payée 45 jours en retard ; la TVA attend l'encaissement", () => {
    const s = suivreUnMauvaisPayeur(LOGISTIQUE_VARENNE);
    expect([s.ht, s.tva, s.ttc, s.paiement]).toEqual([36_000, 7_200, 43_200, 105]);
    expect(s.tvaAvanceeALEtat).toBe(0);
    expect(s.finance).toBe(36_000);
    expect(s.coutDuRetard).toBe(405);
    expect(s.penalites).toBe(647.11);
  });

  it("ATLAS CONSEIL : Kerval, 30 400 € HT nets à 60 jours, payés 30 jours en retard", () => {
    const s = suivreUnMauvaisPayeur(KERVAL_DISTRIBUTION);
    expect([s.ht, s.ttc, s.paiement]).toEqual([30_400, 36_480, 90]);
    expect(s.finance).toBe(30_400);
    expect(s.coutDuRetard).toBe(228);
    expect(s.penalites).toBe(364.3);
  });

  it("MAILLE & CO : une commande de comité, 1 275 € HT à 45 jours, payée 30 jours en retard ; l'indemnité pèse plus que les pénalités", () => {
    const s = suivreUnMauvaisPayeur(CSE_DES_LABORATOIRES_VERNAL);
    expect([s.ht, s.ttc, s.delaiConvenu, s.paiement]).toEqual([1_275, 1_530, 45, 75]);
    expect(s.coutDuRetard).toBe(11.48);
    expect(s.penalites).toBe(15.28);
    expect(s.indemnite).toBeGreaterThan(s.penalites);
  });
});

describe("le client défaillant : de la créance douteuse à la perte", () => {
  it("Agencements Doriac (MARTEL & FILS) : 416 pour le TTC, dépréciation du HT, la TVA en attente s'annule à la perte", () => {
    const d = clientDefaillant(AGENCEMENTS_DORIAC);
    expect(d.reclassement).toEqual({ debit: "416", credit: "411", montant: 28_800 });
    expect(d.depreciation).toEqual({ debit: "6817", credit: "491", montant: 12_000 });
    expect(d.valeurNetteAuBilan).toBe(16_800);
    expect(d.tvaDejaReverseeALEtat).toBe(0);
    expect(d.irrecouvrable).toMatchObject({ perteHT: 12_000, tvaDeLaPerte: 2_400, tvaARecupererDeLEtat: 0, tvaEnAttenteAnnulee: 2_400 });
  });

  it("avec une TVA due à la livraison, comme chez NOVA, la TVA de la perte se récupère, mais seulement à l'irrécouvrabilité", () => {
    const d = clientDefaillant({ ...AGENCEMENTS_DORIAC, exigibilite: "livraison" });
    expect(d.tvaDejaReverseeALEtat).toBe(4_800);
    expect(d.depreciation.montant).toBe(12_000);
    expect(d.irrecouvrable.tvaARecupererDeLEtat).toBe(2_400);
  });

  it("Sonora (NOVA) : la clôture la reclasse au 416 et la déprécie sur son hors taxes", () => {
    const cl = cloture(EXERCICES_DU_COURS["nova"]!);
    const sonora = CREANCES_AU_31_DECEMBRE.find((c) => c.litigieuse)!;
    expect(cl.soldes["491"]).toBe(-sonora.ht * 0.4);
    expect(cl.soldes["6817"]).toBe(sonora.ht * 0.4);
  });
});

describe("le chapitre des dépréciations oppose le retard et la défaillance", () => {
  const cas = casDeLEntreprise("nova");
  const intro = DEPRECIATIONS_ET_PROVISIONS.etapes[0]!;

  it("le tableau des créances dit la facture d'octobre de CampusTech échue et en retard, pas les deux autres", () => {
    const lignes = intro.tableau!(cas).lignes.map((l) => l.libelle);
    expect(lignes.filter((l) => l.startsWith("CampusTech"))).toEqual([
      "CampusTech, facture du 20 octobre, échue le 20 décembre, en retard",
      "CampusTech, facture du 20 novembre",
      "CampusTech, facture du 20 décembre",
    ]);
  });

  it("l'introduction garde CampusTech au 411, sans dépréciation, face à Sonora en redressement", () => {
    if (intro.type !== "lecture") throw new Error("l'introduction est une lecture");
    const texte = intro.texte(cas).join(" ");
    expect(texte).toMatch(/CampusTech aussi doit de l'argent, et paie en retard : chaque facture 20 jours après les 60 jours convenus/);
    expect(texte).toMatch(/sa créance reste au compte 411, sans dépréciation/);
    expect(texte).toMatch(/redressement judiciaire/);
  });
});
