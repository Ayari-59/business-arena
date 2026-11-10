import { eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DU_SEUIL_DU_LYCEE, seuilDeJanvier } from "../../chapitres/assez-vendre-pour-ne-rien-perdre";
import { CHARGES_FIXES_DU_MOIS } from "../../monde/nova-gestion";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ASSEZ VENDRE POUR NE RIEN PERDRE » : LE LOYER AUGMENTE (Bac STMG, SGN de
 * première, palier 1).
 *
 * Le bailleur annonce une hausse du loyer de 1 300 € par mois (HAUSSE_DU_LOYER, hypothèse du cas). Les
 * ventes de janvier, le prix et le coût d'une enceinte ne bougent pas. Les calculs sont ceux du chapitre :
 * le nouveau seuil en enceintes et le nouveau point mort.
 */

const qte = nombreAuCentieme;

export const HAUSSE_DU_LOYER = 1_300;

export function leLoyerAugmente() {
  const avant = seuilDeJanvier();
  const apres = seuilDeJanvier({ chargesFixes: avant.chargesFixes + HAUSSE_DU_LOYER });
  return { avant, apres };
}

export const LE_LOYER_AUGMENTE: Situation = {
  code: "le-loyer-augmente",
  parcours: "stmg-management",
  palier: 1,
  blocs: [],
  reprend: ["assez-vendre-pour-ne-rien-perdre"],
  commanditaire: "Le président",
  titre: "Le loyer augmente",
  accroche: "Le bailleur augmente le loyer du local. Combien d'enceintes faudra-t-il vendre chaque mois, et quel jour le mois commencera-t-il à gagner de l'argent ?",
  objectifs: ["Recalculer un seuil quand les charges fixes montent", "Dater le nouveau point mort", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL_DU_LYCEE,
    pourquoi: "le cas reprend le mois de janvier de NOVA du chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La lettre du bailleur",
      texte: () => [
        `« Le bailleur passe le loyer de ${eur(CHARGES_FIXES_DU_MOIS.loyer)} à ${eur(CHARGES_FIXES_DU_MOIS.loyer + HAUSSE_DU_LOYER)} par mois. Si nous vendons autant qu'en janvier, que devient notre seuil, et quand gagnerons-nous de l'argent dans le mois ? » Le président`,
        "Pas de cours cette fois : les calculs sont ceux du chapitre.",
      ],
      repere: () => "À rendre : les nouvelles charges fixes, le nouveau seuil en enceintes, le jour du nouveau point mort, et votre réponse.",
    },
    {
      id: "les-calculs",
      type: "montants",
      titre: "Le nouveau seuil",
      notions: ["breakeven", "dead_point"],
      question: () => "Calculez les nouvelles charges fixes du mois, le nouveau seuil en enceintes (à l'unité supérieure), et le jour du nouveau point mort.",
      champs: () => {
        const { apres } = leLoyerAugmente();
        return [
          { libelle: "Charges fixes du mois", attendu: apres.chargesFixes, calcul: `${eur(apres.chargesFixes - HAUSSE_DU_LOYER)} + ${eur(HAUSSE_DU_LOYER)} = ${eur(apres.chargesFixes)}` },
          { libelle: "Seuil en enceintes", nature: "quantite", attendu: apres.seuilQuantite!, calcul: `${eur(apres.chargesFixes)} ÷ ${eur(apres.margeUnitaire)} = ${qte(apres.seuilExact!)}, arrondi à l'unité supérieure : ${qte(apres.seuilQuantite!)} (une enceinte de moins laisserait une perte)` },
          { libelle: "Jour du point mort", nature: "quantite", attendu: apres.pointMort!, calcul: `${eur(apres.seuilValeur!)} ÷ ${eur(apres.chiffreDAffaires)} × ${qte(apres.jours)} jours = ${qte(apres.pointMortExact!)}, arrondi au jour supérieur : le ${qte(apres.pointMort!)}` },
        ];
      },
      explication: () => {
        const { avant, apres } = leLoyerAugmente();
        return [`Le seuil passe de ${qte(avant.seuilQuantite!)} à ${qte(apres.seuilQuantite!)} enceintes ; le point mort, du ${qte(avant.pointMort!)} au ${qte(apres.pointMort!)} janvier.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const { avant, apres } = leLoyerAugmente();
        const gagne = apres.resultat > 0;
        return [
          {
            texte: `Le mois reste gagnant, mais de ${eur(apres.resultat)} seulement`,
            juste: gagne,
            retour: gagne
              ? `Oui : ${qte(avant.quantite)} enceintes passent encore le seuil de ${qte(apres.seuilQuantite!)}, mais le point mort recule au ${qte(apres.pointMort!)}. La marge de sécurité fond à ${eur(apres.margeDeSecurite!)} : la moindre baisse des ventes ferait perdre le mois.`
              : "Non : le mois perdrait de l'argent.",
          },
          {
            texte: "Le mois perdra de l'argent : la hausse du loyer dépasse le bénéfice de janvier",
            juste: !gagne,
            retour: gagne ? `Non : janvier gagnait ${eur(avant.resultat)}, la hausse est de ${eur(HAUSSE_DU_LOYER)}.` : "Oui : le mois perd.",
          },
          {
            texte: "Rien ne change : le loyer ne dépend pas des ventes, il ne touche pas au seuil",
            juste: false,
            retour: "Non : c'est justement parce qu'il est fixe que le loyer pèse sur le seuil. Plus de charges fixes, plus d'enceintes à vendre pour les payer.",
          },
        ];
      },
    },
  ],
};
