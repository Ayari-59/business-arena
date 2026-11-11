import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { arrondi, arrondi2, pct as pourcent } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DU_POINT_DE_VENTE, margesDuRayon } from "../../chapitres/taux-de-marque";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « S'ALIGNER SUR LE CONCURRENT : GARDER LA MARQUE OU LA MARGE » (BTS MCO,
 * palier 2).
 *
 * L'enseigne de la rue solde son pull col rond à `PRIX_SOLDE_DU_CONCURRENT` TTC. La responsable veut
 * s'aligner sans perdre son taux de marque, et demande quel prix d'achat négocier. L'élève refait le
 * calcul du chapitre (`margesDuRayon` : le taux de marque du col rond, la TVA) : le prix hors taxes
 * aligné, le prix d'achat qui garde le taux de marque, la marge d'un article.
 */

/** LE PRIX SOLDÉ DU CONCURRENT (hypothèse du cas) : une étiquette ronde, TTC. */
export const PRIX_SOLDE_DU_CONCURRENT = 57;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
/** Un taux (0,5455) écrit en pourcentage, à deux décimales. */
const pct = (t: number) => pourcent(arrondi2(t * 100));
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/**
 * LE TAUX DE MARQUE AFFICHÉ À DEUX DÉCIMALES, ET LE CALCUL QUI PART DE LUI (audit du 10 novembre 2026,
 * contenu P1-1). Le taux, 6 ÷ 11, s'affichait 54,5 % : l'élève qui calculait 47,50 € × (1 − 54,5 %)
 * trouvait 21,61 € et la correction attendait 21,59 €. Il s'écrit 54,55 %, et le prix d'achat se
 * calcule sur ce taux, comme sur la copie.
 */
export function concurrentSolde() {
  const m = margesDuRayon({ code: "boutique" });
  const tauxDeMarque = arrondi(m.tauxDeMarqueExact, 4);
  const prixHt = auCentime(PRIX_SOLDE_DU_CONCURRENT / (1 + m.r.tauxTva));
  const prixDAchat = auCentime(prixHt * (1 - tauxDeMarque));
  const marge = auCentime(prixHt - prixDAchat);
  return { m, tauxDeMarque, prixHt, prixDAchat, marge, baisseDuPrixDAchat: auCentime(m.r.coutDAchat - prixDAchat) };
}

export const LE_CONCURRENT_SOLDE: Situation = {
  code: "le-concurrent-solde",
  parcours: "mco",
  palier: 2,
  blocs: [],
  reprend: ["s-aligner-sur-le-concurrent"],
  commanditaire: "La responsable de la boutique",
  titre: "Le concurrent solde",
  accroche: "L'enseigne de la rue solde le pull col rond : le prix aligné, et le prix d'achat qui garderait le taux de marque de la boutique.",
  objectifs: ["Passer d'une étiquette TTC au prix de vente hors taxes", "Retrouver le prix d'achat qui garde un taux de marque", "Dire ce que la négociation doit obtenir"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: "ce cas reprend le pull col rond de MAILLE & CO, celui du chapitre." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la responsable",
      texte: () => {
        const k = concurrentSolde();
        return [
          `« La boutique de la rue solde son col rond à ${eur(PRIX_SOLDE_DU_CONCURRENT)}. Je veux m'aligner sans perdre mon taux de marque de ${pct(k.tauxDeMarque)}. Quel prix dois-je obtenir du façonnier, qui me le vend ${eur(k.m.r.coutDAchat)} hors taxes ? » La responsable`,
          `Pas de cours cette fois : l'étiquette est toutes taxes comprises, à ${pct(k.m.r.tauxTva)} de TVA, et le taux de marque se calcule sur le prix de vente hors taxes.`,
        ];
      },
      repere: () => "À rendre : le prix de vente hors taxes aligné, le prix d'achat qui garde le taux de marque, la marge d'un article, et votre réponse.",
    },
    {
      id: "les-chiffres",
      type: "montants",
      titre: "Le prix aligné, et le prix d'achat qu'il demande",
      notions: ["margin_rates", "markup_coefficient"],
      question: () => "Calculez le prix de vente hors taxes aligné, le prix d'achat qui garde le taux de marque, puis la marge commerciale d'un article à ce prix d'achat, au centime.",
      champs: () => {
        const k = concurrentSolde();
        return [
          { libelle: "Prix de vente hors taxes", attendu: k.prixHt, calcul: `${eur(PRIX_SOLDE_DU_CONCURRENT)} ÷ (1 + ${pct(k.m.r.tauxTva)}) = ${eur(k.prixHt)}` },
          { libelle: "Prix d'achat qui garde le taux de marque", attendu: k.prixDAchat, calcul: `${eur(k.prixHt)} × (1 − ${pct(k.tauxDeMarque)}) = ${eur(k.prixDAchat)}`, tolerance: 0.01 },
          { libelle: "Marge commerciale d'un article", attendu: k.marge, calcul: `${eur(k.prixHt)} − ${eur(k.prixDAchat)} = ${eur(k.marge)}`, tolerance: 0.01 },
        ];
      },
      explication: () => {
        const k = concurrentSolde();
        return [`Pour garder ${pct(k.tauxDeMarque)} de marque à ${eur(k.prixHt)} hors taxes, il faut acheter ${eur(k.prixDAchat)}, ${eur(k.baisseDuPrixDAchat)} de moins qu'aujourd'hui. Le taux est gardé, la marge d'un article, elle, baisse.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Que répondez-vous à la responsable ?",
      options: () => {
        const k = concurrentSolde();
        return [
          {
            texte: `Obtenir ${eur(k.prixDAchat)} au plus, et la marge baisse quand même`,
            juste: true,
            retour: `Oui : à ${eur(k.prixDAchat)}, le taux de marque tient, mais chaque article rapporte ${eur(k.marge)} au lieu de ${eur(k.m.a.margeCommerciale)}. Il faudra en vendre plus pour garder la marge du mois.`,
          },
          {
            texte: `Obtenir une baisse égale à celle du prix TTC, de ${eur(auCentime(k.m.r.prixTtc - PRIX_SOLDE_DU_CONCURRENT))}, suffit à garder le taux de marque`,
            juste: false,
            retour: "Non : le prix se compare hors taxes, et une baisse égale en euros fait baisser le taux de marque. Le prix d'achat doit baisser dans la même proportion que le prix de vente hors taxes.",
          },
          {
            texte: "Rien à négocier : le coefficient multiplicateur ne change pas quand le prix de vente baisse",
            juste: false,
            retour: "Non : à prix d'achat inchangé, un prix de vente plus bas fait baisser le coefficient et le taux de marque.",
          },
        ];
      },
    },
  ],
};
