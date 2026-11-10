import { describe, expect, it } from "vitest";
import { CORRELATION_ET_LISSAGE, premierRangEcarte } from "../../src/config/cours/chapitres/correlation-et-lissage";
import { LA_PREVISION_DES_VENTES } from "../../src/config/cours/chapitres/la-prevision-des-ventes";
import {
  ajustementPuissance,
  correlationBrute,
  correlationCVS,
  correlationsDesAjustements,
  lissage,
  meilleurAlpha,
  previsionDeFevrier,
  serieCVS,
  tendancesAuRang,
} from "../../src/config/cours/monde/correlation-et-lissage";
import { ajustementExponentiel, ajustementLineaire } from "../../src/config/cours/monde/prevision-des-ventes";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { JANVIER_EST_TOMBE, janvierEstTombe } from "../../src/config/cours/situations/par-chapitre/janvier-est-tombe";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * PRÉVOIR LES VENTES : CORRÉLATION ET LISSAGE (DCG UE11 § 3.2) : chaque chiffre refait à la main, sur
 * le marché des enceintes de N − 2 à N (celui de « Prévoir les ventes : tendance et saisons ») et les
 * ventes en ligne de NOVA aux particuliers en N (1 270, 1 130, 1 418, 1 580, 1 710, 1 831, 1 600,
 * 1 150, 1 700, 1 650, 1 750, 2 000).
 */

const ch = CORRELATION_ET_LISSAGE;
const Y = [14_700, 18_300, 15_720, 19_920, 17_000, 21_400, 18_100, 22_800, 18_100, 24_900, 20_700, 26_200];
const K = [0.894, 1.108, 0.901, 1.097];
const P = [1_270, 1_130, 1_418, 1_580, 1_710, 1_831, 1_600, 1_150, 1_700, 1_650, 1_750, 2_000];
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);
const pearson = (xs: readonly number[], ys: readonly number[]) => {
  const mx = somme(xs) / xs.length;
  const my = somme(ys) / ys.length;
  const sxy = somme(xs.map((x, i) => (x - mx) * (ys[i]! - my)));
  return sxy / Math.sqrt(somme(xs.map((x) => (x - mx) ** 2)) * somme(ys.map((y) => (y - my) ** 2)));
};

describe("corrélation et lissage : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, cite le DCG UE11, et suit le chapitre de la prévision", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.blocs).toEqual(["DCG UE11 · Contrôle de gestion"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    expect(new Set(ch.etapes.map((e) => e.titre)).size).toBe(ch.etapes.length);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    expect(ch.prerequis).toEqual([LA_PREVISION_DES_VENTES.code]);
    expect(LA_PREVISION_DES_VENTES.ensuite).toContain(ch.code);
    // Le premier chapitre garde ses 17 étapes : trois techniques et leur expérience n'y tenaient pas sous 20.
    expect(LA_PREVISION_DES_VENTES.etapes.length + 3).toBeGreaterThan(19);
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

describe("la corrélation, refaite à la main", () => {
  it("sur la série brute : 108 680 ÷ √(143 × 137 876 000) = 0,774, r² = 0,599 ; celle de la droite du chapitre précédent", () => {
    const b = correlationBrute();
    expect([b.sxy, b.sxx, b.syy]).toEqual([108_680, 143, 137_876_000]);
    expect(108_680 / Math.sqrt(143 * 137_876_000)).toBeCloseTo(0.774, 3);
    expect(b.r).toBe(ajustementLineaire().r);
    expect(attendus(ch, "le-coefficient-de-correlation")).toEqual([0.774, 0.599]);
    expect(juste(ch, "predire-r")).toEqual(["Positif, mais abaissé par la saison"]);
  });

  it("la série CVS : chaque trimestre ÷ son coefficient, à l'enceinte ; r = 0,984, r² = 0,969", () => {
    const cvs = Y.map((y, i) => Math.round(y / K[i % 4]!));
    expect(serieCVS().map((x) => x.cvs)).toEqual(cvs);
    expect(cvs.slice(8)).toEqual([20_246, 22_473, 22_974, 23_883]);
    const c = correlationCVS();
    expect(c.sxy).toBe(95_829);
    expect(c.r).toBeCloseTo(pearson(Y.map((_, i) => i + 1), cvs), 12);
    expect(attendus(ch, "la-correlation-de-la-cvs")).toEqual([0.984, 0.969]);
    expect(incoherencesDuTableau(etape(ch, "la-serie-cvs", "a-completer").grille(NOVA))).toEqual([]);
  });
});

describe("les ajustements, refaits à la main", () => {
  it("la puissance : ln y = a ln t + ln b, a = 1,1137 ÷ 6,2842 = 0,1772, b = e^9,5849 = 14 543,51, 22 912 enceintes au rang 13", () => {
    const p = ajustementPuissance();
    const X = Y.map((_, i) => Math.log(i + 1));
    const L = Y.map((y) => Math.log(y));
    expect(p.r).toBeCloseTo(pearson(X, L), 12);
    expect(p.a).toBeCloseTo(0.1772, 4);
    expect(p.lnB).toBeCloseTo(9.5849, 4);
    expect(attendus(ch, "l-ajustement-puissance")).toEqual([0.1772, 9.5849, 14_543.51, 22_912]);
  });

  it("les coefficients des trois ajustements : la puissance est la plus faible sur les deux séries", () => {
    const b = correlationsDesAjustements("brute");
    const c = correlationsDesAjustements("cvs");
    expect([b.lineaire, b.exponentiel]).toEqual([ajustementLineaire().r, ajustementExponentiel().r]);
    expect(b.puissance).toBeCloseTo(0.757, 3);
    expect([c.lineaire, c.exponentiel, c.puissance].map((x) => Math.round(x * 1000) / 1000)).toEqual([0.984, 0.987, 0.932]);
    expect(juste(ch, "le-choix-de-l-ajustement")).toEqual(["Écarter la puissance : sa croissance ralentit trop"]);
  });

  it("le laboratoire des tendances : l'exponentielle dépasse la droite de plus de 1 000 enceintes au rang 16, pas au 15", () => {
    expect(tendancesAuRang(13).lineaire).toBe(24_760);
    expect(tendancesAuRang(15).exponentiel - tendancesAuRang(15).lineaire).toBeLessThan(1_000);
    expect(tendancesAuRang(16).exponentiel - tendancesAuRang(16).lineaire).toBeGreaterThan(1_000);
    expect(premierRangEcarte()).toBe(16);
    gardeDuLaboratoire(ch, "le-laboratoire-des-tendances");
  });
});

describe("le lissage exponentiel, refait à la main", () => {
  it("à α = 0,3 : février 1 270, mars 0,3 × 1 130 + 0,7 × 1 270 = 1 228, avril 1 285, mai 1 373,5, juin 1 474,45", () => {
    const l = lissage(0.3);
    expect(l.mois.slice(0, 5).map((m) => Math.round(m.prevision * 100) / 100)).toEqual([1_270, 1_228, 1_285, 1_373.5, 1_474.45]);
    expect(0.3 * 1_130 + 0.7 * 1_270).toBeCloseTo(1_228, 9);
    expect(incoherencesDuTableau(etape(ch, "le-lissage-a-la-main", "a-completer").grille(NOVA))).toEqual([]);
    expect(juste(ch, "predire-alpha")).toEqual(["Plus la prévision suit le dernier mois"]);
  });

  it("le meilleur α au dixième est 0,7 : la plus petite somme des carrés des erreurs de février à décembre", () => {
    const sse = (a: number) => {
      let p = P[0]!;
      let s = 0;
      for (let m = 1; m < P.length; m++) {
        // Deux décimales : l'erreur et chaque prévision s'arrondissent au centième, et la suivante en repart.
        s += Math.round((P[m]! - p) * 100) ** 2 / 10_000;
        p = Math.round((a * P[m]! + (1 - a) * p) * 100) / 100;
      }
      return s;
    };
    const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    expect(alphas.reduce((m, a) => (sse(a) < sse(m) ? a : m))).toBe(0.7);
    expect(meilleurAlpha()).toBe(0.7);
    expect(lissage(0.7).sommeDesCarres).toBeCloseTo(sse(0.7), 6);
    const e = gardeDuLaboratoire(ch, "le-laboratoire-du-lissage");
    expect(e.defi(NOVA).solution).toEqual({ alpha: 0.7 });
  });

  it("janvier N + 1 : 0,7 × 2 000 + 0,3 × 1 713,72 = 1 914,12 ; le lissage ne voit pas la saison", () => {
    const l = lissage(0.7);
    expect(Math.round(l.mois.at(-1)!.prevision * 100) / 100).toBe(1_713.72);
    expect(attendus(ch, "la-prevision-de-janvier")).toEqual([286.28, 1_914.12]);
    expect(juste(ch, "ce-que-le-lissage-ne-voit-pas")).toEqual(["Il ne voit pas la saison"]);
  });
});

describe("le cas dédié : janvier est tombé", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(JANVIER_EST_TOMBE);
    gardeDuCas(JANVIER_EST_TOMBE, ch);
  });

  it("1 400 ventes : erreur 1 400 − 1 914,12 = −514,12 ; février 0,7 × 1 400 + 0,3 × 1 914,12 = 1 554,24 ; à α = 0,3, 1 634,18", () => {
    const x = janvierEstTombe();
    expect(previsionDeFevrier().fevrier).toBeCloseTo(1_554.24, 2);
    expect(attendus(JANVIER_EST_TOMBE, "fevrier-au-alpha-retenu")).toEqual([-514.12, 1_554.24]);
    expect(attendus(JANVIER_EST_TOMBE, "fevrier-au-alpha-prudent")).toEqual([1_400 - 1_734.54, 1_634.18].map((v) => Math.round(v * 100) / 100));
    expect(x.sommes.prudent).toBeGreaterThan(x.sommes.retenu);
    expect(juste(JANVIER_EST_TOMBE, "reponse")[0]!.replace(/\s/g, " ")).toBe("1 554 colis, le lissage à α = 0,70");
  });
});
