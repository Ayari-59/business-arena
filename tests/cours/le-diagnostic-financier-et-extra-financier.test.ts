import { describe, expect, it } from "vitest";
import { BILAN_FONCTIONNEL, bilanDeLExercice } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import {
  LE_DIAGNOSTIC_FINANCIER,
  RENTABILITE_DEMANDEE,
  SOLUTION_DU_DIAGNOSTIC,
  TRESORERIE_A_GARDER,
  laboratoireDuDiagnostic,
} from "../../src/config/cours/chapitres/le-diagnostic-financier-et-extra-financier";
import { SOLDES_INTERMEDIAIRES } from "../../src/config/cours/chapitres/soldes-intermediaires";
import { LE_TABLEAU_DES_FLUX_DE_TRESORERIE } from "../../src/config/cours/chapitres/le-tableau-des-flux-de-tresorerie";
import { cloture } from "../../src/config/cours/monde/cloture";
import { exercicesDeNova, ratiosDesExercices, diagnosticDeNova, MOYENNES_DU_SECTEUR } from "../../src/config/cours/monde/diagnostic-de-nova";
import { EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { structureDeNova } from "../../src/config/cours/monde/structure-financiere";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LE_PRET_INDEXE_SUR_LA_DURABILITE, pretIndexe } from "../../src/config/cours/situations/par-chapitre/le-pret-indexe-sur-la-durabilite";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE DIAGNOSTIC FINANCIER ET EXTRA-FINANCIER DE NOVA SUR TROIS EXERCICES (DCG UE6, 1.1, 1.6, 1.7),
 * refait à la main : N est la clôture du cours ; N + 1 et N + 2 se recomposent à partir des hypothèses
 * nommées (les ventes de One et de la gamme, les coûts variables de nova-gestion.ts, le loyer,
 * l'assurance, l'entretien, la publicité, l'équipe, les dotations, les suites de Sonora et du litige,
 * l'impôt au barème) ; le bilan de chaque exercice retombe sur ses flux.
 */

const ch = LE_DIAGNOSTIC_FINANCIER;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const impot = (base: number) => Math.round(42_500 * 0.15 + (base - 42_500) * 0.25);
const [n, n1, n2] = exercicesDeNova();

describe("le diagnostic : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!).toContain(ch.titre);
    expect([ch.parcours, ch.palier]).toEqual(["comptabilite-generale", 4]);
    expect(ch.blocs).toEqual(["DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual([SOLDES_INTERMEDIAIRES.code, BILAN_FONCTIONNEL.code, "ratios-de-structure-et-bilan-financier"]);
    expect(ch.ensuite).toEqual(["evaluer-un-investissement-durable"]);
    expect(ch.objectifs.length).toBe(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("« Le tableau des flux de trésorerie » y mène, par « Et ensuite »", () => {
    expect(suitesDuChapitre(LE_TABLEAU_DES_FLUX_DE_TRESORERIE.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LE_PRET_INDEXE_SUR_LA_DURABILITE]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("une seule NOVA : N est la clôture du cours", () => {
  it("le compte de résultat, la CAF et le bilan fonctionnel de N sont ceux de la clôture, au centime", () => {
    const k = cloture(EXERCICE_DE_NOVA);
    expect([n!.production, n!.valeurAjoutee, n!.excedentBrutDExploitation, n!.resultatNet, n!.caf]).toEqual([1_390_276, 254_034, 126_234, 79_225.96, 105_297.07]);
    expect([n!.fondsDeRoulement, n!.besoin, n!.tresorerieNette]).toEqual([k.fonctionnel.fondsDeRoulement, k.fonctionnel.besoinEnFondsDeRoulement, k.fonctionnel.tresorerieNette]);
    expect(n!.tresorerieNette).toBe(252_669.45);
  });

  it("les ratios de N sont ceux des chapitres du bilan fonctionnel et des ratios de structure", () => {
    const r = ratiosDesExercices()[0]!;
    const s = structureDeNova(EXERCICE_DE_NOVA);
    const b = bilanDeLExercice(NOVA);
    // Les comptes résumés de N sont arrêtés avant répartition : le dividende voté (décision D2) n'est payé
    // qu'en N + 1. Le bilan financier du chapitre, après répartition, le compte en dettes à moins d'un an.
    const avantRepartition = Math.round((s.financier.actifMoinsDUnAn / (s.financier.dettesMoinsDUnAn - s.postes.dividende)) * 100) / 100;
    expect([r.endettement, r.capaciteDeRemboursement, r.liquiditeGenerale]).toEqual([s.ratios.endettement, s.ratios.capacite, avantRepartition]);
    expect(s.postes.dividende).toBe(n1!.dividendes);
    expect(r.couverture).toBe(s.ratios.couverture);
    expect(c(r.independance * 100)).toBe(s.ratios.independance);
    expect([r.delaiClients, r.delaiFournisseurs, r.rotationDesStocks]).toEqual([b.delaiClients, b.delaiFournisseurs, b.rotationDuStock]);
  });
});

describe("N + 1 et N + 2, refaits à la main", () => {
  it("N + 1 : 26 900 One, 1 500 Go et 1 000 Studio ; 1 767 100 € de chiffre d'affaires, 160 400 € d'EBE", () => {
    expect(n1!.production).toBe(26_900 * 59 + 1_500 * 34 + 1_000 * 129);
    const consommations = 26_900 * 38 + 1_500 * 19 + 1_000 * 70 + 236_400 + 6_000 + 4 * 4_500 + 4_000 + 12_000 + 15_000 - 8_000 * 0.2;
    expect(n1!.consommations).toBe(consommations);
    expect(n1!.personnel).toBe(6 * 31_950);
    expect(n1!.excedentBrutDExploitation).toBe(1_767_100 - consommations - 4_500 - 191_700);
  });

  it("N + 1 : les dotations, la seconde ligne par composants et le reste au prorata de 359 jours ; Sonora et le litige ; l'impôt", () => {
    expect(n1!.dotations).toBe(c(10_000 + 7_479.17 + 4_986.11 + ((40_000 / 5 + 12_000 / 6) * 359) / 360));
    expect([n1!.reprises, n1!.autresCharges]).toEqual([11_210 + 5_000, 28_025 / 2]);
    expect(n1!.resultatDExploitation).toBe(c(160_400 + 16_210 - 32_437.5 - 14_012.5));
    expect(n1!.produitsFinanciers).toBe(c(133_000 * 0.03 - 3_934.58));
    expect(n1!.resultatExceptionnel).toBe(c(-4_000 + (3_600 / 6) * (359 / 360)));
    expect(n1!.impot).toBe(impot(c(n1!.resultatCourantAvantImpot + n1!.resultatExceptionnel)));
    expect(n1!.impot).toBe(26_727);
  });

  it("chaque bilan retombe sur ses flux : la trésorerie varie de la CAF, des apports et de la subvention, moins les investissements, les remboursements, le dividende et la hausse du besoin", () => {
    for (const [a, b] of [
      [n!, n1!],
      [n1!, n2!],
    ] as const) {
      const flux = b.caf + b.apports + b.subventionRecue + b.empruntsNouveaux - b.investissements - b.remboursements - b.dividendes - (b.besoin - a.besoin);
      expect(c(b.tresorerieNette - a.tresorerieNette), b.code).toBe(c(flux));
    }
    expect([n1!.dettesFinancieres, n2!.dettesFinancieres]).toEqual([52_000, 36_000]);
    expect(n1!.apports).toBe(5_000 * 12);
    expect(n2!.dividendes).toBe(20_000);
  });

  it("les ratios de N + 2 : 13,36 % de marge brute, 54,25 % de rentabilité économique, 34,42 % de rentabilité financière, 0,07 d'endettement", () => {
    const r = ratiosDesExercices()[2]!;
    expect(attendus(ch, "les-ratios-d-activite")).toEqual([27.1, 13.11, 18.27, 20.18, 23.39]);
    expect(attendus(ch, "profitabilite-et-rentabilite")).toEqual([13.36, 8.9, 322_054.42, 54.25, c(100 * (177_849 / 516_658.93))]);
    expect(attendus(ch, "profitabilite-et-rentabilite")[4]).toBe(34.42);
    // Les capitaux propres de N + 2 portent le dividende de N, sorti en N + 1 (décision D2) : 30 000 € de moins.
    expect(n1!.dividendes).toBe(30_000);
    expect(n2!.capitauxPropres).toBe(c(546_658.93 - 30_000));
    expect(r.actifEconomique).toBe(c(180_000 - n2!.amortissements + n2!.besoinDExploitation));
    expect(attendus(ch, "les-ratios-de-faillite")).toEqual([0.07, 3.78, 74.6, 0.17]);
    expect(attendus(ch, "rotation-et-investissement")).toEqual([40, 26.72, 31.41, 42.44]);
    expect(c((n2!.stocks * 360) / n2!.composantsConsommes)).toBe(26.72);
    expect(juste(ch, "predire-la-marge")).toEqual(["Reste à peu près le même"]);
  });

  it("le tri : les grandeurs du bilan sont des stocks, celles de l'année des flux", () => {
    const t = triDe(ch, "stock-ou-flux");
    expect(t["Les capitaux propres"]).toBe("stock");
    expect(t["Les créances clients"]).toBe("stock");
    expect(t["La capacité d'autofinancement"]).toBe("flux");
    expect(t["Les investissements de l'année"]).toBe("flux");
  });

  it("les indicateurs ESG : 1,5 kWh par enceinte en N + 2, 78,25 g de CO2 (0,0783 kg), 3,48 % d'absentéisme en N + 1", () => {
    const d = diagnosticDeNova();
    expect(d.esg[2]!.kwh).toBe(32_800 * 1.2 + 1_500 * 12 - 8_000);
    expect(d.esg[0]!.kwh).toBe(c(23_609 * 1.2 + 1_500 * 12));
    expect(attendus(ch, "les-indicateurs-esg")).toEqual([1.5, 78.25, 5.49, 3.48]);
    expect(c(380 / (6 * 151.67 * 12))).toBe(0.03);
    expect(d.secteur).toBe(MOYENNES_DU_SECTEUR);
  });
});

describe("le laboratoire : un ratio bouge quand son dénominateur bouge", () => {
  it("à 2 € par action, la rentabilité financière passe 35 % et la trésorerie reste au-dessus de 230 000 € ; à 3 €, elle passerait dessous ; le résultat ne bouge pas", () => {
    const s = laboratoireDuDiagnostic(SOLUTION_DU_DIAGNOSTIC);
    expect(s.exercice.resultatNet).toBe(n2!.resultatNet);
    expect(s.ratios.rentabiliteFinanciere).toBe(Math.round((177_849 / (516_658.93 - 20_000)) * 10_000) / 10_000);
    expect(s.ratios.rentabiliteFinanciere).toBeGreaterThanOrEqual(RENTABILITE_DEMANDEE);
    expect(s.exercice.tresorerieNette).toBe(c(287_934.51 - 30_000 - 20_000));
    expect(s.exercice.tresorerieNette).toBeGreaterThanOrEqual(TRESORERIE_A_GARDER);
    expect(laboratoireDuDiagnostic({ ...SOLUTION_DU_DIAGNOSTIC, dividende: 3 }).exercice.tresorerieNette).toBeLessThan(TRESORERIE_A_GARDER);
    // Le délai des clients déplace la trésorerie vers les créances, sans toucher au résultat.
    const plusLent = laboratoireDuDiagnostic({ ...SOLUTION_DU_DIAGNOSTIC, delaiClients: 45 });
    expect(c(s.exercice.tresorerieNette - plusLent.exercice.tresorerieNette)).toBe(c((1_998_700 * 1.2 * 5) / 360));
    expect(plusLent.ratios.rentabiliteFinanciere).toBe(s.ratios.rentabiliteFinanciere);
    expect(juste(ch, "predire-le-dividende")).toEqual(["Monterait"]);
    gardeDuLaboratoire(chapitreDuCas(ch, NOVA), "le-laboratoire-du-diagnostic");
  });
});

describe("le cas dédié : le prêt indexé sur la durabilité", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LE_PRET_INDEXE_SUR_LA_DURABILITE);
    gardeDuCas(LE_PRET_INDEXE_SUR_LA_DURABILITE, ch);
  });

  it("336 000 € de dettes, 0,65 d'endettement, 1,59 an de CAF, 3,17 de liquidité ; 1,5 kWh et 92 % : le bonus est acquis", () => {
    const x = pretIndexe(NOVA);
    const montants = (id: string) => etape(chapitreDuCas(LE_PRET_INDEXE_SUR_LA_DURABILITE, NOVA), id, "montants").champs(NOVA, VIDE).map((k) => k.attendu);
    expect(montants("la-structure")).toEqual([336_000, c(336_000 / 516_658.93), c(336_000 / 211_344.56), c(x.b.actifCirculant / (x.b.dettesAMoinsDUnAn + 30_000))]);
    expect(montants("la-structure")).toEqual([336_000, 0.65, 1.59, 3.17]);
    expect(montants("les-indicateurs")).toEqual([1.5, 92, 600]);
    expect(x.bonusObtenu && x.conditionsTenues).toBe(true);
  });
});
