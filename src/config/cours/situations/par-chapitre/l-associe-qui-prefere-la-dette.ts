import { arrondi2, eur, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_VALEUR } from "../../chapitres/la-valeur-et-le-temps";
import { BETA_DES_CAPITAUX_PROPRES, DETTE_A_LA_PLACE_DU_CAPITAL, capitalOuDette } from "../../monde/couts-de-financement";
import { TAUX_DE_L_IMPOT } from "../../monde/financement-de-la-gamme";
import { PRIME_DE_RISQUE_DU_MARCHE, TAUX_SANS_RISQUE } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ARBITRER LES COÛTS DE FINANCEMENT » : L'ASSOCIÉ QUI PRÉFÈRE LA DETTE
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : la structure de NOVA après N+1 et son CMPC
 * (monde/couts-de-financement.ts, `capitalOuDette`).
 *
 * HYPOTHÈSES DU CAS (DETTE_A_LA_PLACE_DU_CAPITAL) : au lieu de lever 60 000 € par augmentation de
 * capital, un associé propose de les emprunter. La banque prêterait ce supplément à 6 % ; plus
 * endettés, les actionnaires porteraient un bêta de 1,4 au lieu de 1,1. La dette paraît moins chère,
 * mais elle renchérit le capital qui reste : le CMPC monte. L'élève refait seul le chemin du chapitre
 * et voit la théorie du compromis à l'œuvre.
 */

/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const nb = (x: number) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: 6 });
const enPct = (t: number) => arrondi2(t * 100);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function associeQuiPrefereLaDette(_c?: Pick<Cas, "code">) {
  return capitalOuDette();
}

export const L_ASSOCIE_QUI_PREFERE_LA_DETTE: Situation = {
  code: "l-associe-qui-prefere-la-dette",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["arbitrer-les-couts-de-financement"],
  commanditaire: "Un associé",
  titre: "L'associé qui préfère la dette",
  accroche: "Un associé ne veut pas ouvrir le capital : « la dette coûte deux fois moins ». Mais la dette de plus rend aussi les actionnaires plus exigeants. Le CMPC tranche.",
  objectifs: [
    "Calculer le coût après impôt d'une dette nouvelle et le coût des capitaux propres par le MEDAF",
    "Calculer le CMPC de deux structures de financement",
    "Rendre une réponse chiffrée, et dire pourquoi la dette la moins chère ne fait pas le capital le moins cher",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "ce cas reprend le chapitre « Arbitrer les coûts de financement », qui se joue sur les financements de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de l'associé",
      texte: () => {
        const x = associeQuiPrefereLaDette();
        const plus = x.avecLaDette.lignes[2]!;
        return [
          `« Pourquoi ouvrir le capital ? Empruntons les ${eur(plus.montant)} de plus. Même à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)}, la dette nous coûte deux fois moins que nos actionnaires. »`,
          `La banque prêterait bien ce supplément, à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)}. Mais un analyste prévient : plus endettés, les actionnaires de NOVA porteraient un bêta de ${nb(DETTE_A_LA_PLACE_DU_CAPITAL.beta)}, et non plus ${nb(BETA_DES_CAPITAUX_PROPRES)}.`,
          "Pas de cours cette fois : vous avez les deux structures, et la méthode du chapitre.",
        ];
      },
      tableau: () => {
        const x = associeQuiPrefereLaDette();
        const [cp1, d1] = x.avecLeCapital.lignes;
        const [cp2, , d2] = x.avecLaDette.lignes;
        return {
          titre: "Deux structures pour NOVA après N+1",
          colonnes: ["Avec le capital", "Avec la dette"],
          lignes: [
            { libelle: "Capitaux propres", valeurs: [eur(cp1!.montant), eur(cp2!.montant)] },
            { libelle: "Dettes à 5 %", valeurs: [eur(d1!.montant), eur(d1!.montant)] },
            { libelle: `Dette de plus à ${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)}`, valeurs: [eur(0), eur(d2!.montant)] },
            { libelle: "Bêta des capitaux propres", valeurs: [nb(BETA_DES_CAPITAUX_PROPRES), nb(DETTE_A_LA_PLACE_DU_CAPITAL.beta)] },
          ],
        };
      },
      repere: () => "À rendre : le coût de la dette de plus, celui des capitaux propres plus risqués, le CMPC de chaque structure, et votre réponse.",
    },
    {
      id: "les-couts",
      type: "montants",
      titre: "Les coûts de la structure endettée",
      notions: ["profitability_vs_return", "total_shareholder_return"],
      question: () => `Calculez, en pour cent, le coût après impôt de la dette de plus (l'impôt est de ${pct(TAUX_DE_L_IMPOT)}), puis le coût des capitaux propres par le MEDAF avec un bêta de ${nb(DETTE_A_LA_PLACE_DU_CAPITAL.beta)}.`,
      champs: () => {
        const x = associeQuiPrefereLaDette();
        return [
          { libelle: "Coût de la dette de plus après impôt, en %", attendu: enPct(x.coutDeLaDetteEnPlus), calcul: `${pct(DETTE_A_LA_PLACE_DU_CAPITAL.taux)} × (1 − ${pct(TAUX_DE_L_IMPOT)}) = ${pct(x.coutDeLaDetteEnPlus)}`, tolerance: 0.01 },
          { libelle: "Coût des capitaux propres, en %", attendu: enPct(x.coutDesCapitauxPropres), calcul: `${pct(TAUX_SANS_RISQUE)} + ${nb(DETTE_A_LA_PLACE_DU_CAPITAL.beta)} × ${pct(PRIME_DE_RISQUE_DU_MARCHE)} = ${pct(x.coutDesCapitauxPropres)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const x = associeQuiPrefereLaDette();
        return [`La dette de plus coûte ${pct(x.coutDeLaDetteEnPlus)} après impôt ; mais les actionnaires, plus exposés, exigent maintenant ${pct(x.coutDesCapitauxPropres)}, et non ${pct(x.avecLeCapital.lignes[0]!.cout)}.`];
      },
    },
    {
      id: "les-cmpc",
      type: "montants",
      titre: "Le CMPC des deux structures",
      notions: ["profitability_vs_return"],
      question: () => "Calculez le CMPC de chaque structure, en pour cent au centième : la somme, source par source, du poids × le coût après impôt.",
      champs: () => {
        const x = associeQuiPrefereLaDette();
        const calc = (k: typeof x.avecLeCapital) => `${k.lignes.map((l) => `${eur(l.montant)} × ${pct(l.cout)}`).join(" + ")}, ÷ ${eur(k.total)} = ${pct(k.cmpc)}`;
        return [
          { libelle: "CMPC avec l'augmentation de capital, en %", attendu: enPct(x.avecLeCapital.cmpc), calcul: calc(x.avecLeCapital) },
          { libelle: "CMPC avec la dette de plus, en %", attendu: enPct(x.avecLaDette.cmpc), calcul: calc(x.avecLaDette) },
        ];
      },
      explication: () => {
        const x = associeQuiPrefereLaDette();
        return [`Avec la dette, le CMPC monte à ${pct(x.avecLaDette.cmpc)}, contre ${pct(x.avecLeCapital.cmpc)} avec le capital. La dette de plus est bon marché, mais elle renchérit tout le capital qui reste.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'associé",
      notions: ["profitability_vs_return"],
      question: () => "Quelle réponse rendez-vous à l'associé ?",
      options: () => {
        const x = associeQuiPrefereLaDette();
        return [
          {
            texte: `L'augmentation de capital : un CMPC de ${pct(x.avecLeCapital.cmpc)}`,
            juste: true,
            retour: `Oui. La dette de plus coûterait ${pct(x.coutDeLaDetteEnPlus)}, mais ferait passer l'exigence des actionnaires à ${pct(x.coutDesCapitauxPropres)} : le capital de NOVA coûterait ${pct(x.avecLaDette.cmpc)} au lieu de ${pct(x.avecLeCapital.cmpc)}. NOVA a dépassé son endettement optimal : c'est la théorie du compromis.`,
          },
          {
            texte: `La dette : elle ne coûte que ${pct(x.coutDeLaDetteEnPlus)} après impôt, contre ${pct(x.avecLeCapital.lignes[0]!.cout)} pour les actionnaires`,
            juste: false,
            retour: "Comparer la dette aux actionnaires d'avant oublie que la dette les rend plus exigeants : c'est le coût de tout le capital qu'il faut comparer.",
          },
          {
            texte: "Peu importe : le CMPC ne dépend pas de la façon dont on se finance",
            juste: false,
            retour: `Ici, il en dépend : ${pct(x.avecLeCapital.cmpc)} d'un côté, ${pct(x.avecLaDette.cmpc)} de l'autre. L'impôt et le risque de défaillance font que la structure compte.`,
          },
        ];
      },
    },
  ],
};
