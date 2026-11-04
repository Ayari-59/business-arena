import { describe, expect, it } from "vitest";
import { DES_VENTES_AUX_ACHATS } from "../../src/config/cours/chapitres/des-ventes-aux-achats";
import { EQUILIBRER_LA_TRESORERIE, equilibreDuChapitre, grilleDuBilan, grilleDuCompteDeResultat, laboratoireDuFinancement } from "../../src/config/cours/chapitres/equilibrer-la-tresorerie";
import { budgetDeTresorerie } from "../../src/config/cours/monde/couts-et-budgets";
import { bilanDOuverture, bilanPrevisionnel, budgetReequilibre, interetsCourusDuPlacement, leviersDuBanc, realiseDuPlan } from "../../src/config/cours/monde/equilibre-de-tresorerie";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { BANC_PLUS_CHER, UN_BANC_PLUS_CHER, bancPlusCher } from "../../src/config/cours/situations/par-chapitre/un-banc-plus-cher";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * ÉQUILIBRER LA TRÉSORERIE ET BÂTIR LES ÉTATS PRÉVISIONNELS (le semestre de NOVA, banc acheté en
 * avril) : chaque chiffre refait à la main, à partir du budget de trésorerie du chapitre « Le budget de
 * trésorerie » (avril finit à −2 190 € avec le banc, mai à 20 068 €, juin à 33 641,60 €), des conditions
 * de la banque (découvert à 12 %, crédit à 6 % par tranches de 1 000 € et 50 € de frais, escompte à 9 %
 * et 20 € par effet, 360 jours) et du bilan d'ouverture de l'exercice.
 */

const ch = EQUILIBRER_LA_TRESORERIE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const f = NOVA_GESTION;

describe("équilibrer la trésorerie : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG, le DCG UE6 et UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["BTS CG P5", "DCG UE6", "DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["budget-de-tresorerie", "des-ventes-aux-achats"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("« Des ventes aux achats » y mène, par « Et ensuite »", () => {
    expect(DES_VENTES_AUX_ACHATS.ensuite).toEqual([ch.code]);
    expect(suitesDuChapitre(DES_VENTES_AUX_ACHATS.code).ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
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

describe("le rééquilibrage d'avril, refait à la main", () => {
  it("le budget de départ est celui du budget de trésorerie, banc acheté en avril", () => {
    const b = budgetDeTresorerie(f, leviersDuBanc(f));
    expect(b.mois.map((m) => m.tresorerieFin)).toEqual([58_838, 31_998, 19_302.8, -2_190, 20_068, 33_641.6]);
  });

  it("le découvert : 2 190 € à 12 % sur 30 jours, 21,90 € d'agios payés en mai ; 12 190 € pour finir au matelas", () => {
    expect(c((2_190 * 0.12 * 30) / 360)).toBe(21.9);
    expect(attendus(ch, "le-cout-du-decouvert")).toEqual([21.9, c(20_068 - 21.9), 12_190]);
    expect(budgetReequilibre(f, "decouvert", leviersDuBanc(f)).dansLAutorisation).toBe(true);
  });

  it("le crédit : 13 tranches, 13 000 € (12 190 + 50 de frais, à la tranche supérieure), 65 € d'intérêts, 115 € en tout", () => {
    expect(Math.ceil((12_190 + 50) / 1_000)).toBe(13);
    expect(c((13_000 * 0.06 * 30) / 360)).toBe(65);
    expect(attendus(ch, "le-credit-de-tresorerie")).toEqual([65, 115, c(10_760 + 22_258 - 13_000 - 65)]);
    expect(juste(ch, "predire-le-credit")[0]).toMatch(/^13\s000 €$/);
    gardeDuCurseur(ch, "le-credit-au-curseur", 13);
  });

  it("l'escompte : la facture de février de CampusTech, 22 656 €, du 10 avril au 10 mai, 169,92 € d'agio et 20 € de commission", () => {
    const nominal = 320 * 59 * 1.2;
    expect(nominal).toBe(22_656);
    const agio = c((nominal * 0.09 * 30) / 360);
    expect(agio).toBe(169.92);
    expect(attendus(ch, "l-escompte-sans-aide")).toEqual([agio, c(nominal - agio - 20), c(agio + 20), c(-2_190 + nominal - agio - 20)]);
    expect(juste(ch, "le-financement-le-moins-cher")[0]).toMatch(/^Le crédit, 115 €$/);
    expect(juste(ch, "financer-le-banc")).toEqual(["Une ressource stable : un emprunt ou la réserve"]);
  });
});

describe("les états prévisionnels, refaits à la main", () => {
  const ventes = 10_859;
  it("le bilan d'ouverture : la création, équilibrée à 230 000 €", () => {
    const o = bilanDOuverture(f);
    expect(o.actif).toEqual({ ligne: 60_000, tvaDeLaLigne: 12_000, placement: 133_000, banque: 25_000 });
    expect(o.passif).toEqual({ capital: 150_000, emprunt: 80_000 });
    expect(60_000 + 12_000 + 133_000 + 25_000).toBe(150_000 + 80_000);
  });

  it("le compte de résultat prévisionnel : 39 391 € d'exploitation, 1 939,58 € d'intérêts courus, 39 315,58 € avant impôt", () => {
    expect(interetsCourusDuPlacement()).toEqual({ jours: 175, montant: c((133_000 * 0.03 * 175) / 360) });
    const g = grilleDuCompteDeResultat(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const v = g.lignes.map((l) => l.cellules[0]!.valeur);
    const exploitation = ventes * 59 - ventes * 22 - (ventes * 16 + 6 * 19_700 + 50) - 6 * 10_650 - (6 * 833 + 3 * 500);
    expect(exploitation).toBe(39_391);
    expect(v).toEqual([ventes * 59, ventes * 22, ventes * 16 + 6 * 19_700 + 50, 63_900, 6_498, 39_391, 1_939.58, 1_000 + 950 + 65, c(39_391 + 1_939.58 - 2_015)]);
  });

  it("le bilan prévisionnel au 30 juin s'équilibre à 331 936,18 €, et le BFR vaut −2 652,60 €", () => {
    const g = grilleDuBilan(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const actif = 90_000 - 6_498 + 3 * 22_656 + 12_000 + 1_939.58 + 133_000 + c(33_641.6 - 115);
    const passif = 150_000 + 39_315.58 + 72_000 + 2_151 * 22 * 1.2 + (2_151 * 21 * 0.2 + 4_800);
    expect(c(actif)).toBe(331_936.18);
    expect(c(passif)).toBe(331_936.18);
    const x = equilibreDuChapitre(NOVA);
    expect([x.bilan.actif.total, x.bilan.passif.total]).toEqual([331_936.18, 331_936.18]);
    expect(x.bilan.passif.concoursBancaires).toBe(0);
    expect(x.bilan.bfr).toBe(c(3 * 22_656 - 2_151 * 26.4 - 2_151 * 4.2 - 4_800));
    expect(juste(ch, "la-tva-de-la-ligne")).toEqual(["Une anomalie : elle se récupère dès février"]);
  });

  it("chaque financement laisse un bilan équilibré", () => {
    for (const fin of ["decouvert", "credit", "escompte"] as const) {
      const b = bilanPrevisionnel(f, budgetReequilibre(f, fin, leviersDuBanc(f)));
      expect(b.actif.total, fin).toBe(b.passif.total);
    }
  });

  it("CampusTech payée à 60 jours : 2 factures dues au 30 juin, le BFR baisse de 22 656 €, la trésorerie monte de 22 656 € + 115 €", () => {
    expect(attendus(ch, "le-bfr-previsionnel")).toEqual([-2_652.6, 2 * 22_656, c(-2_652.6 - 22_656), c(33_526.6 + 22_656 + 115)]);
  });
});

describe("le laboratoire et le suivi du plan", () => {
  it("le laboratoire : CampusTech payée à 70 jours au plus passe le banc sans aucun financement", () => {
    const x = equilibreDuChapitre(NOVA);
    expect(x.campusTechMax).toBe(70);
    const p = { campustech: 80, fournisseur: 22, matelas: 10_000, financement: 0 };
    expect(laboratoireDuFinancement(f, p).cout).toBe(115);
    expect(laboratoireDuFinancement(f, { ...p, financement: 1 }).cout).toBe(189.92);
    expect(laboratoireDuFinancement(f, { ...p, campustech: 80 }).plusBas.tresorerie).toBe(10_760);
    expect(laboratoireDuFinancement(f, { ...p, fournisseur: 51 }).cout).toBe(0);
    gardeDuLaboratoire(ch, "le-laboratoire-du-financement");
  });

  it("le réalisé de janvier est le compte courant de l'exercice, 58 959,27 € ; fin mars, 17 121,27 € d'écart : 12 000 + 5 000 + 121,27", () => {
    const s = realiseDuPlan(f);
    expect(s.mois[0]!.realise).toBe(58_959.27);
    expect(s.mois.map((m) => m.ecart)).toEqual([121.27, c(121.27 + 6_678), c(121.27 + 12_000 + 5_000), c(121.27 + 12_000), c(121.27 + 12_000), c(121.27 + 12_000 + 4_950)]);
    expect(s.mois[2]!.tvaPayeeReelle).toBe(c(6_090 - (12_000 - 6_678)));
    expect(attendus(ch, "le-suivi-du-plan")).toEqual([6_799.27, 17_121.27, 12_000, 5_000, 121.27]);
    expect(juste(ch, "les-causes-des-ecarts")).toEqual(["La TVA de la ligne, oubliée"]);
  });
});

describe("le cas dédié : un banc plus cher", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UN_BANC_PLUS_CHER);
    gardeDuCas(UN_BANC_PLUS_CHER, ch);
  });

  it("à 45 000 € HT : avril à −20 190 €, un crédit de 31 000 €, mai replonge à 3 843 €, un second de 7 000 €, 290 € contre 549,76 € d'escompte", () => {
    expect(BANC_PLUS_CHER).toBe(45_000);
    const avril = c(33_810 - 45_000 * 1.2);
    expect(avril).toBe(-20_190);
    const n = bancPlusCher(NOVA);
    const montants = (id: string) => etape(chapitreDuCas(UN_BANC_PLUS_CHER, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("le-credit-d-avril")).toEqual([30_190, 31_000, c((31_000 * 0.06) / 12), c(-20_190 + 31_000 - 50)]);
    // Mai : la déclaration d'avril, banc compris, est un crédit (7 980 − 9 000) : mai ne paie pas de TVA ; le crédit et ses intérêts partent.
    expect(c(1_900 * 21 * 0.2 - 45_000 * 0.2)).toBe(-1_020);
    expect(c(10_760 + (50_068 - 33_810) + 7_980 - 31_000 - 155)).toBe(3_843);
    expect(montants("le-credit-de-mai")).toEqual([3_843, 7_000, c(155 + 50 + 35 + 50)]);
    expect(n.escompte.cout).toBe(c(169.92 + 20 + (22_656 * 0.09 * 60) / 360 + 20));
    const r = etape(UN_BANC_PLUS_CHER, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["Un crédit renouvelé en mai, 290 €"]);
  });
});
