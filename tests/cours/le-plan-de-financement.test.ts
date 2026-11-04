import { describe, expect, it } from "vitest";
import { EMPRUNT_OU_CREDIT_BAIL } from "../../src/config/cours/chapitres/emprunt-ou-credit-bail";
import { LE_PLAN_DE_FINANCEMENT, grilleDeLEbauche, grilleDeLaCaf, grilleDuPlanEquilibre, planDuChapitre } from "../../src/config/cours/chapitres/le-plan-de-financement";
import { EMPRUNT_DU_PLAN_EQUILIBRE, planDeFinancementDeLaGamme, plusPetitEmpruntQuiEquilibre } from "../../src/config/cours/monde/financement-de-la-gamme";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_BANQUE_PLAFONNE_SON_PRET, banquePlafonnee, compteCourantQuiEquilibre } from "../../src/config/cours/situations/par-chapitre/la-banque-plafonne-son-pret";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE PLAN DE FINANCEMENT DE LA GAMME, DE N+1 À N+5 : chaque chiffre refait à la main. La gamme sur
 * la ligne semi-automatique (EBE de 6 250 €, 79 250 €, 120 050 €, 120 050 € et 71 750 € ; 33 000 €
 * de dotations par an ; BFR de 10 % du chiffre d'affaires, 16 230 €, 28 770 €, 37 620 €, 37 620 € et
 * 27 070 €), la ligne et les moules, 190 000 €, la réserve de 133 000 €, l'impôt à 25 %, la banque à
 * 5 % sur 5 ans, le capital remboursé en parts égales dès la fin de N+1.
 */

const ch = LE_PLAN_DE_FINANCEMENT;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const EBE = [6_250, 79_250, 120_050, 120_050, 71_750];
const BFR = [16_230, 28_770, 37_620, 37_620, 27_070];
const cafSansEmprunt = EBE.map((e) => c(e - (e - 33_000) * 0.25));

describe("le plan de financement : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème de l'analyse financière, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    expect(CHAPITRES.slice(-2)).toEqual([EMPRUNT_OU_CREDIT_BAIL, ch]);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres.slice(-2)).toEqual([EMPRUNT_OU_CREDIT_BAIL.code, ch.code]);
    expect(ch.prerequis).toEqual(["emprunt-ou-credit-bail", "soldes-intermediaires-de-gestion", "bilan-fonctionnel-et-bfr"]);
    for (const p of ch.prerequis!) expect(CHAPITRES.map((x) => x.code)).toContain(p);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    expect(suitesDuChapitre(ch.code).situations.map((s) => s.code)).toEqual([LA_BANQUE_PLAFONNE_SON_PRET.code]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const src of [ch, LA_BANQUE_PLAFONNE_SON_PRET]) {
      for (const e of chapitreDuCas(src, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("la CAF et le plan ébauché, refaits à la main", () => {
  it("le tri : l'investissement, le BFR qui grandit et le remboursement sont des emplois ; la réserve, la CAF, le BFR qui baisse et l'emprunt, des ressources", () => {
    const t = triDe(ch, "emplois-ou-ressources");
    expect(Object.values(t).filter((x) => x === "emploi")).toHaveLength(3);
    expect(Object.values(t).filter((x) => x === "ressource")).toHaveLength(4);
  });

  it("la CAF sans emprunt : EBE − (EBE − 33 000 €) × 25 %, soit 12 937,50 € en N+1 (une perte de 26 750 € qui fait économiser 6 687,50 €)", () => {
    expect(cafSansEmprunt).toEqual([12_937.5, 67_687.5, 98_287.5, 98_287.5, 62_062.5]);
    const g = grilleDeLaCaf(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes[4]!.cellules.map((x) => x.valeur)).toEqual(cafSansEmprunt);
    expect(g.lignes[3]!.cellules[0]!.valeur).toBe(-6_687.5);
  });

  it("l'ébauche : N+1 manque de 60 292,50 € (206 230 € d'emplois, 145 937,50 € de ressources) ; le cumul finit à 255 192,50 €", () => {
    const dBfr = BFR.map((b, i) => c(b - (i > 0 ? BFR[i - 1]! : 0)));
    expect(dBfr).toEqual([16_230, 12_540, 8_850, 0, -10_550]);
    const emplois = [190_000 + 16_230, 12_540, 8_850, 0, 0];
    const ressources = [133_000 + cafSansEmprunt[0]!, cafSansEmprunt[1]!, cafSansEmprunt[2]!, cafSansEmprunt[3]!, cafSansEmprunt[4]! + 10_550];
    const soldes = ressources.map((r, i) => c(r - emplois[i]!));
    expect(soldes).toEqual([-60_292.5, 55_147.5, 89_437.5, 98_287.5, 72_612.5]);
    const g = grilleDeLEbauche(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const solde = g.lignes.find((l) => l.libelle === "Solde de l'année")!;
    expect(solde.cellules.map((x) => x.valeur)).toEqual(soldes);
    expect(planDuChapitre(NOVA).ebauche.cumulFinal).toBe(c(soldes.reduce((s, x) => s + x, 0)));
    expect(c(soldes.reduce((s, x) => s + x, 0))).toBe(255_192.5);
    expect(juste(ch, "lire-l-ebauche")).toEqual(["Par un emprunt en N+1, remboursé par les excédents"]);
  });
});

describe("l'équilibrage, refait à la main", () => {
  it("80 000 € sur 5 ans : 4 000 € d'intérêts, 16 000 € remboursés, une CAF de 9 937,50 €, N+1 à 707,50 € ; 79 000 € laissent N+1 à −55 €", () => {
    const caf = c(12_937.5 - 4_000 * 0.75);
    expect(caf).toBe(9_937.5);
    expect(c(133_000 + 80_000 + caf - (206_230 + 16_000))).toBe(707.5);
    expect(c(133_000 + 79_000 + (12_937.5 - 3_950 * 0.75) - (206_230 + 15_800))).toBe(-55);
    expect(attendus(ch, "l-ajustement")).toEqual([4_000, 16_000, 9_937.5, 707.5]);
    expect(EMPRUNT_DU_PLAN_EQUILIBRE).toBe(80_000);
    expect(plusPetitEmpruntQuiEquilibre({}, 1_000)).toBe(80_000);
    expect(plusPetitEmpruntQuiEquilibre()).toBe(80_000);
    expect(juste(ch, "predire-l-emprunt")[0]).toMatch(/^80\s000 €$/);
    gardeDuCurseur(ch, "l-emprunt-au-curseur", 80);
  });

  it("le plan équilibré : chaque année positive, 12 000 € d'intérêts, 246 192,50 € cumulés fin N+5", () => {
    const g = grilleDuPlanEquilibre(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const p = planDeFinancementDeLaGamme({ emprunt: 80_000 });
    expect(p.equilibre).toBe(true);
    const interets = [80_000, 64_000, 48_000, 32_000, 16_000].map((d) => d * 0.05);
    expect(p.interets).toBe(interets.reduce((s, x) => s + x, 0));
    const cafs = cafSansEmprunt.map((x, i) => c(x - interets[i]! * 0.75));
    expect(p.annees.map((a) => a.caf)).toEqual(cafs);
    expect(p.annees.map((a) => a.solde)).toEqual([707.5, 36_747.5, 71_637.5, 81_087.5, 56_012.5]);
    expect(p.cumulFinal).toBe(246_192.5);
  });

  it("le laboratoire : sur 3 ans il faut 100 000 €, sur 4 ans 90 000 €, sur 5 ans et plus 80 000 €", () => {
    expect([3, 4, 5, 6, 7].map((d) => plusPetitEmpruntQuiEquilibre({ dureeDeLEmprunt: d }))).toEqual([100_000, 90_000, 80_000, 80_000, 80_000]);
    gardeDuLaboratoire(ch, "le-laboratoire-du-plan");
  });
});

describe("le crédit-bail dans le plan, et le choix", () => {
  it("la ligne en crédit-bail : 56 230 € d'emplois en N+1, une CAF de −18 062,50 €, un solde de 58 707,50 € sans emprunt ; 235 192,50 € cumulés", () => {
    const caf = c(6_250 - 33_000 - (6_250 - 33_000 - 8_000) * 0.25);
    expect(caf).toBe(-18_062.5);
    expect(attendus(ch, "le-credit-bail-dans-le-plan")).toEqual([40_000 + 16_230, caf, c(133_000 + caf - 56_230)]);
    const p = planDeFinancementDeLaGamme({ creditBail: true });
    expect(p.equilibre).toBe(true);
    expect(p.annees[4]!.option).toBe(15_000);
    expect(p.cumulFinal).toBe(235_192.5);
    expect(juste(ch, "le-plan-a-retenir")).toEqual(["L'emprunt, qui laisse le plus d'argent"]);
    expect(juste(ch, "plan-tableau-ou-budget")).toEqual(["Il prévoit, sur plusieurs années"]);
  });
});

describe("le cas dédié : la banque plafonne son prêt", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_BANQUE_PLAFONNE_SON_PRET);
    gardeDuCas(LA_BANQUE_PLAFONNE_SON_PRET, ch);
  });

  it("60 000 € : N+1 à −14 542,50 € ; 15 000 € en compte courant à 3 % (450 € d'intérêts) le ramènent à 120 €", () => {
    const caf = c(12_937.5 - 3_000 * 0.75);
    expect(caf).toBe(10_687.5);
    const solde = c(133_000 + 60_000 + caf - (206_230 + 12_000));
    expect(solde).toBe(-14_542.5);
    const montants = (id: string) => etape(chapitreDuCas(LA_BANQUE_PLAFONNE_SON_PRET, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("le-pret-plafonne")).toEqual([3_000, 12_000, caf, solde]);
    // C × (1 − 3 % × 75 %) ≥ 14 542,50 € : C ≥ 14 877,24 €, soit 15 000 € au millier.
    expect(c(14_542.5 / (1 - 0.03 * 0.75))).toBe(14_877.24);
    expect(compteCourantQuiEquilibre()).toBe(15_000);
    expect(montants("le-compte-courant")).toEqual([15_000, 450, c(solde + 15_000 - 450 * 0.75)]);
    expect(banquePlafonnee().avec.equilibre).toBe(true);
    const r = etape(LA_BANQUE_PLAFONNE_SON_PRET, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Demander 15 000 € aux associés"]);
  });
});
