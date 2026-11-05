import { describe, expect, it } from "vitest";
import { LE_CADRE_DE_LA_COMPTABILITE } from "../../src/config/cours/chapitres/le-cadre-de-la-comptabilite";
import { REMISES_ET_REGLEMENTS } from "../../src/config/cours/chapitres/remises-et-reglements";
import { VENTES_ET_ACHATS_AU_COMPLET, ventesEtAchatsDuChapitre } from "../../src/config/cours/chapitres/ventes-et-achats-au-complet";
import { COUT_DE_PASSATION } from "../../src/config/cours/monde/approvisionnement-de-nova";
import { CAMPUSTECH, ELECTRO_COMPOSANTS } from "../../src/config/cours/monde/exercice-de-nova";
import { PLACEMENTS } from "../../src/config/cours/monde/financer-et-placer";
import { ANNEE_N_PLUS_1 } from "../../src/config/cours/monde/nova-capacite";
import { COMPOSANTS_PAR_ENCEINTE, PRIX_DE_L_ENCEINTE, TAUX_DE_TVA } from "../../src/config/cours/monde/nova-gestion";
import { COMMANDE_DE_JEUX, COMMANDE_DE_LA_RENTREE, COMMANDE_DE_NOEL, JOURS_D_AVANCE, PORT_SOUS_LA_PASSATION, escompteApresLaFacture, tauxLePlusFort } from "../../src/config/cours/monde/ventes-et-achats-de-nova";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH } from "../../src/config/cours/situations/par-chapitre/la-commande-de-noel-de-campustech";
import { THEMES } from "../../src/config/cours/themes";
import type { Chapitre } from "../../src/config/cours/types";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { compteDuPlan } from "../../src/pedagogy/cours/plan-comptable";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * VENTES ET ACHATS AU COMPLET (NOVA en N + 1) : chaque chiffre refait à la main, à partir de la
 * commande de la rentrée de CampusTech (1 500 NOVA One à 59 € hors taxes, 30 % d'acompte, 480 € de
 * port, 30 palettes à 25 €, 24 rendues, 1 % d'escompte sur le solde, 10 % de rabais sur 40 enceintes)
 * et des jeux d'Électro-Composants Lyon (1 500 à 22 € commandés, 22,40 € facturés, 40 % d'acompte,
 * 150 € de port), la TVA à 20 % et le compte à terme à 2,8 %.
 */

const ch = VENTES_ET_ACHATS_AU_COMPLET;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const x = ventesEtAchatsDuChapitre(NOVA);

/** Les lignes d'une écriture, compte par compte, avec leur sens : + au débit, − au crédit. */
function lignesDe(source: Chapitre, id: string) {
  const e = etape(chapitreDuCas(source, NOVA), id, "ecriture").ecriture(NOVA);
  return Object.fromEntries(e.lignes.map((l) => [l.compte, l.sens === "debit" ? l.montant : -l.montant]));
}

describe("ventes et achats au complet : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 3), au thème, et cite le BTS CG P1 et le DCG UE9", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][3]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(3);
    expect(ch.blocs).toEqual(["BTS CG P1 · Contrôle et traitement comptable des opérations commerciales", "DCG UE9 · Comptabilité"]);
    expect(THEMES.find((t) => t.code === "comptabilite")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([REMISES_ET_REGLEMENTS.code]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("« Le cadre de la comptabilité » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(LE_CADRE_DE_LA_COMPTABILITE.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });

  it("chaque écriture, du chapitre et du cas, est équilibrée et ne prend que des comptes du plan du cours", () => {
    for (const s of [ch, LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "ecriture") continue;
        const a = e.ecriture(NOVA);
        const cote = (sens: "debit" | "credit") => c(a.lignes.filter((l) => l.sens === sens).reduce((t, l) => t + l.montant, 0));
        expect(cote("debit"), e.id).toBe(cote("credit"));
        for (const l of a.lignes) {
          expect(compteDuPlan(l.compte), `${e.id} : ${l.compte}`).toBeDefined();
          for (const k of l.acceptes ?? []) expect(compteDuPlan(k), `${e.id} : ${k}`).toBeDefined();
        }
      }
    }
  });
});

describe("une seule NOVA : la commande lit les partenaires et les prix des autres fiches", () => {
  it("CampusTech à 59 € et 80 jours, Électro-Composants à 22 €, la TVA à 20 %, le compte à terme à 2,8 %", () => {
    expect(COMMANDE_DE_LA_RENTREE.client).toBe(CAMPUSTECH.nom);
    expect(COMMANDE_DE_LA_RENTREE.prix).toBe(PRIX_DE_L_ENCEINTE);
    expect(COMMANDE_DE_LA_RENTREE.delaiHabituel).toBe(80);
    expect(COMMANDE_DE_JEUX.fournisseur).toBe(ELECTRO_COMPOSANTS.nom);
    expect(COMMANDE_DE_JEUX.prixConvenu).toBe(COMPOSANTS_PAR_ENCEINTE);
    expect(TAUX_DE_TVA).toBe(0.2);
    expect(PLACEMENTS.compteATerme.tauxAnnuel).toBe(0.028);
  });

  it("les commandes de la rentrée et de Noël tiennent dans la demande de N + 1 de leurs trimestres ; le port payé, dans le coût de passation", () => {
    expect(COMMANDE_DE_LA_RENTREE.enceintes).toBeLessThan(ANNEE_N_PLUS_1.demande[2]!);
    expect(COMMANDE_DE_NOEL.enceintes).toBeLessThan(ANNEE_N_PLUS_1.demande[3]!);
    expect(PORT_SOUS_LA_PASSATION).toBe(true);
    expect(COMMANDE_DE_JEUX.port).toBeLessThanOrEqual(COUT_DE_PASSATION);
  });
});

describe("les acomptes, refaits à la main", () => {
  it("l'acompte reçu : 1 500 × 59 × 1,2 × 30 % = 31 860 €, dont 26 550 € hors taxes et 5 310 € de TVA", () => {
    expect(c(1_500 * 59 * 1.2 * 0.3)).toBe(31_860);
    expect(x.acompteRecu).toEqual({ ttcDesEnceintes: 106_200, ttc: 31_860, ht: 26_550, tva: 5_310 });
    expect(lignesDe(ch, "l-acompte-recu")).toEqual({ "512": 31_860, "4191": -26_550, "44571": -5_310 });
    expect(juste(ch, "predire-la-tva-de-l-acompte")[0]).toMatch(/^Oui/);
  });

  it("l'acompte versé : 1 500 × 22 × 1,2 × 40 % = 15 840 €, dont 13 200 € hors taxes et 2 640 € de TVA", () => {
    expect(c(1_500 * 22 * 1.2 * 0.4)).toBe(15_840);
    expect(lignesDe(ch, "l-acompte-verse")).toEqual({ "4091": 13_200, "44566": 2_640, "512": -15_840 });
  });
});

describe("l'achat, refait à la main", () => {
  it("le contrôle : 0,40 € d'écart par jeu, 600 € hors taxes, 120 € de TVA, un avoir de 720 €", () => {
    expect(attendus(ch, "le-controle-des-trois-documents")).toEqual([0.4, 600, 120, 720]);
  });

  it("la facture : 33 600 € de jeux, 150 € de port, 6 750 € de TVA dont 4 110 € à déduire, 24 660 € à payer", () => {
    expect(c(33_750 * 0.2)).toBe(6_750);
    expect(c(33_750 + 6_750 - 15_840)).toBe(24_660);
    expect(lignesDe(ch, "la-facture-d-achat")).toEqual({ "601": 33_600, "6241": 150, "44566": c(6_750 - 2_640), "4091": -13_200, "401": -24_660 });
  });

  it("l'avoir du fournisseur : 720 € au 401, 600 € au 601, 120 € de TVA déductible", () => {
    expect(lignesDe(ch, "l-avoir-du-fournisseur")).toEqual({ "401": 720, "601": -600, "44566": -120 });
  });

  it("le curseur : NOVA paie 39 780 € pour les jeux ; il faut 38 % d'acompte (40 356 €), 37 % ne suffisent pas (39 294 €)", () => {
    expect(x.composants).toBe(c(15_840 + 24_660 - 720));
    expect(c(106_200 * 0.38)).toBeGreaterThanOrEqual(39_780);
    expect(c(106_200 * 0.37)).toBeLessThan(39_780);
    gardeDuCurseur(ch, "l-acompte-qui-couvre", 38);
  });
});

describe("la vente, refaite à la main", () => {
  it("la facture : 88 500 € d'enceintes, 88 980 € de base, 17 796 € de TVA, 750 € de palettes, 107 526 €, 75 666 € à payer", () => {
    expect(attendus(ch, "la-facture-de-vente")).toEqual([88_500, 88_980, 17_796, 750, 107_526, c(107_526 - 31_860)]);
  });

  it("la facture au journal impute l'acompte : 12 486 € de TVA restent à collecter", () => {
    expect(lignesDe(ch, "la-vente-au-journal")).toEqual({ "411": 75_666, "4191": 26_550, "701": -88_500, "7085": -480, "4196": -750, "44571": -c(17_796 - 5_310) });
  });

  it("l'escompte après facture : 1 % de 61 950 €, 619,50 € et 123,90 € de TVA ; CampusTech règle 74 922,60 €", () => {
    expect(c(88_500 - 26_550)).toBe(61_950);
    expect(lignesDe(ch, "l-escompte-au-journal")).toEqual({ "665": 619.5, "44571": 123.9, "411": -743.4 });
    expect(x.escompte.regle).toBe(c(75_666 - 743.4));
    expect(juste(ch, "predire-l-escompte-conditionnel")).toEqual(["Elle baisse, par une facture d'avoir"]);
    expect(juste(ch, "net-de-taxe-ou-conditionnel")).toEqual(["Le moment où la TVA baisse"]);
  });

  it("le laboratoire : à 75 jours, 0,5 % coûte 309,75 € pour 439,22 € d'intérêts ; 0,75 % coûte plus qu'il ne rapporte ; 1 % perd 182,45 €", () => {
    expect(JOURS_D_AVANCE).toBe(80 - 5);
    expect(c((c(75_666 - 371.7) * 0.028 * 75) / 360)).toBe(439.22);
    expect(escompteApresLaFacture(0.005, 75)).toMatchObject({ ht: 309.75, interets: 439.22 });
    expect(escompteApresLaFacture(0.0075, 75).gain).toBeLessThan(0);
    expect(tauxLePlusFort(75)).toBe(0.5);
    expect(c((74_922.6 * 0.028 * 75) / 360)).toBe(437.05);
    expect(x.escompte.gain).toBe(c(437.05 - 619.5));
    gardeDuLaboratoire(ch, "le-laboratoire-de-l-escompte");
  });

  it("les palettes : 24 rendues (600 €), 6 gardées vendues 150 € dont 25 € de TVA", () => {
    expect(lignesDe(ch, "le-retour-des-palettes")).toEqual({ "4196": 750, "411": -600, "7088": -125, "44571": -25 });
  });

  it("le rabais : 10 % de 40 × 59 €, 236 € et 47,20 € de TVA ; le compte de CampusTech finit créditeur de 883,20 €", () => {
    expect(lignesDe(ch, "l-avoir-de-rabais")).toEqual({ "709": 236, "44571": 47.2, "411": -283.2 });
    expect(x.solde).toBe(c(75_666 - 743.4 - 74_922.6 - 600 - 283.2));
    expect(x.solde).toBe(-883.2);
    expect(x.tva).toBe(c(5_310 + 12_486 - 123.9 + 25 - 47.2));
  });

  it("les mentions et la réserve de propriété", () => {
    const t = triDe(ch, "les-mentions");
    expect(Object.values(t).filter((k) => k === "nouvelle")).toHaveLength(3);
    expect(Object.values(t).filter((k) => k === "toujours")).toHaveLength(4);
    expect(juste(ch, "la-reserve-de-propriete")).toEqual(["Une clause de réserve de propriété, écrite avant la livraison"]);
  });
});

describe("le cas dédié : la commande de Noël de CampusTech", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH);
    gardeDuCas(LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH, ch);
  });

  it("2 000 enceintes, 25 % d'acompte, 600 € de port, 40 palettes dont 36 rendues : 107 020 € restent dus", () => {
    const s = LA_COMMANDE_DE_NOEL_DE_CAMPUSTECH;
    expect(c(2_000 * 59 * 1.2 * 0.25)).toBe(35_400);
    const montants = etape(chapitreDuCas(s, NOVA), "la-facture", "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants).toEqual([35_400, 118_600, 23_720, c(118_600 + 23_720 + 1_000), c(143_320 - 35_400)]);
    expect(lignesDe(s, "l-acompte")).toEqual({ "512": 35_400, "4191": -29_500, "44571": -5_900 });
    expect(lignesDe(s, "la-facture-au-journal")).toEqual({ "411": 107_920, "4191": 29_500, "701": -118_000, "7085": -600, "4196": -1_000, "44571": -17_820 });
    expect(lignesDe(s, "les-palettes")).toEqual({ "4196": 1_000, "411": -900, "7088": -83.33, "44571": -16.67 });
    const r = etape(s, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["107 020 €, palettes gardées comprises"]);
  });
});
