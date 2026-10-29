import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { CE_QUE_COUTE_UNE_LIVRAISON } from "../../chapitres/ce-que-coute-une-livraison";
import { GAZOLE_APRES_LA_HAUSSE, PORTEUR, ROUTE_DE_CAMPUSTECH, gazoleQuiAnnuleLaTournee, tourneeDuMois } from "../../monde/production-et-logistique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE COÛTE UNE LIVRAISON » : LE GAZOLE QUI AUGMENTE (2de pro GATL,
 * palier 1).
 *
 * Le gazole et les péages passent de 0,45 € à 0,60 € le kilomètre. Le gérant de NOVA demande s'il
 * faut abandonner la tournée de CampusTech pour la messagerie. L'élève chiffre la route plus chère,
 * la nouvelle tournée, ce qui la sépare encore de la messagerie, et le prix du kilomètre où elle cesse
 * de l'emporter. Les chiffres sont ceux du chapitre (monde/production-et-logistique.ts) ; la hausse
 * est l'hypothèse du cas (GAZOLE_APRES_LA_HAUSSE).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Le cas : la tournée avant et après la hausse, face à la messagerie. */
export function gazoleQuiAugmente() {
  const avant = tourneeDuMois();
  const apres = tourneeDuMois(PORTEUR, GAZOLE_APRES_LA_HAUSSE);
  return { avant, apres, hausse: Math.round((apres.cout.total - avant.cout.total) * 100) / 100, seuil: gazoleQuiAnnuleLaTournee() };
}

export const LE_GAZOLE_QUI_AUGMENTE: Situation = {
  code: "le-gazole-qui-augmente",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [CE_QUE_COUTE_UNE_LIVRAISON.code],
  commanditaire: "Le gérant",
  titre: "Le gazole qui augmente",
  accroche: "Le gazole monte. Faut-il abandonner la tournée pour la messagerie ? Ce que la hausse ajoute, et jusqu'où la tournée tient.",
  objectifs: ["Recalculer le coût d'une tournée quand un coût au kilomètre change", "Comparer la tournée et la messagerie après la hausse", "Répondre au gérant"],
  libre: false,
  entreprises: CE_QUE_COUTE_UNE_LIVRAISON.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: () => {
        const k = gazoleQuiAugmente();
        return [
          `« Le gazole et les péages nous coûtent maintenant ${eur(GAZOLE_APRES_LA_HAUSSE)} le kilomètre, au lieu de ${eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm)}. La tournée de CampusTech devient chère : passons à la messagerie, à ${eur(k.avant.messagerie / k.avant.palettes)} la palette. Qu'en pensez-vous ? »`,
          "Pas de cours cette fois : la tournée est celle du chapitre.",
        ];
      },
      tableau: () => {
        const k = gazoleQuiAugmente();
        return {
          titre: "La tournée du mois chez CampusTech",
          colonnes: ["Avant la hausse", "Après la hausse"],
          lignes: [
            { libelle: "Location et chauffeur, pour la journée", valeurs: [eur(k.avant.cout.journee), eur(k.apres.cout.journee)] },
            { libelle: "Kilomètres, aller et retour", valeurs: [qte(ROUTE_DE_CAMPUSTECH.km), qte(ROUTE_DE_CAMPUSTECH.km)] },
            { libelle: "Gazole et péages, par kilomètre", valeurs: [eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm), eur(GAZOLE_APRES_LA_HAUSSE)] },
            { libelle: "Palettes du mois", valeurs: [qte(k.avant.palettes), qte(k.apres.palettes)] },
            { libelle: "Le mois en messagerie", valeurs: [eur(k.avant.messagerie), eur(k.apres.messagerie)] },
          ],
        };
      },
      repere: () => "À rendre : la tournée après la hausse, ce qui la sépare de la messagerie, et votre réponse.",
    },
    {
      id: "la-route-plus-chere",
      type: "montants",
      titre: "La route plus chère",
      notions: ["variable_costs"],
      question: () => "Calculez la route après la hausse, la tournée après la hausse, puis ce que la tournée coûte encore de moins que la messagerie.",
      champs: () => {
        const k = gazoleQuiAugmente();
        return [
          { libelle: "La route après la hausse", attendu: k.apres.cout.route, calcul: `${qte(ROUTE_DE_CAMPUSTECH.km)} × ${eur(GAZOLE_APRES_LA_HAUSSE)} = ${eur(k.apres.cout.route)}` },
          { libelle: "La tournée après la hausse", attendu: k.apres.cout.total, calcul: `${eur(k.apres.cout.journee)} + ${eur(k.apres.cout.route)} = ${eur(k.apres.cout.total)}` },
          { libelle: "Économie face à la messagerie", attendu: k.apres.economie, calcul: `${eur(k.apres.messagerie)} − ${eur(k.apres.cout.total)} = ${eur(k.apres.economie)}` },
        ];
      },
      explication: () => {
        const k = gazoleQuiAugmente();
        return [`La hausse ajoute ${eur(k.hausse)} à la tournée : elle ne touche que la route, pas la journée du camion et du chauffeur.`];
      },
    },
    {
      id: "jusqu-ou",
      type: "montants",
      titre: "Jusqu'où la tournée tient",
      notions: ["variable_costs", "make_or_buy"],
      question: () => "Calculez le prix du kilomètre où la tournée coûterait autant que la messagerie ((messagerie − journée) ÷ kilomètres, au centime inférieur).",
      champs: () => {
        const k = gazoleQuiAugmente();
        return [{ libelle: "Prix du kilomètre où la tournée cesse de l'emporter", attendu: k.seuil, calcul: `(${eur(k.avant.messagerie)} − ${eur(k.avant.cout.journee)}) ÷ ${qte(ROUTE_DE_CAMPUSTECH.km)} = ${eur(k.seuil)}`, tolerance: 0.01 }];
      },
      explication: () => {
        const k = gazoleQuiAugmente();
        return [`Le gazole et les péages devraient dépasser ${eur(k.seuil)} le kilomètre pour que la messagerie l'emporte.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Que répondez-vous au gérant ?",
      options: () => {
        const k = gazoleQuiAugmente();
        return [
          { texte: "Garder la tournée", juste: k.apres.economie > 0, retour: `Oui : même après la hausse, elle coûte ${eur(k.apres.cout.total)}, ${eur(k.apres.economie)} de moins que la messagerie.` },
          { texte: "Passer à la messagerie, dès ce mois", juste: k.apres.economie <= 0, retour: `Non : la messagerie coûterait ${eur(k.apres.messagerie)}, plus que la tournée (${eur(k.apres.cout.total)}).` },
          { texte: "Passer à la messagerie : le gazole pèse sur toute la tournée", juste: false, retour: `Non : le gazole ne pèse que sur la route ; la journée du camion et du chauffeur, ${eur(k.apres.cout.journee)}, ne bouge pas.` },
        ];
      },
    },
  ],
};
