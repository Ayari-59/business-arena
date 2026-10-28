import { describe, expect, it } from "vitest";
import { ATLAS_CONSEIL, type FicheDuCabinet } from "../../src/config/cours/monde/atlas-conseil";
import {
  abcParLeChiffreDAffairesEtParLaMarge,
  affaireEnPlus,
  anneeDuCabinet,
  baisseDePrixPourTous,
  campagne,
  capaciteDuTrimestre,
  chargesFixesDeLAnnee,
  classementABC,
  clientelesFaceAUneHausse,
  commissionPlafond,
  compteEnPlus,
  compteMoyen,
  comptesDuCommercial,
  contactsDeLaCampagne,
  contrepartieDUneRemise,
  coutDAcquisition,
  coutJournalierDUnConsultant,
  entonnoir,
  margesAnneeParAnnee,
  meilleurBudget,
  paliersDeLaCampagne,
  partEnDirectNecessaire,
  portefeuilleDeLAnnee,
  portefeuilleDEquilibre,
  prixPlancher,
  recruterOuFideliser,
  remiseDemandee,
  seuilDeRentabiliteDUnCommercial,
  tableauDeBordCommercial,
  trimestreDUnCommercial,
  trimestresDeLAnnee,
  valeurDUnClient,
  valeurVieAvecUnPartenaire,
  valeurVieClient,
} from "../../src/config/cours/monde/relation-client";

/**
 * LA RELATION CLIENT DU COURS (monde/relation-client.ts sur monde/atlas-conseil.ts), REFAITE À LA MAIN.
 *
 * Chaque chiffre attendu est recalculé ici sur la fiche, sans les fonctions du modèle ; les valeurs
 * absolues d'ATLAS CONSEIL sont épinglées (un changement de la fiche se voit). Le chiffre d'affaires
 * de N est le même par toutes les voies ; chaque décomposition retombe sur son total ; et les
 * propriétés qui font voir les notions sont gardées : un plancher qui sépare deux décisions, une
 * courbe de campagne concave, une classe A qui change avec la marge, un commercial sous son seuil.
 */

const f = ATLAS_CONSEIL;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const compte = (code: string) => f.comptes.find((c) => c.code === code)!;
const commercial = (code: string) => f.commerciaux.find((c) => c.code === code)!;
const canal = (code: string) => f.canaux.find((c) => c.code === code)!;
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const CA_DE_N = 1_382_400;

describe("la fiche d'ATLAS CONSEIL tient debout", () => {
  it("la capacité et le coût des consultants : 600 journées par trimestre, 220 € la journée", () => {
    expect(f.consultants.nombre * f.consultants.joursFacturablesParTrimestre).toBe(10 * 60);
    expect(capaciteDuTrimestre(f)).toBe(600);
    expect(f.consultants.nombre * f.consultants.coutAnnuel).toBe(f.chargesFixes.consultants);
    expect(528_000 / 2_400).toBe(220);
    expect(coutJournalierDUnConsultant(f)).toBe(220);
    expect(f.coutVariableDUneJournee.fraisDeMission + f.coutVariableDUneJournee.supports).toBe(150);
  });

  it("les journées de N : jamais plus que la capacité, jamais plus que la demande, le trimestre 4 plein", () => {
    expect(f.journeesVendues).toEqual([480, 510, 330, 600]);
    expect(f.journeesDemandees).toEqual([480, 510, 330, 680]);
    expect(somme(f.journeesVendues)).toBe(1_920);
    f.journeesVendues.forEach((v, i) => {
      expect(v).toBeLessThanOrEqual(600);
      expect(v).toBeLessThanOrEqual(f.journeesDemandees[i]!);
    });
  });

  it("les charges fixes : 921 600 €, et chaque poste refait sur la fiche", () => {
    expect(somme(Object.values(f.chargesFixes))).toBe(528_000 + 186_000 + 52_000 + 66_000 + 78_000 + 11_600);
    expect(chargesFixesDeLAnnee(f).total).toBe(921_600);
    expect(chargesFixesDeLAnnee(f).parTrimestre).toBe(230_400);
    // Les commerciaux : salaire chargé et frais, quatre trimestres.
    expect((14_400 + 3_600 + 13_200 + 3_300 + 9_600 + 2_400) * 4).toBe(f.chargesFixes.commerciaux);
    expect(somme(f.commerciaux.map((c) => (c.salaireCharge + c.frais) * 4))).toBe(186_000);
    // La prospection : les stands (17 200 €), la campagne digitale, le fichier (6 000 €), la commission de l'apporteur.
    expect(17_200 + canal("digital").cout + 6_000 + canal("apporteurs").cout).toBe(f.chargesFixes.prospection);
  });

  it("le portefeuille : 32 comptes, 1 920 journées, 1 382 400 €, 288 000 € de frais, 672 000 € de marge", () => {
    expect(f.comptes).toHaveLength(32);
    expect(new Set(f.comptes.map((c) => c.code)).size).toBe(32);
    expect(somme(f.comptes.map((c) => c.journees))).toBe(1_920);
    expect(somme(f.comptes.map((c) => c.chiffreDAffaires))).toBe(CA_DE_N);
    expect(somme(f.comptes.map((c) => c.frais))).toBe(150 * 1_920);
    for (const c of f.comptes) {
      expect(c.marge, c.nom).toBe(c.chiffreDAffaires - c.frais - 220 * c.journees);
      // Chaque compte paie un prix rond, au plus le prix catalogue.
      const prix = c.chiffreDAffaires / c.journees;
      expect([800, 760, 750, 720, 700, 640, 560], c.nom).toContain(prix);
    }
    expect(somme(f.comptes.map((c) => c.marge))).toBe(CA_DE_N - 288_000 - 422_400);
    expect(somme(f.comptes.map((c) => c.marge))).toBe(672_000);
    // Le fichier est dans l'ordre alphabétique : rien n'y est déjà classé.
    const noms = f.comptes.map((c) => c.nom);
    expect([...noms].sort((a, b) => a.localeCompare(b, "fr"))).toEqual(noms);
  });

  it("les risques de perte estimés s'additionnent à 8 comptes, l'attrition de N", () => {
    expect(somme(f.comptes.map((c) => c.attrition))).toBeCloseTo(8, 12);
    expect(8 / 32).toBe(0.25);
  });

  it("les 8 comptes neufs sont ceux que les canaux ont gagnés, et l'apporteur a touché 10 % du sien", () => {
    const neufs = f.comptes.filter((c) => c.anciennete === 0);
    expect(neufs).toHaveLength(8);
    for (const c of f.comptes) expect(c.origine === null, c.nom).toBe(c.anciennete > 0);
    for (const k of f.canaux) expect(neufs.filter((c) => c.origine === k.code), k.code).toHaveLength(k.contrats);
    expect(compte("helianthe").origine).toBe("apporteurs");
    expect(compte("helianthe").chiffreDAffaires * 0.1).toBe(canal("apporteurs").cout);
    // La prospection : le commercial de la conquête à plein temps et son fichier ; les salons : les stands et le temps des seniors.
    expect((9_600 + 2_400) * 4 + 6_000).toBe(canal("prospection").cout);
    expect(17_200 + 20_000).toBe(canal("salons").cout);
  });

  it("les trimestres des commerciaux refont exactement leurs comptes, et les journées du cabinet", () => {
    for (const c of f.commerciaux) {
      const comptes = f.comptes.filter((k) => k.commercial === c.code);
      expect(somme(c.n.map((t) => t.journees)), c.code).toBe(somme(comptes.map((k) => k.journees)));
      expect(somme(c.n.map((t) => t.chiffreDAffaires)), c.code).toBe(somme(comptes.map((k) => k.chiffreDAffaires)));
    }
    expect([0, 1, 2, 3].map((i) => somme(f.commerciaux.map((c) => c.n[i]!.journees)))).toEqual([264 + 200 + 16, 276 + 206 + 28, 164 + 122 + 44, 300 + 228 + 72]);
    expect([0, 1, 2, 3].map((i) => somme(f.commerciaux.map((c) => c.n[i]!.journees)))).toEqual([...f.journeesVendues]);
  });

  it("le portefeuille d'année en année s'enchaîne, et N retombe sur les 32 comptes du fichier", () => {
    const [n2, n1, n] = f.portefeuilleDesAnnees;
    expect(n2!.auPremierJanvier - n2!.perdus + n2!.nouveaux).toBe(n1!.auPremierJanvier);
    expect(n1!.auPremierJanvier - n1!.perdus + n1!.nouveaux).toBe(n!.auPremierJanvier);
    expect(n!.auPremierJanvier - n!.perdus + n!.nouveaux).toBe(f.comptes.length);
    expect(n!.auPremierJanvier - n!.perdus).toBe(f.comptes.filter((c) => c.anciennete > 0).length);
  });

  it("la campagne de N est un point de la courbe, et la courbe est concave", () => {
    expect(f.courbeDeLaCampagne.find((p) => p.budget === canal("digital").cout)!.contacts).toBe(canal("digital").contacts);
    const pentes = f.courbeDeLaCampagne.slice(1).map((p, i) => (p.contacts - f.courbeDeLaCampagne[i]!.contacts) / (p.budget - f.courbeDeLaCampagne[i]!.budget));
    expect(pentes.map((x) => x * 12_000)).toEqual([360, 240, 120, 30]);
    for (let i = 1; i < pentes.length; i++) expect(pentes[i]!).toBeLessThan(pentes[i - 1]!);
  });
});

describe("le chiffre d'affaires de N est le même partout : 1 382 400 €", () => {
  it("par les comptes, les commerciaux, les trimestres, l'année du cabinet, l'ABC et le tableau de bord", () => {
    expect(somme(f.commerciaux.flatMap((c) => c.n.map((t) => t.chiffreDAffaires)))).toBe(CA_DE_N);
    expect(176_000 + 184_000 + 109_600 + 201_360 + (156_000 + 161_200 + 94_840 + 179_400) + (12_000 + 21_000 + 33_000 + 54_000)).toBe(CA_DE_N);
    expect(anneeDuCabinet(f).chiffreDAffaires).toBe(CA_DE_N);
    expect(classementABC(f).total).toBe(CA_DE_N);
    expect(tableauDeBordCommercial(f).chiffreDAffaires).toBe(CA_DE_N);
    expect(baisseDePrixPourTous(f, 0.1).chiffreDAffaires).toBe(CA_DE_N);
    expect(compteMoyen(f).chiffreDAffaires * 32).toBe(CA_DE_N);
  });

  it("l'année : 720 € la journée en moyenne, 1 094 400 € de marge sur coût variable, 172 800 € de résultat", () => {
    const a = anneeDuCabinet(f);
    expect(a.prixMoyen).toBe(CA_DE_N / 1_920);
    expect(a.prixMoyen).toBe(720);
    expect(a.margeSurCoutVariable).toBe(CA_DE_N - 288_000);
    expect(a.coutDesConsultants).toBe(1_920 * 220);
    expect(a.marge).toBe(672_000);
    expect(a.resultat).toBe(1_094_400 - 921_600);
    // La marge des comptes moins les jours payés et non vendus, moins la structure, refait le même résultat.
    expect(672_000 - (2_400 - 1_920) * 220 - (921_600 - 528_000)).toBe(172_800);
  });
});

describe("1. le prix plancher et la marge de manœuvre", () => {
  const p = prixPlancher(f);

  it("le coût complet : 150 € + 921 600 € ÷ 1 920 journées = 630 €", () => {
    expect(p.coutVariable).toBe(100 + 50);
    expect(p.partDesFixes).toBe(921_600 / 1_920);
    expect(p.partDesFixes).toBe(480);
    expect(p.coutComplet).toBe(630);
  });

  it("la marge de manœuvre : 170 € sous le prix catalogue, 21,25 % de remise au plus, 21 % au pourcentage entier", () => {
    expect(p.margeDeManoeuvre).toBe(800 - 630);
    expect(p.remiseMaximale).toBe(170 / 800);
    expect(p.remiseMaximaleEntiere).toBe(21);
    // 21 % laisse 632 € ; 22 % ne laisse que 624 €, sous le coût complet.
    expect(800 * (1 - 0.21)).toBeGreaterThanOrEqual(630);
    expect(800 * (1 - 0.22)).toBeLessThan(630);
    expect(p.margeSurCoutVariable).toBe(650);
    expect(p.remiseMaximaleDUneAffaireEnPlus).toBe(650 / 800);
  });

  it("la remise demandée par le groupe Orvane : 20 % laisse 640 €, au-dessus du coût complet ; 25 % non", () => {
    const r = remiseDemandee(f);
    expect(r.prixRemise).toBe(800 * 0.8);
    expect(r.tient).toBe(true);
    expect(r.ecartAuCoutComplet).toBe(640 - 630);
    expect(r.coutDeLaRemiseParJournee).toBe(160);
    expect(remiseDemandee(f, 0.25).tient).toBe(false);
    expect(remiseDemandee(f, 0.25).ecartAuCoutComplet).toBe(600 - 630);
  });

  it("la contrepartie : 30 journées au prix catalogue laissent 19 500 € ; au prix remisé, il en faut 40", () => {
    const k = contrepartieDUneRemise(f);
    expect(k.margeSansRemise).toBe(30 * (800 - 150));
    expect(k.margeParJourneeRemisee).toBe(640 - 150);
    // 19 500 ÷ 490 = 39,8 : 40 journées, à la journée supérieure.
    expect(k.journeesNecessaires).toBe(Math.ceil(19_500 / 490));
    expect(k.journeesNecessaires).toBe(40);
    expect(k.journeesEnPlus).toBe(10);
    // Sous le coût variable, aucun volume ne paie la remise.
    expect(contrepartieDUneRemise(f, { remise: 0.85 }).journeesNecessaires).toBeNull();
  });

  it("une baisse de 10 % accordée à tous : plus de journées, plus de chiffre d'affaires, moins de marge", () => {
    const b = baisseDePrixPourTous(f, 0.1);
    // Les journées de N par clientèle, lues sur les comptes.
    const jours = (cl: string) => somme(f.comptes.filter((c) => c.clientele === cl).map((c) => c.journees));
    const ca = (cl: string) => somme(f.comptes.filter((c) => c.clientele === cl).map((c) => c.chiffreDAffaires));
    expect([jours("grands-comptes"), jours("pme"), jours("public")]).toEqual([550, 916, 454]);
    expect([ca("grands-comptes"), ca("pme"), ca("public")]).toEqual([402_800, 711_440, 268_160]);
    // 550 × 1,07 = 588,5 ; 916 × 1,16 = 1 062,56 ; 454 × 1,15 = 522,1 : à la journée inférieure.
    expect(b.clienteles.map((k) => k.journeesApres)).toEqual([588, 1_062, 522]);
    const apres = auCentime((402_800 / 550) * 0.9 * 588) + auCentime((711_440 / 916) * 0.9 * 1_062) + auCentime((268_160 / 454) * 0.9 * 522);
    expect(b.chiffreDAffairesApres).toBeCloseTo(apres, 2);
    expect(b.margeApres).toBeCloseTo(apres - 2_172 * 150, 2);
    expect(b.journeesApres).toBeGreaterThan(1_920);
    expect(b.chiffreDAffairesApres).toBeGreaterThan(CA_DE_N);
    expect(b.margeApres).toBeLessThan(CA_DE_N - 288_000);
    expect(b.depasseLaCapacite).toBe(false);
  });

  it("les clientèles qui tiennent le prix : une hausse de 10 % ferait perdre 7 %, 16 % et 15 % ; les grands comptes tiennent", () => {
    const h = clientelesFaceAUneHausse(f, 0.1);
    expect(h.clienteles.map((k) => Math.round(k.perte * 1000) / 10)).toEqual([7, 16, 15]);
    expect(h.tenace.code).toBe("grands-comptes");
  });
});

describe("2. la capacité et l'affaire acceptable", () => {
  it("les jours libres : 120, 90, 270, puis aucun au trimestre 4, où 80 journées ont été refusées", () => {
    const t = trimestresDeLAnnee(f);
    expect(t.map((x) => x.libres)).toEqual([600 - 480, 600 - 510, 600 - 330, 600 - 600]);
    expect(t.map((x) => x.refusees)).toEqual([0, 0, 0, 680 - 600]);
    expect(t[3]!.tauxDeService).toBe(600 / 680);
    expect(t.map((x) => x.occupation)).toEqual([0.8, 0.85, 0.55, 1]);
  });

  it("50 journées à 400 € au trimestre 3 : elles tiennent dans les jours libres, l'affaire rapporte 12 500 €", () => {
    const a = affaireEnPlus(f, { trimestre: 3 });
    expect(a.deplacees).toBe(0);
    expect(a.margeDeLAffaire).toBe(50 * (400 - 150));
    expect(a.gain).toBe(12_500);
    expect(a.acceptable).toBe(true);
    expect(a.prixPlancher).toBe(150);
  });

  it("les mêmes au trimestre 4, plein : elles prennent 50 journées au prix catalogue, l'affaire fait perdre 20 000 €", () => {
    const a = affaireEnPlus(f);
    expect(a.trimestre).toBe(4);
    expect(a.deplacees).toBe(50);
    expect(a.margePerdue).toBe(50 * (800 - 150));
    expect(a.gain).toBe(12_500 - 32_500);
    expect(a.acceptable).toBe(false);
    // Quand le carnet est plein, le plancher remonte au prix des clients qu'on évince.
    expect(a.prixPlancher).toBe(800);
  });

  it("avec 20 jours libres : 30 journées déplacées, −7 000 €, un plancher de 540 € ; il faut 31 jours libres à 400 €", () => {
    const a = affaireEnPlus(f, { joursLibres: 20 });
    expect(a.deplacees).toBe(30);
    expect(a.gain).toBe(12_500 - 30 * 650);
    expect(a.prixPlancher).toBe(150 + (30 / 50) * 650);
    expect(a.prixPlancher).toBe(540);
    expect(affaireEnPlus(f, { joursLibres: 20, prix: 540 }).gain).toBe(0);
    // 12 500 ÷ 650 = 19,2 : au plus 19 journées déplacées, donc au moins 31 jours libres.
    expect(a.joursLibresNecessaires).toBe(50 - Math.floor(12_500 / 650));
    expect(affaireEnPlus(f, { joursLibres: 31 }).gain).toBe(12_500 - 19 * 650);
    expect(affaireEnPlus(f, { joursLibres: 31 }).acceptable).toBe(true);
    expect(affaireEnPlus(f, { joursLibres: 30 }).acceptable).toBe(false);
  });
});

describe("3. la valeur d'un client", () => {
  it("l'attrition monte d'année en année : 5 sur 28, 7 sur 31, 8 sur 32 ; en N, 25 %", () => {
    expect(portefeuilleDeLAnnee(f, "N-2").attrition).toBe(5 / 28);
    expect(portefeuilleDeLAnnee(f, "N-1").attrition).toBe(7 / 31);
    const n = portefeuilleDeLAnnee(f);
    expect(n.attrition).toBe(8 / 32);
    expect(n.fidelisation).toBe(0.75);
    expect(n.actifs).toBe(32);
    expect(5 / 28).toBeLessThan(7 / 31);
  });

  it("le compte moyen : 43 200 € de chiffre d'affaires et 21 000 € de marge par an", () => {
    expect(compteMoyen(f).chiffreDAffaires).toBe(CA_DE_N / 32);
    expect(compteMoyen(f).marge).toBe(672_000 / 32);
  });

  it("la valeur vie : 4 ans de vie, 84 000 € simple, 60 000 € actualisée à 10 %", () => {
    const v = valeurDUnClient(f);
    expect(v.dureeDeVie).toBe(1 / 0.25);
    expect(v.simple).toBe(21_000 * 4);
    expect(v.actualisee).toBe(auCentime(21_000 / (0.25 + 0.1)));
    expect(v.actualisee).toBe(60_000);
  });

  it("le coût d'acquisition : 120 000 € pour 8 comptes, 15 000 € ; le rapport valeur vie ÷ coût entre 3 et 6", () => {
    expect(coutDAcquisition(f).cout).toBe(54_000 + 37_200 + 24_000 + 4_800);
    expect(coutDAcquisition(f).cac).toBe(120_000 / 8);
    const v = valeurDUnClient(f);
    expect(v.rapportSimple).toBe(84_000 / 15_000);
    expect(v.rapportActualise).toBe(60_000 / 15_000);
    for (const r of [v.rapportSimple, v.rapportActualise]) {
      expect(r).toBeGreaterThanOrEqual(3);
      expect(r).toBeLessThanOrEqual(6);
    }
  });

  it("année par année : la marge attendue s'érode, actualisée elle s'érode plus vite, et la somme tend vers 60 000 €", () => {
    const l = { marge: 21_000, attrition: 0.25, taux: 0.1 };
    const t = margesAnneeParAnnee(l, 3);
    expect(t.map((x) => x.attendue)).toEqual([21_000, 21_000 * 0.75, 21_000 * 0.75 * 0.75]);
    expect(t.map((x) => x.actualisee)).toEqual([auCentime(21_000 / 1.1), auCentime(15_750 / 1.21), auCentime(11_812.5 / 1.331)]);
    expect(margesAnneeParAnnee(l, 200).at(-1)!.cumulActualise).toBeCloseTo(60_000, 0);
    expect(margesAnneeParAnnee({ ...l, taux: 0 }, 200).at(-1)!.cumul).toBeCloseTo(84_000, 0);
    expect(valeurVieClient(l).actualisee).toBe(60_000);
  });

  it("le portefeuille d'équilibre : 8 recrues ÷ 25 % = 32 comptes, celui d'aujourd'hui ; il ne grossit plus", () => {
    const e = portefeuilleDEquilibre(f);
    expect(e.equilibre).toBe(8 / 0.25);
    expect(e.equilibre).toBe(f.comptes.length);
    expect(e.journeesParCompte).toBe(1_920 / 32);
    expect(e.journees).toBe(32 * 60);
    expect(e.occupation).toBe(1_920 / 2_400);
  });

  it("recruter ou fidéliser : 10 recrues donnent 40 comptes, 18,75 % d'attrition en donnent 42,7, mais au-delà de la capacité", () => {
    const r = recruterOuFideliser(f);
    expect(r.recruter.equilibre).toBe(10 / 0.25);
    expect(r.fideliser.equilibre).toBeCloseTo(8 / 0.1875, 12);
    expect(r.meilleur).toBe("fideliser");
    // 40 comptes × 60 journées remplissent la capacité ; 42,7 la dépassent : il faudrait un consultant de plus.
    expect(r.recruter.journees).toBe(2_400);
    expect(r.recruter.tient).toBe(true);
    expect(r.fideliser.journees).toBeCloseTo((8 / 0.1875) * 60, 9);
    expect(r.fideliser.tient).toBe(false);
  });
});

describe("4. l'entonnoir et le coût d'acquisition", () => {
  const e = entonnoir(f);
  const k = (code: string) => e.canaux.find((c) => c.code === code)!;

  it("canal par canal, chaque marche de l'entonnoir et le taux de transformation des devis", () => {
    expect([k("prospection").tauxDeRendezVous, k("prospection").tauxDeDevis, k("prospection").tauxDeTransformationDesDevis]).toEqual([60 / 1_200, 15 / 60, 3 / 15]);
    expect([k("salons").tauxDeRendezVous, k("salons").tauxDeDevis, k("salons").tauxDeTransformationDesDevis]).toEqual([40 / 400, 8 / 40, 2 / 8]);
    expect([k("digital").tauxDeRendezVous, k("digital").tauxDeDevis, k("digital").tauxDeTransformationDesDevis]).toEqual([50 / 600, 10 / 50, 2 / 10]);
    expect(k("digital").tauxDeTransformationGlobal).toBe(2 / 600);
    expect(e.total).toMatchObject({ contacts: 1_200 + 400 + 600 + 4, rendezVous: 154, devis: 35, contrats: 8 });
    expect(e.total.tauxDeTransformationDesDevis).toBe(8 / 35);
  });

  it("le coût d'acquisition par canal : 18 000 €, 18 600 €, 12 000 €, 4 800 € ; 15 000 € en tout", () => {
    expect(e.canaux.map((c) => c.cac)).toEqual([54_000 / 3, 37_200 / 2, 24_000 / 2, 4_800]);
    expect(e.canaux.map((c) => c.coutParContact)).toEqual([45, 93, 40, 1_200]);
    expect(e.canaux.map((c) => c.coutParDevis)).toEqual([3_600, 4_650, 2_400, 2_400]);
    expect(e.total.cac).toBe(15_000);
  });

  it("la courbe interpolée : 660 contacts pour 30 000 €, rien de plus au-delà de 48 000 €", () => {
    expect(contactsDeLaCampagne(f, 30_000)).toBe(600 + ((30_000 - 24_000) / 12_000) * (720 - 600));
    expect(contactsDeLaCampagne(f, 6_000)).toBe(180);
    expect(contactsDeLaCampagne(f, 60_000)).toBe(750);
    expect(contactsDeLaCampagne(f, 0)).toBe(0);
  });

  it("les paliers : 0, 1,2, 2, 2,4 et 2,5 comptes ; le compte en plus coûte 10 000, 15 000, 30 000 puis 120 000 €", () => {
    const p = paliersDeLaCampagne(f);
    expect(p.map((x) => x.comptes)).toEqual([0, 360, 600, 720, 750].map((c) => expect.closeTo(c / 300, 12)));
    expect(p.slice(1).map((x) => x.supplement!.cacMarginal)).toEqual([12_000 / 1.2, 12_000 / 0.8, 12_000 / 0.4, 12_000 / 0.1]);
    // Le coût moyen monte moins vite que le coût du compte en plus.
    expect(p.slice(1).map((x) => x.cacMoyen)).toEqual([10_000, 12_000, 15_000, 19_200]);
    const s = compteEnPlus(f, 24_000, 36_000);
    expect(s.comptes).toBeCloseTo(0.4, 12);
    expect(s.cacMarginal).toBe(30_000);
  });

  it("le budget où le dernier euro ne rapporte plus : 36 000 €, à la valeur vie simple comme actualisée", () => {
    const gains = [0, 1.2, 2, 2.4, 2.5].map((n, i) => n * 84_000 - i * 12_000);
    expect(gains).toEqual([0, 88_800, 144_000, 165_600, 162_000].map((g) => expect.closeTo(g, 6)));
    expect(paliersDeLaCampagne(f).map((x) => x.gain)).toEqual([0, 88_800, 144_000, 165_600, 162_000]);
    expect(meilleurBudget(f).budget).toBe(36_000);
    expect(meilleurBudget(f, { valeurDUnCompte: 60_000 }).budget).toBe(36_000);
    // Le dernier palier : 0,1 compte pour 12 000 €, soit 120 000 € le compte, plus que sa valeur vie.
    expect(12_000 / 0.1).toBeGreaterThan(84_000);
    // Sur la seule marge de la première année, on s'arrêterait trop tôt, au budget de N.
    expect(meilleurBudget(f, { valeurDUnCompte: 21_000 }).budget).toBe(24_000);
  });

  it("mieux transformer les devis (30 % au lieu de 20 %) rend payant le dernier palier", () => {
    const c = campagne(f, { budget: 48_000, tauxDeTransformationDesDevis: 0.3 });
    expect(c.comptes).toBeCloseTo(750 * (50 / 600) * (10 / 50) * 0.3, 12);
    expect(meilleurBudget(f, { tauxDeTransformationDesDevis: 0.3 }).budget).toBe(48_000);
  });
});

describe("5. les partenaires et la commission", () => {
  it("la plateforme à 20 % : 8 640 € la première année, 5 184 € ensuite, 24 192 € sur la vie du compte", () => {
    const p = valeurVieAvecUnPartenaire(f);
    expect(p.commissionPremiereAnnee).toBe(0.2 * 43_200);
    expect(p.commissionDesAnneesSuivantes).toBe(8_640 * (1 - 0.4));
    // Sur la vie : la première année, puis 3 années suivantes en moyenne ((1 − 25 %) ÷ 25 %).
    expect(p.commissionsSurLaVie).toBe(8_640 + 5_184 * 3);
    expect(p.avecLePartenaire).toBe(84_000 - 24_192);
    expect(p.enPropre).toBe(84_000 - 15_000);
    expect(p.meilleur).toBe("en-propre");
    // Le piège : sur la première année seule, la plateforme coûte moins que la conquête.
    expect(p.commissionPremiereAnnee).toBeLessThan(15_000);
  });

  it("la commission plafond : 15 000 ÷ (43 200 × 2,8) = 12,4 %, 12 % au pourcentage entier ; 34,7 % si l'on oublie les années suivantes", () => {
    const c = commissionPlafond(f);
    expect(c.facteur).toBeCloseTo(1 + 0.6 * 3, 12);
    expect(c.plafond).toBeCloseTo(15_000 / (43_200 * 2.8), 12);
    expect(c.plafondEntier).toBe(12);
    expect(valeurVieAvecUnPartenaire(f, "plateforme", { commission: 0.12 }).meilleur).toBe("partenaire");
    expect(valeurVieAvecUnPartenaire(f, "plateforme", { commission: 0.13 }).meilleur).toBe("en-propre");
    expect(c.plafondALaPremiereAnnee).toBe(15_000 / 43_200);
  });

  it("la part de comptes revenus en direct qui rendrait la plateforme à 20 % aussi bonne : 76 %", () => {
    const d = partEnDirectNecessaire(f);
    // 8 640 × (1 + 3 × (1 − d)) = 15 000.
    expect(d.part).toBeCloseTo(1 - (15_000 / 8_640 - 1) / 3, 12);
    expect(d.partEntiere).toBe(76);
    expect(valeurVieAvecUnPartenaire(f, "plateforme", { partQuiRevientEnDirect: 0.76 }).meilleur).toBe("partenaire");
    expect(valeurVieAvecUnPartenaire(f, "plateforme", { partQuiRevientEnDirect: 0.75 }).meilleur).toBe("en-propre");
  });

  it("actualisée, la plateforme reste plus chère que la conquête ; l'apporteur, payé une fois, est moins cher", () => {
    const a = valeurVieAvecUnPartenaire(f, "plateforme", { taux: 0.1 });
    expect(a.valeurVie).toBe(60_000);
    expect(a.commissionsSurLaVie).toBeCloseTo(8_640 / 1.1 + (5_184 * 0.75) / (1.1 * 0.35), 2);
    expect(a.meilleur).toBe("en-propre");
    const ap = valeurVieAvecUnPartenaire(f, "apporteur");
    expect(ap.commissionsSurLaVie).toBe(0.1 * 43_200);
    expect(ap.meilleur).toBe("partenaire");
  });
});

describe("6. le portefeuille ABC", () => {
  const abc = abcParLeChiffreDAffairesEtParLaMarge(f);

  it("par le chiffre d'affaires : 8 comptes en A, 25 % du portefeuille, 77,2 % des ventes", () => {
    const huit = [172_800, 160_000, 156_800, 136_800, 126_000, 117_040, 102_400, 96_000];
    expect(abc.parCa.classes.A.map((c) => c.code)).toEqual(["arveon", "ducastel", "valbrune", "serenoa", "bastide", "montbreme", "granvaux", "kerval"]);
    expect(abc.parCa.classes.A.map((c) => c.chiffreDAffaires)).toEqual(huit);
    expect(abc.parCa.A.part).toBeCloseTo(somme(huit) / CA_DE_N, 12);
    expect(somme(huit) / CA_DE_N).toBeLessThanOrEqual(0.8);
    // Le neuvième, la Banque Ferrand, fait passer la part cumulée au-delà de 80 % : il est le premier B.
    expect((somme(huit) + 56_000) / CA_DE_N).toBeGreaterThan(0.8);
    expect(abc.parCa.comptes[8]!.code).toBe("ferrand");
    expect([abc.parCa.A.comptes, abc.parCa.B.comptes, abc.parCa.C.comptes]).toEqual([8, 8, 16]);
  });

  it("une loi des 20/80 approchée, pas parfaite : 25 % des comptes, 77 % des ventes ; la moitié des comptes, 5 %", () => {
    expect(abc.parCa.A.partDesComptes).toBe(8 / 32);
    expect(abc.parCa.A.part).toBeGreaterThan(0.75);
    expect(abc.parCa.A.part).toBeLessThan(0.8);
    expect(abc.parCa.C.partDesComptes).toBe(0.5);
    expect(abc.parCa.C.part).toBeCloseTo(71_360 / CA_DE_N, 12);
    // Aucun compte ne pèse à lui seul un quart des ventes : le premier en fait 12,5 %.
    expect(abc.parCa.comptes[0]!.part).toBe(172_800 / CA_DE_N);
  });

  it("par la marge, la classe A change : le Centre hospitalier de Valbrune en sort, la Banque Ferrand y entre", () => {
    expect(abc.parMarge.classes.A.map((c) => c.code)).toEqual(["ducastel", "arveon", "serenoa", "bastide", "montbreme", "kerval", "ferrand", "granvaux"]);
    expect(abc.sortentDeA.map((c) => c.code)).toEqual(["valbrune"]);
    expect(abc.entrentEnA.map((c) => c.code)).toEqual(["ferrand"]);
    // Valbrune : 280 journées à 560 €, 290 € de frais par journée, 14 000 € de marge.
    expect(compte("valbrune").chiffreDAffaires).toBe(280 * 560);
    expect(compte("valbrune").marge).toBe(156_800 - 280 * 290 - 280 * 220);
    expect(abc.rangs.find((r) => r.code === "valbrune")).toMatchObject({ parCa: 3, parMarge: 11 });
    expect(abc.rangs.find((r) => r.code === "ferrand")).toMatchObject({ parCa: 9, parMarge: 7 });
    // La part cumulée des 8 premiers par la marge, puis le neuvième (Hélianthe) qui passe 80 %.
    const huit = 94_000 + 88_800 + 79_200 + 63_000 + 61_600 + 59_040 + 36_400 + 32_000;
    expect(abc.parMarge.A.valeur).toBe(huit);
    expect(huit / 672_000).toBeLessThanOrEqual(0.8);
    expect((huit + 31_200) / 672_000).toBeGreaterThan(0.8);
  });

  it("la règle des seuils : un compte qui atteint juste le seuil reste dans la classe, celui qui le dépasse passe à la suivante", () => {
    const huit = 172_800 + 160_000 + 156_800 + 136_800 + 126_000 + 117_040 + 102_400 + 96_000;
    expect(classementABC(f, "chiffreDAffaires", { a: huit / CA_DE_N, b: 0.95 }).A.comptes).toBe(8);
    expect(classementABC(f, "chiffreDAffaires", { a: huit / CA_DE_N - 0.0001, b: 0.95 }).A.comptes).toBe(7);
    // À 70 % et 90 % : les six premiers font 62,9 %, le septième mène à 70,3 %.
    const k = classementABC(f, "chiffreDAffaires", { a: 0.7, b: 0.9 });
    expect([k.A.comptes, k.B.comptes, k.C.comptes]).toEqual([6, 6, 20]);
    expect((huit - 102_400 - 96_000) / CA_DE_N).toBeLessThanOrEqual(0.7);
    expect((huit - 96_000) / CA_DE_N).toBeGreaterThan(0.7);
  });

  it("la frontière B et C : les comptes de la conquête restent en B, les petits comptes tombent en C", () => {
    const c = classementABC(f);
    const cumulAvantLumen = (CA_DE_N - 71_360) / CA_DE_N;
    expect(cumulAvantLumen).toBeLessThanOrEqual(0.95);
    expect(c.comptes.find((x) => x.code === "morand")!.classe).toBe("B");
    expect(c.comptes.find((x) => x.code === "lumen")!.classe).toBe("C");
    for (const k of f.comptes.filter((x) => x.commercial === "conquete")) expect(c.comptes.find((x) => x.code === k.code)!.classe, k.nom).toBe("B");
  });
});

describe("7. le tableau de bord commercial", () => {
  it("le seuil de rentabilité d'un commercial : son coût ÷ le taux de marge de ses comptes", () => {
    expect(comptesDuCommercial(f, "grands-comptes").tauxDeMarge).toBe(268_384 / 670_960);
    expect(268_384 / 670_960).toBe(0.4);
    expect(comptesDuCommercial(f, "conquete").tauxDeMarge).toBe(60_000 / 120_000);
    expect(seuilDeRentabiliteDUnCommercial(f, "grands-comptes").seuil).toBe(18_000 / 0.4);
    expect(seuilDeRentabiliteDUnCommercial(f, "conquete").seuil).toBe(12_000 / 0.5);
    expect(seuilDeRentabiliteDUnCommercial(f, "conquete").seuilDeLAnnee).toBe(96_000);
    expect(seuilDeRentabiliteDUnCommercial(f, "entreprises").seuil).toBe(auCentime(16_500 / (343_616 / 591_440)));
    // Payé à 10 % de commission, le commercial de la conquête devrait faire 12 000 ÷ 40 % = 30 000 €.
    expect(seuilDeRentabiliteDUnCommercial(f, "conquete", { tauxDeCommission: 0.1 }).seuil).toBe(30_000);
  });

  it("Hugo est sous son seuil aux trimestres 1 et 2, au-dessus ensuite et sur l'année", () => {
    const h = commercial("conquete");
    expect(h.n.map((t) => t.chiffreDAffaires < 24_000)).toEqual([true, true, false, false]);
    const t = TRIMESTRES_DE(h.code);
    expect(t.map((x) => x.sousLeSeuil)).toEqual([true, true, false, false]);
    expect(t.map((x) => x.resultat)).toEqual([12_000 * 0.5 - 12_000, 21_000 * 0.5 - 12_000, 33_000 * 0.5 - 12_000, 54_000 * 0.5 - 12_000]);
    const annee = tableauDeBordCommercial(f).commerciaux.find((c) => c.code === "conquete")!;
    expect(annee.chiffreDAffaires).toBe(120_000);
    expect(annee.chiffreDAffaires).toBeGreaterThan(96_000);
    expect(annee.resultat).toBe(120_000 * 0.5 - 48_000);
  });

  it("les indicateurs d'un trimestre, refaits à la main : transformation, panier, réalisation, évolution", () => {
    const n3 = trimestreDUnCommercial(f, "entreprises", 3);
    expect(n3.tauxDeTransformation).toBe(8 / 36);
    expect(n3.panier).toBe(94_840 / 8);
    expect(n3.realisationDeLObjectif).toBe(94_840 / 95_000);
    expect(n3.evolutionSurNMoins1).toBeCloseTo(94_840 / 91_000 - 1, 12);
    expect(n3.nMoins1.tauxDeTransformation).toBe(8 / 24);
    expect(n3.devisParRendezVous).toBe(36 / 44);
    const m4 = trimestreDUnCommercial(f, "grands-comptes", 4);
    expect(m4.panier).toBe(201_360 / 8);
    expect(m4.marge).toBe(201_360 * 0.4);
  });

  it("les voyants : Nadia transforme moins de 25 % de ses devis aux trimestres 3 et 4 ; Hugo s'allume aux trimestres 1 et 2 ; Marc reste vert", () => {
    const v = tableauDeBordCommercial(f).voyantsAllumes.map((x) => `${x.commercial} T${x.trimestre} ${x.indicateur}`);
    expect(v).toEqual([
      "entreprises T3 tauxDeTransformation",
      "entreprises T4 tauxDeTransformation",
      "conquete T1 realisationDeLObjectif",
      "conquete T1 tauxDeTransformation",
      "conquete T1 evolutionSurNMoins1",
      "conquete T1 seuilDeRentabilite",
      "conquete T2 realisationDeLObjectif",
      "conquete T2 evolutionSurNMoins1",
      "conquete T2 seuilDeRentabilite",
    ]);
    // Le chiffre d'affaires de Nadia tient l'objectif pendant que sa transformation décroche.
    const nadia = commercial("entreprises");
    expect(nadia.n.map((t) => t.contrats / t.devis < 0.25)).toEqual([false, false, true, true]);
    expect(nadia.n.map((t) => t.chiffreDAffaires / t.objectif >= 0.95)).toEqual([true, true, true, true]);
    expect(nadia.nMoins1.map((t) => t.contrats / t.devis)).toEqual([13 / 38, 13 / 38, 8 / 24, 14 / 40]);
  });

  it("le cabinet face à N − 1 : 1 358 000 €, puis 1 382 400 €, soit +1,8 %", () => {
    const t = tableauDeBordCommercial(f);
    expect(t.chiffreDAffairesN1).toBe(168_000 + 176_000 + 104_000 + 192_000 + (150_000 + 155_000 + 91_000 + 172_000) + (36_000 + 40_000 + 28_000 + 46_000));
    expect(t.evolutionSurNMoins1).toBeCloseTo(CA_DE_N / 1_358_000 - 1, 12);
    expect(t.cabinet.map((x) => x.chiffreDAffaires)).toEqual([344_000, 366_200, 237_440, 434_760]);
    expect(t.cabinet.map((x) => x.journees)).toEqual([...f.journeesVendues]);
  });

  it("le levier du trimestre : 12 devis transformés à 25 % au panier de 8 400 € feraient passer Hugo au-dessus de son seuil au trimestre 1", () => {
    const l = trimestreDUnCommercial(f, "conquete", 1, { devis: 12, tauxDeTransformation: 0.25, panier: 8_400 });
    expect(l.contrats).toBe(3);
    expect(l.chiffreDAffaires).toBe(3 * 8_400);
    expect(l.sousLeSeuil).toBe(false);
    expect(l.voyants).not.toContain("seuilDeRentabilite");
  });
});

/** Les quatre trimestres d'un commercial, lus par le modèle. */
function TRIMESTRES_DE(code: "grands-comptes" | "entreprises" | "conquete") {
  return ([1, 2, 3, 4] as const).map((t) => trimestreDUnCommercial(f, code, t));
}

describe("la garde voit le modèle et la fiche", () => {
  it("une fiche faussée change les chiffres attendus, partout de la même façon", () => {
    const faussee: FicheDuCabinet = { ...f, comptes: f.comptes.map((c) => (c.code === "arveon" ? { ...c, chiffreDAffaires: c.chiffreDAffaires - 2_400, marge: c.marge - 2_400 } : c)) };
    expect(anneeDuCabinet(faussee).chiffreDAffaires).toBe(CA_DE_N - 2_400);
    expect(classementABC(faussee).total).toBe(CA_DE_N - 2_400);
    expect(compteMoyen(faussee).marge).toBe((672_000 - 2_400) / 32);
    expect(prixPlancher({ ...f, prixCatalogue: 900 }).margeDeManoeuvre).toBe(900 - 630);
    expect(prixPlancher({ ...f, chargesFixes: { ...f.chargesFixes, loyer: 66_000 + 19_200 } }).coutComplet).toBe(150 + 940_800 / 1_920);
    expect(valeurDUnClient({ ...f, tauxDActualisation: 0.05 }).actualisee).toBe(70_000);
  });
});
