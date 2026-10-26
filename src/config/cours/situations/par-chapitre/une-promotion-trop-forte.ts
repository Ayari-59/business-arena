import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { prixPsychologique } from "../../chapitres/prix-psychologique";
import { SEGMENTATIONS } from "../../chapitres/segmenter-et-cibler";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE PRIX PSYCHOLOGIQUE » : UNE PROMOTION TROP FORTE ?
 * (Bac STMG, mercatique, palier 1).
 *
 * La direction prépare une promotion choc pour sa principale clientèle. Avant de lancer
 * l'affiche, elle demande si le prix promotionnel reste crédible pour cette clientèle, ou
 * s'il tombe sous le prix où elle se met à douter de la qualité, et ce que la promotion
 * coûte sur chaque vente. L'élève refait seul les calculs du chapitre : le prix et son
 * écart au prix jugé normal, la baisse la plus forte que la clientèle accepte, l'écart au
 * prix de méfiance, puis la marge d'une unité avant et après.
 *
 * Le cas est neuf par sa question : le chapitre regarde le seuil qu'un prix ne doit pas
 * franchir en montant, le cas regarde le prix sous lequel il ne doit pas descendre. La
 * clientèle et ses repères sont ceux que le chapitre étudie (`prixPsychologique`) ; le coût
 * variable d'une unité est celui du mois du cas (`cas.ts`).
 */

/**
 * La remise de la promotion : 30 %, l'ordre de grandeur d'une promotion choc, celle des
 * soldes ou d'une vente privée. Assez forte pour approcher, chez certaines clientèles, le
 * prix sous lequel elles se méfient.
 */
export const REMISE_PROMOTIONNELLE = 0.3;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function promotionTropForte(c: Cas) {
  const p = prixPsychologique(c);
  const k = p.etudie;
  const prix = p.prix;
  const coutVariable = c.gestion.coutVariableUnitaire;
  const prixPromo = auCentime(prix * (1 - REMISE_PROMOTIONNELLE));
  const margeAvant = auCentime(prix - coutVariable);
  const margeApres = auCentime(prixPromo - coutVariable);
  return {
    clientele: k.nom,
    normal: k.normal,
    tropBas: k.tropBas,
    prix,
    coutVariable,
    prixPromo,
    ecartAuNormal: auDixieme((prixPromo / k.normal - 1) * 100),
    baisseMaximale: auDixieme((1 - k.tropBas / prix) * 100),
    ecartALaMefiance: auCentime(prixPromo - k.tropBas),
    credible: prixPromo >= k.tropBas,
    margeAvant,
    margeApres,
    baisseDeLaMarge: auDixieme((1 - margeApres / margeAvant) * 100),
  };
}

export const UNE_PROMOTION_TROP_FORTE: Situation = {
  code: "une-promotion-trop-forte",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["prix-psychologique"],
  commanditaire: "La direction",
  titre: "Une promotion trop forte ?",
  accroche:
    "La direction prépare une promotion de 30 %. Le prix reste-t-il crédible pour la clientèle, ou tombe-t-il là où elle doute de la qualité ? Et que coûte la promotion sur chaque vente ?",
  objectifs: [
    "Calculer un prix promotionnel et son écart au prix jugé normal",
    "Calculer la baisse de prix la plus forte qu'une clientèle accepte sans se méfier",
    "Mesurer ce qu'une promotion retire à la marge d'une unité",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: {
    codes: SEGMENTATIONS,
    pourquoi: "ce cas lit les repères de prix des clientèles d'une entreprise à une seule offre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = promotionTropForte(c);
        return [
          `« Pour relancer les ventes, je pense à une promotion choc : ${pct(REMISE_PROMOTIONNELLE * 100)} de remise, pour attirer la clientèle « ${r.clientele} ». Avant de lancer l'affiche, je veux savoir si le prix reste crédible pour elle, ou si elle va douter de la qualité, et ce que la promotion nous coûte sur chaque vente. »`,
          "Pas de cours cette fois : vous avez les repères de prix de cette clientèle, et les calculs sont ceux du chapitre. À vous de les enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = promotionTropForte(c);
        return {
          titre: `Le prix et les repères de la clientèle · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: `Prix pratiqué d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.coutVariable)] },
            { libelle: `Prix jugé normal par la clientèle « ${r.clientele} »`, valeurs: [eur(r.normal)] },
            { libelle: "Prix sous lequel elle doute de la qualité", valeurs: [eur(r.tropBas)] },
            { libelle: "Remise envisagée", valeurs: [pct(REMISE_PROMOTIONNELLE * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le prix promotionnel et son écart au prix jugé normal, la baisse la plus forte que la clientèle accepte, la marge d'une unité avant et après, et votre réponse.",
    },
    {
      id: "prix-promotionnel",
      type: "montants",
      titre: "Le prix promotionnel",
      notions: ["psych_price"],
      question: () =>
        "Calculez le prix promotionnel, puis son écart au prix que la clientèle juge normal, en pourcentage au dixième (négatif s'il est en dessous).",
      champs: (c) => {
        const r = promotionTropForte(c);
        return [
          { libelle: "Prix promotionnel", attendu: r.prixPromo, calcul: `${eur(r.prix)} × (1 − ${pct(REMISE_PROMOTIONNELLE * 100)}) = ${eur(r.prixPromo)}` },
          { libelle: "Écart au prix jugé normal (%)", attendu: r.ecartAuNormal, tolerance: 0.1, calcul: `(${eur(r.prixPromo)} ÷ ${eur(r.normal)} − 1) × 100 = ${pct(r.ecartAuNormal)}` },
        ];
      },
      explication: (c) => {
        const r = promotionTropForte(c);
        return [
          r.ecartAuNormal < 0
            ? `À ${eur(r.prixPromo)}, ${c.entreprise} vendrait ${pct(Math.abs(r.ecartAuNormal))} sous le prix que la clientèle « ${r.clientele} » juge normal. Une bonne affaire, tant que le prix ne paraît pas trop beau pour être sérieux.`
            : `Même remisé, le prix reste ${pct(r.ecartAuNormal)} au-dessus de ce que la clientèle « ${r.clientele} » juge normal : la promotion la rapproche de son prix, sans le lui offrir.`,
        ];
      },
    },
    {
      id: "jusqu-ou-baisser",
      type: "montants",
      titre: "Jusqu'où baisser sans éveiller la méfiance",
      notions: ["psych_price"],
      question: () =>
        "De combien le prix pratiqué peut-il baisser, au plus, avant d'atteindre le prix sous lequel la clientèle doute de la qualité ? Donnez cette baisse en pourcentage, au dixième. Calculez ensuite ce qui sépare le prix promotionnel de ce prix de méfiance, en euros (négatif s'il est en dessous).",
      champs: (c) => {
        const r = promotionTropForte(c);
        return [
          { libelle: "Baisse la plus forte acceptée (%)", attendu: r.baisseMaximale, tolerance: 0.1, calcul: `(1 − ${eur(r.tropBas)} ÷ ${eur(r.prix)}) × 100 = ${pct(r.baisseMaximale)}` },
          { libelle: "Prix promotionnel moins prix de méfiance (€)", attendu: r.ecartALaMefiance, calcul: `${eur(r.prixPromo)} − ${eur(r.tropBas)} = ${eur(r.ecartALaMefiance)}` },
        ];
      },
      explication: (c) => {
        const r = promotionTropForte(c);
        return [
          r.credible
            ? `La clientèle accepte jusqu'à ${pct(r.baisseMaximale)} de baisse : la remise de ${pct(REMISE_PROMOTIONNELLE * 100)} reste en deçà, et le prix promotionnel garde ${eur(r.ecartALaMefiance)} d'avance sur le prix de méfiance. La promotion paraîtra une bonne affaire, pas un produit au rabais.`
            : `La clientèle n'accepte que ${pct(r.baisseMaximale)} de baisse : avec ${pct(REMISE_PROMOTIONNELLE * 100)}, le prix passe ${eur(Math.abs(r.ecartALaMefiance))} sous le prix de méfiance. Trop bas, un prix fait douter de la qualité, et il peut faire fuir les clients qu'il devait attirer.`,
        ];
      },
    },
    {
      id: "marge",
      type: "montants",
      titre: "Ce que la promotion coûte sur chaque vente",
      notions: ["psych_price", "contribution_margin"],
      question: () =>
        "Calculez la marge d'une unité (prix moins coût variable) au prix pratiqué, puis au prix promotionnel, et la baisse de la marge d'une unité, en pourcentage au dixième.",
      champs: (c) => {
        const r = promotionTropForte(c);
        return [
          { libelle: "Marge d'une unité au prix pratiqué", attendu: r.margeAvant, calcul: `${eur(r.prix)} − ${eur(r.coutVariable)} = ${eur(r.margeAvant)}` },
          { libelle: "Marge d'une unité au prix promotionnel", attendu: r.margeApres, calcul: `${eur(r.prixPromo)} − ${eur(r.coutVariable)} = ${eur(r.margeApres)}` },
          { libelle: "Baisse de la marge d'une unité (%)", attendu: r.baisseDeLaMarge, tolerance: 0.1, calcul: `(1 − ${eur(r.margeApres)} ÷ ${eur(r.margeAvant)}) × 100 = ${pct(r.baisseDeLaMarge)}` },
        ];
      },
      explication: (c) => {
        const r = promotionTropForte(c);
        return [
          `Le prix baisse de ${pct(REMISE_PROMOTIONNELLE * 100)}, mais la marge d'une unité baisse de ${pct(r.baisseDeLaMarge)} : le coût variable, ${eur(r.coutVariable)}, ne baisse pas avec le prix. Toute la remise se prend sur la marge.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = promotionTropForte(c);
        return [
          r.credible
            ? {
                texte: `Crédible à ${eur(r.prixPromo)}, mais ${pct(r.baisseDeLaMarge)} de marge en moins par vente`,
                juste: true,
                retour: `Oui : ${eur(r.prixPromo)} reste au-dessus des ${eur(r.tropBas)} sous lesquels la clientèle « ${r.clientele} » se méfie. Mais chaque vente ne laisse plus que ${eur(r.margeApres)} de marge au lieu de ${eur(r.margeAvant)} : la promotion ne paie que si elle fait beaucoup vendre.`,
              }
            : {
                texte: `À ${eur(r.prixPromo)}, la clientèle douterait de la qualité`,
                juste: true,
                retour: `Oui : ${eur(r.prixPromo)} passe sous les ${eur(r.tropBas)} sous lesquels la clientèle « ${r.clientele} » se méfie. Une remise d'au plus ${pct(r.baisseMaximale)} garderait le prix crédible.`,
              },
          {
            texte: "Aucun risque : plus le prix baisse, plus les clients achètent",
            juste: false,
            retour: `Non : sous ${eur(r.tropBas)}, la clientèle « ${r.clientele} » doute de la qualité. Un prix a un plancher psychologique, comme il a des seuils qu'il ne faut pas franchir en montant.`,
          },
          {
            texte: `La marge d'une unité baisse de ${pct(REMISE_PROMOTIONNELLE * 100)}, comme le prix`,
            juste: false,
            retour: `Non : le coût variable ne baisse pas avec le prix. La marge passe de ${eur(r.margeAvant)} à ${eur(r.margeApres)} : ${pct(r.baisseDeLaMarge)} de moins, pas ${pct(REMISE_PROMOTIONNELLE * 100)}.`,
          },
        ];
      },
    },
  ],
};
