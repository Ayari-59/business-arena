import { describe, expect, it } from "vitest";
import { ENTREPRISES_DE_LA_VENTE, LE_PANIER_MOYEN } from "../../src/config/cours/chapitres/le-panier-moyen";
import { PROGRESSION_EN_POURCENT, SUIVRE_SES_VENTES, TRIMESTRE_SUIVI, optionsDuPourquoi, suiviDesVentes } from "../../src/config/cours/chapitres/suivre-ses-ventes";
import { PROGRAMME } from "../../src/config/cours/registre";
import { LE_PANIER_DE_FIN_D_ANNEE } from "../../src/config/cours/situations/par-chapitre/le-panier-de-fin-d-annee";
import { L_OBJECTIF_DE_L_ETE, TRIMESTRE_DE_L_ETE } from "../../src/config/cours/situations/par-chapitre/l-objectif-de-l-ete";
import { BOUTIQUE, attendus, gardeDuCas, gardeDuCurseur, gardeDuLaboratoire, gardeDuProgramme, gardesDeTexte, juste } from "./gardes-de-la-boutique";

/**
 * LE PANIER MOYEN ET SUIVRE SES VENTES (bac pro MCV, palier 1), SUR LA BOUTIQUE DU MONDE DU COURS,
 * ET LEURS CAS : LE PANIER DE FIN D'ANNÉE, L'OBJECTIF DE L'ÉTÉ.
 *
 * Refait à la main sur la fiche de MAILLE & CO, en caisse (les commandes des comités d'entreprise,
 * facturées, n'y passent pas) : janvier, 77 250 € hors taxes pour 940 passages en caisse et 1 330
 * articles, 38 300 € de coût variable ; décembre de N − 1 (l'hypothèse du cours), 231 850 € pour
 * 3 100 passages, 112 715 € de coût ; les ventes de N − 2 et de N − 1, trimestre par trimestre.
 */

const c = (x: number) => Math.round(x * 100) / 100 + 0;
const MCV = /^(Bac pro MCV|2de pro RC) · /;
const formation = (bloc: string) => (bloc.startsWith("Bac pro MCV") ? "bac-pro-mcv" : "seconde-pro-rc");

describe("les deux chapitres du Bac pro MCV et leurs cas", () => {
  it("portent les titres du programme, au palier 1, et des blocs qui se résolvent", () => {
    for (const ch of [LE_PANIER_MOYEN, SUIVRE_SES_VENTES]) {
      expect([ch.parcours, ch.palier]).toEqual(["vente", 1]);
      gardeDuProgramme(ch, PROGRAMME.vente[1]!, formation, MCV);
    }
    expect(LE_PANIER_MOYEN.blocs).toEqual(["Bac pro MCV · Bloc 1 · Conseiller et vendre", "Bac pro MCV · Bloc 2 · Suivre les ventes"]);
    expect(SUIVRE_SES_VENTES.blocs).toEqual(["Bac pro MCV · Bloc 2 · Suivre les ventes", "2de pro RC · Collecter et exploiter l'information dans le cadre de la relation client"]);
  });

  it("se jouent à la boutique du cours seule, et leurs cas leur sont dédiés", () => {
    expect([...ENTREPRISES_DE_LA_VENTE]).toEqual(["boutique"]);
    gardeDuCas(LE_PANIER_DE_FIN_D_ANNEE, LE_PANIER_MOYEN);
    gardeDuCas(L_OBJECTIF_DE_L_ETE, SUIVRE_SES_VENTES);
  });
});

describe("le panier moyen et la marge d'une vente", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(LE_PANIER_MOYEN);
  });

  it("82,18 € de panier en caisse, 40,74 € de coût, 41,44 € de marge ; les parts de l'écharpe et du mérinos", () => {
    expect(attendus(LE_PANIER_MOYEN, "le-panier")).toEqual([c(77_250 / 940)]);
    expect(attendus(LE_PANIER_MOYEN, "le-panier-par-article")).toEqual([c((270 * 35) / 940), c((70 * 135) / 940)]);
    expect(attendus(LE_PANIER_MOYEN, "la-marge")).toEqual([c(38_300 / 940), c(82.18 - 40.74)]);
    expect(attendus(LE_PANIER_MOYEN, "chaque-jour")).toEqual([2 * 30, c(60 * 82.18), c(60 * 41.44)]);
    expect(juste(LE_PANIER_MOYEN, "une-vente-de-plus")).toEqual(["41,44 €, la marge d'une vente"]);
    expect(juste(LE_PANIER_MOYEN, "l-article-a-proposer")).toEqual(["Pull mérinos"]);
  });

  it("le curseur : 3 ventes de plus par jour paient un vendeur à 2 840 € ; 2 n'en font que 2 486,40 €", () => {
    const e = gardeDuCurseur(LE_PANIER_MOYEN, "le-vendeur-en-plus", 3);
    expect(e.droites(BOUTIQUE).produit(2)).toBe(c(60 * 41.44));
    expect(e.droites(BOUTIQUE).cout(3)).toBe(2_000 * 1.42);
  });

  it("le laboratoire : 1 619 articles, la seule position qui porte le panier à 100 € ; il part des 1 330 articles et des 82,18 € de janvier", () => {
    const e = gardeDuLaboratoire(LE_PANIER_MOYEN, "le-laboratoire-du-panier");
    expect(e.defi(BOUTIQUE).solution).toEqual({ articles: 1_619 });
    expect(c((1_619 * 77_250) / 1_330 / 940)).toBeGreaterThanOrEqual(100);
    expect(c((1_618 * 77_250) / 1_330 / 940)).toBeLessThan(100);
    expect(e.leviers(BOUTIQUE)[0]!.depart).toBe(1_330);
    // Le départ du laboratoire est le mois des étapes précédentes, sans arrondi (audit, P1-7).
    const panier = e.lecture(BOUTIQUE, { articles: 1_330 }).find((l) => l.libelle === "Panier moyen")!;
    expect([panier.montant, panier.reference]).toEqual([c(77_250 / 940), c(77_250 / 940)]);
  });
});

describe("le panier de fin d'année", () => {
  it("décembre en caisse : 74,79 € de panier, 36,36 € de coût, 38,43 € de marge ; le panier baisse", () => {
    expect(attendus(LE_PANIER_DE_FIN_D_ANNEE, "la-fin-d-annee")).toEqual([c(231_850 / 3_100), c(112_715 / 3_100), c(74.79 - 36.36)]);
    expect(attendus(LE_PANIER_DE_FIN_D_ANNEE, "les-ecarts")).toEqual([c(74.79 - 82.18), c(38.43 - 41.44)]);
    expect(juste(LE_PANIER_DE_FIN_D_ANNEE, "reponse")).toEqual(["Non : le panier a baissé, et la marge avec lui"]);
  });
});

describe("suivre ses ventes : l'objectif, le réalisé, l'écart", () => {
  it("les textes sont propres, une seule bonne réponse, les notions existent", () => {
    gardesDeTexte(SUIVRE_SES_VENTES);
  });

  it("le trimestre 4 de N − 1 : 12 000 × 1,05 = 12 600 visés, 12 500 vendus, 14 440 demandés", () => {
    expect([PROGRESSION_EN_POURCENT, TRIMESTRE_SUIVI]).toEqual([5, 4]);
    expect(attendus(SUIVRE_SES_VENTES, "l-objectif")).toEqual([12_600]);
    expect(attendus(SUIVRE_SES_VENTES, "l-ecart")).toEqual([-100, Math.round((-100 / 12_600) * 1_000) / 10]);
    expect(attendus(SUIVRE_SES_VENTES, "le-taux-de-realisation")).toEqual([Math.round((12_500 / 12_600) * 1_000) / 10]);
    expect(attendus(SUIVRE_SES_VENTES, "les-clients")).toEqual([14_440 - 12_500, 14_440 - 12_600]);
    expect(juste(SUIVRE_SES_VENTES, "pourquoi")).toEqual(["Assez de clients sont venus, mais tous n'ont pas été servis"]);
    expect(juste(SUIVRE_SES_VENTES, "et-ensuite")).toEqual(["Servir tous les clients qui viennent"]);
    // Les prix n'expliquent jamais l'écart : les étiquettes n'ont pas changé.
    expect(optionsDuPourquoi(suiviDesVentes(BOUTIQUE)).find((o) => /prix/.test(o.texte))!.juste).toBe(false);
  });

  it("le curseur : 4 % de progression au plus tenaient (12 480 visés) ; 5 % en demandent 12 600", () => {
    const e = gardeDuCurseur(SUIVRE_SES_VENTES, "jusqu-ou-viser", 4);
    expect(e.droites(BOUTIQUE).cout(4)).toBe(12_480);
  });

  it("le laboratoire : 2 000 articles de plus en réserve servent les 14 440 demandés ; 1 900 en laissent 40", () => {
    const e = gardeDuLaboratoire(SUIVRE_SES_VENTES, "le-laboratoire-de-la-reserve");
    expect(e.defi(BOUTIQUE).solution).toEqual({ enPlus: 2_000 });
  });
});

describe("l'objectif de l'été", () => {
  it("l'été de N − 1 : 5 177 × 1,05 = 5 435,85, soit 5 436 visés ; 5 588 vendus ; la prime est gagnée", () => {
    expect(TRIMESTRE_DE_L_ETE).toBe(3);
    expect(attendus(L_OBJECTIF_DE_L_ETE, "l-objectif-et-le-realise")).toEqual([5_436, 5_588 - 5_436, Math.round((5_588 / 5_436) * 1_000) / 10]);
    expect(attendus(L_OBJECTIF_DE_L_ETE, "les-clients-de-l-ete")).toEqual([0, 5_588 - 5_436]);
    expect(juste(L_OBJECTIF_DE_L_ETE, "reponse")).toEqual(["Prime gagnée : les ventes atteignent l'objectif"]);
  });
});
