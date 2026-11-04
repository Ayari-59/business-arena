import { describe, expect, it } from "vitest";
import {
  COMMANDE_ANNONCEE,
  DES_VENTES_AUX_ACHATS,
  budgetsDuChapitre,
  grilleDeProduction,
  grilleDesApprovisionnements,
  laboratoireDesStocks,
} from "../../src/config/cours/chapitres/des-ventes-aux-achats";
import { BUDGET_DE_TRESORERIE } from "../../src/config/cours/chapitres/budget-de-tresorerie";
import { POLITIQUE_ENVISAGEE, SANS_STOCK, VENTES_PREVUES_APRES_JUIN, budgetsDeProduction, ecartDeTresorerieAuTrenteJuin, tresorerieAvecLeStock } from "../../src/config/cours/monde/budgets-operationnels";
import { budgetDeTresorerie } from "../../src/config/cours/monde/couts-et-budgets";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { SI_LE_FOURNISSEUR_FERMAIT_EN_MAI, fermetureDeMai } from "../../src/config/cours/situations/par-chapitre/si-le-fournisseur-fermait-en-mai";
import { incoherencesDuTableau } from "../../src/pedagogy/cours/tableau-a-completer";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { suitesDuChapitre } from "../../src/pedagogy/cours/suites";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * DES VENTES AUX ACHATS (le semestre de NOVA) : chaque chiffre refait à la main, à partir de la fiche
 * (les ventes 1 270, 1 130, 1 418, 1 580, 1 710, 1 831 aux particuliers et 320 par mois à CampusTech ;
 * 1 920 en juillet et 1 470 en août ; 59 € l'enceinte, 22 € le jeu, 20 % de TVA ; le fournisseur payé
 * le mois suivant) et de la politique étudiée (10 % des ventes du mois suivant en enceintes, 20 % de la
 * production du mois suivant en jeux, à l'unité supérieure).
 */

const ch = DES_VENTES_AUX_ACHATS;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

const VENTES = [1_270 + 320, 1_130 + 320, 1_418 + 320, 1_580 + 320, 1_710 + 320, 1_831 + 320, 1_920, 1_470];

/** Les budgets de production et des approvisionnements, écrits en clair. */
function budgetsALaMain(enceintes: number, jeux: number) {
  const sfE = VENTES.slice(1).map((v) => Math.ceil(enceintes * v - 1e-9));
  const production = VENTES.slice(0, 7).map((v, k) => v + sfE[k]! - (k === 0 ? 0 : sfE[k - 1]!));
  const sfJ = production.slice(1).map((p) => Math.ceil(jeux * p - 1e-9));
  const achats = production.slice(0, 6).map((p, k) => p + sfJ[k]! - (k === 0 ? 0 : sfJ[k - 1]!));
  return { sfE, production, sfJ, achats };
}

describe("des ventes aux achats : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le BTS CG, le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["BTS CG P5", "DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["budget-de-tresorerie"]);
    expect(ch.ensuite).toEqual(["equilibrer-la-tresorerie"]);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
  });

  it("le budget de trésorerie y mène, par « Et ensuite »", () => {
    expect(BUDGET_DE_TRESORERIE.ensuite).toEqual([ch.code]);
    expect(suitesDuChapitre("budget-de-tresorerie").ensuite).toEqual([{ code: ch.code, titre: ch.titre }]);
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

describe("le monde : sans stock, les budgets refont le budget de trésorerie", () => {
  it("sans stock, la production vaut les ventes, les achats la consommation, et la trésorerie est celle du chapitre précédent, au centime", () => {
    const b = budgetsDeProduction(NOVA_GESTION, SANS_STOCK);
    expect(b.mois.map((m) => m.production)).toEqual(VENTES.slice(0, 6));
    expect(b.jeuxAchetes).toEqual(VENTES.slice(0, 6));
    const avec = tresorerieAvecLeStock(NOVA_GESTION, SANS_STOCK);
    const fiche = budgetDeTresorerie(NOVA_GESTION);
    expect(avec.mois).toEqual(fiche.mois);
    expect(avec.fin).toEqual(fiche.fin);
    expect(fiche.tresorerieFin).toBe(63_641.6);
  });

  it("les ventes de juillet et d'août sont celles de l'exercice", () => {
    expect(VENTES_PREVUES_APRES_JUIN).toEqual([1_920, 1_470]);
  });
});

describe("les budgets avec la politique étudiée, refaits à la main", () => {
  const m = budgetsALaMain(0.1, 0.2);
  const b = budgetsDeProduction(NOVA_GESTION, POLITIQUE_ENVISAGEE);

  it("la production : 1 735, 1 479, 1 754, 1 913, 2 043, 2 127 ; juillet 1 875", () => {
    expect(m.production).toEqual([1_735, 1_479, 1_754, 1_913, 2_043, 2_127, 1_875]);
    expect(b.mois.map((x) => x.production)).toEqual(m.production.slice(0, 6));
    expect(b.juillet.production).toBe(1_875);
  });

  it("les jeux achetés : 2 031, 1 534, 1 786, 1 939, 2 060, 2 076 ; les stocks du 30 juin, 192 enceintes et 375 jeux", () => {
    expect(m.achats).toEqual([2_031, 1_534, 1_786, 1_939, 2_060, 2_076]);
    expect(b.jeuxAchetes).toEqual(m.achats);
    expect([b.stocksDeFin.enceintes, b.stocksDeFin.jeux, b.stocksDeFin.composantsHt]).toEqual([192, 375, (192 + 375) * 22]);
  });

  it("les deux tableaux à compléter tombent juste, et leurs cases sont les chiffres à la main", () => {
    const p = grilleDeProduction(NOVA);
    expect(incoherencesDuTableau(p)).toEqual([]);
    expect(p.lignes[1]!.cellules.map((x) => x.valeur)).toEqual([203, 216, 192]);
    expect(p.lignes[2]!.cellules.map((x) => x.valeur)).toEqual([190, 203, 216]);
    expect(p.lignes[3]!.cellules.map((x) => x.valeur)).toEqual([1_913, 2_043, 2_127]);
    const a = grilleDesApprovisionnements(NOVA);
    expect(incoherencesDuTableau(a)).toEqual([]);
    expect(a.lignes[1]!.cellules.map((x) => x.valeur)).toEqual([409, 426, 375]);
    expect(a.lignes[2]!.cellules.map((x) => x.valeur)).toEqual([383, 409, 426]);
    expect(a.lignes[3]!.cellules.map((x) => x.valeur)).toEqual([1_939, 2_060, 2_076]);
    expect(a.lignes[4]!.cellules.map((x) => x.valeur)).toEqual([1_939 * 22, 2_060 * 22, 2_076 * 22]);
    expect(a.lignes[5]!.cellules.map((x) => x.valeur)).toEqual([c(1_939 * 22 * 1.2), c(2_060 * 22 * 1.2), c(2_076 * 22 * 1.2)]);
  });

  it("le budget des ventes : 93 220 € et 18 880 € en avril, 112 100 €, 358 779 € au deuxième trimestre", () => {
    expect(attendus(ch, "le-budget-des-ventes")).toEqual([1_580 * 59, 320 * 59, 1_900 * 59, 6_081 * 59]);
    expect(6_081 * 59).toBe(358_779);
  });

  it("janvier sans aide : 145, 1 735, 1 479, 296, 2 031 jeux, et 53 618,40 € payés en février", () => {
    expect(attendus(ch, "janvier-sans-aide")).toEqual([145, 1_735, 1_479, 296, 2_031, c(2_031 * 22 * 1.2)]);
    expect(c(2_031 * 22 * 1.2)).toBe(53_618.4);
  });

  it("mai : 51 189,60 € au fournisseur, 7 808,40 € de TVA, 858 € de plus en tout, le hors taxes de 39 jeux", () => {
    const tvaSansStock = c(1_900 * 21 * 0.2);
    expect(tvaSansStock).toBe(7_980);
    const tva = c(tvaSansStock - 39 * 22 * 0.2);
    expect(attendus(ch, "le-paiement-au-fournisseur")).toEqual([c(1_939 * 26.4), tva, 39 * 22]);
    expect(c(1_939 * 26.4 + tva - 1_900 * 26.4 - tvaSansStock)).toBe(858);
  });

  it("la trésorerie avec le stock : le point bas tombe en mars, à 7 752,80 €, sous le matelas ; le 30 juin perd 642 × 22 €", () => {
    const t = tresorerieAvecLeStock(NOVA_GESTION, POLITIQUE_ENVISAGEE);
    expect(t.plusBas).toEqual({ nom: "mars", tresorerie: 7_752.8 });
    // À la main : jusqu'en mars, le stock fait sortir en février et en mars le hors taxes des jeux en plus de janvier et de février.
    expect(c(19_302.8 - (2_031 - 1_590 + 1_534 - 1_450) * 22)).toBe(7_752.8);
    expect(ecartDeTresorerieAuTrenteJuin(NOVA_GESTION, POLITIQUE_ENVISAGEE)).toEqual({ jeuxEnPlusJusquEnMai: 216 + 426, montant: -642 * 22 });
    expect(t.tresorerieFin).toBe(c(63_641.6 - 642 * 22));
    expect(attendus(ch, "ce-que-coute-le-stock")).toEqual([642, 14_124, 49_517.6]);
  });

  it("les bonnes réponses : les ventes d'abord, les jeux d'avril TTC, les deux stocks, le même résultat, le budget tient, les achats de mars", () => {
    expect(juste(ch, "l-ordre-des-budgets")).toEqual(["Le budget des ventes"]);
    expect(juste(ch, "le-flux-tendu")[0]).toMatch(/^50\s160 €, les jeux d'avril TTC$/);
    expect(juste(ch, "le-point-bas")).toEqual(["Les deux stocks, payés dès février"]);
    expect(juste(ch, "predire-le-resultat")).toEqual(["Le même"]);
    expect(juste(ch, "le-controle-de-vraisemblance")).toEqual(["Le budget tient : le trimestre reste sous la capacité"]);
    expect(b.productionParTrimestre).toEqual([1_735 + 1_479 + 1_754, 1_913 + 2_043 + 2_127]);
    expect(b.productionParTrimestre[1]).toBeLessThanOrEqual(7_000);
    expect(b.productionLaPlusForte).toBeGreaterThan(2_120);
    expect(juste(ch, "l-interdependance")).toEqual(["Mars, par les achats de jeux"]);
  });

  it("l'interdépendance : 100 enceintes de plus en mai relèvent les achats de mars de 2 jeux et la production d'avril de 10", () => {
    const x = budgetsDuChapitre(NOVA);
    expect(COMMANDE_ANNONCEE).toEqual({ mois: 4, enceintes: 100 });
    expect(x.achatsQuiBougent.slice(0, 3)).toEqual([0, 0, 2]);
    expect(x.productionQuiBouge.slice(0, 5)).toEqual([0, 0, 0, 10, 90]);
    expect([x.premierAchat, x.premiereProduction]).toEqual([2, 3]);
  });
});

describe("le curseur et le laboratoire", () => {
  it("le curseur : au plus 14 % de stock de jeux garde le matelas (10 062,80 €), 15 % le perd (9 666,80 €)", () => {
    const x = budgetsDuChapitre(NOVA);
    expect(x.pointBasAuStock(14)).toBe(10_062.8);
    expect(x.pointBasAuStock(15)).toBe(9_666.8);
    gardeDuCurseur(ch, "le-stock-au-curseur", 14);
  });

  it("le laboratoire : le stock étudié tient au matelas avec le fournisseur payé à 51 jours, deux mois après la facture du 10", () => {
    const x = budgetsDuChapitre(NOVA);
    expect(x.fournisseurMin).toBe(51);
    // 10 + 50 = 60 : le mois suivant ; 10 + 51 = 61 : le deuxième mois suivant.
    expect(laboratoireDesStocks(NOVA_GESTION, { enceintes: 10, jeux: 20, fournisseur: 50 }).plusBas.tresorerie).toBe(7_752.8);
    expect(laboratoireDesStocks(NOVA_GESTION, { enceintes: 10, jeux: 20, fournisseur: 51 }).plusBas.tresorerie).toBeGreaterThanOrEqual(10_000);
    // Le résultat ne dépend ni des stocks ni du délai.
    expect(laboratoireDesStocks(NOVA_GESTION, { enceintes: 30, jeux: 50, fournisseur: 0 }).resultat).toBe(x.resultat);
    expect(x.resultat).toBe(40_941);
    gardeDuLaboratoire(ch, "le-laboratoire-des-stocks");
  });
});

describe("le cas dédié : si le fournisseur fermait en mai", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(SI_LE_FOURNISSEUR_FERMAIT_EN_MAI);
    gardeDuCas(SI_LE_FOURNISSEUR_FERMAIT_EN_MAI, ch);
  });

  it("avril achète 3 930 jeux, payés 103 752 € en mai ; la TVA d'avril devient un crédit de 952 € ; mai finit à 4 456 €, juin comme prévu", () => {
    const n = fermetureDeMai(NOVA);
    expect(n.jeuxAchetes).toEqual([1_590, 1_450, 1_738, 1_900 + 2_030, 0, 2_151]);
    const e = SI_LE_FOURNISSEUR_FERMAIT_EN_MAI;
    const montants = (id: string) => etape(chapitreDuCas(e, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-approvisionnements")).toEqual([2_030, 3_930, 0, c(3_930 * 26.4)]);
    const avril = c(1_900 * 21 * 0.2);
    const deductible = c(2_030 * 22 * 0.2);
    expect(montants("la-tva")).toEqual([deductible, c(avril - deductible), 0, c(2_030 * 21 * 0.2 + 2_030 * 22 * 0.2 - (deductible - avril))]);
    expect(c(avril - deductible)).toBe(-952);
    // Mai : le fournisseur reçoit deux mois de jeux, l'État rien ; juin rend tout.
    const mai = c(50_068 - (c(3_930 * 26.4) - 1_900 * 26.4) - (0 - 7_980));
    expect(mai).toBe(4_456);
    expect(montants("la-tresorerie")).toEqual([4_456, 63_641.6]);
    const r = etape(e, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Pas de découvert, mais un mois sous le matelas"]);
  });
});
