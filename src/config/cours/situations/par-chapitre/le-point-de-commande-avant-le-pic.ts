import type { Cas } from "../../cas";
import { LE_STOCK_DE_SECURITE, stockEtPointDeCommande } from "../../chapitres/le-stock-de-securite";
import { DELAI_DU_FOURNISSEUR, JOURS_DE_MONTAGE_PAR_TRIMESTRE, JOURS_DE_SECURITE, ficheDeNova, kitsDuTrimestre, retardCouvert } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE STOCK DE SÉCURITÉ ET LE POINT DE COMMANDE » : LE POINT DE COMMANDE
 * AVANT LE PIC (2de pro GATL, palier 1).
 *
 * Au 2e trimestre de N + 1, la ligne de NOVA tourne à plein (7 000 enceintes en 58 jours) : elle
 * consomme plus de kits par jour qu'au 1er. Le responsable du magasin demande s'il peut garder le
 * point de commande du 1er trimestre. L'élève recalcule le point de commande du pic, ce que l'ancien
 * laisserait à la livraison et le retard qu'il couvrirait encore, et répond. Les chiffres sont ceux
 * du chapitre (monde/production-et-logistique.ts) : seul change le trimestre.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const jours = (n: number) => `${qte(n)} ${n >= 2 ? "jours" : "jour"}`;

/** Le trimestre du pic : le 2e de N + 1, où la ligne est pleine. */
export const TRIMESTRE_DU_PIC = 2;

/** L'ancien point de commande, le nouveau, et ce que l'ancien laisse au pic. */
export function pointDeCommandeDuPic(c: Pick<Cas, "code">) {
  const base = stockEtPointDeCommande(c);
  const pic = kitsDuTrimestre(ficheDeNova(c), TRIMESTRE_DU_PIC);
  const aLaLivraison = base.pointDeCommande - pic.pendantLeDelai;
  return { base, pic, aLaLivraison, retardCouvert: retardCouvert(base.pointDeCommande, pic.parJour), retardVoulu: JOURS_DE_SECURITE };
}

export const LE_POINT_DE_COMMANDE_AVANT_LE_PIC: Situation = {
  code: "le-point-de-commande-avant-le-pic",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LE_STOCK_DE_SECURITE.code],
  commanditaire: "Le responsable du magasin",
  titre: "Le point de commande avant le pic",
  accroche: "Au printemps, la ligne tourne à plein et consomme plus de kits chaque jour. Le point de commande de l'hiver tient-il encore ?",
  objectifs: ["Recalculer un point de commande quand la consommation change", "Mesurer ce qu'un point de commande trop bas laisse à la livraison", "Répondre au responsable du magasin"],
  libre: false,
  entreprises: LE_STOCK_DE_SECURITE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable du magasin",
      texte: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [
          `« Cet hiver, je commandais mes kits dès que le stock descendait à ${qte(k.base.pointDeCommande)}. Au 2e trimestre, la ligne montera ${qte(k.pic.montees)} ${c.unites}. Puis-je garder le même point de commande ? »`,
          "Pas de cours cette fois : le délai du fournisseur et le stock de sécurité sont ceux du chapitre.",
        ];
      },
      tableau: (c) => {
        const k = pointDeCommandeDuPic(c);
        return {
          titre: `Les kits de ${c.entreprise}, l'hiver et le printemps de N + 1`,
          colonnes: ["1er trimestre", "2e trimestre"],
          lignes: [
            { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} à monter`, valeurs: [qte(k.base.montees), qte(k.pic.montees)] },
            { libelle: "Jours de montage", valeurs: [qte(JOURS_DE_MONTAGE_PAR_TRIMESTRE), qte(JOURS_DE_MONTAGE_PAR_TRIMESTRE)] },
            { libelle: "Délai du fournisseur (jours)", valeurs: [qte(DELAI_DU_FOURNISSEUR), qte(DELAI_DU_FOURNISSEUR)] },
            { libelle: "Stock de sécurité voulu (jours)", valeurs: [qte(JOURS_DE_SECURITE), qte(JOURS_DE_SECURITE)] },
            { libelle: "Point de commande (kits)", valeurs: [qte(k.base.pointDeCommande), "?"] },
          ],
        };
      },
      repere: () => "À rendre : le point de commande du printemps, ce que l'ancien laisserait, et votre réponse.",
    },
    {
      id: "le-point-du-pic",
      type: "montants",
      titre: "Le point de commande du printemps",
      notions: ["stock"],
      question: () => "Calculez la consommation par jour au 2e trimestre (au kit supérieur), puis le point de commande du printemps.",
      champs: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [
          { libelle: "Consommation par jour au 2e trimestre", attendu: k.pic.parJour, calcul: `${qte(k.pic.montees)} ÷ ${qte(JOURS_DE_MONTAGE_PAR_TRIMESTRE)}, au kit supérieur : ${qte(k.pic.parJour)}`, tolerance: 0 },
          { libelle: "Point de commande du printemps", attendu: k.pic.pointDeCommande, calcul: `${qte(k.pic.parJour)} × (${qte(DELAI_DU_FOURNISSEUR)} + ${qte(JOURS_DE_SECURITE)}) = ${qte(k.pic.pointDeCommande)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [`La ligne consomme ${qte(k.pic.parJour - k.base.parJour)} kits de plus chaque jour : le point de commande monte de ${qte(k.pic.pointDeCommande - k.base.pointDeCommande)} kits.`];
      },
    },
    {
      id: "l-ancien-point",
      type: "montants",
      titre: "Avec l'ancien point de commande",
      notions: ["stock"],
      question: (c) => `Le magasinier commande toujours à ${qte(pointDeCommandeDuPic(c).base.pointDeCommande)} kits. Calculez le stock qui resterait à la livraison, sans retard, puis le plus grand retard qu'il couvrirait (en jours entiers).`,
      champs: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [
          { libelle: "Stock à la livraison, sans retard", attendu: k.aLaLivraison, calcul: `${qte(k.base.pointDeCommande)} − ${qte(k.pic.parJour)} × ${qte(DELAI_DU_FOURNISSEUR)} = ${qte(k.aLaLivraison)}`, tolerance: 0 },
          { libelle: "Retard couvert (jours)", attendu: k.retardCouvert, calcul: `${qte(k.aLaLivraison)} ÷ ${qte(k.pic.parJour)}, en jours entiers : ${qte(k.retardCouvert)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [`Avec l'ancien point, la sécurité ne couvrirait plus que ${jours(k.retardCouvert)} de retard, au lieu de ${jours(k.retardVoulu)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable du magasin",
      question: () => "Que répondez-vous au responsable du magasin ?",
      options: (c) => {
        const k = pointDeCommandeDuPic(c);
        return [
          {
            texte: `Commander à ${qte(k.pic.pointDeCommande)} kits`,
            juste: true,
            retour: `Oui : la ligne consomme ${qte(k.pic.parJour)} kits par jour ; ${qte(k.pic.pointDeCommande)} couvrent le délai et ${jours(k.retardVoulu)} de sécurité.`,
          },
          { texte: "Garder l'ancien point de commande", juste: false, retour: `Non : il ne couvrirait plus que ${jours(k.retardCouvert)} de retard, au lieu de ${jours(k.retardVoulu)}.` },
          { texte: "Commander plus de kits à chaque fois, sans changer le point", juste: false, retour: "Non : une plus grosse commande arrive au même moment ; c'est le moment de commander qui décide si la ligne tient pendant le délai." },
        ];
      },
    },
  ],
};
