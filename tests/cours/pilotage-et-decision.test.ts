import { describe, expect, it } from "vitest";
import { DECIDER_AVEC_DES_CHIFFRES } from "../../src/config/cours/chapitres/decider-avec-des-chiffres";
import { EVALUER_SON_ACTIVITE } from "../../src/config/cours/chapitres/evaluer-son-activite";
import { SE_FIXER_DES_OBJECTIFS, TAUX_DE_CAPACITE_VISE } from "../../src/config/cours/chapitres/se-fixer-des-objectifs";
import { PUBLICITE_ENVISAGEE, anneeAvecLaPublicite, semestreDeNova, suiviDesObjectifs } from "../../src/config/cours/monde/gestion-et-information";
import { PROGRAMME } from "../../src/config/cours/registre";
import { DOUBLER_LA_PUBLICITE } from "../../src/config/cours/situations/par-chapitre/doubler-la-publicite";
import { LE_SECOND_SEMESTRE } from "../../src/config/cours/situations/par-chapitre/le-second-semestre";
import { TAUX_AMBITIEUX, UN_OBJECTIF_PLUS_AMBITIEUX } from "../../src/config/cours/situations/par-chapitre/un-objectif-plus-ambitieux";
import { NOVA, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-nova";

/**
 * PILOTER ET DÉCIDER SUR LE MONDE DU COURS (lot M3) : ÉVALUER SON ACTIVITÉ, DÉCIDER AVEC DES
 * CHIFFRES, SE FIXER DES OBJECTIFS, ET LEURS CAS.
 *
 * Refait à la main : les six mois du semestre de NOVA (1 590, 1 450, 1 738, 1 900, 2 030 et 2 151
 * enceintes à 59 €, 21 € de marge chacune, 31 183 € de charges fixes par mois) ; la publicité sur le
 * marché à trois (les ventes de NOVA à chaque budget sont celles du modèle d'attractivité) ; la
 * capacité de NOVA (7 000 enceintes par trimestre pour la ligne, 7 200 pour l'équipe) et ses
 * ventes de N (4 778, 6 081, 5 810, 6 940) et sa demande prévue de N + 1 (5 800, 7 400, 6 200, 7 800).
 */

const ventes = [1_590, 1_450, 1_738, 1_900, 2_030, 2_151];
const resultat = (q: number) => q * 21 - 31_183;

describe("les chapitres du lot et leurs cas, dans leurs parcours", () => {
  it("portent les titres du programme, au palier 1, chez NOVA seule, et leurs cas leur sont dédiés", () => {
    gardeDuProgramme(EVALUER_SON_ACTIVITE, PROGRAMME["seconde-mg"][1]!);
    gardeDuProgramme(DECIDER_AVEC_DES_CHIFFRES, PROGRAMME["seconde-mg"][1]!);
    gardeDuProgramme(SE_FIXER_DES_OBJECTIFS, PROGRAMME.strategie[1]!);
    gardeDuCas(LE_SECOND_SEMESTRE, EVALUER_SON_ACTIVITE);
    gardeDuCas(DOUBLER_LA_PUBLICITE, DECIDER_AVEC_DES_CHIFFRES);
    gardeDuCas(UN_OBJECTIF_PLUS_AMBITIEUX, SE_FIXER_DES_OBJECTIFS);
  });
});

describe("évaluer son activité", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(EVALUER_SON_ACTIVITE);
  });

  it("les six mois : le chiffre d'affaires et le résultat refaits à la main ; février en perte", () => {
    const s = semestreDeNova();
    expect(s.map((m) => m.chiffreDAffaires)).toEqual(ventes.map((q) => q * 59));
    expect(s.map((m) => m.resultat)).toEqual(ventes.map(resultat));
    expect(resultat(1_450)).toBe(-733);
  });

  it("janvier à juin : +35,3 % de chiffre d'affaires et de ventes, un prix stable, juin le meilleur mois", () => {
    const evolution = Math.round(((2_151 - 1_590) / 1_590) * 1_000) / 10;
    expect(attendus(EVALUER_SON_ACTIVITE, "evolutions")).toEqual([evolution, evolution]);
    expect(juste(EVALUER_SON_ACTIVITE, "le-prix-moyen")).toEqual(["Il n'a presque pas bougé : les deux évoluent ensemble"]);
    expect(juste(EVALUER_SON_ACTIVITE, "le-meilleur-mois")).toEqual(["Juin"]);
    expect(attendus(EVALUER_SON_ACTIVITE, "resultat-et-tresorerie")).toEqual([resultat(2_151) - resultat(1_590), Math.round((63_641.6 - 58_838) * 100) / 100]);
  });

  it("le curseur : 35 enceintes de plus sortent février de la perte ; 34 n'y suffisent pas", () => {
    gardeDuCurseur(EVALUER_SON_ACTIVITE, "le-mois-en-perte", Math.ceil(733 / 21));
    expect(resultat(1_450 + 34)).toBeLessThan(0);
  });

  it("le laboratoire : 60 €, le premier prix au pas de 0,50 € qui met février à l'équilibre", () => {
    const e = gardeDuLaboratoire(EVALUER_SON_ACTIVITE, "le-laboratoire-du-prix");
    expect(1_450 * (59.5 - 38)).toBeLessThan(31_183);
    expect(1_450 * (60 - 38)).toBeGreaterThanOrEqual(31_183);
    expect(e.defi(NOVA).solution).toEqual({ prix: 60 });
  });

  it("le cas des deux trimestres : 281 902 € puis 358 779 €, +27,3 % ; le résultat passe de 6 789 € à 34 152 €", () => {
    const t1 = ventes.slice(0, 3);
    const t2 = ventes.slice(3);
    const somme = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(attendus(LE_SECOND_SEMESTRE, "chiffre-et-ventes")).toEqual([
      somme(t1) * 59,
      somme(t2) * 59,
      Math.round(((somme(t2) - somme(t1)) / somme(t1)) * 1_000) / 10,
      Math.round(((somme(t2) - somme(t1)) / somme(t1)) * 1_000) / 10,
    ]);
    expect(attendus(LE_SECOND_SEMESTRE, "resultats")).toEqual([somme(t1.map(resultat)), somme(t2.map(resultat)), somme(t2.map(resultat)) - somme(t1.map(resultat))]);
    expect(juste(LE_SECOND_SEMESTRE, "reponse")).toEqual(["Oui : chiffre d'affaires et résultat en hausse au deuxième trimestre"]);
  });
});

describe("décider avec des chiffres", () => {
  const sans = anneeAvecLaPublicite(undefined, 0);
  const avec = anneeAvecLaPublicite(undefined, PUBLICITE_ENVISAGEE);

  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(DECIDER_AVEC_DES_CHIFFRES);
  });

  it("prévoir : 16 000 € de publicité demandent 762 ventes de plus à 21 € ; constater : la marge gagnée ne les paie pas", () => {
    // Les ventes à chaque budget sont celles du modèle d'attractivité : les données de départ.
    expect(avec.ventes).toBeGreaterThan(sans.ventes);
    const gagnees = avec.ventes - sans.ventes;
    expect(attendus(DECIDER_AVEC_DES_CHIFFRES, "prevoir")).toEqual([21, Math.ceil((4 * 4_000) / 21)]);
    expect(attendus(DECIDER_AVEC_DES_CHIFFRES, "constater")).toEqual([gagnees, gagnees * 21, gagnees * 21 - 16_000]);
    expect(gagnees).toBeLessThan(762);
    expect(juste(DECIDER_AVEC_DES_CHIFFRES, "le-bon-choix")).toEqual(["S'en passer : la publicité coûte plus qu'elle ne rapporte"]);
  });

  it("le curseur : 762 ventes paient la publicité ; 761 n'en font que 15 981 €", () => {
    gardeDuCurseur(DECIDER_AVEC_DES_CHIFFRES, "les-ventes-qui-paient", 762);
    expect(761 * 21).toBe(15_981);
  });

  it("le laboratoire : sans publicité, le meilleur résultat de l'année ; chaque millier d'euros en plus le fait baisser", () => {
    const e = gardeDuLaboratoire(DECIDER_AVEC_DES_CHIFFRES, "le-laboratoire-de-la-publicite");
    expect(e.defi(NOVA).solution).toEqual({ budget: 0 });
    const resultats = Array.from({ length: 17 }, (_, k) => anneeAvecLaPublicite(undefined, k * 1_000).resultat);
    for (let k = 1; k < resultats.length; k++) expect(resultats[k]!).toBeLessThan(resultats[k - 1]!);
  });

  it("le cas du budget doublé : 16 000 € de plus, des ventes gagnées qui ne les paient pas", () => {
    const double = anneeAvecLaPublicite(undefined, 2 * PUBLICITE_ENVISAGEE);
    expect(attendus(DOUBLER_LA_PUBLICITE, "prevoir")).toEqual([16_000, 21, 762]);
    const gagnees = double.ventes - avec.ventes;
    expect(attendus(DOUBLER_LA_PUBLICITE, "constater")).toEqual([gagnees, gagnees * 21 - 16_000]);
    expect(gagnees).toBeLessThan(762);
    expect(juste(DOUBLER_LA_PUBLICITE, "reponse")).toEqual(["Gardez la campagne proposée : le budget en plus coûte plus qu'il ne rapporte"]);
  });
});

describe("se fixer des objectifs et les suivre", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(SE_FIXER_DES_OBJECTIFS);
  });

  it("l'année N : 7 000 enceintes de capacité, 4 900 visées par trimestre ; le premier trimestre manque de demande ; l'objectif est tenu", () => {
    expect(TAUX_DE_CAPACITE_VISE).toBe(0.7);
    expect(attendus(SE_FIXER_DES_OBJECTIFS, "objectif")).toEqual([Math.min(7_000, 4 * 3 * 600), 0.7 * 7_000, 4 * 4_900]);
    expect(attendus(SE_FIXER_DES_OBJECTIFS, "ecarts")).toEqual([4_778 - 4_900, 6_081 - 4_900, 5_810 - 4_900, 6_940 - 4_900, Math.round((23_609 / 19_600) * 1_000) / 10]);
    expect(juste(SE_FIXER_DES_OBJECTIFS, "origine")).toEqual(["De la demande : il n'y avait pas assez de clients pour atteindre l'objectif"]);
    expect(juste(SE_FIXER_DES_OBJECTIFS, "conclusion")).toEqual(["Objectif tenu : les ventes de l'année l'atteignent"]);
  });

  it("le curseur : 68 % (4 760 enceintes) tient chaque trimestre de N ; 69 % (4 830) manque le premier", () => {
    gardeDuCurseur(SE_FIXER_DES_OBJECTIFS, "le-plus-haut-objectif", 68);
    expect([Math.round(7_000 * 0.68), Math.round(7_000 * 0.69)]).toEqual([4_760, 4_830]);
  });

  it("le laboratoire : 80 % pour N + 1, tenu même au trimestre calme (5 800 enceintes) ; 85 % (5 950) ne l'est plus", () => {
    const e = gardeDuLaboratoire(SE_FIXER_DES_OBJECTIFS, "le-laboratoire-de-l-objectif");
    expect(e.defi(NOVA).solution).toEqual({ taux: 80 });
    expect(suiviDesObjectifs(undefined, 0.85, "N+1").tenus).toBe(3);
    expect(suiviDesObjectifs(undefined, 0.8, "N+1").trimestres.map((t) => t.ventes)).toEqual([5_800, 7_000, 6_200, 7_000]);
  });

  it("le cas de l'objectif ambitieux : 90 %, 6 300 par trimestre, 25 200 sur l'année, plus que les 23 609 demandées", () => {
    expect(TAUX_AMBITIEUX).toBe(0.9);
    expect(attendus(UN_OBJECTIF_PLUS_AMBITIEUX, "objectif")).toEqual([6_300, 25_200, 4_778 + 6_081 + 5_810 + 6_940, 1]);
    expect(juste(UN_OBJECTIF_PLUS_AMBITIEUX, "reponse")).toEqual(["Hors de portée : la demande de cette année n'y suffisait pas"]);
  });
});
