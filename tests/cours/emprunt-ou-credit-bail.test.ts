import { describe, expect, it } from "vitest";
import { EMPRUNT_OU_CREDIT_BAIL, REDEVANCE_LIMITE, financementDuChapitre, grilleDeLEmprunt, grilleDuCreditBail } from "../../src/config/cours/chapitres/emprunt-ou-credit-bail";
import { LE_PLAN_DE_FINANCEMENT } from "../../src/config/cours/chapitres/le-plan-de-financement";
import { comparaison, comparaisonDuBanc, fluxDuCreditBail, CREDIT_BAIL_DE_LA_LIGNE, LIGNE_A_FINANCER } from "../../src/config/cours/monde/financement-de-la-gamme";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_BANC_EN_CREDIT_BAIL, bancEnCreditBail } from "../../src/config/cours/situations/par-chapitre/le-banc-en-credit-bail";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * EMPRUNT OU CRÉDIT-BAIL, LE COÛT APRÈS IMPÔT (la ligne semi-automatique de NOVA, 150 000 € HT,
 * amortie sur 6 ans) : chaque chiffre refait à la main. La banque prête à 5 % sur 5 ans, le capital
 * remboursé par 30 000 € chaque fin d'année ; le crédit-bail demande 5 redevances de 33 000 € et une
 * option de 15 000 €, la ligne rachetée amortie sur un an ; l'impôt est de 25 %.
 */

const ch = EMPRUNT_OU_CREDIT_BAIL;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
/** La VAN de flux rangés par date, à la main. */
const vanMain = (flux: readonly number[], r: number) => c(flux.reduce((s, f, k) => s + f / (1 + r) ** k, 0));

describe("emprunt ou crédit-bail : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème de l'analyse financière, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!.slice(-2)).toEqual([ch.titre, LE_PLAN_DE_FINANCEMENT.titre]);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["l-emprunt", "le-tri-et-le-choix-entre-deux-projets"]);
    for (const p of ch.prerequis!) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("mène au plan de financement, par « Et ensuite »", () => {
    expect(suitesDuChapitre(ch.code).ensuite).toEqual([{ code: LE_PLAN_DE_FINANCEMENT.code, titre: LE_PLAN_DE_FINANCEMENT.titre }]);
    expect(suitesDuChapitre(ch.code).situations.map((s) => s.code)).toEqual([LE_BANC_EN_CREDIT_BAIL.code]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const src of [ch, LE_BANC_EN_CREDIT_BAIL]) {
      for (const e of chapitreDuCas(src, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("l'emprunt après impôt, refait à la main", () => {
  it("N+1 : 7 500 € d'intérêts, 1 875 € d'impôt économisé, 35 625 € décaissés ; 3,75 % après impôt", () => {
    expect(c(150_000 * 0.05)).toBe(7_500);
    expect(c(7_500 * 0.25)).toBe(1_875);
    expect(attendus(ch, "l-emprunt-apres-impot")).toEqual([7_500, 1_875, 30_000 + 7_500 - 1_875, 3.75]);
    expect(juste(ch, "predire-le-moins-cher")).toEqual(["L'emprunt"]);
  });

  it("le tableau : des intérêts de 7 500 € à 1 500 €, 22 500 € en tout, 166 875 € décaissés nets ; actualisés à 3,75 %, ils valent les 150 000 € prêtés", () => {
    const g = grilleDeLEmprunt(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const interets = [150_000, 120_000, 90_000, 60_000, 30_000].map((d) => d * 0.05);
    expect(interets).toEqual([7_500, 6_000, 4_500, 3_000, 1_500]);
    const nets = interets.map((i) => 30_000 + i * 0.75);
    expect(g.lignes.slice(0, 5).map((l) => l.cellules[3]!.valeur)).toEqual(nets);
    expect(g.lignes[5]!.cellules.map((x) => x.valeur)).toEqual([22_500, 150_000, 5_625, 166_875]);
    expect(Math.abs(vanMain([150_000, ...nets.map((n) => -n)], 0.0375))).toBeLessThan(0.01);
  });
});

describe("le crédit-bail après impôt, refait à la main", () => {
  const flux = [150_000, -31_000, -31_000, -31_000, -31_000, -46_000, -2_500];

  it("chaque année : 24 750 € de redevance nette et 6 250 € d'économie perdue (25 000 € d'amortissement × 25 %) ; l'option en N+5 ; 3 750 € rendus en N+6", () => {
    expect(c(33_000 * 0.75)).toBe(24_750);
    expect(c((150_000 / 6) * 0.25)).toBe(6_250);
    expect(c(-6_250 + 15_000 * 0.25)).toBe(-2_500);
    expect(fluxDuCreditBail(CREDIT_BAIL_DE_LA_LIGNE, LIGNE_A_FINANCER).flux).toEqual(flux);
    const g = grilleDuCreditBail(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[4]!.valeur)).toEqual(flux);
    expect(juste(ch, "l-economie-perdue")).toEqual(["La ligne n'est pas à NOVA : elle ne l'amortit pas"]);
  });

  it("au coût de l'emprunt, 3,75 % : 153 463,81 € de décaissements actualisés, une VAN de −3 463,81 €", () => {
    expect(vanMain(flux, 0.0375)).toBeCloseTo(-3_463.81, 1);
    const [va, v] = attendus(ch, "la-van-au-cout-de-l-emprunt");
    expect(v).toBe(-3_463.81);
    expect(va).toBe(153_463.81);
    expect(comparaison().vanDeLEmprunt).toBe(0);
  });

  it("le taux actuariel : entre 4,5 % (VAN −45,78 €) et 4,6 % (+401,03 €), 4,51 % par interpolation ; 6,05 % avant impôt", () => {
    expect(vanMain(flux, 0.045)).toBeCloseTo(-45.78, 1);
    expect(vanMain(flux, 0.046)).toBeCloseTo(401.03, 1);
    expect(attendus(ch, "le-taux-actuariel")).toEqual([-45.78, 401.03, c(100 * (0.045 + (0.001 * 45.78) / (45.78 + 401.03)))]);
    expect(c(100 * comparaison().tauxDuCreditBail)).toBe(4.51);
    expect(c(100 * comparaison().tauxAvantImpot)).toBe(6.05);
    expect(juste(ch, "predire-le-taux")[0]).toMatch(/^Plus haut que 3,75\s%$/);
    gardeDuCurseur(ch, "le-taux-au-curseur", 46);
  });
});

describe("le laboratoire et l'expert", () => {
  it("le défi : la redevance la plus haute qui tient le coût de l'emprunt est 31 500 € (32 000 € la dépasse)", () => {
    expect(REDEVANCE_LIMITE).toBe(31_500);
    expect(comparaison({ redevance: 31_500 }).vanDuCreditBail).toBeGreaterThan(0);
    expect(comparaison({ redevance: 32_000 }).vanDuCreditBail).toBeLessThan(0);
    // À la main : 150 000 ≥ (0,75 R + 6 250) × a(5 ; 3,75 %) + 15 000 × 1,0375^−5 + 2 500 × 1,0375^−6.
    const a5 = (1 - 1.0375 ** -5) / 0.0375;
    const rMax = ((150_000 - 15_000 * 1.0375 ** -5 - 2_500 * 1.0375 ** -6) / a5 - 6_250) / 0.75;
    expect(Math.floor(rMax / 500) * 500).toBe(31_500);
    gardeDuLaboratoire(ch, "le-laboratoire-du-contrat");
  });

  it("le dépôt de garantie d'une redevance coûte 5 548,04 € en valeur actuelle : la VAN tombe à −9 011,85 € (−9 011,84 € sans arrondir chaque terme)", () => {
    const depot = c(-33_000 + 33_000 * 1.0375 ** -5);
    expect(depot).toBe(-5_548.04);
    expect(attendus(ch, "le-depot-de-garantie")).toEqual([depot, c(-3_463.81 + depot)]);
    expect(c(-3_463.81 + depot)).toBe(-9_011.85);
    expect(comparaison({ depot: 33_000 }).vanDuCreditBail).toBe(-9_011.84);
    expect(juste(ch, "au-dela-du-cout")).toEqual(["Il finance toute la ligne, sans apport"]);
  });

  it("le chapitre se calcule une fois, et ses chiffres tiennent ensemble", () => {
    const x = financementDuChapitre(NOVA);
    expect(financementDuChapitre(NOVA)).toBe(x);
    expect(x.decaissements).toBe(c(150_000 + 3_463.81));
  });
});

describe("le cas dédié : le banc en crédit-bail", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_BANC_EN_CREDIT_BAIL);
    gardeDuCas(LE_BANC_EN_CREDIT_BAIL, ch);
  });

  it("30 000 € HT : 4 950 € de redevance nette, 1 500 € perdus, −6 450 € par an, −7 950 € la dernière, +375 € ensuite ; VAN +135,82 €, 3,59 % contre 3,75 %", () => {
    const flux = [30_000, -6_450, -6_450, -6_450, -6_450, -7_950, 375];
    expect(c(6_600 * 0.75)).toBe(4_950);
    expect(c((30_000 / 5) * 0.25)).toBe(1_500);
    expect(comparaisonDuBanc().creditBail.flux).toEqual(flux);
    const montants = (id: string) => etape(chapitreDuCas(LE_BANC_EN_CREDIT_BAIL, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-flux")).toEqual([4_950, 1_500, -6_450, -7_950, 375]);
    expect(vanMain(flux, 0.0375)).toBeCloseTo(135.82, 1);
    expect(montants("la-comparaison")).toEqual([3.75, c(30_000 - 135.82), 135.82]);
    expect(c(100 * bancEnCreditBail().x.tauxDuCreditBail)).toBe(3.59);
    const r = etape(LE_BANC_EN_CREDIT_BAIL, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Le crédit-bail, de peu : 135,82 €"]);
  });
});
