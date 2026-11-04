import { describe, expect, it } from "vitest";
import { BILAN_FONCTIONNEL } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import {
  LE_TABLEAU_DE_FINANCEMENT,
  SOLUTION_DU_TABLEAU,
  departDuTableau,
  financementDuChapitre,
  grilleDeLaPartie1,
  grilleDeLaPartie2,
  laboratoireDuTableau,
} from "../../src/config/cours/chapitres/le-tableau-de-financement";
import { EXERCICE_DE_NOVA } from "../../src/config/cours/monde/exercice-de-nova";
import { SECONDE_LIGNE_PAYEE_EN_DECEMBRE, tableauDeFinancement } from "../../src/config/cours/monde/tableaux-de-flux";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE, secondeLigneEnDecembre } from "../../src/config/cours/situations/par-chapitre/la-seconde-ligne-payee-en-decembre";
import { THEMES } from "../../src/config/cours/themes";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE TABLEAU DE FINANCEMENT DU PREMIER EXERCICE DE NOVA, refait à la main à partir de la clôture du
 * chapitre « Bilan fonctionnel et BFR » (bilan d'ouverture vide : NOVA naît le 2 janvier). La CAF,
 * 105 297,07 € ; l'apport, 150 000 € ; l'emprunt, 80 000 € reçus et 68 000 € restant dus ; la ligne,
 * 60 000 € hors taxes ; le bilan fonctionnel du 31 décembre (fonds de roulement 263 297,07 €, besoin
 * 10 627,62 €, trésorerie nette 252 669,45 €).
 */

const ch = LE_TABLEAU_DE_FINANCEMENT;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const f = EXERCICE_DE_NOVA;

describe("le tableau de financement : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(PROGRAMME["comptabilite-generale"][4]!).toContain(ch.titre);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["soldes-intermediaires-de-gestion", BILAN_FONCTIONNEL.code]);
    expect(ch.ensuite).toEqual(["le-tableau-des-flux-de-tresorerie"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const s of [ch, LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE]) {
      for (const e of chapitreDuCas(s, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("la partie I, refaite à la main", () => {
  it("les emplois : la ligne et le capital remboursé, 72 000 € ; les ressources : 335 297,07 € ; la variation du fonds de roulement, 263 297,07 €", () => {
    const t = tableauDeFinancement(f);
    expect(t.emplois).toEqual({ dividendes: 0, acquisitions: 60_000, remboursements: 80_000 - 68_000 });
    expect(t.ressources).toEqual({ caf: 105_297.07, cessions: 0, augmentationDeCapital: 150_000, nouveauxEmprunts: 80_000 });
    expect(t.totalDesEmplois).toBe(72_000);
    expect(t.totalDesRessources).toBe(c(105_297.07 + 150_000 + 80_000));
    expect(t.variationDuFondsDeRoulement).toBe(c(335_297.07 - 72_000));
  });

  it("la partie I se vérifie par les deux bilans : le fonds de roulement du 31 décembre, moins zéro à l'ouverture", () => {
    const t = tableauDeFinancement(f);
    expect(t.fondsDeRoulementDeCloture).toBe(c(150_000 + 79_225.96 + 9_861.11 + 11_210 + 5_000 + 68_000 - 60_000));
    expect(t.fondsDeRoulementDeCloture).toBe(t.variationDuFondsDeRoulement);
    expect(attendus(ch, "la-verification")).toEqual([263_297.07, 263_297.07, 31.4]);
    expect(c((105_297.07 / 335_297.07) * 100)).toBe(31.4);
  });

  it("la grille de la partie I tient ses totaux, et ses cellules sont celles de la main", () => {
    const g = grilleDeLaPartie1(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    expect(g.lignes.map((l) => l.cellules[0]!.valeur)).toEqual([0, 60_000, 12_000, 72_000, 105_297.07, 0, 150_000, 80_000, 335_297.07, 263_297.07]);
  });

  it("le tri : les charges calculées et les intérêts sont dans la CAF, l'impôt dû et le placement en partie II", () => {
    const t = triDe(ch, "emplois-ou-ressources");
    expect(t["La dotation aux amortissements de la ligne"]).toBe("caf");
    expect(t["La dépréciation de la créance de Sonora"]).toBe("caf");
    expect(t["Les intérêts de l'emprunt payés aux échéances"]).toBe("caf");
    expect(t["L'impôt sur les sociétés dû"]).toBe("partie-2");
    expect(t["Le compte à terme et ses intérêts courus"]).toBe("partie-2");
    expect(financementDuChapitre(NOVA).interetsPayes).toBe(c(3_681.11 - 831.11));
  });
});

describe("la partie II, refaite à la main", () => {
  it("l'exploitation : 13 500 € de stock, 127 158 € de créances brutes, 108 457,27 € de dettes, un besoin de 32 200,73 €", () => {
    const p = tableauDeFinancement(f).partie2;
    expect(p.stocks).toBe(13_500);
    expect(p.creancesDExploitation).toBe(c(115_758 + 6_900 + 4_500));
    expect(p.dettesDExploitation).toBe(c(81_000 + 4_921.27 + 15_456 + 7_080));
    expect(p.variationDExploitation).toBe(c(13_500 + 127_158 - 108_457.27));
  });

  it("le hors exploitation dégage 21 573,11 € (l'impôt et les intérêts courus) ; la trésorerie prend 252 669,45 € ; le total retombe sur la partie I", () => {
    const t = tableauDeFinancement(f);
    const p = t.partie2;
    expect(p.variationHorsExploitation).toBe(c(-(20_742 + 831.11)));
    expect(p.variationDuBesoin).toBe(c(32_200.73 - 21_573.11));
    expect(p.variationDeTresorerie).toBe(c(115_734.87 + 133_000 + 3_934.58));
    expect(p.total).toBe(t.variationDuFondsDeRoulement);
  });

  it("la grille de la partie II tient ses totaux, et ses soldes tombent du bon côté", () => {
    const g = grilleDeLaPartie2(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const ligne = (l: string) => g.lignes.find((x) => x.libelle.startsWith(l))!.cellules.map((x) => x.valeur);
    expect(ligne("Variation nette d'exploitation")).toEqual([32_200.73, null]);
    expect(ligne("Variation nette hors exploitation")).toEqual([null, 21_573.11]);
    expect(ligne("Total A + B")).toEqual([10_627.62, null]);
    expect(ligne("Variation nette de trésorerie")).toEqual([252_669.45, null]);
    expect(ligne("Variation du fonds de roulement")).toEqual([263_297.07, null]);
  });

  it("en prenant les créances nettes, la partie II manquerait la dépréciation, 11 210 € : la bonne réponse le dit", () => {
    expect(c(28_025 * 0.4)).toBe(11_210);
    expect(juste(ch, "les-valeurs-brutes")[0]).toMatch(/^La CAF a déjà rendu la dépréciation/);
  });

  it("les ratios : l'autofinancement couvre 175,5 % de la ligne, le besoin absorbe 4,04 % de la ressource nette", () => {
    expect(attendus(ch, "les-ratios-du-tableau")).toEqual([105_297.07, c((105_297.07 / 60_000) * 100), 4.04]);
    expect(c((10_627.62 / 263_297.07) * 100)).toBe(4.04);
    expect(juste(ch, "lire-le-tableau")[0]).toMatch(/^La CAF couvre seule les emplois/);
  });
});

describe("le laboratoire des deux parties", () => {
  it("les délais ne touchent pas la partie I ; le remboursement anticipé la baisse, et la trésorerie d'autant", () => {
    const d = laboratoireDuTableau(f, departDuTableau(f));
    for (const [ct, fo] of [[30, 22], [60, 22], [120, 51]] as const) {
      const l = laboratoireDuTableau(f, { delaiCampusTech: ct, delaiFournisseur: fo, remboursement: 0 });
      expect(l.variationDuFondsDeRoulement).toBe(d.variationDuFondsDeRoulement);
      expect(l.partie2.total).toBe(l.variationDuFondsDeRoulement);
    }
    const r = laboratoireDuTableau(f, { ...departDuTableau(f), remboursement: 40_000 });
    expect(r.variationDuFondsDeRoulement).toBe(c(263_297.07 - 40_000));
    expect(r.partie2.variationDuBesoin).toBe(d.partie2.variationDuBesoin);
    expect(r.partie2.variationDeTresorerie).toBe(c(252_669.45 - 40_000));
  });

  it("la solution : le fournisseur à 51 jours (une facture de plus encore due, 54 648 €) rend la trésorerie des 40 000 € remboursés", () => {
    const s = laboratoireDuTableau(f, { ...departDuTableau(f), ...SOLUTION_DU_TABLEAU });
    expect(s.partie2.variationDuBesoin).toBe(c(10_627.62 - 54_648));
    expect(s.partie2.variationDeTresorerie).toBe(c(252_669.45 - 40_000 + 54_648));
    gardeDuLaboratoire(chapitreDuCas(ch, NOVA), "le-laboratoire-du-tableau");
  });
});

describe("le cas dédié : la seconde ligne payée en décembre", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE);
    gardeDuCas(LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE, ch);
  });

  it("60 000 € HT de plus en emplois, 12 000 € de TVA en hors exploitation : le fonds de roulement varie de 203 297,07 €, la trésorerie de 180 669,45 €", () => {
    expect(SECONDE_LIGNE_PAYEE_EN_DECEMBRE).toEqual({ ht: 60_000, tva: 12_000 });
    const n = secondeLigneEnDecembre(NOVA);
    const montants = (id: string) => etape(chapitreDuCas(LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("la-partie-1")).toEqual([120_000, 132_000, c(335_297.07 - 132_000)]);
    expect(montants("la-partie-2")).toEqual([c(12_000 - 21_573.11), c(32_200.73 + 12_000 - 21_573.11), c(252_669.45 - 72_000), c(115_734.87 - 72_000)]);
    expect(n.apres.partie2.total).toBe(n.apres.variationDuFondsDeRoulement);
    expect(n.apres.k.resultatNet).toBe(n.avant.k.resultatNet);
    const r = etape(LA_SECONDE_LIGNE_PAYEE_EN_DECEMBRE, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Oui : le fonds de roulement couvre encore le besoin, de loin"]);
  });
});
