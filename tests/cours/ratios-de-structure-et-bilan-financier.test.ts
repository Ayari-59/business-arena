import { describe, expect, it } from "vitest";
import { BILAN_FONCTIONNEL } from "../../src/config/cours/chapitres/bilan-fonctionnel";
import { EMPRUNT_DEMANDE, RATIOS_DE_STRUCTURE, grilleDuBilanFinancier, structureDuCas } from "../../src/config/cours/chapitres/ratios-de-structure-et-bilan-financier";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { AUTONOMIE_EXIGEE, DIVIDENDE_DEMANDE, UN_DIVIDENDE_SOUS_CONDITION } from "../../src/config/cours/situations/par-chapitre/un-dividende-sous-condition";
import { THEMES } from "../../src/config/cours/themes";
import { INVESTISSEMENT_DE_LA_GAMME, MATELAS_DU_COMPTE_COURANT, empruntMinimalDeLaGamme, structureApres } from "../../src/config/cours/monde/structure-financiere";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * RATIOS DE STRUCTURE ET BILAN FINANCIER (le bilan de NOVA au 31 décembre de son premier exercice) :
 * chaque chiffre refait à la main, à partir du bilan comptable de la clôture (capital 150 000 €,
 * résultat 79 225,96 €, provision 5 000 €, emprunt 68 000 € et 831,11 € d'intérêts courus, ligne
 * 60 000 € amortie de 9 861,11 €, dépréciation de Sonora 11 210 €), de la CAF (105 297,07 €), de
 * l'échéancier de l'emprunt (4 000 € de capital par trimestre) et des hypothèses du chapitre (la ligne
 * revendue 75 % de son prix neuf, aucun dividende, le litige jugé en mai).
 */

const ch = RATIOS_DE_STRUCTURE;
const c = (v: number) => Math.round(v * 100) / 100 + 0;
const r2 = (v: number) => Math.round(v * 100) / 100 + 0;

describe("ratios de structure et bilan financier : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme de la comptabilité générale (palier 4), au thème, et cite le BTS CG P6 et le DCG UE6", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["comptabilite-generale"][4]!);
    expect(ch.parcours).toBe("comptabilite-generale");
    expect(ch.palier).toBe(4);
    expect(ch.blocs).toEqual(["BTS CG P6 · Analyse de la situation financière", "DCG UE6 · Finance d'entreprise"]);
    expect(THEMES.find((t) => t.code === "analyse-financiere")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["bilan-fonctionnel-et-bfr", "soldes-intermediaires-de-gestion"]);
    expect(ch.ensuite).toEqual(["financer-et-placer-la-tresorerie"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    ch.objectifs.forEach((_, i) => expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true));
  });

  it("« Bilan fonctionnel et BFR » y mène, par « Et ensuite »", () => {
    expect(BILAN_FONCTIONNEL.ensuite?.[0]).toBe(ch.code);
    expect(suitesDuChapitre(BILAN_FONCTIONNEL.code).ensuite[0]).toEqual({ code: ch.code, titre: ch.titre });
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const x of [ch, UN_DIVIDENDE_SOUS_CONDITION]) {
      for (const e of chapitreDuCas(x, NOVA).etapes) {
        if (e.type !== "choix") continue;
        const o = e.options(NOVA, VIDE);
        const bonne = o.find((k) => k.juste)!;
        expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
      }
    }
  });
});

describe("les ratios de structure, refaits à la main", () => {
  const rs = 150_000 + 79_225.96 + 9_861.11 + 11_210 + 5_000 + 68_000;
  it("les ressources stables, 323 297,07 € ; la couverture des emplois stables, 5,39", () => {
    expect(c(rs)).toBe(323_297.07);
    expect(attendus(ch, "couverture-et-independance")).toEqual([r2(rs / 60_000), c(rs - 68_000), r2(((rs - 68_000) / rs) * 100)]);
    expect(attendus(ch, "couverture-et-independance")).toEqual([5.39, 255_297.07, 78.97]);
  });

  it("l'endettement, 0,30 ; la capacité de remboursement, 0,65 an", () => {
    expect(attendus(ch, "endettement-et-capacite")).toEqual([r2(68_000 / 229_225.96), r2(68_000 / 105_297.07)]);
    expect(attendus(ch, "endettement-et-capacite")).toEqual([0.3, 0.65]);
  });

  it("jusqu'où emprunter : 353 188 € par la capacité, 161 225 € par l'endettement, 187 297 € par l'indépendance ; l'endettement bloque d'abord", () => {
    expect(attendus(ch, "jusqu-ou-emprunter")).toEqual([Math.floor(4 * 105_297.07 - 68_000), Math.floor(229_225.96 - 68_000), Math.floor(2 * 255_297.07 - c(rs))]);
    expect(attendus(ch, "jusqu-ou-emprunter")).toEqual([353_188, 161_225, 187_297]);
    expect(EMPRUNT_DEMANDE).toBeGreaterThan(161_225);
    expect(EMPRUNT_DEMANDE).toBeLessThan(187_297);
    expect(juste(ch, "la-regle-qui-bloque")[0]!.replace(/\s/g, " ")).toBe("Trop : l'endettement plafonne à 161 225 €");
  });
});

describe("le bilan financier, refait à la main", () => {
  it("les reclassements : la provision et les échéances de l'année à moins d'un an, la moins-value en capitaux propres", () => {
    const t = triDe(ch, "les-reclassements-financiers");
    expect(t["Provision pour litige, jugement attendu en mai"]).toBe("dettes-moins");
    expect(t["Emprunt, échéances des 12 mois à venir"]).toBe("dettes-moins");
    expect(t["Emprunt, capital dû au-delà de 12 mois"]).toBe("dettes-plus");
    expect(t["Moins-value latente sur la ligne"]).toBe("propres");
    expect(t["Compte à terme, échéance le 6 janvier"]).toBe("actif-moins");
  });

  it("s'équilibre à 427 117,45 € : 45 000 € à plus d'un an, 382 117,45 € à moins d'un an ; 224 087,07 €, 52 000 € et 151 030,38 €", () => {
    const g = grilleDuBilanFinancier(NOVA);
    expect(incoherencesDuTableau(g)).toEqual([]);
    const moinsValue = c(60_000 - 9_861.11 - 0.75 * 60_000);
    expect(moinsValue).toBe(5_138.89);
    const actifCourt = c(13_500 + (104_548 + 6_900 + 4_500) + 136_934.58 + 115_734.87);
    const dettesCourtes = c(16_000 + 5_000 + 831.11 + 81_000 + 41_119.27 + 7_080);
    const v = g.lignes.map((l) => l.cellules[0]!.valeur);
    expect(v).toEqual([45_000, 13_500, 115_948, 136_934.58, 115_734.87, actifCourt, c(45_000 + actifCourt), c(229_225.96 - moinsValue), 52_000, 16_000, 5_000, c(dettesCourtes - 21_000), dettesCourtes, c(229_225.96 - moinsValue + 52_000 + dettesCourtes)]);
    expect([actifCourt, dettesCourtes]).toEqual([382_117.45, 151_030.38]);
    expect(c(45_000 + actifCourt)).toBe(427_117.45);
    expect(c(224_087.07 + 52_000 + dettesCourtes)).toBe(427_117.45);
  });

  it("le fonds de roulement financier, 231 087,07 € par le haut et par le bas ; liquidités 2,53, 2,44 et 0,77", () => {
    expect(c(224_087.07 + 52_000 - 45_000)).toBe(c(382_117.45 - 151_030.38));
    expect(attendus(ch, "le-fonds-de-roulement-financier")).toEqual([231_087.07, r2(382_117.45 / 151_030.38), r2((382_117.45 - 13_500) / 151_030.38), r2(115_734.87 / 151_030.38)]);
    expect(attendus(ch, "le-fonds-de-roulement-financier")).toEqual([231_087.07, 2.53, 2.44, 0.77]);
    expect(structureDuCas(NOVA).financier.liquiditeAuSixJanvier).toBe(r2((115_734.87 + 136_934.58) / 151_030.38));
  });

  it("la solvabilité, 2,10 ; l'autonomie, 52,46 %", () => {
    expect(attendus(ch, "solvabilite-et-autonomie")).toEqual([203_030.38, r2(427_117.45 / 203_030.38), r2((224_087.07 / 427_117.45) * 100)]);
    expect(attendus(ch, "solvabilite-et-autonomie")).toEqual([203_030.38, 2.1, 52.46]);
  });

  it("le curseur : un investissement payé comptant de 231 milliers d'euros au plus ; le compte courant passe sous zéro dès 116", () => {
    gardeDuCurseur(ch, "l-investissement-au-curseur", 231);
    expect(115_734.87 - 116_000).toBeLessThan(0);
    expect(juste(ch, "predire-l-investissement")).toEqual(["Baisse de tout le prix"]);
    expect(juste(ch, "fonctionnel-ou-financier")).toEqual(["Le fournisseur"]);
  });
});

describe("le laboratoire de la banque", () => {
  it("la gamme, 190 000 € HT, avec une CAF en baisse de 60 % : il faut emprunter de 85 000 € à 100 000 € sans apport", () => {
    const s = structureDuCas(NOVA);
    expect(INVESTISSEMENT_DE_LA_GAMME).toBe(190_000);
    expect(MATELAS_DU_COMPTE_COURANT).toBe(10_000);
    // Le matelas : 115 734,87 − 190 000 + E ≥ 10 000, soit E ≥ 84 265,13 ; la capacité : 68 000 + E ≤ 4 × 42 118,83.
    expect(empruntMinimalDeLaGamme(s)).toBe(85_000);
    expect(c(105_297.07 * 0.4)).toBe(42_118.83);
    const p = (emprunt: number, apport = 0) => ({ investissement: 190_000, emprunt, apport, baisse: 60 });
    expect([80_000, 85_000, 100_000, 105_000].map((e) => structureApres(s, p(e)).dansLesRegles)).toEqual([false, true, true, false]);
    expect(structureApres(s, p(85_000))).toMatchObject({ banque: 10_734.87, capacite: r2(153_000 / 42_118.83), liquiditeGenerale: r2((382_117.45 - 190_000 + 85_000) / (151_030.38 + 17_000)) });
    // L'emprunt fait monter la liquidité générale : l'argent entre en entier, la dette pour un cinquième.
    expect(structureApres(s, { investissement: 0, emprunt: 50_000, apport: 0, baisse: 0 }).liquiditeGenerale).toBeGreaterThan(s.financier.liquiditeGenerale);
    expect(juste(ch, "predire-l-emprunt")).toEqual(["Monte"]);
    gardeDuLaboratoire(ch, "le-laboratoire-de-la-banque");
  });
});

describe("le cas dédié : un dividende sous condition", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UN_DIVIDENDE_SOUS_CONDITION);
    gardeDuCas(UN_DIVIDENDE_SOUS_CONDITION, ch);
  });

  it("20 000 € de dividende font tomber l'autonomie à 47,78 % ; 10 528 € au plus la gardent à 50 %", () => {
    expect([DIVIDENDE_DEMANDE, AUTONOMIE_EXIGEE]).toEqual([20_000, 0.5]);
    const montants = (id: string) => etape(chapitreDuCas(UN_DIVIDENDE_SOUS_CONDITION, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("avec-le-dividende-demande")).toEqual([204_087.07, 171_030.38, r2((204_087.07 / 427_117.45) * 100), r2(382_117.45 / 171_030.38)]);
    expect(montants("avec-le-dividende-demande")).toEqual([204_087.07, 171_030.38, 47.78, 2.23]);
    expect(montants("le-dividende-maximal")).toEqual([Math.floor(224_087.07 - 0.5 * 427_117.45)]);
    expect(montants("le-dividende-maximal")).toEqual([10_528]);
    const r = etape(UN_DIVIDENDE_SOUS_CONDITION, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte.replace(/\s/g, " "))).toEqual(["10 528 € au plus, pas 20 000 €"]);
  });
});
