import { describe, expect, it } from "vitest";
import { LA_PREVISION_DES_VENTES, plusHautePartDansLaLigne, sommeDesCarres } from "../../src/config/cours/chapitres/la-prevision-des-ventes";
import {
  ajustementExponentiel,
  ajustementLineaire,
  coefficientsSaisonniers,
  moyennesMobilesDuMarche,
  novaEnN,
  previsionDeNPlus1,
  serieDuMarche,
  totauxAnnuels,
} from "../../src/config/cours/monde/prevision-des-ventes";
import { ANNEE_N, ANNEE_N_PLUS_1 } from "../../src/config/cours/monde/nova-capacite";
import { MARCHE_DES_ENCEINTES } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LES_JEUX_DU_PRINTEMPS, jeuxDuPrintemps } from "../../src/config/cours/situations/par-chapitre/les-jeux-du-printemps";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * PRÉVOIR LES VENTES : TENDANCE ET SAISONS (le marché des enceintes de N − 2 à N, NOVA en N + 1) :
 * chaque chiffre refait à la main, à partir de la série (14 700, 18 300, 15 720, 19 920 ; 17 000,
 * 21 400, 18 100, 22 800 ; 18 100, 24 900, 20 700, 26 200 enceintes) et des ventes de NOVA en N
 * (4 778, 6 081, 5 810, 6 940).
 */

const ch = LA_PREVISION_DES_VENTES;
const Y = [14_700, 18_300, 15_720, 19_920, 17_000, 21_400, 18_100, 22_800, 18_100, 24_900, 20_700, 26_200];
const T = Y.map((_, i) => i + 1);
const millieme = (x: number) => Math.round(Number((x * 1000).toPrecision(15))) / 1000;

describe("prévoir les ventes : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG P5, le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["BTS CG P5", "DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(new Set(ch.etapes.map((e) => e.titre)).size).toBe(ch.etapes.length);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
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

describe("la série et la tendance, refaites à la main", () => {
  it("la série : N − 2 et N − 1 de la fiche, N par les mois de nova-gestion et le second semestre", () => {
    expect(serieDuMarche().map((x) => x.marche)).toEqual(Y);
    expect(Y[8]).toBe(MARCHE_DES_ENCEINTES[0] + MARCHE_DES_ENCEINTES[1] + MARCHE_DES_ENCEINTES[2]);
    expect(Y[9]).toBe(MARCHE_DES_ENCEINTES[3] + MARCHE_DES_ENCEINTES[4] + MARCHE_DES_ENCEINTES[5]);
    const a = totauxAnnuels();
    expect(a.totaux).toEqual([68_640, 79_300, 89_900]);
    expect(a.hausses).toEqual([10_660, 10_600]);
    expect(a.taux).toEqual([15.5, 13.4]);
  });

  it("le point moyen (6,5 ; 19 820), puis a = 108 680 ÷ 143 = 760 et b = 19 820 − 760 × 6,5 = 14 880", () => {
    const yMoyen = Y.reduce((t, y) => t + y, 0) / 12;
    expect(yMoyen).toBe(19_820);
    const sxy = T.reduce((t, x, i) => t + (x - 6.5) * (Y[i]! - yMoyen), 0);
    const sxx = T.reduce((t, x) => t + (x - 6.5) ** 2, 0);
    expect([sxy, sxx]).toEqual([108_680, 143]);
    const d = ajustementLineaire();
    expect([d.tMoyen, d.yMoyen, d.sxy, d.sxx, d.a, d.b]).toEqual([6.5, 19_820, 108_680, 143, 760, 14_880]);
    expect(attendus(ch, "le-point-moyen")).toEqual([6.5, 19_820]);
    expect(attendus(ch, "la-droite")).toEqual([760, 14_880]);
  });

  it("les moyennes mobiles centrées : (14 700 ÷ 2 + 18 300 + 15 720 + 19 920 + 17 000 ÷ 2) ÷ 4 = 17 447,5 au rang 3", () => {
    const mm = moyennesMobilesDuMarche();
    expect(mm[2]).toBe((14_700 / 2 + 18_300 + 15_720 + 19_920 + 17_000 / 2) / 4);
    expect(mm.slice(2, 10)).toEqual([17_447.5, 18_122.5, 18_807.5, 19_465, 19_962.5, 20_537.5, 21_300, 22_050]);
    expect([mm[0], mm[1], mm[10], mm[11]]).toEqual([null, null, null, null]);
    expect(incoherencesDuTableau(etape(ch, "les-moyennes-mobiles", "a-completer").grille(NOVA))).toEqual([]);
  });

  it("le laboratoire des carrés : la somme des carrés est la plus petite à 760, seule solution", () => {
    expect(sommeDesCarres(760).somme).toBeLessThan(sommeDesCarres(750).somme);
    expect(sommeDesCarres(760).somme).toBeLessThan(sommeDesCarres(770).somme);
    expect(sommeDesCarres(760).b).toBe(14_880);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-des-carres");
    expect(e.defi(NOVA).solution).toEqual({ pente: 760 });
  });

  it("l'ajustement exponentiel : ln y sur t, une croissance de 3,9 % par trimestre, des corrélations voisines", () => {
    const e = ajustementExponentiel();
    expect(e.A).toBeCloseTo(1.0389, 4);
    expect(e.B).toBeCloseTo(15_242.74, 1);
    expect(ajustementLineaire().r).toBeCloseTo(0.774, 3);
    expect(e.r).toBeCloseTo(0.778, 3);
    expect(juste(ch, "le-choix-de-l-ajustement")).toEqual(["La droite : la hausse annuelle ne bouge presque pas"]);
  });
});

describe("la saison et la prévision, refaites à la main", () => {
  it("les rapports à la tendance au millième, et les coefficients : 0,894 ; 1,108 ; 0,901 ; 1,097, qui font 4", () => {
    const rapports = Y.map((y, i) => millieme(y / (760 * (i + 1) + 14_880)));
    expect(rapports).toEqual([0.94, 1.116, 0.916, 1.112, 0.91, 1.101, 0.896, 1.088, 0.833, 1.108, 0.891, 1.092]);
    const c = [0, 1, 2, 3].map((q) => millieme((rapports[q]! + rapports[q + 4]! + rapports[q + 8]!) / 3));
    expect(c).toEqual([0.894, 1.108, 0.901, 1.097]);
    const k = coefficientsSaisonniers();
    expect(k.coefficients).toEqual(c);
    expect([k.sommeBrute, k.corrige]).toEqual([4, false]);
    expect(incoherencesDuTableau(etape(ch, "les-rapports-a-la-tendance", "a-completer").grille(NOVA))).toEqual([]);
  });

  it("l'exponentielle donne des coefficients qui font 4,023 : on les corrige", () => {
    const k = coefficientsSaisonniers("exponentiel");
    expect(k.bruts).toEqual([0.897, 1.115, 0.907, 1.104]);
    expect(k.sommeBrute).toBe(4.023);
    expect(k.coefficients).toEqual(k.bruts.map((x) => millieme((x * 4) / 4.023)));
  });

  it("NOVA garde sa part de N, 23 609 ÷ 89 900 = 26,3 % ; le 1er trimestre de N + 1 : 24 760 × 0,894 = 22 135, × 26,3 % = 5 822", () => {
    const n = novaEnN();
    expect(n.ventes).toEqual(ANNEE_N.demande);
    expect([n.total, n.marcheTotal, n.part]).toEqual([23_609, 89_900, 26.3]);
    expect(Math.round(24_760 * 0.894)).toBe(22_135);
    expect(Math.round(22_135 * 0.263)).toBe(5_822);
    expect(attendus(ch, "la-prevision-du-marche")).toEqual([24_760, 22_135]);
    expect(attendus(ch, "la-part-de-nova")).toEqual([26.3, 5_822, 5_800]);
  });

  it("les 4 trimestres de N + 1 : 5 822, 7 437, 6 227, 7 801 enceintes, soit la demande de N + 1 du plan à la centaine", () => {
    const p = previsionDeNPlus1();
    const tendances = [13, 14, 15, 16].map((t) => 760 * t + 14_880);
    expect(p.trimestres.map((x) => x.tendance)).toEqual(tendances);
    const marche = tendances.map((t, i) => Math.round(t * [0.894, 1.108, 0.901, 1.097][i]!));
    expect(p.trimestres.map((x) => x.marche)).toEqual(marche);
    expect(marche).toEqual([22_135, 28_276, 23_678, 29_663]);
    expect(p.trimestres.map((x) => x.nova)).toEqual(marche.map((m) => Math.round(m * 0.263)));
    expect(p.trimestres.map((x) => x.nova)).toEqual([5_822, 7_437, 6_227, 7_801]);
    expect(p.trimestres.map((x) => x.plan)).toEqual(ANNEE_N_PLUS_1.demande);
    expect([p.nova, p.plan, p.auDelaDeLaLigne]).toEqual([27_287, 27_200, 437 + 801]);
    expect(incoherencesDuTableau(etape(ch, "la-prevision-de-l-annee", "a-completer").grille(NOVA))).toEqual([]);
    expect(juste(ch, "ce-que-la-prevision-annonce")).toEqual(["Le printemps et Noël dépassent la ligne"]);
  });

  it("le laboratoire : à 23,6 % du marché, Noël tient dans la ligne (29 663 × 23,6 % = 7 000) ; à 23,7 %, non", () => {
    expect(Math.round(29_663 * 0.236)).toBe(7_000);
    expect(Math.round(29_663 * 0.237)).toBeGreaterThan(7_000);
    expect(plusHautePartDansLaLigne("lineaire")).toBe(23.6);
    expect(plusHautePartDansLaLigne("exponentiel")).toBeLessThan(23.6);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-prevision");
  });

  it("plus loin : le rang 17, 27 800 × 0,894 = 24 853, × 26,3 % = 6 536", () => {
    expect(760 * 17 + 14_880).toBe(27_800);
    expect(attendus(ch, "plus-loin-que-n-plus-1")).toEqual([27_800, Math.round(27_800 * 0.894), Math.round(Math.round(27_800 * 0.894) * 0.263)]);
    expect(attendus(ch, "plus-loin-que-n-plus-1")).toEqual([27_800, 24_853, 6_536]);
  });
});

describe("le cas dédié : les jeux du printemps", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LES_JEUX_DU_PRINTEMPS);
    gardeDuCas(LES_JEUX_DU_PRINTEMPS, ch);
  });

  it("le printemps de N + 1 : 25 520 × 1,108 = 28 276, × 26,3 % = 7 437 ; la ligne en monte 7 000, 437 demandes sans enceinte", () => {
    expect(760 * 14 + 14_880).toBe(25_520);
    expect(Math.round(25_520 * 1.108)).toBe(28_276);
    expect(Math.round(28_276 * 0.263)).toBe(7_437);
    const j = jeuxDuPrintemps();
    expect([j.t.tendance, j.t.marche, j.t.nova, j.montees, j.sansEnceinte]).toEqual([25_520, 28_276, 7_437, 7_000, 437]);
    expect(attendus(LES_JEUX_DU_PRINTEMPS, "la-prevision-du-printemps")).toEqual([25_520, 28_276, 26.3, 7_437]);
    expect(attendus(LES_JEUX_DU_PRINTEMPS, "ce-que-la-ligne-montera")).toEqual([7_000, 437]);
    expect(juste(LES_JEUX_DU_PRINTEMPS, "reponse").map((t) => t.replace(/\s/g, " "))).toEqual(["7 000 jeux, ce que la ligne montera"]);
  });
});
