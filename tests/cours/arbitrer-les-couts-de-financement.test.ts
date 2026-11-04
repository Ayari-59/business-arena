import { describe, expect, it } from "vitest";
import { ARBITRER_LES_COUTS_DE_FINANCEMENT, coutsDuChapitre, grilleDeLAnnuiteConstante, grilleDuCmpc } from "../../src/config/cours/chapitres/arbitrer-les-couts-de-financement";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { L_ASSOCIE_QUI_PREFERE_LA_DETTE, associeQuiPrefereLaDette } from "../../src/config/cours/situations/par-chapitre/l-associe-qui-prefere-la-dette";
import { compromis, detteOptimale, empruntObligataire, lesTroisModes } from "../../src/config/cours/monde/couts-de-financement";
import { comparaison } from "../../src/config/cours/monde/financement-de-la-gamme";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * ARBITRER LES COÛTS DE FINANCEMENT (DCG UE6 3.3), chez NOVA : chaque chiffre refait à la main.
 * L'emprunt de 80 000 € à 5 % sur 5 ans dans les trois modes, avec ou sans 800 € de frais ; le
 * placement privé de 800 obligations de 100 € émises à 98 €, coupon 4,5 %, 1 600 € de frais ;
 * l'action à 12 €, un dividende de 0,60 € en hausse de 4 % ; un bêta de 1,1 ; l'augmentation de
 * capital de juin N+1 ; l'impôt à 25 % ; le compromis sur un actif de 500 000 €.
 */

const ch = ARBITRER_LES_COUTS_DE_FINANCEMENT;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const vaMain = (flux: readonly number[], r: number) => c(flux.reduce((s, f, k) => s + f / (1 + r) ** (k + 1), 0));

describe("arbitrer les coûts de financement : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, à la fin du programme de la comptabilité générale (palier 4), au thème de l'analyse financière, et cite la DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    expect(CHAPITRES.at(-1)).toBe(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!.at(-1)).toBe(ch.titre);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres.at(-1)).toBe(ch.code);
    expect(ch.prerequis).toEqual(["la-valeur-et-le-temps", "emprunt-ou-credit-bail"]);
    for (const p of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("mène à la création de valeur (DSCG), et propose son cas", () => {
    expect(suitesDuChapitre(ch.code).ensuite.map((l) => l.code)).toEqual(["la-creation-de-valeur"]);
    expect(suitesDuChapitre(ch.code).situations.map((s) => s.code)).toEqual([L_ASSOCIE_QUI_PREFERE_LA_DETTE.code]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const src of [ch, L_ASSOCIE_QUI_PREFERE_LA_DETTE]) {
      for (const e of chapitreDuCas(src, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("l'emprunt bancaire, refait à la main", () => {
  it("in fine : 4 000 € d'intérêts par an, 20 000 € en tout ; l'annuité constante : 18 477,98 €", () => {
    expect(c((80_000 * 0.05) / (1 - 1.05 ** -5))).toBe(18_477.98);
    expect(attendus(ch, "trois-facons-de-rembourser")).toEqual([4_000, 20_000, 18_477.98]);
  });

  it("le tableau à annuité constante : des intérêts de 4 000 € à 879,91 €, 12 389,93 € en tout ; 12 000 € à amortissement constant", () => {
    const g = grilleDeLAnnuiteConstante(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    let du = 80_000;
    const interets: number[] = [];
    for (let k = 0; k < 5; k++) {
      const i = c(du * 0.05);
      interets.push(i);
      du = c(du - (k < 4 ? c(18_477.98 - i) : du));
    }
    expect(interets).toEqual([4_000, 3_276.1, 2_516.01, 1_717.91, 879.91]);
    expect(g.lignes.slice(0, 5).map((l) => l.cellules[1]!.valeur)).toEqual(interets);
    expect(g.lignes[5]!.cellules[1]!.valeur).toBe(12_389.93);
    expect(lesTroisModes().map((m) => m.interets)).toEqual([20_000, 12_389.93, 12_000]);
  });

  it("à taux égal, les trois modes coûtent 5 %, 3,75 % après impôt ; 800 € de frais les rendent inégaux", () => {
    const m = lesTroisModes();
    for (const x of m) {
      expect(c(100 * x.avantImpot)).toBe(5);
      expect(c(100 * x.apresImpot)).toBe(3.75);
    }
    expect(m.map((x) => c(100 * x.avecFrais))).toEqual([5.23, 5.36, 5.38]);
    // À la main : 79 200 = 18 477,98 × (1 − (1 + t)^−5) ÷ t, entre 5,36 % et 5,37 %.
    expect(vaMain([18_477.98, 18_477.98, 18_477.98, 18_477.98, 18_478.01], 0.0536)).toBeGreaterThan(79_200);
    expect(vaMain([18_477.98, 18_477.98, 18_477.98, 18_477.98, 18_478.01], 0.0537)).toBeLessThan(79_200);
    expect(attendus(ch, "le-cout-actuariel")).toEqual([3.75, 79_200]);
    expect(juste(ch, "predire-le-moins-cher")).toEqual(["Aucun : tous coûtent 5 %"]);
  });
});

describe("l'emprunt obligataire, refait à la main", () => {
  it("76 800 € nets pour 80 000 € à rendre, 3 600 € de coupons : 5,44 % avant impôt (76 916,95 € à 5,4 %, 76 583,77 € à 5,5 %)", () => {
    const flux = [3_600, 3_600, 3_600, 3_600, 83_600];
    expect(vaMain(flux, 0.054)).toBe(76_916.95);
    expect(vaMain(flux, 0.055)).toBe(76_583.77);
    const t = 5.4 + (0.1 * (76_916.95 - 76_800)) / (76_916.95 - 76_583.77);
    expect(attendus(ch, "l-emprunt-obligataire")).toEqual([800 * 98 - 1_600, 3_600, c(t)]);
    expect(c(t)).toBe(5.44);
  });

  it("après impôt : 640 € de charge étalée, 1 060 € d'impôt économisé, 2 540 € nets par an ; 4,08 %", () => {
    expect((1_600 + 1_600) / 5).toBe(640);
    expect((3_600 + 640) * 0.25).toBe(1_060);
    expect(attendus(ch, "l-obligataire-apres-impot")).toEqual([640, 1_060, 2_540]);
    expect(vaMain([2_540, 2_540, 2_540, 2_540, 82_540], 0.0407)).toBeGreaterThan(76_800);
    expect(vaMain([2_540, 2_540, 2_540, 2_540, 82_540], 0.0408)).toBeLessThan(76_800);
    expect(c(100 * empruntObligataire().apresImpot)).toBe(4.08);
  });
});

describe("les capitaux propres, refaits à la main", () => {
  it("0,60 € ÷ 12 € = 5 % ; + 4 % de croissance, 9 % ; MEDAF 3 % + 1,1 × 6 % = 9,6 %", () => {
    expect(attendus(ch, "par-le-dividende")).toEqual([5, 9]);
    expect(attendus(ch, "par-le-medaf")).toEqual([9.6]);
    expect(juste(ch, "predire-les-capitaux-propres")).toEqual(["Plus cher que l'emprunt"]);
  });

  it("l'augmentation : 5 000 actions à 12 €, 60 000 € ; 15,28 € puis 14,46 € l'action ; un BPA de 5,28 € puis 3,96 €", () => {
    expect(c(229_225.96 / 15_000)).toBe(15.28);
    expect(c(289_225.96 / 20_000)).toBe(14.46);
    expect(c(79_225.96 / 20_000)).toBe(3.96);
    expect(attendus(ch, "l-augmentation-de-capital")).toEqual([60_000, 15.28, 14.46, 3.96]);
  });

  it("l'associé qui ne souscrit pas : de 20 % à 15 % du capital, 2 460 € de valeur perdue", () => {
    expect(3_000 / 20_000).toBe(0.15);
    expect(c(3_000 * (15.28 - 14.46))).toBe(2_460);
    expect(juste(ch, "les-effets-pour-l-actionnaire")[0]).toMatch(/^Il pèse 15\s% des votes/);
  });
});

describe("le CMPC et le compromis, refaits à la main", () => {
  it("289 225,96 € à 9,6 % et 148 000 € à 3,75 % : 66,15 % et 33,85 %, un CMPC de 7,62 %", () => {
    const g = grilleDuCmpc(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const total = 289_225.96 + 68_000 + 80_000;
    expect(c(total)).toBe(437_225.96);
    const cmpc = (289_225.96 * 0.096 + 148_000 * 0.0375) / total;
    expect(c(100 * cmpc)).toBe(7.62);
    expect(g.lignes.map((l) => l.cellules[1]!.valeur)).toEqual([66.15, 33.85, 100]);
    expect(g.lignes[2]!.cellules[3]!.valeur).toBe(c(6.35 + 1.27));
    expect(c(100 * coutsDuChapitre(NOVA).cmpc.cmpc)).toBe(7.62);
  });

  it("le compromis : 0,25 D − 150 000 × (D ÷ 500 000)² est le plus grand à 200 000 € (26 000 €), plus à 175 000 € ni à 225 000 €", () => {
    const gain = (d: number) => 0.25 * d - 150_000 * (d / 500_000) ** 2;
    expect([gain(175_000), gain(200_000), gain(225_000)].map(c)).toEqual([25_375, 26_000, 25_875]);
    expect(compromis(200_000).gain).toBe(26_000);
    expect(detteOptimale()).toBe(200_000);
    expect([10, 20, 30, 40, 50].map((p) => detteOptimale(p))).toEqual([400_000, 300_000, 200_000, 150_000, 125_000]);
    gardeDuLaboratoire(ch, "le-laboratoire-du-compromis");
    expect(juste(ch, "predire-l-optimum")).toEqual(["Non, il y a un niveau à ne pas dépasser"]);
    expect(juste(ch, "le-financement-hierarchique")).toEqual(["Les dirigeants en savent plus que les investisseurs"]);
  });

  it("le crédit-bail entre au tableau des coûts au taux de son chapitre, 4,51 %", () => {
    expect(coutsDuChapitre(NOVA).creditBail).toBe(comparaison().tauxDuCreditBail);
    expect(c(100 * coutsDuChapitre(NOVA).creditBail)).toBe(4.51);
  });
});

describe("le cas dédié : l'associé qui préfère la dette", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(L_ASSOCIE_QUI_PREFERE_LA_DETTE);
    gardeDuCas(L_ASSOCIE_QUI_PREFERE_LA_DETTE, ch);
  });

  it("6 % × 0,75 = 4,5 % ; 3 % + 1,4 × 6 % = 11,4 % ; un CMPC de 7,86 % contre 7,62 %", () => {
    const x = associeQuiPrefereLaDette();
    const total = 437_225.96;
    const avecLaDette = (229_225.96 * 0.114 + 148_000 * 0.0375 + 60_000 * 0.045) / total;
    expect(c(100 * avecLaDette)).toBe(7.86);
    const montants = (id: string) => etape(chapitreDuCas(L_ASSOCIE_QUI_PREFERE_LA_DETTE, NOVA), id, "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants("les-couts")).toEqual([4.5, 11.4]);
    expect(montants("les-cmpc")).toEqual([7.62, 7.86]);
    expect(x.avecLaDette.total).toBe(x.avecLeCapital.total);
    const r = etape(L_ASSOCIE_QUI_PREFERE_LA_DETTE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["L'augmentation de capital : un CMPC de 7,62 %"]);
  });
});
