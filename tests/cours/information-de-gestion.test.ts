import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CE_QUE_COUTE_UN_OUTIL_NUMERIQUE } from "../../src/config/cours/chapitres/ce-que-coute-un-outil-numerique";
import { CONSTRUIRE_UN_INDICATEUR_JUSTE } from "../../src/config/cours/chapitres/construire-un-indicateur-juste";
import { DES_DONNEES_A_L_INFORMATION } from "../../src/config/cours/chapitres/des-donnees-a-l-information";
import { FACTEUR_DE_LA_VIRGULE, UNE_DONNEE_FAUSSE } from "../../src/config/cours/chapitres/une-donnee-fausse";
import { RETARD, RETARD_LONG, UNE_INFORMATION_A_TEMPS } from "../../src/config/cours/chapitres/une-information-a-temps";
import { anneeAvecUnRetard, indicateurDuPrix, tableDesVentes } from "../../src/config/cours/monde/gestion-et-information";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LA_CASE_VIDE } from "../../src/config/cours/situations/par-chapitre/la-case-vide";
import { LA_PART_DE_MARCHE_ANNONCEE } from "../../src/config/cours/situations/par-chapitre/la-part-de-marche-annoncee";
import { LE_COMPTE_RENDU_EN_RETARD } from "../../src/config/cours/situations/par-chapitre/le-compte-rendu-en-retard";
import { LE_TRIMESTRE_LE_PLUS_FORT } from "../../src/config/cours/situations/par-chapitre/le-trimestre-le-plus-fort";
import { UNE_SECONDE_JOURNEE_DE_FORMATION } from "../../src/config/cours/situations/par-chapitre/une-seconde-journee-de-formation";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";

/**
 * L'INFORMATION DE GESTION SUR LE MONDE DU COURS (lot M3) : CONSTRUIRE UN INDICATEUR JUSTE, DES
 * DONNÉES À L'INFORMATION, UNE DONNÉE FAUSSE, UNE INFORMATION À TEMPS, CE QUE COÛTE UN OUTIL
 * NUMÉRIQUE, ET LEURS CAS.
 *
 * Refait à la main : les prix des trois enseignes (59, 51 et 79 €) et leurs ventes de l'année type
 * (celles du modèle d'attractivité) ; la table des ventes du semestre de NOVA (les particuliers et
 * CampusTech, mois par mois, à 59 €) ; les ventes de N (4 778, 6 081, 5 810, 6 940 enceintes), la
 * capacité de 7 000 enceintes par trimestre, la marge de 21 € et les charges fixes de 93 549 € par
 * trimestre ; l'offre du logiciel (40 € par utilisateur et par mois, 2 500 € de mise en place,
 * 300 € de formation par utilisateur, 4 utilisateurs).
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const N = [4_778, 6_081, 5_810, 6_940];

describe("les chapitres du lot et leurs cas, dans leurs parcours", () => {
  it("portent les titres du programme, au palier 1, chez NOVA seule, et leurs cas leur sont dédiés", () => {
    for (const ch of [CONSTRUIRE_UN_INDICATEUR_JUSTE, DES_DONNEES_A_L_INFORMATION, UNE_DONNEE_FAUSSE, CE_QUE_COUTE_UN_OUTIL_NUMERIQUE]) gardeDuProgramme(ch, PROGRAMME["stmg-sig"][1]!);
    gardeDuProgramme(UNE_INFORMATION_A_TEMPS, PROGRAMME["stmg-management"][1]!);
    gardeDuCas(LA_PART_DE_MARCHE_ANNONCEE, CONSTRUIRE_UN_INDICATEUR_JUSTE);
    gardeDuCas(LE_TRIMESTRE_LE_PLUS_FORT, DES_DONNEES_A_L_INFORMATION);
    gardeDuCas(LA_CASE_VIDE, UNE_DONNEE_FAUSSE);
    gardeDuCas(LE_COMPTE_RENDU_EN_RETARD, UNE_INFORMATION_A_TEMPS);
    gardeDuCas(UNE_SECONDE_JOURNEE_DE_FORMATION, CE_QUE_COUTE_UN_OUTIL_NUMERIQUE);
  });
});

describe("construire un indicateur juste", () => {
  const k = indicateurDuPrix();
  const [nova, soundbox, auris] = k.enseignes as [(typeof k.enseignes)[number], (typeof k.enseignes)[number], (typeof k.enseignes)[number]];
  const ventes = nova.ventes + soundbox.ventes + auris.ventes;
  const pondere = c((nova.ventes * 59 + soundbox.ventes * 51 + auris.ventes * 79) / ventes);

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CONSTRUIRE_UN_INDICATEUR_JUSTE);
  });

  it("la moyenne simple, 63 €, et le prix pondéré par les ventes ; l'indice simple croit NOVA moins chère, le pondéré la dit alignée", () => {
    expect([nova.prix, soundbox.prix, auris.prix]).toEqual([59, 51, 79]);
    expect(attendus(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-calculs")).toEqual([(59 + 51 + 79) / 3, pondere]);
    expect(attendus(CONSTRUIRE_UN_INDICATEUR_JUSTE, "deux-indices")).toEqual([Math.round((59 / 63) * 100), Math.round((59 / pondere) * 100)]);
    expect(Math.round((59 / 63) * 100)).toBe(94);
    expect(juste(CONSTRUIRE_UN_INDICATEUR_JUSTE, "ce-que-l-erreur-ferait-decider")).toEqual(["Monter son prix à tort : elle se croirait moins chère que le marché"]);
  });

  it("la moyenne du marché que cite la dernière étape est bien, dans l'arène, la moyenne simple des prix", () => {
    const service = readFileSync(join(process.cwd(), "src/services/game-view.service.ts"), "utf8");
    expect(service).toContain("withPrice.reduce((s, c) => s + c.avgPrice!, 0) / withPrice.length");
    expect(readFileSync(join(process.cwd(), "src/components/competitive-benchmark.tsx"), "utf8")).toContain("Moyenne du marché");
  });

  it("le curseur : les ventes d'Auris qui font monter le prix pondéré à 63 €, les deux autres gardées", () => {
    const q = Math.ceil((63 * (nova.ventes + soundbox.ventes) - 59 * nova.ventes - 51 * soundbox.ventes) / (79 - 63));
    gardeDuCurseur(CONSTRUIRE_UN_INDICATEUR_JUSTE, "le-poids-des-ventes", q);
  });

  it("le laboratoire : le prix le plus haut de NOVA, à l'euro, dont l'indice pondéré reste d'au plus 105", () => {
    const e = gardeDuLaboratoire(CONSTRUIRE_UN_INDICATEUR_JUSTE, "le-laboratoire-de-l-indice");
    const p = e.defi(NOVA).solution.prix!;
    expect(indicateurDuPrix(undefined, p).indicePondere).toBeLessThanOrEqual(105);
    expect(indicateurDuPrix(undefined, p + 1).indicePondere).toBeGreaterThan(105);
  });

  it("le cas de la part annoncée : la moyenne des six parts mensuelles, et la part du semestre, 10 859 sur 43 000", () => {
    const parts = [1_590 / 6_000, 1_450 / 5_600, 1_738 / 6_500, 1_900 / 7_400, 2_030 / 8_300, 2_151 / 9_200].map((x) => auDixieme(x * 100));
    expect(attendus(LA_PART_DE_MARCHE_ANNONCEE, "la-moyenne")).toEqual([auDixieme(auDixieme(parts.reduce((a, b) => a + b, 0)) / 6)]);
    expect(attendus(LA_PART_DE_MARCHE_ANNONCEE, "la-part-du-semestre").slice(0, 3)).toEqual([10_859, 43_000, auDixieme((10_859 / 43_000) * 100)]);
    expect(juste(LA_PART_DE_MARCHE_ANNONCEE, "reponse")).toEqual(["Oui : l'écart reste sous 1 point, c'est la même"]);
  });
});

describe("des données à l'information", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(DES_DONNEES_A_L_INFORMATION);
  });

  it("douze lignes, six mois et deux clientèles ; les regroupements et les parts de CampusTech, 20,1 % puis 15,8 %", () => {
    expect(tableDesVentes().map((l) => l.ventes)).toEqual([1_270, 320, 1_130, 320, 1_418, 320, 1_580, 320, 1_710, 320, 1_831, 320]);
    expect(attendus(DES_DONNEES_A_L_INFORMATION, "regrouper")).toEqual([(1_270 + 1_130 + 1_418 + 1_580 + 1_710 + 1_831) * 59, 6 * 320 * 59]);
    const t1 = 4_778 * 59;
    const t2 = 6_081 * 59;
    expect(attendus(DES_DONNEES_A_L_INFORMATION, "critere-et-part")).toEqual([t1, auDixieme(((960 * 59) / t1) * 100), t2, auDixieme(((960 * 59) / t2) * 100)]);
    expect(juste(DES_DONNEES_A_L_INFORMATION, "decider")).toEqual(["NOVA dépend moins de CampusTech : sa part recule"]);
    expect(triDe(DES_DONNEES_A_L_INFORMATION, "donnee-ou-information")["Chiffre d'affaires de CampusTech sur le semestre"]).toBe("information");
  });

  it("le curseur : 430 enceintes par mois garderaient à CampusTech sa part du premier trimestre ; 429 non", () => {
    gardeDuCurseur(DES_DONNEES_A_L_INFORMATION, "garder-sa-part", 430);
    const part = (960 * 59) / (4_778 * 59);
    const particuliers = (1_580 + 1_710 + 1_831) * 59;
    expect((3 * 430 * 59) / (particuliers + 3 * 430 * 59)).toBeGreaterThanOrEqual(part);
    expect((3 * 429 * 59) / (particuliers + 3 * 429 * 59)).toBeLessThan(part);
  });

  it("le laboratoire : juin, le mois où CampusTech pèse le moins, 18 880 € sur 126 909 €", () => {
    const e = gardeDuLaboratoire(DES_DONNEES_A_L_INFORMATION, "le-laboratoire-du-filtre");
    expect(e.defi(NOVA).solution).toEqual({ mois: 6 });
  });

  it("le cas du trimestre le plus fort : le deuxième, où les particuliers pèsent 84,2 %, plus que sur le semestre", () => {
    expect(attendus(LE_TRIMESTRE_LE_PLUS_FORT, "par-trimestre")).toEqual([4_778 * 59, 6_081 * 59]);
    expect(attendus(LE_TRIMESTRE_LE_PLUS_FORT, "la-part")).toEqual([auDixieme(((5_121 * 59) / (6_081 * 59)) * 100), auDixieme((8_939 / 10_859) * 100)]);
    expect(juste(LE_TRIMESTRE_LE_PLUS_FORT, "reponse")).toEqual(["Vers les particuliers : ils pèsent plus au trimestre le plus fort"]);
  });
});

describe("une donnée fausse, une décision fausse", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(UNE_DONNEE_FAUSSE);
  });

  it("la virgule : 581 saisies pour 5 810 ; la prévision tombe de 5 556 à 3 813 ; 1 743 enceintes et 36 603 € perdus au trimestre 4", () => {
    expect(FACTEUR_DE_LA_VIRGULE).toBe(10);
    expect(attendus(UNE_DONNEE_FAUSSE, "coherence")).toEqual([4_778 * 59, 6_081 * 59, 581 * 59]);
    expect(attendus(UNE_DONNEE_FAUSSE, "prevision")).toEqual([(5_810 * 59) / 59, Math.round((4_778 + 6_081 + 581) / 3), Math.round((4_778 + 6_081 + 5_810) / 3)]);
    expect(attendus(UNE_DONNEE_FAUSSE, "le-trimestre-rejoue")).toEqual([5_556 - 3_813, (5_556 - 3_813) * 21]);
    expect(juste(UNE_DONNEE_FAUSSE, "controle")).toEqual(["Comparer ventes × prix au chiffre d'affaires saisi"]);
  });

  it("le curseur : 5 810, la seule saisie dont le produit par 59 € retombe sur les 342 790 € des factures", () => {
    gardeDuCurseur(UNE_DONNEE_FAUSSE, "la-saisie-qui-retombe", 342_790 / 59);
  });

  it("le laboratoire : la donnée corrigée et le dernier trimestre (5 810) font manquer 1 130 enceintes, moins que la moyenne corrigée (1 384)", () => {
    const e = gardeDuLaboratoire(UNE_DONNEE_FAUSSE, "le-laboratoire-de-la-prevision");
    expect(e.defi(NOVA).solution).toEqual({ donnee: 1, regle: 1 });
    expect([6_940 - 5_810, 6_940 - 5_556]).toEqual([1_130, 1_384]);
  });

  it("le cas de la case vide : le tableur divise 10 588 par 3, 3 529 ; 2 027 enceintes et 42 567 € perdus", () => {
    expect(attendus(LA_CASE_VIDE, "completer")).toEqual([6_081, 16_669, 5_556]);
    const plan = Math.round((4_778 + 5_810) / 3);
    expect(plan).toBe(3_529);
    expect(attendus(LA_CASE_VIDE, "le-trimestre-rejoue")).toEqual([5_556 - plan, (5_556 - plan) * 21]);
  });
});

describe("une information qui circule à temps", () => {
  // L'année N à jour : le plan suit les commandes ; tout est vendu. Résultat de l'activité = 21 × ventes − 93 549 par trimestre.
  const resultatAJour = 21 * (4_778 + 6_081 + 5_810 + 6_940) - 4 * 93_549;

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(UNE_INFORMATION_A_TEMPS);
    expect([RETARD, RETARD_LONG]).toEqual([1, 2]);
  });

  it("un trimestre de retard : les plans 4 778, 4 778, 6 081, 5 810 ; 1 303 puis 859 enceintes non servies, 271 en stock ; 45 402 € perdus", () => {
    const a = anneeAvecUnRetard(undefined, 1);
    expect(a.trimestres.map((t) => t.plan)).toEqual([N[0], N[0], N[1], N[2]]);
    // Au trimestre 4 : 5 810 fabriquées et 271 en stock pour 6 940 demandées.
    expect(a.trimestres.map((t) => t.nonServie)).toEqual([0, 6_081 - 4_778, 0, 6_940 - (5_810 + (6_081 - 5_810))]);
    expect(attendus(UNE_INFORMATION_A_TEMPS, "le-plan-en-retard")).toEqual([4_778 - 6_081, 6_081 - 5_810, 5_810 - 6_940]);
    const perdues = 1_303 + 859;
    expect(attendus(UNE_INFORMATION_A_TEMPS, "ce-que-coute-le-retard")).toEqual([perdues, perdues * 21, auDixieme(((perdues * 21) / resultatAJour) * 100)]);
  });

  it("deux trimestres de retard : 1 303, 1 032 et 859 enceintes non servies, 67 074 €", () => {
    expect(attendus(UNE_INFORMATION_A_TEMPS, "deux-trimestres")).toEqual([(1_303 + (5_810 - 4_778) + (6_940 - 6_081)) * 21]);
    expect(juste(UNE_INFORMATION_A_TEMPS, "un-chiffre-plus-vieux")).toEqual(["Plus, mais moins du double"]);
  });

  it("le curseur : 1 303 enceintes de précaution servent le trimestre 2 ; le laboratoire : 1 400 servent toute l'année avec deux trimestres de retard", () => {
    gardeDuCurseur(UNE_INFORMATION_A_TEMPS, "la-precaution", 6_081 - 4_778);
    const e = gardeDuLaboratoire(UNE_INFORMATION_A_TEMPS, "le-laboratoire-de-la-precaution");
    expect(e.defi(NOVA).solution).toEqual({ precaution: 1_400 });
    // À 1 300, le trimestre 2 n'a que 6 078 enceintes pour 6 081 demandées.
    expect(anneeAvecUnRetard(undefined, 2, 1_300).trimestres[1]!.nonServie).toBe(3);
    expect(anneeAvecUnRetard(undefined, 2, 1_400).resultat).toBe(resultatAJour);
  });

  it("le cas du compte rendu en retard : le plan du trimestre 4 calé sur 5 810, 1 130 enceintes et 23 730 € perdus", () => {
    expect(attendus(LE_COMPTE_RENDU_EN_RETARD, "les-ecarts")).toEqual([5_810 - 6_940, 5_810 - 6_940, 6_940 - 5_810]);
    expect(attendus(LE_COMPTE_RENDU_EN_RETARD, "le-cout")).toEqual([1_130 * 21, auDixieme(((1_130 * 21) / resultatAJour) * 100)]);
  });
});

describe("ce que coûte et rapporte un outil numérique", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE);
  });

  it("5 620 € la première année ; 30 % des 2 162 ventes manquées, 649 enceintes à 21 €, 13 629 € par an ; 3,8 mois ; 14,1 %", () => {
    expect(attendus(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "cout")).toEqual([4 * 40 * 12, 4 * 300, 1_920 + 2_500 + 1_200]);
    expect(attendus(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "gain")).toEqual([Math.round(2_162 * 0.3), 649 * 21]);
    expect(attendus(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "delai")).toEqual([13_629 - 1_920, auDixieme((3_700 / 11_709) * 12)]);
    expect(attendus(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "adoption")).toEqual([auDixieme((1_920 / 13_629) * 100), c(13_629 * 0.6), c(13_629 * 0.6 - 1_920)]);
    expect(juste(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "verdict")).toEqual(["L'outil se rembourse dans la première année"]);
  });

  it("le curseur : 15 % d'adoption paient les 1 920 € d'abonnement ; le laboratoire : 50 % remboursent les 5 620 € dans l'année", () => {
    gardeDuCurseur(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "l-adoption-qui-paie", Math.ceil((1_920 / 13_629) * 100));
    const e = gardeDuLaboratoire(CE_QUE_COUTE_UN_OUTIL_NUMERIQUE, "le-laboratoire-de-l-adoption");
    expect([13_629 * 0.4 < 5_620, 13_629 * 0.5 >= 5_620]).toEqual([true, true]);
    expect(e.defi(NOVA).solution).toEqual({ adoption: 50 });
  });

  it("le cas de la seconde journée : 1 200 € pour passer de 60 % à 90 % d'adoption, payés dès la première année", () => {
    expect(attendus(UNE_SECONDE_JOURNEE_DE_FORMATION, "journee")).toEqual([1_200, c(13_629 * 0.3), c(13_629 * 0.3 - 1_200)]);
  });
});
