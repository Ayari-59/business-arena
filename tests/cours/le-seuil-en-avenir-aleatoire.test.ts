import { describe, expect, it } from "vitest";
import { LE_SEUIL_EN_AVENIR_ALEATOIRE, aleatoireDuChapitre, defiDuRisque, laboratoireDuRisque } from "../../src/config/cours/chapitres/le-seuil-en-avenir-aleatoire";
import { PILOTER_LA_QUALITE } from "../../src/config/cours/chapitres/piloter-la-qualite";
import { seuilDuMois } from "../../src/config/cours/chapitres/seuil-de-rentabilite";
import { repartitionNormale } from "../../src/config/cours/monde/loi-normale";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { ECART_TYPE_DE_LA_DEMANDE, cumulDeMois, moisAleatoireDeLaFiche, probabiliteDuResultat, seuilAleatoire } from "../../src/config/cours/monde/seuil-aleatoire";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { CAMPAGNE, UNE_CAMPAGNE_AU_SUCCES_INCERTAIN, campagneIncertaine } from "../../src/config/cours/situations/par-chapitre/une-campagne-au-succes-incertain";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE SEUIL DE PROFITABILITÉ EN AVENIR ALÉATOIRE (le mois de janvier de NOVA, ventes N(1 590 ; 150)) :
 * chaque chiffre refait à la main, à partir du seuil du chapitre « Le seuil de rentabilité » (59 €,
 * 38 € de coût variable, 31 183 € de charges fixes, 21 € de marge) et de la table de la loi normale.
 */

const ch = LE_SEUIL_EN_AVENIR_ALEATOIRE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
/** Une probabilité, à quatre décimales, comme la table. */
const p4 = (v: number) => Math.round(v * 1e4) / 1e4 + 0;
const x = aleatoireDuChapitre(NOVA);

describe("le seuil en avenir aléatoire : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite la DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["seuil-de-rentabilite", "les-leviers-du-seuil"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    // Le mot du programme 2025 : seuil de profitabilité.
    expect(ch.titre).toContain("seuil de profitabilité");
  });

  it("mène à « Piloter la qualité », par « Et ensuite »", () => {
    expect(ch.ensuite).toEqual([PILOTER_LA_QUALITE.code]);
    expect(suitesDuChapitre(ch.code).ensuite).toEqual([{ code: PILOTER_LA_QUALITE.code, titre: PILOTER_LA_QUALITE.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("une seule NOVA : le seuil est celui du chapitre « Le seuil de rentabilité »", () => {
  it("même prix, même coût variable, mêmes charges fixes, même espérance des ventes, même seuil", () => {
    const s = seuilDuMois(NOVA);
    expect(x.d).toEqual({ prix: s.m.prix, coutVariableUnitaire: s.s.coutVariableUnitaire, chargesFixes: s.s.chargesFixes, moyenne: s.m.quantite, ecartType: ECART_TYPE_DE_LA_DEMANDE });
    expect(x.x.seuil).toBe(s.s.seuilExact);
    expect(x.x.seuilValeur).toBe(s.seuilValeur);
    expect(x.x.resultat.esperance).toBe(s.s.resultat);
    expect(x.x.chiffreDAffaires.esperance).toBe(s.s.chiffreDAffaires);
    expect([x.d.prix, x.d.coutVariableUnitaire, x.d.chargesFixes, x.d.moyenne]).toEqual([59, 38, 19_700 + 10_650 + 833, 1_590]);
  });
});

describe("le seuil probabilisé, refait à la main", () => {
  it("centrer et réduire : 1 440 = 1 590 − 150, t = −1, Π(−1) = 1 − 0,8413 ; entre 1 440 et 1 740 : 0,8413 − 0,1587", () => {
    expect(attendus(ch, "centrer-et-reduire")).toEqual([-1, 0.1587, 0.6826]);
    expect(juste(ch, "lire-l-ecart-type")[0]).toMatch(/^2 janviers sur 3/);
  });

  it("le seuil : 31 183 ÷ 21 = 1 484,90 ; t = (1 484,90 − 1 590) ÷ 150 = −0,70 ; Π(0,70) = 0,7580, une perte 0,2420", () => {
    expect(c(31_183 / 21)).toBe(1_484.9);
    expect(Math.round(((31_183 / 21 - 1_590) / 150) * 100) / 100).toBe(-0.7);
    expect(attendus(ch, "la-probabilite-du-seuil")).toEqual([-0.7, 0.758, 0.242]);
    // La probabilité exacte, sans arrondir t : 0,7582.
    expect(x.x.probabiliteDeProfit).toBeCloseTo(0.7582, 4);
    expect(juste(ch, "predire-le-seuil")).toEqual(["Entre 60 et 90 %"]);
  });

  it("le résultat : R = 21X − 31 183, E(R) = 2 207 €, σ(R) = 21 × 150 = 3 150 €, P(R < 0) = Π(−0,70)", () => {
    expect(21 * 1_590 - 31_183).toBe(2_207);
    expect(attendus(ch, "la-loi-du-resultat")).toEqual([2_207, 3_150, 0.242]);
  });

  it("le chiffre d'affaires : E = 59 × 1 590 = 93 810 €, σ = 59 × 150 = 8 850 € ; P(CA < 90 000) = Π(−0,43) = 0,3336", () => {
    expect(attendus(ch, "la-loi-du-chiffre-d-affaires")).toEqual([93_810, 8_850, p4(1 - 0.6664)]);
    // Le seuil en valeur a la même variable centrée réduite que le seuil en quantité.
    expect((87_609.38 - 93_810) / 8_850).toBeCloseTo(x.x.t, 5);
  });

  it("l'objectif de 5 000 € : t = (5 000 − 2 207) ÷ 3 150 = 0,89, 1 − 0,8133 = 0,1867", () => {
    expect(Math.round(((5_000 - 2_207) / 3_150) * 100) / 100).toBe(0.89);
    expect(attendus(ch, "l-objectif-du-dirigeant")).toEqual([0.89, 0.1867]);
    expect(probabiliteDuResultat(x.x, 5_000)).toBeCloseTo(0.1876, 4);
  });

  it("la dispersion : à 300 d'écart-type, Π(0,35) = 0,6368 ; le curseur tient 82 enceintes (2 207 ÷ (1,2816 × 21) = 82,0)", () => {
    expect(x.double.profitLu).toBe(0.6368);
    expect(juste(ch, "predire-la-dispersion")).toEqual(["Baisse, vers 1 sur 2"]);
    expect(2_207 / (1.2816 * 21)).toBeCloseTo(82.0, 1);
    gardeDuCurseur(ch, "l-ecart-type-au-curseur", 82);
    expect(attendus(ch, "l-ecart-type-a-rebours")).toEqual([1.28, c(2_207 / 1.28), c(c(2_207 / 1.28) / 21)]);
  });

  it("le trimestre : E = 3 × 2 207 = 6 621 €, σ = 3 150 × √3 = 5 455,96 €, Π(−1,21) = 1 − 0,8869", () => {
    expect(c(3_150 * Math.sqrt(3))).toBe(5_455.96);
    expect(attendus(ch, "le-trimestre")).toEqual([6_621, 5_455.96, p4(1 - 0.8869)]);
    expect(cumulDeMois(x.x, 1).probabiliteDePerte).toBeCloseTo(x.x.probabiliteDePerte, 12);
    expect(juste(ch, "lire-le-trimestre")).toEqual(["Un mauvais mois se compense souvent par un bon"]);
  });

  it("la fourchette du directeur : 1 590 ± 1,96 × 150 = 1 296 à 1 884 ; à rebours, σ = 294 ÷ 1,96 = 150", () => {
    expect(x.fourchette).toEqual({ bas: 1_296, haut: 1_884 });
    expect(attendus(ch, "d-ou-vient-l-ecart-type")).toEqual([1_590, 1.96, 150]);
  });

  it("le mois redouté : 2 207 − 1,645 × 3 150 = −2 974,75 €", () => {
    expect(attendus(ch, "le-mois-redoute")).toEqual([1.645, c(2_207 - 1.645 * 3_150)]);
    expect(c(2_207 - 1.645 * 3_150)).toBe(-2_974.75);
  });
});

describe("le laboratoire du risque", () => {
  it("au départ, 75,82 % ; chaque levier seul : prix 60,50 €, coût variable 36,50 €, charges fixes 29 353 €, espérance 1 680, écart-type 80", () => {
    expect(defiDuRisque(NOVA_GESTION, x.depart)).toBe(false);
    expect(x.seul).toEqual({ prix: 60.5, coutVariable: 36.5, chargesFixes: 29_353, moyenne: 1_680, ecartType: 80 });
    // Les charges fixes : le seuil doit tomber à 1 590 − 1,2816 × 150 = 1 397,76, soit 21 × 1 397,76 = 29 353 €.
    expect(Math.floor(21 * (1_590 - 1.2815515655446008 * 150))).toBe(29_353);
    expect(defiDuRisque(NOVA_GESTION, { ...x.depart, chargesFixes: 29_354 })).toBe(false);
    expect(laboratoireDuRisque(NOVA_GESTION, { ...x.depart, ecartType: 80 }).probabiliteDeProfit).toBeCloseTo(repartitionNormale((1_590 - 31_183 / 21) / 80), 12);
    gardeDuLaboratoire(ch, "le-laboratoire-du-risque");
  });
});

describe("le cas dédié : une campagne au succès incertain", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UNE_CAMPAGNE_AU_SUCCES_INCERTAIN);
    gardeDuCas(UNE_CAMPAGNE_AU_SUCCES_INCERTAIN, ch);
  });

  it("1 600 € par mois, 100 ventes de plus, 190 d'écart-type : E(R) = 2 707 €, σ(R) = 3 990 €, la perte passe de 0,2420 à 0,2483", () => {
    expect(CAMPAGNE).toEqual({ coutParMois: 1_600, ventesEnPlus: 100, ecartType: 190 });
    const n = campagneIncertaine(NOVA);
    const montants = (id: string) => etape(chapitreDuCas(UNE_CAMPAGNE_AU_SUCCES_INCERTAIN, NOVA), id, "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants("la-loi-avec-la-campagne")).toEqual([c(32_783 / 21), 21 * 1_690 - 32_783, 21 * 190]);
    expect(Math.round(((32_783 / 21 - 1_690) / 190) * 100) / 100).toBe(-0.68);
    expect(montants("les-probabilites")).toEqual([0.242, p4(1 - 0.7517), p4(1 - 0.7157)]);
    expect(montants("le-mois-redoute")).toEqual([-2_974.75, c(2_707 - 1.645 * 3_990)]);
    expect(n.gain).toBe(500);
    const r = etape(UNE_CAMPAGNE_AU_SUCCES_INCERTAIN, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Un pari : 500 € de plus en moyenne, pour un risque un peu plus fort"]);
    // Le seuil probabilisé ne se lit pas sur l'espérance seule : la campagne monte les deux.
    expect(seuilAleatoire(moisAleatoireDeLaFiche(NOVA_GESTION)).resultat.esperance).toBeLessThan(n.avec.resultat.esperance);
  });
});
