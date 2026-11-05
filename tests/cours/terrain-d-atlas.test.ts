import { describe, expect, it } from "vitest";
import { ATLAS_CONSEIL } from "../../src/config/cours/monde/atlas-conseil";
import {
  BUDGET_DES_SALONS,
  CALENDRIER_DU_COMMERCIAL,
  CARTE_DU_SECTEUR,
  ENTONNOIR_PAR_SEGMENT,
  FICHIER_DE_PROSPECTION,
  MARCHE_D_ATLAS,
  MATINALES,
  PIPELINE_DES_SALONS,
  PME_MOYENNES_ET_ETI,
  RECENCE_ET_COMMANDES,
  aRebours,
  chargeDeVisites,
  coutDUneVisite,
  joursDeTerrain,
  marcheDAtlas,
  matinales,
  pipelineDesSalons,
  qualiteDuFichier,
  salonRefait,
  salonsDeN,
  scoreRFM,
  segmentDuCompte,
  tourneesDuSecteur,
  valeurVieDUnGroupe,
  visitesDesComptesC,
} from "../../src/config/cours/monde/terrain-d-atlas";

/**
 * LE TERRAIN D'ATLAS CONSEIL (monde/terrain-d-atlas.ts), REFAIT À LA MAIN.
 *
 * Chaque chiffre est recalculé ici sur la fiche et sur les hypothèses du module, sans ses fonctions ; les
 * valeurs absolues sont épinglées. Le marché par segment, le fichier et son entonnoir, le score RFM, le
 * calendrier et les visites de Nadia, la carte du secteur, les salons, leur pipeline et les matinales.
 * Les liens avec la fiche (les 32 comptes, les contacts des canaux, les contrats des commerciaux, les
 * 17 200 € des stands) sont gardés dans tests/cours/atlas-conseil.test.ts.
 */

const f = ATLAS_CONSEIL;
const c = (x: number) => Math.round(x * 100) / 100 + 0;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const compte = (code: string) => f.comptes.find((k) => k.code === code)!;

describe("1. le marché et le fichier", () => {
  it("le marché en journées : 1 560, 11 700, 6 300 et 3 520 ; le cabinet y prend 4,4 %, 7,2 %, 8,7 % et 12,9 %", () => {
    const journees = MARCHE_D_ATLAS.map((s) => s.entreprises * s.partQuiAchete * s.journeesParAcheteur);
    expect(journees.map(c)).toEqual([1_560, 11_700, 6_300, 3_520]);
    const m = marcheDAtlas(f);
    expect(m.segments.map((s) => s.journeesDuMarche).map(c)).toEqual([1_560, 11_700, 6_300, 3_520]);
    expect(m.segments.map((s) => s.journees)).toEqual([68, 848, 550, 454]);
    expect(m.segments.map((s) => s.comptes)).toEqual([13, 11, 4, 4]);
    expect(m.segments.map((s) => Math.round(s.partDeMarche * 1000) / 10)).toEqual([4.4, 7.2, 8.7, 12.9]);
    expect(m.segments.map((s) => s.marge)).toEqual([32_640, 370_976, 219_400, 48_984]);
    expect(m.segments.map((s) => s.margeParCompte)).toEqual([c(32_640 / 13), c(370_976 / 11), 54_850, 12_246]);
  });

  it("la taille des comptes : 11 PME moyennes, 13 petites PME ; les segments refont les 32 comptes et les 1 382 400 €", () => {
    expect(PME_MOYENNES_ET_ETI).toHaveLength(11);
    for (const code of PME_MOYENNES_ET_ETI) expect(compte(code).clientele, code).toBe("pme");
    const par = (s: string) => f.comptes.filter((k) => segmentDuCompte(k) === s);
    expect(["petites-pme", "pme-moyennes", "grands-comptes", "public"].map((s) => par(s).length)).toEqual([13, 11, 4, 4]);
    expect(somme(f.comptes.map((k) => k.chiffreDAffaires))).toBe(54_400 + 657_040 + 402_800 + 268_160);
  });

  it("ce que vaut un compte : une petite PME 8 369,23 €, une PME moyenne gagnée en N 36 731,43 €", () => {
    const petites = f.comptes.filter((k) => segmentDuCompte(k) === "petites-pme");
    expect(valeurVieDUnGroupe(petites).valeurVie).toBe(c(c(32_640 / 13) / 0.3));
    expect(valeurVieDUnGroupe(petites).valeurVie).toBe(8_369.23);
    const neufs = ["ardel", "morand", "sauvagine", "pervenche", "quartzel", "rouviere", "lumen"].map(compte);
    expect(somme(neufs.map((k) => k.marge))).toBe(77_136);
    expect(valeurVieDUnGroupe(neufs).valeurVie).toBe(c(c(77_136 / 7) / 0.3));
    expect(valeurVieDUnGroupe(neufs).valeurVie).toBe(36_731.43);
  });

  it("le fichier : 2 200 lignes, 2 000 uniques, 85 % de complétude, 1 500 qualifiées, 1 320 utilisables, 60 %", () => {
    const k = FICHIER_DE_PROSPECTION;
    const lignes = 1_200 + 400 + 600;
    const uniques = lignes - k.doublons;
    const complets = uniques - k.incomplets;
    const qualifies = complets - k.horsCible;
    const utilisables = qualifies - k.opposes - k.sansNouvellesDepuisTroisAns;
    expect([lignes, uniques, complets / uniques, qualifies, utilisables, utilisables / lignes]).toEqual([2_200, 2_000, 0.85, 1_500, 1_320, 0.6]);
    expect(qualiteDuFichier()).toMatchObject({ lignes, uniques, tauxDeCompletude: 0.85, qualifies, utilisables, partUtilisable: 0.6 });
    expect(somme(Object.values(k.utilisablesParSegment))).toBe(utilisables);
  });

  it("l'entonnoir par segment : les 7 contrats sont chez les PME moyennes, à 10 %, 25 % et 35 %", () => {
    const e = ENTONNOIR_PAR_SEGMENT["pme-moyennes"];
    expect([e.rendezVous / e.contacts, e.devis / e.rendezVous, e.contrats / e.devis]).toEqual([0.1, 0.25, 0.35]);
    expect(ENTONNOIR_PAR_SEGMENT["petites-pme"].contrats).toBe(0);
  });

  it("à rebours : 8 comptes demandent 23 devis, 92 rendez-vous, 920 contacts ; il en manque 440 ; à 20 % de rendez-vous, 460", () => {
    const devis = Math.ceil(8 / 0.35);
    const rdv = Math.ceil(devis / 0.25);
    const contacts = Math.ceil(rdv / 0.1 - 1e-9);
    expect([devis, rdv, contacts, contacts - 480]).toEqual([23, 92, 920, 440]);
    expect(aRebours()).toMatchObject({ devis, rendezVous: rdv, contacts, manquants: 440, suffit: false });
    expect(aRebours({ tauxDeRendezVous: 0.2 })).toMatchObject({ contacts: 460, manquants: 0, suffit: true });
    // Un point de moins ne suffit pas : 92 ÷ 19 % = 484,2, soit 485 contacts.
    expect(aRebours({ tauxDeRendezVous: 0.19 }).contacts).toBe(485);
  });
});

describe("2. le score RFM", () => {
  it("les 32 comptes ont leur récence et leurs commandes, et chaque note suit la grille", () => {
    expect(Object.keys(RECENCE_ET_COMMANDES).sort()).toEqual(f.comptes.map((k) => k.code).sort());
    const note = (v: number, a: number, b: number, petit: boolean) => (petit ? (v <= a ? 3 : v <= b ? 2 : 1) : v >= a ? 3 : v >= b ? 2 : 1);
    const r = scoreRFM(f);
    for (const k of r.comptes) {
      const rf = RECENCE_ET_COMMANDES[k.code]!;
      expect(k.score, k.code).toBe(note(rf.recence, 2, 6, true) + note(rf.commandes, 5, 2, false) + note(k.chiffreDAffaires, 50_000, 10_000, false));
    }
    expect(["ferrand", "lumen", "garance"].map((x) => r.de(x).score)).toEqual([8, 4, 5]);
  });

  it("quatre groupes : 9 fidèles, 7 à développer, 9 à réveiller, 7 en sommeil ; tous les comptes en sommeil sont en classe C", () => {
    const r = scoreRFM(f);
    expect(r.groupes.map((g) => g.comptes.length)).toEqual([9, 7, 9, 7]);
    expect(new Set(r.groupes.find((g) => g.code === "en-sommeil")!.comptes.map((k) => k.classe))).toEqual(new Set(["C"]));
    // La Banque Ferrand, en classe B, est fidèle ; les Verreries Lumen, gagnées en N, sont à réveiller.
    expect([r.de("ferrand").classe, r.de("ferrand").groupe, r.de("lumen").classe, r.de("lumen").groupe]).toEqual(["B", "fideles", "C", "a-reveiller"]);
  });
});

describe("3. le secteur, les visites et les tournées", () => {
  it("le calendrier : 228 jours ouvrés, 175 jours de terrain, 350 visites", () => {
    const k = CALENDRIER_DU_COMMERCIAL;
    const ouvres = 365 - 104 - 25 - 8;
    expect([ouvres, ouvres - k.formation - k.bureau - k.salons]).toEqual([228, 175]);
    expect(joursDeTerrain()).toMatchObject({ ouvres: 228, terrain: 175, capacite: 350 });
  });

  it("la charge de Nadia : 4 A, 1 B, 14 C ; 110 visites de suivi, 220 rendez-vous d'affaires, 20 visites libres", () => {
    const v = chargeDeVisites(f);
    expect([v.comptesA, v.comptesB, v.comptesC]).toEqual([4, 1, 14]);
    expect([4 * 12 + 1 * 6 + 14 * 4, 50 + 58 + 44 + 68]).toEqual([110, 220]);
    expect([v.suivi, v.rendezVousDAffaires, v.charge, v.reste]).toEqual([110, 220, 330, 20]);
    // Les comptes C à distance rendent 56 × 75 % = 42 visites ; voir les C 2 fois par an en rend 28.
    expect(chargeDeVisites(f, "entreprises", { partDesCADistance: 1 }).reste).toBe(62);
    expect(chargeDeVisites(f, "entreprises", { frequenceC: 2 }).reste).toBe(48);
    expect(chargeDeVisites(f, "entreprises", { frequenceC: 5, partDesCADistance: 1 }).reste).toBe(58.5);
  });

  it("le coût d'une visite : 66 000 € ÷ 330 = 200 €, dont 160 € de temps et 40 € de route ; les C, 11 200 € pour 37 240 € de marge", () => {
    expect(coutDUneVisite(f)).toMatchObject({ coutAnnuel: (13_200 + 3_300) * 4, cout: 200, temps: 160, route: 40, aDistance: 40 });
    const v = visitesDesComptesC(f);
    expect([v.visites, v.cout, v.marge, v.fraisDeRoute]).toEqual([56, 11_200, 37_240, 2_240]);
  });

  it("les tournées : 155 km dans l'ordre de l'agenda, 130 km au mieux ; 11,25 € de route évités", () => {
    const d = CARTE_DU_SECTEUR.distances;
    expect(d["bureau-garance"]! + d["garance-lorvan"]! + d["lorvan-malvine"]! + d["bureau-malvine"]!).toBe(155);
    expect(d["bureau-garance"]! + d["garance-malvine"]! + d["lorvan-malvine"]! + d["bureau-lorvan"]!).toBe(130);
    const t = tourneesDuSecteur();
    expect([t.agenda.km, t.meilleure.km, t.kmEvites, t.coutEvite]).toEqual([155, 130, 25, 11.25]);
    expect(t.meilleure.ordre).toEqual(["garance", "malvine", "lorvan"]);
    expect([...new Set(t.toutes.map((x) => x.km))].sort()).toEqual([130, 155, 175]);
  });
});

describe("4. l'événement commercial", () => {
  it("les salons : 17 200 € de stands, 37 200 € de coût complet, 93 € le visiteur, 18 600 € le contrat", () => {
    expect(somme(BUDGET_DES_SALONS.map((l) => l.montant))).toBe(17_200);
    const s = salonsDeN(f);
    expect([s.budget, s.temps, s.coutComplet]).toEqual([17_200, 20_000, 37_200]);
    expect([s.margePremiereAnnee, s.valeurDUnCompte]).toEqual([(12_536 + 4_600) / 2, c((12_536 + 4_600) / 2 / 0.3)]);
    expect([s.contratsQuiPaientLaPremiereAnnee, s.contratsQuiPaientEnValeurVie]).toEqual([Math.ceil(37_200 / 8_568), Math.ceil(37_200 / 28_560)]);
    expect(s.bilan).toMatchObject({ coutParContact: 93, coutParRendezVous: 930, coutParCompte: 18_600, valeurCreee: 57_120, gain: 19_920 });
  });

  it("le pipeline : 9 920 € pondérés à 3 mois, 12 320 € à 6 mois, 0,8 compte attendu", () => {
    const o = PIPELINE_DES_SALONS.opportunites;
    expect(o.filter((x) => x.stade === "devis-remis")).toHaveLength(8 - 2 - PIPELINE_DES_SALONS.devisPerdus);
    const p = pipelineDesSalons();
    expect([p.aTroisMois, p.aSixMois]).toEqual([(24_000 + 16_000 + 9_600) * 0.2, (24_000 + 16_000 + 9_600) * 0.2 + (20_000 + 12_000 + 8_000 + 8_000) * 0.05]);
    expect(c(p.comptesAttendus)).toBe(0.8);
  });

  it("les matinales : 12 000 €, 60 prospects, 30 rendez-vous, 10 devis, 2,5 comptes ; 200 € le contact, 4 800 € le compte, 59 400 € de gain", () => {
    expect(somme(Object.values(MATINALES.coutDUneMatinale))).toBe(6_000);
    expect(matinales(f)).toMatchObject({ cout: 12_000, contacts: 60, rendezVous: 30, devis: 10, comptes: 2.5, coutParContact: 200, coutParCompte: 4_800, gain: 2.5 * 28_560 - 12_000 });
  });

  it("le salon refait : à 17 % de rendez-vous, il dépasse les matinales ; à 16 %, non", () => {
    expect(salonRefait(f).gain).toBe(19_920);
    expect(salonRefait(f, { tauxDeRendezVous: 0.17 }).gain).toBe(c(400 * 0.17 * 0.2 * 0.25 * 28_560 - 37_200));
    expect(salonRefait(f, { tauxDeRendezVous: 0.17 }).gain).toBeGreaterThanOrEqual(59_400);
    expect(salonRefait(f, { tauxDeRendezVous: 0.16 }).gain).toBeLessThan(59_400);
  });
});
